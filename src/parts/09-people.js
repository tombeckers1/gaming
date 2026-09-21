
/* =========================================================
   Figuren
   ========================================================= */
const SKIN=['#f4d0b4','#e7b892','#d09a6c','#b1794c','#8d5a3b','#6a4028','#5a3420','#f8dcc8','#eec4a2','#c98f63','#a06b45','#7a4c30','#fae3d2','#dcae86'];
const HAIR=[0x2b1d14,0x4a2f1c,0x6b4423,0xc9a15a,0x1a1a1a,0x8a4a2a,0xb8b8b8,0x6a2f1a,0x3a3a3a,0xd8c08a,0x5a3a22,0x8f8f96,0x9c3a2a,0xe0d4b0,0x24201c];
const JACKET=[0x2f7fd0,0x2f9e57,0x9b2c2c,0x3b4262,0x8a5ab8,0xd07f2f,0x1f6b6b,0x5d6470,0xc8a23a,0x222634,0x7a4a2a,0x30516e];
const PANTS=[0x2a3048,0x3b3b3b,0x4a5a7a,0x5a4a3a,0x1d1f26,0x6b6257];
const HATS=[0xe63b2e,0xffd23f,0x2f7fd0,0xf2f5ff,0x2f9e57,0x222634,0x8a5ab8];
const EYES=['#3b2a1a','#2a4a6a','#3a5a3a','#1b1d26','#5a3a2a','#4a6f8a','#6b8a4a','#2f2318','#7a5a3a'];
const faceCache={};
const LIPS=['#b4635e','#a8524f','#c26a72','#8f4a46','#cf7a80','#d0505f','#b23a4a'];
function shade(hex,k){ const c=new THREE.Color(hex); c.multiplyScalar(k); return '#'+c.getHexString(); }
function faceTex(skin,hair,v,eye,beard,glass,f){
  f=f||{};
  const key=[skin,hair,v,eye,beard,glass,f.lips|0,f.freck|0,f.age|0,f.stub|0,f.cold|0,f.nose|0,f.brow|0].join('|');
  if(faceCache[key]) return faceCache[key];
  const hairC='#'+new THREE.Color(hair).getHexString();
  const TW=COARSE?320:512, TH=TW/2;
  const t=tex(TW,TH,(g,W,H)=>{
    g.scale(W/512,H/256);
    const cx=128;
    /* Grundton mit Verlauf: Stirn heller, Kiefer dunkler */
    g.fillStyle=skin; g.fillRect(0,0,W,H);
    const gr=g.createLinearGradient(0,60,0,H); gr.addColorStop(0,'rgba(255,255,255,.10)'); gr.addColorStop(0.55,'rgba(255,255,255,0)'); gr.addColorStop(1,'rgba(0,0,0,.14)');
    g.fillStyle=gr; g.fillRect(0,0,W,H);
    /* Wangen, Kieferschatten, Schläfen */
    g.fillStyle=shade(skin,0.9); g.globalAlpha=0.45; g.beginPath(); g.ellipse(cx,234,84,40,0,0,Math.PI*2); g.fill();
    for(const s of [-1,1]){ g.beginPath(); g.ellipse(cx+s*70,150,16,44,0,0,Math.PI*2); g.fill(); }
    g.globalAlpha=1;
    /* Winterröte */
    const blush=f.cold?0.3:0.15;
    g.fillStyle=`rgba(212,92,86,${blush})`;
    for(const s of [-1,1]){ g.beginPath(); g.ellipse(cx+s*46,154,23,15,0,0,Math.PI*2); g.fill(); }
    /* Sommersprossen */
    if(f.freck){ g.fillStyle='rgba(150,96,58,.4)';
      for(let i=0;i<70;i++){ const a=Math.random()*Math.PI*2, r=Math.random()*54;
        const x=cx+Math.cos(a)*r, y=146+Math.sin(a)*r*0.5;
        g.beginPath(); g.arc(x,y,rand(1.1,2.4),0,Math.PI*2); g.fill(); } }
    /* Nase mit Rücken, Spitze, Nasenflügeln */
    const nw=8+f.nose*2.5;
    g.fillStyle=shade(skin,0.95); g.globalAlpha=0.7; g.fillRect(cx-nw*0.45,108,nw*0.9,34); g.globalAlpha=1;
    g.fillStyle=shade(skin,0.87); g.beginPath(); g.ellipse(cx,140,nw,17,0,0,Math.PI*2); g.fill();
    if(f.cold){ g.fillStyle='rgba(206,96,86,.3)'; g.beginPath(); g.ellipse(cx,143,nw*0.85,11,0,0,Math.PI*2); g.fill(); }
    g.fillStyle='rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(cx-2,132,3.4,8,0.2,0,Math.PI*2); g.fill();
    g.fillStyle=shade(skin,0.7);
    for(const s of [-1,1]){ g.beginPath(); g.ellipse(cx+s*(nw*0.62),149,3.4,2.4,0,0,Math.PI*2); g.fill();
      g.globalAlpha=0.45; g.beginPath(); g.ellipse(cx+s*(nw*1.1),145,4,8,s*0.3,0,Math.PI*2); g.fill(); g.globalAlpha=1; }
    /* Augen */
    const ew=13, eh=10.5+ (v%3===1?1.5:0);
    for(const s of [-1,1]){
      const ex=cx+s*27;
      g.fillStyle=shade(skin,0.8); g.globalAlpha=0.35; g.beginPath(); g.ellipse(ex,109,17,9,0,0,Math.PI*2); g.fill(); g.globalAlpha=1;
      g.fillStyle='#fbfbfd'; g.beginPath(); g.ellipse(ex,120,ew,eh,0,0,Math.PI*2); g.fill();
      g.fillStyle='rgba(120,100,90,.18)'; g.beginPath(); g.ellipse(ex,116,ew,eh*0.6,0,0,Math.PI*2); g.fill();
      const ir=g.createRadialGradient(ex-1.5,119,1,ex,121,6.6);
      ir.addColorStop(0,shade(eye,1.5)); ir.addColorStop(0.65,eye); ir.addColorStop(1,shade(eye,0.55));
      g.fillStyle=ir; g.beginPath(); g.arc(ex,121,6.5,0,Math.PI*2); g.fill();
      g.strokeStyle='rgba(20,16,12,.55)'; g.lineWidth=1.4; g.beginPath(); g.arc(ex,121,6.5,0,Math.PI*2); g.stroke();
      g.fillStyle='#14161d'; g.beginPath(); g.arc(ex,121,3.0,0,Math.PI*2); g.fill();
      g.fillStyle='#fff'; g.beginPath(); g.arc(ex-2.4,118,2.1,0,Math.PI*2); g.fill();
      g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.arc(ex+2.2,124,1.1,0,Math.PI*2); g.fill();
      /* Lidfalte und Wimpern */
      g.strokeStyle='rgba(30,22,16,.6)'; g.lineWidth=2.6; g.beginPath(); g.ellipse(ex,120,ew,eh,0,Math.PI*1.04,Math.PI*1.96); g.stroke();
      g.strokeStyle='rgba(30,22,16,.28)'; g.lineWidth=1.6; g.beginPath(); g.ellipse(ex,116,ew*0.95,eh*0.75,0,Math.PI*1.1,Math.PI*1.9); g.stroke();
      if(f.lips||v%4===2){ g.strokeStyle='rgba(20,14,10,.55)'; g.lineWidth=1.6;
        for(let k=0;k<5;k++){ const a=Math.PI*1.12+k*0.16; g.beginPath();
          g.moveTo(ex+Math.cos(a)*ew,120+Math.sin(a)*eh); g.lineTo(ex+Math.cos(a)*ew*1.3,120+Math.sin(a)*eh*1.5); g.stroke(); } }
      /* Brauen aus einzelnen Strichen */
      const lift=v%3===1?4:v%3===2?-3:0, th=f.brow?7.5:5.2;
      g.strokeStyle=hairC; g.lineCap='round';
      for(let k=0;k<9;k++){
        const u=k/8, bx=ex-s*13+s*u*27, by=99-lift-Math.sin(u*Math.PI)*5+(v%2?u*3:-u*2);
        g.lineWidth=th*(0.55+0.55*Math.sin(u*Math.PI));
        g.beginPath(); g.moveTo(bx,by+3); g.lineTo(bx+s*2.5,by-3.5); g.stroke();
      }
    }
    /* Mund und Lippen */
    const my=173, mw=15;
    if(f.lips){
      const lc=LIPS[f.lips-1]||LIPS[0];
      g.fillStyle=lc; g.beginPath();
      g.moveTo(cx-mw,my); g.quadraticCurveTo(cx-mw*0.5,my-6,cx,my-2.5); g.quadraticCurveTo(cx+mw*0.5,my-6,cx+mw,my);
      g.quadraticCurveTo(cx,my+12,cx-mw,my); g.fill();
      g.fillStyle='rgba(255,255,255,.28)'; g.beginPath(); g.ellipse(cx,my+4.5,6,2.2,0,0,Math.PI*2); g.fill();
      g.strokeStyle='rgba(60,20,20,.35)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(cx-mw,my); g.lineTo(cx+mw,my); g.stroke();
    } else {
      g.fillStyle=shade(skin,0.8); g.globalAlpha=0.5; g.beginPath(); g.ellipse(cx,my+3,mw+3,8,0,0,Math.PI*2); g.fill(); g.globalAlpha=1;
      g.strokeStyle='#8a4038'; g.lineWidth=4.2; g.lineCap='round'; g.beginPath();
      if(v%3===0){ g.moveTo(cx-mw,my-2); g.quadraticCurveTo(cx,my+13,cx+mw,my-2); }
      else if(v%3===1){ g.moveTo(cx-12,my+2); g.lineTo(cx+12,my+2); }
      else { g.moveTo(cx-13,my); g.quadraticCurveTo(cx,my+8,cx+13,my-1); }
      g.stroke();
      if(v%3===0){ g.fillStyle='#fdfdfa'; g.fillRect(cx-10,my,20,4); }
    }
    /* Philtrum und Kinngrübchen */
    g.fillStyle='rgba(0,0,0,.08)'; g.fillRect(cx-2.5,157,5,10);
    if(v%5===3){ g.fillStyle='rgba(0,0,0,.09)'; g.beginPath(); g.ellipse(cx,204,5,7,0,0,Math.PI*2); g.fill(); }
    /* Falten */
    if(f.age){ g.strokeStyle='rgba(90,64,44,.3)'; g.lineWidth=2;
      for(const s of [-1,1]){ g.beginPath(); g.moveTo(cx+s*22,152); g.quadraticCurveTo(cx+s*30,168,cx+s*22,184); g.stroke(); }
      g.lineWidth=1.8; g.strokeStyle='rgba(90,64,44,.22)';
      for(let k=0;k<3;k++){ g.beginPath(); g.moveTo(cx-38,72+k*9); g.quadraticCurveTo(cx,66+k*9,cx+38,72+k*9); g.stroke(); }
      for(const s of [-1,1]) for(let k=0;k<3;k++){ g.beginPath(); g.moveTo(cx+s*40,112+k*5); g.lineTo(cx+s*50,108+k*6); g.stroke(); } }
    /* Dreitagebart */
    if(f.stub&&!beard){ g.save(); g.globalAlpha=0.32; g.fillStyle=hairC;
      for(let i=0;i<900;i++){ const a=Math.random()*Math.PI*2, r=Math.random();
        const x=cx+Math.cos(a)*r*50, y=192+Math.sin(a)*r*30;
        if(y>150) { g.fillRect(x,y,1.6,1.6); } }
      g.restore(); }
    /* Vollbart */
    if(beard){ g.globalAlpha=0.6; g.fillStyle=hairC;
      g.beginPath(); g.ellipse(cx,188,46,32,0,0,Math.PI*2); g.fill();
      g.globalAlpha=0.5; g.beginPath(); g.ellipse(cx,163,23,9,0,0,Math.PI*2); g.fill();
      g.globalAlpha=0.35;
      for(let i=0;i<500;i++){ const a=Math.random()*Math.PI*2, r=Math.random();
        g.fillRect(cx+Math.cos(a)*r*50,188+Math.sin(a)*r*34,1.8,2.6); }
      g.globalAlpha=1;
      g.fillStyle=skin; g.beginPath(); g.ellipse(cx,173,17,7,0,0,Math.PI*2); g.fill();
    }
    /* Brille */
    if(glass){ const rnd=glass===1;
      g.strokeStyle=glass===2?'#6b4a2c':'#2a2e38'; g.lineWidth=4;
      for(const s of [-1,1]){ g.beginPath();
        if(rnd) g.arc(cx+s*27,121,19,0,Math.PI*2);
        else { if(g.roundRect){ g.roundRect(cx+s*27-21,121-16,42,32,6); } else g.rect(cx+s*27-21,121-16,42,32); }
        g.stroke();
        g.fillStyle='rgba(180,210,240,.14)'; g.fill(); }
      g.beginPath(); g.moveTo(cx-7,120); g.lineTo(cx+7,120); g.stroke();
      g.beginPath(); g.moveTo(cx-48,118); g.lineTo(cx-64,124); g.stroke();
      g.beginPath(); g.moveTo(cx+48,118); g.lineTo(cx+64,124); g.stroke();
    }
    /* Haaransatz vorne */
    if(v!==4){
      g.fillStyle=hairC;
      g.beginPath(); g.ellipse(cx,42,74,42,0,0,Math.PI*2); g.fill();
      if(v===0){ g.beginPath(); g.moveTo(cx-74,58); g.quadraticCurveTo(cx,86,cx+74,58); g.lineTo(cx+74,16); g.lineTo(cx-74,16); g.fill(); }
      else if(v===1){ g.beginPath(); g.moveTo(cx-74,54); g.quadraticCurveTo(cx-30,74,cx,50); g.quadraticCurveTo(cx+30,74,cx+74,54); g.lineTo(cx+74,16); g.lineTo(cx-74,16); g.fill(); }
      else if(v===2){ g.beginPath(); g.moveTo(cx-74,50); g.quadraticCurveTo(cx-10,92,cx+40,60); g.lineTo(cx+74,50); g.lineTo(cx+74,16); g.lineTo(cx-74,16); g.fill(); }
      else if(v===3){ g.beginPath(); g.ellipse(cx,34,66,30,0,0,Math.PI*2); g.fill(); }
      else { g.beginPath(); g.moveTo(cx-74,60); g.quadraticCurveTo(cx,44,cx+74,60); g.lineTo(cx+74,16); g.lineTo(cx-74,16); g.fill(); }
      g.strokeStyle='rgba(255,255,255,.12)'; g.lineWidth=2;
      for(let k=0;k<14;k++){ const x=cx-70+k*10; g.beginPath(); g.moveTo(x,18); g.quadraticCurveTo(x+6,40,x-2,62); g.stroke(); }
      g.fillStyle='rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(cx,66,70,10,0,0,Math.PI*2); g.fill();
    }
  });
  faceCache[key]=t; return t;
}
/* Begrenzter Vorrat an Gesichtern: genug Abwechslung, ohne dass der
   Speicher mit jedem Kunden weiterwächst */
