# Pusula – Ürün Planı

**Ne:** KOBİ'ler ve ihracatçılar için yapay zekâ destekli iş geliştirme asistanı. Kullanıcı şirketini ve hedefini tarif eder; Pusula potansiyel müşteri veya tedarikçi listesini çıkarır, sınıflandırır, spama düşmeyen kişisel mailleri ve takip dizisini hazırlar, gönderimi güvenli tempoda yapar, yanıtları işler.

**Kime:** İş geliştirme personeli olmayan ya da az olan; ihracat yapan veya yeni pazar arayan Türk KOBİ'leri, distribütörler ve üreticiler. İkinci halka: satış ekibi olan orta ölçekli şirketler.

**Demo:** https://claude.ai/artifact/Jh2wCQnKSqb6aawqufNfFU (kaynak: `pusula-demo/index.html`)

---

## 1. Pazar ve rakipler

| Grup | Örnekler | Güçlü yanı | Zayıf yanı (Pusula'nın fırsatı) |
|---|---|---|---|
| Veri + gönderim platformları | Apollo ($49–119/kullanıcı/ay), Lemlist, Instantly, Smartlead | Büyük kişi veritabanı, gelişmiş gönderim | İngilizce, kurulumu teknik, Türk KOBİ'sine pahalı ve karmaşık; KVKK/İYS bilgisi yok |
| Veri zenginleştirme | Clay | Çok kaynaklı veri, esnek iş akışı | Uzman kullanıcı ister; gönderim yapmaz |
| Otonom yapay zekâ satış temsilcileri | 11x ($36.000+/yıl), Artisan ($600–5.000/ay) | Uçtan uca otomasyon | Kurumsal fiyat; KOBİ'ye uygun değil |
| Türkiye'deki ihracat platformları | İhracatAI, Bilvio, ITAI, Kobimatik | Türkçe, ihracat odaklı | Çoğu yalnızca "müşteri bulma"; gönderim sağlığı, takip dizisi ve tedarikçi arama sınırlı |

**Pusula'nın farkı (konumlandırma cümlesi):** *"Bir iş geliştirme uzmanının yaptığı işi (araştır, yaz, gönder, takip et) Türkçe arayüzle, kendi mail hesabınızdan ve spama düşmeden yapan asistan. Hem müşteri hem tedarikçi bulur."*

Öne çıkacak beş özellik:
1. **Hem müşteri hem tedarikçi arama**: Rakiplerin çoğu yalnızca satışa odaklı.
2. **Teslim edilebilirlik baştan tasarımda**: Teslim puanı, günlük limit, rastgele aralık, gönderim sağlığı kontrolü.
3. **Kendi mail hesabından gönderim** (Outlook / Gmail): Ayrı alan adı veya mail sunucusu kurmak gerekmez.
4. **Türkçe arayüz, Türkçe ve yabancı dilde mail**, KVKK / 6563 / GDPR notları ve "bir daha yazma" listesi.
5. **KOBİ fiyatı**: Bir iş geliştirme personelinin aylık maliyetinin küçük bir kısmı.

## 2. Araştırmadan çıkan kurallar (ürüne gömüldü)

- **Gmail, Yahoo ve Microsoft** Kasım 2025'ten beri SPF, DKIM, DMARC, tek tıkla listeden çıkma ve %0,3'ün altında şikâyet oranı şartını sağlamayan mailleri reddediyor (hedef %0,1).
- **Soğuk mail temposu:** Adres başına günde 20–50 mail; mailler arasında rastgele 3–8 dakika; yeni adres için 3 haftalık ısınma.
- **Takip dizisi:** 4–6 adım tek maile göre yaklaşık 3 kat yanıt getirir. Yanıtların %58'i ilk mailden, %35'i 2–4. adımlardan gelir. İlk takip 3. gün; her takip yeni bir açıdan.
- **Yanıt oranı:** %3–6 normal, %8–12 iyi, firmaya özel kişiselleştirmeyle %15–25.
- **Konu satırı:** 6–10 kelime veya 50 karakter altı; büyük harf ve "ücretsiz, garanti, acil" gibi kelimeler yok; ilk mailde "Re:" yok.
- **Hukuk:**
  - Türkiye: 6563 sayılı Kanun'a göre tacir/esnafa giden mailde önceden onay aranmaz; İYS kaydı gerekip gerekmediği netleştirilmeli.
  - AB: GDPR'da B2B için "meşru menfaat" dayanağı geçerli; dayanak belgelenmeli ve ret talebi hemen uygulanmalı.
  - ABD: CAN-SPAM fiziksel adres ve listeden çıkma yolu istiyor.

## 3. Demoda olanlar (v5)

- Panel: bugünkü işler, göstergeler, takipler, satış hunisi, segmente göre yanıt oranı, gönderim sağlığı
- Ayarlar:
  - Şirket, ürünler (Türkçe ve mail dilinde), müşteri/tedarikçi modu
  - Türkçe ve yabancı dilde imza
  - Düzenlenebilir mail şablonları ({firma}, {giris}… değişkenleriyle)
  - Takip dizisi günleri, gönderim kuralları, gönderim sağlığı kontrol listesi
  - Yasal notlar ve "bir daha yazma" listesi
- Araştır: Claude ile aday listesi, segment / öncelik / puan / gerekçe, giriş cümlesi, dil tespiti, kampanya etiketi, tekrar önleme
- Adaylar: filtreler, kampanyalar, CSV içe/dışa aktarma, aday detay paneli (geçmiş, adres doğrulama, dil, notlar)
- Mailler:
  - Şablondan taslak, Claude ile kişiselleştirme, canlı teslim puanı
  - Güvenli gönderim kuyruğu; günlük limit dolunca sonraki iş gününe planlama
- Takip: dizi takvimi, gecikenler, tamamlanan diziler, sıcak fırsatlar
- Yanıt asistanı: gelen yanıtı sınıflandırma (ilgili / görüşme / sonra / ilgisiz / listeden çık) ve cevap taslağı
- **Otonom gönderim (v5):**
  - Kullanıcı Ayarlar'dan açar, günlük en fazla adedi seçer ve onaylar.
  - Pusula gönderim saatlerinde zamanı gelen takipleri hazırlar ve kurallara uyan mailleri kendisi gönderir.
  - Cevaplar, doğrulanmamış adresler ve düşük puanlı mailler her zaman kullanıcıya kalır.
  - Aynı gün 2 firma listeden çıkarsa kendini kapatır.
  - Sunucu karşılığı `pusula-sunucu/` klasöründe; Microsoft 365 ve Gmail için yazıldı, 13 testle denendi.

**Demonun sınırları:** Gerçek mail göndermez; araştırma canlı web araması değil, Claude'un kendi bilgisinden yapılır; veriler tek kullanıcılık.

## 4. Tam ürün için teknik mimari

| Katman | Öneri | Not |
|---|---|---|
| Uygulama | Web uygulaması + PWA (telefona kurulabilir); ileride masaüstü sarmalayıcı | Tek kod tabanı; demo arayüzü temel alınabilir |
| Sunucu | Node.js (TypeScript) API + PostgreSQL | Çok kullanıcılı, şirket bazlı çalışma alanları |
| Gönderim | Microsoft Graph (Outlook) ve Gmail API, OAuth ile kullanıcının kendi hesabından | Graph: posta kutusu başına dakikada 30, günde 10.000; Gmail Workspace: günde 2.000. Pusula bunların çok altında (günde 20–50) çalışır |
| Kuyruk | Zamanlanmış iş kuyruğu (ör. BullMQ / Postgres tabanlı) | Rastgele aralık, iş saati, hafta içi, alıcı saat dilimi |
| Yanıt takibi | Graph / Gmail ile gelen kutusunu okuma, konuşma eşleştirme | Yanıt gelince dizi otomatik durur |
| Araştırma | Claude API + web araması (Claude'un web search aracı veya Brave / Serper / Exa) + firma sitesini okuma | Her aday için kaynak bağlantısı saklanır |
| Adres doğrulama | MX/SMTP kontrolü + doğrulama servisi (NeverBounce / ZeroBounce) | Geçersiz adres oranı %2'nin altında tutulur |
| Gönderim sağlığı | Alan adının SPF / DKIM / DMARC kayıtlarını otomatik okuma | Eksikse adım adım kurulum rehberi |
| Uyum | Listeden çıkma bağlantısı ve başlıkları, "bir daha yazma" listesi, kaynak ve dayanak kaydı, veri silme | KVKK aydınlatma metni, AB için veri işleme sözleşmesi |

**Yapay zekâ modeli seçimi:** Araştırma ve kişiselleştirme için Claude Opus 5.5 (girdi 4 $ / çıktı 20 $, milyon token başına) ya da maliyet için Claude Sonnet 5.5 (2 $ / 10 $). Toplu ve basit işler (yanıt sınıflandırma) için Claude Haiku 4.5 (1 $ / 5 $). Seçim, kaliteyi gerçek örnekler üzerinde ölçerek yapılmalı.

## 4a. Canlı araştırma altyapısı: kimin hesabından, ne kullanarak?

**Kısa cevap:** Kendi yapay zekâmızı veya kendi arama motorumuzu yapmamıza gerek yok. Pusula, şirketin (Pusula'nın) kendi API hesaplarını kullanır. Faturası kullanım kadardır ve abonelik fiyatının içindedir. Kullanıcının ya da sizin kişisel Claude hesabınız hiç kullanılmaz.

**Neden kendi arama motorumuz olmaz:** Google veya Bing gibi bir dizin kurmak milyarlarca sayfa taramak demek; milyonlarca dolarlık bir iştir. Arama motoru sonuçlarını izinsiz kazımak da kullanım şartlarına aykırıdır ve sürekli engellenir. Google'ın ucuz arama API'si (Custom Search JSON API) yeni müşterilere kapandı ve 1 Ocak 2027'de tamamen kapanıyor.

**Neden kendi yapay zekâmız olmaz:** Pahalı olan kısım aramanın kendisidir, yapay zekâ değil. Açık kaynak bir modeli kendi GPU sunucumuzda çalıştırmak az kullanıcıyla API'den daha pahalıya gelir. Kalitesi de daha düşük olur ve bakım yükü getirir. Kullanıcı sayısı çok büyürse bu karar yeniden değerlendirilir.

**Önerilen yapı: katmanlı ve ucuzdan pahalıya**

| Katman | Kaynak | Maliyet | Ne için |
|---|---|---|---|
| 1. Açık veri | OpenStreetMap (otel, fabrika, mağaza; konum ve web sitesi), Wikidata (şirket, sektör, merkez, web sitesi), resmî listeler (ticaret sicili, ihracatçı birlikleri, fuar katılımcı listeleri, İSO 500 gibi) | Ücretsiz | Bölge ve sektöre göre ham firma listesi |
| 2. Arama API'si | Brave Search API (1.000 sorgu 5 $, her ay 5 $ kredi) veya Tavily (ayda 1.000 sorgu ücretsiz, sonra ~0,008 $). Yedek: Serper, Exa | 1.000 sorguda ~1–8 $ | Haber, proje, yeni yatırım gibi güncel bilgi; açık veride olmayan firmalar |
| 3. Firma sitesini okuma | Kendi sunucumuz firmanın "iletişim / hakkımızda" sayfasını indirir | Ücretsiz | Gerçek kurumsal e-posta, ürünler, giriş cümlesi için kaynak |
| 4. Yapay zekâ | Claude API (Haiku 4.5: 1 $ / 5 $; zor işler için Sonnet 5.5). Gerekirse Claude'un yerleşik web araması (1.000 aramada 10 $) | 20 adaylık araştırma başına ~0,05–0,15 $ | Sınıflandırma, puanlama, gerekçe, kişisel giriş cümlesi |
| 5. Adres doğrulama | Kendi MX kontrolümüz (ücretsiz) + gerekirse NeverBounce/ZeroBounce | Adres başına ~0,008 $ | Geri dönen mail oranını %2'nin altında tutmak |
| 6. Önbellek | Bulunan firma ve siteler 30 gün saklanır | Ücretsiz | Aynı bölgeyi arayan ikinci kullanıcıya maliyet sıfıra yakın |

**20 adaylık bir araştırmanın tahmini maliyeti:** ~10 arama (0,01–0,05 $), site okuma (0), yapay zekâ (~0,05–0,15 $) ve doğrulama (~0,16 $) ile toplam **yaklaşık 0,2–0,35 $ (8–15 TL)**. Profesyonel pakette ayda 50 araştırma ≈ 10–18 $. Bu tutar 3.490 TL'lik paket fiyatının içinde rahatça kalır.

**Kontrol mekanizmaları:**
- Her pakete aylık araştırma kotası konur; fazlası "ek kredi" olarak satılır.
- Kurumsal müşteriler isterse kendi API anahtarlarını bağlayabilir.
- Tek bir arama sağlayıcısına bağımlı kalmamak için arama katmanı değiştirilebilir yazılır.

### Başlangıç: ücretsiz kaynaklarla ilk sürüm

Gelir başlayana kadar ücretli servis kullanmadan ilerlenir. Kaliteyi korumanın yolu, yapay zekâya veri **uydurtmamak** ve her bilgiyi bir kaynağa dayandırmaktır.

| İhtiyaç | Ücretsiz çözüm | Sınır / dikkat |
|---|---|---|
| Firma listesi (konum bazlı: otel, resort, fabrika, mağaza) | OpenStreetMap verisi (Overpass). Ticari kullanım için Private.coffee'nin ücretsiz ve sınırsız sunucusu ya da kendi kopyamız | OSM'nin genel sunucusu ticari düzenli kullanım için değil; uygulama kendini tanıtan bir User-Agent göndermeli |
| Firma listesi (büyük şirketler) | Wikidata (sektör, merkez, web sitesi) | Küçük firmalar eksik olabilir |
| Güncel haber ve projeler | Tavily: ayda 1.000 arama ücretsiz, kredi kartı gerekmez. Yedek: Brave'in her ay verdiği 5 $ kredi (~1.000 arama) | Önbellekle aynı arama tekrarlanmaz |
| Kurumsal e-posta | Firmanın kendi "iletişim" sayfasını sunucumuz okur | Ücretsiz; yalnızca sitede yayımlanmış adres alınır |
| Adres kontrolü | Alan adının mail sunucusu (MX) kaydını kontrol etmek | Ücretsiz; adresin varlığını %100 kanıtlamaz, ama yanlış alan adlarını eler |
| Yapay zekâ (sınıflandırma, giriş cümlesi) | Google Gemini Flash-Lite ücretsiz katmanı | Dakikada 5–15, günde 100–1.000 istek; ücretsiz katmanda gönderilen veri Google'ın ürün geliştirmesinde kullanılabilir. Bu yüzden yalnızca kamuya açık firma bilgisi gönderilir, kullanıcıya özel veri gönderilmez |
| Sunucu ve zamanlayıcı | Cloudflare Workers ücretsiz: günde 100.000 istek ve zamanlanmış görevler | Pilot için fazlasıyla yeterli |
| Veritabanı | Supabase ücretsiz (500 MB) | Bir hafta hiç kullanılmazsa durur; günlük zamanlanmış görev bunu engeller |

**Yanlış veriyi önleyen kurallar:**
1. E-posta adresini yapay zekâ **önermez**; adres yalnızca firmanın kendi sitesinden alınır. Bulunamazsa alan boş kalır.
2. Her aday için kaynak bağlantısı saklanır ve kullanıcıya gösterilir.
3. Firma, bir açık veri kaynağında ya da kendi sitesinde görülmeden listeye girmez. Web sitesi açılmayan firma elenir.
4. Yapay zekâ yalnızca bulunan metinden çıkarım yapar: sınıflandırma, puan, giriş cümlesi. Kaynakta olmayan rakam veya proje yazmaz; giriş cümlesi kaynaktaki bir bilgiye dayanmak zorundadır.
5. MX kontrolünü geçemeyen adres "doğrulanmadı" olur ve otonom gönderime girmez.
6. Test modu varsayılan olarak açıktır.

**Ne zaman ücretliye geçilir:**
- Ücretsiz kotalar dolduğunda ya da ilk ödeme yapan müşteriler geldiğinde.
- Yapay zekâ Claude Haiku'ya geçer. 20 adaylık bir araştırma yaklaşık 0,05 $ tutar ve ücretli kullanımda veriler eğitimde kullanılmaz.
- Arama ve adres doğrulama da ücretli paketlere geçer.

Sistem sağlayıcıdan bağımsız yazılacağı için bu geçişler kod değişikliği değil, ayar değişikliği olur.

**Demo ile farkı:** Demodaki "Araştır" düğmesi, sayfayı açan kişinin claude.ai hesabı üzerinden Claude'a soruyor ve cevap modelin kendi bilgisinden geliyor; canlı web araması yok. Gerçek üründe bu çağrı Pusula sunucusuna gider ve yukarıdaki katmanlar çalışır. Kullanıcı yalnızca sonucu görür.

## 5. Kullanıcı başı tahmini değişken maliyet (aylık)

Varsayım: Aktif bir kullanıcı ayda 20 araştırma (200 aday), 600 mail (tanışma + takip) ve 60 yanıt işliyor. Model Claude Sonnet 5.5.

| Kalem | Hesap | Aylık |
|---|---|---|
| Araştırma | 20 × (~30 bin girdi + ~4 bin çıktı token ≈ 0,10 $) + web araması (~5 arama × 20) | ~3–4 $ |
| Mail kişiselleştirme | 600 mail, 10'arlı gruplar (~8 bin girdi + 3 bin çıktı ≈ 0,05 $ / grup) | ~3 $ |
| Yanıt işleme | 60 × ~2 bin token, Haiku 4.5 | < 0,5 $ |
| Adres doğrulama | 200 × ~0,008 $ | ~1,6 $ |
| Sunucu, depolama, e-posta API | | ~1–2 $ |
| **Toplam** | | **~9–11 $** |

*Web araması ücretleri sağlayıcıya göre değişir (Serper ~0,3–1 $, Brave 5 $, Tavily ~5–8 $, Exa ~4–7 $, Claude web araması 10 $ / 1.000 sorgu; Brave'in ücretsiz paketi 2026'da yeni kullanıcılara kapandı). Rakamlar kaba tahmindir; pilot kullanıcı verisiyle güncellenmeli.*

## 6. Fiyatlandırma önerisi

| Paket | Kime | İçerik | Fiyat önerisi |
|---|---|---|---|
| Deneme | Herkes | 14 gün; 50 aday, 100 mail | Ücretsiz |
| Başlangıç | Tek kişilik firma | 1 gönderen adres; ayda 300 aday, 1.500 mail; Türkçe + 1 yabancı dil | ~1.490 TL / ay (≈ 35–40 $) |
| Profesyonel | Aktif ihracatçı | 3 gönderen adres, ayda 1.000 aday, 5.000 mail, tüm diller, tedarikçi modu, CSV, yanıt asistanı | ~3.490 TL / ay (≈ 85–90 $) |
| Ekip | Satış ekibi | 10 kullanıcıya kadar, ortak çalışma alanı, yönetici paneli, CRM aktarımı | ~8.990 TL / ay |

**Gerekçe:** Türkiye'de tam zamanlı bir iş geliştirme uzmanının işverene maliyeti aylık on binlerce TL. Profesyonel paket bunun çok küçük bir kısmına geliyor ve değişken maliyetin yaklaşık 8 katı fiyatla iyi bir brüt marj bırakıyor. Yıllık ödemede 2 ay indirim önerilir.

## 7. Yol haritası

| Aşama | Süre | Kapsam |
|---|---|---|
| 0. Demo (şimdi) | Tamam | Tıklanabilir demo, Karea–Maldivler örneği |
| 1. Pilot (MVP) | 6–8 hafta | Outlook ile gerçek gönderim, canlı web araması, adres doğrulama, çok kullanıcılı hesap, yanıt takibi; **5–10 pilot firma** (Karea ilk kullanıcı) |
| 2. Satışa hazır sürüm | +6 hafta | Gmail desteği, ödeme altyapısı (iyzico/Stripe), paketler, KVKK metinleri, listeden çıkma bağlantısı, alan adı sağlık kontrolü |
| 3. Büyüme | +3 ay | LinkedIn için mesaj taslağı (otomasyonsuz), CRM entegrasyonları (HubSpot, Pipedrive), ekip özellikleri, A/B konu testi, sektör şablon kütüphanesi |

## 8. Pazara giriş

1. **İlk referans Karea Enerji:** Maldivler kampanyasının sonuçlarını (yanıt oranı, görüşme sayısı) vaka çalışmasına dönüştürün.
2. **Hedef kitleye ulaşma kanalları:** İhracatçı birlikleri (TİM ve sektör birlikleri), OSB'ler, KOSGEB ve ticaret odası eğitimleri, ihracat danışmanları (bayi/ortak modeli, %20–30 komisyon).
3. **Satış dili:** "İş geliştirme personeli maliyetinin yanında küçük bir abonelik", "Kendi mailinizden, spama düşmeden", "Hem müşteri hem tedarikçi".
4. **Destek programları:** Dijital dönüşüm ve ihracat destek programlarıyla kullanıcıların abonelik maliyetinin bir kısmını karşılayıp karşılayamayacağını araştırın.

## 9. Riskler ve önlemler

| Risk | Önlem |
|---|---|
| Kullanıcıların toplu ve özensiz gönderimle alan adını yakması | Varsayılan sıkı limitler, teslim puanı, ısınma takvimi; limit aşımına izin verilmez |
| Yapay zekânın yanlış veya uydurma bilgi üretmesi | Her aday için kaynak bağlantısı; "doğrulanmadı" etiketi; mailde yalnızca kaynaklı bilgi |
| Hukuki şikâyet | Listeden çıkma her mailde, "bir daha yazma" listesi kalıcı, dayanak kaydı; hukukçu ile KVKK / İYS teyidi |
| Mail sağlayıcıların kural değişikliği | Kendi hesabından düşük hacimli gönderim; sağlık kontrolleri güncel tutulur |
| Rakiplerin Türkçeye girmesi | Türk KOBİ'sine özel iş akışı, yerel ödeme, yerel destek, tedarikçi modu |

---

*Kaynaklar: Gmail/Yahoo/Microsoft toplu gönderen kuralları (powerdmarc.com, redsift.com); soğuk mail teslim edilebilirliği (clay.com, mailreach.co, instantly.ai); takip ve yanıt oranları (woodpecker.co, apollo.io, unifygtm.com); konu satırı ve spam kelimeleri (instantly.ai, mixmax.com, litemail.ai); rakip fiyatları (apollo.io, marketbetter.ai, formanorden.com); Türkiye platformları (bilvio.com, kobimatik.com, internationaltradeai.com); 6563 sayılı Kanun (cenuta.com, verimor.com.tr); GDPR (gdprlocal.com, overloop.com); API limitleri (unipile.com); web araması ve adres doğrulama fiyatları (brave.com, buildmvpfast.com, exa.ai, cleanlist.ai); Claude API fiyatları (Anthropic); Google Custom Search kapanışı (brave.com/learn/google-api-shutdown); Brave ve Tavily fiyatları (costbench.com, docs.tavily.com); Gemini ücretsiz katmanı (flo2.com, costbench.com); Supabase ve Cloudflare ücretsiz planları (automationatlas.io, developers.cloudflare.com); Overpass kullanım kuralları (wiki.openstreetmap.org). Bu belge hukuki görüş değildir.*
