/* =========================================================
   Paletten, Hubwagen und die Abholung durch DDL (Tom, 07.10.:
   "Die Versandecke zieht ans hintere Ende von Lager Sued, dort ein
   Rolltor V1 mit eigenem Versandhof. Um 22 Uhr kommt der
   Paketdienst-LKW rueckwaerts an V1, das Rolltor faehrt hoch, ein
   Mitarbeiter faehrt die Paletten mit dem Hubwagen in den LKW, Tor
   zu, LKW weg. Ab 18 Uhr darf der Spieler das auch selbst.")

   Die Versandecke (Packtische, Band, Roboter-Kran, gelbe Box) steht an
   der Rueckwand von Lager Sued 3; die Oeffnung der Box zeigt zum
   Rolltor V1. Jede Palette ist ein eigenes Ding (S.paletten): sie
   steht in der Box ('z', idx = Platz in der Schlange, 0 am Tor), haengt
   am Hubwagen ('h') oder steht im LKW ('l'). Ihr Inhalt sind die
   Pakete in S.paketGr, deren Eintrag in S.paketP auf die Palette zeigt.
   Nimmt man die vorderste Palette heraus, ruecken die anderen nach und
   hinten steht eine neue, leere.
   Frame V1: lx laeuft vom Tor in den LKW (negativ = im Laderaum, positiv
   = in der Halle), lz seitlich; Welt = (V1.x - lz, V1.rz + lx).
   ========================================================= */
const PAL_LG=1.2, PAL_BR=0.8, PAL_Y=0.09;          /* Europalette; PAL_Y: Hub am Hubwagen */
const HUB_AB=1080;                                  /* 18:00 */
const DDL_AUTO=4, DDL_RUF=25;                       /* Sekunden bis der Fahrer selbst laedt: 22 Uhr / vom Spieler gerufen */
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
const DDL={tag:-1,autoTag:-1,ruf:false,warte:false,t:0,lad:0};
const VT={g:null,rahmen:null,raum:null,bruecke:null,state:null,t:0,flap:0,cols:[],fahrer:null,flapCol:null};
const LD={ph:'idle',t:0,pal:null,fig:null,jack:null,lx:-0.4,lz:0,ziel:null,agv:false};
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
  /* zu viele (Stufenwechsel nach unten gibt es nicht) - ueberzaehlige leere weg */
  for(let i=z.length-1;i>=N&&i>=0;i--){ if(vsPalZahl(z[i])===0){ const p=z.pop(); S.paletten.splice(S.paletten.indexOf(p),1); } }
}
/* Nimmt die Palette neue Pakete an? */
function vsPalAufnehmend(p){ return p.ort==='z'; }

