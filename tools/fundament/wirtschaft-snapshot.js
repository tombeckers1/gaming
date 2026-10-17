/* Wirtschafts-Snapshot (Fundament Etappe 4, 13.10.2026)
   Beweis "Umzug in die Wirtschaftszentrale aendert nichts": laedt das ganze
   Spiel in Node (spiel-node.js, ohne Browser, ohne Testsperre, <2 s) und
   schreibt ALLE Wirtschaftswerte als JSON - Kataloge (Preise, Loehne, Level),
   Konstanten (Porto, DDL, Dispo ...), Zeitreihen (Saison, XP-Kurve) und
   Formeln, die mit festen Spielstaenden und geseedetem Zufall aufgerufen
   werden (Fixkosten, Kundentakt, Kaufchance, Versand-Abbruch, Tagesabschluss
   mit Text, Markt ueber 40 Tage, Pakete, Restposten, Handbuch, Laptop ...).
   Gelesen wird nur ueber die alten Namen (P, UPGRADES, fixedCosts ...),
   damit derselbe Snapshot vor und nach dem Umzug vergleichbar ist.

   Aufruf (Repo-Wurzel):
     node tools/fundament/wirtschaft-snapshot.js            -> Vergleich mit Referenz, Exit 1 bei Abweichung
     node tools/fundament/wirtschaft-snapshot.js --schreiben -> Referenz neu schreiben (nur bei ABSICHTLICHER Aenderung!)
     node tools/fundament/wirtschaft-snapshot.js --aus x.json -> aktuellen Stand nach x.json
   Referenz: docs/fundament/wirtschaft-snapshot.json */
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const {laden}=require('./spiel-node.js');
const arg0=process.argv.slice(2), wi=arg0.indexOf('--wurzel');
/* --wurzel DIR: Spiel aus einem anderen Stand laden (z. B. Ausgangsstand als git worktree) */
const WURZEL=wi>=0?path.resolve(arg0[wi+1]):path.resolve(__dirname,'..','..');
const REFWURZEL=path.resolve(__dirname,'..','..');
const REF=path.join(REFWURZEL,'docs/fundament/wirtschaft-snapshot.json');
const arg=wi>=0?arg0.filter((x,i)=>i!==wi&&i!==wi+1):arg0;

const spiel=laden(WURZEL);
/* Ein Probe-Ausdruck laeuft im Spiel-Scope; Zufall wird vor jeder Probe
   neu geseedet, Fehler werden als Text festgehalten (auch die muessen gleich bleiben). */
const out={};
function probe(name,seed,code){
  spiel.seed(seed);
  try{ out[name]=JSON.parse(JSON.stringify(spiel.ev('(()=>{'+code+'})()'),(k,v)=>typeof v==='function'?'[fn]':(typeof v==='number'&&!isFinite(v))?String(v):v)); }
  catch(e){ out[name]={FEHLER:String(e&&e.message||e)}; }
}
/* gemeinsame Helfer im Spiel-Scope */
spiel.ev(`globalThis.__T=[]; save=()=>true; toast=(m,c)=>{ globalThis.__T.push((c?c+': ':'')+m); }; later=(t,f)=>{ try{ f(); }catch(e){} };
  globalThis.__neu=(o)=>{ S=freshState(); newDayStats(); shelves.length=0; racks.length=0; dekos.length=0; dirts.length=0; hype=0; phase='closed';
    for(const k in staff) staff[k]=null; marktInit(); if(o) for(const k in o){ if(k==='up') Object.assign(S.up,o.up); else S[k]=o[k]; } globalThis.__T.length=0; return S; };
  globalThis.__regale=(arten,lager)=>{ shelves.length=0; for(const k of arten) shelves.push({kind:k,levels:[]}); racks.length=0; for(let i=0;i<(lager|0);i++) racks.push({kind:'standard',slots:[]}); };
  globalThis.__html=(ids)=>{ const r={}; for(const id of ids){ const e=document.getElementById(id); r[id]=e.innerHTML||e.textContent||''; e.innerHTML=''; e.textContent=''; } return r; };
  1`);

