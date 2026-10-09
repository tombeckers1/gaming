/* =========================================================
   Hallenmodus: im Startbildschirm "Große Halle" waehlen -> die Seite laedt
   neu und baut statt der Spielwelt nur die Halle samt angrenzendem Lager
   (mit Ladebildschirm). Frei begehbar, ein Laptop im Anbruch oeffnet das
   Menue (Ansichten, Messwerte, Grafikstufe, zurueck). Kein Spielablauf.
   Das Hauptspiel laeuft unveraendert, solange der Modus nicht gewaehlt ist.
   Direkt aufrufbar mit #halle in der Adresse.
   ========================================================= */
const HALLE_MODUS=(()=>{ let h=false; try{ h=location.hash.indexOf('halle')>=0||sessionStorage.getItem('bb_modus')==='halle'; }catch(e){ h=location.hash.indexOf('halle')>=0; } return h; })();
const HM={menu:false,flug:false,y:1.65,fps:0,fpsN:0,fpsT:0,info:null,deckenLicht:null,last:0,dachAus:false,start:0};
const HM_ANSICHTEN=[
  ['Eingang von der Schleuse',-27.6,-24.9,Math.PI/2,-0.04],
  ['Hochregal: Gasse 2 vom Anbruch',-41.6,-20.3,1.45,0.16],
  ['Hochregal: Stirnseite und I/O',-38.5,-30.6,1.05,0.08],
  ['Wareneingang R2–R4',-36.0,-27.4,0.25,0.0],
  ['Anbruch und Laptop',-40.3,-16.6,1.9,-0.12],
  ['Packmaterial',-34.4,-21.4,0.75,-0.18],
  ['Schnellplätze',-44.5,-11.6,1.62,-0.08],
  ['Gelbe Wand mit N1',-46.5,-12.0,-1.57,0.05],
  ['Kartonlager ③',-34.4,-12.0,-1.57,-0.05],
  ['Schleuse',-23.0,-18.4,0.0,-0.02],
  ['Produktion: Raketen',-73.0,-23.0,1.42,-0.12],
  ['Produktion: Kugelbomben',-80.4,-19.6,2.2,-0.12],
  ['Produktion: Batterien, Rohr-Raster',-86.0,-17.1,1.95,-0.22],
  ['Produktion: Bunker und R6',-90.6,-28.1,0.16,0.06],
  ['Produktion: Palettierer',-74.5,-13.6,-1.08,-0.15],
  ['Produktion: Leitstand und Rohstofflager',-86.5,-13.6,-2.2,-0.08],
  ['Regalbediengerät (Flug)',-43.0,-25.8,1.5708,-0.06,5.4],
  ['Hochregal oben (Flug)',-46.0,-14.4,1.15,-0.25,8.6],
  ['Draufsicht (Dach aus)',-55.0,-20.0,0,-1.5707,48]
];
/* Startbildschirm: Auswahl des Bereichs neben Neues Spiel / Weiterspielen */
function halleStartWahl(){
  if($('startModus')) return;
  const st=document.createElement('style'); st.textContent=
    '#startModus{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:-6px}'+
    '#startModus span{color:var(--muted);font-size:15px;margin-right:4px}'+
    '#startModus button{font-size:16px;padding:9px 18px;border-radius:10px;min-width:0}'+
    '#startModus button.an{outline:2px solid var(--signal);outline-offset:1px}'+
    '#start.naming #startModus{display:none}';
  document.head.appendChild(st);
  const d=document.createElement('div'); d.id='startModus'; d.className='btns';
  d.innerHTML='<span>Bereich:</span><button class="ghost an" id="smLaden" title="Das Spiel wie bisher">Verkaufsfläche + Lager</button><button class="ghost" id="smHalle" title="Nur die große Halle nach Plan v7 ansehen (ohne Spielablauf)">Große Halle</button>';
  const b=$('startBtns'); b.parentNode.insertBefore(d,b.nextSibling);
  $('smHalle').onclick=()=>{ try{ if(typeof S!=='undefined'&&S&&typeof save==='function') save(); sessionStorage.setItem('bb_modus','halle'); }catch(e){} location.reload(); };
}
/* Ladebildschirm */
function hmLadeschirm(an){
  let L=$('halleLade');
  if(!L){ L=document.createElement('div'); L.id='halleLade';
    L.innerHTML='<div class="hlBox"><div class="hlTitel">GROSSE HALLE</div><div class="hlSub">Ausbauplan v7 · Hochregal · Produktion · Kartonlager ③</div><div class="hlBar"><i id="hlBalken"></i></div><div class="hlText" id="hlText">Lädt …</div></div>';
    const st=document.createElement('style'); st.textContent=
      '#halleLade{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 40%,#1c2a48,#05070f 70%);color:#e8eefc;font-family:var(--ui)}'+
      '#halleLade .hlBox{width:min(560px,86vw);text-align:center}'+
      '#halleLade .hlTitel{font-family:Bungee,Impact,sans-serif;font-size:clamp(30px,6vw,52px);color:#f2c230;letter-spacing:1px}'+
      '#halleLade .hlSub{color:#9fb0cf;font-size:16px;margin:6px 0 26px}'+
      '#halleLade .hlBar{height:14px;border-radius:8px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(255,255,255,.18)}'+
      '#halleLade .hlBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#f2c230,#ff8a3d);transition:width .15s}'+
      '#halleLade .hlText{margin-top:12px;font-size:16px;color:#cfd8ea;min-height:22px}'+
      'body.hallmodus #hud .tl,body.hallmodus #tip,body.hallmodus #zielPfeil,body.hallmodus #staff,body.hallmodus #mode,body.hallmodus #carry,body.hallmodus #kTasten,body.hallmodus #tool,body.hallmodus #phone,body.hallmodus #order,body.hallmodus #touch .tbtn:not(#btnMenu){display:none!important}'+
      '#hmInfo{position:fixed;left:12px;top:10px;z-index:12;font:600 14px/1.35 var(--ui);color:#e8eefc;background:rgba(10,14,28,.62);padding:7px 11px;border-radius:9px;pointer-events:none;white-space:pre}'+
      '#hmMenu .card{max-width:640px} #hmMenu h2{margin:0 0 6px;font-family:Bungee,Impact,sans-serif;color:#f2c230;font-size:24px}'+
      '#hmMenu .hmRaster{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;margin:8px 0 12px}'+
      '#hmMenu button{font-size:14px;padding:8px 10px} #hmMenu .hmGfx button.an{outline:2px solid #f2c230}'+
      '#hmMenu table{width:100%;font-size:13px;border-collapse:collapse} #hmMenu td{padding:2px 6px;border-bottom:1px solid rgba(255,255,255,.08)} #hmMenu td:nth-child(n+2){text-align:right}'+
      '#hmMenu small{color:#9fb0cf}';
    document.head.appendChild(st); document.body.appendChild(L); }
  L.style.display=an?'flex':'none';
}
function hmFortschritt(a,txt){ const b=$('hlBalken'), t=$('hlText'); if(b) b.style.width=Math.round(a*100)+'%'; if(t) t.textContent=txt+' …'; }
if(HALLE_MODUS){ hmLadeschirm(true); const s0=$('start'); if(s0) s0.classList.remove('show'); startOpen=false; document.body.classList.add('hallmodus'); }

