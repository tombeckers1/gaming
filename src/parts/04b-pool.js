class ItemPool{
  constructor(parts,cap){
    this.cap=cap; this.h=[];
    this.meshes=parts.map(p=>{ const m=new THREE.InstancedMesh(p.geo,p.mat,cap); m.count=0; m.visible=false; m.frustumCulled=false; m.castShadow=HIQ&&!p.mat.transparent; m.receiveShadow=HIQ; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); return m; });
  }
  /* 02.10.: seit die Ware das Fach auch in die Tiefe fuellt, passt in ein
     Fach ein Vielfaches - der Vorrat waechst mit (doppelt), statt dass das
     Einraeumen mitten im Karton stehen bleibt. Obergrenze nur zur Sicherheit. */
  full(){ return this.h.length>=12000; }
  wachse(){ const neu=Math.min(12000,this.cap*2);
    this.meshes=this.meshes.map(m=>{ const n=new THREE.InstancedMesh(m.geometry,m.material,neu); n.count=m.count; n.visible=m.visible; n.frustumCulled=false; n.castShadow=m.castShadow; n.receiveShadow=m.receiveShadow;
      n.instanceMatrix.setUsage(THREE.DynamicDrawUsage); n.instanceMatrix.array.set(m.instanceMatrix.array); n.instanceMatrix.needsUpdate=true;
      const par=m.parent||scene; par.remove(m); par.add(n); m.dispose&&m.dispose(); return n; });
    this.cap=neu; }
  add(mx){ if(this.h.length>=this.cap) this.wachse(); const h={i:this.h.length,m:mx.clone(),pool:this}; this.h.push(h); for(const me of this.meshes){ me.setMatrixAt(h.i,mx); me.count=this.h.length; me.visible=true; me.instanceMatrix.needsUpdate=true; } return h; }
  remove(h){ if(!h||this.h[h.i]!==h) return; const last=this.h.pop(); if(last!==h){ this.h[h.i]=last; last.i=h.i; for(const me of this.meshes) me.setMatrixAt(h.i,last.m); } for(const me of this.meshes){ me.count=this.h.length; me.visible=this.h.length>0; me.instanceMatrix.needsUpdate=true; } }
  /* 04.10. (Tom, iPhone: Gameplay-Vorfuehrung mit 5 Bildern je Sekunde -
     gemessen 9,4 Millionen Dreiecke Ware, weil jedes Fach bis ganz hinten
     voll ist): verdeckte Stuecke hinter vollen Reihen werden nicht
     gezeichnet. versteckt nimmt das Stueck aus dem Zeichenpuffer, die
     Matrix bleibt am Griff; zeige stellt es wieder hinein. */
  verstecke(h){ if(!h||h.versteckt||this.h[h.i]!==h) return; this.remove(h); h.versteckt=true; }
  zeige(h){ if(!h||!h.versteckt) return; h.versteckt=false; if(this.h.length>=this.cap) this.wachse();
    h.i=this.h.length; this.h.push(h); for(const me of this.meshes){ me.setMatrixAt(h.i,h.m); me.count=this.h.length; me.visible=true; me.instanceMatrix.needsUpdate=true; } }
  set(h,mx){ if(h.versteckt){ h.m.copy(mx); return; } if(this.h[h.i]!==h) return; h.m.copy(mx); for(const me of this.meshes){ me.setMatrixAt(h.i,mx); me.instanceMatrix.needsUpdate=true; } }
}
/* Pools entstehen erst, wenn die Ware zum ersten Mal gebraucht wird
   (Tom, 26.09.: Sortiment mal drei). Vorher baute der Start fuer jedes
   Produkt Modell und Verpackung - bei 228 Produkten ueber 200 Megapixel
   Texturen, auch fuer Ware, die erst zwanzig Level spaeter kommt. */
const _pools={};
const pools=new Proxy(_pools,{get(o,k){
  if(typeof k==='string'&&!(k in o)&&typeof P!=='undefined'&&P[k]&&P[k].dims) o[k]=new ItemPool(buildProduct(k),poolCap(k));
  return o[k]; }});
function poolDa(t){ return t in _pools; }
/* Pool ganz weg (Verpackungs-Vorfuehrung beim Beenden): Meshes aus der
   Szene, eigene Geometrie, Materialien mit Bild und die Bilder frei.
   Die geteilten Materialien (vcMat, Glas) bleiben. */
function poolWeg(t){ const pl=_pools[t]; if(!pl) return; const geteilt=new Set([vcMat,glassMat,bottleGlass]);
  for(const m of pl.meshes){ if(m.parent) m.parent.remove(m); m.geometry.dispose(); if(m.dispose) m.dispose();
    const ms=Array.isArray(m.material)?m.material:[m.material];
    ms.forEach(mt=>{ if(!mt||geteilt.has(mt)) return; for(const k of ['map','emissiveMap','alphaMap','bumpMap']) if(mt[k]) mt[k].dispose(); mt.dispose(); }); }
  delete _pools[t]; }
