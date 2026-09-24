/* =========================================================
   Logistikhalle in drei Stufen (Tom, 24.09.)

   Vorher stand gleich eine riesige Halle da, 40 x 38 m und zwoelf
   Meter hoch, mit den Toren ganz hinten an der Westwand. Jetzt
   faengt sie klein an und waechst mit jedem Ausbau:
     Stufe 1: 18 x 20 m, 6,5 m hoch, Tor 2 und 3
     Stufe 2: 30 x 24 m, 8,5 m hoch, dazu Tor 4
     Stufe 3: 40 x 27 m, 11 m hoch, dazu Tor 5
   Die Tore stehen an der Suedwand - kommt man durch die Schleuse
   herein, liegen sie rechts, gleich die ersten wenige Meter vom
   Eingang. Die Suedwand bleibt bei jeder Stufe, wo sie ist; die
   Halle waechst nach Westen und Norden. Suedlich davor liegt der
   LKW-Hof.

   Jede Stufe ist ein eigenes, vollstaendiges Gebaeude. Beim Kauf
   verschwindet das kleinere und das groessere steht da - zwei
   verschieden hohe Hallen kann man nicht durch Wandwegnehmen
   ineinander uebergehen lassen. Vor dem Kauf sieht man von aussen
   die Halle der ersten Stufe, geschlossen.
   ========================================================= */
const LHALLE={z:-34.0, x1:-26.0};
const LOGI_STUFEN=[
  {id:'lager_west', r:LAY.lw1,  h:6.5},
  {id:'lager_west2',r:LAY.lw2,  h:8.5},
  {id:'lager_west3',r:LAY.lwest,h:11.0}
];
/* ab welcher Stufe es welches Tor gibt (Reihenfolge wie WRAMPEN) */
const TOR_STUFE=[0,0,1,2];
/* hoechste gekaufte Stufe, -1 = keine. Nur der Reihe nach. */
function logiStufe(){ let n=-1; for(let i=0;i<LOGI_STUFEN.length;i++){ if(zoneOffen(LOGI_STUFEN[i].id)) n=i; else break; } return n; }
/* welche Halle steht: vor dem Kauf die erste, von aussen */
function logiZeige(){ return Math.max(0,logiStufe()); }
function logiHoehe(){ return LOGI_STUFEN[logiZeige()].h; }

const LOGI_G=[], LOGI_COLS=[], TOR_G=[], TOR_COLS=[];
/* Alles, was fn in die Szene stellt und an Kollision anlegt, einsammeln -
   ausser den Kollisionen, die die Zone lager_west selbst verwaltet
   (die Fuellung im Durchgang zur Schleuse). */
