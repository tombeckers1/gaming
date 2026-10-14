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
/* Poller/Anfahrschutz (Signalgelb, Gummikappe - wie am alten R1) in einen Sammler; Rueckgabe = Kollisionsrechteck lokal */
bk.poller=function(S,x,z,o){
  o=o||{}; const h=o.hoehe||0.95, b=o.breite||0.2, F=MAT.farbe;
  S.box(b,h,b,x,h/2,z,F('signalgelb'),'kunststoff');
  S.box(b+0.02,0.14,b+0.02,x,h-0.09,z,F('gummischwarz'),'matt');
  return {x0:x-0.15,x1:x+0.15,z0:z-0.15,z1:z+0.15,art:'poller'};
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
   bk.inst(geo, mat, [Matrix4], {parent, schatten, bauteil, art}) -> InstancedMesh */
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
  if(HIQ&&o.schatten!==false){ im.castShadow=true; im.receiveShadow=true; }
  im.userData.bauteil=o.bauteil||'instanzen'; if(o.art) im.userData.bauteilArt=o.art;
  (o.parent||scene).add(im); return im;
};
/* Ladungstraeger: Mass je Art (l laengs x, b quer z, h Hoehe; Ursprung Mitte unten) */
bk.PALETTE={euro:{l:1.2,b:0.8,h:0.144,name:'Europalette EPAL 1200 x 800 x 144 mm'}};
const _bkPalGeo=new Map();
/* bk.palette(art, {fein}) -> geteilte Geometrie (Vertexfarben, Material MAT.vc('stumpf')).
   fein: Fasen an den Brettern (Standard ab Niedrig, wie V1); fein:false = einfache Kaesten
   (Hofstapel, viele Paletten in der Ferne). Je Art und Detail genau eine Geometrie. */
bk.palette=function(art,o){
  art=art||'euro'; const A=bk.PALETTE[art]; if(!A) throw new Error('bk.palette: Art unbekannt: '+art);
  const fein=!(o&&o.fein===false)&&bk.lod()>0, key=art+'|'+(fein?1:0);
  let geo=_bkPalGeo.get(key); if(geo) return geo;
  const HOLZ=MAT.farbe('holzPalette'), HOLZ2=MAT.farbe('holzPaletteDunkel'), H=A.h, lx=A.l/2-0.05, bz=A.b/2-0.06;
  const S=bk.sammler({form:fein?{fase:0.01,seg:2,lod0Kasten:true}:{},klasse:'stumpf'});
  /* 9 Kloetze, 3 Bodenbretter laengs, 3 Querbretter, 5 Deckbretter (aussen und Mitte breit) */
  for(const dx of [-lx,0,lx]) for(const dz of [-bz,0,bz]) S.box(0.12,0.078,0.12,dx,0.061,dz,HOLZ2);
  for(const dz of [-bz,0,bz]) S.box(A.l,0.022,0.12,0,0.011,dz,HOLZ);
  for(const dx of [-lx,0,lx]) S.box(0.14,0.022,A.b,dx,0.111,0,HOLZ);
  for(const dz of [-bz,-bz/2,0,bz/2,bz]){ const breit=dz===0||Math.abs(dz)>bz*0.9; S.box(A.l,0.022,breit?0.14:0.1,0,H-0.011,dz,HOLZ); }
  geo=S.geometrie(); geo.computeBoundingSphere(); geo.userData={bauteil:'palette',art,fein};
  _bkPalGeo.set(key,geo); return geo;
};
/* bk.paletten(liste, {gruppe, fein, schnee, parent, schatten}) -> {holz, schnee}: Paletten als
   EIN InstancedMesh. liste = [{x,y,z,ry}] (y = Unterkante). schnee = [{x,y,z,ry}] Schneehauben
   (Instanzen, weissMatt). gruppe: Aufrufe mit demselben Namen landen in denselben Instanzen
   (Hofstapel an mehreren Stellen = ein Zeichenaufruf). */
const _bkPalGruppe=new Map();
bk.paletten=function(liste,o){
  o=o||{}; const A=bk.PALETTE[o.art||'euro'];
  let G=o.gruppe?_bkPalGruppe.get(o.gruppe):null;
  /* Instanzen relativ zur ersten Palette der Gruppe: das Mesh steht dort (Karte, Hofobjekte) */
  if(!G){ const e0=liste[0]||{x:0,z:0}; G={holz:[],schnee:[],mHolz:null,mSchnee:null,ox:e0.x,oz:e0.z}; if(o.gruppe) _bkPalGruppe.set(o.gruppe,G); }
  const M=e=>tm(e.x-G.ox,e.y||0,e.z-G.oz,0,e.ry||0,0);
  for(const e of liste) G.holz.push(M(e)); for(const e of (o.schnee||[])) G.schnee.push(M(e));
  const par=o.parent||scene;
  if(G.mHolz) G.mHolz.parent&&G.mHolz.parent.remove(G.mHolz);
  if(G.mSchnee) G.mSchnee.parent&&G.mSchnee.parent.remove(G.mSchnee);
  G.mHolz=bk.inst(bk.palette(o.art||'euro',{fein:o.fein}),MAT.vc('stumpf'),G.holz,{parent:par,schatten:o.schatten,bauteil:'palette',art:o.art||'euro'});
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
