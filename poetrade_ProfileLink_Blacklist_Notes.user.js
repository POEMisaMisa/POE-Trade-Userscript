// ==UserScript==
// @name        poe.trade View Profile + Blacklist + Custom notes + Copy Item
// @description Adds view profile button to poe.trade search results and allows to blacklist user, add notes to them and copy item info to clipboard.
// @include     http://poe.trade/*
// @include     http://currency.poe.trade/*
// @include     https://poe.trade/*
// @include     https://currency.poe.trade/*
// @version     1.8
// @author      MisaMisa, kylegetsspam, KHS_aAa, pollyzoid, Eruyome, some parts of copy item code was inspired by Fikal script
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

        var temp_string = '<ul class="filterlist">' + (is_russian ? '<li><img src="http://i.imgur.com/tRDP5C9.png" alt="RU" title="This player is russian"></li>' : '') + '<li><a href="https://www.pathofexile.com/account/view-profile/' + profile_name + '" target="_blank" title="Click to open profile link in new tab"><span class="custom-profile-link">' + profile_name + '</span></a></li><li><a href="#" onclick="return false" class="block-btn">' + (is_blocked ? 'Unblock' : 'Block') + '</a></li><li><a href="#" onclick="return false" class="note-btn" title="Click to edit">' + (custom_note === "" ? 'Edit note' : custom_note) + '</a></li></ul>';

        // Buttons
        item.querySelector('.bottom-row .third-cell').insertAdjacentHTML('beforeend', temp_string);

        // Copy item button
        temp_string = '<center><ul class="filterlist"><li><a href="#" onclick="return false" class="copy-item-btn" title="Copy item to clipboard so you can paste it to Path ob Building tool">Copy</a></li></ul></center>';
        item.querySelector('.bottom-row .first-cell').insertAdjacentHTML('beforeend', temp_string);

        // Adjust opacity
        if (is_blocked) {
            item.style.opacity = 0.25;
        }
        $(item).find('span.custom-profile-link').css("color", "#BBBBBB");
    });
};

