
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
  navTueren(R);
  NAV.waende=typeof wandRechtecke==='function'?wandRechtecke():[];
  /* Zaehler: wer Erreichbarkeit zwischenspeichert, sieht so den Neubau (11c) */
  NAV.nr=(NAV.nr|0)+1;
  NAV.dirty=false;
}
/* Keine Figur in der Wand (05.10., Tom: Einraeumer und Packer
   "verschwinden halb in der Wand"): gemessen standen Haltepunkte direkt
   an oder in Waenden (Karton an der Lagerwand, Lagerregal in der Mauer),
   und die naechste freie Rasterzelle lag manchmal auf der anderen Seite
   der Wand (Betreuer vor dem Schaufenster draussen).
   wandKreuzt: schneidet die Strecke a-b eine Wand?
   ausWand: Punkt so weit aus jeder Wand schieben, dass ein Koerper
   (Radius r) frei steht - zu der Seite, auf der er schon liegt. */
const KOERPER_R=0.24;
function wandKreuzt(ax,az,bx,bz,m){
  m=m||0; const lx=Math.min(ax,bx)-m, hx=Math.max(ax,bx)+m, lz=Math.min(az,bz)-m, hz=Math.max(az,bz)+m;
  for(const w of NAV.waende||[]){
    if(w.x1<lx||w.x0>hx||w.z1<lz||w.z0>hz) continue;
    let t0=0, t1=1; const dx=bx-ax, dz=bz-az, x0=w.x0-m, x1=w.x1+m, z0=w.z0-m, z1=w.z1+m;
    const cl=(p,q)=>{ if(Math.abs(p)<1e-9) return q>=0; const r=q/p; if(p<0){ if(r>t1) return false; if(r>t0) t0=r; } else { if(r<t0) return false; if(r<t1) t1=r; } return true; };
    if(cl(-dx,ax-x0)&&cl(dx,x1-ax)&&cl(-dz,az-z0)&&cl(dz,z1-az)&&t0<=t1) return true; }
  return false;
}
function ausWand(p,r){
  if(NAV.dirty) navBuild();
  for(let n=0;n<3;n++){ let ok=true;
    for(const w of NAV.waende||[]){
      const dx=Math.max(w.x0-p.x,0,p.x-w.x1), dz=Math.max(w.z0-p.z,0,p.z-w.z1); if(Math.hypot(dx,dz)>=r) continue;
      ok=false;
      /* raus auf der naeheren Seite der duennen Richtung */
      if(w.x1-w.x0<w.z1-w.z0) p.x=p.x<(w.x0+w.x1)/2?w.x0-r:w.x1+r; else p.z=p.z<(w.z0+w.z1)/2?w.z0-r:w.z1+r; }
    if(ok) break; }
  return p;
}
/* Tueroeffnungen wieder aufmachen. Das Raster sperrt jede Zelle, die
   eine gepolsterte Wand auch nur streift - in einer Tuer von 1,4 m
   blieb so keine einzige Zelle frei, und alle Wege vom Lager in den
   Laden liefen ueber den Notbehelf quer durch die Mauer (gemessen
   am 25.09. an der Tuer bei x -8). Gesucht werden zwei duenne
   Wandstuecke auf einer Linie mit 0,9 bis 4 m Luecke; frei wird
   nur, was in der Luecke liegt und keinem anderen Hindernis zu
   nahe kommt. */
