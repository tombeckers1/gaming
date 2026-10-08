/* =========================================================
   Batterien in echter Bauform (07.10., Tom mit Fotos echter Batterien:
   "teils unterschiedliche Roehren-Groessen, Verpackungen grafisch wie
   hier, hochaufloesend, passende Formen. Einige Batterien sehen immer
   noch 0815 aus"). Vorbilder: Hamburg/Caipirinha (bedruckter Block,
   dunkle Oberseite mit grauen Rohrringen, zwei Kaliber), Big Final
   (Treppe), Magnum (Verbund mit abgenommenem Deckel), Exotic Place
   (Verbundbloecke auf einer Platte vor dem Displaykarton).
   Die 16 Batterien, die im Kontaktbogen noch ein einfacher Quader mit
   kleinem Etikett und gleichen Rohren waren, bekommen hier je eine
   eigene Bauform (BAU): Zonen mit eigener Hoehe (hf) und eigener
   Rohrzahl (n) und eigenem Kaliber (kal). Dieselbe Bauform gilt
   - fuer die Verkaufsverpackung (VP_FORM, Druck rundum, oben genau die
     Muendungen der Rohre an ihrem echten Platz),
   - fuer die Batterie auf dem Zuendtisch: rohrLayout legt die Rohre je
     Zone in ein eigenes Raster (dicke Rohre fuer die grossen Effekte),
     ROHR_FORM (14t) hebt die Muendungen auf die Stufe, der Koerper hat
     dieselben Bloecke und denselben Druck.
   Ein Loch = ein Schuss: die Zonen teilen genau rohrBedarf(t).schuss auf.
   Jede Zone hat ihre Zuendfolge (P.zuendung der Batterie) - die Zonen
   zuenden der Reihe nach (ord), die grossen Kaliber zum Schluss.
   ========================================================= */
