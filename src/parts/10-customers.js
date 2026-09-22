
/* =========================================================
   Kunden
   ========================================================= */
const customers=[], queue=[];
const A=V(2.9,0,0.3), B=V(2.9,0,-4.4);
const zoneOf=p=>p.z<-2.2?'back':'front';

/* =========================================================
   Wegenetz. Solange der Laden aus zwei Raeumen bestand, reichten
   zwei feste Wegpunkte. Auf ueber tausend Quadratmetern mit
   Gondelgassen und Eckregalen geht das nicht mehr: es gibt ein
   Raster ueber die ganze Verkaufsflaeche, darin wird gesucht.
   Das Raster wird nur neu gebaut, wenn sich etwas veraendert
   hat - nach einem Umbau oder wenn ein Bereich aufgeht.
   ========================================================= */
/* Das Gitter umschliesst die ganze bebaute Flaeche - seit dem
   Grosshandel reicht sie bis x -66 und z -45. Daran haengt auch die
   Notbremse fuer den Spieler in 15-player. */
const NAV={x0:-67.0,z0:-46.0,x1:38.6,z1:8.6,s:0.5,w:0,h:0,g:null,dist:null,dirty:true};
function navDirty(){ NAV.dirty=true; }
function navBuild(){
  NAV.w=Math.ceil((NAV.x1-NAV.x0)/NAV.s); NAV.h=Math.ceil((NAV.z1-NAV.z0)/NAV.s);
  const n=NAV.w*NAV.h;
  if(!NAV.g||NAV.g.length!==n){ NAV.g=new Uint8Array(n); NAV.dist=new Int32Array(n); }
  NAV.g.fill(0);
  const R=0.3;                                    /* halbe Schulterbreite */
  for(const c of colliders){
    if(c.maxX<NAV.x0||c.minX>NAV.x1||c.maxZ<NAV.z0||c.minZ>NAV.z1) continue;
    const i0=Math.max(0,Math.floor((c.minX-R-NAV.x0)/NAV.s)), i1=Math.min(NAV.w-1,Math.floor((c.maxX+R-NAV.x0)/NAV.s));
    const k0=Math.max(0,Math.floor((c.minZ-R-NAV.z0)/NAV.s)), k1=Math.min(NAV.h-1,Math.floor((c.maxZ+R-NAV.z0)/NAV.s));
    for(let i=i0;i<=i1;i++) for(let k=k0;k<=k1;k++) NAV.g[k*NAV.w+i]=1;
  }
  NAV.dirty=false;
}
function navIdx(x,z){
  const i=Math.floor((x-NAV.x0)/NAV.s), k=Math.floor((z-NAV.z0)/NAV.s);
  if(i<0||k<0||i>=NAV.w||k>=NAV.h) return -1;
  return k*NAV.w+i;
}
function navPos(id){ return V(NAV.x0+(id%NAV.w+0.5)*NAV.s,0,NAV.z0+(Math.floor(id/NAV.w)+0.5)*NAV.s); }
function navFrei(id){ return id>=0&&!NAV.g[id]; }
/* Naechste begehbare Zelle, falls ein Ziel direkt an einem Regal liegt */
function navNah(x,z){
  const id=navIdx(x,z); if(navFrei(id)) return id;
  for(let r=1;r<=6;r++){
    let best=-1,bd=1e9;
    for(let dx=-r;dx<=r;dx++) for(let dz=-r;dz<=r;dz++){
      if(Math.max(Math.abs(dx),Math.abs(dz))!==r) continue;
      const c=navIdx(x+dx*NAV.s,z+dz*NAV.s);
      if(navFrei(c)){ const d=dx*dx+dz*dz; if(d<bd){ bd=d; best=c; } }
    }
    if(best>=0) return best;
  }
  return -1;
}
/* Sichtlinie zwischen zwei Punkten, in Rasterschritten geprueft */
function navSicht(ax,az,bx,bz){
  const d=Math.hypot(bx-ax,bz-az), n=Math.ceil(d/(NAV.s*0.6));
  for(let i=1;i<n;i++){ const t=i/n;
    if(!navFrei(navIdx(ax+(bx-ax)*t,az+(bz-az)*t))) return false; }
  return true;
}
const _navQ=[];
/* Breitensuche vom Ziel aus, danach die Kette glaetten */
function navPfad(from,to){
  const start=navNah(from.x,from.z), ziel=navNah(to.x,to.z);
  if(start<0||ziel<0) return null;
  if(start===ziel||navSicht(from.x,from.z,to.x,to.z)) return [to.clone?to.clone():V(to.x,0,to.z)];
  const D=NAV.dist; D.fill(-1); D[ziel]=0;
  let head=0; _navQ.length=0; _navQ.push(ziel);
  const W=NAV.w, H=NAV.h;
  while(head<_navQ.length){
    const c=_navQ[head++]; if(c===start) break;
    const i=c%W, k=(c-i)/W, d=D[c]+1;
    if(i>0)   { const n2=c-1; if(!NAV.g[n2]&&D[n2]<0){ D[n2]=d; _navQ.push(n2); } }
    if(i<W-1) { const n2=c+1; if(!NAV.g[n2]&&D[n2]<0){ D[n2]=d; _navQ.push(n2); } }
    if(k>0)   { const n2=c-W; if(!NAV.g[n2]&&D[n2]<0){ D[n2]=d; _navQ.push(n2); } }
    if(k<H-1) { const n2=c+W; if(!NAV.g[n2]&&D[n2]<0){ D[n2]=d; _navQ.push(n2); } }
  }
  if(D[start]<0) return null;
  /* absteigend zum Ziel laufen */
  const roh=[]; let c=start;
  while(c!==ziel&&roh.length<4000){
    const i=c%W, k=(c-i)/W; let best=-1,bd=D[c];
    const nb=[i>0?c-1:-1,i<W-1?c+1:-1,k>0?c-W:-1,k<H-1?c+W:-1];
    for(const n2 of nb) if(n2>=0&&D[n2]>=0&&D[n2]<bd){ bd=D[n2]; best=n2; }
    if(best<0) break;
    c=best; roh.push(c);
  }
  /* glaetten: immer zum entferntesten noch sichtbaren Punkt springen */
  const out=[]; let px=from.x, pz=from.z, i2=0;
  while(i2<roh.length){
    let j=roh.length-1;
    while(j>i2){ const p=navPos(roh[j]); if(navSicht(px,pz,p.x,p.z)) break; j--; }
    const p=navPos(roh[j]); out.push(p); px=p.x; pz=p.z; i2=j+1;
  }
  out.push(to.clone?to.clone():V(to.x,0,to.z));
  return out;
}
function route(from,to){
  if(NAV.dirty) navBuild();
  const p=navPfad(from,to);
  if(p) return p;
  /* Ausserhalb des Rasters - Strasse, Hof, geschlossenes Rolltor -
     gelten weiter die festen Durchgaenge. */
  if((from.x<-20)!==(to.x<-20)){
    const a=V(-20.8,0,-2), b=V(-19.2,0,-2), mid=from.x<-20?b:a;
    return (from.x<-20?[a,b]:[b,a]).concat(route(mid,to));
  }
  if(from.x<-20&&to.x<-20) return [to];
  if((from.x<-8)!==(to.x<-8)){
    const a=V(-8.9,0,-2.5), b=V(-7.1,0,-2.5), mid=from.x<-8?b:a;
    return (from.x<-8?[a,b]:[b,a]).concat(route(mid,to));
  }
  if(zoneOf(from)===zoneOf(to)) return [to];
  return zoneOf(from)==='front'?[A.clone(),B.clone(),to]:[B.clone(),A.clone(),to];
}
function spotPos(i){ return i===0?ck(1.05,1.05):ck(0.1-(i-1)*0.8,1.68); }
function queueApproach(){ return ck(-4.0,1.7); }
function priceTol(){ return (0.95+ambienteScore()/450+S.rep/900+bildBoost()+(friendliness()-1)*0.12)*evv('tol')*(S.comp||1); }
function buyChance(t,price,q,cold,ct){ const r=price/marketOf(t), lo=priceTol()*(ct?ct.tol:1)+((q||1)-1)*0.18+(cold?0.16:0); if(r<=lo) return 1; if(r>=lo+0.5) return 0; return 1-(r-lo)/0.5; }
function dayIndex(){ return S.day; }
/* Was im Regal steht, fragen die Leute deutlich haeufiger nach.
   Ohne das wuerde jedes neue Lizenzpaket den Umsatz einbrechen lassen:
   die Kundschaft wuenscht sich sofort Ware, die noch gar nicht da ist,
   geht leer aus und der Ruf faellt. Ein bisschen Nachfrage nach dem,
   was fehlt, bleibt aber - das ist das Signal zum Nachbestellen. */
