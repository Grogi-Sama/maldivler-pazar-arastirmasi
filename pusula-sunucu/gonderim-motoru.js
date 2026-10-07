// Pusula otonom gönderim motoru.
// Her kullanıcı için: otonom açıksa ve gönderim saatindeyse bugünün planını çıkarır, mailleri tek tek,
// aralarında rastgele bekleyerek kullanıcının kendi Outlook/Gmail hesabından gönderir.
// Depo (veritabanı) ve sağlayıcı dışarıdan verilir; böylece motor test edilebilir ve veritabanından bağımsızdır.

import {VARSAYILAN_GONDERIM, VARSAYILAN_OTONOM, yerelZaman, gonderimSaatinde, gonderimPlani, rastgeleAralikMs, frenNedeni, addDays} from "./kurallar.js";

/**
 * depo arayüzü (gerçek sürümde Postgres):
 *   kullanici(id) -> {gonderim, otonom, sekans: [{key, day}], imza, imzaTuru, imzaGorsel: {base64, tur}, test: {on, addresses}}
 *   calismaAlani(id) -> {adaylar: [...], taslaklar: [...], engelliler: [...]}
 *   bugunGiden(id, tarih) -> sayı
 *   istatistik(id, tarih) -> {bugunListedenCikan, sonGonderilen, sonGeriDonen}
 *   taslakEkle(id, aday, tur) -> taslak | null   (şablondan; zaten varsa null)
 *   gonderildi(id, taslak, an)                     (adayın adımını, sonraki tarihi ve günlüğü günceller)
 *   otonomDurdur(id, neden)
 *   hata(id, taslak, hata)
 */
export async function kullaniciTuru({kullaniciId, depo, saglayici, kalite, simdi = () => new Date(), bekle = ms => new Promise(r => setTimeout(r, ms)), rnd = Math.random, durduMu = () => false}) {
  const an = simdi();
  const k = await depo.kullanici(kullaniciId);
  const gonderim = {...VARSAYILAN_GONDERIM, ...k.gonderim};
  const otonom = {...VARSAYILAN_OTONOM, ...k.otonom};
  if (!otonom.on) return {durum: "kapali", gonderilen: 0};
  if (!gonderimSaatinde(an, gonderim)) return {durum: "saat-disi", gonderilen: 0};

  const bugun = yerelZaman(an, gonderim.timeZone).tarih;
  const fren = frenNedeni(await depo.istatistik(kullaniciId, bugun));
  if (fren) { await depo.otonomDurdur(kullaniciId, fren); return {durum: "fren", neden: fren, gonderilen: 0}; }

  const alan = await depo.calismaAlani(kullaniciId);
  const engelliler = new Set(alan.engelliler.map(x => x.toLowerCase()));

  // Zamanı gelen takipleri (ve isteğe bağlı yeni tanışmaları) taslağa çevir
  for (const a of alan.adaylar) {
    const sonraki = k.sekans[a.step + 1];
    if (otonom.followups && a.status === "sent" && sonraki && a.nextAt && a.nextAt <= bugun) {
      const t = await depo.taslakEkle(kullaniciId, a, sonraki.key); if (t) alan.taslaklar.push(t);
    }
  }
  if (otonom.intros) {
    for (const a of alan.adaylar.filter(a => a.status === "new" && a.email && a.priority !== "C").sort((x, y) => y.score - x.score)) {
      const t = await depo.taslakEkle(kullaniciId, a, "intro"); if (t) alan.taslaklar.push(t);
    }
  }

  const plan = gonderimPlani({
    taslaklar: alan.taslaklar, adaylar: new Map(alan.adaylar.map(a => [a.id, a])), otonom, gonderim,
    bugunGiden: await depo.bugunGiden(kullaniciId, bugun), bugun, engelliler, kalite,
  });

  let gonderilen = 0;
  for (const [i, t] of plan.entries()) {
    if (durduMu() || (i > 0 && !gonderimSaatinde(simdi(), gonderim))) break;
    const aday = alan.adaylar.find(a => a.id === t.leadId);
    for (let deneme = 0; deneme < 2; deneme++) {
      try {
        await saglayici.gonder({kime: aliciAdresi(k, aday, alan.adaylar), konu: t.subject, ...mailGovdesi(t.body, k)});
        await depo.gonderildi(kullaniciId, t, simdi());
        gonderilen++;
        break;
      } catch (e) {
        await depo.hata(kullaniciId, t, e);
        if (e.tur === "yetki") { await depo.otonomDurdur(kullaniciId, e.message); return {durum: "yetki", gonderilen}; }
        if (e.tur !== "gecici") break; // kalıcı hata: bu taslağı atla, diğerlerine devam
        await bekle((e.tekrarSn || 60) * 1000); // geçici hata: bekleyip bir kez daha dene
      }
    }
    if (i < plan.length - 1) await bekle(rastgeleAralikMs(gonderim, rnd));
  }
  return {durum: "tamam", gonderilen, planlanan: plan.length};
}

// Mail gövdesi: yazılı imza metne eklenir; görsel imza (k.imzaGorsel = {base64, tur}) HTML sürüme gömülür.
// k.imzaTuru: "text" | "image" | "both". Görsel modda taslak metni zaten kapanış satırıyla biter.
export function mailGovdesi(govde, k) {
  const tur = k.imzaTuru || "text";
  const metin = govde + (tur !== "image" && k.imza && !govde.includes(k.imza) ? "\n\n" + k.imza : "");
  if (tur === "text" || !k.imzaGorsel?.base64) return {govdeMetin: metin};
  const kac = x => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<div style="font-family:Calibri,Arial,sans-serif;font-size:11pt">${metin.split(/\n{2,}/).map(p => `<p style="margin:0 0 12px">${kac(p).replace(/\n/g, "<br>")}</p>`).join("")}<img src="cid:imza" alt="${kac(k.imzaAlt || "İmza")}" style="max-width:480px"></div>`;
  return {govdeMetin: metin, govdeHtml: html, ekler: [{ad: "imza.jpg", tur: k.imzaGorsel.tur || "image/jpeg", base64: k.imzaGorsel.base64, cid: "imza"}]};
}

// Test modu: kullanıcı test adresi verdiyse mail firmaya değil, bu adreslere sırayla gider.
export function aliciAdresi(k, aday, adaylar) {
  const test = k.test?.on ? (k.test.addresses || []) : [];
  if (!test.length) return aday.email;
  return test[Math.max(0, adaylar.findIndex(a => a.id === aday.id)) % test.length];
}

// Sonraki adım tarihi: ilk mail tarihine sekanstaki gün eklenir (demodaki markSent ile aynı)
export function sonrakiTarih(aday, sekans) {
  const sonraki = sekans[aday.step + 1];
  return sonraki && aday.sentAt ? addDays(aday.sentAt, sonraki.day) : "";
}
