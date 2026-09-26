
/* =========================================================
   Start
   ========================================================= */
/* =========================================================
   Startmaske: Logo freigestellt, Feuerwerk im Hintergrund
   ========================================================= */
/* Das Logo bringt einen schwarzen Hintergrund mit. Den schneiden wir
   beim Laden weg, damit es frei auf der Maske steht. */
function logoFreistellen(src,cb){
  const img=new Image();
  img.onload=()=>{
    try{
      const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
      const g=c.getContext('2d'); g.drawImage(img,0,0);
      const d=g.getImageData(0,0,c.width,c.height), a=d.data;
      for(let i=0;i<a.length;i+=4){
        const m=Math.max(a[i],a[i+1],a[i+2]);
        if(m<58){ a[i+3]=0; }                       /* fast schwarz: weg */
        else if(m<108){ a[i+3]=Math.round(a[i+3]*(m-58)/50); }  /* Saum weich */
      }
      g.putImageData(d,0,0);
      cb(c.toDataURL('image/png'));
    }catch(e){ cb(src); }
  };
  img.onerror=()=>cb(src);
  img.src=src;
}
/* Feuerwerk hinter dem Logo, reine 2D-Animation */
let fxRaf=0;
function startFx(){
  const c=$('startFx'); if(!c||!c.getContext) return;
  const g=c.getContext('2d'); if(!g) return;
  let parts=[], t0=performance.now(), next=0;
  const FARBEN=[[255,210,63],[230,59,46],[143,214,255],[108,242,168],[214,138,255],[255,146,76]];
  const size=()=>{ const r=c.getBoundingClientRect();
    c.width=Math.max(320,Math.round(r.width*Math.min(2,devicePixelRatio||1)));
    c.height=Math.max(240,Math.round(r.height*Math.min(2,devicePixelRatio||1))); };
  size(); addEventListener('resize',size);
  const knall=()=>{
    const W=c.width, H=c.height;
    const x=rand(W*0.08,W*0.92), y=rand(H*0.08,H*0.62);
    const col=pick(FARBEN), n=COARSE?46:90, sp=rand(1.6,3.4)*(c.width/1200);
    const ring=Math.random()<0.4;
    for(let i=0;i<n;i++){
      const a=ring?(i/n)*Math.PI*2:Math.random()*Math.PI*2;
      const v=ring?sp:sp*Math.sqrt(Math.random());
      parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rand(0.9,1.7),t:0,c:col,s:rand(1.4,3)});
    }
  };
  const step2=(now)=>{
    const dt=Math.min(0.05,(now-t0)/1000); t0=now;
    g.globalCompositeOperation='source-over';
    g.fillStyle='rgba(5,7,15,.24)'; g.fillRect(0,0,c.width,c.height);
    g.globalCompositeOperation='lighter';
    next-=dt; if(next<=0){ next=rand(0.35,1.1); knall(); }
    for(let i=parts.length-1;i>=0;i--){
      const p2=parts[i]; p2.t+=dt;
      if(p2.t>=p2.l){ parts.splice(i,1); continue; }
      p2.x+=p2.vx; p2.y+=p2.vy;
      p2.vy+=0.022*(c.height/900); p2.vx*=0.985; p2.vy*=0.985;
      const f=1-p2.t/p2.l, al=f*f*0.95;
      g.fillStyle=`rgba(${p2.c[0]},${p2.c[1]},${p2.c[2]},${al})`;
      g.fillRect(p2.x-p2.s/2,p2.y-p2.s/2,p2.s,p2.s);
    }
    if(parts.length>4000) parts.splice(0,parts.length-4000);
    fxRaf=requestAnimationFrame(step2);
  };
  fxRaf=requestAnimationFrame(step2);
}
function stopFx(){ if(fxRaf) cancelAnimationFrame(fxRaf); fxRaf=0; }

