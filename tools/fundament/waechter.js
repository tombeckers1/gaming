/* Waechter Fundament (Etappe 5, 14.10.2026) - statische Pruefung OHNE Browser
   Tom 13.10.: "Neues entsteht automatisch im System" - erzwungen ueber Stilregeln,
   CLAUDE.md-Pflichtregel und diese Waechter. Regeln: docs/fundament/stilregeln.md.

   Prueft den Quelltext aller Teile aus src/build.sh (Tokenizer acorn, Kommentare zaehlen nicht):
     MATERIAL   new THREE.Mesh*Material(  ausserhalb 01b-material.js
     STD        std(0x...) / MAT.std(0x...)  (eigene Farbe ohne Palettenton)
     HEX        freie Hex-Farben 0xRRGGBB im Code (ohne 0xffffff/0x000000 = Toenung)
     CSS        freie Farben in Texten '#rgb', '#rrggbb', 'rgb(a)(...)' (ohne Weiss/Schwarz)
     GELD       Geld-/Preis-/Lohn-artige Zahlen ausserhalb 01c-wirtschaft.js
                (Zahl neben money/cost/preis/lohn/porto/zins/kredit/..., oder "N €" im Text)
     SNAPSHOT   tools/fundament/wirtschaft-snapshot.js muss GLEICH melden
     FEUERWERK  Zuenden/Aufstellen (raketeModell, kugelModell, batterieModell, kfTischAuf,
                kqPodestAuf, fkGestell, igniteType) und Abschussrohre nur in 14z4-abschuss.js
                (Regel R7, docs/fundament/feuerwerk-regeln.md; dieselbe Liste nutzt abschussregel.js)
     BAUKASTEN  Bauteile, die es im Baukasten gibt (bk.tor, bk.schild, bk.sammler, bk.poller ...),
                werden nirgends sonst neu gebaut: eine Funktion, deren Name das Bauteil nennt und
                die Geometrie/Materialien baut, ohne bk.<bauteil>(...) zu rufen, ist ein Verstoss.
                Geloeschte Duplikate (torPanelMat, concreteTex ...) duerfen nicht zurueckkommen.
                Jedes bk.<name> in 04z muss hier als Bauteil oder Helfer eingetragen sein.
   Was heute noch abweicht, steht in der SCHRUMPFENDEN Ausnahmeliste
   tools/fundament/waechter-ausnahmen.json (je Eintrag Datei, Art, Anzahl/Werte, Grund, geplanter
   Schritt, Anlass). Neue Verstoesse -> ROT. Weniger als erlaubt -> ROT "Liste schrumpfen"
   (der Gewinn wird festgeschrieben, die Liste darf nur kleiner werden).

   Aufruf (Repo-Wurzel):
     node tools/fundament/waechter.js                      alle Pruefungen, Exit 1 bei Rot
     node tools/fundament/waechter.js --nur material,geld  nur diese (material,std,hex,css,geld,snapshot,feuerwerk,baukasten)
     node tools/fundament/waechter.js --liste 05e-street.js [art]   alle Fundstellen Datei:Zeile
     node tools/fundament/waechter.js --ausgangsliste [--grund "Anlass"]
          schreibt die Ausnahmeliste neu. Kleiner werden darf sie immer; neue oder groessere
          Eintraege nur mit --grund (Begruendungspflicht, steht dann als "anlass" im Eintrag).
     node tools/fundament/waechter.js --gegenprobe         baut je Waechter einen Verstoss ein
          (nur im Speicher bzw. in einer Kopie unter /tmp) und erwartet ROT */
'use strict';
const fs=require('fs'), path=require('path'), os=require('os'), cp=require('child_process');
const acorn=require(fs.existsSync('/opt/node-tools/node_modules/acorn')?'/opt/node-tools/node_modules/acorn':'acorn');

const WURZEL=path.resolve(__dirname,'..','..');
const AUSNAHMEN=path.join(__dirname,'waechter-ausnahmen.json');
const ARTEN=['material','std','hex','css','geld','feuerwerk','bauteil'];

/* ---------- Dauerhaft frei (Anomalie, Tom 26.09./13.10.: nur Feuerwerks-Effekte und Verpackungsmotive
   sind bewusst verschieden). Aenderung nur mit Tom. ---------- */
const FREI=[
  {dateien:/^01b-material\.js$/,arten:['material','std','hex','css'],grund:'Materialbibliothek selbst - hier stehen Palette, Rezepte, Texturen'},
  {dateien:/^01c-wirtschaft\.js$/,arten:['geld'],grund:'Wirtschaftszentrale selbst'},
  {dateien:/^14(?!z4)/,arten:['material','std','hex','css','geld','bauteil'],grund:'Feuerwerks-Effekte und Produktmodelle der Drehbuecher = Anomalie (Tom 26.09.); die Mechanik (14z4) ist NICHT frei'},
  {dateien:/^(04c-rohre|04d-design|04e-ware|04f-|04g-|04h-|04i-|04j-|04k-|04l-|17c-verpackung)/,arten:['material','std','hex','css','bauteil'],grund:'Verpackungen/Produktformen und ihre Motive = bewusst je Produkt eigen (Tom 13.10.)'},
  {dateien:/^(02d-werkbank|02e-neuware|02f-themen|02g-runde4|02h-kugeln5|02i-kugeln6|02j-batterien7)\.js$/,arten:['css'],grund:'Produktdaten: Verpackungsfarben und Effektfarben der Sorten (Anomalie)'}
];
/* Produktkatalog: Preise je Sorte (P[t].cost/.market) sind Katalog wie Name und Masse
   (docs/fundament/wirtschaft.md "Was bewusst nicht in der Zentrale steht"). Erkannt: Zahl hinter
   cost:/market: in einer Zeile, die auch hype/shape/dims nennt (Produkteintrag). */
const PRODUKT_ZEILE=/\b(hype|shape|dims)\s*:/;

/* ---------- GELD: Namensteile, die Geld bedeuten ---------- */
const GELD_TEIL=/^(money|cost|costs|price|prices|preis|preise|kosten|lohn|loehne|wage|wages|pay|payout|geld|porto|gebuehr|fee|fees|zins|zinsen|rabatt|discount|kredit|loan|dispo|miete|pauschale|umsatz|gewinn|eur|euro|budget|erstattung|tilgung)$/i;
const GELD_HARMLOS=new Set([0,1,2,10,100,1000,0.5]);   /* Runden (x*100/100), Haelfte, Zaehler */
const teile=n=>n.split(/(?=[A-Z])|_|\d+/).filter(Boolean).map(s=>s.toLowerCase());

