"""Maldivler potansiyel müşteri Excel dosyasını üretir.

Çalıştırma: python3 araclar/excel_olustur.py
Çıktı: Maldivler_Potansiyel_Musteri_Listesi.xlsx (depo kök dizini)
"""
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "Maldivler_Potansiyel_Musteri_Listesi.xlsx"


def load_tsv(name):
    """Kurumsal iletişim verisini okur: ilk sütun anahtar, kalanlar değer."""
    data = {}
    for line in (HERE / name).read_text(encoding="utf-8").splitlines():
        if line.strip():
            f = line.split("\t")
            data[f[0]] = f[1:]
    return data


RESORT_CONTACTS = load_tsv("iletisim_resort.tsv")  # e-posta, telefon, güven/not, kaynak
GROUP_CONTACTS = load_tsv("iletisim_grup.tsv")  # e-posta, telefon, adres, kaynak

# Mail takibi: tarih, tur, kurum, kategori, e-posta, konu, durum, sonraki adım, sonraki tarih, sayfa, satır anahtarı
MAIL_LOG = [line.split("\t") for line in (HERE / "mail_takip.tsv").read_text(encoding="utf-8").splitlines()
            if line.strip()]
# Aynı kurumun başka sayfalardaki satırları da işaretlensin
EXTRA_ANCHORS = {
    "Aydeniz Grubu (Ayada Maldives sahibi)": [("Resortlar", "Ayada Maldives")],
    "Kandima / Pulse Hotels & Resorts": [("Resortlar", "Kandima Maldives")],
    "Taj Exotica & Taj Coral Reef (IHCL)": [("Resortlar", "Taj Coral Reef")],
    "Four Seasons Landaa Giraavaru & Kuda Huraa": [("Resortlar", "Four Seasons Kuda Huraa")],
    "Emerald Maldives & Emerald Faarufushi": [("Resortlar", "Faarufushi Maldives"), ("İşletmeci Gruplar", "Emerald Collection")],
    "Anantara Dhigu / Veli / Naladhu (Minor Hotels)": [("İşletmeci Gruplar", "Minor Hotels (Anantara, NH Collection)")],
    "Club Med Kani & Finolhu Villas": [("Resortlar", "Club Med Finolhu Villas")],
    "Centara Maldives (Ras Fushi, Machchafushi, Mirage Lagoon)": [("Resortlar", "Centara Grand Island Resort"), ("İşletmeci Gruplar", "Centara Hotels & Resorts")],
}
STATUS_FILL = {
    "Mail gönderildi": PatternFill("solid", fgColor="DDEBF7"),   # açık mavi
    "Yanıt geldi": PatternFill("solid", fgColor="FFF2CC"),       # açık sarı
    "Görüşme planlandı": PatternFill("solid", fgColor="E2EFDA"), # açık yeşil
    "İlgilenmiyor": PatternFill("solid", fgColor="EDEDED"),      # gri
}

# Puan formülünün dışında kalan özel durumlar: (ek puan, gerekçe)
BONUS = {
    "Ayada Maldives": (3, "Türk sahipli (Aydeniz Grubu, Ankara) – doğrudan sahiple Türkçe görüşme, ilk referans için ideal"),
}

HEADER_FILL = PatternFill("solid", fgColor="1F4E78")
HEADER_FONT = Font(bold=True, color="FFFFFF")
INPUT_FILL = PatternFill("solid", fgColor="FFF2CC")
PRIO_FILL = {
    "A": PatternFill("solid", fgColor="C6EFCE"),
    "B": PatternFill("solid", fgColor="FFEB9C"),
    "C": PatternFill("solid", fgColor="F2F2F2"),
}

TARGET_ROLE = (
    "Resort: Director of Engineering / Chief Engineer, General Manager; "
    "Grup: Technical Services / Sustainability Director"
)
CONTACT_NOTE = "Web sitesindeki 'Contact' sayfası (genel e-posta/telefon buradan teyit edilmeli)"

# Enerji durumu kodları
#  D = Kamuya açık GES bilgisi bulunamadı (dizel ağırlıklı varsayım)
#  P = Kısmi GES var, batarya (ESS) bilgisi yok/sınırlı -> ESS ilavesi fırsatı
#  F = GES + ESS kurulu veya kurulmak üzere (rakip tarafından alınmış)
#  N = Yapım aşamasında / yeni açılacak (enerji sistemi henüz tasarım aşamasında)
ENERGY_LABEL = {
    "D": "Dizel ağırlıklı (kamuya açık GES bilgisi yok)",
    "P": "Kısmi GES, ESS yok/bilinmiyor",
    "F": "GES + ESS mevcut / sözleşmeli",
    "N": "Yeni proje – enerji sistemi tasarım aşamasında",
}
ENERGY_POINTS = {"D": 2, "P": 3, "F": 0, "N": 3}

