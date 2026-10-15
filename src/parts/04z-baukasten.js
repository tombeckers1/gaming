/* =========================================================
   Baukasten – Kern (Fundament Etappe 2, Schritt 1)

   Tom 13.10.2026: "einheitliche Struktur – ändert man es an einer
   Stelle, ändert es sich überall." Bauteile entstehen ab jetzt aus
   EINER Implementierung mit Parametern. Hier liegt der gemeinsame Kern:
   - bk.lod()      Detailstufe aus der Grafikstufe (MAT.stufe)
   - bk.kasten()   Kastenform: gefast oder einfacher Kasten nach Parametern
   - bk.sammler()  viele Teile -> je Oberflaechenklasse EIN Mesh mit
                   Vertexfarben (MAT.vc). Vorher sieben eigene Sammler
                   (geraetBau 06, VC/vsHolzGeo 11e, hvSammler Halle, ...).
   - bk.schild()   Schild Nachtblau/Gold mit Textur-Cache (gleicher Text,
                   gleiche Groesse = eine Textur).
   Jedes Mesh aus dem Baukasten traegt userData.bauteil (Waechter-Tests,
   Uebersicht). Regel: nie daneben neu bauen - fehlt etwas, hier ergaenzen.
   Doku: docs/fundament/baukasten.md
   ========================================================= */
const bk={};
/* 0 = Ultra Low, 1 = Niedrig bis Hoch, 2 = ab Maximum (beim Laden fest) */
bk.lod=()=>MAT.stufe().lod;
/* Kasten w x h x d. o.fase = groesste Fase (m), o.anteil = Fase hoechstens Anteil der kleinsten
   Kante (Standard 0,2), o.faseMin = darunter einfacher Kasten, o.seg = Segmente der Fase,
   o.lod0Kasten = auf Ultra Low einfacher Kasten. Ohne o.fase: einfacher Kasten. */
bk.kasten=function(w,h,d,o){
  o=o||{}; const mn=Math.min(w,h,d);
  if(!o.fase||(o.lod0Kasten&&bk.lod()===0)||mn<(o.faseMin||0)) return new THREE.BoxGeometry(w,h,d);
  return roundedBoxGeo(w,h,d,Math.min(o.fase,mn*(o.anteil||0.2)),o.seg);
};
/* ---------- Sammler ----------
   const S=bk.sammler({form:{fase:0.02,faseMin:0.03}, klasse:'lack', reihenfolge:[...], mats:{...}});
   S.pivot(x,y,z,rx,ry,rz)                         Bezugsmatrix fuer gekippte Baugruppen (leer = aus)
   S.box(w,h,d,x,y,z,farbe,klasse,rx,ry,rz)        Kasten (Form nach opt.form)
   S.rund(w,h,d,r,x,y,z,farbe,klasse,rx,ry,rz)     Kasten mit fester Fase r
   S.zyl(r1,r2,h,seg,x,y,z,farbe,klasse,rx,ry,rz)  Zylinder/Kegelstumpf
   S.geo(geo,m,farbe,klasse)                       beliebige Geometrie mit Matrix
   S.teile(klasse) -> [{geo,m,color}]              zum Weiterverwenden in einem fremden merge()
   S.geometrie(klasse) -> BufferGeometry           verschmolzen, ohne Mesh (z. B. geteilte Palette)
   S.fertig(parent,{schatten,bauteil,fest,mats,geo,nachher}) -> Mesh[]  je Klasse ein Mesh,
        Material MAT.vc(klasse) oder mats[klasse] / mats(klasse) (null = auslassen); schatten auch
        als Funktion(klasse); geo(geo,klasse) bearbeitet die verschmolzene Geometrie; nachher(mesh,klasse);
        userData.bauteil/klasse (bauteil:false = ohne Markierung)
   Klassen: standard (vcMat) | lack | metall | matt | glas | leucht (siehe MAT.vc). */
bk.sammler=function(opt){
  opt=opt||{};
  const L={}, form=opt.form||{}; let basis=null;
  if(opt.reihenfolge) for(const k of opt.reihenfolge) L[k]=[];
  const add=(kl,geo,m,c)=>{ if(basis) m=basis.clone().multiply(m); (L[kl]||(L[kl]=[])).push({geo,m,color:c}); };
  const kl=k=>k||opt.klasse||'standard';
  const S={
    L,
    pivot(x,y,z,rx,ry,rz){ basis=(x===undefined)?null:tm(x,y,z,rx,ry,rz); return S; },
    box(w,h,d,x,y,z,farbe,klasse,rx,ry,rz){ add(kl(klasse),bk.kasten(w,h,d,form),tm(x,y,z,rx,ry,rz),farbe); return S; },
    rund(w,h,d,r,x,y,z,farbe,klasse,rx,ry,rz){ add(kl(klasse),roundedBoxGeo(w,h,d,r),tm(x,y,z,rx,ry,rz),farbe); return S; },
    zyl(r1,r2,h,seg,x,y,z,farbe,klasse,rx,ry,rz){ add(kl(klasse),new THREE.CylinderGeometry(r1,r2,h,seg),tm(x,y,z,rx,ry,rz),farbe); return S; },
    geo(geo,m,farbe,klasse){ add(kl(klasse),geo,m||new THREE.Matrix4(),farbe); return S; },
    teile(klasse){ return L[kl(klasse)]||[]; },
    leer(){ for(const k in L) if(L[k].length) return false; return true; },
    geometrie(klasse){ const t=L[kl(klasse)]; return t&&t.length?merge(t):null; },
    fertig(parent,o){
      o=o||{}; const out=[], mats=o.mats||opt.mats;
      for(const k in L){ if(!L[k].length) continue;
        /* Material: eigene Tabelle/Funktion (null = Klasse auslassen) oder MAT.vc(klasse) */
        const mat=typeof mats==='function'?mats(k):((mats&&mats[k])||MAT.vc(k)); if(!mat) continue;
        let geo=merge(L[k]); if(o.geo) geo=o.geo(geo,k)||geo;
        const me=new THREE.Mesh(geo,mat);
        const sch=typeof o.schatten==='function'?o.schatten(k):(HIQ&&o.schatten!==false&&k!=='leucht'&&k!=='scheibe');
        if(sch){ me.castShadow=true; me.receiveShadow=true; }
        if(o.bauteil!==false){ me.userData.bauteil=o.bauteil||opt.bauteil||'sammler'; me.userData.klasse=k; }
        if(o.fest){ me.matrixAutoUpdate=false; me.updateMatrix(); }
        if(o.nachher) o.nachher(me,k);
        parent.add(me); out.push(me); }
      return out; }
  };
  return S;
};
/* ---------- Schild (Nachtblau/Gold, Hausstil) mit Textur-Cache ----------
   bk.schildTex({text,unter,bg,fg,w,h}) -> geteilte Textur (Schluessel = alle Werte)
   bk.schild(parent,{text,unter,b,h,x,y,z,ry,bg,fg,px}) -> Mesh (Ebene b x h Meter)
   Stil wie hvSchild (Halle): Hintergrund #1b2340, Goldstreifen unten, Text hell (BUN),
   Untertitel gold (BAR). Material je Textur geteilt (MAT-Regel: nie veraendern). */
const _bkSchildT=new Map(), _bkSchildM=new Map();
bk.schildTex=function(o){
  const W=Math.round(o.w||512), H=Math.round(o.h||160), bg=o.bg||'#1b2340', fg=o.fg||MAT.css('schildgold');
  const k=[o.text,o.unter||'',bg,fg,W,H].join('|'); let t=_bkSchildT.get(k);
  if(!t){ t=tex(W,H,(g,W2,H2)=>{
      g.fillStyle=bg; g.fillRect(0,0,W2,H2);
      g.fillStyle=fg; g.fillRect(0,H2-8,W2,8);
      g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#eef2f8';
      fitFont(g,o.text,W2*0.9,o.unter?Math.round(H2*0.42):Math.round(H2*0.55),BUN); g.fillText(o.text,W2/2,o.unter?H2*0.38:H2/2-3);
      if(o.unter){ g.fillStyle=fg; fitFont(g,o.unter,W2*0.9,Math.round(H2*0.24),BAR); g.fillText(o.unter,W2/2,H2*0.74); } });
    _bkSchildT.set(k,t); }
  return t;
};
bk.schild=function(parent,o){
  const px=Math.round(160*(o.px||1)), w=Math.round(px*Math.min(6.4,Math.max(1,o.b/o.h))), h=px;
  const t=bk.schildTex({text:o.text,unter:o.unter,bg:o.bg,fg:o.fg,w,h});
  let m=_bkSchildM.get(t); if(!m){ m=new THREE.MeshStandardMaterial({map:t,roughness:0.6}); m.userData.mat='schild'; _bkSchildM.set(t,m); }
  const me=new THREE.Mesh(new THREE.PlaneGeometry(o.b,o.h),m);
  me.position.set(o.x||0,o.y||0,o.z||0); me.rotation.y=o.ry||0; me.userData.bauteil='schild';
  (parent||scene).add(me); return me;
};
/* Schild wieder abbauen (zeitweilige Schilder, z. B. Ausstellung 2.0): Mesh, Geometrie, Material und Textur frei, auch aus dem Cache */
bk.schildWeg=function(me){ const m=me.material, t=m&&m.map;
  for(const [k,v] of [..._bkSchildM]) if(v===m) _bkSchildM.delete(k);
  for(const [k,v] of [..._bkSchildT]) if(v===t) _bkSchildT.delete(k);
  if(me.parent) me.parent.remove(me); me.geometry.dispose(); if(m) m.dispose(); if(t) t.dispose(); };
bk.liste=function(){ return {schildTexturen:_bkSchildT.size,schildMaterialien:_bkSchildM.size}; };

/* =========================================================
   Tor (Fundament Etappe 2, Schritt "Tore" - Pilot des Baukastens, 13.10.)

   Tom 13.10.: "ein Rolltor fuer Anlieferungen sieht ueberall gleich aus; aendert man es an
   einer Stelle, aendert es sich ueberall." Vorher sechs eigene Tor-Bauten (R1 05g, R2-R5
   aussen und innen 05h, V1 11e, Ost-Attrappe 05h, Zauntore 05g/05h) mit drei Torblatt-
   Texturen und vier Ampel-Varianten. Jetzt EINE Implementierung, Unterschiede nur ueber
   Parameter mit Bedeutung (Art, Groesse, Fenster, Nummer, Seite, Beschlag).

   Standard-Optik = der alte R1 an der Basisrampe (bis V129). Tom 14.10.: "Mach die Rolltore
   bitte so wie damals das allererste Rolltor, was man freischaltet. Das war grau. Jetzt sind
   alle schwarz. Auch von der Textur her hat mir das alte besser gefallen. Bitte so einheitlich
   aendern." Also: Sektionen glatt lichtgrau, Lichtband mit vier Scheiben im vorletzten Panel,
   unten aussen Warnstreifen und Griffmulde, Bodengummi, Scharnierbaender aussen; Zarge
   verzinkt durch die Wand, schmale Torabdichtung, Puffer, Vordach 1,9 m mit Schnee, Poller,
   kleine Ampel, gelber Bedienkasten. Die graphitfarbene V1-Optik von V130 (Lamellen,
   Fensterband, Warnschraffur auf Polstern und Schienen, Not-Halt) ist verworfen (14.10.).
   Begruendung und Parametertabelle: docs/fundament/tore.md

   Lokales Mass: x = Wandnormale (aussen -x, innen +x), z = quer ueber die Torbreite (Mitte 0),
   y = Boden. Die Gruppe steht bei (o.x, o.y, o.z), gedreht um o.ry, so dass +x in den Raum zeigt.

   const T=bk.tor({
     art:'sektional'|'roll'|'gitter', breite, hoehe, panele (Standard: Hoehe/0,6 bzw. /0,5),
     fenster:true|false|Zeile (Fensterband, Standard Zeile floor(0,6*panele)),
     fuehrung:'vertikal'|'normal' (Sektionaltor: Blatt faehrt senkrecht hoch | biegt ueber
       den Bogen R unter die Decke, o.decke = Hoehe der Deckenabhaenger),
     antrieb:'welle'|'kasten' (Standard: sektional Welle, roll Wickelkasten),
     seite:'aussen'|'innen'|'beide', ampel:'aussen'|'innen'|'beide'|false, bedien:+1|-1 (Seite
     von Ampel/Bedienkasten, quer), vordach, dichtung (Torabdichtung + Puffer), poller,
     fahrzeug (Breite des andockenden Fahrzeugs, Standard 3,0 = Koffer-LKW an R1; 2,55 = Auflieger
       an R2-R5: die Polster schliessen den Spalt bis an das Heck),
     nr:'2'|null (Nummernschild ueber bk.schild), wand:[xAussen,xInnen] (Wandflaechen),
     blatt:x (Ebene des Torblatts), beweglich:false (Attrappe: Blatt fest im Sammler),
     offen:0..1, parent, x,y,z,ry,
     gitter: bewegung:'schiebe'|'fluegel', boden (Luft unten), pfosten, schloss })
   -> T = { g, art, panele:[Mesh], blatt (Mesh bei fuehrung 'vertikal'), zu, auf, t, set(t01),
            ampel:{rot,gruen}|null, warn, kollision:[{x0,x1,z0,z1,art}] (Welt), statisch:[Mesh] }
   Die Spiel-Logik (door, WTORE, VD, Kollision des Blatts, Ampel schalten) bleibt in den
   Huellen (05g, 05h, 11e) - bk.tor baut nur und bewegt das Blatt.
   ========================================================= */
/* UVs eines Kastens auf Zeilen des Atlas torBlatt legen (0 Sektion, 1 Lichtband, 2 unten aussen, 3 weiss).
   zeile = Aussenflaeche (-x), innen = Innenflaeche (+x), rand = Stirn-/Kantenflaechen (Standard: wie zeile).
   BoxGeometry mit einem Segment: je Flaeche 4 Ecken in der Folge +x, -x, +y, -y, +z, -z. */
bk.uvZeile=function(geo,zeile,innen,rand){
  const uv=geo.attributes.uv, Z=4, e=2/128, box=uv.count===24;
  if(innen===undefined) innen=zeile; if(rand===undefined) rand=zeile;
  for(let i=0;i<uv.count;i++){
    const zl=!box?zeile:(i<4?innen:(i<8?zeile:rand));
    if(zl===3) uv.setXY(i,0.5,1-3.5/Z);
    else uv.setY(i,1-(zl+1)/Z+(e+uv.getY(i)*(1-2*e))/Z); }
  uv.needsUpdate=true; return geo;
};
/* Stab zwischen zwei Punkten in der x-y-Ebene (z fest) - Streben, Abhaenger */
bk.stab=function(S,x0,y0,x1,y1,z,d,farbe,klasse){
  const dx=x1-x0, dy=y1-y0; S.box(d,Math.hypot(dx,dy),d,(x0+x1)/2,(y0+y1)/2,z,farbe,klasse,0,0,Math.atan2(-dx,dy)); return S;
};
/* =========================================================
   Poller, Anfahrschutz, Zaun, Absperrband (Fundament Etappe 2, Schritt "Zaeune/Poller", 14.10.)

   Vorher fuenf Zaunsysteme (Doppelstab 05e, gelbes Gitter 05h, Versandhof-Zaun 11e mit
   halbdurchsichtiger Scheibe, Gitterbox, Halle), sechs Poller in vier Farben, drei
   Absperrband-Bauten (05h) mit je eigenem Material und ein Rohr-Anfahrschutz (05d).
   Jetzt je Art EINE Optik; die Art hat eine Bedeutung (aussen/innen, Strasse/Industrie).
   Alles geht in einen Sammler (wenige Meshes), Materialien nur aus MAT, jedes Mesh mit
   userData.bauteil. Kollision bleibt beim Aufrufer (Rueckgabe = Rechtecke). Doku: zaeune.md
   ========================================================= */
/* Fussplatte (Pfosten von Gitter, Anfahrschutz, Absperrung) - ueberall dieselbe */
bk.fuss=function(S,x,z,b,y0){ S.box(b||0.12,0.015,b||0.12,x,(y0||0)+0.008,z,MAT.farbe('anthrazit'),'stahl'); return S; };
/* Poller in einen Sammler; Rueckgabe = Kollisionsrechteck lokal.
   art 'anfahr' (Standard): Industrie-Anfahrschutz an Toren und Rampen - Signalgelb, Gummikappe
     (wie am alten R1; Reflexbaender am 14.10. mit der Graphit-Tor-Optik verworfen).
   art 'stadt': Strassenpoller auf dem Gehweg - rund, graphit, Kuppel, Reflexring (Vorbild
     Stadtmoebel 05e). o.kl = Klassen-Namen des Sammlers {lack,matt} (Stadtmoebel: eigene
     Strassenmaterialien mit Lichtpfuetzen), o.y = Bodenhoehe (Gehweg). */
bk.poller=function(S,x,z,o){
  o=o||{}; const F=MAT.farbe, y0=o.y||0;
  if(o.art==='stadt'){
    const h=o.hoehe||0.87, r=0.05, seg=[8,14,16][bk.lod()], kl=Object.assign({lack:'lackMetall',matt:'matt'},o.kl||{}), G=F('graphit');
    S.zyl(0.075,0.075,0.02,seg,x,y0+0.01,z,G,kl.lack);
    S.zyl(r,r,h-0.01,seg,x,y0+(h-0.01)/2+0.005,z,G,kl.lack);
    S.geo(new THREE.SphereGeometry(r,seg,Math.max(3,seg>>1),0,Math.PI*2,0,Math.PI/2),tm(x,y0+h,z),G,kl.lack);
    S.zyl(r+0.002,r+0.002,0.07,seg,x,y0+h-0.13,z,F('cremeweiss'),kl.matt);
    return {x0:x-0.12,x1:x+0.12,z0:z-0.12,z1:z+0.12,art:'poller'};
  }
  const h=o.hoehe||0.95, b=o.breite||0.2;
  S.box(b,h,b,x,y0+h/2,z,F('signalgelb'),'kunststoff');
  S.box(b+0.02,0.14,b+0.02,x,y0+h-0.09,z,F('gummischwarz'),'matt');
  return {x0:x-0.15,x1:x+0.15,z0:z-0.15,z1:z+0.15,art:'poller'};
};
/* Anfahrschutz-Buegel aus Vierkantrohr (Signalgelb lackiert) von a nach b in einen Sammler:
   Pfosten hoechstens alle o.pfosten m (Standard 2,5) mit Fussplatte, oben ein durchgehender Holm.
   o = {von:[x,z], bis:[x,z], hoehe:0,5, rohr:0,09, pfosten:2,5}. Rueckgabe = Kollisionsrechteck lokal. */
bk.anfahrschutz=function(S,o){
  o=o||{}; const [ax,az]=o.von, [bx,bz]=o.bis, h=o.hoehe||0.5, r=o.rohr||0.09, F=MAT.farbe, GELB=F('signalgelb');
  const dx=bx-ax, dz=bz-az, L=Math.hypot(dx,dz), ry=Math.atan2(dx,dz), n=Math.max(1,Math.round(L/(o.pfosten||2.5)));
  for(let i=0;i<=n;i++){ const x=ax+dx*i/n, z=az+dz*i/n; S.box(r,h,r,x,h/2,z,GELB,'lackMetall',0,ry,0); bk.fuss(S,x,z,0.2); }
  S.box(r,r,L+r*1.1,(ax+bx)/2,h,(az+bz)/2,GELB,'lackMetall',0,ry,0);
  return {x0:Math.min(ax,bx)-r,x1:Math.max(ax,bx)+r,z0:Math.min(az,bz)-r,z1:Math.max(az,bz)+r,art:'anfahrschutz'};
};
/* Zaun/Absperrung von o.von nach o.bis (Koordinaten im parent).
   art 'doppelstab' (Standard aussen: Grundstueck, Hof, Testfeld) - Doppelstabmatte (Textur), Pfosten
       basaltgrau alle 2,5 m mit Kappe und zwei Schellen, helle Sockelschiene; Vorbild Testfeldzaun 05e.
   art 'gitter' (innen: Ladezone, Palettierplatz) - gelbes Schweissgitter (Tom 09.10. "im Stil der
       Gitterbox"), Pfosten hoechstens alle 1,2 m mit Fussplatte, Ober- und Unterholm.
   art 'gelaender' (innen, niedrig: wo darueber gearbeitet wird) - wie 'gitter', Mittelholm statt Gitter.
   o = {art, von:[x,z], bis:[x,z], hoehe, pfosten (Abstand), luecke:[[s0,s1],...] (m ab von: Tor/Einfahrt),
        S (fremder Sammler mit box(); dann landet nur das Gitter als eigenes Mesh in parent), parent, schatten}
   -> {art, meshes, gitter:[Mesh], pfosten:[[x,z]], kollision:[{x0,x1,z0,z1}], laenge} */
