/* PROFILER-Wrapper (nur Scratchpad) -- vor 22-start */
(function(){
const P=window.__P;

function tris(o){ let t=0; if(!o.geometry) return 0; const g=o.geometry; const c=g.index?g.index.count:(g.attributes.position?g.attributes.position.count:0); t=c/3; if(o.isInstancedMesh) t*=o.count; return t; }
function snap(){ const s=new Set(); scene.traverse(o=>{ if(o.isMesh||o.isPoints||o.isLine) s.add(o); }); return s; }
window.__snap=snap;
function WR(fn,name){ return function(){
  if(!P.on||typeof scene==='undefined') return fn.apply(this,arguments);
  const before=snap(), tex0=P.texs.length, mat0=P.mats.length, t0=performance.now();
  P.stack.push(name);
  let r; try{ r=fn.apply(this,arguments); } finally { P.stack.pop(); }
  const ms=performance.now()-t0;
  let nm=0,tr=0,dc=0; const mset=new Set();
  scene.traverse(o=>{ if((o.isMesh||o.isPoints||o.isLine)&&!before.has(o)){ if(!o.userData.__own) o.userData.__own=name; nm++; tr+=tris(o); const ms2=Array.isArray(o.material)?o.material:[o.material]; dc+=ms2.length>1?ms2.length:1; ms2.forEach(m=>m&&mset.add(m.id)); } });
  P.calls.push({name,depth:P.stack.length,meshes:nm,tris:Math.round(tr),dc,uniqMats:mset.size,newMatCtor:P.mats.length-mat0,texCalls:P.texs.length-tex0,ms:Math.round(ms*10)/10});
  return r; }; }
window.__WR=WR;
try{ if(typeof buildTor==='function'){ buildTor=WR(buildTor,'buildTor'); } }catch(e){}
try{ if(typeof buildDock==='function'){ buildDock=WR(buildDock,'buildDock'); } }catch(e){}
try{ if(typeof westTor==='function'){ westTor=WR(westTor,'westTor'); } }catch(e){}
try{ if(typeof westTorInnen==='function'){ westTorInnen=WR(westTorInnen,'westTorInnen'); } }catch(e){}
try{ if(typeof buildVersandhof==='function'){ buildVersandhof=WR(buildVersandhof,'buildVersandhof'); } }catch(e){}
try{ if(typeof buildSchiebetuer==='function'){ buildSchiebetuer=WR(buildSchiebetuer,'buildSchiebetuer'); } }catch(e){}
try{ if(typeof hausTuer==='function'){ hausTuer=WR(hausTuer,'hausTuer'); } }catch(e){}
try{ if(typeof eingangsAchse==='function'){ eingangsAchse=WR(eingangsAchse,'eingangsAchse'); } }catch(e){}
try{ if(typeof buildLogistik==='function'){ buildLogistik=WR(buildLogistik,'buildLogistik'); } }catch(e){}
try{ if(typeof buildLogistikHalle==='function'){ buildLogistikHalle=WR(buildLogistikHalle,'buildLogistikHalle'); } }catch(e){}
try{ if(typeof logiHofBauen==='function'){ logiHofBauen=WR(logiHofBauen,'logiHofBauen'); } }catch(e){}
try{ if(typeof logiToreBauen==='function'){ logiToreBauen=WR(logiToreBauen,'logiToreBauen'); } }catch(e){}
try{ if(typeof logiStufeBauen==='function'){ logiStufeBauen=WR(logiStufeBauen,'logiStufeBauen'); } }catch(e){}
try{ if(typeof logiSuedwand==='function'){ logiSuedwand=WR(logiSuedwand,'logiSuedwand'); } }catch(e){}
try{ if(typeof buildPackstation==='function'){ buildPackstation=WR(buildPackstation,'buildPackstation'); } }catch(e){}
try{ if(typeof buildAusbau==='function'){ buildAusbau=WR(buildAusbau,'buildAusbau'); } }catch(e){}
try{ if(typeof halle==='function'){ halle=WR(halle,'halle'); } }catch(e){}
try{ if(typeof durchbruchWand==='function'){ durchbruchWand=WR(durchbruchWand,'durchbruchWand'); } }catch(e){}
try{ if(typeof trennwand==='function'){ trennwand=WR(trennwand,'trennwand'); } }catch(e){}
try{ if(typeof stilleWand==='function'){ stilleWand=WR(stilleWand,'stilleWand'); } }catch(e){}
try{ if(typeof wall==='function'){ wall=WR(wall,'wall'); } }catch(e){}
try{ if(typeof stuetze==='function'){ stuetze=WR(stuetze,'stuetze'); } }catch(e){}
try{ if(typeof sockelLeiste==='function'){ sockelLeiste=WR(sockelLeiste,'sockelLeiste'); } }catch(e){}
try{ if(typeof leuchtenRaster==='function'){ leuchtenRaster=WR(leuchtenRaster,'leuchtenRaster'); } }catch(e){}
try{ if(typeof hofMasten==='function'){ hofMasten=WR(hofMasten,'hofMasten'); } }catch(e){}
try{ if(typeof strassenlampe==='function'){ strassenlampe=WR(strassenlampe,'strassenlampe'); } }catch(e){}
try{ if(typeof buildFacade==='function'){ buildFacade=WR(buildFacade,'buildFacade'); } }catch(e){}
try{ if(typeof buildNachbar==='function'){ buildNachbar=WR(buildNachbar,'buildNachbar'); } }catch(e){}
try{ if(typeof nachbarFassade==='function'){ nachbarFassade=WR(nachbarFassade,'nachbarFassade'); } }catch(e){}
try{ if(typeof buildHaus==='function'){ buildHaus=WR(buildHaus,'buildHaus'); } }catch(e){}
try{ if(typeof hinterhaus==='function'){ hinterhaus=WR(hinterhaus,'hinterhaus'); } }catch(e){}
try{ if(typeof palettenStapel==='function'){ palettenStapel=WR(palettenStapel,'palettenStapel'); } }catch(e){}
try{ if(typeof vsHolzGeo==='function'){ vsHolzGeo=WR(vsHolzGeo,'vsHolzGeo'); } }catch(e){}
try{ if(typeof zaunLauf==='function'){ zaunLauf=WR(zaunLauf,'zaunLauf'); } }catch(e){}
try{ if(typeof gitterZaun==='function'){ gitterZaun=WR(gitterZaun,'gitterZaun'); } }catch(e){}
try{ if(typeof ladezoneBauen==='function'){ ladezoneBauen=WR(ladezoneBauen,'ladezoneBauen'); } }catch(e){}
try{ if(typeof buildZaun==='function'){ buildZaun=WR(buildZaun,'buildZaun'); } }catch(e){}
try{ if(typeof schild==='function'){ schild=WR(schild,'schild'); } }catch(e){}
try{ if(typeof warnSchild==='function'){ warnSchild=WR(warnSchild,'warnSchild'); } }catch(e){}
try{ if(typeof buildYard==='function'){ buildYard=WR(buildYard,'buildYard'); } }catch(e){}
try{ if(typeof buildStreet==='function'){ buildStreet=WR(buildStreet,'buildStreet'); } }catch(e){}
try{ if(typeof buildStadt==='function'){ buildStadt=WR(buildStadt,'buildStadt'); } }catch(e){}
try{ if(typeof buildPark==='function'){ buildPark=WR(buildPark,'buildPark'); } }catch(e){}
try{ if(typeof buildWorld==='function'){ buildWorld=WR(buildWorld,'buildWorld'); } }catch(e){}
try{ if(typeof buildKartons==='function'){ buildKartons=WR(buildKartons,'buildKartons'); } }catch(e){}
try{ if(typeof createShelf==='function'){ createShelf=WR(createShelf,'createShelf'); } }catch(e){}
try{ if(typeof createRack==='function'){ createRack=WR(createRack,'createRack'); } }catch(e){}
try{ if(typeof buildCheckout==='function'){ buildCheckout=WR(buildCheckout,'buildCheckout'); } }catch(e){}
try{ if(typeof buildDesk==='function'){ buildDesk=WR(buildDesk,'buildDesk'); } }catch(e){}
try{ if(typeof buildSBKasse==='function'){ buildSBKasse=WR(buildSBKasse,'buildSBKasse'); } }catch(e){}
try{ if(typeof sbTerminal==='function'){ sbTerminal=WR(sbTerminal,'sbTerminal'); } }catch(e){}
try{ if(typeof buildLagergang==='function'){ buildLagergang=WR(buildLagergang,'buildLagergang'); } }catch(e){}
try{ if(typeof buildSchleuse==='function'){ buildSchleuse=WR(buildSchleuse,'buildSchleuse'); } }catch(e){}
try{ if(typeof streifenvorhang==='function'){ streifenvorhang=WR(streifenvorhang,'streifenvorhang'); } }catch(e){}
try{ if(typeof buildLagerTerminal==='function'){ buildLagerTerminal=WR(buildLagerTerminal,'buildLagerTerminal'); } }catch(e){}
try{ if(typeof buildTablet==='function'){ buildTablet=WR(buildTablet,'buildTablet'); } }catch(e){}
try{ if(typeof lagerFensterWand==='function'){ lagerFensterWand=WR(lagerFensterWand,'lagerFensterWand'); } }catch(e){}
try{ if(typeof abstellAuflieger==='function'){ abstellAuflieger=WR(abstellAuflieger,'abstellAuflieger'); } }catch(e){}
try{ if(typeof hubModell==='function'){ hubModell=WR(hubModell,'hubModell'); } }catch(e){}
try{ if(typeof karreModell==='function'){ karreModell=WR(karreModell,'karreModell'); } }catch(e){}
try{ if(typeof buildBelt==='function'){ buildBelt=WR(buildBelt,'buildBelt'); } }catch(e){}
try{ if(typeof buildGravur==='function'){ buildGravur=WR(buildGravur,'buildGravur'); } }catch(e){}
try{ if(typeof makeBruecke==='function'){ makeBruecke=WR(makeBruecke,'makeBruecke'); } }catch(e){}
try{ if(typeof fugenfueller==='function'){ fugenfueller=WR(fugenfueller,'fugenfueller'); } }catch(e){}
try{ if(typeof buildMuelleimer==='function'){ buildMuelleimer=WR(buildMuelleimer,'buildMuelleimer'); } }catch(e){}
try{ if(typeof buildBaum==='function'){ buildBaum=WR(buildBaum,'buildBaum'); } }catch(e){}
try{ if(typeof makeBaum==='function'){ makeBaum=WR(makeBaum,'makeBaum'); } }catch(e){}
try{ if(typeof bauMoebel==='function'){ bauMoebel=WR(bauMoebel,'bauMoebel'); } }catch(e){}
try{ if(typeof stPoller==='function'){ stPoller=WR(stPoller,'stPoller'); } }catch(e){}
try{ if(typeof stSchild==='function'){ stSchild=WR(stSchild,'stSchild'); } }catch(e){}
try{ if(typeof stFahrradbuegel==='function'){ stFahrradbuegel=WR(stFahrradbuegel,'stFahrradbuegel'); } }catch(e){}
try{ if(typeof stFahrrad==='function'){ stFahrrad=WR(stFahrrad,'stFahrrad'); } }catch(e){}
try{ if(typeof stHydrant==='function'){ stHydrant=WR(stHydrant,'stHydrant'); } }catch(e){}
try{ if(typeof stAutomat==='function'){ stAutomat=WR(stAutomat,'stAutomat'); } }catch(e){}
try{ if(typeof stBriefkasten==='function'){ stBriefkasten=WR(stBriefkasten,'stBriefkasten'); } }catch(e){}
try{ if(typeof stKasten==='function'){ stKasten=WR(stKasten,'stKasten'); } }catch(e){}
try{ if(typeof stLitfass==='function'){ stLitfass=WR(stLitfass,'stLitfass'); } }catch(e){}
try{ if(typeof stHaltestelle==='function'){ stHaltestelle=WR(stHaltestelle,'stHaltestelle'); } }catch(e){}
try{ if(typeof buildStadtmoebel==='function'){ buildStadtmoebel=WR(buildStadtmoebel,'buildStadtmoebel'); } }catch(e){}
try{ if(typeof buildFahrbahn==='function'){ buildFahrbahn=WR(buildFahrbahn,'buildFahrbahn'); } }catch(e){}
try{ if(typeof buildSchneehaufen==='function'){ buildSchneehaufen=WR(buildSchneehaufen,'buildSchneehaufen'); } }catch(e){}
try{ if(typeof buildFernsehturm==='function'){ buildFernsehturm=WR(buildFernsehturm,'buildFernsehturm'); } }catch(e){}
try{ if(typeof buildKran==='function'){ buildKran=WR(buildKran,'buildKran'); } }catch(e){}
try{ if(typeof buildKirche==='function'){ buildKirche=WR(buildKirche,'buildKirche'); } }catch(e){}
try{ if(typeof buildFernbaeume==='function'){ buildFernbaeume=WR(buildFernbaeume,'buildFernbaeume'); } }catch(e){}
try{ if(typeof buildHochstrasse==='function'){ buildHochstrasse=WR(buildHochstrasse,'buildHochstrasse'); } }catch(e){}
try{ if(typeof buildFernverkehr==='function'){ buildFernverkehr=WR(buildFernverkehr,'buildFernverkehr'); } }catch(e){}
try{ if(typeof makeAuto==='function'){ makeAuto=WR(makeAuto,'makeAuto'); } }catch(e){}
try{ if(typeof makeDekoMesh==='function'){ makeDekoMesh=WR(makeDekoMesh,'makeDekoMesh'); } }catch(e){}
try{ if(typeof createDeko==='function'){ createDeko=WR(createDeko,'createDeko'); } }catch(e){}
try{ if(typeof makeWischer==='function'){ makeWischer=WR(makeWischer,'makeWischer'); } }catch(e){}
try{ if(typeof makePerson==='function'){ makePerson=WR(makePerson,'makePerson'); } }catch(e){}
try{ if(typeof tuerTex==='function'){ tuerTex=WR(tuerTex,'tuerTex'); } }catch(e){}
try{ if(typeof fenster==='function'){ fenster=WR(fenster,'fenster'); } }catch(e){}
try{ if(typeof ladenFront==='function'){ ladenFront=WR(ladenFront,'ladenFront'); } }catch(e){}
try{ if(typeof gaube==='function'){ gaube=WR(gaube,'gaube'); } }catch(e){}
try{ if(typeof hausDach==='function'){ hausDach=WR(hausDach,'hausDach'); } }catch(e){}
try{ if(typeof buildWindowGrime==='function'){ buildWindowGrime=WR(buildWindowGrime,'buildWindowGrime'); } }catch(e){}
try{ if(typeof vsTischBauen==='function'){ vsTischBauen=WR(vsTischBauen,'vsTischBauen'); } }catch(e){}
try{ if(typeof roomAO==='function'){ roomAO=WR(roomAO,'roomAO'); } }catch(e){}
try{ if(typeof aoFloor==='function'){ aoFloor=WR(aoFloor,'aoFloor'); } }catch(e){}
try{ if(typeof concreteTex==='function'){ concreteTex=WR(concreteTex,'concreteTex'); } }catch(e){}
try{ if(typeof gitterMat==='function'){ gitterMat=WR(gitterMat,'gitterMat'); } }catch(e){}
try{ if(typeof brickMat==='function'){ brickMat=WR(brickMat,'brickMat'); } }catch(e){}
try{ if(typeof blechMat==='function'){ blechMat=WR(blechMat,'blechMat'); } }catch(e){}
try{ if(typeof torBlattMat==='function'){ torBlattMat=WR(torBlattMat,'torBlattMat'); } }catch(e){}
try{ if(typeof torPanelMat==='function'){ torPanelMat=WR(torPanelMat,'torPanelMat'); } }catch(e){}
try{ if(typeof vdPanelMat==='function'){ vdPanelMat=WR(vdPanelMat,'vdPanelMat'); } }catch(e){}
try{ if(typeof vsWarnTex==='function'){ vsWarnTex=WR(vsWarnTex,'vsWarnTex'); } }catch(e){}
try{ if(typeof ddlSchildTex==='function'){ ddlSchildTex=WR(ddlSchildTex,'ddlSchildTex'); } }catch(e){}
try{ if(typeof wbaysInit==='function'){ wbaysInit=WR(wbaysInit,'wbaysInit'); } }catch(e){}
try{ if(typeof fassadeTex==='function'){ fassadeTex=WR(fassadeTex,'fassadeTex'); } }catch(e){}
try{ if(typeof lichtBauen==='function'){ lichtBauen=WR(lichtBauen,'lichtBauen'); } }catch(e){}
try{ if(typeof lampTeile==='function'){ lampTeile=WR(lampTeile,'lampTeile'); } }catch(e){}
try{ if(typeof logiGlas==='function'){ logiGlas=WR(logiGlas,'logiGlas'); } }catch(e){}
try{ if(typeof logiSchriftzug==='function'){ logiSchriftzug=WR(logiSchriftzug,'logiSchriftzug'); } }catch(e){}
try{ if(typeof drawPackSchild==='function'){ drawPackSchild=WR(drawPackSchild,'drawPackSchild'); } }catch(e){}
try{ if(typeof reserveTex==='function'){ reserveTex=WR(reserveTex,'reserveTex'); } }catch(e){}
try{ if(typeof versandReserve==='function'){ versandReserve=WR(versandReserve,'versandReserve'); } }catch(e){}
try{ if(typeof schneeGeo==='function'){ schneeGeo=WR(schneeGeo,'schneeGeo'); } }catch(e){}
try{ if(typeof buildSchoner==='function'){ buildSchoner=WR(buildSchoner,'buildSchoner'); } }catch(e){}

try{ const t0=tex; tex=function(w,h,draw,srgb){ const d=draw.toString(); let hh=0; for(let i=0;i<d.length;i++) hh=(hh*31+d.charCodeAt(i))|0; P.texs.push({w,h,lab:P.stack.length?P.stack[P.stack.length-1]:'(top)',src:hh,len:d.length,static:draw.length>0}); return t0.apply(this,arguments); }; }catch(e){ P.err=String(e); }
})();
