/* =========================================================
   Winzige Objekte ausblenden (03.10., Tom: "fluessiger, hochaufloesend
   so gut es geht"). Gemessen am iPhone-Format: im leeren Laden 1.190
   Zeichenaufrufe, gut 40 % davon Teile, die kleiner als rund 4 Pixel
   erscheinen - Kleinkram in Lager, Hof und Stadt, meist hinter Waenden.
   Alle 0,2 s: Objekte, deren Radius unter 0,5 % ihrer Entfernung liegt,
   wandern auf Ebene 2 (nicht gezeichnet), ab 0,6 % wieder zurueck - der
   Abstand verhindert Flackern. Lichter, Leuchtflaechen, Partikel und
   Instanzen bleiben immer. Ebene 1 gehoert den Buendeln (03b), die
   fasst die Kappung nicht an.
   ========================================================= */
const KAPPE={aus:0.005,an:0.006,t:0,zyklus:0,liste:null,weg:new Set(),gezaehlt:0};
function kleinListe(){
  const L=[];
  scene.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.frustumCulled||!o.geometry||o.userData.immer) return;
    const m=o.material;
    if(m&&!Array.isArray(m)&&(m.blending===THREE.AdditiveBlending||(m.isMeshBasicMaterial&&m.toneMapped===false)||(m.transparent&&m.depthWrite===false)||(m.emissiveIntensity>0.5&&m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)>0.3))) return;
    if(!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    if(o.geometry.boundingSphere) L.push(o); });
  return L;
}
function kleinTakt(dt){
  /* zum Vergleichen abschaltbar: alles zurueck auf Ebene 0 */
  if(KAPPE.pause){ KAPPE.weg.forEach(o=>{ if(o.layers.mask===4) o.layers.mask=1; }); KAPPE.weg.clear(); return; }
  KAPPE.t+=dt; if(KAPPE.t<0.2) return; KAPPE.t=0;
  if(!KAPPE.liste||++KAPPE.zyklus%10===0){
    KAPPE.liste=kleinListe();
    /* was nicht mehr in der Szene haengt, bekommt seine Ebene zurueck */
    const drin=new Set(KAPPE.liste);
    KAPPE.weg.forEach(o=>{ if(!drin.has(o)){ if(o.layers.mask===4) o.layers.mask=1; KAPPE.weg.delete(o); } });
  }
  const c=camera.position;
  for(const o of KAPPE.liste){
    const bs=o.geometry.boundingSphere, e=o.matrixWorld.elements, cx=bs.center.x, cy=bs.center.y, cz=bs.center.z;
    const x=e[0]*cx+e[4]*cy+e[8]*cz+e[12]-c.x, y=e[1]*cx+e[5]*cy+e[9]*cz+e[13]-c.y, z=e[2]*cx+e[6]*cy+e[10]*cz+e[14]-c.z;
    const s=Math.sqrt(Math.max(e[0]*e[0]+e[1]*e[1]+e[2]*e[2],e[4]*e[4]+e[5]*e[5]+e[6]*e[6],e[8]*e[8]+e[9]*e[9]+e[10]*e[10]));
    const q=bs.radius*s/Math.max(0.01,Math.sqrt(x*x+y*y+z*z));
    if(KAPPE.weg.has(o)){ if(q>KAPPE.an){ if(o.layers.mask===4) o.layers.mask=1; KAPPE.weg.delete(o); } }
    else if(q<KAPPE.aus&&o.layers.mask===1){ o.layers.mask=4; KAPPE.weg.add(o); }
  }
  KAPPE.gezaehlt=KAPPE.weg.size;
}
