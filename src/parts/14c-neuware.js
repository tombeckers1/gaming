/* =========================================================
   Wie die neue Ware abbrennt (Sortiment mal drei, Tom 26.09.).
   Die Daten stehen in 02e-neuware.js.

   Grundsaetze wie beim bisherigen Sortiment:
   - Batterien, Faecher, Roemische Lichter und Sortimente laufen als
     Show (SHOWS). Die Grundstufe (Steighoehe, Kaliber) kommt aus dem
     Level: je spaeter, desto hoeher und groesser. Innerhalb der Show
     steigert sich jeder Schuss (showRampe).
   - Bis Level 15 keine Profi-Bruchbilder (Dahlie, Kamuro, Brokat ...).
   - Jede Show hat ihr eigenes Drehbuch: eigene Folge von Bruchbildern
     in eigenem Farbthema - kein Produkt ist die Kopie eines anderen.
   - Raketen: eine Rakete je Zuendung, ein Bruch.
   - Fontaenen werfen keine Ladung.
   ========================================================= */

/* Grundstufe aus dem Level, angelehnt an die bisherigen Batterien
   (Level 13: pw -5, sz 0,78 - Level 24: pw 3,5, sz 1,30) */
/* Eingeklemmt zwischen die bisherigen Produkte: nie kleiner als eins
   mit niedrigerem Level, nie groesser als eins mit hoeherem - sonst
   waere eine neue Level-21-Batterie kleiner als die Donnerwand (20). */
const ALT_BASIS=Object.keys(SHOW_BASIS).filter(t=>P[t]).map(t=>({lvl:P[t].lvl,pw:SHOW_BASIS[t].pw,sz:SHOW_BASIS[t].sz}));
function neuBasis(lvl,th){
  const f={pw:-5+(lvl-13)*0.77, sz:0.78+(lvl-13)*0.047};
  for(const k of ['pw','sz']){
    const unter=ALT_BASIS.filter(b=>b.lvl<lvl).map(b=>b[k]), ueber=ALT_BASIS.filter(b=>b.lvl>lvl).map(b=>b[k]);
    if(unter.length) f[k]=Math.max(f[k],Math.max(...unter));
    if(ueber.length) f[k]=Math.min(f[k],Math.min(...ueber)); }
  return {pw:Math.round(f.pw*100)/100, sz:Math.round(f.sz*100)/100, th};
}

/* Drehbuch aus einer knappen Beschreibung. n Schuss werden auf die
   Akte verteilt (Gewicht w), frueh ruhiger, spaeter dichter.
   s: 'einzel' | 'fan' | 'vfan' | 'salve' | 'perle' | 'bomb'
   Der erste Akt kann mit einer Bodenmine beginnen (mine:true). */
function showAus(spec){
  const A=spec.akte, k=A.length, N=spec.n;
  const W=A.reduce((a,x)=>a+(x.w||1),0);
  const cnt=A.map(x=>x.s==='bomb'?(x.n||1):Math.max(1,Math.floor(N*(x.w||1)/W)));
  /* Rest auf die Akte verteilen, bis die Summe genau stimmt */
  let rest=N-cnt.reduce((a,b)=>a+b,0), i=k-1;
  if(!A.some(x=>x.s!=='bomb')) rest=0;
  while(rest!==0){ if(A[i].s!=='bomb'){ const d=rest>0?1:-1; if(cnt[i]+d>=1){ cnt[i]+=d; rest-=d; } } i=(i-1+k)%k; }
  const basis=clamp(1.15-N/320,0.32,1.0);
  const phasen=[];
  if(spec.auftakt) phasen.push(Object.assign({n:0,pause:spec.auftakt.gt-0.6},spec.auftakt));
  A.forEach((a,j)=>{
    const u=k>1?j/(k-1):1, gap=a.s==='salve'?0.09:a.s==='bomb'?0.5:a.s==='perle'?(a.gap||0.8):basis*(1.25-0.55*u);
    const ph={n:cnt[j],gap:Math.round(gap*100)/100,pause:j===k-1?(spec.schluss||3.2):(a.s==='salve'?2.2:1.2+0.6*(1-u))};
    if(a.s==='bomb'){ ph.bomb=a.kal||1; }
    else if(a.s==='perle'){ ph.perle=true; ph.wechsel=true; }
    else ph.eff=a.e;
    if(a.s==='fan'||a.s==='salve'&&a.fan){ ph.fan=true; ph.ang=a.ang||0.45*(j%2?-1:1); }
    if(a.s==='vfan'){ ph.vfan=true; ph.ang=a.ang||0.45; }
    if(a.mine){ ph.mine=true; ph.mineSz=a.mineSz||0.6; }
    if(a.wechsel) ph.wechsel=true;
    if(a.pfeif) ph.pfeif=true;
    if(a.th) ph.th=a.th;
    if(a.sz) ph.sz=a.sz;
    if(a.pw) ph.pw=a.pw;
    phasen.push(ph);
  });
  return phasen;
}
/* Die Drehbuecher. Bruchbilder bis Level 15 nur aus dem Grundvorrat,
   danach auch die grossen. Die Bruchbilder, die ein bisheriges Produkt
   als einziges zeigt (Bienen, Smiley, Schmetterling ...), bleiben bei
   ihm. */