(function(){
if(typeof VP_FORM==='undefined'||typeof ROHR_FORM==='undefined'||typeof window==='undefined'||!window.VP_WERK) return;
const W_=window.VP_WERK, PI=Math.PI, V=VP_FORM;
const {neu,reg,farbe,kasten,druck,fertig,vbox,vzyl,vkugel,vring,klar,mit,folie,kordel,ecken,hell,dunkel}=W_;
const RMAX=0.045;

/* ---------- Bauformen ----------
   Zone: x0..x1 links->rechts, z0..z1 vorn->hinten (Anteile), hf Hoehe,
   n Rohre, kal Kaliber (1 = so dick, wie das Raster erlaubt), ord
   Zuendreihenfolge (gleiche ord = eine Gruppe), ringe (runde Zone). */
const BAU={
  /* Glitzerregen: Block mit Absatz - hinten 12 dicke Rohre (Goldbuketts,
     zuerst), vorn eine Stufe tiefer 16 schlanke (Glitzerkometen) */
  glitzerregen12:{zonen:[{z0:0,z1:0.5,n:16,hf:0.8,kal:0.7,ord:1},{z0:0.5,z1:1,n:12,hf:1,ord:0}],ty:0.42},
  /* Regenbogenkometen: fuenf Saeulen als Bogen, jede in ihrer Farbe,
     gezuendet aus der Mitte nach aussen */
  lb_regenbogenbrunnen:{fuge:0.006,platte:[0.008,'#f2f2f4'],zonen:[0,1,2,3,4].map(i=>({x0:i/5,x1:(i+1)/5,n:2,hf:[0.66,0.84,1,0.84,0.66][i],kal:0.8,ord:[2,1,0,1,2][i]})),ty:0.6,ts:0.24},
  /* Blitzpalmen: T-Verbund - vorn zwei flache Bloecke mit je 9 schlanken
     Rohren, dahinter quer der hohe Block mit 7 dicken (Doppelpalmen-Finale) */
  lb_blitzpalmen:{fuge:0.008,platte:[0.01,'#141414'],zonen:[{x1:0.5,z1:0.46,n:9,hf:0.6,kal:0.66,ord:0},{x0:0.5,z1:0.46,n:9,hf:0.6,kal:0.66,ord:1},{z0:0.46,n:7,hf:1,ord:2}],ty:0.62},
  /* Weidenhain: drei Karbonbloecke auf schwarzer Platte (Exotic Place),
     dahinter der bedruckte Displaykarton; der mittlere Block mit den
     dicken Rohren der Goldweiden zuendet zuletzt */
  lb_weidenhain:{fuge:0.012,platte:[0.012,'#101012'],karbon:true,zonen:[{x1:0.37,z1:0.95,n:30,hf:0.78,kal:0.85,ord:0},{x0:0.37,x1:0.63,z1:0.95,n:20,hf:0.86,ord:2},{x0:0.63,z1:0.95,n:22,hf:0.78,kal:0.85,ord:1}]},
  /* Gluehwuermchen: Laternenblock - vorn 8 kleine Rohre, hinten 4 dicke
     fuer die vier zugleich am Schluss */
  lb_gluehwuermchen:{zonen:[{z0:0,z1:0.56,n:8,hf:0.72,kal:0.72,ord:0},{z0:0.56,n:4,hf:0.72,ord:1}],ty:0.46},
  /* Sternschnuppen: Treppe, die nach rechts abfaellt wie eine Schnuppe -
     oben links die drei dicken Rohre */
  lb_sternschnuppen:{mix:true,zonen:[{x1:0.22,n:3,hf:1},{x0:0.22,x1:0.47,n:3,hf:0.84,kal:0.8},{x0:0.47,x1:0.73,n:4,hf:0.7,kal:0.74},{x0:0.73,n:4,hf:0.56,kal:0.74}],ty:0.62,ts:0.22},
  /* Kirschbluete: Block in Japanpapier-Banderole, ein Kirschzweig obenauf */
  lb_kirschbluete:{zonen:[{n:15,hf:0.9}],ty:0.36},
  /* Jadeader: Schachbrett aus vier Saeulen - zwei hohe mit dicken Rohren
     (Knaller, Weiden), zwei niedrige mit Kometen */
  lb_jadeader:{zonen:[{x1:0.5,z1:0.5,n:5,hf:0.72,kal:0.74,ord:0},{x0:0.5,z1:0.5,n:5,hf:1,ord:1},{x1:0.5,z0:0.5,n:5,hf:1,ord:1},{x0:0.5,z0:0.5,n:5,hf:0.72,kal:0.74,ord:0}],ty:0.5},
  /* Eisvogel: runde Trommel - aussen 14 schlanke Rohre im Kreis, innen
     7 dicke um ein Mittelrohr */
  lb_eisvogel:{rund:true,zonen:[{n:22,hf:1,ringe:[[14,0.8,0.72],[7,0.42,1],[1,0,1]]}]},
  /* Glutpalmen: drei Palmenstaemme (Saeulen) auf einem Glutrost */
  lb_glutpalmen:{fuge:0.04,platte:[0.014,'#1a1412'],eigen:true,ts:0.2,zonen:[{x1:0.31,z0:0.12,z1:0.88,n:7,hf:0.8,ord:0},{x0:0.345,x1:0.655,z0:0.12,z1:0.88,n:6,hf:1,ord:2},{x0:0.69,z0:0.12,z1:0.88,n:7,hf:0.9,ord:1}],ty:0.4},
  /* Ozean: vorn eine Wellenblende vor 16 schmalen Rohren (Kometen,
     Gischt), dahinter hoch 14 dicke (Brandung) */
  lb_saphirfaecher:{zonen:[{z0:0.02,z1:0.46,n:16,hf:0.58,kal:0.68,ord:0},{z0:0.46,n:14,hf:1,ord:1}],ty:0.62},
  /* Rubinpalmen: Schatulle mit abgenommenem Deckel - links 8 dicke Rohre
     (Rubinpalmen), rechts 14 schlanke (Crossetten, Weiden) */
  lb_rubinpalmen:{zonen:[{x1:0.4,n:8,hf:0.74,ord:1},{x0:0.4,n:14,hf:0.74,kal:0.7,ord:0}],ty:0.5,ts:0.3},
  /* Polarnacht: vier Lichtvorhaenge hintereinander, verschieden hoch */
  lb_polarweiden:{mix:true,fuge:0.014,platte:[0.01,'#0c1418'],zonen:[{z1:0.25,n:7,hf:0.6,kal:0.7},{z0:0.25,z1:0.5,n:7,hf:0.86,kal:0.78},{z0:0.5,z1:0.75,n:6,hf:0.72,kal:0.8},{z0:0.75,n:6,hf:1}],ty:0.7,ts:0.22},
  /* Farbtiger: ein Block, drei Kaliber-Felder - die zehn dicken Tiger in
     der Mitte zuenden zum Schluss */
  lb_farbtiger:{zonen:[{x1:0.35,n:10,hf:1,kal:0.72,ord:0},{x0:0.35,x1:0.65,n:10,hf:1,ord:1},{x0:0.65,n:10,hf:1,kal:0.72,ord:0}],ty:0.5},
  /* Kronenfeuer: Block mit goldenem Zackenkranz - hinten 10 dicke Kronen,
     vorn 22 schlanke */
  lb_kronenfeuer:{zonen:[{z0:0,z1:0.52,n:22,hf:0.76,kal:0.72,ord:0},{z0:0.52,n:10,hf:0.76,ord:1}],ty:0.56},
  /* Urwald: Stufentempel - aussen der niedrige Ring, in der Mitte der
     hohe Tempel mit den zwoelf Palmen (Finale) */
  lb_jadekoenig:{zonen:[{z1:0.3,n:8,hf:0.62,kal:0.74,ord:0},{x1:0.3,z0:0.3,z1:0.7,n:3,hf:0.8,kal:0.8,ord:1},{z0:0.7,n:8,hf:0.62,kal:0.74,ord:2},{x0:0.7,z0:0.3,z1:0.7,n:3,hf:0.8,kal:0.8,ord:3},{x0:0.3,x1:0.7,z0:0.3,z1:0.7,n:12,hf:1,ord:4}],ty:0.66,ts:0.24},
  /* Weltuntergang (07.10., Tom: "viel zu klein - ~300 Schuss, Verpackung
     und Koerper muessen entsprechend gross und glaubwuerdig sein"):
     Grossverbund aus drei Bloecken auf der Platte - aussen je ~90 schlanke
     Rohre, in der Mitte der hohe Block mit den 125 dicken Rohren fuer die
     grossen Effekte; im Laden steht dahinter der Displaykarton */
  finale:{fuge:0.012,platte:[0.014,'#140606'],zonen:[{x1:0.3,z1:0.95,n:88,hf:0.72,kal:0.6,ord:0},{x0:0.3,x1:0.7,z1:0.95,n:125,hf:1,ord:2},{x0:0.7,z1:0.95,n:87,hf:0.72,kal:0.6,ord:1}],ty:0.5,ts:0.2},
  /* ---- nur Zuendtisch (07.10.): die Verkaufsverpackung bleibt, der
     Koerper auf dem Tisch bekommt dieselbe Bauform und zwei Kaliber -
     die dicken Rohre fuer die grossen Effekte (kal:'gross' im Drehbuch) */
  lb_tautropfen:{nurTisch:1,zonen:[{z1:0.55,n:7,kal:0.68,ord:0},{z0:0.55,n:3,ord:1}]},
  lb_zitronenfalter:{nurTisch:1,zonen:[{z1:0.58,n:12,kal:0.7,ord:0},{z0:0.58,n:4,ord:1}]},
  lb_lavendelfeld:{nurTisch:1,zonen:[{z1:0.6,n:13,hf:0.88,kal:0.7,ord:0},{z0:0.6,n:5,ord:1}]},
  lb_herbstlaub:{nurTisch:1,zonen:[{z1:0.6,n:15,hf:0.86,kal:0.7,ord:0},{z0:0.6,n:7,ord:1}]},
  /* Kolibri: Treppe wie die Packung - vorn niedrig, hinten hoch mit den dicken Rohren */
  lb_kolibri:{nurTisch:1,zonen:[{z1:0.5,n:12,hf:0.58,kal:0.7,ord:0},{z0:0.5,x1:0.42,n:5,kal:0.72,ord:1},{z0:0.5,x0:0.42,n:7,ord:1}]},
  lb_sonnenblumen:{nurTisch:1,zonen:[{x1:0.45,n:10,ord:1},{x0:0.45,n:20,kal:0.68,ord:0}]},
  /* Vulkan: drei Bloecke auf der Platte, der Krater in der Mitte am hoechsten */
  lb_vulkan:{nurTisch:1,fuge:0.008,platte:[0.014,'#0c0808'],zonen:[{x1:1/3,n:13,hf:0.62,kal:0.72,ord:0},{x0:1/3,x1:2/3,n:18,hf:1,ord:2},{x0:2/3,n:13,hf:0.62,kal:0.72,ord:1}]},
  profi:{nurTisch:1,fuge:0.01,platte:[0.012,'#141414'],zonen:[{x1:0.34,n:72,hf:0.8,kal:0.7,ord:0},{x0:0.34,x1:0.66,n:55,ord:2},{x0:0.66,n:73,hf:0.8,kal:0.7,ord:1}]},
  donnerwand:{nurTisch:1,zonen:[{z1:0.55,n:90,hf:0.82,kal:0.72,ord:0},{z0:0.55,n:30,ord:1}]},
  hexenkessel:{nurTisch:1,zonen:[{z1:0.6,n:132,hf:0.88,kal:0.68,ord:0},{z0:0.6,n:48,ord:1}]},
  glutschmiede:{nurTisch:1,zonen:[{x1:0.33,n:16,kal:0.72,hf:0.85,ord:0},{x0:0.33,x1:0.67,n:19,ord:1},{x0:0.67,n:16,kal:0.72,hf:0.85,ord:0}]},
  lb_silbergewitter:{nurTisch:1,zonen:[{x1:0.32,n:9,kal:0.7,ord:0},{x0:0.32,x1:0.68,n:10,ord:1},{x0:0.68,n:9,kal:0.7,ord:0}]},
  lb_goldader:{nurTisch:1,fuge:0.01,zonen:[{x1:0.5,z1:0.62,n:31,kal:0.66,hf:0.86,ord:0},{x1:0.5,z0:0.62,n:12,ord:2},{x0:0.5,z1:0.62,n:31,kal:0.66,hf:0.86,ord:1},{x0:0.5,z0:0.62,n:12,ord:2}]},
  kreuzfeuer90:{nurTisch:1,fuge:0.01,zonen:[{x1:0.5,z1:0.55,n:30,kal:0.7,hf:0.85,ord:0},{x1:0.5,z0:0.55,n:15,ord:1},{x0:0.5,z1:0.55,n:30,kal:0.7,hf:0.85,ord:0},{x0:0.5,z0:0.55,n:15,ord:1}]},
  goldpalmen:{nurTisch:1,zonen:[{z1:0.62,n:21,kal:0.7,hf:0.9,ord:0},{z0:0.62,n:4,ord:1}]}
};
/* Druck der nur-Tisch-Koerper: Themen im Themen-Druck (04h), sonst der Packungsdruck */
{ const TH={lb_tautropfen:['tau',{zeile:'KINDERFEUERWERK',badgeFarbe:'#1e9a6a'}],lb_zitronenfalter:['falter',{badgeFarbe:'#e0a000'}],lb_lavendelfeld:['lavendel',{badgeFarbe:'#7a3aff'}],
    lb_herbstlaub:['herbst',{zeile:'BLÄTTERFALL',badgeFarbe:'#b84a10'}],lb_kolibri:['kolibri',{zeile:'STUFENBATTERIE',gross:0.22}],lb_sonnenblumen:['sonne',{badgeFarbe:'#c87a00'}],lb_vulkan:['vulkan',{zeile:'3 BLÖCKE · VERBUND',gross:0.24}]};
  for(const t in BAU){ const S=BAU[t]; if(!S.nurTisch) continue;
    if(TH[t]){ S.front=k=>window.VP_TH?window.VP_TH.thFront(k,TH[t][0],TH[t][1]):(g,W,H)=>drawFront(g,W,H,k.a,k.cat); S.seite=(k,id)=>window.VP_TH?window.VP_TH.thSeite(k,TH[t][0],id):(g,W,H)=>drawSide(g,W,H,k.a); }
    else { S.front=k=>(g,W,H)=>drawFront(g,W,H,k.a,k.cat); S.seite=k=>(g,W,H)=>drawSide(g,W,H,k.a); } } }
/* Seidenpapier je Zone/Rohr und Farbe der Oberseite */
{ const RB=['#ff3a2a','#ffe23f','#3ad25a','#2ad8e8','#a04aff'];
  BAU.lb_regenbogenbrunnen.kappe=(j,q)=>RB[q.zone]; BAU.lb_kronenfeuer.kappe=(j,q)=>q.zone?'#ffd23f':['#ff4a4a','#5c8dff','#5cff8a','#c85cff'][j%4];
  BAU.lb_farbtiger.kappe=(j,q)=>q.zone===1?'#ffd23f':['#5cff9e','#5c8dff','#ff5ac8'][j%3]; BAU.lb_polarweiden.kappe=(j,q)=>['#5cffe8','#3aff8a','#c85cff','#5c8dff'][q.zone];
  BAU.lb_jadeader.kappe=(j,q)=>q.r>0.03?'#d8ffb0':'#5cff8a'; BAU.lb_jadeader.oben='#123a22'; BAU.lb_kirschbluete.kappe=['#ffb8d8','#fff0f4']; BAU.lb_rubinpalmen.oben='#2a0a0e';
  BAU.lb_eisvogel.kappe=(j,q)=>q.ring?'#3a6aff':'#5ce1ff'; BAU.lb_gluehwuermchen.kappe=(j,q)=>q.zone?'#ffe08a':'#c8ff5a';  BAU.finale.kappe=(j,q)=>q.zone===1?['#ff3a1a','#ffd23f','#ff8a1c'][j%3]:['#ff5a3a','#ffffff'][j%2]; BAU.finale.oben='#1e0a08'; }
for(const t in BAU) BAU[t].zonen.forEach(z=>{ for(const [k,v] of [['x0',0],['x1',1],['z0',0],['z1',1],['hf',1],['ord',0]]) if(z[k]===undefined) z[k]=v; });

/* Zone in Metern (mit Fuge zwischen Nachbarzonen) */
function zbox(t,z,S){ const p=P[t], w=p.dims[0], d=p.dims[2], f=(S.fuge||0)/2;
  let X0=-w/2+z.x0*w, X1=-w/2+z.x1*w, ZF=d/2-z.z0*d, ZB=d/2-z.z1*d;
  if(z.x0>1e-6) X0+=f; if(z.x1<1-1e-6) X1-=f; if(z.z0>1e-6) ZF-=f; if(z.z1<1-1e-6) ZB+=f;
  return {x:(X0+X1)/2,z:(ZF+ZB)/2,w:X1-X0,d:ZF-ZB}; }
/* bestes Raster fuer n Rohre auf w x d */
function raster(n,w,d){ let best=null; for(let c=1;c<=n;c++){ const r=Math.ceil(n/c), s=Math.min(w/c,d/r), leer=c*r-n; if(!best||s>best.s+1e-9||(Math.abs(s-best.s)<1e-9&&leer<best.leer)) best={c,r,s,leer}; } return best; }
/* n auf Teile verteilen (Summe genau n) */
function teile(n,fl){ const s=fl.reduce((a,b)=>a+b,0), out=fl.map(f=>Math.floor(n*f/s)); let r=n-out.reduce((a,b)=>a+b,0); for(let i=0;r>0;i=(i+1)%out.length,r--) out[i]++; return out; }

/* Reihenfolge der Plaetze einer Zone nach der Zuendungsart der Batterie
   (wie 04c rohrLayout, hier je Zone) */
function ordnen(R,rows,cols,art,saat){ const idx=R.map((x,i)=>i);
  if(art==='zufall'){ rohrSaat(saat,()=>{ for(let i=idx.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; } }); return idx; }
  const platz=(n,row)=>{ const o=[];
    if(art==='wechsel') for(let i=0;o.length<n;i++){ o.push(i); if(o.length<n) o.push(n-1-i); }
    else if(art==='mitte'){ const h=(n-1)/2, L=[], Rr=[]; for(let i=0;i<n;i++) (i<=h?L:Rr).push(i); L.reverse(); const a=row%2?Rr:L, b=row%2?L:Rr; for(let i=0;i<Math.max(a.length,b.length);i++){ if(i<a.length) o.push(a[i]); if(i<b.length) o.push(b[i]); } }
    else for(let i=0;i<n;i++) o.push(row%2?n-1-i:i);
    return o; };
  const rang=x=>{ const Q=R.filter(y=>y.row===x.row).map(y=>y.col).sort((a,b)=>a-b); return platz(Q.length,x.row).indexOf(Q.indexOf(x.col)); };
  const spR=c=>c<cols-1-c?2*c:2*(cols-1-c)+1;
  return idx.sort((a,b)=>{ const A=R[a], B=R[b];
    if(A.ring!==undefined){ if(A.ring!==B.ring) return A.ring-B.ring; return A.ang-B.ang; }
    if(art==='diagonal'){ const D=rows+cols-2, rg=d=>d<=D-d?2*d:2*(D-d)+1, da=rg(A.row+A.col), db=rg(B.row+B.col); if(da!==db) return da-db; return da%2?B.row-A.row:A.row-B.row; }
    if(art==='spirale'){ const ring=x=>Math.min(x.row,x.col,rows-1-x.row,cols-1-x.col), wi=x=>Math.atan2(x.row-(rows-1)/2,x.col-(cols-1)/2); if(ring(A)!==ring(B)) return ring(A)-ring(B); return wi(A)-wi(B); }
    if(art==='spalte'){ const ra=spR(A.col), rb=spR(B.col); if(ra!==rb) return ra-rb; return ra%2?B.row-A.row:A.row-B.row; }
    if(A.row!==B.row) return A.row-B.row; return rang(A)-rang(B); }); }

/* ---------- Rohrbild auf dem Zuendtisch ---------- */
function bauLayout(t,L0){
  const S=BAU[t], p=P[t], w=p.dims[0], d=p.dims[2], N=L0.N, m=0.006;
  let ns=S.zonen.map(z=>z.n); if(ns.reduce((a,b)=>a+b,0)!==N) ns=teile(N,ns);
  const art=p.zuendung||'schlange', rohre=[], gruppen={};
  S.zonen.forEach((z,zi)=>{ const Z=zbox(t,z,S), n=ns[zi], R=[];
    if(z.ringe){ const RR=Math.min(Z.w,Z.d)/2-m; let rest=n; const ri=z.ringe.map(q=>q[0]); if(ri.reduce((a,b)=>a+b,0)!==n) teile(n,ri).forEach((v,i)=>ri[i]=v);
      z.ringe.forEach(([_,rf,kal],k)=>{ const nk=ri[k]; for(let i=0;i<nk;i++){ const an=-PI/2+i/nk*2*PI+(k%2?PI/nk:0), rho=RR*rf;
        const rr=Math.min(RMAX,nk>1?Math.min(PI*rho/nk*0.88,RR*0.2):RR*0.19)*(kal||1);
        R.push({x:Z.x+Math.cos(an)*rho,z:Z.z+Math.sin(an)*rho,r:rr,ring:k,ang:an}); } rest-=nk; }); }
    else { const iw=Z.w-2*m, id=Z.d-2*m, G=raster(n,iw,id), cw=iw/G.c, ch=id/G.r, rr=Math.min(RMAX,Math.min(cw,ch)*0.45)*(z.kal||1); let k=0;
      for(let j=0;j<G.r;j++){ const inR=Math.min(G.c,n-k), x0=Z.x-iw/2+(G.c-inR)/2*cw; for(let i=0;i<inR;i++,k++) R.push({x:x0+cw*(i+0.5),z:Z.z+id/2-ch*(j+0.5),r:rr,row:j,col:Math.round((G.c-inR)/2)+i}); }
      R.rows=G.r; R.cols=G.c; }
    const reihe=ordnen(R,R.rows||1,R.cols||1,art,saatZahl(t+':z'+zi));
    const g=gruppen[z.ord]||(gruppen[z.ord]=[]);
    reihe.forEach(i=>{ const q=R[i]; q.zone=zi; q.blk=0; rohre.push(q); g.push(rohre.length-1); }); });
  /* Gruppen der Reihe nach; S.mix: innerhalb der Gruppe kreuz und quer */
  let folge=[]; Object.keys(gruppen).map(Number).sort((a,b)=>a-b).forEach(o=>{ const g=gruppen[o];
    if(S.mix||(art==='zufall'&&new Set(g.map(i=>rohre[i].zone)).size>1)) rohrSaat(saatZahl(t+':g'+o),()=>{ for(let i=g.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [g[i],g[j]]=[g[j],g[i]]; } });
    folge=folge.concat(g); });
  /* Neigung (rohrNeigung): Spalte aus der Lage in der ganzen Breite */
  const cols=Math.max(2,L0.cols), h=(cols-1)/2, hw=w/2-0.02;
  rohre.forEach((q,i)=>{ q.row=q.row===undefined?q.ring:q.row; q.colZ=q.col; q.col=h+h*clamp(q.x/hw,-1,1); });
  return Object.assign({},L0,{rohre,folge,B:1,bloecke:[{x0:-w/2,x1:w/2}],r:Math.max(...rohre.map(q=>q.r)),bau:true});
}
{ const roh=rohrLayout; rohrLayout=function(t){ if(!BAU[t]) return roh(t); const c=_rohrLayout[t]; if(c&&c.bau) return c;
    const L0=roh(t); if(!L0) return L0; let L=L0; try{ L=bauLayout(t,L0); }catch(e){ if(typeof console!=='undefined') console.warn('BAU',t,e); }
    /* die Zuendfolge der Themen-Batterien (TH_FOLGE, 14v) gilt auch fuer die Bauform: sie ist auf Breite/Hoehe der Show abgestimmt (themen-Test STEIGERUNG) */
    if(L!==L0&&typeof TH_FOLGE!=='undefined'&&TH_FOLGE[t]){ try{ const f=TH_FOLGE[t](L,t); if(f&&f.length===L.rohre.length&&new Set(f).size===f.length) L.folge=f; }catch(e){} }
    _rohrLayout[t]=L; return L; }; }
/* Rohre stehen buendig im Block wie bei echten Batterien (Vorbild Hamburg,
   Caipirinha): nur knapp 1 cm Rand ueber dem Deckel statt 6 % der Hoehe - bei
   hohen Verbunden ragten sonst 5 cm Pappe heraus wie ein Rohrwald */
{ const rh=rohrHoehe; rohrHoehe=function(t){ const S=BAU[t], p=P[t]; if(!S||!p||p.shape==='fan') return rh(t); const h=p.dims[1], lp=Math.min(0.009,h*0.06); return {bh:h*0.94+(h*0.06-lp),lp}; }; }
/* Stufen fuer Muendung und Rohrlaenge (14t ROHR_FORM): Zonen ohne Fuge */
for(const t in BAU) ROHR_FORM[t]={zonen:BAU[t].zonen.map(z=>({x0:z.x0,x1:z.x1,z0:z.z0,z1:z.z1,hf:z.hf}))};

/* ---------- Druck ---------- */
const hx=(c,f)=>hell(c,f), dx=(c,f)=>dunkel(c,f);
const lin=(g,x0,y0,x1,y1,st)=>{ const gr=g.createLinearGradient(x0,y0,x1,y1); st.forEach((c,i)=>gr.addColorStop(i/(st.length-1),c)); return gr; };
function sterne(g,W,H,r,n,yMax){ for(let i=0;i<n;i++){ g.fillStyle=`rgba(255,255,255,${0.25+r()*0.6})`; const s=r()<0.1?2:1.1; g.fillRect(r()*W,r()*H*(yMax||1),s,s); } }
function komet(g,x0,y0,x1,y1,c,b){ g.save(); g.globalCompositeOperation='lighter'; g.strokeStyle=lin(g,x0,y0,x1,y1,[rgba(c,0),rgba(c,0.9)]); g.lineWidth=b; g.lineCap='round'; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke();
  const hg=g.createRadialGradient(x1,y1,0,x1,y1,b*2.2); hg.addColorStop(0,'rgba(255,255,255,1)'); hg.addColorStop(0.4,rgba(c,0.9)); hg.addColorStop(1,rgba(c,0)); g.fillStyle=hg; g.beginPath(); g.arc(x1,y1,b*2.2,0,2*PI); g.fill(); g.restore(); }
function blatt(g,x,y,l,b,rot,c){ g.save(); g.translate(x,y); g.rotate(rot); g.fillStyle=c; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(l*0.5,-b,l,0); g.quadraticCurveTo(l*0.5,b,0,0); g.fill();
  g.strokeStyle='rgba(0,0,0,.25)'; g.lineWidth=Math.max(1,b*0.08); g.beginPath(); g.moveTo(0,0); g.lineTo(l*0.95,0); g.stroke(); g.restore(); }
function bluete(g,x,y,R,c,mitte){ for(let k=0;k<5;k++){ const a=-PI/2+k*2*PI/5; g.fillStyle=c; g.beginPath(); g.ellipse(x+Math.cos(a)*R*0.55,y+Math.sin(a)*R*0.55,R*0.5,R*0.38,a,0,2*PI); g.fill(); }
  g.fillStyle=mitte||'#fff3c4'; g.beginPath(); g.arc(x,y,R*0.22,0,2*PI); g.fill(); }
/* Effektbilder je Batterie (Name = Effekt = Bild) */
const MOT={
  glitzerregen12(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#2e1c03','#120a01','#050200']); g.fillRect(0,0,W,H);
    fotoBurst(g,W*0.28,H*0.26,H*0.32,'#ffd23f','#fff3c4','weide',r); fotoBurst(g,W*0.74,H*0.22,H*0.26,'#ffb84a','#ffd23f','weide',r);
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<260;i++){ const x=r()*W, y=r()*H*0.5, l=H*(0.2+r()*0.55); g.strokeStyle=lin(g,0,y,0,y+l,['rgba(255,210,63,0)','rgba(255,214,90,.55)','rgba(255,240,180,0)']); g.lineWidth=1+r()*1.5; g.beginPath(); g.moveTo(x,y); g.lineTo(x+(r()-0.5)*4,y+l); g.stroke(); }
    for(let i=0;i<1400;i++){ g.fillStyle=r()<0.5?'rgba(255,255,255,.9)':'rgba(255,215,90,.9)'; const s=r()<0.15?2.5:1.2; g.fillRect(r()*W,r()*H,s,s); } g.restore(); },
  lb_regenbogenbrunnen(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#24104a','#0a0618','#04030a']); g.fillRect(0,0,W,H); sterne(g,W,H,r,260,0.8);
    const F=['#ff3a2a','#ff8a1c','#ffe23f','#3ad25a','#2ad8e8','#3a6aff','#a04aff'], cx=W/2, cy=H*1.15, R0=Math.min(W*0.48,H*1.05), b=R0*0.065;
    g.save(); g.globalCompositeOperation='lighter'; F.forEach((c,i)=>{ g.strokeStyle=rgba(c,0.75); g.lineWidth=b; g.beginPath(); g.arc(cx,cy,R0-i*b,PI,2*PI); g.stroke(); });
    F.forEach((c,i)=>{ const a=PI+(i+0.5)/7*PI, R1=R0-3*b; komet(g,cx+Math.cos(a)*R1*0.25,cy+Math.sin(a)*R1*0.25*0.7,cx+Math.cos(a)*R1*0.92,cy+Math.sin(a)*R1*0.92,c,Math.max(2,H*0.018)); }); g.restore();
    g.fillStyle='rgba(255,255,255,.92)'; for(const s of [-1,1]) for(let k=0;k<4;k++){ g.beginPath(); g.arc(cx+s*(R0-3*b)+(k-1.5)*H*0.05,H*(0.92-(k%2)*0.04),H*0.06,0,2*PI); g.fill(); } },
  lb_blitzpalmen(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#06060e','#141022','#2a1e06']); g.fillRect(0,0,W,H); sterne(g,W,H,r,200,0.6);
    fotoBurst(g,W*0.24,H*0.32,H*0.34,'#ffd23f','#ffffff','palme',r); fotoBurst(g,W*0.78,H*0.28,H*0.3,'#ffffff','#ffd23f','palme',r);
    g.save(); g.globalCompositeOperation='lighter'; for(let b=0;b<3;b++){ let x=W*(0.38+b*0.13), y=0; const P0=[[x,y]]; while(y<H*0.7){ x+=(r()-0.5)*W*0.06; y+=H*(0.06+r()*0.06); P0.push([x,y]); }
      for(const [lw,c] of [[H*0.04,'rgba(255,210,63,.18)'],[H*0.015,'rgba(255,240,160,.6)'],[Math.max(1.5,H*0.005),'#ffffff']]){ g.strokeStyle=c; g.lineWidth=lw; g.lineJoin='miter'; g.beginPath(); P0.forEach(([a,c2],i)=>i?g.lineTo(a,c2):g.moveTo(a,c2)); g.stroke(); } } g.restore();
    g.fillStyle='#030302'; for(const [x,s] of [[0.08,1],[0.92,0.8],[0.6,0.6]]){ const bx=W*x, h=H*0.42*s; g.lineWidth=H*0.025*s; g.strokeStyle='#030302'; g.beginPath(); g.moveTo(bx,H); g.quadraticCurveTo(bx+H*0.06*s,H-h*0.5,bx+H*0.02,H-h); g.stroke();
      for(let k=0;k<7;k++) blatt(g,bx+H*0.02,H-h,H*0.2*s,H*0.035*s,-PI*0.95+k*PI/6.5+0.1,'#030302'); } },
  lb_weidenhain(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#120c02','#2a1a04','#060402']); g.fillRect(0,0,W,H);
    fotoBurst(g,W*0.3,H*0.28,H*0.36,'#ffb84a','#fff3c4','weide',r); fotoBurst(g,W*0.72,H*0.24,H*0.3,'#ffd23f','#ffb84a','weide',r); fotoBurst(g,W*0.52,H*0.18,H*0.22,'#ff6a2a','#ffd23f','weide',r);
    g.strokeStyle='#020100'; for(const x of [0.1,0.88]){ const bx=W*x; g.lineWidth=H*0.05; g.beginPath(); g.moveTo(bx,H); g.lineTo(bx,H*0.55); g.stroke(); g.lineWidth=Math.max(1,H*0.008);
      for(let k=0;k<40;k++){ const a=-PI/2+(r()-0.5)*2.6, l=H*(0.15+r()*0.12), ex=bx+Math.cos(a)*l, ey=H*0.55+Math.sin(a)*l; g.beginPath(); g.moveTo(bx,H*0.55); g.quadraticCurveTo(ex,ey,ex+(ex-bx)*0.2,ey+H*(0.25+r()*0.25)); g.stroke(); } } },
  lb_gluehwuermchen(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#081a26','#0a2014','#030a04']); g.fillRect(0,0,W,H); sterne(g,W,H,r,150,0.5);
    const mg=g.createRadialGradient(W*0.82,H*0.2,0,W*0.82,H*0.2,H*0.25); mg.addColorStop(0,'rgba(255,250,210,1)'); mg.addColorStop(0.35,'rgba(255,245,190,.9)'); mg.addColorStop(0.4,'rgba(255,240,170,.25)'); mg.addColorStop(1,'rgba(255,240,170,0)'); g.fillStyle=mg; g.fillRect(0,0,W,H);
    for(let i=0;i<300;i++){ const x=r()*W, h=H*(0.12+r()*0.3); g.strokeStyle=r()<0.5?'#1e5a1a':'#2e7a22'; g.lineWidth=1.5+r()*2; g.beginPath(); g.moveTo(x,H); g.quadraticCurveTo(x+(r()-0.5)*20,H-h*0.6,x+(r()-0.5)*30,H-h); g.stroke(); }
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<46;i++){ const x=r()*W, y=H*(0.2+r()*0.7), R=H*(0.015+r()*0.03), fg=g.createRadialGradient(x,y,0,x,y,R); fg.addColorStop(0,'rgba(255,255,220,1)'); fg.addColorStop(0.3,'rgba(200,255,90,.85)'); fg.addColorStop(1,'rgba(200,255,90,0)'); g.fillStyle=fg; g.beginPath(); g.arc(x,y,R,0,2*PI); g.fill(); } g.restore(); },
  lb_sternschnuppen(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#0c1a44','#050c26','#01030c']); g.fillRect(0,0,W,H); sterne(g,W,H,r,500);
    for(let i=0;i<7;i++){ const x1=W*(0.08+r()*0.84), y1=H*(0.15+r()*0.45), l=H*(0.25+r()*0.35); komet(g,x1+l*1.1,y1-l*0.55,x1,y1,i%3?'#e8f0ff':'#8ab8ff',Math.max(1.5,H*(0.008+r()*0.01))); }
    g.fillStyle='#030716'; g.beginPath(); g.moveTo(0,H); [0,0.12,0.25,0.38,0.5,0.64,0.78,0.9,1].forEach((u,i)=>g.lineTo(u*W,H*(i%2?0.74+r()*0.06:0.84+r()*0.06))); g.lineTo(W,H); g.fill(); },
  lb_kirschbluete(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#4a1030','#2a0818','#12030c']); g.fillRect(0,0,W,H);
    fotoBurst(g,W*0.74,H*0.3,H*0.3,'#ffb8d8','#ffffff','ring',r);
    g.strokeStyle='#1a0a06'; g.lineCap='round'; const ast=(x,y,a,l,b,tiefe)=>{ const ex=x+Math.cos(a)*l, ey=y+Math.sin(a)*l; g.lineWidth=b; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo((x+ex)/2,(y+ey)/2-l*0.1,ex,ey); g.stroke();
      if(tiefe>0){ ast(ex,ey,a-0.5+r()*0.3,l*0.65,b*0.62,tiefe-1); ast(ex,ey,a+0.35+r()*0.3,l*0.6,b*0.6,tiefe-1); } else for(let k=0;k<3;k++) bluete(g,ex+(r()-0.5)*l*0.4,ey+(r()-0.5)*l*0.4,H*(0.035+r()*0.02),r()<0.5?'#ffc8e0':'#ff9ac8','#ffe8a0'); };
    ast(0,H*0.18,0.25,W*0.22,H*0.05,3);
    for(let i=0;i<30;i++){ g.fillStyle=`rgba(255,${180+r()*60|0},${210+r()*40|0},.85)`; g.beginPath(); g.ellipse(r()*W,r()*H,H*0.012,H*0.007,r()*3,0,2*PI); g.fill(); } },
  lb_jadeader(g,W,H,r){ g.fillStyle='#0b4a2a'; g.fillRect(0,0,W,H);
    for(let i=0;i<60;i++){ const x=r()*W, y=r()*H, R=Math.max(W,H)*(0.05+r()*0.18), c=['#0e5a34','#1a7a4a','#06301a','#2a8a5a'][i%4], rg=g.createRadialGradient(x,y,0,x,y,R); rg.addColorStop(0,rgba(c,0.55)); rg.addColorStop(1,rgba(c,0)); g.fillStyle=rg; g.fillRect(x-R,y-R,2*R,2*R); }
    for(let i=0;i<14;i++){ g.strokeStyle='rgba(220,255,230,.18)'; g.lineWidth=1; g.beginPath(); let x=r()*W, y=r()*H; g.moveTo(x,y); for(let k=0;k<6;k++){ x+=(r()-0.3)*W*0.12; y+=(r()-0.5)*H*0.2; g.lineTo(x,y); } g.stroke(); }
    for(let v=0;v<3;v++){ const y0=H*(0.2+v*0.3+r()*0.1); for(const [lw,c] of [[H*0.03,'rgba(120,80,10,.6)'],[H*0.016,'#d9b45a'],[H*0.005,'#fff3c4']]){ g.strokeStyle=c; g.lineWidth=lw; g.beginPath(); g.moveTo(-10,y0); g.bezierCurveTo(W*0.3,y0-H*0.3,W*0.6,y0+H*0.25,W+10,y0-H*0.1); g.stroke(); } }
    fotoBurst(g,W*0.75,H*0.3,H*0.26,'#5cff8a','#d8ffb0','komet',r); },
  lb_eisvogel(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#0a5a6a','#063a4a','#021820']); g.fillRect(0,0,W,H);
    fotoBurst(g,W*0.72,H*0.24,H*0.24,'#5ce1ff','#3a6aff','komet',r);
    g.fillStyle='rgba(10,40,60,.75)'; g.fillRect(0,H*0.68,W,H*0.32); for(let i=0;i<30;i++){ g.strokeStyle='rgba(180,240,255,.35)'; g.lineWidth=1.5; const x=r()*W, y=H*(0.7+r()*0.28); g.beginPath(); g.ellipse(x,y,H*(0.03+r()*0.05),H*0.006,0,0,2*PI); g.stroke(); }
    g.strokeStyle='#2a1a0a'; g.lineWidth=H*0.025; g.beginPath(); g.moveTo(0,H*0.22); g.quadraticCurveTo(W*0.2,H*0.18,W*0.36,H*0.28); g.stroke();
    const x=W*0.3, y=H*0.5, s=H*0.22; g.save(); g.translate(x,y); g.rotate(0.9);
    g.fillStyle=lin(g,-s,0,s,0,['#0a4aa0','#1ab8ff','#5ce8ff']); g.beginPath(); g.ellipse(0,0,s*0.7,s*0.26,0,0,2*PI); g.fill();
    g.fillStyle='#ff8a2a'; g.beginPath(); g.ellipse(s*0.05,s*0.1,s*0.45,s*0.15,0,0,2*PI); g.fill();
    g.fillStyle='#0a6ad0'; g.beginPath(); g.moveTo(-s*0.2,-s*0.1); g.lineTo(-s*0.9,-s*0.5); g.lineTo(-s*0.5,s*0.05); g.fill();
    g.fillStyle='#1a1a1a'; g.beginPath(); g.moveTo(s*0.62,-s*0.08); g.lineTo(s*1.25,0); g.lineTo(s*0.62,s*0.08); g.fill();
    g.fillStyle='#ffffff'; g.beginPath(); g.arc(s*0.5,-s*0.08,s*0.06,0,2*PI); g.fill(); g.fillStyle='#000'; g.beginPath(); g.arc(s*0.52,-s*0.08,s*0.03,0,2*PI); g.fill(); g.restore();
    g.strokeStyle='rgba(220,250,255,.8)'; g.lineWidth=2; for(let k=0;k<3;k++){ g.beginPath(); g.ellipse(x+H*0.28,H*0.72,H*(0.04+k*0.04),H*(0.01+k*0.008),0,0,2*PI); g.stroke(); } },
  lb_glutpalmen(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#1a0402','#2a0802','#000000']); g.fillRect(0,0,W,H);
    fotoBurst(g,W*0.3,H*0.3,H*0.34,'#ff8a2a','#ffd23f','palme',r); fotoBurst(g,W*0.72,H*0.26,H*0.3,'#ff5a1a','#ff8a2a','palme',r);
    for(let i=0;i<480;i++){ const x=r()*W, y=H*(0.78+r()*0.24), R=H*(0.02+r()*0.05), c=r()<0.4?'#ffb03a':r()<0.6?'#ff5a1a':'#5a0a02', rg=g.createRadialGradient(x,y,0,x,y,R); rg.addColorStop(0,c); rg.addColorStop(1,'rgba(20,2,0,0)'); g.fillStyle=rg; g.beginPath(); g.arc(x,y,R,0,2*PI); g.fill(); }
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<120;i++){ g.fillStyle='rgba(255,160,60,.8)'; g.fillRect(r()*W,H*(0.4+r()*0.5),1.5,1.5); } g.restore(); },
  lb_saphirfaecher(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#020a2a','#06164a','#0a2a6a']); g.fillRect(0,0,W,H); sterne(g,W,H,r,180,0.4);
    for(let i=0;i<5;i++){ const x=W*(0.1+i*0.2+r()*0.05); komet(g,x,H*0.75,x+(r()-0.5)*W*0.05,H*(0.12+r()*0.18),i%2?'#c8e4ff':'#5c8dff',Math.max(1.5,H*0.012)); }
    [['#0a2a8a',0.55,3,0],['#1a5aff',0.66,2.4,1.3],['#5c8dff',0.78,3.4,2.2]].forEach(([c,y0,f,ph])=>{ g.fillStyle=c; g.beginPath(); g.moveTo(0,H); for(let u=0;u<=1.001;u+=0.01){ const s=Math.sin(u*PI*f+ph); g.lineTo(u*W,H*(y0-0.09*Math.max(0,s)*Math.max(0,s)*s+0.03*Math.sin(u*40))); } g.lineTo(W,H); g.fill();
      g.fillStyle='rgba(255,255,255,.85)'; for(let u=0;u<1;u+=0.004){ const s=Math.sin(u*PI*f+ph); if(s>0.75&&r()<0.6) g.fillRect(u*W,H*(y0-0.09*s*s*s)-r()*H*0.02,2,2); } }); },
  lb_rubinpalmen(g,W,H,r){ g.fillStyle='#2a0306'; g.fillRect(0,0,W,H); const s=H/5;
    for(let y=-1;y<6;y++) for(let x=-1;x<W/s+1;x++){ const ox=x*s+(y%2)*s/2, oy=y*s; for(const tri of [[[0,0],[s,0],[s/2,s]],[[s/2,s],[s*1.5,s],[s,0]]]){ const l=r(); g.fillStyle=`rgba(${120+l*135|0},${8+l*30|0},${20+l*30|0},.75)`; g.beginPath(); tri.forEach(([a,b],i)=>i?g.lineTo(ox+a,oy+b):g.moveTo(ox+a,oy+b)); g.fill(); } }
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(0,0,W,H);
    fotoBurst(g,W*0.32,H*0.32,H*0.38,'#ff4a4a','#ffd23f','palme',r); fotoBurst(g,W*0.74,H*0.28,H*0.3,'#ffd23f','#ff4a4a','palme',r);
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<14;i++){ const x=r()*W, y=r()*H*0.7, R=H*(0.02+r()*0.03); g.strokeStyle='rgba(255,240,220,.8)'; g.lineWidth=1.5; g.beginPath(); g.moveTo(x-R,y); g.lineTo(x+R,y); g.moveTo(x,y-R); g.lineTo(x,y+R); g.stroke(); } g.restore(); },
  lb_polarweiden(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#01060e','#03141c','#061e20']); g.fillRect(0,0,W,H); sterne(g,W,H,r,400,0.7);
    g.save(); g.globalCompositeOperation='lighter'; for(let c=0;c<4;c++){ const y0=H*(0.15+c*0.08), A=H*0.08, f=2+c*0.7, ph=c*1.7, col=[['#5cffb0','#2ad8e8'],['#5cffe8','#c85cff'],['#3aff8a','#5cffe8'],['#c85cff','#5c8dff']][c];
      for(let x=0;x<W;x+=2){ const y=y0+A*Math.sin(x/W*PI*f+ph)+A*0.4*Math.sin(x/W*PI*f*3.1), l=H*(0.25+0.15*Math.sin(x/W*PI*5+c)); g.strokeStyle=lin(g,0,y,0,y+l,[rgba(col[0],0),rgba(col[0],0.22),rgba(col[1],0.12),rgba(col[1],0)]); g.lineWidth=2; g.beginPath(); g.moveTo(x,y); g.lineTo(x,y+l); g.stroke(); } } g.restore();
    g.fillStyle='#d8ecf4'; g.beginPath(); g.moveTo(0,H); for(let u=0;u<=1.001;u+=0.05) g.lineTo(u*W,H*(0.84-0.06*Math.sin(u*7+1)-0.03*Math.sin(u*19))); g.lineTo(W,H); g.fill(); g.fillStyle='rgba(90,140,170,.5)'; g.fillRect(0,H*0.93,W,H*0.07); },
  lb_farbtiger(g,W,H,r){ g.fillStyle=lin(g,0,0,W,H,['#0e4a32','#063020','#02100a']); g.fillRect(0,0,W,H);
    for(let i=0;i<W/(H*0.11);i++){ const x=i*H*0.11+r()*H*0.05, top=r()<0.5; g.fillStyle=i%3?'#010402':'#2a0622'; g.beginPath(); const y0=top?0:H, s=top?1:-1, l=H*(0.25+r()*0.35), b=H*(0.025+r()*0.02);
      g.moveTo(x-b,y0); g.quadraticCurveTo(x+b*2,y0+s*l*0.5,x+b*0.6,y0+s*l); g.quadraticCurveTo(x+b*0.4,y0+s*l*0.5,x+b,y0); g.fill(); }
    fotoBurst(g,W*0.5,H*0.3,H*0.3,'#ff5ac8','#5cff9e','komet',r);
    for(const s of [-1,1]){ const ex=W*0.5+s*H*0.42, ey=H*0.36; g.fillStyle='#d8ff3a'; g.beginPath(); g.moveTo(ex-H*0.1,ey); g.quadraticCurveTo(ex,ey-H*0.07,ex+H*0.1,ey); g.quadraticCurveTo(ex,ey+H*0.05,ex-H*0.1,ey); g.fill(); g.fillStyle='#000'; g.beginPath(); g.ellipse(ex,ey,H*0.012,H*0.04,0,0,2*PI); g.fill(); }
    g.strokeStyle='rgba(255,90,200,.85)'; g.lineWidth=Math.max(2,H*0.014); for(let k=0;k<3;k++){ g.beginPath(); g.moveTo(W*(0.82+k*0.03),H*0.45); g.quadraticCurveTo(W*(0.86+k*0.03),H*0.6,W*(0.84+k*0.035),H*0.82); g.stroke(); } },
  lb_kronenfeuer(g,W,H,r){ const rg=g.createRadialGradient(W/2,H*0.4,0,W/2,H*0.4,Math.max(W,H)*0.7); rg.addColorStop(0,'#8a0e10'); rg.addColorStop(1,'#1a0202'); g.fillStyle=rg; g.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=4){ g.fillStyle=`rgba(0,0,0,${0.05+0.05*Math.sin(y*0.7)})`; g.fillRect(0,y,W,2); }
    fotoBurst(g,W*0.2,H*0.3,H*0.28,'#ff4a4a','#ffd23f','dahlie',r); fotoBurst(g,W*0.82,H*0.28,H*0.26,'#5c8dff','#ffd23f','dahlie',r);
    const cx=W/2, cy=H*0.3, kw=H*0.5, kh=H*0.28; g.fillStyle=lin(g,0,cy-kh,0,cy+kh*0.4,['#fff3c4','#d9b45a','#8a6a1a']); g.beginPath(); g.moveTo(cx-kw/2,cy+kh*0.3);
    for(let i=0;i<=4;i++){ const x=cx-kw/2+i*kw/4; g.lineTo(x,cy-(i%2?kh*0.55:kh)); if(i<4) g.lineTo(x+kw/8,cy-kh*0.1); } g.lineTo(cx+kw/2,cy+kh*0.3); g.closePath(); g.fill();
    ['#ff2a3a','#3a6aff','#3aff6a','#c85cff','#ff2a3a'].forEach((c,i)=>{ const x=cx-kw/2+i*kw/4; g.fillStyle=c; g.beginPath(); g.arc(x,cy-(i%2?kh*0.55:kh),kh*0.08,0,2*PI); g.fill(); g.beginPath(); g.arc(cx-kw*0.36+i*kw*0.18,cy+kh*0.12,kh*0.07,0,2*PI); g.fill(); }); },
  /* Weltuntergang: gluehender Himmel, Meteore, die Stadt brennt */
  finale(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#120202','#5a0c04','#c8360a','#2a0602']); g.fillRect(0,0,W,H); sterne(g,W,H,r,120,0.35);
    fotoBurst(g,W*0.22,H*0.3,H*0.3,'#ff3a1a','#ffd23f','dahlie',r); fotoBurst(g,W*0.78,H*0.26,H*0.34,'#ffd23f','#ff8a1c','weide',r); fotoBurst(g,W*0.52,H*0.16,H*0.22,'#ffffff','#ff5a3a','palme',r);
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<9;i++){ const x1=W*(0.05+r()*0.9), y1=H*(0.2+r()*0.4), l=H*(0.2+r()*0.3); komet(g,x1-l*0.8,y1-l,x1,y1,i%2?'#ff8a1c':'#ffd23f',Math.max(2,H*(0.01+r()*0.012))); } g.restore();
    const fg=g.createLinearGradient(0,H*0.6,0,H); fg.addColorStop(0,'rgba(255,90,20,0)'); fg.addColorStop(1,'rgba(255,120,30,.7)'); g.fillStyle=fg; g.fillRect(0,H*0.6,W,H*0.4);
    g.fillStyle='#0a0302'; let x=0; while(x<W){ const bw=H*(0.05+r()*0.1), bh=H*(0.12+r()*0.3); g.fillRect(x,H-bh,bw,bh); if(r()<0.3){ g.fillRect(x+bw*0.4,H-bh-H*0.06,bw*0.2,H*0.06); }
      for(let j=0;j<8;j++) if(r()<0.5){ g.fillStyle=r()<0.5?'#ff8a1c':'#ffd23f'; g.fillRect(x+bw*(0.15+r()*0.6),H-bh*(0.15+r()*0.75),Math.max(1,bw*0.12),Math.max(1,bw*0.12)); g.fillStyle='#0a0302'; } x+=bw+H*0.01; }
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<14;i++){ const fx=r()*W, R=H*(0.05+r()*0.08), rg=g.createRadialGradient(fx,H*0.9,0,fx,H*0.9,R); rg.addColorStop(0,'rgba(255,200,80,.8)'); rg.addColorStop(1,'rgba(255,60,10,0)'); g.fillStyle=rg; g.fillRect(fx-R,H*0.9-R,2*R,2*R); } g.restore(); },
  lb_jadekoenig(g,W,H,r){ g.fillStyle=lin(g,0,0,0,H,['#03140a','#06240e','#010603']); g.fillRect(0,0,W,H);
    fotoBurst(g,W*0.5,H*0.24,H*0.26,'#ffd23f','#5cff8a','palme',r);
    g.fillStyle='rgba(20,30,20,.85)'; for(let s=0;s<4;s++){ const bw=W*(0.3-s*0.06), bh=H*0.08; g.fillRect(W/2-bw/2,H*(0.9-s*0.08),bw,bh); }
    const gruen=['#0e5a1a','#1a7a2a','#2a9a3a','#0a3a12','#3aaa4a'];
    for(let i=0;i<26;i++){ const lft=i%2===0, x=lft?r()*W*0.3:W-r()*W*0.3, y=r()*H, l=H*(0.25+r()*0.3); blatt(g,x,y,l,l*0.28,lft?-0.6+r()*1.2:PI-0.6+r()*1.2,gruen[i%5]); }
    g.strokeStyle='#2a4a12'; g.lineWidth=Math.max(1.5,H*0.01); for(let i=0;i<6;i++){ const x=W*(0.1+r()*0.8); g.beginPath(); g.moveTo(x,0); g.bezierCurveTo(x+W*0.05,H*0.3,x-W*0.05,H*0.4,x+W*0.02,H*(0.5+r()*0.3)); g.stroke(); } }
};
/* Vorderseite: Effektbild bis an den Rand, grosser Schriftzug mit
   Metallverlauf, Schuss-Badge, Marke, Infoleiste mit F2/CE */
