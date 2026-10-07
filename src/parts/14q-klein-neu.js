/* =========================================================
   Kleinfeuerwerk neu (03.10., Tom: "guck dir an, wie das echt
   aussieht, und mach den Effekt komplett neu"):
   - Knallfrosch (froschsprung): gefaltetes Zickzack-Paeckchen, das
     bei jedem Knall sichtbar ueber den Tisch springt
   - Knallbonbon (bonbonriss): Bonbon reisst, Krone, Witzzettel,
     Spielzeug und Konfetti fliegen heraus - jedes Bonbon anders
   - Tischbombe (bombenwurf): echter Inhalt fliegt in alle Richtungen
   - Brummkreisel (feuerkreisel): sichtbare Feuerringe, die sich
     drehen; vier heben ab wie ein Flying Saucer
   - Mini-Podest fuer alle Wunderkerzen (statt der Verpackung)
   Gemeinsam: kqWurf/kqSchritt - feste Koerper mit Schwerkraft,
   Luftbremse (Papier), Abprallen, Liegenbleiben auf Tisch und Boden.
   ========================================================= */

/* ---------- Materialien und Formen (einmal angelegt) ---------- */
/* e: Eigenleuchten als Anteil der Farbe - nachts sonst schwarz */
function kqMat(hex,o){ o=o||{}; const e=o.e===undefined?0.28:o.e, r=o.r===undefined?0.7:o.r, m=o.m||0;
  return klMat('kq'+hex+'_'+e+'_'+r+'_'+m+(o.ds?'d':''),()=>{ const c=LIN(hex);
    return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,emissive:c.clone().multiplyScalar(e),side:o.ds?THREE.DoubleSide:THREE.FrontSide}); }); }
function kqGeo(k,f){ return klMat('kqg_'+k,f); }
function kqM(geo,mat,x,y,z,rx,ry,rz){ const m=new THREE.Mesh(geo,mat); m.position.set(x||0,y||0,z||0); m.rotation.set(rx||0,ry||0,rz||0); m.userData.geoFest=true; return m; }
function kqGruppe(...teile){ const g=new THREE.Group(); teile.forEach(t=>g.add(t)); g.userData.geoFest=true; return g; }
/* Leinwand-Bild als Material (Witzzettel, Huetchen) */
function kqBildMat(k,w,h,draw,o){ o=o||{}; return klMat('kqb_'+k,()=>{ const t=tex(w,h,draw); return new THREE.MeshStandardMaterial({map:t,roughness:0.85,emissive:LIN(0xffffff).multiplyScalar(o.e===undefined?0.22:o.e),emissiveMap:t,side:THREE.DoubleSide}); }); }

/* Tischplatte unter (x,z): Grenzen, oder null (Boden) */
function kqTisch(x,z){
  if(typeof vfAn!=='undefined'&&vfAn&&typeof VF_TISCH!=='undefined'){ const T=VF_TISCH, x0=T.x0-0.36, x1=T.x0+(T.n-1)*T.dx+0.36;
    if(x>=x0&&x<=x1&&Math.abs(z-VF_Z)<=0.45) return {x0,x1,z0:VF_Z-0.45,z1:VF_Z+0.45,y:T.y}; }
  if(Math.abs(x-KL_TI.x)<=KL_TI.hx&&Math.abs(z-KL_TI.z)<=KL_TI.hz) return {x0:KL_TI.x-KL_TI.hx,x1:KL_TI.x+KL_TI.hx,z0:KL_TI.z-KL_TI.hz,z1:KL_TI.z+KL_TI.hz,y:KL_TI.y};
  return null; }

/* ---------------------------------------------------------
   Feste Koerper: fliegen, prallen ab, bleiben liegen
   o: papier (Luftbremse, flattert, sinkt hoechstens sink m/s),
      rest (Abprall 0..1), halb (Hoehe des Ursprungs ueber dem Boden in
      Ruhelage), lagen ([[rx,rz,halb],...] moegliche Ruhelagen),
      w (Drehrate rad/s), start (s Verzug), klang (Tonhoehe beim Aufprall),
      ruhe(k,dt,t) (eigenes Verhalten in Ruhe, z. B. Kreisel)
   --------------------------------------------------------- */
const _kqQ=new THREE.Quaternion(), _kqE=new THREE.Euler(), _kqV=new THREE.Vector3();
function kqWurf(e,g,p,v,o){
  o=o||{}; g.position.set(p.x,p.y,p.z); klMesh(e,g);
  if(o.start>0) g.visible=false;
  const ax=randDir();
  const k=Object.assign({g,v:[v[0],v[1],v[2]],ax:new THREE.Vector3(ax[0],ax[1],ax[2]),w:o.w!==undefined?o.w:rand(6,16),
    rest:o.rest===undefined?0.3:o.rest,halb:o.halb||0.008,hops:0,liegt:null,ph:rand(0,6),sink:o.sink||0.9,luft:o.luft||2.6},o);
  k.v=[v[0],v[1],v[2]]; k.start=o.start||0; k.sc=g.scale.x;
  /* Waende (colliders): nicht durch Mauern und Zaeune fliegen; der Block,
     in dem das Teil startet (Zuendtisch), zaehlt nicht */
  k.ohne=kqBloecke(p.x,p.z);
  (e.kq=e.kq||[]).push(k); return k;
}
function kqBloecke(x,z){ return typeof colliders==='undefined'?[]:colliders.filter(c=>x>=c.minX-0.05&&x<=c.maxX+0.05&&z>=c.minZ-0.05&&z<=c.maxZ+0.05); }
function kqWand(k,g){
  if(typeof colliders==='undefined'||g.position.y>4) return;
  const p=g.position;
  for(const c of colliders){ if(p.x<c.minX-0.03||p.x>c.maxX+0.03||p.z<c.minZ-0.03||p.z>c.maxZ+0.03||k.ohne.includes(c)) continue;
    const a=p.x-(c.minX-0.03), b=(c.maxX+0.03)-p.x, d=p.z-(c.minZ-0.03), f=(c.maxZ+0.03)-p.z, m=Math.min(a,b,d,f);
    if(m===a){ p.x=c.minX-0.03; k.v[0]=-Math.abs(k.v[0])*0.3; } else if(m===b){ p.x=c.maxX+0.03; k.v[0]=Math.abs(k.v[0])*0.3; }
    else if(m===d){ p.z=c.minZ-0.03; k.v[2]=-Math.abs(k.v[2])*0.3; } else { p.z=c.maxZ+0.03; k.v[2]=Math.abs(k.v[2])*0.3; } } }
function kqSchritt(e,dt,t){
  if(!e.kq) return;
  for(const k of e.kq){ const g=k.g;
    if(k.start>0){ k.start-=dt; if(k.start>0) continue; g.visible=true; }
    if(k.liegt===null){
      if(k.papier){ const f=Math.exp(-k.luft*dt); k.v[0]*=f; k.v[2]*=f;
        k.v[1]=k.v[1]>0?k.v[1]*Math.exp(-1.4*dt)-9.8*dt:Math.max(k.v[1]-9.8*dt,-k.sink);
        /* Flattern: im Sinken pendelt das Blatt seitlich */
        if(k.v[1]<0){ g.position.x+=Math.sin(t*2.7+k.ph)*0.32*dt; g.position.z+=Math.cos(t*2.2+k.ph)*0.26*dt; } }
      else { k.v[1]-=9.8*dt; const f=Math.exp(-0.12*dt); k.v[0]*=f; k.v[2]*=f; }
      g.position.x+=k.v[0]*dt; g.position.y+=k.v[1]*dt; g.position.z+=k.v[2]*dt;
      _kqQ.setFromAxisAngle(k.ax,k.w*dt); g.quaternion.premultiply(_kqQ);
      kqWand(k,g);
      const gy=klGrund(g.position.x,g.position.z);
      if(g.position.y<=gy+k.halb&&k.v[1]<0){
        if(!k.papier&&k.hops<3&&-k.v[1]>0.9){ k.hops++; g.position.y=gy+k.halb; k.v[1]=-k.v[1]*k.rest; k.v[0]*=0.55; k.v[2]*=0.55; k.w*=0.5;
          if(k.klang&&k.hops<3) schall(g.position,vv=>sfx.klick(vv*0.3,k.klang*rand(0.85,1.15))); }
        else {
          /* Ruhelage: eine der lagen, Drehung um die Senkrechte bleibt */
          const L=k.lagen?k.lagen[Math.floor(Math.random()*k.lagen.length)]:[0,0,k.halb];
          _kqV.set(1,0,0).applyQuaternion(g.quaternion); const yaw=Math.atan2(-_kqV.z,_kqV.x);
          k.q0=g.quaternion.clone(); k.q1=new THREE.Quaternion().setFromEuler(_kqE.set(L[0],yaw,L[1],'YXZ'));
          k.liegt=t; k.y0=g.position.y; k.y1=gy+L[2]; k.gy=gy; } }
    } else {
      /* hinlegen in 0,15 s, dabei rutscht es noch ein Stueck */
      if(!k.gelegt){ const u=Math.min(1,(t-k.liegt)/0.15);
        g.quaternion.copy(k.q0).slerp(k.q1,u); g.position.y=k.y0+(k.y1-k.y0)*u; if(u>=1) k.gelegt=true; }
      const f=Math.exp(-9*dt); k.v[0]*=f; k.v[2]*=f; g.position.x+=k.v[0]*dt; g.position.z+=k.v[2]*dt;
      if(k.ruhe) k.ruhe(k,dt,t); }
    if(e.t<1) g.scale.setScalar(Math.max(0.001,e.t)*k.sc);
  }
}
/* Zielwurf: Tempo fuer Hoehe h ueber dem Start und Weite d in Richtung a */
function kqTempo(a,d,h){ const vy=Math.sqrt(2*9.8*Math.max(0.02,h)), T=vy/9.8+Math.sqrt(2*Math.max(0.02,h)/9.8); return [Math.cos(a)*d/T,vy,Math.sin(a)*d/T]; }

