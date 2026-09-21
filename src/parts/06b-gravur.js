
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
  const body=std(0x2f3644,{metalness:0.35,roughness:0.5}), steel=std(0xb8bec8,{metalness:0.7,roughness:0.3});
  bbox(0.85,1.55,0.6,body,0,0.78,0,g);
  bbox(0.9,0.06,0.66,std(0xffd23f),0,1.58,0,g,false);
  plane(0.7,0.16,new THREE.MeshBasicMaterial({map:tex(280,64,(g2,W,H)=>{ g2.fillStyle='#ffd23f'; g2.fillRect(0,0,W,H); g2.fillStyle='#0e1226'; g2.font=BUN(30); g2.textAlign='center'; g2.textBaseline='middle'; g2.fillText('DEINE RAKETE',W/2,H/2+2); }),toneMapped:false}),0,1.45,0.31,0,g);
  // Sichtfenster mit Blanko-Ware
  const glass=new THREE.MeshStandardMaterial({color:LIN(0xbfe0ff),transparent:true,opacity:0.2,roughness:0.05,metalness:0.2,depthWrite:false});
  bbox(0.62,0.42,0.02,glass,0,1.14,0.305,g,false);
  bbox(0.66,0.03,0.04,steel,0,0.92,0.3,g,false); bbox(0.66,0.03,0.04,steel,0,1.36,0.3,g,false);
  gravTray=new THREE.Group(); gravTray.position.set(0,1.0,0.16); g.add(gravTray);
  // Bildschirm und Tastenfeld
  const scr=bbox(0.5,0.34,0.03,std(0x16181f),0,0.72,0.3,g); scr.rotation.x=0.22;
  gravTex=tex(320,220,()=>{});
  plane(0.46,0.3,new THREE.MeshBasicMaterial({map:gravTex,toneMapped:false}),0,0,-0.017,Math.PI,scr);
  for(let r=0;r<3;r++) for(let c=0;c<5;c++) bbox(0.07,0.02,0.05,steel,-0.2+c*0.1,0.44,0.28-r*0.06,g,false);
  // Ausgabefach
  bbox(0.6,0.02,0.24,std(0x1b1f2a),0,0.26,0.24,g,false);
  bbox(0.62,0.16,0.03,std(0x1b1f2a),0,0.34,0.36,g,false);
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
  if(gravTray){ while(gravTray.children.length) gravTray.remove(gravTray.children[0]);
    const n=Math.min(6,gravBlanks);
    for(let i=0;i<n;i++){ const m=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.42,8),std(0xd8d2c4));
      m.rotation.z=Math.PI/2; m.position.set(0,0.06+i*0.032,0); gravTray.add(m); } }
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
  if(c.count<=0){ S.carrying=null; toast('Karton leer.'); }
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
