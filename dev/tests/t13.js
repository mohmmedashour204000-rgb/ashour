const h=require('./h');
(async()=>{const {b,p,errs}=await h.open(process.argv[2]||'stores/');
const o=await p.evaluate(async()=>{const o={};A.cpick({dataset:{c:'EG'}});
 S.items.push({code:'I001',name:'دواء',unit:'علبة',u2:'',f2:0,u3:'',f3:0,cost:3,price:5,min:0,bc:'1',ecode:'',tx:'S',trk:'1'});
 S.items.push({code:'I002',name:'عادي',unit:'قطعة',u2:'',f2:0,u3:'',f3:0,cost:2,price:4,min:0,bc:'2',ecode:'',tx:'S'});
 S.customers.push({code:'C001',name:'ع',phone:'',od:0,oc:0});S.suppliers.push({code:'S001',name:'م',phone:'',od:0,oc:0});
 S.whs.push({code:'W002',name:'فرع',place:''});reindex();
 let step=0;const sm=()=>{step++;try{saveMove()}catch(e){o["saveErr"+step]=String(e).slice(0,80)}};
 const bal=()=>Math.abs(S.journal.reduce((a,j)=>a+j.d-j.c,0))<0.005;
 const dt=n=>{const x=new Date();x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
 const doc=(t,party,lines,x)=>{openDoc(null,t);DD.party=party;DD.lines=lines;Object.assign(DD,x||{});const r=commitDoc(DD);return r.err?'ERR:'+r.err:'ok'};
 const L=(item,qty,price,x)=>Object.assign({item,desc:'',qty:String(qty),price:String(price),uf:1,acc:'',tx:'S'},x||{});
 o.noExp=doc('شراء','S001',[L('I001',10,3)]);
 o.badExp=doc('شراء','S001',[L('I001',10,3,{exp:'xx'})]);
 o.p1=doc('شراء','S001',[L('I001',10,3,{lot:'A1',exp:dt(20)})]);
 o.p2=doc('شراء','S001',[L('I001',10,3,{lot:'B1',exp:dt(200)})]);
 o.p3=doc('شراء','S001',[L('I001',4,3,{lot:'OLD',exp:dt(-5)})]);
 o.p4=doc('شراء','S001',[L('I002',10,2)]);
 const rows=()=>zbLotRows().filter(r=>r.item==='I001'&&r.wh==='W001').map(r=>r.lot+':'+r.qty).sort().join(',');
 o.lots0=rows();
 // sale 12: FEFO -> A1 10 then B1 2 ; expired OLD untouched
 o.s1=doc('بيع','C001',[L('I001',12,5)]);o.lots1=rows();
 // available non-expired = 8 ; sale of 9 must fail (OLD expired 4 remains)
 o.s2=doc('بيع','C001',[L('I001',9,5)]);
 o.s3=doc('بيع','C001',[L('I001',8,5)]);o.lots2=rows();
 // writeoff expired via move with lot
 A.lot_wo({dataset:{i:'I001',w:'W001',l:'OLD',q:'4'}});o.mvForm={type:MV.type,lot:MV.lot,qty:MV.qty};
 MV.acc=S.accounts.find(a=>a.cls==='مصروفات'&&a.level==='تفصيلي').code;sm();o.wo=(document.querySelector('#err')||{}).textContent||'ok';
 try{closeModal()}catch(e){}
 o.lots3=rows();o.exp0=zbLotRows().filter(r=>r.exp&&r.exp<dt(0)).length;
 // manual incoming move with lot+expiry, and transfer
 openMove();Object.assign(MV,{type:'وارد',item:'I001',wh:'W001',qty:'5',cost:'3',lot:'C9',exp:dt(90),date:dt(0)});sm();o.mvIn=(document.querySelector('#err')||{}).textContent||'ok';try{closeModal()}catch(e){}
 openMove();Object.assign(MV,{type:'وارد',item:'I001',wh:'W001',qty:'5',cost:'3',lot:'',exp:'',date:dt(0)});sm();o.mvInNoExp=(document.querySelector('#err')||{}).textContent;try{closeModal()}catch(e){}
 openMove();Object.assign(MV,{type:'تحويل',item:'I001',wh:'W001',wh2:'W002',qty:'3',date:dt(0)});sm();try{closeModal()}catch(e){}
 o.w2=zbLotRows().filter(r=>r.item==='I001'&&r.wh==='W002').map(r=>r.lot+':'+r.qty).join(',');o.w1=rows();
 // untracked item unaffected
 o.untr=zbLotRows().some(r=>r.item==='I002');o.s4=doc('بيع','C001',[L('I002',3,4)]);
 // totals consistent with stock
 const st=stock().get('I001');o.stockQty=st.qty;o.lotSum=zbLotRows().filter(r=>r.item==='I001').reduce((a,r)=>a+r.qty,0);
 o.view=(()=>{const h=VIEWS.lots();return h.includes('قريب الانتهاء')||h.includes('سليم')})();
 o.bal=bal();
 const snap=JSON.parse(JSON.stringify(snapshot()));loadObj(snap);o.lotKept=S.moves.filter(m=>m.lot).length;o.trkKept=S.items[0].trk;
 return o});
console.log(JSON.stringify(o,null,1),errs.slice(0,5));await b.close()})();