/* =========================================================
   1. Knallfrosch
   Echt: gruenes Papierroehrchen mit Schwarzpulver, zickzackfoermig zu
   einem Paeckchen von etwa 5 x 2 x 2 cm gefaltet, mit Faden gebunden,
   Zuendschnur am Ende. Jeder Knick ist eine Kammer: sie knallt, das
   Paeckchen springt 10-50 cm in eine zufaellige Richtung, kleines
   Rauchwoelkchen, Funkenspritzer, Papierfetzen. Am Ende liegt der
   verkohlte Rest da und raucht.
   06.10. (Toms PDF: "Die Knallfroesche sind in echt aber gruen"): das
   Paeckchen ist gruen wie im Handel (vorher rot), die Fetzen auch.
   ========================================================= */
const KQ_FR={L:0.07,W:0.026,th:0.0052,n:7};
function kqFroschGeo(){ return kqGeo('frosch',()=>{
  const {L,W,th,n}=KQ_FR, parts=[];
  for(let i=0;i<n;i++){ const y=th/2+i*th;
    /* eine Lage: flachgedruecktes Roehrchen, abwechselnd heller und dunkler (die Falten sind zu sehen) */
    parts.push({geo:new THREE.BoxGeometry(L-th,th*0.8,W),m:tm(0,y,0),color:i%2?0x2a8a30:0x45ad42});
    if(i<n-1){ const sx=i%2?-1:1;
      /* Knick: halbes Roehrchen am Ende, verbindet Lage i und i+1 */
      parts.push({geo:new THREE.CylinderGeometry(th*0.72,th*0.72,W,8,1,false,0,Math.PI),m:tm(sx*(L-th)/2,y+th/2,0,Math.PI/2,0,sx>0?0:Math.PI),color:0x379c3a}); } }
  /* Garn um die Mitte, kleines gelbes Etikett obenauf */
  parts.push({geo:new THREE.BoxGeometry(0.004,n*th+0.003,W+0.003),m:tm(0.006,n*th/2,0),color:0xeee6cc});
  parts.push({geo:new THREE.BoxGeometry(0.022,0.0015,W*0.8),m:tm(-0.014,n*th+0.0005,0),color:0xf2c21b});
  const g=merge(parts); g.translate(0,-n*th/2,0); return g; }); }
klEmit('froschsprung',(e,dt,o,t)=>{
  const S=1.35, H=KQ_FR.n*KQ_FR.th*S;
  if(!e.fr){
    /* er liegt vor dem Karton auf dem Tisch (zum Pult hin) */
    /* 07.10.: ausgepackt liegt er auf dem Platz selbst (14x kfFroschLage) */
    const sf=klFlaeche(o), FL=kfFroschLage(o), x0=FL.x, z0=FL.z;
    const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.8,emissive:new THREE.Color(0.02,0.08,0.025)});
    const body=new THREE.Mesh(kqFroschGeo(),mat); body.userData.geoFest=true; body.userData.matEigen=true;
    const lunte=kqM(kqGeo('froschlunte',()=>{ const g=new THREE.CylinderGeometry(0.0012,0.0012,0.032,5); g.translate(0,0.016,0); return g; }),kqMat(0x8a8a4a,{e:0.3}),KQ_FR.L/2,KQ_FR.n*KQ_FR.th/2-KQ_FR.th,0,0,0,-1.1);
    const grp=kqGruppe(body,lunte); grp.scale.setScalar(S); grp.rotation.y=FL.ry;
    grp.position.set(x0,sf+H/2,z0); klMesh(e,grp);
    const TK=e.takt||[0.4], zeiten=[e.lunte||1.4];
    for(let i=1;i<(e.knalle||10);i++) zeiten.push(zeiten[i-1]+TK[(i-1)%TK.length]*rand(0.85,1.2));
    e.fr={g:grp,body,lunte,mat,v:[0,0,0],w:0,ax:new THREE.Vector3(0,1,0),fliegt:false,liegt:null,zeiten,nr:0,start:{x:x0,z:z0},rest:1,q0:null};
    e.t=zeiten[zeiten.length-1]+4.5;
    schall(grp.position,v=>sfx.zischen(v*0.25,0.4)); }
  const F=e.fr, g=F.g, alt=SCHWEIF, n=F.zeiten.length;
  /* Ende, an dem die naechste Kammer sitzt (Weltort) */
  const ende=sx=>{ _kqV.set(sx*KQ_FR.L*0.5,0,0); return g.localToWorld(_kqV.clone()); };
  /* Zuendschnur brennt herunter: Funkenspritzer wandern zum Paeckchen */
  if(F.nr===0&&t<F.zeiten[0]){ const u=t/F.zeiten[0]; F.lunte.scale.y=Math.max(0.05,1-u);
    g.updateMatrixWorld(true); const q=F.lunte.localToWorld(_kqV.set(0,0.032,0).clone()); SCHWEIF=0.02;
    psSmall.emit(q.x,q.y,q.z,0,0,0,1.4,0.7,0.2,0.05,0,0);
    if(Math.random()<dt*30){ const d=randDir(), s=rand(0.3,0.9); psSmall.emit(q.x,q.y,q.z,d[0]*s,Math.abs(d[1])*s,d[2]*s,1.3,0.7,0.25,rand(0.1,0.25),3,0); }
    if(Math.random()<dt*4){ psMid.emit(q.x,q.y+0.01,q.z,rand(-.02,.02),rand(0.1,0.2),rand(-.02,.02),0.1,0.1,0.11,rand(1,1.6),-0.03,0); klFarbig(psMid); }
    SCHWEIF=alt; }
  /* Knall: Kammer nr explodiert */
  if(F.nr<n&&t>=F.zeiten[F.nr]){ const i=F.nr++, letzt=i===n-1, sx=i%2?-1:1;
    F.lunte.visible=false; g.updateMatrixWorld(true);
    const p=ende(sx), v=distVol(p);
    const knall=(k)=>{ SCHWEIF=0;
      psBig.emit(p.x,p.y,p.z,0,0,0,1.9*k,1.7*k,1.2*k,0.04,0,0); psSmall.emit(p.x,p.y,p.z,0,0,0,2.2,2.1,1.9,0.035,0,0);
      for(let j=0;j<Math.round(14*k);j++){ const d=randDir(), s=rand(1.2,3.2); psSmall.emit(p.x,p.y,p.z,d[0]*s,Math.abs(d[1])*s+0.3,d[2]*s,1.4,0.85,0.35,rand(0.06,0.16),4,0); }
      flash({x:p.x,y:p.y+0.08,z:p.z},FW.bernstein,0.45*k,0.05); SCHWEIF=alt; };
    knall(1); if(letzt&&e.letzter&&e.letzter.doppel) later(0.07,()=>knall(1.3));
    schall(p,vv=>{ sfx.crack(vv*(0.55+Math.random()*0.25)); if(Math.random()<0.5) sfx.snap(vv*0.6); });
    /* Rauchwoelkchen und rote Papierfetzen */
    const Hh=klHell(); rauchball({x:p.x,y:p.y+0.03,z:p.z},{r:rand(0.1,0.16),n:2,dauer:1.8,quellen:0.4,steigen:0.22,c:[0.55*Hh+0.12,0.54*Hh+0.12,0.55*Hh+0.13],a:0.42,wind:[0.06,0.02]});
    /* ein, zwei kleine Papierfetzen (gruen bedruckt, innen grau) */
    for(let j=0;j<Math.round(rand(1,2.6)*QUAL());j++){ const d=randDir(), s=rand(0.8,2); klPapier({x:p.x,y:p.y,z:p.z},[d[0]*s,Math.abs(d[1])*s+0.8,d[2]*s],j%2?[0.3,0.27,0.25]:[0.16,0.52,0.15],{gr:[0.008,0.011],art:'konfetti',dauer:12,flatter:0.25}); }
    bodenrest('fleck',p.x,klGrund(p.x,p.z),p.z,{dauer:12,gr:0.3});
    /* Sprung: Richtung zufaellig, eher weg von der knallenden Seite; auf dem Tisch bleiben */
    const T=kqTisch(g.position.x,g.position.z), d0=rand((e.sprung||[0.12,0.5])[0],(e.sprung||[0.12,0.5])[1])*(letzt?0.7:1);
    let a=0, ok=false;
    _kqV.set(-sx,0,0).applyQuaternion(g.quaternion); const weg=Math.atan2(_kqV.z,_kqV.x);
    for(let tr=0;tr<10&&!ok;tr++){ a=weg+rand(-1.6,1.6)*(tr<5?1:2);
      const lx=g.position.x+Math.cos(a)*d0, lz=g.position.z+Math.sin(a)*d0;
      const D=(P[e.prod]&&P[e.prod].dims)||[0.1,0.1,0.1], imKarton=Math.abs(lx-o.x)<D[0]/2+0.05&&Math.abs(lz-o.z)<D[2]/2+0.05;
      ok=!imKarton&&(T?(lx>T.x0+0.16&&lx<T.x1-0.16&&lz>T.z0+0.14&&lz<T.z1-0.12):Math.hypot(lx-F.start.x,lz-F.start.z)<1.2)&&Math.hypot(lx-F.start.x,lz-F.start.z)<0.75; }
    if(!ok) a=Math.atan2(F.start.z-g.position.z,F.start.x-g.position.x)+rand(-0.5,0.5);
    const h=letzt?((e.letzter&&e.letzter.hoehe)||0.45):rand((e.hoehe||[0.05,0.38])[0],(e.hoehe||[0.05,0.38])[1]);
    const vv=kqTempo(a,d0,h); F.v=vv; F.fliegt=true; F.liegt=null; F.hops=0;
    const ax=randDir(); F.ax.set(ax[0],ax[1]*0.5,ax[2]).normalize(); F.w=rand(9,26)*(Math.random()<0.5?-1:1);
    /* eine Kammer weniger: das Paeckchen wird flacher und dunkler */
    F.rest=(n-1-i)/(n-1);
    F.body.scale.y=0.35+0.65*F.rest;
    const c=0.08*F.rest; F.mat.emissive.setRGB(c*0.25,c,c*0.3); F.mat.color.setRGB(0.25+0.75*F.rest,0.22+0.78*F.rest,0.2+0.8*F.rest); }
  /* Flug und Landung */
  const hb=Math.max(0.006,H*(0.35+0.65*F.rest)/2);
  if(F.fliegt){ F.v[1]-=9.8*dt; g.position.x+=F.v[0]*dt; g.position.y+=F.v[1]*dt; g.position.z+=F.v[2]*dt;
    _kqQ.setFromAxisAngle(F.ax,F.w*dt); g.quaternion.premultiply(_kqQ);
    /* im Flug sprueht die angebrannte Kammer ein paar Funken und eine Rauchspur */
    F.sp=(F.sp||0)+dt*60*QUAL(); SCHWEIF=0.03;
    for(;F.sp>=1;F.sp--){ const q=g.position; psSmall.emit(q.x,q.y,q.z,rand(-.4,.4),rand(-.2,.3),rand(-.4,.4),1.3,0.6,0.15,rand(0.08,0.2),3,0); }
    SCHWEIF=alt;
    if(Math.random()<dt*14){ const q=g.position; psMid.emit(q.x,q.y,q.z,rand(-.03,.03),rand(0.05,0.15),rand(-.03,.03),0.12,0.12,0.13,rand(0.8,1.4),-0.02,0); klFarbig(psMid); }
    const gy=klGrund(g.position.x,g.position.z);
    if(g.position.y<=gy+hb&&F.v[1]<0){ g.position.y=gy+hb;
      if(F.hops<1&&-F.v[1]>1.1){ F.hops++; F.v[1]=-F.v[1]*0.28; F.v[0]*=0.5; F.v[2]*=0.5; F.w*=0.4; schall(g.position,vv=>sfx.klick(vv*0.25,0.6)); }
      else { F.fliegt=false; F.liegt=t; F.q0=g.quaternion.clone();
        /* flach hinlegen (Oberseite oben oder unten), Drehung um die Senkrechte bleibt */
        _kqV.set(1,0,0).applyQuaternion(g.quaternion); const yaw=Math.atan2(-_kqV.z,_kqV.x);
        _kqV.set(0,1,0).applyQuaternion(g.quaternion);
        F.q1=new THREE.Quaternion().setFromEuler(_kqE.set(_kqV.y<0?Math.PI:0,yaw,0,'YXZ'));
        rauchball({x:g.position.x,y:gy+0.02,z:g.position.z},{r:0.08,n:1,dauer:1,steigen:0.06,c:[0.45*klHell()+0.1,0.42*klHell()+0.1,0.38*klHell()+0.1],a:0.3,form:'ring'}); } } }
  else if(F.liegt!==null){ const u=Math.min(1,(t-F.liegt)/0.12); g.quaternion.copy(F.q0).slerp(F.q1,u);
    /* rutscht noch ein Stueck aus */
    const f=Math.exp(-10*dt); F.v[0]*=f; F.v[2]*=f; g.position.x+=F.v[0]*dt; g.position.z+=F.v[2]*dt; g.position.y=klGrund(g.position.x,g.position.z)+hb; }
  /* zwischen den Knallen: Glut an der naechsten Kammer, duenner Rauchfaden */
  if(F.nr>0){ const fertig=F.nr>=n;
    g.updateMatrixWorld(true); const q=ende(F.nr%2?-1:1), aus=fertig?Math.max(0,1-(t-F.zeiten[n-1])/2.2):1;
    SCHWEIF=0; if(aus>0) psSmall.emit(q.x,q.y,q.z,0,0,0,1.2*aus,0.45*aus,0.1*aus,0.05,0,0); SCHWEIF=alt;
    F.rf=(F.rf||0)-dt; if(F.rf<=0&&(!fertig||t-F.zeiten[n-1]<3.2)){ F.rf=fertig?0.16:0.09; const Hh=klHell();
      psMid.emit(q.x,q.y+0.01,q.z,rand(-.02,.02)+0.03,rand(0.12,0.22),rand(-.02,.02),0.09*Hh+0.04,0.09*Hh+0.04,0.095*Hh+0.04,rand(1.2,2),-0.03,0); klFarbig(psMid); } }
  if(e.t<1) g.scale.setScalar(Math.max(0.001,e.t)*S);
});

