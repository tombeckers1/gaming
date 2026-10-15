/* =========================================================
   Paletten, Hubwagen und die Abholung durch DDL (Tom, 07.10.:
   "Die Versandecke zieht ans hintere Ende von Lager Sued, dort ein
   Rolltor V1 mit eigenem Versandhof.")
   09.10. (Tom, versand-sb-0910.md): DDL kommt NUR auf Anruf - Telefon an
   der Wand neben V1. Jede Abholung kostet eine Pauschale, dazu Porto je
   Paket (11c). Der DDL-Fahrer faehrt die Paletten selbst mit dem Hubwagen
   in den LKW; der Spieler laedt nicht mehr. Vor dem Tor liegt eine
   abgesperrte Ladezone (05h). Solange der LKW steht, ist die Box belegt -
   der Kran wartet. Sind alle Paletten voll und niemand ruft, staut sich
   das Band bis an die Tische. Keine feste Abholung um 22 Uhr, keine
   automatische Zwischenabholung mehr.

   Jede Palette ist ein eigenes Ding (S.paletten): sie steht in der Box
   ('z', idx = Platz in der Schlange, 0 am Tor), haengt am Hubwagen ('h')
   oder steht im LKW ('l'). Ihr Inhalt sind die Pakete in S.paketGr, deren
   Eintrag in S.paketP auf die Palette zeigt. Nimmt der Fahrer die vorderste
   Palette heraus, ruecken die anderen nach und hinten steht eine neue, leere.
   Frame V1: lx laeuft vom Tor in den LKW (negativ = im Laderaum, positiv
   = in der Halle), lz seitlich; Welt = (V1.x - lz, V1.rz + lx).
   ========================================================= */
const PAL_LG=1.2, PAL_BR=0.8;          /* Europalette */
/* Abholung auf Anruf (Tom 09.10.; Anruf am Wandtelefon oder per Handy, Onlineshop-App).
   DDL_PAUSCHALE 39 EUR, nachgerechnet fuer Stufe 1 (1 Palette, ~90 S-Pakete Platz, Level 25):
   ~12 Bestellungen/Tag x Deckungsbeitrag ~26 EUR (Ware + Versandeinnahme) = 312, minus Porto
   (~2,6 je Paket) und Packmaterial (~1,6) = ~262 EUR/Tag. Ein Anruf am Tag reicht (Pakete von
   gestern kosten Ruf). Selbst gepackt: 262 - 39 = ~223 EUR/Tag (Pauschale = 15 %). Mit
   Versandmitarbeiter (165 EUR Lohn): ~58 EUR/Tag, Schwelle ~9,4 Bestellungen/Tag - der Lohn,
   nicht die Pauschale, entscheidet. Bei nur 3 Paketen kostet ein Anruf 13 EUR je Paket: das
   soll zum Sammeln bis zum Abend anregen. Darum bleibt es bei 39 EUR.
   DDL_ANFAHRT: Sekunden vom Anruf bis der LKW einbiegt (rund 50 Spielminuten). */
const DDL_PAUSCHALE=WIRT.versand.ddl.pauschale, DDL_ANFAHRT=WIRT.versand.ddl.anfahrtSek, DDL_RUF=1.5;   /* Pauschale/Anfahrt: 01c-wirtschaft.js */
/* Mitte des Tors (0,45 m ostwaerts der Box-Mitte: so bleibt neben der Box eine Gasse von 1,2 m zum Tor), Wandmitte, Heck des LKW */
const V1={x:-10.25,w:3.26,h:3.0,wz:-30.0,rz:-30.05};
const V1_HOF={x0:-15.7,x1:-4.7,z0:-45.6,z1:-30.1};
function vf(lx,lz){ return {x:V1.x-lz,z:V1.rz+lx}; }
function vfRueck(x,z){ return {lx:z-V1.rz,lz:V1.x-x}; }
/* Platz im Laderaum: tiefste Reihe zuerst, zwei Plaetze nebeneinander mit Fahrgasse dazwischen */
/* Die Box steht 0,45 m seitlich der Torachse (lz = V1.x - Box-Mitte) */
const BOX_LZ=0.45;
const DDL_SLOTS=6;
/* Stand des Bedieners vor der vordersten Palette: Palette liegt 1,3 m voraus */
function boxStandLx(){ const c=palZentrumWelt(0), f=vfRueck(c.x,c.z); return f.lx-1.3; }
function ddlSlot(i){ const r=i>>1; return {lx:-7.7+r*1.3,lz:(i&1)?1.0:-1.0}; }   /* zwei Spalten, in der Mitte bleibt eine Gasse (+-0.6) fuer den Hubwagen */

const vsPalObj={};          /* id -> {g,holz,pk,sig,cx,cz} */
const palHits=[];           /* Trefferflaechen der Boxplaetze (Station) */
const HUB={pal:null,g:null,park:null,t:0,von:null};
const DDL={ruf:false,warte:false,eta:0,t:0,lad:0,voll:false,heute:0};
const VT={g:null,rahmen:null,raum:null,bruecke:null,state:null,t:0,flap:0,cols:[],flapCol:null};
/* Fahrer und Hubwagen (ldUpdate): jx/jz = Gabelfuss, psi = Richtung der Gabel in (lx,lz), fx/fz/fpsi = Fahrer (haengt am Griff, wenn att),
   pf = Weg, wd = Drehung auf der Stelle, hub 0..1 = Gabelhub, phi = Deichselwinkel, gang = Gehtempo (negativ = rueckwaerts) */
const LD={ph:'idle',t:0,pal:null,fig:null,jack:null,slot:0,ziel:null,jx:0,jz:0,psi:0,fx:0,fz:0,fpsi:0,att:false,armW:0,hub:0,phi:0,phiZ:0,door:0,gang:0,pf:null,wd:null};
const VD={g:null,panels:[],t:0,target:0,col:null,lampG:null,lampR:null,warn:null,sign:null,signHit:null};

/* ---------------------------------------------------------
   Daten
   --------------------------------------------------------- */
function vsPalInit(){
  if(!S) return;
  S.paketGr=Array.isArray(S.paketGr)?S.paketGr:[];
  /* dieselben Objekte behalten: Hubwagen und Fahrer halten Verweise auf sie */
  S.paletten=(Array.isArray(S.paletten)?S.paletten:[]).filter(p=>p&&['z','h','l'].indexOf(p.ort)>=0);
  S.paletten.forEach(p=>{ p.id=p.id|0; p.idx=p.idx|0; });
  S.palNr=Math.max(S.palNr|0,...S.paletten.map(p=>p.id),0);
  if(!Array.isArray(S.paketP)) S.paketP=[];
  while(S.paketP.length<S.paketGr.length) S.paketP.push(-1);
  S.paketP.length=S.paketGr.length;
  for(let i=0;i<S.paketP.length;i++) if(!S.paletten.some(p=>p.id===S.paketP[i])) S.paketP[i]=-1;
}
function vsPalNeu(ort,idx){ S.palNr=(S.palNr|0)+1; const p={id:S.palNr,ort,idx}; S.paletten.push(p); return p; }
function vsPalById(id){ return S.paletten.find(p=>p.id===id)||null; }
/* Mittelpunkt eines Boxplatzes in Stationskoordinaten und in der Welt */
function palZentrum(idx){ return PALETTEN[Math.max(0,Math.min(PALETTEN.length-1,idx))]; }
function palZentrumWelt(idx){ const c=palZentrum(idx); return localToWorld(packTisch,c.x,c.z); }
/* Wie viele Palettenplaetze hat die Box in dieser Stufe? */
function palPlaetze(){ return zoneOffen('packstation')?PAL_N[packStufe()]:0; }
/* Inhalt einer Palette: Indizes in S.paketGr */
function vsPalPakete(p){ const out=[]; const n=vsGelandet(); for(let i=0;i<n;i++) if(S.paketP[i]===p.id) out.push(i); return out; }
function vsPalZahl(p){ return vsPalPakete(p).length; }
function vsPalZelle(){ return S.paletten.filter(p=>p.ort==='z').sort((a,b)=>a.idx-b.idx); }
/* Schlange in der Box: lueckenlos von 0 am Tor an, hinten kommen leere Paletten nach */
function vsPalAbgleich(){
  if(!S||!packTisch) return;
  vsPalInit();
  const N=palPlaetze(), z=vsPalZelle();
  z.forEach((p,i)=>{ p.idx=i; });
  while(z.length<N){ z.push(vsPalNeu('z',z.length)); }
  /* zu viele: alte Spielstaende hatten 2/4/6 Paletten, seit 09.10. sind es 1/2/3. Die
     ueberzaehligen verschwinden; ihre Pakete suchen sich Platz auf den anderen (oder warten) */
  for(let i=z.length-1;i>=N&&i>=0;i--){ const p=z.pop(); for(let k=0;k<S.paketP.length;k++) if(S.paketP[k]===p.id) S.paketP[k]=-1; vsPalVerwerfen(p); S.paletten.splice(S.paletten.indexOf(p),1); }
}
/* Nimmt die Palette neue Pakete an? */
function vsPalAufnehmend(p){ return p.ort==='z'; }

