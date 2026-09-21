
/* =========================================================
   Eingabe
   ========================================================= */
let locked=false, lockWorked=false, lockFailed=false, dragHinted=false, dealOpen=false, gravOpen=false;
function dragHint(){ if(dragHinted) return; dragHinted=true; toast('Maus gedrückt halten und ziehen, um dich umzusehen.'); }
function requestLock(){
  if(noLoop||COARSE||lockFailed||!canvas.requestPointerLock) return;
  try{ const r=canvas.requestPointerLock(); if(r&&r.catch) r.catch(()=>{ lockFailed=true; dragHint(); }); }catch(e){ lockFailed=true; dragHint(); }
}
function overlayOpen(){ return startOpen||laptopOpen||summaryOpen||pauseOpen||cashOpen||levelOpen||dealOpen||gravOpen||pdaOpen; }
function showPause(){ if(overlayOpen()) return; pauseOpen=true; paused=true; $('pause').classList.add('show'); }
$('pBtn').addEventListener('click',()=>{ pauseOpen=false; paused=false; $('pause').classList.remove('show'); requestLock(); });
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===canvas;
  if(locked) lockWorked=true;
  else if(lockWorked&&!COARSE&&!overlayOpen()){ mouseDown=false; showPause(); }
});
document.addEventListener('pointerlockerror',()=>{ lockFailed=true; dragHint(); });
canvas.addEventListener('mousedown',e=>{
  if(!S||overlayOpen()) return; ac();
  if(!locked&&!lockFailed) requestLock();
  if(e.button===0){ mouseDown=true; pressAction(); } else if(e.button===2){ if(build&&grabbed) cancelGrab(); else dropBox(); }
});
addEventListener('mouseup',e=>{ if(e.button===0) mouseDown=false; });
addEventListener('mousemove',e=>{ if(overlayOpen()) return; if(locked) look(e.movementX,e.movementY,0.0022); else if(mouseDown&&(lockFailed||!lockWorked)) look(e.movementX||0,e.movementY||0,0.004); });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
  if(e.code==='Escape'&&laptopOpen){ closeLaptop(false); return; }
  if(e.code==='Escape'&&cashOpen){ closeCash(false); return; }
  if(pdaOpen){ if(e.code==='Escape') closePDA(); return; }
  if(gravOpen){ if(e.code==='Escape') closeGravInput(false); if(e.code==='Enter') closeGravInput(true); return; }
  if(dealOpen){ if(e.code==='Escape') declineDeal(); return; }
  if(!S||overlayOpen()) return;
  keys[e.code]=true;
  if(e.code==='KeyE'&&!e.repeat) pressAction();
  if(e.code==='KeyQ'&&!e.repeat){ if(build&&grabbed) cancelGrab(); else dropBox(); }
  if(e.code==='KeyF'&&!e.repeat) toggleBuild();
  if(e.code==='KeyG'&&!e.repeat) toggleSpray();
  if(e.code==='KeyT'&&!e.repeat) togglePDA();
  if(e.code==='KeyP'&&!e.repeat) setPost(!postOn);
  if(e.code==='KeyH'&&!e.repeat) answerPhone();
  if(e.code==='KeyR'&&!e.repeat&&build) rotateGrab();
  if(e.code==='Tab'&&!e.repeat){ e.preventDefault(); openLaptop(); }
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup',e=>{ keys[e.code]=false; });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; mouseDown=false; touchAct=false; });
document.addEventListener('visibilitychange',()=>{ if(document.hidden) save(); });
$('phone').style.pointerEvents='auto';
$('phone').addEventListener('click',()=>{ ac(); answerPhone(); });
$('dHaggle').addEventListener('click',e=>{ const b=e.target.closest('button'); if(b&&!b.disabled) haggle(parseFloat(b.dataset.step)); });
$('dAccept').addEventListener('click',()=>acceptDeal());
$('dDecline').addEventListener('click',()=>declineDeal());
$('gravOk').addEventListener('click',()=>closeGravInput(true));
$('gravCancel').addEventListener('click',()=>closeGravInput(false));
$('gravIn').addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter') closeGravInput(true); });
const joyEl=$('joy'), base=$('joyBase'), knob=$('joyKnob'), lookEl=$('look'), lookT={id:null,x:0,y:0};
joyEl.addEventListener('touchstart',e=>{ e.preventDefault(); ac(); if(joy.id!==null) return; const t=e.changedTouches[0]; joy.id=t.identifier; joy.ox=t.clientX; joy.oy=t.clientY; base.style.display='block'; base.style.left=t.clientX+'px'; base.style.top=t.clientY+'px'; knob.style.transform=''; },{passive:false});
joyEl.addEventListener('touchmove',e=>{ e.preventDefault(); for(const t of e.changedTouches){ if(t.identifier!==joy.id) continue; let dx=t.clientX-joy.ox, dy=t.clientY-joy.oy; const d=Math.hypot(dx,dy), R=50; if(d>R){ dx=dx/d*R; dy=dy/d*R; } joy.x=dx/R; joy.y=dy/R; knob.style.transform=`translate(${dx}px,${dy}px)`; } },{passive:false});
const joyEnd=e=>{ for(const t of e.changedTouches){ if(t.identifier===joy.id){ joy.id=null; joy.x=joy.y=0; base.style.display='none'; } } };
joyEl.addEventListener('touchend',joyEnd); joyEl.addEventListener('touchcancel',joyEnd);
lookEl.addEventListener('touchstart',e=>{ e.preventDefault(); ac(); if(lookT.id!==null) return; const t=e.changedTouches[0]; lookT.id=t.identifier; lookT.x=t.clientX; lookT.y=t.clientY; },{passive:false});
lookEl.addEventListener('touchmove',e=>{ e.preventDefault(); for(const t of e.changedTouches){ if(t.identifier!==lookT.id) continue; if(!overlayOpen()) look(t.clientX-lookT.x,t.clientY-lookT.y,0.0055); lookT.x=t.clientX; lookT.y=t.clientY; } },{passive:false});
const lookEnd=e=>{ for(const t of e.changedTouches) if(t.identifier===lookT.id) lookT.id=null; };
lookEl.addEventListener('touchend',lookEnd); lookEl.addEventListener('touchcancel',lookEnd);
const btnAct=$('btnAct'), btnDrop=$('btnDrop'), btnTool=$('btnTool'), btnMove=$('btnMove');
btnAct.addEventListener('touchstart',e=>{ e.preventDefault(); if(!S||overlayOpen()) return; touchAct=true; btnAct.classList.add('down'); pressAction(); },{passive:false});
const actEnd=e=>{ e.preventDefault(); touchAct=false; btnAct.classList.remove('down'); };
btnAct.addEventListener('touchend',actEnd); btnAct.addEventListener('touchcancel',actEnd);
btnDrop.addEventListener('touchstart',e=>{ e.preventDefault(); if(!S||overlayOpen()) return; ac(); if(build&&grabbed) cancelGrab(); else dropBox(); },{passive:false});
btnTool.addEventListener('touchstart',e=>{ e.preventDefault(); if(!S||overlayOpen()) return; ac(); toggleSpray(); },{passive:false});
$('btnPda').addEventListener('touchstart',e=>{ e.preventDefault(); if(!S||overlayOpen()) return; ac(); togglePDA(); },{passive:false});
$('btnPda').addEventListener('click',e=>{ if(COARSE) return; ac(); togglePDA(); });
$('pdaClose').addEventListener('click',()=>closePDA());
$('pdaBody').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b||b.disabled||!pdaItem) return; const a=b.dataset.a, t=pdaItem;
  if(a==='pp'){ S.prices[t]=Math.max(0.1,r2(S.prices[t]+parseFloat(b.dataset.d))); allLevels().forEach(l=>{ if(l.type===t) updateLabel(l); }); sfx.beep(); }
  else if(a==='pm'){ S.prices[t]=P[t].market; allLevels().forEach(l=>{ if(l.type===t) updateLabel(l); }); sfx.beep(); }
  else if(a==='ps'){ pdaSup=b.dataset.t; }
  else if(a==='po'){ cartAdd(t,+b.dataset.n,pdaSup); }
  renderPDA(); drawPDA(true); save();
});
btnMove.addEventListener('touchstart',e=>{ e.preventDefault(); if(!S||overlayOpen()) return; ac(); if(build&&grabbed) rotateGrab(); else toggleBuild(); },{passive:false});
