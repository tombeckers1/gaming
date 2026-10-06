# Texturen einer Rocketbox-Figur verkleinern: Koerper 512, Kopf 256, Haar 256x512 (RGBA)
# Aufruf: python3 texprep.py <avatar-ordner> <ausgabe-ordner>
import sys, os, glob
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
t = os.path.join(src, 'Textures')
def finde(teil):
    f = [x for x in glob.glob(os.path.join(t, '*%s*.tga' % teil)) if 'normal' not in x and 'specular' not in x]
    return f[0] if f else None
body, head, op = finde('body_color'), finde('head_color'), finde('opacity_color')
Image.open(body).convert('RGB').resize((1024, 1024), Image.LANCZOS).save(os.path.join(out, 'body.png'))
Image.open(head).convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(out, 'head.png'))
if op:
    im = Image.open(op)
    print('opacity', im.mode, im.size)
    im.convert('RGBA').resize((512, 1024), Image.LANCZOS).save(os.path.join(out, 'haar.png'))
print('ok', body, head, op)
