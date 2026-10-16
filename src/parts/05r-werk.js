/* =========================================================
   Werk West – Halle Etappe B (Kapitel 8 / 8.2 / 8.3, 15.10.2026)
   Bauvorgabe docs/halle/plan-1410.md (Etappe B), Masse aus der Skizze docs/halle/skizze-1410.html (Z, TORE, WEGE, STRASSEN),
   Optik nach docs/uebergabe/produktion-referenz.webp (helle Industrie, Alu-Profile, Rollenbahnen, Portalgreifer, Rohr-Raster).

   - Werk x −100…−70 / z −34…−7, 6 m, Leichtdach mit Lichtbaendern; Verbindungsbau x −70…−66 zwischen zwei Brandwaenden
     (Tueren bei z −9, Foerderoeffnungen mit Brandschutzabschluss), Sammelfoerderer in die West-Enden der Hochregal-Gassen.
   - Raeume: Inertlager, QS-Labor, Leitstand auf der Galerie +3,2 m (Treppe, Glasfront, begehbar), Umkleide/ESD, Sternhaus mit
     Dragiertrommeln, Trockenkammern, drei Chemie-Boxen, Annahme mit Tor R6, Satz-Ausgabe, Leergut.
   - 3 Straßen x 7 Stationen (fabrik, fabrik2, fabrik3): Betonzellen (bk.zelle), Stationsmaschinen (bk.maschine), Portalgreifer,
     Rohr-Raster, Band (bk.foerderer), Palettierer. Schau-Betrieb: Werkstuecke wandern im Takt, Portale fahren, Zellenampeln rot,
     Paletten laufen durch beide Brandwaende ins Hochregal - EINE Update-Funktion (wkTick), nur wenn sichtbar.
   - Aussen: Hof West mit Werkszaun und Einfahrt, Mischhaus hinter dem Erdwall, Gefahrstoffweg.
   Gebaut wird erst beim Kauf (vorher liegt nichts davon im Speicher); Straße 2/3 erst mit fabrik2/fabrik3.
   Produktion (05s-produktion.js, 15.10.): WK.zustand[i] {laeuft = produziert gerade, takt = Takt der Animation, ausgabe}, pdTick aus
   wkTick, WK.produktion (= S.pd.aktiv: Werk-Fixkosten erst ab der ersten eingeschalteten Straße, wkFixkosten), Leitstand-Bildschirme.
   ========================================================= */
const WK={id:'fabrik', werk:{x0:-100,x1:-70,z0:-34,z1:-7}, verb:{x0:-70,x1:-66}, H:6.0, raum:3.2,
  band:{x0:-91.0,p:18/7,y:0.92,b:0.5}, tief:1.65, zelleH:3.1, pal:{x:-71.65},
  sammel:{x:-68.0,z0:-27.9,z1:-12.6,h:0.35},
  treppe:{x0:-78,x1:-76,mitte:-77,fuss:-7.9,kopf:-10.15,z0:-11,y:1.6},
  misch:{x0:-116.5,x1:-111.5,z0:-25.5,z1:-20.5,h:3.2}, erdwall:{x0:-121,x1:-107,z0:-30,z1:-16,luecke:[-115,-112]},
  hof:{x0:-104,x1:-70,z0:-62,z1:-34}, zaunX:-124, einfahrt:[-54,-47], r6:{x:-84,b:3.4,h:3.4}, westTuer:-30.9,
  produktion:false,                 /* true, sobald eine Straße eingeschaltet wurde (05s, S.pd.aktiv) - erst dann Werk-Fixkosten */
  zustand:[0,1,2].map(()=>({laeuft:false,takt:4.0,ausgabe:0})), zahl:{paletten:[0,0,0],takte:0}};
/* Straßen (Skizze STRASSEN): Kuerzel, Arbeitsschritt, Zelle (mannlos), Maschine (bk.maschine-Art, 'portal' = Portalgreifer) */
const WK_STR=[
  {nr:1,up:'fabrik',zc:-13.75,gasse:1,name:'Raketen',st:[['R1','Hülsen und Kappen zuführen',0,'magazin'],['R2','Treiber pressen',1,'presse'],['R3','Effektkopf füllen',1],
    ['R4','Kopf aufsetzen, Kappe kleben',0,'portal'],['R5','Anzündschnur und Schutzkappe',0,'zuendschnur'],['R6','Prüfen',0,'pruef'],['R7','Verpacken',0,'verpack']]},
  {nr:2,up:'fabrik2',zc:-19.25,gasse:2,name:'Kugelbomben',st:[['K1','Halbschalen zuführen',0,'magazin'],['K2','Sterne einlegen',1],['K3','Zerlegerladung',1],
    ['K4','Schließen und bandagieren',0,'wickler'],['K5','Trockentunnel',0,'tunnel'],['K6','Ausstoßladung und Anzünder',1],['K7','Prüfen und verpacken',0,'pruef']]},
  {nr:3,up:'fabrik3',zc:-24.75,gasse:0,name:'Batterien',st:[['B1','Rohre ins Raster setzen',0,'portal'],['B2','Bodenplatte, Zündschnur einspritzen',0,'spritz'],['B3','Ausstoßladung dosieren',1],
    ['B4','Effekte einlegen',1],['B5','Verdämmen und Deckel',0,'verdaemm'],['B6','Banderolieren und Etikett',0,'banderole'],['B7','Prüfen und palettieren',0,'pruef']]}
];
function wkOffen(){ return zoneOffen(WK.id)&&typeof llOffen==='function'&&llOffen(); }
function wkStrasseOffen(i){ return wkOffen()&&zoneOffen(WK_STR[i].up); }
/* Uebergabe in die Gasse: Mitte der Gassenfahrbahn am West-Ende (Brandwand x −66) */
function wkGasseZ(k){ return LL.hr.z0(k)+2.0; }
/* Welt reicht mit dem Werk bis x −124 (Spieler); Wegenetz bleibt, wo es ist - im Werk laeuft (noch) kein Personal */
function wkWeltX0(){ return wkOffen()?WK.zaunX+0.4:NAV.x0+0.4; }
/* Fixkosten Werk: erst ab Produktion (WIRT.fix.werk), dazu je eingeschaltete Straße WIRT.fix.werkStrasse - auch wenn sie gerade
   steht (Stoerung, Rohstoffe aus, Laden zu): eingeschaltet heisst Strom, Druckluft, Bereitschaft (05s pdStrasseAn) */
function wkFixkosten(){ if(typeof S!=='undefined'&&S&&S.pd) WK.produktion=!!S.pd.aktiv; if(!WK.produktion||!wkOffen()) return 0; let f=WIRT.fix.werk;
  for(let i=0;i<3;i++) if(typeof pdStrasseAn==='function'&&pdStrasseAn(i)) f+=WIRT.fix.werkStrasse; return f; }
/* Bodenhoehe: Treppe (zwei Laeufe mit Podest bei 1,6 m) und Leitstand-Galerie +3,2 m. Unter dem Leitstand liegt die Technik -
   abgeschlossen, also gibt es im Grundriss keine Stelle mit zwei Ebenen. */
function wkBoden(x,z){
  if(x<=-86||x>=-76||z<=-11||z>=-7||!WK_G||!WK_G.visible) return 0;
  if(x<-78) return WK.raum;
  const T=WK.treppe, L=T.fuss-T.kopf;
  if(z<=T.kopf) return T.y;
  if(z>=T.fuss) return x>T.mitte?0:WK.raum;
  const t=(T.fuss-z)/L; return x>T.mitte?t*T.y:WK.raum-t*(WK.raum-T.y);
}
/* Animation einer Straße an/aus (05s setzt laeuft je Bild aus dem Produktionszustand) */
function wkStrasseSetzen(i,laeuft){ const z=WK.zustand[i]; if(!z) return; z.laeuft=!!laeuft&&wkStrasseOffen(i); wkAmpeln(); }
/* Palette der Animation hat die Gasse erreicht (gezaehlt; die echte Fertigware lagert 05s pdAusgabeTick ins Hochregal ein) */
function wkAusgabe(i){ WK.zahl.paletten[i]++; WK.zustand[i].ausgabe++; }

/* ---------- Alte Teile, die mit dem Werk weichen (Westwand der Halle Stufe 3, Westzaun und Zufahrt des LKW-Hofs) ---------- */
const WK_ALT={halle:null,halleCols:[],hof:[],hofCols:[]};
function wkAltHalle(g,cols){
  const alt=new THREE.Group(); alt.name='wkAltHalle'; g.add(alt); WK_ALT.halle=alt;
  for(const o of g.children.slice()){ const a=o.userData&&o.userData.aabb;
    if(a&&a.x0<-66.1&&a.x1>-66.1&&a.x1<-65.9&&a.z1-a.z0>20){ g.remove(o); alt.add(o); } }
  for(const c of cols) if(c.minX<-66.1&&c.maxX<-65.9&&c.maxZ-c.minZ>20) WK_ALT.halleCols.push(c);
}
function wkAltHof(neu,cols){ for(const o of neu) WK_ALT.hof.push(o); for(const c of cols) WK_ALT.hofCols.push(c); }

/* Gruppen: WK_G Rohbau (immer sichtbar), WK_H Werk-Inhalt (nur mit Blick ins Werk), WK_D bewegte Teile (wie WK_H, nicht in die
   Laufzeit-Buendelung), WK_A Aussenanlagen (nur von aussen) */
let WK_G=null, WK_H=null, WK_V=null, WK_D=null, WK_A=null, WK_COLS=[], WK_T=null;
function buildWerk(){
  for(const s of WK_STR){ zone(s.up); zHook(s.up,wkAnwenden); }
  zHook('lagerlogistik',wkAnwenden);
}
function wkAnwenden(){
  const an=wkOffen();
  if(an&&!WK_G) wkBauen();
  if(WK_G){ WK_G.visible=an; if(!an){ WK_H.visible=WK_V.visible=WK_D.visible=WK_A.visible=false; } }
  for(const c of WK_COLS){ const d=colliders.indexOf(c)>=0; if(an&&!d) colliders.push(c); else if(!an&&d) dropCol(c); }
  if(an) for(let i=0;i<3;i++) if(wkStrasseOffen(i)&&!WK_T.str[i]) wkStrasseBauen(i);
  if(WK_T) WK_T.str.forEach((st,i)=>{ if(!st) return; const ja=wkStrasseOffen(i); st.g.visible=ja; st.d.visible=ja; st.v.visible=ja;
    for(const c of st.cols){ const d=colliders.indexOf(c)>=0; if(ja&&!d) colliders.push(c); else if(!ja&&d) dropCol(c); }
    WK.zustand[i].laeuft=ja&&typeof pdLaeuft==='function'&&pdLaeuft(i); if(WK_T.blende[i]) for(const b of WK_T.blende[i]) b.visible=!ja; });
  /* alte Westwand der Halle, Westzaun und Zufahrt des LKW-Hofs */
  if(WK_ALT.halle) WK_ALT.halle.visible=!an;
  if(WK_T) wkGlas();
  if(typeof logiAnwenden==='function') logiAnwenden();
  for(const o of WK_ALT.hof) o.visible=!an;
  for(const c of WK_ALT.hofCols){ const d=colliders.indexOf(c)>=0; if(!an&&!d) colliders.push(c); else if(an&&d) dropCol(c); }
  if(typeof llZaunWest==='function') llZaunWest(!an);
  wkAmpeln(); wkMonitore();
  if(typeof hrAnwenden==='function') hrAnwenden();
  if(typeof navDirty==='function') navDirty();
}

