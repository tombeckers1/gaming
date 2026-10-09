/* =========================================================
   Grosse Halle: Flaechen (Wareneingang, Schnellplaetze, Packmaterial),
   Laptop, Kollision der Einbauten, Kleinteile.
   ========================================================= */
function hvFlaechen(){
  const G=hvBereich('flaechen'), S=hvSammler(), R=hvRng(31), W=HV7.we, pal=[], palF=[];
  /* Wareneingang: angelieferte Paletten, foliert */
  for(const t of HV7.tore) for(const dx of [-0.75,0.75]) for(let r=0;r<3;r++){
    if(R()<0.4) continue; const x=t.x+dx, z=W.z0+1.6+r*1.45;
    palF.push({x,y:0,z,v:Math.floor(R()*4)}); hvCol(x-0.42,x+0.42,z-0.62,z+0.62); }
  /* Schnellplaetze: kurz abgestellte Paletten */
  const SN=HV7.schnell;
  for(let i=0;i<SN.n;i++){ if(R()<0.35) continue; const x=SN.x0+0.6+i*SN.dx, z=(SN.z0+SN.z1)/2;
    (R()<0.5?palF:pal).push({x,y:0,z,v:Math.floor(R()*4)}); hvCol(x-0.42,x+0.42,z-0.62,z+0.62); }
  hvPalettenInst(G,pal,false); hvPalettenInst(G,palF,true);
  /* Packmaterial: Paletten mit Faltkartons, Folie, Klebeband, Fuellmaterial */
  const PM=HV7.pack, holz=[];
  const plaetze=[[-40.4,-26.4],[-38.6,-26.4],[-36.8,-26.4],[-35.0,-26.4],[-40.4,-24.1],[-38.6,-24.1],[-36.8,-24.1]];
  plaetze.forEach(([x,z],i)=>{ holz.push(tm(x,0,z,0,Math.PI/2,0)); hvCol(x-0.62,x+0.62,z-0.42,z+0.42);
    const y0=PAL_H;
    if(i<3){ /* Faltkartons, flach gestapelt, mit Umreifung */
      const n=[34,26,40][i], w=[1.15,1.0,0.9][i], d=[0.78,0.7,0.6][i], h=0.012*n;
      S.box(w,h,d,x,y0+h/2,z,[0xbf9150,0xc89b5c,0xb88a4e][i],'matt');
      for(const s of [-0.25,0.25]) S.box(0.025,h+0.004,d+0.004,x+s*w,y0+h/2,z,0xf2f2ee,'lack');
    } else if(i===3){ /* Stretchfolie: stehende Rollen */
      for(let a=0;a<3;a++) for(let b=0;b<2;b++) S.zyl(0.11,0.5,x-0.35+a*0.35,y0+0.25,z-0.2+b*0.4,0xe8ecf0,'lack','y',12);
    } else if(i===4){ /* Fuellmaterial in Saecken */
      for(let a=0;a<2;a++) for(let b=0;b<2;b++) for(let c=0;c<2;c++) S.box(0.55,0.32,0.36,x-0.28+a*0.56,y0+0.17+c*0.33,z-0.19+b*0.38,0xf4f4f0,'matt',0,(R()-0.5)*0.2,0);
    } else if(i===5){ /* Klebeband-Kartons */
      for(let a=0;a<3;a++) for(let b=0;b<2;b++) for(let c=0;c<3;c++) S.box(0.36,0.24,0.36,x-0.38+a*0.38,y0+0.12+c*0.25,z-0.19+b*0.38,0xc89b5c,'matt');
    } else { /* Versandkartons gemischt, foliert */
      S.box(1.1,0.9,0.75,x,y0+0.45,z,0xc89b5c,'matt'); }
  });
  hvInst(hvPalGeo(),HVM.holz,holz,G);
  /* Fachbodenregal mit Klebeband und Etiketten */
  { const x=-33.7, z=-25.3; for(const dz of [-0.9,0.9]) for(const dx of [-0.3,0.3]) S.box(0.05,2.2,0.05,x+dx,1.1,z+dz,0x9aa1aa,'metall');
    for(const y of [0.2,0.8,1.4,2.0]) S.box(0.6,0.03,1.85,x,y,z,0xc5cad1,'metall');
    for(const y of [0.2,0.8,1.4]) for(let k=0;k<6;k++) S.zyl(0.07,0.05,x,y+0.04,z-0.75+k*0.3,0xb58a4f,'matt','x',10);
    hvCol(x-0.35,x+0.35,z-0.95,z+0.95); }
  /* Hubwagen (Modell aus dem Hauptspiel) */
  if(typeof hubModell==='function'){
    for(const [x,z,ry] of [[-43.6,-30.3,0.4],[-28.6,-31.8,-1.3],[-44.6,-11.6,1.57]]){ const h=hubModell(); h.position.set(x,0,z); h.rotation.y=ry; G.add(h); } }
  S.fertig(G);
}

