/* =========================================================
   Figuren im Low-Poly-Stil: kantige Koerper, Pixelgesichter.
   Wenige Koepfe, viele Kleider. Ein Kopf ist eine feste Person
   (Alter, Geschlecht, Haut, Frisur); die Kleidung wird bei jedem
   Auftritt neu gewuerfelt. So bleiben es zwoelf Gesichter, aber
   kaum ein Kunde sieht aus wie der vorige.
   ========================================================= */
/* Feines Pixelrauschen fuer alle Stoffe - gibt den gemalten Look */
const PX_NOISE=(()=>{ const t=tex(16,16,(g,W,H)=>{
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const v=Math.round(228+Math.random()*27); g.fillStyle=`rgb(${v},${v},${v})`; g.fillRect(x,y,1,1); } });
  t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter; return t; })();
const _pm={}, _pg={};
function pmat(hex){ return _pm[hex]||(_pm[hex]=std(hex,{map:PX_NOISE,roughness:0.9,flatShading:true})); }
function pbox(w,h,d){ const k=w+'|'+h+'|'+d; return _pg[k]||(_pg[k]=new THREE.BoxGeometry(w,h,d)); }
function pcyl(rt,rb,h,n){ const k='c'+rt+'|'+rb+'|'+h+'|'+n; return _pg[k]||(_pg[k]=new THREE.CylinderGeometry(rt,rb,h,n)); }
function teil(geo,m,x,y,z,parent,schatten){ const o=new THREE.Mesh(geo,m); o.position.set(x,y,z); if(HIQ&&schatten!==false) o.castShadow=true; parent.add(o); return o; }
function shade2(hex,k){ const c=new THREE.Color(hex); c.multiplyScalar(k); return c.getHex(); }
const hexCss=h=>'#'+('000000'+h.toString(16)).slice(-6);

