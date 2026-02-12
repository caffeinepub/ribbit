import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Storage "blob-storage/Storage";

module {
  type Pond = {
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

  type OldSystem = {
    ponds : OrderedMap.Map<Text, Pond>;
  };

  type NewSystem = {
    ponds : OrderedMap.Map<Text, Pond>;
  };

  public func run(old : OldSystem) : NewSystem {
    let textMap = OrderedMap.Make<Text>(Text.compare);
    var newPonds = textMap.empty<Pond>();

    for ((pondName, pond) in textMap.entries(old.ponds)) {
      let updatedPond = {
        pond with
        members = upsertCreatorFirst(pond.members, ?Principal.toText(pond.admin));
        memberCount = computeActualMemberCount(pond.members);
      };
      newPonds := textMap.put(newPonds, pondName, updatedPond);
    };

    { ponds = newPonds };
  };

  func upsertCreatorFirst(members : [Text], creator : ?Text) : [Text] {
    let creatorFirst = Iter.toArray(Iter.map<Text, (Text, Bool)>(Iter.fromArray(members), func(m) { (m, false) }));

    let creatorWithFlag = switch (creator) {
      case (null) { creatorFirst };
      case (?creatorVal) {
        Array.append(creatorFirst, [(creatorVal, true)]);
      };
    };
    let sorted = Array.sort<(Text, Bool)>(
      creatorWithFlag,
      func(a : (Text, Bool), b : (Text, Bool)) : { #less; #equal; #greater } {
        if (a.1 and not b.1) { #less } else if (not a.1 and b.1) { #greater } else { #equal };
      },
    );

    switch (sorted.size()) {
      case (0) { [] };
      case (1) {
        [sorted[0].0];
      };
      case (_) {
        var previous = sorted[0].0;
        var count = 0;
        let deduped = Array.tabulate<Text>(
          sorted.size(),
          func(i) {
            let (cur, _flag) = sorted[i];
            if (i == 0 or cur != previous) {
              previous := cur;
              count += 1;
              cur;
            } else {
              previous := cur;
              previous;
            };
          },
        );
        Array.tabulate<Text>(
          count,
          func(i) {
            deduped[i];
          },
        );
      };
    };
  };

  func computeActualMemberCount(members : [Text]) : Nat {
    var count : Nat = 0;
    var previous : ?Text = null;
    for (cur in Iter.fromArray(members)) {
      switch (previous) {
        case (null) {
          count += 1;
          previous := ?cur;
        };
        case (?prev) {
          if (cur != prev) {
            count += 1;
          };
          previous := ?cur;
        };
      };
    };
    count;
  };
};