/* Licht im Hallenmodus: Himmelslicht gedimmt, Sonne aus, ein Deckenlicht von
   oben mit Schatten, die beweglichen Innenlichter unter den naechsten Leuchten */
function hmLicht(){
  scene.fog=null; scene.background=new THREE.Color(0x9fb0c4);
  hemi.color.setHex(0xeef2f8); hemi.groundColor.setHex(0x77736c); hemi.intensity=0.5;
  sun.intensity=0; sun.castShadow=false;
  for(const l of [shopSpot,yardLight,shelfLight]){ if(l.parent) l.parent.remove(l); if(l.target&&l.target.parent) l.target.parent.remove(l.target); }
  const d=new THREE.DirectionalLight(0xfff4e6,0.5); d.position.set(4,40,6); scene.add(d); scene.add(d.target);
  if(renderer.shadowMap.enabled&&!gfxNiedrig(GFX)){
    d.castShadow=true; const c=d.shadow.camera, R=28; c.left=-R; c.right=R; c.top=R; c.bottom=-R; c.near=5; c.far=70;
    const gr=Math.min((GFX_PROFIL[GFX]||GFX_PROFIL.hoch).sch,renderer.capabilities.maxTextureSize||4096); d.shadow.mapSize.set(gr,gr);
    d.shadow.bias=-0.0005; d.shadow.normalBias=0.03; d.shadow.radius=(GFX_PROFIL[GFX]||GFX_PROFIL.hoch).rad; }
  HM.deckenLicht=d;
  for(const q of innenLichter){ q.l.distance=24; q.l.decay=1.05; q.l.color.setHex(0xfff0dc); }
}
function hmLichtNachfuehren(dt){
  const d=HM.deckenLicht; if(d){ const r=4, tx=Math.round(pl.x/r)*r, tz=Math.round(pl.z/r)*r;
    if(d.userData.tx!==tx||d.userData.tz!==tz){ d.userData.tx=tx; d.userData.tz=tz; d.position.set(tx+4,40,tz+6); d.target.position.set(tx,0,tz); d.target.updateMatrixWorld(); } }
  /* Innenlichter: die naechsten Leuchten vor dem Blick */
  HM.liT=(HM.liT||0)-dt; if(HM.liT>0) return; HM.liT=0.25;
  const fx=-Math.sin(yaw), fz=-Math.cos(yaw), px=pl.x+fx*5, pz=pl.z+fz*5;
  const L=HALLE.lampen.map((l,i)=>({i,d:Math.hypot(l.x-px,l.z-pz)})).sort((a,b)=>a.d-b.d);
  innenLichter.forEach((q,n)=>{ const e=L[n*2]; if(!e){ q.l.intensity=0; return; } const l=HALLE.lampen[e.i];
    q.l.position.set(l.x,l.y-0.4,l.z); q.l.intensity=l.y>8?0.85:0.5; });
}
/* Bewegung: wie im Spiel (WASD, Umschalt = rennen), Flugmodus mit Leertaste/C */
function hmBewegen(dt){
  let mx=0, mz=0;
  if(keys.KeyW||keys.ArrowUp) mz-=1; if(keys.KeyS||keys.ArrowDown) mz+=1;
  if(keys.KeyA||keys.ArrowLeft) mx-=1; if(keys.KeyD||keys.ArrowRight) mx+=1;
  mx+=joy.x; mz+=joy.y; const len=Math.hypot(mx,mz); if(len>1){ mx/=len; mz/=len; }
  const sp=((keys.ShiftLeft||keys.ShiftRight)?6.5:3.4)*(HM.flug?1.6:1), s=Math.sin(yaw), c=Math.cos(yaw);
  pl.x+=(mx*c+mz*s)*sp*dt; pl.z+=(-mx*s+mz*c)*sp*dt;
  if(HM.flug){ if(keys.Space) HM.y+=4*dt; if(keys.KeyC||keys.ControlLeft) HM.y-=4*dt; HM.y=clamp(HM.y,0.6,50);
    pl.x=clamp(pl.x,HV7.raum.x0,HV7.raum.x1); pl.z=clamp(pl.z,HV7.raum.z0,HV7.raum.z1); }
  else { HM.y+=(1.65-HM.y)*Math.min(1,dt*6); collide(pl,0.32); }
  camera.position.set(pl.x,HM.y,pl.z); camera.rotation.set(pitch,yaw,0);
}
function hmLaptopNah(){ const L=HALLE.laptop; return L&&!HM.flug&&Math.hypot(pl.x-L.x,pl.z-L.z)<2.2; }
function hmFrame(now){
  requestAnimationFrame(hmFrame);
  if(noLoop) return;
  let dt=(now-HM.last)/1000; HM.last=now; const roh=dt; if(dt>0.05) dt=0.05; if(dt<0) dt=0;
  if(!HM.menu) hmBewegen(dt);
  hallTick(dt); hmLichtNachfuehren(dt);
  renderer.info.reset(); renderFrame(dt);
  HM.fpsN++; HM.fpsT+=roh;
  if(HM.fpsT>=0.5){ HM.fps=HM.fpsN/HM.fpsT; HM.fpsN=0; HM.fpsT=0; hmInfoZeigen(); }
  const p=$('prompt'); if(p){ const n=hmLaptopNah()&&!HM.menu; p.style.display=n?'block':'none'; if(n) p.textContent=COARSE?'Laptop antippen: Menü':'E: Laptop (Ansichten, Messwerte, Grafik)'; }
}
function hmInfoZeigen(){
  let el=$('hmInfo'); if(!el){ el=document.createElement('div'); el.id='hmInfo'; document.body.appendChild(el); }
  const i=renderer.info;
  el.textContent=`Große Halle · ${GFX_NAME[GFX]||GFX}${HM.flug?' · Flugmodus':''}\n${HM.fps.toFixed(0)} FPS · ${i.render.calls} Zeichenaufrufe · ${(i.render.triangles/1000).toFixed(0)} Tsd. Dreiecke\n${COARSE?'':'E am Laptop · Esc Menü · F Flugmodus · M Messwerte'}`;
}
/* Ansicht setzen (auch fuer Bilder und Tests) */
function hmAnsicht(x,z,yw,pt,y){
  pl.x=x; pl.z=z; yaw=yw; pitch=pt||0; HM.y=y||1.65; HM.flug=!!y&&y>2.2;
  hmDach(!(y&&y>20));
  camera.position.set(pl.x,HM.y,pl.z); camera.rotation.set(pitch,yaw,0); camera.updateMatrixWorld();
}
/* Dach und Decken aus (Draufsicht) */
function hmDach(an){
  HM.dachAus=!an; if(!HALLE.g) return;
  HALLE.g.traverse(o=>{ if(o.isMesh&&(o.userData.hvMat==='decke'||o.userData.hvMat==='lichtband')) o.visible=an; });
}
/* Menue (Esc oder Laptop) */
function hmMenu(an,perTaste){
  HM.menu=an; let M=$('hmMenu');
  if(!M){ M=document.createElement('div'); M.className='ov'; M.id='hmMenu'; M.innerHTML='<div class="card"></div>'; document.body.appendChild(M);
    M.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; const a=b.dataset.a;
      if(a==='weiter') hmMenu(false);
      else if(a==='ansicht'){ const v=HM_ANSICHTEN[+b.dataset.i]; hmAnsicht(v[1],v[2],v[3],v[4],v[5]); hmMenu(false); }
      else if(a==='anim'){ HALLE.animAn=!HALLE.animAn; hmMenuMalen(); }
      else if(a==='flug'){ HM.flug=!HM.flug; if(!HM.flug) hmDach(true); hmMenuMalen(); }
      else if(a==='gfx'){ try{ localStorage.setItem('bb_gfx',b.dataset.g); }catch(e){} location.reload(); }
      else if(a==='mess'){ hmMenuMalen(true); }
      else if(a==='zurueck'){ try{ sessionStorage.removeItem('bb_modus'); }catch(e){} if(location.hash.indexOf('halle')>=0) location.hash=''; location.reload(); }
    }); }
  M.classList.toggle('show',an);
  for(const k in keys) keys[k]=false; mouseDown=false;
  if(an){ if(locked) document.exitPointerLock(); hmMenuMalen(); }
  else if(!perTaste) requestLock();
}
function hmMenuMalen(mess){
  const M=$('hmMenu'); if(!M) return; const c=M.querySelector('.card');
  let h='<h2>Große Halle</h2><small>Ausbauplan v7 · nur Ansicht, noch ohne Spielablauf. Laufen mit WASD, Umschalt rennt, F schaltet den Flugmodus (Leertaste hoch, C runter).</small>';
  h+='<div class="hmRaster">'+HM_ANSICHTEN.map((v,i)=>`<button class="ghost" data-a="ansicht" data-i="${i}">${v[0]}</button>`).join('')+'</div>';
  h+=`<div class="btns" style="justify-content:flex-start;gap:6px;flex-wrap:wrap"><button data-a="weiter">Weiter</button><button class="ghost" data-a="anim">Animation: ${HALLE.animAn?'an':'aus'}</button><button class="ghost" data-a="flug">Flugmodus: ${HM.flug?'an':'aus'}</button><button class="ghost" data-a="mess">Messwerte je Bereich</button><button class="ghost" data-a="zurueck">Zurück zum Startbildschirm</button></div>`;
  h+='<div style="margin-top:12px"><small>Grafikstufe (lädt die Halle neu):</small><div class="btns hmGfx" style="justify-content:flex-start;gap:6px;flex-wrap:wrap;margin-top:6px">'+GFX_STUFEN.map(g=>`<button class="ghost${g===GFX?' an':''}" data-a="gfx" data-g="${g}">${GFX_NAME[g]}</button>`).join('')+'</div></div>';
  if(mess){ const m=hallMessen(), i=renderer.info;
    h+='<table style="margin-top:12px"><tr><td><b>Bereich</b></td><td><b>Zeichenaufrufe</b></td><td><b>Dreiecke</b></td><td><b>Bauzeit</b></td></tr>'+
      Object.keys(m).map(k=>`<tr><td>${k}</td><td>${m[k].draw}</td><td>${m[k].tri.toLocaleString('de-DE')}</td><td></td></tr>`).join('')+
      Object.keys(HALLE.zeiten).map(k=>`<tr><td><small>${k}</small></td><td></td><td></td><td>${HALLE.zeiten[k]} ms</td></tr>`).join('')+
      `</table><small>Gezählt: alles, was die Halle enthält (Instanzen × Anzahl). Im Bild zuletzt: ${i.render.calls} Aufrufe, ${i.render.triangles.toLocaleString('de-DE')} Dreiecke.</small>`; }
  c.innerHTML=h;
}
function hmEingabe(){
  addEventListener('keydown',e=>{
    if(!HALLE_MODUS) return;
    e.stopImmediatePropagation();
    if(HM.menu){ if(e.code==='Escape'&&!e.repeat) hmMenu(false,true); return; }
    if(e.code==='Escape'){ hmMenu(true); return; }
    keys[e.code]=true;
    if(e.code==='Space'||e.code.indexOf('Arrow')===0) e.preventDefault();
    if(e.code==='KeyE'&&!e.repeat&&hmLaptopNah()) hmMenu(true);
    if(e.code==='KeyF'&&!e.repeat){ HM.flug=!HM.flug; if(!HM.flug) hmDach(true); }
    if(e.code==='KeyM'&&!e.repeat){ hmMenu(true); hmMenuMalen(true); }
  },true);
  addEventListener('pointerlockchange',e=>{
    e.stopImmediatePropagation();
    locked=document.pointerLockElement===canvas; if(locked){ lockWorked=true; if(HM.menu) document.exitPointerLock(); return; }
    if(lockWorked&&!COARSE&&!HM.menu) hmMenu(true);
  },true);
  { const bm=$('btnMenu'); if(bm) bm.addEventListener('touchstart',e=>{ e.preventDefault(); if(!HM.menu) hmMenu(true); },{passive:false}); }
  canvas.addEventListener('mousedown',e=>{ if(HM.menu) return; if(!locked&&!lockFailed) requestLock(); if(e.button===0) mouseDown=true;
    if(COARSE&&hmLaptopNah()) hmMenu(true); });
}
/* Start des Hallenmodus (aus 22-start statt der Spielwelt) */
function halleModusStart(){
  HM.start=performance.now();
  hmLadeschirm(true); startOpen=false; paused=false;
  SPIEL_RAUM=HV7.raum;
  hmLicht();
  initPost();
  hmAnsicht(-27.6,-24.9,Math.PI/2,-0.04);
  hmEingabe();
  hallLaden({umfeld:true},hmFortschritt,()=>{
    hmFortschritt(1,'Shader vorbereiten');
    setTimeout(()=>{
      if(typeof prachtAufbau==='function') prachtAufbau();
      try{ renderer.compile(scene,camera); }catch(e){}
      renderer.info.autoReset=false;
      HM.ladezeit=Math.round(performance.now()-HM.start);
      hmLadeschirm(false);
      HM.last=performance.now(); requestAnimationFrame(hmFrame);
      if(typeof toast==='function') toast(COARSE?'Große Halle: frei begehbar. Am Laptop im Anbruch gibt es das Menü.':'Große Halle: WASD laufen, Maus umsehen, F fliegen. Am Laptop im Anbruch (E) oder mit Esc gibt es das Menü.');
    },30);
  });
  window.__halle={HALLE,HV7,HM,messen:hallMessen,ansicht:hmAnsicht,dach:hmDach,ansichten:HM_ANSICHTEN,renderer,scene,camera,
    get fertig(){ return HALLE.gebaut&&!!HM.ladezeit; },
    info:()=>({calls:renderer.info.render.calls,tri:renderer.info.render.triangles,geo:renderer.info.memory.geometries,tex:renderer.info.memory.textures,prog:renderer.info.programs?renderer.info.programs.length:0}),
    shot:()=>{ noLoop=true; hallTick(0); hmLichtNachfuehren(1); camera.updateMatrixWorld(); renderer.info.reset(); renderFrame(0.016); renderer.info.reset(); renderFrame(0.016); return canvas.toDataURL('image/jpeg',0.85); },
    tick:(sek)=>{ for(let t=0;t<sek;t+=0.05) hallTick(0.05); },
    schiebe:(x,z)=>{ pl.x=x; pl.z=z; collide(pl,0.32); return {x:pl.x,z:pl.z}; },
    zeiten:()=>HALLE.zeiten, fehler:()=>HALLE.fehler||'', gfx:()=>GFX};
}