const _q=new THREE.Quaternion(), _e=new THREE.Euler(), _one=V(1,1,1);
function mx(x,y,z,ry){ _e.set(0,ry||0,0); _q.setFromEuler(_e); return new THREE.Matrix4().compose(V(x,y,z),_q,_one); }

/* So viele Stueck, wie ein volles Fach im breitesten Regal fasst - je
   Stellplatz einmal. Seit die Ware das Fach ganz fuellt, rechnet das
   mit der vollen Regalbreite statt mit dem Gitter im Produkt. */
function poolCap(t){ const p=P[t], g=p.grid, gap=0.012;
  const cols=Math.max(1,Math.floor((2.0-0.1+gap)/(p.dims[0]+gap)));
  return Math.min(1600,cols*g[1]*g[2]*SLOTS.length+60); }

/* Kartons */
const kartonGeo=new THREE.BoxGeometry(0.6,0.4,0.45);
const kartonMat={};
/* Absender nach Sparte - bei jedem Produkt steht einer drauf, je nach
   Hash der Sorte (nicht jeder Karton ist einzigartig, aber sie sehen
   nicht mehr alle gleich aus) */
const KARTON_ABS={
  feuerwerk:['Pyro-Fachhandel Brandt','Feuerwerk-Großhandel Kowalski','Import Feuerwerk GmbH','Premium Pyrotechnik','Restposten-Ratzke'],
  essen:['Frisch & Fein Großmarkt','Kantinen-Service Nord','Feinkost Hartmann','Gourmet-Lieferdienst'],
  getraenke:['Getränkehandel Ostmann','Sekt- & Weinkontor','Brauhaus-Vertrieb Süd'],
  zubehoer:['Party-Zubehör Lang','Festartikel Becker','Silvester-Bedarf Roth','Dekor-Großhandel Weiß']};
/* Nur Feuerwerk (Kategorie F1/F2) ist Gefahrgut: UN 0336, Klasse 1.4,
   Vertraeglichkeitsgruppe G. Essen, Getraenke, Zubehoer und Einrichtung
   tragen kein Gefahrgutzeichen (Tom, 07.10.). */
