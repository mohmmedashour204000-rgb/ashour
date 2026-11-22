#!/usr/bin/env bash
# Build both editions from dev/src. Needs: node + terser (npm i terser). Usage: dev/build.sh
set -e
D="$(cd "$(dirname "$0")" && pwd)"; R="$D/.."
T="${TERSER:-terser}"
$T "$D/src/app.js" -c -m -o /tmp/zb_app.min.js
python3 - "$D" "$R" <<'P'
import sys,hashlib,re
D,R=sys.argv[1],sys.argv[2]
h=open(D+'/src/head.html',encoding='utf8').read()
t=open(D+'/src/tail.html',encoding='utf8').read()
j=open('/tmp/zb_app.min.js',encoding='utf8').read()
assert '</script' not in j.lower()
out=h+j+t
for ed in ('stores','accounting'):
    open(f'{R}/{ed}/index.html','w',encoding='utf8').write(out)
    p=f'{R}/{ed}/sw.js'; s=open(p,encoding='utf8').read()
    n="zabtaha-"+hashlib.sha1(out.encode()).hexdigest()[:10]
    s=re.sub(r"const C='zabtaha-[^']*'","const C='"+n+"'",s,1)
    open(p,'w',encoding='utf8').write(s)
print('built',len(out),'bytes')
P
