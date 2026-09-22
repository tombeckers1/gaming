
/* =========================================================
   Ladehof hinter dem Lager: Tor, Hofmauer, Zufahrt
   ========================================================= */
const DOCK={door:V(-20,0,-2),stand:V(-21.9,0,-2),park:V(-23.5,0,-2.2)};
/* Sektionaltor: fuenf Panele laufen senkrecht hoch, biegen ueber einen
   Viertelkreis ab und liegen dann waagerecht unter der Lagerdecke. */
const TOR={x:-19.95,z:-2,w:3.26,h:3.0,ph:0.6,n:5,R:0.42};
let door=null;
function panelPose(s){
  const {x,h,R}=TOR, arc=R*Math.PI/2;
  if(s<=h) return {x,y:s,rz:0};
  if(s<=h+arc){ const a=(s-h)/R; return {x:x+R-R*Math.cos(a),y:h+R*Math.sin(a),rz:a}; }
  return {x:x+R+(s-h-arc),y:h+R,rz:Math.PI/2};
}
function doorSet(t){
  if(!door) return;
  door.t=clamp(t,0,TOR.h);
  door.panels.forEach((pn,i)=>{
    const po=panelPose(door.t+i*TOR.ph+TOR.ph/2);
    pn.position.set(po.x,po.y,TOR.z); pn.rotation.z=po.rz;
  });
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
  const snow=std(0xeef2f8,{roughness:1});
  const steel=std(0x8d939d,{metalness:0.6,roughness:0.42});
  const yard=concreteTex(); yard.repeat.set(4,6);
  const ym=new THREE.MeshStandardMaterial({map:yard,roughness:0.92,color:LIN(0xb0b4ba)});
  flat(14,9,ym,-27,0.014,-2);
  const drv=concreteTex(); drv.repeat.set(4,6);
  flat(10,9.2,new THREE.MeshStandardMaterial({map:drv,roughness:0.92,color:LIN(0xa8acb2)}),-25,0.013,6.9);
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
  for(const z of [-3.6,0.6]){ bbox(0.42,3.2,0.42,std(0x5f584e,{roughness:1}),-34.0,1.6,z,null,false);
    bbox(0.5,0.16,0.5,std(0x3a4150),-34.0,3.24,z,null,false); }
  /* Schiebetor, offen an die Mauer gefahren */
  { const g2=new THREE.Group(); g2.position.set(-34.0,0,3.1); scene.add(g2);
    bbox(0.1,0.1,4.2,steel,0.12,2.25,0,g2,false);
    bbox(0.1,0.1,4.2,steel,0.12,0.35,0,g2,false);
    for(let i=0;i<14;i++) bbox(0.07,1.9,0.07,steel,0.12,1.3,-2.0+i*0.31,g2,false);
    for(let i=0;i<5;i++) bbox(0.05,0.05,4.2,steel,0.12,0.6+i*0.4,0,g2,false); }
  col(-34.15,-33.85,-6.6,-3.6); col(-34.15,-33.85,0.6,11.2); col(-34.1,-20,-6.15,-5.85);
  /* Der Anbau hinter dem Lager ist kein eigener niedriger Bau mehr:
     Huelle und Dach kommen aus halle() beziehungsweise aus dem
     Lagerdach in 05c, alles auf Lagerhoehe. Frueher stand hier eine
     zweite Wand auf 2,90 m und ein eigenes Flachdach - das hing als
     dunkler Balken quer durch das Lager, sobald die Decke hoeher
     wurde. Nur die Fenster in der Nordwand bleiben. */
  for(const x of [-18,-14,-10]){ bbox(0.7,0.9,0.1,std(0x2a3040,{metalness:0.4}),x,1.9,6.2,null,false);
    bbox(0.62,0.82,0.04,new THREE.MeshStandardMaterial({color:LIN(0x9fb4cc),transparent:true,opacity:0.3,roughness:0.1}),x,1.9,6.24,null,false); }
  buildTor(steel,snow);
  // Vordach über dem Tor
  const cano=bbox(1.9,0.1,4.4,std(0x3a4150,{metalness:0.5}),-20.95,3.32,-2,null,false); cano.rotation.z=0.08;
  bbox(1.95,0.09,4.45,snow,-20.95,3.42,-2,null,false).rotation.z=0.08;
  for(const z of [-1.9,1.9]){ const st=bbox(0.07,0.9,0.07,steel,-21.8,2.95,z,null,false); st.rotation.x=0; st.rotation.z=-0.7; }
  /* Hofbeleuchtung: zwei Wandstrahler an der Lagerwand, dazu zwei
     Mastleuchten im Hof. Vorher schwebten die Leuchten frei in der Luft. */
  for(const z of [-4.9,0.9]){
    const wm=std(0x3a4150,{metalness:0.5,roughness:0.5});
    bbox(0.16,0.22,0.16,wm,-20.16,2.85,z,null,false);              // Wandsockel
    const arm=bbox(0.34,0.07,0.07,wm,-20.42,2.95,z,null,false); arm.rotation.z=0.22;
    const geh=rbox(0.3,0.16,0.4,0.03,std(0x2f343e,{metalness:0.5,roughness:0.45}),-20.64,3.02,z,null);
    geh.rotation.z=0.34;
    const lm=new THREE.MeshStandardMaterial({color:LIN(0x23262e),emissive:LIN(0xfff0d0),emissiveIntensity:0}); lampMats.push(lm);
    const wa=bbox(0.06,0.13,0.34,lm,-20.76,2.94,z,null,false); wa.rotation.z=0.34;
    bbox(0.34,0.03,0.44,std(0x8f959e,{metalness:0.6}),-20.62,3.12,z,null,false);
  }
  if(typeof strassenlampe==='function'){ strassenlampe(-26.4,-5.2,Math.PI/2); strassenlampe(-31.6,-2,Math.PI/2); }
  // Bodenmarkierung für den LKW
  const mark=(w,d,x,z,c)=>flat(w,d,std(c||0xf2c230),x,0.017,z);
  for(let x2=-33;x2<-20.6;x2+=1.0){ mark(0.6,0.12,x2,-3.55); mark(0.6,0.12,x2,-0.45); }
  mark(0.14,3.4,-33.3,-2);
  const zm=new THREE.Mesh(new THREE.PlaneGeometry(5.2,1.6),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,map:tex(1040,320,(g,W,H)=>{
    g.clearRect(0,0,W,H);
    /* dunkles Feld unter der Schrift, damit sie sich vom Beton abhebt */
    g.fillStyle='rgba(18,20,26,.62)'; g.fillRect(0,0,W,H);
    g.strokeStyle='#ffd23f'; g.lineWidth=12; g.strokeRect(6,6,W-12,H-12);
    g.textAlign='center'; g.textBaseline='middle';
    g.font=BUN(120);
    g.fillStyle='rgba(0,0,0,.75)'; g.fillText('ANLIEFERUNG',W/2+6,H/2+9);
    g.fillStyle='#ffd23f'; g.fillText('ANLIEFERUNG',W/2,H/2+3); })}));
  zm.rotation.x=-Math.PI/2; zm.position.set(-26,0.018,2.6); zm.renderOrder=2; scene.add(zm);
  // Poller neben dem Tor
  for(const z of [-4.0,0.0]){ bbox(0.2,0.95,0.2,std(0xf2c230,{roughness:0.7}),-20.6,0.48,z,null,false);
    bbox(0.22,0.14,0.22,std(0x1f1f24),-20.6,0.86,z,null,false); col(-20.75,-20.45,z-0.15,z+0.15); }
  // Schild an der Wand
  plane(1.5,0.5,new THREE.MeshStandardMaterial({map:tex(300,100,(g,W,H)=>{
    g.fillStyle='#1b2340'; g.fillRect(0,0,W,H); g.strokeStyle='#ffd23f'; g.lineWidth=5; g.strokeRect(6,6,W-12,H-12);
    g.fillStyle='#ffd23f'; g.font=BUN(30); g.textAlign='center'; g.fillText('WARENEINGANG',W/2,42);
    g.fillStyle='#bcd0ea'; g.font=BAR(24); g.fillText('Anlieferung 7 – 16 Uhr',W/2,76); })}),-19.93,2.2,-4.9,-Math.PI/2);
}

