/* =========================================================
   Grosse Halle: Gebaeude - Huelle, Dach, Licht, Boden, Lager 1-3,
   gelbe Wand mit N1, Schleuse, Tore, Produktionsfluegel.
   ========================================================= */
const HV_FARBE={stahl:0xd9dde2, stahlD:0x8a9099, gelb:0xf2b81c, orange:0xe36b1f, blau:0x2f5d9a, schwarz:0x1d1f24, gruen:0x2f9e57, rot:0xc8322a, weiss:0xf2f4f6, alu:0xc5cad1, holz:0xc49a62};

/* Halle: Waende, Dach mit Bindern und Lichtbaendern, Stuetzen, Hallenleuchten */
function hvGebaeude(o){
  const G=hvBereich('gebaeude'), S=hvSammler(), A=HV7.halle, H=HV7.H, K=HV7.kl3;
  /* Nordwand (z -34) mit den Toren R2-R4 */
  const tore=HV7.tore.map(t=>({a:t.x-WTOR.w/2,b:t.x+WTOR.w/2,h:WTOR.h+0.05,zu:true}));
  hvWandMitOeffnungen(S,true,A.z0-0.12,A.x0-0.24,A.x1+0.24,tore,H);
  /* Westwand zur Produktion: Brandwand mit drei Foerderoeffnungen (Westende der
     Gassen) und zwei Durchgaengen */
  const west=HV7.gassen.map(g=>({a:g.a0-0.1,b:g.a1+0.1,h:2.0,zu:true})).concat(HV7.pTueren.map(t=>({a:t.z0,b:t.z1,h:3.3})));
  hvWandMitOeffnungen(S,false,A.x0-0.12,A.z0,A.z1+0.24,west,H);
  /* Suedwand bis zur gelben Wand */
  hvHallenWand(S,true,A.z1+0.12,A.x0-0.24,K.x0,0,H);
  /* Ostwand zur Schleuse, mit Durchgang */
  hvWandMitOeffnungen(S,false,A.x1+0.12,A.z0-0.24,K.z0,[{a:HV7.sDurch.z0,b:HV7.sDurch.z1,h:3.0}],H);
  /* gelbe Wand zur Halle: unten gelb (5 m), darueber Paneel; Tor N1 */
  const N=HV7.n1;
  for(const [laengs,fest,a,b,oe] of [[false,K.x0-0.12,K.z0-0.12,K.z1+0.24,[{a:N.z0,b:N.z1,h:N.h}]],[true,K.z0-0.12,K.x0-0.24,A.x1+0.24,[]]]){
    let x=a; const L=oe.slice();
    const st=(p,q,y0)=>{ if(q-p<0.01) return; const t=0.24;
      const mk=(ya,yb,m)=>laengs?hvWand(S,p,q,fest-t/2,fest+t/2,ya,yb,m):hvWand(S,fest-t/2,fest+t/2,p,q,ya,yb,m);
      mk(y0,5.0,'gelb'); mk(5.0,H,'paneel'); };
    for(const q of L){ st(x,q.a,0); if(laengs) hvCol(x,q.a,fest-0.12,fest+0.12); else hvCol(fest-0.12,fest+0.12,x,q.a); st(q.a,q.b,q.h); x=q.b; }
    st(x,b,0); if(laengs) hvCol(x,b,fest-0.12,fest+0.12); else hvCol(fest-0.12,fest+0.12,x,b);
  }
  /* Decke (Trapezblech) ueber der ganzen Halle; Kartonlager 3 hat darunter eine eigene */
  hvWand(S,A.x0-0.24,A.x1+0.24,A.z0-0.24,A.z1+0.24,H,H+0.2,'decke');
  /* Lichtbaender im Dach: drei Streifen, Tageslicht */
  for(const z of [-30.8,-21.0,-11.2]){ const x1=z>-17?K.x0-0.6:A.x1-1.5;
    S.box(x1-(A.x0+1.5),0.02,1.4,(A.x0+1.5+x1)/2,H-0.02,z,0xffffff,'lichtband');
    S.box(x1-(A.x0+1.5)+0.16,0.1,0.08,(A.x0+1.5+x1)/2,H-0.06,z-0.74,HV_FARBE.stahlD,'metall');
    S.box(x1-(A.x0+1.5)+0.16,0.1,0.08,(A.x0+1.5+x1)/2,H-0.06,z+0.74,HV_FARBE.stahlD,'metall'); }
  /* Fachwerkbinder quer zur Halle, alle 5 m */
  const yu=H-0.68, yo=H-0.08;
  for(let x=A.x0+5;x<A.x1-1;x+=5){
    if(Math.abs(x-K.x0)<0.3) continue;
    const z1=x>K.x0?K.z0-0.15:A.z1, z0=A.z0;
    S.box(0.16,0.16,z1-z0,x,yu,(z0+z1)/2,HV_FARBE.stahl,'lack');
    S.box(0.16,0.12,z1-z0,x,yo-0.04,(z0+z1)/2,HV_FARBE.stahl,'lack');
    const n=Math.round((z1-z0)/1.5);
    for(let i=0;i<=n;i++){ const z=z0+i*(z1-z0)/n; S.box(0.08,yo-yu,0.08,x,(yu+yo)/2,z,HV_FARBE.stahl,'lack');
      if(i<n) S.strebe(x,yu,z,x,yo,z+(z1-z0)/n,0.07,HV_FARBE.stahl,'lack'); }
    /* Stuetzen an den Laengswaenden */
    for(const zs of [A.z0+0.2,z1===A.z1?A.z1-0.2:null]){ if(zs===null) continue; if(zs<-20&&HV7.tore.some(t=>Math.abs(t.x-x)<2.2)) continue;
      S.box(0.3,yu,0.02,x,yu/2,zs+(zs<-20?0.14:-0.14),HV_FARBE.stahl,'lack');
      S.box(0.3,yu,0.02,x,yu/2,zs+(zs<-20?-0.14:0.14),HV_FARBE.stahl,'lack');
      S.box(0.02,yu,0.28,x,yu/2,zs,HV_FARBE.stahl,'lack');
      S.box(0.5,0.05,0.5,x,0.025,zs,HV_FARBE.stahlD,'lack');
      /* Anfahrschutz gelb */
      S.box(0.36,0.6,0.08,x,0.3,zs+(zs<-20?0.32:-0.32),HV_FARBE.gelb,'lack'); }
  }
  /* Sprinklerleitungen unter dem Dach (rot) */
  for(const z of [-26.0,-16.4]) S.zyl(0.06,A.x1-A.x0-1,(A.x0+A.x1)/2-(z>-17?5:0),H-0.95,z,HV_FARBE.rot,'lack','x',8);
  /* Hallenleuchten: LED-Hallenstrahler (rund) unter den Bindern */
  const q=hvQ();
  for(let x=A.x0+2.5;x<A.x1;x+=5){
    const zs=x<HV7.hr.x1+0.5?[-31.2,-23.47,-18.8,-11.5]:[-31.2,-26.0,-21.0,-15.5,-10.6];
    for(const z of zs){
      if(x>K.x0-0.3&&z>K.z0-0.3) continue;
      const y=yu-0.55;
      S.zyl(0.32,0.16,x,y+0.1,z,0x3a3f48,'lack','y',q.rund);
      S.zyl(0.26,0.02,x,y+0.01,z,0xffffff,'leucht','y',q.rund);
      S.zyl(0.012,0.55,x,y+0.45,z,0x2a2d33,'metall','y',4);
      hvLampe(x,y,z);
    }
  }
  S.fertig(G);
  /* Hallenschilder innen */
  hvSchild(G,'GROSSE HALLE','Reserve · Wareneingang · Anbruch',3.6,0.9,A.x1-0.14,5.2,(HV7.sDurch.z0+HV7.sDurch.z1)/2,-Math.PI/2);
}

