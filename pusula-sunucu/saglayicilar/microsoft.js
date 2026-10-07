// Microsoft 365 / Outlook.com gönderimi – Microsoft Graph sendMail.
// Gerekli izinler (delegated): Mail.Send, offline_access (+ cevap takibi için Mail.Read).
// Sınırlar: dakikada 30, günde 10.000 alıcı (Exchange Online). Pusula bunun çok altında kalır.

const GRAPH = "https://graph.microsoft.com/v1.0";

export class GonderimHatasi extends Error {
  constructor(mesaj, {tur, tekrarSn} = {}) { super(mesaj); this.tur = tur; this.tekrarSn = tekrarSn; }
}

export function microsoftSaglayici({erisimAnahtari, fetchFn = fetch}) {
  return {
    ad: "microsoft",
    async gonder({kime, konu, govdeHtml, govdeMetin, ekler = []}) {
      const message = {
        subject: konu,
        body: govdeHtml ? {contentType: "HTML", content: govdeHtml} : {contentType: "Text", content: govdeMetin},
        toRecipients: [{emailAddress: {address: kime}}],
        attachments: ekler.map(e => ({"@odata.type": "#microsoft.graph.fileAttachment", name: e.ad, contentType: e.tur, contentBytes: e.base64, isInline: !!e.cid, contentId: e.cid})),
      };
      const r = await fetchFn(`${GRAPH}/me/sendMail`, {
        method: "POST",
        headers: {Authorization: `Bearer ${await erisimAnahtari()}`, "Content-Type": "application/json"},
        body: JSON.stringify({message, saveToSentItems: true}),
      });
      if (r.status === 202) return {ok: true};
      const tekrarSn = Number(r.headers.get("Retry-After")) || undefined;
      const metin = await r.text().catch(() => "");
      if (r.status === 401 || r.status === 403) throw new GonderimHatasi("Outlook bağlantısının yenilenmesi gerekiyor", {tur: "yetki"});
      if (r.status === 429 || r.status === 503) throw new GonderimHatasi("Microsoft geçici olarak yavaşlattı", {tur: "gecici", tekrarSn: tekrarSn || 60});
      throw new GonderimHatasi(`Microsoft gönderimi reddetti (${r.status}): ${metin.slice(0, 200)}`, {tur: "kalici"});
    },
  };
}
