const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=s=>esc(s).replaceAll('\n','<br>');
export function effectText(item,rank){
 if(!item)return '';
 const s=item.system,parts=[];
 // Official entries retain the full source description; upgrades have their own fields.
 const base=(s.description??'').split(/\bUPGRADES\b|\bRank 5:/)[0].trim();
 if(base)parts.push(base);if(s.effects&&!base.includes(s.effects))parts.push(s.effects);
 for(const n of [5,10,15])if(rank>=n&&s['upgrade'+n])parts.push(`Rank ${n}: ${s['upgrade'+n]}`);
 if(s.upgrades)parts.push('Other upgrades / conditional rules: '+s.upgrades);
 return parts.join('\n\n');
}
export function rollEffectsHTML(item,rank,outcome,{attack=false,evade=false,floor=1}={}){
 const base=effectText(item,rank);let special='';
 if(attack&&outcome==='Critical Hit')special='Roll twice the base damage dice, then add the Stat modifier and other bonuses once.';
 else if(attack&&outcome==='Amazing Success')special=`Add ${floor} damage (current Floor).`;
 else if(evade&&['Critical Hit','Amazing Success'].includes(outcome))special='Gain Advantage on your next Attack Skill Check against this Mob.';
 else if(evade&&outcome==='Major Fail')special=`Take ${floor} additional damage and gain a Minor Injury after combat.`;
 else if(evade&&outcome==='Critical Fail')special='Take twice the damage and gain a Major Injury after combat.';
 else if(outcome==='Critical Hit')special='Best possible outcome; resolve the action perfectly.';
 else if(outcome==='Amazing Success')special='Enhanced success: greater impact, faster completion or another suitable benefit.';
 else if(outcome==='Major Fail')special='Failure with an additional consequence; resolve it with the GM.';
 else if(outcome==='Critical Fail')special='Worst possible outcome: the GM resolves an appropriate mishap, such as damaged equipment, a Debuff or striking an ally.';
 return (base?`<div class="roll-effects"><p>${text(base)}</p></div>`:'')+(special?`<p class="roll-outcome"><strong>${esc(outcome)} effect:</strong> ${text(special)}</p>`:'');
}
