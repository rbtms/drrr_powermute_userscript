// ==UserScript==
// @name         DRRR.com PowerMute
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Intercepts Socket.io messages on drrr.com/room/*
// @author       Robo
// @match        https://drrr.com/room/*
// @grant        none
// ==/UserScript==

/*
  Hook the WebSocket incoming events
*/
(function(jQuery) {
    'use strict';

    const Enum_UserProps = Object.freeze({
        'NAME': Symbol('NAME'),
        'ID': Symbol('ID'),
        'TRIPCODE': Symbol('TRIPCODE')
    });

    // Actions to be taken when a message matches
    const Enum_MuteAction = Object.freeze({
        'MUTE_NAME': Symbol('MUTE_NAME'),
        'MUTE_ID': Symbol('MUTE_ID'),
        'MUTE_TRIPCODE': Symbol('MUTE_TRIPCODE')
    });

    // Talk wrapper class
    class Talk {
        constructor(talk) {
            this.id = talk[0]['id'];
            this.loudness = talk[0]['loudness'];
            this.message = talk[0]['message'];
            this.time = talk[0]['time'];
            this.type = talk[0]['type'];
    
            this.user = User.from_talk_json(talk);
        }
    
        // Check if the message matches a specific regex
        message_matches_regex(r) {
          return (new RegExp(r)).exec(this.message) === null;
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

        // Alternative constructor from talk json
        static from_talk_json(talk_json) {
            console.log('from_talk_json', talk_json[0]['from']);
            return new User(talk_json[0]['from']);
        }
    
        has_tripcode() {
            return this.tripcode == '';
        }
    
        prop_matches(prop_name, prop_val) {
            return this[prop_name] == prop_val;
        }

        does_name_match() {
            // TODO: Check if the name matches a regex
        }
    }

    class MutedUserProp {
        constructor(prop_type, prop_val) {
            this.prop_type = prop_type;
            this.prop_val = prop_val;
        }
    }

    class BlackWhiteList {
        constructor() {
            this.elements = [];
        }

        add_elem(elem) {
            this.elements.push(elem);
        }

        add_user_prop(prop_type, prop_val) {
            this.add_elem(new MutedUserProp(prop_type, prop_val));
        }

        // Checks if for any user, user[prop] == val
        has_user_prop_val(prop_name, prop_val) {
            return this.elements.some( (user) =>
                user.prop_matches(prop_name, prop_val)
            );
        }
    
        // Checks for specific properties in the user list
        has_id(id) { return this.has_user_prop_val('id', id); }
        //has_user_name(name) { return this.has_user_prop_val('name', name); }
        has_trip(tripcode) { return this.has_user_prop_val('tripcode', tripcode); }
        has_icon(icon) { return this.has_user_prop_val('icon', icon); }
    
        // Check if any username matches a specific regex
        does_name_match(name_regex) {
            return this.elements.some( (user) => {
                user.does_name_match(name_regex)
            });
        }
    }

    class BlackList extends BlackWhiteList {
        constructor() {
            super();
            this.add_user_prop(Enum_UserProps.NAME, 'Robo');
            this.add_user_prop(Enum_UserProps.NAME, 'asdf');
        }

        mute_users() {
            const userProps = this.elements;
            const ui = new UI();

            userProps.forEach( (userProp) => {
                if( userProp.prop_type === Enum_UserProps.NAME ) {
                    ui.hide_talks_with_name(userProp.prop_val);
                }
            });
        }
    }

    class WhiteList extends BlackWhiteList {
        mute_users() {

        }
    }

    class MuteMessage {
        constructor(message, action) {
            this.message = message;
            this.action = action;
        }
    }

    class MessageList {
        // TODO
    }
    
    // TODO: Take settings into account
    class Settings {
        constructor() {
            // If the muting is enabled
            this.is_enabled = true;
            // Mute users automatically if they don't have a tripcode
            this.mute_user_if_no_trip = false;
        }
    
        import_settings() {
            // TODO
        }

        save_to_storage() {

        }

        load_from_storage() {

        }
    
        export_settings() {
            // TODO 
        }
    
        load_settings() {
            // TODO
        }
    }

    // UI operations
    class UI {
        // TODO: Hide system messages, which are span and not div
        // TODO: Hide knocks
        hide_talks_with_name(name) {
            console.info('MUTING USER WITH NAME', name);

            // Talks from a specific user
            const talks = jQuery('#talks div.name')
                .filter((_, elem) => elem.children[0].textContent == name);
            
            for(let i = 0; i < talks.length; i++) {
                jQuery(talks[i].parentElement.parentElement).hide();
            }
        }
    }
    
    class Websocket {
        /* Handle self connect */
        handle_connect() {
            // TODO: Whitelist option
            BLACKLIST.mute_users();
        }

        /* Handle a new message */
        handle_new_talk(data) {
            const talk = new Talk(data);
            const user = User.from_talk_json(data);
            
            
        }
        
        /* Handle the connection of a new user */
        handle_new_user(data) {
        }
        
        /* Dispatch a WS event */
        dispatch_event(event, data) {
            console.info('[DRRR Power Mute] Event', {
                event: event,
                data: data
            });
        
            const ignored_events = [ 'disconnect' ];
        
            if( event == 'connect' ) {
                this.handle_connect();
            } else if( event == 'new-talk' ) {
                this.handle_new_talk(data);
            } else if( event == 'new-user' ) {
                this.handle_new_user(data);
            } else if( ignored_events.includes(event) ) {
                // Ignore
            } else {
                console.log('[DRRR Power Mute] dispatch_event: Unrecognized event:', event);
            }
        }

        /* Hook and dispatch Websocket incoming messages */
        hook() {
            // Store the original Socket.IO implementation
            const originalSocketIO = window.io;
        
            if (!originalSocketIO) {
                console.error('[DRRR Power Mute] Socket.IO not found on page load');
                return;
            }

            const this_websocket = this;
        
            // Override Socket.IO
            window.io = function() {
                console.info('[DRRR Power Mute] Socket.IO hook initiated');
        
                const socket = originalSocketIO.apply(this, arguments);
        
                // Intercept all event listeners
                const originalOn = socket.on;
        
                socket.on = function(event, callback) {
                    return originalOn.call(this, event, function() {
                        const data = Array.prototype.slice.call(arguments);
                        this_websocket.dispatch_event(event, data);
                        callback.apply(this, arguments);
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

    function main() {
        console.info('[DRRR Power Mute] Script loaded');
        new Websocket().hook();
        console.info('[DRRR Power Mute] Setup complete');
    }

    const BLACKLIST = new BlackList();
    const WHITELIST = new WhiteList();

    main();
})($);