/* Boden: geschliffener Beton mit eingebranntem Schatten (aoMap) und
   Lichtkegeln der Leuchten (lightMap), darueber die Markierungen. */
function hvBodenPlatte(parent,r,matBasis,schatten,licht,y){
  const w=r.x1-r.x0, d=r.z1-r.z0;
  const geo=hvRes(new THREE.PlaneGeometry(w,d)); geo.setAttribute('uv2',geo.attributes.uv);
  const t=hvRes(matBasis.map.clone()); t.needsUpdate=true; t.repeat.set(w/4,d/4);
  const m=hvRes(matBasis.clone()); m.map=t;
  if(schatten){ m.aoMap=schatten; m.aoMapIntensity=1; }
  if(licht){ m.lightMap=licht; m.lightMapIntensity=0.4; }
  const o=new THREE.Mesh(geo,m); o.rotation.x=-Math.PI/2; o.position.set((r.x0+r.x1)/2,y||0.01,(r.z0+r.z1)/2);
  o.matrixAutoUpdate=false; o.updateMatrix(); if(HIQ) o.receiveShadow=true; parent.add(o); return o;
}
/* Schatten-/Lichtkarte in Weltkoordinaten: px Pixel je Meter */
function hvKarte(r,px,malen){
  const W=Math.round((r.x1-r.x0)*px), H=Math.round((r.z1-r.z0)*px);
  const t=hvRes(tex(W,H,(g)=>{ malen(g,(x)=>(x-r.x0)*px,(z)=>(r.z1-z)*px,px); },false));
  t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping; return t;
}
/* weiches Rechteck: mehrfach aufgeweitet mit wenig Deckkraft */
function hvWeich(g,X,Z,px,x0,x1,z0,z1,dunkel,rad){
  const R=Math.max(1,Math.round((rad||0.5)*px));
  for(let i=R;i>=0;i-=Math.max(1,R/6|0)){ g.fillStyle=`rgba(0,0,0,${dunkel/(R/Math.max(1,R/6|0)+1)})`;
    g.fillRect(X(x0)-i,Z(z1)-i,(x1-x0)*px+2*i,(z1-z0)*px+2*i); }
}
function hvAoMalen(g,X,Z,px,r,blocks){
  g.fillStyle='#fff'; g.fillRect(0,0,g.canvas.width,g.canvas.height);
  /* Waende: Rand dunkler */
  const W=g.canvas.width, H=g.canvas.height, d=Math.round(0.7*px);
  for(const [x,y,w,h,gx,gy] of [[0,0,W,d,0,1],[0,H-d,W,d,0,-1],[0,0,d,H,1,0],[W-d,0,d,H,-1,0]]){
    const gr=gx?g.createLinearGradient(gx>0?0:W,0,gx>0?d:W-d,0):g.createLinearGradient(0,gy>0?0:H,0,gy>0?d:H-d);
    gr.addColorStop(0,'rgba(0,0,0,.42)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,w,h); }
  for(const b of blocks) hvWeich(g,X,Z,px,b[0],b[1],b[2],b[3],b[4]||0.5,b[5]||0.45);
}
function hvLichtMalen(g,X,Z,px,lampen,rad,staerke){
  g.fillStyle='#000'; g.fillRect(0,0,g.canvas.width,g.canvas.height);
  g.globalCompositeOperation='lighter';
  for(const L of lampen){ const gr=g.createRadialGradient(X(L.x),Z(L.z),0,X(L.x),Z(L.z),rad*px);
    gr.addColorStop(0,`rgba(255,246,232,${staerke})`); gr.addColorStop(0.5,`rgba(255,246,232,${staerke*0.45})`); gr.addColorStop(1,'rgba(255,246,232,0)');
    g.fillStyle=gr; g.fillRect(X(L.x)-rad*px,Z(L.z)-rad*px,rad*px*2,rad*px*2); }
  g.globalCompositeOperation='source-over';
}
/* Was auf dem Boden steht und ihn verschattet (x0,x1,z0,z1,dunkel,rand) */
function hvSchattenBloecke(){
  const B=[];
  for(const gs of HV7.gassen){ B.push([HV7.hr.x0,HV7.hr.x1,gs.a0,gs.a1,0.55,0.35]); B.push([HV7.hr.x0,HV7.hr.x1,gs.b0,gs.b1,0.55,0.35]);
    B.push([HV7.io.x0,HV7.io.x1,gs.a0+0.1,gs.a1-0.1,0.35,0.25]); B.push([HV7.io.x0,HV7.io.x1,gs.b0+0.1,gs.b1-0.1,0.35,0.25]); }
  for(const s of HV7.strassen) B.push([-97.5,-66.6,s.z-1.0,s.z+1.0,0.38,0.5]);
  for(const b of HV7.bunker) B.push([b.x0,b.x1,HV7.halle.z0,-29.0,0.6,0.4]);
  return B;
}
function hvBoden(o){
  const G=hvBereich('boden'), A=HV7.halle, P=HV7.prod, K=HV7.kl3;
  const px=hvQ().fein?8:4;
  const lampen=HALLE.lampen.slice();
  const bl=hvSchattenBloecke();
  /* Halle (ohne Kartonlager-Ecke - das ist ein eigener Boden) */
  const rH={x0:A.x0,x1:A.x1,z0:A.z0,z1:A.z1};
  const aoH=hvKarte(rH,px,(g,X,Z,p)=>{ hvAoMalen(g,X,Z,p,rH,bl); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(X(K.x0),Z(K.z1),(K.x1-K.x0)*p,(K.z1-K.z0)*p); });
  const liH=hvKarte(rH,Math.max(2,px/2),(g,X,Z,p)=>hvLichtMalen(g,X,Z,p,lampen.filter(l=>l.x>A.x0&&l.x<A.x1),5.2,0.55));
  hvBodenPlatte(G,rH,HVM.boden,aoH,liH,0.01);
  /* Produktion */
  const rP={x0:P.x0,x1:P.x1,z0:P.z0,z1:P.z1};
  HVM.bodenProd=HVM.bodenProd||hvRes(HVM.boden.clone()); HVM.bodenProd.color=LIN(0xc4cfc8);
  const aoP=hvKarte(rP,px,(g,X,Z,p)=>hvAoMalen(g,X,Z,p,rP,bl));
  HALLE.bodenProdAo=aoP;
  hvBodenPlatte(G,rP,HVM.bodenProd,aoP,null,0.012);
  /* Kartonlager 3 und (im eigenstaendigen Modus) Lager 1/2 */
  const rK={x0:K.x0,x1:K.x1,z0:K.z0,z1:K.z1};
  hvBodenPlatte(G,rK,HVM.boden,null,null,0.014);
  hvBodenPlatte(G,{x0:HV7.schleuse.x0,x1:HV7.schleuse.x1,z0:HV7.schleuse.z0,z1:HV7.schleuse.z1},HVM.boden,null,null,0.013);
  if(o.umfeld){
    const L=LAY.lsued, N=LAY.lnord;
    hvBodenPlatte(G,{x0:L.x0,x1:L.x1,z0:L.z0,z1:N.z1},HVM.boden,null,null,0.012);
    /* draussen: Asphalt, LKW-Hof */
    const am=hvRes(std(0x6d7178,{roughness:0.95}));
    const au=new THREE.Mesh(hvRes(new THREE.PlaneGeometry(260,180)),am); au.rotation.x=-Math.PI/2; au.position.set(-50,-0.02,-20); G.add(au);
    const hm=hvRes(std(0x9a9ea4,{roughness:0.92}));
    const hof=new THREE.Mesh(hvRes(new THREE.PlaneGeometry(P.x0*-1+LAY.hof2.x1-0,28)),hm); hof.rotation.x=-Math.PI/2;
    hof.position.set((P.x0+LAY.hof2.x1)/2,-0.01,LHALLE.z-14.2); G.add(hof);
  }
  hvMarkierungen(G,o);
}
/* Bodenmarkierungen: alles flach, ein Mesh je Material. Beschriftung aus
   einem Atlas (ein Zeichenaufruf). */
const HV_PLANE=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
function hvMarkierungen(G,o){
  const S=hvSammler(), Y=0.02, gelb=0xf2c230, weiss=0xeef0f2, gruen=0x3a9a5a, schwarz=0x1d1f24;
  const fl=(x0,x1,z0,z1,c,y)=>S.geo(HV_PLANE,tm((x0+x1)/2,y||Y,(z0+z1)/2,0,0,0,x1-x0,1,z1-z0),c,'lack',true);
  const linie=(x0,z0,x1,z1,b,c)=>{ if(Math.abs(x1-x0)>Math.abs(z1-z0)) fl(Math.min(x0,x1),Math.max(x0,x1),z0-b/2,z0+b/2,c); else fl(x0-b/2,x0+b/2,Math.min(z0,z1),Math.max(z0,z1),c); };
  const rahmen=(x0,x1,z0,z1,b,c)=>{ linie(x0,z0,x1,z0,b,c); linie(x0,z1,x1,z1,b,c); linie(x0,z0,x0,z1,b,c); linie(x1,z0,x1,z1,b,c); };
  const gestrichelt=(x0,z0,x1,z1,b,c,l,lu)=>{ const L=Math.hypot(x1-x0,z1-z0), n=Math.floor(L/(l+lu));
    for(let i=0;i<n;i++){ const a=i*(l+lu)/L, e=(i*(l+lu)+l)/L; linie(x0+(x1-x0)*a,z0+(z1-z0)*a,x0+(x1-x0)*e,z0+(z1-z0)*e,b,c); } };
  /* Schraffur schwarz-gelb: Flaeche mit Streifentextur, UV in Metern */
  const schraffur=(x0,x1,z0,z1)=>{ const g=new THREE.PlaneGeometry(x1-x0,z1-z0).rotateX(-Math.PI/2), uv=g.attributes.uv;
    for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*(x1-x0)/0.6,uv.getY(i)*(z1-z0)/0.6);
    S.geo(g,tm((x0+x1)/2,Y+0.001,(z0+z1)/2),0xffffff,'schraffur'); };
  const A=HV7.halle, K=HV7.kl3;
  /* Wareneingang: Zone gestrichelt, je Tor zwei Spalten mit drei Stellplaetzen */
  const W=HV7.we;
  gestrichelt(W.x0,W.z1,W.x1,W.z1,0.12,gelb,0.6,0.3); gestrichelt(W.x0,W.z0+0.1,W.x0,W.z1,0.12,gelb,0.6,0.3);
  for(const t of HV7.tore){
    schraffur(t.x-WTOR.w/2,t.x+WTOR.w/2,A.z0+0.05,A.z0+0.75);
    for(const dx of [-0.75,0.75]) for(let r=0;r<3;r++){ const cx=t.x+dx, cz=W.z0+1.6+r*1.45; rahmen(cx-0.5,cx+0.5,cz-0.68,cz+0.68,0.06,weiss); }
  }
  /* Ueberladebruecken vor den Toren gehoeren zum Tor (hvToreBauen) */
  /* Hauptfahrweg: von der Schleuse nach Westen zwischen Wareneingang und Hochregal */
  linie(A.x1-0.3,-28.3,A.x0+0.3,-28.3,0.12,gelb);
  linie(HV7.anbruch.x1+0.6,-28.3,HV7.anbruch.x1+0.6,-14.0,0.12,gelb);
  linie(A.x0+0.3,-13.6,K.x0-0.3,-13.6,0.12,gelb);
  /* Anbruch: gruene Zone */
  const AB=HV7.anbruch; rahmen(AB.x0+0.15,AB.x1-0.15,AB.z0+0.15,AB.z1-0.15,0.1,gruen);
  for(const gs of HV7.gassen){ rahmen(AB.x0+0.5,AB.x0+1.9,gs.mitte-0.75,gs.mitte+0.75,0.05,weiss); }
  /* Gassen-Zugang gesperrt: Schraffur vor den Schutzzaeunen */
  for(const gs of HV7.gassen) schraffur(HV7.io.x1+0.1,HV7.io.x1+0.5,gs.a1+0.05,gs.b0-0.05);
  /* Packmaterial */
  const PM=HV7.pack; gestrichelt(PM.x0,PM.z0,PM.x1,PM.z0,0.1,gelb,0.5,0.25); gestrichelt(PM.x0,PM.z1,PM.x1,PM.z1,0.1,gelb,0.5,0.25);
  gestrichelt(PM.x0,PM.z0,PM.x0,PM.z1,0.1,gelb,0.5,0.25); gestrichelt(PM.x1,PM.z0,PM.x1,PM.z1,0.1,gelb,0.5,0.25);
  /* Schnellplaetze: 13 Rahmen an der Wand */
  const SN=HV7.schnell;
  for(let i=0;i<SN.n;i++){ const cx=SN.x0+0.6+i*SN.dx; rahmen(cx-0.6,cx+0.6,SN.z0,SN.z1,0.06,weiss); }
  /* N1: Schraffur beidseits der Oeffnung, Durchfahrt markiert */
  const N=HV7.n1; schraffur(N.x-1.1,N.x-0.15,N.z0-0.6,N.z0); schraffur(N.x-1.1,N.x-0.15,N.z1,N.z1+0.6);
  linie(N.x-4,(N.z0+N.z1)/2,K.x0+12,(N.z0+N.z1)/2,0.1,gelb);
  /* Durchgang zur Schleuse */
  schraffur(A.x1-0.9,A.x1-0.15,HV7.sDurch.z0-0.5,HV7.sDurch.z0); schraffur(A.x1-0.9,A.x1-0.15,HV7.sDurch.z1,HV7.sDurch.z1+0.5);
  /* Produktion: gruene Fusswege zwischen den Strassen, weisse Kanten */
  const P=HV7.prod;
  for(const z of [-28.2,-23.47,-18.8,-13.6]){ fl(P.x0+1,P.x1-0.4,z-0.6,z+0.6,gruen,Y-0.001); linie(P.x0+1,z-0.62,P.x1-0.4,z-0.62,0.06,weiss); linie(P.x0+1,z+0.62,P.x1-0.4,z+0.62,0.06,weiss); }
  for(const t of HV7.ptore) schraffur(t.x-WTOR.w/2,t.x+WTOR.w/2,P.z0+0.05,P.z0+0.75);
  for(const b of HV7.bunker) schraffur(b.x0,b.x1,-29.0,-28.35);
  /* Kartonlager 3: gelbe Zonengrenze zu Lager 2 (keine Wand) */
  gestrichelt(K.x1-0.05,K.z0+0.2,K.x1-0.05,K.z1-0.2,0.12,gelb,0.7,0.35);
  if(o.umfeld){
    /* Versandecke (Hauptspiel) als Flaeche markiert */
    const L=LAY.lsued; rahmen(L.x0+0.3,L.x1-0.3,L.z0+0.3,-22.6,0.1,0xe0782e);
    gestrichelt(L.x0+0.2,-5.9,L.x1-0.2,-5.9,0.1,gelb,0.7,0.35);
  }
  S.fertig(G,false);
  hvBodenSchrift(G,o);
}
/* Bodenschrift aus einem Atlas */
function hvBodenSchrift(G,o){
  const T=[['WARENEINGANG',(HV7.we.x0+HV7.we.x1)/2-3,-29.6,0,4.2],['ANBRUCH',(HV7.anbruch.x0+HV7.anbruch.x1)/2,-21.0,Math.PI/2,3.0],
    ['PACKMATERIAL',(HV7.pack.x0+HV7.pack.x1)/2,-22.6,0,3.0],['SCHNELLPLÄTZE',-56,-10.4,0,3.4],['N1',HV7.n1.x-1.5,-12.0,Math.PI/2,0.9],
    ['KARTONLAGER ③',-30.5,-12.0,0,3.2],['GASSE 1',-47.0,HV7.gassen[0].mitte,Math.PI/2,1.4],['GASSE 2',-47.0,HV7.gassen[1].mitte,Math.PI/2,1.4],['GASSE 3',-47.0,HV7.gassen[2].mitte,Math.PI/2,1.4],
    ['SCHLEUSE',-23.0,-24.0,Math.PI/2,2.4],['RAKETEN',-90,-28.2,0,2.0],['KUGELBOMBEN',-90,-23.47,0,2.6],['BATTERIEN',-90,-18.8,0,2.2],['FERTIGWARE R5',-74,-31.2,0,3.0],['ROHSTOFFE R6',-92.4,-27.4,0,2.6]];
  if(o.umfeld) T.push(['VERSANDECKE V1',-14,-26.2,0,3.2],['② LAGER SÜD',-14,-15.0,0,2.8],['① BACKSTOCK',-14,-1.0,0,2.8]);
  const cw=512, ch=96, n=T.length, rows=Math.ceil(n/2);
  const t=hvRes(tex(cw*2,ch*rows,(g,W,H)=>{ g.clearRect(0,0,W,H); g.textAlign='center'; g.textBaseline='middle';
    T.forEach((e,i)=>{ const x=(i%2)*cw, y=Math.floor(i/2)*ch; g.fillStyle='rgba(242,194,48,.92)'; fitFont(g,e[0],cw*0.92,ch*0.78,BUN); g.fillText(e[0],x+cw/2,y+ch/2+3); }); }));
  const parts=[];
  T.forEach((e,i)=>{ const g=new THREE.PlaneGeometry(e[4],e[4]*ch/cw).rotateX(-Math.PI/2), uv=g.attributes.uv;
    const u0=(i%2)/2, v0=1-(Math.floor(i/2)+1)/rows;
    for(let k=0;k<uv.count;k++) uv.setXY(k,u0+uv.getX(k)/2,v0+uv.getY(k)/rows);
    parts.push({geo:g,m:tm(e[1],0.024,e[2],0,e[3],0),color:0xffffff}); });
  const m=new THREE.Mesh(hvRes(merge(parts)),hvRes(new THREE.MeshStandardMaterial({map:t,transparent:true,depthWrite:false,roughness:0.6})));
  m.renderOrder=2; m.matrixAutoUpdate=false; G.add(m);
  parts.forEach(p=>p.geo.dispose());
}

/* Kartonlager 3, Schleuse und (eigenstaendig) Lager 1/2 */
function hvLagerBauen(o){
  const G=hvBereich('lager'), S=hvSammler(), K=HV7.kl3, SL=HV7.schleuse, LH=LAGER_H;
  /* Kartonlager 3: Aussenwand Sued (zum Hof 1), Decke 5 m, Wand zur Schleuse */
  hvHallenWand(S,true,K.z1+0.12,K.x0-0.24,K.x1+0.24,0,LH);
  hvWand(S,K.x0,K.x1,K.z0,K.z1,LH,LH+0.2,'decke');
  hvHallenWand(S,true,K.z0-0.12,SL.x0+0.24,SL.x1+0.12,0,LH);
  /* Schleuse: 13 m lang, 3,4 m hoch, zur Halle mit Streifenvorhang, zu Lager 2 offen */
  const SH=SCHLEUSE_H;
  hvHallenWand(S,true,SL.z0-0.12,SL.x0+0.24,SL.x1+0.24,0,LH);
  hvWand(S,SL.x0,SL.x1,SL.z0,SL.z1,SH,SH+0.15,'decke');
  hvWandMitOeffnungen(S,false,SL.x1+0.12,SL.z0,SL.z1,[{a:HV7.sOffen.z0,b:HV7.sOffen.z1,h:3.0}],SH);
  hvHallenWand(S,false,SL.x1+0.12,SL.z0,SL.z1,SH,LH,null,true);
  /* Streifenvorhang im Durchgang zur Halle */
  for(let z=HV7.sDurch.z0+0.1;z<HV7.sDurch.z1-0.05;z+=0.2) S.box(0.006,2.9,0.19,SL.x0+0.02,1.55,z+0.1,0xcfe0e8,'plexi');
  S.box(0.12,0.08,HV7.sDurch.z1-HV7.sDurch.z0,SL.x0+0.02,2.98,(HV7.sDurch.z0+HV7.sDurch.z1)/2,HV_FARBE.stahlD,'metall');
  /* Leuchten Schleuse und Kartonlager */
  const lb=(x,y,z,ry)=>{ S.box(ry?0.22:1.4,0.06,ry?1.4:0.22,x,y-0.03,z,0xdfe3e9,'lack'); S.box(ry?0.16:1.3,0.01,ry?1.3:0.16,x,y-0.065,z,0xffffff,'leucht'); hvLampe(x,y,z); };
  for(let z=SL.z0+2;z<SL.z1;z+=3.2) lb((SL.x0+SL.x1)/2,SH,z,true);
  for(let x=K.x0+2;x<K.x1;x+=3.4) for(const z of [-15.0,-9.2]) lb(x,LH,z,false);
  /* Regale im Kartonlager 3 (frei einrichtbar): Querreihen nord und sued des
     Mittelgangs von N1 */
  const regale=[];
  for(let x=K.x0+1.2;x<K.x1-1.6;x+=3.3){ regale.push({x,z0:-16.6,z1:-13.9}); regale.push({x,z0:-10.1,z1:-7.4}); }
  if(o.umfeld){
    const L=LAY.lsued;
    hvHallenWand(S,false,L.x1+0.12,L.z0-0.24,LAY.lnord.z1+0.24,0,LH);
    hvWandMitOeffnungen(S,true,L.z0-0.12,L.x0,L.x1+0.24,[{a:V1.x-V1.w/2,b:V1.x+V1.w/2,h:V1.h,zu:true}],LH);
    hvHallenWand(S,true,LAY.lnord.z1+0.12,L.x0-0.24,L.x1+0.24,0,LH);
    hvWandMitOeffnungen(S,false,L.x0-0.12,LAY.lbasis.z0+0.4,LAY.lnord.z1+0.24,[{a:-3.6,b:-0.4,h:3.0,zu:true}],LH);
    hvHallenWand(S,false,L.x0-0.12,K.z1,LAY.lbasis.z0+0.4,0,LH);
    hvWand(S,L.x0,L.x1,L.z0,LAY.lnord.z1,LH,LH+0.2,'decke');
    for(let x=L.x0+2;x<L.x1;x+=2.7) for(let z=L.z0+2.4;z<LAY.lnord.z1;z+=4.0) lb(x,LH,z,false);
    /* Lager 2 und 1: Regalreihen laengs, die Versandecke bleibt frei */
    for(let z=-21.6;z<-7.5;z+=3.6){ regale.push({x:-18.2,z0:z,z1:z+2.7,quer:false}); regale.push({x:-14.4,z0:z,z1:z+2.7}); regale.push({x:-10.6,z0:z,z1:z+2.7}); }
    for(let z=-4.6;z<4.5;z+=3.4){ regale.push({x:-15.6,z0:z,z1:z+2.7}); regale.push({x:-11.4,z0:z,z1:z+2.7}); }
    /* Tore R1 und V1 innen, geschlossen */
    hvTor(G,S,'R1',L.x0,(-3.6-0.4)/2,'+x',3.2,3.0);
    hvTor(G,S,'V1',V1.x,L.z0,'+z',V1.w,V1.h);
  }
  hvRegaleKarton(G,S,regale);
  S.fertig(G);
  /* gelbe Wand, Tor N1 (offenes Rolltor, Lamellen oben aufgewickelt) */
  const N=HV7.n1, Sn=hvSammler();
  for(const s of [-1,1]){ const z=s<0?N.z0:N.z1;
    Sn.box(0.3,N.h+0.2,0.12,N.x-0.02,(N.h+0.2)/2,z+s*0.06,HV_FARBE.stahlD,'metall');
    for(let y=0.1;y<2.0;y+=0.4) Sn.box(0.34,0.2,0.16,N.x-0.24,y+0.1,z+s*0.1,y%0.8<0.4?HV_FARBE.gelb:HV_FARBE.schwarz,'lack'); }
  Sn.zyl(0.32,N.z1-N.z0+0.3,N.x-0.3,N.h+0.45,(N.z0+N.z1)/2,0xc9ced5,'metall','z',14);
  Sn.box(0.5,0.5,0.4,N.x-0.3,N.h+0.45,N.z1+0.45,0x3a4150,'lack');
  Sn.zyl(0.07,0.1,N.x-0.2,N.h+0.9,N.z0-0.4,0xffa020,'leucht','y',8);
  Sn.fertig(G);
  hvSchild(G,'N1','Kartonlager ③',1.6,0.5,HV7.n1.x-0.3,N.h+1.3,(N.z0+N.z1)/2,-Math.PI/2,'#1b2340','#f2c230');
  hvSchild(G,'KARTONLAGER ③','Nachschub aus der Reserve',3.2,0.8,K.x0-0.3,6.0,-12.0,-Math.PI/2);
  hvSchild(G,'SCHLEUSE','Packmaterial → Versandecke',2.4,0.6,HV7.halle.x1-0.15,3.6,(HV7.sDurch.z0+HV7.sDurch.z1)/2,-Math.PI/2);
}
/* Fachregale fuer Kartons: Rahmen verschmolzen, Kartons als Instanzen */
function hvRegaleKarton(G,S,regale){
  const kartons=[], R=hvRng(5), q=hvQ();
  for(const r of regale){
    const L=r.z1-r.z0, x=r.x, T=1.0, Hh=3.6, ebenen=[0.12,1.0,1.85,2.7];
    for(const zz of [r.z0,r.z1]) for(const dx of [-T/2,T/2]) S.box(0.07,Hh,0.05,x+dx,Hh/2,zz,0x2f5d9a,'lack');
    for(const y of ebenen) for(const dx of [-T/2,T/2]) S.box(0.05,0.1,L,x+dx,y,(r.z0+r.z1)/2,HV_FARBE.orange,'lack');
    for(const y of ebenen) S.box(T,0.02,L,x,y+0.05,(r.z0+r.z1)/2,0xb8bec6,'metall');
    for(const y of ebenen){ let z=r.z0+0.1; while(z<r.z1-0.4){ const w=0.38+R()*0.22, h=0.3+R()*0.3;
        if(R()<0.86){ const m=tm(x+(R()-0.5)*0.08,y+0.06+h/2,z+w/2,0,(R()-0.5)*0.05,0,0.8,h,w); kartons.push(m); } z+=w+0.04; } }
  }
  if(!kartons.length) return;
  if(q.karton){ const geo=hvKartonGeo(0); hvInst(geo,HVM.karton,kartons,G); hvRes(geo); }
  else hvInst(hvGeoBox(),hvRes(std(0xbf9150,{roughness:0.9})),kartons,G);
}
/* Kartongeometrie (Einheitswuerfel) mit UVs auf eine Atlaszelle */
function hvKartonGeo(zelle){
  const g=new THREE.BoxGeometry(1,1,1), uv=g.attributes.uv, n=HV_ATLAS_N;
  const u0=(zelle%n)/n, v0=1-(Math.floor(zelle/n)+1)/n, e=0.01;
  for(let i=0;i<uv.count;i++) uv.setXY(i,u0+e+uv.getX(i)*(1/n-2*e),v0+e+uv.getY(i)*(1/n-2*e));
  return g;
}

/* Sektionaltor mit Lamellen, innen gesehen. Lage: Mitte (cx,cz), Wand-
   normale nach innen face. Gibt es fuer R2-R6 (Hallenwaende) und R1/V1. */
function hvTor(G,S,name,cx,cz,face,B,Hh){
  const quer=face==='+x'||face==='-x', s=(face==='+z'||face==='+x')?1:-1;
  /* lokale Achse: u laengs der Wand, n in die Halle */
  const P=(u,y,n)=>quer?[cx+n*s,y,cz+u]:[cx+u,y,cz+n*s];
  const box=(wu,h,wn,u,y,n,c,m)=>{ const p=P(u,y,n); quer?S.box(wn,h,wu,p[0],p[1],p[2],c,m):S.box(wu,h,wn,p[0],p[1],p[2],c,m); };
  /* Torblatt: eigenes Mesh mit Lamellentextur */
  const geo=hvRes(new THREE.BoxGeometry(quer?0.06:B,Hh,quer?B:0.06)); const uv=geo.attributes.uv;
  for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*B/2,uv.getY(i)*Hh/3.05);
  const bl=new THREE.Mesh(geo,HVM.tor); const p0=P(0,Hh/2,0.1); bl.position.set(p0[0],p0[1],p0[2]);
  if(HIQ){ bl.castShadow=true; bl.receiveShadow=true; } G.add(bl);
  /* Fensterreihe im zweiten Panel von oben */
  for(let k=0;k<4;k++) box(0.55,0.32,0.012,-B/2+0.55+k*(B-1.1)/3,Hh*0.72,0.135,0x9fb3c6,'leucht');
  /* Laufschienen, Welle, Antrieb, Ampel, Taster */
  for(const u of [-B/2-0.08,B/2+0.08]){ box(0.07,Hh+0.4,0.07,u,(Hh+0.4)/2,0.14,HV_FARBE.stahlD,'metall'); box(0.07,0.07,1.6,u,Hh+0.36,0.9,HV_FARBE.stahlD,'metall'); }
  { const p=P(0,Hh+0.45,0.32); S.zyl(0.05,B+0.4,p[0],p[1],p[2],0xb8bec6,'metall',quer?'z':'x',10); }
  box(0.36,0.32,0.3,B/2+0.45,Hh+0.4,0.35,0x3a4150,'lack');
  box(0.18,0.28,0.12,B/2+0.5,1.4,0.1,HV_FARBE.gelb,'lack');
  box(0.16,0.34,0.12,-B/2-0.45,2.0,0.1,HV_FARBE.schwarz,'lack');
  box(0.09,0.09,0.02,-B/2-0.45,2.09,0.17,0x40ff70,'leucht'); box(0.09,0.09,0.02,-B/2-0.45,1.92,0.17,0x5a1010,'lack');
  /* Zarge */
  box(B+0.3,0.18,0.12,0,Hh+0.09,0.07,HV_FARBE.stahlD,'metall');
  hvSchild(G,name,null,0.9,0.42,...(()=>{ const p=P(0,Hh+0.95,0.14); return [p[0],p[1],p[2]]; })(),quer?(s>0?Math.PI/2:-Math.PI/2):(s>0?0:Math.PI),'#1b2340','#f2c230');
}
function hvToreBauen(o){
  const G=hvBereich('tore'), S=hvSammler(), A=HV7.halle;
  for(const t of HV7.tore){ hvTor(G,S,t.n,t.x,A.z0,'+z',WTOR.w,WTOR.h);
    /* Ueberladebruecke im Boden vor dem Tor: Riffelblech, gelb-schwarze Kante */
    S.box(2.2,0.03,2.6,t.x,0.02,A.z0+1.4,0x7c838c,'metall');
    for(let k=0;k<7;k++) S.box(0.31,0.032,0.1,t.x-0.95+k*0.32,0.022,A.z0+2.72,k%2?HV_FARBE.schwarz:HV_FARBE.gelb,'lack'); }
  for(const t of HV7.ptore) hvTor(G,S,t.n,t.x,A.z0,'+z',WTOR.w,WTOR.h);
  S.fertig(G);
}