function logiSammle(fn){
  const vorS=new Set(scene.children), vorC=colliders.length;
  fn();
  const neu=scene.children.filter(o=>!vorS.has(o));
  const zw=(ZONEN.lager_west&&ZONEN.lager_west.wandCols)||[];
  const cols=colliders.slice(vorC).filter(c=>zw.indexOf(c)<0);
  return {neu,cols};
}
/* Suedwand: massive Stuecke, dazwischen die Toroeffnungen dieser Stufe */
function logiSuedwand(i,r,H,ex){
  const Z=LHALLE.z, sock=std(0x4a5058,{roughness:0.9});
  const tore=WRAMPEN.map((x,k)=>({x,k})).filter(t=>TOR_STUFE[t.k]<=i&&t.x>r.x0&&t.x<r.x1).sort((a,b)=>a.x-b.x);
  const stueck=(a,b)=>{ if(b-a<0.01) return;
    wall(a,b,Z-LW,Z,0,H,'+z',lagerWall,ex,0,lagerWall); col(a,b,Z-LW,Z);
    /* Sockelband gegen Spritzwasser, nur an der vollen Wand - frueher
       lief es auch quer vor den Toren her */
    bbox(b-a,1.05,0.06,sock,(a+b)/2,0.525,Z-LW-0.03,null,false); };
  let x=r.x0-LW;
  for(const t of tore){
    const a=t.x-WTOR.w/2, b=t.x+WTOR.w/2;
    stueck(x,a);
    wall(a,b,Z-LW,Z,WTOR.h,H,'+z',lagerWall,ex,0,lagerWall);
    col(a,b,Z-LW,Z);                         /* die Tore bleiben fuer Fussgaenger zu */
    x=b;
  }
  stueck(x,r.x1+LW/2);
}
function logiStufeBauen(i){
  const st=LOGI_STUFEN[i], r=st.r, H=st.h, bl=blechMat(), S2=LAY.schleuse;
  const ST=[[S2.z0+1.6,S2.z1-1.6]];
  const g=new THREE.Group(); g.userData.inventar=true; g.userData.logiStufe=i; scene.add(g); LOGI_G[i]=g;
  const {neu,cols}=logiSammle(()=>{
    halle(null,r,{art:'lager',h:H,ex:bl,aussen:{n:true},ao:{n:true,w:true,s:true,e:true},
      ax:i===0?4.6:5.6,az:i===0?5.0:6.2});
    /* Westwand selbst: sie greift an beiden Enden bis in die Mitte der
       Nord- und Suedwand. Stiess sie genau an deren Innenflaeche, blieb
       in der Ecke ein heller Haarriss vom Boden bis zur Decke. */
    wall(r.x0-LW,r.x0,r.z0-LW/2,r.z1+LW/2,0,H,'+x',lagerWall,bl);
    col(r.x0-LW,r.x0,r.z0-LW/2,r.z1+LW/2);
    /* Ostwand: zur Schleuse mit dem Durchgang, der Rest Blech nach aussen */
    durchbruchWand(null,false,r.x1,r.z0-LW/2,S2.z0,[],lagerWall,bl,3.0,H);
    durchbruchWand('lager_west',false,r.x1,S2.z0,S2.z1,ST,lagerWall,lagerWall,3.0,H);
    durchbruchWand(null,false,r.x1,S2.z1,r.z1+LW/2,[],lagerWall,bl,3.0,H);
    logiSuedwand(i,r,H,bl);

    /* Hallenschild ueber dem Durchgang, innen */
    plane(2.2,0.44,new THREE.MeshBasicMaterial({toneMapped:false,map:tex(512,104,(c,W,Hh)=>{
      c.fillStyle='#1b2340'; c.fillRect(0,0,W,Hh); c.fillStyle='#f2c230'; c.fillRect(0,Hh-7,W,7);
      c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#e8ecf5'; c.font=BUN(38);
      c.fillText('LOGISTIKHALLE · STUFE '+(i+1),W/2,Hh/2-3); })}),r.x1-0.13,3.45,(S2.z0+S2.z1)/2,-Math.PI/2,null);
  });
  neu.forEach(o=>{ scene.remove(o); g.add(o); });
  cols.forEach(c=>dropCol(c));
  LOGI_COLS[i]=cols;
}
/* Tore einmal bauen, eingeblendet werden sie mit ihrer Stufe */
function logiToreBauen(){
  for(let k=0;k<WRAMPEN.length;k++){
    let tg=null;
    const {neu,cols}=logiSammle(()=>{ tg=westTor(WRAMPEN[k],k+1); });
    const g=new THREE.Group(); scene.add(g);
    neu.forEach(o=>{ scene.remove(o); g.add(o); });
    cols.forEach(c=>dropCol(c));
    TOR_G[k]=g; TOR_COLS[k]=cols;
  }
}
/* LKW-Hof suedlich der Halle */
function logiHofBauen(){
  const r=LAY.hof2, Z=LHALLE.z;
  const bt=concreteTex(); bt.repeat.set((r.x1-r.x0)/2.4,(r.z1-r.z0)/2.4);
  flat(r.x1-r.x0,r.z1-r.z0,new THREE.MeshStandardMaterial({map:bt,roughness:0.93,color:LIN(0xaaaeb4)}),
       (r.x0+r.x1)/2,0.013,(r.z0+r.z1)/2);
  /* Zufahrt nach Westen hinaus */
  const zt=concreteTex(); zt.repeat.set(12,2);
  flat(28,7.5,new THREE.MeshStandardMaterial({map:zt,roughness:0.93,color:LIN(0xa4a8ae)}),r.x0-14,0.012,-50.0);
  /* Stellplatzmarkierung vor jedem Tor: zwei Linien, Stopplinie, Mittelstriche */
  const gelb=std(0xf2c230);
  for(const cx of WRAMPEN){
    for(const s of [-1,1]) flat(0.14,14,gelb,cx+s*1.9,0.017,Z-7.4);
    flat(3.8,0.14,gelb,cx,0.017,Z-14.4);
    for(let j=0;j<5;j++) flat(0.1,0.5,gelb,cx,0.017,Z-1.2-j*1.1);
  }
  /* Zaun: Sueden, Osten und Westen mit der Einfahrt */
  const ZH=2.2, torA=-53.5, torB=-46.5;
  zaunLauf(r.x0,r.z0,r.x1,r.z0,ZH);
  zaunLauf(r.x1,r.z0,r.x1,r.z1,ZH);
  zaunLauf(r.x0,r.z0,r.x0,torA,ZH);
  zaunLauf(r.x0,torB,r.x0,r.z1,ZH);
  col(r.x0,r.x1,r.z0-0.1,r.z0+0.1);
  col(r.x1-0.1,r.x1+0.1,r.z0,r.z1);
  col(r.x0-0.1,r.x0+0.1,r.z0,torA);
  col(r.x0-0.1,r.x0+0.1,torB,r.z1);
  /* Wartespur: abgestellte Auflieger laengs am West- und Ostrand -
     die Fahrspuren vor den Toren bleiben bis zum Suedzaun frei */
  for(const [n,f,x,ry] of [['Kowalski',TRUCKCOL.kowalski,r.x0+2.8,Math.PI/2],['Ratzke',TRUCKCOL.ratzke,r.x1-2.8,-Math.PI/2]]){
    for(const s of [-1,1]) flat(0.14,14,gelb,x+s*1.5,0.017,-52.0);
    abstellAuflieger(x,-52.0,ry,n,f);
  }
  /* Licht, Paletten, Container, Schnee - alles ausserhalb der Fahrspuren */
  hofMast(r.x0+1.6,-43.5,Math.PI/2); hofMast(r.x1-1.2,-43.5,-Math.PI/2);
  hofMast(-36,r.z0+5.6,0);
  palettenStapel(r.x1-2.4,Z-4.0,7,0.1);
  palettenStapel(r.x1-2.4,Z-5.6,5,-0.2);
  palettenStapel(r.x0+2.4,Z-8.0,6,0.3);
  { const cx=r.x0+4.2, cz=Z-4.0;
    const cm=std(0x4a6f52,{metalness:0.35,roughness:0.7});
    bbox(2.5,2.2,6.0,cm,cx,1.1,cz,null,true);
    bbox(2.6,0.14,6.1,std(0xeef2f8,{roughness:1}),cx,2.24,cz,null,false);
    for(let i=0;i<9;i++) bbox(2.56,2.1,0.08,std(0x3f6047,{metalness:0.3,roughness:0.75}),cx,1.1,cz-2.8+i*0.7,null,false);
    col(cx-1.35,cx+1.35,cz-3.1,cz+3.1); }
  for(const [sx,sz,sw] of [[r.x0+8,r.z0+3,3.0],[-43,r.z0+3,2.6]]){
    const h=new THREE.Mesh(new THREE.SphereGeometry(sw/2,HIQ?14:8,8),std(0xeef2f8,{roughness:1}));
    h.scale.set(1,0.42,0.8); h.position.set(sx,0.1,sz); scene.add(h);
    col(sx-sw/2,sx+sw/2,sz-sw/2.6,sz+sw/2.6); }
  /* Hinweisschild an der Einfahrt */
  { const px=r.x0+0.2, pz=torB+1.2;
    bbox(0.1,2.4,0.1,std(0x59606b,{metalness:0.6}),px,1.2,pz,null,false);
    plane(1.5,0.95,new THREE.MeshStandardMaterial({side:THREE.DoubleSide,map:tex(300,190,(g,W,H)=>{
      g.fillStyle='#1b2340'; g.fillRect(0,0,W,H);
      g.strokeStyle='#ffd23f'; g.lineWidth=6; g.strokeRect(7,7,W-14,H-14);
      g.textAlign='center'; g.textBaseline='middle';
      g.fillStyle='#ffd23f'; g.font=BUN(30); g.fillText('LOGISTIKHOF',W/2,44);
      g.fillStyle='#bcd0ea'; g.font=BAR(24);
      g.fillText('Tor 2 – 5 · Auflieger',W/2,86);
      g.fillText('Schrittgeschwindigkeit',W/2,118);
      g.fillStyle='#ff9d92'; g.font=BAR(22); g.fillText('Rauchen und Feuer verboten',W/2,152); })}),
      px,1.75,pz,Math.PI/2,null); }
}
function buildLogistikHalle(){
  for(let i=0;i<LOGI_STUFEN.length;i++) logiStufeBauen(i);
  logiToreBauen();
  logiHofBauen();
  logiAnwenden();
}
/* Richtige Stufe zeigen, Kollisionen dazu, Tore ein- und ausblenden */
function logiColSetzen(list,an){
  list.forEach(c=>{ const drin=colliders.indexOf(c)>=0; if(an&&!drin) colliders.push(c); else if(!an&&drin) dropCol(c); });
}
function logiAnwenden(){
  if(!LOGI_G.length) return;
  const z=logiZeige();
  LOGI_G.forEach((g,i)=>{ g.visible=i===z; logiColSetzen(LOGI_COLS[i],i===z); });
  TOR_G.forEach((g,k)=>{ const an=TOR_STUFE[k]<=z; g.visible=an; logiColSetzen(TOR_COLS[k],an); });
  if(typeof navDirty==='function') navDirty();
}
