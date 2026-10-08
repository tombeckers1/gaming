/* =========================================================
   Mehrwegkisten (Tom, 03.10.: "fuer wenig Geld eine Kiste kaufen und
   die Produkte da rein tun ... wenn man was eingeraeumt hat, was einem
   nicht gefaellt, in diese Kiste einraeumen, dann hat man die Kiste in
   der Hand wie im Supermarkt-Simulator ... mit einer Taste aktivieren
   und dann woanders einraeumen. Sonst kann man, was einmal eingeraeumt
   ist, nicht wieder zurueckholen.")
   - Laptop > Einrichtung: Mehrwegkisten, fuenf Stueck fuer 10 EUR.
   - X (Handy: Knopf "Kiste") nimmt eine leere Kiste in die Hand bzw.
     stellt die leere wieder weg.
   - Leere Kiste oder Kiste "ausraeumen" auf ein Fach: Aktion nimmt die
     Ware vorn heraus, gedrueckt halten raeumt weiter aus. In eine Kiste
     passt so viel wie in einen Karton der Sorte.
   - Mit Ware drin ist die Kiste ein Karton wie jeder andere: einraeumen,
     abstellen, aufheben, ins Lagerregal, auf die Karre. Leer geraeumt
     bleibt sie in der Hand statt im Muell.
   - X mit voller Kiste schaltet zwischen "ausraeumen" und "einraeumen"
     (zurueck in ein Fach mit derselben Sorte).
   ========================================================= */
const KISTE_STUECK=5;
let _kisteMat=null;
/* blaue Kunststoffkiste: Rippen, Griffloch, Aufdruck MEHRWEG */
function kisteMat(){
  if(_kisteMat) return _kisteMat;
  _kisteMat=new THREE.MeshStandardMaterial({roughness:0.55,metalness:0,map:tex(256,256,(g,W,H)=>{
    g.fillStyle='#1f5fae'; g.fillRect(0,0,W,H);
    g.fillStyle='rgba(255,255,255,.08)'; for(let x=10;x<W;x+=22) g.fillRect(x,18,8,H-36);
    g.fillStyle='rgba(0,0,0,.22)'; for(let x=10;x<W;x+=22) g.fillRect(x+8,18,3,H-36);
    g.fillStyle='#174a88'; g.fillRect(0,0,W,16); g.fillRect(0,H-16,W,16);
    g.fillStyle='#0e2d55'; g.beginPath(); g.roundRect?g.roundRect(W/2-46,30,92,26,12):g.rect(W/2-46,30,92,26); g.fill();
    g.fillStyle='rgba(255,255,255,.85)'; g.font=BUN(30); g.textAlign='center'; g.textBaseline='middle'; g.fillText('MEHRWEG',W/2,H*0.62); })});
  return _kisteMat;
}
function kisteKap(t){ return Math.max(1,(P[t]&&P[t].box)|0); }
/* Taste X / Knopf: leere Kiste nehmen oder wegstellen, volle umschalten */
function kisteTaste(){
  if(!S) return;
  if(typeof hubAn==='function'&&hubAn()){ toast('Beide Hände am Hubwagen.','bad'); return; }
  if(S.kisteHand){ S.kisteHand=false; S.kisten=(S.kisten|0)+1; sfx.pop(); toast(`Leere Kiste weggestellt (${S.kisten} im Vorrat).`); updateCarry(); return; }
  const c=S.carrying;
  if(c&&c.kiste){ c.raus=!c.raus; sfx.pop(); toast(c.raus?'Kiste: ausräumen – Aktion nimmt Ware aus dem Fach.':'Kiste: einräumen – Aktion legt Ware ins Fach.'); updateCarry(); return; }
  if(c){ toast('Du trägst schon etwas. Erst abstellen.','bad'); return; }
  if((S.kisten|0)<=0){ toast('Keine leere Kiste da. Im Laptop unter Einrichtung: Mehrwegkisten.','bad'); return; }
  S.kisten--; S.kisteHand=true; sfx.pop();
  toast(`Leere Kiste in der Hand: Aktion auf ein Fach nimmt die Ware heraus. ${COARSE?'Knopf „Kiste“':'X'} stellt sie weg.`);
  updateCarry();
}
/* Darf aus diesem Fach in die Kiste genommen werden? */
function kannRaus(lv){
  if(!S||!lv||!lv.type||lv.count<=0) return false;
  if(S.kisteHand&&!S.carrying) return true;
  const c=S.carrying; return !!(c&&c.kiste&&c.raus&&c.type===lv.type&&c.count<kisteKap(c.type));
}
/* Ein Stueck vorn aus dem Fach in die Kiste */
function kisteRaus(lv,quiet){
  if(!kannRaus(lv)){
    const c=S.carrying;
    if(!quiet&&c&&c.kiste&&c.raus){
      if(c.type===lv.type) toast(`Die Kiste ist voll (${c.count}).`,'bad');
      else toast(`Die Kiste steht auf ausräumen (${P[c.type].short} drin). ${COARSE?'„Kiste“':'X'} schaltet auf einräumen.`,'bad'); }
    return false; }
  const t=lv.type, q=lv.q||1;
  removeFromLevel(lv);
  if(S.kisteHand){ S.kisteHand=false; S.carrying={type:t,count:1,q,kiste:true,raus:true}; }
  else { const c=S.carrying; c.q=((c.q||1)*c.count+q)/(c.count+1); c.count++; }
  sfx.pop(); updateCarry(); return true;
}
/* Karton oder Kiste leer: der Karton kommt weg, die Kiste bleibt in der Hand */
function kartonLeer(c,text){
  S.carrying=null;
  if(c&&c.kiste){ S.kisteHand=true; toast('Kiste leer – sie bleibt in der Hand.'); }
  else toast(text||'Karton leer und entsorgt.');
}
/* Kiste, die ein Mitarbeiter oder der Versand leer gemacht hat, kommt in den Vorrat */
function kisteZurueck(b){ if(b&&b.kiste&&S) S.kisten=(S.kisten|0)+1; }
