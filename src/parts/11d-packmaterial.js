/* =========================================================
   Packmaterial (Tom, 05.10.): Versandkartons, Luftpolsterfolie und
   Klebeband sind Verbrauchsgut, nicht mehr unendlich. Neben jedem
   Packtisch steht ein Regal damit - sichtbar gefuellt, es leert sich
   beim Packen: ein Karton je Paket in seiner Groesse, dazu Folie und
   Band. Fehlt der passende Karton, wird nicht gepackt.
   Nachschub kauft man im Laptop (Bestellen › Versandmaterial). Er
   kommt mit dem LKW, und die Einraeumer bringen ihn ins Regal - wie
   Ware, eigene Aufgabe im Handy. Der Spieler kann es auch selbst
   aus dem LKW holen und am Regal einraeumen (E).
   S.vm[i] ist der Bestand im Regal von Packplatz i.
   ========================================================= */
const VM={
  ks:   {id:'ks',   name:'Versandkarton S',  kurz:'Karton S', gr:1,einheit:'Bündel', stueck:25,preis:8.9, kap:50,text:'25 flache Kartons für kleine Pakete'},
  km:   {id:'km',   name:'Versandkarton M',  kurz:'Karton M', gr:3,einheit:'Bündel', stueck:15,preis:11.4,kap:30,text:'15 flache Kartons für große Pakete'},
  kl:   {id:'kl',   name:'Versandkarton L',  kurz:'Karton L', gr:6,einheit:'Bündel', stueck:8, preis:12.8,kap:16,text:'8 flache Kartons für riesige Pakete'},
  folie:{id:'folie',name:'Luftpolsterfolie', kurz:'Folie',          einheit:'Rolle',  stueck:20,preis:14.9,kap:60,text:'eine Rolle reicht für 20 kleine, 10 große oder 6 riesige Pakete'},
  band: {id:'band', name:'Klebeband',        kurz:'Klebeband',      einheit:'Karton', stueck:48,preis:9.9, kap:96,text:'6 Rollen, zusammen für 48 kleine oder 24 riesige Pakete'}
};
const VM_IDS=['ks','km','kl','folie','band'];
const VM_KARTON={1:'ks',3:'km',6:'kl'};
/* Verbrauch je Paket: ein Karton, Folie und Klebeband in Fuellungen */
const VM_FOLIE={1:1,3:2,6:3}, VM_BAND={1:1,3:1,6:2};
const vmRegale=[];
/* Bestand im Regal von Packplatz i; neue und alte Spielstaende
   bekommen die Erstausstattung: jedes Regal voll */
function vmStand(i){
  if(!S) return null;
  if(!Array.isArray(S.vm)) S.vm=[];
  for(let j=0;j<3;j++){ const o=S.vm[j]&&typeof S.vm[j]==='object'?S.vm[j]:(S.vm[j]={});
    VM_IDS.forEach(k=>{ if(typeof o[k]!=='number'||!isFinite(o[k])) o[k]=VM[k].kap; o[k]=Math.max(0,Math.round(o[k])); }); }
  return S.vm[i];
}
function vmBedarf(gr){ return {[VM_KARTON[gr]||'ks']:1,folie:VM_FOLIE[gr]||1,band:VM_BAND[gr]||1}; }
/* Materialkosten je Paket zum Einkaufspreis (Statistik): S 1,30 / M 2,46 / L 4,25 EUR */
function vmKostenJe(gr){ const b=vmBedarf(gr); let k=0; for(const id in b) k+=b[id]*VM[id].preis/VM[id].stueck; return r2(k); }
/* Reicht das Material am Platz i fuer ein Paket der Groesse gr?
   mat: was diese Tour schon vorgemerkt hat */
