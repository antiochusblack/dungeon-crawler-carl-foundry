/** Local Item bundles. Official content is supplied separately from the system. */
const NS='dungeon-crawler-carl', ID=/^[a-zA-Z0-9]{16}$/;
let busy=false;
export function validateItemBundle(input){
 if(input?.format!=='dcc-items'||input.version!==1||typeof input.bundleId!=='string'||!input.bundleId.trim()||!Array.isArray(input.folders)||!Array.isArray(input.items)||!input.items.length||input.items.length>5000||input.folders.length>1000)throw Error('Choose a supported DCC Items JSON file.');
 const data=JSON.parse(JSON.stringify(input)),fids=new Set(),ids=new Set();
 const types=new Set(['skill','spell','weapon','gear','race','class','ability','achievement']);
 for(const f of data.folders){if(!ID.test(f._id)||fids.has(f._id)||f.type!=='Item'||typeof f.name!=='string'||!f.name.trim())throw Error('Invalid Item folder.');fids.add(f._id);}
 for(const f of data.folders)if(f.folder&&!fids.has(f.folder))throw Error('Missing parent folder.');
 const sorted=[],pending=[...data.folders],done=new Set();
 while(pending.length){const index=pending.findIndex(f=>!f.folder||done.has(f.folder));if(index<0)throw Error('Folder cycle detected.');const [f]=pending.splice(index,1);sorted.push(f);done.add(f._id);}data.folders=sorted;
 for(const i of data.items){if(!ID.test(i._id)||ids.has(i._id)||typeof i.name!=='string'||!i.name.trim()||!types.has(i.type)||!i.system||typeof i.system!=='object'||Array.isArray(i.system))throw Error('Invalid Item document.');if(i.folder&&!fids.has(i.folder))throw Error('Missing Item folder.');ids.add(i._id);}
 for(const d of [...data.items,...data.folders])if(d.flags!=null&&(typeof d.flags!=='object'||Array.isArray(d.flags)||d.flags[NS]!=null&&(typeof d.flags[NS]!=='object'||Array.isArray(d.flags[NS]))))throw Error('Invalid document flags.');
 const pick=(d,keys)=>Object.fromEntries(keys.filter(k=>Object.hasOwn(d,k)).map(k=>[k,d[k]]));
 data.folders=data.folders.map(f=>pick(f,['_id','name','type','folder','sorting','sort','color','flags']));
 data.items=data.items.map(i=>({...pick(i,['_id','name','type','img','system','folder','sort','flags','effects']),ownership:{default:2}}));
 return data;
}
export async function importItemBundle(input){
 if(!game.user.isGM)throw Error('Only a GM can import Items.');if(busy)throw Error('An Item import is already running.');busy=true;
 try{
  const data=validateItemBundle(input),ours=d=>d?.flags?.[NS]?.itemImportBundle===data.bundleId;
  for(const f of data.folders){const old=game.folders.get(f._id);if(old&&(!ours(old)||old.type!=='Item'))throw Error('An unrelated folder uses a required ID. No changes were made.');}
  for(const i of data.items){const old=game.items.get(i._id);if(old&&!ours(old))throw Error('An unrelated Item uses a required ID. No changes were made.');}
  const folders=data.folders.filter(f=>!game.folders.has(f._id)),items=data.items.filter(i=>!game.items.has(i._id));
  if(!folders.length&&!items.length){ui.notifications.info('These Items are already imported. Your edits were preserved.');return {created:0,skipped:data.items.length};}
  if(await foundry.applications.api.DialogV2.confirm({window:{title:'Import Items'},content:`<p>Import <strong>${items.length}</strong> Items into <strong>${folders.length}</strong> new folders?</p><p>Existing Items and your edits will be kept. Imported Items can be viewed and dragged onto characters by players.</p>`,yes:{label:'Import',default:false},no:{label:'Cancel',default:true},modal:true,rejectClose:false})!==true)return {created:0,cancelled:true};
  const stamp=d=>{d.flags??={};d.flags[NS]??={};d.flags[NS].itemImportBundle=data.bundleId;return d;};
  for(const f of folders)await Folder.create(stamp(f),{keepId:true});
  let created=0;for(let n=0;n<items.length;n+=20){const batch=items.slice(n,n+20).map(stamp),docs=await Item.createDocuments(batch,{keepId:true});if(docs.length!==batch.length)throw Error('Incomplete import. Retry to resume.');created+=docs.length;}
  ui.notifications.info(`Imported ${created} Items. Existing Items were preserved.`);return {created,skipped:data.items.length-items.length};
 }finally{busy=false;}
}
export async function chooseItemImportFile(){
 if(!game.user.isGM)return;
 try{const file=await foundry.applications.api.DialogV2.prompt({window:{title:'Import Items'},content:'<p>Select your separate Items JSON file.</p><label>Items file<input type="file" name="itemsFile" accept=".json,application/json" required></label>',ok:{label:'Read File',callback:(event,button)=>button.form.elements.itemsFile.files[0]},rejectClose:false});if(!file)return;if(file.size>20*1024*1024)throw Error('Choose a file smaller than 20 MB.');await importItemBundle(JSON.parse(await file.text()));}
 catch(error){console.error('DCC Item import:',error);ui.notifications.error(`Item import stopped: ${error.message} Retry safely; existing Items will be kept.`);}
}
export function addItemImportButton(app,element){
 if(!game.user.isGM)return;const root=element?.querySelector?element:element?.[0];if(!root||root.querySelector('.dcc-import-items'))return;
 const button=document.createElement('button');button.type='button';button.className='dcc-import-items';button.title='Import Items from a separate JSON file';button.innerHTML='<i class="fa-solid fa-file-import"></i> Import Items';button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();void chooseItemImportFile();});
 const controls=root.querySelector('.header-actions, .directory-header .action-buttons, .directory-footer');if(controls)controls.append(button);else root.prepend(button);
}
Hooks.on('renderItemDirectory',addItemImportButton);
