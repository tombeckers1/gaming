#!/usr/bin/env python3
"""Übersichtsseite für Tom (Fundament, 13.10.2026).

Tom: „Ich will den Unterbau sehen – so sieht ein Rolltor aus, so die Fenster, so die Kassen …
und jede Textur in einer Liste, damit ich nicht 20× spielen muss.“
Liest docs/fundament/katalog/katalog.json (+ Bilder) aus tools/fundament/katalog.js und schreibt
EINE eigenständige HTML-Seite (Bilder eingebettet). Mitwachsend: nach jedem Fundament-Schritt
Katalog neu erzeugen, dann dieses Skript.

Aufruf: python3 tools/fundament/uebersicht.py <katalog-ordner> <ausgabe.html> [stand.json]
stand.json (optional): {"commit": "...", "version": "V128", "schritte": [{"name":..,"stand":"fertig|laeuft|offen","text":..}]}
"""
import base64, json, os, sys, html

kat_dir, out = sys.argv[1], sys.argv[2]
stand = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
K = json.load(open(os.path.join(kat_dir, 'katalog.json')))


def bild(rel):
    if not rel:
        return None
    p = os.path.join(kat_dir, rel)
    if not os.path.exists(p):
        return None
    ext = os.path.splitext(p)[1].lstrip('.').replace('jpg', 'jpeg')
    return f'data:image/{ext};base64,' + base64.b64encode(open(p, 'rb').read()).decode()


def verw(lst, n=3):
    return [{'n': v.get('name'), 'c': v.get('code'), 'm': v.get('meshes')} for v in (lst or [])[:n]]


mats = []
for e in K['materialien']['eintraege']:
    mats.append({
        'id': e['id'], 'name': e.get('name'), 'hex': e.get('hex'), 'r': e.get('roughness'), 'm': e.get('metalness'),
        'art': e.get('art'), 'kat': e.get('kategorie'), 'wofuer': e.get('wofuer'), 'tex': len(e.get('texturen') or []),
        'vc': e.get('vertexfarben'), 'tr': e.get('transparent'), 'em': e.get('emissiv'),
        'meshes': e.get('meshes') or 0, 'abrufe': e.get('abrufe') or 0, 'gruppen': e.get('verwendungGruppen') or 0,
        'verw': verw(e.get('verwendung')), 'zonen': [z['zone'] for z in (e.get('zonen') or [])][:4],
        'bild': bild(e.get('bild')),
    })

texs = []
for e in K['texturen']['eintraege']:
    texs.append({
        'id': e['id'], 'w': e['w'], 'h': e['h'], 'mb': e.get('mbGpu') or e.get('mb'), 'objekte': e.get('texturObjekte'),
        'herkunft': e.get('herkunft'), 'code': e.get('herkunftCode'), 'bib': e.get('bibliothek'), 'wofuer': e.get('wofuer'),
        'meshes': e.get('meshes'), 'verw': verw(e.get('verwendung')), 'bild': bild(e.get('bild')),
    })

vorher = []
for c in K['vorher']['kategorien']:
    vorher.append({'name': c['name'], 'v': [{
        't': v.get('titel'), 'code': v.get('code'), 'anzahl': v.get('anzahl'), 'zone': v.get('zone'),
        'meshes': v.get('meshes'), 'mats': v.get('materialien'), 'dreiecke': v.get('dreiecke'),
        'nach': v.get('nachgebaut'), 'bild': bild(v.get('bild'))} for v in c['varianten']]})

bauteile = [{'name': b['name'], 'inst': b['instanzen'], 'dreiecke': b['dreieckeGesamt'], 'var': b['varianteAnzahl'],
             'bild': bild(b['varianten'][0].get('bild')) if b['varianten'] else None,
             'zonen': sorted({f.get('zone') for f in b.get('fundorte', []) if f.get('zone')})}
            for b in K['bauteile']['eintraege']]

farben = K['baukasten'].get('farben') or []
daten = {
    'erzeugt': K.get('erzeugt'), 'spiel': K.get('spiel'), 'z': K.get('zaehlung'),
    'matSum': {k: K['materialien'].get(k) for k in ['bibliothek', 'fremd', 'gespart', 'abrufe']},
    'texSum': {k: K['texturen'].get(k) for k in ['einzigartig', 'texturObjekte', 'dubletten', 'rohMB', 'gpuMB']},
    'mats': mats, 'texs': texs, 'vorher': vorher, 'bauteile': bauteile, 'farben': farben,
    'kartons': {'n': K['verpackungen']['anzahl'], 'mb': K['verpackungen'].get('gpuMB'), 'bild': bild(K['verpackungen'].get('bild'))},
    'stand': stand,
}

tpl = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uebersicht-vorlage.html')).read()
open(out, 'w').write(tpl.replace('/*__DATEN__*/null', json.dumps(daten, ensure_ascii=False, separators=(',', ':'))))
print(out, round(os.path.getsize(out) / 1e6, 2), 'MB')
