/* =========================================================
   Hochregal-Logik (Halle Etappe A, 14.10.2026, plan-1410.md):
   Wareneingang (Tor 2-4) -> Stellplaetze -> FTS -> Aufgabe-Foerderer -> RBG -> Gasse
   Gasse -> RBG -> Auslager-Foerderer -> Anbruch (Lagerregale am I/O) -> Packer picken dort
   Anbruch -> FTS -> Nachschub in die Lagerregale von ③, ② und ①.
   Bestand im Hochregal zaehlt fuer Onlinebestellungen (stockOf/vsBestand). Spielstand: S.hr
   {p:[Platz -> [{t,c,q}] | null], tr:[Ladung unterwegs]}. Welt: 05q (LL, LL_T), Bauteile: bk.hochregal/rbg/fts/foerderer.
   ========================================================= */
const HR={rbg:[],fts:[],anbruchT:0,tick:0,last:null,zahl:{ein:0,aus:0,nach:0}};   /* zahl: Paletten ein/aus, Nachschub-Fahrten (Tests, Vorfuehrung) */
const HR_TEMPO={fahr:2.6,hub:0.9,gabel:0.6,foerder:0.55,fts:1.5};   /* m/s (RBG Fahren/Heben/Gabel, Foerderer, FTS) */
const HR_JE_PALETTE=8;                                              /* Kartons je Regalpalette (2 x 2 x 2) */
function hrDaten(){ if(!S.hr||!Array.isArray(S.hr.p)) S.hr={p:new Array(540).fill(null),tr:[]}; if(!Array.isArray(S.hr.tr)) S.hr.tr=[]; return S.hr; }
function hrPlaetze(k){ const R=LL_T&&LL_T.hr; return R?R.plaetze.slice(k*180,(k+1)*180):[]; }
/* Bestand je Sorte (Plaetze + Ladungen unterwegs) */
function hrStock(t){ if(!S||!S.hr) return 0; let n=0;
  for(const p of S.hr.p) if(p) for(const b of p) if(!t||b.t===t) n+=b.c;
  for(const l of S.hr.tr) for(const b of l.b) if(!t||b.t===t) n+=b.c;
  return n; }
function hrBelegt(){ let n=0; if(S&&S.hr) for(const p of S.hr.p) if(p&&p.length) n++; return n; }
function hrKapazitaet(){ let n=0; for(let k=0;k<3;k++) if(llGasseAktiv(k)) n+=hrPlaetze(k).length; return n; }
/* Sichtbar machen: Paletten im Regal, RBG der aktiven Gassen */
function hrSync(){ if(!LL_T||!LL_T.hr) return; const D=hrDaten(), L=[];
  for(let i=0;i<LL_T.hr.plaetze.length;i++){ if(D.p[i]&&!D.p[i].length) D.p[i]=null; if(D.p[i]) L.push(i); } LL_T.hr.belegen(L); }
