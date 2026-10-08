# Pusula uygulama kaynağı

- `app_v2.js` – uygulamanın tüm arayüz ve kural kodu (asıl kaynak)
- `extra_v2.css`, `v1.html` – stil ve iskelet
- `build.py` – derler: `public/index.html` ve sunucu motoru `src/motor-uretilmis.js`
- `testler/` – Playwright uçtan uca test betikleri (`npm install` ile)

Güncelleme: `cd pusula-uygulama && python3 kaynak/build.py && npx wrangler deploy`
