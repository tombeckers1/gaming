/* Streuscheibe der Deckenleuchten, auch vom Ausbau genutzt */
let _deckenT=null;
function deckenDiffuse(){ if(_deckenT) return _deckenT; _deckenT=tex(512,256,(g,W,Hh)=>{
    g.fillStyle='#fffaf0'; g.fillRect(0,0,W,Hh);
    const gr=g.createLinearGradient(0,0,0,Hh);
    gr.addColorStop(0,'rgba(196,206,222,.95)'); gr.addColorStop(0.2,'rgba(255,252,246,0)');
    gr.addColorStop(0.8,'rgba(255,252,246,0)'); gr.addColorStop(1,'rgba(196,206,222,.95)');
    g.fillStyle=gr; g.fillRect(0,0,W,Hh);
    const gx=g.createLinearGradient(0,0,W,0);
    gx.addColorStop(0,'rgba(190,200,218,.95)'); gx.addColorStop(0.06,'rgba(255,252,246,0)');
    gx.addColorStop(0.94,'rgba(255,252,246,0)'); gx.addColorStop(1,'rgba(190,200,218,.95)');
    g.fillStyle=gx; g.fillRect(0,0,W,Hh);
    /* feine Struktur der Streuscheibe */
    for(let i=0;i<9000;i++){ g.fillStyle=`rgba(255,255,255,${Math.random()*0.05})`; g.fillRect(Math.random()*W,Math.random()*Hh,2,2); }
    for(let x=0;x<W;x+=7){ g.fillStyle='rgba(228,232,240,.22)'; g.fillRect(x,0,3,Hh); }
  }); return _deckenT; }