function hrAnwenden(){
  if(!S) return;
  if(!llOffen()||!LL_T){ for(const f of HR.fts) if(f.g) f.g.visible=false; return; }
  const D=hrDaten();
  for(let k=0;k<3;k++){ const G=LL_T.gassen[k]; if(!G) continue;
    if(llGasseAktiv(k)&&!G.rbg){ G.rbg=bk.rbg({x:LL.aufgabe.x,z:G.R.mitte,hoehe:LL_T.hr.hoehe+0.25,parent:LL_D}); G.rbg.k=k; G.rbg.job=null; HR.rbg[k]=G.rbg; }
    if(G.rbg) G.rbg.g.visible=llGasseAktiv(k); }
  if(!HR.fts.length){ HR.fts=[bk.fts({x:-44.5,z:LL.spur,ry:0,parent:LL_D}),bk.fts({x:-43.0,z:-16.2,ry:Math.PI/2,parent:LL_D})];
    HR.fts.forEach((f,i)=>{ f.i=i; f.job=null; f.last=null; }); }
  for(const f of HR.fts) f.g.visible=true;
  LL_D.traverse(o=>{ if(o.isMesh) o.castShadow=false; });   /* unter dem Hallendach kein Sonnenschatten */
  /* Ladungen, die beim Speichern unterwegs waren, kommen ins Regal (sonst auf einen Stellplatz) */
  if(D.tr.length&&!HR.rbg.some(r=>r&&r.job)&&!HR.fts.some(f=>f.job)){ for(const l of D.tr.splice(0)){ if(!l||!Array.isArray(l.b)||!l.b.length) continue; const i=hrFreiPlatz(); if(i>=0) D.p[i]=l.b; else hrAufBoden(l.b); } }
  hrSync(); llStellSicht();
}
function hrAufBoden(boxes){ boxes.forEach((b,i)=>spawnFloorBox(b.t,b.c,{x:-40+(i%4)*0.7,y:0.2,z:-31.5+Math.floor(i/4)*0.6,ry:0},b.q||1)); }
/* naechster freier Platz: aktive Gassen, nah am I/O, unten zuerst */
function hrFreiPlatz(){ const D=hrDaten(); let best=-1, bd=1e9;
  for(let k=0;k<3;k++){ if(!llGasseAktiv(k)) continue; const P=hrPlaetze(k);
    for(let i=0;i<P.length;i++){ const j=k*180+i; if(D.p[j]||HR.reserv&&HR.reserv[j]) continue; const p=P[i], d=Math.abs(p.x-LL.aufgabe.x)/HR_TEMPO.fahr+p.y/HR_TEMPO.hub; if(d<bd){ bd=d; best=j; } } }
  return best; }

/* ---------- Stellplaetze am Wareneingang (05q LL_STELL) ----------
   Gefuellt von hinten nach vorn; eine leere Palette steht nur dort, wo dahinter nichts mehr liegt - so
   blockiert keine leere Palette den Weg des FTS zu einer beladenen. */
let LL_STELL_M=null;
function llStellBoxen(p){ const out=[]; for(const b of floorBoxes){ const q=b.mesh.position; if(Math.abs(q.x-p.x)<0.5&&Math.abs(q.z-p.z)<0.62&&q.y>0.15&&q.y<1.2) out.push(b); } return out; }
function llStellZustand(){ return LL_STELL.map(p=>({p,n:llStellBoxen(p).length})); }
function llStellSicht(){
  if(!LL_D) return;
  /* alle Stellplatz-Paletten in EINEM InstancedMesh; ausgeblendete bekommen Groesse 0 */
  if(!LL_STELL_M){ LL_STELL_M=bk.inst(bk.palette('euro',{fein:bk.lod()>1}),MAT.get('palette'),LL_STELL.map(p=>tm(p.x,0,p.z,0,Math.PI/2,0)),{parent:LL_D,bauteil:'palette',art:'stellplatz',schatten:false,farben:LL_STELL.map((p,i)=>bk.palFarbe(p.x,0,p.z,i))}); }
  const Z=llStellZustand();
  LL_STELL.forEach((p,i)=>{ const hinten=LL_STELL.filter(q=>q.tor===p.tor&&q.s===p.s&&q.r<p.r);
    const belegt=Z[i].n>0, frei=!hinten.some(q=>Z[LL_STELL.indexOf(q)].n>0), weg=HR.fts.some(f=>f.job&&f.job.stell===i);
    LL_STELL_M.setMatrixAt(i,(!weg&&(belegt||frei))?tm(p.x,0,p.z,0,Math.PI/2,0):tm(p.x,-1,p.z,0,0,0,0.0001,0.0001,0.0001)); });
  LL_STELL_M.instanceMatrix.needsUpdate=true;
}
/* Abstellplatz fuer den n-ten Karton eines Westtors (08c wbaySlot) - null = alter Platz */
function llStellSlot(tor){
  if(!llOffen()||tor>2) return null;
  const Z=llStellZustand();
  for(let r=0;r<3;r++) for(let s=0;s<2;s++){ const i=LL_STELL.findIndex(q=>q.tor===tor&&q.r===r&&q.s===s); if(i<0) continue;
    if(HR.fts.some(f=>f.job&&f.job.stell===i)) continue;
    const n=Z[i].n; if(n>=HR_JE_PALETTE) continue;
    const p=LL_STELL[i], lx=n%2, lz=Math.floor(n/2)%2, ly=Math.floor(n/4);
    later(0.05,llStellSicht);
    return {x:p.x-0.2+lx*0.4,y:bk.PALETTE.euro.h+0.2+ly*0.41,z:p.z-0.3+lz*0.6,ry:Math.PI/2+rand(-0.03,0.03)}; }
  return null;
}

