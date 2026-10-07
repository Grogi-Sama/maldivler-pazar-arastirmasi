// Pusula – Cloudflare Worker
// Görevleri: giriş / ilk kurulum, oturum çerezi, çalışma alanını D1'de saklama, uygulama dosyalarını sunma.
// Giriş yapılmadan uygulamanın hiçbir sayfası ve verisi açılmaz.

import UYGULAMA from "../public/index.html";

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

function girisSayfasi(kurulu) {
  const baslik = kurulu ? "Giriş yap" : "Pusula'yı kur";
  const aciklama = kurulu ? "Devam etmek için hesabınızla giriş yapın." : "İlk kurulum: uygulamaya girmek için kullanacağınız e-posta ve şifreyi belirleyin. Bu adım yalnızca bir kez yapılır.";
  return new Response(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pusula – ${baslik}</title>
<style>:root{--bg:#F3F5F4;--card:#fff;--fg:#14211E;--muted:#5C6B67;--line:#DCE3E0;--accent:#0E7A63;--red:#B23A36}
@media (prefers-color-scheme:dark){:root{--bg:#0F1614;--card:#17201E;--fg:#E7EEEC;--muted:#9BAAA6;--line:#2A3633;--accent:#4CC3A4;--red:#EA8C86}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px}
form{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px;width:min(400px,100%);display:grid;gap:14px}
h1{margin:0;font-size:22px}p{margin:0;color:var(--muted);font-size:14px}label{display:grid;gap:6px;font-size:13.5px;color:var(--muted)}
input{font:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:transparent;color:var(--fg)}input:focus{outline:2px solid var(--accent);outline-offset:1px}
button{font:inherit;font-weight:600;padding:11px;border:0;border-radius:9px;background:var(--accent);color:#fff;cursor:pointer}button:disabled{opacity:.6}
.hata{color:var(--red);font-size:13.5px;min-height:1em}.logo{display:flex;gap:10px;align-items:center;font-weight:700;font-size:18px}</style></head>
<body><form id="f"><div class="logo"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 5l2.5 7L12 19l-2.5-7z" fill="currentColor" stroke="none"/></svg>Pusula</div>
<h1>${baslik}</h1><p>${aciklama}</p>
<label>E-posta<input id="e" type="email" autocomplete="username" required></label>
<label>Şifre${kurulu ? "" : " (en az 10 karakter)"}<input id="s" type="password" autocomplete="${kurulu ? "current-password" : "new-password"}" required minlength="${kurulu ? 1 : 10}"></label>
${kurulu ? "" : `<label>Şifre (tekrar)<input id="s2" type="password" autocomplete="new-password" required minlength="10"></label>`}
<div class="hata" id="h" role="alert"></div><button id="b">${kurulu ? "Giriş yap" : "Kur ve giriş yap"}</button></form>
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
