/** Private, local JSON table import. This module contains no rulebook tables. */
const NS = 'dungeon-crawler-carl';
const FORMAT = 'dcc-rolltables';
const ID = /^[a-zA-Z0-9]{16}$/;
let importing = false;
const copy = value => JSON.parse(JSON.stringify(value));

export function validateTableBundle(input) {
  if (!input || input.format !== FORMAT || input.version !== 1 || typeof input.bundleId !== 'string' || !input.bundleId.trim()) throw new Error('Choose a supported DCC tables JSON file.');
  if (!Array.isArray(input.tables) || !input.tables.length || input.tables.length > 2000 || !Array.isArray(input.folders) || input.folders.length > 1000) throw new Error('The file has an invalid table or folder list.');
  const data = copy(input), folderIds = new Set(), tableIds = new Set();
  for (const f of data.folders) {
    if (!ID.test(f._id) || folderIds.has(f._id) || f.type !== 'RollTable' || typeof f.name !== 'string' || !f.name.trim()) throw new Error('Invalid or duplicate table folder.');
    folderIds.add(f._id);
  }
  for (const f of data.folders) if (f.folder && !folderIds.has(f.folder)) throw new Error('A folder refers to a missing parent.');
  const sortedFolders = [], remaining = [...data.folders], visited = new Set();
  while (remaining.length) {
    const next = remaining.findIndex(f => !f.folder || visited.has(f.folder));
    if (next < 0) throw new Error('The folder structure contains a cycle.');
    const [f] = remaining.splice(next, 1); sortedFolders.push(f); visited.add(f._id);
  }
  data.folders = sortedFolders;
  let count = 0;
  for (const t of data.tables) {
    if (!ID.test(t._id) || tableIds.has(t._id) || typeof t.name !== 'string' || !t.name.trim() || typeof t.formula !== 'string' || !/^1d[1-9]\d*$/.test(t.formula)) throw new Error('Invalid or duplicate RollTable.');
    if (t.folder && !folderIds.has(t.folder)) throw new Error('A table refers to a missing folder.');
    if (!Array.isArray(t.results) || !t.results.length) throw new Error('A table has no results.');
    tableIds.add(t._id); count += t.results.length;
    if (count > 100000) throw new Error('The file contains too many results.');
    const resultIds = new Set();
    const ranges = [];
    for (const r of t.results) {
      if (!ID.test(r._id) || resultIds.has(r._id) || !['text','document'].includes(r.type) || typeof r.description !== 'string' || !Array.isArray(r.range) || r.range.length !== 2 || !r.range.every(Number.isSafeInteger) || r.range[0] < 1 || r.range[1] < r.range[0]) throw new Error('A table result is malformed.');
      resultIds.add(r._id); ranges.push(r.range);
    }
    ranges.sort((a,b)=>a[0]-b[0]);let end=0;
    for (const [low,high] of ranges) { if(low!==end+1)throw new Error('A table has overlapping or missing roll ranges.');end=high; }
    if(end!==Number(t.formula.slice(2)))throw new Error('A table formula does not match its result ranges.');
  }
  // Native children and clickable links must all resolve within this self-contained file.
  for (const t of data.tables) for (const r of t.results) {
    if (r.type==='document') {
      const match=/^RollTable\.([a-zA-Z0-9]{16})$/.exec(r.documentUuid ?? '');
      if(!match || !tableIds.has(match[1]))throw new Error('A subtable reference is missing from the file.');
    }
  }
  for (const t of data.tables) for (const html of [t.description ?? '',...t.results.map(r=>r.description)]) {
    for (const m of html.matchAll(/@UUID\[RollTable\.([a-zA-Z0-9]{16})\]/g))if(!tableIds.has(m[1]))throw new Error('A clickable table link is missing from the file.');
  }
  const byId=new Map(data.tables.map(t=>[t._id,t]));
  function checkCycle(id,active=new Set(),done=new Set()) {
    if(active.has(id))throw new Error('The subtable references contain a recursive cycle.');
    if(done.has(id))return;active.add(id);
    for(const r of byId.get(id).results)if(r.type==='document')checkCycle(r.documentUuid.split('.')[1],active,done);
    active.delete(id);done.add(id);
  }
  const done=new Set();for(const t of data.tables)checkCycle(t._id,new Set(),done);
  for (const doc of [...data.folders, ...data.tables, ...data.tables.flatMap(t=>t.results)]) {
    if (doc.flags != null && (typeof doc.flags !== 'object' || Array.isArray(doc.flags))) throw new Error('Invalid document flags.');
    if (doc.flags?.[NS] != null && (typeof doc.flags[NS] !== 'object' || Array.isArray(doc.flags[NS]))) throw new Error('Invalid system flags.');
  }
  // Whitelist document data; importing never executes JSON as a macro/script.
  function fields(source,keys) { return Object.fromEntries(keys.filter(k=>Object.hasOwn(source,k)).map(k=>[k,source[k]])); }
  data.folders=data.folders.map(f=>fields(f,['_id','name','type','folder','sorting','sort','color','flags']));
  data.tables=data.tables.map(t=>({...fields(t,['_id','name','img','description','formula','replacement','displayRoll','folder','sort','flags']),ownership:{default:0},results:t.results.map(r=>fields(r,['_id','type','name','description','documentUuid','img','weight','range','drawn','flags']))}));
  return data;
}

