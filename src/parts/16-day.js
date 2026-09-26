
/* =========================================================
   Level & Erfahrung
   ========================================================= */
let pendingLevels=[];
function addXP(n,label){
  if(!S||n<=0) return; S.xp+=n; if(DS) DS.xpGained=(DS.xpGained||0)+n;
  if(label) toast(`+${n} XP · ${label}`,'xp');
  let up=false;
  while(S.xp>=xpFor(S.level)){ S.xp-=xpFor(S.level); S.level++; pendingLevels.push(S.level); up=true; }
  if(up){ sfx.level(); toast(`Level ${S.level} erreicht!`,'lvl');
    /* Die Bautafeln zeigen, wie viele Level noch fehlen - das muss
       nach jedem Aufstieg stimmen. */
    if(phase==='closed'||phase==='after') showLevelUp(); }
}
function showLevelUp(){
  /* am Zuendpult unterbricht der Aufstieg die Show nicht - er kommt,
     wenn man das Pult verlaesst */
  if(!pendingLevels.length||overlayOpen()||(typeof zuendOpen!=='undefined'&&zuendOpen)) return;
  const lv=pendingLevels.shift(), list=levelUnlocks(lv);
  $('luTitle').textContent=`Level ${lv}`;
  $('luText').textContent=list.length?'Das ist ab jetzt im Laptop freigeschaltet:':'Weiter so. Die nächste Freischaltung kommt bald.';
  $('luList').innerHTML=list.map(t=>`<div class="sumrow"><span>${t}</span><span>neu</span></div>`).join('');
  $('levelup').classList.add('show'); levelOpen=true; paused=true; if(locked) document.exitPointerLock();
}
let levelOpen=false;
$('luBtn').addEventListener('click',()=>{
  $('levelup').classList.remove('show'); levelOpen=false;
  if(pendingLevels.length){ showLevelUp(); return; }
  /* liegt noch der Tagesabschluss offen, bleibt es dabei (Befund 26.09.) */
  if(summaryOpen) return;
  paused=false; requestLock();
});

/* =========================================================
   Kredit
   ========================================================= */
function loanMax(){ let m=0; LOANS.forEach(l=>{ if(S.level>=l.lvl) m=Math.max(m,l.amount); }); return m; }
function loanTier(){ let t=null; LOANS.forEach(l=>{ if(S.level>=l.lvl) t=l; }); return t; }
function loanDaily(){ const L=S.loan; if(!L||!L.remaining) return 0; return r2(L.amount/L.term+L.remaining*L.rate); }
function takeLoan(amount){
  const t=loanTier(); if(!t||S.loan) return;
  S.loan={amount,remaining:amount,term:t.term,rate:t.rate,paid:0};
  S.money=r2(S.money+amount); sfx.cash(); toast(`Kredit über ${eur(amount)} aufgenommen.`); save();
}
function repayLoan(v){
  const L=S.loan; if(!L) return; const pay=Math.min(v===0?L.remaining:v,L.remaining,S.money);
  if(pay<=0) return;
  S.money=r2(S.money-pay); L.remaining=r2(L.remaining-pay);
  if(L.remaining<=0.01){ S.loan=null; toast('Kredit abbezahlt.','money'); addXP(40,'Kredit getilgt'); }
  else toast(`${eur(pay)} getilgt.`);
  sfx.pop(); save();
}

/* =========================================================
   Tagesablauf
   ========================================================= */
function newDayStats(){ DS={revenue:0,customers:0,sold:0,f2:0,missed:0,angry:0,goods:0,upgrades:0,interest:0,changeLoss:0,stolen:0,caught:0,burned:0,orders:0,gravur:0,versand:0,sb:0,praemien:0,rep0:S.rep,xpGained:0}; }
/* Marktlage: die Preise pro Produkt bewegen sich in 02b-markt.js,
   hier kommt nur noch die Konkurrenz dazu. */
