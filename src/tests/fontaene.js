/* Fontaenen (Toms PDF vom 25.09.): "Fontaene ist Fontaene" - aus
   keiner Fontaene steigt eine Ladung, ein Komet oder eine Rakete. Die
   Monsterfontaenen erreichen 30 und 50 m, sind kurz und werden mit der
   Hoehe bunter. Gemessen an den Sternen selbst, nicht an Parametern. */
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
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, out={}; bb.S.level=40; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    const pos={x:0,y:0.4,z:-20};
    const hue=(r,g,b)=>{ const mx=Math.max(r,g,b), mn=Math.min(r,g,b); if(mx-mn<0.18) return -1;
      let h; if(mx===r) h=((g-b)/(mx-mn))%6; else if(mx===g) h=(b-r)/(mx-mn)+2; else h=(r-g)/(mx-mn)+4; return Math.floor(((h*60+360)%360)/30); };
    const miss=t=>{ const log=[]; bb.fwLog(log); bb.run(16,0.1);
      const r0=bb.rockets.length; bb.igniteType(t,pos);
      let hoch=0, dauer=0, raketen=0; const proBild=[];
      for(let s=0;s<32;s+=0.25){ bb.run(0.25,0.05); raketen=Math.max(raketen,bb.rockets.length-r0);
        const aktiv=bb.emittersListe().some(e=>e.o===pos&&e.k!=='fuse'); if(aktiv) dauer=s+0.25;
        const anteil={}; let gesamt=0;
        for(const ps of [bb.psMid,bb.psBig]) for(let i=0;i<ps.life.length;i++){ if(ps.life[i]<=0) continue;
          const x=ps.pos[i*3], y=ps.pos[i*3+1], z=ps.pos[i*3+2];
          if(Math.abs(x-pos.x)<12&&Math.abs(z-pos.z)<12){ hoch=Math.max(hoch,y-pos.y);
            if(y-pos.y>3){ gesamt++; const h=hue(ps.base[i*3],ps.base[i*3+1],ps.base[i*3+2]); if(h>=0) anteil[h]=(anteil[h]||0)+1; } } }
        if(aktiv&&gesamt>50) proBild.push(Object.values(anteil).filter(n=>n>=gesamt*0.05).length); }
      bb.fwLog(null);
      /* Farben, die gleichzeitig zu sehen sind: je mindestens 5 % der
         Sterne in einem Bild, Median ueber die Brenndauer. Einzelne
         Zufallssterne zaehlen nicht, ein Farbwechsel ueber die Zeit auch
         nicht - sonst waere die Feuersaeule mal 4, mal 5 Farben bunt. */
      proBild.sort((a,b)=>a-b); const farben=proBild.length?proBild[Math.floor(proBild.length/2)]:0;
      return {schuesse:log.length,raketen,hoch:+hoch.toFixed(1),dauer,farben}; };
    for(const t of ['fontaene','vulkan','sternenbrunnen','goldgeysir','feuersaeule','feuerbrunnen','wasserfall','fontaene30','fontaene50']) out[t]=miss(t);
    /* Bild der Monsterfontaenen (Tom, 25.09.): "sieht aus wie
       Laserstrahlen" und "30 und 50 m sahen fast gleich aus".
       spur: 90-%-Wert der Leuchtspurlaenge im Strahl (Laser = lange Striche)
       puls: Schwankung der Sternzahl im mittleren Band ueber die Zeit
       strahl: Buendelung auf 8 gleich verteilte Richtungen je Bild
         (Betrag der 8. Harmonischen; gleichmaessig verteilt ~ 1/Wurzel n) */
    const signatur=(t,hm)=>{ bb.run(16,0.1); bb.igniteType(t,pos); bb.run(4,0.05);
      const spur=[], zahl=[], anteile=[];
      for(let f=0;f<60;f++){ bb.run(0.05,0.05); let n=0, hc=0, hs=0;
        for(const ps of [bb.psMid,bb.psBig]){
          for(let i=0;i<ps.life.length;i++){ if(ps.life[i]<=0) continue;
            const x=ps.pos[i*3]-pos.x, y=ps.pos[i*3+1]-pos.y, z=ps.pos[i*3+2]-pos.z;
            if(y<hm*0.42||y>hm*0.5||Math.hypot(x,z)>hm*0.5) continue; n++;
            const th=Math.atan2(z,x)*8; hc+=Math.cos(th); hs+=Math.sin(th); }
          if(f%10===0&&ps.nl) for(let q=0;q<ps.nl;q++){ const [k,e]=bb.spurEnden(ps,q);
            if(k[1]-pos.y>3&&Math.hypot(k[0]-pos.x,k[2]-pos.z)<hm*0.5) spur.push(Math.hypot(k[0]-e[0],k[1]-e[1],k[2]-e[2])); } }
        zahl.push(n); if(n>=10) anteile.push(Math.hypot(hc,hs)/n); }
      spur.sort((a,b)=>a-b); const m=zahl.reduce((a,b)=>a+b,0)/zahl.length, sd=Math.sqrt(zahl.reduce((a,b)=>a+(b-m)*(b-m),0)/zahl.length);
      bb.run(20,0.1);
      return {spur:+(spur[Math.floor(spur.length*0.9)]||0).toFixed(1),puls:+(sd/Math.max(1,m)).toFixed(2),strahl:+(anteile.reduce((a,b)=>a+b,0)/Math.max(1,anteile.length)).toFixed(2),sterne:Math.round(m)}; };
    out.sig30=signatur('fontaene30',30); out.sig50=signatur('fontaene50',50);
    out.sigGeysir=signatur('goldgeysir',out.goldgeysir.hoch); out.sigSaeule=signatur('feuersaeule',out.feuersaeule.hoch);
    out.lvl={g:bb.P.goldgeysir.lvl,f:bb.P.feuersaeule.lvl,m30:bb.P.fontaene30.lvl,m50:bb.P.fontaene50.lvl};
    out.lizenz=[bb.lizenzOf('fontaene30'),bb.lizenzOf('fontaene50')];
    return out; });
  for(const t of Object.keys(r)) console.log(t.padEnd(15),JSON.stringify(r[t]));
  const F=['fontaene','vulkan','sternenbrunnen','goldgeysir','feuersaeule','feuerbrunnen','wasserfall','fontaene30','fontaene50'];
  F.forEach(t=>pruef('LADUNG',r[t].schuesse===0&&r[t].raketen===0,`${t} wirft ${r[t].schuesse} Ladungen aus`));
  pruef('HOEHE30',r.fontaene30.hoch>=27&&r.fontaene30.hoch<=34,'30-m-Fontaene erreicht '+r.fontaene30.hoch+' m');
  pruef('HOEHE50',r.fontaene50.hoch>=46&&r.fontaene50.hoch<=55,'50-m-Fontaene erreicht '+r.fontaene50.hoch+' m');
  pruef('LEITER',r.goldgeysir.hoch<r.feuersaeule.hoch&&r.feuersaeule.hoch<r.fontaene30.hoch&&r.lvl.g<r.lvl.f&&r.lvl.f<r.lvl.m30&&r.lvl.m30<r.lvl.m50,'Hoehe oder Level steigen nicht: '+JSON.stringify(r.lvl));
  pruef('KURZ',r.fontaene30.dauer<=13&&r.fontaene50.dauer<=15,'zu lang: '+r.fontaene30.dauer+' / '+r.fontaene50.dauer+' s');
  pruef('BUNT',r.fontaene30.farben>=5&&r.fontaene50.farben>r.fontaene30.farben&&r.fontaene30.farben>r.goldgeysir.farben&&r.fontaene30.farben>r.feuersaeule.farben,'nicht bunter mit der Hoehe: '+[r.goldgeysir.farben,r.feuersaeule.farben,r.fontaene30.farben,r.fontaene50.farben]);
  pruef('LIZENZ',r.lizenz.every(Boolean),'ohne Lizenz');
  const s30=r.sig30, s50=r.sig50;
  pruef('KEIN_LASER',[s30,s50,r.sigGeysir,r.sigSaeule].every(x=>x.spur<3.5),'Leuchtspuren im Strahl bis '+[s30,s50,r.sigGeysir,r.sigSaeule].map(x=>x.spur).join(' / ')+' m lang');
  pruef("DICHT",s30.sterne>=12&&s50.sterne>=12,'Fontaene zu duenn: '+s30.sterne+' / '+s50.sterne+' Sterne im Band');
  pruef('PULS30',s30.puls>=0.2&&s30.puls>=2*s50.puls,'30 m pulsiert nicht: '+s30.puls+' gegen '+s50.puls);
  pruef('STRAHLEN50',s50.strahl>=0.45&&s50.strahl>=s30.strahl+0.25,'50 m ohne eigene Strahlen: '+s50.strahl+' gegen '+s30.strahl);
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();
