// Pusula – Microsoft 365 / Outlook bağlantısı ve gerçek gönderim (Microsoft Graph)
// Güvenlik: yenileme anahtarı AES-GCM ile şifreli saklanır; ALICI KİLİDİ açıkken sunucu yalnızca
// TEST_ALICILAR listesindeki adreslere gönderir (uygulamadan kapatılamaz, yalnızca sunucu ayarından).

// Yalnızca iş / okul hesapları (Microsoft 365). Aynı adresle açılmış kişisel Microsoft hesabına yönlenmeyi önler.
const MS_YETKI = "https://login.microsoftonline.com/organizations/oauth2/v2.0";
const KAPSAM = "offline_access User.Read Mail.Send";
const GUNLUK_SERT_SINIR = 50; // uygulama ayarından bağımsız, sunucudaki üst sınır
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export class PostaHatasi extends Error { constructor(m, durum = 400) { super(m); this.durum = durum; } }

const geriAdres = req => new URL("/api/microsoft/geri", req.url).toString();
export const testAlicilari = env => String(env.TEST_ALICILAR || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
export const kilitAcik = env => env.ALICI_KILIDI !== "kapali";

async function anahtar(env) {
  if (!env.MS_CLIENT_SECRET) throw new PostaHatasi("Microsoft gizli anahtarı sunucuda tanımlı değil.", 503);
  const kok = await crypto.subtle.importKey("raw", enc.encode(env.MS_CLIENT_SECRET), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name: "HKDF", hash: "SHA-256", salt: enc.encode("pusula-posta"), info: enc.encode("yenileme-anahtari")}, kok, {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]);
}
async function sifrele(env, metin) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return b64(iv) + "." + b64(await crypto.subtle.encrypt({name: "AES-GCM", iv}, await anahtar(env), enc.encode(metin)));
}
async function coz(env, s) {
  const [iv, veri] = s.split(".");
  return dec.decode(await crypto.subtle.decrypt({name: "AES-GCM", iv: unb64(iv)}, await anahtar(env), unb64(veri)));
}

export async function baglantiBaslat(req, env, kullaniciId) {
  if (!env.MS_CLIENT_ID) throw new PostaHatasi("Microsoft uygulama kimliği tanımlı değil.", 503);
  const durum = crypto.randomUUID();
  await env.DB.prepare("DELETE FROM oauth_durum WHERE bitis < ?").bind(Date.now()).run();
  await env.DB.prepare("INSERT INTO oauth_durum (durum, kullanici_id, bitis) VALUES (?, ?, ?)").bind(durum, kullaniciId, Date.now() + 600_000).run();
  const u = new URL(MS_YETKI + "/authorize");
  u.search = new URLSearchParams({client_id: env.MS_CLIENT_ID, response_type: "code", redirect_uri: geriAdres(req), response_mode: "query", scope: KAPSAM, state: durum, prompt: "select_account"}).toString();
  return u.toString();
}

async function tokenAl(req, env, govde) {
  const r = await fetch(MS_YETKI + "/token", {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({client_id: env.MS_CLIENT_ID, client_secret: env.MS_CLIENT_SECRET, redirect_uri: geriAdres(req), scope: KAPSAM, ...govde})});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new PostaHatasi(j.error === "invalid_grant" ? "Microsoft bağlantısının süresi dolmuş; Ayarlar'dan yeniden bağlanın." : `Microsoft giriş hatası: ${j.error_description?.split("\r\n")[0] || j.error || r.status}`, j.error === "invalid_grant" ? 401 : 502);
  return j;
}

