
/* =========================================================
   Eingabe
   ========================================================= */
let locked=false, lockWorked=false, lockFailed=false, dragHinted=false, dealOpen=false, gravOpen=false;
function dragHint(){ if(dragHinted) return; dragHinted=true; toast('Maus gedrückt halten und ziehen, um dich umzusehen.'); }
function requestLock(){
  if(noLoop||COARSE||lockFailed||!canvas.requestPointerLock) return;
  try{ const r=canvas.requestPointerLock(); if(r&&r.catch) r.catch(()=>{ lockFailed=true; dragHint(); }); }catch(e){ lockFailed=true; dragHint(); }
}
let zuendOpen=false;
function overlayOpen(){ return startOpen||laptopOpen||handyOpen||summaryOpen||pauseOpen||cashOpen||levelOpen||dealOpen||gravOpen||pdaOpen||zuendOpen; }
/* =========================================================
   Bedienfeld am Zuendpult. Es liegt unten im Bild, das Spiel laeuft
   weiter: man zuendet und schaut dabei aufs Testfeld.
   ========================================================= */
function openZuend(){
  if(zuendOpen) return;
  zuendOpen=true; for(const k in keys) keys[k]=false; mouseDown=false; touchAct=false;
  if(locked) document.exitPointerLock();
  /* Blick so, dass unten die Stationen und darueber der Himmel mit
     den Bruechen im Bild sind */
  /* etwas nach rechts versetzt: der Moerser steht rechts und laege
     sonst hinter dem Panel am rechten Rand */
  const m=testfeldMitte(); aimAt(m.x+2.4,m.z,0.42);
  $('zuend').classList.add('show'); renderZuend();
}
function closeZuend(){ if(!zuendOpen) return; zuendOpen=false; $('zuend').classList.remove('show'); requestLock(); }
function renderZuend(){
  if(!zuendOpen) return;
  const ks=alleKanaele(), namen={tisch:'Zündtisch',rampe:'Abschussröhren',moerser:'Mörser'};
  let html='';
  for(const id of KANAL_REIHE){
    const reihe=ks.filter(e=>e.st.id===id); if(!reihe.length) continue;
    html+=`<div class="zgruppe"><h4>${namen[id]}</h4><div class="zreihe">`+reihe.map(e=>{
      const it=e.it, zu=it?it.state:'leer';
      const txt=it?P[it.type].short:'leer';
      return `<button class="kan ${zu}" data-k="${e.kanal}" ${zu==='bereit'?'':'aria-disabled="true"'} title="${txt}"><i>${e.kanal}</i><span>${zu==='brennt'?'brennt …':txt}</span></button>`;
    }).join('')+`</div></div>`;
  }
  $('zGruppen').innerHTML=html;
  const n=bereitCount(), br=placedCount()-n;
  $('zInfo').textContent=n?`${n} ${n===1?'Kanal':'Kanäle'} scharf`+(br?` · ${br} brennt`:''):br?`${br} brennt …`:'Nichts aufgebaut. Ware auf Tisch, Röhren oder Mörser stellen.';
  $('zTipp').textContent=COARSE?'Kanal antippen zündet genau diesen Platz.':'Tasten 1–9 zünden den Kanal, Enter alle nacheinander, Leertaste alle gleichzeitig. Ins Bild klicken und ziehen, um dich umzusehen.';
  $('zNach').disabled=!n; $('zGleich').disabled=!n;
}
$('zuend').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return; ac();
  if(b.id==='zClose'){ closeZuend(); return; }
  if(b.id==='zNach'){ zuendeAlle(false); return; }
  if(b.id==='zGleich'){ zuendeAlle(true); return; }
  if(b.dataset.k&&b.classList.contains('bereit')) zuendeKanal(+b.dataset.k);
});
/* Die Steuerung steht im Pausenmenue und nicht mehr dauernd im
   Bild. Esc haelt das Spiel an und zeigt sie. */
