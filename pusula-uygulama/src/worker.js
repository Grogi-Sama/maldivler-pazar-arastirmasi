// Pusula – Cloudflare Worker
// Görevleri: giriş / ilk kurulum, oturum çerezi, çalışma alanını D1'de saklama, uygulama dosyalarını sunma.
// Giriş yapılmadan uygulamanın hiçbir sayfası ve verisi açılmaz.

import UYGULAMA from "../public/index.html";
import IKON_192 from "../marka/ikon-192.png";
import IKON_512 from "../marka/ikon-512.png";
import IKON_MASKABLE from "../marka/ikon-maskable-512.png";
import APPLE_IKON from "../marka/apple-touch-icon.png";

const CEREZ = "pusula_oturum";
const OTURUM_GUN = 30;
const PBKDF2_TUR = 20000; // ücretsiz plandaki işlemci süresi sınırına göre
const DENEME_SINIRI = 10, DENEME_PENCERE_MS = 15 * 60 * 1000;
const ALAN_MAX = 900_000; // tek çalışma alanı belgesi için üst sınır (bayt)

const enc = new TextEncoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64url = s => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = s => atob(s.replace(/-/g, "+").replace(/_/g, "/"));
const rastgele = n => b64(crypto.getRandomValues(new Uint8Array(n)));

