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
