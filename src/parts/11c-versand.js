/* =========================================================
   Versand mit Kommissionierwagen (Tom, 25.09.): Onlinebestellungen
   haben jetzt einen Inhalt. Der Versandmitarbeiter schiebt einen
   Rollwagen mit sechs Faechern durchs Lager - und wenn dort nichts
   liegt, durch den Laden -, stellt fuer jede Bestellung einen
   offenen Karton auf den Wagen und legt jedes Stueck einzeln
   hinein. Am Packtisch gehen die Klappen zu, Klebeband drueber,
   Etikett drauf, dann laeuft das Paket ueber die Rollenbahn und
   landet auf dem Stapel der Paketablage.
     klein  - ein Fach,  sechs passen auf den Wagen
     gross  - eine Reihe aus drei Faechern, also zwei je Tour
     riesig - der ganze Wagen, eines je Tour
   ========================================================= */
const VS_GR={
  1:{id:1,name:'klein', felder:1,x:0.28,z:0.26,h:0.20,vmax:8,  mass:0.30,zeilen:2,stueck:4,lage:6},
  3:{id:3,name:'groß',  felder:3,x:0.29,z:0.86,h:0.28,vmax:35, mass:0.86,zeilen:3,stueck:6,lage:2},
  6:{id:6,name:'riesig',felder:6,x:0.62,z:0.86,h:0.40,vmax:120,mass:0.86,zeilen:2,stueck:3,lage:1}};
/* Wagen in Tischkoordinaten: rechts vor dem Packtisch geparkt */
const WG_PARK={x:1.3,z:0.93,ry:Math.PI/2}, WG_Y=0.78, WG_ABST=0.845, WG_GRIFF={x:1.3-0.845,z:0.93};
/* Paketablage: vier Stapelfelder. Die hintere Spalte zuerst - sonst
   flogen Pakete fuer das zweite Feld quer durch den vollen Stapel */
