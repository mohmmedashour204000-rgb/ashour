const h=require('./h');
(async()=>{for(const sub of ['stores/','accounting/']){const {b,p,errs}=await h.open(sub);
const o=await p.evaluate(()=>{A.cpick({dataset:{c:'EG'}});return {n:S.accounts.length,notes:S.accounts.filter(a=>/^(1104|2102|1102|1101)/.test(a.code)).map(a=>[a.code,a.name,a.level,a.nature]),menu:APPS.map(a=>a.t)}});
console.log(sub,JSON.stringify(o));await b.close()}})();