const ZAUN_ART={doppelstab:{hoehe:2.0,pfosten:2.5},gitter:{hoehe:2.0,pfosten:1.2},gelaender:{hoehe:1.1,pfosten:1.2}};
bk.zaun=function(o){
  o=Object.assign({art:'doppelstab'},o||{}); const A=ZAUN_ART[o.art]; if(!A) throw new Error('bk.zaun: Art unbekannt: '+o.art);
  const parent=o.parent||scene, h=o.hoehe||A.hoehe, abst=o.pfosten||A.pfosten, F=MAT.farbe;
  const [ax,az]=o.von, [bx,bz]=o.bis, dx=bx-ax, dz=bz-az, L=Math.hypot(dx,dz), ux=dx/L, uz=dz/L, ry=Math.atan2(dx,dz);
  /* Abschnitte zwischen den Luecken */
  let teile=[[0,L]];
  for(const [s0,s1] of (o.luecke||[])){ const neu=[]; for(const [a,b] of teile){ if(s1<=a||s0>=b){ neu.push([a,b]); continue; } if(s0>a) neu.push([a,s0]); if(s1<b) neu.push([s1,b]); } teile=neu; }
  const eigen=!o.S;
  const S=o.S||bk.sammler({form:{fase:0.01,faseMin:0.06,seg:1,lod0Kasten:true},bauteil:'zaun',
    mats:{zaunGitter:MAT.get('zaunGitter'),gitterGelb:MAT.get('gitterGelb')}});
  const T={art:o.art,meshes:[],gitter:[],pfosten:[],kollision:[],laenge:L};
  const P=s=>[ax+ux*s,az+uz*s];
  const flaeche=(geo,s0,s1,y,mat,kl)=>{ const [x,z]=P((s0+s1)/2);
    if(eigen){ S.geo(geo,tm(x,y,z,0,ry+Math.PI/2,0),0xffffff,kl); return; }
    const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.rotation.y=ry+Math.PI/2;
    m.userData.bauteil='zaun'; m.userData.bauteilArt=o.art; parent.add(m); T.gitter.push(m); };
  for(const [s0,s1] of teile){ const len=s1-s0; if(len<0.05) continue;
    const [mx,mz]=P((s0+s1)/2);
    if(o.art==='doppelstab'){
      S.box(0.12,0.16,len,mx,0.08,mz,F('hellgrau'),'matt',0,ry,0);
      flaeche(MAT.kachel(new THREE.PlaneGeometry(len,h-0.16),len,h-0.16),s0,s1,0.16+(h-0.16)/2,MAT.get('zaunGitter'),'zaunGitter');
      const n=Math.max(1,Math.round(len/abst));
      for(let i=0;i<=n;i++){ const [x,z]=P(s0+len*i/n); T.pfosten.push([x,z]);
        S.box(0.07,h+0.06,0.07,x,(h+0.06)/2,z,F('basaltgrau'),'stahl',0,ry,0);
        S.box(0.1,0.025,0.1,x,h+0.072,z,F('graphit'),'stahl',0,ry,0);
        for(const y of [0.42,h-0.3]) S.box(0.1,0.05,0.05,x,y,z,F('graphit'),'stahl',0,ry,0); }
    } else {
      const GELB=F('signalgelb'), n=Math.max(1,Math.ceil(len/abst));
      for(let i=0;i<=n;i++){ const [x,z]=P(s0+len*i/n); T.pfosten.push([x,z]); S.box(0.05,h,0.05,x,h/2,z,GELB,'lackMetall'); bk.fuss(S,x,z); }
      for(const y of (o.art==='gelaender'?[h-0.02,h*0.55,0.12]:[h-0.02,0.12])) S.box(0.04,0.04,len,mx,y,mz,GELB,'lackMetall',0,ry,0);
      if(o.art==='gitter') flaeche(MAT.kachel(new THREE.PlaneGeometry(len,h-0.2),len/0.2,(h-0.2)/0.2),s0,s1,h/2+0.02,MAT.get('gitterGelb'),'gitterGelb');
    }
    const [qa,qb]=[P(s0),P(s1)];
    T.kollision.push({x0:Math.min(qa[0],qb[0])-0.1,x1:Math.max(qa[0],qb[0])+0.1,z0:Math.min(qa[1],qb[1])-0.1,z1:Math.max(qa[1],qb[1])+0.1,art:'zaun'});
  }
  if(eigen){
    T.meshes=S.fertig(parent,{bauteil:'zaun',fest:true,schatten:o.schatten===undefined?false:o.schatten,
      nachher:me=>{ me.userData.bauteilArt=o.art; if(me.userData.klasse==='stahl'||me.userData.klasse==='lackMetall') me.userData.zaunPfosten=T.pfosten; }});
  }
  return T;
};
/* Absperrband (rot-weiss mit Aufdruck) zwischen Pfosten: Bereich ist zu sehen, aber noch zu.
   o = {punkte:[[x,z],...] (Pfosten in Reihe), baender:[y,...], text, zone (zWand: faellt beim Kauf),
        parent, frei:true (Fussplatte; false = Pfosten in einer Laibung), hoehe (Pfosten, Standard
        26 cm ueber dem obersten Band)}. Pfosten graphit mit schwarzer Kappe und Bandklemmen; alle
   Baender EIN Mesh (userData.sperrband), Material je Aufdruck einmal (bk.bandMat).
   -> {meshes:[...], band:Mesh} */
const _bkBandT=new Map(), _bkBandM=new Map();
bk.bandTex=function(text,n){
  const wdh=n||2, k=text+'|'+wdh; let t=_bkBandT.get(k);
  if(!t){ t=tex(1024,64,(g,W,H)=>{
      g.fillStyle='#cf1f16'; g.fillRect(0,0,W,H);
      /* dunkle Webkante oben und unten, wie bei echtem Band */
      g.fillStyle='rgba(0,0,0,.24)'; g.fillRect(0,0,W,5); g.fillRect(0,H-5,W,5);
      g.fillStyle='rgba(255,255,255,.10)'; g.fillRect(0,7,W,4);
      g.fillStyle='#f7f8fc'; g.font=BUN(31); g.textAlign='center'; g.textBaseline='middle';
      for(let i=0;i<wdh;i++) g.fillText(text,W/(wdh*2)+i*W/wdh,H/2+2); });
    t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping; t.anisotropy=8; _bkBandT.set(k,t); }
  return t;
};
bk.bandMat=function(text){ let m=_bkBandM.get(text);
  if(!m){ m=MAT.eigen(0xffffff,'kunststoff',{map:bk.bandTex(text),side:THREE.DoubleSide}); m.userData.mat='sperrband'; _bkBandM.set(text,m); } return m; };
bk.absperrung=function(o){
  o=Object.assign({baender:[0.5,1.0,1.5],frei:true},o||{});
  const parent=o.parent||scene, by=o.baender, h=o.hoehe||Math.max(...by)+0.26, F=MAT.farbe, durch=0.05;
  const S=bk.sammler({form:{fase:0.008,faseMin:0.06,seg:1,lod0Kasten:true},bauteil:'absperrung'});
  const HALT=F('graphit'), KOPF=F('gummischwarz');
  for(const [x,z] of o.punkte){
    S.box(0.055,h,0.055,x,h/2,z,HALT,'stahl');
    S.box(0.09,0.055,0.09,x,h+0.022,z,KOPF,'lackMetall');
    for(const y of by) S.box(0.075,0.035,0.035,x,y,z,KOPF,'lackMetall');
    if(o.frei) S.box(0.2,0.03,0.2,x,0.015,z,KOPF,'lackMetall'); }
  /* Baender: haengen in der Mitte durch (eine gerade Leiste saehe aus wie ein roter Strich) */
  const teile=[];
  for(let i=0;i+1<o.punkte.length;i++){ const [ax,az]=o.punkte[i], [bx,bz]=o.punkte[i+1], dx=bx-ax, dz=bz-az, LL=Math.hypot(dx,dz), L=LL-0.04;
    if(L<0.05) continue;
    for(const y of by){ const geo=new THREE.PlaneGeometry(L,0.09,16,1), pos=geo.attributes&&geo.attributes.position, arr=pos&&pos.array;
      /* direkt im Array rechnen: getX/setY gibt es im Testdoppel nicht */
      if(arr&&pos.count){ for(let k=0;k<pos.count;k++){ const t=(arr[k*3]+L/2)/L; arr[k*3+1]-=durch*Math.sin(Math.PI*t); } pos.needsUpdate=true; if(geo.computeVertexNormals) geo.computeVertexNormals(); }
      teile.push({geo,m:tm((ax+bx)/2,y,(az+bz)/2,0,-Math.atan2(dz,dx),0),color:0xffffff}); } }
  const T={meshes:S.fertig(parent,{bauteil:'absperrung',fest:true,schatten:false}),band:null};
  if(teile.length){ const m=new THREE.Mesh(merge(teile),bk.bandMat(o.text||'GESPERRT')); m.userData.sperrband=true; m.userData.bauteil='absperrung';
    parent.add(m); T.band=m; T.meshes.push(m); }
  if(o.zone) for(const m of T.meshes) zWand(o.zone,m);
  return T;
};
bk.tor=function(o){
  o=Object.assign({art:'sektional',breite:3.26,hoehe:3.0,seite:'beide',fenster:true,fuehrung:'vertikal',R:0.42,decke:null,
    ampel:'beide',bedien:1,vordach:true,dichtung:true,fahrzeug:3.0,poller:true,nr:null,wand:[-0.1,0.1],blatt:0,beweglich:true,offen:0,
    bewegung:'schiebe',boden:0.3,pfosten:false,schloss:false,x:0,y:0,z:0,ry:0},o||{});
  const parent=o.parent||scene, W=o.breite, H=o.hoehe, w2=W/2, L=bk.lod(), F=MAT.farbe;
  const seg=[6,10,14][L], roll=o.art==='roll', gitter=o.art==='gitter';
  const aussen=o.seite!=='innen', innen=o.seite!=='aussen';
  const amp=o.ampel===true?'beide':o.ampel, ampA=aussen&&(amp==='beide'||amp==='aussen'), ampI=innen&&(amp==='beide'||amp==='innen');
  const xa=o.wand[0], xi=o.wand[1], xb=o.blatt, bs=o.bedien>=0?1:-1, ad=-bs;
  const STAHL=F('silbergrau'), ANTH=F('anthrazit'), GRAPH=F('graphit'), BASALT=F('basaltgrau'), GELB=F('signalgelb'),
        GUMMI=F('gummischwarz'), WEISS=F('weiss'), MITTEL=F('mittelgrau');
  const g=new THREE.Group(); g.position.set(o.x,o.y,o.z); g.rotation.y=o.ry;
  g.userData.bauteil='tor'; g.userData.bauteilArt=o.art; parent.add(g);
  const MB=MAT.get('torBlatt');
  const S=bk.sammler({form:{fase:0.012,faseMin:0.06,seg:1,lod0Kasten:true},klasse:'stahl',bauteil:'tor',
    mats:{blatt:MB,warn:MAT.get('warnschraffur')}});
  const T={g,art:o.art,o,panele:[],blatt:null,zu:0,auf:0,t:0,ampel:null,warn:null,kollision:[],statisch:[]};
  const lokal=[];                                   /* Kollision lokal -> am Ende in Welt */
  const zylGeo0=(r1,r2,h,x,y,z,sg)=>({geo:new THREE.CylinderGeometry(r1,r2,h,sg),m:tm(x,y,z),color:0xffffff});
  const weiss=geo=>bk.uvZeile(geo,3);

  if(gitter){
    /* Zauntor: Rahmen + senkrechte Staebe (verzinkt), Schiebetor einteilig, Fluegeltor zweiteilig mit Schloss */
    const n=o.bewegung==='fluegel'?2:1, fb=(W-(o.pfosten?0.24:0))/n, y0=o.boden, y1=H, mh=y1-y0;
    for(let k=0;k<n;k++){ const zc=n===1?0:(k===0?-1:1)*fb/2;
      for(const y of [y0+0.05,y1-0.05]) S.box(0.1,0.1,fb-0.02,0,y,zc,STAHL);
      for(const s of [-1,1]) S.box(0.1,mh,0.1,0,y0+mh/2,zc+s*(fb/2-0.06),STAHL);
      const nb=Math.max(2,Math.round((fb-0.12)/0.31)); for(let i=1;i<nb;i++) S.box(0.06,mh-0.1,0.06,0,y0+mh/2,zc-fb/2+0.06+i*(fb-0.12)/nb,STAHL); }
    if(o.pfosten) for(const s of [-1,1]) S.box(0.12,H+0.3,0.12,0,(H+0.3)/2,s*(w2-0.06),STAHL);
    if(o.schloss) S.box(0.14,0.3,0.24,0.1,1.15,0,GELB,'kunststoff');
    T.statisch=S.fertig(g,{bauteil:'tor',fest:true});
    T.set=t=>{ T.t=t; };
    for(const me of T.statisch) me.userData.bauteilArt=o.art;
    return T;
  }

  if(o.art==='schnelllauf'){
    /* PVC-Schnelllauftor (innen: N1 Kartonlager, Halle Etappe B 15.10.): Seitenzargen Anthrazit mit Fuehrungsprofil verzinkt,
       Wickelwelle im Kasten oben, Antrieb seitlich, Behang PVC Signalgelb (schnell bewegtes Teil = Warnfarbe) mit klarem
       Sichtfenster 1,2-1,8 m, Unterkante Gummiabschluss. T.set(t): Behang rollt auf (Logik 11f). */
    const Sx=bk.sammler({form:{fase:0.01,faseMin:0.05,seg:1,lod0Kasten:true},klasse:'lackMetall',bauteil:'tor'});
    for(const s2 of [-1,1]){ const z=s2*(w2+0.07);
      Sx.box(0.16,H+0.12,0.14,xb,(H+0.12)/2,z,ANTH,'lackMetall'); Sx.box(0.05,H,0.03,xb,H/2,z-s2*0.075,STAHL,'stahl');
      Sx.box(0.22,0.02,0.2,xb,0.01,z,ANTH,'stahl'); }
    Sx.box(0.36,0.4,W+0.44,xb,H+0.32,0,ANTH,'lackMetall'); Sx.box(0.37,0.03,W+0.45,xb,H+0.1,0,GRAPH,'lackMetall');
    Sx.box(0.26,0.3,0.3,xb+0.06,H+0.32,ad*(w2+0.4),GRAPH,'lackMetall'); Sx.zyl(0.09,0.09,0.16,seg,xb+0.06,H+0.32,ad*(w2+0.62),GUMMI,'kunststoff',Math.PI/2,0,0);
    for(const xs of [-1,1]) if(xs>0?innen:aussen){ Sx.box(0.08,0.26,0.16,xb+xs*0.14,1.4,bs*(w2+0.3),GELB,'kunststoff');
      [F('signalgruen'),F('signalrot')].forEach((c2,k)=>Sx.box(0.03,0.05,0.05,xb+xs*0.19,1.45-k*0.08,bs*(w2+0.3),c2,'kunststoff')); }
    const lw=[zylGeo0(0.06,0.075,0.1,xb,H+0.58,ad*(w2+0.2),seg)];
    T.statisch=Sx.fertig(g,{bauteil:'tor',fest:true});
    const beh=new THREE.Group(); beh.position.set(xb,H+0.1,0); g.add(beh);
    const Sb=bk.sammler({bauteil:'tor',mats:{pvc:MAT.get('pvcBehang'),scheibe:MAT.get('glasScheibe')}});
    const top=H+0.1, f0=top-1.8, f1=top-1.2, BW=W+0.06;
    Sb.box(0.012,f0,BW,0,-f0/2,0,0xffffff,'pvc');
    Sb.box(0.008,f1-f0,BW-0.3,0,-(f0+f1)/2,0,F('glasKlar'),'scheibe');
    for(const s2 of [-1,1]) Sb.box(0.012,f1-f0,0.15,0,-(f0+f1)/2,s2*(BW/2-0.075),0xffffff,'pvc');
    Sb.box(0.012,top-f1-0.08,BW,0,-(f1+top-0.08)/2,0,0xffffff,'pvc');
    Sb.box(0.05,0.08,BW,0,-top+0.04,0,GUMMI,'kunststoff');
    for(const y of [0.6,1.0]) Sb.box(0.02,0.03,BW-0.02,0,-(top-y),0,ANTH,'kunststoff');
    const bm=Sb.fertig(beh,{bauteil:'tor',schatten:false}); bm.forEach(m=>{ m.userData.bauteilArt='schnelllauf'; });
    T.panele=[beh]; T.blatt=beh;
    const wm=MAT.neu('torWarn'); const wme=new THREE.Mesh(merge(lw),wm); wme.userData.bauteil='tor'; wme.userData.klasse='leuchte'; g.add(wme); T.warn=wm;
    T.set=t=>{ t=Math.max(0,Math.min(1,t)); T.t=t; beh.scale.y=Math.max(0.03,1-t); beh.visible=t<0.97; };
    T.set(o.offen);
    g.traverse(me=>{ if(me.isMesh&&!me.userData.bauteilArt) me.userData.bauteilArt=o.art; });
    return T;
  }
  /* ---------- Aussenseite wie am alten R1: Zarge verzinkt, Torabdichtung, Puffer, Vordach mit Schnee, Poller ----------
     Masse vom alten R1 (05g bis V129), gemessen ab der Aussenwand xa und der Torkante w2. */
  if(aussen){
    /* Zarge durch die Wand (innen 3 cm sichtbar als heller Rahmen) */
    const z0=xa-0.03, z1=innen?Math.max(xi+0.03,z0+0.12):xa+0.1, zd=z1-z0, zx=(z0+z1)/2;
    for(const s of [-1,1]) S.box(zd,H+0.2,0.16,zx,(H+0.2)/2,s*(w2+0.15),STAHL);
    S.box(zd,0.22,W+0.64,zx,H+0.12,0,STAHL);
    if(o.dichtung){
      /* Polster bis an das andockende Fahrzeug (o.fahrzeug/2 + 8 cm Ueberdeckung), hoechstens bis 4 cm in die
         Oeffnung: R1 (Koffer 3,0 m) 0,26 m wie frueher, R2-R5 (Auflieger 2,55 m) breiter - sonst sieht man am Heck vorbei */
      const ri=Math.min(w2-0.04,o.fahrzeug/2+0.08), ra=w2+0.22, pw=ra-ri, pc=(ri+ra)/2;
      /* 30 cm vor der Wand (R1 reichte 10 cm in die Wand - bei Toren mit Blatt in der Wandebene, R2-R5, schnitt das ins Blatt) */
      for(const s of [-1,1]){ S.box(0.3,H+0.1,pw,xa-0.15,(H+0.1)/2,s*pc,GUMMI,'matt');
        S.box(0.24,0.5,0.3,xa-0.16,0.55,s*(ri-0.04),GUMMI,'matt'); }
      S.box(0.3,0.26,W+0.64,xa-0.15,H+0.12,0,GUMMI,'matt');
    }
    if(o.vordach){
      const vx=xa-0.83, vy=H+0.32;
      S.box(1.9,0.1,W+1.14,vx,vy,0,GRAPH,'stahl',0,0,0.08);
      S.box(1.95,0.09,W+1.19,vx,vy+0.1,0,WEISS,'matt',0,0,0.08);
      for(const s of [-1,1]) bk.stab(S,xa,H-0.45,xa-1.43,H+0.2,s*(w2+0.27),0.07,STAHL,'stahl');
    }
    if(o.poller) for(const s of [-1,1]) lokal.push(bk.poller(S,xa-0.48,s*(w2+0.37)));
  }
  /* ---------- Innenseite: Fuehrung, Antrieb, Warnleuchte ---------- */
  const lampen={rot:[],gruen:[],warn:[]};
  const zylGeo=(r1,r2,h,x,y,z,rx,ry,rz)=>({geo:new THREE.CylinderGeometry(r1,r2,h,seg),m:tm(x,y,z,rx,ry,rz),color:0xffffff});
  if(roll){
    /* Rolltor: C-Profil-Schienen innen und aussen in der Wandoeffnung, Wickelkasten, Antrieb seitlich */
    for(const s of [-1,1]){ const z=s*(w2+0.04);
      for(const xx of [xb-0.12,xb+0.12]){ const drin=xx>xb; if(drin?!innen:!aussen) continue;
        S.box(0.1,H+0.66,0.14,xx,(H+0.66)/2,z,STAHL);
        S.box(0.05,H+0.6,0.04,xx+(drin?0.05:-0.05),(H+0.6)/2,z-s*0.05,ANTH,'lackMetall');
        for(let y=0.4;y<H;y+=0.75) S.box(0.04,0.04,0.06,xx+(drin?0.06:-0.06),y,z+s*0.05,BASALT);
      } }
    for(const xx of [xb-0.2,xb+0.2]) if(xx>xb?innen:aussen) S.box(0.24,0.68,W+0.42,xx,H+0.34,0,ANTH,'lackMetall');
    S.box(0.66,0.04,W+0.46,xb,H+0.69,0,BASALT);
    if(innen){ const z=ad*(w2+0.38);
      S.box(0.36,0.3,0.28,xb+0.26,H+0.32,z,GRAPH,'lackMetall');
      S.zyl(0.1,0.1,0.18,seg,xb+0.5,H+0.32,z,GUMMI,'kunststoff',0,0,Math.PI/2);
      S.box(0.08,0.2,0.12,xb+0.3,H+0.06,z,GELB,'kunststoff');
      lampen.warn.push(zylGeo(0.075,0.09,0.12,xb+0.3,H+0.62,z)); S.box(0.11,0.07,0.11,xb+0.3,H+0.71,z,ANTH,'lackMetall'); }
  } else if(innen){
    /* Sektionaltor: Schienen innen, Torwelle mit Federn und Seiltrommeln, Kettenantrieb */
    const SX=Math.max(xi,xb+0.04)+0.05, R=o.R, XW=SX+0.17, YW=H+0.3, normal=o.fuehrung==='normal';
    for(const s of [-1,1]){ const z=s*(w2+0.06);
      if(normal){
        S.box(0.07,H+0.05,0.07,SX,(H+0.05)/2,z,STAHL);
        for(let k=0;k<7;k++){ const a=k/6*Math.PI/2; S.box(0.06,0.14,0.06,SX+R-R*Math.cos(a),H+R*Math.sin(a),z,STAHL,null,0,0,a); }
        S.box(2.6,0.07,0.07,SX+R+1.35,H+R,z,STAHL);
        const oben=o.decke||H+R+0.4, lang=oben-(H+R);
        if(lang>0.06) for(const bx of [SX+R+0.5,SX+R+1.6,SX+R+2.5]){ S.box(0.05,lang,0.05,bx,H+R+lang/2,z,STAHL); S.box(0.22,0.05,0.12,bx,oben-0.02,z,STAHL); }
      } else {
        const lg=H*2+0.2; S.box(0.08,lg,0.08,SX,lg/2,z,STAHL);
        for(let k=0;k<4;k++) S.box(0.38,0.05,0.05,SX+0.18,0.7+k*(H*2)/4,z,STAHL);
      }
      S.zyl(0.11,0.085,0.1,seg,XW,YW,s*(w2-0.01),STAHL,'stahl',Math.PI/2);
      S.box(0.26,0.22,0.06,XW-0.02,YW,s*(w2+0.14),STAHL); }
    S.zyl(0.036,0.036,W+0.5,seg,XW,YW,0,STAHL,'stahl',Math.PI/2);
    if(L>0) for(const dz of [-0.78,0.78]) S.zyl(0.078,0.078,0.88,seg,XW,YW,dz,MITTEL,'blank',Math.PI/2);
    const z=ad*(w2+0.4);
    S.box(0.32,0.28,0.42,XW+0.22,YW,z,GRAPH,'lackMetall');
    S.box(0.17,0.17,0.21,XW+0.22,YW-0.24,z,F('signalorange'),'kunststoff');
    if(L>0) S.geo(new THREE.TorusGeometry(0.16,0.012,6,Math.round(seg*1.6)),tm(XW+0.26,H-0.18,z,0,0,0,1,3.8,1),ANTH,'stahl');
    lampen.warn.push(zylGeo(0.075,0.09,0.12,XW+0.22,YW+0.32,z)); S.box(0.11,0.07,0.11,XW+0.22,YW+0.41,z,ANTH,'lackMetall');
  }
  /* ---------- Ampel und Bedienkasten (Seite bs, quer), Nummernschild ---------- */
  const ampelBau=(innenSeite)=>{ /* wie am alten R1: kleines Gehaeuse, zwei Leuchten; innen der gelbe Bedienkasten */
    const f=innenSeite?1:-1, x0=innenSeite?xi:xa, z=bs*(w2+0.3);
    S.box(0.14,0.34,0.12,x0+f*0.07,1.9,z,ANTH,'stahl');
    lampen.rot.push(zylGeo(0.05,0.05,0.04,x0+f*0.15,2.0,z,0,0,Math.PI/2));
    lampen.gruen.push(zylGeo(0.05,0.05,0.04,x0+f*0.15,1.8,z,0,0,Math.PI/2));
    if(innenSeite){ /* Bedienkasten: auf, zu, stopp */
      S.box(0.12,0.24,0.16,x0+0.06,1.35,bs*(w2+0.32),GELB,'kunststoff');
      [F('signalgruen'),F('signalrot'),ANTH].forEach((c,k)=>S.box(0.04,0.05,0.05,x0+0.13,1.43-k*0.07,bs*(w2+0.32),c,'kunststoff')); }
  };
  if(o.ampel){ if(ampA) ampelBau(false); if(ampI) ampelBau(true); }
  if(o.nr!==null&&o.nr!==undefined){
    if(aussen) bk.schild(g,{text:String(o.nr),b:0.8,h:0.62,x:xa-0.03,y:H+1.0,z:0,ry:-Math.PI/2});
    if(innen) bk.schild(g,{text:String(o.nr),b:0.62,h:0.48,x:xi+0.02,y:H+0.95,z:0,ry:Math.PI/2});
  }
  /* ---------- Torblatt ---------- */
  /* Panele wie am alten R1: Sandwich 9,5 cm (Rolltor-Lamellen 6 cm), Lichtband im vorletzten Panel,
     unterstes Panel aussen mit Warnstreifen/Griffmulde und Bodengummi, Scharnierbaender aussen, Rollen innen */
  const n=o.panele||Math.max(2,Math.round(H/(roll?0.5:0.6))), ph=H/n, D=roll?0.06:0.095, PB=roll?W-0.06:W;
  const fz=o.fenster===false?-1:(typeof o.fenster==='number'?o.fenster:n-2);
  const panelTeile=(P,i,x,y)=>{ /* ein Panel samt Kleinteilen in den Sammler P, Mitte (x,y) */
    const geo=new THREE.BoxGeometry(D,ph-(roll?0.008:0.012),PB);
    if(i===0) bk.uvZeile(geo,2,0,0); else bk.uvZeile(geo,i===fz?1:0,i===fz?1:0,0);
    P.geo(geo,tm(x,y,0),0xffffff,'blatt');
    if(i===0) P.geo(weiss(new THREE.BoxGeometry(D+0.025,0.055,PB)),tm(x,y-ph/2+0.0275,0),GUMMI,'blatt');
    if(i===0&&aussen) P.geo(MAT.kachel(new THREE.BoxGeometry(0.012,0.12,PB-0.06),(PB-0.06)/0.4,0.12/0.4),tm(x-D/2-0.006,y-ph/2+0.1,0),0xffffff,'warn');
    if(!roll&&L>0){ for(const s of [-1,1]){ P.geo(weiss(new THREE.CylinderGeometry(0.03,0.03,0.05,8)),tm(x+D/2+0.03,y-ph/2+0.04,s*(w2-0.04),Math.PI/2),STAHL,'blatt');
        if(i>0) P.geo(weiss(new THREE.BoxGeometry(0.02,0.11,0.16)),tm(x-D/2-0.01,y-ph/2+0.03,s*0.55),STAHL,'blatt'); } }
  };
  const blattSammler=()=>bk.sammler({klasse:'blatt',bauteil:'tor',mats:{blatt:MB,warn:MAT.get('warnschraffur')}});
  const sch=k=>HIQ;
  /* bewegtes Blatt: erstes Mesh (Klasse blatt) traegt die uebrigen (Warnstreifen) als Kinder - sie fahren mit */
  const blattMesh=P=>{ const ms=P.fertig(g,{schatten:sch}); for(let k=1;k<ms.length;k++){ g.remove(ms[k]); ms[0].add(ms[k]); } return ms[0]; };
  if(!o.beweglich){
    for(let i=0;i<n;i++) panelTeile(S,i,xb,ph/2+i*ph);
  } else if(!roll&&o.fuehrung!=='normal'){
    /* senkrecht fahrendes Blatt: EIN Mesh, Mitte auf halber Hoehe (WTORE.blatt, zu/auf wie vorher) */
    const P=blattSammler(); for(let i=0;i<n;i++) panelTeile(P,i,0,-H/2+ph/2+i*ph);
    T.blatt=blattMesh(P); T.blatt.position.set(xb,H/2,0);
    T.zu=H/2; T.auf=H/2+H-0.06; T.panele=[T.blatt];
  } else {
    /* Rolltor und Sektionaltor mit Bogen: ein Mesh je Panel (jedes faehrt eigen) */
    for(let i=0;i<n;i++){ const P=blattSammler(); panelTeile(P,i,0,0); const me=blattMesh(P); me.userData.panel=i; T.panele.push(me); }
  }
  /* ---------- Leuchten: je Zustand EIN Mesh (alle Lampen dieses Tors), Material veraenderlich (MAT.neu) ---------- */
  const leuchte=(liste,name)=>{ if(!liste.length) return null; const m=MAT.neu(name); const me=new THREE.Mesh(merge(liste),m);
    me.userData.bauteil='tor'; me.userData.bauteilArt=o.art; me.userData.klasse='leuchte'; g.add(me); return m; };
  if(lampen.rot.length) T.ampel={rot:leuchte(lampen.rot,'ampelRot'),gruen:leuchte(lampen.gruen,'ampelGruen')};
  T.warn=leuchte(lampen.warn,'torWarn');
  T.statisch=S.fertig(g,{bauteil:'tor',fest:true});
  g.traverse(me=>{ if(me.isMesh&&!me.userData.bauteilArt) me.userData.bauteilArt=o.art; });
  /* ---------- Bewegung ---------- */
  const R=o.R, bogen=R*Math.PI/2;
  const pose=s=>{ if(s<=H) return [0,s,0]; if(s<=H+bogen){ const a=(s-H)/R; return [R-R*Math.cos(a),H+R*Math.sin(a),a]; } return [R+(s-H-bogen),H+R,Math.PI/2]; };
  T.set=function(t){
    t=Math.max(0,Math.min(1,t)); T.t=t;
    if(!o.beweglich) return;
    if(roll){ T.panele.forEach((pn,i)=>{ const zu=(i+0.5)*ph, y=zu+t*(H+0.12); pn.position.set(xb,Math.min(y,H+0.31),0); pn.visible=y<H+0.62; }); }
    else if(o.fuehrung==='normal'){ const s0=t*H; T.panele.forEach((pn,i)=>{ const p=pose(s0+i*ph+ph/2); pn.position.set(xb+p[0],p[1],0); pn.rotation.z=p[2]; }); }
    else T.blatt.position.y=T.zu+(T.auf-T.zu)*t;
  };
  T.set(o.offen);
  /* Kollision in Weltkoordinaten (Gruppe ist nur um y gedreht) */
  const c=Math.cos(o.ry), sn=Math.sin(o.ry), welt=(x,z)=>[o.x+x*c+z*sn,o.z-x*sn+z*c];
  if(o.parent&&o.parent!==scene){ o.parent.updateMatrixWorld(true); }
  for(const r of lokal){ const a=welt(r.x0,r.z0), b=welt(r.x1,r.z1);
    T.kollision.push({x0:Math.min(a[0],b[0]),x1:Math.max(a[0],b[0]),z0:Math.min(a[1],b[1]),z1:Math.max(a[1],b[1]),art:r.art}); }
  return T;
};

