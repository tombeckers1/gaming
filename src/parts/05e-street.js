/* =========================================================
   Doppelstabmatte ums Testfeld und Strassenleuchten
   ========================================================= */
function gitterMat(rx,ry2){
  const t=tex(256,256,(g,W,H)=>{
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
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; t.repeat.set(rx,ry2);
  return new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:0.35,side:THREE.DoubleSide,metalness:0.55,roughness:0.45});
}
/* Ein Zaunlauf von (x0,z0) nach (x1,z1) */
function zaunLauf(x0,z0,x1,z1,h){
  const dx=x1-x0, dz=z1-z0, len=Math.hypot(dx,dz), ry=Math.atan2(dx,dz);
  const post=std(0x59606b,{metalness:0.6,roughness:0.42});
  const kappe=std(0x3c424d,{metalness:0.5,roughness:0.5});
  /* Sockelschiene */
  const sock=bbox(0.12,0.16,len,std(0x9a9ea6,{roughness:0.95}),(x0+x1)/2,0.08,(z0+z1)/2,null,false);
  sock.rotation.y=ry;
  /* Matte */
  const m=gitterMat(len,h-0.16);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(len,h-0.16),m);
  panel.position.set((x0+x1)/2,0.16+(h-0.16)/2,(z0+z1)/2);
  panel.rotation.y=ry+Math.PI/2;
  scene.add(panel);
  /* Pfosten alle 2,5 m */
  const n=Math.max(2,Math.round(len/2.5));
  for(let i=0;i<=n;i++){
    const t2=i/n, x=x0+dx*t2, z=z0+dz*t2;
    const p2=bbox(0.07,h+0.06,0.07,post,x,(h+0.06)/2,z,null,false); p2.rotation.y=ry; p2.userData.zaunPfosten=true;
    bbox(0.1,0.025,0.1,kappe,x,h+0.09,z,null,false);
    for(const y of [0.42,h-0.3]){
      const sch=bbox(0.1,0.05,0.05,kappe,x,y,z,null,false); sch.rotation.y=ry;
    }
  }
}
/* Das Testfeld reicht jetzt von der Lagerwand bis an die Suedhalle.
   Im Norden steht die Ladenrueckwand, im Westen die Lagerwand, im
   Osten die Westwand des Rueckgebaeudes - eingezaeunt wird nur, was
   sonst offen waere. */
let _warnTex=null;
function warnTex(){
  if(!_warnTex) _warnTex=tex(320,180,(g,W,Hh)=>{
    g.fillStyle='#f2c230'; g.fillRect(0,0,W,Hh);
    g.strokeStyle='#1f1f24'; g.lineWidth=8; g.strokeRect(6,6,W-12,Hh-12);
    g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#1f1f24';
    g.font=BUN(34); g.fillText('TESTFELD',W/2,48);
    g.font=BAR(26); g.fillText('Zutritt nur für Personal',W/2,92);
    g.fillText('Schutzbrille tragen',W/2,126);
  });
  return _warnTex;
}
function warnSchild(x,z,ry){
  plane(1.6,0.9,new THREE.MeshStandardMaterial({side:THREE.DoubleSide,map:warnTex()}),x,1.2,z,ry,null);
}
/* Das Testfeld reicht jetzt von der Lagerwand bis an die Suedhalle.
   Im Norden steht der Lagergang, im Westen die Lagerwand, im Osten
   die Westwand des Rueckgebaeudes - eingezaeunt wird nur, was sonst
   offen waere. Auf der gewachsenen Flaeche haengt nicht mehr nur ein
   einziges Schild in der Mitte: alle acht Meter eines, damit man von
   ueberall sieht, wo man steht. */
function buildZaun(){
  const H=2.0, T=LAY.test;
  zaunLauf(T.x0,T.z0,T.x1,T.z0,H);            /* Sueden        */
  /* endet an der Aussenseite der Suedhallenwand - bei LAY.sued.z0
     stand der letzte Pfosten genau in der Innenecke der Verkaufsflaeche
     und ragte dort als dunkler Strich in den Laden (Tom, 26.09.) */
  zaunLauf(T.x1,T.z0,T.x1,LAY.sued.z0-0.2,H);     /* Osten, unten  */
  col(T.x0,T.x1,T.z0-0.1,T.z0+0.1);
  col(T.x1-0.1,T.x1+0.1,T.z0,LAY.sued.z0);
  /* Warnschilder laengs der Zaunlaeufe */
  const nS=Math.max(2,Math.round((T.x1-T.x0)/8));
  for(let i=0;i<nS;i++) warnSchild(T.x0+(i+0.5)*(T.x1-T.x0)/nS,T.z0+0.12,0);
  const lo=LAY.sued.z0, nO=Math.max(1,Math.round((lo-T.z0)/8));
  for(let i=0;i<nO;i++) warnSchild(T.x1-0.12,T.z0+(i+0.5)*(lo-T.z0)/nO,-Math.PI/2);
}
/* Strassenleuchte: Sockel, konischer Mast, Ausleger, echter Leuchtenkopf */
function strassenlampe(x,z,dir){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=dir||0; scene.add(g);
  const mast=std(0x4b515c,{metalness:0.62,roughness:0.38});
  const dunkel=std(0x2a2e38,{metalness:0.5,roughness:0.5});
  /* Fundamentsockel mit Revisionsklappe */
  const so=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.19,0.34,14),dunkel);
  so.position.y=0.17; if(HIQ) so.castShadow=true; g.add(so);
  bbox(0.1,0.16,0.02,std(0x6a7078,{metalness:0.6}),0,0.2,0.185,g,false);
  const flansch=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.03,14),dunkel);
  flansch.position.y=0.35; g.add(flansch);
  for(let i=0;i<4;i++){ const a=i/4*Math.PI*2;
    bbox(0.035,0.03,0.035,std(0x7d838c,{metalness:0.7}),Math.cos(a)*0.13,0.37,Math.sin(a)*0.13,g,false); }
  /* konischer Mast */
  const m1=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.11,4.4,14),mast);
  m1.position.y=2.57; if(HIQ) m1.castShadow=true; g.add(m1);
  /* Bogen als kurze Segmente */
  const R=0.9, seg=7;
  for(let i=0;i<seg;i++){
    const a0=i/seg*(Math.PI/2), a1=(i+1)/seg*(Math.PI/2);
    const x0=Math.sin(a0)*R, y0=R-Math.cos(a0)*R, x1=Math.sin(a1)*R, y1=R-Math.cos(a1)*R;
    const len=Math.hypot(x1-x0,y1-y0);
    const b=new THREE.Mesh(new THREE.CylinderGeometry(0.062,0.066,len*1.08,10),mast);
    b.position.set(0,4.77+ (y0+y1)/2, (x0+x1)/2);
    b.rotation.x=Math.atan2(x1-x0,y1-y0);
    g.add(b);
  }
  /* Leuchtenkopf mit Wanne */
  const kopf=new THREE.Group(); kopf.position.set(0,5.63,0.9); kopf.rotation.x=0.06; g.add(kopf);
  const geh=rbox(0.3,0.11,0.82,0.04,std(0x3b414c,{metalness:0.55,roughness:0.4}),0,0.06,0,kopf);
  bbox(0.26,0.03,0.74,std(0x71787f,{metalness:0.6}),0,0.005,0,kopf,false);
  const lm=new THREE.MeshStandardMaterial({color:LIN(0x23262e),emissive:LIN(0xffe9c0),emissiveIntensity:0});
  lampMats.push(lm);
  const wanne=new THREE.Mesh(new THREE.BoxGeometry(0.24,0.045,0.7),lm);
  wanne.position.set(0,-0.02,0); kopf.add(wanne);
  /* Halterung und Deckel */
  bbox(0.16,0.09,0.16,std(0x2f343e,{metalness:0.5}),0,0.06,-0.44,kopf,false);
  bbox(0.24,0.02,0.6,std(0x4d535d,{metalness:0.6}),0,0.125,0.02,kopf,false);
  col(x-0.22,x+0.22,z-0.22,z+0.22);
  return g;
}

/* =========================================================
   Straße: Häuserzeile, Autos, Bäume, Stadtmöbel
   ========================================================= */
/* =========================================================
   Haeuserzeile gegenueber in echtem 3D (Tom, 26.09.: "Laeden
   gegenueber, Hochhaeuser und alles drum herum nochmal deutlich
   schoener und hochwertiger in der 3D"). Vorher: Quader mit
   aufgemalten Fenstern und flachem Dach, Luecken zwischen den
   Haeusern. Jetzt eine geschlossene Zeile aus Gruenderzeit- und
   Nachkriegshaeusern: Fenster als echte Oeffnungen mit Laibung,
   Rahmen und Sprossen, Stuck und Gesimse, Sattel-, Mansard- und
   Flachdaecher mit Gauben, Schornsteinen und Schnee, fast ueberall
   ein Laden im Erdgeschoss.
   Alles, was sich ein Material teilen kann, landet ueber den Sammler
   HZ in EINEM Mesh je Material - sonst waere jedes Gesims ein eigener
   Zeichenaufruf. Eigene Meshes haben nur die Hausfront (Putz mit
   ausgesparten Oeffnungen) und die Ladeneinrichtung.
   ========================================================= */
const LADEN=[
  {n:'BÄCKEREI',f:'#8a4b1f',s:'brezel',holz:1},
  {n:'KIOSK',f:'#1f4f8a',s:'lotto'},
  {n:'APOTHEKE',f:'#c8102e',s:'apo'},
  {n:'CAFÉ',f:'#3b2a20',s:'tasse',holz:1},
  {n:'BLUMEN',f:'#2f6b3a',s:'blume'},
  {n:'METZGEREI',f:'#8a1c1c',s:'wurst',holz:1},
  {n:'FRISEUR',f:'#20242c',s:'schere'},
  {n:'PIZZERIA',f:'#1f6b3a',s:'pizza'},
  {n:'GETRÄNKE',f:'#1f4f8a',s:'flasche'},
  {n:'OPTIKER',f:'#2d3035',s:'brille'},
  {n:'BUCHHANDLUNG',f:'#5a2d3a',s:'buch',holz:1},
  {n:'SCHREIBWAREN',f:'#c8322a',s:'stift'},
  {n:'REISEBÜRO',f:'#1f6b6b',s:'flieger'},
  {n:'WASCHSALON',f:'#2f5d9e',s:'wasch'}
];
const LADENNAMEN=LADEN.map(l=>l.n);
/* Putzfarben nach Baustil: Gruenderzeit warm und pastellig,
   Nachkrieg gedeckt */
const HAUSFARBEN={
  alt:[0xd9c7a3,0xe0c878,0xe6e0d2,0xb4c4a4,0xa9bccf,0xd4a08c,0xd6b48c,0xb9826a,0xc7ccd0,0x9fb2a4,0xe2b8a0],
  nach:[0xd7d0bf,0xc8c6bc,0xd9c99a,0xb8bfb2,0xcfc2ae,0xb4b0a8,0xc4b8a8,0xa9b4b8]
};
/* ---------- Sammler: Teile je Material, am Ende ein Mesh ---------- */
let HZ=null, HZS=null, HZA=null, _hzM=null, _hzT=null;
function hzAdd(k,geo,m,c){ (HZ[k]||(HZ[k]=[])).push({geo,m,color:c}); }
/* Quader, dessen UV in Metern laeuft: der Putz ist auf jedem
   Bauteil gleich fein und nicht auf jede Leiste gestaucht */
function boxM(w,h,d,T){ const g=new THREE.BoxGeometry(w,h,d), uv=g.attributes.uv, S=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let i=0;i<24;i++){ const s=S[i>>2]; uv.setXY(i,uv.getX(i)*s[0]/T,uv.getY(i)*s[1]/T); } return g; }
/* Vielecke (gegen den Uhrzeigersinn von aussen) mit UV in Metern.
   Normalen selbst gerechnet: flach je Flaeche, wie bei einer Box. */
const v3sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], v3kr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  v3dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], v3n=a=>{ const l=Math.hypot(a[0],a[1],a[2])||1; return [a[0]/l,a[1]/l,a[2]/l]; };
function flaechen(F,T){ const pos=[],nor=[],uv=[];
  for(const P of F){ const e1=v3n(v3sub(P[1],P[0])), n=v3n(v3kr(e1,v3sub(P[2],P[0]))), e2=v3kr(n,e1);
    for(let i=1;i<P.length-1;i++) for(const p of [P[0],P[i],P[i+1]]){ const q=v3sub(p,P[0]); pos.push(p[0],p[1],p[2]); nor.push(n[0],n[1],n[2]); uv.push(v3dot(q,e1)/T,v3dot(q,e2)/T); } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); return g; }
/* Viereck mit festen UV (Atlaszelle): unten links, unten rechts, oben rechts, oben links */
function quadUV(P,u0,v0,u1,v1){ const g=new THREE.BufferGeometry(), n=v3n(v3kr(v3sub(P[1],P[0]),v3sub(P[2],P[0])));
  g.setAttribute('position',new THREE.Float32BufferAttribute([P[0],P[1],P[2],P[0],P[2],P[3]].flat(),3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,2,3,4,5].flatMap(()=>n),3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute([u0,v0,u1,v0,u1,v1,u0,v0,u1,v1,u0,v1],2)); return g; }
/* Baukasten fuer ein Haus: alle Masse lokal (Front auf +z), M setzt es in die Welt */
function hausKit(M){
  const L=(x,y,z,rx,ry,rz)=>M.clone().multiply(tm(x,y,z,rx,ry,rz));
  const K={M,
    B:(k,w,h,d,x,y,z,c,rx,ry,rz)=>hzAdd(k,boxM(w,h,d,1.6),L(x,y,z,rx,ry,rz),c),
    F:(k,faces,c,T)=>hzAdd(k,flaechen(faces,T||1.6),M,c),
    /* Rechteck um Mitte c mit Achsen U,V (Normale U x V) */
    R:(k,c,U,V,su,sv,col,T)=>{ const p=(a,b)=>[0,1,2].map(i=>c[i]+U[i]*a*su/2+V[i]*b*sv/2);
      hzAdd(k,flaechen([[p(-1,-1),p(1,-1),p(1,1),p(-1,1)]],T||1.6),M,col); },
    Q:(k,P,uv,c)=>hzAdd(k,quadUV(P,uv[0],uv[1],uv[2],uv[3]),M,c),
    Z:(k,r,h,x,y,z,c,rx,rz)=>hzAdd(k,new THREE.CylinderGeometry(r,r,h,8,1,true),L(x,y,z,rx||0,0,rz||0),c),
    C:(k,r1,r2,h,x,y,z,c)=>hzAdd(k,new THREE.CylinderGeometry(r1,r2,h,10),L(x,y,z),c),
    K:(k,r,x,y,z,c)=>hzAdd(k,new THREE.SphereGeometry(r,6,4),L(x,y,z),c),
    /* Scheibe aus dem Fensteratlas */
    G:(x,y,w,h,z,cell)=>K.Q('glas',[[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y+h,z],[x-w/2,y+h,z]],fensterUV(cell))
  };
  return K;
}
/* ---------- Texturen der Zeile ---------- */
/* Fensteratlas 4 x 4: Zelle 0-7 Tagesbild (unbeleuchtet), 8-15 dasselbe
   Tagesbild, aber mit Licht in der Emissive-Map. So leuchten nachts
   einzelne Fenster warm, ohne ein einziges Licht in der Szene. */
