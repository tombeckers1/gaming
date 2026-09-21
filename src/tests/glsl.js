// Kompiliert die Shader-Quellen wirklich in Chromium und meldet Fehler.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const src=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  const b=await chromium.launch({args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage();
  await p.setContent('<canvas id=c width=64 height=64></canvas>');
  const out=await p.evaluate((src)=>{
    const gl=document.getElementById('c').getContext('webgl');
    if(!gl) return {fatal:'kein WebGL'};
    // So prependet Three.js r128 bei ShaderMaterial (vereinfacht, aber deckungsgleich fuer unsere Zwecke)
    const VPRE=`precision highp float;precision highp int;
uniform mat4 modelMatrix;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;uniform mat4 viewMatrix;uniform mat3 normalMatrix;uniform vec3 cameraPosition;uniform bool isOrthographic;
attribute vec3 position;attribute vec3 normal;attribute vec2 uv;
`;
    const FPRE=`precision highp float;precision highp int;
uniform mat4 viewMatrix;uniform vec3 cameraPosition;uniform bool isOrthographic;
`;
    const res=[];
    for(const s of src){
      const r={name:s.name,vs:'ok',fs:'ok',link:'ok'};
      const vs=gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs,VPRE+s.vertex); gl.compileShader(vs);
      if(!gl.getShaderParameter(vs,gl.COMPILE_STATUS)) r.vs=gl.getShaderInfoLog(vs);
      const fs=gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs,FPRE+s.fragment); gl.compileShader(fs);
      if(!gl.getShaderParameter(fs,gl.COMPILE_STATUS)) r.fs=gl.getShaderInfoLog(fs);
      if(r.vs==='ok'&&r.fs==='ok'){
        const pr=gl.createProgram(); gl.attachShader(pr,vs); gl.attachShader(pr,fs); gl.linkProgram(pr);
        if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) r.link=gl.getProgramInfoLog(pr);
        else { r.uniforms=[]; const n=gl.getProgramParameter(pr,gl.ACTIVE_UNIFORMS);
          for(let i=0;i<n;i++) r.uniforms.push(gl.getActiveUniform(pr,i).name); }
      }
      res.push(r);
    }
    return {res};
  },src);
  console.log(JSON.stringify(out,null,1));
  await b.close();
})();