function vmReicht(i,gr,mat){
  const s=vmStand(i|0); if(!s) return false;
  const b=vmBedarf(gr);
  for(const k in b) if(s[k]-((mat&&mat[k])||0)<b[k]) return false;
  return true;
}
function vmVormerken(gr,mat){ const b=vmBedarf(gr); for(const k in b) mat[k]=(mat[k]||0)+b[k]; }
function vmVerbrauchen(i,gr){
  if(!vmReicht(i,gr)) return false;
  const s=vmStand(i), b=vmBedarf(gr);
  for(const k in b) s[k]-=b[k];
  statAdd('vmVerbraucht',1); vmRegalZeichnen(i);
  return true;
}
/* abgebrochene Tour: der Karton kommt ungebraucht zurueck */
function vmZurueck(i,gr){ const s=vmStand(i), b=vmBedarf(gr); for(const k in b) s[k]=Math.min(VM[k].kap*2,s[k]+b[k]); vmRegalZeichnen(i); }
/* erster Packplatz mit Material fuer diese Groesse, sonst -1 */
function vmPlatzMit(gr){ for(let i=0;i<packStufe();i++) if(vmReicht(i,gr)) return i; return -1; }
/* Was fehlt? Fuer Hinweise im Laptop, am Handy und am Tisch */
function vmFehlt(i,gr){ const s=vmStand(i), b=vmBedarf(gr); return Object.keys(b).filter(k=>s[k]<b[k]); }
function vmFehltText(i,gr){
  const f=vmFehlt(i,gr); if(!f.length) return '';
  const was=f.map(k=>k==='folie'?'Luftpolsterfolie':k==='band'?'Klebeband':`kein ${VM[k].kurz}`).join(', ');
  return `Packmaterial fehlt${packStufe()>1?` an Platz ${i+1}`:''}: ${was} – im Laptop unter Bestellen › Versandmaterial nachkaufen`;
}
/* Einlagern: i=-1 heisst ins Regal mit dem meisten Platz */
function vmPlatzFuer(id){
  let best=-1, frei=-1e9;
  for(let i=0;i<packStufe();i++){ const f=VM[id].kap-vmStand(i)[id]; if(f>frei){ frei=f; best=i; } }
  return best;
}
function vmHatPlatz(i,id){ return vmStand(i)[id]<VM[id].kap; }
function vmEinlagern(i,id){
  if(!VM[id]) return false;
  if(i<0) i=vmPlatzFuer(id); if(i<0) i=0;
  const s=vmStand(i);
  /* ueber den Rand hinaus wird nicht weggeworfen - das Regal ist dann
     eben randvoll, bis wieder etwas verbraucht ist */
  s[id]=Math.min(VM[id].kap*2,s[id]+VM[id].stueck);
  statAdd('vmEingelagert',1); vmRegalZeichnen(i);
  return true;
}
function vmGesamt(id){ let n=0; for(let i=0;i<packStufe();i++) n+=vmStand(i)[id]; return n; }
function vmKapGesamt(id){ return VM[id].kap*packStufe(); }
/* Unterwegs: bestellt, im LKW, in der Hand */
function vmUnterwegs(id){
  let n=pending.filter(p=>p.vm===id).length;
  if(typeof truck!=='undefined'&&truck) n+=truck.cargo.filter(c=>c.vm===id).length;
  if(S&&S.carrying&&S.carrying.vm===id) n++;
  for(const k in staff){ const w=staff[k]; if(w&&w.carry&&w.carry.vm===id) n++; }
  return n;
}
/* So viele Einheiten passen noch, abzueglich dessen, was schon kommt */
function vmBestellbar(id){ return Math.max(0,Math.floor((vmKapGesamt(id)-vmGesamt(id))/VM[id].stueck)-vmUnterwegs(id)); }
function vmBestellen(id,n){
  const v=VM[id]; if(!v||!zoneOffen('packstation')) return false;
  n=Math.max(1,n|0);
  const preis=r2(v.preis*n);
  if(verfuegbar()<preis){ toast(`${v.name}: dir fehlen ${eur(r2(preis-verfuegbar()))}.`,'bad'); return false; }
  S.money=r2(S.money-preis); DS.vm=r2((DS.vm||0)+preis);
  const delay=lieferSek()*evv('delay');
  for(let k=0;k<n;k++) pending.push({vm:id,t:delay,sup:'fachhandel'});
  S.tut.order=true; sfx.pop();
  toast(`${n}× ${v.name} (${v.einheit}) bestellt · ${eur(preis)}. Kommt mit dem LKW an die Rampe.`,'money');
  save(); return true;
}
/* alles auffuellen, was in die Regale passt */
function vmAuffuellen(){ let n=0; VM_IDS.forEach(id=>{ const k=vmBestellbar(id); if(k>0&&vmBestellen(id,k)) n+=k; }); if(!n) toast('Die Packmaterial-Regale sind voll oder der Nachschub ist schon unterwegs.'); return n; }