function fensterUV(c){ const e=3/1024, u=(c%4)/4, v=1-((c>>2)+1)/4; return [u+e,v+e,u+0.25-e,v+0.25-e]; }
function fensterZelle(g,x,y,S,k,licht){
  const R=(a,b,c,d,f)=>{ g.fillStyle=f; g.fillRect(x+a*S,y+b*S,c*S,d*S); };
  if(!licht){
    const gr=g.createLinearGradient(x,y,x+S*0.5,y+S); gr.addColorStop(0,'#8397ad'); gr.addColorStop(0.32,'#3a4656'); gr.addColorStop(0.7,'#1e252f'); gr.addColorStop(1,'#262d38');
    g.fillStyle=gr; g.fillRect(x,y,S,S);
    /* Spiegelung: schraeger heller Streifen */
    g.fillStyle='rgba(220,232,245,.16)'; g.beginPath(); g.moveTo(x,y+S*0.35); g.lineTo(x+S*0.55,y); g.lineTo(x+S*0.75,y); g.lineTo(x,y+S*0.62); g.closePath(); g.fill();
  } else {
    /* blaues Fernsehlicht nur hinter der Jalousie - die leere Zelle 3
       sitzt auch im Oberlicht der Haustuer, und ein Treppenhaus
       leuchtet warm, nicht blau (27.09.) */
    const warm=[['#ffe4b0','#d99a55'],['#fff0d0','#e0b070'],['#ffd28a','#c7803a'],['#bcd0ff','#6f86c8']][k===5?3:k%3];
    const gr=g.createLinearGradient(x,y,x,y+S); gr.addColorStop(0,warm[0]); gr.addColorStop(1,warm[1]); g.fillStyle=gr; g.fillRect(x,y,S,S);
    /* Raum dahinter: Moebel und Deckenleuchte als Silhouetten */
    R(0.08,0.62,0.34,0.38,'rgba(40,24,10,.45)'); R(0.6,0.35,0.24,0.65,'rgba(40,24,10,.35)');
    const lg=g.createRadialGradient(x+S*0.5,y+S*0.12,2,x+S*0.5,y+S*0.12,S*0.4); lg.addColorStop(0,'rgba(255,255,240,.9)'); lg.addColorStop(1,'rgba(255,255,240,0)'); g.fillStyle=lg; g.fillRect(x,y,S,S*0.6);
  }
  const d=licht?'rgba(60,34,14,':'rgba(0,0,0,';
  if(k===0){ /* Gardine ueber zwei Drittel */
    R(0,0.3,1,0.7,licht?'rgba(255,238,205,.55)':'rgba(236,236,230,.62)');
    for(let i=0;i<14;i++) R(i/14,0.3,0.018,0.7,licht?'rgba(120,70,30,.18)':'rgba(150,150,150,.22)');
  } else if(k===1){ /* Seitenschals und Store */
    R(0,0,1,1,licht?'rgba(255,236,200,.28)':'rgba(230,230,226,.35)');
    const c=['#7a2a2a','#2f4a3a','#6a5a3a'][Math.floor(Math.random()*3)];
    g.globalAlpha=licht?0.55:1; R(0,0,0.22,1,c); R(0.78,0,0.22,1,c); g.globalAlpha=1;
  } else if(k===2){ /* Rollo halb unten */
    R(0,0,1,0.46,licht?'#f2c47c':'#e6dbc2'); R(0,0.44,1,0.03,d+'.35)');
  } else if(k===3){ /* leer, man sieht in den Raum */
    R(0.3,0.05,0.4,0.05,d+'.5)');
  } else if(k===4){ /* Pflanzen auf der Fensterbank */
    for(let i=0;i<4;i++){ g.fillStyle=licht?'rgba(30,40,20,.7)':'#3f6a34'; g.beginPath(); g.arc(x+S*(0.14+i*0.24),y+S*0.84,S*0.1,0,Math.PI*2); g.fill();
      R(0.08+i*0.24,0.88,0.12,0.12,licht?'rgba(60,30,10,.8)':'#8a4a2a'); }
    R(0,0,1,0.16,licht?'rgba(255,240,210,.5)':'rgba(236,236,230,.6)');
  } else if(k===5){ /* Jalousie */
    for(let i=0;i<22;i++) R(0,i/22,1,0.028,licht?'rgba(90,50,20,.5)':'rgba(200,200,196,.55)');
  } else if(k===6){ /* Schwibbogen und Herrnhuter Stern - es ist Silvester */
    g.strokeStyle=licht?'rgba(40,20,5,.9)':'#1a1a1a'; g.lineWidth=S*0.03;
    g.beginPath(); g.arc(x+S*0.5,y+S*0.95,S*0.36,Math.PI,0); g.stroke(); R(0.1,0.92,0.8,0.05,g.strokeStyle);
    for(let i=0;i<5;i++){ const a=Math.PI*(0.12+i*0.19), cx=x+S*0.5-Math.cos(a)*S*0.36, cy=y+S*0.95-Math.sin(a)*S*0.36;
      g.fillStyle=licht?'#fff6c0':'#e8e2c8'; g.fillRect(cx-2,cy-S*0.08,4,S*0.08); }
    g.fillStyle=licht?'#fff2b0':'#d8d2b8'; g.beginPath();
    for(let i=0;i<16;i++){ const a=i/16*Math.PI*2, r=i%2?S*0.05:S*0.13; g.lineTo(x+S*0.5+Math.cos(a)*r,y+S*0.22+Math.sin(a)*r); } g.closePath(); g.fill();
  } else { /* Rollladen fast ganz unten */
    R(0,0,1,0.82,licht?'#2a1a0c':'#a7a9aa');
    for(let i=0;i<24;i++) R(0,i*0.82/24,1,0.006,licht?'rgba(255,210,140,.9)':'rgba(70,70,70,.45)');
  }
  /* Schatten der Laibung oben und seitlich */
  const sg=g.createLinearGradient(x,y,x,y+S*0.18); sg.addColorStop(0,'rgba(0,0,0,.45)'); sg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=sg; g.fillRect(x,y,S,S*0.18);
  const sl=g.createLinearGradient(x,y,x+S*0.1,y); sl.addColorStop(0,'rgba(0,0,0,.3)'); sl.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=sl; g.fillRect(x,y,S*0.1,S);
}
function hzTex(){
  if(_hzT) return _hzT;
  const T=_hzT={}, A=COARSE?512:1024, S=A/4;
  T.putz=tex(256,256,(g,W,H)=>{ g.fillStyle='#eeeeeb'; g.fillRect(0,0,W,H);
    for(let i=0;i<6000;i++){ const v=Math.random()<0.5?0:255; g.fillStyle=`rgba(${v},${v},${v},${Math.random()*0.07})`; g.fillRect(Math.random()*W,Math.random()*H,1+Math.random()*2,1+Math.random()*2); } });
  /* Biberschwanz: jede Reihe liegt auf der darunter, die runden Enden zeigen nach unten */
  T.dach=tex(256,256,(g,W,H)=>{ g.fillStyle='#2a2a2a'; g.fillRect(0,0,W,H);
    for(let r=8;r>=-1;r--) for(let c=-1;c<9;c++){ const x=c*32+(r&1)*16, y=r*32-8, v=170+Math.random()*70|0;
      const gr=g.createLinearGradient(0,y,0,y+40); gr.addColorStop(0,`rgb(${v*0.8|0},${v*0.8|0},${v*0.8|0})`); gr.addColorStop(1,`rgb(${v},${v},${v})`);
      g.fillStyle='rgba(0,0,0,.5)'; g.beginPath(); g.moveTo(x+1,y); g.lineTo(x+31,y); g.lineTo(x+31,y+30); g.arc(x+16,y+31,15,0,Math.PI); g.closePath(); g.fill();
      g.fillStyle=gr; g.beginPath(); g.moveTo(x+2,y); g.lineTo(x+30,y); g.lineTo(x+30,y+28); g.arc(x+16,y+28,14,0,Math.PI); g.closePath(); g.fill(); } });
  /* Schnee in Flecken, die den Ziegelreihen folgen */
  T.schnee=tex(256,256,(g,W,H)=>{ g.clearRect(0,0,W,H);
    for(let i=0;i<340;i++){ const x=Math.random()*W, y=Math.random()*H, rw=rand(8,46), rh=rand(3,9);
      g.fillStyle=`rgba(255,255,255,${rand(0.55,1)})`;
      for(const ox of [-W,0,W]) for(const oy of [-H,0,H]){ g.beginPath(); g.ellipse(x+ox,y+oy,rw,rh,0,0,Math.PI*2); g.fill(); } } });
  for(const k of ['putz','dach','schnee']){ T[k].wrapS=T[k].wrapT=THREE.RepeatWrapping; T[k].anisotropy=8; }
  T.fenster=tex(A,A,(g)=>{ for(let c=0;c<16;c++) fensterZelle(g,(c%4)*S,(c>>2)*S,S,c%8,false); });
  T.fensterE=tex(A,A,(g)=>{ g.fillStyle='#000'; g.fillRect(0,0,A,A); for(let c=8;c<16;c++) fensterZelle(g,(c%4)*S,(c>>2)*S,S,c%8,true); });
  T.fenster.anisotropy=T.fensterE.anisotropy=8;
  /* Spiegelung im Schaufenster: oben heller Himmel, unten kaum etwas,
     dazu zwei weiche Schraegstreifen. Farbe = gespiegeltes Licht, Alpha =
     wie stark die Scheibe spiegelt, der Rest laesst den Laden durch.
     Vorher spiegelte jede Scheibe gleichmaessig den hellen Horizont der
     Umgebungskarte - das gab einen grauen Schleier, hinter dem keine
     Ware zu erkennen war (27.09.) */
  T.spiegel=tex(128,256,(g,W,H)=>{ g.clearRect(0,0,W,H);
    const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'rgba(214,226,238,.42)'); gr.addColorStop(0.3,'rgba(200,212,226,.16)');
    gr.addColorStop(0.65,'rgba(150,160,172,.07)'); gr.addColorStop(1,'rgba(120,128,138,.1)'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='rgba(235,242,250,.13)';
    for(const [a,b] of [[0.1,0.3],[0.42,0.5]]) for(const o of [-1,0]){ g.beginPath(); g.moveTo(W*(a+o),H); g.lineTo(W*(b+o),H); g.lineTo(W*(b+o+0.55),0); g.lineTo(W*(a+o+0.55),0); g.closePath(); g.fill(); } });
  T.spiegel.wrapS=THREE.RepeatWrapping;
  /* Lichtfleck vor dem Schaufenster auf dem Gehweg */
  T.spill=tex(64,64,(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'rgba(255,200,130,.95)'); gr.addColorStop(0.45,'rgba(255,190,120,.35)'); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle='#000'; g.fillRect(0,0,W,H); g.fillStyle=gr; g.fillRect(0,0,W,H);
    const sx=g.createLinearGradient(0,0,W,0); sx.addColorStop(0,'rgba(0,0,0,1)'); sx.addColorStop(0.15,'rgba(0,0,0,0)'); sx.addColorStop(0.85,'rgba(0,0,0,0)'); sx.addColorStop(1,'rgba(0,0,0,1)'); g.fillStyle=sx; g.fillRect(0,0,W,H); });
  return T;
}
function hzMats(){
  if(_hzM) return _hzM;
  const T=hzTex(), env=autoUmgebung();
  const lampe=new THREE.MeshStandardMaterial({color:LIN(0xe9e3d4),emissive:LIN(0xffd9a0),emissiveIntensity:0,roughness:0.3}); lampMats.push(lampe);
  _hzM={
    putz:new THREE.MeshStandardMaterial({vertexColors:true,map:T.putz,roughness:0.93}),
    rahmen:new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.5}),
    zink:new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.4,metalness:0.55}),
    messing:new THREE.MeshStandardMaterial({color:LIN(0xc9a14e),metalness:0.85,roughness:0.28}),
    dach:new THREE.MeshStandardMaterial({vertexColors:true,map:T.dach,roughness:0.82}),
    schnee:new THREE.MeshStandardMaterial({color:LIN(0xf3f6fa),map:T.schnee,alphaTest:0.5,roughness:1}),
    glas:new THREE.MeshStandardMaterial({map:T.fenster,emissive:LIN(0xffffff),emissiveMap:T.fensterE,emissiveIntensity:0,roughness:0.12,metalness:0.2,envMap:env,envMapIntensity:0.45}),
    scheibe:new THREE.MeshBasicMaterial({map:T.spiegel,transparent:true,depthWrite:false}),
    spill:new THREE.MeshStandardMaterial({color:0x000000,emissive:LIN(0xffffff),emissiveMap:T.spill,emissiveIntensity:0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,roughness:1}),
    lampe
  };
  houseMats.push(_hzM.glas,_hzM.spill);
  /* nachts spiegeln die Scheiben den dunklen Himmel nicht mehr hell */
  _hzM.nacht=()=>{ const f=clamp(_hzM.glas.emissiveIntensity/0.9,0,1); _hzM.glas.envMapIntensity=0.45*(1-0.9*f); _hzM.scheibe.opacity=1-0.8*f; };
  return _hzM;
}
/* ---------- Schilder: Schriftzuege, Auslegersymbole, Hausnummern in einem Atlas ---------- */
const SCH={W:1024,H:2048,zeile:112,zeilen:14,sym:1568,nr:1824};
function schildUV(i){ return [0,1-(i+1)*SCH.zeile/SCH.H,1,1-i*SCH.zeile/SCH.H]; }
function symbolUV(i){ const x=(i%8)*128, y=SCH.sym+(i>>3)*128; return [x/SCH.W+0.002,1-(y+128)/SCH.H+0.002,(x+128)/SCH.W-0.002,1-y/SCH.H-0.002]; }
function nummerUV(i){ const x=(i%16)*64, y=SCH.nr; return [x/SCH.W+0.002,1-(y+48)/SCH.H,(x+64)/SCH.W-0.002,1-y/SCH.H]; }
const SYMBOLE=['brezel','lotto','apo','tasse','blume','wurst','schere','pizza','flasche','brille','buch','stift','flieger','wasch'];
function schriftFont(sp,s){ return sp.serif?`italic 700 ${s}px Georgia, "Times New Roman", serif`:BUN(s); }
let _messG=null;
function schriftBreite(sp){ if(!_messG) _messG=document.createElement('canvas').getContext('2d');
  const s=fitFont(_messG,sp.t,SCH.W-60,78,s=>schriftFont(sp,s)); _messG.font=schriftFont(sp,s); return _messG.measureText(sp.t).width; }
