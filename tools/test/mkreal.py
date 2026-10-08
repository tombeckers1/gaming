src=open('boellerbude.html').read()
tag='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
assert tag in src, 'CDN-Tag nicht gefunden'
three=open('three.min.js').read()
open('real.html','w').write(src.replace(tag,'<script>\n'+three+'\n</script>'))
print('real.html',len(open('real.html').read()))
