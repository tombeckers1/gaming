
/* =========================================================
   Großkunden: Anruf, Verhandlung, Abholung
   ========================================================= */
let phone={state:null,t:0,cd:120,call:null}, order=null;
function pyroUnlocked(){ return S&&S.up&&S.up.grosskunden; }
function orderScale(){ return S.level>=15?[4,9]:S.level>=10?[3,6]:[2,4]; }
function makeCall(){
  const avail=ORDER.filter(t=>isUnlocked(t)&&P[t].cat&&canShelf(t));
  if(!avail.length) return null;
  const [lo,hi]=orderScale(), total=Math.round(rand(lo,hi+0.99));
  const n=Math.min(avail.length,total<=3?1:(Math.random()<0.5?2:3));
  const picks=[], pool=avail.slice();
  for(let i=0;i<n&&pool.length;i++){ const k=Math.floor(Math.random()*pool.length); picks.push(pool.splice(k,1)[0]); }
  const items=[]; let left=total;
  picks.forEach((t,i)=>{ const c=i===picks.length-1?Math.max(1,left):Math.max(1,Math.round(left/(picks.length-i)));
    items.push({type:t,cartons:c,loaded:0}); left-=c; });
  const type=pick(PYROTYPES);
  const value=items.reduce((a,it)=>a+it.cartons*P[it.type].box*S.prices[it.type],0);
  const stamm=(S.stamm||{})[type.id]||0;
  return {name:pick(PYRONAMES),type,items,value:r2(value),mult:type.open+Math.min(0.08,stamm*0.02),round:0,rounds:type.rounds,stamm};
}
function updatePhone(dt){
  if(!pyroUnlocked()||phase!=='open') return;
  if(order||phone.state){ if(phone.state==='ringing'){ phone.t-=dt; if(phone.t<=0){ phone.state=null; $('phone').textContent=''; phone.cd=rand(60,110); toast('Anruf verpasst.','bad'); } } return; }
  /* In der Nebensaison ist im Laden wenig los, dafuer melden sich mehr
     Veranstalter. Das haelt Januar bis September lebendig. */
  const flau=clamp(1.9-dayMult(S.day)*0.9,0.8,1.9);
  phone.cd-=dt*flau/evv('pyro');
  if(phone.cd<=0){
    const c=makeCall();
    if(!c){ phone.cd=90; return; }
    phone.call=c; phone.state='ringing'; phone.t=26; S.tut.phone=true; sfx.ring();
    toast('Das Handy klingelt.',COARSE?'':'xp');
  }
}
function answerPhone(){
  if(phone.state!=='ringing') return;
  phone.state='talking'; $('phone').textContent=''; openDeal();
}
function dealRows(c){
  return c.items.map(it=>`<div class="sumrow"><span>${P[it.type].name}</span><span>${it.cartons} Karton${it.cartons>1?'e':''} · ${it.cartons*P[it.type].box} Stück</span></div>`).join('');
}
function openDeal(){
  const c=phone.call; if(!c) return;
  dealOpen=true; paused=true; if(locked) document.exitPointerLock();
  renderDeal(c.round===0?c.type.line:null);
  $('deal').classList.add('show');
}
function renderDeal(line){
  const c=phone.call; if(!c) return;
  const price=r2(c.value*c.mult);
  $('dTitle').textContent=c.name;
  $('dLine').textContent=line||'Was sagen Sie?';
  $('dRows').innerHTML=dealRows(c)+
    `<div class="sumrow"><span>Ladenwert der Ware</span><span>${eur(c.value)}</span></div>`+
    `<div class="sumrow big"><span>Aktuelles Angebot</span><span>${eur(price)}</span></div>`+
    `<div class="sumrow"><span>Das sind</span><span>${Math.round(c.mult*100)} % vom Ladenpreis</span></div>`+
    (c.stamm?`<div class="sumrow"><span>Stammkunde</span><span>${c.stamm}. Auftrag</span></div>`:'');
  $('dRounds').textContent=c.rounds>0?`Noch ${c.rounds} Versuch${c.rounds>1?'e':''} zu handeln`:'Kein Spielraum mehr';
  document.querySelectorAll('#dHaggle button').forEach(b=>b.disabled=c.rounds<=0);
  $('dAccept').disabled=false;
  $('dAccept').textContent=`Für ${eur(price)} abschließen`;
}
function haggle(step){
  const c=phone.call; if(!c||c.rounds<=0) return;
  const want=r2(c.mult*(1+step));
  if(want<=c.type.ceil){
    c.mult=want; sfx.beep();
    renderDeal(pick(['Na gut, einverstanden.','Geht klar, machen wir so.','Meinetwegen, abgemacht.']));
    return;
  }
  c.rounds--;
  const over=want/c.type.ceil;
  let line;
  if(over>1.25) line='Sie sind ja verrückt. Das zahlt Ihnen keiner.';
  else if(over>1.1) line='Das ist deutlich zu viel. Da bin ich raus.';
  else line='Ganz knapp zu teuer. Kommen Sie mir noch etwas entgegen.';
  if(c.rounds<=0){
    sfx.alarm(); renderDeal(line+' Dann eben nicht.');
    document.querySelectorAll('#dHaggle button').forEach(b=>b.disabled=true);
    $('dAccept').disabled=true;
    setTimeout(()=>{ if(!dealOpen) return; closeDeal(); toast('Der Auftrag ist geplatzt.','bad'); phone.state=null; phone.call=null; phone.cd=rand(70,130); },1400);
    return;
  }
  c.mult=r2(Math.min(c.type.ceil,c.mult+step*0.35));
  renderDeal(line);
}
function acceptDeal(){
  const c=phone.call; if(!c) return;
  const pay=r2(c.value*c.mult*(S.up&&S.up.meister?1.33:1));
  order={name:c.name,typeId:c.type.id,items:c.items,pay,arrive:rand(18,30),t:0,done:false};
  S.stamm=S.stamm||{}; S.stamm[c.type.id]=(S.stamm[c.type.id]||0)+1;
  closeDeal(); phone.state=null; phone.call=null; phone.cd=rand(150,260);
  sfx.cash(); toast(`Auftrag über ${eur(pay)} angenommen. Die Ware geht aus dem Lager raus.`,'money');
  addXP(20,'Auftrag an Land gezogen');
}
function declineDeal(){ closeDeal(); phone.state=null; phone.call=null; phone.cd=rand(70,130); toast('Abgelehnt.'); }
function closeDeal(){ $('deal').classList.remove('show'); dealOpen=false; paused=false; requestLock(); }
/* --- Versand aus dem Lager --- */
function orderNeed(t){ if(!order) return 0; const it=order.items.find(x=>x.type===t); return it?it.cartons-it.loaded:0; }
function orderLeft(){ return order?order.items.reduce((a,it)=>a+(it.cartons-it.loaded),0):0; }
/* Ware, die für einen laufenden Auftrag reserviert ist, fasst das Personal nicht an */
function reservedType(t){ return !!order&&order.arrive<=0&&orderNeed(t)>0; }
function fullBox(t){ return Math.ceil(P[t].box*0.9); }
/* Zählt, wie viele volle Kartons im Lager abholbereit stehen */
function orderReady(){
  if(!order) return 0;
  let n=0;
  order.items.forEach(it=>{
    let have=0;
    racks.forEach(r=>r.slots.forEach(sl=>{ if(sl.box&&sl.box.type===it.type&&sl.box.count>=fullBox(it.type)) have++; }));
    floorBoxes.forEach(b=>{ if(b.type===it.type&&b.count>=fullBox(it.type)&&b.mesh.position.x<-8) have++; });
    n+=Math.min(have,it.cartons-it.loaded);
  });
  return n;
}
function shipOne(){
  if(!order) return null;
  for(const it of order.items){
    if(it.loaded>=it.cartons) continue;
    for(const r of racks) for(const sl of r.slots){
      if(sl.box&&sl.box.type===it.type&&sl.box.count>=fullBox(it.type)){
        sl.rk.g.remove(sl.box.mesh); sl.box=null; drawRackSchild(sl.rk); it.loaded++; return it;
      }
    }
    for(const b of floorBoxes.slice()){
      if(b.type===it.type&&b.count>=fullBox(it.type)&&b.mesh.position.x<-8){ removeFloorBox(b); it.loaded++; return it; }
    }
  }
  return null;
}
function finishOrder(){
  const o=order; order=null;
  S.money=r2(S.money+o.pay); DS.revenue=r2(DS.revenue+o.pay); S.seasonRevenue=r2(S.seasonRevenue+o.pay);
  DS.orders=(DS.orders||0)+1; goalAdd('orders',1); statAdd('auftraege',1);
  rep(2.5); addXP(Math.round(o.pay*0.4)+40,'Großauftrag erfüllt'); sfx.cash();
  toast(`${o.name}: Ware ist raus, ${eur(o.pay)} gutgeschrieben.`,'money');
  save();
}
function failOrder(){
  if(!order) return; const o=order; order=null;
  const fehlt=o.items.reduce((a,it)=>a+(it.cartons-it.loaded),0);
  rep(-4); toast(`${o.name} hat ${fehlt} Karton${fehlt>1?'s':''} nicht bekommen. Das kostet Ruf.`,'bad');
}
function updateOrder(dt){
  if(!order) return;
  if(order.arrive>0){
    order.arrive-=dt;
    if(order.arrive<=0){ toast(`Die Spedition für ${order.name} ist unterwegs. Volle Kartons müssen im Lager stehen.`); sfx.beep(); S.tut.versand=true; }
    return;
  }
  order.t=(order.t||0)-dt;
  if(order.t>0) return;
  order.t=1.8;
  const it=shipOne();
  if(!it) return;
  sfx.pop();
  if(orderLeft()<=0) finishOrder();
  else if(orderLeft()%3===0) toast(`Abgeholt. Noch ${orderLeft()} Karton${orderLeft()>1?'e':''}.`);
}
