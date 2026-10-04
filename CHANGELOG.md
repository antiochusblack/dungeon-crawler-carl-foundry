# 0.4.4

- Confirm Rank changes from +/− buttons and typed Rank values.
- Show basic Skill/Spell effects, unlocked Rank upgrades and applicable outcome guidance in roll cards.
- Make all eight embedded Item lists collapsible, with compact names, roll/use, edit and confirmed-removal controls. Keep expanded rows open during sheet refreshes.

# 0.4.3

- Add a release builder that always updates version, fixed manifest URL and matching download URL together, and verifies the packaged manifest matches the source.
- Carry forward all v0.4.2 Item import, table and chat-theme changes.

# 0.4.2

- Add a GM-only Import Items sidebar button for separate private JSON bundles, organised folders and normal draggable world Items.

- Give system chat cards a bright dungeon game-show theme: gold marquees, berry backgrounds, cyan links and bold dice totals.
- Rebuild the separate private tables file with clean entry names and effect descriptions. Chat cards display these fields directly, without rewriting table rows.
- Offer explicit confirmation to replace older imported table revisions; preserve existing edits when declined.
- Make subtable links in these chat cards roll the linked table on click. Existing imported tables are supported.

# 0.4.1

- Add a GM-only Import Tables button to the RollTables sidebar for separate private JSON bundles.
- Validate folders, roll ranges and subtable links; preserve previously imported world tables on repeat imports.
- Keep rulebook table content outside the public system and release package.

# 0.4.0

- Add Ability documents and flexible fields for all eight Item types.
- Add compact embedded Item editing/removal and document-level deletion confirmation.
- Preserve v0.3.0 inventory mechanics; update the version and matching asset URL to 0.4.0.
- Add a LevelDB Item compendium with 40 original examples, sorted into eight type folders. See ITEM-DEVELOPMENT.md.

# Changelog

## 0.3.0
- Reorganise actor tabs and provide relevant fields for each item type.
- Add resource adjustment, Health-slot damage and rest controls.
- Add paper-doll equipment slots, location tracking, quantity controls and a ten-entry Hotlist.
- Enforce clothing, hand, accessory, belt and cape limits; apply fixed equipped bonuses only.
- Add Skill advancement marks, spell metadata, weapon Skill links and consumable gear types.
- Preserve permanent update metadata.

## 0.2.0
- Fix Crawler and Mob sheets failing to open by wrapping the actor template part in a single root element.
- Apply the same single-root correction to the Item sheet.
- Preserve manifest and version-specific download URLs inside the release ZIP as well as the repository manifest.

## 0.1.0
- Initial unofficial prototype.
