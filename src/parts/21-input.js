
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
function overlayOpen(){ return startOpen||laptopOpen||handyOpen||summaryOpen||pauseOpen||cashOpen||levelOpen||dealOpen||gravOpen||pdaOpen; }
/* =========================================================
   Zuendmodus am Pult (Tom, 25.09.): E am Pult schaltet ihn ein.
   Kein Fenster, keine Kamerafahrt - man schaut sich weiter frei um
   und zuendet mit den Zifferntasten: 1-3 Moerser klein, mittel,
   gross, 4-6 Raketen, 7-9 Zuendtisch. Unten steht eine Leiste, was
   auf welcher Taste liegt. Wer sich vom Pult entfernt, beendet ihn.
   ========================================================= */
/* So weit, wie man das Pult noch anvisieren kann (Strahl 3,3 m plus
   halbe Pultdiagonale) - sonst ging der Modus aus 3,5 m an und im
   selben Augenblick wieder aus */
const ZUEND_REICHWEITE=4.0;
const ZUEND_NAME={moerser:'Mörser',rampe:'Raketen',tisch:'Tisch'};
const ZUEND_ROHR=['klein','mittel','groß'];
function openZuend(){
  if(zuendOpen) return;
  if(!zuendAmPult()){ toast('Näher ans Pult.'); return; }
  zuendOpen=true; document.body.classList.add('zuendan'); renderZuend(); zuendTick();
  toast(COARSE?'Zündpult an: Kanal antippen zündet.':'Zündpult an: Zifferntaste 1–9 zündet den Kanal. E am Pult beendet.');
}
function closeZuend(){ if(!zuendOpen) return; zuendOpen=false; $('zuend').classList.remove('show'); document.body.classList.remove('zuendan');
  /* ein Levelaufstieg waehrend der Show wartet bis hierher */
  if(typeof pendingLevels!=='undefined'&&pendingLevels.length&&(phase==='closed'||phase==='after')) showLevelUp(); }
function zuendAmPult(){ return Math.hypot(pl.x-PULT_POS.x,pl.z-PULT_POS.z)<=ZUEND_REICHWEITE; }
/* jeden Schritt: Leiste nur, solange nichts anderes offen ist; wer
   weggeht, verlaesst das Pult */
function zuendTick(){
  if(!zuendOpen) return;
  if(!zuendAmPult()){ closeZuend(); return; }
  $('zuend').classList.toggle('show',!overlayOpen());
}
function renderZuend(){
  if(!zuendOpen) return;
  const ks=alleKanaele();
  let html='';
  for(const id of KANAL_REIHE){
    const reihe=ks.filter(e=>e.st.id===id); if(!reihe.length) continue;
    html+=`<div class="zgruppe"><h4>${ZUEND_NAME[id]}</h4><div class="zreihe">`+reihe.map(e=>{
      const it=e.it, zu=it?it.state:'leer';
      const txt=it?P[it.type].short:(id==='moerser'?'Rohr '+ZUEND_ROHR[e.slot]:'leer');
      return `<div class="kan ${zu}" data-k="${e.kanal}" title="${txt}"><kbd>${e.kanal}</kbd><span>${zu==='brennt'?'brennt …':txt}</span></div>`;
    }).join('')+`</div></div>`;
  }
  $('zGruppen').innerHTML=html;
  const n=bereitCount(), br=placedCount()-n;
  $('zInfo').textContent=n?`${n} ${n===1?'Kanal':'Kanäle'} scharf`+(br?` · ${br} brennt`:''):br?`${br} brennt …`:'Nichts aufgebaut';
  $('zTipp').innerHTML=COARSE?'Kanal antippen zündet genau diesen Platz.'
    :'<kbd>1</kbd>–<kbd>9</kbd> zünden · <kbd>Enter</kbd> alle nacheinander · <kbd>Leertaste</kbd> alle gleichzeitig · <kbd>E</kbd> am Pult: beenden';
  /* Touch hat keine Enter- und Leertaste: dort zwei Knoepfe */
  $('zAlle').innerHTML=COARSE&&n?'<button class="ghost" data-all="0">Alle nacheinander</button><button data-all="1">Alle gleichzeitig</button>':'';
}
/* Am Touchgeraet gibt es keine Zifferntasten: dort zuendet Antippen */
$('zuend').addEventListener('click',e=>{
  if(!COARSE) return;
  const a=e.target.closest('[data-all]'); if(a){ ac(); zuendeAlle(a.dataset.all==='1'); return; }
  const b=e.target.closest('[data-k]'); if(!b) return; ac();
  if(b.classList.contains('bereit')) zuendeKanal(+b.dataset.k);
});
/* Die Steuerung steht im Pausenmenue und nicht mehr dauernd im
   Bild. Esc haelt das Spiel an und zeigt sie. */