/* =========================================================
   Sektionaltor mit Zarge, Fuehrungsschienen, Antrieb und Rampentechnik
   ========================================================= */
/* Sandwichpanel eines Sektionaltors. Die Westrampen bauen ihre
   Torblaetter aus denselben Panelen wie die Basisrampe - vorher war
   dort nur eine Textur auf einen Kasten geklebt. */
let _torPanel=null;
function torPanelMat(){
  if(_torPanel) return _torPanel;
  /* Sandwichpanel mit Sicken, Nut-und-Feder-Fuge und Gebrauchsspuren */
  const panelTex=tex(1024,256,(c,W,H)=>{
    const g0=c.createLinearGradient(0,0,0,H);
    g0.addColorStop(0,'#e7e9ec'); g0.addColorStop(0.12,'#f4f5f7');
    g0.addColorStop(0.5,'#dfe2e6'); g0.addColorStop(0.88,'#f1f2f4'); g0.addColorStop(1,'#c9ccd1');
    c.fillStyle=g0; c.fillRect(0,0,W,H);
    /* waagerechte Sicken */
    for(let y=34;y<H-30;y+=42){
      c.fillStyle='rgba(255,255,255,.55)'; c.fillRect(0,y,W,3);
      c.fillStyle='rgba(120,126,136,.35)'; c.fillRect(0,y+3,W,4);
      c.fillStyle='rgba(0,0,0,.10)'; c.fillRect(0,y+7,W,2);
    }
    /* Nut oben, Feder unten */
    c.fillStyle='rgba(60,66,76,.55)'; c.fillRect(0,0,W,10);
    c.fillStyle='rgba(0,0,0,.30)'; c.fillRect(0,H-12,W,12);
    /* feiner Lackstaub und Kratzer */
    for(let i=0;i<2600;i++){ c.fillStyle=`rgba(${Math.random()<0.5?0:255},${Math.random()<0.5?0:255},${Math.random()<0.5?0:255},${Math.random()*0.045})`; c.fillRect(Math.random()*W,Math.random()*H,2,2); }
    for(let i=0;i<26;i++){ c.strokeStyle=`rgba(140,146,156,${rand(0.1,0.3)})`; c.lineWidth=rand(0.6,1.6);
      const x=Math.random()*W,y=Math.random()*H; c.beginPath(); c.moveTo(x,y); c.lineTo(x+rand(-90,90),y+rand(-5,5)); c.stroke(); }
    /* Schmutzrand unten */
    const gr=c.createLinearGradient(0,H-46,0,H); gr.addColorStop(0,'rgba(90,86,78,0)'); gr.addColorStop(1,'rgba(90,86,78,.26)');
    c.fillStyle=gr; c.fillRect(0,H-46,W,46);
  });
  panelTex.wrapS=THREE.RepeatWrapping; panelTex.repeat.set(1.6,1); panelTex.anisotropy=8;
  panelTex.wrapS=THREE.RepeatWrapping; panelTex.repeat.set(1.6,1); panelTex.anisotropy=8;
  _torPanel=new THREE.MeshStandardMaterial({map:panelTex,metalness:0.42,roughness:0.44});
  return _torPanel;
}
function buildTor(steel,snow){
  const g=new THREE.Group(); scene.add(g);
  const dark=std(0x2a2e38,{metalness:0.5,roughness:0.45});
  const rub=std(0x16181d,{roughness:0.96});
  const R=TOR.R, XD=TOR.x, Z=TOR.z;
  /* Zarge aussen */
  for(const dz of [-1.78,1.78]) bbox(0.3,3.2,0.16,steel,-20.0,1.6,Z+dz,null,false);
  bbox(0.3,0.22,3.9,steel,-20.0,3.12,Z,null,false);
  /* Fuehrungsschienen: senkrecht, Bogen, waagerecht */
  for(const dz of [-1.68,1.68]){
    bbox(0.07,3.05,0.07,steel,XD+0.1,1.52,Z+dz,g,false);
    for(let k=0;k<7;k++){ const a=k/6*Math.PI/2;
      const rl=bbox(0.06,0.14,0.06,steel,XD+0.1+R-R*Math.cos(a),TOR.h+R*Math.sin(a),Z+dz,g,false);
      rl.rotation.z=a; }
    bbox(2.6,0.07,0.07,steel,XD+R+1.35,TOR.h+R,Z+dz,g,false);
    for(const bx of [XD+R+0.5,XD+R+1.6,XD+R+2.5]) bbox(0.05,0.3,0.05,steel,bx,TOR.h+R+0.18,Z+dz,g,false);
  }
  /* Torwelle mit Federn und Antrieb */
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,3.6,10),steel);
  shaft.rotation.x=Math.PI/2; shaft.position.set(XD+0.24,TOR.h+0.3,Z); g.add(shaft);
  for(const dz of [-0.75,0.75]){
    const sp=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,0.85,12),std(0x6a707a,{metalness:0.7,roughness:0.35}));
    sp.rotation.x=Math.PI/2; sp.position.set(XD+0.24,TOR.h+0.3,Z+dz); g.add(sp);
  }
  for(const dz of [-1.62,1.62]){
    const dr=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.08,0.09,12),steel);
    dr.rotation.x=Math.PI/2; dr.position.set(XD+0.24,TOR.h+0.3,Z+dz); g.add(dr);
  }
  bbox(0.3,0.26,0.4,std(0x3a4150,{metalness:0.55}),XD+0.45,TOR.h+0.3,Z-1.95,g,false);
  bbox(0.16,0.16,0.2,std(0xf2a01c,{roughness:0.5}),XD+0.45,TOR.h+0.08,Z-1.95,g,false);
  const chain=new THREE.Mesh(new THREE.TorusGeometry(0.16,0.012,6,16),dark);
  chain.position.set(XD+0.5,TOR.h-0.1,Z-1.95); chain.scale.y=3.4; g.add(chain);
  /* Warnleuchte und Ampel */
  const warn=new THREE.MeshStandardMaterial({color:LIN(0x3a2a08),emissive:LIN(0xffb02a),emissiveIntensity:0});
  const wl=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.09,0.12,12),warn);
  wl.position.set(XD+0.3,TOR.h+0.52,Z+1.5); g.add(wl);
  bbox(0.1,0.06,0.1,dark,XD+0.3,TOR.h+0.6,Z+1.5,g,false);
  const lampR=new THREE.MeshStandardMaterial({color:LIN(0x300808),emissive:LIN(0xff2a2a),emissiveIntensity:1.4});
  const lampG=new THREE.MeshStandardMaterial({color:LIN(0x082a12),emissive:LIN(0x3dff7a),emissiveIntensity:0});
  bbox(0.14,0.34,0.12,dark,XD+0.22,1.9,Z+1.92,g,false);
  const lr=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.04,10),lampR); lr.rotation.z=Math.PI/2; lr.position.set(XD+0.3,2.0,Z+1.92); g.add(lr);
  const lg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.04,10),lampG); lg.rotation.z=Math.PI/2; lg.position.set(XD+0.3,1.8,Z+1.92); g.add(lg);
  /* Bedienkasten */
  bbox(0.12,0.24,0.16,std(0xf2c230,{roughness:0.6}),XD+0.3,1.35,Z+1.92,g,false);
  for(let k=0;k<3;k++) bbox(0.04,0.05,0.05,std([0x2f9e57,0xd8352a,0x2a2e38][k]),XD+0.37,1.43-k*0.07,Z+1.92,g,false);
  /* Torpanele */
  const pm=std(0xdfe2e6,{metalness:0.4,roughness:0.5});
  const pmT=torPanelMat();
  const panels=[];
  for(let i=0;i<TOR.n;i++){
    const pn=new THREE.Mesh(new THREE.BoxGeometry(0.095,TOR.ph-0.012,TOR.w),
      [pm,pm,pm,pm,pmT,pmT]);
    if(HIQ){ pn.castShadow=true; pn.receiveShadow=true; }
    g.add(pn); panels.push(pn);
    /* Scharnierrollen an den Panelkanten */
    for(const dz of [-1.63,1.63]){
      const rol=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.05,8),steel);
      rol.rotation.x=Math.PI/2; rol.position.set(0.06,-TOR.ph/2+0.04,dz); pn.add(rol);
    }
    if(i===TOR.n-2){ /* Lichtband im vorletzten Panel */
      for(let k=0;k<4;k++){
        const wnd=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.3,0.52),
          new THREE.MeshStandardMaterial({color:LIN(0xd8e8f4),transparent:true,opacity:0.55,roughness:0.25}));
        wnd.position.set(0.004,0,-1.2+k*0.8); pn.add(wnd);
      }
    }
    /* Nut-und-Feder-Profil an den Panelkanten */
    const nut=new THREE.Mesh(new THREE.BoxGeometry(0.075,0.022,TOR.w-0.02),steel);
    nut.position.set(0,TOR.ph/2-0.014,0); pn.add(nut);
    const fed=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.018,TOR.w-0.04),std(0x9aa1ac,{metalness:0.6,roughness:0.4}));
    fed.position.set(0,-TOR.ph/2+0.012,0); pn.add(fed);
    /* Scharnierbaender in der Flaeche */
    for(const dz of [-0.55,0.55]){
      const sch=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.11,0.16),steel);
      sch.position.set(-0.058,-TOR.ph/2+0.03,dz); pn.add(sch);
    }
    if(i===0){
      const seal=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.055,TOR.w),rub);
      seal.position.set(0,-TOR.ph/2+0.01,0); pn.add(seal);
      /* Griffmulde und Warnstreifen auf dem untersten Panel */
      const gr2=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.09,0.5),std(0x59606b,{metalness:0.6,roughness:0.4}));
      gr2.position.set(-0.056,0.06,0); pn.add(gr2);
      const wt=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.12,TOR.w-0.06),
        new THREE.MeshStandardMaterial({roughness:0.6,map:tex(512,48,(c,W,H)=>{
          for(let k=0;k<16;k++){ c.save(); c.translate(k*W/16,0); c.transform(1,0,-0.5,1,0,0);
            c.fillStyle=k%2?'#f2c230':'#1f1f24'; c.fillRect(0,-H,W/16+H,H*3); c.restore(); } })}));
      wt.position.set(-0.056,-TOR.ph/2+0.1,0); pn.add(wt);
    }
  }
  /* Torabdichtung aussen, Gummipuffer, Ueberladebruecke */
  for(const dz of [-1.72,1.72]) bbox(0.4,3.1,0.26,rub,-20.22,1.55,Z+dz,null,false);
  bbox(0.4,0.26,3.9,rub,-20.22,3.12,Z,null,false);
  for(const dz of [-1.55,1.55]) bbox(0.24,0.5,0.3,rub,-20.28,0.55,Z+dz,null,false);
  /* Die Ueberladebruecke gehoert zum LKW (siehe makeBruecke) und existiert nur, solange er andockt. */
  door={g,panels,t:TOR.h,target:0,moving:false,snd:0,col:null,warn,lampR,lampG};
  doorSet(0);
}
