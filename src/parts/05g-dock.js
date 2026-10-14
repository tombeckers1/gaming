
/* =========================================================
   Ladehof hinter dem Lager: Tor, Hofmauer, Zufahrt
   ========================================================= */
const DOCK={door:V(-20,0,-2),stand:V(-21.9,0,-2),park:V(-23.5,0,-2.2)};
/* Sektionaltor R1 (Basisrampe): fuenf Panele laufen senkrecht hoch, biegen ueber
   einen Viertelkreis ab und liegen dann waagerecht unter der Lagerdecke.
   Seit 13.10. (Fundament, Schritt Tore) baut bk.tor() das Tor - hier bleibt nur
   die Spiel-Logik (door, Kollision des Blatts, Ampel, Warnleuchte, Klang). */
const TOR={x:-19.95,z:-2,w:3.26,h:3.0,ph:0.6,n:5,R:0.42};
let door=null;
/* Rundstab zwischen zwei Punkten in einer y-z-Ebene (x fest) - Vordach Eingang 2 (05l) */
function strebeZ(z0,y0,z1,y1,x,mat,parent){
  const dz=z1-z0, dy=y1-y0, L=Math.hypot(dz,dy);
  const st=bbox(0.06,L,0.06,mat,x,(y0+y1)/2,(z0+z1)/2,parent,false);
  st.rotation.x=Math.atan2(dz,dy);
  return st;
}
function doorSet(t){
  if(!door) return;
  door.t=clamp(t,0,TOR.h);
  door.T.set(door.t/TOR.h);
  if(door.t>0.35){ if(door.col){ dropCol(door.col); door.col=null; if(typeof navDirty==='function') navDirty(); } }
  else if(!door.col){ door.col=col(-20.12,-19.88,-3.62,-0.38); if(typeof navDirty==='function') navDirty(); }
  const open=door.t>=TOR.h-0.02;
  if(door.lampG) door.lampG.emissiveIntensity=open?1.6:0;
  if(door.lampR) door.lampR.emissiveIntensity=open?0:1.4;
}
function doorOpen(v){ if(door) door.target=v?TOR.h:0; }
function doorIsOpen(){ return door&&door.t>=TOR.h-0.02; }
function updateDoor(dt){
  if(!door) return;
  const d=door.target-door.t;
  if(Math.abs(d)<0.005){
    if(door.moving){ door.moving=false; if(door.warn) door.warn.emissiveIntensity=0; }
    return;
  }
  if(!door.moving){ door.moving=true; door.snd=0; }
  door.snd-=dt; if(door.snd<=0){ door.snd=0.42; sfx.rolltor(distVol(V(-20,1.5,-2))); }
  if(door.warn) door.warn.emissiveIntensity=(Math.sin(performance.now()*0.012)>0?1.8:0.05);
  doorSet(door.t+(d>0?1:-1)*Math.min(Math.abs(d),0.95*dt));
}
function buildDock(){
  const snow=MAT.get('weissMatt');
  const ym=MAT.get('betonHof');
  MAT.kachel(flat(14,9,ym,-27,0.014,-2).geometry,4,6);
  MAT.kachel(flat(10,9.2,MAT.get('betonHof'),-25,0.013,6.9).geometry,4,6);
  // Hofmauer
  const mw=brickMat(14,2.8);
  bbox(14.1,2.8,0.24,mw,-27,1.4,-6.0,null,false);
  bbox(14.2,0.14,0.34,snow,-27,2.84,-6.0,null,false);
  /* Westmauer mit Einfahrt fuer den LKW */
  const mw2=brickMat(6,2.8);
  bbox(0.24,2.8,2.5,mw2,-34.0,1.4,-4.85,null,false);
  bbox(0.24,2.8,10.6,mw2,-34.0,1.4,5.9,null,false);
  bbox(0.34,0.14,2.6,snow,-34.0,2.84,-4.85,null,false);
  bbox(0.34,0.14,10.7,snow,-34.0,2.84,5.9,null,false);
  for(const z of [-3.6,0.6]){ bbox(0.42,3.2,0.42,MAT.std(0x5f584e,{roughness:1}),-34.0,1.6,z,null,false);
    bbox(0.5,0.16,0.5,MAT.get('graphitMatt'),-34.0,3.24,z,null,false); }
  /* Schiebetor, offen an die Mauer gefahren (Zauntor aus dem Baukasten) */
  bk.tor({art:'gitter',bewegung:'schiebe',breite:4.2,hoehe:2.3,boden:0.3,x:-33.88,z:3.1,ry:0});
  col(-34.15,-33.85,-6.6,-3.6); col(-34.15,-33.85,0.6,11.2); col(-34.1,-20,-6.15,-5.85);
  /* Der Anbau hinter dem Lager ist kein eigener niedriger Bau mehr:
     Huelle und Dach kommen aus halle() beziehungsweise aus dem
     Lagerdach in 05c, alles auf Lagerhoehe. Frueher stand hier eine
     zweite Wand auf 2,90 m und ein eigenes Flachdach - das hing als
     dunkler Balken quer durch das Lager, sobald die Decke hoeher
     wurde. Nur die Fenster in der Nordwand bleiben. */
  /* Die Fenster in der Nordwand baut jetzt lagerFensterWand() als
     echte Oeffnungen - hier klebten vorher dunkle Kaesten aussen drauf. */
  buildTor();
  /* Vordach, Streben und Poller gehoeren seit 13.10. zum Tor (bk.tor) */
  /* Hofbeleuchtung: zwei Wandstrahler an der Lagerwand, dazu zwei
     Mastleuchten im Hof. Vorher schwebten die Leuchten frei in der Luft. */
  for(const z of [-4.9,0.9]){
    const wm=MAT.get('stahlGraphit');
    bbox(0.16,0.22,0.16,wm,-20.16,2.85,z,null,false);              // Wandsockel
    const arm=bbox(0.34,0.07,0.07,wm,-20.42,2.95,z,null,false); arm.rotation.z=0.22;
    const geh=rbox(0.3,0.16,0.4,0.03,MAT.get('stahlAnthrazit'),-20.64,3.02,z,null);
    geh.rotation.z=0.34;
    const lm=new THREE.MeshStandardMaterial({color:LIN(MAT.farbe('anthrazit')),emissive:LIN(0xfff0d0),emissiveIntensity:0}); lampMats.push(lm);
    const wa=bbox(0.06,0.13,0.34,lm,-20.76,2.94,z,null,false); wa.rotation.z=0.34;
    bbox(0.34,0.03,0.44,MAT.get('stahlVerzinkt'),-20.62,3.12,z,null,false);
  }
  if(typeof strassenlampe==='function'){ strassenlampe(-26.4,-5.2,Math.PI/2); strassenlampe(-31.6,-2,Math.PI/2); }
  // Bodenmarkierung für den LKW
  const mark=(w,d,x,z,c)=>flat(w,d,c?MAT.std(c):MAT.get('markierungGelb'),x,0.017,z);
  for(let x2=-33;x2<-20.6;x2+=1.0){ mark(0.6,0.12,x2,-3.55); mark(0.6,0.12,x2,-0.45); }
  mark(0.14,3.4,-33.3,-2);
  const zm=new THREE.Mesh(new THREE.PlaneGeometry(5.2,1.6),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,map:tex(1040,320,(g,W,H)=>{
    g.clearRect(0,0,W,H);
    /* dunkles Feld unter der Schrift, damit sie sich vom Beton abhebt */
    g.fillStyle='rgba(18,20,26,.62)'; g.fillRect(0,0,W,H);
    g.strokeStyle=MAT.css('signalgelb'); g.lineWidth=12; g.strokeRect(6,6,W-12,H-12);
    g.textAlign='center'; g.textBaseline='middle';
    g.font=BUN(120);
    g.fillStyle='rgba(0,0,0,.75)'; g.fillText('ANLIEFERUNG',W/2+6,H/2+9);
    g.fillStyle=MAT.css('signalgelb'); g.fillText('ANLIEFERUNG',W/2,H/2+3); })}));
  zm.rotation.x=-Math.PI/2; zm.position.set(-26,0.018,2.6); zm.renderOrder=2; scene.add(zm);
  // Schild an der Wand
  plane(1.5,0.5,new THREE.MeshStandardMaterial({map:tex(300,100,(g,W,H)=>{
    g.fillStyle='#1b2340'; g.fillRect(0,0,W,H); g.strokeStyle=MAT.css('schildgold'); g.lineWidth=5; g.strokeRect(6,6,W-12,H-12);
    g.fillStyle=MAT.css('schildgold'); g.font=BUN(30); g.textAlign='center'; g.fillText('WARENEINGANG',W/2,42);
    g.fillStyle='#bcd0ea'; g.font=BAR(24); g.fillText('Anlieferung 7 – 16 Uhr',W/2,76); })}),-19.93,2.2,-4.9,-Math.PI/2);
}

/* Das Tor R1 selbst: eine duenne Huelle ueber bk.tor (04z-baukasten.js). Vorher stand hier
   ein eigener Bau mit rund 97 Einzelmeshes und der hellen Paneltextur torPanelMat. */
function buildTor(){
  const T=bk.tor({art:'sektional',fuehrung:'normal',breite:TOR.w,hoehe:TOR.h,panele:TOR.n,R:TOR.R,decke:LAGER_H-0.02,
    wand:[-0.17,0.07],blatt:0,nr:'1',bedien:1,x:TOR.x,z:TOR.z,ry:0});
  for(const r of T.kollision) col(r.x0,r.x1,r.z0,r.z1);
  door={g:T.g,T,panels:T.panele,t:TOR.h,target:0,moving:false,snd:0,col:null,warn:T.warn,lampR:T.ampel.rot,lampG:T.ampel.gruen};
  doorSet(0);
}
