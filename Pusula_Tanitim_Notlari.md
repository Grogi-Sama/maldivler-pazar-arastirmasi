# Pusula – Tanıtım Sunumu İçin Notlar

Bu dosya, sonunda hazırlanacak tanıtım sunumunun ham malzemesidir. Ürüne her yeni özellik eklendiğinde buraya da işlenir.
Teknik ayrıntılar `Pusula_Urun_Plani.md` ve `pusula-sunucu/README.md` dosyalarındadır.

## 1. Tek cümlede Pusula

Firmanızı ve hedefinizi anlatırsınız. Pusula müşteri veya tedarikçi adaylarını bulur, sınıflandırır, kişiye özel tanışma ve takip maillerini hazırlar ve sizin mail adresinizden, spama düşmeden, insan temposunda gönderir.

## 2. Çözdüğü sorun

- Yeni pazar araştırması günler sürüyor; listeler dağınık kalıyor.
- Soğuk mailler ya hiç gönderilmiyor ya da toplu gönderilip spama düşüyor.
- Takip mailleri unutuluyor. Oysa yanıtların büyük kısmı ilk mailden değil takiplerden geliyor: 4–6 adımlık diziler tek maile göre yaklaşık 3 kat yanıt alıyor.
- KOBİ'nin ayrı bir iş geliştirme personeline bütçesi yok.

## 3. Ana özellikler (kullanıcı diliyle)

| Özellik | Kullanıcıya faydası |
|---|---|
| Hem müşteri hem tedarikçi bulma | Aynı araçla satış ve satın alma |
| Otomatik araştırma ve sınıflandırma | Segment, A/B/C öncelik, 0–100 uygunluk puanı, "neden bu firma" gerekçesi |
| Kişiye özel giriş cümlesi | Her mail, firmanın kendi projesine değinerek başlar |
| Türkçe / İngilizce mail | Türk firmalara Türkçe, yabancılara İngilizce otomatik |
| Düzenlenebilir şablonlar | {firma}, {urunler} gibi değişkenlerle kendi üslubunuz |
| Takip dizisi | Tanışma → 3. gün → 7. gün → 14. gün; yanıt gelince durur |
| Hızlı takip hazırlama | Takip ekranından sayfadan ayrılmadan tek tıkla taslak; hepsi Mailler'de toplu gönderilir |
| Bugünkü işler | Panel her sabah ne yapılacağını söyler |
| Yanıt asistanı | Gelen cevabı sınıflandırır (ilgili, görüşme, sonra, ilgisiz, listeden çık) ve cevap taslağı yazar |
| Otonom gönderim | Açın, günlük adedi seçin, onaylayın; Pusula kurallara uyan mailleri kendisi gönderir |
| Test modu | Demo ve denemelerde mailler firmaya değil sizin adresinize gider |
| Kampanyalar ve CSV | Pazar bazında takip; Excel'den içe ve dışa aktarma |
| Mobil, tarayıcı, masaüstü | Tek uygulama her cihazda çalışır |

## 4. Teslim edilebilirlik (spama düşmeme)

- **Kendi adresinizden gönderim:** Mailler Microsoft 365 / Outlook veya Gmail hesabınızdan gider. Toplu mail sunucusu kullanılmaz, alıcı sizin gerçek adresinizi görür.
- **İnsan temposu:**
  - Günde en fazla 20–50 mail
  - Mailler arasında 3–8 dakika rastgele bekleme
  - Yalnızca iş saatleri ve hafta içi
  - Limit dolunca kalanlar bir sonraki iş gününe planlanır
- **Teslim puanı:** Her taslak göndermeden önce puanlanır. Bakılanlar:
  - Uzunluk ve konu satırı
  - Spam tetikleyici kelimeler
  - Bağlantı ve büyük harf kullanımı
  - Kişiselleştirme
  - Listeden çıkma cümlesi ve imza
  - Dil karışıklığı
  - Doğrulanmamış adres
- **Gönderim sağlığı kontrolü:** SPF, DKIM ve DMARC için kontrol listesi. Tam sürümde alan adınızdan otomatik okunur.
  - **SPF:** Alan adınız adına hangi sunucuların mail gönderebileceğini gösteren liste.
  - **DKIM:** Her maile eklenen dijital imza; mailin gerçekten sizden geldiğini ve yolda değişmediğini kanıtlar.
  - **DMARC:** Bu iki kontrolden geçemeyen, sizin adınıza gönderilmiş sahte maillere ne yapılacağını söyleyen kural.
  - Gmail, Yahoo ve Microsoft bu kuralları sağlamayan toplu gönderimleri Kasım 2025'ten beri reddediyor.
- **Isınma önerisi:** Yeni adreste ilk haftalarda düşük adetle başlanır.

## 5. Güvenlik ve kontrol

- **Otonom gönderimde koruma kuralları:** Şunlar hiçbir zaman otomatik gitmez:
  - Cevap mailleri
  - Doğrulanmamış adresler
  - Teslim puanı düşük mailler
  - Yanıt vermiş firmaya gidecek takipler
  - "Bir daha yazma" listesindekiler