const NEU_SHOWS={
  zauberwald:{lvl:10,th:'wald',n:10,akte:[{e:['kreisel'],w:3,mine:true,mineSz:0.35},{e:['stern'],w:3},{e:['ring','kugel'],s:'salve',w:4}]},
  jugendbox:{lvl:12,th:'eis',n:30,akte:[{e:['kugel'],w:6,mine:true,mineSz:0.45},{e:['fische','kreisel'],w:8},{e:['regenbogen'],s:'fan',w:8},{e:['ringring','wechsel'],s:'salve',w:8}],auftakt:{ground:'fountain',gt:4}},
  kinderbatterie:{lvl:4,th:'bunt',n:6,akte:[{e:['kugel'],w:2},{e:['kreisel','ring'],w:2},{e:['kugel'],s:'salve',w:2}]},
  kinderparty:{lvl:6,th:'tropen',n:12,akte:[{e:['kugel'],w:3,mine:true,mineSz:0.4},{e:['kreisel','ring'],w:3},{e:['wechsel'],s:'fan',w:3},{e:['ringring'],s:'salve',w:3}]},
  miniverbund:{lvl:8,th:'glut',n:9,akte:[{e:['kugel'],w:3},{e:['ring','kugel'],w:3},{e:['chrys'],s:'salve',w:3}]},
  glitzerregen12:{lvl:9,th:'gold',n:12,akte:[{e:['kugel'],w:3,mine:true,mineSz:0.45},{e:['farbregen'],w:4},{e:['spirale'],s:'salve',w:5}]},
  sternstaub20:{lvl:10,th:'nacht',n:20,akte:[{e:['kugel'],w:4},{e:['stern','ring'],w:6},{e:['schneeflocke'],s:'fan',w:5},{e:['stern'],s:'salve',w:5}]},
  schneeballschlacht:{lvl:10,th:'silber',n:12,akte:[{e:['kugel'],w:3},{e:['schneeflocke','ringring'],w:5},{e:['tausend'],s:'salve',w:4}]},
  heulbatterie:{lvl:11,th:'wald',n:12,akte:[{e:['ring'],w:3,pfeif:true},{e:['kugel','ring'],w:5,pfeif:true},{e:['tausend'],s:'salve',w:4,pfeif:true}]},
  pfauenrad:{lvl:11,th:'tropen',n:19,akte:[{e:['kugel'],s:'fan',w:5},{e:['palme','kreisel'],s:'vfan',w:7},{e:['doppelring'],s:'salve',fan:true,w:7}]},
  nachtfalter:{lvl:13,th:'himmel',n:36,akte:[{e:['kugel'],w:5,mine:true},{e:['geist'],w:7},{e:['spinne','fische'],s:'vfan',w:8},{e:['mehrring'],s:'salve',w:6},{e:['geist','chrys'],w:10}]},
  goldpalmen:{lvl:13,th:'gold',n:25,akte:[{e:['palme'],w:6},{e:['palme','kokosnuss'],s:'fan',w:7},{e:['strauss'],w:6},{e:['palme'],s:'salve',w:6}]},
  mondschein:{lvl:13,th:'eis',n:30,akte:[{e:['kugel'],w:5},{e:['blaetter'],w:7},{e:['saturn','ring'],w:8},{e:['blaetter'],s:'salve',w:10}]},
  knisterfaecher:{lvl:14,th:'blitz',n:24,akte:[{e:['knister'],s:'fan',w:6},{e:['kaskade'],s:'vfan',w:6},{e:['knister','ringring'],s:'fan',w:6},{e:['tausend'],s:'salve',fan:true,w:6}]},
  sternenmeer42:{lvl:15,th:'nacht',n:42,akte:[{e:['kugel'],w:6,mine:true},{e:['stern','saturn'],w:9},{e:['strauss','dreifach'],w:9},{e:['diadem'],s:'fan',w:8},{e:['stern','mehrring'],s:'salve',w:10}]},
  sternenmeer80:{lvl:16,th:'silber',n:80,akte:[{e:['kugel'],w:8,mine:true},{e:['schneeflocke','stern'],w:12},{e:['glitzerweide'],s:'vfan',w:12},{e:['strobe','ringring'],w:14},{e:['kronleuchter','glitzerweide'],w:16},{e:['salut','glitzerweide'],s:'salve',w:18}]},
  salutbatterie:{lvl:16,th:'rotweiss',n:10,akte:[{e:['salut'],w:4},{e:['salut'],s:'salve',w:6}]},
  silberwirbel:{lvl:16,th:'silber',n:30,akte:[{e:['spirale'],s:'fan',w:7},{e:['ringring'],s:'vfan',w:7},{e:['spirale','sternschnuppen'],s:'fan',w:8},{e:['ringring','spirale'],s:'salve',fan:true,w:8}]},
  regenbogenfaecher:{lvl:17,th:'bunt',n:49,akte:[{e:['regenbogen'],s:'fan',w:9},{e:['wechsel','geist'],s:'vfan',w:10},{e:['regenbogen'],s:'fan',w:10},{e:['dahlie','regenbogen'],w:10},{e:['regenbogen'],s:'salve',fan:true,w:10}]},
  familienmix:{lvl:17,th:'bunt',n:24,akte:[{e:['kugel'],w:5,mine:true,mineSz:0.7},{e:['kreisel','fische'],w:5},{e:['dahlie','ring'],w:6},{e:['palme','strauss'],s:'fan',w:8}],auftakt:{ground:'fountain',gt:5}},
  kreuzfeuer:{lvl:18,th:'rotweiss',n:42,akte:[{e:['kugel'],w:6,mine:true},{e:['crossette'],w:10},{e:['crossette','pistill'],s:'fan',w:10},{e:['crossette'],s:'salve',w:16}]},
  kometenfaecher:{lvl:18,th:'gold',n:50,akte:[{e:['komet'],s:'fan',w:10},{e:['komet','sternschnuppen'],s:'vfan',w:12},{e:['zeitregen'],w:12},{e:['komet'],s:'salve',fan:true,w:16}]},
  goldenerregen:{lvl:19,th:'gold',n:70,akte:[{e:['kugel'],w:8,mine:true},{e:['brokat'],w:12},{e:['goldvorhang','brokat'],s:'vfan',w:14},{e:['zeitregen','kamuro'],w:16},{e:['brokat'],s:'salve',w:20}],auftakt:{ground:'riesen',gt:6,gA:'gold',gB:'zitrone'}},
  donnerschlag:{lvl:19,th:'rotweiss',n:20,akte:[{e:['salut'],w:6},{e:['salut','tausend'],s:'fan',w:6},{e:['salut'],s:'salve',w:8}]},
  lichterkugeln:{lvl:19,th:'bunt',n:24,akte:[{s:'perle',w:8,gap:0.7},{s:'perle',w:8,gap:0.5},{s:'perle',w:8,gap:0.35}]},
  feuerpfau:{lvl:20,th:'tropen',n:100,akte:[{e:['kugel'],s:'fan',w:12,mine:true},{e:['palme','strauss'],s:'vfan',w:16},{e:['pistill','dahlie'],s:'fan',w:18},{e:['glitzerweide'],s:'vfan',w:18},{e:['strauss','pistill','dahlie'],w:18},{e:['palme'],s:'salve',fan:true,w:18}],auftakt:{ground:'fountain',gt:5}},
  hochzeitsfaecher:{lvl:20,th:'herz',n:36,akte:[{e:['kugel'],s:'fan',w:8},{e:['doppelring','geist'],s:'vfan',w:9},{e:['dahlie'],s:'fan',w:9},{e:['goldvorhang'],s:'salve',fan:true,w:10}]},
  nordlicht:{lvl:21,th:'wald',n:150,akte:[{e:['kugel'],w:14,mine:true},{e:['geist','schneeflocke'],w:20},{e:['strauss'],s:'vfan',w:22},{e:['pistill','dahlie'],w:24},{e:['kamuro','geist'],s:'fan',w:24},{e:['zeitregen','pistill'],w:22},{e:['geist'],s:'salve',w:24}],auftakt:{ground:'riesen',gt:6,gA:'gruen',gB:'weiss'}},
  blitzgewitter60:{lvl:21,th:'blitz',n:60,akte:[{e:['strobe'],w:10,mine:true},{e:['strobe','spirale'],s:'fan',w:12},{e:['sternschnuppen','strobe'],s:'vfan',w:14},{e:['strobe'],s:'salve',fan:true,w:24}]},
  pfeifkonzert:{lvl:22,th:'wald',n:80,akte:[{e:['ring'],s:'fan',w:14,pfeif:true},{e:['palme','spirale'],s:'vfan',w:18,pfeif:true},{e:['dahlie'],s:'fan',w:18,pfeif:true},{e:['tausend'],s:'salve',fan:true,w:30,pfeif:true}]},
  goldregen22:{lvl:22,th:'gold',n:22,akte:[{s:'perle',w:10,gap:0.6},{s:'perle',w:12,gap:0.35}]},
  sternenkaiser:{lvl:23,th:'koenig',n:250,akte:[{e:['kugel','regenbogen'],w:16,mine:true,mineSz:1.2},{e:['stern','strauss'],w:24},{e:['kronleuchter','zeitregen'],s:'vfan',w:26},{e:['pistill','dahlie','mehrring'],w:30},{e:['geist','kamuro'],s:'fan',w:30},{s:'bomb',kal:3},{e:['brokat','goldvorhang'],w:34},{e:['crossette','dreifach'],s:'fan',w:36},{e:['strauss','kamuro','dahlie','brokat'],w:30},{e:['salut'],s:'salve',w:23}]},
  kometenwand:{lvl:23,th:'glut',n:90,akte:[{e:['komet'],s:'fan',w:16},{e:['flammenregen','komet'],s:'vfan',w:18},{e:['kaskade','zeitregen'],s:'fan',w:20},{e:['komet'],s:'salve',fan:true,w:36}]},
  himmelsfaecher:{lvl:25,th:'himmel',n:180,akte:[{e:['kugel'],s:'fan',w:18,mine:true,mineSz:1.2},{e:['strauss','geist'],s:'vfan',w:24},{e:['dahlie','pistill'],s:'fan',w:28},{e:['kronleuchter','glitzerweide'],s:'vfan',w:30},{e:['kamuro','zeitregen','strauss'],s:'fan',w:36},{e:['dreifach','dahlie'],s:'salve',fan:true,w:44}],auftakt:{ground:'riesen',gt:6}},
  silvesternacht:{lvl:25,th:'bunt',n:40,akte:[{e:['kugel'],w:6,mine:true,mineSz:1.0},{e:['stern','fische'],w:6},{s:'bomb',kal:2},{e:['dahlie','strauss'],s:'fan',w:9},{e:['kronleuchter','geist'],w:9},{e:['regenbogen'],s:'salve',fan:true,w:9}],auftakt:{ground:'fountain',gt:5}},
  kugelfinale:{lvl:26,th:'koenig',n:5,akte:[{s:'bomb',kal:3},{s:'bomb',kal:3},{s:'bomb',kal:4},{s:'bomb',kal:4},{s:'bomb',kal:5}]},
  feuerperlen:{lvl:14,th:'bunt',n:16,akte:[{s:'perle',w:8,gap:0.85},{s:'perle',w:8,gap:0.55}]},
  goldperlen:{lvl:9,th:'gold',n:8,akte:[{s:'perle',w:8,gap:0.95}]}
};
Object.keys(NEU_SHOWS).forEach(t=>{ const s=NEU_SHOWS[t];
  if(!SHOW_BASIS[t]) SHOW_BASIS[t]=neuBasis(P[t]?P[t].lvl:s.lvl,s.th);
  if(!SHOWS[t]) SHOWS[t]=()=>showAus(s); });

