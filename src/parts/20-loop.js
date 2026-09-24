
/* =========================================================
   Tageszeit, Himmel, Schnee
   ========================================================= */
const SKY={top:[LIN(0x5d97d6),LIN(0x3a3f86),LIN(0x050817)],hor:[LIN(0xd6e7f5),LIN(0xf19a68),LIN(0x18203f)]};
const _c1=new THREE.Color(), _c2=new THREE.Color(), _c3=new THREE.Color();
let lastF=-1;
function mix3(arr,f,out){ if(f<0.5) return out.copy(arr[0]).lerp(arr[1],f*2); return out.copy(arr[1]).lerp(arr[2],(f-0.5)*2); }
function applyTOD(){
  const f=clamp((clock-960)/100,0,1);
  if(Math.abs(f-lastF)<0.002) return; lastF=f;
  mix3(SKY.top,f,_c1); mix3(SKY.hor,f,_c2);
  const pos=skyGeo.attributes.position, colA=skyGeo.attributes.color;
  for(let i=0;i<pos.count;i++){ const y=pos.getY(i)/SKY_R, k=y<0?0:Math.pow(y,0.55); _c3.copy(_c2).lerp(_c1,k); if(y<0) _c3.multiplyScalar(0.6); colA.setXYZ(i,_c3.r,_c3.g,_c3.b); }
  colA.needsUpdate=true; scene.fog.color.copy(_c2);
  sun.intensity=1.6*(1-f)+0.05; hemi.intensity=0.72*(1-f)+0.16;
  starsMat.opacity=clamp((f-0.6)/0.4,0,1);
  houseMats.forEach(m=>m.emissiveIntensity=f*0.9); lampMats.forEach(m=>m.emissiveIntensity=f*3); yardLight.intensity=f*1.4;
}
/* Wanduhr laeuft nach der Spielzeit: clock sind Minuten seit Mitternacht */
function updateUhr(){
  if(!uhrStd) return;
  const min=clock%720, sek=(performance.now()*0.001)%60;
  uhrStd.rotation.z=-(min/720)*Math.PI*2;
  uhrMin.rotation.z=-((clock%60)/60)*Math.PI*2;
  uhrSek.rotation.z=-(sek/60)*Math.PI*2;
}
/* Alle ueberdachten Bereiche, aus dem Grundriss abgeleitet. Vorher
   stand die Liste als drei feste Rechtecke hier im Code und kannte
   nur Basisladen und Basislager - in jede neue Halle schneite es
   hinein. */
let _daecher=null;
function dachBereiche(){
  if(_daecher) return _daecher;
  _daecher=[];
  const r=(a2,h)=>{ if(a2) _daecher.push({x0:a2.x0-0.3,x1:a2.x1+0.3,z0:a2.z0-0.3,z1:a2.z1+0.3,h:h+0.4}); };
  r(LAY.basis,WH); r(LAY.ost1,WH); r(LAY.ost2,WH); r(LAY.sued,WH);
  r(LAY.lbasis,LAGER_H); r(LAY.lnord,LAGER_H); r(LAY.ls1,LAGER_H); r(LAY.ls2,LAGER_H); r(LAY.ls3,LAGER_H);
  r(LAY.lwest,GH_H); r(LAY.schleuse,SCHLEUSE_H);
  /* Die Hallen haben ihr Dach von Anfang an, auch solange sie
     gesperrt sind. Der Gang nicht: sein Dach kommt erst mit dem
     Grosshandel. Bis dahin ist der Streifen hinter dem Laden
     Hof - dort schneit es, und dort gehoert draussen hin. */
  const g=_daecher.length;
  r({x0:GANG.x0,x1:GANG.x1,z0:GANG.z0,z1:GANG.z1},GANG.h);
  _daecher[g].zone='lager_west';
  return _daecher;
}
function unterDach(x,y,z){
  for(const d of dachBereiche())
    if(y<d.h&&x>d.x0&&x<d.x1&&z>d.z0&&z<d.z1&&(!d.zone||zoneOffen(d.zone))) return true;
  return false;
}
function updateSnow(dt){
  const a=snowPts.geometry.attributes.position, arr=a.array, t=performance.now()*0.001;
  /* Die Wolke haengt am Spieler, sonst schneit es auf dem gewachsenen
     Grundstueck nur noch ueber der alten Kartenmitte. Gerastert, damit
     sie beim Gehen nicht mitzittert. */
  const cx=Math.round(pl.x/6)*6, cz=Math.round(pl.z/6)*6;
  for(let i=0;i<arr.length;i+=3){
    arr[i+1]-=dt*(0.55+((i*13)%7)*0.05); arr[i]+=Math.sin(t+i)*dt*0.12;
    const x=arr[i], z=arr[i+2], y=arr[i+1];
    const weg=Math.abs(x-cx)>40||Math.abs(z-cz)>40;
    if(y<0||weg||unterDach(x,y,z)){
      arr[i]=cx+rand(-34,34); arr[i+1]=rand(10,15); arr[i+2]=cz+rand(-34,34);
    }
  }
  a.needsUpdate=true;
}
function updateDeko(dt){
  for(const d of dekos){
    if(d.g.userData.rot) d.g.userData.rot.rotation.y+=dt*2.4;
    if(d.g.userData.bulbs){ const t=performance.now()*0.002; d.g.userData.bulbs.forEach((m,i)=>m.emissiveIntensity=0.45+0.35*Math.sin(t+i*0.7)); }
  }
}

