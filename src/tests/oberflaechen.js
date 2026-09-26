/* Waende und Boeden (Tom, 26.09.: "sieht teilweise echt kacke aus ...
   geile Parkettboeden, richtig gute Tapeten"):
   - VIELFALT: mindestens 20 Waende und 16 Boeden, die alten ids leben
     weiter (Spielstaende), jeder Belag malt ein eigenes Bild
   - FREI: alles ab Level 1 (Tom: "da ist direkt alles freigeschaltet"),
     Preise steigen, die Stimmung vom teuersten Belag bleibt wie vorher
   - VOLL: jeder Maler fuellt seine ganze Kachel
   - KEIN_RASTER: fugenlose Boeden haben kein 1-m-Raster mehr
   - NAHTLOS: an der Kachelkante kein Sprung
   - MASSSTAB: Wand 2,6 × 3,6 m, Boden 4 × 4 m, Leinwand im selben
     Seitenverhaeltnis, der Laden-Boden rechnet in 4-m-Kacheln
   - RELIEF: Fugen im Relief liegen auf den Fugen im Bild
   - GLANZ: Marmor spiegelt, Teppich nicht
   - SOCKEL: die Sockelleiste nimmt den Ton der Wand auf
   - MUSTER: der Laptop zeigt echte Materialbilder, alle verschieden
   - SPEICHERN: der Belag ueberlebt Speichern und Laden
   Braucht echtes three.js (UV des Ladenbodens). */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:30000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1200,height:760}}); p.setDefaultTimeout(180000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.money=1e7;
    const malen=(kind,x,W,H,hoehe)=>{ const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d');
      if(kind==='floor') bb.bodenMalen(g,W,H,x,!!hoehe); else bb.wandMalen(g,W,H,x,!!hoehe); return g.getImageData(0,0,W,H).data; };
    const grau=(d,i)=>(d[i]+d[i+1]+d[i+2])/3;
    o.anzahl={w:bb.WALLS.length,f:bb.FLOORS.length};
    const ALTW=['creme','weiss','salbei','sand','streifen','anthrazit','raute','ziegel','beere','blume','holzvert','mitternacht','petrol','gold'];
    const ALTF=['grau','vinyl','holz','schach','eiche','fliese','beton','industrie','teppich','terrazzo','marmor'];
    o.altFehlt=ALTW.filter(id=>!bb.WALLS.some(w=>w.id===id)).concat(ALTF.filter(id=>!bb.FLOORS.some(f=>f.id===id)));
    o.level=bb.WALLS.concat(bb.FLOORS).filter(x=>x.lvl!==1).map(x=>x.id);
    const steigt=L=>L.every((x,i)=>!i||x.cost>=L[i-1].cost);
    o.preisSteigt=steigt(bb.WALLS)&&steigt(bb.FLOORS);
    o.sand=(bb.WALLS.find(w=>w.id==='sand')||{}).cost;
    /* Stimmung: billigster und teuerster Belag */
    const amb=(w,f)=>{ S.wall=w; S.floor=f; return bb.ambienteScore(); };
    o.stimmung={min:amb(bb.WALLS[0].id,bb.FLOORS[0].id),max:amb(bb.WALLS[bb.WALLS.length-1].id,bb.FLOORS[bb.FLOORS.length-1].id)};
    S.wall='creme'; S.floor='grau';
    /* Bilder: jeder Belag anders, jede Kachel voll, nahtlos */
    const bilder={}, gleich=[], leer=[], naht=[];
    const pruefe=(kind,x,W,H,wrapY)=>{ const d=malen(kind,x,W,H);
      let h=0, n128=0; for(let i=0;i<d.length;i+=4){ h=(h*31+d[i]+d[i+1]*7+d[i+2]*13)>>>0; if(d[i]===128&&d[i+1]===128&&d[i+2]===128) n128++; }
      const key=kind+':'+x.id; if(bilder[h]) gleich.push(key+'=='+bilder[h]); else bilder[h]=key;
      if(n128/(W*H)>0.01) leer.push(key+' '+Math.round(n128/(W*H)*100)+'%');
      /* Kante: der Sprung zwischen letzter und erster Spalte darf nicht
         groesser sein als der groesste Sprung im Innern - Fugen und
         Brettenden gibt es innen auch, ein Farbwechsel mitten im Brett
         nur an einer falschen Kante */
      /* je zwei Spalten gemittelt: innen liegen Fugen oft auf halben
         Pixeln (weich), an der Kante auf ganzen (scharf) */
      const px=(x0,y0)=>grau(d,((((y0%H)+H)%H)*W+(((x0%W)+W)%W))*4);
      const sprung=x0=>{ let s=0; for(let y=0;y<H;y++) s+=Math.abs(px(x0-1,y)+px(x0,y)-px(x0+1,y)-px(x0+2,y))/2; return s/H; };
      let innen=0; for(let xx=2;xx<W-3;xx++) innen=Math.max(innen,sprung(xx));
      const rand=sprung(W-1);
      let randY=0, innenY=0;
      if(wrapY){ const zs=y0=>{ let s=0; for(let xx=0;xx<W;xx++) s+=Math.abs(px(xx,y0-1)+px(xx,y0)-px(xx,y0+1)-px(xx,y0+2))/2; return s/W; };
        randY=zs(H-1); for(let yy=2;yy<H-3;yy++) innenY=Math.max(innenY,zs(yy)); }
      /* Grastapete: die Bahnnaht liegt absichtlich auf der Kachelkante
         (alle 87 cm eine sichtbare Naht, wie echt) */
      if(key!=='wall:gras'&&(rand>innen*1.15+2||(wrapY&&randY>innenY*1.15+2))) naht.push(key+' '+rand.toFixed(1)+'/'+innen.toFixed(1)+(wrapY?' y '+randY.toFixed(1)+'/'+innenY.toFixed(1):''));
      return d; };
    const FB={};
    bb.FLOORS.forEach(f=>{ FB[f.id]=pruefe('floor',f,512,512,true); });
    bb.WALLS.forEach(w=>pruefe('wall',w,260,360,false));
    o.gleich=gleich; o.leer=leer; o.naht=naht;
    /* Raster: fugenlose Boeden - kein Spaltenmittel faellt auffaellig ab */
    o.raster={};
    for(const id of ['grau','vinyl','teppich','industrie']){ const d=FB[id], W=512, sp=[];
      for(let x=0;x<W;x++){ let s=0; for(let y=0;y<W;y++) s+=grau(d,(y*W+x)*4); sp.push(s/W); }
      const m=sp.slice().sort((a,b2)=>a-b2)[W>>1]; o.raster[id]=+Math.max(...sp.map(v=>m-v)).toFixed(1); }
    /* Massstab */
    const wt=bb.wallTex, ft=bb.floorTexRef;
    o.wand={w:wt.image.width,h:wt.image.height,rx:+wt.repeat.x.toFixed(4),ry:+wt.repeat.y.toFixed(4),B:bb.WAND_B,H:bb.WAND_H};
    o.boden={w:ft.image.width,h:ft.image.height,K:bb.BODEN_KACHEL};
    /* UV des Ladenbodens: 16 m breit = 4 Kacheln */
    let uvSpan=null; bb.scene.traverse(q=>{ if(uvSpan===null&&q.isMesh&&q.material===bb.floorMat&&q.geometry&&q.geometry.attributes&&q.geometry.attributes.uv&&q.geometry.attributes.position){
      const p2=q.geometry.attributes.position, uv=q.geometry.attributes.uv; let x0=1e9,x1=-1e9,u0=1e9,u1=-1e9;
      for(let i=0;i<p2.count;i++){ x0=Math.min(x0,p2.getX(i)); x1=Math.max(x1,p2.getX(i)); u0=Math.min(u0,uv.getX(i)); u1=Math.max(u1,uv.getX(i)); }
      if(x1-x0>1) uvSpan=+((x1-x0)/(u1-u0)).toFixed(3); } });
    o.uvMeter=uvSpan;
    /* Relief: die dunkelsten Stellen im Bild (Fugen) liegen im Relief tiefer */
    const relief=(id)=>{ const f=bb.FLOORS.find(x=>x.id===id), d=malen('floor',f,512,512), h=malen('floor',f,512,512,true);
      const v=[]; for(let i=0;i<d.length;i+=4) v.push(grau(d,i)); const s=v.slice().sort((a,b2)=>a-b2), grenze=s[Math.floor(v.length*0.04)];
      let hf=0,nf=0,ha=0; for(let k=0;k<v.length;k++){ const hv=h[k*4]; ha+=hv; if(v[k]<=grenze){ hf+=hv; nf++; } }
      /* Abstand der Hoehe an den dunkelsten Stellen vom Mittel: Fugen
         liegen tiefer, dunkle Terrazzokoerner hoeher - bei einem
         zweiten Zufallswurf fuer das Relief faellt beides auf null */
      return +Math.abs((ha/v.length)-(hf/nf)).toFixed(1); };
    o.relief={fischgraet:relief('fischgraet'),eiche:relief('eiche'),fliese:relief('fliese'),terrazzo:relief('terrazzo')};
    /* Glanz, Sockel */
    bb.setFloor('marmor'); o.marmor={rau:bb.floorMat.roughness,env:!!bb.floorMat.envMap,n:!!bb.floorMat.normalMap};
    bb.setFloor('teppich'); o.teppich={rau:bb.floorMat.roughness,env:!!bb.floorMat.envMap};
    const hexOf=c=>{ const x=c.clone?c.clone():c; if(x.convertLinearToSRGB) x.convertLinearToSRGB(); return '#'+[x.r,x.g,x.b].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join(''); };
    bb.setWall('mitternacht'); o.sockelMitternacht=hexOf(bb.sockelM().color);
    bb.setWall('salbei'); o.sockelSalbei=hexOf(bb.sockelM().color);
    /* Muster im Laptop: echte Bilder, alle verschieden */
    const urls=bb.WALLS.map(w=>bb.oberflaechenMuster('wall',w)).concat(bb.FLOORS.map(f=>bb.oberflaechenMuster('floor',f)));
    o.muster={bilder:urls.filter(u=>/^data:image\//.test(u)).length,verschieden:new Set(urls).size,soll:urls.length};
    bb.openLaptop(); document.querySelector('[data-tab="deko"]').click();
    const K=[...document.querySelectorAll('#lbody .sw.mat')];
    o.kacheln={n:K.length,mitBild:K.filter(k=>/url\(/.test(k.style.background)).length};
    bb.closeLaptop(false);
    /* Speichern */
    bb.setWall('damast'); bb.setFloor('versailles'); bb.save();
    const sd=JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>/boellerbude/.test(k))));
    o.gespeichert=sd.wall+'/'+sd.floor;
    return o; });
  console.log('ANZAHL  ',JSON.stringify(r.anzahl),'alt fehlt',JSON.stringify(r.altFehlt),'| Level',JSON.stringify(r.level),'| Preis steigt',r.preisSteigt,'sand',r.sand,'| Stimmung',JSON.stringify(r.stimmung));
  console.log('BILDER  gleich',JSON.stringify(r.gleich),'leer',JSON.stringify(r.leer),'Naht',JSON.stringify(r.naht));
  console.log('RASTER  ',JSON.stringify(r.raster));
  console.log('MASS    wand',JSON.stringify(r.wand),'boden',JSON.stringify(r.boden),'UV-Meter',r.uvMeter);
  console.log('RELIEF  ',JSON.stringify(r.relief));
  console.log('GLANZ   marmor',JSON.stringify(r.marmor),'teppich',JSON.stringify(r.teppich),'| SOCKEL',r.sockelMitternacht,r.sockelSalbei);
  console.log('MUSTER  ',JSON.stringify(r.muster),'Kacheln',JSON.stringify(r.kacheln),'| gespeichert',r.gespeichert);
  pruef('VIELFALT',r.anzahl.w>=20&&r.anzahl.f>=16&&!r.altFehlt.length,JSON.stringify([r.anzahl,r.altFehlt]));
  pruef('VIELFALT',!r.gleich.length,'gleiche Bilder: '+r.gleich.join(','));
  pruef('FREI',!r.level.length&&r.preisSteigt&&r.sand===250,JSON.stringify({level:r.level,steigt:r.preisSteigt,sand:r.sand}));
  pruef('FREI',r.stimmung.max-r.stimmung.min===46,'Stimmung aus Wand und Boden: '+JSON.stringify(r.stimmung));
  pruef('VOLL',!r.leer.length,'ungemalte Flaeche: '+r.leer.join(','));
  pruef('KEIN_RASTER',Object.values(r.raster).every(v=>v<6),JSON.stringify(r.raster));
  pruef('NAHTLOS',!r.naht.length,'Kante springt: '+r.naht.join(' | '));
  pruef('MASSSTAB',Math.abs(r.wand.w/r.wand.h-r.wand.B/r.wand.H)<0.01&&Math.abs(r.wand.rx-1/r.wand.B)<1e-3&&Math.abs(r.wand.ry-1/r.wand.H)<1e-3&&r.boden.w===r.boden.h&&r.boden.K===4&&r.uvMeter===4,JSON.stringify([r.wand,r.boden,r.uvMeter]));
  pruef('RELIEF',Object.values(r.relief).every(v=>v>8),'Relief passt nicht zum Bild: '+JSON.stringify(r.relief));
  pruef('GLANZ',r.marmor.rau<0.3&&r.marmor.env&&r.marmor.n&&r.teppich.rau>=0.9&&!r.teppich.env,JSON.stringify([r.marmor,r.teppich]));
  pruef('SOCKEL',r.sockelMitternacht==='#b7954f'&&r.sockelSalbei!==r.sockelMitternacht&&r.sockelSalbei!=='#1a2038',r.sockelMitternacht+' / '+r.sockelSalbei);
  pruef('MUSTER',r.muster.bilder===r.muster.soll&&r.muster.verschieden===r.muster.soll&&r.kacheln.n===r.muster.soll&&r.kacheln.mitBild===r.kacheln.n,JSON.stringify([r.muster,r.kacheln]));
  pruef('SPEICHERN',r.gespeichert==='damast/versailles','gespeichert: '+r.gespeichert);
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();
