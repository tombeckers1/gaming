
/* =========================================================
   Laptop
   ========================================================= */
let laptopOpen=false, startOpen=true, pauseOpen=false, ltab='order', resetArm=false, lsup='mertens', korbOpen=false;
function openLaptop(tab){ laptopOpen=true; resetArm=false; if(tab) ltab=tab; for(const k in keys) keys[k]=false; mouseDown=false; touchAct=false; renderLaptop(); $('laptop').classList.add('show'); if(locked) document.exitPointerLock(); }
function closeLaptop(relock){ laptopOpen=false; korbOpen=false; $('korbOv').classList.remove('show'); $('laptop').classList.remove('show'); if(relock) requestLock(); else if(lockWorked&&!COARSE&&!locked&&!summaryOpen&&!levelOpen) showPause(); }
function priceHint(t){ const r=S.prices[t]/marketOf(t), lo=priceTol();
  if(r<=lo) return ['ok','Kunden greifen gern zu'];
  if(r<=lo+0.2) return ['warn','Einige zögern'];
  if(r<lo+0.45) return ['no','Viele lassen es liegen'];
  return ['no','Zu dem Preis kauft niemand']; }
/* Verkaufspreis auf das aktuelle Marktniveau setzen */
function setPreisAufMarkt(t,f){
  S.prices[t]=Math.max(0.1,r2(marketOf(t)*(f||1)));
  allLevels().forEach(l=>{ if(l.type===t) updateLabel(l); });
}
/* Kleine Kursgrafik der letzten Tage */
const _sparkCache={};
function sparkPic(t){
  const h=(S&&S.mh&&S.mh[t])||[1];
  const key=t+'|'+h.length+'|'+h[h.length-1];
  if(_sparkCache[t]&&_sparkCache[t].k===key) return _sparkCache[t].u;
  const W=208,H=60, c=document.createElement('canvas'); c.width=W; c.height=H;
  const g=c.getContext('2d');
  g.fillStyle='#0b1020'; g.fillRect(0,0,W,H);
  const lo=Math.min(...h,0.98), hi=Math.max(...h,1.02), sp=Math.max(0.04,hi-lo);
  const X=i=>h.length<2?W/2:8+i*(W-16)/(h.length-1);
  const Y=v=>H-8-((v-lo)/sp)*(H-16);
  /* Normalniveau als Hilfslinie */
  g.strokeStyle='rgba(242,245,255,.18)'; g.lineWidth=1.5; g.setLineDash([4,4]);
  g.beginPath(); g.moveTo(0,Y(1)); g.lineTo(W,Y(1)); g.stroke(); g.setLineDash([]);
  const steigt=h[h.length-1]>=h[0];
  const col=steigt?'#ff9d92':'#8ef0a8';
  g.beginPath(); h.forEach((v,i)=>{ const x=X(i),y=Y(v); i?g.lineTo(x,y):g.moveTo(x,y); });
  g.lineTo(X(h.length-1),H); g.lineTo(X(0),H); g.closePath();
  g.fillStyle=steigt?'rgba(255,157,146,.16)':'rgba(142,240,168,.16)'; g.fill();
  g.beginPath(); h.forEach((v,i)=>{ const x=X(i),y=Y(v); i?g.lineTo(x,y):g.moveTo(x,y); });
  g.strokeStyle=col; g.lineWidth=2.6; g.lineJoin='round'; g.stroke();
  g.fillStyle=col; g.beginPath(); g.arc(X(h.length-1),Y(h[h.length-1]),3.4,0,Math.PI*2); g.fill();
  const u=c.toDataURL('image/png');
  _sparkCache[t]={k:key,u};
  return u;
}
/* Paketbild: die Farben der enthaltenen Produkte als Regalreihe */
const _lizCache={};
function lizPic(id){
  if(_lizCache[id]) return _lizCache[id];
  const l=lizenzDaten(id)||{items:[]};
  const W=224,H=152, c=document.createElement('canvas'); c.width=W; c.height=H;
  const g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#1b2340'); gr.addColorStop(1,'#0a0f1e');
  g.fillStyle=gr; g.fillRect(0,0,W,H);
  /* Regalbrett */
  g.fillStyle='#3a4256'; g.fillRect(12,112,200,7);
  g.fillStyle='#2a3145'; g.fillRect(12,119,200,4);
  const alle=l.items.filter(t=>P[t]), it=alle.slice(0,4);
  const bw=Math.min(46,(192-(it.length-1)*10)/Math.max(1,it.length));
  it.forEach((t,i)=>{
    const a=P[t].art||{}, x=18+i*(bw+10), hh=54+((i*41)%32);
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+3,112-hh+4,bw,hh);
    g.fillStyle=a.bg2||'#20283c'; g.fillRect(x,112-hh,bw,hh);
    g.fillStyle=a.bg1||'#2f3a58'; g.fillRect(x+3,112-hh+3,bw-6,hh-6);
    g.fillStyle=a.ac||'#ffd23f'; g.fillRect(x+3,112-hh+3,bw-6,11);
    g.fillStyle=a.ac2||'#ffffff';
    for(let k=0;k<3;k++) g.fillRect(x+7,112-hh+22+k*9,bw-14,3.5);
    g.fillStyle=a.ac||'#ffd23f'; g.fillRect(x+7,112-hh+52,(bw-14)*0.6,3.5);
  });
  /* Zaehler, wenn mehr drin ist als gezeigt wird */
  g.fillStyle='rgba(14,18,38,.85)'; g.fillRect(170,14,40,26);
  g.strokeStyle='rgba(255,210,63,.6)'; g.lineWidth=2; g.strokeRect(170,14,40,26);
  g.fillStyle='#ffd23f'; g.font='700 18px "Barlow Condensed",sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  g.fillText(String(alle.length),190,28);
  /* Banderole */
  g.fillStyle='rgba(255,210,63,.95)'; g.fillRect(0,124,W,26);
  g.fillStyle='#0e1226'; g.font='700 17px "Barlow Condensed",sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  g.fillText((l.name||'').toUpperCase(),W/2,138);
  const u=c.toDataURL('image/png');
  _lizCache[id]=u;
  return u;
}
/* Lizenzpaket kaufen: alle Produkte daraus kommen ins Sortiment */
function buyLizenz(id){
  const l=lizenzDaten(id);
  if(!l||hatLizenz(id)||S.level<l.lvl||S.money<l.cost) return;
  S.money=r2(S.money-l.cost); DS.upgrades=r2(DS.upgrades+l.cost);
  S.lic=(S.lic||[]).concat(id);
  /* Startpreise der neuen Ware auf Marktniveau */
  l.items.forEach(t=>{ if(P[t]) S.prices[t]=marketOf(t); });
  sfx.cash(); addXP(Math.round(l.cost/14)+30,'Lizenz');
  toast(`${l.name} freigeschaltet: ${l.items.filter(t=>P[t]).map(t=>P[t].short).join(', ')}.`,'money');
  save();
}
function catPill(p){ return p.cat?`<span class="pill f${p.cat}">F${p.cat}</span>`:'<span class="pill zub">Zubehör</span>'; }
function supAvail(){ return SUPPLIERS.filter(x=>S.level>=x.lvl); }
function tierPrice(t,sup,tier){ return r2(costOf(t)*ekFactor()*P[t].box*tier.n*sup.mult*(1-tier.d)); }
/* =========================================================
   Warenkorb: Artikel sammeln, am Ende in einem Rutsch bestellen.
   Jede Bestellung ist genau eine Lieferung und kostet einmal Versand.
   ========================================================= */
function cartLines(){ return S.cart||(S.cart=[]); }
function lineSup(l){ return supplierOf(l.sup); }
function lineName(l){ return l.pack?(PACKS.find(x=>x.id===l.pack)||{name:'Wundertüte'}).name:P[l.t].name; }
function lineCost(l){
  if(l.pack){ const pk=PACKS.find(x=>x.id===l.pack); return pk?r2(pk.cost*l.n):0; }
  const sup=lineSup(l), tier=(sup.tiers||[{n:1,d:0}]).find(x=>x.n===l.step)||{n:l.step||1,d:0};
  return r2(tierPrice(l.t,sup,tier)*(l.n/(tier.n||1)));
}
function lineBoxes(l){ return l.pack?(PACKS.find(x=>x.id===l.pack)||{n:1}).n*l.n:l.n; }
function cartGoods(){ return r2(cartLines().reduce((a,l)=>a+lineCost(l),0)); }
function cartBoxes(){ return cartLines().reduce((a,l)=>a+lineBoxes(l),0); }
function cartFee(){ return cartLines().length?(cartGoods()>=VERSANDFREI?0:VERSAND):0; }
function cartTotal(){ return r2(cartGoods()+cartFee()); }
function cartAdd(t,n,supId){
  const sup=supplierOf(supId||lsup);
  const l=cartLines().find(x=>!x.pack&&x.t===t&&x.sup===sup.id&&x.step===n);
  if(l) l.n+=n; else cartLines().push({t,n,step:n,sup:sup.id});
  sfx.pop(); toast(`${n}× ${P[t].name} im Warenkorb.`); save();
}
function cartAddPack(id){
  const pk=PACKS.find(x=>x.id===id); if(!pk||S.level<pk.lvl) return;
  const l=cartLines().find(x=>x.pack===id);
  if(l) l.n++; else cartLines().push({pack:id,n:1,sup:'ratzke'});
  sfx.pop(); toast(`${pk.name} im Warenkorb.`); save();
}
function cartDel(i){ cartLines().splice(i,1); save(); }
function cartStep(i,d){ const l=cartLines()[i]; if(!l) return;
  l.n+=d*(l.pack?1:(l.step||1));
  if(l.n<=0) cartLines().splice(i,1);
  sfx.pop(); save(); }
function cartClear(){ S.cart=[]; save(); }
/* Legt die Kartons einer Zeile in die Lieferung */
function pushLine(l,delay){
  const sup=lineSup(l);
  if(l.pack){
    const pk=PACKS.find(x=>x.id===l.pack);
    const items=packContents(pk.n*l.n);
    items.forEach(t=>pending.push({type:t,t:delay,q:supplierOf('ratzke').quality,sup:'ratzke'}));
    return items.length;
  }
  for(let i=0;i<l.n;i++) pending.push({type:l.t,t:delay,q:sup.quality,sup:sup.id});
  return l.n;
}
function cartOrder(){
  if(!cartLines().length) return;
  let total=cartTotal();
  /* Warengutschriften aus Herausforderungen werden hier eingeloest */
  const gut=Math.min(S.gutschrift||0,total);
  total=r2(total-gut);
  if(verfuegbar()<total) return;
  if(gut>0){ S.gutschrift=r2(S.gutschrift-gut); toast(`${eur(gut)} Warengutschrift verrechnet.`,'money'); }
  const delay=lieferSek()*evv('delay');
  S.money=r2(S.money-total); DS.goods=r2(DS.goods+total);
  let n=0; cartLines().forEach(l=>{ n+=pushLine(l,delay); });
  const fee=cartFee();
  S.cart=[]; S.tut.order=true; sfx.cash(); ltab='order';
  if(korbOpen) closeKorb();
  toast(`${n} Karton${n===1?'':'s'} bestellt · ${eur(total)}${fee?` inkl. ${eur(fee)} Versand`:' · versandkostenfrei'}. Ankunft in ${LIEFERZEIT_SEK} Sekunden.`,'money');
  save();
}
/* Direktbestellung eines einzelnen Postens (eigene Lieferung, eigener Versand) */
function orderBox(t,n,supId){
  const sup=supplierOf(supId||lsup), p=P[t];
  const tier=(sup.tiers||[{n:1,d:0}]).find(x=>x.n===n)||{n,d:0};
  const goods=tierPrice(t,sup,tier), fee=goods>=VERSANDFREI?0:VERSAND, cost=r2(goods+fee);
  if(verfuegbar()<cost) return;
  S.money=r2(S.money-cost); DS.goods=r2(DS.goods+cost);
  const delay=lieferSek()*evv('delay');
  for(let i=0;i<n;i++) pending.push({type:t,t:delay,q:sup.quality,sup:sup.id});
  S.tut.order=true; sfx.pop();
  toast(`${n>1?n+' Kartons ':''}${p.name} bei ${sup.short} bestellt.`); save();
}
function packContents(n){
  const pool=ORDER.filter(t=>isUnlocked(t)&&canShelf(t)&&P[t].cat!==undefined&&t!=='blanko');
  if(!pool.length) return [];
  const out=[];
  for(let i=0;i<n;i++){
    const jackpot=Math.random()<0.12;
    const cand=pool.filter(t=>jackpot?costOf(t)>=6:costOf(t)<6);
    out.push(pick(cand.length?cand:pool));
  }
  return out;
}
function buyPack(id){
  const pk=PACKS.find(x=>x.id===id); if(!pk||S.level<pk.lvl||verfuegbar()<pk.cost) return;
  const items=packContents(pk.n); if(!items.length) return;
  S.money=r2(S.money-pk.cost); DS.goods=r2(DS.goods+pk.cost);
  const sup=supplierOf('ratzke'), delay=lieferSek()*evv('delay');
  items.forEach(t=>pending.push({type:t,t:delay,q:sup.quality,sup:sup.id}));
  const cnt={}; items.forEach(t=>cnt[t]=(cnt[t]||0)+1);
  const keys=Object.keys(cnt), txt=keys.slice(0,4).map(t=>`${cnt[t]}× ${P[t].short}`).join(', ')+(keys.length>4?' …':'');
  const worth=r2(items.reduce((a,t)=>a+costOf(t)*P[t].box,0));
  sfx.cash(); toast(`Wundertüte: ${txt}`,'money');
  later(0.6,()=>toast(worth>pk.cost?`Einkaufswert ${eur(worth)}. Guter Griff.`:`Einkaufswert ${eur(worth)}. Diesmal Pech.`,worth>pk.cost?'money':'bad'));
  addXP(20,'Wundertüte'); S.tut.order=true; save();
}
/* =========================================================
   Warenkorb-Maske: eigene Ansicht ueber dem Laptop
   ========================================================= */