const STEUER_PC=[
  ['Bewegen',[
    [['W','A','S','D'],'Laufen (auch Pfeiltasten)'],
    [['Shift'],'Rennen'],
    [['Maus'],'Umsehen']]],
  ['Handeln',[
    [['E','Klick'],'Aktion – halten wiederholt (einräumen, scannen, putzen)'],
    [['Q','Rechts'],'Karton abstellen, Paket auspacken'],
    [['K'],'Sackkarre / Wagen holen, wegstellen (nach Kauf)'],
    [['Tab'],'Handy: Onlineshop, Team, Werbung, Bank, Bericht, Ziele'],
    [['H'],'Anruf annehmen, wenn es klingelt']]],
  ['Werkzeuge',[
    [['T'],'Preisgerät (ab Level 2)'],
    [['G'],'Pfefferspray (ab Level 4)']]],
  ['Zündpult',[
    [['E'],'Zündmodus am Pult'],
    [['1…9'],'Kanal zünden'],
    [['Enter'],'Alle nacheinander'],
    [['Leer'],'Alle gleichzeitig']]],
  ['Umbau',[
    [['F'],'Umbaumodus an / aus'],
    [['E'],'Möbel greifen, absetzen'],
    [['R'],'Gegriffenes drehen'],
    [['Q','Rechts'],'Greifen abbrechen']]],
  ['Sonstiges',[
    [['P'],'Bildeffekte an / aus'],
    [['M'],'Musik an / aus'],
    [['N'],'Nächstes Musikstück'],
    [['Esc'],'Pausenmenü']]]
];
const STEUER_TOUCH=[
  ['Bewegen',[
    [['links'],'Ziehen zum Laufen'],
    [['rechts'],'Wischen zum Umsehen']]],
  ['Knöpfe',[
    [['Aktion'],'Aktion – halten zum Putzen'],
    [['Ablegen'],'Karton abstellen, Greifen abbrechen'],
    [['Umbau'],'Umbaumodus an / aus'],
    [['Handy'],'Onlineshop, Team, Werbung, Bank, Bericht, Ziele'],
    [['Karre'],'Sackkarre / Wagen (erscheint nach dem Kauf)'],
    [['Menü'],'Pausenmenü: Steuerung, Musik, Tutorial, Startbildschirm'],
    [['Preis'],'Preisgerät (ab Level 2)'],
    [['Spray'],'Pfefferspray (ab Level 4)']]]
];
function renderSteuer(){
  const hb=$('handbuch'); if(hb) hb.innerHTML=handbuchHTML();
  const L=COARSE?STEUER_TOUCH:STEUER_PC;
  $('steuer').innerHTML=L.map(([titel,zeilen])=>`<div class="grp"><div class="sub">${titel}</div>`+
    zeilen.map(([k,t])=>`<div class="z"><div class="k">${k.map(x=>`<kbd>${x}</kbd>`).join('')}</div><div>${t}</div></div>`).join('')+
    `</div>`).join('');
}
function tutKnopf(){ const b=$('pTut'); if(b) b.textContent=tutorialAn()?'Tutorial ausblenden':'Tutorial einblenden'; }
/* Pausenmenue (Tom, 26.09.): Hauptmaske mit Weiterspielen, Steuerung,
   Musik, Tutorial und Startbildschirm - Steuerung und Musik sind
   eigene Masken. Esc auf einer Unterseite fuehrt zurueck. */
