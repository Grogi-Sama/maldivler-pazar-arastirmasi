// Gönderim sağlığı – alan adının DNS kayıtlarını otomatik kontrol eder (ücretsiz, DNS-over-HTTPS).
// SPF, DKIM, DMARC, MX ve alan adı yaşı (RDAP; .tr gibi desteklenmeyen uzantılarda Pusula gönderim geçmişi).

async function dns(ad, tur) {
  try {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(ad)}&type=${tur}`, {headers: {Accept: "application/dns-json"}});
    const j = await r.json();
    return (j.Answer || []).map(a => String(a.data || "").replace(/^"|"$/g, "").replace(/" "/g, ""));
  } catch { return null; }
}

const DKIM_SECICILER = ["selector1", "selector2", "google", "default", "k1", "s1", "s2", "dkim", "mail"];

export async function saglikKontrol(env, kullaniciId, alan) {
  alan = String(alan || "").toLowerCase().replace(/^.*@/, "").replace(/[^a-z0-9.-]/g, "");
  if (!alan.includes(".")) return {hata: "Alan adı bulunamadı."};
  const [txt, dmarcTxt, mx] = await Promise.all([dns(alan, "TXT"), dns("_dmarc." + alan, "TXT"), dns(alan, "MX")]);
  const sonuc = {alan, zaman: new Date().toISOString(), kontroller: {}};
  const k = sonuc.kontroller;

  const spf = (txt || []).find(t => /^v=spf1/i.test(t));
  k.spf = spf
    ? {durum: "ok", ozet: "SPF kaydı var.", detay: spf}
    : txt === null ? {durum: "bilinmiyor", ozet: "DNS şu an sorgulanamadı; biraz sonra yeniden kontrol edin."} : {durum: "hata", ozet: "SPF kaydı yok.", cozum: `Alan adınızın DNS'ine TXT kaydı ekleyin. Microsoft 365 için: v=spf1 include:spf.protection.outlook.com -all`};

  let dkim = null;
  for (const s of DKIM_SECICILER) {
    const [c, t] = await Promise.all([dns(`${s}._domainkey.${alan}`, "CNAME"), dns(`${s}._domainkey.${alan}`, "TXT")]);
    const kayit = (c || [])[0] || (t || []).find(x => /v=DKIM1|p=/i.test(x));
    if (kayit) { dkim = {secici: s, kayit}; break; }
  }
  const bilinmez = {durum: "bilinmiyor", ozet: "DNS şu an sorgulanamadı; biraz sonra yeniden kontrol edin."};
  k.dkim = dkim
    ? {durum: "ok", ozet: `DKIM imzası açık (${dkim.secici}).`, detay: dkim.kayit.slice(0, 160)}
    : txt === null ? bilinmez : {durum: "uyari", ozet: "DKIM kaydı bulunamadı.", cozum: "Microsoft 365'te: Microsoft Defender portalı → E-posta kimlik doğrulama → DKIM → alan adınızı seçip etkinleştirin (BT yöneticiniz yapar)."};

  const dmarc = (dmarcTxt || []).find(t => /^v=DMARC1/i.test(t));
  const p = dmarc && (/;\s*p=(\w+)/i.exec(dmarc) || [])[1];
  k.dmarc = dmarcTxt === null ? bilinmez : dmarc
    ? {durum: "ok", ozet: `DMARC kaydı var (politika: ${p || "?"}).`, detay: dmarc}
    : {durum: "hata", ozet: "DMARC kaydı yok.", cozum: `DNS'e _dmarc.${alan} adıyla TXT kaydı ekleyin: v=DMARC1; p=none; rua=mailto:dmarc@${alan}`};

  k.mx = mx === null ? bilinmez : mx.length
    ? {durum: "ok", ozet: "Alan adı mail alabiliyor (MX).", detay: mx[0]}
    : {durum: "hata", ozet: "MX kaydı yok; yanıtlar size ulaşamaz."};

  // Alan adı / adres yaşı: RDAP (çoğu uzantı) → olmazsa Pusula'daki ilk gönderim tarihi
  let yas = null;
  try {
    // Yaygın uzantılar için doğrudan kayıt kuruluşu; diğerleri için genel yönlendirici
    const tld = alan.split(".").pop(), kok = alan.split(".").slice(-2).join(".");
    const rdap = {com: "https://rdap.verisign.com/com/v1", net: "https://rdap.verisign.com/net/v1", org: "https://rdap.publicinterestregistry.org/rdap"}[tld] || "https://rdap.org";
    const r = await fetch(`${rdap}/domain/${kok}`, {redirect: "follow", headers: {Accept: "application/rdap+json"}, signal: AbortSignal.timeout(8000)});
    if (r.ok) { const e = ((await r.json()).events || []).find(x => x.eventAction === "registration"); if (e) yas = {kaynak: "rdap", gun: Math.floor((Date.now() - Date.parse(e.eventDate)) / 864e5)}; }
  } catch { /* desteklenmeyen uzantı */ }
  if (!yas) {
    const ilk = await env.DB.prepare("SELECT MIN(zaman) AS z FROM gonderim_kaydi WHERE kullanici_id = ? AND durum = 'gonderildi'").bind(kullaniciId).first();
    if (ilk?.z) yas = {kaynak: "pusula", gun: Math.floor((Date.now() - Date.parse(ilk.z)) / 864e5)};
  }
  sonuc.yas = yas;
  return sonuc;
}