/* ---------------------------------------------------------
   Stapeln: Lage fuer Lage, jede Lage nur eine Groesse. Gerechnet in
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
  const traegt=(lag,r)=>{
    if(!lag) return true;
    for(const u of [-0.85,0,0.85]) for(const v of [-0.85,0,0.85]){
      const px=(r.x0+r.x1)/2+u*(r.x1-r.x0)/2, pz=(r.z0+r.z1)/2+v*(r.z1-r.z0)/2;
      if(!lag.boxen.some(q=>px>=q.x0&&px<=q.x1&&pz>=q.z0&&pz<=q.z1)) return false; }
    return true; };
  const frei=(lag,unten,gr)=>{ const M=VS_MUSTER[gr];
    for(let k=0;k<M.n;k++){ if(lag&&lag.belegt[k]) continue; const o=mpos(gr,k), r=rect(gr,o.x,o.z);
      if(traegt(unten,r)) return {k,r,o}; }
    return null; };
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
    let pal=null, lag=null, wahl=null;
    for(const kand of versuche){
      /* 1. angefangene Lage gleicher Groesse */
      for(const q of kand){ const L=st[q.id], top=L[L.length-1];
        if(top&&top.gr===G.id){ const w=frei(top,L[L.length-2],G.id); if(w){ pal=q; lag=top; wahl=w; break; } } }
      /* 2. neue Lage obendrauf */
      if(!pal) for(const q of kand){ const L=st[q.id], top=L[L.length-1], H=top?top.y0+top.h:0;
        if(H+G.h>VS_HMAX+1e-6) continue;
        const w=frei(null,top,G.id); if(w){ pal=q; wahl=w; lag={gr:G.id,y0:H,h:G.h,belegt:{},boxen:[]}; L.push(lag); break; } }
      if(pal) break;
    }
    if(!pal){ lage.push(null); continue; }
    lag.belegt[wahl.k]=true; lag.boxen.push(wahl.r);
    const j=Math.sin((it.i+1)*12.9898)*43758.5453, jr=j-Math.floor(j)-0.5;
    const e={x:wahl.o.x+jr*0.004,y:PAL_H+lag.y0+G.h/2,z:wahl.o.z-jr*0.006,ry:jr*0.016,gr:G.id,p:pal.id,i:it.i,neu:!!it.neu};
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
let _holzGeo=null;
function vsHolzGeo(){
  if(_holzGeo) return _holzGeo;
  const HOLZ=0xc49a62, HOLZ2=0xa9814e, HELL=0xcfa66d, vc=[];
  const B=(w,h,d,c,x,y,z)=>vc.push({geo:roundedBoxGeo(w,h,d,Math.min(0.01,Math.min(w,h,d)*0.2),2),m:tm(x,y,z),color:c});
  for(const dx of [-0.55,0,0.55]) for(const dz of [-0.34,0,0.34]) B(0.12,0.078,0.12,HOLZ2,dx,0.061,dz);
  for(const dz of [-0.34,0,0.34]) B(1.2,0.022,0.12,HOLZ,0,0.011,dz);
  for(const dx of [-0.55,0,0.55]) B(0.14,0.022,0.8,HOLZ,dx,0.111,0);
  for(const dz of [-0.34,-0.17,0,0.17,0.34]){ const k=dz===0||Math.abs(dz)>0.3; B(1.2,0.022,k?0.14:0.1,k?HOLZ:HELL,0,PAL_H-0.011,dz); }
  _holzGeo=merge(vc);
  return _holzGeo;
}
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
  const g=new THREE.Group(), holz=new THREE.Mesh(vsHolzGeo(),vcMat);
  if(HIQ){ holz.castShadow=true; holz.receiveShadow=true; }
  g.add(holz); g.userData.pal=p.id;
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
    const s=ddlSlot(p.idx), w=vf(s.lx,s.lz); g.position.set(w.x,0.03,w.z); g.rotation.y=Math.PI/2; o.cx=null;
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
/* Trefferflaechen: ein Kasten ueber jeder Palette in der Box */
function vsPalHitsBauen(){
  if(!packTisch||palHits.length) return;
  for(let i=0;i<PAL_N[3];i++){ const c=palZentrum(i), h=bbox(PAL_LG+0.1,1.9,PAL_BR+0.1,hitM,c.x,0.95,c.z,packTisch,false);
    h.userData={kind:'palette',ref:{idx:i}}; h.visible=false; palHits.push(h); }
}
function vsPalHits(){
  vsPalHitsBauen();
  const L=[];
  for(const h of palHits){ const p=S.paletten.find(q=>q.ort==='z'&&q.idx===h.userData.ref.idx); if(p&&vsPalZahl(p)>0) L.push(h); }
  if(VD.signHit) L.push(VD.signHit);
  return L;
}

/* ---------------------------------------------------------
   Hubwagen
   --------------------------------------------------------- */
