/* Roemische Lichter in den Abschussroehren (Tom, Foto 29.09.): das
   Buendel muss IM Rohr stecken - schmal genug fuer 11 cm, entlang der
   geneigten Rohrachse, unten im Rohr, oben heraus. Der Effekt startet
   oben an den Kerzen (Muendung). */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, T=window.THREE, out=[];
    S.level=40; S.money=1e7; ['shop_halb','testfeld'].forEach(id=>bb.testKauf(id)); bb.run(0.2,0.05);
    const st=bb.stations.rampe, R=bb.STATION_POS.rampe;
    /* Rohrachse wie im Modell: Mitte (x, 0,72, -0,02), um -0,1 rad geneigt, 1,25 m lang, innen 5,6 cm */
    const ax={y:0.72,z:-0.02,n:-0.1,halb:0.625,innen:0.056};
    const mund=ax.y+Math.cos(ax.n)*ax.halb;
    for(const t of Object.keys(bb.P).filter(t=>bb.P[t].shape==='candle')){
      bb.clearStations(); S.carrying={type:t,count:1,q:1}; bb.placeOnStation(st); S.carrying=null;
      const it=st.items[st.items.length-1]; if(!it||!it.h){ out.push({t,fehler:'kein Modell'}); continue; }
      const pos=new T.Vector3(), q=new T.Quaternion(), sc=new T.Vector3(); it.h.m.decompose(pos,q,sc);
      const e=new T.Euler().setFromQuaternion(q);
      const d=bb.P[t].dims, w=d[0], HH=d[1]*0.9;
      const rx=R.x+bb.RAMPE_X[it.slot%3];
      /* Abstand des Fusspunkts zur Rohrachse */
      const u=(pos.y-ax.y)/Math.cos(ax.n), zAchse=R.z+ax.z+Math.sin(ax.n)*u;
      const top={y:pos.y+Math.cos(e.x)*HH,z:pos.z+Math.sin(e.x)*HH};
      const m=bb.muendung(st,it.slot,t);
      out.push({t,breite:+(1.41*w*sc.x).toFixed(3),neig:+e.x.toFixed(3),
        achse:+Math.hypot(pos.x-rx,pos.z-zAchse).toFixed(4),unten:+(mund-pos.y).toFixed(3),oben:+(top.y-mund).toFixed(3),
        muendung:+Math.hypot(m.y-top.y,m.z-top.z,m.x-rx).toFixed(3)});
    }
    bb.clearStations();
    return {innen:ax.innen,liste:out}; });
  console.log('KERZEN',JSON.stringify(r));
  pruef('ANZAHL',r.liste.length>=3,'zu wenige Roemische Lichter: '+r.liste.length);
  for(const k of r.liste){
    if(k.fehler){ pruef('MODELL',false,k.t+': '+k.fehler); continue; }
    pruef('PASST_INS_ROHR',k.breite<=2*r.innen,k.t+' '+k.breite+' m breit bei '+(2*r.innen)+' m Rohr');
    pruef('NEIGUNG',Math.abs(k.neig+0.1)<0.005,k.t+' Neigung '+k.neig);
    pruef('AUF_DER_ACHSE',k.achse<0.005,k.t+' '+k.achse+' m neben der Rohrachse');
    pruef('STECKT_DRIN',k.unten>0.05&&k.oben>0.05,k.t+' unten '+k.unten+' / oben '+k.oben+' m');
    pruef('MUENDUNG',k.muendung<0.02,k.t+' Effektstart '+k.muendung+' m neben der Kerzenspitze');
  }
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();
