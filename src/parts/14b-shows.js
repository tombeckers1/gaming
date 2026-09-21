
/* =========================================================
   Choreografie: Batterien und Verbunde laufen als Show ab
   ========================================================= */
const FANDIR=Math.PI/2;                 // Fächer quer zum Blickfeld
function playShow(o,phases){
  let t=0;
  phases.forEach(ph=>{
    const n=ph.n||1, gap=ph.gap===undefined?0.45:ph.gap;
    const fixed=ph.sc===undefined?Math.floor(Math.random()*SCHEMES.length):ph.sc;
    if(ph.ground){ const st=t, A=K(ph.gA||'gold'), B=K(ph.gB||'weiss');
      later(st,()=>{ emitters.push({t:ph.gt||4,k:ph.ground,o,A,B}); sfx.fizz(distVol(o)); }); }
    for(let i=0;i<n;i++){
      const k=n>1?i/(n-1):0.5, tt=t+i*gap;
      let ang=0;
      if(ph.fan) ang=(-1+2*k)*(ph.ang||0.3);
      else if(ph.vfan) ang=(1-Math.abs(0.5-k)*2)*(ph.ang||0.3)*(i%2?1:-1);
      else if(ph.ang) ang=rand(-ph.ang,ph.ang);
      const eff=Array.isArray(ph.eff)?pick(ph.eff):(ph.eff||pick(EFF_GROSS));
      const sc=ph.sc==='each'?-1:fixed;
      const dir=ph.fan||ph.vfan?FANDIR:undefined;
      const opt={eff,sz:ph.sz||1,pw:ph.pw||0,ang,dir,sc,fuse:ph.fuse,dick:ph.dick};
      later(tt,()=>{
        if(ph.mine) mine(o,scheme(sc)[0],scheme(sc)[1],ph.mineSz||0.8);
        /* bomb: echte Kugelbombe mit Nachbruechen statt einer Rakete */
        if(ph.bomb){ const [A,B]=scheme(sc); kugelbombe(o,ph.bomb,{A,B,eff}); }
        else shot(o,opt);
      });
    }
    t+=n*gap+(ph.pause||0);
  });
  return t;
}
/* --- Drehbücher --- */
const SHOWS={
  /* Die Drehbuecher steigern sich bewusst: kleine Batterien zeigen
     einfache Kugeln und Ringe, die grossen fahren Dahlien, Pistille,
     Kamuro und am Ende Salut-Salven auf. */

  /* 16 Schuss, gut 18 Sekunden */
  batterie16:()=>[
    {n:4,gap:0.9,eff:['kugel','ring'],sz:0.8,mine:true,mineSz:0.6,pause:1.2},
    {n:4,gap:0.7,eff:'wechsel',fan:true,ang:0.32,sz:0.85,pause:1.6},
    {n:5,gap:0.65,eff:['knister','fische','kreisel','spinne'],sc:'each',sz:0.85,pause:1.4},
    {n:3,gap:0.4,eff:['chrys','palme'],sz:1.1,pw:2,pause:3.0}
  ],
  /* 25 Schuss, knapp 30 Sekunden */
  batterie25:()=>[
    {n:5,gap:0.85,eff:['kugel','stern'],sz:0.85,mine:true,pause:1.4},
    {n:6,gap:0.6,eff:'ring',fan:true,ang:0.36,sz:0.9,pause:1.6},
    {n:5,gap:0.8,eff:['blink','wechsel','strobe'],sc:'each',sz:1.0,pause:1.4},
    {n:5,gap:0.55,eff:['knister','fische','spinne'],sc:'each',sz:0.9,pause:1.5},
    {n:4,gap:0.35,eff:['chrys','brokat','palme','saturn'],sz:1.2,pw:3,pause:3.0}
  ],
  /* 36 Schuss im Faecher, gut 30 Sekunden */
  faecher:()=>[
    {n:7,gap:0.6,eff:'kugel',fan:true,ang:0.48,sz:0.9,pause:1.4},
    {n:7,gap:0.6,eff:['ring','wechsel'],fan:true,ang:-0.48,sz:0.9,pause:1.6},
    {n:9,gap:0.55,eff:['stern','herz','saturn'],vfan:true,ang:0.52,sc:'each',sz:1.0,pause:1.8},
    {n:7,gap:0.7,eff:['spinne','kreisel','fische'],fan:true,ang:0.44,sc:'each',sz:0.95,pause:1.6},
    {n:6,gap:0.4,eff:['chrys','palme','brokat','dahlie'],fan:true,ang:0.3,sz:1.25,pw:3,pause:3.5}
  ],
  /* 49 Schuss, gut 45 Sekunden */
  batterie49:()=>[
    {n:6,gap:0.8,eff:['kugel','ring','stern'],sz:0.9,mine:true,pause:1.4},
    {n:7,gap:0.5,eff:'geist',fan:true,ang:0.4,sz:0.95,pause:1.6},
    {n:6,gap:0.85,eff:['herz','doppelring','saturn'],sc:'each',sz:1.05,pause:1.4},
    {n:8,gap:0.45,eff:['knister','fische','spinne'],sc:'each',sz:0.9,pause:1.6},
    {n:6,gap:0.8,eff:['strobe','weide','blaetter'],sz:1.1,pw:2,pause:1.8},
    {n:8,gap:0.42,eff:['crossette','doppel','dahlie'],fan:true,ang:0.44,sz:1.05,pause:1.6},
    {n:8,gap:0.3,eff:['chrys','brokat','palme','pistill'],sc:'each',sz:1.3,pw:4,pause:0.6},
    {n:3,gap:0.14,eff:'salut',sz:1.0,pause:3.2}
  ],
  /* 100 Schuss, rund 80 Sekunden mit richtigem Finale */
  batterie100:()=>[
    {n:8,gap:0.8,eff:['kugel','ring'],sz:0.95,mine:true,pause:1.6},
    {n:10,gap:0.5,eff:'geist',fan:true,ang:0.42,sz:1.0,pause:1.8},
    {n:8,gap:0.9,eff:['herz','stern','saturn'],sc:'each',sz:1.1,pause:1.6},
    {n:12,gap:0.42,eff:['knister','fische','spinne'],sc:'each',sz:0.9,pause:1.4},
    {n:8,gap:0.85,eff:['strobe','weide','blaetter'],sz:1.15,pw:2,pause:2.0},
    {n:10,gap:0.5,eff:'ring',vfan:true,ang:0.48,sc:'each',sz:1.0,pause:1.6},
    {n:10,gap:0.55,eff:['crossette','doppel','dahlie','pistill'],sc:'each',sz:1.15,pause:1.4},
    {n:8,gap:0.7,eff:['brokat','palme','kamuro'],fan:true,ang:0.36,sz:1.25,pw:3,pause:1.8},
    {n:14,gap:0.35,eff:['chrys','dreifach','crossette','brokat','zeitregen'],sc:'each',sz:1.3,pw:4,pause:1.2},
    {n:12,gap:0.22,eff:['palme','weide','kamuro','chrys','pistill'],sc:'each',sz:1.55,pw:7,pause:0.8},
    {n:5,gap:0.12,eff:'salut',sz:1.1,pause:4.0}
  ],
  /* Profi-Verbund: knapp zwei Minuten, Wasserfaelle und Kugelbomben */
  profi:()=>[
    {n:8,gap:0.9,eff:'kugel',sz:1.05,mine:true,mineSz:1.2,pause:2.0},
    {n:12,gap:0.45,eff:['geist','ring'],fan:true,ang:0.44,sz:1.05,pause:2.0},
    {n:8,gap:1.0,eff:['herz','stern','saturn'],sc:'each',sz:1.2,pause:1.8},
    {n:6,gap:0.8,ground:'wasserfall',gt:10,gA:'gold',gB:'zitrone',eff:'strobe',sz:1.15,pause:2.6},
    {n:14,gap:0.4,eff:['knister','fische','spinne','kreisel'],sc:'each',sz:1.0,pause:1.6},
    {n:12,gap:0.6,eff:['doppelring','blaetter','weide','dahlie'],sz:1.3,pw:2,pause:1.4},
    /* erste Kugelbombe: ein Schuss, mehrere Brueche */
    {n:1,gap:0.5,bomb:2,pause:2.6},
    {n:14,gap:0.42,eff:'kugel',vfan:true,ang:0.52,sc:'each',sz:1.05,pause:1.8},
    {n:12,gap:0.5,eff:['crossette','doppel','pistill'],fan:true,ang:0.4,sz:1.25,pw:2,pause:2.0},
    {n:10,gap:0.7,eff:['brokat','palme','kamuro','zeitregen'],sc:'each',sz:1.4,pw:4,pause:1.6},
    {n:8,gap:0.55,ground:'wasserfall',gt:12,gA:'silber',gB:'tuerkis',eff:'dreifach',sz:1.35,pw:3,pause:2.0},
    /* zweite Kugelbombe, groesseres Kaliber */
    {n:1,gap:0.5,bomb:3,pause:3.2},
    {n:12,gap:0.45,eff:['stern','herz','doppelring','saturn'],sc:'each',sz:1.25,pause:1.6},
    {n:20,gap:0.3,eff:['chrys','dreifach','crossette','knister','brokat','dahlie'],sc:'each',sz:1.4,pw:4,pause:1.2},
    {n:16,gap:0.18,eff:['palme','weide','kamuro','chrys','pistill','zeitregen'],sc:'each',sz:1.7,pw:8,pause:0.9},
    {n:8,gap:0.11,eff:'salut',sz:1.2,pause:5.0}
  ],
  /* Sortimentskiste: kleines Programm mit Bodeneffekt */
  sortiment:()=>[
    {n:3,gap:0.9,eff:'kugel',sz:0.75,mine:true,mineSz:0.6,pause:1.2},
    {n:2,gap:1.2,ground:'fountain',gt:6,gA:'gold',gB:'rot',eff:'ring',sz:0.85,pause:1.8},
    {n:4,gap:0.8,eff:['knister','fische','spinne'],sc:'each',sz:0.85,pause:1.4},
    {n:4,gap:0.65,eff:['wechsel','kreisel','saturn'],fan:true,ang:0.34,sz:0.9,pause:1.6},
    {n:4,gap:0.45,eff:['chrys','palme','dahlie'],sz:1.15,pw:2,pause:3.0}
  ],
  raketengold:()=>[
    {n:5,gap:1.4,eff:['brokat','kamuro','weide','zeitregen','palme'],sc:'each',sz:1.3,pw:3,pause:2.5}
  ],
  roemisch:()=>[
    {n:10,gap:1.0,eff:['kugel','knister','spinne'],sc:'each',sz:0.45,pw:-5,fuse:0.8,pause:1.5}
  ]
};
function showLength(id){ const f=SHOWS[id]; if(!f) return 0; let t=0; f().forEach(p=>{ t+=(p.n||1)*(p.gap===undefined?0.45:p.gap)+(p.pause||0); }); return Math.round(t); }

