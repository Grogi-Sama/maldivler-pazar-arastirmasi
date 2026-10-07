import {test} from "node:test";
import assert from "node:assert/strict";
import {overpassSorgusu, osmSonuclari} from "../arastirma/osm.js";
import {wikidataSorgusu, wikidataSonuclari} from "../arastirma/wikidata.js";
import {epostalariBul, siteOku} from "../arastirma/site-oku.js";
import {mxVarMi} from "../arastirma/mx.js";
import {arastir, birlestir} from "../arastirma/arastir.js";
import {jsonDizisiAyikla, siniflandirmaIstemi} from "../arastirma/yapay-zeka.js";

test("Overpass sorgusu ülke ve türe göre kurulur, tırnak kaçırılır", () => {
  const q = overpassSorgusu({ulke: 'Mal"dives', tur: "otel-resort", limit: 10});
  assert.match(q, /area\["name:en"="Mal\\"dives"\]/);
  assert.match(q, /tourism/);
  assert.match(q, /out center tags 10;/);
  assert.match(overpassSorgusu({iso: "mv"}), /ISO3166-1"="MV"/);
});

test("OSM sonuçları: adsız kayıt atlanır, e-posta yalnızca kayıtta varsa alınır", () => {
  const r = osmSonuclari({elements: [
    {type: "node", id: 1, tags: {name: "Sun Resort", website: "https://sunresort.mv/", email: "info@sunresort.mv", tourism: "resort", "addr:city": "Malé"}},
    {type: "way", id: 2, tags: {tourism: "hotel"}},
    {type: "node", id: 3, tags: {name: "Blue Hotel", "contact:website": "bluehotel.com"}},
  ]});
  assert.equal(r.length, 2);
  assert.equal(r[0].website, "sunresort.mv");
  assert.equal(r[0].email, "info@sunresort.mv");
  assert.equal(r[0].kaynaklar[0].url, "https://www.openstreetmap.org/node/1");
  assert.equal(r[1].email, "");
});

test("Wikidata sorgusu ve sonuçları", () => {
  assert.match(wikidataSorgusu({ulke: "Maldives", sektor: "Hotel"}), /CONTAINS\(LCASE\(\?sl\), "hotel"\)/);
  const r = wikidataSonuclari({results: {bindings: [
    {firma: {value: "http://www.wikidata.org/entity/Q1"}, firmaLabel: {value: "Atoll Energy"}, web: {value: "https://atoll.mv"}},
    {firma: {value: "http://www.wikidata.org/entity/Q1"}, firmaLabel: {value: "Atoll Energy"}, web: {value: "https://atoll.mv"}},
    {firma: {value: "http://www.wikidata.org/entity/Q2"}, firmaLabel: {value: "Q2"}},
  ]}});
  assert.equal(r.length, 1);
  assert.equal(r[0].website, "atoll.mv");
});

test("E-posta çıkarma: yalnızca firmanın alan adı, gizlenmiş adresler çözülür, rol adresi önde", () => {
  const html = `<a href="mailto:ahmet.yilmaz@firma.com.tr">Ahmet</a> info [at] firma.com.tr
    destek@gmail.com logo@2x.png sales&#64;firma.com.tr test@example.com`;
  const e = epostalariBul(html, "www.firma.com.tr");
  assert.deepEqual(e.map(x => x.adres), ["info@firma.com.tr", "sales@firma.com.tr", "ahmet.yilmaz@firma.com.tr"]);
  assert.equal(e[2].rol, false);
});

test("Site okuma: iletişim sayfasındaki adresi bulur; açılmayan site işaretlenir", async () => {
  const sayfalar = {"https://firma.com/": "<title>Firma</title><p>Güneş enerjisi</p>", "https://firma.com/contact": "Write to info@firma.com"};
  const fetchFn = async url => sayfalar[url] !== undefined ? {ok: true, text: async () => sayfalar[url]} : {ok: false};
  const s = await siteOku("firma.com/", {fetchFn});
  assert.equal(s.acildi, true);
  assert.equal(s.epostalar[0].adres, "info@firma.com");
  assert.equal(s.kaynak, "https://firma.com/contact");
  const k = await siteOku("kapali.com", {fetchFn: async () => { throw new Error("yok"); }});
  assert.equal(k.acildi, false);
});

test("MX kontrolü", async () => {
  assert.equal(await mxVarMi("a@var.com", {resolveMx: async () => [{exchange: "mx.var.com"}]}), true);
  assert.equal(await mxVarMi("a@yok.com", {resolveMx: async () => { throw new Error("ENOTFOUND"); }}), false);
  assert.equal(await mxVarMi("gecersiz"), false);
});

test("Birleştirme: aynı alan adı tek aday olur, kaynaklar birleşir, listedekiler atlanır", () => {
  const r = birlestir([
    [{name: "A Resort", website: "a.mv", email: "", kaynaklar: [{ad: "OpenStreetMap"}]}],
    [{name: "A Resort Ltd", website: "https://www.a.mv/", email: "info@a.mv", kaynaklar: [{ad: "Wikidata"}]}, {name: "B", website: "b.mv", kaynaklar: [{ad: "Wikidata"}]}],
  ], [{name: "B", website: "b.mv"}]);
  assert.equal(r.length, 1);
  assert.equal(r[0].kaynaklar.length, 2);
  assert.equal(r[0].email, "info@a.mv");
});

test("Araştırma hattı: sitesi açılmayan elenir, yapay zekâ yalnızca okunanları sınıflandırır, MX doğrular", async () => {
  const bag = {
    osm: async () => [{name: "Açık Resort", website: "acik.mv", email: "", kaynaklar: [{ad: "OpenStreetMap", url: "o1"}]}, {name: "Kapalı Resort", website: "kapali.mv", email: "", kaynaklar: [{ad: "OpenStreetMap", url: "o2"}]}],
    wikidata: async () => { throw new Error("zaman aşımı"); },
    site: async w => w === "acik.mv" ? {acildi: true, epostalar: [{adres: "info@acik.mv", rol: true}], ozet: "Resort, dizel jeneratör", kaynak: "https://acik.mv/contact"} : {acildi: false, epostalar: []},
    mx: async () => true,
  };
  let istem = "";
  const ai = {tamamla: async i => { istem = i; return '```json\n[{"id":0,"segment":"Son kullanıcı – resort","oncelik":"A","puan":82,"neden":"Dizel kullanıyor.","giris":"Sitenizde dizel jeneratör kullandığınızı okuduk.","dil":"English"}]\n```'; }};
  const {adaylar, notlar} = await arastir({ulke: "Maldives", tur: "otel-resort", hedef: "resortlar", sirket: {ad: "Karea", urunler: "ESS"}, ai, bagimliliklar: bag});
  assert.equal(adaylar.length, 1);
  assert.equal(adaylar[0].email, "info@acik.mv");
  assert.equal(adaylar[0].verified, true);
  assert.equal(adaylar[0].priority, "A");
  assert.ok(adaylar[0].kaynaklar.some(k => k.url === "https://acik.mv/contact"));
  assert.ok(notlar.some(n => /Wikidata/.test(n)) && notlar.some(n => /Kapalı Resort/.test(n)));
  assert.match(istem, /E-posta adresi üretme/);
  assert.ok(!istem.includes("kapali.mv"));
});

test("Yapay zekâ kapalıyken kural tabanlı puan", async () => {
  const bag = {osm: async () => [{name: "X", website: "x.com", email: "", kaynaklar: [{ad: "OSM"}]}], wikidata: async () => [], site: async () => ({acildi: true, epostalar: [], ozet: ""}), mx: async () => false};
  const {adaylar} = await arastir({ulke: "Turkey", bagimliliklar: bag});
  assert.equal(adaylar[0].priority, "C");
  assert.equal(adaylar[0].verified, false);
});

test("JSON ayıklama ve istem kuralları", () => {
  assert.deepEqual(jsonDizisiAyikla('Sonuç: [{"id":1}] tamam'), [{id: 1}]);
  assert.throws(() => jsonDizisiAyikla("yok"));
  const i = siniflandirmaIstemi({sirket: {ad: "K", urunler: "U"}, hedef: "h", mod: "supplier", adaylar: [{id: 0, name: "F", website: "f.com", kaynakMetni: "metin"}]});
  assert.match(i, /tedarikçi/);
  assert.match(i, /uydurma/);
});