/* Produktionsfluegel: Huelle 5 m, Stuetzenreihen in den Gaengen, Bunker */
function hvProdHuelle(o){
  const G=hvBereich('produktion'), S=hvSammler(), P=HV7.prod, H=HV7.PH;
  hvWandMitOeffnungen(S,true,P.z0-0.12,P.x0-0.24,P.x1,HV7.ptore.map(t=>({a:t.x-WTOR.w/2,b:t.x+WTOR.w/2,h:WTOR.h+0.05,zu:true})),H);
  hvHallenWand(S,false,P.x0-0.12,P.z0-0.24,P.z1+0.24,0,H);
  hvHallenWand(S,true,P.z1+0.12,P.x0-0.24,P.x1,0,H);
  hvWand(S,P.x0-0.24,P.x1,P.z0-0.24,P.z1+0.24,H,H+0.2,'decke');
  /* Stuetzen und Unterzuege in den Gaengen zwischen den Strassen */
  for(const z of [-23.47,-18.8]){
    S.box(P.x1-P.x0,0.4,0.2,(P.x0+P.x1)/2,H-0.2,z,HV_FARBE.stahl,'lack');
    for(let x=P.x0+7;x<P.x1-1;x+=7){ S.box(0.26,H-0.4,0.26,x,(H-0.4)/2,z,HV_FARBE.stahl,'lack'); S.box(0.34,0.55,0.34,x,0.28,z,HV_FARBE.gelb,'lack'); }
  }
  /* Kabeltrassen (gelb) und Druckluft (blau) laengs ueber den Strassen */
  for(const s of HV7.strassen){ S.box(P.x1-P.x0-4,0.08,0.4,(P.x0+P.x1)/2+1,H-0.75,s.z-1.4,HV_FARBE.gelb,'lack');
    S.zyl(0.04,P.x1-P.x0-4,(P.x0+P.x1)/2+1,H-0.55,s.z+1.3,0x2f6fd0,'lack','x',8); }
  S.zyl(0.06,P.x1-P.x0-1,(P.x0+P.x1)/2,H-0.32,-21.1,HV_FARBE.rot,'lack','x',8);
  /* Leuchtbaender (LED-Lichtleisten) ueber Strassen und Gaengen */
  for(const z of [-31.0,-25.8,-21.13,-16.46,-11.0,-8.4]) for(let x=P.x0+2.5;x<P.x1-1;x+=3.5){
    S.box(1.5,0.08,0.18,x,H-0.06,z,0xdfe3e9,'lack'); S.box(1.42,0.01,0.12,x,H-0.105,z,0xffffff,'leucht'); hvLampe(x,H-0.1,z); }
  /* Bunkerzellen hinter Brandwaenden, schwere Schiebetuer, Ex-Zeichen */
  const bz1=-29.0;
  for(const b of HV7.bunker){
    hvWand(S,b.x0-0.3,b.x0,P.z0,bz1,0,H,'sockel'); hvWand(S,b.x1,b.x1+0.3,P.z0,bz1,0,H,'sockel');
    hvWand(S,b.x0-0.3,b.x1+0.3,bz1,bz1+0.3,2.6,H,'sockel');
    hvWand(S,b.x0-0.3,b.x0+0.5,bz1,bz1+0.3,0,2.6,'sockel'); hvWand(S,b.x1-0.5,b.x1+0.3,bz1,bz1+0.3,0,2.6,'sockel');
    hvCol(b.x0-0.3,b.x1+0.3,P.z0,bz1+0.3);
    const m=(b.x0+b.x1)/2;
    S.box(b.x1-b.x0-0.9,2.5,0.08,m,1.25,bz1+0.38,0x7f8790,'metall');
    for(let k=0;k<4;k++) S.box(b.x1-b.x0-0.95,0.03,0.09,m,0.4+k*0.6,bz1+0.38,0x5d646d,'metall');
    S.box(b.x1-b.x0-0.6,0.12,0.12,m,2.62,bz1+0.42,HV_FARBE.stahlD,'metall');
    S.zyl(0.07,0.12,b.x1-0.2,2.85,bz1+0.42,0xff3020,'leucht','y',8);
  }
  S.fertig(G);
  hvProdNebenflaechen(G);
  for(const [i,b] of HV7.bunker.entries()) hvSchild(G,'BUNKER '+(i+1),'Mischen · Ex-Zone 1',1.8,0.5,(b.x0+b.x1)/2,3.1,-28.55,0,'#7a1410','#ffd23f');
  hvSchild(G,'PRODUKTION','Raketen · Kugelbomben · Batterien',3.6,0.9,P.x1+0.1,4.4,-31.5,Math.PI/2);
  hvSchild(G,'PRODUKTION','Raketen · Kugelbomben · Batterien',3.6,0.9,P.x1-0.38,4.0,-31.5,-Math.PI/2);
}