/* ---------- Bewegung ---------- */
function hrNach(cur,ziel,v,dt){ const d=ziel-cur, s=v*dt; return Math.abs(d)<=s?ziel:cur+Math.sign(d)*s; }
/* Ladung als sichtbare Gruppe: Palette + Kartons (Atlas je Sorte) */
function hrLadung(boxes){ const g=new THREE.Group(); const pa=new THREE.Mesh(bk.palette('euro',{fein:bk.lod()>1}),MAT.get('palette')); pa.rotation.y=Math.PI/2; g.add(pa);
  boxes.forEach((b,i)=>{ const m=bk.karton(b.t); m.rotation.y=Math.PI/2; m.position.set(-0.2+(i%2)*0.4,bk.PALETTE.euro.h+0.2+Math.floor(i/4)*0.41,-0.3+(Math.floor(i/2)%2)*0.6); g.add(m); });
  g.userData.bauteil='ladung'; g.traverse(o=>{ if(o.isMesh) o.castShadow=false; }); LL_D.add(g); return g; }
function hrLadungWeg(l){ if(l&&l.g){ l.g.parent&&l.g.parent.remove(l.g); l.g=null; } const D=hrDaten(), i=D.tr.indexOf(l.d); if(i>=0) D.tr.splice(i,1); }

/* FTS: faehrt eine Punktliste ab (Drehen auf der Stelle, dann gerade) */
function ftsFahre(f,dt){
  const P=f.weg; if(!P||!P.length) return true;
  const g=f.g, z=P[0], dx=z.x-g.position.x, dz=z.z-g.position.z, d=Math.hypot(dx,dz);
  if(d<0.04){ P.shift(); return !P.length; }
  const ry=Math.atan2(-dz,dx); let a=ry-g.rotation.y; while(a>Math.PI) a-=2*Math.PI; while(a<-Math.PI) a+=2*Math.PI;
  /* fahrt rueckwaerts, wenn das kuerzer ist (FTS faehrt in beide Richtungen) */
  if(Math.abs(a)>Math.PI/2){ a+=a>0?-Math.PI:Math.PI; }
  if(Math.abs(a)>0.03){ g.rotation.y+=Math.sign(a)*Math.min(Math.abs(a),2.2*dt); return false; }
  const s=Math.min(d,HR_TEMPO.fts*dt); g.position.x+=dx/d*s; g.position.z+=dz/d*s;
  if(f.last&&f.last.g){ f.last.g.position.set(g.position.x,f.deck.position.y+0.03,g.position.z); f.last.g.rotation.y=g.rotation.y; }
  return false;
}
function ftsWeg(f,ziel){ const g=f.g, a=V(g.position.x,0,g.position.z), b=V(ziel.x,0,ziel.z);
  let w=null; try{ w=route(a,b); }catch(e){} return (w&&w.length?w.map(p=>({x:p.x,z:p.z})):[]).concat([{x:b.x,z:b.z}]); }