const GUVENLIK = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=31536000",
};
const json = (veri, durum = 200, ek = {}) => new Response(JSON.stringify(veri), {status: durum, headers: {"Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...GUVENLIK, ...ek}});
const hata = (mesaj, durum = 400) => json({hata: mesaj}, durum);

async function sifreHash(sifre, tuz) {
  const anahtar = await crypto.subtle.importKey("raw", enc.encode(sifre), "PBKDF2", false, ["deriveBits"]);
  return b64(await crypto.subtle.deriveBits({name: "PBKDF2", hash: "SHA-256", salt: enc.encode(tuz), iterations: PBKDF2_TUR}, anahtar, 256));
}
function esitMi(a, b) { // zamanlama saldırısına karşı sabit süreli karşılaştırma
  if (a.length !== b.length) return false;
  let f = 0; for (let i = 0; i < a.length; i++) f |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return f === 0;
}
async function imzaAnahtari(env) {
  let r = await env.DB.prepare("SELECT deger FROM ayar WHERE anahtar = 'oturum_anahtari'").first();
  if (!r) { await env.DB.prepare("INSERT OR IGNORE INTO ayar (anahtar, deger) VALUES ('oturum_anahtari', ?)").bind(rastgele(32)).run(); r = await env.DB.prepare("SELECT deger FROM ayar WHERE anahtar = 'oturum_anahtari'").first(); }
  return crypto.subtle.importKey("raw", enc.encode(r.deger), {name: "HMAC", hash: "SHA-256"}, false, ["sign"]);
}
async function imzala(env, metin) { return b64url(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", await imzaAnahtari(env), enc.encode(metin))))); }

async function oturumAc(env, kullaniciId) {
  const bitis = Date.now() + OTURUM_GUN * 864e5;
  const govde = b64url(`${kullaniciId}|${bitis}`);
  const deger = `${govde}.${await imzala(env, govde)}`;
  return `${CEREZ}=${deger}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${OTURUM_GUN * 86400}`;
}
async function oturum(req, env) {
  const c = (req.headers.get("Cookie") || "").split(/;\s*/).find(x => x.startsWith(CEREZ + "="));
  if (!c) return null;
  const [govde, imza] = c.slice(CEREZ.length + 1).split(".");
  if (!govde || !imza || !esitMi(imza, await imzala(env, govde))) return null;
  const [id, bitis] = unb64url(govde).split("|");
  if (Number(bitis) < Date.now()) return null;
  return env.DB.prepare("SELECT id, eposta FROM kullanici WHERE id = ?").bind(id).first();
}

async function denemeSayisi(env, ip) {
  await env.DB.prepare("DELETE FROM giris_denemesi WHERE zaman < ?").bind(Date.now() - DENEME_PENCERE_MS).run();
  return (await env.DB.prepare("SELECT COUNT(*) AS n FROM giris_denemesi WHERE ip = ?").bind(ip).first()).n;
}
const gecerliEposta = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

async function api(req, env, yol) {
  const ip = req.headers.get("CF-Connecting-IP") || "yerel";
  const kullaniciSayisi = (await env.DB.prepare("SELECT COUNT(*) AS n FROM kullanici").first()).n;

  if (yol === "/api/durum") return json({kurulu: kullaniciSayisi > 0});

  if (yol === "/api/kurulum" && req.method === "POST") {
    if (kullaniciSayisi > 0) return hata("Kurulum zaten yapılmış.", 409);
    const {eposta = "", sifre = ""} = await req.json().catch(() => ({}));
    const e = String(eposta).trim().toLowerCase();
    if (!gecerliEposta(e)) return hata("Geçerli bir e-posta adresi girin.");
    if (String(sifre).length < 10) return hata("Şifre en az 10 karakter olmalı.");
    const id = crypto.randomUUID(), tuz = rastgele(16);
    await env.DB.prepare("INSERT INTO kullanici (id, eposta, sifre_hash, tuz, olusturma) VALUES (?, ?, ?, ?, ?)").bind(id, e, await sifreHash(sifre, tuz), tuz, new Date().toISOString()).run();
    return json({tamam: true}, 200, {"Set-Cookie": await oturumAc(env, id)});
  }

  if (yol === "/api/giris" && req.method === "POST") {
    if (await denemeSayisi(env, ip) >= DENEME_SINIRI) return hata("Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.", 429);
    const {eposta = "", sifre = ""} = await req.json().catch(() => ({}));
    const k = await env.DB.prepare("SELECT * FROM kullanici WHERE eposta = ?").bind(String(eposta).trim().toLowerCase()).first();
    const hash = await sifreHash(String(sifre), k ? k.tuz : "yok");
    if (!k || !esitMi(hash, k.sifre_hash)) {
      await env.DB.prepare("INSERT INTO giris_denemesi (ip, zaman) VALUES (?, ?)").bind(ip, Date.now()).run();
      return hata("E-posta veya şifre hatalı.", 401);
    }
    return json({tamam: true}, 200, {"Set-Cookie": await oturumAc(env, k.id)});
  }

  if (yol === "/api/cikis" && req.method === "POST") return json({tamam: true}, 200, {"Set-Cookie": `${CEREZ}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`});

  // Buradan sonrası giriş gerektirir
  const k = await oturum(req, env);
  if (!k) return hata("Oturum açılmamış.", 401);

  if (yol === "/api/oturum") return json({eposta: k.eposta});

  if (yol === "/api/alan" && req.method === "GET") {
    const r = await env.DB.prepare("SELECT veri, surum, guncelleme FROM calisma_alani WHERE kullanici_id = ?").bind(k.id).first();
    return r ? json({veri: JSON.parse(r.veri), surum: r.surum, guncelleme: r.guncelleme}) : json({veri: null, surum: 0});
  }
  if (yol === "/api/alan" && req.method === "PUT") {
    const metin = await req.text();
    if (metin.length > ALAN_MAX) return hata("Çalışma alanı çok büyük.", 413);
    const {veri, surum} = JSON.parse(metin);
    if (!veri || typeof veri !== "object") return hata("Geçersiz veri.");
    const simdi = new Date().toISOString(), yeni = (Number(surum) || 0) + 1;
    // İyimser kilit: başka bir cihaz arada kaydettiyse üzerine yazma, 409 dön
    const r = surum
      ? await env.DB.prepare("UPDATE calisma_alani SET veri = ?, surum = ?, guncelleme = ? WHERE kullanici_id = ? AND surum = ?").bind(JSON.stringify(veri), yeni, simdi, k.id, Number(surum)).run()
      : await env.DB.prepare("INSERT OR IGNORE INTO calisma_alani (kullanici_id, veri, surum, guncelleme) VALUES (?, ?, 1, ?)").bind(k.id, JSON.stringify(veri), simdi).run();
    if (!r.meta.changes) return hata("Çalışma alanı başka bir cihazda değişti. Sayfayı yenileyin.", 409);
    return json({surum: yeni, guncelleme: simdi});
  }
  return hata("Bulunamadı.", 404);
}

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Pusula">
  <defs>
    <linearGradient id="pz-g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#14947F"/>
      <stop offset="1" stop-color="#0A5A4F"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="15" fill="url(#pz-g)"/>
  <circle cx="32" cy="32" r="20.5" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
  <g stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round">
    <path d="M32 9.5v4M32 50.5v4M9.5 32h4M50.5 32h4"/>
  </g>
  <g transform="rotate(35 32 32)">
    <path d="M32 13 L38 32 L26 32 Z" fill="#fff"/>
    <path d="M32 51 L38 32 L26 32 Z" fill="#fff" fill-opacity=".42"/>
  </g>
  <circle cx="32" cy="32" r="3.2" fill="#0A5A4F" stroke="#fff" stroke-width="1.6"/>
</svg>`;
const BASLIK_EK = `<link rel="icon" href="/logo.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#0E7A6B"><meta name="apple-mobile-web-app-title" content="Pusula"><meta name="apple-mobile-web-app-capable" content="yes">`;
const MANIFEST = JSON.stringify({
  name: "Pusula – İş geliştirme asistanı", short_name: "Pusula", lang: "tr", start_url: "/", scope: "/", display: "standalone",
  background_color: "#F3F5F4", theme_color: "#0E7A6B",
  icons: [
    {src: "/ikon-192.png", sizes: "192x192", type: "image/png"},
    {src: "/ikon-512.png", sizes: "512x512", type: "image/png"},
    {src: "/ikon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable"},
  ],
});

function girisSayfasi(kurulu) {
  const baslik = kurulu ? "Tekrar hoş geldiniz" : "Pusula'yı kurun";
  const aciklama = kurulu ? "Devam etmek için hesabınızla giriş yapın." : "İlk kurulum: uygulamaya girmek için kullanacağınız e-posta ve şifreyi belirleyin. Bu adım yalnızca bir kez yapılır.";
  const ozellik = (yol, b, t) => `<li><span class="ik" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${yol}"/></svg></span><span><b>${b}</b><br>${t}</span></li>`;
  return new Response(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><title>Pusula – ${kurulu ? "Giriş" : "Kurulum"}</title>${BASLIK_EK}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Figtree:wght@400;500;600&display=swap">
<style>:root{--bg:#F3F5F4;--card:#fff;--fg:#16211F;--muted:#5A6B67;--line:#DCE3E0;--accent:#0E7A6B;--accent-d:#0A5A4F;--red:#B23A36;--head:"Bricolage Grotesque",system-ui,sans-serif;--body:"Figtree","Segoe UI",system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root{--bg:#0F1614;--card:#17201E;--fg:#E4ECE9;--muted:#93A6A1;--line:#2A3633;--accent:#3DB7A3;--red:#EA8C86}}
*{box-sizing:border-box}html,body{height:100%}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 var(--body)}
.wrap{min-height:100%;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)}
.tanit{background:linear-gradient(150deg,#14947F 0%,#0E7A6B 45%,#0A4F45 100%);color:#fff;padding:48px clamp(28px,5vw,72px);display:flex;flex-direction:column;gap:28px;position:relative;overflow:hidden}
.tanit::after{content:"";position:absolute;right:-140px;bottom:-140px;width:420px;height:420px;border-radius:50%;border:2px solid rgba(255,255,255,.12);box-shadow:0 0 0 60px rgba(255,255,255,.04)}
.marka{display:flex;align-items:center;gap:12px;font:700 24px var(--head)}.marka svg{width:44px;height:44px;border-radius:11px;box-shadow:0 0 0 1.5px rgba(255,255,255,.45),0 4px 14px rgba(0,0,0,.2)}
.tanit h2{font:700 clamp(28px,3.2vw,40px)/1.12 var(--head);margin:auto 0 0;max-width:15ch;letter-spacing:-.01em}
.tanit p{color:#fff}.tanit .alt{margin:0;font-size:16.5px;opacity:.92;max-width:44ch}
.tanit ul{list-style:none;margin:0;padding:0;display:grid;gap:16px;max-width:460px}
.tanit li{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;line-height:1.45;opacity:.95}.tanit li b{font-weight:600}
.ik{flex:none;width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,.14);display:grid;place-items:center}.ik svg{width:18px;height:18px}
.tanit .dip{margin-top:auto;font-size:13px;opacity:.8;position:relative;z-index:1}
.form-taraf{display:grid;place-items:center;padding:32px 20px}
form{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px;width:min(400px,100%);display:grid;gap:14px;box-shadow:0 10px 30px rgba(10,40,35,.06)}
h1{margin:0;font:700 24px var(--head)}p{margin:0;color:var(--muted);font-size:14px}label{display:grid;gap:6px;font-size:13.5px;color:var(--muted)}
input{font:inherit;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:transparent;color:var(--fg)}input:focus{outline:2px solid var(--accent);outline-offset:1px}
button{font:inherit;font-weight:600;padding:12px;border:0;border-radius:10px;background:var(--accent);color:#fff;cursor:pointer}button:disabled{opacity:.6}
.hata{color:var(--red);font-size:13.5px;min-height:1em}.guv{display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--muted);justify-content:center}
@media (max-width:860px){.wrap{grid-template-columns:minmax(0,1fr)}.tanit{padding:28px 20px 30px;gap:16px}.tanit h2{margin-top:6px;font-size:26px;max-width:none}.tanit .alt{font-size:15px}.tanit ul{gap:10px}.tanit li:nth-child(n+3){display:none}.tanit .dip{display:none}.form-taraf{padding:22px 16px 40px;place-items:start center}}
</style></head>
<body><div class="wrap">
<section class="tanit" aria-label="Pusula hakkında">
  <div class="marka">${LOGO_SVG}Pusula</div>
  <h2>Doğru firmayı bulun, doğru mesajla ulaşın.</h2>
  <p class="alt">Pusula; müşteri ve tedarikçi adaylarını araştırır, kişiye özel tanışma ve takip maillerini hazırlar, sizin adresinizden spama düşmeden gönderir.</p>
  <ul>
    ${ozellik("M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.3-4.3", "Canlı araştırma", "Açık kaynaklardan gerçek firmalar; her bilginin kaynağı görünür.")}
    ${ozellik("M4 4h16v16H4zM4 8l8 5 8-5", "Kişiye özel mailler", "Firmanın kendi projesine değinen, Türkçe veya yabancı dilde taslaklar.")}
    ${ozellik("M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z", "Unutulmayan takipler", "3., 7. ve 14. günde hatırlatma; yanıt gelince dizi durur.")}
    ${ozellik("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "Güvenli ve kontrollü", "Günlük limit, teslim puanı, test modu ve tek tuşla durdurma.")}
  </ul>
  <p class="dip">Kendi mailinizden · spama düşmeden · insan temposunda</p>
</section>
<main class="form-taraf"><form id="f">
<h1>${baslik}</h1><p>${aciklama}</p>
<label>E-posta<input id="e" type="email" autocomplete="username" required></label>
<label>Şifre${kurulu ? "" : " (en az 10 karakter)"}<input id="s" type="password" autocomplete="${kurulu ? "current-password" : "new-password"}" required minlength="${kurulu ? 1 : 10}"></label>
${kurulu ? "" : `<label>Şifre (tekrar)<input id="s2" type="password" autocomplete="new-password" required minlength="10"></label>`}
<div class="hata" id="h" role="alert"></div><button id="b">${kurulu ? "Giriş yap" : "Kur ve giriş yap"}</button>
<div class="guv"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>Şifreli bağlantı · veriler Avrupa'da saklanır</div>
</form></main></div>
<script>document.getElementById("f").addEventListener("submit",async ev=>{ev.preventDefault();const h=document.getElementById("h"),b=document.getElementById("b");h.textContent="";
const s=document.getElementById("s").value,s2=document.getElementById("s2");if(s2&&s2.value!==s){h.textContent="Şifreler aynı değil.";return}
b.disabled=true;try{const r=await fetch("${kurulu ? "/api/giris" : "/api/kurulum"}",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eposta:document.getElementById("e").value,sifre:s})});
const j=await r.json();if(r.ok){location.href="/"}else{h.textContent=j.hata||"Bir sorun oluştu."}}catch(e){h.textContent="Bağlantı kurulamadı."}b.disabled=false})</script></body></html>`,
    {headers: {"Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...GUVENLIK}});
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), yol = url.pathname;
    try {
      if (yol.startsWith("/api/")) return await api(req, env, yol);
      // Logo, simgeler ve uygulama tanımı herkese açık (telefon ana ekranı bunları oturumsuz ister)
      const dosya = {"/logo.svg": [LOGO_SVG, "image/svg+xml"], "/favicon.ico": [LOGO_SVG, "image/svg+xml"], "/manifest.webmanifest": [MANIFEST, "application/manifest+json"],
        "/ikon-192.png": [IKON_192, "image/png"], "/ikon-512.png": [IKON_512, "image/png"], "/ikon-maskable-512.png": [IKON_MASKABLE, "image/png"], "/apple-touch-icon.png": [APPLE_IKON, "image/png"]}[yol];
      if (dosya) return new Response(dosya[0], {headers: {"Content-Type": dosya[1], "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff"}});
      if (yol === "/giris") {
        const kurulu = (await env.DB.prepare("SELECT COUNT(*) AS n FROM kullanici").first()).n > 0;
        return girisSayfasi(kurulu);
      }
      if (!(await oturum(req, env))) return Response.redirect(url.origin + "/giris", 302);
      if (yol !== "/" && yol !== "/index.html") return Response.redirect(url.origin + "/", 302);
      return new Response(UYGULAMA, {headers: {"Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...GUVENLIK}});
    } catch (e) {
      console.error(e);
      return hata("Sunucu hatası.", 500);
    }
  },
};
