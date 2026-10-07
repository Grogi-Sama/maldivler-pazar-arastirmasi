// OpenStreetMap (Overpass) – konuma göre ücretsiz firma listesi.
// Kullanım kuralı: uygulamayı tanıtan User-Agent; paralel istek yok; ticari düzenli kullanımda
// genel sunucu (overpass-api.de) yerine ticari kullanıma açık sunucu ya da kendi kopyamız.

export const OVERPASS_SUNUCU = "https://overpass.private.coffee/api/interpreter";
export const USER_AGENT = "Pusula/0.1 (is gelistirme asistani; iletisim: onur.topuz@karea.com.tr)";

// Kullanıcının seçtiği "tür" → OSM etiketleri
export const TURLER = {
  "otel-resort": ['["tourism"~"^(hotel|resort|guest_house)$"]'],
  "fabrika": ['["man_made"="works"]', '["landuse"="industrial"]["name"]'],
  "sirket-ofisi": ['["office"~"^(company|energy_supplier|engineering|construction_company|estate_agent)$"]'],
  "enerji": ['["office"="energy_supplier"]', '["power"="plant"]["operator"]', '["craft"~"^(electrician|photovoltaic)$"]'],
  "magaza": ['["shop"]["name"]'],
};

const kacis = s => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// Ülke adına (İngilizce) ya da ISO koduna göre sorgu
export function overpassSorgusu({ulke, iso, tur = "otel-resort", limit = 60}) {
  const filtre = TURLER[tur] || TURLER["otel-resort"];
  const alan = iso ? `area["ISO3166-1"="${kacis(iso.toUpperCase())}"][admin_level=2]->.a;` : `area["name:en"="${kacis(ulke)}"][admin_level=2]->.a;`;
  return `[out:json][timeout:60];${alan}(${filtre.map(f => `nwr${f}(area.a);`).join("")});out center tags ${Number(limit) || 60};`;
}

// Overpass cevabını Pusula aday biçimine çevirir. Yalnızca adı olan kayıtlar alınır.
export function osmSonuclari(json) {
  const out = [];
  for (const e of json?.elements || []) {
    const t = e.tags || {};
    const ad = t["name:en"] || t.name;
    if (!ad) continue;
    const web = t.website || t["contact:website"] || t.url || "";
    const eposta = (t.email || t["contact:email"] || "").split(";")[0].trim();
    out.push({
      name: ad,
      website: web.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      email: eposta,
      phone: t.phone || t["contact:phone"] || "",
      region: [t["addr:city"] || t["addr:island"], t["addr:country"]].filter(Boolean).join(", "),
      kind: t.tourism || t.office || t.man_made || t.shop || t.craft || "",
      kaynaklar: [{ad: "OpenStreetMap", url: `https://www.openstreetmap.org/${e.type}/${e.id}`}],
      emailKaynagi: eposta ? "OpenStreetMap kaydı" : "",
    });
  }
  return out;
}

export async function osmAra(secenek, {fetchFn = fetch, sunucu = OVERPASS_SUNUCU} = {}) {
  const r = await fetchFn(sunucu, {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT},
    body: "data=" + encodeURIComponent(overpassSorgusu(secenek)),
  });
  if (!r.ok) throw new Error(`OpenStreetMap yanıt vermedi (${r.status})`);
  return osmSonuclari(await r.json());
}
