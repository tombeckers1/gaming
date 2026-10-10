/* Balance-Simulation (Ist-Analyse, 10.10.2026)
   Ein Bot spielt den Laden ueber viele Spieltage, Zeitraffer ueber die
   Test-Hooks (window.__bb, step, endDay). Baut auf src/tests/bal.js auf.

   Aufruf (test.html = three-Stub, siehe UEBERGABE.md Abschnitt 9):
     flock /tmp/bb-testlock-balance nice -n 10 timeout 660 \
       node -r ./ladezeit-preload.js tools/balance/sim.js <test.html> <tage> <gut|mutig|teuer|schlecht> <out.jsonl> [--weiter]
   - schreibt je Spieltag eine JSON-Zeile nach out.jsonl
   - --weiter: setzt den Spielstand fort (persistentes Profil je Strategie
     unter /tmp/bb-sim-<strategie>), damit ein Lauf unter 10 Min bleibt
   - Zeitlimit: SIM_MAXSEK (Standard 540 s) - danach sauber aufhoeren
   Auswertung: tools/balance/auswertung.js */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const [,,HTML,TAGE='30',STRAT='gut',OUT='/tmp/sim.jsonl',WEITER]=process.argv;
const MAXSEK=+(process.env.SIM_MAXSEK||540);
const T0=Date.now();

