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
