# python3 angleich.py [--schreiben] : Materialangleichung (Fundament Etappe 2, Schritt 2)
import re, sys, json, math, collections
from scan import lab, FILES
from palette import TON, FEST, KLASSE, klasse, REZEPT
P='/home/user/gaming/src/parts/'
SCHREIB='--schreiben' in sys.argv
OHNE={'03-scene','04-models'}           # Licht/Nebel, Produkte
ZEILE_AUS={('08b-truck',7)}             # Lieferanten-Hausfarben (Bedeutung)
def lch(h):
    L,a,b=lab(h); return L,math.hypot(a,b),(math.degrees(math.atan2(b,a))%360)
TL={k:lab('%06x'%v) for k,v in TON.items()}
def ziel(h,TN=6.5,TC=12):
    if h in FEST: return (FEST[h],0) if FEST[h] else None
    L,C,H=lch(h); best=None
    for k,v in TON.items():
        if k=='signalgelb': continue   # Gelb nur ueber FEST/Gelbregel
        L2,C2,H2=lch('%06x'%v); d=math.dist(lab(h),TL[k])
        if (C<12)!=(C2<12): continue
        if C>=12 and min(abs(H-H2),360-abs(H-H2))>22: continue
        if d<=(TN if C<12 else TC) and (best is None or d<best[1]): best=(k,d)
    return best
def parse_opts(s):
    o={}; 
    for part in [x for x in re.split(r',(?![^()]*\))',s) if x.strip()]:
        if ':' not in part: return None
        k,v=part.split(':',1); o[k.strip()]=v.strip()
    return o
stat=collections.Counter(); bericht=collections.defaultdict(lambda: collections.Counter()); combo=collections.Counter(); aus=collections.Counter()
log=[]
for f in FILES:
    if f in OHNE: continue
    src=open(P+f+'.js',encoding='utf8').read().split('\n'); out=[]
    for i,l in enumerate(src):
        z=i+1
        if l.strip().startswith('//') or (f,z) in ZEILE_AUS: out.append(l); continue
        # gesperrte Bereiche: Listen mit >=3 Farben, pick(...), hexMix(...)
        sperr=[]
        for m in re.finditer(r'\[[^\[\]]*\]',l):
            if len(re.findall(r'0x[0-9a-fA-F]{6}',m.group(0)))>=3: sperr.append((m.start(),m.end()))
        for m in re.finditer(r'(pick|hexMix)\([^()]*(\([^()]*\)[^()]*)*\)',l): sperr.append((m.start(),m.end()))
        rep=[]  # (start,end,text)
        for m in re.finditer(r'0x([0-9a-fA-F]{6})\b',l):
            h=m.group(1).lower(); s0=m.start()
            pre=l[max(0,s0-40):s0]
            if h in('ffffff','000000'): aus['weiss/schwarz (Tönung)']+=1; continue
            if any(a<=s0<b for a,b in sperr): aus['Liste/Zufall (bewusste Vielfalt)']+=1; continue
            if re.search(r'emissive\s*:\s*(LIN\()?$',pre): aus['Leuchtfarbe']+=1; continue
            if re.search(r'(copy\(LIN\(|setHex\(|Light\(|Fog\(|Color\()$',pre): aus['Zustand/Licht']+=1; continue
            if "'leucht'" in l or "'lampe'" in l or 'emissive' in l and 'color' not in pre[-12:] and not re.search(r'std\($',pre): 
                if "'leucht'" in l or "'lampe'" in l: aus['Leucht-/Lampenteil']+=1; continue
            if 'map:' in l and re.search(r'color\s*:\s*(LIN\()?$',pre): aus['Texturtönung']+=1; continue
            zz=ziel(h)
            if not zz: aus['ohne Cluster (Einzelfarbe)']+=1; bericht['_rest'][h]+=1; continue
            ton=zz[0]; bericht[ton][h]+=1
            kind='MATstd' if re.search(r'MAT\.std\($',pre) else ('std' if re.search(r'(?<![\w.])std\($',pre) else 'farbe')
            if kind in('MATstd','std'):
                mm=re.match(r'\s*(,\s*\{([^{}]*)\})?\)',l[m.end():])
                if not mm: kind='farbe'
                else:
                    o=parse_opts(mm.group(2) or '') if mm.group(1) else {}
                    try:
                        r=float(o.pop('roughness','0.85')); mt=float(o.pop('metalness','0'))
                    except Exception: o=None
                    if o is None: kind='farbe'
                    else:
                        kl=klasse(r,mt)
                        if ton.startswith('holz') or ton in('steingrau','cremeweiss'): kl='matt'
                        if ton=='messing' and kl not in('stahl','blank'): kl='stahl'
                        combo[(ton,kl,kind,bool(o))]+=1
                        ex=('{'+','.join(k+':'+v for k,v in o.items())+'}') if o else ''
                        start=s0-(8 if kind=='MATstd' else 4); end=m.end()+mm.end()
                        assert l[start:s0] in('MAT.std(','std('),l[start:s0]
                        if kind=='MATstd':
                            name=REZEPT.get((ton,kl))
                            txt=("MAT.get('%s')"%name) if (name and not ex) else ("MAT.ober('%s','%s'%s)"%(ton,kl,','+ex if ex else ''))
                        else:
                            txt="MAT.eigen('%s','%s'%s)"%(ton,kl,','+ex if ex else '')
                        rep.append((start,end,txt)); stat[kind]+=1; log.append((f,z,'0x'+h,txt)); continue
            rep.append((s0,m.end(),"MAT.farbe('%s')"%ton)); stat['farbe']+=1; log.append((f,z,'0x'+h,ton))
        for a,b,t in sorted(rep,reverse=True): l=l[:a]+t+l[b:]
        out.append(l)
    if SCHREIB: open(P+f+'.js','w',encoding='utf8').write('\n'.join(out))
print('umgestellt',dict(stat),'gesamt',sum(stat.values()))
print('ausgelassen',dict(aus))
json.dump({'bericht':{k:dict(v) for k,v in bericht.items()},'combo':[[list(k),n] for k,n in combo.most_common()],'log':log,'aus':dict(aus)},open('angleich.json','w'),indent=0)
for k,n in combo.most_common(): print(n,k)
