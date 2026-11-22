const h=require('./h');
(async()=>{const sub=process.argv[2]||'stores/';const {b,p,errs}=await h.open(sub);const R={};
await p.evaluate(()=>{A.cpick({dataset:{c:'EG'}});S.customers.push({code:'C001',name:'ع',phone:'',unit:'',building:'',od:0,oc:0});reindex();persistAll()});
await p.waitForTimeout(800);
const p2=await p.context().newPage();await p2.goto('https://app.test/'+sub);await p2.waitForTimeout(1500);
// A) idle tab auto-refreshes
await p2.evaluate(()=>{S.customers.push({code:'C777',name:'من 2',phone:'',unit:'',building:'',od:0,oc:0});reindex();persist('customers')});
await p.waitForTimeout(2500);
R.autoRefresh=await p.evaluate(()=>S.customers.some(c=>c.code==='C777'));
// B) busy tab (modal open) -> stale -> guarded save
await p.evaluate(()=>{document.getElementById('modal').classList.add('on')});
await p2.evaluate(()=>{S.customers.push({code:'C778',name:'من 2 ب',phone:'',unit:'',building:'',od:0,oc:0});reindex();persist('customers')});
await p.waitForTimeout(2200);
R.b=await p.evaluate(async()=>{const st=Tabs.stale;S.customers.push({code:'C888',name:'من 1',phone:'',unit:'',building:'',od:0,oc:0});reindex();persist('customers');await new Promise(r=>setTimeout(r,1500));const idx=(await KV.get('snaps'))||[];const sn=idx.find(x=>/نافذة أخرى/.test(x.why));let has=null;if(sn){const o=await KV.get(sn.k);const txt=await (async()=>{const ds=new DecompressionStream('gzip');const w=ds.writable.getWriter();w.write(o.b);w.close();return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer())})();has=JSON.parse(txt).customers.map(c=>c.code)}return {st,snapCreated:!!sn,otherTabDataInSnapshot:has}});
R.errs=errs;console.log(JSON.stringify(R,null,1));await b.close()})();
