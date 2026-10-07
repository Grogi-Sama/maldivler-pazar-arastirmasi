-- Microsoft / Gmail bağlantısı: yenileme anahtarı şifreli (AES-GCM) saklanır
CREATE TABLE posta_hesabi (
  kullanici_id TEXT PRIMARY KEY REFERENCES kullanici(id),
  saglayici TEXT NOT NULL,
  eposta TEXT NOT NULL,
  yenileme_sifreli TEXT NOT NULL,
  baglanma TEXT NOT NULL
);
-- OAuth "state" değerleri (10 dakika geçerli, tek kullanımlık)
CREATE TABLE oauth_durum (durum TEXT PRIMARY KEY, kullanici_id TEXT NOT NULL, bitis INTEGER NOT NULL);
-- Gönderim kaydı: günlük sınır ve denetim için
CREATE TABLE gonderim_kaydi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kullanici_id TEXT NOT NULL,
  zaman TEXT NOT NULL,
  alici TEXT NOT NULL,
  firma_eposta TEXT,
  konu TEXT NOT NULL,
  durum TEXT NOT NULL,
  hata TEXT
);
CREATE INDEX gonderim_kaydi_gun ON gonderim_kaydi(kullanici_id, zaman);