/* ---------- Bau (einmal, beim ersten Oeffnen) ---------- */
function wkBauen(){
  const grp=(n,bnd)=>{ const g=new THREE.Group(); g.name=n; g.userData.inventar=true; if(bnd) g.userData._bnd=true; scene.add(g); return g; };
  WK_G=grp('werk'); WK_H=grp('werkInnen'); WK_V=grp('werkVerbindungsbau'); WK_D=grp('werkBewegt',true); WK_A=grp('werkAussen');
  WK_T={str:[null,null,null],tueren:[],blende:[[],[],[]],monitor:null,lichtband:null,trommeln:[],zeit:0,glasBasis:[],glas:[[],[],[]],glasMesh:null};
  const vorC=colliders.length, vorL=LAMPEN.length;
  const fang=(ziel,fn)=>{ const vorS=new Set(scene.children); fn(); for(const o of scene.children.filter(o=>!vorS.has(o))){ scene.remove(o); ziel.add(o); } };
  fang(WK_G,()=>{ wkRohbau(); });
  fang(WK_H,()=>{ wkInnen(); wkRaeume(); wkBoden2(); wkLicht(); });
  fang(WK_A,()=>{ wkAussen(); });
  /* unter dem Dach kein Sonnenschatten (spart den Schattendurchgang): Inhalt nie, Rohbau nur Waende und Dach */
  /* Rohbau: aussen sichtbar bleiben nur Waende (Wandbild), Dach, Boden und die Aussentore/-tueren; Innenausbau (Decken, Treppe, Tueren,
     Chemie-Boxen, Glasfront, Brandschutzabschluesse) wird wie der Inhalt nur mit Blick ins Werk gezeichnet */
  for(const o of WK_G.children.slice()) if(o.userData.bauteil!=='wand'&&!o.userData.wkAussen){ WK_G.remove(o); WK_H.add(o); }
  wkVerbTeilen(WK_H,WK_V);
  WK_H.traverse(o=>{ if(o.isMesh) o.castShadow=false; }); WK_V.traverse(o=>{ if(o.isMesh) o.castShadow=false; });
  WK_G.traverse(o=>{ if(o.isMesh&&o.userData.bauteil!=='wand'&&o.userData.bauteil!=='werkdach') o.castShadow=false; });
  WK_COLS=colliders.slice(vorC); for(const c of WK_COLS) dropCol(c);
  for(let i=vorL;i<LAMPEN.length;i++) LAMPEN[i].id=WK.id;
  wkGlas();
  bk.wandbild();
}
/* Glas im Werk (Leitstand-Front, Labor, Sichtfenster der Zellen, Schutzumhausungen): alle Scheiben EIN Mesh (durchsichtig = nie
   gebuendelt; je Straße ein eigenes Mesh waeren +3 Zeichenaufrufe). Die Sammler geben ihre Scheiben-Teile hier ab (wkGlasNehmen),
   das Mesh wird bei jedem Bau/Ausbau neu zusammengesetzt (nur offene Straßen). */
function wkGlasNehmen(S){ const t=S.L.scheibe||[]; S.L.scheibe=[]; return t; }
function wkGlas(){
  if(!WK_T) return; const alt=WK_T.glasMesh;
  if(alt){ alt.parent&&alt.parent.remove(alt); alt.geometry.dispose(); WK_T.glasMesh=null; }
  const t=WK_T.glasBasis.slice(); WK_T.str.forEach((st,i)=>{ if(st&&wkStrasseOffen(i)) t.push(...WK_T.glas[i]); });
  if(!t.length) return;
  const me=new THREE.Mesh(merge(t),MAT.get('glasScheibe')); me.userData.bauteil='glas'; me.castShadow=false; me.matrixAutoUpdate=false; me.updateMatrix();
  WK_H.add(me); WK_T.glasMesh=me;
}
/* Was in den Verbindungsbau reicht (Sammelfoerderer, Ausgangsfoerderer, Uebergaben, Schilder), kommt in eine eigene Gruppe: aus dem
   Verbindungsbau und durch die Tuer der Halle sieht man nur sie, nicht das ganze Werk (Instanzen und Sammler ueber das Werk bleiben) */
const _wkVb=new THREE.Box3();
function wkVerbTeilen(von,nach){ for(const o of von.children.slice()){ if(o.isInstancedMesh) continue; _wkVb.setFromObject(o);
  if(!_wkVb.isEmpty()&&_wkVb.max.x>-70.1&&_wkVb.min.x>-73.0){ von.remove(o); nach.add(o); } } }
/* Wandstueck (Kollision nur, wenn es am Boden steht); fi/fa = Flaeche innen/aussen (Art oder Material) */
function wkW(x0,x1,z0,z1,y0,y1,innen,fi,fa,still,ohneKol){
  if(x1-x0<0.01||z1-z0<0.01||y1-y0<0.01) return null;
  const m=bk.wand({x0,x1,z0,z1,y0,y1,innen,flaechen:{innen:fi,aussen:fa,laibung:'laibung'},ue:0,still});
  if(y0<0.05&&!ohneKol) col(x0,x1,z0,z1);
  return m; }
