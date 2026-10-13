/* =========================================================
   Materialbibliothek (Fundament Etappe 2, Schritt 0)

   Tom 13.10.2026: "einheitliche Struktur – ändert man es an einer
   Stelle, ändert es sich überall." Farben, Materialien und geteilte
   prozedurale Texturen kommen ab jetzt von hier. Vorher legte jede
   Baufunktion ihre eigenen Materialien an (984 Material-Objekte, davon
   501 Dubletten, 59 fuer ein und dasselbe Gelb) und malte die
   Betontextur 19-mal neu.

   Regeln (verbindlich, siehe docs/fundament/baukasten.md):
   - Ein Material aus MAT.get/MAT.std/MAT.basic/MAT.vc ist GETEILT. Es wird
     nie veraendert (color.set, opacity, emissiveIntensity, map, visible,
     dispose ...). Wer ein Material spaeter aendern will, holt sich mit
     MAT.neu(...) ein eigenes.
   - Texturen aus MAT.tex(name) sind geteilt und kacheln mit repeat 1.
     Den Massstab traegt die Geometrie: MAT.kachel(geo,rx,ry) skaliert die
     UVs (gleiches Bild wie vorher texture.repeat.set(rx,ry)).
   - Neue Farbe/neues Material: Eintrag in FARBE/REZEPT ergaenzen, nicht
     daneben neu bauen.
   - Grafikstufe: MAT.stufe() steht beim Laden fest. Ultra Low bekommt
     ueber den Lambert-Austausch in reuse-helpers.js automatisch einfache
     Materialien (MAT baut ueber THREE.MeshStandardMaterial).
   - Waechter: mit localStorage bb_matwache=1 (oder window.__MATWACHE vor
     dem Laden) meldet jedes geteilte Material, das doch veraendert wird,
     einen Eintrag in MAT.verstoesse (Test src/tests/material.js).
   ========================================================= */
