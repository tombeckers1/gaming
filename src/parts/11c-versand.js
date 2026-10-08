/* =========================================================
   Versand mit Kommissionierwagen (Tom, 25.09.): Onlinebestellungen
   haben einen Inhalt. Der Versandmitarbeiter schiebt einen Rollwagen
   mit sechs Faechern durchs Lager - und wenn dort nichts liegt, durch
   den Laden -, stellt fuer jede Bestellung einen offenen Karton auf
   den Wagen und legt jedes Stueck einzeln hinein. Am Packtisch gehen
   die Klappen zu, Klebeband drueber, Etikett drauf.
     klein  - ein Fach,  sechs passen auf den Wagen
     gross  - eine Reihe aus drei Faechern, also zwei je Tour
     riesig - der ganze Wagen, eines je Tour
   Seit 05.10. (Tom): bis zu drei Packplaetze an einem Foerderband.
   Das Paket wird vom Tisch eben aufs Band geschoben, laeuft bis zum
   Endanschlag der Staurollenbahn, und ein Portalgreifer setzt es auf
   eine Palette. Jedes Paket liegt dabei immer auf etwas: Tisch, Band,
   Greifer, Palette oder Paket darunter. Kartons, Folie und Klebeband
   kommen aus dem Packmaterial-Regal am Platz (11d-packmaterial.js).
   ========================================================= */
const VS_GR={
  1:{id:1,name:'klein', felder:1,x:0.28,z:0.26,h:0.20,vmax:8,  mass:0.30,zeilen:2,stueck:4,lage:12},
  3:{id:3,name:'groß',  felder:3,x:0.29,z:0.86,h:0.28,vmax:35, mass:0.86,zeilen:3,stueck:6,lage:4},
  6:{id:6,name:'riesig',felder:6,x:0.62,z:0.86,h:0.40,vmax:120,mass:0.86,zeilen:2,stueck:3,lage:2}};
/* Platzkoordinaten (05h ppW): Tischmitte 0/0, +z zum Packer. Der Wagen
   parkt links vor dem Tisch, der Griff zeigt zum Packer; der Packer
   steht rechts davor. */
const WG_PARK={x:-0.5,z:0.99,ry:-Math.PI/2}, WG_Y=0.78, WG_ABST=0.845, WG_GRIFF={x:-0.5+0.845,z:0.99};
const VS_HEIM={x:0.5,z:0.83};
/* Wo das Paket auf dem Tisch zugeklebt wird */
const VS_TISCH={x:0,z:0};
/* Paletten der aktuellen Stufe (packStufeAnwenden) und Stapelhoehe */
/* 07.10. (Tom: "Paletten hoeher stapeln"): 1,75 m Stapel ueber der Palette, oben 1,89 m - unter dem
   Greifer (Unterkante beim Ueberfahren 2,02 m) und durch Tor und LKW (3 m) */
const VS_FELD=[], VS_HMAX=1.75;
/* Lagenbilder fuer eine Palette mit 0,8 m in x und 1,2 m in z; die
   Paletten der Station liegen quer (1,2 m in x) - vsStapel tauscht x
   und z, die lange Paketkante (G.z) liegt dann in z */
const VS_MUSTER={
  1:{n:12,pos:k=>({x:(k%3-1)*0.27,z:(Math.floor(k/3)-1.5)*0.295})},
  3:{n:4, pos:k=>({x:0,z:(k-1.5)*0.3})},
  6:{n:2, pos:k=>({x:0,z:(k-0.5)*0.625})}};
