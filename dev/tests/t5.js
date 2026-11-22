const h=require('./h');
(async()=>{const sub=process.argv[2]||'stores/';const {b,p,errs}=await h.open(sub);
const R={};
const ev=(f,a)=>p.evaluate(f,a);
// data
await ev(()=>{A.cpick({dataset:{c:'EG'}});S.items.push({code:'I001',name:'مياه',unit:'قطعة',u2:'',f2:0,u3:'',f3:0,cost:3,price:5,min:0,bc:'1',ecode:'',tx:'S'});S.customers.push({code:'C001',name:'ع',phone:'',unit:'',building:'',od:0,oc:0});S.suppliers.push({code:'S001',name:'م',phone:'',od:0,oc:0});reindex();persistAll();
 openDoc(null,'شراء');DD.party='S001';DD.lines=[{item:'I001',desc:'',qty:'10',price:'3',uf:1,acc:'',tx:'S'}];commitDoc(DD);openDoc(null,'بيع');DD.party='C001';DD.lines=[{item:'I001',desc:'',qty:'2',price:'5',uf:1,acc:'',tx:'S'}];commitDoc(DD)});
await p.waitForTimeout(600);
// 1 snapshot + restore
R.snap=await ev(async()=>{await zbSnapNow('يدوي');const idx=await KV.get('snaps');return [idx.length,idx[0].why,idx[0].n]});
R.restore=await ev(async()=>{const before=[S.docs.length,S.journal.length];S.docs=[];S.journal=[];S.items=[];reindex();persistAll();await new Promise(r=>setTimeout(r,500));
 const idx=await KV.get('snaps');const el={dataset:{k:idx[idx.length-1].k}};
 // find the manual one
 const man=idx.find(x=>x.why==='يدوي');
 window.ask=(m,l,fn)=>fn();A.rp_restore({dataset:{k:man.k}});await new Promise(r=>setTimeout(r,1200));
 const after=[S.docs.length,S.journal.length,S.items.length];const idx2=await KV.get('snaps');
 return {before,after,preRestoreSnap:idx2.some(x=>/قبل استبدال/.test(x.why)),bal:Math.abs(S.journal.reduce((a,j)=>a+j.d-j.c,0))<0.01}});
// 2 prune
R.prune=await ev(async()=>{for(let i=0;i<22;i++){await zbSnapNow('يدوي')}for(let i=0;i<12;i++){await zbSnapNow('تلقائي')}const idx=await KV.get('snaps');let keys=0;for(const x of idx){if(await KV.get(x.k))keys++}return {n:idx.length,auto:idx.filter(x=>x.why==='تلقائي').length,man:idx.filter(x=>x.why!=='تلقائي').length,keysPresent:keys}});
// 3 error handling
R.err=await ev(async()=>{setTimeout(()=>{throw new Error('boom-test')},10);Promise.reject(new Error('rej-test'));await new Promise(r=>setTimeout(r,400));const l=await KV.get('errlog');return {logged:l.map(x=>x.m),toast:document.querySelector('#toast')?.innerText||'?'}});
// 4 view fallback
R.fallback=await ev(()=>{S.leaves=[null];location.hash='#leaves';route();const t=document.querySelector('#view').innerText;S.leaves=[];location.hash='#home';route();return {fell:/تعذّر عرض هذه الشاشة/.test(t),homeOk:/ظبطها|الكاشير|المبيعات|المخزون/.test(document.querySelector('#view').innerText)}});
// 5 health
R.health=await ev(()=>{const a=zbHealth().length;S.journal.push({date:'2026-01-01',no:999,desc:'x',tag:'',a:S.accounts.find(x=>x.level==='تفصيلي').code,cc:'',cu:'',su:'',cs:'',d:10,c:0});const b=zbHealth().map(x=>x.t);S.journal.pop();return {clean:a,afterBad:b}});
// 6 settings card renders
R.card=await ev(async()=>{location.hash='#setup';route();await new Promise(r=>setTimeout(r,500));return {card:!!document.getElementById('rp_card'),rows:document.querySelectorAll('#rp_box tbody tr').length}});
// 7 stale tab: second page edits, first has modal open then saves
const p2=await p.context().newPage();await p2.goto('https://app.test/'+sub);await p2.waitForTimeout(1200);
await p2.evaluate(()=>{S.customers.push({code:'C777',name:'من النافذة 2',phone:'',unit:'',building:'',od:0,oc:0});reindex();persist('customers')});
await p.waitForTimeout(1500);
R.stale=await ev(async()=>{document.getElementById('modal').classList.add('on');const staleFlag=Tabs.stale;S.customers.push({code:'C888',name:'من النافذة 1',phone:'',unit:'',building:'',od:0,oc:0});reindex();persist('customers');await new Promise(r=>setTimeout(r,1500));const idx=await KV.get('snaps');return {staleFlag,snap:idx.filter(x=>/نافذة أخرى/.test(x.why)).length}});
R.errs=errs.filter(e=>!/boom-test|rej-test/.test(e));
console.log(JSON.stringify(R,null,1));await b.close()})();
