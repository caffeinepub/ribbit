import OrderedMap "mo:base/OrderedMap";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Char "mo:base/Char";
import Debug "mo:base/Debug";
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

  // Subcategories for tags
  var tagSubcategories : OrderedMap.Map<Text, [Text]> = textMap.empty();

  // Access control state
  let accessControlState = AccessControl.initState();

  // Phrase-hash enabled storage
  var userIdLinkage : OrderedMap.Map<Text, Principal> = textMap.empty();
  var userIdUsernameLinkage : OrderedMap.Map<Text, Text> = textMap.empty();

  // Parallel like mappings
  var userIdPostLikes : OrderedMap.Map<Text, OrderedMap.Map<Text, Bool>> = textMap.empty();
  var userIdRibbitLikes : OrderedMap.Map<Text, OrderedMap.Map<Text, Bool>> = textMap.empty();

  // Store userId-mapped user profiles
  var userIdUserProfiles : OrderedMap.Map<Text, UserProfile> = textMap.empty();

  // Username linkage between userId and username
  var userIdUsernameRegistry : OrderedMap.Map<Text, Text> = textMap.empty();

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
    // Store members as userIds instead of Principals
    members : [Text];
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

  // Access Control Methods
  public shared ({ caller }) func initializeAccessControl() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only admins can initialize access control");
    };
    AccessControl.initialize(accessControlState, caller);
  };

  public shared ({ caller }) func initializeFroggyPhrase(userId : Text) : async () {
    // Record linkage between userId and caller - no permission check needed for first-time users
    userIdLinkage := textMap.put(userIdLinkage, userId, caller);
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    // Allow any user to get their role
    AccessControl.getUserRole(accessControlState, caller);
  };

  public query func getUserRoleByPhraseHash(userId : Text) : async AccessControl.UserRole {
    switch (textMap.get(userIdLinkage, userId)) {
      case (?principal) { AccessControl.getUserRole(accessControlState, principal) };
      case (null) { #guest };
    };
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only admins can assign roles");
    };
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public shared ({ caller }) func assignUserRoleByPhraseHash(userId : Text, role : AccessControl.UserRole) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Debug.trap("Unauthorized: Only admins can assign roles");
    };
    switch (textMap.get(userIdLinkage, userId)) {
      case (?principal) { AccessControl.assignRole(accessControlState, caller, principal, role) };
      case (null) { Debug.trap("User ID not found") };
    };
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    // Allow any user to check if they are admin
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query func isUserAdminByPhraseHash(userId : Text) : async Bool {
    switch (textMap.get(userIdLinkage, userId)) {
      case (?principal) { AccessControl.isAdmin(accessControlState, principal) };
      case (null) { false };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    // Allow any user to get their own profile without permission check
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
    // Allow any user to get any profile without permission check
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    // Allow any user to save their own profile
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public shared ({ caller }) func saveUserProfileByPhraseHash(userId : Text, profile : UserProfile) : async () {
    // Establish linkage if it doesn't exist - allow first-time phrase-hash users
    switch (textMap.get(userIdLinkage, userId)) {
      case (?linkedPrincipal) {
        // Linkage exists - verify caller matches
        if (caller != linkedPrincipal) {
          Debug.trap("Unauthorized: Can only save your own profile");
        };
      };
      case (null) {
        // No linkage - create it for this caller (allows first-time phrase-hash users)
        userIdLinkage := textMap.put(userIdLinkage, userId, caller);
      };
    };

    userIdUserProfiles := textMap.put(userIdUserProfiles, userId, profile);
    switch (textMap.get(userIdLinkage, userId)) {
      case (?principal) { userProfiles := principalMap.put(userProfiles, principal, profile) };
      case (null) {};
    };
  };

  // End Access Control

  public shared func incrementLilyViewCount(postId : Text) : async ViewIncrementResult {
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

  func isMemberOfPond(userId : Text, pondName : Text) : Bool {
    switch (textMap.get(ponds, pondName)) {
      case (null) { false };
      case (?pond) {
        Array.find<Text>(pond.members, func(member) { member == userId }) != null;
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

  func validateAdminAccess(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: This operation is restricted to admins only.");
    };
  };

  public shared ({ caller }) func mergeSimilarTags() : async () {
    validateAdminAccess(caller);

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
            repliesTotal = canonicalStats.postsTotal + nonCanonicalStats.repliesTotal;
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

  public shared ({ caller }) func registerUsernameWithPhraseHash(userId : Text, username : Text) : async () {
    // Establish linkage if it doesn't exist - allow first-time phrase-hash users
    switch (textMap.get(userIdLinkage, userId)) {
      case (?linkedPrincipal) {
        // Linkage exists - verify caller matches
        if (caller != linkedPrincipal) {
          Debug.trap("Unauthorized: Can only register username for your own userId");
        };
      };
      case (null) {
        // No linkage - create it for this caller (allows first-time phrase-hash users)
        userIdLinkage := textMap.put(userIdLinkage, userId, caller);
      };
    };

    if (textMap.contains(usernameRegistry, username)) {
      Debug.trap("Username already taken");
    };
    userIdUsernameRegistry := textMap.put(userIdUsernameRegistry, userId, username);
    usernameRegistry := textMap.put(usernameRegistry, username, true);
  };

  public shared ({ caller }) func releaseUsernameWithPhraseHash(userId : Text, username : Text) : async () {
    // Allow username release for any authenticated caller with matching userId
    switch (textMap.get(userIdLinkage, userId)) {
      case (?linkedPrincipal) {
        if (caller != linkedPrincipal) {
          Debug.trap("Unauthorized: Can only release your own username");
        };
      };
      case (null) { 
        // If no linkage exists but caller is trying to release, allow if username matches userId registry
        switch (textMap.get(userIdUsernameRegistry, userId)) {
          case (null) { Debug.trap("User ID not found") };
          case (?_) {
            // Create linkage for this operation
            userIdLinkage := textMap.put(userIdLinkage, userId, caller);
          };
        };
      };
    };

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

  public shared ({ caller }) func recordUsernameChangeByPhraseHash(userId : Text, username : Text) : async () {
    // Allow username change recording for any authenticated caller
    switch (textMap.get(userIdLinkage, userId)) {
      case (?linkedPrincipal) {
        if (caller != linkedPrincipal) {
          Debug.trap("Unauthorized: Can only change your own username");
        };
      };
      case (null) {
        // Create linkage for first-time users
        userIdLinkage := textMap.put(userIdLinkage, userId, caller);
      };
    };

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
    // Allow any user to create a pond without permission check

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

    let userId = Principal.toText(caller);

    let pond : Pond = {
      name;
      description;
      image = ?image;
      profileImage = ?profileImage;
      bannerImage = ?bannerImage;
      createdAt = Time.now();
      memberCount = 1;
      members = [userId];
      moderators = [caller];
      admin = caller;
      rules = [];
      visibility = #publicVisibility;
      associatedTags = [];
      lilyCount = 0;
    };

    ponds := textMap.put(ponds, name, pond);

    let defaultProfile : UserProfile = {
      name = "Frog_" # Nat.toText(Int.abs(Time.now()) % 10000);
      joinedPonds = [name];
      avatar = null;
    };

    var profileToUpdate = switch (textMap.get(userIdUserProfiles, userId)) {
      case (?profile) { profile };
      case (null) { defaultProfile };
    };

    let alreadyMember = Array.find<Text>(profileToUpdate.joinedPonds, func(p) { p == name }) != null;

    if (not alreadyMember) {
      let updatedProfile = {
        profileToUpdate with
        joinedPonds = Array.append(profileToUpdate.joinedPonds, [name]);
      };
      userIdUserProfiles := textMap.put(userIdUserProfiles, userId, updatedProfile);
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

  public query ({ caller }) func isPondAdmin(pondName : Text) : async Bool {
    isAdminOfPond(caller, pondName);
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

  public shared ({ caller }) func deleteLily(postId : Text) : async () {
    switch (textMap.get(posts, postId)) {
      case (null) { Debug.trap("Post not found") };
      case (?post) {
        if (not isAdminOfPond(caller, post.pond) and not isModeratorOfPond(caller, post.pond)) {
          Debug.trap("Unauthorized: Only pond admins or moderators can delete lilies in their pond");
        };
        posts := textMap.delete(posts, postId);
        postLikes := textMap.delete(postLikes, postId);
      };
    };
  };

  public shared ({ caller }) func deleteRibbit(ribbitId : Text) : async () {
    switch (textMap.get(ribbits, ribbitId)) {
      case (null) { Debug.trap("Ribbit not found") };
      case (?ribbit) {
        switch (textMap.get(posts, ribbit.postId)) {
          case (null) { Debug.trap("Associated post not found") };
          case (?post) {
            if (not isAdminOfPond(caller, post.pond) and not isModeratorOfPond(caller, post.pond)) {
              Debug.trap("Unauthorized: Only pond admins or moderators can delete ribbits in their pond");
            };
            ribbits := textMap.delete(ribbits, ribbitId);
            ribbitLikes := textMap.delete(ribbitLikes, ribbitId);
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeMemberFromPond(pondName : Text, member : Text) : async () {
    if (not isAdminOfPond(caller, pondName)) {
      Debug.trap("Unauthorized: Only pond admins can remove members");
    };

    switch (textMap.get(ponds, pondName)) {
      case (null) { Debug.trap("Pond not found") };
      case (?pond) {
        if (not isMemberOfPond(member, pondName)) {
          Debug.trap("User is not a member of this pond");
        };

        let updatedMembers = Array.filter<Text>(pond.members, func(m) { m != member });
        let updatedPond = {
          pond with
          members = updatedMembers;
          memberCount = Nat.sub(pond.memberCount, 1);
        };
        ponds := textMap.put(ponds, pondName, updatedPond);

        let profileToUpdate = switch (textMap.get(userIdUserProfiles, member)) {
          case (?profile) { ?profile };
          case (null) { null };
        };
        switch (profileToUpdate) {
          case (null) {};
          case (?profile) {
            let updatedJoinedPonds = Array.filter<Text>(profile.joinedPonds, func(p) { p != pondName });
            let updatedProfile = {
              profile with
              joinedPonds = updatedJoinedPonds;
            };
            userIdUserProfiles := textMap.put(userIdUserProfiles, member, updatedProfile);
          };
        };
      };
    };
  };

  public shared ({ caller }) func createPost(title : Text, content : Text, image : ?Storage.ExternalBlob, link : ?Text, pond : Text, username : Text, tag : ?Text) : async Text {
    // Allow any user to create a post without permission check
    switch (textMap.get(ponds, pond)) {
      case (null) {
        Debug.trap("Pond not found");
      };
      case (?pondData) {
        let userId = Principal.toText(caller);
        if (not isMemberOfPond(userId, pond)) {
          Debug.trap("You must be a member of this pond to post a Lily.");
        };
      };
    };

    usernameOwnership := textMap.put(usernameOwnership, username, caller);
    principalToUsername := principalMap.put(principalToUsername, caller, username);

    let postId = Text.concat("post_", Nat.toText(textMap.size(posts) + 1));

    let normalizedTag = switch (tag) {
      case (null) { null };
      case (?t) {
        let norm = normalizeTag(t);
        switch (textMap.get(tagUsageCount, norm)) {
          case (null) {
            tagUsageCount := textMap.put(tagUsageCount, norm, 1);
          };
          case (?count) {
            tagUsageCount := textMap.put(tagUsageCount, norm, count + 1);
          };
        };

        switch (textMap.get(ponds, pond)) {
          case (null) {};
          case (?pondData) {
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

        let canonicalTag = getCanonicalTag(norm);

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

        let updatedStats = {
          currentStats with
          postsTotal = currentStats.postsTotal + 1;
          lastActivityAt = Time.now();
        };

        let finalStats = if (currentStats.postsTotal == 0) {
          {
            updatedStats with
            firstUsedAt = Time.now();
          };
        } else { updatedStats };

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

    switch (textMap.get(ponds, pond)) {
      case (null) {};
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

  public shared ({ caller }) func likePost(postId : Text) : async () {
    // Allow any user to like a post without permission check
    switch (textMap.get(posts, postId)) {
      case (null) { Debug.trap("Post not found") };
      case (?_) {
        var currentLikes = switch (textMap.get(postLikes, postId)) {
          case (null) { principalMap.empty<Bool>() };
          case (?likes) { likes };
        };

        currentLikes := principalMap.put(currentLikes, caller, true);
        postLikes := textMap.put(postLikes, postId, currentLikes);
        logActivity(#like, postId, "", "");
      };
    };
  };

  public shared ({ caller }) func unlikePost(postId : Text) : async () {
    // Allow any user to unlike a post without permission check
    switch (textMap.get(posts, postId)) {
      case (null) { Debug.trap("Post not found") };
      case (?_) {
        switch (textMap.get(postLikes, postId)) {
          case (null) {};
          case (?likes) {
            let updatedLikes = principalMap.delete(likes, caller);
            postLikes := textMap.put(postLikes, postId, updatedLikes);
          };
        };
      };
    };
  };

  public shared ({ caller }) func likeRibbit(ribbitId : Text) : async () {
    // Allow any user to like a ribbit without permission check
    switch (textMap.get(ribbits, ribbitId)) {
      case (null) { Debug.trap("Ribbit not found") };
      case (?_) {
        var currentLikes = switch (textMap.get(ribbitLikes, ribbitId)) {
          case (null) { principalMap.empty<Bool>() };
          case (?likes) { likes };
        };

        currentLikes := principalMap.put(currentLikes, caller, true);
        ribbitLikes := textMap.put(ribbitLikes, ribbitId, currentLikes);
      };
    };
  };

  public shared ({ caller }) func unlikeRibbit(ribbitId : Text) : async () {
    // Allow any user to unlike a ribbit without permission check
    switch (textMap.get(ribbits, ribbitId)) {
      case (null) { Debug.trap("Ribbit not found") };
      case (?_) {
        switch (textMap.get(ribbitLikes, ribbitId)) {
          case (null) {};
          case (?likes) {
            let updatedLikes = principalMap.delete(likes, caller);
            ribbitLikes := textMap.put(ribbitLikes, ribbitId, updatedLikes);
          };
        };
      };
    };
  };

  public query func getPostLikeCount(postId : Text) : async Nat {
    switch (textMap.get(postLikes, postId)) {
      case (null) { 0 };
      case (?likes) { principalMap.size(likes) };
    };
  };

  public query ({ caller }) func hasUserLikedPost(postId : Text) : async Bool {
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
    validateAdminAccess(caller);
    postLikes := textMap.delete(postLikes, postId);
  };

  public query func getRibbitLikeCount(ribbitId : Text) : async Nat {
    switch (textMap.get(ribbitLikes, ribbitId)) {
      case (null) { 0 };
      case (?likes) { principalMap.size(likes) };
    };
  };

  public query ({ caller }) func hasUserLikedRibbit(ribbitId : Text) : async Bool {
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

  public query func getLikeCountForPost(postId : Text) : async Nat {
    switch (textMap.get(postLikes, postId)) {
      case (null) { 0 };
      case (?likes) { principalMap.size(likes) };
    };
  };

  public query func getPost(id : Text) : async ?Post {
    textMap.get(posts, id);
  };

  public query func listPosts() : async [Post] {
    Iter.toArray(textMap.vals(posts));
  };

  public query func getTagSuggestions(prefix : Text, limit : Nat) : async [Text] {
    let normalizedPrefix = normalizeTag(prefix);

    let filteredTags = Array.filter<(Text, Nat)>(
      Iter.toArray(textMap.entries(tagUsageCount)),
      func((tag, _) : (Text, Nat)) : Bool {
        Text.startsWith(tag, #text normalizedPrefix);
      },
    );

    let sortedTags = Array.sort<(Text, Nat)>(
      filteredTags,
      func(a : (Text, Nat), b : (Text, Nat)) : { #less; #equal; #greater } {
        if (a.1 > b.1) { #less } else if (a.1 < b.1) { #greater } else { #equal };
      },
    );

    let limitedTags = Array.tabulate<(Text, Nat)>(
      Nat.min(limit, sortedTags.size()),
      func(i : Nat) : (Text, Nat) { sortedTags[i] },
    );

    Array.map<(Text, Nat), Text>(limitedTags, func((tag, _) : (Text, Nat)) : Text { tag });
  };

  public shared ({ caller }) func createRibbit(postId : Text, parentId : ?Text, content : Text, username : Text) : async Text {
    // Allow any user to create a ribbit without permission check
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

    trackViewRibbitActivity(ribbitId, username);

    switch (textMap.get(posts, postId)) {
      case (?post) {
        switch (post.tag) {
          case (?tag) {
            let canonicalTag = getCanonicalTag(tag);

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

            let updatedStats = {
              currentStats with
              repliesTotal = currentStats.repliesTotal + 1;
              lastActivityAt = Time.now();
            };

            tagStats := textMap.put(tagStats, canonicalTag, updatedStats);
          };
          case (null) {};
        };
      };
      case (null) {};
    };

    ribbitId;
  };

  func trackViewRibbitActivity(ribbitId : Text, username : Text) {
    let hasViewedBefore = Array.find<Activity>(
      Iter.toArray(textMap.vals(ribbitActivity)),
      func(activity) {
        activity.type_ == #viewRibbit and activity.targetId == ribbitId and activity.username == username
      },
    ) != null;

    if (not hasViewedBefore) {
      let activity : Activity = {
        id = ribbitId # "_view_" # Int.toText(Time.now());
        type_ = #viewRibbit;
        targetId = ribbitId;
        timestamp = Time.now();
        username;
        pond = "";
      };

      ribbitActivity := textMap.put(ribbitActivity, activity.id, activity);
    };
  };

  public query func getRecentRibbitViews(username : Text, limit : Nat) : async [Activity] {
    let viewActivities = Array.filter<Activity>(
      Iter.toArray(textMap.vals(ribbitActivity)),
      func(activity) {
        activity.type_ == #viewRibbit and activity.username == username
      },
    );

    let now = Time.now();
    let lastDay = 24 * 60 * 60 * 1_000_000_000;

    let recentViews = Array.filter<Activity>(
      viewActivities,
      func(activity) {
        now - activity.timestamp <= lastDay
      },
    );

    let sortedViews = Array.sort<Activity>(
      recentViews,
      func(a, b) {
        if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else { #equal };
      },
    );

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

  public query func getRibbit(id : Text) : async ?Ribbit {
    textMap.get(ribbits, id);
  };

  public query func listRibbits(postId : Text) : async [Ribbit] {
    let filtered = Array.filter<Ribbit>(
      Iter.toArray(textMap.vals(ribbits)),
      func(r : Ribbit) : Bool { r.postId == postId },
    );
    filtered;
  };

  public query func getThreadedRibbitsSorted(postId : Text, sortBy : Text) : async [Ribbit] {
    let allRibbits = Array.filter<Ribbit>(
      Iter.toArray(textMap.vals(ribbits)),
      func(r : Ribbit) : Bool { r.postId == postId },
    );

    let rootRibbits = Array.filter<Ribbit>(
      allRibbits,
      func(r : Ribbit) : Bool { switch (r.parentId) { case (null) { true }; case (?_) { false } } },
    );

    let sortedRootRibbits = switch (sortBy) {
      case ("top") {
        Array.sort<Ribbit>(
          rootRibbits,
          func(a : Ribbit, b : Ribbit) : { #less; #equal; #greater } {
            let aLikes = switch (textMap.get(ribbitLikes, a.id)) {
              case (null) { 0 };
              case (?likes) { principalMap.size(likes) };
            };
            let bLikes = switch (textMap.get(ribbitLikes, b.id)) {
              case (null) { 0 };
              case (?likes) { principalMap.size(likes) };
            };
            if (aLikes > bLikes) { #less } else if (aLikes < bLikes) { #greater } else { #equal };
          },
        );
      };
      case ("newest") {
        Array.sort<Ribbit>(
          rootRibbits,
          func(a : Ribbit, b : Ribbit) : { #less; #equal; #greater } {
            if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else { #equal };
          },
        );
      };
      case (_) { rootRibbits };
    };

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
    for (root in sortedRootRibbits.vals()) {
      threadedRibbits := Array.append(threadedRibbits, buildThread(root));
    };

    threadedRibbits;
  };

  public query func getRibbitCountForPost(postId : Text) : async Nat {
    var count = 0;
    for ((_, ribbit) in textMap.entries(ribbits)) {
      if (ribbit.postId == postId) {
        count += 1;
      };
    };
    count;
  };

  public query func getViewCountForPost(postId : Text) : async Nat {
    switch (textMap.get(posts, postId)) {
      case (null) { 0 };
      case (?post) { post.viewCount };
    };
  };

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

  public shared ({ caller }) func joinPond(userId : Text, pondName : Text) : async () {
    // Allow any user to join a pond without permission check
    switch (textMap.get(userIdLinkage, userId)) {
      case (?linkedPrincipal) {
        if (caller != linkedPrincipal) {
          Debug.trap("Unauthorized: Can only join ponds with your own userId");
        };
      };
      case (null) {
        // No linkage - create it for this caller (allows first-time phrase-hash users)
        userIdLinkage := textMap.put(userIdLinkage, userId, caller);
      };
    };

    switch (textMap.get(ponds, pondName)) {
      case (null) { Debug.trap("Pond not found") };
      case (?pond) {
        if (isMemberOfPond(userId, pondName)) {
          Debug.trap("Already a member of this pond");
        };

        let updatedPond = {
          pond with
          members = Array.append(pond.members, [userId]);
          memberCount = pond.memberCount + 1;
        };
        ponds := textMap.put(ponds, pondName, updatedPond);

        let defaultProfile : UserProfile = {
          name = "Frog_" # Nat.toText(Int.abs(Time.now()) % 10000);
          joinedPonds = [pondName];
          avatar = null;
        };

        let profileToUpdate = switch (textMap.get(userIdUserProfiles, userId)) {
          case (?profile) { profile };
          case (null) { defaultProfile };
        };

        let updatedProfile = {
          profileToUpdate with
          joinedPonds = Array.append(profileToUpdate.joinedPonds, [pondName]);
        };
        userIdUserProfiles := textMap.put(userIdUserProfiles, userId, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func leavePond(userId : Text, pondName : Text) : async () {
    // Allow any user to leave a pond without permission check
    switch (textMap.get(userIdLinkage, userId)) {
      case (?linkedPrincipal) {
        if (caller != linkedPrincipal) {
          Debug.trap("Unauthorized: Can only leave ponds with your own userId");
        };
      };
      case (null) {
        // If no linkage exists but caller is trying to leave, allow if they're a member
        if (isMemberOfPond(userId, pondName)) {
          userIdLinkage := textMap.put(userIdLinkage, userId, caller);
        } else {
          Debug.trap("User ID not found");
        };
      };
    };

    switch (textMap.get(ponds, pondName)) {
      case (null) { Debug.trap("Pond not found") };
      case (?pond) {
        if (not isMemberOfPond(userId, pondName)) {
          Debug.trap("Not a member of this pond");
        };

        let updatedMembers = Array.filter<Text>(pond.members, func(member) { member != userId });
        let updatedPond = {
          pond with
          members = updatedMembers;
          memberCount = Nat.sub(pond.memberCount, 1);
        };
        ponds := textMap.put(ponds, pondName, updatedPond);

        let profileToUpdate = switch (textMap.get(userIdUserProfiles, userId)) {
          case (?profile) { profile };
          case (null) {
            {
              name = "Frog_" # Nat.toText(Int.abs(Time.now()) % 10000);
              joinedPonds = [];
              avatar = null;
            };
          };
        };

        let updatedJoinedPonds = Array.filter<Text>(profileToUpdate.joinedPonds, func(p) { p != pondName });
        let updatedProfile = {
          profileToUpdate with
          joinedPonds = updatedJoinedPonds;
        };
        userIdUserProfiles := textMap.put(userIdUserProfiles, userId, updatedProfile);
      };
    };
  };

  public query func getJoinedPonds(userId : Text) : async [Text] {
    // Allow anyone to view joined ponds (public information)
    switch (textMap.get(userIdUserProfiles, userId)) {
      case (null) { [] };
      case (?profile) { profile.joinedPonds };
    };
  };

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
          title = pond.name;
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

  public query func getLiliesByTag(tag : Text, sortBy : Text) : async [Post] {
    let canonicalTag = getCanonicalTag(tag);

    let filteredPosts = Array.filter<Post>(
      Iter.toArray(textMap.vals(posts)),
      func(p : Post) : Bool {
        switch (p.tag) {
          case (null) { false };
          case (?t) { t == canonicalTag };
        };
      },
    );

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

  func getRibbitCountForPostSync(postId : Text) : Nat {
    var count = 0;
    for ((_, ribbit) in textMap.entries(ribbits)) {
      if (ribbit.postId == postId) {
        count += 1;
      };
    };
    count;
  };

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
        if (a.postsTotal + a.repliesTotal > b.postsTotal + b.repliesTotal) { #less } else if (a.postsTotal + b.repliesTotal < b.repliesTotal) { #greater } else { #equal };
      },
    );

    var position = 1;
    var found = false;

    var i = 0;
    while (i < sorted.size()) {
      let (currentTag, _) = sorted[i];
      if (currentTag == canonicalTag) {
        found := true;
        i := sorted.size();
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

  public query func getUserAvatarByUsername(username : Text) : async ?Storage.ExternalBlob {
    textMap.get(usernameAvatars, username);
  };

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

  public query func getTopTags(limit : Nat) : async [(Text, TagStats)] {
    let entries = Iter.toArray(textMap.entries(tagStats));
    let sorted = Array.sort<(Text, TagStats)>(
      entries,
      func((_, a), (_, b)) {
        if (a.postsTotal + a.repliesTotal > b.postsTotal + a.repliesTotal) { #less } else if (a.postsTotal + a.repliesTotal < b.repliesTotal + b.repliesTotal) { #greater } else { #equal };
      },
    );
    let take = Nat.min(limit, sorted.size());
    Array.tabulate<(Text, TagStats)>(take, func(i) { sorted[i] });
  };

  public query func getTrendingTags(limit : Nat) : async [(Text, TagStats)] {
    let entries = Iter.toArray(textMap.entries(tagStats));
    let radius = 25_000_000_000_000;
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

  func computeTrendingScore(stats : TagStats, now : Int, radius : Int) : Int {
    let activityAge = now - stats.lastActivityAt;
    let window = activityAge / radius;
    let remaining = activityAge - (window * radius);

    let adjustedAge = if (remaining < 0) { -remaining } else { remaining };
    let baseScore = stats.postsTotal + stats.repliesTotal;

    let recalculateScore = switch (window) {
      case (0) { baseScore * 10 };
      case (1) { baseScore * 3 };
      case (2) { baseScore * 2 };
      case (3) { baseScore * 1 };
      case (_) { baseScore };
    };
    recalculateScore / (adjustedAge / radius + 1);
  };

  public query func getTagStatsForTag(tag : Text) : async ?TagStats {
    let canonicalTag = getCanonicalTag(tag);
    textMap.get(tagStats, canonicalTag);
  };

  public query func getSubcategoriesForTag(tag : Text) : async [Text] {
    let canonicalTag = getCanonicalTag(tag);

    let subcategories = switch (textMap.get(tagSubcategories, canonicalTag)) {
      case (?subs) { subs };
      case null {
        if (canonicalTag != tag) {
          switch (textMap.get(tagSubcategories, tag)) {
            case (?subs) { subs };
            case null { [] };
          };
        } else { [] };
      };
    };
    subcategories;
  };
};
