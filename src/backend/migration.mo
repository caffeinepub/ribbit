import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import Principal "mo:base/Principal";

import Storage "blob-storage/Storage";

module {

  type OldPond = {
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
    visibility : {
      #publicVisibility;
      #privateVisibility;
    };
    associatedTags : [Text];
    lilyCount : Nat;
  };

  type NewPond = {
    name : Text;
    description : Text;
    image : ?Storage.ExternalBlob;
    profileImage : ?Storage.ExternalBlob;
    bannerImage : ?Storage.ExternalBlob;
    createdAt : Int;
    memberCount : Nat;
    members : [Text];
    moderators : [Principal];
    admin : Principal;
    rules : [Text];
    visibility : {
      #publicVisibility;
      #privateVisibility;
    };
    associatedTags : [Text];
    lilyCount : Nat;
  };

  public type OldActor = {
    ponds : OrderedMap.Map<Text, OldPond>;
  };

  public type NewActor = {
    ponds : OrderedMap.Map<Text, NewPond>;
  };

  public func run(old : OldActor) : NewActor {
    let textMap = OrderedMap.Make<Text>(Text.compare);

    let newPonds = textMap.map<OldPond, NewPond>(
      old.ponds,
      func(_key, oldPond) {
        let newMembers : [Text] = Array.map<Principal, Text>(
          oldPond.members,
          func(principal) {
            Principal.toText(principal);
          }
        );

        {
          oldPond with
          members = newMembers;
        };
      },
    );

    let pondCount = textMap.size(newPonds);
    if (pondCount > 0) {
      Debug.print("Pond membership migration complete for " # Nat.toText(pondCount) # " ponds.");
    };

    { ponds = newPonds };
  };
};