/* ---------- FEUERWERK (Regel R7) ---------- */
const FW_FN=['raketeModell','kugelModell','batterieModell','kfTischAuf','kqPodestAuf','fkGestell','igniteType'];
const FW_BAUSTEIN='14z4-abschuss.js';

/* ---------- BAUKASTEN: Bauteile und Woerter ----------
   Ein Eintrag wird aktiv, sobald bk.<bk> in 04z-baukasten.js definiert ist (so greift die Regel
   automatisch, wenn ein neues Bauteil in den Baukasten kommt). woerter = Namensteile (camelCase),
   namen = zusaetzliche feste Funktionsnamen. */
const BAUTEILE=[
  {bk:'tor',woerter:['tor','tore','rolltor','sektionaltor','torblatt','lamelle','lamellen','ladetor','schiebetor','doppeltor','wtor'],wofuer:'Tore (Ladetor, Rolltor, Attrappe, Zauntor) - tore.md'},
  {bk:'schild',woerter:['schild','schilder','sign','schildtex'],wofuer:'Schilder im Hausstil Nachtblau/Gold'},
  {bk:'sammler',woerter:['sammler'],namen:['hausKit','hzAdd','stM','hvSammler'],wofuer:'Teile -> ein Mesh je Oberflaechenklasse (Vertexfarben)'},
  {bk:'poller',woerter:['poller'],wofuer:'Poller'},
  {bk:'anfahrschutz',woerter:['anfahrschutz','rammschutz'],wofuer:'Anfahrschutz'},
  {bk:'zaun',woerter:['zaun','zaunlauf','zaeune','gitterzaun','fence'],wofuer:'Zaeune'},
  {bk:'absperrung',woerter:['absperrung','absperrgitter','absperr'],wofuer:'Absperrungen'},
  {bk:'wand',woerter:['wand','wall','trennwand','waende'],wofuer:'Waende/Paneele'},
  {bk:'sockelleiste',woerter:['sockelleiste','sockel'],wofuer:'Sockelleisten'},
  {bk:'wandbild',woerter:['wandbild'],wofuer:'Wandbilder'},
  {bk:'dachrand',woerter:['dachrand','attika','fallrohr','regenrohr'],wofuer:'Dachrand/Attika mit Attikablech und Fallrohren (fassade.md)'},
  {bk:'palette',woerter:['palette','paletten','pallet','europalette'],wofuer:'Paletten'},
  {bk:'karton',woerter:['karton','kartons'],wofuer:'Kartons (Atlas)'},
  {bk:'regal',woerter:['regal','regale','rack','shelf','gondel'],wofuer:'Regale (Verkaufsmoebel, Lagerregal, Fachboden) - einheit.md'},
  {bk:'kasse',woerter:['kasse','kassen','checkout','kassenplatz'],wofuer:'Kassen (Kassenplatz, SB-Terminal, SB-Tafel) - einheit.md'},
  {bk:'lampe',woerter:['lampe','lampen','leuchte','leuchten','lamp','fluter','strahler'],wofuer:'Lampen'},
  {bk:'tuer',woerter:['tuer','tuere','door','schiebetuer','drehtuer','stahltuer','brandschutztuer','feuerschutztuer','streifenvorhang'],wofuer:'Tueren (Schiebetuer, Drehfluegel Stahl/Brand/Glas, Streifenvorhang) - einheit.md'},
  {bk:'fenster',woerter:['fenster','window','schaufenster'],wofuer:'Fenster (Schaufenster, Fluegelfenster Lager) - einheit.md'},
  {bk:'leiter',woerter:['leiter','ladder'],wofuer:'Leitern'},
  {bk:'foerderband',woerter:['foerderband','rollenbahn','band','belt','conveyor'],wofuer:'Foerderbaender'},
  /* Halle Etappe A (14.10.) */
  {bk:'hochregal',woerter:['hochregal','palettenregal'],wofuer:'Hochregal (Rahmen, Traversen, Gitterroste, Belegung) - baukasten.md'},
  {bk:'rbg',woerter:['rbg','regalbediengeraet'],wofuer:'Regalbediengeraet'},
  {bk:'foerderer',woerter:['foerderer','rollenfoerderer','kettenfoerderer'],wofuer:'Paletten-Foerderer (Rollen)'},
  {bk:'bodenmarkierung',woerter:['bodenmarkierung','markierungen'],wofuer:'Bodenmarkierung (Fahrweg, Gehweg, Sperrflaeche, Stellplatz)'},
  {bk:'fts',woerter:['fts'],wofuer:'Fahrerloses Transportfahrzeug (Paletten)'},
  {bk:'hubwagen',woerter:['hubwagen','handhubwagen','ameise'],wofuer:'Handhubwagen (Gabeln passen in die Euro-Palette; DDL-Fahrer, Versandhof)'},
  /* Halle Etappe B (15.10.) - Woerter bewusst eng (Atlas-zelle). bk.drehtuer ist seit Einheit 15.10. bk.tuer (art stahl/brand/glas) */
  {bk:'treppe',woerter:['treppe','treppen','stiege'],wofuer:'Treppen (Stahl, Gelaender gelb)'},
  {bk:'portalgreifer',woerter:['portalgreifer','greifer'],wofuer:'Portalgreifer aus Alu-Profil (Fertigung)'},
  {bk:'rohrraster',woerter:['rohrraster'],wofuer:'Batterie-Rohr-Raster (Fertigung)'},
  {bk:'maschine',woerter:['maschine','maschinen'],wofuer:'Stationsmaschinen der Fertigung (Arten statt Kopien)'},
  {bk:'erdwall',woerter:['erdwall','schutzwall'],wofuer:'Erdwall um das Mischhaus'},
  {bk:'zelle',woerter:['betonzelle','sicherheitszelle','fuellzelle'],wofuer:'Betonzelle (mannlose Station, Mischhaus, Chemie-Box)'},
  /* Verpackungs-Ausstellung 2.0 (15.10.) */
  {bk:'verkaufstisch',woerter:['verkaufstisch','verkaufstische'],wofuer:'Ladenbau-Verkaufstische (viele in einem Mesh) - Optik wie SHELFKIND.tisch/tischgross'},
  /* Werkbank (Kapitel 5 Eigene Marke, 16.10.) */
  {bk:'werkbank',woerter:['werkbank','werktisch'],wofuer:'Werkbank im Lager: Werktisch, Lochwand, Schraubstock, Musterbatterie, Tablet (Bauprogramm eigene Batterien)'}
];
/* Helfer im Baukasten (kein Bauteil, keine Namensregel) */
const HELFER=['lod','kasten','stab','uvZeile','schildTex','liste','WB','PALETTE','inst','bandMat','bandTex','flaeche','flaecheArt','fuss','wandFlaeche','wandBildAdd','wandbildTakt','paletten','palFarbe','HOCHREGAL','ladungGeo','MARKIERUNG','kastenM','werkSammler','balken','HUBWAGEN','verkaufstischTeile','schildAtlas','schildWeg','SCHILD','AUSSEN','DACHRAND','LAMPE_AUSSEN'];
/* geloeschte Duplikate - duerfen nie zurueckkommen (Schritte Material, Angleichung, Tore, Feuerwerk) */
const GELOESCHT=['torPanelMat','torBlattMat','westTorInnen','vdPanelMat','panelPose','strebe','concreteTex','gitterTex','gitterMat',
  'stationsModell','stationSlot','rampeMund','kerzeImRohr','stationsPool','vfMuendung','vfImRohr','hvLamellenTex','hvTor'];
