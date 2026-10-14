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
        const sch=typeof o.schatten==='function'?o.schatten(k):(HIQ&&o.schatten!==false&&k!=='leucht');
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
bk.liste=function(){ return {schildTexturen:_bkSchildT.size,schildMaterialien:_bkSchildM.size}; };

/* =========================================================
   Tor (Fundament Etappe 2, Schritt "Tore" - Pilot des Baukastens, 13.10.)

   Tom 13.10.: "ein Rolltor fuer Anlieferungen sieht ueberall gleich aus; aendert man es an
   einer Stelle, aendert es sich ueberall." Vorher sechs eigene Tor-Bauten (R1 05g, R2-R5
   aussen und innen 05h, V1 11e, Ost-Attrappe 05h, Zauntore 05g/05h) mit drei Torblatt-
   Texturen und vier Ampel-Varianten. Jetzt EINE Implementierung, Unterschiede nur ueber
   Parameter mit Bedeutung (Art, Groesse, Fenster, Nummer, Seite, Beschlag).

   Standard-Optik = V1 (09.10., Tom: "Lamellen, Fuehrungsschienen, Antrieb, Bodendichtung,
   Warnmarkierung"; passt zum Zielbild mit anthraziten Toren und Fensterband) + die Aussen-
   und Innenausstattung von R2-R5 (Zarge, Torabdichtung, Puffer, Vordach, Poller, Torwelle,
   Nummernschild). Begruendung und Parametertabelle: docs/fundament/tore.md

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
     nr:'2'|null (Nummernschild ueber bk.schild), wand:[xAussen,xInnen] (Wandflaechen),
     blatt:x (Ebene des Torblatts), beweglich:false (Attrappe: Blatt fest im Sammler),
     offen:0..1, parent, x,y,z,ry,
     gitter: bewegung:'schiebe'|'fluegel', boden (Luft unten), pfosten, schloss })
   -> T = { g, art, panele:[Mesh], blatt (Mesh bei fuehrung 'vertikal'), zu, auf, t, set(t01),
            ampel:{rot,gruen}|null, warn, kollision:[{x0,x1,z0,z1,art}] (Welt), statisch:[Mesh] }
   Die Spiel-Logik (door, WTORE, VD, Kollision des Blatts, Ampel schalten) bleibt in den
   Huellen (05g, 05h, 11e) - bk.tor baut nur und bewegt das Blatt.
   ========================================================= */