/* ---------------------------------------------------------
   Stapeln: Hoehenbild (seit 09.10. gemischte Groessen). Gerechnet in
   Palettenkoordinaten (Mitte 0/0, lange Seite in x). Ein Paket mit
   festem Eintrag in S.paketP bleibt auf seiner Palette; die anderen
   suchen sich die erste Palette in der Box, auf die es passt.
   Ergebnis: {lage:[...] je Eintrag (null = passt nirgends), pro:{palId:[...]}}
   --------------------------------------------------------- */
function vsStapelP(neuGr){
  vsPalInit();
  const n=vsGelandet();
  const rect=(gr,x,z)=>{ const G=VS_GR[gr]; return {x0:x-G.x/2,x1:x+G.x/2,z0:z-G.z/2,z1:z+G.z/2}; };
  const mpos=(gr,k)=>{ const o=VS_MUSTER[gr].pos(k); return {x:o.z,z:o.x}; };
  /* 09.10.: Hoehenbild statt "jede Lage eine Groesse" - mit nur einer Palette (Stufe 1)
     blockierte sonst ein einzelnes kleines Paket jede groessere Groesse. Ein Paket kommt an
     einen Musterplatz seiner Groesse, so tief wie moeglich: es liegt auf der hoechsten
     Oberkante darunter, und an allen 9 Messpunkten liegt genau dort etwas (Palette oder
     Paket mit gleicher Oberkante) - nichts haengt in der Luft, nichts steckt ineinander. */
  const platz=(boxen,gr)=>{ const M=VS_MUSTER[gr], G=VS_GR[gr]; let best=null;
    for(let k=0;k<M.n;k++){ const o=mpos(gr,k), r=rect(gr,o.x,o.z);
      let h=0; for(const q of boxen) if(r.x0<q.x1-0.004&&r.x1>q.x0+0.004&&r.z0<q.z1-0.004&&r.z1>q.z0+0.004) h=Math.max(h,q.top);
      if(h+G.h>VS_HMAX+1e-6) continue;
      if(best&&h>=best.h-1e-6) continue;
      let ok=true;
      if(h>0) for(const u of [-0.85,0,0.85]) { for(const v of [-0.85,0,0.85]){
        const px=(r.x0+r.x1)/2+u*(r.x1-r.x0)/2, pz=(r.z0+r.z1)/2+v*(r.z1-r.z0)/2;
        if(!boxen.some(q=>Math.abs(q.top-h)<0.005&&px>=q.x0&&px<=q.x1&&pz>=q.z0&&pz<=q.z1)){ ok=false; break; } } if(!ok) break; }
      if(ok) best={k,r,o,h}; }
    return best; };
  const st={}; S.paletten.forEach(p=>{ st[p.id]=[]; });
  const aufnehmend=vsPalZelle();
  const liste=[]; for(let i=0;i<n;i++) liste.push({gr:S.paketGr[i],p:S.paketP[i],i});
  if(neuGr) liste.push({gr:neuGr,p:-1,i:n,neu:true});
  const lage=[], pro={}; S.paletten.forEach(p=>{ pro[p.id]=[]; });
  for(const it of liste){
    const G=VS_GR[it.gr]||VS_GR[1];
    const fest=it.p>=0&&st[it.p]?vsPalById(it.p):null;
    const versuche=[fest?[fest]:aufnehmend];
    if(fest) versuche.push(aufnehmend);
    let pal=null, wahl=null;
    for(const kand of versuche){ for(const q of kand){ const w=platz(st[q.id],G.id); if(w){ pal=q; wahl=w; break; } } if(pal) break; }
    if(!pal){ lage.push(null); continue; }
    wahl.r.top=wahl.h+G.h; st[pal.id].push(wahl.r);
    const j=Math.sin((it.i+1)*12.9898)*43758.5453, jr=j-Math.floor(j)-0.5;
    const e={x:wahl.o.x+jr*0.004,y:PAL_H+wahl.h+G.h/2,z:wahl.o.z-jr*0.006,ry:jr*0.016,gr:G.id,p:pal.id,i:it.i,neu:!!it.neu};
    lage.push(e); pro[pal.id].push(e);
    if(!it.neu) S.paketP[it.i]=pal.id;
  }
  return {lage,pro};
}
/* Platz fuer das naechste Paket in Stationskoordinaten (absolut) oder null */
function vsPalZiel(gr){
  vsPalAbgleich();
  const R=vsStapelP(gr), e=R.lage[R.lage.length-1];
  if(!e||!e.neu) return null;
  const p=vsPalById(e.p), c=palZentrum(p.idx);
  return {x:c.x+e.x,y:e.y,z:c.z+e.z,ry:e.ry,gr:e.gr,p:p.id,f:p.idx};
}
/* Alle Pakete der Box in Stationskoordinaten - fuer Tests */
function vsStapelLage(){
  vsPalAbgleich();
  const R=vsStapelP(0), out=[];
  for(const p of S.paletten){ if(p.ort!=='z') continue; const c=palZentrum(p.idx);
    for(const e of R.pro[p.id]) out.push({x:c.x+e.x,y:e.y,z:c.z+e.z,ry:e.ry,gr:e.gr,p:p.id,f:p.idx}); }
  return out;
}
/* Wie viele Pakete einer Groesse auf die leeren Paletten der Box passen */
function vsKapazitaet(gr){ const G=VS_GR[gr||1]; return Math.max(1,palPlaetze())*VS_MUSTER[G.id].n*Math.floor((VS_HMAX+1e-6)/G.h); }

/* ---------------------------------------------------------
   Modelle
   --------------------------------------------------------- */
/* Palette: Europalette aus dem Baukasten (bk.palette, 04z) - vorher eigene Geometrie vsHolzGeo hier */
/* Pakete einer Palette zu einem Mesh: Seiten ein Material, Deckel je
   Groesse - so kostet auch ein hoher Stapel nur wenige Zeichenaufrufe */
function vsPaketMeshe(items){
  const M=vsMat(), mats=[M.seite,M.deckel[1],M.deckel[3],M.deckel[6]];
  const pos=[], nor=[], uv=[], idx=[[],[],[],[]]; let v0=0;
  const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), s1=new THREE.Vector3(1,1,1), p3=new THREE.Vector3();
  const n3=new THREE.Matrix3(), vv=new THREE.Vector3();
  for(const it of items){
    const geo=M.geo[it.gr], P_=geo.attributes.position, N_=geo.attributes.normal, U_=geo.attributes.uv, ix=geo.index.array;
    e.set(0,it.ry||0,0); q.setFromEuler(e); p3.set(it.x,it.y,it.z); m4.compose(p3,q,s1); n3.getNormalMatrix(m4);
    for(let k=0;k<P_.count;k++){ vv.fromBufferAttribute(P_,k).applyMatrix4(m4); pos.push(vv.x,vv.y,vv.z);
      vv.fromBufferAttribute(N_,k).applyMatrix3(n3).normalize(); nor.push(vv.x,vv.y,vv.z); uv.push(U_.getX(k),U_.getY(k)); }
    for(const g of geo.groups){ const b=(g.materialIndex===2)?(it.gr===1?1:it.gr===3?2:3):0;
      for(let k=g.start;k<g.start+g.count;k++) idx[b].push(ix[k]+v0); }
    v0+=P_.count;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  const all=[]; let start=0;
  idx.forEach((a,mi)=>{ if(a.length){ geo.addGroup(start,a.length,mi); start+=a.length; for(const k of a) all.push(k); } });
  geo.setIndex(all);
  const m=new THREE.Mesh(geo,mats);
  if(HIQ){ m.castShadow=true; m.receiveShadow=true; }
  return m;
}
function vsPalObjekt(p){
  let o=vsPalObj[p.id];
  if(o) return o;
  /* Palette = Baukasten (bk.palette), eine Instanz mit eigener Alterung (bk.palFarbe nach Nummer); bewegt sich mit der Gruppe */
  const g=new THREE.Group(), holz=bk.inst(bk.palette('euro'),MAT.get('palette'),[new THREE.Matrix4()],{parent:g,bauteil:'palette',art:'euro',farben:[bk.palFarbe(0,0,0,p.id+1)]});
  g.userData.pal=p.id;
  o=vsPalObj[p.id]={g,holz,pk:null,sig:'',cx:null,cz:null,id:p.id};
  return o;
}
function vsPalVerwerfen(p){
  const o=vsPalObj[p.id];
  if(o){ if(o.g.parent) o.g.parent.remove(o.g); if(o.pk) o.pk.geometry.dispose(); delete vsPalObj[p.id]; }
  if(p.col){ dropCol(p.col); p.col=null; }
}

/* ---------------------------------------------------------
   Zeichnen: Paletten samt Paketen aufbauen und an ihren Ort stellen
   --------------------------------------------------------- */
