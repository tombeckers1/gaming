
/* =========================================================
   Personal
   ========================================================= */
const staff={reinigung:null,auffueller:null,auffueller2:null,kassierer:null,kassierer2:null,kassierer3:null,security:null,packer:null,packer2:null,packer3:null};
/* SB-Betreuer (Tom, 29.09.): an SB-Kassen kassiert niemand. Der Kunde
   scannt und zahlt selbst; etwa jeder dritte bis fuenfte kommt nicht
   weiter (Artikel wird nicht erkannt, Alterspruefung, Karte zickt).
   Dann blinkt die Lampe rot, und ein Betreuer geht hin und hilft. Einer
   schafft mehrere Kassen - je mehr Kassen und Kunden, desto eher
   braucht es einen zweiten. Die Ids bleiben die alten (Spielstaende). */
const SB_KASSIERER=['kassierer2','kassierer3'];
function sbBetreuer(){ return SB_KASSIERER.map(id=>staff[id]).filter(Boolean); }
function sbWelt(i,x,z){
  const l=sbLanes[i], g=l.g, p=g.parent;
  return (p&&p!==scene)?localToWorld(p,g.position.x+x,g.position.z+z):V(g.position.x+x,0,g.position.z+z);
}
/* Wo der Betreuer beim Helfen steht: seitlich vor dem Terminal, mit
   Blick auf den Bildschirm - neben dem Kunden, der mittig davor steht */
function sbHelferPlatz(i){
  const l=sbLanes[i]; if(!l) return {p:V(0,0,0),ry:0};
  const pr=l.g.parent, ry=(pr&&pr!==scene?pr.rotation.y:0);
  return {p:sbWelt(i,0.66,0.95),ry:ry+Math.atan2(-0.66,-0.95)};
}
/* Warteplatz: hinter den Terminals auf der Ladenseite (vor der Zeile
   ist gleich die Fensterfront), mit Blick zu den Kassen. Seit 05.10.
   gibt es nur noch die SB-Zeile der Erweiterung (die am zweiten Eingang
   ist weg) und zwei Betreuer. */
function sbHeimPlatz(id){
  const idx=[]; sbLanes.forEach((l,i)=>idx.push(i));
  if(!idx.length) return {p:freiePos(IDLE.kassierer2||V(10.6,0,6)),ry:Math.PI};
  const k=SB_KASSIERER.indexOf(id)%2;
  const a=sbWelt(idx[0],0,0), b=sbWelt(idx[idx.length-1],0,0);
  const pr=sbLanes[idx[0]].g.parent, ry=(pr&&pr!==scene?pr.rotation.y:0);
  /* 0,95 m hinter der Zeile, der zweite Betreuer einen Meter daneben */
  const m=V((a.x+b.x)/2,0,(a.z+b.z)/2), s=Math.sin(ry), c=Math.cos(ry), off=k?0.9:-0.3;
  const p=V(m.x-0.95*s+off*c,0,m.z-0.95*c-off*s);
  return {p:freiePos(p),ry};
}
/* Alte Schnittstellen: eine Spur "besetzt" gibt es nicht mehr */
function sbLaneVon(id){ return -1; }
function sbBesetzt(i){ const l=sbLanes[i]; return l&&l.helfer||null; }
function sbKassiererPlatz(i){ return sbHelferPlatz(i); }
/* Platz vor dem Packtisch, in Weltkoordinaten, mit Blick zum Tisch.
   Jeder Versandmitarbeiter hat seinen eigenen Packplatz (11c). */
function packerPlatz(id){
  if(typeof packTisch==='undefined'||!packTisch) return {p:IDLE.packer,ry:-Math.PI/2};
  const i=id==='packer3'?2:id==='packer2'?1:0;
  return {p:vsWelt(i,VS_HEIM.x,VS_HEIM.z),ry:packTisch.rotation.y+Math.PI};
}
const IDLE={kassierer2:V(10.6,0,6.3),reinigung:V(-6.6,0,4.2),auffueller:V(-7.0,0,1.0),auffueller2:V(-7.0,0,-0.4),kassierer:V(0,0,0),security:V(1.4,0,4.6),packer:V(-16.3,0,3.4)};
const PRIO={lkw:'LKW zuerst',regal:'Regale zuerst'};
/* Feste Ruheplaetze koennen unter verschiebbaren Moebeln liegen - der
   des Einraeumers lag mitten im Buerotisch. Dann die naechste freie Stelle. */