function openKorb(){ korbOpen=true; $('korbOv').classList.add('show'); renderKorb(); }
function closeKorb(){ korbOpen=false; $('korbOv').classList.remove('show'); renderLaptop(); }
function renderKorb(){
  const lines=cartLines(), goods=cartGoods(), fee=cartFee(), total=r2(goods+fee);
  const n=cartBoxes(), rest=r2(VERSANDFREI-goods);
  $('korbCount').textContent=n?`${n} Karton${n===1?'':'s'} · ${lines.length} Position${lines.length===1?'':'en'}`:'leer';
  $('korbSum').textContent=eur(total);
  if(!lines.length){
    $('korbBody').innerHTML=`<div class="row"><div class="rm"><b>Dein Warenkorb ist leer</b>`+
      `<small>Leg im Tab „Bestellen“ mit „+“ Kartons hinein. Hier siehst du dann jede Position mit Preis, die Liefergebühr und die Gesamtsumme.</small></div></div>`;
    $('korbFoot').innerHTML=`<button class="ghost" data-a="korbclose">Weiter einkaufen</button>`;
    return;
  }
  $('korbBody').innerHTML=lines.map((l,i)=>{
    const sup=lineSup(l), boxes=lineBoxes(l), cost=lineCost(l), each=r2(cost/Math.max(1,boxes));
    return `<div class="row"><div class="rm"><b>${lineName(l)}</b>`+
      `<small>${l.pack?'Inhalt zufällig · Restposten-Qualität':sup.name}</small>`+
      `<small>${boxes} Karton${boxes===1?'':'s'} × ${eur(each)}</small></div>`+
      `<div class="steps"><button data-a="cartminus" data-i="${i}">−</button>`+
      `<b style="min-width:32px;text-align:center;font-family:var(--display);font-size:19px">${l.n}</b>`+
      `<button data-a="cartplus" data-i="${i}">+</button></div>`+
      `<div class="price">${eur(cost)}</div>`+
      `<button class="ghost" data-a="cartdel" data-i="${i}">Löschen</button></div>`;
  }).join('')+
    `<div class="ksum"><div><b>Zwischensumme</b><small>${n} Karton${n===1?'':'s'}</small></div><div class="price">${eur(goods)}</div></div>`+
    `<div class="ksum"><div><b>Liefergebühr</b><small>${fee?`Ab ${eur(VERSANDFREI)} Warenwert frei · noch ${eur(rest)}`:`Entfällt ab ${eur(VERSANDFREI)} Warenwert`}</small></div><div class="price ${fee?'':'ok'}">${fee?eur(fee):'frei'}</div></div>`+
    `<div class="ksum total"><div><b>Gesamt</b><small>${verfuegbar()<total?`Nicht genug: Konto ${eur(S.money)}${dispoLimit()?` plus ${eur(dispoLimit())} Dispo`:''}.`:`Danach noch ${eur(r2(S.money-total))} auf dem Konto${S.money-total<0?' (im Dispo)':''} · Lieferant kommt in ${LIEFERZEIT_SEK} Sekunden`}</small></div><div class="price">${eur(total)}</div></div>`;
  $('korbFoot').innerHTML=
    `<button class="ghost" data-a="korbclose">Weiter einkaufen</button>`+
    `<button class="ghost" data-a="cartclear">Korb leeren</button>`+
    `<button data-a="cartgo" ${verfuegbar()<total?'disabled':''}>Jetzt bestellen · ${eur(total)}</button>`;
}
function korbBtnText(){
  const n=cartBoxes();
  return n?`Warenkorb anzeigen (${n}) · ${eur(cartTotal())}`:'Warenkorb anzeigen';
}
/* =========================================================
   Katalogbilder: kleine gezeichnete Vorschauen fuer den Laptop
   ========================================================= */
const _picCache={};
function upPic(id){
  if(_picCache[id]) return _picCache[id];
  const c=document.createElement('canvas'); c.width=224; c.height=152;
  const g=c.getContext('2d');
  const W=224,H=152;
  const bg=(a,b)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,a); gr.addColorStop(1,b); g.fillStyle=gr; g.fillRect(0,0,W,H); };
  const regal=(faecher,breit,farbe)=>{
    bg('#1b2540','#0d1326');
    const x0=(W-breit)/2, h=104, y0=H-18-h;
    g.fillStyle=farbe; g.fillRect(x0-6,y0,6,h); g.fillRect(x0+breit,y0,6,h);
    for(let i=0;i<faecher;i++){ const y=y0+8+i*(h-12)/faecher;
      g.fillStyle='#c9ced8'; g.fillRect(x0,y,breit,5);
      for(let k=0;k<3;k++){ g.fillStyle=['#d8b468','#c05a4a','#6fa8d8'][k]; g.fillRect(x0+8+k*(breit-20)/3,y-13,(breit-30)/3,13); } }
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(0,H-18,W,18);
  };
  switch(id){
    case 'shelf_klein':  regal(3,86,'#8a9099'); break;
    case 'shelf_standard':regal(4,128,'#8a9099'); break;
    case 'shelf_hoch':   regal(5,120,'#7d838c'); break;
    case 'shelf_kuehl':
      bg('#0f2030','#081420');
      g.fillStyle='#39434f'; g.fillRect(64,22,96,112);
      g.fillStyle='rgba(170,220,255,.32)'; g.fillRect(70,28,84,100);
      for(let i=0;i<3;i++){ g.fillStyle='#e8e2c8'; g.fillRect(76,46+i*30,72,5);
        for(let k=0;k<4;k++){ g.fillStyle='#b8d8a8'; g.fillRect(80+k*18,32+i*30,12,14); } }
      g.strokeStyle='#9fd8ff'; g.lineWidth=2; g.strokeRect(70,28,84,100); break;
    case 'rack':
      bg('#16203a','#0b1222');
      g.fillStyle='#2f5d9e'; g.fillRect(28,26,10,106); g.fillRect(186,26,10,106);
      for(let i=0;i<3;i++){ const y=44+i*34; g.fillStyle='#e06a1f'; g.fillRect(28,y,168,7);
        for(let k=0;k<3;k++){ g.fillStyle='#c9a978'; g.fillRect(40+k*54,y-20,44,20); } }
      break;
    case 'kasse2':
      bg('#16203a','#0b1222');
      /* zwei SB-Terminals nebeneinander */
      for(const bx of [26,120]){
        g.fillStyle='#223055'; g.fillRect(bx,74,78,58);
        g.fillStyle='#d6dae2'; g.fillRect(bx-4,68,86,8);
        g.fillStyle='#c8322a'; g.fillRect(bx,92,78,4);
        g.fillStyle='#39425c'; g.fillRect(bx+32,46,14,24);
        g.fillStyle='#1b2130'; g.fillRect(bx+14,24,50,32);
        g.fillStyle='#2f6bb8'; g.fillRect(bx+17,27,44,26);
        g.fillStyle='#6cf2a8'; g.fillRect(bx+17,46,20,5);
        g.fillStyle='#8a9099'; g.fillRect(bx+4,60,6,12);
        g.fillStyle='#37d977'; g.beginPath(); g.arc(bx+7,56,5,0,Math.PI*2); g.fill();
      }
      break;
    case 'shelf_gondel':
      bg('#1b2540','#0d1326');
      /* Gondel von der Seite: Ware links und rechts */
      g.fillStyle='#4a5266'; g.fillRect(104,26,16,104);
      for(let i=0;i<4;i++){ const y=36+i*24;
        g.fillStyle='#c9ced8'; g.fillRect(44,y,76,5); g.fillRect(104,y,76,5);
        for(let k=0;k<3;k++){ g.fillStyle=['#d8b468','#c05a4a','#6fa8d8'][k];
          g.fillRect(48+k*24,y-13,18,13); g.fillRect(110+k*24,y-13,18,13); } }
      g.fillStyle='#1b2340'; g.fillRect(44,18,136,10); break;
    case 'shelf_eck':
      bg('#1b2540','#0d1326');
      /* Eckregal von oben: zwei Schenkel ueber Eck */
      g.fillStyle='#39434f'; g.fillRect(34,30,26,92); g.fillRect(34,96,152,26);
      for(let i=0;i<5;i++){ g.fillStyle=['#d8b468','#c05a4a','#6fa8d8','#8fd6a8','#e0a0c8'][i%5];
        g.fillRect(38,36+i*17,18,12); g.fillRect(66+i*24,100,18,12); }
      g.strokeStyle='#6cf2a8'; g.lineWidth=3; g.strokeRect(32,28,156,96); break;
    case 'rack_hoch': case 'rack_schwer':
      bg('#16203a','#0b1222');
      { const nf=id==='rack_schwer'?4:5, bw=id==='rack_schwer'?176:150, x0=(W-bw)/2;
        g.fillStyle='#2f5d9e'; g.fillRect(x0-10,16,10,120); g.fillRect(x0+bw,16,10,120);
        for(let i=0;i<nf;i++){ const y=26+i*(112/nf);
          g.fillStyle='#e06a1f'; g.fillRect(x0,y,bw,6);
          for(let k=0;k<(id==='rack_schwer'?4:3);k++){ g.fillStyle='#c9a978';
            g.fillRect(x0+6+k*(bw-8)/(id==='rack_schwer'?4:3),y-14,(bw-24)/(id==='rack_schwer'?4:3),14); } } }
      break;
    case 'shop_ost': case 'shop_sued':
      bg('#20283c','#121826');
      g.fillStyle='#e9e4da'; g.fillRect(14,44,60,90);
      g.fillStyle='#d9d4c6'; g.fillRect(76,34,60,100);
      g.fillStyle='#8a4f3c'; g.fillRect(138,24,72,110);
      for(let r=0;r<7;r++) for(let c2=0;c2<3;c2++){ g.fillStyle=r%2?'#7e4735':'#93573f'; g.fillRect(140+c2*24+(r%2?6:0),26+r*16,20,13); }
      g.fillStyle='#ffd23f'; g.fillRect(14,34,60,10);
      g.strokeStyle='#6cf2a8'; g.setLineDash([7,6]); g.lineWidth=4;
      g.strokeRect(id==='shop_ost'?134:72,id==='shop_ost'?22:32,id==='shop_ost'?78:68,114); g.setLineDash([]);
      break;
    case 'lager_sued': case 'lager_west':
      bg('#1a2030','#0e131e');
      /* hohe Halle neben der niedrigen */
      g.fillStyle='#a3a8b0'; g.fillRect(16,76,80,58);
      g.fillStyle='#b9bec6'; g.fillRect(104,24,104,110);
      for(let i=0;i<9;i++){ g.fillStyle=i%2?'#a7adb6':'#c4c9d1'; g.fillRect(106+i*11,26,7,106); }
      g.fillStyle='#2b2f3a'; g.fillRect(100,18,112,10);
      g.fillStyle='#e9ebee'; g.fillRect(128,86,24,46); g.fillRect(166,86,24,46);
      g.strokeStyle='#6cf2a8'; g.setLineDash([7,6]); g.lineWidth=4; g.strokeRect(100,20,112,116); g.setLineDash([]);
      g.fillStyle='#f2c230'; g.fillRect(16,134,192,6); break;
    case 'shop_gross':
      bg('#20283c','#121826');
      g.fillStyle='#8a4f3c'; g.fillRect(112,24,96,110);
      for(let r=0;r<7;r++) for(let c2=0;c2<4;c2++){ g.fillStyle=r%2?'#7e4735':'#93573f'; g.fillRect(114+c2*24+(r%2?6:0),26+r*16,20,13); }
      g.fillStyle='#e9e4da'; g.fillRect(20,30,84,104);
      g.fillStyle='#2c3646'; g.fillRect(28,44,28,34); g.fillRect(64,44,28,34);
      g.fillStyle='#ffd23f'; g.fillRect(20,20,84,12);
      g.strokeStyle='#6cf2a8'; g.setLineDash([7,6]); g.lineWidth=4; g.strokeRect(108,22,102,114); g.setLineDash([]);
      break;
    case 'lager_gross':
      bg('#1a2030','#0e131e');
      g.fillStyle='#a3a8b0'; g.fillRect(16,40,96,94);
      g.fillStyle='#8a9099'; g.fillRect(116,40,92,94);
      g.strokeStyle='#6cf2a8'; g.setLineDash([7,6]); g.lineWidth=4; g.strokeRect(114,38,96,98); g.setLineDash([]);
      g.fillStyle='#f2c230'; g.fillRect(16,126,192,8); break;
    case 'packstation':
      bg('#1a2030','#0e131e');
      g.fillStyle='#6b5a42'; g.fillRect(30,76,164,14);
      g.fillStyle='#8a9099'; g.fillRect(36,90,10,42); g.fillRect(178,90,10,42);
      for(let k=0;k<3;k++){ g.fillStyle='#c9a978'; g.fillRect(44+k*50,44,40,32);
        g.strokeStyle='#8a7350'; g.lineWidth=2; g.strokeRect(44+k*50,44,40,32); }
      g.fillStyle='#e8b800'; g.fillRect(150,26,56,16); g.fillStyle='#c8322a'; g.fillRect(150,26,28,16); break;
    case 'plakat': case 'radio': case 'tafel':
      bg('#1c2438','#0e1424');
      g.fillStyle='#c8322a'; g.fillRect(40,26,144,88);
      g.fillStyle='#ffd23f'; g.font='700 30px sans-serif'; g.textAlign='center'; g.fillText('SALE',112,78);
      g.fillStyle='#59606b'; g.fillRect(104,114,16,24); break;
    case 'cams': case 'alarm':
      bg('#1a2030','#0e131e');
      g.fillStyle='#4a515c'; g.fillRect(70,54,84,30);
      g.fillStyle='#1b1e25'; g.beginPath(); g.arc(158,69,17,0,Math.PI*2); g.fill();
      g.fillStyle='#7fd1ff'; g.beginPath(); g.arc(158,69,9,0,Math.PI*2); g.fill();
      g.fillStyle='#4a515c'; g.fillRect(104,30,12,26); g.fillStyle='#e63b2e'; g.fillRect(76,60,8,8); break;
    case 'gravur':
      bg('#1a2030','#0e131e');
      g.fillStyle='#39434f'; g.fillRect(48,40,128,80);
      g.fillStyle='#0e1226'; g.fillRect(58,50,108,44);
      g.fillStyle='#6cf2a8'; g.font='700 20px sans-serif'; g.textAlign='center'; g.fillText('TOM',112,78);
      g.fillStyle='#c8322a'; g.fillRect(96,100,32,14); break;
    case 'terminal':
      bg('#1a2030','#0e131e');
      g.fillStyle='#2b3140'; g.fillRect(78,34,68,92);
      g.fillStyle='#0e1226'; g.fillRect(84,42,56,34);
      g.fillStyle='#6cf2a8'; g.fillRect(90,86,44,8); g.fillRect(90,100,44,8);
      g.fillStyle='#ffd23f'; g.fillRect(96,20,40,16); break;
    case 'heizung': case 'klima': case 'musik':
      bg('#20222c','#12141c');
      g.fillStyle='#4a515c'; g.fillRect(56,34,112,22);
      for(let i=0;i<5;i++){ g.fillStyle='#e8894a'; g.fillRect(62+i*22,58,14,44); }
      g.fillStyle='#59606b'; g.fillRect(104,102,16,30); break;
    case 'regallicht':
      bg('#141a2c','#0a0f1c');
      g.fillStyle='#f6f2e2'; g.fillRect(34,38,156,10);
      const gr2=g.createLinearGradient(0,48,0,140); gr2.addColorStop(0,'rgba(255,244,214,.55)'); gr2.addColorStop(1,'rgba(255,244,214,0)');
      g.fillStyle=gr2; g.fillRect(34,48,156,92);
      g.fillStyle='#c9ced8'; g.fillRect(40,110,144,6); break;
    case 'onlineshop':
      bg('#101a2e','#0a1120');
      g.fillStyle='#e9edf5'; g.fillRect(34,30,156,96);
      g.fillStyle='#2f5d9e'; g.fillRect(34,30,156,18);
      g.fillStyle='#c9ced8'; g.fillRect(44,58,60,44); g.fillRect(114,58,62,14); g.fillRect(114,80,40,10);
      g.fillStyle='#6cf2a8'; g.fillRect(114,98,52,16); break;
    case 'tag4': case 'lizenz': case 'meister': case 'grosskunden': case 'kundenkarte':
      bg('#1c2438','#0e1424');
      g.fillStyle='#f2efe4'; g.fillRect(52,26,120,100);
      g.fillStyle='#c8322a'; g.beginPath(); g.arc(112,60,22,0,Math.PI*2); g.fill();
      g.fillStyle='#1b2340'; g.fillRect(66,94,92,6); g.fillRect(66,108,66,6); break;
    default:
      bg('#1a2030','#0e131e');
      g.fillStyle='#39434f'; g.fillRect(62,44,100,64);
      g.fillStyle='#ffd23f'; g.font='700 40px sans-serif'; g.textAlign='center'; g.fillText('?',112,92);
  }
  g.strokeStyle='rgba(242,245,255,.18)'; g.lineWidth=2; g.strokeRect(1,1,W-2,H-2);
  _picCache[id]=c.toDataURL('image/png');
  return _picCache[id];
}
function wallPreis(w){
  if((S.paint||[]).indexOf(w.id)>=0||!w.cost) return 'Gekauft';
  return 'Kosten '+eur(w.cost)+(S.level<w.lvl?` · ab Level ${w.lvl}`:'');
}
/* =========================================================
   Onlineshop. Bis hierher lief der komplett im Hintergrund: der
   Ausbau brachte Geld, die Bestellungen kamen als Pakete ins
   Lager - eine Oberflaeche dafuer gab es nirgends. Jetzt laeuft
   er ueber diesen Reiter.
   ========================================================= */