function navTueren(R){
  const DUENN=0.4, EIN=0.15;
  const quer=colliders.filter(c=>c.maxX-c.minX<=DUENN&&c.maxZ-c.minZ>DUENN);   /* Wand in z-Richtung */
  const laengs=colliders.filter(c=>c.maxZ-c.minZ<=DUENN&&c.maxX-c.minX>DUENN); /* Wand in x-Richtung */
  const frei=(x,z,a,b)=>{ for(const c of colliders){ if(c===a||c===b) continue;
      if(x>c.minX-R&&x<c.maxX+R&&z>c.minZ-R&&z<c.maxZ+R) return false; } return true; };
  const oeffne=(x0,x1,z0,z1,a,b)=>{
    const i0=Math.max(0,Math.floor((x0-NAV.x0)/NAV.s)), i1=Math.min(NAV.w-1,Math.floor((x1-NAV.x0)/NAV.s));
    const k0=Math.max(0,Math.floor((z0-NAV.z0)/NAV.s)), k1=Math.min(NAV.h-1,Math.floor((z1-NAV.z0)/NAV.s));
    for(let i=i0;i<=i1;i++) for(let k=k0;k<=k1;k++){
      const cx=NAV.x0+(i+0.5)*NAV.s, cz=NAV.z0+(k+0.5)*NAV.s;
      if(cx<x0||cx>x1||cz<z0||cz>z1) continue;
      if(frei(cx,cz,a,b)) NAV.g[k*NAV.w+i]=0;
    }
  };
  const paare=(L,ax)=>{
    for(const a of L){
      const am=ax?(a.minX+a.maxX)/2:(a.minZ+a.maxZ)/2, aEnd=ax?a.maxZ:a.maxX;
      let b=null, bAnf=1e9;
      for(const c of L){ if(c===a) continue;
        const cm=ax?(c.minX+c.maxX)/2:(c.minZ+c.maxZ)/2, cAnf=ax?c.minZ:c.minX;
        if(Math.abs(cm-am)>0.15||cAnf<=aEnd||cAnf>=bAnf) continue;
        b=c; bAnf=cAnf; }
      if(!b) continue;
      const luecke=bAnf-aEnd; if(luecke<0.9||luecke>4) continue;
      if(ax) oeffne(Math.min(a.minX,b.minX)-R,Math.max(a.maxX,b.maxX)+R,aEnd+EIN,bAnf-EIN,a,b);
      else   oeffne(aEnd+EIN,bAnf-EIN,Math.min(a.minZ,b.minZ)-R,Math.max(a.maxZ,b.maxZ)+R,a,b);
    }
  };
  paare(quer,true); paare(laengs,false);
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
      /* nicht durch die Wand: die Zelle muss auf derselben Seite liegen */
      if(navFrei(c)){ const d=dx*dx+dz*dz; if(d<bd){ const q=navPos(c); if(wandKreuzt(x,z,q.x,q.z)) continue; bd=d; best=c; } }
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
  /* 05.10.: die Rasterprobe allein schnitt Ecken an Tuerlaibungen - die
     Strecke muss auch einen Koerper breit an jeder Wand vorbeigehen */
  return !wandKreuzt(ax,az,bx,bz,0.2);
}
const _navQ=[];
/* Breitensuche vom Ziel aus, danach die Kette glaetten */
function navPfad(from,to,nah){
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
  /* Ziel nicht erreichbar (Lagergang zwischen vollen Regalreihen): frueher
     ging es dann auf dem Notweg geradeaus - quer durch die Lagerwand.
     Jetzt bis zur erreichbaren Stelle, die dem Ziel am naechsten ist. */
  if(D[start]<0){ if(nah) return null;
    const E=NAV.dist2&&NAV.dist2.length===D.length?NAV.dist2:(NAV.dist2=new Int32Array(D.length)); E.fill(-1); E[start]=0;
    let h=0, best=start, bd=1e9; const Q=[start];
    while(h<Q.length){ const c=Q[h++], i=c%W, k=(c-i)/W, p=navPos(c), dd=(p.x-to.x)**2+(p.z-to.z)**2; if(dd<bd){ bd=dd; best=c; }
      for(const n2 of [i>0?c-1:-1,i<W-1?c+1:-1,k>0?c-W:-1,k<H-1?c+W:-1]) if(n2>=0&&!NAV.g[n2]&&E[n2]<0){ E[n2]=0; Q.push(n2); } }
    const weg=navPfad(from,navPos(best),true)||[navPos(best)];
    /* das letzte Stueck zum Ziel nur, wenn keine Wand dazwischen ist */
    if(!wandKreuzt(weg[weg.length-1].x,weg[weg.length-1].z,to.x,to.z,0.2)) weg.push(to.clone?to.clone():V(to.x,0,to.z));
    return weg; }
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
  to=ausWand(V(to.x,0,to.z),KOERPER_R);
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
const KASSE_GRIFF=0.35;
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
    /* erst der Kundentyp, dann das Aussehen: Jugendliche kommen als
       Jugendliche, Angeber schick, Profis in Arbeitskleidung */
    this.ct=rollCustType();
    this.g=makePerson({ct:this.ct}); this.g.position.set(ein+rand(-4,4),0,13.5); scene.add(this.g);
    this.path=[V(ein,0,7.6),V(ein,0,4.9)]; this.state='enter'; this.speed=rand(1.2,1.6);
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
    /* draussen auf dem erhoehten Gehweg (28.09.) - sonst steckten die Fuesse darin */
    if(this.pos.z>5.8) this.pos.y=gehwegY(this.pos.x,this.pos.z); else if(this.pos.y>0&&this.pos.y<0.2) this.pos.y=0;
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
      this.say(`Keine ${P[w.type].short}?`,true); this.missed=true; DS.missed+=w.qty; rep(-0.4); kundenSymbol(this.g,'fehlt');
    }
    if(this.items.length){ if(this.thief) this.startSteal(); else this.joinQueue(); }
    else { rep(-0.3); serieBricht(); this.leave(); }
  }
  take(){
    const w=this.cur, lv=this.lv;
    if(!(lv.type===w.type&&lv.count>0)){
      const alt=findLevel(w.type,this.pos);
      if(alt){ this.lv=alt; this.path=route(this.pos,shelfStand(alt.sh)); this.state='toShelf'; return; }
      this.say(`Keine ${P[w.type].short} mehr?`,true); this.missed=true; DS.missed+=w.qty; rep(-0.4); kundenSymbol(this.g,'fehlt'); this.nextWish(); return;
    }
    let got=0, pricey=false;
    for(let k=0;k<w.qty;k++){
      if(lv.count<=0||lv.type!==w.type) break;
      const price=S.prices[w.type];
      if(this.thief||Math.random()<buyChance(w.type,price,lv.q,kindOf(lv.sh).cold,this.ct)){ removeFromLevel(lv); this.items.push({type:w.type,price}); got++; } else pricey=true;
    }
    if(got===0){ this.missed=true; if(pricey){ this.say('Viel zu teuer!',true); rep(-0.5); kundenSymbol(this.g,'teuer'); } else DS.missed+=w.qty; }
    else if(pricey) this.say('Hm, ganz schön teuer.');
    /* Wunsch gefunden und gekauft: ein Herz, nicht bei jedem Griff */
    else if(Math.random()<0.45){ kundenSymbol(this.g,'herz'); if(Math.random()<0.4) this.say(pick(['Genau das hab ich gesucht!','Endlich!','Perfekt.','Die nehm ich!'])); }
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
      this.speed=2.4; this.state='leave'; this.path=[...route(this.pos,V(e,0,4.9)),V(e+rand(-1.2,1.2),0,8),V(e+rand(-5,5),0,15)]; }
    if(staff.security&&staff.security.chase===this) staff.security.chase=null;
  }
  escaped(){
    const v=r2(this.stolenValue());
    DS.stolen=r2(DS.stolen+v); rep(-1.8);
    toast(`Dieb entkommen: Ware für ${eur(v)} weg.`,'bad');
    if(staff.security&&staff.security.chase===this) staff.security.chase=null;
  }
  joinQueue(){
    /* SB-Kassen (Tom, 29.09.): der Kunde zahlt dort immer selbst. Steht
       ein SB-Betreuer bereit, trauen sich auch Kunden mit vollerem Korb
       hin - ohne Betreuer nur, wer wenig hat. */
    const betreut=sbBetreuer().length>0, maxKorb=betreut?8:3;
    if(sbOffen()&&this.items.length<=maxKorb&&(queue.length>=1||regCustomer()||!staff.kassierer||Math.random()<(betreut?0.6:0.45))){
      const i=sbFreiNah(this.pos);
      if(i>=0){ this.sb=i; sbLanes[i].busy=this; sbLampe(sbLanes[i],false);
        this.state='sbGo'; this.path=[...route(this.pos,sbPos(i))]; DS.sb=(DS.sb||0)+1; return; }
    }
    queue.push(this); this.state='queue'; this.path=[...route(this.pos,queueApproach()),spotPos(queue.length-1)];
  }
  /* Spontankauf am Kassenregal (05.10.): wer in der Schlange daran
     vorbeikommt, greift ab und zu noch zu - ein Feuerzeug, Knicklichter,
     ein Marzipanschwein. Einmal je Kunde, zum ausgezeichneten Preis. */
  kassenGriff(){
    const sh=shelves.find(s=>kindOf(s).kasse&&!s.weg&&Math.hypot(shelfStand(s).x-this.pos.x,shelfStand(s).z-this.pos.z)<1.7); if(!sh) return;
    this.spontan=true; if(this.thief||Math.random()>=KASSE_GRIFF) return;
    const lvs=sh.levels.filter(l=>l.type&&l.count>0); if(!lvs.length) return;
    const lv=pick(lvs), t=lv.type, price=S.prices[t]||marketOf(t);
    if(Math.random()>=buyChance(t,price,lv.q,false,this.ct)) return;
    removeFromLevel(lv); this.items.push({type:t,price}); DS.spontan=(DS.spontan||0)+1;
    this.say(pick(['Ach, das nehm ich noch mit.','Fast vergessen!',`Und noch ${P[t].short}.`]));
  }
  sbStart(){
    this.state='sbPay';
    this.total=r2(this.items.reduce((a,it)=>a+it.price,0));
    this.sbT=1.1+this.items.length*1.25;
    this.method='card';
    /* etwa jeder dritte bis fuenfte kommt nicht weiter - mit mehr
       Ware im Korb eher als mit einem Teil */
    this.sbProblem=Math.random()<Math.min(0.36,0.18+0.025*this.items.length);
    this.sbProbBei=this.sbT*rand(0.25,0.7); this.hilfeT=0;
    this.say(pick(['Geht auch selbst.','Schnell durch hier.','Piep.']));
  }
  sbHilfeRuf(){
    this.state='sbHilfe'; this.sbProblem=false; this.hilfeT=0;
    const l=sbLanes[this.sb]; if(l) sbLampeHilfe(l,true);
    this.say(pick(['Hm, das geht nicht …','Artikel nicht erkannt?','Hallo? Hilfe!','Alterskontrolle …?']));
    DS.sbProbleme=(DS.sbProbleme||0)+1;
    if(!sbBetreuer().length&&sbHinweisOk()) toast('SB-Kasse: Ein Kunde kommt nicht weiter. Hilf ihm (E am Terminal) oder stell einen SB-Betreuer ein.');
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
    /* 03.10.: echte Kasse statt des Bestaetigungs-Tons (Schublade, Glocke) */
    rep(this.missed?0.2:0.8); { const v=this.g?nahVol(this.g.position):1; if(v>0.02) sfx.kasse(v); } toast('+'+eur(this.total),'money');
    geldSchwebt(this.pos,this.total);
    if(this.missed) serieBricht(); else { serieZufrieden(); if(this.total>=60) kundenSymbol(this.g,'stern'); }
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
    this.say('Dauert mir zu lange!',true); rep(-2); DS.angry++; kundenSymbol(this.g,'sauer'); serieBricht();
    if(['unload','scan','pay','sbPay','sbHilfe'].includes(this.state)) this.cleanupRegister();
    this.items=[]; this.leave();
  }
  leave(){
    const qi=queue.indexOf(this); if(qi>=0) queue.splice(qi,1);
    this.sbFree();
    if(this.mark){ this.g.remove(this.mark); this.mark=null; }
    { const e=naechsterEingang(this.pos.x);
      this.state='leave'; this.path=[...route(this.pos,V(e,0,4.9)),V(e,0,7.6),V(e+rand(-5,5),0,14)]; }
    /* seltener als frueher (22 %): Tom fand die Flecken zu viele */
    if(Math.random()<(hasDeko('muell')?0.04:0.08)) addDirt(this.pos.x+rand(-1,1),this.pos.z+rand(-1,1));
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
        if(!this.spontan) this.kassenGriff();
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
        if(this.sbProblem&&this.sbT<=this.sbProbBei){ this.sbHilfeRuf(); break; }
        if(this.sbT<=0){ sfx.beep(); this.complete(this.total,0); }
        else if(this.patience<=0) this.giveUp();
        break;
      case 'sbHilfe': {
        /* wartet auf Hilfe. Kommt keiner, fummelt er sich nach einer
           halben Minute selbst durch - verärgert. */
        this.hilfeT+=dt; this.patience-=dt*0.5;
        const l=sbLanes[this.sb]; if(l) sbLampeBlink(l,this.hilfeT);
        if(this.hilfeT>=SB_SELBST){ this.missed=true; rep(-0.4); DS.sbAllein=(DS.sbAllein||0)+1;
          this.say(pick(['Na endlich …','Nie wieder SB-Kasse.','Hat ja lange gedauert.'])); sbGeholfen(l,null); }
        break; }
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