# (resort, atoll, işletmeci/grup, yaklaşık oda, web, enerji kodu, enerji notu, çok-resortlu grup mu)
RESORTS = [
    # --- VERSA Hospitality (eski Universal Resorts; Niva markası, Maldivli) ---
    ("Kuramathi Maldives", "Alif Alif (Rasdhoo)", "VERSA Hospitality (Niva)", 360, "nivakuramathi.com", "P", "Swimsol çatı GES (servis binaları)", True),
    ("Kurumba Maldives", "Kaafu (Kuzey Malé)", "VERSA Hospitality (Niva)", 180, "kurumba.com", "D", "", True),
    ("Velassaru Maldives", "Kaafu (Güney Malé)", "VERSA Hospitality (Niva)", 129, "nivavelassaru.com", "D", "", True),
    ("Baros Maldives", "Kaafu (Kuzey Malé)", "VERSA Hospitality", 75, "baros.com", "D", "", True),
    ("Dhigali Maldives", "Raa", "VERSA Hospitality (Niva)", 180, "nivadhigali.com", "D", "", True),
    ("Faarufushi Maldives", "Raa", "Emerald Collection", 80, "emerald-faarufushi.com", "D", "Yeni adı Emerald Faarufushi", True),
    ("Milaidhoo Maldives", "Baa", "VERSA Hospitality", 50, "milaidhoo.com", "D", "", True),
    ("Kandolhu Maldives", "Alif Alif (Kuzey Ari)", "VERSA Hospitality", 30, "kandolhu.com", "D", "", True),
    # --- Sun Siyam (Maldivli, grup hedefi %50 yenilenebilir @2030) ---
    ("Siyam World Maldives", "Noonu", "Sun Siyam Resorts", 500, "siyamworld.com", "F", "2025: GES (2,7 MW hedef) + 1.720 kWh ESS – Hayleys Fentons", True),
    ("Sun Siyam Olhuveli", "Kaafu (Güney Malé)", "Sun Siyam Resorts", 200, "sunsiyam.com", "F", "2025: GES + 537,5 kWh ESS – Hayleys Fentons", True),
    ("Sun Siyam Iru Fushi", "Noonu", "Sun Siyam Resorts", 220, "sunsiyam.com", "D", "Grup modeli diğer adalara yayacağını açıkladı (2. faz adayı)", True),
    ("Sun Siyam Iru Veli", "Dhaalu", "Sun Siyam Resorts", 125, "sunsiyam.com", "D", "Grup 2. faz adayı", True),
    ("Sun Siyam Vilu Reef", "Dhaalu", "Sun Siyam Resorts", 100, "sunsiyam.com", "D", "Grup 2. faz adayı", True),
    # --- Crown & Champa (10 resort) ---
    ("Veligandu Maldives", "Alif Alif (Rasdhoo)", "Crown & Champa Resorts", 100, "veligandu.com", "F", "1.441 kW GES + 1.668 kWh ESS (Eyl. 2025)", True),
    ("Hurawalhi Island Resort", "Lhaviyani", "Crown & Champa Resorts", 90, "hurawalhi.com", "P", "Mimariye entegre GES", True),
    ("Kudadoo Maldives Private Island", "Lhaviyani", "Crown & Champa Resorts", 15, "kudadoo.com", "F", "Tamamen güneş enerjili olarak tasarlandı", True),
    ("Diğer Crown & Champa resortları", "Çeşitli", "Crown & Champa Resorts", 0, "crownandchamparesorts.com", "D", "Grup düzeyinde tek görüşme ile 7+ ada", True),
    # --- Villa Hotels / Villa Group (Maldivli) ---
    ("Sun Island Resort & Spa", "Alif Dhaal (Güney Ari)", "Villa Hotels & Resorts", 350, "villaresorts.com", "P", "Yeni adı Villa Park; 2.400+ güneş paneli var", True),
    ("Paradise Island Resort", "Kaafu (Kuzey Malé)", "Villa Hotels & Resorts", 280, "villaresorts.com", "D", "Yeni adı Villa Nautica", True),
    ("Holiday Island Resort", "Alif Dhaal (Güney Ari)", "Villa Hotels & Resorts", 140, "villaresorts.com", "D", "", True),
    ("Royal Island Resort", "Baa", "Villa Hotels & Resorts", 150, "villaresorts.com", "D", "", True),
    ("Fun Island Resort", "Kaafu (Güney Malé)", "Villa Hotels & Resorts", 100, "villaresorts.com", "D", "", True),
    # --- Atmosphere Core (Maldivli/Hindistan, 8+ resort) ---
    ("Atmosphere Kanifushi", "Lhaviyani", "Atmosphere Core", 150, "atmosphere-kanifushi.com", "P", "Grup genelinde ~8.900 panel (çatı GES)", True),
    ("OZEN LIFE Maadhoo", "Kaafu (Güney Malé)", "Atmosphere Core", 90, "ozen-life-maadhoo.com", "P", "Swimsol SolarSea yüzer GES", True),
    ("OZEN Reserve Bolifushi", "Kaafu (Güney Malé)", "Atmosphere Core", 90, "ozen-reserve-bolifushi.com", "P", "Grup çatı GES programı", True),
    ("VARU by Atmosphere", "Kaafu (Kuzey Malé)", "Atmosphere Core", 110, "varu-by-atmosphere.com", "P", "Grup çatı GES programı", True),
    ("Amaraa Faru (yeni)", "Doğrulanmalı", "Atmosphere Core", 0, "atmospherecore.com", "N", "2027 açılış; GES planlandığı açıklandı", True),
    # --- Aitken Spence (Adaaran / Heritance, Sri Lanka) ---
    ("Adaaran Select Hudhuranfushi", "Kaafu (Kuzey Malé)", "Aitken Spence (Adaaran)", 210, "adaaran.com", "D", "", True),
    ("Adaaran Club Rannalhi", "Kaafu (Güney Malé)", "Aitken Spence (Adaaran)", 130, "adaaran.com", "D", "", True),
    ("Adaaran Prestige Vadoo", "Kaafu (Güney Malé)", "Aitken Spence (Adaaran)", 50, "adaaran.com", "D", "", True),
    ("Heritance Aarah", "Raa", "Aitken Spence (Heritance)", 150, "heritancehotels.com", "D", "", True),
    # --- Cinnamon (John Keells, Sri Lanka) ---
    ("Cinnamon Dhonveli", "Kaafu (Kuzey Malé)", "Cinnamon Hotels (John Keells)", 150, "cinnamonhotels.com", "D", "", True),
    ("Cinnamon Velifushi", "Vaavu", "Cinnamon Hotels (John Keells)", 90, "cinnamonhotels.com", "D", "", True),
    ("Ellaidhoo Maldives by Cinnamon", "Alif Alif (Kuzey Ari)", "Cinnamon Hotels (John Keells)", 110, "cinnamonhotels.com", "D", "", True),
    ("Cinnamon Hakuraa Huraa", "Meemu", "Cinnamon Hotels (John Keells)", 80, "cinnamonhotels.com", "D", "", True),
    # --- CROSSROADS (Singha Estate) ---
    ("Hard Rock Hotel Maldives", "Kaafu (Güney Malé)", "CROSSROADS / Singha Estate", 178, "hardrockhotels.com/maldives", "D", "Entegre ada kompleksi (marina + 2 otel)", True),
    ("SAii Lagoon Maldives", "Kaafu (Güney Malé)", "CROSSROADS / Singha Estate", 180, "saiihotels.com", "D", "Hard Rock ile aynı ada kompleksi", True),
    # --- Bağımsız / tek-ada büyük resortlar ---
    ("Kuredu Island Resort", "Lhaviyani", "Crown & Champa (Kuredu Holdings)", 380, "kuredu.com", "D", "Ülkenin en büyük resortlarından", True),
    ("Komandoo Island Resort", "Lhaviyani", "Crown & Champa (Kuredu Holdings)", 65, "komandoo.com", "D", "", True),
    ("Meeru Maldives Resort Island", "Kaafu (Kuzey Malé)", "Bağımsız (Maldivli)", 286, "meeru.com", "D", "", False),
    ("Bandos Maldives", "Kaafu (Kuzey Malé)", "Bağımsız (Maldivli)", 250, "bandosmaldives.com", "D", "", False),
    ("Malahini Kuda Bandos", "Kaafu (Kuzey Malé)", "Bağımsız", 70, "malahini.com", "D", "Akademik GES+ESS fizibilite çalışmasına konu oldu", False),
    ("Kandima Maldives", "Dhaalu", "Pulse Hotels & Resorts", 266, "kandima.com", "D", "", True),
    ("Canareef Resort Maldives", "Addu", "Bağımsız", 280, "canareef.com", "P", "Büyük çatı GES kurulumu duyuruldu", False),
    ("Vilamendhoo Island Resort", "Alif Dhaal (Güney Ari)", "Bağımsız", 180, "vilamendhoo.com", "D", "", False),
    ("Embudu Village", "Kaafu (Güney Malé)", "Bağımsız", 120, "embudu.com", "D", "", False),
    ("Biyadhoo Island Resort", "Kaafu (Güney Malé)", "Bağımsız", 96, "biyadhoo.com", "D", "", False),
    ("Summer Island Maldives", "Kaafu (Kuzey Malé)", "Bağımsız", 110, "summerislandmaldives.com", "D", "", False),
    ("Reethi Beach Resort", "Baa", "NH Collection (Minor Hotels)", 115, "nh-collection.com", "D", "Yeni adı NH Collection Maldives Reethi", True),
    ("Robinson Maldives", "Gaafu Alifu", "TUI / Robinson", 125, "robinson.com", "D", "", True),
    ("Ayada Maldives", "Gaafu Dhaalu", "Aydeniz Grubu (Ankara, TÜRK)", 110, "ayadamaldives.com", "D", "Türk sahipli (Aydeniz Grubu) – Türkçe, doğrudan sahibe ulaşılabilir", False),
    ("RAH GILI MALDIVES", "Kaafu (Güney Malé)", "Bağımsız", 0, "rahgili.com", "F", "2 MW GES + 2.500 kWh ESS; günlük ~17.000 kWh tüketim", False),
    ("Holiday Inn Resort Kandooma", "Kaafu (Güney Malé)", "IHG markası", 160, "maldives.holidayinnresorts.com", "P", "Sitede GES programı anlatılıyor", True),
    ("Centara Grand Island Resort", "Alif Dhaal (Güney Ari)", "Centara Hotels", 112, "centarahotelsresorts.com", "P", "Yeni adı Machchafushi Island Resort (Centara Collection); tüm çatılarda GES", True),
    ("Centara Ras Fushi", "Kaafu (Kuzey Malé)", "Centara Hotels", 140, "centarahotelsresorts.com", "D", "", True),
    ("Grand Park Kodhipparu", "Kaafu (Kuzey Malé)", "Park Hotel Group", 120, "grandparkkodhipparu.com", "D", "", False),
    ("Emerald Maldives Resort", "Raa", "Emerald Collection", 120, "emeraldmaldives.com", "D", "", False),
    ("Club Med Kani", "Kaafu (Kuzey Malé)", "Club Med", 250, "clubmed.com", "D", "", True),
    ("Club Med Finolhu Villas", "Kaafu (Kuzey Malé)", "Club Med", 50, "clubmed.com", "D", "Kani ile aynı lagün", True),
    ("Angsana Velavaru", "Dhaalu", "Banyan Group", 113, "angsana.com", "D", "", True),
    ("Shangri-La Villingili", "Addu", "Shangri-La", 130, "shangri-la.com", "D", "", True),
    ("Sheraton Maldives Full Moon", "Kaafu (Kuzey Malé)", "Marriott markası", 176, "marriott.com", "D", "", True),
    ("Conrad Maldives Rangali Island", "Alif Dhaal (Güney Ari)", "Hilton markası", 150, "hilton.com", "D", "", True),
    ("Anantara Dhigu / Veli / Naladhu", "Kaafu (Güney Malé)", "Minor Hotels", 250, "anantara.com", "D", "3 resort komşu adalarda", True),
    ("Anantara Kihavah", "Baa", "Minor Hotels", 80, "anantara.com", "D", "", True),
    ("Dusit Thani Maldives", "Baa", "Dusit", 100, "dusit.com", "D", "", True),
    ("InterContinental Maamunagau", "Raa", "IHG markası", 80, "ihg.com", "D", "", True),
    ("Six Senses Laamu", "Laamu", "Six Senses (IHG)", 97, "sixsenses.com", "P", "Sürdürülebilirlik odaklı; GES bilgisi var, kapsamı doğrulanmalı", True),
    ("Gili Lankanfushi", "Kaafu (Kuzey Malé)", "Bağımsız", 45, "gili-lankanfushi.com", "P", "GES bilgisi var, kapsamı doğrulanmalı", False),
    # --- Swimsol müşterileri (GES var, ESS ilavesi fırsatı) ---
    ("Four Seasons Landaa Giraavaru", "Baa", "Four Seasons", 103, "fourseasons.com/maldiveslg", "P", "Swimsol çatı GES (3.105 panel)", True),
    ("Four Seasons Kuda Huraa", "Kaafu (Kuzey Malé)", "Four Seasons", 96, "fourseasons.com/maldiveskh", "P", "Swimsol GES", True),
    ("Taj Exotica Resort & Spa", "Kaafu (Güney Malé)", "IHCL (Taj)", 66, "tajhotels.com", "P", "Swimsol SolarSea yüzer GES", True),
    ("Taj Coral Reef", "Kaafu (Kuzey Malé)", "IHCL (Taj)", 70, "tajhotels.com", "P", "Swimsol SolarSea yüzer GES", True),
    ("LUX* South Ari Atoll", "Alif Dhaal (Güney Ari)", "LUX* / The Lux Collective", 190, "luxresorts.com", "P", "Swimsol SolarSea yüzer GES", True),
    ("Waldorf Astoria Ithaafushi", "Kaafu (Güney Malé)", "Hilton markası", 120, "hilton.com", "P", "Swimsol müşterisi", True),
    ("One&Only Reethi Rah", "Kaafu (Kuzey Malé)", "Kerzner", 128, "oneandonlyresorts.com", "P", "Swimsol müşterisi", True),
    # --- Rakip tarafından alınmış (düşük öncelik, referans) ---
    ("Cheval Blanc Randheli", "Noonu", "LVMH", 46, "chevalblanc.com", "F", "Swimsol 2.421 kWp yüzer GES + 1.953 kWh ESS", True),
    ("Soneva Fushi", "Baa", "Soneva", 70, "soneva.com", "F", "Canopy Power GES + ESS (~%60 yenilenebilir)", True),
    ("Soneva Jani", "Noonu", "Soneva", 51, "soneva.com", "F", "Canopy Power GES + ESS", True),
    ("Soneva Secret", "Haa Dhaalu", "Soneva", 14, "soneva.com", "F", "Canopy Power 2 MWp yüzer GES + 3 MWh Huawei ESS", True),
    ("Patina Maldives (Fari Islands)", "Kaafu (Kuzey Malé)", "Pontiac Land", 110, "patinahotels.com", "F", "~3 MWp GES + 2 MWh ESS; Fari toplam 6,4 MW", True),
    ("The Ritz-Carlton Maldives (Fari Islands)", "Kaafu (Kuzey Malé)", "Pontiac Land / Marriott", 100, "ritzcarlton.com", "F", "983 kW çatı GES; Fari ortak mikro şebeke", True),
    ("Royal Rosewood Resort Island", "Doğrulanmalı", "Doğrulanmalı", 0, "—", "F", "Solmacher: 16 MWp GES + 40 MWh Huawei ESS (2026 sözleşme)", False),
    # --- Yapım aşamasındaki projeler (tasarım aşamasında yakalanabilir) ---
    ("Mandarin Oriental Bolidhuffaru Reef", "Kaafu (Güney Malé)", "Mandarin Oriental", 120, "mandarinoriental.com", "N", "~2026 açılış hedefi", True),
    ("Bvlgari Resort Ranfushi", "Raa", "Bvlgari (Marriott)", 54, "bulgarihotels.com", "N", "~2027 açılış", True),
    ("Rosewood Ranfaru", "Haa Alifu", "Rosewood", 0, "rosewoodhotels.com", "N", "GES sahası planı açıklandı", True),
    ("Capella Maldives (Fari Islands)", "Kaafu (Kuzey Malé)", "Pontiac Land", 0, "capellahotels.com", "N", "2027 hedef; Fari mikro şebekesine bağlanabilir", True),
    ("Aman Maldives", "Vaavu", "Aman", 0, "aman.com", "N", "2027 hedef, tarih belirsiz", True),
    ("Aura Maldives", "Baa", "Doğrulanmalı", 0, "—", "N", "2026 sonu açılış bekleniyor", False),
    ("Zamani Islands (3 resort + marina)", "Kaafu (Güney Malé)", "Zamani", 0, "—", "N", "8 adalı karma proje – büyük enerji ihtiyacı", True),
]