/* eigene Textur fuer etwas, das MAT.tex schon hat */
const TEXTUR_DUP=/^(beton|concrete|gitter|draht|doppelstab|schraffur|warnschraffur|warnstreifen|torblatt)\w*(tex|textur|mat)$/i;
/* "baut" = legt Geometrie, Meshes oder Materialien an */
const BAU_KLASSE=/(Geometry|Mesh|Material|InstancedMesh)$/;
const BAU_FN=new Set(['tex','rbox','bbox','roundedBoxGeo','merge','plane','flat','box']);

/* ---------- Quelltext laden ---------- */
function teileListe(w){ const sh=fs.readFileSync(path.join(w,'src/build.sh'),'utf8');
  return [...sh.matchAll(/\$W\/parts\/([^ ]+)/g)].map(m=>m[1]).filter(f=>f.endsWith('.js')); }
function quellen(w){ const q={}; for(const f of teileListe(w)) q[f]=fs.readFileSync(path.join(w,'src/parts',f),'utf8'); return q; }
const frei=(datei,art)=>FREI.some(r=>r.dateien.test(datei)&&r.arten.includes(art));

function tokens(code){
  code=code.replace(/<\/script>\s*<\/body>[\s\S]*$/,'');
  const T=[]; for(const t of acorn.tokenizer(code,{ecmaVersion:'latest',allowReturnOutsideFunction:true,allowHashBang:true,locations:true})) T.push(t);
  return {T,code,zeilen:code.split('\n')};
}
const lab=t=>t&&t.type.label;
const roh=(c,t)=>c.slice(t.start,t.end);
const farbeNeutral=s=>/^#?(f{3}|0{3}|f{6}|0{6})$/i.test(s);
const RGB=/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi;

/* ---------- Scan einer Datei -> Fundstellen [{art,wert,zeile,text}] ---------- */
function scanDatei(datei,src,bkAktiv){
  const out=[]; let tk; try{ tk=tokens(src); }catch(e){ return [{art:'fehler',wert:'tokenizer',zeile:0,text:String(e.message)}]; }
  const {T,code,zeilen}=tk;
  const add=(art,wert,t,extra)=>{ if(frei(datei,art)) return; const z=t.loc.start.line; out.push(Object.assign({art,wert:String(wert),zeile:z,text:(zeilen[z-1]||'').trim().slice(0,160)},extra||{})); };
  for(let i=0;i<T.length;i++){ const t=T[i], L=lab(t);
    /* MATERIAL */
    if(L==='new'&&T[i+1]&&T[i+1].value==='THREE'&&lab(T[i+2])==='.'&&T[i+3]&&/^Mesh\w*Material$/.test(T[i+3].value)) add('material',T[i+3].value,t);
    /* STD / HEX */
    if(L==='num'){ const r=roh(code,t);
      if(/^0x[0-9a-f]{6}$/i.test(r)){ const w=r.toLowerCase();
        const istStd=lab(T[i-1])==='('&&T[i-2]&&T[i-2].value==='std';
        if(istStd) add('std',w,t); else if(!farbeNeutral(w.slice(2))) add('hex',w,t); } }
    /* CSS-Farben in Texten */
    if(L==='string'||L==='template'){ const v=String(t.value);
      for(const m of v.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-z])/gi)) if(!farbeNeutral(m[1])) add('css','#'+m[1].toLowerCase(),t);
      for(const m of v.matchAll(RGB)){ const a=+m[1],b=+m[2],c=+m[3]; if(!((a===0&&b===0&&c===0)||(a===255&&b===255&&c===255))) add('css',`rgb(${a},${b},${c})`,t); } }
    /* GELD */
    if(L==='num'&&!GELD_HARMLOS.has(t.value)&&!/^0x/i.test(roh(code,t))){
      let treffer=null;
      for(const j of [i-1,i-2,i-3,i+1,i+2]){ const u=T[j]; if(!u||lab(u)!=='name'||!teile(u.value).some(p=>GELD_TEIL.test(p))) continue;
        const a=Math.min(i,j), b=Math.max(i,j); let ok=true;
        for(let k=a+1;k<b;k++){ const l=lab(T[k]); if(l===','||l===';'||l==='{'||l==='}'||l==='=>') ok=false; }
        if(ok){ treffer=u.value; break; } }
      if(treffer){ const z=zeilen[t.loc.start.line-1]||'';
        const produkt=(treffer==='cost'||treffer==='market')&&PRODUKT_ZEILE.test(z)&&lab(T[i-1])===':';
        if(!produkt) add('geld',t.value,t,{bei:treffer}); } }
    if((L==='string'||L==='template')&&/\d\s*(€|Euro\b)/.test(String(t.value))){
      for(const m of String(t.value).matchAll(/(\d[\d.,]*)\s*(€|Euro\b)/g)) add('geld',m[1]+' €',t,{bei:'Text'}); }
    /* FEUERWERK (R7) */
    if(datei!==FW_BAUSTEIN&&L==='name'&&FW_FN.includes(t.value)&&lab(T[i+1])==='('&&lab(T[i-1])!=='.'&&lab(T[i-1])!=='function') add('feuerwerk',t.value+'(',t);
    if(datei!==FW_BAUSTEIN&&L==='name'&&t.value==='CylinderGeometry'&&lab(T[i+1])==='('&&T[i+2]&&roh(code,T[i+2])==='0.062') add('feuerwerk','Raketenrohr CylinderGeometry(0.062',t);
    if(datei!==FW_BAUSTEIN&&L==='name'&&t.value==='MOERSER_R'&&lab(T[i+1])==='['&&lab(T[i-1])!=='.') add('feuerwerk','Moerserrohr MOERSER_R[',t);
    /* BAUKASTEN: Definitionen */
    if(datei==='04z-baukasten.js'||datei==='01b-material.js') continue;
    let name=null, start=-1;
    if(L==='function'&&lab(T[i+1])==='name'){ name=T[i+1].value; start=i+2; }
    else if((L==='const'||L==='let'||L==='var')&&lab(T[i+1])==='name'&&lab(T[i+2])==='='){
      /* nur Funktionen: const x=function / ()=> / x=>  */
      const n=T[i+3]; if(n&&(lab(n)==='function'||lab(n)==='('||lab(n)==='name'&&lab(T[i+4])==='=>')){ name=T[i+1].value; start=i+3; } }
    if(!name) continue;
    if(GELOESCHT.includes(name)){ add('bauteil','geloescht:'+name,t,{name}); continue; }
    const p=teile(name);
    const hits=bkAktiv.filter(b=>(b.namen||[]).includes(name)||p.some(x=>b.woerter.includes(x)));
    const texDup=TEXTUR_DUP.test(name);
    if(!hits.length&&!texDup) continue;
    /* Rumpf bestimmen: bis zur schliessenden Klammer des ersten { nach der Parameterliste,
       bei Pfeil ohne { bis ; oder , auf Tiefe 0 */
    let k=start, tiefe=0, rumpf0=-1, rumpf1=T.length-1;
    if(lab(T[k])==='function') k++;
    if(lab(T[k])==='name'&&lab(T[k+1])==='=>') k++;
    else{ if(lab(T[k])==='('){ let d=0; for(;k<T.length;k++){ const l=lab(T[k]); if(l==='(') d++; else if(l===')'){ d--; if(d===0){ k++; break; } } } } }
    if(lab(T[k])==='=>') k++;
    if(lab(T[k])==='{'){ rumpf0=k; for(;k<T.length;k++){ const l=lab(T[k]); if(l==='{'||l==='${') tiefe++; else if(l==='}'){ tiefe--; if(tiefe===0){ rumpf1=k; break; } } } }
    else{ rumpf0=k; for(;k<T.length;k++){ const l=lab(T[k]); if(l==='('||l==='['||l==='{'||l==='${') tiefe++; else if(l===')'||l===']'||l==='}') tiefe--; if(tiefe<0||(tiefe===0&&(l===';'||l===','))){ rumpf1=k; break; } } }
    let baut=false; const ruft=new Set();
    for(let m=rumpf0;m<=rumpf1&&m<T.length;m++){ const u=T[m];
      if(lab(u)==='name'&&u.value==='THREE'&&lab(T[m+1])==='.'&&T[m+2]&&BAU_KLASSE.test(T[m+2].value)&&lab(T[m-1])==='new') baut=true;
      if(lab(u)==='name'&&BAU_FN.has(u.value)&&lab(T[m+1])==='('&&lab(T[m-1])!=='.') baut=true;
      if(lab(u)==='name'&&u.value==='bk'&&lab(T[m+1])==='.'&&T[m+2]&&lab(T[m+3])==='(') ruft.add(T[m+2].value); }
    if(texDup&&baut){ add('bauteil','textur:'+name,t,{name}); continue; }
    for(const b of hits){ if(!baut) continue; if(ruft.has(b.bk)) continue;   /* Huelle um bk.<bauteil> = erlaubt */
      add('bauteil',b.bk+':'+name,t,{name}); }
  }
  return out;
}

