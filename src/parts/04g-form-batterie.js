/* =========================================================
   Verpackungsformen (batterie) - siehe 04-models.js VP_FORM
   03.10. (Tom: "manche Batterien sind in Kartons, aber nicht jede;
   manche nur mit einer Plastikfolie drum ... jede Verpackung soll so
   etwas Einzigartiges haben"): Batterien, Faecher, Sortimente und
   Kugelbomben bekommen je eine eigene Verkaufsverpackung nach echten
   Vorbildern - nackter Block in Klarsichtfolie, Banderole, Tragekarton,
   Displaykarton mit Fenster auf die Rohre, Holz-/Alu-/Stahlkiste,
   Kugel im Netz mit Anhaenger, Koecher, Blechdose, Hutschachtel,
   Schaumstoff-Tray unter Klarsicht, Schatulle ...
   Nur die Verkaufsverpackung: das Modell auf dem Zuendtisch
   (buildProduct(t,true)) und Rohre/Zuendung (04c) bleiben unberuehrt.
   Alles bleibt innerhalb von p.dims (Ursprung unten Mitte, vorn +z).
   Je Produkt hoechstens vier Materialien: ein Druckbogen (alle bedruckten
   Flaechen in einer Textur), Vertex-Farben, Netz, gemeinsame Folie.
   ========================================================= */
(function(){
if(typeof VP_FORM==='undefined') return;
const PI=Math.PI;
const num=c=>typeof c==='number'?c:parseInt(String(c).replace('#',''),16);
const css=c=>typeof c==='number'?'#'+c.toString(16).padStart(6,'0'):c;
const rgb3=c=>{ const n=num(c); return [(n>>16)&255,(n>>8)&255,n&255]; };
const mix=(c1,c2,f)=>{ const A=rgb3(c1), B=rgb3(c2); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*f).toString(16).padStart(2,'0')).join(''); };
const hell=(c,f)=>mix(c,'#ffffff',f), dunkel=(c,f)=>mix(c,'#000000',f);
const GOLD='#d9b45a', SILBER='#c9ced6';

/* ---------------- Werkzeug: Druckbogen ----------------
   Alle bedruckten Flaechen eines Produkts liegen in EINER Textur
   (Regionen in Metern, die Aufloesung richtet sich nach der Flaeche).
   Geometrien bekommen ihre UVs in die Region umgerechnet. */
function neu(t){ const p=P[t], a=p.art;
  return {t,p,a,cat:p.cat,w:p.dims[0],h:p.dims[1],d:p.dims[2],reg:{},druck:[],vc:[],klar:[],extra:[],extraMat:null,klarMat:null}; }
function reg(k,name,w,h,draw){ if(!k.reg[name]) k.reg[name]={w:Math.max(0.012,w),h:Math.max(0.012,h),draw}; return name; }
function farbe(k,c){ c=css(c); return reg(k,'c'+c,0.012,0.012,(g,W,H)=>{ g.fillStyle=c; g.fillRect(0,0,W,H); }); }
const leer=k=>reg(k,'leer',0.04,0.04,(g,W,H)=>g.clearRect(0,0,W,H));
function bogen(k){
  const names=Object.keys(k.reg); let A=0; for(const n of names) A+=k.reg[n].w*k.reg[n].h;
  const hiq=typeof HIQ==='undefined'||HIQ, tf=typeof TEX_FAKTOR==='undefined'?1:TEX_FAKTOR;
  const ziel=(hiq?960:640)*tf, dpm=Math.min(2600*tf,ziel/Math.sqrt(A));
  const it=names.map(n=>({n,pw:Math.max(6,Math.round(k.reg[n].w*dpm)),ph:Math.max(6,Math.round(k.reg[n].h*dpm))}));
  let fl=0; for(const i of it) fl+=(i.pw+3)*(i.ph+3);
  /* Regale packen (hoechste zuerst), die Breite mit der kleinsten Flaeche */
  it.sort((a,b)=>b.ph-a.ph||b.pw-a.pw);
  const packe=Wl=>{ let x=0,y=0,zh=0; for(const i of it){ if(x+i.pw>Wl){ x=0; y+=zh+3; zh=0; } i.x=x; i.y=y; x+=i.pw+3; zh=Math.max(zh,i.ph); } return y+zh; };
  const w0=Math.max(...it.map(i=>i.pw))+3; let best=null;
  for(let Wl=w0;Wl<=Math.max(w0,Math.sqrt(fl)*2.2);Wl+=Math.max(8,Math.round(Math.sqrt(fl)*0.04))){ const H=packe(Wl), sc=Wl*H*(Math.max(Wl/H,H/Wl)>2.5?1.3:1); if(!best||sc<best.sc) best={Wl,sc}; }
  const W=best.Wl, H=packe(W), S={};
  S.tex=tex(W,H,(g)=>{ g.fillStyle='#4a4038'; g.fillRect(0,0,W,H);
    for(const i of it){ g.save(); g.beginPath(); g.rect(i.x,i.y,i.pw,i.ph); g.clip(); g.translate(i.x,i.y); g.clearRect(0,0,i.pw,i.ph); k.reg[i.n].draw(g,i.pw,i.ph); g.restore(); } });
  for(const i of it) S[i.n]=[(i.x+0.5)/W,1-(i.y+i.ph-0.5)/H,(i.x+i.pw-0.5)/W,1-(i.y+0.5)/H];
  return S;
}
function uvRect(geo,r){ const uv=geo.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,r[0]+uv.getX(i)*(r[2]-r[0]),r[1]+uv.getY(i)*(r[3]-r[1])); }
const FACES=['px','nx','py','ny','pz','nz'];
/* Quader mit je Seite eigener Region (F: px,nx,py,ny,pz,nz, rest) */
function kasten(k,w,h,d,m,F){ const g=new THREE.BoxGeometry(w,h,d); k.druck.push({geo:g,m,faces:F}); return g; }
/* beliebige Geometrie, ganze UV-Flaeche in eine Region */
function druck(k,geo,m,name){ k.druck.push({geo,m,uv:name}); return geo; }
function fertig(k){
  const parts=[], ersatz=farbe(k,'#3a3026');
  if(k.druck.length){ const S=bogen(k);
    for(const it of k.druck){
      if(it.fn) it.fn(S);
      else if(it.faces){ const uv=it.geo.attributes.uv;
        for(let f=0;f<6;f++){ const r=S[it.faces[FACES[f]]||it.faces.rest||ersatz];
          for(let i=0;i<4;i++){ const j=f*4+i; uv.setXY(j,r[0]+uv.getX(j)*(r[2]-r[0]),r[1]+uv.getY(j)*(r[3]-r[1])); } } }
      else uvRect(it.geo,S[it.uv]); }
    const mat=new THREE.MeshStandardMaterial({map:S.tex,roughness:k.rauh||0.55,metalness:k.metall||0});
    if(k.alpha) mat.alphaTest=0.5;
    if(k.doppel) mat.side=THREE.DoubleSide;
    parts.push({geo:merge(k.druck),mat}); }
  if(k.vc.length) parts.push({geo:merge(k.vc),mat:vcMat});
  if(k.extra.length) parts.push({geo:merge(k.extra),mat:k.extraMat});
  if(k.klar.length) parts.push({geo:merge(k.klar),mat:k.klarMat||folieKlar});
  return parts;
}
/* einfarbige Teile */
const vbox=(k,w,h,d,x,y,z,c,rx,ry,rz)=>k.vc.push({geo:new THREE.BoxGeometry(w,h,d),m:tm(x,y,z,rx,ry,rz),color:num(c)});
const vzyl=(k,r1,r2,h,seg,x,y,z,c,rx,ry,rz,sx,sy,sz)=>k.vc.push({geo:new THREE.CylinderGeometry(r1,r2,h,seg),m:tm(x,y,z,rx,ry,rz,sx,sy,sz),color:num(c)});
const vkugel=(k,r,ws,hs,x,y,z,c,sx,sy,sz)=>k.vc.push({geo:new THREE.SphereGeometry(r,ws,hs),m:tm(x,y,z,0,0,0,sx,sy,sz),color:num(c)});
const vring=(k,R,r,rs,ts,arc,x,y,z,c,rx,ry,rz,sx,sy,sz)=>k.vc.push({geo:new THREE.TorusGeometry(R,r,rs,ts,arc),m:tm(x,y,z,rx,ry,rz,sx,sy,sz),color:num(c)});
const klar=(k,geo,m)=>k.klar.push({geo,m});
/* Quader mit Flaechen nach innen (dunkler Einsatz hinter Fenstern) */
function vInnen(k,w,h,d,x,y,z,c){ const g=new THREE.BoxGeometry(w,h,d).toNonIndexed(), p=g.attributes.position, n=g.attributes.normal;
  for(let i=0;i<p.count;i+=3) for(const A of [p,n,g.attributes.uv]){ const s=A.itemSize; for(let q=0;q<s;q++){ const t=A.array[(i+1)*s+q]; A.array[(i+1)*s+q]=A.array[(i+2)*s+q]; A.array[(i+2)*s+q]=t; } }
  for(let i=0;i<n.array.length;i++) n.array[i]=-n.array[i]; k.vc.push({geo:g,m:tm(x,y,z),color:num(c)}); }
/* Teile, die waehrend fn() entstehen, mit Matrix M verschieben/drehen */
function mit(k,M,fn){ const L=[k.vc,k.druck,k.klar,k.extra], n=L.map(x=>x.length); fn(); L.forEach((x,i)=>{ for(let j=n[i];j<x.length;j++) x[j].m=M.clone().multiply(x[j].m); }); }

/* ---------------- Maler ---------------- */
const pFront=k=>(g,W,H)=>drawFront(g,W,H,k.a,k.cat);
const pSeite=k=>(g,W,H)=>drawSide(g,W,H,k.a);
const pTop=k=>(g,W,H)=>drawTop(g,W,H,k.a,k.cat);
/* schlichtes Etikett fuer schmale/breite Flaechen, auf die das grosse
   Druckbild nicht passt: Farbverlauf, Name, Unterzeile */
function pEtikett(k,o){ o=o||{}; const a=k.a; return (g,W,H)=>{
  const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,o.bg1||a.bg1); gr.addColorStop(1,o.bg2||a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H);
  if(o.rand!==false){ const lw=Math.max(1.5,Math.min(W,H)*0.04); g.strokeStyle=o.rand||a.ac; g.lineWidth=lw; g.strokeRect(lw*1.5,lw*1.5,W-3*lw,H-3*lw); }
  const quer=W>=H*0.8, sub=o.sub!==undefined?o.sub:a.sub;
  if(quer){ nameText(g,a.title,W/2,H*(sub?0.42:0.52),W*0.86,Math.round(H*(sub?0.36:0.5)),o.font||FNT.bun,o.fg||a.ac,'rgba(0,0,0,.6)',Math.max(1.5,H*0.04));
    if(sub) nameText(g,sub,W/2,H*0.76,W*0.84,Math.round(H*0.17),FNT.bar,o.fg2||'#f4f4f4'); }
  else { g.save(); g.translate(W/2,H/2); g.rotate(-PI/2); nameText(g,a.title,0,0,H*0.88,Math.round(W*0.5),o.font||FNT.bun,o.fg||a.ac,'rgba(0,0,0,.6)',Math.max(1.5,W*0.04)); g.restore(); }
}; }
/* Druckbild, ausser es waere zu sehr gestaucht */
const pBild=(k,w,h)=>{ const r=w/h; return r>4.2||r<0.3?pEtikett(k):pFront(k); };
const pZweimal=m=>(g,W,H)=>{ for(let q=0;q<2;q++){ g.save(); g.translate(q*W/2,0); g.beginPath(); g.rect(0,0,W/2,H); g.clip(); m(g,W/2,H); g.restore(); } };
/* Rundum-Druck: das Druckbild vorn (und hinten) nur ueber den sichtbaren
   Bogen, dazwischen der Grund - sonst laeuft der Name um die Rundung */
const pRund=(k,m,frac)=>(g,W,H)=>{ const a=k.a, gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H);
  const bw=W*(frac||0.3); for(let q=0;q<2;q++){ const x=W*(0.25+q*0.5)-bw/2; g.save(); g.beginPath(); g.rect(x,0,bw,H); g.clip(); g.translate(x,0); m(g,bw,H); g.restore(); } };
/* Ausschnitte (Fenster, Stanzungen): q in Anteilen der Flaeche */
function pfad(g,q,W,H){ const x=q.x*W, y=q.y*H, w=q.w*W, h=q.h*H; g.beginPath();
  if(q.form==='kreis') g.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,2*PI);
  else if(q.form==='bogen'){ const r=w/2; g.moveTo(x,y+h); g.lineTo(x,y+r); g.arc(x+r,y+r,r,PI,0); g.lineTo(x+w,y+h); g.closePath(); }
  else if(q.form==='hex'){ for(let i=0;i<6;i++){ const an=i*PI/3; g.lineTo(x+w/2+Math.cos(an)*w/2,y+h/2+Math.sin(an)*h/2); } g.closePath(); }
  else if(q.form==='auge'){ g.moveTo(x,y+h/2); g.quadraticCurveTo(x+w/2,y-h*0.5,x+w,y+h/2); g.quadraticCurveTo(x+w/2,y+h*1.5,x,y+h/2); g.closePath(); }
  else if(q.form==='welle'){ g.moveTo(x,y+h); for(let i=0;i<=40;i++){ const u=i/40; g.lineTo(x+u*w,y+h*(0.5+0.5*Math.sin(u*PI*(q.n||3)*2+0.6))*0.7); } g.lineTo(x+w,y+h); g.closePath(); }
  else if(q.form==='zacken'){ g.moveTo(x,y+h); const n=q.n||14; for(let i=0;i<=n;i++){ g.lineTo(x+w*i/n,y+(i%2?h*0.55:0)+h*0.1*Math.sin(i*2.3)); } g.lineTo(x+w,y+h); g.closePath(); }
  else if(q.form==='rund'){ const r=Math.min(w,h)*(q.r||0.18); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
  else g.rect(x,y,w,h); }
function pLoch(base,L,rahmen,lw){ return (g,W,H)=>{ base(g,W,H); g.save(); g.globalCompositeOperation='destination-out'; for(const q of L){ pfad(g,q,W,H); g.fill(); } g.restore();
  if(rahmen){ g.save(); g.strokeStyle=rahmen; g.lineWidth=Math.max(2,Math.min(W,H)*(lw||0.014)); g.lineJoin='round'; for(const q of L){ pfad(g,q,W,H); g.stroke(); } g.restore(); } }; }
/* Rohre von der Seite: stehende Pappzylinder nebeneinander */
function pRohrSeite(o){ return (g,W,H)=>{ const n=Math.max(1,Math.round(o.n||6)), tw=W/n;
  g.fillStyle='#140d08'; g.fillRect(0,0,W,H);
  for(let i=0;i<n;i++){ const c=o.bunt?o.bunt[i%o.bunt.length]:(o.farbe||'#b8925f'), x=i*tw;
    g.save(); if(o.faecher){ const f=(i+0.5)/n-0.5; g.translate(x+tw/2,H); g.rotate(f*o.faecher); g.translate(-x-tw/2,-H); }
    const gr=g.createLinearGradient(x,0,x+tw,0); gr.addColorStop(0,dunkel(c,0.55)); gr.addColorStop(0.32,hell(c,0.2)); gr.addColorStop(0.55,c); gr.addColorStop(1,dunkel(c,0.6));
    g.fillStyle=gr; g.fillRect(x+tw*0.04,o.faecher?-H*0.3:0,tw*0.92,o.faecher?H*1.3:H);
    if(o.spirale!==false){ g.strokeStyle='rgba(0,0,0,.14)'; g.lineWidth=Math.max(1,tw*0.035); for(let y=-tw-H*0.3;y<H+tw;y+=tw*1.7){ g.beginPath(); g.moveTo(x+tw*0.04,y+tw*0.55); g.lineTo(x+tw*0.96,y); g.stroke(); } }
    if(o.kopf){ g.fillStyle=Array.isArray(o.kopf)?o.kopf[i%o.kopf.length]:o.kopf; g.fillRect(x+tw*0.04,o.faecher?-H*0.3:0,tw*0.92,H*(o.faecher?0.38:0.06)); }
    g.restore(); }
  if(o.ringe){ g.fillStyle='rgba(0,0,0,.4)'; for(const f of o.ringe) g.fillRect(0,H*f,W,Math.max(1,H*0.012)); }
}; }
/* Rohre von oben: Muendungen mit Seidenpapier-Kappen, Zuendschnur */
function pRohrDeckel(o){ return (g,W,H)=>{
  g.fillStyle=o.grund||'#2c2118'; g.fillRect(0,0,W,H);
  const c=o.cols||5, r=o.rows||5, cw=W/c, ch=H/r, rr=Math.min(cw,ch)*0.47, Rn=zufallAus(o.saat||11);
  for(let j=0;j<r;j++) for(let i=0;i<c;i++){ const x=cw*(i+0.5), y=ch*(j+0.5);
    g.fillStyle=o.wand||'#c9a46a'; g.beginPath(); g.arc(x,y,rr,0,2*PI); g.fill();
    const kc=typeof o.kappe==='function'?o.kappe(i,j,Rn):Array.isArray(o.kappe)?o.kappe[j%o.kappe.length]:(o.kappe||'#d8352a');
    const gr=g.createRadialGradient(x-rr*0.3,y-rr*0.3,rr*0.05,x,y,rr*0.8); gr.addColorStop(0,hell(kc,0.45)); gr.addColorStop(0.6,kc); gr.addColorStop(1,dunkel(kc,0.25));
    g.fillStyle=gr; g.beginPath(); g.arc(x,y,rr*0.78,0,2*PI); g.fill();
    if(o.loch){ g.fillStyle='rgba(15,10,6,.85)'; g.beginPath(); g.arc(x,y,rr*0.3,0,2*PI); g.fill(); }
    else { g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=Math.max(1,rr*0.06); for(let s=0;s<4;s++){ const an=s*PI/4+Rn(); g.beginPath(); g.moveTo(x-Math.cos(an)*rr*0.6,y-Math.sin(an)*rr*0.6); g.lineTo(x+Math.cos(an)*rr*0.6,y+Math.sin(an)*rr*0.6); g.stroke(); } } }
  if(o.schnur!==false){ g.strokeStyle=o.schnur||'#2e8b3a'; g.lineWidth=Math.max(1.2,rr*0.12); g.lineJoin='round'; g.beginPath();
    for(let j=0;j<r-1;j++){ const y=ch*(j+1), xa=j%2?W-cw*0.5:cw*0.5, xb=j%2?cw*0.5:W-cw*0.5; if(!j) g.moveTo(xa,y); else g.lineTo(xa,y); g.lineTo(xb,y); }
    g.stroke(); }
}; }
/* Holz: Bretter mit Maserung und Aesten */
function pHolz(o){ return (g,W,H)=>{ const Rn=zufallAus(o.saat||3), c=o.farbe||'#c8a46e'; g.fillStyle=c; g.fillRect(0,0,W,H);
  const n=Math.max(40,Math.round(W*H/30));
  for(let i=0;i<n;i++){ const y=Rn()*H; g.fillStyle=Rn()<0.55?`rgba(90,58,26,${0.05+Rn()*0.1})`:`rgba(255,236,200,${0.05+Rn()*0.08})`; g.fillRect(Rn()*W-W*0.1,y,W*(0.15+Rn()*0.5),Math.max(1,H*0.01*(1+Rn()*2))); }
  for(let i=0;i<(o.aeste===0?0:2);i++){ const x=Rn()*W, y=Rn()*H, r=Math.min(W,H)*(0.05+Rn()*0.06); g.fillStyle='rgba(80,48,20,.45)'; g.beginPath(); g.ellipse(x,y,r*1.8,r,0,0,2*PI); g.fill(); g.fillStyle='rgba(50,30,12,.5)'; g.beginPath(); g.ellipse(x,y,r*0.7,r*0.4,0,0,2*PI); g.fill(); }
  if(o.lack){ g.fillStyle=o.lack; g.globalAlpha=o.deck||0.82; g.fillRect(0,0,W,H); g.globalAlpha=1; }
  if(o.fn) o.fn(g,W,H);
}; }
/* Schablonenschrift */
function schablone(g,txt,x,y,maxW,size,farbe){ g.save(); g.fillStyle=farbe||'rgba(20,16,12,.85)'; g.textAlign='center'; g.textBaseline='middle'; let s=Math.round(size);
  const f=s=>`700 ${s}px "Barlow Condensed", Impact, sans-serif`; g.font=f(s); while(g.measureText(txt).width>maxW&&s>6){ s--; g.font=f(s); } g.fillText(txt,x,y); g.restore(); }
/* Wellpappe (braun, Riffel), Kraftpapier */
function pWell(o){ o=o||{}; return (g,W,H)=>{ const Rn=zufallAus(5); g.fillStyle=o.farbe||'#b48a58'; g.fillRect(0,0,W,H);
  for(let x=0;x<W;x+=3){ g.fillStyle=`rgba(80,52,24,${0.04+0.035*Math.sin(x*0.9)})`; g.fillRect(x,0,1.5,H); }
  for(let i=0;i<W*H/200;i++){ g.fillStyle=`rgba(60,40,20,${Rn()*0.07})`; g.fillRect(Rn()*W,Rn()*H,2,1); }
  if(o.fn) o.fn(g,W,H); }; }
function pKraft(o){ o=o||{}; return (g,W,H)=>{ const Rn=zufallAus(9); g.fillStyle=o.farbe||'#b8925f'; g.fillRect(0,0,W,H);
  for(let i=0;i<W*H/60;i++){ g.fillStyle=`rgba(${Rn()<0.5?'90,60,30':'235,205,160'},${0.04+Rn()*0.07})`; g.fillRect(Rn()*W,Rn()*H,1+Rn()*3,1); }
  if(o.fn) o.fn(g,W,H); }; }
function pSchaum(c){ return (g,W,H)=>{ const Rn=zufallAus(13); g.fillStyle=c; g.fillRect(0,0,W,H);
  for(let i=0;i<W*H/14;i++){ g.fillStyle=Rn()<0.5?'rgba(0,0,0,.14)':'rgba(255,255,255,.08)'; g.fillRect(Rn()*W,Rn()*H,1.5,1.5); } }; }
