# Menschen fuer den Boellerladen (06.10.): Rocketbox-Figuren (MIT, github.com/microsoft/Microsoft-Rocketbox)
# in kompakte Figurdaten umwandeln. Arbeitsordner <A> mit Unterordnern js/ (die .py/.js hier, ohne konv.*),
# web/ (konv.html, konv.js sowie three.min.js, fflate.min.js, NURBS*.js, FBXLoader.js aus three@0.128.0 und
# meshopt_simplifier.js aus meshoptimizer, MIT), rb/alle.txt (Dateiliste des Rocketbox-Repos).
# Ablauf:
#   1. python3 js/hole_figuren.py F01=Adults/Female_Adult_01 ...   (FBX + Farbtexturen holen, verkleinern)
#   2. python3 -m http.server 8765 --directory <A>                  (fuer die Konverter-Seite)
#   3. python3 js/mach_auftrag.py auftrag_alle.json; node js/konv-run.js auftrag_alle.json out2
#      (FBX laden, 27 Knochen, Kopf/Koerper getrennt vereinfachen, Atlas 1024x512 mit Kleidungsmaske)
#   4. python3 js/erzeuge.py out2 src/parts/09a-figuren.js <ids> -- m_gehen=m_gehen ...
# Schreibt src/parts/09a-figuren.js aus den Konverter-Ausgaben
# Aufruf: python3 erzeuge.py <out-ordner> <ziel.js> <id> [<id> ...] -- <anim-id>=<datei-id> ...
import sys, json, os, base64, zlib
out, ziel = sys.argv[1], sys.argv[2]
rest = sys.argv[3:]
trenn = rest.index('--')
ids, anims = rest[:trenn], rest[trenn + 1:]
LIZENZ = open(os.path.join(os.path.dirname(__file__), 'lizenz.txt')).read().strip()
teile = []
teile.append('/* =========================================================\n'
             '   Figurdaten (06.10.): Menschen aus "Microsoft Rocketbox"\n'
             '   https://github.com/microsoft/Microsoft-Rocketbox - Avatare und\n'
             '   Bewegungsaufnahmen (Gehen, Stehen) unter MIT-Lizenz:\n\n' +
             '\n'.join('   ' + z if z else '' for z in LIZENZ.split('\n')) + '\n\n'
             '   Aufbereitet fuer den Boellerladen: Netz vereinfacht (Desktop und\n'
             '   Handy), 27 statt 80 Knochen, Texturen als ein Atlas 1024 x 512\n'
             '   (Koerper, Kopf, Haar) mit Kleidungsmaske im Alphakanal.\n'
             '   Erzeugt mit src/werkzeug/menschen (konv.js, erzeuge.py) - nicht von Hand aendern.\n'
             '   ========================================================= */\n')
knochen = None
teile.append('const FIG_DATEN={\n')
for i in ids:
    d = json.load(open(os.path.join(out, i + '.json')))
    kn = d['knochen']
    roh = base64.b64decode(d['v']) + base64.b64decode(d['iD']) + base64.b64decode(d['iH'])
    co = zlib.compressobj(9, zlib.DEFLATED, -15)
    z = co.compress(roh) + co.flush()
    eintrag = {'sex': 'w' if i.startswith('F') or i.startswith('BF') else 'm', 'knochen': kn, 'min': d['min'], 'max': d['max'],
               'nV': d['nV'], 'nD': d['nD'], 'nH': d['nH'], 'lum': d['lum'], 'n': len(roh), 'z': base64.b64encode(z).decode(), 'atlas': d['atlas']}
    teile.append(json.dumps(i) + ':' + json.dumps(eintrag, separators=(',', ':')) + ',\n')
teile.append('};\n')
teile.append('const FIG_ANIM={\n')
for a in anims:
    name, datei = a.split('=')
    d = json.load(open(os.path.join(out, 'anim_' + datei + '.json')))
    roh = base64.b64decode(d['q'])
    co = zlib.compressobj(9, zlib.DEFLATED, -15)
    z = co.compress(roh) + co.flush()
    teile.append(json.dumps(name) + ':' + json.dumps({'n': d['n'], 'fps': d['fps'], 'dauer': round(d['dauer'], 4), 'nq': len(roh), 'q': base64.b64encode(z).decode(), 'w': d['w']}, separators=(',', ':')) + ',\n')
teile.append('};\n')
KEEP = ['Bip01', 'Bip01_Pelvis', 'Bip01_Spine', 'Bip01_Spine1', 'Bip01_Spine2', 'Bip01_Neck', 'Bip01_Head']
for s in 'LR':
    for n in ['Clavicle', 'UpperArm', 'Forearm', 'Hand', 'Finger0', 'Finger1', 'Thigh', 'Calf', 'Foot', 'Toe0']:
        KEEP.append('Bip01_' + s + '_' + n)
namen = ['Wurzel' if k == 'Bip01' else k.replace('Bip01_', '') for k in KEEP]
teile.append('/* Knochenreihenfolge der Bewegungsaufnahmen */\nconst FIG_KNOCHEN=' + json.dumps(namen) + ';\n')
s = ''.join(teile)
open(ziel, 'w').write(s)
print(ziel, len(s))
