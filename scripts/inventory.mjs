export const LOCATIONS = {
  inventory: "Inventory (weightless)",
  equipped: "Equipped / holding",
  floor: "On the floor",
  home: "Personal space / elsewhere",
};
export const GEAR_SLOTS = {
  none: "Not wearable",
  head: "Head",
  torso: "Torso",
  arms: "Arms",
  gloves: "Hands — gloves",
  legs: "Legs",
  feet: "Feet",
  accessory: "Accessory",
  holding: "Holding",
};
export const EQUIP_SLOTS = {
  head: "Head",
  torso: "Torso",
  arms: "Arms",
  gloves: "Gloves",
  legs: "Legs",
  feet: "Feet",
  left: "Left holding",
  right: "Right holding",
  both: "Both hands",
  accessory: "Accessory",
};
export const num = (x, f = 0) => (Number.isFinite(Number(x)) ? Number(x) : f);
export function equipSlot(s) {
  if (s.gearSlot === "holding" || (!s.gearSlot && s.hands))
    return num(s.hands, 1) === 2
      ? "both"
      : s.equipSlot === "right"
        ? "right"
        : "left";
  return s.gearSlot === "none" ? "" : s.gearSlot;
}
export function conflict(candidate, others) {
  const s = candidate.system;
  if (s.location !== "equipped") return "";
  const slot = equipSlot(s);
  if (num(s.quantity, 1) < 1) return "No copies remain to equip.";
  if (!slot || !(slot in EQUIP_SLOTS))
    return "Choose a gear slot before equipping this item.";
  const equipped = others.filter(
    (i) => i.system.location === "equipped" && num(i.system.quantity, 1) > 0,
  );
  if (slot === "accessory") {
    const accessories = equipped.filter(
      (i) => equipSlot(i.system) === "accessory",
    );
    if (accessories.length >= 10)
      return "Accessories are limited to ten items.";
    if (
      ["belt", "cape"].includes(s.accessoryKind) &&
      accessories.some((i) => i.system.accessoryKind === s.accessoryKind)
    )
      return `Only one ${s.accessoryKind} can be equipped.`;
  } else if (
    equipped.some((i) => {
      const other = equipSlot(i.system);
      return (
        slot === other ||
        (["left", "right", "both"].includes(slot) &&
          ["left", "right", "both"].includes(other) &&
          (slot === "both" || other === "both"))
      );
    })
  )
    return "That slot is occupied. Store or move the current item first.";
  return "";
}
export function equipmentState(items) {
  const valid = [],
    warnings = [];
  for (const i of items.filter(
    (i) =>
      ["weapon", "gear"].includes(i.type) &&
      i.system.location === "equipped" &&
      num(i.system.quantity, 1) > 0,
  )) {
    const error = conflict(i, valid);
    if (error) warnings.push(`${i.name}: ${error}`);
    else valid.push(i);
  }
  return { valid, warnings };
}
export function hotlistState(items, capacity = 10) {
  const entries = items.filter(
    (i) =>
      i.system.hotlist && ["weapon", "gear", "spell", "skill"].includes(i.type),
  );
  const slots = Array.from(
    { length: Math.max(1, Math.min(50, num(capacity, 10))) },
    (_, i) => ({ index: i + 1, item: null }),
  );
  const warnings = [];
  for (const item of entries) {
    if (
      ["weapon", "gear"].includes(item.type) &&
      ["floor", "home"].includes(item.system.location)
    ) {
      warnings.push(`${item.name}: unavailable from ${item.system.location}.`);
      continue;
    }
    let index = num(item.system.hotlistPosition) - 1;
    if (index < 0 || index >= slots.length || slots[index].item)
      index = slots.findIndex((s) => !s.item);
    if (index < 0) warnings.push(`${item.name}: Hotlist is full.`);
    else slots[index].item = item;
  }
  return { slots, warnings };
}
export function healthAfterDamage(current, costs, damage) {
  let remaining = Math.max(0, num(damage)),
    value = Math.max(0, Math.min(costs.length, num(current)));
  while (value > 0) {
    const cost = Math.max(1, num(costs[value - 1], 1));
    if (remaining < cost) break;
    remaining -= cost;
    value--;
  }
  return value;
}
export function adjustedResource(current, delta, min = 0, max = Infinity) {
  return Math.max(min, Math.min(max, num(current) + num(delta)));
}