/* =========================================================
   2. Spielzeug, Papier, Partykram - als 3D-Teile
   Jede Fabrik liefert {g, o} fuer kqWurf: Gruppe in Ruhelage
   ausgerichtet, dazu Physik (papier, lagen, halb, klang).
   Groessen gut 1,3-fach, damit man sie vom Pult aus erkennt.
   ========================================================= */
/* Papierkrone aus Seidenpapier (Knallbonbon): Zacken, offen */
function kqKroneGeo(){ return kqGeo('krone',()=>{
  const n=8, R=0.085, pos=[], idx=[];
  for(let i=0;i<=n*2;i++){ const a=i/(n*2)*Math.PI*2, oben=i%2===0?0.07:0.03;
    pos.push(Math.cos(a)*R,-0.025,Math.sin(a)*R, Math.cos(a)*R,oben-0.025,Math.sin(a)*R); }
  for(let i=0;i<n*2;i++){ const a=i*2; idx.push(a,a+1,a+2, a+1,a+3,a+2); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g; }); }
const KQ_WITZE=[['Was ist gelb und','kann nicht schwimmen?','Ein Bagger.'],['Treffen sich zwei','Raketen. Sagt die','eine: Ich steh auf dich.'],
  ['Warum knallt der','Knallfrosch?','Er ist ein Frosch.'],['Was macht ein Pirat','am Computer?','Er drueckt Enter.']];
const KQ_TEILE={
  krone:(c)=>({g:kqGruppe(kqM(kqKroneGeo(),kqMat(c||0xf2c21b,{ds:true,r:0.85,e:0.35}))),o:{papier:true,sink:0.75,luft:2.2,halb:0.025,lagen:[[0,0,0.025],[1.25,0,0.06]],w:rand(3,7)}}),
  witz:(i)=>{ const W=KQ_WITZE[(i||0)%KQ_WITZE.length];
    const m=kqBildMat('witz'+((i||0)%KQ_WITZE.length),160,80,(g,w,h)=>{ g.fillStyle='#f6f1e4'; g.fillRect(0,0,w,h); g.fillStyle='#c0262a'; g.fillRect(0,0,w,9);
      g.fillStyle='#222'; g.font='bold 13px Arial'; g.textAlign='left'; W.forEach((z,k)=>g.fillText(z,6,27+k*19)); });
    return {g:kqGruppe(kqM(kqGeo('witzzettel',()=>new THREE.PlaneGeometry(0.085,0.043)),m,0,0,0,-Math.PI/2)),o:{papier:true,sink:0.55,luft:3.2,halb:0.002,lagen:[[0,0,0.002]],w:rand(4,9)}}; },
  ring:(c)=>({g:kqGruppe(kqM(kqGeo('ring',()=>new THREE.TorusGeometry(0.017,0.0042,6,18)),kqMat(0xe8c050,{m:0.6,r:0.3,e:0.3}),0,0,0,Math.PI/2),
      kqM(kqGeo('ringstein',()=>new THREE.OctahedronGeometry(0.008)),kqMat(c||0xe0284a,{r:0.2,e:0.55}),0.019,0.004,0)),o:{rest:0.35,halb:0.0045,lagen:[[0,0,0.0045]],klang:1.6}}),
  kreisel:(c)=>{ const k=kqGruppe(kqM(kqGeo('kreiselkoerper',()=>{ const p=[[0.0005,0],[0.012,0.008],[0.022,0.016],[0.022,0.02],[0.012,0.024],[0.0005,0.025]].map(q=>new THREE.Vector2(q[0],q[1])); const g=new THREE.LatheGeometry(p,14); g.translate(0,-0.012,0); return g; }),kqMat(c||0xd8352a,{r:0.35,e:0.35})),
      kqM(kqGeo('kreiselstiel',()=>new THREE.CylinderGeometry(0.0028,0.0028,0.022,6)),kqMat(0xffd23f,{e:0.35}),0,0.022,0),
      kqM(kqGeo('kreiselband',()=>new THREE.TorusGeometry(0.0215,0.0022,4,16)),kqMat(0xf2f5ff,{e:0.35}),0,0.006,0,Math.PI/2));
    return {g:k,o:{rest:0.3,halb:0.012,lagen:[[0,0,0.013]],klang:1.1,ruhe:(q,dt,t)=>{ const lt=t-q.liegt;
      /* der Kreisel tanzt noch zwei Sekunden auf der Spitze, dann kippt er */
      if(lt<2.2){ q.g.rotateY(dt*(34-lt*10)); q.g.rotation.x=0.07*Math.sin(t*11); q.g.rotation.z=0.07*Math.cos(t*11); }
      else if(lt<2.5) q.g.rotation.x=Math.min(1.15,(lt-2.2)/0.3*1.15); }}}; },
  pfeife:(c)=>({g:kqGruppe(kqM(kqGeo('pfeife',()=>{ const g=new THREE.CylinderGeometry(0.009,0.009,0.032,10); g.rotateZ(Math.PI/2); return g; }),kqMat(c||0x2f7fd0,{r:0.35,e:0.35})),
      kqM(kqGeo('pfeifmund',()=>new THREE.BoxGeometry(0.03,0.007,0.011)),kqMat(c||0x2f7fd0,{r:0.35,e:0.35}),0.026,0.002,0),
      kqM(kqGeo('pfeifloch',()=>new THREE.BoxGeometry(0.008,0.002,0.008)),kqMat(0x111111,{e:0}),-0.002,0.0091,0)),o:{rest:0.35,halb:0.009,lagen:[[0,0,0.009]],klang:1.4}}),
  ente:()=>({g:kqGruppe(kqM(kqGeo('entekoerper',()=>{ const g=new THREE.SphereGeometry(0.02,12,9); g.scale(1.25,0.85,1); return g; }),kqMat(0xffd21f,{r:0.4,e:0.38})),
      kqM(kqGeo('entekopf',()=>new THREE.SphereGeometry(0.012,10,8)),kqMat(0xffd21f,{r:0.4,e:0.38}),0.016,0.02,0),
      kqM(kqGeo('entenschnabel',()=>{ const g=new THREE.ConeGeometry(0.005,0.012,8); g.rotateZ(-Math.PI/2); return g; }),kqMat(0xff7a1a,{e:0.4}),0.031,0.018,0),
      kqM(kqGeo('enteauge',()=>new THREE.SphereGeometry(0.0022,6,4)),kqMat(0x111111,{e:0}),0.024,0.025,0.008)),o:{rest:0.45,halb:0.017,lagen:[[0,0,0.017]],klang:0.8}}),
  bart:()=>({g:kqGruppe(kqM(kqGeo('bart',()=>{ const s=new THREE.Shape(); s.moveTo(0,0.004);
      s.bezierCurveTo(0.012,0.014,0.03,0.012,0.04,-0.004); s.bezierCurveTo(0.03,0.004,0.015,-0.002,0,-0.004);
      s.bezierCurveTo(-0.015,-0.002,-0.03,0.004,-0.04,-0.004); s.bezierCurveTo(-0.03,0.012,-0.012,0.014,0,0.004);
      const g=new THREE.ShapeGeometry(s,6); g.rotateX(-Math.PI/2); return g; }),kqMat(0x1a1410,{ds:true,e:0.12,r:0.9}))),o:{papier:true,sink:1.3,luft:2,halb:0.002,lagen:[[0,0,0.002]],w:rand(5,10)}}),
  jojo:(c)=>({g:kqGruppe(kqM(kqGeo('jojo',()=>{ const g=new THREE.CylinderGeometry(0.018,0.018,0.008,14); g.translate(0,0.0065,0); return g; }),kqMat(c||0x2f9e57,{r:0.3,e:0.35})),
      kqM(kqGeo('jojo2',()=>{ const g=new THREE.CylinderGeometry(0.018,0.018,0.008,14); g.translate(0,-0.0065,0); return g; }),kqMat(c||0x2f9e57,{r:0.3,e:0.35})),
      kqM(kqGeo('jojoachse',()=>new THREE.CylinderGeometry(0.004,0.004,0.006,8)),kqMat(0xf2f5ff,{e:0.3}))),o:{rest:0.4,halb:0.0105,lagen:[[0,0,0.0105],[Math.PI/2,0,0.018]],klang:1.2}}),
  wuerfel:(c)=>({g:kqGruppe(kqM(kqGeo('wuerfel',()=>new THREE.BoxGeometry(0.026,0.026,0.026)),kqMat(c||0xff5aa8,{r:0.3,e:0.35})),
      ...[[0,0.0131,0],[0.0131,0.005,0.005],[0.0131,-0.005,-0.005],[0,0,0.0131]].map(q=>kqM(kqGeo('auge',()=>new THREE.SphereGeometry(0.0028,5,4)),kqMat(0xffffff,{e:0.5}),q[0],q[1],q[2]))),o:{rest:0.3,halb:0.013,lagen:[[0,0,0.013],[Math.PI/2,0,0.013],[0,Math.PI/2,0.013]],klang:1.0}}),
  /* Tischbombe: Papierhuetchen (Kegel mit Streifen und Bommel) */
  huetchen:(i)=>{ const F=[['#d8322a','#ffd23f'],['#2f7fd0','#f2f5ff'],['#2f9e57','#ff5aa8'],['#9b3bd6','#ffd23f']][(i||0)%4];
    const m=kqBildMat('huet'+((i||0)%4),64,64,(g,w,h)=>{ g.fillStyle=F[0]; g.fillRect(0,0,w,h); g.fillStyle=F[1]; for(let k=0;k<6;k++){ g.save(); g.translate(k*w/6,0); g.transform(1,0,0.6,1,0,0); g.fillRect(0,0,w/14,h); g.restore(); }
      g.fillStyle='rgba(255,255,255,.8)'; for(let k=0;k<10;k++) g.fillRect((k*23)%w,(k*37)%h,2,2); },{e:0.3});
    return {g:kqGruppe(kqM(kqGeo('huetkegel',()=>new THREE.ConeGeometry(0.038,0.095,16,1,true)),m),
      kqM(kqGeo('bommel',()=>new THREE.SphereGeometry(0.009,8,6)),kqMat(i%2?0xffd23f:0xf2f5ff,{e:0.4,r:0.95}),0,0.05,0)),
      o:{papier:true,sink:1.8,luft:1.3,halb:0.03,lagen:[[Math.PI/2-0.38,0,0.03],[0,0,0.0475]],w:rand(5,12)}}; },
  /* Luftruessel: aufgerollter Papierschlauch mit Mundstueck und Feder */
  ruessel:(c)=>({g:kqGruppe(kqM(kqGeo('ruesselrolle',()=>{ const pk=[]; for(let i=0;i<=60;i++){ const a=i/60*Math.PI*2*2.6, r=0.006+0.017*i/60; pk.push(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r)); }
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pk),60,0.0042,5,false); }),kqMat(c||0xff5aa8,{r:0.8,e:0.35})),
      kqM(kqGeo('ruesselmund',()=>{ const g=new THREE.CylinderGeometry(0.0045,0.0035,0.034,8); g.rotateZ(Math.PI/2); return g; }),kqMat(0xf2f5ff,{e:0.35,r:0.4}),0.034,0,0.004),
      kqM(kqGeo('ruesselfeder',()=>{ const g=new THREE.ConeGeometry(0.006,0.03,6); g.rotateZ(Math.PI/2); return g; }),kqMat(0xffd23f,{e:0.4,r:1}),-0.004,0.002,0)),
    o:{papier:true,sink:2.2,luft:1.1,halb:0.0045,lagen:[[0,0,0.0045]],w:rand(6,14)}}),
  /* Troete: Trichter aus Goldpapier mit Mundstueck */
  troete:(c)=>({g:kqGruppe(kqM(kqGeo('troete',()=>{ const p=[[0.004,0],[0.0045,0.03],[0.007,0.06],[0.013,0.085],[0.024,0.1],[0.0235,0.102]].map(q=>new THREE.Vector2(q[0],q[1])); const g=new THREE.LatheGeometry(p,14); g.translate(0,-0.05,0); g.rotateZ(Math.PI/2); return g; }),kqMat(c||0xe8c050,{m:0.55,r:0.3,e:0.3,ds:true})),
      kqM(kqGeo('troetmund',()=>{ const g=new THREE.CylinderGeometry(0.005,0.005,0.012,8); g.rotateZ(Math.PI/2); return g; }),kqMat(0xd8352a,{e:0.35}),0.055,0,0)),
    o:{rest:0.25,halb:0.012,lagen:[[0,0,0.014]],w:rand(6,14),klang:0.9,sink:4}}),
  /* Augenmaske mit Glitzer */
  maske:(c)=>({g:kqGruppe(kqM(kqGeo('maske',()=>{ const s=new THREE.Shape(); s.moveTo(-0.055,0.012); s.bezierCurveTo(-0.04,0.03,-0.01,0.026,0,0.016); s.bezierCurveTo(0.01,0.026,0.04,0.03,0.055,0.012);
        s.bezierCurveTo(0.058,-0.012,0.03,-0.026,0.012,-0.012); s.bezierCurveTo(0.006,-0.006,-0.006,-0.006,-0.012,-0.012); s.bezierCurveTo(-0.03,-0.026,-0.058,-0.012,-0.055,0.012);
        for(const sx of [-1,1]){ const h=new THREE.Path(); h.absellipse(sx*0.027,0.004,0.013,0.008,0,Math.PI*2,true); s.holes.push(h); }
        const g=new THREE.ShapeGeometry(s,8); g.rotateX(-Math.PI/2); return g; }),kqMat(c||0x9b3bd6,{ds:true,m:0.5,r:0.35,e:0.35}))),
    o:{papier:true,sink:1.5,luft:1.8,halb:0.002,lagen:[[0,0,0.002],[Math.PI,0,0.002]],w:rand(5,11)}}),
  /* Pappnase: rote Schaumstoffkugel, springt */
  nase:()=>({g:kqGruppe(kqM(kqGeo('nase',()=>{ const g=new THREE.SphereGeometry(0.02,12,9); g.scale(1,0.92,1); return g; }),kqMat(0xe0141a,{r:0.6,e:0.38}))),o:{rest:0.55,halb:0.018,lagen:[[0,0,0.018]],klang:0.5}})
};
/* Konfettistoss in eine Richtung (d), n Schnipsel */
function kqKonfetti(p,d,st,n,s0,s1,dauer){ const F=KL_BUNT.map(c=>klF(c)); n=Math.round(n*QUAL());
  for(let i=0;i<n;i++){ const q=streu(d,st*Math.sqrt(Math.random())), s=rand(s0,s1); klPapier(p,[q[0]*s,q[1]*s,q[2]*s],F[i%F.length],{gr:[0.013,0.018],art:'konfetti',dauer:dauer||20,flatter:0.4}); } }