/* ---------------------------------------------------------
   Regal: verzinkte Boeden, blaue Rahmen, Schilder je Fach. Kartons
   liegen flach gestapelt, Folie als Rollen, Klebeband im offenen
   Karton obendrauf. Der Stapel waechst und schrumpft mit dem Bestand.
   --------------------------------------------------------- */
const VM_RB=0.55, VM_RT=0.58, VM_BOEDEN=[0.08,0.5,0.92,1.34], VM_RH=1.76;
/* links neben dem Tisch, die Front zum Packer (gespiegelte Plaetze: nach Sueden) */
function vmRegalLage(i){ const p=ppW(i,-0.95,-0.1); return {x:p.x,z:p.z,ry:VS_PP[i].s>0?0:Math.PI}; }
let _vmTex=null;
function vmTexturen(){
  if(_vmTex) return _vmTex;
  const kante=(farbe)=>{ const t=tex(64,128,(c,W,H)=>{ c.fillStyle=farbe; c.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=4){ c.fillStyle=`rgba(90,62,30,${0.18+Math.random()*0.18})`; c.fillRect(0,y,W,1); }
    for(let i=0;i<60;i++){ c.fillStyle=`rgba(255,240,210,${Math.random()*0.08})`; c.fillRect(Math.random()*W,Math.random()*H,3,1); } });
    t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; };
  const schild=(txt,fg,bg)=>tex(256,64,(c,W,H)=>{ c.fillStyle=bg; c.fillRect(0,0,W,H); c.fillStyle=fg; c.textAlign='center'; c.textBaseline='middle'; fitFont(c,txt,W-16,38,BUN); c.fillText(txt,W/2,H/2+2); });
  const folie=tex(128,64,(c,W,H)=>{ c.fillStyle='#cfe3ef'; c.fillRect(0,0,W,H);
    for(let y=4;y<H;y+=8) for(let x=(y/8%2)*4;x<W;x+=8){ c.fillStyle='rgba(255,255,255,.75)'; c.beginPath(); c.arc(x,y,2.6,0,Math.PI*2); c.fill(); c.fillStyle='rgba(120,150,170,.35)'; c.beginPath(); c.arc(x+1,y+1,2.6,0,Math.PI*2); c.fill(); } });
  folie.wrapS=folie.wrapT=THREE.RepeatWrapping;
  const bundel=(txt)=>tex(256,256,(c,W,H)=>{ c.fillStyle='#c49a62'; c.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=6){ c.fillStyle=`rgba(90,62,30,${0.12+Math.random()*0.12})`; c.fillRect(0,y,W,2); }
    c.fillStyle='#2b3040'; c.fillRect(W*0.2,0,10,H); c.fillRect(W*0.75,0,10,H);
    c.fillStyle='#f4f2ea'; c.fillRect(W*0.3,H*0.35,W*0.4,H*0.3); c.fillStyle='#1b2340'; c.textAlign='center'; c.textBaseline='middle';
    fitFont(c,txt,W*0.36,30,BUN); c.fillText(txt,W/2,H/2); });
  _vmTex={kante:kante('#c8a06a'),schild:{kl:schild('KARTON L','#1b2340','#f2c230'),km:schild('KARTON M','#1b2340','#f2c230'),ks:schild('KARTON S','#1b2340','#f2c230'),folie:schild('FOLIE · BAND','#1b2340','#f2c230'),kopf:schild('PACKMITTEL','#ffffff','#2a5a9e')},
    folie,bundel:{ks:bundel('KARTON S'),km:bundel('KARTON M'),kl:bundel('KARTON L'),folie,band:bundel('KLEBEBAND')}};
  return _vmTex;
}
/* B: Vertexfarben-Helfer der Station, reg: zur Stufe anmelden */
function vmRegalBauen(g,i,reg,B0,k){
  /* in Regalkoordinaten bauen (Front nach +z), dann an den Platz drehen */
  const L=vmRegalLage(i), w=VM_RB, d=VM_RT, T=vmTexturen(), sn=Math.sin(L.ry), cs=Math.cos(L.ry);
  const P=(lx,lz)=>({x:L.x+lx*cs+lz*sn,z:L.z-lx*sn+lz*cs}), x=0, z=0;
  const B=(k2,bw,bh,bd,c,lx,y,lz,rx,ry,rz)=>{ const p=P(lx,lz); B0(k2,bw,bh,bd,c,p.x,y,p.z,cs<0?-(rx||0):(rx||0),(ry||0)+L.ry,rz); };
  const setz=(m,lx,y,lz)=>{ const p=P(lx,lz); m.position.set(p.x,y,p.z); m.rotation.y+=L.ry; return m; };
  const BLAU=0x2a5a9e, ZINK=0xb9bec6;
  for(const sx of [-1,1]) for(const sz of [-1,1]) B(k,0.035,VM_RH,0.035,BLAU,x+sx*(w/2-0.018),VM_RH/2,z+sz*(d/2-0.018));
  for(const sx of [-1,1]) for(const y of [0.3,1.1]) B(k,0.02,0.02,d-0.04,BLAU,x+sx*(w/2-0.018),y,z,0.6*(y>1?1:-1),0,0);
  for(const y of VM_BOEDEN.concat([VM_RH])) B(k,w,0.022,d,ZINK,x,y-0.011,z);
  /* Rueckwand aus Lochblech nur unten: vom Band her sieht man hinein */
  B(k,w-0.04,0.3,0.01,ZINK,x,0.25,z-d/2+0.01);
  const R={i,stapel:{},folie:[],band:[],hit:null};
  /* flache Kartons: Hoehe je Stueck */
  const dicke={kl:0.008,km:0.006,ks:0.004}, boden={kl:0,km:1,ks:2};
  for(const id of ['kl','km','ks']){
    const mat=new THREE.MeshStandardMaterial({map:T.kante.clone(),roughness:0.9}); mat.map.needsUpdate=true;
    const m=new THREE.Mesh(new THREE.BoxGeometry(w-0.08,1,d-0.1),mat);
    setz(m,x,VM_BOEDEN[boden[id]]+0.5,z+0.01); g.add(m); reg(m);
    if(HIQ){ m.castShadow=true; m.receiveShadow=true; }
    R.stapel[id]={m,dicke:dicke[id],y0:VM_BOEDEN[boden[id]]};
    const sm=setz(plane(0.2,0.05,new THREE.MeshBasicMaterial({map:T.schild[id],toneMapped:false}),0,0,0,0,g),x,VM_BOEDEN[boden[id]]-0.035,z+d/2+0.006); reg(sm);
  }
  /* Folienrollen liegen laengs, bis zu drei */
  const fm=new THREE.MeshStandardMaterial({map:T.folie,roughness:0.35,metalness:0,transparent:true,opacity:0.92});
  const fg=new THREE.CylinderGeometry(0.085,0.085,w-0.1,18);
  /* Rollen laengs in Regal-x: im gedrehten Regal zeigt die Achse in Welt-x genauso */
  for(let j=0;j<3;j++){ const m=new THREE.Mesh(fg,fm); m.rotation.z=Math.PI/2; const p=P(x,z-0.18+j*0.18); m.position.set(p.x,VM_BOEDEN[3]+0.085,p.z); g.add(m); reg(m); R.folie.push(m); }
  const sm=setz(plane(0.24,0.05,new THREE.MeshBasicMaterial({map:T.schild.folie,toneMapped:false}),0,0,0,0,g),x,VM_BOEDEN[3]-0.035,z+d/2+0.006); reg(sm);
  /* Klebeband: offener Karton auf dem Regal, bis zu zwoelf Rollen */
  B(k,0.5,0.004,0.24,0xc49a62,x,VM_RH+0.002,z); for(const s of [-1,1]){ B(k,0.5,0.06,0.006,0xc49a62,x,VM_RH+0.03,z+s*0.12); B(k,0.006,0.06,0.24,0xc49a62,x+s*0.25,VM_RH+0.03,z); }
  const bm=std(0xd8b46a,{roughness:0.55}), bg=new THREE.CylinderGeometry(0.038,0.038,0.045,14);
  for(let j=0;j<12;j++){ const m=new THREE.Mesh(bg,bm); setz(m,x-0.2+(j%6)*0.08,VM_RH+0.027,z+(j<6?-0.055:0.055)); g.add(m); reg(m); R.band.push(m); }
  /* Kopfschild */
  const km=setz(plane(0.5,0.12,new THREE.MeshBasicMaterial({map:T.schild.kopf,toneMapped:false}),0,0,0,0,g),x,VM_RH+0.16,z+0.02); reg(km);
  B(k,0.52,0.14,0.02,0x1b2340,x,VM_RH+0.16,z+0.005);
  for(const s of [-1,1]) B(k,0.02,0.16,0.02,BLAU,x+s*0.2,VM_RH+0.08,z);
  const hit=setz(bbox(w+0.06,VM_RH+0.2,d+0.06,hitM,0,0,0,g,false),x,(VM_RH+0.2)/2,z);
  hit.userData={kind:'vmregal',ref:i}; reg(hit); R.hit=hit;
  vmRegale[i]=R;
}
function vmRegalZeichnen(i){
  if(i===undefined){ for(let j=0;j<vmRegale.length;j++) vmRegalZeichnen(j); return; }
  const R=vmRegale[i]; if(!R||!S) return;
  /* auch vor dem Kauf gefuellt: man sieht, was man bekommt */
  const s=vmStand(i), sichtbar=i<packStufe();
  for(const id in R.stapel){ const st=R.stapel[id], n=Math.min(s[id],VM[id].kap*1.4), h=Math.max(0.0001,n*st.dicke);
    st.m.visible=sichtbar&&n>0; st.m.scale.y=h; st.m.position.y=st.y0+h/2;
    if(st.m.material.map&&st.m.material.map.repeat) st.m.material.map.repeat.set(1,Math.max(0.05,h/0.12)); }
  const rollen=Math.ceil(s.folie/VM.folie.stueck);
  R.folie.forEach((m,j)=>{ m.visible=sichtbar&&j<rollen;
    /* die angebrochene Rolle wird duenner */
    const rest=j===rollen-1?(s.folie-(rollen-1)*VM.folie.stueck)/VM.folie.stueck:1, r=0.45+0.55*Math.sqrt(Math.max(0,rest));
    m.scale.set(r,1,r); m.position.y=VM_BOEDEN[3]+0.085*r; });
  const br=Math.ceil(s.band/8);
  R.band.forEach((m,j)=>{ m.visible=sichtbar&&j<br; });
}
/* Wo der Einraeumer am Regal steht und wohin er schaut */
function vmStandPunkt(i){ const L=vmRegalLage(i), st=ppW(i,-0.95,0.86); return {stand:localToWorld(packTisch,st.x,st.z),look:localToWorld(packTisch,L.x,L.z)}; }

