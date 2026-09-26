
/* =========================================================
   Preisgerät: Preise ändern und nachbestellen direkt am Regal
   ========================================================= */
let pdaOn=false, pdaG=null, pdaTex=null, pdaOpen=false, pdaItem=null, pdaLast='';
function buildPDA(){
  if(pdaG) return;
  const g=new THREE.Group();
  const body=std(0x30343d,{roughness:0.55,metalness:0.15});
  const rubber=std(0xf2c230,{roughness:0.9});
  const dark=std(0x14161c,{roughness:0.6});
  const steel=std(0x9ba2ad,{metalness:0.7,roughness:0.35});
  // Gehäuse mit Gummikanten
  rbox(0.086,0.185,0.028,0.006,body,0,0,0,g);
  rbox(0.096,0.03,0.036,0.008,rubber,0,0.082,0,g);
  rbox(0.096,0.03,0.036,0.008,rubber,0,-0.082,0,g);
  // Display
  rbox(0.074,0.082,0.004,0.003,dark,0,0.045,0.016,g);
  pdaTex=tex(256,256,()=>{});
  plane(0.068,0.076,new THREE.MeshBasicMaterial({map:pdaTex,toneMapped:false}),0,0.045,0.0185,0,g);
  // Tastenfeld
  for(let r=0;r<4;r++) for(let c=0;c<3;c++)
    rbox(0.019,0.013,0.005,0.002,std(r===0?0x3f4650:0x262a32,{roughness:0.7}),-0.023+c*0.023,-0.012-r*0.017,0.016,g);
  rbox(0.05,0.014,0.006,0.003,std(0xf2a01c,{roughness:0.6}),0,0.0,0.016,g);
  // Scanfenster oben mit rotem Strich
  rbox(0.05,0.012,0.01,0.003,dark,0,0.095,0.008,g);
  box(0.042,0.004,0.004,new THREE.MeshBasicMaterial({color:0xff3b2e,toneMapped:false}),0,0.095,0.014,g,false);
  // Pistolengriff
  const grip=rbox(0.05,0.075,0.042,0.01,body,0,-0.1,-0.03,g); grip.rotation.x=0.32;
  rbox(0.03,0.02,0.012,0.004,std(0x1c1f26),0,-0.072,-0.018,g);
  // Handschlaufe und Antenne
  const strap=new THREE.Mesh(new THREE.TorusGeometry(0.035,0.006,6,14,Math.PI),std(0x1c1f26,{roughness:0.95}));
  strap.rotation.set(Math.PI/2,0,0); strap.position.set(0,-0.03,-0.03); g.add(strap);
  rbox(0.01,0.022,0.01,0.004,steel,0.03,0.104,0,g);
  // Statuslampe
  const led=new THREE.MeshStandardMaterial({color:LIN(0x0b2a14),emissive:LIN(0x3dff7a),emissiveIntensity:1.6});
  box(0.006,0.006,0.004,led,-0.03,0.095,0.016,g,false);
  g.position.set(0.23,-0.2,-0.42); g.rotation.set(-0.42,-0.32,0.12); g.scale.setScalar(1.25);
  g.visible=false; camera.add(g); pdaG=g;
}
function togglePDA(){
  if(!S||S.level<2){ toast('Das Preisgerät gibt es ab Level 2.'); return; }
  pdaOn=!pdaOn;
  if(pdaOn&&sprayOn){ sprayOn=false; }
  if(pdaG) pdaG.visible=pdaOn;
  updateTool(); drawPDA(true);
  toast(pdaOn?'Preisgerät in der Hand. Regal anvisieren.':'Preisgerät weggesteckt.');
}
function pdaTargetType(){
  if(!target) return null;
  if(target.kind==='level'&&target.ref.type) return target.ref.type;
  if(target.kind==='rslot'&&target.ref.box) return target.ref.box.type;
  if(target.kind==='box') return target.ref.type;
  if(target.kind==='tbox') return target.ref.type;
  return null;
}
function drawPDA(force){
  if(!pdaTex||!pdaOn) return;
  const t=pdaTargetType();
  const key=t||'-';
  if(!force&&key===pdaLast) return;
  pdaLast=key;
  redraw(pdaTex,(g,W,H)=>{
    g.fillStyle='#0a1a12'; g.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=4){ g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(0,y,W,1); }
    g.fillStyle='#123a26'; g.fillRect(0,0,W,30);
    g.fillStyle='#6cf2a8'; g.font=BAR(20); g.textAlign='left'; g.textBaseline='middle';
    g.fillText('BÖLLERLADEN · PDA',8,15);
    g.textAlign='right'; g.fillText(eur(S.money),W-8,15);
    if(!t){
      g.fillStyle='#8ef0a8'; g.font=BAR(22); g.textAlign='left';
      g.fillText('Bereit.',10,60);
      g.fillStyle='#4f9c72'; g.font=BAR(19);
      g.fillText('Regal, Lagerplatz oder',10,92);
      g.fillText('Karton anvisieren.',10,114);
      g.fillStyle='#123a26'; g.fillRect(0,H-74,W,74);
      g.fillStyle='#6cf2a8'; g.font=BAR(18); g.fillText(dateShort(S.day)+' · '+seasonInfo(S.day)[1],10,H-50);
      g.fillText('Umsatz heute '+eur(DS.revenue),10,H-26);
      return;
    }
    const p=P[t], mp=marketOf(t), ek=costOf(t), price=S.prices[t], marge=price-ek, r=price/mp;
    g.fillStyle='#e8fff2'; g.font=BAR(23); g.textAlign='left';
    fitFont(g,p.name,W-20,23,BAR); g.fillText(p.name,10,52);
    g.fillStyle='#3dff7a'; g.font=BUN(44); g.fillText(price.toFixed(2).replace('.',',')+' €',10,96);
    g.fillStyle=r>1.22?'#ff8a7a':r<0.9?'#ffd23f':'#6cf2a8'; g.font=BAR(19);
    g.fillText(r>1.22?'teuer':r<0.9?'günstig':'marktüblich',10,124);
    g.fillStyle='#4f9c72'; g.fillText(`Markt ${eur(mp)} · EK ${eur(ek)}`,10,148);
    g.fillStyle=marge>0?'#8ef0a8':'#ff8a7a'; g.fillText(`Marge ${eur(r2(marge))}`,10,172);
    g.fillStyle='#123a26'; g.fillRect(0,H-70,W,70);
    g.fillStyle='#6cf2a8'; g.font=BAR(18);
    g.fillText(`Regal ${shelfStockOf(t)} · gesamt ${stockOf(t)}`,10,H-46);
    g.fillStyle='#f2c230'; g.fillText(COARSE?'Aktion: Menü öffnen':'E: Preis & Nachbestellen',10,H-20);
  });
}
/* --- Menü --- */
function openPDA(t){
  if(!t||!P[t]) return;
  pdaItem=t; pdaOpen=true; paused=true; if(locked) document.exitPointerLock();
  renderPDA(); $('pda').classList.add('show');
}
function closePDA(){ $('pda').classList.remove('show'); pdaOpen=false; pdaItem=null; paused=false; requestLock(); }
function renderPDA(){
  const t=pdaItem; if(!t) return;
  const p=P[t], mp=marketOf(t), ek=costOf(t), price=S.prices[t], marge=r2(price-ek), r=price/mp;
  /* Nachbestellen: ein Karton beim Fachhandel, wenn offen dazu die
     Grosshandels-Staffel */
  const sup=supplierFor(t), knoepfe=[SUPPLIERS[0]].concat(grossOffen()?[SUPPLIERS[1]]:[]).flatMap(s2=>(s2.tiers||[{n:1,d:0}]).map(tr=>({s2,tr}))), supZu=false;
  const tol=priceTol(), ch=Math.round(buyChance(t,price,1)*100);
  $('pdaTitle').textContent=p.name;
  $('pdaBody').innerHTML=
    `<div class="pdarow"><span>Aktueller Preis</span><b class="pdaprice">${eur(price)}</b></div>`+
    `<div class="pdasteps">`+
      [-0.5,-0.2,-0.1,-0.05].map(d=>`<button data-a="pp" data-d="${d}">${d.toFixed(2).replace('.',',')}</button>`).join('')+
      `<button data-a="pm" class="ghost">Markt</button>`+
      [0.05,0.1,0.2,0.5].map(d=>`<button data-a="pp" data-d="${d}">+${d.toFixed(2).replace('.',',')}</button>`).join('')+
    `</div>`+
    `<div class="pdarow"><span>Marktpreis</span><span>${eur(mp)} · ${Math.round(r*100)} %</span></div>`+
    `<div class="pdarow"><span>Einkauf / Marge</span><span class="${marge>0?'ok':'no'}">${eur(ek)} → ${eur(marge)}</span></div>`+
    `<div class="pdarow"><span>Kaufbereitschaft</span><span class="${ch>75?'ok':ch>35?'warn':'no'}">${ch} %</span></div>`+
    `<div class="pdarow"><span>Bestand</span><span>${shelfStockOf(t)} im Regal · ${stockOf(t)} gesamt</span></div>`+
    (canOrder(t)?
      `<div class="pdahead">Nachbestellen</div>`+
      `<div class="pdarow"><span>${grossOffen()?'Fachhandel · Großhandel':sup.name}</span><span>${supZu?`ab Level ${sup.lvl}`:`Lieferung in ${LIEFERZEIT_SEK} Sekunden`}</span></div>`+
      `<div class="pdarow"><span>Warenkorb</span><span>${cartBoxes()} Kartons · ${eur(cartTotal())}</span></div>`+
      (supZu?'':`<div class="pdasteps">${knoepfe.map(({s2,tr})=>{ const c=tierPrice(t,s2,tr);
        return `<button data-a="po" data-n="${tr.n}" data-s="${s2.id}">+ ${tr.n}× Karton · ${eur(c)}${tr.d?` −${Math.round(tr.d*100)} %`:''}</button>`; }).join('')}</div>`)+
      `<div class="pdahead">Am Laptop bestellst du den ganzen Warenkorb.</div>`
      :`<div class="pdahead">Diese Ware kann man nicht bestellen.</div>`);
}
