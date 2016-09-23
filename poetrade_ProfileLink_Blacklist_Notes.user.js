// ==UserScript==
// @name        poe.trade View Profile + Blacklist + Custom notes
// @description Adds view profile button to poe.trade search results and allows to blacklist user + add notes.
// @include     http://poe.trade/*
// @include     https://poe.trade/*
// @version     1.3
// @author      MisaMisa, kylegetsspam, KHS_aAa, pollyzoid
// @run-at      document-end
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==

var forum_thread_id = 1741446;

var isProfileBlacklisted = function(profile_name) {
    return GM_getValue("isBlocked_" + profile_name, "false") === "true";
};

var blacklistProfile = function(profile_name) {
    GM_setValue("isBlocked_" + profile_name, "true");
};

var unblacklistProfile = function(profile_name) {
    GM_deleteValue("isBlocked_" + profile_name);
};

var getProfileCustomNote = function(profile_name) {
    return GM_getValue("customNote_" + profile_name, "").trim();
};

var setProfileCustomNote = function(profile_name, note) {
    GM_setValue("customNote_" + profile_name, note);
};

var deleteProfileCustomNote = function(profile_name) {
    GM_deleteValue("customNote_" + profile_name);
};

var updateTradeItemNodes = function(results) {
    Array.prototype.forEach.call(results.querySelectorAll('.item'), function(item) {
        var profile_name = item.getAttribute('data-seller');
        var ign_name = item.getAttribute('data-ign');

        // Detect if russian
        var is_russian = false;
        if (ign_name !== null) {
            if (ign_name.length > 0) {
                // It's enough to test first symbol only
                is_russian = /^[\u0400-\u04FF]/.test(ign_name);
            }
        }

        var is_blocked = isProfileBlacklisted(profile_name);
        var custom_note = getProfileCustomNote(profile_name);

        var temp_string = '<ul class="proplist">' + (is_russian ? '<li><img src="http://i.imgur.com/tRDP5C9.png" alt="RU" title="This player is russian"></li>' : '') + '<li><a href="https://www.pathofexile.com/account/view-profile/' + profile_name + '" target="_blank" title="Click to open profile link in new tab">View profile</a></li><li><a href="#" onclick="return false" class="block-btn">' + (is_blocked ? 'Unblock' : 'Block') + '</a></li><li><a href="#" onclick="return false" class="note-btn" title="Click to edit">' + (custom_note === "" ? 'Edit note' : custom_note) + '</a></li></ul>';

        // Buttons
        item.querySelector('.bottom-row .third-cell').insertAdjacentHTML('beforeend', temp_string);

        // Adjust opacity
        if (is_blocked) {
            item.style.opacity = 0.25;
        }
    });
};

var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mut) {
        // A single update can contain multiple #search-results-[0-2] nodes, so update them all
        Array.prototype.forEach.call(mut.addedNodes, function(node) {
            if (node.nodeName === "DIV") {
                updateTradeItemNodes(node);
            }
        });
    });
});

// Append everything to search results
var target = document.getElementsByClassName('search-results-block')[0];
if (target) {
    observer.observe(target, { childList: true });
    updateTradeItemNodes(target);
}

// Live search
var live_items = document.getElementById('items');
if (live_items) {
    observer.observe(live_items, { childList: true });
}

var updateBlackListStatus = function(results, target_profile_name) {
    Array.prototype.forEach.call(results.querySelectorAll('.item'), function(item) {
        var profile_name = item.getAttribute('data-seller');

        if (profile_name !== target_profile_name) {
            return;
        }

        var is_blocked = isProfileBlacklisted(profile_name);

        // Adjust opacity
        if (is_blocked) {
            item.style.opacity = 0.25;
        } else {
            item.style.opacity = 1;
        }

        // Change button text
        var block_button_element = item.querySelector('.block-btn');
        if (block_button_element !== null) {
            $(block_button_element).text(is_blocked ? "Unblock" : "Block");
        }
    });
};

var updateCustomNoteStatus = function(results, target_profile_name) {
    Array.prototype.forEach.call(results.querySelectorAll('.item'), function(item) {
        var profile_name = item.getAttribute('data-seller');

        if (profile_name !== target_profile_name) {
            return;
        }

        // Change button text
        var note_button_element = item.querySelector('.note-btn');
        if (note_button_element !== null) {
            var custom_note = getProfileCustomNote(profile_name);

            $(note_button_element).text(custom_note === "" ? "Edit note" : custom_note);
        }
    });
};

