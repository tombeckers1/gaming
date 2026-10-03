/* Inhaltsbilder: getraenke (03.10.) - siehe 04e-ware.js
   Jedes Motiv zeichnet in einem virtuellen Rahmen: Hoehe 100, Breite W
   (75..200 je nach Seitenverhaeltnis), zentriert eingepasst. Licht links oben. */
function mg_f(h,k){ return '#'+hexRgb(h).map(v=>Math.max(0,Math.min(255,Math.round(k>=0?v+(255-v)*k:v*(1+k)))).toString(16).padStart(2,'0')).join(''); }
function mg(fn){ return (g,x,y,w,h,rnd,a)=>{ const r=Math.max(0.75,Math.min(2,w/h)), W=100*r, s=Math.min(w/W,h/100);
  g.save(); g.translate(x+(w-W*s)/2,y+(h-100*s)/2); g.scale(s,s); g.lineJoin='round'; g.lineCap='round'; fn(g,W,rnd,a); g.restore(); }; }
/* Komposition der Breite wn mittig, bei schmalem Rahmen verkleinert */
function mg_mitte(g,W,wn,ya){ const k=Math.min(1,W/wn); g.translate(W/2,ya); g.scale(k,k); g.translate(-wn/2,-ya); return k; }
/* bei breitem Rahmen: Platz links und rechts */
function mg_seiten(W,fn){ if(W<135) return; const s=(W-100)/2; fn(s/2,s,-1); fn(W-s/2,s,1); }
function mg_zyl(g,x0,x1,f){ const gr=g.createLinearGradient(x0,0,x1,0); gr.addColorStop(0,mg_f(f,-0.45)); gr.addColorStop(0.18,mg_f(f,0.35)); gr.addColorStop(0.34,f); gr.addColorStop(0.8,mg_f(f,-0.28)); gr.addColorStop(1,mg_f(f,-0.6)); return gr; }
function mg_kontur(g,lw){ g.strokeStyle='rgba(0,0,0,.28)'; g.lineWidth=lw*2.2; g.stroke(); g.strokeStyle='rgba(255,255,255,.78)'; g.lineWidth=lw; g.stroke(); }
function mg_funkel(g,x,y,r,f){ WZ.leucht(g,x,y,r*2,f||'#fff3c4',0.45); g.fillStyle=f||'#fffbe8'; g.beginPath(); g.moveTo(x,y-r); g.quadraticCurveTo(x,y,x+r,y); g.quadraticCurveTo(x,y,x,y+r); g.quadraticCurveTo(x,y,x-r,y); g.quadraticCurveTo(x,y,x,y-r); g.fill(); WZ.kreis(g,x,y,r*0.15,'#ffffff'); }
function mg_glanzband(g,x,y,w,h,al){ const gr=g.createLinearGradient(x,0,x+w,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(0.45,`rgba(255,255,255,${al})`); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(x,y,w,h); }

/* ---------- Glaeser ---------- */
const MG_KELCH={
  flute:{rw:0.14,bh:0.6,f:t=>Math.sqrt(Math.max(0,1-Math.pow(t,5)))*(1-0.15*t)},
  tulpe:{rw:0.19,bh:0.54,f:t=>t<0.4?0.8+0.2*Math.sin(t/0.4*Math.PI/2):Math.sqrt(Math.max(0,1-Math.pow((t-0.4)/0.6,2)))},
  wein:{rw:0.3,bh:0.52,f:t=>t<0.4?0.8+0.2*Math.sin(t/0.4*Math.PI/2):Math.sqrt(Math.max(0,1-Math.pow((t-0.4)/0.6,2)))},
  copa:{rw:0.4,bh:0.52,f:t=>t<0.3?0.72+0.28*Math.sin(t/0.3*Math.PI/2):Math.sqrt(Math.max(0,1-Math.pow((t-0.3)/0.7,2)))},
  schale:{rw:0.42,bh:0.24,f:t=>Math.sqrt(Math.max(0,1-t*t))},
  martini:{rw:0.44,bh:0.38,f:t=>1-t*0.96},
  likoer:{rw:0.22,bh:0.4,f:t=>(1-0.45*t)*Math.sqrt(Math.max(0,1-Math.pow(t,6)))},
  pils:{rw:0.16,bh:0.78,f:t=>(1-0.42*t*t)*Math.sqrt(Math.max(0,1-Math.pow(t,10)))}
};
function mg_kelch(g,cx,by,h,typ,o){ o=o||{}; const k=MG_KELCH[typ], R=k.rw*h, bh=k.bh*h, top=by-h, bot=top+bh, fr=Math.max(R*0.8,h*0.14), lw=Math.max(0.45,h*0.011);
  const P=[]; for(let i=0;i<=24;i++){ const t=i/24; P.push([R*k.f(t),top+bh*t]); }
  const seite=()=>{ g.beginPath(); P.forEach(p=>g.lineTo(cx-p[0],p[1])); for(let i=P.length-1;i>=0;i--) g.lineTo(cx+P[i][0],P[i][1]); };
  const kelch=()=>{ seite(); g.closePath(); };
  if(!o.ohneSchatten) WZ.schatten(g,cx+h*0.04,by,fr*1.4,fr*0.32,0.42);
  g.beginPath(); g.ellipse(cx,by-fr*0.2,fr,fr*0.22,0,0,Math.PI*2); g.fillStyle='rgba(225,238,255,.4)'; g.fill(); mg_kontur(g,lw*0.8);
  const sw=Math.max(0.7,h*0.02), sg=g.createLinearGradient(cx-sw,0,cx+sw,0); sg.addColorStop(0,'rgba(255,255,255,.9)'); sg.addColorStop(1,'rgba(140,160,180,.6)');
  g.fillStyle=sg; g.beginPath(); g.moveTo(cx-sw*1.5,bot-1); g.lineTo(cx-sw,by-fr*0.25); g.lineTo(cx+sw,by-fr*0.25); g.lineTo(cx+sw*1.5,bot-1); g.closePath(); g.fill();
  kelch(); g.fillStyle='rgba(215,232,255,.2)'; g.fill();
  const ft=o.oben==null?0.2:o.oben, fy=top+bh*ft, hwf=R*k.f(ft);
  if(o.inhalt){ g.save(); kelch(); g.clip();
    g.save(); g.translate(cx,fy); g.rotate(-(o.neig||0));
    const lg=g.createLinearGradient(-R,0,R,0); lg.addColorStop(0,mg_f(o.inhalt,-0.4)); lg.addColorStop(0.28,mg_f(o.inhalt,0.3)); lg.addColorStop(0.55,o.inhalt); lg.addColorStop(1,mg_f(o.inhalt,-0.5)); g.fillStyle=lg; g.fillRect(-R*2,0,R*4,bh*2);
    const vg=g.createLinearGradient(0,0,0,bot-fy); vg.addColorStop(0,'rgba(255,255,255,.08)'); vg.addColorStop(1,'rgba(0,0,0,.3)'); g.fillStyle=vg; g.fillRect(-R*2,0,R*4,bh*2);
    if(o.schaum){ const sh=o.schaum*bh; g.fillStyle='#fffaf0'; g.fillRect(-R*2,-sh*0.2,R*4,sh); g.fillStyle='rgba(220,200,150,.5)'; g.fillRect(-R*2,sh*0.7,R*4,sh*0.12); }
    else WZ.ellipse(g,0,0,hwf,Math.max(0.5,hwf*0.15),mg_f(o.inhalt,0.45));
    g.restore();
    if(o.blasen&&o.rnd){ for(let i=0;i<o.blasen;i++){ const t=ft+(1-ft)*Math.sqrt(o.rnd())*0.97, hw=R*k.f(t)*0.78; WZ.kreis(g,cx+(o.rnd()*2-1)*hw,top+bh*t,h*(0.005+o.rnd()*0.008),'rgba(255,255,255,.8)'); } }
    if(o.innen) o.innen(fy,hwf);
    g.restore(); }
  g.save(); kelch(); g.clip(); mg_glanzband(g,cx-R*0.95,top+bh*0.05,R*0.62,bh*0.82,0.6); g.fillStyle='rgba(255,255,255,.16)'; g.fillRect(cx+R*0.58,top+bh*0.1,R*0.18,bh*0.55); g.restore();
  seite(); mg_kontur(g,lw);
  const R0=R*k.f(0); g.beginPath(); g.ellipse(cx,top,R0,Math.max(0.5,R0*0.15),0,0,Math.PI*2); mg_kontur(g,lw);
  if(o.krone){ g.fillStyle='#fffaf0'; g.beginPath(); g.ellipse(cx,top,R0*1.04,R0*0.42,0,Math.PI,0); g.fill(); for(let i=0;i<7;i++) WZ.kugel(g,cx+(i/6-0.5)*R0*1.7,top-R0*0.08-Math.sin(i/6*Math.PI)*R0*0.22,R0*0.2,'#fff6e0'); }
  return {top,R:R0,bot,fy,hwf};
}
function mg_becher(g,cx,by,w,h,o){ o=o||{}; const wu=w*(o.unten||0.86), top=by-h, bd=h*(o.boden||0.07), lw=Math.max(0.45,h*0.013), ry=w*0.1;
  const hw=y=>wu/2+(w-wu)/2*(by-y)/h;
  const seite=()=>{ g.beginPath(); g.moveTo(cx-w/2,top); g.lineTo(cx-wu/2,by-ry*0.6); g.quadraticCurveTo(cx-wu/2,by,cx,by); g.quadraticCurveTo(cx+wu/2,by,cx+wu/2,by-ry*0.6); g.lineTo(cx+w/2,top); };
  const pfad=()=>{ seite(); g.closePath(); };
  if(!o.ohneSchatten) WZ.schatten(g,cx+w*0.06,by-1,w*0.72,w*0.14,0.42);
  if(o.henkel){ g.save(); const y0=top+h*0.18, y1=top+h*0.8; g.beginPath(); g.moveTo(cx+hw(y0)-1,y0); g.bezierCurveTo(cx+w*0.98,y0-h*0.06,cx+w*0.98,y1+h*0.04,cx+hw(y1)-1,y1);
    g.lineWidth=w*0.12; g.strokeStyle='rgba(0,0,0,.25)'; g.stroke(); g.lineWidth=w*0.1; g.strokeStyle='rgba(220,235,255,.55)'; g.stroke(); g.lineWidth=w*0.03; g.strokeStyle='rgba(255,255,255,.85)'; g.stroke(); g.restore(); }
  pfad(); g.fillStyle='rgba(215,232,255,.2)'; g.fill();
  let fy=top;
  if(o.inhalt){ fy=by-bd-(h-bd)*(o.voll==null?0.75:o.voll); g.save(); pfad(); g.clip();
    g.fillStyle=mg_zyl(g,cx-w/2,cx+w/2,o.inhalt); g.fillRect(cx-w/2,fy,w,by-fy);
    const vg=g.createLinearGradient(0,fy,0,by); vg.addColorStop(0,'rgba(255,255,255,.08)'); vg.addColorStop(1,'rgba(0,0,0,.3)'); g.fillStyle=vg; g.fillRect(cx-w/2,fy,w,by-fy);
    WZ.ellipse(g,cx,fy,hw(fy),ry*hw(fy)/(w/2),mg_f(o.inhalt,0.4));
    if(o.blasen&&o.rnd) for(let i=0;i<o.blasen;i++){ const yy=fy+o.rnd()*(by-bd-fy); WZ.kreis(g,cx+(o.rnd()*2-1)*hw(yy)*0.82,yy,w*(0.008+o.rnd()*0.014),'rgba(255,255,255,.75)'); }
    if(o.innen) o.innen(fy,hw(fy));
    if(o.schaum){ const ys=fy-o.schaum; const sg=g.createLinearGradient(cx-w/2,0,cx+w/2,0); sg.addColorStop(0,'#e8dcc0'); sg.addColorStop(0.3,'#fffdf6'); sg.addColorStop(1,'#d8ccb0'); g.fillStyle=sg; g.fillRect(cx-w/2,ys,w,fy-ys+ry*0.5); }
    g.restore();
    if(o.schaum&&fy-o.schaum<=top+1){ g.fillStyle='#fffaf0'; g.beginPath(); g.ellipse(cx,top,w*0.52,ry*1.3,0,0,Math.PI*2); g.fill(); for(let i=0;i<7;i++) WZ.kugel(g,cx+(i/6-0.5)*w*0.9,top-ry*0.6-Math.sin(i/6*Math.PI)*ry*1.2,w*0.1,'#fff6e0'); } }
  g.save(); pfad(); g.clip(); g.fillStyle='rgba(255,255,255,.22)'; g.fillRect(cx-w/2,by-bd,w,bd); mg_glanzband(g,cx-w*0.45,top,w*0.3,h,0.55); g.fillStyle='rgba(255,255,255,.15)'; g.fillRect(cx+w*0.3,top+h*0.1,w*0.06,h*0.7); g.restore();
  seite(); mg_kontur(g,lw);
  if(!(o.schaum&&fy-o.schaum<=top+1)){ g.beginPath(); g.ellipse(cx,top,w/2,ry,0,0,Math.PI*2); mg_kontur(g,lw); }
  return {top,fy,hw};
}
/* ---------- Flaschen und Dosen (nur fuer Kartons) ---------- */
const MG_FL={
  bier:t=>t<0.02?0.93:t<0.55?1:t<0.78?0.36+0.64*Math.cos((t-0.55)/0.23*Math.PI/2):t<0.95?0.36-0.04*(t-0.78)/0.17:0.39,
  pet:t=>t<0.03?0.88:t<0.62?1-0.08*Math.exp(-Math.pow((t-0.36)/0.05,2)):t<0.86?0.3+0.7*Math.cos((t-0.62)/0.24*Math.PI/2):0.3,
  buegel:t=>t<0.02?0.93:t<0.58?1:t<0.8?0.4+0.6*Math.cos((t-0.58)/0.22*Math.PI/2):0.4+(t>0.94?0.05:0)
};
function mg_fl(g,cx,by,h,w,typ,o){ o=o||{}; const f=MG_FL[typ], N=40, P=[]; for(let i=0;i<=N;i++){ const t=i/N; P.push([w/2*f(t),by-h*t]); }
  const pfad=()=>{ g.beginPath(); P.forEach(p=>g.lineTo(cx-p[0],p[1])); for(let i=N;i>=0;i--) g.lineTo(cx+P[i][0],P[i][1]); g.closePath(); };
  if(!o.ohneSchatten) WZ.schatten(g,cx+w*0.1,by-1,w*0.8,w*0.17,0.42);
  pfad(); g.fillStyle=mg_zyl(g,cx-w/2,cx+w/2,o.farbe); g.fill();
  g.save(); pfad(); g.clip();
  if(o.leer!=null){ g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(cx-w/2,by-h,w,h*(1-o.leer)); }
  if(o.etikett){ const t=o.etikettT||[0.14,0.46], y0=by-h*t[1], y1=by-h*t[0]; g.fillStyle=mg_zyl(g,cx-w/2,cx+w/2,o.etikett); g.fillRect(cx-w/2,y0,w,y1-y0); if(o.deko) o.deko(cx,y0,w,y1-y0); }
  if(o.hals){ g.fillStyle=mg_zyl(g,cx-w/2,cx+w/2,o.hals); g.fillRect(cx-w/2,by-h*0.92,w,h*0.12); }
  if(o.perlen&&o.rnd) for(let i=0;i<o.perlen;i++) WZ.ellipse(g,cx+(o.rnd()*2-1)*w*0.42,by-h*(0.05+o.rnd()*0.5),w*0.03,w*0.045,'rgba(255,255,255,.55)');
  mg_glanzband(g,cx-w*0.4,by-h*0.95,w*0.24,h*0.92,0.55); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(cx+w*0.24,by-h*0.6,w*0.06,h*0.5);
  g.restore();
  const tw=w/2*f(1);
  if(o.kapsel){ const kh=h*0.05; g.fillStyle=mg_zyl(g,cx-tw*1.15,cx+tw*1.15,o.kapsel); g.fillRect(cx-tw*1.12,by-h-kh*0.4,tw*2.24,kh); if(typ==='bier'){ g.fillStyle=mg_f(o.kapsel,-0.35); for(let i=0;i<6;i++) g.fillRect(cx-tw*1.12+i*tw*0.4,by-h+kh*0.45,tw*0.2,kh*0.2); } }
  if(typ==='buegel'){ const kh=h*0.06; WZ.rr(g,cx-tw*0.9,by-h-kh,tw*1.8,kh,kh*0.4); g.fillStyle=mg_zyl(g,cx-tw,cx+tw,'#f2f2ee'); g.fill(); WZ.ellipse(g,cx,by-h+kh*0.1,tw*1.05,kh*0.25,'#c8382a');
    g.strokeStyle='#c9ccd2'; g.lineWidth=w*0.035; g.beginPath(); g.moveTo(cx-tw*0.95,by-h-kh*0.5); g.lineTo(cx-tw*1.2,by-h*0.84); g.moveTo(cx+tw*0.95,by-h-kh*0.5); g.lineTo(cx+tw*1.2,by-h*0.84); g.stroke(); }
  return by-h;
}
function mg_dose(g,cx,by,w,h,f,o){ o=o||{}; const ry=w*0.12, top=by-h;
  if(!o.ohneSchatten) WZ.schatten(g,cx+w*0.1,by-1,w*0.75,w*0.15,0.45);
  const koerper=()=>{ g.beginPath(); g.moveTo(cx-w*0.4,top+ry*0.4); g.lineTo(cx-w/2,top+h*0.08); g.lineTo(cx-w/2,by-ry); g.ellipse(cx,by-ry,w/2,ry,0,Math.PI,0,true); g.lineTo(cx+w/2,top+h*0.08); g.lineTo(cx+w*0.4,top+ry*0.4); g.closePath(); };
  koerper(); g.fillStyle=mg_zyl(g,cx-w/2,cx+w/2,f); g.fill();
  g.save(); koerper(); g.clip(); if(o.deko) o.deko(cx,top,w,h);
  g.fillStyle=mg_zyl(g,cx-w/2,cx+w/2,'#c4c8d0'); g.fillRect(cx-w/2,top,w,h*0.085); g.fillRect(cx-w/2,by-ry*1.6,w,ry*1.6);
  mg_glanzband(g,cx-w*0.42,top,w*0.26,h,0.5); g.restore();
  WZ.ellipse(g,cx,top+ry*0.4,w*0.4,ry*0.75,'#e4e7ec'); WZ.ellipse(g,cx,top+ry*0.5,w*0.33,ry*0.55,'#b8bcc6');
  WZ.rr(g,cx-w*0.1,top+ry*0.05,w*0.22,ry*0.6,ry*0.3); g.fillStyle='#d8dbe2'; g.fill();
}
/* ---------- Fruechte und Deko ---------- */
function mg_scheibe(g,cx,cy,r,o){ o=o||{}; const sch=o.schale||'#f2c21b', fl=o.fleisch||'#ffe45c', n=o.n||10, ry=o.ry||1;
  g.save(); g.translate(cx,cy); g.rotate(o.rot||0); g.scale(1,ry);
  if(ry<0.95){ g.fillStyle=mg_f(sch,-0.3); g.beginPath(); g.arc(0,r*0.14/ry,r,0,Math.PI*2); g.fill(); }
  WZ.kreis(g,0,0,r,sch); WZ.kreis(g,0,0,r*0.9,o.weiss||'#fff8e6');
  const rg=g.createRadialGradient(-r*0.3,-r*0.3,0,0,0,r*0.85); rg.addColorStop(0,mg_f(fl,0.4)); rg.addColorStop(1,fl); g.fillStyle=rg;
  for(let i=0;i<n;i++){ const a0=i/n*Math.PI*2+0.05, a1=(i+1)/n*Math.PI*2-0.05; g.beginPath(); g.moveTo(Math.cos((a0+a1)/2)*r*0.1,Math.sin((a0+a1)/2)*r*0.1); g.arc(0,0,r*0.82,a0,a1); g.closePath(); g.fill(); }
  g.fillStyle='rgba(255,255,255,.45)'; for(let i=0;i<n;i++){ const an=(i+0.5)/n*Math.PI*2; g.beginPath(); g.ellipse(Math.cos(an)*r*0.5,Math.sin(an)*r*0.5,r*0.13,r*0.04,an,0,Math.PI*2); g.fill(); }
  if(o.kerne) for(let i=0;i<n;i+=3){ const an=(i+0.5)/n*Math.PI*2; WZ.ellipse(g,Math.cos(an)*r*0.25,Math.sin(an)*r*0.25,r*0.07,r*0.04,'#f4ecd0',an); }
  g.restore(); }
function mg_frucht(g,x,y,r,f,o){ o=o||{}; g.save(); g.translate(x,y); g.rotate(o.rot||0); const sx=o.zitrone?1.2:1;
  if(!o.ohneSchatten) WZ.schatten(g,r*0.2,r*0.85,r*1.2*sx,r*0.3,0.4);
  g.save(); g.scale(sx,1); const gr=g.createRadialGradient(-r*0.35,-r*0.4,r*0.05,0,0,r); gr.addColorStop(0,mg_f(f,0.6)); gr.addColorStop(0.3,f); gr.addColorStop(1,mg_f(f,-0.42)); g.fillStyle=gr;
  g.beginPath(); g.arc(0,0,r,0,Math.PI*2); g.fill(); if(o.zitrone){ WZ.kreis(g,r*0.97,0,r*0.17,mg_f(f,-0.15)); WZ.kreis(g,-r*0.97,0,r*0.12,mg_f(f,0.1)); }
  g.fillStyle=rgba(mg_f(f,-0.3),0.35); for(let i=0;i<14;i++){ const an=i*2.4, d=r*(0.3+(i*37%10)/16); g.fillRect(Math.cos(an)*d,Math.sin(an)*d,r*0.04,r*0.04); }
  g.restore();
  if(o.stiel){ g.strokeStyle='#5a3a1a'; g.lineWidth=r*0.1; g.beginPath(); g.moveTo(0,-r*0.85); g.quadraticCurveTo(r*0.05,-r*1.15,r*0.2,-r*1.3); g.stroke(); }
  if(o.blatt) mg_blatt(g,o.stiel?r*0.15:r*0.1,-r*(o.stiel?1.05:0.9),r*0.9,-0.6,o.blatt);
  g.restore(); }
function mg_haelfte(g,cx,cy,r,o){ o=o||{}; const sch=o.schale||'#f28a1c', ry=o.ry||0.45;
  WZ.schatten(g,cx+r*0.15,cy+r*0.9,r*1.15,r*0.28,0.42);
  const gr=g.createRadialGradient(cx-r*0.4,cy+r*0.1,r*0.1,cx,cy,r*1.1); gr.addColorStop(0,mg_f(sch,0.35)); gr.addColorStop(0.5,sch); gr.addColorStop(1,mg_f(sch,-0.45)); g.fillStyle=gr;
  g.beginPath(); g.ellipse(cx,cy,r,r*0.9,0,0,Math.PI); g.fill();
  mg_scheibe(g,cx,cy,r,{schale:sch,fleisch:o.fleisch||'#ffa21c',n:o.n||11,ry,weiss:o.weiss,kerne:o.kerne}); }
function mg_blatt(g,x,y,l,rot,f){ g.save(); g.translate(x,y); g.rotate(rot); const gr=g.createLinearGradient(0,-l*0.3,0,l*0.3); gr.addColorStop(0,mg_f(f,0.3)); gr.addColorStop(1,mg_f(f,-0.35)); g.fillStyle=gr;
  g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(l*0.45,-l*0.34,l,0); g.quadraticCurveTo(l*0.45,l*0.34,0,0); g.fill();
  g.strokeStyle=rgba(mg_f(f,0.5),0.8); g.lineWidth=l*0.03; g.beginPath(); g.moveTo(0,0); g.lineTo(l*0.92,0); for(let i=1;i<4;i++){ g.moveTo(l*i*0.22,0); g.lineTo(l*(i*0.22+0.12),-l*0.12); g.moveTo(l*i*0.22,0); g.lineTo(l*(i*0.22+0.12),l*0.12); } g.stroke(); g.restore(); }
function mg_minze(g,x,y,s,rot){ g.save(); g.translate(x,y); g.rotate(rot||0); g.strokeStyle='#4a7a2a'; g.lineWidth=s*0.05; g.beginPath(); g.moveTo(0,s*0.5); g.lineTo(0,-s*0.45); g.stroke();
  [[0.3,-0.9,0.5],[0.3,-2.25,0.5],[-0.05,-0.7,0.42],[-0.05,-2.45,0.42],[-0.4,-1.57,0.36]].forEach(([yy,an,l])=>mg_blatt(g,0,yy*s,l*s,an,'#3fa040')); g.restore(); }
function mg_weinblatt(g,x,y,s,rot,f){ g.save(); g.translate(x,y); g.rotate(rot); g.beginPath();
  for(let i=0;i<=90;i++){ const an=i/90*Math.PI*2, rr=s*(0.6+0.32*Math.pow(Math.abs(Math.cos(an*2.5)),0.8)+0.05*Math.cos(an*30)); g.lineTo(Math.cos(an)*rr,Math.sin(an)*rr); } g.closePath();
  const gr=g.createRadialGradient(-s*0.3,-s*0.3,0,0,0,s); gr.addColorStop(0,mg_f(f,0.3)); gr.addColorStop(1,mg_f(f,-0.35)); g.fillStyle=gr; g.fill();
  g.strokeStyle=rgba(mg_f(f,0.55),0.7); g.lineWidth=s*0.04; g.beginPath(); for(let i=0;i<5;i++){ const an=i/5*Math.PI*2; g.moveTo(0,0); g.lineTo(Math.cos(an)*s*0.8,Math.sin(an)*s*0.8); } g.stroke(); g.restore(); }
function mg_traube(g,cx,cy,s,f,rnd,o){ o=o||{}; const r=s*0.13, reihen=o.reihen||[4,5,4,4,3,2,1];
  g.strokeStyle='#6b4a2a'; g.lineWidth=s*0.05; g.beginPath(); g.moveTo(cx,cy+r*1.5); g.quadraticCurveTo(cx+s*0.03,cy-s*0.12,cx+s*0.16,cy-s*0.24); g.stroke();
  if(o.blatt) mg_weinblatt(g,cx+(o.blattX||-0.32)*s,cy+(o.blattY||0)*s,s*0.42,o.blattRot||-0.5,o.blatt);
  reihen.forEach((n,i)=>{ const yy=cy+r*1.4+i*r*1.5; for(let j=0;j<n;j++){ const xx=cx+(j-(n-1)/2)*r*1.75+(rnd()-0.5)*r*0.4; WZ.kugel(g,xx,yy+(rnd()-0.5)*r*0.3,r*(0.92+rnd()*0.16),f,mg_f(f,0.65)); } }); }
function mg_erdbeere(g,x,y,r,rot){ g.save(); g.translate(x,y); g.rotate(rot||0);
  g.beginPath(); g.moveTo(0,-r*0.7); g.bezierCurveTo(r*1.15,-r*0.95,r*1.0,r*0.35,0,r*1.05); g.bezierCurveTo(-r*1.0,r*0.35,-r*1.15,-r*0.95,0,-r*0.7);
  const gr=g.createRadialGradient(-r*0.35,-r*0.3,r*0.05,0,0,r*1.1); gr.addColorStop(0,'#ff9090'); gr.addColorStop(0.35,'#e0202e'); gr.addColorStop(1,'#7a0a12'); g.fillStyle=gr; g.fill();
  for(let k=0;k<5;k++){ const yy=(-0.4+k*0.28)*r, hw=r*(0.78-k*0.14); for(let m=-3;m<=3;m++){ const xx=(m*0.32+(k%2)*0.16)*r; if(Math.abs(xx)<hw*0.85) WZ.ellipse(g,xx,yy,r*0.045,r*0.07,'#ffe07a'); } }
  for(let i=0;i<5;i++){ const an=Math.PI*0.92-i*Math.PI*0.84/4; WZ.ellipse(g,Math.cos(an)*r*0.3,-r*0.7+Math.sin(an)*r*0.16,r*0.34,r*0.1,i%2?'#2f8a2a':'#3fa83a',an); }
  g.strokeStyle='#2f7a2a'; g.lineWidth=r*0.1; g.beginPath(); g.moveTo(0,-r*0.75); g.lineTo(r*0.05,-r*1.05); g.stroke(); g.restore(); }
function mg_eis(g,x,y,s,rot,al){ al=al||0.85; g.save(); g.translate(x,y); g.rotate(rot||0);
  WZ.rr(g,-s/2+s*0.14,-s/2+s*0.12,s,s,s*0.22); g.fillStyle=`rgba(90,150,200,${al*0.55})`; g.fill();
  WZ.rr(g,-s/2,-s/2,s,s,s*0.22); const gr=g.createLinearGradient(-s/2,-s/2,s/2,s/2); gr.addColorStop(0,`rgba(255,255,255,${al})`); gr.addColorStop(0.5,`rgba(205,238,255,${al*0.7})`); gr.addColorStop(1,`rgba(140,195,235,${al*0.85})`); g.fillStyle=gr; g.fill();
  g.strokeStyle=`rgba(255,255,255,${al})`; g.lineWidth=s*0.05; g.stroke();
  WZ.rr(g,-s*0.22,-s*0.22,s*0.44,s*0.44,s*0.1); g.fillStyle=`rgba(255,255,255,${al*0.25})`; g.fill();
  g.strokeStyle='rgba(255,255,255,.95)'; g.lineWidth=s*0.07; g.beginPath(); g.moveTo(-s*0.32,s*0.12); g.lineTo(-s*0.32,-s*0.32); g.lineTo(s*0.12,-s*0.32); g.stroke(); g.restore(); }
function mg_dampf(g,x,y,h,b,rnd){ g.save(); for(let i=0;i<3;i++){ const x0=x+(i-1)*b*0.32+(rnd()-0.5)*b*0.08, s=i%2?1:-1, gr=g.createLinearGradient(0,y,0,y-h);
  gr.addColorStop(0,'rgba(255,255,255,.6)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.strokeStyle=gr; g.lineWidth=b*0.09; g.beginPath(); g.moveTo(x0,y); g.bezierCurveTo(x0+s*b*0.22,y-h*0.3,x0-s*b*0.22,y-h*0.62,x0+s*b*0.1,y-h); g.stroke(); } g.restore(); }
function mg_zimt(g,x,y,l,d,rot){ g.save(); g.translate(x,y); g.rotate(rot||0); const gr=g.createLinearGradient(0,-d/2,0,d/2); gr.addColorStop(0,'#c8844a'); gr.addColorStop(0.45,'#8a4a1e'); gr.addColorStop(1,'#3e1c06'); g.fillStyle=gr;
  WZ.rr(g,-l/2,-d/2,l,d,d*0.25); g.fill(); g.strokeStyle='rgba(50,20,4,.55)'; g.lineWidth=d*0.08; g.beginPath(); g.moveTo(-l/2+d*0.4,d*0.05); g.lineTo(l/2-d*0.3,d*0.05); g.stroke();
  WZ.ellipse(g,l/2,0,d*0.24,d*0.5,'#b06c34'); g.strokeStyle='#5a2a0a'; g.lineWidth=d*0.07; g.beginPath(); for(let i=0;i<=16;i++){ const an=i*0.7, rr=d*0.42*(1-i/18); g.lineTo(l/2+Math.cos(an)*rr*0.45,Math.sin(an)*rr); } g.stroke(); g.restore(); }
function mg_anis(g,x,y,r,rot){ g.save(); g.translate(x,y); g.rotate(rot||0); for(let i=0;i<8;i++){ g.save(); g.rotate(i*Math.PI/4); const gr=g.createLinearGradient(0,-r*0.3,0,r*0.3); gr.addColorStop(0,'#9a5a2a'); gr.addColorStop(1,'#3e1a08'); g.fillStyle=gr;
  g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(r*0.5,-r*0.34,r,0); g.quadraticCurveTo(r*0.5,r*0.34,0,0); g.fill(); WZ.ellipse(g,r*0.56,0,r*0.13,r*0.08,'#e0a868'); g.restore(); } WZ.kreis(g,0,0,r*0.13,'#2e1406'); g.restore(); }
function mg_tropfen(g,x,y,r,f){ g.beginPath(); g.moveTo(x,y-r*2.1); g.bezierCurveTo(x+r*0.3,y-r*1.2,x+r,y-r*0.7,x+r,y); g.arc(x,y,r,0,Math.PI); g.bezierCurveTo(x-r,y-r*0.7,x-r*0.3,y-r*1.2,x,y-r*2.1);
  const gr=g.createRadialGradient(x-r*0.3,y-r*0.2,r*0.1,x,y,r*1.4); gr.addColorStop(0,mg_f(f,0.6)); gr.addColorStop(0.5,f); gr.addColorStop(1,mg_f(f,-0.4)); g.fillStyle=gr; g.fill();
  WZ.ellipse(g,x-r*0.4,y-r*0.3,r*0.18,r*0.38,'rgba(255,255,255,.8)',0.3); }
function mg_blitz(g,x,y,s,f){ const P=[[0.12,-0.5],[-0.22,0.06],[-0.01,0.06],[-0.14,0.5],[0.24,-0.1],[0.03,-0.1],[0.18,-0.5]]; g.beginPath(); P.forEach(p=>g.lineTo(x+p[0]*s,y+p[1]*s)); g.closePath(); g.fillStyle=f; g.fill(); }
function mg_zacke(g,x0,y0,x1,y1,n,rnd,f,lw){ const P=[[x0,y0]]; for(let i=1;i<n;i++){ const t=i/n; P.push([x0+(x1-x0)*t+(rnd()-0.5)*lw*6,y0+(y1-y0)*t+(rnd()-0.5)*lw*6]); } P.push([x1,y1]);
  g.save(); g.globalCompositeOperation='lighter'; [[lw*3,rgba(f,0.3)],[lw*1.4,rgba(f,0.8)],[lw*0.5,'#ffffff']].forEach(([w,c])=>{ g.strokeStyle=c; g.lineWidth=w; g.beginPath(); P.forEach(p=>g.lineTo(p[0],p[1])); g.stroke(); }); g.restore(); }
function mg_ei(g,x,y,r,f,rot){ g.save(); g.translate(x,y); g.rotate(rot||0); WZ.schatten(g,r*0.15,r*0.9,r*1.0,r*0.25,0.35); g.beginPath(); g.ellipse(0,0,r*0.82,r*1.25,0,Math.PI,0); g.ellipse(0,0,r*0.82,r*0.92,0,0,Math.PI);
  const gr=g.createRadialGradient(-r*0.3,-r*0.45,r*0.05,0,0,r*1.2); gr.addColorStop(0,mg_f(f,0.65)); gr.addColorStop(0.4,f); gr.addColorStop(1,mg_f(f,-0.38)); g.fillStyle=gr; g.fill(); g.restore(); }
function mg_bohne(g,x,y,r,rot){ g.save(); g.translate(x,y); g.rotate(rot||0); const gr=g.createRadialGradient(-r*0.3,-r*0.3,0,0,0,r); gr.addColorStop(0,'#9a6238'); gr.addColorStop(1,'#2e1608'); g.fillStyle=gr; g.beginPath(); g.ellipse(0,0,r,r*0.7,0,0,Math.PI*2); g.fill();
  g.strokeStyle='#1e0c02'; g.lineWidth=r*0.14; g.beginPath(); g.moveTo(-r*0.8,0); g.bezierCurveTo(-r*0.3,-r*0.25,r*0.3,r*0.25,r*0.8,0); g.stroke(); g.restore(); }
function mg_rose(g,x,y,r,f){ WZ.schatten(g,x+r*0.2,y+r*0.8,r*1.2,r*0.35,0.35); mg_blatt(g,x-r*0.4,y+r*0.4,r*1.2,2.6,'#2f7a3a'); mg_blatt(g,x+r*0.4,y+r*0.45,r*1.1,0.35,'#2f7a3a');
  for(let L=0;L<3;L++){ const n=5-L, d=r*(0.5-L*0.16); for(let i=0;i<n;i++){ const an=i/n*Math.PI*2+L*0.6; const px=x+Math.cos(an)*d, py=y+Math.sin(an)*d*0.8;
    const gr=g.createRadialGradient(px-r*0.15,py-r*0.15,0,px,py,r*(0.55-L*0.12)); gr.addColorStop(0,mg_f(f,0.4-L*0.1)); gr.addColorStop(1,mg_f(f,-0.25-L*0.1)); g.fillStyle=gr; g.beginPath(); g.ellipse(px,py,r*(0.55-L*0.12),r*(0.45-L*0.1),an,0,Math.PI*2); g.fill(); } }
  g.strokeStyle=mg_f(f,-0.45); g.lineWidth=r*0.06; g.beginPath(); for(let i=0;i<=20;i++){ const an=i*0.6, rr=r*0.28*(i/20); g.lineTo(x+Math.cos(an)*rr,y-r*0.05+Math.sin(an)*rr*0.8); } g.stroke(); }
function mg_strohhalm(g,x0,y0,x1,y1,d,f1,f2,al){ const l=Math.hypot(x1-x0,y1-y0); g.save(); g.globalAlpha=al||1; g.translate(x0,y0); g.rotate(Math.atan2(y1-y0,x1-x0)); g.beginPath(); g.rect(0,-d/2,l,d); g.save(); g.clip(); g.fillStyle=f1; g.fillRect(0,-d/2,l,d);
  g.fillStyle=f2; for(let s=-d;s<l;s+=d*1.6){ g.beginPath(); g.moveTo(s,-d/2); g.lineTo(s+d*0.7,-d/2); g.lineTo(s+d*1.3,d/2); g.lineTo(s+d*0.6,d/2); g.fill(); } g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(0,-d/2,l,d*0.3); g.restore(); g.restore(); }
function mg_schlange(g,x,y,l,dir,f,rnd){ g.save(); g.strokeStyle=f; g.lineWidth=1.8; g.beginPath(); const ph=rnd()*6; for(let i=0;i<=40;i++){ const t=i/40, rr=4*(1-t*0.5); g.lineTo(x+Math.cos(dir)*t*l+Math.cos(t*16+ph)*rr,y+Math.sin(dir)*t*l+Math.sin(t*16+ph)*rr); } g.stroke(); g.restore(); }
function mg_flocke(g,x,y,r,al){ g.save(); g.strokeStyle=`rgba(255,255,255,${al||0.9})`; g.lineWidth=r*0.14; g.beginPath(); for(let i=0;i<6;i++){ const an=i*Math.PI/3, c=Math.cos(an), s=Math.sin(an); g.moveTo(x,y); g.lineTo(x+c*r,y+s*r);
  const bx=x+c*r*0.6, by=y+s*r*0.6; g.moveTo(bx,by); g.lineTo(bx+Math.cos(an+0.7)*r*0.3,by+Math.sin(an+0.7)*r*0.3); g.moveTo(bx,by); g.lineTo(bx+Math.cos(an-0.7)*r*0.3,by+Math.sin(an-0.7)*r*0.3); } g.stroke(); g.restore(); }
function mg_blattgold(g,x,y,s,rot,rnd){ g.save(); g.translate(x,y); g.rotate(rot); g.beginPath(); for(let i=0;i<5;i++){ const an=i/5*Math.PI*2, rr=s*(0.6+rnd()*0.5); g.lineTo(Math.cos(an)*rr,Math.sin(an)*rr*0.7); } g.closePath();
  const gr=g.createLinearGradient(-s,-s,s,s); gr.addColorStop(0,'#fff3b0'); gr.addColorStop(0.5,'#e8b418'); gr.addColorStop(1,'#a87808'); g.fillStyle=gr; g.fill(); g.restore(); }
function mg_feige(g,x,y,r,halb,rot){ g.save(); g.translate(x,y); g.rotate(rot||0); WZ.schatten(g,r*0.2,r*0.95,r*1.1,r*0.28,0.4);
  const pf=()=>{ g.beginPath(); g.moveTo(0,-r*1.25); g.bezierCurveTo(r*0.4,-r*1.1,r*1.05,-r*0.2,r*0.95,r*0.35); g.bezierCurveTo(r*0.85,r*1.05,-r*0.85,r*1.05,-r*0.95,r*0.35); g.bezierCurveTo(-r*1.05,-r*0.2,-r*0.4,-r*1.1,0,-r*1.25); };
  pf(); const gr=g.createRadialGradient(-r*0.35,-r*0.3,r*0.05,0,0,r*1.2); gr.addColorStop(0,'#b46aa8'); gr.addColorStop(0.4,'#6a2a62'); gr.addColorStop(1,'#2a0a26'); g.fillStyle=gr; g.fill();
  if(halb){ g.save(); g.scale(0.84,0.84); pf(); g.fillStyle='#f4e6c8'; g.fill(); g.scale(0.82,0.82); pf(); const g2=g.createRadialGradient(0,r*0.2,0,0,0,r); g2.addColorStop(0,'#f8c0a0'); g2.addColorStop(1,'#c8304a'); g.fillStyle=g2; g.fill();
    g.fillStyle='#f6e8b0'; for(let i=0;i<22;i++){ const an=i*2.4, d=r*0.65*Math.sqrt((i+1)/23); WZ.ellipse(g,Math.cos(an)*d*0.8,r*0.15+Math.sin(an)*d,r*0.05,r*0.03,'#f6e8b0',an); } g.restore(); }
  else { g.strokeStyle='#4a6a2a'; g.lineWidth=r*0.14; g.beginPath(); g.moveTo(0,-r*1.2); g.lineTo(r*0.08,-r*1.45); g.stroke(); WZ.ellipse(g,-r*0.35,-r*0.35,r*0.12,r*0.3,'rgba(255,255,255,.3)',0.4); }
  g.restore(); }
function mg_hopfen(g,x,y,r,rot){ g.save(); g.translate(x,y); g.rotate(rot||0); mg_blatt(g,0,-r*1.1,r*1.4,-0.5,'#3f7a2a');
  for(let i=0;i<5;i++){ const n=i<3?3:2, yy=-r*0.8+i*r*0.42, hw=r*(0.62-i*0.08); for(let j=0;j<n;j++){ const xx=(j-(n-1)/2)*hw*0.85, gr=g.createLinearGradient(xx,yy-r*0.3,xx,yy+r*0.4); gr.addColorStop(0,'#c8e07a'); gr.addColorStop(1,'#5a8a2a'); g.fillStyle=gr;
    g.beginPath(); g.moveTo(xx-r*0.3,yy-r*0.1); g.quadraticCurveTo(xx-r*0.25,yy+r*0.35,xx,yy+r*0.45); g.quadraticCurveTo(xx+r*0.25,yy+r*0.35,xx+r*0.3,yy-r*0.1); g.closePath(); g.fill(); } } g.restore(); }
function mg_aehre(g,x,y,l,rot){ g.save(); g.translate(x,y); g.rotate(rot||0); g.strokeStyle='#b8902a'; g.lineWidth=l*0.025; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-l); g.stroke();
  for(let i=0;i<7;i++){ const yy=-l*0.45-i*l*0.075; for(const s of [-1,1]){ WZ.ellipse(g,s*l*0.045,yy,l*0.04,l*0.07,i%2?'#e8c060':'#d4a83a',s*0.35); g.strokeStyle='rgba(220,180,90,.8)'; g.lineWidth=l*0.008; g.beginPath(); g.moveTo(s*l*0.05,yy-l*0.05); g.lineTo(s*l*0.15,yy-l*0.25); g.stroke(); } } g.restore(); }

/* =================== Motive =================== */
/* Sekt: zwei Floeten stossen an */
wareReg('sekt',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ for(let i=0;i<4;i++) mg_funkel(g,x+(rnd()-0.5)*s,15+rnd()*70,(2+rnd()*3)*Math.min(1,s/30),'#ffe9a8'); });
  g.save(); mg_mitte(g,W,100,55);
  [[-1,0.18],[1,-0.18]].forEach(([s,r])=>{ g.save(); g.translate(50+s*27,95); g.rotate(r); mg_kelch(g,0,0,80,'flute',{inhalt:'#f2cf63',oben:0.16,blasen:20,rnd,neig:r}); g.restore(); });
  for(let i=0;i<10;i++){ const an=-Math.PI*(0.08+0.84*rnd()), d=8+rnd()*12; WZ.kreis(g,50+Math.cos(an)*d,15+Math.sin(an)*d,0.8+rnd()*1.2,'rgba(255,236,170,.9)'); }
  mg_funkel(g,50,15,10,'#fff3c4'); g.restore();
}));
/* Kindersekt: Floete mit Strohhalm und Luftschlangen */
wareReg('kindersekt',mg((g,W,rnd,a)=>{
  const fl=['#ffe45c','#5ce1ff','#9cff3a','#ffffff'];
  for(let i=0;i<4;i++) mg_schlange(g,W*(0.05+rnd()*0.3)+(i%2)*W*0.55,6+rnd()*30,24+rnd()*20,0.6+rnd()*1.2,fl[i],rnd);
  WZ.konfetti(g,0,0,W,60,18,['#ffe45c','#5ce1ff','#9cff3a','#ff7ab0','#ffffff'],1.6,rnd);
  g.save(); mg_mitte(g,W,96,55);
  mg_frucht(g,76,84,11,'#8fd14f',{stiel:1,blatt:'#3f8a2a'});
  mg_kelch(g,42,95,80,'flute',{inhalt:'#f7e08a',oben:0.18,blasen:16,rnd,innen:()=>mg_strohhalm(g,40,52,46,30,3.2,'#ff5aa0','#ffffff',0.45)});
  mg_strohhalm(g,46,30,53,5,3.2,'#ff5aa0','#ffffff'); g.restore();
}));
/* Secco: Sektschale mit Schaumkrone und Apfelspalten */
function mg_apfelspalte(g,x,y,r,rot){ g.save(); g.translate(x,y); g.rotate(rot); WZ.schatten(g,0,r*0.35,r*1.1,r*0.25,0.3); g.beginPath(); g.arc(0,0,r,Math.PI,0); g.closePath(); g.fillStyle='#f6f0cc'; g.fill();
  g.strokeStyle='#7ac23a'; g.lineWidth=r*0.14; g.beginPath(); g.arc(0,0,r*0.95,Math.PI*1.02,-0.02); g.stroke(); WZ.ellipse(g,-r*0.2,-r*0.32,r*0.08,r*0.14,'#5a3a1a',0.4); WZ.ellipse(g,r*0.2,-r*0.32,r*0.08,r*0.14,'#5a3a1a',-0.4); g.restore(); }
