/* =========================================================
   Zielmarker fuers Tutorial (Tom, 24.09.: "statt Text zu lesen und
   zu suchen, sieht man sofort, wohin man muss")
   Ueber dem Ziel des aktuellen Tipps schwebt ein Pfeil, durch Waende
   sichtbar, mit der Entfernung. Liegt das Ziel ausserhalb des Bildes,
   zeigt ein Pfeil am Bildrand die Richtung.
   Wer kein Tutorial will, schaltet es beim Start oder im Pausenmenue
   ab - dann gibt es weder Tipps noch Marker.
   ========================================================= */
function tutorialAn(){ return !!(S&&!S.tutAus); }
function setTutorial(an){ if(!S) return; S.tutAus=!an; tipShown=null; updateHUD(); save(); }

const _zv=new THREE.Vector3();
function weltPos(o){ if(!o) return null; o.updateMatrixWorld&&o.updateMatrixWorld(); o.getWorldPosition(_zv); return {x:_zv.x,y:_zv.y,z:_zv.z}; }
function naechstes(liste,pos){ let b=null,bd=1e9; for(const x of liste){ if(!x) continue; const d=Math.hypot(x.x-pl.x,x.z-pl.z); if(d<bd){ bd=d; b=x; } } return b; }
/* Wohin zeigt der Pfeil beim Tipp k? null = kein Marker */
function zielFuer(k){
  switch(k){
    case 'shelf': case 'order': case 'ende': return weltPos(lapHit);
    case 'lkw':
      if(!zoneOffen('lager')) return {x:WA.x,y:0.6,z:WA.z};
      if(truck&&truck.g) return weltPos(truck.g);
      return null;
    case 'pick': return naechstes(floorBoxes.map(b=>({x:b.mesh.position.x,y:b.mesh.position.y+0.3,z:b.mesh.position.z})));
    case 'stock': {
      if(S.carrying){ const l=emptyLevel(S.carrying.type); return l?weltPos(l.hit):null; }
      return naechstes(floorBoxes.map(b=>({x:b.mesh.position.x,y:b.mesh.position.y+0.3,z:b.mesh.position.z})));
    }
    case 'open': return weltPos(doorSign);
    case 'scan': return belt.length?weltPos(belt[0].m||belt[0].mesh||null)||weltPos(posHit):weltPos(posHit);
    case 'pay': return weltPos(posHit);
    case 'lager': return racks.length?naechstes(racks.map(r=>weltPos(r.g))):null;
    case 'clean': return naechstes(dirts.map(d=>({x:d.m.position.x,y:0.1,z:d.m.position.z})));
    case 'launch': case 'build': return weltPos(pultHit);
    default: return null;
  }
}

let zielG=null, zielSp=null, zielTxt=null, zielTex=null, zielPh=0, zielZuletzt='';
function zielBauen(){
  if(zielG) return;
  zielG=new THREE.Group(); zielG.visible=false; zielG.renderOrder=30; scene.add(zielG);
  /* Pfeil: Canvas-Sprite mit fester Bildschirmgroesse */
  const t=tex(128,160,(g,W,H)=>{
    g.clearRect(0,0,W,H);
    const gr=g.createRadialGradient(W/2,H*0.42,4,W/2,H*0.42,W*0.5);
    gr.addColorStop(0,'rgba(255,210,63,.55)'); gr.addColorStop(1,'rgba(255,210,63,0)');
    g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.beginPath(); g.moveTo(W*0.18,H*0.22); g.lineTo(W*0.82,H*0.22); g.lineTo(W*0.5,H*0.78); g.closePath();
    g.fillStyle='#ffd23f'; g.fill(); g.lineWidth=7; g.strokeStyle='#1b1300'; g.stroke();
    g.beginPath(); g.moveTo(W*0.3,H*0.3); g.lineTo(W*0.5,H*0.6); g.lineTo(W*0.7,H*0.3); g.lineWidth=3; g.strokeStyle='rgba(255,255,255,.7)'; g.stroke();
  });
  zielSp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,depthWrite:false,transparent:true,toneMapped:false,sizeAttenuation:false}));
  zielSp.scale.set(0.085,0.106,1); zielSp.renderOrder=30; zielG.add(zielSp);
  /* Entfernung darunter */
  zielTex=tex(160,56,()=>{});
  zielTxt=new THREE.Sprite(new THREE.SpriteMaterial({map:zielTex,depthTest:false,depthWrite:false,transparent:true,toneMapped:false,sizeAttenuation:false}));
  zielTxt.scale.set(0.12,0.042,1); zielTxt.renderOrder=30; zielG.add(zielTxt);
}
function zielText(s){
  if(s===zielZuletzt) return; zielZuletzt=s;
  const c=zielTex.image, g=c.getContext('2d'); g.clearRect(0,0,c.width,c.height);
  g.fillStyle='rgba(14,18,38,.82)'; if(g.roundRect){ g.beginPath(); g.roundRect(8,6,c.width-16,c.height-12,20); g.fill(); } else g.fillRect(8,6,c.width-16,c.height-12);
  g.fillStyle='#ffd23f'; g.font=BAR(44); g.textAlign='center'; g.textBaseline='middle'; g.fillText(s,c.width/2,c.height/2+2);
  zielTex.needsUpdate=true;
}
let zielAktuell=null;
function updateZiel(dt){
  if(!S) return;
  zielBauen();
  const pf=$('zielPfeil');
  const k=(tutorialAn()&&!build&&!overlayOpen())?tipKey:null;
  const p=k?zielFuer(k):null;
  zielAktuell=p?{k,x:p.x,y:p.y,z:p.z}:null;
  if(!p){ zielG.visible=false; if(pf) pf.style.display='none'; return; }
  const d=Math.hypot(p.x-pl.x,p.z-pl.z);
  /* ganz nah dran braucht man keinen Pfeil mehr */
  if(d<1.4){ zielG.visible=false; if(pf) pf.style.display='none'; return; }
  zielPh+=dt*3.2;
  zielG.visible=true;
  zielG.position.set(p.x,p.y+0.75+Math.sin(zielPh)*0.12,p.z);
  /* Beschriftung unter dem Pfeil, auf jede Entfernung gleich weit weg */
  zielSp.position.set(0,0,0); zielTxt.position.set(0,-0.075*d*Math.tan(camera.fov*Math.PI/360)*2,0);
  zielText(Math.round(d)+' m');
  /* ausserhalb des Bildes: Pfeil am Rand */
  if(!pf) return;
  camera.updateMatrixWorld(); _zv.set(p.x,p.y+0.5,p.z).project(camera);
  const hinten=_zv.z>1, drin=!hinten&&Math.abs(_zv.x)<0.92&&Math.abs(_zv.y)<0.9;
  if(drin){ pf.style.display='none'; return; }
  let x=_zv.x, y=_zv.y; if(hinten){ x=-x; y=-y; }
  const a=Math.atan2(y,x), r=0.86, W=innerWidth, H=innerHeight;
  const m=Math.max(Math.abs(Math.cos(a))/r,Math.abs(Math.sin(a))/r);
  const px=W/2+Math.cos(a)/m*W/2, py=H/2-Math.sin(a)/m*H/2;
  pf.style.display='block'; pf.style.left=px+'px'; pf.style.top=py+'px';
  pf.style.transform=`translate(-50%,-50%) rotate(${-a+Math.PI/2}rad)`;
}