/* ---------- 1. Kataloge ---------- */
probe('P',1,`const r={}; for(const t of ORDER){ const p=P[t]; r[t]={cat:p.cat,cost:p.cost,market:p.market,box:p.box,lvl:p.lvl,weight:p.weight,hype:p.hype,risk:p.risk,noShelf:p.noShelf,noOrder:p.noOrder,noWish:p.noWish,sparte:p.sparte}; } return {ORDER:ORDER.length,r};`);
probe('UPGRADES',1,`__neu(); return UPGRADES.map(u=>({id:u.id,kat:u.kat,lvl:u.lvl,req:u.req,kap:u.kap,cost:u.cost(),name:u.name,desc:u.desc}));`);
probe('STAFF',1,`return STAFF;`);
probe('LIZENZEN',1,`return LIZENZEN.map(l=>({id:l.id,lvl:l.lvl,cost:l.cost,name:l.name,desc:l.desc,items:l.items}));`);
probe('DEKO',1,`return DEKO;`);
probe('WALLS_FLOORS',1,`return {w:WALLS.map(w=>[w.id,w.lvl,w.cost,w.name]),f:FLOORS.map(f=>[f.id,f.lvl,f.cost,f.name])};`);
probe('REGALE',1,`return {SHELFKIND:Object.values(SHELFKIND).map(k=>[k.id,k.lvl,k.cost,k.step,k.amb,k.name]),RACKKIND:Object.entries(RACKKIND).map(([k,v])=>[k,v.lvl,v.cost,v.step,v.name]),REGALWARE,SHELFFIX};`);
probe('LOANS',1,`return LOANS;`);
probe('SUPPLIERS',1,`return SUPPLIERS;`);
probe('PACKS',1,`return {PACKS,PACK_RABATT,RESTPOSTEN};`);
probe('PYROTYPES',1,`return PYROTYPES;`);
probe('EVENTS',1,`return EVENTS;`);
probe('CUSTTYPES',1,`return CUSTTYPES;`);
probe('KAPITEL',1,`return KAPITEL.map(k=>({nr:k.nr,name:k.name,up:k.up,voll:k.voll,geplant:k.geplant}));`);
probe('ERFOLGE',1,`return ERFOLGE.map(e=>JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?String(v):v)));`);
probe('GOALS',1,`const r={}; for(const g of GOALS){ r[g.id]=[]; for(let l=1;l<=45;l++) r[g.id].push([g.mk(l).need,g.pay(l)]); } return r;`);
probe('MARKT_KONST',1,`return {VOLA,REGIME,MI_MIN,MI_MAX,KUGEL_MARGE:typeof KUGEL_MARGE!=='undefined'?KUGEL_MARGE:null,vola:ORDER.map(t=>volaOf(t))};`);
probe('KONSTANTEN',1,`return {OPEN_T,CLOSE_T,MIN_PER_SEC,START_DOY,SORT_VOLL,LIEFERZEIT_SEK,VERSAND,VERSANDFREI,lieferSek:lieferSek(),
  VS_CFG_STD,VS_PORTO,VS_KOSTEN_MAX,VS_FREI_MAX,VS_KORB,VS_STUFE_MUL,VS_GR,DDL_PAUSCHALE,DDL_ANFAHRT,VM,VM_FOLIE,VM_BAND,VM_KARTON,
  WAGES,WDMULT,KARREN,KISTE_STUECK,SB_SELBST,KASSE_GRIFF,SERIE_STUFEN,DEMO,
  frisch:(()=>{ const f=freshState(); delete f.prices; return f; })()};`);
probe('WERKBANK',1,`return {BRUCH,WB_LICHT,WB_FARBEN,WB_STUFEN,WB_TAKT,muster:Object.keys(WB_MUSTER)};`);

/* ---------- 2. Zeitreihen ---------- */
probe('SAISON',1,`const r=[]; for(let n=0;n<=800;n++){ const i=dateInfo(n), s=seasonInfo(n); r.push([i.m,i.d,i.wd,s[0],s[1],dayMult(n),isSunday(n)?1:0,silvesterNah(n)?1:0]); } return r;`);
probe('XP_KURVE',1,`const r=[]; for(let l=1;l<=80;l++) r.push(xpFor(l)); return r;`);
probe('LEVEL_FREI',1,`const r=[]; for(let l=1;l<=40;l++) r.push(levelUnlocks(l)); return r;`);

