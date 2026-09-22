
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

function begin(fresh,name,slogan){
  ac(); startGame(fresh);
  if(fresh){
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
  $('nameGo').onclick=()=>begin(true,$('shopInput').value,$('sloganInput').value);
  $('nameBack').onclick=()=>zeigeNamen(false);
  $('sloganInput').onkeydown=e=>{ if(e.key==='Enter') $('nameGo').click(); };
  $('shopInput').onkeydown=e=>{ if(e.key==='Enter') $('sloganInput').focus(); };
  startFx();
}
function fontsReady(){
  if(!document.fonts||!document.fonts.load) return Promise.resolve();
  return Promise.race([Promise.all([document.fonts.load('112px Bungee'),document.fonts.load('700 30px "Barlow Condensed"')]),new Promise(r=>setTimeout(r,2500))]).catch(()=>{});
}
setCompact();
fontsReady().then(()=>{
  buildKartons(); ORDER.forEach(t=>{ pools[t]=new ItemPool(buildProduct(t),poolCap(t)); });
  buildWorld();
  { const li=$('logoImg'); if(li) logoFreistellen(LOGO,u=>{ li.src=u; }); }
  initPost(); buildPDA();
  initFlash(); psHuge=new PS(COARSE?700:1800,0.95); psBig=new PS(COARSE?3200:7000,0.45); psMid=new PS(COARSE?1600:3600,0.15); psSmall=new PS(COARSE?900:1800,0.07);
  camera.position.set(pl.x,1.65,pl.z); camera.rotation.set(pitch,yaw,0);
  lastF=-1; applyTOD(); updateSign(); buildStart(); requestAnimationFrame(frame);
  window.__bb={get S(){return S},get phase(){return phase},set phase(v){phase=v},set clock(v){clock=v},get clock(){return clock},pickUp,floorBoxes,shelves,racks,dekos,stockOne,openShop,step,customers,queue,belt,scanBelt,buyUp,buyDeko,get DS(){return DS},endDay,pending,save,openLaptop,closeLaptop,pl,addXP,hireStaff,fireStaff,staff,dirts,addDirt,movables,toggleBuild,setWall,setFloor,
    stations,firePult,placeOnStation,igniteType,get order(){return order},get phone(){return phone},makeCall,answerPhone,haggle,acceptDeal,declineDeal,get truck(){return truck},spawnTruck,takeFromTruck,takeBox,updateTruck,get door(){return door},get tuer(){return tuer},tuerSet,tuerNah,updateSchiebetuer,doorOpen,doorIsOpen,trailerOccupied,LR,lrFront,TOR,orderReady,orderLeft,shipOne,removeFloorBox,prioOf,setPrio,racks,updateCarry,spawnFloorBox,staff,SHELFKIND,layout,shelfCapOf,shelfAccepts,emptyLevel,dateInfo,dateStr,dateShort,seasonInfo,isSunday,dayMult,ruhetag,wageOf,setWage,friendliness,inPause,setPause,windowGrime,addGrime,cleanWindowTick,ambienteScore,bildBoost,fixedCosts,dailyWages,dispoLimit,verfuegbar,dispoZins,takeLoan,loanTier,loanDaily,EVENTS,GOALS,CUSTTYPES,UPGRADES,STAFF,stockOf,spawnInterval,pools,todayEvent,evv,rollEvent,rollMarket,newGoal,goalAdd,goalTick,ekFactor,marktText,xpFor,rollCustType,priceTol,buyChance,regCustomer,makeWishes,nachfrageFaktor,shelfStockOf,buildGravur,refillGrav,openGravInput,closeGravInput,get gravBlanks(){return gravBlanks},set gravBlanks(v){gravBlanks=v},orderBox,buyPack,cartAdd,cartAddPack,cartOrder,cartClear,cartDel,cartGoods,cartFee,cartTotal,cartBoxes,cartLines,LIEFERZEIT_SEK,VERSAND,VERSANDFREI,lieferSek,
    scene,P,EFF,EFF_ALL,EFF_KLEIN,EFF_GROSS,EFF_PRO,SHOWS,kugelbombe,shot,mine,FW,stations,stationOf,placedCount,togglePDA,openPDA,closePDA,setPost,get postOn(){return postOn},get pdaOn(){return pdaOn},showLength,psHuge,psBig,psMid,psSmall,rockets,emitters,timersLen:()=>timers.length,setView:(x,z,y,p)=>{pl.x=x;pl.z=z;yaw=y;pitch=p;aim=null;},schiebe:(x,z)=>{pl.x=x;pl.z=z;collide(pl,0.32);return{x:pl.x,z:pl.z};},PLZ_MAX,camYaw:()=>yaw,camPitch:()=>pitch,playerPos:()=>({x:pl.x,z:pl.z}),pultYaw:()=>pultHit?pultHit.parent.rotation.y:null,applyShopName,shopName,shopSlogan,signTexPx:()=>signTex&&signTex.image?signTex.image.getContext('2d').getImageData(0,0,signTex.image.width,40).data.join(''):null,ckTexPx:()=>ckNameTex&&ckNameTex.image?ckNameTex.image.getContext('2d').getImageData(0,0,ckNameTex.image.width,60).data.join(''):null,testfeldMitte,STATION_POS,aimAt,UPGRADES,upPic,uhrZeiger:()=>({std:uhrStd?+uhrStd.rotation.z.toFixed(4):0,min:uhrMin?+uhrMin.rotation.z.toFixed(4):0}),drawRackSchild,get snowPts(){return snowPts},buildStadt,updateStadt,get stadtBoxen(){return stadtBoxen},get stadtBaeume(){return stadtBaeume},buildFernbaeume,schwaerme,beacons,silhouetten,get verkehrPts(){return verkehrPts},get rauchPts(){return rauchPts},get flieger(){return flieger},stadtFrei,STADT_FREI,WALLS,FLOORS,renderOnline,onlineHint,onlineStufe,onlineZahlen,updateOnline,packLaptop,SCHILDBG,SCHILDFG,setSchild,schildBg,schildFg,repaintSchilder,updateHead,allLevels,addToLevel,putInSlot,regCustomer,ZONEN,zoneOffen,oeffneZone,applyZonen,SLOTS,RACKS,slotsOffen,colliders,LAY,LOGI,WRAMPEN,WTORE,updateSnow,unterDach,dachBereiche,get lapHit2(){return lapHit2},buildLagerTerminal,toggleTest,testLevel,buyUp,get toastLast(){return toastLast},__floorBoxen:()=>floorBoxes.length,WBAY_UP,wbays,dockPlaetze,wbayFrei,wbayOffen,spawnWTruck,updateWBays,wbaysInit,wtorSet,GANG,GANGTUER,buildLagergang,flaeche,WTOR,RACKKIND,route,NAV,navFrei,navIdx,navBuild,shelfStand,shelves,sbLanes,buildSBKasse,packBereit,packOne,paketWert,bestellungenProTag,pakete,PAKET_BAYS,ddlAbholung,updateVersand,createShelf,createRack,startGame,promptFor,ERFOLGE,erfOffen,erfStufe,erfStand,erfZiel,erfFertig,erfAnteil,erfGeschafft,erfGesamt,stat,statAdd,statRekord,statVerkauf,bruchGesehen,gruppeVon,GRUPPE,TRAEGER,BRUCH,BRUCH_IDS,REZ_FARBEN,ETIKETT,traegerVon,traegerOffen,bruchOffen,bruchListe,rezeptWow,rezeptKosten,rezeptMarkt,rezeptHype,rezeptDauer,rezeptEntwicklung,rezeptGueltig,eigeneListe,eigenesEintragen,rezepteTick,rezProto,rezBauen,renderRezeptur,get entwurf(){return entwurf},set entwurf(v){entwurf=v},entwurfInit,ORDER,LIZENZEN,lizenzOf,hatLizenz,lizenzDaten,naechsteLizenz,buyLizenz,VOLA,volaOf,REGIME,marketOf,costOf,marktZiel,marktLuecke,meOf,miOf,marktDelta,marktNiveau,marktPhase,marktSchock,marktLabel,marktSchnitt,marktExtrem,marktChance,sortimentBreite,sortimentZug,bekanntheit,spawnInterval,rollMarkt,marktInit,inflOf,inflText,setPreisAufMarkt,igniteType,get packHit(){return packHit},get target(){return target},
    shot:()=>{ noLoop=true; camera.position.set(pl.x,1.65,pl.z); camera.rotation.set(pitch,yaw,0); camera.updateMatrixWorld(); updateTarget(); applyTOD(); renderFrame(0.016); return canvas.toDataURL('image/jpeg',0.85); },
    run:(sec,dt)=>{ noLoop=true; const n=Math.round(sec/(dt||0.05)); for(let i=0;i<n;i++) step(dt||0.05); }};
});
})();
</script>
</body>
</html>
