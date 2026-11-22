const h=require('./h');
(async()=>{const {b,p,errs}=await h.open('stores/');
const o=await p.evaluate(async()=>{const o={};A.cpick({dataset:{c:'EG'}});
 S.items.push({code:'I001',name:'دواء',unit:'علبة',u2:'',f2:0,u3:'',f3:0,cost:3,price:5,min:0,bc:'1',ecode:'',tx:'S',trk:'1'});reindex();
 openMove();o.mvNull=MV===null;Object.assign(MV,{type:'وارد',item:'I001',wh:'W001',qty:'5',cost:'3',lot:'C9',exp:'2030-01-01',date:today()});
 const n0=S.moves.length;try{saveMove()}catch(e){o.err=String(e.stack).slice(0,300)}
 o.added=S.moves.length-n0;o.mvAfter=MV===null;return o});
console.log(JSON.stringify(o,null,1),errs.slice(0,5));await b.close()})();