/* Raketen: eine Rakete je Zuendung, groesser und hoeher mit dem Level */
Object.assign(RAKETEN_KL,{
  glueckrakete  :{n:1,gap:0,sz:0.85,pw:-6,th:'wald',  fuse:1.2, eff:['kreisel']},
  glitzerraketen:{n:1,gap:0,sz:0.92,pw:-4,th:'gold',  fuse:1.2, eff:['farbregen']},
  silberpfeil   :{n:1,gap:0,sz:1.0, pw:-3,th:'blitz', fuse:1.2, eff:['ringring']},
  kometenraketen:{n:1,gap:0,sz:1.05,pw:-2,th:'nacht', fuse:1.25,trail:'gold',eff:['komet']},
  farbenrausch  :{n:1,gap:0,sz:1.1, pw:-1,th:'tropen',fuse:1.25,eff:['wechsel']},
  knisterstern  :{n:1,gap:0,sz:1.36,pw:1.2,th:'eis',   fuse:1.25,eff:['spirale']},
  smaragd       :{n:1,gap:0,sz:1.38,pw:1.6,th:'wald',  fuse:1.3, eff:['stern']},
  blinkstern    :{n:1,gap:0,sz:1.42,pw:2.2,th:'blitz', fuse:1.3, eff:['strobe']},
  silberregen   :{n:1,gap:0,sz:1.46,pw:3, th:'silber',fuse:1.3, dick:1,trail:'weiss',eff:['glitzerweide']},
  kristall      :{n:1,gap:0,sz:1.5, pw:3.5,th:'eis',  fuse:1.3, dick:1,eff:['geist']},
  regenbogenkrone:{n:1,gap:0,sz:1.65,pw:4.6,th:'bunt',  fuse:1.35,dick:2,trail:'gold',eff:['regenbogen']},
  raketen50     :{n:1,gap:0,sz:1.7, pw:5, th:'bunt',  fuse:1.3, dick:1,eff:['mehrring']},
  silbermond    :{n:1,gap:0,sz:2.25,pw:9, th:'silber',fuse:1.4, dick:2,trail:'weiss',eff:['strauss']},
  feuerdrache   :{n:1,gap:0,sz:2.4, pw:11,th:'glut',  fuse:1.4, dick:2,trail:'orange',eff:['flammenregen']},
  supernova     :{n:1,gap:0,sz:2.5, pw:12,th:'himmel',fuse:1.45,dick:2,trail:'weiss',eff:['dreifach']}
});