/* ---------- 3. Finanzen ---------- */
probe('DISPO',1,`const r=[]; for(let L=1;L<=40;L++) for(const m of [-3000,-120.5,0,800]){ __neu({level:L,money:m}); r.push([L,m,dispoLimit(),verfuegbar(),dispoZins(),loanMax(),loanTier()]); } return r;`);
probe('FIXKOSTEN',1,`const r=[]; const arten=Object.keys(SHELFKIND).concat(['unbekannt']);
  for(const L of [1,4,5,8,12,20,30,40]) for(const lager of [0,1,6,13]) for(const a of [[],arten,['klein','klein','standard'],['kasse','gross','kuehl']]){ __neu({level:L}); __regale(a,lager); r.push([L,lager,a.length,fixedCosts()]); }
  for(const a of arten){ __neu({level:9}); __regale([a],0); r.push([a,fixedCosts()]); } return r;`);
probe('KREDIT',1,`const r=[]; for(const L of [1,5,8,12,15,20,26,40]){ __neu({level:L,money:1000}); const t=loanTier(); if(!t){ r.push([L,null]); continue; }
  takeLoan(t.amount); const a=[L,S.money,JSON.parse(JSON.stringify(S.loan)),loanDaily()]; repayLoan(250); a.push(S.money,S.loan&&S.loan.remaining); repayLoan(0); a.push(S.money,S.loan,S.xp); r.push(a); }
  __neu({level:12,money:100}); takeLoan(1000); r.push(['klein',S.loan]); return {r,T:__T.slice()};`);
const TAG=`(o)=>{ __neu(o.s); if(o.regale) __regale(o.regale,o.lager); if(o.loan) S.loan=Object.assign({},o.loan); if(o.staff){ for(const k in o.staff) S.staff[k]=true; if(o.wage) S.wage=o.wage; if(o.pause) S.pause=o.pause; }
  if(o.deko) S.deko=o.deko.map(id=>({id})); Object.assign(DS,o.ds||{}); if(o.ev) S.ev=o.ev; if(o.dreck) for(let i=0;i<o.dreck;i++) dirts.push({});
  phase='after'; endDay(); const a={money:S.money,rep:S.rep,xp:S.xp,level:S.level,loan:S.loan,DS:JSON.parse(JSON.stringify(DS)),html:__html(['sRows','sText','sTitle'])};
  const b=document.getElementById('sBtn'); if(b.onclick) b.onclick(); a.danach={day:S.day,money:S.money,goal:S.goal,ev:S.ev,infl:S.infl,comp:S.comp,mkt:S.mkt,news:S.news,xp:S.xp,level:S.level,html:__html(['sRows','sText','sTitle'])};
  a.T=__T.slice(); return a; }`;
probe('TAGESABSCHLUSS',7,`const tag=${TAG}; const r=[];
  r.push(tag({s:{level:1,money:500},ds:{revenue:320}}));
  r.push(tag({s:{level:9,money:-400,day:40},ds:{revenue:900,goods:610,upgrades:400,changeLoss:2.5,burned:14},regale:['klein','standard','kuehl'],lager:2,loan:{amount:2500,remaining:1800,term:12,rate:0.013,paid:700},staff:{reinigung:1,kassierer:1},wage:{kassierer:1.3}}));
  r.push(tag({s:{level:26,money:12000,day:88,rep:72,up:{onlineshop:true,tag4:true}},ds:{revenue:4100,goods:2100,porto:31,vm:12,ddl:39,ddlN:1,versand:410,versandGeb:22,angry:0},deko:['automat','pflanze'],regale:['gross','gondel','eck','tisch'],lager:8,staff:{packer:1,auffueller:1,security:1},pause:{security:true}}));
  r.push(tag({s:{level:15,money:-50,day:91,rep:20,offen:14,paketeVortag:5,up:{onlineshop:true}},ds:{revenue:150,angry:3},ev:'pruefung',dreck:6,staff:{kassierer:1},wage:{kassierer:0.75}}));
  r.push(tag({s:{level:30,money:250000,day:456,rep:95,season:2,up:{onlineshop:true}},ds:{revenue:22000},loan:{amount:60000,remaining:300,term:24,rate:0.017,paid:59000}}));
  r.push(tag({s:{level:6,money:200,day:91},ds:{revenue:50},ev:'pruefung'}));
  return r;`);