GROUPS = [
    # (grup, merkez, Maldivler resort sayısı ~, öne çıkan resortlar, enerji durumu/notu, web, öncelik,
    #  iletisim_grup.tsv'deki anahtar veya None)
    ("VERSA Hospitality (eski Universal Resorts)", "Malé (Maldivli)", "8", "Niva Kuramathi, Niva Kurumba, Niva Velassaru, Niva Dhigali, Baros, Milaidhoo, Kandolhu", "Ekim 2025'te VERSA adını aldı, Niva markasını kurdu. Kuramathi'de kısmi GES; diğerlerinde kamuya açık GES bilgisi yok", "versahospitality.com", "A", "VERSA Hospitality (eski Universal Resorts)"),
    ("Villa Hotels & Resorts (Villa Group)", "Malé (Maldivli)", "5+", "Villa Park (eski Sun Island), Villa Nautica (eski Paradise Island), Royal Island", "Büyük, orta segment; Villa Park'ta 2.400+ panel var, batarya bilgisi yok", "villaresorts.com", "A", "Villa Hotels & Resorts (Villa Group)"),
    ("Sun Siyam Resorts", "Malé (Maldivli)", "5", "Siyam World, Olhuveli, Iru Fushi, Iru Veli, Vilu Reef", "2 resortta GES+ESS (Hayleys Fentons); %50 yenilenebilir @2030 hedefi -> kalan 3 resort için 2. faz", "sunsiyam.com", "A", "Sun Siyam Resorts"),
    ("Crown & Champa Resorts", "Malé (Maldivli)", "10", "Kuredu, Komandoo, Veligandu, Hurawalhi, Kudadoo, Vilamendhoo, Meeru (doğrulanmalı)", "Veligandu tamamlandı; Kuredu (380 oda) en büyük fırsat", "crownandchamparesorts.com", "A", "Crown & Champa Resorts"),
    ("Kuredu Holdings (Crown & Champa ortağı)", "Malé (Maldivli)", "2+", "Kuredu, Komandoo", "Kuredu ve Komandoo'nun sahibi; yeni resortlar geliştiriyor", "—", "A", "Kuredu Holdings (Crown & Champa ortağı; Kuredu, Komandoo vb.)"),
    ("Atmosphere Core", "Malé / Hindistan", "9-10", "Kanifushi, OZEN Reserve, OZEN LIFE, VARU, Amaraa Faru (2027)", "Çatı GES yaygın; ESS ilavesi ve yeni açılışlar fırsat", "atmospherecore.com", "A", "Atmosphere Core"),
    ("Aydeniz Grubu (TÜRK – Ayada Maldives sahibi)", "Ankara, Türkiye", "1", "Ayada Maldives", "Kamuya açık GES bilgisi yok. Türk sahipli: Türkçe ve doğrudan sahiple görüşme imkânı – İLK REFERANS İÇİN EN SICAK ADAY", "aydeniz.com", "A", "Aydeniz Grubu (Ayada Maldives sahibi – TÜRK)"),
    ("Gürok Grubu (TÜRK – JOALI sahibi)", "Kütahya, Türkiye", "2", "JOALI Maldives, JOALI BEING (Raa Atoll)", "Ultra lüks, sürdürülebilirlik odaklı; kamuya açık GES bilgisi yok. Türk sahipli – Türkçe görüşme", "gurok.com", "A", "Gürok Grubu (JOALI sahibi – TÜRK)"),
    ("Astaş Holding (TÜRK – yeni Maldivler projesi)", "İstanbul, Türkiye", "Proje", "~120 villalık, 300 M$ resort projesi (Mandarin Oriental Bodrum sahibi)", "Tasarım aşamasında – enerji sistemi baştan hibrit kurgulanabilir. EN SICAK yeni proje adayı", "astas-holding.com", "A", "Astaş Holding (TÜRK – Maldivler projesi)"),
    ("Maxx Royal Resorts (TÜRK – Maxx Royal Maldives)", "Antalya / Bodrum, Türkiye", "Proje", "Maxx Royal Maldives (5 ada, 2027 açılış hedefi)", "Yapım/tasarım aşamasında – enerji sistemi baştan hibrit kurgulanabilir", "maxxroyal.com", "A", "Maxx Royal Resorts (TÜRK – Maldivler 2027)"),
    ("Aitken Spence (Adaaran / Heritance)", "Colombo, Sri Lanka", "5", "Adaaran Hudhuranfushi, Rannalhi, Vadoo, Heritance Aarah", "Kamuya açık GES bilgisi sınırlı", "aitkenspencehotels.com", "B", "Aitken Spence – Adaaran Group (Malé ofisi)"),
    ("Cinnamon Hotels (John Keells)", "Colombo, Sri Lanka", "4", "Dhonveli, Velifushi, Ellaidhoo, Hakuraa", "Kamuya açık GES bilgisi sınırlı", "cinnamonhotels.com", "B", "Cinnamon Hotels – John Keells Maldivian Resorts"),
    ("Minor Hotels (Anantara, NH Collection)", "Bangkok, Tayland", "5+", "Anantara Dhigu/Veli/Naladhu, Kihavah, NH Reethi", "Kamuya açık GES bilgisi sınırlı. Malé adresi VERSA ile aynı – adaların sahibi VERSA olabilir (doğrulanmalı)", "minorhotels.com", "B", "Minor Hotels – Anantara Maldivler"),
    ("Pulse Hotels & Resorts (Kandima)", "Malé / Singapur", "1-2", "Kandima", "Kamuya açık GES bilgisi yok. Mayıs 2026'da Director of Engineering ilanı açtı (yeni kişi göreve başlamış olabilir)", "kandima.com", "B", "Pulse Hotels & Resorts (Kandima)"),
    ("CROSSROADS / Singha Estate", "Bangkok, Tayland", "2 + marina", "Hard Rock, SAii Lagoon", "Entegre ada kompleksi, tek enerji santrali", "crossroadsmaldives.com", "B", "CROSSROADS Maldives (Singha Estate)"),
    ("Centara Hotels & Resorts", "Bangkok, Tayland", "3+", "Machchafushi (eski Centara Grand), Ras Fushi, Mirage Lagoon", "Machchafushi'de çatı GES -> ESS ilavesi", "centarahotelsresorts.com", "B", None),
    ("Emerald Collection", "Doğrulanmalı", "2", "Emerald Maldives, Emerald Faarufushi", "Kamuya açık GES bilgisi yok", "emerald-maldives.com", "B", None),
    ("Pontiac Land (Fari Islands)", "Singapur", "3 (Capella 2027)", "Patina, Ritz-Carlton, Capella", "Swimsol ile büyük GES+ESS – rakip tarafından alınmış", "fari-islands.com", "C", None),
    ("Soneva", "Maldivler / Dubai", "3", "Soneva Fushi, Jani, Secret", "Canopy Power + Huawei ESS – rakip tarafından alınmış (referans vaka)", "soneva.com", "C", None),
    ("Marriott / Hilton / IHG / Four Seasons vb. küresel markalar", "Çeşitli", "Çok sayıda", "Waldorf, Conrad, Sheraton, Holiday Inn, Four Seasons", "Karar çoğunlukla mülk sahibi (owner) şirkette; marka sadece işletmeci. Owner şirket tespit edilmeli", "—", "B", None),
]

