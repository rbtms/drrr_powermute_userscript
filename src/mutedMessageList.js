class MutedMessageList extends BlackWhiteList {
    constructor() {
        super();
        this.name = 'MutedMessageList';

        // Mock data
        this.add_rule(new MutedUserProp(Enum_MutedMessageActions.MUTE, 'muteme'));
        this.add_rule(new MutedUserProp(Enum_MutedMessageActions.BLACKLIST_NAME, 'blacklistme'));
        this.add_rule(new MutedUserProp(Enum_MutedMessageActions.MUTE_AND_BAN, 'muteandbanme'));
        this.add_rule(new MutedUserProp(Enum_MutedMessageActions.MUTE_AND_BR, 'muteandbrme'));
        this.add_rule(new MutedUserProp(Enum_MutedMessageActions.BAN, 'banme'));
        this.add_rule(new MutedUserProp(Enum_MutedMessageActions.BR, 'brme'));

        this.load_from_storage();
    }

    add_talk_user_to_blacklist(talk) {
        const was_added = BLACKLIST.add_rule(new MutedUserProp(Enum_UserProps.NAME, talk.user.name));

        if(was_added) {
            BLACKLIST.save_to_storage();
        
            // Add rule to UI without a need to reload
            const rule = new MutedUserProp(Enum_UserProps.NAME, talk.user.name)
            // TODO: PROTOTYPE??????????
            jQuery('#settings-Blacklist .setting-content').append(UI.create_list_rule_elem(BLACKLIST, rule));
            
            console.log('User ' + talk.user.name + ' added to blacklist.');
        }
    }

    kick_talk_user(talk) {
        jQuery.post('https://drrr.com/room/?ajax=1', 'kick=' + talk.user.id);
    }

    ban_talk_user(talk) {
        jQuery.post('https://drrr.com/room/?ajax=1', 'ban=' + talk.user.id);
    }

    br_talk_user(talk) {
        jQuery.post('https://drrr.com/room/?ajax=1', 'report_and_ban_user=' + talk.user.id);
    }

    should_process_talk(talk) {
        return this.rules.some( (rule) =>
            new RegExp(rule.prop_val).test(talk.message)
        );
    }

    process_talk(talk) {
        const action = this.rules.find((rule) => new RegExp(rule.prop_val).test(talk.message)).prop_type;

        switch(action) {
            case Enum_MutedMessageActions.MUTE: {
                return true;
            }
            case Enum_MutedMessageActions.KICK: {
                this.kick_talk_user(talk);
                return false; // Don't block the event
            }
            case Enum_MutedMessageActions.BLACKLIST_NAME: {
                this.add_talk_user_to_blacklist(talk);
                return true;
            }
            case Enum_MutedMessageActions.MUTE_AND_KICK: {
                this.kick_talk_user(talk);
                return true;
            }
            case Enum_MutedMessageActions.MUTE_AND_BAN: {
                this.ban_talk_user(talk);
                return true;
            }
            case Enum_MutedMessageActions.MUTE_AND_BR: {
                this.br_talk_user(talk);
                return true;
            }
            case Enum_MutedMessageActions.BAN: {
                this.ban_talk_user(talk);
                return false; // Don't block the event
            }
            case Enum_MutedMessageActions.BR: {
                this.br_talk_user(talk);
                return false; // Don't block the event
            }
        }
    }
}