/* =========================================================
   3. Knallbonbon
   Echt (Christmas Cracker): 25-30 cm Pappe in Glanzpapier, die Enden
   abgebunden. Zwei ziehen, der Reissstreifen knackt, das Bonbon reisst
   in der Mitte, und heraus fallen Papierkrone, Witzzettel und ein
   kleines Spielzeug. Hier: vier Bonbons liegen vor dem Karton, jedes
   wird gezogen und reisst; jedes hat anderen Inhalt.
   ========================================================= */
function kqBonbonGeo(){ return kqGeo('bonbonhaelfte',()=>{
  /* halbes Bonbon als Drehkoerper: Mitte (y=0) bis Ende (y=0,13), abgebundener Hals, Fransen */
  const p=[[0.021,0],[0.021,0.07],[0.019,0.077],[0.0085,0.088],[0.008,0.095],[0.013,0.103],[0.017,0.124],[0.0185,0.13]].map(q=>new THREE.Vector2(q[0],q[1]));
  const g=new THREE.LatheGeometry(p,14); g.rotateZ(-Math.PI/2); return g; }); }
const KQ_BONBON=[
  {farbe:0xd4a62a,band:0xd8352a,inhalt:[['krone',0xf2c21b],['witz',0],['ring',0xe0284a],['ente']],konfetti:40},
  {farbe:0xc0262a,band:0xf2f5ff,inhalt:[['krone',0xd8352a],['witz',1],['kreisel',0x2f7fd0],['pfeife',0xffd23f]],schlangen:2},
  {farbe:0x2a5fb8,band:0xe8c050,inhalt:[['krone',0xc8ccd4],['witz',2],['bart'],['jojo',0xd8352a]],konfetti:40},
  {farbe:0x2f8a4a,band:0xf2c21b,inhalt:[['krone',0x2f9e57],['witz',3],['wuerfel',0xff5aa8],['ring',0x2f7fd0],['pfeife',0xd8352a]],konfetti:30}];