/* Laptop auf einem Stehpult im Anbruch - hier oeffnet man das Hallenmenue */
function hvAusstattung(o){
  const G=hvBereich('ausstattung'), S=hvSammler(), q=hvQ();
  const LP={x:-42.75,z:-18.0,y:1.12};
  S.box(0.08,1.05,0.08,LP.x,0.52,LP.z,0x4a5058,'metall'); S.box(0.5,0.04,0.5,LP.x,0.02,LP.z,0x4a5058,'metall');
  S.box(0.7,0.04,0.5,LP.x,1.07,LP.z,0xd8dce1,'lack');
  S.box(0.38,0.02,0.26,LP.x,1.1,LP.z+0.03,0x2b2f38,'lack');
  S.fertig(G);
  const scr=new THREE.Mesh(hvRes(new THREE.PlaneGeometry(0.37,0.23)),hvRes(new THREE.MeshBasicMaterial({toneMapped:false,map:hvRes(tex(320,200,(g,W,H)=>{
    g.fillStyle='#10223a'; g.fillRect(0,0,W,H); g.fillStyle='#f2c230'; g.fillRect(0,0,W,30);
    g.fillStyle='#16181f'; g.font=BUN(18); g.textBaseline='middle'; g.fillText('GROSSE HALLE',10,16);
    g.fillStyle='#dbe7f7'; g.font=BAR(22); ['Ansichten','Messwerte','Grafikstufe','Zurück zum Start'].forEach((t,i)=>g.fillText('› '+t,16,58+i*36));
  }))})));
  scr.position.set(LP.x,LP.y+0.12,LP.z-0.1); scr.rotation.x=-0.25; G.add(scr);
  const deckel=new THREE.Mesh(hvRes(new THREE.BoxGeometry(0.38,0.25,0.012)),hvRes(std(0x2b2f38,{roughness:0.5})));
  deckel.position.set(LP.x,LP.y+0.12,LP.z-0.108); deckel.rotation.x=-0.25; G.add(deckel);
  HALLE.laptop=LP; hvCol(LP.x-0.36,LP.x+0.36,LP.z-0.26,LP.z+0.26);
  /* Kollision der festen Einbauten */
  const R=HV7.hr;
  for(const gs of HV7.gassen){ hvCol(R.x0-0.1,R.x1+0.12,gs.a0,gs.a1); hvCol(R.x0-0.1,R.x1+0.12,gs.b0,gs.b1);
    hvCol(HV7.io.x0,HV7.io.x1,gs.a0,gs.a1); hvCol(HV7.io.x0,HV7.io.x1,gs.b0,gs.b1); hvCol(HV7.io.x1,HV7.io.x1+0.1,gs.a1,gs.b0);
    hvCol(HV7.anbruch.x0+0.78,HV7.anbruch.x0+1.62,gs.mitte-0.62,gs.mitte+0.62); }
  for(const z of [-23.47,-18.8]) for(let x=HV7.prod.x0+7;x<HV7.prod.x1-1;x+=7) hvCol(x-0.18,x+0.18,z-0.18,z+0.18);
  for(const [x,z] of [[-43.0,-26.8],[-43.2,-20.6],[-42.8,-15.4]]) hvCol(x-0.4,x+0.4,z-0.6,z+0.6);
  hvCol(-43.5,-41.9,-23.9,-23.05);
  /* Brandschutz-Schiebetore an den Durchgaengen zur Produktion (offen) */
  const Sb=hvSammler();
  for(const t of HV7.pTueren){ const L=t.z1-t.z0+0.4, z=t.z1+0.2+L/2;
    Sb.box(0.1,3.5,L,HV7.halle.x0+0.08,1.75,z,0xb8bec6,'lack');
    for(let k=1;k<4;k++) Sb.box(0.11,0.02,L,HV7.halle.x0+0.08,k*0.88,z,0x8a9099,'lack');
    Sb.box(0.14,0.14,2*L+0.6,HV7.halle.x0+0.1,3.6,(t.z0+z+L/2)/2,0x5d646d,'metall');
    /* Notausgang-Leuchte gruen ueber der Oeffnung */
    Sb.box(0.04,0.18,0.42,HV7.halle.x0+0.06,3.45,(t.z0+t.z1)/2,0x2fd06a,'leucht'); }
  /* Feuerloescher an den Stuetzen */
  for(let x=HV7.halle.x0+5;x<HV7.halle.x1-1;x+=10){ if(HV7.tore.some(t=>Math.abs(t.x-x)<2.2)) continue;
    Sb.zyl(0.08,0.5,x+0.3,1.0,HV7.halle.z0+0.45,0xd02a20,'lack','y',10); Sb.box(0.3,0.3,0.02,x+0.3,1.65,HV7.halle.z0+0.13,0xd02a20,'lack'); }
  Sb.fertig(G);
  /* Lager-Hinweistafeln */
  hvSchild(G,'ANBRUCH','Kartons → N1 → Kartonlager',2.6,0.62,-42.0+0.05,3.2,-21.13,Math.PI/2*0+Math.PI/2);
}
