/* Startmaske: Neues Spiel -> Namensmaske -> aufschliessen */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  await p.waitForTimeout(400);
  console.log('LADERAUM:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.doorOpen(false); for(let i=0;i<300;i++) bb.updateTruck(0.05);
    bb.spawnTruck([{type:'boeller',q:1}],'mertens','Mertens');
    for(let i=0;i<600;i++) bb.updateTruck(0.05);
    const g=bb.truck.raum;
    /* Rotationsmatrix aus Euler XYZ, damit wir echte Weltmasse bekommen */
    const mat=e=>{ const a=Math.cos(e.x),b2=Math.sin(e.x),c=Math.cos(e.y),d=Math.sin(e.y),f=Math.cos(e.z),h=Math.sin(e.z);
      return [[c*f,-c*h,d],[a*h+b2*f*d,a*f-b2*h*d,-b2*c],[b2*h-a*f*d,b2*f+a*h*d,a*c]]; };
    const box=(m,w,hh,dd)=>{ const R=mat(m.rotation), half=[w/2,hh/2,dd/2], lo=[0,0,0],hi=[0,0,0];
      for(let r=0;r<3;r++){ let e=0; for(let c2=0;c2<3;c2++) e+=Math.abs(R[r][c2])*half[c2];
        const p2=[m.position.x,m.position.y,m.position.z][r]+[g.position.x,g.position.y,g.position.z][r];
        lo[r]=+(p2-e).toFixed(2); hi[r]=+(p2+e).toFixed(2); } return {lo,hi}; };
    const planes=[];
    g.children.forEach(m=>{ const pr=m.geometry&&m.geometry.parameters;
      if(!pr||pr.depth!==undefined) return;
      planes.push(box(m,pr.width,pr.height,0)); });
    const span=b2=>[+(b2.hi[0]-b2.lo[0]).toFixed(2),+(b2.hi[1]-b2.lo[1]).toFixed(2),+(b2.hi[2]-b2.lo[2]).toFixed(2)];
    o.LR=bb.LR;
    o.flaechen=planes.map(span);
    o.boden=planes.filter(x=>x.hi[1]<0.1).map(x=>({x:[x.lo[0],x.hi[0]],z:[x.lo[2],x.hi[2]]}));
    o.seitenwaende=planes.filter(x=>x.hi[1]>2&&(x.hi[2]-x.lo[2])<0.1).map(x=>({x:[x.lo[0],x.hi[0]],z:x.lo[2]}));
    o.stirnwand=planes.filter(x=>x.hi[1]>2&&(x.hi[0]-x.lo[0])<0.1).map(x=>({x:x.lo[0],z:[x.lo[2],x.hi[2]]}));
    o.decke=planes.filter(x=>x.lo[1]>2.5).map(x=>({x:[x.lo[0],x.hi[0]],z:[x.lo[2],x.hi[2]]}));
    return o;
  })));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();
