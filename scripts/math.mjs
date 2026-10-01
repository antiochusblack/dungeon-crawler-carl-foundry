export function statMod(score) { return [2,5,9,19,49,99,149,199,299].findIndex(n=>score<=n)+1 || 10; }
export function degree(n,total,dc) { if(n===20)return 'Critical Hit';if(n===1)return 'Critical Fail';let d=total-dc;return d>=10?'Amazing Success':d>=0?'Standard Success':d>=-2?'Near Miss Fail':d>=-9?'Standard Fail':'Major Fail'; }
export function slotsLost(damage,dr,slot) {return Math.floor(Math.max(0,damage-dr)/Math.max(1,slot));}