function kartonGefahrgut(t){ const p=P[t]; return !!p&&(p.cat===1||p.cat===2); }
function kartonVariante(t){
  const p=P[t], h=hashStr('karton'+t), sp=p.cat?'feuerwerk':(p.sparte||'zubehoer');
  const abs=KARTON_ABS[sp]||KARTON_ABS.zubehoer;
  return {
    pappe:['#c89b5c','#bf9150','#d0a46a','#b88a4e'][h%4],
    band:[{c:'#b58a4f',n:'braun'},{c:'#efece2',n:'weiss'},{c:'#c4342a',n:'rot'},{c:'#e2b92e',n:'gelb'}][(h>>3)%4],
    quer:((h>>6)&3)===0,                 /* Klebeband quer statt laengs */
    absender:abs[(h>>8)%abs.length],
    logo:['rund','eck','strich'][(h>>12)%3],
    griff:((h>>14)&1)===1,
    barcode:((h>>15)&1)===0
  };
}
function buildKartons(){
  ORDER.forEach(t=>{ const p=P[t], v=kartonVariante(t), gefahr=kartonGefahrgut(t);
    kartonMat[t]=new THREE.MeshStandardMaterial({roughness:0.9,map:tex(256,256,(g,W,H)=>{
      g.fillStyle=v.pappe; g.fillRect(0,0,W,H);
      for(let i=0;i<500;i++){ g.fillStyle=`rgba(90,60,20,${Math.random()*0.06})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
      g.fillStyle='rgba(120,80,30,.25)'; g.fillRect(0,0,W,6); g.fillRect(0,H-6,W,6); g.fillRect(0,0,6,H); g.fillRect(W-6,0,6,H);
      /* Klebeband: laengs ueber die Mitte oder quer unter dem Etikett */
      if(v.quer){ g.fillStyle=v.band.c; g.fillRect(0,H*0.5,W,H*0.075); g.fillStyle='rgba(255,255,255,.14)'; g.fillRect(0,H*0.5,W,H*0.015); }
      else { g.fillStyle=v.band.c; g.fillRect(W*0.44,0,W*0.12,H); g.fillStyle='rgba(255,255,255,.14)'; g.fillRect(W*0.44,0,W*0.02,H); }
      /* Absender oben links (klein, auf dem Band-freien Streifen) */
      g.fillStyle='rgba(30,24,16,.78)'; g.textAlign='left'; g.textBaseline='middle';
      const lg=(x,y,r)=>{ g.save(); g.translate(x,y); g.fillStyle='rgba(30,24,16,.78)';
        if(v.logo==='rund'){ g.beginPath(); g.arc(0,0,r,0,Math.PI*2); g.fill(); g.fillStyle=v.pappe; g.beginPath(); g.arc(0,0,r*0.55,0,Math.PI*2); g.fill(); }
        else if(v.logo==='eck'){ g.rotate(Math.PI/4); g.fillRect(-r*0.8,-r*0.8,r*1.6,r*1.6); g.fillStyle=v.pappe; g.fillRect(-r*0.4,-r*0.4,r*0.8,r*0.8); }
        else { g.fillRect(-r,-r*0.7,r*2,r*0.4); g.fillRect(-r,r*0.3,r*2,r*0.4); }
        g.restore(); };
      lg(W*0.1,H*0.07,6); g.font=BAR(13); g.fillText(v.absender,W*0.16,H*0.07+1);
      /* Etikett mit Produkt */
      g.fillStyle='#f7f3ea'; g.fillRect(W*0.08,H*0.14,W*0.84,H*0.34);
      g.fillStyle=p.art.bg1; g.fillRect(W*0.08,H*0.14,W*0.84,H*0.07);
      g.fillStyle='#16181f'; g.textAlign='center'; g.textBaseline='middle';
      fitFont(g,p.name,W*0.78,34,BAR); g.fillText(p.name,W/2,H*0.3);
      g.font=BAR(20); g.fillText(`${p.box} Stück, ${p.cat?'Kategorie F'+p.cat:SPARTE_NAME[p.sparte||'zubehoer']}`,W/2,H*0.42);
      const unten=v.quer?H*0.68:H*0.72;
      if(gefahr){
        /* UN 0336, Klasse 1.4, Vertraeglichkeitsgruppe G */
        g.save(); g.translate(W*0.24,unten+(v.quer?H*0.1:0)); g.rotate(Math.PI/4); g.fillStyle='#f28a1c'; g.fillRect(-26,-26,52,52); g.strokeStyle='#16181f'; g.lineWidth=3; g.strokeRect(-22,-22,44,44); g.restore();
        g.fillStyle='#16181f'; g.textAlign='center'; g.font=BUN(16); g.fillText('1.4G',W*0.24,unten+(v.quer?H*0.1:0)+1);
        g.font=BAR(20); g.textAlign='left'; g.fillText('Vorsicht,',W*0.42,unten+(v.quer?H*0.1:0)-H*0.04); g.fillText('explosiv',W*0.42,unten+(v.quer?H*0.1:0)+H*0.05);
        g.font=BAR(13); g.fillText('UN 0336',W*0.42,unten+(v.quer?H*0.1:0)+H*0.12);
      } else {
        g.fillStyle='#16181f'; g.font=BAR(22); g.textAlign='left';
        const sp=p.sparte||'zubehoer', x0=W*0.16, yy=unten+(v.quer?H*0.1:0);
        g.fillText(p.cold?'Kühl lagern':sp==='essen'?'Lebensmittel · trocken lagern':sp==='getraenke'?'Vorsicht Glas':'Bitte trocken lagern',x0,yy);
        if(p.cold){ g.fillStyle='#1f5fae'; g.fillRect(W*0.08,H*0.5,W*0.84,H*0.03); }
        if(sp==='getraenke'){ g.strokeStyle='#16181f'; g.lineWidth=2; g.beginPath(); g.moveTo(W*0.9,yy-8); g.lineTo(W*0.84,yy+8); g.lineTo(W*0.96,yy+8); g.closePath(); g.stroke(); }
      }
      /* Pfeile oben und Barcode */
      g.strokeStyle='rgba(30,24,16,.7)'; g.lineWidth=3;
      for(const x of [W*0.82,W*0.88]){ g.beginPath(); g.moveTo(x,H*0.97); g.lineTo(x,H*0.88); g.moveTo(x-5,H*0.91); g.lineTo(x,H*0.87); g.lineTo(x+5,H*0.91); g.stroke(); }
      if(v.barcode){ g.fillStyle='#f7f3ea'; g.fillRect(W*0.06,H*0.86,W*0.3,H*0.1); g.fillStyle='#16181f'; const bh=hashStr(t);
        for(let x=W*0.075,k=0;x<W*0.34;k++){ const bw=1+((bh>>(k%24))&1)*1.6; g.fillRect(x,H*0.87,bw,H*0.08); x+=bw+1.1; } }
      if(v.griff){ g.fillStyle='rgba(40,28,14,.7)'; g.beginPath(); g.ellipse(W*0.5,H*0.045,W*0.1,H*0.014,0,0,Math.PI*2); g.fill(); }
    })});
  });
}