function rollMarket(){
  rollMarkt();
  S.comp=clamp((S.comp||1)*rand(0.95,1.05),0.88,1.12);
}
/* Auf den Marktpreis kommt nur noch das Tagesereignis und der Rabatt */
function ekFactor(){ return evv('ek')*(S.up&&S.up.lizenz?0.9:1); }
function marktText(){ const m=S.mkt||1; return m<0.88?'Markt günstig':m<0.97?'Markt leicht günstig':m<1.05?'Markt normal':m<1.16?'Markt teuer':'Markt sehr teuer'; }
function inflText(){ const i=Math.round((inflOf()-1)*100); return i<=0?'keine':'+'+i+' %'; }
/* Tagesereignis würfeln */
function rollEvent(){
  S.ev=null;
  if(S.day<3) return;
  if(Math.random()<0.34) return;
  let tot=0; EVENTS.forEach(e=>tot+=e.w);
  let r=Math.random()*tot;
  for(const e of EVENTS){ r-=e.w; if(r<=0){ S.ev=e.id; break; } }
  const e=todayEvent(); if(!e) return;
  if(e.rep) rep(e.rep);
  if(e.hype) hype=Math.min(100,hype+e.hype);
}
/* Wochenziel */
function newGoal(){
  const g=pick(GOALS), m=g.mk(S.level);
  S.goal={id:g.id,name:g.name,kind:m.kind,need:m.need,unit:m.unit,have:0,pay:g.pay(S.level),days:7};
}
function goalAdd(kind,n){
  const g=S&&S.goal; if(!g||g.done||g.kind!==kind) return;
  g.have=r2(g.have+n);
  if(g.have>=g.need){ g.done=true;
    S.money=r2(S.money+g.pay); addXP(Math.round(g.pay/3),'Wochenziel geschafft'); sfx.cash();
    toast(`Wochenziel geschafft: ${g.name}. ${eur(g.pay)} Prämie.`,'money'); }
}
function goalTick(){
  if(!S.goal){ newGoal(); return; }
  const g=S.goal;
  if(g.kind==='clean'&&!g.done&&DS.angry===0&&cleanliness()>=75) goalAdd('clean',1);
  g.days--;
  if(g.days<=0||g.done){
    if(!g.done) toast(`Wochenziel verfehlt: ${g.name}.`,'bad');
    newGoal();
  }
}
let spawnT=2;
/* Wie viele Sorten stehen ueberhaupt im Regal? Ein Laden mit breitem
   Sortiment zieht spuerbar mehr Leute als einer mit vier Artikeln. */
function sortimentBreite(){
  let n=0; ORDER.forEach(t=>{ if(!P[t].noOrder&&!P[t].noShelf&&isUnlocked(t)) n++; });
  return n;
}
/* Voll zieht das Sortiment bei knapp der Haelfte aller Waren - frueher
   34 von 69. Seit es dreimal so viele gibt (26.09.), zaehlt der Anteil,
   sonst waere der Laden schon auf Level 6 "voll sortiert". */
const SORT_VOLL=Math.round(ORDER.filter(t=>!P[t].noOrder&&!P[t].noShelf).length*34/68);
function sortimentZug(){ return 0.78+Math.min(1,sortimentBreite()/SORT_VOLL)*0.52; }
/* Der Ruf eines eingesessenen Ladens spricht sich herum */
function bekanntheit(){ return 1+Math.min(20,Math.max(0,S.level-1))*0.019; }
/* Wie gross ist der Laden? Ein Markt mit Gondelgassen spricht sich
   anders herum als der Kiosk an der Ecke - und die Koerbe werden
   voller, weil die Leute laenger drin unterwegs sind. */
