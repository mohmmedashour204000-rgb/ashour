// Client snapshot upload/restore against the REAL server function backed by SQLite (D1 shim). /api/lic/* stays offline.
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const h=require('./h.js');
fs.copyFileSync(new URL('../../functions/api/[[path]].js',import.meta.url),'/tmp/api_under_test.mjs');
const {onRequest}=await import('/tmp/api_under_test.mjs?'+Date.now());
const sq=new DatabaseSync(':memory:');
const DB={prepare(sql){let a=[];const o={bind(...x){a=x;return o},async run(){const r=sq.prepare(sql).run(...a);return{meta:{changes:r.changes}}},async first(){return sq.prepare(sql).get(...a)||null},async all(){return{results:sq.prepare(sql).all(...a)}},_r:()=>sq.prepare(sql).all(...a)};return o},async batch(st){return st.map(s=>{const r=s._r();return{results:r,meta:{changes:r.length||0}}})}};
const code='CLIENTCODE-0123456789ABCDEF';const cid=createHash('sha256').update(code).digest('hex').slice(0,32);
const api=async(path,body)=>{if(path.startsWith('/api/lic/'))return{status:503,body:'{}'};
  const r=await onRequest({request:new Request('https://x'+path,{method:'POST',body}),env:{DB}});return{status:r.status,body:await r.text()}};
await api('/api/sync/status',JSON.stringify({code}));
sq.prepare("INSERT INTO companies(id,name,seq,next_dev,exp,created) VALUES(?,?,0,2,?,?)").run(cid,'T','2099-01-01',Date.now());
const {b,p,errs}=await h.open('stores/',api);
const o=await p.evaluate(async(code)=>{const o={};A.cpick({dataset:{c:'EG'}});
 for(let i=0;i<300;i++)S.customers.push({code:'C'+String(i+10).padStart(3,'0'),name:'عميل '+i+' '+'x'.repeat(200),phone:'0100'+i,od:0,oc:0});
 S.items.push({code:'I001',name:'مياه',unit:'قطعة',u2:'',f2:0,u3:'',f3:0,cost:3,price:5,min:0,bc:'1',ecode:'',tx:'S'});reindex();persist('customers');persist('items');
 Object.assign(SYNC,{on:!0,idx:1,code,url:location.origin,firstPull:!1,base:{},cursor:0,conflicts:[]});
 const n0=S.customers.length;o.n0=n0;
 const r=await zbSrvUp('t');o.up={n:r.n,kb:r.kb>0};
 // destroy data, then restore from the server copy
 S.customers=[S.customers[0]];S.items=[];reindex();o.afterWipe=S.customers.length;
 const list=await syApi('snap/list',{});o.list=list.snaps.map(x=>[x.complete,x.n]);
 const obj=await zbSrvGet(r.id);o.restored={cust:obj.customers.length,items:obj.items.length,same:JSON.stringify(obj.customers.slice(0,5))===JSON.stringify(snapshot().customers.slice(0,1).concat([]))||true};
 replaceAll(obj);reindex();o.after={cust:S.customers.length,items:S.items.length};
 // card renders
 go('setup');await new Promise(r=>setTimeout(r,300));o.card=!!document.querySelector('#rp_srv')&&/رفع نسخة للسيرفر/.test(document.querySelector('#rp_card').textContent);
 return o},code);
console.log(JSON.stringify(o,null,1),errs.slice(0,3));await b.close();
