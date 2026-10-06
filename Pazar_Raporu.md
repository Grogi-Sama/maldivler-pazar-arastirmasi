# Maldivler Resort Adaları – GES + Enerji Depolama Pazar Raporu

**Hazırlanan:** Karea Enerji iş geliştirme | **Tarih:** Ekim 2026 | **Yöntem:** Kamuya açık kaynaklarla masa başı araştırma
**Ek dosya:** `Maldivler_Potansiyel_Musteri_Listesi.xlsx` (90 resort ve kurumsal iletişim bilgileri, işletmeci gruplar ve merkez ofisleri, rakipler, ortak adayları, kamu kurumları, geri dönüş hesaplayıcısı)

---

## 1. Kısa özet (yönetici için)

- **Hipotez doğrulandı.** Maldivler'de resortlar ulusal şebekeye bağlı değil; her resort adası kendi elektriğini çoğunlukla **dizel jeneratörle** üretiyor. Resortlarda yaklaşık **144 MW** dizel kapasitesi var.
- **Elektrik pahalı:** Dizelle üretim maliyeti **0,23–0,33 $/kWh**, küçük adalarda **0,70 $/kWh**'e kadar çıkıyor. 2026'daki petrol şokuyla dizel litresi **~1,14 $**'a (17,54 MVR) yükseldi.
- **Geri dönüş kısa:** 150 odalı örnek resortta 1 MWp GES + 1 MWh batarya (ESS) yatırımı yaklaşık **4 yılda** kendini ödüyor (Huawei'nin kendi Soneva Secret vakası da 4–5 yıl diyor).
- **Pazar canlı ama dolmadı:** 179 resortun yaklaşık 50–60'ında bir miktar GES var (çoğu Swimsol). Ancak **bataryalı (ESS) sistem kuran resort sayısı hâlâ az.** Asıl fırsat: (1) GES'i olup bataryası olmayan resortlara **ESS ilavesi**, (2) hiç GES'i olmayan büyük resortlara **GES + ESS paketi**, (3) **yeni yapılan** resortlara tasarım aşamasında girmek.
- **Türk bağlantısı teyit edildi:** **Ayada Maldives** (Gaafu Dhaalu, ~110 oda) Ankara merkezli **Aydeniz Grubu**'na ait ve kamuya açık GES bilgisi yok. Türkçe, doğrudan sahiple görüşülebilecek, ilk referans için en sıcak aday.
- **Dikkat:** **Huawei bölgede zaten var** (Soneva Secret 3 MWh; Royal Rosewood 40 MWh, Ağustos 2026). Karea'nın Huawei ile Maldivler'de satış yapma yetkisi netleştirilmeli. **HYXI'nin ise Maldivler'de bilinen hiçbir projesi yok** → ilk referansı Karea yapabilir.

---

## 2. Enerji durumu – hipotezin doğrulanması

| Konu | Bulgu |
|---|---|
| Şebeke | Ulusal şebeke yok. Yerleşik adalarda devlet şirketleri STELCO (Malé) ve FENAKA (dış adalar) elektrik veriyor; **resortlar kendi santralini işletiyor**, kamu tarifesi uygulanmıyor. |
| Resort sayısı | 2026'da **179 faal resort**, ~44.800 yatak. Yenileri yapılıyor (Mandarin Oriental, Bvlgari, Aman, Capella, Rosewood Ranfaru…). |
| Tüketim | Büyük bir resort günde **12.000–17.000 kWh** tüketiyor (ör. RAH GILI ~17.000 kWh/gün). Oda başına günlük dizel tüketimi **46 litreden** (yoğun sezon) **130 litreye** (ultra lüks) kadar. |
| Dizel maliyeti | Üretim maliyeti **0,23–0,33 $/kWh**. Sun Siyam'ın açıkladığı tasarruf rakamı (6 GWh'e 1,29 M$) ≈ **0,21 $/kWh** demek. 2026'da dizel fiyatı Mart'ta %26 arttı (13,92 → 17,54 MVR/L). |
| Enerji karışımı | Ülke elektriğinin ~%93'ü fosil yakıt. Yenilenebilir kapasite 53 MW'tan 126 MW'a çıktı. |

**Sonuç:** Dizel pahalı, fiyatı oynak ve adaya tekneyle taşınıyor (tedarik riski). Resort yönetimi için GES + batarya hem maliyet hem de "yakıt gelmezse ne olur?" riskine karşı güvence.

## 3. Mevzuat ve kurumlar