function pSamt(c){ return (g,W,H)=>{ const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.7); gr.addColorStop(0,hell(c,0.12)); gr.addColorStop(1,dunkel(c,0.35)); g.fillStyle=gr; g.fillRect(0,0,W,H);
  const Rn=zufallAus(17); for(let i=0;i<W*H/10;i++){ g.fillStyle=Rn()<0.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.04)'; g.fillRect(Rn()*W,Rn()*H,1,1); } }; }
/* Metall: gebuerstet (Alu), Riffelblech, Hammerschlaglack */
function pMetall(o){ return (g,W,H)=>{ const Rn=zufallAus(o.saat||21), c=o.farbe||'#b8bec6'; g.fillStyle=c; g.fillRect(0,0,W,H);
  if(o.art==='hammer'){ for(let i=0;i<W*H/9;i++){ const x=Rn()*W, y=Rn()*H, r=1+Rn()*2.2; const gr=g.createRadialGradient(x-r*0.3,y-r*0.3,0,x,y,r); gr.addColorStop(0,'rgba(255,255,255,.07)'); gr.addColorStop(1,'rgba(0,0,0,.1)'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,2*PI); g.fill(); } }
  else { for(let y=0;y<H;y++){ g.fillStyle=`rgba(${Rn()<0.5?'255,255,255':'0,0,0'},${Rn()*0.07})`; g.fillRect(0,y,W,1); }
    if(o.riffel){ const s=Math.max(8,H/o.riffel); for(let y=s/2;y<H;y+=s){ g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(0,y,W,Math.max(1,s*0.12)); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(0,y-Math.max(1,s*0.12),W,Math.max(1,s*0.1)); } } }
  if(o.fn) o.fn(g,W,H); }; }
/* Weidengeflecht */
function pGeflecht(c){ return (g,W,H)=>{ g.fillStyle=dunkel(c,0.45); g.fillRect(0,0,W,H); const s=Math.max(6,H/9), sp=Math.max(6,W/26);
  for(let y=0,r=0;y<H;y+=s,r++) for(let x=-(r%2)*sp,i=0;x<W;x+=sp,i++){ const gr=g.createLinearGradient(0,y,0,y+s); gr.addColorStop(0,dunkel(c,0.2)); gr.addColorStop(0.45,hell(c,0.25)); gr.addColorStop(1,dunkel(c,0.3)); g.fillStyle=gr;
    g.beginPath(); g.ellipse(x+sp/2,y+s/2,sp*0.58,s*0.46,0,0,2*PI); g.fill(); }
  g.fillStyle=dunkel(c,0.5); for(let x=0;x<W;x+=sp) g.fillRect(x-1,0,2,H); }; }
/* Kugelbombe: Papierkugel mit Klebeband, Name zweimal (vorn/hinten) */
function pKugel(k){ const a=k.a; return (g,W,H)=>{
  const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,hell(a.bg1,0.12)); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H);
  for(let i=0;i<10;i++){ g.fillStyle='rgba(255,255,255,.05)'; g.fillRect(i*W/10,0,W/20,H); }
  g.fillStyle='rgba(226,214,186,.92)'; g.fillRect(0,H*0.47,W,H*0.07);
  for(let q=0;q<2;q++){ const cx=W*(0.25+q*0.5);
    nameText(g,a.title,cx,H*0.36,W*0.36,Math.round(H*0.12),FNT.bun,a.ac,'rgba(0,0,0,.6)',Math.max(2,H*0.02));
    nameText(g,(a.sub||'').split('·')[0].trim()||a.sub||'',cx,H*0.63,W*0.3,Math.round(H*0.065),FNT.bar,'#f2f5ff'); }
}; }

/* ---------------- Bauteile ---------------- */
function lay(k){ const L=typeof istBatterie==='function'&&istBatterie(k.t)?rohrLayout(k.t):null; return L||{cols:5,rows:5,B:1}; }
/* Zuendschnur-Lasche: Papierlasche auf der Flaeche, Schnur mit roter Kappe */
function lasche(k,x,y,z,c){ c=c||'#d8352a';
  vbox(k,0.03,0.024,0.0016,x,y,z+0.0008,'#f2efe6');
  vbox(k,0.03,0.006,0.0019,x,y+0.009,z+0.001,c);
  vzyl(k,0.002,0.002,0.04,5,x-0.006,y-0.017,z+0.0026,'#2e8b3a',0,0,0.55);
  vzyl(k,0.0042,0.0042,0.012,8,x-0.016,y-0.033,z+0.0042,c,0,0,0.55); }
/* Lasche auf der rechten Seite (Druck vorn bleibt frei) */
function lascheSeite(k,B,y,c){ mit(k,tm((B.x||0)+B.w/2,0,B.z||0,0,PI/2,0),()=>lasche(k,-(B.d/2-0.035),y,0,c)); }
/* Kantenschutz-Winkel an den vier senkrechten Kanten */
function ecken(k,w,h,d,c,b,y0){ b=b||0.016; y0=y0||0; for(const sx of [-1,1]) for(const sz of [-1,1]){
  vbox(k,b,h,0.0022,sx*(w/2-b/2),y0+h/2,sz*(d/2+0.0011),c); vbox(k,0.0022,h,b,sx*(w/2+0.0011),y0+h/2,sz*(d/2-b/2),c); } }
/* Umreifungsband/Spanngurt um den Block: laeuft vorn, oben, hinten */
function gurtZ(k,x,h,d,c,b,schnalle,y0){ b=b||0.016; y0=y0||0; const t=0.0018;
  vbox(k,b,h,t,x,y0+h/2,d/2+t/2,c); vbox(k,b,h,t,x,y0+h/2,-d/2-t/2,c); vbox(k,b,t,d+2*t,x,y0+h+t/2,0,c);
  if(schnalle){ vbox(k,b*1.4,b*1.1,0.004,x,y0+h*0.62,d/2+0.002,schnalle); vbox(k,b*0.8,b*0.45,0.0044,x,y0+h*0.62,d/2+0.0022,dunkel(css(schnalle),0.45)); } }
/* laeuft links, oben, rechts */
function gurtX(k,z,w,h,c,b,y0){ b=b||0.016; y0=y0||0; const t=0.0018;
  vbox(k,t,h,b,w/2+t/2,y0+h/2,z,c); vbox(k,t,h,b,-w/2-t/2,y0+h/2,z,c); vbox(k,w+2*t,t,b,0,y0+h+t/2,z,c); }
/* Kunststoff-Tragegriff oben (Steg, zwei Beine, Fussplatten) */
function griff(k,x,y0,y1,gw,c,z,quer){ z=z||0; const hh=y1-y0, M=tm(x,0,z,0,quer?PI/2:0,0);
  mit(k,M,()=>{ vbox(k,gw,0.014,0.024,0,y1-0.007,0,c); vbox(k,gw*0.8,0.005,0.02,0,y1-0.0165,0,dunkel(css(c),0.3));
    for(const s of [-1,1]){ vbox(k,0.014,hh,0.02,s*(gw/2-0.007),y0+hh/2,0,c); vbox(k,0.04,0.004,0.05,s*(gw/2-0.007),y0+0.002,0,c); } }); }
/* Kordel/Bindfaden als Polylinie */
function kordel(k,pts,c,r){ r=r||0.0016; for(let i=0;i<pts.length-1;i++){ const A=pts[i], B=pts[i+1], dx=B[0]-A[0], dy=B[1]-A[1], dz=B[2]-A[2], L=Math.hypot(dx,dy,dz); if(L<1e-5) continue;
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(dx/L,dy/L,dz/L)), m=new THREE.Matrix4().compose(new THREE.Vector3((A[0]+B[0])/2,(A[1]+B[1])/2,(A[2]+B[2])/2),q,new THREE.Vector3(1,1,1));
  k.vc.push({geo:new THREE.CylinderGeometry(r,r,L+r,5,1,true),m,color:num(c)}); } }
/* Schleife aus zwei Schlaufen, Knoten und zwei Enden (s = Breite) */
function schleife(k,x,y,z,s,c,ry){ const M=tm(x,y,z,0,ry||0,0);
  mit(k,M,()=>{ for(const sx of [-1,1]) vring(k,s*0.24,s*0.07,5,14,2*PI,sx*s*0.24,s*0.2,0,c,0,0,0,1,0.75,0.5);
    vkugel(k,s*0.1,8,6,0,s*0.12,0,dunkel(css(c),0.12),1,0.9,0.8);
    for(const sx of [-1,1]) vbox(k,s*0.1,s*0.3,s*0.025,sx*s*0.1,s*0.02,0,c,0,0,sx*0.5); }); }

/* Kugelbombe (Verkaufsstueck): Papierkugel, Zeitzuender, Anzuendlitze,
   Klebebandkreuz */
function kugel(k,R,x,y,z,o){ o=o||{};
  druck(k,new THREE.SphereGeometry(R,o.seg||16,o.seg?Math.round(o.seg*0.7):11),tm(x,y,z,0,o.ry||0,0),reg(k,'kugel',2*PI*R,PI*R,pKugel(k)));
  vring(k,R*1.004,R*0.035,4,18,2*PI,x,y,z,'#e2d6ba',PI/2,0,0);
  vring(k,R*1.004,R*0.035,4,18,2*PI,x,y,z,'#e2d6ba',0,(o.ry||0)+PI/2,0);
  if(o.zuender!==false){ vzyl(k,R*0.15,R*0.19,R*0.22,8,x,y+R*1.02,z,'#d9cbb0'); vzyl(k,0.0022,0.0022,R*0.36,5,x+R*0.07,y+R*1.18,z,'#2e8b3a',0,0,0.4); }
}
/* Netz (gemeinsames Material je Farbe, Ausschnitt per alphaTest) */
const _netz={};
function netzMat(c,lw){ if(typeof WARE_PROBE!=='undefined'&&WARE_PROBE) return vcMat; /* Probeaufbau am Handy: nichts zwischenspeichern */
  c=css(c); lw=lw||2.4; const key=c+lw; if(_netz[key]) return _netz[key];
  const t=tex(256,128,(g,W,H)=>{ g.clearRect(0,0,W,H); g.strokeStyle=c; g.lineWidth=lw; g.lineCap='round'; const s=W/16;
    for(let x=-H;x<=W+H;x+=s){ g.beginPath(); g.moveTo(x,0); g.lineTo(x+H,H); g.stroke(); g.beginPath(); g.moveTo(x+H,0); g.lineTo(x,H); g.stroke(); }
    g.fillStyle=c; for(let x=0;x<=W;x+=s) for(let y=0;y<=H;y+=s){ g.beginPath(); g.arc(x+((y/s)%2?s/2:0),y,lw*0.9,0,2*PI); g.fill(); } });
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  return (_netz[key]=new THREE.MeshStandardMaterial({map:t,alphaTest:0.45,side:THREE.DoubleSide,roughness:0.85}));
}
/* Zylindermantel mit Druck: u=0 links, vorn in der Mitte der ersten Haelfte */
function mantel(k,R,H,y0,name,maler,o){ o=o||{}; const g=new THREE.CylinderGeometry(o.r2||R,R,H,o.seg||24,1,true,-PI/2);
  druck(k,g,tm(o.x||0,y0+H/2,o.z||0),reg(k,name,2*PI*R,H,maler)); }

/* ---------------- Grundformen ---------------- */
/* Batterieblock: bedruckt (Druckbild vorn) oder nackte Rohre mit
   Etikett; Deckel mit Rohrkappen */
function block(k,o){ o=o||{};
  const L=lay(k), e=o.e!==undefined?o.e:(o.folie?0.004:0.002), w=o.bw||k.w-2*e, d=o.bd||k.d-2*e, h=o.hb||(k.h-(o.folie?0.003:0)-(o.oben||0)), y0=o.y0||0, x0=o.x||0, z0=o.z||0, id=o.id||'';
  const deck=reg(k,'deckel'+id,w,d,pRohrDeckel(Object.assign({cols:L.cols,rows:L.rows,saat:hashStr(k.t)},o.deckel||{})));
  let vorn, seite;
  if(o.huelle==='roh'){
    const rs=Object.assign({n:L.cols,farbe:o.rohr||'#b8925f',bunt:o.bunt||null,ringe:[0.035]},o.rohrO||{});
    vorn=reg(k,'rohrV'+id,w,h,(g,W,H)=>{ pRohrSeite(rs)(g,W,H);
      if(o.etikett){ const E=o.etikett, ex=W*E[0], ey=H*E[1], ew=W*E[2], eh=H*E[3]; g.save(); g.beginPath(); g.rect(ex,ey,ew,eh); g.clip(); g.translate(ex,ey); pBild(k,ew,eh)(g,ew,eh); g.restore();
        g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=Math.max(1.5,W*0.004); g.strokeRect(ex,ey,ew,eh); } });
    seite=reg(k,'rohrS'+id,d,h,(g,W,H)=>{ pRohrSeite(Object.assign({},rs,{n:L.rows}))(g,W,H);
      if(o.warnSeite){ g.fillStyle='rgba(250,248,240,.95)'; g.fillRect(W*0.14,H*0.22,W*0.72,H*0.46); g.fillStyle='#1b1b1b'; g.textAlign='center'; g.textBaseline='middle'; g.font=`700 ${Math.max(6,Math.round(W*0.09))}px Arial`; g.fillText('F'+(k.cat||2)+' · CE',W/2,H*0.3);
        for(let i=0;i<5;i++){ g.fillStyle='rgba(30,30,30,.5)'; g.fillRect(W*0.2,H*(0.38+i*0.05),W*0.6,Math.max(1,H*0.012)); } } });
  } else { vorn=reg(k,'front'+id,w,h,o.vornMaler||pBild(k,w,h)); seite=reg(k,'seite'+id,d,h,o.seitenMaler||pSeite(k)); }
  kasten(k,w,h,d,tm(x0,y0+h/2,z0),{pz:vorn,nz:o.hinten||vorn,px:seite,nx:seite,py:deck,ny:farbe(k,'#2a2018')});
  return {w,h,d,e,y0,x:x0,z:z0};
}
/* Banderole um einen Block (bedruckt), Hoehe y0..y1 */
function banderole(k,B,y0,y1,o){ o=o||{}; const t=0.0015, w=B.w+2*t, d=B.d+2*t, h=y1-y0, id=o.id||'';
  const vorn=reg(k,'band'+id,w,h,o.maler||pBild(k,w,h));
  const seite=reg(k,'bandS'+id,d,h,o.seite||((g,W,H)=>{ const c=o.farbe||k.a.bg2; g.fillStyle=c; g.fillRect(0,0,W,H); g.fillStyle=o.akzent||k.a.ac; g.fillRect(0,0,W,H*0.07); g.fillRect(0,H*0.93,W,H*0.07);
    if(H>W*0.6){ g.save(); g.translate(W/2,H/2); g.rotate(-PI/2); nameText(g,k.a.title,0,0,H*0.84,Math.round(W*0.4),FNT.bun,o.akzent||k.a.ac); g.restore(); } else nameText(g,k.a.title,W/2,H/2,W*0.86,Math.round(H*0.5),FNT.bun,o.akzent||k.a.ac); }));
  kasten(k,w,h,d,tm(B.x||0,y0+h/2,B.z||0),{pz:vorn,nz:o.hinten||vorn,px:seite,nx:seite,py:farbe(k,o.farbe||k.a.bg2),ny:farbe(k,o.farbe||k.a.bg2)}); }
/* Folienhuelle ueber alles */
const folie=(k,w,h,d,y0)=>klar(k,new THREE.BoxGeometry(w||k.w,h||k.h,d||k.d),tm(0,(y0||0)+(h||k.h)/2,0));

/* Displaykarton mit Fenster(n): o.vornL / o.topL Ausschnitte, darin der
   Rohrblock (Seiten mit stehenden Rohren, Deckel mit Kappen) */
function fensterKarton(k,o){ o=o||{}; k.alpha=true; const w=k.w, d=k.d, hb=o.hb||k.h, rahmen=o.rahmen===undefined?'rgba(255,255,255,.92)':o.rahmen;
  const vorn=reg(k,'fvorn',w,hb,o.vornL?pLoch(o.vorn||pFront(k),o.vornL,rahmen):(o.vorn||pFront(k)));
  const deck=reg(k,'fdeck',w,d,o.topL?pLoch(o.top||pTop(k),o.topL,rahmen):(o.top||pTop(k)));
  const seite=reg(k,'fseite',d,hb,o.seite||pSeite(k));
  const hinten=reg(k,'fhinten',w,hb,o.hinten||pEtikett(k,{sub:''}));
  kasten(k,w,hb,d,tm(0,hb/2,0),{pz:vorn,nz:hinten,px:seite,nx:seite,py:deck,ny:farbe(k,'#2a2018')});
  if(o.innen!==false){ const L=lay(k), iw=w-0.008, id=d-0.008, ih=o.innenH||hb-0.01;
    const rv=reg(k,'innenV',iw,ih,pRohrSeite(Object.assign({n:L.cols,farbe:o.rohr||'#b8925f',ringe:[0.03]},o.rohrO||{})));
    const rs=reg(k,'innenS',id,ih,pRohrSeite(Object.assign({n:L.rows,farbe:o.rohr||'#b8925f'},o.rohrO||{})));
    const dk=reg(k,'innenD',iw,id,pRohrDeckel(Object.assign({cols:L.cols,rows:L.rows,saat:hashStr(k.t)},o.deckel||{})));
    kasten(k,iw,ih,id,tm(0,ih/2+0.001,0),{pz:rv,nz:rv,px:rs,nx:rs,py:dk,ny:farbe(k,'#2a2018')}); }
  if(o.folie!==false){
    for(const q of (o.vornL||[])) klar(k,new THREE.PlaneGeometry(q.w*w,q.h*hb),tm(-w/2+(q.x+q.w/2)*w,hb-(q.y+q.h/2)*hb,d/2-0.0015));
    for(const q of (o.topL||[])) klar(k,new THREE.PlaneGeometry(q.w*w,q.h*d),tm(-w/2+(q.x+q.w/2)*w,hb-0.0015,-d/2+(q.y+q.h/2)*d,-PI/2,0,0)); }
  return {hb};
}
/* Kiste aus Brettern: o.latten (offen, mit Luecken), o.lack, o.holz,
   o.kern (Region des Inhalts), o.ex/ez Rand fuer Griffe/Gurte */
function kiste(k,o){ o=o||{}; const ex=o.ex||0.004, ez=o.ez||0.004, W=k.w-2*ex, D=k.d-2*ez, H=o.H||(k.h-0.003), bt=o.bt||Math.min(0.014,W*0.05), y0=o.y0||0;
  const tone=o.holz||'#c8a46e', saat=hashStr(k.t);
  const HZ=[0,1,2].map(i=>reg(k,'holz'+i,0.6,0.1,pHolz({farbe:i===0?tone:i===1?dunkel(tone,0.12):hell(tone,0.1),saat:saat+i*7,lack:o.lack,deck:o.deck,aeste:o.aeste})));
  const kern=o.kern||farbe(k,'#22190f');
  kasten(k,W-2*bt+0.001,H-0.002,D-2*bt+0.001,tm(0,y0+H/2,0),{rest:kern,pz:o.kernVorn||kern,py:o.kernTop||kern});
  const nb=o.bretter||Math.max(2,Math.round(H/0.095)), gap=o.latten?(o.gap||H*0.07):0.0018, bh=(H-gap*(nb-1))/nb;
  for(let i=0;i<nb;i++){ const y=y0+bh/2+i*(bh+gap), hz=HZ[i%3];
    kasten(k,W,bh,bt,tm(0,y,D/2-bt/2),{rest:hz}); kasten(k,W,bh,bt,tm(0,y,-D/2+bt/2),{rest:HZ[(i+1)%3]});
    for(const s of [-1,1]) kasten(k,bt,bh,D-2*bt,tm(s*(W/2-bt/2),y,0),{rest:HZ[(i+2)%3]}); }
  if(o.deckel!==false){ const nt=o.deckBretter||Math.max(2,Math.round(D/0.1)), tg=o.latten?(o.gapTop||0.02):0.0018, tw=(D-2*bt-tg*(nt-1))/nt;
    for(let i=0;i<nt;i++) kasten(k,W-2*bt,bt*0.9,tw,tm(0,y0+H-bt*0.45,-D/2+bt+tw/2+i*(tw+tg)),{rest:HZ[i%3]}); }
  if(o.leisten){ for(const s of [-1,1]) for(const sz of [-1,1]) kasten(k,bt*1.6,H,bt*0.7,tm(s*(W/2-bt*0.8),y0+H/2,sz*(D/2+bt*0.35)),{rest:HZ[1]}); }
  return {W,D,H,bt,ex,ez,y0};
}
/* Seilgriff an der Seite (s = +1 rechts, -1 links) */
function seilgriff(k,s,x,y,c,r){ r=r||0.032; vbox(k,0.012,0.028,0.03,x+s*0.006,y,-r*0.9,'#6a5030'); vbox(k,0.012,0.028,0.03,x+s*0.006,y,r*0.9,'#6a5030');
  vring(k,r*0.9,0.005,5,10,PI,x+s*0.012,y,0,c||'#c8b48a',0,PI/2,PI,1,1.1,1); }
/* bedrucktes Schild (Etikett) auf einer Front */
function schild(k,name,w,h,x,y,z,maler,t){ t=t||0.003; kasten(k,w,h,t,tm(x,y,z+t/2),{pz:reg(k,name,w,h,maler||pBild(k,w,h)),rest:farbe(k,'#e8e2d0')}); }

/* ---------------- Batterien ---------------- */
const V=VP_FORM;
/* Nachthimmel 16: nackter bedruckter Block in Klarsichtfolie, blaue
   Seidenpapier-Kappen, weisser Kantenschutz, Zuendschnur-Lasche */
V.batterie16=t=>{ const k=neu(t), B=block(k,{folie:true,deckel:{kappe:'#5ce1ff',wand:'#e8e0cc'}});
  ecken(k,B.w,B.h,B.d,'#ece8dc',0.008); lascheSeite(k,B,0.05); folie(k); return fertig(k); };
/* Feuersturm 49: bedruckter Tragekarton mit schwarzem Kunststoffgriff */
V.batterie49=t=>{ const k=neu(t), gh=0.046, hb=k.h-gh;
  kasten(k,k.w,hb,k.d,tm(0,hb/2,0),{pz:reg(k,'front',k.w,hb,pFront(k)),nz:'front',px:reg(k,'seite',k.d,hb,pSeite(k)),nx:'seite',py:reg(k,'top',k.w,k.d,pTop(k)),ny:farbe(k,'#2a2018')});
  griff(k,0,hb,k.h,0.19,'#1d1f24'); return fertig(k); };
/* Achterbahn 100: Karton mit hochstehender Tragelasche (Griffloch) */
V.batterie100=t=>{ const k=neu(t), lh=0.075, hb=k.h-lh, a=k.a; k.alpha=true;
  kasten(k,k.w,hb,k.d,tm(0,hb/2,0),{pz:reg(k,'front',k.w,hb,pFront(k)),nz:'front',px:reg(k,'seite',k.d,hb,pSeite(k)),nx:'seite',py:reg(k,'top',k.w,k.d,pTop(k)),ny:farbe(k,'#2a2018')});
  const lw=k.w*0.62;
  const lasch=reg(k,'lasche',lw,lh,pLoch((g,W,H)=>{ const gr=g.createLinearGradient(0,0,W,0); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.ac); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle=a.ac2; g.fillRect(0,H*0.86,W,H*0.14); for(let i=0;i<14;i++){ g.fillStyle='rgba(255,255,255,.18)'; g.beginPath(); g.arc(W*(i/13),H*0.45+Math.sin(i*1.3)*H*0.25,H*0.05,0,2*PI); g.fill(); }
    nameText(g,'3 HÖHEN',W*0.15,H*0.45,W*0.2,Math.round(H*0.2),FNT.bun,'#fff'); nameText(g,'100',W*0.85,H*0.45,W*0.2,Math.round(H*0.3),FNT.bun,a.ac2); },[{form:'rund',x:0.33,y:0.2,w:0.34,h:0.42,r:0.5}],null));
  kasten(k,lw,lh,0.007,tm(0,hb+lh/2,0),{pz:lasch,nz:lasch,rest:farbe(k,a.ac)});
  for(const s of [-1,1]) vbox(k,lw,0.003,0.03,0,hb+0.0015,s*0.018,dunkel(a.ac,0.2));
  return fertig(k); };
