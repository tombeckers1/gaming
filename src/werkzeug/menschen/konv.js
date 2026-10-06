/* Konverter: Rocketbox-FBX (MIT) -> kompakte Figurdaten fuer den Boellerladen.
   Laeuft in Chromium (three r128 + FBXLoader + meshoptimizer). */
window.ladeFBX=url=>new Promise((res,rej)=>new THREE.FBXLoader().load(url,res,undefined,rej));
const ladeBild=url=>new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });

const SEITEN=['L','R'];
const KEEP=['Bip01','Bip01_Pelvis','Bip01_Spine','Bip01_Spine1','Bip01_Spine2','Bip01_Neck','Bip01_Head'];
for(const s of SEITEN) for(const n of ['Clavicle','UpperArm','Forearm','Hand','Finger0','Finger1','Thigh','Calf','Foot','Toe0']) KEEP.push('Bip01_'+s+'_'+n);
window.KEEP=KEEP;
/* Gruppen fuer die Kleidungsmaske */
const OBEN=new Set(['Bip01_Spine','Bip01_Spine1','Bip01_Spine2','Bip01_L_Clavicle','Bip01_R_Clavicle','Bip01_L_UpperArm','Bip01_R_UpperArm','Bip01_L_Forearm','Bip01_R_Forearm']);
const UNTEN=new Set(['Bip01_Pelvis','Bip01_L_Thigh','Bip01_R_Thigh','Bip01_L_Calf','Bip01_R_Calf']);

function reduziert(bone){
  let b=bone;
  const m=/^Bip01_([LR])_Finger(\d)\d?$/.exec(b.name);
  if(m) return 'Bip01_'+m[1]+'_Finger'+(m[2]==='0'?'0':'1');
  while(b&&KEEP.indexOf(b.name)<0) b=b.parent;
  return b?b.name:'Bip01';
}

/* Atlas 1024 x 512: Koerper 512x512 links, Kopf 256x256 oben Mitte, Haar 256x512 rechts */
const ATL={W:1024,H:512, koerper:[0,0,512,512], kopf:[512,0,256,256], haar:[768,0,256,512], frei:[512,256,256,256]};

