
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
    if(k==='lager'&&S.level<3) continue;
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

let toastLast='';
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
  $('hMoney').textContent=eur(S.money);
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
  STAFF.forEach(s=>{ if(S.staff[s.id]) chips+=`<div class="chip">${s.name}</div>`; });
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
