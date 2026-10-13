/* Spiel ohne Browser in Node laden (Fundament Etappe 4, 13.10.2026)
   Laedt alle Teil-Dateien in der Reihenfolge aus src/build.sh in eine vm.
   THREE, Canvas, Audio und alles Unbekannte sind ein "Allesfresser"-Proxy,
   document.getElementById liefert Elemente, die innerHTML/textContent
   mitschreiben. Die Welt wird NICHT gebaut (fontsReady loest nie aus),
   es laeuft nur der Kopf-Code aller Dateien: Daten, Funktionen, Konstanten.
   Zugriff auf alles im Spiel-Scope: spiel.ev('ausdruck').
   Math.random ist geseedet (spiel.seed(n)), damit Zufall reproduzierbar ist.
   Benutzt von wirtschaft-snapshot.js; keine Testsperre, kein Browser, <1 s. */
const fs=require('fs'), vm=require('vm'), path=require('path');

function laden(wurzel){
  const W=wurzel||path.resolve(__dirname,'..','..');
  const sh=fs.readFileSync(W+'/src/build.sh','utf8');
  const files=[...sh.matchAll(/\$W\/parts\/([^ ]+)/g)].map(m=>m[1]).filter(f=>f.endsWith('.js'));
  /* Allesfresser: jede Eigenschaft, jeder Aufruf, jedes new liefert ihn selbst */
  const U=(()=>{ const f=function(){}; let p; const h={
    get(t,k){ if(k===Symbol.toPrimitive) return ()=>0; if(k===Symbol.iterator) return function*(){};
      if(k==='length') return 0; if(k==='then') return undefined; return p; },
    set(){ return true; }, apply(){ return p; }, construct(){ return p; }, has(){ return true; } };
    p=new Proxy(f,h); return p; })();
  /* Elemente mit Gedaechtnis fuer Texte */
  const els={};
  const mkEl=(id)=>{ const st={id,innerHTML:'',textContent:'',value:'',style:{},dataset:{},children:[],className:''};
    const cl=new Set();
    st.classList={add:(...a)=>a.forEach(x=>cl.add(x)),remove:(...a)=>a.forEach(x=>cl.delete(x)),contains:x=>cl.has(x),toggle:(x,f)=>{ const on=f===undefined?!cl.has(x):!!f; if(on) cl.add(x); else cl.delete(x); return on; }};
    for(const m of ['addEventListener','removeEventListener','appendChild','removeChild','insertBefore','setAttribute','removeAttribute','focus','blur','click','scrollIntoView','remove','replaceChildren','append','prepend'])
      st[m]=()=>U;
    st.querySelector=()=>U; st.querySelectorAll=()=>[]; st.getBoundingClientRect=()=>({x:0,y:0,width:100,height:100,left:0,top:0,right:100,bottom:100});
    st.getContext=()=>U;
    return new Proxy(st,{get(t,k){ if(k in t) return t[k]; if(typeof k==='symbol') return k===Symbol.toPrimitive?()=>0:undefined; return U; },set(t,k,v){ t[k]=v; return true; }});
  };
  const doc=new Proxy({},{get(t,k){
    if(k==='getElementById') return id=>els[id]||(els[id]=mkEl(id));
    if(k==='createElement') return tag=>mkEl('<'+tag+'>');
    if(k==='querySelector') return ()=>U; if(k==='querySelectorAll') return ()=>[];
    if(k==='fonts') return {load:()=>new Promise(()=>{}),ready:new Promise(()=>{})};
    if(k==='body'||k==='documentElement'||k==='head') return mkEl(k);
    return U; }});
  /* geseedeter Zufall (mulberry32) */
  let s32=1;
  const rnd=()=>{ s32|=0; s32=(s32+0x6D2B79F5)|0; let t=Math.imul(s32^(s32>>>15),1|s32); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; };
  const M={}; for(const k of Object.getOwnPropertyNames(Math)) M[k]=Math[k]; M.random=rnd;
  let uhr=0;
  const store={};
  const sb={console:{log(){},warn(){},error(){},info(){}},Math:M,JSON,Promise,Object,Array,Number,String,Symbol,Map,Set,WeakMap,WeakSet,Error,TypeError,RegExp,parseInt,parseFloat,isNaN,isFinite,Boolean,Function,Reflect,Proxy,
    Float32Array,Uint8Array,Uint16Array,Uint32Array,Int32Array,Int8Array,Uint8ClampedArray,Int16Array,Float64Array,ArrayBuffer,DataView,
    Date:class extends Date{ static now(){ return 1760000000000+uhr; } },
    setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},performance:{now:()=>(uhr+=16)},
    matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),
    localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear(){ for(const k in store) delete store[k]; }},
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    navigator:{userAgent:'node',maxTouchPoints:0,language:'de-DE'},document:doc,THREE:U,Image:U,AudioContext:U,webkitAudioContext:U,location:{search:'',href:'',hash:''},
    addEventListener(){},removeEventListener(){},innerWidth:1280,innerHeight:720,devicePixelRatio:1,Path2D:U,OffscreenCanvas:U,
    URLSearchParams,TextEncoder,TextDecoder,atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),
    Blob:U,URL:U,Worker:U,fetch:()=>new Promise(()=>{}),Intl,structuredClone,queueMicrotask:()=>{},getComputedStyle:()=>U,screen:{width:1280,height:720},
    Audio:U,ImageData:U,HTMLCanvasElement:U,alert(){},confirm:()=>false,prompt:()=>null};
  sb.window=sb; sb.self=sb; sb.globalThis=sb; sb.top=sb; sb.parent=sb;
  vm.createContext(sb);
  let code="(function(){'use strict';\n"+files.map(f=>'/* @@'+f+' */\n'+fs.readFileSync(W+'/src/parts/'+f,'utf8')).join('\n');
  const last=code.lastIndexOf('})();');
  code=code.slice(0,last)+';globalThis.__ev=function(s){ return eval(s); };\n'+code.slice(last);
  code=code.replace(/<\/script>\s*<\/body>[\s\S]*$/,'');
  vm.runInContext(code,sb,{filename:'spiel.js'});
  return {
    ev:(s)=>sb.__ev(s),
    seed:(n)=>{ s32=n|0; uhr=0; },
    el:(id)=>els[id],
    els, sb, files
  };
}
module.exports={laden};
