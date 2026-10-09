/* Hoehen und Groessen (06.10., Toms PDF vom 05.10.): Raketen ueber den
   Batterien, Kugeln alle auf einer Hoehe und deutlich groesser als jede
   Rakete. Gezuendet in der Vorfuehrung (derselbe Weg, den Tom sieht).
   - RAKETE: jede Rakete bricht ueber 36 m und ueber dem 90. Perzentil der
     Batteriebrueche bis zu ihrem Level
   - LEITER: die Raketenhoehe faellt nie mit dem Level (Furzrakete ausgenommen)
   - JUMBO: Jumbos (ab Level 19) brechen ueber 55 m
   - KUGELHOEHE: (09.10., Batterie-Runde 0b) jede Kugel bricht auf der Hoehe
     ihres Kalibers (75/100/150/200/300 mm: 95/105/120/135/150 m, +-4 m),
     Koenigsklasse ab Level 27 165 m, Himmelssturz 175 m (vorher alle 84-92 m)
   - BODEN: kein leuchtender Stern einer Kugel kommt unter 10 m (vorher
     reichten die grossen Kugeln bis 75 m unter den Boden); die Glut-
     funken des Moerserrohrs (Saeule 8 m um den Abschuss, unter 30 m)
     zaehlen nicht - Gegenprobe:
     node hoehen.js real.html alt  (alte Hoehen 86-90 m: BODEN schlaegt an)
   - BILD: in der Vorfuehrung (Blick folgt der Kugel) liegen 0,6-3 s nach dem
     Bruch mindestens 70 % der leuchtenden Sterne im Bild
   - KUGELGROSS: jede Kugel ist im Durchmesser (90 % der Sterne) mindestens
     1,3-mal so gross wie jede Rakete bis zu ihrem Level (+1) und 1,1-mal so
     gross wie die groesste Rakete ueberhaupt; KALIBER: der mittlere
     Durchmesser waechst mit dem Kaliber
   - BUDGET: keine Kugel ueber 14000 lebende Teilchen
   Aufruf: node hoehen.js real.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:400,height:300}}); p.setDefaultTimeout(3600000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const ALT=process.argv[3]==='alt';
  if(ALT) await p.evaluate(()=>{ for(const id in window.__kgHoehe.KUGEL) window.__kgHoehe.KUGEL[id].hoehe=88; });
  const r=await p.evaluate(()=>{ const bb=window.__bb, P=bb.P, PS=[bb.psHuge,bb.psBig,bb.psMid,bb.psSmall];
    const FR=new THREE.Frustum(), MX=new THREE.Matrix4(), VV=new THREE.Vector3();
    bb.vorfuehrungAn(); const L=bb.vfListe.slice(), out={rk:{},kg:{},bat:[]};
    /* Batteriebrueche: nur die Hoehe, ohne Sterne (schnell) */
    const em=PS.map(ps=>ps.emit); PS.forEach(ps=>{ ps.emit=()=>0; });
    for(const t of L){ if(bb.stationOf(t)!=='tisch'||!(bb.SHOWS[t])||t==='kugelfinale') continue;
      bb.vfStopp(); const log=[]; log.brueche=[]; bb.fwLog(log); try{ bb.vfZuenden(t); for(let s=0;s<bb.brennDauer(t)+4;s+=0.5) bb.run(0.5,0.25); }catch(e){}
      bb.fwLog(null); log.brueche.filter(x=>!x.stufe).forEach(x=>out.bat.push([P[t].lvl,x.y])); }
    PS.forEach((ps,i)=>{ ps.emit=em[i]; });
    for(const t of L){ const sh=P[t].shape; if(sh!=='rocketset'&&sh!=='shell') continue;
      bb.vfStopp(); for(let i=0;i<6;i++) bb.run(0.25,0.05);
      const log=[]; log.brueche=[]; bb.fwLog(log); bb.vfZuenden(t);
      let br=null, rad=0, maxN=0, tief=1e9, inB=0, allB=0; const D=Math.min(30,bb.brennDauer(t)+4), KG=sh==='shell';
      for(let s=0;s<D;s+=0.1){ bb.run(0.1,0.05); let n=0; PS.forEach(ps=>n+=ps.n||0); maxN=Math.max(maxN,n);
        if(!br) br=log.brueche.find(x=>!x.stufe)||null;
        /* Kugeln: tiefster leuchtender Stern seit dem Bruch (ohne die Steigspur)
           und Anteil im Bild (0,6-3 s nach dem Bruch) */
        if(KG&&br&&bb.fwUhr-br.t>0.3){ const seit=bb.fwUhr-br.t, cam=bb.camera; cam.updateMatrixWorld(); MX.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse); FR.setFromProjectionMatrix(MX);
          for(const ps of PS) for(let k=0;k<ps.max;k++){ if(ps.life[k]<=0||ps.maxl[k]-ps.life[k]>seit+0.05) continue; const j=k*3;
            if(Math.max(ps.base[j],ps.base[j+1],ps.base[j+2])*ps.life[k]/ps.maxl[k]<0.12) continue;
            if(ps.pos[j+1]<30&&Math.hypot(ps.pos[j]-br.x,ps.pos[j+2]-br.z)<8) continue;   /* Moerserglut */
            tief=Math.min(tief,ps.pos[j+1]); if(seit>0.6&&seit<3){ allB++; VV.set(ps.pos[j],ps.pos[j+1],ps.pos[j+2]); if(FR.containsPoint(VV)) inB++; } } }
        if(br&&bb.fwUhr-br.t>0.3&&bb.fwUhr-br.t<4.5){ const d=[];
          for(const ps of PS) for(let k=0;k<ps.max;k++){ if(ps.life[k]<=0) continue; const j=k*3;
            /* Helligkeit ohne Flackern/Blinken: Grundfarbe mal Restbrenndauer */
            if(Math.max(ps.base[j],ps.base[j+1],ps.base[j+2])*ps.life[k]/ps.maxl[k]<0.12) continue;
            /* 09.10.: Kugeln brechen jetzt 95-175 m hoch - wie bisher zaehlt nur, was
               hoechstens 40 m unter dem Bruch leuchtet (vorher 0,55 x 88 m) */
            const y=ps.pos[j+1]; if(y<(sh==='shell'?br.y-40:br.y*0.55)) continue; d.push(Math.hypot(ps.pos[j]-br.x,y-br.y,ps.pos[j+2]-br.z)); }
          if(d.length>30){ d.sort((a,c)=>a-c); rad=Math.max(rad,d[Math.floor(d.length*0.9)]); } } }
      bb.fwLog(null);
      const o={lvl:P[t].lvl,h:br?+br.y.toFixed(1):null,d:+(2*rad).toFixed(1),maxN};
      if(KG){ o.tief=+tief.toFixed(1); o.imBild=allB?+(inB/allB).toFixed(2):null; }
      if(sh==='rocketset') out.rk[t]=o; else { o.kal=bb.moerserRohr(t); o.mm=(bb.P[t].dims||[0.1])[0]; out.kg[t]=o; } }
    return out; });
  const mangel=[]; const pruef=(n,ok,w)=>{ if(!ok) mangel.push(n+': '+w); };
  const bat=r.bat;
  console.log('BATTERIEN',bat.length,'Brueche, Median',bat.map(x=>x[1]).sort((a,c)=>a-c)[Math.floor(bat.length/2)]);
  const rk=Object.entries(r.rk).sort((a,c)=>a[1].lvl-c[1].lvl);
  for(const [t,o] of rk){ const bis=bat.filter(x=>x[0]<=o.lvl).map(x=>x[1]).sort((a,c)=>a-c), p90=bis.length?bis[Math.floor(bis.length*0.9)]:0;
    console.log('RAKETE',t.padEnd(18),JSON.stringify(o),'Batterie-P90',p90);
    pruef('RAKETE',o.h>36&&o.h>p90,`${t} bricht bei ${o.h} m (Batterien bis L${o.lvl}: P90 ${p90} m)`);
    if(o.lvl>=19&&t!=='furzrakete') pruef('JUMBO',o.h>55,`${t} (Jumbo) nur ${o.h} m`); }
  const lr=rk.filter(([t])=>t!=='furzrakete');
  lr.forEach(([t,o],i)=>{ for(let j=0;j<i;j++){ const [u,v]=lr[j]; if(v.lvl<o.lvl) pruef('LEITER',o.h+0.5>=v.h,`${t} (L${o.lvl}, ${o.h} m) unter ${u} (L${v.lvl}, ${v.h} m)`); } });
  const rkMax=Math.max(...rk.map(([t,o])=>o.d));
  const kg=Object.entries(r.kg).sort((a,c)=>a[1].lvl-c[1].lvl), kal={};
  for(const [t,o] of kg){ console.log('KUGEL ',t.padEnd(18),JSON.stringify(o));
    { const KH=[95,105,120,135,150], KM0=[[75,0.09],[100,0.12],[150,0.165],[200,0.21],[300,0.3]], km=KM0.reduce((a,c)=>Math.abs(c[1]-o.mm)<Math.abs(a[1]-o.mm)?c:a)[0], soll={himmelssturz300:175}[t]||(o.lvl>=27?165:KH[[75,100,150,200,300].indexOf(km)]);
      if(!ALT) pruef('KUGELHOEHE',Math.abs(o.h-soll)<=4,`${t} bricht bei ${o.h} m (soll ${soll} m)`); }
    pruef('BODEN',o.tief>=10,`${t}: tiefster leuchtender Stern bei ${o.tief} m (Bruch ${o.h} m)`);
    if(!ALT) pruef('BILD',o.imBild>=0.7,`${t}: nur ${Math.round(o.imBild*100)} % der Sterne im Bild`);
    const rkBis=Math.max(...rk.filter(([u,v])=>v.lvl<=o.lvl+1).map(([u,v])=>v.d));
    pruef('KUGELGROSS',o.d>=1.3*rkBis&&o.d>=1.1*rkMax,`${t} (L${o.lvl}) Durchmesser ${o.d} m, Raketen bis L${o.lvl+1} hoechstens ${rkBis} m, alle ${rkMax} m`);
    pruef('BUDGET',o.maxN<=14000,`${t} ${o.maxN} Teilchen`);
    /* Kaliber wie kugelTyp (05d): naechster Durchmesser 75/100/150/200/300 mm */
    const KM=[[75,0.09],[100,0.12],[150,0.165],[200,0.21],[300,0.3]], k=KM.reduce((a,c)=>Math.abs(c[1]-o.mm)<Math.abs(a[1]-o.mm)?c:a)[0];
    (kal[k]=kal[k]||[]).push(o.d); }
  const ks=Object.keys(kal).map(Number).sort((a,c)=>a-c), mit=ks.map(k=>kal[k].reduce((a,c)=>a+c,0)/kal[k].length);
  console.log('KALIBER (Abmessung cm -> mittlerer Durchmesser m)',ks.map((k,i)=>k+':'+mit[i].toFixed(0)).join(' '),'| groesste Rakete',rkMax);
  mit.forEach((m,i)=>{ if(i) pruef('KALIBER',m>mit[i-1],`Kaliber ${ks[i]} (${m.toFixed(0)} m) nicht groesser als ${ks[i-1]} (${mit[i-1].toFixed(0)} m)`); });
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();
