/* Zabtaha sync API - Cloudflare Pages Function + D1 (binding name: DB)
   POST /api/ping | /api/sync/{init,join,push,pull,status}
   A company is identified by SHA-256(sync code); the code itself is never stored. */
const PUB={"kty":"EC","crv":"P-256","x":"2iMXRKPeHcTUdihK4uPe5fq8g5M_xTYNNxJ1UzYxJUA","y":"mRQN8msU0ZWN-v30Mg1dXwlBgOvSQZymS5lQJt5vHyw"};
const GRACE_DAYS=14,MAX_OPS=200,MAX_PULL=400,SNAP_KEEP=10,SNAP_PART=700000,SNAP_MAXN=40;
const H={'access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization','access-control-allow-methods':'POST,OPTIONS','access-control-max-age':'86400'};
const J=(o,s)=>new Response(JSON.stringify(o),{status:s||200,headers:Object.assign({'content-type':'application/json; charset=utf-8','cache-control':'no-store'},H)});
let READY=false;
async function ensure(db){if(READY)return;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS companies(id TEXT PRIMARY KEY,name TEXT,seq INTEGER NOT NULL DEFAULT 0,next_dev INTEGER NOT NULL DEFAULT 2,exp TEXT NOT NULL DEFAULT '',created INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS records(cid TEXT NOT NULL,l TEXT NOT NULL,k TEXT NOT NULL,rev INTEGER NOT NULL,seq INTEGER NOT NULL,d TEXT,del INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(cid,l,k))"),
    db.prepare("CREATE INDEX IF NOT EXISTS rec_seq ON records(cid,seq)"),
    db.prepare("CREATE TABLE IF NOT EXISTS devices(dev TEXT PRIMARY KEY,first INTEGER NOT NULL,last INTEGER NOT NULL,opens INTEGER NOT NULL DEFAULT 1,ed TEXT,ver TEXT,lic TEXT,licn TEXT,exp TEXT,fp TEXT,iph TEXT)"),
    db.prepare("CREATE INDEX IF NOT EXISTS dev_fp ON devices(fp,iph)"),
    db.prepare("CREATE TABLE IF NOT EXISTS revoked(h TEXT PRIMARY KEY,at INTEGER,note TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS snaps(cid TEXT NOT NULL,id TEXT NOT NULL,part INTEGER NOT NULL,n INTEGER NOT NULL,d TEXT NOT NULL,at INTEGER NOT NULL,sz INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(cid,id,part))")]);
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
  if(route==='lic/hello'){
    const dev=String(b.dev||'');if(!/^[A-Z0-9]{10}$/.test(dev))return J({err:'dev'},400);
    const now=Date.now(),fp=String(b.fp||'').replace(/[^a-f0-9]/g,'').slice(0,24),ed=String(b.ed||'').slice(0,5),ver=String(b.ver||'').slice(0,16);
    const iph=(await sha('ip|'+(request.headers.get('cf-connecting-ip')||''))).slice(0,16);
    let lh='',licn='',exp='';
    if(b.lic){const L=await checkLic(b.lic,dev);if(L.ok){lh=(await sha(String(b.lic).replace(/\s+/g,''))).slice(0,16);licn=String(L.name||'').slice(0,60);exp=L.exp||''}}
    await db.prepare("INSERT INTO devices(dev,first,last,opens,ed,ver,lic,licn,exp,fp,iph) VALUES(?1,?2,?2,1,?3,?4,?5,?6,?7,?8,?9) ON CONFLICT(dev) DO UPDATE SET last=?2,opens=opens+1,ed=?3,ver=?4,lic=?5,licn=?6,exp=?7,fp=?8,iph=?9").bind(dev,now,ed,ver,lh,licn,exp,fp,iph).run();
    const me=await db.prepare('SELECT first FROM devices WHERE dev=?').bind(dev).first();
    let first=me?me.first:now;
    if(fp){const o=await db.prepare('SELECT MIN(first) f FROM devices WHERE fp=?1 AND iph=?2 AND lic=\'\'').bind(fp,iph).first();if(o&&o.f&&o.f<first)first=o.f}
    const rv=lh?await db.prepare('SELECT 1 x FROM revoked WHERE h=?').bind(lh).first():null;
    return J({ok:1,t:now,first,rev:rv?1:0})}
  if(route.startsWith('admin/')){
    const ts=+b.ts||0;if(Math.abs(Date.now()-ts)>10*60*1000)return J({err:'ts'},401);
    const msg=route==='admin/revoke'||route==='admin/unrevoke'?route+':'+String(b.h||'')+':'+ts:route+':'+ts;
    let good=false;try{const k=await crypto.subtle.importKey('jwk',PUB,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);good=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},k,b64u(String(b.sig||'')),new TextEncoder().encode(msg))}catch(e){}
    if(!good)return J({err:'auth'},401);
    const day=864e5,now=Date.now(),q=(sql,...a)=>db.prepare(sql).bind(...a).first();
    if(route==='admin/revoke'||route==='admin/unrevoke'){const h=String(b.h||'').replace(/[^a-f0-9]/g,'').slice(0,16);if(h.length!==16)return J({err:'h'},400);
      if(route==='admin/revoke')await db.prepare('INSERT OR REPLACE INTO revoked(h,at,note) VALUES(?,?,?)').bind(h,now,String(b.note||'').slice(0,80)).run();else await db.prepare('DELETE FROM revoked WHERE h=?').bind(h).run();return J({ok:1})}
    if(route==='admin/stats'){
      const n=async(w,...a)=>(await q('SELECT COUNT(*) n FROM devices'+(w?' WHERE '+w:''),...a)).n;
      const byDay=(await db.prepare("SELECT strftime('%Y-%m-%d',first/1000,'unixepoch') d,COUNT(*) n FROM devices WHERE first>?1 GROUP BY d ORDER BY d DESC").bind(now-14*day).all()).results||[];
      const lic=(await db.prepare("SELECT dev,lic,licn,exp,ed,last,opens,first FROM devices WHERE lic!='' ORDER BY last DESC LIMIT 300").all()).results||[];
      const rev=new Set(((await db.prepare('SELECT h FROM revoked').all()).results||[]).map(r=>r.h));
      const cos=await q('SELECT COUNT(*) n FROM companies');
      return J({ok:1,total:await n(),real:await n('opens>=2'),active7:await n('last>?',now-7*day),active30:await n('last>?',now-30*day),licensed:await n("lic!=''"),trial:await n("lic=''"),acc:await n("ed='acc'"),pos:await n("ed='pos'"),new7:await n('first>?',now-7*day),companies:cos.n,byDay,licenses:lic.map(r=>Object.assign({},r,{revoked:rev.has(r.lic)}))})}
    return J({err:'route'},404)}
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
  /* Full-data snapshots (gzip+base64 chunks). Reading is always allowed (even after expiry) so a customer can get their data back; writing needs a live subscription. */
  if(route==='sync/snap/put'){
    if(!canWrite(c))return J({err:'expired',msg:'انتهى اشتراك الشركة: لا يمكن رفع نسخ جديدة.',exp:c.exp},402);
    const id=String(b.id||''),part=+b.part,n=+b.n,d=b.d;
    if(!/^\d{13}$/.test(id)||!(n>=1&&n<=SNAP_MAXN)||!Number.isInteger(part)||part<1||part>n||typeof d!=='string'||!d.length||d.length>SNAP_PART+1000)return J({err:'snap',msg:'بيانات النسخة غير صحيحة.'},400);
    await db.prepare('INSERT OR REPLACE INTO snaps(cid,id,part,n,d,at,sz) VALUES(?1,?2,?3,?4,?5,?6,?7)').bind(cid,id,part,n,d,Date.now(),Math.max(0,+b.sz||0)).run();
    if(part===n){
      const rows=(await db.prepare('SELECT id,n,COUNT(*) c,MAX(at) at FROM snaps WHERE cid=? GROUP BY id ORDER BY id DESC').bind(cid).all()).results||[];
      let kept=0;for(const r of rows){const full=r.c===r.n;
        if(full&&kept<SNAP_KEEP){kept++;continue}
        if(full||Date.now()-r.at>36e5)await db.prepare('DELETE FROM snaps WHERE cid=? AND id=?').bind(cid,r.id).run()}}
    return J({ok:1})}
  if(route==='sync/snap/list'){
    const rows=(await db.prepare('SELECT id,n,COUNT(*) c,MAX(at) at,MAX(sz) sz,SUM(LENGTH(d)) bytes FROM snaps WHERE cid=? GROUP BY id ORDER BY id DESC LIMIT 30').bind(cid).all()).results||[];
    return J({ok:1,snaps:rows.map(r=>({id:r.id,n:r.n,parts:r.c,complete:r.c===r.n,at:r.at,sz:r.sz,bytes:r.bytes}))})}
  if(route==='sync/snap/get'){
    const id=String(b.id||''),part=+b.part||1;
    const r=await db.prepare('SELECT d,n FROM snaps WHERE cid=?1 AND id=?2 AND part=?3').bind(cid,id,part).first();
    if(!r)return J({err:'nosnap',msg:'النسخة غير موجودة.'},404);
    return J({ok:1,d:r.d,n:r.n,part})}
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
