# Laedt Dateien aus Microsoft-Rocketbox (MIT) ueber raw.githubusercontent.com
# Aufruf: python3 hole.py <zielordner> <repo-pfad> [<repo-pfad> ...]
import sys, os, urllib.request
BASIS = 'https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/master/'
ziel = sys.argv[1]
for p in sys.argv[2:]:
    aus = os.path.join(ziel, p)
    if os.path.exists(aus) and os.path.getsize(aus) > 0:
        continue
    os.makedirs(os.path.dirname(aus), exist_ok=True)
    url = BASIS + urllib.request.quote(p)
    with urllib.request.urlopen(url, timeout=120) as r, open(aus + '.tmp', 'wb') as f:
        f.write(r.read())
    os.replace(aus + '.tmp', aus)
    print(os.path.getsize(aus), p)