function overlay(k,S,eigen){ /* Badge und Marke auf die vorderste Zone rechts bzw. links (bei Stufen sonst halb auf der hinteren) */
  const Zv=eigen?[]:S.zonen.filter(z=>z.z0<=Math.min(...S.zonen.map(q=>q.z0))+1e-6), yR=Zv.length?1-Zv.reduce((a,b)=>b.x1>a.x1?b:a).hf:0, yL=Zv.length?1-Zv.reduce((a,b)=>b.x0<a.x0?b:a).hf:0;
  return (g,W,H)=>{ const a=k.a, info=produktInfo(k.t), t=k.t, ty=S.ty||0.52;
  const vg=g.createLinearGradient(0,H*0.4,0,H); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.5)'); g.fillStyle=vg; g.fillRect(0,0,W,H);
  const fs=Math.round(Math.min(H*(S.ts||0.28),W*0.2)), gr=g.createLinearGradient(0,H*ty-fs*0.5,0,H*ty+fs*0.5); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.48,hx(a.ac,0.55)); gr.addColorStop(0.52,a.ac); gr.addColorStop(1,hx(a.ac,0.25));
  nameText(g,a.title,W*0.5,H*ty,W*0.9,fs,FNT.bun,'rgba(0,0,0,.55)',null); nameText(g,a.title,W*0.5-fs*0.03,H*ty-fs*0.04,W*0.9,fs,FNT.bun,gr,'rgba(8,6,4,.92)',Math.max(3,fs*0.09),-0.06);
  nameText(g,(info.schuss?info.schuss+' SCHUSS · ':'')+String(a.sub||'').replace(/^\d+\s*Schuss\s*/i,'').toUpperCase(),W*0.5,H*ty+fs*0.72,W*0.8,Math.round(fs*0.3),FNT.bar,'#ffffff','rgba(0,0,0,.75)',2);
  if(info.schuss){ const bw=Math.min(H*0.24,W*0.14), bx=W-bw*1.2, by=H*(yR+0.05); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(bx+bw*0.05,by+bw*0.06,bw,bw*1.05); g.fillStyle='#ffffff'; g.fillRect(bx,by,bw,bw*1.05); g.fillStyle=a.ac2&&a.ac2!=='#ffffff'?dx(a.ac2,0.15):'#d8282a'; g.fillRect(bx+bw*0.06,by+bw*0.06,bw*0.88,bw*0.6);
    nameText(g,String(info.schuss),bx+bw/2,by+bw*0.37,bw*0.8,Math.round(bw*0.48),FNT.bun,'#ffffff'); nameText(g,'SCHUSS',bx+bw/2,by+bw*0.84,bw*0.84,Math.round(bw*0.2),FNT.bar,'#1b1b1b'); }
  const ln=typeof linieVon==='function'?linieVon(t):'sternwerk'; g.textAlign='left'; g.textBaseline='top'; g.fillStyle='rgba(255,255,255,.95)'; g.font=FNT.barIt(Math.max(7,Math.round(H*0.07))); g.fillText(LINIE_NAME[ln]||'STERNWERK',W*0.025,H*(yL+0.04));
  g.font=`600 ${Math.max(5,Math.round(H*0.035))}px Arial`; g.fillText(LINIE_ZUSATZ[ln]||'',W*0.025,H*(yL+0.115));
  g.fillStyle='rgba(4,6,12,.78)'; g.fillRect(0,H*0.88,W,H*0.12); g.fillStyle=a.ac; g.fillRect(0,H*0.88,W,Math.max(1,H*0.008));
  infoZeile(g,W*0.02,H*0.885,Math.min(W*0.55,H*2.6),H*0.11,info,a.ac,'#ffffff');
  const sx=W-H*0.42; siegel(g,sx,H*0.94,H*0.045,'F'+(k.cat||2),'#ffffff','#1b1b1b'); g.fillStyle='#ffffff'; g.font=`700 ${Math.max(5,Math.round(H*0.05))}px Arial`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('CE',sx+H*0.1,H*0.94);
  g.font=`600 ${Math.max(4,Math.round(H*0.026))}px Arial`; g.fillText('NEM '+info.nem+' g',sx+H*0.27,H*0.94); }; }
