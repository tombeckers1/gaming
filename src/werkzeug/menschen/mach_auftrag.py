import json, os, sys
M = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(M)
L = {'F01': 'rb/repo/Assets/Avatars/Adults/Female_Adult_01', 'BM01': 'rb/repo/Assets/Avatars/Professions/Business_Male_01'}
for a in ('F02=Adults/Female_Adult_02 F05=Adults/Female_Adult_05 F08=Adults/Female_Adult_08 F09=Adults/Female_Adult_09 F13=Adults/Female_Adult_13 '
          'F14=Adults/Female_Adult_14 F15=Adults/Female_Adult_15 F17=Adults/Female_Adult_17 BF01=Professions/Business_Female_01 '
          'BF03=Professions/Business_Female_03 FC01=Children/Female_Child_01 M02=Adults/Male_Adult_02 M03=Adults/Male_Adult_03 '
          'M04=Adults/Male_Adult_04 M05=Adults/Male_Adult_05 M06=Adults/Male_Adult_06 M08=Adults/Male_Adult_08 M09=Adults/Male_Adult_09 '
          'M12=Adults/Male_Adult_12 M13=Adults/Male_Adult_13 M14=Adults/Male_Adult_14 M16=Adults/Male_Adult_16 M20=Adults/Male_Adult_20 '
          'BM04=Professions/Business_Male_04 BM06=Professions/Business_Male_06 BM07=Professions/Business_Male_07 '
          'MC01=Children/Male_Child_01 CM07=Professions/Construction_Male_07').split():
    i, n = a.split('=')
    L[i] = 'rb/dl/Assets/Avatars/' + n
nur = sys.argv[2:] if len(sys.argv) > 2 else None
extra = json.load(open('js/figur_cfg.json')) if os.path.exists('js/figur_cfg.json') else {}
av = []
for i, p in L.items():
    if nur and i not in nur:
        continue
    nm = p.split('/')[-1]
    f = p + '/Export/' + nm + '.fbx'
    assert os.path.exists(f), f
    c = {'id': i, 'fbx': '../' + f, 'tex': '../arbeit/' + i, 'desk': 3300, 'handy': 1700}
    c.update(extra.get(i, {}))
    av.append(c)
A = json.load(open('auftrag1.json'))
A['avatare'] = av
json.dump(A, open(sys.argv[1], 'w'), indent=0)
print(len(av))