export async function importTableBundle(input) {
  if (!game.user.isGM) throw new Error('Only a GM can import tables.');
  if (importing) throw new Error('A table import is already running.');
  importing = true;
  try {
    const data=validateTableBundle(input);
    const ours=doc=>doc?.flags?.[NS]?.tableImportBundle===data.bundleId;
    for(const f of data.folders){const old=game.folders.get(f._id);if(old&&(!ours(old)||old.type!=='RollTable'))throw new Error('An unrelated folder uses a required ID. No changes were made.');}
    for(const t of data.tables){const old=game.tables.get(t._id);if(old&&!ours(old))throw new Error('An unrelated table uses a required ID. No changes were made.');}
    const folders=data.folders.filter(f=>!game.folders.has(f._id));
    const tables=data.tables.filter(t=>!game.tables.has(t._id));
    if(!folders.length&&!tables.length){ui.notifications.info('These tables are already installed. Your edits were preserved.');return {created:0,skipped:data.tables.length};}
    const proceed=await foundry.applications.api.DialogV2.confirm({
      window:{title:'Import Tables'},content:`<p>Import <strong>${tables.length}</strong> new tables into <strong>${folders.length}</strong> new folders?</p><p>${data.tables.length-tables.length} existing tables will be kept, including your edits.</p>`,
      yes:{label:'Import',default:false},no:{label:'Cancel',default:true},modal:true,rejectClose:false,
    });
    if(proceed!==true)return {created:0,cancelled:true};
    const stamp=doc=>{doc.flags??={};doc.flags[NS]??={};doc.flags[NS].tableImportBundle=data.bundleId;return doc;};
    for(const folder of folders)await Folder.create(stamp(folder),{keepId:true});
    let created=0;
    for(let offset=0;offset<tables.length;offset+=10){
      const batch=tables.slice(offset,offset+10).map(stamp);
      const docs=await RollTable.createDocuments(batch,{keepId:true});
      if(docs.length!==batch.length)throw new Error('Some tables could not be created. Run the import again to resume.');
      created+=docs.length;
    }
    if(data.tables.some(t=>!game.tables.has(t._id)))throw new Error('Some tables are missing. Run the import again to resume.');
    ui.notifications.info(`Imported ${created} tables. Existing tables were preserved.`);
    return {created,skipped:data.tables.length-tables.length};
  } finally { importing=false; }
}

export async function chooseTableImportFile() {
  if(!game.user.isGM)return;
  try {
    const file=await foundry.applications.api.DialogV2.prompt({
      window:{title:'Import Tables'},content:'<p>Select your private tables JSON file.</p><label>Tables file<input type="file" name="tablesFile" accept=".json,application/json" required></label>',
      ok:{label:'Read File',callback:(event,button)=>button.form.elements.tablesFile.files[0]},rejectClose:false,
    });
    if(!file)return;
    if(file.size>20*1024*1024)throw new Error('Choose a JSON file smaller than 20 MB.');
    await importTableBundle(JSON.parse(await file.text()));
  } catch(error){console.error('DCC table import:',error);ui.notifications.error(`Table import stopped: ${error.message} You can retry; existing tables will not be overwritten.`);}
}

export function addTableImportButton(app,element) {
  if(!game.user.isGM)return;
  const root=element?.querySelector ? element : element?.[0];
  if(!root || root.querySelector('.dcc-import-tables'))return;
  const button=document.createElement('button');button.type='button';button.className='dcc-import-tables';
  button.title='Import tables from a private JSON file';button.innerHTML='<i class="fa-solid fa-file-import"></i> Import Tables';
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();void chooseTableImportFile();});
  const controls=root.querySelector('.header-actions, .directory-header .action-buttons, .directory-footer');
  if(controls)controls.append(button);else root.prepend(button);
}
Hooks.on('renderRollTableDirectory',addTableImportButton);
