/* Balance-Simulation (Ist-Analyse, 10.10.2026)
   Ein Bot spielt den Laden ueber viele Spieltage, Zeitraffer ueber die
   Test-Hooks (window.__bb, step, endDay). Baut auf src/tests/bal.js auf.

   Aufruf (test.html = three-Stub, siehe UEBERGABE.md Abschnitt 9):
     flock /tmp/bb-testlock-balance nice -n 10 timeout 660 \
       node -r ./ladezeit-preload.js tools/balance/sim.js <test.html> <tage> <gut|mittel|mutig|teuer|schlecht> <out.jsonl> [--weiter]
   - schreibt je Spieltag eine JSON-Zeile nach out.jsonl
   - --weiter: setzt den Spielstand fort (persistentes Profil je Strategie
     unter /tmp/bb-sim-<strategie>), damit ein Lauf unter 10 Min bleibt
   - Zeitlimit: SIM_MAXSEK (Standard 540 s) - danach sauber aufhoeren
   Auswertung: tools/balance/auswertung.js

   Fundament Etappe 4 (13.10.2026): ins Repo uebernommen als Regressionstest der
   Wirtschaft. Neu: GESEEDET (SIM_SEED, Standard 1) - Math.random ist ab dem
   Seitenstart ein fester Zufallsgenerator; vor dem Klick auf Start wird die
   Echtzeitschleife angehalten (stoppSchleife), Zufall und Uhr (performance.now,
   Date.now laufen virtuell) neu gesetzt; Timer-Rueckrufe (Musik, Toasts) haben
   einen eigenen Zufallsstrom. Danach treibt nur der Bot das Spiel (step/run). Zwei Laeufe desselben Stands sind dann
   gleich, und tools/balance/vergleich.js zeigt jede Abweichung.
   Die Online-Pauschale kommt aus der Wirtschaftszentrale (WF.onlinePauschale).
   SIM_PROFIL: Ordner fuer das Browser-Profil (Standard /tmp/bb-sim-<strategie>).
   Regressionslauf (eigene Sperre, nice):
     flock /tmp/bb-testlock-wirtschaft nice -n 10 timeout 900 node -r ./ladezeit-preload.js \
       tools/balance/sim.js <test.html> 20 gut /pfad/gut.jsonl */
/* Strategie "mittel" (17.10.2026, Tom: "ein durchschnittlicher Spielverlauf - nicht zu gut, nicht zu schlecht"):
   wie "gut", aber
   - Preise 10 % ueber Markt; Ware je Sorte ~3 Verkaufstage, Saisonspitzen (heute/morgen) eingeplant, Kartons je
     Bestellung nach Sortimentsbreite (max(14, 0,8 x Sorten) x Saison) und aus dem Dispo (verfuegbar) bezahlt -
     ein Spieler laesst die Regale nicht leerlaufen, nur weil das Konto knapp ist
   - Ausbau-Polster 1,15x (Flaeche ab 1,15x Preis + 250 + 2 Tage Kosten, sonst 1,6x; Nebensaison 1,6/2,24x),
     gleiche Reihenfolge wie "gut", von der Werkbank nur die kleinste Stufe
   - Regale ab 1,3x Preis, Lizenzen ab 1,15x Preis, wenn freie Faecher fuer 75 % der neuen Sorten da sind
   - hoechstens EIN Kredit im ganzen Lauf (nur fuer Flaechen, Tagesrate <= 40 % des gewohnten Tagesgewinns; auch
     der Notkredit zaehlt), vorzeitige Tilgung wie "gut"
   - Personal nach Bedarf (Kunden-Schnitt kEMA): Reinigung ab 50 Kunden/Tag, Einraeumer ab 15 Sorten, zweiter ab
     40 Sorten und 16 Regalen, Kassierer ab 70 Kunden, SB-Betreuer ab 110, Security ab 160, Packer sobald die
     Packstation steht (2./3. bei >= 6/10 offenen Bestellungen); Kurzarbeit in der Flaute wie "gut",
     Entlassen erst, wenn das Konto unter 2 Tage laufende Kosten faellt ("gut": 4)
   - Testfeld: abends 1 Produkt (17:30), an normalen bis starken Tagen (Saisonfaktor >= 1) 2 (17:00 und 18:30) -
     ein Stueck aus dem Regal nehmen, auf die passende Station stellen (placeOnStation), am Pult zuenden
     (zuendeKanal -> 14z4 abZuenden -> igniteType: Hype, XP, Bruchbild gesehen). Gewaehlt: meister Hype bis
     ~1 % des Kontos (8-60 EUR), Abwechslung (letzte 4 nicht sofort wieder); solange kein Bruchbild gesehen
     ist, lieber etwas, das oben aufgeht (die Werkbank braucht ein gesehenes Bruchbild)
   - Werkbank: sobald gekauft, kleinste Stufe, Standard-Entwurf der Werkbank (wbEntwurfNeu: 3 Abschnitte,
     40/40/20 %, Finale) = "mittlerer Entwurf", Name "Hausmarke Feuerkranz", Mindestserie, Preis Markt +10 %;
     Nachbestellung der Mindestserie, wenn weniger als 2 Kartons da und nichts unterwegs ist
   Zusaetzliche Felder je Tag: xp0, kp (Kaeufe mit Preis), neu (Freischaltungen des Tages), kapName, hypeMax,
   hypeSchnitt, zuend, zFehler, offenPakete, wbGrund. Auswertung: auswert-mittel.js (mittel.json).
   SIM_ZUENDEN=0: Vergleichslauf ohne Testfeld-Zuendungen (Wirkung des Hypes). */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const [,,HTML,TAGE='30',STRAT='gut',OUT='/tmp/sim.jsonl',WEITER]=process.argv;