/* bk-Eintraege aus 04z lesen */
function bkNamen(q){ const s=q['04z-baukasten.js']||''; return [...new Set([...s.matchAll(/^bk\.([A-Za-z_]\w*)\s*=/gm)].map(m=>m[1]))]; }

/* ---------- Gesamtscan -> Map "datei|art" -> {anzahl, werte{}, stellen[]} ---------- */
function scan(q){
  const bk=bkNamen(q), aktiv=BAUTEILE.filter(b=>bk.includes(b.bk));
  const meta=[]; const bekannt=new Set(BAUTEILE.map(b=>b.bk).concat(HELFER));
  for(const n of bk) if(!bekannt.has(n)) meta.push(`bk.${n} ist weder Bauteil (BAUTEILE mit Woertern) noch Helfer (HELFER) in tools/fundament/waechter.js - eintragen, damit der Waechter das neue Bauteil kennt`);
  const G=new Map();
  for(const f in q){ for(const s of scanDatei(f,q[f],aktiv)){
    if(s.art==='fehler'){ meta.push(f+': Quelltext nicht lesbar ('+s.text+')'); continue; }
    const key=s.art==='bauteil'?f+'|bauteil|'+s.wert:f+'|'+s.art;
    let e=G.get(key); if(!e){ e={datei:f,art:s.art,anzahl:0,werte:{},stellen:[]}; if(s.art==='bauteil') e.name=s.wert; G.set(key,e); }
    e.anzahl++; if(s.art!=='bauteil') e.werte[s.wert]=(e.werte[s.wert]||0)+1; e.stellen.push(s); } }
  return {G,meta,bk,aktiv:aktiv.map(b=>b.bk)};
}

/* ---------- Ausnahmeliste ---------- */
function ladeAusnahmen(){ if(!fs.existsSync(AUSNAHMEN)) return {ausnahmen:[]}; return JSON.parse(fs.readFileSync(AUSNAHMEN,'utf8')); }
const schl=e=>e.art==='bauteil'?e.datei+'|bauteil|'+e.name:e.datei+'|'+e.art;

