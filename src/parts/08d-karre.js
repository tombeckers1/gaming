/* =========================================================
   Sackkarre und Plattformwagen (Tom, 24.09.: "nicht fuer jeden
   Karton einzeln laufen")
   Man holt die Karre mit K heraus. Jeder weitere Karton, den man
   aufhebt - vom Boden, aus dem LKW, aus dem Lagerregal - kommt mit
   auf die Karre. Eingeraeumt, eingelagert und abgestellt wird wie
   gewohnt der oberste; danach rueckt der naechste nach.
   Sackkarre: 4 Kartons. Plattformwagen: 8 Kartons.
   Paletten mit Hubwagen kommen spaeter in die Logistikhalle.
   ========================================================= */
const KARREN={
  sackkarre:{name:'Sackkarre',cap:4,tempo:0.9},
  wagen:{name:'Plattformwagen',cap:8,tempo:0.85}
};
function karreArt(){ return S&&S.up?(S.up.wagen?'wagen':S.up.sackkarre?'sackkarre':null):null; }
function karreAn(){ return !!(S&&S.karre&&S.karre.an&&karreArt()); }
function karreStapel(){ if(!S.karre) S.karre={an:false,stapel:[]}; if(!Array.isArray(S.karre.stapel)) S.karre.stapel=[]; return S.karre.stapel; }
/* Kartons insgesamt auf der Karre, der oberste (S.carrying) mitgezaehlt */
function karreLast(){ return S?karreStapel().length+(S.carrying?1:0):0; }
function karreTempo(){ return karreAn()?KARREN[karreArt()].tempo:1; }
/* Einen weiteren Karton aufnehmen: der bisher oberste wandert in den
   Stapel. Regalpakete passen nicht auf die Karre. */
function karreNimmt(neuRegal){
  if(!karreAn()||!S.carrying) return false;
  if(neuRegal||S.carrying.regal||S.carrying.type==='gravur') return false;
  if(karreLast()>=KARREN[karreArt()].cap) return false;
  karreStapel().push(S.carrying); S.carrying=null; return true;
}
function karreVoll(){ return karreAn()&&karreLast()>=KARREN[karreArt()].cap; }
/* Ist der oberste weg, rueckt der naechste nach */
function karreNachziehen(){
  if(!karreAn()||S.carrying) return;
  const st=karreStapel(); if(!st.length) return;
  S.carrying=st.pop(); updateCarry();
}
function toggleKarre(){
  if(!S) return;
  const art=karreArt();
  if(!art){ toast('Eine Sackkarre gibt es am Laptop unter Einrichtung.'); return; }
  karreStapel();
  if(S.karre.an){
    if(S.karre.stapel.length){ toast('Erst die Kartons von der Karre abladen.','bad'); return; }
    S.karre.an=false; toast(`${KARREN[art].name} weggestellt.`);
  } else {
    if(S.carrying&&(S.carrying.regal||S.carrying.type==='gravur')){ toast('Das passt nicht auf die Karre.','bad'); return; }
    S.karre.an=true; toast(`${KARREN[art].name}: ${KARREN[art].cap} Kartons auf einmal. K stellt sie weg.`);
  }
  sfx.pop(); updateCarry();
}