function onlineStufe(){
  if(!S.up.onlineshop) return 'zu';
  return packBereit()?'versand':'pauschal';
}
function onlineHint(){
  const st=onlineStufe();
  if(st==='zu') return 'Der Onlineshop ist noch nicht freigeschaltet. Du findest ihn unter Marketing.';
  if(st==='pauschal') return 'Der Shop läuft, aber ohne Packstation bleibt es bei einer Tagespauschale. Mit Packstation kommen echte Bestellungen herein, die du hier packst - das bringt deutlich mehr.';
  return 'Bestellungen laufen den ganzen Verkaufstag über ein. Jedes gepackte Paket wird sofort gutgeschrieben; DDL holt am Abend alles von der Rampe ab.';
}
/* Nur Zahlen, kein Neuaufbau: so springt die Liste beim Tippen nicht. */
function onlineZahlen(){
  const offen=S.offen|0, pak=S.pakete|0;
  return {
    offen, pak,
    wert  : paketWert(),
    proTag: bestellungenProTag(),
    heute : r2(DS.versand||0),
    frei  : Math.max(0,PAKET_BAYS-pak)
  };
}
function updateOnline(){
  if(!laptopOpen||ltab!=='online') return;
  const z=onlineZahlen();
  const set=(id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
  set('onOffen',z.offen); set('onPak',z.pak+' von '+PAKET_BAYS);
  set('onHeute',eur(z.heute)); set('onWert',eur(z.wert));
  const b1=document.getElementById('onPack'), b2=document.getElementById('onPackAll');
  if(b1) b1.disabled=z.offen<=0;
  if(b2) b2.disabled=z.offen<=0;
  const w=document.getElementById('onWarn');
  if(w) w.textContent=z.offen>8?`${z.offen} offene Bestellungen - über acht kostet dich das heute Abend Ruf.`:'';
}
function renderOnline(){
  const st=onlineStufe(), z=onlineZahlen();
  if(st==='zu'){
    const u=UPGRADES.find(x=>x.id==='onlineshop');
    return `<div class="row"><img class="pic" src="${upPic('onlineshop')}" alt="">`+
      `<div class="rm"><b>Onlineshop</b><small>${u?u.desc:''}</small>`+
      `<small class="warn">${S.level<(u?u.lvl:18)?`Ab Level ${u?u.lvl:18}`:`Kosten ${eur(u.cost())}`}</small></div>`+
      (S.level<(u?u.lvl:18)?`<small>Level ${u?u.lvl:18}</small>`
        :`<button data-a="up" data-t="onlineshop" ${S.money<u.cost()?'disabled':''}>${eur(u.cost())}</button>`)+
      `</div>`;
  }
  let h=`<div class="row"><div class="rm"><b>Shop ist online</b>`+
    `<small>Ruf ${Math.round(S.rep)} von 100 · Level ${S.level}. Beides bestimmt, wie viel über den Shop hereinkommt.</small>`+
    `<small class="ok">${st==='versand'?`Rund ${z.proTag} Bestellungen an einem vollen Verkaufstag`:'Tagespauschale, keine echten Bestellungen'}</small>`+
    `</div></div>`;
  if(st==='pauschal'){
    const u=UPGRADES.find(x=>x.id==='packstation'), fehlt=u&&u.req&&!S.up[u.req]?UPGRADES.find(x=>x.id===u.req):null;
    h+=`<div class="row"><img class="pic" src="${upPic('packstation')}" alt="">`+
      `<div class="rm"><b>Packstation fehlt</b><small>${u?u.desc:''}</small>`+
      `<small class="warn">${fehlt?`Setzt „${fehlt.name}“ voraus`:S.level<u.lvl?`Ab Level ${u.lvl}`:`Kosten ${eur(u.cost())}`}</small></div>`+
      (fehlt||S.level<u.lvl?'<small>gesperrt</small>'
        :`<button data-a="up" data-t="packstation" ${S.money<u.cost()?'disabled':''}>${eur(u.cost())}</button>`)+
      `</div>`;
    return h;
  }
  h+=`<div class="row"><div class="rm"><b>Offene Bestellungen</b>`+
      `<small>Warten darauf, gepackt zu werden. Jedes Paket bringt <span id="onWert">${eur(z.wert)}</span>.</small>`+
      `<small class="warn" id="onWarn">${z.offen>8?`${z.offen} offene Bestellungen - über acht kostet dich das heute Abend Ruf.`:''}</small></div>`+
    `<div class="mkcol"><small>offen</small><b style="font-family:var(--display);font-size:24px" id="onOffen">${z.offen}</b></div>`+
    `<button id="onPack" data-a="vpack" ${z.offen<=0?'disabled':''}>Paket packen</button>`+
    `<button class="ghost" id="onPackAll" data-a="vpackall" ${z.offen<=0?'disabled':''}>Alle packen</button>`+
    `</div>`;
  h+=`<div class="row"><div class="rm"><b>Pakete auf der Abholrampe</b>`+
      `<small>Ist die Rampe voll, fährt DDL zwischendurch vor. Am Abend wird ohnehin alles abgeholt.</small></div>`+
    `<div class="mkcol"><small>Rampe</small><b style="font-family:var(--display);font-size:20px" id="onPak">${z.pak} von ${PAKET_BAYS}</b></div></div>`;
  h+=`<div class="row"><div class="rm"><b>Versand heute</b>`+
      `<small>Was der Onlineshop heute schon eingebracht hat. Der Betrag steckt bereits im Tagesumsatz.</small></div>`+
    `<div class="mkcol"><small>Umsatz</small><b style="font-family:var(--display);font-size:20px" id="onHeute">${eur(z.heute)}</b></div></div>`;
  const pk=staff&&staff.packer;
  h+=`<div class="row${pk?'':' locked'}"><div class="rm"><b>Packer</b>`+
      `<small>${pk?'Packt selbstständig, solange Bestellungen offen sind.':'Ohne Packer bleibt alles an dir hängen - einstellen kannst du ihn unter Personal.'}</small></div>`+
    `<small class="${pk?'ok':''}">${pk?'im Dienst':'nicht eingestellt'}</small></div>`;
  return h;
}
/* Packen aus dem Laptop heraus: derselbe Vorgang wie am Packtisch. */
function packLaptop(alle){
  if(!packBereit()) return;
  if((S.offen|0)<=0){ toast('Gerade sind keine Bestellungen offen.'); return; }
  /* packOne(true) unterdrueckt Ton, Erfahrung und Einzelmeldung -
     sonst prasselt beim Sammelpacken ein Dutzend Toasts herunter.
     Beides kommt danach einmal fuer den ganzen Stapel. */
  const max=alle?PAKET_BAYS*8:1;
  let n=0, wert=0;
  while(n<max&&(S.offen|0)>0){ const w=paketWert(); if(!packOne(true)) break; n++; wert=r2(wert+w); }
  if(n>0){ addXP(3*n); sfx.beep(); save();
    toast(`${n} Paket${n===1?'':'e'} gepackt: +${eur(wert)}`,'money'); }
  renderLaptop();
}
function renderLaptop(){
  $('lMoney').textContent=eur(S.money);
  $('lLevel').textContent=`Level ${S.level} · ${S.xp}/${xpFor(S.level)} XP`;
  document.querySelectorAll('#ltabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===ltab));
  const kb=$('lKorb'); if(kb) kb.textContent=korbBtnText();
  let h='', hint='';
  if(ltab==='order'){
    const sup=supplierOf(lsup), avail=supAvail();
    if(!avail.some(x=>x.id===lsup)) lsup='mertens';
    hint=`Artikel in den Warenkorb legen, dann alles zusammen bestellen. Eine Lieferung braucht ${LIEFERZEIT_SEK} Sekunden, Versand ${eur(VERSAND)} und ab ${eur(VERSANDFREI)} Warenwert frei.`;
    h=`<div class="row"><div class="rm"><b>Lieferanten</b><small>${sup.desc}</small><small class="${qualityLabel(sup.quality)[0]}">${qualityLabel(sup.quality)[1]} · Lieferzeit ${LIEFERZEIT_SEK} Sekunden</small></div></div>`+
      `<div class="row" style="padding-top:6px"><div class="steps" style="justify-content:flex-start">`+
      SUPPLIERS.map(x=>S.level>=x.lvl
        ? `<button data-a="sup" data-t="${x.id}" style="${x.id===lsup?'background:var(--signal);color:var(--ink)':'opacity:.8'}">${x.short}</button>`
        : `<button disabled>${x.short} · Lvl ${x.lvl}</button>`).join('')+`</div></div>`;
    if(sup.mystery){
      h+=PACKS.map(pk=>{ const lock=S.level<pk.lvl;
        return `<div class="row${lock?' locked':''}"><div class="rm"><b>${pk.name}</b><small>${pk.desc}</small><small>Inhalt zufällig, Restposten-Qualität</small></div>`+
          (lock?`<small>ab Level ${pk.lvl}</small>`:`<button data-a="pack" data-t="${pk.id}">+ ${eur(pk.cost)}</button>`)+'</div>'; }).join('');
    } else {
      const tiers=sup.tiers||[{n:1,d:0}];
      /* Gesperrte Ware nur so weit zeigen, wie sie in Reichweite ist */
      h+=ORDER.filter(t=>canOrder(t)&&(isUnlocked(t)||lizLevel(t)<=S.level+5)).map(t=>{ const p=P[t], un=isUnlocked(t), cap=shelfCapOf(t);
        if(!un){ const l=lizenzDaten(lizenzOf(t));
          return `<div class="row locked"><div class="rm"><b>${p.name} ${catPill(p)}</b><small>${l?`Gehört zum Lizenzpaket „${l.name}“ (ab Level ${l.lvl}). Unter Sortiment freischalten.`:`Wird ab Level ${p.lvl} freigeschaltet.`}</small></div><small>${l?'Lizenz':'Level '+p.lvl}</small></div>`; }
        const btns=tiers.map(tr=>{ const c=tierPrice(t,sup,tr);
          return `<button data-a="cart" data-t="${t}" data-n="${tr.n}">+ ${tr.n}× ${eur(c)}${tr.d?` <span style="opacity:.7">−${Math.round(tr.d*100)}%</span>`:''}</button>`; }).join('');
        return `<div class="row"><div class="rm"><b>${p.name} ${catPill(p)}</b><small>Karton mit ${p.box} Stück${canShelf(t)?(cap?` · größtes Fach fasst ${cap}`:' · kein passendes Regal'):' · nur für den Automaten'}</small><small>Im Laden: ${shelfStockOf(t)} im Regal, ${stockOf(t)} insgesamt</small></div>`+
          `<div class="steps">${btns}</div></div>`; }).join('');
    }
  } else if(ltab==='price'){
    hint=`Der Markt bewegt sich jeden Tag. Marktpreis ist, was die Kunden gerade erwarten; der Einkauf reagiert schneller als sie. Fällt der Einkauf, kaufst du günstig ein und verkaufst noch zum alten Preis. Marktlage: ${marktText()} · Inflation seit Beginn ${inflText()}.`;
    const news=(S.news||[]);
    if(news.length) h+=`<div class="row"><div class="rm"><b>Meldungen von heute</b>`+
      news.map(n=>`<small class="${n.knapp?'no':'ok'}">${P[n.t]?P[n.t].short:''}: ${n.text} · ${n.knapp?'Preis zieht an':'Preis fällt'}</small>`).join('')+
      `</div></div>`;
    h+=`<div class="row"><div class="rm"><b>Alle Preise nachziehen</b><small>Setzt jeden Verkaufspreis auf das aktuelle Marktniveau. Praktisch nach einem Preissprung.</small></div>`+
      `<div class="steps"><button data-a="pall" data-d="1">auf Markt</button><button data-a="pall" data-d="1.08">Markt +8 %</button><button data-a="pall" data-d="0.94">Markt −6 %</button></div></div>`;
    h+=ORDER.filter(t=>isUnlocked(t)&&t!=='blanko'&&!P[t].noOrder).map(t=>{
      const p=P[t], hi=priceHint(t), mp=marketOf(t), ek=r2(costOf(t)*ekFactor()), d=marktDelta(t),
            ph=marktPhase(t), sch=marktSchock(t), lab=marktLabel(t);
      const pill=d>0.4?`<span class="pill up">+${d.toFixed(1)} %</span>`:d<-0.4?`<span class="pill dn">${d.toFixed(1)} %</span>`:`<span class="pill fl">±0</span>`;
      return `<div class="row"><div class="rm"><b>${p.name} ${pill}</b>`+
        `<small>Markt ${eur(mp)} · Einkauf ${eur(ek)} · Gewinn je Stück ${eur(r2(S.prices[t]-ek))}</small>`+
        `<small class="${lab[0]}">${lab[1]} · Markt ${ph.name}${sch?(sch.k==='knapp'?' · Ware knapp':' · Ware im Überfluss'):''}</small>`+
        (marktLuecke(t)>=7?`<small class="ok">Günstige Gelegenheit: Einkauf liegt ${marktLuecke(t)} % unter dem, was die Kunden zahlen</small>`
         :marktLuecke(t)<=-7?`<small class="no">Schlechter Moment: Einkauf liegt ${-marktLuecke(t)} % über dem Kundenpreis</small>`:'')+
        `<small class="${hi[0]}">${hi[1]}</small></div>`+
        `<div class="mkcol"><img class="spark" src="${sparkPic(t)}" alt=""><small>Normalpreis ${marktNiveau(t)>0?'+':''}${marktNiveau(t)} %</small></div>`+
        `<div class="price">${eur(S.prices[t])}</div>`+
        `<div class="steps"><button data-a="p" data-t="${t}" data-d="-1">−1</button><button data-a="p" data-t="${t}" data-d="-0.1">−0,10</button><button data-a="p" data-t="${t}" data-d="0.1">+0,10</button><button data-a="p" data-t="${t}" data-d="1">+1</button><button data-a="pm" data-t="${t}">= Markt</button></div></div>`; }).join('');
  } else if(ltab==='liz'){
    const next=naechsteLizenz();
    hint=next
      ? `Neue Ware kommt als Lizenzpaket ins Sortiment. Als Nächstes: ${next.name} ab Level ${next.lvl}.`
      : 'Du hast jedes Lizenzpaket. Im Regal steht alles, was der Markt hergibt.';
    h=LIZENZEN.map(l=>{ const hat=hatLizenz(l.id), lock=S.level<l.lvl;
      const sichtbar=hat||S.level>=l.lvl-3;
      const items=l.items.filter(t=>P[t]).map(t=>hat||sichtbar?`<span>${P[t].short}</span>`:'<span>???</span>').join('');
      return `<div class="row lizrow${lock&&!hat?' locked':''}">`+
        `<img class="pic" src="${lizPic(l.id)}" alt="">`+
        `<div class="rm"><b>${l.name}</b><small>${sichtbar?l.desc:'Noch nicht im Angebot. Spiel weiter, dann meldet sich der Großhandel.'}</small>`+
        `<div class="lizitems">${items}</div>`+
        (hat?'':lock?`<small class="warn">Ab Level ${l.lvl}</small>`:`<small>Lizenzgebühr ${eur(l.cost)} · einmalig</small>`)+
        `</div>`+
        (hat?'<small class="ok">Im Sortiment</small>'
            :lock?`<small>Level ${l.lvl}</small>`
            :`<button data-a="liz" data-t="${l.id}" ${S.money<l.cost?'disabled':''}>${eur(l.cost)}</button>`)+
        '</div>'; }).join('');
  } else if(ltab==='up'||ltab==='einr'||ltab==='markt'){
    const kat=ltab==='up'?'flaeche':ltab;
    hint=kat==='flaeche'
      ? 'Mehr Fläche für Verkauf und Lager. Die Bauwände im Laden zeigen, was du hier freischaltest. Teuer, aber die nachhaltigste Investition.'
      : kat==='einr'
      ? 'Regale, Kassen und Technik im Laden. Ein Karton passt meist genau in ein Regalfach.'
      : 'Alles, was dir mehr Kundschaft und bessere Konditionen bringt.';
    const liste=UPGRADES.filter(u=>(u.kat||'einr')===kat).sort((a,b)=>a.lvl-b.lvl);
    h=liste.map(u=>{ const done=u.done(), cost=u.cost();
      const fehlt=u.req&&!S.up[u.req]?UPGRADES.find(x=>x.id===u.req):null;
      const lock=S.level<u.lvl||!!fehlt;
      return `<div class="row${lock&&!done?' locked':''}">`+
        `<img class="pic" src="${upPic(u.id)}" alt="">`+
        `<div class="rm"><b>${u.name}</b><small>${u.desc}</small>`+
        (done?'':fehlt?`<small class="warn">Setzt „${fehlt.name}“ voraus</small>`
             :S.level<u.lvl?`<small class="warn">Ab Level ${u.lvl}</small>`:`<small>Kosten ${eur(cost)}</small>`)+
        `</div>`+
        (done?'<small class="ok">Erledigt</small>'
            :fehlt?'<small>gesperrt</small>'
            :S.level<u.lvl?`<small>Level ${u.lvl}</small>`
            :`<button data-a="up" data-t="${u.id}" ${S.money<cost?'disabled':''}>${eur(cost)}</button>`)+
        '</div>'; }).join('');
  } else if(ltab==='online'){
    h=renderOnline(); hint=onlineHint();
  } else if(ltab==='erf'){
    const offen=ERFOLGE.filter(erfOffen);
    hint=`${erfGeschafft()} von ${erfGesamt()} Stufen geschafft. Jeder Zähler steigt nur — verlieren kannst du hier nichts. Neue Herausforderungen kommen dazu, sobald du den passenden Bereich freischaltest.`;
    if(S.gutschrift>0) hint+=` Offene Warengutschrift: ${eur(S.gutschrift)}, wird beim nächsten Wareneinkauf verrechnet.`;
    const kats=[];
    offen.forEach(e=>{ if(kats.indexOf(e.kat)<0) kats.push(e.kat); });
    h=kats.map(kat=>{
      const liste=offen.filter(e=>e.kat===kat);
      return `<div class="kathead">${kat}</div>`+liste.map(e=>{
        const fertig=erfFertig(e), ziel=erfZiel(e), stand=erfStand(e);
        const zeig=v=>e.geld?eur(v):String(v);
        const stufen=e.stufen.map((_,i)=>`<b class="${erfStufe(e)>i?'on':''}">${i+1}</b>`).join('');
        return `<div class="row"><img class="pic" src="${erfPic(e)}" alt="">`+
          `<div class="rm"><b>${e.name}${fertig?' <span class="pill dn">fertig</span>':''}</b>`+
          `<small>${e.rekord?'Bestwert: ':''}${e.desc}</small>`+
          `<small class="${fertig?'ok':''}">${zeig(stand)}${ziel!==null?' von '+zeig(ziel):''}${fertig?' — alle Stufen geschafft':''}</small>`+
          `<div class="erfbar"><i style="width:${Math.round(erfAnteil(e)*100)}%"></i></div>`+
          `<div class="erfstufen">${stufen}</div></div>`+
          (fertig?'<small class="ok">✓</small>'
                 :`<div class="mkcol"><small>Nächste Prämie</small><b style="font-family:var(--display);font-size:18px">${eur(e.lohn[erfStufe(e)]||0)}</b></div>`)+
          '</div>'; }).join('');
    }).join('');
    const zu=ERFOLGE.filter(e=>!erfOffen(e)).length;
    if(zu) h+=`<div class="row locked"><div class="rm"><b>${zu} weitere Herausforderungen</b><small>Sie erscheinen, sobald du den passenden Bereich freigeschaltet hast: Lizenzpakete, Onlineshop, Packstation, Großkunden oder das Entwicklungslabor.</small></div></div>`;
  } else if(ltab==='rez'){
    h=renderRezeptur(); hint=rezHint;
  } else if(ltab==='deko'){
    hint=`Stimmung im Laden: ${ambienteScore()} von 100. Verschieben geht im Umbaumodus.`;
    const sw=(arr,cur,kind)=>arr.map(w=>{ const lock=S.level<w.lvl, own=cur===w.id;
      let bg=kind==='wall'?`linear-gradient(160deg,${w.up} 55%,${w.low} 55%)`:`linear-gradient(160deg,${w.a} 55%,${w.b} 55%)`;
      if(kind==='wall'&&w.pat==='streifen') bg=`linear-gradient(160deg,${w.up} 55%,${w.low} 55%),repeating-linear-gradient(90deg,${w.pat2} 0 4px,transparent 4px 9px)`;
      if(kind==='wall'&&w.pat) bg=`repeating-linear-gradient(${w.pat==='raute'?'45deg':w.pat==='holz'?'90deg':'0deg'},${w.pat2} 0 3px,${w.up} 3px 8px)`;
      if(kind==='floor'&&w.check) bg=`repeating-conic-gradient(${w.a} 0 25%,${w.b} 0 50%) 0 0/16px 16px`;
      if(kind==='floor'&&w.wood) bg=`repeating-linear-gradient(90deg,${w.a} 0 6px,${w.b} 6px 12px)`;
      return `<button class="sw${own?' on':''}" title="${w.name}${w.cost?' · '+eur(w.cost):' · frei'}${S.level<w.lvl?' (ab Lvl '+w.lvl+')':''}" data-a="${kind}" data-t="${w.id}" style="background:${bg}" ${lock?'disabled':''}></button>`; }).join('');
    const wNow=WALLS.find(w=>w.id===S.wall)||WALLS[0], fNow=FLOORS.find(f=>f.id===S.floor)||FLOORS[0];
    /* Regalschilder: die Muster zeigen immer die Kombination aus
       Hintergrund und Schrift, damit man sieht, was man bekommt. */
    const bgN=schildBg(), fgN=schildFg();
    const swSchild=(arr,cur,kind)=>arr.map(o=>{
      const bg=kind==='schildbg'?(o.c||'linear-gradient(90deg,#2f7fd0 33%,#2f9e57 33% 66%,#c8322a 66%)'):(bgN.c||'#2f5d9e');
      const fg=kind==='schildbg'?fgN.c:o.c;
      return `<button class="sw${cur===o.id?' on':''}" title="${o.name}" data-a="${kind}" data-t="${o.id}"`+
        ` style="background:${bg};color:${fg};font-family:var(--display);font-size:13px;line-height:42px">Aa</button>`; }).join('');
    h=`<div class="row dekorow"><div class="rm"><b>Wandfarbe</b><small>Aktuell: ${wNow.name}</small><small>${wallPreis(wNow)}</small></div><div class="swatches">${sw(WALLS,S.wall,'wall')}</div></div>`+
      `<div class="row dekorow"><div class="rm"><b>Bodenbelag</b><small>Aktuell: ${fNow.name}</small><small>${wallPreis(fNow)}</small></div><div class="swatches">${sw(FLOORS,S.floor,'floor')}</div></div>`+
      `<div class="row dekorow"><div class="rm"><b>Regalschilder: Hintergrund</b><small>Aktuell: ${bgN.name}</small><small>Die Kopfschilder über den Verkaufsregalen. Drucken kostet nichts.</small></div><div class="swatches">${swSchild(SCHILDBG,S.schildBg||'auto','schildbg')}</div></div>`+
      `<div class="row dekorow"><div class="rm"><b>Regalschilder: Schrift</b><small>Aktuell: ${fgN.name}</small></div><div class="swatches">${swSchild(SCHILDFG,S.schildFg||'weiss','schildfg')}</div></div>`+
      DEKO.map(d=>{ const lock=S.level<d.lvl, n=dekos.filter(x=>x.id===d.id).length;
        return `<div class="row${lock?' locked':''}"><div class="rm"><b>${d.name}</b><small>Stimmung +${d.amb}${d.desc?' · '+d.desc:''}${n?` · ${n} im Laden`:''}</small></div>`+
          (lock?`<small>ab Level ${d.lvl}</small>`:`<button data-a="deko" data-t="${d.id}" ${S.money<d.cost?'disabled':''}>${eur(d.cost)}</button>`)+'</div>'; }).join('');
  } else if(ltab==='staff'){
    hint=`Löhne heute: ${eur(dailyWages())} · werden beim Tagesabschluss abgebucht.`;
    hint+=` Freundlichkeit im Laden: ${Math.round(friendliness()*100)} %. Höhere Löhne machen schneller und freundlicher. Außerhalb der Saison kannst du Leute in die Saisonpause schicken: 30 % Lohn, keine Arbeit, Rückkehr jederzeit ohne neue Einstellungskosten.`;
    h=STAFF.map(s=>{ const fehlt=s.req&&!S.up[s.req], lock=S.level<s.lvl||fehlt, has=!!S.staff[s.id];
      const isStock=s.id.indexOf('auffueller')===0;
      const prio=isStock&&has?`<small>Priorität: ${Object.keys(PRIO).map(k=>`<button data-a="prio" data-t="${s.id}" data-v="${k}" style="padding:4px 9px;font-size:14px;margin-right:4px;${prioOf(s.id)===k?'background:var(--signal);color:var(--ink)':'background:rgba(242,245,255,.12);color:var(--snow)'}">${PRIO[k]}</button>`).join('')}</small>`:'';
      const lohn=has?`<small>Lohn: ${WAGES.map(w=>`<button data-a="wage" data-t="${s.id}" data-v="${w.f}" title="${w.desc}" style="padding:4px 8px;font-size:14px;margin-right:4px;${wageOf(s.id)===w.f?'background:var(--mint);color:var(--ink)':'background:rgba(242,245,255,.12);color:var(--snow)'}">${w.name} ${eur(r2(s.wage*w.f))}</button>`).join('')}</small>`:'';
      const pause=has?`<small>${inPause(s.id)?`In Saisonpause · ${eur(r2(s.wage*wageOf(s.id)*0.3))} pro Tag`:'Im Dienst'} <button data-a="pause" data-t="${s.id}" style="padding:4px 9px;font-size:14px;margin-left:6px;${inPause(s.id)?'background:var(--mint);color:var(--ink)':'background:rgba(242,245,255,.12);color:var(--snow)'}">${inPause(s.id)?'Zurück in den Dienst':'In Saisonpause schicken'}</button></small>`:'';
      return `<div class="row${lock?' locked':''}"><div class="rm"><b>${s.name}</b><small>${s.desc}</small><small>Einstellung ${eur(s.hire)} · Grundlohn ${eur(s.wage)} pro Tag</small>${lohn}${pause}${prio}</div>`+
        (fehlt?'<small>braucht die Packstation</small>':lock?`<small>ab Level ${s.lvl}</small>`:has?`<button class="red" data-a="fire" data-t="${s.id}">Kündigen</button>`:`<button data-a="hire" data-t="${s.id}" ${S.money<s.hire?'disabled':''}>Einstellen</button>`)+'</div>'; }).join('');
  } else if(ltab==='bank'){
    const t=loanTier(), L=S.loan;
    hint=t?`Dein Kreditrahmen: ${eur(t.amount)}.`:'Kredite gibt es ab Level 5.';
    if(L){
      h=`<div class="row"><div class="rm"><b>Laufender Kredit</b><small>Aufgenommen: ${eur(L.amount)} · offen: ${eur(L.remaining)}</small><small>Rate ${eur(loanDaily())} pro Tag (Tilgung ${eur(r2(L.amount/L.term))} + ${Math.round(L.rate*1000)/10} % Zinsen)</small></div><div class="price">${eur(L.remaining)}</div></div>`+
        `<div class="row"><div class="rm"><b>Vorzeitig tilgen</b><small>Spart Zinsen und bringt Erfahrung.</small></div><div class="steps"><button data-a="repay" data-v="250" ${S.money<Math.min(250,L.remaining)?'disabled':''}>250 €</button><button data-a="repay" data-v="1000" ${S.money<Math.min(1000,L.remaining)?'disabled':''}>1.000 €</button><button data-a="repay" data-v="0" ${S.money<L.remaining?'disabled':''}>Alles</button></div></div>`;
    } else if(t){
      h=LOANS.filter(l=>S.level>=l.lvl).map(l=>{ const daily=r2(l.amount/l.term+l.amount*l.rate), total=r2(daily*l.term);
        return `<div class="row"><div class="rm"><b>${eur(l.amount)} über ${l.term} Tage</b><small>Rate am ersten Tag ${eur(daily)}, danach sinkt sie</small><small>Zinssatz ${Math.round(l.rate*1000)/10} % pro Tag · Rückzahlung rund ${eur(total)}</small></div><button data-a="loan" data-v="${l.amount}">Aufnehmen</button></div>`; }).join('')+
        LOANS.filter(l=>S.level<l.lvl).map(l=>`<div class="row locked"><div class="rm"><b>${eur(l.amount)}</b><small>Größerer Rahmen ab Level ${l.lvl}</small></div><small>Level ${l.lvl}</small></div>`).join('');
    } else h=`<div class="row"><div class="rm"><b>Noch kein Kreditrahmen</b><small>Ab Level 5 gibt dir die Bank 1.000 €. Danach wächst der Rahmen mit deinem Laden.</small></div></div>`;
  } else if(ltab==='stats'){
    hint='Alle Zahlen gelten für den laufenden Tag.';
    const need=xpFor(S.level), nxt=levelUnlocks(S.level+1);
    h=`<div class="row"><div class="rm"><b>Level ${S.level}</b><small>${S.xp} von ${need} XP bis Level ${S.level+1}</small><small>${nxt.length?'Als Nächstes: '+nxt.slice(0,3).join(', '):'Weitere Freischaltungen folgen.'}</small></div><div class="price">${Math.round(S.xp/need*100)} %</div></div>`+
      `<div class="row"><div class="rm"><b>Heute</b><small>Umsatz ${eur(DS.revenue)} · ${DS.customers} Kunden · ${DS.sold} Artikel</small><small>Verpasst ${DS.missed} · genervt ${DS.angry} · Diebstahl ${eur(DS.stolen)}</small></div></div>`+
      `<div class="row"><div class="rm"><b>Laden</b><small>Ruf ${Math.round(S.rep)}/100 · Stimmung ${ambienteScore()}/100 · Sauberkeit ${cleanliness()}/100</small><small>${shelves.length} Verkaufsregale · ${racks.length} Lagerregale · ${dekos.length} Deko</small></div></div>`+
      (todayEvent()?`<div class="row"><div class="rm"><b>Heute: ${todayEvent().name}</b><small>${todayEvent().txt}</small></div></div>`:'')+
      (S.goal?`<div class="row"><div class="rm"><b>Wochenziel: ${S.goal.name}</b><small>${Math.round(S.goal.have)} von ${S.goal.need} ${S.goal.unit} · noch ${S.goal.days} Tag${S.goal.days===1?'':'e'}</small><small>Prämie ${eur(S.goal.pay)}</small></div><div class="price">${Math.min(100,Math.round(S.goal.have/S.goal.need*100))} %</div></div>`:'')+
      `<div class="row"><div class="rm"><b>Marktlage</b><small>${marktText()} · Inflation seit Beginn ${inflText()}</small><small>Konkurrenz: ${(S.comp||1)<0.96?'drückt die Preise':(S.comp||1)>1.04?'ist teuer, gut für dich':'unauffällig'}</small>${marktChance()?`<small class="ok">Gerade günstig im Einkauf: ${P[marktChance()].short}</small>`:''}</div></div>`+
      (()=>{ const offen=ORDER.filter(t=>isUnlocked(t)&&!P[t].noOrder).length, n=naechsteLizenz();
        return `<div class="row"><div class="rm"><b>Sortiment</b><small>${offen} Sorten im Angebot · ${(S.lic||[]).length} von ${LIZENZEN.length} Lizenzpaketen</small><small>${n?`Als Nächstes: ${n.name} ab Level ${n.lvl} für ${eur(n.cost)}`:'Alle Lizenzpakete gekauft.'}</small></div><div class="price">${Math.round((S.lic||[]).length/LIZENZEN.length*100)} %</div></div>`; })()+
      `<div class="row"><div class="rm"><b>Fixkosten pro Tag</b><small>Miete und Strom ${eur(fixedCosts())} · Löhne ${eur(dailyWages())}</small><small>Umsatz im Jahr ${eur(S.seasonRevenue)}</small></div></div>`;
  } else {
    hint='Der Spielstand liegt in diesem Browser.';
    const st=phase==='closed'?(ruhetag()?`Sonntag, Ruhetag. ${dateStr(S.day)}.`:`Geschlossen. Heute ist ${dateStr(S.day)}. ${seasonInfo(S.day)[1]}.`):phase==='open'?'Geöffnet bis 22 Uhr.':phase==='closing'?'22 Uhr, die letzten Kunden sind noch da.':'Feierabend. Du kannst den Tag beenden.';
    h=`<div class="row"><div class="rm"><b>${st}</b><small>Heute: ${eur(DS.revenue)} Umsatz, ${DS.customers} Kunden</small></div>${phase==='closed'?'<button data-a="open">Laden öffnen</button>':phase==='after'?'<button data-a="end">Tag beenden</button>':''}</div>`+
      `<div class="row"><div class="rm"><b>Testmodus</b>`+
        (S.test
          ? `<small class="warn">Aktiv: Level 25, alle Lizenzpakete und Ausbauten offen.</small><small>Beim Ausschalten kommen dein altes Level (${S.test.lvl}), deine XP, dein Kontostand und dein altes Sortiment zurück. Gekaufte Regale, Deko und Personal bleiben im Laden.</small>`
          : `<small>Schaltet vorübergehend alles frei: Level 25, jedes Lizenzpaket und ein volles Konto zum Ausprobieren.</small><small>Dein jetziger Stand wird gemerkt und beim Ausschalten wiederhergestellt.</small>`)+
        `</div><button class="${S.test?'red':''}" data-a="test">${S.test?'Testmodus aus':'Testmodus an'}</button></div>`+
      `<div class="row"><div class="rm"><b>Spielstand</b><small>Wird automatisch gespeichert.</small></div><button class="ghost" data-a="reset">${resetArm?'Wirklich löschen?':'Spielstand löschen'}</button></div>`;
  }
  $('lbody').innerHTML=h;
  if(korbOpen) renderKorb();
}
$('lKorb').addEventListener('click',()=>openKorb());
for(const id of ['korbBody','korbFoot']) $(id).addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b||b.disabled) return; const a=b.dataset.a;
  if(a==='korbclose'){ closeKorb(); return; }
  else if(a==='cartdel') cartDel(+b.dataset.i);
  else if(a==='cartplus') cartStep(+b.dataset.i,1);
  else if(a==='cartminus') cartStep(+b.dataset.i,-1);
  else if(a==='cartclear') cartClear();
  else if(a==='cartgo'){ cartOrder(); return; }
  renderKorb(); renderLaptop();
});
$('korbOv').addEventListener('click',e=>{ if(e.target.id==='korbOv') closeKorb(); });
$('ltabs').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; ltab=b.dataset.tab; resetArm=false; renderLaptop(); });
$('lbody').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b||b.disabled) return; const a=b.dataset.a, t=b.dataset.t;
  if(a==='order') orderBox(t,+b.dataset.n||1);
  else if(a==='cart') cartAdd(t,+b.dataset.n||1);
  else if(a==='cartdel') cartDel(+b.dataset.i);
  else if(a==='cartplus') cartStep(+b.dataset.i,1);
  else if(a==='cartminus') cartStep(+b.dataset.i,-1);
  else if(a==='tab'){ ltab=t; }
  else if(a==='korbclose'){ closeKorb(); return; }
  else if(a==='cartgo') cartOrder();
  else if(a==='cartclear') cartClear();
  else if(a==='sup'){ lsup=t; }
  else if(a==='pack') cartAddPack(t);
  else if(a==='p'){ S.prices[t]=Math.max(0.1,r2(S.prices[t]+parseFloat(b.dataset.d))); allLevels().forEach(l=>{ if(l.type===t) updateLabel(l); }); }
  else if(a==='pm'){ setPreisAufMarkt(t,1); }
  else if(a==='pall'){ const f=parseFloat(b.dataset.d)||1; let n=0;
    ORDER.forEach(t2=>{ if(isUnlocked(t2)&&!P[t2].noOrder&&t2!=='blanko'){ setPreisAufMarkt(t2,f); n++; } });
    toast(`${n} Preise ans Marktniveau angepasst.`); save(); }
  else if(a==='liz') buyLizenz(t);
  else if(a==='rz'){ const f=b.dataset.f, v=b.dataset.v;
    entwurfInit();
    if(f==='eff2') entwurf.eff2=v||null; else entwurf[f]=v; }
  else if(a==='rzproto'){ rezNameLesen(); rezProto(); return; }
  else if(a==='rzbau'){ rezNameLesen(); rezBauen(); }
  else if(a==='up') buyUp(t);
  else if(a==='deko') buyDeko(t);
  else if(a==='wall') setWall(t);
  else if(a==='floor') setFloor(t);
  else if(a==='schildbg'||a==='schildfg') setSchild(a,t);
  else if(a==='hire'){ const s=STAFF.find(x=>x.id===t); if(!s||S.money<s.hire||S.staff[t]||S.level<s.lvl||(s.req&&!S.up[s.req])) return; S.money=r2(S.money-s.hire); DS.upgrades=r2(DS.upgrades+s.hire); S.staff[t]=true; hireStaff(t); sfx.cash(); toast(`${s.name} eingestellt.`); save(); }
  else if(a==='fire'){ const s=STAFF.find(x=>x.id===t); if(!s) return; S.staff[t]=false; fireStaff(t); toast(`${s.name} gekündigt.`); save(); }
  else if(a==='pause'){ setPause(t,!inPause(t)); toast(inPause(t)?`${STAFF.find(x=>x.id===t).name}: Saisonpause.`:`${STAFF.find(x=>x.id===t).name} ist zurück im Dienst.`); }
  else if(a==='wage'){ setWage(t,+b.dataset.v); toast(`${STAFF.find(x=>x.id===t).name}: ${wageName(t)}.`); }
  else if(a==='prio'){ setPrio(t,b.dataset.v); toast(`${STAFF.find(x=>x.id===t).name}: ${PRIO[b.dataset.v]}.`); }
  else if(a==='loan') takeLoan(+b.dataset.v);
  else if(a==='repay') repayLoan(+b.dataset.v);
  else if(a==='open'){ openShop(); closeLaptop(true); return; }
  else if(a==='end'){ endDay(); return; }
  /* 'pack' ist schon vergeben - das legt ein Lieferantenpaket in den
     Warenkorb. Der Versand heisst deshalb 'vpack'. */
  else if(a==='vpack')   { packLaptop(false); return; }
  else if(a==='vpackall'){ packLaptop(true);  return; }
  else if(a==='test'){ toggleTest(); }
  else if(a==='reset'){ if(!resetArm) resetArm=true; else { try{ localStorage.removeItem(KEY); }catch(err){} location.reload(); return; } }
  renderLaptop();
});
$('lclose').addEventListener('click',()=>closeLaptop(true));
/* Hoechste Stufe, die im Spiel ueberhaupt verlangt wird - Ausbauten,
   Lizenzen und Regale zusammengenommen. */
