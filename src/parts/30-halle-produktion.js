/* =========================================================
   Grosse Halle: Produktion im Westfluegel (918 m2, 5 m), drei automatische
   Fertigungsstrassen nach Toms Referenzfoto (produktion-referenz.webp):
   Rollenbahnen, Portal-Greifer, Rohr-Raster, helle Industrie-Optik.
   Jede Strasse hat zwei Ebenen: oben auf der Buehne die Zufuehrung
   (Materialkisten, Trichter, Magazin), unten die Linie. Am Ostende legt ein
   Palettierroboter die Kartons auf die Palette, ein Foerderer bringt sie
   durch die Brandwand ans Westende ihrer Hochregalgasse.
   Noch ohne Spielablauf - die Teile bewegen sich nur zur Ansicht.
   ========================================================= */
const HV_LINIE={xs:-97.6,xe:HV7.prod.x1-0.3,band:0.85,buehne:2.4};
const HVF={weiss:0xe2e5e8,hell:0xd6dade,alu:0xc5cad1,dunkel:0x2a2e35,gelb:0xf2b81c,gummi:0x24262b,blau:0x2f6fd0,klt:0x3b6fb6,pappe:0xbf9150};

/* Gehaeuse einer Station: Unterbau, Alurahmen, Plexiglas, Dach, Signalsaeule, Bedienfeld */
function hvMaschine(S,x0,x1,z,b,h,o){
  o=o||{}; const xm=(x0+x1)/2, L=x1-x0, ub=0.85;
  S.box(L,0.7,b,xm,0.43,z,o.farbe||HVF.weiss,'lack');
  S.box(L-0.06,0.08,b-0.06,xm,0.04,z,HVF.dunkel,'lack');
  if(o.offen!==true){
    for(const xx of [x0+0.03,x1-0.03,...(L>2.5?[xm]:[])]) for(const s of [-1,1]) S.box(0.05,h-ub,0.05,xx,(ub+h)/2,z+s*(b/2-0.03),HVF.alu,'metall');
    for(const s of [-1,1]) S.box(L,0.05,0.05,xm,h-0.025,z+s*(b/2-0.03),HVF.alu,'metall');
    for(const xx of [x0+0.03,x1-0.03]) S.box(0.05,0.05,b,xx,h-0.025,z,HVF.alu,'metall');
    for(const s of [-1,1]) S.box(L-0.1,h-ub-0.1,0.01,xm,(ub+h)/2,z+s*(b/2-0.03),0xffffff,'plexi');
    S.box(L,0.04,b,xm,h+0.02,z,o.dach||HVF.hell,'lack');
    /* Innenleben: Hubachse mit Greifer ueber dem Band, Antrieb dunkel */
    const ix=xm+(L>2.6?-L*0.18:0);
    for(const s of [-1,1]) S.box(0.06,h-ub-0.1,0.06,ix,(ub+h)/2,z+s*(b/2-0.25),HVF.alu,'metall');
    S.box(0.1,0.1,b-0.5,ix,h-0.35,z,HVF.alu,'metall');
    S.box(0.18,0.22,0.22,ix,h-0.52,z,HVF.dunkel,'lack');
    S.box(0.06,0.55,0.06,ix,h-0.85,z,0xb8bec6,'metall');
    S.box(0.26,0.06,0.16,ix,h-1.12,z,HVF.dunkel,'lack');
    if(L>2.6) S.box(0.5,0.32,0.4,xm+L*0.22,ub+0.2,z-b/2+0.4,0x5d646d,'lack');
    /* Kabelzufuehrung von der Decke */
    S.box(0.3,HV7.PH-h-0.05,0.06,x0+0.35,(HV7.PH+h)/2,z-b/2+0.1,HVF.gelb,'lack');
    S.box(0.36,0.28,0.18,x0+0.35,h+0.18,z-b/2+0.12,0xc9ced5,'lack');
  }
  const q=hvQ(), DK=0x4a5058;
  /* Unterschrank: Eckprofile, Kantenleiste, Zierband, Tuerfugen, Griffe, Lueftungsgitter */
  for(const xx of [x0+0.02,x1-0.02]) for(const s of [-1,1]) S.box(0.05,0.72,0.05,xx,0.44,z+s*(b/2-0.015),DK,'lack');
  for(const s of [-1,1]){ S.box(L,0.04,0.03,xm,0.8,z+s*(b/2-0.005),DK,'lack');
    S.box(L-0.02,0.05,0.008,xm,0.74,z+s*(b/2+0.002),o.band||0x2f6fd0,'lack');
    for(let xx=x0+0.6;xx<x1-0.3;xx+=0.6){ S.box(0.008,0.6,0.008,xx,0.43,z+s*(b/2+0.002),0x7d848d,'lack'); S.box(0.03,0.12,0.02,xx-0.08,0.5,z+s*(b/2+0.01),0x5d646d,'metall'); }
    if(q.fein){ const vx=x1-0.45; S.box(0.34,0.26,0.006,vx,0.36,z+s*(b/2+0.003),0x8a9099,'lack');
      for(let i=0;i<6;i++) S.box(0.3,0.016,0.012,vx,0.26+i*0.04,z+s*(b/2+0.006),0x2a2e35,'lack'); } }
  for(const xx of [x0,x1]){ const sg=xx<xm?-1:1; S.box(0.006,0.6,b-0.12,xx+sg*0.002,0.43,z,0x7d848d,'lack');
    if(q.fein) for(let i=0;i<5;i++) S.box(0.012,0.016,Math.min(0.5,b-0.3),xx+sg*0.006,0.3+i*0.045,z,0x2a2e35,'lack'); }
  if(o.offen!==true){
    /* Dachblende mit Akzentband, dunkle Rahmenleisten an der Scheibe */
    for(const s of [-1,1]){ S.box(L+0.02,0.1,0.02,xm,h-0.07,z+s*(b/2-0.0),o.band||0x2f6fd0,'lack'); S.box(L-0.1,0.025,0.02,xm,ub+0.06,z+s*(b/2-0.02),DK,'lack'); }
    /* sichtbare Mechanik: Servomotor an der Achse, Zahnriemen, Pneumatikzylinder, Ventilinsel */
    const ix=xm+(L>2.6?-L*0.18:0);
    S.zyl(0.07,0.22,ix,h-0.35,z-b/2+0.37,DK,'lack','z',q.rund); S.zyl(0.05,0.06,ix,h-0.35,z-b/2+0.22,0x8a9099,'metall','z',8);
    S.box(0.02,0.04,b-0.6,ix+0.06,h-0.35,z,0x1d1f24,'matt');
    if(q.fein){ for(const s of [-1,1]){ S.zyl(0.035,0.42,ix+s*0.32,ub+0.45,z+b/2-0.35,0xd8dce1,'metall','y',8); S.zyl(0.012,0.2,ix+s*0.32,ub+0.75,z+b/2-0.35,0xb9bfc6,'metall','y',6); S.box(0.09,0.05,0.09,ix+s*0.32,ub+0.22,z+b/2-0.35,DK,'lack'); }
      const vx=x1-0.5; S.box(0.42,0.12,0.1,vx,ub+0.5,z-b/2+0.12,0x3b6fb6,'lack'); for(let i=0;i<6;i++){ S.box(0.04,0.06,0.04,vx-0.17+i*0.068,ub+0.59,z-b/2+0.12,DK,'lack'); S.box(0.01,0.3,0.01,vx-0.17+i*0.068,ub+0.77,z-b/2+0.12,[0x3a8fd8,0x2a2e35,0x3a8fd8,0xe36b1f,0x3a8fd8,0x2a2e35][i],'matt'); } }
    /* Kabeltrasse ueber dem Dach: Gitterrinne mit Kabeln */
    const ky=h+0.32, kz=z-b/2+0.3;
    S.box(L-0.2,0.012,0.3,xm,ky,kz,0x9aa1aa,'metall'); for(const s of [-1,1]) S.box(L-0.2,0.08,0.012,xm,ky+0.04,kz+s*0.15,0x9aa1aa,'metall');
    for(let i=0;i<4;i++) S.box(L-0.24,0.035,0.035,xm,ky+0.025,kz-0.09+i*0.06,[0x1d1f24,0x5d646d,0xe36b1f,0x1d1f24][i],'matt');
    for(let xx=x0+0.4;xx<x1-0.2;xx+=1.2) S.box(0.03,0.3,0.03,xx,h+0.17,kz,0x8a9099,'metall');
  }
  if(o.signal!==false){ const sx=x1-0.15, sz=z-b/2+0.15;
    S.box(0.12,0.04,0.12,sx,h+0.04,sz,DK,'lack'); S.zyl(0.025,0.3,sx,h+0.2,sz,HVF.alu,'metall','y',8);
    S.zyl(0.05,0.04,sx,h+0.37,sz,0x1d1f24,'lack','y',10);
    S.zyl(0.05,0.08,sx,h+0.43,sz,0x3dff7a,'leucht','y',10); S.zyl(0.05,0.08,sx,h+0.51,sz,0x6a5a14,'lack','y',10); S.zyl(0.05,0.08,sx,h+0.59,sz,0x6a1414,'lack','y',10);
    S.zyl(0.05,0.08,sx,h+0.67,sz,0x1a2e6a,'lack','y',10); S.zyl(0.052,0.03,sx,h+0.725,sz,0x1d1f24,'lack','y',10); }
  /* Not-Aus an beiden Stirnseiten des Unterbaus */
  for(const xx of [x0-0.01,x1+0.01]){ const sg=xx<xm?-1:1; S.box(0.08,0.12,0.12,xx+sg*0.03,0.66,z+b/2-0.15,0xf2c230,'lack'); S.zyl(0.035,0.04,xx+sg*0.08,0.66,z+b/2-0.15,0xd8352a,'lack','x',10); }
  if(o.hmi!==false){ const hx=x0+0.4, hz=z+b/2+0.25;
    /* Bedienpult am Schwenkarm: Rahmen, Display, Tasten, Not-Aus */
    S.box(0.06,0.9,0.06,hx,ub+0.45,z+b/2+0.05,HVF.alu,'metall'); S.box(0.06,0.06,0.25,hx,ub+0.9,z+b/2+0.15,HVF.alu,'metall'); S.zyl(0.05,0.06,hx,ub+0.92,hz-0.02,DK,'lack','y',8);
    S.box(0.5,0.42,0.08,hx,ub+1.1,hz,0x5d646d,'lack'); S.box(0.46,0.38,0.006,hx,ub+1.1,hz+0.041,0x2a2e35,'lack');
    S.box(0.36,0.22,0.005,hx-0.02,ub+1.15,hz+0.045,0xffffff,'screen');
    for(let i=0;i<4;i++) S.box(0.04,0.025,0.01,hx-0.15+i*0.08,ub+0.97,hz+0.046,[0x3dff7a,0xffffff,0xffd23a,0x3a8fd8][i],'leucht');
    S.box(0.1,0.12,0.08,hx+0.3,ub+1.0,hz,0xf2c230,'lack'); S.zyl(0.035,0.04,hx+0.3,ub+1.0,hz+0.055,0xd8352a,'lack','z',10);
  }
}
/* Gurtband laengs x mit Alurahmen und Beinen */
function hvGurtband(S,x0,x1,z,b,y){
  const xm=(x0+x1)/2; y=y||HV_LINIE.band;
  S.box(x1-x0,0.03,b,xm,y-0.015,z,HVF.gummi,'matt');
  for(const s of [-1,1]) S.box(x1-x0,0.1,0.04,xm,y-0.04,z+s*(b/2+0.02),HVF.alu,'metall');
  for(let x=x0+0.2;x<x1;x+=1.5) for(const s of [-1,1]) S.box(0.05,y-0.08,0.05,x,(y-0.08)/2,z+s*(b/2+0.02),HVF.alu,'metall');
  S.zyl(0.05,b,x0+0.04,y-0.05,z,HVF.alu,'metall','z',10); S.zyl(0.05,b,x1-0.04,y-0.05,z,HVF.alu,'metall','z',10);
}
/* Portal: vier Stuetzen, Laengstraeger, verfahrbarer Schlitten mit Hubachse */
function hvPortal(G,S,x0,x1,z,b,h,greifer){
  for(const xx of [x0,x1]) for(const s of [-1,1]) S.box(0.09,h,0.09,xx,h/2,z+s*b/2,HVF.alu,'metall');
  for(const s of [-1,1]) S.box(x1-x0+0.09,0.12,0.1,(x0+x1)/2,h,z+s*b/2,HVF.alu,'metall');
  S.box(x1-x0,0.06,0.06,(x0+x1)/2,h+0.1,z+b/2,HVF.dunkel,'matt');   /* Energiekette */
  const sch=new THREE.Group(); sch.position.set((x0+x1)/2,h,z); G.add(sch);
  const Ss=hvSammler();
  Ss.box(0.3,0.16,b+0.12,0,0.05,0,HVF.gelb,'lack');
  Ss.box(0.14,1.1,0.14,0,-0.45,0,HVF.alu,'metall');
  const hub=new THREE.Group(); sch.add(hub);
  const Sh=hvSammler(); Sh.box(0.1,0.9,0.1,0,-0.95,0,HVF.alu,'metall');
  if(greifer==='platte'){ Sh.box(0.62,0.05,0.62,0,-1.42,0,HVF.alu,'metall'); for(let i=0;i<4;i++) Sh.zyl(0.03,0.1,-0.2+i*0.13,-1.48,0,HVF.dunkel,'lack','y',6); }
  else { Sh.box(0.3,0.08,0.12,0,-1.42,0,HVF.dunkel,'lack'); for(const s of [-1,1]) Sh.box(0.03,0.16,0.08,s*0.11,-1.52,0,HVF.alu,'metall'); }
  Ss.fertig(sch); Sh.fertig(hub);
  const L=(x1-x0)/2-0.3, ph=Math.random()*6;
  HALLE.anim.push((dt,t)=>{ if(!HALLE.animAn) return; const u=(t*0.22+ph)%2, w=u<1?u:2-u, e=w*w*(3-2*w);
    sch.position.x=x0+0.3+e*(2*L); hub.position.y=Math.max(0,Math.sin((t*0.22+ph)*Math.PI*2))*0.5; });
  return sch;
}
/* Roboterarm (Palettierer): Sockel, Drehturm, Ober- und Unterarm, Greifer */
function hvRoboterArm(G,x,z,farbe){
  const f=farbe||HVF.gelb, q=hvQ();
  const basis=new THREE.Group(); basis.position.set(x,0,z); G.add(basis);
  const Sb=hvSammler(); Sb.box(0.8,0.5,0.8,0,0.25,0,HVF.dunkel,'lack'); Sb.zyl(0.32,0.25,0,0.62,0,f,'lack','y',q.rund); Sb.fertig(basis);
  const turm=new THREE.Group(); turm.position.y=0.75; basis.add(turm);
  const St=hvSammler(); St.box(0.5,0.45,0.45,0,0.22,0,f,'lack'); St.zyl(0.18,0.55,0,0.5,0,HVF.dunkel,'lack','z',q.rund); St.fertig(turm);
  const ober=new THREE.Group(); ober.position.set(0,0.5,0); turm.add(ober);
  const So=hvSammler(); So.box(0.24,1.3,0.26,0,0.65,0.0,f,'lack'); So.zyl(0.14,0.4,0,1.3,0,HVF.dunkel,'lack','z',q.rund); So.fertig(ober);
  const unter=new THREE.Group(); unter.position.set(0,1.3,0); ober.add(unter);
  const Su=hvSammler(); Su.box(1.2,0.2,0.2,0.6,0,0,f,'lack'); Su.box(0.16,0.3,0.16,1.2,-0.15,0,HVF.dunkel,'lack');
  Su.box(0.5,0.06,0.4,1.2,-0.32,0,HVF.alu,'metall'); for(const s of [-1,1]) Su.box(0.04,0.16,0.4,1.2+s*0.23,-0.42,0,HVF.alu,'metall'); Su.fertig(unter);
  const ph=Math.random()*5;
  HALLE.anim.push((dt,t)=>{ if(!HALLE.animAn) return; const u=t*0.35+ph;
    turm.rotation.y=Math.sin(u)*1.3; ober.rotation.z=-0.35+Math.sin(u*2)*0.18; unter.rotation.z=-0.5-Math.sin(u*2)*0.25; });
  return basis;
}
/* Buehne (zweite Ebene) mit Rost, Gelaender, Treppe am Ostende */
function hvBuehne(S,x0,x1,z,b,y){
  const xm=(x0+x1)/2;
  for(let x=x0+0.1;x<=x1-0.05;x+=Math.max(2,(x1-x0-0.2)/Math.round((x1-x0)/2.6))) for(const s of [-1,1]) S.box(0.14,y,0.14,x,y/2,z+s*(b/2-0.07),HVF.gelb,'lack');
  for(const s of [-1,1]) S.box(x1-x0,0.18,0.1,xm,y-0.09,z+s*(b/2-0.05),HVF.gelb,'lack');
  S.box(x1-x0,0.04,b,xm,y+0.01,z,0xffffff,'rost');
  S.box(x1-x0,0.02,b,xm,y-0.03,z,0x9aa1aa,'metall');
  /* Gelaender */
  for(const s of [-1,1]){ const zz=z+s*(b/2-0.03);
    for(let x=x0+0.05;x<=x1;x+=1.2) S.box(0.04,1.1,0.04,x,y+0.55,zz,HVF.gelb,'lack');
    S.box(x1-x0,0.05,0.05,xm,y+1.1,zz,HVF.gelb,'lack'); S.box(x1-x0,0.04,0.04,xm,y+0.55,zz,HVF.gelb,'lack'); S.box(x1-x0,0.12,0.015,xm,y+0.08,zz,HVF.gelb,'lack'); }
  S.box(0.04,1.1,0.04,x1-0.02,y+0.55,z,HVF.gelb,'lack'); S.box(0.04,0.05,b,x1-0.02,y+1.1,z,HVF.gelb,'lack'); S.box(0.04,0.05,b-1.0,x0+0.02,y+1.1,z-0.5,HVF.gelb,'lack');
  /* Treppe nach Osten hinab, laengs x neben der Buehne */
  /* Treppe am Westende hinab (laengs x, Richtung Westwand) */
  const tz=z+b/2-0.5, n=Math.round(y/0.2), lauf=n*0.26;
  for(let i=0;i<n;i++){ const yy=y-(i+1)*y/n, xx=x0-0.13-i*0.26; S.box(0.28,0.04,0.9,xx,yy+0.02,tz,0xffffff,'rost'); }
  for(const s of [-1,1]) S.strebe(x0,y,tz+s*0.47,x0-lauf,0,tz+s*0.47,0.06,HVF.gelb,'lack');
  for(const s of [-1,1]) S.strebe(x0,y+1.0,tz+s*0.47,x0-lauf,1.0,tz+s*0.47,0.04,HVF.gelb,'lack');
}
/* Kleinladungstraeger-Stapel (blaue Kisten) */
function hvKLT(S,x,z,y,nx,nz,ny){
  for(let i=0;i<nx;i++) for(let j=0;j<nz;j++) for(let k=0;k<ny;k++) S.box(0.58,0.26,0.38,x+i*0.6,y+0.13+k*0.27,z+j*0.4,HVF.klt,'lack');
}
/* Schutzzaun-Feld mit Pfosten (laengs x oder z) */
function hvZaun(S,x0,z0,x1,z1,h){
  const L=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.round(L/1.4)), laengs=Math.abs(x1-x0)>Math.abs(z1-z0);
  for(let i=0;i<=n;i++){ const x=x0+(x1-x0)*i/n, z=z0+(z1-z0)*i/n; S.box(0.05,h,0.05,x,h/2,z,HVF.gelb,'lack'); }
  if(laengs) S.box(L,h-0.15,0.02,(x0+x1)/2,(h+0.15)/2,z0,0xffffff,'zaun'); else S.box(0.02,h-0.15,L,x0,(h+0.15)/2,(z0+z1)/2,0xffffff,'zaun');
}
/* Palettierzelle am Ostende jeder Strasse: Roboter, Palette auf Foerderer
   in Richtung Brandwand, Kartonstau, Schutzzaun */
