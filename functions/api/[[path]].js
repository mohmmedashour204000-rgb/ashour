/* Zabtaha sync API - Cloudflare Pages Function + D1 (binding name: DB)
   POST /api/ping | /api/sync/{init,join,push,pull,status}
   A company is identified by SHA-256(sync code); the code itself is never stored. */
const PUB={"kty":"EC","crv":"P-256","x":"2iMXRKPeHcTUdihK4uPe5fq8g5M_xTYNNxJ1UzYxJUA","y":"mRQN8msU0ZWN-v30Mg1dXwlBgOvSQZymS5lQJt5vHyw"};
const GRACE_DAYS=14,MAX_OPS=200,MAX_PULL=400;
const H={'access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization','access-control-allow-methods':'POST,OPTIONS','access-control-max-age':'86400'};
const J=(o,s)=>new Response(JSON.stringify(o),{status:s||200,headers:Object.assign({'content-type':'application/json; charset=utf-8','cache-control':'no-store'},H)});
let READY=false;
async function ensure(db){if(READY)return;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS companies(id TEXT PRIMARY KEY,name TEXT,seq INTEGER NOT NULL DEFAULT 0,next_dev INTEGER NOT NULL DEFAULT 2,exp TEXT NOT NULL DEFAULT '',created INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS records(cid TEXT NOT NULL,l TEXT NOT NULL,k TEXT NOT NULL,rev INTEGER NOT NULL,seq INTEGER NOT NULL,d TEXT,del INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(cid,l,k))"),
    db.prepare("CREATE INDEX IF NOT EXISTS rec_seq ON records(cid,seq)")]);
  READY=true}
const b64u=s=>{s=String(s).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const r=atob(s),u=new Uint8Array(r.length);for(let i=0;i<r.length;i++)u[i]=r.charCodeAt(i);return u};
async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const iso=ms=>new Date(ms).toISOString().slice(0,10);
/* returns {ok,exp} where exp is the licence expiry ('9999-12-31' when it never expires) */
async function checkLic(lic,dev){try{lic=String(lic||'').replace(/\s+/g,'');const[p,sg]=lic.split('.');if(!p||!sg)return{ok:0};
  const k=await crypto.subtle.importKey('jwk',PUB,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},k,b64u(sg),b64u(p)))return{ok:0};
  const o=JSON.parse(new TextDecoder().decode(b64u(p)));if(o.r)return{ok:0};if(o.d&&o.d!==dev)return{ok:0,why:'device'};
  if(o.x&&iso(Date.now())>o.x)return{ok:0,why:'expired',exp:o.x};return{ok:1,exp:o.x||'9999-12-31',name:o.n||''}}catch(e){return{ok:0}}}