/* Wand mit Oeffnungen laengs einer Achse: laengs 'x' (Wand laeuft in x bei z0..z1) oder 'z'. oeff = [[a0,a1,hoehe],...] */
function wkWandMit(laengs,a0,a1,q0,q1,h,oeff,innen,fi,fa){
  const L=oeff.slice().sort((p,q)=>p[0]-q[0]); let a=a0;
  const st=(u0,u1,y0,y1,still)=>laengs==='x'?wkW(u0,u1,q0,q1,y0,y1,innen,fi,fa,still):wkW(q0,q1,u0,u1,y0,y1,innen,fi,fa,still);
  for(const [o0,o1,oh] of L){ st(a,o0,0,h); st(o0,o1,oh,h,true); a=o1; }
  st(a,a1,0,h);
}
function wkRohbau(){
  const Wr=WK.werk, H=WK.H, B=MAT.get('betonZelle'), F=MAT.farbe;
  /* Boden Werk + Verbindungsbau (wie die Hallenboeden: ohne Sonnenschatten) */
  { const w=WK.verb.x1-Wr.x0, d=Wr.z1-Wr.z0, bo=new THREE.Mesh(MAT.kachel(new THREE.PlaneGeometry(w,d),w/2,d/2),MAT.get('betonBoden'));
    bo.rotation.x=-Math.PI/2; bo.position.set((Wr.x0+WK.verb.x1)/2,0.015,(Wr.z0+Wr.z1)/2); bo.userData.wkAussen=true; scene.add(bo); }
  /* Aussenwaende: Trapezblech aussen, Lagerwand innen (wie die Halle) */
  wkWandMit('x',Wr.x0-LW,WK.verb.x1-LW,Wr.z1,Wr.z1+LW,H,[[-73.6,-72.4,2.2]],'-z','lager','blech');            /* Nord, Werkseingang */
  wkWandMit('x',Wr.x0-LW,WK.verb.x1-LW,Wr.z0-LW,Wr.z0,H,[[WK.r6.x-WTOR.w/2,WK.r6.x+WTOR.w/2,WTOR.h]],'+z','lager','blech');   /* Sued, Tor R6 */
  wkWandMit('z',Wr.z0-LW,Wr.z1+LW,Wr.x0-LW,Wr.x0,H,[[WK.westTuer-0.6,WK.westTuer+0.6,2.2]],'+x','lager','blech');       /* West, Gefahrstofftuer */
  /* Brandwand Werk | Verbindungsbau (x −70): Beton beidseitig, 60 cm ueber Dach; Tuer z −9, Foerderoeffnungen je Straße */
  const OA=[[-10,-8,2.2]].concat(WK_STR.map(s=>[s.zc-0.65,s.zc+0.65,1.9]));
  wkWandMit('z',Wr.z0,Wr.z1,-70.1,-69.9,H+0.6,OA,'-x',B,B);
  /* Brandwand Verbindungsbau | Halle (x −66, ersetzt die Westwand der Halle Stufe 3): Hallenseite Lagerwand, Verbindungsbau Beton,
     ueber dem Verbindungsbau Trapezblech; Tuer z −9, Uebergaben in die Gassen */
  const OB=[[-10,-8,2.2]].concat([0,1,2].map(k=>[wkGasseZ(k)-0.6,wkGasseZ(k)+0.6,1.9]));
  wkWandMit('z',Wr.z0-0.1,Wr.z1+0.1,-66.2,-66.0,H,OB,'+x','lager',B);
  wkW(-66.2,-66.0,Wr.z0-0.1,Wr.z1+0.1,H,11.0,'+x','lager','blech',true);
  /* Brandwand-Kennzeichnung: roter Streifen oben, Schilder */
  { const S=bk.werkSammler('brandwand');
    for(const x of [-70.13,-69.87]) S.box(0.01,0.25,Wr.z1-Wr.z0-0.4,x,H-0.45,(Wr.z0+Wr.z1)/2,F('feuerrot'),'lackMetall');
    S.box(0.01,0.25,Wr.z1-Wr.z0-0.4,-66.22,H-0.45,(Wr.z0+Wr.z1)/2,F('feuerrot'),'lackMetall');
    /* Brandschutzabschluesse ueber den Foerderoeffnungen: Gehaeuse, Fuehrungen, Rauchmelder */
    const absch=(x,z,b,h,s)=>{ S.box(0.3,0.32,b+0.3,x+s*0.17,h+0.18,z,F('lichtgrau'),'lackMetall'); S.box(0.31,0.06,b+0.32,x+s*0.17,h+0.03,z,F('feuerrot'),'lackMetall');
      for(const q of [-1,1]) S.box(0.08,h,0.08,x+s*0.06,h/2,z+q*(b/2+0.05),F('anthrazit'),'stahl');
      S.zyl(0.06,0.06,0.04,10,x+s*0.17,h+0.36,z+b/2-0.1,F('weiss'),'kunststoff'); };
    for(const s of WK_STR) absch(-70.1,s.zc,1.3,1.9,1);
    for(let k=0;k<3;k++) absch(-66.0,wkGasseZ(k),1.2,1.9,-1);
    S.fertig(scene,{fest:true});
    for(const z of [-30,-17]){ bk.schild(scene,{text:'BRANDWAND',unter:'Öffnungen nur mit Brandschutzabschluss',b:1.6,h:0.45,x:-70.12,y:4.6,z,ry:Math.PI/2*-1,stil:'brand'});
      bk.schild(scene,{text:'BRANDWAND',unter:'Werk · Verbindungsbau',b:1.6,h:0.45,x:-69.88,y:4.6,z,ry:Math.PI/2,stil:'brand'}); } }
  /* geschlossene Brandschutz-Blenden in den Oeffnungen (fallen, sobald die Straße laeuft) */
  { const bl=(x,z,b,h,i)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(0.06,h,b),MAT.get('kunststoffHellgrau')); m.position.set(x,h/2,z); m.userData.bauteil='brandschutzabschluss'; scene.add(m); WK_T.blende[i].push(m); };
    WK_STR.forEach((s,i)=>{ bl(-70.0,s.zc,1.3,1.9,i); bl(-66.1,wkGasseZ(s.gasse),1.2,1.9,i); });
    /* Kollision der Oeffnungen: das Band bzw. die Blende sperrt sie fuer Fussgaenger */
    for(const s of WK_STR) col(-70.1,-69.9,s.zc-0.65,s.zc+0.65);
    for(let k=0;k<3;k++) col(-66.2,-66.0,wkGasseZ(k)-0.6,wkGasseZ(k)+0.6); }
  /* Tuere Verbindungsbau: Feuerschutztueren zweifluegelig, offen auf Feststellanlage; Werkseingang (oeffnet beim Naehern) */
  for(const x of [-70.0,-66.1]){ for(const a of [1,-1]){ const T=bk.tuer({x,z:-9+a*0.5,ry:Math.PI/2,breite:1.0,hoehe:2.15,dicke:0.2,art:'brand',anschlag:a,auf:x>-68?-1:1,offen:1}); }
    const S=bk.werkSammler('feststellanlage'); S.box(0.12,0.16,0.3,x+(x>-68?-0.12:0.12),2.42,-9,F('feuerrot'),'kunststoff'); S.zyl(0.07,0.07,0.04,10,x+(x>-68?-0.12:0.12),2.52,-9.3,F('weiss'),'kunststoff'); S.fertig(scene,{fest:true}); }
  WK_T.tueren.push({T:bk.tuer({x:-73,z:-6.9,ry:0,breite:1.2,hoehe:2.2,dicke:0.2,art:'glas',anschlag:1,auf:-1}),x:-73,z:-6.9,r:2.0}); WK_T.tueren[WK_T.tueren.length-1].T.g.userData.wkAussen=true;
  /* Tor R6 (Rohstoffe) - Sektionaltor wie R2-R5, zu (Anlieferung der Rohstoffe kommt mit dem Produktions-Gameplay) */
  { const T=bk.tor({art:'sektional',fuehrung:'vertikal',breite:WTOR.w,hoehe:WTOR.h,wand:[-LW,0],blatt:-0.15,fahrzeug:2.55,nr:'6',bedien:1,x:WK.r6.x,z:Wr.z0,ry:-Math.PI/2});
    for(const r of T.kollision) col(r.x0,r.x1,r.z0,r.z1); col(WK.r6.x-WTOR.w/2,WK.r6.x+WTOR.w/2,Wr.z0-LW,Wr.z0); WK_T.r6=T; T.g.userData.wkAussen=true; }
  /* Gefahrstofftuer West (zu, Chemie-Box 1) */
  { const S=bk.werkSammler('tuer'); bk.tuer({S,x:Wr.x0-LW/2,z:WK.westTuer,ry:Math.PI/2,breite:1.0,hoehe:2.1,dicke:LW,art:'brand'}); S.fertig(scene,{fest:true,nachher:me=>{ me.userData.wkAussen=true; }}); col(Wr.x0-LW,Wr.x0,WK.westTuer-0.6,WK.westTuer+0.6); }
  /* Leichtdach: helles Trapezblech, Lichtbaender (aussen sichtbar), Attika; Decke innen hell */
  { const x0=Wr.x0-LW*1.5, x1=WK.verb.x1-LW, z0=Wr.z0-LW*1.5, z1=Wr.z1+LW*1.5, w=x1-x0, d=z1-z0, cx=(x0+x1)/2, cz=(z0+z1)/2;
    const dach=new THREE.Mesh(bk.kastenM(w,0.25,d,1,cx,H+0.24,cz),MAT.get('wandBlech')); dach.position.set(cx,H+0.24,cz); dach.userData.bauteil='werkdach'; dach.userData.wkAussen=true;
    if(HIQ){ dach.castShadow=true; dach.receiveShadow=true; } scene.add(dach);
    const S=bk.werkSammler('werkdach');
    for(const s of WK_STR) S.box(26.2,0.08,1.7,-85,H+0.4,s.zc,F('glasKlar'),'kunststoff');
    for(const [ax,az,bx,bz] of [[x0,z0,x1,z0],[x0,z1,x1,z1]]) S.box(bx-ax,0.3,0.12,(ax+bx)/2,H+0.5,az,F('anthrazit'),'lackMetall');
    for(const x of [x0,x1]) S.box(0.12,0.3,d,x,H+0.5,cz,F('anthrazit'),'lackMetall');
    S.fertig(scene,{fest:true,schatten:false,nachher:me=>{ me.userData.wkAussen=true; }});
    const ce=new THREE.Mesh(new THREE.PlaneGeometry(WK.verb.x1-Wr.x0,Wr.z1-Wr.z0),MAT.get('weissMatt')); ce.rotation.x=Math.PI/2; ce.position.set((Wr.x0+WK.verb.x1)/2,H-0.01,(Wr.z0+Wr.z1)/2); scene.add(ce); }
  /* Raumzeile Nord (z −11…−7): Inertlager, QS-Labor, Technik unter dem Leitstand (Galerie +3,2 m, Glasfront), Treppe, Umkleide */
  const R=WK.raum, zr=-11, P='putz';
  wkWandMit('x',Wr.x0,-92,zr-0.1,zr+0.1,3.6,[[-96.9,-95.1,2.4]],'+z',P,'lager');   /* bis zur Decke des Sternhauses (3,6 m) */
  wkWandMit('x',-92,-86,zr-0.1,zr+0.1,R,[[-89.5,-88.5,2.15]],'+z',P,'lager');
  wkW(-86,-78,zr-0.1,zr+0.1,0,R,'+z',P,'lager');                                     /* Technik (zu) */
  wkW(-86,-78,zr-0.1,zr+0.1,R,4.1,'+z',P,'lager',true); wkW(-86,-78,zr-0.1,zr+0.1,5.7,H,'+z',P,'lager',true);   /* Bruestung, Sturz der Glasfront */
  wkW(-78,-76,zr-0.1,zr+0.1,0,H,'+z',P,'lager');                                      /* Treppenhaus */
  wkWandMit('x',-76,-70.1,zr-0.1,zr+0.1,R,[[-75.0,-74.0,2.15]],'+z',P,'lager');
  wkW(-92.1,-91.9,zr+0.1,Wr.z1,0,R,'+x',P,P);
  wkW(-86.1,-85.9,zr+0.1,Wr.z1,0,H,'+x',P,P);
  /* x −78: Technik | Treppe (unten), Leitstand | Treppe (oben) mit Tuer am oberen Podest */
  wkW(-78.1,-77.9,zr+0.1,-7.9,0,H,'+x',P,P); wkW(-78.1,-77.9,-7.1,Wr.z1,0,H,'+x',P,P);
  wkW(-78.1,-77.9,-7.9,-7.1,0,R,'+x',P,P,true,true);   /* unter der Leitstand-Tuer: Wand, aber keine Kollision (oben geht man durch) */ wkW(-78.1,-77.9,-7.9,-7.1,R+2.1,H,'+x',P,P,true);
  /* x −76: Treppe | Umkleide, Durchgang unten am Fuss der Treppe */
  wkW(-76.1,-75.9,zr+0.1,-7.9,0,H,'+x',P,P); wkW(-76.1,-75.9,-7.1,Wr.z1,0,H,'+x',P,P); wkW(-76.1,-75.9,-7.9,-7.1,2.15,H,'+x',P,P,true);
  /* Decken der Raumzeile bei 3,2 m (Leitstand: Galerieboden), Podeste der Treppe */
  { const S=bk.werkSammler('decke'), dk=(x0,x1,z0,z1,y)=>S.box(x1-x0,0.2,z1-z0,(x0+x1)/2,y-0.1,(z0+z1)/2,F('weiss'),'matt');
    dk(Wr.x0,-92.1,zr+0.1,Wr.z1,R); dk(-91.9,-86.1,zr+0.1,Wr.z1,R); dk(-85.9,-78.1,zr+0.1,Wr.z1,R); dk(-75.9,-70.1,zr+0.1,Wr.z1,R);
    dk(-77.9,-76.1,zr+0.1,WK.treppe.kopf,WK.treppe.y); dk(-77.9,-77.0,WK.treppe.fuss,Wr.z1,R);
    S.fertig(scene,{fest:true});
    const bo=new THREE.Mesh(MAT.kachel(new THREE.PlaneGeometry(7.8,3.9),7.8/2,3.9/2),MAT.get('betonBoden')); bo.rotation.x=-Math.PI/2; bo.position.set(-82,R+0.004,-8.95); scene.add(bo); }
  /* Treppe: zwei Laeufe mit Podest, Trennung in der Mitte (Gelaender, Kollision) */
  { const S=bk.werkSammler('treppe'), T=WK.treppe;
    bk.treppe({S,von:[-76.52,T.fuss],bis:[-76.52,T.kopf],breite:0.86,y0:0,y1:T.y,gelaender:[true,false]});
    bk.treppe({S,von:[-77.48,T.kopf],bis:[-77.48,T.fuss],breite:0.86,y0:T.y,y1:R,gelaender:[true,false]});
    for(const y of [1.0,0.5]) S.box(0.04,0.04,0.86,-77.0,R+y,-7.47,F('signalgelb'),'lackMetall');   /* oberes Podest: Absturzsicherung zum unteren Lauf */
    S.box(0.04,1.0,0.04,-77.0,R+0.5,-7.08,F('signalgelb'),'lackMetall');
    S.fertig(scene,{fest:true});
    col(-77.06,-76.94,T.kopf,Wr.z1); }
  /* Glasfront Leitstand (z −11, 4,1-5,7 m): Scheiben, Alu-Pfosten */
  { const S=bk.werkSammler('leitstand');
    S.box(8.0,1.6,0.02,-82,4.9,zr,F('glasKlar'),'scheibe');
    for(let i=0;i<=4;i++) S.box(0.08,1.62,0.12,-86+i*2,4.9,zr,F('aluminium'),'lackMetall');
    for(const y of [4.1,5.7]) S.box(8.0,0.08,0.14,-82,y,zr,F('aluminium'),'lackMetall');
    WK_T.glasBasis.push(...wkGlasNehmen(S)); S.fertig(scene,{fest:true}); }
  /* Technik-Tuer (zu) */
  { const S=bk.werkSammler('tuer'); bk.tuer({S,x:-80,z:zr,ry:0,breite:1.0,hoehe:2.1,dicke:0.2,art:'stahl'}); S.fertig(scene,{fest:true}); col(-80.5,-79.5,zr-0.1,zr+0.1); }
  /* Tueren mit Schliesser (oeffnen beim Naehern): Umkleide -> Werk, Inertlager (zweifluegelig), Labor */
  for(const [x,b,a] of [[-74.5,1.0,1],[-89,1.0,-1]]) WK_T.tueren.push({T:bk.tuer({x,z:zr,ry:0,breite:b,hoehe:2.1,dicke:0.2,art:'stahl',anschlag:a,auf:-1}),x,z:zr,r:1.7});
  for(const a of [1,-1]) WK_T.tueren.push({T:bk.tuer({x:-96+a*0.45,z:zr,ry:0,breite:0.9,hoehe:2.35,dicke:0.2,art:'stahl',anschlag:a,auf:-1}),x:-96,z:zr,r:2.0});
  /* Raeume West (x −100…−92): Sternhaus, drei Trockenkammern (3,6 m, Decke) */
  const RW=3.6;
  wkWandMit('z',-27.5,zr-0.1,-92.1,-91.9,RW,[[-17.1,-15.9,2.2],[-26.53,-25.63,2.05],[-23.7,-22.8,2.05],[-20.87,-19.97,2.05]],'-x','putz','lager');
  for(const z of [-19,-21.83,-24.67]) wkW(Wr.x0,-92.1,z-0.1,z+0.1,0,RW,'+z',P,P);
  { const S=bk.werkSammler('decke'); S.box(8,0.2,16.5,-96,RW+0.1,(-27.5+zr)/2,F('weiss'),'matt'); S.fertig(scene,{fest:true});
    const St=bk.werkSammler('tuer'); for(const z of [-26.08,-23.25,-20.42]) bk.tuer({S:St,x:-92,z,ry:Math.PI/2,breite:0.9,hoehe:2.05,dicke:0.2,art:'stahl'}); St.fertig(scene,{fest:true});
    for(const z of [-26.08,-23.25,-20.42]) col(-92.1,-91.9,z-0.45,z+0.45); }
  WK_T.tueren.push({T:bk.tuer({x:-92,z:-16.5,ry:Math.PI/2,breite:1.2,hoehe:2.2,dicke:0.2,art:'stahl',anschlag:1,auf:1}),x:-92,z:-16.5,r:1.8});
  /* Raeume Sued (z −34…−27,5): drei Chemie-Boxen, Satz-Ausgabe (Betonzellen ohne Band), Annahme, Leergut */
  { const S=bk.werkSammler('chemie'), C=[];
    const box=(x0,x1,tueren)=>{ const r=bk.zelle({S,x0,x1,z0:-33.8,z1:-27.5,h:RW,band:false,tueren}); C.push(r.kollision); };
    box(-99.8,-96,[{seite:1,x:-97.9},{seite:'w',z:WK.westTuer}]); box(-96,-92,[{seite:1,x:-94}]); box(-92,-88,[{seite:1,x:-90}]); box(-80,-76,[{seite:1,x:-78}]);
    S.fertig(scene,{fest:true});
    for(const c of C) col(c.x0,c.x1,c.z0,c.z1); }
  /* Verbindungsbau: Raster-Leuchten unter dem Dach */
  bk.lampe({art:'raster',r:{x0:-69.9,x1:-66.2,z0:-33.8,z1:-7.2},y:H,ax:3.6,az:4.5,panel:deckenPanelMat()});
  roomAO(-69.9,-66.2,Wr.z0,Wr.z1,null,{n:true,s:true,w:true,e:true});
}
/* Schild frei im Raum an zwei Abhaengern unter dem Dach (wie 05q llHaengend) */
function wkHaengend(o){ bk.schild(scene,o); const S=bk.sammler({bauteil:'schild'}), c=Math.cos(o.ry||0), s=Math.sin(o.ry||0), y0=o.y+o.h/2, L=(o.decke||WK.H)-y0;
  for(const d of [-1,1]) S.box(0.012,L,0.012,o.x+d*(o.b/2-0.1)*c,y0+L/2,o.z-d*(o.b/2-0.1)*s,MAT.farbe('silbergrau'),'stahl');
  S.box(o.b,0.04,0.04,o.x,y0+0.02,o.z,MAT.farbe('anthrazit'),'lackMetall',0,o.ry||0,0); S.fertig(scene,{fest:true,schatten:false}); }
