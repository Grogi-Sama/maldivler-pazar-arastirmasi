// Firmanın kendi web sitesinden kurumsal e-posta ve kısa tanıtım metni çıkarır.
// Kural: adres YALNIZCA sitede yayımlanmışsa alınır, tahmin edilmez; kişisel görünen adresler
// (ad.soyad@) kurumsal rol adreslerinin (info@, sales@...) arkasına konur ve işaretlenir.

const ILETISIM_YOLLARI = ["", "/contact", "/contact-us", "/iletisim", "/bize-ulasin", "/about", "/hakkimizda"];
const ROL = /^(info|sales|satis|contact|iletisim|hello|enquir(y|ies)|inquir(y|ies)|office|admin|reservations?|export|ihracat|procurement|purchasing|satinalma|marketing|business|bd|projects?|engineering)\b/i;
const COP = /\.(png|jpe?g|gif|svg|webp)$|^(example|test|your|name|email)@|@(example|domain|sentry|wixpress)\./i;

export function epostalariBul(html, alanAdi) {
  const metin = String(html)
    .replace(/&#64;|&#x40;|\s*\[\s*at\s*\]\s*|\s*\(\s*at\s*\)\s*/gi, "@")
    .replace(/\s*\[\s*dot\s*\]\s*|\s*\(\s*dot\s*\)\s*/gi, ".");
  const bulunan = new Set((metin.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || []).map(x => x.toLowerCase().replace(/\.$/, "")));
  const kok = alanAdi.replace(/^www\./, "").split(".").slice(-2).join(".");
  return [...bulunan]
    .filter(e => !COP.test(e))
    .filter(e => e.split("@")[1].endsWith(kok)) // yalnızca firmanın kendi alan adı
    .map(e => ({adres: e, rol: ROL.test(e.split("@")[0])}))
    .sort((a, b) => b.rol - a.rol);
}

export function ozetMetin(html, max = 1500) {
  const baslik = (String(html).match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || "";
  const aciklama = (String(html).match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || [])[1] || "";
  const govde = String(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return [baslik, aciklama, govde].filter(Boolean).join(" | ").slice(0, max);
}

// Siteyi gezer: ana sayfa + iletişim sayfaları. Ağ hatası olan site "açılmadı" döner (aday elenir).
export async function siteOku(alanAdi, {fetchFn = fetch, zamanAsimiMs = 10000} = {}) {
  const site = alanAdi.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const sonuc = {acildi: false, epostalar: [], ozet: "", kaynak: ""};
  for (const yol of ILETISIM_YOLLARI) {
    const url = `https://${site}${yol}`;
    try {
      const r = await fetchFn(url, {headers: {"User-Agent": "Pusula/0.1 (+iletisim: onur.topuz@karea.com.tr)"}, redirect: "follow", signal: AbortSignal.timeout(zamanAsimiMs)});
      if (!r.ok) continue;
      const html = await r.text();
      if (!sonuc.acildi) { sonuc.acildi = true; sonuc.ozet = ozetMetin(html); }
      const e = epostalariBul(html, site);
      if (e.length) { sonuc.epostalar = e; sonuc.kaynak = url; break; }
    } catch { /* bu sayfa açılmadı; sıradakini dene */ }
  }
  return sonuc;
}