const motiv=k=>(g,W,H)=>MOT[k.t](g,W,H,zufallAus(hashStr(k.t+'motiv')),k);
const vorne=(k,S,eigen)=>{ const m=motiv(k), o=overlay(k,S,eigen); return (g,W,H)=>{ m(g,W,H); o(g,W,H); }; };
/* Ausschnitt aus dem Gesamtbild (Breite w, Hoehe Htot) fuer eine Flaeche
   von x0..x0+bw (Meter ab links) und y0..y0+bh (Meter ab Boden) */
const ausschnitt=(maler,w,Htot,x0,bw,y0,bh)=>(g,W,H)=>{ const FW=W*w/bw, FH=H*Htot/bh; g.save(); g.translate(-x0/w*FW,-(Htot-y0-bh)/Htot*FH); maler(g,FW,FH); g.restore(); };
/* Seite: Effektbild, Name, Warnfeld mit F2/CE, Strichcode */
function seite(k,id){ return (g,W,H)=>{ const a=k.a; MOT[k.t](g,W,H,zufallAus(hashStr(k.t+'seite'+id)),k);
  const s=Math.min(W,H); nameText(g,a.title,W/2,H*0.26,W*0.9,Math.round(Math.min(H*0.2,W*0.16)),FNT.bun,a.ac,'rgba(0,0,0,.8)',Math.max(2,s*0.02));
  g.fillStyle='rgba(250,248,240,.92)'; g.fillRect(W*0.07,H*0.55,W*0.86,H*0.4); g.fillStyle='#1b1b1b'; g.font=`700 ${Math.max(5,Math.round(s*0.075))}px Arial`; g.textAlign='center'; g.textBaseline='middle';
  g.fillText('KATEGORIE F'+(k.cat||2)+' · CE · 1.4G',W/2,H*0.6); g.font=`600 ${Math.max(4,Math.round(s*0.045))}px Arial`; g.fillText('Nur im Freien verwenden · Abstand 8 m',W/2,H*0.67);
  for(let i=0;i<4;i++){ g.fillStyle='rgba(30,30,30,.45)'; g.fillRect(W*0.12,H*(0.72+i*0.045),W*0.46,Math.max(1,H*0.012)); }
  const bx=W*0.64, bw=W*0.24; g.fillStyle='#ffffff'; g.fillRect(bx,H*0.71,bw,H*0.2); const Rn=zufallAus(hashStr(k.t)); g.fillStyle='#111'; for(let x=bx+bw*0.06;x<bx+bw*0.94;){ const b=Math.max(1,bw*0.012*(1+Math.floor(Rn()*3))); g.fillRect(x,H*0.725,b,H*0.15); x+=b+Math.max(1,bw*0.012*(1+Math.floor(Rn()*2))); } }; }
