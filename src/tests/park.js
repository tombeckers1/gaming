/* Park hinter dem Testfeld (Tom, 26.09.: "graue Flaeche - Baeume, ein
   kleiner See, Natur und Leben"):
   - GRUEN: von oben gesehen ist der Streifen zwischen Testfeldzaun und
     Stadt zum groessten Teil Wiese/Wasser, nicht mehr Asphalt
   - SEE: eine Wasserflaeche von mindestens 80 m2
   - BAEUME: mindestens 15 Baeume/Tannen im Park
   - LEBEN: Enten und Spaziergaenger bewegen sich
   - FREI: nichts vom Park ragt ins Testfeld oder auf den LKW-Hof
   - STADT: kein Stadthaus steht im Park */
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
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, L=bb.LAY, o={};
    /* Welche Flaeche liegt oben? Senkrecht von oben auf ein Raster
       zwischen Testfeld (z -28) und Parkende schiessen. Hindernisse
       (Baeume, Laternen) ueberspringen: gezaehlt wird der Boden. */
    const rc=new THREE.Raycaster(), down=new THREE.Vector3(0,-1,0);
    let gruen=0, n=0;
    for(let x=-18;x<=39;x+=3) for(let z=-52;z<=-31;z+=3){
      rc.set(new THREE.Vector3(x,5,z),down); rc.far=5.2;
      const h=rc.intersectObjects(bb.scene.children,true).filter(i=>i.object.visible&&i.point.y<0.12);
      if(!h.length) continue; n++;
      let a=h[0].object, park=false; for(;a;a=a.parent) if(a.userData&&a.userData.park) park=true;
      if(park||h[0].object.material===bb.parkWasser()) gruen++; }
    o.gruen=n?gruen/n:0; o.n=n;
    /* Steht ein Stadthaus im Park? Von hoch oben senkrecht runter: der
       erste Treffer darf kein Stadtteil sein. */
    o.haus=[]; const P=bb.PARK;
    for(let x=P.x0+0.5;x<P.x1;x+=2) for(let z=P.z0+0.5;z<P.z1;z+=2){
      rc.set(new THREE.Vector3(x,120,z),down); rc.far=125;
      const h=rc.intersectObjects(bb.scene.children,true).find(i=>i.object.visible&&!(i.object.isPoints));
      if(!h) continue; let st=false; for(let a=h.object;a;a=a.parent) if(a.userData&&a.userData.stadt) st=true;
      if(st&&h.point.y>1) o.haus.push(x.toFixed(0)+'/'+z.toFixed(0)); }
    /* Seeflaeche aus der Geometrie */
    let see=0; bb.scene.traverse(m=>{ if(m.isMesh&&m.material===bb.parkWasser()){
      const pa=m.geometry.attributes.position, ix=m.geometry.index;
      for(let i=0;i<ix.count;i+=3){ const A=ix.getX(i),B=ix.getX(i+1),C=ix.getX(i+2);
        see+=Math.abs((pa.getX(B)-pa.getX(A))*(pa.getY(C)-pa.getY(A))-(pa.getX(C)-pa.getX(A))*(pa.getY(B)-pa.getY(A)))/2; } } });
    o.see=+see.toFixed(1);
    /* Baeume: Laubbaeume (Gruppen) plus Tannenstaemme im Park */
    o.baeume=0;
    bb.scene.children.forEach(c=>{ if(c.userData&&c.userData.baum&&c.position.x>P.x0&&c.position.x<P.x1&&c.position.z>P.z0&&c.position.z<P.z1) o.baeume++; });
    o.baeume+=bb.parkTannen();
    /* Frei: Parkteile duerfen nicht ins Testfeld oder auf den Hof */
    const T=L.test, H=L.hof2, bx=new THREE.Box3(); o.frei=[];
    bb.scene.traverse(m=>{ if(!m.isMesh) return; let park=false; for(let a=m;a;a=a.parent) if(a.userData&&a.userData.park) park=true;
      if(!park) return; bx.setFromObject(m);
      if(bx.min.x<H.x1&&bx.max.z>H.z0) o.frei.push('hof '+bx.min.x.toFixed(2)); });
    /* Park im Testfeld? Die Parkteile sind zu wenigen grossen Meshes
       zusammengefasst, ihre Boxen sagen nichts - also von oben in das
       Testfeld schiessen, jeder Parktreffer zaehlt. */
    for(let x=T.x0+0.3;x<T.x1;x+=1.5) for(let z=T.z0+0.2;z<T.z1;z+=1.5){
      rc.set(new THREE.Vector3(x,40,z),down); rc.far=41;
      const h=rc.intersectObjects(bb.scene.children,true).find(i=>{ if(!i.object.visible) return false; for(let a=i.object;a;a=a.parent) if(a.userData&&a.userData.park) return true; return false; });
      if(h){ o.frei.push('park im testfeld '+x.toFixed(1)+'/'+z.toFixed(1)+' y'+h.point.y.toFixed(1)); break; } }
    return o; });
  const vor=await p.evaluate(()=>window.__bb.parkLeben().map(g=>[g.x,g.z]));
  await p.evaluate(()=>{ for(let i=0;i<60;i++) window.__bb.updatePark(1/30); });
  const nach=await p.evaluate(()=>window.__bb.parkLeben().map(g=>[g.x,g.z]));
  let beweg=0; vor.forEach((v,i)=>{ if(Math.hypot(v[0]-nach[i][0],v[1]-nach[i][1])>0.05) beweg++; });
  r.leben=vor.length; r.beweg=beweg;
  console.log('PARK',JSON.stringify(r));
  pruef('GRUEN',r.n>=60&&r.gruen>=0.9,`nur ${(r.gruen*100).toFixed(0)}% von ${r.n} Rasterpunkten Park`);
  pruef('SEE',r.see>=80,'Seeflaeche '+r.see+' m2');
  pruef('BAEUME',r.baeume>=15,r.baeume+' Baeume');
  pruef('LEBEN',r.leben>=6&&r.beweg===r.leben,`${r.beweg} von ${r.leben} bewegen sich`);
  pruef('FREI',!r.frei.length,r.frei.slice(0,4).join(', '));
  pruef('STADT',!r.haus.length,'Stadthaus im Park bei '+r.haus.slice(0,5).join(' '));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();
