/* Additive text fields; legacy values remain untouched. */
export const ITEM_TEXT_FIELDS = {
  "skill": [
    [
      "effects",
      "Effects"
    ],
    [
      "upgrade5",
      "Rank 5 Upgrade"
    ],
    [
      "upgrade10",
      "Rank 10 Upgrade"
    ],
    [
      "upgrade15",
      "Rank 15 Upgrade"
    ],
    [
      "training",
      "Grinding / Training"
    ]
  ],
  "spell": [["category", "Type"],
    [
      "aiFavor",
      "AI Favor"
    ],
    [
      "effects",
      "Effects"
    ],
    [
      "upgrade5",
      "Rank 5 Upgrade"
    ],
    [
      "upgrade10",
      "Rank 10 Upgrade"
    ],
    [
      "upgrade15",
      "Rank 15 Upgrade"
    ]
  ],
  "weapon": [
    [
      "linkedSkill",
      "Linked Skill (name)"
    ],
    [
      "attackType",
      "Attack Type"
    ],
    [
      "toHitStat",
      "To-Hit Stat"
    ],
    [
      "aiFavor",
      "AI Favor"
    ],
    [
      "cooldown",
      "Cooldown"
    ],
    [
      "effects",
      "Effects"
    ],
    [
      "handsRequired",
      "Hands Required (special rules)"
    ],
    [
      "ammunition",
      "Ammunition"
    ]
  ],
  "gear": [
    [
      "subtype",
      "Subtype"
    ],
    [
      "bonuses",
      "Bonuses"
    ],
    [
      "effects",
      "Special Effects"
    ],
    [
      "uses",
      "Uses / Charges"
    ],
    [
      "liftingWeight",
      "Lifting Weight / Weight (special rules)"
    ]
  ],
  "race": [
    [
      "statAdjustments",
      "Stat Adjustments"
    ],
    [
      "size",
      "Size"
    ],
    [
      "movementChanges",
      "Movement Changes"
    ],
    [
      "skillChanges",
      "Skill Changes"
    ],
    [
      "spellChanges",
      "Spell Changes"
    ],
    [
      "resistances",
      "Resistances / Immunities"
    ],
    [
      "naturalAttacks",
      "Natural Attacks"
    ],
    [
      "limitations",
      "Drawbacks / Limitations"
    ],
    [
      "specialRules",
      "Special Rules"
    ]
  ],
  "class": [
    [
      "statAdjustments",
      "Stat Adjustments"
    ],
    [
      "skillBonuses",
      "Skill Bonuses"
    ],
    [
      "grantedSkills",
      "Granted Skills"
    ],
    [
      "favoredSpells",
      "Favored Spells"
    ],
    [
      "limitations",
      "Limitations"
    ],
    [
      "specialRules",
      "Special Abilities / Rules"
    ]
  ],
  "ability": [
    [
      "abilityType",
      "Type"
    ],
    [
      "uses",
      "Uses / Charges"
    ],
    [
      "cooldown",
      "Cooldown"
    ],
    [
      "effects",
      "Effects"
    ],
    [
      "limitations",
      "Limitations"
    ]
  ],
  "achievement": [
    [
      "floor",
      "Floor"
    ],
    [
      "awardedDate",
      "Awarded Date"
    ],
    [
      "notes",
      "Notes"
    ]
  ]
};
export function statKey(value) {
 const s = String(value ?? "").trim().toLowerCase();
 return ({strength:"str", intelligence:"int", constitution:"con", dexterity:"dex", charisma:"cha", "no stat mod":"none"})[s] ?? s;
}
export function linkedSkill(item, items) {
 const name = String(item.system.linkedSkill ?? "").trim().toLowerCase();
 return name ? items.find(i => i.type === "skill" && i.name.toLowerCase() === name) : items.get(item.system.skillId);
}
