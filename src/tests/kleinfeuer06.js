/* Kleinfeuerwerk nach Toms PDF (05.10.):
   - Bengalhoelzer "in so eine Halterung ... du siehst nur die Staebe",
     Farben "Rot, Gruen, Gelb, Blau so nacheinander":
     HALTER  auf dem Zuendtisch steht der Halter (kein Karton), vier Hoelzer
     FOLGE   vier Hoelzer brennen nacheinander Rot, Gruen, Gelb, Blau
     SPITZE  jede Flamme sitzt auf ihrem Holz: am Anfang an der Spitze,
             dann wandert sie den farbigen Kopf hinab (nie daneben)
     REST    nach dem Abbrennen stehen vier verkohlte Koepfe im Halter
   - Knallfroesche "sind in echt aber gruen":
     GRUEN   das Paeckchen (Effekt) ist ueberwiegend gruen
   Die Duesen des Feuerteufels prueft ursprung.js.
   Gegenprobe (06.10.): der Stand vor der Aenderung faellt bei HALTER,
   FOLGE, SPITZE, REST und GRUEN durch.
   Aufruf: node kleinfeuer06.js real.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']}); const p=await b.newPage(); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2],{timeout:240000}); await p.waitForFunction('window.__bb!==undefined',{timeout:240000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:240000});
  await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show',{state:'visible'}); await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.up.testfeld=true; S.up.shop_halb=true; bb.clearStations();
    const st=bb.stations.tisch; S.carrying={type:'bengalholz',count:1,q:1}; bb.placeOnStation(st); S.carrying=null;
    const it=st.items[st.items.length-1], g=it&&it.gestell;
    o.halter=!!(g&&g.userData&&g.userData.t==='bengalholz'&&g.userData.hoelzer&&g.userData.hoelzer.length===4)&&!it.h;
    const HZ=g&&g.userData.hoelzer||[];
    /* Holz nach Zuendfolge: Fuss und Richtung, Kopf von s0 bis s1 */
    const holz=nr=>{ const q=HZ.find(x=>x.h.nr===nr); if(!q) return null; const h=q.h; return {x:g.position.x+h.x,y:g.position.y+window.__kleinNeu.KQ_PH,z:g.position.z,d:[Math.sin(h.ang),Math.cos(h.ang)],s0:h.L-h.kopf,s1:h.L}; };
    const gesehen=new Map(), abw=[]; o.anfang=[];
    bb.zuendeAlle();
    for(let s=0;s<18;s+=0.05){ bb.run(0.05,0.05);
      for(const e of bb.emittersListe()){ if(e.k!=='zuendholz'||!e.kopf) continue;
        if(!gesehen.has(e)) gesehen.set(e,{t:+s.toFixed(2),A:e.A,nr:e.holzNr});
        const H=holz(e.holzNr); if(!H){ abw.push('kein Holz '+e.holzNr); continue; }
        /* Abstand der Flamme zur Holzachse und Lage entlang der Achse */
        const vx=e.kopf.x-H.x, vy=e.kopf.y-H.y, along=vx*H.d[0]+vy*H.d[1], quer=Math.hypot(vx-along*H.d[0],vy-along*H.d[1],e.kopf.z-H.z);
        if(quer>0.004||along<H.s0-0.004||along>H.s1+0.004) abw.push([e.holzNr,+quer.toFixed(4),+along.toFixed(3)]);
        if(!gesehen.get(e).spitze) gesehen.get(e).spitze=+Math.abs(along-H.s1).toFixed(4); } }
    const L=[...gesehen.values()].sort((a,b)=>a.t-b.t);
    const name=A=>Object.entries(bb.FW).find(([k,v])=>v===A||(A&&v[0]===A[0]&&v[1]===A[1]&&v[2]===A[2]))||['?'];
    o.folge=L.map(x=>name(x.A)[0]); o.zeiten=L.map(x=>x.t); o.spitze=L.map(x=>x.spitze);
    o.abw=abw.slice(0,6); o.abwN=abw.length;
    o.rest=HZ.filter(q=>q.rest.visible&&!q.kopf.visible).length;
    /* Knallfrosch: Farbe des Paeckchens */
    const KN=window.__kleinNeu||{}; if(typeof KN.kqFroschGeo==='function'){ const c=KN.kqFroschGeo().attributes.color; let rr=0, gg=0; for(let i=0;i<c.count;i++){ rr+=c.getX(i); gg+=c.getY(i); } o.frosch={r:+(rr/c.count).toFixed(3),g:+(gg/c.count).toFixed(3)}; }
    return o; });
  console.log(JSON.stringify(r));
  const m=[], pruef=(n,ok,was)=>{ if(!ok) m.push(n+': '+was); };
  pruef('HALTER',r.halter,'Bengalhoelzer stehen nicht im Halter (Karton auf dem Tisch?)');
  pruef('FOLGE',JSON.stringify(r.folge)==='["rot","gruen","zitrone","blau"]'&&r.zeiten.every((t,i)=>!i||t-r.zeiten[i-1]>2),'Folge '+JSON.stringify(r.folge)+' bei '+JSON.stringify(r.zeiten));
  pruef('SPITZE',r.abwN===0&&r.spitze.length===4&&r.spitze.every(v=>v<=0.01),'Flamme nicht auf dem Holz: '+JSON.stringify(r.abw)+' Start ab Spitze '+JSON.stringify(r.spitze));
  pruef('REST',r.rest===4,'verkohlte Koepfe im Halter: '+r.rest+' statt 4');
  pruef('GRUEN',r.frosch&&r.frosch.g>r.frosch.r*1.5,'Knallfrosch nicht gruen: '+JSON.stringify(r.frosch));
  console.log('MANGEL:',m.length?m.join(' | '):'keine');
  console.log('ERRORS:',errs.length||m.length?errs.concat(m).join('\n'):'keine');
  await b.close();
})();