const STEUER_PC=[
  ['Bewegen',[
    [['W','A','S','D'],'Laufen (auch Pfeiltasten)'],
    [['Shift'],'Rennen'],
    [['Maus'],'Umsehen']]],
  ['Handeln',[
    [['E','Klick'],'Aktion – halten zum Putzen'],
    [['Q','Rechts'],'Karton abstellen'],
    [['Tab','H'],'Handy: Onlineshop, Team, Bank, Bericht'],
    [['H'],'Anruf annehmen, wenn es klingelt']]],
  ['Werkzeuge',[
    [['T'],'Preisgerät (ab Level 2)'],
    [['G'],'Pfefferspray (ab Level 4)']]],
  ['Zündpult',[
    [['1…9'],'Kanal zünden'],
    [['Enter'],'Alle nacheinander'],
    [['Leertaste'],'Alle gleichzeitig']]],
  ['Umbau',[
    [['F'],'Umbaumodus an / aus'],
    [['E'],'Möbel greifen, absetzen'],
    [['R'],'Gegriffenes drehen'],
    [['Q'],'Greifen abbrechen']]],
  ['Sonstiges',[
    [['P'],'Bildeffekte an / aus'],
    [['M'],'Musik an / aus'],
    [['N'],'Nächstes Musikstück'],
    [['Esc'],'Pause, diese Übersicht']]]
];
const STEUER_TOUCH=[
  ['Bewegen',[
    [['links'],'Ziehen zum Laufen'],
    [['rechts'],'Wischen zum Umsehen']]],
  ['Knöpfe',[
    [['Aktion'],'Aktion – halten zum Putzen'],
    [['Ablegen'],'Karton abstellen, Greifen abbrechen'],
    [['Umbau'],'Umbaumodus an / aus'],
    [['Handy'],'Onlineshop, Team, Bank, Bericht'],
    [['Preis'],'Preisgerät (ab Level 2)'],
    [['Spray'],'Pfefferspray (ab Level 4)']]]
];
function renderSteuer(){
  const L=COARSE?STEUER_TOUCH:STEUER_PC;
  $('steuer').innerHTML=L.map(([titel,zeilen])=>`<div class="grp"><div class="sub">${titel}</div>`+
    zeilen.map(([k,t])=>`<div class="z"><div class="k">${k.map(x=>`<kbd>${x}</kbd>`).join('')}</div><div>${t}</div></div>`).join('')+
    `</div>`).join('');
}
function showPause(){ if(overlayOpen()) return; renderSteuer(); musikAnzeige(); pauseOpen=true; paused=true; for(const k in keys) keys[k]=false; mouseDown=false; $('pause').classList.add('show'); }
function closePause(){ if(!pauseOpen) return; pauseOpen=false; paused=false; $('pause').classList.remove('show'); requestLock(); }
$('pBtn').addEventListener('click',()=>closePause());
/* Musik: Knopf im Bild (auch am Handy) und Regler im Pausenmenue */
$('musikBtn').addEventListener('click',e=>{ e.stopPropagation(); ac(); musikAn(); });
$('pMusikAn').addEventListener('click',()=>{ ac(); musikAn(); });
$('pMusikWeiter').addEventListener('click',()=>{ ac(); if(!MUSIK.an) musikAn(true); else musikWeiter(false); });
$('pMusikVol').addEventListener('input',e=>{ ac(); musikVol(+e.target.value/100); });
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===canvas;
  if(locked) lockWorked=true;
  else if(lockWorked&&!COARSE&&!overlayOpen()){ mouseDown=false; showPause(); }
});
document.addEventListener('pointerlockerror',()=>{ lockFailed=true; dragHint(); });
/* Bei offenem Zuendpult ist der Mauszeiger frei zum Klicken. Wer
   ins Bild klickt und zieht, schaut sich trotzdem um - nach oben zu
   den Bruechen, nach unten zu den Stationen. */