/* FTS 1: Einlagern. Waehlt den vordersten beladenen Stellplatz (Tor ohne laufende Entladung oder Palette voll). */
function ftsEinJob(){
  const Z=llStellZustand(); let best=-1, bn=0;
  LL_STELL.forEach((p,i)=>{ const n=Z[i].n; if(!n) return;
    if(LL_STELL.some(q=>q.tor===p.tor&&q.s===p.s&&q.r>p.r&&Z[LL_STELL.indexOf(q)].n>0)) return;   /* davor steht noch eine */
    const entlaedt=typeof wbays!=='undefined'&&wbays[p.tor]&&wbays[p.tor].state==='entladen';
    if(entlaedt&&n<HR_JE_PALETTE) return;
    if(n>bn){ bn=n; best=i; } });
  return best;
}
function ftsTick(f,dt){
  const j=f.job, g=f.g;
  if(!j){
    /* untaetig: hoechstens zweimal je Sekunde nach Arbeit suchen (Stellplaetze/Regale durchsuchen kostet) */
    if(f.weg&&ftsFahre(f,dt)) f.weg=null;
    if((f.warte=(f.warte||0)-dt)>0) return; f.warte=0.5;
    if(f.i===0){ if(hrFreiPlatz()<0) return; const i=ftsEinJob(); if(i<0){ if(Math.hypot(g.position.x+44.5,g.position.z-LL.spur)>0.3&&!f.weg){ f.weg=[{x:g.position.x,z:LL.spur},{x:-44.5,z:LL.spur}]; } return; }
      const p=LL_STELL[i]; f.job={art:'ein',stell:i,schritt:0}; f.weg=[{x:g.position.x,z:LL.spur},{x:p.x,z:LL.spur},{x:p.x,z:p.z}]; llStellSicht(); return; }
    /* FTS 2: Nachschub aus dem Anbruch nach ③/②/① */
    const n=hrNachschubPlan(); if(!n){ if(!f.weg&&Math.hypot(g.position.x+43.0,g.position.z+16.2)>0.4) f.weg=ftsWeg(f,{x:-43.0,z:-16.2}); return; }
    f.job={art:'nach',plan:n,schritt:0}; f.weg=ftsWeg(f,n.von); return; }
  if(j.art==='ein'){
    if(j.schritt===0){ if(!ftsFahre(f,dt)) return;
      const p=LL_STELL[j.stell], bx=llStellBoxen(p).filter(b=>!hrStaffBelegt(b));
      const boxes=bx.map(b=>({t:b.type,c:b.count,q:b.q||1})); bx.forEach(b=>removeFloorBox(b));
      if(!boxes.length){ f.job=null; llStellSicht(); return; }
      const d={b:boxes}; hrDaten().tr.push(d); f.last={d,g:hrLadung(boxes)}; f.set(1);
      j.schritt=1; f.weg=[{x:p.x,z:LL.spur},{x:LL.aufgabe.x+1.05,z:LL.spur}]; llStellSicht(); return; }
    if(j.schritt===1){ if(!ftsFahre(f,dt)) return; j.schritt=2; j.t=0; return; }
    /* Querfoerdern vom FTS auf den Aufgabe-Foerderer, dann Foerderer bis an die Gasse */
    if(j.schritt===2){ const l=f.last.g; j.t+=dt; const u=Math.min(1,j.t/1.4);
      l.position.set(LL.aufgabe.x+1.05*(1-u),0.55*u+0.33*(1-u),LL.spur); l.rotation.y=Math.PI*0; if(u<1) return;
      f.set(0); HR.band=HR.band||[]; HR.band.push({l:f.last,z:LL.spur}); f.last=null; f.job=null; return; }
  }
  if(j.art==='nach'){
    if(j.schritt===0){ if(!ftsFahre(f,dt)) return;
      /* Kartons aus dem Anbruch auf das Deck */
      const boxes=[]; for(const s of j.plan.slots){ if(!s.box) continue; boxes.push({t:s.box.type,c:s.box.count,q:s.box.q||1}); kisteZurueck(s.box); s.rk.g.remove(s.box.mesh); s.box=null; drawRackSchild(s.rk); }
      if(!boxes.length){ f.job=null; return; }
      const d={b:boxes}; hrDaten().tr.push(d); f.last={d,g:hrLadung(boxes)}; f.last.g.children[0].visible=false; f.set(1);
      j.schritt=1; f.weg=ftsWeg(f,j.plan.nach); return; }
    if(j.schritt===1){ if(!ftsFahre(f,dt)) return;
      const rk=j.plan.rk; let k=0; const D=f.last.d.b;
      for(const s of rk.slots){ if(!D.length) break; if(s.box) continue; const b=D.shift(); putInSlot(s,b.t,b.c,b.q); k++; }
      if(D.length) hrAufBoden(D.splice(0));
      HR.zahl.nach++; hrLadungWeg(f.last); f.last=null; f.set(0); f.job=null; return; }
  }
}
/* Nachschub: Kartons im Anbruch, die gerade keine offene Bestellung braucht, in ein Lagerregal ①②③ mit Platz */
function hrAnbruchRacks(){ const a=LL.anbruch; return racks.filter(r=>{ const p=r.g.position; return p.x>a.x0&&p.x<a.x1&&p.z>a.z0&&p.z<a.z1; }); }
function hrLagerRacks(){ return racks.filter(r=>{ const p=r.g.position; return p.x>-36.2&&p.x<-8&&p.z>-17.2&&p.z<6; }); }
/* Nachschub fuellt nur ③ (am Weg vom Anbruch) und laesst im Lager immer Platz fuer eine Lieferung an Rolltor 1
   (HR_RESERVE freie Faecher) - sonst stuende der LKW an der Basisrampe, bis jemand Platz schafft (gemessen 14.10.:
   Vorfuehrung, Versandmaterial kam nicht mehr ins Packmaterial-Regal) */
