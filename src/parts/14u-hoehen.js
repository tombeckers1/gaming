/* =========================================================
   Hoehen und Groessen der Raketen und Kugelbomben (06.10., Toms PDF vom
   05.10.):
   - "Schau nochmal, dass die Raketen auch hoeher fliegen. Teils sind die
     zu niedrig" / "Blanko Rakete soll deutlich hoeher fliegen" / "Hase
     jagt Rakete etwas hoeher": die Raketen brachen bei 13-41 m (Median
     20) und damit unter den Batterien (im Mittel 31 m). Jetzt bricht jede
     Rakete ueber den Batterien - 38 m auf Level 6, 53 m auf Level 18, die
     Jumbos ab Level 19 bei 58-68 m - mit einer sichtbaren Steigzeit von
     1,9 bis 2,5 s statt 1,2-1,4 s. Die Steigerung ueber die Level bleibt.
   - "bezueglich den Kugelbomben, schau, dass die auf der gleichen Hoehe
     mal explodieren. Die mit der groesseren Hoehe finde ich gut, allerdings
     der Effekt ist zu klein. Es soll sich von Raketen abheben - der Effekt
     muss bei vielen echt gross sein, Wow": alle Kugeln brechen auf einer
     Hoehe (86-90 m, das Niveau der 300er), das Kaliber bestimmt nur noch
     Groesse, Dauer und Dichte. Groesser wird das Bild durch einen
     raeumlichen Massstab (FW_RAUM, unten): der ganze Bruch wird um seinen
     Mittelpunkt gestreckt - Tempo und Schwere der Sterne mal f, die
     Sternzahl bleibt. So kostet ein grosser Bruch nicht mehr Teilchen
     (Handy), und das Bild bleibt dasselbe, nur groesser - wie aus der
     Naehe gesehen.
   ========================================================= */

/* ---------- Raketen: Bruchhoehe und Steigzeit nach Level ---------- */
/* Bruchhoehe ueber dem Rohr (m) und Steigzeit (s). Normale Raketen bis
   Level 18, ab Level 19 die Jumbos (die Furzrakete ist ein Spass und
   bleibt darunter, aber ueber den Batterien). */
function rkHoeheZiel(t,L){
  if(t==='furzrakete') return {h:46,fuse:2.2};
  if(L>=19) return {h:58+(L-19)*1.7,fuse:2.3+(L-19)*0.04};
  return {h:38+(L-6)*1.25,fuse:1.85+(L-6)*0.035};
}
(function(){
  const Q=t=>P[t]||(typeof NEUWARE!=='undefined'?NEUWARE[t]:null);
  for(const t of Object.keys(RAKETEN_KL)){ const p=Q(t), k=RAKETEN_KL[t]; if(!p||p.shape!=='rocketset') continue;
    const z=rkHoeheZiel(t,p.lvl||6), alt=k.fuse||1.3;
    /* Rohrmuendung und Abschuss liegen gut 1,5 m ueber dem Boden */
    k.fuse=+z.fuse.toFixed(3); k.pw=+pwFuerHoehe(z.h-1.5,z.fuse).toFixed(3);
    if(k.dauer) k.dauer=+(k.dauer+Math.max(0,z.fuse-alt)).toFixed(2);
  }
})();

/* ---------- Kugelbomben: eine Bruchhoehe, Groesse nach Kaliber ---------- */
/* Bruchhoehe ueber Grund (m) je Kaliber 75/100/150/200/300 mm - ein Meter
   Unterschied je Kaliber ist von unten nicht zu sehen ("gleiche Hoehe"),
   die groessere Kugel geht trotzdem nie tiefer auf. Steigzeit in s. */
const KG_HOEHE=[86,87,88,89,90], KG_STEIG=[2.9,3.0,3.1,3.2,3.35];
/* Raeumlicher Massstab des Bruchs je Kaliber (Vorgabe) und je Sorte
   (gemessen: Durchmesser vorher -> Ziel 62/72/86/100/118 m) */
const KG_RAUM_KAL=[2.0,1.8,1.6,1.55,1.5];
/* Je Sorte: Ziel-Durchmesser 75/82/92/105/120 m (jede Kugel ueber der groessten Rakete, 65 m) (75...300 mm) geteilt
   durch den gemessenen Durchmesser vorher (90 % der Sterne, Vorfuehrung,
   06.10.) - so waechst die Groesse mit dem Kaliber, nicht mit der Laune
   des Bruchbilds. Die Kaiserkrone (L26) war schon gross (92 m). */