wareReg('secco',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s,d)=>{ for(let i=0;i<10;i++) WZ.kreis(g,x+(rnd()-0.5)*s,10+rnd()*80,0.8+rnd()*2,'rgba(200,162,58,.45)'); });
  g.save(); mg_mitte(g,W,96,55);
  for(let i=0;i<22;i++){ const yy=8+rnd()*40; WZ.kreis(g,48+(rnd()-0.5)*(26+yy*0.4),yy,0.6+rnd()*1.6,'rgba(200,162,58,.55)'); }
  mg_kelch(g,48,94,62,'schale',{inhalt:'#f0dc96',oben:0.12,blasen:10,rnd,krone:1});
  mg_apfelspalte(g,18,92,9,-0.15); mg_apfelspalte(g,80,93,8,0.25); mg_apfelspalte(g,70,95,7,-0.3); g.restore();
}));
/* Partyfass: Fass mit Zapfhahn und Bierkrug */
wareReg('partyfass',mg((g,W,rnd,a)=>{
  g.save(); mg_mitte(g,W,112,55);
  const cx=40, by=95, w=50, h=70, top=by-h, ry=w*0.13, f=a.bg1;
  WZ.schatten(g,cx+5,by-2,w*0.7,ry*1.3,0.45);
  const body=()=>{ g.beginPath(); g.moveTo(cx-w/2,top); g.lineTo(cx-w/2,by-ry); g.ellipse(cx,by-ry,w/2,ry,0,Math.PI,0,true); g.lineTo(cx+w/2,top); g.closePath(); };
  body(); g.fillStyle=mg_zyl(g,cx-w/2,cx+w/2,f); g.fill();
  g.save(); body(); g.clip(); const band=(y1,y2,c)=>{ g.beginPath(); g.ellipse(cx,y1,w/2,ry,0,Math.PI,0,true); g.ellipse(cx,y2,w/2,ry,0,0,Math.PI,false); g.closePath(); g.fillStyle=mg_zyl(g,cx-w/2,cx+w/2,c); g.fill(); };
  band(top+h*0.3,top+h*0.44,a.ac); [top+h*0.12,by-ry*2.2].forEach(y=>{ g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=2; g.beginPath(); g.ellipse(cx,y,w/2,ry,0,0,Math.PI); g.stroke(); g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=1; g.beginPath(); g.ellipse(cx,y-1.5,w/2,ry,0,0,Math.PI); g.stroke(); });
  WZ.stern(g,cx,top+h*0.6,7,a.ac,5); mg_glanzband(g,cx-w*0.42,top,w*0.22,h,0.45); g.restore();
  g.fillStyle=mg_zyl(g,cx-w/2,cx+w/2,'#c4c8d0'); g.beginPath(); g.ellipse(cx,top,w/2,ry,0,0,Math.PI*2); g.fill(); WZ.ellipse(g,cx,top,w*0.4,ry*0.75,'#9aa0aa'); WZ.ellipse(g,cx,top-0.5,w*0.12,ry*0.3,'#5a5e66');
  const hy=by-h*0.24; WZ.rr(g,cx-5,hy-6,10,9,2); g.fillStyle=mg_zyl(g,cx-5,cx+5,'#d8dce4'); g.fill(); g.fillStyle=mg_zyl(g,cx-2,cx+2,'#c4c8d0'); g.fillRect(cx-2,hy+2,4,6);
  WZ.rr(g,cx-2.2,hy-20,4.4,15,2); g.fillStyle=mg_zyl(g,cx-2,cx+2,'#2a2a2a'); g.fill(); WZ.kreis(g,cx-0.8,hy-17,0.8,'rgba(255,255,255,.6)');
  mg_tropfen(g,cx,hy+12,1.6,'#f2b21a');
  mg_becher(g,88,95,32,46,{inhalt:'#f0a010',voll:0.72,schaum:11,blasen:14,rnd,henkel:1,unten:0.9,boden:0.1});
  g.restore();
}));
/* Gluehwein: dampfende Tasse, Zimt, Sternanis, Orange */
function mg_tasse(g,cx,by,w,h,f,inhalt,o){ o=o||{}; const top=by-h, ry=w*0.14;
  WZ.schatten(g,cx+w*0.08,by-1,w*0.75,ry*1.2,0.45);
  g.save(); g.lineWidth=w*0.13; g.strokeStyle=mg_f(f,-0.35); g.beginPath(); g.moveTo(cx+w*0.46,top+h*0.25); g.bezierCurveTo(cx+w*0.95,top+h*0.15,cx+w*0.95,top+h*0.85,cx+w*0.42,top+h*0.75); g.stroke(); g.lineWidth=w*0.05; g.strokeStyle=mg_f(f,0.25); g.stroke(); g.restore();
  const k=()=>{ g.beginPath(); g.moveTo(cx-w/2,top); g.lineTo(cx-w*0.44,by-ry); g.quadraticCurveTo(cx-w*0.42,by,cx,by); g.quadraticCurveTo(cx+w*0.42,by,cx+w*0.44,by-ry); g.lineTo(cx+w/2,top); g.closePath(); };
  k(); g.fillStyle=mg_zyl(g,cx-w/2,cx+w/2,f); g.fill(); if(o.muster){ g.save(); k(); g.clip(); o.muster(); mg_glanzband(g,cx-w*0.42,top,w*0.22,h,0.4); g.restore(); }
  WZ.ellipse(g,cx,top,w/2,ry,mg_f(f,0.2)); WZ.ellipse(g,cx,top+ry*0.1,w*0.44,ry*0.78,mg_f(inhalt,-0.3)); WZ.ellipse(g,cx+w*0.03,top+ry*0.2,w*0.38,ry*0.6,inhalt);
  g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx-w*0.12,top+ry*0.1,w*0.14,ry*0.2,0,0,Math.PI*2); g.fill(); return top; }
