/* =========================================================
   Kleinfeuerwerk ausgepackt auf dem Zuendtisch (07.10., Tom: "Beim
   Party-Popper steht beim Zuenden die Verpackung auf dem Tisch, nicht
   das Produkt selbst - wie damals bei den Wunderkerzen").
   Wie das Mini-Podest der Wunderkerzen (14q kqPodest) und das Gestell
   der Feuerraeder (14k fkGestell) steht an Station und Vorfuehrung das
   echte Einzelprodukt:
   - Knallerbsen: Haeufchen Papiererbsen auf Saegemehl, handvollweise weg
   - Party-Popper: drei Popper im Holzhalter, Zugschnur mit Ring liegt vorn;
     beim Ploppen ist die Kappe auf, die Schnur weg; das Konfetti kommt aus
     der Oeffnung des jeweiligen Poppers
   - Knallfrosch, Knallbonbons, Brummkreisel: liegen genau da, wo der
     Effekt (14q) sie dann bewegt - beim Zuenden uebernimmt der Emitter
     seine eigenen Koerper, die Tischfiguren verschwinden (nichts doppelt)
   - Furzboeller, Monster Boeller: ein Boeller mit Zuendschnur liegt da,
     weg mit dem Knall
   - Flitzer, Blitzknaller: sechs Stueck nebeneinander, jeder verschwindet,
     wenn er losfliegt bzw. geworfen wird
   kfTischZuenden (aus kleinZuenden, 14l) setzt die Hoehe des Ursprungs
   auf die Oberkante des Produkts und plant, was wann verschwindet.
   ========================================================= */
const KF_AUF=[], KF_HAND=[4,5,3,4,5,3,4,2];
const KF_ARTEN=['knallerbsen','partypopper','knallfrosch','knallbonbon','boeller','schwaermer','blitzknaller','bodenkreisel','monsterboeller'];
/* feste Lage der Teile relativ zum Platz (Weltachsen: +z zum Pult) -
   dieselben Zahlen nutzen die Emitter in 14l/14q */
function kfFroschLage(o){ return {x:o.x+0.005,z:o.z+0.01,ry:0.38}; }
function kfBonbonLage(o,i){ const q=[[-0.012,-0.0825,0.04],[0.014,-0.0275,-0.03],[-0.008,0.0275,0.035],[0.012,0.0825,-0.04]][i%4]; return {x:o.x+q[0],z:o.z+q[1],ry:q[2]}; }
function kfKreiselLage(o,i){ return {x:o.x+[-0.105,0,0.105][i%3]+(i>=3?0.02:-0.02),z:o.z+(i<3?-0.04:0.04)}; }
/* Flitzer liegen als Faecher (Spitze zum Pult); Ort der Huelsenmitte */
function kfFlitzerLage(o,i){ const a=(i-2.5)*0.16; return {x:o.x+(i-2.5)*0.021+Math.sin(a)*0.01,z:o.z+0.005,ry:a}; }
/* Party-Popper: Fuss im Halter, Achse nach Neigung/Azimut des Strahls */
const KF_POP=[{x:0,ne:0.25,az:0},{x:-0.08,ne:0.7,az:-0.6},{x:0.08,ne:0.7,az:0.6}], KF_POP_L=0.066, KF_POP_H=0.03;
function kfPopAchse(q){ return [Math.sin(q.ne)*Math.sin(q.az),Math.cos(q.ne),Math.sin(q.ne)*Math.cos(q.az)]; }
function kfPopperMund(o,i){ const q=KF_POP[i%3], d=kfPopAchse(q), sf=klFlaeche(o); return {x:o.x+q.x+d[0]*KF_POP_L,y:sf+KF_POP_H-0.012+d[1]*KF_POP_L,z:o.z+d[2]*KF_POP_L}; }

