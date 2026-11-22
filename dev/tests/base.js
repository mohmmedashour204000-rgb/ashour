const h=require('./h');
(async()=>{const {b,p,errs}=await h.open(process.argv[2]||'stores/');
const r=await p.evaluate(()=>{
 S.items.push({code:'I001',name:'مياه',unit:'قطعة',u2:'كرتونة',f2:24,u3:'',f3:0,cat:'',cost:3,price:5,min:0,bc:'111',ecode:'',tx:'S'});
 S.customers.push({code:'C001',name:'ع',phone:'',unit:'',building:'',od:0,oc:0});S.suppliers.push({code:'S001',name:'م',phone:'',od:0,oc:0});reindex();
 const L=(q,p,u)=>({item:'I001',desc:'',qty:String(q),price:String(p),uf:u||1,acc:'',tx:'S'});
 const mk=(t,party,lines,x)=>{openDoc(null,t);DD.party=party;DD.lines=lines;Object.assign(DD,x||{});const r=commitDoc(DD);return r.err?'ERR:'+r.err:'ok'};
 const o={};
 o.pur=mk('شراء','S001',[L(10,72,24)]);o.sal=mk('بيع','C001',[L(2,120,24)]);
 o.srBig=mk('مرتجع بيع','C001',[L(500,5)]);
 o.prBig=mk('مرتجع شراء','S001',[L(500,3)]);
 return o});
console.log(JSON.stringify(r),errs);await b.close()})();
