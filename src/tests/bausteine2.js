/* Gemeinsame Bausteine der Anomalie-Ueberarbeitung (Tom, 26.09. nachts:
   "jedes Produkt eine Anomalie"). Prueft Teil B:
   - EMITTER: tornado, lauffeuer, flitterbrunnen, einschlag, kessel,
     geysir (und kreisel ohne i) laufen ohne Fehler, stossen Partikel aus,
     alle Orte endlich; Menge je Sekunde, nicht je Bild; je Emitter die
     Kernzahl aus neue-effekte.md 3.1 (Hoehe, Weg, Phasen)
   - TOPF: jede Feuertopf-Sorte steigt als Saeule 10-15 m (glut tiefer),
     Tiefbruch 4-8 m
   - GLINT blitzt genau einmal, VERZWEIG teilt, HAENGEN sinkt begrenzt,
     POPS/RAUCH/REST halten ihr Budget, LICHT vergibt hoechstens die
     freien Blitzlichter (Reichweite 25 m, danach wieder 95), der Rest
     wird Bodenfleck
   - THEMEN: alle neuen Themen da, nur gueltige Farben
   - SFX: jede neue Funktion laeuft und erzeugt Klang; tick hoechstens 8
   - STEIGTON: jeder Aufstiegsklang laeuft, der Dreiklang springt
     Grundton -> grosse Terz -> Quinte */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage({viewport:{width:1000,height:700}}); p.setDefaultTimeout(300000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, o={}, F=window.__fw2;
    const {psHuge,psBig,psMid,psSmall,emitters,FW,THEMEN,FLASH,WOLKEN,sfx,ac,tonGen,randDir,rand,glint,GLINT,knisterWolke,POP,verzweig,VERZWEIG,GEFUEHRT,
      haengen,licht,LICHT,rauchball,RAUCH,bodenrest,REST,feuertopfSorte,tiefbruch}=F, PSL=[psHuge,psBig,psMid,psSmall];
    const uhr=()=>F.FW_UHR;
    bb.run(8,0.1);
    /* Mitschnitt aller Ausstoesse: Zeit, Ort, Helligkeit */
    let LOG=null; const urEmit=PSL.map(ps=>ps.emit);
    PSL.forEach((ps,k)=>{ ps.emit=function(x,y,z,vx,vy,vz,r,g,bl){ if(LOG) LOG.push([uhr(),x,y,z,Math.max(r,g,bl),k,vx,vy,vz]); return urEmit[k].apply(this,arguments); }; });
    const mit=(fn,sek,dt)=>{ LOG=[]; const t0=uhr(); fn(); bb.run(sek,dt||0.05); const L=LOG.map(e=>[e[0]-t0].concat(e.slice(1))); LOG=null; return L; };
    const endlich=L=>L.every(e=>e.slice(1,4).every(Number.isFinite));
    /* hoechster lebender Funke nahe x=X */
    const spitze=(X,Y)=>{ let m=-1e9; PSL.forEach(ps=>{ for(let i=0;i<ps.max;i++) if(ps.life[i]>0&&Math.abs(ps.pos[i*3]-X)<8) m=Math.max(m,ps.pos[i*3+1]-Y); }); return m; };
    const lauf=(k,gt,extra,dt,X)=>{ const O={x:(X||0)+((extra&&extra.x)||0),y:0,z:-40};   /* wie bodenAn: x verschiebt den Ort */ let fehler=null, top=-1e9;
      const EO=Object.assign({t:gt,k,o:O,A:FW.gold,B:FW.violett,h:1},extra||{}); let L=[]; try{ L=mit(()=>{ emitters.push(EO); },0,dt); }catch(e){ fehler=e.message; LOG=null; }
      LOG=[]; const t0=uhr()-0.0001;
      for(let s=0;s<gt+2;s+=(dt||0.05)){ try{ bb.run(dt||0.05,dt||0.05); }catch(e){ fehler=fehler||e.message; } top=Math.max(top,spitze(O.x,O.y)); }
      if(fehler){ const ix=emitters.indexOf(EO); if(ix>=0) emitters.splice(ix,1); }
      const L2=LOG.map(e=>[e[0]-t0].concat(e.slice(1))); LOG=null;
      return {L:L.concat(L2),top,fehler}; };
    /* EMITTER */
    o.em={};
    const EM=[['tornado',4,{}],['lauffeuer',1.2,{x:-0.4,bis:0.4}],['flitterbrunnen',6,{}],['einschlag',1.5,{}],['kessel',4,{}],['geysir',2,{}],['kreisel',3,{}]];
    EM.forEach(([k,gt,ex],j)=>{
      const pop0=POP.n, rauch0=RAUCH.n, vz0=VERZWEIG.n; let lichtMax=0;
      const X=j*60-200, R=lauf(k,gt,Object.assign({},ex),0.05,X);
      const L=R.L, n=L.length;
      /* dieselbe Brenndauer mit groben Bildern: Menge je Sekunde gleich? */
      const R2=lauf(k,gt,Object.assign({},ex),0.1,X+30);
      const e={n,n2:R2.L.length,top:+R.top.toFixed(2),endlich:endlich(L),fehler:R.fehler||R2.fehler,pops:POP.n-pop0,verzweig:VERZWEIG.n-vz0};
      if(k==='tornado'){ e.frueh=+Math.max(...L.filter(x=>x[0]<2.4).map(x=>x[2])).toFixed(2); }
      if(k==='lauffeuer'){ const f=L.filter(x=>x[5]===3); e.xAnf=+(f.slice(0,3).reduce((a,x)=>a+x[1],0)/3-X).toFixed(2); e.xEnd=+(f.slice(-3).reduce((a,x)=>a+x[1],0)/3-X).toFixed(2); }
      if(k==='flitterbrunnen'){ const T=6; e.tsubomi=L.filter(x=>x[0]>0.1&&x[0]<0.15*T-0.1&&x[5]!==1).length; e.matsuba=L.filter(x=>x[0]>0.45*T&&x[0]<0.75*T).length; }
      if(k==='geysir'){ e.vorlauf=L.filter(x=>x[0]<0.25&&(x[2]>1||x[7]>5)).length; }
      o.em[k]=e;
    });
    /* LICHT: der Kessel bekommt ein Licht; sechs Anfragen zugleich */
    { for(let i=0;i<6;i++) licht('probe'+i,{x:i*3,y:2,z:-30},FW.rot,2); bb.run(0.05,0.05);
      for(let i=0;i<6;i++) licht('probe'+i,{x:i*3,y:2,z:-30},FW.rot,2); bb.run(0.05,0.05);
      o.licht={vergeben:LICHT.vergeben,flecken:LICHT.fleckN,frei:FLASH.length-1,weite:Math.max(...FLASH.filter(f=>f.pool).map(f=>f.l.distance))}; bb.run(1,0.1); o.licht.danach=Math.min(...FLASH.map(f=>f.l.distance)); }
    /* TOPF */
    o.topf={};
    ['farbe','blink','knister','silber','gold','glut'].forEach((s,j)=>{ const X=300+j*40, pop0=POP.n, r0=RAUCH.n, g0=GEFUEHRT.length; let top=-1e9, gef=0, rauch=0;
      feuertopfSorte({x:X,y:0,z:-40},s,FW.rot,FW.gold,0.8);
      gef=GEFUEHRT.length-g0; rauch=RAUCH.n-r0;
      for(let t=0;t<3;t+=0.05){ bb.run(0.05,0.05); top=Math.max(top,spitze(X,0)); }
      o.topf[s]={top:+top.toFixed(2),pops:POP.n-pop0,gef,rauch}; });
    { const log=[]; bb.fwLog(log); tiefbruch({x:500,y:0,z:-40},'kugel',FW.rot,FW.gold,0.6); bb.fwLog(null); o.tief=log.map(x=>x.hoehe); bb.run(3,0.05); }
    /* GLINT: 50 Funken, alle blitzen genau bei 0,4 s */
    { const g0=GLINT.n; let vor=0, hell=0;
      const L=mit(()=>{ for(let i=0;i<50;i++){ const d=randDir(); glint(psMid,600,20,-40,d[0]*3,d[1]*3,d[2]*3,FW.gold,1,{tz:0.4}); } },0.3);
      vor=GLINT.n-g0;
      const L2=mit(()=>{},0.5);
      o.glint={vor,nach:GLINT.n-g0,hellVor:L.filter(x=>x[4]>1.5).length,hellNach:L2.filter(x=>x[4]>1.5).length,dim:+Math.max(...L.map(x=>x[4])).toFixed(2)}; }
    /* VERZWEIG: 20 Funken zu je 4 Toechtern */
    { const v0=VERZWEIG.n; const L=mit(()=>{ for(let i=0;i<20;i++){ const d=randDir(); verzweig(psMid,650,20,-40,d[0]*5,d[1]*5,d[2]*5,FW.gold,0.6,3,{n:4,tz:0.15}); } },0.4);
      o.verzweig=VERZWEIG.n-v0; o.toechter=L.filter(x=>x[5]===3&&x[0]>0.05&&Math.abs(x[1]-650)<5).length; o.eltern=L.filter(x=>x[5]===2&&x[0]<0.05).length; }
    /* HAENGEN: Scheitel, dann hoechstens 1 m/s sinken, pendeln */
    { const s=haengen(psBig,700,10,-40,0,8,0,FW.gold,6,{sink:1,k:1.2,pendel:{amp:0.5,hz:0.5}}), ys=[], xs=[];
      for(let t=0;t<5;t+=0.1){ bb.run(0.1,0.05); ys.push(s.p[1]); xs.push(s.p[0]); }
      let sink=0; for(let i=25;i<ys.length;i++) sink=Math.max(sink,(ys[i-1]-ys[i])/0.1);
      o.haengen={hoch:+(Math.max(...ys)-10).toFixed(2),sink:+sink.toFixed(2),pendel:+(Math.max(...xs.slice(20))-Math.min(...xs.slice(20))).toFixed(2),ende:+(ys[ys.length-1]-10).toFixed(2)}; }
    /* POPS: 2000 Pops in einer Sekunde verlangt */
    { bb.run(1,0.05); const p0=POP.n; knisterWolke({x:750,y:20,z:-40},2000,1,3,{leise:true}); bb.run(1.3,0.05); o.pops=POP.n-p0; }
    /* RAUCH: 30 Rauchbaelle zu je 6 Ballen */
    { for(let i=0;i<30;i++) rauchball({x:800,y:5,z:-40},{n:6,dauer:2}); o.rauch=RAUCH.n; o.wolkenTeile=WOLKEN.reduce((a,w)=>a+w.teile.length,0); bb.run(2.5,0.1); o.rauchDanach=RAUCH.n; }
    /* REST: 2000 Plaettchen, 4 s Liegezeit */
    { for(let i=0;i<2000;i++) bodenrest(['konfetti','papier','band','fleck'][i%4],rand(-1,1),0,-18+rand(-1,1),{dauer:4});
      o.rest={n:REST.n,count:REST.mesh?REST.mesh.count:-1,max:REST.max}; bb.run(2,0.1); o.rest.mitte=REST.n; bb.run(3,0.1); o.rest.danach=REST.n; }
    /* THEMEN */
    o.themen=Object.keys(THEMEN).map(t=>[t,THEMEN[t].length,THEMEN[t].every(pp=>pp.length===2&&FW[pp[0]]&&FW[pp[1]]),new Set(THEMEN[t].map(pp=>pp.join())).size===THEMEN[t].length]);
    /* SFX: jede neue Funktion erzeugt Klangquellen */
    o.sfx={};
    ac(); const Ap=AudioContext.prototype; let knoten=0; const zaehl=f=>function(){ knoten++; return f.apply(this,arguments); };
    const uo=Ap.createOscillator, ub=Ap.createBufferSource; Ap.createOscillator=zaehl(uo); Ap.createBufferSource=zaehl(ub);
    const NEU=['startknall','glasklang','klirren','eisknistern','kreischen','ratter','brummen','fauchen','bruellen','ansaugen','pling','regen','snap','plopp','ratsch','rieseln','herzton','poka','ticktack','dong','donner','tick','klick','pfeifTon','zischen','brodeln','prasseln','wumms'];
    NEU.forEach(k=>{ const k0=knoten; let f=null; try{ if(typeof sfx[k]!=='function') f='fehlt'; else { const h=sfx[k](1); if(h&&h.stop){ h.f&&h.f(600); h.stop(); } bb.run(1.2,0.1); } }catch(e){ f=e.message; }
      o.sfx[k]={knoten:knoten-k0,fehler:f}; });
    { let ja=0; for(let i=0;i<20;i++) if(sfx.tick(1)) ja++; o.tick=ja; bb.run(0.2,0.05); }
    { const h=tonGen({f:500,f2:900,am:15,rausch:0.3,vib:{hz:5,cent:20},lp:2000,dur:0.5,vol:0.02}); o.tonGen=!!(h&&h.f&&h.stop); }
    /* Aufstiegsklaenge (STEIG_TON, spaeter STEIG_KLANG der Engine) */
    o.steig={};
    const STN=F.STEIG_TON||{}, APp=AudioParam.prototype, usv=APp.setValueAtTime; let werte=[];
    APp.setValueAtTime=function(v,t){ werte.push(v); return usv.apply(this,arguments); };
    Object.keys(STN).forEach(k=>{ [{fuse:1.2,ton:3,par:{}},{fuse:1.5,ton:'fallend',par:{gleit:true}},{fuse:1.1,par:null}].forEach((rr,j)=>{
      const k0=knoten; let f=null; werte=[];
      try{ const h=STN[k](rr,1); if(h&&h.stop) h.stop(); bb.run(Math.max(0.3,rr.fuse*1.3),0.1); }catch(e){ f=e.message; }
      const w=o.steig[k]||(o.steig[k]={knoten:1e9,fehler:null});
      w.knoten=Math.min(w.knoten,knoten-k0); w.fehler=w.fehler||f;
      if(k==='dreiklang'&&j===0) w.toene=werte.filter(x=>x>1000&&x<5000).map(x=>Math.round(x)); }); });
    APp.setValueAtTime=usv;
    Ap.createOscillator=uo; Ap.createBufferSource=ub;
    PSL.forEach((ps,k)=>{ ps.emit=urEmit[k]; });
    return o; });
  console.log(JSON.stringify(r));
  const E=r.em;
  for(const k of Object.keys(E)){ const e=E[k];
    pruef('EMITTER',!e.fehler,k+' Fehler: '+e.fehler);
    pruef('EMITTER',e.n>=40,k+' stoesst kaum aus: '+e.n);
    pruef('EMITTER',e.endlich,k+' Orte nicht endlich (NaN)');
    pruef('JE SEKUNDE',Math.abs(e.n2-e.n)<=0.3*e.n+15,k+' Menge haengt am Bildtakt: '+e.n+' bei 1/20 s, '+e.n2+' bei 1/10 s'); }
  pruef('TORNADO',E.tornado.top>=7.5&&E.tornado.top<=13.5&&E.tornado.frueh<0.5,'Aufstieg '+E.tornado.top+' m, vor dem Abheben bis '+E.tornado.frueh+' m');
  pruef('LAUFFEUER',Math.abs(E.lauffeuer.xAnf+0.4)<0.25&&Math.abs(E.lauffeuer.xEnd-0.4)<0.25,'laeuft nicht von x nach bis: '+E.lauffeuer.xAnf+' -> '+E.lauffeuer.xEnd);
  pruef('FLITTER',E.flitterbrunnen.tsubomi<=3&&E.flitterbrunnen.matsuba>100&&E.flitterbrunnen.verzweig>100,'Phasen: Tsubomi '+E.flitterbrunnen.tsubomi+', Matsuba '+E.flitterbrunnen.matsuba+', verzweigt '+E.flitterbrunnen.verzweig);
  pruef('KESSEL',E.kessel.pops>=240,'Knisterpops im Kessel: '+E.kessel.pops);
  pruef('GEYSIR',E.geysir.top>=10&&E.geysir.top<=15.5&&E.geysir.vorlauf===0,'Strahl '+E.geysir.top+' m, im Vorlauf schon '+E.geysir.vorlauf+' Funken oben');
  pruef('EINSCHLAG',E.einschlag.top>0.8&&E.einschlag.top<4,'Glutfunken springen '+E.einschlag.top+' m');
  for(const s of Object.keys(r.topf)){ const t=r.topf[s], lo=s==='glut'?7.5:9.5, hi=s==='glut'?13:16.5;
    pruef('TOPF',t.top>=lo&&t.top<=hi,s+': Saeule '+t.top+' m'); }
  pruef('TOPF',r.topf.blink.gef>=10,'blink ohne gefuehrte Blinksterne: '+r.topf.blink.gef);
  pruef('TOPF',r.topf.knister.pops>=40,'knister ohne Pops: '+r.topf.knister.pops);
  pruef('TOPF',r.topf.glut.rauch>0,'glut ohne Rauch');
  pruef('TIEF',r.tief.length===1&&r.tief[0]>=4&&r.tief[0]<=8,'Tiefbruch in '+JSON.stringify(r.tief)+' m');
  pruef('GLINT',r.glint.vor===0&&r.glint.nach===50&&r.glint.hellVor===0&&r.glint.hellNach===50&&r.glint.dim<0.5,'glint: '+JSON.stringify(r.glint));
  pruef('VERZWEIG',r.verzweig===80&&r.toechter===80&&r.eltern===20,'Toechter: '+r.verzweig+' gezaehlt, '+r.toechter+' ausgestossen, Eltern '+r.eltern);
  pruef('HAENGEN',r.haengen.hoch>2&&r.haengen.sink<=1.08&&r.haengen.sink>=0.9&&r.haengen.pendel>0.4,'haengen: '+JSON.stringify(r.haengen));
  pruef('POPS',r.pops>=400&&r.pops<=780,'Budget 600/s: '+r.pops+' Pops in 1,3 s');
  pruef('RAUCH',r.rauch<=120&&r.wolkenTeile<=160&&r.rauchDanach===0,'Rauchballen '+r.rauch+', Teile '+r.wolkenTeile+', danach '+r.rauchDanach);
  pruef('REST',r.rest.n<=r.rest.max&&r.rest.count<=r.rest.max&&r.rest.n>=r.rest.max-1&&r.rest.mitte>0&&r.rest.danach===0,'Bodenrest: '+JSON.stringify(r.rest));
  pruef('LICHT',r.licht.vergeben<=r.licht.frei&&r.licht.vergeben>=Math.min(1,r.licht.frei)&&r.licht.flecken===6-r.licht.vergeben,'Lichter: '+JSON.stringify(r.licht));
  pruef('LICHT',r.licht.weite<=30&&r.licht.danach===95,'Reichweite Dauerlicht '+r.licht.weite+' m, danach '+r.licht.danach+' m (Blitz 95)');
  const NEU_TH=['pfau','sonne','pastell','spektrum','hexe','aurora','buntglas','meteor','laser','tricolore','stadt'];
  for(const t of NEU_TH) pruef('THEMEN',r.themen.some(x=>x[0]===t&&x[1]>=2),'Thema fehlt: '+t);
  for(const t of r.themen){ pruef('THEMEN',t[2],'ungueltige Farbe in '+t[0]); pruef('THEMEN',t[3],'doppeltes Paar in '+t[0]); }
  for(const k of Object.keys(r.sfx)){ const s=r.sfx[k]; pruef('SFX',!s.fehler&&s.knoten>0,k+': '+(s.fehler||'kein Klang')); }
  pruef('SFX',r.tick===8,'tick gleichzeitig: '+r.tick);
  pruef('SFX',r.tonGen,'tonGen ohne Griff');
  const SOLL_STEIG=['pfeif','tonleiter','dreiklang','pfeil','glasklang','ratter','drachenschweif','silberdrache','farbspur','brokat','rieselschweif','titanspur','ticktack','stotter','zweistufe','blasen','perlenschnur'];
  for(const k of SOLL_STEIG){ const s=r.steig[k]; pruef('STEIGTON',s&&!s.fehler&&s.knoten>0,k+': '+(s?(s.fehler||'kein Klang'):'fehlt')); }
  /* Dreiklang auf 3 Halbtoene ueber 1,6 kHz: Grundton, grosse Terz, Quinte */
  { const g=1600*Math.pow(2,3/12), t=(r.steig.dreiklang&&r.steig.dreiklang.toene)||[], da=h=>t.some(x=>Math.abs(x-g*Math.pow(2,h/12))<2);
    pruef('STEIGTON',da(0)&&da(4)&&da(7)&&!da(3)&&!da(5),'Dreiklang-Toene: '+t.join(',')); }
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();
