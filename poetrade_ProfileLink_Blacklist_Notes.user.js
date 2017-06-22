// ==UserScript==
// @name        poe.trade View Profile + Blacklist + Custom notes + Copy Item
// @description Adds view profile button to poe.trade search results and allows to blacklist user, add notes to them and copy item info to clipboard.
// @include     http://poe.trade/*
// @include     http://currency.poe.trade/*
// @include     https://poe.trade/*
// @include     https://currency.poe.trade/*
// @version     1.6
// @author      MisaMisa, kylegetsspam, KHS_aAa, pollyzoid, some parts of copy item code was inspired by Fikal script
// @run-at      document-end
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.6.0/clipboard.min.js
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

var isPlayerRussian = function(ign_name) {
    if (ign_name !== null) {
        if (ign_name.length > 0) {
            // It's enough to test first symbol only
            return /^[\u0400-\u04FF]/.test(ign_name);
        }
    }

    return false;
};

var updateTradeItemNodes = function(results) {
    Array.prototype.forEach.call(results.querySelectorAll('.item'), function(item) {
        var profile_name = item.getAttribute('data-seller');
        var ign_name = item.getAttribute('data-ign');
        var is_russian = isPlayerRussian(ign_name);
        var is_blocked = isProfileBlacklisted(profile_name);
        var custom_note = getProfileCustomNote(profile_name);

        var temp_string = '<ul class="filterlist">' + (is_russian ? '<li><img src="http://i.imgur.com/tRDP5C9.png" alt="RU" title="This player is russian"></li>' : '') + '<li><a href="https://www.pathofexile.com/account/view-profile/' + profile_name + '" target="_blank" title="Click to open profile link in new tab">View profile</a></li><li><a href="#" onclick="return false" class="block-btn">' + (is_blocked ? 'Unblock' : 'Block') + '</a></li><li><a href="#" onclick="return false" class="note-btn" title="Click to edit">' + (custom_note === "" ? 'Edit note' : custom_note) + '</a></li></ul>';

        // Buttons
        item.querySelector('.bottom-row .third-cell').insertAdjacentHTML('beforeend', temp_string);

        // Copy item button
        temp_string = '<center><ul class="filterlist"><li><a href="#" onclick="return false" class="copy-item-btn" title="Copy item to clipboard so you can paste it to Path ob Building tool">Copy</a></li></ul></center>';
        item.querySelector('.bottom-row .first-cell').insertAdjacentHTML('beforeend', temp_string);

        // Adjust opacity
        if (is_blocked) {
            item.style.opacity = 0.25;
        }
    });
};