const MAT=(function(){
  /* ---------- Farben (sRGB-Hex, Namen sprechend, deutsch) ----------
     Werte = die im Spiel heute haeufigsten Hex-Werte (Inventar 13.10.,
     inventar-optik.md 3.1); keine Farbe wurde dafuer veraendert. */
  const FARBE={
    signalGelb:0xf2c230, signalRot:0xd8352a, signalGruen:0x2f9e57, signalOrange:0xf2a01c, signalBlau:0x2a5a9e,
    gitterGelb:0xe7a91c, schildGold:0xffd23f, schildBlau:0x1b2340,
    lackAnthrazit:0x2a2e38, lackGraphit:0x3a4150, lackWeiss:0xe8ecf2, grauMittel:0x6a7078,
    stahlVerzinkt:0x8d939d, stahlPfosten:0x59606b, stahlKappe:0x3c424d, alu:0xc9ced6,
    gummiSchwarz:0x1c1f24, betonHell:0xa8acb2, betonSockel:0x9a9ea6, sockelGrau:0x3f4654,
    deckeWeiss:0xe6e8ee, schnee:0xeef2f8, holzPalette:0xc49a62, holzPaletteDunkel:0xa9814e,
    wellpappe:0xc89b5c, lampeGehaeuse:0x23262e, lampeWarm:0xfff0d0, glasKlar:0xd6ecff
  };
  /* ---------- benannte Materialien (Rezepte) ----------
     f = Farbe (Name aus FARBE oder Hex), r/m = roughness/metalness, sonst
     beliebige Material-Optionen. Werte exakt wie an den umgestellten
     Stellen vorher (reiner Umbau, Optik gleich). */
  const REZEPT={
    signalGelb:{f:'signalGelb'},                                  /* std(0xf2c230): Bodenstriche, Markierungen */
    deckeWeiss:{f:'deckeWeiss',r:1},                              /* Decken (std(0xe6e8ee,{roughness:1})) */
    schnee:{f:'schnee',r:1},                                      /* Schneedecken auf Daechern/Mauern */
    betonBoden:{f:0xffffff,tex:'beton',r:0.85},                    /* Lager-/Schleusenboden (Beton, Massstab per MAT.kachel) */
    zaunPfosten:{f:'stahlPfosten',r:0.42,m:0.6},                  /* Doppelstabmatte: Pfosten */
    zaunKappe:{f:'stahlKappe',r:0.5,m:0.5},                       /* Doppelstabmatte: Kappen, Schellen */
    zaunSockel:{f:'betonSockel',r:0.95},                          /* Doppelstabmatte: Sockelschiene */
    zaunGitter:{f:0xffffff,tex:'doppelstab',transparent:true,alphaTest:0.35,side:THREE.DoubleSide,m:0.55,r:0.45}, /* Doppelstabmatte (Textur) */
    sockelGrau:{f:'sockelGrau'}                                   /* Sockel/Stadt #3f4654 */
  };
  /* Vertexfarben-Klassen (Sammler, bk.sammler): Farbe je Ecke, Oberflaeche je Klasse */
  const VC_KLASSE={
    standard:{roughness:0.45},                                    /* vcMat (04-models): Ware, Paletten, V1 */
    lack:{roughness:0.34,metalness:0.06}, metall:{roughness:0.26,metalness:0.78},
    matt:{roughness:0.72,metalness:0.0}, glas:{roughness:0.08,metalness:0.35}
    /* leucht: MeshBasicMaterial ohne Tonemapping (unten) */
  };

  const cache=new Map(), texCache=new Map(), zaehler=new Map();
  const zaehle=(k)=>{ zaehler.set(k,(zaehler.get(k)||0)+1); };
  const hexVon=f=>typeof f==='string'?(FARBE[f]!==undefined?FARBE[f]:(()=>{ throw new Error('MAT: Farbe unbekannt: '+f); })()):f;

  /* ---------- Waechter (nur Pruefung, sonst aus) ---------- */
  let wacheAn=false; try{ wacheAn=!!window.__MATWACHE||localStorage.getItem('bb_matwache')==='1'; }catch(e){}
  const verstoesse=[];
  const WACH=['opacity','transparent','visible','emissiveIntensity','map','emissiveMap','alphaMap','roughness','metalness','side','depthWrite','depthTest','alphaTest','wireframe','vertexColors','color','emissive','polygonOffset','colorWrite','toneMapped','blending'];
  function melde(name,was){ if(verstoesse.length<200) verstoesse.push({name,was,stack:String(new Error().stack).split('\n').slice(2,7).join(' | ')}); }
  function bewacheFarbe(name,c,k){ if(!c||!c.isColor) return; for(const x of ['r','g','b']){ let v=c[x]; Object.defineProperty(c,x,{configurable:true,enumerable:true,get(){ return v; },set(n){ if(n!==v) melde(name,k+'.'+x); v=n; }}); } }
  function bewache(name,m){
    if(!wacheAn) return m;
    for(const k of WACH){ if(!(k in m)) continue; let v=m[k]; if(v&&v.isColor) bewacheFarbe(name,v,k);
      Object.defineProperty(m,k,{configurable:true,enumerable:true,get(){ return v; },set(n){ if(n!==v){ melde(name,k); if(n&&n.isColor) bewacheFarbe(name,n,k); } v=n; }}); }
    const d=m.dispose; m.dispose=function(){ melde(name,'dispose'); return d.apply(this,arguments); };
    return m;
  }

  /* ---------- Grafikstufe (beim Laden fest) ---------- */
  let _stufe=null;
  function stufe(){
    if(_stufe) return _stufe;
    const g=typeof GFX!=='undefined'?GFX:'hoch', p=(typeof GFX_PROFIL!=='undefined'&&GFX_PROFIL[g])||{tex:1,ani:4};
    const rang=typeof gfxRang==='function'?gfxRang(g):2;
    /* lod: 0 = Ultra Low (Kasten statt Fase, wenig Segmente), 1 = Niedrig..Hoch, 2 = ab Maximum */
    return _stufe={name:g,rang,tx:p.tex,aniso:p.ani,lambert:g==='ultralow',lod:g==='ultralow'?0:(rang>=3?2:1)};
  }

  /* ---------- Materialien ---------- */
  function ausRezept(name,extra){
    const R=REZEPT[name]; if(!R) throw new Error('MAT: Material unbekannt: '+name);
    const o={roughness:R.r!==undefined?R.r:0.85,metalness:R.m!==undefined?R.m:0};
    for(const k in R) if(k!=='f'&&k!=='r'&&k!=='m'&&k!=='tex') o[k]=R[k];
    if(R.tex) o.map=texGet(R.tex);
    if(extra) Object.assign(o,extra);
    const m=new THREE.MeshStandardMaterial(o); m.color=LIN(hexVon(R.f)); return m;
  }
  /* ein geteiltes Material je Schluessel; die Fabrik bleibt gemerkt (MAT.kopie) */
  const fabrik=new Map();
  function geteilt(k,f){ zaehle(k); let m=cache.get(k); if(!m){ m=bewache(k,f()); (m.userData||(m.userData={})).mat=k; cache.set(k,m); fabrik.set(k,f); } return m; }
  /* geteiltes benanntes Material */
  function get(name){ return geteilt('get:'+name,()=>ausRezept(name)); }
  /* eigenes (veraenderbares) Material nach Rezept - wird gezaehlt, nicht geteilt */
  function neu(name,extra){ zaehle('neu:'+name); return ausRezept(name,extra); }
  /* frische, eigene Kopie eines geteilten Materials (gleiche Werte, nicht bewacht) - z. B. fuer
     Pracht (03d), das je Ort (Spiegelboden, innen/aussen) eigene Werte setzt */
  function kopie(m){ const f=m&&m.userData&&fabrik.get(m.userData.mat); zaehle('kopie:'+(m&&m.userData&&m.userData.mat)); return f?f():m.clone(); }
  /* Schluessel aus einfachen Optionen; Texturen/Objekte sind nicht erlaubt (dann eigenes Material) */
  function schluessel(art,hex,o){ let s=art+':'+(hex>>>0).toString(16);
    if(o){ for(const k of Object.keys(o).sort()){ const v=o[k]; if(v!==null&&typeof v==='object') throw new Error('MAT.'+art+': Option '+k+' ist ein Objekt - dafuer MAT.neu/eigenes Material'); s+='|'+k+'='+v; } }
    return s; }
  /* geteiltes Standardmaterial nach Farbe + Optionen - gleiche Werte wie std(hex,o) */
  function stdGeteilt(hex,o){ return geteilt(schluessel('std',hex,o),()=>std(hex,o)); }
  /* geteiltes MeshBasicMaterial (Farbe wie new MeshBasicMaterial({color:hex}) - ohne Linearisierung) */
  function basic(hex,o){ return geteilt(schluessel('basic',hex,o),()=>new THREE.MeshBasicMaterial(Object.assign({color:hex},o||{}))); }
  /* Vertexfarben-Material je Klasse */
  function vc(klasse){ const kl=klasse||'standard';
    return geteilt('vc:'+kl,()=>{ if(kl==='leucht') return new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
      const o=VC_KLASSE[kl]; if(!o) throw new Error('MAT.vc: Klasse unbekannt: '+kl); return new THREE.MeshStandardMaterial(Object.assign({vertexColors:true},o)); }); }
  function farbe(name){ return hexVon(name); }

  /* ---------- geteilte prozedurale Texturen (lazy, einmal gemalt) ---------- */
  const TEXTUR={
    /* Beton (vorher concreteTex() in 05b-ao.js, 19 Aufrufe an 12 Stellen) - Malcode unveraendert */
    beton:()=>{ const t=tex(256,256,(g,W,H)=>{ g.fillStyle='#8a8e94'; g.fillRect(0,0,W,H); for(let i=0;i<2500;i++){ const v=Math.random(); g.fillStyle=`rgba(${v<0.5?0:255},${v<0.5?0:255},${v<0.5?0:255},${Math.random()*0.06})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); } g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=2; g.strokeRect(0,0,W,H); });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; },
    /* Doppelstabmatte (vorher gitterMat() in 05e-street.js, je Zaunlauf neu gemalt) - Malcode unveraendert */
    doppelstab:()=>{ const t=tex(256,256,(g,W,H)=>{
        g.clearRect(0,0,W,H);
        g.strokeStyle='#6f7783'; g.lineCap='round';
        /* senkrechte Einzelstaebe */
        g.lineWidth=7;
        for(let x=16;x<W;x+=51){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); }
        /* waagerechte Doppelstaebe */
        g.lineWidth=6;
        for(let y=22;y<H;y+=51){
          g.strokeStyle='#848c98'; g.beginPath(); g.moveTo(0,y-5); g.lineTo(W,y-5); g.stroke();
          g.strokeStyle='#5f6672'; g.beginPath(); g.moveTo(0,y+5); g.lineTo(W,y+5); g.stroke();
        }
        /* Lichtkante oben auf den Staeben */
        g.strokeStyle='rgba(255,255,255,.3)'; g.lineWidth=2;
        for(let x=16;x<W;x+=51){ g.beginPath(); g.moveTo(x-2,0); g.lineTo(x-2,H); g.stroke(); }
      });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t; }
  };
  function texGet(name){ zaehle('tex:'+name); let t=texCache.get(name); if(!t){ const f=TEXTUR[name]; if(!f) throw new Error('MAT.tex: Textur unbekannt: '+name); t=f(); t.userData=t.userData||{}; t.userData.mat=name; texCache.set(name,t); } return t; }
  /* Massstab in die UVs (statt texture.repeat) - dann teilen alle Flaechen eine Textur */
  function kachel(geo,rx,ry){ const uv=geo.attributes.uv; if(!uv) return geo; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*rx,uv.getY(i)*ry); uv.needsUpdate=true; return geo; }

  /* ---------- Uebersicht fuer Waechter-Tests und Uebersichtsseite ---------- */
  function liste(){
    const mats=[], texs=[]; for(const [k,m] of cache) mats.push({name:k,typ:m.type,abrufe:zaehler.get(k)||0});
    for(const [k,t] of texCache){ const im=t.image||{}; texs.push({name:k,w:im.width||0,h:im.height||0,abrufe:zaehler.get('tex:'+k)||0}); }
    const neuL=[]; for(const [k,n] of zaehler) if(k.indexOf('neu:')===0||k.indexOf('kopie:')===0) neuL.push({name:k,abrufe:n});
    let abrufe=0; for(const x of mats) abrufe+=x.abrufe;
    return {materialien:mats,texturen:texs,eigene:neuL,geteilt:mats.length,abrufe,gespart:abrufe-mats.length,farben:Object.keys(FARBE).length,rezepte:Object.keys(REZEPT).length};
  }
  return {FARBE,REZEPT,get,neu,kopie,std:stdGeteilt,basic,vc,farbe,tex:texGet,kachel,stufe,liste,verstoesse,get wache(){ return wacheAn; }};
})();