COMPETITORS = [
    # (firma, menşe, rol, Maldivler'deki bilinen projeler, teknoloji/marka, not)
    ("Swimsol", "Avusturya (Maldivler'de yerleşik)", "GES geliştirici / EPC, PPA ve satış", "50+ resort adası; 2024'te 13+ MWp; Cheval Blanc 2,4 MWp, Taj Exotica, Taj Coral Reef, LUX* South Ari, OZEN LIFE Maadhoo, Fari Islands 1 MWp yüzer, Ritz-Carlton 983 kW, Four Seasons, Kuramathi", "SolarSea yüzer GES (kendi patenti), çatı GES; toplam ~50 MWp GES + ~25 MWh batarya", "Pazar lideri. ESS'yi dışarıdan tedarik ediyor -> ESS tedarikçisi olarak ORTAK adayı da olabilir"),
    ("Canopy Power", "Singapur", "Mikro şebeke EPC / PPA", "Soneva Fushi, Soneva Jani (5,2 MWp + 4,7 MWh), Soneva Secret (2 MWp yüzer + 3 MWh)", "Huawei ESS, Ocean Sun yüzer GES", "Huawei ile çalışıyor; geri dönüş 4-5 yıl beyanı"),
    ("Solmacher Solar Energy", "Doğrulanmalı", "EPC / mikro şebeke", "Royal Rosewood Resort Island: 16 MWp GES + 40 MWh ESS (Ağu. 2026 sözleşme)", "Huawei Digital Power ESS + C&I/utility inverter", "Maldivler'in en büyük resort mikro şebekesi; Huawei'nin bölgedeki ana kanalı"),
    ("Hayleys Fentons", "Sri Lanka", "EPC", "Sun Siyam: Siyam World + Olhuveli (4.110 kWp + 2.257 kWh ESS)", "Doğrulanmalı", "Sri Lanka merkezli büyük grup – ortaklık veya rakip"),
    ("Ecogreen Maldives", "Maldivler", "Yerel kurulumcu", "Resort, misafirhane, konut", "Doğrulanmalı", "Yerel ortak adayı"),
    ("Renewable Energy Maldives (REM)", "Maldivler", "Yerel kurulumcu (2012)", "Doğrulanmalı", "Doğrulanmalı", "Yerel ortak adayı"),
    ("Ensys", "Tayland", "Geliştirici / PPA", "Maldivler'de GES PPA (ASPIRE)", "Doğrulanmalı", "Kamu ihaleleri tarafı"),
    ("Avi Technologies", "Doğrulanmalı", "Kurulumcu – GES + batarya", "Doğrulanmalı", "Doğrulanmalı", "Batarya entegrasyonu odaklı – ortak adayı"),
    ("MYENERGY Solutions", "Sri Lanka", "ESS distribütörü (EAST Group)", "Sri Lanka & Maldivler'e ESS dağıtımı", "EAST Group ESS", "Doğrudan ürün rakibi (Çin menşeli ESS)"),
    ("Huawei Digital Power", "Çin", "Üretici", "Soneva Secret (3 MWh), Royal Rosewood (40 MWh)", "LUNA2000 C&I/Utility ESS, FusionSolar", "Bölgede referansı VAR. Karea'nın Türkiye distribütörlüğü Maldivler'i kapsamıyor olabilir -> Huawei bölge ofisiyle kanal netleştirilmeli"),
    ("HYXI", "Çin", "Üretici", "Maldivler'de kamuya açık proje bulunamadı", "C&I ESS, inverter", "Boş alan: Karea ilk referansı yapabilir; HYXI ile Maldivler için yetki/destek görüşülmeli"),
    ("Sungrow, BYD, Tesla vb.", "Çeşitli", "Üretici", "Kamu ihaleleri (ASSURE 40 MWh BESS) ve resortlarda olası", "—", "Fiyat rekabeti beklenmeli"),
]