var updateCurrencyTradeItemNodes = function(results) {
    Array.prototype.forEach.call(results, function(item) {
        var profile_name = item.getAttribute('data-username');
        var ign_name = item.getAttribute('data-ign');
        var is_russian = isPlayerRussian(ign_name);
        var is_blocked = isProfileBlacklisted(profile_name);
        var custom_note = getProfileCustomNote(profile_name);

        var temp_string = (is_russian ? '<img src="http://i.imgur.com/tRDP5C9.png" alt="RU" title="This player is russian"> · ' : '') + '<a href="https://www.pathofexile.com/account/view-profile/' + profile_name + '" target="_blank" title="Click to open profile link in new tab">View profile</a> · <a href="#" onclick="return false" class="block-btn">' + (is_blocked ? 'Unblock' : 'Block') + '</a> · <a href="#" onclick="return false" class="note-btn" title="Click to edit">' + (custom_note === "" ? 'Edit note' : custom_note) + '</a> · ';

        // Buttons
        var right_element = item.querySelector('.right');
        if (right_element !== null) {
            right_element.insertAdjacentHTML('afterbegin', temp_string);
        }

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

// Header buttons
var temp_string = '<style type="text/css" id="filter-css">ul.filterlist{list-style-type:none;margin:0;padding:0}.filterlist li{display:inline}.filterlist li:after{content:" · "}.filterlist li:last-child:after{content:""}</style><table class="search-results"><tbody><tr><td><ul class="filterlist"><li><a href="#" onclick="return false" class="global-block-btn">Block profile</a></li><li><a href="#" onclick="return false" class="global-unblock-btn">Unblock profile</a></li><li><a href="#" onclick="return false" class="global-note-btn">Edit profile note</a></li><li><a href="#" onclick="return false" class="global-info-btn">View stored profile info</a></li><li><a href="https://www.pathofexile.com/forum/view-thread/' + forum_thread_id + '" target="_blank">Script forum thread</a></li></ul></td></tr></tbody></table>';
document.querySelector('.protip').insertAdjacentHTML('afterend', temp_string);

// Append everything to search results
var all_elements = document.getElementsByClassName('search-results-block')[0];
if (all_elements) {
    observer.observe(all_elements, { childList: true });
    updateTradeItemNodes(all_elements);
}

// Append everything to currency search results
var currency_elements = document.getElementsByClassName('displayoffer');
if (currency_elements) {
    updateCurrencyTradeItemNodes(currency_elements);
}

// Live search
var live_items = document.getElementById('items');
if (live_items) {
    observer.observe(live_items, { childList: true });
}

var updateBlackListStatus = function(results, target_profile_name, is_currency_item) {
    Array.prototype.forEach.call(is_currency_item ? results : results.querySelectorAll('.item'), function(item) {
        var profile_name = item.getAttribute(is_currency_item ? 'data-username' : 'data-seller');

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

var updateCustomNoteStatus = function(results, target_profile_name, is_currency_item) {
    Array.prototype.forEach.call(is_currency_item ? results : results.querySelectorAll('.item'), function(item) {
        var profile_name = item.getAttribute(is_currency_item ? 'data-username' : 'data-seller');

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
        target_function(all_elements_target, target_profile_name, false);
    }

    // Currency static items
    var currency_elements_target = document.getElementsByClassName('displayoffer');
    if (currency_elements_target) {
        target_function(currency_elements_target, target_profile_name, true);
    }

    // Live items
    var live_items_target = document.getElementById('items');
    if (live_items_target) {
        target_function(live_items_target, target_profile_name, false);
    }
};

var itemTypesArray = [];
var itemTypesArrayBuilt = false;

function BuildItemTypesArray() {
    if (itemTypesArrayBuilt) {
        return;
    }

    var firstHTMLMarker = "var items_types =";
    var secondHTMLMarker = "var previous = undefined;";

    var copyFromPos = document.documentElement.innerHTML.search(firstHTMLMarker) + firstHTMLMarker.length;
    var copyToPos = document.documentElement.innerHTML.search(secondHTMLMarker);

    if ((copyFromPos == -1) || (copyToPos == -1)) {
        return;
    }

    var itemTypesRaw = document.documentElement.innerHTML.substring(copyFromPos, copyToPos);

    // Parse item types from raw item types
    var notSupportedItemTypesArray = ["Breach", "Map", "Prophecy", "Gem", "Vaal Fragments", "Divination Card", "Leaguestone", "Essence", "Currency"];

    var firstCleanupRegexp = '(';
    for (var i = 0; i < notSupportedItemTypesArray.length; ++i) {
        var currentNotSupportedItemType = notSupportedItemTypesArray[i];

        if (i !== 0) {
            firstCleanupRegexp += '|';
        }
        firstCleanupRegexp += '"' + currentNotSupportedItemType + '": \\[.*?](,|})';
    }
    firstCleanupRegexp += ')';

    itemTypesRaw = itemTypesRaw.replace(new RegExp(firstCleanupRegexp, "g"), '');

    itemTypesArray = itemTypesRaw.replace(/{|}|;|]|("(\w| )*?": \[)|"/g, '').trim().split(', ');

    itemTypesArrayBuilt = true;
}

function PoeTradeItemInfo(div) {
    this.htmlDiv = div;

    this.getRarity = function() {
        var rarityIndex = this.htmlDiv.find(".title").attr("class").match(/[0-9]/);
        var rarityTypes = ["Normal", "Magic", "Rare", "Unique", "Gem", "Currency", "", "", "", "Relic"];

        var resultRarityAsText = rarityTypes[Number(rarityIndex)];
        var resultRarityID = Number(rarityIndex);

        return [resultRarityAsText, resultRarityID];
    };

    this.getNameAndTypeAndCorruptionStatus = function() {
        BuildItemTypesArray();

        var fullTitle = this.htmlDiv.find(".title").text().trim();

        var resultName = fullTitle;
        var resultType = 'Unknown';

        // Process corruption status
        var corruptionRegexp = /^corrupted /;
        var resultIsCorrupted = fullTitle.search(corruptionRegexp) !== -1;
        if (resultIsCorrupted) {
            fullTitle = fullTitle.replace(corruptionRegexp, '').trim();
        }

        for (var i = 0; i < itemTypesArray.length; ++i) {
            var currentItemType = itemTypesArray[i];
            if (fullTitle.indexOf(currentItemType) !== -1) {
                resultName = fullTitle.replace(currentItemType, '').trim();
                resultType = currentItemType.trim();
                break;
            }
        }

        return [resultName, resultType, resultIsCorrupted];
    };

    this.getLevel = function() {
        return this.htmlDiv.find("span[data-name='ilvl']").text().replace("ilvl:", "").trim();
    };

    this.getQuality = function() {
        return this.htmlDiv.find("td[data-name='q']").data("value");
    };

    this.getSockets = function() {
        return this.htmlDiv.find(".sockets-raw").text().trim();
    };

    this.getImplicitMods = function() {
        var resultImplicitModCount = 0;
        var resultImplicit = '';

        var [enchantedImplicitModCount, enchantedImplicit] = this.getEnchantedMods();

        if (enchantedImplicit !== "")
        {
            resultImplicitModCount = enchantedImplicitModCount;
            resultImplicit = enchantedImplicit;
        }
        else
        {
            var [normalImplicitModCount, normalImplicit] = this.getNormalImplicitMods();

            resultImplicitModCount = normalImplicitModCount;
            resultImplicit = normalImplicit;
        }

        return [resultImplicitModCount, resultImplicit];
    };

    this.getNormalImplicitMods = function() {
        var resultNormalImplicitModCount = 0;
        var resultNormalImplicit = '';

        this.htmlDiv.find(".withline li").each(function() {
            var that = $(this);

            resultNormalImplicitModCount += 1;
            resultNormalImplicit += that.text().trim() + '\r\n';
        });

        return [resultNormalImplicitModCount, resultNormalImplicit.trim()];
    };

    this.getEnchantedMods = function() {
        var resultEnchantedImplicitModCount = 0;
        var resultEnchantedImplicit = '';

        this.htmlDiv.find("ul .mods:not(.withline) li").each(function() {
            var that = $(this);

            if (that.text().indexOf('enchanted') !== -1) {
                resultEnchantedImplicitModCount += 1;
                resultEnchantedImplicit += '{enchanted}' + that.text().replace("enchanted", "").trim() + '\r\n';
            }
        });

        return [resultEnchantedImplicitModCount, resultEnchantedImplicit.trim()];
    };

    this.getExplicitMods = function() {
        var resultExplicitModCount = 0;
        var resultExplicit = '';

        this.htmlDiv.find("ul .mods:not(.withline) li").each(function() {
            var that = $(this);
            if (that.text().indexOf('enchanted') === -1 &&
                that.text().indexOf('crafted') === -1 &&
                that.text().startsWith('total:') === false &&
                that.text().indexOf('pseudo') === -1) {
                resultExplicitModCount += 1;
                resultExplicit += that.contents().not($("span")).text().trim() + '\r\n';
            }
        });

        return [resultExplicitModCount, resultExplicit.trim()];
    };

    this.getCraftedMods = function() {
        var resultCraftedModCount = 0;
        var resultCrafted = '';

        this.htmlDiv.find("ul .mods:not(.withline) li").each(function() {
            var that = $(this);

            if (that.text().indexOf('crafted') !== -1) {
                resultCraftedModCount += 1;
                resultCrafted += '{crafted}' + that.text().replace("crafted", "").trim() + '\r\n';
            }
        });

        return [resultCraftedModCount, resultCrafted.trim()];
    };
}

PoeTradeItemInfo.prototype.getItemParametersAsText = function() {
    var result = '';

    var [rarityAsText, rarityID] = this.getRarity();
    if (rarityAsText !== '')  {
        result += 'Rarity: ' + rarityAsText + '\r\n';
    }

    var [itemName, itemType, isItemCorrupted] = this.getNameAndTypeAndCorruptionStatus();

    // At least rare?
    if (rarityID > 1) {
        result += itemName + '\r\n';
    }
    result += itemType + '\r\n';
    result += 'Item Level: ' + this.getLevel() + '\r\n';

    var quality = this.getQuality();
    if (quality !== '') {
        result += 'Quality: ' + quality + '\r\n';
    }

    var sockets = this.getSockets();
    if (sockets !== '') {
        result += 'Sockets: ' + sockets + '\r\n';
    }

    var [itemImplicitModCount, itemImplicit] = this.getImplicitMods();

    result += 'Implicits: ' + itemImplicitModCount + '\r\n';

    if (itemImplicit !== '') {
        result += itemImplicit + '\r\n';
    }

    var [itemExplicitModCount, itemExplicit] = this.getExplicitMods();

    if (itemExplicit !== '') {
        result += itemExplicit + '\r\n';
    }

    var [itemCraftedModCount, itemCrafted] = this.getCraftedMods();

    if (itemCrafted !== '') {
        result += itemCrafted + '\r\n';
    }

    if (isItemCorrupted) {
        result += 'Corrupted' + '\r\n';
    }

    return result.trim();
};

$(document).ready(function() {
    // Block button handler
    $(document).on('click', '.block-btn', function() {
        var item = $(this).parents(".item");
        var profile_name = item.data("seller");
        if (profile_name === null) {
            var currency_item = $(this).parents(".displayoffer");
            profile_name = currency_item.data('username');
        }

        if (profile_name === null) {
            return;
        }

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
        if (profile_name === null) {
            var currency_item = $(this).parents(".displayoffer");
            profile_name = currency_item.data('username');
        }

        if (profile_name === null) {
            return;
        }

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

    // Copy item button handler
    var copyItemClipboard = new Clipboard(".copy-item-btn", {
        text: function(trigger) {
            var poeTradeItemInfo = new PoeTradeItemInfo($(trigger).parents('[id^="item-container-"]'));
            return poeTradeItemInfo.getItemParametersAsText();
        }
    });
    copyItemClipboard.on("success", function(e) {
        $(e.trigger).text("Copied");
    });
});