function syncPakete(){
  if(!packTisch||!S) return;
  S.paketGr=Array.isArray(S.paketGr)?S.paketGr:[];
  if((S.pakete|0)!==S.paketGr.length) vsAbgleich();
  vsPalAbgleich();
  const R=vsStapelP(0);
  const lebend=new Set(S.paletten.map(p=>p.id));
  for(const id of Object.keys(vsPalObj)) if(!lebend.has(+id)){ const o=vsPalObj[id]; if(o.g.parent) o.g.parent.remove(o.g); if(o.pk) o.pk.geometry.dispose(); delete vsPalObj[id]; }
  pakete.length=0;
  for(const p of S.paletten){
    const o=vsPalObjekt(p), items=R.pro[p.id]||[];
    const sig=items.map(e=>e.gr+'@'+e.x.toFixed(3)+','+e.y.toFixed(3)+','+e.z.toFixed(3)).join(';');
    if(sig!==o.sig){
      o.sig=sig;
      if(o.pk){ o.g.remove(o.pk); o.pk.geometry.dispose(); o.pk=null; }
      if(items.length){ o.pk=vsPaketMeshe(items); o.g.add(o.pk); }
    }
    if(o.pk) pakete.push(o.pk);
    vsPalStellen(p,o,false);
  }
  vsPalKollision();
}
/* Ort der Palette: Box (Station), Hubwagen oder LKW */
function vsPalStellen(p,o,sofort){
  const g=o.g;
  if(p.ort==='z'){
    if(g.parent!==packTisch){ if(g.parent) g.parent.remove(g); packTisch.add(g); g.position.y=0; g.rotation.y=0; sofort=true; }
    const c=palZentrum(p.idx);
    if(sofort||o.cx===null){ o.cx=c.x; o.cz=c.z; }
    g.position.set(o.cx,0,o.cz);
  } else if(p.ort==='l'){
    if(g.parent!==scene){ if(g.parent) g.parent.remove(g); scene.add(g); }
    const s=ddlSlot(p.idx), w=vf(s.lx,s.lz); g.position.set(w.x,LADEBODEN_V1,w.z); g.rotation.y=Math.PI/2; o.cx=null;
  } else if(p.ort==='h'){
    if(g.parent!==scene){ if(g.parent) g.parent.remove(g); scene.add(g); }
    o.cx=null;
  }
}
/* Kollision: die Box (Zaun, Pfosten, Paletten) haengt an der Versandecke,
   Paletten im LKW sind Hindernisse in der Welt */
function vsPalKollision(){
  if(typeof packMov!=='undefined'&&packMov&&grabbed!==packMov) applyFootprint(packMov);
  for(const p of S.paletten){
    if(p.ort==='l'){ if(!p.col){ const s=ddlSlot(p.idx), w=vf(s.lx,s.lz); p.col=col(w.x-0.4,w.x+0.4,w.z-0.6,w.z+0.6,'palette'); if(typeof navDirty==='function') navDirty(); } }
    else if(p.col){ dropCol(p.col); p.col=null; if(typeof navDirty==='function') navDirty(); }
  }
}
/* gleitende Anzeige der Boxplaetze, wenn die Schlange nachrueckt */
function vsPalZeichnen(dt){
  for(const p of S.paletten){ if(p.ort!=='z') continue; const o=vsPalObj[p.id]; if(!o||o.cx===null) continue;
    const c=palZentrum(p.idx), d=Math.hypot(c.x-o.cx,c.z-o.cz);
    if(d>0.001){ const k=Math.min(1,dt*1.2/d); o.cx+=(c.x-o.cx)*k; o.cz+=(c.z-o.cz)*k; o.g.position.set(o.cx,0,o.cz); }
  }
}
function vsPalGleitet(){ for(const p of S.paletten){ if(p.ort!=='z') continue; const o=vsPalObj[p.id]; if(o&&o.cx!==null){ const c=palZentrum(p.idx); if(Math.hypot(c.x-o.cx,c.z-o.cz)>0.02) return true; } } return false; }
/* Trefferflaeche: nur noch das Wandtelefon (09.10.) - die Paletten faehrt der DDL-Fahrer */
function vsPalHits(){ return VD.telHit?[VD.telHit]:[]; }

/* ---------------------------------------------------------
   Hubwagen: der DDL-Fahrer nimmt die vorderste Palette auf und
   faehrt sie rueckwaerts in den Laderaum (ldUpdate). Ein zweiter
   Hubwagen steht als Ausstattung im Versandhof.
   --------------------------------------------------------- */
function hubDa(){ return zoneOffen('packstation'); }
/* Der Spieler faehrt keinen Hubwagen mehr (Tom 09.10.); die Abfragen bleiben fuer
   Karre, Kiste und Moebel, die danach fragen */
function hubAn(){ return false; }
function hubKollision(){}
/* Der Hubwagen ist ein Baukasten-Bauteil: bk.hubwagen (04z) */
/* Kran oder Greifer gerade an den Paletten? Dann wartet der Fahrer. */
function roboterBusy(){ return vsPortal.phase!=='ruhe'||vsBahn.some(e=>e.phase==='greifer'); }
/* Palette aus der Schlange nehmen: sie haengt am Hubwagen, ldPose setzt ihre Lage jedes Bild (die Gabel steckt schon in ihr) */
function palAufnehmen(p){
  const o=vsPalObjekt(p);
  p.ort='h'; p.idx=0;
  vsPalStellen(p,o,true);
  vsPalAbgleich(); syncPakete();
}
function hubAufbauPark(){
  if(HUB.park||!packTisch) return;
  /* der Hubwagen steht im Versandhof neben dem Tor, die Gabeln zeigen vom Tor weg */
  HUB.park=bk.hubwagen({x:V1.x+3.6,y:0.036,z:V1.wz-1.5,ry:0}).g;
}

/* ---------------------------------------------------------
   Versandhof und Rolltor V1
   --------------------------------------------------------- */
function vdSetzen(t){
  VD.t=clamp(t,0,1);
  /* der Behang laeuft als Ganzes hoch und wickelt sich Lamelle fuer Lamelle in den Kasten (bk.tor, art roll) */
  if(VD.T) VD.T.set(VD.t);
  if(VD.t>0.12){ if(VD.col){ dropCol(VD.col); VD.col=null; if(typeof navDirty==='function') navDirty(); } }
  else if(!VD.col){ VD.col=col(V1.x-V1.w/2,V1.x+V1.w/2,V1.wz-0.08,V1.wz+0.08); if(typeof navDirty==='function') navDirty(); }
  const offen=VD.t>=0.98;
  if(VD.lampG) VD.lampG.emissiveIntensity=offen?1.6:0;
  if(VD.lampR) VD.lampR.emissiveIntensity=offen?0:1.4;
}
function vdOffen(v){ VD.target=v?1:0; }
function vdIstOffen(){ return VD.t>=0.98; }
function vdUpdate(dt){
  if(!VD.g) return;
  const d=VD.target-VD.t;
  if(Math.abs(d)<0.002){ if(VD.warn) VD.warn.emissiveIntensity=0; return; }
  if(VD.warn) VD.warn.emissiveIntensity=(Math.sin(performance.now()*0.012)>0?1.8:0.05);
  VD.snd=(VD.snd||0)-dt; if(VD.snd<=0){ VD.snd=0.42; sfx.rolltor(distVol(V(V1.x,1.5,V1.wz))); }
  vdSetzen(VD.t+(d>0?1:-1)*Math.min(Math.abs(d),dt/3.4));
}
/* Rolltor-Lamellen (Tom 09.10.: "grafisch aufwerten - Lamellen, Fuehrungsschienen, Antrieb,
   Bodendichtung, Warnmarkierung"): Textur seit 13.10. Atlas torBlatt (01b), Tor baut bk.tor.
   Seit 14.10. (Tom: "so wie damals das allererste Rolltor ... das war grau") tragen alle Ladetore,
   auch V1, die Optik des alten R1 - die graphitfarbene Lamellenoptik ist verworfen. */
