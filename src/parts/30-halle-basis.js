/* =========================================================
   Grosse Halle nach Ausbauplan v7 (Tom, 10.10.2026)

   Eigenstaendig ladbarer Bereich: Logistikhalle mit Hochregal (3 Gassen,
   Regalbediengeraete, I/O, Anbruch), Wareneingang an R2-R4, Schnellplaetze,
   Packmaterial, Kartonlager 3 mit gelber Wand und Tor N1, Schleuse 13 m und
   der Produktion im Westfluegel (3 Strassen: Raketen, Kugelbomben,
   Batterien, R6 Rohstoff rein, R5 Fertigware raus).

   Gleiche Weltkoordinaten wie das Hauptspiel (LAY, LHALLE, WRAMPEN ...).
   Schnittstelle (siehe docs/halle/zusammenfuehrung.md):
     hallLaden(opts, fortschritt(anteil,text), fertig)  - in Schritten, mit Ladebalken
     hallBauen(opts)      - alles auf einmal
     hallAbbauen()        - alles wieder weg, Speicher frei
     hallSichtbar(v)      - ein-/ausblenden samt Kollision
     hallTick(dt)         - Animation (Roboter, Baender)
     hallMessen()         - Zeichenaufrufe und Dreiecke je Bereich
   opts.umfeld: Lager 1/2, Boden draussen, Hof - nur im eigenstaendigen Modus;
   im Hauptspiel stehen diese Teile schon.
   ========================================================= */
const HV7=(()=>{
  const H=LAY.lwest;
  const g=[]; for(let k=0;k<3;k++){ const z0=-27.8+k*4.67; g.push({k,a0:z0,a1:z0+1.2,mitte:z0+2.0,b0:z0+2.8,b1:z0+4.0}); }
  return {
    halle:{x0:H.x0,x1:H.x1,z0:H.z0,z1:H.z1}, H:LOGI_STUFEN[2].h,
    prod:{x0:-101.0,x1:H.x0,z0:H.z0,z1:H.z1}, PH:5.0,
    kl3:{x0:-36.0,x1:LAY.lsued.x0,z0:-17.0,z1:H.z1},
    schleuse:{x0:LAY.schleuse.x0,x1:LAY.schleuse.x1,z0:LAY.lsued.z0,z1:LAY.schleuse.z1},
    sDurch:{z0:-26.9,z1:-23.1},                 /* Durchgang Halle -> Schleuse (3,8 m) */
    sOffen:{z0:-21.6,z1:-17.2},                 /* Schleuse -> Lager Sued, offen */
    hr:{x0:-65.7,x1:-48.3,z0:-28.0,z1:-14.0,felder:6,fb:2.9,ebenen:[0,1.9,3.8,5.7,7.6],hoehe:9.95},
    gassen:g,
    io:{x0:-48.3,x1:-46.0},
    anbruch:{x0:-46.0,x1:-42.0,z0:-28.0,z1:-14.0},
    we:{x0:-50.0,x1:-26.6,z0:-33.8,z1:-28.6},
    pack:{x0:-41.5,x1:-33.0,z0:-27.5,z1:-23.0},
    schnell:{x0:-65.4,n:13,dx:1.5,z0:-9.6,z1:-7.4},
    n1:{x:-36.0,z0:-13.6,z1:-10.4,h:3.2},
    tore:[{n:'R2',x:WRAMPEN[0]},{n:'R3',x:WRAMPEN[1]},{n:'R4',x:WRAMPEN[2]}],
    ptore:[{n:'R6',x:-92.0,was:'Rohstoffe'},{n:'R5',x:-74.0,was:'Fertigware'}],
    bunker:[{x0:-100.4,x1:-95.6},{x0:-89.2,x1:-84.4},{x0:-84.0,x1:-79.2}],
    pTueren:[{z0:-33.3,z1:-29.7},{z0:-13.6,z1:-10.4}],   /* Halle <-> Produktion */
    strassen:[{id:'raketen',name:'RAKETEN',z:g[0].mitte},{id:'kugeln',name:'KUGELBOMBEN',z:g[1].mitte},{id:'batterien',name:'BATTERIEN',z:g[2].mitte}],
    raum:{x0:-101.6,x1:-7.6,z0:-35.6,z1:6.4}
  };
})();

/* Zustand der Halle. g haengt erst beim Bauen in der Szene. */
const HALLE={g:null,bereiche:{},cols:[],anim:[],lampen:[],gebaut:false,sichtbar:true,zeiten:{},opts:null,res:[],licht:null,t:0};
/* Qualitaet je Grafikstufe: Ultra Low/Niedrig sparen Kartons, Rollen und Rundungen */
function hvQ(){ const r=gfxRang(GFX); return {fein:r>=1, rund:r>=0?12:8, rollen:r>=0, karton:r>=1, folie:r>=2, tx:GFX==='ultralow'?0.5:1}; }