/* ---------------------------------------------------------
   LKW, Einraeumer, Spieler
   --------------------------------------------------------- */
/* Ladung im LKW: ein Buendel, eine Rolle, ein Karton Klebeband */
const VM_MASS={ks:[0.56,0.12,0.5],km:[0.6,0.12,0.6],kl:[0.7,0.1,0.66],folie:[0.5,0.2,0.2],band:[0.36,0.14,0.26]};
const _vmGeo={}, _vmMat={};
function vmLadungMesh(id){
  const T=vmTexturen(), M=VM_MASS[id]||VM_MASS.ks;
  if(id==='folie'){ const m=new THREE.Mesh(_vmGeo.folie||(_vmGeo.folie=new THREE.CylinderGeometry(0.1,0.1,0.5,16)),_vmMat.folie||(_vmMat.folie=new THREE.MeshStandardMaterial({map:T.folie,roughness:0.35}))); m.rotation.z=Math.PI/2; m.userData.h=0.2; return m; }
  const m=new THREE.Mesh(_vmGeo[id]||(_vmGeo[id]=new THREE.BoxGeometry(M[0],M[1],M[2])),_vmMat[id]||(_vmMat[id]=new THREE.MeshStandardMaterial({map:T.bundel[id],roughness:0.85})));
  m.userData.h=M[1]; return m;
}
function vmTraegerMat(id){ vmLadungMesh(id); return _vmMat[id==='folie'?'folie':id]; }
/* LKW angedockt und Versandmaterial an Bord, fuer das ein Regal Platz hat */
function vmLkwJob(w){
  if(typeof truck==='undefined'||!truck||truck.state!=='docked'||!zoneOffen('packstation')) return null;
  const c=truck.cargo.find(c=>c.vm&&vmHatPlatz(vmPlatzFuer(c.vm),c.vm));
  return c?{kind:'vm',vm:c.vm}:null;
}
function vmAusLkw(id){
  if(!truck||truck.state!=='docked') return null;
  const i=truck.cargo.findIndex(c=>c.vm===id); if(i<0) return null;
  truck.cargo.splice(i,1); fillCargo(); return id;
}
/* Ablauf des Einraeumers: zum LKW, Buendel nehmen, zum Regal, einraeumen */
function vmEinrStart(w,src){ w.vmJob=src; w.goTo(DOCK.stand.clone()); w.state='vmLkw'; }
function vmEinrLoop(w,dt){
  vmEinrZeigen(w);
  if(w.state==='vmLkw'){
    if(!w.walk(dt)) return;
    const id=w.vmJob&&vmAusLkw(w.vmJob.vm);
    if(!id){ w.state='idle'; w.vmJob=null; return; }
    const pi=vmPlatzFuer(id); w.carry={vm:id,pi}; w.vmJob=null;
    w.goTo(vmStandPunkt(pi).stand); w.state='vmRegal';
  } else if(w.state==='vmRegal'){
    if(!w.walk(dt)) return;
    w.state='vmEin'; w.t=0.7;
  } else if(w.state==='vmEin'){
    const c=w.carry; if(!c){ w.state='idle'; return; }
    const P_=vmStandPunkt(c.pi).look; const ty=Math.atan2(P_.x-w.pos.x,P_.z-w.pos.z);
    let df=ty-w.g.rotation.y; while(df>Math.PI) df-=Math.PI*2; while(df<-Math.PI) df+=Math.PI*2; w.g.rotation.y+=df*Math.min(1,dt*8);
    w.t-=dt*(w.wf||1); if(w.t>0) return;
    vmEinlagern(c.pi,c.vm); w.carry=null; w.state='idle'; sfx.pop();
  }
  vmEinrZeigen(w);
}
/* was er traegt, haelt er vor dem Bauch */
function vmEinrZeigen(w){
  const c=w.carry&&w.carry.vm?w.carry.vm:null;
  if(!c){ if(w.vmM) w.vmM.visible=false; return; }
  if(!w.vmM||w.vmM.userData.id!==c){ if(w.vmM) w.g.remove(w.vmM); w.vmM=vmLadungMesh(c); w.vmM.userData.id=c; w.g.add(w.vmM);
    w.vmM.position.set(0,1.0,0.36); if(c!=='folie') w.vmM.rotation.y=0; }
  w.vmM.visible=true;
  const u=w.g.userData; if(u&&u.arms){ u.arms[0].rotation.x=-1.0; u.arms[1].rotation.x=-1.0; }
}
/* Spieler: Buendel aus dem LKW nehmen */
function vmTakeBox(item){
  if(S.carrying){ toast('Du trägst schon etwas. Erst abstellen.','bad'); return; }
  const i=truck.cargo.indexOf(item); if(i<0) return;
  truck.cargo.splice(i,1); fillCargo();
  S.carrying={vm:item.vm}; sfx.pop(); updateCarry();
  toast(`${VM[item.vm].name}: ins Packmaterial-Regal an der Packstation (E am Regal).`);
}
function vmSpielerEinraeumen(i){
  const c=S.carrying; if(!c||!c.vm) return;
  if(i>=packStufe()) return;
  if(!vmHatPlatz(i,c.vm)){ toast(`Im Regal ist kein Platz mehr für ${VM[c.vm].name}.`,'bad'); return; }
  vmEinlagern(i,c.vm); S.carrying=null; sfx.pop(); updateCarry(); addXP(1);
}
/* Q mit Versandmaterial in der Hand: abstellen gibt es nicht - es kommt
   ins Regal. Nur wenn alle Regale voll sind, in das mit dem meisten Platz */