function vergleiche(G,A,nur){
  const erlaubt=new Map(); for(const e of A.ausnahmen||[]) erlaubt.set(schl(e),e);
  const rot=[], schrumpf=[];
  const zeig=(e,n)=>e.stellen.slice(0,n||6).map(s=>`      ${e.datei}:${s.zeile}  ${s.wert}${s.bei&&s.bei!=='Text'?' (bei '+s.bei+')':''}  | ${s.text.slice(0,110)}`).join('\n');
  for(const [k,e] of G){ if(nur&&!nur.includes(e.art)) continue; const a=erlaubt.get(k);
    if(!a){ rot.push({art:e.art,text:`NEU  ${e.datei} ${e.art}${e.name?' '+e.name:''}: ${e.anzahl} Stelle(n) ohne Ausnahme\n${zeig(e)}`}); continue; }
    if(e.anzahl>a.anzahl){ rot.push({art:e.art,text:`MEHR ${e.datei} ${e.art}: ${e.anzahl} statt erlaubt ${a.anzahl}\n${zeig(e,8)}`}); continue; }
    if(a.werte&&e.art!=='bauteil'){ const neu=Object.keys(e.werte).filter(w=>!(w in a.werte)||e.werte[w]>a.werte[w]);
      if(neu.length){ rot.push({art:e.art,text:`WERT ${e.datei} ${e.art}: neue/haeufigere Werte ${neu.slice(0,8).join(', ')}\n`+e.stellen.filter(s=>neu.includes(s.wert)).slice(0,6).map(s=>`      ${e.datei}:${s.zeile}  ${s.wert}  | ${s.text.slice(0,110)}`).join('\n')}); continue; } }
    if(e.anzahl<a.anzahl) schrumpf.push(`${e.datei} ${e.art}${e.name?' '+e.name:''}: ${e.anzahl} statt ${a.anzahl}`); }
  for(const [k,a] of erlaubt){ if(nur&&!nur.includes(a.art)) continue; if(!G.has(k)) schrumpf.push(`${a.datei} ${a.art}${a.name?' '+a.name:''}: 0 statt ${a.anzahl} (Eintrag faellt weg)`); }
  return {rot,schrumpf};
}

/* ---------- Gruende fuer die Ausgangsliste (warum es heute noch so ist, welcher Schritt es aufloest) ---------- */
const GRUND=[
  [/^reuse-helpers\.js$/,'Altweg std()/Lambert-Austausch selbst (Grundlage von MAT)','bleibt, bis kein std() mehr gerufen wird'],
  [/^(03-scene|03b-post|03d-pracht|20-loop|05p-licht)\.js$/,'Licht, Himmel, Nebel, Nachbearbeitung, Pracht-Spiegel (Licht-/Leuchtfarben, angleichung.md §4; Pracht kopiert je Ort)','Licht-Paket (05p) / bleibt technisch'],
  [/^(reuse-pack|04-models|04b-pool)\.js$/,'Ware/Produktmodelle und Pools: Verpackung (frei) gemischt mit Hilfsmaterialien (glassMat, Etiketten, Karton-Texturen je Sorte)','Schritt Paletten/Kartons (Karton-Atlas) + glassMat -> MAT-Rezept'],
  [/^04z-baukasten\.js$/,'bk.schild: Material mit eigener Schildtextur (Cache je Text) - Textur kann nicht ueber MAT.std geteilt werden','MAT-Rezept mit Textur-Cache (Schritt Schilder)'],
  [/^05-world\.js$/,'Waende/Boeden/Himmel: wall() mit 6-Material-Array, Wand-/Bodenmaterialien','Schritt Waende (claude/fundament-waende)'],
  [/^(05b-ao|05c-buildworld)\.js$/,'Laden-Grundbau, Raum-AO, Deckenlampen (lampMats veraenderlich)','Schritte Lampen und Waende'],
  [/^05d-yard\.js$/,'Testfeld: Zuendtisch-Leuchten, Schilder, Warnstreifen','Schritte Schilder und Lampen'],
  [/^05e-street\.js$/,'Stadt/Strasse: Hausfassaden und Autos (bewusste Zufallsvielfalt, angleichung.md §4), Stadtmoebel stM und Haeuser hausKit (eigene Sammler), Stadtschilder','Fassade/Stadtmoebel (Umbauliste 8) und Zaeune/Poller (claude/fundament-waende)'],
  [/^05e2-laeden-innen\.js$/,'Laeden gegenueber: eigener gemalter Atlas inkl. Preistafeln als Deko (bewusst nicht angeglichen, angleichung.md §4)','bleibt Atlas; Farben beim Schritt Laeden gegenueber'],
  [/^05f-facade\.js$/,'Fassade: Fensterschmutz (grimeMats, veraenderlich), Fensterrahmen, Ladenschild','Umbauliste 8 Fassade/Fenster/Tueren'],
  [/^(05g-dock|05h-ausbau|05m-logistik|05l-eingang2)\.js$/,'Hof/Ausbau/Logistik: veraenderliche Materialien (Ampeln, Lampen, Bauwaende), Zaeune, Schiebetueren, Restfarben ohne Ton','Schritte Zaeune/Waende, Lampen, Tueren'],
  [/^(05j-stadt|05k-schoner|05n-park)\.js$/,'Skyline/Stadt/Park: eigene Sammler und Atlas, Wasser, Pflanzen','Aussenwelt-Paket (inventar-optik §5 letzte Zeile)'],
  [/^05o-oberflaechen\.js$/,'waehlbare Wand-/Bodenbelaege (Katalog mit Absicht verschieden)','bleibt Katalog; Malfarben bei Bedarf in MAT'],
  [/^06-fixtures\.js$/,'Regale, Kasse, Gitterbox, Regalschilder (Farben je Regal waehlbar, veraenderlich)','Schritt Regale (Umbauliste 7)'],
  [/^(06b-gravur|15b-pda|12-belt)\.js$/,'Geraete mit Display/Leuchten (Automat, Handgeraet, Kassenband)','Schritt Geraete (geraetBau ausbauen)'],
  [/^(07-deko|07b-wischer)\.js$/,'Deko (waehlbare Vielfalt), Wischer','Deko-Katalog (eigener Schritt)'],
  [/^08b-truck\.js$/,'LKW: Lieferanten-Hausfarben (Vielfalt), Lichter','Fahrzeuge (eigener Schritt)'],
  [/^(08-boxes|08d-karre|08e-kiste|08f-schild|11b-einraeumer)\.js$/,'Kartons, Karre, Kiste, Hervorhebungen','Schritt Paletten/Kartons (claude/fundament-kartons)'],
  [/^(09-people|09a-figuren|10-customers)\.js$/,'Figuren und Hervorhebung (bewusst nicht angeglichen, angleichung.md §4)','bleibt (Figuren-Schritt offen)'],
  [/^(11c-versand|11d-packmaterial|11e-palette)\.js$/,'Versand: Packmaterial-Regale (Karton-Texturen je Fach), Kran, Lampen, DDL-Schild, Telefon','Schritte Paletten/Kartons, Lampen, Schilder'],
  [/^14z4-abschuss\.js$/,'Abschuss-Baustein: Rohr-/Tischmaterialien noch ueber std()','MAT-Rezepte fuer Abschussgeraete (Feuerwerk-Mechanik)'],
  [/^(17-laptop|17b-fwtest|17e-gameplay|19-hud|19b-ziel|21-input|21b-handbuch|22-start|02b-markt|02c-erfolge|13-sound|13b-musik)\.js$/,'Bedienoberflaeche (HTML/CSS, Laptop, HUD, Handbuch) - noch keine UI-Palette','UI-Palette (eigener Schritt, mit Tom)'],
  [/^02-data\.js$/,'Kataloge: waehlbare Wand-/Bodenfarben, Schildfarben, Produktmotive','bleibt Katalog (Wahl des Spielers)'],
  [/.*/,'Ausgangsstand ohne Zuordnung','offen - beim naechsten Bauteil-Schritt klaeren']
];
const GRUND_GELD=[
  [/^(05e-street|05e2-laeden-innen|06-fixtures|17-laptop|15b-pda|06b-gravur)\.js$/,'Deko-Preise auf Schildern/Bildschirmen (Tafeln, Displays) - keine Spielwirtschaft','bleibt Deko; echte Preise kommen aus WIRT/S.prices'],
  [/^12-belt\.js$/,'Stueckelung der Euro-Muenzen/-Scheine (Realwelt, keine Stellschraube)','bleibt'],
  [/^17e-gameplay\.js$/,'Gameplay-Vorfuehrung: Startgeld/Preisaufschlag der Vorfuehrung (keine Spielwirtschaft, wirtschaft.md)','bleibt'],
  [/^19-hud\.js$/,'Geldanzeige-Animation (Schwellen fuer das Hochzaehlen)','bleibt (UI)'],
  [/^21b-handbuch\.js$/,'Handbuchtext nennt Betraege als Text','aus WIRT erzeugen (Balancing-Paket)'],
  [/^(02-data|02b-markt|02c-erfolge|02e-neuware)\.js$/,'Katalogwerte neben Geldnamen (Level, Mengen, Stufen) bzw. Sortenpreise ausserhalb des Produkteintrags','beim Balancing pruefen: Geld nach WIRT, Rest ist kein Geld'],
  [/.*/,'Zahl neben einem Geldnamen ausserhalb 01c (Ausgangsstand 14.10.)','beim Balancing pruefen: nach WIRT umziehen oder als Nicht-Geld begruenden']
];
const GRUND_FW=[[/^14q-klein-neu\.js$/,'Ersatzaufbau Bengalholz-Halter, wenn die Engine ohne Platz gerufen wird (Tests, die igniteType direkt zuenden) - wie ERSATZ in abschussregel.js','bleibt (Testhilfe)'],[/.*/,'Zuenden/Aufstellen ausserhalb des Abschuss-Bausteins','ueber abPlatz/abAufstellen/abZuenden (14z4)']];
const GRUND_BT=[
  [/^bk-sammler/,'eigener Sammler (Folgeschritt laut baukasten.md: Stadthaeuser hausKit/hzAdd, Stadtmoebel stM 05e, Stadt sammler() 05j)','auf bk.sammler umstellen (Aussenwelt/Fassade)'],
  [/^bk-schild/,'Schild mit eigener Canvas-Malerei (Regal-, Packplatz-, DDL-, Strassen-, Warnschild) statt bk.schild','Schritt Schilder (Schildatlas, Umbauliste 7/8)'],
  [/^bk-tor\|05j-stadt/,'Rolllaeden/Lamellen an Stadthaeusern (kein Ladetor, Stadt-Atlas)','Aussenwelt-Paket; dann bk.tor art roll oder eigener Atlas-Eintrag'],
  [/^bk-tor/,'Huelle/Teil am Tor, baut eigene Kleinteile','pruefen beim naechsten Tor-Schritt'],
  [/^bk-poller/,'Stadtpoller (Strasse) eigener Bau','Schritt Zaeune/Poller (claude/fundament-waende)'],
  [/^bk-/,'baut ein Bauteil, das es im Baukasten gibt, noch selbst','beim Schritt dieses Bauteils auf bk umstellen'],
  [/.*/,'eigene Textur/Bau','offen']];
