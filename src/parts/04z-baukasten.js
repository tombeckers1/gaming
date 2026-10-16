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
/* Schildstile (Einheit 15.10., stilregeln.md §6): Bedeutung waehlt die Farben - nie frei malen.
   haus  = Hausstil Nachtblau, Goldstreifen unten, Schrift hell (Bungee), Unterzeile Gold (Tore, Gassen, Abteilungen, Kassen)
   info  = Hinweis Signalblau, Schrift weiss (Geraete, Lager-PC, Kuehlschrank, Packmittel)
   warn  = Warnung Signalgelb, Schrift und Streifen Gummischwarz (Gefahr, Zutritt, Ladezone)
   tafel = helle Tafel Weiss, Schrift Nachtblau, Streifen Signalblau (Hinweistafeln an Pfosten, Bauschilder)
   brand = Brandschutz Feuerrot, Schrift und Streifen weiss (Brandwand, Feuerschutztor, Sprinkler, Gefahrstoff)
   flucht = Rettungsweg Signalgruen, Schrift und Streifen weiss (Notausgang, Fluchtweg) */
bk.SCHILD={haus:{bg:'nachtblau',streifen:'schildgold',text:'weiss',unter:'schildgold'},info:{bg:'signalblau',streifen:null,text:'weiss',unter:'weiss'},
  warn:{bg:'signalgelb',streifen:'gummischwarz',text:'gummischwarz',unter:'gummischwarz'},tafel:{bg:'weiss',streifen:'signalblau',text:'nachtblau',unter:'signalblau'},
  brand:{bg:'feuerrot',streifen:'weiss',text:'weiss',unter:'weiss'},flucht:{bg:'signalgruen',streifen:'weiss',text:'weiss',unter:'weiss'}};
bk.schildTex=function(o){
  const W=Math.round(o.w||512), H=Math.round(o.h||160), St=bk.SCHILD[o.stil||'haus']||bk.SCHILD.haus;
  const bg=o.bg||MAT.css(St.bg), fg=o.fg||(St.streifen?MAT.css(St.streifen):null), tx=o.textFarbe||MAT.css(St.text), un=o.fg||MAT.css(St.unter);
  const k=[o.text,o.unter||'',bg,fg,tx,W,H].join('|'); let t=_bkSchildT.get(k);
  if(!t){ t=tex(W,H,(g,W2,H2)=>{
      g.fillStyle=bg; g.fillRect(0,0,W2,H2);
      if(fg){ g.fillStyle=fg; g.fillRect(0,H2-8,W2,8); }
      g.textAlign='center'; g.textBaseline='middle'; g.fillStyle=tx;
      fitFont(g,o.text,W2*0.9,o.unter?Math.round(H2*0.42):Math.round(H2*0.55),BUN); g.fillText(o.text,W2/2,o.unter?H2*0.38:H2/2-3);
      if(o.unter){ g.fillStyle=un; fitFont(g,o.unter,W2*0.9,Math.round(H2*0.24),BAR); g.fillText(o.unter,W2/2,H2*0.74); } });
    _bkSchildT.set(k,t); }
  return t;
};
/* bk.schild(parent,{text,unter,stil,b,h,x,y,z,ry,bg,fg,px,leucht,doppel,pfosten,rueck}) -> Mesh (mit pfosten: Gruppe, .userData.flaeche = Mesh).
   Standard: Text im Stil (bk.SCHILD), Textur-Cache je Text+Stil+Groesse, Material je Textur geteilt (nie veraendern).
   Sonderschild: o.malen(g,W,H) malt selbst (Ladenlogo, Carrier-Schild, Kategorie-Marke; o.pw/o.ph Pixel) - mit o.schluessel geteilt,
   sonst eigene Textur und eigenes Material (darf neu gemalt werden: redraw(me.material.map, ...)).
   leucht = unbeleuchtet (Leuchtschild/Anzeige), doppel = beidseitig, rueck = Rueckblech (Tiefe), pfosten = auf zwei Rohrpfosten
   (Hinweis-/Stationsschild: Pfosten Stahl anthrazit mit Fuss und Kappe, Rueckblech, Schrift vorn und hinten; y = Schildmitte) */
bk.schild=function(parent,o){
  let t, geteilt=true;
  if(o.malen){ const W=Math.round(o.pw||512), H=Math.round(o.ph||128), k=o.schluessel?'m:'+o.schluessel+'|'+W+'|'+H:null;
    t=k&&_bkSchildT.get(k); if(!t){ t=tex(W,H,o.malen); if(k) _bkSchildT.set(k,t); else geteilt=false; } }
  else { const px=Math.round(160*(o.px||1)), w=Math.round(px*Math.min(6.4,Math.max(1,o.b/o.h)));
    t=bk.schildTex({text:o.text,unter:o.unter,stil:o.stil,bg:o.bg,fg:o.fg,textFarbe:o.textFarbe,w,h:px}); }
  const x2=(o.doppel||o.pfosten)?{side:THREE.DoubleSide}:undefined, neu=()=>o.leucht?MAT.bild(t,x2):MAT.neu('etikett',Object.assign({map:t},x2||{}));
  let m; if(geteilt){ const mk=(o.leucht?'L':'')+(x2?'D':''); let mm=_bkSchildM.get(t); if(!mm){ mm={}; _bkSchildM.set(t,mm); } m=mm[mk]; if(!m){ m=mm[mk]=neu(); m.userData.mat='schild'; } }
  else m=neu();
  const flaeche=(par,x,y,z,ry)=>{ const me=new THREE.Mesh(new THREE.PlaneGeometry(o.b,o.h),m); me.position.set(x,y,z); me.rotation.y=ry||0; me.userData.bauteil='schild'; par.add(me); return me; };
  if(o.pfosten){ const g=new THREE.Group(); g.position.set(o.x||0,0,o.z||0); g.rotation.y=o.ry||0; g.userData.bauteil='schild'; (parent||scene).add(g);
    const y=o.y||1.2, S=bk.sammler({bauteil:'schild'}), ST=MAT.farbe('anthrazit'), px2=o.b/2-0.06;
    for(const sx of [-px2,px2]){ S.zyl(0.028,0.028,y+o.h/2,10,sx,(y+o.h/2)/2,0,ST,'stahl'); S.box(0.11,0.02,0.11,sx,0.012,0,ST,'stahl'); S.zyl(0.03,0.03,0.02,8,sx,y+o.h/2+0.01,0,ST,'stahl'); }
    S.box(o.b+0.05,o.h+0.05,0.025,0,y,-0.016,MAT.farbe('basaltgrau'),'stahl');
    S.fertig(g);
    const f=flaeche(g,0,y,0.002,0); flaeche(g,0,y,-0.032,Math.PI); g.userData.flaeche=f; return g; }
  if(o.rueck){ const S=bk.sammler({bauteil:'schild'}), c=Math.cos(o.ry||0), sn=Math.sin(o.ry||0);
    S.box(o.b+0.04,o.h+0.04,0.02,(o.x||0)-0.012*sn,o.y||0,(o.z||0)-0.012*c,MAT.farbe(o.rueck===true?'anthrazit':o.rueck),'lackMetall',0,o.ry||0,0); S.fertig(parent||scene,{schatten:false}); }
  return flaeche(parent||scene,o.x||0,o.y||0,o.z||0,o.ry);
};
/* Schild wieder abbauen (zeitweilige Schilder, z. B. Ausstellung 2.0): Mesh, Geometrie, Material und Textur frei, auch aus dem Cache */
bk.schildWeg=function(me){ const m=me.material, t=m&&m.map;
  for(const [k,v] of [..._bkSchildM]) for(const q in v) if(v[q]===m) delete v[q];
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
       (Attrappen Logistikzentrum Ost): die Polster schliessen den Spalt bis an das Heck),
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
/* UV in Metern (wie meterUV): die Tapete ist auf jedem Stueck gleich gross, Naehte fallen weg. cx/cy/cz = Lage der Geometrie-Mitte in der Welt */
function _bkMeterUV(geo,cx,cy,cz){ const p=geo.attributes.position, n=geo.attributes.normal, uv=geo.attributes.uv;
  if(p&&n&&uv&&uv.count===p.count){ for(let i=0;i<p.count;i++){ const x=p.getX(i)+cx, y=p.getY(i)+cy, z=p.getZ(i)+cz, ax=Math.abs(n.getX(i)), ay=Math.abs(n.getY(i)), az=Math.abs(n.getZ(i));
      if(ay>ax&&ay>az) uv.setXY(i,x,z); else if(ax>az) uv.setXY(i,z,y); else uv.setXY(i,x,y); } uv.needsUpdate=true; }
  return geo; }
/* Box-Seiten nach Material gruppieren (mats[6]): hoechstens so viele Gruppen wie verschiedene Materialien -> Liste der Materialien */
function _bkGruppen(geo,mats){ const uniq=[]; for(const m of mats) if(uniq.indexOf(m)<0) uniq.push(m);
  if(geo.index&&geo.groups&&geo.groups.length===6&&geo.setIndex){
    const src=geo.index.array, out=new src.constructor(src.length); let q=0; const gr=geo.groups.slice(); geo.clearGroups();
    for(let k=0;k<uniq.length;k++){ const s0=q; gr.forEach((g,f)=>{ if(mats[f]!==uniq[k]) return; out.set(src.subarray(g.start,g.start+g.count),q); q+=g.count; }); geo.addGroup(s0,q-s0,k); }
    geo.setIndex(new THREE.BufferAttribute(out,1));
    if(uniq.length===1) geo.clearGroups();
  }
  return uniq; }
/* ---------- Aussenhaut (Fundament-Schritt 2, 16.10., Toms Fotos docs/uebergabe/fassade-0910-*.jpg) ----------
   Jede Aussenwand am Boden (Aussenflaeche Fassade oder Trapezblech) bekommt automatisch:
   - Betonsockel/Spritzschutz 0,5 m hoch, 5 cm vor der Wand (MAT sockelAussen: Struktur, Fuge alle 2 m, Spritzschmutz), an den
     Enden um die eigene Tiefe verlaengert (Ecken geschlossen);
   - Sockelabschlussprofil (Tropfkante Alu, 4 cm hoch, 8 cm vor der Wand) auf dem Sockel;
   - Eck-/Stossprofile (Alu 6 cm, 1,8 cm stark) an beiden Enden der Aussenflaeche, ueber dem Sockel bis zur Wandoberkante -
     an Ecken bilden die beiden Profile einen Eckwinkel, an Stoessen in der Flucht ein Stossprofil, an Oeffnungen die Laibungskante.
   Alles Kinder der Wand (gleiche Sichtbarkeit: Zonen, Ausbaustufen) und im Wandbild mit gezeichnet - Sockel = ein Material mehr
   je 32-m-Feld, Profile laufen im Laibungs-Material mit (kein Zeichenaufruf mehr). o.aussenSockel:false = ohne (z. B. Innenwand). */
const AUSSEN={sockel:0.5,vor:0.05,profilH:0.04,profilVor:0.08,eck:0.06,eckVor:0.018};
bk.AUSSEN=AUSSEN;
/* Sockel, Attikablech und Fallrohre sind schmal und ueberall gleich: im Wandbild EIN Mesh fuer die ganze Welt (wbFeld 'alle')
   statt eines je 32-m-Feld - ein Zeichenaufruf statt zwei bis fuenf in jeder Aussenansicht */
/* Mehrere Teile (Geometrie in Weltlage) als EIN Mesh mit einer Gruppe je Material - ein Szenen-Objekt je Wand statt vier.
   teile = [{geo, mat} | {geo, mats:[Material je Gruppe der Geometrie]}]; Lage des Meshes = (ox,oy,oz) im Elternteil (Elternteil in
   Weltlage ohne Drehung). ud = userData; ud.wbAlle = Materialien, die im Wandbild weltweit in ein Mesh gehen. -> Mesh */