/* Knattersturm: nackte Rohre, Doppel-Banderole (Doppeldeck) */
V.knatter=t=>{ const k=neu(t), B=block(k,{huelle:'roh',rohr:'#c9a46a',deckel:{kappe:'#ffd23f'}});
  banderole(k,B,0.024,0.168); banderole(k,B,0.19,0.232,{id:'2',maler:(g,W,H)=>{ g.fillStyle=k.a.ac; g.fillRect(0,0,W,H); g.fillStyle='#04121f'; g.fillRect(0,0,W,H*0.12); g.fillRect(0,H*0.88,W,H*0.12);
    nameText(g,'DOPPELDECK',W/2,H/2,W*0.9,Math.round(H*0.62),FNT.bun,'#04121f'); },farbe:k.a.ac,akzent:'#04121f'});
  lascheSeite(k,B,0.06,'#ffd23f'); return fertig(k); };
/* Glitzerregen 12 (Nordlicht, ohne Plastik): Kraftrohre, Papierbanderole,
   Jutekordel ueber Kreuz mit Schleife */
V.glitzerregen12=t=>{ const k=neu(t), hb=k.h-0.02, B=block(k,{huelle:'roh',rohr:'#c49a62',hb,deckel:{kappe:'#ffd23f',wand:'#d8b880'}});
  banderole(k,B,0.018,0.124); const c='#cdb48a', y1=hb+0.0016, w2=B.w/2+0.0028, d2=B.d/2+0.0028;
  kordel(k,[[-w2,0.07,0],[-w2,y1,0],[w2,y1,0],[w2,0.07,0]],c); kordel(k,[[0,0.124,d2],[0,y1,d2],[0,y1,-d2],[0,0.124,-d2]],c);
  schleife(k,0,y1,0,0.05,c); return fertig(k); };
/* Palmenhain (Aurum): schwarz-goldene Displaybox, Deckelfenster auf die
   goldenen Rohrkappen, goldene Kantenleisten */
V.goldpalmen=t=>{ const k=neu(t);
  fensterKarton(k,{topL:[{form:'rund',x:0.07,y:0.1,w:0.86,h:0.8,r:0.12}],rahmen:GOLD,rohr:'#2a2010',deckel:{kappe:'#e8c35a',wand:'#3a2a10',grund:'#0b0a09',schnur:'#b8892f'}});
  ecken(k,k.w-0.0044,k.h,k.d-0.0044,GOLD,0.009); return fertig(k); };
/* Tausendblueten: Karton mit Sichtfenster vorn auf die Rohre */
V.sternenmeer42=t=>{ const k=neu(t);
  fensterKarton(k,{vornL:[{form:'rund',x:0.07,y:0.17,w:0.6,h:0.36,r:0.25}],rohr:'#ff4fa3',rohrO:{kopf:'#c8ff5c'},deckel:{kappe:'#ff4fa3'}});
  lascheSeite(k,{w:k.w,d:k.d},0.05,'#c8ff5c'); return fertig(k); };
/* Sternblinken: Eckfenster ueber die vordere Oberkante */
V.blitzgewitter60=t=>{ const k=neu(t);
  fensterKarton(k,{vornL:[{x:0.4,y:0,w:0.32,h:0.36}],topL:[{x:0.4,y:0.55,w:0.32,h:0.45}],rahmen:'#5ce1ff',rohr:'#26324a',deckel:{kappe:'#f2f5ff',wand:'#8aa0c0'},
    /* 03.10.: Name oben nicht mehr vom Eckfenster zerschnitten */
    top:(g,W,H)=>{ effektFoto(g,0,0,W,H,k.t,k.a,zufallAus(hashStr(k.t+'top')),{stadt:false}); nameText(g,k.a.title,W/2,H*0.24,W*0.86,Math.round(H*0.17),FNT.bar,'#fff','rgba(0,0,0,.7)',3); }});
  return fertig(k); };
/* Vorhang auf!: Buehnen-Displaybox - rote Vorhaenge um das Fenster */
V.goldenerregen=t=>{ const k=neu(t);
  const vorn=(g,W,H)=>{ drawFront(g,W,H,k.a,k.cat);
    /* Buehnenrahmen, Vorhaenge, Lambrequin */
    const x0=W*0.17, x1=W*0.83, y0=H*0.06, y1=H*0.56;
    g.fillStyle='#3a0508'; g.fillRect(x0-W*0.04,y0-H*0.03,x1-x0+W*0.08,y1-y0+H*0.05);
    for(const s of [0,1]){ const xa=s?x1-W*0.1:x0-W*0.02, gw=W*0.12; for(let i=0;i<6;i++){ const gr=g.createLinearGradient(xa+i*gw/6,0,xa+(i+1)*gw/6,0); gr.addColorStop(0,'#5a0a12'); gr.addColorStop(0.5,'#c8202e'); gr.addColorStop(1,'#5a0a12'); g.fillStyle=gr; g.fillRect(xa+i*gw/6,y0,gw/6+1,y1-y0); } }
    for(let i=0;i<10;i++){ g.fillStyle=i%2?'#a8141f':'#c8202e'; g.beginPath(); g.arc(x0+(x1-x0)*(i+0.5)/10,y0,(x1-x0)/20,0,PI); g.fill(); }
    g.fillStyle=GOLD; for(const xx of [x0+W*0.04,x1-W*0.04]){ g.beginPath(); g.arc(xx,y0+(y1-y0)*0.55,W*0.012,0,2*PI); g.fill(); } };
  fensterKarton(k,{vorn,vornL:[{x:0.25,y:0.12,w:0.5,h:0.42}],rahmen:GOLD,rohr:'#c9a24a',rohrO:{kopf:'#fff3c4'},deckel:{kappe:'#ffd23f'}});
  return fertig(k); };
/* Sternentor: Verbundkarton mit Torbogen-Fenster, Spanngurte */
V.sternentor=t=>{ const k=neu(t), e=0.003;
  fensterKarton(k,{vornL:[{form:'bogen',x:0.32,y:0.07,w:0.36,h:0.48}],rahmen:GOLD,rohr:'#1a2a6a',rohrO:{kopf:'#f2f5ff'},deckel:{kappe:'#f2f5ff',wand:'#4a5a9a'}});
  for(const s of [-1,1]) gurtZ(k,s*0.41,k.h-e,k.d-2*e,'#16161a',0.02,GOLD);
  return fertig(k); };
/* Kaleidoskop: Sechseck-Fenster, goldene Kantenleisten, zwei Griffe */
V.sternenkaiser=t=>{ const k=neu(t), gh=0.05, hb=k.h-gh;
  fensterKarton(k,{hb,vornL:[{form:'hex',x:0.24,y:0.07,w:0.52,h:0.52}],rahmen:GOLD,rohr:'#1a0a2a',rohrO:{bunt:['#5ce1ff','#ffd23f','#c85cff','#ff4f7a','#7dff8a']},deckel:{kappe:(i,j)=>['#5ce1ff','#ffd23f','#c85cff','#ff4f7a'][(i+j)%4]}});
  ecken(k,k.w-0.0044,hb,k.d-0.0044,GOLD,0.014); for(const s of [-1,1]) griff(k,s*0.27,hb,k.h,0.17,'#141414');
  return fertig(k); };
/* Fontaenenballett: langer Displaykarton mit Panoramafenster */
V.lb_fontaenenballett=t=>{ const k=neu(t);
  fensterKarton(k,{vornL:[{form:'rund',x:0.05,y:0.1,w:0.9,h:0.42,r:0.3}],rahmen:GOLD,rohr:'#1a3a6a',rohrO:{bunt:['#5ce1ff','#ff6a8a','#1a3a6a']},deckel:{kappe:(i,j)=>i%2?'#5ce1ff':'#ff6a8a'}});
  return fertig(k); };
/* Fontaenenpalast: drei Arkadenfenster, goldene Zinnen */
V.lb_fontaenenpalast=t=>{ const k=neu(t), zh=0.022, hb=k.h-zh;
  fensterKarton(k,{hb,vornL:[0.08,0.4,0.72].map(x=>({form:'bogen',x,y:0.07,w:0.2,h:0.5})),rahmen:GOLD,rohr:'#2a0a4a',rohrO:{kopf:'#ffd23f'},deckel:{kappe:(i,j)=>(i+j)%2?'#ffd23f':'#ff5ac8'}});
  const n=17; for(let i=0;i<n;i++) if(i%2===0) vbox(k,k.w/n,zh,0.012,-k.w/2+k.w*(i+0.5)/n,hb+zh/2,k.d/2-0.006,GOLD);
  return fertig(k); };
/* Pfauenschweif: Karton mit ovalem Fenster auf die Faecherrohre */
V.rbfaecher=t=>{ const k=neu(t);
  fensterKarton(k,{vornL:[{form:'kreis',x:0.27,y:0.06,w:0.46,h:0.55}],rahmen:'#ffd23f',rohr:'#0a4a4a',rohrO:{faecher:0.9,kopf:'#3a8aff'},deckel:{kappe:'#3a8aff'}});
  return fertig(k); };
/* Silberbrandung: Folienkarton mit Wellenschnitt, silberner Rand */
V.sternenmeer80=t=>{ const k=neu(t);
  fensterKarton(k,{vornL:[{form:'welle',x:0,y:0,w:1,h:0.42,n:2}],rahmen:SILBER,rohr:'#0f4f5c',rohrO:{kopf:'#d1e5ff'},deckel:{kappe:'#d1e5ff',wand:'#5ce1ff'}});
  klar(k,new THREE.BoxGeometry(k.w,k.h,k.d),tm(0,k.h/2,0)); return fertig(k); };
/* Geysirfeld: Displaykarton mit Ausreissfront und hoher Rueckwand */
V.geysirfeld=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d; k.alpha=true; k.doppel=true;
  const fh=0.55, vorn=reg(k,'fvorn',w,h,pLoch(pFront(k),[{form:'zacken',x:-0.01,y:-0.01,w:1.02,h:1-fh+0.01,n:26}],'#e8e0cc',0.006));
  const sx=(g,W,H)=>{ drawSide(g,W,H,k.a); g.save(); g.globalCompositeOperation='destination-out'; g.beginPath(); g.moveTo(W*0.06,0); g.lineTo(W,0); g.lineTo(W,H*(1-fh)); g.closePath(); g.fill(); g.restore(); };
  kasten(k,w,h,d,tm(0,h/2,0),{pz:vorn,nz:reg(k,'hinten',w,h,pEtikett(k,{sub:''})),px:reg(k,'seite',d,h,sx),nx:'seite',py:leer(k),ny:farbe(k,'#2a2018')});
  const L=lay(k), ih=h*0.78;
  kasten(k,w-0.008,ih,d-0.03,tm(0,ih/2,-0.01),{pz:reg(k,'iv',w,ih,pRohrSeite({n:L.cols,farbe:'#0f4a5c',kopf:'#5cffe8'})),px:reg(k,'is',d,ih,pRohrSeite({n:L.rows,farbe:'#0f4a5c'})),nx:'is',nz:'iv',py:reg(k,'id',w,d,pRohrDeckel({cols:L.cols,rows:L.rows,kappe:(i,j,R)=>R()<0.15?'#5cffe8':'#f2f5ff',wand:'#7ab8c8'})),ny:farbe(k,'#2a2018')});
  /* Kopfschild an der Rueckwand (Displaykarton) */
  return fertig(k); };

/* ---------------- Kisten ---------------- */
/* Weltuntergang: Lattenkiste mit Spanngurten, Schablonenschrift,
   drinnen die bedruckten Verbundkartons */
V.finale=t=>{ const k=neu(t);
  const K=kiste(k,{latten:true,holz:'#cfae78',ez:0.006,kernVorn:reg(k,'kern',k.w,k.h,pFront(k)),kernTop:reg(k,'kernT',k.w,k.d,pTop(k)),bretter:6,gap:0.05,leisten:true,deckel:true,deckBretter:4});
  schild(k,'schild',K.W*0.56,K.H*0.48,0,K.H*0.47,K.D/2+0.0005);
  for(const s of [-1,1]) gurtZ(k,s*K.W*0.36,K.H,K.D,'#f28a1c',0.024,'#9aa0a8');
  return fertig(k); };
/* Goldader: geschlossene Grubenholzkiste mit Eisenbeschlaegen, Schild */
V.lb_goldader=t=>{ const k=neu(t);
  const K=kiste(k,{holz:'#7a5530',bretter:3,aeste:2});
  schild(k,'schild',K.W*0.62,K.H*0.84,0,K.H*0.5,K.D/2,pFront(k));
  const c='#2a2622', b=0.045;
  for(const sx of [-1,1]) for(const sy of [0,1]){ const y=sy?K.H-b/2:b/2;
    vbox(k,b,b,0.003,sx*(K.W/2-b/2),y,K.D/2+0.0015,c); vbox(k,0.003,b,b,sx*(K.W/2+0.0015),y,K.D/2-b/2,c);
    vkugel(k,0.004,6,4,sx*(K.W/2-b*0.5),y,K.D/2+0.003,'#8a8a8a'); }
  vbox(k,0.04,0.05,0.003,0,K.H-0.03,K.D/2+0.0015,'#b8892f'); vzyl(k,0.007,0.007,0.004,10,0,K.H-0.045,K.D/2+0.003,'#3a3026',PI/2);
  return fertig(k); };
/* Legion: olivgruene Feldkiste mit Seilgriffen und Schablonenschrift */
V.legion=t=>{ const k=neu(t), ex=0.03;
  const K=kiste(k,{ex,holz:'#7a7a4a',lack:'#55603a',deck:0.85,bretter:5,aeste:0});
  schild(k,'schild',K.W*0.5,K.H*0.5,-K.W*0.12,K.H*0.48,K.D/2,pFront(k));
  schild(k,'schab',K.W*0.28,K.H*0.3,K.W*0.33,K.H*0.62,K.D/2,(g,W,H)=>{ g.fillStyle='#55603a'; g.fillRect(0,0,W,H); schablone(g,'LEGION',W/2,H*0.32,W*0.9,H*0.42,'#e8e2c8'); schablone(g,'240 SCHUSS · 1.4G',W/2,H*0.72,W*0.9,H*0.22,'#e8e2c8'); },0.001);
  for(const s of [-1,1]) seilgriff(k,s,s*K.W/2,K.H*0.62,'#c8b48a',0.04);
  /* 03.10.: Deckel mit Schablonenschrift statt leerem Oliv */
  druck(k,new THREE.PlaneGeometry(K.W*0.8,K.D*0.6),tm(0,K.H+0.0012,0,-PI/2,0,0),reg(k,'deckSchab',K.W*0.8,K.D*0.6,(g,W,H)=>{ g.clearRect(0,0,W,H); schablone(g,'LEGION',W/2,H*0.36,W*0.7,H*0.36,'rgba(232,226,200,.9)'); schablone(g,'240 SCHUSS · KERZEN-HEER · 1.4G',W/2,H*0.72,W*0.8,H*0.12,'rgba(232,226,200,.85)');
    g.strokeStyle='rgba(232,226,200,.8)'; g.lineWidth=Math.max(2,W*0.008); g.strokeRect(W*0.04,H*0.08,W*0.92,H*0.84); }));
  k.alpha=true;
  for(const s of [-1,1]){ vbox(k,0.04,0.06,0.004,s*K.W*0.3,K.H-0.04,K.D/2+0.002,'#3a3a32'); }
  return fertig(k); };
/* Silbergewitter: Alukiste mit Riffeln, Kantenprofilen und Spannverschluessen */
V.lb_silbergewitter=t=>{ const k=neu(t), e=0.006, W=k.w-2*e, D=k.d-2*e, H=k.h-0.004; k.metall=0.35; k.rauh=0.4;
  const alu=reg(k,'alu',0.5,0.15,pMetall({farbe:'#c4c9d0',riffel:7})), deckel=reg(k,'aluT',0.5,0.25,(g,W,H)=>{ pMetall({farbe:'#c9ced6'})(g,W,H);
    /* 03.10.: Deckel nicht mehr blank - aufgeklebtes Etikett und Gefahrgutraute */
    const ew=W*0.56, eh=H*0.6; g.save(); g.translate(W*0.06,H*0.2); drawTop(g,ew,eh,k.a,k.cat); g.restore(); g.strokeStyle='#f2f5ff'; g.lineWidth=Math.max(2,W*0.006); g.strokeRect(W*0.06,H*0.2,ew,eh);
    g.save(); g.translate(W*0.82,H*0.5); g.rotate(PI/4); g.fillStyle='#ff9a1f'; g.fillRect(-H*0.16,-H*0.16,H*0.32,H*0.32); g.restore(); nameText(g,'1.4G',W*0.82,H*0.5,H*0.25,Math.round(H*0.1),FNT.bar,'#1b1b1b'); });
  kasten(k,W,H,D,tm(0,H/2,0),{pz:alu,nz:alu,px:alu,nx:alu,py:deckel,ny:alu});
  schild(k,'schild',W*0.62,H*0.68,-W*0.04,H*0.45,D/2,pFront(k));
  const p='#9aa1ab'; for(const sx of [-1,1]) for(const sz of [-1,1]) vbox(k,0.014,H,0.014,sx*(W/2-0.003),H/2,sz*(D/2-0.003),p);
  for(const y of [0.006,H*0.78,H-0.006]) for(const sz of [-1,1]) vbox(k,W,0.012,0.012,0,y,sz*(D/2-0.002),p);
  for(const s of [-1,1]){ const x=s*W*0.36; vbox(k,0.05,0.04,0.006,x,H*0.78,D/2+0.003,'#7a8088'); vbox(k,0.03,0.02,0.007,x,H*0.72,D/2+0.0035,'#d8dde4'); }
  return fertig(k); };
/* Glutschmiede: Stahlkiste im Hammerschlaglack, Nieten, Eisengriff */
V.glutschmiede=t=>{ const k=neu(t), e=0.004, gh=0.04, W=k.w-2*e, D=k.d-2*e, H=k.h-gh; k.rauh=0.5; k.metall=0.25;
  const st=reg(k,'stahl',0.5,0.2,pMetall({art:'hammer',farbe:'#3a1a12'})), stT=reg(k,'stahlT',0.5,0.25,pMetall({art:'hammer',farbe:'#2a1410'}));
  kasten(k,W,H,D,tm(0,H/2,0),{pz:st,nz:st,px:st,nx:st,py:stT,ny:st});
  schild(k,'schild',W*0.66,H*0.84,0,H*0.5,D/2,pFront(k));
  for(const y of [0.012,H-0.012]) for(let i=0;i<13;i++){ vzyl(k,0.005,0.005,0.004,8,-W/2+W*(i+0.5)/13,y,D/2+0.002,'#c86a2a',PI/2); }
  for(const sx of [-1,1]) for(const sz of [-1,1]) vbox(k,0.03,H,0.03,sx*(W/2-0.013),H/2,sz*(D/2-0.013),'#1a0c08');
  vbox(k,0.03,0.008,0.04,-0.12,H+0.004,0,'#1a1a1a'); vbox(k,0.03,0.008,0.04,0.12,H+0.004,0,'#1a1a1a');
  vzyl(k,0.007,0.007,0.24,8,0,H+gh-0.008,0,'#2a2a2a',0,0,PI/2); for(const s of [-1,1]) vzyl(k,0.006,0.006,gh-0.008,8,s*0.12,H+(gh-0.008)/2,0,'#2a2a2a');
  return fertig(k); };
/* Weidenhain: Weidenkorb mit Seitengriffen, Anhaengeschild an Kordel */
V.lb_weidenhain=t=>{ const k=neu(t), ex=0.028, W=k.w-2*ex, D=k.d-0.008, kh=k.h*0.64;
  const fl=reg(k,'flecht',0.6,0.15,pGeflecht('#b88a4a'));
  kasten(k,W,kh,D,tm(0,kh/2,0),{pz:fl,nz:fl,px:fl,nx:fl,py:farbe(k,'#5a3a1a'),ny:fl});
  const B=block(k,{huelle:'roh',rohr:'#3a2a06',bw:W-0.02,bd:D-0.02,hb:k.h-0.003,rohrO:{kopf:'#ffb84a'},deckel:{kappe:(i,j)=>(i+j)%3?'#ffb84a':'#fff3c4'}});
  for(const sz of [-1,1]) vbox(k,W+0.006,0.016,0.016,0,kh,sz*D/2,'#8a6230'); for(const sx of [-1,1]) vbox(k,0.016,0.016,D+0.006,sx*W/2,kh,0,'#8a6230');
  for(const s of [-1,1]) vring(k,0.05,0.008,5,12,PI,s*W/2,kh*0.72,0,'#a07a40',0,s*PI/2,0,1,0.8,1);
  /* Anhaenger vorn an Kordel */
  const sw=W*0.6, sh=kh*0.9; schild(k,'schild',sw,sh,0,kh*0.48,D/2+0.001,pFront(k),0.0025);
  kordel(k,[[-sw*0.4,kh*0.48+sh/2,D/2+0.003],[-sw*0.3,kh-0.004,D/2+0.004]],'#e8dcc0',0.0018); kordel(k,[[sw*0.4,kh*0.48+sh/2,D/2+0.003],[sw*0.3,kh-0.004,D/2+0.004]],'#e8dcc0',0.0018);
  return fertig(k); };
/* Grosses Kreuzfeuer: Wellpapp-Verbundkarton, Etikett, rotes Klebeband-X */
V.kreuzfeuer90=t=>{ const k=neu(t), w=k.w, h=k.h-0.002, d=k.d-0.006;
  const wv=reg(k,'well',w,h,pWell({fn:(g,W,H)=>{ gefahrRaute(g,W*0.89,H*0.28,H*0.3,'1.4G'); g.fillStyle='#1d1a16'; g.font=`700 ${Math.round(H*0.07)}px "Barlow Condensed", Arial`; g.textAlign='center'; g.fillText('VERBUND · 2 BATTERIEN',W*0.89,H*0.74); g.fillText('▲ ▲ OBEN',W*0.89,H*0.86); }}));
  const ws=reg(k,'wellS',d,h,pWell({fn:(g,W,H)=>{ g.fillStyle='#2a2016'; g.beginPath(); g.ellipse(W/2,H*0.2,W*0.2,H*0.06,0,0,2*PI); g.fill(); gefahrRaute(g,W/2,H*0.62,Math.min(W,H)*0.4,'1.4G'); }}));
  const wt=reg(k,'wellT',w,d,pWell({fn:(g,W,H)=>{ g.strokeStyle='#c81e1e'; g.lineWidth=H*0.09; g.beginPath(); g.moveTo(0,0); g.lineTo(W,H); g.moveTo(W,0); g.lineTo(0,H); g.stroke(); g.fillStyle='rgba(255,255,255,.25)'; g.font=`700 ${Math.round(H*0.06)}px Arial`; g.textAlign='center'; g.fillText('KREUZFEUER',W*0.5,H*0.5); }}));
  kasten(k,w,h,d,tm(0,h/2,0),{pz:wv,nz:wv,px:ws,nx:ws,py:wt,ny:wt});
  schild(k,'schild',w*0.66,h*0.84,-w*0.14,h*0.5,d/2);
  vbox(k,w,0.002,0.05,0,h+0.001,0,'#c9a46a');
  for(const s of [-1,1]) vbox(k,0.04,h*0.42,0.002,s*0.025*0+(-w/2+0.03)*(s>0?-1:1),h*0.8,d/2+0.001,'#c81e1e');
  return fertig(k); };