const KG_RAUM={kugel75:2.9,palmenkugel75:2.9,farbenmeer75:2.0,
  goldbrokat100:2.4,kugel100:1.5,goldweide100:2.35,kristallkugel100:2.0,
  kugel150:1.6,crossettennetz150:2.3,tigerkrone150:1.45,farbcrossette150:2.3,sternkugel150:1.9,sternenstaub150:1.8,
  weidenkoenig200:1.65,kronenkranz200:1.55,zwillingssonne200:1.45,blitzpalme200:3.2,goldweidenkreuz200:2.0,feuerlilie200:1.85,goldkrone200:2.2,kugel200:1.7,
  kugel300:1.95,kanonade300:2.6,sternensturm300:2.15,kronenregen300:2.25,dreifachkrone300:2.2,crossettenweide300:1.6,kaiserkrone:1.3};
for(const id of Object.keys(KG_RAUM)) if(KUGEL[id]) KUGEL[id].raum=KG_RAUM[id];
function kgRaum(k){ const K4=Math.max(1,Math.min(5,k.kal|0)); return k.raum||KG_RAUM_KAL[K4-1]; }
{ const ks=kugelSorte;
  kugelSorte=function(o,k){
    const K4=Math.max(1,Math.min(5,k.kal|0)), zuend=KG_STEIG[K4-1], z0=zuend/KUGEL_ZUEND;
    /* Abschussort wie in shot(): o.y + ab (Standard 0,4) */
    const y0=o&&o.y!==undefined?o.y+(o.ab!==undefined?o.ab:0.4):1;
    const h0=(KG_HOEHE[K4-1]-y0)/KUGEL_HUB[K4-1], pw=(h0+3*z0*z0)/(STEIG*z0)-21;
    const r=ks(o,Object.assign({},k,{pw,fuse:z0}));
    if(r&&typeof r==='object') r.raum=kgRaum(k);
    return r;
  };
}

/* Herzschlag (Kugel 75): auf 86 m las sich das Herz aus 64 Sternen ohne
   Spur nur noch als lockerer Punkthaufen (Render 06.10.) - jetzt 140
   Sterne mit kurzer Leuchtspur, das Herz steht als Linie am Himmel */
EFF.herzschlag=function(p,A,B,s){
  const q=QUAL(), [u0,v0]=basisBlick(p,0.45), dr=rand(-0.3,0.3), cd=Math.cos(dr), sd=Math.sin(dr), n=Math.round(140*q), G=2.6;
  const u=[u0[0]*cd+v0[0]*sd,u0[1]*cd+v0[1]*sd,u0[2]*cd+v0[2]*sd], v=[v0[0]*cd-u0[0]*sd,v0[1]*cd-u0[1]*sd,v0[2]*cd-u0[2]*sd];
  for(let i=0;i<n;i++){
    const t=rand(0,Math.PI*2), hx=Math.pow(Math.sin(t),3)+rand(-.05,.05), hy=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16+rand(-.05,.05);
    const sp=8.5*s*rand(0.95,1.04), c=i%4?A:B, x=rand(-.06,.06);
    const w=[(u[0]*hx+v[0]*hy)*sp+x,(u[1]*hx+v[1]*hy)*sp,(u[2]*hx+v[2]*hy)*sp-x];
    psBig.emit(p.x,p.y,p.z,w[0],w[1],w[2],c[0]*1.5,c[1]*1.5,c[2]*1.5,rand(1.8,2.5),G,0); }
  for(let i=0;i<Math.round(5*q);i++){ const d=randDir(), w=rand(3,7)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,A[0],A[1],A[2],rand(1.2,1.8),G,0); }
};
EFF_SCHWEIF.herzschlag=0.24;

/* ---------- FW_RAUM: ein Bruch, raeumlich gestreckt ----------
   {p:[x,y,z] Bruchmitte, f Massstab}. Solange er gilt, setzt jeder neue
   Stern um p gestreckt auf (Ort), fliegt f-mal so schnell und faellt
   f-mal so stark - die Bahn ist genau die alte Bahn mal f. Er gilt fuer
   alles, was der Bruch anstoesst, auch spaeter: Nachbrueche (later),
   Funkenschweife und Zerleger (imBild), gefuehrte Sterne (fuehre). Wer
   den Ort eines fliegenden Sterns liest (kgOrt), bekommt ihn in der
   ungestreckten Welt des Bruchs zurueck. */
