/* =========================================================
   LEISTUNGSBERICHT (Fundament Schritt 5, Tom 14.10.2026:
   "Leistungsbericht im Spiel - Tom misst auf seinem PC").
   Pausenmenü (Esc) -> Leistung messen: Das Spiel fährt eine feste Route
   (Laden, Kasse, Halle Süd, Lager, Straße, Hof, Feuerwerk über dem Testfeld; Hochregal und Werk seit dem Rückbau 16.10. weg)
   und misst je Ort 10 s (Feuerwerk 20 s): Bilder/s (Mittel und 1-%-Tief), Bildzeit, CPU-Zeit
   je Bild, Zeichenaufrufe, Dreiecke, Geometrien/Texturen (renderer.info), JS-Heap (falls der
   Browser ihn zeigt). Dazu GPU-Name, Grafikstufe, Auflösung, geschätzter Texturspeicher.
   Optional alle Grafikstufen nacheinander. Ergebnis als Tabelle + Text zum Kopieren.
   Spielstand: Während der Messung wird NICHT gespeichert (save() prüft LM.an); danach lädt das
   Spiel neu und liest den unveränderten Stand. Messung im Vollausbau läuft in der Gameplay-
   Vorführung (17e, eigene Sicherung), "mein Spielstand" nur an Orten, die schon gebaut sind.
   Es kommt keine Wirtschaftszahl vor; die Kennzahlen sind reine Messwerte.
   ========================================================= */
var LM={an:false,ph:'',modus:'spiel',alle:false,dauer:10,feuer:20,einschwing:1,uhr:0,z:null,lauf:null,orte:[],laeufe:[],stufen:[],ri:0,oi:0,
  sicher:null,bericht:null,abbruch:false,start:0,heap0:null,heap1:null};
const LM_KEY='bb_leistung_bericht';
const LM_MB=1048576;
/* Route: Name, Voraussetzung (Ausbau), Pose. Posen aus der Gameplay-Vorführung (GP_ORTE), damit es nur eine Quelle gibt. */
function lmOrte(){
  const gp=n=>{ const o=GP_ORTE.find(x=>x[0]===n); return o?[o[1],o[2],o[3],o[4]]:null; };
  const tf=testfeldMitte();
  const L=[
    ['Laden',null,gp('Verkauf'),LM.dauer],
    ['Kasse',null,gp('Kassen'),LM.dauer],
    ['Halle Süd','shop_sued',gp('Halle Süd'),LM.dauer],
    ['Lager','lager',gp('Lager'),LM.dauer],
    ['Straße',null,[0,12,Math.PI,0.05],LM.dauer],
    ['Hof','lager',[-27,3,-Math.PI/2,0],LM.dauer],
    ['Feuerwerk','testfeld',[tf.x,tf.z+9,0,0.55],LM.feuer]
  ];
  return L.filter(o=>o[2]).map(o=>({name:o[0],braucht:o[1],pose:o[2],dauer:o[3],feuer:o[0]==='Feuerwerk'}));
}
function lmOrtDa(o){ return !o.braucht||LM.modus==='voll'||(S&&S.up&&S.up[o.braucht]); }
/* Gerät und Umgebung (nur lesen) */
function lmGeraet(){
  const g={gpu:'nicht verfügbar (Browser gibt ihn nicht frei)',webgl:'?',kerne:navigator.hardwareConcurrency||'?',ram:navigator.deviceMemory?('mind. '+navigator.deviceMemory+' GB (Browser-Angabe, gerundet)'):'nicht verfügbar',
    browser:(navigator.userAgent.match(/(Firefox|Edg|Chrome|Safari)\/[\d.]+/)||['?'])[0],
    fenster:innerWidth+'x'+innerHeight,dpr:+(window.devicePixelRatio||1).toFixed(2),touch:!!COARSE};
  try{ const gl=renderer.getContext(); g.webgl=(typeof WebGL2RenderingContext!=='undefined'&&gl instanceof WebGL2RenderingContext)?'WebGL 2':'WebGL 1';
    const e=gl.getExtension('WEBGL_debug_renderer_info'); if(e) g.gpu=gl.getParameter(e.UNMASKED_RENDERER_WEBGL); }catch(e){}
  return g;
}
/* Speicher, soweit der Browser ihn zeigt */
function lmHeap(){ try{ const m=performance.memory; return m?Math.round(m.usedJSHeapSize/LM_MB):null; }catch(e){ return null; } }
/* Texturspeicher der Szene (Schätzung, nur Texturen die schon auf der Grafikkarte liegen; Breite x Höhe x 4 Byte, mit Mip-Stufen).
   Zwischenpuffer der Bildnachbearbeitung und Treiber-Zuschläge sind nicht dabei - also eher eine Untergrenze. */
