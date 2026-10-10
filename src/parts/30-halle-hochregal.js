/* =========================================================
   Grosse Halle: Hochregal (Reserve) mit 3 Gassen, Regalbediengeraete,
   I/O-Plaetze am Ostende, Einlagerung aus der Produktion am Westende,
   Anbruchplatz.
   Je Gasse 2 Reihen x 6 Felder x 3 Paletten x 5 Ebenen = 180 Plaetze.
   ========================================================= */
/* Europalette, vereinfacht (fuer Hunderte Instanzen): 0,8 m in x, 1,2 m in z */
let _hvPalGeo=null, _hvPalGeoR=null;
/* Regalpalette: sichtbar ist nur die Stirn - Deck, drei Klotzreihen, Bodenbretter (7 Kaesten) */
function hvPalGeoRegal(){
  if(_hvPalGeoR) return _hvPalGeoR;
  const B=[], b=(w,h,d,x,y,z,c)=>B.push({geo:hvGeoBox(),m:tm(x,y,z,0,0,0,w,h,d),color:c});
  for(const dx of [-0.33,0,0.33]){ b(0.1,0.022,1.2,dx,0.011,0,0xc49a62); b(0.1,0.078,1.18,dx,0.061,0,0xa9814e); }
  b(0.8,0.044,1.2,0,PAL_H-0.022,0,0xcfa66d);
  _hvPalGeoR=merge(B); return _hvPalGeoR;
}
function hvPalGeo(){
  if(_hvPalGeo) return _hvPalGeo;
  const B=[], H1=0xc49a62, H2=0xa9814e, H3=0xcfa66d, q=hvQ();
  const b=(w,h,d,x,y,z,c)=>B.push({geo:hvGeoBox(),m:tm(x,y,z,0,0,0,w,h,d),color:c});
  for(const dx of [-0.33,0,0.33]) b(0.1,0.022,1.2,dx,0.011,0,H1);
  for(const dx of [-0.33,0,0.33]) for(const dz of [-0.55,0,0.55]) b(0.1,0.078,0.14,dx,0.061,dz,H2);
  if(q.fein) for(const dz of [-0.55,0,0.55]) b(0.8,0.022,0.14,0,0.111,dz,H1);
  if(q.fein) for(const dx of [-0.34,-0.17,0,0.17,0.34]) b(dx===0||Math.abs(dx)>0.3?0.14:0.1,0.022,1.2,dx,PAL_H-0.011,0,dx===0?H1:H3);
  else b(0.8,0.044,1.2,0,PAL_H-0.022,0,H3);
  _hvPalGeo=merge(B); return _hvPalGeo;
}
/* Ladung einer Palette: Kartons mit Atlas-UVs, 0,8 x 1,2 m Grundflaeche, ab y=0.
   Varianten unterscheiden Kartongroesse und Hoehe. */
