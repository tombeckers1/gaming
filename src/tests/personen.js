/* Menschen (06.10., Tom: "Menschen realistisch statt Minecraft-Figuren",
   Referenzbild Supermarkt-Kunden). Vorher (23.09.) Low-Poly-Figuren aus
   Kaesten; jetzt echte Figuren aus Microsoft Rocketbox (MIT):
   - jede Person ist EIN Skinned Mesh (27 Knochen, ein Material mit
     Gesicht, Haaren und Kleidung im Atlas) - hoechstens 3 Zeichenteile
     (Figur, Schattenfleck, beim Personal das Logo)
   - Vielfalt: mindestens 16 Figuren unter 300 Kunden, 40 Kombinationen
     aus Figur und Oberteilfarbe; Frauen, Maenner, Jugendliche, Alte
   - Regeln: Jugend-Kunden sind Jugendliche, Angeber schick, Kunden nie
     in Personalfarbe (rotes Oberteil UND schwarze Hose)
   - Personal: einheitliche Uniform mit Logo, jeder Posten eigene Figur
   - Gehen: Steuerbeine schwingen gegenlaeufig UND die Fuesse der Figur
     wandern gegenlaeufig vor und zurueck (Bewegungsaufnahme)
   - Arm-IK: dreht der Spielcode den Arm nach vorn (Karton tragen),
     ist die Hand der Figur vorn auf Bauch-/Brusthoehe
   - Papiertuete nach dem Bezahlen haengt senkrecht an der Hand
   Braucht echtes three.js (Box3, Skinning). */
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
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
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
    o.ohneFigur=leute.filter(l=>!l.u.fig).length;
    o.farbKombis=new Set(leute.map(l=>l.u.kopf+'|'+l.u.oben)).size;
    o.geschlechter=[...new Set(leute.map(l=>kopf(l.u.kopf).sex))];
    o.alter=[...new Set(leute.map(l=>kopf(l.u.kopf).alter))];
    o.jugendNichtTeen=leute.filter(l=>l.ct==='jugend'&&kopf(l.u.kopf).alter!=='teen').length;
    o.angeberUnschick=leute.filter(l=>l.ct==='angeber'&&!kopf(l.u.kopf).schick).length;
    o.kundeInUniform=leute.filter(l=>l.u.oben===bb.UNIFORM.obenF).length;
    o.kundePersonalFigur=leute.filter(l=>kopf(l.u.kopf).nurPersonal).length;
    /* Aufbau einer Figur */
    const g0=leute[0].g, F=g0.userData.fig; let teile=0; g0.traverse(q=>{ if(q.isMesh) teile++; });
    o.teile=teile; o.skinned=!!(F&&F.mesh.isSkinnedMesh); o.knochen=F?F.mesh.skeleton.bones.length:0;
    o.einMaterial=F?!Array.isArray(F.mesh.material)&&!!F.mesh.material.map:false;
    o.dreiecke=F?F.mesh.geometry.index.count/3:0;
    /* Atlas-Texturen werden je Figur geteilt */
    const tex=new Set(); leute.forEach(l=>{ if(l.u.fig) tex.add(l.u.fig.mesh.material.map.uuid); }); o.texturen=tex.size;
    /* Personal */
    o.personal={};
    for(const id of Object.keys(bb.STAFFKOPF)){ const g=bb.makePerson({uniform:id}); o.personal[id]={kleid:g.userData.kleid,oben:g.userData.oben,kopf:g.userData.kopf,logo:!!(g.userData.fig&&g.userData.fig.logo),figur:!!g.userData.fig}; }
    /* Gehen: Steuerbeine und Fuesse der Figur */
    const g=leute.find(l=>l.u.fig).g; bb.scene.add(g); g.position.set(0,0,-3);
    let mx=0, gegen=true; const fz=[[],[]]; const fuss=['R_Foot','L_Foot'].map(n=>g.userData.fig.bones.find(b=>b.name===n));
    const v=new THREE.Vector3();
    for(let i=0;i<48;i++){ bb.animPerson(g,true,0.025,1.4); const a=g.userData.legs[0].rotation.x, b2=g.userData.legs[1].rotation.x;
      mx=Math.max(mx,Math.abs(a)); if(i>8&&a*b2>1e-6) gegen=false;
      g.updateMatrixWorld(true); fuss.forEach((f,k)=>{ f.getWorldPosition(v); g.worldToLocal(v); fz[k].push(v.z); }); }
    o.beine=[+mx.toFixed(2),gegen];
    const sp=a=>Math.max(...a)-Math.min(...a);
    let kor=0; for(let i=0;i<fz[0].length;i++) kor+=(fz[0][i]-fz[0].reduce((s,x)=>s+x,0)/fz[0].length)*(fz[1][i]-fz[1].reduce((s,x)=>s+x,0)/fz[1].length);
    o.fuesse=[+sp(fz[0]).toFixed(2),+sp(fz[1]).toFixed(2),kor<0];
    /* Hoehe der Figur: Scheitel ueber dem Boden (Ruhelage) */
    const ad=leute.find(l=>l.u.fig&&kopf(l.u.kopf).alter!=='teen').g; ad.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(ad.userData.fig.mesh);
    o.hoehe=+(box.max.y-box.min.y).toFixed(2); o.boden=+box.min.y.toFixed(2);
    /* Arm-IK: Arm nach vorn wie beim Kartontragen */
    const h=bb.makePerson({kopf:'M16'}); bb.scene.add(h); h.position.set(2,0,-3);
    for(let i=0;i<20;i++){ bb.animPerson(h,false,0.05,1); h.userData.arms[0].rotation.x=-1.0; h.userData.arms[1].rotation.x=-1.0; bb.renderer.render(bb.scene,bb.camera); }
    const hand=['R_Hand','L_Hand'].map(n=>{ const b=h.userData.fig.bones.find(x=>x.name===n); b.getWorldPosition(v); h.worldToLocal(v); return v.toArray().map(x=>+x.toFixed(2)); });
    o.ikHand=hand;
    /* frei stehend: Haende haengen neben dem Koerper */
    const f2=bb.makePerson({kopf:'M16'}); bb.scene.add(f2); f2.position.set(4,0,-3);
    for(let i=0;i<10;i++){ bb.animPerson(f2,false,0.05,1); bb.renderer.render(bb.scene,bb.camera); }
    o.freiHand=['R_Hand','L_Hand'].map(n=>{ const b=f2.userData.fig.bones.find(x=>x.name===n); b.getWorldPosition(v); f2.worldToLocal(v); return v.toArray().map(x=>+x.toFixed(2)); });
    /* Tuete */
    bb.personTuete(f2,true); for(let i=0;i<5;i++){ bb.animPerson(f2,true,0.05,1.3); bb.renderer.render(bb.scene,bb.camera); }
    const t=f2.userData.fig.tuete; if(t){ t.updateMatrixWorld(true); const tp=t.getWorldPosition(new THREE.Vector3()), hp=t.parent.getWorldPosition(new THREE.Vector3());
      const up=new THREE.Vector3(0,1,0).applyQuaternion(t.getWorldQuaternion(new THREE.Quaternion()));
      o.tuete={unterHand:+(hp.y-tp.y).toFixed(2),senkrecht:+up.y.toFixed(3)}; }
    [g,h,f2].forEach(x=>bb.scene.remove(x));
    return o;
  });
  console.log('VIELFALT',JSON.stringify({koepfe:r.koepfe,ohneFigur:r.ohneFigur,farbKombis:r.farbKombis,sex:r.geschlechter,alter:r.alter,texturen:r.texturen}));
  console.log('AUFBAU  ',JSON.stringify({teile:r.teile,skinned:r.skinned,knochen:r.knochen,einMaterial:r.einMaterial,dreiecke:r.dreiecke}));
  console.log('REGELN  ',JSON.stringify({jugend:r.jugendNichtTeen,angeber:r.angeberUnschick,uniform:r.kundeInUniform,personalFigur:r.kundePersonalFigur}));
  console.log('PERSONAL',JSON.stringify(r.personal));
  console.log('FIGUR   ',JSON.stringify({beine:r.beine,fuesse:r.fuesse,hoehe:r.hoehe,boden:r.boden,ikHand:r.ikHand,freiHand:r.freiHand,tuete:r.tuete}));
  pruef('VIELFALT',r.koepfe>=16&&r.ohneFigur===0,'nur '+r.koepfe+' Figuren, '+r.ohneFigur+' ohne Figur');
  pruef('VIELFALT',r.farbKombis>=40,'nur '+r.farbKombis+' Kombinationen aus Figur und Oberteil');
  pruef('VIELFALT',r.geschlechter.length===2&&r.alter.length===4,'Geschlecht/Alter fehlt: '+r.geschlechter+' '+r.alter);
  pruef('VIELFALT',r.texturen<=r.koepfe,'Texturen nicht je Figur geteilt: '+r.texturen);
  pruef('AUFBAU',r.skinned&&r.knochen===27&&r.einMaterial,'keine echte Figur: '+JSON.stringify(r));
  pruef('AUFBAU',r.teile<=3,'zu viele Zeichenteile je Person: '+r.teile);
  pruef('REGELN',r.jugendNichtTeen===0,r.jugendNichtTeen+' Jugend-Kunden sind keine Jugendlichen');
  pruef('REGELN',r.angeberUnschick===0,r.angeberUnschick+' Angeber nicht schick');
  pruef('REGELN',r.kundeInUniform===0&&r.kundePersonalFigur===0,r.kundeInUniform+' Kunden in Personal-Farbe, '+r.kundePersonalFigur+' als Lkw-Fahrer');
  const pers=Object.values(r.personal);
  pruef('PERSONAL',pers.every(x=>x.kleid==='uniform'&&x.oben===pers[0].oben&&x.logo&&x.figur),'Personal nicht einheitlich: '+JSON.stringify(r.personal));
  pruef('PERSONAL',new Set(pers.map(x=>x.kopf)).size===pers.length,'zwei Posten mit derselben Figur');
  pruef('FIGUR',r.beine[1]&&r.beine[0]>0.3,'Steuerbeine schwingen nicht gegenlaeufig: '+r.beine);
  pruef('FIGUR',r.fuesse[0]>0.25&&r.fuesse[1]>0.25&&r.fuesse[2],'Fuesse der Figur gehen nicht gegenlaeufig: '+r.fuesse);
  pruef('FIGUR',r.hoehe>1.6&&r.hoehe<1.95&&Math.abs(r.boden)<0.03,'Figur '+r.hoehe+' m hoch, Fuss bei '+r.boden);
  pruef('IK',r.ikHand.every(h=>h[2]>0.2&&h[1]>0.8&&h[1]<1.4),'Arm nach vorn, Hand nicht vorn: '+JSON.stringify(r.ikHand));
  pruef('IK',r.freiHand.every(h=>h[2]<0.2&&h[1]<1.0),'frei stehend haengen die Haende nicht: '+JSON.stringify(r.freiHand));
  pruef('TUETE',r.tuete&&r.tuete.unterHand>0&&r.tuete.senkrecht>0.98,'Tuete haengt nicht an der Hand: '+JSON.stringify(r.tuete));

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