/* Kugelbomben-Sorten: Kaliber wie die bekannten, aber ein eigenes
   Hauptbild und eigene Farben - ohne die Nachbrueche der Stammkugel */
const NEU_KUGEL={
  palmenkugel75   :{kal:1,eff:'palme',th:'wald'},
  farbenmeer75    :{kal:1,eff:'wechsel',th:'tropen'},
  kristallkugel100:{kal:2,eff:'doppelring',th:'eis',nach:[{t:0.6,eff:'ringring',sz:0.5,streu:0}]},
  goldweide100    :{kal:2,eff:'weide',th:'gold'},
  sternenstaub150 :{kal:3,eff:'strobe',th:'silber',nach:[{t:0.5,eff:'schneeflocke',sz:0.45,streu:1}]},
  sternkugel150   :{kal:3,eff:'crossette',th:'rotweiss',nach:[{t:0.9,eff:'crossette',sz:0.4,streu:4}]},
  goldkrone200    :{kal:4,eff:'kamuro',th:'gold',nach:[{t:0.08,eff:'brokat',sz:0.5,streu:0,leise:true}]},
  kaiserkrone     :{kal:5,eff:'goldvorhang',th:'koenig',nach:[{t:0.06,eff:'kamuro',sz:0.7,streu:0,leise:true},{t:1.1,eff:'glitzerweide',sz:0.5,streu:3}]}
};
function neuKugel(t,o){
  const k=NEU_KUGEL[t]; if(!k) return false;
  const [A,B]=themaPaar(k.th,0), gr=[2.1,2.7,3.3,4.0,4.8][k.kal-1];
  kugelbombe(o,k.kal,{A,B,eff:k.eff,stufen:(k.nach||[]).map(x=>Object.assign({},x,{sz:x.sz*gr,A,B}))});
  return true;
}

