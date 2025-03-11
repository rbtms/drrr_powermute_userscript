class WhiteList extends BlackWhiteList {
    constructor() {
        super();
        this.name = 'Whitelist';

        // Mock data
        this.add_rule(new MutedUserProp(Enum_UserProps.NAME, 'test'));
        this.add_rule(new MutedUserProp(Enum_UserProps.NAME, 'SomeUser2'));

        this.load_from_storage();
    }

    /* Obtain whether or not any property of an user is muteable */
    should_mute_user(user) {
        // Mutes by default unless any user property matches
        return this.rules.every(
            (userProp) =>
                !(
                    // Name matches regex
                    (userProp.prop_type === Enum_UserProps.NAME
                        && new RegExp(userProp.prop_val).test(user.name)) ||
                    // ID matches
                    (userProp.prop_type === Enum_UserProps.ID
                        && user.id === userProp.prop_val) ||
                    // Tripcode matches
                    (userProp.prop_type === Enum_UserProps.TRIPCODE
                        && user.tripcode === userProp.prop_val)
                )
        );
    }
}