function hvPalettierzelle(G,S,rollen,zc,zA){
  const x0=-72.4, xe=HV_LINIE.xe;
  hvRollbahn(S,rollen,-71.8,HV7.halle.x0-1.6,zA,0.5);
  hvRoboterArm(G,-69.6,zc+0.35);
  hvZaun(S,x0,zc+1.5,xe,zc+1.5,2.0); hvZaun(S,x0,zA-0.85,-70.6,zA-0.85,2.0);
  S.box(0.6,1.5,0.4,x0+0.4,0.75,zc+1.2,0xb9bfc6,'lack');
  return [{x:-69.0,y:0.5,z:zA}];
}

/* Bewegte Teile auf dem Band (Instanzen, jedes Bild neu gesetzt) */
function hvBandTeile(G,geo,mat,x0,x1,z,y,n,v,ry){
  const mats=[]; for(let i=0;i<n;i++) mats.push(tm(x0+(x1-x0)*i/n,y,z,0,ry||0,0));
  const im=hvInst(geo,mat,mats,G); if(!im) return;
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const m=new THREE.Matrix4(), L=x1-x0;
  HALLE.anim.push((dt,t)=>{ if(!HALLE.animAn) return; for(let i=0;i<n;i++){ const x=x0+((L*i/n+t*v)%L); m.makeTranslation(x,y,z); im.setMatrixAt(i,m); } im.instanceMatrix.needsUpdate=true; });
}