/* =========================================================
   Instanzen, Palette, Karton (Fundament Etappe 2, Schritt "Paletten + Kartons", 14.10.)

   Vorher zwei Paletten im Hauptspiel (palettenStapel 05h: 1,2 x 1,05 m, Holz #8e7550,
   eigenes Material r 0,94; vsHolzGeo 11e: Europalette 1,2 x 0,8 m mit Fasen, vcMat r 0,45)
   und eine dritte im Halle-Branch (hvPalGeo). Jetzt EINE Europalette: Mass und Aufbau von
   V1 (9 Kloetze, 3 Bodenbretter, 3 Querbretter, 5 Deckbretter, EPAL 1200 x 800 x 144),
   Holz holzPalette/holzPaletteDunkel, Oberflaeche stumpf (= Klasse matt 0,9).
   Doku: docs/fundament/kartons.md
   ========================================================= */
/* Instanzen einer Geometrie mit eigener Huellkugel (three r128 prueft Instanzen sonst gegen die
   Kugel EINER Instanz - Vorbild hvInst, Halle). geo bleibt geteilt (Attribute werden nur verwiesen).
   bk.inst(geo, mat, [Matrix4], {parent, schatten, bauteil, art, farben:[THREE.Color]}) -> InstancedMesh (farben = Instanzfarbe, multipliziert) */
bk.inst=function(geo,mat,matrizen,o){
  o=o||{}; if(!matrizen.length) return null;
  const g2=new THREE.BufferGeometry(); if(geo.index) g2.setIndex(geo.index);
  for(const k in geo.attributes) g2.setAttribute(k,geo.attributes[k]);
  for(const gr of geo.groups) g2.addGroup(gr.start,gr.count,gr.materialIndex);
  if(!geo.boundingSphere) geo.computeBoundingSphere();
  const box=new THREE.Box3(), p=new THREE.Vector3(), r0=geo.boundingSphere.radius, c0=geo.boundingSphere.center;
  const im=new THREE.InstancedMesh(g2,mat,matrizen.length);
  matrizen.forEach((m,i)=>{ im.setMatrixAt(i,m); p.copy(c0).applyMatrix4(m); box.expandByPoint(p); });
  const s=new THREE.Sphere(); box.getBoundingSphere(s); s.radius+=r0; g2.boundingSphere=s;
  im.instanceMatrix.needsUpdate=true; im.frustumCulled=true;
  if(o.farben){ o.farben.forEach((c,i)=>im.setColorAt(i,c)); im.instanceColor.needsUpdate=true; }
  if(HIQ&&o.schatten!==false){ im.castShadow=true; im.receiveShadow=true; }
  im.userData.bauteil=o.bauteil||'instanzen'; if(o.art) im.userData.bauteilArt=o.art;
  (o.parent||scene).add(im); return im;
};
/* Ladungstraeger: Mass je Art (l laengs x, b quer z, h Hoehe; Ursprung Mitte unten).
   EPAL-Europalette nach Datenblatt (epal-pallets.org, Technische Zeichnung 3p4.eu): 1200 x 800 x 144 mm,
   11 Bretter 22 mm = 5 Deckbretter (aussen/Mitte 145, dazwischen 100 breit), 3 Querbretter 800 x 145,
   3 Bodenbretter (aussen 100, Mitte 145 breit); 9 Kloetze 78 mm hoch (145 x 100 aussen, 145 x 145 Mitte);
   Deckbretter an den 4 Ecken 17 mm x 45 Grad gekappt; Bodenbretter an der Oberkante der Enden gefast. Lagen z (Mitte) und breit b. */
bk.PALETTE={euro:{l:1.2,b:0.8,h:0.144,name:'Europalette EPAL 1200 x 800 x 144 mm',d:0.022,k:0.078,kappe:0.017,fase:0.014,
  deck:[[-0.3275,0.145],[-0.16375,0.1],[0,0.145],[0.16375,0.1],[0.3275,0.145]],
  boden:[[-0.35,0.1],[0,0.145],[0.35,0.1]],
  quer:[[-0.5275,0.145],[0,0.145],[0.5275,0.145]]}};
const _bkPalGeo=new Map();
/* UV eines Kastens auf Fenster [u0,v0,u1,v1] des Atlas palettenMarke legen; marken {flaeche:fenster} (0 +x 1 -x 2 +y 3 -y 4 +z 5 -z) */
function palUV(geo,fenster,marken){ const uv=geo.attributes.uv;
  for(let f=0;f<6;f++){ const r=(marken&&marken[f])||fenster; for(let i=0;i<4;i++){ const k=f*4+i; uv.setXY(k,r[0]+uv.getX(k)*(r[2]-r[0]),r[1]+uv.getY(k)*(r[3]-r[1])); } }
  return geo; }
/* Prisma: Polygon pts [[x,y]] im Profil, entlang z um t extrudiert (mittig). Flache Normalen, UV ueber die Umrissbox auf Fenster F. */
function palPrisma(pts,t,F){
  let fl=0; for(let i=0;i<pts.length;i++){ const p=pts[i], q=pts[(i+1)%pts.length]; fl+=p[0]*q[1]-q[0]*p[1]; }
  if(fl<0) pts=pts.slice().reverse();
  const n=pts.length, h=t/2, P=[], N=[], U=[]; let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(const p of pts){ x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); y0=Math.min(y0,p[1]); y1=Math.max(y1,p[1]); }
  const v=(p,zz,nx,ny,nz)=>{ P.push(p[0],p[1],zz); N.push(nx,ny,nz); U.push(F[0]+(p[0]-x0)/(x1-x0)*(F[2]-F[0]),F[1]+(p[1]-y0)/(y1-y0)*(F[3]-F[1])); };
  for(let i=1;i<n-1;i++){ v(pts[0],h,0,0,1); v(pts[i],h,0,0,1); v(pts[i+1],h,0,0,1); v(pts[0],-h,0,0,-1); v(pts[i+1],-h,0,0,-1); v(pts[i],-h,0,0,-1); }
  for(let i=0;i<n;i++){ const p=pts[i], q=pts[(i+1)%n], ex=q[0]-p[0], ey=q[1]-p[1], l=Math.hypot(ex,ey), nx=ey/l, ny=-ex/l;
    v(p,-h,nx,ny,0); v(q,-h,nx,ny,0); v(q,h,nx,ny,0); v(p,-h,nx,ny,0); v(q,h,nx,ny,0); v(p,h,nx,ny,0); }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
  return g; }
/* Alterung einer Palette: Instanzfarbe von frisch (1) bis vergraut (0,74), dazu leichte Helligkeit; stabil je Ort/Nummer (kein Zufall) */
bk.palFarbe=function(x,y,z,id){
  const f=q=>{ const w=Math.sin(q)*43758.5453; return w-Math.floor(w); };
  const s=(id||0)*7.31+x*12.9898+y*78.233+z*37.719, alt=Math.pow(f(s),1.4), hell=0.94+0.1*f(s*1.7+3);
  return new THREE.Color((1-0.26*alt)*hell,(1-0.25*alt)*hell,(1-0.22*alt)*hell);
};
/* bk.palette(art, {fein}) -> geteilte Geometrie (Vertexfarben + UV auf den Atlas palettenMarke, Material MAT.get('palette')).
   fein (Standard ab Niedrig): gekappte Deckbrett-Ecken und gefaste Bodenbretter; fein:false = einfache Kaesten
   (Hofstapel, Ultra Low). Brand (EPAL im Oval an den Eck-, IPPC/HT am Mittelklotz der Laengsseiten) und Maserung
   kommen in beiden Fassungen aus der Textur. Je Art und Detail genau eine Geometrie. */
bk.palette=function(art,o){
  art=art||'euro'; const A=bk.PALETTE[art]; if(!A) throw new Error('bk.palette: Art unbekannt: '+art);
  const fein=!(o&&o.fein===false)&&bk.lod()>0, key=art+'|'+(fein?1:0);
  let geo=_bkPalGeo.get(key); if(geo) return geo;
  const HOLZ=MAT.farbe('holzPalette'), HOLZ2=MAT.farbe('holzPaletteDunkel'), U=MAT.PALETTE_UV, d=A.d, kh=A.k, H=A.h, hl=A.l/2, N=U.N;
  const S=bk.sammler({klasse:'stumpf',bauteil:'palette'});
  let nb=0;
  /* Maserungsfenster: ganze Brettlaenge, ein Streifen je Brett (verschiedene Lage), Breite ~ Brettbreite */
  const maser=b=>{ const px=Math.round(b*190), y0=U.maserY0+((nb++*47)%(U.maserY1-U.maserY0-px)), y1=y0+px; return [U.maser[0],1-(y1-1)/N,U.maser[2],1-(y0+1)/N]; };
  const klotzFenster=()=>{ const f=maser(0.05); return [0.42,f[1],0.46,f[3]]; };
  const kasten=(w,h,dd,x,y,z,farbe,fenster,marken)=>{ S.geo(palUV(new THREE.BoxGeometry(w,h,dd),fenster,marken),tm(x,y,z),farbe); };
  /* 9 Kloetze: Brand auf den Laengsseiten der aeusseren Reihen (Ecken EPAL, Mitte IPPC/HT) */
  for(const [bx,bw] of A.quer) for(const [bz,bb] of A.boden){
    const marken=bz===0?null:(bz>0?{4:bx===0?U.ippc:U.epal}:{5:bx===0?U.ippc:U.epal});
    kasten(bw,kh,bb,bx,d+kh/2,bz,HOLZ2,klotzFenster(),marken); }
  /* 3 Querbretter (800 lang) */
  for(const [bx,bw] of A.quer) kasten(bw,d,A.b,bx,d+kh+d/2,0,HOLZ,maser(bw));
  /* 3 Bodenbretter: fein mit gefasten Enden (Profil x-y, Tiefe = Brettbreite) */
  for(const [bz,bb] of A.boden){
    if(fein){ const hy=d/2, c=A.fase; S.geo(palPrisma([[-hl,-hy],[hl,-hy],[hl,hy-c],[hl-c,hy],[-hl+c,hy],[-hl,hy-c]],bb,maser(bb)),tm(0,d/2,bz),HOLZ); }
    else kasten(A.l,d,bb,0,d/2,bz,HOLZ,maser(bb)); }
  /* 5 Deckbretter: fein die beiden aeusseren mit je zwei gekappten Aussenecken (17 mm x 45 Grad); Draufsicht (x,z) -> Profil (x,-z), flach gelegt */
  for(const [bz,bb] of A.deck){
    const aussen=Math.abs(bz)>0.3;
    if(fein&&aussen){ const s=bz>0?1:-1, hb=bb/2, c=A.kappe, zi=-s*hb, zo=s*hb;
      const plan=[[-hl,zi],[hl,zi],[hl,zo-s*c],[hl-c,zo],[-hl+c,zo],[-hl,zo-s*c]];
      S.geo(palPrisma(plan.map(p=>[p[0],-p[1]]),d,maser(bb)),tm(0,H-d/2,bz,-Math.PI/2,0,0),HOLZ); }
    else kasten(A.l,d,bb,0,H-d/2,bz,HOLZ,maser(bb)); }
  geo=S.geometrie(); geo.computeBoundingSphere(); geo.userData={bauteil:'palette',art,fein};
  _bkPalGeo.set(key,geo); return geo;
};
/* bk.paletten(liste, {gruppe, fein, schnee, parent, schatten}) -> {holz, schnee}: Paletten (je Instanz eigene Alterung, bk.palFarbe) als
   EIN InstancedMesh. liste = [{x,y,z,ry}] (y = Unterkante). schnee = [{x,y,z,ry}] Schneehauben
   (Instanzen, weissMatt). gruppe: Aufrufe mit demselben Namen landen in denselben Instanzen
   (Hofstapel an mehreren Stellen = ein Zeichenaufruf). */
const _bkPalGruppe=new Map();
bk.paletten=function(liste,o){
  o=o||{}; const A=bk.PALETTE[o.art||'euro'];
  let G=o.gruppe?_bkPalGruppe.get(o.gruppe):null;
  /* Instanzen relativ zur ersten Palette der Gruppe: das Mesh steht dort (Karte, Hofobjekte) */
  if(!G){ const e0=liste[0]||{x:0,z:0}; G={holz:[],farben:[],schnee:[],mHolz:null,mSchnee:null,ox:e0.x,oz:e0.z}; if(o.gruppe) _bkPalGruppe.set(o.gruppe,G); }
  const M=e=>tm(e.x-G.ox,e.y||0,e.z-G.oz,0,e.ry||0,0);
  for(const e of liste){ G.holz.push(M(e)); G.farben.push(bk.palFarbe(e.x,e.y||0,e.z,e.id)); } for(const e of (o.schnee||[])) G.schnee.push(M(e));
  const par=o.parent||scene;
  if(G.mHolz) G.mHolz.parent&&G.mHolz.parent.remove(G.mHolz);
  if(G.mSchnee) G.mSchnee.parent&&G.mSchnee.parent.remove(G.mSchnee);
  G.mHolz=bk.inst(bk.palette(o.art||'euro',{fein:o.fein}),MAT.get('palette'),G.holz,{parent:par,schatten:o.schatten,bauteil:'palette',art:o.art||'euro',farben:G.farben});
  if(G.schnee.length){ if(!bk._schneeHaube) bk._schneeHaube=new THREE.BoxGeometry(A.l+0.02,0.05,A.b+0.02).translate(0,0.025,0);
    G.mSchnee=bk.inst(bk._schneeHaube,MAT.get('weissMatt'),G.schnee,{parent:par,schatten:o.schatten,bauteil:'palette',art:'schnee'}); }
  for(const m of [G.mHolz,G.mSchnee]) if(m) m.position.set(G.ox,0,G.oz);
  return {holz:G.mHolz,schnee:G.mSchnee};
};
/* Palettenstapel als Hofdeko (vorher 05h, eigene Palette 1,2 x 1,05 m in #8e7550): n Europaletten
   uebereinander, jede Lage leicht versetzt, oben eine Schneehaube. Nahe Stapel teilen sich die
   Instanzen (gruppe nach 40-m-Raster: Logistikhof Ost, Wartespur, Westrand). Kollision wie vorher als Rechteck. */
