class BlackList extends BlackWhiteList {
    constructor() {
        super();
        this.name = 'Blacklist';

        // Mock data
        this.add_rule(new MutedUserProp(Enum_UserProps.NAME, 'Roboto'));
        this.add_rule(new MutedUserProp(Enum_UserProps.NAME, 'test'));
        this.add_rule(new MutedUserProp(Enum_UserProps.ID, 'Test1'));
        this.add_rule(new MutedUserProp(Enum_UserProps.TRIPCODE, 'Test2'));
        this.add_rule(new MutedUserProp(Enum_UserProps.ID, 'Test3'));
        this.add_rule(new MutedUserProp(Enum_UserProps.TRIPCODE, 'Test4'));
        this.add_rule(new MutedUserProp(Enum_UserProps.ID, 'Test5'));
        this.add_rule(new MutedUserProp(Enum_UserProps.TRIPCODE, 'Test6'));

        this.load_from_storage();
    }

    /* Obtain whether or not any property of an user is muteable */
    should_mute_user(user) {
        return this.rules.some(
            (userProp) =>
                // Name matches regex
                (userProp.prop_type === Enum_UserProps.NAME
                    && new RegExp(userProp.prop_val).test(user.name)) ||
                // ID matches
                (userProp.prop_type === Enum_UserProps.ID
                    && user.id === userProp.prop_val) ||
                // Tripcode matches
                (userProp.prop_type === Enum_UserProps.TRIPCODE
                    && user.tripcode === userProp.prop_val) ||
                // Doesn't have a tripcode and option "Mute users without a tripcode" is enabled
                (userProp.prop_type === Enum_UserProps.TRIPCODE
                    && user.tripcode === '' && SETTINGS.is_mute_user_if_no_tripcode())
        );
    }
}
