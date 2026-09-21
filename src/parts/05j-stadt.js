/* Jedes Stadtmesh wird markiert: so laesst sich im Test pruefen, dass
   nichts davon in den begehbaren Bereich ragt. */
function stadtAdd(m){ m.userData.stadt=true; scene.add(m); return m; }
/* =========================================================
   Stadt hinter dem Laden.
   Gebaut in Ringen, wie es Spiele mit grosser Sichtweite machen:
   was nah ist, hat Fenster, Balkone und Dachaufbauten; was fern
   ist, wird zur Silhouette und laeuft farblich in den Himmel.
   Jeder Ring ist zu wenigen Meshes verschmolzen, damit die
   Bildrate nicht einbricht.
   ========================================================= */

/* Der Spielbereich bleibt frei: hier steht schon etwas */
const STADT_FREI=[
  {x0:-88,x1:42,z0:-44,z1:38},       /* Laden, Lager, beide Hoefe, Testfeld  */
  {x0:42, x1:96,z0:-20,z1:18},       /* Logistikzentrum mit Vorplatz         */
  {x0:-260,x1:260,z0:8,z1:23}        /* die Fahrbahn bleibt frei             */
];
function stadtFrei(x,z,r){
  for(const f of STADT_FREI)
    if(x+r>f.x0&&x-r<f.x1&&z+r>f.z0&&z-r<f.z1) return false;
  return true;
}

/* --------------------------------------------------------
   Fassadentexturen fuer die Ferne: einmal am Tag, einmal die
   Fensterlichter fuer die Nacht. Die Fenster sitzen in einem
   Raster, ein Teil davon brennt.
   -------------------------------------------------------- */