function _bkTeileMesh(teile,parent,ox,oy,oz,ud,bild){
  const seg=[], mats=[];
  for(const t of teile){ const g=t.geo.index?t.geo.toNonIndexed():t.geo;
    if(t.mats&&g.groups.length){ for(const gr of g.groups) seg.push({g,s:gr.start,c:gr.count,mat:t.mats[gr.materialIndex]}); }
    else seg.push({g,s:0,c:g.attributes.position.count,mat:t.mat}); }
  for(const q of seg) if(mats.indexOf(q.mat)<0) mats.push(q.mat);
  let n=0; for(const q of seg) n+=q.c;
  const pos=new Float32Array(n*3), nor=new Float32Array(n*3), uv=new Float32Array(n*2), geo=new THREE.BufferGeometry(); let k=0;
  mats.forEach((mat,mi)=>{ const k0=k; for(const q of seg){ if(q.mat!==mat) continue; const P=q.g.attributes.position.array, N=q.g.attributes.normal.array, U=q.g.attributes.uv&&q.g.attributes.uv.array;
      for(let i=q.s;i<q.s+q.c;i++,k++){ pos[k*3]=P[i*3]-ox; pos[k*3+1]=P[i*3+1]-oy; pos[k*3+2]=P[i*3+2]-oz; nor[k*3]=N[i*3]; nor[k*3+1]=N[i*3+1]; nor[k*3+2]=N[i*3+2]; if(U){ uv[k*2]=U[i*2]; uv[k*2+1]=U[i*2+1]; } } }
    geo.addGroup(k0,k-k0,mi); });
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.BufferAttribute(nor,3)); geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  if(mats.length===1) geo.clearGroups(); geo.computeBoundingSphere();
  const m=new THREE.Mesh(geo,mats.length===1?mats[0]:mats); m.position.set(ox,oy,oz); Object.assign(m.userData,ud||{});
  if(HIQ){ m.castShadow=true; m.receiveShadow=true; }
  parent.add(m); if(bild!==false) bk.wandBildAdd(m); return m; }
/* Kasten in Weltlage mit UV in Metern */
function _bkKastenW(w,h,d,x,y,z){ return _bkMeterUV(new THREE.BoxGeometry(w,h,d),x,y,z).translate(x,y,z); }
function _bkAussenhaut(wand,o,r,ma){
  const art=bk.flaecheArt(ma); if(art!=='fassade'&&art!=='blech') return;
  const A=AUSSEN, y0=Math.min(r.y0,r.y1), y1=Math.max(r.y0,r.y1), laengs=(r.x1-r.x0)>(r.z1-r.z0), au=_WOPP[o.innen], s=au[0]==='-'?-1:1;
  const ebene=laengs?(s<0?r.z0:r.z1):(s<0?r.x0:r.x1), a0=laengs?r.x0:r.z0, a1=laengs?r.x1:r.z1, L=a1-a0, am=(a0+a1)/2;
  const T=[], teil=(lang,hoch,tief,mitte,y,vor,mat)=>{ const q=ebene+s*vor;
    T.push({geo:laengs?_bkKastenW(lang,hoch,tief,mitte,y,q):_bkKastenW(tief,hoch,lang,q,y,mitte),mat}); };
  const sockel=y0<0.05&&y1-y0>=0.6&&L>0.25, prof=bk.flaeche('laibung'), sm=MAT.get('sockelAussen');
  if(sockel){
    teil(L+2*A.vor,A.sockel,A.vor,am,A.sockel/2,A.vor/2,sm);
    teil(L+2*A.profilVor,A.profilH,A.profilVor,am,A.sockel+A.profilH/2,A.profilVor/2,prof); }
  const e0=sockel?A.sockel+A.profilH:y0;
  if(y1-e0>0.3&&L>0.25) for(const e of [a0,a1]) teil(A.eck,y1-e0,A.eckVor,e,(e0+y1)/2,A.eckVor/2,prof);
  if(T.length) _bkTeileMesh(T,wand,wand.position.x,wand.position.y,wand.position.z,{bauteil:'wand',bauteilArt:sockel?'aussenhaut':'eckProfil',wbAlle:[sm]},o.bild).position.set(0,0,0);
}
/* Wandstueck. o = {x0,x1,z0,z1,y0,y1, innen:'+x'|'-x'|'+z'|'-z' (Seite der Innenflaeche),
     flaechen:{innen, aussen (Standard 'fassade'), laibung (Standard 'laibung')} (Art-Name oder Material),
     ue (Ueberstand in Laengsrichtung gegen Haarfugen, Standard 6 mm; 0 zwischen Stuecken derselben Flucht),
     still (kein Hindernis fuer den Zielstrahl), sockel (true = Laden-Fussleiste auf jeder Seite mit
     Ladentapete, oder Liste der Seiten -1/+1 quer zur Wand), zone (zWand: faellt beim Kauf), parent,
     bild:false (nicht ins Wandbild - zeichnet sich selbst), aussenSockel:false (ohne Sockel/Profile der Aussenhaut) }
   -> Mesh (userData: bauteil 'wand', bauteilArt = Flaeche innen, aabb, flaechen[6]) */
bk.wand=function(o){
  let x0=o.x0,x1=o.x1,z0=o.z0,z1=o.z1; const y0=o.y0,y1=o.y1, u=o.ue===undefined?0.006:o.ue;
  if(x1-x0>z1-z0){ x0-=u; x1+=u; } else { z0-=u; z1+=u; }
  const F=o.flaechen||{}, mi=bk.flaeche(F.innen), ma=bk.flaeche(F.aussen)||bk.flaeche('fassade'), ml=bk.flaeche(F.laibung)||bk.flaeche('laibung');
  const mats=[ml,ml,ml,ml,ml,ml]; mats[_WFACE[o.innen]]=mi; mats[_WFACE[_WOPP[o.innen]]]=ma;
  const w=x1-x0,h=y1-y0,d=z1-z0, cx=(x0+x1)/2, cy=(y0+y1)/2, cz=(z0+z1)/2;
  const geo=_bkMeterUV(new THREE.BoxGeometry(w,h,d),cx,cy,cz);
  const uniq=_bkGruppen(geo,mats);
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
  if(o.aussenSockel!==false) _bkAussenhaut(m,o,{x0,x1,z0,z1,y0,y1},ma);
  if(o.sockel){ const laengs=w>d, fest=laengs?cz:cx, a0=laengs?o.x0:o.z0, a1=laengs?o.x1:o.z1, si=o.innen[0]==='-'?-1:1;
    const seiten=Array.isArray(o.sockel)?o.sockel:[si,-si].filter(s=>(s===si?mi:ma)===shopWall);
    for(const s of seiten) bk.sockelleiste({laengs,fest,a0,a1,seite:s,dicke:laengs?d:w,zone:o.zone,parent:o.parent,bild:o.bild}); }
  return m;
};
/* Sockel vor einer Wandflucht: laengs = Wand laeuft in x, fest = Mitte der Wand quer, a0..a1 Laenge,
   seite -1/+1 = vor welcher Wandseite, dicke = Wandstaerke (Standard LW), x/z = Mitte direkt vorgeben.
   art 'laden' (Standard): Fussleiste 10 cm hoch, 2 cm stark, Farbe folgt der Tapete (sockelM, 05o).
   art 'aussen': Betonsockel 0,5 m hoch, 5 cm stark (wie die Aussenhaut von bk.wand, UV in Metern) - nur fuer Stuecke ohne eigene
   Wand (z. B. vor einer zugemauerten Oeffnung); Aussenwaende bekommen ihren Sockel automatisch.
   o.zone: faellt mit der Bauwand; o.versteckt: gehoert zum noch gesperrten Bereich (zAdd). -> Mesh */
const SOCKEL_ART={laden:{h:0.1,t:0.02},aussen:{h:0.5,t:0.05}};
bk.sockelleiste=function(o){
  const A=SOCKEL_ART[o.art||'laden'], L=o.a1-o.a0, D=(o.dicke===undefined?LW:o.dicke)/2+A.t/2+0.001;
  const mat=o.art==='aussen'?MAT.get('sockelAussen'):sockelM();
  const geo=o.art==='aussen'?new THREE.BoxGeometry(o.laengs?L:A.t,A.h,o.laengs?A.t:L):roundedBoxGeo(o.laengs?L:A.t,A.h,o.laengs?A.t:L,Math.min(0.02,A.t*0.17));
  const m=new THREE.Mesh(geo,mat);
  if(o.laengs) m.position.set((o.a0+o.a1)/2,A.h/2,o.fest+o.seite*D); else m.position.set(o.fest+o.seite*D,A.h/2,(o.a0+o.a1)/2);
  if(o.x!==undefined) m.position.set(o.x,A.h/2,o.z);
  if(o.art==='aussen'){ _bkMeterUV(geo,m.position.x,m.position.y,m.position.z);
    /* Abschlussprofil (Tropfkante Alu) wie an der Aussenhaut von bk.wand */
    const P=AUSSEN, l=L+2*(P.profilVor-A.t), pr=new THREE.Mesh(new THREE.BoxGeometry(o.laengs?l:P.profilVor,P.profilH,o.laengs?P.profilVor:l),bk.flaeche('laibung'));
    pr.position.set(o.laengs?0:o.seite*(P.profilVor-A.t)/2,A.h/2+P.profilH/2,o.laengs?o.seite*(P.profilVor-A.t)/2:0); pr.userData.bauteil='wand'; pr.userData.bauteilArt='sockelProfil';
    m.add(pr); if(o.bild!==false) bk.wandBildAdd(pr); }
  m.userData.bauteil='wand'; m.userData.bauteilArt=o.art==='aussen'?'sockelAussen':'sockel'; if(o.art==='aussen') m.userData.wbFeld='alle';
  (o.parent||scene).add(m);
  if(o.zone) zWand(o.zone,m);
  if(o.versteckt) zAdd(o.versteckt,m);
  if(o.bild!==false) bk.wandBildAdd(m);
  return m;
};
/* ---------- Dachrand / Attika (Fundament-Schritt 2, 16.10.) ----------
   Vorher lag auf jedem Bau eine 25-cm-Platte in Anthrazit (Toms Foto: "schwarzer Balken" ueber der Wand). Jetzt eine Attika wie an
   Gewerbebauten: Aufkantung (Standard 0,45 m) mit den Fassadenpaneelen (UV in Metern - die Paneele laufen von der Wand weiter),
   darauf das Attikablech (Graphit lackiert, 5 cm, 4 cm Ueberstand = Tropfkante), Dachhaut oben dunkel. Optional Fallrohre:
   Rinnenkessel unter der Attika, Rohr 10 cm mit Schellen alle 2 m, Standrohr unten.
   o = {x0,x1,z0,z1 (Aussenkante), y (Unterkante = Wandoberkante), h, fallrohre:[[x,z,'+x'|'-x'|'+z'|'-z']] (Punkt auf der
        Wandflaeche, Richtung nach aussen), parent, bild:false} -> Group (alle Teile im Wandbild; zAdd/zWand auf die Gruppe wirkt).
   Zeichenaufrufe: keine eigenen - Attika laeuft im Fassaden-, Dachhaut im Anthrazit-, Blech und Rohre im Graphit-Material des
   Wandbilds (je 32-m-Feld). */
