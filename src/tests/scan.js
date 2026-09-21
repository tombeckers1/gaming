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
    const hex=m=>{ if(!m) return '-'; const c=Array.isArray(m)?m[0].color:m.color; if(!c) return '-';
      const f=v=>Math.round(Math.pow(Math.max(0,Math.min(1,v)),1/2.2)*255);
      return '#'+[f(c.r),f(c.g),f(c.b)].map(x=>x.toString(16).padStart(2,'0')).join(''); };
    const list=[];
    const rot=(v,e)=>{ let [x,y,z]=v;
      let c=Math.cos(e.x),si=Math.sin(e.x); let y1=y*c-z*si, z1=y*si+z*c; y=y1; z=z1;
      c=Math.cos(e.y); si=Math.sin(e.y); let x1=x*c+z*si; z1=-x*si+z*c; x=x1; z=z1;
      c=Math.cos(e.z); si=Math.sin(e.z); x1=x*c-y*si; y1=x*si+y*c;
      return [x1,y1,z]; };
    bb.scene.traverse(o=>{
      if(!o.geometry||!o.geometry.attributes||!o.geometry.attributes.position) return;
      const pos=o.geometry.attributes.position;
      if(pos.count>20000) return;
      let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
      for(let i=0;i<pos.count;i++){
        let v=[pos.getX(i),pos.getY(i),pos.getZ(i)];
        v=rot(v,o.rotation);
        for(let k=0;k<3;k++){ lo[k]=Math.min(lo[k],v[k]); hi[k]=Math.max(hi[k],v[k]); }
      }
      let off=[0,0,0], n=o;
      while(n&&n!==bb.scene){ off[0]+=n.position.x; off[1]+=n.position.y; off[2]+=n.position.z; n=n.parent; }
      const mn=lo.map((v,k)=>v+off[k]), mx=hi.map((v,k)=>v+off[k]);
      list.push({t:o.geometry.type,mn,mx,c:hex(o.material),
        mt:Array.isArray(o.material)?'multi':(o.material&&o.material.type||'-'),
        tx:!!(o.material&&!Array.isArray(o.material)&&o.material.map)});
    });
    const fmt=e=>`${(e.t||'?').padEnd(14)} ${(e.mt||'?').slice(0,12).padEnd(12)} ${e.c} tex=${e.tx?1:0} x[${e.mn[0].toFixed(2)},${e.mx[0].toFixed(2)}] y[${e.mn[1].toFixed(2)},${e.mx[1].toFixed(2)}] z[${e.mn[2].toFixed(2)},${e.mx[2].toFixed(2)}]`;
    const sel=(f)=>list.filter(f).map(fmt);
    return {
      lagerOben: sel(e=>e.mn[1]>2.55&&e.mn[1]<4.1&&e.mn[0]>-20.6&&e.mx[0]<-7.5&&e.mn[2]>-6.6&&e.mx[2]<2.6),
    };
  });
  for(const k of Object.keys(r)){ console.log('--- '+k+' ('+r[k].length+') ---'); r[k].forEach(x=>console.log(x)); }
  await b.close();
})();