function pauseSeite(id){
  document.querySelectorAll('#pause .pseite').forEach(el=>el.classList.toggle('on',el.id===id));
  if(id==='pSteuer'){ renderSteuer(); const sc=document.querySelector('#pSteuer .pscroll'); if(sc) sc.scrollTop=0; }
  if(id==='pMusikSeite'){ musikAnzeige(); musikTitel(); }
  if(id==='pHaupt') tutKnopf();
}
function pauseSeiteAktiv(){ const el=document.querySelector('#pause .pseite.on'); return el?el.id:'pHaupt'; }
function showPause(){ if(overlayOpen()) return; pauseSeite('pHaupt'); musikAnzeige(); pauseOpen=true; paused=true;
  /* Maus freigeben - sonst gehen Klicks auf die Spielflaeche statt ins Menue */
  if(locked) document.exitPointerLock(); for(const k in keys) keys[k]=false; mouseDown=false; $('pause').classList.add('show'); }
function closePause(){ if(!pauseOpen) return; pauseOpen=false; paused=false; $('pause').classList.remove('show'); requestLock(); }
$('pBtn').addEventListener('click',()=>closePause());
$('pause').addEventListener('click',e=>{
  const b=e.target.closest('[data-pseite]'); if(b){ pauseSeite(b.dataset.pseite); return; }
  if(e.target.closest('.pzur')) pauseSeite('pHaupt');
});
$('pHome').addEventListener('click',()=>zumStartbildschirm());
$('pTitel').addEventListener('click',e=>{ const b=e.target.closest('[data-stueck]'); if(b) musikWahl(+b.dataset.stueck); });
/* Musik: Taste M und Regler im Pausenmenue. Der Knopf oben links
   ist raus (Tom, 25.09.). */
