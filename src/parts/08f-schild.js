/* =========================================================
   Regalschild beschriften (Tom, 03.10.: "dass man die einzelnen Regale
   auch umbenennen kann ... an die Regale gehen und umbenennen, wenn man
   da XXL Fontaene oder irgendwas anderes schreiben will").
   L (Handy: Knopf "Schild") vor einem Regal oeffnet das Eingabefeld.
   Leer lassen bzw. "Automatisch" setzt wieder die Warengruppe ein.
   Das Schild bleibt im Speicherstand.
   ========================================================= */
const SCHILD_MAX=24;
let schildOpen=false, schildSh=null;
function schildZiel(){ const t=target; return t&&t.kind==='level'&&t.ref&&t.ref.sh?t.ref.sh:null; }
function schildAuto(sh){ const b=headArt(sh); return b!==null?HEADNAME[b][0]:''; }
function schildTaste(){
  if(!S||overlayOpen()) return;
  const sh=schildZiel();
  if(!sh){ toast(`Stell dich vor ein Regal und schau es an – dann ${COARSE?'„Schild“':'L'} drücken.`,'bad'); return; }
  schildSh=sh; schildOpen=true;
  const inp=$('schildIn'); inp.value=sh.schild||''; inp.placeholder=schildAuto(sh)||'z. B. XXL-Fontänen';
  $('schildOv').classList.add('show');
  for(const k in keys) keys[k]=false; mouseDown=false; touchAct=false;
  if(locked) document.exitPointerLock();
  setTimeout(()=>{ try{ inp.focus(); inp.select(); }catch(e){} },60);
}
/* ok: uebernehmen, auto: zurueck zur Warengruppe, sonst abbrechen */
function schildFertig(art){
  const sh=schildSh; $('schildOv').classList.remove('show'); schildOpen=false; schildSh=null;
  if(sh&&art){
    const txt=art==='auto'?'':($('schildIn').value||'').replace(/\s+/g,' ').trim().slice(0,SCHILD_MAX);
    if(txt) sh.schild=txt; else delete sh.schild;
    updateHead(sh); sfx.pop();
    toast(txt?`Regalschild: „${txt}“`:'Regalschild zeigt wieder die Warengruppe.');
    if(!sh.vp) save();
  }
  requestLock();
}
