import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
    ponds : OrderedMap.Map<Text, {
      name : Text;
      title : Text;
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
      visibility : { #publicVisibility; #privateVisibility };
      associatedTags : [Text];
      lilyCount : Nat;
    }>;
    posts : OrderedMap.Map<Text, {
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
    }>;
    ribbits : OrderedMap.Map<Text, {
      id : Text;
      postId : Text;
      parentId : ?Text;
      content : Text;
      username : Text;
      timestamp : Int;
    }>;
    userProfiles : OrderedMap.Map<Principal, {
      name : Text;
      joinedPonds : [Text];
      avatar : ?Storage.ExternalBlob;
    }>;
    usernameRegistry : OrderedMap.Map<Text, Bool>;
    usernameChangeHistory : OrderedMap.Map<Text, Int>;
    usernameOwnership : OrderedMap.Map<Text, Principal>;
    principalToUsername : OrderedMap.Map<Principal, Text>;
    tagUsageCount : OrderedMap.Map<Text, Nat>;
    tagMergeRegistry : OrderedMap.Map<Text, Text>;
    initializedUsers : [Principal];
    adminPrincipal : ?Principal;
    usernameAvatars : OrderedMap.Map<Text, Storage.ExternalBlob>;
    postLikes : OrderedMap.Map<Text, OrderedMap.Map<Principal, Bool>>;
    ribbitLikes : OrderedMap.Map<Text, OrderedMap.Map<Principal, Bool>>;
    postActivity : OrderedMap.Map<Text, {
      id : Text;
      type_ : { #post; #ribbit; #like; #viewRibbit };
      targetId : Text;
      timestamp : Int;
      username : Text;
      pond : Text;
    }>;
    ribbitActivity : OrderedMap.Map<Text, {
      id : Text;
      type_ : { #post; #ribbit; #like; #viewRibbit };
      targetId : Text;
      timestamp : Int;
      username : Text;
      pond : Text;
    }>;
    likeActivity : OrderedMap.Map<Text, {
      id : Text;
      type_ : { #post; #ribbit; #like; #viewRibbit };
      targetId : Text;
      timestamp : Int;
      username : Text;
      pond : Text;
    }>;
  };

  type NewActor = {
    ponds : OrderedMap.Map<Text, {
      name : Text;
      title : Text;
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
      visibility : { #publicVisibility; #privateVisibility };
      associatedTags : [Text];
      lilyCount : Nat;
    }>;
    posts : OrderedMap.Map<Text, {
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
    }>;
    ribbits : OrderedMap.Map<Text, {
      id : Text;
      postId : Text;
      parentId : ?Text;
      content : Text;
      username : Text;
      timestamp : Int;
    }>;
    userProfiles : OrderedMap.Map<Principal, {
      name : Text;
      joinedPonds : [Text];
      avatar : ?Storage.ExternalBlob;
    }>;
    usernameRegistry : OrderedMap.Map<Text, Bool>;
    usernameChangeHistory : OrderedMap.Map<Text, Int>;
    usernameOwnership : OrderedMap.Map<Text, Principal>;
    principalToUsername : OrderedMap.Map<Principal, Text>;
    tagUsageCount : OrderedMap.Map<Text, Nat>;
    tagMergeRegistry : OrderedMap.Map<Text, Text>;
    initializedUsers : [Principal];
    adminPrincipal : ?Principal;
    usernameAvatars : OrderedMap.Map<Text, Storage.ExternalBlob>;
    postLikes : OrderedMap.Map<Text, OrderedMap.Map<Principal, Bool>>;
    ribbitLikes : OrderedMap.Map<Text, OrderedMap.Map<Principal, Bool>>;
    postActivity : OrderedMap.Map<Text, {
      id : Text;
      type_ : { #post; #ribbit; #like; #viewRibbit };
      targetId : Text;
      timestamp : Int;
      username : Text;
      pond : Text;
    }>;
    ribbitActivity : OrderedMap.Map<Text, {
      id : Text;
      type_ : { #post; #ribbit; #like; #viewRibbit };
      targetId : Text;
      timestamp : Int;
      username : Text;
      pond : Text;
    }>;
    likeActivity : OrderedMap.Map<Text, {
      id : Text;
      type_ : { #post; #ribbit; #like; #viewRibbit };
      targetId : Text;
      timestamp : Int;
      username : Text;
      pond : Text;
    }>;
  };

  public func run(old : OldActor) : NewActor {
    {
      ponds = old.ponds;
      posts = old.posts;
      ribbits = old.ribbits;
      userProfiles = old.userProfiles;
      usernameRegistry = old.usernameRegistry;
      usernameChangeHistory = old.usernameChangeHistory;
      usernameOwnership = old.usernameOwnership;
      principalToUsername = old.principalToUsername;
      tagUsageCount = old.tagUsageCount;
      tagMergeRegistry = old.tagMergeRegistry;
      initializedUsers = old.initializedUsers;
      adminPrincipal = old.adminPrincipal;
      usernameAvatars = old.usernameAvatars;
      postLikes = old.postLikes;
      ribbitLikes = old.ribbitLikes;
      postActivity = old.postActivity;
      ribbitActivity = old.ribbitActivity;
      likeActivity = old.likeActivity;
    };
  };
};