function symbolMalen(g,s,x,y,S,f,licht){
  const c=x+S/2, m=y+S/2, L=w=>{ g.lineWidth=w*S; };
  g.fillStyle=s==='apo'?'#f4f2ee':s==='lotto'?'#f2c200':f; g.beginPath(); g.arc(c,m,S*0.46,0,Math.PI*2); g.fill();
  g.strokeStyle=licht?'#fff4d0':'#c9a14e'; L(0.05); g.stroke();
  const gold=licht?'#fff4c8':'#e8c170', weiss=licht?'#ffffff':'#f4f2ee';
  g.fillStyle=weiss; g.strokeStyle=weiss; g.lineCap='round'; g.lineJoin='round';
  const P=(pts,close)=>{ g.beginPath(); pts.forEach(([a,b],i)=>i?g.lineTo(x+a*S,y+b*S):g.moveTo(x+a*S,y+b*S)); if(close) g.closePath(); };
  if(s==='brezel'){ g.strokeStyle=gold; L(0.075); g.beginPath(); g.ellipse(c-S*0.13,m+S*0.04,S*0.16,S*0.19,0.5,0,Math.PI*2); g.stroke();
    g.beginPath(); g.ellipse(c+S*0.13,m+S*0.04,S*0.16,S*0.19,-0.5,0,Math.PI*2); g.stroke(); g.beginPath(); g.arc(c,m-S*0.02,S*0.3,Math.PI*1.1,Math.PI*1.9); g.stroke(); }
  else if(s==='apo'){ g.fillStyle='#c8102e'; g.font=`700 ${S*0.66|0}px Georgia, serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('A',c,m+S*0.04); }
  else if(s==='lotto'){ g.fillStyle='#d4141c'; fitFont(g,'LOTTO',S*0.8,S*0.3,BUN); g.textAlign='center'; g.textBaseline='middle'; g.fillText('LOTTO',c,m+S*0.02); }
  else if(s==='tasse'){ g.fillStyle=weiss; P([[0.28,0.42],[0.66,0.42],[0.62,0.7],[0.32,0.7]],1); g.fill(); L(0.05); g.beginPath(); g.arc(x+S*0.68,y+S*0.52,S*0.07,-1.4,1.4); g.stroke();
    L(0.03); for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(x+S*(0.36+i*0.1),y+S*0.36); g.quadraticCurveTo(x+S*(0.4+i*0.1),y+S*0.28,x+S*(0.36+i*0.1),y+S*0.2); g.stroke(); } }
  else if(s==='blume'){ for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; g.fillStyle=licht?'#ffd0e0':'#f2a0c0'; g.beginPath(); g.arc(c+Math.cos(a)*S*0.14,m-S*0.06+Math.sin(a)*S*0.14,S*0.1,0,Math.PI*2); g.fill(); }
    g.fillStyle=gold; g.beginPath(); g.arc(c,m-S*0.06,S*0.08,0,Math.PI*2); g.fill(); g.strokeStyle=licht?'#d8ffd0':'#9fd08a'; L(0.04); g.beginPath(); g.moveTo(c,m+S*0.08); g.lineTo(c,m+S*0.34); g.stroke(); }
  else if(s==='wurst'){ g.strokeStyle=licht?'#ffc0b0':'#e8a090'; L(0.14); g.beginPath(); g.arc(c,m+S*0.3,S*0.3,Math.PI*1.2,Math.PI*1.8); g.stroke(); }
  else if(s==='schere'){ L(0.045); for(const sx of [-1,1]){ g.beginPath(); g.arc(c+sx*S*0.12,m+S*0.2,S*0.08,0,Math.PI*2); g.stroke(); g.beginPath(); g.moveTo(c+sx*S*0.08,m+S*0.13); g.lineTo(c-sx*S*0.12,m-S*0.3); g.stroke(); } }
  else if(s==='pizza'){ g.fillStyle=licht?'#ffd080':'#e8a040'; g.beginPath(); g.arc(c,m,S*0.3,0,Math.PI*2); g.fill(); g.fillStyle='#b8302a';
    for(let i=0;i<6;i++){ const a=i*1.1; g.beginPath(); g.arc(c+Math.cos(a)*S*0.16,m+Math.sin(a)*S*0.16,S*0.05,0,Math.PI*2); g.fill(); } }
  else if(s==='flasche'){ P([[0.44,0.16],[0.56,0.16],[0.56,0.34],[0.64,0.44],[0.64,0.84],[0.36,0.84],[0.36,0.44],[0.44,0.34]],1); g.fill(); }
  else if(s==='brille'){ L(0.05); for(const sx of [-1,1]){ g.beginPath(); g.arc(c+sx*S*0.17,m+S*0.02,S*0.13,0,Math.PI*2); g.stroke(); } g.beginPath(); g.moveTo(c-S*0.05,m-S*0.02); g.quadraticCurveTo(c,m-S*0.08,c+S*0.05,m-S*0.02); g.stroke(); }
  else if(s==='buch'){ P([[0.2,0.3],[0.49,0.36],[0.49,0.74],[0.2,0.68]],1); g.fill(); P([[0.8,0.3],[0.51,0.36],[0.51,0.74],[0.8,0.68]],1); g.fill(); }
  else if(s==='stift'){ L(0.1); g.beginPath(); g.moveTo(c-S*0.24,m+S*0.24); g.lineTo(c+S*0.2,m-S*0.2); g.stroke(); g.fillStyle=gold; P([[0.22,0.78],[0.28,0.64],[0.36,0.72]],1); g.fill(); }
  else if(s==='flieger'){ P([[0.5,0.16],[0.55,0.4],[0.84,0.56],[0.84,0.62],[0.55,0.54],[0.54,0.74],[0.62,0.8],[0.62,0.84],[0.5,0.8],[0.38,0.84],[0.38,0.8],[0.46,0.74],[0.45,0.54],[0.16,0.62],[0.16,0.56],[0.45,0.4]],1); g.fill(); }
  else { L(0.05); g.strokeRect(x+S*0.27,y+S*0.25,S*0.46,S*0.5); g.beginPath(); g.arc(c,m+S*0.04,S*0.13,0,Math.PI*2); g.stroke(); }
}
function schildAtlas(licht){
  const q=COARSE?0.5:1;
  return tex(SCH.W*q,SCH.H*q,(g,W,H)=>{
    g.clearRect(0,0,W,H); g.scale(q,q);
    if(licht){ g.fillStyle='#000'; g.fillRect(0,0,SCH.W,SCH.H); }
    HZS.forEach((sp,i)=>{ const y=i*SCH.zeile;
      const s=fitFont(g,sp.t,SCH.W-60,78,s=>schriftFont(sp,s)); g.font=schriftFont(sp,s);
      g.textAlign='center'; g.textBaseline='middle';
      g.fillStyle=licht?(sp.kasten?'#fff8ea':sp.glut):(sp.kasten?'#f8f5ee':sp.farbe);
      g.fillText(sp.t,SCH.W/2,y+SCH.zeile/2+4); });
    SYMBOLE.forEach((s,i)=>{ const L=LADEN.find(l=>l.s===s); symbolMalen(g,s,(i%8)*128+4,SCH.sym+(i>>3)*128+4,120,L?L.f:'#2b3a5e',licht);
      if(licht){ g.fillStyle='rgba(0,0,0,.35)'; g.fillRect((i%8)*128,SCH.sym+(i>>3)*128,128,128); } });
    /* blaue Emaille-Hausnummern */
    for(let i=0;i<16;i++){ const x=i*64;
      g.fillStyle=licht?'#10204a':'#1d3f86'; g.fillRect(x+2,SCH.nr+2,60,44); g.strokeStyle=licht?'#8090c0':'#f2f5ff'; g.lineWidth=3; g.strokeRect(x+6,SCH.nr+6,52,36);
      g.fillStyle=licht?'#a0b0e0':'#f2f5ff'; g.font=BUN(26); g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(3+i*3),x+32,SCH.nr+26); }
  });
}
/* Markisen: je Laden eine Zeile mit Streifen, darunter der Volant mit Bogenkante */
function markiseAtlas(){
  return tex(256,512,(g,W,H)=>{ g.clearRect(0,0,W,H);
    HZA.forEach((f,i)=>{ const y=i*64;
      for(let k=0;k<16;k++){ g.fillStyle=k%2?f:'#efe9dc'; g.fillRect(k*16,y,16,62); }
      g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(0,y+38,W,4);
      g.globalCompositeOperation='destination-out';
      for(let k=0;k<16;k++){ g.beginPath(); g.arc(k*16+8,y+64,8,Math.PI,0); g.fill(); }
      g.globalCompositeOperation='source-over'; });
  });
}
/* Alles Gesammelte zu je einem Mesh */
function hzFertig(){
  const M=hzMats();
  if(HZS.length){ const sm=new THREE.MeshStandardMaterial({vertexColors:true,map:schildAtlas(false),emissive:LIN(0xffffff),emissiveMap:schildAtlas(true),emissiveIntensity:0,alphaTest:0.45,roughness:0.5,side:THREE.DoubleSide});
    sm.map.anisotropy=8; houseMats.push(sm); M.schild=sm; }
  if(HZA.length){ const mt=markiseAtlas(); mt.wrapS=THREE.RepeatWrapping; M.markise=new THREE.MeshStandardMaterial({map:mt,alphaTest:0.5,roughness:0.9,side:THREE.DoubleSide}); }
  for(const k in HZ){
    let mat=M[k];
    if(!mat&&k.startsWith('tuer:')) mat=new THREE.MeshStandardMaterial({map:tuerTex(k.slice(5)),roughness:0.45,metalness:0.05});
    if(!mat) continue;
    const mesh=new THREE.Mesh(merge(HZ[k]),mat);
    if(HIQ&&(k==='putz'||k==='dach')){ mesh.castShadow=true; mesh.receiveShadow=true; }
    if(k==='glas') mesh.onBeforeRender=M.nacht;
    if(k==='spill'||k==='scheibe') mesh.renderOrder=2;
    scene.add(mesh);
  }
  HZ={};
}
/* Hoehe des Gehwegs vor der Zeile (der Gehweg gehoert der Strasse und
   kann sich aendern - Stufen und Lichtfleck setzen sich darauf) */
function bodenY(x,z){
  try{ const rc=new THREE.Raycaster(new THREE.Vector3(x,3,z),new THREE.Vector3(0,-1,0),0,4);
    const h=rc.intersectObjects(scene.children,true).filter(i=>i.object.isMesh&&i.face&&i.face.normal.clone().transformDirection(i.object.matrixWorld).y>0.5);
    return h.length?Math.max(0,Math.min(0.4,h[0].point.y)):0.015; }catch(e){ return 0.015; }
}
const hexMix=(a,b,t)=>{ const f=s=>Math.round(((a>>s)&255)*(1-t)+((b>>s)&255)*t); return (f(16)<<16)|(f(8)<<8)|f(0); };
/* =========================================================
   Haustuer der Wohnhaeuser gegenueber (Tom, 24.09.: die gemalten
   Tueren sahen schlecht aus). Kassettentuer mit Glaseinsatz und
   Ziergitter, Oberlicht, Messingdruecker, Briefschlitz und
   Stossblech; Klingeltableau in der Laibung, Hausnummer und eine
   Wandleuchte, die nachts brennt. Seit 26.09. in einer 30 cm tiefen
   Nische mit Stufe, alle Teile im Sammler statt 17 Einzelmeshes.
   ========================================================= */
const TUERFARBEN=['#1f4d3a','#1e3553','#6b2430','#5a3b26','#2d3035','#3f5a6b'];
const _tuerTex={};
function tuerTex(farbe){
  if(_tuerTex[farbe]) return _tuerTex[farbe];
  const t=tex(256,512,(g,W,H)=>{
    g.fillStyle=farbe; g.fillRect(0,0,W,H);
    /* feine Maserung im Lack */
    for(let i=0;i<500;i++){ g.fillStyle=`rgba(${Math.random()<0.5?0:255},${Math.random()<0.5?0:255},${Math.random()<0.5?0:255},${Math.random()*0.035})`; g.fillRect(Math.random()*W,Math.random()*H,1,rand(6,30)); }
    const kass=(x,y,w,h)=>{ /* erhabene Fuellung: Licht oben links, Schatten unten rechts */
      g.fillStyle='rgba(255,255,255,.13)'; g.fillRect(x,y,w,5); g.fillRect(x,y,5,h);
      g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x,y+h-5,w,5); g.fillRect(x+w-5,y,5,h);
      g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(x+14,y+14,w-28,h-28);
      g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(x+14,y+14,w-28,3); };
    /* Glaseinsatz oben mit Ziergitter */
    const gx=40,gy=42,gw=W-80,gh=150;
    g.fillStyle='rgba(0,0,0,.45)'; g.fillRect(gx-6,gy-6,gw+12,gh+12);
    const gl=g.createLinearGradient(gx,gy,gx+gw,gy+gh); gl.addColorStop(0,'#3d4c62'); gl.addColorStop(0.45,'#1b2433'); gl.addColorStop(1,'#2e3a4d');
    g.fillStyle=gl; g.fillRect(gx,gy,gw,gh);
    g.fillStyle='rgba(200,220,245,.22)'; g.beginPath(); g.moveTo(gx,gy+gh*0.2); g.lineTo(gx+gw*0.45,gy); g.lineTo(gx+gw*0.6,gy); g.lineTo(gx,gy+gh*0.55); g.closePath(); g.fill();
    g.strokeStyle='#15171b'; g.lineWidth=4;
    for(let k=1;k<4;k++){ g.beginPath(); g.moveTo(gx+gw*k/4,gy); g.lineTo(gx+gw*k/4,gy+gh); g.stroke(); }
    g.beginPath(); g.arc(gx+gw/2,gy+gh/2,34,0,Math.PI*2); g.stroke();
    /* zwei Kassetten unten */
    kass(40,232,W-80,110); kass(40,356,W-80,110);
    /* Briefschlitz und Stossblech in Messing */
    g.fillStyle='#b8913e'; g.fillRect(W/2-44,210,88,12); g.fillStyle='#2a2216'; g.fillRect(W/2-36,214,72,4);
    const ms=g.createLinearGradient(0,H-34,0,H); ms.addColorStop(0,'#d3b066'); ms.addColorStop(1,'#8a6a2a');
    g.fillStyle=ms; g.fillRect(0,H-34,W,34);
  });
  t.anisotropy=8; _tuerTex[farbe]=t; return t;
}
function hausTuer(K,o,x){
  const zf=o.zf, R=0.3, tb=1.3, th=3.0, y0=0.34, farbe=pick(TUERFARBEN), stein=0x9a958c;
  o.loch.push([x,0.17,tb,th-0.17]); o.glow.push([x,th+0.3,1.5]);
  /* eine Stufe vor der Fassade, eine in der Nische */
  K.B('putz',tb+0.5,0.17,0.42,x,0.085,zf+0.21,stein);
  K.B('putz',tb,y0,R,x,y0/2,zf-R/2,stein);
  K.R('putz',[x-tb/2,(y0+th)/2,zf-R/2],[0,0,-1],[0,1,0],R,th-y0,o.laibF);
  K.R('putz',[x+tb/2,(y0+th)/2,zf-R/2],[0,0,1],[0,1,0],R,th-y0,o.laibF);
  K.R('putz',[x,th,zf-R/2],[1,0,0],[0,0,1],tb,R,o.laibD);
  /* Zarge, Blatt mit Lackkante, Kaempfer und Oberlicht */
  const zb=zf-R, rc=0xe4dfd4, lw=tb-0.2, lh=th-y0-0.1-0.42;
  for(const sx of [-1,1]) K.B('rahmen',0.1,th-y0,0.12,x+sx*(tb/2-0.05),(y0+th)/2,zb+0.06,rc);
  K.B('rahmen',tb,0.1,0.12,x,th-0.05,zb+0.06,rc);
  K.B('rahmen',lw,lh,0.05,x,y0+lh/2,zb+0.035,parseInt(farbe.slice(1),16));
  const zl=zb+0.061;
  K.Q('tuer:'+farbe,[[x-lw/2,y0,zl],[x+lw/2,y0,zl],[x+lw/2,y0+lh,zl],[x-lw/2,y0+lh,zl]],[0,0,1,1]);
  K.B('rahmen',lw,0.06,0.1,x,y0+lh+0.03,zb+0.05,rc);
  const yo=y0+lh+0.06; K.G(x,yo,lw,th-0.1-yo,zb+0.02,Math.random()<0.6?11:3);
  K.B('rahmen',0.04,th-0.1-yo,0.05,x,(yo+th-0.1)/2,zb+0.04,rc);
  /* Druecker mit Langschild */
  K.B('messing',0.05,0.2,0.012,x+lw/2-0.1,y0+1.0,zl+0.006);
  K.B('messing',0.14,0.022,0.022,x+lw/2-0.16,y0+1.05,zl+0.03);
  /* Klingeltableau in der Laibung */
  K.B('zink',0.02,0.3,0.13,x+tb/2-0.012,1.5,zf-0.12,0xc7ccd4);
  for(let k=0;k<3;k++){ K.B('messing',0.012,0.025,0.025,x+tb/2-0.028,1.6-k*0.08,zf-0.15);
    K.B('rahmen',0.004,0.02,0.05,x+tb/2-0.024,1.6-k*0.08,zf-0.09,0xf2efe6); }
  /* Hausnummer und Wandleuchte ueber der Nische */
  const nx=x+0.5, ny=th+0.32;
  K.Q('schild',[[nx-0.12,ny-0.09,zf+0.012],[nx+0.12,ny-0.09,zf+0.012],[nx+0.12,ny+0.09,zf+0.012],[nx-0.12,ny+0.09,zf+0.012]],nummerUV(Math.floor(Math.random()*16)),0xffffff);
  const sw=0x1e2126;
  K.B('zink',0.05,0.05,0.12,x,th+0.4,zf+0.05,sw);
  K.B('zink',0.18,0.03,0.16,x,th+0.44,zf+0.14,sw);
  K.B('lampe',0.14,0.16,0.12,x,th+0.345,zf+0.14);
  K.B('zink',0.16,0.025,0.14,x,th+0.255,zf+0.14,sw);
}
/* =========================================================
   Laeden gegenueber mit echtem Innenraum (Tom, 26.09.: "es soll
   wirklich so aussehen, als sind da Laeden drin, gerne 3D").
   Hinter dem Schaufenster: Boden, Decke mit Leuchten, Waende und je
   Ladenart eine eigene Einrichtung. Alles zu zwei Meshes verschmolzen
   (Einrichtung und Leuchten). Seit dem Umbau nur noch so breit wie
   die Ladenfront (xa..xb), der Boden liegt eine Stufe hoch (yb).
   ========================================================= */
let _innenM=null,_lichtM=null;
const _innenNacht={value:0};
function ladenInnen(g,typ,xa,xb,gfH,z1,farbe,yb){
  if(!_innenM){ _innenM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.7,emissive:LIN(0x40362a),emissiveIntensity:0});
    /* Der Raum wird nach hinten dunkler (Vertexfarbe, unten), deshalb
       darf der Grundton heller sein als der alte Dimmer 0x9a958e - mit
       dem war die Ware hinter der Scheibe nicht zu erkennen (27.09.) */
    _innenM.color=LIN(0xd2ccc3);
    /* Nachts leuchtet der Laden von innen: die Einrichtung strahlt in
       ihrer eigenen Farbe (Vertexfarbe), statt nur flach im Emissive-Ton.
       Ohne das war der Laden nachts eine graue Hoehle (26.09.). */
    _innenM.onBeforeCompile=sh=>{ sh.uniforms.uNacht=_innenNacht;
      sh.fragmentShader='uniform float uNacht;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance += vColor * vec3(1.0,0.82,0.6) * uNacht;\n#endif'); };
    _lichtM=new THREE.MeshBasicMaterial({color:0xfff6e2,toneMapped:false}); }
  /* Waende und Boden schliessen buendig an die Laibung an - vorher
     blieb seitlich und vorn ein Spalt, durch den man schraeg ins hohle
     Haus sah (27.09.) */
  const T=[], L=[], D=2.6, x0=xa+0.025, x1=xb-0.025, iw=x1-x0, xm=(x0+x1)/2, z0=z1-D, yt=gfH-0.02;
  /* Schaufensterzone: vom linken Rand bis vor die Ladentuer (rechts) -
     dort steht die Auslage, der Weg zur Tuer bleibt frei (27.09.) */
  const xt=xb-1.2, aw=xt-x0-0.1, am=(x0+0.05+xt)/2, zA=z1-0.42;
  const B=(bw,bh,bd,x,y,z,c)=>T.push({geo:new THREE.BoxGeometry(bw,bh,bd),m:tm(x,y,z),color:c});
  const C=(r1,r2,h,x,y,z,c,seg)=>T.push({geo:new THREE.CylinderGeometry(r1,r2,h,seg||10),m:tm(x,y,z),color:c});
  const K=(r,x,y,z,c,sy)=>T.push({geo:new THREE.SphereGeometry(r,8,6),m:tm(x,y,z,0,0,0,1,sy||1,1),color:c});
  const t=typ.toUpperCase(), holz=/^(BÄCK|CAF|BUCH)/.test(t);
  const wand=parseInt(farbe.slice(1),16), hell=new THREE.Color(wand).lerp(new THREE.Color(0xe8e2d6),0.6).getHex();
  /* Raum */
  B(iw,0.04,D,xm,yb-0.02,(z0+z1)/2,holz?0x8a6a4a:0xcdc8bf);
  B(iw,0.04,D,xm,yt,(z0+z1)/2,0xf2f0ea);
  B(iw,yt-yb,0.05,xm,(yb+yt)/2,z0,hell);
  for(const sx of [-1,1]) B(0.05,yt-yb,D,xm+sx*iw/2,(yb+yt)/2,(z0+z1)/2,0xd6cfc2);
  /* Deckenleuchten */
  const nl=Math.max(2,Math.round(iw/2));
  for(let i=0;i<nl;i++) L.push({geo:new THREE.BoxGeometry(0.9,0.03,0.25),m:tm(x0+iw*(i+0.5)/nl,yt-0.03,(z0+z1)/2)});
  /* Regal mit Rueckwand, Waenden und Boeden. Vorher war es ein voller
     Quader und die Ware stand IN ihm - von draussen sah man nur eine
     weisse Tafel (27.09.). Die Rueckwand ist dunkler als die Ware. */
  const regal=(x,bw,faecher,fill,rueck)=>{ const hR=yt-yb-0.35, zr=z0+0.24;
    B(bw,hR,0.03,x,yb+hR/2,z0+0.05,rueck||0x6a5040);
    for(const sx of [-1,1]) B(0.03,hR,0.42,x+sx*bw/2,yb+hR/2,zr,0xe8e4dc);
    B(bw,0.03,0.42,x,yb+hR,zr,0xe8e4dc);
    for(let k=0;k<faecher;k++){ const y=yb+0.2+k*(hR-0.5)/Math.max(1,faecher-1);
      B(bw-0.04,0.025,0.4,x,y,zr,0xdad6ce);
      /* auf dem Handy nur jedes zweite Fach gefuellt - spart Dreiecke */
      if(fill&&(HIQ||k%2===0)) for(let j=0;j<Math.floor((bw-0.1)/0.16);j++) fill(x-bw/2+0.13+j*0.16,y+0.012,z0+0.26,j+k*7); } };
  const R=[0xc8322a,0x2f5d9e,0xd9a52f,0x3f8a4a,0x8a3a7a,0xe8e4d8,0x2a2e36];
  const theke=(x,bw,c)=>{ B(bw,0.95,0.6,x,yb+0.475,z0+1.35,c); B(bw+0.06,0.04,0.66,x,yb+0.97,z0+1.35,0x3a3f48); };
  /* Podest im Schaufenster */
  const podest=(h,c)=>B(aw,h,0.5,am,yb+h/2,z1-0.32,c);
  const nA=w=>Math.max(1,Math.floor(aw/w));
  if(t.startsWith('BÄCK')){
    regal(x0+iw*0.35,iw*0.6,4,(x,y,z,j)=>K(0.07,x,y+0.05,z,j%3?0xb07a3e:0xd9a45a,0.6),0x7a5030);
    theke(x0+iw*0.35,iw*0.6,0xe8e2d4);
    for(let j=0;j<Math.floor(iw*0.55/0.2);j++) K(0.07,x0+iw*0.08+j*0.2,yb+1.02,z0+1.35,j%2?0xc98a45:0x9a5a2a,0.55);
    /* Auslage im Fenster: Koerbe mit Broten und Brezeln auf dem Podest */
    podest(0.28,0xe8e2d4);
    for(let j=0;j<nA(0.9);j++){ const x=x0+0.5+j*0.9; B(0.6,0.12,0.4,x,yb+0.34,z1-0.3,0x8a5a2a);
      for(let k=0;k<3;k++) K(0.1,x-0.17+k*0.17,yb+0.44,z1-0.3,k%2?0xc98a45:0xa0602a,0.55); }
  } else if(t.startsWith('APOTH')){
    regal(x0+iw*0.3,iw*0.5,5,(x,y,z,j)=>B(0.1,0.12,0.12,x,y+0.06,z,j%4?0xf2f2ee:0x3f8a4a),0x4f6e5e);
    regal(x0+iw*0.78,iw*0.35,5,(x,y,z,j)=>B(0.1,0.1,0.1,x,y+0.05,z,j%3?0xe8ecf2:0x2f5d9e),0x4f6e5e);
    theke(x0+iw*0.5,iw*0.5,0xf4f2ee);
    L.push({geo:new THREE.BoxGeometry(0.1,0.34,0.02),m:tm(xm,yt-0.35,z0+0.04)}); L.push({geo:new THREE.BoxGeometry(0.34,0.1,0.02),m:tm(xm,yt-0.35,z0+0.04)});
    /* haengende Werbetafeln, davor Packungen auf dem Podest */
    for(let j=0;j<nA(1.2);j++) B(0.7,0.95,0.03,x0+0.6+j*1.2,yb+1.25,z1-0.75,j%2?0x3f8a4a:0xe8ecf2);
    podest(0.34,0xf4f2ee);
    for(let j=0;j<nA(0.26);j++) B(0.16,0.22+(j%3)*0.04,0.1,x0+0.2+j*0.26,yb+0.45+(j%3)*0.02,z1-0.3,[0x3f8a4a,0xe8ecf2,0xc8322a,0x2f5d9e][j%4]);
  } else if(t.startsWith('BLUM')){
    for(let r=0;r<2;r++) for(let j=0;j<nA(0.5);j++){ const x=x0+0.3+j*0.5, z=z1-0.45-r*0.6;
      C(0.16,0.12,0.36,x,yb+0.18,z,0x5a6068); for(let k=0;k<5;k++) K(0.07,x+rand(-0.1,0.1),yb+0.5+rand(0,0.2),z+rand(-0.1,0.1),R[(j+k+r)%5]); }
    for(let j=0;j<3;j++){ C(0.2,0.16,0.4,x0+0.5+j*iw*0.35,yb+0.2,z0+0.4,0x7a5a3a); K(0.38,x0+0.5+j*iw*0.35,yb+0.8,z0+0.4,0x3f7a3a,1.3); }
  } else if(t.startsWith('CAF')){
    /* Kuchentheke mit Glasaufsatz, Kaffeemaschine, Tischchen am Fenster */
    theke(x0+iw*0.6,iw*0.55,0x5a3b26);
    for(let j=0;j<Math.floor(iw*0.5/0.3);j++) C(0.11,0.11,0.08,x0+iw*0.38+j*0.3,yb+1.03,z0+1.35,j%2?0xf2e6d0:0x6a3a2a,12);
    B(0.55,0.45,0.4,x0+iw*0.8,yb+0.72+0.5,z0+0.3,0x9aa1ac); B(iw*0.8,0.03,0.3,xm,yb+1.6,z0+0.2,0x5a3b26);
    for(let j=0;j<nA(1.4);j++){ const x=x0+0.7+j*1.4, z=z1-0.6;
      C(0.32,0.32,0.03,x,yb+0.74,z,0xf2f0ea,14); C(0.035,0.035,0.72,x,yb+0.36,z,0x2a2e36);
      for(const sx of [-1,1]){ B(0.36,0.04,0.36,x+sx*0.5,yb+0.45,z,0x3a2a20); B(0.36,0.42,0.04,x+sx*0.5,yb+0.68,z-0.16,0x3a2a20); }
      C(0.04,0.035,0.08,x+0.08,yb+0.8,z,0xf2f0ea); }
  } else if(t.startsWith('BUCH')){
    regal(x0+iw*0.3,iw*0.45,6,(x,y,z,j)=>B(0.035,rand(0.18,0.26),0.2,x,y+0.11,z,R[(j*5)%7]),0x4a3020);
    regal(x0+iw*0.75,iw*0.4,6,(x,y,z,j)=>B(0.035,rand(0.18,0.26),0.2,x,y+0.11,z,R[(j*3+1)%7]),0x4a3020);
    /* Buechertisch am Fenster mit Stapeln */
    B(aw*0.9,0.06,0.7,am,yb+0.75,z1-0.6,0x5a3b26); for(const sx of [-1,1]) B(0.06,0.72,0.6,am+sx*aw*0.42,yb+0.36,z1-0.6,0x5a3b26);
    for(let j=0;j<Math.floor(aw*0.8/0.3);j++) for(let k=0;k<3;k++) B(0.22,0.035,0.28,am-aw*0.38+0.15+j*0.3,yb+0.8+k*0.036,z1-0.6,R[(j+k)%7]);
  } else if(t.startsWith('WASCH')){
    for(let j=0;j<Math.floor(iw/0.72);j++){ const x=x0+0.4+j*0.72;
      B(0.62,0.88,0.62,x,yb+0.44,z0+0.4,0xf2f2ee); C(0.2,0.2,0.04,x,yb+0.5,z0+0.72,0x2a3a4a,16);
      T[T.length-1].m=tm(x,yb+0.5,z0+0.72,Math.PI/2,0,0); B(0.5,0.08,0.02,x,yb+0.8,z0+0.72,0xb8bec8); }
    B(aw*0.6,0.45,0.4,am,yb+0.22,z1-0.6,0x3a4a6a);
  } else if(t.startsWith('GETR')){
    for(let j=0;j<Math.floor(iw/0.5);j++) for(let k=0;k<4;k++){ const c=R[(j*3+k)%5];
      B(0.4,0.28,0.32,x0+0.3+j*0.5,yb+0.14+k*0.29,z0+0.35,c); B(0.36,0.02,0.28,x0+0.3+j*0.5,yb+0.29+k*0.29,z0+0.35,0x2a2e36); }
    for(let j=0;j<Math.floor(iw/0.7);j++) for(let k=0;k<2;k++) B(0.4,0.28,0.32,x0+0.4+j*0.7,yb+0.14+k*0.29,z0+1.3,R[(j+k)%4]);
    /* Kistenstapel im Fenster */
    for(let j=0;j<nA(1.1);j++) for(let k=0;k<3;k++) B(0.4,0.28,0.32,x0+0.4+j*1.1,yb+0.14+k*0.29,z1-0.4,R[(j*2+k)%5]);
  } else if(t.startsWith('PIZZ')){
    theke(x0+iw*0.3,iw*0.45,0x7a3a2a);
    B(0.9,0.9,0.7,x0+iw*0.75,yb+0.7,z0+0.4,0x3a3a3a); L.push({geo:new THREE.BoxGeometry(0.5,0.2,0.02),m:tm(x0+iw*0.75,yb+0.7,z0+0.76)});
    for(let j=0;j<Math.min(2,nA(1.6));j++){ const x=x0+0.8+j*1.6, z=z1-0.7; C(0.35,0.35,0.04,x,yb+0.74,z,0xe8e2d4,14); C(0.04,0.04,0.72,x,yb+0.36,z,0x3a3f48);
      for(const sx of [-1,1]){ B(0.36,0.04,0.36,x+sx*0.55,yb+0.45,z,0x6a4a2a); B(0.36,0.4,0.04,x+sx*0.55,yb+0.66,z,0x6a4a2a); } }
  } else if(t.startsWith('METZ')){
    B(iw*0.8,0.85,0.7,xm,yb+0.425,z0+1.4,0xf2f2ee);
    for(let j=0;j<Math.floor(iw*0.75/0.22);j++) K(0.08,xm-iw*0.37+j*0.22,yb+0.9,z0+1.4,j%3?0xb8403a:0xd88a80,0.5);
    regal(xm,iw*0.7,3,(x,y,z,j)=>C(0.04,0.04,0.2,x,y+0.1,z,j%2?0x9a3a2a:0xc9a07a),0xe4e8ea);
    /* Im Fenster: Stange mit Wuersten und Schinken, darunter Schalen */
    B(aw,0.03,0.03,am,yb+2.05,zA,0xb8bec8);
    for(let j=0;j<nA(0.3);j++){ const x=x0+0.2+j*0.3;
      if(j%3===1) K(0.13,x,yb+1.84,zA,0x9a4a3a,1.5); else C(0.035,0.03,0.42,x,yb+1.83,zA,j%2?0x8a3a2a:0xb0704a); }
    podest(0.4,0xf2f2ee);
    for(let j=0;j<nA(0.4);j++) B(0.3,0.04,0.22,x0+0.25+j*0.4,yb+0.42,z1-0.3,j%2?0xb8403a:0xd88a80);
  } else if(t.startsWith('FRIS')){
    for(let j=0;j<Math.floor(iw/1.1);j++){ const x=x0+0.6+j*1.1;
      B(0.5,0.12,0.5,x,yb+0.5,z0+0.7,0x1e2228); B(0.5,0.5,0.1,x,yb+0.8,z0+0.47,0x1e2228); C(0.05,0.05,0.4,x,yb+0.22,z0+0.7,0x9aa1ac);
      B(0.7,0.9,0.03,x,yb+1.2,z0+0.05,0xcfe2f2); L.push({geo:new THREE.BoxGeometry(0.7,0.04,0.02),m:tm(x,yb+1.68,z0+0.07)}); }
    /* Im Fenster: Pflanze und ein Bord mit Flaschen */
    C(0.18,0.14,0.4,x0+0.4,yb+0.2,z1-0.45,0xe8e4dc); K(0.34,x0+0.4,yb+0.85,z1-0.45,0x3f7a3a,1.4);
    B(aw*0.6,0.03,0.25,am+aw*0.15,yb+0.9,zA+0.05,0xf4f2ee);
    for(let j=0;j<Math.floor(aw*0.55/0.12);j++) C(0.035,0.035,0.2,am-aw*0.12+j*0.12,yb+1.02,zA+0.05,R[j%5]);
  } else if(t.startsWith('OPTIK')){
    regal(x0+iw*0.5,iw*0.8,5,(x,y,z,j)=>B(0.12,0.03,0.05,x,y+0.03,z+0.1,j%3?0x2a2e36:0x8a5a3a),0xe8e4dc);
    theke(x0+iw*0.5,iw*0.35,0xf4f2ee); C(0.3,0.3,0.02,x1-0.3,yb+1.3,z0+0.06,0xcfe2f2,20); T[T.length-1].m=tm(x1-0.3,yb+1.3,z0+0.06,Math.PI/2,0,0);
    /* Im Fenster: Saeulen mit je einer Brille */
    for(let j=0;j<nA(0.7);j++){ const x=x0+0.4+j*0.7, h=0.5+(j%3)*0.25;
      C(0.12,0.12,h,x,yb+h/2,z1-0.4,0xf4f2ee,12); B(0.16,0.045,0.03,x,yb+h+0.05,z1-0.4,j%2?0x2a2e36:0x8a5a3a); }
  } else if(t.startsWith('REISE')){
    for(let j=0;j<Math.floor(iw/1.4);j++){ const x=x0+0.8+j*1.4;
      B(1.1,0.05,0.6,x,yb+0.74,z0+1.0,0xe8e2d4); B(0.05,0.72,0.5,x-0.5,yb+0.36,z0+1.0,0x3a3f48); B(0.05,0.72,0.5,x+0.5,yb+0.36,z0+1.0,0x3a3f48);
      B(0.45,0.3,0.03,x,yb+0.95,z0+0.85,0x1e2228); }
    for(let j=0;j<Math.floor(iw/0.9);j++) B(0.7,0.5,0.02,x0+0.5+j*0.9,yb+1.35,z0+0.04,R[j%5]);
    /* Im Fenster: Plakatstaender mit Meer und Strand, dazu eine Palme */
    for(let j=0;j<Math.max(1,Math.min(3,Math.floor((aw-0.9)/1.3)));j++){ const x=x0+0.6+j*1.3;
      B(0.8,0.6,0.02,x,yb+1.3,zA,j%2?0x2f8ab8:0x3a9ac8); B(0.8,0.4,0.02,x,yb+0.8,zA,0xe8c878); B(0.84,1.04,0.015,x,yb+1.1,zA-0.02,0xf4f2ee);
      B(0.03,0.6,0.03,x,yb+0.3,zA-0.05,0x3a3f48); }
    C(0.05,0.07,1.4,xt-0.35,yb+0.7,z1-0.5,0x7a5a3a); for(let k=0;k<6;k++){ const a=k/6*Math.PI*2; K(0.22,xt-0.35+Math.cos(a)*0.25,yb+1.45,z1-0.5+Math.sin(a)*0.2,0x3f7a3a,0.35); }
  } else {
    /* Kiosk und Schreibwaren: volles Regal, Theke und im Fenster eine
       Wand mit schraeg gestellten Zeitschriften */
    regal(x0+iw*0.3,iw*0.5,5,(x,y,z,j)=>B(0.12,0.16,0.08,x,y+0.08,z,R[j%7]),0x3a3f48);
    theke(x0+iw*0.72,iw*0.36,0x3a4a6a);
    B(aw,1.2,0.03,am,yb+0.9,zA-0.14,0x2a2e36);
    for(let k=0;k<3;k++) for(let j=0;j<nA(0.24);j++){ const x=x0+0.18+j*0.24, y=yb+0.5+k*0.37;
      T.push({geo:new THREE.BoxGeometry(0.2,0.28,0.012),m:tm(x,y,zA,-0.2,0,0),color:R[(j*3+k*5)%7]});
      T.push({geo:new THREE.BoxGeometry(0.2,0.06,0.006),m:tm(x,y+0.099,zA-0.012,-0.2,0,0),color:(j+k)%2?0xf4f2ee:0xe8c840}); }
  }
  const geo=merge(T), P=geo.attributes.position.array, F=geo.attributes.color.array;
  /* Licht kommt von vorn: nach hinten wird der Raum dunkler, die
     Auslage im Fenster bleibt hell. Vorher war alles gleich hell und
     der Laden sah nachts aus wie ein Leuchtkasten (27.09.) */
  for(let i=0,n=P.length/3;i<n;i++){ const k=1-0.55*clamp((z1-P[i*3+2])/D,0,1); F[i*3]*=k; F[i*3+1]*=k; F[i*3+2]*=k; }
  const mm=new THREE.Mesh(geo,_innenM); g.add(mm);
  /* etwas Eigenlicht auch am Tag (die Laeden haben Licht an), nachts
     viel mehr; die Nacht liest sich an den Fensterscheiben ab */
  mm.onBeforeRender=()=>{ _innenNacht.value=0.04+0.4*(_hzM?clamp(_hzM.glas.emissiveIntensity/0.9,0,1):0); };
  if(L.length) g.add(new THREE.Mesh(merge(L.map(l=>Object.assign(l,{color:0xffffff}))),_lichtM));
}
/* ---------- Fenster: echte Oeffnung mit Laibung, Rahmen, Bank ---------- */
const FENSTERWAHL=[0,0,0,1,1,2,3,3,4,5,6,7];
function fensterZufall(){ const v=pick(FENSTERWAHL); return Math.random()<0.42?v+8:v; }
function fenster(K,o,x,yb,ww,wh,art){
  const zf=o.zf, R=o.laib, alt=o.stil!=='nach', sc=o.stuckF, rc=o.rahmenF;
  o.loch.push([x,yb,ww,wh]);
  K.R('putz',[x-ww/2,yb+wh/2,zf-R/2],[0,0,-1],[0,1,0],R,wh,o.laibF);
  K.R('putz',[x+ww/2,yb+wh/2,zf-R/2],[0,0,1],[0,1,0],R,wh,o.laibF);
  K.R('putz',[x,yb+wh,zf-R/2],[1,0,0],[0,0,1],ww,R,o.laibD);
  K.R('putz',[x,yb,zf-R/2],[1,0,0],[0,0,-1],ww,R,o.laibF);
  const zg=zf-R+0.02; K.G(x,yb,ww,wh,zg,fensterZufall());
  /* Blendrahmen, Mittelpfosten, bei Altbauten Kaempfer und Sprossen */
  const zr=zg+0.045, b=0.07;
  /* auf dem Handy reicht der Mittelpfosten, der Blendrahmen kostet nur Dreiecke */
  if(HIQ){ K.B('rahmen',ww,b,0.07,x,yb+wh-b/2,zr,rc); K.B('rahmen',ww,b*1.4,0.08,x,yb+b*0.7,zr,rc);
    K.B('rahmen',b,wh,0.07,x-ww/2+b/2,yb+wh/2,zr,rc); K.B('rahmen',b,wh,0.07,x+ww/2-b/2,yb+wh/2,zr,rc); }
  if(ww>0.85) K.B('rahmen',0.075,wh-0.1,0.06,x,yb+wh/2,zr+0.012,rc);
  if(alt&&wh>1.5){ K.B('rahmen',ww-0.1,0.075,0.07,x,yb+wh*0.74,zr+0.01,rc);
    if(HIQ&&art!=='treppe') for(const sx of [-1,1]) K.B('rahmen',ww/2-0.1,0.03,0.03,x+sx*ww/4,yb+wh*0.38,zr+0.02,rc); }
  /* Sohlbank mit Schnee: Altbau Stein mit Konsolen, Nachkrieg Zinkblech */
  if(alt){ K.B('putz',ww+0.34,0.1,0.18,x,yb-0.05,zf+0.09,sc);
    if(HIQ&&art!=='treppe') for(const sx of [-1,1]) K.B('putz',0.11,0.16,0.12,x+sx*(ww/2+0.07),yb-0.18,zf+0.06,sc);
    K.B('putz',ww+0.28,0.035,0.15,x,yb+0.017,zf+0.1,0xf2f5f8); }
  else { K.B('zink',ww+0.08,0.03,0.14,x,yb-0.015,zf+0.07,0x9aa0a8); K.B('putz',ww+0.04,0.03,0.11,x,yb+0.013,zf+0.07,0xf2f5f8); }
  /* Blumenkasten mit Tannengruen und ein paar roten Kugeln - so sieht
     eine Fassade Ende Dezember aus; vorher waren alle Baenke leer (27.09.) */
  if(HIQ&&art!=='treppe'&&art!=='eg'&&wh<2&&Math.random()<(art==='bel'?0.4:0.12)){ const zk=zf+0.11, yk=yb+(alt?0.035:0.028), n=Math.max(3,Math.round(ww/0.15));
    K.B('rahmen',ww+0.04,0.16,0.16,x,yk+0.08,zk,alt?0x5e4230:0x3a3f48);
    for(let i=0;i<n;i++){ const px=x-ww/2+0.07+i*(ww-0.14)/(n-1);
      K.K('rahmen',0.085,px,yk+0.19+(i%2)*0.03,zk+(i%2?0.03:-0.02),i%3?0x2c4a2e:0x3a5a34);
      if(i%3===1) K.K('rahmen',0.028,px+0.03,yk+0.25,zk+0.08,0xb8202a); } }
  /* Faschen um die Oeffnung decken zugleich die Schnittkante im Putz */
  const s=alt?0.14:0.1, pr=alt?0.05:0.02, fc=alt?sc:o.faschF;
  K.B('putz',ww+2*s,s,pr,x,yb+wh+s/2,zf+pr/2,fc);
  for(const sx of [-1,1]) K.B('putz',s,wh,pr,x+sx*(ww/2+s/2),yb+wh/2,zf+pr/2,fc);
  if(!alt) return;
  /* Verdachung: Dreiecksgiebel in der Beletage, gerades Gesims darueber, sonst Schlussstein */
  const yT=yb+wh+s;
  if(art==='bel'){ const a=ww/2+s+0.12, y1=yT+0.14, hg=0.3, z0=zf, z1=zf+0.17;
    K.B('putz',2*a,0.14,0.17,x,yT+0.07,zf+0.085,sc);
    K.F('putz',[[[x-a,y1,z1],[x+a,y1,z1],[x,y1+hg,z1]],[[x-a,y1,z0],[x-a,y1,z1],[x,y1+hg,z1],[x,y1+hg,z0]],[[x,y1+hg,z0],[x,y1+hg,z1],[x+a,y1,z1],[x+a,y1,z0]]],sc);
  } else if(art==='mitte'){
    K.B('putz',ww+2*s+0.16,0.1,0.13,x,yT+0.05,zf+0.065,sc); K.B('putz',ww+2*s+0.3,0.07,0.19,x,yT+0.135,zf+0.095,sc);
    K.B('putz',ww+2*s+0.26,0.03,0.15,x,yT+0.185,zf+0.095,0xf2f5f8);
  } else if(art!=='treppe') K.B('putz',0.2,0.26,0.07,x,yb+wh+s/2-0.02,zf+0.045,sc);
  /* Brüstungsfeld unter dem Fenster */
  if(HIQ&&(art==='bel'||art==='mitte')){ const y0=yb-0.22, hp=0.36, f=0.05, z=zf+0.012;
    K.B('putz',ww,f,0.025,x,y0-f/2,z,sc); K.B('putz',ww,f,0.025,x,y0-hp+f/2,z,sc);
    for(const sx of [-1,1]) K.B('putz',f,hp-2*f,0.025,x+sx*(ww/2-f/2),y0-hp/2,z,sc); }
}
/* ---------- Gaube: Front mit Fenster, Wangen, eigenes Satteldach ---------- */
function gaube(K,o,xc,zD,h,zE,t,wd,wh,vorn,wange){
  const yR=h+(zE-zD)*t, ww=wd-0.4, yS=yR+0.12, yT=yS+0.08+wh+0.2, yG=yT+wd*0.42;
  const zB2=zE-(yT-h)/t, zB=zE-(yG-h)/t, xl=xc-wd/2, xr=xc+wd/2, zw=zD-0.16, zFr=zD+0.12;
  /* Front: Pfeiler, Bruestung, Sturz; das Fenster sitzt 12 cm zurueck */
  for(const sx of [-1,1]) K.B('putz',0.2,yT-yR+0.2,0.16,xc+sx*(ww/2+0.1),(yT+yR-0.2)/2,zD-0.08,vorn);
  K.B('putz',ww,yS+0.08-yR+0.2,0.16,xc,(yS+0.08+yR-0.2)/2,zD-0.08,vorn);
  K.B('putz',ww,0.2,0.16,xc,yT-0.1,zD-0.08,vorn);
  K.G(xc,yS+0.08,ww,wh,zD-0.14,fensterZufall());
  const rc=o.rahmenF; K.B('rahmen',0.06,wh,0.05,xc,yS+0.08+wh/2,zD-0.11,rc);
  K.B('rahmen',ww,0.06,0.05,xc,yS+0.08+wh*0.7,zD-0.11,rc);
  K.B('zink',ww+0.1,0.03,0.12,xc,yS+0.065,zD+0.04,0x8f959e);
  /* Wangen bis zur Dachflaeche */
  K.F('putz',[[[xl,yR-0.05,zw],[xl,yT,zw],[xl,yT,zB2]]],wange);
  K.F('putz',[[[xr,yR-0.05,zw],[xr,yT,zB2],[xr,yT,zw]]],wange);
  /* Giebeldreieck und Dach mit Schnee */
  K.F('putz',[[[xl,yT,zD],[xr,yT,zD],[xc,yG,zD]]],vorn);
  const el=xl-0.1, er=xr+0.1, yE=yT-0.1*(yG-yT)/(wd/2);
  const L=[[el,yE,zB2],[el,yE,zFr],[xc,yG,zFr],[xc,yG,zB]], Rr=[[xc,yG,zB],[xc,yG,zFr],[er,yE,zFr],[er,yE,zB2]];
  for(const P of [L,Rr]){ K.F('dach',[P],o.dachF,1.2); K.F('schnee',[P.map(p=>[p[0],p[1]+0.03,p[2]])],0xffffff,2.2); }
  K.B('zink',wd+0.26,0.1,0.06,xc,yE-0.02,zFr+0.02,0x8f959e);
}
/* ---------- Dach: Sattel, Mansarde oder flach mit Attika ---------- */
function hausDach(K,o){
  const w=o.w, zf=o.zf, h=o.h, x0=-w/2, x1=w/2, dc=o.dachF;
  const S=(P,schnee)=>{ K.F('dach',[P],dc,1.2); if(schnee) K.F('schnee',[P.map(p=>[p[0],p[1]+0.035,p[2]])],0xffffff,2.2); };
  const giebel=(pr)=>{ /* Giebelwaende aus dem Profil [z,y], von vorn nach hinten */
    K.F('putz',[pr.map(([z,y])=>[x1,y,z]).reverse()],o.farbe); K.F('putz',[pr.map(([z,y])=>[x0,y,z])],o.farbe); };
  const kamin=(yF,zK)=>{ const n=w>9?2:1; for(let i=0;i<n;i++){ const kx=(n===1?rand(-0.3,0.3):(i?0.28:-0.3))*w, kh=1.0+Math.random()*0.5;
    K.B('putz',0.52,kh+1.2,0.72,kx,yF-1.2+(kh+1.2)/2,zK,o.kaminF);
    K.B('putz',0.6,0.08,0.8,kx,yF+kh-0.08,zK,hexMix(o.kaminF,0xffffff,0.2));
    K.B('zink',0.3,0.2,0.3,kx,yF+kh+0.1,zK,0x4a4640); K.B('putz',0.56,0.05,0.76,kx,yF+kh+0.005,zK,0xf2f5f8); } };
  if(o.dach==='sattel'){ const t=Math.tan(o.neig), ov=o.ueber, zE=zf+ov, yF=h+zE*t, yW=h+ov*t;
    S([[x0,h,zE],[x1,h,zE],[x1,yF,0],[x0,yF,0]],1); S([[x1,h,-zE],[x0,h,-zE],[x0,yF,0],[x1,yF,0]],1);
    giebel([[zf,h],[zf,yW],[0,yF],[-zf,yW],[-zf,h]]);
    K.B('zink',w,0.12,0.13,0,h+0.02,zE+0.04,0x8f959e);
    K.B('dach',w,0.1,0.12,0,yF+0.03,0,dc);
    if(o.stil==='nach'){ /* Traufe mit Sichtsparren */
      K.R('putz',[0,h-0.12,(zf+zE)/2],[1,0,0],[0,0,1],w,ov,0xe8e4dc);
      K.B('rahmen',w,0.2,0.04,0,h-0.05,zE-0.02,0x5a4030);
      if(HIQ) for(let i=0;i<Math.floor(w/0.85);i++) K.B('rahmen',0.08,0.12,ov,-w/2+0.4+i*0.85,h-0.06,zf+ov/2,0x6b4a32); }
    for(const gx of o.gauben) gaube(K,o,gx,zf-0.2,h,zE,t,1.35,1.1,o.stil==='nach'?o.farbe:o.stuckF,o.farbe);
    kamin(yF,-0.7);
  } else if(o.dach==='mansard'){ const t1=Math.tan(1.2), hm=2.7, ov=o.ueber, zE=zf+ov, zK=zE-hm/t1, t2=Math.tan(0.36), yK=h+hm, yF=yK+zK*t2, yW=h+ov*t1;
    S([[x0,h,zE],[x1,h,zE],[x1,yK,zK],[x0,yK,zK]],0); S([[x1,h,-zE],[x0,h,-zE],[x0,yK,-zK],[x1,yK,-zK]],0);
    S([[x0,yK,zK],[x1,yK,zK],[x1,yF,0],[x0,yF,0]],1); S([[x1,yK,-zK],[x0,yK,-zK],[x0,yF,0],[x1,yF,0]],1);
    giebel([[zf,h],[zf,yW],[zK,yK],[0,yF],[-zK,yK],[-zf,yW],[-zf,h]]);
    K.B('zink',w,0.07,0.12,0,yK+0.02,zK,0x6a6e76);
    K.B('zink',w,0.12,0.13,0,h+0.02,zE+0.04,0x8f959e);
    for(const gx of o.gauben) gaube(K,o,gx,zE-0.1,h,zE,t1,1.4,1.3,o.stuckF,0x5a5e66);
    kamin(yF,-0.7);
  } else {
    K.R('putz',[0,h,0],[1,0,0],[0,0,-1],w,2*zf,0x77746e); K.R('schnee',[0,h+0.02,0],[1,0,0],[0,0,-1],w,2*zf,0xffffff,2.2);
    K.B('putz',w,0.75,0.25,0,h+0.375,zf-0.125,o.farbe); K.B('putz',w,0.75,0.25,0,h+0.375,-zf+0.125,o.farbe);
    for(const sx of [-1,1]) K.B('putz',0.25,0.75,2*zf-0.5,sx*(w/2-0.125),h+0.375,0,o.farbe);
    K.B('zink',w+0.04,0.05,0.33,0,h+0.77,zf-0.12,0x9aa0a8); K.B('putz',w,0.04,0.28,0,h+0.81,zf-0.12,0xf2f5f8);
    /* Treppenhausaufbau und Lueftung */
    K.B('putz',2.4,2.3,2.8,w*0.22,h+1.15,-zf*0.35,o.farbe); K.B('zink',2.5,0.06,2.9,w*0.22,h+2.33,-zf*0.35,0x9aa0a8);
    K.B('putz',2.3,0.04,2.7,w*0.22,h+2.38,-zf*0.35,0xf2f5f8);
    for(let i=0;i<3;i++) K.B('zink',0.5,0.5,0.5,-w*0.3+i*0.8,h+0.25,-zf*0.1,0xa0a6ae);
    kamin(h+0.6,-zf*0.6);
  }
}
/* ---------- Ladenfront: Schaufenster, Glastuer, Schild, Markise ---------- */
function ladenFront(K,g,o){
  const zf=o.zf, xa=o.sx0, xb=o.sx1, yT=o.yT, R=0.2, L=o.laden, fr=L.holz?0x3b2a1e:0x2a2e35, stein=L.holz?0x3b2a1e:0x55524d;
  o.loch.push([(xa+xb)/2,0.14,xb-xa,yT-0.14]); o.glow.push([(xa+xb)/2,yT,xb-xa+0.6,'laden']);
  K.R('putz',[xa,(yT+0.14)/2,zf-R/2],[0,0,-1],[0,1,0],R,yT-0.14,o.laibF);
  K.R('putz',[xb,(yT+0.14)/2,zf-R/2],[0,0,1],[0,1,0],R,yT-0.14,o.laibF);
  K.R('putz',[(xa+xb)/2,yT,zf-R/2],[1,0,0],[0,0,1],xb-xa,R,o.laibD);
  const dw=1.05, dx=xb-dw/2-0.04, xw=dx-dw/2, zg=zf-R+0.06, yK=yT-0.5;
  /* Sockel unter dem Glas, Schwelle und Stufe vor der Tuer */
  K.B('putz',xw-xa,0.46,R+0.02,(xa+xw)/2,0.23,zf-R/2,stein);
  K.B('putz',dw+0.08,0.3,R+0.02,dx,0.15,zf-R/2,0x8a857c);
  K.B('putz',dw+0.3,0.15,0.36,dx,0.075,zf+0.18,0x9a958c);
  /* Glas: Schaufenster, Oberlicht, Tuer */
  /* Spiegelung je Scheibe versetzt und in Metern gekachelt, sonst stehen
     die Schraegstreifen in jeder Scheibe an derselben Stelle */
  const S=(a,b,y0,y1,z)=>{ const u=Math.random(); K.Q('scheibe',[[a,y0,z],[b,y0,z],[b,y1,z],[a,y1,z]],[u,0,u+(b-a)/2.6,1],0xffffff); };
  S(xa,xw,0.46,yK,zg); S(xa,xb,yK,yT,zg); S(dx-dw/2+0.05,dx+dw/2-0.05,0.3,yK,zg+0.01);
  /* Profile */
  K.B('rahmen',xw-xa,0.08,0.1,(xa+xw)/2,0.5,zg,fr);
  K.B('rahmen',xb-xa,0.09,0.1,(xa+xb)/2,yK,zg,fr); K.B('rahmen',xb-xa,0.07,0.1,(xa+xb)/2,yT-0.035,zg,fr);
  const n=Math.max(1,Math.round((xw-xa)/1.8));
  for(let i=0;i<=n;i++) K.B('rahmen',i===n?0.1:0.08,yK-0.46,0.1,xa+(xw-xa)*i/n+(i===0?0.04:0),(0.46+yK)/2,zg,fr);
  K.B('rahmen',0.08,yK-0.3,0.1,xb-0.04,(0.3+yK)/2,zg,fr);
  for(let i=1;i<=n;i++) K.B('rahmen',0.05,yT-yK,0.08,xa+(xb-xa)*i/(n+1),(yK+yT)/2,zg,fr);
  K.B('rahmen',dw-0.1,0.1,0.06,dx,0.35,zg+0.02,fr);
  K.B('zink',0.03,0.7,0.04,xw+0.16,1.3,zg+0.07,0xb8bec8);
  ladenInnen(g,L.n,xa,xb,yT,zf-R,L.f,0.3);
  /* Schild: Leuchtkasten oder Einzelbuchstaben auf dem Putzband */
  const i=HZS.length;
  if(i<SCH.zeilen){
    const kasten=!L.holz&&Math.random()<0.5, fc=parseInt(L.f.slice(1),16);
    const sp={t:L.n,serif:!!L.holz,kasten,farbe:L.holz?'#d9b25a':L.f,glut:L.holz?'#ffd98a':hexCss(hexMix(fc,0xffffff,0.55))};
    HZS.push(sp);
    const frac=schriftBreite(sp)/SCH.W, band=o.gH-yT, yc=yT+band*0.5+0.03, xc=(xa+xb)/2;
    const qH=Math.min(kasten?band*0.95:band*1.1,(xb-xa)*0.86/(frac*SCH.W/SCH.zeile)), qW=qH*SCH.W/SCH.zeile, uv=schildUV(i);
    const Q=(z,c)=>K.Q('schild',[[xc-qW/2,yc-qH/2,z],[xc+qW/2,yc-qH/2,z],[xc+qW/2,yc+qH/2,z],[xc-qW/2,yc+qH/2,z]],uv,c);
    /* Traditionsladen: Goldschrift auf dunklem Holzbrett - auf hellem
       Putz war die Goldschrift kaum zu lesen */
    if(L.holz){ const bh=Math.min(band-0.2,qH*0.85); K.B('rahmen',frac*qW+0.6,bh,0.06,xc,yc,zf+0.03,fc); K.B('rahmen',frac*qW+0.66,0.04,0.08,xc,yc+bh/2,zf+0.04,0xb8913e);
      for(let k=2;k>=1;k--) Q(zf+0.062+0.012*(2-k),0x2a2218); Q(zf+0.1,0xffffff); }
    else if(kasten){ K.B('rahmen',frac*qW+0.5,Math.min(band-0.2,qH*0.8),0.14,xc,yc,zf+0.07,fc); Q(zf+0.142,0xffffff); }
    else { for(let k=3;k>=1;k--) Q(zf+0.05-k*0.012,0x2a2622); Q(zf+0.052,0xffffff); }
  }
  /* Ausleger mit Symbol am linken Pfeiler */
  const si=SYMBOLE.indexOf(L.s);
  if(si>=0&&HZS.length&&M_AUSLEGER()){ const xn=xa-0.24, yn=o.gH+0.66, zc=zf+0.53, uv=symbolUV(si);
    K.B('zink',0.04,0.04,0.9,xn,yn+0.36,zf+0.45,0x2a2d33);
    K.B('rahmen',0.05,0.66,0.66,xn,yn,zc,0xb8913e);
    const q=(sx)=>{ const x=xn+sx*0.027, a=-sx; K.Q('schild',[[x,yn-0.31,zc-a*0.31],[x,yn-0.31,zc+a*0.31],[x,yn+0.31,zc+a*0.31],[x,yn+0.31,zc-a*0.31]],uv,0xffffff); };
    q(1); q(-1); }
  /* Markise bei gut der Haelfte der Laeden */
  if(Math.random()<0.55&&HZA.length<8){ const r=HZA.length; HZA.push(Math.random()<0.7?L.f:pick(['#7a2a2a','#2f4a3a','#3a4a6a']));
    const a0=xa-0.05, a1=xb+0.05, ym=yT+0.02, ye=yT-0.5, zm=zf+0.14, ze=zf+1.45, u1=(a1-a0)/4;
    K.Q('markise',[[a0,ye,ze],[a1,ye,ze],[a1,ym,zm],[a0,ym,zm]],[0,1-(r*64+38)/512,u1,1-(r*64)/512]);
    K.Q('markise',[[a0,ye-0.24,ze],[a1,ye-0.24,ze],[a1,ye,ze],[a0,ye,ze]],[0,1-(r*64+64)/512,u1,1-(r*64+40)/512]);
    K.B('zink',a1-a0,0.05,0.05,(a0+a1)/2,ye,ze,0xd0d4da); K.B('zink',a1-a0,0.12,0.2,(a0+a1)/2,ym-0.02,zf+0.1,0x3a3f48);
    const len=Math.hypot(ze-zm,ym-ye)*0.95, rx=Math.atan2(ym-ye,ze-zm);
    for(const sx of [a0+0.35,a1-0.35]) K.B('zink',0.04,0.04,len,sx,(ym+ye)/2-0.08,(zm+ze)/2,0x9aa0a8,rx); }
  /* Lichterkette im Schaufenster - es ist Silvester */
  if(Math.random()<0.5) for(let k=0,n=Math.floor((xw-xa)/0.16);k<n;k++){ const u=k/(n-1||1); K.B('lampe',0.03,0.03,0.03,xa+0.08+u*(xw-xa-0.16),yK-0.1-Math.sin(u*Math.PI*Math.max(1,Math.round((xw-xa)/1.8)))**2*0.18,zg-0.06); }
  /* Vor der Tuer: Blumeneimer, Zeitungsstaender oder ein Aufsteller */
  const t=L.n, by=o.by, xv=xa+0.75, zv=zf+0.5;
  if(t.startsWith('BLUM')){ K.B('rahmen',1.9,0.05,0.5,xa+1.05,by+0.42,zf+0.35,0x5a3b26); for(const sx of [-1,1]) K.B('rahmen',0.05,0.42,0.45,xa+1.05+sx*0.9,by+0.21,zf+0.35,0x5a3b26);
    for(let k=0;k<8;k++){ const x=xa+0.25+(k%4)*0.52, z=zf+(k<4?0.22:0.5), y=k<4?by+0.45:by;
      K.C('zink',0.13,0.1,0.3,x,y+0.15,z,0x6a7078); for(let j=0;j<5;j++) K.K('rahmen',0.07,x+rand(-0.08,0.08),y+0.36+rand(0,0.12),z+rand(-0.08,0.08),[0xc8322a,0xe8d040,0xf2f0ea,0xd86a9a,0x3f7a3a][(k+j)%5]); } }
  else if(t.startsWith('KIOSK')||t.startsWith('SCHREIB')){ K.B('zink',0.62,1.15,0.34,xv,by+0.575,zv,0x3a3f48);
    for(let k=0;k<4;k++) for(let j=0;j<3;j++) K.B('rahmen',0.17,0.24,0.012,xv-0.2+j*0.2,by+0.3+k*0.26,zv+0.18,[0xc8322a,0x2f5d9e,0xe8d040,0xf2f0ea,0x3f8a4a][(k*3+j)%5]); }
  else if(!t.startsWith('APOTH')&&!t.startsWith('OPTIK')){ const holz=0x5a3b26;
    for(const sx of [-1,1]) K.B('rahmen',0.6,0.95,0.03,xv,by+0.45,zv+sx*0.09,sx>0?0x2a2e2a:holz,sx*0.19);
    K.B('rahmen',0.5,0.62,0.005,xv,by+0.55,zv+0.19,0x2f3530,0.19); K.B('rahmen',0.36,0.04,0.005,xv,by+0.72,zv+0.2,0xf2f0ea,0.19); K.B('rahmen',0.3,0.03,0.005,xv,by+0.6,zv+0.22,0xe8c170,0.19); }
  /* nachts faellt warmes Licht aus dem Schaufenster auf den Gehweg */
  const ys=o.by+0.012;
  K.Q('spill',[[xa-0.4,ys,zf+3.0],[xb+0.4,ys,zf+3.0],[xb+0.4,ys,zf+0.05],[xa-0.4,ys,zf+0.05]],[0,0,1,1]);
}
const M_AUSLEGER=()=>Math.random()<0.75;
/* ---------- Putzfront: gemalter Putz mit ausgesparten Oeffnungen ---------- */
function frontMalen(g,W,H,o){
  const px=W/o.w, U=x=>(x/o.w+0.5)*W, V=y=>H*(1-y/o.h);
  g.fillStyle=hexCss(o.farbe); g.fillRect(0,0,W,H);
  for(let i=0;i<W*H/14;i++){ const v=Math.random()<0.5?0:255; g.fillStyle=`rgba(${v},${v},${v},${Math.random()*0.06})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
  g.fillStyle='rgba(0,0,0,.07)'; g.fillRect(0,0,W,H);
  /* Verwitterung: Laufspuren von oben, Spritzwasser unten */
  for(let i=0;i<Math.round(o.w*1.5);i++){ const x=Math.random()*W, w=rand(4,18)*px/40, gr=g.createLinearGradient(0,0,0,H*rand(0.2,0.6));
    gr.addColorStop(0,'rgba(50,42,34,.13)'); gr.addColorStop(1,'rgba(50,42,34,0)'); g.fillStyle=gr; g.fillRect(x,0,w,H); }
  let gr=g.createLinearGradient(0,V(0),0,V(0.9)); gr.addColorStop(0,'rgba(40,36,30,.35)'); gr.addColorStop(1,'rgba(40,36,30,0)'); g.fillStyle=gr; g.fillRect(0,V(0.9),W,0.9*px);
  /* Schatten unter Traufe und Gurtgesims */
  gr=g.createLinearGradient(0,V(o.h-0.9),0,V(o.h-1.8)); gr.addColorStop(0,'rgba(30,26,22,.3)'); gr.addColorStop(1,'rgba(30,26,22,0)'); g.fillStyle=gr; g.fillRect(0,V(o.h-0.9),W,0.9*px);
  gr=g.createLinearGradient(0,V(o.gH),0,V(o.gH-0.5)); gr.addColorStop(0,'rgba(30,26,22,.25)'); gr.addColorStop(1,'rgba(30,26,22,0)'); g.fillStyle=gr; g.fillRect(0,V(o.gH),W,0.5*px);
  /* Gruenderzeit: Putzquader im Erdgeschoss */
  if(o.stil!=='nach') for(let y=0.62;y<o.gH-0.8;y+=0.34){ g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(0,V(y),W,Math.max(1,px*0.028)); g.fillStyle='rgba(255,255,255,.1)'; g.fillRect(0,V(y)+Math.max(1,px*0.028),W,1); }
  /* unter jeder Fensterbank ein Schatten und zwei Schmutzfahnen */
  for(const [x,yb,ww] of o.loch){ if(yb<0.5) continue;
    gr=g.createLinearGradient(0,V(yb-0.1),0,V(yb-0.7)); gr.addColorStop(0,'rgba(40,34,28,.3)'); gr.addColorStop(1,'rgba(40,34,28,0)'); g.fillStyle=gr; g.fillRect(U(x-ww/2-0.15),V(yb-0.1),(ww+0.3)*px,0.6*px);
    for(const sx of [-1,1]){ const L=rand(0.6,1.6); gr=g.createLinearGradient(0,V(yb-0.1),0,V(yb-0.1-L)); gr.addColorStop(0,'rgba(45,38,30,.22)'); gr.addColorStop(1,'rgba(45,38,30,0)');
      g.fillStyle=gr; g.fillRect(U(x+sx*(ww/2+0.12))-px*0.04,V(yb-0.1),px*0.08,L*px); } }
  /* Oeffnungen aussparen: dahinter liegen Laibung, Glas und Laden. Das
     Loch ist ein Pixel KLEINER als die Oeffnung - war es groesser, sah
     man an Haustuer und Schaufenster (ohne Faschen davor) durch einen
     Schlitz neben der Laibung ins hohle Haus (27.09.) */
  for(const [x,yb,ww,wh] of o.loch){ const a=Math.ceil(U(x-ww/2))+1, b=Math.floor(U(x+ww/2))-1, c=Math.ceil(V(yb+wh))+1, d=Math.floor(V(yb))-1; g.clearRect(a,c,b-a,d-c); }
}
/* Nachtlicht auf dem Putz: Schein ueber dem Schaufenster und um die Wandleuchte */
function glowMalen(g,W,H,o){
  const px=W/o.w, U=x=>(x/o.w+0.5)*W, V=y=>H*(1-y/o.h);
  g.fillStyle='#000'; g.fillRect(0,0,W,H);
  for(const [x,y,r,art] of o.glow){
    if(art==='laden'){ const gr=g.createLinearGradient(0,V(y),0,V(y+1.8)); gr.addColorStop(0,'rgba(255,200,130,.55)'); gr.addColorStop(1,'rgba(255,200,130,0)');
      g.fillStyle=gr; g.fillRect(U(x-r/2),V(y+1.8),r*px,1.8*px); }
    else { const gr=g.createRadialGradient(U(x),V(y),0,U(x),V(y),r*px); gr.addColorStop(0,'rgba(255,215,160,.7)'); gr.addColorStop(1,'rgba(255,215,160,0)');
      g.fillStyle=gr; g.fillRect(U(x)-r*px,V(y)-r*px,2*r*px,2*r*px); }
  }
}
/* ---------- Ein Haus der Zeile gegenueber ---------- */
function buildHaus(cx,zFront,o){
  const w=o.w, d=o.d, zf=d/2, h=o.h, alt=o.stil!=='nach';
  Object.assign(o,{zf,loch:[],glow:[],laib:alt?0.24:0.18,
    stuckF:hexMix(o.farbe,0xf4efe4,alt?0.5:0.3), faschF:hexMix(o.farbe,0xf0eee8,0.55),
    laibF:hexMix(o.farbe,0xffffff,0.12), laibD:hexMix(o.farbe,0x000000,0.3),
    rahmenF:Math.random()<0.75?0xf1efe9:(alt?0x5a3b26:0x3a3d42),
    dachF:o.dach==='mansard'?0x4a4d54:pick(alt?[0xa4503a,0x8f4634,0x4a4d54]:[0x9a4a36,0x5a4a44,0x4a4d54]),
    kaminF:pick([0x8a4a3c,0x7a4436,hexMix(o.farbe,0x000000,0.1)]),
    neig:alt?rand(0.72,0.86):rand(0.55,0.68), ueber:alt?0.5:0.55});
  const M=tm(cx,0,zFront+zf,0,Math.PI,0), K=hausKit(M);
  const g=new THREE.Group(); g.position.set(cx,0,zFront+zf); g.rotation.y=Math.PI; scene.add(g);
  const nC=o.cols, bay=w/nC, bx=i=>-w/2+bay*(i+0.5), gH=o.gH, fh=o.fh, sc=o.stuckF;
  const xT=bx(nC-1);
  /* Erdgeschoss: Laden links, Hauseingang in der rechten Achse */
  o.yT=gH-0.75;
  if(o.laden){ o.sx0=-w/2+0.45; o.sx1=xT-0.65-0.45; ladenFront(K,g,o); }
  else for(let c=0;c<nC-1;c++) fenster(K,o,bx(c),1.3,alt?Math.min(1.2,bay-1):Math.min(1.4,bay-0.8),Math.min(1.9,gH-2.1),'eg');
  hausTuer(K,o,xT);
  /* Obergeschosse; ueber der Haustuer liegt das Treppenhaus mit
     Fenstern auf halber Hoehe */
  const ww=alt?Math.min(1.22,bay-1.0):Math.min(1.45,bay-0.8);
  const balkon=!alt&&Math.random()<0.45?Math.floor(Math.random()*(nC-1)):-1;
  for(let r=0;r<o.rows;r++){ const fy=gH+r*fh;
    for(let c=0;c<nC;c++){
      if(c===nC-1&&o.treppe){ fenster(K,o,bx(c),fy+fh*0.5-0.1,0.8,1.3,'treppe'); continue; }
      if(c===balkon){ fenster(K,o,bx(c),fy+0.05,Math.min(1.1,bay-1),2.15,'nach'); continue; }
      const art=!alt?'nach':r===0?'bel':r===o.rows-1?'oben':'mitte';
      const wh=!alt?1.45:r===0?2.1:r===o.rows-1?1.7:1.95;
      fenster(K,o,bx(c),fy+(alt?0.85:0.9),ww,wh,art);
    }
  }
  /* Balkone (Nachkrieg): Platte, Gelaender, manchmal eine Lichterkette */
  if(balkon>=0){ const x=bx(balkon), bw=Math.min(bay-0.2,2.6), bars=Math.random()<0.5, lk=Math.random()<0.5;
    for(let r=0;r<o.rows;r++){ const fy=gH+r*fh;
      K.B('putz',bw,0.16,1.15,x,fy-0.03,zf+0.575,0xb8b4ac); K.B('putz',bw-0.04,0.03,1.1,x,fy+0.065,zf+0.58,0xf2f5f8);
      K.B('rahmen',bw,0.05,0.05,x,fy+1.0,zf+1.12,0x3a3f48);
      for(const sx of [-1,1]) K.B('rahmen',0.05,0.05,1.1,x+sx*(bw/2-0.025),fy+1.0,zf+0.6,0x3a3f48);
      if(bars&&HIQ) for(let k=0;k<Math.floor(bw/0.13);k++) K.B('rahmen',0.022,0.9,0.022,x-bw/2+0.08+k*0.13,fy+0.52,zf+1.12,0x3a3f48);
      else K.B('rahmen',bw-0.08,0.85,0.02,x,fy+0.52,zf+1.12,0x8a9aa8);
      if(lk&&r===o.rows-1||lk&&r===0) for(let k=0;k<Math.floor(bw/0.22);k++) K.B('lampe',0.035,0.035,0.035,x-bw/2+0.12+k*0.22,fy+0.96-Math.sin(k*1.3)*0.03,zf+1.15); } }
  /* Gesimse: Gurtgesims ueber dem Laden, Traufgesims mit Zahnschnitt */
  if(alt){
    K.B('putz',w,0.14,0.2,0,gH+0.07,zf+0.1,sc); K.B('putz',w,0.08,0.26,0,gH+0.18,zf+0.13,sc); K.B('putz',w,0.03,0.22,0,gH+0.235,zf+0.14,0xf2f5f8);
    K.B('putz',w,0.4,0.05,0,h-0.75,zf+0.025,sc);
    if(HIQ){ const n=Math.floor(w/0.24); for(let i=0;i<n;i++) K.B('putz',0.09,0.12,0.1,-w/2+(i+0.5)*w/n,h-0.46,zf+0.05,sc); }
    K.B('putz',w,0.1,0.22,0,h-0.35,zf+0.11,sc); K.B('putz',w,0.18,0.42,0,h-0.21,zf+0.21,sc); K.B('putz',w,0.12,0.5,0,h-0.06,zf+0.25,sc);
    /* Eckquader an beiden Hauskanten */
    if(HIQ) for(const sx of [-1,1]) for(let y=gH+0.3,k=0;y<h-1.3;y+=0.36,k++){ const qb=k%2?0.22:0.32; K.B('putz',qb,0.32,0.04,sx*(w/2-qb/2),y+0.16,zf+0.02,sc); }
  } else {
    K.B('putz',w,0.12,0.06,0,gH,zf+0.03,o.faschF); K.B('putz',w,0.025,0.05,0,gH+0.07,zf+0.03,0xf2f5f8);
  }
  /* Sockel aus Stein unter dem Putz */
  K.B('putz',w,0.14,0.04,0,0.07,zf+0.02,0x6f6a62);
  /* Fallrohr an der rechten Hauskante */
  { const fx=w/2-0.12, top=alt?h-0.4:h-0.45, zr=zf+0.12, zn=0x8f959e;
    K.Z('zink',0.055,top-0.25,fx,(top+0.25)/2,zr,zn);
    for(let y=1.2;y<top;y+=2.1) K.B('zink',0.14,0.04,0.13,fx,y,zf+0.065,zn);
    K.B('zink',0.13,0.15,0.13,fx,0.2,zr,zn);
    if(!alt){ const L=Math.hypot(o.ueber-0.1,0.4); K.Z('zink',0.05,L,fx,top+0.2,zr+(o.ueber-0.1)/2,zn,Math.atan2(o.ueber-0.1,0.4)); } }
  /* Dach mit Gauben */
  o.gauben=[];
  if(o.dach!=='flach') for(let c=0;c<nC;c++) if(o.dach==='mansard'||(c%2===(nC>2?1:0)&&Math.random()<0.8)) o.gauben.push(bx(c));
  hausDach(K,o);
  /* Seiten und Rueckwand; Front als eigenes Mesh mit Aussparungen */
  K.F('putz',[[[w/2,0,zf],[w/2,0,-zf],[w/2,h,-zf],[w/2,h,zf]],[[-w/2,0,-zf],[-w/2,0,zf],[-w/2,h,zf],[-w/2,h,-zf]],[[w/2,0,-zf],[-w/2,0,-zf],[-w/2,h,-zf],[w/2,h,-zf]]],o.farbe);
  const q=COARSE?0.6:1, px=Math.round(clamp(w*44,256,512)*q), py=Math.round(clamp(h*44,384,768)*q);
  const map=tex(px,py,(c,W,H)=>frontMalen(c,W,H,o)); map.anisotropy=8;
  const m=new THREE.MeshStandardMaterial({map,alphaTest:0.5,roughness:0.93,emissive:LIN(0xffffff),emissiveMap:tex(px>>2,py>>2,(c,W,H)=>glowMalen(c,W,H,o)),emissiveIntensity:0});
  houseMats.push(m);
  const geo=new THREE.BoxGeometry(w,h,d);
  /* nur die Vorderseite zeichnen, Seiten und Dach liegen im Sammler */
  if(geo.groups) geo.groups=geo.groups.filter(q=>q.materialIndex===4);
  const b=new THREE.Mesh(geo,[m,m,m,m,m,m]); b.position.y=h/2; if(HIQ) b.receiveShadow=true; g.add(b);
  return g;
}
/* ---------- Zweite Reihe: echte Fassade, aber einfacher (weiter weg) ---------- */
function hinterhaus(cx,zFront,o){
  const w=o.w, d=o.d, zf=d/2, h=o.h, alt=o.stil!=='nach';
  Object.assign(o,{zf,laib:0.15,stuckF:hexMix(o.farbe,0xf4efe4,0.45),rahmenF:0xf1efe9,
    dachF:pick([0xa4503a,0x8f4634,0x4a4d54,0x5a4a44]),kaminF:0x8a4a3c,neig:rand(0.6,0.85),ueber:0.4,gauben:[]});
  const K=hausKit(tm(cx,0,zFront+zf,0,Math.PI,0));
  K.B('putz',w,h,d,0,h/2,0,o.farbe);
  const nC=Math.max(2,Math.round(w/2.7)), bay=w/nC, rows=Math.floor((h-1.4)/3.0), fh=(h-1.4)/rows;
  for(let r=1;r<rows;r++) for(let c=0;c<nC;c++){ const x=-w/2+bay*(c+0.5), yb=r*fh+0.9, ww=alt?1.15:1.4, wh=alt?1.8:1.45;
    K.G(x,yb,ww,wh,zf+0.012,fensterZufall());
    K.B('putz',ww+0.24,0.08,0.14,x,yb-0.04,zf+0.07,alt?o.stuckF:0xd8d6d0);
    if(HIQ){ K.B('putz',ww+0.2,0.1,0.04,x,yb+wh+0.05,zf+0.02,o.stuckF);
      K.B('rahmen',0.06,wh,0.03,x,yb+wh/2,zf+0.025,0xf1efe9); } }
  /* Erdgeschoss: dunkles Band mit Schaufenstern */
  K.G(0,0.5,w*0.7,2.4,zf+0.012,Math.random()<0.5?11:3);
  K.B('putz',w,0.3,0.4,0,h-0.15,zf+0.2,alt?o.stuckF:hexMix(o.farbe,0x000000,0.15));
  o.dach=alt?(Math.random()<0.5?'mansard':'sattel'):(Math.random()<0.5?'sattel':'flach');
  if(o.dach==='mansard') for(let c=0;c<nC;c++) o.gauben.push(-w/2+bay*(c+0.5));
  hausDach(K,o);
}
/* =========================================================
   Autos am Bordstein.
   Die Masse sind echte Fahrzeugmasse, keine geschaetzten: eine
   Limousine ist 4,62 m lang und 1,45 m hoch, nicht 1,84 m, und der
   Radstand betraegt 2,76 m. Vorher stand da ein zu hoher Kasten mit
   zu kurzem Radstand - das liest sich sofort als Spielzeug.
   Entscheidend ist ausserdem das Rad: eine Felge ist innen offen und
   dunkel, mit hellen Speichen und hellem Horn davor. Eine massive
   helle Scheibe, wie sie hier vorher steckte, gibt es an keinem Auto.
   ========================================================= */
const AUTOFORM={
  /* L/B/H und Radstand nach gaengigen Fahrzeugen der Klasse.
     vu/hu sind die Ueberhaenge - der Kombi hat hinten deutlich mehr,
     der Kleinwagen vorn und hinten wenig. */
  limo : {L:4.62,B:1.80,H:1.45,rad:0.330,kabL:2.26,kabZ:-0.30,vu:0.86,hu:0.98,stufe:true },
  kombi: {L:4.76,B:1.81,H:1.49,rad:0.330,kabL:2.78,kabZ:-0.46,vu:0.88,hu:1.18,stufe:false},
  suv  : {L:4.58,B:1.87,H:1.68,rad:0.365,kabL:2.52,kabZ:-0.34,vu:0.90,hu:0.98,stufe:false},
  van  : {L:4.55,B:1.83,H:1.70,rad:0.330,kabL:2.70,kabZ:-0.22,vu:0.87,hu:0.96,stufe:false},
  klein: {L:4.05,B:1.74,H:1.46,rad:0.305,kabL:2.06,kabZ:-0.34,vu:0.72,hu:0.78,stufe:false}
};
let _lackM=null,_gummiM=null,_glasM=null,_chromM=null,_autoEnv=null;
/* Umgebung zum Spiegeln (Tom, 26.09.: "Autos deutlich schoener und
   echter"). Ohne Umgebung spiegelt Lack nichts, und Lack und Scheiben
   verschwimmen zu einer dunklen Masse. Ein kleines Panorama - Himmel,
   helle Horizontkante, Haeuserzeile, Strasse - reicht, damit Lack,
   Glas und Chrom lesbar werden. Nachts wird die Spiegelung gedimmt. */
function autoUmgebung(){
  if(_autoEnv!==null) return _autoEnv||null;
  _autoEnv=false;
  try{
    if(!THREE.PMREMGenerator) return null;
    const t=tex(512,256,(g,W,H)=>{
      const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#7f9cbc'); gr.addColorStop(0.44,'#dfe8f1'); gr.addColorStop(0.5,'#f6f8fa');
      gr.addColorStop(0.52,'#4a4e55'); gr.addColorStop(1,'#1c1e22'); g.fillStyle=gr; g.fillRect(0,0,W,H);
      /* Haeuserkante am Horizont bricht die Spiegelung wie in einer Strasse */
      for(let x=0;x<W;){ const w=8+Math.random()*30, h=10+Math.random()*48; g.fillStyle=`rgb(${60+Math.random()*50|0},${64+Math.random()*50|0},${72+Math.random()*50|0})`;
        g.fillRect(x,H*0.5-h,w,h); x+=w+Math.random()*6; }
      g.fillStyle='rgba(255,255,255,.9)'; for(let i=0;i<5;i++) g.fillRect(Math.random()*W,H*0.08+Math.random()*H*0.2,40,6);
    });
    t.mapping=THREE.EquirectangularReflectionMapping;
    const pm=new THREE.PMREMGenerator(renderer);
    _autoEnv=pm.fromEquirectangular(t).texture; pm.dispose();
  }catch(e){ _autoEnv=false; }
  return _autoEnv||null;
}
function autoMats(){
  if(!_lackM){
    const env=autoUmgebung();
    const Phys=THREE.MeshPhysicalMaterial||THREE.MeshStandardMaterial;
    /* Metalliclack mit Klarlack, Glas spiegelt stark, Chrom ganz */
    _lackM=new Phys({vertexColors:true,roughness:0.42,metalness:0.45,envMap:env,envMapIntensity:1});
    if('clearcoat' in _lackM){ _lackM.clearcoat=1; _lackM.clearcoatRoughness=0.07; }
    _glasM=new Phys({vertexColors:true,roughness:0.04,metalness:0.35,envMap:env,envMapIntensity:1.2});
    if('clearcoat' in _glasM){ _glasM.clearcoat=1; _glasM.clearcoatRoughness=0.02; }
    _chromM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.16,metalness:1,envMap:env,envMapIntensity:1.1});
    _gummiM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.92,metalness:0.02});
  }
}
/* nachts spiegelt der Himmel nicht mehr hell */
function autoNacht(f){ const k=1-0.85*f; if(typeof _wasserM!=='undefined'&&_wasserM) _wasserM.envMapIntensity=0.9*k; if(!_lackM) return; _lackM.envMapIntensity=k; _glasM.envMapIntensity=1.2*k; _chromM.envMapIntensity=1.1*k; }
/* Seitenprofil als Form, ueber die Breite extrudiert und gerundet.
   Profilkoordinaten: x = Laenge (vorn positiv), y = Hoehe. */