let FW_RAUM=null;
/* Sterne (psBig, psHuge) haben eine Groesse in Metern; auf 90 m wurde ein
   Stern 1,4 Pixel klein und der ganze Kugelbruch zu Staub (Render 06.10.).
   Ein echter Stern ist eine Lichtquelle und schrumpft nicht unter einen
   sichtbaren Punkt: mindestens 2,4 Pixel. Unter ~50 m Entfernung (alle
   Batterien, die Raketen vom Pult aus) aendert sich nichts. Funken und
   Glitzer (psMid, psSmall) bleiben fein. */
function sternMindestPx(m,px){ m.onBeforeCompile=sh=>{ sh.vertexShader=sh.vertexShader.replace('#include <fog_vertex>','gl_PointSize = max( gl_PointSize, '+px.toFixed(1)+' );\n#include <fog_vertex>'); }; m.needsUpdate=true; }
/* gleich beim Anlegen (psBig 0,42 m, psHuge 0,95 m): so kennt shaderVorab den
   Shader schon - erst beim ersten Stern gesetzt, wurde er mitten im Feuerwerk
   neu uebersetzt (leistung.js SHADER, 06.10.) */
{ const PS0=PS; PS=class extends PS0{ constructor(max,size,seg,map){ super(max,size,seg,map); if(size>=0.4&&this.pts&&this.pts.material) sternMindestPx(this.pts.material,2.4); } }; }
{ const em=PS.prototype.emit;
  PS.prototype.emit=function(x,y,z,vx,vy,vz,r,g,b,life,grav,mode,r2,g2,b2){
    const R=FW_RAUM;
    if(R&&R.f!==1){ const f=R.f, p=R.p; x=p[0]+(x-p[0])*f; y=p[1]+(y-p[1])*f; z=p[2]+(z-p[2])*f; vx*=f; vy*=f; vz*=f; if(grav) grav*=f; }
    return em.call(this,x,y,z,vx,vy,vz,r,g,b,life,grav,mode,r2,g2,b2);
  }; }
function mitRaum(R,fn){ const a=FW_RAUM; FW_RAUM=R; try{ return fn(); } finally { FW_RAUM=a; } }
{ const la=later;
  later=function(t,fn){ const R=FW_RAUM; if(!R) return la(t,fn); return la(t,()=>mitRaum(R,fn)); }; }
{ const ib=imBild;
  /* der Sammel-Zeitgeber eines Bildes laeuft ohne Massstab, jeder
     Auftrag darin mit seinem eigenen */
  imBild=function(tz,fn){ const R=FW_RAUM; if(!R) return ib(tz,fn);
    FW_RAUM=null; try{ return ib(tz,()=>mitRaum(R,fn)); } finally { FW_RAUM=R; } }; }
{ const ko=kgOrt;
  kgOrt=function(h){ const o=ko(h), R=FW_RAUM; if(!R||R.f===1) return o; const f=R.f, p=R.p, q=o[0], v=o[1];
    return [{x:p[0]+(q.x-p[0])/f,y:p[1]+(q.y-p[1])/f,z:p[2]+(q.z-p[2])/f},[v[0]/f,v[1]/f,v[2]/f]]; }; }
{ const fu=fuehre;
  fuehre=function(ps,x,y,z,vx,vy,vz,c,life,fn,o){
    const R=FW_RAUM; if(!R||R.f===1) return fu(ps,x,y,z,vx,vy,vz,c,life,fn,o);
    const f=R.f, P0=R.p, ab=(s)=>{ s.pu=s.p; s.vu=s.v; s.p=[P0[0]+(s.pu[0]-P0[0])*f,P0[1]+(s.pu[1]-P0[1])*f,P0[2]+(s.pu[2]-P0[2])*f]; s.v=[s.vu[0]*f,s.vu[1]*f,s.vu[2]*f]; };
    const auf=(s)=>{ s.p=s.pu; s.v=s.vu; };
    const o2=Object.assign({},o||{});
    if(o&&o.ende) o2.ende=s=>{ const pm=s.p, vm=s.v; auf(s); try{ mitRaum(R,()=>o.ende(s)); } finally { s.p=pm; s.v=vm; } };
    const s=fu(ps,x,y,z,vx,vy,vz,c,life,(s,dt)=>{ auf(s); let r; try{ r=mitRaum(R,()=>fn(s,dt)); } finally { ab(s); } return r; },o2);
    ab(s); return s;
  }; }