function palettenStapel(x,z,n,ry){
  ry=ry||0; const A=bk.PALETTE.euro, c=Math.cos(ry), s=Math.sin(ry), L=[];
  for(let i=0;i<n;i++){ const jx=rand(-0.02,0.02); L.push({x:x+jx*c,y:i*A.h,z:z-jx*s,ry}); }
  const r=bk.paletten(L,{gruppe:'hofstapel:'+Math.floor(x/40)+','+Math.floor(z/40),fein:false,schnee:[{x,y:n*A.h,z,ry}]});
  r.holz.userData.hof='paletten';
  const hx=Math.abs(c)*A.l/2+Math.abs(s)*A.b/2+0.02, hz=Math.abs(s)*A.l/2+Math.abs(c)*A.b/2+0.02;
  col(x-hx,x+hx,z-hz,z+hz);
  return r.holz;
}
/* Versandkarton einer Sorte (Atlaszelle aus MAT.atlas('karton'), 04b) als Mesh - alle Stellen
   (Lagerregal, Boden, LKW, Karre) bauen ihn hier. o.kiste: Mehrwegkiste statt Karton. */
bk.karton=function(t,o){
  const m=new THREE.Mesh(kartonGeo,o&&o.kiste?kisteMat():kartonMat[t]);
  if(HIQ){ m.castShadow=true; m.receiveShadow=true; }
  m.userData.bauteil='karton'; return m;
};

/* =========================================================
   Wand (Fundament Etappe 2, Schritt "Waende", 14.10.)

   Vorher: wall() (05-world) baute jede Wand als Kasten mit SECHS Materialien (eine je Seite) -
   147 Waende = 882 Zeichengruppen, im Schattenpass 170-268 Aufrufe je Bild; Laufzeit-Buendelung
   (03b) fasst Waende nicht zusammen (sie sind Zielstrahl-Hindernisse). Dazu 23+ Sockelleisten als
   Einzelmeshes und vier Wandmaterialien mit freien Werten (wallBrickMat, lagerWall, blechMat, trimMat).

   Jetzt:
   - bk.wand(o) baut die Wand: ein Material je Flaeche (innen, aussen, Laibung), die Box-Seiten nach
     Material gruppiert (hoechstens drei Gruppen), UV in Metern. Arten mit Bedeutung = Flaechen:
     'laden' (Ladentapete, waehlt der Spieler), 'lager' (hell mit gelb-schwarzem Sockelband),
     'fassade' (Faserzementtafeln aussen), 'blech' (Trapezblech Hallenwand), 'laibung', 'putz'.
   - Das Wandbild (bk.wandbild): alle Wandstuecke und Sockelleisten werden je Material (und 32-m-Feld)
     zu EINEM Mesh zusammengezeichnet - Hauptpass und Schattenpass. Die Original-Meshes bleiben fuer
     Spiel-Logik und Tests in der Szene (Lage, aabb, occluders, WAENDE, Zonen-Sichtbarkeit, Material
     je Seite in userData.flaechen) und liegen auf Ebene 3: Kamera und Schatten sehen sie nicht, der
     Zielstrahl des Spielers schon (15-player: ray.layers.enable(3); Ebene 1 = Buendelung 03b, Ebene 2 = Kleinteil-Kappung 03c). Aendert sich an einem Original die
     Sichtbarkeit (Zonen-Kauf, Logistik-Stufe) oder das Material (Pracht), wird das Bild neu gebaut -
     sofort aus oeffneZone/applyZonen, sonst spaetestens nach 10 Bildern (Pruefsumme).
   Doku: docs/fundament/waende.md
   ========================================================= */
const _WFACE={'+x':0,'-x':1,'+z':4,'-z':5}, _WOPP={'+x':'-x','-x':'+x','+z':'-z','-z':'+z'};
/* Flaeche (Art-Name) -> Material; ein Material wird durchgereicht */
bk.flaeche=function(f){
  if(!f||typeof f!=='string') return f||null;
  switch(f){
    case 'laden': return shopWall;
    case 'lager': return MAT.get('wandLager');
    case 'fassade': return MAT.get('wandFassade');
    case 'blech': return MAT.get('wandBlech');
    case 'laibung': return MAT.get('wandLaibung');
    case 'putz': return MAT.get('wandPutz'); }
  throw new Error('bk.flaeche: unbekannte Flaeche '+f);
};
/* Material -> Flaechen-Name (ohne eine Textur neu zu malen: am Bibliotheks-Schluessel erkannt) */
const _WART={'get:wandLager':'lager','get:wandFassade':'fassade','get:wandBlech':'blech','ober:aluminium|matt':'laibung','ober:lichtgrau|matt':'putz'};
bk.flaecheArt=function(m){
  if(m&&m===shopWall) return 'laden';
  const n=m&&m.userData&&m.userData.mat; return (n&&_WART[n])||'eigen';
};
/* Material einer Box-Seite (0 +x, 1 -x, 2 +y, 3 -y, 4 +z, 5 -z) - fuer Tests und Pruefungen */
bk.wandFlaeche=function(o,k){ const f=o&&o.userData&&o.userData.flaechen; if(f) return f[k]; return Array.isArray(o.material)?o.material[k]:o.material; };
/* Wandstueck. o = {x0,x1,z0,z1,y0,y1, innen:'+x'|'-x'|'+z'|'-z' (Seite der Innenflaeche),
     flaechen:{innen, aussen (Standard 'fassade'), laibung (Standard 'laibung')} (Art-Name oder Material),
     ue (Ueberstand in Laengsrichtung gegen Haarfugen, Standard 6 mm; 0 zwischen Stuecken derselben Flucht),
     still (kein Hindernis fuer den Zielstrahl), sockel (true = Laden-Fussleiste auf jeder Seite mit
     Ladentapete, oder Liste der Seiten -1/+1 quer zur Wand), zone (zWand: faellt beim Kauf), parent,
     bild:false (nicht ins Wandbild - zeichnet sich selbst) }
   -> Mesh (userData: bauteil 'wand', bauteilArt = Flaeche innen, aabb, flaechen[6]) */
bk.wand=function(o){
  let x0=o.x0,x1=o.x1,z0=o.z0,z1=o.z1; const y0=o.y0,y1=o.y1, u=o.ue===undefined?0.006:o.ue;
  if(x1-x0>z1-z0){ x0-=u; x1+=u; } else { z0-=u; z1+=u; }
  const F=o.flaechen||{}, mi=bk.flaeche(F.innen), ma=bk.flaeche(F.aussen)||bk.flaeche('fassade'), ml=bk.flaeche(F.laibung)||bk.flaeche('laibung');
  const mats=[ml,ml,ml,ml,ml,ml]; mats[_WFACE[o.innen]]=mi; mats[_WFACE[_WOPP[o.innen]]]=ma;
  const w=x1-x0,h=y1-y0,d=z1-z0, cx=(x0+x1)/2, cy=(y0+y1)/2, cz=(z0+z1)/2;
  const geo=new THREE.BoxGeometry(w,h,d);
  /* UV in Metern (wie meterUV): die Tapete ist auf jedem Stueck gleich gross, Naehte fallen weg */
  { const p=geo.attributes.position, n=geo.attributes.normal, uv=geo.attributes.uv;
    if(p&&n&&uv&&uv.count===p.count){ for(let i=0;i<p.count;i++){ const x=p.getX(i)+cx, y=p.getY(i)+cy, z=p.getZ(i)+cz, ax=Math.abs(n.getX(i)), ay=Math.abs(n.getY(i)), az=Math.abs(n.getZ(i));
        if(ay>ax&&ay>az) uv.setXY(i,x,z); else if(ax>az) uv.setXY(i,z,y); else uv.setXY(i,x,y); } uv.needsUpdate=true; } }
  /* Seiten nach Material gruppieren: hoechstens drei Gruppen statt sechs */
  const uniq=[]; for(const m of mats) if(uniq.indexOf(m)<0) uniq.push(m);
  if(geo.index&&geo.groups&&geo.groups.length===6&&geo.setIndex){
    const src=geo.index.array, out=new src.constructor(src.length); let q=0; const gr=geo.groups.slice(); geo.clearGroups();
    for(let k=0;k<uniq.length;k++){ const s0=q; gr.forEach((g,f)=>{ if(mats[f]!==uniq[k]) return; out.set(src.subarray(g.start,g.start+g.count),q); q+=g.count; }); geo.addGroup(s0,q-s0,k); }
    geo.setIndex(new THREE.BufferAttribute(out,1));
    if(uniq.length===1) geo.clearGroups();
  }
  const m=new THREE.Mesh(geo,uniq.length===1?uniq[0]:uniq); m.position.set(cx,cy,cz);
  m.userData.aabb={x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1)};
  m.userData.bauteil='wand'; m.userData.bauteilArt=bk.flaecheArt(mi); m.userData.flaechen=mats;
  if(HIQ){ m.castShadow=true; m.receiveShadow=true; }
  (o.parent||scene).add(m);
  if(!o.still) occluders.push(m);
  /* Grundriss fuer die Moebelplaetze (wandRechtecke in 06-fixtures): nur, was am Boden steht */
  if(Math.min(y0,y1)<0.9) WAENDE.push(m);
  if(o.zone) zWand(o.zone,m);
  if(o.bild!==false) bk.wandBildAdd(m);
  if(o.sockel){ const laengs=w>d, fest=laengs?cz:cx, a0=laengs?o.x0:o.z0, a1=laengs?o.x1:o.z1, si=o.innen[0]==='-'?-1:1;
    const seiten=Array.isArray(o.sockel)?o.sockel:[si,-si].filter(s=>(s===si?mi:ma)===shopWall);
    for(const s of seiten) bk.sockelleiste({laengs,fest,a0,a1,seite:s,dicke:laengs?d:w,zone:o.zone,parent:o.parent,bild:o.bild}); }
  return m;
};
/* Sockel vor einer Wandflucht: laengs = Wand laeuft in x, fest = Mitte der Wand quer, a0..a1 Laenge,
   seite -1/+1 = vor welcher Wandseite, dicke = Wandstaerke (Standard LW), x/z = Mitte direkt vorgeben.
   art 'laden' (Standard): Fussleiste 10 cm hoch, 2 cm stark, Farbe folgt der Tapete (sockelM, 05o).
   art 'aussen': Spritzwassersockel 1,05 m hoch, 6 cm stark, graphit matt (Hallenwand aussen).
   o.zone: faellt mit der Bauwand; o.versteckt: gehoert zum noch gesperrten Bereich (zAdd). -> Mesh */
const SOCKEL_ART={laden:{h:0.1,t:0.02},aussen:{h:1.05,t:0.06}};
bk.sockelleiste=function(o){
  const A=SOCKEL_ART[o.art||'laden'], L=o.a1-o.a0, D=(o.dicke===undefined?LW:o.dicke)/2+A.t/2+0.001;
  const mat=o.art==='aussen'?MAT.get('sockelAussen'):sockelM();
  const geo=roundedBoxGeo(o.laengs?L:A.t,A.h,o.laengs?A.t:L,Math.min(0.02,A.t*0.17));
  const m=new THREE.Mesh(geo,mat);
  if(o.laengs) m.position.set((o.a0+o.a1)/2,A.h/2,o.fest+o.seite*D); else m.position.set(o.fest+o.seite*D,A.h/2,(o.a0+o.a1)/2);
  if(o.x!==undefined) m.position.set(o.x,A.h/2,o.z);
  m.userData.bauteil='wand'; m.userData.bauteilArt=o.art==='aussen'?'sockelAussen':'sockel';
  (o.parent||scene).add(m);
  if(o.zone) zWand(o.zone,m);
  if(o.versteckt) zAdd(o.versteckt,m);
  if(o.bild!==false) bk.wandBildAdd(m);
  return m;
};
/* ---------- Wandbild: alle Wandteile je Material in wenigen Meshes ---------- */
const WB={liste:[],sig:null,g:null,meshes:[],takt:0,aus:false,n:0,neu:0,feld:32};
bk.WB=WB;
bk.wandBildAdd=function(m){ m.userData.wandBild=true; WB.liste.push(m); WB.sig=null; return m; };
function _wbSicht(o){ let a=o; while(a){ if(!a.visible) return false; if(!a.parent) return a===scene; a=a.parent; } return false; }
bk.wandbild=function(erzwingen){
  if(WB.aus||WB.halt) return false;
  if(typeof scene==='undefined'||!scene.layers||!THREE.Matrix3||!THREE.Layers){ WB.aus=true; return false; }
  /* Pruefsumme: Sichtbarkeit und Material jedes Originals */
  let sig=WB.liste.length+':'; const sicht=[];
  for(let i=0;i<WB.liste.length;i++){ const o=WB.liste[i], v=_wbSicht(o); sicht.push(v);
    if(!v){ sig+='0'; continue; } const M=o.material; sig+=Array.isArray(M)?M.map(m=>m.id).join('.'):M.id; sig+=','; }
  if(!erzwingen&&sig===WB.sig) return false;
  WB.sig=sig;
  if(!WB.g){ WB.g=new THREE.Group(); WB.g.userData._bnd=true; WB.g.userData.bauteil='wand'; WB.g.name='wandbild'; scene.add(WB.g); }
  for(const me of WB.meshes){ WB.g.remove(me); me.geometry.dispose(); } WB.meshes=[];
  const topf=new Map(), nm=new THREE.Matrix3();
  for(let i=0;i<WB.liste.length;i++){ const o=WB.liste[i];
    if(!sicht[i]){ o.layers.set(0); continue; }
    const g=o.geometry; if(!g||!g.attributes.position){ o.layers.set(0); continue; }
    o.updateWorldMatrix(true,false);
    const ms=Array.isArray(o.material)?o.material:[o.material];
    const cnt=g.index?g.index.count:g.attributes.position.count;
    const grs=Array.isArray(o.material)&&g.groups.length?g.groups:[{start:0,count:cnt,materialIndex:0}];
    const e=o.matrixWorld.elements, feld=Math.floor(e[12]/WB.feld)+','+Math.floor(e[14]/WB.feld);
    for(const gr of grs){ const mat=ms[gr.materialIndex]; if(!mat||mat.visible===false) continue;
      const k=mat.uuid+'|'+o.castShadow+'|'+o.receiveShadow+'|'+feld;
      let t=topf.get(k); if(!t){ t={mat,cast:o.castShadow,recv:o.receiveShadow,teile:[],n:0}; topf.set(k,t); }
      t.teile.push({o,s:gr.start,c:gr.count}); t.n+=gr.count; }
    o.layers.set(3); }
  const v=new THREE.Vector3();
  for(const t of topf.values()){
    const pos=new Float32Array(t.n*3), nor=new Float32Array(t.n*3), uv=new Float32Array(t.n*2); let q=0;
    for(const {o,s,c} of t.teile){ const g=o.geometry, P=g.attributes.position, N=g.attributes.normal, U=g.attributes.uv, I=g.index;
      nm.getNormalMatrix(o.matrixWorld);
      for(let j=s;j<s+c;j++){ const a=I?I.getX(j):j;
        v.fromBufferAttribute(P,a).applyMatrix4(o.matrixWorld); pos[q*3]=v.x; pos[q*3+1]=v.y; pos[q*3+2]=v.z;
        if(N){ v.fromBufferAttribute(N,a).applyMatrix3(nm).normalize(); nor[q*3]=v.x; nor[q*3+1]=v.y; nor[q*3+2]=v.z; }
        if(U){ uv[q*2]=U.getX(a); uv[q*2+1]=U.getY(a); } q++; } }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.BufferAttribute(nor,3)); geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    geo.computeBoundingSphere();
    const me=new THREE.Mesh(geo,t.mat); me.castShadow=t.cast; me.receiveShadow=t.recv; me.matrixAutoUpdate=false;
    me.userData.bauteil='wand'; me.userData.klasse='bild'; me.userData.wandBild='bild';
    WB.g.add(me); WB.meshes.push(me); }
  WB.n++; WB.neu=WB.meshes.length;
  return true;
};
/* im Bild-Takt (03b renderFrame): alle 10 Bilder Pruefsumme, beim ersten Mal sofort */
bk.wandbildTakt=function(){ if(WB.aus) return; if(WB.sig===null||++WB.takt%10===0){ try{ bk.wandbild(); }catch(e){ WB.aus=true; WB.fehler=String(e&&e.message||e); for(const o of WB.liste) o.layers.set(0); if(WB.g) WB.g.visible=false; } } };

/* =========================================================
   Lagertechnik (Halle Etappe A, 14.10.2026, docs/halle/plan-1410.md): Hochregal, Regalbediengeraet,
   Foerderer, Leuchten, Bodenmarkierung. Wiederholteile als InstancedMesh (eine Geometrie je Teil und
   Detailstufe, geteilt ueber alle Gassen), Rest ueber bk.sammler. Farben nur aus MAT (Stuetzen
   Signalblau, Traversen Signalorange, Anfahrschutz Signalgelb, Technik Anthrazit). Doku baukasten.md §2.
   ========================================================= */
/* Masse Hochregal (Skizze 1.1 / Branch halle-v7): Feld 2,9 m mit 3 Europaletten quer, Ebenen = Oberkante
   Traverse (0 = Boden), Rahmentiefe 1,2 m, Hoehe 9,95 m */
bk.HOCHREGAL={fb:2.9,tiefe:1.2,ebenen:[0,1.9,3.8,5.7,7.6],hoehe:9.95,felder:6,jeFeld:3,traverse:0.12};
const _bkHR=new Map();
function _bkHRGeo(k,f){ const key=k+':'+bk.lod(); let g=_bkHR.get(key); if(!g){ g=f(); _bkHR.set(key,g); } return g; }
/* Ladung einer Regalpalette: 2 x 2 x 3 Kartons 0,4 x 0,4 x 0,6 m (Pappe), auf Ultra Low ein Block */
bk.ladungGeo=function(){ return _bkHRGeo('ladung',()=>{
  const S=bk.sammler({}), P=MAT.farbe('wellpappe');
  if(bk.lod()===0){ S.box(0.8,1.2,1.2,0,0.6,0,P,'stumpf'); return S.geometrie('stumpf'); }
  for(let iy=0;iy<3;iy++) for(let ix=0;ix<2;ix++) for(let iz=0;iz<2;iz++)
    S.box(0.39,0.395,0.59,-0.2+ix*0.4,0.2+iy*0.4,-0.3+iz*0.6,P,'stumpf');
  return S.geometrie('stumpf'); }); };
/* Hochregal: je Gasse zwei Reihen (A: z0..z0+1,2, B: z0+2,8..z0+4,0), Gasse dazwischen (Mitte z0+2,0). Alle Gassen eines
   Aufrufs teilen sich die InstancedMesh (Rahmen, Traversen, Gitterroste, Paletten, Ladung) - 3 Gassen = so viele
   Zeichenaufrufe wie eine.
   o = {x0, gassen:[{z0, nr, schieneOst (Schiene ueber das Regalende hinaus, m), schiene:false}], felder, parent, stirn:'ost'|'beide'}
   (kurz: o.z0/o.nr fuer eine Gasse)
   -> {g, meshes, gassen:[{z0,mitte,reihen,kollision,xs1,von,bis (Index in plaetze)}], plaetze:[{x,y,z,gasse,reihe,feld,ebene}],
       x0, x1, hoehe, ebenen, belegen(liste der Indizes in plaetze)} */
