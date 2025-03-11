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