function testLevel(){
  let m=1;
  UPGRADES.forEach(u=>{ if(u.lvl>m) m=u.lvl; });
  LIZENZEN.forEach(l=>{ if(l.lvl>m) m=l.lvl; });
  return m;
}
function toggleTest(){
  if(S.test){
    const t=S.test; S.level=Math.max(1,t.lvl|0); S.xp=Math.max(0,t.xp|0); S.money=r2(t.money);
    S.lic=Array.isArray(t.lic)&&t.lic.length?t.lic.slice():['start']; S.test=null;
    pendingLevels.length=0;
    toast('Testmodus aus. Level und Konto sind zurück.');
  } else {
    S.test={lvl:S.level,xp:S.xp,money:S.money,lic:(S.lic||['start']).slice()};
    /* Feste 25 waren zu wenig: die Lagerhalle West steht auf 28, der
       Meisterbrief auf 30. Im Testmodus soll alles erreichbar sein,
       also richtet sich die Stufe nach dem teuersten Eintrag im
       Spiel und nicht nach einer Zahl von damals. */
    S.level=Math.max(S.level,testLevel()); S.xp=0; S.money=Math.max(S.money,250000);
    S.lic=LIZENZEN.map(l=>l.id);
    LIZENZEN.forEach(l=>l.items.forEach(t2=>{ if(P[t2]&&!(S.prices[t2]>0)) S.prices[t2]=marketOf(t2); }));
    toast(`Testmodus an: Level ${S.level}, alle Lizenzpakete freigeschaltet.`,'money');
  }
  sfx.cash(); updateTool(); save();
}
/* Frueher brach der Kauf bei jedem Hindernis wortlos ab - der Knopf
   tat schlicht nichts und man stand ratlos davor. Jetzt sagt das
   Spiel, was fehlt. */