function hubDa(){ return zoneOffen('packstation'); }
function hubZeit(){ return clock>=HUB_AB; }
function hubAn(){ return !!HUB.pal; }
function hubTempo(){ return HUB.pal?0.62:1; }
function hubModell(){
  const g=new THREE.Group(), rot=std(0xd23a2a,{metalness:0.3,roughness:0.5}), stahl=std(0x9ba2ad,{metalness:0.75,roughness:0.32});
  const gummi=std(0x18191d,{roughness:0.95}), griff=std(0x22252c,{roughness:0.7});
  /* Gabeln zeigen nach vorn (-z), unter die Palette */
  for(const sx of [-0.27,0.27]){ rbox(0.16,0.055,1.1,0.012,stahl,sx,0.05,-0.78,g); rbox(0.16,0.05,0.2,0.01,stahl,sx,0.045,-1.42,g);
    const r=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.07,12),gummi); r.rotation.z=Math.PI/2; r.position.set(sx,0.04,-1.3); g.add(r);
    const r2=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.05,14),gummi); r2.rotation.z=Math.PI/2; r2.position.set(sx*0.9,0.08,-0.28); g.add(r2); }
  rbox(0.7,0.14,0.2,0.02,rot,0,0.14,-0.24,g);
  /* Deichsel mit Handgriff, schraeg zum Bediener */
  const t=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.95,8),griff); t.position.set(0,0.52,-0.05); t.rotation.x=-0.62; g.add(t);
  rbox(0.34,0.05,0.07,0.015,griff,0,0.93,0.2,g);
  g.traverse(o=>{ if(o.isMesh&&HIQ) o.castShadow=true; });
  return g;
}
/* Zum Aufnehmen gebraucht: nichts anderes in der Hand */
function hubFrei(){
  if(!S) return 'Spiel nicht bereit.';
  if(S.carrying||S.kisteHand) return 'Du trägst schon etwas. Erst abstellen.';
  if(typeof karreAn==='function'&&karreAn()) return 'Erst die Karre wegstellen (K).';
  if(grabbed) return 'Du hast ein Möbel in der Hand.';
  return null;
}
function roboterBusy(){ return vsPortal.phase!=='ruhe'||vsBahn.some(e=>e.phase==='greifer')||vsBahn.some(e=>e.phase==='rollen'&&e.laeuft); }
function hubAufnehmenPruefen(p){
  if(!hubDa()) return 'Der Hubwagen gehört zur Packstation.';
  if(!hubZeit()) return 'Palettenabholung: DDL holt ab 18 Uhr – vorher bleibt alles in der Box.';
  if(!vdIstOffen()) return 'Das Rolltor V1 ist zu – es fährt hoch, sobald der DDL-LKW steht.';
  if(LD.pal) return 'Der Mitarbeiter fährt gerade eine Palette.';
  const f=hubFrei(); if(f) return f;
  if(p.ort!=='z') return 'Diese Palette ist schon weg.';
  if(p.idx!==0) return 'Erst die vordere Palette – sie steht am Tor.';
  if(vsPalZahl(p)===0) return 'Die Palette ist noch leer.';
  if(roboterBusy()||vsPalGleitet()) return 'Der Roboter arbeitet gerade an den Paletten – kurz warten.';
  return null;
}
function hubAufnehmen(p){
  const why=hubAufnehmenPruefen(p); if(why){ toast(why,'bad'); return false; }
  palAufnehmen(p,{x:null});
  HUB.pal=p; p.lader=false;
  if(!HUB.g){ HUB.g=hubModell(); scene.add(HUB.g); }
  HUB.g.visible=true; if(HUB.park) HUB.park.visible=false;
  sfx.pop(); toast(`Hubwagen: Palette mit ${vsPalZahl(p)} Paketen. Rückwärts durch das Tor in den LKW fahren, dann Aktion zum Abstellen.`);
  return true;
}
/* Palette aus der Schlange nehmen: sie gleitet an den Hubwagen */
function palAufnehmen(p){
  const o=vsPalObjekt(p);
  o.g.updateMatrixWorld(true); const w=new THREE.Vector3(); o.g.getWorldPosition(w);
  const ry=o.g.rotation.y+(o.g.parent===packTisch?packTisch.rotation.y:0);
  p.wx=w.x; p.wz=w.z; p.wry=ry; p.von={x:w.x,z:w.z,ry}; p.vt=0;
  p.ort='h'; p.idx=0;
  vsPalStellen(p,o,true); o.g.position.set(w.x,PAL_Y,w.z); o.g.rotation.y=ry;
  vsPalAbgleich(); syncPakete();
}
/* Wo steht die getragene Palette (Welt)? Die lange Seite zeigt in Fahrtrichtung. */
function hubZiel(){
  const fx=-Math.sin(yaw), fz=-Math.cos(yaw);
  return {x:pl.x+fx*1.3,z:pl.z+fz*1.3,ry:yaw+Math.PI/2};
}
function palFolgen(p,z,dt){
  const o=vsPalObj[p.id]; if(!o) return;
  p.vt=Math.min(1,(p.vt||0)+dt/0.55);
  const k=p.von&&p.vt<1?vsGlatt(p.vt):1, a=p.von||z;
  const x=a.x+(z.x-a.x)*k, zz=a.z+(z.z-a.z)*k;
  o.g.position.set(x,PAL_Y,zz); o.g.rotation.y=vsWinkel(a.ry,z.ry,k);
  p.wx=x; p.wz=zz;
}
function hubUpdate(dt){
  if(HUB.park){ HUB.park.visible=!HUB.pal&&hubDa(); }
  const p=HUB.pal; if(!p){ if(HUB.g) HUB.g.visible=false; return; }
  if(!vsPalObj[p.id]){ HUB.pal=null; return; }
  palFolgen(p,hubZiel(),dt);
  HUB.g.position.set(pl.x,0,pl.z); HUB.g.rotation.y=yaw; HUB.g.visible=true;
}
/* Die getragene Palette darf nicht durch Zaun, Waende und stehende Paletten */
function hubKollision(){
  if(!HUB.pal) return;
  if((HUB.pal.vt||0)<1) return;
  for(let n=0;n<2;n++){
    const fx=-Math.sin(yaw), fz=-Math.cos(yaw);
    for(const d of [0.8,1.3,1.8]){
      const q={x:pl.x+fx*d,z:pl.z+fz*d}, ox=q.x, oz=q.z;
      collide(q,0.4);
      pl.x+=q.x-ox; pl.z+=q.z-oz;
    }
  }
  collide(pl,0.32);
}
/* Wohin mit der Palette? Im Laderaum der naechste freie Platz, sonst zurueck in die Box. */
function hubAbstellPlatz(){
  const z=hubZiel(), f=vfRueck(z.x,z.z);
  if(VT.state==='docked'){
    let best=-1, bd=1e9;
    for(let i=0;i<DDL_SLOTS;i++){ if(S.paletten.some(q=>q.ort==='l'&&q.idx===i)) continue;
      const s=ddlSlot(i), d=Math.hypot(s.lx-f.lx,s.lz-f.lz); if(d<bd){ bd=d; best=i; } }
    if(best>=0&&bd<1.25) return {ort:'l',idx:best,text:`Palette in den LKW stellen (Platz ${best+1})`};
    if(f.lx<-0.3&&f.lx>-9.4&&Math.abs(f.lz)<1.6) return {ort:null,text:'Hier kann die Palette im LKW nicht stehen – tiefer hinein, rückwärts fahren'};
  }
  /* zurueck an den Anfang der Schlange, wenn man noch vor der Box steht */
  const c=palZentrumWelt(0);
  if(Math.hypot(z.x-c.x,z.z-c.z)<2.2) return {ort:'z',idx:0,text:'Palette zurück in die Box stellen'};
  return {ort:null,text:VT.state==='docked'?'In den LKW fahren und dort abstellen':'Der LKW ist nicht da – Palette zurück zur Box bringen'};
}
function hubAbstellen(){
  const p=HUB.pal; if(!p) return false;
  const t=hubAbstellPlatz();
  if(!t.ort){ toast(t.text,'bad'); return false; }
  const o=vsPalObj[p.id];
  HUB.pal=null; if(HUB.g) HUB.g.visible=false;
  if(t.ort==='l'){ p.ort='l'; p.idx=t.idx; vsPalStellen(p,o,true); sfx.thump(0.3);
    statAdd('paletten',1); addXP(6,'Palette verladen'); toast(`Palette mit ${vsPalZahl(p)} Paketen im LKW.`,'money'); }
  else { /* an den Anfang der Schlange */
    p.ort='z'; vsPalZelle().forEach(q=>{ if(q!==p) q.idx++; }); p.idx=0; vsPalStellen(p,o,true); o.cx=null; vsPalAbgleich(); sfx.pop(); toast('Palette steht wieder in der Box.'); }
  syncPakete();
  return true;
}
/* Aktion: getragene Palette abstellen, sonst die angesehene aufnehmen */
function hubAktion(ziel){
  if(HUB.pal) return hubAbstellen();
  if(ziel&&ziel.kind==='palette'){ const p=S.paletten.find(q=>q.ort==='z'&&q.idx===ziel.ref.idx); if(p) return hubAufnehmen(p); }
  return false;
}
function hubPrompt(t){
  if(HUB.pal){ const h=hubAbstellPlatz(); return {t:h.text,a:!!h.ort}; }
  if(t&&t.kind==='palette'){ const p=S.paletten.find(q=>q.ort==='z'&&q.idx===t.ref.idx); if(!p) return null;
    const n=vsPalZahl(p), why=hubAufnehmenPruefen(p);
    return why?{t:`Palette (${n} Pakete) – ${why}`,a:false}:{t:`Palette mit ${n} Paketen aufnehmen (Hubwagen)`,a:true}; }
  if(t&&t.kind==='ddlschild') return ddlSchildPrompt();
  return null;
}
function hubAufbauPark(){
  if(HUB.park||!packTisch) return;
  /* der Hubwagen steht im Versandhof neben dem Tor, die Gabeln zeigen vom Tor weg */
  HUB.park=hubModell(); HUB.park.position.set(V1.x+3.6,0.036,V1.wz-1.5); HUB.park.rotation.y=0; scene.add(HUB.park);
}

