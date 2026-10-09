import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
im.resize((1312, 1200), Image.LANCZOS).save(sys.argv[2], optimize=True)