var updateCurrencyTradeItemNodes = function(results) {
    Array.prototype.forEach.call(results, function(item) {
        var profile_name = item.getAttribute('data-username');
        var ign_name = item.getAttribute('data-ign');
        var is_russian = isPlayerRussian(ign_name);
        var is_blocked = isProfileBlacklisted(profile_name);
        var custom_note = getProfileCustomNote(profile_name);

        var temp_string = (is_russian ? '<img src="http://i.imgur.com/tRDP5C9.png" alt="RU" title="This player is russian"> · ' : '') + '<a href="https://www.pathofexile.com/account/view-profile/' + profile_name + '" target="_blank" title="Click to open profile link in new tab"><span class="custom-profile-link">' + profile_name + '</span></a> · <a href="#" onclick="return false" class="block-btn">' + (is_blocked ? 'Unblock' : 'Block') + '</a> · <a href="#" onclick="return false" class="note-btn" title="Click to edit">' + (custom_note === "" ? 'Edit note' : custom_note) + '</a> · ';

        // Buttons
        var right_element = item.querySelector('.right');
        if (right_element !== null) {
            right_element.insertAdjacentHTML('afterbegin', temp_string);
        }

        // Adjust opacity
        if (is_blocked) {
            item.style.opacity = 0.25;
        }
        $(item).find('span.custom-profile-link').css("color", "#BBBBBB");
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

var itemTypesObject = {};
var itemTypesObjectBuilt = false;

function BuildItemTypesObject() {
    if (itemTypesObjectBuilt) {
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
    itemTypesRaw = itemTypesRaw.replace(/\;/g, '');

    itemTypesObj = JSON.parse(itemTypesRaw);

    itemTypesObjectBuilt = true;
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

    this.getNameAndTypeAndBaseAndCorruptionStatus = function() {
        BuildItemTypesObject();

        var fullTitle = this.htmlDiv.find(".title").text().trim();

        var resultName = fullTitle;
        var resultType = 'Unknown';
        var resultBase = 'Unknown';

        // Process corruption status
        var corruptionRegexp = /^corrupted /;
        var resultIsCorrupted = fullTitle.search(corruptionRegexp) !== -1;
        if (resultIsCorrupted) {
            fullTitle = fullTitle.replace(corruptionRegexp, '').trim();
        }

        var keyNames = Object.keys(itemTypesObj);
        var j = 0;
        for (var type in itemTypesObj) {
            if (itemTypesObj.hasOwnProperty(type)) {
                for (var i = 0; i < itemTypesObj[type].length; ++i) {
                    var currentItemType = keyNames[j];
                    var currentItemBase = itemTypesObj[type][i];
                    if (fullTitle.indexOf(currentItemBase) !== -1) {
                        resultName = fullTitle.replace(currentItemBase, '').trim();
                        resultType = currentItemType.trim();
                        resultBase = currentItemBase.trim();
                        break;
                    }
                }
            }
            j++;
        }

        if (resultType.match(/\sHand\s/gi)) {
            resultType = resultType.replace(/(.*\sHand)(\s.*)/gi, '$1ed$2');
        }

        return [resultName, resultType, resultBase, resultIsCorrupted];
    };

    this.getNamePreSuffix = function(name) {
        var prefix = '';
        var suffix = '';

        var nameRegexp = /(\w+)?\s*(of.*)/gi;
        var match = nameRegexp.exec(name);

        if (match !== null) {
            prefix = (match[1]) ? match[1].trim() + ' ' : '';
            suffix = (match[2]) ? ' ' + match[2].trim() : '';
        }

        return [prefix, suffix];
    };

    this.getLevel = function() {
        return this.htmlDiv.find("span[data-name='ilvl']").text().replace("ilvl:", "").trim();
    };

    this.getRequirements = function() {
        var reqList = this.htmlDiv.find("ul.requirements > li");
        var requirements = [];

        reqList.each(function() {
            var that = $(this);
            var reqRegexp = /((Level)|(Str)|(Dex)|(Int)).*:\s+([0-9]+).*/gi;
            var match = reqRegexp.exec(that.text());

            if (match !== null) {
                var temp = '';
                match.forEach(function(element, index) {
                    if (index <= 1) { return; }                         // skip first 2 elements, we don't need them
                    else if (index == match.length - 1 && element) {
                        temp += ': ' + element.trim();                  // should always be the requirements value
                    }
                    else if (element) {
                        temp += element.trim();
                    }
                });
                requirements.push(temp);
            }
        });
        return requirements;
    };

    this.getQuality = function() {
        return this.htmlDiv.find("td[data-name='q']").data("value");
    };

    this.getQualityNormalizeState = function() {
        var capSpan = this.htmlDiv.find("td[data-name='q'] > span");
        var state = capSpan.text().match(/\+/g);                        // check for a '+' in the quality text to determine if it's normalized
        return state;
    };

    this.getQualityPhysDmg = function() {
        var dmg = this.htmlDiv.find("td[data-name='quality_pd']").text().trim();
        var dmgRegexp = /([0-9.]+)(\s*-\s*?)([0-9.]+)/gi;
        var match = dmgRegexp.exec(dmg);

        if (match !== null) {
            dmg = (match[1]) ? Math.round(parseFloat(match[1])) : '';
            dmg = (match[3]) ? dmg + '-' + Math.round(parseFloat(match[3])) : dmg;
        }
        return dmg;
    };

    this.getEleDmg = function(augmented) {
        var dmg = this.htmlDiv.find("td[data-name='ed']").data("ed");
        var dmgRegexp = /([0-9.]+)(\s*-\s*?)([0-9.]+),?/gi;
        var match = dmgRegexp.exec(dmg);
        var tmp = '';
        var aug = augmented ? ' (augmented)' : '';

        while (match !== null) {
            tmp = (match[1]) ? tmp + Math.round(parseFloat(match[1])) : tmp;
            tmp = (match[3]) ? tmp + '-' + Math.round(parseFloat(match[3])) : tmp;
            tmp += aug + ', ';
            match = dmgRegexp.exec(dmg);
        }
        dmg = tmp.replace(/,\s$/gi, '');

        return dmg;
    };

    this.getAPS = function() {
        return this.htmlDiv.find("td[data-name='aps']").data("value");
    };

    this.getCritChance = function() {
        return this.htmlDiv.find("td[data-name='crit']").data("value");
    };

    this.getBlockChance = function() {
        return this.htmlDiv.find("td[data-name='block']").data("value");
    };

    this.getQualityArmour = function() {
        return this.htmlDiv.find("td[data-name='quality_armour']").data("value");
    };

    this.getQualityEvasion = function() {
        return this.htmlDiv.find("td[data-name='quality_evasion']").data("value");
    };

    this.getQualityEnergyShield = function() {
        return this.htmlDiv.find("td[data-name='quality_shield']").data("value");
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
    var separator = '--------' + '\r\n';

    /* begin section */
    var [rarityAsText, rarityID] = this.getRarity();
    if (rarityAsText !== '')  {
        result += 'Rarity: ' + rarityAsText + '\r\n';
    }

    var [itemName, itemType, itemBase, isItemCorrupted] = this.getNameAndTypeAndBaseAndCorruptionStatus();
    var [itemExplicitModCount, itemExplicit] = this.getExplicitMods();
    var [itemCraftedModCount, itemCrafted] = this.getCraftedMods();
    var combinedExplicits = (itemExplicitModCount >= 1) ? itemExplicit : '';
    combinedExplicits = (itemCraftedModCount >= 1) ? combinedExplicits + '\r\n' + itemCrafted : combinedExplicits;
    var augmentedAPS = combinedExplicits.match(/^\d+% (increased|reduced) Attack Speed$/gim);
    var augmentedPhysDmg = combinedExplicits.match(/^((Adds \d+ to \d+)|(\d+% increased|reduced)) (Physical) Damage$/gim);
    var augmentedEleDmg = combinedExplicits.match(/^Adds \d+ to \d+ (Lightning|Fire|Cold) Damage$/gim);
    var augmentedCrit = combinedExplicits.match(/^\d+% (increased|reduced) Critical Strike Chance$/gim);
    var augmentedBlock = combinedExplicits.match(/^(-|\+)\d+% Chance to Block$/gim);

    // rare and higher
    if (rarityID > 1) {
        result += itemName + '\r\n';
        result += itemBase + '\r\n';
    }
    // magic
    else if (rarityID == 1) {
        var [namePrefix, nameSuffix] = this.getNamePreSuffix(itemName);
        result += (namePrefix + itemBase + nameSuffix) + '\r\n';
    }
    result += separator;

    /* begin section */
    var isWeapon = false;
    if (!itemType.match(/^(Amulet|Belt|Body Armour|Boots|Flask|Gloves|Helmet|Jewel|Quiver|Ring|Shield)$/gi)) {
        result += itemType  + '\r\n';
        isWeapon = true;
    }

    var quality = this.getQuality();
    var qualityCapped = (this.getQualityNormalizeState() || quality == '20') ? true : false;
    var hasQuality = false;
    if (quality !== '' && (quality >= 1 || qualityCapped)) {
        hasQuality = true;
        result += 'Quality: ' + (qualityCapped ? '+20' : '+' + quality) + '% (augmented)' + '\r\n';
    }
    var physDmg = this.getQualityPhysDmg();
    if (physDmg !== '') {
        result += 'Physical Damage: ' + physDmg + (hasQuality ? ' (augmented)' : '') + '\r\n';
    }
    var eleDmg = this.getEleDmg(augmentedEleDmg);
    if (eleDmg !== '') {
        result += 'Elemental Damage: ' + eleDmg + '\r\n';
    }
    var blockChance = this.getBlockChance();
    if (critChance !== '' && critChance > 0) {
        result += 'Chance to Block: ' + blockChance + '%' + (augmentedBlock ? ' (augmented)' : '') + '\r\n';
    }
    var armour = this.getQualityArmour();
    if (armour !== '' && armour > 0) {
        result += 'Armour: ' + armour + (hasQuality ? ' (augmented)' : '') + '\r\n';
    }
    var evasion = this.getQualityEvasion();
    if (evasion !== '' && evasion > 0) {
        result += 'Evasion Rating: ' + evasion + (hasQuality ? ' (augmented)' : '') + '\r\n';
    }
    var energyShield = this.getQualityEnergyShield();
    if (energyShield !== '' && energyShield > 0) {
        result += 'Energy Shield: ' + energyShield + (hasQuality ? ' (augmented)' : '') + '\r\n';
    }
    var critChance = this.getCritChance();
    if (critChance !== '' && critChance > 0) {
        result += 'Critical Strike Chance: ' + critChance + '%' + (augmentedCrit ? ' (augmented)' : '') + '\r\n';
    }
    var aps = this.getAPS();
    if (aps !== '' && aps > 0) {
        result += 'Attacks per Second: ' + aps + (augmentedAPS ? ' (augmented)' : '') + '\r\n';
    }

    if (isWeapon) {
        result += 'Weapon Range: Unknown' + '\r\n';
    }

    if (!itemType.match(/^(Amulet|Belt|Jewel|Quiver|Ring)$/gi)) {
        result += separator;
    }

    /* begin section */
    var requirements = this.getRequirements();
    if (requirements.length) {
        result += 'Requirements:' + "\r\n";
        requirements.forEach(function(element) {
            result += element + '\r\n';
        });
        result += separator;
    }

    /* begin section */
    var sockets = this.getSockets();
    if (sockets !== '') {
        result += 'Sockets: ' + sockets + '\r\n';
        result += separator;
    }

    /* begin section */
    result += 'Item Level: ' + this.getLevel() + '\r\n';
    result += separator;

    /* begin section */
    var [itemImplicitModCount, itemImplicit] = this.getImplicitMods();

    if (itemImplicit !== '') {
        result += itemImplicit + '\r\n';
    }

    /* begin section */
    if (combinedExplicits !== '') {
        if (itemImplicitModCount >= 1) {
            result += separator;
        }
        result += combinedExplicits + '\r\n';
    }

    /* begin section */
    if (rarityID == 3) {                                // unique
        if (combinedExplicits !== '') {
            result += separator;
        }
        result += 'Some unknown flavour text here.' + '\r\n';
    }
    if (itemType.match(/^Jewel$/gi)) {
        if (rarityID == 3 || combinedExplicits !== '') {
            result += separator;
        }
        result += 'Place into an allocated Jewel Socket on the Passive Skill Tree. Right click to remove from the Socket.' + '\r\n';
    }
    else if (itemType.match(/^Flask$/gi)) {
        if (rarityID == 3 || combinedExplicits !== '') {
            result += separator;
        }
        result += 'Right click to drink. Can only hold charges while in belt. Refills as you kill monsters.' + '\r\n';
    }

    if (isItemCorrupted) {
        if (rarityID == 3 || combinedExplicits !== '') {
            result += separator;
        }
        result += 'Corrupted' + '\r\n';
    }

    //result += 'Implicits: ' + itemImplicitModCount + '\r\n';
    //result += 'Explicits: ' + itemExplicitModCount + '\r\n';
    //result += 'Crafted Mods: ' + itemCraftedModCount + '\r\n';

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

        var note = prompt('Enter custom note for user "' + profile_name + '":', getProfileCustomNote(profile_name));

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