bk.hochregal=function(o){
  const A=bk.HOCHREGAL, F=MAT.farbe, L=bk.lod(), fb=A.fb, x0=o.x0, nf=o.felder||A.felder, x1=x0+nf*fb, T=A.tiefe, H=A.hoehe;
  const GL=o.gassen||[{z0:o.z0,nr:o.nr,schieneOst:o.schieneOst,schiene:o.schiene}];
  const g=new THREE.Group(); g.userData.bauteil='hochregal'; (o.parent||scene).add(g);
  const BLAU=F('signalblau'), ORANGE=F('signalorange');
  /* Rahmen: zwei Stuetzen (Lochprofil 100 x 80) mit Fussplatte, waagerechte und diagonale Verbaende, Kopf bei H */
  const rahmen=_bkHRGeo('rahmen',()=>{ const S=bk.sammler({});
    for(const z of [0.05,T-0.05]){ S.box(0.1,H,0.08,0,H/2,z,BLAU,'lackMetall'); S.box(0.18,0.012,0.16,0,0.006,z,F('anthrazit'),'lackMetall'); }
    const dy=1.25; for(let y=0.25,s=1;y<H-0.4;y+=dy,s=-s){ S.box(0.045,0.04,T-0.14,0,y,T/2,BLAU,'lackMetall');
      if(L>0){ const y2=Math.min(H-0.15,y+dy), a=s>0?0.09:T-0.09, b=s>0?T-0.09:0.09, dz=b-a, dyy=y2-y;
        S.box(0.035,Math.hypot(dz,dyy),0.035,0,(y+y2)/2,(a+b)/2,BLAU,'lackMetall',Math.atan2(dz,dyy),0,0); } }
    return S.geometrie('lackMetall'); });
  /* Traversenpaar eines Feldes (vorn + hinten), Oberkante = Ebene */
  const trav=_bkHRGeo('traverse',()=>{ const S=bk.sammler({}), l=fb-0.1;
    for(const z of [0.06,T-0.06]){ S.box(l,A.traverse,0.05,0,-A.traverse/2,z,ORANGE,'lackMetall'); if(L>1) for(const s of [-1,1]) S.box(0.07,0.16,0.06,s*(l/2-0.03),-0.08,z,ORANGE,'lackMetall'); }
    return S.geometrie('lackMetall'); });
  /* Gitterrost (Draht, verzinkt) auf jeder Traversenebene */
  const rost=_bkHRGeo('rost',()=>{ const gg=new THREE.PlaneGeometry(fb-0.14,T-0.06); gg.rotateX(-Math.PI/2); gg.translate(0,0.004,T/2); return MAT.kachel(gg,(fb-0.14)/0.2,(T-0.06)/0.2); });
  const mR=[], mT=[], mG=[], plaetze=[], gassen=[];
  const S=bk.sammler({form:{fase:0.01,faseMin:0.05,lod0Kasten:true},bauteil:'hochregal'});
  GL.forEach((q,k)=>{ const z0=q.z0, reihen=[{z0:z0,z1:z0+T},{z0:z0+2.8,z1:z0+2.8+T}], mitte=z0+2.0, xs1=x1+(q.schieneOst===undefined?1.6:q.schieneOst);
    for(const r of reihen){
      for(let i=0;i<=nf;i++) mR.push(tm(x0+i*fb,0,r.z0));
      for(let j=0;j<nf;j++){ const cx=x0+(j+0.5)*fb;
        for(let l=1;l<A.ebenen.length;l++){ mT.push(tm(cx,A.ebenen[l],r.z0)); mG.push(tm(cx,A.ebenen[l],r.z0)); }
        mT.push(tm(cx,H,r.z0)); } }
    /* Schienen der Gasse (Fahrschiene am Boden, Fuehrungsschiene oben an Querjochen), Anfahrschutz an der Stirn */
    const xs0=x0-0.25;
    if(q.schiene!==false){
      S.box(xs1-xs0,0.06,0.09,(xs0+xs1)/2,0.03,mitte,F('silbergrau'),'stahl');
      S.box(xs1-xs0,0.012,0.32,(xs0+xs1)/2,0.006,mitte,F('graphit'),'lackMetall');
      S.box(xs1-x0+0.1,0.12,0.12,(x0+xs1)/2,H+0.3,mitte,F('anthrazit'),'lackMetall');
      for(let i=0;i<=nf;i+=2) S.box(0.1,0.1,2.8-T+0.12,x0+i*fb,H+0.18,mitte,F('anthrazit'),'lackMetall');
      for(const z of [mitte-0.85,mitte+0.85]) S.box(0.12,H+0.36,0.12,xs1-0.06,(H+0.36)/2,z,F('anthrazit'),'lackMetall');
      S.box(0.12,0.12,1.82,xs1-0.06,H+0.3,mitte,F('anthrazit'),'lackMetall'); }
    for(const r of reihen){ const xe=x1+0.18;
      bk.anfahrschutz(S,{von:[xe,r.z0-0.04],bis:[xe,r.z1+0.04],hoehe:0.45,pfosten:1.3});
      const zg=r.z0<mitte?r.z1-0.05:r.z0+0.05; S.box(0.22,0.4,0.2,x1,0.2,zg,F('signalgelb'),'lackMetall');
      if(o.stirn==='beide') bk.anfahrschutz(S,{von:[x0-0.18,r.z0-0.04],bis:[x0-0.18,r.z1+0.04],hoehe:0.45,pfosten:1.3}); }
    if(q.nr) bk.schild(g,{text:'GASSE '+q.nr,unter:(nf*A.jeFeld*A.ebenen.length*2)+' Palettenplätze',b:1.5,h:0.45,x:xs1+0.02,y:H-0.9,z:mitte,ry:Math.PI/2});
    const von=plaetze.length;
    reihen.forEach((r,ri)=>{ for(let j=0;j<nf;j++) for(let s2=0;s2<A.jeFeld;s2++) for(let l=0;l<A.ebenen.length;l++)
      plaetze.push({x:x0+j*fb+0.1+(s2+0.5)*(fb-0.2)/A.jeFeld,y:A.ebenen[l]+(l?0.004:0),z:(r.z0+r.z1)/2,gasse:k,reihe:ri,feld:j,ebene:l}); });
    gassen.push({z0,mitte,reihen,xs1,von,bis:plaetze.length,kollision:reihen.map(r=>({x0:x0-0.1,x1:x1+0.3,z0:r.z0-0.05,z1:r.z1+0.05}))}); });
  const meshes=[bk.inst(rahmen,MAT.vc('lackMetall'),mR,{parent:g,bauteil:'hochregal',art:'rahmen'}),
    bk.inst(trav,MAT.vc('lackMetall'),mT,{parent:g,bauteil:'hochregal',art:'traverse'}),
    bk.inst(rost,MAT.get('gitterRost'),mG,{parent:g,bauteil:'hochregal',art:'gitterrost',schatten:false})];
  meshes.push(...S.fertig(g,{bauteil:'hochregal',fest:true}));
  /* Belegung: je belegtem Platz Europalette (bk.palette) mit Kartonladung - zwei InstancedMesh fuer alle Gassen.
     Instanzfarbe (Alterung) wie bk.paletten - dasselbe Material teilt sich in r128 ein Shaderprogramm: alle Paletten-Instanzen
     brauchen sie; bei der Ladung von Anfang an (spaeter angelegt bricht r128 beim Zeichnen). */
  const mP=bk.inst(bk.palette('euro',{fein:L>1}),MAT.get('palette'),plaetze.map(p=>tm(p.x,p.y,p.z,0,Math.PI/2,0)),{parent:g,bauteil:'hochregal',art:'palette',schatten:false,farben:plaetze.map((p,i)=>bk.palFarbe(p.x,p.y,p.z,i))});
  const mL=bk.inst(bk.ladungGeo(),MAT.vc('stumpf'),plaetze.map(p=>tm(p.x,p.y+bk.PALETTE.euro.h,p.z)),{parent:g,bauteil:'hochregal',art:'ladung',schatten:false,farben:plaetze.map(()=>new THREE.Color(1,1,1))});
  const hell=new THREE.Color();
  const belegen=liste=>{ let n=0;
    for(const i of liste){ const p=plaetze[i]; if(!p) continue;
      mP.setMatrixAt(n,tm(p.x,p.y,p.z,0,Math.PI/2+((i*7)%3-1)*0.02,0));
      mL.setMatrixAt(n,tm(p.x+((i*13)%5-2)*0.006,p.y+bk.PALETTE.euro.h,p.z));
      const v=0.86+((i*37)%11)/80; mL.setColorAt(n,hell.setRGB(v,v,v)); n++; }
    mP.count=n; mL.count=n; mP.instanceMatrix.needsUpdate=true; mL.instanceMatrix.needsUpdate=true; if(mL.instanceColor) mL.instanceColor.needsUpdate=true;
    mP.visible=mL.visible=n>0; return n; };
  meshes.push(mP,mL); belegen([]);
  return {g,meshes,gassen,plaetze,x0,x1,ebenen:A.ebenen,hoehe:H,belegen};
};
/* Regalbediengeraet (RBG) fuer eine Gasse: zwei Fahrkatzen (Signalgelb wie Kran), Mast Anthrazit, Hubwagen mit
   Teleskopgabel bis zum Boden, Schaltschrank, Kopf an der Fuehrungsschiene, Warnleuchte. Gabelmitte = g.x (Ladung mittig).
   Unsymmetrisch wie ein Einmast-RBG (Feinschliff 15.10.): Mast, Antrieb und Schaltschrank im Osten, im Westen nur eine schmale
   Fahrkatze mit Puffer (reicht 0,80 m ueber die Gabelmitte) - sonst ragte das Geraet an Feld 0 durch die Brandwand x −66.
   o = {x, z (Gassenmitte), hoehe (Mast bis Fuehrungsschiene), parent}
   -> {g (faehrt in x), hub (faehrt in y = Unterkante Gabel), gabel (faehrt in z, quer in die Reihe), set(x,y,z), yMin, meshes} */
bk.rbg=function(o){
  const F=MAT.farbe, L=bk.lod(), H=o.hoehe||10.2, GELB=F('signalgelb'), ANTH=F('anthrazit'), seg=[6,10,14][L];
  const g=new THREE.Group(); g.position.set(o.x||0,0,o.z||0); g.userData.bauteil='rbg'; (o.parent||scene).add(g);
  const S=bk.sammler({form:{fase:0.015,faseMin:0.06,seg:1,lod0Kasten:true},bauteil:'rbg'});
  /* Fahrwerk: zwei Fahrkatzen auf der Bodenschiene, flacher Unterzug dazwischen (Hubwagen faehrt bis zum Boden) */
  for(const [dx,b] of [[-0.62,0.3],[1.05,0.56]]){ const s=Math.sign(dx); S.box(b,0.42,0.6,dx,0.3,0,GELB,'lackMetall'); S.box(b+0.04,0.04,0.64,dx,0.53,0,ANTH,'lackMetall');
    S.zyl(0.13,0.13,0.2,seg,dx,0.15,0,ANTH,'lackMetall',Math.PI/2,0,0); S.box(s<0?0.03:0.08,0.2,0.4,dx+s*(b/2+(s<0?0.015:0.04)),0.25,0,F('gummischwarz'),'lackMetall'); }
  S.box(1.67,0.05,0.22,0.215,0.025,0,ANTH,'lackMetall');
  /* Antrieb */
  S.zyl(0.12,0.12,0.3,seg,1.05,0.68,0.16,F('mittelgrau'),'lackMetall',Math.PI/2,0,0); S.box(0.24,0.24,0.2,1.05,0.68,-0.12,ANTH,'lackMetall');
  /* Mast (Kastenprofil) ueber der Fahrkatze Ost, Laufbahnen fuer den Hubwagen */
  S.box(0.3,H-0.55,0.4,0.95,0.55+(H-0.55)/2,0,ANTH,'lackMetall');
  for(const z of [-0.14,0.14]) S.box(0.04,H-0.6,0.06,0.78,0.3+(H-0.6)/2,z,F('silbergrau'),'lackMetall');
  if(L>0) for(let y=1.2;y<H-0.6;y+=1.2) S.box(0.31,0.03,0.41,0.95,y,0,F('graphit'),'lackMetall');
  /* Kopf mit Fuehrungsrollen an der oberen Schiene, Warnleuchte */
  S.box(2.05,0.22,0.4,0.275,H-0.11,0,GELB,'lackMetall');
  for(const z of [-0.09,0.09]) for(const x of [-0.6,1.0]) S.zyl(0.06,0.06,0.12,seg,x,H+0.06,z,ANTH,'lackMetall');
  S.zyl(0.06,0.07,0.1,seg,0.0,H+0.05,0.12,ANTH,'lackMetall'); S.zyl(0.07,0.07,0.14,seg,0.0,H+0.17,0.12,F('signalorange'),'leucht');
  /* Schaltschrank aussen am Mast (Ost), Display und Not-Halt */
  S.box(0.22,1.3,0.5,1.3,1.6,0,F('lichtgrau'),'lackMetall'); S.box(0.24,0.05,0.54,1.3,2.27,0,ANTH,'lackMetall'); S.box(0.04,0.06,0.3,1.17,1.6,0,ANTH,'lackMetall');
  S.box(0.01,0.16,0.24,1.415,1.85,0.05,F('signalblau'),'leucht'); S.zyl(0.035,0.035,0.03,seg,1.42,1.55,-0.15,F('signalrot'),'lackMetall',0,0,Math.PI/2);
  /* Energiekette am Mast */
  if(L>0) S.box(0.06,H*0.5,0.14,1.13,0.6+H*0.25,0.16,F('gummischwarz'),'lackMetall');
  const meshes=S.fertig(g,{bauteil:'rbg'});
  /* Hubwagen (y = Unterkante Gabel): Traegerplatte am Mast, Gabeltraeger, Teleskopgabel quer in die Reihe */
  const hub=new THREE.Group(); hub.position.y=0.5; g.add(hub);
  const Sh=bk.sammler({form:{fase:0.012,faseMin:0.05,seg:1,lod0Kasten:true},bauteil:'rbg'});
  Sh.box(0.12,0.9,0.72,0.66,0.45,0,GELB,'lackMetall'); Sh.box(0.2,0.1,0.72,0.5,0.06,0,ANTH,'lackMetall');
  for(const z of [-0.33,0.33]) Sh.box(0.12,0.5,0.04,0.58,0.3,z,ANTH,'lackMetall');
  meshes.push(...Sh.fertig(hub,{bauteil:'rbg'}));
  const gabel=new THREE.Group(); hub.add(gabel);
  const Sg=bk.sammler({bauteil:'rbg'});
  for(const x of [-0.25,0.25]){ Sg.box(0.12,0.04,1.15,x,0.02,0,F('silbergrau'),'stahl'); Sg.box(0.1,0.025,1.1,x,0.05,0,F('graphit'),'stahl'); }
  Sg.box(0.62,0.05,0.12,0.12,0.03,0,ANTH,'stahl');
  meshes.push(...Sg.fertig(gabel,{bauteil:'rbg'}));
  const R={g,hub,gabel,meshes,yMin:0.0,
    set(x,y,z){ if(x!==undefined) g.position.x=x; if(y!==undefined) hub.position.y=Math.max(R.yMin,y); if(z!==undefined) gabel.position.z=z; }};
  return R;
};
/* Rollenfoerderer (Paletten, 1 m breit): Seitenwangen Anthrazit, Rollen Stahl hell, Stuetzen verzinkt, Antrieb.
   o = {von:[x,z], bis:[x,z], breite 1,0, hoehe (Oberkante Rollen) 0,55, teilung (Rollenabstand) 0,16, decke (haengend bis zur Decke),
        antrieb:false, parent}
   -> {meshes, laenge, y, punkt(t) -> {x,z} (t 0..1), ry, kollision {x0,x1,z0,z1}} */
bk.foerderer=function(o){
  const F=MAT.farbe, L=bk.lod(), seg=[6,8,12][L], [ax,az]=o.von, [bx,bz]=o.bis, dx=bx-ax, dz=bz-az, len=Math.hypot(dx,dz);
  const B=o.breite||1.0, Hh=o.hoehe||0.55, t=o.teilung||(L?0.16:0.32), ry=Math.atan2(-dz,dx);
  const g=new THREE.Group(); g.position.set(ax,0,az); g.rotation.y=ry; g.userData.bauteil='foerderer'; (o.parent||scene).add(g);
  const S=bk.sammler({form:{fase:0.008,faseMin:0.04,lod0Kasten:true},bauteil:'foerderer'});
  for(const s of [-1,1]){ S.box(len,0.14,0.05,len/2,Hh-0.05,s*(B/2+0.03),F('anthrazit'),'lackMetall'); }
  const n=Math.max(2,Math.floor(len/t));
  for(let i=0;i<n;i++) S.zyl(0.03,0.03,B,seg,(i+0.5)*len/n,Hh-0.03,0,F('hellgrau'),'stahl',Math.PI/2,0,0);
  /* stehend: Stuetzen mit Fussplatte; haengend (o.decke = Hoehe der Decke, Ueberkopf-Foerderer Werk West): Abhaenger und Querjoch */
  const ns=Math.max(2,Math.ceil(len/(o.decke?2.4:1.6))+1);
  for(let i=0;i<ns;i++){ const x=Math.min(len-0.05,Math.max(0.05,i*len/(ns-1)));
    if(o.decke){ const hl=o.decke-Hh; for(const s of [-1,1]) S.box(0.03,hl,0.03,x,Hh+hl/2,s*(B/2+0.04),F('silbergrau'),'stahl'); S.box(0.06,0.06,B+0.14,x,Hh-0.14,0,F('silbergrau'),'stahl'); continue; }
    for(const s of [-1,1]){ S.box(0.06,Hh-0.12,0.06,x,(Hh-0.12)/2,s*(B/2-0.02),F('silbergrau'),'stahl'); bk.fuss(S,x,s*(B/2-0.02),0.12); }
    S.box(0.05,0.05,B,x,0.18,0,F('silbergrau'),'stahl'); }
  if(o.antrieb!==false){ S.box(0.3,0.24,0.22,len*0.5,Hh-0.22,-(B/2+0.18),F('graphit'),'lackMetall'); S.zyl(0.08,0.08,0.22,seg,len*0.5,Hh-0.22,-(B/2+0.36),F('mittelgrau'),'lackMetall',Math.PI/2,0,0); }
  const meshes=S.fertig(g,{bauteil:'foerderer',fest:true});
  const cx=[ax,bx], cz=[az,bz], w=B/2+0.1;
  return {g,meshes,laenge:len,y:Hh,ry,punkt:u=>({x:ax+dx*u,z:az+dz*u}),
    kollision:{x0:Math.min(...cx)-(Math.abs(dz)>Math.abs(dx)?w:0),x1:Math.max(...cx)+(Math.abs(dz)>Math.abs(dx)?w:0),z0:Math.min(...cz)-(Math.abs(dx)>=Math.abs(dz)?w:0),z1:Math.max(...cz)+(Math.abs(dx)>=Math.abs(dz)?w:0)}};
};
/* Leuchten.
   art 'raster' (Deckenleuchten im Raster, vorher leuchtenRaster 05h): o = {id (Zone), r:{x0,x1,z0,z1}, y (Decke), ax, az, panel (Material
       der Streuscheibe)} - zwei Meshes (Korpus, Scheibe), jede Leuchte meldet sich in LAMPEN an.
   art 'halle' (Hallenleuchte, LED-Hallenstrahler linear 1,4 m an Pendeln): o = {punkte:[[x,z],...], y (Unterkante), decke (Pendel bis),
       zone (LAMPEN-id), aus (Zone, mit der die Leuchte ausgeht), parent} - zwei InstancedMesh (Gehaeuse, Leuchtflaeche).
   art 'strasse' (Mastleuchte, vorher lampTeile 05e): o.add(k,geo,matrix,farbe) bekommt die Teile in lokalen Koordinaten. */
bk.lampe=function(o){
  if(o.art==='strasse'){ const add=o.add, D=MAT.farbe('anthrazit'), MA=MAT.farbe('basaltgrau'), C=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s);
    add('lack',C(0.15,0.19,0.34,14),tm(0,0.17,0),D);
    add('lack',new THREE.BoxGeometry(0.1,0.16,0.02),tm(0,0.2,0.185),MAT.farbe('mittelgrau'));
    add('lack',C(0.16,0.16,0.03,14),tm(0,0.35,0),D);
    for(let i=0;i<4;i++){ const a=i/4*Math.PI*2; add('lack',new THREE.BoxGeometry(0.035,0.03,0.035),tm(Math.cos(a)*0.13,0.37,Math.sin(a)*0.13),MAT.farbe('silbergrau')); }
    add('mast',C(0.075,0.11,4.4,14),tm(0,2.57,0),MA);
    const R=0.9, seg=7;
    for(let i=0;i<seg;i++){ const a0=i/seg*(Math.PI/2), a1=(i+1)/seg*(Math.PI/2);
      const x0=Math.sin(a0)*R, y0=R-Math.cos(a0)*R, x1=Math.sin(a1)*R, y1=R-Math.cos(a1)*R;
      add('lack',C(0.062,0.066,Math.hypot(x1-x0,y1-y0)*1.08,10),tm(0,4.77+(y0+y1)/2,(x0+x1)/2,Math.atan2(x1-x0,y1-y0),0,0),MA); }
    const K=tm(0,5.63,0.9,0.06,0,0), k=(geo,x,y,z,c,key)=>add(key||'lack',geo,K.clone().multiply(tm(x,y,z)),c);
    k(roundedBoxGeo(0.3,0.11,0.82,0.04),0,0.06,0,MAT.farbe('graphit'));
    k(new THREE.BoxGeometry(0.26,0.03,0.74),0,0.005,0,MAT.farbe('mittelgrau'));
    k(new THREE.BoxGeometry(0.24,0.045,0.7),0,-0.02,0,0xffffff,'lampe');
    k(new THREE.BoxGeometry(0.16,0.09,0.16),0,0.06,-0.44,MAT.farbe('anthrazit'));
    k(new THREE.BoxGeometry(0.24,0.02,0.6),0,0.125,0.02,MAT.farbe('basaltgrau'));
    return null; }
  if(o.art==='raster'){ const r=o.r, y=o.y, id=o.id;
    const nx=Math.max(1,Math.round((r.x1-r.x0)/o.ax)), nz=Math.max(1,Math.round((r.z1-r.z0)/o.az));
    /* Je hoeher die Halle, desto groesser die Leuchte - sonst haengen unter zwoelf Metern Decke nur noch Striche. */
    const f=Math.max(1,y/3.8);
    const gRev=new THREE.BoxGeometry(1.44*f,0.03*f,0.42*f), gFix=new THREE.BoxGeometry(1.36*f,0.028*f,0.36*f), gDif=new THREE.PlaneGeometry(1.26*f,0.28*f);
    const korpus=[], diff=[], lampen=[];
    for(let i=0;i<nx;i++) for(let k=0;k<nz;k++){ const x=r.x0+(i+0.5)*(r.x1-r.x0)/nx, z=r.z0+(k+0.5)*(r.z1-r.z0)/nz;
      const L={x,y,z,id}; LAMPEN.push(L); lampen.push(L);
      korpus.push({geo:gRev,m:tm(x,y-0.008*f,z),color:MAT.farbe('anthrazit')});
      korpus.push({geo:gFix,m:tm(x,y-0.026*f,z),color:MAT.farbe('lichtgrau')});
      diff.push({geo:gDif,m:tm(x,y-0.043*f,z,Math.PI/2,0,0)}); }
    const mk=new THREE.Mesh(merge(korpus),MAT.vc('matt')), md=new THREE.Mesh(merge(diff),o.panel);
    mk.userData.bauteil=md.userData.bauteil='lampe'; mk.userData.bauteilArt=md.userData.bauteilArt='raster';
    (o.parent||scene).add(mk); (o.parent||scene).add(md);
    if(id&&typeof zAdd==='function'){ zAdd(id,mk); zAdd(id,md); }
    gRev.dispose(); gFix.dispose(); gDif.dispose();
    return {meshes:[mk,md],lampen}; }
  /* Hallenleuchte */
  const L=bk.lod(), y=o.y, pend=Math.max(0,(o.decke||y)-y-0.12);
  const geo=_bkHRGeo('hallenleuchte:'+pend.toFixed(2),()=>{ const S=bk.sammler({form:{fase:0.01,faseMin:0.04,lod0Kasten:true}});
    S.box(1.42,0.09,0.3,0,0.06,0,MAT.farbe('anthrazit'),'lackMetall');
    if(L>0) for(let i=-5;i<=5;i++) S.box(0.025,0.05,0.26,i*0.12,0.13,0,MAT.farbe('aluminium'),'lackMetall');
    if(pend>0) for(const x of [-0.6,0.6]) S.box(0.012,pend,0.012,x,0.1+pend/2,0,MAT.farbe('silbergrau'),'lackMetall');
    return S.geometrie('lackMetall'); });
  const geoL=_bkHRGeo('hallenleuchte:flaeche',()=>merge([{geo:new THREE.BoxGeometry(1.32,0.02,0.22),m:tm(0,0.008,0),color:MAT.farbe('lampeWarm')}]));
  const M=o.punkte.map(([x,z,ry])=>tm(x,y,z,0,ry||0,0)), lampen=[];
  for(const [x,z] of o.punkte){ const Lp={x,y,z,id:o.zone||null}; if(o.aus) Lp.aus=o.aus; LAMPEN.push(Lp); lampen.push(Lp); }
  const meshes=[bk.inst(geo,MAT.vc('lackMetall'),M,{parent:o.parent,bauteil:'lampe',art:'halle',schatten:false}),
    bk.inst(geoL,MAT.vc('leucht'),M,{parent:o.parent,bauteil:'lampe',art:'halle',schatten:false})];
  return {meshes,lampen};
};
/* Bodenmarkierung (ASR A1.8): gleiche Breiten und Farben ueberall.
   o = {linien:[[x0,z0,x1,z1,farbe('gelb'|'weiss'|'gruen'),breite]] (Fahrwege gelb 0,12 m, Stellplaetze weiss/gelb 0,08 m),
        rahmen:[{x0,x1,z0,z1,farbe,breite}] (Stellplatz/Feld umrandet), flaechen:[{x0,x1,z0,z1,art:'gehweg'|'sperr'}]
        (Gehweg gruen, Sperrflaeche gelb-schwarz 45°), piktos:[{x,z,ry,g}] (Fussgaenger 0,8 m), y (Boden), parent,
        schatten (true = empfaengt Sonnenschatten wie Aussenboeden; innen aus, wie die Hallenboeden)}
   -> {meshes} je Material EIN Mesh (UV in Metern, Schraffur 0,4 m je Kachel) */
