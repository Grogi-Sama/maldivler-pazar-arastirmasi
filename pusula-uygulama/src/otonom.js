// Sunucuda otonom gönderim – Cloudflare zamanlanmış görevi (her 5 dakikada bir).
// Her turda kullanıcı başına EN FAZLA 1 mail gönderilir; sonraki gönderim zamanı ayarlardaki
// "mailler arası en az–en çok dakika" aralığında rastgele seçilir (insan temposu).
// Kurallar (kalite, doğrulama, engel listesi, takip hazırlama, işaretleme) uygulamadan üretilen
// motor-uretilmis.js ile birebir aynıdır.

import {motor} from "./motor-uretilmis.js";
import {gonder, PostaHatasi} from "./posta.js";

const SAAT_DILIMI = "Europe/Istanbul";

function yerel(an = new Date(), tz = SAAT_DILIMI) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "short"}).formatToParts(an).map(x => [x.type, x.value]));
  return {tarih: `${p.year}-${p.month}-${p.day}`, saat: Number(p.hour), gun: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday)};
}

async function ayarOku(env, anahtar) { return (await env.DB.prepare("SELECT deger FROM ayar WHERE anahtar = ?").bind(anahtar).first())?.deger; }
async function ayarYaz(env, anahtar, deger) { await env.DB.prepare("INSERT INTO ayar (anahtar, deger) VALUES (?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger").bind(anahtar, String(deger)).run(); }

// Çalışma alanını iyimser kilitle günceller; araya kullanıcı kaydı girerse taze veriye aynı değişikliği yeniden uygular.
async function alanGuncelle(env, kullaniciId, degistir) {
  for (let i = 0; i < 4; i++) {
    const r = await env.DB.prepare("SELECT veri, surum FROM calisma_alani WHERE kullanici_id = ?").bind(kullaniciId).first();
    if (!r) return null;
    const veri = JSON.parse(r.veri);
    const sonuc = degistir(veri);
    if (sonuc === false) return veri; // değişiklik yok
    const u = await env.DB.prepare("UPDATE calisma_alani SET veri = ?, surum = ?, guncelleme = ? WHERE kullanici_id = ? AND surum = ?")
      .bind(JSON.stringify(veri), r.surum + 1, new Date().toISOString(), kullaniciId, r.surum).run();
    if (u.meta.changes) return veri;
  }
  throw new Error("Çalışma alanı güncellenemedi (eşzamanlı değişiklik).");
}

// Tek kullanıcı için bir tur. zorla: "Şimdi bir tur çalıştır" düğmesi (saat ve tempo beklemesi atlanır, kurallar atlanmaz).
export async function kullaniciTuru(env, kullaniciId, {zorla = false} = {}) {
  const satir = await env.DB.prepare("SELECT veri FROM calisma_alani WHERE kullanici_id = ?").bind(kullaniciId).first();
  if (!satir) return {durum: "alan-yok"};
  const veri0 = JSON.parse(satir.veri);
  if (!veri0.auto?.on) return {durum: "kapali"};
  const hesap = await env.DB.prepare("SELECT eposta FROM posta_hesabi WHERE kullanici_id = ?").bind(kullaniciId).first();
  if (!hesap) return {durum: "posta-yok"};

  const sn = veri0.profile?.sending || {};
  const an = yerel();
  const saatte = (!sn.weekdaysOnly || (an.gun > 0 && an.gun < 6)) && an.saat >= (sn.startHour ?? 9) && an.saat < (sn.endHour ?? 17);
  if (!zorla && !saatte) return {durum: "saat-disi"};
  const sonrakiAnahtar = "otonom_sonraki:" + kullaniciId;
  if (!zorla && Date.now() < Number(await ayarOku(env, sonrakiAnahtar) || 0)) return {durum: "tempo-bekleniyor"};

  // 1) Fren, takip hazırlama ve plan – taze veri üzerinde
  let plan = [], fren = "";
  const veri = await alanGuncelle(env, kullaniciId, v => {
    const m = motor(v, {bugun: an.tarih});
    if ((v.leads || []).filter(m.isOptoutToday).length >= 2) {
      v.auto.on = false; v.auto.pausedReason = "Bugün 2 firma listeden çıkmak istedi. Hedefleme ve mail metnini kontrol edip yeniden açın.";
      m.log("", "Otonom gönderim güvenlik nedeniyle durdu (sunucu)"); fren = v.auto.pausedReason; return true;
    }
    const once = v.drafts.length;
    m.autoPrepare();
    plan = m.autoPlan().map(d => d.id);
    return v.drafts.length !== once; // yeni takip taslağı yoksa kaydetme (gereksiz sürüm artışı olmasın)
  });
  if (fren) return {durum: "fren", neden: fren};
  if (!plan.length) return {durum: "gonderilecek-yok"};

  // 2) Planın ilk mailini gönder
  const m = motor(veri, {bugun: an.tarih});
  const d = veri.drafts.find(x => x.id === plan[0]);
  const l = m.leadById(d.leadId) || {};
  const imza = m.sigImgOn() && d.type !== "reply" ? veri.profile.sigImg : "";
  try {
    await gonder({url: env.UYGULAMA_URL || "https://pusula.onurtopuz02.workers.dev/"}, env, kullaniciId, {kime: m.recipientFor(d), firmaEposta: l.email || "", konu: d.subject, metin: d.body, imza});
  } catch (e) {
    const durdur = e instanceof PostaHatasi && [401, 403, 409].includes(e.durum);
    await alanGuncelle(env, kullaniciId, v => {
      const mm = motor(v, {bugun: an.tarih});
      if (durdur) { v.auto.on = false; v.auto.pausedReason = "Sunucu gönderimi durdurdu: " + e.message; }
      mm.log(d.leadId, "Otonom gönderim hatası: " + e.message.slice(0, 140));
    });
    await ayarYaz(env, sonrakiAnahtar, Date.now() + 15 * 60_000); // hatadan sonra 15 dk bekle
    return {durum: "hata", neden: e.message};
  }

  // 3) Gönderildi olarak işaretle (araya kullanıcı kaydı girerse taze veriye uygula)
  await alanGuncelle(env, kullaniciId, v => {
    const mm = motor(v, {bugun: an.tarih});
    const dd = v.drafts.find(x => x.id === d.id);
    if (!dd) return false;
    mm.markSent(dd);
  });
  const testte = veri.test?.on;
  const minDk = testte ? 5 : Math.max(3, Number(sn.minGap) || 3), maxDk = testte ? 10 : Math.max(minDk, Number(sn.maxGap) || 8);
  await ayarYaz(env, sonrakiAnahtar, Date.now() + (minDk + Math.random() * (maxDk - minDk)) * 60_000);
  return {durum: "gonderildi", firma: l.name, alici: m.recipientFor(d), kalan: plan.length - 1};
}

// Zamanlanmış görev: otonom gönderimi açık ve Outlook'u bağlı tüm kullanıcılar
export async function zamanlanmisTur(env) {
  const { results } = await env.DB.prepare("SELECT c.kullanici_id FROM calisma_alani c JOIN posta_hesabi p ON p.kullanici_id = c.kullanici_id").all();
  const sonuc = [];
  for (const r of results || []) {
    try { sonuc.push(await kullaniciTuru(env, r.kullanici_id)); } catch (e) { console.error("otonom", r.kullanici_id, e); }
  }
  return sonuc;
}