const HR_RESERVE=18;
function hrNachschubRacks(){ return racks.filter(r=>{ const p=r.g.position; return p.x>-36.2&&p.x<-19.9&&p.z>-17.2&&p.z<-6.8; }); }
function hrStaffBelegt(s){ return Object.values(staff).some(o=>o&&o.src&&(o.src.slot===s||o.src.box===s)); }
function hrNachschubPlan(){
  const A=hrAnbruchRacks(); if(!A.length) return null;
  const freiGesamt=hrLagerRacks().reduce((n,r)=>n+r.slots.filter(s=>!s.box).length,0);
  if(freiGesamt<=HR_RESERVE) return null;
  const ziel=hrNachschubRacks().map(r=>({r,frei:r.slots.filter(s=>!s.box).length})).filter(x=>x.frei>0);
  if(!ziel.length) return null;
  const IM={}; for(const r of hrLagerRacks()) for(const s of r.slots) if(s.box) IM[s.box.type]=(IM[s.box.type]||0)+s.box.count;
  for(const lv of allLevels()) if(lv.type) IM[lv.type]=(IM[lv.type]||0)+lv.count;
  const im=t=>IM[t]||0;
  const kand=[]; for(const r of A) for(const s of r.slots) if(s.box&&!hrStaffBelegt(s)&&!(typeof vsReserviert==='function'&&vsReserviert(s.box.type)>0)) kand.push(s);
  if(kand.length<2) return null;
  kand.sort((a,b)=>im(a.box.type)-im(b.box.type));
  const z=ziel.sort((a,b)=>b.frei-a.frei)[0], slots=kand.slice(0,Math.min(4,z.frei,freiGesamt-HR_RESERVE));
  if(!slots.length) return null;
  const rk=z.r, sn=Math.sin(rk.g.rotation.y), cs=Math.cos(rk.g.rotation.y), K=rackKindOf(rk), lz=K.zo+0.75;
  const von=slots[0].rk.g.position, vy=slots[0].rk.g.rotation.y;
  return {slots,rk,von:{x:von.x+Math.sin(vy)*(K.zo+0.75),z:von.z+Math.cos(vy)*(K.zo+0.75)},nach:{x:rk.g.position.x+sn*lz,z:rk.g.position.z+cs*lz}};
}

/* ---------- RBG ----------
   Jobs: 'ein' (Palette vom Aufgabe-Foerderer an einen freien Platz), 'aus' (Platz -> Auslager-Foerderer -> Anbruch). */