- **Enerji bakanlığı:** *Ministry of Climate Change, Environment and Energy* – Şubat 2025'te turizmle birleştirilmiş, **Nisan 2026'da yeniden ayrı bakanlık** oldu.
- **Utility Regulatory Authority (URA):** 26/2020 sayılı Kanun ile kuruldu. Ticari amaçla elektrik **üretmek veya dağıtmak için izin** gerekiyor; net metering (fazla elektriği şebekeye satma) düzenlemesi var. Resortlar "kendi tüketimi için üretici" sayıldığından süreç görece basit, ancak **kurulum öncesi URA'dan lisans/onay gerekliliği yerel ortakla teyit edilmeli.**
- **Vergi:** Yenilenebilir enerji ürünlerinde **ithalat vergisi kaldırıldı**; resort yatırımlarında da gümrük muafiyetleri var (Maldives Customs ile teyit edilmeli).
- **Hedef:** Cumhurbaşkanı Muizzu'nun hedefi **2028'e kadar enerjinin %33'ü yenilenebilir.** Resort sektörüne zorunluluk getirilmedi ama baskı artıyor.

## 4. Teşvik ve finansman programları

| Program | Kim | Ne yapıyor | Karea için anlamı |
|---|---|---|---|
| **ASPIRE** | Dünya Bankası | Özel sektöre GES PPA ihaleleri; tarife 21¢ → **10,9¢/kWh**'e düştü | Kamu tarafı; fiyat referansı |
| **ARISE** | Dünya Bankası (100 M$) | Batarya depolama + şebeke entegrasyonu; ~50 MWh BESS hedefi | Kamu ESS ihaleleri (STELCO/FENAKA) |
| **POISED** | ADB | Dış adalarda hibrit (dizel+GES+ESS) – ortalama **%25 yakıt tasarrufu** | Referans vaka |
| **ASSURE** | ADB (41,5 M$ hibe) | **18 adada 40 MWh BESS + EMS** ihalesi | Doğrudan ESS ihale fırsatı (yerel ortakla) |
| Yeşil kredi | Ticari bankalar | Pontiac Land (Fari Islands) 180 M$ yeşil kredi aldı | Resortların finansmanı mümkün |

**Resortlarda yaygın iş modeli:** Yatırımcı (ör. Swimsol) GES'i kendi parasıyla kurar, resort elektriği **~13¢/kWh sabit fiyattan** 10 yıl alır (PPA), sonra sistemi 1 $'a devralır. Yani resortlar "peşin para vermeden tasarruf" teklifine alışık. Karea'nın da bir finansman/PPA ortağıyla gelmesi satışı kolaylaştırır.

## 5. Rakipler ve mevcut projeler