/* Oberseite einer Zone: dunkle Pappe, graue Rohrringe genau an den
   Rohren des Zuendtischs, Seidenpapier in den Effektfarben, die gruene
   Zuendschnur in der echten Zuendfolge */
function oben(k,S,zi,Z,o){ o=o||{}; return (g,W,H)=>{ const L=rohrLayout(k.t), a=k.a, x0=Z.x-Z.w/2, zb=Z.z-Z.d/2, U=x=>(x-x0)/Z.w*W, Vv=z=>(z-zb)/Z.d*H, sk=W/Z.w;
  g.fillStyle=o.grund||S.oben||'#2a2a2d'; g.fillRect(0,0,W,H); if(o.muster) o.muster(g,W,H);
  g.fillStyle=a.ac; const rb=Math.max(1,Math.min(W,H)*0.012); g.fillRect(0,0,W,rb); g.fillRect(0,H-rb,W,rb);
  const ids=L.folge.filter(i=>L.rohre[i].zone===zi);
  g.strokeStyle='#2e8b3a'; g.lineWidth=Math.max(1.2,sk*0.0025); g.lineJoin='round'; g.beginPath(); ids.forEach((i,j)=>{ const q=L.rohre[i]; j?g.lineTo(U(q.x),Vv(q.z)):g.moveTo(U(q.x),Vv(q.z)); }); g.stroke();
  const KC=o.kappe||S.kappe||[a.ac,a.ac2];
  ids.forEach((i,j)=>{ const q=L.rohre[i], x=U(q.x), y=Vv(q.z), rr=q.r*sk, kc=typeof KC==='function'?KC(j,q):KC[j%KC.length];
    const rg=g.createRadialGradient(x-rr*0.3,y-rr*0.3,rr*0.2,x,y,rr); rg.addColorStop(0,o.ring||'#dcdcdc'); rg.addColorStop(1,dx(o.ring||'#dcdcdc',0.4)); g.fillStyle=rg; g.beginPath(); g.arc(x,y,rr,0,2*PI); g.fill();
    g.fillStyle='#161414'; g.beginPath(); g.arc(x,y,rr*0.76,0,2*PI); g.fill();
    const tg=g.createRadialGradient(x-rr*0.15,y-rr*0.15,rr*0.05,x,y,rr*0.56); tg.addColorStop(0,'#ffffff'); tg.addColorStop(0.35,kc); tg.addColorStop(1,'rgba(0,0,0,.55)'); g.fillStyle=tg; g.beginPath(); g.arc(x,y,rr*0.56,0,2*PI); g.fill(); }); }; }

