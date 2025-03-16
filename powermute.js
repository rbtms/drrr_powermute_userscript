// ==UserScript==
// @name         DRRR.com PowerMute
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Muting tools for drrr.com
// @author       Robo
// @match        https://drrr.com/room/*
// @grant        none
// ==/UserScript==

(async function (jQuery) {
    'use strict';
    const API_URL = 'https://drrr.com/room/?api=json';
    
    // Mute list types
    const Enum_ListType = Object.freeze({
        BLACKLIST: Symbol('BLACKLIST'),
        WHITELIST: Symbol('WHITELIST'),
    });
    
    // Properties of a user
    const Enum_UserProps = Object.freeze({
        NAME: Symbol('NAME'),
        ID: Symbol('ID'),
        TRIPCODE: Symbol('TRIPCODE'),
    });
    
    // Properties of a muted message
    const Enum_MutedMessageActions = Object.freeze({
        MUTE: Symbol('MUTE'),
        KICK: Symbol('KICK'),
        BLACKLIST_NAME: Symbol('BLACKLIST_NAME'),
        MUTE_AND_KICK: Symbol('MUTE_AND_KICK'),
        MUTE_AND_BAN: Symbol('MUTE_AND_BAN'),
        MUTE_AND_BR: Symbol('MUTE_AND_BR'),
        BAN: Symbol('BAN'),
        BR: Symbol('BR')
    });

    // Talk wrapper class
    class Talk {
        constructor(talk) {
            this.id = talk['id'];
            this.loudness = talk['loudness'];
            // /me messages have the text in the property 'content' instad of 'message'
            this.message = talk['content'] || talk['message'];
            this.time = talk['time'];
            this.type = talk['type'];
            this.reason = talk['reason'] || '';
    
            // TODO: Assuming only one element. Not sure if there is any other possibility,
            // since it's a single talk.
            // 'message' talks have the user in 'from'
            // 'join' talks have it on 'user'
            // 'user-profile' talks have it on an element called '+' or '-', which is an array
            // and presumely indicates if an user enters or leaves the room
            this.user = new User(talk['from'] || talk['user'] || (talk['+'] ? talk['+'][0] : false) || (talk['-'] ? talk['-'][0] : false));
        }
    
        // Check if the message matches a specific regex
        message_matches_regex(r) {
            return new RegExp(r).exec(this.message) === null;
        }
    }

    // User wrapper class
    class User {
        constructor(user_json) {
            this.device = user_json.device;
            this.icon = user_json.icon;
            this.id = user_json.id;
            this.name = user_json.name;
            this.tripcode = user_json.tripcode == false ? '' : user_json.tripcode;
        }
    }

    // Container class for tuples with (user property, property value)
    class MutedUserProp {
        constructor(prop_type, prop_val) {
            this.prop_type = prop_type;
            this.prop_val = prop_val;
        }
    
        set_val(val) {
            this.prop_val = val;
        }
    }

    // Abstract class
    class BlackWhiteList {
        constructor() {
            this.rules = [];
            this.name = 'BlackWhiteList'; // Placeholder value
        }
    
        add_elem(elem) {
            this.rules.push(elem);
        }
    
        get_elems() {
            return this.rules;
        }
    
        add_rule(rule) {
            console.log(rule, this.rules);
            const has_rule = this.rules.some((_rule) =>
                _rule.prop_type === rule.prop_type && _rule.prop_val === rule.prop_val
            );
    
            // Add rule only if it doesn't exist aleady, except if it's empty.
            // In any case empty rules are filtered on save
            if (!has_rule) {
                this.add_elem(rule);
                return true;
            } else {
                console.log(this.name + ': Rule already exists.');
                return false;
            }
        }
    
        remove_rule(rule) {
            console.log('CALLED: remove_rule');
    
            for (const _rule of this.rules) {
                if (_rule.prop_type === rule.prop_type && _rule.prop_val === rule.prop_val) {
                    console.log('RULE FOUND');
    
                    this.rules.splice(this.rules.indexOf(rule), 1);
                } else {
                    console.log('RULE NOT FOUND', rule, _rule);
                }
            }
        }
    
        save_to_storage() {
            console.log(this.rules);
            const json = this.rules.filter((rule) => rule.prop_val != '').map((rule) => [rule.prop_type.description, rule.prop_val]);
            localStorage.setItem('PM_' + this.name, JSON.stringify(json));
    
            console.info('[DRRR Power Mute] SAVED ' + this.name + ' TO STORAGE', JSON.stringify(json));
        }
    
        load_from_storage() {
            const json_str = localStorage.getItem('PM_' + this.name);
    
            if (json_str !== null) {
                if(this.name === 'MutedMessageList') {
                    console.log(Enum_MutedMessageActions['B&R']);
                    this.rules = JSON.parse(json_str).map((prop) => new MutedUserProp(Enum_MutedMessageActions[prop[0]], prop[1]));   
                } else {
                    this.rules = JSON.parse(json_str).map((prop) => new MutedUserProp(Enum_UserProps[prop[0]], prop[1]));
                }
    
                console.log('[DRRR Power Mute] LOADED ' + this.name + ' FROM STORAGE', this.rules);
            } else {
                this.save_to_storage();
            }
        }
    }

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

    class SPAMDetector {
        constructor() {
            this.LAST_TALK_BUFFER_MAX_SIZE = 100;
            this.BASE_SPAM_LENGTH = 50;
            // It receives 2 messages for each event, for some reason. So this would
            // equal to 3 messages
            this.REPEATING_MESSAGES_TO_BAN = 6;
            this.lastTalkBuffer = [];
        }
    
        append_talk_to_buffer(talk) {
            if(this.lastTalkBuffer.length > this.lastTalkBuffer) {
                // Rotate buffer
                for(let i = this.lastTalkBuffer-1; i > 0; i--) {
                    this.lastTalkBuffer[i] = this.lastTalkBuffer[i-1];
                }
    
                this.lastTalkBuffer[0] = talk;
            } else {
                this.lastTalkBuffer.unshift(talk);
            }
        }
    
        /* Returns true if the last x messages are the same */
        has_repeating_messages() {
            for(let i = 1; i < this.REPEATING_MESSAGES_TO_BAN+1; i++) {
                if(this.lastTalkBuffer.length <= i
                    || (this.lastTalkBuffer[0].message != this.lastTalkBuffer[i].message)) {
                        return false;
                }
            }
    
            return true;
        }
    
        _message_has_too_few_spaces(message) {
            const space_threshold_per_10_chars = 1;
            const number_of_spaces = message.replace(/[^\s]/g, '')
            return number_of_spaces.length < message.length/(space_threshold_per_10_chars*10);
        }
    
        _message_has_too_many_non_alpha_chars(message) {
            const alpha_char_threshold = 0.4; // 40%
            const non_alpha_chars = message.replace(/[a-zA-Z\s]/g, '');
            return non_alpha_chars.length > message.length*alpha_char_threshold;
        }
    
        /*
            Heuristic random SPAM detection. Note: It will probably detect
            non-ascii languages as false positives.
        */
        is_random_message(talk) {
            const message = talk.message;
            return message.length >= this.BASE_SPAM_LENGTH
                && (this._message_has_too_few_spaces(message)
                || this._message_has_too_many_non_alpha_chars(message));
        }
    
        last_messages_were_too_fast() {
            const min_time_offset_ms = 4000; // 4s
            
            return this.lastTalkBuffer.length > 2 // Last 2 messages
                && this.lastTalkBuffer[0].message.length > this.BASE_SPAM_LENGTH
                && this.lastTalkBuffer[1].message.length > this.BASE_SPAM_LENGTH
                && this.lastTalkBuffer[0].time - this.lastTalkBuffer[1].time < min_time_offset_ms;
        }
    
        is_talk_spam(talk) {
            this.append_talk_to_buffer(talk);
    
            return this.has_repeating_messages(talk)
                || this.is_random_message(talk)
                || this.last_messages_were_too_fast();
        }
    }
    /*
    function test_generateRandomString(length) {
        let result = '';
        
        // ASCII characters from 32 (space) to 126 (~)
        for (let i = 0; i < length; i++) {
          const randomCharCode = Math.floor(Math.random() * (126 - 32 + 1)) + 32;
          result += String.fromCharCode(randomCharCode);
        }
      
        return result;
      }
    
    function test_mock_talk(msg, uid) {
        return { time: new Date().getTime(), message: msg, user: { id: uid } };
    }
    
    function test_spam() {
        spamDetector = new SPAMDetector();
    
        for(let i = 0; i < 10; i++) {
            //let msg = i%2 == 0 ? 'a' : 'b';
            //let msg = 'hey man whats up whats up whats up whats up whats up whats up whats up whats up whats up ' + i;
            let msg = "=;M]4#|C/.b&|{&hVTu5SwNIB}k6hOeT95]>r5-bq`qFuf4%O|;(Jr+TWbtAC\\clbaci}jPGn?k&ze*16[`7m[<g6G0$:aU b,:";
            let uid = 2;
            console.log(i, spamDetector.is_talk_spam(test_mock_talk(msg, uid)))
        }
    }
    
    test_spam();
    // */

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

    // UI operations
    class _UI {
        constructor() {
            this.add_settings_tabs();
        }
    
        // TODO: Hide system messages, which are span and not div
        hide_messages_with_name(name) {
            console.info('MUTING USER WITH NAME', name);
    
            // Talks from a specific user
            const talks = jQuery('#talks div.name').filter((_, elem) => elem.children[0].textContent === name);
    
            // System messages from a specific user
            const messages = jQuery('#talks span.name').filter((_, elem) => elem.textContent === name);
    
            talks
                .toArray()
                .concat(messages.toArray())
                .forEach((elem) => {
                    jQuery(elem.parentElement.parentElement).hide();
                });
        }
    
        create_blacklist_tab() {
            const tab_blacklist = jQuery(
                '<li role="presentation" id="settings-Blacklist-tab" class="">' +
                    '<a href="#settings-Blacklist" aria-controls="settings-Blacklist" role="tab" data-toggle="tab" aria-expanded="false">' +
                    'Blacklist' +
                    '</a>' +
                    '</li>'
            );
    
            const panel_blacklist = jQuery(`
                <div role="tabpanel" class="tab-pane" id="settings-Blacklist">
                    <div class="setting-content"></div>
                    <div class="blacklist-save-button-container" style="align: center">
                        <input type="submit" id="blacklist-add-rule-button" class="form-control list-add-rule-button" name="post" value="Add rule" tabindex="3" style="display: inline-block; max-width:49%;">
                        <input type="submit" id="blacklist-save-button" class="form-control list-save-button" name="post" value="Save" tabindex="3" style="display: inline-block; max-width:49%;">
                    </div>
            </div>`);
    
            // Save button
            panel_blacklist.find('#blacklist-save-button').on('click', function () {
                BLACKLIST.save_to_storage();
            });
    
            const this_ui = this;
            // Add rule button
            panel_blacklist.find('#blacklist-add-rule-button').on('click', function () {
                const rule = new MutedUserProp(Enum_UserProps.NAME, '');
                const added_rule = BLACKLIST.add_rule(rule);
    
                if (added_rule) {
                    jQuery('#settings-Blacklist .setting-content').append(this_ui.create_list_rule_elem(BLACKLIST, rule));
                }
            });
    
            return [tab_blacklist, panel_blacklist];
        }
    
        create_whitelist_tab() {
            const tab_whitelist = jQuery(
                '<li role="presentation" id="settings-Whitelist-tab" class="">' +
                    '<a href="#settings-Whitelist" aria-controls="settings-Whitelist" role="tab" data-toggle="tab" aria-expanded="false">' +
                    'Whitelist' +
                    '</a>' +
                    '</li>'
            );
    
            const panel_whitelist = jQuery(`
                <div role="tabpanel" class="tab-pane" id="settings-Whitelist">
                    <div class="setting-content"></div>
                    <div class="whitelist-save-button-container" style="align: center">
                        <input type="submit" id="whitelist-add-rule-button" class="form-control list-add-rule-button" name="post" value="Add rule" tabindex="3" style="display: inline-block; max-width:49%;">
                        <input type="submit" id="whitelist-save-button" class="form-control list-save-button" name="post" value="Save" tabindex="3" style="display: inline-block; max-width:49%;">
                    </div>
            </div>`);
    
            // Save button
            panel_whitelist.find('#whitelist-save-button').on('click', function () {
                WHITELIST.save_to_storage();
            });
    
            const this_ui = this;
            // Add rule button
            panel_whitelist.find('#whitelist-add-rule-button').on('click', function () {
                const rule = new MutedUserProp(Enum_UserProps.NAME, '');
                const added_rule = WHITELIST.add_rule(rule);
    
                if (added_rule) {
                    jQuery('#settings-Whitelist .setting-content').append(this_ui.create_list_rule_elem(WHITELIST, rule));
                }
            });
    
            return [tab_whitelist, panel_whitelist];
        }
    
        create_messages_tab() {
            const tab_pm_messages = jQuery(
                '<li role="presentation" id="settings-MutedMessageList-tab" class="">' +
                    '<a href="#settings-MutedMessageList" aria-controls="settings-MutedMessageList" role="tab" data-toggle="tab" aria-expanded="false">' +
                    'Muted Messages' +
                    '</a>' +
                    '</li>'
            );
    
            const panel_pm_messages = jQuery(`
                <div role="tabpanel" class="tab-pane" id="settings-MutedMessageList">
                    <div class="setting-content"></div>
                    <div class="mutedmessagelist-save-button-container" style="align: center">
                        <input type="submit" id="mutedmessagelist-add-rule-button" class="form-control list-add-rule-button" name="post" value="Add rule" tabindex="3" style="display: inline-block; max-width:49%;">
                        <input type="submit" id="mutedmessagelist-save-button" class="form-control list-save-button" name="post" value="Save" tabindex="3" style="display: inline-block; max-width:49%;">
                    </div>
            </div>`);
    
            // Save button
            panel_pm_messages.find('#mutedmessagelist-save-button').on('click', function () {
                MUTED_MESSAGE_LIST.save_to_storage();
            });
    
            const this_ui = this;
            // Add rule button
            panel_pm_messages.find('#mutedmessagelist-add-rule-button').on('click', function () {
                // TODO: Rename MutedUserProp
                const rule = new MutedUserProp(Enum_MutedMessageActions.MUTE, '');
                const added_rule = MUTED_MESSAGE_LIST.add_rule(rule);
    
                if (added_rule) {
                    jQuery('#settings-MutedMessageList .setting-content').append(this_ui.create_list_rule_elem(MUTED_MESSAGE_LIST, rule));
                }
            });
    
    
            return [tab_pm_messages, panel_pm_messages];
        }
    
        create_pm_settings_tab() {
            const tab_pm_settings = jQuery(
                '<li role="presentation" id="settings-pm-settings-tab" class="">' +
                    '<a href="#settings-pm-settings" aria-controls="settings-pm-settings" role="tab" data-toggle="tab" aria-expanded="false">' +
                        'PM Settings' +
                    '</a>' +
                '</li>'
            );
    
            const panel_pm_settings = jQuery(`
                <div role="tabpanel" class="tab-pane" id="settings-pm-settings">
                    <div class="setting-content">
                        
                        <div id="pm-settings-enable" class="checkbox">
                            <label><div>
                                <input type="checkbox" id="checkbox-pm-settings-enable"` +
                    (SETTINGS.is_enabled() ? 'checked' : '') +
                    `>
                                    <h5 class="mb-0">Enable PowerMute </h5>
                            </div></label>
                        </div>
    
                        <div id="pm-list-switch">
                                <h5 class="mb-0" style="display: inline-block">Blacklist</h5>
                            <input type="range" id="list-switch" name="list-switch min="0" max="1" style="max-width: 10%; display: inline-block;"
                                ` +
                    'value=' +
                    (SETTINGS.get_list_type() === Enum_ListType.BLACKLIST ? 0 : 1) +
                    `>
                                <h5 class="mb-0" style="display: inline-block"> Whitelist</h5>
                        </div>
                        
                        <div id="pm-settings-mute-ban-repeating-messages" class="checkbox">
                            <label><div>
                                <input type="checkbox" id="checkbox-pm-settings-ban-repeating-messages"` +
                    (SETTINGS.is_ban_repeating_messages() ? 'checked' : '') +
                    `>
                                    <h5 class="mb-0">Ban SPAM (Agressive. Might have false positives.)</h5>
                            </div></label>
                        </div>
    
                        <div id="pm-settings-mute-no-trip" class="checkbox">
                            <label><div>
                                <input type="checkbox" id="checkbox-pm-settings-mute-no-trip"` +
                    (SETTINGS.is_mute_user_if_no_tripcode() ? 'checked' : '') +
                    `>
                                    <h5 class="mb-0">Mute users without a tripcode (Blacklist only)</h5>
                            </div></label>
                        </div>
    
                    </div>
            </div>`
            );
    
            /*
                Set events
            */
    
            // Enable/disable checkbox
            panel_pm_settings.find('#checkbox-pm-settings-enable').on('click', function (elem) {
                SETTINGS.set_enabled(elem.currentTarget.checked);
            });
    
            // Blacklist/whitelist switch
            panel_pm_settings.find('#list-switch').on('change', function (elem) {
                // 0: Blacklist, 1: Whitelist
                const list_type = elem.currentTarget.value == 0 ? Enum_ListType.BLACKLIST : Enum_ListType.WHITELIST;
                SETTINGS.set_list_type(list_type);
            });
    
            // Ban repeating messages
            panel_pm_settings.find('#checkbox-pm-settings-ban-repeating-messages').on('click', function (elem) {
                SETTINGS.set_ban_repeating_messages(elem.currentTarget.checked);
            });
    
            // Mute people with no tripcode checkbox
            panel_pm_settings.find('#checkbox-pm-settings-mute-no-trip').on('click', function (elem) {
                SETTINGS.set_mute_user_if_no_tripcode(elem.currentTarget.checked);
            });
    
            return [tab_pm_settings, panel_pm_settings];
        }
    
        add_settings_tabs() {
            const [tab_blacklist, panel_blacklist] = this.create_blacklist_tab();
            const [tab_whitelist, panel_whitelist] = this.create_whitelist_tab();
            const [tab_pm_messages, panel_pm_messages] = this.create_messages_tab();
            const [tab_pm_settings, panel_pm_settings] = this.create_pm_settings_tab();
    
            jQuery('.nav.nav-tabs').append(tab_blacklist, tab_whitelist, tab_pm_messages, tab_pm_settings);
            jQuery('.tab-content').append(panel_blacklist, panel_whitelist, panel_pm_messages, panel_pm_settings);
        }
    
        // Rule DOM element builder method
        create_list_rule_elem(list, userProp) {
            const text_id = Math.ceil(Math.random() * 10000).toString();
    
            const elem = jQuery(
                `<div class="input-group input-group-sm pm-rule-container" style="padding-bottom: 6px">
                    <div class="input-group-btn">
                        <button type="button" class="btn btn-default dropdown-toggle pm-list-rule-type-button" data-toggle="dropdown"
                        aria-haspopup="true" aria-expanded="false" style="min-width: 10vw; max-width: 12vw; font-size: 15px; border-radius: 0px;">
                            ${userProp.prop_type.description.charAt(0).toUpperCase() + userProp.prop_type.description.substring(1).toLowerCase()} <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu">` + (list.name === MutedMessageList.name
                        // Muted message action types
                        ? `<li><a href="#" class="dropdown-item" data-rule-type="${Enum_MutedMessageActions.MUTE.description.toLowerCase()}">Mute</a></li>
                           <li><a href="#" class="dropdown-item" data-rule-type="${Enum_MutedMessageActions.MUTE_AND_KICK.description.toLowerCase()}">Mute_and_kick</a></li>
                           <li><a href="#" class="dropdown-item" data-rule-type="${Enum_MutedMessageActions.MUTE_AND_BAN.description.toLowerCase()}">Mute_and_ban</a></li>
                           <li><a href="#" class="dropdown-item" data-rule-type="${Enum_MutedMessageActions.MUTE_AND_BR.description.toLowerCase()}">Mute_and_br</a></li>
                           <li><a href="#" class="dropdown-item" data-rule-type="${Enum_MutedMessageActions.BLACKLIST_NAME.description.toLowerCase()}">Blacklist_name</a></li>
                           <li><a href="#" class="dropdown-item" data-rule-type="${Enum_MutedMessageActions.KICK.description.toLowerCase()}">Kick</a></li>
                           <li><a href="#" class="dropdown-item" data-rule-type="${Enum_MutedMessageActions.BAN.description.toLowerCase()}">Ban</a></li>
                           <li><a href="#" class="dropdown-item" data-rule-type="${Enum_MutedMessageActions.BR.description.toLowerCase()}">Br</a></li>`
                        // Blacklist/Whitelist types
                        : `<li><a href="#" class="dropdown-item" data-rule-type="${Enum_UserProps.NAME.description.toLowerCase()}">Name</a></li>
                           <li><a href="#" class="dropdown-item" data-rule-type="${Enum_UserProps.ID.description.toLowerCase()}">Id</a></li>
                           <li><a href="#" class="dropdown-item" data-rule-type="${Enum_UserProps.TRIPCODE.description.toLowerCase()}">Tripcode</a></li>`)
                        + `</ul>
                    </div>
                    <input type="text" id="pm-list-rule-${text_id}" name="list_rule" class="form-control rule-input form-inline input-sm" 
                        value="${userProp.prop_val}">
                    <span class="input-group-btn">
                        <input type="button" name="play" class="btn btn-default btn-sm pm-list-rule-remove-button pm-list-rule-${text_id}" value="X">
                    </span>
                </div>`
            );
    
            // Remove rule
            elem.find('.pm-list-rule-remove-button').on('click', function () {
                elem.remove();
                list.remove_rule(userProp);
    
                console.info('[DRRR Power Mute] Removed rule from ' + list.name + ':', userProp);
            });
    
            // Modify rule value
            elem.find('.rule-input').on('change', function (elem) {
                userProp.set_val(elem.currentTarget.value);
            });
    
            // Change rule type
            elem.find('.dropdown-menu .dropdown-item').on('click', function (event) {
                event.preventDefault();
                const selectedRuleType = jQuery(this).data('rule-type');
    
                elem.find('.pm-list-rule-type-button')
                    .text(selectedRuleType.charAt(0).toUpperCase() + selectedRuleType.substring(1).toLowerCase() + ' ')
                    .append('<span class="caret"></span>');
    
                // TODO: Save the type
                if(list.name === MutedMessageList.name) {
                    userProp.prop_type = Enum_MutedMessageActions[selectedRuleType.toUpperCase()];
                } else {
                    userProp.prop_type = Enum_UserProps[selectedRuleType.toUpperCase()];
                }
                console.info('[DRRR Power Mute] Changed rule type:', selectedRuleType, userProp);
            });
    
            return elem;
        }
    
        // Add the rules to the setting panel of a given list
        populate_list_rules(list) {
            console.log('populate ' + list.name, list.get_elems());
            const userProps = list.get_elems();
    
            userProps.forEach((userProp) => {
                const rule = this.create_list_rule_elem(list, userProp);
                jQuery('#settings-' + list.name + ' .setting-content').append(rule);
            });
        }
    }

    class Websocket {
        constructor() {
            // Array with the last talks to detect spam
            this.LAST_TALK_BUFFER = [];
            this.LAST_TALK_BUFFER_MAX_SIZE = 10;
            this.spamDetector = new SPAMDetector();
        }
    
        /* Handle self connect */
        async handle_connect() {
            const res = await fetch(API_URL);
            const data = await res.json();
    
            try {
                for (const user_json of data['room']['users']) {
                    const user = new User(user_json);
    
                    if (CURRENT_LIST.should_mute_user(user)) {
                        UI.hide_messages_with_name(user.name);
                    }
                }
    
                for (const talk of data['room']['talks']) {
                    // TODO
                }
            } catch (error) {
                console.error("Couldn't parse API data", error);
            }
        }
    
        /* Handle a new talk */
        handle_new_talk(data) {
            const talks = data.map((d) => new Talk(d));
            const ignored_types = ['knock'];
            let is_event_blocked = false;
    
            talks.forEach((talk) => {
                // New message
                if (talk.type === 'message') {
                    is_event_blocked = CURRENT_LIST.should_mute_user(talk.user);
                    
                    // TODO: Show UI message
                    if(MUTED_MESSAGE_LIST.should_process_talk(talk)) {
                        is_event_blocked = MUTED_MESSAGE_LIST.process_talk(talk);
                    }
    
                    // TODO: Change settings attribute name
                    if(SETTINGS.is_ban_repeating_messages()) {
                        if(this.spamDetector.is_talk_spam(talk)) {
                            MUTED_MESSAGE_LIST.br_talk_user(talk); // TODO: Move to a third module
                        }
                    }
                // User gets in
                } else if (talk.type === 'join' || (talk.type === 'user-profile' && talk.reason != 'leave')) {
                    console.info('[DRRR Power Mute] USER INCOMING', talk.user);
                    is_event_blocked = CURRENT_LIST.should_mute_user(talk.user);
                } else if (talk.type === 'leave' || (talk.type === 'user-profile' && talk.reason == 'leave')) {
                    console.info('[DRRR Power Mute] USER OUTGOING', talk.user);
                    is_event_blocked = CURRENT_LIST.should_mute_user(talk.user);
                } else if (ignored_types.includes(talk.type)) {
                    // Ignore
                } else {
                    console.log('handle_new_talk: Unknown talk type:', talk.type);
                }
            });
    
            return is_event_blocked;
        }
    
        /* Handle the connection or leave of a user */
        handle_user(user) {
            if (CURRENT_LIST.should_mute_user(user)) {
                UI.hide_messages_with_name(user.name);
            }
        }
    
        /* Dispatch a WS event */
        async dispatch_event(event, data) {
            let is_event_blocked = false;
    
            console.info('[DRRR Power Mute] Event', {
                event: event,
                data: data,
            });
    
            const ignored_events = ['disconnect'];
    
            if (event == 'connect') {
                await this.handle_connect();
            } else if (event == 'new-talk') {
                is_event_blocked = this.handle_new_talk(data);
            } else if (ignored_events.includes(event)) {
                // Ignore
            } else {
                console.log('[DRRR Power Mute] dispatch_event: Unrecognized event:', event);
            }
    
            return is_event_blocked;
        }
    
        /* Hook and dispatch Websocket incoming messages */
        async hook() {
            // Store the original Socket.IO implementation
            const originalSocketIO = window.io;
    
            if (!originalSocketIO) {
                console.error('[DRRR Power Mute] Socket.IO not found on page load');
                return;
            }
    
            const this_websocket = this;
    
            // Override Socket.IO
            window.io = function () {
                console.info('[DRRR Power Mute] Socket.IO hook initiated');
    
                const socket = originalSocketIO.apply(this, arguments);
    
                // Intercept all event listeners
                const originalOn = socket.on;
    
                socket.on = function (event, callback) {
                    return originalOn.call(this, event, async function () {
                        const data = Array.prototype.slice.call(arguments);
                        // Whether to return the event to the original handler. This should be false for blocked elements
                        let is_event_blocked = false;
    
                        // Wrapped so that the event is sent back normally whatever happens
                        try {
                            if (SETTINGS.is_enabled()) {
                                is_event_blocked = await this_websocket.dispatch_event(event, data);
                            }
                        } catch (err) {
                            console.error('[DRRR Power Mute] dispatch_event:', err);
                        }
    
                        if (!is_event_blocked) {
                            callback.apply(this, arguments);
                        } else {
                            console.info('Event muted');
                        }
                    });
                };
    
                return socket;
            };
    
            // Preserve any properties from the original io object
            for (let prop in originalSocketIO) {
                if (originalSocketIO.hasOwnProperty(prop)) {
                    window.io[prop] = originalSocketIO[prop];
                }
            }
        }
    }

    async function main() {
        console.info('[DRRR Power Mute] Script loaded');
        await new Websocket().hook();
        console.info('[DRRR Power Mute] Setup complete');
    }
    
    const SETTINGS = new Settings();
    const UI = new _UI();
    const BLACKLIST = new BlackList();
    const WHITELIST = new WhiteList();
    const MUTED_MESSAGE_LIST = new MutedMessageList();
    
    // Blacklist <-> Whitelist
    let CURRENT_LIST = SETTINGS.get_list_type() === Enum_ListType.BLACKLIST ? BLACKLIST : WHITELIST;
    
    UI.populate_list_rules(BLACKLIST);
    UI.populate_list_rules(WHITELIST);
    UI.populate_list_rules(MUTED_MESSAGE_LIST);


    await main();
})($);