let zuendZieh=false;
canvas.addEventListener('mousedown',e=>{
  if(zuendOpen){ zuendZieh=true; ac(); return; }
  if(!S||overlayOpen()) return; ac();
  if(!locked&&!lockFailed) requestLock();
  if(e.button===0){ mouseDown=true; pressAction(); } else if(e.button===2){ if(build&&grabbed) cancelGrab(); else dropBox(); }
});
addEventListener('mouseup',e=>{ if(e.button===0) mouseDown=false; zuendZieh=false; });
addEventListener('mousemove',e=>{ if(zuendOpen&&zuendZieh){ aim=null; look(e.movementX||0,e.movementY||0,0.004); return; } if(overlayOpen()) return; if(locked) look(e.movementX,e.movementY,0.0022); else if(mouseDown&&(lockFailed||!lockWorked)) look(e.movementX||0,e.movementY||0,0.004); });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
  if(handyOpen){
    if(e.code==='KeyH'&&!e.repeat&&typeof phone!=='undefined'&&phone.state==='ringing'){ closeHandy(false); answerPhone(); return; }
    if((e.code==='Escape'||e.code==='Tab'||e.code==='KeyH')&&!e.repeat){ e.preventDefault(); closeHandy(true); }
    return; }
  if(e.code==='Escape'&&laptopOpen){ closeLaptop(false); return; }
  if(e.code==='Escape'&&cashOpen){ closeCash(false); return; }
  if(pdaOpen){ if(e.code==='Escape') closePDA(); return; }
  if(gravOpen){ if(e.code==='Escape') closeGravInput(false); if(e.code==='Enter') closeGravInput(true); return; }
  if(dealOpen){ if(e.code==='Escape') declineDeal(); return; }
  if(zuendOpen){
    if(e.code==='Escape'||e.code==='KeyE'||e.code==='Tab'){ e.preventDefault(); closeZuend(); return; }
    const m=/^(Digit|Numpad)(\d)$/.exec(e.code);
    if(m&&!e.repeat){ const n=+m[2]; zuendeKanal(n===0?10:n); return; }
    if(e.code==='Enter'&&!e.repeat){ zuendeAlle(false); return; }
    if(e.code==='Space'){ e.preventDefault(); if(!e.repeat) zuendeAlle(true); return; }
    return;
  }
  /* Esc: Pause an und wieder aus. Mit Mauszeiger-Sperre faengt der
     Browser das erste Esc selbst ab und gibt die Maus frei - dann
     oeffnet der pointerlockchange-Handler die Pause. */
  /* Zweites Esc schliesst die Pause nur ohne Mauszeiger-Sperre.
     Mit Sperre muss man klicken: direkt nach dem Freigeben laesst
     der Browser die Maus nicht per Taste wieder einfangen, und ein
     Fehlschlag wuerde dauerhaft auf Ziehen-zum-Umsehen umstellen. */
  if(e.code==='Escape'&&pauseOpen){ if(!lockWorked||lockFailed) closePause(); return; }
  if(e.code==='Escape'&&S&&!overlayOpen()){ showPause(); return; }
  if(!S||overlayOpen()) return;
  keys[e.code]=true;
  if(e.code==='KeyE'&&!e.repeat) pressAction();
  if(e.code==='KeyQ'&&!e.repeat){ if(build&&grabbed) cancelGrab(); else dropBox(); }
  if(e.code==='KeyF'&&!e.repeat) toggleBuild();
  if(e.code==='KeyG'&&!e.repeat) toggleSpray();
  if(e.code==='KeyT'&&!e.repeat) togglePDA();
  if(e.code==='KeyP'&&!e.repeat) setPost(!postOn);
  if(e.code==='KeyM'&&!e.repeat) musikAn();
  if(e.code==='KeyN'&&!e.repeat){ ac(); if(!MUSIK.an) musikAn(true); else musikWeiter(false); }
  /* H: klingelt es, geht man ran - sonst kommt das Handy heraus */
  if(e.code==='KeyH'&&!e.repeat){ if(typeof phone!=='undefined'&&phone.state==='ringing') answerPhone(); else openHandy(); }
  if(e.code==='KeyR'&&!e.repeat&&build) rotateGrab();
  /* Tab holt das Handy heraus. Der Laptop steht im Buero - dafuer geht man hin. */
  if(e.code==='Tab'&&!e.repeat){ e.preventDefault(); openHandy(); }
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
$('btnHandy').addEventListener('touchstart',e=>{ e.preventDefault(); if(!S||(overlayOpen()&&!handyOpen)) return; ac(); toggleHandy(); },{passive:false});
$('btnHandy').addEventListener('click',e=>{ if(COARSE) return; ac(); toggleHandy(); });
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