/* Werk-Inhalt, der allen Straßen gehoert: Dachtragwerk, Lichtbaender, Ueberkopf-Foerderer vom Inertlager, Sammelfoerderer im
   Verbindungsbau, Satzkanal-Abdeckung, Beschilderung */
function wkInnen(){
  const F=MAT.farbe, H=WK.H, Wr=WK.werk, L=bk.lod();
  /* Fachwerkbinder alle 5 m (hell lackiert), Pfetten */
  { const S=bk.werkSammler('tragwerk',{fase:0.006,faseMin:0.05,lod0Kasten:true}), C=F('lichtgrau');
    for(const x of [-95,-90,-85,-80,-75]){ S.box(0.12,0.12,Wr.z1-Wr.z0,x,H-0.12,(Wr.z0+Wr.z1)/2,C,'lackMetall'); S.box(0.1,0.1,Wr.z1-Wr.z0,x,H-1.0,(Wr.z0+Wr.z1)/2,C,'lackMetall');
      const n=L?18:9; for(let i=0;i<=n;i++){ const z=Wr.z0+i*(Wr.z1-Wr.z0)/n; S.box(0.06,0.84,0.06,x,H-0.56,z,C,'lackMetall');
        if(i<n&&L) bk.balken(S,[x,H-0.95,z],[x,H-0.17,z+(Wr.z1-Wr.z0)/n],0.05,C,'lackMetall'); } }
    for(const z of [-30,-24,-18,-12]) S.box(Wr.x1-Wr.x0,0.1,0.08,(Wr.x0+Wr.x1)/2,H-0.07,z,C,'lackMetall');
    S.fertig(scene,{fest:true,schatten:false}); }
  /* Lichtbaender ueber den Straßen (Tageslicht, zugleich Rauch- und Waermeabzug); Leuchtstaerke folgt der Sonne (wkTick) */
  { const parts=[]; for(const s of WK_STR) parts.push({geo:new THREE.PlaneGeometry(26,1.4),m:tm(-85,H-0.03,s.zc,Math.PI/2,0,0),color:0xffffff});
    WK_T.lichtband=new THREE.Mesh(merge(parts),MAT.neu('lichtband')); WK_T.lichtband.userData.bauteil='lichtband'; scene.add(WK_T.lichtband);
    const S=bk.sammler({bauteil:'lichtband'}); for(const s of WK_STR) for(const q of [-1,1]) S.box(26.2,0.1,0.07,-85,H-0.06,s.zc+q*0.74,F('aluminium'),'lackMetall');
    S.fertig(scene,{fest:true,schatten:false}); }
  /* Senkrechtfoerderer im Inertlager (bis 4,2 m) und Ueberkopf-Foerderer: ueber der Raumzeile nach Osten, dann nach Sueden ueber
     die ersten Stationen aller Straßen (Abwurf je Straße kommt mit der Straße) */
  { const S=bk.werkSammler('foerderer');
    S.box(0.9,4.7,0.9,-96,2.35,-9.0,F('lichtgrau'),'lackMetall'); S.box(0.95,0.1,0.95,-96,4.72,-9.0,F('anthrazit'),'lackMetall');
    S.box(0.02,1.2,0.5,-95.54,3.9,-9.0,F('signalgelb'),'lackMetall');
    S.fertig(scene,{fest:true});
    bk.foerderer({von:[-95.5,-9.0],bis:[-90.4,-9.0],breite:0.45,hoehe:4.2,teilung:0.12,decke:H-0.2,antrieb:false});
    bk.foerderer({von:[-90.4,-9.25],bis:[-90.4,-25.4],breite:0.45,hoehe:4.2,teilung:0.12,decke:H-0.2}); }
  /* Sammelfoerderer im Verbindungsbau (Paletten der Straßen -> Uebergaben in die Gassen) */
  { const Q=WK.sammel; WK_T.sammel=bk.foerderer({von:[Q.x,Q.z1],bis:[Q.x,Q.z0],breite:1.0,hoehe:Q.h});
    const c=WK_T.sammel.kollision; col(c.x0,c.x1,c.z0,c.z1);
    bk.schild(scene,{text:'SAMMELFÖRDERER',unter:'Fertigware → Hochregal · Gassen 1–3',b:1.7,h:0.46,x:-66.24,y:3.2,z:-20.5,ry:-Math.PI/2}); }
  /* Satzkanal (unter Flur): Abdeckung aus Riffelblech von der Satz-Ausgabe zu den Fuellzellen */
  { const S=bk.werkSammler('satzkanal'), C=F('silbergrau');
    S.box(8.6,0.012,0.7,-82,0.021,-26.95,C,'stahl'); S.box(0.7,0.012,15.6,-85.95,0.021,-19.15,C,'stahl');
    for(let x=-86;x<-77.5;x+=1.2) S.box(0.02,0.014,0.7,x,0.022,-26.95,F('mittelgrau'),'stahl');
    for(let z=-26.6;z<-11.4;z+=1.2) S.box(0.7,0.014,0.02,-85.95,0.022,z,F('mittelgrau'),'stahl');
    S.fertig(scene,{fest:true,schatten:false}); }
  /* Beschilderung: Raeume, Fluchtwege */
  const fw={bg:MAT.css('signalgruen'),fg:MAT.css('weiss')}, gef={bg:MAT.css('feuerrot'),fg:MAT.css('weiss')};
  const sch=(text,unter,x,y,z,ry,o)=>bk.schild(scene,Object.assign({text,unter,b:1.5,h:0.42,x,y,z,ry},o||{}));
  sch('INERTLAGER','Hülsen · Pappe · Etiketten',-96,2.75,-11.12,Math.PI);
  sch('QS-LABOR','Waage · Röntgen · Satzproben',-89,2.75,-11.12,Math.PI);
  sch('TECHNIK','Druckluft · Elektro',-80,2.6,-11.12,Math.PI,{b:1.2});
  sch('LEITSTAND','↑ Galerie +3,2 m · Treppe',-74.5,2.6,-11.12,Math.PI,{b:1.6});
  sch('UMKLEIDE · ESD','Nur mit leitfähigen Schuhen',-74.5,2.6,-10.88,0,{b:1.6});
  sch('STERNHAUS','Dragiertrommeln · Holz und Messing',-91.88,2.75,-16.5,Math.PI/2,{b:1.7});
  [-26.08,-23.25,-20.42].forEach((z,i)=>sch('TROCKENKAMMER '+(i+1),'Sterne und Kugeln',-91.88,2.6,z,Math.PI/2,{b:1.2,h:0.36}));
  [['CHEMIE 1','Oxidatoren',-97.9],['CHEMIE 2','Metallpulver · Brennstoffe',-94],['CHEMIE 3','Schwarzpulver',-90]].forEach(([t,u,x])=>sch(t,u,x,2.75,-27.48,0,Object.assign({b:1.4},gef)));
  sch('SATZ-AUSGABE','Tagesmenge · Shuttle zum Satzkanal',-78,2.75,-27.48,0,Object.assign({b:1.6},gef));
  sch('ANNAHME','Tor 6 · Rohstoffe',-84,3.8,-33.97,0,{b:1.6});
  sch('LEERGUT','Ausschuss · Abfall',-73,2.2,-27.3,0,{b:1.3,h:0.38});
  sch('NOTAUSGANG','↑ Werkseingang',-73,2.55,-7.13,Math.PI,Object.assign({b:1.2,h:0.38},fw));
  sch('FLUCHTWEG','→ Verbindungsbau · Halle',-70.12,2.65,-11.6,-Math.PI/2,Object.assign({b:1.3,h:0.38},fw));
  sch('FLUCHTWEG','← Werk · → Halle',-68,2.55,-7.13,Math.PI,Object.assign({b:1.2,h:0.38},fw));
  sch('VERBINDUNGSBAU','Werk ↔ Halle',-66.24,2.75,-9,-Math.PI/2,{b:1.5});
  sch('WERK','Fertigung · Leitstand',-65.97,2.75,-9,Math.PI/2,{b:1.4});
  wkHaengend(Object.assign({text:'FLUCHTWEG',unter:'↓ Querweg · Ausgang Nord',b:1.3,h:0.38,x:-91.5,y:3.0,z:-19.25,ry:Math.PI/2},fw));
}
/* Raeume: Inertlager, Labor, Leitstand, Umkleide, Sternhaus, Annahme, Leergut */
function wkRaeume(){
  const F=MAT.farbe, S=bk.werkSammler('werkraum'), C=[], L=bk.lod(), seg=[8,12,16][L];
  /* Inertlager: Paletten mit Pappe/Huelsen, Fachbodenregal */
  const P=[];
  for(const [x,z] of [[-98.8,-8.0],[-97.3,-8.0],[-98.8,-10.0],[-93.6,-8.0]]){ P.push({x,z,ry:Math.PI/2});
    for(let k=0;k<5;k++) S.box(0.76,0.24,1.16,x,0.144+0.12+k*0.24,z,F('wellpappe'),'stumpf'); C.push([x-0.45,x+0.45,z-0.65,z+0.65]); }
  bk.paletten(P,{gruppe:'werk:inert',fein:L>1});
  { const x0=-95.2, z=-7.45; for(const y of [0.1,0.8,1.5,2.2]) S.box(2.4,0.04,0.6,x0+1.2,y,z,F('lichtgrau'),'lackMetall');
    for(const x of [x0,x0+2.4]) for(const dz of [-0.28,0.28]) S.box(0.05,2.4,0.05,x,1.2,z+dz,F('signalblau'),'lackMetall');
    for(let i=0;i<9;i++) S.zyl(0.05,0.05,0.5,seg,x0+0.25+i*0.24,0.86,z,F('wellpappe'),'stumpf',Math.PI/2,0,0);
    for(let i=0;i<6;i++) S.box(0.36,0.26,0.4,x0+0.3+i*0.38,1.65,z,F('weiss'),'kunststoff'); C.push([x0,x0+2.4,z-0.32,z+0.32]); }
  /* QS-Labor: Labortisch, Waage, Roentgen-Pruefgeraet, Abzug */
  S.box(3.2,0.05,0.75,-89,0.92,-7.5,F('weiss'),'kunststoff'); S.box(3.2,0.88,0.7,-89,0.45,-7.5,F('lichtgrau'),'lackMetall');
  S.box(0.4,0.12,0.35,-89.9,1.01,-7.5,F('anthrazit'),'lackMetall'); S.box(0.3,0.02,0.3,-89.9,1.08,-7.5,F('silbergrau'),'stahl');
  S.box(1.1,1.4,0.9,-87.0,0.7,-8.0,F('lichtgrau'),'lackMetall'); S.box(0.5,0.4,0.02,-87.0,1.05,-8.46,F('tiefschwarz'),'kunststoff');
  S.box(0.18,0.18,0.01,-86.7,1.25,-8.46,F('signalgelb'),'kunststoff');
  S.box(1.4,1.3,0.7,-91.2,1.75,-7.45,F('weiss'),'kunststoff'); S.box(1.3,0.8,0.02,-91.2,1.5,-7.79,F('glasKlar'),'scheibe');
  C.push([-90.6,-87.4,-7.9,-7.1],[-87.6,-86.4,-8.5,-7.5],[-91.9,-90.5,-7.8,-7.1]);
  /* Leitstand (+3,2 m): Pult mit sechs Bildschirmen (Status je Straße, wkMonitore), zwei Stuehle, Wandbildschirm */
  { const y=WK.raum; S.box(5.6,0.05,0.9,-82.2,y+0.78,-10.15,F('lichtgrau'),'kunststoff'); S.box(5.6,0.74,0.7,-82.2,y+0.38,-10.05,F('anthrazit'),'lackMetall');
    for(let i=0;i<6;i++){ const x=-84.6+i*0.96; S.box(0.05,0.16,0.05,x,y+0.88,-10.38,F('anthrazit'),'lackMetall'); S.box(0.66,0.4,0.04,x,y+1.12,-10.4,F('gummischwarz'),'kunststoff'); }
    for(const x of [-83.5,-80.9]){ S.zyl(0.26,0.26,0.08,seg,x,y+0.5,-9.35,F('gummischwarz'),'kunststoff'); S.box(0.48,0.55,0.08,x,y+0.85,-9.08,F('gummischwarz'),'kunststoff');
      S.zyl(0.03,0.03,0.42,seg,x,y+0.25,-9.35,F('silbergrau'),'stahl'); S.box(0.6,0.04,0.06,x,y+0.04,-9.35,F('anthrazit'),'stahl'); }
    S.box(1.6,0.9,0.05,-79.0,y+1.7,-7.12,F('gummischwarz'),'kunststoff');
    C.push([-85.0,-79.4,-10.55,-9.65]);
    /* Bildschirme: eine Leinwand (Canvas) fuer alle sechs Anzeigen, Leuchtbild */
    const t=tex(1536,256,()=>{}); const m=MAT.eigen('tiefschwarz','kunststoff',{map:t,emissiveMap:t,emissive:LIN(MAT.farbe('weiss')),emissiveIntensity:0.9});
    const parts=[]; for(let i=0;i<6;i++){ const g=new THREE.PlaneGeometry(0.62,0.36), uv=g.attributes.uv;
      if(uv&&uv.array){ for(let k=0;k<uv.count;k++) uv.array[k*2]=(i+uv.array[k*2])/6; uv.needsUpdate=true; }
      parts.push({geo:g,m:tm(-84.6+i*0.96,y+1.12,-10.378,0,0,0),color:0xffffff}); }
    const mon=new THREE.Mesh(merge(parts),m); mon.userData.bauteil='leitstand'; scene.add(mon); WK_T.monitor={t,m,mesh:mon}; }
  /* Umkleide/ESD: Spinde an der Suedwand, Bank, ESD-Pruefgeraet neben der Tuer ins Werk, Erdungsplatte davor (Wege zu Treppe,
     Werkseingang, Verbindungsbau und Werk bleiben frei) */
  for(let i=0;i<4;i++){ S.box(0.48,1.85,0.5,-73.6+i*0.5,0.93,-10.65,F('lichtgrau'),'lackMetall'); S.box(0.01,0.08,0.02,-73.45+i*0.5,1.2,-10.395,F('silbergrau'),'stahl'); }
  S.box(1.2,0.05,0.38,-71.1,0.45,-7.35,F('holzPalette'),'stumpf'); for(const x of [-71.6,-70.6]) S.box(0.06,0.43,0.3,x,0.22,-7.35,F('anthrazit'),'lackMetall');
  S.box(0.32,0.5,0.14,-75.55,1.35,-10.82,F('lichtgrau'),'kunststoff'); S.box(0.22,0.12,0.01,-75.55,1.45,-10.745,F('signalgruen'),'leucht');
  S.box(0.8,0.012,0.6,-74.5,0.006,-10.45,F('kupfer'),'blank');
  C.push([-73.9,-71.8,-10.9,-10.38],[-71.75,-70.45,-7.55,-7.15]);
  /* Sternhaus: drei Dragiertrommeln (drehen im Schau-Betrieb), leitfaehiger Gummiboden, Werkbank mit Holzwerkzeug */
  S.box(7.8,0.006,7.8,-96,0.019,-15.0,F('gummischwarz'),'matt');
  for(const [x,z] of [[-98.2,-13.2],[-95.6,-13.2],[-98.2,-16.6]]){ S.box(0.9,0.85,0.7,x,0.43,z,F('lichtgrau'),'lackMetall'); S.box(0.95,0.05,0.75,x,0.88,z,F('anthrazit'),'lackMetall');
    const d=new THREE.Group(); d.position.set(x,1.25,z); d.rotation.z=0.55; scene.add(d);
    const Sd=bk.sammler({bauteil:'dragiertrommel'}); Sd.zyl(0.42,0.3,0.55,seg+4,0,0,0,F('hellgrau'),'blank'); Sd.zyl(0.3,0.3,0.06,seg+4,0,0.3,0,F('tiefschwarz'),'kunststoff');
    Sd.fertig(d,{schatten:false}); WK_T.trommeln.push(d); C.push([x-0.5,x+0.5,z-0.45,z+0.45]); }
  S.box(2.2,0.05,0.8,-94.3,0.92,-17.9,F('holzPalette'),'stumpf'); S.box(2.2,0.88,0.7,-94.3,0.45,-17.9,F('holzPalette'),'stumpf');
  for(let i=0;i<5;i++) S.box(0.32,0.04,0.24,-95.1+i*0.4,0.96,-17.9,F('messing'),'blank');
  C.push([-95.5,-93.1,-18.3,-17.5]);
  /* Annahme: Gebinde (Faesser) und Sackware auf Paletten */
  const PA=[];
  for(const [x,z] of [[-86.6,-31.5],[-85.2,-31.5],[-81.6,-31.0],[-81.6,-29.4]]){ PA.push({x,z,ry:0});
    for(const dx of [-0.3,0.3]) for(const dz of [-0.2,0.2]) S.zyl(0.26,0.26,0.9,seg,x+dx,0.144+0.45,z+dz,F('signalblau'),'kunststoff');
    C.push([x-0.65,x+0.65,z-0.45,z+0.45]); }
  bk.paletten(PA,{gruppe:'werk:annahme',fein:L>1});
  /* Leergut: Palettenstapel, Ausschuss-Behaelter, Gitter zur Gasse */
  { const A=bk.PALETTE.euro, Lg=[]; for(const [x,z,n] of [[-74.8,-31.2,8],[-74.8,-32.9,6]]){ for(let i=0;i<n;i++) Lg.push({x:x+((i*7)%3-1)*0.012,y:i*A.h,z,ry:0}); C.push([x-0.62,x+0.62,z-0.42,z+0.42]); }
    bk.paletten(Lg,{gruppe:'werk:leergut',fein:false}); }
  S.box(1.2,0.9,0.8,-71.6,0.45,-32.6,F('signalrot'),'kunststoff'); S.box(1.24,0.06,0.84,-71.6,0.92,-32.6,F('anthrazit'),'kunststoff');
  C.push([-72.2,-71.0,-33.0,-32.2]);
  { const Sz=bk.sammler({form:{fase:0.006,faseMin:0.03,lod0Kasten:true},bauteil:'zaun'});
    bk.zaun({art:'gitter',von:[-76,-27.6],bis:[-70.25,-27.6],hoehe:2.0,luecke:[[2.2,3.7]],S:Sz}); Sz.fertig(scene,{fest:true,bauteil:'zaun'});
    col(-76,-73.8,-27.66,-27.54); col(-72.3,-70.25,-27.66,-27.54); }
  WK_T.glasBasis.push(...wkGlasNehmen(S)); S.fertig(scene,{fest:true});
  for(const c of C) col(c[0],c[1],c[2],c[3]);
}
/* Bodenmarkierungen: Gehwege gruen (Gaenge zwischen den Straßen, Querweg West, Verbindungsbau), Fahrweg gelb (Annahme),
   Sperrflaeche im Schliessbereich von R6, Stellplaetze */
