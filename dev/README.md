# ظبطها — مجلد التطوير

الملفات في `stores/` و`accounting/` هي ناتج بناء. **لا تعدّلها يدوياً.** عدّل في `dev/src` ثم ابنِ.

- `src/app.js` : الكود الرئيسي مقروء (الاثنان نفس الكود).
- `src/head.html`, `src/tail.html` : الصفحة قبل وبعد السكربت (CSS ووسوم أخرى).
- `build.sh` : يضغط الكود ويكتب `stores/index.html` و`accounting/index.html` ويحدّث اسم كاش `sw.js`.
- `tests/` : اختبارات Playwright (تحتاج Chrome). `h.js` هو المساعد؛ شغّل `node tests/t3.js` إلخ.
- `history/` : رقع قديمة للمرجع فقط (مطبّقة بالفعل داخل src).

## الخطوات
1. `npm i terser` (مرة واحدة) ثم عدّل `src/app.js`.
2. `TERSER=node_modules/.bin/terser dev/build.sh`
3. شغّل الاختبارات: t1 (مرتجعات/قيود)، t2 (متوسط التكلفة/سندات/XSS/استرجاع)، t3 (نقطة البيع)، t5–t7 (الحماية وتعدد النوافذ والحفظ).
4. ادفع إلى `main` (Cloudflare ينشر تلقائياً).
