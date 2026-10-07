// Gmail / Google Workspace gönderimi – Gmail API users.messages.send (ham MIME).
// Gerekli izin: https://www.googleapis.com/auth/gmail.send (+ cevap takibi için gmail.readonly).
// Sınırlar: Workspace günde 2.000, ücretsiz Gmail günde 500 alıcı.

import {GonderimHatasi} from "./microsoft.js";

const b64url = s => Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const encWord = s => /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s).toString("base64")}?=`;

export function mimeOlustur({kimden, kime, konu, govdeMetin, govdeHtml, listedenCikUrl, ekler = []}) {
  const sinir = "pusula_" + Math.random().toString(36).slice(2);
  const basliklar = [`From: ${kimden}`, `To: ${kime}`, `Subject: ${encWord(konu)}`, "MIME-Version: 1.0"];
  // Gmail/Yahoo kuralı: toplu gönderimde tek tıkla listeden çıkma (RFC 8058)
  if (listedenCikUrl) basliklar.push(`List-Unsubscribe: <${listedenCikUrl}>`, "List-Unsubscribe-Post: List-Unsubscribe=One-Click");
  if (!govdeHtml) return [...basliklar, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", Buffer.from(govdeMetin).toString("base64")].join("\r\n");
  const alternatif = [`Content-Type: multipart/alternative; boundary="${sinir}"`, "",
    `--${sinir}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", Buffer.from(govdeMetin || "").toString("base64"),
    `--${sinir}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", Buffer.from(govdeHtml).toString("base64"),
    `--${sinir}--`];
  const gomulu = ekler.filter(e => e.cid);
  if (!gomulu.length) return [...basliklar, ...alternatif, ""].join("\r\n");
  // Görsel imza: multipart/related içinde, HTML'deki cid: ile eşleşen gömülü görsel
  const ust = sinir + "_r";
  return [...basliklar, `Content-Type: multipart/related; boundary="${ust}"`, "", `--${ust}`, ...alternatif,
    ...gomulu.flatMap(e => [`--${ust}`, `Content-Type: ${e.tur}; name="${e.ad}"`, "Content-Transfer-Encoding: base64", `Content-ID: <${e.cid}>`, `Content-Disposition: inline; filename="${e.ad}"`, "", e.base64.replace(/(.{76})/g, "$1\r\n")]),
    `--${ust}--`, ""].join("\r\n");
}

export function gmailSaglayici({erisimAnahtari, kimden, fetchFn = fetch}) {
  return {
    ad: "gmail",
    async gonder(mail) {
      const r = await fetchFn("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {Authorization: `Bearer ${await erisimAnahtari()}`, "Content-Type": "application/json"},
        body: JSON.stringify({raw: b64url(mimeOlustur({kimden, ...mail}))}),
      });
      if (r.ok) return {ok: true, id: (await r.json()).id};
      if (r.status === 401 || r.status === 403) throw new GonderimHatasi("Gmail bağlantısının yenilenmesi gerekiyor", {tur: "yetki"});
      if (r.status === 429 || r.status >= 500) throw new GonderimHatasi("Gmail geçici olarak yavaşlattı", {tur: "gecici", tekrarSn: Number(r.headers.get("Retry-After")) || 60});
      throw new GonderimHatasi(`Gmail gönderimi reddetti (${r.status})`, {tur: "kalici"});
    },
  };
}
