ROOT='/home/claude/ashour/'
def rep(s,old,new):
    assert s.count(old)==1,(s.count(old),old[:80]); return s.replace(old,new)
def patch(s):
    s=rep(s,'if(!t.date)return e("التاريخ مطلوب.");const s=t.party?t.party.split(":"):[];',
      'if(!t.date)return e("التاريخ مطلوب.");if(t.inv){const iv=IX.doc.get(t.inv);if(!iv||"inv"!==iv.kind)return e("الفاتورة المرتبطة غير موجودة.");const D=DOCT[iv.t],want=D.sale?D.ret?"صرف":"قبض":D.ret?"قبض":"صرف";if(t.t!==want)return e("نوع السند لا يناسب هذه الفاتورة — المطلوب «سند "+want+"».");if(t.party!==D.pk+":"+iv.party)return e("طرف السند يختلف عن طرف الفاتورة المرتبطة.");const old=IX.doc.get(t.id),prev=old&&old.inv===t.inv?num(old.amt):0,room=r2(remOf(iv)+prev);if(r2(num(t.amt))>room+.005)return e("المبلغ أكبر من المتبقي على الفاتورة ("+fmt(Math.max(room,0))+").")}const s=t.party?t.party.split(":"):[];')
    s=rep(s,'if(a)return void($("#err").textContent="لا يمكن الحذف: "+a)}const e=S.docs.filter(e=>"vch"===e.kind&&e.inv===t.id);',
      'if(a)return void($("#err").textContent="لا يمكن الحذف: "+a);const rf=S.docs.filter(e=>"inv"===e.kind&&e.ref===t.id);if(rf.length)return void($("#err").textContent="لا يمكن الحذف: عليها "+rf.length+" مرتجع. احذف المرتجعات أولاً.")}const e=S.docs.filter(e=>"vch"===e.kind&&e.inv===t.id);')
    return s
for sub in ('stores','accounting'):
    f=ROOT+sub+'/index.html';s=open(f,encoding='utf8').read();s=patch(s);open(f,'w',encoding='utf8').write(s);print(sub,len(s))