PARTNERS = [
    # (firma, tür, bilinen marka tercihi, Karea/HYXI için değerlendirme, web, not)
    ("Swimsol", "GES lideri / EPC (Avusturya, Malé'de yerleşik)", "Panel: kendi SolarSea sistemi. Batarya markası kamuya açık değil", "50+ resortta GES; Veligandu (1,7 MWh) ve RAH GILI (2,5 MWh) bataryalarını da kurdu. Batarya tedarikçisi olarak HYXI için en büyük potansiyel", "swimsol.com", "Hem rakip hem müşteri olabilir"),
    ("Avi Technologies", "Yerel EPC (2015)", "Kamuya açık marka bilgisi yok", "GES + ESS + dizel entegrasyonu yapıyor (Haa Alif'te 14 adada 3,78 MWh ESS). 15+ MW kurulum. HYXI C&I ESS için en uygun yerel ortak adayı", "avitech.com.mv", "Yerel ortak – 1. öncelik"),
    ("Atoll Solar (Octopus Systems)", "Yerel EPC, resort odaklı", "BYD ile çalışıyor", "Ana şirket Octopus Systems resortların sistem entegratörü, yani tüm resortlara zaten erişimi var. BYD'ye alternatif ikinci marka olarak HYXI sunulabilir", "atollsolar.com", "Yerel ortak – 1. öncelik"),
    ("Ecogreen Maldives", "Yerel kurulumcu (2014)", "Kamuya açık marka bilgisi yok", "Resort, misafirhane, konut ve tekne GES. Ağırlıklı olarak küçük/orta ölçek", "ecogreenmaldives.com", "Yerel ortak adayı"),
    ("Renewable Energy Maldives (REM)", "Yerel kurulumcu (2006)", "Sri Lanka kolu (REM Lanka) SolaX kullanıyor", "~25 ada ve resortlarla çalışmış eski oyuncu", "LinkedIn: REM Solar", "Yerel ortak adayı"),
    ("SunCore Energy", "Yerel GES firması", "Kamuya açık marka bilgisi yok", "16+ yıllık proje direktörü; kamu ve kurumsal projeler", "suncore.mv", "Yerel ortak adayı"),
    ("Hayleys Fentons / Hayleys Solar", "Bölgesel EPC (Sri Lanka, 500+ MW)", "HUAWEI kullanıyor (inverter tedarikçileri arasında; Hayleys Electronics Huawei ile ortak forum yaptı); BYD batarya ortağı", "Sun Siyam projesinin yüklenicisi. Huawei kanalında oldukları için HYXI'ye geçmeleri zor; Huawei tarafında ise bölgesel rakip/kanal", "hayleysfentons.com", "Huawei kullanıcısı"),
    ("Canopy Power", "Mikro şebeke EPC (Singapur)", "HUAWEI ESS (Soneva Secret 3 MWh)", "Huawei kanalında", "canopypower.com", "Huawei kullanıcısı"),
    ("Solmacher Solar Energy", "EPC", "HUAWEI (Royal Rosewood 40 MWh ESS + inverter, Ağu. 2026)", "Huawei'nin Maldivler'deki en büyük projesi bu firmada", "Doğrulanmalı", "Huawei kullanıcısı"),
    ("SINOSOAR", "Çin EPC – kamu hibrit projeleri", "Kendi PCS/EMS'i; Sungrow ile bağlantılı", "134 adada kamu mikro şebeke projesi (ADB/ASSURE 40 MWh dahil). Kamu ihaleleri tarafında güçlü rakip", "sinosoarhybrid.com", "Rakip (kamu)"),
    ("Magnetron Maldives", "Yerel mühendislik / EPC (2014)", "Kamuya açık marka bilgisi yok", "Elektrik panosu, RO su arıtma ve GES; 28+ adada resort ve kamu müşterisi. RO tesisleri batarya için ideal yük", "magnetronmaldives.com", "Yerel ortak adayı"),
    ("Resort jeneratör bakım/servis firmaları", "O&M", "Cummins, MTU, Caterpillar yerel bayileri", "Her resortun enerji santraline zaten erişimleri var; hibrit kontrol entegrasyonu için kritik", "Saha ziyaretinde tespit edilecek", "Teknik ortak"),
    ("DEIF", "Hibrit kontrol sistemi (Danimarka)", "—", "Maldivler'de bir lüks resortta dizel+GES+batarya kontrolünü yaptı; ESS entegrasyonunda teknik ortak", "deif.com", "Teknik ortak"),
    ("Elemental Water Makers", "Güneş enerjili su arıtma", "—", "Resortlarda tuzdan arındırma en büyük elektrik yüklerinden biri", "elementalwatermakers.com", "Tamamlayıcı ortak"),
]

