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
  /* Schiefer in Schuppendeckung fuer die steile Mansardflaeche: mit den
     Biberschwaenzen las sie sich als schwarz gesprenkelte Masse (26.09.) */
  T.schiefer=tex(256,256,(g,W,H)=>{ g.fillStyle='#1c1e22'; g.fillRect(0,0,W,H);
    for(let r=11;r>=-1;r--) for(let c=-1;c<13;c++){ const x=c*21.33+(r&1)*10.67, y=r*21.33-6, v=150+Math.random()*60|0;
      const gr=g.createLinearGradient(0,y,0,y+26); gr.addColorStop(0,`rgb(${v*0.75|0},${v*0.78|0},${v*0.82|0})`); gr.addColorStop(1,`rgb(${v},${v+4},${v+10})`);
      g.fillStyle=gr; g.beginPath(); g.moveTo(x+1,y); g.lineTo(x+20,y); g.lineTo(x+20,y+16); g.quadraticCurveTo(x+20,y+24,x+10.5,y+26); g.quadraticCurveTo(x+1,y+24,x+1,y+16); g.closePath(); g.fill(); } });
  /* Schnee in Flecken, die den Ziegelreihen folgen */
  T.schnee=tex(256,256,(g,W,H)=>{ g.clearRect(0,0,W,H);
    for(let i=0;i<340;i++){ const x=Math.random()*W, y=Math.random()*H, rw=rand(8,46), rh=rand(3,9);
      g.fillStyle=`rgba(255,255,255,${rand(0.55,1)})`;
      for(const ox of [-W,0,W]) for(const oy of [-H,0,H]){ g.beginPath(); g.ellipse(x+ox,y+oy,rw,rh,0,0,Math.PI*2); g.fill(); } } });
  for(const k of ['putz','dach','schiefer','schnee']){ T[k].wrapS=T[k].wrapT=THREE.RepeatWrapping; T[k].anisotropy=8; }
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
    schiefer:new THREE.MeshStandardMaterial({vertexColors:true,map:T.schiefer,roughness:0.5,metalness:0.15}),
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
      /* Leuchtkasten und Holzbrett: Zeile deckend in Kasten- bzw.
         Brettfarbe, dann greift kein Alpha-Test und die Schrift zerfaellt
         in der Ferne nicht mehr in den Mipmaps (26.09., Toms Wunsch nach
         hochwertigen Laeden; vorher wurde aus REISEBUERO Buchstabensalat) */
      if(sp.grund){ g.fillStyle=licht?sp.grundL:sp.grund; g.fillRect(0,y,SCH.W,SCH.zeile);
        if(!licht&&sp.serif){ g.fillStyle='rgba(20,14,8,.85)'; g.fillText(sp.t,SCH.W/2+3,y+SCH.zeile/2+7); } }
      else { /* Einzelbuchstaben: dunkle Kontur macht die Striche dicker,
         der Alpha-Wert bleibt auch in kleinen Mipmaps ueber der Schwelle */
        g.lineJoin='round'; g.lineWidth=7; g.strokeStyle=licht?'#000':'#2a2622'; g.strokeText(sp.t,SCH.W/2,y+SCH.zeile/2+4); }
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
  if(HZS.length){ const sm=new THREE.MeshStandardMaterial({vertexColors:true,map:schildAtlas(false),emissive:LIN(0xffffff),emissiveMap:schildAtlas(true),emissiveIntensity:0,alphaTest:0.3,alphaToCoverage:true,roughness:0.5,side:THREE.DoubleSide});
    sm.map.anisotropy=8; houseMats.push(sm); M.schild=sm; }
  if(HZA.length){ const mt=markiseAtlas(); mt.wrapS=THREE.RepeatWrapping; M.markise=new THREE.MeshStandardMaterial({map:mt,alphaTest:0.5,roughness:0.9,side:THREE.DoubleSide}); }
  for(const k in HZ){
    let mat=M[k];
    if(!mat&&k.startsWith('tuer:')) mat=new THREE.MeshStandardMaterial({map:tuerTex(k.slice(5)),roughness:0.45,metalness:0.05});
    if(!mat) continue;
    const mesh=new THREE.Mesh(merge(HZ[k]),mat);
    if(HIQ&&(k==='putz'||k==='dach'||k==='schiefer')){ mesh.castShadow=true; mesh.receiveShadow=true; }
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
  /* Seitenwaende eine Stufe dunkler als die Rueckwand: das helle Creme
     stand schraeg gesehen als leuchtender Block hinter der Tuer (26.09.) */
  for(const sx of [-1,1]) B(0.05,yt-yb,D,xm+sx*iw/2,(yb+yt)/2,(z0+z1)/2,hexMix(hell,0x2a2622,0.35));
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
    /* Tortenvitrine direkt am Glas, damit schraeg gesehen Ware statt
       nur Spiegelung zu sehen ist (26.09.) */
    { const xv=x0+0.75, zv=z1-0.5; B(1.2,0.8,0.55,xv,yb+0.4,zv,0x5a3b26); B(1.24,0.04,0.6,xv,yb+0.82,zv,0x2a2018);
      for(const sx of [-1,1]) B(0.03,0.75,0.03,xv+sx*0.59,yb+1.2,zv+0.26,0xc9a14e);
      B(1.2,0.03,0.52,xv,yb+1.2,zv,0xe8e4dc); B(1.22,0.04,0.56,xv,yb+1.58,zv,0x2a2018);
      for(let k=0;k<2;k++) for(let j=0;j<4;j++){ const c=[0xf2e6d0,0x6a3a2a,0xe8a0a8,0xd9a45a][(j+k*2)%4], xx=xv-0.43+j*0.29, y=yb+0.84+k*0.38;
        C(0.12,0.12,0.12,xx,y+0.06,zv,c,12); C(0.12,0.12,0.02,xx,y+0.13,zv,k?0xf8f4ee:0xb8403a,12); } }
    for(let j=0;j<nA(1.4)-1;j++){ const x=x0+2.3+j*1.4, z=z1-0.6;
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
    /* Am Glas: gemauerter Pizzaofen mit Glut und ein Stapel Kartons -
       vorher sah man durch die Scheibe fast nur Spiegelung (26.09.) */
    const xo=x0+0.75, zo=z1-0.75;
    B(1.1,0.75,0.9,xo,yb+0.375,zo,0x6a3a2a); K(0.5,xo,yb+0.78,zo,0xa0583a,0.75);
    B(0.4,0.26,0.05,xo,yb+0.9,zo+0.48,0x1a1210); B(0.34,0.16,0.02,xo,yb+0.86,zo+0.51,0xff8a2a);
    C(0.06,0.06,0.5,xo+0.2,yb+1.35,zo-0.1,0x3a3a3a);
    for(let k=0;k<5;k++) B(0.36,0.05,0.36,xo+0.9,yb+0.03+k*0.052,z1-0.4,k%2?0xe8dcc0:0xd8c8a8);
    for(let j=0;j<Math.min(2,nA(1.6))-1;j++){ const x=x0+2.4+j*1.6, z=z1-0.7; C(0.35,0.35,0.04,x,yb+0.74,z,0xe8e2d4,14); C(0.04,0.04,0.72,x,yb+0.36,z,0x3a3f48);
      for(const sx of [-1,1]){ B(0.36,0.04,0.36,x+sx*0.55,yb+0.45,z,0x6a4a2a); B(0.36,0.4,0.04,x+sx*0.55,yb+0.66,z,0x6a4a2a); } }
  } else if(t.startsWith('METZ')){
    B(iw*0.8,0.85,0.7,xm,yb+0.425,z0+1.4,0xf2f2ee);
    for(let j=0;j<Math.floor(iw*0.75/0.22);j++) K(0.08,xm-iw*0.37+j*0.22,yb+0.9,z0+1.4,j%3?0xb8403a:0xd88a80,0.5);
    regal(xm,iw*0.7,3,(x,y,z,j)=>C(0.04,0.04,0.2,x,y+0.1,z,j%2?0x9a3a2a:0xc9a07a),0xe4e8ea);
    /* Im Fenster: Stange mit Wuersten und Schinken, darunter Schalen */
    /* dunkle Kachelwand dahinter und dicke Wuerste: vorher las sich die
       Auslage wie eine Tapete mit Punkten (26.09.) */
    B(aw,1.25,0.03,am,yb+1.5,zA-0.22,0x3a2e2a);
    B(aw,0.03,0.03,am,yb+2.05,zA,0xb8bec8);
    for(let j=0;j<nA(0.34);j++){ const x=x0+0.22+j*0.34;
      if(j%3===1) K(0.17,x,yb+1.72,zA,0x9a4a3a,1.6); else { C(0.06,0.05,0.6,x,yb+1.72,zA,j%2?0x7a2a22:0xa05a3a); C(0.012,0.012,0.12,x,yb+1.99,zA,0xe8e2d4,4); } }
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
    /* hinter der Glastuer ein Getraenkekuehlschrank statt nackter Wand (26.09.) */
    { const xk=x1-0.45; B(0.8,1.95,0.6,xk,yb+0.975,z0+0.9,0x2a2e36); B(0.7,1.7,0.02,xk,yb+1.0,z0+1.21,0x6a8aa8);
      for(let k=0;k<5;k++) for(let j=0;j<4;j++) C(0.035,0.035,0.22,xk-0.24+j*0.16,yb+0.3+k*0.33,z0+1.12,R[(j+k*3)%7],6); }
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
      /* Tannengruen als flache Kegel statt Kugeln - die lasen sich wie
         eine Reihe gruener Baelle (26.09.) */
      K.C('rahmen',0.012,0.085,0.17+(i%3)*0.03,px,yk+0.24+(i%3)*0.015,zk+(i%2?0.03:-0.02),i%3?0x2c4a2e:0x3a5a34);
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
  const S=(P,schnee,sch)=>{ K.F(sch?'schiefer':'dach',[P],sch?0x5a5f68:dc,1.2); if(schnee) K.F('schnee',[P.map(p=>[p[0],p[1]+0.035,p[2]])],0xffffff,2.2); };
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
    S([[x0,h,zE],[x1,h,zE],[x1,yK,zK],[x0,yK,zK]],0,1); S([[x1,h,-zE],[x0,h,-zE],[x0,yK,-zK],[x1,yK,-zK]],0,1);
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
    if(kasten||L.holz){ sp.grund=L.f; sp.grundL=kasten?hexCss(hexMix(fc,0x000000,0.45)):'#000'; }
    HZS.push(sp);
    const frac=schriftBreite(sp)/SCH.W, band=o.gH-yT, yc=yT+band*0.5+0.03, xc=(xa+xb)/2;
    const qH=Math.min(kasten?band*0.95:band*1.1,(xb-xa)*0.86/(frac*SCH.W/SCH.zeile)), qW=qH*SCH.W/SCH.zeile, uv=schildUV(i);
    const Q=(z,c)=>K.Q('schild',[[xc-qW/2,yc-qH/2,z],[xc+qW/2,yc-qH/2,z],[xc+qW/2,yc+qH/2,z],[xc-qW/2,yc+qH/2,z]],uv,c);
    /* Traditionsladen: Goldschrift auf dunklem Holzbrett - auf hellem
       Putz war die Goldschrift kaum zu lesen */
    /* deckende Zeile: nur die Vorderflaeche von Brett/Kasten bekleben */
    const QF=(bw,bh,z)=>{ const fu=bw/qW/2, fv=(1-bh/qH)/2*(uv[3]-uv[1]);
      K.Q('schild',[[xc-bw/2,yc-bh/2,z],[xc+bw/2,yc-bh/2,z],[xc+bw/2,yc+bh/2,z],[xc-bw/2,yc+bh/2,z]],[0.5-fu,uv[1]+fv,0.5+fu,uv[3]-fv],0xffffff); };
    if(L.holz){ const bh=Math.min(band-0.2,qH*0.85), bw=frac*qW+0.6; K.B('rahmen',bw,bh,0.06,xc,yc,zf+0.03,fc); K.B('rahmen',bw+0.06,0.04,0.08,xc,yc+bh/2,zf+0.04,0xb8913e);
      QF(bw,bh,zf+0.062); }
    else if(kasten){ const bw=frac*qW+0.5, bh=Math.min(band-0.2,qH*0.8); K.B('rahmen',bw,bh,0.14,xc,yc,zf+0.07,fc); QF(bw,bh,zf+0.142); }
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
  /* Hauseingang, Treppenhaus und Fallrohr je Haus mal links, mal rechts -
     vorher war jedes Haus gleich aufgeteilt und die Zeile wirkte wie ein
     Kopierstempel (26.09., Toms Wunsch nach einer hochwertigeren Stadt) */
  const sp=Math.random()<0.5, cT=sp?0:nC-1, xT=bx(cT);
  /* Erdgeschoss: Laden neben dem Hauseingang */
  o.yT=gH-0.75;
  if(o.laden){ o.sx0=sp?xT+0.65+0.45:-w/2+0.45; o.sx1=sp?w/2-0.45:xT-0.65-0.45; ladenFront(K,g,o); }
  else for(let c=0;c<nC;c++) if(c!==cT) fenster(K,o,bx(c),1.3,alt?Math.min(1.2,bay-1):Math.min(1.4,bay-0.8),Math.min(1.9,gH-2.1),'eg');
  hausTuer(K,o,xT);
  /* Obergeschosse; ueber der Haustuer liegt das Treppenhaus mit
     Fenstern auf halber Hoehe */
  const ww=alt?Math.min(1.22,bay-1.0):Math.min(1.45,bay-0.8);
  const balkon=!alt&&Math.random()<0.45?Math.floor(Math.random()*(nC-1))+(sp?1:0):-1;
  for(let r=0;r<o.rows;r++){ const fy=gH+r*fh;
    for(let c=0;c<nC;c++){
      if(c===cT&&o.treppe){ fenster(K,o,bx(c),fy+fh*0.5-0.1,0.8,1.3,'treppe'); continue; }
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
  /* Fallrohr an der Hauskante auf der Seite des Eingangs */
  { const fx=(sp?-1:1)*(w/2-0.12), top=alt?h-0.4:h-0.45, zr=zf+0.12, zn=0x8f959e;
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
/* =========================================================
   Strassenraum (Tom, 26.09.: "Laeden gegenueber, Hochhaeuser und
   alles drum herum nochmal deutlich schoener und hochwertiger in
   der 3D"). Vorher: schwarze Kritzel-Risse im Asphalt, ein grauer
   Balken als Bordstein, zwei Mittellinien (eine lief unter den
   parkenden Autos durch), nur auf unserer Seite Laternen und nachts
   eine pechschwarze Strasse.
   Jetzt: Asphalt mit Splittkorn, Flickstellen und vergossenen Fugen,
   Granitbord mit Fase und Rinne, Plattengehweg, Markierungen nach
   StVO, Moeblierung gegenueber und Lichtpfuetzen unter den Laternen.
   Alles Kleinteilige wird je Material zu EINEM Mesh verschmolzen -
   die ganze Moeblierung kostet so nur eine Handvoll Draw-Calls.
   ========================================================= */
/* Bordkanten (Fahrbahnseite), Parkstreifen, Leitlinie, Zebrastreifen */
const STR={zN:11.1, zS:17.3, park:14.9, mitte:13.0, zebra:33, X:100};
/* Absenkungen der Borde: Hofzufahrt und Ueberweg (unsere Seite endet bei x 38) */
const BORD_ABS_N=[[-30.2,-19.8],[STR.zebra-1.6,STR.zebra+1.6]], BORD_ABS_S=[[STR.zebra-1.6,STR.zebra+1.6]];
/* Gehweghoehe (28.09., Tom: "alles drum herum deutlich schoener"): der
   Gehweg lag auf Fahrbahnhoehe, der Bord stand als 12-cm-Schwelle
   dazwischen. Jetzt liegt er am Bord buendig mit dessen Ruecken und
   faellt zu den Haeusern auf 1 cm ab - an Tueren und Fussmatten bleibt
   alles, wie es war. Kunden und Stadtmoebel stehen auf dieser Hoehe. */
function gwH(x,z,nord){
  if(nord){ const zN=STR.zN-0.2; return 0.012+(0.008+0.1*bordHoch(x,BORD_ABS_N))*clamp((z-7.5)/(zN-7.5),0,1); }
  const zS=STR.zS+0.2; return 0.012+(0.008+0.1*bordHoch(x,BORD_ABS_S))*clamp((22.4-z)/(22.4-zS),0,1);
}
function gehwegY(x,z){
  if(z>=5.8&&z<=STR.zN-0.2&&x>-STR.X&&x<38&&(x<-30.2||x>-19.8)) return gwH(x,z,true);
  if(z>=STR.zS+0.2&&z<=24&&Math.abs(x)<STR.X) return gwH(x,z,false);
  return 0;
}
/* ---------- Sammler: Teile je Material, am Ende verschmolzen ---------- */
let _stS={}, _stM=new THREE.Matrix4(), _strMats=null;
function stOrt(x,z,ry){ _stM=tm(x,gehwegY(x,z),z,0,ry||0,0); }
function stM(k,geo,m,farbe){ (_stS[k]=_stS[k]||[]).push({geo,m:_stM.clone().multiply(m),color:farbe}); }
function mT(k,geo,x,y,z,rx,ry,rz,farbe){ stM(k,geo,tm(x,y,z,rx,ry,rz),farbe); }
/* Rohr von a nach b (lokale Koordinaten des aktuellen Orts) */
const _yAchse=new THREE.Vector3(0,1,0);
function stRohr(k,a,b,r,farbe,seg){
  const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]), l=d.length();
  const q=new THREE.Quaternion().setFromUnitVectors(_yAchse,d.normalize());
  stM(k,new THREE.CylinderGeometry(r,r,l,seg||8,1,true),new THREE.Matrix4().compose(V((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),q,V(1,1,1)),farbe);
}
/* UV einer Geometrie in ein Rechteck des Schildatlas legen (Pixel, 1024er Atlas) */
function atlasUV(geo,x0,y0,x1,y1){
  const uv=geo.attributes.uv;
  for(let i=0;i<uv.count;i++) uv.setXY(i,(x0+uv.getX(i)*(x1-x0))/1024,1-(y1-uv.getY(i)*(y1-y0))/1024);
  return geo;
}
function strMats(){
  if(_strMats) return _strMats;
  const at=schildAtlas();
  const lampe=new THREE.MeshStandardMaterial({color:LIN(0x23262e),emissive:LIN(0xffe9c0),emissiveIntensity:0}); lampMats.push(lampe);
  /* Werbevitrine der Haltestelle: nachts von innen beleuchtet */
  const leucht=new THREE.MeshStandardMaterial({map:at,emissiveMap:at,emissive:LIN(0x9a9a9a),emissiveIntensity:0,roughness:0.3}); lampMats.push(leucht);
  _strMats={
    lack:lichtMat(std(0xffffff,{vertexColors:true,metalness:0.5,roughness:0.42})),
    matt:lichtMat(std(0xffffff,{vertexColors:true,roughness:0.88})),
    schild:lichtMat(new THREE.MeshStandardMaterial({map:at,roughness:0.45,metalness:0.1})),
    glas:new THREE.MeshStandardMaterial({color:LIN(0xcfdde8),transparent:true,opacity:0.2,roughness:0.06,metalness:0.3,depthWrite:false}),
    lampe, leucht
  };
  return _strMats;
}
function stFertig(){
  const M=strMats();
  for(const k in _stS){ const t=_stS[k]; if(!t.length) continue;
    const geo=merge(t);
    const o=new THREE.Mesh(lichtUV2(geo),M[k]); o.userData.strasse=k;
    if(HIQ&&k!=='glas'){ o.castShadow=true; o.receiveShadow=true; }
    scene.add(o); }
  _stS={};
}
/* Flaechen aus Dreiecken mit Farbe je Ecke. Die Dreiecke werden nach
   der Richtung h gedreht, damit die Normale stimmt. */
function bauer(){
  const P=[],U=[],C=[];
  const o={
    tri(a,b,c,h){
      const ux=b.p[0]-a.p[0],uy=b.p[1]-a.p[1],uz=b.p[2]-a.p[2], vx=c.p[0]-a.p[0],vy=c.p[1]-a.p[1],vz=c.p[2]-a.p[2];
      const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
      if(nx*h[0]+ny*h[1]+nz*h[2]<0){ const t=b; b=c; c=t; }
      for(const q of [a,b,c]){ P.push(q.p[0],q.p[1],q.p[2]); U.push(q.u[0],q.u[1]); C.push(q.c[0],q.c[1],q.c[2]); }
    },
    quad(a,b,c,d,h){ o.tri(a,b,c,h||[0,1,0]); o.tri(a,c,d,h||[0,1,0]); },
    leer:()=>!P.length,
    geo(){ const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
      g.setAttribute('color',new THREE.Float32BufferAttribute(C,3)); g.computeVertexNormals(); g.computeBoundingSphere(); return g; }
  };
  return o;
}
const ecke=(x,y,z,u,v,c)=>({p:[x,y,z],u:[u,v],c:c||[1,1,1]});
const grau=f=>[f,f,f];
/* Streifen laengs einer Linie in der Ebene y: pts [[x,z],...] */
function streifen(B,pts,w,y,c,uvf){
  for(let i=0;i<pts.length-1;i++){
    const [x0,z0]=pts[i], [x1,z1]=pts[i+1], l=Math.hypot(x1-x0,z1-z0)||1, nx=-(z1-z0)/l*w/2, nz=(x1-x0)/l*w/2;
    const e=(x,z)=>{ const [u,v]=uvf(x,z); return ecke(x,y,z,u,v,c); };
    B.quad(e(x0+nx,z0+nz),e(x1+nx,z1+nz),e(x1-nx,z1-nz),e(x0-nx,z0-nz));
  }
}
/* ---------- Texturen ---------- */
/* Asphalt: 4 x 4 m, feines Splittkorn statt Kritzel-Rissen. Dieselben
   Koerner liefern die Hoehe fuer die Normal-Map - bei tief stehender
   Sonne glitzert die Decke leicht. */
let _asphT=null, _asphN=null;
function asphaltTex(){
  if(_asphT) return _asphT;
  const korn=(g,W,H,hoehe)=>{ const R=saat(4711);
    for(let i=0;i<52000;i++){ const x=R()*W|0, y=R()*H|0, t=R(), a=R(), s=R()<0.82?1:2;
      if(hoehe) g.fillStyle=t<0.45?`rgba(0,0,0,${0.3+a*0.4})`:`rgba(255,255,255,${0.3+a*0.5})`;
      else g.fillStyle=t<0.45?`rgba(16,17,20,${0.2+a*0.35})`:t<0.9?`rgba(158,158,156,${0.12+a*0.3})`:`rgba(196,176,154,${0.15+a*0.3})`;
      g.fillRect(x,y,s,s); } };
  const t=tex(512,512,(g,W,H)=>{
    g.fillStyle='#4f5258'; g.fillRect(0,0,W,H);
    /* flaue Wolken: Alterung und Walzspuren, nahtlos gekachelt */
    const R=saat(99);
    for(let i=0;i<44;i++){ const x=R()*W, y=R()*H, r=30+R()*110, hell=R()<0.45, a=0.035+R()*0.05;
      for(const ox of [-W,0,W]) for(const oy of [-H,0,H]){
        const gr=g.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,r);
        gr.addColorStop(0,hell?`rgba(150,152,150,${a})`:`rgba(18,20,24,${a*1.3})`); gr.addColorStop(1,'rgba(0,0,0,0)');
        g.fillStyle=gr; g.fillRect(x+ox-r,y+oy-r,r*2,r*2); } }
    korn(g,W,H,false);
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8;
  const n=normalMapFrom(512,512,(g,W,H)=>{ g.fillStyle='#808080'; g.fillRect(0,0,W,H); korn(g,W,H,true); },1.6);
  if(n) n.wrapS=n.wrapT=THREE.RepeatWrapping;
  _asphN=n;
  _asphT=t; return t;
}
/* Gehwegplatten 30 x 30 cm, Kachel 2,4 m */
function gehwegTex(){
  const t=tex(512,512,(g,W,H)=>{ const R=saat(31), P=64;
    g.fillStyle='#5d5f63'; g.fillRect(0,0,W,H);
    for(let j=0;j<8;j++) for(let i=0;i<8;i++){
      const b=142+R()*24|0, w=R()<0.15?6:0;
      g.fillStyle=`rgb(${b+w},${b+1},${b+3})`; g.fillRect(i*P+1.5,j*P+1.5,P-3,P-3);
      /* leichte Schattenkante unten rechts, abgeplatzte Ecke ab und zu */
      g.fillStyle='rgba(0,0,0,.07)'; g.fillRect(i*P+1.5,j*P+P-4,P-3,2.5); g.fillRect(i*P+P-4,j*P+1.5,2.5,P-3);
      if(R()<0.18){ g.fillStyle='#6a6c70'; g.beginPath(); const cx=i*P+(R()<0.5?2:P-2), cy=j*P+(R()<0.5?2:P-2); g.arc(cx,cy,3+R()*4,0,Math.PI*2); g.fill(); }
    }
    for(let k=0;k<16000;k++){ const a=R(); g.fillStyle=R()<0.5?`rgba(0,0,0,${a*0.12})`:`rgba(255,255,255,${a*0.12})`; g.fillRect(R()*W,R()*H,1.5,1.5); }
    /* Kaugummiflecken, Salzraender, Schmutz */
    for(let k=0;k<26;k++){ g.fillStyle=`rgba(38,38,40,${0.25+R()*0.3})`; g.beginPath(); g.arc(R()*W,R()*H,1.5+R()*2.5,0,Math.PI*2); g.fill(); }
    for(let k=0;k<10;k++){ const x=R()*W,y=R()*H,r=20+R()*50, gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,R()<0.5?'rgba(235,238,240,.10)':'rgba(40,38,34,.08)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
/* Eine Reihe Steine, nahtlos ueber den Kachelrand: der letzte Stein
   schliesst genau an den ersten an, was rechts uebersteht, kommt links wieder */
function steinReihe(R,W,y,h,wmin,wmax,mal){
  const o=R()*wmin; let x=o;
  while(x<o+W-1){ let w=wmin+R()*(wmax-wmin); if(o+W-x<w+wmin*0.8) w=o+W-x;
    mal(x,y,w,h); if(x+w>W) mal(x-W,y,w,h); x+=w; }
}
/* Kleinpflaster aus Granit (Baumstreifen), Kachel 1,6 m */
function pflasterTex(){
  const t=tex(512,512,(g,W,H)=>{ const R=saat(57);
    g.fillStyle='#3f4144'; g.fillRect(0,0,W,H);
    for(let r=0;r<16;r++) steinReihe(R,W,r*32,32,26,36,(x,y,w,h)=>{
      const b=110+R()*50|0, blau=R()<0.3?8:0, warm=R()<0.25?10:0;
      g.fillStyle=`rgb(${b+warm},${b},${b+blau})`; g.fillRect(x+1.5,y+1.5,w-3,h-3);
      const gr=g.createLinearGradient(x,y,x+w,y+h); gr.addColorStop(0,'rgba(255,255,255,.12)'); gr.addColorStop(1,'rgba(0,0,0,.14)');
      g.fillStyle=gr; g.fillRect(x+1.5,y+1.5,w-3,h-3); });
    for(let k=0;k<9000;k++){ g.fillStyle=R()<0.5?'rgba(0,0,0,.15)':'rgba(255,255,255,.14)'; g.fillRect(R()*W,R()*H,1.5,1.5); }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
/* Granit: oben der Bordstein (1 m Stein, Profil abgewickelt),
   unten die Rinne aus drei Reihen Grosspflaster */
function granitTex(){
  const t=tex(512,512,(g,W,H)=>{ const R=saat(13);
    const speck=(y0,y1,n)=>{ for(let k=0;k<n;k++){ const t2=R(); g.fillStyle=t2<0.4?`rgba(25,25,28,${0.3+R()*0.4})`:t2<0.8?`rgba(235,235,232,${0.2+R()*0.4})`:`rgba(170,140,130,${0.3+R()*0.3})`; g.fillRect(R()*W,y0+R()*(y1-y0),1.5+R(),1.5+R()); } };
    g.fillStyle='#9c9d9b'; g.fillRect(0,0,W,256);
    /* Ansichtsflaeche zur Fahrbahn: Spritzwasser und Streusalz */
    const gr=g.createLinearGradient(0,0,0,70); gr.addColorStop(0,'rgba(40,42,46,.55)'); gr.addColorStop(1,'rgba(40,42,46,0)');
    g.fillStyle=gr; g.fillRect(0,0,W,70);
    g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(0,78,W,70);          // abgelaufene Oberseite
    speck(0,256,9000);
    g.fillStyle='rgba(30,30,32,.75)'; g.fillRect(0,0,2,256); g.fillRect(W-2,0,2,256);   // Stossfuge
    /* Rinne */
    g.fillStyle='#34363a'; g.fillRect(0,256,W,256);
    for(let r=0;r<3;r++) steinReihe(R,W,256+r*85,85,48,76,(x,y,w,h)=>{ const b=95+R()*45|0;
      g.fillStyle=`rgb(${b},${b},${b+4})`; g.fillRect(x+2.5,y+2.5,w-5,h-5);
      const q=g.createLinearGradient(0,y,0,y+h); q.addColorStop(0,'rgba(255,255,255,.10)'); q.addColorStop(1,'rgba(0,0,0,.18)'); g.fillStyle=q; g.fillRect(x+2.5,y+2.5,w-5,h-5); });
    speck(256,512,6000);
  });
  t.wrapS=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
/* Guss: links Schachtdeckel, rechts Rost des Strassenablaufs */
function gussTex(){
  return tex(512,256,(g,W,H)=>{ const R=saat(3);
    g.fillStyle='#2e3034'; g.fillRect(0,0,W,H);
    const cx=128, cy=128;
    g.fillStyle='#3a3c40'; g.beginPath(); g.arc(cx,cy,126,0,Math.PI*2); g.fill();
    g.strokeStyle='#1c1d20'; g.lineWidth=5; g.beginPath(); g.arc(cx,cy,112,0,Math.PI*2); g.stroke();
    /* Rautenmuster */
    g.save(); g.beginPath(); g.arc(cx,cy,104,0,Math.PI*2); g.clip();
    for(let y=-120;y<130;y+=14) for(let x=-120;x<130;x+=14){ g.fillStyle=((x+y)/14)%2?'#46484d':'#26282b'; g.fillRect(cx+x+2,cy+y+2,9,9); }
    g.restore();
    g.fillStyle='#2a2c30'; g.beginPath(); g.arc(cx,cy,34,0,Math.PI*2); g.fill();
    g.fillStyle='#9a9ca0'; g.font='bold 22px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('KANAL',cx,cy);
    for(let k=0;k<2500;k++){ g.fillStyle=R()<0.5?`rgba(120,80,50,${R()*0.18})`:`rgba(255,255,255,${R()*0.08})`; g.fillRect(R()*256,R()*256,2,2); }
    /* Rost */
    g.fillStyle='#3b3d41'; g.fillRect(262,40,244,176);
    for(let i=0;i<11;i++){ g.fillStyle='#08090a'; g.fillRect(278+i*20.5,58,12,140); }
    g.strokeStyle='#55575c'; g.lineWidth=4; g.strokeRect(264,42,240,172);
  });
}
/* Pfuetzenformen, 4 x 2 im Atlas: ueberlagerte weiche Flecken, dann
   auf eine Schwelle gezogen - Wasser hat eine klare, unregelmaessige
   Kante. Mit dem weichen Rand wirkten sie wie ein Farbschleier.
   28.09.: dazu ein nasser, dunkler Rand (zweite Schwelle, halbe Deckung,
   matt), im Wasser Kraeuselung als Normal- und Rauheitskarte. Mit
   glatter Flaeche zeigte jede Pfuetze nur EINEN Spiegelton und las
   sich als Farbfleck statt als Wasser. a: Deckung, r: Rauheit, n: Normalen,
   w: nasser Rand */
let _pfT=null;
function pfuetzenTex(){
  if(_pfT) return _pfT;
  const W=1024, H=512, f=new Float32Array(W*H), R=saat(1231);
  const a=tex(W,H,(g)=>{
    g.fillStyle='#000'; g.fillRect(0,0,W,H); g.globalCompositeOperation='lighter';
    for(let k=0;k<8;k++){ const x0=(k%4)*256, y0=Math.floor(k/4)*256;
      g.save(); g.beginPath(); g.rect(x0,y0,256,256); g.clip();
      for(let i=0;i<11;i++){ const cx=x0+60+R()*136, cy=y0+84+R()*88, r=18+R()*46;
        g.save(); g.translate(cx,cy); g.scale(1,0.5+R()*0.45);
        const gr=g.createRadialGradient(0,0,0,0,0,r); gr.addColorStop(0,'rgba(255,255,255,.6)'); gr.addColorStop(1,'rgba(255,255,255,0)');
        g.fillStyle=gr; g.fillRect(-r,-r,r*2,r*2); g.restore(); }
      g.restore(); }
    g.globalCompositeOperation='source-over';
    const d=g.getImageData(0,0,W,H), p=d.data;
    for(let i=0;i<W*H;i++){ const x=i%W, y=i/W|0, r=Math.min(x%256,255-x%256,y%256,255-y%256);
      f[i]=p[i*4+1]*clamp(r/18,0,1);
      p[i*4]=p[i*4+1]=p[i*4+2]=clamp((f[i]-120)/26,0,1)*255; }
    g.putImageData(d,0,0);
  },false);
  /* nasser Rand: weich auslaufend, eigene matte Schicht - im Pfuetzen-
     material haette die Spiegelung den dunklen Rand wieder aufgehellt */
  const w=tex(W,H,(g)=>{ g.fillStyle='#000'; g.fillRect(0,0,W,H); const d=g.getImageData(0,0,W,H), p=d.data;
    for(let i=0;i<W*H;i++){ const v=clamp((f[i]-36)/74,0,1); p[i*4]=p[i*4+1]=p[i*4+2]=v*v*(3-2*v)*255; p[i*4+3]=255; }
    g.putImageData(d,0,0); },false);
  /* Kraeuselung: ein paar schraege Wellenzuege, im Kern kraeftig */
  const hoehe=(x,y)=>Math.sin(x*0.21+y*0.07)*0.5+Math.sin(x*0.05-y*0.19+1.3)*0.6+Math.sin(x*0.37+y*0.29+2.1)*0.25+Math.sin(x*0.013+y*0.031)*1.2;
  const r=tex(W,H,(g)=>{ g.fillStyle='#000'; g.fillRect(0,0,W,H); const d=g.getImageData(0,0,W,H), p=d.data;
    for(let i=0;i<W*H;i++){ const x=i%W, y=i/W|0, kern=clamp((f[i]-120)/26,0,1), w=0.5+0.5*Math.sin(hoehe(x,y)*2.3);
      p[i*4]=p[i*4+1]=p[i*4+2]=(kern*(0.04+0.16*w)+(1-kern)*0.75)*255; p[i*4+3]=255; }
    g.putImageData(d,0,0); },false);
  const n=tex(W,H,(g)=>{ g.fillStyle='#8080ff'; g.fillRect(0,0,W,H); const d=g.getImageData(0,0,W,H), p=d.data;
    for(let i=0;i<W*H;i++){ const x=i%W, y=i/W|0, kern=clamp((f[i]-100)/40,0,1); if(!kern) continue;
      const h0=hoehe(x,y), nx=-(hoehe(x+1,y)-h0)*kern*1.4, ny=(hoehe(x,y+1)-h0)*kern*1.4, l=Math.hypot(nx,ny,1);
      p[i*4]=(nx/l*0.5+0.5)*255; p[i*4+1]=(ny/l*0.5+0.5)*255; p[i*4+2]=(1/l*0.5+0.5)*255; }
    g.putImageData(d,0,0); },false);
  return _pfT={a,r,n,w};
}
/* Graue Umgebung nur fuer die Pfuetzen: heller Himmel, dunkle
   Haeuserkante. Die bunte Autoumgebung faerbte die Pfuetzen gruen
   oder blau wie Oel (28.09.). */
let _pfEnv=null;
function pfuetzenUmgebung(){
  if(_pfEnv!==null) return _pfEnv||null;
  _pfEnv=false;
  try{
    if(!THREE.PMREMGenerator) return null;
    const R=saat(515), t=tex(512,256,(g,W,H)=>{
      const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#9ea3a9'); gr.addColorStop(0.46,'#d6d9dc'); gr.addColorStop(0.5,'#e2e4e6');
      gr.addColorStop(0.52,'#3a3b3d'); gr.addColorStop(1,'#1d1e1f'); g.fillStyle=gr; g.fillRect(0,0,W,H);
      /* Fassaden mittelhell mit dunklen Fenstern: im Kraeuseln bricht
         die Spiegelung in helle und dunkle Flecken - daran liest man Wasser */
      for(let x=0;x<W;){ const w=14+R()*34, h=6+R()*24, v=92+R()*70|0; g.fillStyle=`rgb(${v},${v},${v+3})`;
        g.fillRect(x,H*0.5-h,w,h);
        g.fillStyle='rgba(20,22,26,.75)'; for(let y=H*0.5-h+3;y<H*0.5-4;y+=6) for(let xx=x+3;xx<x+w-4;xx+=6) g.fillRect(xx,y,3,3);
        x+=w+R()*5; }
    });
    t.mapping=THREE.EquirectangularReflectionMapping;
    const pm=new THREE.PMREMGenerator(renderer);
    _pfEnv=pm.fromEquirectangular(t).texture; pm.dispose();
  }catch(e){ _pfEnv=false; }
  return _pfEnv||null;
}
/* Schneerand an der Hauswand: 4 m Kachel, oben (Wand) dicht, zur
   Strasse hin ausgefranst, mit Tauloechern */
function schneeRandTex(){
  const t=tex(512,64,(g,W,H)=>{ const R=saat(88);
    g.fillStyle='#000'; g.fillRect(0,0,W,H);
    const tief=[]; let d=0.5;
    for(let x=0;x<W;x++){ d+=(R()-0.5)*0.08; d=clamp(d,0.15,0.9); tief.push(d); }
    /* nahtlos: Enden aufeinander zu ziehen */
    for(let x=0;x<32;x++){ const k=x/32; tief[W-32+x]=tief[W-32+x]*(1-k)+tief[0]*k; }
    for(let x=0;x<W;x++){ const y0=H*(1-tief[x]);
      const gr=g.createLinearGradient(0,y0-3,0,y0+3); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(1,'rgba(255,255,255,1)');
      g.fillStyle=gr; g.fillRect(x,y0-3,1,H-y0+3); }
    g.fillStyle='#000'; for(let k=0;k<60;k++){ g.beginPath(); g.arc(R()*W,H*(0.3+R()*0.5),1+R()*2.5,0,Math.PI*2); g.fill(); }
  },false);
  t.wrapS=THREE.RepeatWrapping; return t;
}
/* Abnutzung der Markierungsfarbe (Alpha, 1,5-m-Kachel) */
function abriebTex(){
  const t=tex(256,256,(g,W,H)=>{ const R=saat(77);
    g.fillStyle='#fff'; g.fillRect(0,0,W,H);
    for(let k=0;k<320;k++){ g.fillStyle=`rgba(0,0,0,${0.5+R()*0.5})`; g.beginPath(); g.arc(R()*W,R()*H,0.6+R()*1.4,0,Math.PI*2); g.fill(); }
    for(let k=0;k<7;k++){ const x=R()*W,y=R()*H,r=10+R()*22, gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,'rgba(0,0,0,.75)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
  },false);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
/* Schildatlas 1024 x 1024: Plakate, Verkehrszeichen, Automat, Kasten */
let _atlasT=null;
function schildAtlas(){
  if(_atlasT) return _atlasT;
  _atlasT=tex(1024,1024,(g,W,H)=>{ const R=saat(21);
    g.fillStyle='#d8d4ca'; g.fillRect(0,0,W,H);
    /* Schrift passt sich der Breite an (maxW), sonst lief sie ueber den Plakatrand */
    const txt=(s,x,y,px,farbe,font,al,maxW)=>{ g.fillStyle=farbe; const f=n=>`${font||'bold'} ${n}px "Barlow Condensed", Arial, sans-serif`;
      if(maxW) px=fitFont(g,s,maxW,px,f); g.font=f(px); g.textAlign=al||'center'; g.textBaseline='middle'; g.fillText(s,x,y); };
    /* --- Litfasssaeule: Plakatwand, 1024 x 512 --- */
    const pl=[['#10254d','SILVESTER','GALA','31.12. · STADTHALLE','#f2c14e'],['#f4efe2','NEUJAHRS','KONZERT','1. Januar · 17 Uhr','#8c1c24'],
      ['#c8322a','ZIRKUS','ROMANI','bis 6. Januar','#fff3c4'],['#1f6b4a','FLOHMARKT','am Hafen','jeden Sonntag','#f5f1e6'],
      ['#f2c230','KNALLER','PREISE!','Feuerwerk ab 28.12.','#1a1a1a'],['#2c2f36','KINO','DIE NACHT','ab Donnerstag','#e8e2d0']];
    let x=0;
    for(const [bg,a,b,c,fg] of pl){ const w=W/pl.length;
      g.fillStyle=bg; g.fillRect(x,0,w,512);
      txt(a,x+w/2,120,54,fg,0,0,w-22); txt(b,x+w/2,190,46,fg,0,0,w-22); txt(c,x+w/2,300,24,fg,'600',0,w-16);
      g.fillStyle=fg; g.globalAlpha=0.35; g.fillRect(x+18,230,w-36,4); g.globalAlpha=1;
      /* Knitter und Kleisterkanten */
      for(let k=0;k<5;k++){ g.fillStyle=`rgba(255,255,255,${R()*0.06})`; g.fillRect(x+R()*w,0,2+R()*4,512); }
      g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x+w-3,0,3,512);
      x+=w; }
    g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(0,400,W,112);
    txt('Stadtwerke · Kulturamt · Plakatierung verboten',W/2,470,20,'#e8e4da','600');
    /* --- Verkehrszeichen, je 128 px, Zeile y 512 --- */
    const blau='#1d5fae';
    const rr=(x,y,w,h,r,f)=>{ g.fillStyle=f; g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.fill(); };
    /* Z 350 Fussgaengerueberweg */
    rr(0,512,128,128,12,'#fff'); rr(5,517,118,118,9,blau);
    g.fillStyle='#fff'; g.beginPath(); g.moveTo(64,530); g.lineTo(116,622); g.lineTo(12,622); g.closePath(); g.fill();
    g.fillStyle='#111'; for(let i=0;i<4;i++) g.fillRect(30+i*18,606,11,10);
    g.beginPath(); g.arc(66,561,6,0,Math.PI*2); g.fill();
    g.strokeStyle='#111'; g.lineWidth=6; g.lineCap='round'; g.beginPath(); g.moveTo(64,569); g.lineTo(60,588); g.lineTo(52,602); g.moveTo(60,588); g.lineTo(70,601);
    g.moveTo(63,574); g.lineTo(52,584); g.moveTo(63,574); g.lineTo(74,582); g.stroke();
    /* Z 314 Parken */
    rr(128,512,128,128,12,'#fff'); rr(133,517,118,118,9,blau); txt('P',192,578,104,'#fff','900');
    /* Z 224 Haltestelle */
    g.fillStyle='#1a7a3a'; g.beginPath(); g.arc(320,576,62,0,Math.PI*2); g.fill();
    g.fillStyle='#f5c800'; g.beginPath(); g.arc(320,576,54,0,Math.PI*2); g.fill(); txt('H',320,580,80,'#1a7a3a','900');
    /* Z 274.1 Tempo-30-Zone */
    rr(384,512,128,128,8,'#f6f6f2'); g.strokeStyle='#222'; g.lineWidth=2; g.strokeRect(388,516,120,120);
    g.fillStyle='#c8102e'; g.beginPath(); g.arc(448,564,38,0,Math.PI*2); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(448,564,29,0,Math.PI*2); g.fill();
    txt('30',448,566,36,'#111','900'); txt('ZONE',448,620,26,'#111','800');
    /* Zusatzzeichen */
    rr(512,512,128,62,5,'#222'); rr(514,514,124,58,4,'#fff'); txt('mit Parkschein',576,543,21,'#111','700');
    rr(512,578,128,62,5,'#222'); rr(514,580,124,58,4,'#fff'); txt('Mo–Sa 8–20 h',576,609,22,'#111','700');
    /* Haltestellenname */
    rr(640,512,256,64,6,'#1a7a3a'); txt('Marktstraße',768,545,38,'#fff','700');
    /* Leerfeld fuer Blechrueckseiten */
    g.fillStyle='#8f959c'; g.fillRect(896,512,128,128);
    /* --- City-Light-Plakat 256 x 384 (y 640) --- */
    const cg=g.createLinearGradient(0,640,0,1024); cg.addColorStop(0,'#1d3f96'); cg.addColorStop(1,'#5b2a8e'); g.fillStyle=cg; g.fillRect(0,640,256,384);
    for(let k=0;k<5;k++){ const bx=40+R()*176, by=690+R()*150, br=20+R()*34, f=['#ffd35a','#ff5a6e','#6ee7ff','#b388ff','#8dff9a'][k];
      g.strokeStyle=f; g.lineWidth=2;
      for(let a=0;a<24;a++){ const w=a/24*Math.PI*2; g.globalAlpha=0.9; g.beginPath(); g.moveTo(bx+Math.cos(w)*br*0.25,by+Math.sin(w)*br*0.25); g.lineTo(bx+Math.cos(w)*br,by+Math.sin(w)*br); g.stroke(); }
      g.globalAlpha=1; }
    txt('SILVESTER',128,900,40,'#ffd35a','900'); txt('PARTY',128,944,40,'#fff','900'); txt('31.12. · ab 21 Uhr',128,990,20,'#cfd6ff','600');
    /* --- Fahrplan 128 x 160 (x 256, y 640) --- */
    g.fillStyle='#fbfbf6'; g.fillRect(256,640,128,160); g.fillStyle='#1a7a3a'; g.fillRect(256,640,128,24); txt('Linie 42',320,652,16,'#fff','700');
    g.fillStyle='#555'; for(let k=0;k<11;k++) g.fillRect(264,672+k*11,40+R()*70,4);
    /* --- Parkscheinautomat, Front 128 x 256 (x 384, y 640) --- */
    g.fillStyle='#9aa1a8'; g.fillRect(384,640,128,256);
    rr(396,650,104,50,6,blau); txt('P',424,676,38,'#fff','900'); txt('Parkschein',470,676,14,'#fff','700');
    g.fillStyle='#1b2a22'; g.fillRect(404,712,88,38); txt('0,50 €',448,731,20,'#9fe8a8','700');
    for(let r=0;r<3;r++) for(let c=0;c<3;c++){ g.fillStyle='#e6e8ea'; g.fillRect(410+c*28,762+r*22,20,15); }
    g.fillStyle='#111'; g.fillRect(420,836,56,6); g.fillRect(430,856,36,5);
    g.fillStyle='#f2c230'; g.fillRect(396,876,104,12);
    /* --- Kabelverteiler, Tuer 256 x 256 (x 512, y 640) --- */
    g.fillStyle='#c7c4b6'; g.fillRect(512,640,256,256);
    g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=3; g.strokeRect(522,650,110,236); g.strokeRect(646,650,112,236);
    g.fillStyle='#555'; g.fillRect(622,760,6,20); g.fillRect(650,760,6,20);
    g.fillStyle='#f2c230'; g.beginPath(); g.moveTo(690,700); g.lineTo(716,746); g.lineTo(664,746); g.closePath(); g.fill(); txt('⚡',690,730,22,'#111');
    g.save(); g.translate(560,820); g.rotate(-0.12); txt('RKZ',0,0,40,'#2d4f9e','900'); g.restore();
    g.fillStyle='#e8e2d2'; g.fillRect(540,690,50,34); g.fillStyle='#c8322a'; g.fillRect(544,694,42,8);
    for(let k=0;k<3000;k++){ g.fillStyle=`rgba(60,50,40,${R()*0.08})`; g.fillRect(512+R()*256,640+R()*256,2,2); }
    const sm=g.createLinearGradient(0,840,0,896); sm.addColorStop(0,'rgba(60,55,45,0)'); sm.addColorStop(1,'rgba(60,55,45,.35)'); g.fillStyle=sm; g.fillRect(512,840,256,56);
    /* --- Sitzbank Holz 128 x 64 (x 768, y 640) --- */
    g.fillStyle='#8a5a36'; g.fillRect(768,640,256,64); for(let k=0;k<6;k++){ g.fillStyle='rgba(0,0,0,.15)'; g.fillRect(768,650+k*10,256,2); }
  });
  _atlasT.anisotropy=8; return _atlasT;
}
/* Strassenschrift "30" und "BUS" mit Alpha */
function strSchrift(){
  const t=tex(512,256,(g,W,H)=>{ g.clearRect(0,0,W,H);
    g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle';
    g.font='bold 230px "Barlow Condensed", Arial, sans-serif'; g.fillText('30',128,134);
    g.font='bold 150px "Barlow Condensed", Arial, sans-serif'; g.fillText('BUS',384,134);
    /* Abrieb */
    const R=saat(8); g.globalCompositeOperation='destination-out';
    for(let k=0;k<700;k++){ g.fillStyle=`rgba(0,0,0,${0.5+R()*0.5})`; g.beginPath(); g.arc(R()*W,R()*H,0.8+R()*2.4,0,Math.PI*2); g.fill(); }
    g.globalCompositeOperation='source-over';
  });
  return t;
}

/* ---------- Leuchte ---------- */
/* Die Teile einer Leuchte in lokalen Koordinaten; add(k,geo,matrix,farbe) */
function lampTeile(add){
  const D=0x2a2e38, MA=0x4b515c, C=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s);
  add('lack',C(0.15,0.19,0.34,14),tm(0,0.17,0),D);
  add('lack',new THREE.BoxGeometry(0.1,0.16,0.02),tm(0,0.2,0.185),0x6a7078);
  add('lack',C(0.16,0.16,0.03,14),tm(0,0.35,0),D);
  for(let i=0;i<4;i++){ const a=i/4*Math.PI*2; add('lack',new THREE.BoxGeometry(0.035,0.03,0.035),tm(Math.cos(a)*0.13,0.37,Math.sin(a)*0.13),0x7d838c); }
  add('mast',C(0.075,0.11,4.4,14),tm(0,2.57,0),MA);
  /* Bogen als kurze Segmente */
  const R=0.9, seg=7;
  for(let i=0;i<seg;i++){
    const a0=i/seg*(Math.PI/2), a1=(i+1)/seg*(Math.PI/2);
    const x0=Math.sin(a0)*R, y0=R-Math.cos(a0)*R, x1=Math.sin(a1)*R, y1=R-Math.cos(a1)*R;
    add('lack',C(0.062,0.066,Math.hypot(x1-x0,y1-y0)*1.08,10),tm(0,4.77+(y0+y1)/2,(x0+x1)/2,Math.atan2(x1-x0,y1-y0),0,0),MA);
  }
  /* Leuchtenkopf mit Wanne, Halterung und Deckel */
  const K=tm(0,5.63,0.9,0.06,0,0), k=(geo,x,y,z,c,key)=>add(key||'lack',geo,K.clone().multiply(tm(x,y,z)),c);
  k(roundedBoxGeo(0.3,0.11,0.82,0.04),0,0.06,0,0x3b414c);
  k(new THREE.BoxGeometry(0.26,0.03,0.74),0,0.005,0,0x71787f);
  k(new THREE.BoxGeometry(0.24,0.045,0.7),0,-0.02,0,0xffffff,'lampe');
  k(new THREE.BoxGeometry(0.16,0.09,0.16),0,0.06,-0.44,0x2f343e);
  k(new THREE.BoxGeometry(0.24,0.02,0.6),0,0.125,0.02,0x4d535d);
}
/* Nachtlicht der Leuchten (Tom, 26.09.: "alles drum herum deutlich
   hochwertiger"). Zuerst lagen additive Flaechen ueber dem Boden: sie
   faerbten den Asphalt sandfarben, und wo Flicken und Markierungen per
   polygonOffset nach vorn gezogen waren, fehlten sie ganz (schwarze
   Balken im Zebrastreifen). Jetzt traegt eine Lichtkarte (20 cm je
   Pixel) das Licht aller Strassenleuchten; die Bodenmaterialien lesen
   sie als lightMap ueber uv2 aus der Weltlage. Das Licht wird so mit
   der Bodenfarbe multipliziert - weisse Streifen leuchten, Asphalt
   bleibt dunkelgrau - und kostet keinen Draw-Call. Nur Leuchten
   ausserhalb der Karte (Hof) bekommen noch eine Flaeche. */
const LICHTER=[], LICHT_MATS=[];
const LK={x0:-102.4,z0:2.6,w:204.8,d:25.6,px:5};      /* 1024 x 128 Pixel */
let _lichtK=null, _strLichtM=null, _lichtFertig=false;
function lichtKarte(){
  if(_lichtK) return _lichtK;
  _lichtK=tex(1024,128,(g,W,H)=>{ g.fillStyle='#000'; g.fillRect(0,0,W,H); },false);
  _lichtK.wrapS=_lichtK.wrapT=THREE.ClampToEdgeWrapping;
  /* die Tageszeit setzt an lampMats emissiveIntensity = f*3 */
  /* 1,7 war zu zaghaft: nachts lag die Strasse gleichmaessig dunkel, die
     Lichtpfuetzen waren kaum zu sehen (26.09., Tom: "nachts ist die
     Strasse dunkel") */
  /* 3,8 war zu viel: lightMap wird noch mit PI multipliziert, auch der
     Rand der Pfuetzen lief ueber, und unser Gehweg lag nachts so hell
     und gleichmaessig wie am Tag (27.09.). Jetzt 2,6 und ein steilerer
     Abfall - zwischen den Leuchten wird es wieder dunkler. */
  lampMats.push({set emissiveIntensity(v){ const k=v/3*2.6; for(const m of LICHT_MATS) m.lightMapIntensity=k; }});
  return _lichtK;
}
const imLicht=p=>p.x>LK.x0+9&&p.x<LK.x0+LK.w-9&&p.z>LK.z0+6&&p.z<LK.z0+LK.d-6;
function lichtKarteMalen(){
  redraw(lichtKarte(),(g,W,H)=>{
    g.globalCompositeOperation='source-over'; g.fillStyle='#000'; g.fillRect(0,0,W,H);
    g.globalCompositeOperation='lighter';
    for(const p of LICHTER){ if(!imLicht(p)) continue;
      /* breit laengs der Strasse, schmaler quer; Mitte etwas zur Fahrbahn */
      /* enger als zuerst (8 m): bei 7 m Abstand flossen die Pfuetzen zu
         einer gleichmaessig grauen Flaeche zusammen */
      /* gegenueber zum Gehweg geschoben (28.09.): mitten auf der Fahrbahn
         lag die Pfuetze hinter den parkenden Autos verborgen; auf unserer
         Seite etwas naeher an den Gehweg, seit die Masten weiter stehen */
      g.save(); g.translate((p.x-LK.x0)*LK.px,(p.z+(p.s>0?0.3:0.95)-LK.z0)*LK.px); g.scale(1,0.7);
      const r=7*LK.px, gr=g.createRadialGradient(0,0,0,0,0,r);
      gr.addColorStop(0,'rgba(255,224,182,1)'); gr.addColorStop(0.1,'rgba(255,222,179,.93)'); gr.addColorStop(0.28,'rgba(255,216,170,.55)');
      gr.addColorStop(0.48,'rgba(255,211,163,.2)'); gr.addColorStop(0.72,'rgba(255,207,158,.05)'); gr.addColorStop(1,'rgba(255,205,155,0)');
      g.fillStyle=gr; g.fillRect(-r,-r,r*2,r*2); g.restore(); }
    g.globalCompositeOperation='source-over';
    /* Rand schwarz: ausserhalb liest ClampToEdge den Rand */
    g.strokeStyle='#000'; g.lineWidth=2; g.strokeRect(0,0,W,H);
  });
}
function lichtMat(m){ m.lightMap=lichtKarte(); m.lightMapIntensity=0; LICHT_MATS.push(m); return m; }
/* uv2 fuer die Lichtkarte aus der Weltlage (mx: Lage des Meshes; von
   Hand gerechnet, der Logik-Stub der Tests kennt kein applyMatrix4) */
function lichtUV2(geo,mx){
  const p=geo.attributes.position, a=new Float32Array(p.count*2), e=mx&&mx.elements;
  for(let i=0;i<p.count;i++){ let x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    if(e){ const wx=e[0]*x+e[4]*y+e[8]*z+e[12], wz=e[2]*x+e[6]*y+e[10]*z+e[14]; x=wx; z=wz; }
    a[i*2]=(x-LK.x0)/LK.w; a[i*2+1]=1-(z-LK.z0)/LK.d; }
  geo.setAttribute('uv2',new THREE.BufferAttribute(a,2)); return geo;
}
function nachtMat(m,maxOp){
  Object.defineProperty(m,'emissiveIntensity',{configurable:true,get(){ return m.opacity*3/maxOp; },set(v){ m.opacity=maxOp*v/3; m.visible=v>0.01; }});
  m.visible=false; lampMats.push(m); return m;
}
/* Lichtkegel im Schneetreiben: nur ein Hauch, zum Rand hin (Kegel von
   der Seite gesehen) ausgeblendet - mit harter Kontur standen sie wie
   Suchscheinwerfer im Nachthimmel */
function kegelMat(){
  const m=new THREE.ShaderMaterial({uniforms:{st:{value:0},fa:{value:new THREE.Color(1,0.8,0.58)}},
    vertexShader:'varying float vK,vH; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vK=abs(dot(normalize(normalMatrix*normal),normalize(-mv.xyz))); vH=uv.y; gl_Position=projectionMatrix*mv; }',
    fragmentShader:'uniform float st; uniform vec3 fa; varying float vK,vH; void main(){ gl_FragColor=vec4(fa*st*vK*vK*vK*(0.15+0.85*vH*vH),1.0); }',
    transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  Object.defineProperty(m,'emissiveIntensity',{set(v){ m.uniforms.st.value=v/3*0.07; m.visible=v>0.01; }});
  m.visible=false; lampMats.push(m); return m;
}
function lichtMats(){
  if(_strLichtM) return _strLichtM;
  const pf=tex(256,256,(g,W,H)=>{ const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2);
    gr.addColorStop(0,'rgba(255,232,196,1)'); gr.addColorStop(0.3,'rgba(255,226,186,.72)'); gr.addColorStop(0.58,'rgba(255,218,172,.3)'); gr.addColorStop(0.82,'rgba(255,210,160,.08)'); gr.addColorStop(1,'rgba(255,205,155,0)');
    g.fillStyle='#000'; g.fillRect(0,0,W,H); g.fillStyle=gr; g.fillRect(0,0,W,H); });
  _strLichtM={
    pf:nachtMat(new THREE.MeshBasicMaterial({map:pf,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}),0.45),
    ke:kegelMat()
  };
  return _strLichtM;
}
/* Kegel fuer alle, Flaeche nur fuer Leuchten ausserhalb der Lichtkarte */
function lichtBauen(L){
  if(!L.length) return;
  const M=lichtMats(), pg=[], kg=[];
  const PG=new THREE.PlaneGeometry(13,9.5), KG=new THREE.CylinderGeometry(0.18,2.3,5.5,18,1,true);
  for(const p of L){
    if(!imLicht(p)) pg.push({geo:PG,m:tm(p.x,0.03,p.z,-Math.PI/2,0,0)});
    kg.push({geo:KG,m:tm(p.x,p.y-2.78,p.z)});
  }
  if(pg.length){ const a=new THREE.Mesh(merge(pg),M.pf); a.renderOrder=3; scene.add(a); }
  const b=new THREE.Mesh(merge(kg),M.ke); b.renderOrder=4; scene.add(b);
}
/* Strassenleuchte: Sockel, konischer Mast, Ausleger, echter Leuchtenkopf.
   Einzeln gebaut kostet sie drei Draw-Calls (Mast, Rest, Wanne) statt
   gut zwanzig; mit sammeln=true landet sie ganz im Sammler. Der Mast
   bleibt einzeln ein Zylinder - daran erkennt der Baumtest die Laterne. */
function strassenlampe(x,z,dir,sammeln){
  const a=dir||0, p={x:x+Math.sin(a)*0.9, z:z+Math.cos(a)*0.9, y:5.6, s:Math.cos(a)};
  LICHTER.push(p);
  if(_lichtFertig){ lichtBauen([p]); if(imLicht(p)) lichtKarteMalen(); }
  col(x-0.22,x+0.22,z-0.22,z+0.22);
  if(sammeln){ stOrt(x,z,a); lampTeile((k,geo,m,c)=>stM(k==='mast'?'lack':k,geo,m,c)); return null; }
  const y=gehwegY(x,z), g=new THREE.Group(); g.position.set(x,y,z); g.rotation.y=a; scene.add(g);
  const T={}, M=strMats(), W=tm(x,y,z,0,a,0);
  lampTeile((k,geo,m,c)=>{
    if(k==='mast'){ const o=new THREE.Mesh(geo.applyMatrix4(m),std(c,{metalness:0.62,roughness:0.38})); if(HIQ) o.castShadow=true; g.add(o); }
    else (T[k]=T[k]||[]).push({geo,m,color:c}); });
  for(const k in T){ const o=new THREE.Mesh(lichtUV2(merge(T[k]),W),M[k]); if(HIQ&&k==='lack') o.castShadow=true; g.add(o); }
  return g;
}

/* ---------- Fahrbahn ---------- */
const uvWelt=(x,z)=>[0.5+x/200,0.5-z/200];      /* wie die grosse Bodenflaeche */
/* Hoehe des Bordsteins: 1 = Hochbord, 0 = abgesenkt (Zufahrt, Ueberweg) */
function bordHoch(x,abs){ let k=1; for(const [a,b] of abs){ if(x>a-1&&x<b+1) k=Math.min(k,x<a?a-x:x>b?x-b:0); } return k; }
/* Profil quer zur Kante: Ansicht, Fase, 15 cm Oberseite, dann steil
   hinunter auf den Gehweg. Die Rueckseite lief erst 25 cm flach aus -
   von oben sah der Bord wie ein 45 cm breites helles Band aus. Auch
   10 cm Schraege lagen noch als dunkle Fuge im Eigenschatten zwischen
   Pflaster und Bord (27.09., Tom: "alles drum herum deutlich schoener"):
   jetzt faellt der Ruecken auf 2 cm, das Pflaster laeuft bis heran. */
const BORD_B=0.2;
function bordProfil(k){ const h=0.02+0.1*k;
  return [[0,0],[0,h-0.02],[0.025,h+0.01],[0.175,h+0.008],[0.19,h+0.002],[BORD_B,h]]; }
/* Bordstein von x0 bis x1, Fahrbahnkante bei zR, Gehweg in Richtung s */
function bordstein(B,x0,x1,zR,s,abs){
  /* Die Richtung je Profilabschnitt ist seine Aussennormale. Vorher
     galt fuer alle [0,1,-s] - der Ruecken zum Gehweg wurde dadurch zur
     Fahrbahn gewendet und stand von der Strasse aus als dunkle Fuge
     zwischen Pflaster und Bord (27.09.). */
  const R=saat(Math.round(zR*10));
  const xs=[x0]; for(let x=Math.floor(x0)+1;x<x1;x++) xs.push(x); xs.push(x1);
  for(let i=0;i<xs.length-1;i++){
    const xa=xs[i], xb=xs[i+1], pa=bordProfil(bordHoch(xa,abs)), pb=bordProfil(bordHoch(xb,abs));
    const f=0.82+R()*0.14, c=[f,f,f*0.99], ua=xa, ub=xb;
    let L=0;
    for(let j=0;j<pa.length-1;j++){
      const l=Math.hypot(pa[j+1][0]-pa[j][0],pa[j+1][1]-pa[j][1]), v0=1-L/0.6*0.5, v1=1-(L+l)/0.6*0.5; L+=l;
      B.quad(ecke(xa,pa[j][1],zR+s*pa[j][0],ua,v0,c),ecke(xb,pb[j][1],zR+s*pb[j][0],ub,v0,c),
             ecke(xb,pb[j+1][1],zR+s*pb[j+1][0],ub,v1,c),ecke(xa,pa[j+1][1],zR+s*pa[j+1][0],ua,v1,c),
             [0,pa[j+1][0]-pa[j][0],-s*(pa[j+1][1]-pa[j][1])]);
    }
    /* Rinne: drei Reihen Grosspflaster vor dem Bord */
    const g=0.9+R()*0.12, cr=[g*0.92,g*0.92,g*0.95];
    B.quad(ecke(xa,0.005,zR,ua,0.5,cr),ecke(xb,0.005,zR,ub,0.5,cr),ecke(xb,0.005,zR-s*0.3,ub,0.02,cr),ecke(xa,0.005,zR-s*0.3,ua,0.02,cr));
  }
  /* Stirnseiten */
  for(const [x,sx] of [[x0,-1],[x1,1]]){ const p=bordProfil(bordHoch(x,abs));
    for(let j=1;j<p.length-1;j++) B.tri(ecke(x,p[0][1],zR,0,0.6),ecke(x,p[j][1],zR+s*p[j][0],0.2,0.7),ecke(x,p[j+1][1],zR+s*p[j+1][0],0.3,0.8),[sx,0,0]);
    B.tri(ecke(x,0,zR,0,0.6),ecke(x,p[p.length-1][1],zR+s*p[p.length-1][0],0.3,0.8),ecke(x,0,zR+s*BORD_B,0.1,0.9),[sx,0,0]); }
}
/* Flaeche in Weltkoordinaten (Gehweg, Pflaster): UV nach Kachelgroesse */
function bodenRechteck(B,x0,x1,z0,z1,y,kachel,c){
  const e=(x,z)=>ecke(x,y,z,x/kachel,-z/kachel,c);
  B.quad(e(x0,z0),e(x1,z0),e(x1,z1),e(x0,z1));
}
/* Gehwegflaeche auf gwH(): in x je Meter (Bordabsenkungen), in z an den
   Knicken der Querneigung geteilt; Stirnseite, wo sie hoch endet */
function gehwegFlaeche(B,x0,x1,z0,z1,kachel,nord){
  const zs=[z0]; for(const k of [7.5,22.4]) if(k>z0&&k<z1) zs.push(k); zs.push(z1);
  const xs=[x0]; for(let x=Math.floor(x0)+1;x<x1;x++) xs.push(x); xs.push(x1);
  const e=(x,z,y)=>ecke(x,y===undefined?gwH(x,z,nord):y,z,x/kachel,-z/kachel);
  for(let i=0;i<xs.length-1;i++) for(let j=0;j<zs.length-1;j++)
    B.quad(e(xs[i],zs[j]),e(xs[i+1],zs[j]),e(xs[i+1],zs[j+1]),e(xs[i],zs[j+1]));
  for(const [x,sx] of [[x0,-1],[x1,1]]) for(let j=0;j<zs.length-1;j++){
    if(gwH(x,zs[j],nord)<0.03&&gwH(x,zs[j+1],nord)<0.03) continue;
    B.quad(e(x,zs[j],0),e(x,zs[j+1],0),e(x,zs[j+1]),e(x,zs[j]),[sx,0,0]); }
}
function buildFahrbahn(){
  const X=STR.X, zN=STR.zN, zS=STR.zS, Z=STR.zebra, R=saat(2612);
  const asph=asphaltTex();
  /* --- Deckschicht: Flickstellen, vergossene Fugen, nasse Rinne.
     Dieselbe Textur in denselben Weltkoordinaten wie der Boden, nur
     ueber die Eckfarben abgedunkelt: das Korn laeuft ungebrochen durch. */
  const D=bauer(), uv=(x,z)=>uvWelt(x,z);
  const flaeche=(x0,x1,z0,z1,y,c0,c1,quer)=>{ const e=(x,z,c)=>{ const [u,v]=uv(x,z); return ecke(x,y,z,u,v,c); };
    if(quer) D.quad(e(x0,z0,c0),e(x1,z0,c0),e(x1,z1,c1),e(x0,z1,c1)); else D.quad(e(x0,z0,c0),e(x1,z0,c1),e(x1,z1,c1),e(x0,z1,c0)); };
  /* feuchte Rinne und Streusalzschleier an beiden Borden */
  flaeche(-X,X,zN+0.3,zN+0.95,0.004,grau(0.62),grau(1),true);
  flaeche(-X,X,zS-0.3,zS-0.95,0.004,grau(0.62),grau(1),true);
  /* Flickstellen: Aufgrabungen quer ueber eine Spur und kleine Flicken */
  const flicken=[];
  for(let x=-X+6;x<X-6;x+=9+R()*16){
    if(Math.abs(x-Z)<5) continue;
    const quer=R()<0.4, w=quer?0.8+R()*0.5:0.9+R()*1.4, z0=quer?(R()<0.5?zN+1.0:STR.mitte+0.15):zN+1.1+R()*(zS-zN-3.2), d=quer?1.8+R()*0.9:0.7+R()*1.2;
    const z1=Math.min(z0+d,zS-1.05), f=0.84+R()*0.1, c=[f*0.97,f*0.98,f], n=0.03;
    flicken.push([x-n,x+w+n]);
    flaeche(x,x+w,z0,z1,0.004,c,c,true);
    const fu=grau(0.5);
    flaeche(x-n,x+w+n,z0-n,z0,0.004,fu,fu,true); flaeche(x-n,x+w+n,z1,z1+n,0.004,fu,fu,true);
    flaeche(x-n,x,z0,z1,0.004,fu,fu,true); flaeche(x+w,x+w+n,z0,z1,0.004,fu,fu,true);
  }
  const frei=x=>!flicken.some(([a,b])=>x>a-0.3&&x<b+0.3);
  /* Laengsfuge der Einbaubahnen neben der Leitlinie */
  { let pts=[]; const zf=STR.mitte+0.3;
    for(let x=-X;x<=X;x+=0.8){ if(!frei(x)||Math.abs(x-Z)<2){ if(pts.length>1) streifen(D,pts,0.05,0.0055,grau(0.45),uv); pts=[]; continue; }
      pts.push([x,zf+Math.sin(x*0.37)*0.03+(R()-0.5)*0.02]); }
    if(pts.length>1) streifen(D,pts,0.05,0.0055,grau(0.45),uv); }
  /* Fahrspuren: wo die Reifen rollen, ist die Decke dunkler und glatter */
  for(const zc of [zN+1.35,STR.mitte+0.95]){ let a=null;
    for(let x=-X;x<=X;x+=0.5){ const ok=frei(x)&&frei(x+0.5)&&Math.abs(x-Z)>2;
      if(ok&&a===null) a=x; if((!ok||x+0.5>X)&&a!==null){ if(x>a){ flaeche(a,x,zc-0.35,zc,0.004,grau(1),grau(0.86),true); flaeche(a,x,zc,zc+0.35,0.004,grau(0.86),grau(1),true); } a=null; } } }
  /* Querrisse, mit Bitumen vergossen */
  for(let x=-X+4;x<X-4;x+=6+R()*11){
    if(!frei(x)||Math.abs(x-Z)<3) continue;
    const pts=[]; let z=zN+0.35+R()*0.4, xx=x; const bis=R()<0.5?STR.mitte+R()*0.6:zS-0.4-R()*0.8;
    while(z<bis){ pts.push([xx,z]); xx+=(R()-0.5)*0.22; z+=0.3+R()*0.25; }
    if(pts.length>1) streifen(D,pts,0.035+R()*0.025,0.0055,grau(0.3),uv);
  }
  /* Kein polygonOffset auf den Bodenschichten: bei flachem Blick zog er
     sie um Dezimeter nach vorn - vor Reifen, Bordkanten und Licht. Die
     Millimeter Hoehe reichen bei near 0,2 m bis weit hinten. */
  const dm=lichtMat(new THREE.MeshStandardMaterial({map:asph,normalMap:_asphN,vertexColors:true,roughness:0.8}));
  if(dm.normalMap) dm.normalScale=new THREE.Vector2(0.7,0.7);
  const dk=new THREE.Mesh(lichtUV2(D.geo()),dm); if(HIQ) dk.receiveShadow=true; scene.add(dk);
  /* --- Pfuetzen (Tom, 26.09.: nasse Silvesterstimmung): Schmelzwasser
     in der Rinne und in den Fahrspuren. Sie spiegeln den Himmel wie der
     Autolack; nachts dunkeln sie mit ihm ab. Nicht unter den parkenden
     Autos - dort spiegelte sonst der helle Himmel. */
  { const Pf=bauer(), pf=(cx,cz,l,b,k)=>{ const u0=(k%4)/4, v0=Math.floor(k/4)/2, e=(x,z,u,v)=>ecke(cx+x,0.0065,cz+z,u0+u/4,v0+v/2);
      Pf.quad(e(-l/2,-b/2,0,0),e(l/2,-b/2,1,0),e(l/2,b/2,1,1),e(-l/2,b/2,0,1)); };
    for(let x=-X+3;x<X-3;x+=5+R()*11){
      if(Math.abs(x-Z)<3.5) continue;
      const gegen=R()<0.5&&(x<-26||x>22);
      pf(x,gegen?zS-0.4-R()*0.15:zN+0.4+R()*0.15,1.0+R()*1.8,0.45+R()*0.35,R()*8|0);
      if(R()<0.2&&frei(x+3)) pf(x+3+R()*2,R()<0.5?zN+1.35:STR.mitte+0.95,0.8+R()*1.0,0.35+R()*0.25,R()*8|0); }
    const env=pfuetzenUmgebung(), pt=pfuetzenTex();
    const pm=lichtMat(new THREE.MeshStandardMaterial({color:LIN(0x121314),roughness:1,roughnessMap:pt.r,normalMap:pt.n,metalness:0.1,envMap:env||null,envMapIntensity:3.2,
      alphaMap:pt.a,transparent:true,depthWrite:false}));
    if(pm.normalMap) pm.normalScale=new THREE.Vector2(0.45,0.45);
    /* 0,5 war zu wenig: bei Tag lagen die Pfuetzen als dunkle, gruenliche
       Flecken wie Oel auf der Decke statt den Himmel zu spiegeln. Der
       echte Himmel ist vielfach heller als der Asphalt - das holt die
       Staerke nach (27.09.). */
    lampMats.push({set emissiveIntensity(v){ pm.envMapIntensity=3.2*(1-0.3*v); }});
    const pg=lichtUV2(Pf.geo());
    const nr=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:0x000000,alphaMap:pt.w,transparent:true,opacity:0.55,depthWrite:false}));
    nr.renderOrder=1; scene.add(nr);
    const po=new THREE.Mesh(pg,pm); po.renderOrder=2; if(HIQ) po.receiveShadow=true; scene.add(po); }

  /* --- Markierungen nach StVO: Leitlinie 3 m Strich, 6 m Luecke, 12 cm
     breit; Parkstreifen mit T-Marken zwischen den Buchten; Zebrastreifen;
     Zickzack an der Haltestelle. Abrieb per Alpha-Maske. */
  const Mk=bauer(), uvM=(x,z)=>[x/1.5,z/1.5], mk=(x0,x1,z0,z1)=>{ const e=(x,z)=>ecke(x,0.009,z,x/1.5,z/1.5); Mk.quad(e(x0,z0),e(x1,z0),e(x1,z1),e(x0,z1)); };
  for(let x=-X+2;x<X-3;x+=9) if(x+3<Z-2.5||x>Z+2.5) mk(x,x+3,STR.mitte-0.06,STR.mitte+0.06);
  const P0=-25.3, P1=20.9;
  mk(P0,P1,STR.park-0.06,STR.park+0.06);
  for(let x=P0;x<=P1+0.01;x+=6.6) mk(x-0.06,x+0.06,STR.park,STR.park+0.6);
  /* Zebrastreifen: Balken in Fahrtrichtung, 50 cm breit, 50 cm Abstand */
  for(let z=zN+0.35;z+0.5<zS-0.3;z+=1.0) mk(Z-1.5,Z+1.5,z,z+0.5);
  /* Grenzmarkierung (Z 299) an der Bushaltestelle */
  { const a=-45, b=-30, n=10, pts=[[a,STR.park+0.2]];
    for(let i=1;i<n;i++) pts.push([a+(b-a)*i/n,i%2?zS-0.45:STR.park+0.2]);
    pts.push([b,STR.park+0.2]); streifen(Mk,pts,0.12,0.009,grau(1),uvM); }
  const ab=abriebTex();
  const mm=lichtMat(new THREE.MeshStandardMaterial({color:LIN(0xe9e7df),roughness:0.62,alphaMap:ab,alphaTest:0.5}));
  const mkm=new THREE.Mesh(lichtUV2(Mk.geo()),mm); if(HIQ) mkm.receiveShadow=true; scene.add(mkm);
  /* Schrift "30" (je Spur, in Fahrtrichtung lesbar) und "BUS" */
  { const Sb=bauer(), sch=(cx,cz,ux,uz,w,h,u0,u1)=>{ const rx=-uz, rz=ux, e=(a,b,u,v)=>ecke(cx+ux*b+rx*a,0.01,cz+uz*b+rz*a,u,v);
      Sb.quad(e(-w/2,-h/2,u0,0),e(w/2,-h/2,u1,0),e(w/2,h/2,u1,1),e(-w/2,h/2,u0,1)); };
    sch(-60,(zN+STR.mitte)/2,-1,0,1.3,2.6,0,0.5); sch(60,(STR.mitte+STR.park)/2,1,0,1.3,2.6,0,0.5);
    sch(-37.5,(STR.park+zS)/2+0.05,1,0,1.3,2.2,0.5,1);
    const sm=new THREE.Mesh(lichtUV2(Sb.geo()),lichtMat(new THREE.MeshStandardMaterial({color:LIN(0xe9e7df),map:strSchrift(),alphaTest:0.5,roughness:0.62}))); if(HIQ) sm.receiveShadow=true; scene.add(sm); }

  /* --- Schachtdeckel in der Fahrbahn, Strassenablaeufe in der Rinne --- */
  { const G=[], sd=new THREE.CircleGeometry(0.31,28), ro=new THREE.PlaneGeometry(0.34,0.52);
    sd.attributes.uv.array.forEach((v,i,a)=>{ if(i%2===0) a[i]=v*0.5; });
    ro.attributes.uv.array.forEach((v,i,a)=>{ if(i%2===0) a[i]=0.5+v*0.5; });
    for(let x=-88;x<90;x+=21+R()*6){ if(Math.abs(x-Z)<3) continue; G.push({geo:sd,m:tm(x,0.008,R()<0.5?12.1:14.0,-Math.PI/2,0,0)}); }
    for(let x=-90;x<90;x+=18+R()*5){ if(Math.abs(x-Z)<3) continue;
      if(x<37) G.push({geo:ro,m:tm(x,0.0085,zN+0.17,-Math.PI/2,0,Math.PI/2)}); G.push({geo:ro,m:tm(x+7,0.0085,zS-0.17,-Math.PI/2,0,Math.PI/2)}); }
    const gm=new THREE.Mesh(lichtUV2(merge(G)),lichtMat(new THREE.MeshStandardMaterial({map:gussTex(),metalness:0.55,roughness:0.5}))); if(HIQ) gm.receiveShadow=true; scene.add(gm); }

  /* --- Bordsteine, Rinnen, Gehwege --- */
  const Bs=bauer(), Z0=Z-1.6, Z1=Z+1.6;
  /* unsere Seite: an der Hofzufahrt (x -30..-20) und am Ueberweg abgesenkt */
  bordstein(Bs,-X,38,zN,-1,BORD_ABS_N);
  bordstein(Bs,-X,X,zS,1,BORD_ABS_S);
  const gt=granitTex(), bm=new THREE.Mesh(lichtUV2(Bs.geo()),lichtMat(new THREE.MeshStandardMaterial({map:gt,vertexColors:true,roughness:0.78})));
  if(HIQ){ bm.receiveShadow=true; bm.castShadow=true; } scene.add(bm);
  /* Gehwegplatten, zur Bordseite ein Streifen Kleinpflaster (Baum- und
     Laternenstreifen). Unsere Seite laesst die Hofzufahrt frei - dort
     liegt der Beton der Zufahrt. */
  const Gp=bauer(), Kp=bauer(), zNg=zN-BORD_B, zSg=zS+BORD_B;
  for(const [a,b] of [[-X,-30.2],[-19.8,38]]){
    gehwegFlaeche(Gp,a,b,6.0,9.7,2.4,true); gehwegFlaeche(Kp,a,b,9.7,zNg,1.6,true); }
  gehwegFlaeche(Kp,-X,X,zSg,18.3,1.6,false); gehwegFlaeche(Gp,-X,X,18.3,23.4,2.4,false);
  const gm2=lichtMat(new THREE.MeshStandardMaterial({map:gehwegTex(),vertexColors:true,roughness:0.86}));
  const km=lichtMat(new THREE.MeshStandardMaterial({map:pflasterTex(),vertexColors:true,roughness:0.84}));
  for(const [B,m] of [[Gp,gm2],[Kp,km]]){ const o=new THREE.Mesh(lichtUV2(B.geo()),m); if(HIQ) o.receiveShadow=true; scene.add(o); }
  /* Liegengebliebener Schnee an den Hauswaenden gegenueber: dort wird
     nicht gelaufen und nicht geraeumt. Ausgefranster Rand ueber Alpha. */
  { const Sr=bauer(), e=(x,z,u,v)=>ecke(x,0.015,z,u,v);
    for(let x=-44;x<44;x+=4) Sr.quad(e(x,22.5,x/4,0),e(x+4,22.5,x/4+1,0),e(x+4,23.1,x/4+1,1),e(x,23.1,x/4,1));
    const sr=lichtMat(new THREE.MeshStandardMaterial({color:LIN(0xe6ebf2),roughness:0.95,alphaMap:schneeRandTex(),transparent:true,depthWrite:false}));
    const o=new THREE.Mesh(lichtUV2(Sr.geo()),sr); o.renderOrder=1; if(HIQ) o.receiveShadow=true; scene.add(o); }
}

/* ---------- Stadtmoebel (alles in den Sammler) ---------- */
function stPoller(x,z){ stOrt(x,z,0);
  mT('lack',new THREE.CylinderGeometry(0.075,0.075,0.02,14),0,0.01,0,0,0,0,0x33373e);
  mT('lack',new THREE.CylinderGeometry(0.05,0.05,0.86,14),0,0.44,0,0,0,0,0x3a3f47);
  mT('lack',new THREE.SphereGeometry(0.05,14,6,0,Math.PI*2,0,Math.PI/2),0,0.87,0,0,0,0,0x3a3f47);
  mT('matt',new THREE.CylinderGeometry(0.052,0.052,0.07,14,1,true),0,0.74,0,0,0,0,0xf2f2ee);
}
function stSchild(x,z,ry,felder,h){   /* felder: [[x0,y0,x1,y1,breite,hoehe,rund]] von oben nach unten */
  stOrt(x,z,ry); h=h||2.35;
  mT('lack',new THREE.CylinderGeometry(0.032,0.032,h,10),0,h/2,0,0,0,0,0x9aa0a6);
  mT('lack',new THREE.CylinderGeometry(0.036,0.036,0.03,10),0,h+0.015,0,0,0,0,0x7d838c);
  let y=h-0.02;
  for(const [x0,y0,x1,y1,w,hh,rund] of felder){
    y-=hh/2;
    const rueck=rund?new THREE.CylinderGeometry(w/2,w/2,0.015,28):new THREE.BoxGeometry(w,hh,0.015);
    mT('lack',rueck,0,y,0.045,rund?Math.PI/2:0,0,0,0x8f959c);
    const vorn=rund?new THREE.CircleGeometry(w/2,28):new THREE.PlaneGeometry(w,hh);
    mT('schild',atlasUV(vorn,x0,y0,x1,y1),0,y,0.054,0,0,0);
    mT('lack',new THREE.BoxGeometry(0.1,0.035,0.05),0,y+hh*0.3,0.025,0,0,0,0x7d838c);
    mT('lack',new THREE.BoxGeometry(0.1,0.035,0.05),0,y-hh*0.3,0.025,0,0,0,0x7d838c);
    y-=hh/2+0.03;
  }
}
function stFahrradbuegel(x,z){ stOrt(x,z,0);
  for(const s of [-1,1]) mT('lack',new THREE.CylinderGeometry(0.024,0.024,0.62,10),0,0.31,s*0.35,0,0,0,0x5a6068);
  mT('lack',new THREE.TorusGeometry(0.35,0.024,8,16,Math.PI),0,0.62,0,0,Math.PI/2,0,0x5a6068);
}
/* neig: Schraeglage zum Buegel hin (28.09.) - senkrecht und ohne
   Stuetze standen die Raeder wie abgestellte Requisiten */
function stFahrrad(x,z,ry,lack,neig){ stOrt(x,z,ry); _stM.multiply(tm(0,0,0,0,0,neig||0));
  const lk=Math.sign(neig||0)*0.3, lx=Math.cos(lk)*0.24, lz=Math.sin(lk)*0.24;
  const Rr=0.33, F=[0,Rr,0.53], B=[0,Rr,-0.5], T=[0,0.3,0], S=[0,0.84,-0.14], H=[0,0.88,0.36], Hu=[0,0.7,0.41];
  for(const w of [F,B]){
    mT('matt',new THREE.TorusGeometry(Rr,0.02,6,28),w[0],w[1],w[2],0,Math.PI/2,0,0x17181b);
    mT('lack',new THREE.TorusGeometry(Rr-0.03,0.008,4,24),w[0],w[1],w[2],0,Math.PI/2,0,0xb8bcc2);
    mT('lack',new THREE.CylinderGeometry(0.022,0.022,0.1,8),w[0],w[1],w[2],0,0,Math.PI/2,0x9aa0a6);
    for(let i=0;i<6;i++){ const a=i/6*Math.PI; stRohr('lack',[0,w[1]+Math.cos(a)*(Rr-0.03),w[2]+Math.sin(a)*(Rr-0.03)],[0,w[1]-Math.cos(a)*(Rr-0.03),w[2]-Math.sin(a)*(Rr-0.03)],0.003,0xc8ccd2,3); }
  }
  for(const [a,b] of [[T,S],[S,Hu],[T,Hu],[T,B],[S,B],[Hu,F],[Hu,H]]) stRohr('lack',a,b,0.018,lack,8);
  /* Lenker leicht eingeschlagen */
  stRohr('lack',[lx,H[1]+0.04,H[2]-0.06-lz],[-lx,H[1]+0.04,H[2]-0.06+lz],0.012,0x2b2e33,6);
  for(const s of [-1,1]) stRohr('matt',[s*lx*0.83,H[1]+0.04,H[2]-0.06-s*lz*0.83],[s*lx*1.12,H[1]+0.04,H[2]-0.06-s*lz*1.12],0.018,0x17181b,6);
  stRohr('lack',[0,S[1],S[2]],[0,S[1]+0.08,S[2]-0.02],0.013,0x9aa0a6,6);
  mT('matt',new THREE.BoxGeometry(0.13,0.05,0.25),0,S[1]+0.1,S[2]-0.02,0,0,0,0x1b1c1f);
  mT('matt',new THREE.BoxGeometry(0.16,0.012,0.14),0,S[1]+0.13,S[2]-0.02,0,0,0,0xeef1f5);  // Schnee auf dem Sattel
  mT('lack',new THREE.CylinderGeometry(0.07,0.07,0.02,14),0.04,T[1],T[2],0,0,Math.PI/2,0x6b7078);
  stRohr('lack',[0.06,T[1],T[2]],[0.06,T[1]-0.14,T[2]+0.06],0.012,0x6b7078,6);
  mT('matt',new THREE.BoxGeometry(0.1,0.025,0.05),0.1,T[1]-0.15,T[2]+0.06,0,0,0,0x202225);
  /* Schutzbleche und Gepaecktraeger */
  mT('lack',new THREE.TorusGeometry(Rr+0.04,0.03,3,14,Math.PI*0.55),0,B[1],B[2],0,Math.PI/2,Math.PI*0.3,lack);
  stRohr('lack',[0,0.74,-0.2],[0,0.74,-0.72],0.01,0x2b2e33,5); stRohr('lack',[0,0.74,-0.72],[0,Rr,-0.5],0.01,0x2b2e33,5);
}
function stHydrant(x,z){ stOrt(x,z,0.4); const rot=0xb3261e;
  mT('lack',new THREE.CylinderGeometry(0.16,0.17,0.06,16),0,0.03,0,0,0,0,rot);
  mT('lack',new THREE.CylinderGeometry(0.105,0.115,0.6,16),0,0.36,0,0,0,0,rot);
  mT('lack',new THREE.CylinderGeometry(0.135,0.135,0.05,16),0,0.12,0,0,0,0,rot);
  mT('lack',new THREE.CylinderGeometry(0.13,0.12,0.06,16),0,0.69,0,0,0,0,rot);
  mT('lack',new THREE.SphereGeometry(0.12,16,8,0,Math.PI*2,0,Math.PI/2),0,0.72,0,0,0,0,rot);
  mT('lack',new THREE.CylinderGeometry(0.03,0.035,0.06,5),0,0.85,0,0,0,0,0x9aa0a6);
  for(const s of [-1,1]){ mT('lack',new THREE.CylinderGeometry(0.045,0.045,0.12,12),s*0.15,0.5,0,0,0,Math.PI/2,rot);
    mT('lack',new THREE.CylinderGeometry(0.052,0.052,0.035,12),s*0.22,0.5,0,0,0,Math.PI/2,0xa8adb3); }
  mT('lack',new THREE.CylinderGeometry(0.06,0.06,0.1,12),0,0.44,0.14,Math.PI/2,0,0,rot);
  mT('lack',new THREE.CylinderGeometry(0.068,0.068,0.035,12),0,0.44,0.2,Math.PI/2,0,0,0xa8adb3);
  mT('matt',new THREE.CylinderGeometry(0.08,0.12,0.03,14),0,0.815,0,0,0,0,0xeef1f5);
}
function stAutomat(x,z,ry){ stOrt(x,z,ry);
  mT('lack',new THREE.BoxGeometry(0.46,0.05,0.36),0,0.025,0,0,0,0,0x3a3f47);
  mT('lack',new THREE.BoxGeometry(0.4,1.42,0.3),0,0.76,0,0,0,0,0x8e959c);
  mT('schild',atlasUV(new THREE.PlaneGeometry(0.36,0.72),384,640,512,896),0,1.02,0.152,0,0,0);
  mT('lack',new THREE.BoxGeometry(0.44,0.06,0.34),0,1.5,0,0,0,0,0x6b7178);
  mT('lack',new THREE.BoxGeometry(0.4,0.02,0.3),0,1.56,-0.02,-0.35,0,0,0x1c2c52);   // Solarmodul
  mT('matt',new THREE.BoxGeometry(0.42,0.03,0.3),0,1.595,-0.03,-0.35,0,0,0xeef1f5);
}
/* Briefkasten: gelber Kasten mit runder Haube auf dem Pfosten, ohne
   Firmenzeichen. Einwurf zum Gehweg. */
function stBriefkasten(x,z,ry){ stOrt(x,z,ry); const gelb=0xf0bf12;
  mT('lack',new THREE.CylinderGeometry(0.035,0.042,0.88,10),0,0.44,0,0,0,0,0x4a5058);
  mT('lack',new THREE.BoxGeometry(0.42,0.53,0.3),0,1.135,0,0,0,0,gelb);
  mT('lack',new THREE.CylinderGeometry(0.21,0.21,0.3,16,1,false,-Math.PI/2,Math.PI),0,1.4,0,-Math.PI/2,0,0,gelb);
  mT('lack',new THREE.BoxGeometry(0.25,0.03,0.02),0,1.3,0.152,0,0,0,0x1b1c1e);
  mT('matt',new THREE.BoxGeometry(0.15,0.1,0.006),0,1.04,0.152,0,0,0,0xf2f1ea);
  mT('matt',new THREE.CylinderGeometry(0.218,0.218,0.31,12,1,false,-Math.PI/4,Math.PI/2),0,1.4,0,-Math.PI/2,0,0,0xeef1f5);
}
function stKasten(x,z,ry){ stOrt(x,z,ry);
  mT('matt',new THREE.BoxGeometry(0.98,0.12,0.36),0,0.06,0,0,0,0,0x6c6e70);
  mT('matt',new THREE.BoxGeometry(0.94,1.1,0.32),0,0.67,0,0,0,0,0xc4c1b3);
  mT('schild',atlasUV(new THREE.PlaneGeometry(0.92,1.08),512,640,768,896),0,0.67,0.162,0,0,0);
  mT('matt',new THREE.BoxGeometry(1.0,0.05,0.4),0,1.245,0,0,0,0,0xb4b1a4);
  mT('matt',new THREE.BoxGeometry(0.96,0.035,0.36),0,1.285,0,0,0,0,0xeef1f5);
}
function stLitfass(x,z){ stOrt(x,z,0); const gruen=0x2f4a3a;
  mT('lack',new THREE.CylinderGeometry(0.68,0.7,0.32,32),0,0.16,0,0,0,0,gruen);
  mT('lack',new THREE.CylinderGeometry(0.64,0.68,0.06,32),0,0.35,0,0,0,0,gruen);
  mT('schild',atlasUV(new THREE.CylinderGeometry(0.6,0.6,2.3,40,1,true),0,0,1024,512),0,1.53,0,0,0,0);
  mT('lack',new THREE.CylinderGeometry(0.7,0.62,0.14,32),0,2.75,0,0,0,0,gruen);
  mT('lack',new THREE.CylinderGeometry(0.66,0.66,0.08,32),0,2.86,0,0,0,0,gruen);
  mT('lack',new THREE.CylinderGeometry(0.2,0.62,0.5,32),0,3.15,0,0,0,0,gruen);
  mT('matt',new THREE.CylinderGeometry(0.28,0.64,0.2,32),0,3.02,0,0,0,0,0xe8ecf2);         // Schnee auf der Haube
  mT('lack',new THREE.SphereGeometry(0.12,14,8),0,3.44,0,0,0,0,gruen);
  mT('lack',new THREE.CylinderGeometry(0.03,0.03,0.2,8),0,3.6,0,0,0,0,gruen);
}
function stHaltestelle(x,z){ stOrt(x,z,0);
  const W2=1.9, T=1.5, H=2.35, an=0x3a3f47;
  for(const sx of [-1,1]) for(const sz of [-1,1]) mT('lack',new THREE.BoxGeometry(0.07,H,0.07),sx*W2,H/2,sz*T/2,0,0,0,an);
  mT('lack',new THREE.BoxGeometry(W2*2+0.4,0.1,T+0.35),0,H+0.05,0.05,0,0,0,an);
  mT('matt',new THREE.BoxGeometry(W2*2+0.34,0.05,T+0.28),0,H+0.125,0.05,0,0,0,0xeef1f5);   // Schnee auf dem Dach
  mT('schild',atlasUV(new THREE.PlaneGeometry(1.6,0.4),640,512,896,576),0,H+0.05,-(T+0.35)/2+0.05-0.002,0,Math.PI,0);
  /* Glas: Rueckwand und Seiten */
  mT('glas',new THREE.PlaneGeometry(W2*2-0.07,H-0.2),0,H/2+0.05,T/2,0,0,0);
  mT('glas',new THREE.PlaneGeometry(T-0.07,H-0.2),-W2,H/2+0.05,0,0,Math.PI/2,0);
  for(const y of [0.08,H-0.05]){ mT('lack',new THREE.BoxGeometry(W2*2,0.05,0.05),0,y,T/2,0,0,0,an); mT('lack',new THREE.BoxGeometry(0.05,0.05,T),-W2,y,0,0,0,0,an); }
  /* Werbevitrine an der Ostseite: nachts beleuchtet */
  mT('lack',new THREE.BoxGeometry(0.14,2.0,1.36),W2,1.12,0,0,0,0,an);
  for(const s of [-1,1]) mT('leucht',atlasUV(new THREE.PlaneGeometry(1.18,1.77),0,640,256,1024),W2+s*0.071,1.12,0,0,s*Math.PI/2,0);
  /* Bank: Stahlgestell, Holzlatten */
  for(const s of [-1,1]) mT('lack',new THREE.BoxGeometry(0.05,0.45,0.4),s*0.8,0.225,T/2-0.3,0,0,0,an);
  mT('schild',atlasUV(new THREE.BoxGeometry(1.8,0.05,0.4),768,640,1024,704),0,0.47,T/2-0.3,0,0,0);
  mT('schild',atlasUV(new THREE.BoxGeometry(1.8,0.3,0.04),768,640,1024,704),0,0.72,T/2-0.08,-0.12,0,0);
  /* Fahrplan in der Rueckwand */
  mT('schild',atlasUV(new THREE.PlaneGeometry(0.45,0.56),256,640,384,800),1.2,1.45,T/2-0.02,0,Math.PI,0);
}
/* Schneehaufen (Tom, 26.09.: Silvesterstimmung): zusammengeschobener
   Altschnee in der Rinne, gebuckelt, oben weiss, unten grau vom
   Spritzwasser und mit Splitt gesprenkelt, weich schattiert. Vorher
   waren es facettierte, gleichmaessig weisse Klumpen. Die Beulen haengen
   nur an der Ausgangslage der Ecken - doppelte Ecken bleiben dicht. */
/* 28.09.: in Endmassen gebaut und erst dann weich schattiert - vorher
   wurde eine Kugel auf 20-40 cm plattgedrueckt, die Beulen standen als
   Facetten wie zerknuelltes Papier. Zur Fahrbahn (Seite s) grau vom
   Spritzwasser, zum Bord hin an dessen Ansicht angeschoben statt
   ueber die Kante zu haengen. */
function schneeGeo(x,l,h,d,s){
  const g=new THREE.SphereGeometry(1,HIQ?26:18,HIQ?14:10).toNonIndexed(), p=g.attributes.position, n=p.count, c=new Float32Array(n*3), ph=x*1.7;
  for(let i=0;i<n;i++){ const px=p.getX(i),py=p.getY(i),pz=p.getZ(i);
    const k=1+0.14*Math.sin(px*4.3+pz*3.1+ph)+0.08*Math.sin(py*5.9+px*5.3+ph*2)+0.04*Math.sin(pz*9+px*7+py*3);
    const y=Math.max(py>0?Math.pow(py,0.8):py,-0.12);
    let zz=pz*k*d; if(-s*zz>0.27) zz=-s*0.27;
    p.setXYZ(i,px*k*l,y*k*h,zz);
    const t=clamp((y+0.12)*1.2,0,1), sp=0.93+0.07*Math.sin(px*37+pz*29+py*17), dreck=clamp(pz*s*1.3,0,1)*(1-0.6*t);
    const f=(0.2+0.44*t)*sp*(1-0.38*dreck);
    c[i*3]=f*(1.02-0.05*t+0.04*dreck); c[i*3+1]=f*0.99; c[i*3+2]=f*(0.94+0.09*t-0.04*dreck); }
  g.setAttribute('color',new THREE.BufferAttribute(c,3));
  glatteNormalen(g,88); return g;
}
/* Nach den Autos gebaut: in den Parkbuchten liegen die Haufen nur in
   den Luecken zwischen den tatsaechlich stehenden Wagen */
function buildSchneehaufen(){
  const Z=STR.zebra, zS=STR.zS, R=saat(404), H=[];
  const haufen=(x,z,l,h)=>{ const s=z<STR.mitte?1:-1, g=schneeGeo(x,l/2,h,0.3,s); g.applyMatrix4(tm(x,-0.02,z,0,Math.sin(x*7)*0.03,0)); H.push(g); };
  for(let x=-95;x<95;x+=3+R()*9){
    if(Math.abs(x-Z)<3.5||(x>-47&&x<-28)||(x>-26&&x<22)) continue;
    if(R()<(COARSE?0.35:0.7)) haufen(x,zS-0.3,0.9+R()*1.4,0.3+R()*0.16); }
  /* Autos: Laenge aus den Huellquadern der Teile, sie stehen laengs x */
  const autos=[];
  for(const o of scene.children) if(o.isGroup&&o.children[0]&&o.children[0].material===_lackM){ let h=0;
    for(const m of o.children){ m.geometry.computeBoundingBox(); const b=m.geometry.boundingBox; h=Math.max(h,b.max.x-b.min.x,b.max.z-b.min.z); }
    autos.push({min:{x:o.position.x-h/2},max:{x:o.position.x+h/2}}); }
  autos.sort((a,b)=>a.min.x-b.min.x);
  let x0=-25.3;
  for(const b of autos.concat([{min:{x:21.5},max:{x:99}}])){
    const w=b.min.x-x0-0.5;
    if(w>0.6&&R()<0.85) haufen((x0+b.min.x)/2,zS-0.3,Math.min(w,1.5),0.26+R()*0.12);
    x0=b.max.x; }
  /* auf unserer Seite nur fern vom Laden (Laufwege der Kunden) */
  for(let x=-95;x<-34;x+=4+R()*9) if(R()<(COARSE?0.3:0.6)) haufen(x,STR.zN+0.3,0.8+R()*1.2,0.28+R()*0.14);
  for(let x=42;x<95;x+=4+R()*9) if(R()<(COARSE?0.3:0.6)) haufen(x,STR.zN+0.3,0.8+R()*1.2,0.28+R()*0.14);
  if(!H.length) return;
  let n=0; for(const g of H) n+=g.attributes.position.count;
  const P=new Float32Array(n*3), N=new Float32Array(n*3), C=new Float32Array(n*3); let o=0;
  for(const g of H){ P.set(g.attributes.position.array,o*3); N.set(g.attributes.normal.array,o*3); C.set(g.attributes.color.array,o*3); o+=g.attributes.position.count; g.dispose(); }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(P,3)); geo.setAttribute('normal',new THREE.BufferAttribute(N,3)); geo.setAttribute('color',new THREE.BufferAttribute(C,3));
  geo.computeBoundingSphere();
  const m=new THREE.Mesh(lichtUV2(geo),lichtMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.9})));
  if(HIQ){ m.castShadow=true; m.receiveShadow=true; } scene.add(m);
}
function buildStadtmoebel(){
  const zS=STR.zS, zG=zS+0.45, Z=STR.zebra;
  /* Laternen gegenueber: dasselbe Modell wie unsere, Ausleger zur Fahrbahn */
  /* Auf dem Handy nur die naeheren - die fernen verschwinden ohnehin im Dunst */
  for(const x of [-84.5,-71.5,-58.5,-45.5,-32.5,-19.5,-6.5,6.5,19.5,Z+2.6,48.5,61.5,74.5,87.5])
    if(!COARSE||Math.abs(x)<50) strassenlampe(x,zS+0.5,Math.PI,true);
  /* Fahrradbuegel mit zwei Raedern, genau gegenueber vom Laden in der
     Luecke zwischen zwei Parkbuchten - sonst verdecken sie die Autos */
  for(const x of [0.2,1.1,2.0]) stFahrradbuegel(x,zG+0.55);
  stFahrrad(0.35,zG+0.62,0.03,0x1f4a8a,0.12); stFahrrad(1.85,zG+0.6,-0.04,0x7a1d24,-0.11);
  stAutomat(-3.6,zS+0.5,Math.PI);
  stHydrant(10.6,zS+0.55);
  stBriefkasten(-10.4,zS+0.62,0);
  stKasten(14.6,22.55,Math.PI);
  stLitfass(-26.2,20.2);
  stHaltestelle(-37.5,21.3);
  /* Schilder: Parken mit Parkschein, Haltestelle, Ueberweg, Tempo-30-Zone.
     Sie stehen quer zur Fahrbahn und zeigen dem Verkehr entgegen, leicht
     zur Fahrbahn gedreht - Rechtsverkehr: gegenueber faehrt man nach +x.
     Vorher zeigten alle zum Gehweg, fuer Autofahrer unsichtbar. */
  const GEG=-Math.PI/2-0.26;
  const PARK=[[128,512,256,640,0.42,0.42],[512,512,640,574,0.42,0.2],[512,578,640,640,0.42,0.2]];
  stSchild(-25.9,zG,GEG,PARK); stSchild(21.4,zG,GEG,PARK);
  stSchild(-41.3,zG,GEG,[[256,512,384,640,0.45,0.45,true],[640,512,896,576,0.6,0.15]],2.6);
  /* Fahrplan am Haltestellenmast zeigt zu den Wartenden */
  stOrt(-41.3,zG,0);
  mT('lack',new THREE.BoxGeometry(0.5,0.62,0.06),0,1.45,0.066,0,0,0,0x3a3f47);
  mT('schild',atlasUV(new THREE.PlaneGeometry(0.45,0.56),256,640,384,800),0,1.45,0.098,0,0,0);
  /* Z 350 beidseitig, quer zur Fahrbahn */
  stSchild(Z-1.95,zG,-Math.PI/2,[[0,512,128,640,0.6,0.6]]); mT('schild',atlasUV(new THREE.PlaneGeometry(0.6,0.6),0,512,128,640),0,2.03,0.036,0,Math.PI,0);
  stSchild(Z+2.0,STR.zN-0.35,Math.PI/2,[[0,512,128,640,0.6,0.6]]); mT('schild',atlasUV(new THREE.PlaneGeometry(0.6,0.6),0,512,128,640),0,2.03,0.036,0,Math.PI,0);
  col(Z+1.95,Z+2.05,STR.zN-0.4,STR.zN-0.3);
  stSchild(-52,zG,GEG,[[384,512,512,640,0.6,0.6]]);
  for(const x of [Z-1.35,Z+1.35]) stPoller(x,zG);
  /* Blindenleitstreifen (Rippenplatten) an beiden Seiten des Ueberwegs */
  for(const [z0,z1] of [[STR.zN-1.0,STR.zN-0.45],[zS+0.45,zS+1.0]]){ stOrt(0,0,0);
    for(let x=Z-1.5;x<Z+1.49;x+=0.3) mT('matt',new THREE.BoxGeometry(0.28,0.012,z1-z0),x+0.15,0.024,(z0+z1)/2,0,0,0,0xaeaca4); }
  stFertig();
}
/* Baumscheibe aus Guss, 1,2 x 1,2 m im Pflasterstreifen (28.09.): der
   Torus-Ring von 1,5 m Durchmesser ragte durch den Bord 11 cm auf die
   Fahrbahn. Liegt 8 mm ueber dem geneigten Gehweg, Stamm bei z 10,4. */
const BS={z0:9.7,z1:10.9,zb:10.4};
function baumscheibe(B,bx){
  const x0=bx-0.6, x1=bx+0.6, e=(x,z,d)=>ecke(x,gwH(x,z,true)+(d===undefined?0.008:d),z,(x-x0)/1.2,(z-BS.z0)/1.2);
  B.quad(e(x0,BS.z0),e(x1,BS.z0),e(x1,BS.z1),e(x0,BS.z1));
  for(const [a,b,n] of [[[x0,BS.z0],[x1,BS.z0],[0,0,-1]],[[x1,BS.z1],[x0,BS.z1],[0,0,1]],[[x0,BS.z1],[x0,BS.z0],[-1,0,0]],[[x1,BS.z0],[x1,BS.z1],[1,0,0]]])
    B.quad(e(a[0],a[1],0),e(b[0],b[1],0),e(b[0],b[1]),e(a[0],a[1]),n);
}
function baumscheibeTex(){
  return tex(256,256,(g,W,H)=>{ const R=saat(71), cx=W/2, cy=H*(1-(BS.zb-BS.z0)/1.2);
    g.fillStyle='#3a3c40'; g.fillRect(0,0,W,H);
    /* Rahmen, dann Ringe mit Schlitzen zwischen radialen Stegen */
    g.strokeStyle='#26282b'; g.lineWidth=6; g.strokeRect(5,5,W-10,H-10);
    g.lineWidth=5; g.strokeStyle='#0b0c0d';
    for(let r=38;r<Math.hypot(W,H)/2;r+=13){ const n=Math.max(8,Math.round(r/7));
      for(let i=0;i<n;i++){ const a0=i/n*Math.PI*2+0.08, a1=(i+1)/n*Math.PI*2-0.08; g.beginPath(); g.arc(cx,cy,r,a0,a1); g.stroke(); } }
    /* Rahmen deckt die Schlitze am Rand ab */
    g.fillStyle='#34363a'; g.fillRect(0,0,W,12); g.fillRect(0,H-12,W,12); g.fillRect(0,0,12,H); g.fillRect(W-12,0,12,H);
    g.strokeStyle='#1e2023'; g.lineWidth=2; g.strokeRect(12,12,W-24,H-24);
    /* Pflanzloch: Erde mit Laub und etwas Schnee */
    g.fillStyle='#1b1712'; g.beginPath(); g.arc(cx,cy,30,0,Math.PI*2); g.fill();
    for(let i=0;i<160;i++){ const a=R()*Math.PI*2, r=R()*29; g.fillStyle=R()<0.3?'rgba(220,226,232,.8)':`rgba(${60+R()*40|0},${44+R()*25|0},${26+R()*15|0},.8)`; g.fillRect(cx+Math.cos(a)*r,cy+Math.sin(a)*r,2+R()*3,2+R()*2); }
    /* Rost und Streusalz */
    for(let i=0;i<500;i++){ g.fillStyle=R()<0.5?`rgba(120,70,40,${R()*0.18})`:`rgba(230,232,235,${R()*0.12})`; g.fillRect(R()*W,R()*H,2+R()*4,2+R()*4); }
  });
}
function buildStreet(){
  /* Fahrbahn, Borde, Gehwege und Moeblierung: siehe Strassenraum oben */
  buildFahrbahn();
  buildStadtmoebel();
  /* Haeuserzeile gegenueber: geschlossener Blockrand statt einzelner
     Kloetze mit Luecken (Tom, 26.09.). Gruenderzeit- und Nachkriegs-
     haeuser gemischt, fast jedes mit Laden; jeder Laden kommt nur
     einmal vor. */
  HZ={}; HZS=[]; HZA=[];
  scene.updateMatrixWorld();
  /* Fester Seed fuer die ganze Zeile samt zweiter Reihe: vorher stand
     nach jedem Neuladen eine andere Strasse da (Art-Director, 26.09.,
     Toms Wunsch nach einer vertrauten, hochwertigen Stadt). rand()/pick()
     laufen ueber Math.random mit, danach wird es zurueckgesetzt. */
  const _zufall=Math.random; let _seed=1234;
  Math.random=()=>{ _seed=(_seed+0x6D2B79F5)|0; let t=Math.imul(_seed^(_seed>>>15),1|_seed); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; };
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
  Math.random=_zufall;
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
  const Bsch=bauer();
  for(const bx of (COARSE?[-16.5,13]:[-16.5,-7.5,13])){ const b=makeBaum(); b.position.set(bx,0,10.4); b.scale.setScalar(rand(0.9,1.2)); scene.add(b);
    baumscheibe(Bsch,bx);
    col(bx-0.42,bx+0.42,9.98,10.82); b.userData.baum=true; }
  { const o=new THREE.Mesh(lichtUV2(Bsch.geo()),lichtMat(new THREE.MeshStandardMaterial({map:baumscheibeTex(),metalness:0.45,roughness:0.62})));
    if(HIQ) o.receiveShadow=true; scene.add(o); }
  /* Hier stand noch ein Kasten als Platzhalter-Muelleimer neben der
     Laterne - die echten Muelleimer stehen am Laden. Weg damit. */
  /* Lichtpfuetzen aller bis hierher gebauten Leuchten in einem Rutsch;
     spaeter gebaute (Hof) bekommen ihre eigenen */
  buildSchneehaufen();
  lichtBauen(LICHTER); lichtKarteMalen(); _lichtFertig=true;
}
