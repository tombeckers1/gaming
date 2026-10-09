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
/* Wellpappe (Tom 09.10.: "Texturen so, dass man sieht, das sind echte Kartons"):
   Kraftpapier mit Faserrauschen, die Riffelung (Welle) scheint leicht durch */
function vmPappe(c,W,H,welle){
  const gr=c.createLinearGradient(0,0,W,H); gr.addColorStop(0,'#c9a06a'); gr.addColorStop(1,'#b98f5a'); c.fillStyle=gr; c.fillRect(0,0,W,H);
  if(welle) for(let x=0;x<W;x+=welle){ c.fillStyle='rgba(255,236,200,.05)'; c.fillRect(x,0,welle*0.45,H); c.fillStyle='rgba(90,60,25,.05)'; c.fillRect(x+welle*0.5,0,welle*0.3,H); }
  for(let i=0;i<W*H/40;i++){ const v=Math.random(); c.fillStyle=v<0.5?`rgba(255,240,210,${v*0.1})`:`rgba(80,52,22,${(v-0.5)*0.1})`; c.fillRect(Math.random()*W,Math.random()*H,1+Math.random()*2,1); }
}
function vmTexturen(){
  if(_vmTex) return _vmTex;
  /* Kante eines Stapels flacher Zuschnitte: Lage fuer Lage, mit dunkler Welle dazwischen */
  const kante=tex(64,256,(c,W,H)=>{ c.fillStyle='#c39a64'; c.fillRect(0,0,W,H); let y=0;
    while(y<H){ const t=5+Math.floor(Math.random()*3), k=0.86+Math.random()*0.22; c.fillStyle=`rgb(${Math.round(195*k)},${Math.round(154*k)},${Math.round(100*k)})`; c.fillRect(0,y,W,t);
      c.fillStyle='rgba(70,45,18,.55)'; c.fillRect(0,y+t-1,W,1);
      for(let x=0;x<W;x+=3){ c.fillStyle='rgba(90,60,28,.35)'; c.fillRect(x,y+1+((x/3)%2),1,t-3); }
      y+=t; } });
  kante.wrapS=kante.wrapT=THREE.RepeatWrapping;
  /* Oberseite: Zuschnitt mit Rilllinien, Groessenaufdruck, Pfeilen und zwei Umreifungsbaendern */
  const deckel=(txt)=>tex(256,256,(c,W,H)=>{ vmPappe(c,W,H,6);
    c.strokeStyle='rgba(80,52,22,.45)'; c.lineWidth=2; c.setLineDash([10,6]);
    for(const x of [W*0.25,W*0.75]){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); }
    c.beginPath(); c.moveTo(0,H*0.3); c.lineTo(W,H*0.3); c.stroke(); c.setLineDash([]);
    c.fillStyle='rgba(40,30,20,.75)'; c.font=BUN(58); c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,W*0.5,H*0.62);
    c.font=BAR(22); c.fillText('DDL · 1.40 BC',W*0.5,H*0.84);
    c.strokeStyle='rgba(40,30,20,.7)'; c.lineWidth=4; for(const x of [W*0.1,W*0.16]){ c.beginPath(); c.moveTo(x,H*0.24); c.lineTo(x,H*0.08); c.moveTo(x-6,H*0.14); c.lineTo(x,H*0.08); c.lineTo(x+6,H*0.14); c.stroke(); }
    c.fillStyle='rgba(30,52,110,.92)'; c.fillRect(W*0.36,0,12,H); c.fillRect(W*0.62,0,12,H);
    c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(W*0.36,0,3,H); c.fillRect(W*0.62,0,3,H); });
  const schild=(txt,fg,bg)=>tex(256,64,(c,W,H)=>{ c.fillStyle=bg; c.fillRect(0,0,W,H); c.fillStyle=fg; c.textAlign='center'; c.textBaseline='middle'; fitFont(c,txt,W-16,38,BUN); c.fillText(txt,W/2,H/2+2); });
  /* Luftpolsterfolie: Noppen mit Glanzpunkt, halbdurchsichtig */
  const folie=tex(128,64,(c,W,H)=>{ c.fillStyle='#d6e8f2'; c.fillRect(0,0,W,H);
    for(let y=4;y<H;y+=8) for(let x=(y/8%2)*4;x<W;x+=8){ c.fillStyle='rgba(150,180,198,.55)'; c.beginPath(); c.arc(x+0.8,y+0.8,3,0,Math.PI*2); c.fill();
      c.fillStyle='rgba(255,255,255,.8)'; c.beginPath(); c.arc(x,y,2.6,0,Math.PI*2); c.fill(); c.fillStyle='#fff'; c.fillRect(x-1.4,y-1.6,1.2,1.2); } });
  folie.wrapS=folie.wrapT=THREE.RepeatWrapping;
  /* Stirnseite der Rolle: Wicklung in Ringen, Papphuelse in der Mitte */
  const rollEnde=tex(128,128,(c,W,H)=>{ c.fillStyle='#cfe1ec'; c.fillRect(0,0,W,H);
    for(let r=62;r>22;r-=3){ c.strokeStyle=`rgba(${r%2?120:255},${r%2?150:255},${r%2?170:255},.5)`; c.lineWidth=1.4; c.beginPath(); c.arc(64,64,r,0,Math.PI*2); c.stroke(); }
    c.fillStyle='#a37b48'; c.beginPath(); c.arc(64,64,22,0,Math.PI*2); c.fill(); c.fillStyle='#3a2a18'; c.beginPath(); c.arc(64,64,15,0,Math.PI*2); c.fill(); });
  /* Klebeband: Profil der Rolle laeuft in v ueber Unterseite, Mantel, Oberseite, Huelse */
  const band=tex(64,64,(c,W,H)=>{ const q=H/4;
    c.fillStyle='#a8763a'; c.fillRect(0,0,W,q); for(let y=2;y<q;y+=2){ c.fillStyle='rgba(255,220,160,.25)'; c.fillRect(0,y,W,1); }
    const g=c.createLinearGradient(0,q,0,2*q); g.addColorStop(0,'#b88445'); g.addColorStop(0.5,'#d6a560'); g.addColorStop(1,'#b88445'); c.fillStyle=g; c.fillRect(0,q,W,q);
    c.fillStyle='#a8763a'; c.fillRect(0,2*q,W,q); for(let y=2*q+2;y<3*q;y+=2){ c.fillStyle='rgba(255,220,160,.25)'; c.fillRect(0,y,W,1); }
    c.fillStyle='#c9ab7c'; c.fillRect(0,3*q,W,q); });
  const bundel=(txt)=>tex(256,256,(c,W,H)=>{ vmPappe(c,W,H,6);
    for(let y=0;y<H;y+=6){ c.fillStyle=`rgba(90,62,30,${0.08+Math.random()*0.1})`; c.fillRect(0,y,W,1); }
    c.fillStyle='#24366e'; c.fillRect(W*0.2,0,10,H); c.fillRect(W*0.75,0,10,H);
    c.fillStyle='#f4f2ea'; c.fillRect(W*0.3,H*0.35,W*0.4,H*0.3); c.fillStyle='#1b2340'; c.textAlign='center'; c.textBaseline='middle';
    fitFont(c,txt,W*0.36,30,BUN); c.fillText(txt,W/2,H/2); });
  _vmTex={kante,deckel:{ks:deckel('S'),km:deckel('M'),kl:deckel('L')},schild:{kl:schild('KARTON L','#1b2340','#f2c230'),km:schild('KARTON M','#1b2340','#f2c230'),ks:schild('KARTON S','#1b2340','#f2c230'),folie:schild('FOLIE · BAND','#1b2340','#f2c230'),kopf:schild('PACKMITTEL','#ffffff','#2a5a9e')},
    folie,rollEnde,band,bundel:{ks:bundel('KARTON S'),km:bundel('KARTON M'),kl:bundel('KARTON L'),folie,band:bundel('KLEBEBAND')}};
  return _vmTex;
}
/* Folienrolle: Mantel (Noppen) und Stirnseiten (Wicklung, Huelse) in einer Textur -
   links der Mantel, rechts die Stirnseite; ein Zeichenaufruf je Rolle */
