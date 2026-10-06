/* Ursprung am Produkt (Tom, 28.09.: "schau, dass du die Effekte an dem
   Produkt rauslaesst - wenn da eine Oeffnung ist, dann soll es am
   Produkt rausgehen, teilweise gehen die komplett woanders. Das musst
   du bei jedem Produkt testen.")
   Jedes zuendbare Produkt kommt auf Platz 1 seiner Station (Kugel-
   bomben in ihr Moerserrohr), wird gezuendet und brennt ganz ab.
   Gemessen wird jeder Funke, der auf Hoehe der Oeffnung entsteht
   (Schuesse, Minen, Boden-Emitter, Fontaenen, Muendungsblitze), und
   jeder Schuss aus dem Mitschnitt (Startpunkt). Kein Ursprung darf
   ausserhalb der Oeffnung + 3 cm liegen, und jede steigende Rakete
   beginnt auf Hoehe der Oeffnung (nicht im Karton oder Buendel, nicht
   in der Luft darueber). Jeder Emitter (Boden-Ebene, Duese, Mine) steht
   an der Oeffnung, nicht daneben oder unten am Boden:
     Tisch    Grundflaeche dims[0] (quer zum Blick) x dims[2], Oberkante
              0,93 + dims[1]
     Roehren  Rohrmuendung (Radius 6,2 cm); Roemische Lichter: die
              fuenf Rohre ihres Buendels oben (Modell: +-0,52 w, 0,9 h)
     Moerser  Rohrmuendung (Aussenradius MOERSER_R)
   Flitzer, Erbsen und Boeller mit Luftbild fliegen absichtlich davon:
   bei ihnen zaehlt nur der erste Funke.
   Aufruf: node ursprung.js test.html ['["id",...]']   (ohne Liste: alle) */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']}); const p=await b.newPage(); p.setDefaultTimeout(1800000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2],{timeout:240000}); await p.waitForFunction('window.__bb!==undefined',{timeout:240000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:240000});
  await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show',{state:'visible'}); await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
  const nur=process.argv[3]?JSON.parse(process.argv[3]):null;
  /* Zeile des Zeitfaechers imBild: was von dort aus laeuft, entsteht
     unterwegs auf einer Flugbahn (Glitzer, Verzweigung) - kein Ursprung */
  const html=require('fs').readFileSync(process.argv[2],'utf8').split('\n');
  const FZ=':'+(html.findIndex(l=>l.includes('FAECHER.delete(k); for(const g of f) g();'))+1)+':';
  /* Zeilen der Raketenschleife in updateFireworks: der Schweif einer
     steigenden Rakete ist Flug, ihr Start steht im Mitschnitt */
  const uf=html.findIndex(l=>l.startsWith('function updateFireworks('));
  const RL=[html.findIndex((l,i)=>i>uf&&l.includes('for(let i=rockets.length-1'))+1,html.findIndex((l,i)=>i>uf&&l.trim()==='FW_TAG=0;')+1];
  /* ebenso die Aufstiegsarten (STEIG_ART): Schweif und Nachblitzen */
  const sa=html.findIndex(l=>l.startsWith('const STEIG_ART={'));
  const SL=[sa+1,html.findIndex((l,i)=>i>sa&&l.startsWith('};'))+1];
  /* knallfrosch: springt absichtlich vom Karton weg (28.09., klein) - der erste Knall zaehlt */
  /* bodenkreisel: die Kreisel laufen vom Karton weg und ziehen dort ihre Feuerkreise (29.09., Tom: "wirklich Kreise") */
  /* 03.10. (Tom): Knallbonbons liegen vor dem Karton und reissen dort; Wunderkerzen stecken
     ohne Verpackung im Mini-Podest (Kerzen gefaechert, Herz 36 cm, 2027 ueber 75 cm) - die
     Packungsmasse sind dort nicht mehr der Ort; der erste Funke zaehlt */
  const WEIT=['schwaermer','knallerbsen','goldstaubboeller','atomboeller','tisch','knallfrosch','bodenkreisel','blitzknaller',
    'knallbonbon','wunder','wunderherz','wunderzahl'];
  const r=await p.evaluate(([nur,WEIT,FZ,RL,SL])=>{ const bb=window.__bb, S=bb.S, P=bb.P, out={};
    S.up.testfeld=true; S.up.shop_halb=true;
    /* Funken, die unterwegs aus einem anderen Funken entstehen (Verzweigung,
       Glitzerschleier grosser Brueche, Sternspuren), sind kein Ursprung -
       erkennbar am Aufrufer. Die Zuendschnur der Kugelbombe haengt aussen
       ueber den Rohrrand: vor dem Abschuss zaehlt am Moerser nichts. */
    const FOLGE=/verzweig|sternNach|nachglitzer|grSpur|fuehrenTakt|knisterPop|^(Object\.)?spur<updateFireworks|^glint<Object\.fn<Object\.grTaktLauf/;
    const flug=l=>{ const m=/updateFireworks \(.*:(\d+):\d+\)/.exec(l), n=/html:(\d+):\d+/.exec(l||'');
      return (m&&+m[1]>=RL[0]&&+m[1]<=RL[1])||(n&&+n[1]>=SL[0]&&+n[1]<=SL[1]); };
    let O=null, neben=null;
    [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall].forEach(ps=>{ const f=ps.emit.bind(ps); ps.emit=function(x,y,z){
      /* 06.10. (Toms PDF, Feuerteufel: "der Effekt soll aus diesen Loechern
         rauskommen"): jeder Funke aus Strahl oder Duesenflamme - Abstand zur
         naechsten der beiden Duesenmuendungen (3D) und welche es ist */
      if(window.__ft&&bb.fwUhr>=O.ab){ const st=new Error().stack;
        if(/at (fkStrahl|fkFlamme) /.test(st)){ let b=1e9, k=-1; window.__ft.M.forEach((q,i)=>{ const dd=Math.hypot(x-q.x,y-q.y,z-q.z); if(dd<b){ b=dd; k=i; } }); window.__ft.d.push([+b.toFixed(4),k]); } }
      if(window.__pk&&bb.fwUhr>=O.ab&&y>=O.y0&&y<=O.y+0.5){ const dn=neben(x,z);
        if(dn<=0.03) window.__pk.push(dn);
        else { const st=new Error().stack; if(st.includes(FZ)||flug(st.split('\n')[2])) return f.apply(null,arguments);
          const s=st.split('\n').slice(2,8).map(l=>(l.trim().split(' ')[1]||'')).map(n=>n.startsWith('file:')?n.replace(/.*html:/,''):n).slice(0,4).join('<');
          if(!FOLGE.test(s)) window.__pk.push(dn,[+(x-O.x).toFixed(2),+(z-O.z).toFixed(2),s]); } }
      return f.apply(null,arguments); }; });
    /* Emitter-Orte (Boden-Ebene, Fontaenen, Kleinfeuerwerk): jeder
       neue Emitter merkt sich seinen Ort o - auch einer, der am Boden
       neben dem Tisch steht, wo die Funkenmessung (Tischhoehe) nicht
       hinschaut. Zuendschnur, Rauch/Reste und Takt-Emitter ohne eigenen
       Ort (PAD) zaehlen nicht. */
    const EM=bb.emittersListe(), emPush=EM.push, EM_OHNE=/^(fuse|gb_|dienst|rest|bodenrest|rauch|papierflug)/;
    EM.push=function(...a){ if(window.__em&&bb.fwUhr>=O.ab) for(const e of a) if(e&&e.o&&e.o.x!==undefined&&!EM_OHNE.test(e.k||''))
      window.__em.push([e.k,+(e.o.x-O.x).toFixed(2),+((e.o.y!==undefined?e.o.y:0)-O.y).toFixed(2),+(e.o.z-O.z).toFixed(2),neben(e.o.x,e.o.z),e.o.modul]);
      return emPush.apply(this,a); };
    const ids=(nur||Object.keys(P)).filter(t=>P[t]&&bb.stationOf(t));
    for(const t of ids){
      for(let i=0;i<120&&(bb.emittersListe().length||bb.timersLen()>0||bb.rockets.length);i++) bb.run(0.5,0.25);
      bb.clearStations();
      const sid=bb.stationOf(t), st=bb.stations[sid];
      S.carrying={type:t,count:1,q:1}; bb.placeOnStation(st); S.carrying=null;
      const it=st.items[st.items.length-1]; if(!it){ out[t]={fehler:'nicht platziert'}; continue; }
      const m=bb.muendung(st,it.slot,t), d=P[t].dims||[0.2,0.2,0.2];
      /* Oeffnung: Mitte, halbe Ausdehnung quer (hx) und in der Tiefe (hz), Hoehe */
      if(sid==='tisch') O={x:m.x,z:m.z,hx:d[0]/2,hz:d[2]/2,y:0.93+d[1],y0:0.85};
      else if(sid==='rampe'&&P[t].shape==='candle'){ const w=d[0]; O={x:m.x,z:m.z,hx:0.52*w+0.185*w,hz:0.5*d[2]+0.185*w,y:1.18+0.9*d[1],y0:1.18+0.9*d[1]-0.4}; }
      else if(sid==='rampe') O={x:m.x,z:m.z,hx:0.062,hz:0.062,rund:true,y:m.y,y0:m.y-0.4};
      else { const R=bb.MOERSER_R[it.slot%3]; O={x:m.x,z:m.z,hx:R,hz:R,rund:true,y:m.y,y0:m.y-0.4}; }
      neben=(x,z)=>O.rund?Math.max(0,Math.hypot(x-O.x,z-O.z)-O.hx):Math.hypot(Math.max(0,Math.abs(x-O.x)-O.hx),Math.max(0,Math.abs(z-O.z)-O.hz));
      window.__pk=[]; window.__em=[]; const log=[]; bb.fwLog(log);
      window.__ft=t==='feuerteufel'&&typeof window.__ftMuendungen==='function'?{M:window.__ftMuendungen({x:m.x,y:O.y,z:m.z},t),d:[]}:null;
      O.ab=bb.fwUhr+(sid==='moerser'?0.76:0); bb.zuendeAlle();
      const T=Math.min(90,bb.brennDauer(t)+1);
      for(let s=0;s<T;s+=0.1) bb.run(0.1,0.05);
      const pk=window.__pk, em=window.__em, ft=window.__ft; window.__pk=null; window.__em=null; window.__ft=null; bb.fwLog(null);
      /* Feuerteufel: Funken je Muendung und weitester Abstand zur Muendung */
      const duesen=ft?{n:[0,1].map(i=>ft.d.filter(q=>q[1]===i&&q[0]<=0.012).length),max:+Math.max(0,...ft.d.map(q=>q[0])).toFixed(4),alle:ft.d.length}:null;
      /* Starthoehe jedes Schusses, jeder Kugel und Perle (Mitschnitt):
         3 cm unter bis 20 cm ueber der Oeffnung */
      const rk=log.filter(e=>e.y!==undefined&&(e.art==='schuss'||e.art==='kugel'||e.art==='perle')).map(e=>+(e.y-O.y).toFixed(3));
      const hoch=rk.length?[Math.min(...rk),Math.max(...rk)]:null;
      /* Emitter neben der Oeffnung oder unter ihr (am Boden statt auf dem Tisch) */
      /* 05.10.: Boden-Effekte von Batterien kommen aus den Fontaenen-Modulen
         unten vorn am Produkt (04c rohrSatz.modul) - bei hohen Batterien
         mehr als 0,3 m unter dem Deckel, aber auf dem Tisch, nicht darunter */
      const amModul=q=>q[5]!==undefined&&q[4]<=0.03&&q[2]>=-(d[1]+0.02);
      const emRaus=[]; for(const q of em) if((q[4]>0.03||q[2]<-0.3)&&!amModul(q)&&!emRaus.some(x=>x[0]===q[0])) emRaus.push(q.slice(0,4));
      /* Ursprung: Funken auf Hoehe der Oeffnung (bis 0,5 m darueber);
         im Protokoll steht nach jedem Funken daneben sein Ort und Aufrufer */
      const dn=pk.filter(v=>typeof v==='number');
      const schuesse=log.filter(e=>e.x!==undefined&&(e.art==='schuss'||e.art==='kugel'||e.art==='perle'||e.art==='topf')).map(e=>[e.x,e.z!==undefined?e.z:O.z,e.art]);
      if(!dn.length&&!schuesse.length){ out[t]={st:sid,leer:true}; continue; }
      const ds=schuesse.map(q=>neben(q[0],q[1]));
      const erst=dn.length?dn[0]:ds[0];
      const alle=dn.concat(ds), max=alle.length?Math.max(...alle):0, raus=alle.filter(v=>v>0.03).length;
      /* wo der weiteste Ursprung lag (x/z relativ zur Mitte) */
      let wo=null; if(max>0.03){ const k=alle.indexOf(max);
        if(k<dn.length){ let j=-1; for(let i=0,c=0;i<pk.length;i++){ if(typeof pk[i]==='number'){ if(c===k){ j=i; break; } c++; } } wo=pk[j+1]; }
        else { const q=schuesse[k-dn.length]; wo=[+(q[0]-O.x).toFixed(2),+(q[1]-O.z).toFixed(2),'log:'+q[2]]; } }
      /* 06.10.: Stufen- und Doppeldeck-Batterien (14t ROHR_FORM) haben Muendungen unterhalb des Deckels */
      const stufe=window.__lochschuss&&window.__lochschuss.stufe?window.__lochschuss.stufe(t):0;
      out[t]={st:sid,dims:d,erst:+erst.toFixed(3),max:+max.toFixed(3),raus,n:alle.length,schuss:ds.length,wo,weit:WEIT.includes(t),em:emRaus,hoch,stufe,duesen};
      bb.clearStations();
    }
    return out; },[nur,WEIT,FZ,RL,SL]);
  const mangel=[];
  for(const [t,v] of Object.entries(r)){
    if(v.fehler||v.leer){ mangel.push(t+': '+(v.fehler||'keine Funken')); continue; }
    /* 03.10. (Tom): Knallfrosch, Knallbonbons und Kreisel sind selbst das Feuerwerk - sie liegen
       vor dem Karton auf dem Tisch (bis 0,45 m, sechs Kreisel in einer Reihe bis 0,6 m); die 2027 steckt im 80 cm langen Podest */
    /* 05.10.: Feuerrad - das 54-cm-Rad dreht am Gestell, jeder Funke ist
       beim Erscheinen schon um seinen Flugweg im Bild vorgerueckt (14k
       saxon, Spirale statt Speichen): bis 10 cm neben dem Karton */
    const NEBEN={knallfrosch:0.45,knallbonbon:0.45,bodenkreisel:0.6,wunderzahl:0.25,feuerrad:0.1};
    if(v.erst>(NEBEN[t]||0.03)) mangel.push(`${t}: erster Funke ${v.erst} m neben der Oeffnung`);
    else if(!v.weit&&v.max>(NEBEN[t]||0.03)) mangel.push(`${t}: ${v.raus}/${v.n} Ursprung bis ${v.max} m neben der Oeffnung (${v.st}, bei ${JSON.stringify(v.wo)})`);
    if(v.hoch&&(v.hoch[0]<-0.03-(v.stufe||0)||v.hoch[1]>0.2)) mangel.push(`${t}: Raketen starten ${v.hoch[0]} bis ${v.hoch[1]} m ueber der Oeffnung (${v.st})`);
    if(!v.weit&&v.em.length) mangel.push(`${t}: Emitter nicht an der Oeffnung [k,dx,dy,dz]: ${JSON.stringify(v.em)}`);
    /* Feuerteufel: Strahl und Flamme kommen aus BEIDEN Duesenmuendungen
       (je mindestens 200 Funken), keiner weiter als 1,2 cm daneben */
    if(t==='feuerteufel'&&(!v.duesen||v.duesen.max>0.012||Math.min(...v.duesen.n)<200)) mangel.push(`feuerteufel: Funken nicht aus den zwei Duesen ${JSON.stringify(v.duesen)}`);
  }
  const kurz={}; for(const [t,v] of Object.entries(r)) kurz[t]=v.leer||v.fehler?v:[v.st,v.max,v.raus+"/"+v.n,v.wo,v.em,v.hoch].concat(v.duesen?[v.duesen]:[]);
  console.log(JSON.stringify(kurz));
  console.log('PRODUKTE:',Object.keys(r).length,'MANGEL:',mangel.length);
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();
