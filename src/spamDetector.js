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

    _message_has_too_few_spaces(message) {
        const space_threshold_per_10_chars = 1;
        const number_of_spaces = message.replace(/[^\s]/g, '')
        return number_of_spaces.length < message.length/(space_threshold_per_10_chars*10);
    }

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

    last_messages_were_too_fast() {
        const min_time_offset_ms = 4000; // 4s
        
        return this.lastTalkBuffer.length > 2 // Last 2 messages
            && this.lastTalkBuffer[0].message.length > this.BASE_SPAM_LENGTH
            && this.lastTalkBuffer[1].message.length > this.BASE_SPAM_LENGTH
            && this.lastTalkBuffer[0].time - this.lastTalkBuffer[1].time < min_time_offset_ms;
    }

    is_talk_spam(talk) {
        this.append_talk_to_buffer(talk);

        return this.has_repeating_messages(talk)
            || this.is_random_message(talk)
            || this.last_messages_were_too_fast();
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
        //let msg = 'hey man whats up whats up whats up whats up whats up whats up whats up whats up whats up ' + i;
        let msg = "=;M]4#|C/.b&|{&hVTu5SwNIB}k6hOeT95]>r5-bq`qFuf4%O|;(Jr+TWbtAC\\clbaci}jPGn?k&ze*16[`7m[<g6G0$:aU b,:";
        let uid = 2;
        console.log(i, spamDetector.is_talk_spam(test_mock_talk(msg, uid)))
    }
}

test_spam();
// */