/* ---------- 4. Kundenmodell ---------- */
probe('KUNDEN_TAKT',1,`const r=[]; const ups=[{},{plakat:true},{plakat:true,radio:true,tafel:true,kundenkarte:true},{shop_gross:true,shop_ost:true,shop_sued:true},{musik:true,regallicht:true,heizung:true}];
  for(const day of [0,3,6,7,40,86,91,456]) for(const L of [1,10,25]) for(const rep of [0,50,100]) for(const u of ups){ __neu({level:L,day,rep,up:u,season:1+(day>365?1:0)});
    r.push([day,L,rep,Object.keys(u).join('+'),spawnInterval(),bekanntheit(),sortimentZug(),ladenGroesse(),korbGroesse(),eroeffnung()]); }
  for(const ev of EVENTS.map(e=>e.id)){ __neu({day:40,ev}); r.push([ev,spawnInterval(),priceTol(),evv('cust'),ekFactor()]); }
  __neu({day:40}); for(const h of [0,25,50,100]){ hype=h; r.push(['hype',h,spawnInterval()]); }
  __neu({day:40}); for(const n of [0,3,10,20]){ dirts.length=0; for(let i=0;i<n;i++) dirts.push({}); r.push(['dreck',n,cleanliness(),spawnInterval()]); }
  __neu({day:40}); S.lic=LIZENZEN.map(l=>l.id); r.push(['allesLiz',sortimentBreite(),sortimentZug(),spawnInterval()]);
  return r;`);
probe('AMBIENTE',1,`const r=[]; for(const d of [[],['pflanze'],DEKO.map(x=>x.id)]) for(const w of ['creme','marmorwand','samt']) for(const f of ['grau','versailles']) for(const u of [{},{musik:true,regallicht:true,heizung:true}]){
  __neu({wall:w,floor:f,up:u}); S.deko=d.map(id=>({id})); dekos.length=0; d.forEach(id=>dekos.push({id})); __regale(['klein','gondel','kuehl'],0);
  r.push([d.length,w,f,Object.keys(u).length,ambienteScore(),bildBoost(),priceTol()]); }
  __neu(); S.grime=0.5; r.push(['grime',windowGrime(),ambienteScore()]); return r;`);
probe('KAUFCHANCE',1,`const r=[]; __neu({day:40}); const ts=['wunder','boeller','sekt','faecher','kugel100'];
  for(const t of ts) for(const f of [0.6,0.9,1,1.1,1.3,1.5,1.8,2.2]) for(const q of [1,2,3]) for(const cold of [false,true]) for(const ct of [null,CUSTTYPES[1],CUSTTYPES[5]]) r.push(buyChance(t,marketOf(t)*f,q,cold,ct));
  const tol=[]; for(const rep of [0,50,100]) for(const comp of [0.88,1,1.12]){ __neu({rep,comp}); tol.push(priceTol()); }
  return {r,tol};`);
probe('WUENSCHE',11,`const r=[]; for(const day of [40,86,90]) for(const L of [3,12,25]){ __neu({day,level:L}); S.lic=LIZENZEN.filter(l=>l.lvl<=L).map(l=>l.id); hype=day===86?60:0;
  for(const ct of CUSTTYPES) r.push([day,L,ct.id,makeWishes(ct)]); r.push([day,L,'ohne',makeWishes(null)]); }
  __neu({day:40}); r.push(['fehlt',nachfrageFaktor('wunder')]); return r;`);
probe('DIEB_GEDULD',3,`const r=[]; for(const L of [1,3,4,10,20,40]) for(const u of [{},{cams:true}]){ __neu({level:L,up:u}); r.push([L,!!u.cams,thiefChance()]); }
  __neu({level:12}); S.ev='jugendbande'; r.push(['ev',thiefChance()]);
  makePerson=()=>new THREE.Group(); const g=[];
  for(const rep of [0,50,100]) for(const u of [{},{heizung:true,klima:true}]){ __neu({rep,up:u,day:40}); for(let i=0;i<3;i++){ const c=new Customer(); g.push([rep,Object.keys(u).length,c.ct.id,c.patience,c.thief,c.wantGrav,c.wishes.length]); } }
  return {r,g};`);
