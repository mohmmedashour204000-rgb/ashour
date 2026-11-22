const h=require('./h');
(async()=>{const {b,p,errs}=await h.open(process.argv[2]||'stores/');
const o=await p.evaluate(async()=>{const o={};A.cpick({dataset:{c:'EG'}});
 S.items.push({code:'I001',name:'م',unit:'قطعة',u2:'',f2:0,u3:'',f3:0,cost:3,price:5,min:0,bc:'1',ecode:'',tx:'S'});
 S.customers.push({code:'C001',name:'ع',phone:'',od:0,oc:0});S.suppliers.push({code:'S001',name:'م',phone:'',od:0,oc:0});reindex();
 const f=(n)=>{const x=new Date();x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
 const doc=(t,d)=>{openDoc(null,t);DD.party=t==='بيع'?'C001':'S001';DD.date=d;DD.lines=[{item:'I001',desc:'',qty:'5',price:'3',uf:1,acc:'',tx:'S'}];const r=commitDoc(DD);return r.err||'ok'};
 o.purToday=doc('شراء',f(0));o.invTomorrow=doc('بيع',f(1));o.invFar=doc('بيع',f(400));o.invPast=doc('بيع',f(-3));
 // voucher
 openVch(null,'قبض');VD.party='cu:C001';VD.amt='5';VD.date=f(1);saveV();o.vTomorrow=(document.querySelector('#err')||{}).textContent;closeModal();
 openVch(null,'قبض');VD.party='cu:C001';VD.amt='5';VD.date=f(0);saveV();o.vToday=(document.querySelector('#err')||{}).textContent||'ok';try{closeModal()}catch(e){}
 // entry
 const a1=S.accounts.filter(a=>a.level==='تفصيلي')[0].code,a2=S.accounts.filter(a=>a.level==='تفصيلي')[1].code;
 const ent=(d)=>{openEntry();ED.date=d;ED.desc='t';ED.lines[0]=Object.assign({},ED.lines[0],{a:a1,d:'10',c:''});ED.lines[1]=Object.assign({},ED.lines[1],{a:a2,d:'',c:'10'});try{saveEntry()}catch(e){return 'EX '+e}const r=(document.querySelector('#err')||{}).textContent||'ok';try{closeModal()}catch(e){}return r};
 o.entTomorrow=ent(f(1));o.entToday=ent(f(0));
 // move
 openMove();Object.assign(MV,{type:'وارد',item:'I001',wh:'W001',qty:'1',cost:'3',date:f(2)});saveMove();o.mvFuture=(document.querySelector('#err')||{}).textContent;
 closeModal();
 o.bal=Math.abs(S.journal.reduce((a,j)=>a+j.d-j.c,0))<0.005;
 return o});
console.log(JSON.stringify(o,null,1),errs.slice(0,5));await b.close()})();