function buyUp(id){
  const u=UPGRADES.find(x=>x.id===id); if(!u) return;
  if(u.done()){ toast(`${u.name} hast du schon.`); return; }
  if(S.level<u.lvl){ toast(`${u.name} gibt es erst ab Level ${u.lvl} — du bist auf ${S.level}.`,'bad'); return; }
  if(u.req&&!S.up[u.req]){
    const v=UPGRADES.find(x=>x.id===u.req);
    toast(`${u.name} setzt „${v?v.name:u.req}“ voraus.`,'bad'); return; }
  const cost=u.cost();
  if(S.money<cost){ toast(`${u.name} kostet ${eur(cost)} — dir fehlen ${eur(r2(cost-S.money))}.`,'bad'); return; }
  S.money=r2(S.money-cost); DS.upgrades=r2(DS.upgrades+cost);
  if(id.indexOf('shelf_')===0){ const k=id.slice(6); createShelf(shelves.length,{kind:k}); S.tut.shelf=true; toast(`${SHELFKIND[k].name} steht im Laden.`); }
  else if(id==='rack'||id.indexOf('rack_')===0){
    const k=id==='rack'?'standard':id.slice(5);
    createRack(racks.length,{kind:k}); toast(`${RACKKIND[k].name} steht im Lager.`); }
  else { S.up[id]=true;
    if(ZONEN[id]){
      oeffneZone(id,true);
      if(id==='shop_gross') toast('Die Wand ist durchbrochen. Deine Verkaufsfläche ist jetzt deutlich größer.','money');
      else if(id==='shop_ost') toast('Das zweite Lokal gehört dir. Die Verkaufsfläche reicht jetzt bis ans Ende der Zeile.','money');
      else if(id==='shop_sued') toast('Das Rückgebäude ist offen. Zwei Durchgänge, zwei Gondelgassen, 478 Quadratmeter.','money');
      else if(id==='lager_gross') toast('Das Lager ist geöffnet. Hinten ist Platz für Regale und die Packstation.','money');
      else if(id==='lager_sued') toast('Die Halle Süd steht offen: 6,4 Meter hoch, Platz für Hochregale.','money');
      else if(id==='lager_west') toast('Die Westhalle mit den drei Rampen gehört dir. Auf dem Hof stehen die Auflieger.','money');
      else if(id.indexOf('rampe')===0) toast(`${u.name.split(' ')[0]} Andockstation geht in Betrieb. Das Tor ist frei.`,'money');
      else if(id==='packstation'){ drawPackSchild(); toast(S.up.onlineshop?'Die Packstation steht. Ab jetzt kommen Onlinebestellungen als Pakete herein.':'Die Packstation steht. Für den Versand brauchst du noch den Onlineshop.','money'); }
      addXP(Math.round(cost/12),'Ausbau'); sfx.cash(); save(); return;
    }
    if(id==='onlineshop'){ drawPackSchild(); }
    if(id==='kasse2'){ setSB(true); toast('Die SB-Kassen stehen. Kunden mit wenig Ware bedienen sich jetzt selbst.','money'); }
    if(id==='gravur'){ buildGravur(null); toast('Der Gravur-Automat steht. Blanko-Raketen bei Mertens bestellen.'); }
    else if(id==='grosskunden') toast('Eintrag ist online. Veranstalter rufen jetzt an.');
    else if(id==='plakat') toast('Plakate hängen. Mehr Kunden ab sofort.');
    else if(id==='tag4') toast('Ab jetzt darfst du auch sonntags öffnen.');
    else if(id==='regallicht'){ shelfLight.intensity=0.8; shelfStrips.forEach(m=>m.emissiveIntensity=1.5); }
    else toast(`${u.name} eingebaut.`);
  }
  addXP(Math.round(cost/12),'Ausbau'); sfx.cash(); save();
}
function buyDeko(id){
  const d=DEKO.find(x=>x.id===id); if(!d||S.level<d.lvl||S.money<d.cost) return;
  S.money=r2(S.money-d.cost); DS.upgrades=r2(DS.upgrades+d.cost);
  createDeko(id,null); sfx.cash(); addXP(Math.round(d.cost/12),'Deko'); toast(`${d.name} aufgestellt. Verschieben im Umbaumodus.`); save();
}
function setWall(id){ const w=WALLS.find(x=>x.id===id); if(!w||S.level<w.lvl||S.wall===id) return;
  const paid=(S.paint||[]).indexOf(id)>=0;
  if(!paid&&w.cost){ if(S.money<w.cost) return; S.money=r2(S.money-w.cost); DS.upgrades=r2(DS.upgrades+w.cost); S.paint=(S.paint||[]).concat(id); }
  S.wall=id; repaint(); sfx.pop(); toast(`Wände neu gestrichen: ${w.name}.`); save(); }