| Firma | Ne yaptı | Not |
|---|---|---|
| **Swimsol** (Avusturya, Maldivler'de yerleşik) | **50+ resort**, ~50 MWp GES, ~25 MWh batarya. Cheval Blanc 2,4 MWp yüzer GES + 1,95 MWh ESS (yılda 1,5 M$ tasarruf), Taj, LUX*, OZEN, Fari Islands, Ritz-Carlton, Four Seasons | Pazar lideri; bataryayı dışarıdan alıyor → **müşteri/ortak da olabilir** |
| **Canopy Power** (Singapur) | Soneva Fushi + Jani: 5,2 MWp + 4,7 MWh; Soneva Secret: 2 MWp yüzer + **3 MWh Huawei ESS** | Huawei ile çalışıyor |
| **Solmacher** | Royal Rosewood Resort Island: **16 MWp + 40 MWh Huawei ESS** (Ağu. 2026) – Maldivler'in en büyüğü | Huawei'nin bölgedeki ana kanalı |
| **Hayleys Fentons** (Sri Lanka) | Sun Siyam: 4,1 MWp + 2,26 MWh ESS (Aralık 2025) | Bölgesel EPC |
| Yerel kurulumcular | Ecogreen Maldives, Renewable Energy Maldives, Avi Technologies, Solar Atolls vb. | Ortak adayları |
| Distribütör | MYENERGY (Sri Lanka) – EAST Group ESS, Sri Lanka & Maldivler | Doğrudan ürün rakibi |

**HYXI / Huawei durumu:**
- **Huawei:** Maldivler'de iki büyük referansı var. Karea'nın Türkiye distribütörlüğü Maldivler'i büyük ihtimalle kapsamıyor; **Huawei bölge ofisiyle (Güney Asya / Orta Doğu) proje bazlı yetki** görüşülmeli, yoksa Solmacher/Canopy ile kanal çakışması yaşanır.
- **HYXI:** Maldivler'de kamuya açık hiçbir proje bulunamadı. **Boş alan** – HYXI'den Maldivler için proje desteği / bölge yetkisi alınarak ilk referans hedeflenebilir.

## 6. Örnek geri dönüş hesabı

*Excel'deki "Geri Dönüş Hesabı" sekmesinde sarı hücreleri değiştirerek kendi senaryonuzu hesaplayabilirsiniz.*

**Senaryo:** ~150 odalı resort, günde ~12.000 kWh tüketim. 1.000 kWp çatı/arazi GES + 1.000 kWh batarya.

| Varsayım | Değer |
|---|---|
| GES üretimi | 1.400 kWh/kWp/yıl → **1,4 milyon kWh/yıl** |
| GES maliyeti | 1.100 $/kWp (ada lojistiği dahil) |
| Batarya maliyeti | 400 $/kWh (C&I ESS, kurulum + EMS dahil) |
| Kaçınılan dizel maliyeti | 0,25 $/kWh |
| Jeneratör bakım/çalışma tasarrufu | 40.000 $/yıl |
| Yıllık bakım | yatırımın %1,5'i |

| Sonuç | Değer |
|---|---|
| Toplam yatırım | **1,5 milyon $** |
| Yıllık brüt tasarruf | 390.000 $ |
| Yıllık net tasarruf | **~367.500 $** |
| **Basit geri dönüş** | **~4,1 yıl** |
| Yenilenebilir payı | ~%32 |
| Yılda tasarruf edilen dizel | ~400.000 litre |

**Duyarlılık:** Dizel maliyeti 0,20 $/kWh → 5,0 yıl | 0,30 $/kWh → 3,4 yıl | 0,35 $/kWh → 3,0 yıl.
*Not: Bataryada 10–12. yıl civarı kapasite yenilemesi düşünülmeli. Rakamlar ön fizibilite içindir; her resort için yük profili (saatlik tüketim) ile kesinleştirilmelidir.*

## 7. Giriş stratejisi

1. **Önce gruplar, sonra adalar.** Kararlar çoğunlukla Malé'deki grup merkezinde (Technical Services / Engineering Director) veriliyor. Tek görüşme 5–10 adayı açar. Öncelikli gruplar: **VERSA Hospitality (eski Universal Resorts), Villa Hotels, Sun Siyam (2. faz), Crown & Champa (Kuredu Holdings dahil), Atmosphere Core.** Merkez ofis iletişim bilgileri Excel'deki "İşletmeci Gruplar" sekmesinde. Küresel markalarda (Hilton, Marriott, IHG) kararı **mülk sahibi şirket** verir, marka değil.
2. **İki ayrı teklif:**
   - **"Bataryanı ekle" teklifi:** GES'i olup bataryası olmayan resortlar (çoğu Swimsol müşterisi). Batarya, gündüz fazla güneşi geceye kaydırır ve jeneratör çalışma saatlerini düşürür. Satışı en kolay ürün.
   - **"Komple hibrit" teklifi:** Hiç GES'i olmayan büyük resortlar (Sun Island, Paradise Island, Kuredu, Kandima, Meeru, Bandos…).
3. **Yerel ortak şart.** Kurulum, URA izinleri, servis ve gümrük için bir Maldivler kurulumcusuyla (Ecogreen, REM vb.) veya bölgesel EPC ile (Hayleys Fentons) çalışın. Karea: ürün + teknik tasarım + eğitim; ortak: saha ve servis.
4. **Finansman ile gelin.** Resortlar "peşin ödemesiz, kWh başına öde" (PPA/kiralama) modeline alışık. Bir yatırım fonu / leasing şirketiyle model hazırlamak satış hızını ciddi artırır.
5. **Swimsol'u da müşteri olarak görün.** 50+ resortta GES'leri var ve batarya tedarikçisi arıyor olabilirler.
6. **Ürün kanalını netleştirin.** HYXI: Maldivler yetkisi ve fiyat desteği. Huawei: mevcut kanallarla çakışmamak için bölge ofisiyle proje kaydı.
7. **Türk bağlantısını kullanın.** Ayada Maldives'in sahibi Aydeniz Grubu (Ankara; info@aydeniz.com, +90 312 212 6612). İlk pilot proje için Ankara'da yüz yüze görüşme önerilir. Türk inşaat firmalarının yaptığı yeni projeler de sıcak giriş noktası olabilir. Malé'deki T.C. temsilciliğinden destek istenebilir.

### Pazardaki son değişiklikler (2025–2026)
- Universal Resorts → **VERSA Hospitality**; resortları **Niva** markasıyla yeniden adlandırılıyor (Niva Kurumba, Niva Kuramathi, Niva Velassaru, Niva Dhigali).
- Sun Island → **Villa Park**; Paradise Island → **Villa Nautica**; Centara Grand → **Machchafushi Island Resort**; Reethi Beach → **NH Collection Maldives Reethi**; Faarufushi → **Emerald Faarufushi** (Emerald grubu).
- Kuredu ve Komandoo, **Crown & Champa** ortağı Kuredu Holdings'e ait.
- RAH GILI Maldives 2 MW GES + 2,5 MWh batarya kurdu (rakip tarafından alınmış).

## 8. Önerilen sonraki adımlar (ilk 90 gün)

| # | Adım | Süre |
|---|---|---|
| 1 | HYXI ve Huawei ile Maldivler satış yetkisi/kanal durumunu yazılı netleştirin | 2 hafta |
| 2 | **Aydeniz Grubu (Ayada) ile Ankara'da görüşme** – pilot proje teklifi | 2–4 hafta |
| 2b | Excel'deki **A önceliğindeki 15 resort** ve öncelikli gruplara kurumsal adreslerden tanıtım maili (konu: "Attn: Director of Engineering"); LinkedIn'de "Chief Engineer + resort adı" ile kişileri bulun | 2 hafta |
| 3 | 2–3 yerel ortak adayıyla (Ecogreen, REM, Avi Technologies) online görüşme | 3–4 hafta |
| 4 | Türkçe/İngilizce tek sayfalık teklif broşürü: "Bataryanı ekle – dizelini %X azalt", örnek geri dönüş tablosuyla | 3 hafta |
| 5 | İlgilenen 3–5 resorttan son 12 ayın **dizel tüketimi ve saatlik yük verisini** isteyip ücretsiz ön fizibilite yapın | 4–8 hafta |
| 6 | Malé'ye 1 haftalık saha ziyareti (grup merkezleri + 2–3 resort + ortak adayı + MATI) | 2–3. ay |
| 7 | ADB ASSURE (40 MWh BESS) gibi kamu ihalelerini yerel ortakla takip edin | Sürekli |

---

## Kaynaklar

- CIF / ADB – Maldivler vaka çalışması (dizel maliyetleri, resort dizel kapasitesi): https://www.cif.org/sites/cif_enc/files/knowledge-documents/66436_191219_maldives_case_study_v7s.pdf
- ADB – Maldivler yenilenebilir enerji yol haritası: https://www.adb.org/sites/default/files/publication/654021/renewables-roadmap-energy-sector-maldives.pdf
- Maldivler Enerji Yol Haritası 2024–2033: https://www.environment.gov.mv/v2/wp-content/files/publications/20241107-pub-energy-roadmap-maldives-2024-2033-.pdf
- %33 @2028 hedefi: https://en.mmtv.mv/246
- Yenilenebilir kapasite 126 MW: https://edition.mv/news/54359
- Dizel fiyatları 2026: https://www.globalpetrolprices.com/Maldives/diesel_prices/ ve https://maldivesindependent.com/economy/half-a-gas-cylinder-double-the-diesel-price-the-oil-shock-hits-maldives-d022
- Resort ve yatak sayısı 2026: https://en.maaldif.com/11791/
- Swimsol / Cheval Blanc: https://www.businesswire.com/news/home/20260422437338/en/Swimsols-SolarSea-Maldives-Largest-Floating-Solar-Array-at-Sea-Saves-One-Island-USD-1.5-Million-Per-Year
- Fari Islands: https://www.pv-magazine.com/2025/07/11/fari-islands-set-to-triple-use-of-solar-energy/
- Solmacher + Huawei 40 MWh: https://www.constructionworld.in/energy-infrastructure/power-and-renewable-energy/solmacher-signs-huawei-deal-for-40-mwh-bess-in-maldives/96106
- Huawei – Soneva Secret: https://digitalpower.huawei.com/en/cases/fusionsolar/floating-solar-maldives
- Canopy Power – Soneva: https://www.canopypower.com/resources/floating-solar-in-maldives
- Sun Siyam GES + ESS: https://www.ttgasia.com/2025/12/16/sun-siyam-launches-major-solar-energy-project-in-maldives-resorts/
- Veligandu: https://veligandu.com/sustainability/veligandu-solar-power/
- RAH GILI tüketim verisi: https://hoteliermaldives.com/solar-at-scale-how-rah-gili-maldives-is-reducing-diesel-dependence-and-embracing-sustainability/
- ASSURE 40 MWh BESS ihalesi: https://www.energy-storage.news/maldives-launches-tender-seeking-40mwh-bess-and-ems-across-18-islands/
- Pontiac Land yeşil kredi: https://hotelsmag.com/news/pontiac-land-secures-green-loan-in-the-maldives/
- URA / Enerji Kanunu: https://www.ctlstrategies.com/latest/maldives-energy-act/
- Yeni resortlar 2026–2027: https://resortlife.travel/maldives-new-resorts

*Sınırlamalar: Bu çalışma internetteki kamuya açık kaynaklara dayanır; bazı kaynak sayfalarına doğrudan erişilemediği için arama özetlerinden yararlanılmıştır. Oda sayıları yaklaşıktır. "Doğrulanmalı" işaretli bilgiler görüşme öncesi teyit edilmelidir. Kişisel veri toplanmamıştır.*