const FACEPOOL=[], FACEMAX=COARSE?12:22;
function newFace(){
  return {skin:pick(SKIN),hair:pick(HAIR),v:Math.floor(Math.random()*6),eye:pick(EYES),
    beard:Math.random()<0.26, glass:Math.random()<0.24?(Math.random()<0.4?1:(Math.random()<0.7?2:3)):0,
    fe:{lips:Math.random()<0.3?1+Math.floor(Math.random()*LIPS.length):0,
      freck:Math.random()<0.18?1:0, age:Math.random()<0.2?1:0,
      stub:Math.random()<0.28?1:0, cold:Math.random()<0.55?1:0,
      nose:Math.floor(Math.random()*3), brow:Math.random()<0.35?1:0}};
}
function faceFor(){
  if(FACEPOOL.length<FACEMAX){ const f=newFace(); FACEPOOL.push(f); return f; }
  return pick(FACEPOOL);
}
const STAFFLOOK={reinigung:{jacket:0x2f9e57,cap:0x2f9e57},auffueller:{jacket:0xd07f2f,cap:0xd07f2f},auffueller2:{jacket:0xb8541f,cap:0x2a2e38},kassierer:{jacket:0x2f7fd0,cap:0xffd23f},security:{jacket:0x222634,cap:0x222634},packer:{jacket:0xf2c230,cap:0xc8322a}};
function makePerson(opt){
  opt=opt||{};
  const g=new THREE.Group(), F=faceFor();
  const skin=F.skin, hair=F.hair, v=F.v, eye=F.eye, beard=F.beard, glass=F.glass, fe=F.fe;
  const jc=opt.jacket!==undefined?opt.jacket:pick(JACKET);
  const sk=std(parseInt(skin.slice(1),16),{roughness:0.72}), jm=std(jc,{roughness:0.78}), pm=std(pick(PANTS),{roughness:0.9}), shoe=std(0x1d1d22,{roughness:0.55});
  const cyl=(rt,rb,h,m,x,y,z,parent,seg)=>{ const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||14),m); o.position.set(x,y,z); if(HIQ) o.castShadow=true; parent.add(o); return o; };
  const legs=[], arms=[];
  for(const sx of [-0.088,0.088]){ const pv=new THREE.Group(); pv.position.set(sx,0.84,0); g.add(pv);
    cyl(0.075,0.058,0.78,pm,0,-0.39,0,pv);
    const s=box(0.125,0.075,0.26,shoe,0,-0.805,0.045,pv); s.castShadow=HIQ;
    box(0.13,0.035,0.1,std(0x2a2a30),0,-0.775,-0.04,pv,false);
    legs.push(pv); }
  cyl(0.175,0.165,0.16,pm,0,0.88,0,g);
  const torso=cyl(0.2,0.185,0.6,jm,0,1.18,0,g,18); torso.scale.z=0.7;
  // Reißverschluss, Taschen, Kragen
  box(0.014,0.5,0.02,std(0x1a1a1a),0,1.17,0.135,g,false);
  for(const sx of [-1,1]) box(0.075,0.07,0.02,std(0x1a1a1a),sx*0.1,0.98,0.13,g,false);
  const collar=new THREE.Mesh(new THREE.TorusGeometry(0.1,0.035,8,16),jm); collar.rotation.x=Math.PI/2; collar.position.y=1.47; collar.scale.z=0.8; g.add(collar);
  for(const sx of [-1,1]){
    const pv=new THREE.Group(); pv.position.set(sx*0.232,1.405,0); g.add(pv);
    /* Oberarm, Ellenbogen, Unterarm: der Knick nimmt die Steifheit raus */
    const ob=new THREE.Mesh(new THREE.SphereGeometry(0.072,12,8),jm);
    ob.position.y=-0.01; ob.scale.set(1,0.9,0.95); pv.add(ob);
    cyl(0.068,0.056,0.29,jm,0,-0.16,0,pv);
    const fa=new THREE.Group(); fa.position.y=-0.3; fa.rotation.x=-0.22; pv.add(fa);
    const el=new THREE.Mesh(new THREE.SphereGeometry(0.055,10,8),jm); el.scale.set(1,0.85,1); fa.add(el);
    cyl(0.054,0.045,0.27,jm,0,-0.14,0,fa);
    cyl(0.047,0.047,0.045,std(shade2(jc,0.8)),0,-0.278,0,fa);
    const wrist=new THREE.Mesh(new THREE.SphereGeometry(0.038,8,6),sk); wrist.position.y=-0.3; fa.add(wrist);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(0.052,12,9),sk);
    hand.position.set(0,-0.345,0.008); hand.scale.set(0.82,1.18,0.62); hand.rotation.x=0.12; fa.add(hand);
    pv.rotation.z=sx*0.06; arms.push(pv); }
  /* Schultern haengen ab, statt als Kugelkappe aufzusitzen */
  const shoulders=new THREE.Mesh(new THREE.SphereGeometry(0.215,20,12,0,Math.PI*2,0,Math.PI/2),jm);
  shoulders.position.y=1.372; shoulders.scale.set(1.04,0.42,0.74); g.add(shoulders);
  for(const sx of [-1,1]){
    const trap=new THREE.Mesh(new THREE.SphereGeometry(0.115,12,8),jm);
    trap.position.set(sx*0.108,1.415,0); trap.scale.set(1.15,0.62,0.85); g.add(trap);
  }
  /* Hals: unten breit, oben schmal, leicht nach vorn - kein Rohrstueck */
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.052,0.083,0.135,16),sk);
  neck.position.set(0,1.478,0.012); neck.rotation.x=-0.07; g.add(neck);
  /* Halsansatz verschmilzt mit dem Rumpf */
  const nb=new THREE.Mesh(new THREE.SphereGeometry(0.086,14,10),sk);
  nb.position.set(0,1.428,0.008); nb.scale.set(1.05,0.72,0.95); g.add(nb);
  /* Kragen deckt die Naht ab */
  const nc=new THREE.Mesh(new THREE.TorusGeometry(0.086,0.03,8,18),jm);
  nc.rotation.x=Math.PI/2; nc.position.set(0,1.418,0.006); nc.scale.z=0.86; g.add(nc);
  /* Aus der Kugel wird ein Schaedel: schmaler Kiefer, laengeres Kinn,
     etwas flacherer Hinterkopf. Die UVs bleiben, das Gesicht sitzt. */
  const hg=new THREE.SphereGeometry(0.152,28,22);
  { const ap=hg.attributes.position, R=0.152;
    for(let i=0;i<ap.count;i++){
      const x=ap.getX(i), y=ap.getY(i), z=ap.getZ(i), t=clamp(y/R,-1,1);
      const jaw  = t<0 ? 1-0.26*Math.pow(-t,1.3) : 1;
      const crown= t>0.5 ? 1-0.08*((t-0.5)/0.5) : 1;
      const nape = z<0 ? 1+0.05*(-z/R) : 1;
      ap.setXYZ(i, x*jaw*crown*0.985, y*(1+0.07*Math.max(0,-t)), z*jaw*crown*nape);
    }
    ap.needsUpdate=true; if(hg.computeVertexNormals) hg.computeVertexNormals(); }
  const head=new THREE.Mesh(hg,new THREE.MeshStandardMaterial({map:faceTex(skin,hair,v,eye,beard,glass,fe),roughness:0.62}));
  head.position.set(0,1.672,0.014); head.scale.set(0.97,1.06,0.95); head.rotation.x=0.03;
  if(HIQ) head.castShadow=true; g.add(head);
  /* Kieferschatten unter dem Kinn nimmt die Plastiklook-Kante */
  const jawS=new THREE.Mesh(new THREE.SphereGeometry(0.093,12,8),sk);
  jawS.position.set(0,1.575,0.026); jawS.scale.set(1.0,0.56,0.86); g.add(jawS);
  for(const sx of [-1,1]){ const e=new THREE.Mesh(new THREE.SphereGeometry(0.029,10,7),sk);
    e.position.set(sx*0.139,1.666,-0.004); e.scale.set(0.42,1.12,0.78); e.rotation.z=sx*0.12; g.add(e); }
  const hm=std(hair,{roughness:0.85});
  if(opt.cap!==undefined){
    const cm=std(opt.cap,{roughness:0.8});
    const cap=new THREE.Mesh(new THREE.SphereGeometry(0.161,18,10,0,Math.PI*2,0,Math.PI*0.5),cm); cap.position.y=1.7; cap.scale.set(0.98,0.92,0.98); g.add(cap);
    const vis=box(0.26,0.022,0.17,cm,0,1.7,0.15,g,false); vis.rotation.x=-0.12;
  } else if(Math.random()<0.42){
    const hc=pick(HATS), mm=std(hc,{roughness:0.9}), mm2=std(shade2(hc,0.82),{roughness:0.92});
    const hat=new THREE.Mesh(new THREE.SphereGeometry(0.164,18,10,0,Math.PI*2,0,Math.PI*0.54),mm); hat.position.y=1.7; hat.scale.set(0.97,1.02,0.97); g.add(hat);
    const fold=new THREE.Mesh(new THREE.CylinderGeometry(0.166,0.168,0.055,20),mm2); fold.position.y=1.712; g.add(fold);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(0.157,0.028,8,20),mm2); rim.rotation.x=Math.PI/2; rim.position.y=1.686; g.add(rim);
    if(Math.random()<0.55){ const pom=new THREE.Mesh(new THREE.SphereGeometry(0.05,10,8),std(0xf2f5ff)); pom.position.y=1.882; g.add(pom); }
    if(v!==4){ const back=new THREE.Mesh(new THREE.SphereGeometry(0.15,14,10,Math.PI*0.15,Math.PI*0.7,Math.PI*0.3,Math.PI*0.4),hm); back.position.y=1.66; back.rotation.y=Math.PI; g.add(back); }
  } else if(Math.random()<0.1){
    /* Kapuze über dem Kopf */
    const kc=std(shade2(jc,0.85),{roughness:0.85});
    const hood=new THREE.Mesh(new THREE.SphereGeometry(0.2,16,12,0,Math.PI*2,0,Math.PI*0.62),kc); hood.position.y=1.68; hood.scale.set(1,1.05,1.1); g.add(hood);
    const brim=new THREE.Mesh(new THREE.TorusGeometry(0.19,0.028,8,20),kc); brim.rotation.x=Math.PI/2-0.3; brim.position.set(0,1.63,0.03); g.add(brim);
  } else if(v!==4){
    const cap=new THREE.Mesh(new THREE.SphereGeometry(0.159,18,12,0,Math.PI*2,0,Math.PI*0.47),hm); cap.position.y=1.695; cap.rotation.x=-0.24; cap.scale.set(0.98,1.05,1.0); g.add(cap);
    const back=new THREE.Mesh(new THREE.SphereGeometry(0.153,14,10,Math.PI*0.15,Math.PI*0.7,Math.PI*0.25,Math.PI*0.45),hm); back.position.y=1.675; back.rotation.y=Math.PI; back.scale.set(1,1.06,1); g.add(back);
    const st=Math.random();
    if(st<0.2){ const tail=new THREE.Mesh(new THREE.SphereGeometry(0.075,10,8),hm); tail.position.set(0,1.58,-0.15); tail.scale.set(0.8,1.6,0.8); g.add(tail); }
    else if(st<0.34){ const bun=new THREE.Mesh(new THREE.SphereGeometry(0.072,12,10),hm); bun.position.set(0,1.79,-0.11); g.add(bun);
      const wrap=new THREE.Mesh(new THREE.TorusGeometry(0.072,0.014,6,14),std(pick([0xc8322a,0x2a2e38,0xffd23f]))); wrap.rotation.x=1.2; wrap.position.set(0,1.79,-0.11); g.add(wrap); }
    else if(st<0.5){ const lng=new THREE.Mesh(new THREE.SphereGeometry(0.15,14,12,0,Math.PI*2,0,Math.PI*0.6),hm);
      lng.position.set(0,1.63,-0.05); lng.scale.set(1.02,1.9,1.0); lng.rotation.x=0.2; g.add(lng); }
    else if(st<0.6){ for(const sx of [-1,1]){ const br=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.02,0.3,7),hm);
      br.position.set(sx*0.13,1.52,-0.03); br.rotation.z=sx*0.18; g.add(br); } }
  }
  /* Steppjacke und Handschuhe */
  if(Math.random()<0.4){ for(let k=0;k<3;k++){ const q=new THREE.Mesh(new THREE.TorusGeometry(0.2,0.016,6,18),jm);
    q.rotation.x=Math.PI/2; q.position.y=1.02+k*0.17; q.scale.z=0.7; g.add(q); } }
  if(Math.random()<0.35){ const gm=std(pick([0x2a2e38,0x8a3a3a,0x3b4262,0x6b4423]),{roughness:0.9});
    arms.forEach(pv=>{ const gl=new THREE.Mesh(new THREE.SphereGeometry(0.062,10,8),gm); gl.position.y=-0.6; gl.scale.set(0.9,1.1,0.85); pv.add(gl); }); }
  if(Math.random()<0.38){ const sc=new THREE.Mesh(new THREE.TorusGeometry(0.088,0.038,8,16),std(pick([0xc8322a,0xf2f5ff,0x2f9e57,0xffd23f,0x5a4a8a]))); sc.rotation.x=Math.PI/2; sc.position.y=1.5; sc.scale.z=0.85; g.add(sc); }
  if(!opt.cap&&Math.random()<0.18){ const bp=box(0.3,0.38,0.16,std(pick([0x3b4262,0x2f9e57,0x8a3a3a])),0,1.2,-0.18,g); bp.scale.z=1; }
  const blob=new THREE.Mesh(new THREE.CircleGeometry(0.33,18),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.28,depthWrite:false})); blob.rotation.x=-Math.PI/2; blob.position.y=0.024; g.add(blob);
  g.scale.setScalar(rand(0.93,1.07));
  g.userData={legs,arms,torso,head,ph:Math.random()*6,sway:Math.random()*6};
  return g;
}
function shade2(hex,k){ const c=new THREE.Color(hex); c.multiplyScalar(k); return c.getHex(); }
function animPerson(g,moving,dt,speed){
  const u=g.userData; if(moving) u.ph+=dt*speed*5.0; u.sway+=dt;
  const a=moving?Math.sin(u.ph)*0.52:0, k=Math.min(1,dt*12);
  u.legs[0].rotation.x+=(a-u.legs[0].rotation.x)*k; u.legs[1].rotation.x+=(-a-u.legs[1].rotation.x)*k;
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