function freiePos(v){
  if(typeof NAV==='undefined') return v.clone();
  if(NAV.dirty) navBuild();
  if(navFrei(navIdx(v.x,v.z))) return v.clone();
  const n=navNah(v.x,v.z); return n>=0?navPos(n):v.clone();
}
/* Lohnstufen: mehr Geld heißt schneller, gründlicher und freundlicher */
const WAGES=[
  {f:0.75,name:'Mindestlohn',desc:'billig, aber lustlos'},
  {f:1.00,name:'Normal',desc:'macht seinen Job'},
  {f:1.30,name:'Gut bezahlt',desc:'flott und aufmerksam'},
  {f:1.65,name:'Top',desc:'schnell, gründlich, freundlich'}
];
function wageOf(id){ const v=(S&&S.wage&&S.wage[id]); return WAGES.some(w=>w.f===v)?v:1.0; }
/* Saisonpause: von Januar bis Herbst braucht kein Laden volle Besetzung.
   Statt zu kuendigen und spaeter wieder Einstellungskosten zu zahlen,
   geht das Personal in Kurzarbeit: 30 Prozent Lohn, dafuer keine Arbeit. */
function inPause(id){ return !!(S&&S.pause&&S.pause[id]); }
function setPause(id,an){
  if(!S.staff||!S.staff[id]) return;
  S.pause=S.pause||{};
  if(an){ S.pause[id]=true; fireStaff(id); }
  else { delete S.pause[id]; hireStaff(id); }
  save();
}
function wageName(id){ const f=wageOf(id), w=WAGES.find(x=>x.f===f); return w?w.name:'Normal'; }
function setWage(id,f){ S.wage=S.wage||{}; S.wage[id]=f; if(staff[id]) staff[id].applyWage(); save(); }
/* Freundlichkeit: Mittel aller Lohnfaktoren, wirkt auf Geduld und Kauflaune */
function friendliness(){
  let n=0,sum=0;
  STAFF.forEach(st=>{ if(S&&S.staff&&S.staff[st.id]){ n++; sum+=wageOf(st.id); } });
  return n?sum/n:1;
}
/* =========================================================
   Einraeumer einstellen (Tom, 24.09.): jeder Einraeumer bekommt
   seine eigene Reihenfolge aus drei Aufgaben, jede einzeln an/aus.
     regal  - Verkaufsregale aus dem Lager nachfuellen
     direkt - vom LKW direkt ins Verkaufsregal, wenn dort fuer das
              Produkt Platz ist; der Rest geht ins Lagerregal
     lager  - LKW ins Lagerregal entladen
   ========================================================= */
const AUFGABEN={regal:{name:'Verkaufsregale auffüllen',kurz:'Regale',desc:'aus dem Lager in die Verkaufsregale'},
  direkt:{name:'LKW direkt ins Regal',kurz:'Direkt',desc:'vom LKW direkt ins Verkaufsregal, wo Platz ist'},
  lager:{name:'LKW ins Lager',kurz:'Lager',desc:'Kartons vom LKW ins Lagerregal'},
  /* Versandmaterial (05.10.): vom LKW ins Packmaterial-Regal (11d) */
  vm:{name:'Versandmaterial einräumen',kurz:'Packmittel',desc:'Kartons, Folie und Klebeband vom LKW ins Packmaterial-Regal an der Packstation'}};
const AUFG_IDS=Object.keys(AUFGABEN);
function einrStd(id,alt){ return (alt||(id==='auffueller'?'lkw':'regal'))==='lkw'?['direkt','lager','regal']:['regal','direkt','lager']; }
function einrOf(id){
  S.einr=S.einr||{};
  let e=S.einr[id];
  if(!e||!Array.isArray(e.reihe)){ e={reihe:einrStd(id,S.prio&&S.prio[id]),aus:{}}; S.einr[id]=e; }
  e.reihe=e.reihe.filter(a=>AUFGABEN[a]); AUFG_IDS.forEach(a=>{ if(e.reihe.indexOf(a)<0) e.reihe.push(a); });
  e.aus=e.aus||{}; return e;
}
function einrAktiv(id){ const e=einrOf(id); return e.reihe.filter(a=>!e.aus[a]); }
function einrHoch(id,a){ const e=einrOf(id), i=e.reihe.indexOf(a); if(i>0){ e.reihe.splice(i,1); e.reihe.splice(i-1,0,a); save(); } }
function einrRunter(id,a){ const e=einrOf(id), i=e.reihe.indexOf(a); if(i>=0&&i<e.reihe.length-1){ e.reihe.splice(i,1); e.reihe.splice(i+1,0,a); save(); } }
function einrSchalten(id,a){ const e=einrOf(id); e.aus[a]=!e.aus[a]; save(); }
/* alte Schnittstelle: 'lkw', wenn der LKW vor den Regalen kommt */
function prioOf(id){ const r=einrAktiv(id); const i=r.indexOf('regal'), j=Math.min(...['direkt','lager'].map(a=>r.indexOf(a)<0?99:r.indexOf(a)));
  return (i<0||j<i)?'lkw':'regal'; }
