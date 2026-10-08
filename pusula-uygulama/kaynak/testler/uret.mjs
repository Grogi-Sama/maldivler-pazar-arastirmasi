// app_v2.js'den sunucunun kullanacağı kural/şablon motorunu üretir (tek kaynak, iki kullanım)
import * as acorn from "acorn";
import fs from "node:fs";
const [, , girdi, cikti] = process.argv;
const src = fs.readFileSync(girdi, "utf8");
const ast = acorn.parse(src, {ecmaVersion: "latest", sourceType: "script"});
const tanim = {};
for (const n of ast.body) {
  if (n.type === "FunctionDeclaration") tanim[n.id.name] = src.slice(n.start, n.end);
  else if (n.type === "VariableDeclaration") for (const d of n.declarations) if (d.id.type === "Identifier") tanim[d.id.name] = src.slice(n.start, n.end);
}
const AL = ["esc", "uid", "addDays", "fmtDate", "domainOf", "CONTACTED", "STATUS", "DEFAULT_SEQ", "TRIGGERS", "OPTOUT_RE", "OPT_EN", "short", "LANGS", "DEFAULT_TPL",
  "log", "leadById", "seq", "stepLabel", "isSuppressed", "testOn", "recipientFor", "sentToday", "quality", "leadLang", "isTr", "tplFor", "fill",
  "sigImgOn", "sigText", "sigFor", "renderTpl", "shortSubj", "addDraft", "markSent", "isOptoutToday", "autoQuota", "autoCheck", "autoPrepare", "autoPlan"];
const eksik = AL.filter(a => !tanim[a]);
if (eksik.length) { console.error("Bulunamadı:", eksik); process.exit(1); }
const govde = [...new Set(AL.map(a => tanim[a]))].join("\n");
const out = `// OTOMATİK ÜRETİLDİ – kaynak: uygulama kodu (app_v2.js). Elle düzenlemeyin; build.py yeniden üretir.
// Sunucudaki otonom gönderim, uygulamayla birebir aynı şablon, kalite ve işaretleme kurallarını kullansın diye.
export function motor(state, {bugun}) {
  const SERVER = true, queue = [];
  const todayISO = () => bugun;
${govde}
  return {renderTpl, addDraft, markSent, autoCheck, autoPrepare, autoPlan, autoQuota, quality, recipientFor, isOptoutToday, leadById, log, sigImgOn, testOn, seq};
}
`;
fs.writeFileSync(cikti, out);
console.log("üretildi:", cikti, out.length, "bayt");
