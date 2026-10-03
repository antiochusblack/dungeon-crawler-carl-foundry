import assert from 'node:assert/strict';import fs from 'node:fs';
const base=new URL('../pack-source/examples/',import.meta.url);
const docs=fs.readdirSync(base).map(f=>JSON.parse(fs.readFileSync(new URL(f,base))));
const folders=docs.filter(d=>d._key.startsWith('!folders!'));
const items=docs.filter(d=>d._key.startsWith('!items!'));
assert.equal(folders.length,8);assert.equal(items.length,40);assert.equal(new Set(docs.map(d=>d._id)).size,48);
for(const type of ['skill','spell','weapon','gear','race','class','ability','achievement']) {
 const group=items.filter(i=>i.type===type);assert.equal(group.length,5);
 for(const i of group) {assert.ok(folders.some(f=>f._id===i.folder));assert.ok(i.system.description);assert.ok(i.flags['dungeon-crawler-carl'].example);}
}
for(const weapon of items.filter(i=>i.type==='weapon'))assert.ok(items.some(i=>i.type==='skill'&&i.name===weapon.system.linkedSkill));
console.log('40 example Items, eight folders, stable IDs and Weapon Skill links passed.');
