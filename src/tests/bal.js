/* Startmaske: Neues Spiel -> Namensmaske -> aufschliessen */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']}); const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message+' | '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined');
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined');
  await neuesSpiel(p); await p.waitForTimeout(200);

  const DAYS=+(process.argv[3]||30);
  const log=[];
  for(let day=0;day<DAYS;day++){
    const r=await p.evaluate(()=>{
      const bb=window.__bb,S=bb.S,P=bb.P;
      // --- Einkaufsphase: Regale kaufen, Ware bestellen ---
      const puffer=bb.dayMult(S.day)<0.95?2.1:1.35;
      /* Nebensaison: Personal in Kurzarbeit, in der Saison zurueck an Bord */
      const flau=bb.dayMult(S.day)<0.95;
      for(const st of bb.STAFF){ if(S.staff[st.id]&&bb.inPause(st.id)!==flau) bb.setPause(st.id,flau); }
      /* Regale kommen jetzt vom Lieferanten: bestellen, bezahlen,
         der LKW bringt sie. Pro Durchlauf hoechstens eines je Art,
         sonst bestellt der Testspieler auf denselben Platz zehnmal. */
      const unterwegs=()=>bb.pending.filter(q=>q.regal).length;
      const kinds=['klein','standard','hoch','kuehl','gondel','eck','rack','rhoch','rschwer'];
      for(const id of kinds){
        if(bb.regalOffen(id)&&bb.regalPlatz(id)&&S.money>bb.regalPreis(id)*1.7+90
           &&bb.shelves.length+bb.racks.length+unterwegs()<bb.slotsOffen().length+bb.RACKS.length) bb.orderRegal(id);
      }
      for(const id of ['shop_halb','lager','shop_gross','lager_nord','lager_gross','packstation','kasse2','onlineshop','grosskunden','shop_ost','lager_sued','shop_sued','lager_west','plakat','terminal','heizung','musik','cams','regallicht','alarm','klima']){
        const u=bb.UPGRADES.find(x=>x.id===id);
        if(u&&S.level>=u.lvl&&!u.done()&&(!u.req||S.up[u.req])&&S.money>u.cost()*(u.kat==='flaeche'?1.25:2.2)*puffer+400) bb.testKauf(id);
      }
      /* Lizenzpakete kaufen, sobald sie ohne Not bezahlbar sind.
         In der Nebensaison bleibt mehr Puffer stehen. */
      for(const l of bb.LIZENZEN){
        if(!bb.hatLizenz(l.id)&&S.level>=l.lvl&&S.money>l.cost*puffer+400) bb.buyLizenz(l.id);
      }
      /* Einstellen nur, wenn die Stelle auch gebraucht wird und das
         Konto es traegt. Packer ohne Packstation waere rausgeworfenes Geld. */
      for(const s of bb.STAFF){
        if(S.staff[s.id]||S.level<s.lvl) continue;
        if(s.req&&!S.up[s.req]) continue;
        if(s.id==='packer'&&!bb.packBereit()) continue;
        if(S.money>s.hire*12*puffer+(bb.fixedCosts()+bb.dailyWages())*10){
          S.money=Math.round((S.money-s.hire)*100)/100; S.staff[s.id]=true; bb.hireStaff(s.id); }
      }
      /* Kredit aufnehmen, bevor das Regal leerlaeuft */
      if(!S.loan&&bb.loanTier()&&S.money<bb.fixedCosts()*3) bb.takeLoan(bb.loanTier().amount);
      /* Ebbe in der Kasse: ein Spieler baut Personal ab, statt
         zuzusehen, wie das Konto leerlaeuft. */
      const polster=()=>(bb.fixedCosts()+bb.dailyWages())*4;
      for(const id of ['security','packer','kassierer','auffueller2','reinigung','auffueller']){
        if(S.money>=polster()) break;
        if(S.staff[id]){ bb.fireStaff(id); S.staff[id]=false; }
      }
      const types=Object.keys(P).filter(t=>bb.hatLizenz(bb.lizenzOf(t))&&!P[t].noShelf&&!P[t].noOrder);
      // Nach Bedarf bestellen: immer die Sorte mit dem duennsten Bestand
      /* Wie ein Spieler: alles in den Warenkorb, dann eine Lieferung */
      let tries=0; bb.cartClear();
      const imKorb=t=>bb.cartLines().reduce((a,l)=>a+(l.t===t?l.n:0),0)*P[t].box;
      while(tries<40&&bb.pending.length+bb.cartBoxes()<12){
        tries++;
        let best=null,bv=1e9;
        for(const t of types){ const cap=bb.shelfCapOf(t); if(!cap) continue;
          const v=(bb.stockOf(t)+imKorb(t))/Math.max(1,cap); if(v<bv&&v<1.6){ bv=v; best=t; } }
        if(!best) break;
        bb.cartAdd(best,1,'mertens');
        if(bb.cartTotal()>bb.verfuegbar()-90){ bb.cartDel(bb.cartLines().length-1); break; }
      }
      if(bb.cartBoxes()) bb.cartOrder(); else bb.cartClear();
      // Preise leicht ueber Markt, wie es ein Spieler macht
      types.forEach(t=>{ S.prices[t]=Math.round(bb.marketOf(t)*1.08*100)/100; });
      return {money:S.money,lvl:S.level,lic:S.lic.length};
    });
    // --- Lieferung + Einräumen + Verkaufstag ---
    const d=await p.evaluate(()=>{
      const bb=window.__bb,S=bb.S;
      const stow=()=>{
        for(let k=0;k<40;k++){
          if(!bb.truck||bb.truck.state!=='docked'||!bb.truck.cargo.length) break;
          S.carrying=null; bb.takeFromTruck();
          if(S.carrying){ const c=S.carrying;
            /* Regale kommen als Paket: sofort aufbauen */
            if(c.regal){ bb.regalAufbauen(c.regal); S.carrying=null; bb.updateCarry(); continue; }
            for(let j=0;j<c.count;j++){ const lv=bb.emptyLevel(c.type); if(!lv) break; bb.addToLevel(lv,c.type,c.q); }
            S.carrying=null; }
        }
        for(const fb of bb.floorBoxes.slice()){
          /* volle Kartons zuerst ins Lagerregal, damit Grossauftraege
             ueberhaupt bedient werden koennen */
          if(bb.S.up.grosskunden&&fb.count>=Math.ceil(bb.P[fb.type].box*0.9)){
            let frei=null;
            for(const r of bb.racks){ for(const sl of r.slots) if(!sl.box){ frei=sl; break; } if(frei) break; }
            const imLager=bb.racks.reduce((a,r)=>a+r.slots.filter(s2=>s2.box).length,0);
            if(frei&&imLager<Math.max(6,bb.racks.length*2)){ bb.putInSlot(frei,fb.type,fb.count,fb.q); bb.removeFloorBox(fb); continue; }
          }
          let n=fb.count;
          while(n>0){ const lv=bb.emptyLevel(fb.type); if(!lv||!bb.addToLevel(lv,fb.type,fb.q)) break; n--; }
        }
      };
      /* Grossauftraege annehmen, einmal handeln, dann ausliefern */
      const telefon=()=>{
        if(bb.phone&&bb.phone.state==='ringing'){
          bb.answerPhone();
          if(bb.phone.call&&bb.phone.call.rounds>0) bb.haggle(0.1);
          if(bb.phone.call) bb.acceptDeal();
          const d2=document.getElementById('deal'); if(d2) d2.classList.remove('show');
        }
        if(bb.order&&bb.order.arrive<=0){ for(let k=0;k<12&&bb.orderReady()>0;k++) bb.shipOne(); }
      };
      for(let r=0;r<10;r++){ bb.run(25,0.05); stow(); }
      S.carrying=null; bb.updateCarry();
      const vorher={regal:bb.allLevels().reduce((a,l)=>a+l.count,0),kartons:bb.floorBoxes.length,
        offen:bb.pending.length,lkw:bb.truck?bb.truck.cargo.length:-1,
        lager:bb.racks.reduce((a,r)=>a+r.slots.filter(s2=>s2.box).length,0),
        voll:Object.keys(bb.P).filter(t=>bb.pools[t]&&bb.pools[t].full()).length};
      const ruhe=bb.ruhetag();
      if(!ruhe){
        bb.openShop();
        for(let i=0;i<7200;i++){ bb.step(0.05);
          if(bb.belt.length) bb.scanBelt(bb.belt[0]);
          const reg=bb.regCustomer();
          if(reg&&reg.state==='pay'){ if(reg.method==='card') reg.finishCard(); else reg.finishCash(Math.round((reg.given-reg.total)*100)/100); }
          if(i%400===0){ stow(); telefon(); }   // Spieler füllt nach und geht ans Handy
          if(i%60===0&&bb.packBereit()) bb.packOne(true);
          if(bb.phase==='after') break;
        }
      } else { bb.phase='after'; }
      const ev=bb.todayEvent();
      const res=Object.assign({tag:bb.dateShort(S.day),ruhe},vorher,{ev:ev?ev.id:'-',umsatz:Math.round(bb.DS.revenue),kunden:bb.DS.customers,
        verpasst:bb.DS.missed,genervt:bb.DS.angry,regale:bb.shelves.length});
      bb.endDay();
      return res;
    });
    await p.evaluate(()=>{ const b2=document.getElementById('sBtn'); if(b2) b2.click(); });
    await p.evaluate(()=>{ const b2=document.getElementById('sBtn'); if(b2&&document.getElementById('summary').classList.contains('show')) b2.click();
      const lb=document.getElementById('luBtn'); for(let i=0;i<6;i++) if(document.getElementById('levelup').classList.contains('show')) lb.click(); });
    const after=await p.evaluate(()=>({money:Math.round(window.__bb.S.money),lvl:window.__bb.S.level,xp:window.__bb.S.xp,
      lic:window.__bb.S.lic.length,offenP:window.__bb.S.offen|0,sorten:Object.keys(window.__bb.P).filter(t=>window.__bb.hatLizenz(window.__bb.lizenzOf(t))).length,
      infl:Math.round((window.__bb.inflOf()-1)*100),mkt:+window.__bb.marktSchnitt().toFixed(2),
      fix:window.__bb.fixedCosts(),loehne:window.__bb.dailyWages()}));
    log.push(Object.assign(d,after));
  }
  console.log('Tag Datum    Ereignis       Regal Umsatz  Kd Verp  Konto Lvl Liz Sort Infl  Fix Lohn Pak');
  log.forEach((r,i)=>console.log(
    String(i+1).padStart(3)+' '+r.tag.padEnd(9)+(r.ruhe?'RUHETAG':r.ev).padEnd(15)+
    String(r.regal).padStart(5)+
    String(r.umsatz).padStart(7)+String(r.kunden).padStart(4)+String(r.verpasst).padStart(5)+String(r.money).padStart(7)+
    String(r.lvl).padStart(4)+String(r.lic).padStart(4)+String(r.sorten).padStart(5)+String(r.infl+'%').padStart(5)+
    String(r.fix).padStart(5)+String(Math.round(r.loehne)).padStart(5)+String(r.offenP).padStart(4)));
  const gekauft=await p.evaluate(()=>{
    const bb=window.__bb;
    return {up:bb.UPGRADES.filter(u=>u.done()).map(u=>u.id),
            lic:bb.S.lic.slice(),
            regale:bb.shelves.length,racks:bb.racks.length,
            arten:bb.shelves.reduce((a,s2)=>{a[s2.kind]=(a[s2.kind]||0)+1;return a;},{}),
            rArten:bb.racks.reduce((a,r)=>{a[r.kind]=(a[r.kind]||0)+1;return a;},{}),
            personal:Object.keys(bb.S.staff).filter(k=>bb.S.staff[k])};
  });
  console.log('GEKAUFT',JSON.stringify(gekauft));
  console.log('ERRORS:',errs.length?errs.slice(0,4):'keine');
  await b.close();
})();
