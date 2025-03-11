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
                                <h5 class="mb-0">Ban repeating messages (3+)</h5>
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