function grundFuer(e){
  const tab=e.art==='geld'?GRUND_GELD:e.art==='feuerwerk'?GRUND_FW:e.art==='bauteil'?GRUND_BT:GRUND;
  const key=e.art==='bauteil'?'bk-'+e.name.split(':')[0]+'|'+e.datei:e.datei;
  for(const [re,g,s] of tab) if(re.test(e.art==='bauteil'?key:e.datei)) return {grund:g,schritt:s};
  return {grund:'',schritt:''};
}

function schreibeAusgangsliste(G,anlass){
  const A=ladeAusnahmen(), alt=new Map(); for(const e of A.ausnahmen||[]) alt.set(schl(e),e);
  const neuOhne=[], liste=[];
  const heute=new Date().toISOString().slice(0,10);
  for(const [k,e] of [...G].sort((a,b)=>a[0]<b[0]?-1:1)){
    const a=alt.get(k);
    const waechst=!a||e.anzahl>a.anzahl||(e.art!=='bauteil'&&a.werte&&Object.keys(e.werte).some(w=>!(w in a.werte)||e.werte[w]>a.werte[w]));
    if(waechst&&!anlass){ neuOhne.push(`${e.datei} ${e.art}${e.name?' '+e.name:''} (${a?a.anzahl+' -> ':''}${e.anzahl})`); continue; }
    const g=a&&!waechst?{grund:a.grund,schritt:a.schritt,anlass:a.anlass,seit:a.seit}:Object.assign(grundFuer(e),{anlass:waechst&&a?(a.anlass+' | '+heute+': '+anlass):anlass,seit:a?a.seit:heute});
    const x={datei:e.datei,art:e.art}; if(e.name) x.name=e.name; x.anzahl=e.anzahl;
    if(e.art!=='bauteil'){ const w={}; for(const v of Object.keys(e.werte).sort()) w[v]=e.werte[v]; x.werte=w; }
    Object.assign(x,g); liste.push(x); }
  if(neuOhne.length){ console.log('ABGELEHNT: neue oder groessere Ausnahmen brauchen eine Begruendung (--grund "...").\nBetroffen:\n  '+neuOhne.join('\n  ')+'\nBesser: Verstoss beheben (Baukasten/MAT/WIRT nutzen). Nur wenn es wirklich nicht geht: --grund "warum".'); process.exit(2); }
  const out={
    _lies_mich:['Schrumpfende Ausnahmeliste der Waechter (docs/fundament/stilregeln.md Abschnitt 9).',
      'Je Eintrag: Datei, Art, erlaubte Anzahl, erlaubte Werte, warum es heute noch so ist (grund), welcher Schritt es aufloest (schritt), warum es auf die Liste kam (anlass), seit wann.',
      'Neu schreiben: node tools/fundament/waechter.js --ausgangsliste [--grund "Anlass"] - kleiner werden darf sie immer, wachsen nur mit --grund.',
      'Die Laufzeit-Werte (laufzeit) schreibt src/tests/waechter.js mit BUDGET_SCHREIBEN=1 GRUND="...".'],
    stand:gitStand(),
    frei:FREI.map(r=>({dateien:String(r.dateien),arten:r.arten,grund:r.grund})),
    ausnahmen:liste,
    laufzeit:A.laufzeit||null };
  fs.writeFileSync(AUSNAHMEN,jsonZeilen(out));
  const vorher=(A.ausnahmen||[]).reduce((s,e)=>s+e.anzahl,0), nachher=liste.reduce((s,e)=>s+e.anzahl,0);
  console.log(`Ausnahmeliste geschrieben: ${liste.length} Eintraege, ${nachher} Stellen (vorher ${(A.ausnahmen||[]).length} / ${vorher}).`);
}
/* JSON mit einem Eintrag je Zeile (lesbar, mergebar) */
function jsonZeilen(o){
  const teil=[]; for(const k of Object.keys(o)){ const v=o[k];
    if(k==='ausnahmen') teil.push('  "ausnahmen": [\n'+v.map(e=>'    '+JSON.stringify(e)).join(',\n')+'\n  ]');
    else if(k==='laufzeit'&&v) teil.push('  "laufzeit": '+JSON.stringify(v,null,2).replace(/\n/g,'\n  '));
    else teil.push('  '+JSON.stringify(k)+': '+JSON.stringify(v)); }
  return '{\n'+teil.join(',\n')+'\n}\n';
}
function gitStand(){ try{ return cp.execSync('git -C '+JSON.stringify(WURZEL)+' log -1 --format="%h %cd" --date=short',{encoding:'utf8'}).trim(); }catch(e){ return '?'; } }