klEmit('bonbonriss',(e,dt,o,t)=>{
  if(!e.bb){ const sf=klFlaeche(o), D=(P[e.prod]&&P[e.prod].dims)||[0.22,0.07,0.1], Z=e.zeiten||[0.5,3,5.5,8];
    /* die Bonbons liegen in zwei Reihen vor dem Karton, leicht schraeg */
    const plaetze=[[-0.17,0.1],[0.17,0.13],[-0.15,0.27],[0.18,0.3]];
    /* 07.10.: ausgepackt liegen sie auf dem Platz selbst (14x kfBonbonLage) */
    e.bb=KQ_BONBON.map((B,i)=>{ const BL=kfBonbonLage(o,i), x=BL.x, z=BL.z, ry=BL.ry;
      const mat=kqMat(B.farbe,{m:0.45,r:0.32,e:0.3}), band=kqMat(B.band,{e:0.35,m:0.3,r:0.4});
      const haelften=[-1,1].map(sg=>{ const h=kqGruppe(kqM(kqBonbonGeo(),mat,0,0,0,0,sg<0?Math.PI:0,0),kqM(kqGeo('bonbonband',()=>{ const g=new THREE.TorusGeometry(0.0212,0.0028,4,16); g.rotateY(Math.PI/2); return g; }),band,sg*0.035,0,0));
        h.position.set(x,sf+0.021,z); h.rotation.y=ry; klMesh(e,h); return {g:h,sg}; });
      return {x,z,ry,sf,haelften,start:Z[i%Z.length],B,an:false}; });
    e.t=(e.liegen||16)+0.3; }
  for(const b of e.bb){ const lt=t-b.start; if(lt<0) continue;
    const cx=Math.cos(b.ry), cz=-Math.sin(b.ry);
    if(lt<0.45){ /* ziehen: die Haelften werden auseinandergezogen, das Bonbon zittert */
      const u=lt/0.45, w=0.012*u+0.002*Math.sin(lt*70);
      b.haelften.forEach(h=>{ h.g.position.set(b.x+cx*h.sg*w,b.sf+0.021,b.z+cz*h.sg*w); h.g.rotation.z=h.sg*0.04*u; }); continue; }
    if(!b.an){ b.an=true;
      const p={x:b.x,y:b.sf+0.03,z:b.z}, alt=SCHWEIF; SCHWEIF=0;
      psBig.emit(p.x,p.y,p.z,0,0,0,1.3,1.2,0.95,0.04,0,0);
      for(let j=0;j<10;j++){ const d=randDir(), s=rand(1,2.4); psSmall.emit(p.x,p.y,p.z,d[0]*s,Math.abs(d[1])*s,d[2]*s,1.3,1.1,0.7,rand(0.05,0.12),3,0); }
      SCHWEIF=alt; flash({x:p.x,y:p.y+0.15,z:p.z},FW.weiss,0.45,0.05);
      rauchball({x:p.x,y:p.y+0.02,z:p.z},{r:0.12,n:2,dauer:1.6,quellen:0.4,steigen:0.15,c:[0.62*klHell()+0.12,0.62*klHell()+0.12,0.64*klHell()+0.12],a:0.32});
      schall(p,v=>{ sfx.snap(v*1.0); sfx.crack(v*0.45); });
      /* die Haelften fliegen auseinander und bleiben liegen */
      b.haelften.forEach(h=>{ const s=rand(0.7,1.1); kqWurf(e,h.g,{x:h.g.position.x,y:h.g.position.y,z:h.g.position.z},[cx*h.sg*s+rand(-.2,.2),rand(0.5,1),cz*h.sg*s+rand(-.2,.2)],{w:rand(2,6),rest:0.2,halb:0.021,lagen:[[0,0,0.021]],klang:0.7});
        h.g.children.forEach(c=>c.userData.geoFest=true); e.meshes.splice(e.meshes.indexOf(h.g),1); });
      /* Inhalt: Krone hoch hinaus, Zettel trudelt, Spielzeug im Bogen */
      b.B.inhalt.forEach(([art,arg],j)=>{ const T=KQ_TEILE[art](arg), seite=j%2?1:-1;
        const a=Math.atan2(cz,cx)+(seite>0?0:Math.PI)+rand(-0.9,0.9);
        const papier=T.o.papier, h=art==='krone'?rand(0.9,1.5):papier?rand(0.4,0.9):rand(0.25,0.7), d=art==='krone'?rand(0.15,0.45):rand(0.25,0.8);
        T.g.rotation.set(rand(0,6),rand(0,6),rand(0,6));
        kqWurf(e,T.g,{x:p.x,y:p.y+0.01,z:p.z},kqTempo(a,d,h),T.o); });
      if(b.B.konfetti) kqKonfetti({x:p.x,y:p.y+0.01,z:p.z},[0,1,0],0.9,b.B.konfetti,1.2,2.6,20);
      if(b.B.schlangen) emitters.push({t:9,k:'luftschlange',o:{x:p.x,y:p.y,z:p.z},still:true,n:b.B.schlangen,laenge:[0.5,0.9],steig:[2.2,3.2],neig:[0.4,0.9],locken:[3,5],schwing:0.3,liegen:Math.max(2,e.t-t),prod:e.prod}); }
  }
  /* die Haelften stecken in e.kq (kqWurf), die Haelften-Gruppen vor dem Reissen in e.meshes */
  kqSchritt(e,dt,t);
  if(e.t<1) for(const b of e.bb) if(!b.an) b.haelften.forEach(h=>h.g.scale.setScalar(Math.max(0.001,e.t)));
});

/* =========================================================
   4. Tischbombe
   Echt: Pappzylinder mit Deckel und Zuendschnur. Dumpfer Knall, der
   Deckel fliegt weg, und der Inhalt schiesst nach oben und in alle
   Richtungen: Papierhuetchen, Luftruessel, Troeten, Masken, Pappnasen,
   kleines Spielzeug, Konfetti und Luftschlangen - verschieden weit und
   hoch, je nach Gewicht. Alles bleibt auf Tisch und Boden liegen.
   ========================================================= */
const KQ_BOMBE=[['huetchen',0],['huetchen',1],['huetchen',2],['ruessel',0xff5aa8],['ruessel',0x5ce1ff],['ruessel',0xffd23f],
  ['troete',0xe8c050],['troete',0xc8ccd4],['maske',0x9b3bd6],['maske',0xd4a62a],['nase'],['nase'],
  ['kreisel',0x2f9e57],['pfeife',0xd8352a],['ring',0x2f7fd0],['ente'],['bart'],['wuerfel',0x5ce1ff]];
