import { confirmRankChange } from "./rank-confirm.mjs";
import { effectText, rollEffectsHTML } from "./roll-effects.mjs";
import "./item-import.mjs";
import "./table-chat.mjs";
import "./table-import.mjs";
import { ITEM_TEXT_FIELDS, statKey, linkedSkill } from "./item-fields.mjs";
import { statMod, degree } from "./math.mjs";
import {
  LOCATIONS,
  GEAR_SLOTS,
  EQUIP_SLOTS,
  num,
  equipSlot,
  conflict,
  equipmentState,
  hotlistState,
  healthAfterDamage,
  adjustedResource,
} from "./inventory.mjs";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const esc = (s) => foundry.utils.escapeHTML(String(s ?? ""));
const PHYSICAL = ["weapon", "gear"];
const allItems = (a) => Array.from(a.items);
class CarlActor extends Actor {
  async _preUpdate(changes, options, user) {
    const result = await super._preUpdate(changes, options, user);
    if (result === false) return false;
    const update = foundry.utils.expandObject(changes);
    for (const [path, min, max] of [
      ["health.value", 0, this.system.health.max],
      ["health.max", 1, 100],
      ["mana.value", 0, this.system.mana.max],
      ["aiFavor", 0, Infinity],
      ["gold", 0, Infinity],
      ["miscJunk", 0, Infinity],
      ["statPoints", 0, Infinity],
      ["level", 1, 250],
      ["hotlistCapacity", 1, 50],
      ["dyingRounds", 0, Infinity],
    ]) {
      const value = foundry.utils.getProperty(update, "system." + path);
      if (value !== undefined) {
        const clamped = Math.floor(adjustedResource(value, 0, min, max));
        if (changes.system)
          foundry.utils.setProperty(changes.system, path, clamped);
        else changes["system." + path] = clamped;
      }
    }
    if (foundry.utils.getProperty(update, "system.health.value") > 0) {
      if (changes.system) changes.system.dyingRounds = 0;
      else changes["system.dyingRounds"] = 0;
    }
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    const s = this.system;
    const gear = equipmentState(allItems(this)).valid;
    s.gearDr = gear.reduce((n, i) => n + num(i.system.drBonus), 0);
    s.gearEvade = gear.reduce((n, i) => n + num(i.system.evadeBonus), 0);
    for (const [key, st] of Object.entries(s.stats)) {
      st.gear = gear.reduce((n, i) => n + num(i.system.statBonuses?.[key]), 0);
      st.total = Math.max(1, num(st.base, 4) + num(st.bonus) + st.gear);
      st.mod = statMod(st.total);
    }
    s.slot =
      this.type === "crawler"
        ? s.stats.con.mod
        : Math.max(1, num(s.mob.slot, 2));
    if (this.type === "crawler") s.health.max = 10;
    s.mana.max = s.stats.int.total;
    s.drTotal = Math.max(0, num(s.dr) + s.gearDr);
    s.evadeTotal = s.stats.dex.mod + num(s.evadeBonus) + s.gearEvade;
    s.lift = s.stats.str.total * 15;
    const topBonus = gear.reduce(
      (n, i) => n + num(i.system.healthSlotBonus),
      0,
    );
    s.slotCosts = Array.from(
      { length: Math.max(1, Math.min(100, num(s.health.max, 10))) },
      (_, i) =>
        Math.max(
          1,
          s.slot + num(s.slotBonuses?.[i + 1]) + (i === 9 ? topBonus : 0),
        ),
    );
  }
  async check(label, stat, rank = 0, untrained = false, extra = 0, item = null) {
    if (!this.isOwner) return;
    stat = statKey(stat);
    if (stat !== "none" && !this.system.stats[stat]) return ui.notifications.warn("Choose a standard Stat for this check; resolve custom Stat rules manually.");
    const s = this.system;
    let mode =
      untrained && s.roll.mode !== "advantage"
        ? "disadvantage"
        : untrained
          ? "normal"
          : s.roll.mode;
    let die =
      mode === "advantage"
        ? "2d20kh"
        : mode === "disadvantage"
          ? "2d20kl"
          : "1d20";
    const mod = stat === "none" ? 0 : num(s.stats[stat]?.mod);
    const roll = await new Roll(
      `${die}+${mod}+${rank}+${num(s.roll.bonus) + extra}`,
    ).evaluate();
    const n = roll.dice[0].results.find((r) => r.active).result;
    const outcome = degree(n, roll.total, s.roll.difficulty);
    const effects = rollEffectsHTML(item, rank, outcome, {attack: item?.type === "weapon" || item?.system.checkType === "attack", evade: label === "Evade", floor: s.floor});
    await roll.toMessage(
      {
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `<div class="carl-card"><small>WORLD DUNGEON • SHOWTIME!</small><h3>${esc(label)}</h3><b>${outcome}</b><p>Difficulty ${s.roll.difficulty} • ${esc(mode)} • Rank ${rank}</p>${effects}</div>`,
      },
      { rollMode: game.settings.get("core", "rollMode") },
    );
  }
}
class CarlItem extends Item {
  async _preDelete(options, user) {
    if ((await super._preDelete(options, user)) === false) return false;
    return await foundry.applications.api.DialogV2.confirm({
      window: { title: `Delete "${this.name}"?` },
      content: `<p>Delete &quot;${esc(this.name)}&quot;?${this.parent ? " This removes this character’s copy only." : ""}</p>`,
      yes: { label: "Delete", icon: "fa-solid fa-trash", default: false },
      no: { label: "Cancel", icon: "fa-solid fa-xmark", default: true },
      modal: true,
      rejectClose: false,
    }) === true;
  }

