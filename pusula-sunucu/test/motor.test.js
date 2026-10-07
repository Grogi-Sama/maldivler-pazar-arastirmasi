import {test} from "node:test";
import assert from "node:assert/strict";
import {kullaniciTuru} from "../gonderim-motoru.js";
import {gonderimSaatinde, gunlukKota, engelNedeni} from "../kurallar.js";
import {microsoftSaglayici, GonderimHatasi} from "../saglayicilar/microsoft.js";
import {mimeOlustur} from "../saglayicilar/gmail.js";

// Çarşamba 10:00 İstanbul = 07:00 UTC
const CARSAMBA_10 = new Date("2026-10-07T07:00:00Z");
const PAZAR_10 = new Date("2026-10-11T07:00:00Z");
const SEKANS = [{key: "intro", day: 0}, {key: "f1", day: 3}, {key: "f2", day: 7}, {key: "close", day: 14}];

function kur({otonom = {}, adaylar, taslaklar = [], istatistik = {}, bugunGiden = 0, test}) {
  const kayit = {gonderilen: [], durdurma: null, hatalar: []};
  const depo = {
    kullanici: async () => ({gonderim: {dailyLimit: 30}, otonom: {on: true, dailyMax: 3, ...otonom}, sekans: SEKANS, imza: "Onur", test}),
    calismaAlani: async () => ({adaylar, taslaklar: [...taslaklar], engelliler: ["@engelli.com"]}),
    bugunGiden: async () => bugunGiden,
    istatistik: async () => ({bugunListedenCikan: 0, sonGonderilen: 0, sonGeriDonen: 0, ...istatistik}),
    taslakEkle: async (_, a, tur) => ({id: "t-" + a.id + "-" + tur, leadId: a.id, type: tur, subject: "Takip", body: "Merhaba"}),
    gonderildi: async (_, t) => kayit.gonderilen.push(t.id),
    otonomDurdur: async (_, neden) => { kayit.durdurma = neden; },
    hata: async (_, t, e) => kayit.hatalar.push(e.tur),
  };
  return {depo, kayit};
}
const aday = (id, ek = {}) => ({id, email: `${id}@firma.com`, status: "draft", step: -1, verified: true, score: 50, priority: "B", ...ek});
const taslak = (leadId, type = "intro") => ({id: "t-" + leadId, leadId, type, subject: "Merhaba", body: "Metin"});
const temel = {kalite: () => 90, simdi: () => CARSAMBA_10, bekle: async () => {}};

test("gönderim saatleri ve hafta sonu", () => {
  const g = {startHour: 9, endHour: 17, weekdaysOnly: true, timeZone: "Europe/Istanbul"};
  assert.equal(gonderimSaatinde(CARSAMBA_10, g), true);
  assert.equal(gonderimSaatinde(PAZAR_10, g), false);
  assert.equal(gonderimSaatinde(new Date("2026-10-07T15:00:00Z"), g), false); // 18:00 İstanbul
});

test("günlük kota: düşük olan sınır geçerli", () => {
  assert.equal(gunlukKota({dailyMax: 20}, {dailyLimit: 30}, 5), 15);
  assert.equal(gunlukKota({dailyMax: 50}, {dailyLimit: 30}, 29), 1);
  assert.equal(gunlukKota({dailyMax: 10}, {dailyLimit: 30}, 12), 0);
});

test("otonom kapalıyken hiçbir şey gönderilmez", async () => {
  const {depo, kayit} = kur({otonom: {on: false}, adaylar: [aday("a")], taslaklar: [taslak("a")]});
  const r = await kullaniciTuru({kullaniciId: "u", depo, saglayici: {gonder: async () => ({ok: true})}, ...temel});
  assert.equal(r.durum, "kapali"); assert.equal(kayit.gonderilen.length, 0);
});

test("hafta sonu çalışmaz", async () => {
  const {depo, kayit} = kur({adaylar: [aday("a")], taslaklar: [taslak("a")]});
  const r = await kullaniciTuru({kullaniciId: "u", depo, saglayici: {gonder: async () => ({ok: true})}, ...temel, simdi: () => PAZAR_10});
  assert.equal(r.durum, "saat-disi"); assert.equal(kayit.gonderilen.length, 0);
});

test("kota, kurallar ve sıralama: takip önce, engelli/doğrulanmamış/düşük puanlı ve cevaplar gitmez", async () => {
  const adaylar = [
    aday("yuksek", {score: 90}), aday("dusuk", {score: 10}), aday("orta", {score: 50}),
    aday("dogrulanmamis", {verified: false}), aday("engelli", {email: "x@engelli.com"}),
    aday("takip", {status: "sent", step: 0, sentAt: "2026-10-04", nextAt: "2026-10-07"}),
    aday("cevap"),
  ];
  const taslaklar = [taslak("yuksek"), taslak("dusuk"), taslak("orta"), taslak("dogrulanmamis"), taslak("engelli"), {...taslak("cevap"), type: "reply"}];
  const {depo, kayit} = kur({adaylar, taslaklar});
  const gidenler = [];
  const r = await kullaniciTuru({kullaniciId: "u", depo, saglayici: {gonder: async m => { gidenler.push(m.kime); return {ok: true}; }}, ...temel});
  assert.equal(r.gonderilen, 3); // dailyMax 3
  assert.deepEqual(kayit.gonderilen, ["t-takip-f1", "t-yuksek", "t-orta"]);
  assert.ok(!gidenler.some(e => /engelli|dogrulanmamis|cevap/.test(e)));
});

