ROOT='/home/claude/ashour/'
SAFE=open('/home/claude/work/safety.js',encoding='utf8').read()
def rep(s,old,new):
    assert s.count(old)==1,(s.count(old),old[:80]); return s.replace(old,new)
def patch(s):
    s=rep(s,'!async function(){await Store.init();',SAFE+'\n!async function(){await Store.init();')
    s=rep(s,'خذ نسخة احتياطية من صفحة الإعدادات ثم أعد فتح البرنامج.")}','خذ نسخة احتياطية الآن ثم أعد فتح البرنامج.","تنزيل نسخة احتياطية الآن","backup")}')
    return s
for sub in ('stores','accounting'):
    f=ROOT+sub+'/index.html';s=open(f,encoding='utf8').read();s=patch(s);open(f,'w',encoding='utf8').write(s);print(sub,len(s))
