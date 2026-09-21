
/* =========================================================
   Personal
   ========================================================= */
const staff={reinigung:null,auffueller:null,auffueller2:null,kassierer:null,security:null,packer:null};
const IDLE={reinigung:V(-6.6,0,4.2),auffueller:V(-7.0,0,1.0),auffueller2:V(-7.0,0,-0.4),kassierer:V(0,0,0),security:V(1.4,0,4.6),packer:V(-16.3,0,3.4)};
const PRIO={lkw:'LKW zuerst',regal:'Regale zuerst'};
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
function prioOf(id){ const p=(S&&S.prio)||{}; return p[id]||(id==='auffueller'?'lkw':'regal'); }
function setPrio(id,v){ S.prio=S.prio||{}; S.prio[id]=v; save(); }
function freeRackSlot(){ for(const r of racks) for(const sl of r.slots) if(!sl.box) return sl; return null; }
class Worker{
  constructor(id){
    const look=STAFFLOOK[id];
    this.id=id; this.kind=id==='auffueller2'?'auffueller':id; this.g=makePerson({jacket:look.jacket,cap:look.cap});
    const st=IDLE[id]; this.g.position.copy(id==='kassierer'?ck(-0.25,-0.85):st); scene.add(this.g);
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
    else if(this.kind==='security') this.guardLoop(dt);
    else if(this.kind==='packer') this.packLoop(dt);
    animPerson(this.g,this.moving,dt,this.speed);
  }
  cleanLoop(dt){
    if(this.state==='idle'){ const d=nearestDirt(this.pos); if(d){ this.target=d; this.goTo(V(d.m.position.x,0,d.m.position.z+0.5)); this.state='go'; } else if(this.path.length===0&&this.pos.distanceTo(IDLE.reinigung)>0.5) this.goTo(IDLE.reinigung); else this.walk(dt); }
    else if(this.state==='go'){ if(!this.target||dirts.indexOf(this.target)<0){ this.state='idle'; return; } if(this.walk(dt)){ this.state='work'; this.t=2.2; } }
    else if(this.state==='work'){ this.t-=dt*(this.wf||1); if(this.t<=0){ if(this.target&&dirts.indexOf(this.target)>=0){ removeDirt(this.target); sfx.pop(); } this.target=null; this.state='idle'; } }
  }
  packLoop(dt){
    const home=IDLE.packer;
    if(this.pos.distanceTo(home)>0.45){ if(!this.path.length) this.goTo(home); this.walk(dt); return; }
    this.g.rotation.y+=((-Math.PI/2)-this.g.rotation.y)*Math.min(1,dt*6);
    if((S.offen|0)>0){ this.moving=true; }
  }
  stockLoop(dt){
    if(this.state==='idle'){
      const truckJob=()=>(typeof truck!=='undefined'&&truck&&truck.state==='docked'&&truck.cargo.length)?{kind:'truck'}:null;
      const res=t=>typeof reservedType==='function'&&reservedType(t);
      const shelfJob=()=>{
        for(const b of floorBoxes){ if(!res(b.type)&&emptyLevel(b.type)) return {box:b,kind:'floor'}; }
        for(const r of racks) for(const s of r.slots){ if(s.box&&!res(s.box.type)&&emptyLevel(s.box.type)) return {slot:s,kind:'rack'}; }
        return null;
      };
      const pr=prioOf(this.id);
      const src=pr==='lkw'?(truckJob()||shelfJob()):(shelfJob()||truckJob());
      if(src&&src.kind==='truck'){ this.src=src; this.goTo(DOCK.stand.clone()); this.state='atTruck'; }
      else if(src){ this.src=src; const p=src.kind==='floor'?src.box.mesh.position:localToWorld(src.slot.rk.g,src.slot.x,0.8);
        this.goTo(V(p.x,0,p.z+(src.kind==='floor'?0.7:0.8))); this.state='fetch'; }
      else { const home=IDLE[this.id]||IDLE.auffueller;
        if(this.path.length===0&&this.pos.distanceTo(home)>0.6) this.goTo(home); else this.walk(dt); }
    }
    else if(this.state==='atTruck'){
      if(this.walk(dt)){
        const c=pullFromTruck();
        if(!c){ this.state='idle'; return; }
        this.carry=c; this.pickStore();
      }
    }
    else if(this.state==='toStore'){ if(this.walk(dt)){ this.state='store'; this.t=0.45; } }
    else if(this.state==='store'){
      this.t-=dt;
      if(this.t<=0){
        const sl=this.slot;
        if(!this.carry){ this.state='idle'; return; }
        if(sl&&!sl.box) putInSlot(sl,this.carry.type,this.carry.count,this.carry.q);
        else spawnFloorBox(this.carry.type,this.carry.count,null,this.carry.q);
        this.carry=null; this.slot=null; this.state='idle'; sfx.pop();
      }
    }
    else if(this.state==='fetch'){
      if(this.walk(dt)){
        const s=this.src;
        if(s.kind==='floor'&&floorBoxes.indexOf(s.box)>=0){ this.carry={type:s.box.type,count:s.box.count}; removeFloorBox(s.box); }
        else if(s.kind==='rack'&&s.slot.box){ this.carry={type:s.slot.box.type,count:s.slot.box.count}; s.slot.rk.g.remove(s.slot.box.mesh); s.slot.box=null; drawRackSchild(s.slot.rk); }
        this.state=this.carry?'toShelf':'idle'; if(this.carry) this.pickShelf();
      }
    }
    else if(this.state==='toShelf'){ if(this.walk(dt)){ this.state='fill'; this.t=0.3/(this.wf||1); } }
    else if(this.state==='fill'){
      this.t-=dt;
      if(this.t<=0){
        this.t=0.32/(this.wf||1);
        const lv=this.lv;
        if(!this.carry){ this.state='idle'; return; }
        if(!lv||(lv.type&&lv.type!==this.carry.type)||lv.count>=capOf(lv,this.carry.type)){ this.pickShelf(); return; }
        if(addToLevel(lv,this.carry.type,this.carry.q||1)){ this.carry.count--; if(this.carry.count<=0){ this.carry=null; this.state='idle'; } }
        else this.pickShelf();
      }
    }
  }
  pickStore(){
    const sl=freeRackSlot();
    this.slot=sl;
    const p=sl?localToWorld(sl.rk.g,sl.x,0.9):V(DSLOTS[0].x,0,DSLOTS[0].z+0.7);
    this.goTo(V(p.x,0,p.z)); this.state='toStore';
  }
  pickShelf(){
    if(!this.carry){ this.state='idle'; return; }
    const lv=emptyLevel(this.carry.type);
    if(!lv){ if(this.carry.count>0) spawnFloorBox(this.carry.type,this.carry.count,null,this.carry.q||1); this.carry=null; this.state='idle'; return; }
    this.lv=lv; this.goTo(shelfStand(lv.sh)); this.state='toShelf';
  }
  cashLoop(dt){
    const home=ck(-0.25,-0.85);
    if(this.pos.distanceTo(home)>0.12){ this.path=[home]; this.walk(dt); }
    else this.g.rotation.y+=((ckYaw()+Math.PI/2)-this.g.rotation.y)*Math.min(1,dt*6);
    this.t-=dt;
    if(this.t<=0&&belt.length&&regCustomer()){ scanBelt(belt[0]); this.t=0.5/(this.wf||1); }
  }
  guardLoop(dt){
    if(this.chase&&customers.indexOf(this.chase)>=0&&!this.chase.caught){
      this.path=[V(this.chase.pos.x,0,this.chase.pos.z)]; this.walk(dt);
      if(this.pos.distanceTo(this.chase.pos)<1.3) this.chase.caughtBy('security');
      return;
    }
    this.chase=null;
    if(this.path.length===0){ if(Math.random()<0.5) this.goTo(V(rand(-5,5),0,rand(-4,4))); else this.goTo(IDLE.security); }
    this.walk(dt);
  }
  remove(){ scene.remove(this.g); if(this.carry&&this.carry.count>0) spawnFloorBox(this.carry.type,this.carry.count,null,this.carry.q||1); }
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
