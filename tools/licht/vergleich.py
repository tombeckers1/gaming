# Vorher/Nachher nebeneinander (Licht-Paket 15.10.): python3 tools/licht/vergleich.py <ordner-vorher> <ordner-nachher> <ziel> [stufen]
# Je Ansicht/Zeit/Stufe ein Bild 1280 x 360 (links vorher, rechts nachher) mit Beschriftung und mittlerer Helligkeit (mittel.json).
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
v, n, ziel = sys.argv[1], sys.argv[2], sys.argv[3]
stufen = (sys.argv[4] if len(sys.argv) > 4 else 'hoch,ultralow').split(',')
os.makedirs(ziel, exist_ok=True)
def mittel(o):
    try: return json.load(open(os.path.join(o, 'mittel.json')))
    except Exception: return {}
mv, mn = mittel(v), mittel(n)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except Exception: font = ImageFont.load_default()
k = 0
for f in sorted(os.listdir(n)):
    if not f.endswith('.jpg'): continue
    name = f[:-4]
    if name.split('-')[-1] not in stufen or not os.path.exists(os.path.join(v, f)): continue
    bild = Image.new('RGB', (1280, 360))
    for i, (o, m, txt) in enumerate([(v, mv, 'vorher'), (n, mn, 'nachher')]):
        im = Image.open(os.path.join(o, f)).convert('RGB').resize((640, 360), Image.LANCZOS)
        bild.paste(im, (i * 640, 0))
        d = ImageDraw.Draw(bild)
        w = m.get(name, {})
        t = f"{txt}  {name}  Mittel {w.get('mittel', '?')}"
        d.rectangle([i * 640, 0, i * 640 + 10 + d.textlength(t, font=font), 26], fill=(0, 0, 0))
        d.text((i * 640 + 5, 3), t, fill=(255, 255, 255), font=font)
    bild.save(os.path.join(ziel, 'vergleich-' + name + '.jpg'), quality=82)
    k += 1
print('Vergleichsbilder:', k)
