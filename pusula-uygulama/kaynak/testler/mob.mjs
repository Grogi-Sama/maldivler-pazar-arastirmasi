import {chromium} from "playwright-core";
const B = "http://127.0.0.1:8787";
const br = await chromium.launch({executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"]});
const ctx = await br.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true}); const pg = await ctx.newPage();
await pg.goto(B + "/giris"); await pg.fill("#e", "test@ornek.com"); await pg.fill("#s", "cokguvenli123"); await pg.click("#b"); await pg.waitForURL(B + "/"); await pg.waitForTimeout(800);
for (const v of ["mailler", "adaylar", "arastir", "takip", "profil", "panel"]) {
  await pg.evaluate(v => { if (v === "mailler") { state = normalize(demoState()); } if (v === "mailler" && !state.drafts.length) makeIntros(state.leads.filter(l => l.status === "new").map(l => l.id)); view = v; render(); window.scrollTo(0, 0); }, v);
  await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => { const W = innerWidth, o = []; document.querySelectorAll("main *").forEach(e => { const b = e.getBoundingClientRect(); if (b.right > W + 1 && b.width > 0) o.push(`${e.tagName.toLowerCase()}.${String(e.className).slice(0, 30)} w=${Math.round(b.width)} r=${Math.round(b.right)}`); }); return {sw: document.documentElement.scrollWidth, o: o.slice(0, 8)}; });
  console.log(v, "scrollWidth", r.sw, r.o.join(" | "));
  if (v === "mailler") { await pg.evaluate(() => document.querySelector(".draft").scrollIntoView()); await pg.screenshot({path: "/tmp/claude-0/x/mob-mailler.png"}); }
}
await br.close();
