#!/usr/bin/env node
// استرجاع بيانات عميل من لقطات السيرفر بدون فتح البرنامج.
// الاستخدام:  node snap-fetch.mjs <رمز-المزامنة> [list | get <id> | latest] [--url https://zabtaha-app.pages.dev]
// الناتج: ملف JSON جاهز للاستيراد من الإعدادات ← استيراد/استرجاع نسخة احتياطية.
import fs from 'node:fs';import zlib from 'node:zlib';
const a=process.argv.slice(2);const code=a[0];let cmd=a[1]||'list',id=a[2];
const ui=a.indexOf('--url');const URLB=ui>0?a[ui+1]:'https://zabtaha-app.pages.dev';
if(!code){console.log('usage: node snap-fetch.mjs <sync-code> [list|get <id>|latest] [--url ...]');process.exit(1)}
const call=async(r,b)=>{const x=await fetch(URLB+'/api/sync/'+r,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({code},b))});const j=await x.json();if(!x.ok)throw new Error(j.msg||j.err||x.status);return j};
const L=(await call('snap/list',{})).snaps.filter(s=>s.complete);
if(cmd==='list'){L.forEach(s=>console.log(s.id,new Date(+s.id).toISOString(),Math.round((s.bytes||0)/1024)+'KB'));process.exit(0)}
if(cmd==='latest')id=L[0]&&L[0].id;if(!id){console.log('no snapshot');process.exit(1)}
const f=await call('snap/get',{id,part:1});let d=f.d;for(let i=2;i<=f.n;i++)d+=(await call('snap/get',{id,part:i})).d;
const buf=Buffer.from(d.slice(3),'base64');const txt=d.startsWith('G1:')?zlib.gunzipSync(buf).toString('utf8'):buf.toString('utf8');
JSON.parse(txt);const out='backup-'+id+'.json';fs.writeFileSync(out,txt);console.log('saved',out,Math.round(txt.length/1024)+'KB');