/* ---------- Bereiche, Ressourcen, Kollision ---------- */
function hvBereich(name){
  if(HALLE.bereiche[name]) return HALLE.bereiche[name];
  const g=new THREE.Group(); g.name='halle:'+name; g.userData._bnd=true; HALLE.g.add(g); HALLE.bereiche[name]=g; return g;
}
function hvRes(o){ HALLE.res.push(o); return o; }
function hvCol(x0,x1,z0,z1){ const c={minX:Math.min(x0,x1),maxX:Math.max(x0,x1),minZ:Math.min(z0,z1),maxZ:Math.max(z0,z1),ref:null,halle:true}; HALLE.cols.push(c); if(HALLE.sichtbar) colliders.push(c); return c; }
function hvLampe(x,y,z){ HALLE.lampen.push({x,y,z}); }

/* ---------- prozedurale Texturen (Ideen aus docs/bilder/referenz/szene/tex.js) ---------- */
function hvRng(seed){ let s=seed>>>0; return ()=>{ s=(s+0x6D2B79F5)|0; let t=Math.imul(s^(s>>>15),1|s); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
/* kachelbares Wertrauschen, mehrere Oktaven, Werte 0..1 */
function hvFbm(w,h,seed,sx,oct,gain){
  const out=new Float32Array(w*h), fns=[];
  for(let o=0;o<oct;o++){ const P=sx<<o, R=hvRng(seed*31+o*7), gr=new Float32Array(P*P); for(let i=0;i<gr.length;i++) gr[i]=R(); fns.push({P,gr}); }
  let norm=0, a=1; for(let o=0;o<oct;o++){ norm+=a; a*=gain; }
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    let v=0; a=1;
    for(let o=0;o<oct;o++){ const {P,gr}=fns[o], fx0=x/w*P, fy0=y/h*P, xi=Math.floor(fx0), yi=Math.floor(fy0);
      let fx=fx0-xi, fy=fy0-yi; fx=fx*fx*(3-2*fx); fy=fy*fy*(3-2*fy);
      const x0=xi%P, y0=yi%P, x1=(x0+1)%P, y1=(y0+1)%P, A=gr[y0*P+x0], B=gr[y0*P+x1], C=gr[y1*P+x0], D=gr[y1*P+x1];
      v+=a*(A+(B-A)*fx+(C-A)*fy+(A-B-C+D)*fx*fy); a*=gain; }
    out[y*w+x]=v/norm; }
  return out;
}
function hvFeldMalen(g,W,H,f,fn){ const id=g.createImageData(W,H); for(let i=0;i<W*H;i++){ const c=fn(f[i],i); id.data[i*4]=c[0]; id.data[i*4+1]=c[1]; id.data[i*4+2]=c[2]; id.data[i*4+3]=255; } g.putImageData(id,0,0); }
function hvTex(w,h,fn,srgb,rep){ const q=hvQ(); const W=Math.max(16,Math.round(w*q.tx)), Hh=Math.max(16,Math.round(h*q.tx));
  const t=hvRes(tex(W,Hh,fn,srgb)); t.wrapS=t.wrapT=THREE.RepeatWrapping; if(rep) t.repeat.set(rep[0],rep[1]); return t; }

/* Hallenboden: geschliffener, versiegelter Beton - hell, leicht wolkig, Quarzsprenkel. Kachel 4 x 4 m. */
function hvBodenTex(){
  return hvTex(512,512,(g,W,H)=>{
    const f=hvFbm(W,H,3,4,5,0.55), f2=hvFbm(W,H,12,2,3,0.5);
    hvFeldMalen(g,W,H,f,(v,i)=>{ const k=0.88+0.24*v+0.12*(f2[i]-0.5); return [158*k,161*k,164*k]; });
    const R=hvRng(4);
    for(let i=0;i<W*H/70;i++){ const l=R()<0.5?255:40; g.fillStyle=`rgba(${l},${l},${l},${0.03+R()*0.06})`; const s=1+R()*1.6; g.fillRect(R()*W,R()*H,s,s); }
    /* Laufspuren und Reifenabrieb, sehr schwach */
    for(let i=0;i<40;i++){ g.strokeStyle=`rgba(60,60,64,${0.02+R()*0.04})`; g.lineWidth=2+R()*5; const y=R()*H; g.beginPath(); g.moveTo(0,y); g.bezierCurveTo(W*0.3,y+(R()-0.5)*80,W*0.7,y+(R()-0.5)*80,W,y); g.stroke(); }
    /* Scheinfuge (Dehnungsfuge) am Kachelrand: alle 4 m eine feine Linie */
    g.fillStyle='rgba(70,72,76,.35)'; g.fillRect(0,0,W,1.5); g.fillRect(0,0,1.5,H);
  });
}
/* Sandwichpaneele innen: liegende Paneele 1 m hoch, feine Mikroprofilierung. Kachel 4 x 4 m. */
function hvPaneelTex(){
  return hvTex(256,512,(g,W,H)=>{
    const f=hvFbm(64,128,21,4,3,0.5);
    g.fillStyle='#d6dade'; g.fillRect(0,0,W,H);
    const ph=H/4;
    for(let p=0;p<4;p++){ const y=p*ph;
      for(let k=0;k<ph;k+=8){ g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(0,y+k,W,1); g.fillStyle='rgba(120,128,138,.10)'; g.fillRect(0,y+k+4,W,1.5); }
      g.fillStyle='rgba(70,76,86,.45)'; g.fillRect(0,y+ph-3,W,3); g.fillStyle='rgba(255,255,255,.6)'; g.fillRect(0,y,W,1.5); }
    for(let y=0;y<128;y++) for(let x=0;x<64;x++){ const v=f[y*64+x]; g.fillStyle=`rgba(${v>0.5?255:40},${v>0.5?255:44},${v>0.5?255:50},${Math.abs(v-0.5)*0.08})`; g.fillRect(x*W/64,y*H/128,W/64+1,H/128+1); }
  });
}
/* Betonsockel 1,2 m mit Schalungsstoessen */
function hvSockelTex(){
  return hvTex(256,128,(g,W,H)=>{
    const f=hvFbm(W,H,31,4,4,0.5);
    hvFeldMalen(g,W,H,f,v=>{ const k=0.86+0.24*v; return [168*k,170*k,168*k]; });
    const R=hvRng(32); for(let i=0;i<260;i++){ g.fillStyle=`rgba(40,40,40,${0.12+R()*0.2})`; const s=1+R()*2; g.beginPath(); g.arc(R()*W,R()*H,s,0,7); g.fill(); }
    g.fillStyle='rgba(60,62,64,.4)'; g.fillRect(W/2,0,2,H); g.fillRect(0,0,2,H);
  });
}
/* Trapezblech der Dachunterseite, Sicken laengs z */
function hvDeckeTex(){
  return hvTex(256,64,(g,W,H)=>{
    for(let x=0;x<W;x+=64){ const gr=g.createLinearGradient(x,0,x+64,0);
      gr.addColorStop(0,'#aeb4bc'); gr.addColorStop(0.2,'#dfe3e8'); gr.addColorStop(0.45,'#eef1f4'); gr.addColorStop(0.55,'#d5d9df'); gr.addColorStop(0.8,'#b9bfc7'); gr.addColorStop(1,'#9da3ac');
      g.fillStyle=gr; g.fillRect(x,0,64,H); }
  });
}
/* Torlamellen: Sektionaltor, 4 Lamellen je Kachel, Fensterreihe separat */
function hvLamellenTex(){
  return hvTex(128,512,(g,W,H)=>{
    g.fillStyle='#dfe2e6'; g.fillRect(0,0,W,H);
    const n=8, sh=H/n;
    for(let s=0;s<n;s++){ const y=s*sh, gr=g.createLinearGradient(0,y,0,y+sh);
      gr.addColorStop(0,'rgba(255,255,255,.35)'); gr.addColorStop(0.15,'rgba(255,255,255,.05)'); gr.addColorStop(0.8,'rgba(0,0,0,.05)'); gr.addColorStop(0.94,'rgba(0,0,0,.22)'); gr.addColorStop(1,'rgba(0,0,0,.4)');
      g.fillStyle=gr; g.fillRect(0,y,W,sh);
      if(s%2===0&&s){ g.fillStyle='rgba(30,34,40,.55)'; g.fillRect(0,y-1,W,3); } }
  });
}
/* Gitterrost fuer Buehnen (Alpha) */
function hvRostTex(){
  const t=hvTex(64,64,(g,W,H)=>{ g.clearRect(0,0,W,H); g.fillStyle='#9aa1aa';
    for(let i=0;i<W;i+=8) g.fillRect(i,0,2,H); for(let j=0;j<H;j+=16) g.fillRect(0,j,W,3); });
  return t;
}
/* Schutzzaun-Gitter (Alpha) */
function hvZaunTex(){
  return hvTex(64,64,(g,W,H)=>{ g.clearRect(0,0,W,H); g.fillStyle='#2b2f36';
    for(let i=0;i<W;i+=8) g.fillRect(i,0,1.6,H); for(let j=0;j<H;j+=8) g.fillRect(0,j,W,1.6); });
}
/* Karton-Atlas: 4 x 4 Seitenansichten fuer Kartons auf Paletten (ein Material fuer alle) */
const HV_ATLAS_N=4;
function hvKartonAtlas(){
  const namen=(typeof ORDER!=='undefined'&&ORDER.length)?ORDER.filter(t=>P[t]&&P[t].cat).slice(0,64):[];
  const R=hvRng(77);
  return hvTex(1024,1024,(g,W,H)=>{
    const c=W/HV_ATLAS_N;
    for(let k=0;k<HV_ATLAS_N*HV_ATLAS_N;k++){
      const x=(k%HV_ATLAS_N)*c, y=Math.floor(k/HV_ATLAS_N)*c;
      const pappe=['#c89b5c','#bf9150','#d0a46a','#b88a4e','#c49658'][k%5];
      g.fillStyle=pappe; g.fillRect(x,y,c,c);
      for(let i=0;i<260;i++){ g.fillStyle=`rgba(90,60,20,${R()*0.07})`; g.fillRect(x+R()*c,y+R()*c,2,2); }
      g.fillStyle='rgba(110,74,30,.35)'; g.fillRect(x,y,c,3); g.fillRect(x,y+c-3,c,3); g.fillRect(x,y,3,c); g.fillRect(x+c-3,y,3,c);
      /* Klebeband */
      g.fillStyle=['#b58a4f','#efece2','#c4342a','#e2b92e'][k%4]; g.fillRect(x,y+c*0.04,c,c*0.07);
      /* Etikett */
      const p=namen.length?P[namen[(k*5)%namen.length]]:null;
      g.fillStyle='#f5f1e6'; g.fillRect(x+c*0.1,y+c*0.2,c*0.8,c*0.3);
      g.fillStyle=p&&p.art?p.art.bg1:'#24345c'; g.fillRect(x+c*0.1,y+c*0.2,c*0.8,c*0.06);
      g.fillStyle='#16181f'; g.textAlign='center'; g.textBaseline='middle';
      const nm=p?p.name:'Feuerwerk'; fitFont(g,nm,c*0.74,30,BAR); g.fillText(nm,x+c/2,y+c*0.34);
      g.font=BAR(17); g.fillText(p?`${p.box} Stück · Kategorie F${p.cat}`:'Kategorie F2',x+c/2,y+c*0.44);
      /* 1.4G-Raute */
      g.save(); g.translate(x+c*0.24,y+c*0.72); g.rotate(Math.PI/4); g.fillStyle='#f28a1c'; g.fillRect(-20,-20,40,40); g.strokeStyle='#16181f'; g.lineWidth=2.5; g.strokeRect(-16,-16,32,32); g.restore();
      g.fillStyle='#16181f'; g.font=BUN(12); g.fillText('1.4G',x+c*0.24,y+c*0.72);
      /* Strichcode */
      for(let b=0;b<26;b++){ if(R()<0.55) g.fillRect(x+c*0.5+b*3.2,y+c*0.64,R()<0.5?1.4:2.6,c*0.16); }
      g.font=BAR(14); g.fillText('UN 0336',x+c*0.68,y+c*0.86);
    }
  });
}
/* Stretchfolie: Glanzstreifen, halbtransparent */
function hvFolieTex(){
  return hvTex(128,128,(g,W,H)=>{ g.clearRect(0,0,W,H); const R=hvRng(9);
    for(let i=0;i<34;i++){ const y=R()*H; g.fillStyle=`rgba(255,255,255,${0.08+R()*0.22})`; g.fillRect(0,y,W,1+R()*3); }
    for(let i=0;i<10;i++){ g.fillStyle=`rgba(230,240,255,${0.05+R()*0.1})`; g.fillRect(R()*W,0,2+R()*8,H); }
  });
}
/* Schild mit Text, einmal gemalt */
function hvSchildTex(txt,unter,bg,fg,w,h){
  return hvRes(tex(w||512,h||160,(g,W,H)=>{
    g.fillStyle=bg||'#1b2340'; g.fillRect(0,0,W,H);
    g.fillStyle=fg||'#f2c230'; g.fillRect(0,H-8,W,8);
    g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#eef2f8';
    fitFont(g,txt,W*0.9,unter?Math.round(H*0.42):Math.round(H*0.55),BUN); g.fillText(txt,W/2,unter?H*0.38:H/2-3);
    if(unter){ g.fillStyle=fg||'#f2c230'; fitFont(g,unter,W*0.9,Math.round(H*0.24),BAR); g.fillText(unter,W/2,H*0.74); }
  }));
}

/* ---------- Materialien (einmal je Halle, geteilt) ---------- */
let HVM=null;
function hvMaterialien(){
  if(HVM) return HVM;
  const q=hvQ();
  const vc=(o)=>hvRes(new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:0.6,metalness:0.1},o||{})));
  const boden=hvBodenTex(), paneel=hvPaneelTex(), sockel=hvSockelTex(), decke=hvDeckeTex(), lam=hvLamellenTex();
  paneel.repeat.set(1/4,1/4); sockel.repeat.set(1/2.4,1/1.2); decke.repeat.set(1/1.6,1/1.6);
  const rost=hvRostTex(); const zaun=hvZaunTex(); rost.repeat.set(4,4); zaun.repeat.set(2.5,2.5);
  HVM={
    lack:vc({roughness:0.55,metalness:0.12}),          /* lackierter Stahl, Gehaeuse */
    metall:vc({roughness:0.34,metalness:0.72}),        /* Aluprofile, verzinkt */
    matt:vc({roughness:0.88,metalness:0}),             /* Holz, Gummi, Pappe ohne Bild */
    leucht:hvRes(new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false})),
    plexi:hvRes(new THREE.MeshStandardMaterial({color:LIN(0xd8e6f0),transparent:true,opacity:0.22,roughness:0.08,metalness:0.1,depthWrite:false,side:THREE.DoubleSide})),
    boden:hvRes(new THREE.MeshStandardMaterial({map:boden,roughness:0.42,metalness:0.02})),
    bodenTex:boden,
    paneel:hvRes(new THREE.MeshStandardMaterial({map:paneel,roughness:0.62,metalness:0.08})),
    gelb:hvRes(new THREE.MeshStandardMaterial({map:paneel,color:LIN(0xf0c419),roughness:0.6,metalness:0.08})),
    sockel:hvRes(new THREE.MeshStandardMaterial({map:sockel,roughness:0.92})),
    decke:hvRes(new THREE.MeshStandardMaterial({map:decke,roughness:0.7,metalness:0.2})),
    laibung:hvRes(std(0xcfd3d9,{roughness:0.8})),
    aussen:typeof blechMat==='function'?blechMat():std(0xb9bec6),
    tor:hvRes(new THREE.MeshStandardMaterial({map:lam,roughness:0.45,metalness:0.35})),
    torTex:lam,
    rost:hvRes(new THREE.MeshStandardMaterial({map:rost,alphaTest:0.5,side:THREE.DoubleSide,roughness:0.5,metalness:0.6,transparent:false})),
    rostTex:rost,
    zaun:hvRes(new THREE.MeshStandardMaterial({map:zaun,alphaTest:0.5,side:THREE.DoubleSide,roughness:0.6,metalness:0.3})),
    zaunTex:zaun,
    karton:q.karton?hvRes(new THREE.MeshStandardMaterial({map:hvKartonAtlas(),roughness:0.88})):null,
    folie:q.folie?hvRes(new THREE.MeshStandardMaterial({map:hvFolieTex(),transparent:true,opacity:0.55,roughness:0.15,metalness:0.1,depthWrite:false})):null,
    holz:hvRes(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.92})),
    lichtband:hvRes(new THREE.MeshBasicMaterial({color:LIN(0xe9f2ff),toneMapped:false})),
    screen:hvRes(new THREE.MeshBasicMaterial({map:hvSchirmTex(),toneMapped:false})),
    schraffur:hvRes(new THREE.MeshStandardMaterial({map:hvTex(64,64,(g,W,H)=>{ g.fillStyle='#f2c230'; g.fillRect(0,0,W,H); g.fillStyle='#1d1f24';
      g.beginPath(); g.moveTo(0,0); g.lineTo(W/2,0); g.lineTo(0,H/2); g.fill(); g.beginPath(); g.moveTo(W,0); g.lineTo(W,H/2); g.lineTo(W/2,H); g.lineTo(0,H); g.fill(); }),roughness:0.6}))
  };
  return HVM;
}
/* Bedienbildschirm (HMI) einer Anlage */
function hvSchirmTex(){
  return hvRes(tex(256,160,(g,W,H)=>{
    g.fillStyle='#0d1a2b'; g.fillRect(0,0,W,H); g.fillStyle='#173a5e'; g.fillRect(0,0,W,22);
    g.fillStyle='#bfe3ff'; g.font=BAR(16); g.textBaseline='middle'; g.fillText('LINIE  ·  AUTOMATIK',8,11);
    g.fillStyle='#3ddc84'; g.fillRect(W-58,5,50,12);
    for(let i=0;i<5;i++){ g.fillStyle='#1d3554'; g.fillRect(10,32+i*24,W-20,18); g.fillStyle=['#3ddc84','#3ddc84','#f2c230','#3ddc84','#5fb4ff'][i]; g.fillRect(12,34+i*24,(W-24)*(0.35+0.13*i),14); }
  }));
}

