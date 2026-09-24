
/* =========================================================
   HUD
   ========================================================= */
function tipText(){
  if(build) return compact?'Objekt anvisieren, greifen, absetzen.':'Umbaumodus: Objekt anvisieren, greifen, drehen, absetzen.';
  if(phase==='after') return compact?'Feierabend: Tag am Türschild beenden.':'Feierabend. Räum in Ruhe auf und beende den Tag am Türschild.';
  for(const [k,txt,short] of TUT){
    if(S.tut[k]) continue;
    if((k==='scan'||k==='pay')&&phase==='closed') continue;
    if(k==='pay'&&!regCustomer()) continue;
    if(k==='clean'&&!dirts.length) continue;
    if(k==='move'&&S.level<3) continue;
    if(k==='lager'&&(S.level<3||!zoneOffen('lager'))) continue;
    /* Im Kiosk kommt die Lieferung vor die Tuer, nicht an die Rampe */
    if(k==='lkw'&&!zoneOffen('lager')) return compact?'Kartons vor der Ladentür reinholen.':'Die Lieferung steht vor der Ladentür auf der gelben Warenannahme. Hol die Kartons rein.';
    if(k==='pick'&&!floorBoxes.length) continue;
    if(k==='fenster'&&windowGrime()<0.35) continue;
    if((k==='launch'||k==='build')&&S.level<4) continue;
    if(k==='phone'&&!S.up.grosskunden) continue;
    if(k==='versand'&&!S.up.grosskunden) continue;
    return compact&&short?short:txt;
  }
  if(phase==='closed') return compact?'Bereit? Türschild umdrehen.':'Wenn du bereit bist: Schild an der Tür umdrehen.';
  return '';
}
let compact=false, tipShown=null, tipT=0;
function setCompact(){
  const c=innerHeight<560||innerWidth<620;
  if(c===compact) return; compact=c; document.body.classList.toggle('compact',c); tipShown=null;
}

