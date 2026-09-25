/* Zuendpult (Tom, 25.09.): neun Kanaele wie die Zifferntasten
   - 1-3 Moerser klein/mittel/gross, 4-6 Raketen, 7-9 Zuendtisch
   - Tisch und Rampe haben je drei Plaetze, die Rampe nur drei Rohre
   - E am Pult schaltet den Zuendmodus: kein Fenster, keine Kamera-
     fahrt, man sieht sich frei um und kann laufen; unten steht eine
     Leiste mit den Tasten; Zifferntaste zuendet genau diesen Kanal
   - weggehen oder E am Pult beendet den Zuendmodus
   - ein Kanal zuendet nur seinen Platz, der Effekt startet dort
   - Meldeleuchten und Taster am Pult zeigen, was passiert
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
    o.tischVoll=(()=>{ bb.S.carrying={type:'batterie16',count:1,q:1}; bb.placeOnStation(bb.stations.tisch); const n=bb.stations.tisch.items.length; bb.S.carrying=null; return n; })();
    stell('raketengold','rampe'); stell('raketenklein','rampe');
    stell('kugel300','moerser'); stell('kugel100','moerser');
    const k=bb.alleKanaele();
    o.nummern=k.filter(e=>e.it).map(e=>e.kanal+':'+e.it.type);
    o.anzahl=k.length; o.reihe=k.map(e=>e.st.id[0]).join('');
    const lamp=i=>+bb.pultLamps[i].emissiveIntensity.toFixed(2);
    o.lampLeer=lamp(1); o.lampScharf=lamp(0); o.lampen=bb.pultLamps.length;
    /* die Rampe: drei Rohre, schmaler als der Tisch */
    bb.scene.updateMatrixWorld(true);
    let rohre=0; bb.stations.rampe.g.traverse(q=>{ const pr=q.geometry&&q.geometry.parameters; if(q.geometry&&q.geometry.type==='CylinderGeometry'&&pr.radiusTop===0.062) rohre++; });
    o.rohre=rohre;
    const bx=new THREE.Box3().setFromObject(bb.stations.rampe.g), bt=new THREE.Box3().setFromObject(bb.stations.tisch.g);
    o.rampeBreit=+(bx.max.x-bx.min.x).toFixed(2); o.tischBreit=+(bt.max.x-bt.min.x).toFixed(2);
    /* Rakete im Rohr sichtbar, Kugelbombe mit Zuendschnur */
    const r4=bb.kanalItem(4);
    o.raketeSichtbar=!!(r4&&r4.modell&&r4.modell.visible);
    const k1=bb.kanalItem(1);
    o.kugelModell=!!(k1&&k1.modell&&k1.modell.userData.lunte);
    /* Kanal 8 einzeln zuenden (Tischmitte) */
    bb.zuendeKanal(8);
    o.nach8=[7,8,9].map(n=>bb.kanalItem(n)&&bb.kanalItem(n).state);
    o.lampBrennt=lamp(7);
    o.taster=bb.pultTaster.length; o.tasterUnten=+(bb.pultTaster[7].userData.y0-bb.pultTaster[7].position.y).toFixed(4);
    const it8=bb.kanalItem(8);
    o.stehtNoch=!!(it8&&it8.h);
    o.dauer8=bb.brennDauer('batterie16');
    bb.run(2.6,0.05);
    o.tasterOben=+(bb.pultTaster[7].userData.y0-bb.pultTaster[7].position.y).toFixed(4);
    const m8=bb.muendung(bb.stations.tisch,1,'batterie16');
    o.muendung8={x:+m8.x.toFixed(2),y:+m8.y.toFixed(2),z:+m8.z.toFixed(2)};
    o.raketenStart=bb.rockets.map(q=>+q.p.x.toFixed(2));
    o.stehtWaehrend=!!(bb.kanalItem(8)&&bb.kanalItem(8).state==='brennt');
    /* Kanal 4: Goldrakete verlaesst ihr Rohr */
    const m4=bb.muendung(bb.stations.rampe,0,'raketengold');
    o.muendung4=+m4.x.toFixed(2);
    bb.zuendeKanal(4);
    o.vorStart4=r4.modell.visible;
    bb.run(1.3,0.05);
    o.nachStart4=r4.modell.visible;
    o.rak4=bb.rockets.filter(q=>Math.abs(q.p.x-m4.x)<0.6&&Math.abs(q.p.z-m4.z)<0.6).length;
    o.scharf=[1,3,5,7].map(n=>bb.kanalItem(n)&&bb.kanalItem(n).state);
    bb.run(o.dauer8+1,0.1);
    o.platz8frei=!bb.kanalItem(8);
    stell('batterie16','tisch');
    o.neuAuf8=!!(bb.kanalItem(8)&&bb.kanalItem(8).type==='batterie16');
    return o;
  });
  console.log('KANAELE  ',JSON.stringify({nummern:r.nummern,anzahl:r.anzahl,reihe:r.reihe,tischVoll:r.tischVoll}));
  console.log('STATIONEN',JSON.stringify({rohre:r.rohre,rampe:r.rampeBreit,tisch:r.tischBreit}));
  console.log('ZUENDEN  ',JSON.stringify({nach8:r.nach8,stehtNoch:r.stehtNoch,stehtWaehrend:r.stehtWaehrend,platz8frei:r.platz8frei,neuAuf8:r.neuAuf8}));
  console.log('URSPRUNG ',JSON.stringify({m8:r.muendung8,start:r.raketenStart,m4:r.muendung4,rak4:r.rak4}));
  console.log('MODELLE  ',JSON.stringify({rakete:r.raketeSichtbar,vor:r.vorStart4,nach:r.nachStart4,kugel:r.kugelModell}));
  console.log('PULT     ',JSON.stringify({lampen:r.lampen,leer:r.lampLeer,scharf:r.lampScharf,brennt:r.lampBrennt,taster:r.taster,unten:r.tasterUnten,oben:r.tasterOben}));
  pruef('KANAELE',r.anzahl===9&&r.reihe==='mmmrrrttt','erwartet 9 Kanaele Moerser-Raketen-Tisch, sind '+r.anzahl+' '+r.reihe);
  pruef('KANAELE',JSON.stringify(r.nummern)===JSON.stringify(['1:kugel100','3:kugel300','4:raketengold','5:raketenklein','7:batterie49','8:batterie16','9:boeller']),'Nummern stimmen nicht: '+r.nummern);
  pruef('KANAELE',r.tischVoll===3,'auf den Tisch passen nicht genau drei: '+r.tischVoll);
  pruef('RAMPE',r.rohre===3&&r.rampeBreit<1.5&&r.tischBreit>2.4,'Rampe nicht auf drei Rohre verkleinert oder Tisch veraendert: '+JSON.stringify({rohre:r.rohre,rampe:r.rampeBreit,tisch:r.tischBreit}));
  pruef('ZUENDEN',r.nach8[0]==='bereit'&&r.nach8[1]==='brennt'&&r.nach8[2]==='bereit','Kanal 8 zuendet nicht allein: '+r.nach8);
  pruef('ZUENDEN',r.stehtNoch&&r.stehtWaehrend,'die Batterie verschwindet beim Zuenden');
  pruef('ZUENDEN',r.scharf.every(x=>x==='bereit'),'andere Kanaele sind mitgegangen: '+r.scharf);
  pruef('ZUENDEN',r.platz8frei&&r.neuAuf8,'abgebrannter Platz wird nicht frei oder nicht neu belegt');
  pruef('URSPRUNG',r.raketenStart.length>0&&r.raketenStart.every(x=>Math.abs(x-r.muendung8.x)<0.35),'Schuesse starten nicht ueber Platz 8: '+r.raketenStart+' statt '+r.muendung8.x);
  pruef('URSPRUNG',r.rak4>0,'aus Rohr 4 steigt keine Rakete');
  pruef('MODELLE',r.raketeSichtbar&&r.vorStart4===true&&r.nachStart4===false,'Rakete im Rohr nicht sichtbar oder bleibt nach dem Start stehen');
  pruef('MODELLE',r.kugelModell,'Kugelbombe ohne Zuendschnur');
  pruef('PULT',r.lampen===9&&r.lampLeer===0&&r.lampScharf>0&&r.lampBrennt>0,'Meldeleuchten falsch');
  pruef('PULT',r.taster===9&&r.tasterUnten>0.004&&r.tasterOben===0,'Taster am Pult geht beim Zuenden nicht herunter und wieder hoch');

  /* Zuendmodus: E am Pult, Kamera bleibt, laufen geht, Taste zuendet */
  const vor=await p.evaluate(()=>{ const bb=window.__bb; bb.S.carrying=null;
    bb.setView(1.0,-10.6,Math.PI*0.9,-0.05); bb.run(0.1,0.05);
    return {yaw:bb.camYaw(),pitch:bb.camPitch()}; });
  await p.evaluate(()=>{ const bb=window.__bb; bb.tuAktion('pult',null); bb.run(0.2,0.05); });
  const offen=await p.evaluate(()=>{ const bb=window.__bb;
    const kan=[...document.querySelectorAll('#zuend .kan')];
    return {an:bb.zuendOpen,sichtbar:document.getElementById('zuend').classList.contains('show'),
      yaw:bb.camYaw(),pitch:bb.camPitch(),overlay:bb.overlayOpen(),
      tasten:kan.map(k=>k.querySelector('kbd').textContent).join(''),
      gruppen:[...document.querySelectorAll('#zuend h4')].map(h=>h.textContent).join('/'),
      scharf:document.querySelectorAll('#zuend .kan.bereit').length,
      knopf:document.querySelectorAll('#zuend button').length,
      maus:getComputedStyle(document.getElementById('zuend')).pointerEvents,
      rect:(()=>{ const r=document.getElementById('zuend').getBoundingClientRect(); return {l:Math.round(r.left),r:Math.round(r.right),b:Math.round(innerHeight-r.bottom),w:innerWidth}; })()}; });
  await p.keyboard.press('Digit3');
  const nach3=await p.evaluate(()=>{ const it=window.__bb.kanalItem(3); return it&&it.state; });
  await p.keyboard.press('Digit2');
  const leer2=await p.evaluate(()=>window.__bb.toastLast);
  /* laufen geht weiter: vom Pult weg, aber noch in Reichweite */
  const lauf=await p.evaluate(()=>{ const bb=window.__bb; bb.setView(1.0,-10.6,Math.PI,-0.05); return {x:bb.playerPos().x,z:bb.playerPos().z,an:bb.zuendOpen}; });
  await p.keyboard.down('KeyW'); await p.evaluate(()=>window.__bb.run(0.4,0.05)); await p.keyboard.up('KeyW');
  const lauf2=await p.evaluate(()=>({x:window.__bb.playerPos().x,z:window.__bb.playerPos().z,an:window.__bb.zuendOpen}));
  /* alle zusammen: die Kamera bleibt, wo sie ist */
  const alle=await p.evaluate(()=>{ const bb=window.__bb; const y0=bb.camYaw();
    bb.S.carrying={type:'raketenklein',count:1,q:1}; bb.placeOnStation(bb.stations.rampe); bb.S.carrying=null;
    bb.zuendeAlle(true); bb.run(0.3,0.05); return {dy:+Math.abs(bb.camYaw()-y0).toFixed(3)}; });
  /* weggehen beendet den Zuendmodus */
  const weg=await p.evaluate(()=>{ const bb=window.__bb; bb.setView(1.0,-6.5,Math.PI,0); bb.run(0.3,0.05);
    return {an:bb.zuendOpen,sichtbar:document.getElementById('zuend').classList.contains('show')}; });
  /* wieder hin, E: an; E am Pult: aus */
  const ee=await p.evaluate(()=>{ const bb=window.__bb; bb.setView(1.0,-10.6,Math.PI,0); bb.run(0.1,0.05);
    bb.tuAktion('pult',null); const an=bb.zuendOpen; bb.tuAktion('pult',null); return {an,aus:!bb.zuendOpen}; });
  /* aus 4,5 m geht der Zuendmodus gar nicht erst an */
  const weit=await p.evaluate(()=>{ const bb=window.__bb; bb.setView(1.0,-7.0,Math.PI,0); bb.run(0.1,0.05); bb.openZuend(); return {an:bb.zuendOpen,toast:bb.toastLast}; });
  /* ein Mausklick aufs Pult (Ziehen zum Umsehen) beendet ihn nicht */
  const klick=await p.evaluate(()=>{ const bb=window.__bb; bb.setView(1.0,-10.2,0,-0.5); bb.run(0.2,0.05); bb.tuAktion('pult',null);
    return {an:bb.zuendOpen,ziel:bb.target&&bb.target.kind}; });
  await p.mouse.move(640,400); await p.mouse.down(); await p.mouse.up();
  const klick2=await p.evaluate(()=>{ const bb=window.__bb; const an=bb.zuendOpen; if(an) bb.closeZuend(); return an; });
  /* ohne Zuendmodus zuenden die Ziffern nichts */
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.carrying={type:'raketengold',count:1,q:1}; bb.placeOnStation(bb.stations.rampe); bb.S.carrying=null; });
  const ohne=await p.evaluate(()=>{ const bb=window.__bb; const k=bb.alleKanaele().find(e=>e.st.id==='rampe'&&e.it&&e.it.state==='bereit'); return k?k.kanal:0; });
  await p.keyboard.press('Digit'+ohne);
  const ohneSt=await p.evaluate(k=>{ const it=window.__bb.kanalItem(k); return it&&it.state; },ohne);
  /* ist das Handy offen, verschwindet die Leiste */
  const handy=await p.evaluate(()=>{ const bb=window.__bb; bb.tuAktion('pult',null); bb.openHandy(); bb.zuendTick();
    const weg=!document.getElementById('zuend').classList.contains('show'); bb.closeHandy(); bb.zuendTick();
    const wieder=document.getElementById('zuend').classList.contains('show'); bb.tuAktion('pult',null); return {weg,wieder}; });
  const mitte={rect:offen.rect};
  if(process.argv[3]) await p.screenshot({path:process.argv[3]+'_leiste.png'});
  console.log('MODUS    ',JSON.stringify({vor,offen,nach3,leer2,lauf,lauf2,alle,weg,ee,mitte,weit,klick,klick2,ohne,ohneSt,handy}));
  pruef('MODUS',offen.an&&offen.sichtbar&&!offen.overlay,'E am Pult schaltet den Zuendmodus nicht als Leiste ein: '+JSON.stringify(offen));
  pruef('KAMERA',Math.abs(offen.yaw-vor.yaw)<1e-6&&Math.abs(offen.pitch-vor.pitch)<1e-6,'die Kamera wird beim Einschalten gedreht');
  pruef('KAMERA',alle.dy<1e-6,'"alle zuenden" dreht die Kamera');
  pruef('LEISTE',offen.tasten==='123456789'&&offen.gruppen==='Mörser/Raketen/Tisch'&&offen.knopf===0&&offen.maus==='none','Leiste falsch (Tasten, Gruppen, Knoepfe, Maus): '+JSON.stringify(offen));
  pruef('LEISTE',mitte.rect.b<40&&Math.abs((mitte.rect.l+mitte.rect.r)/2-mitte.rect.w/2)<4,'Leiste steht nicht unten in der Mitte: '+JSON.stringify(mitte.rect));
  pruef('TASTE',nach3==='brennt','Taste 3 zuendet Kanal 3 nicht');
  pruef('TASTE',/Kanal 2 ist leer/.test(leer2||''),'leerer Kanal meldet sich nicht: '+leer2);
  pruef('LAUFEN',Math.hypot(lauf2.x-lauf.x,lauf2.z-lauf.z)>0.5&&lauf2.an,'im Zuendmodus kann man nicht laufen: '+JSON.stringify({lauf,lauf2}));
  pruef('WEG',!weg.an&&!weg.sichtbar,'weggehen beendet den Zuendmodus nicht');
  pruef('E',ee.an&&ee.aus,'E am Pult schaltet nicht an und aus');
  pruef('WEIT',!weit.an&&/Näher/.test(weit.toast||''),'aus 4,5 m geht der Zuendmodus an oder meldet sich nicht: '+JSON.stringify(weit));
  pruef('KLICK',klick.an&&klick.ziel==='pult'&&klick2===true,'ein Mausklick aufs Pult beendet den Zuendmodus: '+JSON.stringify({klick,klick2}));
  pruef('OHNE',ohne>0&&ohneSt==='bereit','Ziffer zuendet ohne Zuendmodus: Kanal '+ohne+' '+ohneSt);
  pruef('HANDY',handy.weg&&handy.wieder,'Leiste bleibt ueber dem Handy stehen oder kommt nicht wieder: '+JSON.stringify(handy));

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',fehler.length||mangel.length?fehler.concat(mangel).join('\n'):'keine');
  await b.close();
})();
