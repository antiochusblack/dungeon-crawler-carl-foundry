# Dungeon Crawler Carl — unofficial Foundry prototype

Version 0.4.0. Targets Foundry VTT 14. Includes the Crawler Starter Kit compendium: five original examples per Item type, organised into eight folders. Examples are custom sample content, not published rulebook entries.

## Sheets

Crawler HUD contains Stats, Health Bar, Mana, AI Favor, Popularity, gold, Miscellaneous Junk, unspent Stat points, dying rounds and combat values. Set the button amount and use + / − to adjust resources. Click a Health slot to set current Health. Enter final damage after DR and elemental adjustments, then apply it to the Health Bar; damage consumes complete slots from right to left and discards the remainder. Individual slot bonuses can be entered under Log & Effects. Short/long rests restore resources; resolve conditions and injuries manually.

Skills & Spells includes Rank, Stat, check type, Passive, used/advancement marks, grinding hours, damage, range, duration, cooldown, limitations and upgrades. Spells default to INT; Favored Class mismatch adds one Mana. Passive spells spend Mana without making a check. Spells cannot be cast untrained and must be in the Hotlist for casting during an active combat. Damage formulas represent the current Rank's total dice; Rank upgrades and critical effects are manual. Rank 16+ benefits require Floor 6. The RPG uses Levels, not XP. Level gains and Stat-point allocation are manual.

Weapons may link to an owned Weapon Skill for attack Rank and Stat. Existing manual/legacy weapon attack fields remain usable. Mobs use fixed Action, Evade and Surprise difficulties; ability entries include a fixed Action difficulty and damage formula, rather than rolling d20 checks.

Race & Class records benefits, selection requirements and character background. Achievements record their trigger, awarded Floor/date and reward without irrelevant combat fields. Log & Effects records Buffs, Debuffs, resistances, vulnerabilities, immunities and three active External Buffs. Status icons are markers; conditional bonuses and durations are manual.

## Inventory

Inventory storage is unlimited and weightless. Items may be stored, equipped/held, left on the floor, or in personal space/elsewhere. Strength × 15 lb shows the lifting maximum, not an encumbrance allowance; creature/liquid/explosive restrictions are adjudicated by the GM.

The paper doll shows Head, Torso, Arms, Gloves, Legs, Feet and Holding. Empty slots have Add gear buttons. Click equipped gear to edit it or Store to remove it. Set an item's allowed gear slot in its editor, then Equip or select Equipped in its row. Each clothing slot holds one entry; one pair of gloves may be worn while both hands hold items. Two-handed equipment blocks both holding slots. Accessories allow ten entries, including at most one belt and one cape. A quantity stack represents one equipped copy, with remaining copies stored.

Fixed Stat, DR and Evade bonuses from valid equipped items apply automatically. An optional gear bonus to the 100% Health slot is also supported. Stored, dropped or remote gear does not grant these bonuses. Keep manual enhancement/DR fields for other sources, to avoid double-counting gear. Conditional bonuses, percentage modifiers and other special effects stay in the description.

The Hotlist defaults to ten entries; capacity is editable for specific rule effects. It is a shortcut list, not a second item copy or equipment location. Prepare/remove entries with the Hotlist buttons. Item editors allow a numbered position or Auto. Hotlist weapons draw on Attack and store conflicting held weapons/shields first. Other equip actions require freeing occupied slots. In combat, retrieving a non-Hotlist item requires its normal Action.

Gear supports armour/shields, potions, scrolls, spellbooks, pet carriers and other items. Quantity controls add/remove copies. Potions, scrolls and spellbooks spend a copy on use. Scrolls use their fixed Spell Rank and cost no Mana; configure Passive for a non-Attack scroll. Spellbooks add the named Spell at their recorded Rank, but complete the new Spell's mechanical fields manually. Consumable effects remain manual. Charges are a separate manual tracker. Zero-quantity items become unavailable.

## Install and release

The stable manifest remains:
https://raw.githubusercontent.com/antiochusblack/dungeon-crawler-carl-foundry/main/system.json

See RELEASE.md for permanent packaging rules. When a release is requested, extract its ZIP so system.json is at Data/systems/dungeon-crawler-carl/system.json. For upgrades preserve the same system ID and existing actor/item data. No rulebook text or official artwork is bundled; the silhouette is an original SVG.

## Validation

Run node tests/rules.test.mjs for equipment conflicts, accessory limits, Hotlist capacity, Health-slot damage and resource bounds. All six actor tabs and seven item templates have been compiled against populated contexts and checked for a single root. A lightweight Foundry API harness exercises resource adjustment and equipped-bonus removal. A static graphic preview has been rendered and visually inspected. This is not a running Foundry instance: sheet saving, drag/drop and token bars still require in-world testing.

## Rules reviewed

Core Rulebook: Stats/checks pp. 56–61; actions/combat pp. 64, 79–86; Health, resting and Buffs pp. 93–97; Inventory, Hotlist and Gear Slots pp. 98–99; character setup pp. 108–116; advancement p. 169; Skill/Spell fields pp. 173–175, 202; magical equipment pp. 216–219; Popularity pp. 279–280.