let toastLast='', geldAnz=null, geldBlink=0;
function toast(msg,cls){ const box_=$('toasts'); const el=document.createElement('div'); el.className='toast'+(cls?' '+cls:''); el.textContent=msg; box_.appendChild(el); while(box_.children.length>4) box_.removeChild(box_.firstChild); setTimeout(()=>el.remove(),2600); toastLast=msg; }
function updateHUD(){
  $('hDate').textContent=compact?dateShort(S.day):`${dateStr(S.day)} · Jahr ${S.season}`;
  $('hTime').textContent=fmtClock(clock);
  const st=$('hStatus');
  st.textContent=compact
    ?(phase==='closed'?(ruhetag()?'Ruhetag':'zu'):phase==='open'?'offen':phase==='closing'?'letzte Kunden':'Feierabend')
    :(phase==='closed'?(ruhetag()?'Sonntag, Ruhetag':'Geschlossen'):phase==='open'?'Geöffnet bis 22 Uhr':phase==='closing'?'Letzte Kunden':'Feierabend');
  st.classList.toggle('on',phase==='open');
  $('hLevel').textContent=(S.test?'TEST · ':'')+'Level '+S.level;
  { const K=kapitel(), t=`Kapitel ${K.nr} · ${K.name}`; if($('hKap').textContent!==t) $('hKap').textContent=t; }
  /* Geld zaehlt hoch statt zu springen; gruen bei Einnahmen, rot bei Ausgaben */
  if(geldAnz===null||Math.abs(S.money-geldAnz)>50000) geldAnz=S.money;
  const dG=S.money-geldAnz;
  if(Math.abs(dG)>0.004){ geldAnz=Math.abs(dG)<0.02?S.money:geldAnz+dG*0.35;
    const mEl=$('hMoney'); mEl.classList.toggle('plus',dG>0); mEl.classList.toggle('minus',dG<0); geldBlink=0.6; }
  else if(geldBlink>0){ geldBlink-=0.1; if(geldBlink<=0){ $('hMoney').classList.remove('plus','minus'); } }
  $('hMoney').textContent=eur(r2(geldAnz));
  /* Im Dispo soll man es sofort sehen */
  const dispo=S.money<0;
  $('hLoan').textContent=dispo
    ? (compact?'DISPO':`Dispo · Rahmen ${eur(dispoLimit())}`)
    : (S.loan?(compact?'K '+Math.round(S.loan.remaining)+' €':`Kredit ${eur(S.loan.remaining)}`):'');
  $('hLoan').style.color=dispo?'#8a1410':'';
  /* Fortschritt bis zum naechsten Level steckt jetzt im Preisschild */
  const need=xpFor(S.level);
  $('hXp').style.width=clamp(S.xp/need*100,0,100)+'%';
  $('hXpTxt').textContent=compact?`${S.xp}/${need}`:`${S.xp} / ${need} bis Level ${S.level+1}`;
  $('hHype').style.width=hype+'%';
  $('mHype').hidden=compact&&hype<1;
  let chips='';
  const ev=todayEvent(), gl=S.goal;
  if(ev) chips+=`<div class="chip" style="background:rgba(255,210,63,.2);color:var(--signal)">${ev.name}</div>`;
  if(gl&&!gl.done&&!compact) chips+=`<div class="chip">${gl.name} ${Math.round(gl.have)}/${gl.need}</div>`;
  if(serie>=3&&!compact) chips+=`<div class="chip serie">Serie ×${serie}</div>`;
  STAFF.forEach(s=>{ if(S.staff[s.id]) chips+=`<div class="chip">${s.kurz||s.name}</div>`; });
  const el=$('staff'); if(el.innerHTML!==chips) el.innerHTML=chips;
  const ph=$('phone');
  const pt=(typeof phone!=='undefined'&&phone.state==='ringing')?(compact?'Anruf':'Anruf annehmen'+(COARSE?'':' · H')):'';
  if(ph.textContent!==pt) ph.textContent=pt;
  const oel=$('order');
  let ot='';
  if(typeof order!=='undefined'&&order){
    const rest=order.items.filter(it=>it.loaded<it.cartons).map(it=>`${it.cartons-it.loaded}× ${P[it.type].short}`).join(', ');
    const rdy=orderReady();
    ot=order.arrive>0?`${order.name} bestätigt\nAbholung in ${Math.ceil(order.arrive)} s · ${rest}`:`${order.name}: ${rdy}/${orderLeft()} im Lager bereit\n${rest}`;
  }
  if(oel.textContent!==ot) oel.textContent=ot;
  const tp=tipText(), tel=$('tip');
  if(tp!==tipShown){ tipShown=tp; tel.textContent=tp; tel.classList.remove('dim'); tipT=performance.now(); }
  else if(compact&&tp&&performance.now()-tipT>13000) tel.classList.add('dim');
  /* Die Ziel- und Personal-Chips stehen unter dem Tipp. Fest auf 84 px
     lagen sie bei einem vierzeiligen Tipp mitten in dessen Text. */
  { const stE=$('staff'), frei=!tp||tel.classList.contains('dim');
    const top=frei?'':Math.round(tel.getBoundingClientRect().bottom+6)+'px';
    if(stE.style.top!==top) stE.style.top=top; }
  if(laptopOpen){ $('lMoney').textContent=eur(S.money); }
}
function updatePrompt(){
  const p=promptFor(target), el=$('prompt');
  const html=p?((p.a&&!COARSE)?'<kbd>E</kbd>':'')+p.t:(sprayOn&&!build?'<kbd>E</kbd>Sprühen':'');
  if(el.innerHTML!==html) el.innerHTML=html;
  const cr=$('cross'); cr.classList.toggle('hot',!!(p&&p.a)); cr.classList.toggle('move',build);
}

/* Neues Kapitel: grosses Banner, Fanfare, Toast */
let kapT=null;
function kapitelAufstieg(nr){
  const K=KAPITEL[nr-1]; if(!K) return;
  $('kapNr').textContent=`KAPITEL ${K.nr}`; $('kapName').textContent=K.name; $('kapTxt').textContent=K.txt;
  $('kapBanner').classList.add('show');
  sfx.level(); later(0.35,()=>sfx.level());
  clearTimeout(kapT); kapT=setTimeout(()=>$('kapBanner').classList.remove('show'),4200);
  addXP(40,'Neues Kapitel');
}

/* =========================================================
   Rueckmeldung im Laden: schwebende Betraege, Symbole ueber den
   Kunden und eine Serie zufriedener Kunden
   ========================================================= */