function begin(fresh,name,slogan,tut){
  ac(); startGame(fresh);
  if(fresh){
    S.tutAus=tut===false;
    S.shopName=(name||'').trim().slice(0,22)||SHOP_DEFAULT;
    S.slogan=(slogan||'').trim().slice(0,38);
    applyShopName(); save();
  } else applyShopName();
  stopFx();
  $('start').classList.remove('show'); startOpen=false; requestLock(); updateHUD();
}
function zeigeNamen(an){
  $('nameBox').classList.toggle('show',an);
  $('start').classList.toggle('naming',an);
  $('startBtns').style.display=an?'none':'flex';
  if(an){ $('shopInput').value=SHOP_DEFAULT; $('sloganInput').value=SLOGAN_DEFAULT; $('shopInput').focus(); $('shopInput').select(); }
}
function buildStart(){
  const b_=$('startBtns'); b_.innerHTML='';
  const mk=(txt,cls,fn)=>{ const b=document.createElement('button'); b.textContent=txt; if(cls) b.className=cls; b.onclick=fn; b_.appendChild(b); };
  if(loadSave()) mk('Weiterspielen','',()=>begin(false));
  mk('Neues Spiel',loadSave()?'ghost':'',()=>zeigeNamen(true));
  $('nameGo').onclick=()=>begin(true,$('shopInput').value,$('sloganInput').value,$('tutInput').checked);
  $('nameBack').onclick=()=>zeigeNamen(false);
  $('sloganInput').onkeydown=e=>{ if(e.key==='Enter') $('nameGo').click(); };
  $('shopInput').onkeydown=e=>{ if(e.key==='Enter') $('sloganInput').focus(); };
  startFx();
}
function fontsReady(){
  if(!document.fonts||!document.fonts.load) return Promise.resolve();
  return Promise.race([Promise.all([document.fonts.load('112px Bungee'),document.fonts.load('700 30px "Barlow Condensed"'),document.fonts.load('700 60px Cinzel')]),new Promise(r=>setTimeout(r,2500))]).catch(()=>{});
}
setCompact();
fontsReady().then(()=>{
  buildKartons(); ORDER.forEach(t=>{ pools[t]=new ItemPool(buildProduct(t),poolCap(t)); });
  buildWorld();
  { const li=$('logoImg'); if(li) logoFreistellen(LOGO,u=>{ li.src=u; }); }
  initPost(); buildPDA();
  initFlash(); psHuge=new PS(COARSE?700:2000,0.95,COARSE?2:4,sternTex); psBig=new PS(COARSE?3600:10000,0.42,COARSE?3:5); psMid=new PS(COARSE?1800:5000,0.15,COARSE?2:3); psSmall=new PS(COARSE?900:1800,0.07);
  camera.position.set(pl.x,1.65,pl.z); camera.rotation.set(pitch,yaw,0);
  /* Schatten ueber die Vorderseiten werfen. Mit den Rueckseiten (der
     Voreinstellung) lag an jeder Stelle, wo eine Wand an eine andere
     stoesst, der beschattete Punkt genau so tief wie die schattende
     Flaeche - in jeder Hallenecke stand ein heller Lichtstrich vom
     Boden bis zur Decke (gemessen 156 Helligkeitsstufen, jetzt 0). */
  scene.traverse(o=>{ if(o.isMesh&&o.castShadow) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(m) m.shadowSide=THREE.FrontSide; }); });
  lastF=-1; applyTOD(); updateSign(); buildStart(); requestAnimationFrame(frame);
  /* Shader fuers Feuerwerk vorab uebersetzen, solange das Startmenue
     steht - dann steht beim Losspielen und beim ersten Schuss nichts */
  setTimeout(()=>{ if(typeof shaderVorab==='function') shaderVorab(); },400);
  window.__bb={get S(){return S},get phase(){return phase},set phase(v){phase=v},set clock(v){clock=v},get clock(){return clock},pickUp,floorBoxes,shelves,racks,dekos,stockOne,openShop,step,customers,queue,belt,scanBelt,buyUp,buyDeko,get DS(){return DS},endDay,pending,save,openLaptop,closeLaptop,pl,addXP,hireStaff,fireStaff,staff,dirts,addDirt,movables,toggleBuild,setWall,setFloor,
    stations,firePult,placeOnStation,igniteType,get order(){return order},get phone(){return phone},makeCall,answerPhone,haggle,acceptDeal,declineDeal,get truck(){return truck},spawnTruck,takeFromTruck,takeBox,dropBox,updateTruck,get door(){return door},get tuer(){return tuer},tuerSet,tuerNah,updateSchiebetuer,doorOpen,doorIsOpen,trailerOccupied,LR,lrFront,TOR,orderReady,orderLeft,shipOne,removeFloorBox,prioOf,setPrio,racks,updateCarry,spawnFloorBox,staff,SHELFKIND,layout,shelfCapOf,shelfAccepts,emptyLevel,dateInfo,dateStr,dateShort,seasonInfo,isSunday,dayMult,ruhetag,wageOf,setWage,friendliness,inPause,setPause,windowGrime,addGrime,cleanWindowTick,ambienteScore,bildBoost,fixedCosts,dailyWages,dispoLimit,verfuegbar,dispoZins,takeLoan,loanTier,loanDaily,EVENTS,GOALS,CUSTTYPES,UPGRADES,STAFF,stockOf,spawnInterval,pools,todayEvent,evv,rollEvent,rollMarket,newGoal,goalAdd,goalTick,ekFactor,marktText,xpFor,rollCustType,priceTol,buyChance,regCustomer,makeWishes,nachfrageFaktor,shelfStockOf,buildGravur,refillGrav,openGravInput,closeGravInput,get gravBlanks(){return gravBlanks},set gravBlanks(v){gravBlanks=v},orderBox,buyPack,cartAdd,cartAddPack,cartOrder,cartClear,cartDel,cartGoods,cartFee,cartTotal,cartBoxes,cartLines,LIEFERZEIT_SEK,VERSAND,VERSANDFREI,lieferSek,
    scene,camera,P,PARK,updatePark,parkWasser:()=>_wasserM,parkTannen:()=>PARK_TANNEN,parkLeben:()=>parkEnten.concat(parkLeute).map(e=>({x:e.g.position.x,z:e.g.position.z})),pendingListe:()=>pending,einbauPakete,spawnPaket,paketAblegen,paketAufheben,EINBAU,PAKET_MASS,vorDieTuer,setSB2,sbZiel,makeAuto,AUTOFORM,stadtInfo:()=>({warn:beacons.length,kronen:KRONEN.length,stufen:SKYLINE_INFO.stufen,skyStile:SKYLINE_INFO.stile.size,stile:Object.keys(STADT_MATS).length}),clearStations,fachHoehe,kindOf,packKartonWert,SUPPLIERS,supplierFor,supplierOf,tierPrice,isUnlocked,lizLevel,renderLaptop,get lsup(){return lsup},set lsup(v){lsup=v},get ltab(){return ltab},set ltab(v){ltab=v},EFF,EFF_ALL,EFF_KLEIN,EFF_GROSS,EFF_PRO,SHOWS,kugelbombe,shot,mine,FW,stations,stationOf,placedCount,togglePDA,openPDA,closePDA,setPost,get postOn(){return postOn},get pdaOn(){return pdaOn},showLength,psHuge,psBig,psMid,psSmall,rockets,emitters,timersLen:()=>timers.length,setView:(x,z,y,p)=>{pl.x=x;pl.z=z;yaw=y;pitch=p;aim=null;},schiebe:(x,z)=>{pl.x=x;pl.z=z;collide(pl,0.32);return{x:pl.x,z:pl.z};},PLZ_MAX,camYaw:()=>yaw,camPitch:()=>pitch,playerPos:()=>({x:pl.x,z:pl.z}),pultYaw:()=>pultHit?pultHit.parent.rotation.y:null,applyShopName,shopName,shopSlogan,signTexPx:()=>signTex&&signTex.image?signTex.image.getContext('2d').getImageData(0,0,signTex.image.width,40).data.join(''):null,lagerWall,fwShot:shot,KUGEL_R,ROHR_INNEN,MOERSER_R,moerserRohr,sfx,WOLKEN,get master(){return master},ac,SORTE_NEU,sortenUmstellen,get shakeWert(){return shake},get ckG(){return ckG},get ckNameTex(){return ckNameTex},get ckMovable(){return ckMov},CK_HOME,CK_ALT,spotPos,queueApproach,ckTexPx:()=>ckNameTex&&ckNameTex.image?ckNameTex.image.getContext('2d').getImageData(0,0,ckNameTex.image.width,60).data.join(''):null,testfeldMitte,STATION_POS,aimAt,UPGRADES,upPic,PLAN,planFlaechen,uhrZeiger:()=>({std:uhrStd?+uhrStd.rotation.z.toFixed(4):0,min:uhrMin?+uhrMin.rotation.z.toFixed(4):0}),drawRackSchild,get snowPts(){return snowPts},buildStadt,updateStadt,get stadtBoxen(){return stadtBoxen},get stadtBaeume(){return stadtBaeume},buildFernbaeume,schwaerme,beacons,silhouetten,get verkehrPts(){return verkehrPts},get rauchPts(){return rauchPts},get flieger(){return flieger},stadtFrei,STADT_FREI,WALLS,FLOORS,renderOnline,onlineHint,onlineStufe,onlineZahlen,onlineListe,updateOnline,SCHILDBG,SCHILDFG,setSchild,schildBg,schildFg,repaintSchilder,updateHead,allLevels,addToLevel,putInSlot,regCustomer,ZONEN,zoneOffen,oeffneZone,applyZonen,SLOTS,RACKS,slotsOffen,colliders,LAY,LOGI,WRAMPEN,WTORE,updateSnow,unterDach,dachBereiche,get lapHit2(){return lapHit2},buildLagerTerminal,toggleTest,testLevel,buyUp,get toastLast(){return toastLast},__floorBoxen:()=>floorBoxes.length,WBAY_UP,wbays,dockPlaetze,wbayFrei,wbayOffen,spawnWTruck,updateWBays,wbaysInit,wtorSet,GANG,GANGTUER,buildLagergang,flaeche,WTOR,RACKKIND,route,NAV,navFrei,navIdx,navBuild,shelfStand,shelves,sbLanes,buildSBKasse,sbFrei,sbOffen,sbNutzbar,EING2,eingaenge,naechsterEingang,setEingang2,buildSBKasse2,get sb2G(){return sb2G},TUEREN,tuerSetD,tuerNahD,packBereit,packOne,paketWert,bestellungenProTag,pakete,ddlAbholung,updateVersand,VS_GR,VS_FELD,WG_PARK,vsNeueBestellung,vsAbgleich,vsKlasse,vsQuellen,vsBestand,vsErfuellbar,vsPlan,vsStapel,vsSpielerPacken,vsSpielerBestellung,vsTischFrei,vsStatus,vsAufraeumen,vsLaden,vsBahn,vsPaketOffen,vsKlappen,vsFuellung,vsPaketZu,get vsTisch(){return vsTisch},get vsWagen(){return vsWagen},createShelf,createRack,regalStellen,testKauf,regalAufbauen,orderRegal,REGALWARE,regalOf,regalKind,regalPreis,regalPlatz,regalOffen,startGame,promptFor,ERFOLGE,erfOffen,erfStufe,erfStand,erfZiel,erfFertig,erfAnteil,erfGeschafft,erfGesamt,stat,statAdd,statRekord,statVerkauf,bruchGesehen,gruppeVon,GRUPPE,TRAEGER,BRUCH,BRUCH_IDS,REZ_FARBEN,ETIKETT,traegerVon,traegerOffen,bruchOffen,bruchListe,rezeptWow,rezeptKosten,rezeptMarkt,rezeptHype,rezeptDauer,rezeptEntwicklung,rezeptGueltig,eigeneListe,eigenesEintragen,rezepteTick,rezProto,rezBauen,renderRezeptur,get entwurf(){return entwurf},set entwurf(v){entwurf=v},entwurfInit,ORDER,LIZENZEN,lizenzOf,hatLizenz,lizenzDaten,naechsteLizenz,buyLizenz,VOLA,volaOf,REGIME,marketOf,costOf,marktZiel,marktLuecke,meOf,miOf,marktDelta,marktNiveau,marktPhase,marktSchock,marktLabel,marktSchnitt,marktExtrem,marktChance,sortimentBreite,sortimentZug,bekanntheit,spawnInterval,rollMarkt,marktInit,inflOf,inflText,setPreisAufMarkt,igniteType,get packHit(){return packHit},get packTisch(){return packTisch},get packMov(){return packMov},zuendeKanal,zuendeAlle,alleKanaele,kanalItem,openZuend,closeZuend,get zuendOpen(){return zuendOpen},overlayOpen,pultTaster,zuendTick,TISCH_X,RAMPE_X,KANAL_START,bereitCount,brennDauer,muendung,pultLamps,RAKETEN_LOOK,RAKETEN_KL,makePerson,applyTOD,updateHUD,renderer,renderFrame,get DEMO(){return DEMO},LHALLE,LOGI_STUFEN,TOR_STUFE,logiStufe,logiZeige,logiAnwenden,LOGI_G,TOR_G,WTORE,tuAktion:(kind,ref)=>{ const alt=target; target={kind,ref}; try{ doAction(); } finally { target=alt; } },promptFor,KARREN,karreArt,karreAn,karreStapel,karreLast,karreNimmt,toggleKarre,updateKarre,setTutorial,tutorialAn,zielFuer,get zielAktuell(){return zielAktuell},get tipKey(){return tipKey},updateZiel,set DEMO(v){DEMO=v},kapitelVon,kapitelVoll,openHandy,closeHandy,toggleHandy,get handyOpen(){return handyOpen},get happ(){return happ},HANDY_APPS,renderHandy,shaderVorab,SCHONER,schonerMalen,updateSchoner,makeWischer,stelleWischer,get wischer(){return wischer},updateWischen,wischerPersonal,cleanTick,updateFireworks,FLASH,spurEnden,LR_LAMPE,schweber,kundenSymbol,geldSchwebt,get serie(){return serie},serieZufrieden,serieBricht,KAPITEL,kapitel,kapitelNr,kapitelAufstieg,WA,WA_SLOTS,vorDieTuer,SB_KASSIERER,sbBesetzt,sbLaneVon,sbKassiererPlatz,MUSIK,STUECKE,musikAn,musikWeiter,musikVol,musikTick,spielSchritt,get mStep(){return mStep},set mStep(v){mStep=v;mTakte=0;},get mBus(){return mBus},get postHalf(){return postHalf},EFF_SCHWEIF,mitSchweif,KOEPFE,KLEID,UNIFORM,STAFFKOPF,faceCache,animPerson,PACKS,packPreis,packPool,packOffen,packContents,syncPakete,rotateGrab,PACK_FL,PACK_HOME,spotFree,rectOf,grab,placeGrab,updateGrab,get grabbed(){return grabbed},showPause,get target(){return target},einrOf,einrAktiv,einrHoch,einrRunter,einrSchalten,AUFGABEN,einrJob,kartonMat,pools,shelfStockOf,removeFromLevel,fwLog:(a)=>{FW_LOG=a;},moerserRohr,ROHR_KALIBER,effPassen,EFF_FAMILIE,basisBlick,fwTestSchalten,fwTestProdukte,fwTestStapeln,get fwTestAn(){return fwTestAn},get fwTestBoxen(){return fwTestBoxen},sonne:()=>sun.intensity,get fwUhr(){return FW_UHR},THEMEN,SHOW_BASIS,EFF,emittersListe:()=>emitters,
    shot:()=>{ noLoop=true; camera.position.set(pl.x,1.65,pl.z); camera.rotation.set(pitch,yaw,0); camera.updateMatrixWorld(); updateTarget(); applyTOD(); renderFrame(0.016); return canvas.toDataURL('image/jpeg',0.85); },
    run:(sec,dt)=>{ noLoop=true; const n=Math.round(sec/(dt||0.05)); for(let i=0;i<n;i++) step(dt||0.05); }};
});
})();
</script>
</body>
</html>