window.konvAvatar=async(cfg)=>{
  await window.bereit;
  const o=await ladeFBX(cfg.fbx); o.updateMatrixWorld(true);
  o.traverse(q=>{ if(q.isBone) q.name=q.name.replace(/^Bip0\d/,'Bip01'); });
  let sm=null; o.traverse(q=>{ if(q.isSkinnedMesh&&!sm) sm=q; });
  const geo=sm.geometry, sk=sm.skeleton, nV=geo.attributes.position.count;
  const mats=Array.isArray(sm.material)?sm.material:[sm.material];
  const art=mats.map(m=>/opacity/i.test(m.name)?'haar':/head/i.test(m.name)?'kopf':'koerper');
  const matV=new Uint8Array(nV);
  if(geo.groups.length) geo.groups.forEach(gr=>{ for(let i=gr.start;i<gr.start+gr.count;i++) matV[i]=gr.materialIndex; });
  const info={fbx:cfg.fbx,nV,tri:nV/3,art,bones:sk.bones.length};
  /* Knochen: Weltmatrizen im Bindungszustand */
  const alle={}; o.traverse(q=>{ if(q.isBone) alle[q.name]=q; });
  const W={};
  sk.bones.forEach((b,i)=>{ W[b.name]=sk.boneInverses[i].clone().invert(); });
  let maxD=0; sk.bones.forEach(b=>{ const a=W[b.name].elements, c=b.matrixWorld.elements; for(let k=0;k<16;k++) maxD=Math.max(maxD,Math.abs(a[k]-c[k])); });
  info.bindAbweichung=maxD;
  for(const n of KEEP){ if(!W[n]){ if(!alle[n]) throw new Error('Knochen fehlt: '+n); W[n]=alle[n].matrixWorld.clone(); } }
  /* reduzierte Hierarchie */
  const parentRed=n=>{ let p=alle[n].parent; while(p&&KEEP.indexOf(p.name)<0) p=p.parent; return p&&p.isBone?p.name:null; };
  const knochen=KEEP.map(n=>({n,p:parentRed(n)}));
  /* topologisch sortieren (Eltern zuerst) */
  const ord=[]; const fertig=new Set();
  while(ord.length<knochen.length){ for(const k of knochen){ if(fertig.has(k.n)) continue; if(!k.p||fertig.has(k.p)){ ord.push(k); fertig.add(k.n); } } }
  const idxOf={}; ord.forEach((k,i)=>idxOf[k.n]=i);
  const mP=new THREE.Vector3(), mQ=new THREE.Quaternion(), mS=new THREE.Vector3();
  const rest=ord.map(k=>{ const L=k.p?W[k.p].clone().invert().multiply(W[k.n]):W[k.n].clone(); L.decompose(mP,mQ,mS);
    return {n:k.n,p:k.p?idxOf[k.p]:-1,pos:mP.toArray().map(v=>+v.toFixed(4)),q:mQ.toArray().map(v=>+v.toFixed(6)),s:mS.toArray().map(v=>+v.toFixed(4))}; });
  info.skalen=[...new Set(rest.map(r=>r.s.join(',')))].slice(0,5);
  /* Geometrie in Bindungsraum */
  const bm=sm.bindMatrix, nm=new THREE.Matrix3().getNormalMatrix(bm);
  const P=geo.attributes.position, N=geo.attributes.normal, U=geo.attributes.uv, SI=geo.attributes.skinIndex, SW=geo.attributes.skinWeight;
  const v=new THREE.Vector3();
  const pos=new Float32Array(nV*3), nor=new Float32Array(nV*3), uv0=new Float32Array(nV*2), si=new Uint8Array(nV*4), sw=new Float32Array(nV*4), reg=new Float32Array(nV*2), regB=new Float32Array(nV);
  const redIdx=sk.bones.map(b=>idxOf[reduziert(b)]);
  let uvMin=[9,9], uvMax=[-9,-9];
  for(let i=0;i<nV;i++){
    v.fromBufferAttribute(P,i).applyMatrix4(bm); pos.set([v.x,v.y,v.z],i*3);
    v.fromBufferAttribute(N,i).applyMatrix3(nm).normalize(); nor.set([v.x,v.y,v.z],i*3);
    uv0[i*2]=U.getX(i); uv0[i*2+1]=U.getY(i);
    uvMin[0]=Math.min(uvMin[0],uv0[i*2]); uvMin[1]=Math.min(uvMin[1],uv0[i*2+1]); uvMax[0]=Math.max(uvMax[0],uv0[i*2]); uvMax[1]=Math.max(uvMax[1],uv0[i*2+1]);
    const acc={}; let ob=0, un=0, be=0;
    for(let k=0;k<4;k++){ const w=SW.array[i*4+k]; if(w<=0) continue; const b=SI.array[i*4+k]; const r=redIdx[b]; acc[r]=(acc[r]||0)+w;
      const nm2=sk.bones[b]?reduziert(sk.bones[b]):''; if(OBEN.has(nm2)) ob+=w; else if(UNTEN.has(nm2)) un+=w; if(/Thigh|Calf/.test(nm2)) be+=w; }
    reg[i*2]=ob; reg[i*2+1]=un; regB[i]=be;
    const ls=Object.entries(acc).sort((a,b)=>b[1]-a[1]).slice(0,4); let s=0; ls.forEach(e=>s+=e[1]);
    for(let k=0;k<4;k++){ si[i*4+k]=ls[k]?+ls[k][0]:0; sw[i*4+k]=ls[k]?ls[k][1]/s:0; }
  }
  info.uvMin=uvMin; info.uvMax=uvMax;
  /* Atlas-UV */
  const uv=new Float32Array(nV*2);
  for(let i=0;i<nV;i++){ const R=ATL[art[matV[i]]]; let u=uv0[i*2], w=uv0[i*2+1];
    u=Math.min(1,Math.max(0,u)); w=Math.min(1,Math.max(0,w));
    const X=R[0]+u*R[2], Y=R[1]+(1-w)*R[3]; uv[i*2]=X/ATL.W; uv[i*2+1]=1-Y/ATL.H; }
  /* Verschweissen */
  const map=new Map(), remap=new Uint32Array(nV); const uniq=[];
  for(let i=0;i<nV;i++){
    const k=[Math.round(pos[i*3]*1e3),Math.round(pos[i*3+1]*1e3),Math.round(pos[i*3+2]*1e3),Math.round(nor[i*3]*200),Math.round(nor[i*3+1]*200),Math.round(nor[i*3+2]*200),Math.round(uv[i*2]*65535),Math.round(uv[i*2+1]*65535),matV[i]].join(',');
    let j=map.get(k); if(j===undefined){ j=uniq.length; map.set(k,j); uniq.push(i); } remap[i]=j; }
  const nU=uniq.length;
  const P2=new Float32Array(nU*3), N2=new Float32Array(nU*3), UV2=new Float32Array(nU*2), SI2=new Uint8Array(nU*4), SW2=new Float32Array(nU*4), M2=new Uint8Array(nU);
  uniq.forEach((i,j)=>{ P2.set(pos.subarray(i*3,i*3+3),j*3); N2.set(nor.subarray(i*3,i*3+3),j*3); UV2.set(uv.subarray(i*2,i*2+2),j*2); SI2.set(si.subarray(i*4,i*4+4),j*4); SW2.set(sw.subarray(i*4,i*4+4),j*4); M2[j]=matV[i]; });
  const istHaar=m=>art[m]==='haar';
  const idxK=[], idxH=[];
  for(let t=0;t<nV;t+=3){ const a=remap[t],b=remap[t+1],c=remap[t+2]; if(a===b||b===c||a===c) continue; (istHaar(matV[t])?idxH:idxK).push(a,b,c); }
  info.nU=nU; info.triKoerper=idxK.length/3; info.triHaar=idxH.length/3;
  /* Vereinfachen: Koerper/Kopf mit Attributen, Haar leicht */
  const attr=new Float32Array(nU*5); for(let j=0;j<nU;j++){ attr[j*5]=N2[j*3]; attr[j*5+1]=N2[j*3+1]; attr[j*5+2]=N2[j*3+2]; attr[j*5+3]=UV2[j*2]; attr[j*5+4]=UV2[j*2+1]; }
  const simp=(idx,ziel,err,fl,lock)=>{ if(idx.length/3<=ziel) return new Uint32Array(idx); const r=MS.simplifyWithAttributes(new Uint32Array(idx),P2,3,attr,5,[0.3,0.3,0.3,1.5,1.5],lock||null,Math.floor(ziel)*3,err,fl||[]); return r[0]; };
  /* Augen und Mund bleiben fest (Kopftextur: Augenpartie und Mund in der Mitte, Augaepfel unten) */
  const lockK=new Uint8Array(nU); let nLock=0;
  for(let j=0;j<nU;j++){ if(art[M2[j]]!=='kopf') continue; const i=uniq[j], u=uv0[i*2], vt=1-uv0[i*2+1];
    if((u>0.3&&u<0.7&&vt>0.2&&vt<0.36)||(u>0.4&&u<0.6&&vt>=0.36&&vt<0.45)){ lockK[j]=1; nLock++; } }
  info.gesperrt=nLock;
  /* Kopf und Koerper getrennt: das Gesicht bekommt sein eigenes Budget
     (sonst frisst der Vereinfacher am Handy Augen und Mund weg); die Naht
     am Hals bleibt fest */
  const idxKo=[], idxKp=[]; for(let t=0;t<idxK.length;t+=3) (art[M2[idxK[t]]]==='kopf'?idxKp:idxKo).push(idxK[t],idxK[t+1],idxK[t+2]);
  info.triKopf=idxKp.length/3;
  const kD=simp(idxKp,cfg.kopfDesk||1150,0.05,['LockBorder']), kH=simp(Array.from(kD),cfg.kopfHandy||760,0.2,['LockBorder'],lockK);
  const oD=simp(idxKo,(cfg.desk||3300)-kD.length/3,0.08,['LockBorder']), oH=simp(Array.from(oD),(cfg.handy||1550)-kH.length/3,0.2,['LockBorder']);
  const lodD=Uint32Array.from([...kD,...oD]), lodH=Uint32Array.from([...kH,...oH]);
  const haarD=simp(idxH,cfg.haarDesk||idxH.length/3,0.05), haarH=simp(Array.from(haarD),cfg.haarHandy||idxH.length/6,0.2);
  info.lod={desk:lodD.length/3+haarD.length/3,handy:lodH.length/3+haarH.length/3,haarD:haarD.length/3,haarH:haarH.length/3};
  /* benutzte Ecken verdichten */
  const ixD=Uint32Array.from([...lodD,...haarD]), ixH=Uint32Array.from([...lodH,...haarH]);
  const neu=new Int32Array(nU).fill(-1); let nn=0; for(const a of ixD) if(neu[a]<0) neu[a]=nn++; for(const a of ixH) if(neu[a]<0) neu[a]=nn++;
  info.vertsDesk=nn;
  /* Bounding */
  const mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
  for(let j=0;j<nU;j++) if(neu[j]>=0) for(let k=0;k<3;k++){ mn[k]=Math.min(mn[k],P2[j*3+k]); mx[k]=Math.max(mx[k],P2[j*3+k]); }
  /* Binaer: pos u16x3, nor i8x3(+pad), uv u16x2, si u8x4, sw u8x4 */
  const stride=6+4+4+4+4, buf=new ArrayBuffer(nn*stride), dv=new DataView(buf);
  for(let j=0;j<nU;j++){ const k=neu[j]; if(k<0) continue; const o2=k*stride;
    for(let c=0;c<3;c++) dv.setUint16(o2+c*2,Math.round((P2[j*3+c]-mn[c])/(mx[c]-mn[c])*65535),true);
    for(let c=0;c<3;c++) dv.setInt8(o2+6+c,Math.round(N2[j*3+c]*127));
    dv.setUint16(o2+10,Math.round(UV2[j*2]*65535),true); dv.setUint16(o2+12,Math.round(UV2[j*2+1]*65535),true);
    let ws=[0,1,2,3].map(c=>Math.round(SW2[j*4+c]*255)); const d=255-ws.reduce((a,b)=>a+b,0); ws[0]+=d;
    for(let c=0;c<4;c++){ dv.setUint8(o2+14+c,SI2[j*4+c]); dv.setUint8(o2+18+c,ws[c]); } }
  const i16=a=>{ const r=new Uint16Array(a.length); a.forEach((x,i)=>r[i]=neu[x]); return r; };
  const iD=i16(ixD), iH=i16(ixH);
  const b64=u8=>{ let s=''; const B=0x8000; for(let i=0;i<u8.length;i+=B) s+=String.fromCharCode.apply(null,u8.subarray(i,i+B)); return btoa(s); };
  /* ---------- Textur-Atlas mit Kleidungsmaske ---------- */
  const [bK,bKo,bH]=await Promise.all([ladeBild(cfg.tex+'/body.png'),ladeBild(cfg.tex+'/head.png'),ladeBild(cfg.tex+'/haar.png').catch(()=>null)]);
  const cv=document.createElement('canvas'); cv.width=ATL.W*2; cv.height=ATL.H*2; const g=cv.getContext('2d');
  const R2=r=>r.map(x=>x*2);
  g.drawImage(bK,...R2(ATL.koerper)); g.drawImage(bKo,...R2(ATL.kopf)); if(bH) g.drawImage(bH,...R2(ATL.haar));
  const img=g.getImageData(0,0,cv.width,cv.height), px=img.data, CW=cv.width, CH=cv.height;
  /* Abdeckung und Bereich je Texel: Dreiecke in UV rastern (doppelte Aufloesung) */
  const deck=new Uint8Array(CW*CH), regT=new Float32Array(CW*CH*2), regTB=new Float32Array(CW*CH), regN=new Float32Array(CW*CH);
  const rast=(i0,i1,i2,f)=>{ const X=[i0,i1,i2].map(i=>UV2[i*2]*CW), Y=[i0,i1,i2].map(i=>(1-UV2[i*2+1])*CH);
    const x0=Math.max(0,Math.floor(Math.min(...X))), x1=Math.min(CW-1,Math.ceil(Math.max(...X))), y0=Math.max(0,Math.floor(Math.min(...Y))), y1=Math.min(CH-1,Math.ceil(Math.max(...Y)));
    const den=(Y[1]-Y[2])*(X[0]-X[2])+(X[2]-X[1])*(Y[0]-Y[2]); if(Math.abs(den)<1e-9) return;
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ const px_=x+0.5, py=y+0.5;
      const a=((Y[1]-Y[2])*(px_-X[2])+(X[2]-X[1])*(py-Y[2]))/den, b=((Y[2]-Y[0])*(px_-X[2])+(X[0]-X[2])*(py-Y[2]))/den, c=1-a-b;
      if(a<-0.02||b<-0.02||c<-0.02) continue; f(y*CW+x,a,b,c); } };
  const regU=new Float32Array(nU*2), regUB=new Float32Array(nU); uniq.forEach((i,j)=>{ regU[j*2]=reg[i*2]; regU[j*2+1]=reg[i*2+1]; regUB[j]=regB[i]; });
  for(let t=0;t<idxK.length;t+=3){ const a=idxK[t],b=idxK[t+1],c=idxK[t+2]; const m=M2[a];
    rast(a,b,c,(p,wa,wb,wc)=>{ deck[p]=1; if(art[m]==='koerper'){ regT[p*2]+=regU[a*2]*wa+regU[b*2]*wb+regU[c*2]*wc; regT[p*2+1]+=regU[a*2+1]*wa+regU[b*2+1]*wb+regU[c*2+1]*wc; regTB[p]+=regUB[a]*wa+regUB[b]*wb+regUB[c]*wc; regN[p]+=1; } }); }
  for(let t=0;t<idxH.length;t+=3) rast(idxH[t],idxH[t+1],idxH[t+2],p=>{ deck[p]=1; });
  /* Hautfarbe aus dem Gesicht (Wangen) */
  const kx=ATL.kopf[0]*2, ky=ATL.kopf[1]*2, kw=ATL.kopf[2]*2;
  let hs=[0,0,0], hn=0; for(const [fx,fy] of [[0.36,0.42],[0.64,0.42],[0.5,0.3]]) for(let dy=-6;dy<=6;dy++) for(let dx=-6;dx<=6;dx++){ const p=((ky+Math.round(fy*kw)+dy)*CW+kx+Math.round(fx*kw)+dx)*4; hs[0]+=px[p]; hs[1]+=px[p+1]; hs[2]+=px[p+2]; hn++; }
  hs=hs.map(x=>x/hn); info.haut=hs.map(Math.round);
  /* Farbcluster im Koerperbereich (k-means, 8 Cluster) */
  const BX=ATL.koerper[2]*2, BY=ATL.koerper[3]*2, samples=[];
  for(let y=0;y<BY;y+=2) for(let x=0;x<BX;x+=2){ const p=y*CW+x; if(!deck[p]||!regN[p]) continue; samples.push(p); }
  const K=8; let cent=[]; for(let k=0;k<K;k++){ const p=samples[Math.floor((k+0.5)/K*samples.length)]; cent.push([px[p*4],px[p*4+1],px[p*4+2]]); }
  const lab=new Uint8Array(CW*CH).fill(255);
  for(let it=0;it<12;it++){ const sum=cent.map(()=>[0,0,0,0]);
    for(const p of samples){ let best=0,bd=1e18; for(let k=0;k<K;k++){ const d=(px[p*4]-cent[k][0])**2+(px[p*4+1]-cent[k][1])**2+(px[p*4+2]-cent[k][2])**2; if(d<bd){bd=d;best=k;} } lab[p]=best; const s=sum[best]; s[0]+=px[p*4]; s[1]+=px[p*4+1]; s[2]+=px[p*4+2]; s[3]++; }
    cent=cent.map((c,k)=>sum[k][3]?[sum[k][0]/sum[k][3],sum[k][1]/sum[k][3],sum[k][2]/sum[k][3]]:c); }
  /* Stimmen je Cluster */
  const st=cent.map(()=>({n:0,ob:0,un:0}));
  for(const p of samples){ const k=lab[p], s=st[k], n=regN[p]; s.n++; s.ob+=regT[p*2]/n; s.un+=regT[p*2+1]/n; }
  const hsv=c=>{ const r=c[0]/255,g=c[1]/255,b=c[2]/255, mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn; let h=0;
    if(d>1e-6){ if(mx===r) h=((g-b)/d)%6; else if(mx===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; if(h<0) h+=360; }
    return [h,mx?d/mx:0,mx]; };
  const hH=hsv(hs);
  /* Haut: Farbton nahe am Gesicht (orange, 5-45 Grad), aehnliche Saettigung, nicht viel dunkler */
  const hautD=c=>{ const q=hsv(c); let dh=Math.abs(q[0]-hH[0]); dh=Math.min(dh,360-dh);
    return dh<14&&Math.abs(q[1]-hH[1])<0.2&&q[2]>hH[2]*0.55&&q[2]<hH[2]*1.35?0:999; };
  const cl=cent.map((c,k)=>{ const s=st[k]; const ob=s.ob/Math.max(1,s.n), un=s.un/Math.max(1,s.n), rest=1-ob-un;
    let art2='nichts'; const ob0=s.ob/Math.max(1,s.n), un0=s.un/Math.max(1,s.n);
    /* Kleidung in Hautfarbe (Khaki, Beige): per Figur abschaltbar, wenn der Cluster klar am Bein bzw. Rumpf liegt */
    const haut=hautD(c)<(cfg.hautTol||55)&&!(cfg.hautNeinBein&&un0>0.85)&&!(cfg.hautNeinOben&&ob0>0.85);
    if(!haut&&s.n>samples.length*0.01){ if(ob>0.6) art2='oben'; else if(un>0.6) art2='unten'; else if(ob+un>0.6) art2='gemischt'; }
    return {c:c.map(Math.round),n:s.n,anteil:+(s.n/samples.length).toFixed(3),ob:+ob.toFixed(2),un:+un.toFixed(2),haut,art:art2}; });
  /* Kleine Akzente (Krawatte, Knoepfe) behalten ihre Farbe: nur Cluster mit >=12 % ihrer Region */
  const sumArt={oben:0,unten:0}; cl.forEach(c=>{ if(c.art==='oben'||c.art==='unten') sumArt[c.art]+=c.n; });
  cl.forEach(c=>{ if((c.art==='oben'||c.art==='unten')&&c.n<sumArt[c.art]*0.12) c.art='akzent'; });
  if(cfg.cluster) cfg.cluster.forEach((a,k)=>{ if(a) cl[k].art=a; });
  info.cluster=cl;
  /* Maske je Texel: oben 1.0, unten 0.6, sonst 0.8 */
  const maske=new Float32Array(CW*CH).fill(0.8); const lumS={oben:[0,0,0],unten:[0,0,0]}; const linF=c=>{ c/=255; return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4); };
  for(let y=0;y<BY;y++) for(let x=0;x<BX;x++){ const p=y*CW+x; if(!deck[p]||!regN[p]) continue;
    /* Cluster des Texels (auch ungerade Texel) */
    let best=0,bd=1e18; for(let k=0;k<K;k++){ const d=(px[p*4]-cent[k][0])**2+(px[p*4+1]-cent[k][1])**2+(px[p*4+2]-cent[k][2])**2; if(d<bd){bd=d;best=k;} }
    let a=cl[best].art; const n=regN[p]; if(a==='gemischt'){ a=regT[p*2]/n>regT[p*2+1]/n?'oben':'unten'; }
    /* Farbe passt zum Oberteil, liegt aber klar am Bein (helle Jeansstellen) - und umgekehrt */
    if(a==='oben'&&regTB[p]/n>0.5) a='unten'; else if(a==='unten'&&regT[p*2]/n>0.6) a='oben';
    else if((a==='nichts'||a==='akzent')&&!cl[best].haut&&regTB[p]/n>0.7) a='unten';
    /* Schuhe, Haende, Hals: weder Rumpf/Arm noch Bein - bleiben, wie sie sind */
    if(regT[p*2]/n<0.25&&regT[p*2+1]/n<0.25) a='nichts';
    if(a==='oben'||a==='unten'){ maske[p]=a==='oben'?1.0:0.6; const l=0.2126*px[p*4]+0.7152*px[p*4+1]+0.0722*px[p*4+2]; lumS[a][0]+=l; lumS[a][1]++; lumS[a][2]+=0.2126*linF(px[p*4])+0.7152*linF(px[p*4+1])+0.0722*linF(px[p*4+2]); } }
  info.lum={oben:lumS.oben[1]?+(lumS.oben[0]/lumS.oben[1]/255).toFixed(3):0,unten:lumS.unten[1]?+(lumS.unten[0]/lumS.unten[1]/255).toFixed(3):0,
    obenLin:lumS.oben[1]?+(lumS.oben[2]/lumS.oben[1]).toFixed(4):0,untenLin:lumS.unten[1]?+(lumS.unten[2]/lumS.unten[1]).toFixed(4):0,
    anteilOben:+(lumS.oben[1]/(BX*BY)).toFixed(3),anteilUnten:+(lumS.unten[1]/(BX*BY)).toFixed(3)};
  /* Alpha: Koerper/Kopf = Maske, Haar = Deckkraft */
  const inHaar=(x,y)=>x>=ATL.haar[0]*2;
  for(let y=0;y<CH;y++) for(let x=0;x<CW;x++){ const p=y*CW+x; if(inHaar(x,y)) continue; px[p*4+3]=Math.round(maske[p]*255); }
  /* Raender ausbluten lassen (Mipmaps ziehen sonst Schwarz in die Naehte) */
  const frei=new Uint8Array(CW*CH); for(let p=0;p<CW*CH;p++) frei[p]=deck[p]?0:1;
  for(let pass=0;pass<12;pass++){ const neuF=[];
    for(let y=0;y<CH;y++) for(let x=0;x<CW;x++){ const p=y*CW+x; if(!frei[p]) continue; let r=0,g2=0,b=0,a=0,n=0;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const X=x+dx,Y=y+dy; if(X<0||Y<0||X>=CW||Y>=CH) continue; const q=Y*CW+X; if(frei[q]) continue;
        if(inHaar(x,y)!==inHaar(X,Y)) continue; r+=px[q*4]; g2+=px[q*4+1]; b+=px[q*4+2]; a+=px[q*4+3]; n++; }
      if(n) neuF.push([p,r/n,g2/n,b/n,a/n]); }
    for(const [p,r,g2,b,a] of neuF){ px[p*4]=r; px[p*4+1]=g2; px[p*4+2]=b; if(!inHaar(p%CW,0)) px[p*4+3]=a; frei[p]=0; } }
  g.putImageData(img,0,0);
  const cv2=document.createElement('canvas'); cv2.width=ATL.W; cv2.height=ATL.H; const g2=cv2.getContext('2d');
  g2.imageSmoothingQuality='high'; g2.drawImage(cv,0,0,ATL.W,ATL.H);
  const atlas=cv2.toDataURL('image/webp',cfg.q||0.75);
  info.atlasKB=Math.round(atlas.length*0.75/1024);
  info.geoKB=Math.round((buf.byteLength+iD.byteLength+iH.byteLength)/1024);
  window._letzterAtlas=cv2;
  return {info,daten:{id:cfg.id,knochen:rest.map(r=>({n:r.n.replace('Bip01_','').replace('Bip01','Wurzel'),p:r.p,pos:r.pos,q:r.q})),
    min:mn.map(x=>+x.toFixed(3)),max:mx.map(x=>+x.toFixed(3)),nV:nn,nD:iD.length,nH:iH.length,
    v:b64(new Uint8Array(buf)),iD:b64(new Uint8Array(iD.buffer)),iH:b64(new Uint8Array(iH.buffer)),atlas,lum:info.lum}};
};