let _vmFolieM=null; const _vmFolieG={};
function vmFolieMat(){ if(_vmFolieM) return _vmFolieM; const T=vmTexturen();
  const t=tex(256,128,(c)=>{ c.drawImage(texCanvas(T.folie),0,0,128,64,0,0,128,128); c.drawImage(texCanvas(T.rollEnde),128,0,128,128); });
  _vmFolieM=new THREE.MeshStandardMaterial({map:t,roughness:0.32,metalness:0}); return _vmFolieM; }
function vmFolieGeo(L){ if(_vmFolieG[L]) return _vmFolieG[L];
  const g=new THREE.CylinderGeometry(0.085,0.085,L,(typeof GFX!=='undefined'&&GFX==='ultralow')?12:22), uv=g.attributes&&g.attributes.uv;
  if(!uv||!g.index||!Array.isArray(g.groups)||typeof g.clearGroups!=='function') return _vmFolieG[L]=g;   /* Test-Attrappe */
  for(const gr of g.groups){ const kap=gr.materialIndex>0, idx=g.index.array, seen=new Set();
    for(let k=gr.start;k<gr.start+gr.count;k++){ const v=idx[k]; if(seen.has(v)) continue; seen.add(v);
      const u=uv.getX(v), w=uv.getY(v); uv.setXY(v,kap?0.5+u*0.5:u*0.5,w); } }
  uv.needsUpdate=true; g.clearGroups(); g.addGroup(0,g.index.count,0); return _vmFolieG[L]=g; }
