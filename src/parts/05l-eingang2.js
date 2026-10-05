/* =========================================================
   Zweiter Eingang.

   Das Eckhaus hat eine Achse, die bis zum Boden offen ist.
   Solange der Eingang nicht gekauft ist, steht dort eine feste
   Scheibe mit einem Hinweis; danach sitzt darin dieselbe
   Schiebetuer wie am Haupteingang, mit Vordach und Fussmatte.
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
  /* Pfosten zwischen Seitenfeld und Tuer: die Tuer laeuft innen, die
     Seitenfelder brauchen hier ihren Rahmen (02.10.) */
  for(const s of [-1,1]) bbox(0.06,ST,0.12,prof,cx+s*1.31,ST/2,zf-0.1,go,false);

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
  /* Antrieb so breit, dass die Fluegel offen noch darunter haengen */
  const d=buildSchiebetuer(cx,5.3);
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

/* Die SB-Kassenzeile, die hier hinter der Tuer stand (sb2G, Ausbau
   kasse3), ist seit 05.10. abgeschafft (Tom: "die Selbstbezahlerkassen am
   zweiten Eingang machen keinen Sinn - die muessen weg"). Bezahlt wird an
   der Kasse vorn und an den SB-Kassen der Erweiterung. */
function setEingang2(an){
  if(typeof navDirty==='function') navDirty();
}
/* Wie viele SB-Terminals stehen dem Kunden gerade offen? */
function sbNutzbar(i){
  const l=sbLanes[i]; if(!l) return false;
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