/* ---------- Druck ---------- */
/* Huelsendruck: W = Umfang, H = Laenge; Schrift laeuft entlang der Huelse */
function kfDruckMat(k,W,H,draw){ return kqBildMat('kf'+k,W,H,draw,{e:0.18}); }
function kfLaengs(g,W,H,f){ g.save(); g.translate(W/2,H/2); g.rotate(-Math.PI/2); g.scale(-1,1); f(g,H,W); g.restore(); }
const KF_DRUCK={
  furz:()=>kfDruckMat('furz',128,256,(g,W,H)=>{ g.fillStyle='#6a4a22'; g.fillRect(0,0,W,H);
    for(let i=0;i<500;i++){ g.fillStyle=`rgba(${60+Math.random()*60|0},${40+Math.random()*30|0},10,.25)`; g.fillRect(Math.random()*W,Math.random()*H,2,1); }
    g.fillStyle='#8fc93a'; g.fillRect(0,H*0.08,W,H*0.05); g.fillRect(0,H*0.87,W,H*0.05);
    kfLaengs(g,W,H,(g,L,U)=>{ /* Wolke mit Gesicht, Schriftzug */
      g.fillStyle='#b8e05a'; for(const [x,y,r] of [[0.2,0.5,0.32],[0.28,0.32,0.26],[0.13,0.36,0.22],[0.29,0.68,0.24]]){ g.beginPath(); g.arc(L*x-L/2,U*y-U/2,U*r,0,7); g.fill(); }
      g.fillStyle='#2a1a08'; g.beginPath(); g.arc(L*0.17-L/2,U*0.42-U/2,U*0.05,0,7); g.arc(L*0.25-L/2,U*0.42-U/2,U*0.05,0,7); g.fill();
      nameText(g,'PUPS!',L*0.06,-U*0.06,L*0.5,Math.round(U*0.42),FNT.bun,'#ffe23f','#2a1a08',3);
      nameText(g,'FURZBÖLLER · F2',L*0.06,U*0.3,L*0.5,Math.round(U*0.16),FNT.bar,'#f6f1e4'); }); }),
  monster:()=>kfDruckMat('monster',160,320,(g,W,H)=>{ g.fillStyle='#b8161c'; g.fillRect(0,0,W,H);
    g.fillStyle='#111'; g.fillRect(0,0,W,H*0.1); g.fillRect(0,H*0.9,W,H*0.1);
    g.fillStyle='#f6f1e4'; for(let i=0;i<8;i++){ g.beginPath(); g.moveTo(i*W/8,H*0.1); g.lineTo((i+0.5)*W/8,H*0.16); g.lineTo((i+1)*W/8,H*0.1); g.fill(); g.beginPath(); g.moveTo(i*W/8,H*0.9); g.lineTo((i+0.5)*W/8,H*0.84); g.lineTo((i+1)*W/8,H*0.9); g.fill(); }
    kfLaengs(g,W,H,(g,L,U)=>{ nameText(g,'MONSTER',0,-U*0.12,L*0.62,Math.round(U*0.4),FNT.bun,'#ffd23f','#111',4);
      nameText(g,'BÖLLER · KAT. F2 · NUR IM FREIEN',0,U*0.24,L*0.62,Math.round(U*0.13),FNT.bar,'#ffffff'); }); }),
  flitzer:()=>kfDruckMat('flitzer',64,192,(g,W,H)=>{ g.fillStyle='#ffd23f'; g.fillRect(0,0,W,H);
    g.fillStyle='#d8322a'; for(let i=-4;i<12;i++){ g.beginPath(); g.moveTo(0,i*H/8); g.lineTo(W,i*H/8+H/10); g.lineTo(W,i*H/8+H/10+H/22); g.lineTo(0,i*H/8+H/22); g.fill(); }
    kfLaengs(g,W,H,(g,L,U)=>{ g.fillStyle='rgba(255,255,255,.85)'; g.fillRect(-L*0.28,-U*0.3,L*0.56,U*0.6); nameText(g,'FLITZER',0,0,L*0.5,Math.round(U*0.42),FNT.bun,'#1b1b1b'); }); }),
  blitz:()=>kfDruckMat('blitz',64,160,(g,W,H)=>{ const gr=g.createLinearGradient(0,0,W,0); gr.addColorStop(0,'#8a929e'); gr.addColorStop(0.5,'#f4f6fa'); gr.addColorStop(1,'#8a929e'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='#1b2a6a'; g.fillRect(0,H*0.06,W,H*0.08); g.fillRect(0,H*0.86,W,H*0.08);
    kfLaengs(g,W,H,(g,L,U)=>{ g.fillStyle='#ffd23f'; g.beginPath(); g.moveTo(-L*0.3,-U*0.35); g.lineTo(-L*0.2,-U*0.05); g.lineTo(-L*0.26,-U*0.05); g.lineTo(-L*0.16,U*0.38); g.lineTo(-L*0.2,U*0.02); g.lineTo(-L*0.14,U*0.02); g.closePath(); g.fill();
      nameText(g,'BLITZ',L*0.08,0,L*0.42,Math.round(U*0.5),FNT.bun,'#1b2a6a'); }); }),
  /* Popper-Kappe: Papier mit Konfettipunkten */
  kappe:()=>kfDruckMat('kappe',64,64,(g,W,H)=>{ g.fillStyle='#f6f1e4'; g.fillRect(0,0,W,H); const F=['#d8322a','#2f7fd0','#2f9e57','#ffd23f','#c050c0'];
    for(let i=0;i<40;i++){ g.fillStyle=F[i%5]; g.fillRect(Math.random()*W,Math.random()*H,4,3); } })
};

/* ---------- Bausteine ---------- */
const kfV=new THREE.Vector3(), kfY=new THREE.Vector3(0,1,0);
function kfAchsM(x,y,z,d){ const q=new THREE.Quaternion().setFromUnitVectors(kfY,kfV.set(d[0],d[1],d[2]).normalize()); return new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(1,1,1)); }
function kfFarbMat(){ return klMat('kf_vc',()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.7,emissive:new THREE.Color(0.06,0.06,0.06)})); }
function kfMetMat(){ return klMat('kf_vcm',()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.35,metalness:0.55,emissive:new THREE.Color(0.08,0.08,0.08)})); }
function kfMesh(geo,mat,m){ const x=new THREE.Mesh(geo,mat); if(m) x.applyMatrix4(m); x.userData.geoFest=true; x.castShadow=true; x.receiveShadow=true; return x; }
/* Huelse mit Druck, liegend: Achse in der Waagerechten (Drehung ry um y),
   Mitte (x,r,z); dazu Endkappen und Zuendschnur am hinteren Ende */