/* Fontaenen: Art, Dauer, Hoehe, Farben. set: mehrere nacheinander
   (versetzt), reihe: nebeneinander auf einmal. Keine Ladung. */
const NEU_FONT={
  tortenfontaene:{k:'torte',t:8,reihe:['silber','weiss','silber','weiss']},
  stroboblinker :{k:'blinker',t:12,reihe:['weiss','rot','gruen','zitrone']},
  bengalflamme  :{k:'bengal',t:6,set:['blau','violett','magenta']},
  feuerteufel   :{k:'knisterbrunnen',t:8,A:'gold',B:'orange',h:0.6},
  leuchtfontaene:{k:'fountain',t:4.5,set:['limette','zitrone','rose','tuerkis']},
  farbfontaenen :{k:'fountain',t:6,set:['magenta','gruen','blau']},
  bodenfeuer    :{k:'knisterbrunnen',t:10,A:'orange',B:'gold',h:0.45},
  zauberbrunnen :{k:'knisterbrunnen',t:20,A:'silber',B:'tuerkis',h:1},
  feuerberg     :{k:'volcano',t:15,A:'gold',B:'rot'},
  vulkanfeld    :{k:'volcano',t:8,reihe:['rot','orange','gold']},
  funkenturm    :{k:'riesen',t:15,A:'weiss',B:'gold',h:0.6},
  dreiklang     :{k:'volcano',t:7,set:['gold','magenta','tuerkis']},
  wasserspiel   :{k:'wasserfall',t:6,set:['silber','himmel','silber','tuerkis']},
  glitzerkaskade:{k:'riesen',t:20,A:'silber',B:'gold',h:0.8},
  sternfontaene :{k:'sternregen',t:25,A:'gold',B:'violett'},
  eisblume      :{k:'riesen',t:22,A:'silber',B:'weiss',h:1.2},
  goldvulkan    :{k:'volcano',t:30,A:'gold',B:'zitrone'},
  feuerwand     :{k:'volcano',t:14,reihe:['rot','orange','gold','orange','rot']},
  silberkaskade :{k:'riesen',t:22,A:'silber',B:'weiss',h:1.9},
  feuerkaskade  :{k:'riesen',t:10,set:['gold','orange','gold'],h:1.4},
  bengalfackel  :{k:'bengal',t:12,A:'rot'},
  bengalduo     :{k:'bengal',t:15,set:['rot','gruen']},
  bengalholz    :{k:'bengal',t:5,set:['rot','gruen'],klein:true},
  feuerrad      :{k:'rad',t:12,A:'gold',B:'rot'}
};
function neuFontaene(t,o){
  const f=NEU_FONT[t]; if(!f) return false;
  const v=distVol(o), H=f.h||1;
  const eins=(dt,col,dx)=>later(dt,()=>{ const o2=dx?{x:o.x+dx,y:o.y,z:o.z}:o;
    const A=K(col||f.A||'gold'), B=K(f.B||'weiss');
    emitters.push({t:f.t,k:f.k,o:o2,A,B,h:H,klein:f.klein}); sfx.fizz(v); });
  if(f.set) f.set.forEach((c,i)=>eins(i*f.t*0.92,c,0));
  else if(f.reihe) f.reihe.forEach((c,i)=>eins(i*0.35,c,(i-(f.reihe.length-1)/2)*0.28));
  else eins(0,null,0);
  /* Zischen, solange es brennt */
  const ges=(f.set?f.set.length*f.t*0.92:f.t);
  for(let s=1.6;s<ges;s+=2.2) later(s,()=>sfx.fizz(v*0.8));
  return true;
}