bk.MARKIERUNG={fahrweg:0.12,stellplatz:0.08,gehweg:0.12,pikto:0.8};
bk.bodenmarkierung=function(o){
  const y=o.y===undefined?0.015:o.y, T={gelb:[],weiss:[],gruen:[],sperr:[],pikto:[]};
  const quad=(k,cx,cz,w,d,ry,dy,uvM)=>{ const gg=new THREE.PlaneGeometry(w,d); gg.rotateX(-Math.PI/2); if(ry) gg.rotateY(ry); gg.translate(cx,y+dy,cz);
    if(uvM){ const p=gg.attributes.position, uv=gg.attributes.uv; for(let i=0;i<p.count;i++) uv.setXY(i,p.getX(i)/uvM,-p.getZ(i)/uvM); }
    T[k].push({geo:gg,m:new THREE.Matrix4()}); };
  const linie=(x0,z0,x1,z1,f,b)=>{ const L=Math.hypot(x1-x0,z1-z0); if(L<0.01) return; quad(f||'gelb',(x0+x1)/2,(z0+z1)/2,L+(b||0.12),b||0.12,Math.atan2(-(z1-z0),x1-x0),0.005); };
  for(const l of (o.linien||[])) linie(l[0],l[1],l[2],l[3],l[4],l[5]);
  for(const r of (o.rahmen||[])){ const b=r.breite||bk.MARKIERUNG.stellplatz, f=r.farbe||'gelb', h=b/2;
    linie(r.x0+h,r.z0+h,r.x1-h,r.z0+h,f,b); linie(r.x0+h,r.z1-h,r.x1-h,r.z1-h,f,b);
    linie(r.x0+h,r.z0+h,r.x0+h,r.z1-h,f,b); linie(r.x1-h,r.z0+h,r.x1-h,r.z1-h,f,b); }
  for(const f of (o.flaechen||[])){ const w=f.x1-f.x0, d=f.z1-f.z0;
    if(f.art==='sperr') quad('sperr',(f.x0+f.x1)/2,(f.z0+f.z1)/2,w,d,0,0.003,0.4); else quad('gruen',(f.x0+f.x1)/2,(f.z0+f.z1)/2,w,d,0,0.003); }
  for(const p of (o.piktos||[])){ const gg=new THREE.PlaneGeometry(p.g||0.8,p.g||0.8); gg.rotateX(-Math.PI/2); gg.rotateY(p.ry||0); gg.translate(p.x,y+0.006,p.z); T.pikto.push({geo:gg,m:new THREE.Matrix4()}); }
  const MM={gelb:MAT.get('markierungGelb'),weiss:MAT.get('weissMatt'),gruen:MAT.get('markierungGruen'),sperr:MAT.get('sperrflaeche'),pikto:MAT.get('markierungPikto')};
  const meshes=[];
  for(const k in T){ if(!T[k].length) continue; const me=new THREE.Mesh(merge(T[k]),MM[k]); T[k].forEach(t=>t.geo.dispose());
    if(HIQ&&o.schatten) me.receiveShadow=true; me.userData.bauteil='bodenmarkierung'; me.userData.bauteilArt=k; me.matrixAutoUpdate=false; me.updateMatrix();
    (o.parent||scene).add(me); meshes.push(me); }
  return {meshes};
};
/* Fahrerloses Transportfahrzeug (FTS) fuer Paletten: flacher Fahrkoerper Lichtgrau, Hubdeck verzinkt, Rammschutz-Leiste
   Signalgelb rundum, Laserscanner vorn/hinten, Warnleuchte. o = {x,z,ry,parent} -> {g, deck (hebt in y), set(hub 0..1), meshes} */
bk.fts=function(o){
  o=o||{}; const F=MAT.farbe, L=bk.lod(), seg=[6,10,14][L];
  const g=new THREE.Group(); g.position.set(o.x||0,0,o.z||0); g.rotation.y=o.ry||0; g.userData.bauteil='fts'; (o.parent||scene).add(g);
  const S=bk.sammler({form:{fase:0.02,faseMin:0.05,seg:1,lod0Kasten:true},bauteil:'fts'});
  S.box(1.3,0.22,0.78,0,0.15,0,F('lichtgrau'),'lackMetall');
  S.box(1.34,0.06,0.82,0,0.08,0,F('signalgelb'),'lackMetall');
  for(const x of [-0.45,0.45]) S.zyl(0.06,0.06,0.06,seg,x,0.06,0.34,F('gummischwarz'),'lackMetall',Math.PI/2,0,0), S.zyl(0.06,0.06,0.06,seg,x,0.06,-0.34,F('gummischwarz'),'lackMetall',Math.PI/2,0,0);
  for(const s of [-1,1]){ S.zyl(0.05,0.05,0.06,seg,s*0.6,0.3,0,F('gummischwarz'),'lackMetall'); S.box(0.02,0.04,0.3,s*0.66,0.18,0,F('tiefschwarz'),'lackMetall'); }
  S.zyl(0.035,0.035,0.08,seg,0.5,0.3,0.3,F('signalorange'),'leucht');
  S.box(0.012,0.05,0.18,0.656,0.2,-0.2,F('signalblau'),'leucht');
  const meshes=S.fertig(g,{bauteil:'fts'});
  const deck=new THREE.Group(); deck.position.y=0.27; g.add(deck);
  const Sd=bk.sammler({bauteil:'fts'}); Sd.box(1.1,0.03,0.7,0,0.015,0,F('silbergrau'),'stahl'); meshes.push(...Sd.fertig(deck,{bauteil:'fts'}));
  return {g,deck,meshes,set(h){ deck.position.y=0.27+0.06*Math.max(0,Math.min(1,h)); }};
};

/* ---------- Handhubwagen (15.10.2026, DDL-Fahrer; Doku baukasten.md) ----------
   Gabeln zeigen nach -z (Spitze bei z -1,15), Deichsel nach +z, Ursprung = Gabelfuss auf dem Boden. Die Masse passen in die
   Taschen der Europalette (bk.PALETTE euro: Taschen bei +-0,186, breit 0,2275, Hoehe 0,1): Gabelmitte +-0,186, Breite 0,15, Hoehe 0,075,
   Hub 0,08. Rueckgabe {g, lift (Gabeln), deichsel (Gruppe), hub(0..1), winkel(phi), griff(phi)->{y,z}}: der Handgriff liegt in Ruhe bei
   (griffY, griffZ) ueber dem Gabelfuss; phi dreht die Deichsel um ihr Lager (negativ = Griff hoch, Pumpen). */
bk.HUBWAGEN={gabelX:0.186,gabelB:0.15,gabelL:1.15,gabelH:0.075,hub:0.08,lagerY:0.26,lagerZ:0.12,griffY:1.16,griffZ:0.62};
bk.hubwagen=function(o){
  o=o||{}; const F=MAT.farbe, K=bk.HUBWAGEN, seg=[6,10,14][bk.lod()];
  const g=new THREE.Group(); g.position.set(o.x||0,o.y||0,o.z||0); g.rotation.y=o.ry||0; g.userData.bauteil='hubwagen'; (o.parent||scene).add(g);
  const form={fase:0.01,faseMin:0.04,seg:1,lod0Kasten:true}, meshes=[];
  /* Gestell am Boden: Gehaeuse (Pumpe) rot, Lenkraeder unter dem Fuss, Lastrollen an den Gabelspitzen */
  const Sg=bk.sammler({form,bauteil:'hubwagen'});
  Sg.box(0.3,0.2,0.2,0,0.2,K.lagerZ-0.02,F('signalrot'),'lackMetall');
  for(const sx of [-1,1]){
    Sg.zyl(0.09,0.09,0.05,seg,sx*0.07,0.09,0.12,F('gummischwarz'),'matt',0,0,Math.PI/2);
    Sg.zyl(0.04,0.04,0.075,seg,sx*K.gabelX,0.04,-K.gabelL+0.06,F('gummischwarz'),'matt',0,0,Math.PI/2); }
  Sg.box(0.09,0.05,0.14,0,0.12,0.12,F('graphit'),'lackMetall');
  meshes.push(...Sg.fertig(g,{bauteil:'hubwagen'}));
  /* Gabeln samt Fuss heben sich */
  const lift=new THREE.Group(); g.add(lift);
  const Sl=bk.sammler({form,bauteil:'hubwagen'}), gl=K.gabelL-0.1;
  for(const sx of [-1,1]){
    Sl.box(K.gabelB,K.gabelH,gl,sx*K.gabelX,0.012+K.gabelH/2,-gl/2-0.02,F('anthrazit'),'lackMetall');
    Sl.box(K.gabelB-0.04,K.gabelH-0.03,0.1,sx*K.gabelX,0.012+K.gabelH/2-0.012,-gl-0.07,F('anthrazit'),'lackMetall'); }
  Sl.box(2*K.gabelX+K.gabelB,0.08,0.1,0,0.012+0.04,0.04,F('anthrazit'),'lackMetall');
  meshes.push(...Sl.fertig(lift,{bauteil:'hubwagen'}));
  /* Deichsel: Rohr verzinkt, Handgriff mit Gummigriffen, roter Hebel (Senken) */
  const deichsel=new THREE.Group(); deichsel.position.set(0,K.lagerY,K.lagerZ); g.add(deichsel);
  const dy=K.griffY-K.lagerY, dz=K.griffZ-K.lagerZ, dl=Math.hypot(dy,dz), th=Math.atan2(dz,dy);
  const Sd=bk.sammler({form,bauteil:'hubwagen'});
  Sd.zyl(0.016,0.016,dl,seg,0,dy/2,dz/2,F('silbergrau'),'stahl',th,0,0);
  Sd.box(0.4,0.035,0.05,0,dy,dz,F('anthrazit'),'lackMetall');
  for(const sx of [-1,1]){ Sd.zyl(0.022,0.022,0.12,seg,sx*0.17,dy,dz,F('gummischwarz'),'matt',0,0,Math.PI/2); Sd.box(0.03,0.07,0.04,sx*0.2,dy-0.03,dz-0.01,F('anthrazit'),'lackMetall'); }
  Sd.box(0.03,0.035,0.1,0.07,dy-0.05,dz-0.03,F('signalrot'),'lackMetall');
  meshes.push(...Sd.fertig(deichsel,{bauteil:'hubwagen'}));
  return {g,lift,deichsel,meshes,
    hub(h){ lift.position.y=K.hub*Math.max(0,Math.min(1,h)); },
    winkel(phi){ deichsel.rotation.x=phi; },
    griff(phi){ const c=Math.cos(phi), s=Math.sin(phi); return {y:K.lagerY+dy*c-dz*s, z:K.lagerZ+dy*s+dz*c}; }};
};

/* =========================================================
   Werk West (Halle Etappe B, 15.10.2026, docs/halle/plan-1410.md, Referenzfoto docs/uebergabe/produktion-referenz.webp):
   Betonzelle, Tuer, Treppe, Portalgreifer (Alu-Profil), Rohr-Raster, Stationsmaschinen, Erdwall. Doku: baukasten.md §2c.
   Helle Industrie-Optik: Profile Aluminium, Technik Anthrazit, Beton Steingrau, Warnung Signalgelb, Brandschutz Feuerrot.
   ========================================================= */
/* Kasten mit UVs in Metern (Kachel k m, Standard 2,4 wie der Hofbeton): keine gestreckte Textur. ox/oy/oz = Weltlage der Mitte -
   dann laeuft die Koernung ueber aneinanderstossende Stuecke weiter. Direkt im Array (das Testdoppel kennt getX/setXY nicht). */
bk.kastenM=function(w,h,d,k,ox,oy,oz){
  const g=new THREE.BoxGeometry(w,h,d), P=g.attributes.position, N=g.attributes.normal, U=g.attributes.uv, K=k||2.4;
  if(!P||!N||!U||!P.array||!U.array) return g;
  const p=P.array, n=N.array, uv=U.array, X=ox||0, Y=oy||0, Z=oz||0;
  for(let i=0;i<P.count;i++){ const ax=Math.abs(n[i*3]), ay=Math.abs(n[i*3+1]), x=p[i*3]+X, y=p[i*3+1]+Y, z=p[i*3+2]+Z;
    if(ay>0.5){ uv[i*2]=x/K; uv[i*2+1]=z/K; } else if(ax>0.5){ uv[i*2]=z/K; uv[i*2+1]=y/K; } else { uv[i*2]=x/K; uv[i*2+1]=y/K; } }
  U.needsUpdate=true; return g;
};
/* Sammler fuers Werk: Klassen wie bk.sammler, dazu 'beton' (MAT 'betonZelle', UV in Metern), 'scheibe' (MAT 'glasScheibe', ohne
   Schatten), 'rasen' (MAT 'erdwall') */
bk.werkSammler=function(bauteil,form){
  return bk.sammler({form:form||{fase:0.01,faseMin:0.04,lod0Kasten:true},bauteil,
    mats:k=>k==='beton'?MAT.get('betonZelle'):k==='scheibe'?MAT.get('glasScheibe'):k==='rasen'?MAT.get('erdwall'):MAT.vc(k)});
};
/* Balken von Punkt a nach b ([x,y,z]) mit quadratischem Querschnitt d - Streben, Fachwerk, Treppenwangen, Handlaeufe */
const _bkY=new THREE.Vector3(0,1,0);
bk.balken=function(S,a,b,d,farbe,klasse,dz){
  const v=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]), L=v.length(); if(L<1e-4) return S;
  const q=new THREE.Quaternion().setFromUnitVectors(_bkY,v.clone().normalize()), m=new THREE.Matrix4();
  m.compose(new THREE.Vector3((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),q,new THREE.Vector3(1,1,1));
  S.geo(new THREE.BoxGeometry(d,L,dz||d),m,farbe,klasse); return S;
};
/* Lokal -> Welt fuer Teile in einer gedrehten Wand (ry um y): liefert box(w,h,d,lx,y,lz,farbe,klasse) im fremden Sammler */
function _bkLokal(S,x,z,ry){ const c=Math.cos(ry||0), s=Math.sin(ry||0);
  return { P:(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c],
    box:(w,h,d,lx,y,lz,f,k)=>S.box(w,h,d,x+lx*c+lz*s,y,z-lx*s+lz*c,f,k,0,ry||0,0) }; }

/* Drehfluegeltuer (Werk West, bk.drehtuer - Schiebe- und Haustueren stellt der Schritt Tueren um): Stahltuer, Brandschutztuer (T30, Feststellanlage) oder Glastuer. Zarge Anthrazit durch die Wand, Blatt Lichtgrau
   (Brandschutz mit rotem Kennzeichnungsschild), Druecker Stahl, Glastuer Alu-Rahmen mit Scheibe.
   Lokal: Wand laeuft in x (ry 0), Wandnormale z. o = {S (fremder Sammler: Tuer zu und unbeweglich), x, z, ry, breite 1,0, hoehe 2,1,
     dicke (Wand) 0,2, art 'stahl'|'brand'|'glas', anschlag ±1 (Band bei -x | +x), auf ±1 (oeffnet nach +z | -z), offen 0..1, parent}
   -> {g, fluegel, t, set(t01), kollision:{x0,x1,z0,z1} (Oeffnung, Welt - der Aufrufer legt sie an, solange die Tuer zu ist)} */
bk.drehtuer=function(o){
  o=Object.assign({breite:1.0,hoehe:2.1,dicke:0.2,art:'stahl',anschlag:1,auf:1,offen:0,ry:0},o||{});
  const F=MAT.farbe, B=o.breite, H=o.hoehe, D=o.dicke, ANTH=F('anthrazit');
  const blattF=o.art==='glas'?F('aluminium'):F('lichtgrau');
  const zarge=L=>{ for(const s of [-1,1]) L.box(0.06,H+0.03,D+0.04,s*(B/2+0.03),(H+0.03)/2,0,ANTH,'lackMetall');
    L.box(B+0.12,0.06,D+0.04,0,H+0.03,0,ANTH,'lackMetall'); };
  /* Blatt um das Band (lx = Bandseite): Teile relativ zur Bandachse, Blatt laeuft nach +bx */
  const blatt=(L,bx,dz)=>{ const w=B-0.02, cx=bx+w/2*o.anschlag;
    if(o.art==='glas'){ for(const s of [-1,1]) L.box(0.07,H-0.02,0.05,cx+s*(w/2-0.035),(H-0.02)/2,dz,blattF,'lackMetall');
        for(const y of [0.06,H-0.06]) L.box(w,0.1,0.05,cx,y,dz,blattF,'lackMetall');
        L.box(w-0.12,H-0.2,0.012,cx,H/2,dz,F('glasKlar'),'scheibe'); }
    else { L.box(w,H-0.015,0.05,cx,(H-0.015)/2,dz,blattF,'lackMetall');
      if(o.art==='brand') for(const s of [-1,1]) L.box(0.16,0.08,0.004,cx,1.62,dz+s*0.027,F('feuerrot'),'kunststoff'); }
    const gx=cx+o.anschlag*(w/2-0.09);
    for(const s of [-1,1]){ L.box(0.03,0.16,0.012,gx,1.05,dz+s*0.031,F('silbergrau'),'stahl'); L.box(0.13,0.022,0.022,gx-o.anschlag*0.05,1.08,dz+s*0.05,F('silbergrau'),'stahl'); } };
  const c=Math.cos(o.ry), s=Math.sin(o.ry);
  const T={g:null,fluegel:null,t:0,set(){},kollision:null};
  { const ax=Math.abs(c)*(B/2)+Math.abs(s)*(D/2+0.02), az=Math.abs(s)*(B/2)+Math.abs(c)*(D/2+0.02); T.kollision={x0:o.x-ax,x1:o.x+ax,z0:o.z-az,z1:o.z+az}; }
  if(o.S){ const L=_bkLokal(o.S,o.x,o.z,o.ry); zarge(L); blatt(L,-o.anschlag*(B/2-0.01),0); return T; }
  const g=new THREE.Group(); g.position.set(o.x,0,o.z); g.rotation.y=o.ry; g.userData.bauteil='drehtuer'; g.userData.bauteilArt=o.art; (o.parent||scene).add(g);
  const Sz=bk.werkSammler('drehtuer'); zarge(_bkLokal(Sz,0,0,0)); Sz.fertig(g,{bauteil:'drehtuer',fest:true});
  const fl=new THREE.Group(); fl.position.x=-o.anschlag*(B/2-0.01); g.add(fl);
  const Sb=bk.werkSammler('drehtuer'); blatt(_bkLokal(Sb,0,0,0),0,0); Sb.fertig(fl,{bauteil:'drehtuer'});
  T.g=g; T.fluegel=fl;
  T.set=t=>{ T.t=Math.max(0,Math.min(1,t)); fl.rotation.y=-o.auf*o.anschlag*T.t*1.55; };
  T.set(o.offen);
  return T;
};
/* Treppe (Stahl, Werk West: Leitstand-Galerie): gerader Lauf in der Draufsicht von o.von nach o.bis ([x,z], Mitte), y0 -> y1.
   Wangen Anthrazit, Stufen verzinkt mit gelber Kante (Trittkante = Warnung), Gelaender Signalgelb (wie bk.zaun 'gelaender').
   o = {S, von, bis, breite, y0, y1, gelaender:[links,rechts]} -> {stufen, laenge, steigung} */
bk.treppe=function(o){
  const S=o.S, F=MAT.farbe, [ax,az]=o.von, [bx,bz]=o.bis, L=Math.hypot(bx-ax,bz-az), ux=(bx-ax)/L, uz=(bz-az)/L, qx=-uz, qz=ux;
  const y0=o.y0||0, y1=o.y1, H=y1-y0, n=Math.max(2,Math.round(H/0.19)), r=H/n, gg=L/n, B=o.breite||1.0, ry=Math.atan2(ux,uz);
  const GELB=F('signalgelb');
  for(let i=0;i<n;i++){ const t=(i+0.5)*gg, x=ax+ux*t, z=az+uz*t, y=y0+(i+1)*r;
    S.box(B-0.08,0.035,gg+0.02,x,y-0.018,z,F('silbergrau'),'stahl',0,ry,0);
    S.box(B-0.08,0.036,0.04,x+ux*(gg/2-0.01),y-0.017,z+uz*(gg/2-0.01),GELB,'lackMetall',0,ry,0); }
  for(const s of [-1,1]){ const ox=qx*s*(B/2-0.02), oz=qz*s*(B/2-0.02);
    bk.balken(S,[ax+ox-ux*0.05,y0+0.12,az+oz-uz*0.05],[bx+ox,y1-0.05,bz+oz],0.03,F('anthrazit'),'lackMetall',0.24);
    const an=(o.gelaender||[true,true])[s<0?0:1]; if(!an) continue;
    const px=ax+qx*s*(B/2-0.03), pz=az+qz*s*(B/2-0.03);
    for(const t of [0.15,0.5,0.88]){ const x=px+ux*L*t, z=pz+uz*L*t, y=y0+H*t; S.box(0.04,1.0,0.04,x,y+0.5,z,GELB,'lackMetall'); }
    for(const hy of [1.0,0.5]) bk.balken(S,[px,y0+hy,pz],[px+ux*L,y1+hy,pz+uz*L],0.04,GELB,'lackMetall'); }
  return {stufen:n,laenge:L,steigung:H/L};
};
/* Portalgreifer (Alu-Profil 90 x 90 mm wie im Referenzfoto): vier Stuetzen mit Fussplatte, Laengstraeger in x, Bruecke (faehrt in x)
   mit Hubachse (faehrt in y) und Greifer (Zange oder Sauger), Energiekette, Schaltkasten.
   o = {x, z (Mitte), laenge (x), breite (z), hoehe, hub (Weg der Hubachse), greifer 'zange'|'sauger', parent}
   -> {g, bruecke, hub, set(u 0..1 in x, v 0..1 abwaerts), meshes} - bewegt wird von aussen (Schau-Betrieb 05r) */