const DACHRAND={h:0.45,deckel:0.05,ueber:0.04,rohr:0.05,abstand:0.09,schelle:2.0};
bk.DACHRAND=DACHRAND;
bk.dachrand=function(o){
  const D=DACHRAND, h=o.h||D.h, y=o.y, g=new THREE.Group(); g.userData.bauteil='dachrand'; (o.parent||scene).add(g);
  const dach=MAT.get('anthrazitMatt'), fas=bk.flaeche('fassade'), blech=MAT.get('lackGraphit');
  /* alle Teile in EIN Mesh (Gruppen je Material); Attikablech und Fallrohre im Wandbild weltweit ein Mesh */
  const T=[], teil=(geo,mat,x,yy,z)=>{ T.push({geo:geo.translate(x,yy,z),mat}); };
  const w=o.x1-o.x0, d=o.z1-o.z0, cx=(o.x0+o.x1)/2, cz=(o.z0+o.z1)/2;
  T.push({geo:_bkKastenW(w,h,d,cx,y+h/2,cz),mats:[fas,fas,dach,dach,fas,fas]});
  teil(new THREE.BoxGeometry(w+2*D.ueber,D.deckel,d+2*D.ueber),blech,cx,y+h+D.deckel/2,cz);
  for(const f of o.fallrohre||[]) _bkFallrohr(teil,blech,f,y);
  _bkTeileMesh(T,g,cx,y,cz,{bauteil:'dachrand',bauteilArt:'attika',wbAlle:[blech]},o.bild);
  return g;
};
/* Fallrohr an der Wand: f = [x,z,Richtung nach aussen], y = Unterkante der Attika */
function _bkFallrohr(teil,mat,f,y){
  const D=DACHRAND, n={'+x':[1,0],'-x':[-1,0],'+z':[0,1],'-z':[0,-1]}[f[2]], px=f[0]+n[0]*D.abstand, pz=f[1]+n[1]*D.abstand, seg=bk.lod()===0?6:10;
  const H0=0.34, H1=y-0.2, C=(r1,r2,l)=>new THREE.CylinderGeometry(r1,r2,l,seg);
  teil(C(D.rohr,D.rohr,H1-H0),mat,px,(H0+H1)/2,pz,'fallrohr');
  teil(new THREE.BoxGeometry(0.2,0.2,0.2),mat,px,y-0.1,pz,'fallrohr');                      /* Rinnenkessel */
  teil(C(D.rohr*0.7,D.rohr,0.06),mat,px,H1+0.03,pz,'fallrohr');                              /* Trichter in den Kessel */
  teil(C(D.rohr+0.012,D.rohr+0.012,H0),mat,px,H0/2,pz,'fallrohr');                           /* Standrohr */
  for(let yy=H0+0.6;yy<H1-0.3;yy+=D.schelle){ teil(C(D.rohr+0.008,D.rohr+0.008,0.035),mat,px,yy,pz,'fallrohr');
    if(bk.lod()>0) teil(n[0]?new THREE.BoxGeometry(D.abstand,0.025,0.022):new THREE.BoxGeometry(0.022,0.025,D.abstand),mat,f[0]+n[0]*D.abstand/2,yy,f[1]+n[1]*D.abstand/2,'fallrohr'); }
}
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
    const e=o.matrixWorld.elements, feld=o.userData.wbFeld||(Math.floor(e[12]/WB.feld)+','+Math.floor(e[14]/WB.feld)), alle=o.userData.wbAlle;
    for(const gr of grs){ const mat=ms[gr.materialIndex]; if(!mat||mat.visible===false) continue;
      const k=mat.uuid+'|'+o.castShadow+'|'+o.receiveShadow+'|'+(alle&&alle.indexOf(mat)>=0?'alle':feld);
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

/* Geometrie-Cache je Schluessel und Detailstufe (Leuchten) */
const _bkHR=new Map();
function _bkHRGeo(k,f){ const key=k+':'+bk.lod(); let g=_bkHR.get(key); if(!g){ g=f(); _bkHR.set(key,g); } return g; }
/* Leuchten.
   art 'raster' (Deckenleuchten im Raster, vorher leuchtenRaster 05h): o = {id (Zone), r:{x0,x1,z0,z1}, y (Decke), ax, az, panel (Material
       der Streuscheibe)} - zwei Meshes (Korpus, Scheibe), jede Leuchte meldet sich in LAMPEN an.
   art 'strasse' (Mastleuchte, vorher lampTeile 05e): o.add(k,geo,matrix,farbe) bekommt die Teile in lokalen Koordinaten. */
/* ---------- Aussenleuchten: Mast und Wand (Fundament-Schritt 2, 16.10., Toms Foto fassade-0910-hof.jpg: vorher ein Kasten auf
   einer Stange bzw. Strahler aus Einzelkaesten mit je eigenem Leuchtmaterial) ----------
   art 'mast': Fussplatte mit Flansch, vier Ankerbolzen, Mastfuss mit Rippen, konischer Rundmast (Standard 6 m) mit Revisionstuer,
     Kopfkappe; Ausleger (koepfe 1: ein Arm nach +z, leicht steigend) oder Traverse (koepfe 2: nach +-x), LED-Kopf mit flachem Gehaeuse,
     Kuehlrippen und opaler Leuchtflaeche, zum Platz geneigt.
   art 'wand': Wandplatte, Arm, LED-Strahler (geneigt), Leuchtflaeche.
   Nachts: Leuchtflaeche warmweiss (lampeAussen ueber MAT.neu, an lampMats) und ein Lichtfleck am Boden, ab Niedrig dazu ein
   schwacher Lichtkegel (eine additive Textur lichtfleck, keine Lichtquelle). Tagsueber ist das Licht unsichtbar (0 Zeichenaufrufe).
   o = {art, punkte:[[x,z,ry]], h (Masthoehe bzw. Montagehoehe an der Wand), koepfe, neigung, parent, zone}
   -> {meshes, ...} je Aufruf drei InstancedMesh (Korpus, Leuchtflaeche, Licht) fuer alle Punkte. */
const LAMPE_AUSSEN={h:6.0,arm:0.85,hWand:3.0};
bk.LAMPE_AUSSEN=LAMPE_AUSSEN;
let _bkLA=null;
function _bkLampeMat(){ if(_bkLA) return _bkLA;
  const leucht=MAT.neu('lampeAussen');
  const licht=MAT.bild(MAT.tex('lichtfleck'),{transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,color:MAT.farbe('lampeWarm'),polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
  licht.visible=false;
  if(typeof lampMats!=='undefined'){ lampMats.push(leucht);
    lampMats.push({set emissiveIntensity(v){ const k=Math.max(0,Math.min(1,v/3)); licht.opacity=0.5*k; licht.visible=k>0.02; }}); }
  return _bkLA={leucht,licht};
}
function _bkLampeGeo(o){
  const L=bk.lod(), art=o.art, h=o.h||(art==='wand'?LAMPE_AUSSEN.hWand:LAMPE_AUSSEN.h), n=o.koepfe||1, nei=o.neigung===undefined?(art==='wand'?0.45:(n===2?0.38:0.08)):o.neigung;
  return _bkHRGeo('aussenlampe:'+[art,h,n,nei,L].join('|'),()=>{
    const S=bk.sammler({form:{fase:0.012,faseMin:0.03,lod0Kasten:true}}), A=MAT.farbe('anthrazit'), G=MAT.farbe('silbergrau'), sg=L===0?6:(L===2?16:10);
    const koepfe=[];                           /* [Matrix des Kopfs] - Leuchtflaeche und Licht haengen daran */
    const kopf=(m,b,t)=>{ S.pivot(); const K=m;
      S.geo(L>1?bk.kasten(b,0.07,t,{fase:0.02}):new THREE.BoxGeometry(b,0.07,t),K.clone().multiply(tm(0,0.035,0)),A,'lackMetall');
      if(L>1) for(let i=-2;i<=2;i++) S.geo(new THREE.BoxGeometry(b*0.8,0.025,0.008),K.clone().multiply(tm(0,0.08,i*t*0.17)),A,'lackMetall');
      S.geo(new THREE.BoxGeometry(b*0.84,0.012,t*0.82),K.clone().multiply(tm(0,-0.002,0)),0xffffff,'leucht');
      koepfe.push(K); };
    if(art==='wand'){
      S.box(0.14,0.2,0.02,0,h,0.01,A,'lackMetall');
      if(L>0) for(const [x,y] of [[-0.045,0.07],[0.045,0.07],[-0.045,-0.07],[0.045,-0.07]]) S.box(0.014,0.014,0.01,x,h+y,0.024,G,'lackMetall');
      S.zyl(0.022,0.022,0.3,sg,0,h,0.17,A,'lackMetall',Math.PI/2,0,0);
      kopf(tm(0,h-0.02,0.42,-nei,0,0),0.32,0.26);
    } else {
      S.box(0.34,0.025,0.34,0,0.0125,0,A,'lackMetall');
      for(const x of [-0.12,0.12]) for(const z of [-0.12,0.12]){ S.box(0.022,0.07,0.022,x,0.05,z,G,'lackMetall'); if(L>0) S.box(0.034,0.018,0.034,x,0.034,z,G,'lackMetall'); }
      S.zyl(0.1,0.115,0.16,sg,0,0.105,0,A,'lackMetall');
      if(L>1) for(let i=0;i<4;i++){ const a=i*Math.PI/2+Math.PI/4; S.box(0.012,0.12,0.07,Math.cos(a)*0.1,0.085,Math.sin(a)*0.1,A,'lackMetall',0,-a,0); }
      S.zyl(0.055,0.085,h-0.18,sg,0,0.18+(h-0.18)/2,0,A,'lackMetall');
      S.box(0.07,0.3,0.014,0,0.7,0.081,A,'lackMetall');
      S.zyl(0.062,0.062,0.04,sg,0,h+0.02,0,A,'lackMetall');
      if(n===2){
        S.box(1.5,0.07,0.07,0,h-0.12,0,A,'lackMetall');
        for(const sx of [-1,1]){ S.box(0.05,0.14,0.05,sx*0.72,h-0.2,0,A,'lackMetall'); kopf(tm(sx*0.72,h-0.29,0.05,nei,0,0),0.46,0.34); }
      } else {
        const a=LAMPE_AUSSEN.arm;
        S.box(0.12,0.14,0.12,0,h-0.09,0.02,A,'lackMetall');
        S.zyl(0.03,0.034,a,sg,0,h-0.08+Math.sin(0.08)*a/2,a/2,A,'lackMetall',Math.PI/2-0.08,0,0);
        kopf(tm(0,h-0.08+Math.sin(0.08)*a,a+0.2,-nei,0,0),0.3,0.56);
      }
    }
    /* Licht je Kopf: Fleck am Boden (links im Bild), ab Niedrig ein Kegel (rechts im Bild) vom Kopf zum Fleck */
    const licht=[];
    for(const K of koepfe){ const p=new THREE.Vector3().setFromMatrixPosition(K), d=new THREE.Vector3(0,-1,0).transformDirection(K).normalize();
      const t=d.y<-0.2?p.y/-d.y:p.y, ziel=p.clone().addScaledVector(d,t); ziel.y=0.03;
      const R=Math.max(3.0,p.y*0.95);
      const f=new THREE.PlaneGeometry(2*R,2*R), uv=f.attributes.uv; for(let i=0;i<uv.count;i++) uv.setX(i,uv.getX(i)*0.5);
      licht.push({geo:f,m:tm(ziel.x,0.03,ziel.z,-Math.PI/2,0,0)});
      if(L>0){ const hk=p.distanceTo(ziel)-0.05, c=new THREE.CylinderGeometry(0.16,R*0.4,hk,12,1,true), cu=c.attributes.uv; for(let i=0;i<cu.count;i++) cu.setX(i,0.52+cu.getX(i)*0.46);
        const mitte=p.clone().add(ziel).multiplyScalar(0.5), q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),p.clone().sub(ziel).normalize());
        licht.push({geo:c,m:new THREE.Matrix4().compose(mitte,q,new THREE.Vector3(1,1,1))}); } }
    S.pivot();
    return {korpus:S.geometrie('lackMetall'),leucht:S.geometrie('leucht'),licht:merge(licht)}; });
}
bk.lampe=function(o){
  if(o.art==='mast'||o.art==='wand'){ const G=_bkLampeGeo(o), LM=_bkLampeMat(), y=o.art==='wand'?0:(o.y||0);
    const M=o.punkte.map(([x,z,ry])=>tm(x,y,z,0,ry||0,0)), opt={parent:o.parent,bauteil:'lampe',art:o.art};
    const meshes=[bk.inst(G.korpus,MAT.vc('lackMetall'),M,opt),bk.inst(G.leucht,LM.leucht,M,Object.assign({schatten:false},opt)),bk.inst(G.licht,LM.licht,M,Object.assign({schatten:false},opt))];
    meshes[2].renderOrder=3;
    if(o.zone&&typeof zAdd==='function') for(const me of meshes) zAdd(o.zone,me);
    return {meshes,licht:meshes[2]}; }
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
  return null;
};
/* Bodenmarkierung (ASR A1.8): gleiche Breiten und Farben ueberall - JEDE Bodenmarkierung im Spiel (Einheit 15.10.: vorher
   zusaetzlich ~60 Einzel-flat() in 05g/05h, MAT.basic-Striche in 11e, vier gemalte Texturen fuer Schrift und Sperrflaechen).
   o = {linien:[[x0,z0,x1,z1,farbe('gelb'|'weiss'|'sperr' = Warnrand gelb-schwarz),breite,strich,luecke]] (Fahrwege gelb 0,12 m, Stellplaetze weiss/gelb
          0,08 m; strich/luecke = gestrichelt, z. B. Fahrspur im Hof 0,6/0,4),
        rahmen:[{x0,x1,z0,z1,farbe,breite,strich,luecke}] (Stellplatz/Feld umrandet, auch gestrichelt),
        flaechen:[{x0,x1,z0,z1,art:'sperr'|'frei'}] (Sperrflaeche gelb-schwarz 45°, Freihalteflaeche gelbe Schraffur 45° auf Beton),
        schriften:[{text,x,z,b,h,ry}] (Bodenschrift Signalgelb auf dunklem Feld mit Rand - ANLIEFERUNG, VERSANDHOF),
        y (Boden), boden(x,z) (Hoehe des Untergrunds, z. B. Gehweg mit Gefaelle), parent,
        schatten (true = empfaengt Sonnenschatten wie Aussenboeden; innen aus)}
   -> {meshes} je Material EIN Mesh (UV in Metern, Schraffur 0,4 m je Kachel); Schrift je Text ein Mesh (Textur-Cache)
   Rueckbau 16.10.: Gehweg gruen, Fussgaenger-Piktogramm und LKW-Stellplatz (nur Logistikhalle/Werk) entfallen. */
bk.MARKIERUNG={fahrweg:0.12,stellplatz:0.08};
const _bkBodenSchrift=new Map();
bk.bodenmarkierung=function(o){
  const y=o.y===undefined?0.015:o.y, T={gelb:[],weiss:[],sperr:[],frei:[]};
  /* o.boden(x,z) = Hoehe des Untergrunds (z. B. Gehweg mit Gefaelle): Flaechen werden unterteilt und folgen ihm */
  const folge=(gg,dy)=>{ if(!o.boden) return; const p=gg.attributes.position; for(let i=0;i<p.count;i++) p.setY(i,o.boden(p.getX(i),p.getZ(i))+dy); p.needsUpdate=true; };
  const quad=(k,cx,cz,w,d,ry,dy,uvM)=>{ const n=o.boden?[Math.max(1,Math.ceil(w/0.25)),Math.max(1,Math.ceil(d/0.25))]:[1,1];
    const gg=new THREE.PlaneGeometry(w,d,n[0],n[1]); gg.rotateX(-Math.PI/2); if(ry) gg.rotateY(ry); gg.translate(cx,y+dy,cz); folge(gg,dy);
    if(uvM){ const p=gg.attributes.position, uv=gg.attributes.uv; for(let i=0;i<p.count;i++) uv.setXY(i,p.getX(i)/uvM,-p.getZ(i)/uvM); }
    T[k].push({geo:gg,m:new THREE.Matrix4()}); };
  const strich=(x0,z0,x1,z1,f,b)=>{ const L=Math.hypot(x1-x0,z1-z0); if(L<0.01) return; quad(f||'gelb',(x0+x1)/2,(z0+z1)/2,L+(b||0.12),b||0.12,Math.atan2(-(z1-z0),x1-x0),0.005,f==='sperr'?0.4:0); };
  const linie=(x0,z0,x1,z1,f,b,st,lu)=>{ if(!st){ strich(x0,z0,x1,z1,f,b); return; }
    const L=Math.hypot(x1-x0,z1-z0), ux=(x1-x0)/L, uz=(z1-z0)/L, sb=b||0.12; let t=0;
    while(t<L-0.001){ const e=Math.min(L,t+st); /* Strichlaenge ohne die Ueberlaenge der Linie (b) */
      strich(x0+ux*(t+sb/2),z0+uz*(t+sb/2),x0+ux*(e-sb/2),z0+uz*(e-sb/2),f,sb); t=e+(lu||st); } };
  for(const l of (o.linien||[])) linie(l[0],l[1],l[2],l[3],l[4],l[5],l[6],l[7]);
  for(const r of (o.rahmen||[])){ const b=r.breite||bk.MARKIERUNG.stellplatz, f=r.farbe||'gelb', h=b/2;
    linie(r.x0+h,r.z0+h,r.x1-h,r.z0+h,f,b,r.strich,r.luecke); linie(r.x0+h,r.z1-h,r.x1-h,r.z1-h,f,b,r.strich,r.luecke);
    linie(r.x0+h,r.z0+h,r.x0+h,r.z1-h,f,b,r.strich,r.luecke); linie(r.x1-h,r.z0+h,r.x1-h,r.z1-h,f,b,r.strich,r.luecke); }
  for(const f of (o.flaechen||[])){ const w=f.x1-f.x0, d=f.z1-f.z0;
    quad(f.art==='sperr'?'sperr':'frei',(f.x0+f.x1)/2,(f.z0+f.z1)/2,w,d,0,0.003,0.4); }
  const MM={gelb:MAT.get('markierungGelb'),weiss:MAT.get('weissMatt'),sperr:MAT.get('sperrflaeche'),frei:MAT.get('freihalteflaeche')};
  const meshes=[];
  const fertig=(me,k)=>{ if(HIQ&&o.schatten) me.receiveShadow=true; me.userData.bauteil='bodenmarkierung'; me.userData.bauteilArt=k; me.matrixAutoUpdate=false; me.updateMatrix();
    (o.parent||scene).add(me); meshes.push(me); return me; };
  for(const k in T){ if(!T[k].length) continue; const me=new THREE.Mesh(merge(T[k]),MM[k]); T[k].forEach(t=>t.geo.dispose()); fertig(me,k); }
  /* Bodenschrift: Signalgelb auf halbdunklem Feld mit gelbem Rand (Pixel je Meter fest), Textur je Text geteilt */
  for(const q of (o.schriften||[])){ const PXM=200, W=Math.round(q.b*PXM), H=Math.round(q.h*PXM), key=q.text+'|'+W+'|'+H;
    let m=_bkBodenSchrift.get(key);
    if(!m){ const t=tex(W,H,(g,W2,H2)=>{ g.clearRect(0,0,W2,H2); g.fillStyle=MAT.css('tiefschwarz',0.62); g.fillRect(0,0,W2,H2);
        const r=Math.max(6,Math.round(0.03*PXM)); g.strokeStyle=MAT.css('signalgelb'); g.lineWidth=r; g.strokeRect(r/2,r/2,W2-r,H2-r);
        g.textAlign='center'; g.textBaseline='middle'; fitFont(g,q.text,W2*0.86,Math.round(H2*0.48),BUN);
        g.fillStyle=MAT.css('tiefschwarz',0.75); g.fillText(q.text,W2/2+H2*0.02,H2/2+H2*0.04); g.fillStyle=MAT.css('signalgelb'); g.fillText(q.text,W2/2,H2/2+H2*0.01); });
      t.anisotropy=8; m=MAT.neu('bodenSchrift',{map:t}); _bkBodenSchrift.set(key,m); }
    const gg=new THREE.PlaneGeometry(q.b,q.h,o.boden?Math.ceil(q.b/0.1):1,o.boden?Math.ceil(q.h/0.1):1); gg.rotateX(-Math.PI/2); if(q.ry) gg.rotateY(q.ry); gg.translate(q.x,y+0.007,q.z); folge(gg,0.007);
    fertig(new THREE.Mesh(gg,m),'schrift').renderOrder=2; }
  return {meshes};
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

/* =========================================================
   Regal (Schritt "Einheit", 15.10.2026, docs/fundament/einheit.md)

   Tom 15.10. (Fundament-Schritt 4): "Regale, Kassen, Fenster, Tueren, Schilder, Bodenmarkierungen einheitlich bauen -
   Groessen und Arten bleiben, nur die Bauweise wird einheitlich." Vorher drei Regal-Bauweisen mit drei Farbsystemen:
   createShelf/bauMoebel (06, Laden), createRack/rackMats (06, Lager: eigene Lochtextur je Stuetze, Boden je Ebene ein Mesh,
   Traversen mit zwei Extra-Orangetoenen) und vmRegalBauen (11d, Packmaterial: Boeden Alu statt verzinkt).
   Jetzt EIN Bauteil, die Art waehlt die Bauweise:
     art 'laden'       Verkaufsmoebel nach SHELFKIND (klein, standard, hoch, kuehl, gondel, eck, gross, kasse = Wandregal/Gondel;
                       tisch, tischgross = Verkaufstisch; gitter, gitter2, gitter3 = Gitterbox). Gestell je Warenseite EIN Mesh
                       (Vertexfarben nach Rolle, Material MAT.vc('kunststoff'), Farben aus regalFarben - folgt der Wand),
                       Rueckwand Lochblech (UV 0,4 m), Preisschild je Fach + Kopfschild (Bild, veraenderlich), Trefferflaeche je Fach.
     art 'lager'       Lagerregal nach RACKKIND (standard, hoch, schwer): Stuetzen Lochprofil Signalblau (ein Mesh fuer alle 4),
                       Rahmen/Traversen Signalblau/Signalorange (ein Mesh), Boeden verzinkt (ein Mesh), Inhaltsschild.
     art 'fachboden'   kleines Fachbodenregal in einen fremden Sammler (Packmaterial an jedem Packplatz): Stuetzen Signalblau,
                       Boeden verzinkt Silbergrau wie das Lagerregal.
   Gleiche Sache = gleiche Farbe: Lagertechnik Stuetzen Signalblau, Traversen Signalorange, Boeden Silbergrau.
   Die Spiel-Logik (Faecher/Level, Ware, Schilder malen, Stellplaetze, Kollision) bleibt in den Huellen createShelf/createRack/
   vmRegalBauen - bk.regal baut und gibt die Haken zurueck.
   o = {art, K (Art-Daten SHELFKIND/RACKKIND), g (Gruppe, steht schon am Platz), farben (laden: Rollenfarben regalFarben(K)),
        px (laden: Schildaufloesung, REGAL_TEX)}  |  fachboden: {box(w,h,d,farbe,x,y,z,rx,ry,rz), breite, tiefe, hoehe, boeden:[y], rueckwand}
   -> laden: {gestelle:[Mesh], faecher:[{li,face,tex (Preisbild des Moebels),zelle:{y,h} (Pixelzeile),hit}], preisTex, headTex, kopfG, headY,
             gitterM, leiste (Material Lichtleiste), top}
      lager: {faecher:[{li,si,x,y,hit}], schildTex, meshes}
      fachboden: {} (Teile im Sammler)
   ========================================================= */
let _bkLoch=null, _bkLeiste=null;
function _bkBoxen(){ const GB={}; const f=(w,h,d)=>GB[w+'|'+h+'|'+d]||(GB[w+'|'+h+'|'+d]=new THREE.BoxGeometry(w,h,d)); f.weg=()=>{ for(const k in GB) GB[k].dispose(); }; return f; }
bk.regal=function(o){
  if(o.art==='lager') return _bkRegalLager(o);
  if(o.art==='fachboden') return _bkRegalFachboden(o);
  return _bkRegalLaden(o);
};
/* Rueckwand aller Verkaufsregale: EIN veraenderliches Material (Farbe folgt der Wand, regaleFaerben) */
bk.regal.rueckwand=function(){ return _bkLoch||(_bkLoch=MAT.neu('lochblech')); };
/* Lichtleiste unter den Boeden: EIN veraenderliches Material fuer alle Regale (Upgrade Regallicht schaltet es) */
bk.regal.leiste=function(){ return _bkLeiste||(_bkLeiste=MAT.neu('lichtleiste')); };
function _bkRegalLaden(o){
  const K=o.K, g=o.g, RF=o.farben, PX=o.px||1, box=_bkBoxen();
  const W=K.w, D=K.d, top=K.lv[K.lv.length-1]+fachHoehe(K,K.lv.length-1)+0.04, hw=W/2, iw=W-0.1;
  const R={gestelle:[],faecher:[],headTex:null,kopfG:null,headY:0,gitterM:null,leiste:null,top,preisTex:null};
  /* Preisschilder: EIN Bild je Moebel (Zeile je Fach, 4 px Rand gegen Ueberblenden) und EIN Mesh je Warenseite - vorher je Fach
     eigene Textur, eigenes Material, eigener Zeichenaufruf. Die Zeile malt updateLabel (06) ueber lv.zelle. */
  const nF=K.bau?K.lv.length:seitenVon(K).length*K.lv.length, ZW=Math.round(700*PX), ZB=Math.round(80*PX), ZH=ZB+4;
  const PT=R.preisTex=tex(ZW,ZH*nF,()=>{}); PT.anisotropy=8; const PM=MAT.bild(PT); let nP=0;
  const preisQ=new Map();
  const preis=(parent,y,z)=>{ const k=nP++, y0=k*ZH+2, b=Math.min(0.46,iw*0.46), gg=new THREE.PlaneGeometry(b,0.052), uv=gg.attributes.uv, H=ZH*nF;
    /* UV in die Zeile k (Bildzeile 0 liegt oben = v 1), halbes Texel nach innen */
    for(let i=0;i<uv.count;i++){ const u=uv.getX(i), v=uv.getY(i); uv.setXY(i,(0.5+u*(ZW-1))/ZW,1-(y0+0.5+(1-v)*(ZB-1))/H); }
    gg.translate(0,y,z); if(!preisQ.has(parent)) preisQ.set(parent,[]); preisQ.get(parent).push({geo:gg,m:new THREE.Matrix4()});
    return {y:y0,h:ZB}; };
  const preisFertig=()=>{ for(const [par,q] of preisQ){ const m=new THREE.Mesh(merge(q),PM); q.forEach(x=>x.geo.dispose()); m.userData.bauteil='regal'; m.userData.bauteilArt='preisschild'; par.add(m); } preisQ.clear(); };
  const fach=(parent,li,face,z)=>{ const yl=K.lv[li], h=fachHoehe(K,li), hit=bbox(iw,h,D,hitM,0,yl+h/2,0.01,parent,false); R.faecher.push({li,face,tex:PT,zelle:z,hit}); };
  const gestell=(parent,st,schatten)=>{ st.forEach(x=>{ x.color=RF[x.rolle]; });
    const m=new THREE.Mesh(merge(st),MAT.vc('kunststoff')); m.userData.rollen=st.map(x=>[x.rolle,x._n]); m.userData.regalK=K;
    m.userData.bauteil='regal'; m.userData.bauteilArt=K.id; if(HIQ&&schatten!==false){ m.castShadow=true; m.receiveShadow=true; }
    parent.add(m); R.gestelle.push(m); return m; };
  if(K.bau){
    const nL=K.lv.length, y=K.lv[nL-1], fh=K.oben, st=[], kopf=[]; let preisY, headY;
    const fg=new THREE.Group(); g.add(fg);
    if(K.bau==='tisch'){
      /* Ladenbau-Tisch: dieselben Teile wie die Verkaufstische der Ausstellung 2.0 (bk.verkaufstischTeile) */
      st.push(...bk.verkaufstischTeile(K,box)); preisY=[y-0.1];
      /* Aktionsschild auf einem Steckpfosten hinten in der Mitte - es verschwindet, solange der Tisch leer ist */
      kopf.push({geo:box(0.03,0.62,0.03),m:tm(0,y+fh+0.05,-D/2+0.08),rolle:'rahmen'});
      headY=y+fh+0.42; kopf.push({geo:box(1.0,0.2,0.03),m:tm(0,headY,-D/2+0.08),rolle:'kopf'});
    } else {
      /* Gitterbox: Unterbau mit offenen Faechern (Seitenwangen, Rueckwand, Boeden mit Preisleiste), darueber die Wanne
         (Bodenblech, Eckpfosten, Drahtgitter rundum, Rohrrahmen; vorn niedriger). Sockel 25 mm zurueckgesetzt, Wannenplatte
         6 mm ueberstehend - keine zwei Flaechen in einer Ebene (03.10., Saegezaehne). */
      const hw2=Math.min(0.62,fh+0.06), hv=Math.min(hw2-0.1,fh-0.08), SK=0.08;
      for(const sx of [-1,1]) st.push({geo:box(0.03,y-SK,D),m:tm(sx*(W/2-0.015),(y+SK)/2,0),rolle:'seite'});
      st.push({geo:box(W-0.06,y-SK,0.02),m:tm(0,(y+SK)/2,-D/2+0.01),rolle:'rueck'});
      st.push({geo:box(W-0.05,SK,D-0.05),m:tm(0,SK/2,0),rolle:'fuss'});
      preisY=[];
      for(let li=0;li<nL-1;li++){ const yl=K.lv[li];
        st.push({geo:box(W-0.06,0.025,D-0.03),m:tm(0,yl-0.012,0),rolle:'boden'});
        st.push({geo:box(iw,0.05,0.014),m:tm(0,yl-0.02,D/2-0.013),rolle:'preis'}); preisY.push(yl-0.02); }
      st.push({geo:box(W+0.012,0.04,D+0.012),m:tm(0,y-0.02,0),rolle:'boden'});
      for(const sx of [-1,1]) for(const sz of [-1,1]) st.push({geo:box(0.035,hw2+0.02,0.035),m:tm(sx*(W/2-0.018),y+hw2/2,sz*(D/2-0.018)),rolle:'rahmen'});
      st.push({geo:box(W,0.025,0.025),m:tm(0,y+hw2,-D/2+0.012),rolle:'rahmen'});
      st.push({geo:box(W,0.025,0.025),m:tm(0,y+hv,D/2-0.012),rolle:'rahmen'});
      for(const sx of [-1,1]) st.push({geo:box(0.025,0.025,D),m:tm(sx*(W/2-0.012),y+hw2,0),rolle:'rahmen'});
      /* Drahtgitter: vier Flaechen in EINEM Mesh (vorher vier), UV 0,2 m je Kachel; Farbe folgt dem Rahmen (regaleFaerben) */
      const gm=MAT.neu('gitterBox'); gm.color.copy(LIN(RF.rahmen)); R.gitterM=gm;
      const wand=(w,h,x,yy,z,ry)=>{ const pg=new THREE.PlaneGeometry(w,h); MAT.kachel(pg,w/0.2,h/0.2); return {geo:pg,m:tm(x,yy,z,0,ry,0)}; };
      const wg=[wand(W-0.04,hw2,0,y+hw2/2,-D/2+0.012,0),wand(W-0.04,hv,0,y+hv/2,D/2-0.012,0)];
      for(const sx of [-1,1]) wg.push(wand(D-0.04,hw2,sx*(W/2-0.012),y+hw2/2,0,Math.PI/2));
      const gw=new THREE.Mesh(merge(wg),gm); gw.userData.bauteil='regal'; gw.userData.bauteilArt='gitter'; fg.add(gw); wg.forEach(x=>x.geo.dispose());
      preisY.push(y+hv-0.04); headY=y+hv+0.13;
      /* Klappschild vorn am Rohrrahmen */
      kopf.push({geo:box(0.9,0.2,0.02),m:tm(0,headY,D/2-0.004),rolle:'kopf'});
    }
    gestell(fg,st);
    const kg=new THREE.Group(); fg.add(kg); R.kopfG=kg;
    gestell(kg,kopf,false);
    /* je Ebene Preisschild und Trefferflaeche (Unterbau-Faecher, Wanne bzw. Platte) */
    K.lv.forEach((yl,li)=>{ const z=preis(fg,preisY[li],D/2+(K.bau==='tisch'?-0.032:0.003)); fach(fg,li,0,z); });
    preisFertig();
    R.headTex=tex(Math.round(1024*PX),Math.round(160*PX),()=>{});
    const hz=K.bau==='tisch'?-D/2+0.08+0.016:D/2+0.008, hwid=K.bau==='tisch'?0.96:0.86;
    plane(hwid,0.17,MAT.bild(R.headTex,{side:THREE.DoubleSide}),0,headY,hz,0,kg).userData.bauteil='regal';
    R.headY=headY; box.weg(); return R;
  }
  seitenVon(K).forEach((f,fi)=>{
    const fg=new THREE.Group(); fg.position.set(f.ox,0,f.oz); fg.rotation.y=f.ry; g.add(fg);
    const st=[], li0=[];
    st.push({geo:box(0.05,top,D),m:tm(-hw+0.025,top/2,0),rolle:'rahmen'});
    st.push({geo:box(0.05,top,D),m:tm( hw-0.025,top/2,0),rolle:'rahmen'});
    st.push({geo:box(W,0.06,D),  m:tm(0,top+0.03,0),rolle:'rahmen'});
    st.push({geo:box(iw,0.08,D-0.02),m:tm(0,0.04,0),rolle:'rahmen'});
    for(const sx of [-1,1]) st.push({geo:box(0.022,top-0.08,D),m:tm(sx*(hw+0.005),top/2,0),rolle:'seite'});
    /* Mittelsteher zwischen den Regalmodulen (jedes Modul fasst ganze Kartons) */
    for(let k=1;k<(K.mod||1);k++) st.push({geo:box(STEHER,top-0.1,D-0.06),m:tm(-iw/2+k*(modBreite(K)+STEHER)-STEHER/2,top/2,-0.02),rolle:'rahmen'});
    st.push({geo:box(W-0.06,0.14,0.03),m:tm(0,0.11,D/2-0.005),rolle:'blende'});
    for(const sx of [-1,1]) for(const sz of [-1,1]) st.push({geo:box(0.09,0.04,0.09),m:tm(sx*(hw-0.1),0.02,sz*(D/2-0.1)),rolle:'fuss'});
    /* Rueckwand: Lochblech (UV 0,4 m = 8 Loecher je Kachel, Loch 5 cm - vorher 5 Kacheln je Regal, also je nach Breite 2-5 cm),
       im Kuehlregal weisser Kunststoff, im Kassenregal Lochblech Lichtgrau wie die Kasse */
    { const rg=new THREE.BoxGeometry(iw,top-0.1,0.02); if(!K.cold) MAT.kachel(rg,iw/0.4,(top-0.1)/0.4);
      const rw=new THREE.Mesh(rg,K.cold?MAT.get('kunststoffWeiss'):K.kasse?MAT.get('lochblechKasse'):bk.regal.rueckwand());
      rw.position.set(0,top/2,-D/2+0.03); rw.userData.bauteil='regal'; rw.userData.bauteilArt='rueckwand'; if(HIQ){ rw.castShadow=true; rw.receiveShadow=true; } fg.add(rw); }
    /* Kassenregal: Edelstahlleisten wie an der Kasse - vorn an der Deckplatte und ueber der Sockelblende (ein Mesh) */
    if(K.kasse){ const S=bk.sammler({bauteil:'regal'}), A=MAT.farbe('aluminium');
      S.box(W+0.012,0.03,0.02,0,top+0.045,D/2+0.004,A,'blank').box(W-0.04,0.022,0.02,0,0.19,D/2+0.006,A,'blank'); S.fertig(fg,{schatten:false}); }
    K.lv.forEach((y,li)=>{
      st.push({geo:box(iw,0.03,D-0.04),m:tm(0,y-0.015,0),rolle:'boden'});
      st.push({geo:box(iw,0.05,0.014),m:tm(0,y-0.02,D/2-0.013),rolle:'preis'});
      st.push({geo:box(iw,0.012,0.02),m:tm(0,y-0.045,D/2-0.011),rolle:'lippe'});
      st.push({geo:box(iw-0.04,0.018,0.05),m:tm(0,y-0.055,-D/2+0.06),rolle:'rahmen'});
      if(li>0||K.cold) li0.push({geo:box(iw-0.06,0.016,0.04),m:tm(0,y-0.048,D/2-0.07)});
      const z=preis(fg,y-0.02,D/2-0.004); fach(fg,li,fi,z);
    });
    preisFertig();
    /* Kopfschild ueber jeder Warenseite (eine Textur fuer alle Seiten) */
    if(fi===0){ R.headTex=tex(Math.round(1024*PX),Math.round(160*PX),()=>{}); R.headM=MAT.bild(R.headTex); }
    const hy=top+(K.cold?0.34:0.18);
    st.push({geo:box(W-0.04,0.28,0.05),m:tm(0,hy,0.02),rolle:'kopf'});
    plane(W-0.1,0.24,R.headM,0,hy,0.051,0,fg).userData.bauteil='regal';
    gestell(fg,st);
    if(li0.length){ const m=new THREE.Mesh(merge(li0),K.cold?MAT.get('lichtleisteKuehl'):(R.leiste=bk.regal.leiste())); m.userData.bauteil='regal'; m.userData.bauteilArt='lichtleiste'; fg.add(m); }
    if(K.cold){
      /* Glastueren (ein Mesh), Rahmen, Griffe und Kopfblende Alu (ein Mesh), Schild "GEKUEHLT" */
      const S=bk.sammler({bauteil:'regal'}), AL=MAT.farbe('aluminium'), GR=MAT.farbe('lichtgrau'), gl=[];
      for(const sx of [-1,1]){
        gl.push({geo:box(W/2-0.02,top-0.14,0.03),m:tm(sx*W/4,top/2,D/2-0.002)});
        S.box(0.03,top-0.14,0.04,sx*(W/2-0.03),top/2,D/2,AL,'stahl');
        S.box(0.035,0.5,0.05,sx*0.06,top*0.55,D/2+0.03,GR,'stahl'); }
      S.box(W,0.16,D,0,top+0.12,0,AL,'stahl');
      S.fertig(fg);
      const gm=new THREE.Mesh(merge(gl),MAT.get('glasScheibe')); gm.userData.bauteil='regal'; gm.userData.bauteilArt='glastuer'; fg.add(gm);
      bk.schild(fg,{text:'GEKÜHLT  4 °C',stil:'info',b:W*0.8,h:0.11,y:top+0.12,z:D/2+0.005,leucht:true});
    }
  });
  /* Eckregal: zwischen den Schenkeln ein Blindfeld (sonst schaut man durch den Spalt auf die Wand) - Teil des Gestells,
     faerbt mit (vorher zwei eigene Materialien je Regal) */
  if(K.art==='ecke'){ const r=(w,h,d)=>roundedBoxGeo(w,h,d,Math.min(0.02,Math.min(w,h,d)*0.17));
    gestell(g,[{geo:r(0.52,top,0.52),m:tm(-0.6,top/2,-0.6),rolle:'seite'},{geo:r(0.56,0.06,0.56),m:tm(-0.6,top+0.03,-0.6),rolle:'rahmen'}]); }
  R.headY=top+(K.cold?0.34:0.18);
  box.weg(); return R;
}
function _bkRegalLager(o){
  const K=o.K, g=o.g, F=MAT.farbe, box=_bkBoxen();
  const HT=K.hoch, XO=K.w/2, ZO=K.zo, BW=K.w, fr=[], posts=[], decks=[];
  const R={faecher:[],schildTex:null,meshes:[]};
  /* Rahmen: Stuetzen (Lochprofil, ein Mesh), Fussplatten, Riegel und Diagonalverband ueber die ganze Rahmenhoehe */
  for(const x of [-XO,XO]){
    for(const z of [-ZO,ZO]){
      const pg=new THREE.BoxGeometry(0.085,HT,0.075); MAT.kachel(pg,1,HT/2.34); posts.push({geo:pg,m:tm(x,HT/2,z)});
      fr.push({geo:box(0.2,0.022,0.17),m:tm(x,0.011,z),color:F('anthrazit')});
      for(const bx of [-0.06,0.06]) fr.push({geo:box(0.022,0.03,0.022),m:tm(x+bx,0.03,z),color:F('silbergrau')});
    }
    const nR=Math.max(3,Math.round(HT/0.7));
    for(let k=0;k<nR;k++) fr.push({geo:box(0.04,0.04,2*ZO),m:tm(x,0.42+k*0.7,0),color:F('signalblau')});
    for(let k=0;k<nR-1;k++) fr.push({geo:box(0.035,0.035,2*ZO*1.3+0.06),m:tm(x,0.77+k*0.7,0,(k%2?1:-1)*Math.atan2(0.7,2*ZO),0,0),color:F('signalblau')});
  }
  const sw=(K.sp.length>1?K.sp[1]-K.sp[0]:0.8)-0.02;
  K.lv.forEach((y,li)=>{
    for(const z of [-ZO+0.03,ZO-0.03]){
      /* Traverse als Kastenprofil mit Auflagelippe - alles Signalorange (vorher zwei Extra-Toene fuer Licht/Schatten) */
      fr.push({geo:box(BW,0.095,0.05),m:tm(0,y-0.05,z),color:F('signalorange')});
      fr.push({geo:box(BW,0.022,0.062),m:tm(0,y-0.005,z),color:F('signalorange')});
      fr.push({geo:box(BW,0.018,0.05),m:tm(0,y-0.098,z),color:F('signalorange')});
      for(const x of [-BW/2,BW/2]){
        fr.push({geo:box(0.05,0.14,0.07),m:tm(x,y-0.045,z),color:F('anthrazit')});
        fr.push({geo:box(0.022,0.035,0.022),m:tm(x*0.94,y+0.02,z),color:F('lichtgrau')}); }
    }
    const dg=new THREE.BoxGeometry(BW-0.08,0.022,2*ZO-0.09); MAT.kachel(dg,3,1); decks.push({geo:dg,m:tm(0,y-0.005,0)});
    K.sp.forEach((x,si)=>{ const hit=bbox(sw,0.74,2*ZO,hitM,x,y+0.37,0,g,false); R.faecher.push({li,si,x,y,hit}); });
  });
  const mk=(teile,mat,art)=>{ const m=new THREE.Mesh(merge(teile),mat); m.userData.bauteil='regal'; m.userData.bauteilArt=art;
    if(HIQ){ m.castShadow=true; m.receiveShadow=true; } g.add(m); R.meshes.push(m); return m; };
  mk(fr,MAT.vc('lackMetall'),'rahmen'); mk(posts,MAT.get('regalStuetze'),'stuetzen'); mk(decks,MAT.get('regalBoden'),'boeden');
  posts.concat(decks).forEach(x=>x.geo.dispose()); box.weg();
  /* Inhaltsschild: zeigt, was gerade im Regal liegt (gemalt von drawRackSchild) */
  R.schildTex=tex(512,256,()=>{});
  plane(0.52,0.26,MAT.neu('etikett',{map:R.schildTex}),-XO+0.34,1.6,ZO+0.012,0,g).userData.bauteil='regal';
  bbox(0.56,0.3,0.012,MAT.ober('silbergrau','lackMetall'),-XO+0.34,1.6,ZO+0.004,g,false).userData.bauteil='regal';
  return R;
}
/* Fachbodenregal in einen fremden Sammler: o.box(w,h,d,farbe,x,y,z,rx,ry,rz) in Regalkoordinaten (Front +z) */
function _bkRegalFachboden(o){
  const B=o.box, w=o.breite, d=o.tiefe, H=o.hoehe, BLAU=MAT.farbe('signalblau'), ZINK=MAT.farbe('silbergrau');
  for(const sx of [-1,1]) for(const sz of [-1,1]) B(0.035,H,0.035,BLAU,sx*(w/2-0.018),H/2,sz*(d/2-0.018));
  for(const sx of [-1,1]) for(const y of [0.3,1.1]) B(0.02,0.02,d-0.04,BLAU,sx*(w/2-0.018),y,0,0.6*(y>1?1:-1),0,0);
  for(const y of o.boeden.concat([H])) B(w,0.022,d,ZINK,0,y-0.011,0);
  /* Rueckwand aus Lochblech nur unten */
  if(o.rueckwand) B(w-0.04,o.rueckwand,0.01,ZINK,0,0.1+o.rueckwand/2,-d/2+0.01);
  return {};
}

/* =========================================================
   Kasse (Schritt "Einheit", 15.10.2026, docs/fundament/einheit.md)

   Vorher: Kassenplatz buildCheckout (06) aus 30 Einzelmeshes mit vier freien Materialien (Korpus, Blende, Sockel) und drei
   eigenen Texturen je Kasse (Scanner, Tastatur, Laufband); SB-Terminal sbTerminal (06) als Geraete-Sammler mit eigenem Korpus-
   Material. Jetzt EIN Bauteil in der Geraete-Bauweise (bk.sammler, Klassen lack/metall/matt/glas/leucht wie geraetBau):
   gleiche Sache = gleiches Material - Korpus Weiss lackiert, Sockel Anthrazit, Leisten Alu blank, Gehaeuse Gummischwarz,
   Anzeigen ueber die Palette (anzeigeGruen, laserRot, anzeigeBlau).
     art 'kasse'    Kassenplatz 3,2 x 0,8 m mit Laufband, Scanner, Monitor auf Schwenkarm, Tastatur, Warentrenner
                    o = {parent, name (Textur Namensblende), pos (Textur Kassenbildschirm)} -> {korpus (Verdecker), band (Textur, laeuft), meshes}
     art 'sb'       SB-Terminal: Saeule mit Bildschirm, Bioptik-Scanner, Korbablage, Waage mit Tuetenhalter, Kartenterminal, Signalleuchte
                    o = {parent, x, z, bildschirm (Textur)} -> {g, korpus, lamp, lampM (MAT.neu, veraenderlich: frei/besetzt/Hilfe)}
     art 'sbTafel'  Rueckwand mit Schild "SB-KASSEN" auf zwei Pfosten: o = {parent, x, z, breite}
   Die Spiel-Logik (Kassieren, Schlange, Trefferflaechen, Lampe schalten) bleibt in den Huellen buildCheckout/sbTerminal/buildSBKasse.
   ========================================================= */
bk.kasse=function(o){
  const F=MAT.farbe, S=bk.sammler({form:{fase:0.02,faseMin:0.03},reihenfolge:['lack','metall','matt','glas','leucht'],bauteil:'kasse'});
  const WEISS=F('weiss'), ANTH=F('anthrazit'), DUNK=F('gummischwarz'), ALU=F('aluminium'), NAVY=F('nachtblau');
  if(o.art==='sbTafel'){ const g=o.parent, x=o.x, z=o.z, b=o.breite||3.6;
    S.box(b,0.34,0.12,x,2.35,z,NAVY,'lack');
    for(const sx of [x-1.6,x+1.6]) S.box(0.07,2.2,0.07,sx,1.15,z,F('silbergrau'),'metall');
    S.fertig(g,{schatten:false});
    bk.schild(g,{text:'SB-KASSEN',b:b-0.2,h:0.3,x,y:2.35,z:z+0.07,leucht:true});
    return {}; }
  if(o.art==='sb'){
    const g=new THREE.Group(); g.position.set(o.x,0,o.z); g.userData.bauteil='kasse'; g.userData.bauteilArt='sb'; o.parent.add(g);
    /* Korpus, Sockel, Front, Arbeitsplatte */
    S.rund(0.78,0.84,0.66,0.03,0,0.5,0,WEISS,'lack');
    S.box(0.72,0.08,0.6,0,0.04,0,ANTH,'matt')
     .box(0.6,0.5,0.012,0,0.48,0.333,F('lichtgrau'),'lack')
     .box(0.78,0.07,0.016,0,0.86,0.335,NAVY,'lack')
     .box(0.7,0.05,0.012,0,0.13,0.334,ALU,'metall')
     .rund(0.84,0.045,0.7,0.012,0,0.94,0,ANTH,'lack')
     .box(0.84,0.022,0.012,0,0.93,0.352,ALU,'metall');
    /* Scanner: Glasflaeche in der Platte, Laserkreuz, Scannerturm */
    S.box(0.36,0.006,0.27,0,0.963,0.09,F('tiefschwarz'),'matt')
     .box(0.32,0.004,0.23,0,0.966,0.09,ANTH,'glas')
     .box(0.28,0.002,0.004,0,0.969,0.09,F('laserRot'),'leucht',0,0.45,0)
     .box(0.28,0.002,0.004,0,0.969,0.09,F('laserRot'),'leucht',0,-0.45,0)
     .rund(0.38,0.17,0.08,0.02,0,1.045,-0.1,DUNK,'matt')
     .box(0.31,0.11,0.004,0,1.045,-0.059,ANTH,'glas')
     .box(0.26,0.003,0.002,0,1.045,-0.056,F('laserRot'),'leucht');
    /* Saeule mit Kappe, Bondrucker */
    S.rund(0.3,0.86,0.16,0.04,0,1.39,-0.25,WEISS,'lack').rund(0.31,0.05,0.17,0.02,0,1.8,-0.25,NAVY,'lack');
    S.rund(0.17,0.06,0.04,0.01,0,1.205,-0.155,DUNK,'matt').box(0.1,0.004,0.006,0,1.2,-0.134,F('tiefschwarz'),'matt').box(0.07,0.05,0.002,0,1.17,-0.132,F('cremeweiss'),'lack',0.15,0,0);
    /* Bildschirmgehaeuse auf Augenhoehe, leicht nach oben gekippt */
    const KX=-0.1, KY=1.53, KZ=-0.13;
    S.pivot(0,KY,KZ,KX,0,0).rund(0.53,0.39,0.05,0.02,0,0,0,DUNK,'matt').box(0.012,0.012,0.004,0,0.178,0.026,F('tiefschwarz'),'leucht').pivot();
    /* Kartenterminal rechts am kurzen Arm */
    S.zyl(0.014,0.018,0.13,10,0.31,1.03,-0.12,ALU,'metall')
     .pivot(0.31,1.14,-0.11,-0.55,-0.25,0).rund(0.1,0.17,0.035,0.012,0,0,0,DUNK,'matt').box(0.07,0.05,0.002,0,0.04,0.019,F('anzeigeBlau'),'leucht').box(0.07,0.055,0.004,0,-0.035,0.018,F('hellgrau'),'lack').pivot();
    /* links Korbablage, rechts Waage mit Tuetenhalter */
    S.rund(0.36,0.72,0.52,0.025,-0.6,0.36,0,WEISS,'lack').rund(0.4,0.035,0.56,0.01,-0.6,0.74,0,ANTH,'lack').box(0.4,0.02,0.012,-0.6,0.73,0.282,ALU,'metall');
    S.rund(0.36,0.84,0.52,0.025,0.6,0.42,0,WEISS,'lack').box(0.38,0.018,0.48,0.6,0.85,0,ALU,'metall').box(0.3,0.006,0.4,0.6,0.862,0.0,F('hellgrau'),'matt');
    for(const sx of [0.45,0.75]) S.zyl(0.011,0.011,0.5,8,sx,1.11,-0.22,ALU,'metall').zyl(0.009,0.009,0.34,8,sx,1.36,-0.06,ALU,'metall',Math.PI/2,0,0);
    S.zyl(0.011,0.011,0.31,8,0.6,1.36,-0.22,ALU,'metall',0,0,Math.PI/2).box(0.26,0.26,0.2,0.6,1.0,-0.05,F('cremeweiss'),'matt');
    /* Lichtsignal-Stange */
    S.zyl(0.014,0.014,0.32,10,0,1.98,-0.25,ALU,'metall').zyl(0.056,0.056,0.016,14,0,2.228,-0.25,ALU,'metall');
    const meshes=S.fertig(g), korpus=meshes.find(m=>m.userData.klasse==='lack');
    /* Bildschirm (eigene Textur) */
    const scr=plane(0.48,0.34,MAT.bild(o.bildschirm),0,KY+0.026*Math.sin(-KX),KZ+0.026*Math.cos(KX),0,g); scr.rotation.x=KX; scr.userData.bauteil='kasse';
    const lampM=MAT.neu('ampelGruen',{emissiveIntensity:1.6});
    const lamp=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.11,14),lampM); lamp.position.set(0,2.165,-0.25); lamp.userData.bauteil='kasse'; g.add(lamp);
    return {g,korpus,lamp,lampM,meshes};
  }
  /* art 'kasse': Kassenplatz. Lokal: x laengs (Band +x), z = Kundenseite +z */
  const g=o.parent, BELT_A=o.bandA||1.45, BELT_B=o.bandB||0.12;
  /* Korpus mit Sockelruecksprung, Edelstahlleiste, Frontblende zum Kunden mit Zierleiste */
  S.rund(3.2,0.74,0.8,0.02,0,0.5,0,WEISS,'lack');
  S.box(3.08,0.14,0.68,0,0.07,0,ANTH,'matt').box(3.22,0.04,0.82,0,0.15,0,ALU,'metall');
  S.box(3.12,0.5,0.03,0,0.56,0.405,WEISS,'lack').box(3.14,0.045,0.035,0,0.82,0.408,ALU,'metall');
  /* Arbeitsplatte mit gerundeter Vorderkante */
  S.box(3.34,0.05,0.86,0,0.925,0,F('lichtgrau'),'lack').zyl(0.026,0.026,3.34,12,0,0.925,0.43,F('lichtgrau'),'lack',0,0,Math.PI/2);
  /* Laufband: Seitenfuehrung Alu mit gelber Kante, Umlenkrollen, Endkappe */
  const BL=BELT_A-BELT_B+0.12, BX=(BELT_A+BELT_B)/2;
  for(const s2 of [-1,1]) S.box(BL+0.06,0.05,0.03,BX,0.965,s2*0.245,ALU,'metall').box(BL+0.06,0.012,0.012,BX,0.992,s2*0.245,F('signalgelb'),'matt');
  for(const ex of [BELT_B-0.04,BELT_A+0.06]) S.zyl(0.03,0.03,0.47,14,ex,0.956,0,ALU,'metall',Math.PI/2,0,0);
  S.box(0.07,0.1,0.5,BELT_A+0.12,0.94,0,ANTH,'lack');
  /* Warentrenner */
  S.pivot(BELT_A-0.25,0.985,0,0,0.08,0).box(0.035,0.055,0.42,0,0,0,NAVY,'matt').pivot();
  /* Scanner: in die Platte eingelassene Glasscheibe mit Rahmen, gruene LED */
  S.rund(0.5,0.05,0.44,0.012,-0.22,0.938,0,F('hellgrau'),'lack').box(0.42,0.035,0.36,-0.22,0.958,0,ANTH,'matt').box(0.026,0.026,0.01,-0.42,0.9775,0.16,F('anzeigeGruen'),'leucht');
  /* Kassenmonitor auf Schwenkarm */
  S.box(0.16,0.03,0.16,-0.8,0.96,-0.06,ANTH,'lack').zyl(0.022,0.028,0.34,12,-0.8,1.12,-0.06,ALU,'metall').box(0.04,0.04,0.16,-0.8,1.29,-0.01,ALU,'metall',0.5,0,0);
  S.pivot(-0.8,1.4,-0.06,0.16,0,0).rund(0.44,0.32,0.035,0.01,0,0,0,DUNK,'matt').pivot().box(0.46,0.02,0.05,-0.8,1.23,-0.056,DUNK,'matt');
  /* Tastatur (Wanne) auf der Bedienerseite vor dem Monitor, Kabel zur Kasse */
  S.pivot(-0.8,0.954,-0.32,-0.06,0,0).rund(0.44,0.026,0.175,0.006,0,0,0,DUNK,'matt').pivot();
  S.zyl(0.006,0.006,0.13,6,-0.8,0.952,-0.4,DUNK,'matt',1.35,0,0);
  const meshes=S.fertig(g), korpus=meshes.find(m=>m.userData.klasse==='lack');
  const R={korpus,meshes,band:null};
  const flach=(w,h,mat,x,y,z,rx,ry,rz,par)=>{ const m=plane(w,h,mat,x,y,z,0,par||g); m.rotation.set(rx||0,ry||0,rz||0); m.userData.bauteil='kasse'; return m; };
  /* Namensblende (Textur des Aufrufers: Ladenname) */
  if(o.name) flach(1.5,0.2,MAT.neu('etikett',{map:o.name}),0.74,0.6,0.423);
  /* Laufband: eigene Kopie der Bandtextur (sie laeuft - offset), Massstab 6 Kacheln ueber die UVs */
  { const t=MAT.tex('kassenband').clone(); t.needsUpdate=true; R.band=t;
    const bg=new THREE.BoxGeometry(BL,0.03,0.46); MAT.kachel(bg,6,1);
    const bm=new THREE.Mesh(bg,MAT.neu('kassenband',{map:t})); bm.position.set(BX,0.956,0); bm.userData.bauteil='kasse'; bm.userData.bauteilArt='band'; g.add(bm); }
  /* Warentrenner-Schild */
  bk.schild(g,{text:'NÄCHSTER KUNDE',b:0.4,h:0.05,px:0.5,x:BELT_A-0.25+0.019*Math.cos(0.08),y:0.985,z:-0.019*Math.sin(0.08),ry:Math.PI/2+0.08});
  /* Scannerscheibe, Tastaturfeld */
  flach(0.38,0.32,MAT.get('scannerGlas'),-0.22,0.9765,0,-Math.PI/2,0,0);
  flach(0.4,0.15,MAT.get('kassenTastatur'),-0.8,0.9685,-0.32,-Math.PI/2-0.06,0,Math.PI);
  /* Kassenbildschirm (Textur des Aufrufers, drawPOS) */
  if(o.pos){ const sg=new THREE.Group(); sg.position.set(-0.8,1.4,-0.06); sg.rotation.x=0.16; g.add(sg); flach(0.4,0.275,MAT.bild(o.pos),0,0,-0.02,0,Math.PI,0,sg); }
  return R;
};