/* vsWarnTex() entfaellt (13.10., Materialangleichung): Warnschraffur = MAT.get('warnschraffur') */
/* Schild "DDL Abholung" (Tom 09.10., wie im Zielbild: dunkelblau, Paket-Symbol) */
function ddlSchildTex(){
  return tex(1024,416,(g,W,H)=>{ g.fillStyle='#1f3152'; g.fillRect(0,0,W,H);
    const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'rgba(255,255,255,0.07)'); gr.addColorStop(1,'rgba(0,0,0,0.14)'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=6; g.strokeRect(10,10,W-20,H-20);
    g.strokeStyle='#f2f4f7'; g.lineWidth=12; g.lineJoin='round';
    const x=80, y=88, s2=240;
    g.beginPath(); g.moveTo(x,y+s2*0.28); g.lineTo(x+s2*0.5,y+s2*0.02); g.lineTo(x+s2,y+s2*0.28); g.lineTo(x+s2,y+s2*0.78); g.lineTo(x+s2*0.5,y+s2*1.04); g.lineTo(x,y+s2*0.78); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(x,y+s2*0.28); g.lineTo(x+s2*0.5,y+s2*0.54); g.lineTo(x+s2,y+s2*0.28); g.moveTo(x+s2*0.5,y+s2*0.54); g.lineTo(x+s2*0.5,y+s2*1.04);
    g.moveTo(x+s2*0.25,y+s2*0.15); g.lineTo(x+s2*0.75,y+s2*0.41); g.lineTo(x+s2*0.75,y+s2*0.6); g.stroke();
    g.fillStyle='#f2f4f7'; g.textBaseline='alphabetic'; g.textAlign='left';
    g.font='700 118px "Barlow Condensed", Inter, sans-serif'; g.fillText('DDL',420,182);
    g.font='600 112px "Barlow Condensed", Inter, sans-serif'; g.fillText('Abholung',420,330); });
}
function buildVersandhof(){
  if(VD.g) return;
  const g=new THREE.Group(); scene.add(g); VD.g=g;
  const dark=MAT.get('stahlAnthrazit');
  /* Vertexfarben: Lampe, Schildrahmen, Telefon - ein Zeichenaufruf (das Tor baut bk.tor) */
  const VC=bk.sammler({form:{fase:0.012,seg:2,lod0Kasten:true},bauteil:'versandhof'}), B=(w,h,d,c,x,y,z,rx,ry,rz)=>VC.box(w,h,d,x,y,z,c,null,rx,ry,rz);
  const Cy=(r,h,c,x,y,z,rx,ry,rz,seg)=>VC.zyl(r,r,h,seg||10,x,y,z,c,null,rx,ry,rz);
  const ANTH=MAT.farbe('anthrazit');
  /* Das Rolltor selbst: bk.tor (04z) - Blatt mit sechs Panelen, Schienen innen und aussen,
     Wickelkasten, Antrieb, gelber Bedienkasten, Ampel (09.10. Tom: links neben dem Tor),
     Warnleuchte, Zarge, Torabdichtung, Vordach, Poller. Innen = +z der Welt. */
  const T=bk.tor({art:'roll',breite:V1.w,hoehe:V1.h,wand:[-0.1,0.1],blatt:0,nr:null,bedien:1,x:V1.x,z:V1.wz,ry:-Math.PI/2,parent:g});
  for(const r of T.kollision) col(r.x0,r.x1,r.z0,r.z1);
  VD.T=T; VD.panels=T.panele; VD.lampR=T.ampel.rot; VD.lampG=T.ampel.gruen; VD.warn=T.warn;
  /* Schwanenhalslampe links ueber dem Tor (Zielbild), Licht nach unten */
  { const LX=V1.x-V1.w/2-0.7, LY=V1.h+0.9;
    B(0.16,0.22,0.04,ANTH,LX,LY,V1.wz+0.12);
    /* Schwanenhals als Bogen aus kurzen Rohrstuecken (Ebene x = LX) */
    { let py=LY, pz=V1.wz+0.13; for(let i=1;i<=8;i++){ const t=i/8, a=t*Math.PI*0.95, ny=LY+Math.sin(a)*0.26, nz=V1.wz+0.13+(1-Math.cos(a))*0.25+t*0.02;
      const dy=ny-py, dz=nz-pz, L=Math.hypot(dy,dz); Cy(0.016,L+0.01,ANTH,LX,(py+ny)/2,(pz+nz)/2,Math.atan2(dz,dy),0,0,6); py=ny; pz=nz; } }
    const kopf=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.2,0.18,20,1,true),MAT.eigen('gummischwarz','stahl',{side:THREE.DoubleSide}));
    kopf.position.set(LX,LY-0.1,V1.wz+0.63); g.add(kopf);
    VD.schwan=new THREE.MeshStandardMaterial({color:LIN(0xfff4dc),emissive:LIN(0xfff0d0),emissiveIntensity:0.6});
    if(typeof lampMats!=='undefined') lampMats.push(VD.schwan);
    const glas=new THREE.Mesh(new THREE.CircleGeometry(0.19,20),VD.schwan); glas.rotation.x=Math.PI/2; glas.position.set(LX,LY-0.185,V1.wz+0.63); g.add(glas); }
  /* Schild "DDL Abholung" ueber dem Tor, innen und aussen (vorher "V1 · VERSAND") */
  { const sm=new THREE.MeshStandardMaterial({map:ddlSchildTex(),roughness:0.55}), SY=V1.h+1.25;
    /* die Wand ist 0,2 m dick (Innenseite z = wz + 0,1) */
    B(1.96,0.84,0.04,MAT.farbe('aluminium'),V1.x,SY,V1.wz+0.12); B(1.96,0.84,0.04,MAT.farbe('aluminium'),V1.x,SY,V1.wz-0.12);
    VD.sign=plane(1.9,0.78,sm,V1.x,SY,V1.wz+0.145,0,g); plane(1.9,0.78,sm,V1.x,SY,V1.wz-0.145,Math.PI,g); }
  /* Wandtelefon (Tom 09.10.: "DDL nur auf Anruf - Telefon an der Wand"): links neben der
     Ladezone, vom Gang hinter den Packtischen aus erreichbar */
  { const PX=V1.x-V1.w/2-1.25, PY=1.38, PZ=V1.wz+0.1;
    B(0.26,0.36,0.1,MAT.farbe('signalgelb'),PX,PY,PZ+0.05); B(0.2,0.12,0.02,MAT.farbe('anthrazit'),PX,PY+0.07,PZ+0.105);
    for(let r=0;r<4;r++) for(let c=0;c<3;c++) B(0.034,0.024,0.012,MAT.farbe('lichtgrau'),PX-0.045+c*0.045,PY-0.04-r*0.032,PZ+0.105);
    B(0.06,0.3,0.06,MAT.farbe('gummischwarz'),PX+0.17,PY+0.01,PZ+0.08); B(0.08,0.06,0.07,MAT.farbe('gummischwarz'),PX+0.17,PY+0.15,PZ+0.08); B(0.08,0.06,0.07,MAT.farbe('gummischwarz'),PX+0.17,PY-0.13,PZ+0.08);
    /* Spiralkabel vom Hoerer zum Geraet (Ebene z = PZ+0,09) */
    { const pts=[[PX+0.17,PY-0.16],[PX+0.2,PY-0.3],[PX+0.13,PY-0.4],[PX+0.06,PY-0.3],[PX+0.05,PY-0.17]];
      for(let i=1;i<pts.length;i++){ const [ax,ay]=pts[i-1], [bx,by]=pts[i], dx=bx-ax, dy=by-ay; Cy(0.008,Math.hypot(dx,dy)+0.01,MAT.farbe('gummischwarz'),(ax+bx)/2,(ay+by)/2,PZ+0.09,0,0,Math.atan2(-dx,dy),6); } }
    /* Schild darueber: was das Telefon kann, und der Stand der Box */
    VD.telTex=tex(512,256,()=>{});
    VD.telSchild=plane(0.62,0.31,new THREE.MeshBasicMaterial({map:VD.telTex,toneMapped:false}),PX,PY+0.46,PZ+0.02,0,g);
    VD.telHit=bbox(0.75,1.1,0.4,hitM,PX,PY+0.15,PZ+0.25,g,false); VD.telHit.userData={kind:'ddltel',ref:null};
    VD.telPos={x:PX,z:PZ}; }
  VC.fertig(g);
  ddlTelZeichnen();
  /* Versandhof: Betonplatte, Fahrspur, Zaun, Poller */
  const hof=V1_HOF, W=hof.x1-hof.x0, D=hof.z1-hof.z0;
  const fl=new THREE.Mesh(MAT.kachel(new THREE.PlaneGeometry(W,D),W/2.2,D/2.2),MAT.get('betonHof'));
  fl.rotation.x=-Math.PI/2; fl.position.set((hof.x0+hof.x1)/2,0.036,(hof.z0+hof.z1)/2); if(HIQ) fl.receiveShadow=true; g.add(fl);
  const mark=(w,d,x,z)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),MAT.basic(MAT.farbe('signalgelb'))); m.rotation.x=-Math.PI/2; m.position.set(x,0.04,z); g.add(m); };
  for(let z2=hof.z1-0.8;z2>hof.z0+1;z2-=1.1){ mark(0.12,0.6,V1.x-1.75,z2); mark(0.12,0.6,V1.x+1.75,z2); }
  const zm=new THREE.Mesh(new THREE.PlaneGeometry(4.6,1.3),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,map:tex(920,260,(c2,Wc,Hc)=>{ c2.clearRect(0,0,Wc,Hc);
    c2.fillStyle='rgba(18,20,26,.62)'; c2.fillRect(0,0,Wc,Hc); c2.strokeStyle=MAT.css('signalgelb'); c2.lineWidth=10; c2.strokeRect(5,5,Wc-10,Hc-10);
    c2.textAlign='center'; c2.textBaseline='middle'; c2.font=BUN(104); c2.fillStyle=MAT.css('signalgelb'); c2.fillText('VERSANDHOF',Wc/2,Hc/2+3); })}));
  /* Hofschrift am Ende des Hofs, vor dem Fuehrerhaus des wartenden LKW - nie im Bereich des LKW (der Laderaum steht 3 m breit bis z -39,5, das
     Fuehrerhaus bis -42,1); frueher bei z -32,5 mitten unter dem LKW und durch den Ladeboden zu sehen (Tom 15.10.) */
  zm.rotation.x=-Math.PI/2; zm.rotation.z=0; zm.position.set(V1.x,0.045,hof.z0+2.3); zm.renderOrder=2; g.add(zm);
  /* Zaun: Doppelstabmatte aus dem Baukasten (bk.zaun, aussen) - vorher eigene Pfosten alle 2 m mit
     halbdurchsichtiger Scheibe (14.10., Fundament Schritt Zaeune) */
  for(const [a,b] of [[[hof.x0,hof.z1],[hof.x0,hof.z0]],[[hof.x1,hof.z1],[hof.x1,hof.z0]],[[hof.x0,hof.z0],[hof.x1,hof.z0]]])
    bk.zaun({art:'doppelstab',von:a,bis:b,hoehe:2.0,parent:g});
  col(hof.x0-0.1,hof.x0+0.05,hof.z0,hof.z1); col(hof.x1-0.05,hof.x1+0.1,hof.z0,hof.z1); col(hof.x0,hof.x1,hof.z0-0.1,hof.z0+0.05);
  /* Flutlicht ueber dem Tor (aussen) */
  bbox(0.5,0.12,0.2,dark,V1.x,V1.h+1.95,V1.wz-0.25,g,false);
  VD.fluter=new THREE.MeshStandardMaterial({color:LIN(MAT.farbe('anthrazit')),emissive:LIN(0xfff2d6),emissiveIntensity:0}); if(typeof lampMats!=='undefined') lampMats.push(VD.fluter);
  const fl2=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.06,0.12),VD.fluter); fl2.position.set(V1.x,V1.h+1.87,V1.wz-0.3); g.add(fl2);
  vdSetzen(0);
}
/* Schild am Telefon: Anleitung und Stand der Box */
function ddlTelZeichnen(){
  if(!VD.telTex) return;
  const st=typeof ddlStand==='function'&&S?ddlStand():null;
  redraw(VD.telTex,(c,W,H)=>{ c.fillStyle='#1f3152'; c.fillRect(0,0,W,H); c.strokeStyle='rgba(255,255,255,.25)'; c.lineWidth=6; c.strokeRect(3,3,W-6,H-6);
    c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#f2f4f7'; c.font='700 64px "Barlow Condensed", sans-serif'; c.fillText('DDL RUFEN',W/2,62);
    c.font='600 34px "Barlow Condensed", sans-serif'; c.fillStyle='#bcd0ea';
    c.fillText(`Pauschale ${eur(DDL_PAUSCHALE)} je Abholung`,W/2,126);
    if(st){ c.fillStyle=st.voll?'#ff8a7a':st.unterwegs?'#ffd23f':'#8ef0a8';
      c.fillText(st.unterwegs?'DDL ist unterwegs':st.voll?`BOX VOLL · ${st.pakete} Pakete`:`Box ${st.pakete} Pakete · ${st.paletten} Palette${st.paletten===1?'':'n'}`,W/2,190); } });
}
/* ---------------------------------------------------------
   Der LKW von DDL: rueckwaerts an V1, Tor auf, Brueckenklappe, laden, zu, weg
   --------------------------------------------------------- */