bk.portalgreifer=function(o){
  const F=MAT.farbe, L=bk.lod(), lx=o.laenge, bz=o.breite, H=o.hoehe||2.2, AL=F('aluminium'), p=0.09, HUB=o.hub||Math.max(0.3,H-1.7);
  const g=new THREE.Group(); g.position.set(o.x,0,o.z); g.userData.bauteil='portalgreifer'; (o.parent||scene).add(g);
  const form={fase:0.006,faseMin:0.03,lod0Kasten:true};
  const S=bk.sammler({form,bauteil:'portalgreifer'});
  for(const sx of [-1,1]) for(const sz of [-1,1]){ const x=sx*(lx/2-p/2), z=sz*(bz/2-p/2); S.box(p,H,p,x,H/2,z,AL,'stahl'); bk.fuss(S,x,z,0.16); }
  for(const sz of [-1,1]){ const z=sz*(bz/2-p/2); S.box(lx,0.12,p,0,H-0.06,z,AL,'stahl');
    if(L>0){ S.box(lx-0.04,0.014,0.006,0,H-0.06,z+sz*(p/2+0.002),F('mittelgrau'),'stahl'); S.box(lx-0.04,0.03,0.04,0,H+0.015,z,F('silbergrau'),'stahl'); } }
  for(const sx of [-1,1]) S.box(p,0.09,bz-2*p,sx*(lx/2-p/2),H-0.045,0,AL,'stahl');
  S.box(lx*0.55,0.05,0.07,-lx*0.2,H+0.055,bz/2-p/2,F('gummischwarz'),'kunststoff');
  S.box(0.3,0.42,0.17,-(lx/2-p/2),1.35,-(bz/2+0.08),F('lichtgrau'),'lackMetall');
  S.box(0.06,0.06,0.02,-(lx/2-p/2)+0.06,1.45,-(bz/2+0.175),F('signalrot'),'kunststoff');
  const meshes=S.fertig(g,{bauteil:'portalgreifer',fest:true});
  const bruecke=new THREE.Group(); bruecke.position.y=H; g.add(bruecke);
  const Sb=bk.sammler({form,bauteil:'portalgreifer'});
  Sb.box(0.16,0.12,bz-0.04,0,0.06,0,AL,'stahl'); Sb.box(0.24,0.22,0.24,0,0.0,0,F('anthrazit'),'lackMetall');
  Sb.zyl(0.06,0.06,0.16,[6,10,12][L],0.0,0.2,0.0,F('mittelgrau'),'lackMetall');
  meshes.push(...Sb.fertig(bruecke,{bauteil:'portalgreifer'}));
  const hub=new THREE.Group(); bruecke.add(hub);
  const Sh=bk.sammler({form,bauteil:'portalgreifer'});
  Sh.box(0.08,1.1,0.08,0,-0.45,0,AL,'stahl'); Sh.box(0.28,0.07,0.2,0,-1.0,0,F('anthrazit'),'lackMetall');
  if(o.greifer==='sauger') for(const sx of [-1,1]) for(const sz of [-1,1]) Sh.zyl(0.03,0.04,0.05,[6,8,10][L],sx*0.08,-1.06,sz*0.06,F('gummischwarz'),'kunststoff');
  else for(const sx of [-1,1]) Sh.box(0.025,0.16,0.08,sx*0.1,-1.1,0,F('silbergrau'),'stahl');
  meshes.push(...Sh.fertig(hub,{bauteil:'portalgreifer'}));
  const R={g,bruecke,hub,meshes,laenge:lx,set(u,v){ if(u!==undefined) bruecke.position.x=(Math.max(0,Math.min(1,u))-0.5)*(lx-2*p-0.2); if(v!==undefined) hub.position.y=-Math.max(0,Math.min(1,v))*HUB; }};
  return R;
};
/* Rohr-Raster (Batterie, wie im Referenzfoto): Alu-Grundplatte, nx x nz Pappe-Rohre (dunkel, innen hell) im Raster, in einen Sammler.
   o = {x, y (Unterkante), z, nx, nz, r (Rohrradius), h (Rohrlaenge), teilung, platte:true} */
bk.rohrraster=function(S,o){
  const F=MAT.farbe, seg=[6,8,12][bk.lod()], r=o.r||0.03, h=o.h||0.3, t=o.teilung||2.6*r, nx=o.nx||6, nz=o.nz||6, y=o.y||0;
  const bx=nx*t+0.06, bz=nz*t+0.06;
  if(o.platte!==false){ S.box(bx,0.03,bz,o.x,y+0.015,o.z,F('aluminium'),'stahl'); S.box(bx-0.04,0.012,bz-0.04,o.x,y+0.036,o.z,F('gummischwarz'),'kunststoff'); }
  const y0=y+(o.platte!==false?0.042:0);
  for(let i=0;i<nx;i++) for(let k=0;k<nz;k++){ const x=o.x+(i-(nx-1)/2)*t, z=o.z+(k-(nz-1)/2)*t;
    S.zyl(r,r,h,seg,x,y0+h/2,z,F('graphit'),'stumpf');
    S.zyl(r*0.8,r*0.8,0.006,seg,x,y0+h-0.002,z,F('wellpappe'),'stumpf'); }
  return S;
};
/* Stationsmaschine auf Alu-Gestell ueber dem Band (Werk West, 21 Stationen aus wenigen Arten - Parameter statt Kopie).
   o = {art, x, z (Mitte), y (Oberkante Band), laenge (x), breite (z)} in einen Sammler. Arten:
   'magazin' Huelsen-/Halbschalen-Magazin mit Rutsche, 'presse' Presse (hydraulisch), 'fuell' Dosierer mit Trichter (Satz, Sterne,
   Ladung), 'zuendschnur' Spule mit Zufuehrung, 'pruef' Waage + Kamerabruecke + Bildschirm, 'verpack' Kartonierer mit Sichtfenster,
   'wickler' Wickelautomat (Ring + Papierrolle), 'tunnel' Trockentunnel (Gehaeuse mit Luefter), 'banderole' Etikettierer,
   'spritz' Einspritzkopf (Zuendschnur in die Bodenplatte), 'verdaemm' Verdaemmen und Deckel (Trichter + Pressplatte),
   'schutz' nur die Schutzumhausung (Station mit Portalgreifer).
   o.schutz = Abstand der Schutzumhausung von der Bandmitte (m, z. B. 1,45): Alu-Profil-Rahmen mit Polycarbonat-Scheiben 0,2-1,9 m an
   beiden Gangseiten, Stirnseiten offen fuer das Band (Feinschliff 15.10., wie die Alu-Gestelle im Referenzfoto). */
bk.maschine=function(S,o){
  const F=MAT.farbe, L=bk.lod(), seg=[6,10,14][L], AL=F('aluminium'), ANTH=F('anthrazit'), x=o.x, z=o.z, y=o.y||0.9, lx=o.laenge||2.2, bz=o.breite||1.6, p=0.07;
  /* Gestell: vier Alu-Stuetzen bis 2,1 m, Rahmen oben (alle Arten ausser Tunnel/Wickler) */
  const gestell=(h,w,d)=>{ for(const sx of [-1,1]) for(const sz of [-1,1]){ S.box(p,h,p,x+sx*(w/2-p/2),h/2,z+sz*(d/2-p/2),AL,'stahl'); bk.fuss(S,x+sx*(w/2-p/2),z+sz*(d/2-p/2),0.14); }
    for(const sz of [-1,1]) S.box(w,0.08,p,x,h-0.04,z+sz*(d/2-p/2),AL,'stahl'); for(const sx of [-1,1]) S.box(p,0.08,d,x+sx*(w/2-p/2),h-0.04,z,AL,'stahl'); };
  const kasten=(w,h,d,xx,yy,zz,f,k)=>S.box(w,h,d,xx,yy,zz,f||F('lichtgrau'),k||'lackMetall');
  switch(o.art){
    case 'magazin': gestell(2.0,lx*0.7,bz);
      kasten(lx*0.5,0.7,0.5,x,1.6,z-bz*0.25); bk.balken(S,[x,1.3,z-bz*0.2],[x,y+0.15,z],0.06,AL,'stahl',0.4);
      for(let i=0;i<5;i++) S.zyl(0.03,0.03,0.42,seg,x-0.16+i*0.08,1.62,z-bz*0.25,F('wellpappe'),'stumpf',Math.PI/2,0,0); break;
    case 'presse': kasten(0.9,0.3,0.9,x,2.55,z,ANTH); for(const sx of [-1,1]) for(const sz of [-1,1]) S.zyl(0.05,0.05,2.5,seg,x+sx*0.36,1.25,z+sz*0.36,F('silbergrau'),'blank');
      S.zyl(0.11,0.11,0.8,seg,x,2.0,z,F('silbergrau'),'blank'); kasten(0.5,0.12,0.5,x,y+0.5,z,ANTH,'stahl'); kasten(0.95,0.08,0.95,x,0.04,z,ANTH,'stahl');
      kasten(0.4,0.6,0.3,x+0.65,0.3,z-0.4,F('signalblau'),'lackMetall'); break;
    case 'fuell': gestell(2.3,lx*0.7,bz*0.8);
      S.zyl(0.32,0.08,0.55,seg,x,1.65,z,F('hellgrau'),'blank'); S.zyl(0.32,0.32,0.4,seg,x,2.1,z,F('hellgrau'),'blank');
      S.zyl(0.05,0.05,0.4,seg,x,y+0.45,z,F('silbergrau'),'stahl'); kasten(0.3,0.18,0.3,x,1.3,z,ANTH); break;
    case 'zuendschnur': gestell(1.8,lx*0.6,bz*0.7);
      S.zyl(0.22,0.22,0.12,seg+4,x-0.2,1.45,z-bz*0.2,F('feuerrot'),'kunststoff',Math.PI/2,0,0); S.zyl(0.05,0.05,0.16,seg,x-0.2,1.45,z-bz*0.2,ANTH,'stahl',Math.PI/2,0,0);
      bk.balken(S,[x-0.2,1.25,z-bz*0.2],[x+0.1,y+0.25,z],0.02,F('gummischwarz'),'kunststoff'); kasten(0.3,0.2,0.3,x+0.15,y+0.42,z,ANTH); break;
    case 'pruef': gestell(2.1,lx*0.6,bz*0.9);
      kasten(0.7,0.08,0.7,x,y+0.02,z,F('silbergrau'),'stahl'); kasten(0.18,0.12,0.12,x,1.95,z,ANTH); S.zyl(0.035,0.035,0.06,seg,x,1.86,z,F('tiefschwarz'),'blank');
      kasten(0.04,0.4,0.55,x+lx*0.3,1.55,z+bz*0.48,ANTH); kasten(0.01,0.32,0.47,x+lx*0.3-0.025,1.55,z+bz*0.48,F('signalblau'),'leucht'); break;
    case 'verpack': kasten(lx*0.8,1.9,bz*0.95,x,0.95,z);
      S.box(lx*0.5,0.8,0.01,x,1.2,z+bz*0.475+0.004,F('glasKlar'),'scheibe'); S.box(lx*0.5,0.8,0.01,x,1.2,z-bz*0.475-0.004,F('glasKlar'),'scheibe');
      kasten(lx*0.8+0.04,0.08,bz*0.95+0.04,x,1.92,z,ANTH); for(let i=0;i<6;i++) kasten(0.5,0.012,0.4,x-lx*0.55,0.6+i*0.015,z-bz*0.2,F('wellpappe'),'stumpf');
      kasten(0.07,0.07,0.07,x+lx*0.4-0.1,1.7,z+bz*0.475+0.03,F('signalgruen'),'leucht'); break;
    case 'wickler': gestell(1.9,lx*0.5,bz*0.9);
      S.geo(new THREE.TorusGeometry(0.42,0.05,[6,8,10][L],[12,20,28][L]),tm(x,y+0.35,z,0,Math.PI/2,0),ANTH,'lackMetall');
      S.zyl(0.16,0.16,0.3,seg,x,1.5,z-bz*0.3,F('weiss'),'stumpf',Math.PI/2,0,0); break;
    case 'tunnel': kasten(lx*0.96,1.05,bz*0.85,x,y+0.45,z);
      kasten(lx*0.96+0.04,0.06,bz*0.85+0.04,x,y+1.0,z,ANTH); for(let i=-1;i<=1;i++) S.zyl(0.2,0.2,0.18,seg,x+i*lx*0.3,y+1.12,z,F('mittelgrau'),'lackMetall');
      for(let i=-1;i<=1;i+=2) kasten(0.012,0.9,bz*0.6,x+i*lx*0.48,y+0.4,z,F('gummischwarz'),'kunststoff');
      kasten(0.14,0.14,0.02,x,y+0.75,z+bz*0.425+0.012,F('signalorange'),'leucht'); break;
    case 'banderole': gestell(1.7,lx*0.5,bz*0.8);
      S.zyl(0.18,0.18,0.1,seg+4,x,1.35,z-bz*0.25,F('weiss'),'stumpf'); S.zyl(0.06,0.06,0.12,seg,x,1.35,z-bz*0.25,ANTH,'stahl');
      kasten(0.25,0.3,0.2,x+0.2,y+0.55,z,ANTH); break;
    case 'spritz': gestell(2.0,lx*0.6,bz*0.8);
      kasten(0.5,0.3,0.4,x,1.6,z,ANTH); for(let i=0;i<4;i++) S.zyl(0.015,0.015,0.5,seg,x-0.12+i*0.08,1.2,z,F('silbergrau'),'blank');
      S.zyl(0.12,0.12,0.5,seg,x+0.5,1.4,z-bz*0.3,F('feuerrot'),'kunststoff'); break;
    case 'verdaemm': gestell(2.1,lx*0.6,bz*0.8);
      S.zyl(0.28,0.07,0.5,seg,x-0.25,1.65,z,F('hellgrau'),'blank'); kasten(0.5,0.06,0.5,x+0.25,y+0.6,z,F('silbergrau'),'stahl');
      S.zyl(0.06,0.06,0.6,seg,x+0.25,1.2,z,F('silbergrau'),'blank'); break;
    case 'schutz': break;
    default: throw new Error('bk.maschine: Art unbekannt: '+o.art);
  }
  if(o.schutz){ const zs=o.schutz, hx=lx/2-0.06, n=Math.max(1,Math.round(lx/1.3));
    for(const sz of [-1,1]){ const zz=z+sz*zs;
      for(let i=0;i<=n;i++){ const xx=x-hx+i*2*hx/n; S.box(0.045,1.95,0.045,xx,0.975,zz,AL,'stahl'); bk.fuss(S,xx,zz,0.1); }
      for(const y of [0.2,1.06,1.93]) S.box(2*hx,0.04,0.045,x,y,zz,AL,'stahl');
      S.box(2*hx-0.05,1.68,0.006,x,1.065,zz,F('glasKlar'),'scheibe'); } }
  return S;
};
/* Erdwall (Schutzwall um das Mischhaus): Ring mit Trapez-Querschnitt um ein Rechteck (aussen x0..x1 / z0..z1): Fuss o.fuss (3 m),
   Krone o.krone (0,8 m), Hoehe o.hoehe (4 m); Ecken auf Gehrung. Luecke in einer Seite (Zugang), Stirnflaechen als Beton-Stuetzwand,
   davor versetzt eine Prallwand (Beton), damit kein gerader Weg nach aussen fuehrt. Oberflaeche Winterwiese (MAT 'erdwall', UV in
   Metern / 4). o = {x0,x1,z0,z1, hoehe, fuss, krone, luecke:{seite:'s'|'n'|'w'|'o', von, bis (Weltkoordinate laengs)}, prallwand:true, parent}
   -> {meshes, kollision:[{x0,x1,z0,z1}]} */
bk.erdwall=function(o){
  const H=o.hoehe||4, f=o.fuss||3, c=o.krone||0.8, a=(f-c)/2, K=4, S=bk.werkSammler('erdwall');
  const prof=[[0,0],[a,H],[a+c,H],[f,0]];
  const SEITEN={s:{O:[o.x0,o.z0],A:[1,0],N:[0,1],L:o.x1-o.x0},o:{O:[o.x1,o.z0],A:[0,1],N:[-1,0],L:o.z1-o.z0},
                n:{O:[o.x1,o.z1],A:[-1,0],N:[0,-1],L:o.x1-o.x0},w:{O:[o.x0,o.z1],A:[0,-1],N:[1,0],L:o.z1-o.z0}};
  const pos=[], nor=[], uv=[], kol=[];
  const tri=(p,n,u)=>{ for(let i=0;i<3;i++){ pos.push(...p[i]); nor.push(...n); uv.push(...u[i]); } };
  const quad=(p,n,u)=>{ /* p0..p3 im Kreis; Wicklung nach der Normale richten */
    const e1=[p[1][0]-p[0][0],p[1][1]-p[0][1],p[1][2]-p[0][2]], e2=[p[2][0]-p[0][0],p[2][1]-p[0][1],p[2][2]-p[0][2]];
    const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]], ok=cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]>0;
    const q=ok?[0,1,2,0,2,3]:[0,2,1,0,3,2]; for(let k=0;k<6;k+=3) tri([p[q[k]],p[q[k+1]],p[q[k+2]]],n,[u[q[k]],u[q[k+1]],u[q[k+2]]]); };
  for(const id in SEITEN){ const Sd=SEITEN[id], [Ox,Oz]=Sd.O, [Ax,Az]=Sd.A, [Nx,Nz]=Sd.N;
    const P=(t,u,y)=>[Ox+Ax*t+Nx*u,y,Oz+Az*t+Nz*u];
    let teile=[[0,Sd.L]];
    if(o.luecke&&o.luecke.seite===id){ const t0=Math.abs(Ax)>0.5?(o.luecke.von-Ox)*Ax:(o.luecke.von-Oz)*Az, t1=Math.abs(Ax)>0.5?(o.luecke.bis-Ox)*Ax:(o.luecke.bis-Oz)*Az;
      const g0=Math.min(t0,t1), g1=Math.max(t0,t1); teile=[[0,g0],[g1,Sd.L]]; }
    for(const [ta,tb] of teile){ if(tb-ta<0.1) continue;
      const lo=u=>ta===0?ta+u:ta, hi=u=>tb===Sd.L?tb-u:tb;
      for(let i=0;i<3;i++){ const [u0,y0]=prof[i], [u1,y1]=prof[i+1], du=u1-u0, dy=y1-y0, nl=Math.hypot(du,dy), nu=-dy/nl, ny=du/nl;
        const n=[Nx*nu,ny,Nz*nu], s0=0, s1=nl;
        const p=[P(lo(u0),u0,y0),P(hi(u0),u0,y0),P(hi(u1),u1,y1),P(lo(u1),u1,y1)];
        quad(p,n,[[lo(u0)/K,s0/K],[hi(u0)/K,s0/K],[hi(u1)/K,s1/K],[lo(u1)/K,s1/K]]); }
      /* Stirnflaechen an der Luecke: Beton-Stuetzwand */
      for(const [t,sg] of [[ta,-1],[tb,1]]){ if(t===0||t===Sd.L) continue;
        const q=prof.map(([u,y])=>P(t,u,y)), nn=[Ax*sg,0,Az*sg];   /* zeigt in die Luecke */
        const geo=new THREE.BufferGeometry(), arr=[], nrm=[], uvs=[];
        const tr=(a2,b2,c2)=>{ const e1=[b2[0]-a2[0],b2[1]-a2[1],b2[2]-a2[2]], e2=[c2[0]-a2[0],c2[1]-a2[1],c2[2]-a2[2]], cz=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
          const pts=(cz[0]*nn[0]+cz[2]*nn[2])>0?[a2,b2,c2]:[a2,c2,b2]; for(const pp of pts){ arr.push(...pp); nrm.push(...nn); uvs.push((pp[0]*Nx+pp[2]*Nz)/2.4,pp[1]/2.4); } };
        tr(q[0],q[1],q[2]); tr(q[0],q[2],q[3]);
        geo.setAttribute('position',new THREE.Float32BufferAttribute(arr,3)); geo.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
        S.geo(geo,new THREE.Matrix4(),0xffffff,'beton'); }
      const a0=P(ta,0,0), a1=P(tb,f,0); kol.push({x0:Math.min(a0[0],a1[0]),x1:Math.max(a0[0],a1[0]),z0:Math.min(a0[2],a1[2]),z1:Math.max(a0[2],a1[2])}); } }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  S.geo(geo,new THREE.Matrix4(),0xffffff,'rasen');
  /* Prallwand vor der Luecke (Beton 30 cm, 2,6 m hoch, 2,2 m vor dem Wallfuss): deckt die Luecke ganz und je 1 m daneben - kein
     gerader Weg und keine Sichtlinie nach aussen, Zugang seitlich versetzt zwischen Wall und Prallwand (Feinschliff 15.10.; vorher
     deckte sie nur den Ostteil der Luecke und war im Werk abgeschaltet) */
  if(o.luecke&&o.prallwand!==false&&o.luecke.seite==='s'){ const g0=Math.min(o.luecke.von,o.luecke.bis), g1=Math.max(o.luecke.von,o.luecke.bis), zz=o.z0-2.2, x0=g0-1.0, x1=g1+1.0;
    S.geo(bk.kastenM(x1-x0,2.6,0.3,2.4,(x0+x1)/2,1.3,zz),tm((x0+x1)/2,1.3,zz),0xffffff,'beton'); kol.push({x0,x1,z0:zz-0.15,z1:zz+0.15}); }
  const meshes=S.fertig(o.parent||scene,{bauteil:'erdwall',fest:true});
  return {meshes,kollision:kol};
};
/* Betonzelle (mannlose Station im Werk, "laeuft die Maschine, ist kein Mensch drin"): Waende 25 cm, Ausblasdach
   (leichte Platten auf Stahlrahmen, blaest bei einer Verpuffung nach oben aus), Durchreiche mit Klappe (Feuerrot, Brandschutzabschluss,
   Rahmen Signalgelb = bewegtes Teil) in beiden Stirnwaenden fuer das Band, zwei versetzte Stahltueren (nie gegenueber), Kupferplatte
   (Entladen) und Ampel an jeder Tuer, leitfaehiger Gummiboden innen, Zellenschild. Alles in den Sammler o.S (bk.werkSammler) - eine
   ganze Straße = wenige Meshes.
   o = {S, x0,x1,z0,z1, h 4,0, d 0,25, band:{z,y0,y1,b}, tueren:[{seite:+1 (z1)|-1 (z0), x}], leuchten:{rot:[],gruen:[]} (Geometrien der
   Ampeln, der Aufrufer schaltet sie je Straße ueber MAT.neu), schild:{text,unter}, parent (Schild),
   wand 'beton' (Sichtbeton Steingrau, Chemie-Boxen, Satz-Bunker, Mischhaus) | 'paneel' (beschichtet Lichtgrau mit Fugen, Sockel
   Steingrau 30 cm - Fertigungszellen der Straßen, Feinschliff 15.10.: hell wie im Referenzfoto),
   fenster true|{b 0,6, h 0,42, y 1,3} (Panzerglas-Sichtfenster je Laengswand, gegenueber der Tuer versetzt), kamera true (Kamera
   ueber der Durchreiche West, schaut auf die Klappe)}
   -> {kollision:{x0,x1,z0,z1}, tueren:[{x,z,seite}]} */