/* Donnerschlag (Nordlicht): Wellpappkarton mit Stuelpdeckel, LAUT-Aufkleber,
   oranges Umreifungsband quer */
V.donnerschlag=t=>{ const k=neu(t), e=0.003, w=k.w-2*e, d=k.d-2*e, h=k.h-0.003, dh=h*0.24;
  const wv=reg(k,'well',w,h,pWell()), ws=reg(k,'wellS',d,h,pWell({fn:(g,W,H)=>{ g.fillStyle='#2a2016'; g.beginPath(); g.ellipse(W/2,H*0.42,W*0.22,H*0.05,0,0,2*PI); g.fill(); schablone(g,'ACHTUNG LAUT',W/2,H*0.7,W*0.85,H*0.08,'#1d1a16'); }}));
  kasten(k,w-0.004,h-dh+0.01,d-0.004,tm(0,(h-dh+0.01)/2,0),{pz:wv,nz:wv,px:ws,nx:ws,rest:wv});
  const dt=reg(k,'deck',w,dh,pWell({fn:(g,W,H)=>{ schablone(g,'DONNERSCHLAG · 20 SCHLAG',W/2,H/2,W*0.9,H*0.42,'#1d1a16'); }}));
  kasten(k,w,dh,d,tm(0,h-dh/2,0),{pz:dt,nz:dt,px:reg(k,'deckS',d,dh,pWell()),nx:'deckS',py:reg(k,'deckT',w,d,pWell({fn:(g,W,H)=>gefahrRaute(g,W*0.5,H*0.5,Math.min(W,H)*0.4,'1.4G')})),ny:wv});
  schild(k,'schild',w*0.86,(h-dh)*0.9,0,(h-dh)*0.5,d/2-0.002);
  gurtX(k,-d*0.1,w,h,'#f28a1c',0.02);
  /* runder LAUT-Aufkleber */
  druck(k,new THREE.CircleGeometry(0.034,20),tm(w*0.36,(h-dh)*0.86,d/2+0.0012),reg(k,'laut',0.07,0.07,(g,W,H)=>{ g.fillStyle='#d8322a'; g.beginPath(); g.arc(W/2,H/2,W/2,0,2*PI); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(W/2,H/2,W*0.42,0,2*PI); g.fill(); g.fillStyle='#d8322a'; g.beginPath(); g.arc(W/2,H/2,W*0.38,0,2*PI); g.fill(); nameText(g,'LAUT!',W/2,H/2,W*0.7,Math.round(H*0.3),FNT.bun,'#fff'); }));
  return fertig(k); };

/* ---------------- runde und besondere Formen ---------------- */
/* Hexenkessel: gusseiserner Kessel mit Fuessen und Henkeln, Etikett an
   Kettchen, oben die gruen leuchtenden Rohrkappen */
V.hexenkessel=t=>{ const k=neu(t), Rk=Math.min(k.w,k.d)/2-0.012, h=k.h; k.doppel=true;
  const prof=[[0.001,0.03],[Rk*0.45,0.034],[Rk*0.78,0.06],[Rk*0.97,0.13],[Rk,0.2],[Rk*0.96,0.27],[Rk*0.86,0.33],[Rk*0.84,0.355],[Rk*0.9,0.37],[Rk*0.88,0.385]].map(([r,y])=>new THREE.Vector2(r,y*h/0.42));
  druck(k,new THREE.LatheGeometry(prof,22),tm(0,0,0),reg(k,'eisen',0.6,0.2,pMetall({art:'hammer',farbe:'#26262a'})));
  const L=lay(k); druck(k,new THREE.CircleGeometry(Rk*0.86,24),tm(0,0.345*h/0.42,0,-PI/2,0,0),reg(k,'inhalt',0.3,0.3,(g,W,H)=>{ pRohrDeckel({cols:L.cols,rows:L.rows,kappe:(i,j,R)=>R()<0.3?'#c85cff':'#b6ff3a',wand:'#3a4a2a',grund:'#0a1406',schnur:false})(g,W,H); const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2); gr.addColorStop(0,'rgba(182,255,58,.25)'); gr.addColorStop(1,'rgba(182,255,58,0)'); g.fillStyle=gr; g.fillRect(0,0,W,H); }));
  vring(k,Rk*0.89,0.008,6,24,2*PI,0,0.385*h/0.42,0,'#1a1a1e',PI/2,0,0);
  for(let i=0;i<3;i++){ const an=i*2*PI/3+PI/2; vzyl(k,0.012,0.016,0.035,8,Math.cos(an)*Rk*0.5,0.0175,Math.sin(an)*Rk*0.5,'#1a1a1e'); }
  for(const s of [-1,1]) vring(k,0.026,0.006,5,12,PI,s*(Rk*0.9+0.0),h*0.82,0,'#1a1a1e',0,s>0?-PI/2:PI/2,0);
  /* Etikett: Holzbrett an Kettchen vom Rand */
  const sw=0.25, sh=0.18, sy=h*0.46, sz=Rk+0.004; schild(k,'schild',sw,sh,0,sy,sz-0.003,pFront(k),0.004);
  for(const s of [-1,1]) kordel(k,[[s*sw*0.42,sy+sh/2,sz],[s*Rk*0.55,h*0.86,Rk*0.72]],'#8a8a90',0.0016);
  return fertig(k); };
/* Tonleiter: Giebelschachtel (Henkelkarton) mit ausgestanztem Griff */
V.heulbatterie=t=>{ const k=neu(t), w=k.w, d=k.d, h=k.h, hb=h*0.66, gh=h*0.2, a=k.a; k.alpha=true; k.doppel=true;
  kasten(k,w,hb,d,tm(0,hb/2,0),{pz:reg(k,'front',w,hb,pFront(k)),nz:'front',px:reg(k,'seite',d,hb,pSeite(k)),nx:'seite',py:leer(k),ny:farbe(k,'#2a2018')});
  /* Dachflaechen vorn/hinten bis zum First */
  const rz=d/2, L=Math.hypot(rz,gh), an=Math.atan2(gh,rz), dach=reg(k,'dach',w,L,(g,W,H)=>{ g.fillStyle=a.bg1; g.fillRect(0,0,W,H); for(let i=0;i<8;i++){ g.fillStyle=i%2?a.ac:'#ffffff'; g.fillRect(i*W/8,H*0.6,W/16,H*0.4); }
    nameText(g,'♪ '+a.title+' ♪',W/2,H*0.32,W*0.9,Math.round(H*0.32),FNT.bun,a.ac); });
  for(const s of [-1,1]) kasten(k,w,0.002,L,tm(0,hb+gh/2,s*rz/2,s*an,0,0),{rest:dach});
  /* Giebeldreiecke links/rechts */
  const gieb=reg(k,'giebel',d,gh,(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); g.fillStyle=a.ac2; g.fillRect(0,H*0.8,W,H*0.2); g.save(); g.globalCompositeOperation='destination-out'; g.beginPath(); g.moveTo(0,0); g.lineTo(W/2,0); g.lineTo(0,H); g.closePath(); g.fill(); g.beginPath(); g.moveTo(W,0); g.lineTo(W/2,0); g.lineTo(W,H); g.closePath(); g.fill(); g.restore(); });
  for(const s of [-1,1]) kasten(k,0.002,gh,d,tm(s*(w/2-0.001),hb+gh/2,0),{px:gieb,nx:gieb,rest:leer(k)});
  /* Griffplatte ueber dem First */
  const ph=h-hb-gh, platte=reg(k,'griff',w,ph,pLoch((g,W,H)=>{ g.fillStyle=a.ac; g.fillRect(0,0,W,H); g.fillStyle=a.bg1; g.fillRect(0,H*0.8,W,H*0.2); },[{form:'rund',x:0.3,y:0.18,w:0.4,h:0.45,r:0.5}],null));
  kasten(k,w*0.9,ph,0.004,tm(0,hb+gh+ph/2,0),{pz:platte,nz:platte,rest:farbe(k,a.ac)});
  return fertig(k); };
/* Dreisprung: drei Stufenbloecke (Hop, Step, Jump) in Folie, Banderole */
V.miniverbund=t=>{ const k=neu(t), e=0.003, bw=(k.w-2*e)/3, d=k.d-2*e, H=k.h-0.003, hs=[0.6,0.8,1];
  hs.forEach((f,i)=>{ const x=-k.w/2+e+bw*(i+0.5), h=H*f, rv=reg(k,'rv'+i,bw,h,pRohrSeite({n:3,farbe:['#f28a1c','#ffd23f','#d8322a'][i],kopf:'#f2f5ff'}));
    kasten(k,bw-0.001,h,d,tm(x,h/2,0),{pz:rv,nz:rv,px:reg(k,'rs'+i,d,h,pRohrSeite({n:3,farbe:['#f28a1c','#ffd23f','#d8322a'][i],kopf:'#f2f5ff'})),nx:'rs'+i,py:reg(k,'rd'+i,bw,d,pRohrDeckel({cols:1,rows:3,kappe:['#5a1a02','#f28a1c','#ffd23f'][i],wand:['#f28a1c','#ffd23f','#d8322a'][i],schnur:false})),ny:farbe(k,'#2a2018')});
    klar(k,new THREE.BoxGeometry(bw,h+0.002,d+2*e),tm(x,(h+0.002)/2,0)); });
  banderole(k,{w:k.w-2*e,d,x:0,z:0},0.008,H*0.58);
  return fertig(k); };
/* Weidenwand (3 Module): drei Bloecke nebeneinander, gemeinsame Banderole */
V.kometenwand=t=>{ const k=neu(t), e=0.003, n=3, gap=0.006, bw=(k.w-2*e-gap*(n-1))/n, d=k.d-2*e, h=k.h-0.002, L=lay(k);
  for(let i=0;i<n;i++){ const x=-k.w/2+e+bw/2+i*(bw+gap);
    kasten(k,bw,h,d,tm(x,h/2,0),{pz:reg(k,'rv',bw,h,pRohrSeite({n:Math.round(L.cols/3),farbe:'#8a6a2a',kopf:'#ffd23f'})),nz:'rv',px:reg(k,'rs',d,h,pRohrSeite({n:L.rows,farbe:'#8a6a2a'})),nx:'rs',py:reg(k,'rd',bw,d,pRohrDeckel({cols:Math.round(L.cols/3),rows:L.rows,kappe:(i,j)=>j%2?'#ffd23f':'#f2f5ff',wand:'#b8925f'})),ny:farbe(k,'#2a2018')}); }
  const bh=h*0.72; banderole(k,{w:k.w-2*e,d},0.04,0.04+bh,{maler:(g,W,H)=>{ const a=k.a; g.fillStyle=a.bg2; g.fillRect(0,0,W,H);
    const fw=Math.min(W*0.5,H*1.9), x0=(W-fw)/2; g.save(); g.translate(x0,0); drawFront(g,fw,H,a,k.cat); g.restore();
    for(let m=0;m<3;m++){ const mx=m*W/3+W/6; if(m===1) continue; g.fillStyle=a.ac; g.fillRect(m*W/3+W*0.02,H*0.08,W*0.29,H*0.035); nameText(g,'MODUL '+(m+1),mx,H*0.3,W*0.25,Math.round(H*0.12),FNT.bun,a.ac); nameText(g,'30 SCHUSS',mx,H*0.48,W*0.25,Math.round(H*0.09),FNT.bar,'#f2f5ff');
      for(let i=0;i<5;i++){ g.strokeStyle=rgba(a.ac,0.7); g.lineWidth=Math.max(1,H*0.008); g.beginPath(); g.moveTo(mx,H*0.9); g.quadraticCurveTo(mx+(i-2)*W*0.02,H*0.62,mx+(i-2)*W*0.035,H*0.78); g.stroke(); } } }});
  for(let i=1;i<n;i++) vbox(k,0.004,0.03,0.004,-k.w/2+e+i*(bw+gap)-gap/2,h*0.9,d/2+0.001,'#2e8b3a');
  return fertig(k); };
/* Farbsaeulen: Trapez-Faecherkarton (oben breiter als unten) */
V.feuerpfau=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, ub=0.66; k.alpha=true; k.doppel=true;
  const trap=(g,W,H)=>{ g.save(); g.globalCompositeOperation='destination-out'; g.beginPath(); g.moveTo(0,0); g.lineTo(W*(1-ub)/2,H); g.lineTo(0,H); g.closePath(); g.fill(); g.beginPath(); g.moveTo(W,0); g.lineTo(W-W*(1-ub)/2,H); g.lineTo(W,H); g.closePath(); g.fill(); g.restore(); };
  const vorn=reg(k,'front',w,h,(g,W,H)=>{ drawFront(g,W,H,k.a,k.cat); trap(g,W,H); });
  const hinten=reg(k,'hinten',w,h,(g,W,H)=>{ pEtikett(k,{sub:''})(g,W,H); trap(g,W,H); });
  kasten(k,w,h,d,tm(0,h/2,0),{pz:vorn,nz:hinten,px:leer(k),nx:leer(k),py:reg(k,'top',w,d,pTop(k)),ny:leer(k)});
  const sx=w*(1-ub)/2, L=Math.hypot(sx,h), an=Math.atan2(sx,h), sd=reg(k,'seite',d,L,pSeite(k));
  for(const s of [-1,1]) kasten(k,0.003,L,d,tm(s*(w/2-sx/2),h/2,0,0,0,-s*an),{px:sd,nx:sd,rest:farbe(k,k.a.bg2)});
  kasten(k,w*ub,0.003,d,tm(0,0.0015,0),{rest:farbe(k,'#2a2018')});
  return fertig(k); };
/* Sonnenaufgang: Karton mit Bogendach (aufgehende Sonne) */
V.faecher=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, hb=h*0.6, ry=h-hb, rx=w/2, a=k.a;
  kasten(k,w,hb,d,tm(0,hb/2,0),{pz:reg(k,'front',w,hb,pFront(k)),nz:'front',px:reg(k,'seite',d,hb,pSeite(k)),nx:'seite',py:farbe(k,a.bg2),ny:farbe(k,'#2a2018')});
  const sonne=reg(k,'sonne',w,w,(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H/2); gr.addColorStop(0,'#2a0802'); gr.addColorStop(0.6,'#c2410c'); gr.addColorStop(1,'#ff9a3d'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.save(); g.translate(W/2,H/2); for(let i=0;i<19;i++){ const an=PI+i*PI/18; g.fillStyle=i%2?'rgba(255,210,63,.55)':'rgba(255,154,61,.25)'; g.beginPath(); g.moveTo(0,0); g.arc(0,0,W*0.6,an-0.06,an+0.06); g.closePath(); g.fill(); }
    const sg=g.createRadialGradient(0,0,0,0,0,W*0.2); sg.addColorStop(0,'#fff6c8'); sg.addColorStop(0.5,'#ffd23f'); sg.addColorStop(1,'#ff9a3d'); g.fillStyle=sg; g.beginPath(); g.arc(0,0,W*0.18,PI,2*PI); g.fill(); g.restore();
    nameText(g,'36 SCHUSS · HALBKREISFÄCHER',W/2,H*0.43,W*0.6,Math.round(H*0.04),FNT.bar,'#fff3c4'); });
  for(const s of [-1,1]) druck(k,new THREE.CircleGeometry(rx,28,0,PI),tm(0,hb,s*d/2,0,s>0?0:PI,0,1,ry/rx,1),sonne);
  druck(k,new THREE.CylinderGeometry(rx,rx,d,28,1,true,-PI/2,PI),tm(0,hb,0,-PI/2,0,0,1,1,ry/rx),reg(k,'dach',PI*rx,d,(g,W,H)=>{ g.fillStyle='#c2410c'; g.fillRect(0,0,W,H); for(let i=0;i<12;i++){ g.fillStyle=i%2?'#ff9a3d':'#ffd23f'; g.fillRect(i*W/12,0,W/24,H); } }));
  return fertig(k); };
/* Pfauenrad (Nordlicht): Kartonmanschette, darueber die gefaecherten
   Rohrkoepfe offen (ohne Plastik) */
V.pfauenrad=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, hb=h*0.7, n=9, tr=0.017, a=k.a;
  kasten(k,w,hb,d,tm(0,hb/2,0),{pz:reg(k,'front',w,hb,pFront(k)),nz:'front',px:reg(k,'seite',d,hb,pSeite(k)),nx:'seite',py:farbe(k,'#b8925f'),ny:farbe(k,'#2a2018')});
  const L=h-hb+0.03; for(let r=0;r<2;r++) for(let i=0;i<n;i++){ const f=i/(n-1)-0.5, til=f*0.7, x=f*w*0.78, z=(r-0.5)*d*0.45, cy=hb-0.03+L/2*Math.cos(til);
    vzyl(k,tr,tr,L,10,x-Math.sin(til)*L/2,cy,z,'#b8925f',0,0,-til); vzyl(k,tr*0.85,tr*0.85,0.004,10,x-Math.sin(til)*L,hb-0.03+L*Math.cos(til)+0.001,z,['#5cff9e','#ff4fa3'][(i+r)%2],0,0,-til); }
  vbox(k,w*0.9,0.03,0.003,0,hb+0.005,d/2-0.004,'#c9a676');
  return fertig(k); };
/* Pfeifkonzert: Instrumentenkoffer - Kantenbiesen, Eckkappen, Griff,
   Kofferschloesser */
V.pfeifkonzert=t=>{ const k=neu(t), e=0.007, gh=0.035, w=k.w-2*e, d=k.d-2*e, h=k.h-gh;
  kasten(k,w,h,d,tm(0,h/2,0),{pz:reg(k,'front',w,h,pFront(k)),nz:'front',px:reg(k,'seite',d,h,pSeite(k)),nx:'seite',py:reg(k,'top',w,d,pTop(k)),ny:farbe(k,'#1a1a1a')});
  const c='#141414', r=0.006;
  for(const sy of [0,1]) for(const sz of [-1,1]) vzyl(k,r,r,w,6,0,sy*h,sz*d/2,c,0,0,PI/2);
  for(const sy of [0,1]) for(const sx of [-1,1]) vzyl(k,r,r,d,6,sx*w/2,sy*h,0,c,PI/2,0,0);
  for(const sx of [-1,1]) for(const sz of [-1,1]){ vzyl(k,r,r,h,6,sx*w/2,h/2,sz*d/2,c); for(const sy of [0,1]) vkugel(k,0.009,8,6,sx*w/2,sy*h,sz*d/2,'#c9ced6',1,sy?1:0.5,1); }
  vzyl(k,0.011,0.011,0.13,10,0,h+gh-0.012,0,'#3a2a1a',0,0,PI/2); for(const s of [-1,1]) vbox(k,0.016,gh-0.006,0.02,s*0.07,h+(gh-0.006)/2,0,'#c9ced6');
  for(const s of [-1,1]){ vbox(k,0.034,0.024,0.004,s*w*0.32,h-0.02,d/2+0.002,'#d9b45a'); vbox(k,0.014,0.01,0.006,s*w*0.32,h-0.026,d/2+0.003,'#8a6a2a'); }
  return fertig(k); };
/* Rosenherz (Nordlicht): Geschenkkarton mit Stuelpdeckel, Satinband und
   Schleife */
V.hochzeitsfaecher=t=>{ const k=neu(t), e=0.004, sh=0.045, H=k.h-sh, dh=H*0.24, w=k.w-2*e, d=k.d-2*e, a=k.a, band='#e8578f';
  kasten(k,w-0.006,H-dh+0.004,d-0.006,tm(0,(H-dh+0.004)/2,0),{pz:reg(k,'front',w,H-dh,pFront(k)),nz:'front',px:reg(k,'seite',d,H-dh,pSeite(k)),nx:'seite',rest:farbe(k,'#f6eef0')});
  const herz=(g,W,H)=>{ g.fillStyle='#fbf3f5'; g.fillRect(0,0,W,H); const s=Math.max(8,H*0.3); for(let y=s*0.6,r=0;y<H+s;y+=s,r++) for(let x=(r%2)*s*0.6;x<W+s;x+=s*1.2){ g.fillStyle='rgba(232,87,143,.35)'; g.beginPath(); g.moveTo(x,y+s*0.25); g.bezierCurveTo(x-s*0.4,y-s*0.05,x-s*0.15,y-s*0.35,x,y-s*0.12); g.bezierCurveTo(x+s*0.15,y-s*0.35,x+s*0.4,y-s*0.05,x,y+s*0.25); g.fill(); } };
  kasten(k,w,dh,d,tm(0,H-dh/2,0),{pz:reg(k,'deckel',w,dh,herz),nz:'deckel',px:reg(k,'deckelS',d,dh,herz),nx:'deckelS',py:reg(k,'deckelT',w,d,herz),ny:farbe(k,'#f6eef0')});
  const t2=0.0015, b=0.03; vbox(k,b,t2,d+2*t2,0,H+t2/2,0,band); vbox(k,w+2*t2,t2,b,0,H+t2/2,0,band);
  for(const s of [-1,1]){ vbox(k,b,dh,t2,0,H-dh/2,s*(d/2+t2/2),band); vbox(k,t2,dh,b,s*(w/2+t2/2),H-dh/2,0,band); }
  schleife(k,0,H+0.004,0,0.11,band);
  return fertig(k); };
/* Pusteblume (Kinder): Klarsicht-Clamshell mit Einlegekarte und Aufhaengelasche */
V.kinderbatterie=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, a=k.a, th=0.018, H=h-th; k.alpha=true;
  const B=block(k,{bw:w*0.72,bd:d*0.62,hb:H*0.72,z:-d*0.12,y0:0.004,huelle:'roh',rohr:'#2f9e57',rohrO:{bunt:['#2f9e57','#ff4fa3','#ffd23f','#3ec1ff','#b47cff'],kopf:'#ffffff'},etikett:[0.06,0.08,0.88,0.3],deckel:{kappe:(i,j)=>(i+j)%2?'#ffd23f':'#ff4fa3'}});
  /* L-foermige Einlegekarte: vorn bedruckt, unten Boden */
  const kh=H*0.62; kasten(k,w-0.006,kh,0.002,tm(0,kh/2+0.003,d/2-0.007),{pz:reg(k,'front',w,kh,pFront(k)),rest:farbe(k,'#ffffff')});
  kasten(k,w-0.006,0.002,d-0.008,tm(0,0.002,0),{rest:farbe(k,a.bg1)});
  /* Aufhaengelasche mit Euroloch (Karton, hinten oben) */
  const lasch=reg(k,'lasche',w*0.5,th,pLoch((g,W,H)=>{ g.fillStyle=a.bg1; g.fillRect(0,0,W,H); g.fillStyle='#ffd23f'; g.fillRect(0,H*0.82,W,H*0.18); },[{form:'rund',x:0.35,y:0.22,w:0.3,h:0.42,r:0.5}],null));
  kasten(k,w*0.5,th,0.002,tm(0,H+th/2,-d/2+0.004),{pz:lasch,nz:lasch,rest:farbe(k,a.bg1)});
  /* Klarsicht-Schale mit Siegelrand */
  klar(k,new THREE.BoxGeometry(w-0.004,H-0.002,d-0.004),tm(0,H/2+0.001,0)); klar(k,new THREE.BoxGeometry(w,0.004,d),tm(0,0.002,0));
  return fertig(k); };
