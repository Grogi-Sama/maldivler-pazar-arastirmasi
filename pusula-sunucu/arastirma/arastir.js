// Canlı araştırma hattı: açık veri → tekrar ayıklama → site okuma → MX kontrolü → yapay zekâ sınıflandırması.
// Her aday kaynak bağlantılarıyla döner; kaynağı olmayan bilgi aday kaydına girmez.

import {osmAra} from "./osm.js";
import {wikidataAra} from "./wikidata.js";
import {siteOku} from "./site-oku.js";
import {mxVarMi} from "./mx.js";
import {siniflandirmaIstemi, jsonDizisiAyikla} from "./yapay-zeka.js";

const alanAdi = w => String(w || "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").toLowerCase();
const anahtar = a => alanAdi(a.website) || a.name.toLowerCase().replace(/[^a-z0-9ğüşöçı]/g, "");

export function birlestir(listeler, mevcut = []) {
  const gorulen = new Set(mevcut.map(anahtar)), out = new Map();
  for (const a of listeler.flat()) {
    const k = anahtar(a);
    if (!k || gorulen.has(k)) continue;
    if (out.has(k)) { const x = out.get(k); x.kaynaklar.push(...a.kaynaklar); x.email ||= a.email; x.emailKaynagi ||= a.emailKaynagi; x.website ||= a.website; }
    else out.set(k, {...a, kaynaklar: [...a.kaynaklar]});
  }
  return [...out.values()];
}

export async function arastir({ulke, iso, tur, sektor, hedef, sirket, mod = "customer", mevcut = [], adet = 20, ai, bagimliliklar = {}}) {
  const {osm = osmAra, wikidata = wikidataAra, site = siteOku, mx = mxVarMi} = bagimliliklar;
  const notlar = [];
  const [o, w] = await Promise.allSettled([osm({ulke, iso, tur, limit: adet * 3}), wikidata({ulke, sektor, limit: adet * 2})]);
  if (o.status === "rejected") notlar.push("OpenStreetMap: " + o.reason.message);
  if (w.status === "rejected") notlar.push("Wikidata: " + w.reason.message);
  let adaylar = birlestir([o.value || [], w.value || []], mevcut).filter(a => a.website).slice(0, adet);

  // Siteyi oku; açılmayan site elenir. E-posta yalnızca sitede (veya OSM kaydında) yayımlanmışsa.
  const okunan = [];
  for (const a of adaylar) {
    const s = await site(a.website);
    if (!s.acildi) { notlar.push(`${a.name}: web sitesi açılmadı, elendi`); continue; }
    const e = s.epostalar[0];
    if (e) { a.email = e.adres; a.emailKaynagi = s.kaynak; a.kaynaklar.push({ad: "Firma web sitesi", url: s.kaynak}); a.kisiselOlabilir = !e.rol; }
    a.kaynakMetni = s.ozet;
    a.verified = !!a.email && await mx(a.email);
    okunan.push(a);
  }

  // Yapay zekâ yalnızca okunan metinden sınıflandırır; yoksa kural tabanlı basit puan.
  if (ai && okunan.length) {
    const sonuc = jsonDizisiAyikla(await ai.tamamla(siniflandirmaIstemi({sirket, hedef, mod, adaylar: okunan.map((a, i) => ({...a, id: i}))})));
    for (const r of sonuc) {
      const a = okunan[Number(r.id)]; if (!a) continue;
      Object.assign(a, {segment: r.segment, priority: ["A", "B", "C"].includes(r.oncelik) ? r.oncelik : "B", score: Math.max(0, Math.min(100, Number(r.puan) || 50)), why: r.neden || "", hook: r.giris || "", lang: r.dil === "Türkçe" ? "Türkçe" : "", yetersiz: !!r.yetersiz});
    }
  } else {
    for (const a of okunan) Object.assign(a, {segment: "Sınıflandırılmadı", priority: a.email ? "B" : "C", score: (a.email ? 50 : 30) + (a.kaynaklar.length > 1 ? 10 : 0), why: "Yapay zekâ kapalı; kaynaklara göre basit puan.", hook: ""});
  }
  return {adaylar: okunan.sort((x, y) => y.score - x.score), notlar};
}
