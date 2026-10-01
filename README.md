# Dungeon Crawler Carl — unofficial Foundry prototype 0.1.0

Targets Foundry VTT 14. This is a first-pass prototype, not an official or runtime-verified release.

## Install
Extract the ZIP so the system.json file is at Data/systems/dungeon-crawler-carl/system.json. Restart Foundry and create a world using Dungeon Crawler Carl — Unofficial. Forge users can upload the extracted system folder through their hosting tools.

## Use
Create a Crawler or Mob actor. Edit base Stats and enhancement bonuses; modifiers and crawler Mana maximum calculate automatically. Health is tracked in slots, not raw hit points. Crawlers have ten slots; Mobs have editable slot count and slot toughness. Token bars use Health slots and Mana.

Set Difficulty, roll mode, and situational bonus before clicking a Stat or ability. Evade uses DEX without Skill Rank. Skill checks use Stat Mod + Rank; rank-zero Attack/Utility checks use Disadvantage. Natural 1/20 and success/failure margins appear in chat. Mobs display fixed Action/Evade difficulties and do not roll checks.

Add items from sheet buttons or drag existing Items onto the sheet. Edit their Rank, Stat, Mana cost, damage formula and description. Clicking a Spell spends Mana and rolls its check; use Passive for a spell that only posts its effect. Damage rolls are separate and use the entered formula, with optional Stat Mod. Set the formula to the correct total dice for the current Rank. Item deletion uses the item sheet header controls.

For each separate damage instance, apply DR and elemental adjustments manually, then remove floor(adjusted damage / slot toughness) Health slots. Remainders do not accumulate. Healing restores slots. Spell effects, targeting, critical damage, injuries, recovery, death countdown, Rank benefits, and Buff/Debuff penalties are adjudicated manually. Status markers are labels, not automated effects. Item Hotlist is a flag only; no dedicated Hotlist panel yet. Race/Class items record features without applying modifiers. Advancement is editable Level/Rank, not an XP workflow. Achievements record description and reward.

No rulebook text, artwork, content compendiums, character wizard or starter characters are bundled. Bring your own book. The interface uses an original dark broadcast HUD, cyan highlights, green Health slots and gold achievements.

## Validation
JavaScript syntax and core rule calculations checked, including all Stat Mod boundaries, degree of success and Health-slot damage example. An HTML design preview illustrates the same CSS but is not a running Foundry sheet; browser rendering verification was unavailable in this environment. Foundry runtime integration, sheet saving, item drops and token bars require in-world testing.