(async()=>{
  const dir='/tmp/bb-sim-'+STRAT;
  if(!WEITER){ fs.rmSync(dir,{recursive:true,force:true}); fs.writeFileSync(OUT,''); }
  const ctx=await chromium.launchPersistentContext(dir,{args:['--no-sandbox']});
  const p=ctx.pages()[0]||await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message+' | '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+HTML); await p.waitForFunction('window.__bb!==undefined');
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  if(WEITER){ await p.click('#startBtns button:first-child'); }
  else { await p.click('#startBtns button:last-child');
    await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
    await p.click('#nameGo'); }
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:30000});
  await p.waitForTimeout(300);

  /* Umsatz je Warengruppe mitschreiben (Kasse/SB): Customer ist nicht
     global, deshalb wird der Prototyp beim ersten Kunden gepatcht */
  await p.evaluate(()=>{ window.__sim={rev:{zub:0,f1:0,f2:0,eigen:0},vk:{},ema:{},patch:()=>{
    const bb=window.__bb; if(window.__sim.ok||!bb.customers.length) return;
    const C=Object.getPrototypeOf(bb.customers[0]), alt=C.complete; window.__sim.ok=true;
    C.complete=function(net,over){
      try{ for(const it of this.items){ const c=bb.P[it.type]?bb.P[it.type].cat:0;
        const k=bb.gruppeVon(it.type)==='eigene'?'eigen':c===2?'f2':c===1?'f1':'zub';
        window.__sim.rev[k]+=it.price||0; window.__sim.vk[it.type]=(window.__sim.vk[it.type]||0)+1; } }catch(e){}
      return alt.call(this,net,over);
    }; }}; });

  /* Bot-Gedaechtnis (Verkaufsschnitt, Gewinnschnitt) ueber --weiter retten */
  if(WEITER&&fs.existsSync(OUT+'.state')){ const st=JSON.parse(fs.readFileSync(OUT+'.state','utf8'));
    await p.evaluate(st=>{ window.__sim.ema=st.ema||{}; window.__sim.gEMA=st.gEMA; },st); }
  const DAYS=+TAGE;
  for(let day=0;day<DAYS;day++){
    if((Date.now()-T0)/1000>MAXSEK){ console.log('ZEITLIMIT nach',day,'Tagen'); break; }
    /* ---------- Morgen: Entscheidungen des Bots ---------- */
    const m=await p.evaluate((STRAT)=>{ with(window.__bb){
      const bb=window.__bb, mut=STRAT==='mutig', gut=STRAT==='gut'||mut||STRAT==='teuer';
      /* teuer = wie gut, aber Preise 30 % ueber Markt (ein einzelner Fehler) */
      /* mutig = vernuenftig, aber mit kleinem Polster: kauft Flaechen fast
         ab Kaufpreis, Lizenzen mit halb belegten Faechern, stellt Personal
         frueher ein, Preise 15 % ueber Markt */
      const kauf=[];   // was heute gekauft wurde
      const m0=S.money, lvl0=S.level;
      let invest=0, kredit=0;
      const flau=dayMult(S.day)<0.95;
      const puffer=mut?(flau?1.3:1.0):(flau?2.1:1.35);
      const laufend=()=>fixedCosts()+dailyWages();
      /* leere Regalfaecher: der gute Spieler holt nur so viele Sorten ins
         Sortiment, wie er auch ins Regal bekommt (sonst fragen Kunden nach
         Ware, die nirgends steht -> Ruf faellt) */
      const freieFaecher=()=>{ const L=allLevels(), belegt=new Set(L.filter(l=>l.count).map(l=>l.type));
        const ohne=Object.keys(P).filter(t=>hatLizenz(lizenzOf(t))&&!P[t].noShelf&&!P[t].noOrder&&!belegt.has(t)).length;
        return L.filter(l=>!l.count).length-ohne; };
      /* Eigenkapital: der gute Spieler rechnet den Kredit nicht als eigenes Geld */
      const eigen=()=>S.money-(S.loan?S.loan.remaining:0);
      /* Saisonpause: der gute Spieler schickt das Team in Kurzarbeit */
      if(gut) for(const st of STAFF){ if(S.staff[st.id]&&inPause(st.id)!==flau) setPause(st.id,flau); }
      /* Regale */
      const unterwegs=()=>pending.filter(q=>q.regal).length;
      for(const id of ['klein','standard','hoch','kuehl','gondel','eck','rack','rhoch','rschwer']){
        const preis=regalPreis(id);
        const ok=gut?S.money>preis*1.7+90&&(freieFaecher()<4||S.money>preis*6):S.money>preis;
        if(regalOffen(id)&&regalPlatz(id)&&ok&&!(window.__sim.block&&window.__sim.block[id]===Object.keys(S.up).length)&&shelves.length+racks.length+unterwegs()<slotsOffen().length+RACKS.length){
          const v=S.money; orderRegal(id); if(S.money<v){ invest+=v-S.money; kauf.push('Regal:'+id); } }
      }
      /* Ausbau: Reihenfolge eines vernuenftigen Spielers */
      const REIHE=['shop_halb','lager','plakat','grosskunden','terminal','lager_nord','testfeld','shop_gross','sackkarre','tag4','heizung','musik','gravur','radio','wagen','cams','regallicht','lager_gross','onlineshop','kasse2','alarm','labor','lager_sued','shop_ost','kundenkarte','tafel','lager_sued2','packstation','eingang2','shop_sued','lizenz','packstation2','klima','labor2','lager_west','rampe2','lager_west2','rampe3','packstation3','meister','rampe4','lager_west3','rampe5'];
      for(const id of REIHE){
        const u=UPGRADES.find(x=>x.id===id);
        if(!u||S.level<u.lvl||u.done()||(u.req&&!S.up[u.req])) continue;
        if(S.einbauBestellt&&S.einbauBestellt[id]) continue;
        const c=u.cost();
        let ok;
        if(gut){
          ok=mut?eigen()>c*(u.kat==='flaeche'?1.05:1.5)*puffer+150+laufend()*2:eigen()>c*(u.kat==='flaeche'?1.25:2.2)*puffer+400+laufend()*3;
          /* Kredit fuer Flaechen: wenn der Rahmen die Luecke deutlich deckt
             und die Saison laeuft */
          if(!ok&&u.kat==='flaeche'&&!S.loan&&!flau&&loanTier()){
            /* nur so viel wie noetig, und nur wenn die Tagesrate hoechstens
               die Haelfte des gewohnten Tagesgewinns frisst */
            const T=loanTier(), bedarf=Math.min(T.amount,Math.ceil((c+laufend()*5+400-S.money)/100)*100);
            const rateTag=bedarf/T.term+bedarf*T.rate, g=window.__sim.gEMA||0;
            if(bedarf>0&&S.money+bedarf>=c+laufend()*5+400&&rateTag<(mut?0.8:0.5)*g){ takeLoan(bedarf); kredit+=bedarf; kauf.push('Kredit:'+bedarf); ok=S.money>c+laufend()*3; }
          }
        } else {
          /* schlecht: sofort kaufen, notfalls auf Kredit */
          ok=S.money>=c;
          if(!ok&&!S.loan&&loanTier()&&S.money+loanTier().amount>=c){ takeLoan(loanTier().amount); kredit+=loanTier().amount; ok=S.money>=c; }
        }
        if(ok){ const v=S.money; testKauf(id); if(S.money<v){ invest+=v-S.money; kauf.push(id); } }
      }
      /* Lizenzen */
      for(const l of LIZENZEN){
        if(hatLizenz(l.id)||S.level<l.lvl) continue;
        const neu=l.items.filter(t=>P[t]&&!P[t].noShelf).length;
        const ok=mut?eigen()>l.cost*1.1+200+laufend()*2&&freieFaecher()>=neu*0.5:gut?eigen()>l.cost*puffer+400+laufend()*3&&freieFaecher()>=neu:S.money>=l.cost;
        if(ok){ const v=S.money; buyLizenz(l.id); if(S.money<v){ invest+=v-S.money; kauf.push('Liz:'+l.id); } }
      }
      /* Personal */
      for(const s of STAFF){
        if(S.staff[s.id]||S.level<s.lvl) continue;
        if(s.req&&!S.up[s.req]) continue;
        if(s.id==='packer'&&!packBereit()) continue;
        if(gut&&s.id==='kassierer3') continue;
        const ok=mut?eigen()>s.hire*4*puffer+laufend()*6:gut?eigen()>s.hire*12*puffer+laufend()*10:S.money>s.hire;
        if(ok){ S.money=Math.round((S.money-s.hire)*100)/100; invest+=s.hire; S.staff[s.id]=true; hireStaff(s.id); kauf.push('Team:'+s.id); }
      }
      /* Not-Kredit, bevor das Regal leerlaeuft */
      if(!S.loan&&loanTier()&&(gut?S.money<0&&verfuegbar()<250:S.money<fixedCosts()*3)){ const L=loanTier().amount; takeLoan(L); kredit+=L; kauf.push('Notkredit'); }
      /* Ebbe: Personal abbauen (nur der gute Spieler) */
      if(gut){ const polster=()=>laufend()*4;
        for(const id of ['security','packer3','packer2','kassierer2','packer','kassierer','auffueller2','reinigung','auffueller']){
          if(S.money>=polster()) break;
          if(S.staff[id]){ fireStaff(id); S.staff[id]=false; kauf.push('Entlassen:'+id); } } }
      /* Kredit vorzeitig tilgen, wenn genug da ist */
      if(gut&&S.loan&&S.money>S.loan.remaining*2+laufend()*8){ window.__sim.tilg=S.loan.remaining; S.money=Math.round((S.money-S.loan.remaining)*100)/100; S.loan=null; kauf.push('Tilgung'); }
      /* Versand-Einstellung */
      if(S.up.onlineshop){ const c=vsCfg(); if(gut){ c.kosten=4.9; c.frei=50; c.nie=false; } else { c.kosten=0; c.frei=0; c.nie=false; } }
      return {m0,lvl0,invest:Math.round(invest),kredit,kauf};
    }},STRAT);

    /* ---------- Lieferung, Einraeumen, Verkaufstag ---------- */
    const d=await p.evaluate((STRAT)=>{ with(window.__bb){
      const bb=window.__bb;
      window.__sim.rev={zub:0,f1:0,f2:0,eigen:0}; window.__sim.vk={};
      const stow=()=>{
        /* Regal-Pakete vor der Tuer / an der Rampe: aufheben und aufbauen
           (bal.js kannte nur den LKW-Weg und blieb im Kiosk ohne Regal) */
        for(const b of einbauPakete.slice()){ if(!b.regal) continue;
          S.carrying=null; paketAufheben(b);
          /* passt es nicht (Gang waere zu), merkt sich der Bot das bis zum
             naechsten Ausbau, statt jeden Tag ein neues zu bestellen */
          if(S.carrying&&S.carrying.regal&&regalAufbauen(S.carrying.regal)===false){
            (window.__sim.block=window.__sim.block||{})[S.carrying.regal]=Object.keys(S.up).length; window.__sim.verloren=(window.__sim.verloren||0)+1; }
          S.carrying=null; updateCarry(); }
        for(let k=0;k<40;k++){
          if(!truck||truck.state!=='docked'||!truck.cargo.length) break;
          S.carrying=null; takeFromTruck();
          if(S.carrying){ const c=S.carrying;
            if(c.regal){ if(regalAufbauen(c.regal)===false){ (window.__sim.block=window.__sim.block||{})[c.regal]=Object.keys(S.up).length; window.__sim.verloren=(window.__sim.verloren||0)+1; }
              S.carrying=null; updateCarry(); continue; }
            /* was nicht ins Regal passt, bleibt als Karton stehen
               (bal.js warf den Rest weg) */
            let n=c.count;
            while(n>0){ const lv=emptyLevel(c.type); if(!lv||!addToLevel(lv,c.type,c.q)) break; n--; }
            if(n>0) spawnFloorBox(c.type,n,{x:-12+Math.random()*3,z:-3+Math.random()*3},c.q);
            S.carrying=null; }
        }
        /* Kartons am Boden ins Regal; der Karton wird dabei leerer
           (bal.js zog die Stuecke nicht ab und vermehrte so die Ware) */
        for(const fb of floorBoxes.slice()){
          if(fb.kiste) continue;
          let n=fb.count;
          while(n>0){ const lv=emptyLevel(fb.type); if(!lv||!addToLevel(lv,fb.type,fb.q)) break; n--; }
          if(n<=0) removeFloorBox(fb); else fb.count=n;
        }
      };
      const telefon=()=>{
        if(phone&&phone.state==='ringing'){
          answerPhone();
          if(phone.call&&phone.call.rounds>0) haggle(0.1);
          if(phone.call) acceptDeal();
          const d2=document.getElementById('deal'); if(d2) d2.classList.remove('show');
        }
        if(order&&order.arrive<=0){ for(let k=0;k<12&&orderReady()>0;k++) shipOne(); }
      };
      /* erst die Regal-Pakete abwarten und aufbauen, dann Ware bestellen */
      for(let r=0;r<4;r++){ bb.run(25,0.05); stow(); }
      /* Ware: alles in den Warenkorb, eine Lieferung (wie bal.js) */
      const types=Object.keys(P).filter(t=>hatLizenz(lizenzOf(t))&&!P[t].noShelf&&!P[t].noOrder);
      let tries=0; cartClear();
      const imKorb=t=>cartLines().reduce((a,l)=>a+(l.t===t?l.n:0),0)*P[t].box;
      const gutW=STRAT==='gut'||STRAT==='mutig'||STRAT==='teuer';
      /* Ziel je Sorte: ein volles Fach oder gut zwei Verkaufstage */
      /* mutig plant die Saison ein: Nachfrage-Faktor von heute und morgen */
      const saison=STRAT==='mutig'?Math.max(1,Math.max(dayMult(S.day),dayMult(S.day+1))/0.95):1;
      const ziel=t=>gutW?Math.max(P[t].box,3*saison*(window.__sim.ema[t]||0)):Math.max(shelfCapOf(t),2.5*(window.__sim.ema[t]||0));
      const budget=gutW?S.money-(fixedCosts()+dailyWages())*2:verfuegbar()-90;
      while(tries<(STRAT==='mutig'?120:60)&&pending.length+cartBoxes()<(STRAT==='mutig'?Math.round(14*saison):14)){
        tries++; let best=null,bv=1e9;
        for(const t of types){ const cap=shelfCapOf(t); if(!cap) continue;
          const v=(stockOf(t)+imKorb(t))/ziel(t); if(v<bv&&v<1){ bv=v; best=t; } }
        if(!best) break;
        cartAdd(best,1,'mertens');
        if(cartTotal()>budget){ cartDel(cartLines().length-1); break; }
      }
      const dbgK={pend:pending.length,korb:cartBoxes(),stock:types.map(t=>stockOf(t)+'/'+shelfCapOf(t)).join(' ')};
      if(cartBoxes()) cartOrder(); else cartClear();
      dbgK.goods=DS.goods;
      /* Preise */
      const auf=STRAT==='gut'?1.08:STRAT==='mutig'?1.15:STRAT==='teuer'?1.30:1.35;
      types.forEach(t=>{ S.prices[t]=Math.round(marketOf(t)*auf*100)/100; });
      for(let r=0;r<10;r++){ bb.run(25,0.05); stow(); }
      S.carrying=null; updateCarry();
      const ruhe=ruhetag();
      let schritte=0, schliessen=0, ddl=false;
      if(!ruhe){
        openShop();
        for(let i=0;i<9000;i++){ step(0.05); schritte++; if(i%50===0) window.__sim.patch();
          if(phase==='closing') schliessen++;
          if(belt.length) scanBelt(belt[0]);
          const reg=regCustomer();
          if(reg&&reg.state==='pay'){ if(reg.method==='card') reg.finishCard(); else reg.finishCash(Math.round((reg.given-reg.total)*100)/100); }
          if(i%400===0){ stow(); telefon(); }
          if(i%60===0&&packBereit()) packOne(true);
          /* abends DDL rufen, wenn Pakete auf der Palette stehen */
          if(!ddl&&packBereit()&&clock>=1140&&vsGelandet()>0){ try{ ddl=ddlRufen(); }catch(e){} }
          if(phase==='after') break;
        }
      } else { phase='after'; }
      const ev=todayEvent();
      const online=S.up.onlineshop?Math.round(40+S.rep*1.6+S.level*4):0;
      const res={tag:dateShort(S.day),dayNr:S.day,ruhe,ev:ev?ev.id:'-',mult:+dayMult(S.day).toFixed(2),
        umsatz:Math.round(DS.revenue),kunden:DS.customers,verpasst:DS.missed,genervt:DS.angry,
        ware:Math.round(DS.goods),versand:Math.round(DS.versand||0),porto:Math.round(DS.porto||0),ddlK:Math.round(DS.ddl||0),
        onlinePausch:online,auftraege:DS.orders||0,
        lohn:Math.round(dailyWages()),fix:fixedCosts(),rate:S.loan?Math.round(loanDaily()):0,
        rev:Object.fromEntries(Object.entries(window.__sim.rev).map(([k,v])=>[k,Math.round(v)])),
        schritte,schliessen,rep:Math.round(S.rep),offen:S.offen|0,dbgK,floor:floorBoxes.length,imRegal:allLevels().reduce((a,l)=>a+l.count,0)};
      if(!ruhe){ const E=window.__sim.ema; for(const t of Object.keys(P)){ const v=window.__sim.vk[t]||0; E[t]=E[t]==null?v:E[t]*0.6+v*0.4; } }
      endDay();
      return res;
    }},STRAT);
    await p.evaluate(()=>{ const b2=document.getElementById('sBtn'); if(b2) b2.click(); });
    await p.evaluate(()=>{ const b2=document.getElementById('sBtn'); if(b2&&document.getElementById('summary').classList.contains('show')) b2.click();
      const lb=document.getElementById('luBtn'); for(let i=0;i<10;i++) if(document.getElementById('levelup').classList.contains('show')) lb.click(); });
    /* ---------- Abend: Kennzahlen ---------- */
    const a=await p.evaluate(()=>{ with(window.__bb){
      const naechste=[];
      for(const u of UPGRADES){ if(u.done()||u.id==='kisten') continue;
        naechste.push({id:u.id,kat:u.kat,lvl:u.lvl,cost:u.cost(),req:!!(u.req&&!S.up[u.req])}); }
      for(const l of LIZENZEN) if(!hatLizenz(l.id)) naechste.push({id:'Liz:'+l.id,kat:'liz',lvl:l.lvl,cost:l.cost,req:false});
      return {money:Math.round(S.money),lvl:S.level,xp:Math.round(S.xp),xpNext:xpFor(S.level),kap:kapitelNr(),
        loan:S.loan?Math.round(S.loan.remaining):0,lic:S.lic.slice(),up:Object.keys(S.up).filter(k=>S.up[k]),
        staff:Object.keys(S.staff).filter(k=>S.staff[k]),regale:shelves.length,racks:racks.length,
        sorten:Object.keys(P).filter(t=>hatLizenz(lizenzOf(t))).length,naechste};
    }});
    /* Betriebsgewinn des Tages: Kontoveraenderung ohne Investitionen,
       Kreditaufnahme und Sondertilgung (Ware zaehlt als Kosten) */
    const tilg=await p.evaluate(()=>{ const t=window.__sim.tilg||0; window.__sim.tilg=0; return t; });
    const gewinn=Math.round(a.money-m.m0+m.invest-m.kredit+tilg);
    await p.evaluate(([g,ruhe])=>{ if(ruhe) return; const s=window.__sim; s.gEMA=s.gEMA==null?g:s.gEMA*0.7+g*0.3; },[gewinn,d.ruhe]);
    const row=Object.assign({strat:STRAT,gewinn,tilg:Math.round(tilg)},d,m,a);
    fs.appendFileSync(OUT,JSON.stringify(row)+'\n');
    console.log([String(row.dayNr).padStart(3),row.tag.padEnd(9),(row.ruhe?'RUHE':row.ev).padEnd(10),
      'U',String(row.umsatz).padStart(6),'K',String(row.money).padStart(7),'L',row.lvl,'Kap',row.kap,
      row.kauf.join(',')].join(' '));
  }
  await p.evaluate(()=>window.__bb.save());
  /* Katalog fuer die Auswertung: Preise und Level aus dem Spiel selbst */
  fs.writeFileSync(OUT+'.katalog.json',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb;
    return {up:bb.UPGRADES.map(u=>({id:u.id,name:u.name,kat:u.kat,lvl:u.lvl,req:u.req||null,kap:u.kap||null,cost:u.cost()})),
      liz:bb.LIZENZEN.map(l=>({id:l.id,name:l.name,lvl:l.lvl,cost:l.cost,n:l.items.length})),
      staff:bb.STAFF.map(s=>({id:s.id,name:s.name,lvl:s.lvl,req:s.req||null,hire:s.hire,wage:s.wage})),
      loans:bb.LOANS, xp:Array.from({length:40},(_,i)=>bb.xpFor(i+1)), kapitel:bb.KAPITEL.map(k=>({nr:k.nr,name:k.name,up:k.up})),
      ware:Object.keys(bb.P).map(t=>({id:t,liz:bb.lizenzOf(t),cat:bb.P[t].cat,cost:bb.P[t].cost,market:bb.P[t].market,box:bb.P[t].box,lvl:bb.P[t].lvl||0,w:bb.P[t].weight}))}; })));
  fs.writeFileSync(OUT+'.state',JSON.stringify(await p.evaluate(()=>({ema:window.__sim.ema,gEMA:window.__sim.gEMA}))));
  console.log('ERRORS:',errs.length?errs.slice(0,4):'keine','sek',Math.round((Date.now()-T0)/1000));
  await ctx.close();
})();
