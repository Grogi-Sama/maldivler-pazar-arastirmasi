// Pusula – sunucu tarafı yapay zekâ (Gemini) ve web araştırması (Tavily + firma siteleri + MX)
// Anahtarlar Cloudflare gizli değişkenlerinde: GEMINI_API_KEY, TAVILY_API_KEY. Tarayıcıya hiç gönderilmez.
// Kural: e-posta adresi yapay zekâdan alınmaz; yalnızca firmanın kendi sitesinde yayımlanmışsa alınır.

// Kendiliğinden güncellenen ücretsiz model adları; ilki bulunamazsa (404) sıradakine geçilir.
const GEMINI_MODELLER = ["gemini-flash-lite-latest", "gemini-flash-latest"];

export class ServisHatasi extends Error { constructor(mesaj, durum = 502) { super(mesaj); this.durum = durum; } }

export async function gemini(env, istem, {json = true, sicaklik = 0.3} = {}) {
  if (!env.GEMINI_API_KEY) throw new ServisHatasi("Yapay zekâ anahtarı tanımlı değil.", 503);
  let r;
  for (const model of env.GEMINI_MODEL ? [env.GEMINI_MODEL] : GEMINI_MODELLER) {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: {"Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY},
      body: JSON.stringify({contents: [{role: "user", parts: [{text: istem}]}], generationConfig: {temperature: sicaklik, ...(json ? {responseMimeType: "application/json"} : {})}}),
    });
    if (r.status !== 404) break;
  }
  if (r.status === 429) throw new ServisHatasi("Yapay zekâ kotası doldu; biraz sonra tekrar deneyin.", 429);
  if (!r.ok) {
    const m = (await r.text()).slice(0, 300);
    throw new ServisHatasi(/API key not valid|API_KEY_INVALID/.test(m) ? "Yapay zekâ anahtarı geçersiz." : `Yapay zekâ yanıt vermedi (${r.status}).`, r.status === 400 || r.status === 403 ? 503 : 502);
  }
  const j = await r.json();
  return (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
}

export async function tavily(env, sorgu, adet = 8) {
  if (!env.TAVILY_API_KEY) throw new ServisHatasi("Web araması anahtarı tanımlı değil.", 503);
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {"Content-Type": "application/json", Authorization: `Bearer ${env.TAVILY_API_KEY}`},
    body: JSON.stringify({query: sorgu, max_results: adet, search_depth: "basic"}),
  });
  if (r.status === 401 || r.status === 403) throw new ServisHatasi("Web araması anahtarı geçersiz.", 503);
  if (r.status === 429 || r.status === 432) throw new ServisHatasi("Web araması aylık ücretsiz kotası doldu.", 429);
  if (!r.ok) throw new ServisHatasi(`Web araması yanıt vermedi (${r.status}).`);
  return ((await r.json()).results || []).map(x => ({baslik: String(x.title || ""), url: String(x.url || ""), ozet: String(x.content || "").slice(0, 700)}));
}