$('pMusikAn').addEventListener('click',()=>{ ac(); musikAn(); });
$('pMusikWeiter').addEventListener('click',()=>{ ac(); if(!MUSIK.an) musikAn(true); else musikWeiter(false); });
$('pMusikVol').addEventListener('input',e=>{ ac(); musikVol(+e.target.value/100); });
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===canvas;
  if(locked) lockWorked=true;
  /* Kommt die Sperre erst an, wenn schon wieder ein Fenster offen ist
     (Weiterspielen und gleich wieder Esc), sofort freigeben - sonst
     gehen die Klicks auf die Spielflaeche statt ins Menue */
  if(locked){ if(overlayOpen()) document.exitPointerLock(); return; }
  if(lockWorked&&!COARSE&&!overlayOpen()){ mouseDown=false; showPause(); }
});
document.addEventListener('pointerlockerror',()=>{ lockFailed=true; dragHint(); });
canvas.addEventListener('mousedown',e=>{
  if(!S||overlayOpen()) return; ac();
  if(!locked&&!lockFailed) requestLock();
  /* Ohne Mauszeiger-Sperre schaut man per Klicken und Ziehen: der
     Klick aufs Pult darf den Zuendmodus dann nicht wieder beenden -
     das macht nur E */
  if(e.button===0){ mouseDown=true; if(!(zuendOpen&&target&&target.kind==='pult')) pressAction(); } else if(e.button===2){ if(build&&grabbed) cancelGrab(); else dropBox(); }
});
addEventListener('mouseup',e=>{ if(e.button===0) mouseDown=false; });
addEventListener('mousemove',e=>{ if(overlayOpen()) return; if(locked) look(e.movementX,e.movementY,0.0022); else if(mouseDown&&(lockFailed||!lockWorked)) look(e.movementX||0,e.movementY||0,0.004); });
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
  /* Zuendmodus: Ziffern zuenden, alles andere geht normal weiter -
     laufen, umsehen, E. Esc ohne Mauszeiger-Sperre beendet ihn. */
  if(zuendOpen&&S&&!overlayOpen()){
    const m=/^(Digit|Numpad)([1-9])$/.exec(e.code);
    if(m){ e.preventDefault(); if(!e.repeat) zuendeKanal(+m[2]); return; }
    if(e.code==='Enter'){ e.preventDefault(); if(!e.repeat) zuendeAlle(false); return; }
    if(e.code==='Space'){ e.preventDefault(); if(!e.repeat) zuendeAlle(true); return; }
    if(e.code==='Escape'&&!locked){ closeZuend(); return; }
  }
  /* Esc: Pause an und wieder aus. Mit Mauszeiger-Sperre faengt der
     Browser das erste Esc selbst ab und gibt die Maus frei - dann
     oeffnet der pointerlockchange-Handler die Pause. */
  /* Zweites Esc schliesst die Pause nur ohne Mauszeiger-Sperre.
     Mit Sperre muss man klicken: direkt nach dem Freigeben laesst
     der Browser die Maus nicht per Taste wieder einfangen, und ein
     Fehlschlag wuerde dauerhaft auf Ziehen-zum-Umsehen umstellen. */
  if(e.code==='Escape'&&pauseOpen){ if(pauseSeiteAktiv()!=='pHaupt'){ pauseSeite('pHaupt'); return; } if(!lockWorked||lockFailed) closePause(); return; }
  if(e.code==='Escape'&&S&&!overlayOpen()){ showPause(); return; }
  if(!S||overlayOpen()) return;
  keys[e.code]=true;
  if(e.code==='KeyE'&&!e.repeat) pressAction();
  if(e.code==='KeyQ'&&!e.repeat){ if(build&&grabbed) cancelGrab(); else dropBox(); }
  if(e.code==='KeyF'&&!e.repeat) toggleBuild();
  if(e.code==='KeyG'&&!e.repeat) toggleSpray();
  if(e.code==='KeyT'&&!e.repeat) togglePDA();
  if(e.code==='KeyK'&&!e.repeat) toggleKarre();
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
$('pTut').addEventListener('click',()=>{ setTutorial(!tutorialAn()); tutKnopf(); });
$('btnKarre').addEventListener('touchstart',e=>{ e.preventDefault(); if(!S||overlayOpen()) return; ac(); toggleKarre(); },{passive:false});
$('btnKarre').addEventListener('click',e=>{ if(COARSE) return; ac(); toggleKarre(); });
$('btnHandy').addEventListener('touchstart',e=>{ e.preventDefault(); if(!S||(overlayOpen()&&!handyOpen)) return; ac(); toggleHandy(); },{passive:false});
$('btnHandy').addEventListener('click',e=>{ if(COARSE) return; ac(); toggleHandy(); });
/* Am Touchgeraet gab es keinen Weg ins Pausenmenue (kein Esc) */
$('btnMenu').addEventListener('touchstart',e=>{ e.preventDefault(); if(!S||overlayOpen()) return; ac(); showPause(); },{passive:false});
$('btnPda').addEventListener('click',e=>{ if(COARSE) return; ac(); togglePDA(); });
$('pdaClose').addEventListener('click',()=>closePDA());
$('pdaBody').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b||b.disabled||!pdaItem) return; const a=b.dataset.a, t=pdaItem;
  if(a==='pp'){ S.prices[t]=Math.max(0.1,r2(S.prices[t]+parseFloat(b.dataset.d))); allLevels().forEach(l=>{ if(l.type===t) updateLabel(l); }); sfx.beep(); }
  else if(a==='pm'){ S.prices[t]=P[t].market; allLevels().forEach(l=>{ if(l.type===t) updateLabel(l); }); sfx.beep(); }
  else if(a==='po'){ cartAdd(t,+b.dataset.n,b.dataset.s); }
  renderPDA(); drawPDA(true); save();
});
btnMove.addEventListener('touchstart',e=>{ e.preventDefault(); if(!S||overlayOpen()) return; ac(); if(build&&grabbed) rotateGrab(); else toggleBuild(); },{passive:false});
