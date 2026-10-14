"""Liest die Fundament-Dokumente (docs/fundament/*.md) für die Übersichtsseite (uebersicht.py).

Nichts davon wird abgeschrieben: die Seite wächst mit den Dokumenten. Die Wirtschaftsdokumente
(wirtschaft.md, wirtschaft-werte.md) erzeugt tools/fundament/wirtschaft-uebersicht.js aus WIRT/WIRT_KETTEN;
die Parser hier lesen deren feste Struktur. Ändert sich ein Dokumentformat, melden die Parser es laut
(Warnungen am Ende), statt still leere Abschnitte zu liefern.
"""
import html, os, re

WARN = []


def esc(s):
    return html.escape(s, quote=False)


def inline(s):
    """Markdown-Inline -> sicheres HTML: `code`, **fett**, *kursiv*, [text](url) -> text."""
    s = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', s)
    s = esc(s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<i>\1</i>', s)
    return s


# Texte in src/parts/01c-wirtschaft.js sind ASCII (ae/oe/ue/ss). Fuer die Seite deutsch schreiben, nur ganze Woerter,
# nicht in <code>. Unbekannte Woerter bleiben unveraendert (Quelle wird nicht angefasst).
_DE = {w.split('=')[0]: w.split('=')[1] for w in (
    'abbrueche=abbrüche abwaertsspirale=abwärtsspirale blindgaenger=blindgänger elastizitaet=elastizität erfuellt=erfüllt faecher=fächer flaeche=fläche '
    'geldpruefung=geldprüfung grossauftraege=großaufträge grosshandel=großhandel grosshandelslizenz=großhandelslizenz grosskunden=großkunden koerbe=körbe '
    'ladenflaeche=ladenfläche liefergebuehr=liefergebühr loehne=löhne luecke=lücke luecken=lücken neueroeffnung=neueröffnung packplaetze=packplätze '
    'praemie=prämie pruefung=prüfung regalplaetze=regalplätze rueckgeld=rückgeld rueckkehr=rückkehr stueck=stück tageslaenge=tageslänge '
    'volatilitaet=volatilität wundertuete=wundertüte wundertueten=wundertüten aendern=ändern entfaellt=entfällt faellt=fällt frueherem=früherem '
    'fuellt=füllt fuer=für fuers=fürs gezuendet=gezündet gezuendete=gezündete gezuendetem=gezündetem groessere=größere gross=groß '
    'grosszuegiger=großzügiger heissen=heißen heisst=heißt hoechstens=höchstens kuendigt=kündigt kuendigung=kündigung kuehl=kühl loecher=löcher '
    'muell=müll muendung=mündung naechsten=nächsten oeffnen=öffnen oefter=öfter ueber=über ueberhaupt=überhaupt unabhaengig=unabhängig '
    'verfuegbar=verfügbar waehlen=wählen zaehlt=zählt zoegern=zögern zubehoer=zubehör zuenden=zünden zurueck=zurück zusaetzlich=zusätzlich spaet=spät '
    'taeglich=täglich qualitaet=qualität traege=träge tuete=tüte kassenfluss=kassenfluss geschenkt=geschenkt saeule=säule getraenke=getränke '
    'paketwertschaetzung=paketwertschätzung aufschlaege=aufschläge').split()}


def deutsch(t):
    if not isinstance(t, str):
        return t
    def wort(m):
        w = m.group(0); r = _DE.get(w.lower())
        if not r:
            return w
        return r[0].upper() + r[1:] if w[0].isupper() else r
    teile = re.split(r'(<code>.*?</code>)', t)
    return ''.join(x if x.startswith('<code>') else re.sub(r'\b[A-Za-z]+\b', wort, x) for x in teile)


def lies(pfad):
    with open(pfad, encoding='utf-8') as f:
        return f.read()


def abschnitt(md, start, ende=None):
    """Text ab der Überschrift, die mit `start` beginnt, bis zur nächsten Überschrift gleicher oder höherer Ebene."""
    m = re.search(r'^(#+) ' + start + r'.*$', md, re.M)
    if not m:
        WARN.append('Abschnitt fehlt: ' + start)
        return ''
    ebene = len(m.group(1))
    rest = md[m.end():]
    n = re.search(r'^#{1,%d} ' % ebene, rest, re.M)
    return rest[:n.start()] if n else rest


def tabelle(text):
    """Erste Markdown-Tabelle im Text -> Liste von Zeilen (Listen von Zellen), Kopf und Trenner entfernt."""
    zeilen = [l for l in text.split('\n') if l.startswith('|')]
    out = []
    for l in zeilen[2:]:
        z = [c.strip() for c in l.strip().strip('|').split(' | ')]
        out.append(z)
    return out


def tabellen(text):
    """Alle Tabellen im Text (getrennt durch Nicht-Tabellenzeilen)."""
    bloecke, akt = [], []
    for l in text.split('\n'):
        if l.startswith('|'):
            akt.append(l)
        elif akt:
            bloecke.append('\n'.join(akt)); akt = []
    if akt:
        bloecke.append('\n'.join(akt))
    return [tabelle(b) for b in bloecke]


# ------------------------------------------------------------------ Angleichung
def angleichung(pfad):
    md = lies(pfad)
    r = {}
    s1 = abschnitt(md, r'1\. Was angeglichen wurde')
    r['was'] = [{'was': inline(z[0]), 'vorher': inline(z[1]), 'nachher': inline(z[2])} for z in (tabellen(s1) or [[]])[0] if len(z) >= 3]
    gelb = re.search(r'\*\*Gelb getrennt nach Bedeutung:\*\*(.*?)\n\n', s1, re.S)
    r['gelb'] = inline(' '.join(gelb.group(1).split())) if gelb else ''
    klassen = re.search(r'\*\*Oberflächenklassen\*\*.*?\n\n(\|.*?)\n\n', s1, re.S)
    r['klassen'] = []
    if klassen:
        for z in tabelle(klassen.group(1)):
            w = re.findall(r'[\d,]+', z[1])
            if len(w) >= 2:
                r['klassen'].append({'name': z[0].strip('`'), 'rau': float(w[0].replace(',', '.')), 'metall': float(w[1].replace(',', '.')), 'wofuer': inline(z[2])})
    if not r['klassen']:
        WARN.append('Oberflächenklassen nicht gefunden')
    s2 = abschnitt(md, r'2\. Cluster')
    r['cluster'] = []
    for z in tabelle(s2):
        if len(z) < 4:
            continue
        alt = [{'hex': h, 'n': int(n)} for h, n in re.findall(r'(#[0-9a-fA-F]{6})×(\d+)', z[1])]
        kopf = re.match(r'(\d+) Werte / (\d+) Stellen', z[1])
        neu = re.match(r'`([^`]+)` \*\*(#[0-9a-fA-F]{6})\*\* \((.*?)\)', z[2])
        if not neu:
            WARN.append('Cluster-Zeile nicht lesbar: ' + z[0]); continue
        r['cluster'].append({'cluster': z[0], 'werte': int(kopf.group(1)) if kopf else len(alt), 'stellen': int(kopf.group(2)) if kopf else sum(a['n'] for a in alt),
                             'alt': alt, 'id': neu.group(1), 'hex': neu.group(2), 'ral': neu.group(3).strip(), 'wofuer': inline(z[3])})
    eig = re.search(r'Bewusst \*\*eigene\*\* Töne.*?\n\n', s2, re.S)
    r['eigene'] = inline(' '.join(eig.group(0).split())) if eig else ''
    s3 = abschnitt(md, r'3\. Bilder')
    r['bildHinweis'] = inline(' '.join(re.search(r'Je Bild links.*?\n\n', s3, re.S).group(0).split())) if re.search(r'Je Bild links.*?\n\n', s3, re.S) else ''
    r['szenen'] = []
    for z in tabelle(s3):
        if len(z) < 2:
            continue
        links = re.findall(r'\[([^\]]+)\]\(angleichung/([^)]+)\)', z[0])
        r['szenen'].append({'links': [{'t': t, 'datei': d} for t, d in links], 'zeigt': inline(z[1])})
    s4 = abschnitt(md, r'4\. Bewusst NICHT')
    r['nicht'] = [inline(' '.join(b[2:].split())) for b in re.split(r'\n(?=- )', s4.strip()) if b.startswith('- ')]
    s5 = abschnitt(md, r'5\. Messung')
    r['messung'] = [{'was': inline(z[0]), 'vorher': inline(z[1]), 'nachher': inline(z[2])} for z in tabelle(s5) if len(z) >= 3]
    return r


# ------------------------------------------------------------------ Wirtschaft
def wirtschaft(pfad_md, pfad_werte):
    md = lies(pfad_md)
    a, b = md.find('<!-- AUTO:KETTEN'), md.find('<!-- /AUTO:KETTEN -->')
    ketten = []
    if a < 0 or b < a:
        WARN.append('AUTO:KETTEN fehlt in wirtschaft.md')
    else:
        teil = md[a:b]
        for blk in re.split(r'\n### ', teil)[1:]:
            zeilen = blk.split('\n')
            k = {'entscheidung': zeilen[0].strip(), 'folgen': [], 'warum': '', 'quelle': '', 'luecken': []}
            for l in zeilen[1:]:
                if not l.startswith('- '):
                    continue
                t = l[2:]
                if t.startswith('**Warum:**'):
                    k['warum'] = inline(t[len('**Warum:**'):].strip())
                elif t.startswith('**Quelle:**'):
                    k['quelle'] = inline(t[len('**Quelle:**'):].strip())
                elif t.startswith('**Lücke heute'):
                    k['luecken'] = [inline(x) for x in t.split(':**', 1)[1].strip().split(' · ')]
                else:
                    if ' → `' in t:
                        text, ort = t.rsplit(' → `', 1)
                        m = re.match(r'([^`]+)` \((.+)\)$', ort)
                        k['folgen'].append({'text': inline(text), 'ort': m.group(1) if m else ort, 'funktion': m.group(2) if m else ''})
                    else:
                        WARN.append('Folge ohne Ort: ' + t[:50]); k['folgen'].append({'text': inline(t), 'ort': '', 'funktion': ''})
            ketten.append(k)
    s = abschnitt(md, r'Fürs Balancing: bekannte Fehler')
    kopf = re.search(r'^## Fürs Balancing: (.*)$', md, re.M)
    fehler = [inline(' '.join(x.split())) for x in re.split(r'\n(?=\d+\. )', s.strip()) if re.match(r'\d+\. ', x)]
    fehler = [re.sub(r'^\d+\.\s*', '', f) for f in fehler]
    if not fehler:
        WARN.append('Fehlerliste „Fürs Balancing“ nicht gefunden')
    nicht = abschnitt(md, r'Was bewusst nicht in der Zentrale steht')
    nicht = [inline(' '.join(x[2:].split())) for x in re.split(r'\n(?=- )', nicht.strip()) if x.startswith('- ')]
    beweis = abschnitt(md, r'Beweis')
    beweis = [inline(' '.join(x[2:].split())) for x in re.split(r'\n(?=- )', beweis.strip()) if x.startswith('- ')]
    # Wertetabellen
    wm = lies(pfad_werte)
    gruppen = []
    for blk in re.split(r'\n## ', wm)[1:]:
        zeilen = blk.split('\n')
        g = {'name': zeilen[0].strip(), 'werte': []}
        for l in zeilen:
            if l.startswith('| `'):
                z = [c.strip() for c in l.strip().strip('|').split(' | ')]
                if len(z) < 5:
                    z += [''] * (5 - len(z))
                g['werte'].append({'name': z[0].strip('`'), 'wert': z[1], 'bedeutung': inline(z[2]), 'orte': re.findall(r'`([^`]+)`', z[3]), 'ketten': [x.strip() for x in z[4].split(',') if x.strip()]})
        gruppen.append(g)
    for k in ketten:
        k['entscheidung'] = deutsch(k['entscheidung']); k['warum'] = deutsch(k['warum']); k['luecken'] = [deutsch(x) for x in k['luecken']]
        for f in k['folgen']:
            f['text'] = deutsch(f['text'])
    for g in gruppen:
        for w in g['werte']:
            w['bedeutung'] = deutsch(w['bedeutung'])
    fehler = [deutsch(x) for x in fehler]; nicht = [deutsch(x) for x in nicht]; beweis = [deutsch(x) for x in beweis]
    return {'ketten': ketten, 'fehler': fehler, 'nicht': nicht, 'beweis': beweis, 'gruppen': gruppen}


# ------------------------------------------------------------------ Feuerwerk
def feuerwerk(pfad):
    md = lies(pfad)
    r = {}
    q = re.search(r'\*(„.*?“)\*', md, re.S)
    r['auftrag'] = ' '.join(q.group(1).split()) if q else ''
    s5 = abschnitt(md, r'5\. Das Regelwerk')
    regeln = []
    for blk in re.split(r'\n(?=\d+\. \*\*R\d)', s5.strip()):
        m = re.match(r'\d+\. \*\*(R\d+) (.+?)\*\* – (.*)', blk, re.S)
        if not m:
            continue
        rest = m.group(3)
        teile = re.split(r'\*Begründung:\*|\*Erzwungen:\*', rest)
        text = ' '.join(teile[0].split())
        rest = re.sub(r'\s*---\s*$', '', rest)
        teile = re.split(r'\*Begründung:\*|\*Erzwungen:\*', rest)
        regeln.append({'id': m.group(1), 'titel': m.group(2), 'text': inline(text),
                       'begruendung': inline(' '.join(teile[1].split())) if len(teile) > 1 else '',
                       'erzwungen': inline(' '.join(teile[2].split())) if len(teile) > 2 else ''})
    if len(regeln) < 8:
        WARN.append('Regeln gefunden: %d (erwartet 8)' % len(regeln))
    r['regeln'] = regeln
    s3 = abschnitt(md, r'3\. Abweichungen')
    ab = []
    for z in tabelle(s3):
        if len(z) < 5:
            continue
        offen = 'offen' in z[4].lower()
        ab.append({'id': z[0], 'vorher': inline(z[1]), 'betroffen': inline(z[2]), 'regel': z[3], 'jetzt': inline(z[4]), 'offen': offen})
    r['abweichungen'] = ab
    s4 = abschnitt(md, r'4\. Fragen an Tom')
    fr = []
    for blk in re.split(r'\n(?=- \*\*F\d)', s4.strip()):
        m = re.match(r'- \*\*(F\d) (.+?)\*\*(.*)', blk, re.S)
        if m:
            fr.append({'id': m.group(1), 'titel': m.group(2).strip(), 'text': inline(' '.join(m.group(3).split()))})
    r['fragen'] = fr
    s2 = abschnitt(md, r'2\. Inventar')
    r['inventar'] = [{'klasse': inline(z[0]), 'anzahl': inline(z[1]), 'platz': inline(z[2]), 'modell': inline(z[3]), 'loecher': inline(z[5] if len(z) > 5 else '')} for z in tabelle(s2) if len(z) >= 6]
    s1 = abschnitt(md, r'1\. Zünd-Orte')
    r['orte'] = [{'ort': inline(z[0]), 'wo': inline(z[1])} for z in tabelle(s1) if len(z) >= 2]
    s7 = abschnitt(md, r'7\. Messung')
    t = re.search(r'- `abschussregel` \(neu\):.*?(?=\n- )', s7, re.S)
    r['test'] = inline(' '.join(t.group(0)[2:].split())) if t else ''
    g = re.search(r'Gegenprobe `GEGENPROBE=1\.\.5`.*?\.\n', s7, re.S)
    r['gegenprobe'] = inline(' '.join(g.group(0).split())) if g else ''
    if not (regeln and ab and fr):
        WARN.append('Feuerwerk-Regeln: Regeln/Abweichungen/Fragen unvollständig')
    return r