function vtRahmen(){
  if(VT.rahmen) return VT.rahmen;
  const r=new THREE.Group(); r.position.set(V1.x,0,V1.rz); r.rotation.y=-Math.PI/2; scene.add(r); VT.rahmen=r; return r;
}
function vtStart(){
  const r=vtRahmen();
  VT.g=makeTruck('DDL',TRUCKCOL.ddl); VT.g.position.set(-9.5,0,0); r.add(VT.g);
  VT.state='anfahrt'; VT.t=0; VT.flap=0; DDL.t=0; DDL.lad=0;
  toast('DDL biegt in den Versandhof ein und setzt rückwärts an Tor V1.');
}
function vtLaderaumOeffnen(){
  if(VT.raum) return;
  const r=vtRahmen();
  VT.g.visible=false;
  VT.raum=makeLaderaum('DDL',TRUCKCOL.ddl,r);
  VT.bruecke=makeBruecke(r); VT.flap=0; vtFlap();
  /* Seitenwaende und Stirnwand des Laderaums, in Weltkoordinaten */
  const a=vf(-LR.len-0.05,0), L=(lz0,lz1,lx0,lx1)=>{ const p=vf(lx0,lz0), q=vf(lx1,lz1); return col(Math.min(p.x,q.x),Math.max(p.x,q.x),Math.min(p.z,q.z),Math.max(p.z,q.z)); };
  VT.cols=[L(-LR.w/2-0.2,-LR.w/2+0.02,-LR.len-0.3,0.2),L(LR.w/2-0.02,LR.w/2+0.2,-LR.len-0.3,0.2),L(-LR.w/2,LR.w/2,-LR.len-0.25,-LR.len-0.02)];
  void a;
  if(typeof navDirty==='function') navDirty();
  /* Hubwagen steht an der Wand, der Fahrer sitzt im Fuehrerhaus und steigt durch den Durchstieg ein, wenn das Tor offen ist (ldUpdate) */
  ldStowen();
}
function vtFlap(){ if(VT.bruecke) VT.bruecke.rotation.z=VT.flap*FLAP_MAX; }
function vtRaumWeg(){
  if(VT.raum){ if(VT.raum.parent) VT.raum.parent.remove(VT.raum); VT.raum=null; LR_LAMPE.forEach(l=>{ l.intensity=0; }); }
  if(VT.bruecke){ if(VT.bruecke.parent) VT.bruecke.parent.remove(VT.bruecke); VT.bruecke=null; }
  VT.cols.forEach(c=>dropCol(c)); VT.cols=[];
  if(VT.flapCol){ dropCol(VT.flapCol); VT.flapCol=null; }
  if(LD.ph!=='idle') ldAbbruch(); else { if(LD.jack) LD.jack.g.visible=false; if(LD.fig) LD.fig.visible=false; }
  if(typeof navDirty==='function') navDirty();
}
function vtEntfernen(){
  vtRaumWeg();
  if(VT.g){ if(VT.g.parent) VT.g.parent.remove(VT.g); VT.g=null; }
  VT.state=null; vdOffen(false);
}
/* Steht noch jemand im Laderaum (Spieler, Mitarbeiter)? */
function vtBesetzt(){
  const inn=(x,z)=>{ const f=vfRueck(x,z); return f.lx<0.4&&f.lx>-LR.len-0.4&&Math.abs(f.lz)<LR.w/2+0.3; };
  if(inn(pl.x,pl.z)) return true;
  if(LD.ph!=='idle'&&LD.ph!=='fertig') return true;
  for(const k in staff){ const w=staff[k]; if(w&&inn(w.pos.x,w.pos.z)) return true; }
  return false;
}
function vtUpdate(dt){
  if(!VT.state) return;
  const g=VT.g;
  if(VT.state==='anfahrt'){
    /* Rueckwaerts an V1, das Tor bleibt dabei zu */
    const d=0-g.position.x, sp=clamp(d*0.9,0.5,2.6);
    g.position.x+=sp*dt;
    if(d<=0.03){ g.position.x=0; VT.state='torauf'; vdOffen(true); vtLaderaumOeffnen(); toast('DDL steht an V1. Das Tor fährt hoch.'); }
  } else if(VT.state==='torauf'){
    if(vdIstOffen()){ VT.state='docked'; VT.t=0; DDL.t=0; toast('Der DDL-Fahrer lädt die Paletten mit dem Hubwagen – so lange ist die Box belegt, der Kran wartet.',COARSE?'':'xp'); }
  } else if(VT.state==='docked'){
    ddlTruckUpdate(dt);
  } else if(VT.state==='flap'){
    if(vtBesetzt()){ VT.flap=Math.max(0,VT.flap-dt/FLAP_T); vtFlap(); if(VT.flapCol&&VT.flap<0.6){ dropCol(VT.flapCol); VT.flapCol=null; } if(VT.flap<=0) VT.state='docked'; return; }
    VT.flap=Math.min(1,VT.flap+dt/FLAP_T); vtFlap();
    if(VT.flap>=0.6&&!VT.flapCol){ const p=vf(0.3,-1.6), q=vf(0.05,1.6); VT.flapCol=col(Math.min(p.x,q.x),Math.max(p.x,q.x),Math.min(p.z,q.z),Math.max(p.z,q.z)); }
    if(VT.flap>=1){ VT.state='torzu'; VT.t=0; vdOffen(false); }
  } else if(VT.state==='torzu'){
    if(VD.t<=0.05){ vtRaumWeg(); g.visible=true; VT.state='out'; VT.t=0; }
  } else if(VT.state==='out'){
    VT.t+=dt; g.position.x-=Math.min(7,VT.t*5)*dt;
    if(g.position.x<-LR.len-14){ vtEntfernen(); DDL.warte=false; }
  }
}

/* ---------------------------------------------------------
   Der DDL-Fahrer am Hubwagen (neu 15.10.2026, Tom: "Hubwagen-Ablauf ist unlogisch - Hubwagen hinter sich, Palette davor").
   Echter Ablauf, Frame V1 (lx vom Tor in den LKW, negativ = Laderaum), Hubwagen = bk.hubwagen:
   - Er kommt aus dem Fuehrerhaus: der Durchstieg in der Stirnwand geht auf, er geht durch die Gasse zum Hubwagen, der mit der
     Gabel zum Tor an der Wand steht (kein Auftauchen aus dem Nichts).
   - SCHIEBEN: Gabel voran in die Palette (Taschen der Europalette, die Gabeln fluchten), PUMPEN (drei Hube, Palette steigt 8 cm),
     ZIEHEN: rueckwaerts gehen, die Palette folgt; auf dem Wendeplatz am Tor dreht er Hubwagen samt Palette um 180 Grad,
     SCHIEBEN: die Palette voran in den Laderaum durch die Gasse, auf ihren Platz, SENKEN (Hebel, Palette setzt auf),
     ZIEHEN: der leere Hubwagen kommt rueckwaerts heraus, Wenden, die naechste Palette.
   - Ist alles verladen: der Hubwagen wird zurueck an die Wand geschoben, der Fahrer geht durch die Gasse in sein Fuehrerhaus.
   Fahrer steht 1,17 m hinter dem Gabelfuss (Hand am Griff), die Palettenmitte 0,575 m davor. Tempo: leer schieben 1,3 m/s, mit Last
   1,0 m/s, ziehen 1,2 / 0,9 m/s, zu Fuss 1,4 m/s. Kurven laufen auf Bahnen mit Rundung (Gabel folgt der Bahn, kein Ruckeln).
   --------------------------------------------------------- */