function lmTexturen(){
  const R=renderer, props=R.properties, TEXK=['map','emissiveMap','alphaMap','normalMap','roughnessMap','metalnessMap','bumpMap','aoMap','lightMap','envMap'];
  const gesehen=new Set(); const r={n:0,mb:0,ohneMass:0,groesste:[]};
  const zaehle=t=>{ if(!t||gesehen.has(t)) return; gesehen.add(t);
    let auf=true; try{ const p=props&&props.get?props.get(t):null; auf=!!(p&&p.__webglTexture); }catch(e){}
    if(!auf) return;
    let im=t.image, w=0, h=0, f=1;
    if(t.isCubeTexture&&im&&im[0]){ w=im[0].width||0; h=im[0].height||0; f=6; }
    else if(im){ w=im.width||im.videoWidth||0; h=im.height||im.videoHeight||0; }
    if(!w||!h){ r.ohneMass++; return; }
    const mip=t.generateMipmaps&&t.minFilter!==THREE.LinearFilter&&t.minFilter!==THREE.NearestFilter?4/3:1;
    const b=w*h*(t.type===THREE.FloatType?16:t.type===THREE.HalfFloatType?8:4)*f*mip;
    r.n++; r.mb+=b/LM_MB; if(b>8*LM_MB) r.groesste.push([Math.round(b/LM_MB),w+'x'+h,(t.userData&&t.userData.mat)||t.name||'']); };
  scene.traverse(o=>{ const ms=o.material; if(!ms) return; for(const m of (Array.isArray(ms)?ms:[ms])){ if(!m) continue; for(const k of TEXK) if(m[k]) zaehle(m[k]); } });
  if(scene.background&&scene.background.isTexture) zaehle(scene.background);
  r.mb=Math.round(r.mb); r.groesste.sort((a,b)=>b[0]-a[0]); r.groesste=r.groesste.slice(0,5);
  let sch=0; try{ if(typeof sun!=='undefined'&&sun.shadow&&sun.shadow.map) sch=Math.round(sun.shadow.mapSize.x*sun.shadow.mapSize.y*4/LM_MB); }catch(e){}
  r.schatten=sch; return r;
}
/* ---------- Ablauf ---------- */
function lmStart(o){
  if(LM.an||!S) return false;
  o=o||{};
  LM.modus=o.modus==='voll'?'voll':'spiel'; LM.alle=!!o.alle;
  LM.dauer=o.dauer||10; LM.feuer=o.feuer||20; LM.einschwing=o.einschwing!=null?o.einschwing:1;
  LM.halt=LM.halt||LM.modus==="spiel"; LM.abbruch=false; LM.bericht=null; LM.laeufe=[]; LM.uhr=0; LM.z=null; LM.ri=0; LM.oi=0; LM.start=Date.now();
  LM.sicher={key:null,x:pl.x,z:pl.z,yaw,pitch,gfx:GFX,paused,autoRes:RES,postOn};
  try{ LM.sicher.key=localStorage.getItem(KEY); }catch(e){}
  /* Stufen: ohne Ultra Low-Wechsel (dort wird beim Laden alles anders gebaut - Wechsel braucht Neustart) */
  const alle=GFX_STUFEN.filter(s=>s!=='ultralow');
  LM.stufen=o.stufen&&o.stufen.length?o.stufen:(GFX==='ultralow'?['ultralow']:(LM.alle?alle:[GFX]));
  LM.heap0=lmHeap();
  if(pauseOpen){ pauseOpen=false; $('pause').classList.remove('show'); }
  paused=false;
  LM.an=true; LM.ph='warte';
  renderer.info.autoReset=false;
  if(LM.modus==='voll'&&!gpAn) gpStart();
  lmSperre(true); lmAnzeige();
  return true;
}
function lmSperre(an){
  if(an){ if(!LM._tast){ LM._tast=e=>{ if(!LM.an) return; if(e.code==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); if(e.type==='keydown') lmAbbruch(); return; }
        e.stopImmediatePropagation(); e.preventDefault(); };
      window.addEventListener('keydown',LM._tast,true); window.addEventListener('keyup',LM._tast,true); } }
  let ov=$('lmOv');
  if(an&&!ov){ ov=document.createElement('div'); ov.id='lmOv';
    ov.innerHTML='<div class="lmbox"><b id="lmKopf">Leistung wird gemessen</b><span id="lmZeile"></span><button class="ghost" id="lmStopp">Abbrechen (Esc)</button></div>';
    document.body.appendChild(ov); $('lmStopp').addEventListener('click',lmAbbruch); }
  if(ov) ov.style.display=an?'block':'none';
}
function lmAbbruch(){ if(!LM.an) return; LM.abbruch=true; lmEnde(); }
function lmAnzeige(){
  const k=$('lmKopf'), z=$('lmZeile'); if(!k||!z) return;
  const st=LM.stufen[LM.ri]; const nO=LM.orte.length;
  if(LM.ph==='warte'){ k.textContent='Leistung wird gemessen – Vorbereitung'; z.textContent=LM.modus==='voll'?'Die Vorführung wird aufgebaut …':'Start …'; return; }
  const Z=LM.z; k.textContent='Leistung wird gemessen – Stufe '+GFX_NAME[st]+(LM.stufen.length>1?' ('+(LM.ri+1)+'/'+LM.stufen.length+')':'');
  const rest=Z?Math.max(0,Math.ceil(Z.ort.dauer+LM.einschwing+(Z.extra||0)-Z.t)):0;
  z.textContent=Z?('Ort '+(LM.oi+1)+'/'+nO+': '+Z.ort.name+' – noch '+rest+' s. Bitte nichts drücken.'):'';
}
/* nächster Ort bzw. nächste Stufe */
function lmOrtStart(){
  const o=LM.orte[LM.oi]; if(!o){ lmLaufEnde(); return; }
  if(!lmOrtDa(o)){ LM.lauf.orte.push({name:o.name,fehlt:'nicht gebaut'}); LM.oi++; lmOrtStart(); return; }
  LM.z={ort:o,t:0,extra:LM.oi===0?2:0,roh:[],cpu:[],calls:[],tris:[],nEin:0,erstes:0,heapMax:0,salve:0};
  LM.uhr=o.feuer?1320:0;
  lmAnzeige();
}
function lmLaufStart(){
  const st=LM.stufen[LM.ri];
  if(st!==GFX) gfxAnwenden(st);
  LM.orte=lmOrte();
  LM.lauf={stufe:st,name:GFX_NAME[st],px:+renderer.getPixelRatio().toFixed(2),res:+RES.toFixed(2),
    post:!!postOn,w:renderer.domElement.width,h:renderer.domElement.height,orte:[],tex:null};
  LM.oi=0; lmOrtStart();
}
function lmLaufEnde(){
  LM.lauf.tex=lmTexturen(); LM.lauf.heapEnde=lmHeap();
  LM.laeufe.push(LM.lauf); LM.lauf=null; LM.z=null;
  LM.ri++;
  if(LM.ri>=LM.stufen.length){ lmEnde(); return; }
  lmLaufStart();
}
function lmOrtEnde(){
  const Z=LM.z, a=Z.roh, n=a.length||1;
  const sum=a.reduce((x,y)=>x+y,0)||1e-9;
  const s=a.slice().sort((x,y)=>y-x); const k=Math.max(1,Math.ceil(n*0.01)); const tief=s.slice(0,k).reduce((x,y)=>x+y,0)/k;
  const m=x=>x.length?x.reduce((p,q)=>p+q,0)/x.length:0;
  const info=renderer.info;
  LM.lauf.orte.push({name:Z.ort.name,n:a.length,sek:+sum.toFixed(1),fps:+(n/sum).toFixed(1),tief1:+(1/tief).toFixed(1),ms:+(1000*sum/n).toFixed(1),
    msMax:+(1000*s[0]).toFixed(0),cpu:+m(Z.cpu).toFixed(1),calls:Math.round(m(Z.calls)),tris:Math.round(m(Z.tris)),
    geo:info.memory.geometries,tex:info.memory.textures,prog:info.programs?info.programs.length:null,heap:lmHeap(),heapMax:Z.heapMax||null,
    erstes:Math.round(Z.erstes)});
  LM.oi++; lmOrtStart();
}
/* vor dem Zeichnen: Pose halten (langsamer Schwenk), Zähler der Zeichenaufrufe nullen */
function lmVor(){
  if(!LM.an) return;
  renderer.info.reset();
  const Z=LM.z; if(LM.ph==='warte'||!Z) return;
  const p=Z.ort.pose, f=Z.t/(Z.ort.dauer+LM.einschwing);
  pl.x=p[0]; pl.z=p[1]; yaw=p[2]+0.45*Math.sin(f*Math.PI*2); pitch=p[3]; aim=null;
  camera.position.set(pl.x,1.65,pl.z); camera.rotation.set(pitch,yaw,0); camera.updateMatrixWorld();
}
/* nach dem Zeichnen: roh = echter Bildabstand in s, cpu = Zeit in ms, die das Spiel (Rechnen + Zeichenbefehle) gebraucht hat */
function lmNach(roh,cpu){
  if(!LM.an) return;
  if(LM.ph==='warte'){
    if(LM.modus==='voll'&&!(gpAn&&gpFertig&&!gpBau)){ if((LM._a=(LM._a||0)+1)%20===0) lmAnzeige(); return; }
    LM.heap1=lmHeap(); LM.ph='lauf'; lmLaufStart(); return; }
  const Z=LM.z; if(!Z) return;
  const ein=LM.einschwing+(Z.extra||0);
  Z.t+=roh;
  /* Ankunft: Der Ruckler beim ersten Blick (Shader, Texturen, Geometrie hochladen) steckt in der Rechenzeit des ersten Bildes am neuen
     Ort und im Abstand zum zweiten (Bildabstand = Dauer des Vorgängers). Beides zählt, das größere wird gemeldet. */
  Z.nEin++; if(Z.nEin===1) Z.erstes=cpu; else if(Z.nEin===2) Z.erstes=Math.max(Z.erstes,roh*1000);
  if(Z.t<=ein) return;
  if(Z.ort.feuer&&Z.t>=(Z.salve||0)){ Z.salve=Z.t+2.5; lmFeuer(); }
  Z.roh.push(roh); Z.cpu.push(cpu); Z.calls.push(renderer.info.render.calls); Z.tris.push(renderer.info.render.triangles);
  const h=lmHeap(); if(h&&h>Z.heapMax) Z.heapMax=h;
  if((Z.roh.length&7)===0) lmAnzeige();
  if(Z.t>=ein+Z.ort.dauer) lmOrtEnde();
}
/* Feuerwerk über dem Testfeld: alle 2,5 s eine Salve aus Kugelbomben (Kaliber 4-5) und einer Rakete. Reine Effektaufrufe der
   Feuerwerks-Bibliothek (14) - es wird kein Produkt gezündet, also auch kein Hype, keine Erfahrung, keine Kosten. */
