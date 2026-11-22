ROOT='/home/claude/ashour/'
def rep(s,old,new):
    assert s.count(old)==1,(s.count(old),old[:80]); return s.replace(old,new)
def patch(s):
    s=rep(s,'من صفحة الرواتب ← ربط الحسابات.";const e=eom(PR.m),a=lockChk([e]);',
      'من صفحة الرواتب ← ربط الحسابات.";{const bad=PR.rows.find(r=>r.net<0||num(r.extra)<0||num(r.dedx)<0||num(r.basic)<0);if(bad)return $("#err").textContent="راجع الموظف «"+bad.name+"»: الصافي أو الإضافي أو الخصومات بالسالب."}const e=eom(PR.m),a=lockChk([e]);')
    return s
for sub in ('stores','accounting'):
    f=ROOT+sub+'/index.html';s=open(f,encoding='utf8').read();s=patch(s);open(f,'w',encoding='utf8').write(s);print(sub,len(s))