/* ---------- Bloecke bauen (Verpackung und Zuendtisch) ---------- */
function bloecke(t,o){ const S=BAU[t], k=neu(t), tisch=!!o.tisch, Htot=tisch?rohrHoehe(t).bh:k.h-(o.oben||0), pl=S.platte?S.platte[0]:0;
  const front=S.front?S.front(k):vorne(k,S), Z=[];
  if(pl) vbox(k,k.w,pl,k.d,0,pl/2,0,S.platte[1]);
  S.zonen.forEach((z,zi)=>{ const B=zbox(t,z,S), h=Htot*z.hf-pl, id='z'+zi; B.h=h; B.y0=pl; Z.push(B);
    if(z.ringe){ const R=Math.min(B.w,B.d)/2, mant=reg(k,'mant'+id,2*PI*R,h,(g,W,H)=>{ MOT[t](g,W,H,zufallAus(hashStr(t+'mant')),k); for(const q of [0.25,0.75]){ const bw=W*0.3; g.save(); g.translate(W*q-bw/2,0); g.beginPath(); g.rect(0,0,bw,H); g.clip(); overlay(k,S,true)(g,bw,H); g.restore(); } });
      druck(k,new THREE.CylinderGeometry(R,R,h,28,1,true,-PI/2),tm(B.x,pl+h/2,B.z),mant);
      druck(k,new THREE.CircleGeometry(R,28),tm(B.x,pl+h,B.z,-PI/2,0,0),tisch?farbe(k,'#2a2a2d'):reg(k,'oben'+id,2*R,2*R,oben(k,S,zi,{x:B.x,z:B.z,w:2*R,d:2*R},o)));
      vring(k,R+0.001,0.004,3,24,2*PI,B.x,pl+h-0.003,B.z,k.a.ac,PI/2,0,0);
      return; }
    const xl=B.x-B.w/2+k.w/2, vorn=S.karbon?reg(k,'v'+id,B.w,h,karbon(k,zi,S)):S.eigen?reg(k,'v'+id,B.w,h,vorne(k,S,true)):reg(k,'v'+id,B.w,h,ausschnitt(front,k.w,Htot,xl,B.w,pl,h));
    const randL=z.x0<1e-6||S.fuge, randR=z.x1>1-1e-6||S.fuge, sei=S.karbon?reg(k,'s'+id,B.d,h,karbon(k,-1,S)):reg(k,'s'+id,B.d,h,S.seite?S.seite(k,id):seite(k,id)), grund=farbe(k,dx(k.a.bg2||'#202020',0.1));
    kasten(k,B.w,h,B.d,tm(B.x,pl+h/2,B.z),{pz:vorn,nz:z.z1>1-1e-6||S.fuge?vorn:grund,px:randR?sei:grund,nx:randL?sei:grund,
      py:tisch?farbe(k,o.deck||'#2b2b2e'):reg(k,'o'+id,B.w,B.d,oben(k,S,zi,B,o)),ny:farbe(k,'#2a2018')}); });
  return {k,S,Z,Htot,pl,front}; }