const HW_PAL=bk.HUBWAGEN.gabelL/2, HW_HAND=0.55;
const LD_STOW={lx:-2.4,lz:-1.15};        /* Hubwagen an der Seitenwand nahe dem Heck, Gabel zum Tor */
const LD_T={lx:0.6,lz:0.2};              /* Wendeplatz am Tor: Hubwagen samt Palette dreht sich frei (Zone -1,95..1,65 quer) */
const LD_V={leer:1.3,last:1.0,zugLeer:1.2,zugLast:0.9,fuss:1.4};
/* Boden unter dem Fahrer: Ladeboden und Bruecke 0,06, dahinter die Halle 0 (kurze Auffahrt) */
function ldBoden(lx){ return LADEBODEN_V1*(1-vsGlatt((lx-1.5)/0.35)); }
function ldWd(d){ while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return d; }
/* Linienzug w=[[lx,lz],..] mit Rundung r an den Ecken (Kreisbogen), dicht abgetastet */
function ldRund(w,r){
  const out=[[w[0][0],w[0][1]]];
  for(let i=1;i<w.length-1;i++){
    const a=w[i-1], b=w[i], c=w[i+1];
    let ux=a[0]-b[0], uz=a[1]-b[1], vx=c[0]-b[0], vz=c[1]-b[1];
    const lu=Math.hypot(ux,uz), lv=Math.hypot(vx,vz); if(lu<1e-6||lv<1e-6){ out.push([b[0],b[1]]); continue; }
    ux/=lu; uz/=lu; vx/=lv; vz/=lv;
    const th=Math.acos(clamp(ux*vx+uz*vz,-1,1));                 /* Innenwinkel an der Ecke */
    if(th>Math.PI-0.03||th<0.03){ out.push([b[0],b[1]]); continue; }
    const tn=Math.tan(th/2), t=Math.min(r/tn,lu*0.5,lv*0.5), rr=t*tn;
    const p1=[b[0]+ux*t,b[1]+uz*t], p2=[b[0]+vx*t,b[1]+vz*t];
    let bx=ux+vx, bz=uz+vz; const bl=Math.hypot(bx,bz); bx/=bl; bz/=bl;
    const cd=rr/Math.sin(th/2), mx=b[0]+bx*cd, mz=b[1]+bz*cd;
    const a1=Math.atan2(p1[1]-mz,p1[0]-mx), da=ldWd(Math.atan2(p2[1]-mz,p2[0]-mx)-a1), n=Math.max(2,Math.ceil(Math.abs(da)/0.12));
    for(let k=0;k<=n;k++){ const an=a1+da*k/n; out.push([mx+Math.cos(an)*rr,mz+Math.sin(an)*rr]); } }
  out.push([w[w.length-1][0],w[w.length-1][1]]);
  return out;
}
/* modus 'vor' = Gabel voran (Fahrer schiebt), 'rueck' = Fahrer zieht, geht rueckwaerts, 'fuss' = Fahrer allein; slowL/slowV = langsam am Ende */
function ldPfadSetzen(w,r,modus,v,o){
  o=o||{};
  /* Hubwagen: die Bahn beginnt in Richtung der Gabel (schieben) bzw. entgegen (ziehen) - die Gabel dreht sich erst in der Kurve */
  if(modus!=='fuss'){ const sg=modus==='vor'?1:-1; w=[w[0],[w[0][0]+Math.cos(LD.psi)*0.3*sg,w[0][1]+Math.sin(LD.psi)*0.3*sg]].concat(w.slice(1)); }
  const P=ldRund(w,r), C=[0]; for(let i=1;i<P.length;i++) C.push(C[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));
  LD.pf={P,C,len:C[C.length-1],s:0,modus,v,slowL:o.slowL||0,slowV:o.slowV||0.4,i:0,mitte:!!o.mitte};
  ldPfadPunkt(LD.pf,true);
}
function ldPfadPunkt(pf,snap){
  let i=pf.i; while(i<pf.P.length-2&&pf.C[i+1]<pf.s) i++; pf.i=i;
  const a=pf.P[i], b=pf.P[i+1], sg=pf.C[i+1]-pf.C[i], t=sg>1e-9?clamp((pf.s-pf.C[i])/sg,0,1):0, tx=sg>1e-9?(b[0]-a[0])/sg:1, tz=sg>1e-9?(b[1]-a[1])/sg:0;
  const x=a[0]+(b[0]-a[0])*t, z=a[1]+(b[1]-a[1])*t;
  if(pf.modus==='fuss'){ LD.fx=x; LD.fz=z; LD.fpsi+=ldWd(Math.atan2(tz,tx)-LD.fpsi)*(snap?0:0.2); }
  else { const h=pf.modus==='vor'?Math.atan2(tz,tx):Math.atan2(-tz,-tx); if(snap) LD.psi=h; else LD.psi+=ldWd(h-LD.psi)*0.25;
    /* mitte: die Bahn gilt der Palettenmitte (Palette voran), der Gabelfuss folgt ihr - so schwenkt die Palette nie ueber die Bahn hinaus */
    if(pf.mitte){ LD.jx=x-Math.cos(LD.psi)*HW_PAL; LD.jz=z-Math.sin(LD.psi)*HW_PAL; } else { LD.jx=x; LD.jz=z; } }
}
/* ein Schritt auf dem Weg; true = angekommen */
function ldPfadLauf(dt){
  const pf=LD.pf, rest=pf.len-pf.s; let v=pf.v;
  if(pf.slowL&&rest<pf.slowL) v=pf.slowV+(pf.v-pf.slowV)*clamp(rest/pf.slowL,0,1);
  v*=Math.min(1,0.2+pf.s/0.8,0.15+rest/0.6);                  /* sanft anfahren und abbremsen */
  pf.s=Math.min(pf.len,pf.s+v*dt);
  ldPfadPunkt(pf,false);
  LD.gang=pf.modus==='rueck'?-v:v;
  if(pf.s>=pf.len-1e-6){ LD.pf=null; LD.gang=0; return true; }
  return false;
}
/* Drehung des Hubwagens samt Fahrer auf der Stelle (sign +1/-1 = Drehsinn), 180 Grad */
function ldWende(sign,dauer){ LD.wd={von:LD.psi,bis:LD.psi+sign*Math.PI,dauer,t:0}; }
function ldWendeLauf(dt){
  const w=LD.wd; w.t+=dt; const k=vsGlatt(w.t/w.dauer); LD.psi=w.von+(w.bis-w.von)*k;
  LD.gang=(k>0.02&&k<0.98)?0.8:0;
  if(w.t>=w.dauer){ LD.wd=null; LD.gang=0; LD.psi=ldWd(w.bis); return true; }
  return false;
}
/* Standpunkt des Fahrers hinter dem Griff */
function ldStand(jx,jz,psi){ const e=bk.HUBWAGEN.griffZ+HW_HAND; return {lx:jx-Math.cos(psi)*e,lz:jz-Math.sin(psi)*e}; }
/* Anfahrpunkt des Hubwagens vor der vordersten Palette der Box (Gabelfuss) */
function ldBoxAnfahrt(){ const c=palZentrumWelt(0), f=vfRueck(c.x,c.z); return {lx:f.lx-HW_PAL,lz:f.lz}; }

