import OrderedMap "mo:base/OrderedMap";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Char "mo:base/Char";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

actor Ribbit {
  let storage = Storage.new();
  include MixinStorage(storage);

  // Initialize the access control system
  let accessControlState = AccessControl.initState();

  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

  var ponds : OrderedMap.Map<Text, Pond> = textMap.empty();
  var posts : OrderedMap.Map<Text, Post> = textMap.empty();
  var ribbits : OrderedMap.Map<Text, Ribbit> = textMap.empty();
  var userProfiles = principalMap.empty<UserProfile>();
  var usernameRegistry : OrderedMap.Map<Text, Bool> = textMap.empty();
  var usernameChangeHistory : OrderedMap.Map<Text, Int> = textMap.empty();
  var usernameOwnership : OrderedMap.Map<Text, Principal> = textMap.empty();
  var principalToUsername : OrderedMap.Map<Principal, Text> = principalMap.empty();
  var tagUsageCount : OrderedMap.Map<Text, Nat> = textMap.empty();
  var tagMergeRegistry : OrderedMap.Map<Text, Text> = textMap.empty();

  // Persistent tracking of initialized users to maintain roles across upgrades
  var initializedUsers : [Principal] = [];
  var adminPrincipal : ?Principal = null;

  // Username-based avatar storage
  var usernameAvatars : OrderedMap.Map<Text, Storage.ExternalBlob> = textMap.empty();

  // Likes system
  var postLikes : OrderedMap.Map<Text, OrderedMap.Map<Principal, Bool>> = textMap.empty();
  var ribbitLikes : OrderedMap.Map<Text, OrderedMap.Map<Principal, Bool>> = textMap.empty();

  // New activity tracking system for Recent Activity
  var postActivity : OrderedMap.Map<Text, Activity> = textMap.empty();
  var ribbitActivity : OrderedMap.Map<Text, Activity> = textMap.empty();
  var likeActivity : OrderedMap.Map<Text, Activity> = textMap.empty();

  // Tag stats tracking
  var tagStats : OrderedMap.Map<Text, TagStats> = textMap.empty();

  // Activity tracking data type
  type Activity = {
    id : Text;
    type_ : ActivityType;
    targetId : Text;
    timestamp : Int;
    username : Text;
    pond : Text;
  };

  type ActivityType = {
    #post;
    #ribbit;
    #like;
    #viewRibbit;
  };

  type Pond = {
    name : Text;
    description : Text;
    image : ?Storage.ExternalBlob;
    profileImage : ?Storage.ExternalBlob;
    bannerImage : ?Storage.ExternalBlob;
    createdAt : Int;
    memberCount : Nat;
    members : [Principal];
    moderators : [Principal];
    admin : Principal;
    rules : [Text];
    visibility : Visibility;
    associatedTags : [Text];
    lilyCount : Nat;
  };

  type Visibility = {
    #publicVisibility;
    #privateVisibility;
  };

  type Post = {
    id : Text;
    title : Text;
    content : Text;
    image : ?Storage.ExternalBlob;
    link : ?Text;
    pond : Text;
    username : Text;
    timestamp : Int;
    viewCount : Nat;
    tag : ?Text;
  };

  type Ribbit = {
    id : Text;
    postId : Text;
    parentId : ?Text;
    content : Text;
    username : Text;
    timestamp : Int;
  };

  public type UserProfile = {
    name : Text;
    joinedPonds : [Text];
    avatar : ?Storage.ExternalBlob;
  };

  // View increment result type
  public type ViewIncrementResult = {
    #success; // View count incremented successfully
    #notFound; // Lily (post) not found
    #error; // Some error occurred
  };

  // Updated tag stats type with IDs
  type TagStats = {
    id : Text;
    postsTotal : Nat;
    repliesTotal : Nat;
    firstUsedAt : Int;
    lastActivityAt : Int;
  };

  // Function to increment view count for a Lily (post)
  // Requires user permission to prevent abuse
  public shared ({ caller }) func incrementLilyViewCount(postId : Text) : async ViewIncrementResult {
    // Require authenticated users only - no anonymous view count increments to prevent abuse
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can increment view counts");
    };

    switch (textMap.get(posts, postId)) {
      case (null) { #notFound };
      case (?post) {
        let updatedPost = {
          post with
          viewCount = post.viewCount + 1;
        };
        posts := textMap.put(posts, postId, updatedPost);
        #success;
      };
    };
  };

  // System function to restore user roles after canister upgrade
  system func postupgrade() {
    // Restore admin if we have one
    switch (adminPrincipal) {
      case (?admin) {
        AccessControl.initialize(accessControlState, admin);
      };
      case (null) { /* No admin yet */ };
    };

    // Restore all user roles
    for (userPrincipal in initializedUsers.vals()) {
      if (not Principal.isAnonymous(userPrincipal)) {
        // Re-initialize each user to restore their role
        switch (adminPrincipal) {
          case (?admin) {
            // Use admin context to assign user role
            AccessControl.assignRole(accessControlState, admin, userPrincipal, #user);
          };
          case (null) {
            // Fallback: initialize as if they're the first user
            AccessControl.initialize(accessControlState, userPrincipal);
          };
        };
      };
    };
  };

  // Helper function to check if a principal is already initialized
  func isUserInitialized(principal : Principal) : Bool {
    Array.find<Principal>(initializedUsers, func(p) { p == principal }) != null;
  };

  // Helper function to add a principal to initialized users list
  func addToInitializedUsers(principal : Principal) {
    if (not isUserInitialized(principal)) {
      initializedUsers := Array.append(initializedUsers, [principal]);
    };
  };

  // Enhanced helper function to ensure caller has user role with automatic initialization and persistence
  // This function properly initializes all non-anonymous principals to have #user role
  // It handles both fresh users and users after canister resets/upgrades
  // NOTE: This function modifies state and should ONLY be called from update functions, not queries
  func ensureUserRole(caller : Principal) {
    // Allow anonymous principals to perform actions
    if (Principal.isAnonymous(caller)) {
      return;
    };

    let currentRole = AccessControl.getUserRole(accessControlState, caller);

    switch (currentRole) {
      case (#guest) {
        // Non-anonymous principal with guest role needs initialization
        if (not isUserInitialized(caller)) {
          // First time seeing this user - initialize them
          AccessControl.initialize(accessControlState, caller);
          addToInitializedUsers(caller);

          // Track admin if this is the first user
          switch (adminPrincipal) {
            case (null) {
              adminPrincipal := ?caller;
            };
            case (?_) { /* Admin already set */ };
          };
        } else {
          // User was initialized before but lost role (e.g., after upgrade)
          // Re-assign user role using admin context
          switch (adminPrincipal) {
            case (?admin) {
              AccessControl.assignRole(accessControlState, admin, caller, #user);
            };
            case (null) {
              // No admin available, re-initialize
              AccessControl.initialize(accessControlState, caller);
            };
          };
        };
      };
      case (#user) {
        // User already has proper role - ensure they're tracked
        addToInitializedUsers(caller);
      };
      case (#admin) {
        // Admin already has proper role - ensure they're tracked
        addToInitializedUsers(caller);
        // Ensure admin is tracked
        switch (adminPrincipal) {
          case (null) {
            adminPrincipal := ?caller;
          };
          case (?_) { /* Admin already set */ };
        };
      };
    };
  };

  // Helper function to check if caller is a member of a pond
  func isMemberOfPond(caller : Principal, pondName : Text) : Bool {
    switch (textMap.get(ponds, pondName)) {
      case (null) { false };
      case (?pond) {
        Array.find<Principal>(pond.members, func(member) { member == caller }) != null;
      };
    };
  };

  // Helper function to check if caller is a moderator of a pond
  func isModeratorOfPond(caller : Principal, pondName : Text) : Bool {
    switch (textMap.get(ponds, pondName)) {
      case (null) { false };
      case (?pond) {
        Array.find<Principal>(pond.moderators, func(mod) { mod == caller }) != null;
      };
    };
  };

  // Helper function to check if caller is the admin of a pond
  func isAdminOfPond(caller : Principal, pondName : Text) : Bool {
    switch (textMap.get(ponds, pondName)) {
      case (null) { false };
      case (?pond) { pond.admin == caller };
    };
  };

  // Helper function to normalize tags
  func normalizeTag(input : Text) : Text {
    let lower = Text.map(input, func(c : Char) : Char { if (c >= 'A' and c <= 'Z') { Char.fromNat32(Char.toNat32(c) + 32) } else { c } });
    let trimmed = Text.trim(lower, #char ' ');
    let replaced = Text.map(trimmed, func(c : Char) : Char { if (c == ' ') { '-' } else { c } });
    let filtered = Text.map(
      replaced,
      func(c : Char) : Char {
        if ((c >= 'a' and c <= 'z') or (c >= '0' and c <= '9') or c == '-') {
          c;
        } else {
          '-';
        };
      },
    );
    let chars = Text.toIter(filtered);
    var result = "";
    var count = 0;
    for (c in chars) {
      if (count < 25) {
        result := Text.concat(result, Text.fromChar(c));
        count += 1;
      };
    };
    result;
  };

  // Helper function to check if a tag is canonical
  func getCanonicalTag(tag : Text) : Text {
    switch (textMap.get(tagMergeRegistry, tag)) {
      case (null) { tag };
      case (?canonical) { canonical };
    };
  };

  // Helper function to check if two tags are similar
  func areTagsSimilar(tag1 : Text, tag2 : Text) : Bool {
    let norm1 = normalizeTag(tag1);
    let norm2 = normalizeTag(tag2);

    // Case-insensitive comparison
    if (norm1 == norm2) {
      return true;
    };

    // Plural/singular detection
    if (Text.endsWith(norm1, #text "s") and Text.trimEnd(norm1, #text "s") == norm2) {
      return true;
    };
    if (Text.endsWith(norm2, #text "s") and Text.trimEnd(norm2, #text "s") == norm1) {
      return true;
    };

    // Hyphen/underscore normalization
    let norm1NoHyphens = Text.replace(norm1, #text "-", "");
    let norm2NoHyphens = Text.replace(norm2, #text "-", "");
    if (norm1NoHyphens == norm2NoHyphens) {
      return true;
    };

    // Collapsing repeated letters
    func collapseRepeatedLetters(tag : Text) : Text {
      let chars = Text.toIter(tag);
      var result = "";
      var lastChar : ?Char = null;
      for (c in chars) {
        switch (lastChar) {
          case (null) {
            result := Text.concat(result, Text.fromChar(c));
          };
          case (?last) {
            if (c != last) {
              result := Text.concat(result, Text.fromChar(c));
            };
          };
        };
        lastChar := ?c;
      };
      result;
    };

    let collapsed1 = collapseRepeatedLetters(norm1);
    let collapsed2 = collapseRepeatedLetters(norm2);
    if (collapsed1 == collapsed2) {
      return true;
    };

    false;
  };

  // Function to merge similar tags - Admin only
  public shared ({ caller }) func mergeSimilarTags() : async () {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can merge tags");
    };

    let tags = Iter.toArray(textMap.keys(tagUsageCount));
    let tagCount = tags.size();

    for (i in Iter.range(0, tagCount - 1)) {
      let tag1 = tags[i];
      for (j in Iter.range(i + 1, tagCount - 1)) {
        let tag2 = tags[j];
        if (areTagsSimilar(tag1, tag2)) {
          // Determine canonical tag (highest usage count)
          let count1 = switch (textMap.get(tagUsageCount, tag1)) {
            case (null) { 0 };
            case (?count) { count };
          };
          let count2 = switch (textMap.get(tagUsageCount, tag2)) {
            case (null) { 0 };
            case (?count) { count };
          };

          let canonical = if (count1 >= count2) { tag1 } else { tag2 };
          let nonCanonical = if (count1 >= count2) { tag2 } else { tag1 };

          // Update tag merge registry
          tagMergeRegistry := textMap.put(tagMergeRegistry, nonCanonical, canonical);

          // Update all posts using the non-canonical tag
          posts := textMap.map<Post, Post>(
            posts,
            func(_id, post) {
              switch (post.tag) {
                case (null) { post };
                case (?t) {
                  if (t == nonCanonical) {
                    { post with tag = ?canonical };
                  } else {
                    post;
                  };
                };
              };
            },
          );

          // Remove non-canonical tag from usage count
          tagUsageCount := textMap.delete(tagUsageCount, nonCanonical);

          // Consolidate TagStats under canonical tag
          let canonicalStats = switch (textMap.get(tagStats, canonical)) {
            case (null) {
              let defaultStats : TagStats = {
                id = canonical;
                postsTotal = 0;
                repliesTotal = 0;
                firstUsedAt = 0;
                lastActivityAt = 0;
              };
              defaultStats;
            };
            case (?stats) { stats };
          };

          let nonCanonicalStats = switch (textMap.get(tagStats, nonCanonical)) {
            case (null) {
              let defaultStats : TagStats = {
                id = nonCanonical;
                postsTotal = 0;
                repliesTotal = 0;
                firstUsedAt = 0;
                lastActivityAt = 0;
              };
              defaultStats;
            };
            case (?stats) { stats };
          };

          let consolidatedStats = {
            canonicalStats with
            postsTotal = canonicalStats.postsTotal + nonCanonicalStats.postsTotal;
            repliesTotal = canonicalStats.repliesTotal + nonCanonicalStats.repliesTotal;
            firstUsedAt = Int.min(canonicalStats.firstUsedAt, nonCanonicalStats.firstUsedAt);
            lastActivityAt = Int.max(canonicalStats.lastActivityAt, nonCanonicalStats.lastActivityAt);
          };

          tagStats := textMap.put(tagStats, canonical, consolidatedStats);
          tagStats := textMap.delete(tagStats, nonCanonical);
        };
      };
    };
  };

  // Function to get canonical tag for a given tag - Public query
  public query func getCanonicalTagForTag(tag : Text) : async Text {
    getCanonicalTag(tag);
  };

  // Function to get all tag redirects - Public query
  public query func getTagRedirects() : async [(Text, Text)] {
    Iter.toArray(textMap.entries(tagMergeRegistry));
  };

  // Access Control Functions
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
    addToInitializedUsers(caller);

    // Track admin
    switch (adminPrincipal) {
      case (null) {
        adminPrincipal := ?caller;
      };
      case (?_) { /* Admin already set */ };
    };
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    ensureUserRole(caller);
    AccessControl.assignRole(accessControlState, caller, user, role);

    // Track the user being assigned a role
    addToInitializedUsers(user);

    // If assigning admin role, update admin tracking
    switch (role) {
      case (#admin) {
        switch (adminPrincipal) {
          case (null) {
            adminPrincipal := ?user;
          };
          case (?_) { /* Admin already set */ };
        };
      };
      case (_) { /* Not admin role */ };
    };
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };

    // Save the profile with avatar blob
    userProfiles := principalMap.put(userProfiles, caller, profile);

    // Synchronize username-to-principal bidirectional mappings
    // This ensures getUserAvatarByUsername can resolve: username → principal → avatar

    // Update principalToUsername mapping with the profile name
    principalToUsername := principalMap.put(principalToUsername, caller, profile.name);

    // Update usernameOwnership mapping
    usernameOwnership := textMap.put(usernameOwnership, profile.name, caller);
  };

  // Username Registry Functions - Require user permission
  public query func isUsernameAvailable(username : Text) : async Bool {
    // Public query - no authorization required for checking availability
    not textMap.contains(usernameRegistry, username);
  };

  public shared ({ caller }) func registerUsername(username : Text) : async () {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can register usernames");
    };

    // Check if username is already taken
    if (textMap.contains(usernameRegistry, username)) {
      Debug.trap("Username already taken");
    };

    // Check if caller already has a username registered
    switch (principalMap.get(principalToUsername, caller)) {
      case (?existingUsername) {
        // User is changing username - verify cooldown
        let currentTime = Time.now();
        let cooldownPeriod = 24 * 60 * 60 * 1_000_000_000; // 24 hours in nanoseconds

        switch (textMap.get(usernameChangeHistory, existingUsername)) {
          case (?lastChangeTime) {
            if (currentTime - lastChangeTime < cooldownPeriod) {
              Debug.trap("You can only change your username once every 24 hours.");
            };
          };
          case (null) { /* First change, no cooldown */ };
        };

        // Release old username
        usernameRegistry := textMap.delete(usernameRegistry, existingUsername);
        usernameOwnership := textMap.delete(usernameOwnership, existingUsername);
      };
      case (null) { /* First time registration */ };
    };

    // Register new username with bidirectional mapping
    usernameRegistry := textMap.put(usernameRegistry, username, true);
    usernameOwnership := textMap.put(usernameOwnership, username, caller);
    principalToUsername := principalMap.put(principalToUsername, caller, username);
    usernameChangeHistory := textMap.put(usernameChangeHistory, username, Time.now());
  };

  public shared ({ caller }) func releaseUsername(username : Text) : async () {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can release usernames");
    };

    // Verify ownership or admin privileges
    switch (textMap.get(usernameOwnership, username)) {
      case (null) {
        Debug.trap("Username not registered");
      };
      case (?owner) {
        if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only release your own username");
        };

        // Clean up all username-related data
        usernameRegistry := textMap.delete(usernameRegistry, username);
        usernameOwnership := textMap.delete(usernameOwnership, username);
        usernameChangeHistory := textMap.delete(usernameChangeHistory, username);
        principalToUsername := principalMap.delete(principalToUsername, owner);
      };
    };
  };

  // Username Change Cooldown Functions - Require user permission
  public query ({ caller }) func canChangeUsername(username : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can check username change eligibility");
    };

    // Check if username is available (not taken by someone else)
    switch (textMap.get(usernameOwnership, username)) {
      case (?owner) {
        // Username is taken - only allow if it's the caller's own username
        if (owner != caller) {
          return false;
        };
      };
      case (null) { /* Username available */ };
    };

    // Check cooldown for caller's current username
    switch (principalMap.get(principalToUsername, caller)) {
      case (?currentUsername) {
        let currentTime = Time.now();
        let cooldownPeriod = 24 * 60 * 60 * 1_000_000_000; // 24 hours in nanoseconds

        switch (textMap.get(usernameChangeHistory, currentUsername)) {
          case (?lastChangeTime) {
            return currentTime - lastChangeTime >= cooldownPeriod;
          };
          case (null) { return true };
        };
      };
      case (null) { return true }; // No current username, can register
    };
  };

  public shared ({ caller }) func recordUsernameChange(username : Text) : async () {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can record username changes");
    };

    // Verify ownership
    switch (textMap.get(usernameOwnership, username)) {
      case (null) {
        Debug.trap("Username not registered");
      };
      case (?owner) {
        if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only change your own username");
        };
      };
    };

    let currentTime = Time.now();
    let cooldownPeriod = 24 * 60 * 60 * 1_000_000_000; // 24 hours in nanoseconds

    switch (textMap.get(usernameChangeHistory, username)) {
      case (null) {
        usernameChangeHistory := textMap.put(usernameChangeHistory, username, currentTime);
      };
      case (?lastChangeTime) {
        if (currentTime - lastChangeTime < cooldownPeriod) {
          Debug.trap("You can only change your username once every 24 hours.");
        } else {
          usernameChangeHistory := textMap.put(usernameChangeHistory, username, currentTime);
        };
      };
    };
  };

  func isAlphanumeric(text : Text) : Bool {
    // Convert Text to iterable and check each character
    let chars = Text.toIter(text);
    var result = true;
    for (c in chars) {
      let n = Char.toNat32(c);
      if (not ((n >= 48 and n <= 57) or (n >= 65 and n <= 90) or (n >= 97 and n <= 122))) {
        result := false;
      };
    };
    result;
  };

  // Pond Functions - Require user permission
  // Updated to include banner image parameter
  public shared ({ caller }) func createPond(name : Text, description : Text, image : Storage.ExternalBlob, profileImage : Storage.ExternalBlob, bannerImage : Storage.ExternalBlob, froggyPhrase : Text) : async () {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create ponds");
    };

    if (not isAlphanumeric(name)) {
      Debug.trap("Pond name must contain only letters and numbers. ");
    };

    if (textMap.contains(ponds, name)) {
      Debug.trap("Pond already exists");
    };

    // Validate Froggy Phrase (must contain at least 5 words)
    let wordCount = Array.size(Iter.toArray(Text.split(froggyPhrase, #char ' ')));
    if (wordCount < 5) {
      Debug.trap("Froggy Phrase must contain at least five words");
    };

    let pond : Pond = {
      name;
      description;
      image = ?image;
      profileImage = ?profileImage;
      bannerImage = ?bannerImage;
      createdAt = Time.now();
      memberCount = 1; // Creator is the first member
      members = [caller];
      moderators = [caller];
      admin = caller;
      rules = [];
      visibility = #publicVisibility;
      associatedTags = [];
      lilyCount = 0;
    };

    ponds := textMap.put(ponds, name, pond);

    // Update creator's joined ponds
    switch (principalMap.get(userProfiles, caller)) {
      case (null) {
        let newProfile : UserProfile = {
          name = "Frog_" # Nat.toText(Int.abs(Time.now()) % 10000);
          joinedPonds = [name];
          avatar = null;
        };
        userProfiles := principalMap.put(userProfiles, caller, newProfile);
      };
      case (?profile) {
        let updatedProfile = {
          profile with
          joinedPonds = Array.append(profile.joinedPonds, [name]);
        };
        userProfiles := principalMap.put(userProfiles, caller, updatedProfile);
      };
    };
  };

  // Public query - no authorization required
  public query func getPond(name : Text) : async ?Pond {
    textMap.get(ponds, name);
  };

  // Public query - no authorization required
  public query func listPonds() : async [Pond] {
    Iter.toArray(textMap.vals(ponds));
  };

  // Pond Admin Functions - Only pond admin can perform these operations
  public shared ({ caller }) func editPondSettings(pondName : Text, title : ?Text, description : ?Text, visibility : ?Visibility) : async () {
    ensureUserRole(caller);
    if (not isAdminOfPond(caller, pondName)) {
      Debug.trap("Unauthorized: Only pond admins can edit pond settings");
    };

    switch (textMap.get(ponds, pondName)) {
      case (null) { Debug.trap("Pond not found") };
      case (?pond) {
        let updatedPond = {
          pond with
          description = switch (description) { case (null) { pond.description }; case (?d) { d } };
          visibility = switch (visibility) { case (null) { pond.visibility }; case (?v) { v } };
        };
        ponds := textMap.put(ponds, pondName, updatedPond);
      };
    };
  };

  public shared ({ caller }) func addModerator(pondName : Text, moderator : Principal) : async () {
    ensureUserRole(caller);
    if (not isAdminOfPond(caller, pondName)) {
      Debug.trap("Unauthorized: Only pond admins can add moderators");
    };

    switch (textMap.get(ponds, pondName)) {
      case (null) { Debug.trap("Pond not found") };
      case (?pond) {
        // Check if moderator already exists
        if (Array.find<Principal>(pond.moderators, func(m) { m == moderator }) != null) {
          Debug.trap("Moderator already exists");
        };

        let updatedPond = {
          pond with
          moderators = Array.append(pond.moderators, [moderator]);
        };
        ponds := textMap.put(ponds, pondName, updatedPond);
      };
    };
  };

  public shared ({ caller }) func removeModerator(pondName : Text, moderator : Principal) : async () {
    ensureUserRole(caller);
    if (not isAdminOfPond(caller, pondName)) {
      Debug.trap("Unauthorized: Only pond admins can remove moderators");
    };

    switch (textMap.get(ponds, pondName)) {
      case (null) { Debug.trap("Pond not found") };
      case (?pond) {
        let updatedModerators = Array.filter<Principal>(pond.moderators, func(m) { m != moderator });
        let updatedPond = {
          pond with
          moderators = updatedModerators;
        };
        ponds := textMap.put(ponds, pondName, updatedPond);
      };
    };
  };

  // Public query - no authorization required
  public query func getPondModerators(pondName : Text) : async [Principal] {
    switch (textMap.get(ponds, pondName)) {
      case (null) { [] };
      case (?pond) { pond.moderators };
    };
  };

  public query ({ caller }) func isPondAdmin(pondName : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return false;
    };
    isAdminOfPond(caller, pondName);
  };

  // Pond Rules Functions - Admin only
  public shared ({ caller }) func addPondRule(pondName : Text, rule : Text) : async () {
    ensureUserRole(caller);
    if (not isAdminOfPond(caller, pondName)) {
      Debug.trap("Unauthorized: Only pond admins can add rules");
    };

    switch (textMap.get(ponds, pondName)) {
      case (null) { Debug.trap("Pond not found") };
      case (?pond) {
        let updatedPond = {
          pond with
          rules = Array.append(pond.rules, [rule]);
        };
        ponds := textMap.put(ponds, pondName, updatedPond);
      };
    };
  };

  public shared ({ caller }) func removePondRule(pondName : Text, rule : Text) : async () {
    ensureUserRole(caller);
    if (not isAdminOfPond(caller, pondName)) {
      Debug.trap("Unauthorized: Only pond admins can remove rules");
    };

    switch (textMap.get(ponds, pondName)) {
      case (null) { Debug.trap("Pond not found") };
      case (?pond) {
        let updatedRules = Array.filter<Text>(pond.rules, func(r) { r != rule });
        let updatedPond = {
          pond with
          rules = updatedRules;
        };
        ponds := textMap.put(ponds, pondName, updatedPond);
      };
    };
  };

  // Public query - no authorization required
  public query func getPondRules(pondName : Text) : async [Text] {
    switch (textMap.get(ponds, pondName)) {
      case (null) { [] };
      case (?pond) { pond.rules };
    };
  };

  // Admin function to delete a Lily (post) in their pond
  public shared ({ caller }) func deleteLily(postId : Text) : async () {
    ensureUserRole(caller);
    switch (textMap.get(posts, postId)) {
      case (null) { Debug.trap("Post not found") };
      case (?post) {
        if (not isAdminOfPond(caller, post.pond)) {
          Debug.trap("Unauthorized: Only pond admins can delete lilies in their pond");
        };
        posts := textMap.delete(posts, postId);
        postLikes := textMap.delete(postLikes, postId);
      };
    };
  };

  // Admin function to delete a Ribbit in their pond
  public shared ({ caller }) func deleteRibbit(ribbitId : Text) : async () {
    ensureUserRole(caller);
    switch (textMap.get(ribbits, ribbitId)) {
      case (null) { Debug.trap("Ribbit not found") };
      case (?ribbit) {
        // Get the post to check pond ownership
        switch (textMap.get(posts, ribbit.postId)) {
          case (null) { Debug.trap("Associated post not found") };
          case (?post) {
            if (not isAdminOfPond(caller, post.pond)) {
              Debug.trap("Unauthorized: Only pond admins can delete ribbits in their pond");
            };
            ribbits := textMap.delete(ribbits, ribbitId);
            ribbitLikes := textMap.delete(ribbitLikes, ribbitId);
          };
        };
      };
    };
  };

  // Admin function to remove a member from the pond
  public shared ({ caller }) func removeMemberFromPond(pondName : Text, member : Principal) : async () {
    ensureUserRole(caller);
    if (not isAdminOfPond(caller, pondName)) {
      Debug.trap("Unauthorized: Only pond admins can remove members");
    };

    switch (textMap.get(ponds, pondName)) {
      case (null) { Debug.trap("Pond not found") };
      case (?pond) {
        // Check if member exists
        if (not isMemberOfPond(member, pondName)) {
          Debug.trap("User is not a member of this pond");
        };

        // Remove member from pond
        let updatedMembers = Array.filter<Principal>(pond.members, func(m) { m != member });
        let updatedPond = {
          pond with
          members = updatedMembers;
          memberCount = Nat.sub(pond.memberCount, 1);
        };
        ponds := textMap.put(ponds, pondName, updatedPond);

        // Update member's joined ponds
        switch (principalMap.get(userProfiles, member)) {
          case (null) { /* No profile to update */ };
          case (?profile) {
            let updatedJoinedPonds = Array.filter<Text>(profile.joinedPonds, func(p) { p != pondName });
            let updatedProfile = {
              profile with
              joinedPonds = updatedJoinedPonds;
            };
            userProfiles := principalMap.put(userProfiles, member, updatedProfile);
          };
        };
      };
    };
  };

  // Post Functions - Require user permission AND pond membership
  public shared ({ caller }) func createPost(title : Text, content : Text, image : ?Storage.ExternalBlob, link : ?Text, pond : Text, username : Text, tag : ?Text) : async Text {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create posts");
    };

    // Check if pond exists
    switch (textMap.get(ponds, pond)) {
      case (null) {
        Debug.trap("Pond not found");
      };
      case (?pondData) {
        if (not isMemberOfPond(caller, pond)) {
          Debug.trap("You must be a member of this pond to post a Lily.");
        };
      };
    };

    // Maintain username-principal bidirectional mappings for the lily author
    // This ensures getUserAvatarByUsername can resolve: username → principal → avatar

    // Always update the mappings to ensure consistency
    usernameOwnership := textMap.put(usernameOwnership, username, caller);
    principalToUsername := principalMap.put(principalToUsername, caller, username);

    let postId = Text.concat("post_", Nat.toText(textMap.size(posts) + 1));

    let normalizedTag = switch (tag) {
      case (null) { null };
      case (?t) {
        let norm = normalizeTag(t);
        // Update tag usage count
        switch (textMap.get(tagUsageCount, norm)) {
          case (null) {
            tagUsageCount := textMap.put(tagUsageCount, norm, 1);
          };
          case (?count) {
            tagUsageCount := textMap.put(tagUsageCount, norm, count + 1);
          };
        };

        // Update pond's associated tags
        switch (textMap.get(ponds, pond)) {
          case (null) { /* Pond not found, should not happen */ };
          case (?pondData) {
            // Check if tag already exists in associatedTags
            let tagExists = Array.find<Text>(pondData.associatedTags, func(existingTag) { existingTag == norm }) != null;
            if (not tagExists) {
              let updatedPond = {
                pondData with
                associatedTags = Array.append(pondData.associatedTags, [norm]);
              };
              ponds := textMap.put(ponds, pond, updatedPond);
            };
          };
        };

        // Maintain TagStats for canonicalized tag
        let canonicalTag = getCanonicalTag(norm);

        // Retrieve existing or default TagStats
        let currentStats = switch (textMap.get(tagStats, canonicalTag)) {
          case (null) {
            let defaultStats : TagStats = {
              id = canonicalTag;
              postsTotal = 0;
              repliesTotal = 0;
              firstUsedAt = Time.now();
              lastActivityAt = Time.now();
            };
            defaultStats;
          };
          case (?stats) { stats };
        };

        // Update stats for canonical tag
        let updatedStats = {
          currentStats with
          postsTotal = currentStats.postsTotal + 1;
          lastActivityAt = Time.now();
        };

        // If it's the first sighting, set firstUsedAt
        let finalStats = if (currentStats.postsTotal == 0) {
          {
            updatedStats with
            firstUsedAt = Time.now();
          };
        } else { updatedStats };

        // Store updated stats for the canonical tag
        tagStats := textMap.put(tagStats, canonicalTag, finalStats);

        ?norm;
      };
    };

    let post : Post = {
      id = postId;
      title;
      content;
      image;
      link;
      pond;
      username;
      timestamp = Time.now();
      viewCount = 0;
      tag = normalizedTag;
    };

    posts := textMap.put(posts, postId, post);

    // Increment lily count in the pond
    switch (textMap.get(ponds, pond)) {
      case (null) { /* Pond not found, should not happen */ };
      case (?pondData) {
        let updatedPond = {
          pondData with
          lilyCount = pondData.lilyCount + 1;
        };
        ponds := textMap.put(ponds, pond, updatedPond);
      };
    };

    postId;
  };

  // Like Functions (Posts)
  public shared ({ caller }) func likePost(postId : Text) : async () {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can like posts");
    };

    switch (textMap.get(posts, postId)) {
      case (null) { Debug.trap("Post not found") };
      case (?_) {
        // Initialize post likes if not present
        var currentLikes = switch (textMap.get(postLikes, postId)) {
          case (null) { principalMap.empty<Bool>() };
          case (?likes) { likes };
        };

        // Update like status for the caller
        currentLikes := principalMap.put(currentLikes, caller, true);

        // Save updated likes for the post
        postLikes := textMap.put(postLikes, postId, currentLikes);

        // Log like activity
        logActivity(#like, postId, "", "");
      };
    };
  };

  public shared ({ caller }) func unlikePost(postId : Text) : async () {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can unlike posts");
    };

    switch (textMap.get(posts, postId)) {
      case (null) { Debug.trap("Post not found") };
      case (?_) {
        switch (textMap.get(postLikes, postId)) {
          case (null) { /* No likes to unlike */ };
          case (?likes) {
            // Remove like from the post
            let updatedLikes = principalMap.delete(likes, caller);
            postLikes := textMap.put(postLikes, postId, updatedLikes);
          };
        };
      };
    };
  };

  // Like Functions (Ribbits)
  public shared ({ caller }) func likeRibbit(ribbitId : Text) : async () {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can like ribbits");
    };

    switch (textMap.get(ribbits, ribbitId)) {
      case (null) { Debug.trap("Ribbit not found") };
      case (?_) {
        // Initialize ribbit likes if not present
        var currentLikes = switch (textMap.get(ribbitLikes, ribbitId)) {
          case (null) { principalMap.empty<Bool>() };
          case (?likes) { likes };
        };

        // Update like status for the caller
        currentLikes := principalMap.put(currentLikes, caller, true);

        // Save updated likes for the ribbit
        ribbitLikes := textMap.put(ribbitLikes, ribbitId, currentLikes);
      };
    };
  };

  public shared ({ caller }) func unlikeRibbit(ribbitId : Text) : async () {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can unlike ribbits");
    };

    switch (textMap.get(ribbits, ribbitId)) {
      case (null) { Debug.trap("Ribbit not found") };
      case (?_) {
        switch (textMap.get(ribbitLikes, ribbitId)) {
          case (null) { /* No likes to unlike */ };
          case (?likes) {
            // Remove like from the ribbit
            let updatedLikes = principalMap.delete(likes, caller);
            ribbitLikes := textMap.put(ribbitLikes, ribbitId, updatedLikes);
          };
        };
      };
    };
  };

  // Public functions to get like counts, like status, and all likes for posts
  public query func getPostLikeCount(postId : Text) : async Nat {
    switch (textMap.get(postLikes, postId)) {
      case (null) { 0 };
      case (?likes) { principalMap.size(likes) };
    };
  };

  public query ({ caller }) func hasUserLikedPost(postId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return false;
    };

    switch (textMap.get(postLikes, postId)) {
      case (null) { false };
      case (?likes) {
        switch (principalMap.get(likes, caller)) {
          case (null) { false };
          case (?liked) { liked };
        };
      };
    };
  };

  public shared ({ caller }) func clearPostLikes(postId : Text) : async () {
    ensureUserRole(caller);
    // Only admins can clear post likes
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can clear post likes");
    };
    postLikes := textMap.delete(postLikes, postId);
  };

  // Public functions to get like counts and like status for ribbits
  public query func getRibbitLikeCount(ribbitId : Text) : async Nat {
    switch (textMap.get(ribbitLikes, ribbitId)) {
      case (null) { 0 };
      case (?likes) { principalMap.size(likes) };
    };
  };

  public query ({ caller }) func hasUserLikedRibbit(ribbitId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return false;
    };

    switch (textMap.get(ribbitLikes, ribbitId)) {
      case (null) { false };
      case (?likes) {
        switch (principalMap.get(likes, caller)) {
          case (null) { false };
          case (?liked) { liked };
        };
      };
    };
  };

  // New function to get like count for a post - Public query
  public query func getLikeCountForPost(postId : Text) : async Nat {
    switch (textMap.get(postLikes, postId)) {
      case (null) { 0 };
      case (?likes) { principalMap.size(likes) };
    };
  };

  // Public query - no authorization required
  public query func getPost(id : Text) : async ?Post {
    textMap.get(posts, id);
  };

  // Public query - no authorization required
  public query func listPosts() : async [Post] {
    Iter.toArray(textMap.vals(posts));
  };

  // Tag Suggestion Function - Public query
  public query func getTagSuggestions(prefix : Text, limit : Nat) : async [Text] {
    let normalizedPrefix = normalizeTag(prefix);

    // Filter tags by prefix
    let filteredTags = Array.filter<(Text, Nat)>(
      Iter.toArray(textMap.entries(tagUsageCount)),
      func((tag, _) : (Text, Nat)) : Bool {
        Text.startsWith(tag, #text normalizedPrefix);
      },
    );

    // Sort tags by usage count (descending)
    let sortedTags = Array.sort<(Text, Nat)>(
      filteredTags,
      func(a : (Text, Nat), b : (Text, Nat)) : { #less; #equal; #greater } {
        if (a.1 > b.1) { #less } else if (a.1 < b.1) { #greater } else { #equal };
      },
    );

    // Take up to 'limit' tags
    let limitedTags = Array.tabulate<(Text, Nat)>(
      Nat.min(limit, sortedTags.size()),
      func(i : Nat) : (Text, Nat) { sortedTags[i] },
    );

    // Extract tag names
    Array.map<(Text, Nat), Text>(limitedTags, func((tag, _) : (Text, Nat)) : Text { tag });
  };

  // Ribbit Functions - Require user permission only
  public shared ({ caller }) func createRibbit(postId : Text, parentId : ?Text, content : Text, username : Text) : async Text {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create ribbits");
    };

    let ribbitId = Text.concat("ribbit_", Nat.toText(textMap.size(ribbits) + 1));

    let ribbit : Ribbit = {
      id = ribbitId;
      postId;
      parentId;
      content;
      username;
      timestamp = Time.now();
    };

    ribbits := textMap.put(ribbits, ribbitId, ribbit);

    // Track user view of ribbit for generating dynamic activity feed
    trackViewRibbitActivity(ribbitId, username);

    // If the target post has a canonical tag, update reply count and last activity for that tag
    switch (textMap.get(posts, postId)) {
      case (?post) {
        switch (post.tag) {
          case (?tag) {
            let canonicalTag = getCanonicalTag(tag);

            // Retrieve existing or default TagStats
            let currentStats = switch (textMap.get(tagStats, canonicalTag)) {
              case (null) {
                let defaultStats : TagStats = {
                  id = canonicalTag;
                  postsTotal = 0;
                  repliesTotal = 0;
                  firstUsedAt = Time.now();
                  lastActivityAt = Time.now();
                };
                defaultStats;
              };
              case (?stats) { stats };
            };

            // Update reply count and last activity
            let updatedStats = {
              currentStats with
              repliesTotal = currentStats.repliesTotal + 1;
              lastActivityAt = Time.now();
            };

            // Store updated stats for the canonical tag
            tagStats := textMap.put(tagStats, canonicalTag, updatedStats);
          };
          case (null) { /* No tag for this post */ };
        };
      };
      case (null) { /* Post not found */ };
    };

    ribbitId;
  };

  func trackViewRibbitActivity(ribbitId : Text, username : Text) {
    // Track only if the same user hasn't viewed this ribbit before
    let hasViewedBefore = Array.find<Activity>(
      Iter.toArray(textMap.vals(ribbitActivity)),
      func(activity) {
        activity.type_ == #viewRibbit and activity.targetId == ribbitId and activity.username == username
      },
    ) != null;

    if (not hasViewedBefore) {
      // Create new activity record for the view action
      let activity : Activity = {
        id = ribbitId # "_view_" # Int.toText(Time.now());
        type_ = #viewRibbit;
        targetId = ribbitId;
        timestamp = Time.now();
        username;
        pond = ""; // Pond could be fetched if needed for filtering
      };

      // Add to existing ribbitActivity map
      ribbitActivity := textMap.put(ribbitActivity, activity.id, activity);
    };
  };

  // New query function for dynamic activity tracking (recently viewed ribbits)
  public query func getRecentRibbitViews(username : Text, limit : Nat) : async [Activity] {
    // Filter only strictly #viewRibbit activities
    let viewActivities = Array.filter<Activity>(
      Iter.toArray(textMap.vals(ribbitActivity)),
      func(activity) {
        activity.type_ == #viewRibbit and activity.username == username
      },
    );

    // Get activities from the last 30 days (1 month)
    let now = Time.now();
    let lastDay = 24 * 60 * 60 * 1_000_000_000;

    let recentViews = Array.filter<Activity>(
      viewActivities,
      func(activity) {
        now - activity.timestamp <= lastDay
      },
    );

    // Sort by most recent first
    let sortedViews = Array.sort<Activity>(
      recentViews,
      func(a, b) {
        if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else { #equal };
      },
    );

    // Return up to 30 most recent views
    let resultSize = Nat.min(sortedViews.size(), limit);
    if (resultSize == 0) {
      return [];
    };

    let limitedResult = Array.tabulate<Activity>(
      resultSize,
      func(i) { sortedViews[i] },
    );

    limitedResult;
  };

  // Public query - no authorization required
  public query func getRibbit(id : Text) : async ?Ribbit {
    textMap.get(ribbits, id);
  };

  // Public query - no authorization required
  public query func listRibbits(postId : Text) : async [Ribbit] {
    let filtered = Array.filter<Ribbit>(
      Iter.toArray(textMap.vals(ribbits)),
      func(r : Ribbit) : Bool { r.postId == postId },
    );
    filtered;
  };

  // Public query - no authorization required
  public query func getThreadedRibbits(postId : Text) : async [Ribbit] {
    let allRibbits = Array.filter<Ribbit>(
      Iter.toArray(textMap.vals(ribbits)),
      func(r : Ribbit) : Bool { r.postId == postId },
    );

    let rootRibbits = Array.filter<Ribbit>(
      allRibbits,
      func(r : Ribbit) : Bool { switch (r.parentId) { case (null) { true }; case (?_) { false } } },
    );

    func buildThread(ribbit : Ribbit) : [Ribbit] {
      let children = Array.filter<Ribbit>(
        allRibbits,
        func(r : Ribbit) : Bool {
          switch (r.parentId) {
            case (null) { false };
            case (?parentId) { parentId == ribbit.id };
          };
        },
      );

      var thread = [ribbit];
      for (child in children.vals()) {
        thread := Array.append(thread, buildThread(child));
      };
      thread;
    };

    var threadedRibbits : [Ribbit] = [];
    for (root in rootRibbits.vals()) {
      threadedRibbits := Array.append(threadedRibbits, buildThread(root));
    };

    threadedRibbits;
  };

  // New function to get ribbit count for a post - Public query
  public query func getRibbitCountForPost(postId : Text) : async Nat {
    var count = 0;
    for ((_, ribbit) in textMap.entries(ribbits)) {
      if (ribbit.postId == postId) {
        count += 1;
      };
    };
    count;
  };

  // New function to get view count for a post - Public query
  public query func getViewCountForPost(postId : Text) : async Nat {
    switch (textMap.get(posts, postId)) {
      case (null) { 0 };
      case (?post) { post.viewCount };
    };
  };

  // Search Functions - Public access (no authorization required)
  public query func searchPonds(searchTerm : Text) : async [Pond] {
    let filtered = Array.filter<Pond>(
      Iter.toArray(textMap.vals(ponds)),
      func(p : Pond) : Bool {
        Text.contains(p.name, #text searchTerm) or Text.contains(p.description, #text searchTerm);
      },
    );
    filtered;
  };

  public query func searchPosts(searchTerm : Text) : async [Post] {
    let filtered = Array.filter<Post>(
      Iter.toArray(textMap.vals(posts)),
      func(p : Post) : Bool {
        Text.contains(p.title, #text searchTerm) or Text.contains(p.content, #text searchTerm) or Text.contains(p.pond, #text searchTerm);
      },
    );
    filtered;
  };

  // Pond Membership Functions - Require user permission
  public shared ({ caller }) func joinPond(pondName : Text) : async () {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can join ponds");
    };

    switch (textMap.get(ponds, pondName)) {
      case (null) { Debug.trap("Pond not found") };
      case (?pond) {
        // Check if user is already a member
        if (isMemberOfPond(caller, pondName)) {
          Debug.trap("Already a member of this pond");
        };

        // Add user to pond members
        let updatedPond = {
          pond with
          members = Array.append(pond.members, [caller]);
          memberCount = pond.memberCount + 1;
        };
        ponds := textMap.put(ponds, pondName, updatedPond);
      };
    };
  };

  public shared ({ caller }) func leavePond(pondName : Text) : async () {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can leave ponds");
    };

    switch (textMap.get(ponds, pondName)) {
      case (null) { Debug.trap("Pond not found") };
      case (?pond) {
        // Check if user is a member
        if (not isMemberOfPond(caller, pondName)) {
          Debug.trap("Not a member of this pond");
        };

        // Remove user from pond members
        let updatedMembers = Array.filter<Principal>(pond.members, func(member) { member != caller });
        let updatedPond = {
          pond with
          members = updatedMembers;
          memberCount = Nat.sub(pond.memberCount, 1);
        };
        ponds := textMap.put(ponds, pondName, updatedPond);

        // Update user's joined ponds
        switch (principalMap.get(userProfiles, caller)) {
          case (null) { /* No profile to update */ };
          case (?profile) {
            let updatedJoinedPonds = Array.filter<Text>(profile.joinedPonds, func(p) { p != pondName });
            let updatedProfile = {
              profile with
              joinedPonds = updatedJoinedPonds;
            };
            userProfiles := principalMap.put(userProfiles, caller, updatedProfile);
          };
        };
      };
    };
  };

  public query ({ caller }) func getJoinedPonds() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can get joined ponds");
    };

    switch (principalMap.get(userProfiles, caller)) {
      case (null) { [] };
      case (?profile) { profile.joinedPonds };
    };
  };

  // Pond About Page Functions - Public query
  public query func getPondAboutInfo(pondName : Text) : async ?{
    name : Text;
    title : Text;
    description : Text;
    profileImage : ?Storage.ExternalBlob;
    bannerImage : ?Storage.ExternalBlob;
    createdAt : Int;
    memberCount : Nat;
    visibility : Visibility;
    rules : [Text];
    moderators : [Principal];
    admin : Principal;
    associatedTags : [Text];
    lilyCount : Nat;
  } {
    switch (textMap.get(ponds, pondName)) {
      case (null) { null };
      case (?pond) {
        ?{
          name = pond.name;
          title = pond.name; // Use name as title since title was removed
          description = pond.description;
          profileImage = pond.profileImage;
          bannerImage = pond.bannerImage;
          createdAt = pond.createdAt;
          memberCount = pond.memberCount;
          visibility = pond.visibility;
          rules = pond.rules;
          moderators = pond.moderators;
          admin = pond.admin;
          associatedTags = pond.associatedTags;
          lilyCount = pond.lilyCount;
        };
      };
    };
  };

  // Tag Page Functions - Public query
  public query func getLiliesByTag(tag : Text, sortBy : Text) : async [Post] {
    let canonicalTag = getCanonicalTag(tag);

    // Filter posts by tag
    let filteredPosts = Array.filter<Post>(
      Iter.toArray(textMap.vals(posts)),
      func(p : Post) : Bool {
        switch (p.tag) {
          case (null) { false };
          case (?t) { t == canonicalTag };
        };
      },
    );

    // Sort posts based on sortBy parameter
    let sortedPosts = switch (sortBy) {
      case ("newest") {
        Array.sort<Post>(
          filteredPosts,
          func(a : Post, b : Post) : { #less; #equal; #greater } {
            if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else { #equal };
          },
        );
      };
      case ("most_viewed") {
        Array.sort<Post>(
          filteredPosts,
          func(a : Post, b : Post) : { #less; #equal; #greater } {
            if (a.viewCount > b.viewCount) { #less } else if (a.viewCount < b.viewCount) { #greater } else { #equal };
          },
        );
      };
      case ("most_replied") {
        Array.sort<Post>(
          filteredPosts,
          func(a : Post, b : Post) : { #less; #equal; #greater } {
            let aReplies = getRibbitCountForPostSync(a.id);
            let bReplies = getRibbitCountForPostSync(b.id);
            if (aReplies > bReplies) { #less } else if (aReplies < bReplies) { #greater } else { #equal };
          },
        );
      };
      case (_) { filteredPosts };
    };

    sortedPosts;
  };

  // Helper function to get ribbit count for a post (synchronous)
  func getRibbitCountForPostSync(postId : Text) : Nat {
    var count = 0;
    for ((_, ribbit) in textMap.entries(ribbits)) {
      if (ribbit.postId == postId) {
        count += 1;
      };
    };
    count;
  };

  // New query function to get tag rank based on usage - using a while loop for compatibility
  public query func getTagRank(tag : Text) : async {
    tag : Text;
    rank : ?Nat;
    canonicalTag : Text;
  } {
    let canonicalTag = getCanonicalTag(tag);
    let entries = Iter.toArray(textMap.entries(tagStats));
    let sorted = Array.sort<(Text, TagStats)>(
      entries,
      func((_, a), (_, b)) {
        if (a.postsTotal + a.repliesTotal > b.postsTotal + b.repliesTotal) { #less } else if (a.postsTotal + b.repliesTotal < b.postsTotal + b.repliesTotal) { #greater } else { #equal };
      },
    );

    var position = 1;
    var found = false;

    // Using a while loop instead of Array.iter for compatibility
    var i = 0;
    while (i < sorted.size()) {
      let (currentTag, _) = sorted[i];
      if (currentTag == canonicalTag) {
        found := true;
        i := sorted.size(); // Exit the loop
      } else {
        position += 1;
        i += 1;
      };
    };

    {
      tag = canonicalTag;
      rank = if (found) { ?position } else { null };
      canonicalTag;
    };
  };

  // New: Unrestricted read access for retrieving avatars!
  public query func getUserAvatarByUsername(username : Text) : async ?Storage.ExternalBlob {
    textMap.get(usernameAvatars, username);
  };

  // Function to log an activity
  func logActivity(activityType : ActivityType, targetId : Text, username : Text, pond : Text) {
    let activity : Activity = {
      id = Text.concat("activity_", Nat.toText(textMap.size(postActivity) + textMap.size(ribbitActivity) + textMap.size(likeActivity)));
      type_ = activityType;
      targetId;
      timestamp = Time.now();
      username;
      pond;
    };

    switch (activityType) {
      case (#post) {
        postActivity := textMap.put(postActivity, activity.id, activity);
      };
      case (#ribbit) {
        ribbitActivity := textMap.put(ribbitActivity, activity.id, activity);
      };
      case (#like) {
        likeActivity := textMap.put(likeActivity, activity.id, activity);
      };
      case (#viewRibbit) {
        ribbitActivity := textMap.put(ribbitActivity, activity.id, activity);
      };
    };
  };

  // Function to get recent posts
  public query func getRecentPosts(limit : Nat) : async [Activity] {
    let allPosts = Iter.toArray(textMap.vals(postActivity));
    let sortedPosts = Array.sort<Activity>(
      allPosts,
      func(a : Activity, b : Activity) : { #less; #equal; #greater } {
        if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else { #equal };
      },
    );
    let limitedPosts = Array.tabulate<Activity>(
      Nat.min(limit, sortedPosts.size()),
      func(i : Nat) : Activity { sortedPosts[i] },
    );
    limitedPosts;
  };

  // Function to get recent ribbits
  public query func getRecentRibbits(limit : Nat) : async [Activity] {
    let allRibbits = Iter.toArray(textMap.vals(ribbitActivity));
    let sortedRibbits = Array.sort<Activity>(
      allRibbits,
      func(a : Activity, b : Activity) : { #less; #equal; #greater } {
        if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else { #equal };
      },
    );
    let limitedRibbits = Array.tabulate<Activity>(
      Nat.min(limit, sortedRibbits.size()),
      func(i : Nat) : Activity { sortedRibbits[i] },
    );
    limitedRibbits;
  };

  // Function to get recently liked posts
  public query func getRecentlyLikedPosts(limit : Nat) : async [Activity] {
    let allLikes = Iter.toArray(textMap.vals(likeActivity));
    let sortedLikes = Array.sort<Activity>(
      allLikes,
      func(a : Activity, b : Activity) : { #less; #equal; #greater } {
        if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else { #equal };
      },
    );
    let limitedLikes = Array.tabulate<Activity>(
      Nat.min(limit, sortedLikes.size()),
      func(i : Nat) : Activity { sortedLikes[i] },
    );
    limitedLikes;
  };

  // Function to get all recent activities
  public query func getAllRecentActivities(limit : Nat) : async [Activity] {
    let allPosts = Iter.toArray(textMap.vals(postActivity));
    let allRibbits = Iter.toArray(textMap.vals(ribbitActivity));
    let allLikes = Iter.toArray(textMap.vals(likeActivity));

    let allActivities = Array.append(
      Array.append(allPosts, allRibbits),
      allLikes,
    );

    let sortedActivities = Array.sort<Activity>(
      allActivities,
      func(a : Activity, b : Activity) : { #less; #equal; #greater } {
        if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else { #equal };
      },
    );

    let limitedActivities = Array.tabulate<Activity>(
      Nat.min(limit, sortedActivities.size()),
      func(i : Nat) : Activity { sortedActivities[i] },
    );
    limitedActivities;
  };

  // Tag Ranking Query Endpoints

  public query func getTopTags(limit : Nat) : async [(Text, TagStats)] {
    let entries = Iter.toArray(textMap.entries(tagStats));
    let sorted = Array.sort<(Text, TagStats)>(
      entries,
      func((_, a), (_, b)) {
        if (a.postsTotal + a.repliesTotal > b.postsTotal + a.repliesTotal) { #less } else if (a.postsTotal + a.repliesTotal < b.postsTotal + b.repliesTotal) { #greater } else { #equal };
      },
    );
    let take = Nat.min(limit, sorted.size());
    Array.tabulate<(Text, TagStats)>(take, func(i) { sorted[i] });
  };

  public query func getTrendingTags(limit : Nat) : async [(Text, TagStats)] {
    let entries = Iter.toArray(textMap.entries(tagStats));
    let radius = 25_000_000_000_000; // 25K billion nanoseconds = 25K seconds = 6.9 hours
    let now = Time.now();

    let sorted = Array.sort<(Text, TagStats)>(
      entries,
      func((_, a), (_, b)) {
        let aScore = computeTrendingScore(a, now, radius);
        let bScore = computeTrendingScore(b, now, radius);
        if (aScore > bScore) { #less } else if (aScore < bScore) { #greater } else { #equal };
      },
    );
    let take = Nat.min(limit, sorted.size());
    Array.tabulate<(Text, TagStats)>(take, func(i) { sorted[i] });
  };

  public query func getNewestTags(limit : Nat) : async [(Text, TagStats)] {
    let entries = Iter.toArray(textMap.entries(tagStats));
    let sorted = Array.sort<(Text, TagStats)>(
      entries,
      func((_, a), (_, b)) {
        if (a.firstUsedAt > b.firstUsedAt) { #less } else if (a.firstUsedAt < b.firstUsedAt) { #greater } else { #equal };
      },
    );
    let take = Nat.min(limit, sorted.size());
    Array.tabulate<(Text, TagStats)>(take, func(i) { sorted[i] });
  };

  // Helper function to compute trending score with custom decay using windowing
  func computeTrendingScore(stats : TagStats, now : Int, radius : Int) : Int {
    let activityAge = now - stats.lastActivityAt;
    let window = activityAge / radius;
    let remaining = activityAge - (window * radius);

    let adjustedAge = if (remaining < 0) { -remaining } else { remaining };
    let baseScore = stats.postsTotal + stats.repliesTotal;

    // Apply additional boost for fresh content within the current window instead of 0 when new
    let recalculateScore = switch (window) {
      case (0) { baseScore * 10 }; // Fresh content within current window gets big boost
      case (1) { baseScore * 3 }; // Still quite recent - lesser boost
      case (2) { baseScore * 2 }; // Very recent - moderate boost
      case (3) { baseScore * 1 }; // Slightly less recent - minimal boost
      case (_) { baseScore }; // No adjustment for older content
    };
    recalculateScore / (adjustedAge / radius + 1);
  };

  public query func getTagStatsForTag(tag : Text) : async ?TagStats {
    let canonicalTag = getCanonicalTag(tag);
    textMap.get(tagStats, canonicalTag);
  };
};
