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

    /*
        Check if the number of spaces in a message is too small
    */
    _message_has_too_few_spaces(message) {
        return message.replace(/[^\s]/g, '').length < 5;
    }

    /*
        Check if the number of non-alpha chars is bigger than a given threshold
    */
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

    /*
        Check if the last messages were too long, fast and from the same user
    */
    last_messages_were_too_fast_and_long() {
        const min_time_offset_ms = 4000; // 4s
        const n_messages = 2;
        
        return this.lastTalkBuffer.length >= n_messages // Last 2 messages
            && this.lastTalkBuffer[0].message.length > this.BASE_SPAM_LENGTH
            && this.lastTalkBuffer[1].message.length > this.BASE_SPAM_LENGTH
            && this.lastTalkBuffer[0].time - this.lastTalkBuffer[1].time < min_time_offset_ms
            && this.lastTalkBuffer[0].user.id === this.lastTalkBuffer[1].user.id;
    }

    /*
        Check if the last messages were too short, fast and from the same user
    */
    last_messages_were_too_fast_and_short() {
        const min_time_offset_ms = 0.4; // 0.4s
        const n_messages = 4;
        
        return this.lastTalkBuffer.length >= n_messages // Last 2 messages
            && this.lastTalkBuffer[0].time - this.lastTalkBuffer[1].time < min_time_offset_ms
            && this.lastTalkBuffer[1].time - this.lastTalkBuffer[2].time < min_time_offset_ms
            && this.lastTalkBuffer[2].time - this.lastTalkBuffer[3].time < min_time_offset_ms
            && this.lastTalkBuffer[0].user.id === this.lastTalkBuffer[1].user.id;
    }

    is_talk_spam(talk) {
        this.append_talk_to_buffer(talk);

        return this.has_repeating_messages(talk)
            || this.is_random_message(talk)
            || this.last_messages_were_too_fast_and_long()
            || this.last_messages_were_too_fast_and_short();
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
        //let msg = "=;M]4#|C/.b&|{&hVTu5SwNIB}k6hOeT95]>r5-bq`qFuf4%O|;(Jr+TWbtAC\\clbaci}jPGn?k&ze*16[`7m[<g6G0$:aU b,:";
        let uid = 2;
        console.log(i, spamDetector.is_talk_spam(test_mock_talk(msg, uid)))
    }
}

test_spam();
// */