/* =========================================================
   Tuer (Schritt "Einheit", 15.10.2026, docs/fundament/einheit.md) - JEDE Tuer im Spiel:
     art 'schiebe'  automatische Ladenschiebetuer (Haupteingang, Eingang 2; vorher buildSchiebetuer 05f aus 30 Einzelmeshes):
                    Antriebskasten Alu ueber der Oeffnung, Laufschiene, Bewegungsmelder innen/aussen, Bodenfuehrung, zwei Fluegel
                    (Alu-Rahmen, Glas, Sicherheitsmarkierung, Laufwagen). o = {x (Mitte), z (Laufebene), breite (je Fluegel 1,24),
                    hoehe 2,44, antrieb (Breite Antriebskasten 5,4), parent} -> {g, leaves:[Group links, rechts]} (bewegt 05f tuerSetD)
     Rueckbau 16.10.: die Drehfluegeltueren (Werk West, Kartonlager) und der PVC-Streifenvorhang (Schleuse, Lagergang) sind mit
     der grossen Halle entfallen - heute gibt es nur noch die Schiebetuer.
   Glas = MAT.get('glasScheibe') wie alle Scheiben (Fenster, Kuehlregal). Gleiche Sache = gleiches Material.
   ========================================================= */
bk.tuer=function(o){ return _bkSchiebetuer(o); };
function _bkSchiebetuer(o){
  const F=MAT.farbe, HB=o.antrieb||5.4, W=o.breite||1.24, HH=o.hoehe||2.44, Z=o.z, ALU=F('aluminium'), ALUD=F('silbergrau'), DUNK=F('anthrazit');
  const g=new THREE.Group(); g.position.x=o.x||0; g.userData.bauteil='tuer'; g.userData.bauteilArt='schiebe'; (o.parent||scene).add(g);
  const S=bk.sammler({form:{fase:0.01,faseMin:0.03,lod0Kasten:true},bauteil:'tuer'});
  /* Antriebskasten ueber der Oeffnung (reicht ueber beide Parktaschen), Abdeckung, Unterseite, Laufschiene */
  S.box(HB,0.24,0.26,0,HH+0.14,Z-0.05,ALU,'kunststoff').box(HB+0.04,0.05,0.3,0,HH+0.27,Z-0.05,ALUD,'kunststoff')
   .box(HB-0.1,0.05,0.2,0,HH+0.005,Z-0.05,DUNK,'kunststoff').box(HB-0.2,0.045,0.06,0,HH+0.05,Z-0.06,ALUD,'kunststoff');
  /* Bewegungsmelder innen und aussen (aussen an der Fassade ueber der Oeffnung) */
  for(const s of [-1,1]){ S.box(0.26,0.075,0.05,s*0.78,HH+0.05,Z-0.15,DUNK,'kunststoff',0.42,0,0); S.box(0.26,0.075,0.05,s*0.78,HH+0.2,Z+0.31,DUNK,'kunststoff',-0.42,0,0); }
  /* Bodenfuehrung */
  S.box(2.6,0.012,0.045,0,0.008,Z-0.02,ALUD,'kunststoff');
  S.fertig(g,{schatten:false});
  const leaves=[], glasM=MAT.get('glasScheibe'), mark=MAT.ober('weiss','kunststoff',{transparent:true,opacity:0.65});
  for(const s of [-1,1]){
    const lf=new THREE.Group(); g.add(lf); leaves.push(lf);
    const L=bk.sammler({form:{fase:0.01,faseMin:0.03,lod0Kasten:true},bauteil:'tuer'});
    L.box(W,0.09,0.055,0,HH-0.05,0,ALU,'kunststoff').box(W,0.11,0.055,0,0.055,0,ALU,'kunststoff')
     .box(0.055,HH-0.12,0.055,-W/2+0.028,HH/2,0,ALU,'kunststoff').box(0.055,HH-0.12,0.055,W/2-0.028,HH/2,0,ALU,'kunststoff');
    /* Laufwagen oben */
    for(const dx of [-0.34,0.34]) L.box(0.09,0.05,0.05,dx,HH+0.02,-0.06,ALUD,'kunststoff').zyl(0.022,0.022,0.03,10,dx,HH+0.045,-0.06,DUNK,'kunststoff',0,0,Math.PI/2);
    L.fertig(lf,{schatten:false});
    const gl=new THREE.Mesh(new THREE.BoxGeometry(W-0.09,HH-0.2,0.022),glasM); gl.position.set(0,HH/2,0); gl.userData.bauteil='tuer'; lf.add(gl);
    /* Sicherheitsmarkierung auf Griffhoehe */
    const mk=new THREE.Mesh(new THREE.BoxGeometry(W-0.1,0.055,0.026),mark); mk.position.set(0,1.32,0); mk.userData.bauteil='tuer'; lf.add(mk);
  }
  return {g,leaves};
}

