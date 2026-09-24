/* =========================================================
   Westrampen im Betrieb.

   Bisher gab es genau einen LKW an genau einer Rampe: solange der
   an der Basisrampe stand, wartete jede weitere Bestellung. Die
   drei Tore in der Westhalle waren reine Kulisse.

   Jetzt sind sie einzeln zukaufbar. Eine gekaufte Andockstation
   nimmt eine Lieferung parallel zur Basisrampe an: der Auflieger
   setzt zurueck, das Tor faehrt hoch, und der Fahrer stapelt die
   Kartons in der Halle ab. Abholen und einraeumen bleibt deine
   Arbeit - die Station spart das Ausladen, nicht den Weg.

   Die Basisrampe bleibt unveraendert die begehbare: dort steigt
   man in den Laderaum. Der Code dafuer liegt in 08b und wird hier
   nicht angefasst.
   ========================================================= */
const WBAY_UP=['rampe2','rampe3','rampe4','rampe5'];  /* je Tor eine Ausbaustufe */
const WBAY_TAKT=1.9;                          /* Sekunden je Karton      */
const wbays=[null,null,null,null];

/* Wie viele Lieferungen gleichzeitig laufen koennen: die Basisrampe
   plus jede gekaufte Andockstation. */
function dockPlaetze(){
  let n=1;
  for(const id of WBAY_UP) if(S&&S.up&&S.up[id]) n++;
  return n;
}
/* Das Tor muss gekauft sein und in der stehenden Halle auch existieren */
function wbayOffen(i){ return !!(S&&S.up&&S.up[WBAY_UP[i]]&&zoneOffen('lager_west')&&typeof logiStufe==='function'&&logiStufe()>=TOR_STUFE[i]); }
/* Erste freie, gekaufte Rampe - oder -1 */
function wbayFrei(){
  for(let i=0;i<wbays.length;i++) if(wbayOffen(i)&&!wbays[i]) return i;
  return -1;
}
/* Abstellplatz fuer den n-ten Karton dieser Rampe: drei nebeneinander,
   drei uebereinander, dann eine Reihe weiter in die Halle hinein
   (nach Norden, die Tore stehen in der Suedwand). */
function wbaySlot(cx,n){
  const Z=LHALLE.z+1.7;
  const reihe=n%3, stapel=Math.floor(n/3)%3, tief=Math.floor(n/9);
  return {x:cx-0.95+reihe*0.95, y:0.2+stapel*0.41, z:Z+tief*1.05, ry:Math.PI/2+rand(-0.08,0.08)};
}
/* Torblatt einer Rampe auf Stellung t (0 zu, 1 offen) */
function wtorSet(i,t){
  const T=WTORE[i]; if(!T) return;
  T.t=clamp(t,0,1);
  T.blatt.position.y=T.zu+(T.auf-T.zu)*T.t;
  if(T.gruen) T.gruen.emissiveIntensity=T.t>0.9?1.4:0;
  if(T.rot)   T.rot.emissiveIntensity=T.t>0.9?0:1.2;
}
/* Eine Lieferung an eine Westrampe schicken */
function spawnWTruck(i,cargo,supId,supName){
  const T=WTORE[i]; if(!T||wbays[i]) return false;
  const farbe=TRUCKCOL[supId]||TRUCKCOL.mertens;
  /* Der Auflieger setzt von Sueden aus dem Hof an die Suedwand zurueck,
     das Heck zeigt nach Norden */
  const zielZ=LHALLE.z-0.05-13.2/2;           /* Heck buendig an der Wand */
  const g=abstellAuflieger(T.x,zielZ-8,Math.PI/2,supName||'Lieferung',farbe,true);
  wbays[i]={g,cargo:cargo.slice(),zielZ,x:T.x,state:'anfahrt',t:0,n:0,name:supName};
  toast(`${supName} setzt an Tor ${i+2}.`);
  return true;
}
function wbayRaeumen(i){
  const b=wbays[i]; if(!b) return;
  scene.remove(b.g); wbays[i]=null; wtorSet(i,0);
}
/* Laeuft mit der Hauptschleife */
function updateWBays(dt){
  for(let i=0;i<wbays.length;i++){
    const b=wbays[i]; if(!b) continue;
    if(b.state==='anfahrt'){
      const d=b.zielZ-b.g.position.z;
      b.g.position.z+=clamp(d*0.9,0.6,3.0)*dt;
      if(d<=0.04){ b.g.position.z=b.zielZ; b.state='toroeffnen'; b.t=0; }
    } else if(b.state==='toroeffnen'){
      b.t+=dt/2.2; wtorSet(i,b.t);
      if(b.t>=1){ b.state='entladen'; b.t=0;
        toast(`Tor ${i+2} ist offen, ${b.cargo.length} Karton${b.cargo.length===1?'':'s'} kommen herein.`); }
    } else if(b.state==='entladen'){
      b.t-=dt;
      if(b.t<=0){
        b.t=WBAY_TAKT;
        const c=b.cargo.shift();
        if(c) spawnFloorBox(c.type,P[c.type].box,wbaySlot(b.x,b.n++),c.q||1);
        if(!b.cargo.length){ b.state='torzu'; b.t=1;
          toast(`Tor ${i+2}: abgeladen. Die Kartons stehen in der Logistikhalle.`,'money'); }
      }
    } else if(b.state==='torzu'){
      b.t-=dt/2.2; wtorSet(i,Math.max(0,b.t));
      if(b.t<=0){ b.state='abfahrt'; b.t=0; }
    } else if(b.state==='abfahrt'){
      b.g.position.z-=Math.min(7,3+b.t*6)*dt; b.t+=dt;
      /* am Suedzaun ist Schluss: dort biegt er ab und ist weg */
      if(b.g.position.z<LAY.hof2.z0+7) wbayRaeumen(i);
    }
  }
}
/* Nach dem Laden eines Spielstands: Tore stehen zu */
function wbaysInit(){ for(let i=0;i<wbays.length;i++){ wbayRaeumen(i); wtorSet(i,0); } }