/* Eigene Bodenbilder der neuen Ware */
const NEU_EMIT={
  /* Tortenfontaene: kleine, dichte Silberfontaene, 30 bis 70 cm hoch */
  torte(e,dt,o){ const A=e.A||FW.silber; e.acc=(e.acc||0)+dt*260;
    for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, s=rand(0.05,0.35);
      psSmall.emit(o.x,o.y+0.12,o.z,Math.cos(a)*s,rand(1.8,3.0),Math.sin(a)*s,A[0],A[1],A[2],rand(0.35,0.7),5,4); } },
  /* Stroboskop-Blinker: glimmt und blitzt in unregelmaessigem Takt */
  blinker(e,dt,o){ const A=e.A||FW.weiss; e.acc=(e.acc||0)+dt*70;
    for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, s=rand(0.05,0.3);
      psMid.emit(o.x,o.y+0.25,o.z,Math.cos(a)*s,rand(0.3,0.9),Math.sin(a)*s,A[0]*0.35,A[1]*0.35,A[2]*0.35,rand(0.5,0.9),-0.2,0); }
    e.bl=(e.bl||0)-dt; if(e.bl<=0){ e.bl=rand(0.1,0.25); flash({x:o.x,y:o.y+0.4,z:o.z},A,2.2,0.05);
      for(let k=0;k<10;k++){ const d=randDir(); psSmall.emit(o.x,o.y+0.35,o.z,d[0]*0.6,d[1]*0.6,d[2]*0.6,A[0],A[1],A[2],0.07,0,0); } } },
  /* Fontaene mit knisternder Krone */
  knisterbrunnen(e,dt,o){ const H=e.h||1, A=e.A, B=e.B;
    for(let k=0;k<Math.round(9*H);k++){ const a=Math.random()*Math.PI*2, s=rand(0.3,1.2)*H, c=Math.random()<0.7?A:B;
      psMid.emit(o.x,o.y+0.2,o.z,Math.cos(a)*s,rand(4,6.5)*Math.sqrt(H),Math.sin(a)*s,c[0],c[1],c[2],rand(0.8,1.3),5,4); }
    const kr=2.2*H+0.4;
    for(let k=0;k<Math.round(dt*160*H);k++){ const a=Math.random()*Math.PI*2, r=rand(0,0.8)*H;
      psSmall.emit(o.x+Math.cos(a)*r,o.y+kr+rand(-0.4,0.3),o.z+Math.sin(a)*r,rand(-.4,.4),rand(-.6,.4),rand(-.4,.4),1,.95,.8,rand(0.15,0.35),2,3); }
    e.kn=(e.kn||0)-dt; if(e.kn<=0){ e.kn=rand(0.3,0.7); sfx.crackle(distVol(o)*0.4); } },
  /* Bengalfeuer: tiefes, farbiges Leuchten mit Glut und Rauch */
  bengal(e,dt,o){ const A=e.A, kl=e.klein?0.5:1;
    e.fl=(e.fl||0)-dt; if(e.fl<=0){ e.fl=0.12; flash({x:o.x,y:o.y+0.6*kl,z:o.z},A,2.4*kl,0.2); }
    for(let k=0;k<Math.round(6*kl);k++){ const a=Math.random()*Math.PI*2, s=rand(0.1,0.6);
      psMid.emit(o.x,o.y+0.35*kl,o.z,Math.cos(a)*s,rand(0.6,1.8),Math.sin(a)*s,A[0]*1.2,A[1]*1.2,A[2]*1.2,rand(0.4,0.8),-0.3,0); }
    if(Math.random()<dt*14*kl){ const a=Math.random()*Math.PI*2;
      psBig.emit(o.x,o.y+0.5*kl,o.z,Math.cos(a)*0.2,rand(0.4,0.9),Math.sin(a)*0.2,0.25,0.24,0.26,rand(2.5,3.5),-0.15,0); } },
  /* Feuerrad: Funken wirbeln tangential von einem drehenden Rad */
  rad(e,dt,o){ e.w=(e.w||0)+dt*9; const R=0.32, y=o.y+0.8;
    for(let k=0;k<3;k++){ const a=e.w+k*Math.PI*2/3, cx=Math.cos(a)*R, cy=Math.sin(a)*R, c=k%2?e.A:e.B;
      for(let q=0;q<4;q++){ const s=rand(2.5,4.5);
        psMid.emit(o.x+cx,y+cy,o.z,-Math.sin(a)*s,Math.cos(a)*s,rand(-0.3,0.3),c[0],c[1],c[2],rand(0.4,0.8),4,4); } }
    e.fz=(e.fz||0)-dt; if(e.fz<=0){ e.fz=0.8; sfx.fizz(distVol(o)*0.6); } },
  /* Sternregen: Goldfontaene, in der farbige Sterne langsam steigen */
  sternregen(e,dt,o){ const A=e.A, B=e.B;
    for(let k=0;k<10;k++){ const a=Math.random()*Math.PI*2, s=rand(0.3,1.4);
      psMid.emit(o.x,o.y+0.2,o.z,Math.cos(a)*s,rand(5,8),Math.sin(a)*s,A[0],A[1],A[2],rand(0.9,1.4),5,4); }
    e.st=(e.st||0)-dt; if(e.st<=0){ e.st=0.35; const c=Math.random()<0.5?B:FW.weiss;
      for(let k=0;k<Math.round(8*QUAL());k++){ const a=Math.random()*Math.PI*2, w=rand(0.3,1.2);
        psBig.emit(o.x,o.y+0.3,o.z,Math.cos(a)*w,rand(9,12),Math.sin(a)*w,c[0],c[1],c[2],rand(1.3,1.8),6,0); } } },
  /* Farbige Wunderkerze: e.A die Funkenfarbe */
  funken(e,dt,o){ const A=e.A||FW.gold;
    /* je Sekunde, nicht je Bild - sonst waeren es bei 30 Bildern halb so viele */
    e.acc=(e.acc||0)+dt*(e.n||7)*60;
    for(;e.acc>=1;e.acc--){ const d=randDir(), s=rand(1,2.4), dx=e.reihe?(Math.floor(Math.random()*e.reihe)-(e.reihe-1)/2)*0.12:0;
      psSmall.emit(o.x+dx,o.y+0.3,o.z,d[0]*s,d[1]*s+0.4,d[2]*s,A[0],A[1],A[2],rand(0.25,0.55),4,3); } },
  /* Pharaoschlange: graue Asche waechst langsam in die Hoehe */
  asche(e,dt,o){ e.h=(e.h||0)+dt*0.07;
    for(let k=0;k<3;k++){ const a=Math.random()*Math.PI*2, r=0.05;
      psMid.emit(o.x+Math.cos(a)*r+(e.dx||0),o.y+0.05+e.h,o.z+Math.sin(a)*r,0,rand(0.02,0.05),0,0.18,0.17,0.16,rand(3,5),0,0); }
    if(Math.random()<dt*6) psSmall.emit(o.x+(e.dx||0),o.y+0.1+e.h,o.z,0,0.1,0,1,0.55,0.2,0.3,0,0); },
  /* Bodenkreisel: tanzt im Kreis und spruehet bunte Funken */
  kreisel(e,dt,o){ e.w=(e.w||0)+dt*(2+e.i*0.4); e.r=(e.r||0.2)+dt*0.12;
    const x=o.x+Math.cos(e.w+e.i*2)*e.r*(1+e.i*0.3), z=o.z+Math.sin(e.w+e.i*2)*e.r*(1+e.i*0.3), c=e.A;
    for(let k=0;k<6;k++){ const a=Math.random()*Math.PI*2, s=rand(1.5,3.2);
      psMid.emit(x,o.y+0.08,z,Math.cos(a)*s,rand(0.3,1.2),Math.sin(a)*s,c[0],c[1],c[2],rand(0.3,0.6),5,4); } }
};

