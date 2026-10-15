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
function eingangsAchse(go,a,b,zf,ST){
  const cx=(a+b)/2;
  EING2.x=Math.round(cx*100)/100;
  /* Festverglaste Seitenfelder links und rechts der Tuer (wie die Schaufenster: nur schmale Leisten oben und unten) und die
     Pfosten zwischen Seitenfeld und Tuer - die Tuer laeuft innen, die Seitenfelder brauchen hier ihren Rahmen (02.10.) */
  bk.fenster({art:'schaufenster',z:zf-0.1,parent:go,felder:[[a,cx-1.34],[cx+1.34,b]].filter(([fa,fb])=>fb-fa>=0.12).map(([fa,fb])=>({x0:fa,x1:fb,y0:0,y1:ST,sprosse:false})),
    pfosten:[{x:cx-1.31,h:ST},{x:cx+1.31,h:ST}]});

  /* --- Zustand „noch nicht gekauft“: ganz normales Schaufenster ---
     Kein Hinweisschild, kein Bauzaun: der Laden soll schick
     aussehen und nicht wie eine Baustelle. Dass hier eine Tuer
     hinkommen kann, steht im Laptop. --- */
  const zu=new THREE.Group(); go.add(zu); zWand('eingang2',zu);
  bk.fenster({art:'schaufenster',z:zf-0.1,parent:zu,felder:[{x0:cx-1.36,x1:cx+1.36,y0:0,y1:ST}]});

  /* --- Zustand „gekauft“: Tuer, Vordach, Matte --- */
  const auf=new THREE.Group(); go.add(auf); zAdd('eingang2',auf);
  /* Antrieb so breit, dass die Fluegel offen noch darunter haengen */
  const d=buildSchiebetuer(cx,5.3);
  scene.remove(d.g); auf.add(d.g);
  EING2.tuer=d;
  const stahl=MAT.get('zaunPfosten');   /* Zugstangen Stahl dunkel (Einheit 15.10., vorher freies Material) */
  /* Vordach ueber dem Eingang, wie am Haupthaus */
  const vd=bbox(3.4,0.08,1.5,MAT.get('lackAnthrazit'),cx,TUER.y+0.62,zf+0.85,auf,false);
  vd.rotation.x=0.05;
  /* Zwei Zugstangen von der Wand ueber dem Dach hinab zur Vorderkante.
     Vorher hingen sie unter dem Dach und endeten unten frei in der Luft. */
  for(const s of [-1,1]) strebeZ(zf+0.02,TUER.y+1.3,zf+1.45,TUER.y+0.67,cx+s*1.5,stahl,auf);
  /* Schmutzfangmatte innen und aussen */
  const matte=MAT.get('anthrazitMatt');
  bbox(2.4,0.014,1.1,matte,cx,0.02,zf-0.72,auf,false);
  bbox(2.4,0.014,1.0,matte,cx,0.02,zf+0.68,auf,false);
  /* „Eingang 2“ ueber der Tuer */
  bbox(2.3,0.46,0.06,MAT.get('schildBlau'),cx,TUER.y+0.42,zf+0.05,auf,false);
  bk.schild(auf,{text:'EINGANG 2',b:2.2,h:0.4,x:cx,y:TUER.y+0.42,z:zf+0.09,leucht:true});
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