/* UVs eines Kastens auf eine Zeile des Atlas torBlatt legen (0 Lamellen, 1 Fenster, 2 unten, 3 weiss) */
bk.uvZeile=function(geo,zeile){
  const uv=geo.attributes.uv, Z=4, e=2/128;
  for(let i=0;i<uv.count;i++){
    if(zeile===3) uv.setXY(i,0.5,1-3.5/Z);
    else uv.setY(i,1-(zeile+1)/Z+(e+uv.getY(i)*(1-2*e))/Z); }
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
   art 'anfahr' (Standard): Industrie-Anfahrschutz an Toren und Rampen - Signalgelb, Gummikappe,
     zwei Reflexbaender (Vorbild Tor-Poller R2-R5/V1, Zielbild versand-max).
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
  for(const y of [0.55,0.7]) S.box(b+0.008,0.05,b+0.008,x,y0+h-y,z,F('gummischwarz'),'kunststoff');
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
    ampel:'beide',bedien:1,vordach:true,dichtung:true,poller:true,nr:null,wand:[-0.1,0.1],blatt:0,beweglich:true,offen:0,
    bewegung:'schiebe',boden:0.3,pfosten:false,schloss:false,x:0,y:0,z:0,ry:0},o||{});
  const parent=o.parent||scene, W=o.breite, H=o.hoehe, w2=W/2, L=bk.lod(), F=MAT.farbe;
  const seg=[6,10,14][L], roll=o.art==='roll', gitter=o.art==='gitter';
  const aussen=o.seite!=='innen', innen=o.seite!=='aussen';
  const amp=o.ampel===true?'beide':o.ampel, ampA=aussen&&(amp==='beide'||amp==='aussen'), ampI=innen&&(amp==='beide'||amp==='innen');
  const xa=o.wand[0], xi=o.wand[1], xb=o.blatt, bs=o.bedien>=0?1:-1, ad=-bs;
  const STAHL=F('silbergrau'), ANTH=F('anthrazit'), GRAPH=F('graphit'), BASALT=F('basaltgrau'), GELB=F('signalgelb'),
        GUMMI=F('gummischwarz'), WEISS=F('weiss'), LICHT=F('lichtgrau'), MITTEL=F('mittelgrau');
  const g=new THREE.Group(); g.position.set(o.x,o.y,o.z); g.rotation.y=o.ry;
  g.userData.bauteil='tor'; g.userData.bauteilArt=o.art; parent.add(g);
  const MB=MAT.get('torBlatt');
  const S=bk.sammler({form:{fase:0.012,faseMin:0.06,seg:1,lod0Kasten:true},klasse:'stahl',bauteil:'tor',
    mats:{warn:MAT.get('warnschraffur'),blatt:MB}});
  const T={g,art:o.art,o,panele:[],blatt:null,zu:0,auf:0,t:0,ampel:null,warn:null,kollision:[],statisch:[]};
  const lokal=[];                                   /* Kollision lokal -> am Ende in Welt */
  const warnPlatte=(d,h,b,x,y,z)=>S.geo(MAT.kachel(new THREE.BoxGeometry(d,h,b),b/0.4,h/0.4),tm(x,y,z),0xffffff,'warn');
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

  /* ---------- Aussenseite: Zarge mit Warnschraffur, Torabdichtung, Puffer, Vordach, Poller ---------- */
  if(aussen){
    const ZX=xa-0.06;
    /* Warnschraffur unten an der Torkante: auf der Zarge, mit Torabdichtung vorn auf den Polstern (Fahrer-Einweisung) */
    for(const s of [-1,1]){ S.box(0.12,H+0.22,0.18,ZX,(H+0.22)/2,s*(w2+0.09),STAHL); if(!o.dichtung) warnPlatte(0.01,1.0,0.18,xa-0.125,0.5,s*(w2+0.09)); }
    S.box(0.12,0.22,W+0.36,ZX,H+0.11,0,STAHL);
    if(o.dichtung){
      /* Auflieger 2,55 m: die Polster reichen bis 1,35 m an die Mitte und schliessen den Spalt (Plane, Gummi) */
      const pw=Math.max(0.25,w2+0.18-1.35), pc=w2+0.18-pw/2;
      for(const s of [-1,1]){ S.box(0.46,H+0.1,pw,xa-0.23,(H+0.1)/2,s*pc,GUMMI,'matt'); warnPlatte(0.01,1.0,pw,xa-0.465,0.5,s*pc);
        S.box(0.22,0.5,0.28,xa-0.13,1.0,s*(w2+0.32),GUMMI,'matt'); S.box(0.04,0.56,0.32,xa-0.01,1.0,s*(w2+0.32),ANTH,'lackMetall'); }
      S.box(0.46,0.42,W+0.36,xa-0.23,H-0.09,0,GUMMI,'matt');
    }
    if(o.vordach){
      const vx=xa-0.68, vy=H+0.5;
      S.box(1.35,0.1,W+1.2,vx,vy,0,GRAPH,'lackMetall',0,0,0.08);
      S.box(1.38,0.08,W+1.24,vx,vy+0.09,0,WEISS,'matt',0,0,0.08);
      for(const s of [-1,1]) bk.stab(S,xa-0.02,H-0.25,xa-1.22,H+0.4,s*(w2+0.4),0.07,STAHL,'stahl');
    }
    if(o.poller) for(const s of [-1,1]) lokal.push(bk.poller(S,xa-0.72,s*(w2+0.6)));
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
        if(drin) warnPlatte(0.105,1.0,0.15,xx,0.5,z); } }
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
      warnPlatte(0.09,1.0,0.09,SX,0.5,z);
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
  const ampelBau=(innenSeite)=>{
    const f=innenSeite?1:-1, x0=innenSeite?xi:xa, z=bs*(w2+0.42);
    S.box(0.14,0.46,0.2,x0+f*0.07,2.1,z,ANTH,'lackMetall');
    lampen.rot.push(zylGeo(0.055,0.055,0.04,x0+f*0.15,2.22,z,0,0,Math.PI/2));
    lampen.gruen.push(zylGeo(0.055,0.055,0.04,x0+f*0.15,1.98,z,0,0,Math.PI/2));
    for(const y of [2.29,2.05]) S.box(0.06,0.02,0.15,x0+f*0.17,y,z,ANTH,'lackMetall');
    if(innenSeite){ /* Bedienkasten: auf, stopp, zu - daneben Not-Halt */
      S.box(0.12,0.36,0.26,x0+0.06,1.35,z,LICHT,'kunststoff');
      [[0.08,F('signalgruen')],[-0.02,F('signalrot')],[-0.12,GUMMI]].forEach(([dy,c])=>S.zyl(0.022,0.022,0.02,seg,x0+0.13,1.35+dy,z-bs*0.05,c,'kunststoff',0,0,Math.PI/2));
      S.zyl(0.04,0.04,0.03,seg,x0+0.14,1.38,z+bs*0.07,F('signalrot'),'kunststoff',0,0,Math.PI/2);
      S.zyl(0.05,0.05,0.012,seg,x0+0.125,1.38,z+bs*0.07,GELB,'kunststoff',0,0,Math.PI/2); }
  };
  if(o.ampel){ if(ampA) ampelBau(false); if(ampI) ampelBau(true); }
  if(o.nr!==null&&o.nr!==undefined){
    if(aussen) bk.schild(g,{text:String(o.nr),b:0.8,h:0.62,x:xa-0.03,y:H+1.0,z:0,ry:-Math.PI/2});
    if(innen) bk.schild(g,{text:String(o.nr),b:0.62,h:0.48,x:xi+0.02,y:H+0.95,z:0,ry:Math.PI/2});
  }
  /* ---------- Torblatt ---------- */
  const n=o.panele||Math.max(2,Math.round(H/(roll?0.5:0.6))), ph=H/n, D=0.06;
  const fz=o.fenster===false?-1:(typeof o.fenster==='number'?o.fenster:Math.floor(n*0.6));
  const zeile=i=>i===0?2:(i===fz?1:0);
  const panelTeile=(P,i,x,y)=>{ /* ein Panel samt Kleinteilen in den Sammler P, Mitte (x,y) */
    P.geo(bk.uvZeile(new THREE.BoxGeometry(D,ph-(roll?0.008:0.012),roll?W-0.06:W),zeile(i)),tm(x,y,0),0xffffff,'blatt');
    if(!roll&&L>0){ for(const s of [-1,1]){ P.geo(weiss(new THREE.CylinderGeometry(0.03,0.03,0.05,8)),tm(x+D/2+0.03,y-ph/2+0.04,s*(w2-0.04),Math.PI/2),STAHL,'blatt');
        P.geo(weiss(new THREE.BoxGeometry(0.02,0.11,0.16)),tm(x+D/2+0.01,y-ph/2+0.03,s*0.55),STAHL,'blatt'); } }
  };
  const blattSammler=()=>bk.sammler({klasse:'blatt',bauteil:'tor',mats:{blatt:MB}});
  const sch=k=>HIQ;
  if(!o.beweglich){
    for(let i=0;i<n;i++) panelTeile(S,i,xb,ph/2+i*ph);
  } else if(!roll&&o.fuehrung!=='normal'){
    /* senkrecht fahrendes Blatt: EIN Mesh, Mitte auf halber Hoehe (WTORE.blatt, zu/auf wie vorher) */
    const P=blattSammler(); for(let i=0;i<n;i++) panelTeile(P,i,0,-H/2+ph/2+i*ph);
    T.blatt=P.fertig(g,{schatten:sch})[0]; T.blatt.position.set(xb,H/2,0);
    T.zu=H/2; T.auf=H/2+H-0.06; T.panele=[T.blatt];
  } else {
    /* Rolltor und Sektionaltor mit Bogen: ein Mesh je Panel (jedes faehrt eigen) */
    for(let i=0;i<n;i++){ const P=blattSammler(); panelTeile(P,i,0,0); const me=P.fertig(g,{schatten:sch})[0]; me.userData.panel=i; T.panele.push(me); }
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