function wkBoden2(){
  const M=bk.MARKIERUNG, L=[], R=[], Fl=[], Pk=[];
  const gw=(x0,z0,x1,z1,b)=>{ if(z0===z1){ L.push([x0,z0-b,x1,z0-b,'gruen',M.gehweg]); L.push([x0,z0+b,x1,z0+b,'gruen',M.gehweg]); }
    else { L.push([x0-b,z0,x0-b,z1,'gruen',M.gehweg]); L.push([x0+b,z0,x0+b,z1,'gruen',M.gehweg]); } };
  gw(-91.1,-16.5,-70.5,-16.5,0.6); gw(-91.1,-22.0,-70.5,-22.0,0.6);
  gw(-91.1,-11.55,-70.5,-11.55,0.38); gw(-91.1,-26.95,-70.5,-26.95,0.38);
  gw(-91.5,-26.6,-91.5,-11.9,0.38);
  gw(-69.7,-9.0,-66.4,-9.0,0.6);
  for(const [x,z,ry] of [[-81,-16.5,Math.PI/2],[-81,-22,Math.PI/2],[-68.05,-9,Math.PI/2]]) Pk.push({x,z,ry});
  R.push({x0:-87.9,x1:-80.1,z0:-33.9,z1:-27.6,farbe:'gelb',breite:M.fahrweg});
  for(const [x,z] of [[-86.6,-31.5],[-85.2,-31.5],[-81.6,-31.0],[-81.6,-29.4]]) R.push({x0:x-0.7,x1:x+0.7,z0:z-0.5,z1:z+0.5,farbe:'weiss',breite:0.06});
  Fl.push({x0:WK.r6.x-1.7,x1:WK.r6.x+1.7,z0:-33.95,z1:-33.4,art:'sperr'});
  R.push({x0:-75.9,x1:-70.4,z0:-33.9,z1:-27.75,farbe:'weiss',breite:0.06});
  bk.bodenmarkierung({linien:L,rahmen:R,flaechen:Fl,piktos:Pk,y:0.015});
}
/* Licht: LED-Hallenleuchten ueber den Gaengen (zwischen den Bindern), Raster in den Raeumen, zwei Pendel im Leitstand */
function wkLicht(){
  const pk=[]; for(const x of [-87.5,-82.5,-77.5,-72.5]) for(const z of [-11.7,-16.5,-22.0,-26.9]) pk.push([x,z]);
  bk.lampe({art:'halle',punkte:pk,y:4.55,decke:5.0,zone:WK.id});
  bk.lampe({art:'halle',punkte:[[-84,-9.0],[-80,-9.0]],y:5.2,decke:WK.H,zone:WK.id});
  const pm=deckenPanelMat(), R=WK.raum-0.2;
  bk.lampe({art:'raster',r:{x0:-100,x1:-92.1,z0:-10.9,z1:-7},y:R,ax:3.6,az:3.8,panel:pm});
  bk.lampe({art:'raster',r:{x0:-91.9,x1:-86.1,z0:-10.9,z1:-7},y:R,ax:3.0,az:3.8,panel:pm});
  bk.lampe({art:'raster',r:{x0:-75.9,x1:-70.1,z0:-10.9,z1:-7},y:R,ax:3.0,az:3.8,panel:pm});
  bk.lampe({art:'raster',r:{x0:-100,x1:-92.1,z0:-19,z1:-11.1},y:3.6,ax:3.6,az:3.6,panel:pm});
  roomAO(-91.9,-70.1,-27.5,-11.1,null,{n:true,s:true,w:true,e:true});
}
/* Aussen: Hof West, Zufahrt, Vorplatz Nord, Werkszaun mit Einfahrt, Mischhaus mit Erdwall, Gefahrstoffweg, Hofmasten */
function wkAussen(){
  const F=MAT.farbe, Hf=WK.hof, Wr=WK.werk;
  const beton=(x0,x1,z0,z1,y)=>MAT.kachel(flat(x1-x0,z1-z0,MAT.get('betonHof'),(x0+x1)/2,y,(z0+z1)/2).geometry,(x1-x0)/2.4,(z1-z0)/2.4);
  beton(Hf.x0,Hf.x1,Hf.z0,Hf.z1,0.013);
  beton(-128,Hf.x0,WK.einfahrt[0]+0.25,WK.einfahrt[1]-0.25,0.012);
  beton(Wr.x0-LW,-66.2,Wr.z1+LW,5.8,0.012);
  beton(-118,-110,-27,-19,0.011);
  beton(-115,-100.2,WK.westTuer-1.0,WK.westTuer+1.0,0.0105); beton(-115,-113,-27,WK.westTuer-1.0,0.0105);
  /* Stellplatz vor R6 */
  bk.bodenmarkierung({lkw:[{x:WK.r6.x,z:Wr.z0}],y:0.012,schatten:true});
  /* Gefahrstoffweg (gelb schraffiert) von der Gefahrstofftuer West durch die Erdwall-Luecke zum Mischhaus */
  bk.bodenmarkierung({flaechen:[{x0:-114.6,x1:-100.25,z0:WK.westTuer-0.6,z1:WK.westTuer+0.6,art:'sperr'},{x0:-114.6,x1:-113.4,z0:WK.westTuer+0.6,z1:-25.6,art:'sperr'}],y:0.012,schatten:true});
  bk.schild(scene,{text:'GEFAHRSTOFFWEG',unter:'Keine Stapler · Nur Satz und Chemie',b:1.6,h:0.45,x:-100.23,y:2.7,z:WK.westTuer,ry:-Math.PI/2,stil:'brand'});
  /* Werkszaun Doppelstab 2 m: West mit Einfahrt (Schiebetor offen geparkt), Nord an der Strasse, Sued */
  const ZX=WK.zaunX, E=WK.einfahrt;
  bk.zaun({art:'doppelstab',von:[ZX,5.9],bis:[ZX,Hf.z0],hoehe:2.0,luecke:[[5.9-E[1],5.9-E[0]]]});
  bk.zaun({art:'doppelstab',von:[ZX,5.9],bis:[-66.32,5.9],hoehe:2.0});
  bk.zaun({art:'doppelstab',von:[ZX,Hf.z0],bis:[Hf.x1-0.12,Hf.z0],hoehe:2.0});
  col(ZX-0.1,ZX+0.1,E[1],5.9); col(ZX-0.1,ZX+0.1,Hf.z0,E[0]); col(ZX,-66.2,5.84,5.96); col(ZX,Hf.x1,Hf.z0-0.1,Hf.z0+0.1);
  bk.tor({art:'gitter',breite:7.0,hoehe:2.0,bewegung:'schiebe',pfosten:false,x:ZX-0.18,z:E[0]-3.7,ry:0});
  { const S=bk.werkSammler('schild'); S.box(0.1,2.6,0.1,ZX+0.3,1.3,E[1]+0.9,F('basaltgrau'),'stahl'); S.fertig(scene,{fest:true}); col(ZX+0.22,ZX+0.38,E[1]+0.82,E[1]+0.98);
    bk.schild(scene,{text:'WERK WEST',unter:'Einfahrt · Tor 6 Rohstoffe · Schrittgeschwindigkeit',b:1.8,h:0.6,x:ZX+0.36,y:2.0,z:E[1]+0.9,ry:Math.PI/2}); }
  hofMasten([[Hf.x0+1.4,-46.5,Math.PI/2],[-88,Hf.z0+5.6,0]]);
  /* Mischhaus: Betonzelle 5 x 5 m, Leichtdach, Tuer zur Erdwall-Luecke, Kupferplatte und Ampel; Erdwall rundum */
  { const S=bk.werkSammler('mischhaus'), Lm={rot:[],gruen:[]}, Mi=WK.misch;
    const r=bk.zelle({S,x0:Mi.x0,x1:Mi.x1,z0:Mi.z0,z1:Mi.z1,h:Mi.h,band:false,tueren:[{seite:-1,x:-114}],leuchten:Lm});
    S.box(0.6,0.5,0.6,-112.6,Mi.h+0.45,-21.6,F('lichtgrau'),'lackMetall'); S.zyl(0.06,0.06,0.9,10,-115.6,Mi.h+0.55,-24.6,F('silbergrau'),'stahl');
    S.box(0.24,0.16,0.2,-115.6,Mi.h+1.05,-24.6,F('anthrazit'),'lackMetall');
    S.fertig(scene,{fest:true}); col(r.kollision.x0,r.kollision.x1,r.kollision.z0,r.kollision.z1);
    const mr=MAT.neu('ampelRot'), mg=MAT.neu('ampelGruen'); mr.emissiveIntensity=0; mg.emissiveIntensity=1.4;
    for(const [l,m] of [[Lm.rot,mr],[Lm.gruen,mg]]) if(l.length){ const me=new THREE.Mesh(merge(l),m); me.userData.bauteil='zelle'; me.userData.klasse='leuchte'; scene.add(me); }
    bk.schild(scene,{text:'MISCHHAUS',unter:'Fernbedienter Mischer · Zutritt nur bei Stillstand',b:1.6,h:0.45,x:-114,y:2.75,z:Mi.z0-0.01,ry:Math.PI,stil:'brand'});
    const E2=WK.erdwall, w=bk.erdwall({x0:E2.x0,x1:E2.x1,z0:E2.z0,z1:E2.z1,hoehe:4,fuss:3,krone:0.8,luecke:{seite:'s',von:E2.luecke[0],bis:E2.luecke[1]}});
    for(const c of w.kollision) col(c.x0,c.x1,c.z0,c.z1); }
}
/* Werkstueck-Traeger je Straße (eine Geometrie, Instanzen): Raketen (Huelsen mit Kopf), Kugelbomben (Kugeln mit Bandage),
   Batterien (Rohr-Raster) - alles Klasse stumpf (ein Material) */