/* Raketen: ihr Bruch liegt jetzt gut doppelt so weit weg wie vorher
   (20 m -> 38-68 m) und wuerde vom Pult aus nur noch halb so gross
   wirken - er wird um 1,45 gestreckt (Sternzahl gleich). Die schon
   grossen (Mondfinsternis, Supernova: 40-50 m Durchmesser; die Hakenschlag-Go-Getter der Hasenjagd schwirren schon 45 m weit - sie bleiben ungestreckt)
   weniger, damit keine Rakete an eine Kugel heranreicht. Gilt nur fuer
   die Raketenbrueche selbst (eigene Bruchbilder, die keine Batterie
   nutzt: steigerung.js EXKLUSIV); der Fallschirm haengt an einem Modell
   und bleibt, wie er ist. */
const RK_RAUM={raketen:1,silbermond:1.25,supernova:1.15,jumboleiter:1.3,faecherweide:1.3}, RK_RAUM_EFF={};
for(const t of Object.keys(RAKETEN_KL)){ const k=RAKETEN_KL[t], p=P[t]||(typeof NEUWARE!=='undefined'?NEUWARE[t]:null);
  if(!p||p.shape!=='rocketset'||!k.eff) continue;
  for(const e of k.eff) if(e!=='fallschirm') RK_RAUM_EFF[e]=RK_RAUM[t]||1.45; }
{ const fb=fwBurst;
  fwBurst=function(r){ const f=r&&(r.raum||(!r.kugel&&!r.fein&&!r.stufe&&RK_RAUM_EFF[r.eff])); if(!f||FW_RAUM) return fb(r);
    return mitRaum({p:[r.p.x,r.p.y,r.p.z],f},()=>fb(r)); }; }

/* ---------- Finale Grande: die fuenf Mehrschlagbomben ----------
   Sie gingen bei 30-53 m auf ("in Sichthoehe", 29.09.) - jetzt wie jede
   Kugel auf Kugelhoehe, die Schlaege nach Kaliber gestreckt. */
{ const kb=kugelbombe;
  kugelbombe=function(o,kal,opt){ const r=kb(o,kal,opt); const R=opt&&opt.schlag&&opt.schlag.raum; if(R&&r&&typeof r==='object') r.raum=R; return r; }; }
if(SHOWS.kugelfinale){ const alt=SHOWS.kugelfinale;
  SHOWS.kugelfinale=()=>{ const s=alt(), n=s.map(ph=>{ if(!ph.bomb) return ph; const K4=ph.bomb, zuend=KG_STEIG[K4-1]-0.15, z0=zuend/KUGEL_ZUEND;
      /* Tisch 0,93 m + Batterie; erster Schlag 6 m unter der Kugelhoehe, die Schlaege steigen darueber */
      const h0=(KG_HOEHE[K4-1]-7.5)/KUGEL_HUB[K4-1];
      return Object.assign({},ph,{bombPw:(h0+3*z0*z0)/(STEIG*z0)-21,bombFuse:z0,schlag:Object.assign({},ph.schlag||{},{raum:KG_RAUM_KAL[K4-1]*0.9})}); });
    for(const k of Object.keys(s)) if(isNaN(+k)) n[k]=s[k];
    return n; }; }

/* ---------- Vorfuehrung: Rakete im Rohr, Kugel im Moerser ----------
   Toms PDF vom 05.10.: "Auf dem Testfeld Vorfuehrung sieht man keine
   Raketen und keine Kugelbomben in den Roehren (nur der Effekt ist zu
   sehen) - bitte aendern." Wie an der Station (raketeModell, kugelModell
   in 05d): die Rakete steckt mit dem Stab im Vorfuehrrohr, die Kugel liegt
   im Moerser, die gruene Zuendschnur haengt ueber den Rand. Beim Abschuss
   fliegt das Modell mit (Rakete mit dem Stab voran nach oben gekippt in
   Flugrichtung, die Kugel ohne Schnur) und ist mit dem Bruch weg. Der
   Blick beginnt am Rohr - man sieht die Zuendschnur brennen - und folgt
   dem Aufstieg bis zum Bruch; wer die Maus bewegt, uebernimmt. */
/* Der Blick gehoert der juengsten Zuendung; Blickwinkel der Kamera
   (Zoom aufs Rohr) kommt danach immer auf den Normalwert zurueck */
let vfBlickE=null, VF_FOV0=null;
const VF_FOV_NAH=16;
function vfBlickFrei(e){ if(e&&e!==vfBlickE) return; if(vfBlickE) vfBlickE.cam.an=false; vfBlickE=null;
  if(VF_FOV0!==null&&camera.fov!==VF_FOV0){ camera.fov=VF_FOV0; camera.updateProjectionMatrix(); } }