/* Animation: lokale Quaternionen der 27 Knochen, gleichmaessig abgetastet */
window.konvAnim=async(cfg)=>{
  const o=await ladeFBX(cfg.fbx);
  const clip=o.animations[0]; const fps=cfg.fps||30; const von=cfg.von||0, bis=Math.min(cfg.bis||clip.duration,clip.duration);
  const n=Math.max(2,Math.round((bis-von)*fps)+ (cfg.offen?1:0));
  const mixer=new THREE.AnimationMixer(o); const act=mixer.clipAction(clip); act.play();
  const alle={}; o.traverse(q=>{ if(q.isBone) alle[q.name]=q; });
  const qs=new Int16Array(n*KEEP.length*4), wurzel=new Float32Array(n*3);
  const vor=KEEP.map(()=>null);
  for(let f=0;f<n;f++){ mixer.setTime(von+(bis-von)*f/(cfg.offen?n-1:n));
    KEEP.forEach((nm,b)=>{ const B=alle[nm]; if(!B) throw new Error('Knochen fehlt in Animation: '+nm); const q=B.quaternion.clone();
      if(vor[b]&&vor[b].dot(q)<0){ q.x=-q.x; q.y=-q.y; q.z=-q.z; q.w=-q.w; } vor[b]=q.clone();
      const o2=(f*KEEP.length+b)*4; qs[o2]=Math.round(q.x*32767); qs[o2+1]=Math.round(q.y*32767); qs[o2+2]=Math.round(q.z*32767); qs[o2+3]=Math.round(q.w*32767); });
    const r=alle.Bip01.position; wurzel.set([r.x,r.y,r.z],f*3); }
  const b64=u8=>{ let s=''; const B=0x8000; for(let i=0;i<u8.length;i+=B) s+=String.fromCharCode.apply(null,u8.subarray(i,i+B)); return btoa(s); };
  return {id:cfg.id,n,dauer:bis-von,fps,q:b64(new Uint8Array(qs.buffer)),w:Array.from(wurzel).map(x=>+x.toFixed(2)),dauerClip:clip.duration};
};
