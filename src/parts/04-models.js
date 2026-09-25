
/* =========================================================
   3D-Produktmodelle
   ========================================================= */
const vcMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.45});
const glassMat=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0.22,roughness:0.05,metalness:0.1,depthWrite:false});
const bottleGlass=new THREE.MeshStandardMaterial({color:LIN(0x1f4a35),transparent:true,opacity:0.82,roughness:0.15,metalness:0.15});
function wrapTex(circ,hh,a,draw){
  return tex(Math.max(32,Math.round(circ*1400)),Math.max(32,Math.round(hh*1400)),draw);
}
function buildProduct(t){
  const p=P[t], a=p.art, w=p.dims[0], h=p.dims[1], d=p.dims[2], parts=[], vc=[];
  const addAtlasBox=(bw,bh,bd,m,o)=>{ const A=atlas(bw,bh,bd,a,p.cat,o); parts.push({geo:merge([{geo:atlasBox(bw,bh,bd,A.R),m}]),mat:A.mat}); };
  const sh=p.shape;
  if(sh==='boxA'){ addAtlasBox(w,h,d,tm(0,h/2,0)); }
  else if(sh==='sparkler'){
    const ph=h*0.78; addAtlasBox(w,ph,d,tm(0,ph/2,0));
    for(let i=0;i<5;i++){ const x=-w*0.34+i*w*0.17; vc.push({geo:new THREE.CylinderGeometry(0.0045,0.0045,h*0.2,6),m:tm(x,ph+h*0.09,0),color:0x5b5e66}); }
  }
  else if(sh==='lighter'){
    addAtlasBox(w,h*0.78,d,tm(0,h*0.39,0));
    vc.push({geo:new THREE.BoxGeometry(w*0.8,h*0.16,d*0.8),m:tm(0,h*0.86,0),color:0xc8ccd4});
    vc.push({geo:new THREE.CylinderGeometry(w*0.2,w*0.2,h*0.1,8),m:tm(0,h*0.98,0,0,0,Math.PI/2),color:0x8a8f99});
  }
  else if(sh==='cylinder'){
    const R=w/2, HH=h*0.86, C=2*Math.PI*R;
    const wt=wrapTex(C,HH,a,(g,W,Hh)=>{
      const gr=g.createLinearGradient(0,0,0,Hh); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,Hh);
      for(let i=0;i<30;i++){ g.fillStyle=pick([a.ac,a.ac2,'#fff','#8cff8c']); g.save(); g.translate(Math.random()*W,Math.random()*Hh*0.5); g.rotate(Math.random()*3); g.fillRect(-5,-2,10,4); g.restore(); }
      for(let k=0;k<2;k++){ const cx=W*(0.25+k*0.5);
        g.textAlign='center'; g.textBaseline='middle'; fitFont(g,a.title,W*0.45,Math.round(Hh*0.16),BUN); g.lineWidth=5; g.strokeStyle='rgba(0,0,0,.5)'; g.strokeText(a.title,cx,Hh*0.56); g.fillStyle=a.ac; g.fillText(a.title,cx,Hh*0.56);
        fitFont(g,a.sub,W*0.4,Math.round(Hh*0.085),BAR); g.fillStyle='#fff'; g.fillText(a.sub,cx,Hh*0.72); }
      g.fillStyle=a.ac; g.fillRect(0,Hh*0.9,W,Hh*0.1); g.fillStyle=a.ac2; g.fillRect(0,0,W,Hh*0.05);
    });
    parts.push({geo:merge([{geo:new THREE.CylinderGeometry(R,R,HH,26,1,true),m:tm(0,HH/2,0)}]),mat:new THREE.MeshStandardMaterial({map:wt,roughness:0.5,side:THREE.DoubleSide})});
    vc.push({geo:new THREE.CylinderGeometry(R,R,0.004,26),m:tm(0,0.002,0),color:0x2a2a30});
    vc.push({geo:new THREE.CylinderGeometry(R*0.3,R*1.02,h*0.13,26),m:tm(0,HH+h*0.065,0),color:0xe8c35a});
    vc.push({geo:new THREE.CylinderGeometry(0.0022,0.0022,h*0.1,5),m:tm(0,HH+h*0.16,0),color:0x2e8b3a});
  }
  else if(sh==='fass'){
    /* Partyfass: Blechfass mit Etikett, Rand oben und unten, Zapfhahn vorn */
    const R=w/2, C=2*Math.PI*R*1.004, lh=h*0.5;
    vc.push({geo:new THREE.CylinderGeometry(R,R,h*0.94,26),m:tm(0,h*0.47,0),color:0xc3c9d2});
    for(const y of [0.02,0.92]) vc.push({geo:new THREE.CylinderGeometry(R*1.03,R*1.03,h*0.05,26),m:tm(0,h*y+h*0.025,0),color:0x9aa1ab});
    vc.push({geo:new THREE.CylinderGeometry(R*0.5,R*0.5,h*0.03,20),m:tm(0,h*0.955,0),color:0x6e757f});
    vc.push({geo:new THREE.BoxGeometry(w*0.12,h*0.05,w*0.12),m:tm(0,h*0.2,R*1.02),color:0x2a2e36});
    vc.push({geo:new THREE.CylinderGeometry(w*0.03,w*0.03,h*0.12,8),m:tm(0,h*0.14,R*1.1),color:0xd8322a});
    const lt=wrapTex(C,lh,a,(g,W,Hh)=>{
      const gr=g.createLinearGradient(0,0,0,Hh); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,Hh);
      g.fillStyle=a.ac2; g.fillRect(0,0,W,Hh*0.08); g.fillRect(0,Hh*0.92,W,Hh*0.08);
      for(let k=0;k<2;k++){ const cx=W*(0.25+k*0.5); g.textAlign='center'; g.textBaseline='middle';
        fitFont(g,a.title,W*0.42,Math.round(Hh*0.28),BUN); g.fillStyle=a.ac; g.fillText(a.title,cx,Hh*0.42);
        fitFont(g,a.sub,W*0.4,Math.round(Hh*0.15),BAR); g.fillStyle='#f2f5ff'; g.fillText(a.sub,cx,Hh*0.72); }
    });
    parts.push({geo:merge([{geo:new THREE.CylinderGeometry(R*1.004,R*1.004,lh,26,1,true),m:tm(0,h*0.47,0)}]),mat:new THREE.MeshStandardMaterial({map:lt,roughness:0.5,side:THREE.DoubleSide})});
  }
  else if(sh==='tubepack'){
    const r=Math.min(h,d)/6.3, L=w*0.86, reds=[0xd21f1b,0xc41a17,0xe0261f];
    for(let ly=0;ly<3;ly++) for(let iz=-1;iz<=1;iz++){
      const y=r+ly*r*2.02, z=iz*r*2.02;
      vc.push({geo:new THREE.CylinderGeometry(r,r,L,10),m:tm(0,y,z,0,0,Math.PI/2),color:reds[(ly+iz+3)%3]});
      vc.push({geo:new THREE.CylinderGeometry(r*0.95,r*0.95,0.004,10),m:tm(L/2+0.002,y,z,0,0,Math.PI/2),color:0xd9cbb0});
      vc.push({geo:new THREE.CylinderGeometry(0.0016,0.0016,0.022,4),m:tm(L/2+0.013,y,z,0,0,Math.PI/2),color:0x2e8b3a});
    }
    const bh=r*6.1+0.004; addAtlasBox(w*0.38,bh,bh,tm(-w*0.07,bh/2-0.002,0),{side:(g,W,Hh)=>{g.fillStyle=a.bg1;g.fillRect(0,0,W,Hh);g.fillStyle=a.ac;g.fillRect(0,Hh*0.4,W,Hh*0.2);},top:(g,W,Hh)=>{g.fillStyle=a.bg1;g.fillRect(0,0,W,Hh);g.fillStyle=a.ac;g.fillRect(0,Hh*0.4,W,Hh*0.2);}});
  }
  else if(sh==='atombombe'){
    /* Atombomben-Boeller (Tom, 25.09.: "vom Produktdesign passt das
       nicht"): eine dicke gelbe Bombe mit schwarzem Kastenleitwerk und
       Warnband, stehend auf einem Sockel unter einer Acrylhaube - ein
       einzelnes Sammlerstueck statt eines Boellerbuendels. */
    const ph=h*0.16, R=w*0.33, by=ph+h*0.2+R*1.25;
    addAtlasBox(w,ph,d,tm(0,ph/2,0));
    vc.push({geo:new THREE.BoxGeometry(w*1.02,h*0.015,d*1.02),m:tm(0,ph+h*0.0075,0),color:0x1b1b1b});
    /* Leitwerk: Rohr, vier Flossen und der Kastenring der Fat Man */
    vc.push({geo:new THREE.CylinderGeometry(R*0.42,R*0.28,h*0.2,16),m:tm(0,ph+h*0.1+0.004,0),color:0x1b1b1b});
    for(let i=0;i<4;i++){ const a=i*Math.PI/2+Math.PI/4;
      vc.push({geo:new THREE.BoxGeometry(R*0.9,h*0.17,0.004),m:tm(Math.cos(a)*R*0.5,ph+h*0.1+0.004,Math.sin(a)*R*0.5,0,-a,0),color:0x1b1b1b}); }
    for(const [sx,sz,rw,rd] of [[0,1,1,0],[0,-1,1,0],[1,0,0,1],[-1,0,0,1]])
      vc.push({geo:new THREE.BoxGeometry(rw?R*1.9:0.005,h*0.07,rd?R*1.9:0.005),m:tm(sx*R*0.95,ph+h*0.05+0.004,sz*R*0.95),color:0x2a2a2a});
    /* Bombenkoerper: gestrecktes Ei, gelb */
    vc.push({geo:new THREE.SphereGeometry(R,26,18),m:tm(0,by,0,0,0,0,1,1.25,1),color:0xf2d21b});
    /* Nasenkappe und Zuendschnur */
    vc.push({geo:new THREE.SphereGeometry(R*0.32,14,10),m:tm(0,by+R*1.2,0,0,0,0,1,0.6,1),color:0x1b1b1b});
    vc.push({geo:new THREE.CylinderGeometry(0.0025,0.0025,h*0.08,5),m:tm(0,by+R*1.25+h*0.04,0),color:0x2e8b3a});
    /* Warnband mit Strahlenzeichen rund um den Bauch */
    const bH=R*0.9, C=2*Math.PI*R*1.02;
    const bt=wrapTex(C,bH,a,(g,W,Hh)=>{
      g.fillStyle='#f2d21b'; g.fillRect(0,0,W,Hh);
      g.fillStyle='#1b1b1b'; g.fillRect(0,0,W,Hh*0.1); g.fillRect(0,Hh*0.9,W,Hh*0.1);
      for(let k=0;k<3;k++){ const cx=W*(k+0.5)/3, cy=Hh/2, r1=Hh*0.34, r0=Hh*0.09;
        if(k===1){ g.textAlign='center'; g.textBaseline='middle'; fitFont(g,'ATOM',W*0.26,Math.round(Hh*0.42),BUN); g.fillText('ATOM',cx,cy+Hh*0.03); continue; }
        for(let j=0;j<3;j++){ const a0=-Math.PI/2+j*2*Math.PI/3-Math.PI/6;
          g.beginPath(); g.arc(cx,cy,r1,a0,a0+Math.PI/3); g.arc(cx,cy,r0*1.5,a0+Math.PI/3,a0,true); g.closePath(); g.fill(); }
        g.beginPath(); g.arc(cx,cy,r0,0,Math.PI*2); g.fill(); }
    });
    parts.push({geo:merge([{geo:new THREE.CylinderGeometry(R*1.02,R*1.02,bH,26,1,true),m:tm(0,by,0)}]),mat:new THREE.MeshStandardMaterial({map:bt,roughness:0.45,side:THREE.DoubleSide})});
    /* Acrylhaube */
    parts.push({geo:merge([{geo:new THREE.BoxGeometry(w*0.96,h-ph-0.004,d*0.96),m:tm(0,ph+(h-ph)/2,0)}]),mat:glassMat});
  }
  else if(sh==='bottle'){
    const R=w/2, body=h*0.56, sho=h*0.18, neck=h*0.18;
    vc.push({geo:new THREE.CylinderGeometry(R,R*0.96,body,20),m:tm(0,body/2,0),color:0x1f4a35});
    vc.push({geo:new THREE.CylinderGeometry(R*0.38,R,sho,20),m:tm(0,body+sho/2,0),color:0x1f4a35});
    vc.push({geo:new THREE.CylinderGeometry(R*0.34,R*0.38,neck,16),m:tm(0,body+sho+neck/2,0),color:0x1f4a35});
    vc.push({geo:new THREE.CylinderGeometry(R*0.42,R*0.42,h*0.13,16),m:tm(0,body+sho+neck*0.72,0),color:parseInt(a.ac.slice(1),16)});
    vc.push({geo:new THREE.SphereGeometry(R*0.42,14,8),m:tm(0,h*0.97,0,0,0,0,1,0.55,1),color:parseInt(a.ac.slice(1),16)});
    const C=2*Math.PI*R*1.005, lh=body*0.62;
    const lt=wrapTex(C,lh,a,(g,W,Hh)=>{
      const gr=g.createLinearGradient(0,0,0,Hh); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,Hh);
      g.fillStyle=a.ac; g.fillRect(0,0,W,Hh*0.07); g.fillRect(0,Hh*0.93,W,Hh*0.07);
      for(let k=0;k<2;k++){ const cx=W*(0.25+k*0.5); g.textAlign='center'; g.textBaseline='middle';
        fitFont(g,a.title,W*0.44,Math.round(Hh*0.2),BUN); g.fillStyle=a.ac; g.fillText(a.title,cx,Hh*0.42);
        fitFont(g,a.sub,W*0.4,Math.round(Hh*0.12),BAR); g.fillStyle='#f2f5ff'; g.fillText(a.sub,cx,Hh*0.66); }
    });
    parts.push({geo:merge([{geo:new THREE.CylinderGeometry(R*1.005,R*1.005,lh,20,1,true),m:tm(0,body*0.45,0)}]),mat:new THREE.MeshStandardMaterial({map:lt,roughness:0.6,side:THREE.DoubleSide})});
  }
  else if(sh==='rocketset'){
    /* stueck: Einzelraketen (Jumbo) - eine dicke statt vieler duenner */
    const th=h*0.36, n=p.stueck||clamp(Math.round(d/0.026),3,9), cols=[0xd8352a,0x2f7fd0,0xffc93a,0x2f9e57,0x9b3bd6,0xf2f5ff,0xff7a3d,0x39c4d8,0xe35aa8];
    addAtlasBox(w,th,d,tm(0,th/2,0));
    const step=d*0.86/n, rr=p.stueck?Math.min(h*0.26,step*0.4):Math.min(0.0115,step*0.44);
    for(let i=0;i<n;i++){ const z=-d*0.43+step*(i+0.5), y=th+rr, c=cols[i%cols.length];
      vc.push({geo:new THREE.CylinderGeometry(rr,rr,w*0.27,10),m:tm(w*0.19,y,z,0,0,Math.PI/2),color:c});
      vc.push({geo:new THREE.ConeGeometry(rr,w*0.07,10),m:tm(w*0.19+w*0.17,y,z,0,0,-Math.PI/2),color:c});
      vc.push({geo:new THREE.CylinderGeometry(rr*1.02,rr*1.02,0.012,10),m:tm(w*0.07,y,z,0,0,Math.PI/2),color:0xf2f2f2});
      vc.push({geo:new THREE.CylinderGeometry(0.0025,0.0025,w*0.5,4),m:tm(-w*0.19,th+0.004,z+0.005,0,0,Math.PI/2),color:0xc9a46a}); }
    parts.push({geo:merge([{geo:new THREE.BoxGeometry(w,h*0.55,d),m:tm(0,th+h*0.275,0)}]),mat:glassMat});
    const A=atlas(w*0.33,0.002,d*0.5,a,p.cat,{top:(g,W,Hh)=>drawFront(g,W,Hh,a,p.cat)});
    parts.push({geo:merge([{geo:atlasBox(w*0.33,0.002,d*0.5,A.R),m:tm(-w*0.29,th+h*0.56,0)}]),mat:A.mat});
  }
  else if(sh==='fountainset'){
    const th=h*0.17; addAtlasBox(w,th,d,tm(0,th/2,0));
    const cols=[0xd8352a,0xffc93a,0x2f7fd0];
    for(let i=0;i<3;i++){ const x=-w*0.3+i*w*0.3;
      vc.push({geo:new THREE.CylinderGeometry(w*0.04,w*0.13,h*0.72,16),m:tm(x,th+h*0.36,0),color:cols[i]});
      vc.push({geo:new THREE.CylinderGeometry(w*0.042,w*0.055,h*0.1,16),m:tm(x,th+h*0.5,0),color:0xf4f0e6});
      vc.push({geo:new THREE.CylinderGeometry(0.004,0.009,h*0.08,10),m:tm(x,th+h*0.78,0),color:0x3b3b3b}); }
  }
  else if(sh==='battery'){
    const n=w>0.75?16:w>0.5?12:w>0.35?10:w>0.25?7:4;
    addAtlasBox(w,h,d,tm(0,h/2,0),{top:(g,W,Hh)=>{ g.fillStyle=a.gold?'#231a08':'#2a1a12'; g.fillRect(0,0,W,Hh); const cw=W/n, ch=Hh/n;
      for(let i=0;i<n;i++) for(let j=0;j<n;j++){ g.fillStyle=a.gold?'#e8c35a':'#d9c7a0'; g.beginPath(); g.arc(cw*(i+0.5),ch*(j+0.5),Math.min(cw,ch)*0.42,0,Math.PI*2); g.fill(); g.fillStyle='#1a120c'; g.beginPath(); g.arc(cw*(i+0.5),ch*(j+0.5),Math.min(cw,ch)*0.3,0,Math.PI*2); g.fill(); } }});
    /* Sockelkragen, Deckelrand, Eckband und Zündschnur mit Kappe */
    vc.push({geo:new THREE.BoxGeometry(w*1.03,h*0.11,d*1.03),m:tm(0,h*0.055,0),color:0x8a7047});
    vc.push({geo:new THREE.BoxGeometry(w*1.02,h*0.05,d*1.02),m:tm(0,h*0.975,0),color:0xb09364});
    for(const sx of [-1,1]) for(const sz of [-1,1])
      vc.push({geo:new THREE.BoxGeometry(w*0.035,h*0.86,d*0.035),m:tm(sx*w*0.495,h*0.5,sz*d*0.495),color:0xc9b088});
    vc.push({geo:new THREE.CylinderGeometry(0.0035,0.0035,0.075,6),m:tm(w*0.36,h*0.2,d/2+0.03,Math.PI/2.4),color:0x2e8b3a});
    vc.push({geo:new THREE.CylinderGeometry(0.008,0.008,0.014,8),m:tm(w*0.36,h*0.2,d/2+0.008),color:0xd8352a});
    /* Warnetikett an der Seite - vorn verdeckte es den Namen */
    vc.push({geo:new THREE.BoxGeometry(0.004,h*0.1,d*0.34),m:tm(w/2+0.003,h*0.3,0),color:0xf2f0e6});
  }
  else if(sh==='candle'){
    /* Römische Lichter: fünf Rohre im Bündel, unten eine Banderole */
    const R=w*0.185, HH=h*0.9, cols=[0xd8352a,0x2f7fd0,0xffc93a,0x2f9e57,0x9b3bd6];
    const spots=[[0,0],[0.052,0.02],[-0.052,0.02],[0.028,-0.05],[-0.028,-0.05]];
    spots.forEach((sp,i)=>{
      const x=sp[0]*(w/0.1), z=sp[1]*(d/0.1), c=cols[i%cols.length];
      vc.push({geo:new THREE.CylinderGeometry(R,R,HH,12),m:tm(x,HH/2,z),color:c});
      vc.push({geo:new THREE.CylinderGeometry(R*1.01,R*1.01,h*0.05,12),m:tm(x,HH*0.97,z),color:0xd9cbb0});
      vc.push({geo:new THREE.CylinderGeometry(R*0.55,R*0.75,h*0.045,12),m:tm(x,HH+h*0.02,z),color:0x8a6a46});
      vc.push({geo:new THREE.CylinderGeometry(0.0022,0.0022,h*0.1,5),m:tm(x,HH+h*0.07,z),color:0x2e8b3a});
      vc.push({geo:new THREE.TorusGeometry(R*1.02,R*0.07,6,12),m:tm(x,HH*0.22,z,Math.PI/2),color:0x2a2a30});
    });
    const bandH=h*0.3, C=2*Math.PI*w*0.5;
    const bt=wrapTex(C,bandH,a,(g,W,Hh)=>{
      const gr=g.createLinearGradient(0,0,0,Hh); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,Hh);
      g.fillStyle=a.ac; g.fillRect(0,0,W,Hh*0.08); g.fillRect(0,Hh*0.92,W,Hh*0.08);
      for(let k=0;k<2;k++){ const cx=W*(0.25+k*0.5); g.textAlign='center'; g.textBaseline='middle';
        fitFont(g,a.title,W*0.44,Math.round(Hh*0.3),BUN); g.fillStyle=a.ac; g.fillText(a.title,cx,Hh*0.4);
        fitFont(g,a.sub,W*0.42,Math.round(Hh*0.17),BAR); g.fillStyle='#f2f5ff'; g.fillText(a.sub,cx,Hh*0.68); }
    });
    parts.push({geo:merge([{geo:new THREE.CylinderGeometry(w*0.5,w*0.5,bandH,22,1,true),m:tm(0,bandH*0.62,0)}]),mat:new THREE.MeshStandardMaterial({map:bt,roughness:0.6,side:THREE.DoubleSide})});
  }
  else if(sh==='fan'){
    /* Fächerbatterie: flacher Block, oben gefächerte Rohrmündungen */
    const bh=h*0.72; addAtlasBox(w,bh,d,tm(0,bh/2,0));
    const n=9, tr=Math.min(0.019,w/(n*2.6));
    for(let i=0;i<n;i++){ const f=i/(n-1)-0.5, x=f*w*0.8, tilt=f*0.62;
      vc.push({geo:new THREE.CylinderGeometry(tr,tr,h*0.4,10),m:tm(x-Math.sin(tilt)*h*0.1,bh+h*0.16,0,0,0,-tilt),color:0x2f3038});
      vc.push({geo:new THREE.CylinderGeometry(tr*1.05,tr*1.05,h*0.03,10),m:tm(x-Math.sin(tilt)*h*0.2,bh+h*0.33,0,0,0,-tilt),color:0xd9cbb0}); }
    vc.push({geo:new THREE.BoxGeometry(w*1.01,h*0.07,d*1.01),m:tm(0,bh-h*0.03,0),color:0xb0a189});
    vc.push({geo:new THREE.CylinderGeometry(0.003,0.003,0.06,5),m:tm(w*0.4,bh*0.5,d/2+0.02,Math.PI/2),color:0x2e8b3a});
  }
  else if(sh==='assort'){
    /* Sortimentskiste mit Sichtfenster und buntem Inhalt */
    const bh=h*0.78; addAtlasBox(w,bh,d,tm(0,bh/2,0));
    vc.push({geo:new THREE.BoxGeometry(w*1.02,h*0.12,d*1.02),m:tm(0,bh+h*0.02,0),color:parseInt(a.ac.slice(1),16)});
    const cols=[0xd8352a,0x2f7fd0,0xffc93a,0x2f9e57,0x9b3bd6,0xff7a3d,0x39c4d8];
    for(let i=0;i<7;i++){ const x=-w*0.36+i*w*0.12;
      vc.push({geo:new THREE.CylinderGeometry(w*0.035,w*0.035,h*0.5,10),m:tm(x,bh*0.62,-d*0.22),color:cols[i%cols.length]}); }
    for(let i=0;i<5;i++){ const x=-w*0.32+i*w*0.16;
      vc.push({geo:new THREE.BoxGeometry(w*0.11,h*0.3,d*0.22),m:tm(x,bh*0.55,d*0.2),color:cols[(i+3)%cols.length]}); }
    for(let i=0;i<4;i++){ const x=-w*0.26+i*w*0.18;
      vc.push({geo:new THREE.CylinderGeometry(0.008,0.008,w*0.3,8),m:tm(x,bh*0.86,d*0.02,0,0,Math.PI/2),color:cols[(i+1)%cols.length]}); }
    parts.push({geo:merge([{geo:new THREE.BoxGeometry(w*0.86,h*0.02,d*0.7),m:tm(0,bh*0.99,0)}]),mat:glassMat});
    vc.push({geo:new THREE.TorusGeometry(w*0.07,w*0.012,6,14,Math.PI),m:tm(0,bh+h*0.08,0,0,Math.PI/2),color:0x2a2a30});
  }
  else if(sh==='shell'){
    /* Kugelbombe: Papierkugel mit Klebeband, Zeitzuender oben,
       darunter der Treibsatz im Beutel. Steht im Regal auf dem Beutel. */
    const R=w*0.5, kugelY=h*0.44+R*0.06;
    const C=2*Math.PI*R;
    const wt=wrapTex(C,C/2,a,(g,W,Hh)=>{
      const gr=g.createLinearGradient(0,0,0,Hh); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.bg2);
      g.fillStyle=gr; g.fillRect(0,0,W,Hh);
      /* Papierbahnen und Klebeband ueber Kreuz */
      for(let i=0;i<7;i++){ g.fillStyle='rgba(255,255,255,.05)'; g.fillRect(i*W/7,0,W/14,Hh); }
      g.fillStyle='rgba(226,214,186,.85)'; g.fillRect(0,Hh*0.44,W,Hh*0.12);
      g.strokeStyle='rgba(120,104,72,.5)'; g.lineWidth=2;
      g.beginPath(); g.moveTo(0,Hh*0.44); g.lineTo(W,Hh*0.44); g.moveTo(0,Hh*0.56); g.lineTo(W,Hh*0.56); g.stroke();
      for(let k=0;k<2;k++){ const cx=W*(0.25+k*0.5);
        g.textAlign='center'; g.textBaseline='middle';
        fitFont(g,a.title,W*0.42,Math.round(Hh*0.17),BUN);
        g.lineWidth=5; g.strokeStyle='rgba(0,0,0,.55)'; g.strokeText(a.title,cx,Hh*0.24);
        g.fillStyle=a.ac; g.fillText(a.title,cx,Hh*0.24);
        fitFont(g,a.sub,W*0.44,Math.round(Hh*0.085),BAR); g.fillStyle='#f2f5ff'; g.fillText(a.sub,cx,Hh*0.74); }
      /* Kaliberstempel */
      g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(W*0.02,Hh*0.86,W*0.2,Hh*0.1);
      g.fillStyle=a.ac2; g.font=BAR(Math.round(Hh*0.08)); g.textAlign='left';
      g.fillText('F2 · 1.3G',W*0.03,Hh*0.915);
    });
    parts.push({geo:merge([{geo:new THREE.SphereGeometry(R,20,14),m:tm(0,kugelY,0)}]),
                mat:new THREE.MeshStandardMaterial({map:wt,roughness:0.78})});
    /* Treibsatzbeutel darunter */
    vc.push({geo:new THREE.CylinderGeometry(R*0.68,R*0.8,h*0.2,14),m:tm(0,h*0.1,0),color:0x2a2e38});
    vc.push({geo:new THREE.TorusGeometry(R*0.7,R*0.06,6,14),m:tm(0,h*0.2,0,Math.PI/2),color:0x14161b});
    /* Zeitzuender und Anzuendlitze */
    vc.push({geo:new THREE.CylinderGeometry(R*0.16,R*0.2,h*0.1,10),m:tm(0,kugelY+R*0.96,0),color:0xd9cbb0});
    vc.push({geo:new THREE.CylinderGeometry(0.0028,0.0028,h*0.16,5),m:tm(R*0.1,kugelY+R*1.12,0,0,0,0.35),color:0x2e8b3a});
    /* Klebebandkreuz als Relief */
    vc.push({geo:new THREE.TorusGeometry(R*1.005,R*0.045,6,22),m:tm(0,kugelY,0,Math.PI/2),color:0xe2d6ba});
    vc.push({geo:new THREE.TorusGeometry(R*1.005,R*0.045,6,22),m:tm(0,kugelY,0,0,0,Math.PI/2),color:0xe2d6ba});
  }
  if(vc.length) parts.push({geo:merge(vc),mat:vcMat});
  return parts;
}