/* ---------- Sammler: viele Teile, wenige Zeichenaufrufe ----------
   Jedes Teil ist eine Einheitsform mit Matrix (Lage, Drehung, Groesse) und
   Farbe; am Ende wird je Material eine Geometrie verschmolzen (merge aus
   reuse-helpers). */
const HV_GEO={};
function hvGeoBox(){ return HV_GEO.box||(HV_GEO.box=new THREE.BoxGeometry(1,1,1)); }
const HV_METER={zaun:1,rost:1};
function hvGeoTrichter(){ return HV_GEO.tr||(HV_GEO.tr=new THREE.CylinderGeometry(1,0.22,1,12,1,true)); }
function hvGeoZyl(seg){ const k='z'+seg; return HV_GEO[k]||(HV_GEO[k]=new THREE.CylinderGeometry(1,1,1,seg)); }
function hvSammler(){
  const L={};
  const add=(mat,geo,m,color,behalten)=>{ (L[mat]||(L[mat]=[])).push({geo,m,color,behalten}); };
  return {
    L,
    box(w,h,d,x,y,z,color,mat,rx,ry,rz){
      if(HV_METER[mat]&&!rx&&!ry&&!rz){ add(mat,hvMeterBox(w,h,d,x,y,z),HV_EINS,color); return; }
      add(mat||'lack',hvGeoBox(),tm(x,y,z,rx||0,ry||0,rz||0,w,h,d),color); },
    /* flaches Band schraeg in der x-y-Ebene (Schraegfoerderer, Rutsche) */
    platte(x0,y0,x1,y1,z,b,d,color,mat){ const l=Math.hypot(x1-x0,y1-y0); add(mat||'lack',hvGeoBox(),tm((x0+x1)/2,(y0+y1)/2,z,0,0,Math.atan2(y1-y0,x1-x0),l,d,b),color); },
    /* Trichter: Kegelstumpf, oben r1, unten r2 */
    trichter(r1,r2,h,x,y,z,color,mat){ add(mat||'lack',hvGeoTrichter(),tm(x,y,z,0,0,0,r1,h,r1),color); },
    /* Zylinder senkrecht (achse 'y'), quer in x ('x') oder in z ('z') */
    zyl(r,l,x,y,z,color,mat,achse,seg){ const rx=achse==='z'?Math.PI/2:0, rz=achse==='x'?Math.PI/2:0;
      add(mat||'metall',hvGeoZyl(seg||8),tm(x,y,z,rx,0,rz,r,l,r),color); },
    /* Strebe von (x0,y0,z0) nach (x1,y1,z1) als duenner Kasten */
    strebe(x0,y0,z0,x1,y1,z1,s,color,mat){ const dx=x1-x0, dy=y1-y0, dz=z1-z0, l=Math.hypot(dx,dy,dz); if(l<1e-4) return;
      const m=new THREE.Matrix4(), q=new THREE.Quaternion().setFromUnitVectors(V(0,1,0),V(dx/l,dy/l,dz/l));
      m.compose(V((x0+x1)/2,(y0+y1)/2,(z0+z1)/2),q,V(s,l,s)); add(mat||'lack',hvGeoBox(),m,color); },
    geo(geo,m,color,mat,behalten){ add(mat||'lack',geo,m,color,behalten); },
    leer(){ return !Object.keys(L).length; },
    fertig(parent,schatten){
      const out=[];
      for(const k in L){ if(!L[k].length) continue;
        const mesh=new THREE.Mesh(hvRes(merge(L[k])),HVM[k]); mesh.matrixAutoUpdate=false; mesh.updateMatrix(); mesh.userData.hvMat=k;
        if(HIQ&&schatten!==false&&k!=='leucht'&&k!=='plexi'){ mesh.castShadow=true; mesh.receiveShadow=true; }
        parent.add(mesh); out.push(mesh); }
      for(const k in L){ for(const p of L[k]) if(!p.behalten&&!Object.values(HV_GEO).includes(p.geo)) p.geo.dispose(); L[k].length=0; }
      return out;
    }
  };
}
/* Instanzen mit eigener Huellkugel - three r128 nimmt sonst die Kugel der
   Einzelform und schneidet die ganze Gruppe weg, sobald deren Ursprung aus
   dem Bild ist. */