function kfHuelse(g,key,druck,r,L,x,z,ry,o){ o=o||{};
  const geo=kqGeo('kfh_'+key,()=>{ const c=new THREE.CylinderGeometry(r,r,L,12,1,true); c.rotateZ(Math.PI/2); return c; });
  const kap=kqGeo('kfk_'+key,()=>{ const p=[]; for(const s of [-1,1]) p.push({geo:new THREE.CircleGeometry(r,10),m:tm(s*L/2,0,0,0,s*Math.PI/2,0),color:o.kappe||0x9a8f80});
    /* Zuendschnur: gruen, aus der Kappe schraeg nach oben */
    const sl=o.lunte||0.03; p.push({geo:new THREE.CylinderGeometry(o.ld||0.0012,o.ld||0.0012,sl,5),m:tm(-L/2-sl*0.42,sl*0.25,0,0,0,Math.PI/2-0.52),color:0x3fbf4f});
    if(o.spitze) p.push({geo:new THREE.SphereGeometry(o.ld*1.6,6,4),m:tm(-L/2-sl*0.84,sl*0.5,0),color:o.spitze});
    return merge(p); });
  const h=new THREE.Group(); h.position.set(x,r,z); h.rotation.y=ry||0;
  const hm=kfMesh(geo,druck); hm.rotation.x=o.roll===undefined?0.6:o.roll; h.add(hm); h.add(kfMesh(kap,kfFarbMat())); g.add(h); return h; }

