
/* =========================================================
   Gravur-Automat
   ========================================================= */
let gravG=null, gravHit=null, gravTex=null, gravBlanks=0, gravTray=null, gravMov=null;
const GRAV_MAX=12;
const GRAVTEXTE=['Für Mama','Lisa & Tom','Frohes Neues!','Papa 2027','Team Schröder','Oma Helga','Prost Neujahr','Für Opa Werner','Kevin war hier','Familie Yilmaz','Auf uns!','Sarah & Jan','2027 wird unser Jahr','Danke für alles','Auf die Nachbarn','Endlich Urlaub','Für meinen Schatz','Abteilung Logistik','Wir haben Ja gesagt','Für die Jungs'];
function gravReady(){ return !!gravG&&gravBlanks>0; }
function gravStand(){ return localToWorld(gravG,0,0.95); }
function buildGravur(pos){
  if(gravG) return;
  const g=new THREE.Group(); const p=pos||{x:6.7,z:-3.4,ry:-Math.PI/2};
  g.position.set(p.x,0,p.z); g.rotation.y=p.ry||0; scene.add(g);
  /* 10.10. neu (Tom: "sieht aus wie drei Pixel"): Konfigurationsautomat
     wie im Kino oder Bahnhof - Edelstahlwangen, dunkelblaue Front,
     beleuchteter Kopf "Rakete personalisieren", Vitrine mit den Rohlingen,
     gekippter Touchscreen, Kartenleser, beleuchteter Ausgabeschacht.
     Grundflaeche und Trefferflaeche wie vorher. */
  const NAVY=0x1b2747, NAVY2=0x24345e, DUNK=0x12151c, STAHL=0xb3bac5, BLAU=0x4fb0ff;
  const b=geraetBau();
  b.box('matt',0.8,0.07,0.56,DUNK,0,0.035,0)
   .rund('lack',0.74,1.5,0.54,0.03,NAVY,0,0.82,-0.02);
  for(const s of [-1,1]) b.rund('metall',0.07,1.52,0.62,0.03,STAHL,s*0.39,0.83,0)
    .box('leucht',0.012,1.36,0.012,BLAU,s*0.352,0.83,0.297);
  /* Kopf mit Leuchtschild */
  b.rund('lack',0.9,0.22,0.66,0.05,NAVY2,0,1.66,0.0)
   .box('metall',0.84,0.014,0.6,STAHL,0,1.775,0.0);
  /* Vitrine: Rahmen, Boden, Lichtleiste */
  b.box('metall',0.66,0.03,0.04,STAHL,0,1.515,0.29).box('metall',0.66,0.03,0.04,STAHL,0,1.105,0.29)
   .box('metall',0.03,0.44,0.04,STAHL,-0.315,1.31,0.29).box('metall',0.03,0.44,0.04,STAHL,0.315,1.31,0.29)
   .box('metall',0.6,0.012,0.06,STAHL,0,1.124,0.28)
   .box('leucht',0.58,0.01,0.012,0xfff0d0,0,1.492,0.29);
  /* Bedienpult: gekippter Touchscreen, Kartenleser, Ablage */
  const PX=-0.55, PY=0.93, PZ=0.31;
  b.pivot(-0.07,PY,PZ,PX,0,0).rund('matt',0.44,0.32,0.05,0.018,DUNK,0,0,0).pivot()
   .rund('lack',0.72,0.05,0.2,0.015,NAVY2,0,0.76,0.26)
   .box('metall',0.72,0.02,0.012,STAHL,0,0.76,0.362)
   .pivot(0.26,0.92,0.3,PX,0,0).rund('matt',0.12,0.18,0.045,0.012,DUNK,0,0,0)
   .box('leucht',0.07,0.005,0.004,0x37d977,0,0.06,0.024)
   .box('lack',0.085,0.075,0.004,0x8d95a2,0,-0.025,0.023).pivot();
  /* Ausgabeschacht mit Lichtkante */
  b.box('matt',0.5,0.18,0.06,0x07090d,0,0.44,0.28)
   .box('leucht',0.52,0.012,0.01,0xffb340,0,0.538,0.312)
   .box('metall',0.46,0.09,0.012,STAHL,0,0.395,0.305,0.25,0,0)
   .box('metall',0.72,0.06,0.012,STAHL,0,0.1,0.278);
  b.fertig(g);
  /* Leuchtschild vorne am Kopf */
  plane(0.84,0.18,new THREE.MeshBasicMaterial({toneMapped:false,map:tex(512,110,(c,W,H)=>{
    const gr=c.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#2c4278'); gr.addColorStop(1,'#16213f'); c.fillStyle=gr; c.fillRect(0,0,W,H);
    /* Rakete als Zeichen */
    c.save(); c.translate(58,H/2); c.rotate(-0.6); c.fillStyle='#ffffff';
    c.beginPath(); c.moveTo(0,-38); c.quadraticCurveTo(14,-20,12,14); c.lineTo(-12,14); c.quadraticCurveTo(-14,-20,0,-38); c.fill();
    c.beginPath(); c.moveTo(-12,4); c.lineTo(-22,22); c.lineTo(-11,16); c.fill(); c.beginPath(); c.moveTo(12,4); c.lineTo(22,22); c.lineTo(11,16); c.fill();
    c.fillStyle='#2c4278'; c.beginPath(); c.arc(0,-12,6,0,7); c.fill();
    c.fillStyle='#ffb340'; c.beginPath(); c.moveTo(-7,16); c.lineTo(0,34); c.lineTo(7,16); c.fill(); c.restore();
    c.fillStyle='#ffd23f'; c.textAlign='left'; c.textBaseline='middle'; fitFont(c,'RAKETE',W-130,46,BUN); c.fillText('RAKETE',112,38);
    c.fillStyle='#e8f0ff'; fitFont(c,'PERSONALISIEREN',W-130,34,BAR); c.fillText('PERSONALISIEREN',114,80);
  })}),0,1.66,0.332,0,g);
  /* Rueckwand der Vitrine */
  plane(0.58,0.38,new THREE.MeshBasicMaterial({toneMapped:false,map:tex(256,168,(c,W,H)=>{
    const gr=c.createRadialGradient(W/2,H*0.35,10,W/2,H/2,W*0.6); gr.addColorStop(0,'#3a64b8'); gr.addColorStop(1,'#0e1730'); c.fillStyle=gr; c.fillRect(0,0,W,H);
    for(let i=0;i<40;i++){ c.fillStyle='rgba(255,230,160,'+(0.3+((i*37)%7)/10)+')'; c.fillRect((i*53)%W,(i*29)%(H*0.55),2,2); }
    c.fillStyle='#ffd23f'; c.textAlign='center'; c.textBaseline='middle'; c.font=BUN(22); c.fillText('DEIN NAME',W/2,34);
    c.fillStyle='#cfe0ff'; c.font=BAR(18); c.fillText('in Gold auf deiner Rakete',W/2,60);
  })}),0,1.31,0.256,0,g);
  /* Glasscheibe */
  const glass=new THREE.MeshStandardMaterial({color:LIN(0xbfe0ff),transparent:true,opacity:0.16,roughness:0.05,metalness:0.2,depthWrite:false});
  bbox(0.6,0.38,0.006,glass,0,1.31,0.306,g,false);
  gravTray=new THREE.Group(); gravTray.position.set(0,1.13,0.282); g.add(gravTray);
  /* Touchscreen */
  gravTex=tex(320,220,()=>{});
  const scr=plane(0.4,0.275,new THREE.MeshBasicMaterial({map:gravTex,toneMapped:false}),-0.07,PY+0.026*Math.sin(-PX),PZ+0.026*Math.cos(PX),0,g);
  scr.rotation.x=PX;
  gravHit=bbox(1.0,1.7,0.9,hitM,0,0.85,0.1,g,false); gravHit.userData={kind:'gravur'};
  gravG=g;
  gravMov=addMovable({kind:'gravur',name:'Gravur-Automat',g,fw:0.95,fd:0.7});
  drawGrav();
}
function drawGrav(){
  if(!gravTex) return;
  redraw(gravTex,(g,W,H)=>{
    g.fillStyle='#0d1a2b'; g.fillRect(0,0,W,H);
    g.fillStyle='#ffd23f'; g.fillRect(0,0,W,44);
    g.fillStyle='#0e1226'; g.font=BUN(24); g.textAlign='center'; g.textBaseline='middle'; g.fillText('GRAVUR-AUTOMAT',W/2,23);
    g.textAlign='center';
    if(gravBlanks>0){
      g.fillStyle='#e8eef8'; g.font=BAR(28); g.fillText('Name eingeben',W/2,86);
      g.fillStyle='#8ef0a8'; g.font=BUN(26); g.fillText(gravBlanks+' Rohlinge',W/2,130);
      g.fillStyle='#8fb4e0'; g.font=BAR(24); g.fillText(eur(S?S.prices.gravur:24.99),W/2,172);
    } else {
      g.fillStyle='#ffab9f'; g.font=BUN(24); g.fillText('LEER',W/2,100);
      g.fillStyle='#8fb4e0'; g.font=BAR(24); g.fillText('Blanko nachfüllen',W/2,150);
    }
  });
  if(gravTray){ while(gravTray.children.length){ const o=gravTray.children[0]; gravTray.remove(o); if(o.geometry) o.geometry.dispose(); }
    /* Rohlinge als ein Mesh: Huelse, Spitze, Leitstab */
    const n=Math.min(6,gravBlanks);
    if(n){ const b=geraetBau();
      for(let i=0;i<n;i++){ const y=0.02+i*0.03, x=(i%2)*0.02-0.01;
        b.zyl('lack',0.013,0.013,0.3,8,0xe9e3d4,x,y,0,0,0,Math.PI/2)
         .zyl('lack',0.0005,0.013,0.05,8,0xd8352a,x+0.175,y,0,0,0,-Math.PI/2)
         .zyl('matt',0.003,0.003,0.16,4,0xc9a46a,x-0.2,y-0.012,0,0,0,Math.PI/2); }
      b.fertig(gravTray,false); } }
}
/* Gravierte Einzelstücke (eigene Meshes, weil jeder Text anders ist) */
function makeEngraved(text){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.019,0.019,0.16,12),std(0xd8352a)); body.rotation.z=Math.PI/2; g.add(body);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(0.019,0.05,12),std(0xffd23f)); tip.rotation.z=-Math.PI/2; tip.position.x=0.105; g.add(tip);
  const stick=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.32,5),std(0xc9a46a)); stick.rotation.z=Math.PI/2; stick.position.set(-0.2,-0.016,0); g.add(stick);
  const lt=tex(384,96,(c,W,H)=>{
    const gr=c.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#f4f1e8'); gr.addColorStop(1,'#ded7c6'); c.fillStyle=gr; c.fillRect(0,0,W,H);
    c.fillStyle='#6a24c9'; c.fillRect(0,0,W,10); c.fillRect(0,H-10,W,10);
    c.fillStyle='#1b1428'; c.textAlign='center'; c.textBaseline='middle';
    fitFont(c,text,W-40,44,BAR); c.fillText(text,W/2,H/2+2);
  });
  const label=new THREE.Mesh(new THREE.CylinderGeometry(0.0197,0.0197,0.1,16,1,true),new THREE.MeshStandardMaterial({map:lt,roughness:0.6,side:THREE.DoubleSide}));
  label.rotation.z=Math.PI/2; label.position.x=-0.01; g.add(label);
  if(HIQ) g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  g.userData.tex=lt; g.userData.text=text;
  return g;
}
function disposeEngraved(m){ if(m&&m.userData&&m.userData.tex){ try{ m.userData.tex.dispose(); }catch(e){} } if(m&&m.parent) m.parent.remove(m); }
function refillGrav(quiet){
  const c=S.carrying;
  if(!c||c.type!=='blanko'){ if(!quiet) toast('Dafür brauchst du Blanko-Raketen.','bad'); return; }
  if(gravBlanks>=GRAV_MAX){ if(!quiet) toast('Der Automat ist voll.'); return; }
  gravBlanks++; c.count--; sfx.pop();
  if(c.count<=0) kartonLeer(c,'Karton leer.');
  updateCarry(); drawGrav();
}
/* Kunde graviert selbst */
function customerEngraves(c){
  if(gravBlanks<=0) return false;
  gravBlanks--; drawGrav();
  const txt=pick(GRAVTEXTE);
  c.items.push({type:'gravur',price:S.prices.gravur,text:txt});
  DS.gravur=(DS.gravur||0)+1;
  return true;
}
/* Spieler graviert selbst */
let playerRocket=null;
function openGravInput(){
  if(gravBlanks<=0){ toast('Kein Rohling im Automaten.','bad'); return; }
  if(S.carrying){ toast('Erst den Karton abstellen.','bad'); return; }
  $('gravIn').value=''; $('grav').classList.add('show'); gravOpen=true;
  for(const k in keys) keys[k]=false; mouseDown=false; touchAct=false;
  if(locked) document.exitPointerLock();
  setTimeout(()=>{ try{ $('gravIn').focus(); }catch(e){} },60);
}
function closeGravInput(ok){
  const txt=($('gravIn').value||'').trim().slice(0,22);
  $('grav').classList.remove('show'); gravOpen=false;
  if(ok&&txt&&gravBlanks>0){
    gravBlanks--; drawGrav();
    S.carrying={type:'gravur',count:1,q:1,text:txt};
    updateCarry(); sfx.cash();
    toast(`„${txt}" ist drauf. Ab zur Abschussrampe.`,'money');
    addXP(12,'Eigene Gravur');
  }
  requestLock();
}
