// Yapay zekâ ile sınıflandırma – sağlayıcıdan bağımsız.
// Başlangıç: Google Gemini ücretsiz katmanı (yalnızca kamuya açık firma bilgisi gönderilir).
// Sonra: Claude (ücretli; veriler eğitimde kullanılmaz). Geçiş = ortam değişkeni değişikliği.
// Kural: model YALNIZCA verilen kaynak metinden çıkarım yapar; e-posta üretmez, kaynakta olmayan bilgi yazmaz.

export function siniflandirmaIstemi({sirket, hedef, mod, adaylar}) {
  return `Sen bir B2B iş geliştirme analistisin. Aşağıdaki firmaları, verilen KAYNAK METİNLERE dayanarak değerlendir.
Bizim şirket: ${sirket.ad} – ${sirket.urunler}. Aradığımız: ${mod === "supplier" ? "tedarikçi" : "müşteri veya iş ortağı"}. Hedef tarifi: ${hedef}.
Kurallar:
- Yalnızca kaynak metinde yazanı kullan. Kaynakta olmayan rakam, proje veya ilişki uydurma.
- E-posta adresi üretme veya tahmin etme.
- Kaynak yetersizse "yetersiz": true döndür ve puanı 40'ın altında tut.
- "giris" cümlesi kaynaktaki somut bir bilgiye dayanmalı; dayanamıyorsa boş bırak.
Her firma için JSON: {"id","segment","oncelik":"A|B|C","puan":0-100,"neden":"tek cümle Türkçe","giris":"ilk mail için tek cümle","dil":"Türkçe|English","yetersiz":bool}
Yalnızca JSON dizisi döndür.

FİRMALAR:
${adaylar.map(a => `### id=${a.id} | ${a.name} | ${a.website}\n${(a.kaynakMetni || "").slice(0, 1200)}`).join("\n\n")}`;
}

export function jsonDizisiAyikla(metin) {
  const m = String(metin).match(/\[[\s\S]*\]/);
  if (!m) throw new Error("Yapay zekâ yanıtında JSON bulunamadı");
  return JSON.parse(m[0]);
}

export function geminiSaglayici({anahtar = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite", fetchFn = fetch} = {}) {
  return {
    ad: "gemini",
    async tamamla(istem) {
      if (!anahtar) throw new Error("Gemini anahtarı tanımlı değil");
      const r = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: {"Content-Type": "application/json", "x-goog-api-key": anahtar},
        body: JSON.stringify({contents: [{role: "user", parts: [{text: istem}]}], generationConfig: {temperature: 0.2, responseMimeType: "application/json"}}),
      });
      if (r.status === 429) throw new Error("Gemini ücretsiz kotası doldu; biraz sonra tekrar deneyin");
      if (!r.ok) throw new Error(`Gemini yanıt vermedi (${r.status})`);
      const j = await r.json();
      return j.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
    },
  };
}