/* Brausepulver (Kinder): Bonbon-Tuete aus Zellophan mit gedrehten Enden,
   bedruckter Bauchbinde, bunter Inhalt */
V.kinderparty=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, a=k.a, R=Math.min(h,d)/2-0.004, lc=w*0.52, cy=R+0.002;
  /* Inhalt: kleine Fontaenen und Roehrchen */
  const cols=['#ff4fa3','#ffe45c','#5ce1ff','#7dff8a','#c78bff'];
  for(let i=0;i<9;i++){ const x=-lc/2+lc*(i+0.5)/9, z=(i%2?-1:1)*R*0.3; if(i%3===0) vzyl(k,R*0.12,R*0.32,R*0.9,10,x,cy-R*0.15,z,cols[i%5]); else vzyl(k,R*0.16,R*0.16,R*1.1,10,x,cy-R*0.1,z,cols[i%5],0,0,0.25*(i%2?1:-1)); }
  /* Zellophan: Bauch und Kegel zu den Drehstellen, Faecherenden */
  klar(k,new THREE.CylinderGeometry(R,R,lc,18,1,true),tm(0,cy,0,0,0,PI/2));
  const tw=w*0.13, fl=(w-lc)/2-tw;
  for(const s of [-1,1]){ klar(k,new THREE.CylinderGeometry(R,R*0.12,tw,16,1,true),tm(s*(lc/2+tw/2),cy,0,0,0,s*PI/2));
    klar(k,new THREE.CylinderGeometry(R*0.12,R*0.85,fl,16,1,true),tm(s*(lc/2+tw+fl/2),cy,0,0,0,s*PI/2,1,1,0.45));
    vzyl(k,R*0.15,R*0.15,0.012,10,s*(lc/2+tw),cy,0,'#ff4fa3',0,0,PI/2);
    for(const r of [-1,1]) vring(k,R*0.25,0.0022,4,10,PI*1.2,s*(lc/2+tw)+s*0.008,cy-R*0.25,r*R*0.12,'#ffe45c',0,0,r*0.6); }
  /* Bauchbinde: bedruckt, vorn das Druckbild (gedreht aufgemalt) */
  const bw=lc*0.8, C=2*PI*(R+0.001);
  druck(k,new THREE.CylinderGeometry(R+0.001,R+0.001,bw,24,1,true,-PI/2),tm(0,cy,0,0,0,-PI/2),reg(k,'binde',C,bw,(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H);
    const ih=W*0.3; for(let q=0;q<2;q++){ g.save(); g.translate(q*W/2+W/4-ih/2,H); g.rotate(-PI/2); drawFront(g,H,ih,a,k.cat); g.restore(); } }));
  return fertig(k); };
/* Rummelplatz: Sortimentskoffer - Druck vorn, Klarsichtdeckel oben auf
   die Faecher mit den Teilen, Tragegriff hinten */
V.familienmix=t=>{ const k=neu(t), gh=0.03, h=k.h-gh;
  fensterKarton(k,{hb:h,topL:[{form:'rund',x:0.05,y:0.32,w:0.9,h:0.62,r:0.08}],rahmen:'#fff27a',innen:false});
  kasten(k,k.w-0.008,h*0.5,k.d-0.008,tm(0,h*0.25,0),{py:reg(k,'faecher',k.w,k.d,(g,W,H)=>{ g.fillStyle='#f6e8f0'; g.fillRect(0,0,W,H); g.strokeStyle='#d8b8c8'; g.lineWidth=Math.max(2,W*0.008); for(let i=1;i<6;i++){ g.beginPath(); g.moveTo(W*i/6,H*0.3); g.lineTo(W*i/6,H); g.stroke(); } for(const y of [0.3,0.65]){ g.beginPath(); g.moveTo(0,H*y); g.lineTo(W,H*y); g.stroke(); } }),rest:farbe(k,'#e8d8e0')});
  const cols=['#c8407a','#7affe8','#fff27a','#ff8ac8','#5ce1ff','#ffd23f'];
  for(let r=0;r<2;r++) for(let i=0;i<6;i++){ const x=-k.w/2+k.w*(i+0.5)/6, z=-k.d/2+k.d*(r?0.82:0.48), c=cols[(i+r*2)%6];
    if((i+r)%3===0) vzyl(k,0.022,0.038,0.07,10,x,h*0.5+0.035,z,c); else if((i+r)%3===1){ for(const dx of [-0.015,0.015]) vzyl(k,0.011,0.011,0.08,8,x+dx,h*0.5+0.04,z,c); } else vbox(k,0.05,0.05,0.04,x,h*0.5+0.025,z,c); }
  griff(k,0,h,k.h,0.16,'#c8407a',-k.d*0.38);
  return fertig(k); };
/* Finale Grande (Nordlicht): Holzsteige mit fuenf italienischen
   Zylinderbomben. 03.10. (Tom: "so eintoenig"): jede Bombe traegt jetzt
   ihr eigenes Rundum-Etikett - Packpapier in ihrer Farbe, kreuzweise
   verschnuert, vorn das Etikett mit Effektbild, Effektname und Kaliber,
   oben der Kopf mit Bindfaden und Zuendlitze. */
function pBombe(k,i,c,nm,mm){ return (g,W,H)=>{ const rnd=zufallAus(hashStr(k.t+'bomba'+i));
  g.fillStyle=c; g.fillRect(0,0,W,H);
  for(let n=0;n<W*H/30;n++){ g.fillStyle=rnd()<0.5?'rgba(0,0,0,.06)':'rgba(255,255,255,.06)'; g.fillRect(rnd()*W,rnd()*H,2,1); }
  /* Verschnuerung: Schraeglinien kreuzweise */
  g.strokeStyle='rgba(235,220,180,.85)'; g.lineWidth=Math.max(1,W*0.006);
  for(let x=-H;x<W+H;x+=W/9){ g.beginPath(); g.moveTo(x,0); g.lineTo(x+H*0.8,H); g.stroke(); g.beginPath(); g.moveTo(x,H); g.lineTo(x+H*0.8,0); g.stroke(); }
  /* Etikett vorn und hinten */
  for(const cx of [W*0.25,W*0.75]){ const ew=W*0.36, eh=H*0.62, ex=cx-ew/2, ey=H*0.2, hinten=cx>W/2;
    g.fillStyle='#f6efdc'; g.fillRect(ex,ey,ew,eh); g.strokeStyle='#1b1b1b'; g.lineWidth=Math.max(1,W*0.004); g.strokeRect(ex+ew*0.04,ey+eh*0.03,ew*0.92,eh*0.94);
    /* Trikolore-Streifen */
    ['#2f9e57','#f6efdc','#d8322a'].forEach((q,j)=>{ g.fillStyle=q; g.fillRect(ex+ew*0.04+j*ew*0.92/3,ey+eh*0.03,ew*0.92/3,eh*0.07); });
    nameText(g,'BOMBA',cx,ey+eh*0.17,ew*0.85,Math.round(eh*0.1),FNT.cin,'#1b1b1b');
    /* Effektbild rund */
    const fr=Math.min(ew*0.36,eh*0.2); g.save(); g.beginPath(); g.arc(cx,ey+eh*0.42,fr,0,PI*2); g.clip(); g.fillStyle='#07081a'; g.fillRect(cx-fr,ey+eh*0.42-fr,fr*2,fr*2);
    g.globalCompositeOperation='lighter'; const ac=i===1?'#fff3c4':c; for(let n=0;n<30;n++){ const an=n/30*PI*2, rr=fr*(0.6+rnd()*0.35); g.strokeStyle=rgba(ac,0.8); g.lineWidth=Math.max(1,fr*0.05); g.beginPath(); g.moveTo(cx,ey+eh*0.42); g.lineTo(cx+Math.cos(an)*rr,ey+eh*0.42+Math.sin(an)*rr*(i===2?1.25:1)); g.stroke(); }
    g.restore(); g.strokeStyle='#b8902a'; g.lineWidth=Math.max(1,fr*0.08); g.beginPath(); g.arc(cx,ey+eh*0.42,fr,0,PI*2); g.stroke();
    nameText(g,nm,cx,ey+eh*0.7,ew*0.86,Math.round(eh*0.075),FNT.cin,'#7a1a12');
    nameText(g,hinten?'F4 · CE 0589':'Ø '+mm+' mm',cx,ey+eh*0.83,ew*0.8,Math.round(eh*0.07),FNT.bar,'#1b1b1b');
    g.fillStyle='#1b1b1b'; for(let n=0;n<4;n++) g.fillRect(ex+ew*0.18,ey+eh*(0.9+n*0.018),ew*0.64*(0.6+0.4*rnd()),Math.max(1,eh*0.006)); }
  /* Kopfbinde oben, Naht unten */
  g.fillStyle='#e8dcc0'; g.fillRect(0,0,W,H*0.06); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,H*0.06,W,Math.max(1,H*0.006));
  g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(0,H*0.96,W,H*0.04); }; }
V.kugelfinale=t=>{ const k=neu(t), H=k.h*0.5;
  const K=kiste(k,{latten:true,H,holz:'#d8b888',bretter:3,gap:0.022,deckel:false,kern:farbe(k,'#3a2a18')});
  vbox(k,K.W-0.02,0.01,K.D-0.02,0,0.005,0,'#c8a87a');
  const R=0.046, pos=[[-0.13,-0.1],[0,-0.11],[0.13,-0.1],[-0.07,0.06],[0.07,0.06]], hs=[0.27,0.29,0.31,0.25,0.33];
  const B=[['#3f8a4e','CRISANTEMO VERDE',100],['#e9e2cf','PEONIA BIANCA',100],['#b8322a','SALICE ROSSO',125],['#2f6a8a','PALMA BLU',100],['#8a2f6a','COLPI FINALE',125]];
  pos.forEach(([x,z],i)=>{ const hh=hs[i], [c,nm,mm]=B[i], ry=(i-2)*0.18;
    mantel(k,R,hh,0.01,'bomba'+i,pBombe(k,i,c,nm,mm),{x,z,seg:18});
    /* um die Bombe gedreht: Etikett zeigt leicht nach aussen */
    k.druck[k.druck.length-1].m=tm(x,0.01+hh/2,z,0,ry,0);
    vzyl(k,R*0.96,R*0.96,0.004,14,x,0.01+hh+0.002,z,'#3a3026');
    /* Kopf: Bindfaden-Knoten und Zuendlitze mit Papierkappe */
    vzyl(k,R*0.32,R*0.42,0.016,10,x,0.01+hh+0.01,z,'#e8dcc0');
    vzyl(k,0.004,0.004,k.h-0.012-hh,5,x+0.01,0.01+hh+(k.h-0.012-hh)/2,z,'#2e5a8a'); vzyl(k,0.007,0.007,0.02,6,x+0.01,k.h-0.012,z,'#d8322a'); });
  schild(k,'schild',K.W*0.8,H*0.8,0,H*0.5,K.D/2+0.0005);
  return fertig(k); };
/* Regenbogenbrunnen: Klarsichtschachtel mit bedrucktem Rahmen, darin
   die zehn kleinen Kegelfontaenen in Regenbogenfarben */
V.lb_regenbogenbrunnen=t=>{ const k=neu(t);
  fensterKarton(k,{vornL:[{form:'rund',x:0.03,y:0.05,w:0.94,h:0.52,r:0.2}],topL:[{x:0.03,y:0.05,w:0.94,h:0.9}],rahmen:'#ffd23f',innen:false});
  /* 03.10.: dunkler Einsatz - vorher sah man schraeg von oben durch die
     Schachtel hindurch (weisse Flaechen) */
  vInnen(k,k.w-0.004,k.h-0.008,k.d-0.004,0,(k.h+0.004)/2,0,'#1a0a30');
  const rb=['#ff3b3b','#ff8a2a','#ffd23f','#5cd65c','#3ad6d6','#3a6aff','#a24aff'];
  for(let r=0;r<2;r++) for(let i=0;i<5;i++){ const x=-k.w/2+k.w*(i+0.5)/5, z=(r-0.5)*k.d*0.45, c=rb[(i+r*5)%7], hh=k.h*0.62;
    vzyl(k,0.012,0.03,hh,12,x,0.006+hh/2,z,c); vzyl(k,0.013,0.016,0.012,10,x,0.006+hh,z,'#f4f0e6'); }
  return fertig(k); };
/* Glitzergarten: Pastell-Tray, darauf die Rohre mit Bluetenkappen unter
   einer Klarsichthaube */
V.lb_glitzergarten=t=>{ const k=neu(t), w=k.w, d=k.d, tb=k.h*0.55, a=k.a, L=lay(k);
  kasten(k,w,tb,d,tm(0,tb/2,0),{pz:reg(k,'front',w,tb,pFront(k)),nz:'front',px:reg(k,'seite',d,tb,pSeite(k)),nx:'seite',py:farbe(k,'#5a1a4a'),ny:farbe(k,'#2a2018')});
  const rh=k.h-tb-0.012, pc=['#ff7ac8','#3ae0c8','#ffd23f','#a87aff'];
  for(let j=0;j<L.rows;j++) for(let i=0;i<L.cols;i++){ if((i+j)%2) continue; const x=-w/2+w*(i+0.5)/L.cols*0.92+w*0.04, z=-d/2+d*(j+0.5)/L.rows*0.9+d*0.05, c=pc[(i+j*2)%4];
    vzyl(k,0.02,0.02,rh,10,x,tb+rh/2,z,c); vzyl(k,0.03,0.03,0.004,5,x,tb+rh+0.002,z,c); vzyl(k,0.026,0.026,0.004,5,x,tb+rh+0.004,z,mix(c,'#ffffff',0.4),0,PI/5,0); vzyl(k,0.008,0.008,0.005,6,x,tb+rh+0.006,z,'#ffd23f'); }
  klar(k,new THREE.BoxGeometry(w-0.004,k.h-tb,d-0.004),tm(0,tb+(k.h-tb)/2,0));
  return fertig(k); };

/* ---------------- Bloecke mit Folie / Banderole / Etikett ---------------- */
/* Kreuzfeuer: bedruckter Block in Folie, zwei rote Umreifungsbaender
   ueber Kreuz (Kreuzung rechts hinten, Name bleibt frei) */
V.kreuzfeuer=t=>{ const k=neu(t), B=block(k,{folie:true,deckel:{kappe:'#ffd23f'}});
  gurtZ(k,B.w/2-0.014,B.h,B.d,'#c81e1e',0.016,null); gurtX(k,-B.d*0.2,B.w,B.h,'#c81e1e',0.016);
  mit(k,tm(-B.w/2,0,0,0,-PI/2,0),()=>lasche(k,B.d/2-0.035,0.045,0)); folie(k); return fertig(k); };
/* Lichterprozession: Block in Folie mit Kopfkarte hinten oben */
V.lichterprozession=t=>{ const k=neu(t), kh=0.06, a=k.a, B=block(k,{folie:true,oben:kh,deckel:{kappe:(i,j)=>['#ffd23f','#ff7ad8','#5ce1ff'][(i+j)%3]}});
  kasten(k,B.w,kh+0.012,0.003,tm(0,B.h+kh/2-0.006,-B.d/2+0.006),{pz:reg(k,'kopf',B.w,kh,(g,W,H)=>{ const gr=g.createLinearGradient(0,0,W,0); gr.addColorStop(0,a.bg1); gr.addColorStop(0.5,hell(a.bg1,0.15)); gr.addColorStop(1,a.bg1); g.fillStyle=gr; g.fillRect(0,0,W,H);
    for(let i=0;i<9;i++){ const x=W*(0.06+i*0.11); g.fillStyle='#f4eadc'; g.fillRect(x-W*0.008,H*0.45,W*0.016,H*0.5); const fg=g.createRadialGradient(x,H*0.32,0,x,H*0.32,H*0.2); fg.addColorStop(0,'#fff6c8'); fg.addColorStop(1,'rgba(255,210,63,0)'); g.fillStyle=fg; g.beginPath(); g.arc(x,H*0.32,H*0.2,0,2*PI); g.fill(); }
    nameText(g,'GROSSKERZEN · OHNE KNALL',W/2,H*0.55,W*0.6,Math.round(H*0.32),FNT.bar,'#fff','rgba(0,0,0,.6)',2); }),nz:farbe(k,a.bg1),rest:farbe(k,a.bg1)});
  lascheSeite(k,B,0.045,'#ff7ad8'); folie(k,k.w,B.h+0.004,k.d); klar(k,new THREE.BoxGeometry(B.w+0.004,kh,0.008),tm(0,B.h+kh/2,-B.d/2+0.006)); return fertig(k); };
/* Blitzpalmen: bedruckter Block in Folie, gelber Kantenschutz, zwei
   gelbe Spanngurte */
V.lb_blitzpalmen=t=>{ const k=neu(t), B=block(k,{folie:true,deckel:{kappe:(i,j)=>(i+j)%2?'#ffd23f':'#ffffff'}});
  ecken(k,B.w,B.h,B.d,'#ffcc1a',0.022); for(const s of [-1,1]) gurtZ(k,s*B.w*0.42,B.h,B.d,'#ffcc1a',0.025,'#3a3a3a');
  folie(k); return fertig(k); };
/* Schimmelreiter: schwarze nackte Rohre, silberne Banderole, Folie */
V.kometen=t=>{ const k=neu(t), B=block(k,{folie:true,huelle:'roh',rohr:'#2a2c32',rohrO:{kopf:'#f2f5ff'},deckel:{kappe:'#f2f5ff',wand:'#5a5c64'}});
  banderole(k,B,B.h*0.14,B.h*0.78,{seite:(g,W,H)=>{ const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,'#e8ecf2'); gr.addColorStop(0.5,'#9aa2ae'); gr.addColorStop(1,'#e8ecf2'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    /* 03.10.: Seite nicht mehr leer - Pferdeschweif-Motiv, Name, Warnfeld */
    g.save(); g.beginPath(); g.rect(W*0.06,H*0.05,W*0.88,H*0.42); g.clip(); effektFoto(g,W*0.06,H*0.05,W*0.88,H*0.42,k.t,k.a,zufallAus(hashStr(k.t+'s')),{stadt:false,einzeln:true}); g.restore();
    g.strokeStyle='#26292f'; g.lineWidth=Math.max(1.5,W*0.01); g.strokeRect(W*0.06,H*0.05,W*0.88,H*0.42);
    nameText(g,k.a.title,W/2,H*0.55,W*0.86,Math.round(H*0.1),FNT.bun,'#26292f'); nameText(g,k.a.sub||'',W/2,H*0.64,W*0.86,Math.round(H*0.05),FNT.bar,'#3a3f48');
    g.fillStyle='rgba(255,255,255,.85)'; g.fillRect(W*0.1,H*0.7,W*0.8,H*0.24); g.fillStyle='#1b1b1b'; g.font=`700 ${Math.max(6,Math.round(H*0.035))}px Arial`; g.textAlign='left'; g.textBaseline='top'; g.fillText('ACHTUNG',W*0.14,H*0.715);
    for(let i=0;i<5;i++){ g.fillStyle='rgba(30,30,30,.5)'; g.fillRect(W*0.14,H*(0.76+i*0.03),W*0.5,Math.max(1,H*0.008)); }
    for(let i=0;i<3;i++){ const cx=W*(0.72+i*0.0), cy=H*(0.77+i*0.055); g.fillStyle='#fff'; g.beginPath(); g.arc(cx,cy,H*0.022,0,2*PI); g.fill(); g.strokeStyle='#c8322a'; g.lineWidth=Math.max(1,H*0.006); g.stroke(); } },farbe:'#c9ced6'});
  lascheSeite(k,B,0.04,'#5c8dff'); folie(k); return fertig(k); };
/* Goldregen (Aurum): schwarze Rohre, breite schwarz-goldene Banderole,
   goldene Kantenwinkel, Siegel */
V.lb_goldregen=t=>{ const k=neu(t), B=block(k,{huelle:'roh',rohr:'#16120a',rohrO:{kopf:'#ffd23f'},deckel:{kappe:'#ffd23f',wand:'#6a5020',grund:'#0b0a09'}});
  banderole(k,B,B.h*0.08,B.h*0.86,{farbe:'#0b0a09',akzent:GOLD}); ecken(k,B.w+0.003,B.h,B.d+0.003,GOLD,0.02);
  druck(k,new THREE.CircleGeometry(0.03,20),tm(B.w*0.42,B.h*0.2,B.d/2+0.0028),reg(k,'siegel',0.06,0.06,(g,W,H)=>{ stern(g,W/2,H/2,W/2,16,0.86); g.fillStyle=GOLD; g.fill(); g.fillStyle='#0b0a09'; g.beginPath(); g.arc(W/2,H/2,W*0.36,0,2*PI); g.fill(); nameText(g,'22',W/2,H*0.44,W*0.5,Math.round(H*0.3),FNT.cin,GOLD); nameText(g,'SCHUSS',W/2,H*0.66,W*0.5,Math.round(H*0.11),FNT.bar,GOLD); }));
  return fertig(k); };
/* Farbenpracht: Rohre in allen Farben in Klarsichtfolie, grosses Etikett */
V.lb_farbenpracht=t=>{ const k=neu(t), B=block(k,{folie:true,huelle:'roh',bunt:['#ff5a5a','#ff9a3d','#ffd23f','#5cff9e','#3ad6d6','#3a6aff','#c85cff','#ff4fa3'],etikett:[0.2,0.1,0.6,0.8],deckel:{kappe:(i,j,R)=>['#ff5a5a','#5cff9e','#ffd23f','#3a6aff','#c85cff'][(i*3+j)%5]},warnSeite:true});
  lascheSeite(k,B,0.045); folie(k); return fertig(k); };
/* Farbreihen (rb, Nordlicht, ohne Plastik): Kraftrohre mit Etikett, jede
   Kappenreihe eine Farbe, Kantenwinkel aus Pappe */
V.rb25=t=>{ const k=neu(t), B=block(k,{huelle:'roh',rohr:'#c49a62',etikett:[0.08,0.12,0.84,0.66],deckel:{kappe:['#ff4a4a','#5cff9e','#3a6aff','#ffd23f','#f2f5ff'],wand:'#d8b880'},warnSeite:true});
  ecken(k,B.w,B.h,B.d,'#a07848',0.016); lascheSeite(k,B,0.05); return fertig(k); };
/* Konfetti (rb): weisse Rohre, Konfetti-Kappen, Etikett, Folie */
V.rb49=t=>{ const k=neu(t), B=block(k,{folie:true,huelle:'roh',rohr:'#efe9dc',rohrO:{kopf:['#ffd23f','#5ce1ff','#ff4fa3','#7dff8a']},etikett:[0.06,0.2,0.88,0.6],deckel:{kappe:(i,j,R)=>['#ffd23f','#5ce1ff','#ff4fa3','#7dff8a','#c85cff'][Math.floor(R()*5)],wand:'#f4f0e6',grund:'#d8d0c0'},warnSeite:true});
  lascheSeite(k,B,0.05,'#5ce1ff'); folie(k); return fertig(k); };