klEmit('bombenwurf',(e,dt,o,t)=>{
  if(!e.los){ e.los=1; const sf=klFlaeche(o), D=(P[e.prod]&&P[e.prod].dims)||[0.12,0.16,0.12], p={x:o.x,y:Math.max(o.y,sf+D[1]),z:o.z};
    /* Deckel fliegt senkrecht hoch und taumelt herunter */
    const deckel=kqGruppe(kqM(kqGeo('bombendeckel',()=>new THREE.CylinderGeometry(1,1,0.012,18)),kqMat(0x1557a8,{e:0.3,r:0.7})));
    deckel.children[0].scale.set(D[0]/2+0.003,1,D[0]/2+0.003);
    kqWurf(e,deckel,{x:p.x,y:p.y+0.01,z:p.z},[rand(-0.5,0.5),rand(5,6.5),rand(-0.5,0.5)],{w:rand(8,14),rest:0.2,halb:0.006,lagen:[[0,0,0.006],[Math.PI,0,0.006]],klang:0.6});
    /* Inhalt: gleichmaessig ueber alle Richtungen verteilt (Azimut mit Versatz), Steigung 35-82 Grad,
       Tempo nach Gewicht - Papier fliegt hoch und wird gebremst, Spielzeug fliegt weit */
    const n=KQ_BOMBE.length, a0=rand(0,6.283);
    KQ_BOMBE.forEach(([art,arg],i)=>{ const T=KQ_TEILE[art](arg), az=a0+i/n*Math.PI*2*2.618+rand(-0.25,0.25), el=rand(42,84)*Math.PI/180;
      /* echte Tischbomben werfen 0,5 bis 2 m weit: das meiste landet auf dem Tisch, einiges daneben */
      const sp=T.o.papier?rand(3.2,5.6):rand(1.8,3.9), v=[Math.cos(az)*Math.cos(el)*sp,Math.sin(el)*sp,Math.sin(az)*Math.cos(el)*sp];
      T.g.rotation.set(rand(0,6),rand(0,6),rand(0,6)); T.o.start=rand(0,0.06);
      kqWurf(e,T.g,{x:p.x+Math.cos(az)*0.02,y:p.y+0.02,z:p.z+Math.sin(az)*0.02},v,T.o); });
    /* Konfetti nach allen Seiten, Papierfetzen der Abdeckung */
    kqKonfetti({x:p.x,y:p.y+0.02,z:p.z},[0,1,0],1.25,260,2.5,7.5,(e.rest&&e.rest.t)||20);
    for(let j=0;j<Math.round(8*QUAL());j++){ const d=streu([0,1,0],1), s=rand(2,4); klPapier({x:p.x,y:p.y,z:p.z},[d[0]*s,d[1]*s,d[2]*s],[0.12,0.34,0.66],{gr:[0.02,0.026],art:'papier',dauer:15}); }
    /* dumpfer Knall, Blitz, Rauchpilz aus der Roehre */
    const alt=SCHWEIF; SCHWEIF=0; psHuge.emit(p.x,p.y+0.05,p.z,0,0,0,0.8,0.7,0.5,0.06,0,0); psBig.emit(p.x,p.y+0.04,p.z,0,0,0,1.6,1.4,1.0,0.05,0,0);
    for(let j=0;j<18;j++){ const d=streu([0,1,0],0.8), s=rand(1.5,3.5); psSmall.emit(p.x,p.y,p.z,d[0]*s,d[1]*s,d[2]*s,1.3,1.0,0.55,rand(0.08,0.2),3,0); } SCHWEIF=alt;
    const Hh=klHell(); rauchball({x:p.x,y:p.y+0.12,z:p.z},{r:0.32,n:4,dauer:2.6,quellen:0.5,steigen:0.35,c:[0.62*Hh+0.12,0.61*Hh+0.12,0.63*Hh+0.13],a:0.4,wind:[0.08,0.02]});
    rauchball({x:p.x,y:p.y,z:p.z},{r:0.25,n:3,dauer:1.6,steigen:0.05,c:[0.5*Hh+0.1,0.5*Hh+0.1,0.52*Hh+0.1],a:0.3,form:'ring'});
    flash({x:p.x,y:p.y+0.3,z:p.z},FW.gold,0.9,0.1);
    schall(p,v=>{ sfx.thump(v*0.9); sfx.plopp(v*1.4,0.6); sfx.crack(v*0.35); });
    e.t=e.liegen||15; }
  kqSchritt(e,dt,t);
});

/* =========================================================
   5. Brummkreisel (Feuerkreisel)
   Echt (Bodenkreisel, "Flying Saucer", "Bienchen"): eine Papphuelse
   mit Duese am Rand dreht sich mit 10-20 U/s; die Duese zieht einen
   geschlossenen Feuerring (das Auge sieht die Bahn als Kreis), Funken
   fliegen tangential weg und bilden eine Spirale. Der Ton brummt und
   surrt mit der Drehzahl. Fliegende Kreisel heben ab, steigen 1-2 m, wechseln die
   Farbe, knistern aus und fallen als leere Huelse herunter.
   ========================================================= */
/* Feuerringe: eine Linienschar je Emitter (klWeg raeumt sie mit weg) */
const KQ_RINGMAX=6*5*36;
function kqRingMesh(e){
  const M=KQ_RINGMAX, g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(M*6),3)); g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(M*6),3)); g.setDrawRange(0,0);
  const m=new THREE.LineSegments(g,klMat('kqring',()=>new THREE.LineBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false})));
  m.frustumCulled=false; m.renderOrder=3; return klMesh(e,m); }
function kqKreiselGeo(){ return kqGeo('feuerkreisel',()=>{
  /* Scheibe aus sechs Farbsegmenten, Huelse in der Mitte, Duese am Rand */
  const parts=[];
  for(let k=0;k<6;k++) parts.push({geo:new THREE.CylinderGeometry(0.03,0.03,0.005,4,1,false,k/6*Math.PI*2,Math.PI/3),m:tm(0,0,0),color:k%2?0xd8352a:0xffd23f});
  parts.push({geo:new THREE.CylinderGeometry(0.009,0.009,0.03,10),m:tm(0,0.004,0),color:0x2f7fd0});
  parts.push({geo:new THREE.CylinderGeometry(0.0045,0.0045,0.018,6),m:tm(0.028,0.002,0,Math.PI/2,0,0),color:0x333333});
  return merge(parts); }); }
