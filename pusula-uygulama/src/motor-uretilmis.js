// OTOMATİK ÜRETİLDİ – kaynak: uygulama kodu (app_v2.js). Elle düzenlemeyin; build.py yeniden üretir.
// Sunucudaki otonom gönderim, uygulamayla birebir aynı şablon, kalite ve işaretleme kurallarını kullansın diye.
export function motor(state, {bugun}) {
  const SERVER = true, queue = [];
  const todayISO = () => bugun;
const ROLES = {customer: "Müşteriler", supplier: "Tedarikçiler", partner: "İş ortakları"};
const rolOf = l => ROLES[l.rol] ? l.rol : "customer";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmtDate = iso => iso ? new Date(iso + "T12:00:00").toLocaleDateString("tr-TR", {day: "numeric", month: "short", year: "numeric"}) : "—";
const domainOf = e => String(e || "").split("@")[1]?.toLowerCase() || "";
const CONTACTED = ["sent", "reply", "meet", "no", "optout"];
const STATUS = {
  new:       {t: "Yeni",            c: "st-new"},
  draft:     {t: "Taslak hazır",    c: "st-draft"},
  scheduled: {t: "Planlandı",       c: "st-draft"},
  sent:      {t: "Dizide",          c: "st-sent"},
  reply:     {t: "Yanıt geldi",     c: "st-reply"},
  meet:      {t: "Görüşme",         c: "st-meet"},
  no:        {t: "İlgilenmiyor",    c: "st-no"},
  optout:    {t: "Listeden çıktı",  c: "st-no"},
};
const DEFAULT_SEQ = [
  {key: "intro", label: "Tanışma",      day: 0},
  {key: "f1",    label: "Hatırlatma 1", day: 3},
  {key: "f2",    label: "Hatırlatma 2", day: 7},
  {key: "close", label: "Kapanış",      day: 14},
];
const TRIGGERS = ["free","guarantee","guaranteed","urgent","act now","limited time","no obligation","click here","winner","earn","cash","risk-free","risk free","congratulations","100%","lowest price","buy now","offer expires","ücretsiz","bedava","garantili","acil","hemen","kaçırmayın","son fırsat","tıklayın","kazandınız","indirim","kampanya"];
const OPTOUT_RE = /(won't follow up|will not follow up|reply and let me know|just reply|unsubscribe|tekrar rahatsız etmeyeceğim|yanıt vermeniz yeterli|listeden çık)/i;
const OPT_EN = "If this isn't relevant for you, just reply and let me know – I won't follow up.";
function short(s) { s = String(s || ""); const i = s.search(/[;(]/); return (i > 0 ? s.slice(0, i) : s).trim().slice(0, 60); }
const LANGS = ["English", "Türkçe"];
const DEFAULT_TPL = {
  "English": {
    intro: {subject: "{urunler_kisa} for {firma}", body: "Dear {firma} team,\n\nCould you kindly forward this to the person responsible for purchasing or engineering?\n\n{giris}\n\nI'm {gonderen} from {sirket}. We supply {urunler}.\n\nWhat we can offer:\n{degerler}\n\nWould you be open to a short call or video meeting in the coming weeks?\n\nIf this isn't relevant for you, just reply and let me know – I won't follow up."},
    intro_supplier: {subject: "Supply enquiry – {urunler_kisa}", body: "Dear {firma} team,\n\nCould you kindly forward this to your export or sales team?\n\n{giris}\n\nI'm {gonderen} from {sirket}. We are looking for a reliable supplier of {urunler_kisa}.\n\nWhat we would like to learn:\n- Your product range and specifications\n- Pricing for project and repeat volumes\n- Warranty, lead time and after-sales terms\n\nWould you be open to a short call or video meeting in the coming weeks?\n\nIf this isn't relevant for you, just reply and let me know – I won't follow up."},
    f1_supplier: {subject: "Following up – supply enquiry from {sirket}", body: "Dear {firma} team,\n\nI wanted to follow up on my enquiry of {ilk_tarih} about {urunler_kisa}.\n\nTo make it easy: a price list or catalogue with indicative lead times would already help us a lot.\n\nIf this isn't relevant for you, just reply and let me know – I won't follow up."},
    f2_supplier: {subject: "Quick question – {urunler_kisa}", body: "Dear {firma} team,\n\nJust one quick question: can you supply {urunler_kisa} in project volumes, and what is your typical lead time?\n\nA one-line answer is perfectly fine.\n\nIf this isn't relevant for you, just reply and let me know – I won't follow up."},
    close_supplier: {subject: "Closing my enquiry", body: "Dear {firma} team,\n\nAs I haven't heard back, I'll close my enquiry for now. If you would like to quote for {urunler_kisa} in the future, just reply to this email.\n\nThank you, and all the best."},
    f1: {subject: "Following up – {urunler_kisa}", body: "Dear {firma} team,\n\nI wanted to follow up on my email from {ilk_tarih}. I know inboxes get busy.\n\nTo make it easy: if you share one current or upcoming project, I can send an indicative offer and a short technical summary within two working days.\n\nWho would be the right person to speak with?\n\nIf this isn't relevant for you, just reply and let me know – I won't follow up."},
    f2: {subject: "An idea for {firma}", body: "Dear {firma} team,\n\nOne more thought since my last note. Many companies in your market start with a single small project to compare price, delivery and support before committing to more.\n\nIf that approach suits {firma}, we would be glad to support a first project on those terms.\n\nWould a 15-minute call next week work?\n\nIf this isn't relevant for you, just reply and let me know – I won't follow up."},
    close: {subject: "Closing the loop", body: "Dear {firma} team,\n\nI haven't heard back, so I'll assume the timing isn't right and won't follow up further.\n\nIf anything changes, just reply to this email and I'll pick it up from here.\n\nThank you for your time."},
  },
  "Türkçe": {
    intro: {subject: "{firma} için {urunler_kisa}", body: "Sayın {firma} yetkilileri,\n\n{giris}\n\nBen {sirket}'den {gonderen}. {urunler} alanında hizmet veriyoruz.\n\nÖnerebileceklerimiz:\n{degerler}\n\nUygun görürseniz önümüzdeki haftalarda kısa bir telefon veya çevrim içi görüşme yapabilir miyiz?\n\nİlginizi çekmiyorsa yanıt vermeniz yeterli, tekrar rahatsız etmeyeceğim."},
    intro_supplier: {subject: "Tedarik talebi – {urunler_kisa}", body: "Sayın {firma} yetkilileri,\n\n{giris}\n\nBen {sirket}'den {gonderen}. {urunler_kisa} için güvenilir ve uzun vadeli çalışabileceğimiz bir tedarikçi arıyoruz; hem proje bazlı hem de düzenli alım yapıyoruz.\n\nÖğrenmek istediklerimiz:\n- Ürün yelpazeniz ve teknik özellikler\n- Proje ve tekrarlayan alımlar için fiyatlar\n- Garanti, teslim süresi ve satış sonrası koşullar\n\nKısa bir görüşme yapabilir miyiz?\n\nİlginizi çekmiyorsa yanıt vermeniz yeterli, tekrar rahatsız etmeyeceğim."},
    f1_supplier: {subject: "Tedarik talebimiz hakkında – {urunler_kisa}", body: "Sayın {firma} yetkilileri,\n\n{ilk_tarih} tarihli {urunler_kisa} tedarik talebimi hatırlatmak istedim.\n\nKolaylık olması için: fiyat listesi veya katalog ile yaklaşık teslim süreleriniz bile bizim için çok faydalı olur.\n\nİlginizi çekmiyorsa yanıt vermeniz yeterli, tekrar rahatsız etmeyeceğim."},
    f2_supplier: {subject: "Kısa bir soru – {urunler_kisa}", body: "Sayın {firma} yetkilileri,\n\nKısa bir sorum var: proje ölçeğinde {urunler_kisa} tedarik edebiliyor musunuz, ortalama teslim süreniz nedir?\n\nTek satırlık bir yanıt yeterli.\n\nİlginizi çekmiyorsa yanıt vermeniz yeterli, tekrar rahatsız etmeyeceğim."},
    close_supplier: {subject: "Tedarik talebimi kapatıyorum", body: "Sayın {firma} yetkilileri,\n\nDönüş alamadığım için talebimi şimdilik kapatıyorum. İleride {urunler_kisa} için teklif vermek isterseniz bu maile yanıt vermeniz yeterli.\n\nTeşekkür eder, çalışmalarınızda başarılar dilerim."},
    f1: {subject: "Önceki mailim hakkında – {urunler_kisa}", body: "Sayın {firma} yetkilileri,\n\n{ilk_tarih} tarihli mailimi hatırlatmak istedim; yoğunluğunuzu anlıyorum.\n\nKolaylık olması için: güncel veya yakın bir projenizi paylaşırsanız iki iş günü içinde ön teklif ve kısa bir teknik özet gönderebilirim.\n\nBu konuyu kiminle görüşmem doğru olur?\n\nİlginizi çekmiyorsa yanıt vermeniz yeterli, tekrar rahatsız etmeyeceğim."},
    f2: {subject: "{firma} için bir öneri", body: "Sayın {firma} yetkilileri,\n\nSon mailimden sonra bir öneri daha paylaşmak istedim. Birçok firma, daha büyük kararlardan önce fiyat, teslimat ve desteği görmek için tek ve küçük bir projeyle başlıyor.\n\nBu yaklaşım {firma} için uygunsa ilk projede bu şekilde destek olmaktan memnuniyet duyarız.\n\nGelecek hafta 15 dakikalık bir görüşme mümkün mü?\n\nİlginizi çekmiyorsa yanıt vermeniz yeterli, tekrar rahatsız etmeyeceğim."},
    close: {subject: "Son mesajım", body: "Sayın {firma} yetkilileri,\n\nYanıt alamadığım için zamanlamanın uygun olmadığını düşünüyor ve tekrar yazmayacağım.\n\nİleride bir değişiklik olursa bu maile yanıt vermeniz yeterli, oradan devam ederiz.\n\nZaman ayırdığınız için teşekkür ederim."},
  },
};
function log(leadId, action) { state.log.unshift({at: new Date().toISOString(), leadId, action}); state.log = state.log.slice(0, 400); }
const leadById = id => state.leads.find(l => l.id === id);
const seq = () => state.profile.sequence;
const stepLabel = key => (seq().find(s => s.key === key) || {label: key === "reply" ? "Yanıt" : key}).label;
const isSuppressed = l => !!l.email && (state.suppress.includes(l.email.toLowerCase()) || state.suppress.includes("@" + domainOf(l.email)));
const testOn = () => state.test.on && state.test.addresses.length > 0;
function recipientFor(d) {
  const l = leadById(d.leadId) || {};
  if (!testOn()) return l.email || "";
  const a = state.test.addresses, i = state.leads.findIndex(x => x.id === d.leadId);
  return a[Math.max(0, i) % a.length];
}
const sentToday = () => { const t = todayISO(); return state.log.filter(x => x.at.slice(0, 10) === t && /gönderildi$/.test(x.action)).length; };
function quality(d) {
  const l = leadById(d.leadId) || {};
  const body = d.body || "", subj = d.subject || "";
  const sig = sigFor(l);
  const main = sig && body.includes(sig) ? body.slice(0, body.indexOf(sig)) : body.split((sig || "").split("\n")[0] || "\u0000")[0];
  const words = (main.match(/\S+/g) || []).length;
  const issues = []; let s = 100;
  const lim = ["f1", "f2", "close"].includes(d.type) ? [30, 120] : [60, 200];
  if (words < lim[0]) { s -= 8; issues.push(["Çok kısa (" + words + " kelime)", false]); }
  else if (words > lim[1]) { s -= 15; issues.push([`Uzun: ${words} kelime, ${lim[1]}'ün altına inin`, false]); } else issues.push([`Uzunluk iyi (${words} kelime)`, true]);
  if (subj.length > 60 || subj.split(/\s+/).length > 9) { s -= 10; issues.push(["Konu satırı uzun (60 karakter / 9 kelime altı önerilir)", false]); } else issues.push(["Konu satırı kısa", true]);
  if (/^(re|fw|fwd):/i.test(subj) && d.type === "intro") { s -= 15; issues.push(["İlk mailde 'Re:' / 'Fwd:' yanıltıcı sayılır", false]); }
  const hay = (subj + " " + main).toLowerCase();
  const names = [l.name, state.profile.company, state.profile.senderName].filter(Boolean).flatMap(n => String(n).split(/[\s()]+/)).filter(w => w.length > 1);
  const plain = names.reduce((t, w) => t.split(w).join(" "), subj + " " + main);
  const hits = TRIGGERS.filter(w => new RegExp("(?<![\\p{L}\\p{N}])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u").test(hay));
  if (hits.length) { s -= Math.min(30, hits.length * 8); issues.push(["Spam kelimesi: " + hits.join(", "), false]); } else issues.push(["Spam tetikleyici kelime yok", true]);
  const links = (main.match(/https?:\/\/|www\./gi) || []).length;
  if (links > 1) { s -= 10; issues.push([links + " bağlantı var; en fazla 1", false]); } else if (links === 1 && d.type === "intro") { s -= 4; issues.push(["İlk mailde bağlantı yerine düz metin daha güvenli", false]); }
  if ((main.match(/!/g) || []).length > 1) { s -= 5; issues.push(["Fazla ünlem", false]); }
  if ((plain.match(/\b[A-ZÇĞİÖŞÜ]{4,}\b/g) || []).filter(w => !["HYXI", "EPC", "ESS", "HVAC", "B2B", "CEO", "MWh", "LUNA"].includes(w)).length > 1) { s -= 10; issues.push(["BÜYÜK HARFLİ kelimeler", false]); }
  if (l.name && !hay.includes(String(l.name).split(/[ (]/)[0].toLowerCase())) { s -= 10; issues.push(["Firmaya özel bir ifade yok", false]); } else issues.push(["Kişiselleştirilmiş", true]);
  if (!OPTOUT_RE.test(body)) { s -= 15; issues.push(["Listeden çıkma cümlesi yok", false]); } else issues.push(["Listeden çıkma cümlesi var", true]);
  if (sigImgOn()) issues.push(["Görsel imza eklenecek", true]);
  else if (state.profile.senderName && !body.includes(state.profile.senderName)) { s -= 5; issues.push(["İmza eksik", false]); }
  if (!isTr(leadLang(l)) && /[ğşıİ]|\b(ve|için|bir|ile)\b/.test(plain)) { s -= 20; issues.push(["Dil karışık: " + leadLang(l) + " mailde Türkçe ifade var", false]); }
  if (isTr(leadLang(l)) && /\b(the|and|we|our|your|with)\b/i.test(plain)) { s -= 20; issues.push(["Dil karışık: Türkçe mailde İngilizce ifade var", false]); }
  if (l.email && !l.verified) { s -= 10; issues.push(["E-posta adresi doğrulanmadı", false]); }
  s = Math.max(0, Math.min(100, s));
  return {s, issues, cls: s >= 80 ? "sc-good" : s >= 60 ? "sc-mid" : "sc-bad"};
}
function leadLang(l) { return (l && l.lang) || state.profile.language || "English"; }
function isTr(lang) { return /^t(r|ürkçe|urkish)/i.test(lang || ""); }
function tplFor(lang, key) {
  const set = state.profile.templates?.[lang] || DEFAULT_TPL[lang] || DEFAULT_TPL[isTr(lang) ? "Türkçe" : "English"];
  return set[key] || DEFAULT_TPL[isTr(lang) ? "Türkçe" : "English"][key];
}
function fill(text, l) {
  const p = state.profile, tr = isTr(leadLang(l));
  const sup = rolOf(l) === "supplier";
  const prod = sup ? (tr ? (p.buyNeeds || p.buyNeedsMail) : (p.buyNeedsMail || p.buyNeeds)) : tr ? (p.products || p.productsMail) : (p.productsMail || p.products);
  const val = tr ? (p.value || p.valueMail) : (p.valueMail || p.value);
  const vars = {
    firma: l.name, giris: l.hook || (tr ? `${l.name} ile ${l.region || "bölgenizdeki"} çalışmalarınız hakkında yazıyorum.` : `I'm reaching out regarding ${l.name}'s work in ${l.region}.`),
    urunler: prod, urunler_kisa: (sup ? (tr ? p.buyShortTr : p.buyShort) : (tr ? p.productsShortTr : p.productsShort)) || shortSubj(prod),
    degerler: String(val || "").split(/[,;]/).map(x => x.trim()).filter(Boolean).map(x => "- " + x.charAt(0).toLocaleUpperCase(tr ? "tr-TR" : "en") + x.slice(1)).join("\n"),
    gonderen: p.senderName, sirket: p.company, ilk_tarih: fmtDate(l.sentAt),
  };
  return String(text || "").replace(/\{(\w+)\}/g, (m, k, off, str) => {
    const v = vars[k]; if (v == null) return m;
    const atStart = /(^|[.!?]\s+|\n\s*)$/.test(str.slice(0, off));
    return atStart && typeof v === "string" ? v.charAt(0).toLocaleUpperCase(tr ? "tr-TR" : "en") + v.slice(1) : v;
  });
}
const sigImgOn = () => state.profile.sigMode !== "text" && !!state.profile.sigImg;
function sigText(l) { const p = state.profile; return isTr(leadLang(l)) ? (p.signatureTr || p.signature) : p.signature; }
function sigFor(l) { const t = sigText(l) || ""; return state.profile.sigMode === "image" && state.profile.sigImg ? t.split("\n")[0] : t; }
function renderTpl(l, key) {
  const k = rolOf(l) === "supplier" && ["intro", "f1", "f2", "close"].includes(key) ? key + "_supplier" : key;
  const t = tplFor(leadLang(l), k);
  return {subject: fill(t.subject, l), body: fill(t.body, l) + "\n\n" + sigFor(l)};
}
function shortSubj(s) {
  let t = String(s || "").split(/[;(,]| for | için /)[0].trim();
  const w = t.split(/\s+/); if (w.length > 6) t = w.slice(0, 6).join(" ");
  return t.replace(/\s+(and|ve|&)$/i, "");
}
function addDraft(l, type) {
  if (state.drafts.some(d => d.leadId === l.id && d.type === type)) return false;
  const t = renderTpl(l, type);
  state.drafts.push({id: uid(), leadId: l.id, type, subject: t.subject, body: t.body, createdAt: todayISO()});
  if (type === "intro" && l.status === "new") l.status = "draft";
  return true;
}
function markSent(d) {
  const l = leadById(d.leadId); if (!l) return;
  const t = todayISO();
  if (d.type === "reply") { log(l.id, "Cevap gönderildi"); }
  else {
    const idx = seq().findIndex(s => s.key === d.type);
    if (idx === 0 || !l.sentAt) l.sentAt = t;
    l.step = Math.max(l.step, idx); l.lastSentAt = t;
    const nx = seq()[l.step + 1];
    l.nextAt = nx ? addDays(l.sentAt, nx.day) : "";
    if (!["reply", "meet", "no", "optout"].includes(l.status)) l.status = "sent";
    log(l.id, stepLabel(d.type) + (testOn() ? ` test adresine (${recipientFor(d)})` : "") + " gönderildi");
  }
  state.drafts = state.drafts.filter(x => x.id !== d.id);
}
const isOptoutToday = l => { const t = todayISO(); return l.status === "optout" && state.log.some(x => x.leadId === l.id && x.at.slice(0, 10) === t); };
function autoQuota() { const a = state.auto, sn = state.profile.sending; return Math.max(0, Math.min(a.dailyMax, sn.dailyLimit) - sentToday() - queue.length); }
function autoCheck(d) {
  const l = leadById(d.leadId), a = state.auto;
  if (!l) return "Firma silinmiş";
  if (d.type === "reply") return "Cevaplar her zaman sizin onayınızla gider";
  if (!l.email) return "E-posta adresi yok";
  if (isSuppressed(l) || l.status === "optout") return "Bir daha yazılmayacaklar listesinde";
  if (d.type !== "intro" && ["reply", "meet", "no"].includes(l.status)) return "Firma yanıt verdi; dizi durdu";
  if (a.requireVerified && !l.verified) return "Adres doğrulanmadı";
  if (d.scheduledFor && d.scheduledFor > todayISO()) return "İleri tarihe planlı";
  const q = quality(d).s; if (q < a.minQuality) return `Teslim puanı ${q} (en az ${a.minQuality} olmalı)`;
  return "";
}
function autoPrepare() {
  const a = state.auto, t = todayISO(); let n = 0;
  if (a.followups) for (const l of state.leads) { const nx = seq()[l.step + 1]; if (l.status === "sent" && nx && l.nextAt && l.nextAt <= t && !isSuppressed(l) && addDraft(l, nx.key)) n++; }
  if (a.intros) for (const l of state.leads.filter(l => l.status === "new" && l.email && l.priority !== "C" && !isSuppressed(l)).sort((x, y) => y.score - x.score)) if (addDraft(l, "intro")) n++;
  return n;
}
function autoPlan() {
  const ok = state.drafts.filter(d => !queue.includes(d.id) && !autoCheck(d));
  ok.sort((x, y) => (x.type === "intro") - (y.type === "intro") || (leadById(y.leadId).score - leadById(x.leadId).score));
  return ok.slice(0, autoQuota());
}
  return {renderTpl, addDraft, markSent, autoCheck, autoPrepare, autoPlan, autoQuota, quality, recipientFor, isOptoutToday, leadById, log, sigImgOn, testOn, seq};
}