function vfImRohr(t,o){
  vfBlickFrei();
  const p=P[t]; if(!p) return null;
  let g=null, kugel=null;
  if(o.sid==='rampe'&&p.shape==='rocketset'&&t!=='gravur'){ g=raketeModell(t); g.position.set(o.x,o.y-0.01,o.z); }
  else if(o.sid==='moerser'&&p.shape==='shell'){ g=kugelModell(t,moerserRohr(t)); g.position.set(o.x,o.y,o.z); g.rotation.y=-Math.PI*0.5; kugel=g.children[0]; }
  if(!g) return null;
  g.userData.vfModell=t; scene.add(g);
  const e={t:30,k:'vfModell',o:{x:o.x,y:o.y,z:o.z},ab:o.ab||0,g,kugel,sid:o.sid,alter:0,r:null,fertig:false,
    cam:{an:true,letzt:null}};
  e.weg=()=>{ if(g.parent) g.parent.remove(g); e.fertig=true; e.t=0; vfBlickFrei(e); };
  if(VF_FOV0===null) VF_FOV0=camera.fov;
  vfBlickE=e; emitters.push(e); vfAufraeumen.push(e.weg);
  return e;
}
/* beim Beenden der Vorfuehrung gehoert der Blick wieder dem Spieler */
{ const aus=vorfuehrungAus; vorfuehrungAus=function(){ vfBlickFrei(); return aus.apply(this,arguments); }; }
const _vfY=new THREE.Vector3(0,1,0), _vfD=new THREE.Vector3();
/* Hoehenwinkel vom Auge zu einem Punkt */
function vfHoehenWinkel(x,y,z){ const c=camera.position; return Math.atan2(y-c.y,Math.hypot(x-c.x,z-c.z)); }
NEU_EMIT.vfModell=function(e,dt,o){
  e.alter+=dt;
  if(e.fertig){ e.t=0; return; }
  if(!e.r){
    /* die Rakete oder Kugel, die eben aus diesem Rohr gestartet ist */
    for(const r of rockets) if(!r.vfModell&&r.alter<0.3&&Math.abs(r.y0-(o.y+e.ab))<0.3&&Math.abs(r.p.x-o.x)<0.6&&Math.abs(r.p.z-o.z)<0.6){ e.r=r; r.vfModell=e.g; break; }
    if(e.r){ if(e.kugel){ e.g.children.forEach(m=>{ if(m!==e.kugel) m.visible=false; }); e.kugel.position.set(0,0,0); e.g.rotation.set(0,0,0); } }
    else if(e.alter>8) e.weg();
  }
  const r=e.r;
  /* Bruch: das Modell ist weg, der Blick legt sich noch 1,5 s auf die
     Bruchmitte (sonst stand eine Rakete am oberen Bildrand und wuchs hinaus) */
  if(r&&e.bruch===undefined&&rockets.indexOf(r)<0){ if(e.g.parent) e.g.parent.remove(e.g);
    e.bruch=vfHoehenWinkel(r.p.x,r.p.y,r.p.z)-(e.kugel?0.06:0.1); e.nach=1.5; }
  if(e.bruch!==undefined){ e.nach-=dt; if(e.nach<=0){ e.weg(); return; } }
  else if(r){
    e.g.position.set(r.p.x,r.p.y,r.p.z);
    if(!e.kugel){ _vfD.set(r.v.x,r.v.y,r.v.z); if(_vfD.lengthSq()>0.01){ _vfD.normalize(); e.g.quaternion.setFromUnitVectors(_vfY,_vfD); } } }
  /* Blick: erst aufs Rohr, dann mit dem Aufstieg nach oben */
  const c=e.cam; if(!c.an||vfBlickE!==e||typeof pitch==='undefined') return;
  if(!vfAn){ vfBlickFrei(e); return; }
  if(c.letzt!==null&&Math.abs(pitch-c.letzt)>0.02){ vfBlickFrei(e); return; }
  /* vor dem Start: nah aufs Rohr gezoomt (16 Grad), die Rakete steht im
     Bild, die Zuendschnur brennt; mit dem Start zoomt der Blick auf und
     folgt nach oben - der Bruch soll ganz ins Bild, die Kugel (doppelt so
     gross) steht hoeher im Bild */
  const rohr=vfHoehenWinkel(o.x,o.y+0.12,o.z);
  const ziel=e.bruch!==undefined?e.bruch:r?Math.max(rohr+0.42,vfHoehenWinkel(r.p.x,r.p.y,r.p.z)-(e.kugel?0.12:0.3)):rohr;
  const fov=r?VF_FOV0:VF_FOV_NAH, k=1-Math.exp(-dt*3.2);
  if(c.letzt===null){ pitch=ziel; camera.fov=fov; }
  else { pitch+=(ziel-pitch)*k; camera.fov+=(fov-camera.fov)*(r?1-Math.exp(-dt*2.2):k); }
  camera.updateProjectionMatrix();
  pitch=clamp(pitch,-1.4,1.4); c.letzt=pitch;
};