function setPrio(id,v){ S.prio=S.prio||{}; S.prio[id]=v; S.einr=S.einr||{}; S.einr[id]={reihe:einrStd(id,v),aus:{}}; save(); }
function freeRackSlot(){ for(const r of racks) for(const sl of r.slots) if(!sl.box) return sl; return null; }
class Worker{
  constructor(id){
    this.id=id; this.kind=id==='auffueller2'?'auffueller':SB_KASSIERER.indexOf(id)>=0?'sbkasse':id.indexOf('packer')===0?'packer':id; this.g=makePerson({uniform:id});
    const st=this.kind==='packer'?packerPlatz(id).p:this.kind==='sbkasse'?sbHeimPlatz(id).p:freiePos(IDLE[id]); this.g.position.copy(id==='kassierer'?ck(-0.25,-0.85):st); scene.add(this.g);
    this.path=[]; this.base=id==='security'?1.9:1.45; this.speed=this.base; this.state='idle'; this.t=0; this.carry=null; this.chase=null; this.moving=false; this.applyWage();
  }
  get pos(){ return this.g.position; }
  applyWage(){ const f=wageOf(this.id); this.speed=this.base*(0.55+0.48*f); this.wf=f; }
  walk(dt){
    if(!this.path.length){ this.moving=false; return true; }
    const t=this.path[0], dx=t.x-this.pos.x, dz=t.z-this.pos.z, d=Math.hypot(dx,dz), st=this.speed*dt;
    if(d<=st){ this.pos.x=t.x; this.pos.z=t.z; this.path.shift(); } else { this.pos.x+=dx/d*st; this.pos.z+=dz/d*st; }
    if(d>0.02){ const ty=Math.atan2(dx,dz); let df=ty-this.g.rotation.y; while(df>Math.PI) df-=Math.PI*2; while(df<-Math.PI) df+=Math.PI*2; this.g.rotation.y+=df*Math.min(1,dt*9); }
    this.moving=true; return this.path.length===0;
  }
  goTo(v){ this.path=route(this.pos,v.clone()); }
  update(dt){
    this.moving=false;
    if(this.kind==='reinigung') this.cleanLoop(dt);
    else if(this.kind==='auffueller') this.stockLoop(dt);
    else if(this.kind==='kassierer') this.cashLoop(dt);
    else if(this.kind==='sbkasse') this.sbLoop(dt);
    else if(this.kind==='security') this.guardLoop(dt);
    else if(this.kind==='packer') this.packLoop(dt);
    animPerson(this.g,this.moving,dt,this.speed);
    if(this.kind==='reinigung') wischerPersonal(this,dt);
    if(this.kind==='auffueller'){ einrPose(this,dt); vmEinrZeigen(this); }
    if(this.kind==='packer') vsPose(this,dt);
  }
  cleanLoop(dt){
    if(this.state==='idle'){ const d=nearestDirt(this.pos); if(d){ this.target=d; this.goTo(V(d.m.position.x+0.25,0,d.m.position.z+0.85)); this.state='go'; } else if(this.path.length===0&&this.pos.distanceTo(IDLE.reinigung)>0.5) this.goTo(IDLE.reinigung); else this.walk(dt); }
    else if(this.state==='go'){ if(!this.target||dirts.indexOf(this.target)<0){ this.state='idle'; return; } if(this.walk(dt)){ this.state='work'; this.t=2.2; } }
    else if(this.state==='work'){ this.t-=dt*(this.wf||1); if(this.t<=0){ if(this.target&&dirts.indexOf(this.target)>=0){ removeDirt(this.target); sfx.pop(); } this.target=null; this.state='idle'; } }
  }
  /* Versandmitarbeiter: Kommissionierwagen, Picken, Packtisch -
     der ganze Ablauf steht in 11c-versand.js */
  packLoop(dt){ vsLoop(this,dt); }
  stockLoop(dt){
    if(this.state==='idle'){
      /* Reihenfolge und an/aus stellt der Spieler je Einraeumer ein */
      const src=einrJob(this);
      this.src=src;
      if(src&&src.kind==='vm') vmEinrStart(this,src);
      else if(src&&src.kind==='truck'){ this.goTo(DOCK.stand.clone()); this.state='atTruck'; }
      /* 05.10.: vor dem Lagerregal steht er auf dessen Vorderseite - frueher
         kamen zu dieser Stelle noch 0,8 m nach +z dazu, bei den Regalen mit
         Front nach -z (Nordreihe am Rolltor) stand er damit mitten im Regal */
      else if(src){ const p=src.kind==='floor'?V(src.box.mesh.position.x,0,src.box.mesh.position.z+0.7):localToWorld(src.slot.rk.g,src.slot.x,rackKindOf(src.slot.rk).zo+0.55);
        this.goTo(V(p.x,0,p.z)); this.state='fetch'; }
      else { const home=freiePos(IDLE[this.id]||IDLE.auffueller);
        if(this.path.length===0&&this.pos.distanceTo(home)>0.6) this.goTo(home); else this.walk(dt); }
    }
    else if(this.state==='atTruck'){
      if(this.walk(dt)){
        const c=this.src&&this.src.direkt?pullFromTruckTyp(this.src.typ):pullFromTruck();
        if(!c){ this.state='idle'; this.src=null; return; }
        this.carry=c; this.src=null;
        /* direkt ins Verkaufsregal, wenn dort fuer das Produkt Platz ist */
        const direkt=einrAktiv(this.id).indexOf('direkt')>=0&&emptyLevel(c.type);
        if(direkt) this.pickShelf(); else this.pickStore();
      }
    }
    else if(this.state==='toStore'){ if(this.walk(dt)){ this.state='store'; this.t=0.45; } }
    else if(this.state==='store'){
      this.t-=dt;
      if(this.t<=0){
        const sl=this.slot;
        if(!this.carry){ this.state='idle'; return; }
        if(sl&&!sl.box&&!(sl.rk&&sl.rk.weg)) putInSlot(sl,this.carry.type,this.carry.count,this.carry.q);
        else spawnFloorBox(this.carry.type,this.carry.count,null,this.carry.q);
        this.carry=null; this.slot=null; this.state='idle'; sfx.pop();
      }
    }
    else if(this.state==='fetch'){
      if(this.walk(dt)){
        const s=this.src;
        if(s.kind==='floor'&&floorBoxes.indexOf(s.box)>=0){ this.carry={type:s.box.type,count:s.box.count,q:s.box.q||1}; kisteZurueck(s.box); removeFloorBox(s.box); }
        else if(s.kind==='rack'&&s.slot.box){ this.carry={type:s.slot.box.type,count:s.slot.box.count,q:s.slot.box.q||1}; kisteZurueck(s.slot.box); s.slot.rk.g.remove(s.slot.box.mesh); s.slot.box=null; drawRackSchild(s.slot.rk); }
        this.src=null;
        this.state=this.carry?'toShelf':'idle'; if(this.carry) this.pickShelf();
      }
    }
    else if(this.state==='toShelf'){ if(this.walk(dt)){ this.state='fill'; this.offen=0; } }
    else if(this.state==='fill') einrFill(this,dt);
    else if(this.state==='falten') einrFalten(this,dt);
    else if(this.state.indexOf('vm')===0) vmEinrLoop(this,dt);
  }
  pickStore(){
    const sl=freeRackSlot();
    this.slot=sl; this.offen=0; einrAufraeumen(this);
    const p=sl?localToWorld(sl.rk.g,sl.x,0.9):V(DSLOTS[0].x,0,DSLOTS[0].z+0.7);
    this.goTo(V(p.x,0,p.z)); this.state='toStore';
  }
  pickShelf(){
    einrAufraeumen(this);
    if(!this.carry){ this.state='idle'; return; }
    const lv=emptyLevel(this.carry.type);
    /* Regal voll: der Rest kommt ins Lagerregal, nicht auf den Boden */
    if(!lv){ if(this.carry.count>0) this.pickStore(); else { this.carry=null; this.state='idle'; } return; }
    if(this.state==='fill'&&this.lv&&this.lv.sh===lv.sh){ this.lv=lv; return; }
    this.lv=lv; this.offen=0; this.goTo(shelfStand(lv.sh)); this.state='toShelf';
  }
  cashLoop(dt){
    const home=ck(-0.25,-0.85);
    if(this.pos.distanceTo(home)>0.12){ this.path=[home]; this.walk(dt); }
    else this.g.rotation.y+=((ckYaw()+Math.PI/2)-this.g.rotation.y)*Math.min(1,dt*6);
    this.t-=dt;
    if(this.t<=0&&belt.length&&regCustomer()){ scanBelt(belt[0]); this.t=0.5/(this.wf||1); }
  }
  sbLoop(dt){
    /* Wer gerade hilft, bleibt dabei, bis der Kunde weiter kann */
    if(this.job){ const l=this.job, c=l.busy;
      if(!c||c.state!=='sbHilfe'){ if(l.helfer===this) l.helfer=null; this.job=null; this.state='idle'; this.path=[]; return; }
      if(this.state!=='hilft'){ if(this.walk(dt)){ this.state='hilft'; this.t=rand(2.2,3.6)/(this.wf||1); } return; }
      const H=sbHelferPlatz(sbLanes.indexOf(l));
      let df=H.ry-this.g.rotation.y; while(df>Math.PI) df-=Math.PI*2; while(df<-Math.PI) df+=Math.PI*2;
      this.g.rotation.y+=df*Math.min(1,dt*6);
      this.t-=dt; if(this.t<=0){ sbGeholfen(l,this); this.job=null; this.state='idle'; }
      return; }
    /* naechstes Problem: das naechstgelegene, um das sich noch keiner kuemmert */
    let best=-1, bd=1e9;
    sbLanes.forEach((l,i)=>{ const c=l.busy; if(!c||c.state!=='sbHilfe'||l.helfer||!sbNutzbar(i)) return;
      const q=sbHelferPlatz(i).p, d=Math.hypot(q.x-this.pos.x,q.z-this.pos.z); if(d<bd){ bd=d; best=i; } });
    if(best>=0){ const l=sbLanes[best]; l.helfer=this; this.job=l; this.state='geht'; this.goTo(sbHelferPlatz(best).p); this.walk(dt); return; }
    /* sonst wartet er an seiner Zeile und behaelt die Kassen im Blick */
    const H=sbHeimPlatz(this.id);
    if(this.pos.distanceTo(H.p)>0.3){ if(!this.path.length) this.goTo(H.p); this.walk(dt); return; }
    this.path=[];
    let df=H.ry-this.g.rotation.y; while(df>Math.PI) df-=Math.PI*2; while(df<-Math.PI) df+=Math.PI*2;
    this.g.rotation.y+=df*Math.min(1,dt*4);
  }
  guardLoop(dt){
    if(this.chase&&customers.indexOf(this.chase)>=0&&!this.chase.caught){
      /* 05.10.: hinterher auf dem Wegnetz, nicht geradeaus durch die Wand -
         neu gesucht alle 0,4 s, der Dieb laeuft ja weiter */
      this.jagdT=(this.jagdT||0)-dt;
      if(this.jagdT<=0||!this.path.length){ this.jagdT=0.4; this.path=route(this.pos,V(this.chase.pos.x,0,this.chase.pos.z)); }
      this.walk(dt);
      if(this.pos.distanceTo(this.chase.pos)<1.3) this.chase.caughtBy('security');
      return;
    }
    this.chase=null;
    if(this.path.length===0){ if(Math.random()<0.5) this.goTo(V(rand(-5,5),0,rand(-4,4))); else this.goTo(IDLE.security); }
    this.walk(dt);
  }
  remove(){ if(this.job&&this.job.helfer===this) this.job.helfer=null; einrAufraeumen(this); if(this.kind==='packer') vsAufraeumen(this); if(this.carry&&this.carry.vm){ vmEinlagern(this.carry.pi===undefined?-1:this.carry.pi,this.carry.vm); this.carry=null; } scene.remove(this.g); if(this.carry&&this.carry.count>0) spawnFloorBox(this.carry.type,this.carry.count,null,this.carry.q||1); }
}
function hireStaff(id){ if(staff[id]) return; staff[id]=new Worker(id); }
function fireStaff(id){ if(!staff[id]) return; staff[id].remove(); staff[id]=null; }
function dailyWages(){ let w=0; STAFF.forEach(s=>{ if(S.staff[s.id]) w+=r2(s.wage*wageOf(s.id)*(inPause(s.id)?0.3:1)); }); return r2(w); }
/* Wer zu schlecht bezahlt wird, kündigt irgendwann */
function staffMorale(){
  STAFF.forEach(st=>{
    if(!S.staff[st.id]||inPause(st.id)) return;
    if(wageOf(st.id)<0.8&&Math.random()<0.14){
      S.staff[st.id]=false; fireStaff(st.id); rep(-1);
      toast(`${st.name} hat gekündigt. Für den Lohn macht das keiner lange.`,'bad');
    }
  });
}
