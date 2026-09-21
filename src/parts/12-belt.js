
/* =========================================================
   Laufband, Kassendisplay, Bargeld
   ========================================================= */
const belt=[], bag=[];
let posLines=[], posStatus='Bereit';
function posReset(){ posLines=[]; }
function drawPOS(){
  if(!posTex) return;
  redraw(posTex,(g,W,H)=>{
    g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W,H); g.scale(W/512,H/360); W=512; H=360;
    g.fillStyle='#0d1a2b'; g.fillRect(0,0,W,H); g.fillStyle='#ffd23f'; g.fillRect(0,0,W,46);
    g.fillStyle='#0e1226'; g.font=BUN(24); g.textBaseline='middle'; g.textAlign='left'; g.fillText('BÖLLERBUDE KASSE',14,24);
    g.font=BAR(28); const lines=posLines.slice(-6);
    lines.forEach((l,i)=>{ g.fillStyle='#e8eef8'; g.textAlign='left'; g.fillText(l.n,16,76+i*34); g.textAlign='right'; g.fillText(eur(l.p),W-16,76+i*34); });
    const tot=posLines.reduce((a,b)=>a+b.p,0);
    g.fillStyle='#1c2d47'; g.fillRect(0,H-104,W,58);
    g.fillStyle='#ffd23f'; g.font=BUN(32); g.textAlign='left'; g.fillText('SUMME',16,H-75); g.textAlign='right'; g.fillText(eur(tot),W-16,H-75);
    g.fillStyle='#8fb4e0'; g.font=BAR(24); g.textAlign='left'; fitFont(g,posStatus,W-30,24,BAR); g.fillText(posStatus,16,H-22);
  });
}
function beltRoom(w){ if(!belt.length) return true; const l=belt[belt.length-1]; return l.x+l.w/2+0.04+w<=BELT_A; }
function syncBeltItem(bi){ const w=ck(bi.x,0);
  if(bi.mesh){ bi.mesh.position.set(w.x,BELT_Y+0.03,w.z); bi.mesh.rotation.y=ckYaw()+Math.PI/2; }
  else bi.h.pool.set(bi.h,mx(w.x,BELT_Y,w.z,ckYaw()+Math.PI));
  bi.hit.position.set(w.x,BELT_Y+P[bi.type].dims[1]/2,w.z); bi.hit.rotation.y=ckYaw(); }
function beltAdd(it,cust){
  const p=P[it.type], w=p.dims[0], x=BELT_A-w/2;
  const bi={type:it.type,price:it.price,cust,x,w,text:it.text||null};
  if(it.text){ bi.mesh=makeEngraved(it.text); scene.add(bi.mesh); }
  else bi.h=pools[it.type].add(mx(0,-99,0,0));
  bi.hit=bbox(w+0.02,p.dims[1]+0.03,p.dims[2]+0.03,hitM,0,0,0,null,false);
  bi.hit.userData={kind:'belt',ref:bi}; belt.push(bi); syncBeltItem(bi);
}
function removeBeltItem(bi){ const i=belt.indexOf(bi); if(i>=0) belt.splice(i,1); if(bi.h) bi.h.pool.remove(bi.h); if(bi.mesh) disposeEngraved(bi.mesh); scene.remove(bi.hit); }
function updateBelt(dt){
  let target=BELT_B, moving=false;
  for(const bi of belt){ const tx=target+bi.w/2; if(bi.x>tx+0.001){ bi.x=Math.max(tx,bi.x-0.55*dt); moving=true; syncBeltItem(bi); } target=bi.x+bi.w/2+0.03; }
  if(moving&&beltTex) beltTex.offset.x+=dt*0.55*6/1.43;
}
function bagPos(k){ return {lx:-1.38+(k%3)*0.27,lz:-0.18+(Math.floor(k/3)%2)*0.32,y:0.95+Math.floor(k/6)*0.09}; }
function syncBag(){ bag.forEach((e,k)=>{ const p=bagPos(k), w=ck(p.lx,p.lz);
  if(e.mesh){ e.mesh.position.set(w.x,p.y,w.z); e.mesh.rotation.y=ckYaw()+(e.jit||0); }
  else e.h.pool.set(e.h,mx(w.x,p.y,w.z,ckYaw()+(e.jit||0))); }); }
function scanBelt(bi){
  const c=bi.cust; if(!c) return;
  removeBeltItem(bi);
  const k=bag.length, p=bagPos(k), w=ck(p.lx,p.lz), jit=rand(-0.5,0.5);
  if(bi.text){ const m=makeEngraved(bi.text); m.position.set(w.x,p.y,w.z); m.rotation.y=ckYaw()+jit; scene.add(m); bag.push({mesh:m,jit}); }
  else { const h=pools[bi.type].add(mx(w.x,p.y,w.z,ckYaw()+jit)); bag.push({h,jit}); }
  c.scanned++; c.total=r2(c.total+bi.price); posLines.push({n:bi.text?('Gravur: '+bi.text):P[bi.type].short,p:bi.price});
  posStatus=c.scanned>=c.items.length&&c.ui>=c.items.length?'Alles gescannt':'Scannen …'; drawPOS();
  sfx.beep(); S.tut.scan=true;
}
function clearBag(){ while(bag.length){ const e=bag.pop(); if(e.h) e.h.pool.remove(e.h); if(e.mesh) disposeEngraved(e.mesh); } }

const DENOMS=[[50,'50 €','n50'],[20,'20 €','n20'],[10,'10 €','n10'],[5,'5 €','n5'],[2,'2 €','c2'],[1,'1 €','c1'],[0.5,'50 ct','c50'],[0.2,'20 ct','c20'],[0.1,'10 ct','c10'],[0.05,'5 ct','c5'],[0.02,'2 ct','c2c'],[0.01,'1 ct','c1c']];
let cashCust=null, cashBack=0, cashOpen=false;
$('denoms').innerHTML=DENOMS.map(d=>`<button class="${d[2]}" data-v="${d[0]}">${d[1]}</button>`).join('');
$('denoms').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; cashBack=r2(cashBack+parseFloat(b.dataset.v)); tone(2200,0.04,'triangle',0.05); renderCash(); });
$('cReset').addEventListener('click',()=>{ cashBack=0; renderCash(); });
$('cDone').addEventListener('click',()=>{ if(!cashCust) return; const c=cashCust; closeCash(true); c.finishCash(cashBack); });
function openCash(c){ cashCust=c; cashBack=0; cashOpen=true; renderCash(); $('cash').classList.add('show'); for(const k in keys) keys[k]=false; mouseDown=false; touchAct=false; if(locked) document.exitPointerLock(); }
function closeCash(relock){ cashOpen=false; $('cash').classList.remove('show'); const c=cashCust; cashCust=null; if(relock) requestLock(); else if(lockWorked&&!COARSE&&!locked&&c) showPause(); }
function renderCash(){ const c=cashCust; if(!c) return; const due=r2(c.given-c.total);
  $('cTotal').textContent=eur(c.total); $('cGiven').textContent=eur(c.given); $('cDue').textContent=eur(due); $('cBack').textContent=eur(cashBack);
  $('cBack').className=cashBack>due+0.001?'no':cashBack>=due-0.001?'ok':''; $('cDone').disabled=cashBack<due-0.001; }