function hvStrasse(k){
  const st=HV7.strassen[k], zc=st.z, gs=HV7.gassen[k], zA=(gs.a0+gs.a1)/2;
  const G=hvBereich('strasse_'+st.id), S=hvSammler(), rollen=[], q=hvQ();
  const xs=HV_LINIE.xs, yb=HV_LINIE.buehne;
  /* obere Ebene: Buehne ueber dem Westteil, mit Zufuehrung */
  hvBuehne(S,xs,xs+9.0,zc,3.0,yb);
  hvKLT(S,xs+0.5,zc-1.1,yb+0.04,3,2,3);
  S.box(1.2,0.9,1.0,xs+3.2,yb+0.5,zc-0.8,HVF.hell,'lack');                      /* Vorratsbehaelter */
  S.trichter(0.55,0.12,1.0,xs+3.2,yb-0.4,zc-0.8,HVF.alu,'metall'); S.zyl(0.1,yb-1.3,xs+3.2,(yb-0.9+2.0)/2,zc-0.8,HVF.alu,'metall','y',8);   /* Trichter durch die Buehne */
  hvGurtband(S,xs+4.2,xs+8.6,zc+0.3,0.5,yb+0.8);
  S.platte(xs+8.6,yb+0.78,xs+10.8,HV_LINIE.band+0.06,zc+0.3,0.5,0.04,HVF.gummi,'matt');   /* Schraegband nach unten */
  for(const sd of [-1,1]) S.platte(xs+8.6,yb+0.74,xs+10.8,HV_LINIE.band+0.02,zc+0.3+sd*0.28,0.04,0.1,HVF.alu,'metall');
  S.box(0.06,yb-0.2,0.06,xs+9.7,(yb-0.2)/2,zc+0.3,HVF.alu,'metall');
  /* Hauptband der Linie */
  hvGurtband(S,st.id==='batterien'?xs+11.4:xs+2.0,-72.6,zc,0.55);
  const items=[];
  if(st.id==='raketen'){
    hvMaschine(S,xs+0.3,xs+3.8,zc,1.5,2.0,{hmi:true});                            /* Huelsenzufuehrung */
    hvMaschine(S,xs+4.4,xs+8.6,zc,1.8,2.2);                                        /* Fuellstation */
    hvPortal(G,S,-87.2,-82.2,zc,2.0,3.4,'zange');                                  /* Stab-Montage */
    /* Magazin mit langen Holzstaeben (wie im Foto) */
    const stab=[]; for(let i=0;i<7;i++) for(let j=0;j<4;j++) stab.push(tm(-86.6+i*0.09,1.95,zc+1.05+j*0.09,0,0,0,0.018,2.1,0.018));
    hvInst(hvGeoZyl(6),HVM.stab||(HVM.stab=hvRes(std(0xd2b07a,{roughness:0.8}))),stab,G);
    S.box(0.8,0.06,0.5,-86.35,0.9,zc+1.18,HVF.alu,'metall'); S.box(0.8,0.06,0.5,-86.35,3.0,zc+1.18,HVF.alu,'metall');
    for(const s of [-1,1]) S.box(0.05,2.2,0.05,-86.35+s*0.4,1.95,zc+1.43,HVF.alu,'metall');
    hvMaschine(S,-81.2,-77.6,zc,1.4,1.9);                                          /* Kappen und Etiketten */
    S.zyl(0.28,0.12,-79.4,2.15,zc+0.9,0xf4f2ec,'matt','z',q.rund);
    hvMaschine(S,-77.0,-73.0,zc,1.8,2.1);                                          /* Kartonierer */
    for(let i=0;i<10;i++) S.box(0.9,0.012,0.6,-75.0,0.9+i*0.013,zc-1.25,HVF.pappe,'matt');
    items.push({geo:hvRes(new THREE.BoxGeometry(0.5,0.12,0.16)),farbe:0xc23a2c,y:HV_LINIE.band+0.06,x0:xs+8.8,x1:-81.4,n:14,v:0.3});
    items.push({geo:hvRes(new THREE.BoxGeometry(0.4,0.3,0.3)),farbe:HVF.pappe,y:HV_LINIE.band+0.15,x0:-72.9-0.01,x1:-72.6,n:1,v:0});
  } else if(st.id==='kugeln'){
    /* Halbschalen-Zufuehrung: zwei Wendelfoerderer */
    for(const dz of [-0.5,0.5]){ S.zyl(0.45,0.35,xs+1.4,1.25,zc+dz,0xb8bec6,'metall','y',q.rund); S.zyl(0.18,1.0,xs+1.4,0.5,zc+dz,HVF.weiss,'lack','y',q.rund); }
    /* Rundtakttisch mit Nestern, dreht sich */
    hvMaschine(S,xs+3.0,xs+8.6,zc,2.2,2.3,{offen:false});
    const tisch=new THREE.Group(); tisch.position.set(xs+5.2,0.95,zc); G.add(tisch);
    const St=hvSammler(); St.zyl(0.95,0.06,0,0,0,HVF.alu,'metall','y',24);
    for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; St.geo(hvHalbkugel(),tm(Math.cos(a)*0.72,0.03,Math.sin(a)*0.72,0,0,0,0.14,0.14,0.14),0xe8e2d2,'matt',true); }
    St.fertig(tisch);
    HALLE.anim.push((dt)=>{ if(HALLE.animAn) tisch.rotation.y+=dt*0.4; });
    hvMaschine(S,-87.6,-84.4,zc,1.6,2.6);                                          /* Verschliessen / Presse */
    /* Kaschiertrommel (dreht sich) */
    const tr=new THREE.Group(); tr.position.set(-82.0,1.45,zc); G.add(tr);
    const Sr=hvSammler(); Sr.zyl(0.6,1.7,0,0,0,0xd9c9a4,'matt','z',q.rund*2); for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; Sr.box(0.04,0.04,1.72,Math.cos(a)*0.61,Math.sin(a)*0.61,0,0x8a7a56,'matt'); } Sr.fertig(tr);
    for(const s of [-1,1]){ S.box(0.12,1.5,0.12,-82.0,0.75,zc+s*1.0,HVF.weiss,'lack'); }
    S.box(1.6,0.6,2.2,-82.0,0.3,zc,HVF.weiss,'lack');
    HALLE.anim.push((dt)=>{ if(HALLE.animAn) tr.rotation.z-=dt*0.9; });
    /* Trocknungsturm mit Kugeln (Umlaufregal) */
    const tx=-78.0; for(const dx of [-0.7,0.7]) for(const dz of [-0.6,0.6]) S.box(0.06,3.6,0.06,tx+dx,1.8,zc+1.1+dz,HVF.alu,'metall');
    const kug=[]; for(let l=0;l<6;l++){ S.box(1.4,0.03,1.2,tx,0.6+l*0.55,zc+1.1,0xb8bec6,'metall'); for(let i=0;i<4;i++) for(let j=0;j<3;j++) kug.push(tm(tx-0.5+i*0.33,0.73+l*0.55,zc+0.75+j*0.35,0,0,0,0.12,0.12,0.12)); }
    hvInst(hvRes(new THREE.SphereGeometry(1,q.fein?12:8,q.fein?8:6)),HVM.kugel||(HVM.kugel=hvRes(std(0xe4d9c0,{roughness:0.85}))),kug,G);
    hvMaschine(S,-76.2,-73.0,zc,1.6,1.9);                                          /* Kartonierer */
    items.push({geo:hvRes(new THREE.SphereGeometry(0.11,q.fein?12:8,8)),farbe:0xe4d9c0,y:HV_LINIE.band+0.11,x0:-84.2,x1:-76.4,n:10,v:0.25});
  } else {
    /* Batterien: Rohrlager, Rohr-Raster unter dem Portal, Fuellen, Verkleben, Banderole */
    for(let i=0;i<3;i++){ const px=xs+0.9+i*1.1;
      const rr=[]; for(let a=0;a<4;a++) for(let b2=0;b2<6;b2++) rr.push(tm(px,0.25+a*0.12,zc-0.9+b2*0.12,0,0,Math.PI/2,0.05,0.9,0.05));
      hvInst(hvGeoZyl(10),HVM.rohr||(HVM.rohr=hvRes(std(0x2b2d31,{roughness:0.75}))),rr,G); }
    hvRollbahn(S,rollen,xs+4.2,xs+11.4,zc,0.85,0.95);
    hvPortal(G,S,xs+5.0,xs+10.6,zc,1.6,3.0,'platte');
    /* Rohr-Raster: Platten mit 6 x 6 stehenden Rohren (Foto) */
    const rohr=[], innen=[];
    for(let p=0;p<4;p++){ const cx=xs+5.0+p*1.45;
      S.box(0.82,0.05,0.82,cx,0.9,zc,0x8a9099,'metall');
      for(let i=0;i<6;i++) for(let j=0;j<6;j++){ const x=cx-0.33+i*0.132, z=zc-0.33+j*0.132, h=p===3?0.0:0.5;
        if(p===3) continue;
        rohr.push(tm(x,0.92+h/2,z,0,0,0,0.055,h,0.055)); innen.push(tm(x,0.92+h+0.002,z,0,0,0,0.045,0.004,0.045)); } }
    hvInst(hvGeoZyl(q.fein?12:8),HVM.rohr||(HVM.rohr=hvRes(std(0x2b2d31,{roughness:0.75}))),rohr,G);
    hvInst(hvGeoZyl(q.fein?12:8),HVM.pappeInnen||(HVM.pappeInnen=hvRes(std(0xcbb491,{roughness:0.9}))),innen,G,null,false);
    hvMaschine(S,-85.6,-81.4,zc,1.8,2.4);                                          /* Fuellen (Effektsaetze) */
    hvMaschine(S,-80.8,-77.4,zc,1.5,2.0);                                          /* Zuendschnur, Verkleben */
    /* Banderole: Ringrahmen */
    S.zyl(0.75,0.12,-75.6,1.35,zc,HVF.weiss,'lack','x',q.rund*2); S.box(0.3,0.6,1.7,-75.6,0.3,zc,HVF.weiss,'lack');
    hvMaschine(S,-74.8,-73.0,zc,1.4,1.8,{hmi:false});
    items.push({geo:hvRes(new THREE.BoxGeometry(0.36,0.26,0.36)),farbe:0x3a3d44,y:HV_LINIE.band+0.13,x0:-81.2,x1:-73.2,n:9,v:0.22});
  }
  /* Schaltschraenke am Gang */
  for(let i=0;i<3;i++) S.box(0.8,2.0,0.4,xs+12.5+i*0.82,1.0,zc+1.72,0xc9ced5,'lack');
  hvCol(xs+12.1,xs+14.9,zc+1.5,zc+1.95);
  hvCol(xs-0.1,-72.4,zc-1.5,zc+1.5); hvCol(-72.4,HV7.halle.x0-0.24,zA-0.9,zc+1.5);
  hvCol(xs-3.4,xs,zc+0.0,zc+1.5);
  const pal=hvPalettierzelle(G,S,rollen,zc,zA);
  S.fertig(G);
  hvInst(hvGeoZyl(q.rund),hvRolleMat(),rollen,G);
  hvPalettenInst(G,pal.map((p,i)=>Object.assign(p,{v:(k+i)%4})),false);
  for(const it of items){ if(it.n>1) hvBandTeile(G,it.geo,hvRes(std(it.farbe,{roughness:0.7})),it.x0,it.x1,zc,it.y,it.n,it.v); }
  hvSchild(G,'STRASSE '+(k+1)+' · '+st.name,k===0?'Hülse · Füllen · Stab · Kappe · Karton':k===1?'Halbschale · Füllen · Kaschieren · Trocknen':'Rohr-Raster · Füllen · Zündschnur · Banderole',3.2,0.62,xs+0.05,yb+1.9,zc,Math.PI/2);
}
let _hvHalb=null;
function hvHalbkugel(){ return _hvHalb||(_hvHalb=new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2)); }
