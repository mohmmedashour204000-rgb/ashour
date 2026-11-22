const h=require('./h');
(async()=>{const {b,p,errs}=await h.open(process.argv[2]||'stores/');
const o=await p.evaluate(()=>{
 const o={};A.cpick({dataset:{c:'EG'}});
 S.items.push({code:'I001',name:'مياه',unit:'قطعة',u2:'كرتونة',f2:24,u3:'',f3:0,cost:3,price:5,min:0,bc:'111',ecode:'',tx:'S'});
 S.items.push({code:'I002',name:'<img src=x onerror="window.__xss=1">',unit:'قطعة',u2:'',f2:0,u3:'',f3:0,cost:1,price:2,min:0,bc:'',ecode:'',tx:'S'});
 S.customers.push({code:'C001',name:'<b id=xc>ع</b>',phone:'',unit:'',building:'',od:0,oc:0});S.customers.push({code:'C002',name:'عميل ٢',phone:'',unit:'',building:'',od:0,oc:0});
 S.suppliers.push({code:'S001',name:'م',phone:'',od:0,oc:0});reindex();
 const L=(q,p,u,it)=>({item:it||'I001',desc:'',qty:String(q),price:String(p),uf:u||1,acc:'',tx:'S'});
 const mk=(t,party,lines,x)=>{openDoc(null,t);DD.party=party;DD.lines=lines;Object.assign(DD,x||{});const r=commitDoc(DD);return r.err?'ERR:'+r.err.slice(0,70):r.doc};
 const bal=()=>{const d=S.journal.reduce((a,j)=>a+j.d,0),c=S.journal.reduce((a,j)=>a+j.c,0);return Math.abs(d-c)<0.005};
 // d) average cost
 mk('شراء','S001',[L(10,3)]);mk('شراء','S001',[L(10,5)]);mk('شراء','S001',[L(50,1,1,'I002')]);
 const s1=mk('بيع','C001',[L(4,9)]);o.avgMoves=JSON.stringify(S.moves.filter(m=>m.type==='منصرف').map(m=>m.cost));
 // e) rounding
 const r=mk('بيع','C001',[L(3,0.333),L(7,1.115,1,'I002')],{disc:'0.1',vat:'14'});o.round=typeof r==='string'?r:[r.sub,r.net,r.vatAmt,r.total];o.balRound=bal();
 // a) vouchers
 const inv=S.docs.find(d=>d.t==='بيع'&&d.no===1);
 const mv=(t,party,amt,x)=>{openVch(null,t);Object.assign(VD,{party,amt:String(amt),acc:mapAcc('cash')},x||{});const n=S.docs.length;saveV();const e=(document.querySelector('#err')||{}).textContent||'';try{closeModal()}catch(e){}return e.slice(0,60)+'|'+(S.docs.length-n)};
 o.rem0=remOf(inv);
 o.overRcv=mv('قبض','cu:C001',100000,{inv:inv.id});o.remAfter=remOf(inv);
 o.wrongParty=mv('قبض','cu:C002',1,{inv:inv.id});
 o.payOnSale=mv('صرف','cu:C001',1,{inv:inv.id});
 o.futureV=mv('قبض','cu:C001',1,{date:'2035-01-01'});
 // b) delete original with return referencing it
 const sale=mk('بيع','C002',[L(5,10)]);const ret=mk('مرتجع بيع','C002',[L(2,10)],{ref:sale.id});o.retOk=typeof ret==='string'?ret:'ok';
 // remove vouchers on sale first (none) then try deleting original
 DD=JSON.parse(JSON.stringify(sale));const n0=S.docs.length;try{ask=(m,l,fn)=>fn();delDoc()}catch(e){o.delErr=String(e)}o.origDeletedDespiteReturn=S.docs.length<n0;
 // c) edit/delete purchase below sold
 const pur=S.docs.find(d=>d.t==='شراء'&&d.no===1);
 openDoc(pur.id);DD.lines[0].qty='1';const ed=commitDoc(DD);o.editPurBelowSold=ed.err?ed.err.slice(0,60):'ALLOWED';
 // g) backup roundtrip
 try{const snap=JSON.stringify(snapshot());const before=JSON.stringify([S.docs.length,S.journal.length,S.items.length]);replaceAll(JSON.parse(snap));o.restore=before===JSON.stringify([S.docs.length,S.journal.length,S.items.length])}catch(e){o.restore='ERR '+e.message}
 // f) xss render
 for(const v of Object.keys(VIEWS)){try{location.hash='#'+v;route()}catch(e){}}
 openDoc(null,'بيع');
 o.xss=!!window.__xss||!!document.getElementById('xc')||!!document.querySelector('img[src=x]');
 o.finalBal=bal();
 return o});
console.log(JSON.stringify(o,null,1),errs);await b.close()})();