/* Stakkato (rb): schwarze Rohre, Etikett, Folie, PP-Tragband mit Schlaufe */
V.rb100=t=>{ const k=neu(t), th=0.04, B=block(k,{folie:true,oben:th,huelle:'roh',rohr:'#1e1e1e',rohrO:{kopf:'#ff5a1e'},etikett:[0.08,0.14,0.84,0.68],deckel:{kappe:'#ff5a1e',wand:'#4a4a4a'},warnSeite:true});
  const c='#ff5a1e', b=0.022; gurtX(k,0,B.w,B.h,c,b);
  kordel(k,[[-0.07,B.h+0.002,0],[-0.05,B.h+th-0.008,0],[0.05,B.h+th-0.008,0],[0.07,B.h+0.002,0]],c,0.004);
  vbox(k,0.11,0.006,b,0,B.h+th-0.006,0,c);
  folie(k,k.w,B.h+0.004,k.d); return fertig(k); };
/* Schneeballschlacht: bedruckter Block im weissen Netzschlauch, oben
   mit Clip abgebunden */
V.schneeballschlacht=t=>{ const k=neu(t), ch=0.022, B=block(k,{e:0.004,oben:ch,deckel:{kappe:'#f2f5ff',wand:'#c8d0d8'}});
  k.extraMat=netzMat('#f4f6fa',1.3); const g=new THREE.BoxGeometry(B.w+0.006,B.h+0.004,B.d+0.006), uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*1.4,uv.getY(i)*0.7);
  k.extra.push({geo:g,m:tm(0,(B.h+0.004)/2,0)});
  const c=new THREE.CylinderGeometry(0.004,B.w*0.36,ch,10,1,true), uc=c.attributes.uv; for(let i=0;i<uc.count;i++) uc.setXY(i,uc.getX(i)*0.8,uc.getY(i)*0.12); k.extra.push({geo:c,m:tm(0,B.h+ch/2,0)});
  vzyl(k,0.007,0.007,0.012,10,0,k.h-0.008,0,'#5ce1ff'); vbox(k,0.016,0.008,0.004,0,k.h-0.004,0,'#5ce1ff');
  return fertig(k); };
/* Kometenreigen: goldene Rohre in Folie, bedruckter Schuber (vorn, oben,
   hinten), Seiten offen */
V.kometenreigen=t=>{ const k=neu(t), B=block(k,{folie:true,e:0.005,huelle:'roh',rohr:'#c9a24a',deckel:{kappe:'#fff3c4'}}), t2=0.0018, w=B.w*0.9, a=k.a;
  kasten(k,w,B.h,t2,tm(0,B.h/2,B.d/2+t2/2),{pz:reg(k,'front',w,B.h,pFront(k)),rest:farbe(k,a.bg2)});
  kasten(k,w,B.h,t2,tm(0,B.h/2,-B.d/2-t2/2),{nz:reg(k,'hinten',w,B.h,pEtikett(k)),rest:farbe(k,a.bg2)});
  kasten(k,w,t2,B.d+2*t2,tm(0,B.h+t2/2,0),{py:reg(k,'top',w,B.d,pTop(k)),rest:farbe(k,a.bg2)});
  kasten(k,w,t2,B.d+2*t2,tm(0,t2/2,0),{rest:farbe(k,a.bg2)});
  folie(k); return fertig(k); };
/* Trommelfeuer: zwei Batterien uebereinander, PP-Baender, Tragschlaufe */
V.donnerwand=t=>{ const k=neu(t), e=0.003, th=0.05, H=k.h-th, hb=H/2-0.002, a=k.a;
  const B1=block(k,{e,hb,y0:0,deckel:{kappe:'#ff8a2a'}}); block(k,{e,hb,y0:hb+0.004,id:'2',deckel:{kappe:'#ff8a2a'}});
  vbox(k,B1.w,0.004,B1.d,0,hb+0.002,0,'#1a1a1a');
  for(const s of [-1,1]) gurtZ(k,s*(B1.w/2-0.012),2*hb+0.004,B1.d,'#1a1a1a',0.018,'#ff7a00');
  kordel(k,[[-(B1.w/2-0.012),2*hb+0.006,0],[-B1.w*0.2,k.h-0.01,0],[B1.w*0.2,k.h-0.01,0],[B1.w/2-0.012,2*hb+0.006,0]],'#1a1a1a',0.006);
  vbox(k,0.14,0.014,0.03,0,k.h-0.01,0,'#ff7a00');
  return fertig(k); };
/* Goetterfunken: Profi-Verbundkarton auf Holzpalette, Kantenschutz,
   zwei Spanngurte, Griffmulden */
V.profi=t=>{ const k=neu(t), ph=0.06, e=0.004, w=k.w-2*e, d=k.d-2*e, h=k.h-ph-0.004;
  const seite=reg(k,'seite',d,h,(g,W,H)=>{ drawSide(g,W,H,k.a); g.fillStyle='#0a0a0a'; g.beginPath(); g.ellipse(W/2,H*0.12,W*0.2,H*0.035,0,0,2*PI); g.fill(); });
  kasten(k,w,h,d,tm(0,ph+h/2,0),{pz:reg(k,'front',w,h,pFront(k)),nz:'front',px:seite,nx:seite,py:reg(k,'top',w,d,pTop(k)),ny:farbe(k,'#2a2018')});
  const hz=reg(k,'palette',0.5,0.1,pHolz({farbe:'#d8b888',saat:3}));
  for(const z of [-1,0,1]) kasten(k,k.w,ph*0.6,0.07,tm(0,ph*0.3,z*(k.d/2-0.035)),{rest:hz});
  for(let i=0;i<5;i++) kasten(k,0.1,ph*0.4,k.d,tm(-k.w/2+0.05+i*(k.w-0.1)/4,ph*0.8,0),{rest:hz});
  ecken(k,w,h,d,'#ff7a00',0.03,ph); for(const s of [-1,1]) gurtZ(k,s*(w/2-0.03),h,d,'#121418',0.024,'#ff7a00',ph);
  return fertig(k); };
/* Pusteblume ist die Kinderbatterie, Brausepulver das Kindersortiment (oben) */
/* Feuersturm/Achterbahn/Blitzweiden: Tragekartons */
V.lb_blitzweiden=t=>{ const k=neu(t), gh=0.042, hb=k.h-gh;
  kasten(k,k.w,hb,k.d,tm(0,hb/2,0),{pz:reg(k,'front',k.w,hb,pFront(k)),nz:'front',px:reg(k,'seite',k.d,hb,pSeite(k)),nx:'seite',py:reg(k,'top',k.w,k.d,pTop(k)),ny:farbe(k,'#2a2018')});
  for(const s of [-1,1]) griff(k,s*k.w*0.3,hb,k.h,0.16,'#1d1f24',0,true);
  return fertig(k); };

/* ---------------- Kugelbomben ---------------- */
/* Netz-Familie: Kugel im Netz, oben gerafft; je Produkt Netzfarbe,
   Verschluss (Clip, Knoten, Kappe, Tragegurt) und Anhaenger */
function netzKugel(k,o){ const w=k.w, h=k.h, d=k.d, R=Math.min(w,d)/2*(o.rf||0.84), cy=R*1.06+0.002, Rn=R*1.04;
  kugel(k,R,0,cy,0,{zuender:false});
  k.extraMat=netzMat(o.netz);
  k.extra.push({geo:new THREE.SphereGeometry(Rn,16,12),m:tm(0,cy,0)});
  const y0=cy+Rn*0.9, hals=o.hals||h*0.86;
  k.extra.push({geo:new THREE.CylinderGeometry(R*0.05,Rn*0.44,hals-y0,12,1,true),m:tm(0,(hals+y0)/2,0)});
  k.extra.push({geo:new THREE.CylinderGeometry(R*(o.fransen||0.2),R*0.05,h-hals-0.004,10,1,true),m:tm(0,(h+hals)/2-0.002,0)});
  /* Anhaenger vorn an der Schnur */
  const tw=o.tw||w*0.5, th=o.th||h*0.3, ty=o.ty||cy+R*0.12, tz=Rn+0.0035;
  k.alpha=true; k.doppel=true;
  kasten(k,tw,th,0.0015,tm(0,ty,tz,-0.12,0,0),{pz:reg(k,'tag',tw,th,o.tag||pBild(k,tw,th)),nz:'tag',rest:farbe(k,'#f4f0e6')});
  kordel(k,[[0,ty+th*0.45,tz-0.001],[0,hals-0.004,R*0.06]],o.schnur||'#e8dcc0',0.0011);
  return {R,cy,Rn,hals};
}
/* Anhaenger mit Loch und Rand */
const tagLoch=(m,form)=>(g,W,H)=>{ m(g,W,H); g.save(); g.globalCompositeOperation='destination-out';
  if(form==='rund'){ g.fillRect(0,0,W,H); g.globalCompositeOperation='destination-in'; }
  g.restore();
  g.fillStyle='#f4f0e6'; g.beginPath(); g.arc(W/2,H*0.08,Math.min(W,H)*0.05,0,2*PI); g.fill(); g.save(); g.globalCompositeOperation='destination-out'; g.beginPath(); g.arc(W/2,H*0.08,Math.min(W,H)*0.025,0,2*PI); g.fill(); g.restore(); };
/* Crossettennetz: dunkelviolettes Netz, Metallclip, Karte */
V.crossettennetz150=t=>{ const k=neu(t), N=netzKugel(k,{netz:'#3a2a5a',tag:tagLoch(pFront(k))});
  vzyl(k,0.009,0.009,0.014,10,0,N.hals,0,'#c9ced6'); vbox(k,0.022,0.006,0.008,0,N.hals,0.006,'#9aa1ab'); return fertig(k); };
/* Tigerkrone: oranges Netz, schwarze Schutzkappe, runder Anhaenger mit
   Tigerstreifenrand */
V.tigerkrone150=t=>{ const k=neu(t), tw=k.w*0.52;
  const tag=(g,W,H)=>{ g.fillStyle='#ff8a1c'; g.beginPath(); g.arc(W/2,H/2,W/2,0,2*PI); g.fill(); g.fillStyle='#1a1a1a'; for(let i=0;i<16;i++){ const an=i*PI/8; g.save(); g.translate(W/2,H/2); g.rotate(an); g.beginPath(); g.moveTo(W*0.36,0); g.lineTo(W*0.5,-W*0.04); g.lineTo(W*0.5,W*0.04); g.fill(); g.restore(); }
    g.save(); g.beginPath(); g.arc(W/2,H/2,W*0.38,0,2*PI); g.clip(); g.translate(W*0.12,H*0.12); drawFront(g,W*0.76,H*0.76,k.a,k.cat); g.restore();
    g.save(); g.globalCompositeOperation='destination-out'; g.beginPath(); g.rect(0,0,W,H); g.arc(W/2,H/2,W/2,0,2*PI,true); g.fill(); g.restore(); };
  const N=netzKugel(k,{netz:'#ff8a1c',tag,tw,th:tw,ty:k.h*0.42});
  vzyl(k,0.012,0.014,0.03,12,0,k.h-0.017,0,'#141414'); vring(k,0.013,0.002,4,12,2*PI,0,k.h-0.029,0,'#ff8a1c',PI/2,0,0); return fertig(k); };
/* Weidenkoenig (Nordlicht): Goldnetz, Kronen-Anhaenger, goldene Kordel */
V.weidenkoenig200=t=>{ const k=neu(t), tw=k.w*0.56, th=k.h*0.34;
  const tag=(g,W,H)=>{ drawFront(g,W,H,k.a,k.cat); g.save(); g.globalCompositeOperation='destination-out'; g.beginPath(); g.moveTo(0,0); for(let i=0;i<=8;i++) g.lineTo(W*i/8,i%2?H*0.14:0); g.lineTo(W,0); g.closePath(); g.fill(); g.restore(); g.strokeStyle=GOLD; g.lineWidth=Math.max(2,W*0.02); g.strokeRect(1,H*0.12,W-2,H*0.87); };
  const N=netzKugel(k,{netz:'#d9b45a',tag,tw,th,schnur:GOLD,fransen:0.3});
  vring(k,0.01,0.003,5,12,2*PI,0,N.hals,0,GOLD,PI/2,0,0); vring(k,0.016,0.0025,4,12,2*PI,0,N.hals+0.012,0,GOLD,0,0,0); return fertig(k); };
/* Sternensturm: schwarzes Netz mit Tragegurt und Schnalle */
V.sternensturm300=t=>{ const k=neu(t), N=netzKugel(k,{netz:'#1a1a22',hals:k.h*0.8,rf:0.82});
  const gw=0.03, top=k.h-0.006; kordel(k,[[-N.R*0.35,N.cy+N.Rn*0.8,0],[-N.R*0.28,top,0],[N.R*0.28,top,0],[N.R*0.35,N.cy+N.Rn*0.8,0]],'#ffd23f',0.008);
  vbox(k,gw*1.4,0.02,0.012,0,top-0.004,0,'#2a2a2a'); vzyl(k,0.012,0.012,0.018,10,0,N.hals,0,'#2a2a2a'); return fertig(k); };
/* Suedsee 75: Bastnetz mit Knoten, Palmblatt-Anhaenger */
V.palmenkugel75=t=>{ const k=neu(t), tw=k.w*0.62, th=k.h*0.42;
  const tag=(g,W,H)=>{ g.fillStyle='#2f9e57'; g.fillRect(0,0,W,H); g.save(); g.beginPath(); g.ellipse(W/2,H/2,W*0.5,H*0.5,0,0,2*PI); g.clip(); drawFront(g,W,H,k.a,k.cat); g.restore();
    g.save(); g.globalCompositeOperation='destination-out'; g.beginPath(); g.rect(0,0,W,H); g.ellipse(W/2,H/2,W*0.5,H*0.5,0,0,2*PI,true); g.fill(); g.restore(); };
  const N=netzKugel(k,{netz:'#d8c088',tag,tw,th,ty:k.h*0.44,schnur:'#c8a868',fransen:0.35});
  vkugel(k,0.006,8,6,0,N.hals,0,'#c8a868',1,0.8,1); return fertig(k); };
/* Herzschlag 75: Blisterkarte in Herzform mit Euroloch, Kugel unten in
   der Klarsichtkuppel, Name oben in den Herzboegen */
V.kugel75=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, a=k.a; k.alpha=true;
  const karte=reg(k,'herz',w,h,(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,hell(a.bg1,0.15)); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H);
    effektFoto(g,0,H*0.04,W,H*0.36,t,a,zufallAus(5),{stadt:false,einzeln:true});
    nameText(g,a.title,W/2,H*0.44,W*0.84,Math.round(H*0.1),FNT.bun,'#ffffff',a.ac,Math.max(2,H*0.014));
    nameText(g,'KUGELBOMBE 75 mm',W/2,H*0.52,W*0.56,Math.round(H*0.045),FNT.bar,a.ac2);
    siegel(g,W*0.5,H*0.9,H*0.04,'F2','#fff','#1b1b1b');
    g.save(); g.globalCompositeOperation='destination-in'; g.beginPath(); const cx=W/2;
    g.moveTo(cx,H*0.995); g.bezierCurveTo(-W*0.32,H*0.62,W*0.0,H*0.0,cx,H*0.2); g.bezierCurveTo(W*1.0,H*0.0,W*1.32,H*0.62,cx,H*0.995); g.closePath(); g.fill(); g.restore();
    g.save(); g.globalCompositeOperation='destination-out'; g.beginPath(); g.ellipse(cx,H*0.27,W*0.05,H*0.022,0,0,2*PI); g.fill(); g.restore(); });
  const kz=-d/2+0.004; kasten(k,w,h,0.0016,tm(0,h/2,kz),{pz:karte,nz:karte,rest:leer(k)});
  const R=w*0.22, cy=h*0.27, cz=kz+R*1.25; kugel(k,R,0,cy,cz,{zuender:false,seg:14});
  vzyl(k,R*0.14,R*0.17,R*0.2,8,0,cy+R*1.05,cz,'#d9cbb0');
  klar(k,new THREE.SphereGeometry(R*1.3,16,10),tm(0,cy,cz-R*0.1,0,0,0,1,1,0.92));
  return fertig(k); };
/* Chamaeleon 75: Kapsel - unten farbige Halbschale, oben klar - auf
   bedrucktem Sockel */
V.farbenmeer75=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, sh=h*0.3, R=Math.min(w,d)/2-0.003, cy=sh+R;
  kasten(k,w,sh,d,tm(0,sh/2,0),{pz:reg(k,'sockel',w,sh,pBild(k,w,sh)),nz:'sockel',px:'sockel',nx:'sockel',py:farbe(k,k.a.bg2),ny:farbe(k,'#2a2018')});
  const ys=(h-sh)/(2*R);
  k.vc.push({geo:new THREE.SphereGeometry(R,18,8,0,2*PI,PI/2,PI/2),m:tm(0,sh+R*ys,0,0,0,0,1,ys,1),color:num(k.a.ac)});
  klar(k,new THREE.SphereGeometry(R,18,8,0,2*PI,0,PI/2),tm(0,sh+R*ys,0,0,0,0,1,ys,1));
  vring(k,R*1.0,0.0025,4,20,2*PI,0,sh+R*ys,0,'#ff4fa3',PI/2,0,0);
  kugel(k,R*0.74,0,sh+R*ys,0,{zuender:false,seg:12});
  return fertig(k); };
/* Drachenblut 100: Klappschachtel mit Drachenauge-Fenster */
V.kugel100=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, a=k.a; k.alpha=true;
  const auge={form:'auge',x:0.12,y:0.12,w:0.76,h:0.3};
  const vorn=reg(k,'vorn',w,h,pLoch((g,W,H)=>{ drawFront(g,W,H,a,k.cat); g.save(); pfad(g,{form:'auge',x:0.06,y:0.06,w:0.88,h:0.42},W,H); g.fillStyle='#ff6a2a'; g.fill(); pfad(g,{form:'auge',x:0.09,y:0.09,w:0.82,h:0.36},W,H); g.fillStyle='#5a0f10'; g.fill(); g.restore(); },[auge],'#ffd23f'));
  kasten(k,w,h,d,tm(0,h/2,0),{pz:vorn,nz:reg(k,'hinten',w,h,pEtikett(k)),px:reg(k,'seite',d,h,pSeite(k)),nx:'seite',py:reg(k,'top',w,d,pTop(k)),ny:farbe(k,'#2a2018')});
  kasten(k,w-0.004,h-0.004,0.002,tm(0,h/2,-d/2+0.003),{rest:farbe(k,'#1a0304')});
  kugel(k,Math.min(w,d)*0.38,0,h*0.6,-d*0.04,{zuender:false});
  klar(k,new THREE.PlaneGeometry(w*0.76,h*0.3),tm(0,h*0.73,d/2-0.0015));
  vbox(k,w*0.4,0.004,0.002,0,h-0.002,d/2+0.001,'#ffd23f');
  return fertig(k); };
/* Haengeweide 100 (Aurum): Koecher aus Kraftpappe, schwarz-goldene
   Banderole, Kunststoffkappen, Aufhaengekordel */
V.goldweide100=t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.003, h=k.h, kh=0.016;
  mantel(k,R,h-2*kh,kh,'koker',pKraft({farbe:'#a87a48'}));
  mantel(k,R+0.001,(h-2*kh)*0.72,kh+(h-2*kh)*0.14,'band',pRund(k,pFront(k),0.32));
  vzyl(k,R+0.002,R+0.002,kh,20,0,kh/2,0,'#141414'); vzyl(k,R+0.002,R+0.002,kh,20,0,h-kh/2,0,'#141414');
  druck(k,new THREE.CircleGeometry(R+0.0015,20),tm(0,h+0.0006,0,-PI/2,0,0),reg(k,'koecherdeckel',0.1,0.1,(g,W,H)=>{ g.fillStyle='#141414'; g.fillRect(0,0,W,H); g.strokeStyle=GOLD; g.lineWidth=W*0.02; g.beginPath(); g.arc(W/2,H/2,W*0.44,0,2*PI); g.stroke(); g.beginPath(); g.arc(W/2,H/2,W*0.38,0,2*PI); g.stroke();
    g.strokeStyle='rgba(217,180,90,.85)'; g.lineWidth=W*0.012; for(let i=0;i<9;i++){ const an=-PI/2+(i-4)*0.3; g.beginPath(); g.moveTo(W/2,H*0.3); g.quadraticCurveTo(W/2+Math.cos(an)*W*0.22,H*0.3+Math.sin(an)*W*0.1,W/2+Math.cos(an)*W*0.26,H*0.62); g.stroke(); }
    nameText(g,k.a.title,W/2,H*0.74,W*0.6,Math.round(H*0.09),FNT.cin,GOLD); }));
  return fertig(k); };
/* Eiskristall 100 (Aurum): Klarsichtschachtel auf schwarzem Sockel mit
   goldenem Etikett, Schneeflocken-Aufdruck auf der Scheibe */
V.kristallkugel100=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, sh=h*0.26, dh=0.012, a=k.a;
  kasten(k,w,sh,d,tm(0,sh/2,0),{pz:reg(k,'sockel',w,sh,pEtikett(k,{bg1:'#0b0a09',bg2:'#1a1814',fg:GOLD,font:FNT.cin,rand:GOLD,sub:'Blinkkern · 100 mm'})),nz:'sockel',px:'sockel',nx:'sockel',py:farbe(k,'#0b0a09'),ny:farbe(k,'#0b0a09')});
  kasten(k,w,dh,d,tm(0,h-dh/2,0),{rest:farbe(k,'#0b0a09'),py:reg(k,'deckel',w,d,(g,W,H)=>{ g.fillStyle='#0b0a09'; g.fillRect(0,0,W,H); g.strokeStyle=GOLD; g.lineWidth=2; g.strokeRect(W*0.08,H*0.08,W*0.84,H*0.84); nameText(g,a.title,W/2,H/2,W*0.8,Math.round(H*0.18),FNT.cin,GOLD); })});
  const R=Math.min(w,d)*0.38; vring(k,R*0.6,R*0.12,6,16,2*PI,0,sh+R*0.1,0,'#c9ced6',PI/2,0,0); kugel(k,R,0,sh+R*0.86,0,{});
  k.alpha=true; druck(k,new THREE.PlaneGeometry(w*0.36,w*0.36),tm(w*0.24,h*0.78,d/2+0.0008),reg(k,'flocke',0.04,0.04,(g,W,H)=>{ g.clearRect(0,0,W,H); g.strokeStyle='rgba(240,248,255,.95)'; g.lineWidth=Math.max(1.5,W*0.05); g.lineCap='round'; g.translate(W/2,H/2);
    for(let i=0;i<6;i++){ g.rotate(PI/3); g.beginPath(); g.moveTo(0,0); g.lineTo(0,-W*0.42); g.moveTo(0,-W*0.25); g.lineTo(-W*0.1,-W*0.34); g.moveTo(0,-W*0.25); g.lineTo(W*0.1,-W*0.34); g.stroke(); } }));
  klar(k,new THREE.BoxGeometry(w,h-sh-dh,d),tm(0,sh+(h-sh-dh)/2,0));
  for(const sx of [-1,1]) for(const sz of [-1,1]) vbox(k,0.003,h-sh-dh,0.003,sx*(w/2-0.0015),sh+(h-sh-dh)/2,sz*(d/2-0.0015),'#dfe8f0');
  return fertig(k); };
/* Weltenbrand 150: Schaumstoff-Tray unter Klarsichthaube, bedruckte
   Manschette vorn */
