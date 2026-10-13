-- Bir kullanıcıya birden fazla Outlook hesabı (iştirak şirketleri her biri kendi adresinden gönderir).
-- Mevcut bağlantı korunur: tablo yeni birincil anahtarla (kullanici_id, eposta) yeniden kurulur.
CREATE TABLE posta_hesabi_yeni (
  kullanici_id TEXT NOT NULL REFERENCES kullanici(id),
  saglayici TEXT NOT NULL,
  eposta TEXT NOT NULL,
  yenileme_sifreli TEXT NOT NULL,
  baglanma TEXT NOT NULL,
  PRIMARY KEY (kullanici_id, eposta)
);
INSERT INTO posta_hesabi_yeni (kullanici_id, saglayici, eposta, yenileme_sifreli, baglanma)
  SELECT kullanici_id, saglayici, eposta, yenileme_sifreli, baglanma FROM posta_hesabi;
DROP TABLE posta_hesabi;
ALTER TABLE posta_hesabi_yeni RENAME TO posta_hesabi;

-- Gönderim kaydında hangi hesaptan gönderildiği (günlük güvenlik sınırı hesap başına)
ALTER TABLE gonderim_kaydi ADD COLUMN gonderen TEXT;

-- Genel günlük sayaçlar (ör. detaylı e-posta sorgusu): Türkiye saatiyle gün, sayaç türü, adet
CREATE TABLE IF NOT EXISTS gunluk_sayac (
  kullanici_id TEXT NOT NULL,
  gun TEXT NOT NULL,
  tur TEXT NOT NULL,
  adet INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (kullanici_id, gun, tur)
);