/* =========================================================
   Fenster (Schritt "Einheit", 15.10.2026, docs/fundament/einheit.md) - JEDES Fenster in Laden und Lager:
     art 'schaufenster'  Glas buendig in der Laibung, schmale Leisten oben/unten, Mittelsprosse, Sohlbank aussen (Anthrazit wie
                         die Profile - Tom: "das Hellgraue muss weg"; vorher an der Erweiterung noch hellgrau). Basisladen (05c),
                         Erweiterungen (05e nachbarFassade), Eingang 2 Festfelder (05l).
                         o = {felder:[{x0,x1,y0,y1,sprosse(true),bank(y0>0,2)}], z (Glasebene), zarge:[{x0,x1,y1}] (Tueroeffnung:
                         Pfosten + Sturzprofil), pfosten:[x] (einzelne Pfosten ueber die volle Hoehe), parent, schmutz (Schmutzschicht je
                         Feld, Spielzustand S.grime)}
     art 'fluegel'       Lagerfenster mit zwei Fluegeln, Mittelpfosten, Griffen, Fensterbank aussen (Anthrazit) und innen (weiss); baut
                         die Wand um die Oeffnungen (bk.wand: Pfeiler, Bruestung, Sturz). o = {felder:[{cx,b,y0,y1}], wand:{x0,x1,z0,z1,
                         hoehe,innen,flaechen}}
   Profile Stahl Anthrazit, Glas MAT.get('glasScheibe') (eine Scheibe fuer alles). Je Aufruf: Rahmen EIN Mesh (Sammler), Glas EIN Mesh.
   -> {glas, rahmen:[Mesh], schmutz:[{mesh,mat}], waende:[Mesh]}
   ========================================================= */
