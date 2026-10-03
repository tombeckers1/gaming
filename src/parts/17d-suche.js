/* =========================================================
   Produktsuche im Laptop (Tom, 03.10.: "beim Bestellen und bei Preise und
   Markt eine Suche ... gibt man STU ein, ploppt schon Sturmfeuerzeug auf
   und man kann draufklicken, wie bei Amazon - fuer den Spielflow").
   - Suchfeld oben in "Bestellen" (Ware) und "Preise & Markt"
   - schon ab einem Buchstaben Vorschlaege (Wortanfaenge zuerst),
     Klick oder Enter nimmt den ersten, die Liste zeigt dann nur ihn
   - die Liste filtert beim Tippen sofort mit; Umlaute egal (stu = Stu,
     gluhwein = Glühwein), mehrere Woerter muessen alle passen
   - gesucht wird ueber alle Sparten, der Spartenfilter gilt nur ohne Suche
   - Esc schliesst erst die Vorschlaege, dann leert es das Feld
   ========================================================= */
let lsuche='', _sucheIdx=-1;
function sucheNorm(s){ return String(s||'').toLowerCase().replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ß/g,'ss').normalize('NFD').replace(/[̀-ͯ]/g,''); }
const _sucheCache={};
/* [Name/Kurzname/Packungstitel, Packungszusatz] - der Zusatz ("12 Stück")
   zaehlt nur nachrangig */
function sucheText(t){ if(_sucheCache[t]) return _sucheCache[t]; const p=P[t]||{}, a=p.art||{}; return _sucheCache[t]=[sucheNorm([p.name,p.short,a.title].join(' · ')),sucheNorm(a.sub||'')]; }
/* 0 = passt nicht; sonst Rang (hoeher = besser): Wortanfang vor Wortmitte,
   Anfang des Namens am besten */