function autoExtrude(shape,breite,bev,form){
  /* genug Querschnitte, damit sich die Breite verformen laesst */
  const geo=new THREE.ExtrudeGeometry(shape,{depth:Math.max(0.02,breite-2*bev),bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:HIQ?4:2,curveSegments:HIQ?16:8,steps:HIQ?6:3});
  geo.rotateY(-Math.PI/2);
  geo.computeBoundingBox(); const bb=geo.boundingBox; geo.translate(-(bb.min.x+bb.max.x)/2,0,0);
  /* form(x,y,z) -> Faktor auf die Breite: runde Ecken im Grundriss,
     eingezogene Flanke, schraege Kanzel */
  if(form){ const pa=geo.attributes.position; for(let i=0;i<pa.count;i++) pa.setX(i,pa.getX(i)*form(pa.getY(i),pa.getZ(i))); }
  glatteNormalen(geo,50);
  return geo;
}
/* Weiche Normalen fuer nicht indizierte Geometrie: Ecken an derselben
   Stelle mitteln ihre Flaechennormalen, solange der Knick unter der
   Grenze bleibt - runde Flaechen werden glatt, Kanten bleiben Kanten.
   Ohne das sah die Karosserie facettiert aus wie ein Low-Poly-Modell. */
function glatteNormalen(geo,grad){
  const pa=geo.attributes.position, n=pa.count, fn=new Float32Array(n*3), cg=Math.cos(grad*Math.PI/180);
  const a=new THREE.Vector3(), b=new THREE.Vector3(), c=new THREE.Vector3();
  for(let i=0;i+2<n;i+=3){ a.fromBufferAttribute(pa,i); b.fromBufferAttribute(pa,i+1); c.fromBufferAttribute(pa,i+2);
    b.sub(a); c.sub(a); b.cross(c); const l=b.length()||1; b.divideScalar(l);
    for(let k=0;k<3;k++){ fn[(i+k)*3]=b.x; fn[(i+k)*3+1]=b.y; fn[(i+k)*3+2]=b.z; } }
  const gruppen=new Map();
  for(let i=0;i<n;i++){ const key=Math.round(pa.getX(i)*2000)+'|'+Math.round(pa.getY(i)*2000)+'|'+Math.round(pa.getZ(i)*2000);
    let g=gruppen.get(key); if(!g) gruppen.set(key,g=[]); g.push(i); }
  const out=new Float32Array(n*3);
  for(const g of gruppen.values()) for(const i of g){ let x=0,y=0,z=0;
    for(const j of g){ const d=fn[i*3]*fn[j*3]+fn[i*3+1]*fn[j*3+1]+fn[i*3+2]*fn[j*3+2]; if(d>=cg){ x+=fn[j*3]; y+=fn[j*3+1]; z+=fn[j*3+2]; } }
    const l=Math.hypot(x,y,z)||1; out[i*3]=x/l; out[i*3+1]=y/l; out[i*3+2]=z/l; }
  geo.setAttribute('normal',new THREE.BufferAttribute(out,3));
}
const glatt01=(a,b,x)=>{ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
function makeAuto(col,form){
  form=AUTOFORM[form]?form:pick(['limo','kombi','suv','van','klein']);
  autoMats();
  const F=AUTOFORM[form];
  const L=F.L, B=F.B, rad=F.rad, kabL=F.kabL;
  let kabZ=F.kabZ;
  const schwelle=rad*0.92;                  /* Unterkante Tuer        */
  const gurt=F.H*(F.stufe?0.655:0.640);     /* Unterkante Seitenfenster */
  const dach=F.H;                           /* Dachhaut               */
  const gh=dach-gurt;                       /* Hoehe der Fahrgastzelle */
  const vA= L/2-F.vu, hA=-(L/2-F.hu);       /* Radmitten */
  const RX=B/2-0.125;                       /* Rad buendig unter der Flanke */

  const lack=[], gummi=[], glasT=[], chromT=[];
  const dunkel=0x15171d, glas=0x10161e, chrome=0xd6dae0, alu=0xb4bac4;
  const SEG=HIQ?4:2;
  const RB=(w,h,d,r)=>roundedBoxGeo(w,h,d,r,SEG);
  const CY=(r1,r2,h,sg)=>new THREE.CylinderGeometry(r1,r2,h,sg||(HIQ?18:10));
  const P=(a,geo,x,y,z,rx,ry,rz,c)=>a.push({geo,m:tm(x,y,z,rx||0,ry||0,rz||0),color:c});
  /* Farbe entscheidet, welches Material ein Teil bekommt */
  const K=(geo,x,y,z,rx,ry,rz,c)=>P(c===glas||c===0xcfdae8?glasT:(c===chrome||c===alu||c===0xf6f4ea)?chromT:lack,geo,x,y,z,rx,ry,rz,c);
  const G=(geo,x,y,z,rx,ry,rz,c)=>P(gummi,geo,x,y,z,rx,ry,rz,c);

  /* ---------- Karosserie ----------
     Ein Seitenprofil statt gestapelter Kaesten: Nase, fallende Haube,
     Guertellinie, Heck und echte Radausschnitte, rundum gerundet. */
  const y0=schwelle-0.08, lampY0=gurt-(gurt-schwelle)*0.30, nase=L/2, heck=-L/2;
  const aF=0.60, aH=F.stufe?0.52:0.20;
  const wsZ=gh*Math.tan(aF), rwZ=gh*Math.tan(aH);
  /* Kombi, SUV, Van, Kleinwagen: die Kabine reicht bis ans Heck */
  let zF=kabZ+kabL/2, zH=kabZ-kabL/2;
  if(!F.stufe){ zH=heck+0.10+rwZ*0.35; }
  /* Die Rundungskante legt bv rundum auf das Profil - deshalb liegt
     die Kontur um bv innen, sonst verschwinden Scheinwerfer in der Nase
     und die Radlaeufe werden zu eng */
  const bv=0.09, nI=nase-bv, hI=heck+bv, yb=y0+bv;
  const unten=new THREE.Shape();
  const bogen=(z)=>{ const r=rad+0.075+bv; unten.lineTo(z-r,yb); unten.absarc(z,rad+0.01,r,Math.PI,0,true); };
  unten.moveTo(hI+0.12,yb);
  bogen(hA); bogen(vA);
  unten.lineTo(nI-0.12,yb);
  unten.quadraticCurveTo(nI,yb,nI,yb+0.12);
  unten.lineTo(nI,lampY0+0.04);
  const nasenH=gurt-bv-(form==='van'?0.06:0.13);
  unten.quadraticCurveTo(nI,nasenH-0.02,nI-0.16,nasenH);
  unten.quadraticCurveTo(zF+0.35,gurt+0.02-bv,zF,gurt+0.02-bv);
  unten.lineTo(zH,gurt+0.02-bv);
  if(F.stufe){ unten.quadraticCurveTo(hI+0.3,gurt+0.02-bv,hI+0.06,gurt-0.03-bv); }
  else unten.lineTo(hI+0.06,gurt+0.02-bv);
  unten.quadraticCurveTo(hI,gurt-0.05-bv,hI,lampY0);
  unten.lineTo(hI,yb+0.12);
  unten.quadraticCurveTo(hI,yb,hI+0.12,yb);
  /* im Grundriss runde Front und Heck, oberhalb der Schulter eingezogen */
  const rundZ=(z,r)=>1-r*Math.pow(glatt01(L/2-0.55,L/2,Math.abs(z)),2);
  const flanke=(y,z)=>rundZ(z,0.07)*(1-0.05*glatt01(gurt-0.22,gurt+0.02,y))*(1-0.03*glatt01(schwelle+0.1,y0,y));
  P(lack,autoExtrude(unten,B,0.09,flanke),0,0,0,0,0,0,col);
  /* Glaskanzel: schmaler als die Flanke (Tumblehome), Dach gewoelbt */
  const kz=new THREE.Shape(), dy=dach-0.035;
  kz.moveTo(zF,gurt);
  kz.lineTo(zF-wsZ,dy-0.03);
  kz.quadraticCurveTo((zF-wsZ+zH+rwZ)/2,dy+0.05,zH+rwZ,dy-0.03);
  kz.lineTo(zH,gurt);
  kz.lineTo(zF,gurt);
  /* Kanzel neigt sich nach innen (Tumblehome) */
  const kanzel=(y,z)=>1-0.14*glatt01(gurt,dach,y);
  P(glasT,autoExtrude(kz,B-0.2,0.07,kanzel),0,0,0,0,0,0,glas);
  /* Dachhaut: die obere Kante der Kanzel, etwas breiter, in Wagenfarbe */
  { const d0=new THREE.Shape(), a0=zF-wsZ-0.05, a1=zH+rwZ+0.05, m=(a0+a1)/2;
    d0.moveTo(a0+0.02,dy-0.05); d0.quadraticCurveTo(m,dy+0.03,a1-0.02,dy-0.05);
    d0.lineTo(a1,dy); d0.quadraticCurveTo(m,dy+0.09,a0,dy); d0.lineTo(a0+0.02,dy-0.05);
    P(lack,autoExtrude(d0,(B-0.2)*0.87+0.05,0.05),0,0,0,0,0,0,col); }
  const dachL=Math.max(0.42,(zF-wsZ)-(zH+rwZ)), dachZ=(zF-wsZ+zH+rwZ)/2;
  const mY=(gurt+dach)/2;
  /* A-, B- und C-Saeulen auf der Kanzel */
  for(const s of [-1,1]){
    const xs=(B/2-0.12)*0.93, neig=-s*0.14;
    K(RB(0.07,gh/Math.cos(aF)+0.02,0.07,0.03), s*xs, mY, zF-wsZ/2, -aF,0,neig, col);
    K(RB(0.07,gh/Math.cos(aH)+0.02,0.12,0.03), s*xs, mY, zH+rwZ/2,  aH,0,neig, col);
    K(RB(0.05,gh*0.94,0.09,0.02), s*(xs+0.01), gurt+gh*0.49, kabZ+kabL*0.02, 0,0,neig, 0x15181e);
    if(!F.stufe) K(RB(0.05,gh*0.9,0.09,0.02), s*(xs+0.01), gurt+gh*0.47, (zH+rwZ*0.5+kabZ-kabL*0.3)/2, 0,0,neig, 0x15181e);
    /* Fensterbruestung und Dachreling in Chrom */
    K(RB(0.03,0.028,(zF-wsZ*0.3)-(zH+rwZ*0.3),0.01), s*(B/2-0.095), gurt+0.03, (zF-wsZ*0.3+zH+rwZ*0.3)/2, 0,0,0, chrome);
    if(form==='kombi'||form==='suv') K(RB(0.035,0.035,dachL*0.9,0.012), s*(B/2-0.2), dach+0.05, dachZ, 0,0,0, alu);
  }
  const kh=gurt-schwelle;
  /* Schweller matt */
  G(RB(B-0.02,0.08,Math.abs(vA-hA)-2*rad-0.15,0.03), 0, y0+0.03, (vA+hA)/2, 0,0,0, 0x1b1e24);

  /* ---------- Raeder ----------
     Reifen mit Flanke, Felge innen dunkel und offen, davor Speichen
     und Felgenhorn. Radlauf als halber Ring in Wagenfarbe. */
  for(const sx of [-1,1]) for(const z of [vA,hA]){
    const x=sx*RX;
    /* Radlauf: der Bogen selbst und eine schmale, leicht ausgestellte
       Kante davor - ohne die sitzt das Rad wie in einem Loch. */
    /* dunkler Radkasten hinter dem Rad */
    G(CY(rad+0.07,rad+0.07,0.05,HIQ?20:10), x-sx*0.2, rad+0.01, z, 0,0,Math.PI/2, 0x0c0d10);
    G(CY(rad,rad,0.205),                 x, rad, z, 0,0,Math.PI/2, 0x16181c);
    G(CY(rad*0.995,rad*0.995,0.215,HIQ?24:12), x, rad, z, 0,0,Math.PI/2, 0x1d2027);
    /* dunkle Felgenschuessel - das Loch, durch das man die Bremse sieht */
    G(CY(rad*0.63,rad*0.63,0.225),       x*1.004, rad, z, 0,0,Math.PI/2, 0x2a2e35);
    K(new THREE.TorusGeometry(rad*0.615,0.026,6,HIQ?18:10),
      x*1.018, rad, z, 0,Math.PI/2,0, alu);
    for(let k=0;k<5;k++){ const a=k/5*Math.PI*2;
      K(RB(0.045,rad*0.56,0.038,0.015),
        x*1.016, rad+Math.cos(a)*rad*0.30, z+Math.sin(a)*rad*0.30, 0,0,a, alu); }
    K(CY(rad*0.15,rad*0.15,0.235,10),    x*1.02, rad, z, 0,0,Math.PI/2, 0x8d939d);
    K(CY(rad*0.055,rad*0.055,0.245,8),   x*1.03, rad, z, 0,0,Math.PI/2, chrome);
  }

  /* ---------- Front und Heck ---------- */
  const lampY=gurt-kh*0.30;
  /* Stossfaenger sind lackiert und schliessen buendig ab; dunkel
     bleibt nur die Schuerze darunter. Vorher standen vorn und hinten
     zwei schwarze Kloetze ueber die Karosserie hinaus. */
  /* Stossfaenger sind Teil des Profils; darunter nur die dunkle Schuerze */
  G(RB(B*0.82,0.11,0.12,0.05), 0, y0+0.05,  L/2-0.07, 0,0,0, 0x24282f);
  G(RB(B*0.82,0.11,0.12,0.05), 0, y0+0.05, -L/2+0.07, 0,0,0, 0x24282f);
  G(RB(B-0.42,0.06,0.10,0.02), 0, schwelle-0.03,  L/2-0.06, 0,0,0, 0x6f757e);
  /* Kuehlergrill */
  K(RB(B*0.52,0.17,0.08,0.03), 0, lampY+0.02, L/2-0.02, 0,0,0, 0x101319);
  for(let k=0;k<3;k++) K(RB(B*0.50,0.018,0.05,0.008), 0, lampY-0.04+k*0.05, L/2+0.005, 0,0,0, chrome);
  for(const s of [-1,1]){
    /* Scheinwerfer: dunkles Gehaeuse, Glas, zwei Reflektoren */
    K(RB(0.42,0.15,0.13,0.05), s*(B/2-0.33), lampY+0.02, L/2-0.07, 0,0,0, 0x191c22);
    K(RB(0.39,0.12,0.06,0.03), s*(B/2-0.33), lampY+0.02, L/2-0.015, 0,0,0, 0xcfdae8);
    for(const dx of [-0.085,0.085])
      K(CY(0.048,0.048,0.05,10), s*(B/2-0.33)+dx, lampY+0.02, L/2+0.0, Math.PI/2,0,0, 0xf6f4ea);
    /* Rueckleuchten */
    K(RB(0.36,0.20,0.11,0.04), s*(B/2-0.27), lampY+0.06, -L/2+0.05, 0,0,0, 0x2a1214);
    K(RB(0.32,0.16,0.05,0.02), s*(B/2-0.27), lampY+0.06, -L/2+0.005,0,0,0, 0x9a2a24);
    K(RB(0.09,0.08,0.04,0.015),s*(B/2-0.42), lampY+0.06, -L/2-0.005,0,0,0, 0xe8b060);
    K(RB(0.08,0.07,0.04,0.015),s*(B/2-0.13), lampY+0.06, -L/2-0.005,0,0,0, 0xf2f2ee);
    /* Spiegel am Fuss der A-Saeule */
    K(RB(0.07,0.04,0.07,0.02), s*(B/2-0.02), gurt+gh*0.20, kabZ+kabL/2-0.10, 0,0,0, col);
    K(RB(0.17,0.10,0.07,0.03), s*(B/2+0.07), gurt+gh*0.22, kabZ+kabL/2-0.14, 0,0,0.10, col);
    K(RB(0.13,0.075,0.02,0.008),s*(B/2+0.11),gurt+gh*0.22, kabZ+kabL/2-0.14, 0,0,0.10, 0x4e545e);
    /* Tuergriffe und Fugen */
    for(const dz of [kabZ+kabL*0.20, kabZ-kabL*0.24])
      K(RB(0.035,0.038,0.17,0.014), s*(B/2+0.002), gurt-0.10, dz, 0,0,0, chrome);
    K(RB(0.01,kh*0.80,0.016,0.004), s*(B/2+0.006), schwelle+kh*0.52, kabZ+kabL/2-0.16, 0,0,0, 0x0d0f14);
    K(RB(0.01,kh*0.62,0.016,0.004), s*(B/2+0.006), schwelle+kh*0.52, kabZ-kabL*0.30, 0,0,0, 0x0d0f14);
  }
  /* Kennzeichen */
  for(const sz of [1,-1]) K(RB(0.50,0.11,0.025,0.01), 0, schwelle+0.20, sz*(L/2+0.02), 0,0,0, 0xf2f2ee);
  /* Tankklappe, Scheibenwischer, Auspuff, Antenne */
  K(RB(0.012,0.16,0.16,0.015), B/2+0.006, gurt-kh*0.30, hA-0.22, 0,0,0, 0x0d0f14);
  for(const s of [-1,1])
    K(RB(0.38,0.018,0.018,0.007), s*0.28, gurt+0.03, kabZ+kabL/2+0.12, 0,0,s*0.22, 0x1b1e25);
  G(CY(0.04,0.045,0.13,10), 0.40, schwelle-0.02, -L/2-0.02, Math.PI/2,0,0, 0x9aa1ac);
  K(CY(0.009,0.014,0.24,6), 0, dach+0.09, kabZ-kabL/2+0.16, 0.22,0,0, 0x23272f);

  const g=new THREE.Group();
  const m1=new THREE.Mesh(merge(lack),_lackM);
  const m2=new THREE.Mesh(merge(gummi),_gummiM);
  const m3=new THREE.Mesh(merge(glasT),_glasM);
  const m4=new THREE.Mesh(merge(chromT),_chromM);
  if(HIQ){ m1.castShadow=true; m1.receiveShadow=true; m2.castShadow=true; m3.castShadow=true; }
  g.add(m1); g.add(m2); g.add(m3); g.add(m4);
  return g;
}
/* =========================================================
   Strassenbaum im Winter (Tom, 24.09.: "sieht immer noch nicht gut
   aus"). Vorher gestapelte Zylinder mit wechselnder Farbe - jeder
   Abschnitt ein sichtbarer Ring, die Aeste gerade Stangen mit
   weissen Kloetzen als Schnee.

   Jetzt nach dem Prinzip von EZ-Tree (Dan Greenheck): jeder Ast ist
   EIN durchgehendes Rohr aus vielen Ringen, das sich verjuengt und
   leicht krumm waechst. Kinderaeste setzen entlang des Elternastes
   an, nicht nur am Ende. Rinde als Textur mit Laengsrissen, der
   Stamm laeuft unten in Wurzelanlaeufe aus. Schnee liegt per Shader
   auf den nach oben zeigenden Flaechen - keine Extrateile.
   ========================================================= */
let _baumMat=null;
function baumMat(){
  if(_baumMat) return _baumMat;
  const t=tex(256,512,(g,W,H)=>{
    g.fillStyle='#6b5c4c'; g.fillRect(0,0,W,H);
    /* Borke: breite helle Platten, dazwischen tiefe Laengsrisse */
    for(let i=0;i<60;i++){ const x=Math.random()*W, w=rand(3,9); let xx=x;
      g.strokeStyle=`rgba(22,16,11,${rand(0.45,0.8)})`; g.lineWidth=w; g.beginPath(); g.moveTo(xx,-10);
      for(let y=0;y<=H+20;y+=24){ xx+=rand(-5,5); g.lineTo(xx,y); } g.stroke();
      /* Kante neben dem Riss faengt Licht */
      g.strokeStyle=`rgba(150,132,112,${rand(0.08,0.2)})`; g.lineWidth=2; g.beginPath(); g.moveTo(x+w*0.7,-10);
      xx=x+w*0.7; for(let y=0;y<=H+20;y+=24){ xx+=rand(-5,5); g.lineTo(xx,y); } g.stroke(); }
    /* Querrisse, Flechten und Koernung */
    for(let i=0;i<140;i++){ g.fillStyle=`rgba(20,14,10,${rand(0.2,0.5)})`; g.fillRect(Math.random()*W,Math.random()*H,rand(6,22),rand(1,3)); }
    for(let i=0;i<40;i++){ g.fillStyle=`rgba(${120+Math.random()*30|0},${130+Math.random()*30|0},${100+Math.random()*20|0},${rand(0.08,0.18)})`;
      g.beginPath(); g.ellipse(Math.random()*W,Math.random()*H,rand(4,14),rand(3,10),0,0,Math.PI*2); g.fill(); }
    for(let i=0;i<9000;i++){ const v=Math.random()<0.5?0:255; g.fillStyle=`rgba(${v},${v},${v},${Math.random()*0.07})`; g.fillRect(Math.random()*W,Math.random()*H,1,2); }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8;
  _baumMat=new THREE.MeshStandardMaterial({map:t,roughness:0.95,metalness:0});
  _baumMat.onBeforeCompile=sh=>{
    sh.vertexShader='attribute float schnee;\nvarying float vSchnee;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n  vSchnee=schnee;');
    sh.fragmentShader='varying float vSchnee;\n'+sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.80,0.84,0.90),vSchnee);');
  };
  return _baumMat;
}
function makeBaum(){
  const V3=THREE.Vector3, Q=THREE.Quaternion, UP=new V3(0,1,0);
  /* Parameter je Astordnung: 0 Stamm, 1 Hauptaeste, 2 Seitenaeste,
     3 Zweige, 4 Feinreisig (nur HIQ) */
  const L=HIQ?4:3;
  const P={
    kinder:[7,4,4,3], winkel:[52,42,38,34], start:[0.40,0.25,0.2,0.25],
    laenge:[4.2,3.0,1.4,0.62,0.3], radius:[0.25,0.5,0.5,0.52,0.55],
    ringe:[12,8,5,3,2], seg:[HIQ?14:9,HIQ?9:6,6,4,3], verj:[0.72,0.8,0.82,0.88,0.92],
    krumm:[0.035,0.13,0.2,0.26,0.3], auf:[0,0.018,0.014,0.01,0.006]
  };
  const pos=[], nor=[], uv=[], sch=[], idx=[];
  const ast=(o,q,len,r0,lv)=>{
    const R=P.ringe[lv], S=P.seg[lv], verj=P.verj[lv];
    const p=o.clone(), qq=q.clone(), rahmen=[];
    const basis=pos.length/3; let v=0;
    const umfang=Math.max(1,Math.round(2*Math.PI*r0/0.45));
    for(let i=0;i<=R;i++){
      const f=i/R;
      let r=r0*(1-verj*f);
      /* Wurzelanlauf: unten breiter, mit fuenf Rippen */
      const flare=lv===0?Math.exp(-p.y*5.5):0;
      for(let j=0;j<=S;j++){
        const a=j/S*Math.PI*2;
        const rr=r*(1+flare*(0.55+0.35*Math.sin(a*5+1.3)));
        const d=new V3(Math.cos(a),0,Math.sin(a)).applyQuaternion(qq);
        pos.push(p.x+d.x*rr,p.y+d.y*rr,p.z+d.z*rr); nor.push(d.x,d.y,d.z);
        uv.push(j/S*umfang,v);
        /* Schnee auf Oberseiten, nicht am Stamm unten */
        const oben=Math.max(0,(d.y-0.35)/0.5);
        sch.push(lv===0?0:Math.min(0.92,oben*oben*(lv>=3?0.6:0.95)*(p.y>1.8?1:0)));
      }
      rahmen.push({p:p.clone(),q:qq.clone(),r});
      if(i<R){
        const seglen=len/R;
        p.add(new V3(0,seglen,0).applyQuaternion(qq)); v+=seglen/(2*Math.PI*Math.max(r0,0.04)*1.3);
        /* krumm wachsen, etwas nach oben ziehen */
        const k=P.krumm[lv]/Math.sqrt(Math.max(r,0.02)/0.2);
        qq.multiply(new Q().setFromEuler(new THREE.Euler(rand(-k,k),rand(-k,k),rand(-k,k))));
        const dir=new V3(0,1,0).applyQuaternion(qq);
        const zu=new Q().setFromUnitVectors(dir,dir.clone().lerp(UP,P.auf[lv]).normalize());
        qq.premultiply(zu);
      }
    }
    for(let i=0;i<R;i++) for(let j=0;j<S;j++){
      const a=basis+i*(S+1)+j, b=a+S+1;
      idx.push(a,b,a+1, b,b+1,a+1);
    }
    if(lv>=L) return;
    const n=P.kinder[lv]+(lv>0&&Math.random()<0.4?1:0);
    const off=Math.random()*Math.PI*2;
    for(let k=0;k<n;k++){
      const t=P.start[lv]+(1-P.start[lv])*(n===1?0.5:k/(n-1))*rand(0.85,1);
      const fi=Math.min(R-1,Math.floor(t*R)), fr=t*R-fi, A=rahmen[fi], B=rahmen[fi+1];
      const o2=A.p.clone().lerp(B.p,fr), r2=A.r+(B.r-A.r)*fr;
      const qp=A.q.clone().slerp(B.q,fr);
      const um=off+k*2.39996+rand(-0.3,0.3);      /* goldener Winkel */
      const w=(P.winkel[lv]+rand(-8,8))*Math.PI/180;
      const qc=qp.clone().multiply(new Q().setFromEuler(new THREE.Euler(0,um,0))).multiply(new Q().setFromEuler(new THREE.Euler(0,0,w)));
      const lk=P.laenge[lv+1]*(lv===0?(1.15-0.55*t):(1.2-0.6*t))*rand(0.85,1.15);
      ast(o2,qc,lk,Math.min(r2*0.92,r2*P.radius[lv+1]*rand(0.9,1.1)),lv+1);
    }
    /* Stamm und Hauptaeste laufen oben in einen Leittrieb aus */
    if(lv<=1){ const E=rahmen[R]; ast(E.p.clone().sub(new V3(0,1,0).applyQuaternion(E.q).multiplyScalar(0.02)),E.q.clone(),P.laenge[lv+1]*0.8,E.r*1.05,lv+1); }
  };
  ast(new V3(0,-0.05,0),new Q().setFromEuler(new THREE.Euler(rand(-0.03,0.03),0,rand(-0.03,0.03))),P.laenge[0],P.radius[0],0);
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setAttribute('schnee',new THREE.Float32BufferAttribute(sch,1));
  geo.setIndex(idx);
  const m=new THREE.Mesh(geo,baumMat()); if(HIQ){ m.castShadow=true; m.receiveShadow=true; }
  m.userData.dreiecke=idx.length/3;
  return m;
}
/* =========================================================
   Nachbargrundstueck rechts vom Laden: gleiche Fassade wie der
   eigene Laden, mit Verkaufsschild. Hier waechst der Laden spaeter
   hinein.
   ========================================================= */
