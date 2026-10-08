/* Packband und Palettierstation (Tom, 05.10.: "die Pakete fliegen quasi
   in der Luft ... wo die fertigen Pakete liegen, hing es teilweise in
   der Luft"). Ueber einige Spielminuten je Ausbaustufe gemessen:
   - jedes Paket auf Tisch und Band liegt mit der Unterkante auf der
     Flaeche darunter (hoechstens 1 cm daneben) und steht ueber Tisch
     oder Band, nicht daneben
   - im Greifer haengt es an den Saugern: Oberkante = Greiferunterkante
   - auf den Paletten: Unterkante auf Palette oder Paket darunter, unter
     der Mitte und unter mindestens 7 von 9 Messpunkten; keine zwei
     Pakete stecken ineinander, keins ragt aus dem Zaun
   - Stufen 1-3: 1/2/3 Packplaetze und Packer, 2/4/6 Paletten, die
     Station passt in den Raum, Mitarbeiter laufen nicht durch Band,
     Tisch oder Zaun
   - DDL holt am Abend alles ab, auch was auf dem Band liegt
   Braucht echtes three.js (real.html). Aufruf: node packband.js real.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}}); p.setDefaultTimeout(600000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&!/ERR_CERT/.test(m.text())) errs.push('CONSOLE '+m.text().slice(0,160)); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show',{state:'visible'}); await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  await p.evaluate(()=>{ const bb=window.__bb, S=bb.S;
    S.level=40; S.money=9e6; S.lic=bb.LIZENZEN.map(l=>l.id);
    ['shop_halb','lager','lager_nord','lager_gross','lager_sued','lager_sued2','packstation','onlineshop'].forEach(id=>bb.testKauf(id)); S.up.onlineshop=true;
    for(let i=0;i<6;i++) bb.regalStellen('rack');
    /* Messung je Bild: liefert eine Liste von Befunden */
    window.__messe=()=>{ const bb=window.__bb, out=[], VG=bb.VS_GR, B=bb.BAND, TOP=bb.VS_TOP;
      const rechteck=(m,G)=>{ const c=Math.cos(m.rotation.y), s=Math.sin(m.rotation.y), hx=G.x/2, hz=G.z/2;
        /* Punkt (u,v) im Paket -> Station */
        return (u,v)=>({x:m.position.x+u*hx*c+v*hz*s, z:m.position.z-u*hx*s+v*hz*c}); };
      const drin=(m,G,x,z)=>{ const c=Math.cos(m.rotation.y), s=Math.sin(m.rotation.y), dx=x-m.position.x, dz=z-m.position.z;
        const lx=dx*c-dz*s, lz=dx*s+dz*c; return Math.abs(lx)<=G.x/2+1e-4&&Math.abs(lz)<=G.z/2+1e-4; };
      /* Tisch samt Uebergabeblech bis an die Bandkante */
      const aufTisch=(x,z)=>bb.VS_PP.slice(0,bb.packStufe()).some(q=>{ const kante=B.z+q.s*(B.b/2-0.01), z0=Math.min(q.z-0.39,kante), z1=Math.max(q.z+0.39,kante);
        return Math.abs(x-q.x)<=bb.VS_TB/2+0.01&&z>=z0&&z<=z1; });
      const aufBand=(x,z)=>x>=B.x0&&x<=B.x1&&Math.abs(z-B.z)<=B.b/2;
      /* Tisch und Band */
      for(const e of bb.vsBahn){ const G=VG[e.gr], m=e.m, unten=m.position.y-G.h/2;
        if(e.phase==='greifer'){ const oben=m.position.y+G.h/2, P_=bb.vsPortal, gy=bb.packTeile.portal.greifer.position.y;
          if(Math.abs(oben-P_.y)>0.01||Math.abs(gy-P_.y)>0.01) out.push(`Greifer: Paket ${e.gr} oben ${oben.toFixed(3)}, Greifer ${P_.y.toFixed(3)}/${gy.toFixed(3)}`);
          if(Math.abs(m.position.x-bb.packTeile.portal.greifer.position.x)>0.01||Math.abs(m.position.z-bb.packTeile.portal.greifer.position.z)>0.01) out.push('Greifer: Paket nicht unter dem Greifer');
          continue; }
        /* Stufe 1 ohne Kran (08.10.): das Paket ist in der Hand des Packers oder fliegt vom Spieler auf die Palette */
        if(e.phase==='hand'){ if(bb.vsHandFlug&&bb.vsHandFlug.e===e) continue;
          const w=bb.staff.packer, q=m.getWorldPosition(new THREE.Vector3());
          if(!w||w.hand!==e||Math.hypot(q.x-w.pos.x,q.z-w.pos.z)>1.6) out.push('Hand: Paket ohne Packer ('+(w?Math.hypot(q.x-w.pos.x,q.z-w.pos.z).toFixed(2):'-')+' m)');
          continue; }
        if(Math.abs(unten-TOP)>0.01) out.push(`${e.phase}: Unterkante ${unten.toFixed(3)} statt ${TOP}`);
        const pt=rechteck(m,G); let frei=0;
        for(const [u,v] of [[0,0],[-0.7,-0.7],[0.7,-0.7],[-0.7,0.7],[0.7,0.7]]){ const q=pt(u,v); if(!aufTisch(q.x,q.z)&&!aufBand(q.x,q.z)) frei++; }
        if(frei) out.push(`${e.phase}: ${frei} von 5 Punkten weder ueber Tisch noch Band (x ${m.position.x.toFixed(2)} z ${m.position.z.toFixed(2)})`);
      }
      /* offene Kartons auf dem Tisch */
      bb.vsPlaetze.forEach((P_,i)=>{ const T=P_&&P_.tisch; if(!T||T.phase==='heben') return; const G=VG[T.pk.userData.gr], unten=T.pk.position.y-G.h/2;
        if(Math.abs(unten-TOP)>0.01) out.push(`Tisch ${i+1}: Karton schwebt (${unten.toFixed(3)})`); });
      /* Paletten */
      /* seit 07.10. liegen die Pakete je Palette in einem Mesh - die Lage kommt aus vsStapelLage (Stationskoordinaten) */
      const L=bb.vsStapelLage().map(e=>({position:{x:e.x,y:e.y,z:e.z},rotation:{y:e.ry},userData:{gr:e.gr}}));
      /* Europaletten quer: 1,2 m in x, 0,8 m in z */
      for(const m of L){ const G=VG[m.userData.gr], unten=m.position.y-G.h/2, pt=rechteck(m,G);
        let ok=0, mitte=false;
        const pts=[[0,0]]; for(const u of [-0.7,0,0.7]) for(const v of [-0.7,0,0.7]) if(u||v) pts.push([u,v]);
        pts.forEach(([u,v],k)=>{ const q=pt(u,v); let flaeche=-1;
          for(const pa of bb.VS_FELD) if(Math.abs(q.x-pa.x)<=0.6&&Math.abs(q.z-pa.z)<=0.4) flaeche=Math.max(flaeche,bb.PAL_H);
          for(const n of L){ if(n===m) continue; const Gn=VG[n.userData.gr], on=n.position.y+Gn.h/2; if(on<=unten+0.011&&drin(n,Gn,q.x,q.z)) flaeche=Math.max(flaeche,on); }
          const tr=flaeche>=0&&Math.abs(flaeche-unten)<=0.01; if(tr){ ok++; if(!k) mitte=true; } });
        if(!mitte||ok<8) out.push(`Palette: Paket ${m.userData.gr} bei y ${unten.toFixed(3)} getragen an ${ok}/9 Punkten${mitte?'':' (Mitte frei)'}`);
      }
      /* ineinander? (5 mm Luft) */
      for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++){ const a=L[i], c=L[j], Ga=VG[a.userData.gr], Gc=VG[c.userData.gr];
        if(Math.abs(a.position.y-c.position.y)*2>=Ga.h+Gc.h-0.005) continue;
        const pa=rechteck(a,Ga); let hit=false;
        for(const [u,v] of [[0,0],[-0.9,-0.9],[0.9,-0.9],[-0.9,0.9],[0.9,0.9]]){ const q=pa(u,v); if(drin(c,{x:Gc.x-0.01,z:Gc.z-0.01},q.x,q.z)) hit=true; }
        if(hit) out.push(`Palette: Pakete stecken ineinander bei ${a.position.x.toFixed(2)}/${a.position.z.toFixed(2)}`); }
      /* nichts ragt aus der Palettierstation */
      const C=bb.ZELLE[bb.packStufe()];
      for(const m of L){ const G=VG[m.userData.gr], pt=rechteck(m,G);
        for(const [u,v] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const q=pt(u,v); if(q.x<C.x0+0.05||q.x>C.x1-0.05||q.z<C.z0+0.05||q.z>C.z1-0.05){ out.push('Palette: Paket ragt in den Zaun'); break; } } }
      return out; };
    window.__wand=(x,z)=>bb.colliders.filter(c=>x>c.minX+0.06&&x<c.maxX-0.06&&z>c.minZ+0.06&&z<c.maxZ-0.06);
  });

  const T=['boeller','wunder','raketen','lb_polarweiden','lb_goldader','monsterboeller'];
  for(const st of [1,2,3]){
    const r=await p.evaluate(({st,T})=>{ const bb=window.__bb, S=bb.S, o={st};
      if(st>1) bb.testKauf('packstation'+st);
      o.stufe=bb.packStufe(); o.paletten=bb.VS_FELD.length; o.plaetze=bb.vsHits().filter(h=>h.userData.kind==='pack').length;
      o.upLvl=st>1?bb.UPGRADES.find(u=>u.id==='packstation'+st).lvl:25;
      for(const id of ['packer','packer2','packer3'].slice(0,st)) if(!S.staff[id]){ S.staff[id]=true; bb.hireStaff(id); }
      o.packer=['packer','packer2','packer3'].filter(id=>bb.staff[id]).length;
      /* Station passt in den Raum, nichts liegt im Weg */
      o.frei=bb.spotFree(bb.packMov,bb.packMov.g.position.x,bb.packMov.g.position.z,bb.packMov.g.rotation.y);
      let k=0; bb.racks.forEach(r=>r.slots.forEach(s=>{ if(s.box) { r.g.remove(s.box.mesh); s.box=null; } const t=T[k++%T.length]; bb.putInSlot(s,t,bb.P[t].box,1); }));
      bb.vmStand(0); for(let i=0;i<3;i++) bb.VM_IDS.forEach(id=>{ S.vm[i][id]=bb.VM[id].kap; }); bb.vmRegalZeichnen();
      S.bestellungen=[]; S.offen=0; S.paketGr=[]; S.pakete=0; bb.ddlAbholung();
      /* Stufe 1 (08.10.): der Spieler packt allein und legt das Paket am Bandende selbst auf die Palette */
      if(st===1){ const w=bb.staff.packer; delete bb.staff.packer; const sp={};
        const x=bb.vsNeueBestellung(false); if(x){ S.bestellungen.push(x); S.offen=S.bestellungen.length; }
        sp.gepackt=bb.vsSpielerPacken(0);
        for(let i=0;i<1600&&!bb.vsAmAnschlag();i++) bb.step(0.05);
        sp.amEnde=!!bb.vsAmAnschlag(); const pr=bb.vsHandPrompt(); sp.prompt=pr&&pr.a; sp.vor=bb.vsGelandet();
        sp.ab=bb.vsSpielerAblegen(); for(let i=0;i<30;i++) bb.step(0.05);
        sp.nach=bb.vsGelandet(); sp.band=bb.vsBahn.length; sp.lage=bb.vsStapelLage().length;
        bb.staff.packer=w; o.spieler=sp;
        S.bestellungen=[]; S.offen=0; bb.ddlAbholung(); }
      /* einige Spielminuten mit stetem Nachschub an Bestellungen */
      const befunde=[], wand=[]; let portalLief=0, n=0, bilder=0, greifer=0, rollen=0, maxPal=0, pakete=0;
      for(let i=0;i<9000;i++){
        if(i%200===0&&S.bestellungen.filter(x=>x.st==='offen').length<4*st){ for(let j=0;j<2;j++){ const x=bb.vsNeueBestellung(false); if(x){ S.bestellungen.push(x); S.offen=S.bestellungen.length; } } }
        if(i%120===0){ let k2=0; bb.racks.forEach(r=>r.slots.forEach(s=>{ if(!s.box){ const t=T[k2++%T.length]; bb.putInSlot(s,t,bb.P[t].box,1); } })); }
        bb.step(0.05);
        if(i%2) continue; bilder++;
        const m=window.__messe(); if(m.length&&befunde.length<12) befunde.push(...m.slice(0,3).map(x=>'t='+(i*0.05).toFixed(1)+' '+x)); n+=m.length;
        if(bb.vsBahn.some(e=>e.phase==='greifer'||e.phase==='hand')) greifer++;
        if(bb.vsPortal.phase!=='ruhe') portalLief++;
        if(bb.vsBahn.some(e=>e.phase==='rollen')) rollen++;
        maxPal=Math.max(maxPal,bb.vsStapelLage().length);
        for(const id of ['packer','packer2','packer3','auffueller']){ const w=bb.staff[id]; if(!w) continue; const c=window.__wand(w.pos.x,w.pos.z).filter(c=>c.ref===bb.packMov);
          if(c.length&&wand.length<6) wand.push(id+'@'+w.pos.x.toFixed(2)+','+w.pos.z.toFixed(2)+' '+w.vs); }
      }
      pakete=S.stat.pakete||0;
      o.bilder=bilder; o.befunde=n; o.liste=befunde; o.greifer=greifer; o.portalLief=portalLief; o.portalSicht=bb.packTeile.portal.bruecke.visible; o.rollen=rollen; o.maxPal=maxPal; o.wand=wand; o.gepackt=pakete;
      /* Abholung: alles weg, auch vom Band */
      o.vorAbholung={pak:S.pakete,band:bb.vsBahn.length,mesh:bb.pakete.length};
      const n2=bb.ddlAbholung(); o.abgeholt=n2;
      o.nachAbholung={pak:S.pakete,band:bb.vsBahn.length,mesh:bb.pakete.length,greifer:bb.vsPortal.e?1:0};
      return o; },{st,T});
    console.log('STUFE',JSON.stringify(r));
    pruef('STUFE'+st,r.stufe===st&&r.paletten===[0,2,4,6][st]&&r.plaetze===st&&r.packer===st,'Stufe, Paletten, Packplaetze oder Packer stimmen nicht: '+JSON.stringify({stufe:r.stufe,pal:r.paletten,pl:r.plaetze,packer:r.packer}));
    pruef('RAUM'+st,r.frei,'die Station passt in Stufe '+st+' nicht in den Raum oder liegt auf etwas');
    pruef('SCHWEBT'+st,r.befunde===0,r.befunde+' Befunde in '+r.bilder+' Bildern: '+r.liste.join(' | '));
    pruef('LAEUFT'+st,r.greifer>20&&r.rollen>20&&r.maxPal>=5&&r.gepackt>=10,'zu wenig Betrieb gemessen: '+JSON.stringify({greifer:r.greifer,rollen:r.rollen,maxPal:r.maxPal,gepackt:r.gepackt}));
    pruef('KRAN'+st,st===1?(!r.portalSicht&&r.portalLief===0):(r.portalSicht&&r.portalLief>20),'Stufe 1 ohne Kran, ab Stufe 2 mit: '+JSON.stringify({sicht:r.portalSicht,lief:r.portalLief}));
    if(st===1) pruef('SPIELER1',r.spieler&&r.spieler.gepackt&&r.spieler.amEnde&&r.spieler.prompt&&r.spieler.ab&&r.spieler.nach===r.spieler.vor+1&&r.spieler.band===0&&r.spieler.lage===1,'Spieler legt das Paket nicht selbst ab: '+JSON.stringify(r.spieler));
    pruef('WEG'+st,!r.wand.length,'Mitarbeiter laeuft durch die Station: '+r.wand.join(' '));
    pruef('ABHOLUNG'+st,r.abgeholt>0&&r.nachAbholung.pak===0&&r.nachAbholung.band===0&&r.nachAbholung.mesh===0&&!r.nachAbholung.greifer,'DDL holt nicht alles ab: '+JSON.stringify({vor:r.vorAbholung,nach:r.nachAbholung,n:r.abgeholt}));
  }
  /* Gesperrtes Lagerfach (06.10.: in der Vorfuehrung liefen alle Packer
     endlos gegen ein Fach, an das kein Weg fuehrte): die Ware dort zaehlt
     nicht, der Packer bleibt nicht haengen */
  const sp0=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.bestellungen=[]; S.offen=0; bb.ddlAbholung();
    bb.racks.forEach(r=>r.slots.forEach(s=>{ if(s.box&&s.box.type==='lb_goldader'){ r.g.remove(s.box.mesh); s.box=null; } }));
    bb.allLevels().forEach(l=>{ if(l.type==='lb_goldader') while(l.count>0) bb.removeFromLevel(l); });
    bb.floorBoxes.filter(x=>x.type==='lb_goldader').forEach(x=>bb.removeFloorBox(x));
    /* ein Regal mit freiem Fach, davor eine unsichtbare Sperre bis an die Nachbarn */
    const rk=bb.racks.find(r=>r.slots.some(s=>!s.box)&&Math.abs(r.g.rotation.y)<0.01)||bb.racks[0]; const sl=rk.slots.find(s=>!s.box)||rk.slots[0];
    if(sl.box){ rk.g.remove(sl.box.mesh); sl.box=null; }
    bb.putInSlot(sl,'lb_goldader',2,1);
    const K=bb.RACKKIND[rk.kind]||bb.RACKKIND.standard, gx=rk.g.position.x, gz=rk.g.position.z;
    const sperre={minX:gx-K.w/2-1.4,maxX:gx+K.w/2+1.4,minZ:gz+K.zo+0.05,maxZ:gz+K.zo+1.7,ref:null}; bb.colliders.push(sperre);
    bb.NAV.dirty=true; bb.navBuild();
    o.bestand=bb.vsBestand('lb_goldader');
    S.bestNr=(S.bestNr|0)+1; S.bestellungen.push({id:S.bestNr,pos:[{t:'lb_goldader',n:1,g:0}],gr:6,wert:20,versand:0,st:'offen',tag:S.day}); S.offen=1;
    const w=bb.staff.packer; let lang=0, am=0, zust={};
    for(let i=0;i<2400;i++){ bb.step(0.05); zust[w.vs]=(zust[w.vs]||0)+1;
      if(w.vs==='fahren'||w.vs==='greifen'){ am+=0.05; lang=Math.max(lang,am); } else am=0; }
    o.lang=+lang.toFixed(1); o.vs=w.vs; o.zust=zust; o.offen=S.bestellungen.length;
    const i=bb.colliders.indexOf(sperre); if(i>=0) bb.colliders.splice(i,1); bb.NAV.dirty=true;
    S.bestellungen=[]; S.offen=0;
    return o; });
  console.log('GESPERRT',JSON.stringify(sp0));
  pruef('GESPERRT',sp0.bestand===0&&sp0.lang<75,'der Packer laeuft endlos gegen ein gesperrtes Fach: '+JSON.stringify(sp0));
  /* Spieler laeuft nicht durch Band und Zaun: quer durch die Station schieben */
  const sp=await p.evaluate(()=>{ const bb=window.__bb, g=bb.packTisch, o={};
    const W=(x,z)=>{ const s=Math.sin(g.rotation.y), c=Math.cos(g.rotation.y); return {x:g.position.x+x*c+z*s,z:g.position.z-x*s+z*c}; };
    const durch=[];
    /* von Norden nach Sueden an mehreren Stellen: Band und Zaun halten auf */
    const d0=W(0,0), d1=W(0,-0.08), dx=d1.x-d0.x, dz2=d1.z-d0.z;
    for(const lx of [-1.0,0.6,2.5,3.6]){ const a=W(lx,1.6); bb.setView(a.x,a.z,Math.PI,0); bb.schiebe(a.x,a.z);
      for(let i=0;i<60;i++){ const q=bb.playerPos(); bb.schiebe(q.x+dx,q.z+dz2); }
      const pp=bb.playerPos(), sn=Math.sin(g.rotation.y), cs=Math.cos(g.rotation.y), dz=(pp.x-g.position.x)*sn+(pp.z-g.position.z)*cs; if(dz<bb.BAND.z-0.2) durch.push(lx+':'+dz.toFixed(2)); }
    o.durch=durch; return o; });
  console.log('SPIELER',JSON.stringify(sp));
  pruef('SPIELER',!sp.durch.length,'der Spieler kommt durch Band oder Zaun: '+sp.durch.join(' '));
  pruef('FEHLER',!errs.length,errs.slice(0,5).join(' | '));
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK');
  await b.close();
})();
