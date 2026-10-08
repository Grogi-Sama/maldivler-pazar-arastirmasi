import {chromium} from "playwright-core";
const B = "http://127.0.0.1:8787", out = "/tmp/claude-0/x/";
const br = await chromium.launch({executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"]});
for (const [ad, vp] of [["masa", {width: 1280, height: 800}], ["mobil", {width: 390, height: 844}]]) {
  const ctx = await br.newContext({viewport: vp, deviceScaleFactor: 1}); const pg = await ctx.newPage();
  await pg.goto(B + "/giris"); await pg.waitForTimeout(800); await pg.screenshot({path: out + `giris-${ad}.png`});
  await pg.fill("#e", "test@ornek.com"); await pg.fill("#s", "cokguvenli123"); await pg.click("#b"); await pg.waitForURL(B + "/");
  await pg.waitForTimeout(1200); await pg.screenshot({path: out + `app-${ad}.png`});
  console.log(ad, "taşma:", await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await ctx.close();
}
await br.close();
