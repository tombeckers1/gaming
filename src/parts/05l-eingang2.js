/* =========================================================
   Zweiter Eingang mit eigener Kasse.

   Das Eckhaus hat eine Achse, die bis zum Boden offen ist.
   Solange der Eingang nicht gekauft ist, steht dort eine feste
   Scheibe mit einem Hinweis; danach sitzt darin dieselbe
   Schiebetuer wie am Haupteingang, mit Vordach, Fussmatte und
   einer eigenen SB-Kassenzeile dahinter.
   ========================================================= */
const EING2={x:null, tuer:null};
/* Die Eingangsachse im Schaufenstergrundriss. Wird aus 05e heraus
   gerufen, wenn der Laden die Achse besitzt. */
function eingangsAchse(go,a,b,zf,ST,glas,prof){
  const cx=(a+b)/2;
  EING2.x=Math.round(cx*100)/100;
  /* Festverglaste Seitenfelder links und rechts der Tuer */
  for(const [fa,fb] of [[a,cx-1.34],[cx+1.34,b]]){
    const bw=fb-fa; if(bw<0.12) continue;
    const bxc=(fa+fb)/2;
    /* wie die Schaufenster: nur schmale Leisten oben und unten */
    bbox(bw,ST,0.03,glas,bxc,ST/2,zf-0.1,go,false);
    bbox(bw,0.06,0.12,prof,bxc,ST-0.03,zf-0.1,go,false);
    bbox(bw,0.06,0.12,prof,bxc,0.03,zf-0.1,go,false);
  }
  /* Sturzfeld ueber der Tuer bis zum Schaufenstersturz */
  bbox(2.72,ST-TUER.y-0.3,0.06,prof,cx,(ST+TUER.y+0.3)/2,zf-0.1,go,false);

  /* --- Zustand „noch nicht gekauft“: ganz normales Schaufenster ---
     Kein Hinweisschild, kein Bauzaun: der Laden soll schick
     aussehen und nicht wie eine Baustelle. Dass hier eine Tuer
     hinkommen kann, steht im Laptop. --- */
  const zu=new THREE.Group(); go.add(zu); zWand('eingang2',zu);
  bbox(2.68,ST,0.03,glas,cx,ST/2,zf-0.1,zu,false);
  bbox(2.72,0.06,0.12,prof,cx,ST-0.03,zf-0.1,zu,false);
  bbox(2.72,0.06,0.12,prof,cx,0.03,zf-0.1,zu,false);
  bbox(0.06,ST,0.1,prof,cx,ST/2,zf-0.1,zu,false);

  /* --- Zustand „gekauft“: Tuer, Vordach, Matte --- */
  const auf=new THREE.Group(); go.add(auf); zAdd('eingang2',auf);
  const d=buildSchiebetuer(cx,4.0);
  scene.remove(d.g); auf.add(d.g);
  EING2.tuer=d;
  const stahl=std(0x4a4f5a,{metalness:0.5,roughness:0.45});
  /* Vordach ueber dem Eingang, wie am Haupthaus */
  const vd=bbox(3.4,0.08,1.5,std(0x2f343d,{metalness:0.4,roughness:0.6}),cx,TUER.y+0.62,zf+0.85,auf,false);
  vd.rotation.x=0.05;
  /* Zwei Zugstangen von der Wand ueber dem Dach hinab zur Vorderkante.
     Vorher hingen sie unter dem Dach und endeten unten frei in der Luft. */
  for(const s of [-1,1]) strebeZ(zf+0.02,TUER.y+1.3,zf+1.45,TUER.y+0.67,cx+s*1.5,stahl,auf);
  /* Schmutzfangmatte innen und aussen */
  const matte=std(0x232830,{roughness:0.98});
  bbox(2.4,0.014,1.1,matte,cx,0.02,zf-0.72,auf,false);
  bbox(2.4,0.014,1.0,matte,cx,0.02,zf+0.68,auf,false);
  /* „Eingang 2“ ueber der Tuer */
  const sch=tex(512,110,(g2,W,H)=>{
    g2.fillStyle='#1b2340'; g2.fillRect(0,0,W,H);
    g2.fillStyle='#ffd23f'; g2.font=BUN(56); g2.textAlign='center'; g2.textBaseline='middle';
    g2.fillText('EINGANG 2',W/2,H/2+3);
  });
  bbox(2.3,0.46,0.06,std(0x1b2340,{roughness:0.7}),cx,TUER.y+0.42,zf+0.05,auf,false);
  plane(2.2,0.4,new THREE.MeshBasicMaterial({map:sch,toneMapped:false}),cx,TUER.y+0.42,zf+0.09,0,auf);
}