function sucheRang(t,q){
  q=sucheNorm(q).trim(); if(!q) return 1;
  const [s,z]=sucheText(t); let r=0;
  for(const w of q.split(/\s+/)){ const i=s.indexOf(w);
    if(i<0){ if(z.indexOf(w)<0) return 0; r+=0.5; continue; }
    r+=i===0?6:/[\s·\-»«(,&/]/.test(s[i-1])?4:1; }
  return r;
}
function sucheEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
/* Treffer fett: der Anfang, der zur Eingabe passt */
function sucheFett(name,q){
  const n=sucheNorm(name), w=sucheNorm(q).trim().split(/\s+/)[0]; const i=w?n.indexOf(w):-1;
  if(i<0) return sucheEsc(name);
  return sucheEsc(name.slice(0,i))+'<b>'+sucheEsc(name.slice(i,i+w.length))+'</b>'+sucheEsc(name.slice(i+w.length));
}
function sucheFeld(platzhalter){
  return `<div class="lsuche"><span class="lslupe">⌕</span><input id="lSuche" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${platzhalter}" value="${sucheEsc(lsuche)}">`+
    `<button data-a="lsuchex" class="lsx" aria-label="Suche leeren"${lsuche?'':' style="display:none"'}>✕</button><div id="lVorschlag" class="lvorschlag"></div></div>`+
    `<div id="lKein" class="row" style="display:none"><div class="rm"><b>Nichts gefunden.</b><small>Anders schreiben oder weniger Buchstaben – gesucht wird in Name, Kurzname und Packungstext.</small></div></div>`;
}
/* Liste filtern: Suche schlaegt den Spartenfilter */
function sucheAnwenden(body){
  if(!body) return;
  const q=lsuche.trim(); let n=0;
  body.querySelectorAll('[data-ware]').forEach(el=>{
    const t=el.dataset.ware, sp=el.dataset.sparte;
    const zeig=q?sucheRang(t,q)>0:(!sp||lkat==='alle'||sp===lkat);
    el.style.display=zeig?'':'none'; if(zeig) n++; });
  /* Gruppenueberschriften nur, wenn darunter etwas sichtbar ist */
  body.querySelectorAll('.kgruppe[data-gr]').forEach(k=>{ let el=k.nextElementSibling, sicht=false;
    while(el&&!el.classList.contains('kgruppe')){ if(el.dataset.ware&&el.style.display!=='none'){ sicht=true; break; } el=el.nextElementSibling; }
    k.style.display=sicht?'':'none'; });
  const kein=body.querySelector('#lKein'); if(kein) kein.style.display=q&&!n?'':'none';
  body.querySelectorAll('.kfilter button').forEach(b=>b.classList.toggle('aus',!!q));
  const x=body.querySelector('.lsx'); if(x) x.style.display=q?'':'none';
}
function sucheVorschlaege(body){
  const box=body&&body.querySelector('#lVorschlag'); if(!box) return;
  const q=lsuche.trim();
  if(!q){ box.innerHTML=''; box.classList.remove('an'); return; }
  const seen=new Set(), L=[];
  body.querySelectorAll('[data-ware]').forEach(el=>{ const t=el.dataset.ware; if(seen.has(t)) return; seen.add(t); const r=sucheRang(t,q); if(r>0) L.push([r,t]); });
  L.sort((a,b)=>b[0]-a[0]||P[a[1]].name.length-P[b[1]].name.length||P[a[1]].name.localeCompare(P[b[1]].name));
  const top=L.slice(0,8);
  if(!top.length){ box.innerHTML=''; box.classList.remove('an'); return; }
  if(_sucheIdx>=top.length) _sucheIdx=top.length-1;
  box.innerHTML=top.map(([r,t],i)=>`<button data-a="lsuchepick" data-t="${t}" class="${i===_sucheIdx?'sel':''}"><span>${sucheFett(P[t].name,q)}</span><small>${sucheEsc(SPARTE_NAME[sparteVon(t)]||'')} · ${eur(S.prices[t]!=null?S.prices[t]:marketOf(t))}</small></button>`).join('');
  box.classList.add('an');
}
/* Vorschlag gewaehlt: nur noch dieses Produkt, kurz hervorheben */
function sucheNimm(body,t){
  lsuche=P[t].name; _sucheIdx=-1;
  const inp=body.querySelector('#lSuche'); if(inp){ inp.value=lsuche; inp.blur(); }
  const box=body.querySelector('#lVorschlag'); if(box){ box.innerHTML=''; box.classList.remove('an'); }
  sucheAnwenden(body);
  const el=body.querySelector(`[data-ware="${t}"]`);
  if(el){ el.classList.remove('treffer'); void el.offsetWidth; el.classList.add('treffer'); try{ el.scrollIntoView({block:'nearest',behavior:'smooth'}); }catch(e){} }
}
/* nach jedem Neuzeichnen: Feld verdrahten, Filter wieder anwenden, Fokus halten */
function sucheBinden(body,hatteFokus,caret){
  const inp=body&&body.querySelector('#lSuche'); if(!inp) return;
  sucheAnwenden(body);
  /* Klick auf einen Vorschlag darf das Feld nicht erst verlassen */
  const box0=body.querySelector('#lVorschlag'); if(box0) box0.addEventListener('mousedown',e=>e.preventDefault());
  inp.addEventListener('input',()=>{ lsuche=inp.value; _sucheIdx=0; sucheAnwenden(body); sucheVorschlaege(body); });
  inp.addEventListener('focus',()=>{ if(lsuche) sucheVorschlaege(body); });
  inp.addEventListener('blur',()=>setTimeout(()=>{ const box=body.querySelector('#lVorschlag'); if(box&&document.activeElement!==inp){ box.classList.remove('an'); } },180));
  inp.addEventListener('keydown',e=>{
    e.stopPropagation();
    const box=body.querySelector('#lVorschlag'), btns=box?[...box.querySelectorAll('button')]:[];
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); if(!btns.length) return; _sucheIdx=(_sucheIdx+(e.key==='ArrowDown'?1:-1)+btns.length)%btns.length; btns.forEach((b,i)=>b.classList.toggle('sel',i===_sucheIdx)); }
    else if(e.key==='Enter'){ e.preventDefault(); const b=btns[Math.max(0,_sucheIdx)]; if(b) sucheNimm(body,b.dataset.t); else inp.blur(); }
    else if(e.key==='Escape'){ e.preventDefault(); if(box&&box.classList.contains('an')){ box.classList.remove('an'); } else if(inp.value){ inp.value=''; lsuche=''; sucheAnwenden(body); } else inp.blur(); }
  });
  if(hatteFokus){ inp.focus(); try{ inp.setSelectionRange(caret,caret); }catch(e){} }
}