function rbgTick(R,dt){
  const k=R.k, G=LL_T.gassen[k], P=LL_T.hr.plaetze, D=hrDaten(), ax=LL.aufgabe.x, aisle=G.R.mitte;
  if(!R.job){
    /* Einlagern hat Vorrang, sobald eine Palette am Ende des Aufgabe-Foerderers steht (Gasse 1 bedient die Aufgabe) */
    const bereit=k===0&&HR.band&&HR.band.find(b=>b.z>=LL.aufgabe.z1-0.02);
    if(bereit){ const i=hrFreiPlatz(); if(i>=0&&Math.floor(i/180)===k){ HR.reserv=HR.reserv||{}; HR.reserv[i]=true; R.job={art:'ein',platz:i,l:bereit.l,schritt:0}; HR.band.splice(HR.band.indexOf(bereit),1); } }
    else if(k===0&&!HR.aus&&(HR.anbruchT-=dt)<=0){ HR.anbruchT=2.5; const j=hrAuslagerPlan(); if(j){ R.job=j; HR.reserv=HR.reserv||{}; HR.reserv[j.platz]=true; } }
    if(!R.job) return; }
  const j=R.job, g=R.g, hub=R.hub, gab=R.gabel;
  const fahr=(x,y)=>{ g.position.x=hrNach(g.position.x,x,HR_TEMPO.fahr,dt); hub.position.y=hrNach(hub.position.y,y,HR_TEMPO.hub,dt); return Math.abs(g.position.x-x)<0.005&&Math.abs(hub.position.y-y)<0.005; };
  const gabel=z=>{ gab.position.z=hrNach(gab.position.z,z,HR_TEMPO.gabel,dt); return Math.abs(gab.position.z-z)<0.004; };
  const traeg=()=>{ if(j.l&&j.l.g){ const wp=new THREE.Vector3(); gab.getWorldPosition(wp); j.l.g.position.set(wp.x,wp.y+0.065,wp.z); j.l.g.rotation.y=0; } };
  const p=j.platz>=0?P[j.platz]:null, pz=p?p.z-aisle:0, py=p?Math.max(0,p.y-0.06):0;
  const ioY=0.55-0.08;
  if(j.art==='ein'){
    switch(j.schritt){
      case 0: if(fahr(ax,ioY)) j.schritt=1; break;
      case 1: if(gabel(LL.aufgabe.z1-aisle)) j.schritt=2; break;                        /* Gabel unter die Palette */
      case 2: if(fahr(ax,ioY+0.12)){ j.schritt=3; } traeg(); break;
      case 3: traeg(); if(gabel(0)) j.schritt=4; break;
      case 4: traeg(); if(fahr(p.x,py+0.16)) j.schritt=5; break;
      case 5: traeg(); if(gabel(pz)) j.schritt=6; break;
      case 6: traeg(); if(fahr(p.x,py)){ D.p[j.platz]=j.l.d.b; delete HR.reserv[j.platz]; hrLadungWeg(j.l); hrSync(); j.l=null; j.schritt=7; HR.zahl.ein++; } break;
      case 7: if(gabel(0)){ R.job=null; } break; }
    return; }
  if(j.art==='aus'){
    switch(j.schritt){
      case 0: if(fahr(p.x,py)) j.schritt=1; break;
      case 1: if(gabel(pz)) j.schritt=2; break;
      case 2: if(fahr(p.x,py+0.16)){ const b=D.p[j.platz]; D.p[j.platz]=null; delete HR.reserv[j.platz]; const d={b}; D.tr.push(d); j.l={d,g:hrLadung(b)}; hrSync(); j.schritt=3; } traeg(); break;
      case 3: traeg(); if(gabel(0)) j.schritt=4; break;
      case 4: traeg(); if(fahr(ax,ioY+0.16)) j.schritt=5; break;
      case 5: traeg(); if(gabel(LL.auslager.z-aisle)) j.schritt=6; break;
      case 6: traeg(); if(fahr(ax,ioY)){ HR.aus={l:j.l,x:j.l.g.position.x,t:0}; j.l=null; j.schritt=7; HR.zahl.aus++; } break;
      case 7: if(gabel(0)){ R.job=null; } break; }
  }
}
/* Auslagern in den Anbruch: Platz mit der Sorte, die am dringendsten fehlt, wenn im Anbruch genug Faecher frei sind */
function hrAuslagerPlan(){
  const A=hrAnbruchRacks(); if(!A.length) return null;
  const frei=A.reduce((n,r)=>n+r.slots.filter(s=>!s.box).length,0); if(frei<1) return null;
  const D=hrDaten(), P=hrPlaetze(0); if(!P.length) return null;
  const imLager=t=>stockOf(t)-hrStock(t);
  let best=-1, bw=1e9;
  for(let i=0;i<P.length;i++){ const b=D.p[i]; if(!b||!b.length||(HR.reserv&&HR.reserv[i])||b.length>frei) continue;
    const t=b[0].t, offen=typeof vsReserviert==='function'?vsReserviert(t):0;
    const w=imLager(t)-offen*3+P[i].y*0.5;
    if(w<bw){ bw=w; best=i; } }
  if(best<0) return null;
  /* nur auslagern, wenn die Sorte knapp ist oder der Anbruch fast leer */
  const t=D.p[best][0].t, knapp=imLager(t)<P_box(t)*2||(typeof vsReserviert==='function'&&vsReserviert(t)>0);
  const anbruchLeer=A.reduce((n,r)=>n+r.slots.filter(s=>s.box).length,0)<6;
  if(!knapp&&!anbruchLeer) return null;
  return {art:'aus',platz:best,schritt:0};
}
function P_box(t){ return (P[t]&&P[t].box)||1; }
/* Auslager-Foerderer: Palette laeuft ans Ende, Kartons wandern einzeln in freie Anbruch-Faecher */
function hrAusTick(dt){
  const a=HR.aus; if(!a||!a.l||!a.l.g) return;
  const l=a.l.g, xe=LL.auslager.x1-0.45;
  if(l.position.x<xe-0.005){ l.position.x=hrNach(l.position.x,xe,HR_TEMPO.foerder,dt); l.position.y=0.55; l.position.z=LL.auslager.z; return; }
  a.t-=dt; if(a.t>0) return; a.t=0.45;
  const D=a.l.d.b; if(!D.length){ hrLadungWeg(a.l); HR.aus=null; return; }
  const s=hrAnbruchRacks().flatMap(r=>r.slots).find(s=>!s.box);
  if(!s){ return; }
  const b=D.shift(); putInSlot(s,b.t,b.c,b.q);
  const m=l.children[1+D.length]; if(m) m.visible=false;
  if(!D.length){ hrLadungWeg(a.l); HR.aus=null; }
}
/* Aufgabe-Foerderer: Paletten laufen von der Fahrspur bis an die Gasse */
function hrBandTick(dt){
  if(!HR.band) return;
  HR.band.forEach((b,i)=>{ const vor=HR.band.slice(0,i).filter(o=>o.z>b.z).map(o=>o.z-1.3), ziel=Math.min(LL.aufgabe.z1,...vor);
    b.z=hrNach(b.z,ziel,HR_TEMPO.foerder,dt); if(b.l.g) b.l.g.position.set(LL.aufgabe.x,0.55,b.z); });
}
/* Schnelllauftor N1: oeffnet, sobald jemand in 3 m Naehe ist */
function hrN1Tick(dt){
  const T=LL_T&&LL_T.n1; if(!T) return;
  const nah=(x,z)=>Math.abs(x+36)<3.2&&Math.abs(z+12)<2.6;
  let auf=nah(pl.x,pl.z)||HR.fts.some(f=>nah(f.g.position.x,f.g.position.z));
  if(!auf) for(const w of Object.values(staff)) if(w&&w.g&&nah(w.g.position.x,w.g.position.z)){ auf=true; break; }
  if(!auf&&typeof customers!=='undefined') for(const c of customers) if(c.g&&nah(c.g.position.x,c.g.position.z)){ auf=true; break; }
  LL_T.n1t=hrNach(LL_T.n1t,auf?1:0,auf?1.6:0.7,dt); T.set(LL_T.n1t);
}
function hrTick(dt){
  if(!LL_T||!LL_G||!LL_G.visible||!S) return;   /* laeuft auch, wenn der Halleninhalt gerade nicht gezeichnet wird */
  HR.tick+=dt;
  for(const R of HR.rbg) if(R&&R.g.visible) rbgTick(R,dt);
  for(const f of HR.fts) ftsTick(f,dt);
  hrBandTick(dt); hrAusTick(dt); hrN1Tick(dt); llTuerTakt(dt);
  /* Lichtbaender: Tageslicht */
  if(LL_T.lichtband&&typeof sun!=='undefined'){ const v=Math.max(0.05,Math.min(1,sun.intensity/1.6)); LL_T.lichtband.material.emissiveIntensity=0.15+0.85*v; }
}
/* ---------- Umzug beim Kauf: Lagerregale, Moebel und Kartons aus den belegten Bereichen ----------
   Lagerregale ziehen auf freie Plaetze (③ zuerst, sonst ①/②); findet sich keiner, kommt ihr Inhalt ins
   Hochregal und das Regal wird abgebaut (Kaufpreis ueber den Moebel-Abbau wie sonst). Kartons am Boden der
   Sperrflaechen gehen auf die Stellplaetze (das FTS lagert sie ein). Einmal je Kauf, danach nichts mehr. */