- **Güvenlik freni:** Pusula iki durumda otonom gönderimi kendisi kapatır ve nedenini yazar:
  - Aynı gün 2 firma listeden çıkmak isterse
  - Geri dönen mail oranı %5'i aşarsa
- **Onaylı başlatma:** Otonom gönderim, ne gideceğini anlatan bir onay penceresiyle başlar; tek tuşla durdurulur.
- **Test modu varsayılan olarak açık.** Kapatmak ayrıca onay ister.
- **Bağlantı güvenliği:** Outlook ve Gmail'e resmî OAuth izinleriyle bağlanılır; şifreniz Pusula'ya hiç verilmez. İzin her an geri alınabilir. Bağlantı koparsa gönderim durur ve kullanıcı uyarılır.
- **Hata yönetimi:**
  - Sağlayıcı geçici olarak yavaşlatırsa Pusula bekleyip bir kez daha dener.
  - Kalıcı hatada o maili atlar.
  - Yetki hatasında gönderimi durdurur.
- **Verinin sahibi kullanıcıdır:** CSV ile tüm veriler dışa aktarılır, istendiğinde silinir.

## 6. Veri doğruluğu ve uyum

- **E-posta adresleri uydurulmaz:** Yalnızca firmanın kendi sitesinde yayımladığı kurumsal adresler alınır. Kişisel adres tahmini yapılmaz.
- **Her aday için kaynak bağlantısı saklanır.** Doğrulanmamış bilgi "doğrulanmadı" etiketiyle gösterilir.
- **Tekrar önleme:** Aynı firma veya alan adı listeye ikinci kez eklenmez.
- **"Bir daha yazma" listesi** kalıcıdır ve tüm kampanyalarda geçerlidir. Her mailde "ilgilenmiyorsanız yanıt verin, tekrar yazmayacağım" cümlesi bulunur.
- **Gmail gönderimlerinde** tek tıkla listeden çıkma başlığı eklenir (RFC 8058).
- **Hukuki çerçeve:**
  - Türkiye'de 6563 sayılı Kanun kapsamında tacirler arası (B2B) ileti istisnası
  - AB'de GDPR "meşru menfaat" dayanağı
  - Her aday için dayanak kaydı tutulur
  - (Hukuki görüş değildir; KVKK / İYS teyidi bir hukukçuyla yapılmalı.)

## 7. Teknik altyapı (sade anlatım)

- **Uygulama:** Tek kod tabanı. Web, telefon (ana ekrana eklenebilir) ve bilgisayarda çalışır.
- **Sunucu gönderim motoru:** Tarayıcı kapalıyken de çalışır. Kullanıcının saat dilimine göre iş saatlerini hesaplar. Otomatik testlerle denenmiştir (şu an 14 test).
- **Yapay zekâ:** Sınıflandırma, puanlama, kişisel giriş cümlesi ve yanıt analizi. Sağlayıcıdan bağımsız tasarlandı; model değiştirilebilir.
- **Canlı araştırma:** Açık veri (OpenStreetMap, Wikidata, resmî listeler), arama servisi, firma sitesinin okunması ve önbellek katmanları. Ayrıntı: ürün planı bölüm 4a.
- **Ölçeklenme:** Önbellek sayesinde aynı pazarı arayan her yeni kullanıcı için maliyet düşer.

## 8. Kanıt / vaka çalışması

- **Karea Enerji – Maldivler kampanyası:**
  - 90 resort, işletmeci grupları ve yerel EPC'ler araştırıldı ve puanlandı.
  - 77 kişiye özel tanışma maili hazırlandı (Türk sahipli gruplara Türkçe); 59'u gönderildi, 18'i gönderilmeyi bekliyor.
  - *(Sunuma eklenecek: yanıt oranı, görüşme sayısı, teklif sayısı.)*
- **Gerçek hayatta yaşanan bir sorun ve çözümü:** Birden fazla hesabı olan Outlook'ta mailler yanlış hesaptan gitmeye çalıştı ve geri döndü. Kök neden Outlook'un varsayılan veri dosyası ayarıydı. Ürünün kendi gönderim motoru maili doğrudan seçili hesabın API'siyle gönderdiği için bu sorunu yaşamaz.

## 9. Fiyatlandırma ve iş modeli (taslak)

- Deneme ücretsiz.
- Paketler: Başlangıç ~1.490 TL, Profesyonel ~3.490 TL, Ekip ~8.990 TL / ay.
- Aylık araştırma kotası; aşımda ek kredi.
- Satış dili: "İş geliştirme personelinin maliyetinin yanında küçük bir abonelik."

## 10. Sunumda kullanılabilecek kısa mesajlar

- "Firmanı anlat, gerisini Pusula bulsun, yazsın, takip etsin."
- "Kendi mailinden, spama düşmeden, insan temposunda."
- "Hem müşteri hem tedarikçi."
- "Unutulan takip yok: yanıtların çoğu ikinci ve üçüncü mailden gelir."
- "Kontrol sende: otonom gönderim tek tuşla durur, test modunda mailler önce sana gelir."