klEmit('feuerkreisel',(e,dt,o,t)=>{
  if(!e.kr){ const sf=klFlaeche(o), D=(P[e.prod]&&P[e.prod].dims)||[0.16,0.06,0.1], FF=e.farbFolge||[['gold','rot']];
    /* Zuendfolge unregelmaessig; Boden-Brummer (flug 0) und Flieger (Hoehe m) im Wechsel */
    const plan=[{at:0,boden:1.6,flug:1.25},{at:0.9,boden:4.2,flug:0},{at:1.7,boden:1.3,flug:1.85},{at:2.9,boden:1.8,flug:1.05},{at:3.6,boden:3.8,flug:0},{at:4.7,boden:1.4,flug:1.6}];
    const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.5,emissive:new THREE.Color(0.12,0.12,0.12)});
    /* 07.10.: die Kreisel liegen ausgepackt auf dem Platz (14x kfKreiselLage) */
    e.kr=plan.map((q,i)=>{ const KL=kfKreiselLage(o,i), x=KL.x, z=KL.z;
      const m=new THREE.Mesh(kqKreiselGeo(),mat); m.userData.geoFest=true; if(i===0) m.userData.matEigen=true;
      const g=kqGruppe(m); g.position.set(x,sf+0.004,z); klMesh(e,g);
      return Object.assign({g,x,z,y:sf+0.004,sf,w:rand(0,6),rev:0,C:FF[i%FF.length].map(c=>klF(c)),z2:{},ph:rand(0,6),dx:rand(-1,1),dz:rand(-1,1),kipp:rand(0.35,0.55),aus:false},q); });
    e.t=Math.max(...e.kr.map(k=>k.at+k.boden+(k.flug?3.6:1.2)))+2; }
  const M=e.ring||(e.ring=kqRingMesh(e)), A=M.geometry.attributes, AP=A.position.array, AC=A.color.array, q=QUAL(), alt=SCHWEIF;
  let s=0, lx=0, lz=0, ly=0, ln=0; const lc=[0,0,0];
  for(const k of e.kr){ const lt=t-k.at; if(lt<0) continue;
    const TB=k.boden, TF=k.flug?2.0:0, T=TB+TF;
    if(lt>=T){
      if(!k.aus){ k.aus=true; if(k.ton){ k.ton.stop(); k.ton=null; }
        /* Schluss: Knisterkranz, dann ist der Satz leer */
        for(let j=0;j<Math.round(10*q);j++){ const a=Math.random()*6.283; knisterPop(k.g.position.x+Math.cos(a)*0.05,k.g.position.y+rand(-0.02,0.04),k.g.position.z+Math.sin(a)*0.05,{c:FW.silber,laut:0.45}); }
        const vy=k.flug?rand(-0.2,0.4):rand(0.8,1.2);
        /* leere Huelse: faellt (Flieger) oder kippt um (Brummer) und bleibt liegen */
        kqWurf(e,k.g,{x:k.g.position.x,y:k.g.position.y,z:k.g.position.z},[rand(-0.4,0.4),vy,rand(-0.4,0.4)],{w:rand(4,10),rest:0.25,halb:0.003,lagen:[[0,0,0.003],[Math.PI,0,0.003]],klang:0.9});
        e.meshes.splice(e.meshes.indexOf(k.g),1); }
      continue; }
    /* Drehzahl: schnell hoch auf 12 U/s, im Flug bis 18 */
    k.rev=lt<TB?Math.min(12,3+lt*14):12+6*Math.min(1,(lt-TB)/0.8);
    k.w+=2*Math.PI*k.rev*dt;
    /* Ort: am Boden schlingert er ein paar Zentimeter, im Flug steigt er (abklingend) und treibt ab */
    let x=k.x, y=k.y, z=k.z, tilt=0.05;
    if(lt<TB){ const wd=Math.min(1,lt/0.6)*0.05; x+=Math.sin(lt*1.7+k.ph)*wd*k.dx; z+=Math.cos(lt*1.3+k.ph)*wd*0.7*k.dz; }
    else { const u=(lt-TB)/TF, hu=1-Math.pow(1-Math.min(1,u*1.25),2.2);
      y+=k.flug*hu; x+=k.dx*0.35*u; z+=k.dz*0.25*u; tilt=k.kipp*Math.min(1,u*2); }
    k.g.position.set(x,y,z);
    /* Scheibe dreht sich sichtbar und taumelt im Flug */
    const pa=lt*2.3+k.ph, nx=Math.sin(tilt)*Math.cos(pa), nz=Math.sin(tilt)*Math.sin(pa);
    k.g.rotation.set(nz*1.0,k.w,-nx*1.0);
    /* Farbe: Wechsel nach der halben Bodenzeit (Brummer) bzw. beim Abheben (Flieger) */
    const C=(k.flug?lt>=TB+0.6:lt>=TB*0.5)?k.C[1]:k.C[0];
    /* Feuerring: die Duese laeuft auf Radius R um; das Auge sieht die
       Bahn der letzten 1/14 s als Bogen (bei 12 U/s fast ein Kreis) */
    /* sichtbarer Ring 12-20 cm: die Funken laufen nach dem Austritt noch ein Stueck auf der Bahn mit */
    const R=lt<TB?0.06+0.035*Math.min(1,lt/0.8):0.095+0.01*Math.min(1,(lt-TB)/0.5), bogen=Math.min(Math.PI*2*0.97,2*Math.PI*k.rev/14), NS=36;
    /* Ringebene: senkrecht zur gekippten Achse */
    const ax=[nx,Math.cos(tilt),nz], e1=[1,0,0], d1=e1[0]*ax[0]+e1[1]*ax[1]+e1[2]*ax[2];
    let u1=[e1[0]-d1*ax[0],e1[1]-d1*ax[1],e1[2]-d1*ax[2]]; const l1=Math.hypot(u1[0],u1[1],u1[2])||1; u1=[u1[0]/l1,u1[1]/l1,u1[2]/l1];
    const u2=[ax[1]*u1[2]-ax[2]*u1[1],ax[2]*u1[0]-ax[0]*u1[2],ax[0]*u1[1]-ax[1]*u1[0]];
    const ort=(a,r)=>[x+(u1[0]*Math.cos(a)+u2[0]*Math.sin(a))*r,y+0.004+(u1[1]*Math.cos(a)+u2[1]*Math.sin(a))*r,z+(u1[2]*Math.cos(a)+u2[2]*Math.sin(a))*r];
    for(let b=0;b<5;b++){ const rr=R+(b-2)*0.004, hb=b===2?1.7:b===1||b===3?1.0:0.5;
      for(let j=0;j<NS&&s<KQ_RINGMAX;j++){ const a0=k.w-bogen*j/NS, a1=k.w-bogen*(j+1)/NS, P0=ort(a0,rr), P1=ort(a1,rr), f0=Math.pow(1-j/NS,1.3)*hb, f1=Math.pow(1-(j+1)/NS,1.3)*hb;
        const o6=s*6, w0=j<3?0.6:0; /* Kopf weisslich */
        AP[o6]=P0[0]; AP[o6+1]=P0[1]; AP[o6+2]=P0[2]; AP[o6+3]=P1[0]; AP[o6+4]=P1[1]; AP[o6+5]=P1[2];
        AC[o6]=(C[0]+w0)*f0; AC[o6+1]=(C[1]+w0)*f0; AC[o6+2]=(C[2]+w0)*f0; AC[o6+3]=C[0]*f1; AC[o6+4]=C[1]*f1; AC[o6+5]=C[2]*f1; s++; } }
    /* Duesenkopf und Lichthof */
    const H0=ort(k.w,R); SCHWEIF=0;
    psSmall.emit(H0[0],H0[1],H0[2],0,0,0,1.8,1.7,1.5,0.04,0,0);
    /* Leuchtkoerner auf dem Bogen: der Ring hat Dicke */
    for(let j=0;j<5;j++){ const a=k.w-bogen*Math.random()*0.8, Q=ort(a,R+rand(-0.006,0.006)), f=0.9; psSmall.emit(Q[0],Q[1],Q[2],0,0,0,C[0]*f,C[1]*f,C[2]*f,0.034,0,0); }
    psMid.emit(x,y+0.004,z,0,0,0,C[0]*0.35,C[1]*0.35,C[2]*0.35,0.05,0,0); klFarbig(psMid);
    /* tangentiale Spiralfunken: verlassen die Duese mit der Umfangsgeschwindigkeit */
    k.z2.f=(k.z2.f||0)+dt*260*q; const vU=2*Math.PI*k.rev*R;
    for(;k.z2.f>=1;k.z2.f--){ const a=k.w-Math.random()*bogen*0.3, P0=ort(a,R), ta=[-(u1[0]*Math.sin(a))+u2[0]*Math.cos(a),-(u1[1]*Math.sin(a))+u2[1]*Math.cos(a),-(u1[2]*Math.sin(a))+u2[2]*Math.cos(a)];
      const ra=[(P0[0]-x)/R,(P0[1]-y-0.004)/R,(P0[2]-z)/R], sp=vU*rand(0.45,0.8)+rand(0.2,0.6), out=rand(0.3,0.9);
      klFunke(P0[0],P0[1],P0[2],ta[0]*sp+ra[0]*out,ta[1]*sp+ra[1]*out+rand(0,0.2)+(lt>=TB?-0.5:0),ta[2]*sp+ra[2]*out,C,rand(0.08,0.18),2,Math.random()<0.2?2:0,0.14); }
    SCHWEIF=alt;
    lx+=x; ly+=y; lz+=z; ln++; lc[0]+=C[0]; lc[1]+=C[1]; lc[2]+=C[2];
    /* Ton: tiefes Brummen, das mit der Drehzahl leicht steigt und im Flug
       zum Surren wird (03.10., Tom: keine Pfeif- oder Heultoene) */
    if(!k.ton){ k.ton=klTon(e,sfx.brummen(distVol(o)*0.5,80,T+0.3)); k.tt=0; }
    k.tt-=dt; if(k.tt<=0){ k.tt=0.08; const f=lt<TB?70+k.rev*6:150+(lt-TB)/TF*60; k.ton.f(f*rand(0.97,1.03),0.08); }
    if(!k.hoch&&lt>=TB&&k.flug){ k.hoch=1; schall(k.g.position,v=>sfx.zischen(v*0.45,0.5)); } }
  M.geometry.setDrawRange(0,s*2); A.position.needsUpdate=true; A.color.needsUpdate=true; M.visible=s>0;
  if(ln) licht('fk'+e.prod,{x:lx/ln,y:ly/ln+0.15,z:lz/ln},[lc[0]/ln,lc[1]/ln,lc[2]/ln],0.35+ln*0.12,{weite:4});
  kqSchritt(e,dt,t);
});

/* =========================================================
   6. Mini-Podest fuer Wunderkerzen
   03.10., Tom: "Beim Abbrennen soll man die Verpackung nicht sehen. Auf
   dem Tisch steht ein kleines Mini-Podest, in das die Wunderkerzen
   gesteckt sind." Ein Holzsockel mit dunklem Steckblock; darin die
   noch nicht gezuendeten Kerzen (grauer Mantel, blanker Griff). Beim
   Zuenden blendet der Emitter diese Kerzen aus und zeichnet seine
   eigenen, die abbrennen (klKerze/formkerze in 14l).
   ========================================================= */
const KQ_PH=0.045;   /* Oberkante des Steckblocks ueber dem Tisch */
function kqWkLayout(t){
  switch(t){
    case 'wunder': return {b:0.15,d:0.07,kerzen:[{x:-0.026,ang:0.21,L:0.5},{x:0,ang:-0.015,L:0.5},{x:0.026,ang:-0.24,L:0.5}]};
    case 'wunderkerzeXXL': return {b:0.17,d:0.11,schwer:true,kerzen:[{x:0,ang:0,L:1.0,r:0.0055}]};
    case 'wunderherz': return {b:0.12,d:0.065,form:['herz'],gr:0.36,stiel:0.12};
    case 'wunderzahl': return {b:0.8,d:0.065,form:['2','0','2','7'],gr:0.26,abstand:0.19,stiel:0.1};
    /* 06.10. (Toms PDF, Bengalhoelzer: "in so eine Halterung ... du siehst
       nur die Staebe ... und gerne da auch noch einen Gelben ... vielleicht
       auch Blau, diese vier Farben so nacheinander"): vier Hoelzer leicht
       gefaechert im Steckblock, Holzstiel unten, oben der farbige Satz.
       Gezuendet wird Rot, Gruen, Gelb, Blau (Feld nr) - nicht der Reihe
       nach von links: Rot steckt links innen, dann aussen rechts, aussen
       links, innen rechts. Spitzen bleiben ueber dem 9-cm-Karton. */
    case 'bengalholz': return {b:0.11,d:0.045,hoelzer:[
      {x:-0.036,ang:-0.14,L:0.2,kopf:0.075,F:'zitrone',c:0xe0b020,nr:2},
      {x:-0.012,ang:-0.05,L:0.2,kopf:0.075,F:'rot',c:0xc8322a,nr:0},
      {x:0.012,ang:0.05,L:0.2,kopf:0.075,F:'blau',c:0x2f5fc0,nr:3},
      {x:0.036,ang:0.14,L:0.2,kopf:0.075,F:'gruen',c:0x2f9a4a,nr:1}]};
  }
  return null; }
