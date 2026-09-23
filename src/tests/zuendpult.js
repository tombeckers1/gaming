/* Zuendpult mit Kanaelen (Toms Wunsch vom 23.09.):
   - jeder Platz hat eine feste Nummer: Tisch 1-6, Roehren 7-12, Moerser 13-15
   - ein Kanal zuendet nur seinen Platz, der Rest bleibt scharf
   - der Effekt startet dort, wo das Produkt steht
   - das Produkt bleibt stehen, bis es abgebrannt ist
   - Raketen stecken sichtbar im Rohr und verschwinden beim Start
   - Meldeleuchten am Pult zeigen leer / scharf / brennt
   - das Bedienfeld zeigt alle Kanaele, Taste 1-9 zuendet
   Braucht echtes three.js. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800}});
  const fehler=[];
  p.on('pageerror',e=>fehler.push('PAGEERROR '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:30000});
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  const r=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    bb.S.level=99; bb.S.money=9e6; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    ['shop_halb','testfeld'].forEach(id=>bb.testKauf(id));
    const stell=(t,st)=>{ bb.S.carrying={type:t,count:1,q:1}; bb.placeOnStation(bb.stations[st]); };
    stell('batterie49','tisch'); stell('batterie16','tisch'); stell('boeller','tisch');
    stell('raketengold','rampe'); stell('raketenklein','rampe');
    stell('kugel100','moerser');
    const k=bb.alleKanaele();
    o.nummern=k.filter(e=>e.it).map(e=>e.kanal+':'+e.it.type);
    o.anzahl=k.length;
    const lamp=i=>+bb.pultLamps[i].emissiveIntensity.toFixed(2);
    o.lampLeer=lamp(5); o.lampScharf=lamp(0);
    /* Rakete im Rohr sichtbar */
    const r7=bb.kanalItem(7);
    o.raketeSichtbar=!!(r7&&r7.modell&&r7.modell.visible);
    /* Kugelbombe mit Zuendschnur */
    const k13=bb.kanalItem(13);
    o.kugelModell=!!(k13&&k13.modell&&k13.modell.userData.lunte);
    /* Kanal 2 einzeln zuenden */
    const vorRak=bb.rockets.length;
    bb.zuendeKanal(2);
    o.nach2=[1,2,3].map(n=>bb.kanalItem(n)&&bb.kanalItem(n).state);
    o.lampBrennt=lamp(1);
    /* Die Batterie steht weiter auf ihrem Platz, bis sie abgebrannt ist */
    const it2=bb.kanalItem(2);
    o.stehtNoch=!!(it2&&it2.h);
    o.dauer2=bb.brennDauer('batterie16');
    bb.run(2.6,0.05);
    /* Schuesse der Batterie starten ueber Platz 2 */
    const m2=bb.muendung(bb.stations.tisch,1,'batterie16');
    o.muendung2={x:+m2.x.toFixed(2),y:+m2.y.toFixed(2),z:+m2.z.toFixed(2)};
    o.raketenStart=bb.rockets.map(q=>+q.p.x.toFixed(2));
    o.stehtWaehrend=!!(bb.kanalItem(2)&&bb.kanalItem(2).state==='brennt');
    /* Kanal 7: Goldrakete verlaesst ihr Rohr */
    const m7=bb.muendung(bb.stations.rampe,0,'raketengold');
    o.muendung7=+m7.x.toFixed(2);
    bb.zuendeKanal(7);
    o.vorStart7=r7.modell.visible;
    bb.run(1.3,0.05);
    o.nachStart7=r7.modell.visible;
    o.rak7=bb.rockets.filter(q=>Math.abs(q.p.x-m7.x)<0.6).length;
    /* alles andere ist noch scharf */
    o.scharf=[1,3,8,13].map(n=>bb.kanalItem(n)&&bb.kanalItem(n).state);
    /* abgebrannt: Platz 2 ist wieder frei und wird beim naechsten
       Aufbauen als erster belegt */
    bb.run(o.dauer2+1,0.1);
    o.platz2frei=!bb.kanalItem(2);
    stell('batterie16','tisch');
    o.neuAuf2=!!(bb.kanalItem(2)&&bb.kanalItem(2).type==='batterie16');
    return o;
  });
  console.log('KANAELE  ',JSON.stringify({nummern:r.nummern,anzahl:r.anzahl}));
  console.log('ZUENDEN  ',JSON.stringify({nach2:r.nach2,stehtNoch:r.stehtNoch,stehtWaehrend:r.stehtWaehrend,platz2frei:r.platz2frei,neuAuf2:r.neuAuf2}));
  console.log('URSPRUNG ',JSON.stringify({m2:r.muendung2,start:r.raketenStart,m7:r.muendung7,rak7:r.rak7}));
  console.log('MODELLE  ',JSON.stringify({rakete:r.raketeSichtbar,vor:r.vorStart7,nach:r.nachStart7,kugel:r.kugelModell}));
  console.log('LEUCHTEN ',JSON.stringify({leer:r.lampLeer,scharf:r.lampScharf,brennt:r.lampBrennt}));
  pruef('KANAELE',r.anzahl===15,'erwartet 15 Kanaele, sind '+r.anzahl);
  pruef('KANAELE',JSON.stringify(r.nummern)===JSON.stringify(['1:batterie49','2:batterie16','3:boeller','7:raketengold','8:raketenklein','13:kugel100']),'Nummern stimmen nicht: '+r.nummern);
  pruef('ZUENDEN',r.nach2[0]==='bereit'&&r.nach2[1]==='brennt'&&r.nach2[2]==='bereit','Kanal 2 zuendet nicht allein: '+r.nach2);
  pruef('ZUENDEN',r.stehtNoch&&r.stehtWaehrend,'die Batterie verschwindet beim Zuenden');
  pruef('ZUENDEN',r.scharf.every(x=>x==='bereit'),'andere Kanaele sind mitgegangen: '+r.scharf);
  pruef('ZUENDEN',r.platz2frei&&r.neuAuf2,'abgebrannter Platz wird nicht frei oder nicht neu belegt');
  pruef('URSPRUNG',r.raketenStart.length>0&&r.raketenStart.every(x=>Math.abs(x-r.muendung2.x)<0.35),'Schuesse starten nicht ueber Platz 2: '+r.raketenStart+' statt '+r.muendung2.x);
  pruef('URSPRUNG',r.rak7>0,'aus Rohr 7 steigt keine Rakete');
  pruef('MODELLE',r.raketeSichtbar&&r.vorStart7===true&&r.nachStart7===false,'Rakete im Rohr nicht sichtbar oder bleibt nach dem Start stehen');
  pruef('MODELLE',r.kugelModell,'Kugelbombe ohne Zuendschnur');
  pruef('LEUCHTEN',r.lampLeer===0&&r.lampScharf>0&&r.lampBrennt>0,'Meldeleuchten falsch');

  /* Bedienfeld: oeffnen, Taste 3 zuendet Kanal 3 */
  await p.evaluate(()=>{ window.__bb.S.carrying=null; window.__bb.openZuend(); });
  const panel=await p.evaluate(()=>({auf:document.getElementById('zuend').classList.contains('show'),
    knoepfe:document.querySelectorAll('#zuend .kan').length,
    scharf:document.querySelectorAll('#zuend .kan.bereit').length}));
  await p.keyboard.press('Digit3');
  const nach3=await p.evaluate(()=>{ const it=window.__bb.kanalItem(3); return it&&it.state; });
  await p.keyboard.press('Escape');
  const zu=await p.evaluate(()=>!document.getElementById('zuend').classList.contains('show'));
  console.log('PANEL    ',JSON.stringify({panel,nach3,zu}));
  pruef('PANEL',panel.auf&&panel.knoepfe===15,'Bedienfeld fehlt oder hat nicht 15 Kanaele');
  pruef('PANEL',nach3==='brennt','Taste 3 zuendet Kanal 3 nicht');
  pruef('PANEL',zu,'Esc schliesst das Bedienfeld nicht');

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',fehler.length||mangel.length?fehler.concat(mangel).join('\n'):'keine');
  await b.close();
})();
