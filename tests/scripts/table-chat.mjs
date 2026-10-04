/** Presentation for privately imported tables; no book content is bundled here. */
const NS='dungeon-crawler-carl';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function tableChatContent(results,roll) {
  const entries=[];
  for(const result of results){
    let body=escape(result.name);
    if(result.type==='document'&&result.documentUuid)body=`@UUID[${result.documentUuid}]{${result.name||'Subtable'}}`;
    const html=await foundry.applications.ux.TextEditor.implementation.enrichHTML(`<div class="dcc-table-entry"><strong>${body}</strong>${result.description??''}</div>`,{async:true});
    entries.push(html);
  }
  return `<section class="dcc-table-result">${roll?`<div class="dcc-table-number">${escape(roll.total)}</div>`:''}${entries.join('')}</section>`;
}
Hooks.on('init',()=>{
  const proto=CONFIG.RollTable.documentClass.prototype,original=proto.toMessage;
  proto.toMessage=async function(results,options={}){
    const flags=this.flags?.[NS];
    if(!flags?.tableImportBundle&&!flags?.privateRulebookImport)return original.call(this,results,options);
    const {roll,messageData={},messageOptions={}}=options;
    const data={user:game.user.id,speaker:ChatMessage.getSpeaker(),flavor:this.name,...messageData,content:await tableChatContent(results,roll)};
    if(roll)data.rolls=[roll];
    const requested=messageData.mode??messageOptions.mode??messageOptions.rollMode??game.settings.get('core','rollMode');
    const mode=({publicroll:'public',gmroll:'gm',blindroll:'blind',selfroll:'self'})[requested]??requested;
    ChatMessage.applyMode(data,mode);
    return ChatMessage.create(data,messageOptions);
  };
});
Hooks.on('renderChatMessageHTML',(message,html)=>{
  for(const link of html.querySelectorAll('.dcc-table-result a.content-link[data-uuid]')){
    if(!/^RollTable\.[a-zA-Z0-9]{16}$/.test(link.dataset.uuid))continue;
    link.title='Roll on this subtable';
    link.addEventListener('click',async event=>{
      event.preventDefault();event.stopImmediatePropagation();
      try {const table=await fromUuid(link.dataset.uuid);if(!table)throw Error('Subtable not found.');await table.draw({recursive:false});}
      catch(error){ui.notifications.error(error.message);}
    });
  }
});