/* ---------- Snapshot der Wirtschaft ---------- */
function snapshot(wurzel){
  const args=[path.join(__dirname,'wirtschaft-snapshot.js')]; if(wurzel) args.push('--wurzel',wurzel);
  const r=cp.spawnSync(process.execPath,args,{encoding:'utf8',cwd:WURZEL});
  const txt=(r.stdout||'')+(r.stderr||'');
  return {ok:r.status===0&&/GLEICH/.test(txt),txt:txt.trim().split('\n').slice(0,12).join('\n')};
}

/* ---------- Ausgabe ---------- */
function bericht(q,opt){
  opt=opt||{}; const nur=opt.nur;
  const {G,meta,aktiv}=scan(q), A=ladeAusnahmen();
  const {rot,schrumpf}=vergleiche(G,A,nur);
  const zeilen=[]; const zaehl=a=>{ let n=0,f=0; for(const e of G.values()) if(e.art===a){ n+=e.anzahl; f++; } return n+' Stellen in '+f+(a==='bauteil'?' Funktionen':' Dateien'); };
  if(!opt.still) console.log(`Waechter Fundament (Node) - ${gitStand()} - Ausnahmeliste ${A.stand||'fehlt'} (${(A.ausnahmen||[]).length} Eintraege)`);
  for(const a of ARTEN){ if(nur&&!nur.includes(a)) continue; const r=rot.filter(x=>x.art===a);
    zeilen.push(`  ${a.toUpperCase().padEnd(10)} ${r.length?'ROT ('+r.length+')':'gruen'}   ${zaehl(a)} (Ausnahmen)${a==='bauteil'?' - Bauteile aktiv: '+aktiv.join(', '):''}`); }
  let snap=null; if(!nur||nur.includes('snapshot')){ snap=opt.snapWurzel!==undefined?snapshot(opt.snapWurzel):snapshot(); zeilen.push(`  SNAPSHOT   ${snap.ok?'gruen':'ROT'}   wirtschaft-snapshot.js ${snap.ok?'GLEICH':'weicht ab'}`); }
  if(!opt.still){ console.log(zeilen.join('\n'));
    if(meta.length) console.log('\nBAUKASTEN-META ROT:\n  '+meta.join('\n  '));
    if(rot.length) console.log('\nNEUE VERSTOESSE (beheben: Baukasten/MAT/WIRT nutzen, stilregeln.md §9):\n'+rot.map(r=>'  '+r.text).join('\n'));
    if(snap&&!snap.ok) console.log('\nSNAPSHOT:\n'+snap.txt+'\n  -> absichtlich? node tools/fundament/wirtschaft-snapshot.js --schreiben und im Bericht begruenden (stilregeln.md §8)');
    if(schrumpf.length) console.log('\nLISTE SCHRUMPFEN (weniger Verstoesse als erlaubt - Gewinn festschreiben):\n  '+schrumpf.slice(0,30).join('\n  ')+(schrumpf.length>30?'\n  ... '+(schrumpf.length-30)+' weitere':'')+'\n  -> node tools/fundament/waechter.js --ausgangsliste'); }
  const fehler=rot.length+meta.length+(snap&&!snap.ok?1:0)+schrumpf.length;
  if(!opt.still) console.log(fehler?`\nROT: ${rot.length} neue Verstoesse, ${meta.length} Baukasten-Meta, ${schrumpf.length} zu schrumpfen${snap&&!snap.ok?', Snapshot weicht ab':''}`:'\nALLES OK: keine neuen Verstoesse, Ausnahmeliste aktuell, Wirtschaft gleich');
  return {fehler,rot,meta,schrumpf,snap,G};
}