/* Karbon-Druck (Verbundbloecke) mit Schusszahl-Etikett */
function karbon(k,zi,S){ return (g,W,H)=>{ g.fillStyle='#1e1f22'; g.fillRect(0,0,W,H); const s=Math.max(4,Math.min(W,H)/22);
  for(let y=0;y<H;y+=s) for(let x=0;x<W;x+=s){ g.fillStyle=((x+y)/s)%2?'rgba(255,255,255,.07)':'rgba(0,0,0,.3)'; g.fillRect(x,y,s*0.9,s*0.45); g.fillStyle='rgba(255,255,255,.035)'; g.fillRect(x,y+s*0.5,s*0.45,s*0.45); }
  if(zi<0) return; const L=rohrLayout(k.t), n=L.rohre.filter(q=>q.zone===zi).length, b=Math.min(W*0.2,H*0.28);
  g.fillStyle='#fbfaf6'; g.fillRect(W*0.08,H-b*1.2,b*1.25,b*0.85); g.fillStyle=k.a.ac; g.fillRect(W*0.08,H-b*1.2,b*0.12,b*0.85); nameText(g,String(n),W*0.08+b*0.68,H-b*0.78,b*1.0,Math.round(b*0.6),FNT.bun,'#1b1b1b');
  nameText(g,k.a.title,W*0.62,H-b*0.78,W*0.5,Math.round(b*0.32),FNT.bar,k.a.ac); }; }

/* ---------- Zuendtisch: Koerper in derselben Bauform ---------- */
{ const bk=buildKorpus; buildKorpus=function(t){ if(!BAU[t]) return bk(t);
    try{ const R=bloecke(t,{tisch:true}), k=R.k, bh=R.Htot;
      vzyl(k,0.0035,0.0035,0.09,6,k.w/2+0.03,bh*0.12,k.d*0.3,'#2e8b3a',0,0,PI/2.4);
      return fertig(k); }
    catch(e){ if(typeof console!=='undefined') console.warn('BAU korpus',t,e); return bk(t); } }; }

/* ---------- Verkaufsverpackungen ---------- */
const leer=k=>reg(k,'leer',0.03,0.03,(g,W,H)=>g.clearRect(0,0,W,H));
const fx=(t,f)=>t=>{ try{ const R=bloecke(t,{}); f(R); return fertig(R.k); }catch(e){ if(typeof console!=='undefined') console.warn('BAU',t,e); return null; } };
const huelle=(R,y0,y1,maler,id)=>{ const {k}=R, tt=0.0015, w=k.w+2*tt, d=k.d+2*tt, h=y1-y0, v=reg(k,'hu'+id,w,h,maler), s=reg(k,'hs'+id,d,h,maler);
  kasten(k,w,h,d,tm(0,y0+h/2,0),{pz:v,nz:v,px:s,nx:s,py:leer(k),ny:leer(k)}); k.alpha=true; };
