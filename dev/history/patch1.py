import sys,re
ROOT='/home/claude/ashour/'
def rep(s,old,new):
    assert s.count(old)==1,(s.count(old),old[:70])
    return s.replace(old,new)
HELP='''function zbTomorrow(){const d=new Date();d.setDate(d.getDate()+1);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function zbLeafErr(c){const x=IX.acc.get(c);if(!x)return"الحساب غير موجود.";if(x.level&&x.level!=="تفصيلي"||S.accounts.some(y=>y.parent===c))return"الحساب «"+x.name+"» حساب رئيسي أو فرعي — اختر حساباً تفصيلياً للترحيل.";return""}
function zbRetFree(t){const T=DOCT[t.t];if(!T.ret||t.ref)return"";const base="مرتجع بيع"===t.t?"بيع":"شراء",sold=new Map,ret=new Map;S.docs.forEach(d=>{if("inv"!==d.kind||d.party!==t.party||d.id===t.id)return;const m=d.t===base?sold:d.t===t.t?ret:null;m&&d.lines.forEach(l=>{l.item&&m.set(l.item,(m.get(l.item)||0)+num(l.qty)*(num(l.uf)||1))})});const want=new Map;t.lines.forEach(l=>{l.item&&num(l.qty)>0&&want.set(l.item,(want.get(l.item)||0)+num(l.qty)*(num(l.uf)||1))});for(const[i,q]of want){const ok=(sold.get(i)||0)-(ret.get(i)||0);if(q>ok+5e-4)return"الكمية المرتجعة من «"+nm("it",i)+"» ("+fq(q)+") أكبر من المباع لهذا "+("مرتجع بيع"===t.t?"العميل":"المورد")+" بعد خصم مرتجعاته السابقة ("+fq(Math.max(ok,0))+"). اربط المرتجع بالفاتورة الأصلية أو سجّل الفاتورة القديمة أولاً."}return""}
'''
def patch(s):
    # journal entry
    s=rep(s,'function saveEntry(t){',HELP+'function saveEntry(t){')
    s=rep(s,'if(!t.a)return a("اختر الحساب لكل سطر فيه مبلغ.");const e=num(t.d),s=num(t.c);',
      'if(!t.a)return a("اختر الحساب لكل سطر فيه مبلغ.");{const q=zbLeafErr(t.a);if(q)return a(q)}if(num(t.d)>=1e12||num(t.c)>=1e12)return a("المبلغ كبير بشكل غير منطقي.");const e=num(t.d),s=num(t.c);')
    s=rep(s,'if(Math.abs(c-o)>.005&&!t)return a("القيد غير متزن: الفرق "+fmt(c-o)+". صحّح المبالغ، أو اضغط «حفظ القيد» مرة ثانية لحفظه كما هو."),void(e.warned=!0);',
      'if(Math.abs(c-o)>.005)return a("القيد غير متزن: الفرق "+fmt(c-o)+". لازم المدين يساوي الدائن قبل الحفظ.");')
    # documents
    s=rep(s,'if(!t.date)return n("التاريخ مطلوب.");','if(!t.date)return n("التاريخ مطلوب.");if(t.date>zbTomorrow())return n("تاريخ الفاتورة في المستقبل — راجع التاريخ.");')
    s=rep(s,'{const e=retPrep(t);if(e)return n(e)}','{const e=retPrep(t);if(e)return n(e)}{const e=zbRetFree(t);if(e)return n(e)}')
    s=rep(s,'if(o.total<=0)return n("إجمالي المستند يجب أن يكون أكبر من صفر.");','if(o.total<=0)return n("إجمالي المستند يجب أن يكون أكبر من صفر.");if(o.total>=1e12)return n("إجمالي المستند كبير بشكل غير منطقي.");')
    s=rep(s,'function saveDoc(){const t=commitDoc(DD);t.err?$("#err").textContent=t.err:(closeModal(),render(),toast("تم حفظ "+docLabel(t.doc)+" وإنشاء القيد "+t.doc.je))}',
      'function saveDoc(){const t=commitDoc(DD);if(t.err){$("#err").textContent=t.err;return}closeModal(),render();let w="";try{if(DOCT[t.doc.t].sale&&!DOCT[t.doc.t].ret){const b=t.doc.lines.filter(l=>l.item&&IX.it.get(l.item)&&num(l.price)/(num(l.uf)||1)<num(IX.it.get(l.item).cost)-.005).map(l=>nm("it",l.item));b.length&&(w=" — تنبيه: بيع بأقل من التكلفة: "+b.join("، "))}}catch(e){}toast("تم حفظ "+docLabel(t.doc)+" وإنشاء القيد "+t.doc.je+w)}')
    # items
    s=rep(s,'if(s.u2&&!(s.f2>1)||s.u3&&!(s.f3>1))return n("حدّد كم وحدة أساسية داخل الوحدة الأكبر (أكبر من 1).");',
      'if(s.cost<0||s.price<0||s.min<0)return n("سعر الشراء والبيع وحد إعادة الطلب لا تكون سالبة.");if(s.cost>=1e9||s.price>=1e9)return n("السعر كبير بشكل غير منطقي.");if(s.f2>1&&!s.u2||s.f3>1&&!s.u3)return n("اكتب اسم الوحدة الأكبر (كرتونة مثلاً) بجانب عدد الوحدات.");if(s.u2&&!(s.f2>1)||s.u3&&!(s.f3>1))return n("حدّد كم وحدة أساسية داخل الوحدة الأكبر (أكبر من 1).");')
    return s
for sub in ('stores','accounting'):
    f=ROOT+sub+'/index.html';s=open(f,encoding='utf8').read();s=patch(s);open(f,'w',encoding='utf8').write(s);print(sub,'patched',len(s))