function ldBauen(){
  if(LD.jack) return;
  LD.jack=bk.hubwagen({}); LD.jack.g.visible=false;
  LD.fig=makePerson({kopf:'CM07'}); LD.fig.visible=false; scene.add(LD.fig);
}
function ldPose(dt){
  const K=bk.HUBWAGEN, d=[Math.cos(LD.psi),Math.sin(LD.psi)];
  LD.phi+=(LD.phiZ-LD.phi)*Math.min(1,dt*14);
  LD.jack.winkel(LD.phi); LD.jack.hub(LD.hub);
  const gr=LD.jack.griff(LD.phi), fy=ldBoden(LD.jx), wj=vf(LD.jx,LD.jz);
  LD.jack.g.position.set(wj.x,fy,wj.z); LD.jack.g.rotation.y=Math.PI-LD.psi;
  if(LD.att){ const e=gr.z+HW_HAND; LD.fx=LD.jx-d[0]*e; LD.fz=LD.jz-d[1]*e; LD.fpsi=LD.psi; }
  const wf=vf(LD.fx,LD.fz); LD.fig.position.set(wf.x,ldBoden(LD.fx),wf.z); LD.fig.rotation.y=-LD.fpsi;
  if(LD.pal){ const o=vsPalObj[LD.pal.id];
    if(o){ const wp=vf(LD.jx+d[0]*HW_PAL,LD.jz+d[1]*HW_PAL); o.g.position.set(wp.x,fy+K.hub*LD.hub,wp.z); o.g.rotation.y=Math.PI/2-LD.psi; } }
  if(LD.fig.visible&&dt>0){
    animPerson(LD.fig,Math.abs(LD.gang)>0.05,dt,LD.gang||1);
    /* beide Haende am Griff: die Arme heben sich mit dem Griff (nach animPerson, dann folgt die Arm-IK) */
    LD.armW+=((LD.att?1:0)-LD.armW)*Math.min(1,dt*5);
    if(LD.armW>0.01){ const u=LD.fig.userData, rot=-1.0-(gr.y-1.19)/0.55;
      for(const i of [0,1]) u.arms[i].rotation.x=u.arms[i].rotation.x*(1-LD.armW)+rot*LD.armW; }
  }
}
/* Durchstieg in der Stirnwand: auf, solange der Fahrer in Naehe der Wand ist */
function ldTuer(dt){
  const t=VT.raum&&VT.raum.userData.tuer; if(!t) return;
  const ziel=(LD.ph==='tuer'||(LD.fig&&LD.fig.visible&&LD.fx<-LR.len+2.0))?1:0, d=ziel-LD.door;
  LD.door+=Math.sign(d)*Math.min(Math.abs(d),dt/0.9);
  t.rotation.y=-1.75*vsGlatt(LD.door);
}
/* Der Hubwagen steht im Laderaum an der Wand, der Fahrer ist noch im Fuehrerhaus (bevor die Tuer aufgeht) */
function ldStowen(){
  ldBauen();
  LD.ph='idle'; LD.t=0; LD.pal=null; LD.att=false; LD.armW=0; LD.hub=0; LD.phi=0; LD.phiZ=0; LD.door=0; LD.gang=0; LD.pf=null; LD.wd=null;
  LD.jx=LD_STOW.lx; LD.jz=LD_STOW.lz; LD.psi=0; LD.fx=-LR.len-0.55; LD.fz=DURCHSTIEG.lz; LD.fpsi=0;
  LD.jack.g.visible=true; LD.fig.visible=false; ldPose(0);
}
function ldNaechste(){
  const p=vsPalZelle()[0];
  return p&&vsPalZahl(p)>0?p:null;
}
function ldFreierPlatz(){ for(let i=0;i<DDL_SLOTS;i++) if(!S.paletten.some(q=>q.ort==='l'&&q.idx===i)) return i; return -1; }
function ldArbeit(){ return !!ldNaechste()&&ldFreierPlatz()>=0; }
function ldBereit(){ return !vsPalGleitet()&&!roboterBusy(); }
/* Weg zur vordersten Palette: aus dem Laderaum (mit Last-frei) oder vom Wendeplatz, Gabel voran, am Ende langsam (Gabel faedelt ein) */
function ldZumBox(){
  const B=ldBoxAnfahrt(), j=[LD.jx,LD.jz];
  const w=LD.jx<-0.5?[j,[-1.0,j[1]],[0.9,B.lz],[B.lx,B.lz]]:[j,[1.25,B.lz],[B.lx,B.lz]];
  ldPfadSetzen(w,1.4,'vor',LD_V.leer,{slowL:1.3,slowV:0.45}); LD.ph='hin'; LD.t=0;
}
function ldUpdate(dt){
  if(!LD.jack) ldBauen();
  ldTuer(dt);
  const aktiv=VT.state==='docked'&&vdIstOffen();
  if(!aktiv){ if(LD.ph!=='idle') ldAbbruch(); return; }
  LD.t+=dt;
  const L=LR.len;
  switch(LD.ph){
    case 'idle': {
      /* wartet kurz; faehrt nicht, solange der Kran noch ein Paket absetzt */
      if(DDL.t<DDL_RUF||!ldBereit()||!ldArbeit()) break;
      LD.fig.visible=true; LD.fx=-L-0.55; LD.fz=DURCHSTIEG.lz; LD.fpsi=0; LD.ph='tuer'; LD.t=0; break; }
    case 'tuer': {
      if(LD.t<0.85) break;
      const G=ldStand(LD.jx,LD.jz,0);
      ldPfadSetzen([[-L-0.55,DURCHSTIEG.lz],[-L+1.0,DURCHSTIEG.lz],[-5.4,0],[-4.4,G.lz],[G.lx,G.lz]],0.7,'fuss',LD_V.fuss); LD.ph='aus'; LD.t=0; break; }
    case 'aus': { if(ldPfadLauf(dt)){ LD.att=true; LD.ph='greif'; LD.t=0; } break; }
    case 'greif': { if(LD.t>=0.8&&ldBereit()) ldZumBox(); break; }
    case 'hin': {
      if(!LD.pf||ldPfadLauf(dt)){ LD.pf=null; LD.ph='pick'; LD.t=0; } break; }
    case 'pick': {
      /* Gabel steckt in der Palette: warten, bis der Kran fertig ist, dann die Palette an den Hubwagen nehmen */
      if(LD.t<0.5||!ldBereit()) break;
      const p=ldNaechste(), slot=ldFreierPlatz();
      if(!p||slot<0){ ldPfadSetzen([[LD.jx,LD.jz],[1.2,LD.jz],[LD_T.lx,LD_T.lz]],1.5,'rueck',LD_V.zugLeer); LD.ph='leer'; LD.t=0; break; }
      palAufnehmen(p); LD.pal=p; LD.slot=slot; LD.ziel=ddlSlot(slot); LD.hub=0; LD.ph='heben'; LD.t=0; break; }
    case 'heben': {
      /* drei Pumpenhube: Griff runter = Gabel hoch, Griff hoch = zurueck; Hub 0..1 = 8 cm */
      const T=0.66, x=LD.t/T, k=Math.floor(x), f=x-k, n=3;
      LD.phiZ=-0.12*Math.cos(2*Math.PI*f);
      LD.hub=Math.min(1,(k+vsGlatt(Math.min(1,f*2)))/n);
      if(LD.t>=T*n){ LD.hub=1; LD.phiZ=0; const B=ldBoxAnfahrt();
        ldPfadSetzen([[B.lx,B.lz],[1.2,B.lz],[LD_T.lx,LD_T.lz]],1.5,'rueck',LD_V.zugLast); LD.ph='zieh'; LD.t=0; }
      break; }
    case 'zieh': {
      if(ldPfadLauf(dt)){ ldWende(1,3.0); LD.ph='wende2'; LD.t=0; } break; }
    case 'wende2': {
      if(ldWendeLauf(dt)){
        /* Palette voran in den Laderaum: durch die Gasse, kurz vor dem Platz seitlich auf die Spalte, die letzten Meter gerade */
        const e=LD.ziel.lx, z=LD.ziel.lz, C0=[LD.jx+Math.cos(LD.psi)*HW_PAL,LD.jz+Math.sin(LD.psi)*HW_PAL];
        /* Bahn der Palettenmitte: Gasse, lange sanfte Kurve auf die Spalte, die letzten 1,3 m gerade (Radius >= 3 m: die Palettenecke bleibt 5 cm
           vor der Seitenwand) */
        ldPfadSetzen([C0,[e+4.5,0],[e+1.3,z],[e,z]],3.0,'vor',LD_V.last,{slowL:1.2,slowV:0.4,mitte:true}); LD.ph='rein'; LD.t=0; }
      break; }
    case 'rein': {
      if(ldPfadLauf(dt)){ LD.ph='senken'; LD.t=0; } break; }
    case 'senken': {
      /* Senkhebel: Palette setzt auf den Ladeboden auf */
      const T=1.1; LD.phiZ=-0.1; LD.hub=Math.max(0,1-LD.t/T);
      if(LD.t<T) break;
      const p=LD.pal; LD.pal=null; LD.hub=0; LD.phiZ=0; p.ort='l'; p.idx=LD.slot; vsPalStellen(p,vsPalObj[p.id],true);
      statAdd('paletten',1); sfx.thump(0.3); syncPakete();
      const z=LD.ziel.lz;
      ldPfadSetzen([[LD.jx,LD.jz],[LD.jx+1.5,z],[LD.jx+4.0,0],[LD_T.lx,LD_T.lz]],3.0,'rueck',LD_V.zugLeer); LD.ph='leer'; LD.t=0; break; }
    case 'leer': {
      if(ldPfadLauf(dt)){ LD.ph='s0'; LD.t=0; } break; }
    case 's0': {
      /* am Wendeplatz: noch eine Palette? sonst Hubwagen zurueckstellen */
      if(ldArbeit()){ if(!ldBereit()) break; ldWende(-1,2.4); LD.ph='wende1'; LD.t=0; break; }
      const P=[-3.0,LD_STOW.lz];
      ldPfadSetzen([[LD_T.lx,LD_T.lz],[-0.5,LD_T.lz],[-1.7,P[1]],P],1.2,'vor',LD_V.leer); LD.ph='park'; LD.t=0; break; }
    case 'wende1': { if(ldWendeLauf(dt)) ldZumBox(); break; }
    case 'park': {
      if(ldPfadLauf(dt)){ LD.ph='frei'; LD.t=0; } break; }
    case 'frei': {
      if(LD.t<0.5) break;
      LD.att=false; LD.phiZ=0;
      const f=[LD.fx,LD.fz];
      ldPfadSetzen([f,[f[0],0],[-L+1.0,0],[-L-0.7,DURCHSTIEG.lz]],0.6,'fuss',LD_V.fuss); LD.ph='heim'; LD.t=0; break; }
    case 'heim': {
      if(ldPfadLauf(dt)||LD.fx<-L-0.35){ LD.pf=null; LD.gang=0; LD.fig.visible=false; LD.ph='idle'; LD.t=0; } break; }
  }
  ldPose(dt);
}
/* Truck weg oder Tor zu: die Palette kommt zurueck an den Anfang der Schlange */
function ldAbbruch(){
  if(LD.pal){ const p=LD.pal; LD.pal=null; p.ort='z'; vsPalZelle().forEach(q=>{ if(q!==p) q.idx++; }); p.idx=0; const o=vsPalObj[p.id]; if(o){ vsPalStellen(p,o,true); o.cx=null; } vsPalAbgleich(); syncPakete(); }
  LD.ph='idle'; LD.t=0; LD.att=false; LD.pf=null; LD.wd=null; LD.hub=0; LD.phiZ=0; LD.gang=0;
  if(LD.jack) LD.jack.g.visible=false; if(LD.fig) LD.fig.visible=false;
}