Object.assign(V,{
  /* Glitzerregen: Goldfolien-Banderole unten um beide Stufen, Schrumpffolie */
  glitzerregen12:fx('glitzerregen12',R=>{ const {k,Z}=R, h0=Z[0].h*0.2;
    huelle(R,0.006,0.006+h0,(g,W,H)=>{ g.fillStyle=lin(g,0,0,0,H,['#8a6a1a','#fff3c4','#d9b45a','#8a6a1a']); g.fillRect(0,0,W,H); const Rn=zufallAus(4); for(let i=0;i<W*H/30;i++){ g.fillStyle=Rn()<0.5?'rgba(255,255,255,.7)':'rgba(120,80,10,.4)'; g.fillRect(Rn()*W,Rn()*H,1.5,1.5); }
      nameText(g,'✦ GLITZER-EFFEKT ✦ GOLDREGEN ✦',W/2,H/2,W*0.9,Math.round(H*0.55),FNT.bar,'#3a2604'); },'g');
    folie(k,k.w,k.h,k.d); }),
  /* Regenbogenkometen: je Saeule eine Farbkappe, weisse Wolkenplatte */
  lb_regenbogenbrunnen:fx('lb_regenbogenbrunnen',R=>{ const {k,Z}=R, F=['#ff3a2a','#ffe23f','#3ad25a','#2ad8e8','#a04aff'];
    Z.forEach((B,i)=>vbox(k,B.w+0.003,0.012,B.d+0.003,B.x,B.y0+B.h-0.012,B.z,F[i]));
    for(const s of [-1,1]) for(let j=0;j<2;j++) vkugel(k,0.018,6,4,s*(k.w/2-0.03-j*0.02),0.012,k.d/2-0.022,'#ffffff',1,0.5,0.8); }),
  /* Blitzpalmen: gelber Blitz an der hohen Wand, Kantenschutz auf der Platte */
  lb_blitzpalmen:fx('lb_blitzpalmen',R=>{ const {k,Z}=R, B=Z[2], zf=B.z+B.d/2+0.002, y0=Z[0].y0+Z[0].h, y1=B.y0+B.h;
    const P0=[[0.06,1],[-0.02,0.55],[0.03,0.55],[-0.05,0.02]].map(([x,y])=>[k.w*0.32+x*k.w*0.6,y0+(y1-y0)*(0.1+0.85*y)]);
    for(let i=0;i<P0.length-1;i++){ const [xa,ya]=P0[i], [xb,yb]=P0[i+1], L=Math.hypot(xb-xa,yb-ya); vbox(k,0.012,L+0.008,0.003,(xa+xb)/2,(ya+yb)/2,zf,'#ffd23f',0,0,Math.atan2(xa-xb,yb-ya)); }
    ecken(k,k.w,R.pl+0.03,k.d,'#ffd23f',0.03); }),
  /* Weidenhain: Displaykarton hinter den drei Karbonbloecken */
  lb_weidenhain:fx('lb_weidenhain',R=>{ const {k,front}=R, ch=k.h, cz=-k.d/2+0.012;
    kasten(k,k.w,ch,0.006,tm(0,ch/2,cz),{pz:reg(k,'disp',k.w,ch,front),nz:reg(k,'dispH',k.w,ch,seite(k,'h')),rest:farbe(k,'#e8b04a')});
    for(const s of [-1,1]) vbox(k,0.006,ch*0.4,0.06,s*(k.w/2-0.003),ch*0.2,cz+0.03,'#e8b04a'); }),
  /* Gluehwuermchen: Laternenbuegel aus Draht, Gluehwuermchen-Anhaenger */
  lb_gluehwuermchen:fx('lb_gluehwuermchen',R=>{ const {k,Z}=R, top=Z[0].h+Z[0].y0, bh=k.h-top-0.004, Rr=k.w/2-0.006;
    vring(k,Rr,0.0022,4,16,PI,0,top,0,'#c9ced6',0,0,0,1,bh/Rr,1);
    for(const s of [-1,1]) vbox(k,0.006,0.03,0.012,s*Rr,top-0.012,0,'#c9ced6');
    kordel(k,[[0,top+bh,0],[0.0,top+bh*0.55,0.004]],'#e8e0cc',0.0012); vkugel(k,0.012,8,6,0,top+bh*0.42,0.006,'#d8ff3a',1,1.3,1); vkugel(k,0.006,6,4,0,top+bh*0.55,0.006,'#2a2a1a'); }),
  /* Sternschnuppen: Silberstern auf der hohen Stufe, Silberband unten */
  lb_sternschnuppen:fx('lb_sternschnuppen',R=>{ const {k,Z}=R, B=Z[0], y=B.y0+B.h+0.004, x=B.x, z=B.z+B.d*0.32;
    for(let i=0;i<5;i++) vbox(k,0.006,0.002,0.03,x+Math.sin(i*2*PI/5)*0.012,y,z+Math.cos(i*2*PI/5)*0.012,'#e8f0ff',0,i*2*PI/5,0);
    vzyl(k,0.007,0.007,0.003,10,x,y+0.001,z,'#ffffff');
    huelle(R,0.004,0.016,(g,W,H)=>{ g.fillStyle=lin(g,0,0,0,H,['#9aa2ae','#ffffff','#c9ced6']); g.fillRect(0,0,W,H); },'s'); }),
  /* Kirschbluete: Japanpapier-Banderole, Kirschzweig mit Blueten obenauf */
  lb_kirschbluete:fx('lb_kirschbluete',R=>{ const {k,Z}=R, B=Z[0], top=B.y0+B.h, y0=B.h*0.06, y1=B.h*0.28;
    huelle(R,y0,y1,(g,W,H)=>{ g.fillStyle='#f6e4d8'; g.fillRect(0,0,W,H); const Rn=zufallAus(8); for(let i=0;i<W*H/40;i++){ g.fillStyle='rgba(160,110,80,.08)'; g.fillRect(Rn()*W,Rn()*H,2,1); }
      for(let i=0;i<W/(H*0.6);i++) bluete(g,(i+0.5)*H*0.6,H*(0.25+(i%2)*0.5),H*0.16,'rgba(255,150,190,.55)','#ffe8a0');
      g.fillStyle='#b8102a'; g.fillRect(0,0,W,H*0.08); g.fillRect(0,H*0.92,W,H*0.08); nameText(g,'桜 · KIRSCHBLÜTE · '+produktInfo(k.t).schuss+' SCHUSS',W/2,H/2,W*0.86,Math.round(H*0.42),FNT.bar,'#5a0a1a'); },'k');
    const ast=[[-k.w*0.42,top+0.006,k.d*0.3],[-k.w*0.1,top+0.01,k.d*0.05],[k.w*0.2,top+0.008,-k.d*0.12],[k.w*0.4,top+0.006,-k.d*0.3]];
    kordel(k,ast,'#3a1e10',0.004); kordel(k,[ast[1],[-k.w*0.02,top+0.012,-k.d*0.25]],'#3a1e10',0.0026); kordel(k,[ast[2],[k.w*0.3,top+0.01,k.d*0.15]],'#3a1e10',0.0024);
    [[-0.3,0.25],[-0.15,0.12],[-0.02,-0.25],[0.12,-0.05],[0.3,0.15],[0.36,-0.22],[0.22,-0.14]].forEach(([u,v],i)=>{ vkugel(k,0.011,6,4,k.w*u,top+0.013,k.d*v,i%2?'#ffc8e0':'#ff9ac8',1,0.45,1); }); }),
  /* Jadeader: Goldkanten an den hohen Saeulen */
  lb_jadeader:fx('lb_jadeader',R=>{ const {k,Z}=R; [1,2].forEach(i=>{ const B=Z[i]; mit(k,tm(B.x,0,B.z),()=>ecken(k,B.w,B.h,B.d,'#d9b45a',0.012,B.y0)); }); }),
  /* Eisvogel: Trommel mit blauem Tragegriff */
  lb_eisvogel:fx('lb_eisvogel',R=>{ const {k,Z}=R, B=Z[0], Rr=Math.min(B.w,B.d)/2, top=B.y0+B.h;
    vzyl(k,Rr+0.002,Rr+0.002,0.012,24,B.x,B.y0+0.006,B.z,'#3a6aff'); }),
  /* Glutpalmen: Glutrost mit gluehenden Schlitzen zwischen den Staemmen */
  lb_glutpalmen:fx('lb_glutpalmen',R=>{ const {k,Z}=R, y=R.pl+0.001;
    for(let i=0;i<Z.length-1;i++){ const x=(Z[i].x+Z[i].w/2+Z[i+1].x-Z[i+1].w/2)/2; for(let j=0;j<5;j++) vbox(k,0.016,0.003,0.012,x,y,-k.d*0.35+j*k.d*0.175,j%2?'#ff5a1a':'#ffb03a'); }
    Z.forEach(B=>{ vbox(k,B.w+0.006,0.006,B.d+0.006,B.x,B.y0+B.h*0.25,B.z,'#3a1a0a'); vbox(k,B.w+0.006,0.006,B.d+0.006,B.x,B.y0+B.h*0.75,B.z,'#3a1a0a'); }); }),
  /* Ozean: Wellenblende vor der niedrigen Reihe */
  lb_saphirfaecher:fx('lb_saphirfaecher',R=>{ const {k,Z,front,Htot}=R, hp=Htot*0.78, zf=k.d/2-0.003;
    const blende=reg(k,'blende',k.w,hp,(g,W,H)=>{ ausschnitt(front,k.w,Htot,0,k.w,0,hp)(g,W,H); g.save(); g.globalCompositeOperation='destination-out'; g.beginPath(); g.moveTo(0,0); g.lineTo(W,0);
      for(let u=1;u>=-0.001;u-=0.01){ const s=Math.sin(u*PI*3+0.4); g.lineTo(u*W,H*(0.2-0.16*Math.max(0,s)*s)); } g.closePath(); g.fill(); g.restore();
      g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=Math.max(2,H*0.012); g.beginPath(); for(let u=0;u<=1.001;u+=0.01){ const s=Math.sin(u*PI*3+0.4); g.lineTo(u*W,H*(0.2-0.16*Math.max(0,s)*s)+1); } g.stroke(); });
    kasten(k,k.w,hp,0.004,tm(0,hp/2,zf),{pz:blende,nz:blende,px:farbe(k,'#c8e4ff'),nx:farbe(k,'#c8e4ff'),py:leer(k),ny:farbe(k,'#0a2a6a')}); k.alpha=true; }),
  /* Rubinpalmen: abgenommener Schatullendeckel liegt schraeg hinten auf */
  lb_rubinpalmen:fx('lb_rubinpalmen',R=>{ const {k,Z,front}=R, top=Z[0].y0+Z[0].h, dh=k.h-top-0.006, lw=k.w-0.04, ld=k.d*0.52;
    const deck=reg(k,'deckel',lw,ld,(g,W,H)=>{ MOT[k.t](g,W,H,zufallAus(77),k); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,0,W,H); nameText(g,k.a.title,W/2,H*0.45,W*0.86,Math.round(H*0.32),FNT.bun,'#ffd23f','rgba(0,0,0,.85)',4);
      nameText(g,'JUWELEN-VERBUND · DECKEL ABNEHMEN · ZÜNDEN',W/2,H*0.75,W*0.8,Math.round(H*0.09),FNT.bar,'#ffffff','rgba(0,0,0,.7)',2); g.strokeStyle='#d9b45a'; g.lineWidth=Math.max(2,H*0.02); g.strokeRect(W*0.02,H*0.04,W*0.96,H*0.92); });
    const rand=reg(k,'drand',lw,dh,(g,W,H)=>{ g.fillStyle='#3a0306'; g.fillRect(0,0,W,H); g.fillStyle='#d9b45a'; g.fillRect(0,H*0.15,W,H*0.12); nameText(g,'IF YOU ARE LOOKING FOR A RUBY · THIS IS IT',W/2,H*0.62,W*0.9,Math.round(H*0.36),FNT.bar,'#ffffff'); });
    mit(k,tm(0.004,top+dh/2+0.001,-k.d/2+ld/2+0.015,0.035,0.025,0),()=>kasten(k,lw,dh,ld,tm(0,0,0),{py:deck,pz:rand,nz:rand,px:rand,nx:rand,ny:farbe(k,'#1a0204')})); }),
  /* Polarnacht: vier Lichtvorhaenge auf dunkler Platte, Eiskante oben */
  lb_polarweiden:fx('lb_polarweiden',R=>{ const {k,Z}=R; Z.forEach(B=>vbox(k,B.w+0.002,0.005,B.d+0.002,B.x,B.y0+B.h-0.0025,B.z,'#e8f6ff')); }),
  /* Farbtiger: Tragegurt quer ueber das dicke Mittelfeld, Krallen-Anhaenger */
  lb_farbtiger:fx('lb_farbtiger',R=>{ const {k,Z}=R, B=Z[1], top=B.y0+B.h;
    vbox(k,0.002,top,0.024,-k.w/2-0.001,top/2,-k.d*0.42,'#ff5ac8'); vbox(k,0.002,top,0.024,k.w/2+0.001,top/2,-k.d*0.42,'#ff5ac8'); vbox(k,k.w+0.004,0.002,0.024,0,top+0.001,-k.d*0.42,'#ff5ac8');
    kasten(k,0.07,0.09,0.002,tm(k.w/2-0.06,top*0.55,k.d/2+0.0012,0,0,0.12),{pz:reg(k,'tag',0.07,0.09,(g,W,H)=>{ g.fillStyle='#ffd23f'; g.fillRect(0,0,W,H); g.fillStyle='#000'; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(W*(0.25+i*0.2),H*0.15); g.quadraticCurveTo(W*(0.4+i*0.2),H*0.5,W*(0.3+i*0.2),H*0.85); g.lineTo(W*(0.27+i*0.2),H*0.84); g.quadraticCurveTo(W*(0.33+i*0.2),H*0.5,W*(0.22+i*0.2),H*0.16); g.fill(); }
      nameText(g,produktInfo(k.t).schuss+' SCHUSS',W/2,H*0.93,W*0.9,Math.round(H*0.1),FNT.bar,'#000'); }),rest:farbe(k,'#ffd23f')}); }),
  /* Kronenfeuer: goldener Zackenkranz rundum ueber der Oberkante */
  lb_kronenfeuer:fx('lb_kronenfeuer',R=>{ const {k,Z}=R, top=Z[0].y0+Z[0].h, kh=k.h-top-0.002, t2=0.003; k.alpha=true;
    const kr=(L)=>(g,W,H)=>{ g.fillStyle=lin(g,0,0,0,H,['#fff3c4','#d9b45a','#8a6a1a','#d9b45a']); g.fillRect(0,0,W,H); const n=Math.max(3,Math.round(L/0.09));
      ['#ff2a3a','#3a6aff','#3aff6a','#c85cff'].forEach((c,i,A)=>{ for(let j=i;j<n;j+=A.length){ g.fillStyle=c; g.beginPath(); g.arc((j+0.5)/n*W,H*0.78,H*0.07,0,2*PI); g.fill(); } });
      g.save(); g.globalCompositeOperation='destination-out'; g.beginPath(); g.moveTo(0,0); for(let j=0;j<n;j++){ g.lineTo((j+0.5)/n*W,H*0.02); g.lineTo((j+1)/n*W,H*0.5); } g.lineTo(W,0); g.closePath(); g.fill(); g.restore(); };
    const kv=reg(k,'krV',k.w,kh,kr(k.w)), ks=reg(k,'krS',k.d,kh,kr(k.d)), lr=leer(k), gd=farbe(k,'#d9b45a');
    kasten(k,k.w,kh,t2,tm(0,top+kh/2-0.004,k.d/2-t2/2),{pz:kv,nz:kv,px:gd,nx:gd,py:lr,ny:gd}); kasten(k,k.w,kh,t2,tm(0,top+kh/2-0.004,-k.d/2+t2/2),{pz:kv,nz:kv,px:gd,nx:gd,py:lr,ny:gd});
    for(const s of [-1,1]) kasten(k,t2,kh,k.d-2*t2,tm(s*(k.w/2-t2/2),top+kh/2-0.004,0),{px:ks,nx:ks,pz:gd,nz:gd,py:lr,ny:gd}); }),
  /* Weltuntergang: drei bedruckte Bloecke auf schwarzer Platte, hinten der
     volle Displaykarton mit dem Motiv, gelb-schwarze Kantenschoner,
     Tragegurt ueber den hohen Block */
  finale:t=>{ try{ const R=bloecke(t,{oben:P[t].dims[1]*0.4}), {k,front,Z}=R, ch=k.h, cz=-k.d/2+0.012, B=Z[1], top=B.y0+B.h;
      kasten(k,k.w,ch,0.006,tm(0,ch/2,cz),{pz:reg(k,'disp',k.w,ch,front),nz:reg(k,'dispH',k.w,ch,seite(k,'h')),rest:farbe(k,'#1a0604')});
      for(const s of [-1,1]) vbox(k,0.006,ch*0.45,0.08,s*(k.w/2-0.003),ch*0.225,cz+0.04,'#ffd23f');
      ecken(k,k.w,R.pl+0.04,k.d,'#ffd23f',0.04);
      vbox(k,B.w+0.004,0.002,0.03,B.x,top+0.001,B.z,'#ffd23f'); for(const s of [-1,1]) vbox(k,0.002,top-R.pl,0.03,B.x+s*(B.w/2+0.001),R.pl+(top-R.pl)/2,B.z,'#ffd23f');
      return fertig(k); }catch(e){ if(typeof console!=='undefined') console.warn('BAU finale',e); return null; } },
  /* Urwald: Lianen haengen von den Tempelstufen */
  lb_jadekoenig:fx('lb_jadekoenig',R=>{ const {k,Z}=R, B=Z[4], top=B.y0+B.h;
    [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sz],i)=>{ const x=B.x+sx*B.w/2, z=B.z+sz*B.d/2, x2=sx*(k.w/2-0.01);
      kordel(k,[[x,top,z],[x+sx*0.02,top-0.04,z+sz*0.02],[(x+x2)/2,Z[0].h*0.9,z+sz*0.05],[x2,Z[0].h*0.4,sz*(k.d/2+0.002)]],'#2a5a12',0.0025);
    }); })
});
/* Pruefhilfe (Kontaktbogen, Tests) */
try{ window.__bau={BAU,zbox:(t,i)=>zbox(t,BAU[t].zonen[i],BAU[t])}; }catch(e){}
})();
