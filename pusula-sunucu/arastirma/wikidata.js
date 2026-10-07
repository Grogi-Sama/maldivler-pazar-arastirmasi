// Wikidata – ücretsiz şirket bilgisi (sektör, merkez, web sitesi). Büyük ve orta ölçekli firmalar için iyi.

export const WIKIDATA = "https://query.wikidata.org/sparql";
const kacis = s => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// ülke: İngilizce ad (ör. "Maldives"), sektor: anahtar kelime (ör. "hotel", "solar", "energy")
export function wikidataSorgusu({ulke, sektor, limit = 40}) {
  return `SELECT DISTINCT ?firma ?firmaLabel ?web ?sektorLabel ?merkezLabel WHERE {
  ?ulke rdfs:label "${kacis(ulke)}"@en; wdt:P31 wd:Q6256.
  ?firma wdt:P17 ?ulke; wdt:P856 ?web; wdt:P452 ?sektor.
  OPTIONAL { ?firma wdt:P159 ?merkez. }
  ${sektor ? `?sektor rdfs:label ?sl. FILTER(LANG(?sl) = "en" && CONTAINS(LCASE(?sl), "${kacis(sektor).toLowerCase()}"))` : ""}
  SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en". }
} LIMIT ${Number(limit) || 40}`;
}

export function wikidataSonuclari(json) {
  const gorulen = new Set(), out = [];
  for (const b of json?.results?.bindings || []) {
    const ad = b.firmaLabel?.value, url = b.firma?.value;
    if (!ad || /^Q\d+$/.test(ad) || gorulen.has(url)) continue;
    gorulen.add(url);
    out.push({
      name: ad,
      website: (b.web?.value || "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
      email: "",
      region: b.merkezLabel?.value || "",
      kind: b.sektorLabel?.value || "",
      kaynaklar: [{ad: "Wikidata", url}],
      emailKaynagi: "",
    });
  }
  return out;
}

export async function wikidataAra(secenek, {fetchFn = fetch} = {}) {
  const r = await fetchFn(`${WIKIDATA}?format=json&query=${encodeURIComponent(wikidataSorgusu(secenek))}`, {
    headers: {Accept: "application/sparql-results+json", "User-Agent": "Pusula/0.1 (onur.topuz@karea.com.tr)"},
  });
  if (!r.ok) throw new Error(`Wikidata yanıt vermedi (${r.status})`);
  return wikidataSonuclari(await r.json());
}
