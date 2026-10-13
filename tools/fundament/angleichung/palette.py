# Zielpalette = Spiegel von MAT.PALETTE (01b-material.js). Werte sRGB.
TON={
 'tiefschwarz':0x0c0d10,'gummischwarz':0x1c1f24,'anthrazit':0x2a2e38,'graphit':0x3a3f48,'basaltgrau':0x59606b,
 'mittelgrau':0x6a7078,'silbergrau':0x8d939d,'hellgrau':0xa8acb2,'aluminium':0xc9ced6,'lichtgrau':0xdcdfe4,'weiss':0xe8ecf2,
 'signalgelb':0xf9a800,'schildgold':0xffd23f,'signalorange':0xed760e,'signalrot':0xd8352a,'signalgruen':0x2f9e57,'signalblau':0x2a5a9e,
 'nachtblau':0x1b2340,'holzPalette':0xc49a62,'holzPaletteDunkel':0xa9814e,'holzDunkel':0x4a3624,'tannengruen':0x2a4a33,'glasKlar':0xd6ecff,'wellpappe':0xc89b5c,'messing':0xc9a14e,'cremeweiss':0xf2efe6,'steingrau':0x9a958c,'feuerrot':0xaf2b1e,
}
# feste Zuordnungen (Bedeutung vor Abstand)
FEST={'9a2a24':None,'b8913e':'messing','f2c230':'signalgelb','e7a91c':'signalgelb','e0a520':'signalgelb','f0bf12':'signalgelb','f2a01c':'signalorange','f2a23a':'signalorange'}
KLASSE={'matt':(0.9,0),'kunststoff':(0.6,0),'lackMetall':(0.5,0.3),'stahl':(0.42,0.6),'blank':(0.28,0.85)}
def klasse(r,m):
    if m>=0.7 and r<0.36: return 'blank'
    if m>=0.45: return 'stahl'
    if m>=0.15: return 'lackMetall'
    if r>=0.8: return 'matt'
    return 'kunststoff'
# benannte Materialien = Ton + Klasse (nur ohne Zusatzoptionen)
REZEPT={}