/* Band und Portal */
/* VS_YFREI: Unterkante beim Ueberfahren - ueber das Packmaterial-Regal am Bandende */
const VS_V=0.6, VS_YFREI=2.02, VS_YRUHE=2.1;
let versandT=0;
const vsBahn=[];      /* Pakete auf dem Band, am Tisch und im Greifer */
const vsPlaetze=[];   /* je Packplatz: {i,wagen,tisch} */
const vsPortal={phase:'ruhe',x:BAND.x0+0.4,y:VS_YRUHE,z:BAND.z,t:0,von:null,nach:null,e:null,ziel:null};
const _vp=new THREE.Vector3(), _vq=new THREE.Quaternion(), _vq2=new THREE.Quaternion(), _vs=new THREE.Vector3(), _vY=new THREE.Vector3(0,1,0);
const vsGlatt=t=>{ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
function vsWinkel(a,b,t){ let d=b-a; while(d>Math.PI) d-=Math.PI*2; while(d<-Math.PI) d+=Math.PI*2; return a+d*t; }
function vsAktiv(){ return packStufe(); }
function vsPlatzVon(w){ return w&&w.id==='packer3'?2:w&&w.id==='packer2'?1:0; }
const VS_PACKER=['packer','packer2','packer3'];
/* Punkt am Packplatz i (Platzkoordinaten) in Weltkoordinaten, und ein
   Winkel am Platz als Weltwinkel */
function vsWelt(i,x,z){ const p=ppW(i,x,z); return localToWorld(packTisch,p.x,p.z); }
function vsRy(i,ry){ return packTisch.rotation.y+ppRy(i,ry); }

/* ---------------------------------------------------------
   Versandkosten (Tom, 05.10.): der Spieler stellt im Onlineshop ein,
   was der Kunde fuer den Versand zahlt und ab welchem Bestellwert es
   nichts kostet. Hohe Versandkosten schrecken ab, eine niedrige
   Freigrenze lockt - und zieht die Bestellungen ueber die Grenze.
   Das Porto an DDL zahlst du fuer jedes Paket.
   --------------------------------------------------------- */
const VS_CFG_STD={kosten:4.9,frei:50};
const VS_PORTO={1:3.9,3:5.4,6:8.9};
function vsCfg(){
  if(!S) return VS_CFG_STD;
  const c=S.versandCfg||(S.versandCfg={kosten:VS_CFG_STD.kosten,frei:VS_CFG_STD.frei});
  c.kosten=clamp(Math.round((+c.kosten||0)*10)/10,0,12.9); if(!isFinite(c.kosten)) c.kosten=VS_CFG_STD.kosten;
  c.frei=c.frei===0?0:clamp(Math.round(+c.frei||VS_CFG_STD.frei),15,200);
  return c;
}
/* Nachfragefaktor: 1 bei 4,90 EUR und frei ab 50 EUR */
function vsNachfrage(){
  const c=vsCfg(), q=c.frei>0?clamp((100-c.frei)/80,0,1):0;
  return clamp(1.6*Math.exp(-0.13*c.kosten)*(1+0.35*q),0.3,1.6);
}
function vsGebuehr(wert){ const c=vsCfg(); return c.frei>0&&wert>=c.frei?0:c.kosten; }

/* ---------------------------------------------------------
   Bestellungen
   --------------------------------------------------------- */
function paketWert(){
  const L=(S&&S.bestellungen)||[];
  if(L.length) return r2(L.reduce((a,b)=>a+b.wert,0)/L.length);
  return r2(12+S.level*0.6);
}
/* Mehr Packplaetze, mehr Bestellungen: der Shop nimmt an, was die
   Station schaffen kann */
const VS_STUFE_MUL=[1,1,1.45,1.9];
function bestellungenProTag(){
  if(!packBereit()) return 0;
  const basis=Math.max(4,Math.min(22,Math.round(4+S.rep*0.12+S.level*0.35)));
  return Math.max(1,Math.round(basis*VS_STUFE_MUL[packStufe()]*vsNachfrage()));
}
/* Rauminhalt mit etwas Luft fuer Polster, laengste Kante */
function vsVol(t){ const d=P[t].dims; return d[0]*d[1]*d[2]*1000*1.3; }
function vsMass(t){ const d=P[t].dims; return Math.max(d[0],d[1],d[2]); }
function vsKlasse(pos){
  let V=0, M=0; for(const l of pos){ V+=vsVol(l.t)*l.n; M=Math.max(M,vsMass(l.t)); }
  if(V<=VS_GR[1].vmax&&M<=VS_GR[1].mass) return 1;
  if(V<=VS_GR[3].vmax&&M<=VS_GR[3].mass) return 3;
  return 6;
}
/* Online zahlt der Kunde den Regalpreis, hoechstens aber 30 Prozent
   ueber Markt - sonst waere der Onlineshop ein Weg, Mondpreise
   ohne jede Kaufzurueckhaltung zu kassieren. */
function vsPreis(t){ return r2(Math.min(S.prices[t]||marketOf(t),marketOf(t)*1.3)); }
function vsWertVon(pos){ return r2(pos.reduce((a,l)=>a+l.n*vsPreis(l.t),0)); }
function vsStueck(b){ return b.pos.reduce((a,l)=>a+l.n,0); }
function vsFehlt(b){ return b.pos.reduce((a,l)=>a+Math.max(0,l.n-l.g),0); }
function vsText(b){ return b.pos.map(l=>`${l.n}× ${P[l.t].short}`).join(', '); }
function vsSync(){ if(!S) return; S.bestellungen=S.bestellungen||[]; S.offen=S.bestellungen.length; }
/* Test-Kartons der Feuerwerk-Teststation gehoeren nicht zur Ware */
function vsTestKarton(b){ return !!b.test||(typeof fwTestBoxen!=='undefined'&&fwTestBoxen.indexOf(b)>=0); }
function vsBelegt(x){ return [staff.auffueller,staff.auffueller2].some(o=>o&&o.src&&(o.src.box===x||o.src.slot===x)); }
function vsOnline(t){ return !!P[t]&&!P[t].noShelf&&!P[t].noOrder&&isUnlocked(t); }
/* Alles, woraus der Versand ein Stueck nehmen darf: Lagerregal und
   Karton am Boden zuerst, dann das Verkaufsregal. Kartons fuer einen
   laufenden Grossauftrag bleiben unangetastet. */
/* Erreichbarkeit (06.10.): in der Vorfuehrung standen Lagerfaecher, an
   die kein Weg fuehrte - der Packer lief bis an die naechste Stelle davor
   und blieb dort fuer immer stehen ("pickt im Lager 1/2"). Jetzt zaehlt
   nur, wovor er sich auch stellen kann. Einmal je Neubau des Wegrasters
   wird ab dem Packplatz geflutet. */
let _vsZugang=null;
function vsZugang(){
  if(typeof NAV==='undefined'||!packTisch) return null;
  if(NAV.dirty) navBuild();
  if(_vsZugang&&_vsZugang.nr===NAV.nr&&_vsZugang.px===packTisch.position.x&&_vsZugang.pz===packTisch.position.z&&_vsZugang.st===packStufe()) return _vsZugang.g;
  const W=NAV.w, H=NAV.h, out=new Uint8Array(W*H), h=vsWelt(0,VS_HEIM.x,VS_HEIM.z), s0=navNah(h.x,h.z);
  if(s0>=0){ out[s0]=1; const Q=[s0]; let k=0;
    while(k<Q.length){ const c=Q[k++], i=c%W, r=(c-i)/W;
      for(const n of [i>0?c-1:-1,i<W-1?c+1:-1,r>0?c-W:-1,r<H-1?c+W:-1]) if(n>=0&&!NAV.g[n]&&!out[n]){ out[n]=1; Q.push(n); } } }
  _vsZugang={nr:NAV.nr,px:packTisch.position.x,pz:packTisch.position.z,st:packStufe(),g:out};
  return out;
}
function vsErreicht(x,z){ const g=vsZugang(); if(!g) return true; const id=navIdx(x,z); return id>=0&&!NAV.g[id]&&!!g[id]; }
/* Stand vor einem Lagerfach: zuerst mittig 0,62 m vor der Front, sonst
   etwas weiter weg oder seitlich versetzt - null, wenn nichts davon
   erreichbar ist */
function vsRackStand(s){
  const K=rackKindOf(s.rk);
  for(const lz of [0.62,0.85,1.1]) for(const dx of [0,-0.35,0.35]){
    const p=localToWorld(s.rk.g,s.x+dx,K.zo+lz); if(vsErreicht(p.x,p.z)) return p; }
  return null;
}
function vsBodenStand(b,T){
  const m=b.mesh.position; let best=null,bd=1e9;
  for(const r of [0.75,1.05]) for(let k=0;k<8;k++){ const a=k*Math.PI/4, x=m.x+Math.sin(a)*r, z=m.z+Math.cos(a)*r;
    if(!vsErreicht(x,z)) continue; const d=T?Math.hypot(x-T.x,z-T.z):r; if(d<bd){ bd=d; best=V(x,0,z); } }
  return best;
}
function vsQuellen(t){
  const L=[];
  if(!(typeof reservedType==='function'&&reservedType(t))){
    for(const r of racks) for(const s of r.slots) if(s.box&&s.box.type===t&&s.box.count>0&&!vsBelegt(s)&&vsRackStand(s)) L.push({kind:'rack',ref:s,n:s.box.count,lager:true});
    for(const b of floorBoxes) if(b.type===t&&b.count>0&&!vsTestKarton(b)&&!vsBelegt(b)&&vsBodenStand(b)) L.push({kind:'floor',ref:b,n:b.count,lager:true});
  }
  for(const lv of allLevels()) if(lv.type===t&&lv.count>0) L.push({kind:'level',ref:lv,n:lv.count,lager:false});
  return L;
}
function vsBestand(t){ return vsQuellen(t).reduce((a,q)=>a+q.n,0); }
function vsReserviert(t){ let n=0; for(const b of (S.bestellungen||[])) for(const l of b.pos) if(l.t===t) n+=Math.max(0,l.n-l.g); return n; }
/* Eine neue Bestellung aus dem, was da ist. erz=true: auch ohne
   Ware (alte Spielstaende, die nur eine Zahl kannten). */
function vsNeueBestellung(erz){
  const frei={}; const f=t=>frei[t]!==undefined?frei[t]:(frei[t]=vsBestand(t)-vsReserviert(t));
  const kand=ORDER.filter(t=>vsOnline(t)&&(erz||f(t)>0));
  if(!kand.length) return null;
  const r=Math.random(), spaet=S.level>=22;
  let ziel=r<(spaet?0.5:0.68)?1:r<(spaet?0.85:0.94)?3:6;
  while(ziel){
    const K=VS_GR[ziel], k2=kand.filter(t=>vsVol(t)<=K.vmax&&vsMass(t)<=K.mass);
    const unten=ziel===1?0:ziel===3?VS_GR[1].vmax:VS_GR[3].vmax;
    const soll=unten+(K.vmax-unten)*rand(0.35,0.95);
    const pos=[]; let V=0;
    for(let v=0;v<12&&pos.length<K.zeilen&&V<soll&&k2.length;v++){
      const t=k2[Math.floor(Math.random()*k2.length)];
      if(pos.some(l=>l.t===t)) continue;
      const platz=Math.floor((K.vmax-V)/vsVol(t)), da=erz?99:f(t);
      const max=Math.min(K.stueck,platz,da); if(max<1) continue;
      const n=1+Math.floor(Math.random()*Math.min(max,Math.max(1,Math.ceil((soll-V)/vsVol(t)))));
      pos.push({t,n,g:0}); V+=n*vsVol(t); if(!erz) frei[t]-=n;
    }
    if(pos.length&&(ziel===1||V>unten||pos.some(l=>vsMass(l.t)>VS_GR[ziel===3?1:3].mass))){
      /* Knapp unter der Versandfreigrenze legt mancher Kunde noch etwas
         dazu, damit der Versand nichts kostet */
      const cf=vsCfg();
      if(cf.frei>0&&Math.random()<0.6){
        for(let n=0;n<4&&vsWertVon(pos)<cf.frei&&vsWertVon(pos)>=cf.frei*0.7;n++){
          const l=pos[Math.floor(Math.random()*pos.length)], vol=pos.reduce((a,x)=>a+x.n*vsVol(x.t),0)+vsVol(l.t);
          if(vol>VS_GR[6].vmax||(!erz&&f(l.t)<1)) break;
          l.n++; if(!erz) frei[l.t]--; }
      }
      const wert=vsWertVon(pos);
      S.bestNr=(S.bestNr|0)+1;
      return {id:S.bestNr,pos,gr:vsKlasse(pos),wert,versand:vsGebuehr(wert),st:'offen',tag:S.day};
    }
    ziel=ziel===6?3:ziel===3?1:0;
  }
  return null;
}
/* Frueher war eine Bestellung nur eine Zahl (S.offen). Setzt jemand
   die Zahl von aussen - ein alter Spielstand, ein Test -, bekommt
   jede fehlende Bestellung jetzt einen Inhalt. */
function vsAbgleich(){
  if(!S) return;
  S.bestellungen=S.bestellungen||[];
  const soll=Math.max(0,S.offen|0);
  let n=0;
  while(S.bestellungen.length<soll&&n++<60){ const b=vsNeueBestellung(false)||vsNeueBestellung(true); if(!b) break; S.bestellungen.push(b); }
  for(let i=S.bestellungen.length-1;i>=0&&S.bestellungen.length>soll;i--){ const b=S.bestellungen[i]; if(b.st==='offen'&&b.pos.every(l=>!l.g)) S.bestellungen.splice(i,1); }
  vsSync();
  S.paketGr=Array.isArray(S.paketGr)?S.paketGr:[];
  const p=Math.max(0,S.pakete|0);
  if(p!==S.paketGr.length){ while(S.paketGr.length<p) S.paketGr.push(1); if(S.paketGr.length>p) S.paketGr.length=Math.max(p,vsBahn.length); }
  S.pakete=S.paketGr.length;
  if(!Array.isArray(S.paketP)) S.paketP=[];
  while(S.paketP.length<S.paketGr.length) S.paketP.push(-1); S.paketP.length=S.paketGr.length;
}
/* Was die laufenden Wagentouren noch holen muessen - das darf der
   Spieler am Tisch nicht wegpacken */
function vsWagenBedarf(){ const n={}; for(const b of S.bestellungen||[]) if(b.st==='wagen') for(const l of b.pos) n[l.t]=(n[l.t]||0)+Math.max(0,l.n-l.g); return n; }
/* Kann die Bestellung aus dem Bestand bedient werden? schon: was
   diese Tour fuer andere Bestellungen bereits verplant hat */
function vsErfuellbar(b,schon){
  for(const l of b.pos){ const need=l.n-l.g; if(need>0&&vsBestand(l.t)-((schon&&schon[l.t])||0)<need) return false; }
  return true;
}

/* ---------------------------------------------------------
   Material: Wellpappe, Deckel mit Klebeband und Etikett
   --------------------------------------------------------- */
let VSM=null;
function vsMat(){
  if(VSM) return VSM;
  const pappe=(g,W,H)=>{
    const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#c9a372'); gr.addColorStop(1,'#b18a58');
    g.fillStyle=gr; g.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=5){ g.fillStyle=`rgba(118,88,52,${0.04+Math.random()*0.07})`; g.fillRect(0,y,W,2); }
    for(let i=0;i<W*H/60;i++){ g.fillStyle=`rgba(255,240,215,${Math.random()*0.06})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
  };
  const seite=tex(256,256,(g,W,H)=>{ pappe(g,W,H);
    /* Aufdruck: Pfeile "oben" und das DDL-Logo */
    g.strokeStyle='rgba(58,44,30,.55)'; g.lineWidth=5;
    for(const x of [34,58]){ g.beginPath(); g.moveTo(x,70); g.lineTo(x,36); g.moveTo(x-9,46); g.lineTo(x,34); g.lineTo(x+9,46); g.stroke(); }
    g.fillStyle='rgba(58,44,30,.55)'; g.font=BUN(30); g.textAlign='right'; g.textBaseline='bottom'; g.fillText('DDL',W-18,H-16);
    g.fillStyle='rgba(206,40,36,.55)'; g.fillRect(W-86,H-54,68,5); });
  /* Versandetikett: auf dem Deckel aufgemalt und als eigenes Teil,
     das beim Zukleben erscheint - beide gleich gross, gleich gedreht */
  const etikett=(g,lx,ly,lw,lh)=>{
    g.fillStyle='#f5f3ea'; g.fillRect(lx,ly,lw,lh);
    g.fillStyle='#1c2028'; g.font=BUN(Math.max(9,lw*0.2)); g.textAlign='left'; g.textBaseline='top'; g.fillText('DDL',lx+lw*0.08,ly+lh*0.06);
    for(let i=0,x=lx+lw*0.08;x<lx+lw*0.92;i++){ const w=1+Math.random()*3; g.fillRect(x,ly+lh*0.55,w,lh*0.32); x+=w+1+Math.random()*2; }
    g.fillStyle='#8a8f98'; g.fillRect(lx+lw*0.08,ly+lh*0.33,lw*0.7,2); g.fillRect(lx+lw*0.08,ly+lh*0.42,lw*0.5,2);
  };
  const deckel={}, ePos={};
  for(const k of [1,3,6]){ const G=VS_GR[k], sc=512/Math.max(G.x,G.z), W=Math.round(G.x*sc), H=Math.round(G.z*sc);
    deckel[k]=tex(W,H,(g)=>{ pappe(g,W,H);
      /* Klebeband laengs ueber die Naht */
      const bw=0.052*sc; g.fillStyle='rgba(205,168,98,.92)'; g.fillRect(W/2-bw/2,0,bw,H);
      g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(W/2-bw/2,0,bw*0.22,H);
      /* Versandetikett auf der einen Haelfte */
      const lw=Math.min(0.1*sc,W/2-bw/2-8), lh=Math.min(0.14*sc,H*0.6), lx=W/2-bw/2-lw-6, ly=H*0.22;
      etikett(g,lx,ly,lw,lh);
      ePos[k]={x:((lx+lw/2)/W-0.5)*G.x,z:((ly+lh/2)/H-0.5)*G.z,w:lw/sc,h:lh/sc};
    });
  }
  /* zerknuellte Packpapierpolster, nicht weiss - von oben beleuchtet
     wirkte helles Papier wie ein leuchtender Deckel */
  const fuell=tex(128,128,(g,W,H)=>{ g.fillStyle='#9c7f55'; g.fillRect(0,0,W,H);
    for(let i=0;i<26;i++){ const x=Math.random()*W, y=Math.random()*H, r=8+Math.random()*16;
      const gr=g.createRadialGradient(x-r*0.3,y-r*0.3,1,x,y,r); gr.addColorStop(0,'rgba(196,168,122,.9)'); gr.addColorStop(1,'rgba(110,86,54,0)');
      g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); }
    for(let i=0;i<70;i++){ g.strokeStyle=`rgba(${Math.random()<0.6?'92,70,44':'205,180,138'},${0.3+Math.random()*0.4})`; g.lineWidth=1+Math.random()*2;
      g.beginPath(); const x=Math.random()*W, y=Math.random()*H; g.moveTo(x,y); g.quadraticCurveTo(x+rand(-20,20),y+rand(-20,20),x+rand(-26,26),y+rand(-26,26)); g.stroke(); } });
  const lab=tex(100,140,(g,W,H)=>etikett(g,0,0,W,H));
  VSM={
    seite:new THREE.MeshStandardMaterial({map:seite,roughness:0.9}),
    deckel:{1:new THREE.MeshStandardMaterial({map:deckel[1],roughness:0.88}),3:new THREE.MeshStandardMaterial({map:deckel[3],roughness:0.88}),6:new THREE.MeshStandardMaterial({map:deckel[6],roughness:0.88})},
    klappe:new THREE.MeshStandardMaterial({map:seite,roughness:0.9,side:THREE.DoubleSide}),
    innen:std(0x86653f,{roughness:0.96,side:THREE.BackSide}),
    fuell:new THREE.MeshStandardMaterial({map:fuell,roughness:1,color:LIN(0xb8b0a6)}),
    band:new THREE.MeshStandardMaterial({color:LIN(0xc9a25e),roughness:0.35,metalness:0.05,transparent:true,opacity:0.92}),
    etikett:new THREE.MeshStandardMaterial({map:lab,roughness:0.7}),
    weg:new THREE.MeshBasicMaterial({visible:false}),
    geo:{}, innenGeo:{}, ePos
  };
  /* Geometrien je Groesse nur einmal - jeder offene Karton teilt sie */
  VSM.kurzGeo={}; VSM.langGeo={}; VSM.fuellGeo={}; VSM.bandGeo={}; VSM.etikettGeo=new THREE.PlaneGeometry(ePos[1].w,ePos[1].h);
  for(const k of [1,3,6]){ const G=VS_GR[k], L=Math.min(G.x,G.z)/2*0.96;
    VSM.geo[k]=new THREE.BoxGeometry(G.x,G.h,G.z); VSM.innenGeo[k]=new THREE.BoxGeometry(G.x-0.012,G.h-0.01,G.z-0.012);
    VSM.kurzGeo[k]=new THREE.BoxGeometry(G.x-0.01,0.004,L); VSM.langGeo[k]=new THREE.BoxGeometry(G.x/2,0.004,G.z-0.01);
    VSM.fuellGeo[k]=new THREE.PlaneGeometry(G.x-0.02,G.z-0.02); VSM.bandGeo[k]=new THREE.BoxGeometry(0.052,0.003,G.z+0.004); }
  return VSM;
}
/* Fertig verklebt: ein einziges Mesh - auf dem Stapel koennen es
   ueber hundert werden */
function vsPaketZu(gr){
  const M=vsMat();
  const m=new THREE.Mesh(M.geo[gr],[M.seite,M.seite,M.deckel[gr],M.seite,M.seite,M.seite]);
  if(HIQ){ m.castShadow=true; m.receiveShadow=true; }
  m.userData.gr=gr; return m;
}
/* Offener Karton mit vier Klappen, Fuellung und (noch unsichtbarem)
   Klebeband und Etikett */
function vsPaketOffen(gr){
  const M=vsMat(), G=VS_GR[gr], g=new THREE.Group(), u={gr,klappen:[]};
  u.body=new THREE.Mesh(M.geo[gr],[M.seite,M.seite,M.weg,M.seite,M.seite,M.seite]); g.add(u.body);
  if(HIQ) u.body.castShadow=true;
  g.add(new THREE.Mesh(M.innenGeo[gr],M.innen));
  u.fuell=new THREE.Mesh(M.fuellGeo[gr],M.fuell); u.fuell.rotation.x=-Math.PI/2; u.fuell.visible=false; g.add(u.fuell);
  const kl=(px,pz,geo,mx,mz,y,ax,s)=>{ const pv=new THREE.Group(); pv.position.set(px,G.h/2+y,pz); g.add(pv);
    const m=new THREE.Mesh(geo,M.klappe); m.position.set(mx,0,mz); pv.add(m); u.klappen.push({pv,ax,s,lang:ax==='z'}); };
  const L=Math.min(G.x,G.z)/2*0.96;
  /* kurze Klappen an den Stirnseiten gehen zuerst zu, die langen darueber */
  kl(0, G.z/2,M.kurzGeo[gr],0,-L/2,0.003,'x', 1);
  kl(0,-G.z/2,M.kurzGeo[gr],0, L/2,0.003,'x',-1);
  kl( G.x/2,0,M.langGeo[gr],-G.x/4,0,0.008,'z',-1);
  kl(-G.x/2,0,M.langGeo[gr], G.x/4,0,0.008,'z', 1);
  u.band=new THREE.Mesh(M.bandGeo[gr],M.band); u.band.position.y=G.h/2+0.012; u.band.visible=false; g.add(u.band);
  const E=M.ePos[gr];
  u.etikett=new THREE.Mesh(M.etikettGeo,M.etikett); u.etikett.rotation.x=-Math.PI/2;
  u.etikett.position.set(E.x,G.h/2+0.0145,E.z); u.etikett.visible=false; g.add(u.etikett);
  g.userData=u; vsKlappen(g,1); return g;
}
/* f: 1 ganz offen, 0 zu. Beim Schliessen erst die kurzen Klappen */
function vsKlappen(pk,f){
  const c=1-f, ks=vsGlatt(c/0.55), kl=vsGlatt((c-0.4)/0.6);
  /* offen stehen die Klappen fast senkrecht - weiter aufgeklappt
     kreuzten sie die des Nachbarkartons und den Schiebebuegel */
  for(const k of pk.userData.klappen){ const a=1.75*(1-(k.lang?kl:ks))*k.s;
    if(k.ax==='x') k.pv.rotation.x=a; else k.pv.rotation.z=a; }
}
function vsFuellung(pk,anteil){
  const u=pk.userData, G=VS_GR[u.gr];
  u.fuell.visible=anteil>0.001;
  u.fuell.position.y=-G.h/2+0.012+(G.h-0.05)*Math.min(1,anteil);
}
function vsAnteil(b){ const n=vsStueck(b); return n?b.pos.reduce((a,l)=>a+Math.min(l.g,l.n),0)/n:1; }
/* ---------------------------------------------------------
   Kommissionierwagen - einer je Packplatz
   --------------------------------------------------------- */
function vsFeld(i){ return {x:(Math.floor(i/3)-0.5)*0.33,z:(i%3-1)*0.3}; }
function vsWagenBauen(parent,pi){
  const g=new THREE.Group(), rahmen=std(0x3a4049,{metalness:0.5,roughness:0.45}), blech=std(0x9aa2ad,{metalness:0.65,roughness:0.35});
  const gummi=std(0x1b1d22,{roughness:0.8}), griff=std(0x23262c,{roughness:0.6});
  /* Ladeflaeche mit aufgemalten Faechern 1 bis 6 */
  bbox(0.7,0.025,0.94,blech,0,WG_Y-0.0125,0,g);
  const ft=tex(340,460,(c,W,H)=>{ c.clearRect(0,0,W,H);
    c.strokeStyle='rgba(242,194,48,.95)'; c.lineWidth=5;
    for(let i=0;i<6;i++){ const f=vsFeld(i), x=(f.x+0.34)*500, y=(f.z+0.46)*500;
      c.strokeRect(x-78,y-70,156,140);
      c.fillStyle='rgba(242,194,48,.95)'; c.font=BUN(34); c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(i+1),x,y); } });
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(0.68,0.92),new THREE.MeshStandardMaterial({map:ft,transparent:true,depthWrite:false,roughness:0.5,
    polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  fl.rotation.x=-Math.PI/2; fl.position.y=WG_Y+0.002; g.add(fl);
  /* niedrige Reling, Ecksaeulen, untere Ablage mit gefalteten Kartons */
  for(const sx of [-0.34,0.34]) bbox(0.02,0.02,0.94,rahmen,sx,WG_Y+0.08,0,g,false);
  for(const sz of [-0.46,0.46]) bbox(0.7,0.02,0.02,rahmen,0,WG_Y+0.08,sz,g,false);
  for(const sx of [-0.33,0.33]) for(const sz of [-0.45,0.45]) bbox(0.03,WG_Y-0.05,0.03,rahmen,sx,(WG_Y+0.05)/2+0.07,sz,g);
  bbox(0.66,0.02,0.9,blech,0,0.22,0,g,false);
  const falt=std(0xc39c68,{roughness:0.92});
  bbox(0.5,0.022,0.62,falt,0.02,0.242,0.05,g,false); bbox(0.46,0.022,0.58,falt,-0.03,0.264,0.02,g,false);
  /* Schiebebuegel am hinteren Ende */
  for(const sx of [-0.3,0.3]) bbox(0.028,0.34,0.028,rahmen,sx,WG_Y+0.16,-0.47,g,false);
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.62,10),griff); bar.rotation.z=Math.PI/2; bar.position.set(0,WG_Y+0.32,-0.49); g.add(bar);
  /* Handscanner in einer Halterung hinter dem Buegel - ausserhalb der
     Ladeflaeche, sonst steckte er im riesigen Karton */
  bbox(0.07,0.13,0.035,std(0x2b2f36,{roughness:0.5}),0.19,WG_Y+0.24,-0.535,g,false);
  const sc=plane(0.05,0.07,new THREE.MeshBasicMaterial({toneMapped:false,map:tex(64,90,(c,W,H)=>{ c.fillStyle='#0f2a1c'; c.fillRect(0,0,W,H); c.fillStyle='#6cf2a8'; c.font=BUN(22); c.textAlign='center'; c.fillText('PICK',W/2,36); c.fillRect(10,52,44,6); c.fillRect(10,64,30,6); })}),0.19,WG_Y+0.25,-0.554,Math.PI,g);
  /* Lenkrollen */
  for(const sx of [-0.28,0.28]) for(const sz of [-0.38,0.38]){
    bbox(0.045,0.13,0.05,rahmen,sx,0.145,sz,g,false);
    const r=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.032,14),gummi); r.rotation.z=Math.PI/2; r.position.set(sx,0.05,sz); g.add(r);
  }
  g.userData={modus:'park',t:1,von:null,pose:null,pp:pi};
  const P_=vsPlaetze[pi]||(vsPlaetze[pi]={i:pi,wagen:null,tisch:null});
  P_.wagen=g; vsParken(pi,true,parent);
  return g;
}
function vsWagenVon(w){ const P_=vsPlaetze[w.pp|0]; return P_&&P_.wagen; }
/* Wagen sofort an seinen Platz am Tisch haengen */
function vsParken(pi,sofort,parent){
  const P_=vsPlaetze[pi], g=P_&&P_.wagen, T=parent||packTisch; if(!g||!T) return;
  if(g.parent!==T){ if(g.parent) g.parent.remove(g); T.add(g); }
  const p=ppW(pi,WG_PARK.x,WG_PARK.z); g.position.set(p.x,0,p.z); g.rotation.set(0,ppRy(pi,WG_PARK.ry),0);
  const u=g.userData; u.modus='park'; u.t=1; u.von=null;
  /* geparkt ist der Wagen ein Hindernis wie der Tisch */
  if(typeof packMov!=='undefined'&&packMov&&grabbed!==packMov) applyFootprint(packMov);
}
function vsWagenWelt(g){
  g.updateMatrixWorld(true);
  const p=new THREE.Vector3(); g.getWorldPosition(p);
  const ry=g.parent===packTisch?packTisch.rotation.y+g.rotation.y:g.rotation.y;
  return {p:V(p.x,0,p.z),ry};
}
function vsWagenModus(g,m,pose){
  if(!g) return; const u=g.userData;
  const jetzt=vsWagenWelt(g);
  if(g.parent!==scene){ if(g.parent) g.parent.remove(g); scene.add(g); g.position.copy(jetzt.p); g.rotation.set(0,jetzt.ry,0);
    if(packMov&&grabbed!==packMov) applyFootprint(packMov); }
  u.von=jetzt; u.t=0; u.modus=m; u.pose=pose||null;
}
function vsWagenZiel(w,g){
  const u=g.userData;
  if(u.modus==='park') return {p:vsWelt(u.pp,WG_PARK.x,WG_PARK.z),ry:vsRy(u.pp,WG_PARK.ry)};
  if(u.modus==='stehen'&&u.pose) return u.pose;
  const ry=w.g.rotation.y;
  return {p:V(w.pos.x+Math.sin(ry)*WG_ABST,0,w.pos.z+Math.cos(ry)*WG_ABST),ry};
}
function vsWagenUpdate(w,dt){
  const g=vsWagenVon(w); if(!g) return; const u=g.userData;
  if(g.parent===packTisch) return;
  const z=vsWagenZiel(w,g);
  u.t=Math.min(1,u.t+dt*(w.wf||1)/0.45);
  const e=vsGlatt(u.t), a=u.von||z;
  g.position.set(a.p.x+(z.p.x-a.p.x)*e,0,a.p.z+(z.p.z-a.p.z)*e);
  g.rotation.set(0,vsWinkel(a.ry,z.ry,e),0);
  /* geparkt blockiert er: der Weg des Mitarbeiters wird neu gesucht */
  if(u.modus==='park'&&u.t>=1){ vsParken(u.pp,true); w.vsZiel=null; }
}
function vsWagenFertig(g){ return g.userData.t>=1; }
/* Wo der Wagen beim Picken steht: neben dem Mitarbeiter, laengs zur Regalfront */
function vsWagenStand(stand,look,weiter){
  let lx=look.x-stand.x, lz=look.z-stand.z; const d=Math.hypot(lx,lz)||1; lx/=d; lz/=d;
  const tx=lz, tz=-lx, frei=(x,z)=>navFrei(navIdx(x,z));
  /* auf die Seite, in die es danach weitergeht - sonst schwenkt der
     Wagen beim Weiterfahren quer durch den Mitarbeiter */
  const erst=weiter&&((weiter.x-stand.x)*tx+(weiter.z-stand.z)*tz)<0?-1:1;
  for(const s of [erst,-erst]){
    const cx=stand.x+tx*0.9*s-lx*0.1, cz=stand.z+tz*0.9*s-lz*0.1;
    if(frei(cx,cz)&&frei(cx+tx*0.45,cz+tz*0.45)&&frei(cx-tx*0.45,cz-tz*0.45)) return {p:V(cx,0,cz),ry:Math.atan2(tx*s,tz*s)};
  }
  return {p:V(stand.x-lx*0.95,0,stand.z-lz*0.95),ry:Math.atan2(lx,lz)};
}
/* Stufe gewechselt: Wagen der neuen Plaetze zeigen, Ablage neu legen */
function vsStufeGeaendert(){
  vsPlaetze.forEach((P_,i)=>{ if(P_&&P_.wagen) P_.wagen.visible=zoneOffen('packstation')&&i<vsAktiv(); });
  if(typeof vmRegaleZeichnen==='function') vmRegaleZeichnen();
  if(S&&packTisch) syncPakete();
}

/* ---------------------------------------------------------
   Tourplanung: welche Bestellungen passen auf den Wagen, wo liegt
   die Ware, in welcher Reihenfolge wird gelaufen
   --------------------------------------------------------- */
function vsFelderFuer(belegt,gr){
  if(gr===6) return belegt.every(x=>!x)?[0,1,2,3,4,5]:null;
  if(gr===3){ for(const r of [1,0]){ const f=[r*3,r*3+1,r*3+2]; if(f.every(i=>!belegt[i])) return f; } return null; }
  for(let i=0;i<6;i++) if(!belegt[i]) return [i];
  return null;
}
/* Tourplanung (Tom 08.10.: "Es gibt kein Versand-Pickregal - der Packer pickt mit dem Rollwagen aus dem
   gesamten Kartonlager und nimmt mehrere Bestellungen pro Tour, so effizient wie moeglich"):
   - Anker ist die aelteste passende Bestellung, danach kommt jeweils die, deren Ware am dichtesten an
     schon geplanten Stopps liegt (kein Weg, wenn dieselbe Quelle schon dabei ist)
   - keine Bestellung bleibt liegen: wer dreimal uebergangen wurde, ist beim naechsten Mal der Anker
   - VS_OPT.an=false ist die alte Reihenfolge (Eingang) - fuer den Vergleich im Test */
const VS_OPT={an:true, fenster:60, geduld:3};
function vsDist(a,b){ return Math.hypot(a.x-b.x,a.z-b.z); }
/* Standpunkte der Quellen je Ware (Lager zuerst, Laden nur wenn im Lager nichts liegt), einmal je Planung */
function vsPunkteVon(t,von,cache){
  let c=cache[t]; if(c) return c;
  const Q=vsQuellen(t), L=Q.filter(q=>q.lager), nutz=L.length?L:Q;
  c=nutz.map(q=>({q,p:vsQuellPunkt(q,von).stand})); cache[t]=c; return c;
}
/* Mehrweg einer Bestellung: Summe der Wege von schon geplanten Punkten zur naechsten Quelle jeder Ware */
function vsMehrweg(b,pts,von,cache){
  let sum=0; const neu=[];
  for(const l of b.pos){ if(l.n-l.g<=0) continue;
    const Q=vsPunkteVon(l.t,von,cache); if(!Q.length) return 1e9;
    const alle=pts.concat(neu); let best=1e9, bp=null;
    for(const c of Q){ let d=1e9; for(const p of alle){ const dd=vsDist(p,c.p); if(dd<d) d=dd; } if(d<best){ best=d; bp=c.p; } }
    if(best>0.6){ sum+=best; neu.push(bp); } }
  return sum;
}
/* pi: Packplatz - jeder Karton braucht Material aus seinem Regal */
function vsPlan(pi){
  pi=pi|0;
  const belegt=[null,null,null,null,null,null], auf=[], schon={}, mat={};
  const kand=(S.bestellungen||[]).filter(b=>b.st==='offen');
  const taugt=b=>vsErfuellbar(b,schon)&&vmReicht(pi,b.gr,mat)&&!!vsFelderFuer(belegt,b.gr);
  const nimm=b=>{
    const f=vsFelderFuer(belegt,b.gr);
    f.forEach(i=>belegt[i]=b); auf.push({b,felder:f,pk:null});
    vmVormerken(b.gr,mat);
    for(const l of b.pos) schon[l.t]=(schon[l.t]||0)+Math.max(0,l.n-l.g);
    kand.splice(kand.indexOf(b),1); };
  if(!VS_OPT.an){
    for(const b of kand.slice()){ if(!taugt(b)) continue; nimm(b); if(belegt.every(Boolean)) break; }
  } else {
    const heim=vsWelt(pi,WG_GRIFF.x,WG_GRIFF.z), pts=[heim], cache={}, alt=kand.slice();
    let maxIdx=-1;
    while(kand.length&&!belegt.every(Boolean)){
      let wahl=null;
      if(!auf.length) wahl=kand.find(taugt)||null;                          /* Anker: die aelteste */
      else {
        wahl=kand.find(b=>(b.skip|0)>=VS_OPT.geduld&&taugt(b))||null;       /* zu lange liegengeblieben */
        if(!wahl){ let bw=1e9, n=0;
          for(const b of kand){ if(n>=VS_OPT.fenster) break; if(!taugt(b)) continue; n++;
            const w=vsMehrweg(b,pts,heim,cache); if(w<bw-1e-6){ bw=w; wahl=b; } } }
      }
      if(!wahl) break;
      maxIdx=Math.max(maxIdx,alt.indexOf(wahl));
      /* seine Quellen zaehlen ab jetzt als "schon unterwegs" */
      for(const l of wahl.pos){ if(l.n-l.g<=0) continue; const Q=vsPunkteVon(l.t,heim,cache); let best=1e9, bp=null;
        for(const c of Q){ let d=1e9; for(const p of pts){ const dd=vsDist(p,c.p); if(dd<d) d=dd; } if(d<best){ best=d; bp=c.p; } }
        if(bp) pts.push(bp); }
      nimm(wahl);
    }
    /* uebergangene (aeltere als die zuletzt gewaehlte) Bestellungen werden ungeduldiger */
    alt.forEach((b,i)=>{ if(i<maxIdx&&auf.every(a=>a.b!==b)&&b.st==='offen') b.skip=(b.skip|0)+1; });
    auf.forEach(a=>{ a.b.skip=0; });
  }
  if(!auf.length) return null;
  return {auf,stops:[],runde:0};
}
function vsBedarf(tour){ const need={}; for(const a of tour.auf) for(const l of a.b.pos){ const n=l.n-l.g; if(n>0) need[l.t]=(need[l.t]||0)+n; } return need; }
function vsQuellPunkt(q,T){
  if(q.kind==='rack'){ const s=q.ref, K=rackKindOf(s.rk);
    const look=localToWorld(s.rk.g,s.x,0); look.y=s.y+0.2;
    return {stand:vsRackStand(s)||localToWorld(s.rk.g,s.x,K.zo+0.62),look}; }
  if(q.kind==='floor'){ const m=q.ref.mesh.position;
    let best=vsBodenStand(q.ref,T);
    if(!best){ const id=navNah(m.x,m.z); best=id>=0?navPos(id):V(m.x,0,m.z+0.75); }
    return {stand:best,look:V(m.x,m.y,m.z)}; }
  const lv=q.ref, h=lv.items[lv.items.length-1];
  const mm=itemMatrix(lv.sh,lv,Math.max(0,lv.count-1),h?h.jit||0:0); mm.decompose(_vp,_vq,_vs);
  return {stand:shelfStand(lv.sh,lv),look:_vp.clone()};
}
/* 2-opt: Weg von "von" ueber alle Stopps und zurueck zu "ende" so lange verbessern, bis kein Tausch mehr kuerzt */
function vsZweiOpt(L,von,ende){
  if(L.length<3) return L;
  const P=i=>i<0?von:i>=L.length?ende:L[i].stand;
  let besser=true, n=0;
  while(besser&&n++<40){ besser=false;
    for(let i=0;i<L.length-1;i++) for(let j=i+1;j<L.length;j++){
      const a=P(i-1), b=P(i), c=P(j), d=P(j+1);
      if(vsDist(a,c)+vsDist(b,d)<vsDist(a,b)+vsDist(c,d)-1e-6){ const mid=L.slice(i,j+1).reverse(); L.splice(i,j-i+1,...mid); besser=true; } } }
  return L;
}
function vsRouteLaenge(stops,von,ende){
  let p=von, sum=0; for(const s of stops){ sum+=vsDist(p,s.stand); p=s.stand; } return sum+vsDist(p,ende||von);
}
function vsStopsBauen(need,von,ende){
  ende=ende||von;
  const stops=[];
  for(const t in need){
    let n=need[t];
    /* Lager vor Laden; ein Karton, der allein reicht, vor mehreren; dann der naechste am Weg */
    const Q=vsQuellen(t).sort((a,b)=>(b.lager-a.lager)||((b.n>=n)-(a.n>=n))||(VS_OPT.an?0:(a.n-b.n)));
    if(VS_OPT.an) Q.forEach(q=>{ q._pt=vsQuellPunkt(q,von); });
    if(VS_OPT.an) Q.sort((a,b)=>(b.lager-a.lager)||((b.n>=n)-(a.n>=n))||(vsDist(a._pt.stand,von)-vsDist(b._pt.stand,von)));
    for(const q of Q){ if(n<=0) break; const k=Math.min(n,q.n); n-=k;
      const pt=q._pt||vsQuellPunkt(q,von); stops.push({kind:q.kind,ref:q.ref,t,k,done:0,stand:pt.stand,look:pt.look,lager:q.lager}); }
  }
  /* naechster Nachbar ab dem Tisch, Lager vor Laden; danach 2-opt */
  const out=[]; let p=von;
  for(const lag of [true,false]){
    const L=stops.filter(s=>s.lager===lag), start=p, ordnung=[];
    while(L.length){ let bi=0,bd=1e9; L.forEach((s,i)=>{ const d=vsDist(s.stand,p); if(d<bd){ bd=d; bi=i; } });
      const s=L.splice(bi,1)[0]; ordnung.push(s); p=s.stand; }
    if(VS_OPT.an) vsZweiOpt(ordnung,start,ende);
    ordnung.forEach(s=>out.push(s)); if(ordnung.length) p=ordnung[ordnung.length-1].stand;
  }
  return out;
}
/* Ein Stueck aus der Quelle nehmen. Gibt die Weltlage zurueck, von
   der es losfliegt - oder null, wenn dort nichts mehr liegt. */
function vsNimm(kind,ref,t){
  /* waehrend der Tour kann ein Grossauftrag die Kartons reserviert haben */
  if(kind!=='level'&&typeof reservedType==='function'&&reservedType(t)) return null;
  if(kind==='level'){ const lv=ref; if(lv.type!==t||lv.count<=0) return null;
    const h=lv.items[lv.items.length-1]; const mm=itemMatrix(lv.sh,lv,lv.count-1,h?h.jit||0:0);
    const p=new THREE.Vector3(), q=new THREE.Quaternion(); mm.decompose(p,q,_vs);
    removeFromLevel(lv); return {p,q}; }
  if(kind==='rack'){ const s=ref; if(!s.box||s.box.type!==t||s.box.count<=0) return null;
    s.rk.g.updateMatrixWorld(true); const p=s.box.mesh.getWorldPosition(new THREE.Vector3()); p.y+=0.12;
    const q=new THREE.Quaternion().setFromAxisAngle(_vY,s.rk.g.rotation.y);
    s.box.count--; if(s.box.count<=0){ kisteZurueck(s.box); s.rk.g.remove(s.box.mesh); s.box=null; }
    drawRackSchild(s.rk); return {p,q}; }
  const b=ref; if(floorBoxes.indexOf(b)<0||b.type!==t||b.count<=0) return null;
  const p=b.mesh.position.clone(); p.y+=0.12; const q=new THREE.Quaternion().setFromAxisAngle(_vY,b.mesh.rotation.y);
  b.count--; if(b.count<=0){ kisteZurueck(b); removeFloorBox(b); }
  return {p,q};
}
/* Sofort entnehmen (Spieler am Tisch, packOne) - Lager zuerst */
function vsEntnehmen(b){
  if(!vsErfuellbar(b,vsWagenBedarf())) return false;
  for(const l of b.pos){
    let n=l.n-l.g;
    const Q=vsQuellen(l.t).sort((a,c)=>(c.lager-a.lager));
    for(const q of Q){ while(n>0&&vsNimm(q.kind,q.ref,l.t)){ n--; l.g++; } if(n<=0) break; }
    if(n>0) return false;
  }
  return true;
}

/* ---------------------------------------------------------
   Buchen
   --------------------------------------------------------- */
function vsBuchen(b,spieler){
  /* Ware plus Versandkosten, die der Kunde bezahlt hat; das Porto an
     DDL geht fuer jedes Paket ab */
  const geb=r2(+b.versand||0), w=r2(b.wert+geb), porto=VS_PORTO[b.gr]||VS_PORTO[1];
  S.money=r2(S.money+w-porto); S.seasonRevenue=r2((S.seasonRevenue||0)+w);
  DS.revenue=r2(DS.revenue+w); DS.versand=r2((DS.versand||0)+w);
  DS.versandGeb=r2((DS.versandGeb||0)+geb); DS.porto=r2((DS.porto||0)+porto);
  goalAdd('rev',w); goalAdd('sold',vsStueck(b));
  b.pos.forEach(l=>statVerkauf(l.t,l.n));
  statAdd('pakete',1);
  const i=S.bestellungen.indexOf(b); if(i>=0) S.bestellungen.splice(i,1);
  vsSync(); drawPackSchild();
  if(spieler){ addXP(3); sfx.cash(); toast(`Paket #${b.id} fertig: +${eur(w)}${porto?` · Porto ${eur(porto)}`:''}`,'money'); }
}

/* Palettenplaetze, Stapeln, Zwischenabholung und Abholung stehen seit 07.10. in
   11e-palette.js (jede Palette ist ein eigenes Objekt). Hier bleibt, was das
   Band braucht: wie viele Pakete schon auf Paletten liegen. */
function vsGelandet(){ return Math.max(0,(S.paketGr||[]).length-vsBahn.length); }

/* ---------------------------------------------------------
   Band: vom Tisch eben aufs Band geschoben, dann bis zum Endanschlag
   oder bis ans Paket davor. Phasen: warten (noch auf dem Tisch),
   schieben, rollen, greifer (haengt am Portal).
   --------------------------------------------------------- */
function vsLaenge(e){ return VS_GR[e.gr].z; }
function vsAufDieBahn(pi,m,gr){
  S.paketGr.push(gr); S.paketP.push(-1); S.pakete=S.paketGr.length;
  vsBahn.push({m,gr,pp:pi,phase:'warten',t:0,x:VS_PP[pi].x});
  drawPackSchild();
}
/* Ist auf dem Band an der Stelle x Platz fuer ein Paket der Laenge L? */
function vsBandFrei(x,L,selbst){
  for(const e of vsBahn){ if(e===selbst||e.phase==='warten') continue;
    if(e.phase==='greifer'&&!e.amBand) continue;
    const l=vsLaenge(e), a=e.x-l/2, b=e.x+l/2;
    /* was von hinten (Osten) kommt, braucht Abstand: es laeuft waehrend
       des Schiebens weiter nach Westen */
    const vor=e.phase==='rollen'&&e.laeuft?0.5:0.06;
    if(b+0.06>x-L/2&&a-vor<x+L/2) return false; }
  return true;
}
function vsBahnUpdate(dt){
  const T=packTeile;
  /* Gurt laeuft durchgehend nach Westen */
  if(T.gurt&&T.gurt.offset) T.gurt.offset.x+=dt*VS_V/1.0;
  /* vorne (Westen) zuerst: jedes Paket rueckt bis an das davor */
  const auf=vsBahn.filter(e=>e.phase==='rollen'||e.phase==='schieben'||(e.phase==='greifer'&&e.amBand)).sort((a,b)=>a.x-b.x);
  let vorne=-1e9;
  for(const e of auf){
    const L=vsLaenge(e), G=VS_GR[e.gr], m=e.m;
    if(e.phase==='rollen'){
      const ende=Math.max(BAND.x0+L/2,vorne+0.03+L/2);
      const nx=Math.max(ende,e.x-dt*VS_V); e.laeuft=nx<e.x-1e-5; e.x=Math.min(e.x,nx);
      m.position.set(e.x,BAND.y+G.h/2,BAND.z); m.rotation.y=Math.PI/2;
    }
    vorne=e.x+L/2;
  }
  for(let i=0;i<vsBahn.length;i++){
    const e=vsBahn[i], G=VS_GR[e.gr], m=e.m;
    if(e.phase==='warten'){
      /* liegt fertig auf dem Tisch; erst schieben, wenn das Band dort frei ist */
      const tp=ppW(e.pp,VS_TISCH.x,VS_TISCH.z); m.position.set(tp.x,VS_TOP+G.h/2,tp.z); m.rotation.y=Math.PI/2;
      if(vsBandFrei(e.x,vsLaenge(e),e)){ e.phase='schieben'; e.t=0; }
    } else if(e.phase==='schieben'){
      e.t+=dt/0.7; const k=vsGlatt(e.t);
      const tz=ppW(e.pp,VS_TISCH.x,VS_TISCH.z).z; m.position.set(e.x,VS_TOP+G.h/2,tz+(BAND.z-tz)*k);
      if(e.t>=1){ e.phase='rollen'; e.laeuft=true; if(sfx.karton) sfx.karton(); }
    }
  }
  vsPortalUpdate(dt);
}

/* ---------------------------------------------------------
   Portalgreifer: nimmt das Paket am Endanschlag ab, hebt es ueber die
   Stapel, faehrt zur Palette und setzt es senkrecht ab. x/y/z ist die
   Unterkante des Greifers (Saugerflaeche).
   --------------------------------------------------------- */
function vsPortalRuhe(){ const P_=vsPortal; P_.phase='ruhe'; P_.e=null; P_.ziel=null; P_.von=null; P_.nach=null; vsPortalZeigen(); }
/* eine Strecke: von -> nach in t Sekunden, weich */
function vsPortalFahrt(nach,phase){
  const P_=vsPortal, d=Math.max(Math.hypot(nach.x-P_.x,nach.z-P_.z)/1.3,Math.abs(nach.y-P_.y)/0.9);
  P_.von={x:P_.x,y:P_.y,z:P_.z}; P_.nach=nach; P_.t=0; P_.dauer=Math.max(0.25,d+0.2); P_.phase=phase;
}
function vsPortalUpdate(dt){
  const P_=vsPortal;
  if(!packTisch) return;
  if(P_.von){ P_.t+=dt/P_.dauer; const k=vsGlatt(P_.t), a=P_.von, b=P_.nach;
    P_.x=a.x+(b.x-a.x)*k; P_.y=a.y+(b.y-a.y)*k; P_.z=a.z+(b.z-a.z)*k; }
  const fertig=!P_.von||P_.t>=1; if(fertig) P_.von=null;
  const e=P_.e;
  if(e&&e.phase==='greifer'){ const G=VS_GR[e.gr]; e.m.position.set(P_.x,P_.y-G.h/2,P_.z); }
  switch(P_.phase){
    case 'ruhe': {
      /* das vorderste Paket am Endanschlag, wenn es steht */
      /* erst wenn die letzte Fahrt (nach oben) zu Ende ist */
      const v=fertig?vsBahn.filter(x=>x.phase==='rollen').sort((a,b)=>a.x-b.x)[0]:null;
      if(v&&!v.laeuft&&v.x<=BAND.x0+vsLaenge(v)/2+0.002){
        const G=VS_GR[v.gr];
        P_.e=v; vsPortalFahrt({x:v.x,y:Math.max(VS_YRUHE*0.9,BAND.y+G.h+0.3),z:BAND.z},'hin');
      } else if(fertig&&(Math.abs(P_.y-VS_YRUHE)>0.01||Math.abs(P_.x-(BAND.x0+0.4))>0.01||Math.abs(P_.z-BAND.z)>0.01)&&!P_.zurueck){
        P_.zurueck=true; vsPortalFahrt({x:BAND.x0+0.4,y:VS_YRUHE,z:BAND.z},'ruhe'); }
      else if(fertig) P_.zurueck=false;
      break; }
    case 'hin': if(fertig){ const G=VS_GR[e.gr]; vsPortalFahrt({x:e.x,y:BAND.y+G.h,z:BAND.z},'runter'); } break;
    case 'runter': if(fertig){ P_.phase='saugen'; P_.t=0; } break;
    case 'saugen': {
      P_.t+=dt/0.25; if(P_.t<1) break;
      /* Platz auf der Palette; alles voll: DDL kommt zwischendurch */
      /* e liegt noch auf dem Band und zaehlt nicht zu den gelandeten */
      let pl=vsPalZiel(e.gr);
      if(!pl){ vsZwischenabholung(); pl=vsPalZiel(e.gr); }
      if(!pl){ P_.t=0; break; }
      e.phase='greifer'; e.amBand=true; P_.ziel=pl;
      const G=VS_GR[e.gr]; vsPortalFahrt({x:P_.x,y:VS_YFREI+G.h,z:P_.z},'heben'); break; }
    case 'heben': if(fertig){ e.amBand=false; const G=VS_GR[e.gr], z=P_.ziel; vsPortalFahrt({x:z.x,y:VS_YFREI+G.h,z:z.z},'fahren'); }
      else e.amBand=P_.y-VS_GR[e.gr].h<BAND.y+0.12; break;
    case 'fahren': {
      const G=VS_GR[e.gr], z=P_.ziel;
      e.m.rotation.y=vsWinkel(Math.PI/2,z.ry,vsGlatt(P_.t));
      if(fertig) vsPortalFahrt({x:z.x,y:z.y+G.h/2,z:z.z},'absenken'); break; }
    case 'absenken': if(fertig){ P_.phase='loesen'; P_.t=0; } break;
    case 'loesen': {
      P_.t+=dt/0.2; if(P_.t<1) break;
      /* abgesetzt: das Paket zaehlt jetzt zur Ablage - an die Stelle
         hinter die schon gelandeten, damit der Stapel beim naechsten
         Aufbau gleich aussieht */
      const i=vsBahn.indexOf(e); if(i>=0) vsBahn.splice(i,1);
      const n=vsGelandet(), L=S.paketGr, PP=S.paketP, j=L.indexOf(e.gr,n-1);
      if(j>=n-1&&j>=0){ L.splice(j,1); PP.splice(j,1); L.splice(n-1,0,e.gr); PP.splice(n-1,0,P_.ziel?P_.ziel.p:-1); }
      if(e.m.parent) e.m.parent.remove(e.m);
      syncPakete(); if(typeof sfx!=='undefined'&&sfx.thump) sfx.thump(0.22);
      P_.e=null; P_.ziel=null; vsPortalFahrt({x:P_.x,y:VS_YFREI+0.45,z:P_.z},'ruhe'); P_.zurueck=false;
      break; }
  }
  vsPortalZeigen();
}
/* Bruecke, Laufwagen, Hubachse und Greifer an die Greiferlage stellen */
function vsPortalZeigen(){
  const Pt=packTeile.portal, P_=vsPortal; if(!Pt) return;
  /* die Bruecke ragt im Osten ueber das Bandende - so weit faehrt der Wagen */
  const x=clamp(P_.x,ZELLE[1].x0+0.15,BAND.x0+0.6);
  Pt.bruecke.position.z=P_.z;
  Pt.wagen.position.set(x,PORTAL_Y+0.27,P_.z);
  Pt.greifer.position.set(x,P_.y,P_.z);
  const oben=PORTAL_Y+0.15, unten=P_.y+0.14, L=Math.max(0.05,oben-unten);
  Pt.mast.scale.y=L; Pt.mast.position.set(x,(oben+unten)/2,P_.z);
  Pt.mast2.position.set(x,oben-0.25,P_.z);
}

/* ---------------------------------------------------------
   Der Packtisch: Paket drauf, Klappen zu, Klebeband, Etikett, ab
   aufs Band. Mitarbeiter und Spieler benutzen ihn gleich.
   --------------------------------------------------------- */
function vsTischPose(pi,gr){ return {x:VS_PP[pi].x+VS_TISCH.x,y:VS_TOP+VS_GR[gr].h/2,z:VS_TISCH.z,ry:Math.PI/2}; }
function vsTischStart(pi,pk,b,spieler){
  /* in Stationskoordinaten umhaengen, Weltlage behalten */
  packTisch.updateMatrixWorld(true); pk.updateMatrixWorld(true);
  const p=pk.getWorldPosition(new THREE.Vector3()); pk.getWorldQuaternion(_vq);
  const ry=2*Math.atan2(_vq.y,_vq.w);
  if(pk.parent) pk.parent.remove(pk); packTisch.add(pk);
  packTisch.worldToLocal(p); pk.position.copy(p); pk.rotation.set(0,ry-packTisch.rotation.y,0);
  vsPlaetze[pi].tisch={pk,b,pi,spieler:!!spieler,phase:'heben',t:0,von:{x:p.x,y:p.y,z:p.z,ry:ry-packTisch.rotation.y},ziel:vsTischPose(pi,b.gr),fl:0};
  b.st='tisch';
}
function vsTischUpdate(dt){
  for(let i=0;i<vsPlaetze.length;i++){ const P_=vsPlaetze[i]; if(!P_||!P_.tisch) continue;
    const w=staff[VS_PACKER[i]]; vsTischEinzel(P_,dt,!P_.tisch.spieler&&w?(w.wf||1):1.2); }
}
function vsTischEinzel(P_,dt,wf){
  const T=P_.tisch, pi=P_.i;
  const pk=T.pk, u=pk.userData, G=VS_GR[u.gr];
  if(T.phase==='heben'){
    T.t+=dt*wf/0.45; const k=vsGlatt(T.t), a=T.von, z=T.ziel;
    pk.position.set(a.x+(z.x-a.x)*k,a.y+(z.y-a.y)*k+Math.sin(Math.PI*Math.min(1,T.t))*0.2,a.z+(z.z-a.z)*k);
    pk.rotation.y=vsWinkel(a.ry,z.ry,k);
    if(T.t>=1){ T.phase=T.spieler?'fuellen':'zu'; T.t=0; }
  } else if(T.phase==='fuellen'){
    /* Spieler: er legt die Ware von vorn Stueck fuer Stueck hinein */
    T.t-=dt; if(T.t>0) return;
    const f=T.flug;
    if(!f){
      if(T.fl>=Math.min(8,T.stueck)){ T.phase='zu'; T.t=0; vsFuellung(pk,1); return; }
      const l=T.b.pos[T.fl%T.b.pos.length];
      const m=einrStueck(l.t), von=vsWelt(pi,rand(-0.3,0.3),0.62); von.y=1.05;
      T.flug={m,von,t:0,q:new THREE.Quaternion().setFromAxisAngle(_vY,packTisch.rotation.y)};
      m.matrix.compose(von,T.flug.q,_vs.setScalar(1)); m.matrixWorldNeedsUpdate=true;
      return;
    }
    f.t+=dt/0.3; const k=vsGlatt(f.t);
    pk.updateMatrixWorld(true); const z=pk.getWorldPosition(new THREE.Vector3()); z.y+=G.h/2-0.04;
    _vp.copy(f.von).lerp(z,k); _vp.y+=Math.sin(Math.PI*Math.min(1,f.t))*0.3;
    f.m.matrix.compose(_vp,f.q,_vs.setScalar(1-0.2*k)); f.m.matrixWorldNeedsUpdate=true;
    if(f.t>=1){ scene.remove(f.m); T.flug=null; T.fl++; T.t=0.05; vsFuellung(pk,Math.min(1,T.fl/Math.min(8,T.stueck))); if(T.fl%2) sfx.pop(); }
  } else if(T.phase==='zu'){
    T.t+=dt*wf/0.7; vsKlappen(pk,1-Math.min(1,T.t));
    if(T.t>=1){ T.phase='kleben'; T.t=0; u.band.visible=true; u.band.scale.z=0.001; if(sfx.klebe) sfx.klebe(distVol(vsWelt(pi,0,0))); }
  } else if(T.phase==='kleben'){
    T.t+=dt*wf/0.4; const s=Math.min(1,T.t);
    u.band.scale.z=Math.max(0.001,s); u.band.position.z=-(G.z+0.004)/2*(1-s);
    if(T.t>=1){ T.phase='etikett'; T.t=0; u.etikett.visible=true; u.etikett.scale.setScalar(0.01); }
  } else if(T.phase==='etikett'){
    T.t+=dt*wf/0.25; u.etikett.scale.setScalar(Math.max(0.01,Math.min(1,T.t)));
    if(T.t>=1){
      /* zu ist zu: gegen den einfachen Karton tauschen und buchen */
      const m=vsPaketZu(u.gr); m.position.copy(pk.position); m.rotation.y=pk.rotation.y;
      packTisch.remove(pk); packTisch.add(m);
      vsBuchen(T.b,T.spieler);
      if(!T.spieler){ const wp=vsWelt(pi,VS_TISCH.x,VS_TISCH.z); geldSchwebt({x:wp.x,y:-1.0,z:wp.z},T.b.wert); }
      sfx.beep();
      vsAufDieBahn(pi,m,u.gr);
      P_.tisch=null;
    }
  }
}
/* Frei ist der Tisch, wenn nichts verpackt wird und das letzte Paket
   schon auf dem Band liegt */
function vsTischFrei(pi){
  pi=pi|0; const P_=vsPlaetze[pi];
  if(!P_||P_.tisch) return false;
  return !vsBahn.some(e=>e.pp===pi&&(e.phase==='warten'||(e.phase==='schieben'&&e.t<0.8)));
}
/* Spieler packt am Tisch: aelteste Bestellung, deren Ware da ist */
function vsSpielerBestellung(pi){
  const wb=vsWagenBedarf();
  for(const b of S.bestellungen||[]) if(b.st==='offen'&&vsErfuellbar(b,wb)&&(pi===undefined||vmReicht(pi,b.gr))) return b;
  return null;
}
/* Warum der Spieler gerade nichts packen kann */
function vsWarumNicht(pi){
  const L=S.bestellungen||[];
  if(!L.length) return 'Gerade sind keine Bestellungen offen.';
  if(!L.some(b=>b.st==='offen')) return 'Alle offenen Bestellungen sind schon beim Versandmitarbeiter.';
  const wb=vsWagenBedarf(), mitWare=L.filter(b=>b.st==='offen'&&vsErfuellbar(b,wb));
  if(mitWare.length&&pi!==undefined) return vmFehltText(pi,mitWare[0].gr);
  return 'Für die offenen Bestellungen fehlt gerade die Ware.';
}
/* Welcher Packplatz ist gemeint? Trefferflaeche, Index oder der erste freie */
function vsPlatzAus(ref){
  if(typeof ref==='number') return ref;
  if(ref&&ref.userData&&typeof ref.userData.ref==='number') return ref.userData.ref;
  return 0;
}
function vsSpielerPacken(ref){
  if(!packBereit()) return false;
  vsAbgleich();
  const pi=vsPlatzAus(ref);
  if(pi>=vsAktiv()) return false;
  if(!vsTischFrei(pi)){ toast('Auf dem Packtisch liegt noch ein Paket.'); return false; }
  const b=vsSpielerBestellung(pi);
  if(!b){ toast(vsWarumNicht(pi)); return false; }
  const vorher=b.pos.reduce((a,l)=>a+l.g,0);
  if(!vsEntnehmen(b)) return false;
  vmVerbrauchen(pi,b.gr);
  const pk=vsPaketOffen(b.gr), P0=vsTischPose(pi,b.gr);
  pk.position.set(P0.x,P0.y,P0.z); pk.rotation.y=P0.ry; packTisch.add(pk);
  vsFuellung(pk,vsStueck(b)?vorher/vsStueck(b):0);
  vsPlaetze[pi].tisch={pk,b,pi,spieler:true,phase:'fuellen',t:0.2,fl:0,stueck:Math.max(1,vsStueck(b)-vorher)};
  b.st='tisch'; S.tut.pack=true; sfx.karton();
  return true;
}
/* Sofort, ohne Bild: fuer Tests, Balance-Laeufe und alte Aufrufe */
function packOne(auto){
  if(!packBereit()) return false;
  vsAbgleich();
  /* die aelteste Bestellung, fuer die Ware und ein passender Karton da sind */
  const wb=vsWagenBedarf();
  const b=(S.bestellungen||[]).find(x=>x.st==='offen'&&vsErfuellbar(x,wb)&&vmPlatzMit(x.gr)>=0); if(!b) return false;
  const pi=vmPlatzMit(b.gr);
  if(!vsEntnehmen(b)) return false;
  vmVerbrauchen(pi,b.gr);
  let pz=vsPalZiel(b.gr); if(!pz){ vsZwischenabholung(); pz=vsPalZiel(b.gr); }
  vsBuchen(b,!auto);
  S.paketGr.splice(vsGelandet(),0,b.gr); S.paketP.splice(vsGelandet()-1,0,pz?pz.p:-1); S.pakete=S.paketGr.length;
  syncPakete(); drawPackSchild();
  return true;
}

/* ---------------------------------------------------------
   Der Versandmitarbeiter - einer je Packplatz
   --------------------------------------------------------- */
/* Gehen mit Wachhund: fuehrt der Weg nicht bis ans Ziel (das Raster
   endet vorher), meldet w.vsWeg 'fern'; nach 40 s am selben Ziel 'zeit'.
   Wer gehen laesst, entscheidet dann - nie wieder endlos im Kreis. */
function vsGehen(w,ziel,dt){
  const neu=!w.vsZiel||w.vsZiel.distanceTo(ziel)>0.25;
  if(neu){ w.vsZielT=0; w.vsWeg=null; }
  if(neu||(!w.path.length&&w.pos.distanceTo(ziel)>0.3&&!w.vsWeg)){ w.goTo(ziel); w.vsZiel=ziel.clone();
    const e=w.path.length?w.path[w.path.length-1]:w.pos; w.vsFern=Math.hypot(e.x-ziel.x,e.z-ziel.z)>0.35; }
  w.vsZielT=(w.vsZielT||0)+dt;
  const da=w.walk(dt);
  if(da&&w.pos.distanceTo(ziel)<0.35) return true;
  if(da&&w.vsFern) w.vsWeg='fern';
  else if(w.vsZielT>40) w.vsWeg='zeit';
  return false;
}
/* Ziel nicht erreichbar: aufs Ziel setzen - fuer die Wege zurueck an den
   eigenen Tisch, die es immer geben muss */
function vsNotfalls(w,ziel){ if(!w.vsWeg) return false; w.pos.x=ziel.x; w.pos.z=ziel.z; w.path=[]; w.vsWeg=null; w.vsZiel=null; return true; }
function vsDrehen(w,ry,dt){
  let df=ry-w.g.rotation.y; while(df>Math.PI) df-=Math.PI*2; while(df<-Math.PI) df+=Math.PI*2;
  w.g.rotation.y+=df*Math.min(1,dt*7); return Math.abs(df)<0.12;
}
function vsBlick(w,p,dt){ return vsDrehen(w,Math.atan2(p.x-w.pos.x,p.z-w.pos.z),dt); }
function vsHeim(w){ return vsWelt(w.pp,VS_HEIM.x,VS_HEIM.z); }
function vsLoop(w,dt){
  w.pp=vsPlatzVon(w);
  const g=vsWagenVon(w);
  if(!packTisch||!g) return;
  const wf=w.wf||1;
  if(!packBereit()||w.pp>=vsAktiv()){ if(w.tour) vsAufraeumen(w); vsGehen(w,vsHeim(w),dt); return; }
  vsAufbauAnim(g,dt*wf);
  vsLoopZustand(w,dt,wf,w.tour,g);
  /* erst nach dem Schritt des Mitarbeiters: sonst hing der Wagen ein
     Bild hinterher und in Kurven rutschten die Haende vom Buegel */
  vsWagenUpdate(w,dt);
}
/* Ostende der Gasse vor den Tischen (Stationskoordinaten): hier faedelt der Wagen ein und aus */
const VS_GASSE={x:4.6,z:1.6};
function vsGassePunkt(){ const q=localToWorld(packTisch,VS_GASSE.x,VS_GASSE.z); return V(q.x,0,q.z); }
function vsLoopZustand(w,dt,wf,tour,g){
  const pi=w.pp, P_=vsPlaetze[pi];
  switch(w.vs){
    default: w.vs='heim';
    case 'heim': {
      if(g.userData.modus!=='park'&&!tour) vsWagenModus(g,'park');
      if(vsGehen(w,vsHeim(w),dt)||vsNotfalls(w,vsHeim(w))){ w.vs='bereit'; w.t=0.3; }
      break; }
    case 'bereit': {
      if(w.pos.distanceTo(vsHeim(w))>0.5){ w.vs='heim'; break; }
      vsDrehen(w,vsRy(pi,Math.PI),dt);
      w.t-=dt; if(w.t>0) break; w.t=0.8;
      if(P_.tisch&&P_.tisch.spieler) break;
      const plan=vsPlan(pi); if(!plan) break;
      plan.auf.forEach(a=>{ a.b.st='wagen'; });
      w.tour=plan; w.k=0; w.t=0.2; w.vs='aufbauen';
      break; }
    case 'aufbauen': {
      /* fuer jede Bestellung einen Karton aus dem Regal nehmen, auf dem
         Wagen aufstellen, Klappen offen */
      vsBlick(w,vsWelt(pi,WG_PARK.x,WG_PARK.z),dt);
      w.t-=dt*wf; if(w.t>0) break;
      const a=tour.auf[w.k];
      if(a){
        if(!vmVerbrauchen(pi,a.b.gr)){ a.b.st='offen'; tour.auf.splice(w.k,1); break; }
        const pk=vsPaketOffen(a.b.gr), f=a.felder.map(vsFeld);
        pk.position.set(f.reduce((s,q)=>s+q.x,0)/f.length,WG_Y+VS_GR[a.b.gr].h/2+0.002,f.reduce((s,q)=>s+q.z,0)/f.length);
        pk.scale.set(1,0.08,1); pk.position.y=WG_Y+0.002+VS_GR[a.b.gr].h/2*0.08; pk.userData.auf=0; vsFuellung(pk,vsAnteil(a.b));
        g.add(pk); a.pk=pk; w.k++; w.t=0.32; sfx.pop(); break; }
      if(!tour.auf.length){ w.tour=null; w.vs='bereit'; w.t=0.5; break; }
      /* Wege erst jetzt planen: die Ware kann sich bewegt haben */
      tour.stops=vsStopsBauen(vsBedarf(tour),vsWelt(pi,WG_GRIFF.x,WG_GRIFF.z)); tour.si=0;
      w.vs='ankoppeln'; break; }
    case 'ankoppeln': {
      if(!vsGehen(w,vsWelt(pi,WG_GRIFF.x,WG_GRIFF.z),dt)&&!vsNotfalls(w,vsWelt(pi,WG_GRIFF.x,WG_GRIFF.z))) break;
      if(!vsDrehen(w,vsRy(pi,WG_PARK.ry),dt)) break;
      vsWagenModus(g,'schieben'); w.vs='fahren'; break; }
    case 'fahren': {
      const s=tour.stops[tour.si];
      if(!s){ vsNachplanen(w); break; }
      w.src=s.kind==='rack'?{slot:s.ref}:s.kind==='floor'?{box:s.ref}:null;
      if(!vsWagenFertig(g)) { vsBlick(w,s.stand,dt); break; }
      /* erst durch die Gasse vor der Tischreihe zum Ostende (Waypoint): sonst schneidet der Wagen beim Anfahren die Tischecke */
      if(VS_PP[pi].s>0&&tour&&!tour.gasse){ const Gp=vsGassePunkt();
        if(!vsGehen(w,Gp,dt)&&!vsNotfalls(w,Gp)&&w.pos.distanceTo(Gp)>0.8) break; tour.gasse=true; }
      if(!vsGehen(w,s.stand,dt)){
        /* der Stand ist nicht (mehr) erreichbar - etwa weil ein Regal
           umgestellt wurde: diese Stelle auslassen, nachgeplant wird am Ende */
        if(w.vsWeg){ w.vsWeg=null; w.vsZiel=null; tour.si++; w.src=null; }
        break; }
      const nx=tour.stops[tour.si+1], weiter=nx?nx.stand:vsWelt(pi,WG_GRIFF.x,WG_GRIFF.z);
      vsWagenModus(g,'stehen',vsWagenStand(w.pos,s.look,weiter)); w.vs='greifen'; w.t=0.3; break; }
    case 'greifen': {
      const s=tour.stops[tour.si];
      vsBlick(w,s.look,dt);
      if(w.flug){ vsFlug(w,dt); break; }
      w.t-=dt; if(w.t>0) break;
      const a=s.done<s.k?tour.auf.find(x=>x.b.pos.some(l=>l.t===s.t&&l.g<l.n)):null;
      const von=a?vsNimm(s.kind,s.ref,s.t):null;
      if(!von){ tour.si++; w.src=null; vsWagenModus(g,'schieben'); w.vs='fahren'; break; }
      /* gebucht wird beim Griff, nicht bei der Landung: faellt der
         Flug weg (Speichern, Kuendigung), ist das Stueck trotzdem im Karton */
      const l=a.b.pos.find(x=>x.t===s.t&&x.g<x.n);
      l.g++; s.done++;
      w.flug={m:einrStueck(s.t),von:von.p,q:von.q,t:0,a,l,s};
      w.flug.m.matrix.compose(von.p,von.q,_vs.setScalar(1)); w.flug.m.matrixWorldNeedsUpdate=true;
      break; }
    case 'zurueck': {
      w.src=null;
      if(!vsWagenFertig(g)) break;
      /* kurz vor dem Tisch rollt der Wagen auf seinen Platz, der
         Mitarbeiter geht allein weiter - vorher drehte er sich mit dem
         Wagen am Griffpunkt und schwenkte ihn quer durch den Tisch */
      const G=vsWelt(pi,WG_GRIFF.x,WG_GRIFF.z);
      if(VS_PP[pi].s>0&&w.tour&&!w.tour.gasseZu&&w.pos.distanceTo(G)>3.5){ const Gp=vsGassePunkt();
        if(w.pos.distanceTo(Gp)>0.9){ if(!vsGehen(w,Gp,dt)) vsNotfalls(w,Gp); break; } w.tour.gasseZu=true; }
      if(w.pos.distanceTo(G)<1.4){ vsWagenModus(g,'park'); w.vs='parken'; break; }
      if(!vsGehen(w,G,dt)) vsNotfalls(w,G); break; }
    case 'parken': {
      if(!vsGehen(w,vsHeim(w),dt)&&!vsNotfalls(w,vsHeim(w))) break;
      if(g.parent!==packTisch) break;
      if(!vsDrehen(w,vsRy(pi,Math.PI),dt)) break;
      w.k=0; w.t=0.2; w.vs='abladen'; break; }
    case 'abladen': {
      vsDrehen(w,vsRy(pi,Math.PI),dt);
      w.t-=dt; if(w.t>0) break;
      const a=tour.auf[w.k];
      if(!a){ w.tour=null; w.vs='bereit'; w.t=0.5; break; }
      if(!a.pk){ w.k++; break; }
      const fertig=a.b.pos.every(l=>l.g>=l.n);
      if(!fertig){
        /* Ware fehlte: der angefangene Karton kommt unter den Tisch,
           die Bestellung wartet mit dem, was schon drin ist; der Karton
           geht zurueck ins Regal */
        a.pk.parent.remove(a.pk); a.pk=null; a.b.st='offen'; vmZurueck(pi,a.b.gr); w.k++; w.t=0.25; break; }
      if(!vsTischFrei(pi)) break;
      vsTischStart(pi,a.pk,a.b,false); a.pk=null; w.k++; w.t=0.3;
      break; }
  }
}
/* Kartons auf dem Wagen falten sich auf */
function vsAufbauAnim(g,dt){
  for(const pk of g.children){ const u=pk.userData; if(!u||u.auf===undefined||u.auf>=1) continue;
    u.auf=Math.min(1,u.auf+dt/0.3); const s=Math.max(0.08,vsGlatt(u.auf));
    pk.scale.y=s; pk.position.y=WG_Y+0.002+VS_GR[u.gr].h/2*s; }
}
/* Fehlte unterwegs etwas, sucht er einmal neu - sonst zurueck */
function vsNachplanen(w){
  const tour=w.tour;
  const need=vsBedarf(tour);
  if(Object.keys(need).length&&tour.runde<2){
    tour.runde++;
    const neu=vsStopsBauen(need,w.pos,vsWelt(w.pp,WG_GRIFF.x,WG_GRIFF.z)).filter(s=>s.k>0);
    if(neu.length){ tour.stops=tour.stops.concat(neu); return; }
  }
  w.vs='zurueck';
}
function vsFlug(w,dt){
  const f=w.flug, pk=f.a.pk, G=VS_GR[f.a.b.gr], g=vsWagenVon(w);
  f.t+=dt*(w.wf||1)/0.42;
  const k=vsGlatt(f.t);
  pk.updateMatrixWorld(true); const z=pk.getWorldPosition(new THREE.Vector3()); z.y+=G.h/2-0.03;
  _vp.copy(f.von).lerp(z,k); _vp.y+=Math.sin(Math.PI*Math.min(1,f.t))*0.28;
  _vq2.setFromAxisAngle(_vY,g.rotation.y); _vq.copy(f.q).slerp(_vq2,k);
  f.m.matrix.compose(_vp,_vq,_vs.setScalar(1-0.25*Math.max(0,(k-0.7)/0.3))); f.m.matrixWorldNeedsUpdate=true;
  if(f.t>=1){
    scene.remove(f.m); w.flug=null;
    vsFuellung(pk,vsAnteil(f.a.b));
    if(Math.random()<0.5) sfx.pop();
    w.t=0.12/(w.wf||1);
  }
}
/* Haltung: beide Haende am Buegel beim Schieben, beim Greifen
   reicht der rechte Arm zum Fach */
function vsPose(w,dt){
  const u=w.g.userData; if(!u||!u.arms) return;
  const g=vsWagenVon(w);
  const schiebt=g&&g.userData.modus==='schieben'&&g.parent!==packTisch;
  let z=null, k=Math.min(1,dt*9);
  /* Oberarm leicht vor, Ellbogen gebeugt: die Haende liegen am Buegel
     (Schulter 1,45 m, Buegel 1,10 m und 0,35 m vor dem Koerper) */
  if(schiebt&&!w.flug) z=[-0.35,-0.35,0.08,-0.08];
  else if(w.flug){
    const gg=Math.sin(Math.PI*Math.min(1,w.flug.t*1.6));
    w.g.updateMatrixWorld(); _vp.copy(w.flug.von); w.g.worldToLocal(_vp);
    const reich=-Math.atan2(Math.max(0.15,_vp.z),1.45-_vp.y);
    z=[-0.35,-0.35+(reich+0.35)*gg,0.07,-0.07]; k=Math.min(1,dt*16);
  }
  else if(w.vs==='aufbauen'||(w.vs==='abladen'&&w.tour)) z=[-1.05,-1.05,0.07,-0.07];
  /* animPerson zieht jedes Bild zur Schrittbewegung - deshalb hier
     setzen statt nur anzustossen, sonst haengen die Arme halb */
  const unterarm=i=>u.arms[i].children.find(c=>c.isGroup);
  const beuge=schiebt&&!w.flug?-0.95:-0.18;
  for(const i of [0,1]){ const fa=unterarm(i); if(fa) fa.rotation.x+=(beuge-fa.rotation.x)*Math.min(1,dt*9); }
  if(!z){ if(w.armX){ u.arms[0].rotation.z=0; u.arms[1].rotation.z=0; } w.armX=null; return; }
  if(!w.armX) w.armX=[u.arms[0].rotation.x,u.arms[1].rotation.x];
  for(const i of [0,1]){ w.armX[i]+=(z[i]-w.armX[i])*k; u.arms[i].rotation.x=w.armX[i]; u.arms[i].rotation.z=z[2+i]; }
}
/* Kuendigung, Pause, Laden: nichts darf auf dem Wagen haengen bleiben */
function vsAufraeumen(w){
  const pi=vsPlatzVon(w);
  if(w.flug){ scene.remove(w.flug.m); w.flug=null; }
  /* Kartons, die schon auf dem Wagen standen, gehen zurueck ins Regal */
  if(w.tour) w.tour.auf.forEach(a=>{ if(a.pk){ if(a.pk.parent) a.pk.parent.remove(a.pk); vmZurueck(pi,a.b.gr); } a.pk=null; if(a.b.st==='wagen') a.b.st='offen'; });
  w.tour=null; w.src=null; w.vs='heim';
  if(vsPlaetze[pi]&&packTisch) vsParken(pi,true);
}
function vsStatusVon(w){
  const tour=w.tour, n=tour?tour.auf.length:0;
  switch(w.vs){
    case 'aufbauen': return `stellt ${n} Karton${n===1?'':'s'} auf den Wagen`;
    case 'ankoppeln': case 'fahren': case 'greifen': {
      const s=tour&&tour.stops[tour.si];
      return `pickt ${s?(s.lager?'im Lager':'im Laden'):''} · ${tour?Math.min(tour.si+1,tour.stops.length):0}/${tour?tour.stops.length:0} Stellen`; }
    case 'zurueck': case 'parken': return 'bringt den Wagen zum Packtisch';
    case 'abladen': return 'verpackt am Tisch';
    default: {
      if((S.offen|0)<=0) return 'wartet auf Bestellungen';
      const wb=vsWagenBedarf(), mitWare=(S.bestellungen||[]).filter(b=>b.st==='offen'&&vsErfuellbar(b,wb));
      if(mitWare.length&&!mitWare.some(b=>vmReicht(w.pp|0,b.gr))) return vmFehltText(w.pp|0,mitWare[0].gr);
      return 'wartet auf Ware für die offenen Bestellungen'; }
  }
}
function vsStatus(){
  const viele=!!(staff.packer2||staff.packer3);
  const L=VS_PACKER.map((id,i)=>staff[id]?(viele?`Platz ${i+1}: `:'')+vsStatusVon(staff[id]):null).filter(Boolean);
  return L.length?L.join(' · '):null;
}

/* ---------------------------------------------------------
   Takt: Bestellungen kommen herein, Tische, Band und Portal laufen
   --------------------------------------------------------- */
function updateVersand(dt){
  const auf=zoneOffen('packstation');
  vsPlaetze.forEach((P_,i)=>{ if(P_&&P_.wagen) P_.wagen.visible=auf&&i<vsAktiv(); });
  if(!packBereit()){ versandT=0; return; }
  vsAbgleich();
  if(phase==='open'){
    const n=bestellungenProTag(); if(n>0){
      versandT-=dt;
      if(versandT<=0){ versandT=330/n;
        const b=vsNeueBestellung(false);
        if(b){ S.bestellungen.push(b); vsSync(); drawPackSchild(); }
      }
    }
  }
  vsTischUpdate(dt);
  vsBahnUpdate(dt);
}
/* Nach dem Laden: angefangene Touren gibt es nicht mehr */
function vsLaden(){
  S.bestellungen=(Array.isArray(S.bestellungen)?S.bestellungen:[]).filter(b=>b&&Array.isArray(b.pos)).map(b=>{
    const pos=b.pos.filter(l=>l&&P[l.t]&&l.n>0).map(l=>({t:l.t,n:l.n|0,g:Math.max(0,Math.min(l.n|0,l.g|0))}));
    return pos.length?{id:b.id|0,pos,gr:[1,3,6].indexOf(b.gr)>=0?b.gr:vsKlasse(pos),wert:r2(+b.wert||vsWertVon(pos)),versand:r2(Math.max(0,+b.versand||0)),st:'offen',tag:b.tag|0}:null; }).filter(Boolean).slice(0,80);
  S.paketGr=(Array.isArray(S.paketGr)?S.paketGr:[]).map(g=>[1,3,6].indexOf(g)>=0?g:1).slice(0,300);
  if(!S.paketGr.length&&(S.pakete|0)>0) for(let i=0;i<Math.min(300,S.pakete|0);i++) S.paketGr.push(1);
  S.pakete=S.paketGr.length;
  if(typeof vsPalLaden==='function') vsPalLaden();
  vsCfg();
  /* alter Spielstand kannte nur eine Zahl: vsAbgleich gibt ihr Inhalt */
  if(S.bestellungen.length||!(S.offen|0)) S.offen=S.bestellungen.length;
  VS_PACKER.forEach(id=>{ if(staff[id]) vsAufraeumen(staff[id]); });
  vsBahn.forEach(e=>{ if(e.m.parent) e.m.parent.remove(e.m); }); vsBahn.length=0;
  vsPortalRuhe();
  vsPlaetze.forEach((P_,i)=>{ if(!P_) return;
    const T=P_.tisch; if(T){ if(T.pk.parent) T.pk.parent.remove(T.pk); if(T.flug) scene.remove(T.flug.m); P_.tisch=null; }
    if(P_.wagen){ [...P_.wagen.children].forEach(c=>{ if(c.userData&&c.userData.klappen) P_.wagen.remove(c); }); vsParken(i,true); } });
  if(typeof packStufeAnwenden==='function'&&packTisch) packStufeAnwenden();
  if(typeof vmLaden==='function') vmLaden();
}