/* ---------------------------------------------------------
   Versandhof und Rolltor V1
   --------------------------------------------------------- */
function vdSetzen(t){
  VD.t=clamp(t,0,1);
  VD.panels.forEach((pn,i)=>{ const zu=(i+0.5)*(V1.h/VD.panels.length), auf=V1.h+0.14+i*0.1; pn.position.y=zu+(auf-zu)*VD.t; });
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
function buildVersandhof(){
  if(VD.g) return;
  const g=new THREE.Group(); scene.add(g); VD.g=g;
  const steel=std(0x8d939d,{metalness:0.6,roughness:0.42}), dark=std(0x2a2e38,{metalness:0.5,roughness:0.45}), gelb=std(0xf2c230,{roughness:0.7});
  /* Torblatt: Rolltor aus sechs Panelen, laeuft nach oben in den Sturz */
  const N=6, ph=V1.h/N;
  for(let i=0;i<N;i++){ const pn=new THREE.Mesh(new THREE.BoxGeometry(V1.w-0.06,ph-0.01,0.07),torPanelMat()); pn.position.set(V1.x,(i+0.5)*ph,V1.wz); if(HIQ){ pn.castShadow=true; } g.add(pn); VD.panels.push(pn); }
  /* Zarge: zwei Pfosten und der Sturzbalken, an beiden Seiten */
  for(const s of [-1,1]) for(const zz of [V1.wz-0.13,V1.wz+0.13]) bbox(0.16,V1.h+0.1,0.07,steel,V1.x+s*(V1.w/2+0.05),(V1.h+0.1)/2,zz,g,false);
  for(const zz of [V1.wz-0.13,V1.wz+0.13]) bbox(V1.w+0.4,0.2,0.07,steel,V1.x,V1.h+0.1,zz,g,false);
  /* Ampel: rot zu, gruen offen */
  VD.lampR=new THREE.MeshStandardMaterial({color:LIN(0x401010),emissive:LIN(0xff3a22),emissiveIntensity:1.4});
  VD.lampG=new THREE.MeshStandardMaterial({color:LIN(0x104018),emissive:LIN(0x33ff77),emissiveIntensity:0});
  VD.warn=new THREE.MeshStandardMaterial({color:LIN(0x403010),emissive:LIN(0xffa820),emissiveIntensity:0});
  bbox(0.2,0.5,0.14,dark,V1.x+V1.w/2+0.55,2.2,V1.wz+0.2,g,false);
  const lamp=(m,y)=>{ const l=new THREE.Mesh(new THREE.SphereGeometry(0.06,10,8),m); l.position.set(V1.x+V1.w/2+0.55,y,V1.wz+0.29); g.add(l); };
  lamp(VD.lampR,2.36); lamp(VD.lampG,2.2);
  const wl=new THREE.Mesh(new THREE.SphereGeometry(0.1,10,8),VD.warn); wl.position.set(V1.x,V1.h+0.35,V1.wz+0.2); g.add(wl);
  /* Beschriftung ueber dem Tor, innen und aussen */
  const schild=tex(640,128,(c,W,H)=>{ c.fillStyle='#1b2340'; c.fillRect(0,0,W,H); c.strokeStyle='#ffd23f'; c.lineWidth=8; c.strokeRect(6,6,W-12,H-12);
    c.fillStyle='#ffd23f'; c.font=BUN(58); c.textAlign='center'; c.textBaseline='middle'; c.fillText('V1 · VERSAND',W/2,H*0.52); });
  const sm=new THREE.MeshStandardMaterial({map:schild,roughness:0.6});
  plane(1.9,0.38,sm,V1.x,V1.h+0.62,V1.wz+0.12,0,g); plane(1.9,0.38,sm,V1.x,V1.h+0.62,V1.wz-0.12,Math.PI,g);
  /* Abholschild an der Hallenwand: von hier ruft man DDL ab 18 Uhr */
  const dt=tex(520,260,(c,W,H)=>{ c.fillStyle='#1b2340'; c.fillRect(0,0,W,H); c.strokeStyle='#ffd23f'; c.lineWidth=10; c.strokeRect(8,8,W-16,H-16);
    c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font=BUN(54); c.fillText('ABHOLUNG',W/2,66);
    c.fillStyle='#ffffff'; c.font=BUN(76); c.fillText('DDL',W/2,140); c.fillStyle='#bcd0ea'; c.font=BAR(32); c.fillText('täglich 22 Uhr · ab 18 Uhr selbst fahren',W/2,214); });
  const dm=new THREE.MeshStandardMaterial({map:dt,roughness:0.6});
  VD.sign=plane(1.2,0.6,dm,V1.x-V1.w/2-1.0,1.7,V1.wz+0.115,0,g);
  VD.signHit=bbox(1.3,0.7,0.2,hitM,V1.x-V1.w/2-1.0,1.7,V1.wz+0.25,g,false); VD.signHit.userData={kind:'ddlschild',ref:null};
  /* Versandhof: Betonplatte, Fahrspur, Zaun, Poller */
  const hof=V1_HOF, W=hof.x1-hof.x0, D=hof.z1-hof.z0;
  const bt=concreteTex(); bt.repeat.set(W/2.2,D/2.2);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({map:bt,roughness:0.92,color:LIN(0xa8acb2)}));
  fl.rotation.x=-Math.PI/2; fl.position.set((hof.x0+hof.x1)/2,0.036,(hof.z0+hof.z1)/2); if(HIQ) fl.receiveShadow=true; g.add(fl);
  const mark=(w,d,x,z)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:0xf2c230})); m.rotation.x=-Math.PI/2; m.position.set(x,0.04,z); g.add(m); };
  for(let z2=hof.z1-0.8;z2>hof.z0+1;z2-=1.1){ mark(0.12,0.6,V1.x-1.75,z2); mark(0.12,0.6,V1.x+1.75,z2); }
  const zm=new THREE.Mesh(new THREE.PlaneGeometry(4.6,1.3),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,map:tex(920,260,(c2,Wc,Hc)=>{ c2.clearRect(0,0,Wc,Hc);
    c2.fillStyle='rgba(18,20,26,.62)'; c2.fillRect(0,0,Wc,Hc); c2.strokeStyle='#ffd23f'; c2.lineWidth=10; c2.strokeRect(5,5,Wc-10,Hc-10);
    c2.textAlign='center'; c2.textBaseline='middle'; c2.font=BUN(104); c2.fillStyle='#ffd23f'; c2.fillText('VERSANDHOF',Wc/2,Hc/2+3); })}));
  zm.rotation.x=-Math.PI/2; zm.rotation.z=0; zm.position.set(V1.x,0.045,hof.z1-2.4); zm.renderOrder=2; g.add(zm);
  const zaunM=std(0x4a5260,{metalness:0.6,roughness:0.5});
  const zaun=(x0,z0,x1,z1)=>{ const quer=Math.abs(x1-x0)>Math.abs(z1-z0), L=quer?Math.abs(x1-x0):Math.abs(z1-z0), n=Math.max(1,Math.round(L/2));
    for(let j=0;j<=n;j++){ const x=x0+(x1-x0)*j/n, z=z0+(z1-z0)*j/n; bbox(0.08,2.0,0.08,zaunM,x,1.0,z,g,false); }
    const m=new THREE.Mesh(new THREE.BoxGeometry(quer?L:0.03,1.7,quer?0.03:L),std(0x707886,{metalness:0.5,roughness:0.5,transparent:true,opacity:0.55}));
    m.position.set((x0+x1)/2,1.0,(z0+z1)/2); g.add(m);
    for(const yy of [0.15,1.95]) bbox(quer?L:0.05,0.05,quer?0.05:L,zaunM,(x0+x1)/2,yy,(z0+z1)/2,g,false); };
  zaun(hof.x0,hof.z1,hof.x0,hof.z0); zaun(hof.x1,hof.z1,hof.x1,hof.z0); zaun(hof.x0,hof.z0,hof.x1,hof.z0);
  col(hof.x0-0.1,hof.x0+0.05,hof.z0,hof.z1); col(hof.x1-0.05,hof.x1+0.1,hof.z0,hof.z1); col(hof.x0,hof.x1,hof.z0-0.1,hof.z0+0.05);
  /* Poller vor dem Tor */
  for(const s of [-1,1]){ const x=V1.x+s*(V1.w/2+0.55); bbox(0.18,0.9,0.18,gelb,x,0.45,V1.wz-0.9,g,false); col(x-0.14,x+0.14,V1.wz-1.04,V1.wz-0.76); }
  /* Flutlicht ueber dem Tor */
  bbox(0.5,0.12,0.2,dark,V1.x,V1.h+1.15,V1.wz-0.25,g,false);
  VD.fluter=new THREE.MeshStandardMaterial({color:LIN(0x23262e),emissive:LIN(0xfff2d6),emissiveIntensity:0}); if(typeof lampMats!=='undefined') lampMats.push(VD.fluter);
  const fl2=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.06,0.12),VD.fluter); fl2.position.set(V1.x,V1.h+1.07,V1.wz-0.3); g.add(fl2);
  vdSetzen(0);
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
  toast('DDL rollt an Tor V1 – der Paketdienst holt ab.');
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
  if(!VT.fahrer){ VT.fahrer=makePerson({kopf:'CM07'}); VT.fahrer.visible=false; scene.add(VT.fahrer); }
  { const w=vf(-LR.len+2.4,-LR.w/2-1.4); VT.fahrer.position.set(w.x,0,w.z); VT.fahrer.rotation.y=1.2; VT.fahrer.visible=true; }
}
function vtFlap(){ if(VT.bruecke) VT.bruecke.rotation.z=VT.flap*FLAP_MAX; }
function vtRaumWeg(){
  if(VT.raum){ if(VT.raum.parent) VT.raum.parent.remove(VT.raum); VT.raum=null; LR_LAMPE.forEach(l=>{ l.intensity=0; }); }
  if(VT.bruecke){ if(VT.bruecke.parent) VT.bruecke.parent.remove(VT.bruecke); VT.bruecke=null; }
  VT.cols.forEach(c=>dropCol(c)); VT.cols=[];
  if(VT.flapCol){ dropCol(VT.flapCol); VT.flapCol=null; }
  if(VT.fahrer) VT.fahrer.visible=false;
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
  if(VT.fahrer&&VT.fahrer.visible) animPerson(VT.fahrer,false,dt,1);
  if(!VT.state) return;
  const g=VT.g;
  if(VT.state==='anfahrt'){
    /* Rueckwaerts an V1, das Tor bleibt dabei zu */
    const d=0-g.position.x, sp=clamp(d*0.9,0.5,2.6);
    g.position.x+=sp*dt;
    if(d<=0.03){ g.position.x=0; VT.state='torauf'; vdOffen(true); vtLaderaumOeffnen(); toast('Der Fahrer steht an V1. Das Tor fährt hoch.'); }
  } else if(VT.state==='torauf'){
    if(vdIstOffen()){ VT.state='docked'; VT.t=0; DDL.t=0; toast(`DDL ist da: Paletten mit dem Hubwagen in den LKW fahren – oder der Mitarbeiter übernimmt in ${DDL.ruf?DDL_RUF:DDL_AUTO} s.`,COARSE?'':'xp'); }
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
   Der Mitarbeiter am Hubwagen (in der hoeheren Stufe ein
   Hubwagen-Roboter ohne Person): holt die vorderste Palette aus
   der Box, faehrt sie rueckwaerts in den Laderaum und stellt sie ab
   --------------------------------------------------------- */
function ldBauen(){
  if(LD.jack) return;
  LD.jack=hubModell(); LD.jack.visible=false; scene.add(LD.jack);
  LD.fig=makePerson({kopf:'CM07'}); LD.fig.visible=false; scene.add(LD.fig);
}
function ldAgv(){ return packStufe()>=2; }
function ldPose(dt){
  /* Bediener bei (lx,lz) im Rahmen, blickt in die Halle (+lx = Welt +z): Rotation 0 */
  const w=vf(LD.lx,LD.lz);
  LD.fig.position.set(w.x,0,w.z); LD.fig.rotation.y=0; LD.fig.visible=!LD.agv&&LD.ph!=='idle'&&LD.ph!=='fertig';
  LD.jack.position.set(w.x,0,w.z); LD.jack.rotation.y=0; LD.jack.visible=LD.ph!=='idle'&&LD.ph!=='fertig';
  if(LD.pal){ const q=vf(LD.lx+1.3,LD.lz+(LD.ph==='fahren'||LD.ph==='absetzen'?(LD.sw||0):0)); palFolgen(LD.pal,{x:q.x,z:q.z,ry:Math.PI/2},dt||0.016); }
}
function ldNaechste(){
  const p=vsPalZelle()[0];
  return p&&vsPalZahl(p)>0?p:null;
}
function ldFreierPlatz(){ for(let i=0;i<DDL_SLOTS;i++) if(!S.paletten.some(q=>q.ort==='l'&&q.idx===i)) return i; return -1; }
function ldUpdate(dt){
  if(!LD.jack) ldBauen();
  const aktiv=VT.state==='docked'&&vdIstOffen();
  if(!aktiv){ if(LD.ph!=='idle'){ ldAbbruch(); } return; }
  LD.agv=ldAgv();
  const v=1.0;
  switch(LD.ph){
    case 'idle': {
      /* wartet, bis der Fahrer losfahren darf; faehrt nicht, solange der Spieler eine Palette hat */
      const warte=DDL.ruf?DDL_RUF:DDL_AUTO;
      if(DDL.t<warte||HUB.pal||vsPalGleitet()||roboterBusy()) break;
      const p=ldNaechste(), slot=ldFreierPlatz(); if(!p||slot<0) break;
      LD.ziel=ddlSlot(slot); LD.slot=slot; LD.pal=null; LD.x0=boxStandLx(); LD.lx=LD.x0; LD.lz=BOX_LZ; LD.lz0=BOX_LZ; LD.sw=0; LD.ph='hin'; LD.t=0; ldPose(dt); break; }
    case 'hin': {
      /* ans Tor stellen und die Gabeln unter die vorderste Palette schieben */
      LD.t+=dt; ldPose(dt); if(LD.t<0.9) break;
      const p=ldNaechste(); if(!p||HUB.pal){ LD.ph='idle'; break; }
      palAufnehmen(p); p.lader=true; LD.pal=p; LD.ph='fahren'; LD.t=0; break; }
    case 'fahren': {
      /* rueckwaerts durch die Gasse in der Mitte des Laderaums; die Palette schwenkt erst zum Schluss
         seitlich auf ihren Platz - der Fahrer kommt so nie an stehenden Paletten vorbei */
      const ziel=LD.ziel.lx-1.3;
      LD.lx=Math.max(ziel,LD.lx-v*dt);
      const rest=LD.lx-ziel;
      LD.lz=LD.lz0*(1-vsGlatt(clamp((LD.x0-LD.lx)/1.6,0,1)));
      LD.sw=LD.ziel.lz*vsGlatt(clamp(1-rest/1.3,0,1));
      ldPose(dt); if(LD.lx<=ziel+1e-6){ LD.ph='absetzen'; LD.t=0; } break; }
    case 'absetzen': {
      LD.t+=dt; ldPose(dt); if(LD.t<0.7) break;
      const p=LD.pal; LD.pal=null; p.ort='l'; p.idx=LD.slot; p.lader=false; vsPalStellen(p,vsPalObj[p.id],true);
      statAdd('paletten',1); sfx.thump(0.3); syncPakete(); LD.ph='zurueck'; LD.t=0; break; }
    case 'zurueck': {
      /* erst in die Fahrgasse, dann vorwaerts zum Tor */
      if(Math.abs(LD.lz)>0.01){ LD.lz+=Math.sign(-LD.lz)*Math.min(Math.abs(LD.lz),dt*0.9); }
      else LD.lx=Math.min(LD.x0,LD.lx+1.7*dt);
      ldPose(dt); if(LD.lx>=LD.x0-1e-6&&Math.abs(LD.lz)<0.02){ LD.ph='idle'; LD.t=0; LD.jack.visible=false; LD.fig.visible=false; } break; }
  }
  if(LD.fig&&LD.fig.visible) animPerson(LD.fig,LD.ph==='fahren'||LD.ph==='zurueck',dt,0.9);
}
/* Truck weg oder Tor zu: der Mitarbeiter lässt die Palette stehen, wo sie ist */
function ldAbbruch(){
  if(LD.pal){ const p=LD.pal; LD.pal=null; p.lader=false; p.ort='z'; vsPalZelle().forEach(q=>{ if(q!==p) q.idx++; }); p.idx=0; const o=vsPalObj[p.id]; if(o){ vsPalStellen(p,o,true); o.cx=null; } vsPalAbgleich(); syncPakete(); }
  LD.ph='idle'; LD.t=0; if(LD.jack) LD.jack.visible=false; if(LD.fig) LD.fig.visible=false;
}

/* ---------------------------------------------------------
   DDL: wann kommt der LKW, wann faehrt er
   --------------------------------------------------------- */
function ddlLaeuft(){ return !!VT.state||DDL.warte; }
function ddlHatLadung(){ return (S.paketGr||[]).length>0||S.paletten.some(p=>p.ort!=='z'); }
function ddlSchildPrompt(){
  if(VT.state||DDL.warte) return {t:'DDL ist da oder unterwegs',a:false};
  if(!packBereit()) return {t:'Abholung DDL – die Packstation ist noch nicht in Betrieb',a:false};
  if(!hubZeit()) return {t:'Abholung DDL: ab 18 Uhr kannst du den LKW rufen und selbst verladen',a:false};
  if(!ddlHatLadung()) return {t:'Abholung DDL: noch keine Pakete zur Abholung',a:false};
  return {t:'DDL jetzt rufen und selbst verladen',a:true};
}
function ddlRufen(){
  const p=ddlSchildPrompt(); if(!p.a){ toast(p.t,'bad'); return false; }
  DDL.warte=true; DDL.ruf=true; DDL.tag=S.day; sfx.pop(); toast('DDL ist unterwegs.'); return true;
}
function ddlStart(){
  /* 22 Uhr, Ladenschluss: DDL rollt an. Gerufen wurde schon? Dann nur, wenn wieder etwas da ist. */
  if(!packBereit()||DDL.warte||VT.state) return;
  if(!(phase==='closing'||phase==='after')) return;
  if(DDL.autoTag===S.day||(S.ddlTag|0)===S.day) return;
  DDL.autoTag=S.day; S.ddlTag=S.day;
  if(!ddlHatLadung()) return;
  DDL.warte=true; DDL.ruf=false; DDL.tag=S.day;
}
function ddlTruckUpdate(dt){
  DDL.t+=dt;
  ldUpdate(dt);
  /* fertig: nichts mehr zu holen, keiner im Laderaum, nichts in der Hand */
  const mehr=(ldNaechste()&&ldFreierPlatz()>=0)||HUB.pal||LD.pal||roboterBusy();
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
  if(HUB.pal&&ids.has(HUB.pal.id)){ HUB.pal=null; if(HUB.g) HUB.g.visible=false; }
  if(LD.pal&&ids.has(LD.pal.id)){ LD.pal=null; LD.ph='idle'; }
  if(n) statAdd('ddl',n);
  return n;
}
function ddlAbfahrt(){
  const n=ddlAbholen(false);
  DDL.t=0; DDL.lad=0; DDL.ruf=false;
  vsPalAbgleich(); syncPakete(); drawPackSchild();
  if(n) toast(`DDL hat ${n} Paket${n===1?'':'e'} abgeholt.`,'money');
  VT.state='flap'; VT.t=0;
}
/* Paletten voll: DDL faehrt zwischendurch vor und nimmt mit, was in der Box liegt */
function vsZwischenabholung(){
  const n=vsGelandet(); if(n<=0) return 0;
  const gr=[], pp=[]; let k=0;
  const ids=new Set(vsPalZelle().map(p=>p.id));
  for(let i=0;i<S.paketGr.length;i++){ if(i<n&&ids.has(S.paketP[i])){ k++; continue; } gr.push(S.paketGr[i]); pp.push(S.paketP[i]); }
  S.paketGr=gr; S.paketP=pp; S.pakete=gr.length; if(k) statAdd('ddl',k);
  syncPakete(); drawPackSchild();
  toast('Die Paletten waren voll – DDL hat zwischendurch abgeholt.');
  return k;
}
/* Tagesende: alles geht mit, auch was noch auf dem Band laeuft */
function ddlAbholung(){
  vsBahn.forEach(e=>{ if(e.m.parent) e.m.parent.remove(e.m); }); vsBahn.length=0;
  vsPortalRuhe();
  vsPalInit();
  HUB.pal=null; if(HUB.g) HUB.g.visible=false;
  if(LD.ph!=='idle') ldAbbruch();
  const n=ddlAbholen(true);
  S.paketGr=[]; S.paketP=[]; S.pakete=0;
  DDL.warte=false; DDL.t=0; DDL.lad=0; DDL.ruf=false;
  if(VT.state) vtEntfernen();
  if(packTisch){ vsPalAbgleich(); syncPakete(); drawPackSchild(); }
  return n;
}
/* Takt: Hubwagen, gleitende Paletten, DDL, Tor */
function updatePaletten(dt){
  if(!S||!packTisch) return;
  if(!VD.g) buildVersandhof();
  if(!HUB.park&&zoneOffen('packstation')) hubAufbauPark();
  vsPalZeichnen(dt);
  hubUpdate(dt);
  vdUpdate(dt);
  if(VD.fluter) { /* Flutlicht brennt nachts mit den anderen Leuchten */ }
  if(packBereit()){
    ddlStart();
    if(DDL.warte&&!VT.state){ DDL.warte=false; vtStart(); }
  }
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
  HUB.pal=null; LD.pal=null; LD.ph='idle'; if(VT.state) vtEntfernen();
  DDL.autoTag=S.ddlTag|0; DDL.warte=false;
}
