// Pusula gönderim kuralları – demo uygulamadaki otonom gönderimle aynı mantık, sunucu için saf fonksiyonlar.
// Saat dilimi: kullanıcının yerel saati (ör. "Europe/Istanbul") Intl ile hesaplanır.

export const VARSAYILAN_GONDERIM = {dailyLimit: 30, minGap: 3, maxGap: 8, startHour: 9, endHour: 17, weekdaysOnly: true, timeZone: "Europe/Istanbul"};
export const VARSAYILAN_OTONOM = {on: false, dailyMax: 20, followups: true, intros: false, requireVerified: true, minQuality: 80};

// Verilen anın kullanıcının saat dilimindeki tarih, saat ve haftanın günü
export function yerelZaman(an, timeZone) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "short"})
    .formatToParts(an).map(x => [x.type, x.value]));
  return {tarih: `${p.year}-${p.month}-${p.day}`, saat: Number(p.hour), gun: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday)};
}

export function gonderimSaatinde(an, g) {
  const {saat, gun} = yerelZaman(an, g.timeZone);
  return (!g.weekdaysOnly || (gun > 0 && gun < 6)) && saat >= g.startHour && saat < g.endHour;
}

export function gunlukKota(otonom, g, bugunGiden) {
  return Math.max(0, Math.min(otonom.dailyMax, g.dailyLimit) - bugunGiden);
}

export function rastgeleAralikMs(g, rnd = Math.random) {
  const dk = g.minGap + rnd() * Math.max(0, g.maxGap - g.minGap);
  return Math.round(dk * 60_000);
}

export function addDays(tarih, n) {
  const d = new Date(tarih + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}

// Bir taslak otomatik gidebilir mi? Boş metin = evet; değilse nedeni.
export function engelNedeni(taslak, aday, otonom, {bugun, engelliler, kalite}) {
  if (!aday) return "Firma silinmiş";
  if (taslak.type === "reply") return "Cevaplar her zaman kullanıcı onayıyla gider";
  if (!aday.email) return "E-posta adresi yok";
  const e = aday.email.toLowerCase();
  if (aday.status === "optout" || engelliler.has(e) || engelliler.has("@" + e.split("@")[1])) return "Bir daha yazılmayacaklar listesinde";
  if (taslak.type !== "intro" && ["reply", "meet", "no"].includes(aday.status)) return "Firma yanıt verdi; dizi durdu";
  if (otonom.requireVerified && !aday.verified) return "Adres doğrulanmadı";
  if (taslak.scheduledFor && taslak.scheduledFor > bugun) return "İleri tarihe planlı";
  const k = kalite(taslak, aday);
  if (k < otonom.minQuality) return `Teslim puanı ${k} (en az ${otonom.minQuality})`;
  return "";
}

// Bugün gönderilecek taslakları sıralar: önce takipler (verilmiş söz), sonra puanı yüksek adaylara tanışma.
export function gonderimPlani({taslaklar, adaylar, otonom, gonderim, bugunGiden, bugun, engelliler, kalite}) {
  const aday = id => adaylar.get(id);
  const uygun = taslaklar.filter(t => !engelNedeni(t, aday(t.leadId), otonom, {bugun, engelliler, kalite}));
  uygun.sort((a, b) => (a.type === "intro") - (b.type === "intro") || aday(b.leadId).score - aday(a.leadId).score);
  return uygun.slice(0, gunlukKota(otonom, gonderim, bugunGiden));
}

// Güvenlik freni: aynı gün listeden çıkma veya geri dönen mail oranı yükselirse dur.
export function frenNedeni({bugunListedenCikan, sonGonderilen, sonGeriDonen}) {
  if (bugunListedenCikan >= 2) return "Bugün 2 firma listeden çıkmak istedi";
  if (sonGonderilen >= 20 && sonGeriDonen / sonGonderilen > 0.05) return `Geri dönen mail oranı %${Math.round(sonGeriDonen / sonGonderilen * 100)} (sınır %5)`;
  return "";
}
