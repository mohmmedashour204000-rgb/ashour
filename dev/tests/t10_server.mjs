// Server snapshot routes against an in-memory SQLite shim of D1
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
fs.copyFileSync(new URL('../../functions/api/[[path]].js',import.meta.url),'/tmp/api_under_test.mjs');
const {onRequest}=await import('/tmp/api_under_test.mjs');
const sq=new DatabaseSync(':memory:');
const mk=(sql)=>{let a=[];const o={bind(...x){a=x;return o},async run(){const r=sq.prepare(sql).run(...a);return{meta:{changes:r.changes}}},async first(){return sq.prepare(sql).get(...a)||null},async all(){return{results:sq.prepare(sql).all(...a)}},_r:()=>sq.prepare(sql).all(...a),_run:()=>sq.prepare(sql).run(...a)};return o};
const DB={prepare:mk,async batch(st){const out=[];for(const s of st){if(/^\s*(SELECT|.*RETURNING)/is.test(s._sql||''))out.push({});out.push(null)};return st.map(s=>{try{const q=s._r();return{results:q,meta:{changes:q.length}}}catch(e){try{const r=s._run();return{results:[],meta:{changes:r.changes}}}catch(e2){throw e2}}})}};
// make prepare remember sql
const _p=DB.prepare;DB.prepare=(sql)=>{const o=_p(sql);o._sql=sql;return o};
// DB.batch must run statements either as read or write; node:sqlite .all works for DML too (returns []) so use _r except changes
DB.batch=async(st)=>st.map(s=>{const stmt=s;try{const r=s._r();return{results:r,meta:{changes:r.length||0}}}catch(e){throw e}});
const code='TESTCODE-0123456789ABCDEF';
const cid=createHash('sha256').update(code).digest('hex').slice(0,32);
const call=async(route,body)=>{const r=await onRequest({request:new Request('https://x/api/'+route,{method:'POST',body:JSON.stringify(body)}),env:{DB}});return {s:r.status,j:await r.json()}};
await call('ping',{});
await call('sync/status',{code}); // triggers ensure
sq.prepare("INSERT INTO companies(id,name,seq,next_dev,exp,created) VALUES(?,?,0,2,?,?)").run(cid,'T','2099-01-01',Date.now());
const out={};
const put=(id,part,n,d,x)=>call('sync/snap/put',Object.assign({code,id,part,n,d},x||{}));
out.bad=[(await put('abc',1,1,'x')).s,(await put('1700000000000',2,1,'x')).s,(await put('1700000000000',1,1,'')).s,(await put('1700000000000',1,41,'x')).s];
out.big=(await put('1700000000000',1,1,'a'.repeat(702000))).s;
for(let i=0;i<13;i++){const id=String(1700000000000+i);await put(id,1,2,'part1-'+i);await put(id,2,2,'part2-'+i)}
await put('1700000009999',1,3,'orphan');// incomplete, fresh
const L=(await call('sync/snap/list',{code})).j;
out.count=L.snaps.length;out.newest=L.snaps[0].id;out.allComplete=L.snaps.filter(s=>s.complete).length;out.incompleteKept=L.snaps.some(s=>!s.complete);
const g=await call('sync/snap/get',{code,id:'1700000000012',part:2});out.get=g.j.d;
out.getMissing=(await call('sync/snap/get',{code,id:'1700000000000',part:1})).s;
out.wrongCode=(await call('sync/snap/list',{code:'WRONGCODE-0123456789ABCDEF'})).s;
sq.prepare("UPDATE companies SET exp='2000-01-01' WHERE id=?").run(cid);
out.expiredPut=(await put('1700000020000',1,1,'x')).s;out.expiredRead=(await call('sync/snap/list',{code})).s;
console.log(JSON.stringify(out,null,1));
