// Zeichenaufrufe je Ansicht und je Gruppe|Bauteil|Klasse|Material (Feinschliff Werk 15.10.): node -r <arbeitsordner>/ladezeit-preload.js tools/halle/zaehlen.js <real.html> <aus.json> [gfx]
// Gleiche Ansichtsfolge wie tools/halle/messen.js; '_info' = renderer.info. Aufruf im Arbeitsordner (start-hilfe.js). Zwei Staende mit derselben Folge vergleichen - messen.js-Werkzahlen schwanken mit dem Stand der Laufzeit-Buendelung.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const H=require(require('path').join(__dirname,'../test/start-hilfe.js'));
(async()=>{
  const html=process.argv[2], out=process.argv[3], g=process.argv[4]||'ultralow';
  const V={laden:[0,3,0,0],lager:[-14,-2,0,0],halleW:[-46,-10,0,0],hochregal:[-43.2,-25.6,Math.PI/2,0.1],wareneingang:[-30,-24,Math.PI*0.75,-0.1],lager3:[-21,-12,Math.PI/2,0],schleuse:[-16,-23,Math.PI/2*1.05,0],dockHof:[-27,3,-Math.PI/2,0],strasse:[0,12,Math.PI,0.05],werkS1:[-71.5,-13.75,Math.PI/2,0],werkS3:[-71.5,-24.75,Math.PI/2,0],leitstand:[-82,-9.6,0,-0.25],verbindung:[-67.5,-9,Math.PI/2,0],hofWest:[-87,-48,Math.PI,0.05],mischhaus:[-100,-40,2.45,0]};
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:960,height:600}});
  await H.laden(p,html);
  await p.evaluate(g=>{ localStorage.clear(); localStorage.setItem('bb_gfx',g); },g);
  await H.neuladen(p); await H.neuesSpiel(p,{stoppen:true});
  const r=await p.evaluate(V=>{ const bb=window.__bb, R=bb.renderer;
    bb.S.level=99; bb.S.money=9e6; for(const u of bb.UPGRADES) if(!u.geplant) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} bb.run(2,0.05);
    if(bb.buendelJetzt) bb.buendelJetzt();
    const o={}; let rec=null, inf=null; const rb=R.renderBufferDirect.bind(R); const r0=R.render.bind(R); R.render=function(sc,c){ const r=r0(sc,c); if(inf&&sc===bb.scene){ inf.calls+=R.info.render.calls; inf.n++; } return r; };
    R.renderBufferDirect=function(cam,sc,geo,mat,obj,grp){ if(rec&&sc===bb.scene){ let top=obj; const pfad=[]; while(top.parent&&top.parent!==bb.scene){ top=top.parent; } const k=(top.name||top.type)+'|'+(obj.userData.bauteil||'')+'|'+(obj.userData.klasse||'')+'|'+(mat.userData&&mat.userData.mat||mat.type)+(obj.userData._bnd?'|B':''); rec[k]=(rec[k]||0)+1; } return rb(cam,sc,geo,mat,obj,grp); };
    for(const k in V){ const v=V[k]; bb.setView(v[0],v[1],v[2],v[3]); bb.clock=600; bb.run(0.2,0.05); bb.clock=600; bb.applyTOD();
      for(let i=0;i<2;i++){ bb.kameraSetzen(); bb.renderFrame(0.016); }
      rec={}; inf={calls:0,n:0}; bb.kameraSetzen(); bb.renderFrame(0.016); rec._info=inf.calls; rec._renders=inf.n; o[k]=rec; rec=null; inf=null; }
    return o; },V);
  fs.writeFileSync(out,JSON.stringify(r,null,1)); console.log('fertig'); await b.close();
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });
