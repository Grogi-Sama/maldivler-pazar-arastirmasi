import * as acorn from "acorn"; import fs from "node:fs";
import {motor} from "/home/user/maldivler-pazar-arastirmasi/pusula-uygulama/src/motor-uretilmis.js";
// demoState + normalize'ı uygulamadan alıp gerçek bir çalışma alanıyla dene
const src = fs.readFileSync("../pusula/app_v2.js", "utf8"); const ast = acorn.parse(src, {ecmaVersion: "latest"});
const pick = n => { for (const x of ast.body) { if (x.type === "FunctionDeclaration" && x.id.name === n) return src.slice(x.start, x.end); if (x.type === "VariableDeclaration" && x.declarations.some(d => d.id.name === n)) return src.slice(x.start, x.end); } };
const code = ["uid","todayISO","addDays","CONTACTED","DEFAULT_SEQ","DEFAULT_SENDING","DEFAULT_TEST","DEFAULT_AUTO","SIG","SIG_IMG_DEMO","SIG_TR","demoState","ROLES","guessRole"].map(pick).join("\n") + "\nconst SERVER=true; const location={protocol:'https:'};\n" + pick("normalize") + "\nexport {demoState, normalize};";
fs.writeFileSync("/tmp/claude-0/-home-user-maldivler-pazar-arastirmasi/d8b2693d-2e93-5545-8c28-af5f46c9bfc0/scratchpad/e2e/demo.mjs", code);
const {demoState, normalize} = await import("./demo.mjs");
const st = normalize(demoState()); st.auto.on = true; st.auto.requireVerified = true;
const m = motor(st, {bugun: "2026-10-08"});
const once = st.drafts.length;
const yeni = st.leads.filter(l => l.status === "new").slice(0, 2); for (const l of yeni) { l.verified = true; m.addDraft(l, "intro"); }
st.leads.find(l => l.status === "sent").nextAt = "2026-10-07";
m.autoPrepare();
const plan = m.autoPlan();
console.log("taslak:", once, "->", st.drafts.length, "| plan:", plan.map(d => `${m.leadById(d.leadId).name}/${d.type}`).join(", "));
console.log("engeller:", st.drafts.filter(d => m.autoCheck(d)).map(d => m.autoCheck(d)).join(" | "));
const d = plan[0]; console.log("alıcı:", m.recipientFor(d), "| konu:", d.subject, "| kalite:", m.quality(d).s);
m.markSent(d); const l = m.leadById(d.leadId);
console.log("işaretlendi:", l.name, l.status, "step", l.step, "sonraki", l.nextAt, "| log:", st.log[0].action);