/* ---------- Modelle, vor der Kamera ---------- */
let karreG=null, karreArtGebaut=null, karreKisten=[];
function karreModell(art){
  const g=new THREE.Group();
  const rot=std(0xd23a2a,{metalness:0.35,roughness:0.45}), stahl=std(0x9ba2ad,{metalness:0.75,roughness:0.3});
  const gummi=std(0x18191d,{roughness:0.95}), felge=std(0xc9ced6,{metalness:0.7,roughness:0.3}), griff=std(0x22252c,{roughness:0.7});
  const rad=(x,y,z,r,b)=>{ const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,b,20),gummi); t.rotation.z=Math.PI/2; t.position.set(x,y,z); g.add(t);
    const f=new THREE.Mesh(new THREE.CylinderGeometry(r*0.55,r*0.55,b+0.01,14),felge); f.rotation.z=Math.PI/2; f.position.set(x,y,z); g.add(f); };
  const rohr=(x0,y0,z0,x1,y1,z1,r,m)=>{ const a=new THREE.Vector3(x0,y0,z0), c=new THREE.Vector3(x1,y1,z1), L=a.distanceTo(c);
    const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L,10),m); t.position.copy(a).add(c).multiplyScalar(0.5);
    t.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),c.clone().sub(a).normalize()); g.add(t); };
  if(art==='sackkarre'){
    /* Rahmen: zwei Holme, Querstreben, Schaufel unten, zwei Raeder */
    for(const sx of [-0.23,0.23]) rohr(sx,0,0, sx,1.25,0.2,0.017,rot);
    for(let i=0;i<4;i++){ const y=0.2+i*0.28; rohr(-0.23,y,y*0.16,0.23,y,y*0.16,0.011,rot); }
    rbox(0.52,0.012,0.24,0.004,stahl,0,0.006,-0.12,g);
    rohr(-0.25,1.25,0.2,0.25,1.25,0.2,0.019,griff);
    rad(-0.3,0.13,0.1,0.13,0.07); rad(0.3,0.13,0.1,0.13,0.07);
    rohr(-0.3,0.13,0.1,0.3,0.13,0.1,0.012,stahl);
  } else {
    /* Plattformwagen: Ladeflaeche, Schiebebuegel, vier Lenkrollen */
    /* 0,92 x 1,24 m: zwei Kartons nebeneinander, zwei hintereinander */
    rbox(0.92,0.05,1.24,0.012,std(0x3a6ea5,{roughness:0.6}),0,0.17,-0.66,g);
    rbox(0.94,0.012,1.26,0.01,std(0x2b2f36,{roughness:0.95}),0,0.2,-0.66,g);
    for(const sx of [-0.42,0.42]) rohr(sx,0.17,-0.04, sx,1.0,0.02,0.016,stahl);
    rohr(-0.44,1.0,0.02,0.44,1.0,0.02,0.02,griff);
    for(const [x,z] of [[-0.38,-0.12],[0.38,-0.12],[-0.38,-1.2],[0.38,-1.2]]){
      bbox(0.05,0.06,0.05,stahl,x,0.12,z,g,false); rad(x,0.065,z,0.065,0.045); }
  }
  return g;
}
function updateKarre(){
  const an=karreAn(), art=karreArt();
  if(karreG&&(!an||art!==karreArtGebaut)){ camera.remove(karreG); karreG=null; karreKisten=[]; }
  if(!an) return;
  if(!karreG){
    karreG=new THREE.Group(); karreArtGebaut=art;
    const m=karreModell(art);
    /* vor der Kamera: der Griff unten im Bild, die Karre nach vorn geneigt */
    /* Raeder auf dem Boden (Kamera 1,65 m), Griff unten im Bild; die
       Sackkarre lehnt zum Spieler zurueck wie beim Schieben */
    if(art==='sackkarre'){ m.position.set(0.08,-1.586,-1.075); m.rotation.set(0.5,0,0); }
    else { m.position.set(0,-1.65,-0.37); }
    karreG.add(m); karreG.userData.m=m; camera.add(karreG);
  }
  /* Kartons auf der Karre: der Stapel plus der oberste */
  const liste=karreStapel().concat(S.carrying&&S.carrying.type&&kartonMat[S.carrying.type]?[S.carrying]:[]);
  const m=karreG.userData.m;
  while(karreKisten.length>liste.length){ m.remove(karreKisten.pop()); }
  liste.forEach((c,i)=>{
    let k=karreKisten[i];
    if(!k){ k=new THREE.Mesh(kartonGeo,kartonMat[c.type]); m.add(k); karreKisten[i]=k; }
    k.material=kartonMat[c.type];
    if(art==='sackkarre'){ const y=0.22+i*0.41; k.position.set(0,y,y*0.16-0.235); k.rotation.set(0.16,0,0); }
    else { const j=i%4, st=Math.floor(i/4);
      k.position.set(j%2?0.228:-0.228,0.405+st*0.41,-0.36-Math.floor(j/2)*0.61); k.rotation.set(0,Math.PI/2,0); }
  });
}
