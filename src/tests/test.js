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
  const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE: '+m.text()); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  console.log('booted');
  await neuesSpiel(p);
  await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{
    const bb=window.__bb, out={};
    bb.S.money=50000;
    // Tag simulieren
    bb.openShop();
    bb.run(90,0.05);
    out.customers=bb.customers.length;
    out.phase=bb.phase;
    // Regal befüllen
    const box=bb.floorBoxes[0]; if(box){ bb.pickUp(box); const lv=bb.allLevels()[0]; for(let i=0;i<40;i++) bb.stockOne(lv,true); out.lvCount=lv.count; out.lvType=lv.type; }
    bb.run(120,0.05);
    out.customers2=bb.customers.length; out.revenue=bb.DS.revenue; out.sold=bb.DS.sold;
    return out;
  });
  console.log('phase1',JSON.stringify(r));
  const r2=await p.evaluate(()=>{
    const bb=window.__bb,out={};
    bb.S.level=20; bb.S.money=90000;
    // Ausbau + Deko + Personal
    ['shelf_klein','shelf_standard','shelf_standard','shelf_kuehl','rack','plakat','terminal','tag4','heizung','musik','radio','cams','regallicht','alarm'].forEach(id=>bb.buyUp(id));
    ['pflanze','stehtisch','muell','teppich','lichter','ventilator','baum','neon','automat'].forEach(id=>bb.buyDeko(id));
    bb.setWall('mitternacht'); bb.setFloor('terrazzo');
    ['reinigung','auffueller','kassierer','security'].forEach(id=>{ bb.S.staff[id]=true; bb.hireStaff(id); });
    out.shelves=bb.shelves.length; out.racks=bb.racks.length; out.dekos=bb.dekos.length;
    // alle Produkte bestellen und einräumen
    const S=bb.S;
    return out;
  });
  console.log('phase2',JSON.stringify(r2));
  // Laptop-Tabs rendern
  await p.evaluate(()=>window.__bb.openLaptop());
  for(const t of ['order','price','up','deko','staff','bank','stats','shop']){
    await p.click(`#ltabs button[data-tab="${t}"]`);
    await p.waitForTimeout(60);
  }
  await p.screenshot({path:process.argv[3].replace('.png','-laptop.png')});
  await p.evaluate(()=>window.__bb.closeLaptop(false));
  await p.click('#pBtn').catch(()=>{});
  const r3=await p.evaluate(async()=>{
    const bb=window.__bb,out={};
    // jedes Produkt: Karton spawnen, einräumen, zünden
    const ids=Object.keys(bb.S.prices);
    out.products=ids.length;
    ids.forEach((t,i)=>{ const lv=bb.allLevels()[i%bb.allLevels().length]; });
    bb.run(60,0.05);
    // Umbaumodus
    bb.toggleBuild(true);
    out.build=true;
    bb.toggleBuild(false);
    out.dirts=bb.dirts.length;
    out.money=Math.round(bb.S.money);
    out.level=bb.S.level;
    return out;
  });
  console.log('phase3',JSON.stringify(r3));
  await p.screenshot({path:process.argv[3]});
  console.log('ERRORS:',errs.length?errs.slice(0,12).join('\n'):'keine');
  await b.close();
})();