function vmAbstellen(){
  const c=S.carrying; if(!c||!c.vm) return false;
  const i=vmPlatzFuer(c.vm);
  if(i>=0&&vmHatPlatz(i,c.vm)){ toast('Versandmaterial gehört ins Packmaterial-Regal an der Packstation (E am Regal).','bad'); return true; }
  vmEinlagern(i,c.vm); S.carrying=null; updateCarry(); toast('Die Regale sind randvoll - das Material liegt obendrauf.'); return true;
}
function vmPrompt(i){
  const c=S.carrying, s=vmStand(i), pl=packStufe()>1?` · Platz ${i+1}`:'';
  if(!zoneOffen('packstation')||i>=packStufe()) return {t:'Packmaterial-Regal',a:false};
  if(c&&c.vm) return vmHatPlatz(i,c.vm)?{t:`Einräumen: ${VM[c.vm].name} (${s[c.vm]}/${VM[c.vm].kap})${pl}`,a:true}:{t:`Regal voll: ${VM[c.vm].name}`,a:false};
  return {t:`Packmaterial${pl}: S ${s.ks} · M ${s.km} · L ${s.kl} · Folie ${s.folie} · Band ${s.band}`,a:false};
}
/* Treffer fuer den Blickstrahl: Packtische und Regale der Stufe */
function vsHits(){ const L=[], st=packStufe(); for(let i=0;i<st;i++){ if(packTeile.hits[i]) L.push(packTeile.hits[i]); if(vmRegale[i]&&vmRegale[i].hit) L.push(vmRegale[i].hit); } if(st<2&&packTeile.handHit) L.push(packTeile.handHit); return L; }
function vmZielPos(){ const i=Math.max(0,vmPlatzFuer(S.carrying&&S.carrying.vm||'ks')), L=vmRegalLage(i); const p=localToWorld(packTisch,L.x,L.z); return {x:p.x,y:1.2,z:p.z}; }
/* Kurzstand fuer Laptop und Handy */
function vmZeile(){
  const st=packStufe(), teile=[];
  for(const id of VM_IDS){ const n=vmGesamt(id), k=vmKapGesamt(id), ant=n/k;
    teile.push(`<span class="${ant<0.15?'no':ant<0.35?'warn':'ok'}">${VM[id].kurz} ${id==='folie'||id==='band'?Math.round(ant*100)+' %':n}</span>`); }
  return teile.join(' · ')+(st>1?` <small>(${st} Regale)</small>`:'');
}
function vmLaden(){ vmStand(0); vmRegalZeichnen(); }
/* Hinweis fuer Laptop und Handy: was fehlt oder bald fehlt */
function vmWarnung(){
  if(!S||!zoneOffen('packstation')||!packBereit()) return '';
  const wb=vsWagenBedarf(), L=(S.bestellungen||[]).filter(b=>b.st==='offen'&&vsErfuellbar(b,wb)&&vmPlatzMit(b.gr)<0);
  if(L.length){ const was={};
    L.forEach(b=>{ for(let i=0;i<packStufe();i++) vmFehlt(i,b.gr).forEach(k=>{ was[k]=1; }); });
    return `${L.length} Bestellung${L.length===1?' wartet':'en warten'} auf Packmaterial – es fehlt: ${Object.keys(was).map(k=>VM[k].name).join(', ')}.`; }
  const knapp=VM_IDS.filter(id=>vmGesamt(id)<vmKapGesamt(id)*0.15);
  return knapp.length?`Bald leer: ${knapp.map(k=>VM[k].name).join(', ')}.`:'';
}
/* Katalogbild im Laptop */
const _vmPic={};
function vmPic(id){
  if(_vmPic[id]) return _vmPic[id];
  const c=document.createElement('canvas'); c.width=224; c.height=152; const g=c.getContext('2d'), W=224, H=152;
  const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#1b2540'); gr.addColorStop(1,'#0c1222'); g.fillStyle=gr; g.fillRect(0,0,W,H);
  g.fillStyle='rgba(0,0,0,.32)'; g.fillRect(0,122,W,H-122);
  if(id==='folie'){
    const f=g.createLinearGradient(0,50,0,120); f.addColorStop(0,'#e6f2fa'); f.addColorStop(1,'#9fc0d4'); g.fillStyle=f; g.fillRect(52,52,120,66);
    for(let y=58;y<116;y+=8) for(let x=56+(y%16?4:0);x<170;x+=8){ g.fillStyle='rgba(255,255,255,.8)'; g.beginPath(); g.arc(x,y,2.5,0,Math.PI*2); g.fill(); }
    g.fillStyle='#cfe3ef'; g.beginPath(); g.ellipse(52,85,12,33,0,0,Math.PI*2); g.fill(); g.fillStyle='#7a8a96'; g.beginPath(); g.ellipse(52,85,4,10,0,0,Math.PI*2); g.fill();
  } else if(id==='band'){
    g.fillStyle='#c49a62'; g.fillRect(40,78,144,42); g.fillStyle='#a9814e'; g.fillRect(40,78,144,6);
    for(let i=0;i<6;i++){ const x=58+i*22; g.fillStyle='#d8b46a'; g.beginPath(); g.ellipse(x,74,10,6,0,0,Math.PI*2); g.fill(); g.fillStyle='#8a6a3a'; g.beginPath(); g.ellipse(x,74,4,2.5,0,0,Math.PI*2); g.fill(); }
  } else {
    const n={ks:9,km:7,kl:5}[id]||6, w={ks:110,km:136,kl:160}[id]||120, d={ks:6,km:8,kl:10}[id]||8, x0=(W-w)/2;
    for(let i=0;i<n;i++){ const y=118-(i+1)*d; g.fillStyle=i%2?'#c49a62':'#b88f58'; g.fillRect(x0,y,w,d-1); g.fillStyle='rgba(60,40,20,.35)'; g.fillRect(x0,y+d-2,w,1); }
    g.fillStyle='#2b3040'; g.fillRect(x0+w*0.22,118-n*d,6,n*d); g.fillRect(x0+w*0.74,118-n*d,6,n*d);
    g.fillStyle='#f2c230'; g.font='700 15px sans-serif'; g.textAlign='center'; g.fillText(VM[id].kurz.toUpperCase(),W/2,40);
  }
  g.strokeStyle='rgba(242,245,255,.18)'; g.lineWidth=2; g.strokeRect(1,1,W-2,H-2);
  return _vmPic[id]=c.toDataURL('image/png');
}
