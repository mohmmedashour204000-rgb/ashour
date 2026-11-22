const h=require('./h');
(async()=>{const {b,p,errs}=await h.open(process.argv[2]||'stores/');
const o=await p.evaluate(async()=>{const o={};A.cpick({dataset:{c:'EG'}});
 S.customers.push({code:'C001',name:'عميل',phone:'',od:0,oc:0});S.suppliers.push({code:'S001',name:'مورد',phone:'',od:0,oc:0});reindex();
 const bal=()=>Math.abs(S.journal.reduce((a,j)=>a+j.d-j.c,0))<0.005;
 const inv=(t,party,amt)=>{openDoc(null,t);DD.party=party;DD.lines=[{item:'',desc:'خدمة',qty:'1',price:String(amt),uf:1,acc:t==='بيع'?'':S.accounts.find(a=>a.cls==='مصروفات'&&a.level==='تفصيلي').code,tx:''}];DD.vat='0';const r=commitDoc(DD);return r.err?'ERR:'+r.err:r.doc};
 const sale=inv('بيع','C001',1000);o.sale=typeof sale==='string'?sale:'ok';
 const sl=S.docs.find(d=>d.kind==='inv'&&d.t==='بيع');
 const fill=(k,v)=>{const e=document.querySelector('[data-cq="'+k+'"]');if(!e)return false;e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));return true};
 const save=()=>{A.chq_save();return (document.querySelector('#cq_err')||{}).textContent||''};
 const d10=(()=>{const x=new Date();x.setDate(x.getDate()+10);return x.toISOString().slice(0,10)})();
 const mk=(dir,f)=>{A.chq_new({dataset:{d:dir}});Object.entries(f).forEach(([k,v])=>fill(k,v));return save()};
 // validations
 o.vNoNo=mk('in',{party:'cu:C001',amt:'10'});closeModal();
 o.vNeg=mk('in',{no:'1',party:'cu:C001',amt:'-5'});closeModal();
 o.vNoParty=mk('in',{no:'1',amt:'5'});closeModal();
 o.vDue=mk('in',{no:'1',party:'cu:C001',amt:'5',due:'2000-01-01'});closeModal();
 o.vFuture=mk('in',{no:'1',party:'cu:C001',amt:'5',date:'2090-01-01',due:'2090-02-01'});closeModal();
 o.vOverInv=(()=>{A.chq_new({dataset:{d:'in'}});fill('no','9');fill('party','cu:C001');fill('amt','5000');fill('inv',sl.id);const e=save();closeModal();return e})();
 // register incoming, linked to invoice, post-dated
 o.regIn=mk('in',{no:'555',bank:'الأهلي',party:'cu:C001',amt:'1000',due:d10,inv:sl.id})||'ok';
 const c1=S.cheques[0];o.c1={status:c1.status,acc:c1.acc,hasV:!!IX.doc.get(c1.vch)};
 o.remAfter=remOf(IX.doc.get(sl.id));
 o.postDated=S.journal.filter(j=>j.dc===c1.vch).map(j=>j.a+':'+j.d+'/'+j.c);
 o.bal1=bal();
 o.dup=mk('in',{no:'555',bank:'الأهلي',party:'cu:C001',amt:'1'});closeModal();
 // voucher guarded
 VD=Object.assign({isNew:false},IX.doc.get(c1.vch),{amt:'1'});openVch(c1.vch);const n0=S.docs.length;try{delV()}catch(e){};o.vDelBlocked=S.docs.length===n0&&!!IX.doc.get(c1.vch);
 openVch(c1.vch);document.querySelector('#v_amt').value='7';VD.amt='7';saveV();o.vEditBlocked=IX.doc.get(c1.vch).amt===1000;closeModal();
 // deposit and clear
 A.chq_dep({dataset:{id:c1.id}});o.dep=c1.status;
 const bank=S.accounts.find(a=>/^1102/.test(a.code)&&a.level==='تفصيلي').code;
 A.chq_clr({dataset:{id:c1.id}});fill('acc',bank);fill('date',today());A.chq_clrgo({dataset:{id:c1.id}});
 o.clr={status:c1.status,je:c1.clrJe,rows:S.journal.filter(j=>j.tag==='chq').map(j=>j.a+':'+j.d+'/'+j.c)};o.bal2=bal();
 o.editCleared=(()=>{A.chq_edit({dataset:{id:c1.id}});return 'opened:'+!!document.querySelector('[data-cq="no"]')})();closeModal();
 // undo clear
 A.chq_undo({dataset:{id:c1.id}});askCb&&askCb();o.undo={status:c1.status,rows:S.journal.filter(j=>j.tag==='chq').length};o.bal3=bal();
 // bounce
 A.chq_bnc({dataset:{id:c1.id}});askCb&&askCb();o.bounce={status:c1.status,hasV:!!IX.doc.get(c1.vch||'x'),rem:remOf(IX.doc.get(sl.id)),jr:S.journal.filter(j=>/شيك/.test(j.desc)).length};o.bal4=bal();
 A.chq_del({dataset:{id:c1.id}});askCb&&askCb();o.deleted=S.cheques.length;
 // outgoing
 const pur=inv('شراء','S001',500);o.pur=typeof pur==='string'?pur:'ok';
 o.regOut=mk('out',{no:'77',bank:'مصر',party:'su:S001',amt:'500',due:today()})||'ok';
 const c2=S.cheques[0];o.out={st:c2.status,acc:c2.acc,rows:S.journal.filter(j=>j.dc===c2.vch).map(j=>j.a+':'+j.d+'/'+j.c)};
 A.chq_clr({dataset:{id:c2.id}});fill('acc',bank);A.chq_clrgo({dataset:{id:c2.id}});o.outClr={st:c2.status,rows:S.journal.filter(j=>j.tag==='chq').map(j=>j.a+':'+j.d+'/'+j.c)};o.bal5=bal();
 o.viewOk=(()=>{const h=VIEWS.cheques();return h.includes('555')||h.includes('77')})();
 // backup roundtrip & sync registration
 const snap=JSON.parse(JSON.stringify(snapshot()));o.inSnap=Array.isArray(snap.cheques)&&snap.cheques.length===1;
 loadObj(snap);o.afterLoad=S.cheques.length;o.sy=SY_LISTS.includes('cheques')&&typeof syKey.cheques==='function';
 o.health=(typeof zbHealth==='function'?zbHealth().map(x=>x.t):[]);
 return o});
console.log(JSON.stringify(o,null,1),errs.slice(0,5));await b.close()})();