/* ---------- Smaragd (Rakete, L15): Achtblatt neu ----------
   Toms PDF vom 05.10.: "Bei der Smaragdrakete bitte den Effekt neu machen.
   Der hat zu viele Punkte, das sieht nicht aus wie ein Effekt. Mach den
   schoener." Vorher: acht Paeckchen mit je 18 gruenen Sternen ohne Spur -
   acht Punkthaufen. Jetzt ein geschliffener Smaragd: acht schwere
   smaragdgruene Kometen als Blaetter (ein Kranz, leicht zum Zuschauer
   gekippt), jeder mit koernigem Funkenschweif, sie biegen sich unter der
   Schwere wie Blaetter; dazwischen eine Krone aus gruenen
   Sternen mit dichtem Glitzerschweif (Brokat), in der Mitte ein funkelnder weissgoldener
   Glitzerkern (die Facetten). Zum Schluss funkeln die Blattspitzen golden
   auf und rieseln. Eine Farbfamilie: Smaragdgruen, Mint, ein Hauch Gold. */
EFF.smaragdkrone=function(p,A,B,s){
  const q=QUAL(), smaragd=[0.1,1,0.42], mint=FW.mint, G=2.3, T=2.4;
  /* acht Blaetter */
  nRing(p,8,8.6*s,(v,i)=>{ const c=i%2?kgMal(smaragd,1.5):kgMal(mint,1.3);
    nKomet(p,v,c,T,G,[0.5,1,0.55],70,{life:[0.7,1.3],g:1.6});
    kgSpaeter(T*0.97,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T*0.97), a=SCHWEIF; SCHWEIF=0.02;
      for(let k=0;k<Math.round(9*q);k++){ const d=randDir(), w=rand(0.6,1.6); psMid.emit(e.x,e.y,e.z,d[0]*w,d[1]*w-0.4,d[2]*w,1.15,.95,.5,rand(0.9,1.5),1.1,4); }
      SCHWEIF=a; }); },0.4);
  /* smaragdgruene Chrysantheme zwischen den Blaettern: jeder Stern zieht
     einen feinen gruengoldenen Glitzerschweif und sinkt zum Schluss wie
     eine Weide */
  /* Render 06.10.: mit 38 Sternen blieb es ein lockerer Stern aus Strichen -
     jetzt eine dichte Brokatkrone: 70 Sterne, jeder mit dichtem Glitzerschweif */
  nKugel(Math.round(70*q),7.4*s,(v,i)=>{ kgStern(psBig,p,v,i%3?kgMal(smaragd,1.5):kgMal(mint,1.3),rand(2.5,3.0),1.5,0,0.25);
    rkFunken(p,v,1.5,0.05,2.7,22,[0.6,1.1,0.5],{ps:psMid,life:[0.8,1.4],g:0.8,streu:0.15,mit:0.05,mode:4}); });
  /* Glitzerkern: die Facetten funkeln */
  nKugel(Math.round(45*q),3.0*s,v=>kgStern(psMid,p,v,[1.6,1.45,1.0],rand(1.5,2.1),0.9,4,0.04));
  schall(p,v=>{ sfx.plopp(v*0.45,1); later(0.25,()=>sfx.rieseln(v*0.55,2.4)); });
};
EFF_SCHWEIF.smaragdkrone=0.45; EFF_FAMILIE.smaragdkrone='kugel'; RK_RAUM_EFF.smaragdkrone=1.45;
if(RAKETEN_KL.smaragd) RAKETEN_KL.smaragd.eff=['smaragdkrone'];
SIGNATUR.smaragd={eff:'smaragdkrone',steig:'farbkomet',text:'Smaragdgruene Brokatkrone mit acht hellen Kometenblaettern um einen funkelnden Glitzerkern - geschliffen wie ein Smaragd.'};