function ladenGroesse(){
  return 1+(S.up.shop_gross?0.34:0)+(S.up.shop_ost?0.26:0)+(S.up.shop_sued?0.30:0);
}
function korbGroesse(){ return 0.78+ladenGroesse()*0.22; }
function spawnInterval(){
  const m=dayMult(S.day)*evv('cust')*eroeffnung()*(1+0.05*(S.season-1))
    *(0.55+S.rep/100)*bekanntheit()*sortimentZug()*ladenGroesse()
    *(S.up.plakat?1.3:1)*(S.up.radio?1.25:1)*(S.up.tafel?1.3:1)*(S.up.kundenkarte?1.12:1)
    *(1+hype/50)*(0.85+ambienteScore()/180)*(0.75+cleanliness()/300);
  return Math.max(0.55,9.2/m);
}
function ruhetag(){ return isSunday(S.day)&&!S.up.tag4; }
/* Ruhetag beenden. Vorher blieb der Sonntag ohne Sonntagsgenehmigung
   fuer immer stehen: der Laden liess sich nicht oeffnen, und den Tag
   beenden ging nur nach Feierabend - der kam nie (Befund 26.09.). */
function ruhetagBeenden(){ if(phase!=='closed'||!ruhetag()) return; phase='after'; updateSign(); endDay(); }
function openShop(){
  if(phase!=='closed') return;
  if(ruhetag()){ toast('Sonntag ist Ruhetag. Nutz den Tag zum Nachfüllen oder zum Testen im Hof.','bad'); return; }
  phase='open'; clock=OPEN_T+evv('late',0); spawnT=1.5; S.tut.open=true; updateSign(); sfx.pop();
  toast(S.day<7?'Der Laden ist offen. Die Neueröffnung spricht sich noch herum.':`Der Laden ist offen. ${seasonInfo(S.day)[1]}.`);
}
function updateDay(dt){
  if(phase==='closed'&&ruhetag()&&clock<CLOSE_T){ clock=Math.min(CLOSE_T,clock+dt*MIN_PER_SEC*0.6);
    if(clock>=CLOSE_T){ phase='after'; updateSign(); toast('Der Ruhetag ist vorbei. Beende den Tag am Türschild.'); save(); } }
  if(phase==='open'){
    clock+=dt*MIN_PER_SEC;
    if(clock>=CLOSE_T){ clock=CLOSE_T; phase='closing'; updateSign(); toast('22 Uhr: Es kommen keine neuen Kunden mehr.'); }
    spawnT-=dt;
    if(spawnT<=0&&customers.length<20){ customers.push(new Customer()); spawnT=spawnInterval()*rand(0.6,1.4); }
  } else if(phase==='closing'&&customers.length===0){ phase='after'; updateSign();
    if(order) failOrder();
    if(typeof truck!=='undefined'&&truck) dumpTruck();
    phone.state=null; phone.call=null;
    toast('Alle Kunden sind weg. Beende den Tag am Türschild.'); save(); }
}
function fmtClock(m){ const h=Math.floor(m/60), mi=Math.floor(m%60); return String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0'); }
function sumRows(rows){ return rows.map(r=>r.head?`<div class="sumhead">${r.head}</div>`:`<div class="sumrow${r[2]?' big':''}"><span>${r[0]}</span><span>${r[1]}</span></div>`).join(''); }
let summaryOpen=false;
function showSummary(title,text,rows,btn,fn){
  $('sTitle').textContent=title; $('sText').textContent=text; $('sRows').innerHTML=sumRows(rows);
  const b=$('sBtn'); b.textContent=btn; b.onclick=fn;
  $('summary').classList.add('show'); summaryOpen=true; paused=true; if(locked) document.exitPointerLock();
}
const SHELFFIX={klein:4,standard:9,hoch:12,kuehl:18};
/* Dispokredit: solange der Laden laeuft, gibt die Bank einen Rahmen.
   Ohne den koennte ein schlechter Januar das Spiel unrettbar festfahren:
   kein Geld -> keine Ware -> keine Kunden -> kein Geld. */
function dispoLimit(){ return S.level>=4?Math.round(260+S.level*70):0; }
function verfuegbar(){ return r2(S.money+dispoLimit()); }
function dispoZins(){ return S.money<0?r2(-S.money*0.006):0; }
function fixedCosts(){
  let f=10+6*racks.length+Math.round(Math.max(0,S.level-4)*4);
  shelves.forEach(sh=>f+=SHELFFIX[sh.kind]||9);
  return f;
}
/* Die ersten Tage läuft es besser: Neueröffnung spricht sich herum */
function eroeffnung(){ return S.day<7?1.75-S.day*0.11:1; }
function endDay(){
  if(phase!=='after') return;
  /* ohne Pausenmenue ueber dem Tagesabschluss (Befund 26.09.) */
  if(laptopOpen){ laptopOpen=false; korbOpen=false; $('korbOv').classList.remove('show'); $('laptop').classList.remove('show'); }
  if(order) failOrder();
  clearStations();
  addGrime(0.06); staffMorale();
  const ev=todayEvent();
  if(ev&&ev.pruef){ if(cleanliness()>=70){ rep(3); toast('Die Prüfung war zufrieden. Das hebt den Ruf.','money'); } else { rep(-5); toast('Die Prüfung hat einen dreckigen Laden vorgefunden.','bad'); } }
  /* Mit Packstation laeuft der Onlineshop ueber echte Pakete statt ueber eine Pauschale */
  const abgeholt=typeof ddlAbholung==='function'?ddlAbholung():0;
  /* Ohne Packstation kommt der Onlineumsatz pauschal herein. Mit Packstation
     laeuft das meiste ueber echte Pakete, ein Sockel bleibt aber stehen,
     damit die Packstation nie eine Verschlechterung ist. */
  const onlineBasis=S.up.onlineshop?Math.round(40+S.rep*1.6+S.level*4):0;
  const online=packBereit()?Math.round(onlineBasis*0.4):onlineBasis;
  const dispo=dispoZins();
  if(abgeholt) toast(`DDL hat ${abgeholt} Paket${abgeholt===1?'':'e'} abgeholt.`,'money');
  if(packBereit()&&(S.offen|0)>8){ rep(-Math.min(2,0.12*(S.offen-8))); }
  const wages=dailyWages(), fix=fixedCosts(), extra=(hasDeko('automat')?45:0)+online;
  let pay=0, rate=0;
  if(S.loan){ rate=loanDaily(); const interest=r2(S.loan.remaining*S.loan.rate); pay=Math.min(rate,S.loan.remaining+interest);
    S.loan.remaining=r2(S.loan.remaining-(pay-interest)); S.loan.paid=r2(S.loan.paid+pay);
    if(S.loan.remaining<=0.01){ S.loan=null; toast('Kredit vollständig abbezahlt.','money'); } }
  DS.interest=pay;
  S.money=r2(S.money-wages-fix-pay-dispo+extra);
  const out=r2(DS.goods+DS.upgrades+pay+dispo+DS.changeLoss+wages+fix+DS.burned), profit=r2(DS.revenue+extra-out), dr=S.rep-DS.rep0;
  const dayXP=60+Math.round(DS.revenue*0.05)+(DS.angry===0?40:0);
  addXP(dayXP);
  if(S.money<0){ rep(-3); toast('Konto im Minus. Das kostet Ruf.','bad'); }
  const rows=[
    {head:'Einnahmen'},['Verkäufe',eur(DS.revenue)]];
  if(hasDeko('automat')) rows.push(['Getränkeautomat',eur(45)]);
  if(online) rows.push(['Onlineshop',eur(online)]);
  if(DS.versand) rows.push(['Versand (Pakete)',eur(DS.versand)]);
  if(DS.sb) rows.push(['Davon an den SB-Kassen',`${DS.sb} Kunden`]);
  if(packBereit()&&(S.offen|0)>0) rows.push(['Nicht gepackte Bestellungen',String(S.offen|0)]);
  if(S.goal) rows.push(['Wochenziel',`${S.goal.name}: ${Math.round(S.goal.have)}/${S.goal.need} ${S.goal.unit}`]);
  rows.push({head:'Ausgaben'},['Wareneinkauf',eur(DS.goods)],['Ausbau und Deko',eur(DS.upgrades)],['Löhne',eur(wages)],['Fixkosten',eur(fix)],['Kreditrate',eur(pay)],['Dispozinsen',eur(dispo)],['Zu viel Rückgeld',eur(DS.changeLoss)],['Selbst gezündet',eur(DS.burned)],
    ['Gewinn des Tages',(profit>=0?'+':'')+eur(profit),true],
    {head:'Laden'},['Kunden bedient',DS.customers],['Verkaufte Artikel',DS.sold],['Verpasst, weil Fach leer',DS.missed],['Genervt gegangen',DS.angry],['Diebstahl',eur(DS.stolen)],['Diebe gestellt',DS.caught],['Großaufträge',DS.orders||0],['Gravuren verkauft',DS.gravur||0],
    ['Ruf',(dr>=0?'+':'')+dr.toFixed(1).replace('.',',')],['Erfahrung',`+${DS.xpGained} XP`],
    ['Kontostand',eur(S.money)],['Offener Kredit',S.loan?eur(S.loan.remaining):'kein Kredit']);
  /* Wer ins Minus rutscht, soll wissen, woran er drehen kann - ohne
     Ware im Regal kommt kein Umsatz mehr herein, und dann ist es zu
     spaet. Deshalb steht die Warnung hier, nicht erst beim Dispolimit. */
  if(S.money<0){
    const luft=verfuegbar();
    rows.push({head:'Achtung: Konto im Minus'},
      ['Noch verfügbar für Ware',eur(luft)],
      ['Dispozinsen morgen',eur(r2(-S.money*0.006))]);
    const wege=[];
    if(dailyWages()>0) wege.push('Personal in die Saisonpause schicken oder entlassen');
    if(!S.loan&&loanTier()) wege.push(`Kredit über ${eur(loanTier().amount)} aufnehmen`);
    wege.push('Preise anheben und nur noch nachbestellen, was wirklich leer ist');
    rows.push(['Was jetzt hilft',wege.join(' · ')]);
    if(luft<400) rows.push(['Dringend','Ohne Geld kommt keine Ware ins Regal, und ohne Ware kein Umsatz. Jetzt gegensteuern.']);
  }
  /* Marktlage des Tages */
  if(DS.praemien) rows.push(['Prämien aus Herausforderungen',eur(DS.praemien)]);
  rows.push({head:'Markt'},['Preisniveau',marktText()],['Inflation seit Beginn',inflText()]);
  /* Einkauf beim Lieferanten (Tom, 26.09.: "die Preise beim Lieferanten
     werden auch teurer") - Schnitt ueber die eigene Ware und die groessten
     Spruenge nach oben und unten */
  { const e=ekTag(), f=x=>(x>0?'+':'')+x.toFixed(1).replace('.',',')+' %';
    if(e.schnitt||e.hoch||e.runter){
      rows.push(['Einkauf beim Lieferanten',`im Schnitt ${f(e.schnitt)} gegenüber gestern`]);
      if(e.hoch&&e.hoch.d>=1) rows.push(['Teurer eingekauft',`${P[e.hoch.t].short} ${f(e.hoch.d)}`]);
      if(e.runter&&e.runter.d<=-1) rows.push(['Günstiger eingekauft',`${P[e.runter.t].short} ${f(e.runter.d)}`]); } }
  (S.news||[]).forEach(n=>{ if(P[n.t]) rows.push([P[n.t].short,`${n.text} · ${n.knapp?'Preis zieht an':'Preis fällt'}`]); });
  { const chance=marktChance();
    if(chance) rows.push(['Einkaufschance',`${P[chance].short} · Einkauf ${marktLuecke(chance)} % unter dem Kundenpreis`]); }
  { const teuer=marktExtrem(1), billig=marktExtrem(-1);
    if(teuer) rows.push(['Am teuersten',`${P[teuer].short} · ${marktNiveau(teuer)>0?'+':''}${marktNiveau(teuer)} % (${eur(marketOf(teuer))})`]);
    if(billig) rows.push(['Am günstigsten',`${P[billig].short} · ${marktNiveau(billig)} % (${eur(marketOf(billig))})`]); }
  { const l=naechsteLizenz();
    if(l) rows.push(['Nächstes Lizenzpaket',`${l.name} · ab Level ${l.lvl} · ${eur(l.cost)}`]); }
  const cur=dateInfo(S.day), nxt=dateInfo(S.day+1);
  const jahresende=nxt.y>cur.y;
  const aktiv=STAFF.filter(st=>S.staff[st.id]&&!inPause(st.id)).length;
  const flau=dayMult(S.day+1)<0.95;
  const morgen=isSunday(S.day+1)&&!S.up.tag4?'Morgen ist Sonntag, Ruhetag. Gute Gelegenheit zum Auffüllen.'
    :(flau&&aktiv>0&&profit<0)
      ? `Morgen: ${dateStr(S.day+1)}. ${seasonInfo(S.day+1)[1]}. Die Saison ist vorbei und der Tag war im Minus — schick dein Team im Handy (App Team) in die Saisonpause, das kostet nur 30 Prozent Lohn.`
      : `Morgen: ${dateStr(S.day+1)}. ${seasonInfo(S.day+1)[1]}.`;
  showSummary(`Tagesabschluss · ${dateStr(S.day)}`,morgen,rows,'Nächster Tag',()=>{
    statRekord('rek_tag',Math.round(DS.revenue));
    statRekord('rek_kunden',DS.customers);
    statAdd('tage',1);
    S.day++; goalTick(); rollMarket(); rollEvent(); rezepteTick();
    /* Neue Einkaufspreise des Tages: spuerbare Aenderung gleich melden */
    { const e=ekTag(), f=x=>(x>0?'+':'')+x.toFixed(1).replace('.',',')+' %';
      if(Math.abs(e.schnitt)>=0.5) toast(`Lieferanten: Einkauf heute im Schnitt ${f(e.schnitt)}${e.hoch&&e.hoch.d>=5?` · ${P[e.hoch.t].short} ${f(e.hoch.d)}`:''}`,e.schnitt>0?'bad':'money');
      else if(e.hoch&&e.hoch.d>=5) later(0.8,()=>toast(`Lieferant: ${P[e.hoch.t].short} heute ${f(e.hoch.d)} teurer im Einkauf.`,'bad')); }
    if(jahresende){
      const n=S.season; S.season++;
      const jahr=S.seasonRevenue; S.seasonRevenue=0; addXP(200,'Ein Jahr geschafft');
      showSummary('Frohes neues Jahr!',`Jahr ${n} ist durch. Der Laden macht weiter.`,[
        ['Umsatz im Jahr',eur(jahr)],['Kontostand',eur(S.money)],['Offener Kredit',S.loan?eur(S.loan.remaining):'kein Kredit'],
        ['Ruf',Math.round(S.rep)+' von 100'],['Level',S.level],['Nächstes Jahr',`Jahr ${n+1}`]
      ],`Jahr ${n+1} beginnen`,()=>closeSummary());
    } else closeSummary();
  });
}
function closeSummary(){
  $('summary').classList.remove('show'); summaryOpen=false; phase='closed'; clock=OPEN_T; hype=0; newDayStats(); updateSign(); save();
  if(pendingLevels.length){ showLevelUp(); return; }
  paused=false; requestLock();
}
