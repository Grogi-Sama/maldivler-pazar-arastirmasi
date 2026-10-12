-- Arama planı önbelleği: kullanıcının yazdığı ifade + ülke + arama türü için yapay zekânın çıkardığı plan (JSON)
CREATE TABLE IF NOT EXISTS arama_plani (
  anahtar TEXT PRIMARY KEY,
  plan TEXT NOT NULL,
  olusturma TEXT NOT NULL
);
