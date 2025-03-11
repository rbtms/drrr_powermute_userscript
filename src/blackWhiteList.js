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