/* ---------- Modelle je Produkt (Gruppe, Ursprung = Tischflaeche) ---------- */
const KF_BAU={
  knallerbsen(g){
    /* Saegemehl-Haeufchen, darauf 30 Papiererbsen (jede dritte rosa wie
       im Effekt), in acht Handvoll - so wie sie geworfen werden */
    g.add(kfMesh(kqGeo('kf_saege',()=>{ const c=new THREE.CylinderGeometry(0.026,0.058,0.014,12); c.translate(0,0.007,0); return merge([{geo:c,m:tm(0,0,0),color:0xb88c52}]); }),kfFarbMat()));
    const geos=kqGeo('kf_erbsen',()=>{ const R=zufallAus(hashStr('erbsen')); let i=0;
      return KF_HAND.map(n=>{ const p=[]; for(let k=0;k<n;k++,i++){ const a=R()*6.283, rr=Math.sqrt(R())*0.04, x=Math.cos(a)*rr, z=Math.sin(a)*rr, y=0.014*Math.min(1,(0.058-rr)/0.032)+0.0045+(R()<0.25?0.006:0);
          const c=i%3===2?0xf2b6c6:0xf4f0e4;
          p.push({geo:new THREE.IcosahedronGeometry(0.0052,0),m:tm(x,y,z,R()*3,R()*3,0,1,0.82,1),color:c});
          p.push({geo:new THREE.ConeGeometry(0.0022,0.006,4),m:tm(x+0.004,y+0.003,z,0,0,-0.9),color:c}); }
        return merge(p); }); });
    g.userData.hand=geos.map(geo=>{ const m=kfMesh(geo,kfFarbMat()); g.add(m); return m; });
    g.userData.hoehe=0.025; },
  partypopper(g){
    /* Holzhalter mit drei Steckloechern; Popper: Kegel aus Folie, schmal
       unten (Zugschnur), oben die Oeffnung mit Papierkappe */
    g.add(kfMesh(kqGeo('kf_pophalter',()=>merge([{geo:new THREE.BoxGeometry(0.235,0.022,0.05),m:tm(0,0.011,0),color:0x9a6a3c},{geo:new THREE.BoxGeometry(0.225,0.006,0.042),m:tm(0,0.025,0),color:0xae7e4c}])),kfFarbMat()));
    const body=kqGeo('kf_popper',()=>{ const pr=[[0.0035,0],[0.005,0.006],[0.0125,0.05],[0.016,0.06],[0.0165,0.066],[0.0145,0.066],[0.0135,0.062]].map(q=>new THREE.Vector2(q[0],q[1])); return new THREE.LatheGeometry(pr,12); });
    const innen=kqGeo('kf_popinnen',()=>{ const c=new THREE.CircleGeometry(0.0138,10); c.rotateX(-Math.PI/2); c.translate(0,0.061,0); return c; });
    const kapGeo=kqGeo('kf_popkappe',()=>{ const c=new THREE.CylinderGeometry(0.0168,0.0168,0.0025,12); c.translate(0,0.0665,0); return c; });
    const F=[0xd9b45a,0xc8282a,0x2a5fb8]; g.userData.pop=[];
    KF_POP.forEach((q,i)=>{ const d=kfPopAchse(q), M=kfAchsM(q.x,KF_POP_H-0.012,0,d);
      const b=kfMesh(body,klMat('kf_popm'+i,()=>new THREE.MeshStandardMaterial({color:LIN(F[i]),metalness:0.6,roughness:0.3,emissive:LIN(F[i]).multiplyScalar(0.18),side:THREE.DoubleSide})),M); g.add(b);
      g.add(kfMesh(innen,kqMat(0x1a1410,{e:0}),M));
      const kap=kfMesh(kapGeo,KF_DRUCK.kappe(),M); g.add(kap);
      /* Zugschnur aus dem Halter nach vorn, Ring am Ende */
      const sx=q.x+(i?(i===1?-0.006:0.006):0), pk=[[q.x,0.02,0.012],[sx,0.018,0.03],[sx,0.004,0.042],[sx+(i-1)*0.004,0.0015,0.075]];
      const sch=kfMesh(kqGeo('kf_popschnur'+i,()=>klRohrGeo(pk,0.0011,4)),kqMat(0xf4f0e4,{e:0.3}));
      const ring=kfMesh(kqGeo('kf_popring',()=>{ const t=new THREE.TorusGeometry(0.0055,0.0012,4,10); t.rotateX(Math.PI/2); return t; }),kqMat(F[i],{e:0.25,m:0.3}),tm(pk[3][0],0.0015,pk[3][2]+0.006));
      g.add(sch); g.add(ring); g.userData.pop.push([kap,sch,ring]); });
    g.userData.hoehe=KF_POP_H+KF_POP_L; },
  knallfrosch(g,t,o){ const L=kfFroschLage({x:0,z:0}), S=1.35, H=KQ_FR.n*KQ_FR.th*S;
    const body=kfMesh(kqFroschGeo(),klMat('kf_frosch',()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.8,emissive:new THREE.Color(0.02,0.08,0.025)})));
    const lunte=kqM(kqGeo('froschlunte',()=>{ const c=new THREE.CylinderGeometry(0.0012,0.0012,0.032,5); c.translate(0,0.016,0); return c; }),kqMat(0x8a8a4a,{e:0.3}),KQ_FR.L/2,KQ_FR.n*KQ_FR.th/2-KQ_FR.th,0,0,0,-1.1);
    const f=kqGruppe(body,lunte); f.scale.setScalar(S); f.rotation.y=L.ry; f.position.set(L.x,H/2,L.z); g.add(f);
    g.userData.hoehe=H; },
  knallbonbon(g){
    for(let i=0;i<4;i++){ const B=KQ_BONBON[i], L=kfBonbonLage({x:0,z:0},i), mat=kqMat(B.farbe,{m:0.45,r:0.32,e:0.3}), band=kqMat(B.band,{e:0.35,m:0.3,r:0.4});
      for(const sg of [-1,1]){ const h=kqGruppe(kqM(kqBonbonGeo(),mat,0,0,0,0,sg<0?Math.PI:0,0),kqM(kqGeo('bonbonband',()=>{ const c=new THREE.TorusGeometry(0.0212,0.0028,4,16); c.rotateY(Math.PI/2); return c; }),band,sg*0.035,0,0));
        h.position.set(L.x,0.021,L.z); h.rotation.y=L.ry; g.add(h); } }
    g.userData.hoehe=0.042; },
  boeller(g){ kfHuelse(g,'furz',KF_DRUCK.furz(),0.0105,0.062,0.004,0,0.25,{lunte:0.034}); g.userData.hoehe=0.021; },
  monsterboeller(g){ kfHuelse(g,'monster',KF_DRUCK.monster(),0.0165,0.1,0.006,0,-0.2,{lunte:0.05,ld:0.0018,kappe:0x2a2a2a,roll:0.9}); g.userData.hoehe=0.033; },
  schwaermer(g){ g.userData.st=[];
    for(let i=0;i<6;i++){ const L=kfFlitzerLage({x:0,z:0},i); g.userData.st.push(kfHuelse(g,'flitzer',KF_DRUCK.flitzer(),0.0055,0.07,L.x,L.z,L.ry-Math.PI/2,{lunte:0.018,ld:0.001,kappe:0xd8322a,roll:0.4+i})); }
    g.userData.hoehe=0.011; },
  blitzknaller(g){ g.userData.st=[];
    for(let i=0;i<6;i++){ const x=[-0.028,0,0.028][i%3]+(i>=3?0.012:0), z=i<3?-0.022:0.022;
      g.userData.st.push(kfHuelse(g,'blitz',KF_DRUCK.blitz(),0.0045,0.045,x,z,(i%2?0.12:-0.1),{lunte:0.02,ld:0.001,kappe:0x2a2a2a,roll:0.3+i*0.7})); }
    g.userData.hoehe=0.009; },
  bodenkreisel(g){ const mat=klMat('kf_kreisel',()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.5,emissive:new THREE.Color(0.12,0.12,0.12)}));
    for(let i=0;i<6;i++){ const L=kfKreiselLage({x:0,z:0},i); g.add(kfMesh(kqKreiselGeo(),mat,tm(L.x,0.004,L.z,0,i*1.1,0))); }
    g.userData.hoehe=0.02; }
};