function hvInst(geo,mat,mats,parent,farben,schatten){
  if(!mats.length) return null;
  const g2=new THREE.BufferGeometry(); if(geo.index) g2.setIndex(geo.index);
  for(const k in geo.attributes) g2.setAttribute(k,geo.attributes[k]);
  if(!geo.boundingSphere) geo.computeBoundingSphere();
  const box=new THREE.Box3(), p=new THREE.Vector3(), r0=geo.boundingSphere.radius;
  const im=new THREE.InstancedMesh(g2,mat,mats.length);
  let smax=1;
  mats.forEach((m,i)=>{ im.setMatrixAt(i,m); p.setFromMatrixPosition(m); box.expandByPoint(p);
    const e=m.elements; smax=Math.max(smax,Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10])); });
  if(farben) farben.forEach((c,i)=>im.setColorAt(i,LIN(c)));
  const s=new THREE.Sphere(); box.getBoundingSphere(s); s.radius+=r0*smax; g2.boundingSphere=s;
  im.instanceMatrix.needsUpdate=true;
  /* three r128 schaltet die Sichtpruefung fuer Instanzen ab - mit der eigenen Huellkugel geht sie wieder */
  im.frustumCulled=true;
  if(HIQ&&schatten!==false){ im.castShadow=true; im.receiveShadow=true; }
  hvRes(g2); parent.add(im); return im;
}
/* Wand als Kasten mit Meter-UVs (wie meterUV im Hauptspiel), in den Sammler:
   gleiche Materialien werden zu einem Mesh verschmolzen. Kein Eintrag in die
   globalen Wandlisten des Hauptspiels (WAENDE, occluders). */
