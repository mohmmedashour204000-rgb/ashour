/* ===== حماية البيانات والاستقرار: نقاط استرجاع تلقائية + منع الانهيار + حماية النوافذ المتعددة + فحص السلامة ===== */
(function () {
  const SNK = "snaps",
    ERRK = "errlog",
    errs = [];
  let lastSnap = 0,
    dirty = 0,
    lastToast = 0,
    snapQ = Promise.resolve();
  const isLocal = () => "local" === Store.kind;
  /* ---------- تسجيل الأخطاء ---------- */
  function logErr(e, where) {
    try {
      const rec = {
        t: new Date().toISOString(),
        w: where || "",
        m: String((e && e.message) || e || "خطأ").slice(0, 300),
        s: String((e && e.stack) || "").slice(0, 700),
        v: location.pathname + location.hash,
      };
      errs.push(rec);
      errs.length > 30 && errs.shift();
      isLocal() && KV.set(ERRK, errs.slice()).catch(() => {});
    } catch (x) {}
  }
  function notify() {
    if (Date.now() - lastToast < 8000) return;
    lastToast = Date.now();
    try {
      toast(
        "حصل خطأ غير متوقع. بياناتك المحفوظة سليمة. لو اتكرر، ابعت «تقرير الأخطاء» من الإعدادات.",
      );
    } catch (x) {}
  }
  window.addEventListener("error", (ev) => {
    if (!ev || (!ev.error && !ev.message)) return;
    if (/ResizeObserver|^Script error/i.test(ev.message || "")) return;
    if (ev.filename && ev.filename.indexOf(location.origin) !== 0) return;
    logErr(ev.error || ev.message, "js");
    notify();
  });
  window.addEventListener("unhandledrejection", (ev) => {
    logErr(ev && ev.reason, "promise");
    notify();
  });
  /* ---------- شاشة بديلة بدل الانهيار ---------- */
  function fallback(e) {
    return (
      '<div class="card"><h3>تعذّر عرض هذه الشاشة</h3><p class="note">بياناتك محفوظة ولم تتأثر. ارجع للرئيسية أو نزّل نسخة احتياطية، ولو الخطأ اتكرر ابعت «تقرير الأخطاء» من الإعدادات.</p><div class="bar"><a class="btn pri" href="#home">الرئيسية</a><button class="btn" data-act="backup">تنزيل نسخة احتياطية</button></div><p class="note">' +
      esc(String((e && e.message) || e).slice(0, 140)) +
      "</p></div>"
    );
  }
  /* ---------- نقاط الاسترجاع ---------- */
  async function gz(str) {
    if (typeof CompressionStream === "function")
      try {
        const cs = new CompressionStream("gzip"),
          w = cs.writable.getWriter();
        w.write(new TextEncoder().encode(str));
        w.close();
        return { gz: 1, b: await new Response(cs.readable).arrayBuffer() };
      } catch (e) {}
    return { gz: 0, b: str };
  }
  async function ungz(o) {
    if (!o.gz) return o.b;
    const ds = new DecompressionStream("gzip"),
      w = ds.writable.getWriter();
    w.write(o.b);
    w.close();
    return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer());
  }
  const hasData = () =>
    S.docs.length ||
    S.journal.length ||
    S.items.length ||
    S.customers.length > 1 ||
    S.suppliers.length ||
    S.emps.length;
  function saveSnap(json, why) {
    if (!isLocal()) return Promise.resolve();
    const co = S.meta.company || "";
    snapQ = snapQ
      .then(async () => {
        const ts = Date.now(),
          key = "snap:" + ts;
        await KV.set(key, await gz(json));
        let idx = (await KV.get(SNK)) || [];
        idx.unshift({ k: key, t: ts, n: json.length, why: why || "تلقائي", co });
        const keepA = idx.filter((x) => "تلقائي" === x.why).slice(0, 8),
          keepM = idx.filter((x) => "تلقائي" !== x.why).slice(0, 12),
          keep = new Set(keepA.concat(keepM).map((x) => x.k));
        for (const x of idx) keep.has(x.k) || (await KV.set(x.k, void 0));
        idx = idx.filter((x) => keep.has(x.k));
        await KV.set(SNK, idx);
        lastSnap = ts;
        dirty = 0;
      })
      .catch((e) => logErr(e, "snapshot"));
    return snapQ;
  }
  function snapNow(why) {
    return hasData() ? saveSnap(JSON.stringify(snapshot()), why) : Promise.resolve();
  }
  window.zbSnapNow = snapNow;
  /* قراءة قاعدة البيانات كما هي مخزّنة (بدون المساس بالكاش) */
  function rawRead() {
    return new Promise((res, rej) => {
      const t = {},
        s = Store.idb.transaction("book").objectStore("book").openCursor();
      s.onsuccess = () => {
        const c = s.result;
        c ? ((t[c.key] = c.value), c.continue()) : res(t);
      };
      s.onerror = () => rej(s.error);
    });
  }
  async function rawSnap(why) {
    const raw = await rawRead();
    if (!raw.meta) return;
    const e = { meta: raw.meta };
    LISTS.forEach((a) => {
      e[a] = [];
      for (let s = 0; raw[a + "_" + s]; s++) e[a] = e[a].concat(raw[a + "_" + s].rows || []);
    });
    await saveSnap(JSON.stringify(e), why);
  }
  /* ---------- حماية الكتابة من نافذة قديمة + عدّاد التعديلات ---------- */
  const _put = Store.put;
  Store.put = function (t, e) {
    dirty++;
    if (isLocal() && Tabs.stale && !this._cs) {
      this._cs = 1;
      this.q = this.q
        .then(() => rawSnap("تعديلات نافذة أخرى (قبل الكتابة فوقها)"))
        .catch((x) => logErr(x, "stale-snap"));
      try {
        toast(
          "فيه نافذة تانية للبرنامج مفتوحة عدّلت بيانات. حفظنا نسخة منها في «نقاط الاسترجاع». الأفضل تشتغل من نافذة واحدة.",
        );
      } catch (x) {}
    }
    return _put.call(this, t, e);
  };
  setInterval(() => {
    Tabs.stale || (Store._cs = 0);
  }, 3000);
  /* ---------- نقطة استرجاع قبل أي استبدال كامل (استرجاع / مسح / استيراد) ---------- */
  const _ra = replaceAll;
  replaceAll = function (t) {
    try {
      hasData() && snapNow("قبل استبدال البيانات (استرجاع / مسح / استيراد)");
    } catch (x) {}
    return _ra.apply(this, arguments);
  };
  /* ---------- جدولة النقاط التلقائية ---------- */
  async function autoSnap(force) {
    if (!isLocal() || !hasData()) return;
    const idx = (await KV.get(SNK).catch(() => null)) || [],
      last = idx.length ? idx[0].t : 0;
    lastSnap = Math.max(lastSnap, last);
    const age = Date.now() - lastSnap;
    (age > 20 * 36e5 || (force && dirty > 0 && age > 20 * 6e4) || (dirty > 0 && age > 2 * 36e5)) &&
      (await snapNow("تلقائي"));
  }
  setTimeout(() => autoSnap(), 6000);
  setInterval(() => autoSnap(), 10 * 6e4);
  document.addEventListener("visibilitychange", () => {
    document.hidden && autoSnap(!0);
  });
  /* ---------- فحص سلامة البيانات ---------- */
  function health() {
    const out = [],
      add = (lv, t, d) => out.push({ lv, t, d: d || "" });
    const by = new Map();
    S.journal.forEach((j) => {
      const k = String(j.no),
        o = by.get(k) || { d: 0, c: 0 };
      ((o.d += num(j.d)), (o.c += num(j.c)), by.set(k, o));
    });
    const ub = [...by].filter(([k, o]) => Math.abs(o.d - o.c) > 0.01);
    ub.length &&
      add("bad", "قيود غير متزنة: " + ub.length, ub.slice(0, 5).map(([k, o]) => "قيد " + k + " (الفرق " + fmt(o.d - o.c) + ")").join("، "));
    const na = [...new Set(S.journal.filter((j) => !IX.acc.get(j.a)).map((j) => j.a))];
    na.length && add("bad", "قيود على حسابات غير موجودة: " + na.length, na.slice(0, 6).join("، "));
    const dc = new Set(S.journal.map((j) => j.dc).filter(Boolean)),
      noJe = S.docs.filter((d) => !dc.has(d.id));
    noJe.length && add("bad", "مستندات بدون قيد محاسبي: " + noJe.length, noJe.slice(0, 5).map((d) => docLabel(d)).join("، "));
    const orphJe = [...dc].filter((id) => !IX.doc.get(id));
    orphJe.length && add("warn", "قيود مرتبطة بمستند محذوف: " + orphJe.length);
    const miss = [];
    S.docs.forEach((d) => {
      if ("inv" === d.kind) {
        const pk = DOCT[d.t] && DOCT[d.t].pk;
        pk && d.party && !IX[pk].get(d.party) && miss.push(docLabel(d) + " (طرف محذوف)");
        (d.lines || []).forEach((l) => l.item && !IX.it.get(l.item) && miss.push(docLabel(d) + " (صنف محذوف " + l.item + ")"));
      }
    });
    miss.length && add("bad", "مستندات تشير لأطراف أو أصناف غير موجودة: " + miss.length, miss.slice(0, 5).join("، "));
    const dup = new Map();
    S.docs.forEach((d) => {
      const k = d.t + "-" + d.no;
      dup.set(k, (dup.get(k) || 0) + 1);
    });
    const dd = [...dup].filter(([k, n]) => n > 1);
    dd.length && add("bad", "أرقام مستندات مكررة: " + dd.length, dd.slice(0, 6).map(([k]) => k).join("، "));
    const bm = S.moves.filter((m) => !IX.it.get(m.item));
    bm.length && add("bad", "حركات مخزون لأصناف غير موجودة: " + bm.length);
    try {
      const neg = [];
      for (const [k, v] of stock()) for (const [w, q] of v.wh) q < -0.0005 && neg.push(nm("it", k) + " في " + nm("wh", w) + " (" + fq(q) + ")");
      neg.length && add("warn", "أرصدة مخزون بالسالب: " + neg.length, neg.slice(0, 5).join("، "));
      const ia = invAcc();
      if (ia) {
        const gl = S.journal.filter((j) => j.a === ia).reduce((a, j) => a + num(j.d) - num(j.c), 0),
          sv = [...stock().values()].reduce((a, v) => a + (v.val || 0), 0);
        Math.abs(gl - sv) > 1 && add("warn", "قيمة المخزون في الحسابات تختلف عن المخازن", "الحسابات " + fmt(gl) + " · المخازن " + fmt(sv) + " (قد يكون بسبب قيود يدوية على حساب المخزون)");
      }
    } catch (e) {
      logErr(e, "health-stock");
    }
    const ov = S.docs.filter((d) => "inv" === d.kind && remOf(d) < -0.01);
    ov.length && add("warn", "فواتير مدفوع عليها أكثر من قيمتها: " + ov.length, ov.slice(0, 5).map((d) => docLabel(d)).join("، "));
    return out;
  }
  window.zbHealth = health;
  setTimeout(() => {
    try {
      const h = health().filter((x) => "bad" === x.lv);
      h.length && toast("فحص البيانات لقى " + h.length + " ملاحظة مهمة. افتح الإعدادات ← «فحص سلامة البيانات».");
    } catch (e) {
      logErr(e, "health");
    }
  }, 9000);
  /* ---------- بطاقة الإعدادات ---------- */
  const card = () =>
    '<div class="card" id="rp_card"><h3>الحماية ونقاط الاسترجاع</h3><p class="note">البرنامج بياخد نسخة تلقائية من بياناتك على هذا الجهاز (يومياً تقريباً، وقبل أي مسح أو استرجاع أو استيراد). لو حصل خطأ أو مسحت بالغلط، ارجع لأي نقطة. دي مش بديل للنسخة الاحتياطية على فلاشة أو إيميل.</p><div class="bar"><button class="btn pri" data-act="rp_now">أخذ نقطة استرجاع الآن</button><button class="btn" data-act="rp_health">فحص سلامة البيانات</button><button class="btn" data-act="rp_errs">تقرير الأخطاء</button></div><div id="rp_out"></div><div id="rp_box" class="tw"></div></div>';
  async function fill() {
    const box = document.getElementById("rp_box");
    if (!box) return;
    if (!isLocal()) {
      box.innerHTML = '<p class="note">نقاط الاسترجاع غير متاحة لأن المتصفح لا يسمح بتخزين البيانات.</p>';
      return;
    }
    const idx = (await KV.get(SNK).catch(() => null)) || [];
    box.innerHTML = idx.length
      ? "<table><thead><tr><th>التاريخ</th><th>السبب</th><th>الحجم</th><th></th></tr></thead><tbody>" +
        idx
          .map(
            (x) =>
              "<tr><td>" +
              esc(new Date(x.t).toLocaleString("ar-EG")) +
              "</td><td>" +
              esc(x.why) +
              '</td><td class="num">' +
              Math.max(1, Math.round(x.n / 1024)) +
              ' ك.ب</td><td><button class="btn sm" data-act="rp_restore" data-k="' +
              esc(x.k) +
              '">استرجاع</button> <button class="btn sm" data-act="rp_dl" data-k="' +
              esc(x.k) +
              '">تنزيل</button></td></tr>',
          )
          .join("") +
        "</tbody></table>"
      : '<p class="note">لا توجد نقاط استرجاع بعد. أول نقطة تلقائية تتأخذ بعد دقائق من العمل، أو اضغط «أخذ نقطة استرجاع الآن».</p>';
  }
  const _setup = VIEWS.setup;
  VIEWS.setup = function () {
    const h = _setup.apply(this, arguments);
    setTimeout(fill, 0);
    return h + card();
  };
  const outBox = (h) => {
    const o = document.getElementById("rp_out");
    o && (o.innerHTML = h);
  };
  A.rp_now = () => {
    if (!isLocal()) return toast("المتصفح لا يسمح بتخزين البيانات.");
    if (!hasData()) return toast("لا توجد بيانات بعد لأخذ نقطة منها.");
    snapNow("يدوي").then(() => {
      toast("تم أخذ نقطة استرجاع");
      fill();
    });
  };
  A.rp_dl = (el) => {
    const k = el.dataset.k;
    KV.get(k).then(async (o) => {
      if (!o) return toast("النقطة غير موجودة.");
      saveFile("restore-point-" + today() + ".json", await ungz(o), "application/json");
    });
  };
  A.rp_restore = (el) => {
    const k = el.dataset.k;
    ask(
      "استرجاع بيانات هذه النقطة؟ هتتبدل بياناتك الحالية، وهنخد نقطة من بياناتك الحالية الأول عشان تقدر ترجع لها.",
      "استرجاع",
      async () => {
        try {
          const o = await KV.get(k);
          if (!o) return toast("النقطة غير موجودة.");
          const obj = JSON.parse(await ungz(o));
          if (!obj || !obj.meta) return toast("ملف النقطة غير سليم.");
          replaceAll(obj);
          toast("تم الاسترجاع");
        } catch (e) {
          logErr(e, "restore");
          toast("تعذّر الاسترجاع: " + ((e && e.message) || "خطأ"));
        }
      },
    );
  };
  A.rp_health = () => {
    const h = health();
    outBox(
      h.length
        ? "<ul>" +
            h
              .map(
                (x) =>
                  '<li><span class="chip ' +
                  ("bad" === x.lv ? "bad" : "warn") +
                  '">' +
                  ("bad" === x.lv ? "مهم" : "تنبيه") +
                  "</span> " +
                  esc(x.t) +
                  (x.d ? '<br><small class="note">' + esc(x.d) + "</small>" : "") +
                  "</li>",
              )
              .join("") +
            "</ul>"
        : '<p class="note"><span class="chip good">سليم ✓</span> لا توجد ملاحظات: القيود متزنة والمستندات والمخزون متطابقة.</p>',
    );
  };
  A.rp_errs = async () => {
    let saved = [];
    try {
      saved = (isLocal() && (await KV.get(ERRK))) || [];
    } catch (e) {}
    const all = saved.length ? saved : errs,
      txt = JSON.stringify({ app: BRAND.name + " " + BRAND.sub, at: new Date().toISOString(), ua: navigator.userAgent, errors: all }, null, 1);
    modal(
      '<header><h2>تقرير الأخطاء</h2><button class="btn sm" data-act="close">إغلاق</button></header><div class="body"><p class="note">' +
        (all.length ? "ابعت النص ده للدعم عشان نصلح المشكلة. لا يحتوي على بيانات الشركة." : "لا توجد أخطاء مسجلة. ") +
        '</p><textarea readonly style="width:100%;height:260px;direction:ltr;font-size:12px">' +
        esc(txt) +
        '</textarea></div><footer><button class="btn pri" data-act="rp_copy">نسخ</button><span style="flex:1"></span><button class="btn" data-act="close">إغلاق</button></footer>',
    );
  };
  A.rp_copy = () => {
    const t = document.querySelector("#modal textarea");
    t && navigator.clipboard && navigator.clipboard.writeText(t.value).then(() => toast("تم النسخ"));
  };
  /* ---------- تغليف كل الشاشات: خطأ في شاشة لا يوقف البرنامج ---------- */
  Object.keys(VIEWS).forEach((k) => {
    const f = VIEWS[k];
    "function" == typeof f &&
      (VIEWS[k] = function () {
        try {
          return f.apply(this, arguments);
        } catch (e) {
          logErr(e, "view:" + k);
          return fallback(e);
        }
      });
  });
})();
