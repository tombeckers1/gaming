# python3 paar.py <vor-ordner> <nach-ordner> <ziel-ordner> [crop-json]: Vorher|Nachher nebeneinander als JPG <=150 KB
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
A, B, Z = sys.argv[1:4]; os.makedirs(Z, exist_ok=True)
crops = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else {}
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
def paar(name, a, b, box=None, out=None):
    ia, ib = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    if box: ia, ib = ia.crop(box), ib.crop(box)
    w = 640; h = round(ia.height * w / ia.width)
    ia, ib = ia.resize((w, h), Image.LANCZOS), ib.resize((w, h), Image.LANCZOS)
    im = Image.new('RGB', (2 * w + 8, h + 26), (24, 26, 30)); im.paste(ia, (0, 26)); im.paste(ib, (w + 8, 26))
    g = ImageDraw.Draw(im); g.text((8, 4), 'vorher (574faa7)  ' + name, font=F, fill=(230, 230, 230)); g.text((w + 16, 4), 'nachher (Materialangleichung)', font=F, fill=(250, 200, 80))
    q = 85
    while True:
        im.save(out, quality=q, optimize=True)
        if os.path.getsize(out) <= 150000 or q < 40: break
        q -= 7
    return os.path.getsize(out)
for f in sorted(os.listdir(A)):
    if not f.endswith('.png') or not os.path.exists(os.path.join(B, f)): continue
    print(f, paar(f[:-4], os.path.join(A, f), os.path.join(B, f), out=os.path.join(Z, f[:-4] + '.jpg')))
for n, c in crops.items():
    print(n, paar(n, os.path.join(A, c['bild']), os.path.join(B, c['bild']), tuple(c['box']), os.path.join(Z, n + '.jpg')))
