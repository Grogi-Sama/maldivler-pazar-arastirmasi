# Pusula uygulamasını derler: kaynak/ → public/index.html (+ sunucu motoru src/motor-uretilmis.js)
# Kullanım: pusula-uygulama klasöründe  python3 kaynak/build.py   ardından  npx wrangler deploy
import os, subprocess
K = os.path.dirname(os.path.abspath(__file__)); U = os.path.dirname(K)
oku = lambda a: open(os.path.join(K, a), encoding='utf-8').read()
v1 = oku('v1.html')
css_end = v1.index('</style>'); markup_start = css_end + len('</style>'); script_start = v1.index('<script>')
html = v1[:css_end] + oku('extra_v2.css') + '</style>' + v1[markup_start:script_start] + '<script>\n' + oku('app_v2.js') + '</script>\n'
open(os.path.join(K, 'index.html'), 'w', encoding='utf-8').write(html)  # Claude artifact sürümü
open(os.path.join(U, 'public', 'index.html'), 'w', encoding='utf-8').write('<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><link rel="icon" href="/logo.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#0E7A6B"><meta name="apple-mobile-web-app-title" content="Pusula"><meta name="apple-mobile-web-app-capable" content="yes"></head><body>' + html + '</body></html>')
# Sunucunun otonom gönderim motoru uygulama kodundan üretilir (tek kaynak)
subprocess.run(["node", os.path.join(U, 'araclar', 'motor-uret.mjs'), os.path.join(K, 'app_v2.js'), os.path.join(U, 'src', 'motor-uretilmis.js')], check=True)
