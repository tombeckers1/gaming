# Holt FBX und Farbtexturen der gewaehlten Rocketbox-Figuren und bereitet die Texturen vor
# Aufruf: python3 hole_figuren.py <id>=<Ordner/Name> ...
import sys, os, subprocess
M = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
alle = open(os.path.join(M, 'rb', 'alle.txt')).read().split('\n')
for arg in sys.argv[1:]:
    fid, name = arg.split('=')
    basis = 'Assets/Avatars/' + name + '/'
    dateien = [p for p in alle if p.startswith(basis) and (p.endswith(name.split('/')[-1] + '.fbx') and '/Export/' in p or
               (p.endswith('_color.tga') and '/Textures/' in p))]
    ziel = os.path.join(M, 'rb', 'dl')
    subprocess.run([sys.executable, os.path.join(M, 'js', 'hole.py'), ziel] + dateien, check=True)
    subprocess.run([sys.executable, os.path.join(M, 'js', 'texprep.py'), os.path.join(ziel, basis), os.path.join(M, 'arbeit', fid)], check=True)
    print('fertig', fid, name, len(dateien))