const schweber=[];
const _symTex={};
function symbolTex(art){
  if(_symTex[art]) return _symTex[art];
  _symTex[art]=tex(128,128,(g,W,H)=>{ g.clearRect(0,0,W,H);
    const kreis=(c)=>{ g.fillStyle=c; g.beginPath(); g.arc(64,64,54,0,Math.PI*2); g.fill(); g.lineWidth=6; g.strokeStyle='rgba(14,18,38,.85)'; g.stroke(); };
    if(art==='herz'){ kreis('#fff4f6'); g.fillStyle='#e0304a'; g.beginPath(); g.moveTo(64,96);
      g.bezierCurveTo(20,70,26,34,48,36); g.bezierCurveTo(58,37,64,46,64,52); g.bezierCurveTo(64,46,70,37,80,36); g.bezierCurveTo(102,34,108,70,64,96); g.fill(); }
    else if(art==='fehlt'){ kreis('#eef3ff'); g.fillStyle='#2f5d9e'; g.font=BUN(78); g.textAlign='center'; g.textBaseline='middle'; g.fillText('?',64,70); }
    else if(art==='teuer'){ kreis('#fff6e6'); g.fillStyle='#d0622a'; g.font=BUN(62); g.textAlign='center'; g.textBaseline='middle'; g.fillText('€!',64,68); }
    else if(art==='sauer'){ kreis('#ffeceb'); g.fillStyle='#c8322a'; g.font=BUN(80); g.textAlign='center'; g.textBaseline='middle'; g.fillText('!',64,70); }
    else if(art==='stern'){ kreis('#fffbe6'); g.fillStyle='#e8b418'; g.beginPath();
      for(let i=0;i<10;i++){ const r=i%2?18:40, a=-Math.PI/2+i*Math.PI/5; g.lineTo(64+Math.cos(a)*r,66+Math.sin(a)*r); } g.closePath(); g.fill(); }
  });
  return _symTex[art];
}
function schwebe(sprite,pos,dauer){
  sprite.position.set(pos.x,pos.y,pos.z); sprite.renderOrder=12; scene.add(sprite);
  schweber.push({s:sprite,t:0,d:dauer||1.4,y0:pos.y});
}
/* Symbol ueber dem Kopf einer Figur */
function kundenSymbol(g,art){
  if(!g) return;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:symbolTex(art),depthTest:false,transparent:true,toneMapped:false}));
  sp.scale.set(0.42,0.42,1);
  schwebe(sp,{x:g.position.x,y:2.15,z:g.position.z},1.3);
}
/* Betrag, der ueber der Kasse aufsteigt */
function geldSchwebt(pos,betrag,schlecht){
  const t=tex(256,72,(g,W,H)=>{ g.clearRect(0,0,W,H); g.font=BUN(46); g.textAlign='center'; g.textBaseline='middle';
    g.lineWidth=8; g.strokeStyle='rgba(14,18,38,.9)'; const txt=(schlecht?'−':'+')+eur(betrag);
    g.strokeText(txt,W/2,H/2+2); g.fillStyle=schlecht?'#ff7a6a':'#6cf2a8'; g.fillText(txt,W/2,H/2+2); });
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true,toneMapped:false}));
  sp.scale.set(1.1,0.31,1); sp.userData.eigeneTex=true;
  schwebe(sp,{x:pos.x,y:(pos.y||0)+2.35,z:pos.z},1.6);
}
function updateSchweber(dt){
  for(let i=schweber.length-1;i>=0;i--){ const w=schweber[i]; w.t+=dt; const k=w.t/w.d;
    w.s.position.y=w.y0+k*0.9;
    w.s.material.opacity=k<0.7?1:Math.max(0,1-(k-0.7)/0.3);
    if(k>=1){ scene.remove(w.s); if(w.s.userData.eigeneTex&&w.s.material.map) w.s.material.map.dispose(); w.s.material.dispose(); schweber.splice(i,1); } }
}
/* Serie: zufriedene Kunden am Stueck. Wer ohne Wunsch geht oder
   die Geduld verliert, beendet sie. */
let serie=0;
const SERIE_STUFEN=[5,10,20,35,50,75,100];
function serieZufrieden(){
  serie++;
  if(SERIE_STUFEN.indexOf(serie)>=0){
    const bonus=serie*6; addXP(bonus,'Serie');
    toast(`Serie: ${serie} zufriedene Kunden am Stück! +${bonus} XP`,'money'); sfx.level();
  }
}
function serieBricht(){ if(serie>=5) toast(`Serie gerissen nach ${serie} zufriedenen Kunden.`,'bad'); serie=0; }
