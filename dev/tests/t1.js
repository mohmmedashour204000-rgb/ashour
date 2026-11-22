const h=require('./h');
(async()=>{const sub=process.argv[2]||'stores/';const {b,p,errs}=await h.open(sub);
const o=await p.evaluate(async()=>{
 const o={};
 o.hash=location.hash; o.homeHasCountry=/البلد والعملة|اختر بلد/.test(document.body.innerText);
 location.hash='#home';route();o.home2=/بلد النشاط|البلد والعملة/.test(document.querySelector('#view').innerText);
 location.hash='#setup';route();const t=document.querySelector('#view').innerText;o.setupCard=/بلد النشاط والعملة والضريبة/.test(t);o.setupOldSelect=!!document.querySelector('select[data-meta="country"]');o.setupBtns=document.querySelectorAll('[data-act="cpick"]').length;
 // pick Saudi then Egypt (still editable: no transactions)
 A.cpick({dataset:{c:'SA'}});o.sa=[S.meta.country,S.meta.vat,S.meta.cur];A.cpick({dataset:{c:'EG'}});o.eg=[S.meta.country,S.meta.vat,S.meta.cur];
 S.items.push({code:'I001',name:'مياه',unit:'قطعة',u2:'كرتونة',f2:24,u3:'',f3:0,cost:3,price:5,min:0,bc:'111',ecode:'',tx:'S'});
 S.customers.push({code:'C001',name:'ع',phone:'',unit:'',building:'',od:0,oc:0});S.suppliers.push({code:'S001',name:'م',phone:'',od:0,oc:0});reindex();
 const L=(q,p,u)=>({item:'I001',desc:'',qty:String(q),price:String(p),uf:u||1,acc:'',tx:'S'});
 const mk=(t,party,lines,x)=>{openDoc(null,t);DD.party=party;DD.lines=lines;Object.assign(DD,x||{});const r=commitDoc(DD);return r.err?'ERR:'+r.err.slice(0,60):'ok'};
 o.pur=mk('شراء','S001',[L(10,72,24)]);o.sal=mk('بيع','C001',[L(2,120,24)]);
 o.srBig=mk('مرتجع بيع','C001',[L(500,5)]);o.srOk=mk('مرتجع بيع','C001',[L(10,5)]);
 o.srExactRest=mk('مرتجع بيع','C001',[L(38,5)]);o.srOver=mk('مرتجع بيع','C001',[L(1,5)]);
 o.prBig=mk('مرتجع شراء','S001',[L(500,3)]);o.prOk=mk('مرتجع شراء','S001',[L(24,3)]);
 o.future=mk('بيع','C001',[L(1,5)],{date:'2031-01-01'});o.today=mk('بيع','C001',[L(1,5)]);
 // locked country after tx
 A.cpick({dataset:{c:'SA'}});o.afterLock=[S.meta.country,S.meta.vat];
 location.hash='#setup';route();o.lockedBtnsDisabled=[...document.querySelectorAll('[data-act="cpick"]')].map(x=>x.disabled);o.lockMsg=/ولا يمكن تغييره/.test(document.querySelector('#view').innerText);
 // journal
 const acc=S.accounts.filter(a=>a.level==='تفصيلي').slice(0,2).map(a=>a.code);
 const run=(lines)=>{openEntry(null);ED.desc='t';ED.lines=lines.map(x=>Object.assign(blank(),x));const n=S.journal.length;saveEntry(!0);const err=(document.querySelector('#err')||{}).textContent||'';const add=S.journal.length-n;try{closeModal()}catch(e){}return err.slice(0,50)+'|'+add};
 o.unb=run([{a:acc[0],d:'100'},{a:acc[1],c:'90'}]);o.parent=run([{a:'1100',d:'100'},{a:acc[1],c:'100'}]);o.huge=run([{a:acc[0],d:'1e308'},{a:acc[1],c:'1e308'}]);o.good=run([{a:acc[0],d:'100'},{a:acc[1],c:'100'}]);
 // items
 const te=(v)=>{editEnt('items','');for(const k in v){const e=document.querySelector('#f_'+k);if(e)e.value=v[k]}saveEnt();const er=document.querySelector('#err')?.textContent||'';try{closeModal()}catch(e){}return er.slice(0,45)};
 o.negItem=te({code:'I9',name:'x',cost:'-1',price:'2'});o.f2noU=te({code:'I8',name:'y',f2:'12',cost:'1',price:'2'});o.okItem=te({code:'I7',name:'z',cost:'1',price:'2'});
 const d=S.journal.reduce((a,j)=>a+j.d,0),c=S.journal.reduce((a,j)=>a+j.c,0);o.bal=Math.abs(d-c)<0.01;
 return o});
console.log(JSON.stringify(o,null,1),errs);await b.close()})();