  async _preUpdate(changes, options, user) {
    const result = await super._preUpdate(changes, options, user);
    if (result === false) return false;
    if (!this.parent) return;
    const delta = foundry.utils.expandObject(changes).system ?? {};
    if (
      ![
        "location",
        "gearSlot",
        "equipSlot",
        "hands",
        "accessoryKind",
        "hotlist",
        "hotlistPosition",
      ].some((k) => k in delta)
    )
      return;
    const proposed = {
      id: this.id,
      name: this.name,
      type: this.type,
      system: foundry.utils.mergeObject(
        foundry.utils.deepClone(this.system),
        delta,
        { inplace: false },
      ),
    };
    const others = allItems(this.parent).filter((i) => i.id !== this.id);
    if (PHYSICAL.includes(this.type)) {
      const error = conflict(
        proposed,
        others.filter((i) => PHYSICAL.includes(i.type)),
      );
      if (error) {
        ui.notifications.warn(error);
        return false;
      }
    }
    if (proposed.system.hotlist) {
      if (
        PHYSICAL.includes(this.type) &&
        ["floor", "home"].includes(proposed.system.location)
      ) {
        ui.notifications.warn(
          "Remove this item from the Hotlist before leaving it on the floor or elsewhere.",
        );
        return false;
      }
      const capacity = num(this.parent.system.hotlistCapacity, 10);
      if (others.filter((i) => i.system.hotlist).length >= capacity) {
        ui.notifications.warn("Hotlist is full. Remove another entry first.");
        return false;
      }
      const position = num(proposed.system.hotlistPosition);
      if (position > capacity) {
        ui.notifications.warn("Hotlist position exceeds its capacity.");
        return false;
      }
      if (
        position > 0 &&
        others.some(
          (i) => i.system.hotlist && num(i.system.hotlistPosition) === position,
        )
      ) {
        ui.notifications.warn(
          "That Hotlist position is occupied. Use Auto or choose another position.",
        );
        return false;
      }
    }
  }
  async _preCreate(data, options, user) {
    const result = await super._preCreate(data, options, user);
    if (result === false) return false;
    if (this.parent) {
      if (PHYSICAL.includes(this.type)) {
        const error = conflict(
          this,
          allItems(this.parent).filter((i) => PHYSICAL.includes(i.type)),
        );
        if (error) {
          ui.notifications.warn(error);
          return false;
        }
      }
      if (
        this.system.hotlist &&
        allItems(this.parent).filter((i) => i.system.hotlist).length >=
          num(this.parent.system.hotlistCapacity, 10)
      ) {
        ui.notifications.warn("Hotlist is full.");
        return false;
      }
    }
  }
}
async function post(actor, title, text, kind = "SYSTEM") {
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="carl-card"><small>${esc(kind)}</small><h3>${esc(title)}</h3><p>${esc(text).replaceAll("\n", "<br>")}</p></div>`,
  });
}
const actions = {
  stat: async function (e, t) {
    if (this.actor.type === "crawler")
      await this.actor.check(t.dataset.stat.toUpperCase(), t.dataset.stat);
  },
  evade: async function () {
    if (this.actor.type === "crawler")
      await this.actor.check(
        "Evade",
        "dex",
        0,
        false,
        num(this.actor.system.evadeBonus) + num(this.actor.system.gearEvade),
      );
  },
  edit: function (e, t) {
    this.actor.items.get(t.dataset.id)?.sheet.render(true);
  },
  remove: async function (e, t) {
    if (!this.isEditable) return;
    await this.actor.items.get(t.dataset.id)?.delete();
  },
  create: async function (e, t) {
    if (!this.isEditable) return;
    const type = t.dataset.type;
    const [item] = await this.actor.createEmbeddedDocuments("Item", [
      {
        name: "New " + type,
        type,
        system: type === "weapon" ? { rank: 0 } : {},
      },
    ]);
    item?.sheet.render(true);
  },
  adjust: async function (e, t) {
    if (!this.isEditable) return;
    const allowed = [
      "health.value",
      "mana.value",
      "aiFavor",
      "popularity",
      "gold",
      "miscJunk",
      "statPoints",
      "level",
      "dyingRounds",
    ];
    const path = t.dataset.resource;
    if (!allowed.includes(path)) return;
    const s = this.actor.system;
    const amount = Math.max(
      1,
      Math.floor(
        num(this.element.querySelector("[data-adjust-amount]")?.value, 1),
      ),
    );
    this._adjustAmount = amount;
    const max =
      path === "health.value"
        ? s.health.max
        : path === "mana.value"
          ? s.mana.max
          : path === "level"
            ? 250
            : Infinity;
    const min = path === "level" ? 1 : path === "popularity" ? -Infinity : 0;
    await this.actor.update({
      ["system." + path]: adjustedResource(
        foundry.utils.getProperty(s, path),
        num(t.dataset.delta) * amount,
        min,
        max,
      ),
    });
  },
  healthSlot: async function (e, t) {
    if (this.isEditable)
      await this.actor.update({ "system.health.value": num(t.dataset.value) });
  },
  applyDamage: async function () {
    if (!this.isEditable) return;
    const damage = Math.max(
      0,
      num(this.element.querySelector("[data-final-damage]")?.value),
    );
    const s = this.actor.system;
    const value = healthAfterDamage(s.health.value, s.slotCosts, damage);
    const changes = { "system.health.value": value };
    if (value === 0 && s.health.value > 0 && this.actor.type === "crawler")
      changes["system.dyingRounds"] = s.stats.con.mod;
    else if (
      value === 0 &&
      s.health.value === 0 &&
      this.actor.type === "crawler" &&
      damage > 0
    )
      changes["system.dyingRounds"] = Math.max(0, num(s.dyingRounds) - 1);
    await this.actor.update(changes);
    await post(
      this.actor,
      "Health Bar",
      `${damage} adjusted damage: ${s.health.value - value} slot(s) lost. Remaining damage below a full slot is discarded.`,
    );
  },
  rest: async function (e, t) {
    if (!this.isEditable) return;
    const s = this.actor.system;
    const long = t.dataset.rest === "long";
    await this.actor.update({
      "system.health.value": long
        ? s.health.max
        : Math.min(s.health.max, s.health.value + 5),
      "system.mana.value": long
        ? s.mana.max
        : Math.min(s.mana.max, s.mana.value + Math.floor(s.mana.max / 2)),
      "system.dyingRounds": 0,
    });
    await post(
      this.actor,
      long ? "Long rest — 8 hours" : "Short rest — 2 hours",
      "Resources restored. Resolve injuries, Buffs and Debuffs separately.",
    );
  },
  hotlist: async function (e, t) {
    if (!this.isEditable) return;
    const item = this.actor.items.get(t.dataset.id);
    await item?.update({ "system.hotlist": !item.system.hotlist });
  },
  addSlot: async function (e, t) {
    if (!this.isEditable) return;
    const slot = t.dataset.slot;
    const holding = ["left", "right", "both"].includes(slot);
    const [item] = await this.actor.createEmbeddedDocuments("Item", [
      {
        name: "New " + (EQUIP_SLOTS[slot] ?? "gear"),
        type: "gear",
        system: {
          location: "equipped",
          gearSlot: holding ? "holding" : slot,
          equipSlot: slot === "right" ? "right" : "left",
          hands: slot === "both" ? 2 : 1,
        },
      },
    ]);
    item?.sheet.render(true);
  },
  equip: async function (e, t) {
    if (!this.isEditable) return;
    const item = this.actor.items.get(t.dataset.id);
    if (item)
      await item.update({
        "system.location":
          item.system.location === "equipped" ? "inventory" : "equipped",
      });
  },
  quantity: async function (e, t) {
    if (!this.isEditable) return;
    const i = this.actor.items.get(t.dataset.id);
    if (!i) return;
    const value = adjustedResource(i.system.quantity, num(t.dataset.delta));
    const changes = { "system.quantity": value };
    if (value === 0) {
      changes["system.location"] = "inventory";
      changes["system.hotlist"] = false;
    }
    await i.update(changes);
  },
  used: async function (e, t) {
    if (this.isEditable) {
      const i = this.actor.items.get(t.dataset.id);
      await i?.update({ "system.used": !i.system.used });
    }
  },
  rank: async function (e, t) {
    if (this.isEditable) {
      const i = this.actor.items.get(t.dataset.id);
      if(i) await confirmRankChange(i, adjustedResource(i.system.rank, num(t.dataset.delta), 0, 20));
    }
  },
  damage: async function (e, t) {
    if (!this.isEditable) return;
    const i = this.actor.items.get(t.dataset.id);
    if (!i?.system.damage) return;
    try {
      await new Roll(
        i.system.damage +
          (i.system.damageMod
            ? `+${num(this.actor.system.stats[statKey(i.system.stat)]?.mod)}`
            : ""),
        this.actor.getRollData(),
      ).toMessage(
        {
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: `<div class="carl-card"><small>WORLD DUNGEON • DAMAGE!</small><h3>${esc(i.name)} — ${esc(i.system.damageType || "Damage")}</h3></div>`,
        },
        { rollMode: game.settings.get("core", "rollMode") },
      );
    } catch {
      ui.notifications.warn("Check the damage formula.");
    }
  },
  use: async function (e, t) {
    if (!this.isEditable) return;
    const i = this.actor.items.get(t.dataset.id);
    if (!i) return;
    const s = i.system;
    const consume =
      i.type === "gear" &&
      (s.consumable || ["potion", "scroll", "spellbook"].includes(s.gearType));
    if (consume && num(s.quantity, 1) < 1)
      return ui.notifications.warn("No copies remain.");
    if (i.type === "gear" && s.gearType === "spellbook" && !s.spellName)
      return ui.notifications.warn(
        "Enter the granted Spell name before reading this spellbook.",
      );
    if (i.type === "spell") {
      if (num(s.rank) < 1)
        return ui.notifications.warn(
          "Spells cannot be attempted untrained. Use a scroll item instead.",
        );
      if (game.combat?.started && !s.hotlist)
        return ui.notifications.warn(
          "Prepare this Spell in the Hotlist before casting it in combat.",
        );
      const cost =
        num(s.manaCost) +
        (s.favored && !s.favoredApplies ? 1 : 0) +
        num(s.manaSurcharge);
      if (this.actor.system.mana.value < cost)
        return ui.notifications.warn("Insufficient Mana.");
      await this.actor.update({
        "system.mana.value": this.actor.system.mana.value - cost,
      });
    }
    if (PHYSICAL.includes(i.type) && ["floor", "home"].includes(s.location))
      return ui.notifications.warn(
        "Retrieve the item into your Inventory before using it.",
      );
    if (i.type === "weapon" && s.location !== "equipped") {
      if (!s.hotlist && game.combat?.started)
        return ui.notifications.warn(
          "Retrieve this weapon first; Hotlist weapons may be drawn with the Attack Action.",
        );
      let others = allItems(this.actor).filter(
        (j) => j.id !== i.id && PHYSICAL.includes(j.type),
      );
      let error = conflict({ system: { ...s, location: "equipped" } }, others);
      if (error && s.hotlist) {
        const target = equipSlot(s);
        const swaps = others.filter(
          (j) =>
            j.system.location === "equipped" &&
            ["left", "right", "both"].includes(target) &&
            ["left", "right", "both"].includes(equipSlot(j.system)) &&
            (target === equipSlot(j.system) ||
              target === "both" ||
              equipSlot(j.system) === "both"),
        );
        for (const previous of swaps)
          await previous.update({ "system.location": "inventory" });
        others = allItems(this.actor).filter(
          (j) => j.id !== i.id && PHYSICAL.includes(j.type),
        );
        error = conflict({ system: { ...s, location: "equipped" } }, others);
      }
      if (error) return ui.notifications.warn(error);
      await i.update({ "system.location": "equipped" });
      if (i.system.location !== "equipped") return;
    }
    if (
      this.actor.type === "crawler" &&
      num(s.rank) > 15 &&
      this.actor.system.floor < 6
    )
      ui.notifications.warn(
        "Rank 16+ benefits unlock on Floor 6. Apply eligible effects manually.",
      );
    const skill =
      i.type === "weapon" ? linkedSkill(i, this.actor.items) : null;
    if ((s.skillId || s.linkedSkill) && !skill)
      return ui.notifications.warn(
        "The linked Weapon Skill is missing. Edit this weapon to select a Skill.",
      );
    const rank = skill ? num(skill.system.rank) : num(s.rank);
    const stat = skill ? skill.system.stat : (s.toHitStat || s.stat);
    const passive = skill ? skill.system.passive : s.passive;
    if (
      this.actor.type === "crawler" &&
      !passive &&
      ["skill", "spell", "weapon"].includes(i.type)
    ) {
      await this.actor.check(
        i.name,
        stat,
        rank,
        rank === 0 && i.type !== "spell",
        0, skill || i,
      );
      if (i.type !== "weapon") await i.update({ "system.used": true });
      else if (skill) await skill.update({ "system.used": true });
    } else
      await post(
        this.actor,
        i.name,
        [
          effectText(skill || i, rank),
          s.range ? "Range: " + s.range : "",
          s.duration ? "Duration: " + s.duration : "",
          s.cooldown ? "Cooldown: " + s.cooldown : "",
          this.actor.type === "mob"
            ? "Action Difficulty: " +
              num(s.difficulty, this.actor.system.mob.action)
            : "",
          s.limitations,
        ]
          .filter(Boolean)
          .join("\n"),
        i.type.toUpperCase(),
      );
    if (
      i.type === "gear" &&
      s.gearType === "scroll" &&
      this.actor.type === "crawler" &&
      !s.passive
    )
      await this.actor.check(
        s.spellName || i.name,
        s.stat,
        num(s.scrollRank, 1),
      );
    if (i.type === "gear" && s.gearType === "spellbook")
      await this.actor.createEmbeddedDocuments("Item", [
        {
          name: s.spellName,
          type: "spell",
          system: {
            rank: Math.max(1, num(s.scrollRank, 1)),
            stat: "int",
            description: s.description,
          },
        },
      ]);
    if (consume) {
      const quantity = Math.max(0, num(s.quantity, 1));
      if (quantity < 1) return ui.notifications.warn("No copies remain.");
      await i.update({
        "system.quantity": quantity - 1,
        ...(quantity === 1
          ? { "system.location": "inventory", "system.hotlist": false }
          : {}),
      });
    }
  },
};
class CarlSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2,
) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["carl"],
    position: { width: 930, height: 900 },
    form: { submitOnChange: true },
    actions,
  };
  static PARTS = {
    body: { template: "systems/dungeon-crawler-carl/templates/actor.hbs" },
  };
  get _dragDrop() {
    return this._carlDragDrop ??= new foundry.applications.ux.DragDrop({
      dragSelector: ".entry[data-item-id]", dropSelector: null,
      permissions: { dragstart: this._canDragStart.bind(this), drop: this._canDragDrop.bind(this) },
      callbacks: { dragstart: this._onDragStart.bind(this), dragover: this._onDragOver.bind(this), drop: this._onDrop.bind(this) },
    });
  }
  async _onDragStart(event) {
    const row = event.target.closest(".entry[data-item-id]");
    const item = this.actor.items.get(row?.dataset.itemId);
    if (!item || !this._canDragStart(".entry[data-item-id]")) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
  }

  static TABS = {
    primary: {
      tabs: [
        { id: "overview", label: "Crawler HUD" },
        { id: "abilities", label: "Skills & Spells" },
        { id: "inventory", label: "Inventory" },
        { id: "identity", label: "Race & Class" },
        { id: "achievements", label: "Achievements" },
        { id: "notes", label: "Log & Effects" },
      ],
      initial: "overview",
    },
  };
  async _prepareContext(options) {
    const c = await super._prepareContext(options),
      a = this.actor,
      s = a.system,
      items = allItems(a),
      equipment = equipmentState(items),
      hotlist = hotlistState(items, s.hotlistCapacity);
    const decorate = (i) => ({
      id: i.id,
      name: i.name,
      type: i.type,
      system: i.system,
      physical: PHYSICAL.includes(i.type),
      locationLabel: LOCATIONS[i.system.location ?? "inventory"],
      slotLabel: EQUIP_SLOTS[equipSlot(i.system)] ?? "",
      equipped: i.system.location === "equipped",
      hasDamage: !!i.system.damage,
      skillLabel: i.type === "weapon" ? linkedSkill(i, a.items)?.name : "",
      isSpell: i.type === "spell",
      effectiveMana:
        num(i.system.manaCost) +
        (i.system.favored && !i.system.favoredApplies ? 1 : 0) +
        num(i.system.manaSurcharge),
    });
    const bodySlots = [
      "head",
      "torso",
      "arms",
      "gloves",
      "legs",
      "feet",
      "left",
      "right",
      "both",
    ].map((key) => ({
      key,
      label: EQUIP_SLOTS[key],
      items: equipment.valid
        .filter((i) => equipSlot(i.system) === key)
        .map(decorate),
      blocked: ["left", "right"].includes(key)
        ? equipment.valid.some((i) => equipSlot(i.system) === "both")
        : key === "both"
          ? equipment.valid.some((i) =>
              ["left", "right"].includes(equipSlot(i.system)),
            )
          : false,
    }));
    const accessories = equipment.valid
      .filter((i) => equipSlot(i.system) === "accessory")
      .map(decorate);
    return {
      ...c,
      actor: a,
      adjustAmount: this._adjustAmount ?? 1,
      system: s,
      mob: a.type === "mob",
      stats: Object.entries(s.stats).map(([key, st]) => ({
        key,
        ...st,
        label: key.toUpperCase(),
      })),
      groups: [
        "skill",
        "spell",
        "weapon",
        "gear",
        "race",
        "class",
        "achievement",
        "ability",
      ].map((type) => ({
        type,
        items: items.filter((i) => i.type === type).map(decorate),
      })),
      resources: [
        {
          label: "Health slots",
          path: "health.value",
          value: s.health.value,
          max: s.health.max,
        },
        {
          label: "Mana",
          path: "mana.value",
          value: s.mana.value,
          max: s.mana.max,
        },
        ...(!(a.type === "mob")
          ? [
              { label: "AI Favor", path: "aiFavor", value: s.aiFavor },
              { label: "Popularity", path: "popularity", value: s.popularity },
              { label: "Gold", path: "gold", value: s.gold },
              { label: "Misc. Junk", path: "miscJunk", value: s.miscJunk },
              {
                label: "Unspent Stat points",
                path: "statPoints",
                value: s.statPoints,
              },
            ]
          : []),
        ...(!(a.type === "mob")
          ? [
              {
                label: "Dying rounds",
                path: "dyingRounds",
                value: s.dyingRounds,
              },
            ]
          : []),
      ],
      slots: s.slotCosts.map((cost, i) => ({
        cost,
        index: i + 1,
        percent: Math.round(((i + 1) / s.health.max) * 100),
        filled: i < s.health.value,
        clickValue: i < s.health.value ? i : i + 1,
      })),
      bodySlots,
      accessories,
      accessoryCount: accessories.length,
      hotlistSlots: hotlist.slots.map((slot) => ({
        ...slot,
        item: slot.item ? decorate(slot.item) : null,
      })),
      inventoryWarnings: [...equipment.warnings, ...hotlist.warnings],
      locations: LOCATIONS,
      modes: {
        normal: "Normal",
        advantage: "Advantage",
        disadvantage: "Disadvantage",
      },
      tiers: { Mob: "Mob", Elite: "Elite", Boss: "Boss", NPC: "NPC" },
      tabs: this._prepareTabs("primary"),
    };
  }
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelectorAll("[data-rank-input]").forEach((input) => {
      input.addEventListener("change", async (event) => {
        event.stopPropagation();
        const item = this.actor.items.get(input.dataset.id);
        if (!item) return;
        const requested = input.value;
        input.value = item.system.rank;
        if (this.isEditable) await confirmRankChange(item, requested);
        input.value = item.system.rank;
      });
    });
    this._expandedItems ??= new Set();
    this.element.querySelectorAll("details.item-disclosure").forEach((entry) => {
      entry.open = this._expandedItems.has(entry.dataset.itemId);
      entry.addEventListener("toggle", () => {
        if (entry.open) this._expandedItems.add(entry.dataset.itemId);
        else this._expandedItems.delete(entry.dataset.itemId);
      });
    });
    this.element.querySelectorAll("[data-item-field]").forEach((input) =>
      input.addEventListener("change", async (event) => {
        event.stopPropagation();
        if (!this.isEditable) return;
        const item = this.actor.items.get(input.dataset.id);
        if (item)
          await item.update({
            ["system." + input.dataset.itemField]: input.value,
          });
      }),
    );
  }
}
class CarlItemSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2,
) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["carl"],
    position: { width: 680, height: 820 },
    form: { submitOnChange: true },
  };
  static PARTS = {
    body: { template: "systems/dungeon-crawler-carl/templates/item.hbs" },
  };
  async _prepareContext(o) {
    const t = this.item.type;
    return {
      ...(await super._prepareContext(o)),
      item: this.item,
      system: this.item.system,
      textFields: (ITEM_TEXT_FIELDS[t] ?? []).map(([key, label]) => ({ key, label, value: this.item.system[key] ?? "" })),
      isSkill: t === "skill",
      isSpell: t === "spell",
      isWeapon: t === "weapon",
      isGear: t === "gear",
      isScroll: t === "gear" && this.item.system.gearType === "scroll",
      isSpellbook: t === "gear" && this.item.system.gearType === "spellbook",
      mobOwner: this.item.parent?.type === "mob",
      isAbility: ["skill", "spell"].includes(t),
      physical: PHYSICAL.includes(t),
      identity: ["race", "class"].includes(t),
      achievement: t === "achievement",
      ranked: ["skill", "spell"].includes(t),
      damageCapable: ["skill", "spell", "weapon", "gear"].includes(t),
      stats: {
        str: "STR",
        int: "INT",
        con: "CON",
        dex: "DEX",
        cha: "CHA",
        none: "No Stat Mod",
      },
      categories: {
        attack: "Attack",
        utility: "Utility",
        passive: "Passive / Damage Effect",
      },
      checkTypes: { opposed: "Opposed", unopposed: "Unopposed" },
      locations: LOCATIONS,
      gearTypes: {
        mundane: "Mundane / crafting item",
        armour: "Armour / shield",
        potion: "Potion",
        scroll: "Scroll",
        spellbook: "Spellbook",
        petcarrier: "Pet carrier",
        loot: "Loot box",
      },
      gearSlots: GEAR_SLOTS,
      handSlots: { left: "Left hand", right: "Right hand" },
      hands: { 1: "One-handed", 2: "Two-handed" },
      accessoryKinds: {
        other: "Other / ring / tattoo / patch",
        belt: "Belt (max one)",
        cape: "Cape (max one)",
      },
      skillChoices: {
        "": "Legacy / manual attack rank",
        ...Object.fromEntries(
          this.item.parent?.items
            .filter((i) => i.type === "skill")
            .map((i) => [i.id, i.name]) ?? [],
        ),
      },
      statBonuses: ["str", "int", "con", "dex", "cha"].map((key) => ({
        key,
        label: key.toUpperCase(),
        value: num(this.item.system.statBonuses?.[key]),
      })),
    };
  }
}
Hooks.once("init", () => {
  CONFIG.Actor.documentClass = CarlActor;
  CONFIG.Item.documentClass = CarlItem;
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    Actor,
    "dungeon-crawler-carl",
    CarlSheet,
    { types: ["crawler", "mob"], makeDefault: true },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    Item,
    "dungeon-crawler-carl",
    CarlItemSheet,
    { makeDefault: true },
  );
  CONFIG.statusEffects = [
    "Blinded",
    "Blood Trail",
    "Burned",
    "Drowning",
    "Dying",
    "Enraged",
    "Fatigued",
    "Held",
    "Major Injury",
    "Minor Injury",
    "Muted",
    "Poisoned",
    "Paralyzed",
    "Queasy",
    "Sepsis",
    "Shit-Faced",
    "Shocked",
    "Sore as Shit",
    "Staggered",
    "Stiff Legs",
    "Stunned",
    "Take Down",
    "Terrified",
    "The Taint",
    "Woozy",
  ].map((label) => ({
    id: label.toLowerCase().replaceAll(" ", "-"),
    name: label,
    img: "icons/svg/aura.svg",
  }));
});
Hooks.on("preCreateActor", (a) => {
  a.updateSource({
    "prototypeToken.bar1.attribute": "health",
    "prototypeToken.bar2.attribute": "mana",
    "prototypeToken.actorLink": a.type === "crawler",
  });
});