/* ---------------------------------------------------------
   DDL auf Anruf (Tom 09.10.): Wandtelefon in der Versandecke.
   Jede Abholung kostet DDL_PAUSCHALE, gebucht beim Anruf (DS.ddl).
   --------------------------------------------------------- */
function ddlLaeuft(){ return !!VT.state||DDL.warte; }
function ddlHatLadung(){ return vsGelandet()>0||S.paletten.some(p=>p.ort!=='z'); }
/* Box ist belegt, solange der LKW am Tor steht - der Kran setzt nichts ab */
function boxBelegt(){ return VT.state==='torauf'||VT.state==='docked'||LD.ph!=='idle'; }
/* Stand fuer Telefon, Handy, Laptop und Packschild */
function ddlStand(){
  const z=S&&Array.isArray(S.paletten)?vsPalZelle():[];
  return {paletten:palPlaetze(),pakete:vsGelandet(),voll:!!DDL.voll,unterwegs:ddlLaeuft(),eta:DDL.warte?Math.max(0,DDL.eta):0,
    belegt:z.filter(p=>vsPalZahl(p)>0).length,pauschale:DDL_PAUSCHALE,band:vsBahn.length};
}
function ddlTelPrompt(){
  if(VT.state) return {t:'DDL ist am Tor – der Fahrer lädt gerade',a:false};
  if(DDL.warte) return {t:'DDL ist schon unterwegs',a:false};
  if(!packBereit()) return {t:'Telefon DDL – die Packstation ist noch nicht in Betrieb',a:false};
  const n=vsGelandet();
  if(!n) return {t:'Telefon DDL: noch keine Pakete auf den Paletten',a:false};
  return {t:`DDL rufen · ${n} Paket${n===1?'':'e'} abholen · Pauschale ${eur(DDL_PAUSCHALE)}${DDL.voll?' · Box ist voll!':''}`,a:true};
}
function ddlRufen(){
  const p=ddlTelPrompt(); if(!p.a){ toast(p.t,'bad'); return false; }
  S.money=r2(S.money-DDL_PAUSCHALE); DS.ddl=r2((DS.ddl||0)+DDL_PAUSCHALE); DS.ddlN=(DS.ddlN|0)+1;
  statAdd('ddlRuf',1); S.ddlUnterwegs=true;
  DDL.warte=true; DDL.ruf=true; DDL.eta=DDL_ANFAHRT; if(sfx.pop) sfx.pop();
  toast(`DDL ist bestellt (${eur(DDL_PAUSCHALE)}). Der LKW kommt in etwa einer Stunde an Tor V1.`,'money');
  ddlTelZeichnen(); drawPackSchild(); return true;
}
/* Alle Paletten voll: das Paket wartet am Bandende. Einmal melden, bis wieder Platz ist. */
function vsBoxVoll(){
  if(DDL.voll) return;
  DDL.voll=true; S.boxVoll=true; statAdd('boxVoll',1);
  toast(ddlLaeuft()?'Die Paletten sind voll – DDL ist schon unterwegs, das Band staut sich bis dahin.':'Die Paletten in der Versandbox sind voll! Ruf DDL per Handy (Onlineshop) oder am Wandtelefon neben Rolltor V1 – bis dahin staut sich das Band.','bad');
  ddlTelZeichnen(); drawPackSchild();
}
function ddlTruckUpdate(dt){
  DDL.t+=dt;
  ldUpdate(dt);
  /* fertig: nichts mehr zu holen, keiner im Laderaum */
  const mehr=(ldNaechste()&&ldFreierPlatz()>=0)||LD.pal||LD.ph!=='idle'||roboterBusy();
  if(!mehr&&!vtBesetzt()){ DDL.lad+=dt; if(DDL.lad>2.2&&DDL.t>5) ddlAbfahrt(); } else DDL.lad=0;
}
/* Alles weg: Pakete der Paletten im LKW, bei Zwang auch der Rest */
function ddlAbholen(alle){
  vsPalInit();
  let n=0;
  const weg=S.paletten.filter(p=>p.ort==='l'||(alle&&p.ort!=='l'));
  const ids=new Set(weg.map(p=>p.id));
  const gr=[], pp=[], gel=vsGelandet();
  for(let i=0;i<S.paketGr.length;i++){
    if(i<gel&&ids.has(S.paketP[i])){ n++; continue; }
    gr.push(S.paketGr[i]); pp.push(S.paketP[i]); }
  S.paketGr=gr; S.paketP=pp; S.pakete=gr.length;
  weg.forEach(p=>vsPalVerwerfen(p));
  S.paletten=S.paletten.filter(p=>!ids.has(p.id));
  if(LD.pal&&ids.has(LD.pal.id)){ LD.pal=null; LD.ph='idle'; }
  if(n){ statAdd('ddl',n); DS.ddlPakete=(DS.ddlPakete|0)+n; }
  return n;
}
function ddlAbfahrt(){
  const n=ddlAbholen(false);
  DDL.t=0; DDL.lad=0; DDL.ruf=false; DDL.voll=false; S.boxVoll=false; S.ddlUnterwegs=false; DS.ddlAbgeholt=true;
  vsPalAbgleich(); syncPakete(); drawPackSchild(); ddlTelZeichnen();
  if(n) toast(`DDL hat ${n} Paket${n===1?'':'e'} abgeholt.`,'money');
  VT.state='flap'; VT.t=0;
}
/* Fuer Tests und Notfaelle: alles sofort weg, ohne LKW-Fahrt und ohne Kosten.
   Das Spiel selbst ruft das nicht mehr auf (keine Abholung zum Tagesende seit 09.10.). */
function ddlAbholung(){
  vsBahn.forEach(e=>{ if(e.m.parent) e.m.parent.remove(e.m); }); vsBahn.length=0;
  vsPortalRuhe();
  vsPalInit();
  if(LD.ph!=='idle') ldAbbruch();
  let n=ddlAbholen(true);
  const rest=S.paketGr.length; if(rest){ statAdd('ddl',rest); n+=rest; }
  S.paketGr=[]; S.paketP=[]; S.pakete=0;
  DDL.warte=false; DDL.t=0; DDL.lad=0; DDL.ruf=false; DDL.voll=false; S.boxVoll=false; S.ddlUnterwegs=false;
  if(VT.state) vtEntfernen();
  if(packTisch){ vsPalAbgleich(); syncPakete(); drawPackSchild(); ddlTelZeichnen(); }
  return n;
}
/* Takt: gleitende Paletten, DDL, Tor */
let _ddlTelT=0;
function updatePaletten(dt){
  if(!S||!packTisch) return;
  if(!VD.g) buildVersandhof();
  if(!HUB.park&&zoneOffen('packstation')) hubAufbauPark();
  if(HUB.park) HUB.park.visible=hubDa();
  vsPalZeichnen(dt);
  vdUpdate(dt);
  if(DDL.warte&&!VT.state){ DDL.eta-=dt; if(DDL.eta<=0){ DDL.warte=false; vtStart(); } }
  /* Platz frei geworden (z. B. nach der Abholung): Meldung zuruecksetzen */
  _ddlTelT-=dt; if(_ddlTelT<=0){ _ddlTelT=1;
    if(DDL.voll&&!boxBelegt()){ const v=vsBahn.filter(e=>e.phase==='rollen').sort((a,b)=>a.x-b.x)[0];
      if(vsPalZiel(v?v.gr:1)){ DDL.voll=false; S.boxVoll=false; drawPackSchild(); } }
    ddlTelZeichnen(); }
  vtUpdate(dt);
}
/* Nach dem Laden: Paletten und Kartons zusammenfuehren */
function vsPalLaden(){
  vsPalInit();
  /* LKW und Hubwagen gibt es nach dem Laden nicht mehr: die Paletten stehen wieder in der Box */
  for(const p of S.paletten){ if(p.ort!=='z') p.ort='z'; }
  vsPalZelle();
  const z=S.paletten.slice().sort((a,b)=>a.idx-b.idx); z.forEach((p,i)=>{ p.idx=i; });
  Object.keys(vsPalObj).forEach(id=>{ const o=vsPalObj[id]; if(o.g.parent) o.g.parent.remove(o.g); if(o.pk) o.pk.geometry.dispose(); delete vsPalObj[id]; });
  S.paletten.forEach(p=>{ if(p.col){ dropCol(p.col); p.col=null; } });
  LD.pal=null; LD.ph='idle'; if(VT.state) vtEntfernen();
  /* bezahlt und gerufen, aber noch nicht da: er kommt trotzdem */
  DDL.warte=!!S.ddlUnterwegs; DDL.eta=DDL.warte?DDL_ANFAHRT*0.5:0; DDL.voll=!!S.boxVoll;
}