const _wkTraeger=new Map();
function wkTraegerGeo(i){ const k=i+':'+bk.lod(); let g=_wkTraeger.get(k); if(g) return g;
  const S=bk.sammler({}), F=MAT.farbe, L=bk.lod(), seg=[6,8,12][L];
  S.box(0.5,0.03,0.36,0,0.015,0,F('aluminium'),'stumpf');
  if(i===0){ for(let a=0;a<4;a++) for(let b=0;b<2;b++){ const x=-0.18+a*0.12, z=-0.07+b*0.14; S.zyl(0.024,0.024,0.34,seg,x,0.2,z,F('wellpappe'),'stumpf'); S.zyl(0.0,0.026,0.07,seg,x,0.405,z,F('feuerrot'),'stumpf'); } }
  else if(i===1){ for(let a=0;a<2;a++) for(let b=0;b<2;b++){ const x=-0.12+a*0.24, z=-0.08+b*0.16; S.geo(new THREE.SphereGeometry(0.075,seg+2,Math.max(4,seg>>1)),tm(x,0.11,z),F('cremeweiss'),'stumpf'); S.zyl(0.077,0.077,0.03,seg+2,x,0.11,z,F('wellpappe'),'stumpf'); } }
  else { for(let a=0;a<4;a++) for(let b=0;b<3;b++){ const x=-0.15+a*0.1, z=-0.1+b*0.1; S.zyl(0.04,0.04,0.22,seg,x,0.14,z,F('graphit'),'stumpf'); S.zyl(0.032,0.032,0.004,seg,x,0.251,z,F('wellpappe'),'stumpf'); } }
  g=S.geometrie('stumpf'); _wkTraeger.set(k,g); return g; }
