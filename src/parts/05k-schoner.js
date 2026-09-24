/* =========================================================
   Bildschirmschoner auf den Laptops (Tom, 24.09.: statt der Menue-
   attrappe "Bestellen, Preise, Ausbau" etwas, das besser aussieht)
   Nachthimmel mit kleinem Feuerwerk ueber einer Stadtsilhouette,
   unten der Ladenname und die Uhrzeit im Spiel.
   Gezeichnet wird nur, wenn man in der Naehe steht, und dann mit
   12 Bildern je Sekunde - der Schoner kostet sonst nichts.
   ========================================================= */
const SCHONER=[];
function neuerSchoner(w,h,titel){
  const t=tex(w,h,()=>{}), c=t.image, g=c.getContext('2d');
  const o={t,c,g,w,h,titel,funken:[],raketen:[],sterne:[],haus:[],uhr:0,naechste:0.3,mesh:null,gezeichnet:-1};
  for(let i=0;i<70;i++) o.sterne.push({x:Math.random()*w,y:Math.random()*h*0.62,r:Math.random()*1.3+0.3,ph:Math.random()*6});
  /* Stadtsilhouette mit ein paar erleuchteten Fenstern */
  let x=0; while(x<w){ const bw=18+Math.random()*44, bh=h*(0.1+Math.random()*0.22), fe=[];
    for(let fy=h-bh+8;fy<h-10;fy+=9) for(let fx=x+5;fx<x+bw-6;fx+=8) if(Math.random()<0.22) fe.push([fx,fy]);
    o.haus.push({x,bw,bh,fe}); x+=bw+2; }
  schonerMalen(o,0);
  SCHONER.push(o); return o;
}
function schonerRakete(o){
  const w=o.w,h=o.h;
  o.raketen.push({x:w*(0.15+Math.random()*0.7),y:h*0.86,vx:(Math.random()-0.5)*18,vy:-(h*0.62+Math.random()*h*0.25),
    zuend:0.75+Math.random()*0.45,f:pick(SCHEMES)});
}
function schonerBruch(o,r){
  const A=FW[r.f[0]], B=FW[r.f[1]], n=46+Math.floor(Math.random()*30), v=o.h*(0.22+Math.random()*0.12), art=Math.floor(Math.random()*3);
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+Math.random()*0.1, s=v*(art===1?(i%2?1:0.55):0.85+Math.random()*0.3), c=i%3?A:B;
    o.funken.push({x:r.x,y:r.y,px:r.x,py:r.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1.4+Math.random()*0.8,m:1.4+Math.random()*0.8,c,weide:art===2}); }
}
function schonerMalen(o,dt){
  const g=o.g,w=o.w,h=o.h;
  o.uhr+=dt; o.naechste-=dt; if(o.naechste<=0){ schonerRakete(o); o.naechste=0.5+Math.random()*1.1; }
  /* Himmel */
  const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#070b1f'); gr.addColorStop(0.6,'#1a1540'); gr.addColorStop(1,'#35204d');
  g.globalCompositeOperation='source-over'; g.fillStyle=gr; g.fillRect(0,0,w,h);
  for(const s of o.sterne){ g.globalAlpha=0.45+0.4*Math.sin(o.uhr*1.7+s.ph); g.fillStyle='#e8eeff'; g.fillRect(s.x,s.y,s.r,s.r); }
  g.globalAlpha=1;
  /* Raketen und Funken, additiv */
  g.globalCompositeOperation='lighter';
  for(let i=o.raketen.length-1;i>=0;i--){ const r=o.raketen[i];
    const px=r.x, py=r.y; r.vy+=h*0.35*dt; r.x+=r.vx*dt; r.y+=r.vy*dt; r.zuend-=dt;
    g.strokeStyle='rgba(255,210,140,.85)'; g.lineWidth=2; g.beginPath(); g.moveTo(px,py+6); g.lineTo(r.x,r.y); g.stroke();
    if(r.zuend<=0){ schonerBruch(o,r); o.raketen.splice(i,1); } }
  for(let i=o.funken.length-1;i>=0;i--){ const f=o.funken[i];
    f.px=f.x; f.py=f.y; const zieh=Math.max(0,1-1.6*dt);
    f.vx*=zieh; f.vy=f.vy*zieh+h*(f.weide?0.22:0.12)*dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.l-=dt;
    if(f.l<=0){ o.funken.splice(i,1); continue; }
    const k=f.l/f.m, c=f.c, rgb=`${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)}`;
    g.strokeStyle=`rgba(${rgb},${(k*0.9).toFixed(3)})`; g.lineWidth=f.weide?1.6:2.2;
    g.beginPath(); g.moveTo(f.px-(f.x-f.px)*(f.weide?5:2.5),f.py-(f.y-f.py)*(f.weide?5:2.5)); g.lineTo(f.x,f.y); g.stroke();
    g.fillStyle=`rgba(255,255,255,${(k*0.8).toFixed(3)})`; g.fillRect(f.x-1,f.y-1,2,2); }
  g.globalCompositeOperation='source-over';
  /* Stadt */
  for(const b of o.haus){ g.fillStyle='#0b0d1a'; g.fillRect(b.x,h-b.bh,b.bw,b.bh);
    g.fillStyle='rgba(255,214,120,.75)'; for(const [fx,fy] of b.fe) g.fillRect(fx,fy,3,4); }
  /* Leiste unten: Ladenname links, Uhrzeit rechts */
  g.fillStyle='rgba(8,10,24,.72)'; g.fillRect(0,h-30,w,30);
  g.fillStyle='#ffd23f'; g.font=BUN(15); g.textAlign='left'; g.textBaseline='middle';
  g.fillText((o.titel||shopName()).toUpperCase().slice(0,26),12,h-15);
  const min=Math.floor(typeof clock==='number'?clock:0), hh=Math.floor(min/60)%24, mm=min%60;
  g.fillStyle='#e8eeff'; g.font=BAR(20); g.textAlign='right';
  g.fillText(`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`,w-12,h-15);
  o.t.needsUpdate=true;
}
const _sp=new THREE.Vector3();
let schonerTakt=0;
function updateSchoner(dt){
  schonerTakt+=dt; if(schonerTakt<1/12) return; const d=schonerTakt; schonerTakt=0;
  for(const o of SCHONER){ if(!o.mesh) continue;
    o.mesh.getWorldPosition(_sp);
    /* nur zeichnen, wenn man nah genug ist, um es zu sehen */
    if(Math.abs(_sp.x-pl.x)>14||Math.abs(_sp.z-pl.z)>14) continue;
    schonerMalen(o,Math.min(d,0.2)); o.gezeichnet=performance.now(); }
}