function buildNachbar(){
  /* Die Ladenzeile laeuft bis ans Ende des Blocks. Jeder Abschnitt
     gehoert zu einer Ausbaustufe und steht bis dahin leer. */
  /* Die Nachbarzeile setzt genau dort an, wo die Fassade des
     Basisladens endet (die wall() um ihre 6 mm Ueberstand
     verlaengert hat). Vorher begann sie bei 8,10 - dazwischen
     stand nichts, und man sah durch einen neun Zentimeter
     breiten Schlitz vom Laden auf die Strasse. */
  nachbarFassade(8.006,20.0,'shop_gross','ca. 142 m² · direkt nebenan');
  /* Die mittlere Achse des Eckhauses ist bis zum Boden offen - dort
     sitzt spaeter der zweite Eingang. */
  nachbarFassade(20.0,37.9,'shop_ost','ca. 212 m² · Eckhaus der Zeile',1);
}
function nachbarFassade(x0,x1,zid,unterzeile,eingang){
  const zf=6.1, H=WH+0.6;
  const g=new THREE.Group(); scene.add(g);
  /* Die Ladenzeile ist ein Gebaeude, also traegt sie dieselbe
     Fassade wie der eigene Laden - vorher sass hier eine zweite,
     noch groebere Ziegeltextur daneben. */
  const zm=wallBrickMat();
  const w=x1-x0, cx=(x0+x1)/2;
  /* Die Fassade hat echte Oeffnungen. Solange nebenan nicht gekauft ist,
     sind sie zugemauert; nach dem Kauf sitzen dort Schaufenster.
     Die Achsen werden ueber die Laenge verteilt: die erste als hohes
     Schaufenster, die uebrigen als Fenster ueber Brueckungshoehe. */
  /* Schaufenster wie im Basisladen: eine durchgehende Reihe, alle
     auf derselben Hoehe, Bruestung 0,9 und Sturz 2,4. Vorher wechselte
     jede dritte Achse auf ein bodentiefes Fenster und die uebrigen
     sassen hoeher - dadurch standen sie versetzt, waren zu kurz und
     unter den kleinen Fenstern blieb eine graue Wandflaeche stehen. */
  const BR=0.9, ST=2.4, PF=1.0;
  const nB=Math.max(1,Math.round((w-PF)/5.6));
  const bw=(w-(nB+1)*PF)/nB;
  const OEFF=[];
  for(let i=0;i<nB;i++){ const a2=x0+PF+i*(bw+PF); OEFF.push([a2,a2+bw]); }
  /* Die Nachbarfassade war 40 cm dick und stand damit zehn
     Zentimeter weiter im Laden als die Fassade des Basisladens -
     an der Stossstelle sprang die Fensterwand. Jetzt liegt sie in
     derselben Flucht: innen 5,90, aussen 6,10. */
  const F=(a2,b2,y0,y1)=>{ if(b2>a2+0.01) wall(a2,b2,zf-0.2,zf,y0,y1,'-z',shopWall,zm,0); };
  let px=x0;
  OEFF.forEach(([a2,b2],i)=>{
    F(px,a2,0,H);                        /* Pfeiler          */
    if(i!==eingang) F(a2,b2,0,BR);       /* Bruestung        */
    F(a2,b2,ST,H);                       /* Sturz            */
    px=b2;
  });
  F(px,x1,0,H);
  /* Attika, Gesims und Sockel. Die Farben gehen mit der Fassade:
     anthrazit wie der Sockel in der Textur, nicht mehr das
     Sandsteinbeige von der Ziegelwand. */
  bbox(w+0.2,0.28,0.4,std(0x2f343d,{roughness:0.9}),cx,H+0.12,zf+0.02,g);
  bbox(w+0.1,0.1,0.36,std(0xe8ecf2,{roughness:1}),cx,H+0.3,zf+0.04,g,false);
  /* Der Sockel war 50 cm tief und mittig auf der Wand - damit stand
     er zur Haelfte IM Laden und zog dort ein schwarzes Band unter
     der ganzen Fensterfront entlang. Er gehoert nach draussen. */
  /* An der Eingangsachse hat der Sockel eine Luecke fuer die Tuer, wie
     am Haupteingang. Vorher lief er durch und stand 62 cm hoch quer in
     der offenen Schiebetuer. Das Stueck in der Luecke steht nur, bis
     der zweite Eingang gekauft ist. */
  { const sm=std(0x3b4049,{roughness:0.9}), sx0=x0-0.06, sx1=x1+0.06;
    const sockel=(a2,b2,par)=>bbox(b2-a2,0.62,0.26,sm,(a2+b2)/2,0.31,zf+0.06,par);
    if(eingang!==undefined){
      const [ea,eb]=OEFF[eingang], ec=(ea+eb)/2, l0=ec-1.3, l1=ec+1.3;
      sockel(sx0,l0,g); sockel(l1,sx1,g);
      zWand('eingang2',sockel(l0,l1,g));
    } else sockel(sx0,sx1,g);
  }

  /* ---------- Zustand „steht zum Verkauf“ ---------- */
  const gs=new THREE.Group(); g.add(gs); zWand(zid,gs);
  const brett=std(0x6d5a44,{roughness:0.95});
  const zugemauert=std(0x5a4a3e,{roughness:0.95});
  /* Die Oeffnungen sind jetzt eine durchgehende Fensterreihe und
     tragen nur noch ihre x-Grenzen; Bruestung und Sturz stehen fuer
     alle gleich in BR und ST. Vorher stand die Hoehe in jedem
     Eintrag und wurde hier mit ausgelesen - nach der Umstellung kam
     dabei NaN heraus und die Bretter landeten im Nirgendwo. */
  OEFF.forEach(([a,b],i)=>{
    const y0=i===eingang?0:BR, y1=ST;
    const bw=b-a, bh=y1-y0, bxc=(a+b)/2, byc=(y0+y1)/2;
    bbox(bw,bh,0.18,zugemauert,bxc,byc,zf-0.1,gs,false);
    const n=Math.max(3,Math.round(bh/0.55));
    for(let k=0;k<n;k++) bbox(bw+0.14,0.16,0.06,brett,bxc,y0+0.22+k*(bh-0.4)/(n-1),zf+0.03,gs,false);
    /* zwei schraege Bretter ueber Kreuz */
    for(const sgn of [1,-1]){ const d=bbox(Math.hypot(bw,bh)+0.1,0.14,0.05,brett,bxc,byc,zf+0.05,gs,false);
      d.rotation.z=sgn*Math.atan2(bh,bw); }
  });
  /* Frueher standen hier ein Makler-Schild und ein Bauzaun. Beides
     ist raus: wer spielt, will einen schicken Laden sehen und keine
     Baustelle. Dass man das Lokal kaufen kann, steht im Laptop. */

  /* ---------- Zustand „gehoert dir“: Schaufenster ---------- */
  const go=new THREE.Group(); g.add(go); zAdd(zid,go);
  const glas=new THREE.MeshStandardMaterial({color:LIN(0xbfe0ff),transparent:true,opacity:0.16,roughness:0.05,metalness:0.2,depthWrite:false});
  const prof=std(0x2b3040,{metalness:0.5,roughness:0.4});
  const bank=std(0xd7dae0,{roughness:0.5});
  OEFF.forEach(([a,b],i)=>{
    if(i===eingang){ eingangsAchse(go,a,b,zf,ST,glas,prof); return; }
    const y0=BR, y1=ST;
    const bw=b-a, bh=y1-y0, bxc=(a+b)/2, byc=(y0+y1)/2;
    /* Wie das Schaufenster im Basisladen (Tom, 26.09.): Glas buendig in
       der Laibung, nur eine schmale Leiste oben und unten und eine
       Mittelsprosse - kein umlaufender schwarzer Rahmen innen und aussen */
    bbox(bw,bh,0.03,glas,bxc,byc,zf-0.1,go,false);
    bbox(bw,0.06,0.12,prof,bxc,y0+0.03,zf-0.1,go,false);
    bbox(bw,0.06,0.12,prof,bxc,y1-0.03,zf-0.1,go,false);
    bbox(0.06,bh,0.1,prof,bxc,byc,zf-0.1,go,false);
    /* Fensterbank nur aussen. Sie ragte 13 cm in den Laden hinein und
       warf dort einen dunklen Schatten unter die ganze Fensterfront -
       im Basisladen sitzt unter dem Fenster direkt die Sockelfarbe. */
    if(y0>0.2) bbox(bw+0.16,0.06,0.26,bank,bxc,y0-0.02,zf+0.06,go,false);
  });
  if(eingang!==undefined&&EING2.x!==null){
    col(x0,EING2.x-1.28,zf-0.25,zf+0.05);
    col(EING2.x+1.28,x1,zf-0.25,zf+0.05);
    /* Solange der Eingang nicht gekauft ist, steht dort eine feste
       Scheibe - die sperrt wie jedes andere Schaufenster. */
    zWandCol('eingang2',col(EING2.x-1.28,EING2.x+1.28,zf-0.25,zf+0.05));
  } else col(x0,x1,zf-0.25,zf+0.05);
  return g;
}
/* =========================================================
   Muelleimer vor dem Laden
   ========================================================= */
