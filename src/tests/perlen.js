/* Perlenketten und Drahtfiguren (Tom, 26.09., Weltuntergang: "sieht
   total unecht aus ... irgendein Fehler im Code"). Die Ursache war eine
   Fehlerklasse: mehrere Sterne in genau derselben Richtung mit
   gestuftem Tempo - am Himmel eine gerade Punktkette mit Leuchtspur
   zur Mitte - und flache Scheiben aus solchen Ketten.
   - PERLEN: kein Bruch schiesst vier oder mehr Sterne in dieselbe
     Richtung (auf 0,05 Grad genau - echte Ketten liegen exakt auf einem Strahl, bei 0,3 Grad fielen zufaellig zwei Paare in dieselbe Zelle). Ausgenommen sind nur Motive, bei
     denen die Linie gewollt ist, und dort nur mit Streuung.
   - RAUM: Brueche, die raeumlich sein sollen (Krone, Kronleuchter,
     Crossette, Palme, Sternschnuppen, Komet), liegen nicht in einer
     Ebene - kleinster Eigenwert der Richtungsverteilung
   - KRONE: die Krone ist keine Figur zum Zuschauer mehr (kein
     basisBlick), hat keine gleichmaessigen Punktspalten
   - SCHWEIF: Schweife sind durchgehend, keine Perlen: der Steigschweif
     einer Kugel entsteht auf der Strecke eines Bildes (vorher alle
     Funken eines Bildes auf einem Punkt - bei 30 Bildern/s eine Kette
     aus Leuchtperlen), die Sternschnuppen ziehen gleichmaessige
     Schweife statt 22 Klumpen */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1200,height:760}}); p.setDefaultTimeout(180000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, o={};
    const PSL=[bb.psHuge,bb.psBig,bb.psMid,bb.psSmall], alt=PSL.map(ps=>ps.emit);
    let log=null;
    PSL.forEach((ps,k)=>{ ps.emit=function(x,y,z,vx,vy,vz){ if(log) log.push([x,y,z,vx,vy,vz]); return alt[k].apply(this,arguments); }; });
    const P0={x:0,y:45,z:-70}, A=bb.FW.gold, B=bb.FW.violett;
    const schuss=(e,s)=>{ log=[]; try{ bb.EFF[e](P0,A,B,s||1.4); }catch(err){ log=null; return {fehler:err.message}; } const L=log; log=null; return {L}; };
    /* Richtung je Stern, nur Sterne, die in der Bruchmitte starten */
    const richtungen=L=>L.filter(q=>Math.hypot(q[0]-P0.x,q[1]-P0.y,q[2]-P0.z)<0.05).map(q=>{ const l=Math.hypot(q[3],q[4],q[5]); return l>0.5?[q[3]/l,q[4]/l,q[5]/l]:null; }).filter(Boolean);
    const kette=R=>{ const m={}; let mx=0; R.forEach(d=>{ const k=[Math.atan2(d[2],d[0]),Math.asin(Math.max(-1,Math.min(1,d[1])))].map(a=>Math.round(a/(0.05*Math.PI/180))).join(','); m[k]=(m[k]||0)+1; mx=Math.max(mx,m[k]); }); return mx; };
    const eigenMin=R=>{ if(R.length<6) return null; const C=[[0,0,0],[0,0,0],[0,0,0]]; R.forEach(d=>{ for(let i=0;i<3;i++) for(let j=0;j<3;j++) C[i][j]+=d[i]*d[j]/R.length; });
      /* kleinster Eigenwert einer symmetrischen 3x3-Matrix */
      const a=C, p1=a[0][1]**2+a[0][2]**2+a[1][2]**2, q=(a[0][0]+a[1][1]+a[2][2])/3, p2=(a[0][0]-q)**2+(a[1][1]-q)**2+(a[2][2]-q)**2+2*p1, pp=Math.sqrt(p2/6)||1e-9;
      const Bm=a.map((row,i)=>row.map((v,j)=>(v-(i===j?q:0))/pp)), det=Bm[0][0]*(Bm[1][1]*Bm[2][2]-Bm[1][2]*Bm[2][1])-Bm[0][1]*(Bm[1][0]*Bm[2][2]-Bm[1][2]*Bm[2][0])+Bm[0][2]*(Bm[1][0]*Bm[2][1]-Bm[1][1]*Bm[2][0]);
      const phi=Math.acos(Math.max(-1,Math.min(1,det/2)))/3; return +(q+2*pp*Math.cos(phi+2*Math.PI/3)).toFixed(4); };
    /* gewollte Linien: Motivbomben, deren Form aus Linien besteht */
    const MOTIV=['schneeflocke','spirale','stern','herz','smiley','schmetterling','blumenkranz','spektrum','regenbogenring','ring','doppelring','kreisel','feuerrad','saturn','ringring','zehnfach','diadem','polarstern'];
    o.ketten={}; o.fehler={};
    Object.keys(bb.EFF).forEach(e=>{ const x=schuss(e); if(x.fehler){ o.fehler[e]=x.fehler; return; } const R=richtungen(x.L); o.ketten[e]={n:R.length,max:kette(R),motiv:MOTIV.includes(e)}; });
    o.raum={};
    /* ueber fuenf Schuesse gesammelt: bei wenigen Armen (Sternschnuppen:
       6-8) schwankt ein einzelner Schuss zu stark */
    for(const e of ['krone','kronleuchter','crossette','palme','sternschnuppen','komet']){ let R=[]; for(let k=0;k<5;k++) R=R.concat(richtungen(schuss(e,1.8).L)); o.raum[e]=eigenMin(R); }
    /* Krone: keine Punktspalten - Anteil der Sterne, deren Richtung in
       einer Ebene zum Zuschauer liegt */
    { const x=schuss('krone',1.4), R=richtungen(x.L), c=bb.camera.position, n=[c.x-P0.x,c.y-P0.y,c.z-P0.z], l=Math.hypot(...n);
      o.kroneEben=+(R.filter(d=>Math.abs((d[0]*n[0]+d[1]*n[1]+d[2]*n[2])/l)<0.03).length/R.length).toFixed(3); }
    /* Sternschnuppen-Schweif: Funken je Arm entlang des Abstands von
       der Mitte, Anteil belegter 0,3-m-Abschnitte */
    { bb.run(14,0.1); /* die Brueche von oben ausbrennen lassen */ log=[]; bb.EFF.sternschnuppen(P0,A,B,1.4); const L0=log; log=null;
      const koepfe=L0.filter(q=>Math.hypot(q[0]-P0.x,q[1]-P0.y,q[2]-P0.z)<0.05).map(q=>{ const l=Math.hypot(q[3],q[4],q[5]); return [q[3]/l,q[4]/l,q[5]/l]; });
      const arme=koepfe.map(()=>[]); log=[]; bb.run(0.45,1/30); /* nur die schnelle erste Flugphase - danach liegen auch Klumpen dicht */ const L1=log; log=null;
      L1.forEach(q=>{ const d=[q[0]-P0.x,q[1]-P0.y,q[2]-P0.z], r=Math.hypot(...d); if(r<1) return; let bi=-1,bs=0.97; koepfe.forEach((k,i)=>{ const c=(k[0]*d[0]+k[1]*d[1]+k[2]*d[2])/r; if(c>bs){ bs=c; bi=i; } }); if(bi>=0) arme[bi].push(r); });
      /* Klumpung: Anteil der Schweiflaenge, der in Luecken ueber 35 cm
         liegt (alt: Klumpen mit ~1 m Luecke, Anteil ~0,8) */
      const kl=arme.filter(a=>a.length>25).map(a=>{ a.sort((x,y)=>x-y); let lu=0; for(let i=1;i<a.length;i++){ const g=a[i]-a[i-1]; if(g>0.35) lu+=g; } return lu/Math.max(0.1,a[a.length-1]-a[0]); });
      o.schnuppeArme=kl.length; o.schnuppeKlumpen=kl.length?+(kl.reduce((x,y)=>x+y,0)/kl.length).toFixed(3):null; }
    /* Steigschweif: verschiedene Ausstosspunkte je Funke, bei 30 Bildern/s */
    { bb.run(12,0.1); const n0=bb.rockets.length; bb.igniteType('kugel150'); const pk=[]; let flog=[];
      for(let i=0;i<150;i++){ log=[]; bb.run(1/30,1/30); const L=log; log=null; if(bb.rockets.length>n0) flog.push(L); else if(flog.length) break; }
      flog.slice(2,-1).forEach(L=>L.forEach(q=>pk.push(q[0].toFixed(4)+','+q[1].toFixed(4)+','+q[2].toFixed(4))));
      o.steigBilder=flog.length; o.steigFunken=pk.length; o.steigPunkte=pk.length?+(new Set(pk).size/pk.length).toFixed(3):null; }
    PSL.forEach((ps,k)=>{ ps.emit=alt[k]; });
    return o; });
  const kett=Object.entries(r.ketten).filter(([e,v])=>v.n>=8);
  const schlimm=kett.filter(([e,v])=>!v.motiv&&v.max>=4).map(([e,v])=>e+':'+v.max);
  const motivSchlimm=kett.filter(([e,v])=>v.motiv&&v.max>=12).map(([e,v])=>e+':'+v.max);
  console.log('KETTEN  ',kett.map(([e,v])=>e+':'+v.max).join(' '));
  console.log('RAUM    ',JSON.stringify(r.raum),'| Krone in Bildebene',r.kroneEben,'| Fehler',JSON.stringify(r.fehler));
  pruef('PERLEN',!schlimm.length,'Perlenketten: '+schlimm.join(', '));
  pruef('PERLEN',!motivSchlimm.length,'Motiv ohne Streuung: '+motivSchlimm.join(', '));
  pruef('PERLEN',kett.length>=40&&!Object.keys(r.fehler).length,'zu wenige Brueche geprueft oder Fehler: '+kett.length+' '+JSON.stringify(r.fehler));
  pruef('RAUM',Object.values(r.raum).every(v=>v!==null&&v>0.05),'flache Scheibe: '+JSON.stringify(r.raum));
  pruef('KRONE',r.kroneEben<0.2,'Krone liegt noch in der Bildebene: '+r.kroneEben);
  console.log('SCHWEIF ',JSON.stringify({arme:r.schnuppeArme,klumpen:r.schnuppeKlumpen,steigBilder:r.steigBilder,funken:r.steigFunken,punkte:r.steigPunkte}));
  pruef('SCHWEIF',r.schnuppeArme>=5&&r.schnuppeKlumpen<0.3,'Sternschnuppen-Schweif in Klumpen: '+JSON.stringify([r.schnuppeArme,r.schnuppeKlumpen]));
  pruef('SCHWEIF',r.steigBilder>=10&&r.steigFunken>100&&r.steigPunkte>0.9,'Steigschweif als Perlenkette: '+JSON.stringify([r.steigBilder,r.steigFunken,r.steigPunkte]));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();