/* Die zwoelf Koepfe */
const KOEPFE=[
  {id:'teen_m',  sex:'m',alter:'teen',  haut:0xe8b890,haar:0x4a2f1c,frisur:'strubbel'},
  {id:'teen_w',  sex:'w',alter:'teen',  haut:0xf0c8a4,haar:0xc9a15a,frisur:'zopf'},
  {id:'jung_m',  sex:'m',alter:'jung',  haut:0xe2ad84,haar:0x2b1d14,frisur:'kurz'},
  {id:'jung_w',  sex:'w',alter:'jung',  haut:0xecbe98,haar:0x6b4423,frisur:'bob'},
  {id:'jung_m2', sex:'m',alter:'jung',  haut:0x7a4c30,haar:0x1a1a1a,frisur:'kurz',stoppel:1},
  {id:'jung_w2', sex:'w',alter:'jung',  haut:0xf4d0b4,haar:0x1f1a18,frisur:'dutt'},
  {id:'mitte_m', sex:'m',alter:'mittel',haut:0xdcaa82,haar:0x8f8f96,frisur:'kurz',brille:1},
  {id:'mitte_m2',sex:'m',alter:'mittel',haut:0xb1794c,haar:0x24201c,frisur:'kurz',bart:1},
  {id:'mitte_w', sex:'w',alter:'mittel',haut:0xd09a6c,haar:0x2b1d14,frisur:'lang'},
  {id:'mitte_m3',sex:'m',alter:'mittel',haut:0xf0c8a4,haar:0x9c4a26,frisur:'kurz',stoppel:1},
  {id:'alt_w',   sex:'w',alter:'alt',   haut:0xecc4a2,haar:0xb8b8b8,frisur:'bob',falten:1},
  {id:'alt_m',   sex:'m',alter:'alt',   haut:0xe0b08a,haar:0xc8c8c8,frisur:'glatze',brille:2,falten:1}
];
/* Kleidung: welche Teile zusammengehoeren und wer sie traegt */
const KLEID=[
  {id:'jogger', wer:['teen','jung'],                   oben:'hoodie',unten:'jogging',schuh:'sneaker'},
  {id:'laessig',wer:['teen','jung','mittel'],          oben:'hoodie',unten:'jeans',  schuh:'sneaker'},
  {id:'shirt',  wer:['teen','jung'],                   oben:'tshirt',unten:'jeans',  schuh:'sneaker'},
  {id:'winter', wer:['teen','jung','mittel','alt'],    oben:'stepp', unten:'jeans',  schuh:'boot',muetze:0.55},
  {id:'blouson',wer:['jung','mittel','alt'],sex:'m',   oben:'jacke', unten:'chino',  schuh:'boot'},
  {id:'pulli',  wer:['jung','mittel','alt'],           oben:'pulli', unten:'stoff',  schuh:'halb'},
  {id:'schick', wer:['jung','mittel'],sex:'m',         oben:'weste', unten:'stoff',  schuh:'halb',schick:1},
  {id:'bluse',  wer:['jung','mittel'],sex:'w',         oben:'bluse', unten:'stoff',  schuh:'ballerina',schick:1},
  {id:'rock',   wer:['mittel','alt'],sex:'w',          oben:'pulli', unten:'rock',   schuh:'pumps'},
  {id:'mantel', wer:['jung','mittel','alt'],           oben:'mantel',unten:'stoff',  schuh:'halb',schick:1,schal:0.6},
  {id:'arbeit', wer:['jung','mittel'],                 oben:'polo',  unten:'cargo',  schuh:'boot',arbeit:1}
];
const KFARBE={
  hoodie:[0x8a8f96,0x2a2e38,0x7a1f2a,0x2f5d8a,0x3f6b3a,0xc8a23a,0x5a3a7a],
  tshirt:[0xf2f2ee,0x1b1d24,0x2f7fd0,0x3f6b3a,0xe0a030,0x6a4a7a],
  polo:[0x2f5a3a,0x1f3a6b,0xd8d4c8,0x3a3a44,0x5a6a7a],
  weste:[0x2a2c33,0x3a3226,0x1c2438],
  jacke:[0x1f2a4a,0x3a4a2a,0x5a3a22,0x2a2a30],
  pulli:[0x7a6090,0x2f5d8a,0xc8b89a,0x3f6b3a,0x5a5f6a,0x8a4a3a],
  bluse:[0x7a1f2a,0xe8e2d6,0x2f5d8a,0x6a4a7a,0x3a6a5a],
  stepp:[0x1b1d24,0x2f7fd0,0x3f6b3a,0xc8a23a,0x5a3a7a,0xd07f2f,0x8a8f96],
  mantel:[0x3a3228,0x2a2c33,0x5a4a3a,0x6a2a2a,0x2a3a4a],
  jeans:[0x2f4a7a,0x243a5f,0x3a5a8a,0x1f2a3a],
  jogging:[0x5a5f66,0x1b1d24,0x2a3048,0x3a3f4a],
  chino:[0xb8a47a,0x8a7a5a,0x5a5a4a,0x3a3f4a],
  stoff:[0x1d1f24,0x2a2c33,0x3a3a40,0x2a3048],
  rock:[0x2a2a30,0x3a2a3a,0x2a3048,0x4a3a2a],
  cargo:[0x2a2c28,0x4a4a3a,0x1d1f24]
};
const SCHUHFARBE={sneaker:[0xe8e8e4,0x8a8f96,0x2a2e38],boot:[0x5a3a22,0x2a2420,0x7a5a3a],halb:[0x1b1b1f,0x3a2618],ballerina:[0x1b1b1f,0x6a2a2a],pumps:[0x1b1b1f,0x3a2618]};
const MUETZE=[0xe63b2e,0xffd23f,0x2f7fd0,0xf2f5ff,0x2f9e57,0x222634,0x8a5ab8];
/* Einheitliche Arbeitskleidung: rotes Polo mit gelbem Logo, schwarze
   Hose, schwarze Schuhe. Jeder Posten hat seinen festen Kopf, damit
   man die Leute wiedererkennt. */