function hvMeterBox(w,h,d,x,y,z){
  const g=new THREE.BoxGeometry(w,h,d); g.translate(x,y,z);
  const p=g.attributes.position, n=g.attributes.normal, uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){ const X=p.getX(i), Y=p.getY(i), Z=p.getZ(i), ax=Math.abs(n.getX(i)), ay=Math.abs(n.getY(i)), az=Math.abs(n.getZ(i));
    if(ay>ax&&ay>az) uv.setXY(i,X,Z); else if(ax>az) uv.setXY(i,Z,Y); else uv.setXY(i,X,Y); }
  return g;
}
const HV_EINS=new THREE.Matrix4();
function hvWand(S,x0,x1,z0,z1,y0,y1,mat){
  const w=x1-x0,h=y1-y0,d=z1-z0; if(w<=0.001||h<=0.001||d<=0.001) return;
  S.geo(hvMeterBox(w,h,d,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2),HV_EINS,0xffffff,mat||'paneel');
}
/* Paneelwand mit Betonsockel (1,2 m): ein Wandzug laengs x oder z */
function hvHallenWand(S,laengs,fest,a,b,y0,y1,innen,keinCol){
  const t=0.24, s=1.2;
  const mk=(ya,yb,mat)=>laengs?hvWand(S,a,b,fest-t/2,fest+t/2,ya,yb,mat):hvWand(S,fest-t/2,fest+t/2,a,b,ya,yb,mat);
  if(y0<s){ mk(y0,Math.min(s,y1),'sockel'); if(y1>s) mk(s,y1,innen||'paneel'); }
  else mk(y0,y1,innen||'paneel');
  if(!keinCol&&y0<1){ if(laengs) hvCol(a,b,fest-t/2,fest+t/2); else hvCol(fest-t/2,fest+t/2,a,b); }
}
/* Wand mit Oeffnungen [{a,b,h,zu}] (h = Sturzunterkante, zu = trotzdem Kollision) */
function hvWandMitOeffnungen(S,laengs,fest,von,bis,oeffn,H,innen){
  const L=oeffn.slice().sort((p,q)=>p.a-q.a); let x=von; const t=0.24;
  for(const o of L){ if(o.a>x) hvHallenWand(S,laengs,fest,x,o.a,0,H,innen);
    if(H>o.h) hvHallenWand(S,laengs,fest,o.a,o.b,o.h,H,innen,true);
    if(o.zu){ if(laengs) hvCol(o.a,o.b,fest-t/2,fest+t/2); else hvCol(fest-t/2,fest+t/2,o.a,o.b); }
    x=o.b; }
  if(bis>x) hvHallenWand(S,laengs,fest,x,bis,0,H,innen);
}
/* Text-Schild als Flaeche */
function hvSchild(parent,txt,unter,w,h,x,y,z,ry,bg,fg){
  const m=new THREE.Mesh(hvRes(new THREE.PlaneGeometry(w,h)),hvRes(new THREE.MeshStandardMaterial({map:hvSchildTex(txt,unter,bg,fg,Math.round(512*Math.min(2,w/h/3.2+0.3)),160),roughness:0.6})));
  m.position.set(x,y,z); m.rotation.y=ry||0; parent.add(m); return m;
}

