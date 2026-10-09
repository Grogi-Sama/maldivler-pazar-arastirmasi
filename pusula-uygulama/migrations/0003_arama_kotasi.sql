-- Günlük arama kotası: kullanıcı başına, Türkiye saatine göre gün; "adet" o gün verilen yeni firma sayısı
CREATE TABLE IF NOT EXISTS arama_kotasi (
  kullanici_id TEXT NOT NULL,
  gun TEXT NOT NULL,
  adet INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (kullanici_id, gun)
);
