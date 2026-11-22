const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs'),path=require('path');
const ROOT=process.env.ROOT||'/home/claude/ashour';
const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.webmanifest':'application/manifest+json','.txt':'text/plain'};
exports.open = async (sub='stores/', api=null) => {
  const b = await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
  const ctx = await b.newContext({serviceWorkers:'block',viewport:{width:1200,height:800}});
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|Failed to load resource/.test(m.text()))errs.push(m.text())});
  await ctx.route('https://app.test/**',async r=>{
    const u=new URL(r.request().url());
    if(u.pathname.startsWith('/api/')){if(api){const x=await api(u.pathname,r.request().postData()||'');return r.fulfill({status:x.status,contentType:'application/json',body:x.body})}return r.abort('internetdisconnected')}   // offline unless a test passes the real server function   // offline, as a client without network
    let f=path.join(ROOT,decodeURIComponent(u.pathname));
    if(f.endsWith('/'))f+='index.html';
    if(!fs.existsSync(f))return r.fulfill({status:404,body:''});
    r.fulfill({status:200,contentType:MIME[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)});
  });
  await p.goto('https://app.test/'+sub);
  await p.waitForTimeout(800);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/بداية جديدة/.test(x.textContent));b&&b.click()});
  await p.waitForTimeout(300);
  return {b,p,errs};
};
