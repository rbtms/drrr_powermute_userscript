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
    const API_URL = 'https://drrr.com/room/?api=json';

    // Mute list types
    const Enum_ListType = Object.freeze({
        'BLACKLIST': Symbol('BLACKLIST'),
        'WHITELIST': Symbol('WHITELIST')
    });

    // Properties of a user
    const Enum_UserProps = Object.freeze({
        'NAME': Symbol('NAME'),
        'ID': Symbol('ID'),
        'TRIPCODE': Symbol('TRIPCODE')
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
            this.userProps = [];
        }

        add_elem(elem) {
            this.userProps.push(elem);
        }

        add_user_prop(prop_type, prop_val) {
            this.add_elem(new MutedUserProp(prop_type, prop_val));
        }

        // Checks if for any user, user[prop] == val
        has_user_prop_val(prop_name, prop_val) {
            return this.userProps.some( (user) =>
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
            return this.userProps.some( (user) => {
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

        /* Obtain whether or not any property of an user is muteable */
        is_user_muteable(user) {
            let is_muteable = false;

            this.userProps.forEach( (userProp) => {
                is_muteable = is_muteable || (
                    // Name matches regex
                    (userProp.prop_type === Enum_UserProps.NAME && new RegExp(userProp.prop_val).exec(user.name) !== null)
                    // ID matches
                    || (userProp.prop_type === Enum_UserProps.ID && user.id === userProp.prop_val)
                    // Tripcode matches
                    || (userProp.prop_type === Enum_UserProps.TRIPCODE && user.tripcode === userProp.prop_val)
                );
            });

            return is_muteable;
        }
    }

    class WhiteList extends BlackWhiteList {
        /* Obtain whether or not any property of an user is muteable */
        is_user_muteable(user) {
            // TODO
            return false;
        }
    }

    // TODO: Take settings into account
    class Settings {
        constructor() {
            // If the muting is enabled
            this.is_enabled = true;
            // Blacklist/whitelist
            this.list_type = Enum_ListType.BLACKLIST;
            // Mute users automatically if they don't have a tripcode
            this.mute_user_if_no_tripcode = false;
        }
    
        load() {
            // TODO
        }

        save() {
            // TODO
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
        // TODO: Hide system messages, which are span and not div
        // TODO: Hide knocks
        hide_talks_with_name(name) {
            console.info('MUTING USER WITH NAME', name);

            // Talks from a specific user
            const talks = jQuery('#talks div.name')
                .filter((_, elem) => elem.children[0].textContent === name);
            
            for(let i = 0; i < talks.length; i++) {
                jQuery(talks[i].parentElement.parentElement).hide();
            }
        }
    }
    
    class Websocket {
        /* Handle self connect */
        handle_connect() {
            fetch(API_URL)
                .then(res => res.json())
                .then( data => {
                    console.log('API DATA', data);

                    data['room']['users'].forEach( user_json => {
                        const user = new User(user_json);
                        console.log('EXISTING USER', user);

                        if( CURRENT_LIST.is_user_muteable(user) ) {
                            UI.hide_talks_with_name(user.name);
                        }
                    });

                    data['room']['talks'].forEach( talk => {
                        // TODO
                    });
                })
                .catch( err =>
                    console.log('Couldn\'t parse API data', err)
                );
        }

        /* Handle a new message */
        handle_new_talk(data) {
            const talk = new Talk(data);
            const user = User.from_talk_json(data);
            // TODO
        }
        
        /* Handle the connection of a new user */
        handle_new_user(data) {
            const user = new User(data);

            if( CURRENT_LIST.is_user_muteable(user) ) {
                UI.hide_talks_with_name(user.name);
            }
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

    const SETTINGS = new Settings();
    const UI = new _UI();
    const BLACKLIST = new BlackList();
    const WHITELIST = new WhiteList();
    const CURRENT_LIST = SETTINGS.list_type === Enum_ListType.BLACKLIST ? BLACKLIST : WHITELIST;

    main();
})($);
