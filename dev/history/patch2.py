import re
ROOT='/home/claude/ashour/'
def rep(s,old,new):
    assert s.count(old)==1,(s.count(old),old[:80]); return s.replace(old,new)
def patch(s):
    # 1) home: no country card
    s=rep(s,'VIEWS.home=()=>(S.meta.country?"":countryCard())+t()','VIEWS.home=()=>t()')
    # 2) startup banner -> one-time guided jump to settings (only brand-new company, no transactions)
    i=s.index('function cpickShow(){');j=s.index('window.countryCard=()=>{')
    s=s[:i]+'''function zbHasTx(){return S.docs.length>0||S.journal.length>0||S.moves.length>0}
function cpickShow(){if(S.meta.country||"mem"===Store.kind)return;try{if(sessionStorage.getItem("zb_cpl"))return;sessionStorage.setItem("zb_cpl","1")}catch(t){}if(window.bkAllowed&&!bkAllowed())return;if(zbHasTx())return;go("setup"),toast("أول خطوة لتأسيس الشركة: اختر بلد النشاط لضبط العملة والضريبة (مرة واحدة).")}'''+s[j:]
    # 3) country card in settings: choose once, lock after first transaction
    i=s.index('window.countryCard=()=>{');j=s.index(',window.cpickShow=cpickShow')
    card='''window.countryCard=()=>{const t=S.meta.country||"",L=!!t&&zbHasTx(),e=(e,a)=>'<button class="btn'+(t===e?" pri":"")+'" data-act="cpick" data-c="'+e+'"'+(L?" disabled":"")+">"+a+"</button>";return'<div class="card"><h3>بلد النشاط والعملة والضريبة</h3><p class="note">العملة: <b>'+esc(S.meta.cur||"غير محددة")+"</b> · البلد: <b>"+("EG"===t?"مصر":"SA"===t?"السعودية":"غير محدد")+"</b>"+(S.meta.vat?" · ضريبة القيمة المضافة "+esc(S.meta.vat)+"%":"")+"</p>"+(L?'<p class="note">تم ضبط البلد عند تأسيس الشركة، ولا يمكن تغييره بعد بدء تسجيل الفواتير والقيود حفاظاً على سلامة الحسابات.</p>':'<p class="note">تُختار مرة واحدة عند تأسيس الشركة، وتتقفل بعد أول فاتورة أو قيد.</p><div class="bar">'+e("EG","مصر — ج.م · 14%")+e("SA","السعودية — ر.س · 15%")+'</div><div class="form"><label>عملة أخرى أو مخصصة<input data-meta="cur" list="curs" value="'+esc(S.meta.cur||"")+'" placeholder="مثال: د.إ أو $"><datalist id="curs">'+["ج.م","ر.س","د.إ","د.ك","ر.ق","د.ب","ر.ع","د.أ","$","€"].map(t=>'<option value="'+t+'">').join("")+"</datalist></label></div>")+"</div>"}'''
    s=s[:i]+card+s[j:]
    # 4) guard the pick action
    s=rep(s,'A.cpick=t=>{const e=t.dataset.c;','A.cpick=t=>{const e=t.dataset.c;if(S.meta.country&&zbHasTx())return void toast("البلد مقفول بعد بدء التسجيل.");')
    # 5) remove the duplicate country selector from print settings
    a='<label>الدولة / نظام الضريبة<select data-meta="country">';i=s.index(a);assert s.count(a)==1
    e='</select></label>"+';j=s.index(e,i);assert j-i<900,(j-i)
    s=s[:i-1]+s[j+len(e):]   # drop the opening quote before <label> and the trailing +
    return s
for sub in ('stores','accounting'):
    f=ROOT+sub+'/index.html';s=open(f,encoding='utf8').read();s=patch(s);open(f,'w',encoding='utf8').write(s);print(sub,len(s))
