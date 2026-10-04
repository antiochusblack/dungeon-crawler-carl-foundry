export async function confirmRankChange(item,value){
 const rank=Number(value),old=Number(item.system.rank)||0;
 if(!Number.isInteger(rank)||rank<0||rank>20){ui.notifications.warn('Rank must be a whole number from 0 to 20.');return false;}
 if(rank===old)return false;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const yes=await foundry.applications.api.DialogV2.confirm({window:{title:'Change Rank?'},content:`<p>Change <strong>${esc(item.name)}</strong> from Rank <strong>${old}</strong> to <strong>${rank}</strong>?</p>`,yes:{label:'Confirm',default:false},no:{label:'Cancel',default:true},modal:true,rejectClose:false});
 if(yes!==true)return false;
 if((Number(item.system.rank)||0)!==old){ui.notifications.warn('Rank changed while the dialog was open. Try again.');return false;}
 await item.update({'system.rank':rank});return true;
}
