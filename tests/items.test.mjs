import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ITEM_TEXT_FIELDS, statKey, linkedSkill } from '../scripts/item-fields.mjs';
let answer = false, dialog, registered = {};
class Document {
  constructor(data = {}) { Object.assign(this, data); }
  async _preDelete() {}
  async _preCreate() {}
  async delete() { if (await this._preDelete({}, {}) === false) return; this.deleted = true; }
  toDragData() { return {type:'Item', uuid:this.uuid}; }
}
class Sheet {
  constructor(item) {this.item=item; this.actor=item; this.isEditable=true;}
  async _prepareContext() { return {}; }
  _canDragStart() {return this.isEditable;}
  _canDragDrop() {return this.isEditable;}
  _onDragOver() {}
  _onDrop() {}
}
globalThis.Actor = Document; globalThis.Item = Document;
globalThis.CONFIG = {Actor:{},Item:{}};
globalThis.Hooks = {once: (name, fn) => { if(name==='init') fn(); },on:()=>{}};
globalThis.foundry = {applications:{api:{HandlebarsApplicationMixin:B=>B,DialogV2:{confirm:async d=>{dialog=d;return answer;}}},sheets:{ActorSheetV2:Sheet,ItemSheetV2:Sheet},ux:{DragDrop:class {constructor(o){this.options=o;}}},apps:{DocumentSheetConfig:{registerSheet:(base,ns,cls)=>{registered[base===Actor?'actor':'item']=cls;}}}},utils:{escapeHTML:s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')}};
// Actor and Item need distinct constructors for registration.
globalThis.Actor = class extends Document {};
globalThis.Item = class extends Document {};
await import('../scripts/carl.mjs');
const schema=JSON.parse(fs.readFileSync(new URL('../template.json',import.meta.url)));
const manifest=JSON.parse(fs.readFileSync(new URL('../system.json',import.meta.url)));
assert.deepEqual(new Set(manifest.documentTypes.Item),new Set(Object.keys(ITEM_TEXT_FIELDS)));
assert.equal(manifest.version,'0.4.0');
assert.equal(manifest.manifest,'https://raw.githubusercontent.com/antiochusblack/dungeon-crawler-carl-foundry/main/system.json');
assert.ok(manifest.download.endsWith('/v0.4.0/dungeon-crawler-carl-0.4.0.zip'));
for (const type of manifest.documentTypes.Item) {
 const original=new CONFIG.Item.documentClass({name:'<Crawler "item">',type,system:structuredClone(schema.Item[type]),uuid:`Item.${type}`});
 for (const [key] of ITEM_TEXT_FIELDS[type]) original.system[key]='Bespoke <rules>\nsecond line';
 const copy=new CONFIG.Item.documentClass({name:original.name,type,system:structuredClone(original.system),parent:{items:[]},uuid:`Actor.test.Item.${type}`});
 const editor=new registered.item(copy);const ctx=await editor._prepareContext({});
 assert.equal(ctx.textFields.length,ITEM_TEXT_FIELDS[type].length);
 answer=false;await copy.delete();assert.ok(!copy.deleted);
 answer=null;await copy.delete();assert.ok(!copy.deleted);
 assert.equal(dialog.no.label,'Cancel');assert.equal(dialog.no.default,true);assert.equal(dialog.yes.default,false);
 assert.ok(!dialog.content.includes('<Crawler'));
 answer=true;await copy.delete();assert.ok(copy.deleted);assert.ok(!original.deleted);
 assert.deepEqual(copy.system,original.system);
 answer=false;await original.delete();assert.ok(!original.deleted);
 answer=true;await original.delete();assert.ok(original.deleted);
 const actor={items:new Map([[type,copy]])};const sheet=new registered.actor(actor);let drag;
 await sheet._onDragStart({target:{closest:()=>({dataset:{itemId:type}})},dataTransfer:{setData:(format,data)=>drag=JSON.parse(data)}});
 assert.deepEqual(drag,{type:'Item',uuid:`Actor.test.Item.${type}`});
 copy.deleted=false;answer=false;await registered.actor.DEFAULT_OPTIONS.actions.remove.call(sheet,{}, {dataset:{id:type}});assert.ok(!copy.deleted);
 answer=true;await registered.actor.DEFAULT_OPTIONS.actions.remove.call(sheet,{}, {dataset:{id:type}});assert.ok(copy.deleted);
}
assert.equal(statKey('Strength'),'str');assert.equal(statKey('DEX'),'dex');
const skill={id:'s1',type:'skill',name:'Smashing',system:{rank:3}};const collection=[skill];collection.get=id=>collection.find(i=>i.id===id);
assert.equal(linkedSkill({system:{linkedSkill:'SMASHING'}},collection),skill);
assert.equal(linkedSkill({system:{skillId:'s1'}},collection),skill);
console.log('Eight Item editors, deletion guard, compact removal, drag UUIDs, legacy Skill links and metadata passed (Foundry API mocks).');