bk.zelle=function(o){
  const S=o.S, F=MAT.farbe, d=o.d||0.25, h=o.h||4.0, x0=o.x0, x1=o.x1, z0=o.z0, z1=o.z1, L=bk.lod(), seg=[6,10,12][L];
  const B=o.band===false?null:(o.band||{z:(z0+z1)/2,y0:0.45,y1:1.35,b:0.9});
  const P=o.wand==='paneel', SO=0.3, fen=o.fenster?Object.assign({b:0.6,h:0.42,y:1.3},o.fenster===true?{}:o.fenster):null;
  /* Wandstueck: Sichtbeton (UV in Metern) oder Paneel Lichtgrau mit Sockel Steingrau (nur Stuecke, die auf dem Boden stehen) */
  const W=(w,hh,dd,x,y,z)=>{ if(!(w>0.005&&hh>0.005&&dd>0.005)) return;
    if(!P){ S.geo(bk.kastenM(w,hh,dd,2.4,x,y,z),tm(x,y,z),0xffffff,'beton'); return; }
    S.geo(new THREE.BoxGeometry(w,hh,dd),tm(x,y,z),F('lichtgrau'),'kunststoff');
    if(y-hh/2<0.01){ const sh=Math.min(SO,hh), lang=w>=dd; S.geo(new THREE.BoxGeometry(w+(lang?0:0.016),sh,dd+(lang?0.016:0)),tm(x,sh/2,z),F('steingrau'),'matt'); } };
  /* Paneelfuge (senkrecht, beidseitig): achse 'x' = Wand laeuft in x */
  const fuge=(achse,lage,xw)=>{ if(!P||!L) return; const fh=h-SO-0.04, fy=SO+0.02+fh/2;
    if(achse==='x') S.geo(new THREE.BoxGeometry(0.014,fh,d+0.008),tm(lage,fy,xw),F('hellgrau'),'kunststoff');
    else S.geo(new THREE.BoxGeometry(d+0.008,fh,0.014),tm(xw,fy,lage),F('hellgrau'),'kunststoff'); };
  /* Wand mit Oeffnungen (Tuer, Fenster): von a bis b laengs, Oeffnungen {a,b,y0,y1}; achse 'x' (Wand bei z=w) | 'z' (Wand bei x=w) */
  const wandMit=(achse,w,a,b,off)=>{ off=off.slice().sort((p,q)=>p.a-q.a); let c=a;
    const st=(l,hh,m,y)=>achse==='x'?W(l,hh,d,m,y,w):W(d,hh,l,w,y,m);
    for(const q of off){ st(q.a-c,h,(c+q.a)/2,h/2); if(q.y0>0) st(q.b-q.a,q.y0,(q.a+q.b)/2,q.y0/2); st(q.b-q.a,h-q.y1,(q.a+q.b)/2,(q.y1+h)/2); c=q.b; }
    st(b-c,h,(c+b)/2,h/2); };
  const out={kollision:{x0,x1,z0,z1},tueren:[]};
  /* Ampel und Kupferplatte vor einer Tuer (Mitte t, Normale nach aussen n=[nx,nz]) */
  const vorTuer=(tx,tz,nx,nz,quer)=>{ const ry=Math.atan2(nx,nz);
    S.box(0.9,0.008,0.6,tx+nx*0.32,0.004,tz+nz*0.32,F('kupfer'),'blank',0,ry,0);
    const ax=tx+quer[0]*0.69+nx*0.045, az=tz+quer[1]*0.69+nz*0.045;
    S.box(0.13,0.32,0.08,ax,2.2,az,F('anthrazit'),'lackMetall',0,ry,0);
    if(o.leuchten) for(const [k,y] of [['rot',2.28],['gruen',2.12]]) o.leuchten[k].push({geo:new THREE.CylinderGeometry(0.045,0.045,0.03,seg),m:Math.abs(nx)>0.5?tm(ax+nx*0.045,y,az,0,0,Math.PI/2):tm(ax,y,az+nz*0.045,Math.PI/2,0,0),color:0xffffff}); };
  /* geschlossene Stirnwaende (Chemie-Box, Satz-Bunker), auf Wunsch mit Tuer (seite 'w'|'o', z) */
  if(!B) for(const xw of [x0+d/2,x1-d/2]){ const id=xw<(x0+x1)/2?'w':'o', t=(o.tueren||[]).find(q=>q.seite===id);
    if(!t){ W(d,h,z1-z0,xw,h/2,(z0+z1)/2); continue; }
    const tb=0.9, th=2.05, ta=t.z-tb/2, te=t.z+tb/2;
    W(d,h,ta-z0,xw,h/2,(z0+ta)/2); W(d,h,z1-te,xw,h/2,(te+z1)/2); W(d,h-th,tb,xw,(th+h)/2,t.z);
    bk.drehtuer({S,x:xw,z:t.z,ry:Math.PI/2,breite:tb,hoehe:th,dicke:d,art:'stahl'});
    const nx=id==='w'?-1:1; vorTuer(xw+nx*d/2,t.z,nx,0,[0,1]); out.tueren.push({x:xw,z:t.z,seite:id}); }
  /* Stirnwaende mit Durchreiche, Rahmen (Signalgelb) und Klappe (offen, pneumatisch) */
  if(B) for(const xw of [x0+d/2,x1-d/2]){ const za=B.z-B.b/2, zb=B.z+B.b/2, s=xw<(x0+x1)/2?-1:1, xa=xw+s*(d/2+0.013), kl=B.y1-B.y0, a=1.2;
    wandMit('z',xw,z0,z1,[{a:za,b:zb,y0:B.y0,y1:B.y1}]);
    for(const zf of [B.z-1.0,B.z+1.0]) if(zf>z0+d+0.1&&zf<z1-d-0.1) fuge('z',zf,xw);
    for(const z of [za-0.03,zb+0.03]) S.box(0.03,kl+0.12,0.06,xa,(B.y0+B.y1)/2,z,F('signalgelb'),'lackMetall');
    for(const y of [B.y0-0.03,B.y1+0.03]) S.box(0.03,0.06,B.b+0.12,xa,y,B.z,F('signalgelb'),'lackMetall');
    S.box(0.025,kl,B.b-0.02,xa+s*Math.sin(a)*kl/2,B.y1+0.03-Math.cos(a)*kl/2,B.z,F('feuerrot'),'lackMetall',0,0,s*a);
    S.zyl(0.025,0.025,0.5,seg,xa+s*0.16,B.y1+0.32,B.z-B.b/2+0.06,F('aluminium'),'blank',0,0,-s*0.7);
    /* Kamera ueber der Durchreiche West: Ausleger, Gehaeuse nach unten auf die Klappe geneigt, Objektiv */
    if(o.kamera&&s<0){ const ky=Math.min(h-0.3,B.y1+1.0), kz=B.z+B.b/2+0.3, kx=xw-d/2;
      S.box(0.16,0.04,0.04,kx-0.08,ky+0.07,kz,F('anthrazit'),'lackMetall');
      S.box(0.24,0.1,0.11,kx-0.2,ky,kz,F('lichtgrau'),'kunststoff',0,0,0.45);
      S.zyl(0.035,0.035,0.03,seg,kx-0.31,ky-0.055,kz,F('tiefschwarz'),'kunststoff',0,0,Math.PI/2+0.45); } }
  /* Laengswaende mit je einer Tuer (versetzt) und dem Sichtfenster am anderen Ende */
  for(const zw of [z0+d/2,z1-d/2]){ const seite=zw>(z0+z1)/2?1:-1, t=(o.tueren||[]).find(q=>q.seite===seite), xa=x0+d, xb=x1-d;
    if(!t){ W(xb-xa,h,d,(xa+xb)/2,h/2,zw); continue; }
    const tb=0.9, th=2.05, off=[{a:t.x-tb/2,b:t.x+tb/2,y0:0,y1:th}], wx=x0+x1-t.x;
    if(fen) off.push({a:wx-fen.b/2,b:wx+fen.b/2,y0:fen.y,y1:fen.y+fen.h});
    wandMit('x',zw,xa,xb,off);
    if(P){ const xm=(x0+x1)/2; if(!off.some(q=>xm>q.a-0.05&&xm<q.b+0.05)) fuge('x',xm,zw); }
    if(fen){ const fy=fen.y+fen.h/2;
      S.box(fen.b,fen.h,0.03,wx,fy,zw,F('glasKlar'),'scheibe');
      for(const sz of [-1,1]){ const zf=zw+sz*(d/2+0.012);
        for(const y of [fen.y-0.03,fen.y+fen.h+0.03]) S.box(fen.b+0.12,0.06,0.025,wx,y,zf,F('anthrazit'),'lackMetall');
        for(const x of [wx-fen.b/2-0.03,wx+fen.b/2+0.03]) S.box(0.06,fen.h,0.025,x,fy,zf,F('anthrazit'),'lackMetall'); } }
    bk.drehtuer({S,x:t.x,z:zw,ry:0,breite:tb,hoehe:th,dicke:d,art:'stahl',anschlag:t.x<(x0+x1)/2?1:-1});
    const zo=zw+seite*(d/2);
    vorTuer(t.x,zo,0,seite,[t.x<(x0+x1)/2?1:-1,0]);
    if(o.schild&&seite>0) bk.schild(o.parent||scene,{text:o.schild.text,unter:o.schild.unter,b:1.25,h:0.4,x:(x0+x1)/2,y:Math.min(th+0.75,h-0.25),z:zo+0.012,ry:0});
    out.tueren.push({x:t.x,z:zw,seite}); }
  /* Ausblasdach: Stahlrahmen auf der Wandkrone, zwei leichte Platten, Mittelpfette */
  for(const z of [z0+0.06,z1-0.06]) S.box(x1-x0,0.12,0.12,(x0+x1)/2,h+0.06,z,F('anthrazit'),'stahl');
  for(const x of [x0+0.06,x1-0.06]) S.box(0.12,0.12,z1-z0-0.24,x,h+0.06,(z0+z1)/2,F('anthrazit'),'stahl');
  S.box(x1-x0-0.24,0.1,0.08,(x0+x1)/2,h+0.05,(z0+z1)/2,F('anthrazit'),'stahl');
  const pz=(z1-z0-0.16)/2;
  for(const s of [-1,1]) S.box(x1-x0-0.1,0.05,pz-0.02,(x0+x1)/2,h+0.145,(z0+z1)/2+s*(pz/2+0.01),F('lichtgrau'),'kunststoff');
  /* Gummiboden innen */
  S.box(x1-x0-2*d,0.01,z1-z0-2*d,(x0+x1)/2,0.008,(z0+z1)/2,F('gummischwarz'),'matt');
  return out;
};

/* =========================================================
   Verkaufstisch + Schild-Atlas (Verpackungs-Ausstellung 2.0, 15.10.2026)

   Tom 15.10.: "Verkaufstische hin und jedes Produkt EINMAL drauf, mit dem Namen - dann sage ich dir,
   welche Verpackung nicht passt." Rund 250 Tische mit je einem Schild waeren ohne Baukasten 250 Tische
   (je mehrere Meshes, Texturen) und 250 Schilder. Darum:
   - bk.verkaufstischTeile(K,box)  die Teile des Ladenbau-Tisches (SHELFKIND.tisch / tischgross), EINE
                                   Quelle: bauMoebel (06) und bk.verkaufstisch benutzen sie, Optik wie im Laden
   - bk.verkaufstisch({tische:[{x,z,ry,kind}],parent}) -> {mesh,anzahl,dispose()}  viele Tische = EIN Mesh
                                   (Vertexfarben nach Rolle wie regalFarben, Material gestellMat)
   - bk.schildAtlas({schilde:[{m,b,h}],zelle:{w,h},malen(g,i,w,h),status:{...}}) -> {platte,schrift,set(i,s),...}
                                   viele Schilder = ZWEI Meshes: Platte (Vertexfarbe je Status) und Schrift
                                   (ein Atlas, Zelle je Schild; Statusstreifen tauscht nur die UVs)
   Doku: docs/fundament/baukasten.md (Ausstellung 2.0)
   ========================================================= */
bk.verkaufstischTeile=function(K,box){
  const W=K.w, D=K.d, y=K.lv[K.lv.length-1], iw=W-0.1, st=[];
  st.push({geo:box(W,0.04,D),m:tm(0,y-0.02,0),rolle:'platte'});
  st.push({geo:box(W+0.01,0.02,D+0.01),m:tm(0,y-0.045,0),rolle:'rahmen'});
  for(const sx of [-1,1]) for(const sz of [-1,1]) st.push({geo:box(0.05,y-0.06,0.05),m:tm(sx*(W/2-0.06),(y-0.06)/2,sz*(D/2-0.06)),rolle:'rahmen'});
  for(const sz of [-1,1]) st.push({geo:box(W-0.12,0.08,0.025),m:tm(0,y-0.1,sz*(D/2-0.06)),rolle:'rahmen'});
  for(const sx of [-1,1]) st.push({geo:box(0.025,0.08,D-0.12),m:tm(sx*(W/2-0.06),y-0.1,0),rolle:'rahmen'});
  st.push({geo:box(W-0.14,0.02,D-0.14),m:tm(0,0.16,0),rolle:'platte'});
  for(const sx of [-1,1]) for(const sz of [-1,1]) st.push({geo:box(0.06,0.015,0.06),m:tm(sx*(W/2-0.06),0.008,sz*(D/2-0.06)),rolle:'fuss'});
  st.push({geo:box(iw,0.05,0.014),m:tm(0,y-0.1,D/2-0.04),rolle:'preis'});
  return st;
};
bk.verkaufstisch=function(o){
  const GB={}, box=(w,h,d)=>GB[w+'|'+h+'|'+d]||(GB[w+'|'+h+'|'+d]=new THREE.BoxGeometry(w,h,d)), teile=[];
  for(const T of o.tische){ const K=SHELFKIND[T.kind||'tisch'], RF=regalFarben(K), M=tm(T.x,0,T.z,0,T.ry||0,0);
    for(const q of bk.verkaufstischTeile(K,box)) teile.push({geo:q.geo,m:new THREE.Matrix4().multiplyMatrices(M,q.m),color:RF[q.rolle]}); }
  const geo=merge(teile); for(const k in GB) GB[k].dispose();
  const mesh=new THREE.Mesh(geo,gestellMat()); mesh.userData.bauteil='verkaufstisch';
  (o.parent||scene).add(mesh);
  return {mesh,anzahl:o.tische.length,dispose(){ if(mesh.parent) mesh.parent.remove(mesh); geo.dispose(); }};
};
/* o.schilde[i]={m:Matrix4 (Ebene b x h, Mitte im Ursprung, Blick +z -> Welt), b,h}; o.zelle={w,h} (Pixel der Vorlage),
   o.spalten, o.malen(g,i,w,h) malt Schild i auf TRANSPARENT (Zelle w x h), o.status={w,h (Pixel), hm (Hoehe in m),
   ton:[Palettenton je Status], malen:[fn(g,w,h)]}. set(i,s): Plattenfarbe und Statusstreifen. */
bk.schildAtlas=function(o){
  const n=o.schilde.length, cw=o.zelle.w, ch=o.zelle.h, ST=o.status, cols=o.spalten||12, rows=Math.max(1,Math.ceil(n/cols));
  const sk=Math.max(o.skalaMin||0,Math.min(1,MAT.stufe().tx||1))*(o.skala||1);   /* Schrift bleibt lesbar: auch Ultra Low mindestens skalaMin */
  const Wp=Math.max(64,Math.ceil(Math.max(cols*cw,ST.malen.length*ST.w)*sk)), Hp=Math.ceil((rows*ch+ST.h)*sk);
  const c=document.createElement('canvas'); c.width=Wp; c.height=Hp; const g=c.getContext('2d'); g.scale(sk,sk);
  const zelle=(x,y,w,h,f,a)=>{ g.save(); g.translate(x,y); g.beginPath(); g.rect(0,0,w,h); g.clip(); if(a===undefined) f(g,w,h); else f(g,a,w,h); g.restore(); };
  for(let i=0;i<n;i++) zelle((i%cols)*cw,Math.floor(i/cols)*ch,cw,ch,o.malen,i);
  ST.malen.forEach((f,k)=>zelle(k*ST.w,rows*ch,ST.w,ST.h,f));
  const T=new THREE.CanvasTexture(c); T.anisotropy=GFX_START.ani; T.encoding=THREE.sRGBEncoding;
  const uvR=(x,y,w,h)=>[(x*sk+0.5)/Wp,1-((y+h)*sk-0.5)/Hp,((x+w)*sk-0.5)/Wp,1-(y*sk+0.5)/Hp];
  /* Platte (Rahmen r rundum) und Schrift (Schild + Statusstreifen) als je EIN Mesh */
  const r=o.rand===undefined?0.012:o.rand, PP=new Float32Array(n*12), PN=new Float32Array(n*12), PC=new Float32Array(n*12), PI=new Uint32Array(n*6);
  const SP=new Float32Array(n*24), SN=new Float32Array(n*24), SU=new Float32Array(n*16), SI=new Uint32Array(n*12);
  const v=new THREE.Vector3(), nm=new THREE.Vector3(), nmat=new THREE.Matrix3();
  const ecke=[[-1,-1],[1,-1],[1,1],[-1,1]];
  for(let i=0;i<n;i++){ const S=o.schilde[i], b=S.b, h=S.h; nmat.getNormalMatrix(S.m); nm.set(0,0,1).applyMatrix3(nmat).normalize();
    const quad=(P,N,off,q,hx,y0,y1,z)=>{ for(let k=0;k<4;k++){ v.set(ecke[k][0]*hx,ecke[k][1]<0?y0:y1,z).applyMatrix4(S.m); P.set([v.x,v.y,v.z],(off+k)*3); N.set([nm.x,nm.y,nm.z],(off+k)*3); } };
    quad(PP,PN,i*4,0,b/2+r,-h/2-r,h/2+r,0);
    quad(SP,SN,i*8,0,b/2,-h/2,h/2,0.003);
    quad(SP,SN,i*8+4,0,b/2,-h/2,-h/2+ST.hm,0.0045);
    const c0=uvR((i%cols)*cw,Math.floor(i/cols)*ch,cw,ch); SU.set([c0[0],c0[1],c0[2],c0[1],c0[2],c0[3],c0[0],c0[3]],i*16);
    for(const [I,off] of [[PI,i*4],[SI,i*8],[SI,i*8+4]]){ const base=I===PI?i*6:i*12+(off===i*8?0:6); I.set([off,off+1,off+2,off,off+2,off+3],base); } }
  const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.BufferAttribute(PP,3)); pg.setAttribute('normal',new THREE.BufferAttribute(PN,3)); pg.setAttribute('color',new THREE.BufferAttribute(PC,3)); pg.setIndex(new THREE.BufferAttribute(PI,1));
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(SP,3)); sg.setAttribute('normal',new THREE.BufferAttribute(SN,3)); sg.setAttribute('uv',new THREE.BufferAttribute(SU,2)); sg.setIndex(new THREE.BufferAttribute(SI,1));
  /* ungelit und ohne Tonwert: Schildfarben (Status!) und Schrift sehen bei jedem Licht gleich aus */
  const platte=new THREE.Mesh(pg,MAT.vc('leucht')), mat=MAT.neu('weissMatt',{map:T,emissiveMap:T,emissive:MAT.farbe('weiss'),alphaTest:0.4,toneMapped:false}), schrift=new THREE.Mesh(sg,mat);
  mat.color.setRGB(0,0,0);
  platte.userData.bauteil=schrift.userData.bauteil='schildAtlas';
  const farben=ST.ton.map(t=>LIN(MAT.farbe(t)));
  const A={n,platte,schrift,tex:T,skala:sk,pixel:Wp*Hp,
    set(i,s){ const F=farben[s]; for(let k=0;k<4;k++) PC.set([F.r,F.g,F.b],(i*4+k)*3); pg.attributes.color.needsUpdate=true;
      const u=uvR(s*ST.w,rows*ch,ST.w,ST.h); SU.set([u[0],u[1],u[2],u[1],u[2],u[3],u[0],u[3]],i*16+8); sg.attributes.uv.needsUpdate=true; },
    dispose(){ for(const m of [platte,schrift]) if(m.parent) m.parent.remove(m); pg.dispose(); sg.dispose(); T.dispose(); mat.dispose(); c.width=c.height=0; }};
  for(let i=0;i<n;i++) A.set(i,(o.start&&o.start[i])||0);
  pg.computeBoundingSphere(); sg.computeBoundingSphere();
  (o.parent||scene).add(platte); (o.parent||scene).add(schrift);
  return A;
};
