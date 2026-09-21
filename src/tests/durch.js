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
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{
    const bb=window.__bb;
    const hex=m=>{ if(!m) return '-'; const c=Array.isArray(m)?(m[0]&&m[0].color):m.color; if(!c) return '-';
      const f=v=>Math.round(Math.pow(Math.max(0,Math.min(1,v)),1/2.2)*255);
      return '#'+[f(c.r),f(c.g),f(c.b)].map(x=>x.toString(16).padStart(2,'0')).join(''); };
    const rot=e=>{ const a=Math.cos(e.x),b2=Math.sin(e.x),c=Math.cos(e.y),d=Math.sin(e.y),f=Math.cos(e.z),h=Math.sin(e.z);
      return [[c*f,-c*h,d],[a*h+b2*f*d,a*f-b2*h*d,-b2*c],[b2*h-a*f*d,b2*f+a*h*d,a*c]]; };
    const out=[];
    bb.scene.traverse(m=>{
      const pr=m.geometry&&m.geometry.parameters; if(!pr) return;
      const half=[(pr.width||0)/2,(pr.height||0)/2,(pr.depth||0)/2];
      let off=[0,0,0],n=m,R=null;
      while(n&&n!==bb.scene){ off[0]+=n.position.x; off[1]+=n.position.y; off[2]+=n.position.z; if(!R&&(n.rotation.x||n.rotation.y||n.rotation.z)) R=rot(n.rotation); n=n.parent; }
      R=R||[[1,0,0],[0,1,0],[0,0,1]];
      const lo=[],hi=[];
      for(let i=0;i<3;i++){ let e=0; for(let c2=0;c2<3;c2++) e+=Math.abs(R[i][c2])*half[c2];
        lo[i]=+(off[i]-e).toFixed(2); hi[i]=+(off[i]+e).toFixed(2); }
      out.push({lo,hi,c:hex(m.material),t:m.geometry.constructor.name});
    });
    /* Raum Lager innen */
    const RX=[-19.88,-8.12], RZ=[-5.88,1.88], RY=[0.05,3.58];
    const rein=out.filter(o=>{
      const ueber = o.hi[0]>RX[0]&&o.lo[0]<RX[1] && o.hi[2]>RZ[0]&&o.lo[2]<RZ[1] && o.hi[1]>RY[0]&&o.lo[1]<RY[1];
      if(!ueber) return false;
      const mitteDrin = (o.lo[0]+o.hi[0])/2>RX[0]&&(o.lo[0]+o.hi[0])/2<RX[1]&&(o.lo[2]+o.hi[2])/2>RZ[0]&&(o.lo[2]+o.hi[2])/2<RZ[1];
      return !mitteDrin;   // Mittelpunkt ausserhalb -> ragt herein
    });
    return rein.map(o=>`${o.t.padEnd(14)} ${o.c} x[${o.lo[0]},${o.hi[0]}] y[${o.lo[1]},${o.hi[1]}] z[${o.lo[2]},${o.hi[2]}]`);
  });
  console.log('--- ragt ins Lager hinein ---'); r.forEach(x=>console.log(x));
  await b.close();
})();