/* ---------- Ablauf: Schritte, Laden, Abbauen ---------- */
function hallSchrittListe(o){
  const L=[
    ['Materialien und Texturen',()=>{ hvMaterialien(); }],
    ['Hallenhülle, Dach und Licht',()=>hvGebaeude(o)],
    ['Boden, Markierungen, Schatten',()=>hvBoden(o)],
    ['Kartonlager ③, gelbe Wand, Tor N1, Schleuse',()=>hvLagerBauen(o)],
    ['Rolltore R2–R6',()=>hvToreBauen(o)],
    ['Hochregal Gasse 1',()=>hvHochregalGasse(0)],
    ['Hochregal Gasse 2',()=>hvHochregalGasse(1)],
    ['Hochregal Gasse 3',()=>hvHochregalGasse(2)],
    ['Regalbediengeräte, I/O, Anbruch',()=>hvRbgUndIO()],
    ['Wareneingang, Schnellplätze, Packmaterial',()=>hvFlaechen()],
    ['Produktion: Hülle und Bunker',()=>hvProdHuelle(o)],
    ['Produktion: Straße Raketen',()=>hvStrasse(0)],
    ['Produktion: Straße Kugelbomben',()=>hvStrasse(1)],
    ['Produktion: Straße Batterien',()=>hvStrasse(2)],
    ['Laptop, Schilder, Feinschliff',()=>hvAusstattung(o)]
  ];
  return L;
}
function hallVorbereiten(o){
  if(HALLE.g) hallAbbauen();
  HALLE.opts=Object.assign({umfeld:false},o||{});
  HALLE.g=new THREE.Group(); HALLE.g.name='halle'; HALLE.g.userData._bnd=true; scene.add(HALLE.g);
  HALLE.bereiche={}; HALLE.cols=[]; HALLE.anim=[]; HALLE.lampen=[]; HALLE.zeiten={}; HALLE.gebaut=false; HALLE.sichtbar=true;
}
function hallFertig(){
  HALLE.gebaut=true;
  if(typeof navDirty==='function') try{ navDirty(); }catch(e){}
}
/* Schrittweise bauen: zwischen zwei Schritten bekommt der Browser ein Bild,
   damit der Ladebalken laeuft. */