wareReg('gluehwein',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s,d)=>{ const k=Math.min(1,s/36); mg_anis(g,x,40,8*k,rnd()); mg_zimt(g,x,70,s*0.8,5*k,d*0.3); });
  g.save(); mg_mitte(g,W,100,55);
  const top=mg_tasse(g,48,94,50,48,'#b0182c','#7a1020',{muster:()=>{ for(let i=0;i<7;i++) WZ.stern(g,30+(i%4)*12+(i>3?6:0),60+(i>3?16:0),3.2,'rgba(255,255,255,.85)',5); }});
  mg_anis(g,52,top+2,5.5,0.3); mg_zimt(g,40,top-8,26,4,-1.1);
  mg_dampf(g,50,top-4,34,26,rnd);
  mg_scheibe(g,82,88,10,{schale:'#f28a1c',fleisch:'#ffa21c',ry:0.55}); mg_anis(g,16,90,7,0.5); mg_zimt(g,18,80,22,4.5,0.15);
  g.restore();
}));
/* Feuerzangenbowle: Kupferkessel, Zange, brennender Zuckerhut */
wareReg('bowle',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ const k=Math.min(1,s/36); mg_frucht(g,x,82,9*k,'#f28a1c'); mg_scheibe(g,x,58,8*k,{schale:'#f28a1c',fleisch:'#ffa21c'}); });
  g.save(); mg_mitte(g,W,100,55);
  const cx=50, y0=58, rx=40, ry=10, by=94;
  WZ.schatten(g,cx+4,by,rx*1.1,ry*1.1,0.5);
  g.beginPath(); g.moveTo(cx-rx,y0); g.bezierCurveTo(cx-rx,y0+28,cx-rx*0.5,by,cx,by); g.bezierCurveTo(cx+rx*0.5,by,cx+rx,y0+28,cx+rx,y0); g.closePath();
  const kg=g.createRadialGradient(cx-rx*0.4,y0+8,2,cx,y0+10,rx*1.2); kg.addColorStop(0,'#ffc48a'); kg.addColorStop(0.3,'#c8703a'); kg.addColorStop(1,'#4a1a08'); g.fillStyle=kg; g.fill();
  WZ.ellipse(g,cx,y0,rx,ry,'#e89a5a'); WZ.ellipse(g,cx,y0+1,rx*0.92,ry*0.8,'#5a0812');
  g.save(); g.beginPath(); g.ellipse(cx,y0+1,rx*0.92,ry*0.8,0,0,Math.PI*2); g.clip(); WZ.ellipse(g,cx-8,y0-1,rx*0.5,ry*0.3,'rgba(255,140,60,.35)');
  [[-22,2],[18,3],[-4,5],[28,-2]].forEach(([dx,dy],i)=>mg_scheibe(g,cx+dx,y0+dy,7,{schale:'#f28a1c',fleisch:'#ffa21c',ry:0.35,rot:i*0.3})); g.restore();
  /* Zange */
  g.strokeStyle='#5a5e66'; g.lineWidth=2.4; g.beginPath(); g.moveTo(cx-rx-4,y0-4); g.lineTo(cx+rx+4,y0-4); g.moveTo(cx-rx-2,y0+1); g.lineTo(cx+rx+2,y0+1); g.stroke(); g.strokeStyle='#c4c8d0'; g.lineWidth=1; g.beginPath(); g.moveTo(cx-rx-4,y0-4.6); g.lineTo(cx+rx+4,y0-4.6); g.stroke();
  g.strokeStyle='#7a7e86'; g.lineWidth=1.2; g.beginPath(); for(let i=-3;i<=3;i++){ g.moveTo(cx+i*5,y0-4); g.lineTo(cx+i*5+1,y0+1); } g.stroke();
  /* Zuckerhut mit Flammen */
  const zt=y0-34; WZ.leucht(g,cx,y0-16,34,'#ff8a1a',0.55);
  g.beginPath(); g.moveTo(cx,zt); g.lineTo(cx+11,y0-5); g.quadraticCurveTo(cx,y0-2,cx-11,y0-5); g.closePath(); const zg=g.createLinearGradient(cx-11,0,cx+11,0); zg.addColorStop(0,'#fff8ec'); zg.addColorStop(0.5,'#f0d8b0'); zg.addColorStop(1,'#a8682a'); g.fillStyle=zg; g.fill();
  const cg=g.createLinearGradient(0,zt,0,y0); cg.addColorStop(0,'rgba(120,60,10,0)'); cg.addColorStop(1,'rgba(140,70,10,.75)'); g.fillStyle=cg; g.fill();
  for(let i=0;i<9;i++){ const fx=cx-12+i*3, fh=10+rnd()*16, fy=y0-5-Math.abs(i-4)*2; g.beginPath(); g.moveTo(fx-2.5,fy); g.quadraticCurveTo(fx-3,fy-fh*0.5,fx+(rnd()-0.5)*4,fy-fh); g.quadraticCurveTo(fx+3,fy-fh*0.5,fx+2.5,fy); g.closePath();
    const fg=g.createLinearGradient(0,fy,0,fy-fh); fg.addColorStop(0,'rgba(80,140,255,.85)'); fg.addColorStop(0.3,'rgba(255,170,40,.85)'); fg.addColorStop(1,'rgba(255,230,120,0)'); g.fillStyle=fg; g.fill(); }
  for(let i=0;i<3;i++) mg_tropfen(g,cx-6+i*6,y0-1+i%2*2,0.9,'#c8701a');
  g.restore();
}));
/* Rose-Sekt: rosa Floete, Rose, Bluetenblaetter */
wareReg('rosesekt',mg((g,W,rnd,a)=>{
  const bl=(x,y,s,r)=>{ g.save(); g.translate(x,y); g.rotate(r); const gr=g.createLinearGradient(-s,-s,s,s); gr.addColorStop(0,'#ffd0dc'); gr.addColorStop(1,'#d8507a'); g.fillStyle=gr; g.beginPath(); g.moveTo(0,s*0.8); g.bezierCurveTo(-s*1.1,0,-s*0.5,-s,0,-s*0.5); g.bezierCurveTo(s*0.5,-s,s*1.1,0,0,s*0.8); g.fill(); g.restore(); };
  for(let i=0;i<9;i++) bl(rnd()*W,4+rnd()*55,2+rnd()*2.5,rnd()*6);
  g.save(); mg_mitte(g,W,96,55);
  mg_kelch(g,58,95,82,'flute',{inhalt:'#f7a0b4',oben:0.16,blasen:20,rnd});
  mg_rose(g,24,80,14,'#e0406a'); bl(80,92,3.5,0.6); bl(88,85,2.8,2.2); g.restore();
}));
/* Pils 6er: braune Flaschen und Pilstulpe */
wareReg('bier',mg((g,W,rnd,a)=>{
  const n=W>=150?5:3; g.save(); mg_mitte(g,W,n===5?170:112,55);
  const fl=(cx,by,h)=>mg_fl(g,cx,by,h,h*0.26,'bier',{farbe:'#6a3810',etikett:'#e8e2c8',etikettT:[0.16,0.44],kapsel:'#e8c35a',hals:'#e8c35a',deko:(x,y,w,hh)=>{ g.fillStyle=mg_zyl(g,x-w/2,x+w/2,a.bg1); g.fillRect(x-w/2,y+hh*0.3,w,hh*0.4); WZ.kreis(g,x,y+hh*0.5,w*0.18,a.ac); }});
  for(let i=0;i<n;i++){ const cx=16+i*17+(i%2)*2; fl(cx,i%2?92:86,i%2?74:70); }
  const gx=n===5?140:88; mg_kelch(g,gx,95,72,'pils',{inhalt:'#f2b01a',oben:0.2,schaum:0.16,blasen:18,rnd,krone:1});
  g.restore();
}));
/* Cola: PET-Flaschen, Glas mit Eis und Zitrone */
wareReg('cola',mg((g,W,rnd,a)=>{
  const n=W>=150?3:2; g.save(); mg_mitte(g,W,n===3?150:110,55);
  for(let i=0;i<n;i++){ const cx=18+i*24, by=i%2?95:89; mg_fl(g,cx,by,76,24,'pet',{farbe:'#3a1206',kapsel:'#d01020',etikett:'#d01020',etikettT:[0.4,0.58],perlen:8,rnd,deko:(x,y,w,h)=>{ g.strokeStyle='#ffffff'; g.lineWidth=h*0.16; g.beginPath(); g.moveTo(x-w/2,y+h*0.65); g.bezierCurveTo(x-w*0.1,y+h*0.1,x+w*0.1,y+h*0.95,x+w/2,y+h*0.35); g.stroke(); }}); }
  const gx=n===3?118:82; mg_strohhalm(g,gx+4,62,gx+14,30,3,'#ffffff','#d01020',0.9);
  mg_becher(g,gx,95,32,50,{inhalt:'#2a0c04',voll:0.84,blasen:22,rnd,innen:(fy,hw)=>{ mg_eis(g,gx-6,fy+3,11,0.3,0.75); mg_eis(g,gx+7,fy+5,10,-0.4,0.7); }});
  mg_scheibe(g,gx-14,46,9,{schale:'#e8d21a',fleisch:'#f6ec6a',ry:0.9,rot:0.2});
  g.restore();
}));
/* Kinderpunsch: Henkelglas mit Punsch, Apfel, Zimtstern */
wareReg('kinderpunsch',mg((g,W,rnd,a)=>{
  const zs=(x,y,r)=>{ WZ.schatten(g,x+r*0.2,y+r*0.6,r*1.1,r*0.3,0.35); g.fillStyle='#c8904a'; stern(g,x,y+r*0.12,r,5,0.5); g.fill(); g.fillStyle='#fffaf0'; stern(g,x,y,r*0.9,5,0.5); g.fill(); };
  mg_seiten(W,(x,s)=>{ const k=Math.min(1,s/36); zs(x,40,8*k); mg_frucht(g,x,76,9*k,'#d8202a',{stiel:1}); });
  g.save(); mg_mitte(g,W,100,55);
  const r=mg_becher(g,46,94,40,52,{inhalt:'#d8481e',voll:0.8,henkel:1,unten:0.92,boden:0.1,innen:(fy)=>{ mg_apfelspalte(g,38,fy+12,6,0.4); mg_scheibe(g,54,fy+18,7,{schale:'#f28a1c',fleisch:'#ffa21c',ry:0.9}); }});
  mg_zimt(g,34,r.top-4,28,4,-1.2); mg_scheibe(g,58,r.top+2,9,{schale:'#f28a1c',fleisch:'#ffa21c',rot:0.3});
  mg_dampf(g,46,r.top-6,32,26,rnd);
  mg_frucht(g,84,86,10,'#d8202a',{stiel:1,blatt:'#3f8a2a'}); zs(14,88,8); zs(22,95,6);
  g.restore();
}));
/* Energydrink: schwarze Dosen mit Blitz, Funken */
wareReg('energy',mg((g,W,rnd,a)=>{
  for(let i=0;i<5;i++){ const x=rnd()*W, y=rnd()*50; mg_zacke(g,x,y,x+(rnd()-0.5)*30,y+15+rnd()*20,6,rnd,i%2?a.ac2:a.ac,0.8); }
  const n=W>=150?3:2; g.save(); mg_mitte(g,W,n===3?130:100,55);
  const deko=(cx,top,w,h)=>{ g.fillStyle=mg_zyl(g,cx-w/2,cx+w/2,a.ac2); g.fillRect(cx-w/2,top+h*0.78,w,h*0.04); WZ.leucht(g,cx,top+h*0.45,w*0.6,a.ac,0.5); mg_blitz(g,cx,top+h*0.45,h*0.5,a.ac); g.strokeStyle='#ffffff'; g.lineWidth=0.6; g.stroke(); };
  for(let i=0;i<n;i++){ const cx=n===3?[34,66,98][i]:[36,64][i], by=[86,95,86][i]; mg_dose(g,cx,by,30,i===1?72:68,'#1c1c2a',{deko}); }
  mg_zacke(g,50,8,46,24,5,rnd,a.ac,1); mg_zacke(g,14,30,6,48,5,rnd,a.ac2,0.8);
  g.restore();
}));
/* Orangensaft: Glas, Orangenhaelften, ganze Orange mit Blatt */
wareReg('orangensaft',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ const k=Math.min(1,s/36); mg_frucht(g,x,70,12*k,'#f28a1c',{blatt:'#2f7a2a'}); });
  g.save(); mg_mitte(g,W,108,55);
  mg_frucht(g,26,60,15,'#f28a1c',{blatt:'#2f7a2a',stiel:1});
  const r=mg_becher(g,74,95,34,62,{inhalt:'#ffa018',voll:0.86,blasen:8,rnd});
  mg_scheibe(g,90,r.top+4,11,{schale:'#f28a1c',fleisch:'#ffa21c',n:11,rot:0.35});
  mg_haelfte(g,22,86,15,{schale:'#f28a1c',ry:0.45}); mg_haelfte(g,48,92,11,{schale:'#ef7a10',ry:0.5});
  mg_tropfen(g,52,72,1.6,'#ffa018'); mg_tropfen(g,57,66,1.1,'#ffa018');
  g.restore();
}));
/* Champagner: Pyramide aus Sektschalen */
wareReg('champagner',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ for(let i=0;i<5;i++) mg_funkel(g,x+(rnd()-0.5)*s,10+rnd()*80,(2+rnd()*3)*Math.min(1,s/30),'#ffe9a8'); });
  g.save(); mg_mitte(g,W,100,55);
  const n=3, hc=29, st=hc*0.82;
  for(let row=0;row<n;row++){ const m=n-row, by=97-row*st; for(let i=0;i<m;i++){ const cx=50+(i-(m-1)/2)*hc*0.92; mg_kelch(g,cx,by,hc,'schale',{inhalt:'#f0cc60',oben:0.05,blasen:4,rnd,ohneSchatten:row>0}); } }
  g.strokeStyle='rgba(240,204,96,.8)'; g.lineWidth=1.2; for(let row=1;row<n;row++){ const m=n-row, y=97-row*st-hc; for(const s of [-1,1]){ const x=50+s*((m-1)/2*hc*0.92+hc*0.4); g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+s*2,y+5,x+s*1.5,y+st*0.6); g.stroke(); } }
  g.save(); g.globalCompositeOperation='lighter'; g.strokeStyle='rgba(255,220,120,.85)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(58,0); g.quadraticCurveTo(52,4,51,97-(n-1)*st-hc*0.95); g.stroke(); g.restore();
  for(let i=0;i<6;i++) mg_funkel(g,15+rnd()*70,8+rnd()*30,1.5+rnd()*2.5,'#fff0c0');
  g.restore();
}));
/* Cocktail-Set: Shaker, Martiniglas mit Olive, Schale mit Schirmchen */
wareReg('cocktailset',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ for(let i=0;i<3;i++) WZ.stern(g,x+(rnd()-0.5)*s,15+rnd()*70,2.5*Math.min(1,s/30),i%2?a.ac:a.ac2,4); });
  g.save(); mg_mitte(g,W,108,55);
  /* Shaker */
  const sx=56, sb=74; WZ.schatten(g,sx,sb,14,3,0.4); g.fillStyle=mg_zyl(g,sx-11,sx+11,'#c8ccd6'); g.beginPath(); g.moveTo(sx-11,sb); g.lineTo(sx-13,sb-40); g.lineTo(sx+13,sb-40); g.lineTo(sx+11,sb); g.closePath(); g.fill();
  g.fillStyle=mg_zyl(g,sx-12,sx+12,'#dfe2ea'); g.beginPath(); g.moveTo(sx-13,sb-40); g.lineTo(sx-9,sb-52); g.lineTo(sx+9,sb-52); g.lineTo(sx+13,sb-40); g.closePath(); g.fill(); g.fillStyle=mg_zyl(g,sx-5,sx+5,'#c8ccd6'); WZ.rr(g,sx-5,sb-60,10,9,3); g.fill();
  g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(sx-13,sb-41,26,1.5);
  /* Martini */
  const m=mg_kelch(g,26,96,58,'martini',{inhalt:'#3ad6e8',oben:0.14});
  g.strokeStyle='#e8d8b0'; g.lineWidth=1; g.beginPath(); g.moveTo(16,m.top-10); g.lineTo(32,m.top+14); g.stroke(); WZ.kugel(g,27,m.top+9,4,'#6a8a2a'); WZ.kreis(g,25.5,m.top+8,1.4,'#d8302a');
  /* Schale */
  const c=mg_kelch(g,84,96,52,'schale',{inhalt:'#ff4fa8',oben:0.12,blasen:5,rnd});
  WZ.kugel(g,c.R+84-4,c.top-3,4,'#c8102a'); g.strokeStyle='#3a6a1a'; g.lineWidth=0.9; g.beginPath(); g.moveTo(84+c.R-4,c.top-6.5); g.quadraticCurveTo(84+c.R,c.top-14,84+c.R+4,c.top-15); g.stroke();
  g.strokeStyle='#8a6a3a'; g.lineWidth=1; g.beginPath(); g.moveTo(80,c.top+4); g.lineTo(72,c.top-20); g.stroke();
  const ux=71, uy=c.top-21; ['#ff4fa8','#ffd23f','#5ce1ff','#9cff3a','#ff4fa8'].forEach((f,i)=>{ g.fillStyle=f; g.beginPath(); g.moveTo(ux,uy-5); const a0=Math.PI*(0.95+i*0.22), a1=a0+Math.PI*0.22; g.lineTo(ux+Math.cos(a0)*16,uy+Math.sin(a0)*5); g.lineTo(ux+Math.cos(a1)*16,uy+Math.sin(a1)*5); g.closePath(); g.fill(); });
  g.restore();
}));
/* Rotwein: grosses Glas, blaue Trauben mit Weinblatt */
wareReg('rotwein',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ const k=Math.min(1,s/36); mg_traube(g,x,30,22*k,'#4a1a52',rnd,{reihen:[3,4,3,2,1]}); });
  g.save(); mg_mitte(g,W,104,55);
  mg_traube(g,28,22,36,'#3e1648',rnd,{blatt:'#3f7a2a',blattX:0.35,blattY:-0.1,blattRot:0.4});
  mg_kelch(g,70,96,84,'wein',{inhalt:'#6a0a1e',oben:0.5});
  g.restore();
}));
/* Weisswein: Glas Riesling, gruene Trauben haengen von oben */
wareReg('weisswein',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ const k=Math.min(1,s/36); mg_weinblatt(g,x,30,14*k,rnd()*3,'#5a9a3a'); mg_traube(g,x,52,18*k,'#b8d468',rnd,{reihen:[3,4,3,2,1]}); });
  g.save(); mg_mitte(g,W,104,55);
  mg_weinblatt(g,78,6,16,0.8,'#5a9a3a'); mg_weinblatt(g,96,14,12,2.2,'#4a8a2a');
  mg_traube(g,80,12,32,'#b8d468',rnd,{reihen:[4,5,4,4,3,2,1]});
  mg_kelch(g,38,96,80,'wein',{inhalt:'#ecd46a',oben:0.46});
  g.restore();
}));
/* Eierlikoer: Likoerglas, dickgelb; Eier und aufgeschlagene Schale */
wareReg('eierlikoer',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ const k=Math.min(1,s/36); mg_ei(g,x,72,10*k,'#f4ece0',0.2); });
  g.save(); mg_mitte(g,W,104,55);
  mg_ei(g,18,80,11,'#d8a070',-0.2); mg_ei(g,32,88,10,'#f4ece0',0.15);
  const k=mg_kelch(g,62,96,66,'likoer',{inhalt:'#f5c818',oben:0.08});
  g.fillStyle='#f5c818'; g.beginPath(); g.moveTo(62-k.R*0.4,k.top+1); g.quadraticCurveTo(62-k.R*0.95,k.top+6,62-k.R*0.98,k.top+12); g.lineTo(62-k.R*0.8,k.top+4); g.fill();
  /* aufgeschlagene Schale mit Dotter */
  const sx=90, sy=88, r=9; WZ.schatten(g,sx+2,sy+6,r*1.1,2.5,0.35);
  g.beginPath(); g.ellipse(sx,sy,r*0.85,r*0.9,0,0,Math.PI); for(let i=0;i<=8;i++) g.lineTo(sx-r*0.85+i*r*0.2125,sy-(i%2?r*0.35:0)); g.closePath(); const sg=g.createRadialGradient(sx-3,sy-2,1,sx,sy,r); sg.addColorStop(0,'#fff8ee'); sg.addColorStop(1,'#c8b49a'); g.fillStyle=sg; g.fill();
  WZ.ellipse(g,sx,sy-0.5,r*0.7,r*0.22,'#e8dcc8'); WZ.kugel(g,sx,sy-1.5,r*0.38,'#ffb012');
  g.restore();
}));
/* Sahnelikoer: Tumbler mit Eis, Sahneschlieren, Kaffeebohnen */
wareReg('likoer',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ for(let i=0;i<5;i++) mg_bohne(g,x+(rnd()-0.5)*s*0.8,25+rnd()*60,3.5*Math.min(1,s/30),rnd()*3); });
  g.save(); mg_mitte(g,W,100,55);
  const gx=50; mg_becher(g,gx,92,48,50,{inhalt:'#b88a5a',voll:0.66,unten:0.92,boden:0.16,innen:(fy,hw)=>{
    g.strokeStyle='rgba(255,246,228,.85)'; g.lineWidth=3; g.beginPath(); g.moveTo(gx-hw*0.8,fy+6); g.bezierCurveTo(gx-hw*0.2,fy+18,gx+hw*0.3,fy-2,gx+hw*0.85,fy+12); g.stroke();
    g.lineWidth=1.8; g.beginPath(); g.moveTo(gx-hw*0.7,fy+20); g.bezierCurveTo(gx,fy+12,gx+hw*0.2,fy+26,gx+hw*0.8,fy+18); g.stroke();
    mg_eis(g,gx-9,fy-2,15,0.25,0.85); mg_eis(g,gx+9,fy+1,13,-0.3,0.8); }});
  [[14,88,0.4],[22,95,2],[80,90,1.2],[88,96,-0.6],[74,97,2.6],[10,96,1]].forEach(([x,y,r])=>mg_bohne(g,x,y,4,r));
  g.restore();
}));
/* Magnum: Korken knallt, Fontaene in drei Floeten */
wareReg('magnum',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ for(let i=0;i<5;i++) mg_funkel(g,x+(rnd()-0.5)*s,10+rnd()*80,(2+rnd()*3)*Math.min(1,s/30),'#ffe9a8'); });
  g.save(); mg_mitte(g,W,108,55);
  /* Fontaene */
  for(let i=0;i<70;i++){ const t=rnd(), s=rnd()<0.5?-1:1, sp=0.5+rnd()*0.5, x=54+s*t*44*sp, y=30-Math.sin(t*Math.PI*0.9)*24*sp+t*t*20; WZ.kreis(g,x,y,0.6+rnd()*1.4,rnd()<0.6?'rgba(255,240,190,.9)':'rgba(240,204,96,.85)'); }
  /* Korken mit Agraffe */
  g.save(); g.translate(54,10); g.rotate(0.35); g.fillStyle=mg_zyl(g,-5,5,'#c8985a'); WZ.rr(g,-4.5,-2,9,11,1.5); g.fill(); WZ.ellipse(g,0,-2,6.5,3,'#d8a868'); WZ.ellipse(g,0,-3,6,2.2,'#e8c35a'); g.strokeStyle='#c4c8d0'; g.lineWidth=0.7; g.beginPath(); g.moveTo(-4.5,4); g.lineTo(-3,-2); g.moveTo(4.5,4); g.lineTo(3,-2); g.moveTo(-4.5,5); g.lineTo(4.5,5); g.stroke(); g.restore();
  g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=1; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(44-i*3,16+i*3); g.lineTo(38-i*4,20+i*4); g.stroke(); }
  [[20,0.12],[54,0],[88,-0.12]].forEach(([x,r],i)=>{ g.save(); g.translate(x,97); g.rotate(r); mg_kelch(g,0,0,i===1?58:54,'flute',{inhalt:'#f0cc60',oben:0.22,blasen:12,rnd,neig:r}); g.restore(); });
  g.restore();
}));
/* Kindersekt Erdbeere: Floete erdbeerrot, Erdbeeren */
wareReg('kindersekt2',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ const k=Math.min(1,s/36); mg_erdbeere(g,x,40,7*k,0.4); mg_erdbeere(g,x,74,8*k,-0.3); });
  WZ.konfetti(g,0,0,W,40,10,['#ffe45c','#ffffff','#ff9ab8'],1.4,rnd);
  g.save(); mg_mitte(g,W,100,55);
  const k=mg_kelch(g,50,95,82,'flute',{inhalt:'#ff4a6e',oben:0.16,blasen:18,rnd});
  mg_erdbeere(g,50+k.R+1,k.top+2,7,0.5);
  mg_erdbeere(g,18,86,10,-0.3); mg_erdbeere(g,30,93,8,0.4); mg_erdbeere(g,82,90,9,0.25);
  g.restore();
}));
/* Mineralwasser: Glas mit Spritzkrone, grosser Tropfen, Perlen */
wareReg('wasser',mg((g,W,rnd,a)=>{
  for(let i=0;i<24;i++){ const x=rnd()*W, y=rnd()*100, r=0.6+rnd()*2.2; g.strokeStyle='rgba(255,255,255,.5)'; g.lineWidth=0.6; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.stroke(); }
  g.save(); mg_mitte(g,W,100,55);
  const gx=54, r=mg_becher(g,gx,95,40,58,{inhalt:'#7cc8f0',voll:0.78,blasen:26,rnd,unten:0.84,boden:0.1});
  for(let i=0;i<12;i++){ const an=-Math.PI*(0.1+0.8*i/11), d=12+rnd()*12; const x=gx+Math.cos(an)*d*1.3, y=r.fy-4+Math.sin(an)*d; mg_tropfen(g,x,y,1+rnd()*1.2,'#bfe8ff'); }
  g.strokeStyle='rgba(220,244,255,.85)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(gx-16,r.fy); g.quadraticCurveTo(gx-12,r.fy-12,gx-6,r.fy-4); g.moveTo(gx+16,r.fy); g.quadraticCurveTo(gx+12,r.fy-12,gx+6,r.fy-4); g.stroke();
  mg_tropfen(g,gx,r.fy-16,3,'#bfe8ff');
  mg_tropfen(g,18,72,10,'#5ab8ee'); mg_tropfen(g,84,86,4,'#5ab8ee');
  g.restore();
}));
/* Goldsekt: Floete mit Blattgold-Flocken, Goldregen */
wareReg('goldsekt',mg((g,W,rnd,a)=>{
  for(let i=0;i<22;i++) mg_blattgold(g,rnd()*W,rnd()*92,1+rnd()*2.4,rnd()*6,rnd);
  g.save(); mg_mitte(g,W,96,55);
  WZ.leucht(g,48,40,40,'#ffd23f',0.35);
  mg_kelch(g,48,95,84,'flute',{inhalt:'#e8b428',oben:0.15,blasen:12,rnd,innen:(fy)=>{ for(let i=0;i<9;i++) mg_blattgold(g,48+(rnd()-0.5)*16,fy+4+rnd()*40,1.4+rnd()*1.6,rnd()*6,rnd); }});
  for(let i=0;i<5;i++) mg_funkel(g,10+rnd()*76,6+rnd()*70,2+rnd()*3,'#fff3b0');
  g.restore();
}));
/* Jahrgang: Tulpenglas, Korken mit Agraffe, dunkle Trauben, Siegel 2017 */
wareReg('jahrgang',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ for(let i=0;i<4;i++) mg_funkel(g,x+(rnd()-0.5)*s,10+rnd()*80,(2+rnd()*2)*Math.min(1,s/30),'#d1e5ff'); });
  g.save(); mg_mitte(g,W,104,55);
  mg_traube(g,20,40,30,'#3a2050',rnd,{reihen:[3,4,4,3,2,1],blatt:'#3f6a2a',blattX:0.3,blattY:-0.15,blattRot:0.6});
  mg_kelch(g,54,96,82,'tulpe',{inhalt:'#ead27a',oben:0.18,blasen:16,rnd});
  /* Korken */
  g.save(); g.translate(86,90); g.rotate(-1.3); WZ.schatten(g,0,5,10,3,0.35); g.fillStyle=mg_zyl(g,-5,5,'#c89a5a'); WZ.rr(g,-4.5,-4,9,12,2); g.fill(); WZ.ellipse(g,0,-4,7,3.4,'#b88a4a'); WZ.ellipse(g,0,-5,6.2,2.6,'#e8c35a'); WZ.ellipse(g,0,-5,3,1.2,'#a88a2a');
  g.strokeStyle='#c4c8d0'; g.lineWidth=0.8; g.beginPath(); g.moveTo(-5,6); g.lineTo(-3,-4); g.moveTo(5,6); g.lineTo(3,-4); g.moveTo(0,-4); g.lineTo(0,6); g.moveTo(-5,6.5); g.lineTo(5,6.5); g.stroke(); g.restore();
  /* Siegel */
  const sx=86, sy=58, sr=11; WZ.schatten(g,sx+1,sy+sr,sr,3,0.3); g.fillStyle='#8a1c1c'; stern(g,sx,sy,sr,16,0.86); g.fill(); WZ.kugel(g,sx,sy,sr*0.8,'#a82424','#e86060'); WZ.txt(g,'2017',sx,sy+0.5,sr*1.3,sr*0.75,WFNT.serif,'#f2d27a');
  g.restore();
}));
/* Prosecco: Floete, gruene Trauben mit Weinblatt, Zitronenzeste */
wareReg('prosecco',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ const k=Math.min(1,s/36); mg_weinblatt(g,x,50,13*k,rnd()*3,'#4a7a1a'); });
  g.save(); mg_mitte(g,W,100,55);
  mg_traube(g,70,30,32,'#c8dc6a',rnd,{blatt:'#3f7a2a',blattX:0.4,blattY:-0.05,blattRot:0.3});
  const k=mg_kelch(g,38,95,84,'flute',{inhalt:'#e6e090',oben:0.14,blasen:22,rnd});
  g.strokeStyle='#f2d21b'; g.lineWidth=2.2; g.beginPath(); for(let i=0;i<=24;i++){ const t=i/24; g.lineTo(38-k.R-2+Math.sin(t*12)*2.6,k.top-4+t*22); } g.stroke();
  g.restore();
}));
/* Radler: Seidel halb Bier halb Zitrone, Zitronen */
wareReg('radler',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ const k=Math.min(1,s/36); mg_frucht(g,x,66,11*k,'#f2d21b',{zitrone:1,blatt:'#2f7a2a'}); });
  g.save(); mg_mitte(g,W,108,55);
  const gx=64, r=mg_becher(g,gx,95,40,62,{inhalt:'#f0cc3a',voll:0.7,schaum:12,blasen:22,rnd,henkel:1,unten:0.9,boden:0.1});
  mg_scheibe(g,gx-18,r.top+8,11,{schale:'#f2d21b',fleisch:'#f8ec7a',rot:-0.3,kerne:1});
  mg_frucht(g,20,76,13,'#f2d21b',{zitrone:1,rot:-0.2,blatt:'#2f7a2a'}); mg_haelfte(g,30,92,10,{schale:'#f2d21b',fleisch:'#f8ec7a',n:9,ry:0.5});
  g.restore();
}));
/* Pils alkoholfrei: gruene Flaschen mit blauem Etikett, Hopfen, Gerste, Tau */
wareReg('bierfrei',mg((g,W,rnd,a)=>{
  const n=W>=150?3:2; g.save(); mg_mitte(g,W,n===3?140:108,55);
  const x0=n===3?50:34; mg_aehre(g,x0-22,96,54,-0.35); mg_aehre(g,x0-16,96,50,-0.12);
  for(let i=0;i<n;i++){ mg_fl(g,x0+i*22,i%2?95:90,78,20,'bier',{farbe:'#2f7a3a',etikett:'#1557a8',etikettT:[0.16,0.44],kapsel:'#ffd23f',hals:'#1557a8',perlen:14,rnd,deko:(x,y,w,h)=>{ g.fillStyle=mg_zyl(g,x-w/2,x+w/2,'#ffd23f'); g.fillRect(x-w/2,y+h*0.12,w,h*0.1); g.fillRect(x-w/2,y+h*0.78,w,h*0.1); WZ.kreis(g,x,y+h*0.5,w*0.2,'#e8e2c8'); }}); }
  mg_hopfen(g,x0+n*22+2,70,10,0.3); mg_hopfen(g,x0+n*22-6,88,8,-0.4);
  g.restore();
}));
/* Zitronenlimonade: Buegelflasche, Glas mit Minze, Zitronen */
wareReg('limonade',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ const k=Math.min(1,s/36); mg_scheibe(g,x,40,9*k,{schale:'#f2d21b',fleisch:'#f8ec7a'}); mg_frucht(g,x,76,10*k,'#f2d21b',{zitrone:1}); });
  g.save(); mg_mitte(g,W,110,55);
  mg_fl(g,26,93,78,26,'buegel',{farbe:'#d8d070',leer:0.88,etikett:'#ffffff',etikettT:[0.18,0.42],deko:(x,y,w,h)=>{ mg_scheibe(g,x,y+h/2,h*0.32,{schale:'#e8c21a',fleisch:'#f8ec7a',n:8}); }});
  const gx=70, r=mg_becher(g,gx,95,32,52,{inhalt:'#f4e682',voll:0.8,blasen:12,rnd,innen:(fy)=>{ mg_eis(g,gx-6,fy+4,10,0.3,0.8); mg_scheibe(g,gx+5,fy+16,7,{schale:'#e8c21a',fleisch:'#f8ec7a',n:8,rot:0.4}); }});
  mg_minze(g,gx+4,r.top-6,14,0.25); mg_scheibe(g,gx-14,r.top+3,9,{schale:'#e8c21a',fleisch:'#f8ec7a',rot:-0.2,kerne:1});
  mg_frucht(g,98,86,10,'#f2d21b',{zitrone:1,rot:0.3}); mg_haelfte(g,48,93,8,{schale:'#f2d21b',fleisch:'#f8ec7a',n:9,ry:0.5});
  g.restore();
}));
/* Party-Kurze: bunte Shotglaeser, Feigen */
wareReg('kurze',mg((g,W,rnd,a)=>{
  const fb=['#7a1f5a','#e8b418','#c8203a','#2aa84a','#9a3ab8','#ff7a1a','#3a8ae8'];
  const n=Math.max(3,Math.min(7,Math.round(W/26))), sp=(W-6)/n, sw=Math.min(20,sp*0.82), sh=sw*1.35;
  for(let i=0;i<n-1;i++) mg_becher(g,3+sp*(i+1),56,sw*0.86,sh*0.86,{inhalt:fb[(i+3)%fb.length],voll:0.72,unten:0.72,boden:0.25});
  for(let i=0;i<n;i++) mg_becher(g,3+sp*(i+0.5),82,sw,sh,{inhalt:fb[i%fb.length],voll:0.75,unten:0.72,boden:0.25});
  mg_feige(g,Math.min(W*0.2,24),88,8,1,-0.3); mg_feige(g,W-Math.min(W*0.2,24),89,8,0,0.25); if(W>=120) mg_feige(g,W/2,92,7,1,0.1);
}));
/* Hugo: grosses Weinglas mit Eis, Minze, Limette, Holunderbluete */
function mg_holunder(g,x,y,s,rnd){ g.strokeStyle='#5a7a2a'; g.lineWidth=s*0.03; for(let i=0;i<7;i++){ const an=-Math.PI/2+(i-3)*0.28, ex=x+Math.cos(an)*s*0.55, ey=y+Math.sin(an)*s*0.55; g.beginPath(); g.moveTo(x,y); g.lineTo(ex,ey); g.stroke();
  for(let j=0;j<9;j++){ const bx=ex+(rnd()-0.5)*s*0.2, by=ey+(rnd()-0.5)*s*0.14; WZ.kreis(g,bx,by,s*0.03,'#c8b47a'); WZ.kreis(g,bx-s*0.006,by-s*0.006,s*0.026,'#fffbe8'); } } }