const HV_LADUNG=[{nx:2,nz:3,ny:3,h:0.42},{nx:2,nz:2,ny:2,h:0.56},{nx:3,nz:4,ny:4,h:0.3},{nx:2,nz:3,ny:2,h:0.46}];
const _hvLadGeo={};
function hvLadungGeo(v){
  const q=hvQ(), key=v+(q.karton?'k':'b');
  if(_hvLadGeo[key]) return _hvLadGeo[key];
  const L=HV_LADUNG[v], R=hvRng(101+v*13), parts=[];
  if(!q.karton){ const g=new THREE.BoxGeometry(0.78,L.ny*L.h,1.18); g.translate(0,L.ny*L.h/2,0); _hvLadGeo[key]=g; return g; }
  /* nur die Aussenflaechen der Ladung: jeder Karton zeigt seine Seiten, die
     nach aussen gehen - innen liegende Flaechen sieht niemand (spart ~70 %) */
  const w=0.8/L.nx, d=1.2/L.nz, n=HV_ATLAS_N, e=0.012;
  const flaeche=(cx,cy,cz,fw,fh,ry,rx,zelle)=>{ const g=new THREE.PlaneGeometry(fw,fh), uv=g.attributes.uv;
    const u0=(zelle%n)/n, v0=1-(Math.floor(zelle/n)+1)/n;
    for(let i=0;i<uv.count;i++) uv.setXY(i,u0+e+uv.getX(i)*(1/n-2*e),v0+e+uv.getY(i)*(1/n-2*e));
    parts.push({geo:g,m:tm(cx,cy,cz,rx||0,ry||0,0),color:0xffffff}); };
  for(let iy=0;iy<L.ny;iy++) for(let ix=0;ix<L.nx;ix++) for(let iz=0;iz<L.nz;iz++){
    const zl=Math.floor(R()*n*n), x=-0.4+w*(ix+0.5), y=L.h*(iy+0.5), z=-0.6+d*(iz+0.5);
    if(ix===0) flaeche(-0.4,y,z,d-0.01,L.h-0.01,-Math.PI/2,0,zl);
    if(ix===L.nx-1) flaeche(0.4,y,z,d-0.01,L.h-0.01,Math.PI/2,0,zl);
    if(iz===0) flaeche(x,y,-0.6,w-0.01,L.h-0.01,Math.PI,0,zl);
    if(iz===L.nz-1) flaeche(x,y,0.6,w-0.01,L.h-0.01,0,0,zl);
    if(iy===L.ny-1) flaeche(x,L.h*L.ny,z,w-0.01,d-0.01,0,-Math.PI/2,zl);
  }
  const out=merge(parts); parts.forEach(p=>p.geo.dispose());
  _hvLadGeo[key]=out; return out;
}
function hvLadungHoehe(v){ const L=HV_LADUNG[v]; return L.ny*L.h; }
/* Paletten mit Ladung als Instanzen: liste [{x,y,z,v,ry}] */
function hvPalettenInst(G,liste,mitFolie,keinSchatten){
  if(!liste.length) return;
  const q=hvQ();
  const hi=hvInst(keinSchatten?hvPalGeoRegal():hvPalGeo(),HVM.holz,liste.map(p=>tm(p.x,p.y,p.z,0,p.ry||0,0)),G); if(hi&&keinSchatten) hi.castShadow=false;
  for(let v=0;v<HV_LADUNG.length;v++){
    const L=liste.filter(p=>p.v===v); if(!L.length) continue;
    const mats=L.map(p=>tm(p.x,p.y+PAL_H,p.z,0,p.ry||0,0));
    const im=q.karton?hvInst(hvLadungGeo(v),HVM.karton,mats,G):hvInst(hvLadungGeo(v),HVM.kartonB||(HVM.kartonB=hvRes(std(0xbf9150,{roughness:0.9}))),mats,G);
    if(im&&keinSchatten) im.castShadow=false;
    if(mitFolie&&HVM.folie){ const h=hvLadungHoehe(v);
      hvInst(hvGeoBox(),HVM.folie,L.map(p=>tm(p.x,p.y+PAL_H+h/2,p.z,0,p.ry||0,0,0.83,h+0.03,1.23)),G,null,false); }
  }
}

