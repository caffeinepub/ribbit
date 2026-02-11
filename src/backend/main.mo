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

  // === New: Subcategories for tags ===
  var tagSubcategories : OrderedMap.Map<Text, [Text]> = textMap.empty();

  // Access control state
  let accessControlState = AccessControl.initState();

  // New: Phrase-hash enabled storage
  var userIdLinkage : OrderedMap.Map<Text, Principal> = textMap.empty();
  var userIdUsernameLinkage : OrderedMap.Map<Text, Text> = textMap.empty();

  // Parallel like mappings
  var userIdPostLikes : OrderedMap.Map<Text, OrderedMap.Map<Text, Bool>> = textMap.empty();
  var userIdRibbitLikes : OrderedMap.Map<Text, OrderedMap.Map<Text, Bool>> = textMap.empty();

  // Store userId-mapped user profiles
  var userIdUserProfiles : OrderedMap.Map<Text, UserProfile> = textMap.empty();

  // Username linkage between userId and username
  var userIdUsernameRegistry : OrderedMap.Map<Text, Text> = textMap.empty();

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
    #success;
    #notFound;
    #error;
  };

  // Updated tag stats type with IDs
  type TagStats = {
    id : Text;
    postsTotal : Nat;
    repliesTotal : Nat;
    firstUsedAt : Int;
    lastActivityAt : Int;
  };

  // ===== ACCESS CONTROL METHODS =====

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public shared ({ caller }) func initializeFroggyPhrase(userId : Text) : async () {
    userIdLinkage := textMap.put(userIdLinkage, userId, caller);

    let currentRole = AccessControl.getUserRole(accessControlState, caller);

    // Only upgrade guests to users; preserve existing admin/user roles
    switch (currentRole) {
      case (#guest) {
        // For guests, we need to initialize them as users
        // Since AccessControl.assignRole requires admin permission and guests can't self-promote,
        // we use AccessControl.initialize which will make them a user (not admin, since system is already initialized)
        AccessControl.initialize(accessControlState, caller);
      };
      case (#user) {
        // Already a user, no action needed
      };
      case (#admin) {
        // Already an admin, no action needed
      };
    };
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public query func getUserRoleByPhraseHash(userId : Text) : async AccessControl.UserRole {
    switch (textMap.get(userIdLinkage, userId)) {
      case (?principal) { AccessControl.getUserRole(accessControlState, principal) };
      case (null) { #guest };
    };
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public shared ({ caller }) func assignUserRoleByPhraseHash(userId : Text, role : AccessControl.UserRole) : async () {
    switch (textMap.get(userIdLinkage, userId)) {
      case (?principal) { AccessControl.assignRole(accessControlState, caller, principal, role) };
      case (null) { Debug.trap("User ID not found") };
    };
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query func isUserAdminByPhraseHash(userId : Text) : async Bool {
    switch (textMap.get(userIdLinkage, userId)) {
      case (?principal) { AccessControl.isAdmin(accessControlState, principal) };
      case (null) { false };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query func getUserProfileByPhraseHash(userId : Text) : async ?UserProfile {
    let profileByPhraseHash = textMap.get(userIdUserProfiles, userId);
    switch (profileByPhraseHash) {
      case (?profile) { ?profile };
      case (null) {
        switch (textMap.get(userIdLinkage, userId)) {
          case (?principal) { principalMap.get(userProfiles, principal) };
          case (null) { null };
        };
      };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public shared func saveUserProfileByPhraseHash(userId : Text, profile : UserProfile) : async () {
    userIdUserProfiles := textMap.put(userIdUserProfiles, userId, profile);
    switch (textMap.get(userIdLinkage, userId)) {
      case (?principal) { userProfiles := principalMap.put(userProfiles, principal, profile) };
      case (null) {};
    };
  };

  // ===== END ACCESS CONTROL =====

  public shared ({ caller }) func incrementLilyViewCount(postId : Text) : async ViewIncrementResult {
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

  func isMemberOfPond(caller : Principal, pondName : Text) : Bool {
    switch (textMap.get(ponds, pondName)) {
      case (null) { false };
      case (?pond) {
        Array.find<Principal>(pond.members, func(member) { member == caller }) != null;
      };
    };
  };

  func isModeratorOfPond(caller : Principal, pondName : Text) : Bool {
    switch (textMap.get(ponds, pondName)) {
      case (null) { false };
      case (?pond) {
        Array.find<Principal>(pond.moderators, func(mod) { mod == caller }) != null;
      };
    };
  };

  func isAdminOfPond(caller : Principal, pondName : Text) : Bool {
    switch (textMap.get(ponds, pondName)) {
      case (null) { false };
      case (?pond) { pond.admin == caller };
    };
  };

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

  func getCanonicalTag(tag : Text) : Text {
    switch (textMap.get(tagMergeRegistry, tag)) {
      case (null) { tag };
      case (?canonical) { canonical };
    };
  };

  func areTagsSimilar(tag1 : Text, tag2 : Text) : Bool {
    let norm1 = normalizeTag(tag1);
    let norm2 = normalizeTag(tag2);

    if (norm1 == norm2) {
      return true;
    };

    if (Text.endsWith(norm1, #text "s") and Text.trimEnd(norm1, #text "s") == norm2) {
      return true;
    };
    if (Text.endsWith(norm2, #text "s") and Text.trimEnd(norm2, #text "s") == norm1) {
      return true;
    };

    let norm1NoHyphens = Text.replace(norm1, #text "-", "");
    let norm2NoHyphens = Text.replace(norm2, #text "-", "");
    if (norm1NoHyphens == norm2NoHyphens) {
      return true;
    };

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

  public shared ({ caller }) func mergeSimilarTags() : async () {
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

          tagMergeRegistry := textMap.put(tagMergeRegistry, nonCanonical, canonical);

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

          tagUsageCount := textMap.delete(tagUsageCount, nonCanonical);

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
            lastActivityAt = Int.max(canonicalStats.firstUsedAt, nonCanonicalStats.firstUsedAt);
          };

          tagStats := textMap.put(tagStats, canonical, consolidatedStats);
          tagStats := textMap.delete(tagStats, nonCanonical);
        };
      };
    };
  };

  public query func getCanonicalTagForTag(tag : Text) : async Text {
    getCanonicalTag(tag);
  };

  public query func getTagRedirects() : async [(Text, Text)] {
    Iter.toArray(textMap.entries(tagMergeRegistry));
  };

  public query func getUserProfileByUsername(username : Text) : async ?UserProfile {
    switch (textMap.get(usernameOwnership, username)) {
      case (null) { null };
      case (?profilePrincipal) {
        principalMap.get(userProfiles, profilePrincipal);
      };
    };
  };

  public query func getPostsByUsername(username : Text) : async [Post] {
    let filteredPosts = Array.filter<Post>(
      Iter.toArray(textMap.vals(posts)),
      func(post : Post) : Bool {
        post.username == username;
      },
    );
    filteredPosts;
  };

  public query func getRibbitsByUsername(username : Text) : async [Ribbit] {
    let filteredRibbits = Array.filter<Ribbit>(
      Iter.toArray(textMap.vals(ribbits)),
      func(ribbit : Ribbit) : Bool {
        ribbit.username == username;
      },
    );
    filteredRibbits;
  };

  public query func isUsernameAvailable(username : Text) : async Bool {
    not textMap.contains(usernameRegistry, username);
  };

  public query func isUsernameAvailableByPhraseHash(_userId : Text, username : Text) : async Bool {
    not textMap.contains(usernameRegistry, username);
  };

  public shared ({ caller }) func registerUsername(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can register usernames");
    };

    if (textMap.contains(usernameRegistry, username)) {
      Debug.trap("Username already taken");
    };

    switch (principalMap.get(principalToUsername, caller)) {
      case (?existingUsername) {
        let currentTime = Time.now();
        let cooldownPeriod = 24 * 60 * 60 * 1_000_000_000;

        switch (textMap.get(usernameChangeHistory, existingUsername)) {
          case (?lastChangeTime) {
            if (currentTime - lastChangeTime < cooldownPeriod) {
              Debug.trap("You can only change your username once every 24 hours.");
            };
          };
          case (null) {};
        };

        usernameRegistry := textMap.delete(usernameRegistry, existingUsername);
        usernameOwnership := textMap.delete(usernameOwnership, existingUsername);
      };
      case (null) {};
    };

    usernameRegistry := textMap.put(usernameRegistry, username, true);
    usernameOwnership := textMap.put(usernameOwnership, username, caller);
    principalToUsername := principalMap.put(principalToUsername, caller, username);
    usernameChangeHistory := textMap.put(usernameChangeHistory, username, Time.now());
  };

  public shared func registerUsernameWithPhraseHash(userId : Text, username : Text) : async () {
    if (textMap.contains(usernameRegistry, username)) {
      Debug.trap("Username already taken");
    };
    userIdUsernameRegistry := textMap.put(userIdUsernameRegistry, userId, username);
    usernameRegistry := textMap.put(usernameRegistry, username, true);
  };

  public shared ({ caller }) func releaseUsername(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can release usernames");
    };

    switch (textMap.get(usernameOwnership, username)) {
      case (null) {
        Debug.trap("Username not registered");
      };
      case (?owner) {
        if (owner != caller) {
          Debug.trap("Unauthorized: Can only release your own username");
        };

        usernameRegistry := textMap.delete(usernameRegistry, username);
        usernameOwnership := textMap.delete(usernameOwnership, username);
        usernameChangeHistory := textMap.delete(usernameChangeHistory, username);
        principalToUsername := principalMap.delete(principalToUsername, owner);
      };
    };
  };

  public shared func releaseUsernameWithPhraseHash(userId : Text, username : Text) : async () {
    switch (textMap.get(userIdUsernameRegistry, userId)) {
      case (?registeredUsername) {
        if (registeredUsername != username) {
          Debug.trap("Unauthorized: Can only release your own username");
        };
        userIdUsernameRegistry := textMap.delete(userIdUsernameRegistry, userId);
        usernameRegistry := textMap.delete(usernameRegistry, username);
      };
      case (null) { Debug.trap("Username not registered") };
    };
  };

  public query ({ caller }) func canChangeUsername(username : Text) : async Bool {
    switch (textMap.get(usernameOwnership, username)) {
      case (?owner) {
        if (owner != caller) {
          return false;
        };
      };
      case (null) {};
    };

    switch (principalMap.get(principalToUsername, caller)) {
      case (?currentUsername) {
        let currentTime = Time.now();
        let cooldownPeriod = 24 * 60 * 60 * 1_000_000_000;

        switch (textMap.get(usernameChangeHistory, currentUsername)) {
          case (?lastChangeTime) {
            return currentTime - lastChangeTime >= cooldownPeriod;
          };
          case (null) { return true };
        };
      };
      case (null) { return true };
    };
  };

  public query func canChangeUsernameByPhraseHash(userId : Text, username : Text) : async Bool {
    switch (textMap.get(userIdUsernameRegistry, userId)) {
      case (?currentUsername) {
        if (currentUsername == username) {
          return true;
        };
        return not textMap.contains(usernameRegistry, username);
      };
      case (null) { return not textMap.contains(usernameRegistry, username) };
    };
  };

  public shared ({ caller }) func recordUsernameChange(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can record username changes");
    };

    switch (textMap.get(usernameOwnership, username)) {
      case (null) {
        Debug.trap("Username not registered");
      };
      case (?owner) {
        if (owner != caller) {
          Debug.trap("Unauthorized: Can only change your own username");
        };
      };
    };

    let currentTime = Time.now();
    let cooldownPeriod = 24 * 60 * 60 * 1_000_000_000;

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

  public shared func recordUsernameChangeByPhraseHash(userId : Text, username : Text) : async () {
    switch (textMap.get(userIdUsernameRegistry, userId)) {
      case (?registeredUsername) {
        if (registeredUsername != username) {
          Debug.trap("Unauthorized: Can only change your own username");
        };
      };
      case (null) { Debug.trap("Username not registered") };
    };
  };

  func isAlphanumeric(text : Text) : Bool {
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

  public shared ({ caller }) func createPond(name : Text, description : Text, image : Storage.ExternalBlob, profileImage : Storage.ExternalBlob, bannerImage : Storage.ExternalBlob, froggyPhrase : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create ponds");
    };

    if (not isAlphanumeric(name)) {
      Debug.trap("Pond name must contain only letters and numbers. ");
    };

    if (textMap.contains(ponds, name)) {
      Debug.trap("Pond already exists");
    };

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
      memberCount = 1;
      members = [caller];
      moderators = [caller];
      admin = caller;
      rules = [];
      visibility = #publicVisibility;
      associatedTags = [];
      lilyCount = 0;
    };

    ponds := textMap.put(ponds, name, pond);

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

  public query func getPond(name : Text) : async ?Pond {
    textMap.get(ponds, name);
  };

  public query func listPonds() : async [Pond] {
    Iter.toArray(textMap.vals(ponds));
  };

  public shared ({ caller }) func editPondSettings(pondName : Text, title : ?Text, description : ?Text, visibility : ?Visibility) : async () {
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
    if (not isAdminOfPond(caller, pondName)) {
      Debug.trap("Unauthorized: Only pond admins can add moderators");
    };

    switch (textMap.get(ponds, pondName)) {
      case (null) { Debug.trap("Pond not found") };
      case (?pond) {
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

  public query func getPondModerators(pondName : Text) : async [Principal] {
    switch (textMap.get(ponds, pondName)) {
      case (null) { [] };
      case (?pond) { pond.moderators };
    };
  };

  public query func isPondAdmin(pondName : Text) : async Bool {
    isAdminOfPond(Principal.fromActor(Ribbit), pondName);
  };

  public shared ({ caller }) func addPondRule(pondName : Text, rule : Text) : async () {
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

  public query func getPondRules(pondName : Text) : async [Text] {
    switch (textMap.get(ponds, pondName)) {
      case (null) { [] };
      case (?pond) { pond.rules };
    };
  };
};

