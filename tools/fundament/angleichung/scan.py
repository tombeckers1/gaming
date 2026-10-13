# python3 scan.py : alle Hex-Literale in den Welt-Dateien mit Kontext -> scan.json + Clusterbericht
import re, json, math, collections, sys
P='/home/user/gaming/src/parts/'
FILES=['03-scene','04-models','05-world','05b-ao','05c-buildworld','05d-yard','05e-street','05f-facade','05g-dock','05h-ausbau','05j-stadt','05l-eingang2','05m-logistik','05n-park','05o-oberflaechen','06-fixtures','06b-gravur','07-deko','07b-wischer','08-boxes','08b-truck','08d-karre','11c-versand','11d-packmaterial','11e-palette','15b-pda']
def lab(h):
    r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: ((c+0.055)/1.055)**2.4 if c>0.04045 else c/12.92
    r,g,b=f(r),f(g),f(b)
    X=(0.4124*r+0.3576*g+0.1805*b)/0.95047; Y=0.2126*r+0.7152*g+0.0722*b; Z=(0.0193*r+0.1192*g+0.9505*b)/1.08883
    g2=lambda t: t**(1/3) if t>0.008856 else 7.787*t+16/116
    return (116*g2(Y)-16, 500*(g2(X)-g2(Y)), 200*(g2(Y)-g2(Z)))
recs=[]
for f in FILES:
    for i,l in enumerate(open(P+f+'.js',encoding='utf8')):
        if l.strip().startswith('//'): continue
        for m in re.finditer(r'0x([0-9a-fA-F]{6})\b',l):
            pre=l[max(0,m.start()-24):m.start()]
            if re.search(r'MAT\.std\($',pre): k='MATstd'
            elif re.search(r'(?<![\w.])std\($',pre): k='std'
            elif re.search(r'MAT\.basic\($',pre): k='basic'
            elif re.search(r'emissive\s*:\s*(LIN\()?$',pre): k='emissive'
            elif re.search(r'color\s*:\s*(LIN\()?$',pre): k='color'
            elif re.search(r'LIN\($',pre): k='LIN'
            elif re.search(r'setHex\($|Color\($',pre): k='setHex'
            else: k='arg'
            opts=''
            if k in('MATstd','std'):
                mm=re.match(r'\s*,\s*\{([^{}]*)\}',l[m.end():]); opts=mm.group(1) if mm else ''
            recs.append(dict(f=f,z=i+1,hex=m.group(1).lower(),k=k,o=opts,ctx=l[max(0,m.start()-60):m.end()+50].strip()))
json.dump(recs,open('scan.json','w'),indent=0)
cnt=collections.Counter(r['hex'] for r in recs)
print('Literale',len(recs),'verschieden',len(cnt))
print(collections.Counter(r['k'] for r in recs))