const canWrite=c=>{if(!c.exp)return false;const lim=iso(Date.now()-GRACE_DAYS*864e5);return c.exp>=lim};
export async function onRequest({request,env}){
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:H});
  const url=new URL(request.url),route=url.pathname.replace(/^\/api\/?/,'').replace(/\/$/,'');
  if(route==='ping')return J({ok:1,t:Date.now(),db:!!env.DB});
  if(!env.DB)return J({err:'nodb',msg:'قاعدة بيانات المزامنة غير مربوطة بالسيرفر بعد.'},503);
  if(request.method!=='POST')return J({err:'method'},405);
  let b;try{b=await request.json()}catch(e){return J({err:'json'},400)}
  const db=env.DB;await ensure(db);
  const code=String(b.code||'').trim();if(code.length<16||code.length>80)return J({err:'code',msg:'رمز المزامنة غير صحيح.'},400);
  const cid=(await sha(code)).slice(0,32);
  const getC=()=>db.prepare('SELECT * FROM companies WHERE id=?').bind(cid).first();
  if(route==='sync/init'){
    const lic=await checkLic(b.lic,b.dev);if(!lic.ok)return J({err:'lic',msg:lic.why==='expired'?'انتهت صلاحية الترخيص.':lic.why==='device'?'مفتاح الترخيص لجهاز آخر.':'المزامنة تحتاج ترخيصاً مفعّلاً (وليس الفترة التجريبية).'},402);
    if(await getC())return J({err:'exists',msg:'هذا الرمز مستخدم بالفعل.'},409);
    await db.prepare('INSERT INTO companies(id,name,seq,next_dev,exp,created) VALUES(?,?,0,2,?,?)').bind(cid,String(b.name||'').slice(0,80),lic.exp,Date.now()).run();
    return J({ok:1,idx:1,seq:0,exp:lic.exp})}
  const c=await getC();if(!c)return J({err:'nocompany',msg:'لا توجد شركة بهذا الرمز.'},404);
  if(route==='sync/join'){const r=await db.prepare('UPDATE companies SET next_dev=next_dev+1 WHERE id=? RETURNING next_dev').bind(cid).first();
    const idx=(r&&r.next_dev?r.next_dev:c.next_dev+1)-1;if(idx>99)return J({err:'devices',msg:'تجاوزت الحد الأقصى للأجهزة (٩٩).'},409);
    return J({ok:1,idx,name:c.name,seq:c.seq,exp:c.exp,canWrite:canWrite(c)})}
  if(route==='sync/status'){const n=await db.prepare('SELECT COUNT(*) n FROM records WHERE cid=? AND del=0').bind(cid).first();return J({ok:1,seq:c.seq,records:n.n,devices:c.next_dev-1,exp:c.exp,canWrite:canWrite(c),name:c.name})}
  if(route==='sync/pull'){const since=Math.max(0,parseInt(b.since)||0),lim=Math.min(MAX_PULL,Math.max(1,parseInt(b.limit)||MAX_PULL));
    if(since>c.seq)return J({ok:1,reset:true,seq:c.seq,ops:[],more:false});
    const rs=await db.prepare('SELECT l,k,rev,seq,d,del FROM records WHERE cid=?1 AND seq>?2 ORDER BY seq LIMIT ?3').bind(cid,since,lim).all();
    const rows=rs.results||[],last=rows.length?rows[rows.length-1].seq:since;
    const body='{"ok":1,"ops":['+rows.map(r=>'{"l":'+JSON.stringify(r.l)+',"k":'+JSON.stringify(r.k)+',"rev":'+r.rev+',"seq":'+r.seq+',"del":'+(r.del?1:0)+',"d":'+(r.d||'null')+'}').join(',')+'],"seq":'+c.seq+',"cursor":'+last+',"more":'+((rows.length>=lim&&last<c.seq)?'true':'false')+',"canWrite":'+(canWrite(c)?'true':'false')+'}';
    return new Response(body,{status:200,headers:Object.assign({'content-type':'application/json; charset=utf-8','cache-control':'no-store'},H)})}
  if(route==='sync/push'){
    if(b.lic){const lic=await checkLic(b.lic,b.dev);if(lic.ok&&lic.exp>c.exp){c.exp=lic.exp;await db.prepare('UPDATE companies SET exp=? WHERE id=?').bind(lic.exp,cid).run()}}
    if(!canWrite(c))return J({err:'expired',msg:'انتهى اشتراك الشركة: المزامنة للقراءة فقط. جدّد الترخيص لمتابعة الرفع.',exp:c.exp},402);
    const ops=Array.isArray(b.ops)?b.ops:[];if(ops.length>MAX_OPS)return J({err:'big',msg:'عدد التغييرات في الطلب كبير.'},413);
    if(!ops.length)return J({ok:1,applied:[],conflicts:[],seq:c.seq});
    for(const o of ops){if(typeof o.l!=='string'||typeof o.k!=='string'||o.l.length>20||o.k.length>200)return J({err:'op'},400)}
    const n=ops.length,st=[db.prepare('UPDATE companies SET seq=seq+?1 WHERE id=?2 RETURNING seq').bind(n,cid)];
    ops.forEach((o,i)=>st.push(db.prepare("INSERT INTO records(cid,l,k,rev,seq,d,del) VALUES(?1,?2,?3,1,(SELECT seq FROM companies WHERE id=?1)-?4+?5,?6,?7) ON CONFLICT(cid,l,k) DO UPDATE SET rev=records.rev+1,seq=excluded.seq,d=excluded.d,del=excluded.del WHERE records.rev=?8")
      .bind(cid,o.l,o.k,n,i+1,o.del?null:JSON.stringify(o.d),o.del?1:0,o.br||0)));
    const res=await db.batch(st);const applied=[],bad=[];
    const after=res[0]&&res[0].results&&res[0].results[0]?res[0].results[0].seq:c.seq+n;
    ops.forEach((o,i)=>{const ch=res[i+1]&&res[i+1].meta?res[i+1].meta.changes:0;if(ch>0)applied.push({l:o.l,k:o.k,rev:(o.br||0)+1});else bad.push(o)});
    const conflicts=[];for(const o of bad){const r=await db.prepare('SELECT l,k,rev,seq,d,del FROM records WHERE cid=? AND l=? AND k=?').bind(cid,o.l,o.k).first();if(r)conflicts.push({l:r.l,k:r.k,rev:r.rev,seq:r.seq,del:r.del?1:0,d:r.d?JSON.parse(r.d):null})}
    return J({ok:1,applied,conflicts,before:after-n,after,seq:after})}
  return J({err:'route'},404)}