/* =========================================================
   Hauptschleife
   ========================================================= */
let last=performance.now(), hudT=0, saveT=0, dirtT=0;
function vorDieTuer(){
  const da=pending.filter(pd=>pd.t<=0); if(!da.length) return;
  let n=0, regale=0;
  da.forEach(pd=>{ pending.splice(pending.indexOf(pd),1);
    if(pd.regal){
      /* Regale baut der Lieferant gleich im Laden auf */
      if(regalAufbauen(pd.regal)) regale++;
      else { S.money=r2(S.money+regalPreis(pd.regal)); toast(`${regalName(pd.regal)}: kein Stellplatz frei, der Fahrer nimmt es wieder mit.`,'bad'); }
    } else { spawnFloorBox(pd.type,P[pd.type].box,null,pd.q||1); n++; } });
  statAdd('lkw',1); S.tut.lkw=true;
  sfx.thump(0.8);
  if(n) toast(`Lieferung: ${n} Karton${n>1?'s':''} vor der Ladentür abgestellt.`,'xp');
  if(regale) toast(`Der Lieferant hat ${regale} Regal${regale>1?'e':''} im Laden aufgestellt.`,'money');
}
function step(dt){
  updatePlayer(dt);
  if(build) updateGrab();
  updateDay(dt);
  for(const c of customers.slice()) c.update(dt);
  for(const k in staff) if(staff[k]) staff[k].update(dt);
  updateBelt(dt);
  updatePhone(dt); updateOrder(dt);
  /* Dreck: seit 24.09. etwa zweieinhalbmal seltener (Tom: "weniger
     Fussabdruecke") - frueher im Schnitt alle 114 s, jetzt alle 270 s */
  if(phase==='open'){ dirtT-=dt; if(dirtT<=0){ dirtT=rand(55,95)/((1+customers.length*0.09)*evv('dirt')); if(Math.random()<(hasDeko('muell')?0.14:0.28)) addDirt(rand(-6,6),rand(-4.5,5)); } }
  for(const pd of pending) pd.t-=dt;
  /* Frueher hing alles an der einen Basisrampe: stand dort ein LKW,
     wartete jede weitere Lieferung. Jetzt bekommt die naechste Welle
     die Basisrampe, wenn sie frei ist, sonst eine zugekaufte
     Andockstation in der Westhalle. */
  /* Kiosk ohne Lager: der Lieferant stellt alles vor die Ladentuer */
  if(!zoneOffen('lager')&&pending.some(pd=>pd.t<=0)) vorDieTuer();
  while(zoneOffen('lager')&&pending.some(pd=>pd.t<=0)){
    const frei=!truck?-1:wbayFrei();
    if(truck&&frei<0) break;
    const wave=[];
    for(let i=0;i<pending.length&&wave.length<32;i++) if(pending[i].t<=16) wave.push(pending[i]);
    if(!wave.length) break;
    wave.forEach(w=>pending.splice(pending.indexOf(w),1));
    const sid=wave[0].sup||'mertens', ladung=wave.map(w=>w.regal?{regal:w.regal}:{type:w.type,q:w.q||1});
    if(frei<0) spawnTruck(ladung,sid,supplierOf(sid).name);
    else if(!spawnWTruck(frei,ladung,sid,supplierOf(sid).name)) break;
  }
  updateSonne(pl.x,pl.z);
  updateTruck(dt); updateWBays(dt); updateSchiebetuer(dt); updateVersand(dt); updateSchweber(dt); updateWischen(dt); updateSchoner(dt);
  for(let i=timers.length-1;i>=0;i--){ timers[i].t-=dt; if(timers[i].t<=0){ const fn=timers[i].fn; timers.splice(i,1); fn(); } }
  if(phase==='open') addGrime(dt*0.0016*(1+customers.length*0.05));
  hype=Math.max(0,hype-dt*1.1);
  updateFireworks(dt); updateSnow(dt); updateDeko(dt); updateStadt(dt);
  updateTarget(); holdRepeat(dt); applyTOD(); updateUhr();
  hudT-=dt; if(hudT<=0){ hudT=0.1; updateHUD(); updatePrompt(); if(pdaOn) drawPDA(); if(laptopOpen) updateOnline(); }
  saveT+=dt; if(saveT>25){ saveT=0; save(); }
}
let noLoop=location.hash.indexOf('test')>=0;
function frame(now){
  requestAnimationFrame(frame);
  if(noLoop) return;
  let dt=(now-last)/1000; last=now; if(dt>0.05) dt=0.05;
  if(S&&!paused) step(dt);
  renderFrame(dt);
}