/* Klebebandrolle als Drehkoerper: Aussen 50 mm, Huelse 38 mm, 48 mm breit (echte Masse) */
let _vmBandGeo=null, _vmBandMat=null;
function vmBandGeo(){ if(_vmBandGeo) return _vmBandGeo;
  const ri=0.038, ra=0.05, h=0.024, P=[[ri,-h],[ra,-h],[ra,h],[ri,h],[ri,-h]].map(([r,y])=>new THREE.Vector2(r,y));
  /* Ultra Low / ohne HIQ: halb so viele Segmente */
  _vmBandGeo=new THREE.LatheGeometry(P,(typeof GFX!=='undefined'&&GFX==='ultralow')||!HIQ?10:20); return _vmBandGeo; }
function vmBandMat(){ return _vmBandMat||(_vmBandMat=new THREE.MeshStandardMaterial({map:vmTexturen().band,roughness:0.32,metalness:0.02,side:THREE.DoubleSide})); }
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
    const top=new THREE.MeshStandardMaterial({map:T.deckel[id],roughness:0.88});
    const m=new THREE.Mesh(new THREE.BoxGeometry(w-0.08,1,d-0.1),[mat,mat,top,mat,mat,mat]);
    setz(m,x,VM_BOEDEN[boden[id]]+0.5,z+0.01); g.add(m); reg(m);
    if(HIQ){ m.castShadow=true; m.receiveShadow=true; }
    R.stapel[id]={m,dicke:dicke[id],y0:VM_BOEDEN[boden[id]]};
    const sm=setz(plane(0.2,0.05,new THREE.MeshBasicMaterial({map:T.schild[id],toneMapped:false}),0,0,0,0,g),x,VM_BOEDEN[boden[id]]-0.035,z+d/2+0.006); reg(sm);
  }
  /* Folienrollen liegen laengs, bis zu drei */
  const fm=vmFolieMat(), fg=vmFolieGeo(w-0.1);
  /* Rollen laengs in Regal-x: im gedrehten Regal zeigt die Achse in Welt-x genauso */
  for(let j=0;j<3;j++){ const m=new THREE.Mesh(fg,fm); m.rotation.z=Math.PI/2; const p=P(x,z-0.18+j*0.18); m.position.set(p.x,VM_BOEDEN[3]+0.085,p.z); g.add(m); reg(m); R.folie.push(m); }
  const sm=setz(plane(0.24,0.05,new THREE.MeshBasicMaterial({map:T.schild.folie,toneMapped:false}),0,0,0,0,g),x,VM_BOEDEN[3]-0.035,z+d/2+0.006); reg(sm);
  /* Klebeband: offener Karton auf dem Regal, bis zu zwoelf Rollen */
  B(k,0.5,0.004,0.24,0xc49a62,x,VM_RH+0.002,z); for(const s of [-1,1]){ B(k,0.5,0.06,0.006,0xc49a62,x,VM_RH+0.03,z+s*0.12); B(k,0.006,0.06,0.24,0xc49a62,x+s*0.25,VM_RH+0.03,z); }
  /* zwoelf echte Klebebandrollen in einem Zeichenaufruf; sichtbar sind so viele, wie da sind */
  { const im=new THREE.InstancedMesh(vmBandGeo(),vmBandMat(),12), q=new THREE.Matrix4();
    for(let j=0;j<12;j++){ const p=P(x-0.2+(j%6)*0.08,z+(j<6?-0.055:0.055)); q.makeTranslation(p.x,VM_RH+0.03,p.z); im.setMatrixAt(j,q); }
    im.instanceMatrix.needsUpdate=true; if(HIQ) im.castShadow=true; g.add(im); reg(im); R.bandIM=im; }
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
    { const mm=Array.isArray(st.m.material)?st.m.material[0]:st.m.material; if(mm.map&&mm.map.repeat) mm.map.repeat.set(1,Math.max(0.05,h/0.25)); } }
  const rollen=Math.ceil(s.folie/VM.folie.stueck);
  R.folie.forEach((m,j)=>{ m.visible=sichtbar&&j<rollen;
    /* die angebrochene Rolle wird duenner */
    const rest=j===rollen-1?(s.folie-(rollen-1)*VM.folie.stueck)/VM.folie.stueck:1, r=0.45+0.55*Math.sqrt(Math.max(0,rest));
    m.scale.set(r,1,r); m.position.y=VM_BOEDEN[3]+0.085*r; });
  const br=Math.min(12,Math.ceil(s.band/8));
  if(R.bandIM){ R.bandIM.count=sichtbar?br:0; R.bandIM.visible=sichtbar&&br>0; }
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
/* Katalogbild im Laptop (09.10.: echte Kartons, Rollen und Folie statt Streifen) */
const _vmPic={};
function vmPic(id){
  if(_vmPic[id]) return _vmPic[id];
  const c=document.createElement('canvas'); c.width=224; c.height=152; const g=c.getContext('2d'), W=224, H=152;
  const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#1b2540'); gr.addColorStop(1,'#0c1222'); g.fillStyle=gr; g.fillRect(0,0,W,H);
  g.fillStyle='rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(W/2,128,86,12,0,0,Math.PI*2); g.fill();
  /* schraeger Quader: Front, Oberseite, rechte Seite */
  const quader=(x,y,w,h,d,front,top,seite)=>{ g.fillStyle=front; g.fillRect(x,y,w,h);
    g.fillStyle=top; g.beginPath(); g.moveTo(x,y); g.lineTo(x+d,y-d*0.55); g.lineTo(x+w+d,y-d*0.55); g.lineTo(x+w,y); g.closePath(); g.fill();
    g.fillStyle=seite; g.beginPath(); g.moveTo(x+w,y); g.lineTo(x+w+d,y-d*0.55); g.lineTo(x+w+d,y+h-d*0.55); g.lineTo(x+w,y+h); g.closePath(); g.fill(); };
  const rolle=(cx,cy,r,ri,w,mantel,kante,huelse)=>{ /* liegende Rolle, Achse nach rechts */
    g.fillStyle=mantel; g.fillRect(cx,cy-r,w,2*r); g.beginPath(); g.ellipse(cx+w,cy,r*0.38,r,0,-Math.PI/2,Math.PI/2); g.fill();
    g.fillStyle=kante; g.beginPath(); g.ellipse(cx,cy,r*0.38,r,0,0,Math.PI*2); g.fill();
    g.fillStyle=huelse; g.beginPath(); g.ellipse(cx,cy,ri*0.38,ri,0,0,Math.PI*2); g.fill();
    g.fillStyle='#1a120a'; g.beginPath(); g.ellipse(cx,cy,ri*0.26,ri*0.72,0,0,Math.PI*2); g.fill(); };
  if(id==='folie'){
    const f=g.createLinearGradient(0,40,0,120); f.addColorStop(0,'#f2f9fd'); f.addColorStop(0.5,'#c9e0ee'); f.addColorStop(1,'#93b6ca');
    rolle(60,82,38,12,108,f,'#d8e9f3','#b08654');
    for(let y=50;y<118;y+=7) for(let x=66+((y/7)%2)*3.5;x<168;x+=7){ g.fillStyle='rgba(255,255,255,.85)'; g.beginPath(); g.arc(x,y,2.3,0,Math.PI*2); g.fill(); g.fillStyle='rgba(110,140,160,.45)'; g.beginPath(); g.arc(x+0.8,y+0.9,2.3,0,Math.PI*2); g.fill(); }
    for(let r=36;r>14;r-=4){ g.strokeStyle='rgba(120,150,170,.45)'; g.lineWidth=1; g.beginPath(); g.ellipse(60,82,r*0.38,r,0,0,Math.PI*2); g.stroke(); }
  } else if(id==='band'){
    /* Sechserpack in Folie, davor eine einzelne Rolle */
    for(let i=0;i<3;i++){ const x=58+i*38, y=62; g.fillStyle='#b88445'; g.beginPath(); g.ellipse(x,y,17,10,0,0,Math.PI*2); g.fill(); g.fillRect(x-17,y,34,22); g.beginPath(); g.ellipse(x,y+22,17,10,0,0,Math.PI); g.fill();
      g.fillStyle='#d9a75e'; g.beginPath(); g.ellipse(x,y,17,10,0,0,Math.PI*2); g.fill(); g.fillStyle='#c9ab7c'; g.beginPath(); g.ellipse(x,y,12,7,0,0,Math.PI*2); g.fill(); g.fillStyle='#2a1c0e'; g.beginPath(); g.ellipse(x,y,9,5,0,0,Math.PI*2); g.fill(); }
    g.strokeStyle='rgba(220,235,245,.35)'; g.lineWidth=1.5; g.strokeRect(38,50,150,38);
    const x=112, y=104; g.fillStyle='#b88445'; g.fillRect(x-30,y-4,60,22); g.beginPath(); g.ellipse(x,y+18,30,13,0,0,Math.PI); g.fill();
    g.fillStyle='#d9a75e'; g.beginPath(); g.ellipse(x,y-4,30,13,0,0,Math.PI*2); g.fill();
    for(let r=28;r>21;r-=2){ g.strokeStyle='rgba(255,230,180,.35)'; g.beginPath(); g.ellipse(x,y-4,r,r*0.43,0,0,Math.PI*2); g.stroke(); }
    g.fillStyle='#c9ab7c'; g.beginPath(); g.ellipse(x,y-4,21,9,0,0,Math.PI*2); g.fill(); g.fillStyle='#2a1c0e'; g.beginPath(); g.ellipse(x,y-4,16,6.5,0,0,Math.PI*2); g.fill();
  } else {
    /* Buendel flacher Zuschnitte mit Umreifung, dahinter ein aufgebauter Karton */
    const sz={ks:[70,36,38],km:[86,46,46],kl:[102,56,52]}[id]||[80,40,40];
    quader(130,112-sz[1],sz[0]*0.62,sz[1],sz[2]*0.55,'#b98a52','#cfa36b','#9c7240');
    g.fillStyle='rgba(205,168,98,.95)'; g.fillRect(130,112-sz[1]-2,sz[0]*0.62,3);
    g.fillStyle='#f4f2ea'; g.fillRect(138,112-sz[1]+8,22,14); g.fillStyle='#1d3e8a'; g.font='700 9px sans-serif'; g.fillText('DDL',141,112-sz[1]+18);
    const n={ks:10,km:8,kl:6}[id]||8, d=6, w=100, x0=22;
    for(let i=0;i<n;i++){ const y=118-(i+1)*d; quader(x0,y,w,d-1,26,i%2?'#c39a64':'#b48b56','#d0a874','#9c7442');
      g.fillStyle='rgba(70,45,18,.5)'; for(let x=x0;x<x0+w;x+=3) g.fillRect(x,y+1,1,d-3); }
    const top=118-n*d;
    g.fillStyle='#24366e'; for(const sx of [0.25,0.7]){ g.fillRect(x0+w*sx,top,6,n*d); g.beginPath(); g.moveTo(x0+w*sx,top); g.lineTo(x0+w*sx+26,top-14); g.lineTo(x0+w*sx+32,top-14); g.lineTo(x0+w*sx+6,top); g.fill(); }
    g.fillStyle='#f2c230'; g.font='700 16px sans-serif'; g.textAlign='left'; g.fillText(VM[id].kurz.toUpperCase(),16,26);
  }
  g.strokeStyle='rgba(242,245,255,.18)'; g.lineWidth=2; g.strokeRect(1,1,W-2,H-2);
  return _vmPic[id]=c.toDataURL('image/png');
}