const VS_FELD=[{x:5.42,z:-0.55},{x:5.42,z:0.13},{x:4.48,z:-0.55},{x:4.48,z:0.13}], VS_HMAX=1.1;
/* Wo das Paket auf dem Tisch zugeklebt wird, und das Ende der Rollenbahn */
const VS_TISCH={x:-0.2,z:0.1}, VS_BAHN_ENDE=3.62;
let versandT=0, vsWagen=null, vsTisch=null;
const vsBahn=[];
const _vp=new THREE.Vector3(), _vq=new THREE.Quaternion(), _vq2=new THREE.Quaternion(), _vs=new THREE.Vector3(), _vY=new THREE.Vector3(0,1,0);
const vsGlatt=t=>{ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
function vsWinkel(a,b,t){ let d=b-a; while(d>Math.PI) d-=Math.PI*2; while(d<-Math.PI) d+=Math.PI*2; return a+d*t; }

/* ---------------------------------------------------------
   Bestellungen
   --------------------------------------------------------- */
function paketWert(){
  const L=(S&&S.bestellungen)||[];
  if(L.length) return r2(L.reduce((a,b)=>a+b.wert,0)/L.length);
  return r2(12+S.level*0.6);
}
function bestellungenProTag(){
  if(!packBereit()) return 0;
  return Math.max(4,Math.min(22,Math.round(4+S.rep*0.12+S.level*0.35)));
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
function vsQuellen(t){
  const L=[];
  if(!(typeof reservedType==='function'&&reservedType(t))){
    for(const r of racks) for(const s of r.slots) if(s.box&&s.box.type===t&&s.box.count>0&&!vsBelegt(s)) L.push({kind:'rack',ref:s,n:s.box.count,lager:true});
    for(const b of floorBoxes) if(b.type===t&&b.count>0&&!vsTestKarton(b)&&!vsBelegt(b)) L.push({kind:'floor',ref:b,n:b.count,lager:true});
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
      S.bestNr=(S.bestNr|0)+1;
      return {id:S.bestNr,pos,gr:vsKlasse(pos),wert:vsWertVon(pos),st:'offen',tag:S.day};
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
}
/* Kann die Bestellung aus dem Bestand bedient werden? schon: was
   diese Tour fuer andere Bestellungen bereits verplant hat */
/* Was die laufende Wagentour noch holen muss - das darf der Spieler
   am Tisch nicht wegpacken */
function vsWagenBedarf(){ const n={}; for(const b of S.bestellungen||[]) if(b.st==='wagen') for(const l of b.pos) n[l.t]=(n[l.t]||0)+Math.max(0,l.n-l.g); return n; }
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
   Kommissionierwagen
   --------------------------------------------------------- */
function vsFeld(i){ return {x:(Math.floor(i/3)-0.5)*0.33,z:(i%3-1)*0.3}; }
function vsWagenBauen(parent){
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
  g.userData={modus:'park',t:1,von:null,pose:null};
  vsWagen=g; vsParken(true,parent);
  return g;
}
/* Wagen sofort an seinen Platz am Tisch haengen */
function vsParken(sofort,parent){
  const g=vsWagen, T=parent||packTisch; if(!g||!T) return;
  if(g.parent!==T){ if(g.parent) g.parent.remove(g); T.add(g); }
  g.position.set(WG_PARK.x,0,WG_PARK.z); g.rotation.set(0,WG_PARK.ry,0);
  const u=g.userData; u.modus='park'; u.t=1; u.von=null;
  /* geparkt ist der Wagen ein Hindernis wie der Tisch */
  if(typeof packMov!=='undefined'&&packMov&&grabbed!==packMov) applyFootprint(packMov);
}
function vsWagenWelt(){
  const g=vsWagen; g.updateMatrixWorld(true);
  const p=new THREE.Vector3(); g.getWorldPosition(p);
  const ry=g.parent===packTisch?packTisch.rotation.y+g.rotation.y:g.rotation.y;
  return {p:V(p.x,0,p.z),ry};
}
function vsWagenModus(m,pose){
  const g=vsWagen, u=g.userData; if(!g) return;
  const jetzt=vsWagenWelt();
  if(g.parent!==scene){ if(g.parent) g.parent.remove(g); scene.add(g); g.position.copy(jetzt.p); g.rotation.set(0,jetzt.ry,0);
    if(packMov&&grabbed!==packMov) applyFootprint(packMov); }
  u.von=jetzt; u.t=0; u.modus=m; u.pose=pose||null;
}
function vsWagenZiel(w){
  const u=vsWagen.userData;
  if(u.modus==='park') return {p:localToWorld(packTisch,WG_PARK.x,WG_PARK.z),ry:packTisch.rotation.y+WG_PARK.ry};
  if(u.modus==='stehen'&&u.pose) return u.pose;
  const ry=w.g.rotation.y;
  return {p:V(w.pos.x+Math.sin(ry)*WG_ABST,0,w.pos.z+Math.cos(ry)*WG_ABST),ry};
}
function vsWagenUpdate(w,dt){
  const g=vsWagen, u=g.userData;
  if(g.parent===packTisch) return;
  const z=vsWagenZiel(w);
  u.t=Math.min(1,u.t+dt*(w.wf||1)/0.45);
  const e=vsGlatt(u.t), a=u.von||z;
  g.position.set(a.p.x+(z.p.x-a.p.x)*e,0,a.p.z+(z.p.z-a.p.z)*e);
  g.rotation.set(0,vsWinkel(a.ry,z.ry,e),0);
  /* geparkt blockiert er: der Weg des Mitarbeiters wird neu gesucht */
  if(u.modus==='park'&&u.t>=1){ vsParken(true); w.vsZiel=null; }
}
function vsWagenFertig(){ const u=vsWagen.userData; return u.t>=1; }
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
function vsPlan(){
  const belegt=[null,null,null,null,null,null], auf=[], schon={};
  for(const b of S.bestellungen||[]){
    if(b.st!=='offen') continue;
    if(!vsErfuellbar(b,schon)) continue;
    const f=vsFelderFuer(belegt,b.gr); if(!f) continue;
    f.forEach(i=>belegt[i]=b); auf.push({b,felder:f,pk:null});
    for(const l of b.pos) schon[l.t]=(schon[l.t]||0)+Math.max(0,l.n-l.g);
    if(belegt.every(Boolean)) break;
  }
  if(!auf.length) return null;
  return {auf,stops:[],runde:0};
}
function vsBedarf(tour){ const need={}; for(const a of tour.auf) for(const l of a.b.pos){ const n=l.n-l.g; if(n>0) need[l.t]=(need[l.t]||0)+n; } return need; }
function vsQuellPunkt(q){
  if(q.kind==='rack'){ const s=q.ref, K=rackKindOf(s.rk);
    const look=localToWorld(s.rk.g,s.x,0); look.y=s.y+0.2;
    return {stand:localToWorld(s.rk.g,s.x,K.zo+0.62),look}; }
  if(q.kind==='floor'){ const m=q.ref.mesh.position, T=localToWorld(packTisch,WG_GRIFF.x,WG_GRIFF.z);
    let best=null,bd=1e9;
    for(let k=0;k<8;k++){ const a=k*Math.PI/4, x=m.x+Math.sin(a)*0.75, z=m.z+Math.cos(a)*0.75;
      if(!navFrei(navIdx(x,z))) continue; const d=Math.hypot(x-T.x,z-T.z); if(d<bd){ bd=d; best=V(x,0,z); } }
    if(!best){ const id=navNah(m.x,m.z); best=id>=0?navPos(id):V(m.x,0,m.z+0.75); }
    return {stand:best,look:V(m.x,m.y,m.z)}; }
  const lv=q.ref, h=lv.items[lv.items.length-1];
  const mm=itemMatrix(lv.sh,lv,Math.max(0,lv.count-1),h?h.jit||0:0); mm.decompose(_vp,_vq,_vs);
  return {stand:shelfStand(lv.sh,lv),look:_vp.clone()};
}
function vsStopsBauen(need,von){
  const stops=[];
  for(const t in need){
    let n=need[t];
    /* Lager vor Laden; ein Karton, der allein reicht, vor mehreren */
    const Q=vsQuellen(t).sort((a,b)=>(b.lager-a.lager)||((b.n>=n)-(a.n>=n))||(a.n-b.n));
    for(const q of Q){ if(n<=0) break; const k=Math.min(n,q.n); n-=k;
      const pt=vsQuellPunkt(q); stops.push({kind:q.kind,ref:q.ref,t,k,done:0,stand:pt.stand,look:pt.look,lager:q.lager}); }
  }
  /* naechster Nachbar ab dem Tisch, Lager vor Laden */
  const out=[]; let p=von;
  for(const lag of [true,false]){
    const L=stops.filter(s=>s.lager===lag);
    while(L.length){ let bi=0,bd=1e9; L.forEach((s,i)=>{ const d=Math.hypot(s.stand.x-p.x,s.stand.z-p.z); if(d<bd){ bd=d; bi=i; } });
      const s=L.splice(bi,1)[0]; out.push(s); p=s.stand; }
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
    s.box.count--; if(s.box.count<=0){ s.rk.g.remove(s.box.mesh); s.box=null; }
    drawRackSchild(s.rk); return {p,q}; }
  const b=ref; if(floorBoxes.indexOf(b)<0||b.type!==t||b.count<=0) return null;
  const p=b.mesh.position.clone(); p.y+=0.12; const q=new THREE.Quaternion().setFromAxisAngle(_vY,b.mesh.rotation.y);
  b.count--; if(b.count<=0) removeFloorBox(b);
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
   Buchen, Rollenbahn, Stapel
   --------------------------------------------------------- */
function vsBuchen(b,spieler){
  const w=b.wert;
  S.money=r2(S.money+w); S.seasonRevenue=r2((S.seasonRevenue||0)+w);
  DS.revenue=r2(DS.revenue+w); DS.versand=r2((DS.versand||0)+w);
  goalAdd('rev',w); goalAdd('sold',vsStueck(b));
  b.pos.forEach(l=>statVerkauf(l.t,l.n));
  statAdd('pakete',1);
  const i=S.bestellungen.indexOf(b); if(i>=0) S.bestellungen.splice(i,1);
  vsSync(); drawPackSchild();
  if(spieler){ addXP(3); sfx.cash(); toast(`Paket #${b.id} fertig: +${eur(w)}`,'money'); }
}
/* Lage jedes Pakets auf der Ablage. Felder nacheinander, je Lage
   nur eine Groesse: sechs kleine, zwei grosse oder ein riesiges. */
function vsStapel(liste){
  const out=[]; let f=0, H=0, lag=null;
  for(let i=0;i<liste.length;i++){
    const G=VS_GR[liste[i]]||VS_GR[1];
    if(f>=VS_FELD.length){ out.push(null); continue; }
    if(!lag||lag.gr!==G.id||lag.n>=G.lage){
      if(lag) H=lag.y0+lag.h;
      if(H+G.h>VS_HMAX){ f++; H=0; }
      if(f>=VS_FELD.length){ out.push(null); continue; }
      lag={gr:G.id,n:0,y0:H,h:G.h};
    }
    const F=VS_FELD[f], k=lag.n++;
    let dx=0, dz=0;
    if(G.id===1){ dx=(k%3-1)*0.28; dz=(Math.floor(k/3)-0.5)*0.3; }
    else if(G.id===3) dz=(k-0.5)*0.31;
    const j=Math.sin((i+1)*12.9898)*43758.5453, jr=j-Math.floor(j)-0.5;
    out.push({x:F.x+dx+jr*0.008,y:lag.y0+G.h/2+0.022,z:F.z+dz-jr*0.006,ry:Math.PI/2+jr*0.024,gr:G.id});
  }
  return out;
}
function syncPakete(){
  if(!packTisch||!S) return;
  S.paketGr=Array.isArray(S.paketGr)?S.paketGr:[];
  if((S.pakete|0)!==S.paketGr.length) vsAbgleich();
  while(pakete.length){ const m=pakete.pop(); if(m.parent) m.parent.remove(m); }
  const n=Math.max(0,S.paketGr.length-vsBahn.length);
  vsStapel(S.paketGr.slice(0,n)).forEach(p=>{ if(!p) return;
    const m=vsPaketZu(p.gr); m.position.set(p.x,p.y,p.z); m.rotation.y=p.ry; packTisch.add(m); pakete.push(m); });
}
function vsGelandet(){ return Math.max(0,(S.paketGr||[]).length-vsBahn.length); }
/* Ablage voll: DDL faehrt zwischendurch vor und nimmt mit, was liegt */
function vsZwischenabholung(){
  const n=vsGelandet(); if(n<=0) return 0;
  S.paketGr.splice(0,n); S.pakete=S.paketGr.length; statAdd('ddl',n);
  syncPakete(); drawPackSchild();
  toast('Die Paketablage war voll - DDL hat zwischendurch abgeholt.');
  return n;
}
/* Tagesende: DDL holt alles ab, auch was noch auf der Bahn laeuft */
function ddlAbholung(){
  vsBahn.forEach(e=>{ if(e.m.parent) e.m.parent.remove(e.m); }); vsBahn.length=0;
  S.paketGr=Array.isArray(S.paketGr)?S.paketGr:[];
  const n=S.paketGr.length; if(n<=0){ S.pakete=0; return 0; }
  statAdd('ddl',n);
  S.paketGr=[]; S.pakete=0; syncPakete(); drawPackSchild();
  return n;
}
/* Das fertige Paket gehoert jetzt auf die Rampe; die Bahn bringt es hin */
function vsAufDieBahn(m,gr){
  S.paketGr.push(gr); S.pakete=S.paketGr.length;
  vsBahn.push({m,gr,phase:'rollen',t:0,von:null,ziel:null});
  drawPackSchild();
}
function vsBahnUpdate(dt){
  let vorne=VS_BAHN_ENDE+10;
  for(let i=0;i<vsBahn.length;i++){
    const e=vsBahn[i], G=VS_GR[e.gr], L=G.z, m=e.m;
    if(e.phase==='rollen'){
      const ende=Math.min(VS_BAHN_ENDE-L/2+0.1,vorne-0.04-L/2);
      m.position.x=Math.min(ende,m.position.x+dt*0.95);
      m.position.y=(m.position.x-L/2>1.3?0.935:0.95)+G.h/2;
      m.position.z+=((m.position.x>1.3?0:VS_TISCH.z)-m.position.z)*Math.min(1,dt*6);
      m.rotation.y=vsWinkel(m.rotation.y,Math.PI/2,Math.min(1,dt*6));
      vorne=m.position.x-L/2;
      if(i===0&&m.position.x>=VS_BAHN_ENDE-L/2+0.09){
        let pl=vsStapel(S.paketGr.slice(0,vsGelandet()+1))[vsGelandet()];
        if(!pl){ vsZwischenabholung(); pl=vsStapel(S.paketGr.slice(0,1))[0]; }
        e.phase='heben'; e.t=0; e.von={x:m.position.x,y:m.position.y,z:m.position.z,ry:m.rotation.y}; e.ziel=pl;
        e.hoch=VS_HMAX+G.h/2+0.06;
      }
    } else if(e.phase==='heben'){
      /* hoch ueber alle Stapel, hinueber, dann senkrecht absetzen -
         im flachen Bogen streifte es fertige Stapel und Nachbarn */
      e.t+=dt/0.8; const a=e.von, z=e.ziel, k=vsGlatt((e.t-0.15)/0.55);
      const y=e.t<0.35?a.y+(e.hoch-a.y)*vsGlatt(e.t/0.35):e.t<0.72?e.hoch:e.hoch+(z.y-e.hoch)*vsGlatt((e.t-0.72)/0.28);
      m.position.set(a.x+(z.x-a.x)*k,y,a.z+(z.z-a.z)*k);
      m.rotation.y=vsWinkel(a.ry,z.ry,k);
      vorne=VS_BAHN_ENDE+10;
      if(e.t>=1){ if(m.parent) m.parent.remove(m); vsBahn.splice(i,1); i--;
        syncPakete(); if(typeof sfx!=='undefined') sfx.thump(0.25); }
    }
  }
}
/* ---------------------------------------------------------
   Der Packtisch: Paket drauf, Klappen zu, Klebeband, Etikett, ab
   auf die Rollenbahn. Mitarbeiter und Spieler benutzen ihn gleich.
   --------------------------------------------------------- */
function vsTischPose(gr){ return {x:VS_TISCH.x,y:0.95+VS_GR[gr].h/2,z:VS_TISCH.z,ry:Math.PI/2}; }
function vsTischStart(pk,b,spieler){
  /* in Tischkoordinaten umhaengen, Weltlage behalten */
  packTisch.updateMatrixWorld(true); pk.updateMatrixWorld(true);
  const p=pk.getWorldPosition(new THREE.Vector3()); pk.getWorldQuaternion(_vq);
  const ry=2*Math.atan2(_vq.y,_vq.w);
  if(pk.parent) pk.parent.remove(pk); packTisch.add(pk);
  packTisch.worldToLocal(p); pk.position.copy(p); pk.rotation.set(0,ry-packTisch.rotation.y,0);
  vsTisch={pk,b,spieler:!!spieler,phase:'heben',t:0,von:{x:p.x,y:p.y,z:p.z,ry:ry-packTisch.rotation.y},ziel:vsTischPose(b.gr),fl:0};
  b.st='tisch';
}
function vsTischUpdate(dt,wf){
  const T=vsTisch; if(!T) return;
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
      const m=einrStueck(l.t), von=localToWorld(packTisch,-0.4+rand(-0.3,0.3),0.62); von.y=1.05;
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
    if(T.t>=1){ T.phase='kleben'; T.t=0; u.band.visible=true; u.band.scale.z=0.001; if(sfx.klebe) sfx.klebe(distVol(localToWorld(packTisch,0,0))); }
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
      if(!T.spieler) geldSchwebt({x:localToWorld(packTisch,VS_TISCH.x,VS_TISCH.z).x,y:-1.0,z:localToWorld(packTisch,VS_TISCH.x,VS_TISCH.z).z},T.b.wert);
      sfx.beep();
      vsAufDieBahn(m,u.gr);
      vsTisch=null;
    }
  }
}
function vsTischFrei(){
  if(vsTisch) return false;
  /* das letzte Paket muss vom Tisch herunter sein */
  const e=vsBahn[vsBahn.length-1];
  return !e||e.phase!=='rollen'||e.m.position.x-VS_GR[e.gr].z/2>1.35;
}
/* Spieler packt am Tisch: aelteste Bestellung, deren Ware da ist */
function vsSpielerBestellung(){
  const wb=vsWagenBedarf();
  for(const b of S.bestellungen||[]) if(b.st==='offen'&&vsErfuellbar(b,wb)) return b;
  return null;
}
/* Warum der Spieler gerade nichts packen kann */
function vsWarumNicht(){
  const L=S.bestellungen||[];
  if(!L.length) return 'Gerade sind keine Bestellungen offen.';
  if(!L.some(b=>b.st==='offen')) return 'Alle offenen Bestellungen sind schon beim Versandmitarbeiter.';
  return 'Für die offenen Bestellungen fehlt gerade die Ware.';
}
function vsSpielerPacken(){
  if(!packBereit()) return false;
  vsAbgleich();
  if(!vsTischFrei()){ toast('Auf dem Packtisch liegt noch ein Paket.'); return false; }
  const b=vsSpielerBestellung();
  if(!b){ toast(vsWarumNicht()); return false; }
  const vorher=b.pos.reduce((a,l)=>a+l.g,0);
  if(!vsEntnehmen(b)) return false;
  const pk=vsPaketOffen(b.gr), P0=vsTischPose(b.gr);
  pk.position.set(P0.x,P0.y,P0.z); pk.rotation.y=P0.ry; packTisch.add(pk);
  vsFuellung(pk,vsStueck(b)?vorher/vsStueck(b):0);
  vsTisch={pk,b,spieler:true,phase:'fuellen',t:0.2,fl:0,stueck:Math.max(1,vsStueck(b)-vorher)};
  b.st='tisch'; S.tut.pack=true;
  return true;
}
/* Sofort, ohne Bild: fuer Tests, Balance-Laeufe und alte Aufrufe */
function packOne(auto){
  if(!packBereit()) return false;
  vsAbgleich();
  const b=vsSpielerBestellung(); if(!b) return false;
  if(!vsEntnehmen(b)) return false;
  if(!vsStapel(S.paketGr.concat([b.gr]))[S.paketGr.length]) vsZwischenabholung();
  vsBuchen(b,!auto);
  S.paketGr.push(b.gr); S.pakete=S.paketGr.length;
  syncPakete(); drawPackSchild();
  return true;
}

/* ---------------------------------------------------------
   Der Versandmitarbeiter
   --------------------------------------------------------- */
function vsGehen(w,ziel,dt){
  if(!w.vsZiel||w.vsZiel.distanceTo(ziel)>0.25||(!w.path.length&&w.pos.distanceTo(ziel)>0.3)){ w.goTo(ziel); w.vsZiel=ziel.clone(); }
  const da=w.walk(dt);
  return da&&w.pos.distanceTo(ziel)<0.35;
}
function vsDrehen(w,ry,dt){
  let df=ry-w.g.rotation.y; while(df>Math.PI) df-=Math.PI*2; while(df<-Math.PI) df+=Math.PI*2;
  w.g.rotation.y+=df*Math.min(1,dt*7); return Math.abs(df)<0.12;
}
function vsBlick(w,p,dt){ return vsDrehen(w,Math.atan2(p.x-w.pos.x,p.z-w.pos.z),dt); }
function vsLoop(w,dt){
  if(!packTisch||!vsWagen) return;
  const wf=w.wf||1;
  if(!packBereit()){ if(w.tour) vsAufraeumen(w); vsGehen(w,localToWorld(packTisch,0,0.9),dt); return; }
  vsAufbauAnim(dt*wf);
  const tour=w.tour;
  vsLoopZustand(w,dt,wf,tour);
  /* erst nach dem Schritt des Mitarbeiters: sonst hing der Wagen ein
     Bild hinterher und in Kurven rutschten die Haende vom Buegel */
  vsWagenUpdate(w,dt);
}
function vsLoopZustand(w,dt,wf,tour){
  switch(w.vs){
    default: w.vs='heim';
    case 'heim': {
      if(vsWagen.userData.modus!=='park'&&!tour) vsWagenModus('park');
      if(vsGehen(w,localToWorld(packTisch,0,0.9),dt)){ w.vs='bereit'; w.t=0.3; }
      break; }
    case 'bereit': {
      if(w.pos.distanceTo(localToWorld(packTisch,0,0.9))>0.5){ w.vs='heim'; break; }
      vsDrehen(w,packTisch.rotation.y+Math.PI,dt);
      w.t-=dt; if(w.t>0) break; w.t=0.8;
      if(vsTisch&&vsTisch.spieler) break;
      const plan=vsPlan(); if(!plan) break;
      plan.auf.forEach(a=>{ a.b.st='wagen'; });
      w.tour=plan; w.k=0; w.t=0.2; w.vs='aufbauen';
      break; }
    case 'aufbauen': {
      /* fuer jede Bestellung einen Karton aufstellen, Klappen offen */
      vsBlick(w,localToWorld(packTisch,WG_PARK.x,WG_PARK.z),dt);
      w.t-=dt*wf; if(w.t>0) break;
      const a=tour.auf[w.k];
      if(a){ const pk=vsPaketOffen(a.b.gr), f=a.felder.map(vsFeld);
        pk.position.set(f.reduce((s,q)=>s+q.x,0)/f.length,WG_Y+VS_GR[a.b.gr].h/2+0.002,f.reduce((s,q)=>s+q.z,0)/f.length);
        pk.scale.set(1,0.08,1); pk.position.y=WG_Y+0.002+VS_GR[a.b.gr].h/2*0.08; pk.userData.auf=0; vsFuellung(pk,vsAnteil(a.b));
        vsWagen.add(pk); a.pk=pk; w.k++; w.t=0.32; sfx.pop(); break; }
      /* Wege erst jetzt planen: die Ware kann sich bewegt haben */
      tour.stops=vsStopsBauen(vsBedarf(tour),localToWorld(packTisch,WG_GRIFF.x,WG_GRIFF.z)); tour.si=0;
      w.vs='ankoppeln'; break; }
    case 'ankoppeln': {
      if(!vsGehen(w,localToWorld(packTisch,WG_GRIFF.x,WG_GRIFF.z),dt)) break;
      if(!vsDrehen(w,packTisch.rotation.y+WG_PARK.ry,dt)) break;
      vsWagenModus('schieben'); w.vs='fahren'; break; }
    case 'fahren': {
      const s=tour.stops[tour.si];
      if(!s){ vsNachplanen(w); break; }
      w.src=s.kind==='rack'?{slot:s.ref}:s.kind==='floor'?{box:s.ref}:null;
      if(!vsWagenFertig()) { vsBlick(w,s.stand,dt); break; }
      if(!vsGehen(w,s.stand,dt)) break;
      const nx=tour.stops[tour.si+1], weiter=nx?nx.stand:localToWorld(packTisch,WG_GRIFF.x,WG_GRIFF.z);
      vsWagenModus('stehen',vsWagenStand(w.pos,s.look,weiter)); w.vs='greifen'; w.t=0.3; break; }
    case 'greifen': {
      const s=tour.stops[tour.si];
      vsBlick(w,s.look,dt);
      if(w.flug){ vsFlug(w,dt); break; }
      w.t-=dt; if(w.t>0) break;
      const a=s.done<s.k?tour.auf.find(x=>x.b.pos.some(l=>l.t===s.t&&l.g<l.n)):null;
      const von=a?vsNimm(s.kind,s.ref,s.t):null;
      if(!von){ tour.si++; w.src=null; vsWagenModus('schieben'); w.vs='fahren'; break; }
      /* gebucht wird beim Griff, nicht bei der Landung: faellt der
         Flug weg (Speichern, Kuendigung), ist das Stueck trotzdem im Karton */
      const l=a.b.pos.find(x=>x.t===s.t&&x.g<x.n);
      l.g++; s.done++;
      w.flug={m:einrStueck(s.t),von:von.p,q:von.q,t:0,a,l,s};
      w.flug.m.matrix.compose(von.p,von.q,_vs.setScalar(1)); w.flug.m.matrixWorldNeedsUpdate=true;
      break; }
    case 'zurueck': {
      w.src=null;
      if(!vsWagenFertig()) break;
      /* kurz vor dem Tisch rollt der Wagen auf seinen Platz, der
         Mitarbeiter geht allein weiter - vorher drehte er sich mit dem
         Wagen am Griffpunkt und schwenkte ihn quer durch den Tisch */
      const G=localToWorld(packTisch,WG_GRIFF.x,WG_GRIFF.z);
      if(w.pos.distanceTo(G)<1.4){ vsWagenModus('park'); w.vs='parken'; break; }
      vsGehen(w,G,dt); break; }
    case 'parken': {
      if(!vsGehen(w,localToWorld(packTisch,0,0.9),dt)) break;
      if(vsWagen.parent!==packTisch) break;
      if(!vsDrehen(w,packTisch.rotation.y+Math.PI,dt)) break;
      w.k=0; w.t=0.2; w.vs='abladen'; break; }
    case 'abladen': {
      vsDrehen(w,packTisch.rotation.y+Math.PI,dt);
      w.t-=dt; if(w.t>0) break;
      const a=tour.auf[w.k];
      if(!a){ w.tour=null; w.vs='bereit'; w.t=0.5; break; }
      if(!a.pk){ w.k++; break; }
      const fertig=a.b.pos.every(l=>l.g>=l.n);
      if(!fertig){
        /* Ware fehlte: der angefangene Karton kommt unter den Tisch,
           die Bestellung wartet mit dem, was schon drin ist */
        a.pk.parent.remove(a.pk); a.pk=null; a.b.st='offen'; w.k++; w.t=0.25; break; }
      if(!vsTischFrei()) break;
      vsTischStart(a.pk,a.b,false); a.pk=null; w.k++; w.t=0.3;
      break; }
  }
}
/* Kartons auf dem Wagen falten sich auf */
function vsAufbauAnim(dt){
  for(const pk of vsWagen.children){ const u=pk.userData; if(!u||u.auf===undefined||u.auf>=1) continue;
    u.auf=Math.min(1,u.auf+dt/0.3); const s=Math.max(0.08,vsGlatt(u.auf));
    pk.scale.y=s; pk.position.y=WG_Y+0.002+VS_GR[u.gr].h/2*s; }
}
/* Fehlte unterwegs etwas, sucht er einmal neu - sonst zurueck */
function vsNachplanen(w){
  const tour=w.tour;
  const need=vsBedarf(tour);
  if(Object.keys(need).length&&tour.runde<2){
    tour.runde++;
    const neu=vsStopsBauen(need,w.pos).filter(s=>s.k>0);
    if(neu.length){ tour.stops=tour.stops.concat(neu); return; }
  }
  w.vs='zurueck';
}
function vsFlug(w,dt){
  const f=w.flug, pk=f.a.pk, G=VS_GR[f.a.b.gr];
  f.t+=dt*(w.wf||1)/0.42;
  const k=vsGlatt(f.t);
  pk.updateMatrixWorld(true); const z=pk.getWorldPosition(new THREE.Vector3()); z.y+=G.h/2-0.03;
  _vp.copy(f.von).lerp(z,k); _vp.y+=Math.sin(Math.PI*Math.min(1,f.t))*0.28;
  _vq2.setFromAxisAngle(_vY,vsWagen.rotation.y); _vq.copy(f.q).slerp(_vq2,k);
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
  const schiebt=vsWagen&&vsWagen.userData.modus==='schieben'&&vsWagen.parent!==packTisch;
  let z=null, k=Math.min(1,dt*9);
  /* Oberarm leicht vor, Ellbogen gebeugt: die Haende liegen am Buegel
     (Schulter 1,45 m, Buegel 1,10 m und 0,35 m vor dem Koerper) */
  if(schiebt&&!w.flug) z=[-0.35,-0.35,0.08,-0.08];
  else if(w.flug){
    const g=Math.sin(Math.PI*Math.min(1,w.flug.t*1.6));
    w.g.updateMatrixWorld(); _vp.copy(w.flug.von); w.g.worldToLocal(_vp);
    const reich=-Math.atan2(Math.max(0.15,_vp.z),1.45-_vp.y);
    z=[-0.35,-0.35+(reich+0.35)*g,0.07,-0.07]; k=Math.min(1,dt*16);
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
  if(w.flug){ scene.remove(w.flug.m); w.flug=null; }
  if(w.tour) w.tour.auf.forEach(a=>{ if(a.pk&&a.pk.parent) a.pk.parent.remove(a.pk); a.pk=null; if(a.b.st==='wagen') a.b.st='offen'; });
  w.tour=null; w.src=null; w.vs='heim';
  if(vsWagen&&packTisch) vsParken(true);
}
function vsStatus(){
  const w=staff&&staff.packer; if(!w) return null;
  const tour=w.tour, n=tour?tour.auf.length:0;
  switch(w.vs){
    case 'aufbauen': return `stellt ${n} Karton${n===1?'':'s'} auf den Wagen`;
    case 'ankoppeln': case 'fahren': case 'greifen': {
      const s=tour&&tour.stops[tour.si];
      return `pickt ${s?(s.lager?'im Lager':'im Laden'):''} · ${tour?Math.min(tour.si+1,tour.stops.length):0}/${tour?tour.stops.length:0} Stellen`; }
    case 'zurueck': case 'parken': return 'bringt den Wagen zum Packtisch';
    case 'abladen': return 'verpackt am Tisch';
    default: return (S.offen|0)>0?'wartet auf Ware für die offenen Bestellungen':'wartet auf Bestellungen';
  }
}

/* ---------------------------------------------------------
   Takt: Bestellungen kommen herein, Tisch und Bahn laufen
   --------------------------------------------------------- */
function updateVersand(dt){
  if(vsWagen) vsWagen.visible=zoneOffen('packstation');
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
  vsTischUpdate(dt,staff.packer&&vsTisch&&!vsTisch.spieler?(staff.packer.wf||1):1.2);
  vsBahnUpdate(dt);
}
/* Nach dem Laden: angefangene Touren gibt es nicht mehr */
function vsLaden(){
  S.bestellungen=(Array.isArray(S.bestellungen)?S.bestellungen:[]).filter(b=>b&&Array.isArray(b.pos)).map(b=>{
    const pos=b.pos.filter(l=>l&&P[l.t]&&l.n>0).map(l=>({t:l.t,n:l.n|0,g:Math.max(0,Math.min(l.n|0,l.g|0))}));
    return pos.length?{id:b.id|0,pos,gr:[1,3,6].indexOf(b.gr)>=0?b.gr:vsKlasse(pos),wert:r2(+b.wert||vsWertVon(pos)),st:'offen',tag:b.tag|0}:null; }).filter(Boolean).slice(0,80);
  S.paketGr=(Array.isArray(S.paketGr)?S.paketGr:[]).map(g=>[1,3,6].indexOf(g)>=0?g:1).slice(0,300);
  if(!S.paketGr.length&&(S.pakete|0)>0) for(let i=0;i<Math.min(300,S.pakete|0);i++) S.paketGr.push(1);
  S.pakete=S.paketGr.length;
  /* alter Spielstand kannte nur eine Zahl: vsAbgleich gibt ihr Inhalt */
  if(S.bestellungen.length||!(S.offen|0)) S.offen=S.bestellungen.length;
  if(staff.packer) vsAufraeumen(staff.packer);
  vsBahn.forEach(e=>{ if(e.m.parent) e.m.parent.remove(e.m); }); vsBahn.length=0;
  if(vsTisch){ if(vsTisch.pk.parent) vsTisch.pk.parent.remove(vsTisch.pk); if(vsTisch.flug) scene.remove(vsTisch.flug.m); vsTisch=null; }
  if(vsWagen){ [...vsWagen.children].forEach(c=>{ if(c.userData&&c.userData.klappen) vsWagen.remove(c); }); vsParken(true); }
}
