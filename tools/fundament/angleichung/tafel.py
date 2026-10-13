# python3 tafel.py <angleich.json> <out.jpg> : Farbtafel alt -> neu je Ton
import json, sys
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, sys.argv[0].rsplit('/',1)[0])
from palette import TON
d = json.load(open(sys.argv[1])); B = d['bericht']
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13); FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
rows = [(k, B.get(k, {})) for k in TON if B.get(k)]
H = 34; W = 1200; img = Image.new('RGB', (W, 40 + H * len(rows)), (250, 250, 248)); g = ImageDraw.Draw(img)
g.text((10, 10), 'Materialangleichung 13.10.: links alle bisherigen Farbwerte (Anzahl Stellen), rechts der eine Bibliotheks-Ton', font=FB, fill=(20, 20, 20))
for i, (k, m) in enumerate(rows):
    y = 40 + i * H; hx = '%06x' % TON[k]
    g.rectangle([10, y, 60, y + H - 6], fill='#' + hx); g.text((66, y + 2), k, font=FB, fill=(0, 0, 0)); g.text((66, y + 17), '#' + hx + '  ' + str(sum(m.values())) + ' Stellen', font=F, fill=(70, 70, 70))
    x = 270
    for h, n in sorted(m.items(), key=lambda t: -t[1])[:36]:
        g.rectangle([x, y, x + 22, y + H - 14], fill='#' + h, outline=(160, 160, 160)); g.text((x + 1, y + H - 14), str(n), font=F, fill=(60, 60, 60)); x += 25
        if x > W - 30: break
img.save(sys.argv[2], quality=85)
print(img.size)