/* ---------- Gegenprobe: je Waechter einen Verstoss einbauen, Rot erwarten ---------- */
function gegenprobe(){
  const basis=quellen(WURZEL);
  const proben=[
    ['material','05h-ausbau.js','\nconst __gp1=()=>new THREE.MeshStandardMaterial({roughness:0.5});\n'],
    ['std','05h-ausbau.js','\nconst __gp2=()=>std(0x123456,{roughness:0.5});\n'],
    ['hex','05h-ausbau.js','\nconst __gp3=0x123457;\n'],
    ['css','05h-ausbau.js',"\nconst __gp4='#123458';\n"],
    ['geld','16-day.js','\nfunction __gp5(){ S.money-=37; }\n'],
    ['feuerwerk','17b-fwtest.js','\nfunction vfAltesModell(t){ return raketeModell(t); }\n'],
    ['bauteil','05h-ausbau.js','\nfunction rolltorBauen(){ const m=new THREE.Mesh(new THREE.BoxGeometry(3,3,0.1),MAT.get(\'lackGraphit\')); return m; }\n'],
    ['bauteil','05g-dock.js','\nfunction torPanelMat(){ return null; }\n']
  ];
  let ok=0, n=0;
  const r0=bericht(basis,{still:true,nur:ARTEN});
  console.log(`Ausgangslage: ${r0.fehler?'ROT ('+r0.fehler+') - Gegenprobe nur auf gruenem Stand aussagekraeftig':'gruen'}`);
  for(const [art,datei,code] of proben){ n++;
    const q=Object.assign({},basis); q[datei]=q[datei]+code;
    const r=bericht(q,{still:true,nur:[art]}); const an=r.rot.some(x=>x.art===art);
    if(an) ok++; console.log(`  GEGENPROBE ${n} ${art.padEnd(9)} ${datei}: ${an?'schlaegt an - richtig':'schlaegt NICHT an - Waechter blind'}${an?'  ('+r.rot.find(x=>x.art===art).text.split('\n')[0].trim()+')':''}`); }
  /* Wert getauscht (Anzahl gleich): eine erlaubte Hex-Farbe durch eine neue ersetzt */
  { n++; const q=Object.assign({},basis); const e=[...scan(basis).G.values()].find(x=>x.datei==='05h-ausbau.js'&&x.art==='hex');
    const st=e.stellen[0], zl=q['05h-ausbau.js'].split('\n'); zl[st.zeile-1]=zl[st.zeile-1].replace(new RegExp(st.wert,'i'),'0x12345a'); q['05h-ausbau.js']=zl.join('\n');
    const r=bericht(q,{still:true,nur:['hex']}); const an=r.rot.some(x=>x.art==='hex'&&/^WERT/.test(x.text)); if(an) ok++;
    console.log(`  GEGENPROBE ${n} hex-wert  05h-ausbau.js:${st.zeile} ${st.wert} -> 0x12345a: ${an?'schlaegt an - richtig':'schlaegt NICHT an'}`); }
  /* Liste schrumpft: ein Verstoss behoben, Liste nicht nachgezogen -> Rot "Liste schrumpfen" */
  { n++; const q=Object.assign({},basis); const e=[...scan(basis).G.values()].find(x=>x.datei==='05h-ausbau.js'&&x.art==='material');
    const st=e.stellen[0], zl=q['05h-ausbau.js'].split('\n'); zl[st.zeile-1]=zl[st.zeile-1].replace(/new THREE\.Mesh\w*Material\(/,'MAT.neu_gp('); q['05h-ausbau.js']=zl.join('\n');
    const r=bericht(q,{still:true,nur:['material']}); const an=r.schrumpf.length>0&&r.fehler>0; if(an) ok++;
    console.log(`  GEGENPROBE ${n} schrumpf  05h-ausbau.js:${st.zeile} Material entfernt: ${an?'meldet "Liste schrumpfen" - richtig':'meldet nichts'}`); }
  /* Baukasten-Meta: neues bk.<x> ohne Eintrag */
  { n++; const q=Object.assign({},basis); q['04z-baukasten.js']+= '\nbk.foerderturm=function(o){ return null; };\n';
    const r=bericht(q,{still:true,nur:['bauteil']}); const an=r.meta.length>0; if(an) ok++;
    console.log(`  GEGENPROBE ${n} bk-meta   04z-baukasten.js: ${an?'schlaegt an - richtig ('+r.meta[0].slice(0,70)+'...)':'schlaegt NICHT an'}`); }
  /* Snapshot: Kopie des Quelltexts, DDL-Pauschale 39 -> 40 */
  { n++; const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'waechter-gp-'));
    fs.mkdirSync(path.join(tmp,'src/parts'),{recursive:true}); fs.copyFileSync(path.join(WURZEL,'src/build.sh'),path.join(tmp,'src/build.sh'));
    for(const f in basis){ let s=basis[f]; if(f==='01c-wirtschaft.js'){ const v=s.replace(/pauschale:\s*39\b/,'pauschale:40'); if(v===s) console.log('  (Gegenprobe Snapshot: Stelle pauschale:39 nicht gefunden)'); s=v; } fs.writeFileSync(path.join(tmp,'src/parts',f),s); }
    const s=snapshot(tmp); const an=!s.ok; if(an) ok++;
    console.log(`  GEGENPROBE ${n} snapshot  01c DDL-Pauschale 39->40: ${an?'schlaegt an - richtig ('+(s.txt.split('\n').find(l=>/ABWEICHUNG/.test(l))||'').slice(0,80)+')':'schlaegt NICHT an'}`);
    fs.rmSync(tmp,{recursive:true,force:true}); }
  /* Ausnahmeliste waechst nicht ohne Begruendung */
  { n++; const q=Object.assign({},basis); q['05h-ausbau.js']+='\nconst __gp9=()=>new THREE.MeshStandardMaterial({});\n';
    const {G}=scan(q);
    const alt=new Map(); for(const e of (ladeAusnahmen().ausnahmen||[])) alt.set(schl(e),e);
    const waechst=[...G].some(([k,e])=>{ const a=alt.get(k); return !a||e.anzahl>a.anzahl; });
    if(waechst) ok++; console.log(`  GEGENPROBE ${n} liste     --ausgangsliste ohne --grund bei neuem Verstoss: ${waechst?'wuerde abgelehnt - richtig':'NICHT erkannt'}`); }
  console.log(ok===n?`GEGENPROBE: alle ${n} Waechter schlagen an`:`GEGENPROBE: ${n-ok} von ${n} blind`);
  process.exit(ok===n?0:1);
}

/* ---------- Haupt ---------- */
if(require.main===module){
  const a=process.argv.slice(2); const hat=x=>a.includes(x); const wert=x=>{ const i=a.indexOf(x); return i>=0?a[i+1]:null; };
  if(hat('--gegenprobe')) gegenprobe();
  else if(hat('--ausgangsliste')){ const {G}=scan(quellen(WURZEL)); schreibeAusgangsliste(G,wert('--grund')); }
  else if(hat('--liste')){ const d=wert('--liste'), art=a[a.indexOf('--liste')+2]; const {G}=scan(quellen(WURZEL));
    for(const e of G.values()) if(e.datei===d&&(!art||e.art===art)) for(const s of e.stellen) console.log(`${e.datei}:${s.zeile}\t${e.art}\t${s.wert}\t${s.text}`); }
  else { const nur=wert('--nur'); const r=bericht(quellen(WURZEL),{nur:nur?nur.split(','):null}); process.exit(r.fehler?1:0); }
}
module.exports={scan,quellen,scanDatei,FW_FN,FW_BAUSTEIN,BAUTEILE,HELFER,GELOESCHT,FREI};