/* Kartonlage auf der Ausgangspalette (2 x 3 Kartons) */
let _wkLage=null;
function wkLageGeo(){ if(_wkLage) return _wkLage; const S=bk.sammler({}), P=MAT.farbe('wellpappe');
  for(let a=0;a<2;a++) for(let b=0;b<3;b++) S.box(0.39,0.29,0.39,-0.2+a*0.4,0.145,-0.4+b*0.4,P,'stumpf'); return _wkLage=S.geometrie('stumpf'); }
/* ---------- Eine Straße bauen (beim Kauf von fabrik / fabrik2 / fabrik3) ---------- */
function wkStrasseBauen(i){
  const s=WK_STR[i], F=MAT.farbe, L=bk.lod(), B=WK.band, zc=s.zc, p=B.p, zT=wkGasseZ(s.gasse);
  const g=new THREE.Group(); g.name='werkStrasse'+s.nr; g.userData.inventar=true; WK_H.add(g);
  const d=new THREE.Group(); d.name='werkStrasseBewegt'+s.nr; d.userData._bnd=true; WK_D.add(d);
  const v=new THREE.Group(); v.name='werkStrasseVerb'+s.nr; v.userData.inventar=true; WK_V.add(v);
  const st={g,d,v,cols:[],portale:[],traeger:null,pal:null,ampel:null,zyklus:-1,tAlt:-1};
  const vorC=colliders.length;
  const fang=(ziel,fn)=>{ const vorS=new Set(scene.children); fn(); for(const o of scene.children.filter(o=>!vorS.has(o))){ scene.remove(o); ziel.add(o); } };
  fang(g,()=>{
    const S=bk.werkSammler('strasse'+s.nr), Lz={rot:[],gruen:[]};
    /* Band (Rollenbahn, Alu wie im Referenzfoto) durch alle Stationen bis zum Palettierer */
    bk.foerderer({von:[B.x0-0.25,zc],bis:[-72.85,zc],breite:B.b,hoehe:B.y,teilung:L?0.1:0.2});
    s.st.forEach((q,j)=>{ const x0=B.x0+j*p, x1=x0+p, xm=(x0+x1)/2;
      /* Zelle (Feinschliff 15.10.): Paneel hell, 3,1 m mit sichtbarem Ausblasdach, Sichtfenster, Kamera; drinnen die Maschine (Presse/Dosierer) */
      if(q[2]){ bk.zelle({S,x0,x1,z0:zc-WK.tief,z1:zc+WK.tief,h:WK.zelleH,wand:'paneel',fenster:true,kamera:true,band:{z:zc,y0:0.45,y1:1.4,b:0.9},tueren:[{seite:1,x:x0+0.72},{seite:-1,x:x1-0.72}],leuchten:Lz,schild:L?{text:q[0],unter:q[1]+' · Zelle'}:null,parent:scene});
        bk.maschine(S,{art:q[3]||'fuell',x:xm,z:zc,y:B.y,laenge:p-0.5,breite:2.0}); return; }
      /* offene Station: Alu-Profil-Schutzumhausung mit Polycarbonat an beiden Gangseiten (Linie als Fertigungsstraße lesbar) */
      const schutz=WK.tief-0.2;
      if(q[3]==='portal'){ const P=bk.portalgreifer({x:xm,z:zc,laenge:p-0.2,breite:2.0,hoehe:2.3,greifer:i===2?'sauger':'zange',hub:1.0,parent:d});
        st.portale.push({P,art:'station'}); bk.maschine(S,{art:'schutz',x:xm,z:zc,laenge:p,schutz});
        if(i===2){ /* Rohrmagazin hinter dem Portal (hohe Pappe-Rohre wie im Referenzfoto) und Rohr-Raster neben dem Band */
          for(let a=0;a<3;a++) S.zyl(0.04,0.04,2.2,[6,8,10][L],xm-0.3+a*0.3,1.5,zc-0.75,F('wellpappe'),'stumpf');
          S.box(1.1,0.06,0.25,xm,0.38,zc-0.75,F('aluminium'),'stahl');
          bk.rohrraster(S,{x:xm,y:0.62,z:zc+0.72,nx:6,nz:5,r:0.032,h:0.32,teilung:0.085}); S.box(0.7,0.62,0.6,xm,0.31,zc+0.72,F('aluminium'),'stahl'); }
        else { S.box(0.9,0.75,0.45,xm,0.375,zc-0.75,F('lichtgrau'),'lackMetall');
          for(let a=0;a<6;a++) S.zyl(0.0,0.03,0.08,[6,8,10][L],xm-0.3+a*0.12,0.79,zc-0.75,F('feuerrot'),'stumpf'); } }
      else bk.maschine(S,{art:q[3],x:xm,z:zc,y:B.y,laenge:p,breite:2.2,schutz});
      /* Stationsschild an einem Alu-Pfosten am Gangrand (nicht frei schwebend) */
      S.box(0.05,2.75,0.05,xm+0.55,1.375,zc+WK.tief-0.06,F('aluminium'),'stahl'); bk.fuss(S,xm+0.55,zc+WK.tief-0.06,0.12);
      S.box(1.04,0.34,0.03,xm,2.55,zc+WK.tief-0.025,F('anthrazit'),'lackMetall');
      if(L) bk.schild(scene,{text:q[0],unter:q[1],b:1.0,h:0.3,px:0.7,x:xm,y:2.55,z:zc+WK.tief-0.008,ry:0}); });   /* Ultra Low: Tafel ohne Schrift (21 Zeichenaufrufe weniger) */
    /* Abwurf vom Ueberkopf-Foerderer auf Station 1 */
    S.box(0.36,2.6,0.36,-90.4,2.95,zc,F('lichtgrau'),'lackMetall'); S.box(0.5,0.3,0.5,-90.4,1.55,zc,F('lichtgrau'),'lackMetall');
    /* Palettierer: Portal ueber der Ausgangspalette, Ausgangsfoerderer durch die Brandwand auf den Sammelfoerderer, Uebergabe in die Gasse */
    const PP=bk.portalgreifer({x:WK.pal.x,z:zc,laenge:2.7,breite:2.0,hoehe:2.6,greifer:'sauger',hub:0.9,parent:d}); st.portale.push({P:PP,art:'pal'});
    const fa=bk.foerderer({von:[-72.75,zc],bis:[-68.55,zc],breite:1.0,hoehe:WK.sammel.h});
    const fu=bk.foerderer({von:[-67.45,zT],bis:[-66.02,zT],breite:1.0,hoehe:WK.sammel.h,antrieb:false});
    col(fa.kollision.x0,fa.kollision.x1,fa.kollision.z0,fa.kollision.z1); col(fu.kollision.x0,fu.kollision.x1,fu.kollision.z0,fu.kollision.z1);
    WK_T.glas[i]=wkGlasNehmen(S); S.fertig(scene,{fest:true});
    /* Zellen-Ampeln: je Straße EIN Mesh je Farbe, Material veraenderlich (MAT.neu) - rot = Maschine laeuft, Tuer zu */
    const mr=MAT.neu('ampelRot'), mg=MAT.neu('ampelGruen'); st.ampel={rot:mr,gruen:mg};
    for(const [l,m] of [[Lz.rot,mr],[Lz.gruen,mg]]) if(l.length){ const me=new THREE.Mesh(merge(l),m); me.userData.bauteil='zelle'; me.userData.klasse='leuchte'; scene.add(me); }
    wkHaengend({text:'STRASSE '+s.nr,unter:s.name+' · 7 Stationen · '+(i?'Kapitel 8.'+(i+1):'Kapitel 8'),b:1.8,h:0.5,x:-81,y:3.15,z:zc+WK.tief+0.3,ry:0,decke:WK.H-1.0});
    /* Maschinenblock der Straße ist fuer Personen gesperrt (Zellen, Band, Portale) */
    col(B.x0-0.35,-70.2,zc-WK.tief,zc+WK.tief);
  });
  /* Werkstueck-Traeger (Instanzen, 7 Stueck) und Ausgangspalette mit Kartonlagen */
  st.traeger=bk.inst(wkTraegerGeo(i),MAT.vc('stumpf'),[0,1,2,3,4,5,6].map(j=>tm(B.x0+(j+0.5)*p,B.y,zc)),{parent:d,schatten:false,bauteil:'werkstueck'});
  { const pg=new THREE.Group(); pg.position.set(WK.pal.x,WK.sammel.h,zc); d.add(pg);
    const pa=new THREE.Mesh(bk.palette('euro',{fein:L>1}),MAT.get('palette')); pa.rotation.y=Math.PI/2; pa.userData.bauteil='palette'; pg.add(pa);
    const la=bk.inst(wkLageGeo(),MAT.vc('stumpf'),[0,1,2,3].map(k=>tm(0,bk.PALETTE.euro.h+k*0.3,0)),{parent:pg,schatten:false,bauteil:'werkstueck',art:'lage'});
    st.pal={g:pg,lagen:la,weg:[[WK.pal.x,zc],[WK.sammel.x,zc],[WK.sammel.x,zT],[-66.15,zT]]}; }
  st.cols=colliders.slice(vorC); for(const c of st.cols) dropCol(c);
  wkVerbTeilen(g,v);
  g.traverse(o=>{ if(o.isMesh) o.castShadow=false; }); d.traverse(o=>{ if(o.isMesh) o.castShadow=false; }); v.traverse(o=>{ if(o.isMesh) o.castShadow=false; });
  WK_T.str[i]=st;
  if(typeof bk.wandbild==='function') bk.wandbild();
}
/* Ampeln aller Zellen: rot = Straße laeuft (Tuer zu), gruen = steht (Zelle frei) */
function wkAmpeln(){ if(!WK_T) return; WK_T.str.forEach((st,i)=>{ if(!st||!st.ampel) return; const an=WK.zustand[i].laeuft;
  st.ampel.rot.emissiveIntensity=an?1.4:0; st.ampel.gruen.emissiveIntensity=an?0:1.4; }); }
/* Leitstand-Bildschirme: je Straße zwei Anzeigen (Leinwand; 05s malt sie im Werk einmal je Sekunde neu). Links: Status, Auftrag,
   Takt, Stueck heute. Rechts: Stationen (rot = Zelle, blinkt bei Stoerung), Ausschuss, Qualitaet, Rohstoff-Reichweite. */