function llRaeumen(){
  if(!llOffen()) return 0;
  const R=llSperrRechtecke(), drin=r=>R.some(a=>r.x0<a.x1-0.02&&r.x1>a.x0+0.02&&r.z0<a.z1-0.02&&r.z1>a.z0+0.02);
  let n=0;
  /* Anbruch: 5 Lagerregale am I/O (einmal, mit dem Kauf) */
  const D=hrDaten();
  for(const rk of racks.slice()){ const K=rackKindOf(rk), g=rk.g, q=rackRect(K,g.position.x,g.position.z,g.rotation.y);
    const a=LL.anbruch; if(g.position.x>a.x0&&g.position.x<a.x1&&g.position.z>a.z0&&g.position.z<a.z1) continue;   /* Anbruch selbst */
    if(!drin(q)) continue;
    const frei=rackPlatzFrei(K,rk).filter(sl=>{ const p=rackStellPlatz(K,sl); if(!p) return false; return !drin(rackRect(K,p.x,p.z,p.ry)); });
    if(frei.length){ let best=frei[0], bd=1e9; for(const sl of frei){ const d=(sl.x-g.position.x)**2+(sl.z-g.position.z)**2; if(d<bd){ bd=d; best=sl; } }
      const p=rackStellPlatz(K,best); placeMovable(rk.mov,p.x,p.z,p.ry); rk.slot=best; n++; continue; }
    /* kein Platz: Inhalt ins Hochregal, Regal abbauen */
    const boxes=[]; for(const s of rk.slots) if(s.box){ boxes.push({t:s.box.type,c:s.box.count,q:s.box.q||1}); s.rk.g.remove(s.box.mesh); s.box=null; }
    while(boxes.length){ const i=hrFreiPlatz(); const b=boxes.splice(0,HR_JE_PALETTE); if(i>=0) D.p[i]=b; else hrAufBoden(b); }
    if(typeof removeRack==='function'){ try{ removeRack(rk); }catch(e){} } n++; }
  if(!S.ll||!S.ll.anbruch){ S.ll=Object.assign({},S.ll,{anbruch:true});
    for(const z of [-26.6,-23.9,-21.2,-18.5,-15.8]) createRack(racks.length,{kind:'standard',x:-45.0,z,ry:Math.PI/2}); }
  /* Moebel und Kartons am Boden in den Sperrflaechen */
  for(const m of movables.slice()){ if(!m.g||m.g.visible===false||m.kind==='rack'||m.kind==='desk') continue;
    const r=rectOf(m,m.g.position.x,m.g.position.z,m.g.rotation.y); if(!drin({x0:r.minX,x1:r.maxX,z0:r.minZ,z1:r.maxZ})) continue;
    for(let rr=1;rr<20;rr+=0.5){ let ok=false; for(let a=0;a<16&&!ok;a++){ const x=m.g.position.x+Math.cos(a/16*Math.PI*2)*rr, z=m.g.position.z+Math.sin(a/16*Math.PI*2)*rr, q=rectOf(m,x,z,m.g.rotation.y);
        if(drin({x0:q.minX,x1:q.maxX,z0:q.minZ,z1:q.maxZ})) continue; if(spotFree(m,x,z,m.g.rotation.y)){ placeMovable(m,x,z,m.g.rotation.y); ok=true; n++; } } if(ok) break; } }
  for(const b of floorBoxes.slice()){ const p=b.mesh.position; if(LL_STELL.some(q=>Math.abs(p.x-q.x)<0.5&&Math.abs(p.z-q.z)<0.62)) continue;
    if(!drin({x0:p.x-0.3,x1:p.x+0.3,z0:p.z-0.3,z1:p.z+0.3})) continue;
    const i=hrFreiPlatz(); if(i<0) continue; D.p[i]=[{t:b.type,c:b.count,q:b.q||1}]; removeFloorBox(b); n++; }
  hrSync(); llStellSicht(); if(typeof navDirty==='function') navDirty();
  if(n) toast(`${n} Sache${n===1?'':'n'} aus der Halle umgestellt – Lagerregale stehen jetzt in ③, Kartons im Hochregal.`);
  return n;
}