function buildMuelleimer(x,z,ry){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; scene.add(g);
  const stahl=std(0x50575f,{metalness:0.62,roughness:0.42});
  const dunkel=std(0x2b3038,{metalness:0.5,roughness:0.5});
  /* Pfosten mit Fussplatte */
  bbox(0.22,0.025,0.22,stahl,0,0.012,0,g,false);
  for(let k=0;k<4;k++){ const a=k/4*Math.PI*2;
    bbox(0.03,0.02,0.03,std(0x8f959e,{metalness:0.7}),Math.cos(a)*0.07,0.03,Math.sin(a)*0.07,g,false); }
  const post=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.055,0.92,12),stahl);
  post.position.y=0.46; if(HIQ) post.castShadow=true; g.add(post);
  /* Korpus: konischer Behaelter mit Lochblech */
  const loch=tex(256,256,(c,W,H)=>{
    c.fillStyle='#4b525a'; c.fillRect(0,0,W,H);
    for(let y=10;y<H;y+=22) for(let x=((y/22)%2)*11+10;x<W;x+=22){
      c.fillStyle='#14171c'; c.beginPath(); c.arc(x,y,6,0,Math.PI*2); c.fill();
      c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.arc(x-1.4,y-1.6,6,Math.PI*0.9,Math.PI*1.7); c.stroke?0:0; c.fill(); }
    for(let i=0;i<700;i++){ c.fillStyle=`rgba(0,0,0,${Math.random()*0.06})`; c.fillRect(Math.random()*W,Math.random()*H,2,2); }
  });
  loch.wrapS=loch.wrapT=THREE.RepeatWrapping; loch.repeat.set(3,2); loch.anisotropy=8;
  const korb=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.165,0.5,HIQ?22:14,1,true),
    new THREE.MeshStandardMaterial({map:loch,metalness:0.5,roughness:0.5,side:THREE.DoubleSide}));
  korb.position.y=1.06; if(HIQ) korb.castShadow=true; g.add(korb);
  /* Boden, obere und untere Ringe */
  const bo=new THREE.Mesh(new THREE.CylinderGeometry(0.165,0.165,0.02,16),dunkel); bo.position.y=0.82; g.add(bo);
  for(const [y,r] of [[1.31,0.205],[0.83,0.17]]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,0.016,8,HIQ?22:12),stahl);
    ring.rotation.x=Math.PI/2; ring.position.y=y; g.add(ring);
  }
  /* Deckel mit Einwurf und Ascher */
  const deck=new THREE.Mesh(new THREE.CylinderGeometry(0.225,0.205,0.06,HIQ?22:14),stahl);
  deck.position.y=1.35; g.add(deck);
  const kegel=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.21,0.1,HIQ?22:14),dunkel);
  kegel.position.y=1.42; g.add(kegel);
  bbox(0.19,0.055,0.13,std(0x14171c,{roughness:0.9}),0.07,1.43,0,g,false);
  const asch=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.05,0.07,12),dunkel);
  asch.position.set(-0.12,1.47,0); g.add(asch);
  /* Halterung am Pfosten und Piktogramm */
  bbox(0.09,0.22,0.06,stahl,-0.2,1.06,0,g,false);
  plane(0.16,0.2,new THREE.MeshStandardMaterial({transparent:true,roughness:0.6,map:tex(160,200,(c,W,H)=>{
    c.clearRect(0,0,W,H);
    c.fillStyle='#e8ecf2'; c.beginPath();
    c.moveTo(38,58); c.lineTo(122,58); c.lineTo(112,178); c.lineTo(48,178); c.closePath(); c.fill();
    c.fillRect(30,44,100,12); c.fillRect(66,32,28,10);
    c.fillStyle='#4b525a'; c.fillRect(58,74,8,88); c.fillRect(76,74,8,88); c.fillRect(94,74,8,88);
  })}),0,1.1,0.202,0,g);
  /* Schnee auf dem Deckel */
  const sn=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.21,0.04,HIQ?20:12),std(0xe8ecf2,{roughness:1}));
  sn.position.y=1.47; g.add(sn);
  col(x-0.26,x+0.26,z-0.26,z+0.26);
  return g;
}
function buildStreet(){
  // Bordstein und Gehweg gegenüber
  bbox(60,0.16,0.26,std(0x9aa0a8,{roughness:0.95}),0,0.08,17.4,null,false);
  const gw=concreteTex(); gw.repeat.set(30,3);
  flat(60,5,new THREE.MeshStandardMaterial({map:gw,roughness:0.92}),0,0.015,19.9);
  for(let i=-7;i<=7;i++){ if(Math.random()<0.6) bbox(rand(1.0,2.4),0.18,0.5,std(0xe8ecf2,{roughness:1}),i*4,0.14,17.1,null,false); }
  // Fahrbahnmarkierung und Gullys
  for(let i=-12;i<=12;i++) flat(2.2,0.16,std(0xd9d4c2),i*4,0.014,13.2);
  for(const x of [-16,12]){ const gu=new THREE.Mesh(new THREE.CircleGeometry(0.42,14),std(0x3a3d44,{metalness:0.4,roughness:0.7})); gu.rotation.x=-Math.PI/2; gu.position.set(x,0.016,15.6); scene.add(gu); }
  /* Haeuserzeile gegenueber: geschlossener Blockrand statt einzelner
     Kloetze mit Luecken (Tom, 26.09.). Gruenderzeit- und Nachkriegs-
     haeuser gemischt, fast jedes mit Laden; jeder Laden kommt nur
     einmal vor. */
  HZ={}; HZS=[]; HZA=[];
  scene.updateMatrixWorld();
  const laeden=LADEN.slice().sort(()=>Math.random()-0.5); let li=0, vorige=0;
  let x=-44;
  while(x<43.5){
    const stil=Math.random()<0.62?'alt':'nach', alt=stil==='alt';
    let w=alt?rand(7.2,10):rand(8,11.5); if(44-x-w<5) w=44-x;
    const laden=Math.random()<0.88&&li<laeden.length?laeden[li++]:null;
    const rows=alt?(Math.random()<0.7?3:2):(Math.random()<0.6?4:3), gH=alt?(laden?4.3:4.0):(laden?3.8:3.5), fh=alt?3.3:2.85;
    buildHaus(x+w/2,22.9+rand(0,0.12),{w,d:rand(8.5,10),h:gH+rows*fh+(alt?0.95:0.55),stil,rows,gH,fh,laden,
      cols:Math.max(2,Math.round(w/(alt?2.45:2.6))),farbe:(vorige=pick(HAUSFARBEN[stil].filter(f=>f!==vorige))),treppe:Math.random()<0.7,
      dach:alt?(Math.random()<0.5?'mansard':'sattel'):(Math.random()<0.6?'sattel':'flach'),by:bodenY(x+w/2,22.3)});
    x+=w;
  }
  /* Zweite Reihe als Tiefenstaffelung: echte Fassaden und Daecher,
     einfacher als vorn. Rechts endet sie, wo die Stadtzeile anfaengt. */
  x=-76;
  while(x<46){ const w=Math.min(rand(8,13),47-x), stil=Math.random()<0.55?'alt':'nach';
    if(w>4) hinterhaus(x+w/2,36,{w,d:9,h:rand(14,21),stil,farbe:pick(HAUSFARBEN[stil])}); x+=w; }
  hzFertig();
  // Autos am gegenüberliegenden Bordstein
  /* echte Lackfarben: viel Silber, Weiss, Schwarz und Grau, dazu Blau, Rot, Gruen */
  const carCols=[0xc9ccd2,0xeeeeec,0x17191d,0x5b6068,0x1f4a8a,0x9c1e1e,0x2c4a3c,0xa9a39a,0x7d8794];
  for(let i=0;i<(COARSE?4:7);i++){ const c=makeAuto(pick(carCols),pick(['kombi','limo','van','suv','klein','limo'])); c.position.set(-22+i*6.6+rand(-0.6,0.6),0,16.0+rand(-0.12,0.12)); c.rotation.y=Math.PI/2+rand(-0.035,0.035); scene.add(c); }
  buildNachbar();
  /* Die Poller vor dem Schaufenster stehen bei x = -5,4 und 5,4. Der
     rechte Muelleimer stand 20 cm daneben und steckte mit Korb und
     Halter im Poller. */
  buildMuelleimer(-3.1,7.55,0.4); buildMuelleimer(6.7,7.55,-0.3);
  // Bäume und Stadtmöbel auf unserer Seite
  /* Der mittlere Baum stand bei x -11 genau in der Laterne - der
     Mast lief durch die Krone. Jetzt zwischen zwei Laternen. */
  for(const bx of (COARSE?[-16.5,13]:[-16.5,-7.5,13])){ const b=makeBaum(); b.position.set(bx,0,10.4); b.scale.setScalar(rand(0.9,1.2)); scene.add(b);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.75,0.06,6,18),std(0x3a3d44)); ring.rotation.x=Math.PI/2; ring.position.set(bx,0.06,10.4); scene.add(ring);
    col(bx-0.42,bx+0.42,9.98,10.82); b.userData.baum=true; }
  /* Hier stand noch ein Kasten als Platzhalter-Muelleimer neben der
     Laterne - die echten Muelleimer stehen am Laden. Weg damit. */
}