probe('KUNDENTYP',5,`__neu({level:3}); const a={}; for(let i=0;i<2000;i++){ const c=rollCustType(); a[c.id]=(a[c.id]||0)+1; } __neu({level:9}); const b={}; for(let i=0;i<2000;i++){ const c=rollCustType(); b[c.id]=(b[c.id]||0)+1; } return {a,b};`);

/* ---------- 5. Markt ---------- */
probe('MARKT_40_TAGE',21,`__neu({day:5}); S.lic=LIZENZEN.map(l=>l.id); const r=[];
  for(let d=0;d<40;d++){ S.day++; rollMarket(); rollEvent(); r.push([S.infl,S.comp,S.mkt,S.ev,S.news.map(n=>n.t+':'+n.knapp),marketOf('boeller'),costOf('faecher'),ekRoh('kugel100'),marktText(),inflText()]); }
  const end={}; for(const t of ORDER) end[t]=[S.mi[t],S.me[t],S.reg[t].k,S.reg[t].t]; return {r,end,lbl:ORDER.slice(0,40).map(t=>[marktLabel(t),marktLuecke(t),marktNiveau(t),marktDelta(t),ekDelta(t),ekNiveau(t)]),chance:marktChance(),extrem:[marktExtrem(1),marktExtrem(-1)],ekTag:ekTag()};`);

/* ---------- 6. Einkauf, Pakete, Restposten ---------- */
probe('EINKAUF',1,`const r=[]; for(const L of [1,8,14,25]) for(const liz of [false,true]){ __neu({level:L,up:{lizenz:liz,lager:true}}); S.lic=LIZENZEN.map(l=>l.id);
  for(const t of ['wunder','sekt','faecher','kugel300']) for(const s of SUPPLIERS) for(const tier of (s.tiers||[{n:1,d:0}])) r.push([L,liz,t,s.id,tier.n,tierPrice(t,s,tier)]); r.push(['ek',ekFactor()]); }
  __neu({level:9,up:{lager:true}}); S.lic=LIZENZEN.map(l=>l.id); S.cart=[]; const k=[];
  for(const [t,n,sup] of [['wunder',1,'fachhandel'],['sekt',1,'fachhandel'],['faecher',10,'grosshandel'],['boeller',20,'grosshandel']]){ cartAdd(t,n,sup); k.push([cartGoods(),cartFee(),cartTotal(),cartBoxes()]); }
  cartClear(); return {r,k,T:__T.slice()};`);
probe('PAKETE',13,`const r=[]; for(const L of [14,18,25]){ __neu({level:L,up:{lager:true}}); S.lic=LIZENZEN.filter(l=>l.lvl<=L).map(l=>l.id);
  for(const pk of PACKS) r.push([L,pk.id,packOffen(pk),packKartonWert(pk.gruppe,pk.sorten),packOffen(pk)?packPreis(pk):null,packContents(pk.n,pk.gruppe,pk.sorten).length]); }
  const d=[]; for(const m of [-500,0,300,1000,5000,40000]) for(const loan of [null,{amount:1000,remaining:800,term:10,rate:0.012,paid:0}]){ __neu({level:16,money:m,loan}); __regale(['klein','standard'],2); d.push([m,!!loan,restDruck()]); }
  const w=[]; for(const z of [0,0.1,0.3,0.6,0.8,0.95]){ __neu({level:16,money:2000}); S.lic=LIZENZEN.filter(l=>l.lvl<=16).map(l=>l.id); const n=restWelle(z); w.push([z,n,restDaten().angebote.map(a=>[a.pack,a.preis,a.vorrat,Math.round(a.bis)]),Math.round(restDaten().t)]); }
  return {r,d,w};`);

/* ---------- 7. Personal ---------- */
probe('PERSONAL',17,`const r=[]; __neu({level:30}); for(const s of STAFF) S.staff[s.id]=true;
  for(const f of [0.75,1,1.3,1.65]){ S.wage={}; for(const s of STAFF) S.wage[s.id]=f; S.pause={}; r.push([f,dailyWages(),friendliness(),priceTol()]); S.pause={reinigung:true,security:true}; r.push([f,'pause',dailyWages()]); }
  __neu({level:30,rep:60}); for(const s of STAFF) S.staff[s.id]=true; S.wage={reinigung:0.75,kassierer:0.75,security:1.65}; const m=[]; for(let i=0;i<10;i++){ staffMorale(); m.push([Object.keys(S.staff).filter(k=>S.staff[k]).length,S.rep]); }
  return {r,m,T:__T.slice()};`);