test("güvenlik freni: aynı gün 2 listeden çıkma → durur", async () => {
  const {depo, kayit} = kur({adaylar: [aday("a")], taslaklar: [taslak("a")], istatistik: {bugunListedenCikan: 2}});
  const r = await kullaniciTuru({kullaniciId: "u", depo, saglayici: {gonder: async () => ({ok: true})}, ...temel});
  assert.equal(r.durum, "fren"); assert.match(kayit.durdurma, /listeden/); assert.equal(kayit.gonderilen.length, 0);
});

test("yetki hatası → otonom durur, kullanıcıdan yeniden bağlanması istenir", async () => {
  const {depo, kayit} = kur({adaylar: [aday("a"), aday("b")], taslaklar: [taslak("a"), taslak("b")]});
  const r = await kullaniciTuru({kullaniciId: "u", depo, saglayici: {gonder: async () => { throw new GonderimHatasi("bağlantı", {tur: "yetki"}); }}, ...temel});
  assert.equal(r.durum, "yetki"); assert.ok(kayit.durdurma); assert.equal(kayit.gonderilen.length, 0);
});

test("geçici hata → bekleyip bir kez daha dener", async () => {
  const {depo, kayit} = kur({adaylar: [aday("a")], taslaklar: [taslak("a")]});
  let n = 0;
  const r = await kullaniciTuru({kullaniciId: "u", depo, saglayici: {gonder: async () => { if (n++ === 0) throw new GonderimHatasi("yavaş", {tur: "gecici", tekrarSn: 1}); return {ok: true}; }}, ...temel});
  assert.equal(r.gonderilen, 1); assert.deepEqual(kayit.hatalar, ["gecici"]);
});

test("mailler arasında 3–8 dakika rastgele bekler", async () => {
  const {depo} = kur({adaylar: [aday("a"), aday("b"), aday("c")], taslaklar: [taslak("a"), taslak("b"), taslak("c")]});
  const beklemeler = [];
  await kullaniciTuru({kullaniciId: "u", depo, saglayici: {gonder: async () => ({ok: true})}, ...temel, bekle: async ms => beklemeler.push(ms)});
  assert.equal(beklemeler.length, 2);
  for (const ms of beklemeler) assert.ok(ms >= 3 * 60_000 && ms <= 8 * 60_000);
});

test("Microsoft Graph isteği doğru biçimde", async () => {
  let istek;
  const s = microsoftSaglayici({erisimAnahtari: async () => "TOKEN", fetchFn: async (url, o) => { istek = {url, ...o}; return {status: 202, headers: new Map()}; }});
  await s.gonder({kime: "info@firma.com", konu: "Merhaba", govdeMetin: "Metin"});
  assert.equal(istek.url, "https://graph.microsoft.com/v1.0/me/sendMail");
  assert.equal(istek.headers.Authorization, "Bearer TOKEN");
  const b = JSON.parse(istek.body);
  assert.equal(b.message.toRecipients[0].emailAddress.address, "info@firma.com");
  assert.equal(b.saveToSentItems, true);
});

test("Microsoft 429 → geçici hata", async () => {
  const s = microsoftSaglayici({erisimAnahtari: async () => "T", fetchFn: async () => ({status: 429, headers: new Map([["Retry-After", "30"]]), text: async () => ""})});
  await assert.rejects(s.gonder({kime: "a@b.com", konu: "x", govdeMetin: "y"}), e => e.tur === "gecici" && e.tekrarSn === 30);
});

test("Gmail MIME: Türkçe konu ve tek tıkla listeden çıkma başlığı", () => {
  const m = mimeOlustur({kimden: "a@b.com", kime: "c@d.com", konu: "Güneş enerjisi", govdeMetin: "Merhaba", listedenCikUrl: "https://pusula.app/cik/123"});
  assert.match(m, /Subject: =\?UTF-8\?B\?/);
  assert.match(m, /List-Unsubscribe-Post: List-Unsubscribe=One-Click/);
});

test("engel nedenleri okunur Türkçe", () => {
  const n = engelNedeni(taslak("a"), aday("a", {verified: false}), {requireVerified: true, minQuality: 80}, {bugun: "2026-10-07", engelliler: new Set(), kalite: () => 90});
  assert.equal(n, "Adres doğrulanmadı");
});

test("test modu: mailler firmaya değil test adreslerine sırayla gider", async () => {
  const {depo, kayit} = kur({adaylar: [aday("a"), aday("b")], taslaklar: [taslak("a"), taslak("b")], test: {on: true, addresses: ["onur@test1.com", "onur@test2.com"]}});
  const gidenler = [];
  await kullaniciTuru({kullaniciId: "u", depo, saglayici: {gonder: async m => { gidenler.push(m.kime); return {ok: true}; }}, ...temel});
  assert.deepEqual(gidenler.sort(), ["onur@test1.com", "onur@test2.com"]);
  assert.equal(kayit.gonderilen.length, 2);
});