// --- firma sitesinden kurumsal e-posta ---
const ROL = /^(info|sales|satis|contact|iletisim|hello|enquir(y|ies)|inquir(y|ies)|office|admin|reservations?|export|ihracat|procurement|purchasing|satinalma|marketing|business|projects?|engineering)\b/i;
const COP = /\.(png|jpe?g|gif|svg|webp)$|^(example|test|your|name|email)@|@(example|domain|sentry|wixpress)\./i;
// İki seviyeli uzantılar (.com.tr, .co.uk ...) için marka adını doğru çıkarır: sevalkablo.com ↔ sevalkablo.com.tr aynı firma
const IKI_SEVIYE = /\.(com|net|org|gen|biz|info|web|av|bel|edu|gov|k12|co|ac|or|ne|gob)\.[a-z]{2}$/;
export function markaAdi(alan) {
  const a = String(alan).toLowerCase().replace(/^www\./, "");
  const parca = a.split(".");
  return IKI_SEVIYE.test(a) ? parca[parca.length - 3] : parca[parca.length - 2];
}
export function epostalariBul(html, alanAdi) {
  const metin = String(html).slice(0, 300_000).replace(/&#64;|&#x40;|\s*\[\s*at\s*\]\s*|\s*\(\s*at\s*\)\s*/gi, "@");
  const marka = markaAdi(alanAdi);
  return [...new Set((metin.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || []).map(x => x.toLowerCase()))]
    .filter(e => !COP.test(e) && markaAdi(e.split("@")[1]) === marka)
    .map(e => { const yerel = e.split("@")[0]; return {adres: e, rol: ROL.test(yerel) || yerel === marka}; })
    .sort((a, b) => b.rol - a.rol);
}
async function sayfa(url, ms = 6000) {
  try {
    const r = await fetch(url, {headers: {"User-Agent": "Mozilla/5.0 (compatible; PusulaBot/0.1; +https://pusula.onurtopuz02.workers.dev)"}, redirect: "follow", signal: AbortSignal.timeout(ms)});
    return r.ok && /text\/html/i.test(r.headers.get("content-type") || "") ? await r.text() : null;
  } catch { return null; }
}
export async function siteEposta(site) {
  const alan = String(site).replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!alan) return {acildi: false};
  let acildi = false, kisiselGoruldu = false;
  for (const yol of ["", "/iletisim", "/contact", "/tr/iletisim", "/contact-us"]) {
    const html = await sayfa(`https://${alan}${yol}`);
    if (html === null) { if (yol === "") return {acildi: false}; continue; }
    acildi = true;
    // Yalnızca kurumsal rol adresleri (info@, sales@ ...) alınır; kişisel adresler (ad.soyad@) toplanmaz.
    const e = epostalariBul(html, alan), kurumsal = e.find(x => x.rol);
    if (kurumsal) return {acildi, adres: kurumsal.adres, rol: true, kaynak: `https://${alan}${yol}`};
    if (e.length) kisiselGoruldu = true;
  }
  return {acildi, yalnizKisisel: kisiselGoruldu};
}
export async function mxVar(eposta) {
  const alan = String(eposta).split("@")[1]; if (!alan) return false;
  try { const j = await (await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(alan)}&type=MX`, {headers: {Accept: "application/dns-json"}})).json(); return (j.Answer || []).some(a => a.type === 15); } catch { return null; }
}

const alanAdi = w => String(w || "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").toLowerCase();

// Web araştırması: Tavily sonuçları → yapay zekâ yalnızca bu sonuçlarda geçen kuruluşları çıkarır → site + MX
export async function webArastir(env, {tarif, bolge, mod, adet = 10, sirket = {}, haric = []}) {
  adet = Math.max(3, Math.min(12, Number(adet) || 10));
  const hedef = mod === "supplier" ? "suppliers manufacturers distributors" : "companies";
  const sorgular = [`${tarif} ${bolge}`.slice(0, 380), mod === "supplier" ? `${tarif} firmaları listesi üretici`.slice(0, 380) : `${hedef} ${bolge} ${sirket.sektor || ""}`.slice(0, 380)];
  const sonuclar = (await Promise.all(sorgular.map(s => tavily(env, s, 8).catch(e => { if (e.durum === 503 || e.durum === 429) throw e; return []; })))).flat();
  const tekil = [...new Map(sonuclar.filter(s => s.url).map(s => [s.url, s])).values()].slice(0, 14);
  if (!tekil.length) return {adaylar: [], not: "Web aramasından sonuç gelmedi; tarifi değiştirip tekrar deneyin."};

  const istem = `You are a careful B2B research analyst. From the SEARCH RESULTS below, list real organisations that match the goal.
Our company: ${sirket.ad || ""} (${sirket.sektor || ""}). Products: ${sirket.urunler || ""}.
Goal: find ${mod === "supplier" ? "SUPPLIERS for our needs" : "CUSTOMERS or channel partners (EPCs, installers, distributors, end users)"}. Target: ${tarif}. Region: ${bolge}.
Exclude: ${haric.slice(0, 80).join("; ")}.
Strict rules:
- Only include organisations that are explicitly named in the search results. Never invent organisations, numbers, projects or emails.
- ${mod === "supplier" ? "Only include companies that actually sell or manufacture the products (manufacturers, distributors, wholesalers). EXCLUDE universities, research/R&D centres, laboratories, public institutions and ministries, associations and chambers, news sites, directories and marketplaces." : "Exclude news sites, directories, marketplaces and associations."}
- "website": the organisation's own domain only if it appears in the results (or is clearly its official site URL there); otherwise "".
- "source": the number in square brackets [n] of the search result that mentions it (an integer).
- "why": one Turkish sentence based only on what that result says.
- "hook": one factual opening sentence for a first email, based only on that result, in the target's language ("Türkçe" for Turkish organisations, otherwise English). Empty if nothing concrete.
- "segment": short Turkish label; reuse "EPC – tedarik ortağı", "Son kullanıcı – grup merkezi", "Son kullanıcı – resort", "Son kullanıcı – yeni proje", "Distribütör", "Üretici" when they fit.
Return a JSON array (max ${adet}) of {"name","kind","segment","region","website","source","priority":"A|B|C","score":0-100,"why","hook","lang":"Türkçe|English"}. Kind and region in Turkish.

SEARCH RESULTS:
${tekil.map((s, i) => `[${i}] ${s.baslik}\nURL: ${s.url}\n${s.ozet}`).join("\n\n")}`;
  let liste;
  try { liste = JSON.parse(await gemini(env, istem, {sicaklik: 0.2})); } catch (e) { if (e instanceof ServisHatasi) throw e; throw new ServisHatasi("Yapay zekâ yanıtı okunamadı; tekrar deneyin."); }
  if (!Array.isArray(liste)) liste = [];
  const haricSet = new Set(haric.map(x => String(x).toLowerCase()));
  const kaynakUrl = new Set(tekil.map(s => s.url));
  const adaylar = [];
  for (const a of liste.slice(0, adet)) {
    if (!a?.name || haricSet.has(String(a.name).toLowerCase())) continue;
    // Tedarikçi aramasında üniversite, Ar-Ge merkezi, kamu kurumu ve dernekler elenir (yapay zekâ atlasa bile)
    if (mod === "supplier" && /üniversite|university|tübitak|ar-?ge merkezi|r&d cent|research (cent|inst)|enstitü|institute|laborat|bakanlığ|ministry|belediye|municipality|derneği|association|odası|chamber|vakfı|foundation/i.test(`${a.name} ${a.kind || ""}`)) continue;
    const no = Number(String(a.source ?? "").replace(/[^0-9]/g, ""));
    const kaynak = Number.isInteger(no) && tekil[no] ? tekil[no].url : kaynakUrl.has(a.source) ? a.source : "";
    if (!kaynak) continue; // kaynağı arama sonuçlarında olmayan aday alınmaz
    adaylar.push({
      name: String(a.name), kind: String(a.kind || ""), segment: String(a.segment || "Diğer"), region: String(a.region || bolge),
      website: alanAdi(a.website), priority: ["A", "B", "C"].includes(a.priority) ? a.priority : "B", score: Math.max(0, Math.min(100, Number(a.score) || 50)),
      why: String(a.why || ""), hook: String(a.hook || ""), lang: a.lang === "Türkçe" ? "Türkçe" : "", email: "", emailSource: "", verified: false,
      sources: [{ad: "Web: " + (alanAdi(kaynak) || "kaynak"), url: kaynak}],
    });
  }
  // Firma sitelerinden kurumsal adres (paralel, zaman aşımlı)
  await Promise.all(adaylar.filter(a => a.website).map(async a => {
    const s = await siteEposta(a.website);
    if (!s.acildi) { a.why += " (Web sitesi açılmadı.)"; return; }
    if (s.yalnizKisisel) a.emailSource = "Sitede yalnızca kişisel adresler var; kurumsal adres bulunamadı (kişisel adres alınmaz).";
    a.sources.push({ad: "Firma sitesi", url: `https://${a.website}`});
    if (s.adres) {
      a.email = s.adres; a.emailSource = `Firmanın sitesinde yayımlanmış adres (${s.kaynak})`;
      const mx = await mxVar(s.adres);
      a.verified = mx === true; if (mx === true) a.emailSource += " · alan adı mail kabul ediyor (MX)";
    }
  }));
  adaylar.sort((x, y) => (!!y.email - !!x.email) || y.score - x.score);
  return {adaylar, not: `${tekil.length} web sonucundan ${adaylar.length} kuruluş; ${adaylar.filter(a => a.email).length} tanesinin kurumsal adresi kendi sitesinde bulundu.`};
}
