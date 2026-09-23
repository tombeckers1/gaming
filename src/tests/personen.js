/* Figuren im Low-Poly-Stil (Toms Wunsch vom 23.09.):
   - wenige Koepfe (hoechstens 12 Gesichter), viel Kleidung
   - Frauen, Maenner, Jugendliche, Alte; schick bis Jogginghose
   - Kleidung passt zur Person: Rock nur Frauen, Jugendliche nie
     im Mantel mit Weste usw., Jugend-Kunden sind Jugendliche
   - Personal traegt eine einheitliche Uniform, Kunden nie
   - Figur laeuft (Beine schwingen), kein Teil faellt heraus
   Braucht echtes three.js (Box3). */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  const r=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.S.level=30;
    const typen=[{id:'normal'},{id:'jugend'},{id:'angeber'},{id:'profi'},{id:'spar'},{id:'familie'},{id:'stamm'}];
    const leute=[];
    for(let i=0;i<300;i++){ const ct=typen[i%typen.length]; const g=bb.makePerson({ct}); leute.push({ct:ct.id,u:g.userData,g}); }
    const kopf=id=>bb.KOEPFE.find(k=>k.id===id);
    o.koepfe=new Set(leute.map(l=>l.u.kopf)).size;
    o.gesichter=Object.keys(bb.faceCache).length;
    o.kleider=[...new Set(leute.map(l=>l.u.kleid))];
    o.farbKombis=new Set(leute.map(l=>l.u.kleid+'|'+l.u.oben)).size;
    o.geschlechter=[...new Set(leute.map(l=>kopf(l.u.kopf).sex))];
    o.alter=[...new Set(leute.map(l=>kopf(l.u.kopf).alter))];
    /* Regeln: welches Kleid passt zu welchem Kopf */
    o.falsch=[];
    leute.forEach(l=>{ const k=kopf(l.u.kopf), kl=bb.KLEID.find(x=>x.id===l.u.kleid);
      if(!kl){ o.falsch.push('unbekannt '+l.u.kleid); return; }
      if(kl.wer.indexOf(k.alter)<0||(kl.sex&&kl.sex!==k.sex)) o.falsch.push(k.id+' in '+kl.id); });
    /* feste Regel, unabhaengig von den Spieldaten: Maenner ohne Rock und Bluse */
    leute.forEach(l=>{ const k=kopf(l.u.kopf); if(k.sex==='m'&&(l.u.kleid==='rock'||l.u.kleid==='bluse')) o.falsch.push(k.id+' im '+l.u.kleid); });
    /* Gesichtstexturen, die wirklich an den Koepfen haengen */
    const tex=new Set(); leute.forEach(l=>l.u.head.traverse(q=>{ if(q.isMesh&&Array.isArray(q.material)) tex.add(q.material[4].map.uuid); }));
    o.gesichtTex=tex.size;
    o.jugendNichtTeen=leute.filter(l=>l.ct==='jugend'&&kopf(l.u.kopf).alter!=='teen').length;
    o.angeberUnschick=leute.filter(l=>l.ct==='angeber'&&!bb.KLEID.find(x=>x.id===l.u.kleid).schick).length;
    o.kundeInUniform=leute.filter(l=>l.u.oben===bb.UNIFORM.obenF).length;
    /* Teile pro Figur */
    let n=0; leute[0].g.traverse(q=>{ if(q.isMesh) n++; }); o.meshes=n;
    /* Personal */
    o.personal={};
    for(const id of Object.keys(bb.STAFFKOPF)){ const g=bb.makePerson({uniform:id}); o.personal[id]={kleid:g.userData.kleid,oben:g.userData.oben,kopf:g.userData.kopf}; }
    /* Laufen: Beine schwingen gegenlaeufig */
    const g=leute[0].g; let mx=0, gegen=true;
    for(let i=0;i<40;i++){ bb.animPerson(g,true,0.05,1.4); const a=g.userData.legs[0].rotation.x, b2=g.userData.legs[1].rotation.x;
      mx=Math.max(mx,Math.abs(a)); if(a*b2>1e-6) gegen=false; }
    o.beine=[+mx.toFixed(2),gegen];
    /* Hoehe der Figur: Scheitel ueber dem Boden */
    const box=new THREE.Box3().setFromObject(leute.find(l=>kopf(l.u.kopf).alter!=='teen').g);
    o.hoehe=+(box.max.y-box.min.y).toFixed(2); o.boden=+box.min.y.toFixed(2);
    return o;
  });
  console.log('VIELFALT',JSON.stringify({koepfe:r.koepfe,gesichter:r.gesichter,gesichtTex:r.gesichtTex,kleider:r.kleider,farbKombis:r.farbKombis,sex:r.geschlechter,alter:r.alter,meshes:r.meshes}));
  console.log('REGELN  ',JSON.stringify({falsch:r.falsch.slice(0,5),jugend:r.jugendNichtTeen,angeber:r.angeberUnschick,uniform:r.kundeInUniform}));
  console.log('PERSONAL',JSON.stringify(r.personal));
  console.log('FIGUR   ',JSON.stringify({beine:r.beine,hoehe:r.hoehe,boden:r.boden}));
  pruef('VIELFALT',r.gesichter<=12&&r.gesichtTex<=12&&r.koepfe>=10,'Koepfe '+r.koepfe+', Gesichtstexturen '+r.gesichter+'/'+r.gesichtTex);
  pruef('VIELFALT',r.kleider.length>=10&&r.farbKombis>=40,'nur '+r.kleider.length+' Kleider / '+r.farbKombis+' Kombinationen');
  pruef('VIELFALT',r.geschlechter.length===2&&r.alter.length===4,'Geschlecht/Alter fehlt: '+r.geschlechter+' '+r.alter);
  pruef('REGELN',!r.falsch.length,'unpassend: '+r.falsch.slice(0,5));
  pruef('REGELN',r.jugendNichtTeen===0,r.jugendNichtTeen+' Jugend-Kunden sind keine Jugendlichen');
  pruef('REGELN',r.angeberUnschick===0,r.angeberUnschick+' Angeber nicht schick');
  pruef('REGELN',r.kundeInUniform===0,r.kundeInUniform+' Kunden in Personal-Farbe');
  const pers=Object.values(r.personal);
  pruef('PERSONAL',pers.every(x=>x.kleid==='uniform'&&x.oben===pers[0].oben),'Personal nicht einheitlich');
  pruef('PERSONAL',new Set(pers.map(x=>x.kopf)).size===pers.length,'zwei Posten mit demselben Gesicht');
  pruef('FIGUR',r.beine[1]&&r.beine[0]>0.3,'Beine schwingen nicht gegenlaeufig: '+r.beine);
  pruef('FIGUR',r.hoehe>1.6&&r.hoehe<1.95&&Math.abs(r.boden)<0.03,'Figur '+r.hoehe+' m hoch, Fuss bei '+r.boden);
  pruef('FIGUR',r.meshes<60,'zu viele Teile: '+r.meshes);

  /* Im Spiel: Kunden kommen, Personal eingestellt */
  const sp=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.S.level=30; bb.S.money=9e5;
    ['kassierer','auffueller','security'].forEach(id=>{ bb.S.staff[id]=true; bb.hireStaff(id); });
    bb.openShop(); bb.run(60,0.05);
    o.kunden=bb.customers.length;
    o.personal=Object.keys(bb.staff).filter(k=>bb.staff[k]).map(k=>bb.staff[k].g.userData.kleid);
    return o;
  });
  console.log('SPIEL   ',JSON.stringify(sp));
  pruef('SPIEL',sp.kunden>0&&sp.personal.length===3&&sp.personal.every(x=>x==='uniform'),'Spiel: '+JSON.stringify(sp));

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();
