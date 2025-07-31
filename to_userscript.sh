#!/usr/bin/bash

# TODO: As it gets the list of users from the API on setup, it can not hide messages from
#       users who are not currently in the room but have messages on the log

# Redirect output to powermute.js
exec > powermute.js 2>&1

# Print a file on screen keeping indentation
function echoFile() {
    filepath=$1

    while IFS= read -r line; do
        echo "    $line"
    done < $filepath
    echo
}

echo "// ==UserScript=="
echo "// @name         DRRR.com PowerMute"
echo "// @namespace    http://tampermonkey.net/"
echo "// @version      1.7"
echo "// @description  Muting tools for drrr.com"
echo "// @author       Robo"
echo "// @match        https://drrr.com/room/*"
echo "// @license      GPL-3.0-only"
echo "// @grant        none"
echo "// ==/UserScript=="
echo

echo '(async function (jQuery) {'
echo "    'use strict';"
echoFile ./src/globals.js
echoFile ./src/talk.js
echoFile ./src/user.js
echoFile ./src/mutedUserProp.js
echoFile ./src/blackWhiteList.js
echoFile ./src/blackList.js
echoFile ./src/whiteList.js
echoFile ./src/mutedMessageList.js
echoFile ./src/spamDetector.js
echoFile ./src/settings.js
echoFile ./src/ui.js
echoFile ./src/websocket.js
echoFile ./src/main.js
echo
echo '    await main();'
echo '})($);'