function hallLaden(o,fortschritt,fertig){
  hallVorbereiten(o);
  const L=hallSchrittListe(HALLE.opts); let i=0;
  const weiter=()=>{
    if(i>=L.length){ hallFertig(); if(fortschritt) fortschritt(1,'Fertig'); if(fertig) fertig(); return; }
    const [txt,fn]=L[i]; if(fortschritt) fortschritt(i/L.length,txt);
    const naechster=()=>{ const t0=performance.now();
      try{ fn(); }catch(e){ HALLE.fehler=(HALLE.fehler||'')+txt+': '+(e&&e.message||e)+'\n'; if(typeof console!=='undefined') console.error('Halle',txt,e); }
      HALLE.zeiten[txt]=Math.round(performance.now()-t0); i++; weiter(); };
    if(typeof requestAnimationFrame==='function') requestAnimationFrame(()=>setTimeout(naechster,0)); else setTimeout(naechster,0);
  };
  weiter();
}
function hallBauen(o){
  hallVorbereiten(o);
  for(const [txt,fn] of hallSchrittListe(HALLE.opts)){ const t0=performance.now(); fn(); HALLE.zeiten[txt]=Math.round(performance.now()-t0); }
  hallFertig();
}
function hallAbbauen(){
  if(!HALLE.g) return;
  scene.remove(HALLE.g);
  HALLE.g.traverse(o=>{ if(o.geometry&&o.geometry.dispose) o.geometry.dispose(); });
  HALLE.res.forEach(r=>{ try{ if(r&&r.dispose) r.dispose(); }catch(e){} });
  HALLE.res=[]; HVM=null;
  HALLE.cols.forEach(c=>dropCol(c)); HALLE.cols=[];
  HALLE.g=null; HALLE.bereiche={}; HALLE.anim=[]; HALLE.lampen=[]; HALLE.gebaut=false;
}
function hallSichtbar(v){
  HALLE.sichtbar=!!v; if(!HALLE.g) return;
  HALLE.g.visible=HALLE.sichtbar;
  HALLE.cols.forEach(c=>{ const drin=colliders.indexOf(c)>=0; if(v&&!drin) colliders.push(c); else if(!v&&drin) dropCol(c); });
}
function hallTick(dt){
  if(!HALLE.gebaut||!HALLE.sichtbar) return;
  HALLE.t+=dt; for(const f of HALLE.anim) f(dt,HALLE.t);
}
/* Dreiecke und Zeichenaufrufe je Bereich (gezaehlt, nicht gerendert;
   Instanzen mal Anzahl). Die gemessenen Werte des Renderers liefert der
   Hallenmodus dazu. */
function hallMessen(){
  const out={}; let sd=0, st=0;
  for(const k in HALLE.bereiche){ let d=0,t=0;
    HALLE.bereiche[k].traverse(o=>{ if(!o.isMesh||!o.visible) return; const g=o.geometry; if(!g||!g.attributes.position) return;
      const n=(g.index?g.index.count:g.attributes.position.count)/3, inst=o.isInstancedMesh?o.count:1, nm=Array.isArray(o.material)?o.material.length:1;
      d+=nm; t+=n*inst; });
    out[k]={draw:d,tri:Math.round(t)}; sd+=d; st+=t; }
  out.gesamt={draw:sd,tri:Math.round(st)};
  return out;
}
