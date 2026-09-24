/* Logistikhalle in drei Stufen (Tom, 24.09.):
   - vor dem Kauf steht die kleine Halle geschlossen da
   - Stufe 1: 18 x 20 m, 6,5 m, Tor 2 und 3; Stufe 2 groesser und
     hoeher mit Tor 4; Stufe 3 die volle Halle mit Tor 5
   - die Tore stehen in der Suedwand (rechts, wenn man durch die
     Schleuse hereinkommt), nah am Eingang
   - durch die Suedwand und die Tore kommt man zu Fuss nicht
   - von der Schleuse kommt man in jeder Stufe in die Halle
   - ein Auflieger dockt an Tor 2 an, die Kartons landen in der Halle
   - Tor 4 laesst sich erst mit Stufe 2 kaufen
   - alter Spielstand mit der grossen Halle bekommt alle drei Stufen
   Aufruf: node logistik.js test.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:560}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    bb.run(0.3,0.05);
    const zustand=()=>({stufe:bb.logiStufe(),zeige:bb.logiZeige(),hallen:bb.LOGI_G.map(g=>g.visible),tore:bb.TOR_G.map(g=>g.visible)});
    /* zu Fuss von der Schleuse nach Westen - wie weit kommt man? */
    const lauf=(x0,z0,dx,dz,n)=>{ let c={x:x0,z:z0}; for(let i=0;i<n;i++) c=bb.schiebe(c.x+dx,c.z+dz); return {x:+c.x.toFixed(2),z:+c.z.toFixed(2)}; };
    o.vorher=zustand(); o.vorherRein=lauf(-23,-20.5,-0.1,0,60);
    S.level=40; S.money=9e7;
    ['lager','lager_nord','lager_gross','lager_sued','lager_sued2'].forEach(id=>{ S.up[id]=true; }); bb.applyZonen();
    o.tor4ZuFrueh=(bb.buyUp('rampe4'),!!S.up.rampe4);
    bb.buyUp('lager_west'); o.s1=zustand(); o.s1Rein=lauf(-23,-20.5,-0.1,0,80);
    o.s1Tore=bb.WTORE.map(t=>t&&{x:t.x,z:+t.g.position.z.toFixed(2)});
    /* nach Sueden zum Tor 2: die Wand haelt */
    o.s1Sued=lauf(-31,-30,0,-0.1,80);
    o.s1West=lauf(-30,-24,-0.1,0,200);
    bb.buyUp('rampe2'); bb.buyUp('rampe3');
    /* Lieferung an Tor 2 */
    const vorBoxen=bb.floorBoxes.length;
    bb.spawnWTruck(0,[{type:'wunder',q:1},{type:'wunder',q:1},{type:'tisch',q:1}],'mertens','Mertens');
    for(let i=0;i<400&&bb.wbays[0];i++) bb.run(0.1,0.1);
    const neu=bb.floorBoxes.slice(vorBoxen).map(x=>({x:+x.mesh.position.x.toFixed(2),z:+x.mesh.position.z.toFixed(2)}));
    o.lieferung={n:neu.length,boxen:neu,frei:!bb.wbays[0]};
    bb.buyUp('lager_west2'); o.s2=zustand(); o.s2West=lauf(-30,-24,-0.1,0,300);
    bb.buyUp('rampe4'); o.tor4Jetzt=!!S.up.rampe4;
    bb.buyUp('lager_west3'); o.s3=zustand(); o.s3West=lauf(-30,-24,-0.1,0,400);
    o.hoehen=bb.LOGI_STUFEN.map(s=>s.h); o.flaechen=bb.LOGI_STUFEN.map(s=>Math.round((s.r.x1-s.r.x0)*(s.r.z1-s.r.z0)));
    o.kapitel=bb.kapitelNr();
    return o; });
  console.log('VORHER  ',JSON.stringify(r.vorher),'rein bis',JSON.stringify(r.vorherRein));
  console.log('STUFE 1 ',JSON.stringify(r.s1),'rein',JSON.stringify(r.s1Rein),'sued',JSON.stringify(r.s1Sued),'west',JSON.stringify(r.s1West));
  console.log('TORE    ',JSON.stringify(r.s1Tore));
  console.log('LKW     ',JSON.stringify(r.lieferung));
  console.log('STUFE 2 ',JSON.stringify(r.s2),'west',JSON.stringify(r.s2West),'Tor 4 vorher',r.tor4ZuFrueh,'nachher',r.tor4Jetzt);
  console.log('STUFE 3 ',JSON.stringify(r.s3),'west',JSON.stringify(r.s3West),JSON.stringify({h:r.hoehen,m2:r.flaechen,kap:r.kapitel}));
  pruef('VORHER',r.vorher.zeige===0&&r.vorher.hallen[0]&&!r.vorher.hallen[1]&&r.vorherRein.x>-26.2,'vor dem Kauf offen oder falsche Halle: '+JSON.stringify(r.vorher)+' '+JSON.stringify(r.vorherRein));
  pruef('STUFE1',r.s1.stufe===0&&r.s1.hallen.join()==='true,false,false'&&r.s1.tore.join()==='true,true,false,false','Stufe 1: '+JSON.stringify(r.s1));
  pruef('STUFE1',r.s1Rein.x<-28,'von der Schleuse kommt man nicht in die Halle: '+JSON.stringify(r.s1Rein));
  pruef('WAND',r.s1Sued.z>-34.1,'durch die Suedwand/das Tor gelaufen: '+JSON.stringify(r.s1Sued));
  pruef('WAND',r.s1West.x>-44.1&&r.s1West.x<-43.5,'Westwand der Stufe 1 haelt nicht: '+JSON.stringify(r.s1West));
  pruef('TORE',r.s1Tore.every(t=>t&&Math.abs(t.z+34)<0.01)&&r.s1Tore[0].x>r.s1Tore[1].x&&r.s1Tore[0].x>-33,'Tore nicht an der Suedwand nah am Eingang: '+JSON.stringify(r.s1Tore));
  pruef('LKW',r.lieferung.n===3&&r.lieferung.frei&&r.lieferung.boxen.every(x=>x.x>-44&&x.x<-26&&x.z>-34&&x.z<-14),'Lieferung an Tor 2: '+JSON.stringify(r.lieferung));
  pruef('STUFE2',r.s2.hallen.join()==='false,true,false'&&r.s2.tore.join()==='true,true,true,false'&&r.s2West.x<-55.5&&r.s2West.x>-56.1,'Stufe 2: '+JSON.stringify(r.s2)+' '+JSON.stringify(r.s2West));
  pruef('TOR4',!r.tor4ZuFrueh&&r.tor4Jetzt,'Tor 4 vor Stufe 2 kaufbar oder danach nicht: '+r.tor4ZuFrueh+'/'+r.tor4Jetzt);
  pruef('STUFE3',r.s3.hallen.join()==='false,false,true'&&r.s3.tore.every(Boolean)&&r.s3West.x<-65.5,'Stufe 3: '+JSON.stringify(r.s3)+' '+JSON.stringify(r.s3West));
  pruef('WACHSEN',r.hoehen[0]<r.hoehen[1]&&r.hoehen[1]<r.hoehen[2]&&r.flaechen[0]<r.flaechen[1]&&r.flaechen[1]<r.flaechen[2]&&r.flaechen[0]<=400,'Stufen wachsen nicht: '+JSON.stringify([r.hoehen,r.flaechen]));

  /* alter Spielstand: grosse Halle -> alle drei Stufen */
  await p.evaluate(()=>{ window.__bb.save(); const k=Object.keys(localStorage).find(k=>{ try{ const d=JSON.parse(localStorage.getItem(k)); return d&&d.up; }catch(e){ return false; } });
    const d=JSON.parse(localStorage.getItem(k)); delete d.up.lager_west2; delete d.up.lager_west3; d.up.lager_west=true; localStorage.setItem(k,JSON.stringify(d)); });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:first-child',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
  const alt=await p.evaluate(()=>({stufe:window.__bb.logiStufe(),w2:window.__bb.S.up.lager_west2,w3:window.__bb.S.up.lager_west3}));
  console.log('ALTSTAND',JSON.stringify(alt));
  pruef('ALTSTAND',alt.stufe===2&&alt.w2&&alt.w3,'alter Spielstand verliert Hallenflaeche: '+JSON.stringify(alt));

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();