PUBLIC = [
    # (kurum, rol, neden önemli, web)
    ("Ministry of Climate Change, Environment and Energy", "Enerji politikası (Nisan 2026'da yeniden ayrı bakanlık oldu)", "Yenilenebilir hedefler (%33 @2028), politika ve izinler", "environment.gov.mv"),
    ("Utility Regulatory Authority (URA)", "Düzenleyici kurum (Kanun 26/2020)", "Elektrik üretim/servis lisansları, şebeke bağlantı ve net metering kuralları", "ura.gov.mv"),
    ("STELCO", "Devlet elektrik şirketi (Malé bölgesi)", "Resortlar şebekeye bağlı değil; ama kamu ESS ihalelerinin alıcısı", "stelco.com.mv"),
    ("FENAKA Corporation", "Devlet hizmet şirketi (dış adalar)", "Dış adalardaki ESS/GES ihaleleri", "fenaka.mv"),
    ("Ministry of Tourism", "Resort lisansları", "Resort listeleri, yeni ada kiralamaları, istatistik. Sitedeki 'Registered Facilities' listesi tüm resortların resmi telefon/e-posta bilgilerini içerir (PDF/CSV indirilebilir). Bakanlık: info@tourism.gov.mv, +960 332 3224", "tourism.gov.mv"),
    ("Maldives Association of Tourism Industry (MATI)", "Resort sahipleri derneği", "Sektöre toplu erişim, etkinlikler, sunum fırsatı", "mati.mv"),
    ("Invest Maldives", "Yatırım ajansı", "Şirket kurma / yabancı yatırım süreçleri", "investmaldives.gov.mv"),
    ("Maldives Customs Service", "Gümrük", "Yenilenebilir enerji ürünlerinde ithalat vergisi muafiyetinin teyidi", "customs.gov.mv"),
    ("State Trading Organization (STO)", "Akaryakıt tedarikçisi", "Dizel fiyatlarının kaynağı", "sto.mv"),
    ("Bank of Maldives", "Yerel banka", "Resort projelerine yerel finansman / yeşil kredi", "bankofmaldives.com.mv"),
    ("Dünya Bankası – ASPIRE / ARISE", "Finansman programları", "ASPIRE: özel GES PPA ihaleleri (tarifeler 21¢ -> 10,9¢/kWh). ARISE: 100 M$, batarya + şebeke entegrasyonu", "worldbank.org"),
    ("Asya Kalkınma Bankası (ADB) – POISED / ASSURE", "Finansman programları", "POISED: dış adalarda hibrit sistemler (%25 yakıt tasarrufu). ASSURE: 18 adada 40 MWh BESS ihalesi (41,5 M$ hibe)", "adb.org"),
    ("AIIB", "Finansman", "Solar Power Development and Energy Storage Solution projesi", "aiib.org"),
    ("T.C. Malé Büyükelçiliği / Ticaret Müşavirliği", "Ticari diplomasi", "Kurum tanıtımı, randevu desteği (temsilcilik yapısı doğrulanmalı)", "mfa.gov.tr"),
]

SOURCES = [
    ("Dizel üretim maliyeti 0,23–0,33 $/kWh; küçük adalarda 0,70 $/kWh'e kadar; resortlarda ~144 MW dizel", "https://www.cif.org/sites/cif_enc/files/knowledge-documents/66436_191219_maldives_case_study_v7s.pdf"),
    ("ADB Maldivler Yenilenebilir Yol Haritası", "https://www.adb.org/sites/default/files/publication/654021/renewables-roadmap-energy-sector-maldives.pdf"),
    ("Enerji Yol Haritası 2024–2033", "https://www.environment.gov.mv/v2/wp-content/files/publications/20241107-pub-energy-roadmap-maldives-2024-2033-.pdf"),
    ("%33 yenilenebilir @2028 hedefi", "https://en.mmtv.mv/246"),
    ("Yenilenebilir kapasite 53 MW -> 126 MW; Raa/Baa 6,5 MW GES + 10 MW batarya", "https://edition.mv/news/54359"),
    ("Dizel fiyatı 17,54 MVR/L (~1,14 $/L), Mart 2026 artışı", "https://www.globalpetrolprices.com/Maldives/diesel_prices/"),
    ("2026 petrol şoku – dizel fiyatları", "https://maldivesindependent.com/economy/half-a-gas-cylinder-double-the-diesel-price-the-oil-shock-hits-maldives-d022"),
    ("179 resort, 44.807 resort yatağı (2026)", "https://en.maaldif.com/11791/"),
    ("Swimsol: 50+ resort, Cheval Blanc 2,4 MWp, yılda 1,5 M$ tasarruf", "https://www.businesswire.com/news/home/20260422437338/en/Swimsols-SolarSea-Maldives-Largest-Floating-Solar-Array-at-Sea-Saves-One-Island-USD-1.5-Million-Per-Year"),
    ("Fari Islands GES genişlemesi", "https://www.pv-magazine.com/2025/07/11/fari-islands-set-to-triple-use-of-solar-energy/"),
    ("Solmacher + Huawei 40 MWh BESS, Royal Rosewood", "https://www.constructionworld.in/energy-infrastructure/power-and-renewable-energy/solmacher-signs-huawei-deal-for-40-mwh-bess-in-maldives/96106"),
    ("Huawei – Soneva Secret vaka çalışması (geri dönüş 4–5 yıl)", "https://digitalpower.huawei.com/en/cases/fusionsolar/floating-solar-maldives"),
    ("Canopy Power – Soneva", "https://www.canopypower.com/resources/floating-solar-in-maldives"),
    ("Sun Siyam GES + ESS (Hayleys Fentons)", "https://www.ttgasia.com/2025/12/16/sun-siyam-launches-major-solar-energy-project-in-maldives-resorts/"),
    ("Veligandu GES + 1.668 kWh ESS", "https://veligandu.com/sustainability/veligandu-solar-power/"),
    ("Centara GES sonuçları", "https://www.hospitalitynet.org/news/4130648/centara-leads-the-fight-against-climate-change-in-the-maldives"),
    ("RAH GILI tüketim verisi", "https://hoteliermaldives.com/solar-at-scale-how-rah-gili-maldives-is-reducing-diesel-dependence-and-embracing-sustainability/"),
    ("ASSURE 40 MWh BESS ihalesi", "https://www.energy-storage.news/maldives-launches-tender-seeking-40mwh-bess-and-ems-across-18-islands/"),
    ("Pontiac Land ilk yeşil kredi (180 M$)", "https://hotelsmag.com/news/pontiac-land-secures-green-loan-in-the-maldives/"),
    ("URA ve lisans gereklilikleri", "https://www.ctlstrategies.com/latest/maldives-energy-act/"),
    ("ENF Solar – Maldivler kurulumcu dizini", "https://www.enfsolar.com/directory/installer/Maldives"),
    ("Yeni resort projeleri 2026–2027", "https://resortlife.travel/maldives-new-resorts"),
    ("Atmosphere Core GES / Amaraa Faru", "https://www.hotelierindia.com/development/atmosphere-core-signs-its-10th-resort-in-maldives"),
]


def room_points(rooms):
    if rooms >= 250:
        return 3
    if rooms >= 120:
        return 2
    if rooms > 0:
        return 1
    return 1  # bilinmiyor


def score(name, rooms, energy, group):
    bonus, bonus_reason = BONUS.get(name, (0, ""))
    total = min(7, room_points(rooms) + ENERGY_POINTS[energy] + (1 if group else 0) + bonus)
    prio = "A" if total >= 6 else "B" if total >= 4 else "C"
    reasons = []
    if rooms >= 250:
        reasons.append("büyük resort (yüksek dizel tüketimi)")
    elif rooms >= 120:
        reasons.append("orta-büyük resort")
    elif rooms == 0:
        reasons.append("oda sayısı doğrulanmalı")
    else:
        reasons.append("küçük/butik resort")
    reasons.append({
        "D": "bilinen GES yok -> GES+ESS paketi",
        "P": "GES var ama ESS yok -> en uygun ESS ilavesi hedefi",
        "F": "rakip GES+ESS kurmuş -> sadece genişleme/servis",
        "N": "yeni proje -> tasarım aşamasında girilebilir",
    }[energy])
    if group:
        reasons.append("çok-resortlu grup (tek kararla birden fazla ada)")
    if bonus_reason:
        reasons.append(bonus_reason)
    return total, prio, "; ".join(reasons)


def style_header(ws, ncols):
    for c in range(1, ncols + 1):
        cell = ws.cell(row=1, column=c)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(wrap_text=True, vertical="center")
    ws.freeze_panes = "A2"
    ws.row_dimensions[1].height = 32


def set_widths(ws, widths):
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w


def wrap_all(ws):
    for row in ws.iter_rows(min_row=2):
        for cell in row:
            cell.alignment = Alignment(wrap_text=True, vertical="top")


def add_table(ws, name, ncols, nrows):
    ref = f"A1:{get_column_letter(ncols)}{nrows + 1}"
    t = Table(displayName=name, ref=ref)
    t.tableStyleInfo = TableStyleInfo(name="TableStyleLight9", showRowStripes=True)
    ws.add_table(t)