// Microsoft'tan dönüş: kodu anahtara çevir, hesabı kaydet. Dönen değer: uygulamaya yönlendirilecek adres.
export async function baglantiTamamla(req, env, kullaniciId) {
  const p = new URL(req.url).searchParams;
  const kayit = await env.DB.prepare("SELECT * FROM oauth_durum WHERE durum = ?").bind(p.get("state") || "").first();
  if (kayit) await env.DB.prepare("DELETE FROM oauth_durum WHERE durum = ?").bind(kayit.durum).run();
  if (!kayit || kayit.kullanici_id !== kullaniciId || kayit.bitis < Date.now()) return "/?ms=hata&neden=" + encodeURIComponent("Bağlantı isteğinin süresi doldu; tekrar deneyin.");
  if (p.get("error")) {
    const d = p.get("error_description") || "";
    const neden = /AADSTS65001|consent|admin/i.test(d + p.get("error")) ? "Şirketinizin Microsoft ayarları bu uygulama için yönetici onayı istiyor." : p.get("error") === "access_denied" ? "İzin verilmedi." : d.split("\r\n")[0].slice(0, 200);
    return "/?ms=hata&neden=" + encodeURIComponent(neden);
  }
  const t = await tokenAl(req, env, {grant_type: "authorization_code", code: p.get("code") || ""});
  if (!t.refresh_token) return "/?ms=hata&neden=" + encodeURIComponent("Microsoft yenileme anahtarı vermedi.");
  const me = await (await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", {headers: {Authorization: `Bearer ${t.access_token}`}})).json();
  const eposta = String(me.mail || me.userPrincipalName || "").toLowerCase();
  await env.DB.prepare("INSERT INTO posta_hesabi (kullanici_id, saglayici, eposta, yenileme_sifreli, baglanma) VALUES (?, 'microsoft', ?, ?, ?) ON CONFLICT(kullanici_id) DO UPDATE SET saglayici = excluded.saglayici, eposta = excluded.eposta, yenileme_sifreli = excluded.yenileme_sifreli, baglanma = excluded.baglanma")
    .bind(kullaniciId, eposta, await sifrele(env, t.refresh_token), new Date().toISOString()).run();
  return "/?ms=baglandi";
}

export async function postaDurumu(env, kullaniciId) {
  const h = await env.DB.prepare("SELECT saglayici, eposta, baglanma FROM posta_hesabi WHERE kullanici_id = ?").bind(kullaniciId).first();
  const gun = new Date().toISOString().slice(0, 10);
  const bugun = (await env.DB.prepare("SELECT COUNT(*) AS n FROM gonderim_kaydi WHERE kullanici_id = ? AND durum = 'gonderildi' AND zaman >= ?").bind(kullaniciId, gun).first()).n;
  return {bagli: !!h, saglayici: h?.saglayici || "", eposta: h?.eposta || "", baglanma: h?.baglanma || "", kilit: kilitAcik(env), testAlicilari: kilitAcik(env) ? testAlicilari(env) : [], bugunGonderilen: bugun, gunlukSinir: GUNLUK_SERT_SINIR};
}

export async function baglantiKaldir(env, kullaniciId) {
  await env.DB.prepare("DELETE FROM posta_hesabi WHERE kullanici_id = ?").bind(kullaniciId).run();
}

const kac = x => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function htmlGovde(metin, imzaVar) {
  const p = String(metin).replace(/\r/g, "").split(/\n{2,}/).map(x => `<p style="margin:0 0 12px">${kac(x).replace(/\n/g, "<br>")}</p>`).join("");
  return `<div style="font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#222">${p}${imzaVar ? '<img src="cid:imza" alt="İmza" style="max-width:480px;width:100%;height:auto">' : ""}</div>`;
}

// Tek mail gönderimi. kime: uygulamanın hesapladığı alıcı; kilit açıkken listede değilse reddedilir.
export async function gonder(req, env, kullaniciId, {kime, firmaEposta = "", konu, metin, imza}) {
  kime = String(kime || "").trim().toLowerCase();
  if (!kime || !konu || !metin) throw new PostaHatasi("Alıcı, konu ve metin gerekli.");
  if (kilitAcik(env) && !testAlicilari(env).includes(kime)) throw new PostaHatasi(`Test kilidi açık: yalnızca ${testAlicilari(env).join(", ")} adreslerine gönderilebilir.`, 403);
  const gun = new Date().toISOString().slice(0, 10);
  const bugun = (await env.DB.prepare("SELECT COUNT(*) AS n FROM gonderim_kaydi WHERE kullanici_id = ? AND durum = 'gonderildi' AND zaman >= ?").bind(kullaniciId, gun).first()).n;
  if (bugun >= GUNLUK_SERT_SINIR) throw new PostaHatasi(`Günlük güvenlik sınırına (${GUNLUK_SERT_SINIR}) ulaşıldı.`, 429);
  const h = await env.DB.prepare("SELECT * FROM posta_hesabi WHERE kullanici_id = ?").bind(kullaniciId).first();
  if (!h) throw new PostaHatasi("Önce Ayarlar > Bağlantılar'dan Outlook hesabınızı bağlayın.", 409);

  const t = await tokenAl(req, env, {grant_type: "refresh_token", refresh_token: await coz(env, h.yenileme_sifreli)});
  if (t.refresh_token) await env.DB.prepare("UPDATE posta_hesabi SET yenileme_sifreli = ? WHERE kullanici_id = ?").bind(await sifrele(env, t.refresh_token), kullaniciId).run();

  const imzaM = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(imza || "");
  const message = {
    subject: String(konu).slice(0, 250),
    body: {contentType: "HTML", content: htmlGovde(metin, !!imzaM)},
    toRecipients: [{emailAddress: {address: kime}}],
    ...(imzaM ? {attachments: [{"@odata.type": "#microsoft.graph.fileAttachment", name: "imza." + (imzaM[1].endsWith("png") ? "png" : "jpg"), contentType: imzaM[1], contentBytes: imzaM[2], isInline: true, contentId: "imza"}]} : {}),
  };
  const r = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {method: "POST", headers: {Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json"}, body: JSON.stringify({message, saveToSentItems: true})});
  const kayit = (durum, hataMetni = null) => env.DB.prepare("INSERT INTO gonderim_kaydi (kullanici_id, zaman, alici, firma_eposta, konu, durum, hata) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(kullaniciId, new Date().toISOString(), kime, firmaEposta, String(konu).slice(0, 250), durum, hataMetni).run();
  if (r.status === 202) { await kayit("gonderildi"); return {tamam: true, gonderen: h.eposta, alici: kime}; }
  const m = (await r.text()).slice(0, 300);
  await kayit("hata", `${r.status} ${m}`);
  if (r.status === 429 || r.status === 503) throw new PostaHatasi("Microsoft geçici olarak yavaşlattı; birkaç dakika sonra tekrar deneyin.", 429);
  if (r.status === 401 || r.status === 403) throw new PostaHatasi("Microsoft gönderime izin vermedi; Ayarlar'dan yeniden bağlanın.", 401);
  throw new PostaHatasi(`Microsoft gönderimi reddetti (${r.status}).`, 502);
}