function hvHochregalGasse(k){
  const G=hvBereich('hochregal'), S=hvSammler(), R=HV7.hr, gs=HV7.gassen[k], E=R.ebenen, Ht=R.hoehe, q=hvQ();
  const reihen=[{z0:gs.a0,z1:gs.a1,a:true},{z0:gs.b0,z1:gs.b1,a:false}];
  const PFOST=0xc5cad1, TRAV=0xe36b1f;
  for(const r of reihen){
    for(let i=0;i<=R.felder;i++){ const x=R.x0+i*R.fb;
      for(const z of [r.z0+0.04,r.z1-0.04]){ S.box(0.1,Ht,0.08,x,Ht/2,z,PFOST,'metall'); S.box(0.2,0.012,0.16,x,0.006,z,0x8a9099,'metall'); }
      /* Rahmenverband: waagerecht und diagonal */
      for(let y=0.3,s=1;y<Ht-0.5;y+=1.25,s=-s){
        S.box(0.04,0.04,r.z1-r.z0-0.16,x,y,(r.z0+r.z1)/2,PFOST,'metall');
        if(q.fein) S.strebe(x,y,s>0?r.z0+0.08:r.z1-0.08,x,Math.min(Ht-0.2,y+1.25),s>0?r.z1-0.08:r.z0+0.08,0.035,PFOST,'metall'); }
    }
    for(let l=1;l<E.length;l++) for(let j=0;j<R.felder;j++){ const x=R.x0+(j+0.5)*R.fb, y=E[l]-0.07;
      for(const z of [r.z0+0.05,r.z1-0.05]) S.box(R.fb-0.1,0.12,0.05,x,y,z,TRAV,'lack'); }
    S.box(R.x1-R.x0,0.1,0.06,(R.x0+R.x1)/2,Ht-0.05,r.z0+0.05,TRAV,'lack'); S.box(R.x1-R.x0,0.1,0.06,(R.x0+R.x1)/2,Ht-0.05,r.z1-0.05,TRAV,'lack');
    /* Anfahrschutz an den Stirnseiten */
    S.box(0.08,0.45,r.z1-r.z0+0.1,R.x1+0.1,0.225,(r.z0+r.z1)/2,0xf2c230,'lack');
  }
  /* Fahrschiene am Boden und Fuehrungsschiene oben, Quertraeger je Feld */
  const xe=HV7.io.x1-0.15, xa=HV7.halle.x0+0.2;
  S.box(xe-xa,0.07,0.1,(xa+xe)/2,0.035,gs.mitte,0x5a6068,'metall');
  S.box(xe-xa,0.04,0.3,(xa+xe)/2,0.002,gs.mitte,0x3a3e44,'metall');
  S.box(xe-xa,0.12,0.12,(xa+xe)/2,Ht+0.22,gs.mitte,0x5a6068,'metall');
  for(let i=0;i<=R.felder;i++) S.box(0.08,0.08,gs.b0-gs.a1+0.1,R.x0+i*R.fb,Ht+0.08,gs.mitte,PFOST,'metall');
  S.box(0.12,Ht+0.3,0.12,xe+0.05,(Ht+0.3)/2,gs.a1+0.06,PFOST,'metall'); S.box(0.12,Ht+0.3,0.12,xe+0.05,(Ht+0.3)/2,gs.b0-0.06,PFOST,'metall');
  S.box(0.12,0.12,gs.b0-gs.a1,xe+0.05,Ht+0.2,gs.mitte,PFOST,'metall');
  S.fertig(G);
  /* Paletten: zufaellig, aber fest (Saat je Gasse) zu ~82 % belegt */
  const rng=hvRng(500+k), L=[];
  for(const r of reihen) for(let j=0;j<R.felder;j++) for(let s=0;s<3;s++) for(let l=0;l<E.length;l++){
    if(r.a&&j===0&&l===0&&s<2) continue;              /* Westende: Foerderer aus der Produktion */
    if(rng()>0.82) continue;
    const v=Math.floor(rng()*HV_LADUNG.length);
    if(E[l]+PAL_H+hvLadungHoehe(v)>(E[l+1]||Ht)-0.15) continue;
    L.push({x:R.x0+j*R.fb+0.1+(s+0.5)*(R.fb-0.2)/3,y:E[l]+(l?0:0),z:(r.z0+r.z1)/2,v}); }
  hvPalettenInst(G,L,false,true);
  HALLE.palettenHR=(HALLE.palettenHR||0)+L.length;
  hvSchild(G,'GASSE '+(k+1),'Reserve · '+(180)+' Plätze',1.4,0.42,xe+0.12,Ht-0.7,gs.mitte,Math.PI/2);
}

/* Regalbediengeraet: Fahrwerk, Mast, Hubwagen mit Teleskopgabel. Faehrt Ziele
   im Regal an, schiebt die Gabel aus, holt oder bringt eine Palette. */