/* ---------- 8. Versand / Online ---------- */
probe('VERSAND_FORMELN',1,`const r=[]; for(const w of [0,5,12,22,35,50,80,150]) for(const v of [0,1,2.9,4.9,7.5,12,20]) r.push(vsAnnahme(w,v));
  const q=[]; __neu({level:25,day:40,up:{onlineshop:true}}); S.lic=LIZENZEN.map(l=>l.id);
  for(const c of [{kosten:4.9,frei:50,nie:false},{kosten:0,frei:0,nie:false},{kosten:9.9,frei:150,nie:false},{kosten:20,frei:50,nie:true},{kosten:3.5,frei:25,nie:false}]) for(const g of [false,true]) q.push([c,g,vsQuote(c,g),vsGebuehr(30,c),vsGebuehr(60,c)]);
  const b=[]; for(const L of [15,25,34]) for(const rep of [0,50,100]){ __neu({level:L,rep,up:{onlineshop:true}}); b.push([L,rep,vsBasis(),paketWert()]); }
  const s=[]; for(const proz of [0,10,30,50]){ __neu({level:25,up:{onlineshop:true}}); S.lic=LIZENZEN.map(l=>l.id); S.aktion={proz,frei:-1,rabatt:proz?{boeller:proz+10,sekt:60}:{}}; s.push([proz,vsSaleFaktor(),vsGewicht('boeller'),vsRabatt('sekt'),vsListe('boeller'),vsPreis('sekt'),vsNachfrage()]); }
  __neu({level:25,up:{onlineshop:true}}); S.versandCfg={kosten:55,frei:999,nie:0,v:1}; const cfg=JSON.parse(JSON.stringify(vsCfg()));
  return {r,q,qStd:vsQuoteStd(),b,s,cfg,stufe:VS_STUFE_MUL};`);
probe('VERSAND_BESTELLUNG',23,`__neu({level:25,day:40,up:{onlineshop:true}}); S.lic=LIZENZEN.map(l=>l.id); const r=[];
  for(const L of [25,30]) for(let i=0;i<25;i++){ S.level=L; const b=vsNeueBestellung(true); r.push(b?[b.gr,b.wert,b.versand,b.rabatt,b.pos.map(l=>l.t+'x'+l.n).join(',')]:null); }
  __neu({level:25,money:1000,up:{onlineshop:true}}); const b={id:1,pos:[{t:'boeller',n:2,g:2},{t:'sekt',n:1,g:1}],gr:3,wert:24.5,versand:4.9,rabatt:1.2,st:'offen',tag:0}; S.bestellungen=[b];
  vsBuchen(b,true); const k=[vmKostenJe(1),vmKostenJe(3),vmKostenJe(6),vmBedarf(1),vmBedarf(3),vmBedarf(6)];
  return {r,buch:[S.money,S.xp,JSON.parse(JSON.stringify(DS))],k,T:__T.slice()};`);
probe('ONLINE_TEXTE',1,`const r={}; __neu({level:25,day:40,rep:60,up:{onlineshop:true,packstation:true}}); S.lic=LIZENZEN.map(l=>l.id);
  try{ r.hint=onlineHint(); }catch(e){ r.hint='F:'+e.message; }
  try{ r.html=renderOnline(); }catch(e){ r.html='F:'+e.message; }
  try{ r.erg=onlineErgebnis({}); }catch(e){ r.erg='F:'+e.message; }
  return r;`);