function nachfrageFaktor(t){
  if(shelfStockOf(t)>0) return 1;
  return stockOf(t)>0?0.5:0.3;
}
function makeWishes(ct){
  const avail=ORDER.filter(t=>isUnlocked(t)&&canWish(t)), list=[], used=new Set();
  const late=silvesterNah(S.day);
  let n=Math.random()<0.38?1:(Math.random()<0.6?2:(Math.random()<0.8?3:4));
  if(ct) n=Math.max(1,Math.round(n*ct.items));
  n=Math.max(1,Math.round(n*korbGroesse()));
  for(let k=0;k<n;k++){
    const pool=avail.filter(a=>!used.has(a)); if(!pool.length) break;
    const wt=pool.map(t=>{ let w=P[t].weight;
      if(late&&P[t].cat===2) w*=1.9;
      if(hype>40&&P[t].cat===2) w*=1.3;
      if(P[t].cat===0) w*=1.1*evv('cat0');
      if(P[t].cat===2) w*=evv('cat2');
      if(ct&&ct.f1&&P[t].cat===2) w*=0.12;
      if(ct&&ct.f2&&P[t].cat===2) w*=2.6;
      return w*nachfrageFaktor(t); });
    let r=Math.random()*wt.reduce((a,b)=>a+b,0), t=pool[0];
    for(let j=0;j<pool.length;j++){ r-=wt[j]; if(r<=0){ t=pool[j]; break; } }
    used.add(t);
    const mp=marketOf(t), big=mp>20;
    let q=big?1:(mp>7?(Math.random()<0.65?1:2):1+Math.floor(Math.random()*3));
    if(late&&!big&&Math.random()<0.45) q++;
    list.push({type:t,qty:q});
  }
  return list;
}
function thiefChance(){
  if(S.level<4) return 0;
  let c=0.035+Math.min(0.05,S.level*0.0035);
  if(S.up.cams) c*=0.5;
  if(staff.security) c*=0.35;
  return c*evv('theft');
}
class Customer{
  constructor(){
    /* Seit dem zweiten Eingang kommt nicht mehr jeder vorn herein:
       jeder Kunde sucht sich eine der offenen Tueren aus. */
    const ein=pick(eingaenge());
    this.ein=ein;
    this.g=makePerson(); this.g.position.set(ein+rand(-4,4),0,13.5); scene.add(this.g);
    this.path=[V(ein,0,7.6),V(ein,0,4.9)]; this.state='enter'; this.speed=rand(1.2,1.6);
    this.ct=rollCustType();
    this.wishes=makeWishes(this.ct); this.items=[]; this.missed=false; this.total=0; this.sb=null;
    this.patience=(rand(75,110)+S.rep*0.3+(S.up.heizung?30:0)+(S.up.klima?35:0)+ambienteScore()*0.35)*(0.72+0.3*friendliness())*this.ct.pat*evv('pat');
    this.wait=0; this.bub=null; this.bubT=0; this.moving=false;
    this.thief=Math.random()<thiefChance(); this.mark=null; this.caught=false;
    this.wantGrav=!!(S.up.gravur&&Math.random()<0.3); this.gravDone=false;
  }
  get pos(){ return this.g.position; }
  say(t,bad){ this.clearBub(); this.bub=bubble(t,bad); this.g.add(this.bub); this.bubT=2.8; }
  clearBub(){ if(this.bub){ this.g.remove(this.bub); this.bub.material.map.dispose(); this.bub.material.dispose(); this.bub=null; } }
  walk(dt){
    if(!this.path.length){ this.moving=false; return true; }
    const t=this.path[0], dx=t.x-this.pos.x, dz=t.z-this.pos.z, d=Math.hypot(dx,dz), st=this.speed*dt;
    if(d<=st){ this.pos.x=t.x; this.pos.z=t.z; this.path.shift(); } else { this.pos.x+=dx/d*st; this.pos.z+=dz/d*st; }
    if(d>0.02){ const ty=Math.atan2(dx,dz); let df=ty-this.g.rotation.y; while(df>Math.PI) df-=Math.PI*2; while(df<-Math.PI) df+=Math.PI*2; this.g.rotation.y+=df*Math.min(1,dt*10); }
    this.moving=true; return this.path.length===0;
  }
  face(ry){ this.g.rotation.y=ry; }
  nextWish(){
    if(this.wantGrav&&!this.gravDone&&gravReady()&&!this.thief){
      this.path=route(this.pos,gravStand()); this.state='toGrav'; return;
    }
    while(this.wishes.length){
      const w=this.wishes.shift(), lv=findLevel(w.type,this.pos);
      if(lv){ this.cur=w; this.lv=lv; this.path=route(this.pos,shelfStand(lv.sh).add(V(rand(-0.4,0.4),0,0))); this.state='toShelf'; return; }
      this.say(`Keine ${P[w.type].short}?`,true); this.missed=true; DS.missed+=w.qty; rep(-0.4);
    }
    if(this.items.length){ if(this.thief) this.startSteal(); else this.joinQueue(); }
    else { rep(-0.3); this.leave(); }
  }
  take(){
    const w=this.cur, lv=this.lv;
    if(!(lv.type===w.type&&lv.count>0)){
      const alt=findLevel(w.type,this.pos);
      if(alt){ this.lv=alt; this.path=route(this.pos,shelfStand(alt.sh)); this.state='toShelf'; return; }
      this.say(`Keine ${P[w.type].short} mehr?`,true); this.missed=true; DS.missed+=w.qty; rep(-0.4); this.nextWish(); return;
    }
    let got=0, pricey=false;
    for(let k=0;k<w.qty;k++){
      if(lv.count<=0||lv.type!==w.type) break;
      const price=S.prices[w.type];
      if(this.thief||Math.random()<buyChance(w.type,price,lv.q,kindOf(lv.sh).cold,this.ct)){ removeFromLevel(lv); this.items.push({type:w.type,price}); got++; } else pricey=true;
    }
    if(got===0){ this.missed=true; if(pricey){ this.say('Viel zu teuer!',true); rep(-0.5); } else DS.missed+=w.qty; }
    else if(pricey) this.say('Hm, ganz schön teuer.');
    this.nextWish();
  }
  startSteal(){
    this.state='steal'; this.speed=rand(1.8,2.2);
    this.mark=alertSprite(); this.g.add(this.mark);
    this.say('...',true); this.path=[...route(this.pos,V(0,0,4.9)),V(0,0,7.0)];
    S.tut.thief=true; toast('Da klaut jemand! Pfefferspray zücken.','bad'); sfx.alarm();
    if(staff.security) staff.security.chase=this;
  }
  stolenValue(){ return this.items.reduce((a,b)=>a+costOf(b.type),0); }
  caughtBy(what){
    if(this.caught) return; this.caught=true;
    if(this.mark){ this.g.remove(this.mark); this.mark=null; }
    let back=0;
    this.items.forEach(it=>{ const lv=emptyLevel(it.type); if(lv&&addToLevel(lv,it.type)) back++; });
    this.items=[];
    DS.caught++; addXP(25,'Dieb gestellt'); rep(0.6); sfx.beep();
    toast(what==='spray'?'Erwischt! Ware zurück im Regal.':'Der Sicherheitsdienst hat ihn gestoppt.','money');
    this.say('Schon gut, schon gut!');
    { const e=naechsterEingang(this.pos.x);
      this.speed=2.4; this.state='leave'; this.path=[V(e+rand(-1.2,1.2),0,8),V(e+rand(-5,5),0,15)]; }
    if(staff.security&&staff.security.chase===this) staff.security.chase=null;
  }
  escaped(){
    const v=r2(this.stolenValue());
    DS.stolen=r2(DS.stolen+v); rep(-1.8);
    toast(`Dieb entkommen: Ware für ${eur(v)} weg.`,'bad');
    if(staff.security&&staff.security.chase===this) staff.security.chase=null;
  }
  joinQueue(){
    /* Wenig Ware und die Hauptschlange steht? Dann lieber SB-Kasse. */
    if(sbOffen()&&this.items.length<=3&&(queue.length>=1||Math.random()<0.45)){
      const i=sbFrei();
      if(i>=0){ this.sb=i; sbLanes[i].busy=this; sbLampe(sbLanes[i],false);
        this.state='sbGo'; this.path=[...route(this.pos,sbPos(i))]; DS.sb=(DS.sb||0)+1; return; }
    }
    queue.push(this); this.state='queue'; this.path=[...route(this.pos,queueApproach()),spotPos(queue.length-1)];
  }
  sbStart(){
    this.state='sbPay';
    this.total=r2(this.items.reduce((a,it)=>a+it.price,0));
    this.sbT=1.1+this.items.length*1.25;
    this.method='card';
    this.say(pick(['Geht auch selbst.','Schnell durch hier.','Piep.']));
  }
  sbFree(){
    if(this.sb===undefined||this.sb===null) return;
    const l=sbLanes[this.sb]; if(l&&l.busy===this){ l.busy=null; sbLampe(l,true); }
    this.sb=null;
  }
  atRegister(){ this.state='unload'; this.ui=0; this.unT=0.5; this.scanned=0; this.sum=0; posReset(); posStatus='Kunde legt Ware aufs Band'; drawPOS(); }
  startPay(){
    this.state='pay'; this.method=Math.random()<0.6?'card':'cash';
    this.autoT=this.method==='card'?(S.up.terminal?0.6:1.0):2.2;
    if(this.method==='card'){ this.say('Mit Karte, bitte.'); const w=ck(0.62,0.42); this.prop=box(0.085,0.054,0.004,std(0x2f5d9e,{metalness:0.3}),w.x,1.1,w.z,null,false); this.prop.rotation.x=-0.4; posStatus='Kartenzahlung: Terminal anklicken'; }
    else { this.given=cashAmount(this.total); this.say(`Bar: ${eur(this.given)}`); const w=ck(0.35,0.28); this.prop=box(0.14,0.004,0.07,std(this.given>=50?0xf2a25a:this.given>=20?0x7aa9df:0xe58c85),w.x,0.957,w.z,null,false); posStatus=`Bar erhalten: ${eur(this.given)}. Kasse anklicken`; }
    drawPOS();
  }
  finishCard(){ if(this.state!=='pay') return; sfx.beep(); later(0.12,()=>sfx.beep()); this.complete(this.total,0); }
  finishCash(back){ if(this.state!=='pay') return; const due=r2(this.given-this.total), over=r2(back-due); this.complete(r2(this.given-back),over>0?over:0); }
  complete(net,over){
    S.money=r2(S.money+net); S.seasonRevenue=r2(S.seasonRevenue+this.total); DS.revenue=r2(DS.revenue+this.total);
    DS.changeLoss=r2(DS.changeLoss+over); DS.sold+=this.items.length; DS.customers++;
    const nf2=this.items.filter(i2=>P[i2.type].cat===2).length; DS.f2+=nf2;
    goalAdd('rev',this.total); goalAdd('cust',1); goalAdd('sold',this.items.length); goalAdd('f2',nf2);
    this.items.forEach(it=>statVerkauf(it.type,1));
    statAdd('kunden',1);
    let gain=Math.round(this.total*0.5)+4; if(over<=0.001&&this.method==='cash') gain+=3;
    addXP(gain);
    rep(this.missed?0.2:0.8); sfx.cash(); toast('+'+eur(this.total),'money');
    if(over>0) toast(`${eur(over)} zu viel Rückgeld gegeben.`,'bad');
    this.say(this.missed?'Wenigstens etwas.':pick(['Guten Rutsch!','Danke!','Frohes Neues!','Bis nächstes Jahr!']));
    S.tut.pay=true; this.cleanupRegister(); this.leave();
  }
  cleanupRegister(){
    if(this.prop){ scene.remove(this.prop); this.prop=null; }
    if(this.sb!==undefined&&this.sb!==null){ this.sbFree(); return; }
    for(let k=belt.length-1;k>=0;k--) if(belt[k].cust===this) removeBeltItem(belt[k]);
    clearBag(); posReset(); posStatus='Bereit'; drawPOS();
    if(cashCust===this) closeCash(false);
  }
  giveUp(){
    this.say('Dauert mir zu lange!',true); rep(-2); DS.angry++;
    if(['unload','scan','pay','sbPay'].includes(this.state)) this.cleanupRegister();
    this.items=[]; this.leave();
  }
  leave(){
    const qi=queue.indexOf(this); if(qi>=0) queue.splice(qi,1);
    this.sbFree();
    if(this.mark){ this.g.remove(this.mark); this.mark=null; }
    { const e=naechsterEingang(this.pos.x);
      this.state='leave'; this.path=[...route(this.pos,V(e,0,4.9)),V(e,0,7.6),V(e+rand(-5,5),0,14)]; }
    if(Math.random()<(hasDeko('muell')?0.1:0.22)) addDirt(this.pos.x+rand(-1,1),this.pos.z+rand(-1,1));
  }
  update(dt){
    if(this.bub){ this.bubT-=dt; if(this.bubT<=0) this.clearBub(); }
    this.moving=false;
    switch(this.state){
      case 'enter': if(this.walk(dt)) this.nextWish(); break;
      case 'toShelf': if(this.walk(dt)){ this.state='browse'; this.wait=rand(0.8,1.6); this.face(this.lv?shelfFace(this.lv.sh):Math.PI); } break;
      case 'toGrav': if(this.walk(dt)){ this.state='graving'; this.wait=rand(3.5,6); if(gravG) this.face(gravG.rotation.y+Math.PI); this.say('Mal sehen …'); } break;
      case 'graving': this.wait-=dt; if(this.wait<=0){ this.gravDone=true;
          if(customerEngraves(this)) this.say('Sehr schön!'); else this.say('Kein Rohling drin?',true);
          this.nextWish(); } break;
      case 'browse': this.wait-=dt; if(this.wait<=0) this.take(); break;
      case 'steal':
        if(this.walk(dt)){
          if(S.up.alarm&&Math.random()<0.7){ this.caughtBy('alarm'); }
          else { this.escaped(); this.state='leave'; this.path=[V(naechsterEingang(this.pos.x)+rand(-5,5),0,15)]; if(this.mark){ this.g.remove(this.mark); this.mark=null; } }
        } break;
      case 'queue': {
        const i=queue.indexOf(this), spot=spotPos(i);
        if(this.path.length){ this.path[this.path.length-1]=spot; this.walk(dt); }
        else if(Math.hypot(spot.x-this.pos.x,spot.z-this.pos.z)>0.08) this.path=[spot];
        else { this.face(ckYaw()+(i===0?Math.PI:Math.PI/2)); if(i===0) this.atRegister(); }
        this.patience-=dt; if(this.patience<=0) this.giveUp();
        break; }
      case 'unload':
        this.patience-=dt*0.4; this.unT-=dt;
        if(this.unT<=0){
          if(this.ui<this.items.length){ const it=this.items[this.ui]; if(beltRoom(P[it.type].dims[0])){ beltAdd(it,this); this.ui++; this.unT=0.45; } else this.unT=0.25; }
          else this.state='scan';
        }
        if(this.patience<=0) this.giveUp(); break;
      case 'scan': this.patience-=dt*0.4; if(this.scanned>=this.items.length) this.startPay(); else if(this.patience<=0) this.giveUp(); break;
      case 'pay':
        this.patience-=dt*0.3;
        if(staff.kassierer){ this.autoT-=dt; if(this.autoT<=0){ if(this.method==='card') this.finishCard(); else this.finishCash(r2(this.given-this.total)); } }
        if(this.state==='pay'&&this.patience<=0) this.giveUp(); break;
      case 'sbGo':
        if(this.walk(dt)){ this.face(Math.PI); this.sbStart(); }
        this.patience-=dt; if(this.patience<=0) this.giveUp();
        break;
      case 'sbPay':
        this.sbT-=dt; this.patience-=dt*0.3;
        if(this.sbT<=0){ sfx.beep(); this.complete(this.total,0); }
        else if(this.patience<=0) this.giveUp();
        break;
      case 'leave': if(this.walk(dt)) this.remove(); break;
    }
    animPerson(this.g,this.moving,dt,this.speed);
  }
  remove(){ this.clearBub(); scene.remove(this.g); const i=customers.indexOf(this); if(i>=0) customers.splice(i,1); }
}
function shelfFace(sh){ return sh.g.rotation.y+Math.PI; }
function regCustomer(){ const c=queue[0]; return c&&['unload','scan','pay'].includes(c.state)?c:null; }
function cashAmount(t){
  const c=[Math.ceil(t-1e-9),Math.ceil(t/5-1e-9)*5,Math.ceil(t/10-1e-9)*10,Math.ceil(t/20-1e-9)*20,Math.ceil(t/50-1e-9)*50].filter((v,i,a)=>v>=t-1e-9&&a.indexOf(v)===i);
  if(Math.random()<0.12) return r2(t);
  return pick(c);
}
function sprayHit(){
  const dir=V(-Math.sin(yaw),0,-Math.cos(yaw)), from=V(pl.x,0,pl.z);
  let best=null,bd=4.2;
  for(const c of customers){ if(c.state!=='steal'||c.caught) continue;
    const to=V(c.pos.x-from.x,0,c.pos.z-from.z), d=to.length(); if(d>bd) continue;
    to.normalize(); if(to.dot(dir)<0.55) continue; bd=d; best=c; }
  return best;
}