/* Ein Schwall Konfetti: bunte Blaettchen, die langsam fallen */
function konfetti(o,n,h){
  const C=['rot','gold','gruen','blau','magenta','tuerkis','zitrone'].map(K);
  /* ohne Leuchtspur: Blaettchen, keine Funken */
  const alt=SCHWEIF; SCHWEIF=0;
  for(let i=0;i<Math.round(n*QUAL());i++){ const a=Math.random()*Math.PI*2, w=rand(0.3,2.2), c=C[i%C.length];
    psMid.emit(o.x,o.y+0.2,o.z,Math.cos(a)*w,rand(2.5,h||6),Math.sin(a)*w,c[0]*0.8,c[1]*0.8,c[2]*0.8,rand(2.5,4.0),1.2,1); }
  SCHWEIF=alt;
}
/* Boeller und Kleinfeuerwerk der neuen Ware */
function neuKnall(t,o){
  const v=distVol(o), yb=o.y!==undefined?o.y:0.4, p0={x:o.x,y:yb,z:o.z};
  const lunte=(s,fn)=>{ emitters.push({t:s,k:'fuse',o}); later(s,fn); };
  if(t==='blitzknaller'){ lunte(1.0,()=>{ flash({x:o.x,y:yb+0.5,z:o.z},FW.weiss,3.2,0.12); smallPop(o.x,yb,o.z,50,6,0.3,FW.weiss); sfx.crack(v*1.3); shake=Math.max(shake,0.2*v); }); return true; }
  if(t==='knallteppich'){ lunte(1.2,()=>{ for(let i=0;i<48;i++) later(i*0.085,()=>{ const x=o.x-1.2+i*0.05+rand(-0.15,0.15), z=o.z+rand(-0.25,0.25);
      smallPop(x,yb,z,22,3.5,0.45); flash({x,y:yb+0.2,z},FW.bernstein,0.6,0.08); sfx.crack(v*0.55); }); }); return true; }
  if(t==='konfettiknaller'){ lunte(1.2,()=>{ smallPop(o.x,yb,o.z,40,5,0.4); sfx.boom(v*0.6); konfetti(p0,220,7); }); return true; }
  if(t==='goldstaubboeller'){ lunte(1.3,()=>{ smallPop(o.x,yb,o.z,60,6,0.5,FW.gold); sfx.boom(v*0.8); shake=Math.max(shake,0.3*v);
      for(let i=0;i<Math.round(260*QUAL());i++){ const d=randDir(), s=rand(0.5,3.5);
        psSmall.emit(o.x,yb+0.8,o.z,d[0]*s,Math.abs(d[1])*s+1,d[2]*s,1,.85,.35,rand(2.0,3.4),0.6,3); } }); return true; }
  if(t==='farbrauchboeller'){ const c=K(pick(['rot','blau','gruen','violett']));
    lunte(1.3,()=>{ smallPop(o.x,yb,o.z,70,7,0.5); sfx.boom(v*0.9); shake=Math.max(shake,0.35*v); flash({x:o.x,y:yb+0.4,z:o.z},c,1.4,0.25);
      for(let i=0;i<Math.round(90*QUAL());i++){ const a=Math.random()*Math.PI*2, w=rand(0.2,1.4);
        psHuge.emit(o.x+rand(-0.3,0.3),yb+0.3,o.z+rand(-0.3,0.3),Math.cos(a)*w,rand(0.5,2.2),Math.sin(a)*w,c[0]*0.22,c[1]*0.22,c[2]*0.22,rand(3.5,5.5),-0.12,0); } }); return true; }
  if(t==='partypopper'){ for(let i=0;i<3;i++) later(0.3+i*0.6,()=>{ const q={x:o.x+(i-1)*0.3,y:yb,z:o.z}; sfx.crack(v*0.5); smallPop(q.x,q.y+0.1,q.z,12,2,0.25,FW.gold); konfetti(q,110,8); }); return true; }
  if(t==='luftschlangentisch'){ lunte(0.8,()=>{ sfx.crack(v); smallPop(o.x,yb+0.1,o.z,24,3,0.3,FW.gold);
      /* Luftschlangen: je Schlange eine Richtung, die Blaettchen liegen
         auf einer Linie statt zu streuen */
      const C=['rot','gold','gruen','blau','magenta','tuerkis'].map(K), alt=SCHWEIF; SCHWEIF=0;
      for(let s2=0;s2<14;s2++){ const a=Math.random()*Math.PI*2, w=rand(0.4,1.4), vy=rand(5,6.5), c=C[s2%C.length];
        for(let j=0;j<12;j++){ const f=0.55+j*0.05; psMid.emit(o.x,yb+0.2,o.z,Math.cos(a)*w*f,vy*f,Math.sin(a)*w*f,c[0]*0.8,c[1]*0.8,c[2]*0.8,rand(2.5,3.2),1.4,1); } }
      SCHWEIF=alt; }); return true; }
  if(t==='knallbonbonxxl'){ later(0.5,()=>{ flash({x:o.x,y:yb+0.3,z:o.z},FW.gold,1.2,0.12); smallPop(o.x,yb,o.z,40,3.5,0.4,FW.gold); sfx.boom(v*0.45); konfetti(p0,320,6); }); return true; }
  if(t==='knallbonbon'){ for(let i=0;i<4;i++) later(i*0.7,()=>{ const q={x:o.x+rand(-0.5,0.5),y:yb,z:o.z+rand(-0.4,0.4)}; smallPop(q.x,q.y,q.z,14,2.5,0.3); sfx.crack(v*0.5); konfetti(q,40,3); }); return true; }
  if(t==='tischbombe'){ lunte(1.0,()=>{ sfx.crack(v); konfetti(p0,260,5.5); smallPop(o.x,yb+0.1,o.z,30,3,0.35,FW.gold); }); return true; }
  if(t==='tischfeuerwerk2'){ for(let j=0;j<3;j++) later(j*1.1,()=>{ sfx.crack(v); for(let i=0;i<110;i++){ const d=randDir(), c=i%3?FW.gold:FW.zitrone;
      psMid.emit(o.x+(j-1)*0.25,o.y+0.15,o.z,d[0]*2.2,Math.abs(d[1])*5+2,d[2]*2.2,c[0],c[1],c[2],rand(1.8,2.8),2.2,4); } }); return true; }
  if(t==='pharao'){ for(let i=0;i<4;i++) emitters.push({t:9,k:'asche',o,dx:(i-1.5)*0.14}); return true; }
  if(t==='bodenkreisel'){ const C=['limette','magenta','zitrone','tuerkis','gold','rose'];
    for(let i=0;i<6;i++) later(i*0.25,()=>emitters.push({t:5,k:'kreisel',o,i,A:K(C[i])}));
    for(let s=0;s<6;s+=0.6) later(s,()=>sfx.whistle(v*0.25)); return true; }
  /* Wunderkerzen und Leuchtstaebe: farbige Funken */
  const FUNKEN={wunderfarbe:{c:['rot','gruen','blau','magenta'],t:6},wunderherz:{c:['rose','gold'],t:5},wunderzahl:{c:['gold'],t:7,reihe:4},
    leuchtstaebe:{c:['magenta','limette','tuerkis'],t:6},wunderkerzeXXL:{c:['gold'],t:12,n:12},wunderbox:{c:['gold'],t:6,reihe:5,n:12}};
  const F=FUNKEN[t];
  if(F){ F.c.forEach((col,i)=>later(i*F.t*0.2,()=>emitters.push({t:F.t,k:'funken',o,A:K(col),reihe:F.reihe,n:F.n}))); sfx.fizz(v); return true; }
  return false;
}
/* Einstieg aus igniteType: true, wenn die Ware hier abgebrannt wurde */
function neuZuenden(t,o){
  if(!NEUWARE[t]) return false;
  return neuKugel(t,o)||neuFontaene(t,o)||neuKnall(t,o);
}
/* Brenndauer fuer die Station: so lange bleibt die Ware stehen */
function neuDauer(t){
  const f=NEU_FONT[t];
  if(f) return (f.set?f.set.length*f.t*0.92:f.t)+(f.reihe?f.reihe.length*0.35:0)+1.5;
  if(NEU_KUGEL[t]) return [3.5,3.5,4.5,5,6.5][NEU_KUGEL[t].kal-1];
  return {partypopper:4,luftschlangentisch:5,knallbonbonxxl:4,blitzknaller:3,knallteppich:6,konfettiknaller:4,goldstaubboeller:5,farbrauchboeller:7,knallbonbon:4,tischbombe:4,tischfeuerwerk2:5,
    pharao:10,bodenkreisel:7,wunderfarbe:8,wunderherz:6,wunderzahl:8,leuchtstaebe:8,wunderkerzeXXL:13,wunderbox:7}[t]||0;
}