function wkMonitore(){
  if(!WK_T||!WK_T.monitor) return; const t=WK_T.monitor.t, c=t.image, g=c&&c.getContext&&c.getContext('2d'); if(!g) return;
  const W=c.width/6, H=c.height, D=typeof S!=='undefined'&&S&&S.pd?S.pd:null, blink=Math.floor((WK_T.zeit||0)*2)%2===0;
  const zahl=v=>String(v).replace('.',',');
  for(let k=0;k<6;k++){ const i=k>>1, s=WK_STR[i], an=wkStrasseOffen(i), x0=k*W, p=D&&D.s?D.s[i]:null, grund=an&&typeof pdGrund==='function'?pdGrund(i):'';
    const laeuft=an&&WK.zustand[i].laeuft, stoer=!!(p&&p.stoer);
    g.fillStyle=MAT.css('nachtblau'); g.fillRect(x0,0,W,H); g.fillStyle=MAT.css(stoer?'signalrot':'anthrazit'); g.fillRect(x0,0,W,46);
    g.textAlign='left'; g.textBaseline='middle'; g.fillStyle=MAT.css('weiss'); fitFont(g,'STRASSE '+s.nr+' · '+s.name.toUpperCase(),W-28,30,BAR); g.fillText('STRASSE '+s.nr+' · '+s.name.toUpperCase(),x0+14,24);
    const zl=(t2,yy)=>{ fitFont(g,t2,W-28,26,BAR); g.fillText(t2,x0+14,yy); };
    if(k%2===0){ g.fillStyle=!an?MAT.css('mittelgrau'):stoer?(blink?MAT.css('signalrot'):MAT.css('nachtblau')):laeuft?MAT.css('signalgruen'):MAT.css('signalgelb'); g.fillRect(x0+14,70,26,26);
      g.fillStyle=MAT.css('weiss'); g.font=BAR(34); g.fillText(!an?'NICHT GEBAUT':stoer?'STÖRUNG':laeuft?'LÄUFT':'STEHT',x0+52,84);
      g.fillStyle=MAT.css('lichtgrau');
      if(!an) zl('Ausbau '+(i?'8.'+(i+1):'8'),134);
      else if(p&&p.plan&&p.plan.length&&P[p.plan[0].t]){ const a=p.plan[0];
        zl(P[a.t].short+' · '+a.f+'/'+a.n+' Kartons',134); zl(pdProStunde(a.t)+' Stück/h · heute '+p.heute.stk+' Stück'+(grund&&!laeuft?' · '+grund:''),176); }
      else zl(grund||'kein Auftrag',134); }
    else { g.strokeStyle=MAT.css('mittelgrau'); g.lineWidth=2; for(let j=0;j<7;j++){ const bx=x0+14+j*34; g.strokeRect(bx,70,28,28);
        if(an){ const st=p&&p.stoer&&p.stoer.j===j; g.fillStyle=st?(blink?MAT.css('signalrot'):MAT.css('nachtblau')):s.st[j][2]?MAT.css('signalrot'):MAT.css('signalgruen'); g.fillRect(bx+4,74,20,20); } }
      g.fillStyle=MAT.css('lichtgrau');
      if(an&&p&&typeof pdAusschuss==='function'){ const ges=p.heute.stk+p.heute.aus;
        zl('Ausschuss '+(ges?Math.round(p.heute.aus/ges*100):Math.round(pdAusschuss(i,p.pre?1:0)*100))+' % · Qualität '+Math.round(pdQualitaet(i,p.pre?1:0)*100)+' % · '+(p.pre?'Premium':'Standard'),134);
        const RW=pdReichweite(); let m=Infinity, mr=''; for(const r of PD_ROH) if(RW[r]<m){ m=RW[r]; mr=r; }
        zl(isFinite(m)?'Rohstoffe reichen '+zahl(Math.round(m*10)/10)+' Tage ('+PD_ROH_NAME[mr]+')':'Erfahrung '+(p.erf||0)+' Tage',176); }
      else zl(an?'7 Stationen · '+s.st.filter(q=>q[2]).length+' Zellen (rot = mannlos)':'',134); } }
  t.needsUpdate=true;
}

/* ---------- Sicht: Werk-Inhalt nur zeichnen, wenn die Kamera im Werk/Verbindungsbau steht oder durch eine Oeffnung hineinsieht ---------- */
const _wkFr=new THREE.Frustum(), _wkM=new THREE.Matrix4(), _wkBox=new THREE.Box3(), _wkA=new THREE.Vector3(), _wkB=new THREE.Vector3();
function wkSichtTakt(){
  if(!WK_H||!WK_G||!WK_G.visible) return;
  const c=camera.position, x=c.x, z=c.z, oben=c.y>7.5, Wr=WK.werk;
  const imWerk=x>Wr.x0-LW&&x<-70.1&&z>Wr.z0-LW&&z<Wr.z1+LW, imVerb=x>=-70.1&&x<-65.9&&z>Wr.z0&&z<Wr.z1;
  let P=null; const sieht=(x0,y0,z0,x1,y1,z1)=>{ if(!P){ camera.updateMatrixWorld(); _wkM.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse); _wkFr.setFromProjectionMatrix(_wkM); P=true; }
    return _wkFr.intersectsBox(_wkBox.set(_wkA.set(x0,y0,z0),_wkB.set(x1,y1,z1))); };
  /* Werk-Inhalt: im Werk; aus dem Verbindungsbau nur durch Tuer/Foerderoeffnungen der Brandwand x −70 */
  const h=oben||imWerk||(imVerb&&(sieht(-70.2,0,-10,-69.8,2.2,-8)||WK_STR.some(s=>sieht(-70.2,0,s.zc-0.65,-69.8,1.9,s.zc+0.65))));
  /* Verbindungsbau: dazu aus der Halle, aber nur vom Hauptgang Nord (Blick durch die Tuer x −66, z −9) */
  const v=h||imVerb||(x>-66&&x<-40&&z>-13.6&&z<-6.8&&sieht(-66.3,0,-10,-65.9,2.2,-8));
  WK_H.visible=h; WK_V.visible=v; WK_D.visible=v;
  /* Aussenanlagen nicht aus Werk, Halle, Lager und Laden */
  WK_A.visible=oben||!(imWerk||imVerb||(x>-66&&x<-8.1&&z>-34.1&&z<-6.0)||(x>-26&&x<-8.1&&z>-30&&z<-6)||(x>-7.9&&x<37.9&&z>-21.9&&z<5.9));
}

/* ---------- Takt: Tueren (immer), Lichtbaender, Schau-Betrieb (nur wenn sichtbar), Ausgabe an die Gasse (immer, zeitbasiert) ---------- */
function wkTick(dt){
  if(!WK_T||!WK_G||!WK_G.visible) return;
  if(typeof pdTick==='function') pdTick(dt);   /* Produktion (05s): Rohstoffe, Takt, Ausgabe, Stoerungen, Leitstand */
  WK_T.zeit+=dt;
  for(const t of WK_T.tueren){ const ziel=Math.hypot(pl.x-t.x,pl.z-t.z)<t.r?1:0, a=t.T.t;
    if(a!==ziel) t.T.set(a+Math.sign(ziel-a)*Math.min(Math.abs(ziel-a),dt*2.4)); }
  if(WK_T.lichtband&&typeof sun!=='undefined'){ const v=Math.max(0.05,Math.min(1,sun.intensity/1.6)); WK_T.lichtband.material.emissiveIntensity=0.15+0.85*v; }
  const C=10;   /* Takte je Palette: 8 stapeln (Lage je 2 Takte), 2 abfahren */
  WK_T.str.forEach((st,i)=>{ if(!st||!WK.zustand[i].laeuft) return; const T=WK.zustand[i].takt, t=WK_T.zeit+i*1.37, k=Math.floor(t/T);
    const zy=Math.floor(k/C); if(zy>st.zyklus){ if(st.zyklus>=0) wkAusgabe(i); st.zyklus=zy; } });
  if(!WK_D.visible) return;
  for(const d of WK_T.trommeln) d.rotation.y+=dt*1.4;
  WK_T.str.forEach((st,i)=>{ if(st&&WK.zustand[i].laeuft&&st.d.visible) wkStrasseTakt(i,st,C); });
}
const _wkMx=new THREE.Matrix4(), _wkNull=new THREE.Matrix4().makeScale(0.0001,0.0001,0.0001);
function wkStrasseTakt(i,st,C){
  const s=WK_STR[i], B=WK.band, T=WK.zustand[i].takt, t=WK_T.zeit+i*1.37, k=Math.floor(t/T), f=t/T-k;
  const mv=f<0.3?(1-Math.cos(Math.PI*f/0.3))/2:1, w=f<0.3?0:(f-0.3)/0.7;
  /* Traeger: wandern je Takt eine Station weiter; nach der letzten Station verschwinden sie im Palettierer */
  if(f<0.32||st.tAlt!==k){ st.tAlt=k; const M=st.traeger;
    for(let j=0;j<7;j++){ const q=(j+k+mv)%7; M.setMatrixAt(j,q>6.3?_wkNull:_wkMx.makeTranslation(B.x0+(q+0.5)*B.p,B.y,s.zc)); }
    M.instanceMatrix.needsUpdate=true; }
  /* Portale: in der Standzeit greifen (runter, rueber, runter, zurueck) */
  const bump=(a,b)=>w>a&&w<b?Math.sin(Math.PI*(w-a)/(b-a)):0;
  const kc=k%C;
  for(const q of st.portale){ if(q.art==='station'){ q.P.set(w<0.45?0.25:w<0.55?0.25+(w-0.45)*5:0.75,bump(0.1,0.4)+bump(0.6,0.9)); }
    else if(kc<8){ q.P.set(w<0.5?0.12+0.0*w:0.12+Math.min(1,(w-0.5)*4)*0.36,bump(0.05,0.35)+bump(0.65,0.95)*0.6); } else q.P.set(0.12,0); }
  /* Ausgangspalette: Lagen wachsen, dann faehrt sie durch beide Brandwaende in die Gasse */
  const P=st.pal; if(!P) return;
  if(kc<8){ P.lagen.count=Math.min(4,Math.floor((kc+(w>0.8?1:0))/2)); P.g.visible=true; P.g.position.set(P.weg[0][0],WK.sammel.h,P.weg[0][1]); }
  else { P.lagen.count=4; const u=((kc-8)+f)/2, W=P.weg, seg=[];
    let Lg=0; for(let n=1;n<W.length;n++){ const l=Math.hypot(W[n][0]-W[n-1][0],W[n][1]-W[n-1][1]); seg.push(l); Lg+=l; }
    let r=Math.min(1,u*1.15)*Lg, n=0; while(n<seg.length-1&&r>seg[n]){ r-=seg[n]; n++; }
    const a=W[n], b=W[n+1], q=Math.min(1,r/(seg[n]||1));
    P.g.position.set(a[0]+(b[0]-a[0])*q,WK.sammel.h,a[1]+(b[1]-a[1])*q); P.g.visible=u<0.97; }
}
