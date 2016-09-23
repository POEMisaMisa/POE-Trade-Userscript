// ==UserScript==
// @name        poe.trade View Profile + Blacklist + Custom notes
// @description Adds view profile button to poe.trade search results and allows to blacklist user + add notes.
// @include     http://poe.trade/*
// @include     https://poe.trade/*
// @version     1.2
// @author      MisaMisa, kylegetsspam, pollyzoid
// @run-at      document-end
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// ==/UserScript==

var isAccountBlacklisted = function(account_name) {
    return GM_getValue("isBlocked_" + account_name, "false") === "true";
};

var blacklistAccount = function(account_name) {
    GM_setValue("isBlocked_" + account_name, "true");
};

var unblacklistAccount = function(account_name) {
    GM_deleteValue("isBlocked_" + account_name);
};

var getAccountCustomNote = function(account_name) {
    return GM_getValue("customNote_" + account_name, "").trim();
};

var setAccountCustomNote = function(account_name, note) {
    GM_setValue("customNote_" + account_name, note);
};

var deleteAccountCustomNote = function(account_name) {
    GM_deleteValue("customNote_" + account_name);
};

var updateTradeItemNodes = function(results) {
    Array.prototype.forEach.call(results.querySelectorAll('.item'), function(item) {
        var account_name = item.getAttribute('data-seller');
        var ign_name = item.getAttribute('data-ign');

        // Detect if russian
        var is_russian = false;
        if (ign_name !== null) {
            if (ign_name.length > 0) {
                // It's enough to test first symbol only
                is_russian = /^[\u0400-\u04FF]/.test(ign_name);
            }
        }

        var is_blocked = isAccountBlacklisted(account_name);
        var custom_note = getAccountCustomNote(account_name);

        var temp_string = '<ul class="proplist">' + (is_russian ? '<li><img src="http://i.imgur.com/tRDP5C9.png" alt="RU" title="This player is russian"></li>' : '') + '<li><a href="https://www.pathofexile.com/account/view-profile/' + account_name + '" target="_blank" title="Click to open profile link in new tab">View profile</a></li><li><a href="#" onclick="return false" class="block-btn">' + (is_blocked ? 'Unblock' : 'Block') + '</a></li><li><a href="#" onclick="return false" class="note-btn" title="Click to edit">' + (custom_note === "" ? 'Edit note' : custom_note) + '</a></li></ul>';

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

var updateBlackListStatus = function(results, target_account_name) {
    Array.prototype.forEach.call(results.querySelectorAll('.item'), function(item) {
        var account_name = item.getAttribute('data-seller');

        if (account_name !== target_account_name) {
            return;
        }

        var is_blocked = isAccountBlacklisted(account_name);

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

var updateCustomNoteStatus = function(results, target_account_name) {
    Array.prototype.forEach.call(results.querySelectorAll('.item'), function(item) {
        var account_name = item.getAttribute('data-seller');

        if (account_name !== target_account_name) {
            return;
        }

        // Change button text
        var note_button_element = item.querySelector('.note-btn');
        if (note_button_element !== null) {
            var custom_note = getAccountCustomNote(account_name);

            $(note_button_element).text(custom_note === "" ? "Edit note" : custom_note);
        }
    });
};

var updateAllElements = function(target_function, target_account_name) {
    // Static items
    var all_elements_target = document.getElementsByClassName('search-results-block')[0];
    if (all_elements_target) {
        target_function(all_elements_target, target_account_name);
    }

    // Live items
    var live_items_target = document.getElementById('items');
    if (live_items_target) {
        target_function(live_items_target, target_account_name);
    }
};

// Block button handler
$(document).on('click', '.block-btn', function() {
    var item = $(this).parents(".item");
    var account_name = item.data("seller");

    if (isAccountBlacklisted(account_name)) {
        unblacklistAccount(account_name);
    } else {
        blacklistAccount(account_name);
    }

    // Update all elements
    updateAllElements(updateBlackListStatus, account_name);
});

// Note button handler
$(document).on('click', '.note-btn', function() {
    var item = $(this).parents(".item");
    var account_name = item.data("seller");

    var note = prompt('Enter custom note:', getAccountCustomNote(account_name));

    if (note !== null) {
        note = note.trim();

        if (note === "") {
            deleteAccountCustomNote(account_name);
        } else {
            setAccountCustomNote(account_name, note);
        }

        // Update all elements
        updateAllElements(updateCustomNoteStatus, account_name);
    }
});