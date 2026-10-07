-- Kullanıcılar: şifre PBKDF2 ile tuzlanıp saklanır; düz şifre hiçbir yerde tutulmaz.
CREATE TABLE kullanici (
  id TEXT PRIMARY KEY,
  eposta TEXT NOT NULL UNIQUE,
  sifre_hash TEXT NOT NULL,
  tuz TEXT NOT NULL,
  olusturma TEXT NOT NULL
);
-- Oturum imzalama anahtarı gibi sistem ayarları
CREATE TABLE ayar (anahtar TEXT PRIMARY KEY, deger TEXT NOT NULL);
-- Her kullanıcının çalışma alanı (adaylar, taslaklar, ayarlar) tek JSON belge olarak
CREATE TABLE calisma_alani (
  kullanici_id TEXT PRIMARY KEY REFERENCES kullanici(id),
  veri TEXT NOT NULL,
  surum INTEGER NOT NULL DEFAULT 1,
  guncelleme TEXT NOT NULL
);
-- Giriş denemeleri (kaba kuvvet saldırısına karşı)
CREATE TABLE giris_denemesi (ip TEXT NOT NULL, zaman INTEGER NOT NULL);
CREATE INDEX giris_denemesi_ip ON giris_denemesi(ip, zaman);
