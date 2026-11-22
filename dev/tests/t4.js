const h=require('./h');
(async()=>{const {b,p,errs}=await h.open(process.argv[2]||'stores/');
const o=await p.evaluate(()=>{
 const o={};A.cpick({dataset:{c:'EG'}});
 S.items.push({code:'I001',name:'مياه',unit:'قطعة',u2:'',f2:0,u3:'',f3:0,cost:3,price:5,min:0,bc:'111',ecode:'',tx:'S'});
 S.suppliers.push({code:'S001',name:'م',phone:'',od:0,oc:0});S.whs.push({code:'W002',name:'فرع',place:''});reindex();
 openDoc(null,'شراء');DD.party='S001';DD.lines=[{item:'I001',desc:'',qty:'10',price:'3',uf:1,acc:'',tx:'S'}];o.pur=commitDoc(DD).err||'ok';
 // transfer more than available / same warehouse / negative / zero
 const mv=(x)=>{openMove&&openMove();Object.assign(MV,x);const n=S.moves.length;saveMove();const e=(document.querySelector('#err')||{}).textContent||'';try{closeModal()}catch(e){}return e.slice(0,55)+'|'+(S.moves.length-n)};
 o.trOver=mv({type:'تحويل',item:'I001',wh:'W001',wh2:'W002',qty:'50',cost:'3',date:today()});
 o.trSame=mv({type:'تحويل',item:'I001',wh:'W001',wh2:'W001',qty:'1',cost:'3',date:today()});
 o.trNeg=mv({type:'تحويل',item:'I001',wh:'W001',wh2:'W002',qty:'-5',cost:'3',date:today()});
 o.trOk=mv({type:'تحويل',item:'I001',wh:'W001',wh2:'W002',qty:'4',cost:'3',date:today()});
 o.outOver=mv({type:'منصرف',item:'I001',wh:'W002',qty:'9',cost:'3',date:today()});
 o.inNegCost=mv({type:'وارد',item:'I001',wh:'W001',qty:'1',cost:'-3',date:today()});
 o.inNoCost=mv({type:'وارد',item:'I001',wh:'W001',qty:'1',cost:'0',date:today()});
 const st=stock().get('I001');o.stock=[st.qty,st.val,[...st.wh.entries()]];
 // GL vs stock
 const gl=S.journal.filter(j=>j.a==='110501').reduce((a,j)=>a+j.d-j.c,0);o.gl=gl;
 return o});
console.log(JSON.stringify(o,null,1),errs.slice(0,3));await b.close()})();