function setSchild(kind,id){
  const liste=kind==='schildbg'?SCHILDBG:SCHILDFG;
  if(!liste.some(x=>x.id===id)) return;
  if(kind==='schildbg'){ if(S.schildBg===id) return; S.schildBg=id; }
  else { if(S.schildFg===id) return; S.schildFg=id; }
  repaintSchilder(); sfx.pop();
  toast(`Regalschilder neu gedruckt: ${(liste.find(x=>x.id===id)||{}).name}.`);
  save();
}
function setFloor(id){ const f=FLOORS.find(x=>x.id===id); if(!f||S.level<f.lvl||S.floor===id) return;
  const paid=(S.paint||[]).indexOf(id)>=0;
  if(!paid&&f.cost){ if(S.money<f.cost) return; S.money=r2(S.money-f.cost); DS.upgrades=r2(DS.upgrades+f.cost); S.paint=(S.paint||[]).concat(id); }
  S.floor=id; repaint(); sfx.pop(); toast(`Neuer Boden: ${f.name}.`); save(); }
/* =========================================================
   Maske fuer die eigene Rezeptur
   ========================================================= */
let rezHint='';
function rezNameLesen(){ const i=$('rezName'); if(i&&entwurf) entwurf.name=i.value; }
/* Der Entwurf, an dem gerade gebaut wird */
let entwurf=null;
function entwurfInit(){
  if(entwurf) return entwurf;
  const tr=TRAEGER.filter(traegerOffen)[0]||TRAEGER[0];
  const bl=bruchListe();
  entwurf={traeger:tr.id,eff:bl[0]||'kugel',eff2:null,A:'gold',B:'blau',
           etikett:'klassik',name:''};
  return entwurf;
}
/* Kleines Vorschaubild fuer eine Herausforderung */
const _erfPic={};
function erfPic(e){
  if(_erfPic[e.id]) return _erfPic[e.id];
  const W=224,H=152,c=document.createElement('canvas'); c.width=W; c.height=H;
  const g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#1b2340'); gr.addColorStop(1,'#080d1a');
  g.fillStyle=gr; g.fillRect(0,0,W,H);
  const mitte=(fn)=>{ g.save(); g.translate(W/2,H/2-6); fn(); g.restore(); };
  const k=e.ikon;
  if(k==='boeller'){ mitte(()=>{ g.fillStyle='#c8322a'; g.fillRect(-16,-26,32,54);
      g.fillStyle='#f2ecd8'; g.fillRect(-16,-6,32,13); g.fillStyle='#2e8b3a'; g.fillRect(-2,-48,4,22); }); }
  else if(k==='kugel'){ mitte(()=>{ g.fillStyle='#2a1340'; g.beginPath(); g.arc(0,2,32,0,Math.PI*2); g.fill();
      g.fillStyle='#c8a2ff'; g.beginPath(); g.arc(-9,-8,11,0,Math.PI*2); g.fill();
      g.fillStyle='#e2d6ba'; g.fillRect(-32,-2,64,8); g.fillRect(-4,-30,8,64);
      g.fillStyle='#d9cbb0'; g.fillRect(-7,-42,14,12); g.fillStyle='#2e8b3a'; g.fillRect(-2,-56,4,16); }); }
  else if(k==='rakete'){ mitte(()=>{ g.fillStyle='#8a8f99'; g.fillRect(-3,-10,6,64);
      for(const dx of [-22,0,22]){ g.fillStyle='#35157a'; g.fillRect(dx-9,-52,18,30);
        g.fillStyle='#ffd23f'; g.beginPath(); g.moveTo(dx-9,-52); g.lineTo(dx,-70); g.lineTo(dx+9,-52); g.fill();
        g.fillStyle='#8a8f99'; g.fillRect(dx-2,-22,4,56); } }); }
  else if(k==='batterie'){ mitte(()=>{ g.fillStyle='#8a7047'; g.fillRect(-46,-16,92,54);
      g.fillStyle='#231a08'; g.fillRect(-42,-22,84,10);
      for(let i=0;i<7;i++){ g.fillStyle='#e8c35a'; g.beginPath(); g.arc(-36+i*12,-17,4.4,0,Math.PI*2); g.fill(); } }); }
  else if(k==='sekt'){ mitte(()=>{ g.fillStyle='#1b3a2e'; g.fillRect(-11,-30,22,62);
      g.fillStyle='#1b3a2e'; g.fillRect(-5,-58,10,30); g.fillStyle='#e8c35a'; g.fillRect(-6,-62,12,8);
      g.fillStyle='#f2f5ff'; g.fillRect(-11,-14,22,20); }); }
  else if(k==='zubehoer'){ mitte(()=>{ const cc=['#ff4fa3','#5ce1ff','#ffe45c','#8ef0a8'];
      for(let i=0;i<4;i++){ g.fillStyle=cc[i]; g.save(); g.translate(-36+i*24,0); g.rotate(i*0.5); g.fillRect(-9,-26,18,52); g.restore(); } }); }
  else if(k==='kunde'){ mitte(()=>{ g.fillStyle='#e8b894'; g.beginPath(); g.arc(0,-24,16,0,Math.PI*2); g.fill();
      g.fillStyle='#2f7fd0'; g.beginPath(); g.moveTo(-26,34); g.lineTo(-18,-6); g.lineTo(18,-6); g.lineTo(26,34); g.fill(); }); }
  else if(k==='karton'){ mitte(()=>{ g.fillStyle='#c9a978'; g.fillRect(-38,-26,76,56);
      g.fillStyle='#d8b46a'; g.fillRect(-38,-4,76,10); g.strokeStyle='#8a7350'; g.lineWidth=3; g.strokeRect(-38,-26,76,56); }); }
  else if(k==='lkw'){ mitte(()=>{ g.fillStyle='#dfe2e6'; g.fillRect(-48,-24,62,42);
      g.fillStyle='#2f5d9e'; g.fillRect(14,-10,32,28); g.fillStyle='#1b1e28';
      for(const dx of [-30,0,32]){ g.beginPath(); g.arc(dx,22,9,0,Math.PI*2); g.fill(); } }); }
  else if(k==='paket'||k==='ddl'){ mitte(()=>{ g.fillStyle='#c9a978'; g.fillRect(-34,-28,68,58);
      g.fillStyle='#e2d6ba'; g.fillRect(-34,-6,68,14); g.fillRect(-7,-28,14,58);
      if(k==='ddl'){ g.fillStyle='#e8b800'; g.fillRect(-30,-24,44,13); g.fillStyle='#c8322a'; g.fillRect(-30,-24,20,13); } }); }
  else if(k==='auftrag'){ mitte(()=>{ g.fillStyle='#f2efe6'; g.fillRect(-30,-34,60,70);
      g.fillStyle='#2f3a5e'; for(let i=0;i<5;i++) g.fillRect(-22,-24+i*13,44,5);
      g.fillStyle='#c8322a'; g.beginPath(); g.arc(22,26,13,0,Math.PI*2); g.fill(); }); }
  else if(k==='labor'){ mitte(()=>{ g.fillStyle='rgba(180,240,255,.35)'; g.beginPath();
      g.moveTo(-9,-34); g.lineTo(-9,-8); g.lineTo(-26,30); g.lineTo(26,30); g.lineTo(9,-8); g.lineTo(9,-34); g.closePath(); g.fill();
      g.fillStyle='#6cf2a8'; g.beginPath(); g.moveTo(-19,14); g.lineTo(19,14); g.lineTo(26,30); g.lineTo(-26,30); g.closePath(); g.fill();
      g.strokeStyle='#cfe0f5'; g.lineWidth=3; g.beginPath(); g.moveTo(-12,-36); g.lineTo(12,-36); g.stroke(); }); }
  else if(k==='geld'){ mitte(()=>{ for(let i=0;i<3;i++){ g.fillStyle=['#7aa9df','#8ef0a8','#f2a25a'][i];
      g.save(); g.rotate((i-1)*0.18); g.fillRect(-40,-18+i*6,80,34); g.restore(); }
      g.fillStyle='#0e1226'; g.font='700 34px sans-serif'; g.textAlign='center'; g.fillText('€',0,14); }); }
  else if(k==='kalender'){ mitte(()=>{ g.fillStyle='#f2efe6'; g.fillRect(-34,-28,68,62);
      g.fillStyle='#c8322a'; g.fillRect(-34,-28,68,16);
      g.fillStyle='#2f3a5e'; for(let r=0;r<3;r++) for(let c2=0;c2<4;c2++) g.fillRect(-26+c2*15,-4+r*14,10,9); }); }
  else if(k==='zuenden'){ mitte(()=>{ g.fillStyle='#2a2f3d'; g.fillRect(-34,4,68,30);
      g.fillStyle='#c8322a'; g.beginPath(); g.arc(0,4,15,0,Math.PI*2); g.fill();
      g.fillStyle='#ff9d92'; g.beginPath(); g.arc(-4,0,5,0,Math.PI*2); g.fill(); }); }
  else if(k==='hype'){ mitte(()=>{ for(let i=0;i<22;i++){ const a=i/22*Math.PI*2, r=rand(20,46);
      g.fillStyle=['#ffd23f','#ff4fa3','#5ce1ff','#8ef0a8'][i%4];
      g.beginPath(); g.arc(Math.cos(a)*r,Math.sin(a)*r*0.8,4,0,Math.PI*2); g.fill(); } }); }
  else { mitte(()=>{ g.fillStyle='#ffd23f'; g.beginPath();
      for(let i=0;i<10;i++){ const r=i%2?16:38, a=i/10*Math.PI*2-Math.PI/2;
        i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r); }
      g.closePath(); g.fill(); }); }
  /* Banderole mit dem Namen */
  g.fillStyle='rgba(14,18,38,.85)'; g.fillRect(0,H-28,W,28);
  g.fillStyle='#ffd23f'; g.font='700 16px "Barlow Condensed",sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  g.fillText(e.name.toUpperCase(),W/2,H-14);
  return (_erfPic[e.id]=c.toDataURL('image/png'));
}

