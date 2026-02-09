// migration.mo
import Text "mo:base/Text";
import OrderedMap "mo:base/OrderedMap";
import Principal "mo:base/Principal";
import Storage "blob-storage/Storage";

module {
    // Old and new Ribbit types - need to convert between them
    type OldRibbit = {
        id : Text;
        postId : Text;
        parentId : ?Text;
        content : Text;
        username : Text;
        timestamp : Int;
    };

    type NewRibbit = {
        id : Text;
        postId : Text;
        parentId : ?Text;
        content : Text;
        username : Text;
        timestamp : Int;
        image : ?Storage.ExternalBlob;
    };

    // Old and new actor types - only ribbits field changes
    type OldActor = {
        var ribbits : OrderedMap.Map<Text, OldRibbit>;
    };

    type NewActor = {
        var ribbits : OrderedMap.Map<Text, NewRibbit>;
    };

    // Migration function - convert old ribbits to new structure
    public func run(old : OldActor) : NewActor {
        let textMap = OrderedMap.Make<Text>(Text.compare);
        let ribbits = textMap.map<OldRibbit, NewRibbit>(
            old.ribbits,
            func(_id, oldRibbit) {
                // Convert each old Ribbit to the new type (with null image)
                {
                    oldRibbit with
                    image = null;
                };
            },
        );

        // Return new actor state with migrated ribbits
        { var ribbits };
    };
};