function buildWorld(){
  const w0=WALLS[0], f0=FLOORS[0];
  wallTex=tex(256,512,(g,W,H)=>paintWall(g,W,H,w0)); wallTex.wrapS=THREE.RepeatWrapping; wallTex.wrapT=THREE.ClampToEdgeWrapping; wallTex.repeat.set(1/2.6,1/WH);
  shopWall=new THREE.MeshStandardMaterial({map:wallTex,roughness:0.92});
  shopUpper=std(parseInt(w0.up.slice(1),16),{roughness:0.92});
  shopLower=std(parseInt(w0.low.slice(1),16),{roughness:0.9});
  // Boden draußen
  const asph=tex(256,256,(g,W,H)=>{
    g.fillStyle='#3a3d45'; g.fillRect(0,0,W,H);
    for(let i=0;i<3400;i++){ const v=Math.random(); g.fillStyle=`rgba(${v<0.5?0:255},${v<0.5?0:255},${v<0.5?0:255},${Math.random()*0.07})`; g.fillRect(Math.random()*W,Math.random()*H,2,2);}
    for(let i=0;i<7;i++){ g.fillStyle=`rgba(20,22,26,${rand(0.05,0.14)})`; g.beginPath(); g.ellipse(Math.random()*W,Math.random()*H,rand(18,60),rand(14,46),Math.random()*3,0,Math.PI*2); g.fill(); }
    g.strokeStyle='rgba(18,20,24,.45)'; g.lineWidth=1.5;
    for(let i=0;i<9;i++){ let x=Math.random()*W, y=Math.random()*H; g.beginPath(); g.moveTo(x,y); for(let k=0;k<6;k++){ x+=rand(-26,26); y+=rand(-26,26); g.lineTo(x,y);} g.stroke(); }
  }); asph.wrapS=asph.wrapT=THREE.RepeatWrapping; asph.repeat.set(40,40);
  flat(200,200,new THREE.MeshStandardMaterial({map:asph,roughness:0.95}),0,0,0);
  /* Darunter eine grosse Flaeche bis zum Horizont. Sie traegt eine
     grobe Struktur, damit sie in den Luecken zwischen den Haeusern
     nicht als gleichmaessige graue Scheibe auffaellt. */
  const fern=tex(512,512,(g,W,H)=>{
    g.fillStyle='#727a86'; g.fillRect(0,0,W,H);
    /* Quartiere und Strassenzuege, sehr flau */
    for(let i=0;i<70;i++){
      const x=Math.random()*W, y=Math.random()*H, w=rand(24,90), h=rand(24,90);
      g.fillStyle=`rgba(${88+Math.random()*34|0},${92+Math.random()*32|0},${100+Math.random()*30|0},.5)`;
      g.fillRect(x,y,w,h);
    }
    for(let i=0;i<9;i++){ g.fillStyle='rgba(60,64,72,.35)';
      if(Math.random()<0.5) g.fillRect(0,Math.random()*H,W,rand(3,8));
      else g.fillRect(Math.random()*W,0,rand(3,8),H); }
    for(let i=0;i<5;i++){ g.fillStyle='rgba(72,88,70,.4)';
      g.beginPath(); g.ellipse(Math.random()*W,Math.random()*H,rand(30,80),rand(24,60),Math.random()*3,0,Math.PI*2); g.fill(); }
    for(let i=0;i<4000;i++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.05})`; g.fillRect(Math.random()*W,Math.random()*H,3,3); }
  });
  fern.wrapS=fern.wrapT=THREE.RepeatWrapping; fern.repeat.set(7,7);
  flat(1400,1400,new THREE.MeshStandardMaterial({map:fern,roughness:1}),0,-0.02,0);
  const sw=concreteTex(); sw.repeat.set(24,3); flat(48,5,new THREE.MeshStandardMaterial({map:sw,roughness:0.9}),-2,0.012,8.5);
  bbox(48,0.14,0.2,std(0x9a9ea6),-2,0.07,11,null,false);
  for(let i=-8;i<=8;i++) flat(2,0.15,std(0xe8e2c8),i*4,0.013,15.5);
  // Innenböden
  floorTexRef=tex(HIQ?640:256,HIQ?640:256,(g,W,H)=>paintFloor(g,W,H,f0)); floorTexRef.wrapS=floorTexRef.wrapT=THREE.RepeatWrapping; floorTexRef.repeat.set(1,1); floorTexRef.anisotropy=8;
  floorMat=new THREE.MeshStandardMaterial({map:floorTexRef,roughness:0.5});
  bodenUV(flat(16,12,floorMat,0,0.015,0),2);
  /* Ein Boden fuer das ganze Basislager, in einem Stueck und in
     einem Massstab. Vorher lagen hier zwei Platten mit
     unterschiedlicher Kachelgroesse uebereinander - an ihrer Kante
     sprang die Helligkeit, das sah aus wie ein Riss im Boden. */
  { const L=LAY.lbasis, N=LAY.lnord;
    const lc=concreteTex(); lc.repeat.set((L.x1-L.x0)/2,(N.z1-L.z0)/2);
    flat(L.x1-L.x0,N.z1-L.z0,new THREE.MeshStandardMaterial({map:lc,roughness:0.85}),
      (L.x0+L.x1)/2,0.015,(L.z0+N.z1)/2); }
  /* Testfeldbelag ueber die ganze Flaeche, nicht nur um die Stationen */
  { const T=LAY.test, tg=yardGroundTex(); tg.repeat.set((T.x1-T.x0)/10*2.2,(T.z1-T.z0)/9*2);
    flat(T.x1-T.x0,T.z1-T.z0,new THREE.MeshStandardMaterial({map:tg,roughness:0.92}),
      (T.x0+T.x1)/2,0.013,(T.z0+T.z1)/2); }
  // Warenannahme
  const zone=new THREE.Mesh(new THREE.PlaneGeometry(4.3,2.3),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,map:tex(430,230,(g,W,H)=>{ g.clearRect(0,0,W,H); g.strokeStyle='#ffd23f'; g.lineWidth=10; g.setLineDash([26,14]); g.strokeRect(8,8,W-16,H-16); g.setLineDash([]); g.fillStyle='rgba(255,210,63,.95)'; g.font=BAR(30); g.fillText('Wareneingang',24,H-26); })}));
  zone.rotation.set(-Math.PI/2,0,-Math.PI/2); zone.position.set(-15.3,0.022,-2); zone.renderOrder=2; scene.add(zone);
  // Laden: Frontwand mit Schaufenstern
  const H=WH;
  wall(-8,-7.2,5.9,6.1,0,H,'-z',shopWall); wall(-2,-1.2,5.9,6.1,0,H,'-z',shopWall);
  wall(-7.2,-2,5.9,6.1,0,0.9,'-z',shopWall); wall(-7.2,-2,5.9,6.1,2.4,H,'-z',shopWall);
  wall(1.2,2,5.9,6.1,0,H,'-z',shopWall); wall(7.2,8,5.9,6.1,0,H,'-z',shopWall);
  wall(2,7.2,5.9,6.1,0,0.9,'-z',shopWall); wall(2,7.2,5.9,6.1,2.4,H,'-z',shopWall);
  wall(-1.2,1.2,5.9,6.1,2.5,H,'-z',shopWall);
  const glass=new THREE.MeshStandardMaterial({color:LIN(0xbfe0ff),transparent:true,opacity:0.16,roughness:0.05,metalness:0.2,depthWrite:false});
  const frame=std(0x2b3040,{metalness:0.5,roughness:0.4});
  for(const [a,b] of [[-7.2,-2],[2,7.2]]){ const gp=bbox(b-a,1.5,0.03,glass,(a+b)/2,1.65,6.0,null,false); occluders.push(gp);
    bbox(b-a,0.06,0.12,frame,(a+b)/2,0.93,6.0); bbox(b-a,0.06,0.12,frame,(a+b)/2,2.38,6.0); bbox(0.06,1.5,0.1,frame,(a+b)/2,1.65,6.0);
  }
  buildWindowGrime();
  bbox(0.08,2.5,0.14,frame,-1.2,1.25,6.0); bbox(0.08,2.5,0.14,frame,1.2,1.25,6.0); bbox(2.4,0.08,0.14,frame,0,2.5,6.0);
  // Rückwand, rechte Wand
  /* Rueckwand des Basisladens. Ihre Aussenseite traegt die
     Fassade wie jede andere Aussenwand - vom Testfeld aus sah man
     dort die Lagerwand mit dem gelben Streifen, obwohl das die
     Rueckseite des Ladens ist. Der Lagergang kommt spaeter als
     Anbau davor; dass er an einer Fassade endet, ist richtig so. */
  const fas=wallBrickMat();
  wall(-8,4.4,-6.1,-5.9,0,H,'+z',shopWall,fas);
  wall(6.1,8,-6.1,-5.9,0,H,'+z',shopWall,fas);
  wall(4.4,6.1,-6.1,-5.9,2.5,H,'+z',shopWall,fas);
  /* Ostwand: spaeter wird hier ein grosser Durchbruch zur Nachbarflaeche
     geschlagen. Pfeiler und Sturz bleiben stehen, die Fuellung faellt. */
  /* Beim Kauf faellt die Ostwand komplett - Pfeiler und Sturz
     eingeschlossen. Sonst steht mitten im vergroesserten Laden
     weiter ein Wandstueck mit einem Balken darueber. */
  zWand('shop_gross',wall(7.9,8.1,-6.1,-4.4,0,H,'-x',shopWall));
  zWand('shop_gross',wall(7.9,8.1,4.4,6.1,0,H,'-x',shopWall));
  zWand('shop_gross',wall(7.9,8.1,-4.4,4.4,2.7,H,'-x',shopWall));
  /* Die Wand zwischen Verkauf und Lager reicht bis zur Lagerdecke -
     im Verkauf steht sie oberhalb der Decke und ist dort nicht zu
     sehen, im Lager schliesst sie sauber ab. */
  wall(-8.1,-7.9,-6.1,-3.2,0,LAGER_H,'+x',shopWall,lagerWall); wall(-8.1,-7.9,-1.8,2,0,LAGER_H,'+x',shopWall,lagerWall); wall(-8.1,-7.9,2,6.1,0,LAGER_H,'+x',shopWall,lagerWall);
  wall(-8.1,-7.9,-3.2,-1.8,2.5,LAGER_H,'+x',shopWall,lagerWall);
  // Lager. Es ist hoeher als der Verkauf: LAGER_H statt H.
  wall(-20.1,-19.9,-6.1,-3.6,0,LAGER_H,'+x',lagerWall); wall(-20.1,-19.9,-0.4,5.9,0,LAGER_H,'+x',lagerWall); wall(-20.1,-19.9,-3.6,-0.4,3.0,LAGER_H,'+x',lagerWall);
  /* Die Suedwand des Lagers baut jetzt die Durchbruchwand in 05h:
     dort sitzt die Oeffnung zur Halle Sued.
     Zum Anbau nach Norden steht gar keine Wand mehr: beide Teile
     sind gleich hoch und bilden einen Raum. Frueher war der Anbau
     eine zugemauerte Ausbaustufe mit niedrigerer Decke, und
     dazwischen blieb ein Sturz quer im Lager stehen. */
  const base=std(0x1a2038);
  /* Sockelleisten enden an den Tueroeffnungen, statt durchzulaufen */
  for(const [a,b] of [[-7.9,4.4],[6.1,7.9]]) bbox(b-a,0.1,0.02,base,(a+b)/2,0.05,-5.89,null,false);
  for(const [a,b] of [[-7.9,-1.2],[1.2,7.9]]) bbox(b-a,0.1,0.02,base,(a+b)/2,0.05,5.89,null,false);
  for(const [a,b] of [[-5.9,-4.4],[4.4,5.9]])
    for(const sx of [7.89,8.11]) zWand('shop_gross',bbox(0.02,0.1,b-a,base,sx,0.05,(a+b)/2,null,false));
  for(const [a,b] of [[-5.9,-3.2],[-1.8,5.9]]) bbox(0.02,0.1,b-a,base,-7.89,0.05,(a+b)/2,null,false);
  // Dächer & Decken
  /* Der Dachrand des Ladens darf nach Westen nicht ueber die Wand
     hinausragen: dahinter steht das hoehere Lager, und der
     Ueberstand stand dort als dunkler Balken quer in der Wand. */
  bbox(16.2,0.25,12.4,std(0x2b2f3a),0.1,H+0.13,0);
  /* Ein Dach ueber das ganze Lager, Rampenraum und Anbau zusammen */
  bbox(12.4,0.25,12.4,std(0x2b2f3a),-14,LAGER_H+0.13,-0.1);
  const ceil=std(0xe6e8ee,{roughness:1});
  /* Beide Decken reichen ueber die Innenseiten aller Waende hinaus und
     stossen in der Trennwand aneinander - kein Spalt, keine Ueberlappung. */
  const c1=new THREE.Mesh(new THREE.PlaneGeometry(16.1,12.3),ceil); c1.rotation.x=Math.PI/2; c1.position.set(0.1,H-0.01,0); scene.add(c1);
  const c2=new THREE.Mesh(new THREE.PlaneGeometry(12.15,12.3),ceil); c2.rotation.x=Math.PI/2; c2.position.set(-14.025,LAGER_H-0.01,-0.05); scene.add(c2);
  /* Flächenbündige Leuchten: schmaler Rahmen, gleichmäßig leuchtende Scheibe */
  const diffT=deckenDiffuse();
;
  /* Die Scheibe leuchtet gleichmäßig und spiegelt nichts.
     Das Gehäuse ist mattes Aluminium ohne Metallanteil, damit beim
     Durchlaufen kein wanderndes Glanzlicht entsteht. */
  const panelM=new THREE.MeshBasicMaterial({map:diffT,toneMapped:false});
  const fixM=std(0xdfe3e9,{metalness:0,roughness:0.62});
  const rev=std(0x252932,{metalness:0,roughness:0.9});
  const leuchten=[];
  for(const x of [-5.7,-1.9,1.9,5.7]) for(const z of [-3.6,0,3.6]) leuchten.push([x,WH,z]);
  /* Die Lagerleuchten haengen an der Lagerdecke, nicht an der des
     Verkaufsraums - das Lager ist hoeher. Und der Anbau nach Norden
     bekommt jetzt auch welche, er gehoert zum selben Raum. */
  for(const x of [-17.95,-15.3,-12.7,-10.05]) for(const z of [-4,0,4]) leuchten.push([x,LAGER_H,z]);
  for(const [x,hy,z] of leuchten){
    bbox(1.44,0.03,0.42,rev,x,hy-0.008,z,null,false);          // Schattenfuge
    bbox(1.36,0.028,0.36,fixM,x,hy-0.026,z,null,false);        // Rahmen
    const d=new THREE.Mesh(new THREE.PlaneGeometry(1.26,0.28),panelM);
    d.rotation.x=Math.PI/2; d.position.set(x,hy-0.043,z); scene.add(d);
  }
  /* Ost- beziehungsweise Nordkante gehoeren zu einer Wand, die
     beim Ausbau faellt - der Schatten muss mit ihr verschwinden. */
  roomAO(-7.9,7.9,-5.9,5.9,null,{n:true,s:true,w:true});
  zWand('shop_gross',aoFloor(7.9-0.2,0,11.8,0.4,'+x',0.021));
  /* Rampenraum und Anbau sind ein Raum - der Schatten laeuft
     einmal aussen herum, nicht an der alten Trennlinie. */
  roomAO(-19.9,-8.1,-5.9,5.9,null,{n:true,w:true,e:true});
  buildAusbau();
  buildFacade();
  plane(1.4,0.35,new THREE.MeshStandardMaterial({map:tex(280,70,(g,W,Hh)=>{ g.fillStyle='#f2c230'; g.fillRect(0,0,W,Hh); g.fillStyle='#16181f'; g.font=BUN(40); g.textAlign='center'; g.textBaseline='middle'; g.fillText('LAGER',W/2,Hh/2+2); })}),-7.88,2.85,-2.5,Math.PI/2);
  // Wanduhr: echtes Gehaeuse mit Glas, Zeiger laufen nach der Spielzeit
  {
    /* Die Uhr hing an der Ostwand. Die faellt jetzt beim ersten
       Flaechenkauf weg - dann haengt die Uhr in der Luft. Sie sitzt
       deshalb an der Rueckwand des Basisladens, die immer steht. */
    const zg=new THREE.Group(); zg.position.set(-2.6,2.6,-5.86); scene.add(zg);
    const geh=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.055,HIQ?36:18),std(0x2b3140,{metalness:0.35,roughness:0.45}));
    geh.rotation.x=Math.PI/2; zg.add(geh);
    const rand2=new THREE.Mesh(new THREE.TorusGeometry(0.235,0.018,10,HIQ?30:16),std(0x9aa1ac,{metalness:0.7,roughness:0.3}));
    rand2.position.z=0.03; zg.add(rand2);
    const blattT=tex(512,512,(g,W,H)=>{
      g.fillStyle='#f4f6fb'; g.beginPath(); g.arc(256,256,248,0,Math.PI*2); g.fill();
      const gr=g.createRadialGradient(190,180,20,256,256,250);
      gr.addColorStop(0,'rgba(255,255,255,.9)'); gr.addColorStop(1,'rgba(206,214,228,.5)');
      g.fillStyle=gr; g.beginPath(); g.arc(256,256,248,0,Math.PI*2); g.fill();
      for(let i=0;i<60;i++){ const a=i/60*Math.PI*2-Math.PI/2, gross=i%5===0;
        g.strokeStyle=gross?'#0e1226':'#6b7182'; g.lineWidth=gross?9:3;
        g.beginPath(); g.moveTo(256+Math.cos(a)*(gross?200:212),256+Math.sin(a)*(gross?200:212));
        g.lineTo(256+Math.cos(a)*228,256+Math.sin(a)*228); g.stroke(); }
      g.fillStyle='#0e1226'; g.textAlign='center'; g.textBaseline='middle'; g.font=BUN(44);
      for(let i=1;i<=12;i++){ const a=i/12*Math.PI*2-Math.PI/2;
        g.fillText(String(i),256+Math.cos(a)*166,256+Math.sin(a)*166+3); }
      g.fillStyle='#8a9099'; g.font=BAR(26); g.fillText('QUARZ',256,336);
    });
    const blatt=plane(0.42,0.42,new THREE.MeshStandardMaterial({map:blattT,roughness:0.75}),0,0,0.032,0,zg);
    const zeigerM=std(0x141a2c,{roughness:0.5}), secM=std(0xc8322a,{roughness:0.45});
    uhrStd=new THREE.Group(); uhrStd.position.z=0.038; zg.add(uhrStd);
    bbox(0.026,0.125,0.008,zeigerM,0,0.052,0,uhrStd,false);
    uhrMin=new THREE.Group(); uhrMin.position.z=0.045; zg.add(uhrMin);
    bbox(0.019,0.185,0.008,zeigerM,0,0.082,0,uhrMin,false);
    uhrSek=new THREE.Group(); uhrSek.position.z=0.051; zg.add(uhrSek);
    bbox(0.008,0.2,0.006,secM,0,0.076,0,uhrSek,false);
    bbox(0.008,0.05,0.006,secM,0,-0.028,0,uhrSek,false);
    const nabe=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.014,12),std(0x9aa1ac,{metalness:0.7}));
    nabe.rotation.x=Math.PI/2; nabe.position.z=0.056; zg.add(nabe);
    /* Glas mit Reflex */
    const glasM=new THREE.MeshStandardMaterial({color:LIN(0xdfe8f4),transparent:true,opacity:0.14,roughness:0.06,metalness:0.3});
    const gl=new THREE.Mesh(new THREE.CircleGeometry(0.225,HIQ?32:16),glasM); gl.position.z=0.062; zg.add(gl);
  }
  buildCheckout(); buildDesk(); buildDetails();
  // Türschild
  doorSignTex=tex(360,150,()=>{});
  doorSign=plane(0.62,0.26,new THREE.MeshBasicMaterial({map:doorSignTex,side:THREE.DoubleSide,toneMapped:false}),1.6,1.55,5.875,Math.PI);
  doorSign.userData={kind:'sign'};
  // Hof & Testfeld
  buildZaun();
  buildYard();
  for(const x of [-11,-4,3,10]) strassenlampe(x,10.9,Math.PI);
  buildStreet();
  buildStadt();
  skyGeo=new THREE.SphereGeometry(760,32,18); skyGeo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(skyGeo.attributes.position.count*3),3));
  scene.add(new THREE.Mesh(skyGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false})));
  const sp=[]; for(let i=0;i<500;i++){ const a=Math.random()*Math.PI*2, e=rand(0.12,1.45), r=700; sp.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r); }
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
  starsMat=new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false}); scene.add(new THREE.Points(sg,starsMat));
  const N=COARSE?500:1100, sp2=new Float32Array(N*3); for(let i=0;i<N;i++){ sp2[i*3]=rand(-30,30); sp2[i*3+1]=rand(0,14); sp2[i*3+2]=rand(-24,30); }
  const sg2=new THREE.BufferGeometry(); sg2.setAttribute('position',new THREE.BufferAttribute(sp2,3));
  snowPts=new THREE.Points(sg2,new THREE.PointsMaterial({color:0xffffff,size:0.09,map:dotTex,transparent:true,opacity:0.9,depthWrite:false})); snowPts.frustumCulled=false; scene.add(snowPts);
  // Kollision
  /* Der Anbau Nord war frueher gesperrt; jetzt gehoert er von
     Anfang an zum Lager und braucht keine Sperre mehr. */
  /* Die alten Testfeldgrenzen sind weg: im Westen steht jetzt die
     Lagerhalle Sued, im Osten das Rueckgebaeude, im Sueden der Zaun. */
  zWandCol('shop_gross',col(7.9,20.0,-6.1,6.1));
  col(-8,-1.2,5.9,6.1); col(1.2,8,5.9,6.1); col(-8,4.4,-6.1,-5.9); col(6.1,8,-6.1,-5.9);
  col(-8.1,-7.9,-6.1,-3.2); col(-8.1,-7.9,-1.8,6.1);
  col(-20.1,-19.9,-6.1,-3.6); col(-20.1,-19.9,-0.4,2.1);

  buildDock();
}
function updateSign(){
  if(neonOpen) neonOpen.emissiveIntensity=phase==='open'?1.6:0;
  if(!doorSignTex) return;
  const t=phase==='open'?'GEÖFFNET':phase==='after'?'FEIERABEND':'GESCHLOSSEN';
  redraw(doorSignTex,(g,W,H)=>{ g.fillStyle=phase==='open'?'#2f9e57':phase==='after'?'#c9861c':'#c8322a'; g.fillRect(0,0,W,H); g.strokeStyle='#f2f5ff'; g.lineWidth=8; g.strokeRect(10,10,W-20,H-20); g.fillStyle='#f2f5ff'; fitFont(g,t,W-50,34,BUN); g.textAlign='center'; g.textBaseline='middle'; g.fillText(t,W/2,H/2+3); });
}