/* =========================================================
   Zünden
   ========================================================= */
function igniteType(t){
  const p=P[t]; if(!p||!p.cat) return;
  const o=padOf(t), sh=p.shape;
  hype=Math.min(100,hype+p.hype); DS.burned=r2(DS.burned+costOf(t)); addXP(Math.max(1,Math.round(p.hype/3)));
  statAdd('gezuendet',1); statAdd('hype',p.hype);
  if(SHOWS[t]){ emitters.push({t:0.8,k:'fuse',o}); later(0.8,()=>playShow(o,SHOWS[t]())); return; }
  /* ----- Eigene Rezeptur: das Rezept sagt, was passiert ----- */
  if(p.rezept){
    const rz=p.rezept, tr=traegerVon(rz.traeger);
    const A=K(rz.A)||FW.gold, B=K(rz.B)||FW.weiss;
    const st=rz.eff2?[{t:0.55,eff:rz.eff2,sz:tr.kal*0.6,streu:5,A:B,B:A}]:null;
    if(tr.shape==='shell'){
      kugelbombe(o,rz.traeger==='kugel100'?2:1,{A,B,eff:rz.eff});
    } else if(tr.shape==='battery'){
      emitters.push({t:0.7,k:'fuse',o});
      for(let i=0;i<tr.schuss;i++) later(0.7+i*0.32,()=>
        shot(o,{sz:tr.kal,eff:rz.eff,A,B,ang:rand(-0.08,0.08),stufen:i===tr.schuss-1?st:null}));
    } else if(tr.shape==='cylinder'){
      const v=distVol(o);
      emitters.push({t:3.2,k:'fountain',o,A:FW.gold,B:A});
      sfx.fizz(v); later(1.6,()=>sfx.fizz(v));
      later(3.2,()=>shot(o,{pw:3,sz:tr.kal*1.2,eff:rz.eff,A,B,fuse:1.3,dick:1,stufen:st}));
    } else {
      for(let i=0;i<tr.schuss;i++) later(i*0.45,()=>
        shot(o,{pw:tr.kal>1.1?3:0,sz:tr.kal,eff:rz.eff,A,B,stufen:i===tr.schuss-1?st:null}));
    }
    return;
  }
  /* ----- Kugelbomben aus der Moerserbatterie ----- */
  if(sh==='shell'){
    const kal={kugel75:1,kugel100:2,kugel150:3}[t]||1;
    kugelbombe(o,kal);
    return;
  }
  /* ----- Sternenbrunnen: Fontaene, Komet, Bluete ----- */
  if(t==='sternenbrunnen'){
    const [A,B]=scheme(), v=distVol(o);
    /* erst die Fontaene, die den Blick nach oben zieht */
    emitters.push({t:3.4,k:'fountain',o,A:FW.gold,B:A});
    sfx.fizz(v); later(1.6,()=>sfx.fizz(v));
    /* dann schnuert sie sich zu einem Kometen zusammen */
    later(3.0,()=>{
      for(let i=0;i<Math.round(120*QUAL());i++){
        const a=Math.random()*Math.PI*2, w=rand(0.1,0.7);
        psMid.emit(o.x,o.y+0.3,o.z,Math.cos(a)*w,rand(11,17),Math.sin(a)*w,1,.86,.4,rand(0.6,1.1),5,4);
      }
      sfx.whistle(v);
    });
    later(3.4,()=>{
      shot(o,{pw:3,sz:1.35,eff:pick(['pistill','dahlie','geist','saturn','chrys']),A,B,fuse:1.35,dick:1,trail:FW.gold});
    });
    return;
  }
  /* ----- Schabernack-Edition ----- */
  if(t==='furzrakete'){
    const v=distVol(o);
    for(let i=0;i<3;i++) later(i*1.5,()=>{
      emitters.push({t:0.55,k:'fuse',o});
      later(0.55,()=>{
        emitters.push({t:1.5,k:'furzfont',o});
        sfx.pfffft(v);
        /* die Rakete selbst: langsamer Aufstieg, dann die Entladung */
        shot(o,{pw:-4,sz:1.5,eff:'furz',A:FW.braun,B:FW.sumpf,fuse:1.55,trail:FW.braun});
        later(2.0,()=>{ sfx.furz(Math.min(1.5,v*1.3)); shake=Math.max(shake,0.5*v); });
      });
    });
    return;
  }
  if(t==='heuler'){
    const v=distVol(o);
    for(let i=0;i<4;i++) later(i*0.9,()=>{
      sfx.heul(v);
      const x=o.x+rand(-1.2,1.2), z=o.z+rand(-1.2,1.2);
      const c=K(pick(['tuerkis','magenta','zitrone','limette']));
      /* aufsteigende Spirale */
      for(let k=0;k<70;k++){ const a=k*0.4, r=0.2+k*0.02;
        psMid.emit(x+Math.cos(a)*r,0.2+k*0.05,z+Math.sin(a)*r,Math.cos(a)*1.4,rand(2,4),Math.sin(a)*1.4,c[0],c[1],c[2],rand(0.7,1.4),3.2); }
      later(1.4,()=>{ smallPop(x,3.4,z,90,7,0.6,c); sfx.crack(v); });
    });
    return;
  }
  if(t==='stinkbombe'){
    const v=distVol(o);
    for(let i=0;i<6;i++) later(i*0.35+rand(0,0.15),()=>{
      const x=o.x+rand(-1.3,1.3), z=o.z+rand(-1.3,1.3);
      emitters.push({t:4.5,k:'stink',o:{x,y:0,z}});
      sfx.pfffft(v*0.5);
    });
    return;
  }
  if(sh==='sparkler'){ emitters.push({t:5,k:'spark',o}); sfx.fizz(distVol(o)); }
  else if(t==='knallerbsen'||t==='knallfrosch'){
    const n=t==='knallfrosch'?10:7;
    for(let i=0;i<n;i++) later(i*0.16+rand(0,.1),()=>{ smallPop(o.x+rand(-1.2,1.2),0.15,o.z+rand(-1.2,1.2),14,3,0.35); sfx.crack(distVol(o)*0.6); });
  }
  else if(t==='schwaermer'){
    for(let i=0;i<9;i++) later(i*0.3+rand(0,.15),()=>{
      const x=o.x+rand(-1.4,1.4), z=o.z+rand(-1.4,1.4), c=K(pick(['gold','zitrone','tuerkis','magenta','limette']));
      for(let k=0;k<40;k++){ const a=Math.random()*Math.PI*2, s=rand(1,5);
        psMid.emit(x,0.2,z,Math.cos(a)*s,rand(0.5,3.5),Math.sin(a)*s,c[0],c[1],c[2],rand(0.5,1.1),4,4); }
      sfx.whistle(distVol(o)*0.5); if(Math.random()<0.5) later(0.6,()=>sfx.crack(distVol(o)*0.5));
    });
  }
  else if(t==='wasserfall'){
    emitters.push({t:22,k:'wasserfall',o,A:FW.gold,B:FW.zitrone});
    sfx.fizz(distVol(o)); for(let i=1;i<8;i++) later(i*3,()=>sfx.fizz(distVol(o)));
  }
  else if(sh==='tubepack'){
    const KL={boeller:1,knallfrosch:0.8,kanonen:1.5,doppelschlag:1.5,grossboeller:1.3,sprengmeister:2.1,xxlpolen:3.0}[t]||1;
    emitters.push({t:1.4,k:'fuse',o});
    later(1.4,()=>{
      const v=distVol(o);
      smallPop(o.x,0.4,o.z,Math.round(60*KL+40),6*KL+2,0.6,KL>=2?FW.weiss:undefined);
      sfx.boom(Math.min(1.6,v*KL)); shake=Math.max(shake,Math.min(1.6,0.45*KL)*v);
      flash({x:o.x,y:0.8,z:o.z},KL>=2?FW.weiss:FW.bernstein,1.2*KL,0.3);
      if(KL>=2){ /* Druckwelle: Staub und Funkenkranz am Boden */
        for(let i=0;i<Math.round(90*KL);i++){ const a2=Math.random()*Math.PI*2, sp=rand(3,9)*KL;
          psMid.emit(o.x,0.14,o.z,Math.cos(a2)*sp,rand(0.2,2.2),Math.sin(a2)*sp,0.9,0.86,0.8,rand(0.5,1.3),3.5,4); }
        later(0.06,()=>sfx.boom(Math.min(1.5,v*KL*0.7)));
        later(0.35,()=>{ sfx.crack(v*0.8); }); }
      if(t==='doppelschlag') later(0.5,()=>{ smallPop(o.x,0.4,o.z,110,9,0.6); sfx.boom(v*1.3); shake=Math.max(shake,0.7*v); flash({x:o.x,y:0.8,z:o.z},FW.bernstein,1.8,0.3); });
    });
  }
  else if(t==='tisch'){
    sfx.crack(distVol(o));
    for(let i=0;i<130;i++){ const d=randDir(), c=K(pick(['gold','magenta','tuerkis','limette','rose','zitrone']));
      psMid.emit(o.x,o.y+0.15,o.z,d[0]*2.5,Math.abs(d[1])*5+2,d[2]*2.5,c[0],c[1],c[2],rand(1.8,2.8),2.2,4); }
  }
  else if(t==='vulkan'){
    const [A,B]=scheme();
    emitters.push({t:12,k:'volcano',o,A:FW.gold,B});
    sfx.fizz(distVol(o)); for(let i=1;i<6;i++) later(i*2,()=>sfx.fizz(distVol(o)));
    later(12,()=>{ mine(o,A,B,1.4); smallPop(o.x,0.6,o.z,90,8,0.7,A); sfx.boom(distVol(o));
      /* der Vulkan wirft zum Schluss einen Kometen mit Bluete aus */
      later(0.25,()=>shot(o,{pw:1,sz:1.1,eff:pick(['pistill','dahlie','saturn']),A,B,fuse:1.2})); });
  }
  else if(sh==='fountainset'){
    const [A,B]=scheme();
    emitters.push({t:8,k:'fountain',o,A:FW.gold,B:A});
    sfx.fizz(distVol(o)); later(2.5,()=>sfx.fizz(distVol(o)));
    later(5,()=>{ emitters.push({t:5,k:'fountain',o,A:B,B:FW.weiss}); sfx.fizz(distVol(o)); });
    /* zum Abschluss steigt aus jeder Fontaene noch ein Komet auf */
    for(let i=0;i<3;i++) later(9.6+i*0.4,()=>shot(o,{pw:-6,sz:0.7,eff:pick(['kugel','knister','strobe']),fuse:0.95}));
  }
  else if(sh==='rocketset'){
    /* Je hochwertiger die Rakete, desto groesser der Bruch und
       desto exklusiver die Bruchbilder. */
    const KL={raketenklein:{n:3,sz:0.85,pw:0,eff:EFF_KLEIN.concat(['chrys','blink'])},
              raketen:{n:8,sz:1.05,pw:2,eff:EFF_GROSS},
              raketengold:{n:5,sz:1.35,pw:4,eff:['brokat','kamuro','weide','zeitregen','palme']},
              gravur:{n:1,sz:1.3,pw:4,eff:['herz']}}[t]
            ||{n:3,sz:0.95,pw:0,eff:EFF_GROSS};
    for(let i=0;i<KL.n;i++) later(i*0.45,()=>shot(o,{pw:KL.pw,sz:KL.sz,eff:pick(KL.eff),sc:'each'}));
  }
  else if(sh==='battery'||sh==='fan'){
    /* Verbundfeuerwerk: Kaliber, Takt und Effektauswahl wachsen mit
       dem Produkt. Die grossen enden mit einem Schlussakkord. */
    const KL={batterie16 :{n:8, gap:0.30,sz:0.85,eff:EFF_KLEIN,faecher:false,finale:0},
              batterie25 :{n:10,gap:0.26,sz:0.95,eff:EFF_KLEIN.concat(['chrys','blaetter']),faecher:false,finale:0},
              faecher    :{n:12,gap:0.20,sz:0.95,eff:EFF_KLEIN.concat(['spinne','saturn']),faecher:true,finale:0},
              batterie49 :{n:14,gap:0.20,sz:1.05,eff:EFF_GROSS,faecher:false,finale:3},
              batterie100:{n:20,gap:0.15,sz:1.20,eff:EFF_GROSS,faecher:true,finale:5},
              profi      :{n:28,gap:0.11,sz:1.45,eff:EFF_PRO,faecher:true,finale:8}}[t]
            ||{n:8,gap:0.3,sz:0.9,eff:EFF_KLEIN,faecher:false,finale:0};
    emitters.push({t:0.7,k:'fuse',o});
    const sc=Math.floor(Math.random()*24);
    for(let i=0;i<KL.n;i++) later(0.7+i*KL.gap,()=>{
      /* Faecherbatterien streuen ueber die Breite statt senkrecht */
      const ang=KL.faecher?(i/Math.max(1,KL.n-1)-0.5)*0.5:rand(-0.05,0.05);
      shot(o,{sz:KL.sz,eff:pick(KL.eff),ang,dir:KL.faecher?0:undefined,sc:sc});
    });
    /* Schlussakkord: mehrere Schuesse auf einmal */
    if(KL.finale) later(0.7+KL.n*KL.gap+0.35,()=>{
      for(let k=0;k<KL.finale;k++) later(k*0.05,()=>
        shot(o,{sz:KL.sz*1.25,eff:pick(k%3===0?['salut']:EFF_PRO),ang:rand(-0.22,0.22),sc:sc}));
    });
  }
}
