/* =========================================================
   Verpackungs-Grafik (Canvas)
   ========================================================= */
function burst(g,x,y,r,c,n){
  g.save(); g.strokeStyle=c; g.fillStyle=c; g.lineCap='round';
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+0.2, r0=r*0.18, r1=r*(0.75+0.25*((i*7)%3)/2);
    g.globalAlpha=0.9; g.lineWidth=Math.max(1.5,r*0.05); g.beginPath(); g.moveTo(x+Math.cos(a)*r0,y+Math.sin(a)*r0); g.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1); g.stroke();
    g.beginPath(); g.arc(x+Math.cos(a)*(r1+r*0.08),y+Math.sin(a)*(r1+r*0.08),Math.max(1.5,r*0.05),0,Math.PI*2); g.fill(); }
  g.globalAlpha=1; g.beginPath(); g.arc(x,y,r*0.1,0,Math.PI*2); g.fillStyle='#fff'; g.fill(); g.restore();
}
function drawFront(g,W,H,a,cat){
  const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H);
  const S0=Math.min(W,H);
  if(!a.light){ g.fillStyle='rgba(255,255,255,.75)'; for(let i=0;i<40;i++){ g.beginPath(); g.arc(Math.random()*W,Math.random()*H*0.7,Math.random()*S0*0.012+0.6,0,Math.PI*2); g.fill(); } }
  const tall=H>W*1.6;
  if(tall){
    if(cat){ burst(g,W*0.5,H*0.14,W*0.42,a.ac,16); burst(g,W*0.3,H*0.3,W*0.26,a.ac2,12); }
    else for(let i=0;i<30;i++){ g.save(); g.translate(Math.random()*W,Math.random()*H*0.36); g.rotate(Math.random()*3);
      g.fillStyle=pick([a.ac,a.ac2,'#ffffff']); g.fillRect(-W*0.05,-W*0.016,W*0.1,W*0.032); g.restore(); }
    g.save(); g.translate(W*0.5,H*0.66); g.rotate(-Math.PI/2);
    fitFont(g,a.title,H*0.6,Math.round(W*0.5),BUN); g.textAlign='center'; g.textBaseline='middle';
    g.lineJoin='round'; g.lineWidth=Math.max(3,W*0.05); g.strokeStyle='rgba(0,0,0,.6)'; g.strokeText(a.title,0,0); g.fillStyle=a.ac; g.fillText(a.title,0,0); g.restore();
    g.fillStyle=a.ac2; g.fillRect(0,H*0.93,W,H*0.07);
    if(cat){ g.fillStyle='#fff'; fitFont(g,'XXL',W*0.8,Math.round(W*0.3),BUN); g.textAlign='center'; g.textBaseline='middle'; g.fillText('XXL',W*0.5,H*0.89); }
    else { g.fillStyle='#fff'; fitFont(g,a.sub,W*0.85,Math.round(W*0.16),BAR); g.textAlign='center'; g.textBaseline='middle'; g.fillText(a.sub,W*0.5,H*0.89); }
  } else {
    if(a.peas){ for(let i=0;i<26;i++){ g.fillStyle=pick(['#f3e3c0','#e8d1a3','#fff2d6']); g.beginPath(); g.arc(W*0.55+Math.random()*W*0.4,H*0.12+Math.random()*H*0.3,S0*0.045,0,Math.PI*2); g.fill(); } }
    /* Zubehoer (kein Feuerwerk): Konfetti statt Feuerwerksbursts */
    else if(cat===0){ for(let i=0;i<46;i++){ g.save(); g.translate(Math.random()*W,Math.random()*H*0.46); g.rotate(Math.random()*3);
        g.fillStyle=pick([a.ac,a.ac2,'#ffffff','#ff5a8a','#5ce1ff','#ffd23f']); g.fillRect(-S0*0.025,-S0*0.008,S0*0.05,S0*0.016); g.restore(); } }
    else if(!a.light){ burst(g,W*0.25,H*0.3,S0*0.34,a.ac,18); burst(g,W*0.76,H*0.24,S0*0.26,a.ac2,14); }
    else { g.fillStyle=a.ac; for(let i=0;i<5;i++){ g.fillRect(W*(0.08+i*0.19),H*0.1,W*0.1,H*0.28); } g.fillStyle='#2e8b3a'; for(let i=0;i<5;i++) g.fillRect(W*(0.12+i*0.19),H*0.04,W*0.02,H*0.07); }
    g.textAlign='center'; g.textBaseline='middle'; g.lineJoin='round';
    fitFont(g,a.title,W*0.9,Math.round(H*0.3),BUN);
    g.lineWidth=Math.max(2,H*0.04); g.strokeStyle=a.light?'rgba(255,255,255,.9)':'rgba(0,0,0,.6)'; g.strokeText(a.title,W/2,H*0.6); g.fillStyle=a.ac; g.fillText(a.title,W/2,H*0.6);
    fitFont(g,a.sub,W*0.8,Math.round(H*0.14),BAR); g.fillStyle=a.light?'#1b1b1b':'#fff'; g.fillText(a.sub,W/2,H*0.79);
    g.fillStyle=a.ac2; g.fillRect(0,H*0.9,W,H*0.1);
  }
  /* Kategorie-Siegel nur auf Feuerwerk (F1/F2) - Zubehoer hat keins */
  if(cat){ const br=S0*0.1, bx=W-br*1.3, by=br*1.3;
    g.fillStyle='#fff'; g.beginPath(); g.arc(bx,by,br,0,Math.PI*2); g.fill();
    g.fillStyle='#0e1226'; g.font=BUN(Math.round(br*0.9)); g.textAlign='center'; g.textBaseline='middle'; g.fillText('F'+cat,bx,by+br*0.06); }
}
function drawSide(g,W,H,a){
  g.fillStyle=a.bg2; g.fillRect(0,0,W,H); g.fillStyle=a.ac2; g.fillRect(0,H*0.84,W,H*0.16);
  g.save(); g.translate(W/2,H*0.45); g.rotate(-Math.PI/2); fitFont(g,a.title,H*0.7,Math.round(W*0.55),BUN); g.textAlign='center'; g.textBaseline='middle'; g.fillStyle=a.ac; g.fillText(a.title,0,0); g.restore();
}
function drawTop(g,W,H,a){ const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H); if(!a.light) burst(g,W*0.5,H*0.5,Math.min(W,H)*0.4,a.ac,14); }
function atlas(w,h,d,a,cat,o){
  o=o||{};
  /* Aufloesung nach Groesse der Packung: eine 8-cm-Schachtel braucht
     keine 1120 Pixel. Rund 2000 Pixel je Meter, hoechstens 1120. */
  const CAP=Math.min(HIQ?1120:640,Math.max(256,Math.round(Math.max(w+d,h+d)*2000)));
  const s=Math.min(CAP/(w+d),CAP/(h+d)), Wf=Math.max(8,Math.round(w*s)), Hf=Math.max(8,Math.round(h*s)), Ds=Math.max(8,Math.round(d*s)), W=Wf+Ds, H=Hf+Ds;
  const t=tex(W,H,(g)=>{
    const reg=(x,y,w2,h2,fn)=>{ g.save(); g.beginPath(); g.rect(x,y,w2,h2); g.clip(); g.translate(x,y); fn(g,w2,h2); g.restore(); };
    reg(0,0,Wf,Hf,(g2,a1,b1)=>(o.front||drawFront)(g2,a1,b1,a,cat));
    reg(Wf,0,Ds,Hf,(g2,a1,b1)=>(o.side||drawSide)(g2,a1,b1,a));
    reg(0,Hf,Wf,Ds,(g2,a1,b1)=>(o.top||drawTop)(g2,a1,b1,a,cat));
  });
  return {mat:new THREE.MeshStandardMaterial({map:t,roughness:o.rough||0.55}),R:{front:[0,1-Hf/H,Wf/W,1],side:[Wf/W,1-Hf/H,1,1],top:[0,0,Wf/W,Ds/H]}};
}

