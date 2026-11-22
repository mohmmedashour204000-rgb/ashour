const h=require('./h');
(async()=>{const {b,p,errs}=await h.open(process.argv[2]||'stores/');
const o=await p.evaluate(()=>{
 const o={};A.cpick({dataset:{c:'EG'}});
 const txs=['S','S','L10','Z','E'];
 for(let i=0;i<8;i++)S.items.push({code:'I'+(100+i),name:'صنف'+i,unit:'قطعة',u2:'',f2:0,u3:'',f3:0,cost:1,price:+(Math.random()*50+0.5).toFixed(2),min:0,bc:'B'+i,ecode:'',tx:txs[i%5]});
 S.suppliers.push({code:'S001',name:'م',phone:'',od:0,oc:0});reindex();
 openDoc(null,'شراء');DD.party='S001';DD.lines=S.items.map(i=>({item:i.code,desc:'',qty:'100000',price:'1',uf:1,acc:'',tx:i.tx}));console.log=()=>{};const pr=commitDoc(DD);o.pur=pr.err||'ok';
 const toastMsgs=[];const _t=toast;window.toast=m=>{toastMsgs.push(m)};
 let mism=0,errs=0,remNonZero=0,n=0;const samples=[];
 for(const incl of ['1','0']){S.meta.posIncl=incl;
 for(let k=0;k<400;k++){
  PS.lines=[];const nl=1+Math.floor(Math.random()*4);
  for(let j=0;j<nl;j++){const it=S.items[Math.floor(Math.random()*S.items.length)];posAdd(it.code,Math.floor(Math.random()*7)+1)}
  PS.lines.forEach(l=>{if(Math.random()<.3)l.price=+(Math.random()*20+.1).toFixed(2)});
  PS.disc=Math.random()<.3?String((Math.random()*5).toFixed(2)):'';PS.pay=Math.random()<.5?'cash':'card';PS.recv='';
  const t=posTotals();const cartTotal=t.c.total;const before=S.docs.length;toastMsgs.length=0;
  try{posPay()}catch(e){errs++;samples.push('THROW '+e.message);continue}
  n++;
  if(S.docs.length===before){errs++;if(samples.length<4)samples.push(toastMsgs.join('|')+' cart='+cartTotal);try{closeModal()}catch(e){};continue}
  const d=S.docs.filter(x=>x.kind==='inv').slice(-1)[0];
  if(Math.abs(d.total-cartTotal)>0.0051){mism++;if(samples.length<8)samples.push('mismatch doc='+d.total+' cart='+cartTotal+' incl='+incl)}
  if(Math.abs(remOf(d))>0.0051)remNonZero++;
  try{closeModal()}catch(e){}
 }}
 o.n=n;o.errs=errs;o.mism=mism;o.remNonZero=remNonZero;o.samples=samples;
 const d=S.journal.reduce((a,j)=>a+j.d,0),c=S.journal.reduce((a,j)=>a+j.c,0);o.bal=Math.abs(d-c)<0.01;
 return o});
console.log(JSON.stringify(o,null,1),errs.slice(0,3));await b.close()})();
