// Tavily – güncel haber ve proje araması (ayda 1.000 arama ücretsiz, kredi kartı gerekmez).
// Anahtar sunucuda ortam değişkeninde tutulur (TAVILY_API_KEY); sayfaya asla gönderilmez.

export async function tavilyAra(sorgu, {anahtar = process.env.TAVILY_API_KEY, fetchFn = fetch, adet = 8} = {}) {
  if (!anahtar) throw new Error("Tavily anahtarı tanımlı değil");
  const r = await fetchFn("https://api.tavily.com/search", {
    method: "POST",
    headers: {"Content-Type": "application/json", Authorization: `Bearer ${anahtar}`},
    body: JSON.stringify({query: sorgu, max_results: adet, search_depth: "basic"}),
  });
  if (r.status === 429 || r.status === 432) throw new Error("Tavily aylık ücretsiz kotası doldu");
  if (!r.ok) throw new Error(`Tavily yanıt vermedi (${r.status})`);
  const j = await r.json();
  return (j.results || []).map(x => ({baslik: x.title, url: x.url, ozet: String(x.content || "").slice(0, 600)}));
}
