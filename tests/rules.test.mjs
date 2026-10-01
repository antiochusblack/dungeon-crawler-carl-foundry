import assert from "node:assert/strict";
import {
  conflict,
  equipmentState,
  hotlistState,
  healthAfterDamage,
  adjustedResource,
} from "../scripts/inventory.mjs";
const gear = (id, slot, extra = {}) => ({
  id,
  name: id,
  type: "gear",
  system: { location: "equipped", gearSlot: slot, quantity: 1, ...extra },
});
const left = gear("shield", "holding", { hands: 1, equipSlot: "left" }),
  right = gear("blade", "holding", { hands: 1, equipSlot: "right" }),
  two = gear("pike", "holding", { hands: 2 });
assert.equal(conflict(right, [left]), "");
assert.ok(conflict(two, [left]));
assert.ok(conflict(left, [two]));
assert.ok(conflict(gear("second helmet", "head"), [gear("helmet", "head")]));
assert.equal(conflict(gear("gloves", "gloves"), [left, right]), "");
const accessories = Array.from({ length: 10 }, (_, i) =>
  gear("ring" + i, "accessory"),
);
assert.ok(conflict(gear("ring11", "accessory"), accessories));
assert.ok(
  conflict(gear("belt2", "accessory", { accessoryKind: "belt" }), [
    gear("belt", "accessory", { accessoryKind: "belt" }),
  ]),
);
assert.equal(
  conflict(gear("cape", "accessory", { accessoryKind: "cape" }), [
    gear("belt", "accessory", { accessoryKind: "belt" }),
  ]),
  "",
);
assert.ok(conflict(gear("empty", "head", { quantity: 0 }), []));
assert.equal(equipmentState([left, two, right]).valid.length, 2);
const spells = Array.from({ length: 11 }, (_, i) => ({
  id: "s" + i,
  name: "s" + i,
  type: "spell",
  system: { hotlist: true, hotlistPosition: 0 },
}));
assert.equal(hotlistState(spells, 10).slots.filter((s) => s.item).length, 10);
assert.equal(hotlistState(spells, 10).warnings.length, 1);
assert.equal(
  hotlistState([
    { ...left, system: { ...left.system, hotlist: true, location: "floor" } },
  ]).slots.filter((s) => s.item).length,
  0,
);
assert.equal(healthAfterDamage(10, Array(10).fill(4), 22), 5);
assert.equal(healthAfterDamage(10, Array(10).fill(4), 3), 10);
assert.equal(healthAfterDamage(10, Array(10).fill(4), 4), 9);
assert.equal(healthAfterDamage(5, Array(10).fill(4), 100), 0);
assert.equal(healthAfterDamage(10, [2, 2, 2, 2, 2, 2, 2, 2, 2, 12], 11), 10);
assert.equal(healthAfterDamage(10, [2, 2, 2, 2, 2, 2, 2, 2, 2, 12], 14), 8);
assert.equal(adjustedResource(0, -1), 0);
assert.equal(adjustedResource(9, 5, 0, 10), 10);
assert.equal(adjustedResource(0, -1, -Infinity), -1);
console.log("Equipment, Hotlist, Health and resource tests passed.");