/* Vorschaukarte: so wuerde das Etikett im Regal aussehen */
function rezVorschau(r){
  const et=etikettVon(r.etikett), b=BRUCH[r.eff]||BRUCH.kugel;
  const W=260,H=150,c=document.createElement('canvas'); c.width=W; c.height=H;
  const g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,et.bg1); gr.addColorStop(1,et.bg2);
  g.fillStyle=gr; g.fillRect(0,0,W,H);
  /* die beiden Rezeptfarben als Strahlen */
  const fa=farbVon(r.A).hex, fb=farbVon(r.B).hex;
  g.save(); g.translate(W/2,H*0.52); g.globalAlpha=0.5;
  for(let i=0;i<26;i++){ const a=i/26*Math.PI*2;
    g.strokeStyle=i%3?fa:fb; g.lineWidth=2.6;
    g.beginPath(); g.moveTo(Math.cos(a)*16,Math.sin(a)*13); g.lineTo(Math.cos(a)*56,Math.sin(a)*46); g.stroke(); }
  g.restore(); g.globalAlpha=1;
  g.fillStyle=et.ac; g.fillRect(0,0,W,7); g.fillRect(0,H-7,W,7);
  g.textAlign='center'; g.textBaseline='middle';
  const nm=(r.name||'Ohne Namen').toUpperCase().slice(0,18);
  g.font='700 26px "Bungee","Barlow Condensed",sans-serif';
  g.lineWidth=6; g.strokeStyle='rgba(0,0,0,.6)'; g.strokeText(nm,W/2,H*0.36);
  g.fillStyle=et.ac; g.fillText(nm,W/2,H*0.36);
  g.font='600 15px "Barlow Condensed",sans-serif'; g.fillStyle='#f2f5ff';
  g.fillText(b.name+(r.eff2?' + '+(BRUCH[r.eff2]||BRUCH.kugel).name:''),W/2,H*0.76);
  g.font='600 13px "Barlow Condensed",sans-serif'; g.fillStyle=et.ac2||'#ffffff';
  g.fillText(traegerVon(r.traeger).name,W/2,H*0.89);
  return c.toDataURL('image/png');
}