/* ---------- 9. Kaeufe (Geld, XP) ---------- */
probe('KAEUFE',29,`const r=[];
  for(const u of UPGRADES){ __neu({level:40,money:100000}); if(u.req) S.up[u.req]=true; const m=S.money, x=S.xp; try{ buyUp(u.id); }catch(e){} r.push(['up',u.id,r2(m-S.money),S.xp-x+(S.level-40)*1e6]); }
  for(const d of DEKO){ __neu({level:40,money:100000}); const m=S.money, x=S.xp; try{ buyDeko(d.id); }catch(e){} r.push(['deko',d.id,r2(m-S.money),S.xp-x]); }
  for(const l of LIZENZEN){ __neu({level:40,money:100000}); const m=S.money, x=S.xp; buyLizenz(l.id); r.push(['liz',l.id,r2(m-S.money),S.xp-x]); }
  for(const id of Object.keys(SHELFKIND).concat(['rack','rhoch','rschwer'])){ __neu({level:40,money:100000,up:{lager:true,lager_gross:true,shop_gross:true}}); __regale(['klein','standard'],2); r.push(['regal',id,regalPreis(id)]); }
  __neu({level:40,money:100000}); for(const n of [1,2,5]){ __regale(Array(n).fill('standard'),n); r.push(['regaln',n,regalPreis('standard'),regalPreis('rack')]); }
  return {r,T:__T.slice(0,80)};`);
probe('XP_QUELLEN',31,`const r=[]; __neu(); for(const n of [10,49,50,51,700,3000,20000]){ __neu(); addXP(n); r.push([n,S.level,S.xp]); }
  __neu({level:12}); const g={}; for(const G of GOALS){ __neu({level:12,money:100}); S.goal={id:G.id,name:G.name,kind:G.mk(12).kind,need:G.mk(12).need,unit:'',have:0,pay:G.pay(12),days:7}; goalAdd(S.goal.kind,1e6); g[G.id]=[S.money,S.xp,S.level]; }
  return {r,g};`);
probe('AUFTRAEGE',37,`const r=[]; for(const L of [7,10,15,25]){ __neu({level:L,up:{grosskunden:true,lager:true}}); S.lic=LIZENZEN.filter(l=>l.lvl<=L).map(l=>l.id);
  for(let i=0;i<6;i++){ const c=makeCall(); r.push(c?[c.type.id,c.value,c.mult,c.items.map(x=>x.type+'x'+x.cartons).join(',')]:null); } r.push(orderScale()); }
  for(const meister of [false,true]){ __neu({level:30,money:0,up:{grosskunden:true,meister}}); S.lic=LIZENZEN.map(l=>l.id); phone.call=makeCall(); haggle(0.1); haggle(0.3); const mult=phone.call?phone.call.mult:null; acceptDeal(); const o=order; r.push(['acc',meister,mult,o&&o.pay,S.xp]); if(o){ finishOrder(); r.push(['fin',S.money,S.rep,S.xp,S.level]); } }
  __neu({level:12,rep:50}); order={name:'X',items:[{type:'boeller',cartons:3,loaded:1}],pay:100}; failOrder(); r.push(['fail',S.rep]);
  return {r,T:__T.slice()};`);
probe('ERFOLGE_BELOHNUNG',41,`const r=[]; for(const e of ERFOLGE) for(let st=0;st<e.stufen.length;st++){ __neu({level:30,money:0}); S.erf={}; S.erf[e.id]=st; try{ erfBelohnen(e,st); }catch(x){ r.push([e.id,st,'F:'+x.message]); continue; } r.push([e.id,st,S.money,S.gutschrift,S.xp,S.level]); }
  return {r,T:__T.slice(0,60)};`);
probe('WERKBANK_RECHNUNG',43,`const r=[]; const E=[['kugel','gold','weiss'],['chrys','rot','gold'],['kamuro','gold','blau'],['licht:goldkomet','gold','violett']];
  WIRT.werkbank.stufen.forEach((st,i)=>{ for(const [e,A,B] of E) for(const fin of [false,true]){ const N=st.schuss, a=Math.round(N*0.7);
    const d={stufe:i,abschnitte:[wbAbschnitt({e,A,B,n:fin?a:N,takt:2,muster:'lr'})].concat(fin?[wbAbschnitt({e:'chrys',A:B,B:A,n:N-a,muster:'finale',hoehe:2,kal:2})]:[])};
    try{ const b=wbBewertung(d), q={stufe:i,cost:wbStueckkosten(d)}; r.push([i,e,fin,b.gesamt,b.sterne,wbStueckkosten(d),wbMarkt(d,b),wbGewicht(d,b),wbHype(d,b),wbEntwicklung(d),wbDauer(d),wbSerie(q,st.mindest).preis,wbSerie(q,st.mindest*4).preis]); }catch(x){ r.push([i,e,'F:'+x.message]); } } }); return r;`);