function hvRbg(G,gs,k){
  const R=HV7.hr, Ht=R.hoehe, q=hvQ();
  const g=new THREE.Group(); g.position.set(-56,0,gs.mitte); G.add(g);
  const S=hvSammler(), GELB=0xf2b81c, GRAU=0xaeb5bd, DUNK=0x2a2e35, MITT=0x5d646d;
  /* Fahrwerk: Traeger, Radkaesten, Puffer, Fahrantrieb, Stromabnehmer */
  S.box(3.0,0.5,0.7,0,0.35,0,GELB,'lack'); S.box(3.1,0.08,0.75,0,0.62,0,DUNK,'lack');
  for(const dx of [-1.2,1.2]){ S.zyl(0.2,0.24,dx,0.2,0,DUNK,'lack','z',q.rund); S.box(0.56,0.5,0.8,dx,0.33,0,MITT,'lack'); S.box(0.5,0.06,0.82,dx,0.6,0,DUNK,'lack'); }
  for(const sx of [-1,1]) for(const dz of [-0.2,0.2]){ S.zyl(0.08,0.22,sx*1.62,0.32,dz,DUNK,'matt','x',8); S.box(0.04,0.3,0.7,sx*1.52,0.32,0,0x1d1f24,'lack'); }
  S.zyl(0.15,0.36,1.25,0.82,0.18,MITT,'lack','z',q.rund); S.box(0.3,0.3,0.26,1.25,0.82,-0.12,DUNK,'lack'); S.zyl(0.1,0.06,1.25,0.82,0.39,DUNK,'lack','z',8);
  S.box(0.08,0.14,0.32,-0.4,0.2,0.48,DUNK,'lack'); S.box(0.16,0.1,0.06,-0.4,0.2,0.62,0x8a9099,'metall');
  /* Mast als Fachwerk: vier Gurte, Querriegel, Diagonalen an drei Seiten */
  const y0=0.65, yt=Ht-0.15, mx0=0.6, mx1=0.92, mz=0.22;
  for(const xx of [mx0,mx1]) for(const zz of [-mz,mz]) S.box(0.1,yt-y0,0.1,xx,(y0+yt)/2,zz,GRAU,'lack');
  for(const zz of [-mz,mz]) S.box(0.04,yt-y0,0.08,mx0-0.06,(y0+yt)/2,zz,0xc9ced5,'metall');   /* Laufbahnen fuer den Hubwagen */
  const stp=q.fein?0.9:1.8;
  for(let y=y0+0.3,i=0;y<yt-0.2;y+=stp,i++){ const y2=Math.min(yt-0.1,y+stp);
    S.box(mx1-mx0,0.06,0.06,(mx0+mx1)/2,y,-mz,GRAU,'lack'); S.box(mx1-mx0,0.06,0.06,(mx0+mx1)/2,y,mz,GRAU,'lack'); S.box(0.06,0.06,2*mz,mx1,y,0,GRAU,'lack');
    const s=i%2?1:-1;
    for(const zz of [-mz,mz]) S.strebe(s>0?mx0:mx1,y,zz,s>0?mx1:mx0,y2,zz,0.045,GRAU,'lack');
    S.strebe(mx1,y,s*mz,mx1,y2,-s*mz,0.045,GRAU,'lack'); }
  /* Hubseile und Steigleiter an der Ostseite */
  for(const zz of [-0.1,0.1]) S.box(0.015,yt-y0,0.015,mx0-0.12,(y0+yt)/2,zz,0x3a3e44,'metall');
  if(q.fein){ for(const zz of [-0.17,0.17]) S.box(0.04,yt-1.2,0.04,mx1+0.28,(1.2+yt)/2,zz,0x8a9099,'metall');
    for(let y=1.4;y<yt-0.2;y+=0.3) S.box(0.03,0.03,0.34,mx1+0.28,y,0,0x8a9099,'metall');
    for(let y=2.6;y<yt-0.4;y+=0.9){ S.box(0.03,0.03,0.6,mx1+0.5,y,0,GELB,'lack'); for(const zz of [-0.3,0.3]) S.box(0.3,0.03,0.03,mx1+0.36,y,zz,GELB,'lack'); } }
  /* Kettenkanal mit Energiekette an der Mastseite */
  S.box(0.18,yt-y0-0.3,0.03,0.76,(y0+yt-0.3)/2,mz+0.12,0x8a9099,'metall'); S.box(0.03,yt-y0-0.3,0.12,0.67,(y0+yt-0.3)/2,mz+0.07,0x8a9099,'metall');
  for(let y=y0+0.1;y<Ht*0.55;y+=0.09) S.box(0.13,0.07,0.05,0.76,y,mz+0.07,0x1d1f24,'matt');
  /* Kopf mit Fuehrungsrollen und Warnleuchte */
  S.box(1.4,0.3,0.6,0.5,Ht+0.0,0,GELB,'lack'); S.box(1.44,0.05,0.64,0.5,Ht+0.17,0,DUNK,'lack');
  for(const xx of [0.1,0.9]) for(const dz of [-0.11,0.11]) S.zyl(0.06,0.1,xx,Ht+0.24,dz,DUNK,'lack','y',8);
  S.zyl(0.06,0.04,0.0,Ht+0.2,0.2,DUNK,'lack','y',8); S.zyl(0.07,0.14,0.0,Ht+0.29,0.2,0xff9a20,'leucht','y',10);
  /* Schaltschrank an der Ostseite: Tuerfuge, Griff, Display, Hauptschalter, Lueftung */
  const sx=1.22, sy=1.55;
  S.box(0.5,1.7,0.62,sx,sy,0,0xc2c7cd,'lack'); S.box(0.54,0.06,0.66,sx,sy+0.88,0,MITT,'lack'); S.box(0.5,0.12,0.6,sx,0.7,0,DUNK,'lack');
  const fx=sx+0.252;
  S.box(0.006,1.6,0.006,fx,sy,0,0x6f7780,'lack'); S.box(0.03,0.2,0.03,fx+0.01,sy,0.08,DUNK,'metall');
  S.box(0.006,0.12,0.2,fx,sy+0.5,-0.15,0x2a6fb0,'leucht'); for(let i=0;i<3;i++) S.zyl(0.018,0.02,fx,sy+0.32,-0.22+i*0.06,[0x3dff7a,0xffd23a,0xff4a3a][i],'leucht','x',8);
  S.box(0.01,0.14,0.14,fx,sy+0.15,0.17,0xf2c230,'lack'); S.zyl(0.04,0.04,fx+0.02,sy+0.15,0.17,0xd8352a,'lack','x',10);
  for(let i=0;i<5;i++) S.box(0.01,0.02,0.24,fx,sy-0.45-i*0.06,-0.12,0x3a3e44,'lack');
  S.box(0.008,0.16,0.16,fx,sy-0.15,0.17,0xf2c230,'leucht');
  /* zweiter Kasten (Umrichter) hinter dem Mast */
  S.box(0.5,1.1,0.5,-0.95,0.65+0.55,0,0xc2c7cd,'lack'); for(let i=0;i<6;i++) S.box(0.01,0.02,0.32,-1.205,0.9+i*0.08,0,0x3a3e44,'lack');
  S.fertig(g);
  /* Schlaufe der Energiekette: laeuft mit halber Hubgeschwindigkeit mit */
  const schl=new THREE.Group(); g.add(schl);
  { const Sk=hvSammler(); for(let i=0;i<=8;i++){ const a=Math.PI*i/8; Sk.box(0.13,0.06,0.05,0.76,-0.08*Math.sin(a),mz+0.15-0.08*Math.cos(a),0x1d1f24,'matt',a); } for(let y=0.04;y<0.9;y+=0.08) Sk.box(0.13,0.06,0.05,0.76,y,mz+0.23,0x1d1f24,'matt'); Sk.fertig(schl); }
  /* Hubwagen am Mast: Rahmen, Fuehrungsrollen, Gabelantrieb, Seitenschutz */
  const hub=new THREE.Group(); hub.position.set(0,1.0,0); g.add(hub);
  const Sh=hvSammler();
  Sh.box(0.25,1.3,0.9,0.45,0.65,0,GELB,'lack'); Sh.box(0.27,0.06,0.94,0.45,1.28,0,DUNK,'lack');
  for(const yy of [0.15,1.15]) for(const dz of [-mz,mz]) Sh.zyl(0.05,0.08,0.56,yy,dz,DUNK,'lack','x',8);
  Sh.box(1.1,0.1,1.25,-0.15,0.05,0,GELB,'lack'); Sh.box(1.12,0.04,1.27,-0.15,0.0,0,DUNK,'lack');
  for(const dz of [-0.62,0.62]) Sh.box(0.06,1.0,0.06,-0.65,0.55,dz,GELB,'lack');
  Sh.box(0.06,0.06,1.3,-0.65,1.05,0,GELB,'lack'); Sh.box(0.04,0.04,1.3,-0.65,0.6,0,GELB,'lack');
  Sh.zyl(0.09,0.3,0.25,0.32,0.3,MITT,'lack','x',q.rund); Sh.box(0.16,0.2,0.2,0.08,0.32,0.3,DUNK,'lack');
  for(const dz of [-0.6,0.6]){ Sh.box(0.08,0.06,0.04,0.3,0.16,dz,DUNK,'lack'); Sh.box(0.02,0.03,0.02,0.26,0.16,dz,0xff3020,'leucht'); }
  Sh.zyl(0.04,0.08,0.45,1.36,0.35,0xff9a20,'leucht','y',8);
  /* Teleskopgabel, feste Stufe */
  for(const dx of [-0.3,0.3]) Sh.box(0.18,0.05,1.22,-0.15+dx,0.125,0,MITT,'lack');
  Sh.fertig(hub);
  /* Mittelstufe (faehrt halb so weit) und Zinken */
  const mitte=new THREE.Group(); hub.add(mitte);
  { const Sm=hvSammler(); for(const dx of [-0.3,0.3]) Sm.box(0.15,0.04,1.18,-0.15+dx,0.165,0,0x8a9099,'metall'); Sm.fertig(mitte); }
  const gabel=new THREE.Group(); hub.add(gabel);
  const Sg=hvSammler(); for(const dx of [-0.3,0.3]) Sg.box(0.13,0.05,1.2,-0.15+dx,0.21,0,0xb9bfc6,'metall'); Sg.fertig(gabel);
  /* Palette auf der Gabel */
  const v=k%HV_LADUNG.length;
  const last=new THREE.Group(); gabel.add(last);
  last.add(new THREE.Mesh(hvPalGeo(),HVM.holz)); const lm=new THREE.Mesh(hvLadungGeo(v),hvQ().karton?HVM.karton:(HVM.kartonB||(HVM.kartonB=hvRes(std(0xbf9150))))); lm.position.y=PAL_H; last.add(lm);
  last.position.set(-0.15,0.235,0);
  /* Ablauf: Ziel anfahren (x und Hoehe gleichzeitig), Gabel aus, Palette ab/auf, Gabel ein */
  const E=R.ebenen, rng=hvRng(900+k);
  const st={ph:'fahren',t:0,x:-56,y:1.0,zx:-56,zy:1.0,seite:1,traegt:true,warte:0};
  const neuesZiel=()=>{ if(rng()<0.35){ st.zx=-47.3; st.zy=0.42; st.seite=rng()<0.5?-1:1; }   /* I/O am Ostende */
    else { const j=Math.floor(rng()*R.felder), s=Math.floor(rng()*3); st.zx=R.x0+j*R.fb+0.1+(s+0.5)*(R.fb-0.2)/3; st.zy=E[Math.floor(rng()*E.length)]+0.02; st.seite=rng()<0.5?-1:1; } };
  neuesZiel();
  HALLE.anim.push((dt)=>{
    if(!HALLE.animAn) return;
    st.t+=dt;
    if(st.ph==='fahren'){
      const dx=st.zx-st.x, dy=st.zy-st.y;
      const vx=Math.min(2.4,Math.abs(dx)*1.6+0.2), vy=Math.min(0.7,Math.abs(dy)*1.5+0.1);
      st.x+=Math.sign(dx)*Math.min(Math.abs(dx),vx*dt); st.y+=Math.sign(dy)*Math.min(Math.abs(dy),vy*dt);
      if(Math.abs(dx)<0.005&&Math.abs(dy)<0.005){ st.ph='aus'; st.t=0; }
    } else if(st.ph==='aus'){ gabel.position.z=st.seite*Math.min(1,st.t/1.4)*1.15; if(st.t>1.6){ st.traegt=!st.traegt; last.visible=st.traegt; st.ph='ein'; st.t=0; } }
    else if(st.ph==='ein'){ gabel.position.z=st.seite*Math.max(0,1-st.t/1.4)*1.15; if(st.t>1.5){ st.ph='warte'; st.t=0; } }
    else if(st.ph==='warte'&&st.t>0.8){ neuesZiel(); st.ph='fahren'; st.t=0; }
    g.position.x=st.x-0.75; hub.position.y=st.y; mitte.position.z=gabel.position.z*0.5; schl.position.y=(0.65+st.y)*0.5+0.4;
  });
  return g;
}
/* Rollenfoerderer laengs x: Rahmen in den Sammler, Rollen in die Liste */
function hvRollbahn(S,rollen,x0,x1,z,top,breite,beine){
  const b=breite||1.25, y=top-0.05;
  for(const s of [-1,1]) S.box(x1-x0,0.12,0.06,(x0+x1)/2,y-0.02,z+s*(b/2+0.03),0x6f7780,'lack');
  if(beine!==false) for(let x=x0+0.15;x<x1;x+=Math.max(0.9,(x1-x0-0.3)/Math.max(1,Math.round((x1-x0)/1.2)))) for(const s of [-1,1]) S.box(0.06,y-0.04,0.06,x,(y-0.04)/2,z+s*(b/2+0.03),0x6f7780,'lack');
  for(let x=x0+0.08;x<x1-0.04;x+=0.15) rollen.push(tm(x,y,z,Math.PI/2,0,0,0.04,b,0.04));
}
function hvRbgUndIO(){
  const G=hvBereich('rbg'), A=hvBereich('io_anbruch'), S=hvSammler(), rollen=[], pal=[], q=hvQ(), IO=HV7.io;
  HALLE.animAn=true;
  HV7.gassen.forEach((gs,k)=>hvRbg(G,gs,k));
  for(const gs of HV7.gassen){
    /* I/O: Einlagern (Reihe A, mit Konturenkontrolle), Auslagern (Reihe B) */
    const zA=(gs.a0+gs.a1)/2, zB=(gs.b0+gs.b1)/2;
    hvRollbahn(S,rollen,IO.x0,IO.x1,zA,0.5); hvRollbahn(S,rollen,IO.x0,IO.x1,zB,0.5);
    for(const s of [-1,1]) S.box(0.1,2.3,0.1,IO.x1-0.5,1.15,zA+s*0.78,0xf2b81c,'lack');
    S.box(0.1,0.12,1.66,IO.x1-0.5,2.3,zA,0xf2b81c,'lack');
    for(const s of [-1,1]) S.box(0.03,1.8,0.03,IO.x1-0.5,1.4,zA+s*0.72,0xff3020,'leucht');
    S.zyl(0.06,0.1,IO.x1-0.5,2.45,zA+0.78,0x40ff70,'leucht','y',8);
    /* Schutzzaun quer vor dem Gassenende mit Tuer und Schild */
    const zx=IO.x1+0.05;
    for(const z of [gs.a1+0.02,gs.b0-0.02,gs.mitte]) S.box(0.06,2.2,0.06,zx,1.1,z,0xf2c230,'lack');
    S.box(0.02,2.0,gs.b0-gs.a1-0.1,zx,1.15,gs.mitte,0xffffff,'zaun');
    if(q.fein) S.box(0.04,0.5,0.3,zx+0.06,1.4,gs.mitte+0.4,0xd8352a,'lack');
    /* Paletten auf den Foerderern */
    if(gs.k!==1) pal.push({x:IO.x0+0.6,y:0.5,z:zA,v:gs.k%4});
    pal.push({x:IO.x1-0.5,y:0.5,z:zB,v:(gs.k+2)%4});
    /* Westende: Foerderer durch die Brandwand aus der Produktion */
    hvRollbahn(S,rollen,HV7.halle.x0-1.6,HV7.hr.x0+1.6,zA,0.5);
    S.box(0.1,2.1,1.6,HV7.halle.x0+0.06,1.05,zA,0x8a9099,'metall');   /* Brandschutzabschluss, offen */
  }
  S.fertig(A);
  hvInst(hvGeoZyl(q.rund),hvRolleMat(),rollen,A);
  /* Anbruch: Paletten im Anbruch, Rollwagen, Packtisch mit Scanner */
  const AB=HV7.anbruch, Sa=hvSammler();
  HV7.gassen.forEach((gs,k)=>{ pal.push({x:AB.x0+1.2,y:0,z:gs.mitte,v:(k+1)%4,teil:true}); });
  /* angebrochene Palette: weniger Kartons - als eigene Instanz mit niedriger Ladung */
  hvPalettenInst(A,pal.filter(p=>!p.teil),false);
  { const tp=pal.filter(p=>p.teil); hvInst(hvPalGeo(),HVM.holz,tp.map(p=>tm(p.x,0,p.z)),A);
    const L=tp.map(p=>tm(p.x,PAL_H,p.z-0.3,0,0,0,1,0.5,0.5));
    if(q.karton) hvInst(hvLadungGeo(0),HVM.karton,L,A); }
  for(const [x,z,ry] of [[-43.0,-26.8,0.2],[-43.2,-20.6,-0.1],[-42.8,-15.4,0.05]]) hvRollwagen(Sa,x,z,ry);
  Sa.box(1.6,0.05,0.8,-42.7,0.92,-23.47,0xd8dce1,'lack');
  for(const dx of [-0.7,0.7]) for(const dz of [-0.33,0.33]) Sa.box(0.05,0.9,0.05,-42.7+dx,0.45,-23.47+dz,0x6f7780,'lack');
  Sa.box(0.3,0.2,0.2,-42.3,1.05,-23.6,0x2a2e35,'lack');
  Sa.fertig(A);
}
/* Rollwagen (Plattformwagen mit Buegel) mit ein paar Kartons */
function hvRollwagen(S,x,z,ry){
  const c=Math.cos(ry), s=Math.sin(ry), P=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c];
  const b=(w,h,d,lx,y,lz,col,m)=>{ const p=P(lx,lz); S.box(w,h,d,p[0],y,p[1],col,m,0,ry,0); };
  b(0.7,0.04,1.1,0,0.24,0,0x5d646d,'lack');
  for(const lx of [-0.3,0.3]) for(const lz of [-0.45,0.45]){ const p=P(lx,lz); S.zyl(0.07,0.05,p[0],0.08,p[1],0x1d1f24,'matt','x',8); }
  for(const lx of [-0.32,0.32]) b(0.03,0.9,0.03,lx,0.7,0.53,0x8a9099,'metall');
  b(0.66,0.03,0.03,0,1.14,0.53,0x8a9099,'metall');
  b(0.5,0.4,0.6,0.02,0.46,-0.15,0xbf9150,'matt'); b(0.4,0.3,0.4,-0.05,0.81,-0.2,0xc89b5c,'matt');
}
function hvRolleMat(){ return HVM.rolle||(HVM.rolle=hvRes(std(0xb9bfc6,{metalness:0.7,roughness:0.32}))); }