const UNIFORM={oben:'polo',unten:'stoff',schuh:'halb',obenF:0xb3261e,untenF:0x1d1f24,schuhF:0x1b1b1f,logo:1,id:'uniform'};
const STAFFKOPF={kassierer:'jung_w',auffueller:'jung_m',auffueller2:'mitte_m2',reinigung:'mitte_w',security:'mitte_m3',packer:'jung_m2'};
const kopfVon=id=>KOEPFE.find(k=>k.id===id)||KOEPFE[2];
function kopfFuer(ct){
  const teen=KOEPFE.filter(k=>k.alter==='teen'), rest=KOEPFE.filter(k=>k.alter!=='teen');
  if(ct&&ct.id==='jugend') return pick(teen);
  if(ct&&(ct.id==='profi'||ct.id==='angeber'||ct.id==='stamm')) return pick(rest);
  return Math.random()<0.12?pick(teen):pick(rest);
}
function kleidFuer(k,ct){
  let l=KLEID.filter(o=>o.wer.indexOf(k.alter)>=0&&(!o.sex||o.sex===k.sex));
  const id=ct&&ct.id;
  if(id==='angeber'){ const s=l.filter(o=>o.schick); if(s.length) l=s; }
  else if(id==='profi'){ const s=l.filter(o=>o.arbeit||o.id==='winter'||o.id==='blouson'); if(s.length) l=s; }
  else if(id==='spar') l=l.filter(o=>!o.schick);
  const o=Object.assign({},pick(l));
  o.obenF=pick(KFARBE[o.oben]); o.untenF=pick(KFARBE[o.unten]); o.schuhF=pick(SCHUHFARBE[o.schuh]);
  if(o.muetze&&Math.random()<o.muetze) o.muetzeF=pick(MUETZE);
  if(o.schal&&Math.random()<o.schal) o.schalF=pick(MUETZE);
  if(o.unten==='rock') o.strumpf=Math.random()<0.5?0x1d1d22:k.haut;
  return o;
}
/* Pixelgesicht: 20 x 24 Pixel auf 20 x 24 cm Kopfvorderseite */
const faceCache={};
function faceTex(k){
  if(faceCache[k.id]) return faceCache[k.id];
  const t=tex(20,24,(g,W,H)=>{
    const px=(x,y,c,w,h)=>{ g.fillStyle=c; g.fillRect(x,y,w||1,h||1); };
    const haut=hexCss(k.haut), dunkel=hexCss(shade2(k.haut,0.86)), dunkler=hexCss(shade2(k.haut,0.74));
    const haar=hexCss(k.haar);
    px(0,0,haut,W,H);
    px(0,21,dunkel,W,3);
    /* Haaransatz */
    const f=k.frisur;
    if(f==='kurz'||f==='strubbel'){ px(0,0,haar,W,3); px(0,3,haar,2,5); px(18,3,haar,2,5);
      if(f==='strubbel') for(const x of [2,5,6,9,13,14,17]) px(x,3,haar); }
    else if(f==='zopf'||f==='dutt'){ px(0,0,haar,W,2); px(0,2,haar,2,5); px(18,2,haar,2,5); px(9,2,haut,2,1); }
    else if(f==='bob'||f==='lang'){ px(0,0,haar,W,3); px(0,3,haar,12,1); px(0,3,haar,3,f==='lang'?21:13); px(17,3,haar,3,f==='lang'?21:13); }
    else if(f==='glatze'){ px(0,7,haar,1,5); px(19,7,haar,1,5); }
    /* Brauen, Augen */
    const braue=hexCss(shade2(k.haar,k.haar>0xa0a0a0?0.7:0.85));
    px(4,8,braue,4,1); px(12,8,braue,4,1);
    px(5,10,'#15161c',2,2); px(13,10,'#15161c',2,2);
    px(4,10,'#f2f2ee',1,2); px(15,10,'#f2f2ee',1,2);
    /* Nase, Mund */
    px(9,12,dunkel,2,3); px(9,14,dunkler,2,1);
    px(7,17,k.sex==='w'?'#b4524e':hexCss(shade2(k.haut,0.62)),6,1);
    if(k.falten){ px(6,15,dunkel,1,2); px(13,15,dunkel,1,2); px(4,12,dunkel,3,1); px(13,12,dunkel,3,1); }
    /* Bart */
    if(k.bart){ px(3,15,haar,14,8); px(7,14,haar,6,1); px(7,17,dunkler,6,1); px(8,18,dunkler,4,1); }
    else if(k.stoppel){ g.globalAlpha=0.35; px(3,15,haar,14,8); px(7,14,haar,6,1); g.globalAlpha=1; px(7,17,hexCss(shade2(k.haut,0.62)),6,1); }
    /* Brille */
    if(k.brille){ const r=k.brille===2?'#6b4a2c':'#2a2e38';
      for(const x0 of [3,11]){ px(x0,9,r,6,1); px(x0,12,r,6,1); px(x0,9,r,1,4); px(x0+5,9,r,1,4); }
      px(9,10,r,2,1); }
  });
  t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter; t.generateMipmaps=false;
  faceCache[k.id]=t; return t;
}
const _faceMat={};
function faceMat(k){ return _faceMat[k.id]||(_faceMat[k.id]=new THREE.MeshStandardMaterial({map:faceTex(k),roughness:0.8,flatShading:true})); }

