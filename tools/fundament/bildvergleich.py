# python3 bildvergleich.py <ordnerA> <ordnerB> [diffordner]: Pixelvergleich je Bild
import sys, os, numpy as np
from PIL import Image
A, B = sys.argv[1], sys.argv[2]; D = sys.argv[3] if len(sys.argv) > 3 else None
if D: os.makedirs(D, exist_ok=True)
tot = 0
for f in sorted(os.listdir(A)):
    if not f.endswith('.png'): continue
    if not os.path.exists(os.path.join(B, f)): print(f, 'FEHLT in B'); continue
    a = np.asarray(Image.open(os.path.join(A, f)).convert('RGB')).astype(int)
    b = np.asarray(Image.open(os.path.join(B, f)).convert('RGB')).astype(int)
    d = np.abs(a - b).max(axis=2)
    n3 = (d > 3).mean() * 100; n16 = (d > 16).mean() * 100
    tot += n3
    flag = '' if n3 < 0.01 else ('  <-- ' if n16 > 0.05 else '  (leicht)')
    print('%-24s max %3d  mittel %.3f  >3: %6.3f%%  >16: %6.3f%%%s' % (f, d.max(), d.mean(), n3, n16, flag))
    if D and n3 >= 0.01:
        h = np.zeros(a.shape, dtype=np.uint8); h[..., 0] = np.clip(d * 8, 0, 255); h[..., 1] = (a.mean(axis=2) * 0.3).astype(np.uint8)
        Image.fromarray(h).save(os.path.join(D, f))
print('Summe >3 %%: %.3f' % tot)
