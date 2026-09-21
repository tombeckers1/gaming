const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const src='data:image/png;base64,'+fs.readFileSync(process.argv[2]).toString('base64');
  const b=await chromium.launch({args:['--no-sandbox']}); const p=await b.newPage();
  await p.setContent('<html><body></body></html>');
  const out=await p.evaluate(async(src)=>{
    const img=new Image(); img.src=src;
    await img.decode();
    const mk=(size,type,q)=>{ const c=document.createElement('canvas'); c.width=size; c.height=size;
      const g=c.getContext('2d'); g.imageSmoothingQuality='high'; g.drawImage(img,0,0,size,size);
      return c.toDataURL(type,q); };
    return {w:img.width,h:img.height,
      a:mk(512,'image/webp',0.9), b:mk(384,'image/webp',0.86), c:mk(256,'image/webp',0.85)};
  },src);
  console.log('src',out.w+'x'+out.h);
  for(const k of ['a','b','c']) console.log(k, Math.round(out[k].length/1024)+' KB');
  fs.writeFileSync('logo512.txt',out.a); fs.writeFileSync('logo384.txt',out.b);
  await b.close();
})();
