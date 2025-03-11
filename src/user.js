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