function kfModell(t){ const f=KF_BAU[t]; if(!f) return null; const g=new THREE.Group(); f(g,t); g.userData.t=t; g.userData.geoFest=true; g.userData.kf=true; return g; }
/* Station / Vorfuehrung: Produkt auf den Platz sl (Tischoberkante sl.y) */
function kfTischAuf(t,sl){ if(!KF_BAU[t]) return null; const g=kfModell(t); if(!g) return null; g.position.set(sl.x,sl.y,sl.z);
  for(let i=KF_AUF.length-1;i>=0;i--) if(!KF_AUF[i].parent) KF_AUF.splice(i,1);
  KF_AUF.push(g); return g; }
function kfBei(o,t){ return KF_AUF.find(g=>g.parent&&g.userData.t===t&&Math.hypot(g.position.x-o.x,g.position.z-o.z)<0.15)||null; }
/* beim Zuenden (kleinZuenden): Ursprung auf die Oberkante des Produkts,
   Teile verschwinden, wenn der Effekt sie uebernimmt */
function kfTischZuenden(t,o){
  const g=kfBei(o,t); if(!g) return o;
  const K=KLEIN[t]||{}, lu=K.lunte||0, weg=(m,s)=>later(Math.max(0,s),()=>{ if(m) m.visible=false; });
  const ph=(K.phasen||[])[0]||{};
  switch(t){
    case 'knallfrosch': case 'knallbonbon': case 'bodenkreisel': weg(g,lu); break;
    case 'boeller': case 'monsterboeller': weg(g,lu); break;
    case 'knallerbsen': { const TK=ph.takt||[0.35], H=g.userData.hand; let ts=0, i=0;
      H.forEach((m,h)=>{ weg(m,lu+ts-0.05); const n=KF_HAND[h]; for(let k=0;k<n;k++,i++) ts+=TK[i%TK.length]; }); break; }
    case 'partypopper': (ph.folge||[]).forEach((f,i)=>{ const P3=g.userData.pop[i%3]; P3.forEach(m=>weg(m,lu+(f.at||0))); }); break;
    case 'schwaermer': { const TK=ph.takt||[0.15,0.15,0.6]; let ts=0; g.userData.st.forEach((m,i)=>{ weg(m,lu+ts); ts+=TK[i%TK.length]; }); break; }
    case 'blitzknaller': (ph.folge||[]).forEach((f,i)=>weg(g.userData.st[i%6],lu+(f.at||0)-0.35)); break;
  }
  return Object.assign({},o,{y:g.position.y+(g.userData.hoehe||0),kf:g});
}
if(typeof window!=='undefined') window.__kfTisch={KF_ARTEN,KF_AUF,kfModell,kfTischAuf};