function renderRezeptur(){
  if(!S.up.labor){
    const u=UPGRADES.find(x=>x.id==='labor');
    rezHint='Noch kein Labor im Lager.';
    return `<div class="row locked"><img class="pic" src="${upPic('labor')}" alt="">`+
      `<div class="rm"><b>Entwicklungslabor</b><small>${u.desc}</small>`+
      `<small class="warn">Ab Level ${u.lvl}, Kosten ${eur(u.cost())} — unter Einrichtung zu kaufen.</small></div></div>`;
  }
  const r=entwurfInit();
  const bl=bruchListe();
  if(bl.length&&!bruchOffen(r.eff)) r.eff=bl[0];
  const trOffen=TRAEGER.filter(traegerOffen);
  if(trOffen.length&&!traegerOffen(traegerVon(r.traeger))) r.traeger=trOffen[0].id;
  const gueltig=rezeptGueltig(r)&&bl.length>0;
  const kosten=gueltig?rezeptKosten(r):0, markt=gueltig?rezeptMarkt(r):0;
  const entw=gueltig?rezeptEntwicklung(r):0;
  const laufend=eigeneListe().filter(e=>!e.fertig);
  const fertig=eigeneListe().filter(e=>e.fertig);
  rezHint=bl.length
    ? `Verbauen darfst du nur Bruchbilder, die du selbst schon am Himmel gesehen hast — ${bl.length} von ${BRUCH_IDS.length} sind es bisher. Zünde neue Ware auf dem Testfeld, dann wächst die Liste.`
    : 'Du hast noch kein Bruchbild gesehen. Zünde erst etwas auf dem Testfeld, dann kannst du hier entwickeln.';

  let h='<div class="rez"><div class="rezl">';
  /* Traeger */
  h+='<div class="rezfeld"><label>Träger</label><div class="rezwahl">'+
    TRAEGER.map(t=>{ const off=traegerOffen(t);
      return `<button data-a="rz" data-f="traeger" data-v="${t.id}" class="${r.traeger===t.id?'on':''}" ${off?'':'disabled'} title="${off?t.desc:'Ab Level '+t.lvl+(t.req?', Lizenz '+(lizenzDaten(t.req)||{}).name:'')}">${t.name}</button>`; }).join('')+
    `</div><div class="rezinfo">${traegerVon(r.traeger).desc}</div></div>`;
  /* Bruchbild */
  h+='<div class="rezfeld"><label>Bruchbild</label><div class="rezwahl">'+
    (bl.length?bl.map(id=>`<button data-a="rz" data-f="eff" data-v="${id}" class="${r.eff===id?'on':''}" title="${BRUCH[id].desc}">${BRUCH[id].name}</button>`).join('')
              :'<small class="warn">Noch nichts gesehen.</small>')+
    `</div>${bl.length?`<div class="rezinfo">${(BRUCH[r.eff]||BRUCH.kugel).desc}</div>`:''}</div>`;
  /* Farben */
  h+='<div class="rezfeld"><label>Farbe 1</label><div class="farbw">'+
    REZ_FARBEN.map(f=>`<button data-a="rz" data-f="A" data-v="${f.id}" class="${r.A===f.id?'on':''}" style="background:${f.hex}" title="${f.name}"></button>`).join('')+'</div></div>';
  h+='<div class="rezfeld"><label>Farbe 2</label><div class="farbw">'+
    REZ_FARBEN.map(f=>`<button data-a="rz" data-f="B" data-v="${f.id}" class="${r.B===f.id?'on':''}" style="background:${f.hex}" title="${f.name}"></button>`).join('')+'</div></div>';
  /* Zweite Stufe */
  h+='<div class="rezfeld"><label>Zweite Zündstufe</label>';
  if(!S.up.labor2){
    const u2=UPGRADES.find(x=>x.id==='labor2');
    h+=`<small class="warn">Braucht die zweite Zündstufe im Labor — ab Level ${u2.lvl}, ${eur(u2.cost())}.</small>`;
  } else {
    h+='<div class="rezwahl">'+
      `<button data-a="rz" data-f="eff2" data-v="" class="${r.eff2?'':'on'}">ohne</button>`+
      bl.map(id=>`<button data-a="rz" data-f="eff2" data-v="${id}" class="${r.eff2===id?'on':''}" title="${BRUCH[id].desc}">${BRUCH[id].name}</button>`).join('')+'</div>';
  }
  h+='</div>';
  /* Etikett und Name */
  h+='<div class="rezfeld"><label>Etikett</label><div class="rezwahl">'+
    ETIKETT.map(e=>`<button data-a="rz" data-f="etikett" data-v="${e.id}" class="${r.etikett===e.id?'on':''}">${e.name}</button>`).join('')+'</div></div>';
  h+=`<div class="rezfeld"><label>Name</label><input id="rezName" maxlength="20" placeholder="z. B. Nordlicht" value="${(r.name||'').replace(/"/g,'&quot;')}"></div>`;
  h+='</div>';
  /* rechte Spalte: Vorschau und Zahlen */
  h+='<div class="rezr">';
  h+=`<img class="pic" style="width:100%;height:auto;margin-bottom:10px" src="${rezVorschau(r)}" alt="">`;
  h+=`<div class="rezwert"><span>Wow-Wert</span><b>${gueltig?rezeptWow(r).toFixed(2):'—'}</b></div>`;
  h+=`<div class="rezwert"><span>Hype je Stück</span><b>${gueltig?rezeptHype(r):'—'}</b></div>`;
  h+=`<div class="rezwert"><span>Herstellkosten</span><b>${gueltig?eur(kosten):'—'}</b></div>`;
  h+=`<div class="rezwert"><span>Karton</span><b>${traegerVon(r.traeger).box} Stück</b></div>`;
  h+=`<div class="rezwert gross"><span>Marktpreis</span><b>${gueltig?eur(markt):'—'}</b></div>`;
  h+=`<div class="rezwert"><span>Entwicklung</span><b>${gueltig?eur(entw):'—'}</b></div>`;
  h+=`<div class="rezwert"><span>Dauer</span><b>${gueltig?rezeptDauer(r)+' Tage':'—'}</b></div>`;
  h+='<div class="btns" style="margin-top:12px">'+
     `<button class="ghost" data-a="rzproto" ${gueltig?'':'disabled'}>Prototyp zünden</button>`+
     `<button data-a="rzbau" ${gueltig&&S.money>=entw?'':'disabled'}>In Produktion</button></div>`;
  h+=`<small style="display:block;color:var(--muted);margin-top:8px;line-height:1.35">Der Prototyp ist kostenlos und geht sofort auf dem Testfeld hoch. Der Marktpreis ergibt sich aus dem Rezept, verhandeln kannst du ihn später über die Preisliste.</small>`;
  h+='</div></div>';
  /* laufende und fertige Entwicklungen */
  if(laufend.length) h+='<div class="kathead">In Entwicklung</div>'+laufend.map(e=>
    `<div class="row"><div class="rm"><b>${e.name}</b><small>${(BRUCH[e.eff]||BRUCH.kugel).name} · ${traegerVon(e.traeger).name}</small>`+
    `<small class="warn">Noch ${e.rest} Tag${e.rest===1?'':'e'}</small></div><div class="price">${eur(e.market)}</div></div>`).join('');
  if(fertig.length) h+='<div class="kathead">Eigene Marke im Sortiment</div>'+fertig.map(e=>
    `<div class="row"><div class="rm"><b>${e.name}</b><small>${(BRUCH[e.eff]||BRUCH.kugel).name}${e.eff2?' + '+(BRUCH[e.eff2]||BRUCH.kugel).name:''} · ${traegerVon(e.traeger).name}</small>`+
    `<small>Im Laden: ${shelfStockOf(e.id)} im Regal, ${stockOf(e.id)} insgesamt</small></div>`+
    `<div class="price">${eur(marketOf(e.id))}</div></div>`).join('');
  return h;
}
/* Prototyp: geht sofort auf dem Testfeld hoch, kostet nichts */
function rezProto(){
  const r=entwurf; if(!rezeptGueltig(r)) return;
  const tr=traegerVon(r.traeger);
  const o=tr.shape==='shell'?V(STATION_POS.moerser.x,1.7,STATION_POS.moerser.z)
        :tr.shape==='rocketset'?V(STATION_POS.rampe.x,1.3,STATION_POS.rampe.z)
        :V(STATION_POS.tisch.x,0.95,STATION_POS.tisch.z);
  const A=K(r.A)||FW.gold, B=K(r.B)||FW.weiss;
  const st=r.eff2?[{t:0.55,eff:r.eff2,sz:tr.kal*0.6,streu:5,A:B,B:A}]:null;
  if(tr.shape==='shell') kugelbombe(o,r.traeger==='kugel100'?2:1,{A,B,eff:r.eff});
  else if(tr.shape==='battery'){ for(let i=0;i<tr.schuss;i++) later(i*0.32,()=>shot(o,{sz:tr.kal,eff:r.eff,A,B,stufen:i===tr.schuss-1?st:null})); }
  else if(tr.shape==='cylinder'){ emitters.push({t:2.4,k:'fountain',o,A:FW.gold,B:A});
    later(2.4,()=>shot(o,{pw:3,sz:tr.kal*1.2,eff:r.eff,A,B,fuse:1.3,dick:1,stufen:st})); }
  else for(let i=0;i<tr.schuss;i++) later(i*0.45,()=>shot(o,{pw:tr.kal>1.1?3:0,sz:tr.kal,eff:r.eff,A,B,stufen:i===tr.schuss-1?st:null}));
  toast('Prototyp steigt auf dem Testfeld.','xp');
  closeLaptop(true);
}
/* In Produktion geben */
function rezBauen(){
  const r=entwurf; if(!rezeptGueltig(r)) return;
  const kosten=rezeptEntwicklung(r);
  if(S.money<kosten) return;
  const nm=(r.name||'').trim().slice(0,20)||('Eigenmarke '+(eigeneListe().length+1));
  S.money=r2(S.money-kosten); DS.upgrades=r2(DS.upgrades+kosten);
  const e={id:eigenId(Date.now().toString(36)+eigeneListe().length),
    name:nm,traeger:r.traeger,eff:r.eff,eff2:r.eff2,A:r.A,B:r.B,etikett:r.etikett,
    cost:rezeptKosten(r),market:rezeptMarkt(r),hype:rezeptHype(r),
    rest:rezeptDauer(r),fertig:false};
  S.eigene=eigeneListe().concat(e);
  entwurf=null;
  sfx.cash();
  toast(`${nm} ist in Entwicklung. In ${e.rest} Tagen steht es im Katalog.`,'money');
  save();
}