/* --------------------------------------------------------
   SB-Kassenzeile am zweiten Eingang
   -------------------------------------------------------- */
let sb2G=null, sb2Mov=null;
function buildSBKasse2(){
  if(sb2G||EING2.x===null) return sb2G;
  sb2G=new THREE.Group(); sb2G.position.set(EING2.x,0,3.5); scene.add(sb2G);
  const w=std(0x1b2340,{roughness:0.7});
  bbox(3.6,0.34,0.12,w,0,2.35,-0.6,sb2G,false);
  const schild=tex(1024,140,(g,W,H)=>{
    g.fillStyle='#1b2340'; g.fillRect(0,0,W,H);
    g.fillStyle='#ffd23f'; g.font=BUN(60); g.textAlign='center'; g.textBaseline='middle';
    g.fillText('KASSE EINGANG 2',W/2,H/2+4);
    g.strokeStyle='#2f3a5e'; g.lineWidth=6; g.strokeRect(3,3,W-6,H-6);
  });
  /* Das Schild gehoert auf die Kundenseite der Rueckwand, also
     nach +z - von hinten liest es ohnehin niemand. */
  plane(3.4,0.3,new THREE.MeshBasicMaterial({map:schild,toneMapped:false}),0,2.35,-0.53,0,sb2G);
  for(const sx of [-1.6,1.6]) bbox(0.07,2.2,0.07,std(0x8d939d,{metalness:0.6,roughness:0.4}),sx,1.15,-0.6,sb2G,false);
  /* Die beiden Terminals gehoeren zur Gruppe und wandern beim
     Verschieben mit; sbPos() fragt spaeter die Weltposition ab. */
  for(const x of [-0.9,0.9]){
    const l=sbTerminal(sb2G,x,0.0); l.up='eingang2'; sbLanes.push(l);
  }
  /* Die Kollision der ganzen Zeile setzt addMovable selbst und
     zieht sie beim Verschieben nach. */
  sb2Mov=addMovable({kind:'sb2',name:'Kasse Eingang 2',g:sb2G,fw:3.8,fd:1.7,ref:null});
  return sb2G;
}
function setEingang2(an){
  if(an){ buildSBKasse2(); if(sb2G) sb2G.visible=true; if(sb2Mov) applyFootprint(sb2Mov); }
  else if(sb2G){ sb2G.visible=false; if(sb2Mov&&sb2Mov.col){ dropCol(sb2Mov.col); sb2Mov.col=null; } }
  sbLanes.forEach(l=>{ if(l.up==='eingang2'){ l.busy=null; sbLampe(l,true); } });
  if(typeof navDirty==='function') navDirty();
}
/* Wie viele SB-Terminals stehen dem Kunden gerade offen? */
function sbNutzbar(i){
  const l=sbLanes[i]; if(!l) return false;
  if(l.up) return !!(S&&S.up&&S.up[l.up]);
  return !!(S&&S.up&&S.up.kasse2);
}
/* Die Eingaenge, die Kunden benutzen duerfen */
function eingaenge(){
  const a=[0];
  if(S&&S.up&&S.up.eingang2&&EING2.x!==null) a.push(EING2.x);
  return a;
}
function naechsterEingang(x){
  const a=eingaenge(); let best=a[0], bd=1e9;
  for(const e of a){ const d=Math.abs(e-x); if(d<bd){ bd=d; best=e; } }
  return best;
}