function schuh(O,pv){
  const m=pmat(O.schuhF), sohle=pmat(O.schuh==='sneaker'?0xf2f2ee:0x1a1816);
  if(O.schuh==='sneaker'){ teil(pbox(0.135,0.065,0.25),m,0,-0.83,0.04,pv); teil(pbox(0.14,0.025,0.26),sohle,0,-0.868,0.04,pv,false); }
  else if(O.schuh==='boot'){ teil(pbox(0.14,0.12,0.25),m,0,-0.81,0.035,pv); teil(pbox(0.145,0.025,0.26),sohle,0,-0.868,0.035,pv,false); }
  else if(O.schuh==='ballerina'){ teil(pbox(0.11,0.05,0.21),m,0,-0.855,0.03,pv); }
  else if(O.schuh==='pumps'){ teil(pbox(0.11,0.055,0.2),m,0,-0.845,0.035,pv); teil(pbox(0.04,0.04,0.04),m,0,-0.86,-0.055,pv,false); }
  else { teil(pbox(0.13,0.07,0.24),m,0,-0.845,0.04,pv); }
}
function haare(k,h){
  const m=pmat(k.haar), f=k.frisur;
  if(f==='glatze'){ for(const sx of [-1,1]) teil(pbox(0.02,0.06,0.16),m,sx*0.105,0.02,-0.02,h,false);
    teil(pbox(0.212,0.07,0.03),m,0,0.01,-0.1,h,false); return; }
  teil(pbox(0.214,0.05,0.224),m,0,0.125,0,h);
  if(f==='bob'||f==='lang'){
    const L=f==='lang'?0.34:0.22;
    for(const sx of [-1,1]) teil(pbox(0.03,L,0.2),m,sx*0.112,0.1-L/2,-0.012,h,false);
    teil(pbox(0.224,L+0.06,0.04),m,0,0.13-(L+0.06)/2,-0.112,h,false);
    return;
  }
  for(const sx of [-1,1]) teil(pbox(0.02,0.08,0.18),m,sx*0.106,0.07,-0.015,h,false);
  teil(pbox(0.214,0.17,0.03),m,0,0.05,-0.1,h,false);
  if(f==='strubbel') for(const [x,z] of [[-0.06,0.04],[0.03,-0.03],[0.07,0.05],[-0.02,-0.07]]) teil(pbox(0.06,0.03,0.06),m,x,0.155,z,h,false);
  if(f==='zopf'){ const z=teil(pbox(0.06,0.2,0.06),m,0,-0.03,-0.14,h,false); z.rotation.x=0.28;
    teil(pbox(0.066,0.025,0.066),pmat(0xe63b2e),0,0.06,-0.12,h,false); }
  if(f==='dutt') teil(pbox(0.09,0.08,0.08),m,0,0.15,-0.08,h,false);
}
function makePerson(opt){
  opt=opt||{};
  const K=opt.kopf?kopfVon(opt.kopf):opt.uniform?kopfVon(STAFFKOPF[opt.uniform]):kopfFuer(opt.ct);
  const O=opt.outfit||(opt.uniform?UNIFORM:kleidFuer(K,opt.ct));
  const g=new THREE.Group();
  const haut=pmat(K.haut), w=K.sex==='w';
  const obenM=pmat(O.obenF), untenM=pmat(O.untenF);
  const legs=[], arms=[];
  const rock=O.unten==='rock', mantel=O.oben==='mantel';
  /* Beine */
  const beinM=rock?pmat(O.strumpf||K.haut):untenM;
  for(const sx of [-1,1]){
    const pv=new THREE.Group(); pv.position.set(sx*0.085,0.88,0); g.add(pv);
    teil(pbox(rock?0.11:0.145,0.8,rock?0.12:0.16),beinM,0,-0.4,0,pv);
    if(O.unten==='jogging'){ teil(pbox(0.012,0.7,0.03),pmat(0xe8e8e8),sx*0.075,-0.38,0,pv,false);
      teil(pbox(0.135,0.06,0.15),pmat(shade2(O.untenF,0.78)),0,-0.77,0,pv,false); }
    if(O.unten==='cargo') teil(pbox(0.02,0.14,0.1),pmat(shade2(O.untenF,0.82)),sx*0.08,-0.32,0,pv,false);
    if(O.unten==='jeans') teil(pbox(0.15,0.03,0.165),pmat(shade2(O.untenF,0.8)),0,-0.77,0,pv,false);
    schuh(O,pv);
    legs.push(pv);
  }
  /* Becken, Rock, Mantelschoss */
  teil(pbox(0.33,0.13,0.2),rock?obenM:untenM,0,0.9,0,g);
  if(rock){ const r=teil(pcyl(0.2,0.27,0.44,8),untenM,0,0.74,0,g); r.scale.z=0.74; }
  if(mantel){ const r=teil(pcyl(0.21,0.25,0.4,8),obenM,0,0.76,0,g); r.scale.z=0.72; }
  /* Rumpf: nach oben breiter, eckig */
  const stepp=O.oben==='stepp';
  const hwT=(w?0.182:0.205)+(stepp?0.018:0), hwB=(w?0.165:0.178)+(stepp?0.018:0), s=0.55, tH=0.56, tY=1.21;
  const torso=new THREE.Group(); torso.position.y=tY; torso.scale.z=s; g.add(torso);
  { const tm=new THREE.Mesh(pcyl(hwT/0.7071,hwB/0.7071,tH,4),obenM); tm.rotation.y=Math.PI/4; if(HIQ) tm.castShadow=true; torso.add(tm); }
  /* Vorderseite des Rumpfs auf Hoehe y (relativ zur Rumpfmitte) */
  const fz=y=>(hwB+(hwT-hwB)*((y+tH/2)/tH))*s+0.004;
  const vorn=(bw,bh,y,m,x)=>teil(pbox(bw,bh,0.012),m,x||0,tY+y,fz(y),g,false);
  const rundum=(y,h,m)=>{ const hw=hwB+(hwT-hwB)*((y+tH/2)/tH)+0.006; teil(pbox(hw*2,h,hw*2*s),m,0,tY+y,0,g,false); };
  const dunkel=pmat(shade2(O.obenF,0.72)), weiss=pmat(0xf2f2ee);
  let armM=obenM, lang=true, bund=false;
  const ob=O.oben;
  if(ob==='hoodie'){ vorn(0.22,0.1,-0.16,dunkel); vorn(0.012,0.11,0.19,weiss,-0.04); vorn(0.012,0.11,0.19,weiss,0.04);
    teil(pbox(0.26,0.12,0.08),obenM,0,tY+tH/2+0.01,-hwT*s+0.01,g,false); rundum(-tH/2+0.025,0.05,dunkel); bund=true; }
  else if(ob==='tshirt'){ lang=false; vorn(0.1,0.035,0.265,haut); }
  else if(ob==='polo'){ lang=false; vorn(0.022,0.1,0.22,dunkel);
    for(const sx of [-1,1]){ const c=teil(pbox(0.075,0.035,0.03),dunkel,sx*0.045,tY+tH/2-0.005,fz(tH/2),g,false); c.rotation.z=-sx*0.35; }
    if(O.logo) vorn(0.055,0.04,0.15,pmat(0xffd23f),0.09); }
  else if(ob==='weste'){ armM=weiss; vorn(0.075,0.2,0.18,weiss); for(let i=0;i<3;i++) vorn(0.018,0.018,0.02-i*0.08,pmat(0x111114));
    for(const sx of [-1,1]){ const c=teil(pbox(0.06,0.035,0.03),weiss,sx*0.04,tY+tH/2,fz(tH/2),g,false); c.rotation.z=-sx*0.4; } }
  else if(ob==='jacke'){ vorn(0.06,0.11,0.225,pmat(0xa8c4e8)); vorn(0.01,0.44,-0.03,pmat(0x15161a));
    for(const sx of [-1,1]){ const c=teil(pbox(0.09,0.05,0.04),dunkel,sx*0.07,tY+tH/2,fz(tH/2)-0.01,g,false); c.rotation.z=-sx*0.3; }
    rundum(-tH/2+0.03,0.06,dunkel); bund=true; }
  else if(ob==='pulli'){ vorn(0.12,0.03,0.265,dunkel); rundum(-tH/2+0.02,0.04,dunkel); bund=true; }
  else if(ob==='bluse'){ for(const sx of [-1,1]){ const c=teil(pbox(0.07,0.04,0.03),dunkel,sx*0.045,tY+tH/2-0.01,fz(tH/2),g,false); c.rotation.z=-sx*0.4; }
    for(let i=0;i<4;i++) vorn(0.014,0.014,0.17-i*0.1,pmat(0xf2f2ee)); }
  else if(ob==='stepp'){ for(const y of [-0.13,0.01,0.15]) rundum(y,0.014,dunkel);
    teil(pbox(0.2,0.08,0.17),obenM,0,tY+tH/2+0.03,0,g,false); vorn(0.01,0.46,-0.02,dunkel); bund=true; }
  else if(ob==='mantel'){ for(const sx of [-1,1]){ const c=vorn(0.05,0.2,0.16,dunkel,sx*0.05); c.rotation.z=sx*0.35; }
    vorn(0.07,0.12,0.22,weiss); for(let i=0;i<3;i++) vorn(0.02,0.02,0.0-i*0.1,pmat(0x111114),0.03); }
  else if(ob==='warnweste'){ armM=pmat(0x2a2e38); rundum(0.08,0.035,pmat(0xd8dde4)); rundum(-0.1,0.035,pmat(0xd8dde4)); vorn(0.1,0.035,0.265,armM); }
  /* Arme */
  for(const sx of [-1,1]){
    const pv=new THREE.Group(); pv.position.set(sx*(hwT+0.05),1.45,0); g.add(pv);
    if(lang) teil(pbox(0.1,0.31,0.11),armM,0,-0.14,0,pv);
    else { teil(pbox(0.112,0.15,0.12),obenM,0,-0.06,0,pv); teil(pbox(0.085,0.2,0.09),haut,0,-0.2,0,pv); }
    const fa=new THREE.Group(); fa.position.y=-0.3; fa.rotation.x=-0.18; pv.add(fa);
    teil(pbox(lang?0.095:0.08,0.26,lang?0.1:0.085),lang?armM:haut,0,-0.13,0,fa);
    if(lang&&bund) teil(pbox(0.1,0.035,0.105),dunkel,0,-0.25,0,fa,false);
    teil(pbox(0.07,0.1,0.05),haut,0,-0.31,0.005,fa);
    pv.rotation.z=sx*0.05; arms.push(pv);
  }
  /* Hals, Schal */
  teil(pbox(0.09,0.08,0.09),haut,0,1.52,0,g);
  if(O.schalF){ const sm=pmat(O.schalF); teil(pbox(0.17,0.065,0.16),sm,0,1.5,0,g,false); teil(pbox(0.055,0.2,0.025),sm,0.05,1.38,fz(0.17)+0.01,g,false); }
  /* Kopf: Kasten mit Pixelgesicht vorn */
  const head=new THREE.Group(); head.position.set(0,1.66,0.005); g.add(head);
  { const hm=new THREE.Mesh(pbox(0.2,0.24,0.21),[haut,haut,haut,haut,faceMat(K),haut]); if(HIQ) hm.castShadow=true; head.add(hm); }
  for(const sx of [-1,1]) teil(pbox(0.02,0.05,0.04),haut,sx*0.108,0,0,head,false);
  if(O.muetzeF){ const mm=pmat(O.muetzeF);
    teil(pbox(0.222,0.09,0.232),mm,0,0.13,0,head); teil(pbox(0.228,0.035,0.238),pmat(shade2(O.muetzeF,0.8)),0,0.09,0,head,false);
    if(K.frisur==='bob'||K.frisur==='lang'||K.frisur==='zopf') haareUnterMuetze(K,head);
    teil(pbox(0.05,0.045,0.05),pmat(0xf2f5ff),0,0.195,0,head,false);
  } else haare(K,head);
  const blob=new THREE.Mesh(new THREE.CircleGeometry(0.33,18),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.28,depthWrite:false})); blob.rotation.x=-Math.PI/2; blob.position.y=0.024; g.add(blob);
  const gross=K.alter==='teen'?0.92:w?0.96:1.0;
  g.scale.setScalar(gross*rand(0.97,1.03));
  g.userData={legs,arms,torso,head,ph:Math.random()*6,sway:Math.random()*6,gang:rock?0.55:mantel?0.75:1,kopf:K.id,kleid:O.id,oben:O.obenF};
  return g;
}
/* Lange Haare schauen unter der Muetze heraus */
function haareUnterMuetze(k,h){
  const m=pmat(k.haar);
  if(k.frisur==='zopf'){ const z=teil(pbox(0.06,0.2,0.06),m,0,-0.03,-0.14,h,false); z.rotation.x=0.28; return; }
  const L=k.frisur==='lang'?0.3:0.18;
  for(const sx of [-1,1]) teil(pbox(0.03,L,0.2),m,sx*0.112,0.08-L/2,-0.012,h,false);
  teil(pbox(0.224,L,0.04),m,0,0.08-L/2,-0.112,h,false);
}
function animPerson(g,moving,dt,speed){
  const u=g.userData; if(moving) u.ph+=dt*speed*5.0; u.sway+=dt;
  const a=moving?Math.sin(u.ph)*0.52:0, k=Math.min(1,dt*12);
  /* im Rock oder Mantel kleinere Schritte, sonst stossen die Beine durch */
  const b=a*(u.gang||1);
  u.legs[0].rotation.x+=(b-u.legs[0].rotation.x)*k; u.legs[1].rotation.x+=(-b-u.legs[1].rotation.x)*k;
  u.arms[0].rotation.x+=(-a*0.8-u.arms[0].rotation.x)*k; u.arms[1].rotation.x+=(a*0.8-u.arms[1].rotation.x)*k;
  const idle=moving?0:Math.sin(u.sway*1.6)*0.02;
  u.torso.rotation.z+=(idle-u.torso.rotation.z)*k;
  if(u.head) u.head.rotation.y+=((moving?0:Math.sin(u.sway*0.7)*0.25)-u.head.rotation.y)*k*0.5;
}
function bubble(text,bad){
  const t=tex(360,84,(g,W,H)=>{ g.fillStyle=bad?'#ffd7cf':'#f2f5ff'; g.beginPath(); if(g.roundRect) g.roundRect(4,4,W-8,H-8,26); else g.rect(4,4,W-8,H-8); g.fill(); g.fillStyle='#0e1226'; fitFont(g,text,W-30,34,BAR); g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,W/2,H/2+2); });
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true,toneMapped:false})); s.scale.set(1.7,0.4,1); s.position.y=2.25; s.renderOrder=10; return s;
}
const alertTex=tex(128,128,(g,W,H)=>{ g.clearRect(0,0,W,H); g.fillStyle='#e63b2e'; g.beginPath(); g.moveTo(64,6); g.lineTo(122,116); g.lineTo(6,116); g.closePath(); g.fill(); g.fillStyle='#fff'; g.fillRect(56,40,16,44); g.fillRect(56,92,16,16); });
function alertSprite(){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:alertTex,depthTest:false,transparent:true,toneMapped:false})); s.scale.set(0.45,0.45,1); s.position.y=2.25; s.renderOrder=11; return s; }