const MAXSEK=+(process.env.SIM_MAXSEK||540), SEED=+(process.env.SIM_SEED||1);
const T0=Date.now();

(async()=>{
  const dir=process.env.SIM_PROFIL||('/tmp/bb-sim-'+STRAT);
  if(!WEITER){ fs.rmSync(dir,{recursive:true,force:true}); fs.writeFileSync(OUT,''); }
  const ctx=await chromium.launchPersistentContext(dir,{args:['--no-sandbox']});
  const p=ctx.pages()[0]||await ctx.newPage();
  /* fester Zufall ab dem ersten Skript der Seite (mulberry32) */
  /* Timer- und Bild-Rueckrufe (Musik alle 40 ms, Toasts ...) feuern in Echtzeit: sie bekommen einen
     eigenen Zufallsstrom, damit sie den Zufall der Spiellogik nicht verschieben */
  await p.addInitScript(s=>{ const mk=st=>{ let a=st>>>0; const f=()=>{ a|=0; a=(a+0x6D2B79F5)|0; let t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; f.seed=n=>{ a=n>>>0; }; return f; };
    const haupt=mk(s), neben=mk(s^0x5bd1e995);
    Math.random=haupt; window.__simSeed=n=>{ haupt.seed(n); virt=0; };
    /* Uhr: nach dem Start (simSeed) laeuft performance.now/Date.now virtuell - je Abfrage 0,25 ms weiter.
       Sonst haengt z. B. der Schnee (20-loop) und damit die Zahl der Zufallsaufrufe an der echten Zeit. */
    const pn=performance.now.bind(performance), dn=Date.now; let virt=null, inRueckruf=0;
    performance.now=()=>(virt===null||inRueckruf)?pn():(virt+=0.25); Date.now=()=>(virt===null||inRueckruf)?dn():1760000000000+Math.round(virt);
    const huelle=fn=>typeof fn!=='function'?fn:function(){ const alt=Math.random; Math.random=neben; inRueckruf++; try{ return fn.apply(this,arguments); } finally{ Math.random=alt; inRueckruf--; } };
    const sT=window.setTimeout, sI=window.setInterval, rAF=window.requestAnimationFrame;
    window.setTimeout=(fn,ms,...a)=>sT(huelle(fn),ms,...a); window.setInterval=(fn,ms,...a)=>sI(huelle(fn),ms,...a);
    window.requestAnimationFrame=fn=>rAF(huelle(fn)); },SEED);
  const errs=[]; p.on('pageerror',e=>errs.push(e.message+' | '+(e.stack||'').split('\n')[1])); p.on('console',m=>{ if(m.type()==='error') errs.push('console: '+m.text().slice(0,200)); });
  await p.goto('file://'+HTML); await p.waitForFunction('window.__bb!==undefined');
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  /* ab hier laeuft nichts mehr in Echtzeit: Schleife aus (vor dem Start, sonst laeuft der Laden schon
     ein paar echte Frames), Zufall und Uhr neu, Schnee neu verteilt (seine Lage hing an den Frames
     des Startbildschirms) - danach treibt nur der Bot das Spiel */
  await p.evaluate(s=>{ const bb=window.__bb; bb.stoppSchleife(); window.__simSeed(s);
    const sp=bb.snowPts; if(sp){ const a=sp.geometry.attributes.position.array; for(let i=0;i<a.length;i+=3){ a[i]=-34+68*Math.random(); a[i+1]=15*Math.random(); a[i+2]=-34+68*Math.random(); } } },SEED);
  if(WEITER){ await p.click('#startBtns button:first-child'); }
  else { await p.click('#startBtns button:last-child');
    await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
    await p.click('#nameGo'); }
  try{ await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:30000}); }catch(e){ console.log('START HAENGT',errs); throw e; }
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
    await p.evaluate(st=>{ window.__sim.ema=st.ema||{}; window.__sim.gEMA=st.gEMA; window.__sim.kEMA=st.kEMA; window.__sim.kredite=st.kredite||0; window.__sim.block=st.block; window.__sim.zLetzte=st.zLetzte||[]; },st); }
  const DAYS=+TAGE;
  for(let day=0;day<DAYS;day++){
    if((Date.now()-T0)/1000>MAXSEK){ console.log('ZEITLIMIT nach',day,'Tagen'); break; }
    /* ---------- Morgen: Entscheidungen des Bots ---------- */
    const m=await p.evaluate((STRAT)=>{ with(window.__bb){
      const bb=window.__bb, mut=STRAT==='mutig', mit=STRAT==='mittel', gut=STRAT==='gut'||mut||STRAT==='teuer'||mit;
      const kp=[];   // Kaeufe mit Preis (mittel)
      const sim=window.__sim; sim.kredite=sim.kredite||0;
      /* teuer = wie gut, aber Preise 30 % ueber Markt (ein einzelner Fehler) */
      /* mutig = vernuenftig, aber mit kleinem Polster: kauft Flaechen fast
         ab Kaufpreis, Lizenzen mit halb belegten Faechern, stellt Personal
         frueher ein, Preise 15 % ueber Markt */
      const kauf=[];   // was heute gekauft wurde
      const m0=S.money, lvl0=S.level;
      let invest=0, kredit=0;
      const flau=dayMult(S.day)<0.95;
      const puffer=mit?(flau?1.6:1.15):mut?(flau?1.3:1.0):(flau?2.1:1.35);
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
        const ok=mit?S.money>preis*1.3+90+laufend()&&(freieFaecher()<4||S.money>preis*5):gut?S.money>preis*1.7+90&&(freieFaecher()<4||S.money>preis*6):S.money>preis;
        if(regalOffen(id)&&regalPlatz(id)&&ok&&!(window.__sim.block&&window.__sim.block[id]===Object.keys(S.up).length)&&shelves.length+racks.length+unterwegs()<slotsOffen().length+RACKS.length){
          const v=S.money; orderRegal(id); if(S.money<v){ invest+=v-S.money; kauf.push('Regal:'+id); kp.push({was:'Regal:'+id,preis:Math.round(v-S.money)}); } }
      }
      /* Ausbau: Reihenfolge eines vernuenftigen Spielers */
      const REIHE=['shop_halb','lager','plakat','grosskunden','terminal','lager_nord','testfeld','shop_gross','sackkarre','tag4','heizung','musik','gravur','radio','wagen','cams','regallicht','lager_gross','onlineshop','kasse2','alarm','labor','lager_sued','shop_ost','kundenkarte','tafel','lager_sued2','packstation','eingang2','shop_sued','lizenz','packstation2','klima','labor2','labor3','packstation3','meister','labor4','labor5'];
      for(const id of (mit?REIHE.filter(x=>!/^labor[2-5]$/.test(x)):REIHE)){
        const u=UPGRADES.find(x=>x.id===id);
        if(!u||S.level<u.lvl||u.done()||(u.req&&!S.up[u.req])) continue;
        if(S.einbauBestellt&&S.einbauBestellt[id]) continue;
        const c=u.cost();
        let ok;
        if(gut){
          ok=mit?eigen()>c*(u.kat==='flaeche'?1.0:1.4)*puffer+250+laufend()*2:mut?eigen()>c*(u.kat==='flaeche'?1.05:1.5)*puffer+150+laufend()*2:eigen()>c*(u.kat==='flaeche'?1.25:2.2)*puffer+400+laufend()*3;
          /* Kredit fuer Flaechen: wenn der Rahmen die Luecke deutlich deckt
             und die Saison laeuft */
          if(!ok&&u.kat==='flaeche'&&!S.loan&&!flau&&loanTier()&&!(mit&&sim.kredite>=1)){
            /* nur so viel wie noetig, und nur wenn die Tagesrate hoechstens
               die Haelfte des gewohnten Tagesgewinns frisst */
            const T=loanTier(), bedarf=Math.min(T.amount,Math.ceil((c+laufend()*5+400-S.money)/100)*100);
            const rateTag=bedarf/T.term+bedarf*T.rate, g=window.__sim.gEMA||0;
            if(bedarf>0&&S.money+bedarf>=c+laufend()*5+400&&rateTag<(mut?0.8:mit?0.4:0.5)*g){ takeLoan(bedarf); kredit+=bedarf; kauf.push('Kredit:'+bedarf); sim.kredite++; kp.push({was:'Kredit',preis:bedarf,rateTag:Math.round(rateTag),laufzeit:T.term,zins:T.rate}); ok=S.money>c+laufend()*3; }
          }
        } else {
          /* schlecht: sofort kaufen, notfalls auf Kredit */
          ok=S.money>=c;
          if(!ok&&!S.loan&&loanTier()&&S.money+loanTier().amount>=c){ takeLoan(loanTier().amount); kredit+=loanTier().amount; ok=S.money>=c; }
        }
        if(ok){ const v=S.money; testKauf(id); if(S.money<v){ invest+=v-S.money; kauf.push(id); kp.push({was:id,preis:Math.round(v-S.money)}); } }
      }
      /* Lizenzen */
      for(const l of LIZENZEN){
        if(hatLizenz(l.id)||S.level<l.lvl) continue;
        const neu=l.items.filter(t=>P[t]&&!P[t].noShelf).length;
        const ok=mit?eigen()>l.cost*1.15+300+laufend()*2&&freieFaecher()>=Math.ceil(neu*0.75):mut?eigen()>l.cost*1.1+200+laufend()*2&&freieFaecher()>=neu*0.5:gut?eigen()>l.cost*puffer+400+laufend()*3&&freieFaecher()>=neu:S.money>=l.cost;
        if(ok){ const v=S.money; buyLizenz(l.id); if(S.money<v){ invest+=v-S.money; kauf.push('Liz:'+l.id); kp.push({was:'Liz:'+l.id,preis:Math.round(v-S.money)}); } }
      }
      /* Personal */
      for(const s of STAFF){
        if(S.staff[s.id]||S.level<s.lvl) continue;
        if(s.req&&!S.up[s.req]) continue;
        if(s.id==='packer'&&!packBereit()) continue;
        if(gut&&s.id==='kassierer3') continue;
        if(mit){ const kE=sim.kEMA||0, nS=Object.keys(P).filter(t=>hatLizenz(lizenzOf(t))).length;
          const bedarf={reinigung:kE>=50,auffueller:nS>=15,auffueller2:nS>=40&&shelves.length+racks.length>=16,kassierer:kE>=70,
            kassierer2:kE>=110,security:kE>=160,packer:true,packer2:(sim.offenPakete||0)>=6,packer3:(sim.offenPakete||0)>=10}[s.id];
          if(!bedarf) continue; }
        const ok=mit?eigen()>s.hire*3+s.wage*10+laufend()*5:mut?eigen()>s.hire*4*puffer+laufend()*6:gut?eigen()>s.hire*12*puffer+laufend()*10:S.money>s.hire;
        if(ok){ S.money=Math.round((S.money-s.hire)*100)/100; invest+=s.hire; S.staff[s.id]=true; hireStaff(s.id); kauf.push('Team:'+s.id); kp.push({was:'Team:'+s.id,preis:s.hire,lohn:s.wage}); }
      }
      /* Not-Kredit, bevor das Regal leerlaeuft */
      if(!S.loan&&loanTier()&&!(mit&&sim.kredite>=1)&&(gut?S.money<0&&verfuegbar()<250:S.money<fixedCosts()*3)){ const L=loanTier().amount; takeLoan(L); kredit+=L; kauf.push('Notkredit'); sim.kredite++; kp.push({was:'Notkredit',preis:L}); }
      /* Ebbe: Personal abbauen (nur der gute Spieler) */
      if(gut){ const polster=()=>laufend()*(mit?2:4);
        for(const id of ['security','packer3','packer2','kassierer2','packer','kassierer','auffueller2','reinigung','auffueller']){
          if(S.money>=polster()) break;
          if(S.staff[id]){ fireStaff(id); S.staff[id]=false; kauf.push('Entlassen:'+id); } } }
      /* Kredit vorzeitig tilgen, wenn genug da ist */
      if(gut&&S.loan&&S.money>S.loan.remaining*2+laufend()*8){ window.__sim.tilg=S.loan.remaining; S.money=Math.round((S.money-S.loan.remaining)*100)/100; S.loan=null; kauf.push('Tilgung'); }
      if(mit&&S.up.labor){ try{
        const L=eigeneListe(), mind=WIRT.werkbank.stufen[0].mindest;
        if(!L.length&&wbStufeOffen(0)){
          const e=wbEntwurfNeu(0); e.name='Hausmarke Feuerkranz';
          const grund=wbMangel(e);
          if(grund) sim.wbGrund=grund;
          else { const cost=wbStueckkosten(e), entw=wbEntwicklung(e), serie=mind*wbBox(0)*cost, summe=entw+serie, markt=wbMarkt(e);
            if(eigen()>summe*1.15+laufend()*3+200){ const v=S.money; const r=wbEntwickeln(e,mind,Math.round(markt*1.10*100)/100);
              if(r&&r.ok){ invest+=v-S.money; kauf.push('Werkbank-Batterie'); kp.push({was:'Werkbank-Batterie',preis:Math.round(v-S.money),entwicklung:entw,serie:Math.round(serie),sterne:r.e.sterne,stueckkosten:r.e.cost,markt:r.e.market,hype:r.e.hype}); sim.wbGrund=null; }
              else sim.wbGrund=r&&r.grund; } else sim.wbGrund='Geld: '+Math.round(summe); } }
        else if(L.length){ const e=L[0]; S.prices[e.id]=Math.round(e.market*1.10*100)/100;
          const bestand=allLevels().filter(l=>l.type===e.id).reduce((a,l)=>a+l.count,0)+floorBoxes.filter(f=>f.type===e.id).reduce((a,f)=>a+f.count,0)+pending.filter(q=>q.type===e.id).length*wbBox(0);
          const preis=mind*wbBox(0)*e.cost;
          if(bestand<wbBox(0)*2&&!wbUnterwegs(e)&&eigen()>preis*1.3+laufend()*3){ const v=S.money; const r=wbNachbestellen(e.id,mind);
            if(r&&r.ok){ invest+=v-S.money; kauf.push('WB-Serie'); kp.push({was:'WB-Serie',preis:Math.round(v-S.money)}); } } }
      }catch(err){ sim.wbGrund='Fehler: '+err.message; } }
      /* Versand-Einstellung */
      if(S.up.onlineshop){ const c=vsCfg(); if(gut){ c.kosten=4.9; c.frei=50; c.nie=false; } else { c.kosten=0; c.frei=0; c.nie=false; } }
      return {m0,lvl0,xp0:Math.round(S.xp),invest:Math.round(invest),kredit,kauf,kp,wbGrund:mit?(sim.wbGrund||null):undefined};
    }},STRAT);

    /* ---------- Lieferung, Einraeumen, Verkaufstag ---------- */
    const d=await p.evaluate(([STRAT,ZU])=>{ with(window.__bb){
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
      const gutW=STRAT==='gut'||STRAT==='mutig'||STRAT==='teuer'||STRAT==='mittel';
      /* Ziel je Sorte: ein volles Fach oder gut zwei Verkaufstage */
      /* mutig plant die Saison ein: Nachfrage-Faktor von heute und morgen */
      const saison=(STRAT==='mutig'||STRAT==='mittel')?Math.max(1,Math.max(dayMult(S.day),dayMult(S.day+1))/0.95):1;
      const ziel=t=>gutW?Math.max(P[t].box,3*saison*(window.__sim.ema[t]||0)):Math.max(shelfCapOf(t),2.5*(window.__sim.ema[t]||0));
      /* mittel: ein normaler Spieler fuellt die Regale auch aus dem Dispo nach (verfuegbar = Konto + Rahmen), statt sie leerlaufen zu lassen */
      const budget=STRAT==='mittel'?verfuegbar()-(fixedCosts()+dailyWages()):gutW?S.money-(fixedCosts()+dailyWages())*2:verfuegbar()-90;
      /* mittel: Kartons je Bestellung nach Sortimentsbreite (14 reichten ab ~30 Sorten nicht - Regale liefen leer) */
      const kartonDeckel=STRAT==='mittel'?Math.round(Math.max(14,types.length*0.8)*saison):STRAT==='mutig'?Math.round(14*saison):14;
      while(tries<(STRAT==='mutig'||STRAT==='mittel'?160:60)&&pending.length+cartBoxes()<kartonDeckel){
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
      const auf=STRAT==='mittel'?1.10:STRAT==='gut'?1.08:STRAT==='mutig'?1.15:STRAT==='teuer'?1.30:1.35;
      types.forEach(t=>{ S.prices[t]=Math.round(marketOf(t)*auf*100)/100; });
      for(let r=0;r<10;r++){ bb.run(25,0.05); stow(); }
      S.carrying=null; updateCarry();
      const ruhe=ruhetag();
      let schritte=0, schliessen=0, ddl=false;
      /* mittel: am Abend 1-2 Produkte auf dem Testfeld zuenden wie ein Spieler - Ware aus dem Regal nehmen,
         auf die passende Station stellen (placeOnStation), am Pult den Kanal zuenden (zuendeKanal -> 14z4 abZuenden
         -> igniteType: Hype, XP). Gewaehlt wird das Stueck mit dem meisten Hype, das hoechstens ~1 % des Kontos kostet. */
      const zuend=[], zFehler=[]; let hMax=0,hSum=0,hN=0;
      const zuende=()=>{ try{
        const cap=Math.max(8,Math.min(60,S.money*0.01));
        /* Abwechslung wie ein Spieler: was in den letzten 4 Zuendungen schon dran war, kommt nicht gleich wieder;
           solange noch kein Bruchbild gesehen ist (Werkbank braucht eines), lieber etwas, das oben aufgeht */
        const zl=window.__sim.zLetzte=window.__sim.zLetzte||[];
        const steigt=t=>/^(rocketset|shell|battery|fan|tubepack)$/.test(P[t].shape||'');
        const brauchtBruch=!BRUCH_IDS.some(e=>(S.gesehen||[]).indexOf(e)>=0);
        const wert=lv=>P[lv.type].hype*(zl.indexOf(lv.type)>=0?0.2:1)*(brauchtBruch&&steigt(lv.type)?3:1);
        let best=null;
        for(const lv of allLevels()){ if(!lv.count||!lv.type) continue; const t=lv.type, p=P[t];
          if(!p||!p.cat||!(p.hype>0)||!stationOf(t)||costOf(t)>cap) continue;
          if(!best||wert(lv)>wert(best)||(wert(lv)===wert(best)&&costOf(t)<costOf(best.type))) best=lv; }
        if(best){ zl.push(best.type); if(zl.length>4) zl.shift(); }
        if(!best){ zFehler.push('nichts passendes'); return; }
        const t=best.type, q=best.q||1, st=stations[stationOf(t)]; if(!st){ zFehler.push('keine Station '+stationOf(t)); return; }
        const n0=st.items.length; removeFromLevel(best);
        S.carrying={type:t,count:2,q}; placeOnStation(st); S.carrying=null; updateCarry();
        if(st.items.length<=n0){ const lv=emptyLevel(t); if(lv) addToLevel(lv,t,q); zFehler.push('Station voll'); return; }
        const it=st.items[st.items.length-1]; const ok=zuendeKanal(it.kanal); zuend.push(t+(ok?'':'(x)'));
      }catch(err){ zFehler.push(err.message); } };
      const zZeiten=STRAT==='mittel'&&ZU&&S.up.testfeld?(dayMult(S.day)>=1.0?[1020,1110]:[1050]):[]; let zI=0;
      if(!ruhe){
        openShop();
        for(let i=0;i<9000;i++){ step(0.05); schritte++; if(i%50===0) window.__sim.patch();
          if(phase==='closing') schliessen++;
          if(zI<zZeiten.length&&clock>=zZeiten[zI]){ zI++; zuende(); }
          if(i%20===0){ hMax=Math.max(hMax,hype); hSum+=hype; hN++; }
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
      /* Online-Pauschale aus der Zentrale; die Formel daneben nur fuer Vergleichslaeufe mit Staenden vor der Zentrale (vor 13.10.2026) */
      const online=S.up.onlineshop?(window.__wirt?window.__wirt.WF.onlinePauschale(S.rep,S.level):Math.round(40+S.rep*1.6+S.level*4)):0;
      const res={tag:dateShort(S.day),dayNr:S.day,ruhe,ev:ev?ev.id:'-',mult:+dayMult(S.day).toFixed(2),
        umsatz:Math.round(DS.revenue),kunden:DS.customers,verpasst:DS.missed,genervt:DS.angry,
        ware:Math.round(DS.goods),versand:Math.round(DS.versand||0),porto:Math.round(DS.porto||0),ddlK:Math.round(DS.ddl||0),
        onlinePausch:online,auftraege:DS.orders||0,
        lohn:Math.round(dailyWages()),fix:fixedCosts(),rate:S.loan?Math.round(loanDaily()):0,
        rev:Object.fromEntries(Object.entries(window.__sim.rev).map(([k,v])=>[k,Math.round(v)])),
        schritte,schliessen,rep:Math.round(S.rep),hypeMax:Math.round(hMax),hypeSchnitt:+(hN?hSum/hN:0).toFixed(1),zuend,zFehler:zFehler.length?zFehler:undefined,offenPakete:S.offen|0,offen:S.offen|0,dbgK,floor:floorBoxes.length,imRegal:allLevels().reduce((a,l)=>a+l.count,0)};
      if(!ruhe){ const E=window.__sim.ema; for(const t of Object.keys(P)){ const v=window.__sim.vk[t]||0; E[t]=E[t]==null?v:E[t]*0.6+v*0.4; } }
      endDay();
      return res;
    }},[STRAT,process.env.SIM_ZUENDEN!=='0']);
    await p.evaluate(()=>{ const b2=document.getElementById('sBtn'); if(b2) b2.click(); });
    await p.evaluate(()=>{ const b2=document.getElementById('sBtn'); if(b2&&document.getElementById('summary').classList.contains('show')) b2.click();
      const lb=document.getElementById('luBtn'); for(let i=0;i<10;i++) if(document.getElementById('levelup').classList.contains('show')) lb.click(); });
    /* ---------- Abend: Kennzahlen ---------- */
    const a=await p.evaluate((lvl0)=>{ with(window.__bb){
      const naechste=[];
      for(const u of UPGRADES){ if(u.done()||u.id==='kisten') continue;
        naechste.push({id:u.id,kat:u.kat,lvl:u.lvl,cost:u.cost(),req:!!(u.req&&!S.up[u.req])}); }
      for(const l of LIZENZEN) if(!hatLizenz(l.id)) naechste.push({id:'Liz:'+l.id,kat:'liz',lvl:l.lvl,cost:l.cost,req:false});
      return {money:Math.round(S.money),lvl:S.level,xp:Math.round(S.xp),xpNext:xpFor(S.level),kap:kapitelNr(),
        loan:S.loan?Math.round(S.loan.remaining):0,lic:S.lic.slice(),up:Object.keys(S.up).filter(k=>S.up[k]),
        staff:Object.keys(S.staff).filter(k=>S.staff[k]),regale:shelves.length,racks:racks.length,
        sorten:Object.keys(P).filter(t=>hatLizenz(lizenzOf(t))).length,naechste,
        kapName:(KAPITEL.find(k=>k.nr===kapitelNr())||{}).name||'',
        neu:S.level>lvl0?[].concat(UPGRADES.filter(u=>u.lvl>lvl0&&u.lvl<=S.level&&u.id!=='kisten').map(u=>u.id+'|'+u.cost()),
          LIZENZEN.filter(l=>l.lvl>lvl0&&l.lvl<=S.level).map(l=>'Liz:'+l.id+'|'+l.cost),
          STAFF.filter(s=>s.lvl>lvl0&&s.lvl<=S.level).map(s=>'Team:'+s.id+'|'+s.hire)):[]};
    }},m.lvl0);
    /* Betriebsgewinn des Tages: Kontoveraenderung ohne Investitionen,
       Kreditaufnahme und Sondertilgung (Ware zaehlt als Kosten) */
    const tilg=await p.evaluate(()=>{ const t=window.__sim.tilg||0; window.__sim.tilg=0; return t; });
    const gewinn=Math.round(a.money-m.m0+m.invest-m.kredit+tilg);
    await p.evaluate(([g,ruhe,k,op])=>{ if(ruhe) return; const s=window.__sim; s.gEMA=s.gEMA==null?g:s.gEMA*0.7+g*0.3; s.kEMA=s.kEMA==null?k:s.kEMA*0.6+k*0.4; s.offenPakete=op||0; },[gewinn,d.ruhe,d.kunden,d.offenPakete]);
    const row=Object.assign({strat:STRAT,gewinn,tilg:Math.round(tilg)},d,m,a);
    fs.appendFileSync(OUT,JSON.stringify(row)+'\n');
    console.log([String(row.dayNr).padStart(3),row.tag.padEnd(9),(row.ruhe?'RUHE':row.ev).padEnd(10),
      'U',String(row.umsatz).padStart(6),'K',String(row.money).padStart(7),'L',row.lvl,'Kap',row.kap,
      row.kauf.join(','),row.zuend&&row.zuend.length?'Z:'+row.hypeMax:''].join(' '));
  }
  await p.evaluate(()=>window.__bb.save());
  /* Katalog fuer die Auswertung: Preise und Level aus dem Spiel selbst */
  fs.writeFileSync(OUT+'.katalog.json',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb;
    return {up:bb.UPGRADES.map(u=>({id:u.id,name:u.name,kat:u.kat,lvl:u.lvl,req:u.req||null,kap:u.kap||null,cost:u.cost()})),
      liz:bb.LIZENZEN.map(l=>({id:l.id,name:l.name,lvl:l.lvl,cost:l.cost,n:l.items.length})),
      staff:bb.STAFF.map(s=>({id:s.id,name:s.name,lvl:s.lvl,req:s.req||null,hire:s.hire,wage:s.wage})),
      loans:bb.LOANS, xp:Array.from({length:40},(_,i)=>bb.xpFor(i+1)), kapitel:bb.KAPITEL.map(k=>({nr:k.nr,name:k.name,up:k.up})),
      ware:Object.keys(bb.P).map(t=>({id:t,liz:bb.lizenzOf(t),cat:bb.P[t].cat,cost:bb.P[t].cost,market:bb.P[t].market,box:bb.P[t].box,lvl:bb.P[t].lvl||0,w:bb.P[t].weight}))}; })));
  fs.writeFileSync(OUT+'.state',JSON.stringify(await p.evaluate(()=>({ema:window.__sim.ema,gEMA:window.__sim.gEMA,kEMA:window.__sim.kEMA,kredite:window.__sim.kredite||0,block:window.__sim.block,zLetzte:window.__sim.zLetzte||[]}))));
  console.log('ERRORS:',errs.length?errs.slice(0,4):'keine','sek',Math.round((Date.now()-T0)/1000));
  await ctx.close();
})();