def sheet_guide(wb):
    ws = wb.active
    ws.title = "Okuma Rehberi"
    lines = [
        ("Maldivler Resort Enerji Depolama – Potansiyel Müşteri Listesi", True),
        ("Hazırlayan: Karea Enerji iş geliştirme için masa başı araştırma (Ekim 2026)", False),
        ("", False),
        ("SEKMELER", True),
        ("Resortlar: hedef resortlar, enerji durumu, öncelik puanı ve gerekçesi", False),
        ("İşletmeci Gruplar: karar merkezleri (birden çok adayı tek görüşmede açmak için)", False),
        ("Rakipler ve Projeler: pazardaki GES/ESS firmaları ve bilinen projeler", False),
        ("EPC-Ortak Adayları: yerel/bölgesel kurulum ortağı olabilecek firmalar", False),
        ("Kamu ve Finansman: bakanlık, düzenleyici kurum, kalkınma bankası programları", False),
        ("Geri Dönüş Hesabı: sarı hücreleri değiştirerek kendi senaryonuzu hesaplayın", False),
        ("Kaynaklar: bulguların dayandığı kamuya açık kaynaklar", False),
        ("Mail Takibi: gönderilen mailler, durumları ve takip tarihleri. Mail atılan kurumların satırları diğer sekmelerde de renklendirildi.", False),
        ("", False),
        ("ÖNCELİK PUANI NASIL HESAPLANDI? (0–7 puan)", True),
        ("Büyüklük: 250+ oda = 3 puan, 120–249 = 2, 120 altı veya bilinmiyor = 1", False),
        ("Enerji durumu: GES var ama ESS yok = 3; yeni proje = 3; bilinen GES yok (dizel) = 2; GES+ESS rakip tarafından kurulmuş = 0", False),
        ("Çok-resortlu grup: +1 (tek karar birden fazla adayı kapsar)", False),
        ("Özel durum: Türk sahipli resort (Ayada) +3", False),
        ("Öncelik: A = 6–7 puan, B = 4–5 puan, C = 0–3 puan", False),
        ("", False),
        ("ÖNEMLİ NOTLAR", True),
        ("• Oda sayıları yaklaşıktır (kamuya açık kaynaklardan/genel bilgiden); görüşme öncesi resort web sitesinden teyit edin.", False),
        ("• 'Dizel ağırlıklı' = internette GES bilgisine rastlanmadı demektir; resortun hiç GES'i olmadığı anlamına gelmeyebilir.", False),
        ("• İletişim sütunları yalnızca KURUMSAL genel adresleri içerir (info@, reservations@, sales@ vb.). Kişisel adres eklenmedi.", False),
        ("• 'İletişim kaynağı / güven' sütunu adresin nereden alındığını gösterir: 'Otelin kendi sitesi' en güvenilir olanıdır.", False),
        ("• Rezervasyon adresine yazarken konu satırına 'Attn: Director of Engineering / Chief Engineer' ekleyin; mail ilgili kişiye yönlendirilir.", False),
        ("• E-postası '—' olan resortlarda adres sitede gizlenmiş; web sitesindeki iletişim formunu veya telefonu kullanın.", False),
        ("• Resmi tam liste: Turizm Bakanlığı sitesindeki 'Registered Facilities' listesi (tourism.gov.mv) tüm resortların e-posta/telefonunu içerir.", False),
        ("• Bazı resortların adı 2025–2026'da değişti (Niva, Villa Park, Villa Nautica, Machchafushi, NH Reethi, Emerald Faarufushi) – notlarda belirtildi.", False),
        ("• 'Doğrulanmalı' yazan alanlar masa başı araştırmada kesinleştirilemedi.", False),
    ]
    for i, (text, bold) in enumerate(lines, start=1):
        c = ws.cell(row=i, column=1, value=text)
        c.font = Font(bold=bold, size=14 if i == 1 else 11)
    ws.column_dimensions["A"].width = 130


def contact_cells(name, web):
    if name in RESORT_CONTACTS:
        email, phone, note, src = RESORT_CONTACTS[name]
        return [email, phone, note, src]
    if web == "—":
        return ["—", "—", "Bulunamadı (yeni proje / doğrulanmalı)", "—"]
    return ["—", "—", CONTACT_NOTE, "—"]


def sheet_resorts(wb):
    ws = wb.create_sheet("Resortlar")
    headers = ["#", "Resort", "Atoll", "İşletmeci / Grup", "Yaklaşık oda", "Enerji durumu",
               "Bilinen enerji altyapısı (not)", "Web sitesi", "Genel e-posta (kurumsal)", "Telefon",
               "İletişim kaynağı / güven", "Kaynak bağlantısı",
               "Hedef rol", "Puan (0–7)", "Öncelik", "Öncelik gerekçesi"]
    ws.append(headers)
    rows = []
    for name, atoll, op, rooms, web, energy, note, group in RESORTS:
        total, prio, reason = score(name, rooms, energy, group)
        rows.append((total, name, atoll, op, rooms, energy, note, web, prio, reason))
    rows.sort(key=lambda r: (-r[0], r[1]))
    for i, (total, name, atoll, op, rooms, energy, note, web, prio, reason) in enumerate(rows, start=1):
        ws.append([i, name, atoll, op, rooms if rooms else "Doğrulanmalı", ENERGY_LABEL[energy],
                   note or "—", web, *contact_cells(name, web),
                   TARGET_ROLE, total, prio, reason])
        ws.cell(row=i + 1, column=15).fill = PRIO_FILL[prio]
    style_header(ws, len(headers))
    set_widths(ws, [5, 34, 22, 28, 10, 26, 42, 26, 34, 18, 36, 40, 40, 9, 9, 60])
    wrap_all(ws)
    add_table(ws, "Resortlar", len(headers), len(rows))


def simple_sheet(wb, title, table_name, headers, rows, widths, prio_col=None):
    ws = wb.create_sheet(title)
    ws.append(headers)
    for r in rows:
        ws.append(list(r))
    style_header(ws, len(headers))
    set_widths(ws, widths)
    wrap_all(ws)
    if prio_col:
        for r in range(2, len(rows) + 2):
            cell = ws.cell(row=r, column=prio_col)
            cell.fill = PRIO_FILL.get(cell.value, PRIO_FILL["C"])
    add_table(ws, table_name, len(headers), len(rows))


