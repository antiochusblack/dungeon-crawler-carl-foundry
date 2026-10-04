# v0.4.0 Item changes

The release metadata is prepared for v0.4.0, with the fixed manifest URL and matching v0.4.0 asset URL. See RELEASE.md.

The Crawler Starter Kit compendium contains 40 original, unofficial sample Items in eight type folders. Drag them onto crawlers and edit their embedded copies. Race/Class descriptions do not automatically grant the referenced Skills, Spells or Abilities. Add those separately. Sample mechanical benefits are resolved manually unless the existing system explicitly supports them.

All eight types are normal Foundry Item documents with a type-specific editor. Every editor includes Description and Source. The added rule descriptions are plain text; conditional bespoke rules are resolved manually.

| Type | Fields | Crawler tab |
| --- | --- | --- |
| Skill | Rank, advancement mark; Associated Stat, Type, Check, Range, Limitations, Cooldown, Description, Base Damage, Effects, Rank 5/10/15 upgrades, Grinding / Training | Skills & Spells |
| Spell | Rank, Mana Cost, advancement mark; Type, Casting Stat, Favored Classes, Range, Duration, AI Favor, Limitations, Cooldown, Description, Base Damage, Effects, Rank 5/10/15 upgrades | Skills & Spells |
| Weapon | Quantity, inventory/location/hand state, Hotlist slot; Linked Skill, Attack Type, To-Hit Stat, Range, Base Damage, Damage Stat, Damage Type, AI Favor, Limitations, Cooldown, Effects, Hands Required, Ammunition, Description | Inventory |
| Gear | Quantity, location, Gear Slot, Hotlist slot; Subtype, Rarity, Description, Bonuses, Special Effects, Limitations, Uses / Charges, Lifting Weight | Inventory |
| Race | Description, Requirements / Restrictions, Stat Adjustments, Size, Movement Changes, Skill Changes, Spell Changes, Resistances / Immunities, Natural Attacks, Benefits, Drawbacks / Limitations, Special Rules | Race & Class |
| Class | Description, Requirements, Stat Adjustments, Skill Bonuses, Granted Skills, Favored Spells, Benefits, Limitations, Special Abilities / Rules | Race & Class |
| Ability | Source, Type, Uses / Charges, Cooldown, Description, Effects, Limitations | Race & Class: Abilities |
| Achievement | Description / Announcement, Trigger, Reward, Floor, Awarded Date, Awarded checkbox, Notes | Achievements |

## Interaction

Foundry resolves world and compendium Item drops using its native ActorSheetV2 drop workflow. Rows export standard Item UUID drag data. Incoming Items are copied to embedded Actor documents; removing a copy does not delete the source. A normal drag copies/references the document: use the trash control to remove the character's copy. Existing equipment-conflict and Hotlist-capacity guards remain active; invalid equipped drops can be rejected rather than overwriting an occupied slot.

All primary Item rows have compact edit and trash controls with tooltips. Ability names open their editor. Equip/store, quantity, use, paper doll and Hotlist controls remain in place.

The CarlItem document's `_preDelete` requires an explicit Delete response; Cancel or closing the dialog returns false. This covers world, embedded, batch and custom-control deletions using normal Foundry document APIs. A native Foundry workflow that already confirms deletion may show its own prompt followed by the system guard. The system's trash controls call `item.delete()` without bypass options.

## Compatibility

No destructive migration or world rewrite is needed. Existing fields and keys remain, including combined upgrades, awardedOn, grindingHours, weight, charges, hands, equipped bonuses and linked skillId. New text fields are additive. Weapon Skill names can be entered independently; they resolve case-insensitively against embedded Skills. An existing Skill ID is still used when the name field is empty. Rename a name-linked Skill and update the Weapon's link accordingly.

Stats accept abbreviations or full standard names. Other custom Stat names remain stored and displayable, but a check warns that the rule needs manual resolution. Base Damage accepts arbitrary text; clickable damage requires a valid dice formula, as before. Hands Required and Weight rules are text alongside the existing numeric slot/weight controls. Gear Subtype is descriptive; the existing consumable mode controls potion/scroll/spellbook behavior.

## Validation

- `node tests/rules.test.mjs`: existing inventory, equipment, Hotlist, Health and resource behavior.
- `node tests/items.test.mjs`: all eight editor contexts, cancellation/close/confirmation for world and embedded Items, custom trash behavior, escaped names, field preservation, UUID drag data, legacy Skill links and fixed release metadata. Uses Foundry API mocks.
- `NODE_PATH=/tmp/carl-check/node_modules node tests/sheets.test.cjs "$PWD"` (install Handlebars and linkedom into that prefix first): eight Item editors have one root and no duplicate field inputs; all Crawler Item rows render edit/remove controls.
- No licensed Foundry v14 instance was available. Live world/compendium drops, directory dialogs and interactive form persistence still need a Foundry smoke test before release.
