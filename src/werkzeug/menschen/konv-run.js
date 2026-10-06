// node konv-run.js <auftrag.json> <ausgabe-ordner>
// auftrag: {avatare:[{id,fbx,tex,desk,handy,...}], anims:[{id,fbx,fps,...}]}
const fs=require('fs'), path=require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const A=JSON.parse(fs.readFileSync(process.argv[2],'utf8')), out=process.argv[3]; fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage(); p.setDefaultTimeout(600000);
  p.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') console.log('CONSOLE',m.text().slice(0,300)); });
  p.on('pageerror',e=>console.log('PAGEERROR',e.message));
  await p.goto('http://127.0.0.1:8765/web/konv.html'); await p.waitForFunction('window.bereit&&window.konvAvatar');
  for(const c of A.avatare||[]){
    const t0=Date.now();
    const r=await p.evaluate(c=>konvAvatar(c),c);
    fs.writeFileSync(path.join(out,c.id+'.json'),JSON.stringify(r.daten));
    const d=r.daten.atlas.split(',')[1]; fs.writeFileSync(path.join(out,c.id+'_atlas.webp'),Buffer.from(d,'base64'));
    console.log(c.id,Math.round((Date.now()-t0)/1000)+'s',JSON.stringify(r.info));
  }
  for(const c of A.anims||[]){
    const r=await p.evaluate(c=>konvAnim(c),c);
    fs.writeFileSync(path.join(out,'anim_'+c.id+'.json'),JSON.stringify(r));
    console.log('anim',c.id,r.n,r.dauer,r.dauerClip,'KB',Math.round(r.q.length/1024));
  }
  await b.close();
})();
