import io
src=open('boellerbude.html').read()
tag='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
assert tag in src, 'CDN-Tag nicht gefunden'
stub=open('three-stub.js').read()
open('test.html','w').write(src.replace(tag,'<script>\n'+stub+'\n</script>'))
print('test.html',len(open('test.html').read()))
