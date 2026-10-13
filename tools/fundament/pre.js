/* PROFILER (nur Scratchpad) -- vor allen Teilen */
window.__P={stack:[],calls:[],mats:[],texs:[],renders:[],on:true};
(function(){
  const P=window.__P;
  const cnt=['MeshStandardMaterial','MeshBasicMaterial','MeshLambertMaterial','MeshPhongMaterial'];
  for(const n of cnt){ const O=THREE[n]; if(!O) continue;
    const W=function(o){ const m=new O(o); P.mats.push({t:n,lab:P.stack.length?P.stack[P.stack.length-1]:'(top)',id:m.id}); return m; };
    W.prototype=O.prototype; THREE[n]=W; }
})();
