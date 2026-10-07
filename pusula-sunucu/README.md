# Pusula sunucu – otonom gönderim motoru

Demo uygulamadaki "Otonom gönderim" düğmesinin gerçek karşılığıdır. Tarayıcı kapalıyken de çalışır.
Mailler kullanıcının **kendi** Outlook (Microsoft 365) veya Gmail hesabından gider; Pusula ayrı bir gönderim sunucusu kullanmaz.

## Ne yapar

Her 5 dakikada bir, otonom gönderimi açık her kullanıcı için `kullaniciTuru()` çalışır:

1. Otonom kapalıysa, gönderim saatleri dışındaysa ya da hafta sonuysa hiçbir şey yapmaz. Saat, kullanıcının saat dilimine göre hesaplanır.
2. Güvenlik freni iki durumda devreye girer ve otonom gönderimi kapatıp nedenini yazar:
   - Aynı gün 2 firma listeden çıkmak istediyse
   - Son gönderimlerde geri dönen mail oranı %5'i aştıysa
3. Zamanı gelen takip maillerini taslağa çevirir. Ayarlarda açıksa, yeni A/B öncelikli adaylara tanışma taslağı da hazırlar.
4. Bugünün planını çıkarır: önce takipler, sonra puanı yüksek adaylara tanışma. Plan, günlük adet sınırını aşmaz.
5. Planda olmayan, yani otomatik **gitmeyen** mailler:
   - Cevaplar
   - Adresi olmayan veya doğrulanmamış firmalar
   - Engelli listesindekiler
   - Yanıt vermiş firmalara gidecek takipler
   - Teslim puanı düşük olanlar
6. Mailleri tek tek gönderir; aralarında 3–8 dakika rastgele bekler.
7. Hataları şöyle ele alır:
   - Bağlantı süresi dolduysa (yetki hatası) otonom gönderimi durdurur ve kullanıcıdan yeniden bağlanmasını ister.
   - Geçici yavaşlatmada bekleyip bir kez daha dener.
   - Kalıcı hatada o maili atlar.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `kurallar.js` | Saat, kota, engel nedenleri, plan ve fren kuralları (saf fonksiyonlar) |
| `gonderim-motoru.js` | Kullanıcı başına bir gönderim turu; veritabanı (`depo`) ve sağlayıcı dışarıdan verilir |
| `saglayicilar/microsoft.js` | Microsoft Graph `sendMail` |
| `saglayicilar/gmail.js` | Gmail API; tek tıkla listeden çıkma başlığını da ekler |
| `test/motor.test.js` | 13 test: kota, hafta sonu, fren, hata türleri, bekleme süresi, istek biçimi |

Testleri çalıştırmak için: `npm test` (Node 20 veya üstü; dış paket gerekmez).

## Gerçek kullanıma geçmek için gerekenler

1. **Microsoft uygulama kaydı**
   - Microsoft Entra'da "Pusula" adıyla çok kiracılı bir uygulama kaydı açılır.
   - İzinler: `Mail.Send`, `offline_access`, cevap takibi için `Mail.Read`.
   - Bazı şirketlerde BT yöneticisinin uygulamaya bir kez onay vermesi gerekir.
2. **Google uygulaması**
   - Google Cloud'da OAuth istemcisi açılır.
   - İzinler: `gmail.send` ve `gmail.readonly`.
   - Bu izinler Google'ın "hassas izin" sınıfında olduğu için yayın öncesi Google doğrulaması gerekir.
3. **Veritabanı (Postgres):** `depo` arayüzündeki fonksiyonlar yazılır. Gerekli tablolar: kullanıcılar, adaylar, taslaklar, günlük, engelliler.
4. **Zamanlayıcı:** Her 5 dakikada bir açık kullanıcılar için tur başlatan bir iş kuyruğu kurulur (BullMQ veya pg-boss). Aynı kullanıcı için aynı anda tek tur çalışır.
5. **Token saklama:** Yenileme anahtarları şifreli tutulur ve süresi dolunca otomatik yenilenir.

**Microsoft'a özel not:** Graph `sendMail` özel `List-Unsubscribe` başlığına izin vermiyor. Bu yüzden Outlook gönderimlerinde maildeki "ilgilenmiyorsanız yanıt verin" cümlesi listeden çıkma yolu olarak kalır. Kişisel ve az sayıda gönderilen B2B maillerinde bu yeterlidir.