wareReg('hugo',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ const k=Math.min(1,s/36); mg_holunder(g,x,70,30*k,rnd); mg_scheibe(g,x,84,7*k,{schale:'#5aa02a',fleisch:'#b8e070'}); });
  g.save(); mg_mitte(g,W,104,55);
  mg_holunder(g,18,72,40,rnd); mg_holunder(g,90,76,30,rnd);
  const gx=54, k=mg_kelch(g,gx,96,86,'wein',{inhalt:'#e4ecb0',oben:0.12,blasen:12,rnd,innen:(fy,hw)=>{
    mg_eis(g,gx-10,fy+8,12,0.3,0.75); mg_eis(g,gx+9,fy+6,11,-0.4,0.75); mg_scheibe(g,gx+4,fy+20,8,{schale:'#5aa02a',fleisch:'#b8e070',rot:0.5}); mg_blatt(g,gx-14,fy+22,10,-0.4,'#3fa040'); mg_blatt(g,gx+10,fy+30,9,2.6,'#3fa040'); }});
  mg_minze(g,gx-6,k.top-4,16,-0.25); mg_scheibe(g,gx+k.R-2,k.top+1,9,{schale:'#5aa02a',fleisch:'#b8e070',rot:0.3});
  g.restore();
}));
/* Gin Tonic: Copa-Glas, Gurkenband, Limette, Wacholder */
function mg_gurke(g,x,y,r,rot,ry){ g.save(); g.translate(x,y); g.rotate(rot||0); g.scale(1,ry||1); WZ.kreis(g,0,0,r,'#2a6a22'); WZ.kreis(g,0,0,r*0.86,'#d8f0b0'); WZ.kreis(g,0,0,r*0.5,'#c0e090'); for(let i=0;i<6;i++){ const an=i/6*Math.PI*2; WZ.ellipse(g,Math.cos(an)*r*0.32,Math.sin(an)*r*0.32,r*0.1,r*0.06,'#f4fae0',an); } g.restore(); }
wareReg('gintonic',mg((g,W,rnd,a)=>{
  mg_seiten(W,(x,s)=>{ const k=Math.min(1,s/36); mg_gurke(g,x,46,8*k,0,1); for(let i=0;i<4;i++) WZ.kugel(g,x+(rnd()-0.5)*s*0.6,74+rnd()*14,2.6*k,'#2a3a6a','#8aa0d8'); });
  g.save(); mg_mitte(g,W,104,55);
  const gx=52, k=mg_kelch(g,gx,96,82,'copa',{inhalt:'#dceefa',oben:0.14,blasen:30,rnd,innen:(fy,hw)=>{
    mg_eis(g,gx-12,fy+9,13,0.2,0.8); mg_eis(g,gx+11,fy+7,12,-0.35,0.8); mg_eis(g,gx,fy+20,12,0.6,0.7);
    g.strokeStyle='#2a6a22'; g.lineWidth=4.5; g.beginPath(); for(let i=0;i<=30;i++){ const t=i/30; g.lineTo(gx-hw*0.65+t*hw*1.3,fy+6+t*30+Math.sin(t*9)*6); } g.stroke(); g.strokeStyle='#d8f0b0'; g.lineWidth=3; g.stroke();
    for(let i=0;i<4;i++) WZ.kugel(g,gx-12+i*8,fy+28+(i%2)*6,2.2,'#2a3a6a','#8aa0d8'); }});
  /* Limettenspalte am Rand */
  g.save(); g.translate(gx+k.R-3,k.top-1); g.rotate(0.5); g.beginPath(); g.arc(0,0,9,Math.PI,0); g.closePath(); g.fillStyle='#5aa02a'; g.fill(); g.beginPath(); g.arc(0,0,7.6,Math.PI,0); g.closePath(); g.fillStyle='#c8e88a'; g.fill(); g.strokeStyle='#f4fae0'; g.lineWidth=0.7; g.beginPath(); for(let i=1;i<5;i++){ g.moveTo(0,0); g.lineTo(Math.cos(Math.PI+i*Math.PI/5)*7,Math.sin(Math.PI+i*Math.PI/5)*7); } g.stroke(); g.restore();
  mg_gurke(g,16,92,8,0,0.5); mg_gurke(g,26,95,7,0,0.5); [[84,93],[90,90],[88,96],[94,95]].forEach(([x,y])=>WZ.kugel(g,x,y,2.6,'#2a3a6a','#8aa0d8'));
  g.restore();
}));
/* Whisky: Tumbler mit Eiswuerfel vor dem Fassboden */
wareReg('whisky',mg((g,W,rnd,a)=>{
  g.save(); mg_mitte(g,W,100,55);
  const bx=50, byy=42, br=40; g.save(); g.beginPath(); g.arc(bx,byy,br,0,Math.PI*2); const hg=g.createRadialGradient(bx-12,byy-12,4,bx,byy,br); hg.addColorStop(0,'#a8683a'); hg.addColorStop(1,'#3a1a08'); g.fillStyle=hg; g.fill(); g.clip();
  g.strokeStyle='rgba(30,12,2,.6)'; g.lineWidth=0.8; for(let i=-4;i<=4;i++){ g.beginPath(); g.moveTo(bx+i*9,byy-br); g.lineTo(bx+i*9,byy+br); g.stroke(); }
  g.strokeStyle='rgba(255,200,140,.12)'; for(let i=0;i<14;i++){ g.beginPath(); g.moveTo(bx-br+rnd()*br*2,byy-br); g.lineTo(bx-br+rnd()*br*2,byy+br); g.stroke(); } g.restore();
  g.strokeStyle='#22201e'; g.lineWidth=4; g.beginPath(); g.arc(bx,byy,br-2,0,Math.PI*2); g.stroke(); g.strokeStyle='rgba(255,255,255,.25)'; g.lineWidth=1; g.beginPath(); g.arc(bx,byy,br-3.5,Math.PI*1.05,Math.PI*1.55); g.stroke();
  WZ.ellipse(g,bx,byy-18,4.5,4.5,'#2a1406');
  const gx=50; mg_becher(g,gx,96,50,42,{inhalt:'#c8701a',voll:0.5,unten:0.95,boden:0.2,innen:(fy)=>{ mg_eis(g,gx-4,fy-2,22,0.22,0.85); }});
  mg_eis(g,86,92,12,-0.3,0.85);
  g.restore();
}));
/* Eiswuerfel: Haufen Wuerfel, Frost, Kristalle */
wareReg('eiswuerfel',mg((g,W,rnd,a)=>{
  for(let i=0;i<8;i++) mg_flocke(g,rnd()*W,4+rnd()*36,2+rnd()*4,0.75);
  WZ.leucht(g,W/2,80,W*0.5,'#ffffff',0.35);
  const s=22, reihen=[[88,Math.max(3,Math.round(W/24))],[68,0],[48,0],[30,1]]; reihen[1][1]=reihen[0][1]-1; reihen[2][1]=Math.max(1,reihen[1][1]-1); if(reihen[2][1]===1) reihen.length=3;
  WZ.schatten(g,W/2,94,W*0.45,6,0.4);
  reihen.forEach(([y,n])=>{ for(let i=0;i<n;i++) mg_eis(g,W/2+(i-(n-1)/2)*s*0.95+(rnd()-0.5)*4,y+(rnd()-0.5)*4,s*(0.9+rnd()*0.2),(rnd()-0.5)*0.8,0.92); });
  for(let i=0;i<6;i++) mg_funkel(g,W*0.15+rnd()*W*0.7,30+rnd()*60,1.5+rnd()*2,'#ffffff');
}));