V.kugel150=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, tb=h*0.46, R=Math.min(w,d)*0.38, cy=tb+R*0.35;
  kasten(k,w,tb,d,tm(0,tb/2,0),{pz:reg(k,'front',w,tb,pFront(k)),nz:'front',px:reg(k,'seite',d,tb,pSeite(k)),nx:'seite',py:reg(k,'schaum',w,d,(g,W,H)=>{ pSchaum('#2e2e33')(g,W,H); const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.42); gr.addColorStop(0,'#0a0a0c'); gr.addColorStop(0.85,'#1a1a1e'); gr.addColorStop(1,'#3a3a40'); g.fillStyle=gr; g.beginPath(); g.arc(W/2,H/2,W*0.42,0,2*PI); g.fill(); }),ny:farbe(k,'#2a2018')});
  kugel(k,R,0,cy,0,{zuender:false});
  klar(k,new THREE.BoxGeometry(w-0.002,h-tb,d-0.002),tm(0,tb+(h-tb)/2,0)); vbox(k,w,0.004,d,0,tb+0.002,0,'#3a3a40');
  for(const sx of [-1,1]) for(const sz of [-1,1]) vbox(k,0.003,h-tb,0.003,sx*(w/2-0.0015),tb+(h-tb)/2,sz*(d/2-0.0015),'#e4ecf2'); for(const sz of [-1,1]) vbox(k,w,0.003,0.003,0,h-0.0015,sz*(d/2-0.0015),'#e4ecf2'); for(const sx of [-1,1]) vbox(k,0.003,0.003,d,sx*(w/2-0.0015),h-0.0015,0,'#e4ecf2');
  return fertig(k); };
/* Sternenstaub 150: Hutschachtel mit Stuelpdeckel, Band und Schleife */
V.sternenstaub150=t=>{ const k=neu(t), Rl=Math.min(k.w,k.d)/2-0.002, R=Rl-0.004, sh=0.03, H=k.h-sh, dh=H*0.22, a=k.a;
  mantel(k,R,H-dh+0.003,0,'mantel',pRund(k,pFront(k),0.3));
  const sterne=(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H); const Rn=zufallAus(7); for(let i=0;i<W*H/120;i++){ g.fillStyle=Rn()<0.3?a.ac2:'#f2f5ff'; stern(g,Rn()*W,Rn()*H,1.5+Rn()*3,5,0.45); g.fill(); } };
  mantel(k,Rl,dh,H-dh,'deckel',sterne);
  druck(k,new THREE.CircleGeometry(Rl,24),tm(0,H,0,-PI/2,0,0),reg(k,'deckelT',0.2,0.2,sterne));
  vzyl(k,R,R,0.003,24,0,0.0015,0,'#1a1a2a');
  const band='#f2f5ff'; k.vc.push({geo:new THREE.CylinderGeometry(Rl+0.0012,Rl+0.0012,0.012,24,1,true),m:tm(0,H-dh/2,0),color:num(band)});
  schleife(k,0,H+0.003,0,0.07,band);
  return fertig(k); };
/* Sternkranz 150 (Nordlicht): Sternschachtel aus Kraftkarton, rundes
   Druckbild vorn */
V.sternkugel150=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, a=k.a, cx=0, Ro=Math.min(w/2/Math.cos(PI/10)*0.99,h/1.81), Ri=Ro*0.5, cy=Ro*Math.sin(PI*0.3)+0.001;
  const sh=new THREE.Shape(); for(let i=0;i<10;i++){ const an=PI/2+i*PI/5, r=i%2?Ri:Ro; const x=cx+Math.cos(an)*r, y=Math.sin(an)*r; if(i) sh.lineTo(x,y); else sh.moveTo(x,y); } sh.closePath();
  const geo=new THREE.ExtrudeGeometry(sh,{depth:d*0.86,bevelEnabled:false,curveSegments:1}); geo.translate(0,0,-d*0.43);
  const kr=reg(k,'kraft',0.3,0.3,pKraft({farbe:'#c49a62',fn:(g,W,H)=>{ g.strokeStyle='rgba(60,40,20,.25)'; g.lineWidth=W*0.01; g.strokeRect(W*0.04,H*0.04,W*0.92,H*0.92);
    /* 03.10.: Stempeldruck statt leerer Kraftflaechen - Sterne und Name */
    const Rn=zufallAus(31); g.fillStyle='rgba(43,29,16,.55)'; for(let i=0;i<9;i++){ stern(g,W*(0.1+Rn()*0.8),H*(0.1+Rn()*0.8),W*(0.02+Rn()*0.025),5,0.45); g.fill(); }
    g.fillStyle='rgba(150,30,20,.7)'; stern(g,W*0.5,H*0.32,W*0.12,5,0.45); g.fill();
    g.strokeStyle='rgba(43,29,16,.5)'; g.lineWidth=W*0.012; g.beginPath(); g.arc(W*0.5,H*0.32,W*0.17,0,2*PI); g.stroke(); }})), fr=reg(k,'stern',0.2,0.2,(g,W,H)=>{ pKraft({farbe:'#c9a676'})(g,W,H);
    const r=W*0.19, cy=H*0.42; effektFoto(g,W/2-r,cy-r,r*2,r*2,k.t,a,zufallAus(3),{rund:true,einzeln:true,stadt:false}); g.strokeStyle='#2b1d10'; g.lineWidth=W*0.012; g.beginPath(); g.arc(W/2,cy,r,0,2*PI); g.stroke();
    nameText(g,a.title,W/2,H*0.66,W*0.58,Math.round(H*0.08),FNT.bar,'#2b1d10'); nameText(g,'KUGELBOMBE 150 mm · NORDLICHT',W/2,H*0.73,W*0.4,Math.round(H*0.03),FNT.bar,'#5a4428'); });
  k.druck.push({geo,m:tm(0,cy,0),fn:S=>{ const p=geo.attributes.position, n=geo.attributes.normal, uv=geo.attributes.uv, A=S[fr], B=S[kr];
    for(let i=0;i<p.count;i++){ if(Math.abs(n.getZ(i))>0.9){ const u=(p.getX(i)+Ro)/(2*Ro), v=(p.getY(i)+Ro)/(2*Ro); uv.setXY(i,A[0]+u*(A[2]-A[0]),A[1]+v*(A[3]-A[1])); } else { const u=(uv.getX(i)*7.3)%1, v=(p.getZ(i)+d*0.43)/(d*0.86); uv.setXY(i,B[0]+Math.abs(u)*(B[2]-B[0]),B[1]+v*(B[3]-B[1])); } } }});
  return fertig(k); };
/* Farbcrossette 150: Moerser-Set - Karton, aus dem das schwarze
   Abschussrohr mit roter Kappe ragt */
V.farbcrossette150=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, hb=h*0.66, Rr=Math.min(w,d)/2-0.012;
  kasten(k,w,hb,d,tm(0,hb/2,0),{pz:reg(k,'front',w,hb,pFront(k)),nz:'front',px:reg(k,'seite',d,hb,pSeite(k)),nx:'seite',py:reg(k,'top',w,d,(g,W,H)=>{ drawTop(g,W,H,k.a,k.cat); g.fillStyle='#0a0a0a'; g.beginPath(); g.arc(W/2,H/2,W*0.42,0,2*PI); g.fill(); }),ny:farbe(k,'#2a2018')});
  /* 03.10.: Moerserrohr mit Warnetikett, Kappe mit Druck (vorher nackt schwarz/rot) */
  const rh=h-hb-0.012;
  mantel(k,Rr,rh,hb,'moerser',(g,W,H)=>{ g.fillStyle='#1c1c20'; g.fillRect(0,0,W,H); g.fillStyle='rgba(255,255,255,.05)'; for(let y=0;y<H;y+=3) g.fillRect(0,y,W,1);
    for(const cx of [W*0.25,W*0.75]){ const ew=W*0.3; g.fillStyle='#ffd23f'; g.fillRect(cx-ew/2,H*0.1,ew,H*0.8); g.fillStyle='#1c1c20'; g.fillRect(cx-ew/2,H*0.1,ew,H*0.16);
      nameText(g,'MÖRSER',cx,H*0.18,ew*0.9,Math.round(H*0.12),FNT.bar,'#ffd23f'); nameText(g,'150 mm',cx,H*0.42,ew*0.9,Math.round(H*0.2),FNT.bar,'#1c1c20');
      nameText(g,'ABSCHUSSROHR',cx,H*0.62,ew*0.86,Math.round(H*0.1),FNT.bar,'#1c1c20'); for(let q=0;q<3;q++){ g.fillStyle='#1c1c20'; g.fillRect(cx-ew*0.4,H*(0.76+q*0.04),ew*0.8,Math.max(1,H*0.015)); } } },{seg:22});
  vzyl(k,Rr+0.003,Rr+0.003,0.014,22,0,h-0.007,0,'#d8322a');
  druck(k,new THREE.CircleGeometry(Rr+0.0025,22),tm(0,h-0.0002,0,-PI/2,0,0),reg(k,'kappe',0.1,0.1,(g,W,H)=>{ g.fillStyle='#d8322a'; g.fillRect(0,0,W,H); g.strokeStyle='#a81e1a'; g.lineWidth=W*0.03; for(const r of [0.46,0.3]){ g.beginPath(); g.arc(W/2,H/2,W*r,0,2*PI); g.stroke(); }
    nameText(g,'150',W/2,H*0.46,W*0.5,Math.round(H*0.22),FNT.bun,'#fff'); nameText(g,'KALIBER mm',W/2,H*0.66,W*0.5,Math.round(H*0.08),FNT.bar,'#fff'); }));
  vbox(k,0.05,0.02,0.002,0,hb+0.03,Rr+0.0005,'#ffd23f');
  return fertig(k); };
/* Feuerlilie 200: rot lackierte Blechdose mit Rollraendern und
   gepraegtem Deckel */
V.feuerlilie200=t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.004, h=k.h, dh=0.03, H=h-dh;
  mantel(k,R,H-0.006,0.003,'mantel',pRund(k,pFront(k),0.3),{seg:28});
  vring(k,R,0.003,5,28,2*PI,0,0.003,0,'#8a1010',PI/2,0,0); vring(k,R,0.003,5,28,2*PI,0,H-0.003,0,'#8a1010',PI/2,0,0);
  vzyl(k,R+0.003,R+0.003,dh,28,0,H+dh/2,0,'#c81818');
  druck(k,new THREE.CircleGeometry(R*0.78,28),tm(0,h+0.0006,0,-PI/2,0,0),reg(k,'liliendeckel',0.15,0.15,(g,W,H)=>{ const gr=g.createRadialGradient(W*0.4,H*0.4,0,W/2,H/2,W*0.6); gr.addColorStop(0,'#f6d77a'); gr.addColorStop(1,'#b8892f'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='#c81818'; for(let i=0;i<6;i++){ g.save(); g.translate(W/2,H*0.46); g.rotate(i*PI/3); g.beginPath(); g.ellipse(0,-H*0.15,W*0.06,H*0.15,0,0,2*PI); g.fill(); g.restore(); }
    g.fillStyle='#ffd23f'; g.beginPath(); g.arc(W/2,H*0.46,W*0.05,0,2*PI); g.fill(); nameText(g,k.a.title,W/2,H*0.8,W*0.6,Math.round(H*0.1),FNT.cin,'#5a0808'); })); vring(k,R*0.86,0.002,4,24,2*PI,0,h,0,'#e8c35a',PI/2,0,0);
  vzyl(k,R,R,0.003,24,0,0.0015,0,'#5a0808');
  return fertig(k); };
/* Leuchtqualle 200 (Aurum): Glaskugel auf schwarz-goldenem Sockel */
V.goldkrone200=t=>{ const k=neu(t), Rs=Math.min(k.w,k.d)/2-0.004, sh=k.h*0.24, Rg=Math.min(Rs,(k.h-sh)/2+0.012), cy=k.h-Rg; k.klarMat=glassMat;
  mantel(k,Rs,sh,0,'sockel',pZweimal(pEtikett(k,{bg1:'#0b0a09',bg2:'#1a1814',fg:GOLD,font:FNT.cin,rand:GOLD,sub:'Brokatqualle · 200 mm'})),{r2:Rs*0.88});
  druck(k,new THREE.CircleGeometry(Rs*0.88,24),tm(0,sh,0,-PI/2,0,0),farbe(k,'#0b0a09'));
  vring(k,Rg*0.55,0.006,6,20,2*PI,0,sh+0.004,0,GOLD,PI/2,0,0);
  const R=Rg*0.8; kugel(k,R,0,cy-0.004,0,{});
  for(let i=0;i<8;i++){ const an=i*PI/4; kordel(k,[[Math.cos(an)*R*0.5,cy-R*0.8,Math.sin(an)*R*0.5],[Math.cos(an)*R*0.62,sh+0.03,Math.sin(an)*R*0.62]],'#ffd23f',0.0012); }
  klar(k,new THREE.SphereGeometry(Rg,22,14),tm(0,cy,0));
  return fertig(k); };
/* Kronenkranz 200 (Aurum): oben offene Kronenschachtel mit
   Zackenrand, innen roter Samt, die Kugel schaut heraus */
V.kronenkranz200=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, hb=h*0.82, a=k.a; k.alpha=true; k.doppel=true;
  const zack=(m)=>(g,W,H)=>{ m(g,W,H); g.save(); g.globalCompositeOperation='destination-out'; g.beginPath(); g.moveTo(0,0); const n=5; for(let i=0;i<=2*n;i++) g.lineTo(W*i/(2*n),i%2?H*0.2:0); g.lineTo(W,0); g.closePath(); g.fill(); g.restore();
    g.fillStyle=GOLD; for(let i=0;i<=n;i++){ g.beginPath(); g.arc(W*i/n,H*0.012,Math.max(2,W*0.025),0,2*PI); g.fill(); } };
  const zf=(g,W,H)=>{ g.save(); g.translate(0,H*0.18); drawFront(g,W,H*0.82,a,k.cat); g.restore(); g.fillStyle='#0b0a09'; g.fillRect(0,0,W,H*0.18); };
  kasten(k,w,hb,d,tm(0,hb/2,0),{pz:reg(k,'front',w,hb,zack(zf)),nz:reg(k,'hinten',w,hb,zack(pEtikett(k,{sub:''}))),px:reg(k,'seite',d,hb,zack(pSeite(k))),nx:'seite',py:leer(k),ny:farbe(k,'#0b0a09')});
  const samt=reg(k,'samt',0.2,0.2,pSamt('#7a0a1a'));
  kasten(k,w-0.006,hb*0.8,d-0.006,tm(0,hb*0.4,0),{rest:samt});
  const R=Math.min(w,d)*0.36; kugel(k,R,0,h-R*1.38,0,{});
  return fertig(k); };
/* Zwillingssonne 200: Pappdose, oben Klarsichtteil mit Kugel, goldener
   Deckelring */
V.zwillingssonne200=t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.003, h=k.h, hb=h*0.56;
  mantel(k,R,hb,0,'mantel',pRund(k,pFront(k),0.34));
  vzyl(k,R+0.002,R+0.002,0.008,26,0,hb,0,GOLD); k.vc.push({geo:new THREE.CylinderGeometry(R+0.002,R+0.002,0.012,26,1,true),m:tm(0,h-0.006,0),color:num(GOLD)}); k.vc.push({geo:new THREE.RingGeometry(R-0.004,R+0.002,26,1),m:tm(0,h,0,-PI/2,0,0),color:num(GOLD)});
  druck(k,new THREE.CircleGeometry(R*0.98,24),tm(0,hb-0.002,0,-PI/2,0,0),reg(k,'boden',0.1,0.1,(g,W,H)=>{ g.fillStyle='#1a1a2a'; g.fillRect(0,0,W,H); for(let i=0;i<2;i++){ g.fillStyle=i?'#ff8ac8':'#ffd23f'; g.beginPath(); g.arc(W*(0.3+i*0.4),H/2,W*0.12,0,2*PI); g.fill(); } }));
  const Rk=R*0.78; kugel(k,Rk,0,hb+Rk*0.25,0,{zuender:false}); k.klarMat=glassMat;
  klar(k,new THREE.CylinderGeometry(R,R,h-hb-0.01,26,1,true),tm(0,hb+(h-hb-0.01)/2,0)); klar(k,new THREE.CircleGeometry(R,26),tm(0,h-0.0005,0,-PI/2,0,0));
  return fertig(k); };
/* Blitzpalme 200: Obststeige mit Holzwolle, Kugel eingebettet */
V.blitzpalme200=t=>{ const k=neu(t), H=k.h*0.5;
  const K=kiste(k,{latten:true,H,holz:'#e0c08a',bretter:3,gap:0.018,deckel:false,kern:farbe(k,'#c9a46a'),bt:0.01});
  const wolle=reg(k,'wolle',0.2,0.2,(g,W,H)=>{ g.fillStyle='#d8b878'; g.fillRect(0,0,W,H); const Rn=zufallAus(4); g.lineWidth=1.2; for(let i=0;i<260;i++){ g.strokeStyle=Rn()<0.5?'#b89050':'#f0d8a0'; g.beginPath(); const x=Rn()*W, y=Rn()*H; g.moveTo(x,y); g.bezierCurveTo(x+Rn()*30-15,y+Rn()*30-15,x+Rn()*30-15,y+Rn()*30-15,x+Rn()*40-20,y+Rn()*40-20); g.stroke(); } });
  const wg=new THREE.SphereGeometry(Math.min(K.W,K.D)/2-0.01,14,6,0,2*PI,0,PI/2); druck(k,wg,tm(0,H*0.82,0,0,0,0,(K.W-0.02)/(Math.min(K.W,K.D)-0.02),0.35,(K.D-0.02)/(Math.min(K.W,K.D)-0.02)),wolle);
  const R=Math.min(K.W,K.D)*0.4; kugel(k,R,0,H*0.82+R*0.55,0,{});
  schild(k,'schild',K.W*0.84,H*0.84,0,H*0.5,K.D/2+0.0005);
  return fertig(k); };
/* Goldweidenkreuz 200 (Aurum): schwarze Schachtel, goldenes Band ueber
   Kreuz, Rosette */
V.goldweidenkreuz200=t=>{ const k=neu(t), e=0.003, rh=0.022, w=k.w-2*e, d=k.d-2*e, h=k.h-rh;
  kasten(k,w,h,d,tm(0,h/2,0),{pz:reg(k,'front',w,h,pFront(k)),nz:'front',px:reg(k,'seite',d,h,pSeite(k)),nx:'seite',py:farbe(k,'#0b0a09'),ny:farbe(k,'#0b0a09')});
  const t2=0.0015, b=0.018, bx=w/2-0.012, bz=-d*0.2; vbox(k,b,t2,d+2*t2,bx,h+t2/2,0,GOLD); vbox(k,w+2*t2,t2,b,0,h+t2/2,bz,GOLD);
  vbox(k,b,h,t2,bx,h/2,-(d/2+t2/2),GOLD); for(const s of [-1,1]) vbox(k,t2,h,b,s*(w/2+t2/2),h/2,bz,GOLD);
  for(let i=0;i<8;i++) vbox(k,0.04,0.003,0.012,bx-0.012,h+0.004+i*0.0018,bz,i%2?'#b8892f':GOLD,0,i*PI/8,0);
  vzyl(k,0.012,0.012,0.008,12,bx-0.012,h+0.018,bz,'#b8892f');
  return fertig(k); };
/* Himmelsbrecher 300 (Nordlicht): Fiberfass mit Spannring, Hebel und
   Drahtbuegel */
V.kugel300=t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.006, h=k.h, bh=0.035, H=h-bh;
  mantel(k,R,H,0,'mantel',(g,W,H2)=>{ pKraft({farbe:'#9a7448'})(g,W,H2); for(let q=0;q<2;q++){ const x=q*W/2+W*0.06, ew=W*0.38; g.save(); g.translate(x,H2*0.12); drawFront(g,ew,H2*0.76,k.a,k.cat); g.restore(); g.strokeStyle='#f2efe6'; g.lineWidth=3; g.strokeRect(x,H2*0.12,ew,H2*0.76); } },{seg:28});
  for(const y of [0.004,H*0.5,H-0.006]) vring(k,R+0.001,0.004,5,28,2*PI,0,y,0,'#7a8088',PI/2,0,0);
  vzyl(k,R+0.004,R+0.004,0.012,28,0,H-0.006,0,'#8a9098'); k.vc.push({geo:new THREE.CylinderGeometry(R,R,0.004,28,1,true),m:tm(0,H+0.002,0),color:num('#5a6068')});
  druck(k,new THREE.CircleGeometry(R*0.97,28),tm(0,H+0.0048,0,-PI/2,0,0),reg(k,'fassdeckel',0.2,0.2,(g,W,H)=>{ pKraft({farbe:'#8a6a42'})(g,W,H); g.strokeStyle='rgba(30,20,10,.5)'; g.lineWidth=W*0.012; for(const r of [0.47,0.42]){ g.beginPath(); g.arc(W/2,H/2,W*r,0,2*PI); g.stroke(); }
    schablone(g,'HIMMELS-',W/2,H*0.36,W*0.7,H*0.13,'rgba(25,18,10,.85)'); schablone(g,'BRECHER',W/2,H*0.5,W*0.7,H*0.13,'rgba(25,18,10,.85)'); schablone(g,'300 MM · 1.4G',W/2,H*0.66,W*0.6,H*0.08,'rgba(150,20,10,.85)'); }));
  vbox(k,0.06,0.012,0.006,R*0.35,H-0.006,R*0.95,'#9aa1ab',0,-0.35,0);
  vring(k,R*0.82,0.0035,5,16,PI,0,H+0.002,0,'#9aa1ab',0,0,0,1,bh/(R*0.82)*0.92,1);
  for(const s of [-1,1]) vbox(k,0.016,0.016,0.012,s*R*0.82,H+0.004,0,'#7a8088');
  return fertig(k); };
/* Kanonade 300: Munitionskiste aus Holz mit Schablonenschrift,
   Seilgriffen und Eisenbaendern */
V.kanonade300=t=>{ const k=neu(t), ex=0.026;
  const K=kiste(k,{ex,holz:'#9a7a50',bretter:3,aeste:2});
  schild(k,'schab',K.W*0.9,K.H*0.26,0,K.H*0.84,K.D/2,(g,W,H)=>{ pHolz({farbe:'#9a7a50',saat:9})(g,W,H); schablone(g,'KANONADE · 300 MM',W/2,H*0.5,W*0.92,H*0.6,'rgba(20,16,12,.88)'); },0.0008);
  schild(k,'schild',K.W*0.78,K.H*0.56,0,K.H*0.36,K.D/2);
  for(const s of [-1,1]) seilgriff(k,s,s*K.W/2,K.H*0.6,'#c8b48a',0.03);
  for(const x of [-1,1]) for(const z of [-1,1]) vbox(k,0.006,K.H,0.03,x*(K.W/2+0.002),K.H/2,z*(K.D/2-0.018),'#2a2622');
  return fertig(k); };
/* Kaiserkrone 300 (Aurum): offene Schatulle - Samtbett, Deckel hinten
   aufgeklappt mit Urkunde */