var updateAllElements = function(target_function, target_profile_name) {
    // Static items
    var all_elements_target = document.getElementsByClassName('search-results-block')[0];
    if (all_elements_target) {
        target_function(all_elements_target, target_profile_name);
    }

    // Live items
    var live_items_target = document.getElementById('items');
    if (live_items_target) {
        target_function(live_items_target, target_profile_name);
    }
};

$(document).ready(function() {
    // Block button handler
    $(document).on('click', '.block-btn', function() {
        var item = $(this).parents(".item");
        var profile_name = item.data("seller");

        if (isProfileBlacklisted(profile_name)) {
            unblacklistProfile(profile_name);
        } else {
            blacklistProfile(profile_name);
        }

        // Update all elements
        updateAllElements(updateBlackListStatus, profile_name);
    });


    // Note button handler
    $(document).on('click', '.note-btn', function() {
        var item = $(this).parents(".item");
        var profile_name = item.data("seller");

        var note = prompt('Enter custom note:', getProfileCustomNote(profile_name));

        if (note !== null) {
            note = note.trim();

            if (note === "") {
                deleteProfileCustomNote(profile_name);
            } else {
                setProfileCustomNote(profile_name, note);
            }

            // Update all elements
            updateAllElements(updateCustomNoteStatus, profile_name);
        }
    });

    // Global block button handler
    $(document).on('click', '.global-block-btn', function() {
        var profile_name = prompt('Enter profile name you want to block:', '');

        if (profile_name !== null) {
            profile_name = profile_name.trim();

            if (profile_name !== "") {
                blacklistProfile(profile_name);

                // Update all elements
                updateAllElements(updateBlackListStatus, profile_name);
            }
        }
    });

    // Global unblock button handler
    $(document).on('click', '.global-unblock-btn', function() {
        var profile_name = prompt('Enter profile name you want to unblock:', '');

        if (profile_name !== null) {
            profile_name = profile_name.trim();

            if (profile_name !== "") {
                unblacklistProfile(profile_name);

                // Update all elements
                updateAllElements(updateBlackListStatus, profile_name);
            }
        }
    });

    // Global edit note button handler
    $(document).on('click', '.global-note-btn', function() {
        var profile_name = prompt('Enter profile name:', '');

        if (profile_name !== null) {
            profile_name = profile_name.trim();

            if (profile_name !== "") {
                var note = prompt('Enter custom note for ' + profile_name + ':', getProfileCustomNote(profile_name));

                if (note !== null) {
                    note = note.trim();

                    if (note === "") {
                        deleteProfileCustomNote(profile_name);
                    } else {
                        setProfileCustomNote(profile_name, note);
                    }

                    // Update all elements
                    updateAllElements(updateCustomNoteStatus, profile_name);
                }
            }
        }
    });

    // Global view stored info button handler
    $(document).on('click', '.global-info-btn', function() {
        var profile_name = prompt('Enter profile name:', '');

        if (profile_name !== null) {
            profile_name = profile_name.trim();

            if (profile_name !== "") {
                var is_blocked = isProfileBlacklisted(profile_name);
                var note = getProfileCustomNote(profile_name);

                alert('Profile ' + profile_name + ' is ' + (is_blocked ? '' : 'not ') + 'blocked. Custom note' + (note === "" ? ' not set.' : ': ' + note));
            }
        }
    });

    // Global buttons
    var temp_string = '<table class="search-results"><tbody><tr><td><ul class="proplist"><li><a href="#" onclick="return false" class="global-block-btn">Block profile</a></li><li><a href="#" onclick="return false" class="global-unblock-btn">Unblock profile</a></li><li><a href="#" onclick="return false" class="global-note-btn">Edit profile note</a></li><li><a href="#" onclick="return false" class="global-info-btn">View stored profile info</a></li><li><a href="https://www.pathofexile.com/forum/view-thread/' + forum_thread_id + '" target="_blank">Script forum thread</a></li></ul></td></tr></tbody></table>';
    document.querySelector('.protip').insertAdjacentHTML('afterend', temp_string);
});