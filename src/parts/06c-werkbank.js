/* =========================================================
   Werkbank im Lager (Kapitel 5 Eigene Marke, Tom 16.10.2026: "Gesteuert
   ueber eine WERKBANK im Lager - hingehen, dort entwerfen - NICHT ueber
   den Laptop"). Steht nach dem Kauf im Lager an der Westwand neben dem
   Rolltor (Lager Nord, frei zwischen den Regalplaetzen), verschiebbar wie
   der Gravur-Automat. Das Tablet zeigt den Stand: eigene Batterien,
   laufende Serien. Bauteil: bk.werkbank (04z). Oberflaeche: 17h.
   ========================================================= */
let wbG=null, wbHit=null, wbSchirm=null, wbMov=null;
const WB_ORT={x:-19.39,z:3.4,ry:Math.PI/2};
function wbSchirmMalen(c,W,H){
  c.fillStyle=MAT.css('nachtblau'); c.fillRect(0,0,W,H);
  c.fillStyle=MAT.css('schildgold'); c.fillRect(0,0,W,10);
  c.textAlign='left'; c.textBaseline='middle';
  c.fillStyle=MAT.css('schildgold'); fitFont(c,'EIGENE BATTERIEN',W-40,40,BUN); c.fillText('EIGENE BATTERIEN',20,40);
  const L=typeof eigeneListe==='function'&&S?eigeneListe():[], n=WIRT.werkbank.slots;
  for(let i=0;i<n;i++){ const e=L[i], y=86+i*52;
    c.fillStyle=MAT.css(e?'anzeigeBlau':'graphit'); c.fillRect(20,y-20,W-40,44);
    c.fillStyle=MAT.css('weiss');
    if(e){ const st=WIRT.werkbank.stufen[e.stufe], u=wbUnterwegs(e);
      fitFont(c,e.name,W*0.5,26,BAR); c.fillText(e.name,32,y+2);
      c.textAlign='right'; fitFont(c,`${st.schuss} Schuss · ${'★'.repeat(Math.round(e.sterne||0))}${u?' · Serie läuft':''}`,W*0.42,22,BAR); c.fillText(`${st.schuss} Schuss · ${'★'.repeat(Math.round(e.sterne||0))}${u?' · Serie läuft':''}`,W-32,y+2); c.textAlign='left'; }
    else { c.globalAlpha=0.6; fitFont(c,`Platz ${i+1} frei`,W*0.6,24,BAR); c.fillText(`Platz ${i+1} frei`,32,y+2); c.globalAlpha=1; } }
}
function wbSchirmZeichnen(){ if(wbSchirm&&wbSchirm.material&&wbSchirm.material.map) redraw(wbSchirm.material.map,wbSchirmMalen); }
function wbBauen(pos){
  if(wbG) return;
  const p=pos||WB_ORT;
  const B=bk.werkbank({x:p.x,z:p.z,ry:p.ry||0,malen:wbSchirmMalen});
  wbG=B.g; wbSchirm=B.schirm;
  wbHit=bbox(B.laenge,1.9,B.tiefe+0.1,hitM,0,0.95,0.05,wbG,false); wbHit.userData={kind:'werkbank'};
  wbMov=addMovable({kind:'werkbank',name:'Werkbank',g:wbG,fw:B.laenge,fd:B.tiefe});
}
function wbStand(){ return localToWorld(wbG,0,0.9); }
function wbPrompt(){
  if(S.carrying) return {t:'Werkbank: erst den Karton abstellen',a:false};
  const n=eigeneListe().length;
  return {t:`Werkbank: eigene Batterien entwerfen (${n}/${WIRT.werkbank.slots})`,a:true};
}