/* Produktion, Nebenflaechen: Rohstofflager an der Suedwand, Leitstand aus Glas,
   Rohstoffe an R6, Fertigware an R5 */
function hvProdNebenflaechen(G){
  const S=hvSammler(), P=HV7.prod, pal=[], palF=[], R=hvRng(61), q=hvQ();
  /* Palettenregal, drei Ebenen, an der Suedwand */
  const rz0=P.z1-1.35, rz1=P.z1-0.15, RX0=-99.8, RX1=-84.2, E=[0,1.45,2.9], fb=2.6;
  for(let x=RX0;x<=RX1+0.01;x+=fb){ for(const z of [rz0+0.04,rz1-0.04]) S.box(0.09,4.2,0.08,x,2.1,z,0xc5cad1,'metall');
    for(let y=0.4;y<4;y+=1.2) S.box(0.04,0.04,rz1-rz0-0.1,x,y,(rz0+rz1)/2,0xc5cad1,'metall'); }
  for(let l=1;l<E.length;l++) for(let x=RX0;x<RX1-0.1;x+=fb) for(const z of [rz0+0.05,rz1-0.05]) S.box(fb-0.1,0.11,0.05,x+fb/2,E[l]-0.06,z,0xe36b1f,'lack');
  hvCol(RX0-0.1,RX1+0.1,rz0,P.z1);
  let n=0;
  for(let x=RX0;x<RX1-0.1;x+=fb) for(let s=0;s<3;s++) for(const y of E){ n++; if(R()<0.15) continue;
    const cx=x+0.1+(s+0.5)*(fb-0.2)/3, cz=(rz0+rz1)/2, art=n%4, y0=y+PAL_H;
    pal.push(tm(cx,y,cz));
    if(art===0){ for(let a=0;a<2;a++) for(let b=0;b<2;b++) S.zyl(0.2,0.75,cx-0.2+a*0.4,y0+0.375,cz-0.3+b*0.6,0xf1ece0,'matt','y',q.rund); }    /* Papierrollen */
    else if(art===1){ for(let a=0;a<4;a++) for(let b=0;b<5;b++) S.zyl(0.045,1.1,cx,y0+0.05+a*0.095,cz-0.2+b*0.095,0x2b2d31,'matt','z',8); }  /* Rohre */
    else if(art===2){ S.box(0.78,0.5,1.15,cx,y0+0.25,cz,0xbf9150,'matt'); }                                                                       /* Pappe flach */
    else { for(let a=0;a<2;a++) for(let c=0;c<2;c++) S.box(0.36,0.25,1.1,cx-0.2+a*0.4,y0+0.13+c*0.26,cz,0x4a7ab8,'lack'); }                          /* Halbschalen in Kisten */
  }
  hvInst(hvPalGeo(),HVM.holz,pal,G);
  /* Leitstand: Glasraum mit Pulten und Bildschirmen */
  const L={x0:-82.2,x1:-75.4,z0:P.z1-5.2,z1:P.z1-0.12}, Hh=2.8, lm=(L.x0+L.x1)/2;
  for(const [a,b,z] of [[L.x0,L.x1,L.z0]]){ for(let x=a;x<=b+0.01;x+=(b-a)/5) S.box(0.06,Hh,0.06,x,Hh/2,z,0x8a9099,'metall');
    S.box(b-a,Hh-1.0,0.02,(a+b)/2,0.95+(Hh-1.0)/2,z,0xffffff,'plexi'); S.box(b-a,0.9,0.06,(a+b)/2,0.45,z,0xe4e7ea,'lack'); }
  for(const x of [L.x0,L.x1]){ S.box(0.06,Hh,L.z1-L.z0,x,Hh/2,(L.z0+L.z1)/2,0xe4e7ea,'lack'); }
  S.box(L.x1-L.x0+0.1,0.12,L.z1-L.z0+0.1,lm,Hh+0.06,(L.z0+L.z1)/2,0xe4e7ea,'lack');
  S.box(1.0,2.1,0.04,L.x1-0.8,1.05,L.z0-0.01,0x7f8790,'lack');
  for(let i=0;i<3;i++){ const x=L.x0+1.2+i*2.0; S.box(1.6,0.05,0.8,x,0.76,L.z0+0.9,0xd8dce1,'lack'); S.box(0.05,0.74,0.6,x,0.37,L.z0+0.9,0x5d646d,'lack');
    for(const dx of [-0.4,0.4]){ S.box(0.55,0.34,0.03,x+dx,1.05,L.z0+1.15,HVF.dunkel,'lack'); S.box(0.5,0.29,0.004,x+dx,1.05,L.z0+1.13,0xffffff,'screen'); }
    S.box(0.5,0.08,0.5,x,0.48,L.z0+0.3,0x2a2e35,'lack'); S.box(0.48,0.55,0.08,x,0.8,L.z0+0.05,0x2a2e35,'lack'); }
  S.box(2.4,1.2,0.05,lm,1.9,L.z1-0.05,HVF.dunkel,'lack'); S.box(2.3,1.1,0.01,lm,1.9,L.z1-0.08,0xffffff,'screen');
  hvCol(L.x0,L.x1,L.z0-0.05,L.z1);
  /* Rohstoffe an R6 (Rohre, Papier), Fertigware vor R5 (foliert) */
  for(const [x,z] of [[-93.4,-27.2],[-90.6,-27.2]]) { pal.length=0; }
  const roh=[[-93.6,-27.6],[-90.4,-27.6]];
  roh.forEach(([x,z],i)=>{ const pm=[tm(x,0,z)]; hvInst(hvPalGeo(),HVM.holz,pm,G);
    if(i===0) for(let a=0;a<5;a++) for(let b=0;b<6;b++) S.zyl(0.045,1.1,x,PAL_H+0.05+a*0.095,z-0.24+b*0.095,0x2b2d31,'matt','z',8);
    else for(let a=0;a<2;a++) for(let b=0;b<2;b++) S.zyl(0.2,0.75,x-0.2+a*0.4,PAL_H+0.375,z-0.3+b*0.6,0xf1ece0,'matt','y',q.rund);
    hvCol(x-0.42,x+0.42,z-0.62,z+0.62); });
  for(let i=0;i<4;i++){ const x=-77.6+(i%2)*1.1, z=-31.0+Math.floor(i/2)*1.5; palF.push({x,y:0,z,v:(i+1)%4}); hvCol(x-0.42,x+0.42,z-0.62,z+0.62); }
  S.fertig(G);
  hvPalettenInst(G,palF,true);
  hvSchild(G,'LEITSTAND',null,1.6,0.42,lm,Hh+0.45,L.z0-0.02,Math.PI,'#1b2340','#f2c230');
  hvSchild(G,'ROHSTOFFLAGER','Hülsen · Papier · Pappe · Halbschalen',3.0,0.6,(RX0+RX1)/2,4.55,rz0-0.05,Math.PI);
}