/* ---------- 10. Texte, die Werte wiederholen ---------- */
probe('HANDBUCH',1,`__neu({level:10}); return handbuchHTML();`);
probe('LAPTOP',47,`const r={}; for(const L of [5,16,26]){ __neu({level:L,money:2000,day:40,up:{lager:true,onlineshop:L>20,packstation:L>20}}); S.lic=LIZENZEN.filter(l=>l.lvl<=L).map(l=>l.id);
  for(const [ger,tab,sup] of [['buero','order','ware'],['buero','order','gross'],['buero','order','rest'],['buero','order','regal'],['buero','order','vm'],['buero','price'],['buero','liz'],['buero','up'],['buero','deko'],['buero','order','eigen'],['buero','shop'],['lager','online'],['lager','staff']]){
    lapGeraet=ger; ltab=tab; if(sup) lsup=sup; try{ renderLaptop(); r[L+tab+(sup||'')]=__html(['lbody']).lbody; }catch(e){ r[L+tab+(sup||'')]='F:'+e.message; } }
  handyOpen=true; for(const a of HANDY_APPS){ happ=a.id; try{ renderHandy(); r['h'+L+a.id]=__html(['hInhalt','hApp']); }catch(e){ r['h'+L+a.id]='F:'+e.message; } } handyOpen=false; happ=null; }
  return r;`);

/* Laptop/Handy-HTML ist gross (alle Produkte): in der Referenz nur als Pruefsumme je Reiter.
   Bei Abweichung beide Staende mit --aus schreiben und vergleichen. */
const h=x=>crypto.createHash('sha1').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex').slice(0,16);
if(out.LAPTOP&&!out.LAPTOP.FEHLER&&arg[0]!=='--aus') for(const k in out.LAPTOP) out.LAPTOP[k]=h(out.LAPTOP[k]);
const json=JSON.stringify(out,null,0).replace(/\],"/g,'],\n"').replace(/\},"/g,'},\n"');
const fehler=Object.entries(out).filter(([k,v])=>v&&v.FEHLER).map(([k,v])=>k+': '+v.FEHLER);
if(arg[0]==='--aus'){ fs.writeFileSync(arg[1],json); console.log('geschrieben',arg[1],(json.length/1024).toFixed(0)+' KB'); }
else if(arg[0]==='--schreiben'){ fs.writeFileSync(REF,json); console.log('Referenz geschrieben',REF,(json.length/1024).toFixed(0)+' KB'); }
else {
  const ref=JSON.parse(fs.readFileSync(REF,'utf8'));
  const diffs=[];
  const vgl=(a,b,p)=>{ if(diffs.length>5000) return;
    if(typeof a!==typeof b||Array.isArray(a)!==Array.isArray(b)||(a===null)!==(b===null)){ diffs.push(p+': '+JSON.stringify(a)?.slice(0,120)+' -> '+JSON.stringify(b)?.slice(0,120)); return; }
    if(a&&typeof a==='object'){ const ks=new Set([...Object.keys(a),...Object.keys(b)]); for(const k of ks) vgl(a[k],b[k],p+'.'+k); return; }
    if(a!==b) diffs.push(p+': '+JSON.stringify(a)?.slice(0,160)+' -> '+JSON.stringify(b)?.slice(0,160)); };
  vgl(ref,out,'');
  console.log(`Wirtschafts-Snapshot: ${Object.keys(out).length} Bereiche, ${(json.length/1024).toFixed(0)} KB`);
  if(fehler.length) console.log('Proben mit Fehlertext (muessen gleich bleiben):',fehler.length);
  if(diffs.length){ const ber={}; for(const d of diffs){ const b=d.split('.')[1].split(':')[0]; ber[b]=(ber[b]||0)+1; }
    console.log('ABWEICHUNG ('+diffs.length+(diffs.length>5000?'+':'')+' Stellen) in: '+Object.entries(ber).map(([b,n])=>b+' '+n).join(', '));
    diffs.slice(0,40).forEach(d=>console.log('  '+d)); if(diffs.length>40) console.log('  ...'); process.exit(1); }
  console.log('GLEICH: keine Abweichung zur Referenz');
}