bk.fenster=function(o){
  const F=MAT.farbe, AN=F('anthrazit'), S=bk.sammler({bauteil:'fenster'}), gl=[], R={glas:null,rahmen:[],schmutz:[],waende:[]}, par=o.parent||scene;
  const scheibe=(w,h,d,x,y,z)=>gl.push({geo:new THREE.BoxGeometry(w,h,d),m:tm(x,y,z)});
  if(o.art==='fluegel'){
    const W=o.wand, z0=W.z0, z1=W.z1, zm=(z0+z1)/2, H=W.hoehe;
    const wand=(a,b,y0,y1)=>{ if(b-a>0.005&&y1-y0>0.005) R.waende.push(bk.wand({x0:a,x1:b,z0,z1,y0,y1,innen:W.innen,flaechen:W.flaechen,ue:0})); };
    let x=W.x0;
    for(const f of o.felder){ const FB=f.b, a=f.cx-FB/2, b=f.cx+FB/2, Y0=f.y0, Y1=f.y1, fh=Y1-Y0, cx=f.cx;
      wand(x,a,0,H); wand(a,b,0,Y0); wand(a,b,Y1,H);
      /* Rahmen in der Wandmitte, Mittelpfosten, Fluegelrahmen, Glas, Griffe innen */
      S.box(FB,0.07,0.08,cx,Y1-0.035,zm,AN,'stahl').box(FB,0.07,0.08,cx,Y0+0.035,zm,AN,'stahl');
      for(const sx of [-1,1]) S.box(0.07,fh,0.08,cx+sx*(FB/2-0.035),Y0+fh/2,zm,AN,'stahl');
      S.box(0.06,fh-0.1,0.07,cx,Y0+fh/2,zm,AN,'stahl');
      for(const sx of [-1,1]){ const fx=cx+sx*FB/4;
        for(const dy of [0.075,fh-0.075]) S.box(FB/2-0.12,0.04,0.05,fx,Y0+dy,zm+0.01,AN,'stahl');
        scheibe(FB/2-0.14,fh-0.2,0.012,fx,Y0+fh/2,zm);
        S.box(0.025,0.12,0.03,cx+sx*0.1,Y0+fh/2,z0-0.01,F('aluminium'),'blank'); }
      /* Fensterbank aussen (Anthrazit wie die Schaufenster) und innen (weiss) */
      S.box(FB+0.08,0.03,0.2,cx,Y0-0.012,z1+0.06,AN,'stahl').box(FB+0.05,0.03,0.16,cx,Y0-0.012,z0-0.05,F('weiss'),'kunststoff');
      x=b; }
    wand(x,W.x1,0,H);
  } else {
    const z=o.z;
    for(const f of o.felder){ const bw=f.x1-f.x0, bh=f.y1-f.y0, cx=(f.x0+f.x1)/2, cy=(f.y0+f.y1)/2;
      scheibe(bw,bh,0.03,cx,cy,z);
      S.box(bw,0.06,0.12,cx,f.y0+0.03,z,AN,'stahl').box(bw,0.06,0.12,cx,f.y1-0.03,z,AN,'stahl');
      if(f.sprosse!==false) S.box(0.06,bh,0.1,cx,cy,z,AN,'stahl');
      if(f.bank!==false&&f.y0>0.2) S.box(bw+0.2,0.05,0.3,cx,f.y0,z+0.2,AN,'stahl');
      if(o.schmutz){ const m=MAT.neu('fensterSchmutz'), me=new THREE.Mesh(MAT.kachel(new THREE.BoxGeometry(bw-0.05,bh-0.04,0.015),2,1),m);
        me.position.set(cx,cy,z-0.07); me.renderOrder=3; me.userData.bauteil='fenster'; me.userData.bauteilArt='schmutz'; par.add(me); R.schmutz.push({mesh:me,mat:m}); } }
    for(const q of (o.zarge||[])){ const h=q.y1||2.5; for(const x of [q.x0,q.x1]) S.box(0.08,h,0.14,x,h/2,z,AN,'stahl'); S.box(q.x1-q.x0,0.08,0.14,(q.x0+q.x1)/2,h,z,AN,'stahl'); }
    for(const p of (o.pfosten||[])) S.box(0.06,p.h,0.12,p.x,p.h/2,z,AN,'stahl');
  }
  R.rahmen=S.fertig(par);
  if(gl.length){ R.glas=new THREE.Mesh(merge(gl),MAT.get('glasScheibe')); gl.forEach(q=>q.geo.dispose()); R.glas.userData.bauteil='fenster'; R.glas.userData.bauteilArt='glas'; par.add(R.glas); }
  return R;
};
