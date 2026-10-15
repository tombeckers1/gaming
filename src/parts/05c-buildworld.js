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
  /* Wand und Boden: Leinwand im echten Massstab (2,6 × 3,6 m und
     4 × 4 m), bemalt wird sie in repaint - nach dem Laden, mit dem
     Belag aus dem Spielstand */
  const [wpx,wpy]=wandPx(), bpx=bodenPx(), leer=(g,W,H)=>{ g.fillStyle='#d8d2c6'; g.fillRect(0,0,W,H); };
  wallTex=tex(wpx,wpy,leer); wallTex.wrapS=THREE.RepeatWrapping; wallTex.wrapT=THREE.ClampToEdgeWrapping; wallTex.repeat.set(1/WAND_B,1/WAND_H);
  shopWall=new THREE.MeshStandardMaterial({map:wallTex,roughness:0.92});
  // Boden draußen
  /* Asphalt mit Splittkorn statt schwarzer Kritzel-Risse (Tom, 26.09.:
     "alles drum herum deutlich hochwertiger"); 4-m-Kachel aus 05e. Die
     Deckschicht der Fahrbahn nutzt dieselbe Textur in denselben
     Weltkoordinaten. */
  /* Halle Etappe B (15.10.): nach Westen bis x −160 (Werk, Hof West, Mischhaus) - 4-m-Kachel bleibt in Phase (-160 = -100 - 15 Kacheln) */
  const asph=asphaltTex(); asph.repeat.set(65,50);
  { const am=lichtMat(new THREE.MeshStandardMaterial({map:asph,normalMap:_asphN,roughness:0.9}));
    if(am.normalMap) am.normalScale=new THREE.Vector2(0.7,0.7);
    lichtUV2(flat(260,200,am,-30,0,0).geometry,tm(-30,0,0,-Math.PI/2,0,0)); }
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
  /* Gehweg, Bord und Markierungen baut buildFahrbahn (05e) */
  // Innenböden
  floorTexRef=tex(bpx,bpx,leer); floorTexRef.wrapS=floorTexRef.wrapT=THREE.RepeatWrapping; floorTexRef.repeat.set(1,1); floorTexRef.anisotropy=8;
  floorMat=new THREE.MeshStandardMaterial({map:floorTexRef,roughness:0.5});
  bodenUV(flat(16,12,floorMat,0,0.015,0),BODEN_KACHEL);
  /* Ein Boden fuer das ganze Basislager, in einem Stueck und in
     einem Massstab. Vorher lagen hier zwei Platten mit
     unterschiedlicher Kachelgroesse uebereinander - an ihrer Kante
     sprang die Helligkeit, das sah aus wie ein Riss im Boden. */
  { const L=LAY.lbasis, N=LAY.lnord;
    MAT.kachel(flat(L.x1-L.x0,N.z1-L.z0,MAT.get('betonBoden'),
      (L.x0+L.x1)/2,0.015,(L.z0+N.z1)/2).geometry,(L.x1-L.x0)/2,(N.z1-L.z0)/2); }
  /* Testfeldbelag ueber die ganze Flaeche, nicht nur um die Stationen */
  { const T=LAY.test, tg=yardGroundTex(); tg.repeat.set((T.x1-T.x0)/10*2.2,(T.z1-T.z0)/9*2);
    flat(T.x1-T.x0,T.z1-T.z0,new THREE.MeshStandardMaterial({map:tg,roughness:0.92}),
      (T.x0+T.x1)/2,0.013,(T.z0+T.z1)/2); }
  // Warenannahme
  /* gestrichelt umrandete Abstellflaeche mit Bodenschrift (bk.bodenmarkierung, Einheit 15.10.) */
  bk.bodenmarkierung({rahmen:[{x0:-16.45,x1:-14.15,z0:-4.15,z1:0.15,farbe:'gelb',breite:0.08,strich:0.26,luecke:0.14}],
    schriften:[{text:'WARENEINGANG',x:-15.3,z:-2,b:2.6,h:0.5,ry:-Math.PI/2}],y:0.016});
  // Laden: Frontwand mit Schaufenstern
  const H=WH;
  wall(-8,-7.2,5.9,6.1,0,H,'-z',shopWall); wall(-2,-1.2,5.9,6.1,0,H,'-z',shopWall);
  wall(-7.2,-2,5.9,6.1,0,0.9,'-z',shopWall); wall(-7.2,-2,5.9,6.1,2.4,H,'-z',shopWall);
  wall(1.2,2,5.9,6.1,0,H,'-z',shopWall); wall(7.2,8,5.9,6.1,0,H,'-z',shopWall);
  wall(2,7.2,5.9,6.1,0,0.9,'-z',shopWall); wall(2,7.2,5.9,6.1,2.4,H,'-z',shopWall);
  wall(-1.2,1.2,5.9,6.1,2.5,H,'-z',shopWall);
  /* Schaufenster, Tuerzarge, Sohlbank und Schmutzschicht: bk.fenster (04z) - wie an den Erweiterungen */
  { const F=bk.fenster({art:'schaufenster',z:6.0,felder:[{x0:-7.2,x1:-2,y0:0.9,y1:2.4},{x0:2,x1:7.2,y0:0.9,y1:2.4}],zarge:[{x0:-1.2,x1:1.2,y1:2.5}],schmutz:true});
    occluders.push(F.glas); buildWindowGrime(F.schmutz); }
  // Rückwand, rechte Wand
  /* Rueckwand des Basisladens. Ihre Aussenseite traegt die
     Fassade wie jede andere Aussenwand - vom Testfeld aus sah man
     dort die Lagerwand mit dem gelben Streifen, obwohl das die
     Rueckseite des Ladens ist. Der Lagergang kommt spaeter als
     Anbau davor; dass er an einer Fassade endet, ist richtig so. */
  const fas=bk.flaeche('fassade');
  /* Die Stirnseiten tragen die Wandfarbe mit Sockelband: an der
     Hintertuer als Laibung, und bei x = 8 endet die Wand frei, sobald
     die Halle hinterm Laden gekauft ist. Dort stand vorher eine
     hellgraue Kante vom Boden bis zur Decke ohne Sockel und Streifen. */
  wall(-8,4.4,-6.1,-5.9,0,H,'+z',shopWall,fas,undefined,shopWall);
  wall(6.1,8,-6.1,-5.9,0,H,'+z',shopWall,fas,undefined,shopWall);
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
  /* In einem Stueck von der Tueroeffnung bis zur Nordwand. Vorher
     stiess hier bei z=2 ein zweites Wandstueck an, und an der
     Stossstelle stand eine senkrechte Naht in der Wand. */
  wall(-8.1,-7.9,-6.1,-3.2,0,LAGER_H,'+x',shopWall,lagerWall); wall(-8.1,-7.9,-1.8,6.1,0,LAGER_H,'+x',shopWall,lagerWall);
  wall(-8.1,-7.9,-3.2,-1.8,2.5,LAGER_H,'+x',shopWall,lagerWall);
  // Lager. Es ist hoeher als der Verkauf: LAGER_H statt H.
  wall(-20.1,-19.9,-6.1,-3.6,0,LAGER_H,'+x',lagerWall); wall(-20.1,-19.9,-0.4,5.9,0,LAGER_H,'+x',lagerWall); wall(-20.1,-19.9,-3.6,-0.4,3.0,LAGER_H,'+x',lagerWall);
  /* Die Suedwand des Lagers baut jetzt die Durchbruchwand in 05h:
     dort sitzt die Oeffnung zur Halle Sued.
     Zum Anbau nach Norden steht gar keine Wand mehr: beide Teile
     sind gleich hoch und bilden einen Raum. Frueher war der Anbau
     eine zugemauerte Ausbaustufe mit niedrigerer Decke, und
     dazwischen blieb ein Sturz quer im Lager stehen. */
  /* Sockelleiste im Ton der Wand (sockelM, 05h) */
  /* Sockelleisten enden an den Tueroeffnungen, statt durchzulaufen (bk.sockelleiste, Wandbild) */
  for(const [a,b] of [[-7.9,4.4],[6.1,7.9]]) bk.sockelleiste({laengs:true,a0:a,a1:b,x:(a+b)/2,z:-5.89});
  for(const [a,b] of [[-7.9,-1.2],[1.2,7.9]]) bk.sockelleiste({laengs:true,a0:a,a1:b,x:(a+b)/2,z:5.89});
  for(const [a,b] of [[-5.9,-4.4],[4.4,5.9]])
    for(const sx of [7.89,8.11]) bk.sockelleiste({laengs:false,a0:a,a1:b,x:sx,z:(a+b)/2,zone:'shop_gross'});
  for(const [a,b] of [[-5.9,-3.2],[-1.8,5.9]]) bk.sockelleiste({laengs:false,a0:a,a1:b,x:-7.89,z:(a+b)/2});
  // Dächer & Decken
  /* Der Dachrand des Ladens darf nach Westen nicht ueber die Wand
     hinausragen: dahinter steht das hoehere Lager, und der
     Ueberstand stand dort als dunkler Balken quer in der Wand. */
  bbox(16.2,0.25,12.4,MAT.get('anthrazitMatt'),0.1,H+0.13,0);
  /* Ein Dach ueber das ganze Lager, Rampenraum und Anbau zusammen */
  bbox(12.4,0.25,12.4,MAT.get('anthrazitMatt'),-14,LAGER_H+0.13,-0.1);
  const ceil=MAT.get('weissMatt');
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
  const fixM=MAT.get('kunststoffHellgrau');
  const rev=MAT.get('anthrazitMatt');
  const leuchten=[];
  /* Das Leuchtenraster richtet sich nach der Trennwand: drei
     Reihen in der Starthaelfte, zwei in der zweiten. Vorher lief
     eine Reihe genau durch die Wand hindurch. */
  for(const x of [-6.2,-3.4,-0.6, 3.7,6.5]) for(const z of [-3.6,0,3.6]) leuchten.push([x,WH,z]);
  /* Die Lagerleuchten haengen an der Lagerdecke, nicht an der des
     Verkaufsraums - das Lager ist hoeher. Und der Anbau nach Norden
     bekommt jetzt auch welche, er gehoert zum selben Raum. */
  for(const x of [-17.95,-15.3,-12.7,-10.05]) for(const z of [-4,0,4]) leuchten.push([x,LAGER_H,z]);
  for(const [x,hy,z] of leuchten) LAMPEN.push({x,y:hy,z,id:null});
  for(const [x,hy,z] of leuchten){
    bbox(1.44,0.03,0.42,rev,x,hy-0.008,z,null,false);          // Schattenfuge
    bbox(1.36,0.028,0.36,fixM,x,hy-0.026,z,null,false);        // Rahmen
    const d=new THREE.Mesh(new THREE.PlaneGeometry(1.26,0.28),panelM);
    d.rotation.x=Math.PI/2; d.position.set(x,hy-0.043,z); scene.add(d);
  }
  /* Ost- beziehungsweise Nordkante gehoeren zu einer Wand, die
     beim Ausbau faellt - der Schatten muss mit ihr verschwinden. */
  /* bis x=8,0: dort beginnt die erste Erweiterung - bis 7,9 blieb an
     der Stossstelle ein heller Spalt im Bodenschatten */
  roomAO(-7.9,8.0,-5.9,5.9,null,{n:true,s:true,w:true});
  zWand('shop_gross',aoFloor(7.9-0.2,0,11.8,0.4,'+x',0.021));
  /* Rampenraum und Anbau sind ein Raum - der Schatten laeuft
     einmal aussen herum, nicht an der alten Trennlinie. */
  roomAO(-19.9,-8.1,-5.9,5.9,null,{n:true,w:true,e:true});
  buildAusbau();
  buildFacade();
  /* Raumschild ueber dem Durchgang zum Lager: Hausstil wie alle Durchgangsschilder (Einheit 15.10., vorher gelb/schwarz) */
  bk.schild(scene,{text:'LAGER',b:1.4,h:0.35,x:-7.88,y:2.85,z:-2.5,ry:Math.PI/2,leucht:true});
  // Wanduhr: echtes Gehaeuse mit Glas, Zeiger laufen nach der Spielzeit
  {
    /* Die Uhr hing an der Ostwand. Die faellt jetzt beim ersten
       Flaechenkauf weg - dann haengt die Uhr in der Luft. Sie sitzt
       deshalb an der Rueckwand des Basisladens, die immer steht. */
    const zg=new THREE.Group(); zg.position.set(-2.6,2.6,-5.86); scene.add(zg);
    const geh=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.055,HIQ?36:18),MAT.get('lackAnthrazit'));
    geh.rotation.x=Math.PI/2; zg.add(geh);
    const rand2=new THREE.Mesh(new THREE.TorusGeometry(0.235,0.018,10,HIQ?30:16),MAT.get('chromHell'));
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
    const zeigerM=MAT.get('schildBlau'), secM=MAT.get('lackRot');
    uhrStd=new THREE.Group(); uhrStd.position.z=0.038; zg.add(uhrStd);
    bbox(0.026,0.125,0.008,zeigerM,0,0.052,0,uhrStd,false);
    uhrMin=new THREE.Group(); uhrMin.position.z=0.045; zg.add(uhrMin);
    bbox(0.019,0.185,0.008,zeigerM,0,0.082,0,uhrMin,false);
    uhrSek=new THREE.Group(); uhrSek.position.z=0.051; zg.add(uhrSek);
    bbox(0.008,0.2,0.006,secM,0,0.076,0,uhrSek,false);
    bbox(0.008,0.05,0.006,secM,0,-0.028,0,uhrSek,false);
    const nabe=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.014,12),MAT.get('stahlHell'));
    nabe.rotation.x=Math.PI/2; nabe.position.z=0.056; zg.add(nabe);
    /* Glas mit Reflex */
    const glasM=new THREE.MeshStandardMaterial({color:LIN(MAT.farbe('weiss')),transparent:true,opacity:0.14,roughness:0.06,metalness:0.3});
    const gl=new THREE.Mesh(new THREE.CircleGeometry(0.225,HIQ?32:16),glasM); gl.position.z=0.062; zg.add(gl);
  }
  buildCheckout(); buildDesk();
  // Türschild
  /* Tuerschild (Oeffnungszeiten, malt 16-day): Leuchtschild aus dem Baukasten, eigenes Bild */
  doorSign=bk.schild(scene,{malen:()=>{},pw:360,ph:150,b:0.62,h:0.26,x:1.6,y:1.55,z:5.875,ry:Math.PI,leucht:true,doppel:true});
  doorSignTex=doorSign.material.map;
  doorSign.userData={kind:'sign'};
  // Hof & Testfeld
  buildZaun();
  buildYard();
  /* Ausleger zur Fahrbahn wie gegenueber, Mast 50 cm hinter der
     Bordkante; zwei weitere vor der Erweiterung. 28.09.: 13-16 m
     Abstand wie gegenueber und versetzt zu den Baeumen - bei 7 m stand
     ein Wald aus Masten da, zwei Koepfe steckten im Geaest. */
  for(const x of [-11,2.5,18.5,30.5]) strassenlampe(x,10.6,0);
  buildStreet();
  buildStadt();
  buildPark();
  /* Himmel: die Kuppel muss innerhalb der Sichtweite der Kamera
     (300 m) liegen, sonst wird sie weggeschnitten und man sieht nur
     die Hintergrundfarbe. Sie wandert mit dem Spieler mit, damit sie
     trotz des kleineren Radius nie naeher kommt. */
  skyGeo=new THREE.SphereGeometry(SKY_R,48,64); skyGeo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(skyGeo.attributes.position.count*3),3));
  skyMesh=new THREE.Mesh(skyGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));
  skyMesh.renderOrder=-10; skyMesh.frustumCulled=false; scene.add(skyMesh);
  const sp=[]; for(let i=0;i<700;i++){ const a=Math.random()*Math.PI*2, e=rand(0.12,1.45), r=SKY_R-15; sp.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r); }
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
  starsMat=new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false});
  starPts=new THREE.Points(sg,starsMat); starPts.renderOrder=-9; starPts.frustumCulled=false; scene.add(starPts);
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
  col(-20.1,-19.9,-6.1,-3.6); col(-20.1,-19.9,-0.4,5.9);

  buildDock();
}
function updateSign(){
  if(neonOpen){ neonOpen.emissiveIntensity=phase==='open'?0.38:0; leuchtkastenMalen(); }
  if(!doorSignTex) return;
  const t=phase==='open'?'GEÖFFNET':phase==='after'?'FEIERABEND':'GESCHLOSSEN';
  redraw(doorSignTex,(g,W,H)=>{ g.fillStyle=phase==='open'?'#2f9e57':phase==='after'?'#c9861c':'#c8322a'; g.fillRect(0,0,W,H); g.strokeStyle='#f2f5ff'; g.lineWidth=8; g.strokeRect(10,10,W-20,H-20); g.fillStyle='#f2f5ff'; fitFont(g,t,W-50,34,BUN); g.textAlign='center'; g.textBaseline='middle'; g.fillText(t,W/2,H/2+3); });
}