function lmFeuer(){
  try{
    const m=testfeldMitte();
    for(let i=0;i<3;i++) kugelbombe({x:m.x+rand(-7,7),y:1.7,z:m.z-rand(10,16)},i===0?5:4);
    shot({x:m.x+rand(-3,3),y:0.95,z:m.z-6});
  }catch(e){ console.warn('Leistung: Feuerwerk',e); }
}
/* Ende (normal oder Abbruch): Pose, Grafikstufe und Sperre zurück, Bericht bauen und zeigen */
function lmEnde(){
  if(!LM.an) return;
  LM.an=false; LM.uhr=0;
  if(LM.lauf&&LM.lauf.orte.length){ LM.lauf.tex=lmTexturen(); LM.laeufe.push(LM.lauf); }
  LM.lauf=null; LM.z=null;
  renderer.info.autoReset=true;
  const s=LM.sicher; if(s){
    if(s.gfx!==GFX) gfxAnwenden(s.gfx);
    pl.x=s.x; pl.z=s.z; yaw=s.yaw; pitch=s.pitch; }
  /* Sicherheitsnetz: save() ist während der Messung gesperrt; sollte trotzdem etwas geschrieben worden sein, zurückschreiben */
  try{ if(s&&s.key!=null&&localStorage.getItem(KEY)!==s.key&&!gpAn) localStorage.setItem(KEY,s.key); }catch(e){}
  lmSperre(false);
  LM.bericht=lmBauBericht(); LM.bericht.abbruch=LM.abbruch;
  try{ localStorage.setItem(LM_KEY,JSON.stringify(LM.bericht)); }catch(e){}
  paused=true; pauseOpen=false; showPause(); pauseSeite('pLeistung'); lmSeite();
  if(LM.halt&&$('pBtn')) $('pBtn').textContent='Neu laden und weiterspielen';
}
/* ---------- Bericht ---------- */
function lmBauBericht(){
  const g=lmGeraet();
  const hinweise=[];
  const v=LM.laeufe[0];
  if(typeof performance==='undefined'||!performance.memory) hinweise.push('JS-Heap: nicht messbar (dieser Browser gibt ihn nicht frei; Chrome/Edge zeigen ihn).');
  else hinweise.push('JS-Heap: Chrome rundet den Wert grob und aktualisiert ihn selten; er zeigt nur den JavaScript-Speicher, nicht Texturen oder Grafikkarte.');
  hinweise.push('Prozess- und Grafikkartenspeicher insgesamt: nicht messbar aus der Seite. Der Texturspeicher ist eine Schätzung aus den Bildgrößen (Untergrenze).');
  if(LM.stufen.length>1||LM.stufen[0]!==(LM.sicher&&LM.sicher.gfx)) hinweise.push('Stufenwechsel zur Laufzeit: Texturschärfe, Funkenmenge, Spiegelungen und Relief ab „Maximum“ gelten erst nach Neustart; Auflösung, Schatten, Kantenglättung und Bildeffekte wirken sofort.');
  hinweise.push('Bildrate ist durch den Bildschirm gedeckelt (meist 60). „Bildzeit“ = Abstand der Bilder; liegt „CPU/Bild“ deutlich darunter, begrenzt die Grafikkarte (oder der Bildschirm), liegt sie nahe daran, begrenzt der Prozessor.');
  if(LM.modus==='spiel') hinweise.push('Orte, die in deinem Spielstand noch nicht gebaut sind, werden übersprungen.');
  const t=v&&v.tex;
  let vf=null;
  if(LM.modus==='voll'&&t) vf={mb:t.mb,urteil:t.mb>=1300?'über 1,3 GB':'unter 1,3 GB',n:t.n};
  return {version:1,zeit:new Date().toISOString().slice(0,16).replace('T',' '),modus:LM.modus,dauer:LM.dauer,feuer:LM.feuer,geraet:g,
    wahl:GFX_WAHL,wahlName:GFX_WAHL==='auto'?'Automatisch':GFX_NAME[GFX_WAHL],start:GFX_NAME[LM.sicher?LM.sicher.gfx:GFX],res:+RES.toFixed(2),
    heapVor:LM.heap0,heapNachAufbau:LM.heap1,laeufe:LM.laeufe,hinweise,vorfuehrungTex:vf,dauerGesamt:Math.round((Date.now()-LM.start)/1000)};
}
const LM_SP=[['Ort','name'],['Bilder/s','fps'],['1 % tief','tief1'],['Bildzeit ms','ms'],['Spitze ms','msMax'],['CPU/Bild ms','cpu'],['Zeichenaufrufe','calls'],['Dreiecke','tris'],['Geometrien','geo'],['Texturen','tex'],['Heap MB','heap'],['Ankunft ms','erstes']];
const lmZahl=v=>v==null?'–':(typeof v==='number'?v.toLocaleString('de-DE'):v);
function lmText(b){
  const g=b.geraet, T=[];
  T.push('BÖLLERLADEN – LEISTUNGSBERICHT'+(b.abbruch?' (ABGEBROCHEN, nur Teilergebnis)':''));
  T.push('Zeit: '+b.zeit+' | Dauer der Messung: '+b.dauerGesamt+' s | '+(b.modus==='voll'?'Vollausbau (Gameplay-Vorführung)':'mein Spielstand')+' | '+b.dauer+' s je Ort, Feuerwerk '+b.feuer+' s');
  T.push('GPU: '+g.gpu+' | '+g.webgl);
  T.push('Prozessor-Kerne: '+g.kerne+' | RAM: '+g.ram+' | Browser: '+g.browser+(g.touch?' | Touch-Gerät':''));
  T.push('Fenster: '+g.fenster+' | Bildschirm-Skalierung: '+g.dpr+' | Grafik-Wahl: '+b.wahlName+' | Start-Stufe: '+b.start+' | Auflösungsfaktor (Auto): '+b.res);
  if(b.heapVor!=null) T.push('JS-Heap vor der Messung: '+b.heapVor+' MB'+(b.heapNachAufbau!=null?', nach dem Aufbau: '+b.heapNachAufbau+' MB':''));
  for(const l of b.laeufe){
    T.push('');
    T.push('== Stufe '+l.name+' | Rendergröße '+l.w+'x'+l.h+' (pixelRatio '+l.px+') | Bildeffekte '+(l.post?'an':'aus')+' ==');
    const rows=[LM_SP.map(c=>c[0])].concat(l.orte.map(o=>o.fehlt?[o.name,o.fehlt]:LM_SP.map(c=>lmZahl(o[c[1]]))));
    const w=rows[0].map((_,i)=>Math.max(...rows.map(r=>String(r[i]==null?'':r[i]).length)));
    for(const r of rows) T.push(r.map((c,i)=>i?String(c).padStart(w[i]):String(c).padEnd(w[i])).join('  '));
    if(l.tex) T.push('Texturen im Speicher (Schätzung): '+l.tex.mb+' MB in '+l.tex.n+' Texturen'+(l.tex.ohneMass?' (+'+l.tex.ohneMass+' ohne Größenangabe)':'')+', Schattenkarte '+l.tex.schatten+' MB'+(l.tex.groesste.length?' | größte: '+l.tex.groesste.map(x=>x[0]+' MB '+x[1]+' '+x[2]).join('; '):''));
  }
  if(b.vorfuehrungTex) T.push('','Prüfpunkt Vorführung ~1,3 GB Texturen: gemessen '+b.vorfuehrungTex.mb+' MB ('+b.vorfuehrungTex.urteil+', Schätzung).');
  else if(b.modus==='spiel') T.push('','Prüfpunkt Vorführung ~1,3 GB Texturen: nur im Modus „Vollausbau“ prüfbar.');
  T.push('Prüfpunkt Speicherspitze beim ersten Laden-Bild: Spalte „Ankunft ms“ = Ruckler beim ersten Blick an den Ort (größte Bildzeit der ersten zwei Bilder); JS-Heap (Maximum am Ort) in Spalte „Heap MB“ des Orts'+(b.heapVor==null?' – hier nicht messbar.':'.'));
  for(const h of b.hinweise) T.push('Hinweis: '+h);
  return T.join('\n');
}
function lmTabelle(b){
  const g=b.geraet, e=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  let h='<div class="lmkopf"><b>'+(b.abbruch?'Teilergebnis (abgebrochen)':'Ergebnis')+'</b> · '+e(b.zeit)+' · '+(b.modus==='voll'?'Vollausbau':'mein Spielstand')+'<br>'+e(g.gpu)+' · '+g.kerne+' Kerne · '+e(g.fenster)+' · Grafik '+e(b.wahlName)+'</div>';
  for(const l of b.laeufe){
    h+='<h4>Stufe '+e(l.name)+' <small>'+l.w+'×'+l.h+', Bildeffekte '+(l.post?'an':'aus')+'</small></h4><div class="lmtab"><table><thead><tr>'+LM_SP.map(c=>'<th>'+c[0]+'</th>').join('')+'</tr></thead><tbody>';
    for(const o of l.orte){
      if(o.fehlt){ h+='<tr><td>'+e(o.name)+'</td><td colspan="'+(LM_SP.length-1)+'" class="lmfehlt" style="text-align:left">'+e(o.fehlt)+'</td></tr>'; continue; }
      const kl=o.fps<30?' class="lmrot"':o.fps<50?' class="lmgelb"':'';
      h+='<tr>'+LM_SP.map((c,i)=>'<td'+(i===1?kl:'')+'>'+e(lmZahl(o[c[1]]))+'</td>').join('')+'</tr>'; }
    h+='</tbody></table></div>';
    if(l.tex) h+='<small class="phint" style="text-align:left">Texturen (Schätzung): '+l.tex.mb+' MB in '+l.tex.n+' Texturen, Schattenkarte '+l.tex.schatten+' MB</small>';
  }
  if(b.vorfuehrungTex) h+='<p class="lmtext">Vorführung, Texturen: ca. '+b.vorfuehrungTex.mb+' MB ('+b.vorfuehrungTex.urteil+').</p>';
  h+=b.hinweise.map(x=>'<small class="phint" style="text-align:left">'+e(x)+'</small>').join('');
  return h;
}
/* Seite im Pausenmenü */
function lmSeite(){
  let b=LM.bericht; if(!b){ try{ const s=localStorage.getItem(LM_KEY); if(s) b=JSON.parse(s); }catch(e){} }
  const ez=$('lmErgebnis'), td=$('lmDauer'); if(!ez) return;
  const st=(($('lmAlle')&&$('lmAlle').checked)?GFX_STUFEN.length-1:1);
  const min=Math.ceil(st*(8*LM.dauer+LM.feuer+10+8)/60);
  if(td) td.textContent='Dauer etwa '+min+' Min'+(st>1?' (alle Stufen, ohne Ultra Low)':'')+'. Mit Esc jederzeit abbrechen.';
  if(!b){ ez.hidden=true; return; }
  ez.hidden=false; $('lmTab').innerHTML=lmTabelle(b);
  $('lmZurueck').textContent=LM.modus==='voll'&&gpAn?'Fertig – Vorführung beenden, Spiel neu laden':(LM.bericht?'Fertig – Spiel neu laden (Spielstand wie vorher)':'Zurück ins Spiel');
}
function lmKopieren(){
  let b=LM.bericht; if(!b){ try{ b=JSON.parse(localStorage.getItem(LM_KEY)); }catch(e){} } if(!b) return;
  const txt=lmText(b), ta=$('lmText'), st=$('lmKopieStatus');
  const manuell=()=>{ ta.value=txt; ta.hidden=false; ta.focus(); ta.select(); try{ document.execCommand('copy'); }catch(e){} if(st) st.textContent='Text markiert – bitte mit Strg+C (Handy: lange tippen → Kopieren) kopieren.'; };
  try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(()=>{ ta.value=txt; if(st) st.textContent='Bericht kopiert. Jetzt einfügen und an Claude schicken.'; },manuell); return; } }catch(e){}
  manuell();
}
function lmZurueck(){
  if(LM.an) return;
  const spiel=LM.bericht&&LM.modus==='spiel';
  if(gpAn){ gpEnde(); return; }
  if(spiel){ location.reload(); return; }
  closePause();
}
function lmOeffnen(){ if(typeof laptopOpen!=='undefined'&&laptopOpen) closeLaptop(false); showPause(); pauseSeite('pLeistung'); lmSeite(); }
/* Bedienung (Knöpfe der Seite) */
(function(){
  const go=m=>{ const a=$('lmAlle'); lmStart({modus:m,alle:!!(a&&a.checked)}); };
  const b1=$('lmGo'), b2=$('lmGoVoll'), k=$('lmKopie'), z=$('lmZurueck'), a=$('lmAlle');
  if(b1) b1.addEventListener('click',()=>go('spiel'));
  if(b2) b2.addEventListener('click',()=>go('voll'));
  if(k) k.addEventListener('click',lmKopieren);
  if(z) z.addEventListener('click',lmZurueck);
  if(a) a.addEventListener('change',lmSeite);
})();
/* Test: ein Bild wie frame() (Rechnen, Zeichnen, Zählen) ohne rAF. Ohne roh gilt die gemessene Gesamtzeit; ein readPixels wartet auf die
   Grafikkarte (sonst läuft der Befehlsstau davon - in der Software-Grafik der Tests ein paar Sekunden je Bild). */
function lmTakt(roh){
  const t0=performance.now(); lmVor();
  if(S&&!paused) step(Math.min(roh||0.05,0.05));
  renderFrame(Math.min(roh||0.05,0.05));
  try{ const gl=renderer.getContext(); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,LM._px||(LM._px=new Uint8Array(4))); }catch(e){}
  const ms=performance.now()-t0; lmNach(roh||ms/1000,ms);
}