function fernFassade(cols,rows,px,py,nacht,stil){
  return tex(px,py,(g,W,H)=>{
    const dunkel=stil==='glas';
    if(nacht){ g.fillStyle='#000000'; g.fillRect(0,0,W,H); }
    else {
      const gr=g.createLinearGradient(0,0,0,H);
      if(dunkel){ gr.addColorStop(0,'#5d6a7c'); gr.addColorStop(1,'#3e4a5a'); }
      else { gr.addColorStop(0,'#b6b0a4'); gr.addColorStop(1,'#8e887c'); }
      g.fillStyle=gr; g.fillRect(0,0,W,H);
      /* Betonstruktur und Verschmutzung */
      for(let i=0;i<220;i++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.05})`;
        g.fillRect(Math.random()*W,Math.random()*H,rand(2,9),rand(2,9)); }
      for(let i=0;i<14;i++){ const x=Math.random()*W;
        const s=g.createLinearGradient(x,0,x,H); s.addColorStop(0,'rgba(40,40,46,.16)'); s.addColorStop(1,'rgba(40,40,46,0)');
        g.fillStyle=s; g.fillRect(x,rand(0,H*0.5),rand(4,16),H); }
    }
    const cw=W/cols, ch=H/rows;
    const fw=cw*(dunkel?0.82:0.56), fh=ch*(dunkel?0.7:0.6);
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const x=c*cw+(cw-fw)/2, y=r*ch+(ch-fh)/2;
      /* Erdgeschoss ist breiter verglast */
      const eg=r===rows-1;
      const ww=eg?cw*0.86:fw, wx=eg?c*cw+(cw-cw*0.86)/2:x;
      const an=((r*7+c*13+((r*c)%5))%10)<(nacht?5:10);
      if(nacht){
        if(!an) continue;
        const warm=['#ffd79a','#ffc478','#f4e3c0','#ffb96b','#cfe0ff','#e8d7ff'][(r*3+c*5)%6];
        g.fillStyle=warm; g.globalAlpha=rand(0.55,1);
        g.fillRect(wx,y,ww,fh);
        /* etwas Streulicht um das Fenster */
        g.globalAlpha=0.16; g.fillRect(wx-ww*0.12,y-fh*0.12,ww*1.24,fh*1.24);
        g.globalAlpha=1;
      } else {
        g.fillStyle=dunkel?'#2b3442':'#3a4250';
        g.fillRect(wx,y,ww,fh);
        /* Glasreflex */
        g.fillStyle='rgba(180,205,230,.20)';
        g.fillRect(wx,y,ww,fh*0.32);
        /* Fensterbank */
        if(!dunkel){ g.fillStyle='rgba(235,232,222,.55)'; g.fillRect(wx-1,y+fh,ww+2,Math.max(1,ch*0.05)); }
      }
    }
    if(!nacht){
      /* Gesimse zwischen den Geschossen */
      g.fillStyle='rgba(0,0,0,.10)';
      for(let r=1;r<rows;r++) g.fillRect(0,r*ch-1,W,2);
      /* Dachkante */
      g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(0,0,W,Math.max(2,H*0.012));
    }
  },false);
}
/* Ein Materialsatz je Rasterdichte, damit wenige Zeichenaufrufe reichen */
const STADT_MATS=[];
function fernMaterial(cols,rows,stil,fern){
  const key=cols+'x'+rows+stil+(fern?'f':'n');
  let m=STADT_MATS[key];
  if(m) return m;
  const q=COARSE?0.55:1;
  const px=Math.round(clamp(cols*22,128,512)*q), py=Math.round(clamp(rows*20,128,512)*q);
  m=new THREE.MeshStandardMaterial({
    vertexColors:true, roughness:fern?1:0.9, metalness:stil==='glas'?0.18:0,
    map:fernFassade(cols,rows,px,py,false,stil),
    emissive:LIN(0xffffff),
    emissiveMap:fernFassade(cols,rows,px,py,true,stil),
    emissiveIntensity:0
  });
  houseMats.push(m);
  STADT_MATS[key]=m;
  return m;
}

/* --------------------------------------------------------
   Ein Ring voller Haeuser. Die Haeuser stehen auf einem Raster
   mit Luecken, damit Strassenzuege erkennbar bleiben.
   -------------------------------------------------------- */
function stadtRing(opt){
  const eimer={};     /* Rasterdichte -> Liste von Boxen */
  const deko=[];      /* Dachaufbauten, alles in einer Farbe */
  const kanten=[];    /* Attika und Gesims */
  const schritt=opt.raster, halb=schritt/2;
  const n=Math.ceil(opt.r1/schritt);
  for(let ix=-n;ix<=n;ix++) for(let iz=-n;iz<=n;iz++){
    const cx=ix*schritt+rand(-opt.jitter,opt.jitter);
    const cz=iz*schritt+rand(-opt.jitter,opt.jitter);
    const r=Math.hypot(cx,cz);
    if(r<opt.r0||r>opt.r1) continue;
    if(Math.random()>opt.dichte) continue;
    const w=rand(opt.breite[0],opt.breite[1]);
    const d=rand(opt.breite[0],opt.breite[1]);
    if(!stadtFrei(cx,cz,Math.max(w,d)/2+2)) continue;
    /* Hoehe nimmt zur Stadtmitte hin zu, das gibt der Skyline Form */
    const zentral=1-clamp((r-opt.r0)/(opt.r1-opt.r0),0,1);
    let h=rand(opt.hoehe[0],opt.hoehe[1])*(0.72+zentral*0.55);
    if(Math.random()<(opt.turmChance||0)) h*=rand(1.5,2.3);
    const stil=Math.random()<(opt.glas||0)?'glas':'putz';
    const cols=Math.max(2,Math.round(w/(stil==='glas'?2.6:3.4)));
    const rows=Math.max(3,Math.round(h/(stil==='glas'?3.4:3.0)));
    /* Rasterdichten auf wenige Stufen runden */
    const cg=[2,3,4,6,8,10][Math.min(5,Math.max(0,Math.round(Math.log2(cols))))]||4;
    const rg=[4,6,9,14,20,28][Math.min(5,Math.max(0,Math.round(Math.log2(rows/1.4))))]||9;
    const key=cg+'|'+rg+'|'+stil;
    (eimer[key]||(eimer[key]=[])).push({cx,cz,w,d,h,stil});
    /* atmosphaerische Perspektive: je ferner, desto heller und blauer */
    const t=clamp((r-40)/300,0,1);
    const basis=opt.farben[Math.floor(Math.random()*opt.farben.length)];
    const c=new THREE.Color(basis).lerp(new THREE.Color(0xb9cbdd),t*0.62);
    const hex=c.getHex();
    /* Attika */
    kanten.push({geo:new THREE.BoxGeometry(w+0.8,Math.min(1.2,h*0.04)+0.4,d+0.8),
                 m:tm(cx,h+0.2,cz),color:hex});
    if(opt.dach&&Math.random()<0.8){
      /* Dachaufbauten: Technikhaus, Wassertank, Lueftung, Antenne */
      const k=Math.random();
      if(k<0.4) deko.push({geo:new THREE.BoxGeometry(w*0.3,rand(1.4,3),d*0.3),m:tm(cx+rand(-w*0.2,w*0.2),h+rand(0.7,1.5),cz+rand(-d*0.2,d*0.2)),color:0x6e7684});
      else if(k<0.65) deko.push({geo:new THREE.CylinderGeometry(rand(0.8,1.6),rand(0.8,1.6),rand(1.6,3),10),m:tm(cx+rand(-w*0.2,w*0.2),h+rand(0.8,1.6),cz+rand(-d*0.2,d*0.2)),color:0x8a7a62});
      else if(k<0.85) for(let a=0;a<3;a++) deko.push({geo:new THREE.BoxGeometry(1.3,0.9,1.3),m:tm(cx+rand(-w*0.3,w*0.3),h+0.45,cz+rand(-d*0.3,d*0.3)),color:0x9aa2ac});
      else deko.push({geo:new THREE.CylinderGeometry(0.08,0.12,rand(4,8),5),m:tm(cx+rand(-w*0.3,w*0.3),h+rand(2,4),cz),color:0x4a505a});
    }
    /* die Box selbst bekommt ihre Farbe ueber die Vertexfarbe */
    eimer[key][eimer[key].length-1].hex=hex;
  }
  /* pro Rasterdichte ein Mesh */
  let boxen=0;
  for(const key in eimer){
    const [cg,rg,stil]=key.split('|');
    const parts=eimer[key].map(b=>{ boxen++;
      return {geo:new THREE.BoxGeometry(b.w,b.h,b.d),m:tm(b.cx,b.h/2,b.cz),color:b.hex}; });
    if(!parts.length) continue;
    const mesh=new THREE.Mesh(merge(parts),fernMaterial(+cg,+rg,stil,opt.r0>150));
    mesh.frustumCulled=true; stadtAdd(mesh);
  }
  if(kanten.length) stadtAdd(new THREE.Mesh(merge(kanten),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})));
  if(deko.length) stadtAdd(new THREE.Mesh(merge(deko),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.9})));
  return boxen;
}

/* --------------------------------------------------------
   Eine geschlossene Haeuserzeile entlang der Strasse, aber
   verschmolzen statt einzeln: dort schaut niemand auf Balkone,
   und jedes Einzelmesh kostet einen Zeichenaufruf.
   -------------------------------------------------------- */
function stadtZeile(x0,x1,z,tiefe,hoehe,farben,frontZ){
  const eimer={}, kanten=[], deko=[];
  let x=x0;
  while(x<x1-5){
    const w=rand(7,13), h=rand(hoehe[0],hoehe[1]), d=tiefe*rand(0.85,1.15);
    const cx=x+w/2, cz=z+(frontZ>0?d/2:-d/2);
    if(stadtFrei(cx,cz,Math.max(w,d)/2)){
      const stil=Math.random()<0.18?'glas':'putz';
      const cols=Math.max(2,Math.round(w/3.2)), rows=Math.max(3,Math.round(h/3.0));
      const cg=[2,3,4,6,8,10][Math.min(5,Math.max(0,Math.round(Math.log2(cols))))]||4;
      const rg=[4,6,9,14,20,28][Math.min(5,Math.max(0,Math.round(Math.log2(rows/1.4))))]||9;
      const t=clamp((Math.hypot(cx,cz)-40)/300,0,1);
      const c=new THREE.Color(farben[Math.floor(Math.random()*farben.length)]).lerp(new THREE.Color(0xb9cbdd),t*0.5);
      const hex=c.getHex();
      const key=cg+'|'+rg+'|'+stil;
      (eimer[key]||(eimer[key]=[])).push({geo:new THREE.BoxGeometry(w,h,d),m:tm(cx,h/2,cz),color:hex});
      kanten.push({geo:new THREE.BoxGeometry(w+0.6,0.7,d+0.6),m:tm(cx,h+0.2,cz),color:hex});
      /* Schornstein und Antenne, damit die Dachlinie nicht kahl ist */
      if(Math.random()<0.7) deko.push({geo:new THREE.BoxGeometry(0.6,rand(0.8,1.6),0.6),m:tm(cx+rand(-w*0.3,w*0.3),h+1,cz+rand(-d*0.2,d*0.2)),color:0x7a4a3c});
      if(Math.random()<0.35) deko.push({geo:new THREE.CylinderGeometry(0.05,0.07,rand(1.4,2.8),5),m:tm(cx+rand(-w*0.3,w*0.3),h+1.6,cz),color:0x3a3f48});
    }
    x+=w+rand(0.3,1.1);
  }
  for(const key in eimer){
    const [cg,rg,stil]=key.split('|');
    stadtAdd(new THREE.Mesh(merge(eimer[key]),fernMaterial(+cg,+rg,stil,false)));
  }
  if(kanten.length) stadtAdd(new THREE.Mesh(merge(kanten),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})));
  if(deko.length) stadtAdd(new THREE.Mesh(merge(deko),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95})));
}

/* --------------------------------------------------------
   Wahrzeichen: ein Fernsehturm, zwei Kraene und eine Kirche.
   Ohne Orientierungspunkte wirkt jede Skyline beliebig.
   -------------------------------------------------------- */
let turmSpitze=null;
const beacons=[];
function baueBeacon(x,y,z,gross){
  const m=new THREE.MeshStandardMaterial({color:LIN(0x2a1010),emissive:LIN(0xff2a1e),emissiveIntensity:1.6,fog:false});
  const b=new THREE.Mesh(new THREE.SphereGeometry(gross?0.9:0.55,8,6),m);
  b.position.set(x,y,z); scene.add(b);
  beacons.push({m,ph:Math.random()*6.28,sp:rand(0.7,1.3)});
  return b;
}
function buildFernsehturm(x,z){
  const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  const beton=std(0xa9b2bd,{roughness:0.95});
  const H=118;
  const schaft=new THREE.Mesh(new THREE.CylinderGeometry(3.2,7.5,H*0.72,16,1,true),beton);
  schaft.position.y=H*0.36; schaft.material.side=THREE.DoubleSide; g.add(schaft);
  /* Kanzel mit Fensterband */
  const kanzel=new THREE.Mesh(new THREE.CylinderGeometry(9.5,9.5,9,20),
    fernMaterial(20,2,'glas',true));
  kanzel.position.y=H*0.72; g.add(kanzel);
  /* die Kanzel braucht Vertexfarben, weil das Material sie erwartet */
  { const gm=kanzel.geometry, n=gm.attributes.position.count, col=new Float32Array(n*3);
    const c=LIN(0xcdd8e4); for(let i=0;i<n;i++){ col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b; }
    gm.setAttribute('color',new THREE.BufferAttribute(col,3)); }
  const dach=new THREE.Mesh(new THREE.ConeGeometry(10,6,20),beton);
  dach.position.y=H*0.72+7.2; g.add(dach);
  const antenne=new THREE.Mesh(new THREE.CylinderGeometry(0.5,2.2,H*0.3,10),std(0xd8d8d8,{roughness:0.7}));
  antenne.position.y=H*0.86; g.add(antenne);
  const spitze=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.5,12,6),std(0xe8e8e8));
  spitze.position.y=H+4; g.add(spitze);
  turmSpitze=baueBeacon(x,H+11,z,true);
  baueBeacon(x,H*0.72+9,z,false);
}
function buildKran(x,z,h,ry){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry; scene.add(g);
  const gelb=std(0xe0a520,{roughness:0.8});
  const gitter=[];
  /* Mast */
  for(let i=0;i<Math.round(h/3);i++){
    gitter.push({geo:new THREE.BoxGeometry(1.5,0.22,0.22),m:tm(0,i*3,0.7),color:0xe0a520});
    gitter.push({geo:new THREE.BoxGeometry(1.5,0.22,0.22),m:tm(0,i*3,-0.7),color:0xe0a520});
  }
  for(const sx of [-0.7,0.7]) for(const sz of [-0.7,0.7])
    gitter.push({geo:new THREE.BoxGeometry(0.24,h,0.24),m:tm(sx,h/2,sz),color:0xe0a520});
  /* Ausleger und Gegengewicht */
  gitter.push({geo:new THREE.BoxGeometry(34,0.9,1.1),m:tm(11,h+1.4,0),color:0xe0a520});
  gitter.push({geo:new THREE.BoxGeometry(9,1.6,2.2),m:tm(-7,h+1.4,0),color:0x555a62});
  gitter.push({geo:new THREE.BoxGeometry(2.2,2,2),m:tm(0,h+2.8,0),color:0xe0a520});
  /* Seil und Haken */
  gitter.push({geo:new THREE.BoxGeometry(0.1,h*0.5,0.1),m:tm(18,h*0.75,0),color:0x3a3f48});
  gitter.push({geo:new THREE.BoxGeometry(0.7,0.7,0.7),m:tm(18,h*0.5,0),color:0x6a7078});
  stadtAdd(new THREE.Mesh(merge(gitter),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.85})));
  baueBeacon(x+Math.cos(ry)*0+0,h+3.6,z,false);
}
function buildKirche(x,z,ry){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry; scene.add(g);
  const stein=std(0xa39887,{roughness:0.98});
  const dachM=std(0x5d4a44,{roughness:1});
  bbox(16,11,9,stein,0,5.5,0,g);
  const dach=new THREE.Mesh(new THREE.BoxGeometry(16.6,0.5,9.6),dachM); dach.position.y=11.3; g.add(dach);
  for(let i=0;i<8;i++){ const t=new THREE.Mesh(new THREE.BoxGeometry(2,0.35,9.8),dachM);
    t.position.set(-7+i*2,11.55+Math.sin(i/7*Math.PI)*0.4,0); g.add(t); }
  /* Turm mit beleuchtetem Zifferblatt */
  bbox(5.4,27,5.4,stein,-9,13.5,0,g);
  const zb=new THREE.MeshStandardMaterial({color:LIN(0xf4efe0),emissive:LIN(0xffe9b8),emissiveIntensity:0,roughness:0.6,
    map:tex(128,128,(c,W,H)=>{
      c.fillStyle='#f4efe0'; c.beginPath(); c.arc(W/2,H/2,W*0.46,0,Math.PI*2); c.fill();
      c.strokeStyle='#2a2620'; c.lineWidth=4; c.stroke();
      for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; c.save(); c.translate(W/2,H/2); c.rotate(a);
        c.fillStyle='#2a2620'; c.fillRect(-2,-W*0.42,4,W*0.08); c.restore(); }
      c.strokeStyle='#2a2620'; c.lineWidth=5; c.beginPath(); c.moveTo(W/2,H/2); c.lineTo(W/2+W*0.2,H/2-W*0.18); c.stroke();
      c.lineWidth=3; c.beginPath(); c.moveTo(W/2,H/2); c.lineTo(W/2-W*0.08,H/2-W*0.3); c.stroke(); })});
  houseMats.push(zb);
  for(const [dx,dz,rr] of [[0,2.75,0],[0,-2.75,Math.PI],[2.75,0,Math.PI/2],[-2.75,0,-Math.PI/2]]){
    const p=plane(3,3,zb,-9+dx,21,dz,rr,g); p.rotation.y=rr;
  }
  const spitz=new THREE.Mesh(new THREE.ConeGeometry(4,12,4),std(0x4a6a5a,{roughness:0.9}));
  spitz.position.set(-9,33,0); spitz.rotation.y=Math.PI/4; g.add(spitz);
  const kreuz=new THREE.Mesh(new THREE.BoxGeometry(0.2,2.4,0.2),std(0xd8c070,{metalness:0.6,roughness:0.4}));
  kreuz.position.set(-9,40.2,0); g.add(kreuz);
  const quer=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.2,0.2),std(0xd8c070,{metalness:0.6,roughness:0.4}));
  quer.position.set(-9,40.7,0); g.add(quer);
}

/* --------------------------------------------------------
   Ganz aussen: gemalte Silhouetten auf Tafeln. Sie schliessen
   den Horizont, kosten aber fast nichts.
   -------------------------------------------------------- */
function silhouetteTex(seed,hoehe){
  return tex(1024,256,(g,W,H)=>{
    g.clearRect(0,0,W,H);
    let x=0, i=0;
    while(x<W){
      const bw=rand(26,86), bh=rand(H*0.22,H*hoehe);
      const dunkel=40+((seed*13+i*29)%26);
      g.fillStyle=`rgba(${dunkel},${dunkel+6},${dunkel+16},0.92)`;
      g.fillRect(x,H-bh,bw,bh);
      /* ein paar Fenster als Lichtpunkte */
      const cols=Math.max(1,Math.round(bw/12)), rows=Math.max(1,Math.round(bh/14));
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
        if(((r*7+c*11+i*5)%9)>2) continue;
        g.fillStyle='rgba(255,214,150,.5)';
        g.fillRect(x+4+c*12,H-bh+5+r*14,4,5);
      }
      /* gelegentlich ein Dachaufbau */
      if(Math.random()<0.3){ g.fillRect(x+bw*0.3,H-bh-rand(6,16),bw*0.22,rand(6,16)); }
      x+=bw+rand(2,12); i++;
    }
    /* Dunst nach unten, damit die Tafel im Nebel verschwindet */
    const gr=g.createLinearGradient(0,H*0.45,0,H);
    gr.addColorStop(0,'rgba(190,208,224,0)'); gr.addColorStop(1,'rgba(190,208,224,.85)');
    g.fillStyle=gr; g.fillRect(0,H*0.45,W,H*0.55);
  },false);
}
const silhouetten=[];
function buildSilhouetten(){
  const RING=[{r:290,h:54,f:0.55,seed:3},{r:420,h:80,f:0.38,seed:7}];
  RING.forEach(({r,h,f,seed})=>{
    const n=COARSE?6:10;
    for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2;
      const t=silhouetteTex(seed+i,f);
      const m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,fog:true,opacity:0.94});
      const b=r*2*Math.PI/n*1.06;
      const q=new THREE.Mesh(new THREE.PlaneGeometry(b,h),m);
      q.position.set(Math.cos(a)*r,h/2-2,Math.sin(a)*r);
      q.rotation.y=-a+Math.PI/2;
      q.renderOrder=-1;
      scene.add(q);
      silhouetten.push(m);
    }
  });
}

/* --------------------------------------------------------
   Grün in der Stadt: Baumreihen an den Strassen und ein paar
   Parks in den Luecken zwischen den Bloecken. Alles verschmolzen,
   ein Baum ist aus der Ferne nur Stamm und Krone.
   -------------------------------------------------------- */
function buildFernbaeume(){
  const staemme=[], kronen=[];
  const gruen=[0x3c5a32,0x44603a,0x35502c,0x4a6a3e,0x2f4a28,0x546f42];
  const setzen=(x,z,skal)=>{
    if(!stadtFrei(x,z,1.5)) return false;
    const h=rand(5,9)*skal, r=rand(1.9,3.2)*skal;
    staemme.push({geo:new THREE.CylinderGeometry(0.16*skal,0.26*skal,h*0.55,6),m:tm(x,h*0.28,z),color:0x4a3a2c});
    const c=gruen[Math.floor(Math.random()*gruen.length)];
    /* zwei versetzte Kugeln geben der Krone Form, ohne teuer zu sein */
    kronen.push({geo:new THREE.SphereGeometry(r,7,5),m:tm(x,h*0.62,z),color:c});
    kronen.push({geo:new THREE.SphereGeometry(r*0.72,6,5),m:tm(x+rand(-0.6,0.6)*skal,h*0.86,z+rand(-0.6,0.6)*skal),color:c});
    return true;
  };
  /* Alleen entlang der eigenen Strasse, weit links und rechts */
  for(const [von,bis] of [[-230,-56],[34,230]])
    for(let x=von;x<bis;x+=rand(9,15)){
      setzen(x,rand(6.5,7.5),rand(0.85,1.25));
      setzen(x+rand(2,6),rand(23.5,24.5),rand(0.85,1.25));
    }
  /* Parks: Baumgruppen in den Luecken des Quartiers */
  const parks=COARSE?4:8;
  for(let i=0;i<parks;i++){
    const a=Math.random()*Math.PI*2, r=rand(58,170);
    const px=Math.cos(a)*r, pz=Math.sin(a)*r;
    if(!stadtFrei(px,pz,16)) continue;
    const n=COARSE?7:14;
    for(let k=0;k<n;k++)
      setzen(px+rand(-13,13),pz+rand(-13,13),rand(0.9,1.5));
    /* Rasenflaeche darunter */
    const w=rand(22,34), d=rand(20,30);
    const gras=new THREE.Mesh(new THREE.PlaneGeometry(w,d),
      new THREE.MeshStandardMaterial({color:LIN(0x4e6640),roughness:1}));
    gras.rotation.x=-Math.PI/2; gras.position.set(px,0.02,pz);
    stadtAdd(gras);
  }
  /* Ein Gruenzug ganz aussen, damit die Skyline nicht nackt endet */
  for(let i=0;i<(COARSE?24:54);i++){
    const a=Math.random()*Math.PI*2, r=rand(190,330);
    setzen(Math.cos(a)*r,Math.sin(a)*r,rand(1.2,2.2));
  }
  if(staemme.length) stadtAdd(new THREE.Mesh(merge(staemme),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95})));
  if(kronen.length) stadtAdd(new THREE.Mesh(merge(kronen),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.92,flatShading:true})));
  return kronen.length/2;
}

/* =========================================================
   Leben in der Ferne. Eine Stadt ohne Bewegung sieht aus wie
   eine Kulisse, deshalb: Vogelschwaerme, Verkehr auf der
   Ausfallstrasse, ein Flugzeug und Rauch aus Schornsteinen.
   ========================================================= */

/* --- Vogelschwaerme --- */
const schwaerme=[];
function vogelGeo(){
  /* ein flacher Keil, der von unten wie ein Vogel aussieht */
  const g=new THREE.BufferGeometry();
  const v=new Float32Array([ 0,0,-0.55,  -0.7,0.06,0.35,  0,0,0.1,
                             0,0,-0.55,   0,0,0.1,   0.7,0.06,0.35 ]);
  g.setAttribute('position',new THREE.BufferAttribute(v,3));
  g.computeVertexNormals();
  return g;
}
function buildVoegel(){
  const geo=vogelGeo();
  const mat=new THREE.MeshBasicMaterial({color:LIN(0x2b3038),side:THREE.DoubleSide,fog:true});
  const nS=COARSE?2:3;
  for(let s=0;s<nS;s++){
    const g=new THREE.Group(); scene.add(g);
    const n=COARSE?8:14, voegel=[];
    for(let i=0;i<n;i++){
      const m=new THREE.Mesh(geo,mat);
      const r=rand(4,16), a=Math.random()*Math.PI*2;
      m.position.set(Math.cos(a)*r,rand(-3,3),Math.sin(a)*r);
      m.scale.setScalar(rand(0.55,1.0));
      g.add(m);
      voegel.push({m,ph:Math.random()*6.28,sp:rand(7,11)});
    }
    schwaerme.push({g,voegel,
      mx:rand(-90,90), mz:rand(-90,90), my:rand(26,48),
      r:rand(38,70), a:Math.random()*Math.PI*2, sp:rand(0.035,0.075)*(Math.random()<0.5?-1:1)});
  }
}
/* --- Hochstrassen mit Verkehr ---
   Sie laufen quer zur eigenen Strasse und kreuzen sie weit draussen.
   Genau dort ist der Blick frei: schaut man die Strasse hinunter,
   sieht man in der Ferne eine Brueckenfahrbahn mit Verkehr darauf.
   Haetten sie hinter dem Quartier gestanden, waeren sie von den
   Daechern der Haeuserzeile komplett verdeckt. */
const VIA={y:15.5, len:340, x:[-212,218]};
function buildHochstrasse(){
  const teile=[], pfeiler=[], lampen=[];
  const lm=new THREE.MeshStandardMaterial({color:LIN(0x2a2a2e),emissive:LIN(0xffd9a0),emissiveIntensity:0,fog:true});
  lampMats.push(lm);
  VIA.x.forEach((vx,k)=>{
    const n=Math.round(VIA.len/20);
    for(let i=0;i<n;i++){
      const z=-VIA.len/2+i*20+10;
      const dy=Math.sin(i*0.35+k)*0.9;         /* leichte Kuppe in der Fahrbahn */
      teile.push({geo:new THREE.BoxGeometry(13,1.2,20.2),m:tm(vx,VIA.y+dy,z),color:0x8b9099});
      /* Leitplanken links und rechts */
      for(const sx of [-6.2,6.2])
        teile.push({geo:new THREE.BoxGeometry(0.4,0.8,20.2),m:tm(vx+sx,VIA.y+dy+0.95,z),color:0xb4bac4});
      /* Pfeilerpaare */
      if(i%2===0) for(const sx of [-3.4,3.4]){
        pfeiler.push({geo:new THREE.CylinderGeometry(1.2,1.7,VIA.y+dy,10),m:tm(vx+sx,(VIA.y+dy)/2,z),color:0x9aa1ab});
        pfeiler.push({geo:new THREE.BoxGeometry(3.6,0.8,3.6),m:tm(vx+sx,0.4,z),color:0x868d97});
      }
      /* Beleuchtungsmasten mit Ausleger */
      if(i%3===0){
        pfeiler.push({geo:new THREE.CylinderGeometry(0.15,0.22,10,6),m:tm(vx+6.4,VIA.y+dy+6.2,z),color:0x6f767f});
        pfeiler.push({geo:new THREE.BoxGeometry(2.4,0.24,0.5),m:tm(vx+5.2,VIA.y+dy+11.1,z),color:0x6f767f});
        lampen.push({geo:new THREE.BoxGeometry(1.6,0.32,0.8),m:tm(vx+4.4,VIA.y+dy+10.8,z)});
      }
    }
  });
  stadtAdd(new THREE.Mesh(merge(teile),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.92})));
  stadtAdd(new THREE.Mesh(merge(pfeiler),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95})));
  if(lampen.length){ const m=new THREE.Mesh(merge(lampen),lm); m.userData.stadt=true; scene.add(m); }
}
/* --- Verkehr: auf der Hochstrasse und die eigene Strasse hinunter --- */
let verkehrPts=null, verkehrDat=[];
function buildFernverkehr(){
  const n=COARSE?40:84;
  const pos=new Float32Array(n*3), col=new Float32Array(n*3);
  verkehrDat=[];
  for(let i=0;i<n;i++){
    /* Zwei Drittel fahren oben auf dem Viadukt, ein Drittel unten
       die eigene Strasse entlang - dort aber nur weit weg. */
    const oben=i%3!==2;
    const dir=i%2?1:-1;
    verkehrDat.push({oben,dir,t:Math.random(),sp:rand(0.020,0.042),
      bruecke:i%2, spur:dir>0?-2.6:2.6, jit:rand(-0.6,0.6)});
    /* Scheinwerfer weiss, Rueckleuchten rot - je nach Fahrtrichtung */
    const c=dir>0?[1,0.95,0.82]:[1,0.24,0.13];
    col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
    pos[i*3+1]=-999;
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  verkehrPts=new THREE.Points(g,new THREE.PointsMaterial({
    size:2.1,map:dotTex,vertexColors:true,transparent:true,opacity:0,
    depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  verkehrPts.frustumCulled=false; scene.add(verkehrPts);
}
/* --- Flugzeug, das gelegentlich vorbeizieht --- */
let flieger=null, fliegerLicht=null, fliegerT=rand(20,70);
function buildFlieger(){
  const g=new THREE.Group(); scene.add(g); g.visible=false;
  const m=std(0xdfe4ea,{roughness:0.6,metalness:0.2});
  bbox(1.1,0.5,7,m,0,0,0,g,false);
  bbox(9,0.16,1.5,m,0,-0.05,0.4,g,false);
  bbox(3.2,0.14,0.9,m,0,0.5,-2.8,g,false);
  bbox(0.16,1.5,1.1,m,0,0.7,-3,g,false);
  const lm=new THREE.MeshBasicMaterial({color:LIN(0xff3020),fog:false});
  fliegerLicht=new THREE.Mesh(new THREE.SphereGeometry(0.26,6,5),lm);
  fliegerLicht.position.set(0,-0.3,1.5); g.add(fliegerLicht);
  flieger=g;
}
/* --- Rauch aus den Schornsteinen der Stadt --- */
let rauchPts=null, rauchDat=[];
function buildRauch(){
  const quellen=[];
  for(let i=0;i<(COARSE?3:6);i++){
    const a=Math.random()*Math.PI*2, r=rand(70,150);
    const x=Math.cos(a)*r, z=Math.sin(a)*r;
    if(!stadtFrei(x,z,10)) continue;
    quellen.push({x,y:rand(18,34),z});
  }
  if(!quellen.length) return;
  const proQuelle=COARSE?10:18, n=quellen.length*proQuelle;
  const pos=new Float32Array(n*3);
  rauchDat=[];
  for(let q=0;q<quellen.length;q++) for(let i=0;i<proQuelle;i++){
    rauchDat.push({q:quellen[q],t:i/proQuelle,sp:rand(0.055,0.1),dr:rand(0.6,1.8)});
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  rauchPts=new THREE.Points(g,new THREE.PointsMaterial({
    size:7,map:dotTex,color:0xc8ceda,transparent:true,opacity:0.16,
    depthWrite:false,fog:true}));
  rauchPts.frustumCulled=false; scene.add(rauchPts);
}

/* --------------------------------------------------------
   Alles zusammenbauen
   -------------------------------------------------------- */
let stadtBoxen=0, stadtBaeume=0;
function buildStadt(){
  const ZEILE=[0xb0a695,0x9aa3ad,0xa88f7c,0x8d9a8c,0xbfae8e,0x9c8792,0x84909e,0xaa8272];
  /* Die Strasse laeuft nach beiden Seiten weiter, gesaeumt von Haeusern.
     Vorne die Zeile gegenueber, dahinter zwei Reihen zur Tiefe. */
  stadtZeile(-150,-44,23,8.5,[10,18],ZEILE,1);
  stadtZeile(44,150,23,8.5,[10,18],ZEILE,1);
  stadtZeile(-160,160,36,9,[12,22],ZEILE,1);
  /* und unsere Strassenseite jenseits von Hof und Testfeld */
  stadtZeile(-150,-50,7,9,[9,17],ZEILE,-1);
  stadtZeile(28,150,7,9,[9,17],ZEILE,-1);
  stadtZeile(-170,-56,-14,10,[10,20],ZEILE,-1);
  stadtZeile(34,170,-14,10,[10,20],ZEILE,-1);
  /* Ring B: das Quartier gleich hinter der Haeuserzeile */
  stadtBoxen+=stadtRing({
    r0:40, r1:150, raster:COARSE?34:26, jitter:5, dichte:COARSE?0.5:0.72,
    breite:[9,20], hoehe:[11,26], dach:true, glas:0.12, turmChance:0.08,
    farben:[0xb0a695,0x9aa3ad,0xa88f7c,0x8d9a8c,0xbfae8e,0x9c8792,0x84909e,0xaa8272]
  });
  /* Ring C: die Skyline */
  stadtBoxen+=stadtRing({
    r0:165, r1:330, raster:COARSE?58:44, jitter:9, dichte:COARSE?0.45:0.62,
    breite:[14,30], hoehe:[34,86], dach:false, glas:0.55, turmChance:0.22,
    farben:[0x9fb0c2,0x93a4b6,0xa7b4c0,0x8fa2b4,0xb0bcc8]
  });
  /* Wahrzeichen */
  buildFernsehturm(-118,206);
  buildKran(96,148,44,0.7);
  buildKran(-64,176,38,-1.2);
  buildKirche(74,86,-0.5);
  buildSilhouetten();
  /* Leben */
  buildHochstrasse();
  stadtBaeume=buildFernbaeume();
  buildVoegel(); buildFernverkehr(); buildFlieger(); buildRauch();
}
/* --------------------------------------------------------
   Bewegung
   -------------------------------------------------------- */
const _vTmp=new THREE.Vector3();
let stadtT=0;
function updateStadt(dt){
  stadtT+=dt;
  const t=stadtT;
  const nacht=clamp((clock-960)/100,0,1);
  /* Vogelschwaerme ziehen ihre Kreise und schlagen mit den Fluegeln */
  for(const s of schwaerme){
    s.a+=s.sp*dt;
    s.g.position.set(s.mx+Math.cos(s.a)*s.r, s.my+Math.sin(s.a*2.3)*4, s.mz+Math.sin(s.a)*s.r);
    s.g.rotation.y=-s.a+Math.PI/2;
    for(const v of s.voegel){
      const f=Math.sin(t*v.sp+v.ph);
      v.m.rotation.z=f*0.55;
      v.m.position.y+=f*dt*0.35;
      if(v.m.position.y>4) v.m.position.y=4; if(v.m.position.y<-4) v.m.position.y=-4;
    }
    /* nachts sind weniger Voegel unterwegs */
    s.g.visible=nacht<0.75;
  }
  /* Verkehr: nachts sieht man nur die Lichter, tags gar nichts */
  if(verkehrPts){
    verkehrPts.material.opacity=nacht*0.95;
    if(nacht>0.02){
      const a=verkehrPts.geometry.attributes.position, arr=a.array;
      for(let i=0;i<verkehrDat.length;i++){
        const d=verkehrDat[i];
        d.t+=d.sp*dt*d.dir;
        if(d.t>1) d.t-=1; if(d.t<0) d.t+=1;
        if(d.oben){
          const z=-VIA.len/2+d.t*VIA.len;
          const i20=(z+VIA.len/2-10)/20;
          const dy=Math.sin(i20*0.35+d.bruecke)*0.9;
          arr[i*3]=VIA.x[d.bruecke]+d.spur+d.jit; arr[i*3+1]=VIA.y+dy+1.3; arr[i*3+2]=z;
        } else {
          /* die eigene Strasse: nur in der Ferne, sonst waere der
             Lichtpunkt direkt vor der Nase zu sehen */
          const x=-230+d.t*460;
          if(Math.abs(x)<52){ arr[i*3+1]=-999; }
          else { arr[i*3]=x; arr[i*3+1]=0.8; arr[i*3+2]=15.3+d.spur*0.6+d.jit; }
        }
      }
      a.needsUpdate=true;
    }
  }
  /* Blinklichter auf Turm und Kraenen */
  for(const b of beacons)
    b.m.emissiveIntensity=(((t*b.sp+b.ph)%2)<0.35)?2.6:0.12;
  /* Flugzeug */
  if(flieger){
    fliegerT-=dt;
    if(fliegerT<=0&&!flieger.visible){
      flieger.visible=true;
      const seite=Math.random()<0.5?1:-1;
      flieger.userData={x:-260*seite,z:rand(-120,180),y:rand(72,110),vx:seite*rand(13,20)};
      flieger.rotation.y=seite>0?Math.PI/2:-Math.PI/2;
    }
    if(flieger.visible){
      const u=flieger.userData;
      u.x+=u.vx*dt;
      flieger.position.set(u.x,u.y,u.z);
      if(Math.abs(u.x)>270){ flieger.visible=false; fliegerT=rand(45,130); }
      fliegerLicht.visible=((t*1.4)%1)<0.2;
    }
  }
  /* Rauchfahnen */
  if(rauchPts){
    const a=rauchPts.geometry.attributes.position, arr=a.array;
    for(let i=0;i<rauchDat.length;i++){
      const d=rauchDat[i];
      d.t+=d.sp*dt*0.28;
      if(d.t>1) d.t-=1;
      const h=d.t*26;
      arr[i*3]=d.q.x+Math.sin(d.t*4+i)*d.dr*(0.4+d.t*2.4);
      arr[i*3+1]=d.q.y+h;
      arr[i*3+2]=d.q.z+Math.cos(d.t*3+i)*d.dr*(0.3+d.t*1.8);
    }
    a.needsUpdate=true;
    rauchPts.material.opacity=0.10+0.09*(1-nacht);
  }
}
