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

## 3. Demoda olanlar (v3)

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

*Web araması ücretleri sağlayıcıya göre değişir (Serper ~0,3–1 $, Brave ~5 $, Exa ~4–7 $ / 1.000 sorgu). Rakamlar kaba tahmindir; pilot kullanıcı verisiyle güncellenmeli.*

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

*Kaynaklar: Gmail/Yahoo/Microsoft toplu gönderen kuralları (powerdmarc.com, redsift.com); soğuk mail teslim edilebilirliği (clay.com, mailreach.co, instantly.ai); takip ve yanıt oranları (woodpecker.co, apollo.io, unifygtm.com); konu satırı ve spam kelimeleri (instantly.ai, mixmax.com, litemail.ai); rakip fiyatları (apollo.io, marketbetter.ai, formanorden.com); Türkiye platformları (bilvio.com, kobimatik.com, internationaltradeai.com); 6563 sayılı Kanun (cenuta.com, verimor.com.tr); GDPR (gdprlocal.com, overloop.com); API limitleri (unipile.com); web araması ve adres doğrulama fiyatları (brave.com, buildmvpfast.com, exa.ai, cleanlist.ai); Claude API fiyatları (Anthropic). Bu belge hukuki görüş değildir.*
