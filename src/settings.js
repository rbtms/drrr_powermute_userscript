// TODO: Take settings into account
class Settings {
    constructor() {
        // Default values
        this.KEY_LOCALSTORAGE = 'PM_Settings';
        this.KEY_IS_ENABLED = 'is_enabled';
        this.KEY_LIST_TYPE = 'list_type';
        this.KEY_MUTE_USER_IF_NO_TRIPCODE = 'mute_user_if_no_tripcode';
        this.KEY_BAN_REPEATING_MESSAGES = 'ban_repeating_messages';

        // If the muting is enabled
        this._is_enabled = true;
        // Blacklist/whitelist
        this._list_type = Enum_ListType.BLACKLIST;
        // Mute users automatically if they don't have a tripcode
        this._mute_user_if_no_tripcode = false;
        // B&R users which post repeated messages
        this._ban_repeating_messages = false;

        this.load_from_storage();
    }

    is_enabled() {
        return this._is_enabled;
    }

    set_enabled(val) {
        this._is_enabled = val;
        this.save_to_storage();
    }

    is_mute_user_if_no_tripcode() {
        return this._mute_user_if_no_tripcode;
    }

    is_ban_repeating_messages() {
        return this._ban_repeating_messages;
    }

    set_mute_user_if_no_tripcode(val) {
        this._mute_user_if_no_tripcode = val;
        this.save_to_storage();
    }

    set_ban_repeating_messages(val) {
        this._ban_repeating_messages = val;
        this.save_to_storage();
    }

    get_list_type() {
        return this._list_type;
    }

    set_list_type(val) {
        this._list_type = val;
        this.save_to_storage();
    }

    load_from_storage() {
        const settings_json_str = localStorage.getItem(this.KEY_LOCALSTORAGE);

        if (settings_json_str !== null) {
            const settings_json = JSON.parse(settings_json_str);
            console.info('[DRRR Power Mute] LOADED SETTINGS', settings_json);

            this._is_enabled = settings_json[this.KEY_IS_ENABLED];
            this._list_type = Enum_ListType[settings_json[this.KEY_LIST_TYPE]];
            this._mute_user_if_no_tripcode = settings_json[this.KEY_MUTE_USER_IF_NO_TRIPCODE];
            this._ban_repeating_messages = settings_json[this.KEY_BAN_REPEATING_MESSAGES];
        } else {
            // Initial localstorage save
            this.save_to_storage();
        }
    }

    save_to_storage() {
        // Note: "this." can't be used as a json key
        const settings_json = {};
        settings_json[this.KEY_IS_ENABLED] = this._is_enabled;
        settings_json[this.KEY_LIST_TYPE] = this._list_type.description;
        settings_json[this.KEY_MUTE_USER_IF_NO_TRIPCODE] = this._mute_user_if_no_tripcode;
        settings_json[this.KEY_BAN_REPEATING_MESSAGES] = this._ban_repeating_messages;

        localStorage.setItem(this.KEY_LOCALSTORAGE, JSON.stringify(settings_json));
        console.info('[DRRR Power Mute] SAVED SETTINGS', settings_json);
    }

    export() {
        // TODO
    }

    import() {
        // TODO
    }
}
