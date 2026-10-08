/* Laeden gegenueber (Tom, 26.09.: "so aussehen, als sind da Laeden
   drin, gerne 3D"): jeder Laden hat einen Innenraum mit Einrichtung
   und Deckenlicht, die Fassade ist im Schaufenster ausgespart und die
   Scheibe laesst hineinsehen.
   08.10.: Die Einrichtung ist bedruckt (ein gemeinsamer Textur-Atlas fuer
   alle Innenraeume, Tom: "so realistisch wie moeglich"). TEXTUR prueft,
   dass jeder Innenraum den Atlas traegt, der Atlas bunt bemalt ist (keine
   Einfarbflaeche) und die UVs wirklich viele verschiedene Stellen im Atlas treffen
   (gemessen 21-74 Rasterpunkte je Laden, ungefaerbte Quader haetten ~4).
   STRASSE prueft, dass die Zeile gegenueber dieselben Laeden an denselben
   Stellen hat wie vorher - die Einrichtung wuerfelt mit eigenem Zufall und
   zieht den alten Verbrauch am Seed nach (_altZufall). */
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
  const r=await p.evaluate(()=>{ const bb=window.__bb, o={innen:[],licht:0,schilder:0,ausgespart:0,scheiben:[],tex:[]};
    bb.scene.traverse(m=>{ if(!m.isMesh||!m.material) return; const M=m.material;
      if(M.isMeshBasicMaterial&&M.color&&M.color.getHexString()==='fff6e2') o.licht++;
      if(M.isMeshStandardMaterial&&M.vertexColors&&M.emissive&&M.emissive.getHexString()===new THREE.Color(0x40362a).convertSRGBToLinear().getHexString()){ o.innen.push(m.geometry.attributes.position.count);
        const uv=m.geometry.attributes.uv, U=new Set(); for(let i=0;i<uv.count;i++) U.add(Math.round(uv.getX(i)*64)+','+Math.round(uv.getY(i)*64));
        const v=new THREE.Vector3(); new THREE.Box3().setFromObject(m).getCenter(v);
        o.tex.push({n:m.userData.ladenInnen||'?',x:+v.x.toFixed(1),map:!!M.map,w:M.map&&M.map.image?M.map.image.width:0,uv:U.size});
        if(M.map&&M.map.image&&o.farben===undefined){ const im=M.map.image; let d=im.data; if(!d&&im.getContext) d=im.getContext('2d').getImageData(0,0,im.width,im.height).data;
          const F=new Set(); if(d) for(let i=0;i<d.length;i+=4*997) F.add((d[i]>>4)+'-'+(d[i+1]>>4)+'-'+(d[i+2]>>4)); o.farben=F.size; } }
      if(Array.isArray(M)) return; });
    /* Hausfronten mit Aussparung: Material mit alphaTest und transparentem Pixel mitten im Schaufenster */
    bb.scene.traverse(m=>{ if(!m.isMesh||!Array.isArray(m.material)) return; const F=m.material[4]; if(!F||!F.map||!(F.alphaTest>0)) return;
      /* seit 03.10. liegen fertige Texturen als ImageData vor (texSpar), nicht mehr als Canvas */
      const c=F.map.image, px=Math.round(c.width*0.4), py=Math.round(c.height*0.85), a=c.data?c.data[(py*c.width+px)*4+3]:c.getContext('2d').getImageData(px,py,1,1).data[3]; if(a===0) o.ausgespart++; });
    return o; });
  console.log('LAEDEN',JSON.stringify({innen:r.innen.length,min:Math.min(...r.innen),licht:r.licht,ausgespart:r.ausgespart}));
  pruef('INNENRAUM',r.innen.length>=3&&Math.min(...r.innen)>=400,'Laeden ohne Innenraum: '+JSON.stringify(r.innen));
  pruef('LICHT',r.licht>=r.innen.length,'Innenraeume ohne Deckenlicht');
  console.log('TEXTUR',JSON.stringify({farben:r.farben,laeden:r.tex}));
  pruef('TEXTUR',r.tex.length>0&&r.tex.every(l=>l.map&&l.w>=512&&l.uv>=15)&&r.farben>=60,'Innenraum ohne Atlas-Textur oder Einfarbflaechen: '+JSON.stringify({farben:r.farben,laeden:r.tex}));
  /* Zeile gegenueber wie vor dem Umbau (Desktop, Stand 08.10.) */
  const SOLL=[['PIZZERIA',-30.5],['KIOSK',-7.7],['REISEBÜRO',-0.9],['METZGEREI',10.4],['BLUMEN',19.9],['BUCHHANDLUNG',37.4]], ist=r.tex.slice().sort((a,b)=>a.x-b.x);
  pruef('STRASSE',ist.length===SOLL.length&&SOLL.every((s,i)=>ist[i].n===s[0]&&Math.abs(ist[i].x-s[1])<0.4),'Laeden gegenueber haben sich verschoben: '+JSON.stringify(ist.map(l=>l.n+'@'+l.x)));
  pruef('AUSGESPART',r.ausgespart>=r.innen.length&&r.ausgespart>0,'Fassade vor dem Laden nicht ausgespart: '+r.ausgespart+' von '+r.innen.length);
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();
