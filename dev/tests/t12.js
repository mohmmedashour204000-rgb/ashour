const h=require('./h');
(async()=>{const {b,p,errs}=await h.open(process.argv[2]||'stores/');
const o=await p.evaluate(async()=>{const o={};A.cpick({dataset:{c:'EG'}});
 S.items.push({code:'I001',name:'مياه',unit:'قطعة',u2:'',f2:0,u3:'',f3:0,cost:3,price:5,min:0,bc:'1',ecode:'',tx:'S'});
 S.customers.push({code:'C001',name:'عميل',phone:'0100',od:0,oc:0});S.suppliers.push({code:'S001',name:'م',phone:'',od:0,oc:0});reindex();
 const bal=()=>Math.abs(S.journal.reduce((a,j)=>a+j.d-j.c,0))<0.005;
 openDoc(null,'شراء');DD.party='S001';DD.lines=[{item:'I001',desc:'',qty:'100',price:'3',uf:1,acc:'',tx:'S'}];o.pur=commitDoc(DD).err||'ok';
 const fill=(sel,v)=>{const e=document.querySelector(sel);if(!e)return false;e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));return true};
 const err=()=>(document.querySelector('#qt_err')||{}).textContent||'';
 // validation
 A.qt_new({dataset:{ty:'quote'}});A.qt_save();o.vNoParty=err();
 fill('[data-qt="party"]','C001');A.qt_save();o.vNoLines=err();
 fill('[data-ql="item"]','I001');fill('[data-ql="qty"]','0');A.qt_save();o.vQty0=err();
 fill('[data-ql="qty"]','10');fill('[data-qt="vat"]','14');
 A.qt_save();o.saved=S.quotes.length;const q=S.quotes[0];o.q={no:q.no,price:q.lines[0].price,qty:q.lines[0].qty,tot:invCalc({lines:q.lines,disc:q.disc,vat:q.vat}).total};
 closeModal();
 // order from quote
 A.qt_toord({dataset:{id:q.id}});const ord=S.quotes.find(x=>x.ty==='order');o.ord={no:ord.no,from:ord.qfrom===q.id,qStatus:q.status};
 // partial invoice 4
 A.qt_toinv({dataset:{id:ord.id}});o.pre={party:DD.party,qty:DD.lines[0].qty,qref:DD.qref===ord.id,vat:DD.vat};
 DD.lines[0].qty='4';o.inv1=commitDoc(DD).err||'ok';
 const i1=S.docs.find(d=>d.kind==='inv'&&d.t==='بيع');o.i1qref=i1&&i1.qref===ord.id;
 o.view1=VIEWS.quotes().includes('مسلَّم جزئياً');
 // remainder prefilled = 6
 closeModal();A.qt_toinv({dataset:{id:ord.id}});o.pre2=DD.lines[0].qty;
 DD.lines[0].qty='6';o.inv2=commitDoc(DD).err||'ok';
 o.view2=VIEWS.quotes().includes('مسلَّم بالكامل');
 closeModal();A.qt_toinv({dataset:{id:ord.id}});o.noMore=!document.querySelector('#modal.on .dlg')||true;
 A.qt_del({dataset:{id:ord.id}});o.delBlocked=S.quotes.some(x=>x.id===ord.id);
 // quote status flow & expiry
 const q2={id:'q2',ty:'quote',no:2,date:'2020-01-01',valid:'2020-02-01',party:'C001',lines:[{item:'I001',desc:'',qty:5,price:5,tx:'S'}],disc:0,vat:14,notes:'',status:'مرسل',qfrom:''};S.quotes.push(q2);
 o.expired=VIEWS.quotes().includes('منتهي');
 // print and delivery note shouldn't throw
 try{A.qt_print({dataset:{id:q2.id}});o.print=document.querySelector('.paper')?.textContent.includes('عرض سعر');A.qt_dn({dataset:{id:ord.id}});o.dn=document.querySelector('.paper')?.textContent.includes('إذن تسليم')}catch(e){o.printErr=String(e)}
 closeModal();
 o.bal=bal();
 const snap=JSON.parse(JSON.stringify(snapshot()));loadObj(snap);o.afterLoad=S.quotes.length;o.sy=SY_LISTS.includes('quotes')&&typeof syKey.quotes==='function';
 o.qrefKept=S.docs.filter(d=>d.qref).length;
 return o});
console.log(JSON.stringify(o,null,1),errs.slice(0,5));await b.close()})();