V.kaiserkrone=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, a=k.a, lt=0.02, bh=h*0.3, bd=d-lt-0.004, bz=(d-bd)/2-0.002, dh=h-bh;
  const sock=reg(k,'sockel',w,bh,pEtikett(k,{bg1:'#0b0a09',bg2:'#1a1814',fg:GOLD,font:FNT.cin,rand:GOLD,sub:'Fünfkern-Verwandlung · 300 mm'}));
  const samt=reg(k,'samt',0.25,0.25,pSamt('#6a0a18'));
  kasten(k,w,bh,bd,tm(0,bh/2,bz),{pz:sock,nz:farbe(k,'#0b0a09'),px:farbe(k,'#0b0a09'),nx:farbe(k,'#0b0a09'),py:samt,ny:farbe(k,'#0b0a09')});
  vbox(k,w+0.002,0.004,bd+0.002,0,bh-0.002,bz,GOLD);
  /* Deckel: innen Samt, darauf die Urkunde mit dem Namen */
  kasten(k,w,dh,lt,tm(0,bh+dh/2,-d/2+lt/2+0.002),{pz:samt,rest:farbe(k,'#0b0a09')});
  const uw=w*0.82, uh=dh*0.62; kasten(k,uw,uh,0.002,tm(0,bh+dh-uh/2-dh*0.06,-d/2+lt+0.003),{pz:reg(k,'urkunde',uw,uh,(g,W,H)=>{ g.fillStyle='#0b0a09'; g.fillRect(0,0,W,H); g.strokeStyle=GOLD; g.lineWidth=Math.max(2,W*0.012); g.strokeRect(W*0.04,H*0.05,W*0.92,H*0.9);
    g.fillStyle=GOLD; g.beginPath(); const cx=W/2, cy=H*0.22, s=H*0.13; g.moveTo(cx-s*1.4,cy+s*0.6); g.lineTo(cx-s*1.4,cy-s*0.4); g.lineTo(cx-s*0.7,cy+s*0.05); g.lineTo(cx,cy-s*0.7); g.lineTo(cx+s*0.7,cy+s*0.05); g.lineTo(cx+s*1.4,cy-s*0.4); g.lineTo(cx+s*1.4,cy+s*0.6); g.closePath(); g.fill();
    nameText(g,a.title,W/2,H*0.5,W*0.84,Math.round(H*0.2),FNT.cin,GOLD,'rgba(0,0,0,.5)',2); nameText(g,'AURUM · FIRST CLASS',W/2,H*0.68,W*0.7,Math.round(H*0.08),FNT.cin,'#b8892f'); nameText(g,a.sub||'',W/2,H*0.82,W*0.84,Math.round(H*0.08),FNT.bar,'#f3e6c2'); }),rest:farbe(k,'#e8d8b0')});
  for(const s of [-1,1]) vzyl(k,0.005,0.005,0.03,8,s*w*0.3,bh,-d/2+lt+0.002,GOLD,0,0,PI/2);
  const R=Math.min(w*0.3,bd*0.34); kugel(k,R,0,bh+R*0.62,bz+bd*0.08,{});
  return fertig(k); };
/* Kronenregen 300 (Aurum): Sechskantschachtel mit Golddeckel */
V.kronenregen300=t=>{ const k=neu(t), R=Math.min(k.w/2,k.d/2/Math.cos(PI/6))-0.003, h=k.h, dh=h*0.16, H=h-dh, a=k.a;
  const pan=2*R*Math.sin(PI/6);
  const mant=reg(k,'mantel',6*pan,H,(g,W,H2)=>{ const pw=W/6; for(let i=0;i<6;i++){ g.save(); g.translate(i*pw,0); g.beginPath(); g.rect(0,0,pw,H2); g.clip();
    if(i===1) drawFront(g,pw,H2,a,k.cat); else { g.fillStyle='#0b0a09'; g.fillRect(0,0,pw,H2); g.strokeStyle=GOLD; g.lineWidth=2; g.strokeRect(pw*0.08,H2*0.04,pw*0.84,H2*0.92); g.save(); g.translate(pw/2,H2/2); g.rotate(-PI/2); nameText(g,a.title,0,0,H2*0.8,Math.round(pw*0.3),FNT.cin,GOLD); g.restore(); }
    g.restore(); } });
  druck(k,new THREE.CylinderGeometry(R,R,H,6,1,true,-PI/2),tm(0,H/2,0),mant);
  vzyl(k,R+0.003,R+0.003,dh-0.003,6,0,H+(dh-0.003)/2,0,'#0b0a09',0,PI/6,0); vzyl(k,R+0.004,R+0.004,0.006,6,0,H+0.003,0,GOLD,0,PI/6,0); vzyl(k,R*0.8,R*0.8,0.003,6,0,h-0.0015,0,GOLD,0,PI/6,0); vzyl(k,R*0.7,R*0.7,0.002,6,0,h-0.0008,0,'#0b0a09',0,PI/6,0); vzyl(k,0.03,0.03,0.0012,16,0,h-0.0003,0,GOLD);
  return fertig(k); };
/* Dreifachkrone 300 (Aurum): schwarz-goldene Geschenktragetasche mit
   Kordelgriffen, oben goldenes Seidenpapier */
V.dreifachkrone300=t=>{ const k=neu(t), w=k.w-0.004, d=k.d*0.66, gh=0.075, h=k.h-gh, a=k.a;
  kasten(k,w,h,d,tm(0,h/2,0),{pz:reg(k,'front',w,h,pFront(k)),nz:reg(k,'hinten',w,h,pEtikett(k,{bg1:'#0b0a09',bg2:'#1a1814',fg:GOLD,font:FNT.cin,rand:GOLD})),px:reg(k,'seite',d,h,(g,W,H)=>{ g.fillStyle='#0b0a09'; g.fillRect(0,0,W,H); g.strokeStyle='rgba(217,180,90,.5)'; g.lineWidth=2; g.beginPath(); g.moveTo(W/2,0); g.lineTo(W/2,H*0.8); g.lineTo(0,H); g.moveTo(W/2,H*0.8); g.lineTo(W,H); g.stroke(); }),nx:'seite',py:farbe(k,'#e8c35a'),ny:farbe(k,'#0b0a09')});
  for(let i=0;i<7;i++){ const x=-w*0.36+i*w*0.12; vbox(k,0.06,0.05,0.004,x,h+0.012,(i%2-0.5)*d*0.3,i%2?'#f3d98b':'#d9b45a',0.4*(i%3-1),i*0.7,0.3*(i%2?1:-1)); }
  for(const s of [-1,1]) kordel(k,[[-w*0.18,h-0.01,s*(d/2+0.002)],[-w*0.14,k.h-0.008,s*(d/2+0.002)],[w*0.14,k.h-0.008,s*(d/2+0.002)],[w*0.18,h-0.01,s*(d/2+0.002)]],GOLD,0.0035);
  return fertig(k); };
/* Crossettenweide 300 (03.10.: hatte keine eigene Verpackung - weisse
   Standard-Dose mit nacktem Deckel): Samtbeutel mit Zugkordel, wie ein
   Geschenk. Dunkelvioletter Samt mit goldenem Crossetten-Druck, vorn der
   Name in Gold, oben gerafft mit Kordel und Quasten, Anhaenger vorn. */
V.crossettenweide300=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, a=k.a, R=Math.min(w,d)/2*0.97;
  const prof=[[R*0.82,0.002],[R*0.97,h*0.08],[R,h*0.32],[R*0.86,h*0.6],[R*0.4,h*0.76],[R*0.32,h*0.82],[R*0.5,h*0.94],[0.001,h*0.99]].map(p=>new THREE.Vector2(p[0],p[1]));
  const geo=new THREE.LatheGeometry(prof,14,-PI);
  const samt=(g,W,H)=>{ const gr=g.createLinearGradient(0,0,W,0); for(let q=0;q<=8;q++) gr.addColorStop(q/8,q%2?'#2a0d3a':'#3d1652'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    const Rn=zufallAus(hashStr(k.t+'samt')); for(let i=0;i<W*H/12;i++){ g.fillStyle=Rn()<0.5?'rgba(0,0,0,.12)':'rgba(255,255,255,.04)'; g.fillRect(Rn()*W,Rn()*H,1,1); }
    /* goldene Sternbluetenmuster (kleine Funkenkraenze mit Punkten), verstreut */
    g.strokeStyle='rgba(217,180,90,.7)'; g.fillStyle='rgba(240,214,140,.85)'; g.lineWidth=Math.max(1,W*0.002);
    for(let i=0;i<30;i++){ const x=Rn()*W, y=H*0.12+Rn()*H*0.62, r=W*(0.008+Rn()*0.008); if(Math.abs(x-W/2)<W*0.16&&y>H*0.24&&y<H*0.64) continue;
      for(let q=0;q<10;q++){ const an=q*PI/5; g.beginPath(); g.moveTo(x+Math.cos(an)*r*0.3,y+Math.sin(an)*r*0.3); g.lineTo(x+Math.cos(an)*r,y+Math.sin(an)*r); g.stroke(); g.beginPath(); g.arc(x+Math.cos(an)*r*1.2,y+Math.sin(an)*r*1.2,Math.max(0.8,r*0.12),0,2*PI); g.fill(); } }
    /* Name vorn (u 0,5 = vorn), in Gold mit Rahmen */
    const cx=W/2, bw=W*0.28; g.strokeStyle=GOLD; g.lineWidth=Math.max(1.5,W*0.003); g.strokeRect(cx-bw/2,H*0.26,bw,H*0.36);
    g.save(); g.beginPath(); g.arc(cx,H*0.36,bw*0.2,0,2*PI); g.clip(); effektFoto(g,cx-bw*0.2,H*0.36-bw*0.2,bw*0.4,bw*0.4,k.t,a,zufallAus(5),{rund:true,einzeln:true,stadt:false}); g.restore();
    g.strokeStyle=GOLD; g.beginPath(); g.arc(cx,H*0.36,bw*0.2,0,2*PI); g.stroke();
    nameText(g,a.title,cx,H*0.5,bw*0.92,Math.round(H*0.055),FNT.cin,GOLD); nameText(g,'KUGELBOMBE 300 mm',cx,H*0.56,bw*0.8,Math.round(H*0.028),FNT.cin,'#e8d8a8');
    /* Rueckseite: Warnfeld */ g.fillStyle='rgba(240,232,210,.9)'; g.fillRect(W*0.02,H*0.3,W*0.1,H*0.25); g.fillRect(W*0.88,H*0.3,W*0.1,H*0.25);
    g.fillStyle=GOLD; g.fillRect(0,H*0.18,W,H*0.008); g.fillRect(0,H*0.7,W,H*0.008); };
  druck(k,geo,tm(0,0,0),reg(k,'beutel',2*PI*R,h*1.1,samt));
  k.rauh=0.85;
  /* Zugkordel um den Hals, zwei Enden mit Quasten */
  const yk=h*0.79; vring(k,R*0.36,0.0045,3,10,2*PI,0,yk,0,GOLD,PI/2,0,0);
  for(const s of [-1,1]){ kordel(k,[[s*R*0.1,yk,R*0.3],[s*R*0.22,yk-h*0.08,R*0.48],[s*R*0.3,yk-h*0.18,R*0.62]],GOLD,0.0025);
    k.vc.push({geo:new THREE.ConeGeometry(0.009,0.03,5,1,true),m:tm(s*R*0.3,yk-h*0.18-0.015,R*0.62),color:num(GOLD)}); }
  /* Anhaenger an der Kordel */
  const aw=0.07, ah=0.05; kasten(k,aw,ah,0.0015,tm(-R*0.32,yk-h*0.24,R*0.66,0.15,0,0.12),{pz:reg(k,'tag',aw,ah,(g,W,H)=>{ g.fillStyle='#0b0a09'; g.fillRect(0,0,W,H); g.strokeStyle=GOLD; g.lineWidth=Math.max(1,W*0.03); g.strokeRect(W*0.06,H*0.08,W*0.88,H*0.84);
    nameText(g,'AURUM',W/2,H*0.32,W*0.7,Math.round(H*0.18),FNT.cin,GOLD); nameText(g,'Meisterstück',W/2,H*0.62,W*0.7,Math.round(H*0.15),FNT.cin,'#e8d8a8'); }),rest:farbe(k,GOLD)});
  return fertig(k); };

/* ---------------- 03.10. abends: neue Lichter-Batterien (14q) und die
   Batterien, die vorher Kerzen waren (Feuerperlen, Lichterkette,
   Zwillinge) - je ein eigener Block mit eigenem Zubehoer ---------------- */
/* 04.10. (Kontaktbogen): Gurte und Banderolen lagen auf dem bedruckten
   Vorderbild - "SMARAGDF|CHER" vom Mittelgurt zerschnitten, die
   Polarnacht-Banderole verdeckte Name und Schusszahl, beim Farbtiger
   schnitt der Gurt das Etikett. Jetzt: ein Mittelgurt ueber bedruckter
   Front laeuft quer (Seite-oben-Seite), Seitengurte sitzen an den
   Kanten ausserhalb von Druckbild und Etikett, eine Banderole liegt bei
   bedruckter Front oben ueber der Warnleiste. */
const nbForm=o=>t=>{ const k=neu(t), B=block(k,Object.assign({},o.block||{})), druckVorn=!(o.block&&o.block.huelle==='roh');
  if(o.ecken) ecken(k,B.w,B.h,B.d,o.ecken,o.eb||0.014);
  (o.gurtZ||[]).forEach(s=>{ const gb=o.gb||0.02;
    if(druckVorn&&!s) gurtX(k,0,B.w,B.h,o.gc,gb);
    else gurtZ(k,Math.sign(s||1)*(B.w/2-gb/2-0.004),B.h,B.d,o.gc,gb,druckVorn?null:(o.schnalle||null)); });
  if(o.gurtX) gurtX(k,o.gurtX*B.d,B.w,B.h,o.gc,o.gb||0.018);
  if(o.band){ const b=druckVorn&&o.band[1]>0.3?[0.84,0.97]:o.band; banderole(k,B,B.h*b[0],B.h*b[1],{farbe:o.bf,akzent:o.ba}); }
  if(o.lasche) lascheSeite(k,B,0.045,o.lasche);
  if(o.block&&o.block.folie) folie(k);
  return fertig(k); };
Object.assign(V,{
  lb_gluehwuermchen:nbForm({block:{folie:true,deckel:{kappe:(i,j)=>(i+j)%2?'#c8ff5a':'#ffe08a'}},ecken:'#e8f0d8',lasche:'#5cff8a'}),
  lb_sternschnuppen:nbForm({block:{huelle:'roh',rohr:'#1e2a4a',rohrO:{kopf:'#e8f0ff'},etikett:[0.1,0.16,0.8,0.62],deckel:{kappe:'#e8f0ff',wand:'#3a4a6a'}},band:[0.82,0.96],bf:'#0c1a3a',ba:'#e8f0ff'}),
  lb_kirschbluete:nbForm({block:{folie:true,deckel:{kappe:(i,j)=>['#ffb8d8','#fff0f4'][(i*2+j)%2]}},gurtX:0,gc:'#ff7ab8',gb:0.016}),
  lb_jadeader:nbForm({block:{huelle:'roh',rohr:'#0e3a1e',rohrO:{kopf:'#5cff8a'},etikett:[0.12,0.14,0.76,0.66],deckel:{kappe:'#5cff8a',wand:'#2a5a3a'}},ecken:'#d9b45a',lasche:'#ffd23f'}),
  lb_eisvogel:nbForm({block:{folie:true,deckel:{kappe:(i,j)=>(i+j)%2?'#5ce1ff':'#3a6aff'}},gurtZ:[-1,1],gc:'#5ce1ff',gb:0.016}),
  lb_glutpalmen:nbForm({block:{huelle:'roh',rohr:'#3a1a0a',rohrO:{kopf:'#ff8a2a'},etikett:[0.18,0.12,0.64,0.7],deckel:{kappe:'#ff8a2a',wand:'#5a2a10'}},band:[0.06,0.2],bf:'#100402',ba:'#ff8a2a',lasche:'#ff8a2a'}),
  lb_saphirfaecher:nbForm({block:{folie:true,deckel:{kappe:'#5c8dff',wand:'#c8d8ff'}},ecken:'#5c8dff',gurtX:-0.25,gc:'#c8e4ff'}),
  lb_smaragdfaecher:nbForm({block:{folie:true,deckel:{kappe:(i,j)=>(i%2)?'#5cff8a':'#d8ffb0'}},gurtZ:[0],gc:'#2a8a4a',gb:0.03,schnalle:'#d8ffb0'}),
  lb_rubinpalmen:nbForm({block:{huelle:'roh',rohr:'#5a0a10',rohrO:{kopf:'#ff4a4a'},etikett:[0.08,0.1,0.84,0.72],deckel:{kappe:'#ff4a4a',wand:'#7a1a20'}},ecken:'#ffd23f',eb:0.02}),
  lb_polarweiden:nbForm({block:{folie:true,deckel:{kappe:(i,j)=>['#5cffe8','#c85cff','#5ce1ff'][(i+j)%3]}},band:[0.3,0.62],bf:'#063a3a',ba:'#5cffe8'}),
  lb_lilienfeld:nbForm({block:{folie:true,deckel:{kappe:(i,j)=>(i*j)%2?'#ffd23f':'#ff7ad8'}},gurtZ:[-1,1],gc:'#ff7ad8',gb:0.018,lasche:'#ffd23f'}),
  lb_goldsaphir:nbForm({block:{huelle:'roh',rohr:'#0a1a4a',rohrO:{kopf:'#ffd23f'},etikett:[0.15,0.1,0.7,0.74],deckel:{kappe:(i,j)=>(i+j)%2?'#ffd23f':'#5c8dff',wand:'#2a3a6a'}},ecken:'#d9b45a'}),
  lb_amethystregen:nbForm({block:{folie:true,deckel:{kappe:'#c85cff',wand:'#e8ecff'}},gurtX:0.2,gc:'#7a3aff',gb:0.022,ecken:'#e8ecff'}),
  lb_doppelhelix:nbForm({block:{folie:true,deckel:{kappe:(i,j)=>(i+j)%2?'#ffd23f':'#5ce1ff'}},band:[0.1,0.34],bf:'#1a2a4a',ba:'#ffd23f',gurtZ:[1],gc:'#5ce1ff'}),
  lb_farbtiger:nbForm({block:{huelle:'roh',rohr:'#0a2a1e',rohrO:{kopf:['#5cff9e','#5c8dff','#ff5ac8']},etikett:[0.1,0.2,0.8,0.6],deckel:{kappe:(i,j)=>['#5cff9e','#5c8dff','#ff5ac8','#5ce1ff'][(i+2*j)%4],wand:'#1a3a2a'}},gurtZ:[-1,1],gc:'#ff5ac8',gb:0.02,schnalle:'#3a3a3a'}),
  lb_kronenfeuer:nbForm({block:{folie:true,deckel:{kappe:(i,j)=>['#ff4a4a','#5c8dff','#5cff8a','#c85cff'][(i+j)%4]}},ecken:'#ffd23f',eb:0.024,lasche:'#ffd23f'}),
  lb_jadekoenig:nbForm({block:{huelle:'roh',rohr:'#0b0a09',rohrO:{kopf:'#5cff8a'},etikett:[0.2,0.12,0.6,0.7],deckel:{kappe:(i,j)=>(i+j)%2?'#ffd23f':'#5cff8a',wand:'#2a2a1a'}},band:[0.86,0.97],bf:'#0b0a09',ba:'#ffd23f',ecken:'#d9b45a'}),
  lb_paradiesvogel:nbForm({block:{folie:true,huelle:'roh',bunt:['#ff5ac8','#9cff3a','#5ce1ff','#ff9a3d','#c85cff','#ffd23f'],etikett:[0.18,0.12,0.64,0.76],deckel:{kappe:(i,j,R)=>['#ff5ac8','#9cff3a','#5ce1ff','#ff9a3d','#c85cff'][(i*3+j*2)%5]}},lasche:'#9cff3a'}),
  lb_sternenfeuer:nbForm({block:{folie:true,deckel:{kappe:(i,j)=>(i+j)%3?'#e8f0ff':'#7a5cff'}},gurtZ:[-1,0,1],gc:'#c9ced6',gb:0.014,ecken:'#7a5cff'}),
  lb_himmelsfeuer:nbForm({block:{huelle:'roh',rohr:'#1a0a3a',rohrO:{kopf:['#ffd23f','#ff5ac8','#5ce1ff']},etikett:[0.12,0.08,0.76,0.8],deckel:{kappe:(i,j)=>['#ffd23f','#ff5ac8','#5ce1ff','#5cff8a'][(i+j)%4],wand:'#2a1a4a'}},ecken:'#d9b45a',eb:0.026,gurtX:0,gc:'#d9b45a',gb:0.02}),
  /* frueher Kerzen, jetzt Batterien auf dem Tisch */
  feuerperlen:nbForm({block:{folie:true,deckel:{kappe:(i,j)=>(i+j)%2?'#ff8a2a':'#ffd23f'}},gurtX:0,gc:'#ff3a1e',gb:0.016,lasche:'#ff3a1e'}),
  lichterkugeln:nbForm({block:{huelle:'roh',rohr:'#2a2014',rohrO:{kopf:['#ffd23f','#ff4a4a','#5cff8a']},etikett:[0.14,0.16,0.72,0.64],deckel:{kappe:(i,j)=>['#ffd23f','#ff4a4a','#5cff8a'][(i+j)%3],wand:'#4a3a24'}},ecken:'#ffd23f'}),
  goldregen22:nbForm({block:{folie:true,deckel:{kappe:'#ffd23f',wand:'#6a5020'}},band:[0.12,0.4],bf:'#140a02',ba:'#ffd23f',lasche:'#ffd23f'})
});
/* Goldbrokat 100 (frueher Rakete): bedruckter Koecher mit violetten
   Kappen und zwei Goldringen */
V.goldbrokat100=t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.003, h=k.h, kh=0.014;
  mantel(k,R,h-2*kh,kh,'koker',pRund(k,pFront(k),0.36));
  vzyl(k,R+0.002,R+0.002,kh,20,0,kh/2,0,'#3a0a4a'); vzyl(k,R+0.002,R+0.002,kh,20,0,h-kh/2,0,'#3a0a4a');
  vring(k,R+0.002,0.0025,4,20,2*PI,0,h*0.2,0,GOLD,PI/2,0,0); vring(k,R+0.002,0.0025,4,20,2*PI,0,h*0.8,0,GOLD,PI/2,0,0);
  return fertig(k); };
/* 06.10. (14t-batterien2): Werkzeug fuer die neuen Verpackungen der
   umgebauten Batterien - nicht aufzaehlbar, VP_FORM bleibt eine reine
   Produktliste */
Object.defineProperty(V,'__wz',{value:{neu,reg,farbe,kasten,druck,fertig,vbox,vzyl,vring,klar,mit,block,banderole,folie,ecken,gurtX,gurtZ,lasche,lascheSeite,
  pFront,pSeite,pTop,pEtikett,pBild,pRohrSeite,pRohrDeckel,pLoch,pMetall,pKraft,lay,schild,hell,dunkel,css,mix,GOLD,SILBER}});
/* 06.10.: Werkzeug fuer die Themen-Batterien (04h-form-themen.js) */
window.VP_WERK={neu,reg,farbe,kasten,druck,fertig,block,banderole,folie,ecken,gurtX,gurtZ,lasche,lascheSeite,vbox,vzyl,vkugel,vring,klar,mit,pFront,pSeite,pTop,pEtikett,pBild,pRohrSeite,pRohrDeckel,schild,kiste,fensterKarton,mantel,kordel,schleife,lay,nbForm,hell,dunkel,mix,pKraft,pHolz,pLoch,pMetall,griff,seilgriff,vInnen};
})();