def sheet_payback(wb):
    ws = wb.create_sheet("Geri Dönüş Hesabı")
    ws.column_dimensions["A"].width = 58
    ws.column_dimensions["B"].width = 16
    ws.column_dimensions["C"].width = 70
    ws.append(["Örnek: ~150 odalı resort, 1 MWp GES + 1 MWh ESS", "Değer", "Açıklama / varsayım"])
    style_header(ws, 3)
    inputs = [
        ("GES gücü (kWp)", 1000, "Çatı + boş alan; yüzer GES ile artırılabilir"),
        ("Yıllık özgül üretim (kWh/kWp)", 1400, "Ekvator kuşağı, yüksek ışınım; ihtiyatlı değer"),
        ("ESS kapasitesi (kWh)", 1000, "HYXI / Huawei C&I ESS; öğlen fazlasını akşama kaydırır"),
        ("GES kurulum maliyeti ($/kWp)", 1100, "Ada lojistiği, korozyona dayanıklı montaj dahil"),
        ("ESS kurulum maliyeti ($/kWh)", 400, "C&I konteyner/kabin ESS, kurulum ve EMS dahil"),
        ("Kaçınılan dizel maliyeti ($/kWh)", 0.25, "Kaynaklar: 0,23–0,33 $/kWh; Sun Siyam beyanı ≈0,21 $/kWh (2025 fiyatı). 2026'da dizel ~1,14 $/L"),
        ("Jeneratör bakım/çalışma saati tasarrufu ($/yıl)", 40000, "ESS sayesinde jeneratör sayısı/saatleri azalır (varsayım)"),
        ("Yıllık bakım (O&M) maliyeti (% yatırım)", 0.015, "GES + ESS işletme bakım"),
        ("Yıllık resort tüketimi (kWh)", 4400000, "~12.000 kWh/gün; büyük resortlarda 17.000+ kWh/gün"),
    ]
    start = 2
    for i, (label, val, note) in enumerate(inputs):
        r = start + i
        ws.cell(row=r, column=1, value=label)
        c = ws.cell(row=r, column=2, value=val)
        c.fill = INPUT_FILL
        ws.cell(row=r, column=3, value=note)
    # B2..B10 = girdiler
    results_row = start + len(inputs) + 1
    ws.cell(row=results_row, column=1, value="SONUÇLAR").font = Font(bold=True)
    formulas = [
        ("Yıllık GES üretimi (kWh)", "=B2*B3", "Batarya ile büyük kısmı resortta tüketilir"),
        ("Toplam yatırım ($)", "=B2*B5+B4*B6", ""),
        ("Yıllık dizel tasarrufu ($)", "=B{p}*B7+B8", "GES üretimi × kaçınılan dizel maliyeti + jeneratör tasarrufu"),
        ("Yıllık O&M ($)", "=B{t}*B9", ""),
        ("Net yıllık tasarruf ($)", "=B{s}-B{o}", ""),
        ("Basit geri dönüş süresi (yıl)", "=B{t}/B{n}", "Huawei Soneva Secret vakası: 4–5 yıl"),
        ("Yenilenebilir payı (%)", "=B{p}/B10", "Toplam tüketime oranla"),
        ("Yıllık dizel tasarrufu (litre, ~3,5 kWh/L)", "=B{p}/3.5", ""),
    ]
    rows = {}
    keys = ["p", "t", "s", "o", "n", "pb", "share", "lit"]
    for i, (label, f, note) in enumerate(formulas):
        r = results_row + 1 + i
        rows[keys[i]] = r
    for i, (label, f, note) in enumerate(formulas):
        r = results_row + 1 + i
        ws.cell(row=r, column=1, value=label)
        ws.cell(row=r, column=2, value=f.format(**rows)).font = Font(bold=True)
        ws.cell(row=r, column=3, value=note)
    ws.cell(row=rows["pb"], column=2).number_format = "0.0"
    ws.cell(row=rows["share"], column=2).number_format = "0%"
    for k in ("p", "t", "s", "o", "n", "lit"):
        ws.cell(row=rows[k], column=2).number_format = "#,##0"
    ws.cell(row=9, column=2).number_format = "0.0%"

    sens = rows["lit"] + 2
    ws.cell(row=sens, column=1, value="DUYARLILIK (dizel maliyeti değişirse)").font = Font(bold=True)
    ws.cell(row=sens + 1, column=1, value="Kaçınılan dizel maliyeti ($/kWh)")
    ws.cell(row=sens + 1, column=2, value="Geri dönüş (yıl)")
    for j, price in enumerate([0.20, 0.25, 0.30, 0.35]):
        r = sens + 2 + j
        ws.cell(row=r, column=1, value=price).number_format = "0.00"
        ws.cell(row=r, column=2,
                value=f"=B{rows['t']}/(B{rows['p']}*A{r}+B8-B{rows['o']})").number_format = "0.0"
    ws.cell(row=sens + 7, column=1,
            value="Not: Batarya ~10–12. yılda kapasite kaybı yaşar; uzun vadeli hesapta yenileme bütçesi eklenmelidir.")


def sheet_mail_log(wb):
    ws = wb.create_sheet("Mail Takibi", 1)
    headers = ["Gönderim tarihi", "Tur", "Kurum", "Kategori", "E-posta", "Konu", "Durum",
               "Sonraki adım", "Sonraki adım tarihi"]
    ws.append(headers)
    for row in MAIL_LOG:
        ws.append(row[:9])
        fill = STATUS_FILL.get(row[6])
        if fill:
            for c in ws[ws.max_row]:
                c.fill = fill
    style_header(ws, len(headers))
    set_widths(ws, [14, 8, 34, 26, 32, 56, 18, 34, 16])
    wrap_all(ws)
    n = ws.max_row + 2
    ws.cell(row=n, column=1, value="Renkler:").font = Font(bold=True)
    for i, (status, fill) in enumerate(STATUS_FILL.items(), start=1):
        c = ws.cell(row=n + i, column=1, value=status)
        c.fill = fill


def mark_rows(wb):
    """Mail atılan kurumların satırlarını renklendirir ve 'Mail durumu' sütununa yazar."""
    targets = {}
    for row in MAIL_LOG:
        status = f"{row[6]} ({row[0]})"
        for sheet, key in [(row[9], row[10])] + EXTRA_ANCHORS.get(row[2], []):
            if sheet == "-":
                continue
            targets.setdefault(sheet, {})[key] = (status, STATUS_FILL.get(row[6]))
    for sheet, keys in targets.items():
        ws = wb[sheet]
        name_col = 2 if sheet == "Resortlar" else 1
        col = ws.max_column + 1
        ws.cell(row=1, column=col, value="Mail durumu")
        style_header(ws, col)
        ws.column_dimensions[get_column_letter(col)].width = 26
        for r in range(2, ws.max_row + 1):
            hit = keys.get(ws.cell(row=r, column=name_col).value)
            if not hit:
                continue
            ws.cell(row=r, column=col, value=hit[0]).alignment = Alignment(wrap_text=True, vertical="top")
            for c in ws[r]:
                if c.fill.fgColor.rgb not in [f.fgColor.rgb for f in PRIO_FILL.values()]:
                    c.fill = hit[1]
        table = next(iter(ws.tables.values()))
        table.ref = f"A1:{get_column_letter(col)}{table.ref.split(':')[1].lstrip('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}"


def main():
    wb = Workbook()
    sheet_guide(wb)
    sheet_resorts(wb)
    group_rows = []
    for *fields, key in GROUPS:
        email, phone, address, src = GROUP_CONTACTS.get(key, ["—", "—", "—", "—"])
        group_rows.append([*fields, email, phone, address, src])
    simple_sheet(wb, "İşletmeci Gruplar", "Gruplar",
                 ["Grup", "Merkez", "Maldivler'deki resort sayısı (yakl.)", "Öne çıkan resortlar",
                  "Enerji durumu / not", "Web sitesi", "Öncelik", "Merkez ofis e-posta (kurumsal)",
                  "Merkez ofis telefon", "Adres", "Kaynak bağlantısı"],
                 group_rows, [36, 22, 16, 44, 60, 26, 9, 36, 20, 40, 40], prio_col=7)
    simple_sheet(wb, "Rakipler ve Projeler", "Rakipler",
                 ["Firma", "Menşe", "Rol", "Maldivler'deki bilinen projeler", "Teknoloji / marka", "Karea için anlamı"],
                 COMPETITORS, [26, 22, 26, 60, 36, 50])
    simple_sheet(wb, "EPC-Ortak Adayları", "Ortaklar",
                 ["Firma", "Tür", "Bilinen marka tercihi (inverter/batarya)", "Karea / HYXI için değerlendirme",
                  "Web sitesi", "Not"],
                 PARTNERS, [32, 30, 44, 64, 24, 22])
    simple_sheet(wb, "Kamu ve Finansman", "Kamu",
                 ["Kurum / Program", "Rol", "Karea için önemi", "Web sitesi"],
                 PUBLIC, [44, 40, 70, 26])
    sheet_payback(wb)
    simple_sheet(wb, "Kaynaklar", "Kaynaklar", ["Bilgi", "Kaynak bağlantısı"], SOURCES, [70, 100])
    sheet_mail_log(wb)
    mark_rows(wb)
    wb.save(OUT)
    print(f"Kaydedildi: {OUT}")


if __name__ == "__main__":
    main()
