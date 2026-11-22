const h=require('./h');
(async()=>{const sub=process.argv[2]||'stores/';const {b,p,errs}=await h.open(sub);const R={};
await p.evaluate(()=>{A.cpick({dataset:{c:'EG'}});S.items.push({code:'I001',name:'مياه',unit:'قطعة',u2:'',f2:0,u3:'',f3:0,cost:3,price:5,min:0,bc:'1',ecode:'',tx:'S'});S.suppliers.push({code:'S001',name:'م',phone:'',od:0,oc:0});reindex();persistAll();openDoc(null,'شراء');DD.party='S001';DD.lines=[{item:'I001',desc:'',qty:'10',price:'3',uf:1,acc:'',tx:'S'}];commitDoc(DD)});
await p.waitForTimeout(800);
await p.reload();await p.waitForTimeout(1500);
R.durable=await p.evaluate(()=>({docs:S.docs.length,je:S.journal.length,items:S.items.length}));
// write failure
R.fail=await p.evaluate(async()=>{Store._w=()=>Promise.reject({code:'QuotaExceededError'});S.customers.push({code:'C9',name:'x',phone:'',unit:'',building:'',od:0,oc:0});reindex();persist('customers');await new Promise(r=>setTimeout(r,500));return {failed:Store.failed,banner:document.getElementById('banner').innerText,sync:document.getElementById('sync').innerText}});
R.errs=errs;console.log(JSON.stringify(R,null,1));await b.close()})();
