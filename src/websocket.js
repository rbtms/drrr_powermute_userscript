class Websocket {
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
