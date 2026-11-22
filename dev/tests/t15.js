const h=require('./h');
(async()=>{const {b,p,errs}=await h.open(process.argv[2]||'stores/');
const o=await p.evaluate(async()=>{const o={};A.cpick({dataset:{c:'EG'}});
 S.customers.push({code:'C001',name:'ع',phone:'',od:0,oc:0});S.suppliers.push({code:'S001',name:'م',phone:'',od:0,oc:0});reindex();
 const bal=()=>Math.abs(S.journal.reduce((a,j)=>a+j.d-j.c,0))<0.005;
 const rows=(id)=>S.journal.filter(j=>j.dc===id).map(j=>j.a+':'+j.d+'/'+j.c);
 o.noCur=(()=>{openDoc(null,'بيع');DD.party='C001';DD.cur='USD';DD.rate='50';DD.lines=[{item:'',desc:'خدمة',qty:'1',price:'100',uf:1,acc:'',tx:''}];DD.vat='0';return commitDoc(DD).err})();
 S.meta.fcur='USD, EUR';
 const mk=(t,party,cur,rate,price,x)=>{openDoc(null,t);DD.party=party;DD.cur=cur;DD.rate=rate;DD.vat='0';DD.lines=[{item:'',desc:'خدمة',qty:'1',price:String(price),uf:1,acc:t==='بيع'?'':S.accounts.find(a=>a.cls==='مصروفات'&&a.level==='تفصيلي').code,tx:''}];Object.assign(DD,x||{});const r=commitDoc(DD);return r.err?'ERR:'+r.err:r.doc};
 o.badRate=mk('بيع','C001','USD','0',100);
 o.withPay=mk('بيع','C001','USD','50',100,{payNow:'10'});
 const inv=mk('بيع','C001','USD','50',100);o.inv=typeof inv==='string'?inv:'ok';
 const iv=S.docs.find(d=>d.kind==='inv'&&d.cur==='USD');
 o.ivd={cur:iv.cur,rate:iv.rate,total:iv.total,ftotal:iv.ftotal,fp:iv.lines[0].fp,price:iv.lines[0].price};
 const fill=(sel,v)=>{const e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};
 const pay=(t,inv,fa,fr)=>{openVch(null,t,{party:(t==='قبض'?'cu:':'su:')+(t==='قبض'?'C001':'S001'),inv:inv.id});o.pre=o.pre||{fa:VD.fa,fr:VD.frate,amt:VD.amt};fill('#v_fa',fa);fill('#v_frate',fr);saveV();const e=(document.querySelector('#err')||{}).textContent||'ok';try{closeModal()}catch(x){}return e};
 o.over=pay('قبض',iv,'150','50');
 o.p1=pay('قبض',iv,'60','52');
 const v1=S.docs.find(d=>d.kind==='vch');o.v1={amt:v1.amt,fx:v1.fx,rows:rows(v1.id)};o.rem1=remOf(iv);o.bal1=bal();
 o.p2=pay('قبض',iv,'40','49');
 const v2=S.docs.filter(d=>d.kind==='vch')[1];o.v2={amt:v2.amt,rows:rows(v2.id)};o.rem2=remOf(iv);o.paid=stateOf(IX.doc.get(iv.id))[0];o.bal2=bal();
 // edit v1 amount downward then back; and edit blocked changing rate of invoice with payment
 openDoc(iv.id);o.reopen={cur:DD.cur,rate:DD.rate,price:DD.lines[0].price};DD.rate='55';o.rateEdit=commitDoc(DD).err||'ALLOWED';
 openDoc(iv.id);o.curEdit=(()=>{DD.cur='';return commitDoc(DD).err||'ALLOWED'})();
 o.html=invHtml(IX.doc.get(iv.id)).includes('سعر الصرف');
 // supplier EUR invoice and payment (loss/gain on payments side)
 const pi=mk('شراء','S001','EUR','55',200);const piv=S.docs.find(d=>d.cur==='EUR');o.pinv={total:piv.total,ft:piv.ftotal};
 o.pp1=pay('صرف',piv,'200','53');const pv=S.docs.filter(d=>d.kind==='vch')[2];o.pv={amt:pv.amt,rows:rows(pv.id)};o.pRem=remOf(piv);o.bal3=bal();
 // delete a payment restores the remaining
 VD=Object.assign({isNew:false},v2);delV();askCb&&askCb();o.afterDel={rem:remOf(iv),bal:bal()};
 const snap=JSON.parse(JSON.stringify(snapshot()));loadObj(snap);o.keep=S.docs.filter(d=>d.cur).length+'/'+S.docs.filter(d=>d.fx).length;
 o.health=typeof zbHealth==='function'?zbHealth().map(x=>x.t):[];
 return o});
console.log(JSON.stringify(o,null,1),errs.slice(0,5));await b.close()})();