/* Bengalholz i im Steckblock: Fuss (Lochmitte oben) und Richtung */
function kqHolzLage(h,px,py,pz){ return {x:px+h.x,y:py+KQ_PH,z:pz,d:[Math.sin(h.ang),Math.cos(h.ang),0]}; }
const KQ_PODESTE=[];
/* Formen je Produkt einmal (geteilt von allen Podesten dieser Sorte) */
function kqPodest(t){
  const L=kqWkLayout(t); if(!L) return null;
  const g=new THREE.Group(), holz=kqMat(0x9a6a3c,{e:0.22,r:0.8}), block=kqMat(0x2c2a28,{e:0.12,r:0.9}), loch=kqMat(0x0c0b0a,{e:0});
  const M=(geo,mat,x,y,z,rx,rz)=>{ const m=kqM(geo,mat,x,y,z,rx||0,0,rz||0); m.receiveShadow=true; return m; };
  /* Sockelplatte mit Fase, darauf der Steckblock */
  g.add(M(kqGeo('pod_sp'+t,()=>new THREE.BoxGeometry(L.b+0.04,0.016,L.d+0.04)),holz,0,0.008,0));
  g.add(M(kqGeo('pod_fa'+t,()=>new THREE.BoxGeometry(L.b+0.025,0.006,L.d+0.025)),holz,0,0.019,0));
  g.add(M(kqGeo('pod_bl'+t,()=>new THREE.BoxGeometry(L.b,KQ_PH-0.022,L.d)),block,0,0.022+(KQ_PH-0.022)/2,0));
  if(L.schwer) /* Riesenkerze: Messingring als Halter */
    g.add(M(kqGeo('pod_ring',()=>new THREE.TorusGeometry(0.014,0.004,6,16)),kqMat(0xc9a046,{m:0.6,r:0.35,e:0.25}),0,KQ_PH+0.002,0,Math.PI/2));
  const lochGeo=kqGeo('pod_loch',()=>{ const c=new THREE.CircleGeometry(0.0045,8); c.rotateX(-Math.PI/2); return c; });
  /* die Kerzen vor dem Zuenden: grauer Mantel, blanker Draht */
  const kz=new THREE.Group(); g.add(kz); g.userData.kerzen=kz; g.userData.t=t;
  const mantel=klMantelMat(), draht=kqMat(0x9aa0a8,{m:0.6,r:0.4,e:0.25});
  if(L.kerzen) L.kerzen.forEach((k,i)=>{ const Lk=k.L, gr=Math.min(0.12,Lk*0.2), ang=k.ang||0, ex=Math.sin(ang), ey=Math.cos(ang), r=k.r||0.0042;
    kz.add(kqM(kqGeo('pod_k'+t+i,()=>{ const mp=[]; for(let j=0;j<=8;j++){ const s=gr/Lk+(1-gr/Lk)*j/8; mp.push([k.x+ex*Lk*s,KQ_PH+ey*Lk*s,0]); } return klRohrGeo(mp,r,6); }),mantel));
    kz.add(kqM(kqGeo('pod_d'+t+i,()=>{ const c=new THREE.CylinderGeometry(0.0011,0.0011,gr+0.02,5); c.rotateZ(-ang); c.translate(k.x+ex*(gr-0.02)/2,KQ_PH+ey*(gr-0.02)/2,0); return c; }),draht));
    g.add(kqM(lochGeo,loch,k.x,KQ_PH+0.0005,0)); });
  /* Bengalhoelzer: Holzstiel, oben der farbige Satz mit runder Kuppe;
     dazu je ein verkohlter Rest (unsichtbar, bis das Holz abgebrannt ist) */
  if(L.hoelzer){ const HZ=[]; g.userData.hoelzer=HZ;
    const stiel=kqMat(0xd8b884,{e:0.22,r:0.85}), asche=kqMat(0x34302c,{e:0.05,r:0.95});
    L.hoelzer.forEach((h,i)=>{ const gh=new THREE.Group(); gh.position.set(h.x,KQ_PH,0); gh.rotation.z=-h.ang; g.add(gh);
      const lw=h.L-h.kopf+0.004;
      gh.add(kqM(kqGeo('bh_stiel',()=>{ const c=new THREE.CylinderGeometry(0.0022,0.0022,1,6); c.translate(0,0.5,0); return c; }),stiel,0,-0.012,0)); gh.children[0].scale.y=lw+0.012;
      const kopf=kqGruppe(kqM(kqGeo('bh_kopf',()=>{ const c=new THREE.CylinderGeometry(0.0043,0.0043,1,8); c.translate(0,0.5,0); return c; }),kqMat(h.c,{e:0.3,r:0.9}),0,0,0),
        kqM(kqGeo('bh_kuppe',()=>new THREE.SphereGeometry(0.0043,8,5,0,Math.PI*2,0,Math.PI/2)),kqMat(h.c,{e:0.3,r:0.9}),0,h.kopf,0));
      kopf.children[0].scale.y=h.kopf; kopf.position.y=h.L-h.kopf; gh.add(kopf);
      const rest=kqM(kqGeo('bh_asche',()=>{ const c=new THREE.CylinderGeometry(0.0026,0.0034,1,6); c.translate(0,0.5,0); return c; }),asche,0,h.L-h.kopf,0); rest.scale.y=h.kopf*0.55; rest.visible=false; gh.add(rest);
      g.add(kqM(lochGeo,loch,h.x,KQ_PH+0.0005,0));
      HZ.push({kopf,rest,h}); }); }
  if(L.form){ const st=L.stiel||0.1;
    klFormTeile(L.form,L.gr,L.abstand).forEach((ft,j)=>{
      ft.pfade.forEach((pk,pi)=>kz.add(kqM(kqGeo('pod_f'+t+j+'_'+pi,()=>klRohrGeo(klDicht(pk,0.008).map(([x,y])=>[x,KQ_PH+st+y,0]),0.0042,6)),mantel)));
      kz.add(kqM(kqGeo('pod_s'+t+j,()=>{ const c=new THREE.CylinderGeometry(0.0012,0.0012,st+0.012,5); c.translate(ft.dx,KQ_PH+st/2,0); return c; }),draht));
      g.add(kqM(lochGeo,loch,ft.dx,KQ_PH+0.0005,0)); }); }
  g.userData.geoFest=true;
  return g; }
/* Station: Podest auf den Platz sl (Tischoberkante sl.y), immer zum Pult
   hin ausgerichtet (die Ziffern sollen lesbar sein) */
function kqPodestAuf(t,sl){ const g=kqPodest(t); if(!g) return null; g.position.set(sl.x,sl.y,sl.z);
  for(let i=KQ_PODESTE.length-1;i>=0;i--) if(!KQ_PODESTE[i].parent) KQ_PODESTE.splice(i,1);
  KQ_PODESTE.push(g); return g; }
/* Emitter: Podest am Ort o suchen (Station) und dessen Kerzen
   ausblenden - der Emitter zeichnet die brennenden selbst; ohne Station
   (Test, freier Ort) ein eigenes Podest fuer die Brenndauer aufstellen.
   Rueckgabe {y}: Oberkante, in der die Kerzen stecken. */
function kqPodestNimm(e,o,t){
  const sf=klFlaeche(o);
  let g=KQ_PODESTE.find(p=>p.parent&&p.userData.t===t&&Math.hypot(p.position.x-o.x,p.position.z-o.z)<0.12)||null;
  if(g){ g.userData.kerzen.visible=false; return {y:g.position.y+KQ_PH,g}; }
  g=kqPodest(t); if(!g) return null; g.position.set(o.x,sf,o.z); g.userData.kerzen.visible=false; klMesh(e,g);
  return {y:sf+KQ_PH,g}; }

/* Bengalhoelzer: der Halter, in dem die Hoelzer stecken - auf der Station
   (kqPodestAuf) oder, ohne Station, ein eigener fuer die Brenndauer, den
   alle vier Hoelzer derselben Zuendung finden */
function kqHolzPodest(o){
  let g=KQ_PODESTE.find(p=>p.parent&&p.userData.t==='bengalholz'&&Math.hypot(p.position.x-o.x,p.position.z-o.z)<0.12)||null;
  if(g) return g;
  g=kqPodestAuf('bengalholz',{x:o.x,y:klFlaeche(o),z:o.z}); if(!g) return null; scene.add(g);
  const gg=g; later(kleinDauer('bengalholz')+4,()=>{ if(gg.parent) gg.parent.remove(gg); });
  return g; }

if(typeof window!=='undefined') window.__kleinNeu={kqWkLayout,kqPodest,KQ_PODESTE,KQ_TEILE:Object.keys(KQ_TEILE),KQ_PH,kqFroschGeo};
