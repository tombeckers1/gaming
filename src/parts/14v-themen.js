/* =========================================================
   Zehn Themen-Batterien (06.10., Tom im PDF: "Mache mir 10 neue
   Batterien. 'Kirschbluete' finde ich sehr schoen. Der Name passt
   seeehr gut zum Effekt. Nimm es als Referenz - aber nicht um es zu
   kopieren, sondern um die kohaerente Schoenheit des Produktes zu
   identifizieren" und "Erkenne die Gesamtheit der Muster ... und
   kreiere mir das perfekte Feuerwerk, aufbauend von Low- zu High-Level").

   DESIGNREGEL (abgeleitet aus Kirschbluete, 15 Schuss, L6):
   1 Ein Bild. Das Thema ist ein Ding aus der Natur, das jeder vor Augen
     hat (Bluetenzweig). Jeder Effekt zeigt einen Teil davon: der
     Kirschkranz die sich oeffnende Bluete, der Lilienkomet die
     fallenden Blaetter. Was nicht zum Bild gehoert, kommt nicht hinein.
   2 Wenige Effekte: zwei, hoechstens drei Bruchbilder - erst bei grossen
     Batterien ein viertes als Abschnitt. Jedes darf wiederkommen, aber
     nie zweimal gleich (einzeln, paarweise, im Kreis, als Finale).
   3 Eine Farbfamilie in den echten Farben des Dings (Rosa, Weiss,
     Pfirsich, ein Hauch Gold) - keine Fremdfarbe, kein Bunt.
   4 Die Bewegung passt zum Ding: Blueten oeffnen sich langsam, Blaetter
     sinken. Nichts knallt, was in der Natur nicht knallt.
   5 Der Klang kommt aus dem Material: zart heisst Rieseln und Ploppen;
     Eis klirrt, Laub raschelt, Wasser blubbert, Lava grollt.
   6 Der Ablauf erzaehlt: einzeln - paarweise - im Kreis - Finale. Erst
     zeigen, dann steigern. Keine Opener-Fontaene, keine Standardfolge.
   7 Ein Loch, ein Schuss: jeder Effekt kommt aus seinem Rohr, eine
     Bluete aus einem Rohr; keine Faecher aus einem Rohr.
   8 Name = Bild. Wer den Namen liest, weiss, was er sehen wird.
   Darum hier je Batterie: ein Thema, eine Farbfamilie, eigene
   Bruchbilder (neu, nach echten Effekten: Falling Leaves, Fish,
   Tourbillon-Wirbel, Pistill, Crossette, Kamuro, Ring), eigener Klang,
   eigene Rohrfolge (Zuendschnur) und eigene Dramaturgie. Von Level 4 bis
   25 steigen Hoehe, Groesse, Dauer und Dichte.
   ========================================================= */

/* ---------- Farben der Themen ---------- */
Object.assign(FW,{
  lavendel:[.6,.32,1], rost:[1,.34,.06], mond:[1,.93,.72], eisblau:[.62,.86,1],
  smaragd:[.1,1,.5], sonnengelb:[1,.84,.16], lava:[1,.2,.03]
});
Object.assign(THEMEN,{
  lb_tautropfen:[['silber','mint'],['weiss','silber'],['mint','weiss']],
  lb_zitronenfalter:[['zitrone','weiss'],['zitrone','gold'],['weiss','zitrone']],
  lb_lavendelfeld:[['lavendel','silber'],['violett','lavendel'],['indigo','silber']],
  lb_herbstlaub:[['bernstein','rost'],['rost','scharlach'],['scharlach','bernstein']],
  lb_kolibri:[['smaragd','tuerkis'],['tuerkis','smaragd'],['smaragd','mint']],
  lb_vollmond:[['mond','silber'],['silber','mond'],['mond','weiss']],
  lb_lagune:[['aqua','tuerkis'],['tuerkis','mint'],['mint','aqua']],
  lb_sonnenblumen:[['sonnengelb','braun'],['zitrone','bernstein'],['bernstein','sonnengelb']],
  lb_gletscher:[['eisblau','weiss'],['weiss','eisblau'],['blau','eisblau']],
  lb_vulkan:[['lava','orange'],['orange','bernstein'],['rot','lava'],['bernstein','rot']]
});

/* ---------- Klaenge aus dem Material (Tom, 03.10.: "verschiedene
   Explosionssounds ... nicht immer Peng"; keine Pfeifen) ---------- */
Object.assign(sfx,{
  /* Wassertropfen: ganz kurzes Plink, der Ton springt nach oben (0,05 s) */
  tropf:v=>{ if(!AC) return; tone(rand(650,850),0.05,'sine',0.045*v,rand(1500,1900)); rauschF({dur:0.015,vol:0.05*v,typ:'highpass',f:4000}); },
  /* Fluegelschlag: weiche Papier-Schlaege, hell gefiltert */
  fluegel:(v,dur)=>{ if(!AC) return; const n=Math.round((dur||0.8)/0.075); for(let i=0;i<n;i++) bkR(i*0.075+rand(0,0.015),{dur:0.045,vol:0.045*v,typ:'bandpass',f:rand(2000,2800),q:0.8}); },
  /* Sommerwind ueber dem Feld: rosa Rauschen schwillt an und ab */
  wind:(v,dur)=>{ dur=dur||2.5; rauschF({dur,vol:0.08*v,typ:'bandpass',f:450,f2:1100,q:0.7,rosa:true,an:dur*0.45}); },
  /* trockenes Laub: viele kurze Knister-Rascheln */
  rascheln:(v,dur)=>{ if(!AC) return; dur=dur||2.5; const n=Math.round(dur*14); for(let i=0;i<n;i++) bkR(rand(0,dur),{dur:rand(0.025,0.07),vol:0.055*v*rand(0.4,1),typ:'bandpass',f:rand(1600,3600),q:1.4}); },
  /* Schwirren (Kolibri): feine Fluegelpulse, sehr leise */
  schwirren:(v,dur)=>{ if(!AC) return; dur=dur||0.3; for(let t=0;t<dur;t+=0.028) bkR(t,{dur:0.02,vol:0.03*v,typ:'bandpass',f:1100,q:1.2}); },
  /* Blubbern: Blasen - kurze Toene, die nach oben springen, dumpf */
  blubbern:(v,n)=>{ if(!AC) return; let t=0; for(let i=0;i<(n||5);i++){ t+=rand(0.05,0.18); bkT(t,rand(220,380),rand(520,820),0.07,0.06*v); bkR(t,{dur:0.05,vol:0.05*v,f:500}); } },
  /* Pochen (Vollmond): ein weiches, tiefes Pochen statt Knall */
  pochen:v=>{ if(!AC) return; bkT(0,72,44,0.38,0.13*v); bkR(0,{dur:0.45,vol:0.16*v,f:320,f2:110}); },
  /* Kalben: Bruch, dann dumpfes Rollen */
  kalben:v=>{ if(!AC) return; bkR(0,{dur:0.07,vol:0.4*v,typ:'highpass',f:2400}); bkT(0.05,52,28,0.9,0.3*v); later(0.1,()=>grollen(2.6,0.75*v,110,0.3)); },
  /* Vulkan: tiefes Grollen aus der Aschewolke */
  vulkangrollen:v=>{ if(!AC) return; grollen(3.2,0.9*v,90,0.5); bkT(0,40,26,1.6,0.22*v); }
});

/* ---------- Werkzeuge ---------- */
/* fn(t) einmal je Bild, dauer s lang, mit der Show-Kennung */
function thJeBild(dauer,fn){ const tag=FW_TAG; for(let t=1/30;t<dauer;t+=1/30){ const tt=t; imBild(tt,()=>{ const at=FW_TAG, sa=SCHWEIF; FW_TAG=tag; try{ fn(tt); } finally { FW_TAG=at; SCHWEIF=sa; } }); } }
/* Stern beginnt zu fallen: Schwere g, neue Farbe, Schweif */
function thFallen(h,g,c,spur){ if(!kgLebt(h)) return; h.ps.grav[h.i]=g; if(c) kgFarbe(h,c); if(spur!==undefined) h.ps.tl[h.i]=spur; }
/* Leuchtpunkt an einer Stelle (ein Bild lang), mit kurzer Spur in Richtung w */
function thPunkt(ps,q,w,c,L){ ps.emit(q.x,q.y,q.z,w[0],w[1],w[2],c[0],c[1],c[2],L||0.07,0,0); }
const thAdd=(p,a,k)=>({x:p.x+a[0]*k,y:p.y+a[1]*k,z:p.z+a[2]*k});
/* Dunkler Aufstieg wie lDunkel (14m), aber das schwache Glimmen hat die
   Farbe des Themas statt Orange - Eis steigt blaeulich, Lava rot */
function thDunkel(o,s,opt,H,A,fn){
  const m=lMund(o), G=6, v=lAbschuss((H||27)*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,kgMal(lHell(A,1),0.4),T,G,0,0.2); lStart(m,0.8,0.7);
  kgSpaeter(T,()=>fn(sternNach(m,v[0],v[1],v[2],G,T),bahnTempo(v,G,T)));
}
/* Laub taumelt: jedes Blatt pendelt quer, dreht sich (flackert) und
   sinkt langsam; der Wind schiebt alle in eine Richtung */
function thTaumeln(blaetter,dauer,Q,wind){
  thJeBild(dauer,t=>{ for(const b of blaetter){ const h=b.h; if(t<b.los||!kgLebt(h)) continue; const j=h.i*3, V=h.ps.vel, sw=Math.cos(b.ph+t*b.om)*b.amp+wind;
    V[j]=Q[0]*sw+b.z*0.2; V[j+2]=Q[2]*sw-b.x*0.2; if(V[j+1]<-1.2) V[j+1]=-1.2;
    const hl=0.25+1.0*Math.abs(Math.sin(b.ph2+t*b.om2)); kgFarbe(h,kgMal(b.c,hl));
    if(t<dauer-0.8){ const P=h.ps.pos; psMid.emit(P[j],P[j+1],P[j+2],rand(-.1,.1),rand(-.3,-.1),rand(-.1,.1),b.c[0]*0.75,b.c[1]*0.6,b.c[2]*0.5,rand(0.7,1.2),0.4,4); } } });
}

/* =========================================================
   1 TAUTROPFEN (L4, 10 Schuss) - Silber und Mint, Plink
   ========================================================= */
/* Tauperle: ein zarter Silberkomet; oben oeffnet sich eine kleine
   Krone aus Tauperlen, die einen Atemzug lang fast stillstehen und dann
   als silberne Faeden herabtropfen (Time-Rain) - jeder Faden glitzert
   und endet in einem mintfarbenen Tropfen; dazu ein leises Plink */
LICHTYP.tauperle=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(22*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,lHell(A,1.2),T,G,0,0.3); lFunken(m,v,G,0.03,T,60,mischF(lHell(A,1),[1,1,1],0.4),{ps:psMid,life:[0.35,0.7],g:2,streu:0.15,mit:0.1,mode:4}); lStart(m,0.7,0.3);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T), n=Math.round(14*QUAL())+5;
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+rand(-0.2,0.2), w=rand(3.2,4.0)*Math.sqrt(s), dv=[Math.cos(a)*w,rand(0.8,1.8),Math.sin(a)*w], hang=rand(0.5,1.2), L=hang+rand(1.6,2.1);
      const h=kgStern(psBig,e,dv,lHell(i%3?A:[1,1,1],1.3),L,0.8,4,0.25);
      lFunken(e,dv,0.8,0.05,hang,26,lHell(A,0.95),{ps:psMid,life:[0.5,0.9],g:0.6,streu:0.06,mit:0.05,mode:4});
      kgSpaeter(hang,()=>{ thFallen(h,4.5,lHell(B,1.15),0.55); if(!kgLebt(h)) return; const [q,w2]=kgOrt(h);
        lFunken(q,w2,4.5,0.02,L-hang-0.2,34,mischF(lHell(A,1),lHell(B,1),0.5),{ps:psMid,life:[0.45,0.8],g:0.9,streu:0.05,mit:0.1,mode:4});
        if(i%4===0) schall(q,x=>sfx.tropf(x*0.7)); }); }
    schall(e,x=>sfx.rieseln(x*0.3,2)); });
};
/* Tropfenkette: der Komet laesst auf dem letzten Stueck alle Handbreit
   einen Tropfen haengen - wie Tau an einem Spinnfaden -, die Tropfen
   fallen von unten nach oben ab und ziehen Glitzerfaeden */
LICHTYP.tropfenkette=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(23*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G)+0.15;
  lKopf(m,v,lHell(A,1.25),T,G,0,0.3); lFunken(m,v,G,0.03,T,50,lHell(A,0.9),{ps:psMid,life:[0.4,0.8],g:1.5,streu:0.08,mit:0.05,mode:4}); lStart(m,0.8,0.3);
  let k=0; for(let t=T*0.35;t<T;t+=0.1){ const tt=t, nr=k++; kgSpaeter(tt,()=>{ const q=sternNach(m,v[0],v[1],v[2],G,tt), u=bahnTempo(v,G,tt), dv=[u[0]*0.08,0.15,u[2]*0.08], hang=0.8+nr*0.1+(T-tt)*0.3;
    const h=kgStern(psBig,q,dv,lHell(nr%3?A:[1,1,1],1.35),hang+1.9,0.25,4,0.04);
    kgSpaeter(hang,()=>{ thFallen(h,4.5,lHell(B,1.2),0.55); if(!kgLebt(h)) return; const [q2,w2]=kgOrt(h);
      lFunken(q2,w2,4.5,0.02,1.6,30,mischF(lHell(A,1),lHell(B,1),0.5),{ps:psMid,life:[0.4,0.75],g:0.9,streu:0.05,mit:0.1,mode:4});
      if(nr%3===1) schall(q2,x=>sfx.tropf(x*0.6)); }); }); }
};

/* =========================================================
   2 ZITRONENFALTER (L7, 16 Schuss) - Zitronengelb, Fluegelschlag
   ========================================================= */
/* Flatterkomet: steigt im Zickzack wie ein Falter (Fluegelschlag 3-4 Hz:
   hell beim Schlag, seitliches Pendeln), oben noch drei, vier Hakenspruenge,
   dann verglimmt er - kein Knall */
LICHTYP.flatterkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(23*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G), Q=lQuer({dir:FANDIR});
  const ph=rand(0,6.3), f=rand(3.2,4.2), amp=0.55*Math.sqrt(s), nH=3+(Math.random()<0.5?1:0), H=[bahnOrt(m,v,G,T)];
  for(let k=0;k<nH;k++){ const a=rand(0,Math.PI*2), l=rand(1.8,2.8)*Math.sqrt(s), p=H[k]; H.push({x:p.x+Q[0]*Math.cos(a)*l,y:p.y+Math.sin(a)*l*0.6-0.4,z:p.z+Q[2]*Math.cos(a)*l}); }
  const D=T+nH*0.34+0.35, cA=lHell(A,1.45), cG=mischF(lHell(A,1.05),[1,1,.8],0.35);
  lStart(m,0.7,0.3); sfx.fluegel(distVol(m)*0.6,Math.min(1.2,T));
  thJeBild(D,t=>{ let b, w0;
    if(t<=T){ b=bahnOrt(m,v,G,t); w0=bahnTempo(v,G,t); }
    else { const k=Math.min(nH-1,Math.floor((t-T)/0.34)), u=Math.min(1,((t-T)-k*0.34)/0.34), a=H[k], c=H[k+1], e=u<0.5?2*u*u:1-2*(1-u)*(1-u);
      b={x:a.x+(c.x-a.x)*e,y:a.y+(c.y-a.y)*e,z:a.z+(c.z-a.z)*e}; w0=[(c.x-a.x)*0.5,(c.y-a.y)*0.5,(c.z-a.z)*0.5]; }
    const wf=Math.sin(ph+t*f*2*Math.PI), lat=wf*amp*Math.min(1,t/0.4), q={x:b.x+Q[0]*lat,y:b.y+Math.abs(wf)*0.18,z:b.z+Q[2]*lat};
    const aus=t>T?Math.max(0,1-(t-T)/(D-T))*0.6+0.4:1, k=(0.5+0.75*Math.abs(Math.cos(ph+t*f*2*Math.PI)))*aus;
    SCHWEIF=0.2; thPunkt(psHuge,q,kgMal(w0,0.12),kgMal(cA,k),0.07);
    for(let i=0;i<Math.round(4*QUAL())+1;i++) psMid.emit(q.x,q.y,q.z,rand(-.2,.2),rand(-.4,0),rand(-.2,.2),cG[0],cG[1],cG[2],rand(0.6,1.1)*aus,0.8,4);
    if(Math.random()<0.5) psBig.emit(q.x,q.y,q.z,rand(-.15,.15),rand(-.3,0),rand(-.15,.15),cG[0],cG[1],cG[2],rand(0.4,0.7)*aus,0.8,4);
  });
};
/* Falterpaar: oben trennt sich der Komet in zwei kleine Falter, die
   einander umtanzen, dabei langsam abtreiben und sinken - am Ende ein
   Hauch weisser Glitzer */
LICHTYP.falterpaar=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(24*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,lHell(A,1.2),T,G,0,0.2); lFunken(m,v,G,0.03,T,40,mischF(lHell(A,1),[1,1,.8],0.4),{ps:psMid,life:[0.3,0.6],g:2,streu:0.15,mit:0.1,mode:4}); lStart(m,0.8,0.3);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T), Q=lQuer({dir:FANDIR}), drift=(Math.random()<0.5?-1:1)*rand(0.7,1.1)*Math.sqrt(s), R=0.95*Math.sqrt(s), om=rand(5,6.5), ph=rand(0,6.3), D=2.4;
    const cA=lHell(A,1.45), cB=lHell(B,1.4); sfx.fluegel(distVol(e)*0.5,1.2);
    thJeBild(D,t=>{ const c={x:e.x+Q[0]*drift*t,y:e.y-0.35*t*t,z:e.z+Q[2]*drift*t}, aus=t>D-0.6?(D-t)/0.6:1;
      [0,Math.PI].forEach((d,k)=>{ const a=ph+om*t+d, wf=Math.abs(Math.sin(t*22+k)), q={x:c.x+Q[0]*Math.cos(a)*R,y:c.y+Math.sin(a)*R*0.7,z:c.z+Q[2]*Math.cos(a)*R};
        SCHWEIF=0.15; thPunkt(psHuge,q,[0,0,0],kgMal(k?cB:cA,(0.55+0.6*wf)*aus),0.07);
        for(let j=0;j<Math.round(3*QUAL())+1;j++) psMid.emit(q.x,q.y,q.z,rand(-.2,.2),rand(-.4,0),rand(-.2,.2),cA[0]*0.85,cA[1]*0.85,cA[2]*0.7,rand(0.6,1.0)*aus,0.7,4);
        if(Math.random()<0.4) psBig.emit(q.x,q.y,q.z,rand(-.15,.15),rand(-.3,0),rand(-.15,.15),cA[0],cA[1],cA[2]*0.8,rand(0.4,0.7)*aus,0.7,4); });
      if(Math.abs(t-(D-0.5))<1/60) for(let j=0;j<Math.round(10*QUAL());j++){ const dd=randDir(); psSmall.emit(c.x,c.y,c.z,dd[0]*1.6,dd[1]*1.6,dd[2]*1.6,1.5,1.5,1.3,rand(0.2,0.5),1,1); } });
    schall(e,x=>sfx.rieseln(x*0.3,1.6)); });
};

/* =========================================================
   3 LAVENDELFELD (L9, 18 Schuss) - Lila und Silber, Sommerwind
   ========================================================= */
/* Lavendelrispe: ein feiner Silberkomet, auf dem obersten Drittel setzt
   er dicht an dicht kleine lila Bluetenquirle - eine Aehre, oben
   schmaler; der Wind wiegt die ganze Rispe zur Seite */
LICHTYP.lavendelrispe=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(24*Math.sqrt(s),G,opt,0.25), T=lScheitel(v[1],G)+0.1, Q=lQuer({dir:FANDIR}), wind=(Math.random()<0.5?-1:1)*rand(0.4,0.7);
  kgStern(psBig,m,v,lHell(B,1.15),T,G,0,0.3); lFunken(m,v,G,0.03,T*0.6,40,lHell(B,0.9),{ps:psMid,life:[0.3,0.5],g:2,streu:0.12,mit:0.1,mode:4}); lStart(m,0.8,0.4);
  const t0=T*0.3, nq=Math.round(19*Math.min(1.2,QUAL()+0.3));
  for(let k=0;k<nq;k++){ const tt=t0+(T-t0)*k/(nq-1); kgSpaeter(tt,()=>{ const q=sternNach(m,v[0],v[1],v[2],G,tt), u=bahnTempo(v,G,tt), nb=Math.max(2,Math.round((6-k*0.22)*QUAL()+1));
    for(let i=0;i<nb;i++){ const a=rand(0,Math.PI*2), w=rand(0.35,0.8)*Math.sqrt(s)*(1-k*0.03), dv=[Math.cos(a)*w+Q[0]*wind+u[0]*0.1,rand(-0.1,0.25)+u[1]*0.05,Math.sin(a)*w+Q[2]*wind+u[2]*0.1];
      const h=kgStern(psBig,q,dv,lHell(i%4?A:B,i%4?1.25:1.1),rand(2.6,3.4),0.35,0,0.12); kgSpaeter(rand(1.2,1.8),()=>kgFarbe(h,mischF(lHell(A,1.2),[1.2,1.2,1.3],0.35))); } }); }
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T); schall(e,x=>sfx.wind(x*0.8,2.6)); });
};
/* Duftwolke: dunkler Aufstieg, dann oeffnet sich eine weiche, haengende
   Wolke aus lila Sternen mit Silberglitzer-Schweifen - wie Duft, der
   ueber dem Feld liegt */
LICHTYP.duftwolke=function(o,A,B,s,opt){
  thDunkel(o,s,opt,25,A,e=>{ const n=Math.round(46*QUAL())+10, Q=lQuer({dir:FANDIR}), wind=rand(-0.6,0.6);
    for(let i=0;i<n;i++){ const d=randDir(), w=rand(4.6,5.8)*Math.sqrt(s), dv=[d[0]*w+Q[0]*wind,d[1]*w*0.85+0.6,d[2]*w+Q[2]*wind], L=rand(2.6,3.3);
      kgStern(psBig,e,dv,lHell(i%3?A:B,i%3?1.05:0.9),L,1.3,0,0.3);
      if(i%3===0) lFunken(e,dv,1.3,0.1,L*0.8,12,lHell(A,0.85),{ps:psMid,life:[0.6,1.1],g:0.8,streu:0.1,mit:0.05,mode:4}); }
    schall(e,x=>{ sfx.plopp(x*0.3,1.1); later(0.3,()=>sfx.wind(x*0.7,3)); }); });
};

/* =========================================================
   4 HERBSTLAUB (L12, 22 Schuss) - Bernstein, Rost, Scharlach; Rascheln
   ========================================================= */
/* Blaetterfall (echtes Vorbild: "Falling Leaves"): dunkler Aufstieg,
   ein lockerer Bruch, dann taumeln die Blaetter: jedes pendelt quer,
   dreht sich (flackert hell-dunkel) und sinkt langsam, der Wind traegt
   alle ein Stueck zur Seite */
LICHTYP.blaetterfall=function(o,A,B,s,opt){
  thDunkel(o,s,opt,25,A,e=>{ const n=Math.round(15*QUAL())+5, Q=lQuer({dir:FANDIR}), wind=(Math.random()<0.5?-1:1)*rand(0.3,0.7), bl=[], F=[A,B,mischF(A,B,0.5)];
    for(let i=0;i<n;i++){ const d=randDir(), w=rand(3.5,5.2)*Math.sqrt(s), dv=[d[0]*w,d[1]*w*0.7+1,d[2]*w], c=lHell(F[i%3],1.3);
      const h=kgStern(psBig,e,dv,c,rand(4.2,5.2),0.9,0,0.12);
      bl.push({h,c,los:rand(0.5,0.8),ph:rand(0,6.3),om:rand(2.2,3.4),amp:rand(0.7,1.3)*Math.sqrt(s),ph2:rand(0,6.3),om2:rand(3,6),x:d[0],z:d[2]}); }
    thTaumeln(bl,5.2,Q,wind);
    schall(e,x=>{ sfx.plopp(x*0.35,0.9); later(0.4,()=>sfx.rascheln(x*0.7,3.2)); }); });
};
/* Laubwirbel (Tourbillon-Vorbild): ein Rostkomet, oben fasst ihn ein
   Windstoss - ein Kreis aus Blaettern dreht sich auf, weitet sich, und
   dann laesst der Wind los: die Blaetter taumeln einzeln herab */
LICHTYP.laubwirbel=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(25*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  lKopf(m,v,lHell(A,1.35),T,G,0,0.25); lFunken(m,v,G,0.03,T,70,mischF(lHell(A,1),[1,.7,.3],0.4),{ps:psMid,life:[0.4,0.8],g:2.2,streu:0.2,mit:0.1,mode:4}); lStart(m,1,0.5);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T), [r1,r2]=rkBild(e), Q=lQuer({dir:FANDIR}), n=Math.round(10*QUAL())+5, D=1.7, F=[A,B,mischF(A,B,0.5)];
    const a0=rand(0,6.3), dreh=Math.random()<0.5?-1:1, R=t=>4.6*Math.sqrt(s)*(1-Math.exp(-1.8*t));
    /* jedes Blatt auf seinem eigenen Radius - eine Spirale, kein Ring */
    const ort=(i,t)=>{ const a=a0+i*2.39996+dreh*(5*t-1.2*t*t/D), r=R(t)*(0.3+0.7*((i*0.618)%1)); return {x:e.x+(r1[0]*Math.cos(a)+r2[0]*Math.sin(a)*0.6)*r,y:e.y-0.4*t*t+r2[1]*Math.sin(a)*0.6*r,z:e.z+(r1[2]*Math.cos(a)+r2[2]*Math.sin(a)*0.6)*r}; };
    thJeBild(D,t=>{ for(let i=0;i<n;i++){ const q=ort(i,t), p0=ort(i,Math.max(0,t-1/30)), w=[(q.x-p0.x)*30,(q.y-p0.y)*30,(q.z-p0.z)*30], c=lHell(F[i%3],1.35), fl=0.5+0.8*Math.abs(Math.sin(t*8+i));
      SCHWEIF=0.5; thPunkt(psBig,q,w,kgMal(c,fl),0.07); if(i%2===Math.round(t*30)%2) psMid.emit(q.x,q.y,q.z,rand(-.1,.1),rand(-.3,-.1),rand(-.1,.1),c[0]*0.7,c[1]*0.6,c[2]*0.5,rand(0.5,0.9),0.5,4); } });
    kgSpaeter(D,()=>{ const bl=[];
      for(let i=0;i<n;i++){ const q=ort(i,D), p0=ort(i,D-1/30), dv=[(q.x-p0.x)*20,(q.y-p0.y)*20-0.3,(q.z-p0.z)*20], c=lHell(F[i%3],1.3);
        bl.push({h:kgStern(psBig,q,dv,c,rand(3.2,4.0),0.9,0,0.2),c,los:0.3,ph:rand(0,6.3),om:rand(2.2,3.4),amp:rand(0.6,1.1)*Math.sqrt(s),ph2:rand(0,6.3),om2:rand(3,6),x:0,z:0}); }
      thTaumeln(bl,4,Q,dreh*0.5); });
    schall(e,x=>{ sfx.wind(x*0.6,1.6); later(1.4,()=>sfx.rascheln(x*0.6,2.6)); }); });
};

/* =========================================================
   5 KOLIBRI (L14, 24 Schuss) - Smaragd und Tuerkis, Schwirren
   ========================================================= */
/* Schwirrkomet: ein schmaler gruener Komet; oben schiesst der Kopf in
   kurzen, geraden Spruengen hin und her und steht dazwischen schwirrend
   still - dabei schillert er gruen-tuerkis, beim letzten Halt blitzt die
   rubinrote Kehle, dann ist er weg */
LICHTYP.schwirrkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(26*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G), Q=lQuer({dir:FANDIR});
  lKopf(m,v,lHell(A,1.2),T,G,0,0.3); lFunken(m,v,G,0.03,T,90,lHell(A,0.9),{ps:psMid,life:[0.4,0.8],g:2,streu:0.12,mit:0.1,mode:4}); lStart(m,0.8,0.4);
  const nS=4+(Math.random()<0.5?1:0), P=[bahnOrt(m,v,G,T)], DASH=0.11, HALT=0.26;
  for(let k=0;k<nS;k++){ const a=rand(-0.6,0.6)+(Math.random()<0.5?0:Math.PI), l=rand(2.2,3.6)*Math.sqrt(s), p=P[k], up=k===nS-1?2.5:rand(-0.7,0.9);
    P.push({x:p.x+Q[0]*Math.cos(a)*l,y:p.y+up+Math.sin(a)*0.6,z:p.z+Q[2]*Math.cos(a)*l}); }
  const RUBIN=[1.5,.18,.35], cA=lHell(A,1.5), cB=lHell(B,1.5), D=nS*(DASH+HALT);
  kgSpaeter(T,()=>{ const [r1,r2]=rkBild(P[0]); let halt=-1;
    thJeBild(D,t=>{ const k=Math.min(nS-1,Math.floor(t/(DASH+HALT))), u=t-k*(DASH+HALT), a=P[k], c=P[k+1];
      if(u<DASH){ const f=u/DASH, f0=Math.max(0,(u-1/30)/DASH), q={x:a.x+(c.x-a.x)*f,y:a.y+(c.y-a.y)*f,z:a.z+(c.z-a.z)*f}, w=[(c.x-a.x)/DASH,(c.y-a.y)/DASH,(c.z-a.z)/DASH];
        SCHWEIF=0.12; thPunkt(psHuge,q,kgMal(w,0.5),cA,0.06);
        /* der Sprung zieht eine feine Glitzerspur, die noch eine Sekunde steht */
        for(let i=0;i<Math.round(6*QUAL())+2;i++){ const g2=f0+(f-f0)*Math.random(), p={x:a.x+(c.x-a.x)*g2,y:a.y+(c.y-a.y)*g2,z:a.z+(c.z-a.z)*g2};
          psMid.emit(p.x,p.y,p.z,rand(-.08,.08),rand(-.2,0),rand(-.08,.08),cA[0]*0.85,cA[1]*0.85,cA[2]*0.85,rand(0.8,1.3),0.5,4); } }
      else { const kehle=k===nS-2, c2=kehle?RUBIN:cB;
        if(halt!==k){ halt=k; /* Halt: die Fluegel schillern - ein kurzer Kranz aus Federfunken */
          for(let i=0;i<Math.round(12*QUAL())+4;i++){ const b=i/16*Math.PI*2+rand(-.2,.2), w=rand(2.2,3.2)*Math.sqrt(s), dv=[(r1[0]*Math.cos(b)+r2[0]*Math.sin(b))*w,(r2[1]*Math.sin(b))*w,(r1[2]*Math.cos(b)+r2[2]*Math.sin(b))*w];
            kgStern(psBig,c,dv,i%2?c2:cA,rand(0.5,0.8),1,0,0.3); } }
        SCHWEIF=0; thPunkt(psHuge,c,[0,0,0],Math.floor(t*30)%2?cB:cA,0.06); } });
    for(let k=0;k<nS;k++) later(k*(DASH+HALT)+DASH,()=>sfx.schwirren(distVol(P[k+1])*0.8,HALT)); });
};
/* Federkrone: dunkler Aufstieg, oben spreizt sich ein Faecher aus
   Schillerfedern nach oben (wie ein gespreizter Schwanz), jede mit
   dichtem Glitzer; nach einer Sekunde schillern die Federn von Gruen
   nach Tuerkis, die Spitzen glimmen rubinrot */
LICHTYP.federkrone=function(o,A,B,s,opt){
  thDunkel(o,s,opt,26,A,e=>{ const n=Math.round(20*QUAL())+6, [r1,r2,r3]=rkBild(e);
    for(let i=0;i<n;i++){ const a=-0.25*Math.PI+1.5*Math.PI*(i/(n-1))+rand(-0.06,0.06), w=rand(6.6,7.6)*Math.sqrt(s), up=Math.sin(a)>-0.2?1:0.7;
      const dv=[(r1[0]*Math.cos(a)+r2[0]*Math.sin(a)*up)*w+r3[0]*rand(-1,1),(r2[1]*Math.sin(a)*up)*w+1.2,(r1[2]*Math.cos(a)+r2[2]*Math.sin(a)*up)*w+r3[2]*rand(-1,1)], L=rand(2.1,2.5);
      const h=kgStern(psHuge,e,dv,lHell(A,1.4),L,2.2,0,0.3);
      lFunken(e,dv,2.2,0.05,L*0.85,40,mischF(lHell(A,1.05),lHell(B,1.05),0.3),{ps:psMid,life:[0.4,0.8],g:1.8,streu:0.15,mit:0.05,mode:4});
      kgSpaeter(0.95,()=>kgFarbe(h,lHell(B,1.5))); kgSpaeter(L-0.35,()=>kgFarbe(h,[1.5,.2,.4])); }
    schall(e,x=>{ sfx.plopp(x*0.4,1.2); later(0.9,()=>sfx.schwirren(x*0.6,0.5)); later(0.3,()=>sfx.rieseln(x*0.4,2)); }); });
};

/* =========================================================
   6 VOLLMOND (L16, 26 Schuss) - Creme, Mondgelb, Silber; leises Pochen
   ========================================================= */
/* Mondhof: dunkler Aufstieg, oben eine dichte runde Scheibe aus
   cremeweissen Sternen (der Mond) und weit draussen ein feiner
   Silberring (der Hof, wie der 22-Grad-Ring um den Mond); die Scheibe
   verblasst zuerst, der Hof bleibt noch einen Atemzug */
LICHTYP.mondhof=function(o,A,B,s,opt){
  thDunkel(o,s,opt,27,A,e=>{ const [r1,r2,r3]=rkBild(e), n=Math.round(60*QUAL())+14, nr=Math.round(64*QUAL())+16;
    for(let i=0;i<n;i++){ const d=randDir(), w=rand(2.2,2.7)*Math.sqrt(s), dv=[d[0]*w,d[1]*w+0.15,d[2]*w], L=rand(2.2,2.7); kgStern(psBig,e,dv,lHell(A,1.15),L,0.35,0,0.3);
      if(i%2===0) lFunken(e,dv,0.35,0.1,L*0.85,10,lHell(A,0.8),{ps:psMid,life:[0.5,0.9],g:0.5,streu:0.06,mit:0.05,mode:4}); }
    for(let i=0;i<nr;i++){ const a=i/nr*Math.PI*2, w=7.2*Math.sqrt(s)*rand(0.98,1.02), dv=[(r1[0]*Math.cos(a)+r2[0]*Math.sin(a))*w,(r2[1]*Math.sin(a))*w+0.2,(r1[2]*Math.cos(a)+r2[2]*Math.sin(a))*w];
      kgStern(psBig,e,dv,lHell(B,1.0),rand(3.2,3.6),0.35,4,0.35); }
    schall(e,x=>{ sfx.pochen(x*0.9); later(0.4,()=>sfx.rieseln(x*0.3,3)); }); });
};
/* Wolkenschleier: oben zieht ein breiter Schleier aus haengenden
   Silberfaeden quer - wie eine duenne Wolke vor dem Mond -, er treibt im
   Wind und sinkt langsam */
LICHTYP.wolkenschleier=function(o,A,B,s,opt){
  thDunkel(o,s,opt,26,A,e=>{ const Q=lQuer({dir:FANDIR}), Z=[-Q[2],0,Q[0]], n=Math.round(38*QUAL())+10, wind=(Math.random()<0.5?-1:1)*rand(0.8,1.2);
    for(let i=0;i<n;i++){ const x=rand(-1,1), w=7*Math.sqrt(s), dv=[Q[0]*(x*w+wind)+Z[0]*rand(-1.2,1.2),rand(0.2,1.8),Q[2]*(x*w+wind)+Z[2]*rand(-1.2,1.2)], L=rand(3.2,3.9);
      kgStern(psBig,e,dv,lHell(i%3?B:A,1.05),L,0.6,4,0.55);
      if(i%2===0) lFunken(e,dv,0.6,0.15,L*0.8,10,lHell(B,0.8),{ps:psMid,life:[0.8,1.4],g:0.4,streu:0.08,mit:0.05,mode:4}); }
    schall(e,x=>{ sfx.pochen(x*0.5); later(0.3,()=>sfx.rieseln(x*0.4,3.5)); }); });
};
/* Mondsichel: oben steht eine Sichel aus mondgelben Sternen - aussen
   ein Bogen, innen ein versetzter Bogen, die Spitzen laufen spitz aus;
   die Sichel oeffnet sich im Wechsel nach links und nach rechts */
LICHTYP.mondsichel=function(o,A,B,s,opt){
  thDunkel(o,s,opt,27,A,e=>{ const [r1,r2]=rkBild(e), sd=(opt.i||0)%2?1:-1, w=6.6*Math.sqrt(s), n=Math.round(30*QUAL())+8;
    const vom=(x,y)=>[(r1[0]*x*sd+r2[0]*y)*w,(r2[1]*y)*w+0.2,(r1[2]*x*sd+r2[2]*y)*w];
    for(let i=0;i<n;i++){ const a=-1.45+2.9*i/(n-1), dv=vom(Math.cos(a),Math.sin(a));
      kgStern(psBig,e,dv,lHell(A,1.35),rand(2.6,3.0),0.35,0,0.08); if(i%2===0) kgStern(psMid,e,dv,lHell(B,1.2),rand(2.4,2.9),0.35,4,0.05); }
    for(let i=0;i<Math.round(n*0.8);i++){ const a=-1.1+2.2*i/(Math.round(n*0.8)-1), dv=vom(-0.38+0.86*Math.cos(a),0.86*Math.sin(a)*1.05);
      kgStern(psBig,e,dv,lHell(A,1.25),rand(2.5,2.9),0.35,0,0.08); }
    schall(e,x=>{ sfx.pochen(x*0.7); later(0.5,()=>sfx.rieseln(x*0.3,2.5)); }); });
};

/* =========================================================
   7 LAGUNE (L18, 28 Schuss) - Aqua, Tuerkis, Mint; Blubbern
   ========================================================= */
/* Fischschwarm (echtes Vorbild: "Fish"): dunkler Aufstieg, dann
   schiessen ein Dutzend kleine Fische auseinander - jeder Kopf zieht
   einen zappelnden Glitzerschwanz -, sie werden langsamer und flitzen
   zum Schluss noch einmal davon */
LICHTYP.fischschwarm=function(o,A,B,s,opt){
  thDunkel(o,s,opt,27,A,e=>{ const [r1,r2,r3]=rkBild(e), n=Math.round(12*QUAL())+4, D=2.4, F=[];
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+rand(-0.25,0.25), tief=rand(-0.35,0.35), d=[r1[0]*Math.cos(a)+r2[0]*Math.sin(a)+r3[0]*tief,r2[1]*Math.sin(a)+r3[1]*tief,r1[2]*Math.cos(a)+r2[2]*Math.sin(a)+r3[2]*tief];
      const quer=[-r1[0]*Math.sin(a)+r2[0]*Math.cos(a),r2[1]*Math.cos(a),-r1[2]*Math.sin(a)+r2[2]*Math.cos(a)];
      F.push({d,quer,v0:rand(6,7.5)*Math.sqrt(s),td:rand(1.2,1.6),vd:rand(7,9)*Math.sqrt(s),ph:rand(0,6.3),om:rand(13,17),c:lHell(i%3?A:B,1.45)}); }
    const S=(f,t)=>t<f.td?f.v0*(1-Math.exp(-1.7*t))/1.7:f.v0*(1-Math.exp(-1.7*f.td))/1.7+f.vd*(t-f.td)*(1-Math.exp(-6*(t-f.td)));
    thJeBild(D,t=>{ for(const f of F){ const st=S(f,t), wg=Math.sin(f.ph+t*f.om)*0.35*Math.sqrt(s), aus=t>D-0.5?(D-t)/0.5:1;
      const q={x:e.x+f.d[0]*st+f.quer[0]*wg,y:e.y+f.d[1]*st+f.quer[1]*wg-0.3*t*t,z:e.z+f.d[2]*st+f.quer[2]*wg};
      SCHWEIF=0.1; thPunkt(psHuge,q,kgMal(f.d,2),kgMal(f.c,aus*0.85),0.07);
      for(let i=0;i<Math.round(2*QUAL())+1;i++) psMid.emit(q.x,q.y,q.z,rand(-.15,.15),rand(-.25,0.05),rand(-.15,.15),f.c[0]*0.75,f.c[1]*0.8,f.c[2]*0.8,rand(0.25,0.45)*aus,0.5,4); } });
    schall(e,x=>{ sfx.plopp(x*0.35,1.3); later(0.2,()=>sfx.blubbern(x*0.7,6)); later(1.3,()=>sfx.zischen(x*0.12,0.5)); }); });
};
/* Seeanemone: dunkler Aufstieg, oben oeffnet sich ein Kranz langer
   aquafarbener Fangfaeden nach oben und aussen, die sich gemeinsam in
   der Stroemung hin und her wiegen; die Spitzen werden mint */
LICHTYP.seeanemone=function(o,A,B,s,opt){
  thDunkel(o,s,opt,26,A,e=>{ const Q=lQuer({dir:FANDIR}), n=Math.round(30*QUAL())+8, hs=[], ph=rand(0,6.3);
    for(let i=0;i<n;i++){ const d=randDir(); d[1]=Math.abs(d[1])*0.9+0.25; const l=Math.hypot(d[0],d[1],d[2]), w=rand(5.2,6.2)*Math.sqrt(s)/l, dv=[d[0]*w,d[1]*w,d[2]*w], L=rand(3.0,3.6);
      const h=kgStern(psBig,e,dv,lHell(A,1.3),L,1.2,0,0.6); hs.push(h); kgSpaeter(L*0.55,()=>kgFarbe(h,lHell(B,1.35)));
      lFunken(e,dv,1.2,0.1,L*0.75,16,mischF(lHell(A,0.9),lHell(B,0.9),0.4),{ps:psMid,life:[0.7,1.2],g:0.5,streu:0.06,mit:0.05,mode:4}); }
    thJeBild(3.4,t=>{ if(t<0.6) return; const sw=Math.sin(ph+t*2.2)*1.3*Math.sqrt(s); for(const h of hs){ if(!kgLebt(h)) continue; const j=h.i*3; h.ps.vel[j]=h.ps.vel[j]*0.9+Q[0]*sw*0.1; h.ps.vel[j+2]=h.ps.vel[j+2]*0.9+Q[2]*sw*0.1; } });
    schall(e,x=>{ sfx.plopp(x*0.3,0.9); later(0.4,()=>sfx.blubbern(x*0.5,4)); }); });
};
/* Luftblasen: eine Mine aus weissen und aquafarbenen Perlen steigt
   wackelnd aus dem Rohr, oben platzt jede Blase mit einem Funkenring
   und einem leisen Blubb */
LICHTYP.luftblasen=function(o,A,B,s,opt){
  const r=lMine(o,s,opt,{n:22,H:[16,23],kegel:0.16,md:0,nach:[0,0.1],spur:0.12,c:i=>i%3?lHell(A,1.3):[1.4,1.45,1.5]}), ph=rand(0,6.3), Q=lQuer({dir:FANDIR});
  thJeBild(2.6,t=>{ r.out.forEach(({h},i)=>{ if(!kgLebt(h)) return; const j=h.i*3; h.ps.vel[j]+=Q[0]*Math.sin(ph+i+t*9)*0.12; h.ps.vel[j+2]+=Q[2]*Math.sin(ph+i+t*9)*0.12; }); });
  r.out.forEach(({h,T},i)=>kgSpaeter(T-0.05,()=>{ if(!kgLebt(h)) return; const [q]=kgOrt(h); kgAus(h);
    for(let j=0;j<6;j++){ const a=j/6*Math.PI*2; psSmall.emit(q.x,q.y,q.z,Math.cos(a)*1.4,Math.sin(a)*1.4,rand(-.3,.3),1.4,1.5,1.5,rand(0.2,0.35),0.5,0); }
    if(i%4===0) schall(q,x=>sfx.blubbern(x*0.5,1)); }));
};

/* =========================================================
   8 SONNENBLUMEN (L20, 30 Schuss) - Sonnengelb, Bernstein, Braun;
   Kerne knacken
   ========================================================= */
/* Sonnenblume (echtes Vorbild: Pistill): dunkler Aufstieg, oben ein
   flacher Kranz gelber Bluetenblaetter mit dicken Glitzerschweifen,
   innen ein dunkles Herz aus braunen Kernen - die Kerne knacken der
   Reihe nach auf, in der Spirale der Sonnenblume (Goldener Winkel) */
LICHTYP.sonnenblume=function(o,A,B,s,opt){
  thDunkel(o,s,opt,28,A,e=>{ const [r1,r2]=rkBild(e), n=Math.round(20*QUAL())+6, nk=Math.round(34*QUAL())+10, PHI=2.39996;
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, w=6.8*Math.sqrt(s)*rand(0.96,1.04), dv=[(r1[0]*Math.cos(a)+r2[0]*Math.sin(a))*w,(r2[1]*Math.sin(a))*w+0.4,(r1[2]*Math.cos(a)+r2[2]*Math.sin(a))*w], L=rand(2.2,2.6);
      kgStern(psHuge,e,dv,lHell(A,1.45),L,1.4,0,0.25); lFunken(e,dv,1.4,0.05,L*0.8,28,mischF(lHell(A,1.05),[1,.75,.3],0.4),{ps:psMid,life:[0.5,0.9],g:1.4,streu:0.1,mit:0.04,mode:4}); }
    for(let i=0;i<nk;i++){ const a=i*PHI, rr=Math.sqrt((i+0.5)/nk)*2.6*Math.sqrt(s), dv=[(r1[0]*Math.cos(a)+r2[0]*Math.sin(a))*rr,(r2[1]*Math.sin(a))*rr+0.3,(r1[2]*Math.cos(a)+r2[2]*Math.sin(a))*rr];
      const h=kgStern(psBig,e,dv,kgMal(lHell(B,1.0),0.55),3.0,0.5,0,0.05), tp=0.45+i*0.045;
      kgSpaeter(tp,()=>{ if(!kgLebt(h)) return; const [q]=kgOrt(h); kgFarbe(h,kgMal(lHell(B,1),0.35)); psHuge.emit(q.x,q.y,q.z,0,0,0,1.6,1.25,.6,0.08,0,0);
        for(let j=0;j<3;j++){ const d=randDir(); psSmall.emit(q.x,q.y,q.z,d[0]*2,d[1]*2,d[2]*2,1.6,1.2,.5,rand(0.15,0.3),2,0); }
        if(i%4===0) schall(q,x=>sfx.klick(x*1.4,rand(0.8,1.3))); }); }
    schall(e,x=>sfx.plopp(x*0.45,0.85)); });
};

/* =========================================================
   9 GLETSCHER (L22, 34 Schuss) - Eisblau, Weiss, Tiefblau; Klirren
   ========================================================= */
/* Eiskristall: ein weisser Komet, kurz vor dem Scheitel zerspringt er
   mit Klirren in einen sechsarmigen Kristall (zum Zuschauer gewandt);
   jeder Arm treibt noch zwei kurze Seitenaeste */
LICHTYP.eiskristall=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(28*Math.sqrt(s),G,opt,0.3), tS=lScheitel(v[1],G)*0.8;
  lKopf(m,v,lHell(B,1.4),tS,G,0,0.25); lFunken(m,v,G,0.03,tS,80,[1.2,1.25,1.35],{ps:psMid,life:[0.4,0.8],g:2.2,streu:0.18,mit:0.1,mode:4}); lStart(m,1,0.6);
  kgSpaeter(tS,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,tS), [r1,r2]=rkBild(e), a0=rand(0,Math.PI/3), L1=0.55;
    for(let k=0;k<6;k++){ const a=a0+k*Math.PI/3, sp=7.2*Math.sqrt(s), dv=[(r1[0]*Math.cos(a)+r2[0]*Math.sin(a))*sp,(r2[1]*Math.sin(a))*sp+0.6,(r1[2]*Math.cos(a)+r2[2]*Math.sin(a))*sp];
      lKopf(e,dv,lHell(A,1.45),1.6,2.5,0,0.3); lFunken(e,dv,2.5,0.02,1.4,45,[1.2,1.3,1.45],{ps:psMid,life:[0.4,0.8],g:1.6,streu:0.12,mit:0.08,mode:4});
      kgSpaeter(L1,()=>{ const e2=sternNach(e,dv[0],dv[1],dv[2],2.5,L1);
        for(const sd of [-1,1]){ const b=a+sd*Math.PI/3, w=3.4*Math.sqrt(s), d2=[(r1[0]*Math.cos(b)+r2[0]*Math.sin(b))*w,(r2[1]*Math.sin(b))*w+0.3,(r1[2]*Math.cos(b)+r2[2]*Math.sin(b))*w];
          kgStern(psBig,e2,d2,lHell(B,1.45),1.1,2.2,4,0.25); } }); }
    schall(e,x=>{ sfx.crack(x*0.45); sfx.klirren(x*0.9); later(0.5,()=>sfx.eisknistern(x*0.8)); }); });
};
/* Eiszapfen: dunkler Aufstieg, oben ein flacher weisser Ring; nach
   einem halben Atemzug faellt jeder Stern senkrecht und zieht eine
   lange eisblaue Linie - ein Vorhang aus Eiszapfen */
LICHTYP.eiszapfen=function(o,A,B,s,opt){
  thDunkel(o,s,opt,28,A,e=>{ const n=Math.round(22*QUAL())+6, a0=rand(0,6.3);
    for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2, w=rand(5.8,6.4)*Math.sqrt(s), dv=[Math.cos(a)*w,rand(0.6,1.2),Math.sin(a)*w];
      const h=kgStern(psBig,e,dv,[1.45,1.5,1.55],rand(2.6,3.0),0.3,0,0.05);
      kgSpaeter(rand(0.5,0.75),()=>{ thFallen(h,7,lHell(A,1.35),0.75); }); }
    schall(e,x=>{ sfx.klirren(x*0.7); later(0.6,()=>sfx.eisknistern(x*0.6)); }); });
};
/* Kalben: dunkler Aufstieg, eine grosse weisse Eiswand aus Sternen -
   nach einer Sekunde bricht sie: alles stuerzt silbern glitzernd in die
   Tiefe, mit Knacken und dumpfem Donnern */
LICHTYP.kalben=function(o,A,B,s,opt){
  thDunkel(o,s,opt,30,A,e=>{ const n=Math.round(70*QUAL())+16;
    for(let i=0;i<n;i++){ const d=randDir(), w=rand(7.4,8.4)*Math.sqrt(s), dv=[d[0]*w,d[1]*w+0.6,d[2]*w];
      const h=kgStern(psBig,e,dv,i%4?[1.45,1.5,1.55]:lHell(A,1.4),rand(3.0,3.4),0.6,0,0.15);
      kgSpaeter(rand(0.9,1.15),()=>{ thFallen(h,9,lHell(i%2?A:B,1.3),0.4); if(i%3===0&&kgLebt(h)){ const [q,w2]=kgOrt(h); lFunken(q,w2,9,0.02,1.2,14,[1.2,1.25,1.35],{ps:psMid,life:[0.3,0.6],g:2,streu:0.1,mit:0.1,mode:4}); } }); }
    schall(e,x=>{ sfx.crack(x*0.5); later(0.95,()=>sfx.kalben(x)); }); });
};

/* =========================================================
   10 VULKANAUSBRUCH (L25, 44 Schuss) - Lava, Orange, Rot; Grollen
   ========================================================= */
/* Aschewolke: ein glimmender Aufstieg, oben gluehen nacheinander Teile
   einer dunkelroten Wolke auf, durchzuckt von violett-weissen Blitzen
   (Vulkangewitter) - mit tiefem Grollen */
LICHTYP.aschewolke=function(o,A,B,s,opt){
  thDunkel(o,s,opt,29,A,e=>{ let t=0; const glut=lHell(A,0.9);
    for(let k=0;k<9;k++){ t+=rand(0.15,0.4); const tt=t; kgSpaeter(tt,()=>{ const d=randDir(), r=rand(1,6)*Math.sqrt(s), q={x:e.x+d[0]*r,y:e.y+d[1]*r*0.3,z:e.z+d[2]*r};
      lWolke(q,glut,s,Math.round(30*QUAL())); if(k%2===0){ flash(q,[1.4,1.2,1.6],1.2,0.12); lBlitzfaden(q,[1.6,1.5,1.9],s); } }); }
    schall(e,x=>sfx.vulkangrollen(x)); });
};
/* Lavastrahl (breite Fontaene als Akzent - ein dicker Komet je Rohr):
   ein schwerer, sehr heller Lavakomet steigt traege, sein dicker
   Glutschweif kuehlt von Gelb zu Rot ab, oben tropfen ein paar
   Glutbrocken herab */
LICHTYP.lavastrahl=function(o,A,B,s,opt){
  const m=lMund(o), G=7, v=lAbschuss(22*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G)+0.2;
  lKopf(m,v,[1.6,1.1,.45],T,G,0,0.45); kgStern(psHuge,m,v,lHell(B,1.4),T,G,0,0.6);
  rkFunken(m,v,G,0.02,T,220,[1.5,.55,.12],{ps:psBig,life:[0.6,1.1],g:2.2,streu:0.3,mit:0.12,mode:2});
  lFunken(m,v,G,0.02,T,120,lHell(A,1.1),{ps:psMid,life:[0.7,1.3],g:1.8,streu:0.35,mit:0.1,mode:4});
  lStart(m,1.6,1.0); sfx.fauchen(distVol(m)*0.5,T*0.8);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T); for(let j=0;j<5;j++){ const d=randDir(), w=rand(1,2.5);
    psBig.emit(e.x,e.y,e.z,d[0]*w,Math.abs(d[1])*w,d[2]*w,1.5,.8,.25,rand(1.4,2),3,2,.5,.06,.02); } });
};
/* Lavabombe: ein glimmender Aufstieg, oben fliegen schwere Lavabrocken
   im Bogen auseinander, jeder mit dickem Glutschweif, der von Orange zu
   Dunkelrot abkuehlt; aus den Schweifen knistert Asche - Wumms und
   Knistern */
LICHTYP.lavabombe=function(o,A,B,s,opt){
  thDunkel(o,s,opt,29,A,e=>{ const n=Math.round(9*QUAL())+4;
    for(let i=0;i<n;i++){ const d=randDir(); d[1]=d[1]*0.6+0.45; const l=Math.hypot(d[0],d[1],d[2]), w=rand(8,9.5)*Math.sqrt(s)/l, dv=[d[0]*w,d[1]*w,d[2]*w], L=rand(2.6,3.1);
      kgStern(psHuge,e,dv,mischF(lHell(A,1.45),lHell(B,1.45),0.35),L,3.2,0,0.4);
      rkFunken(e,dv,3.2,0.03,L,70,[1.5,.42,.08],{ps:psBig,life:[0.8,1.4],g:1.6,streu:0.35,mit:0.06,mode:2});
      lFunken(e,dv,3.2,0.3,L,25,lHell(A,1.0),{ps:psMid,life:[0.4,0.9],g:2,streu:0.4,mit:0.05,mode:3}); }
    schall(e,x=>{ sfx.wumms(x*0.7); later(0.8,()=>sfx.crackle(x*0.6)); later(1.6,()=>sfx.crackle(x*0.4)); }); });
};
/* Ascheregen: oben verteilt sich ein Schwarm winziger Glutfunken, sie
   sinken langsam, kuehlen ab und knistern einzeln auf */
LICHTYP.ascheregen=function(o,A,B,s,opt){
  thDunkel(o,s,opt,28,A,e=>{ const n=Math.round(70*QUAL())+16;
    for(let i=0;i<n;i++){ const d=randDir(), w=rand(3,6.5)*Math.sqrt(s), L=rand(2.8,3.8);
      psBig.emit(e.x,e.y,e.z,d[0]*w,d[1]*w*0.8+0.5,d[2]*w,...lHell(i%3?B:A,1.3),L,0.8,i%4?2:3,.45,.08,.02); }
    schall(e,x=>{ sfx.plopp(x*0.4,0.7); later(0.6,()=>sfx.crackle(x*0.5)); later(1.4,()=>sfx.crackle(x*0.35)); later(2.2,()=>sfx.crackle(x*0.25)); }); });
};

/* ---------- Eigene Rohrfolge je Batterie (die Zuendschnur innen) ----------
   Tom 26.09.: "nicht immer links nach rechts". Jede Themen-Batterie hat
   eine Folge, die zum Bild passt; feste Saat, also jedes Mal gleich. */
function thAbst(a,b){ return Math.hypot(a.x-b.x,a.z-b.z); }
function thFolgeSaat(t,fn){ return rohrSaat(saatZahl(t+':thema'),fn); }
const TH_FOLGE={
  /* Tropfen: wohin der naechste faellt, ist nie neben dem letzten */
  lb_tautropfen:(L,t)=>thFolgeSaat(t,()=>{ const R=L.rohre, frei=R.map((x,i)=>i), out=[frei.splice(Math.floor(Math.random()*frei.length),1)[0]];
    while(frei.length){ let best=0, bw=-1; frei.forEach((k,j)=>{ const d=Math.min(...out.slice(-2).map(q=>thAbst(R[k],R[q])))+Math.random()*0.04; if(d>bw){ bw=d; best=j; } }); out.push(frei.splice(best,1)[0]); } return out; }),
  /* Falter: Fluegelpaare - spiegelgleich links und rechts, mal aussen, mal innen */
  lb_zitronenfalter:(L,t)=>{ const R=L.rohre, idx=R.map((x,i)=>i).sort((a,b)=>Math.abs(R[b].x)-Math.abs(R[a].x)||R[a].z-R[b].z), out=[], used=new Set(), ord=[0,3,1,4,2,5];
    idx.forEach(i=>{ if(used.has(i)) return; used.add(i); let m=-1, md=1e9; R.forEach((q,k)=>{ if(used.has(k)) return; const d=Math.abs(q.x+R[i].x)+Math.abs(q.z-R[i].z); if(d<md){ md=d; m=k; } });
      const paar=m>=0?[i,m]:[i]; if(m>=0) used.add(m); out.push(paar); });
    const g=[]; ord.forEach(k=>{ for(let j=k;j<out.length;j+=6) g.push(out[j]); }); return g.flatMap((p,k)=>k%2?p.slice().reverse():p); },
  /* Feld: Reihe fuer Reihe von hinten nach vorn, in jeder Reihe aus der Mitte heraus */
  lb_lavendelfeld:L=>{ const R=L.rohre; return R.map((x,i)=>i).sort((a,b)=>R[b].row-R[a].row||Math.abs(R[a].x)-Math.abs(R[b].x)||R[a].x-R[b].x); },
  /* Wirbel: von der Mitte im Kreis nach aussen (der Wind dreht das Laub) */
  lb_herbstlaub:L=>{ const R=L.rohre, w=x=>{ const a=Math.atan2(x.z,x.x); return Math.round(Math.hypot(x.x,x.z*2)*10)+((a+Math.PI)/(2*Math.PI)); }; return R.map((x,i)=>i).sort((a,b)=>w(R[a])-w(R[b])); },
  /* Kolibri: Spruenge - jedes Mal das Rohr, das am weitesten weg ist */
  lb_kolibri:(L,t)=>thFolgeSaat(t,()=>{ const R=L.rohre, frei=R.map((x,i)=>i), out=[frei.splice(Math.floor(frei.length/2),1)[0]];
    while(frei.length){ const q=out[out.length-1]; let best=0, bw=-1; frei.forEach((k,j)=>{ const d=thAbst(R[k],R[q])*rand(0.8,1); if(d>bw){ bw=d; best=j; } }); out.push(frei.splice(best,1)[0]); } return out; }),
  /* Mond: die Mitte zuerst, dann rundherum wie der Hof */
  lb_vollmond:L=>{ const R=L.rohre, w=x=>{ const r=Math.hypot(x.x,x.z*1.6), a=Math.atan2(x.z,x.x); return Math.round(r*14)+((a+Math.PI)/(2*Math.PI)); }; return R.map((x,i)=>i).sort((a,b)=>w(R[a])-w(R[b])); },
  /* Schwarm: drei, vier Nachbarrohre kurz hintereinander, dann ein Sprung zu einer anderen Gruppe */
  lb_lagune:(L,t)=>thFolgeSaat(t,()=>{ const R=L.rohre, frei=new Set(R.map((x,i)=>i)), out=[]; let last={x:0,z:0};
    while(frei.size){ let s0=-1, bw=-1; frei.forEach(k=>{ const d=thAbst(R[k],last)+Math.random()*0.05; if(d>bw){ bw=d; s0=k; } });
      const gr=[...frei].sort((a,b)=>thAbst(R[a],R[s0])-thAbst(R[b],R[s0])).slice(0,3+Math.floor(Math.random()*2));
      gr.forEach(k=>{ frei.delete(k); out.push(k); }); last={x:gr.reduce((a,k)=>a+R[k].x,0)/gr.length,z:gr.reduce((a,k)=>a+R[k].z,0)/gr.length}; } return out; }),
  /* Sonnenblume: in der Kernspirale (Goldener Winkel) von innen nach aussen */
  lb_sonnenblumen:L=>{ const R=L.rohre, N=R.length, Rx=Math.max(...R.map(x=>Math.abs(x.x)))||1, Rz=Math.max(...R.map(x=>Math.abs(x.z)))||1, frei=new Set(R.map((x,i)=>i)), out=[];
    for(let k=0;k<N;k++){ const a=k*2.39996, r=Math.sqrt((k+0.5)/N), px=Math.cos(a)*r*Rx, pz=Math.sin(a)*r*Rz; let best=-1, bd=1e9;
      frei.forEach(i=>{ const d=Math.hypot((R[i].x-px)/Rx,(R[i].z-pz)/Rz); if(d<bd){ bd=d; best=i; } }); frei.delete(best); out.push(best); } return out; },
  /* Gletscher: die Abbruchkante - von vorn nach hinten, je Reihe von beiden Raendern nach innen */
  lb_gletscher:L=>{ const R=L.rohre, rang=x=>{ const rr=R.filter(y=>y.row===x.row).map(y=>y.col).sort((a,b)=>a-b), i=rr.indexOf(x.col), n=rr.length; return Math.min(i,n-1-i)*2+(i>n-1-i?1:0); };
    return R.map((x,i)=>i).sort((a,b)=>R[a].row-R[b].row||rang(R[a])-rang(R[b])); },
  /* Krater: aus der Mitte nach aussen, in jedem Ring kreuz und quer */
  lb_vulkan:(L,t)=>thFolgeSaat(t,()=>{ const R=L.rohre, w=R.map(x=>Math.round(Math.hypot(x.x,x.z*1.5)*8)+Math.random()*0.9); return R.map((x,i)=>i).sort((a,b)=>w[a]-w[b]); })
};
{ const roh=rohrLayout;
  rohrLayout=function(t){ const L=roh(t); if(L&&TH_FOLGE[t]&&!L.thFolge){ const f=TH_FOLGE[t](L,t); if(f.length===L.rohre.length&&new Set(f).size===f.length) L.folge=f; L.thFolge=true; } return L; }; }

/* ---------- Die Shows ---------- */
/* wie die Lichter-Batterien (14q nbShow): jedes Licht braucht 4-5 s am
   Himmel - bis zum Finale stehen die Schuesse anderthalbmal so weit
   auseinander wie notiert, zwischen zwei Abschnitten bleibt Luft;
   Verzoegerungssatz wie bei echten Verbunden */
const thShow=(id,rampe,ph)=>lbShow(id,THEMEN[id],rampe,ph.map((p,i)=>i===ph.length-1||(i===ph.length-2&&ph[i+1].mit)?p:
  Object.assign({},p,{gap:p.gap!==undefined?+(p.gap*1.5).toFixed(3):p.gap,pause:p.mit||(ph[i+1]&&ph[i+1].mit)?p.pause:Math.max(p.pause||0,1.5)})),{verzoegerung:true});
/* L4 - erst zwei einzelne Perlen, dann Tropfenketten, ein Paar, drei zum Schluss */
thShow('lb_tautropfen',{sz:[0.8,1.0],pw:[0,0],hell:[0.9,1.1],kurve:'linear'},[
  {n:2,gap:1.6,muster:'gerade',licht:'tauperle',farbe:0},
  {n:3,gap:0.7,muster:'zufall',ang:0.2,licht:'tropfenkette',farbe:1,pause:0.6},
  {n:2,gap:0.3,muster:'v',ang:0.2,licht:'tauperle',farbe:2,pause:0.8},
  {n:3,gap:0.25,muster:'mitte',ang:0.25,licht:'tauperle',kal:'gross',farbe:0,pause:4}]);
/* L7 - der erste Falter, Falterpaare, ein Schwarm im Zickzack, Finale der Paare */
thShow('lb_zitronenfalter',{sz:[0.85,1.1],pw:[0,1],hell:[0.9,1.2],kurve:'linear'},[
  {n:2,gap:1.4,muster:'aussen',ang:0.25,licht:'flatterkomet',farbe:0},
  {n:4,gap:0.8,muster:'paar',ang:0.3,licht:'falterpaar',farbe:1,pause:0.6},
  {n:6,gap:0.35,muster:'z',ang:0.35,licht:'flatterkomet',farbe:2,pause:0.8},
  {n:4,gap:0.15,muster:'mitte',ang:0.25,licht:'falterpaar',kal:'gross',farbe:0,pause:4.5}]);
/* L9 - drei Rispen, zwei Duftwolken, der Wind geht durchs Feld, Finale */
thShow('lb_lavendelfeld',{sz:[0.85,1.15],pw:[0,1],hell:[0.9,1.2],kurve:'linear'},[
  {n:3,gap:1.3,muster:'gerade',licht:'lavendelrispe',farbe:0},
  {n:2,gap:0.5,muster:'v',ang:0.3,licht:'duftwolke',farbe:1,pause:1},
  {n:6,gap:0.3,muster:'welle',ang:0.35,licht:'lavendelrispe',farbe:2},
  {mit:true,n:2,gap:1.2,muster:'aussen',ang:0.3,licht:'duftwolke',farbe:0,pause:0.8},
  {n:5,gap:0.12,muster:'mitte',ang:0.3,licht:'lavendelrispe',kal:'gross',farbe:1,pause:5}]);
/* L12 - erste Blaetter, Kastanien knacken, Windstoesse, Herbststurm */
thShow('lb_herbstlaub',{sz:[0.9,1.2],pw:[0,1],hell:[0.9,1.2],kurve:'spaet'},[
  {n:2,gap:1.6,muster:'gerade',licht:'blaetterfall',farbe:0},
  {n:6,gap:0.35,muster:'x',ang:0.35,licht:'knistercrossette',farbe:1},
  {n:3,gap:1.0,muster:'mitte',ang:0.2,licht:'laubwirbel',farbe:2,pause:0.5},
  {mit:true,n:4,gap:0.6,muster:'aussen',ang:0.3,licht:'blaetterfall',farbe:1,pause:0.8},
  {n:7,gap:0.12,muster:'kreis',ang:0.3,licht:'blaetterfall',kal:'gross',farbe:0,pause:5.5}]);
/* L14 - Kolibris schwirren einzeln, Federkronen, ein Schwarm, Finale */
thShow('lb_kolibri',{sz:[0.9,1.2],pw:[0,2],hell:[0.9,1.25],kurve:'linear'},[
  {n:3,gap:1.4,muster:'zufall',ang:0.25,licht:'schwirrkomet',farbe:0},
  {n:4,gap:0.5,muster:'v',ang:0.3,licht:'federkrone',farbe:1,pause:0.8},
  {n:8,gap:0.25,muster:'wischer',ang:0.4,licht:'schwirrkomet',farbe:2},
  {mit:true,n:2,gap:1.0,muster:'aussen',ang:0.3,licht:'federkrone',farbe:0,pause:1},
  {n:7,gap:0.12,muster:'mitte',ang:0.3,licht:'schwirrkomet',kal:'gross',farbe:1,pause:5}]);
/* L16 - der Mond geht auf, Wolken ziehen, zwei Sicheln, Mondphasen ueber
   leisem Silberglanz am Boden, Finale: neun Monde im Kreis */
thShow('lb_vollmond',{sz:[0.9,1.25],pw:[0,2],hell:[0.85,1.25],kurve:'spaet'},[
  {n:1,rohrFolge:[0],licht:'mondhof',kal:'gross',farbe:0,pause:2.5},
  {n:4,gap:0.9,muster:'aussen',ang:0.3,licht:'wolkenschleier',farbe:1},
  {n:2,gap:1.2,muster:'v',ang:0.3,licht:'mondsichel',farbe:2,pause:1},
  {n:6,gap:0.4,muster:'spirale',ang:0.3,licht:'mondhof',farbe:0,boden:{k:'fountain',alt:true,gt:5,gh:0.9,A:'silber',B:'weiss'}},
  {mit:true,n:4,gap:0.7,muster:'gerade',licht:'wolkenschleier',farbe:1,pause:0.8},
  {n:9,gap:0.12,muster:'kreis',ang:0.3,licht:'mondhof',kal:'gross',farbe:2,pause:6}]);
/* L18 - Fische, Blasen, Anemonen ueber leiser Gischt, der Schwarm wendet,
   Finale: acht Schwaerme zugleich */
thShow('lb_lagune',{sz:[0.9,1.3],pw:[0,2],hell:[0.9,1.3],kurve:'spaet'},[
  {n:3,gap:1.4,muster:'gerade',licht:'fischschwarm',farbe:0},
  {n:2,gap:0.5,muster:'v',ang:0.2,licht:'luftblasen',farbe:2,pause:0.6},
  {n:6,gap:0.35,muster:'welle',ang:0.35,licht:'seeanemone',farbe:1,boden:{k:'fountain',alt:true,gt:4,gh:0.8,A:'aqua',B:'weiss'}},
  {mit:true,n:3,gap:0.8,muster:'zufall',ang:0.3,licht:'luftblasen',farbe:0,pause:0.8},
  {n:6,gap:0.25,muster:'w',ang:0.35,licht:'fischschwarm',farbe:1},
  {n:8,gap:0.1,muster:'mitte',ang:0.3,licht:'fischschwarm',kal:'gross',farbe:2,pause:5.5}]);
/* L20 - eine Sonnenblume allein, Sonnenstrahlen, Blueten paarweise und
   schwere Koepfe, die sich neigen, Strahlen ueber Pollenglanz, Finale:
   neun Sonnenblumen in der Spirale */
thShow('lb_sonnenblumen',{sz:[0.9,1.3],pw:[0,2],hell:[0.9,1.3],kurve:'spaet'},[
  {n:1,rohrFolge:[0],licht:'sonnenblume',kal:'gross',farbe:0,pause:2},
  {n:6,gap:0.4,muster:'v',ang:0.4,licht:'farbkomet',farbe:1},
  {n:4,gap:0.9,muster:'paar',ang:0.3,licht:'sonnenblume',farbe:0,pause:0.8},
  {mit:true,n:4,gap:0.9,muster:'gerade',licht:'farbpalme',farbe:2,pause:1},
  {n:6,gap:0.3,muster:'x',ang:0.4,licht:'farbkomet',farbe:1,boden:{k:'fountain',alt:true,gt:4,gh:1.0,A:'zitrone',B:'gold'}},
  {n:9,gap:0.12,muster:'spirale',ang:0.3,licht:'sonnenblume',kal:'gross',farbe:0,pause:6}]);
/* L22 - Frost, Eiszapfen, Schneetreiben, Eisbruch ueber Kreuz, der
   Gletscher kalbt, Eiszapfen-Vorhang, zum Schluss zwei grosse Abbrueche */
thShow('lb_gletscher',{sz:[0.95,1.3],pw:[0,2],hell:[0.9,1.3],kurve:'spaet'},[
  {n:3,gap:1.4,muster:'mitte',ang:0.2,licht:'eiskristall',farbe:0},
  {n:6,gap:0.3,muster:'welle',ang:0.35,licht:'eiszapfen',farbe:1},
  {mit:true,n:3,gap:0.9,muster:'gerade',licht:'eiskristall',farbe:2,pause:0.8,boden:{k:'fountain',alt:true,gt:5,gh:1.0,A:'weiss',B:'eisblau'}},
  {n:8,gap:0.25,muster:'x',ang:0.4,licht:'eiskristall',farbe:1},
  {n:4,gap:0.8,muster:'aussen',ang:0.3,licht:'kalben',farbe:2,pause:1.2},
  {n:8,gap:0.12,muster:'kreis',ang:0.3,licht:'eiszapfen',kal:'gross',farbe:0},
  {n:2,gap:0.2,muster:'v',ang:0.2,licht:'kalben',kal:'gross',farbe:1,pause:6}]);
/* L25 - Grollen in der Aschewolke, der Ausbruch (Lavastrahlen),
   Lavabomben und Ascheregen ueber der Lavaquelle, zweites Grollen,
   zweiter, groesserer Ausbruch, Finale: zwoelf Lavabomben im Kreis */
thShow('lb_vulkan',{sz:[0.95,1.35],pw:[0,3],hell:[0.9,1.35],kurve:'spaet'},[
  {n:2,gap:1.6,muster:'v',ang:0.15,licht:'aschewolke',farbe:2,pause:1},
  {n:8,gap:0.18,muster:'mitte',ang:0.35,licht:'lavastrahl',farbe:0},
  {n:6,gap:0.9,muster:'aussen',ang:0.3,licht:'lavabombe',farbe:1,pause:0.5},
  {mit:true,n:4,gap:1.1,muster:'zufall',ang:0.3,licht:'ascheregen',farbe:3,pause:1,boden:{k:'volcano',alt:true,gt:6,gh:1.1,A:'rot',B:'orange'}},
  {n:2,gap:0.6,muster:'paar',ang:0.2,licht:'aschewolke',farbe:2,pause:0.8},
  {n:10,gap:0.14,muster:'w',ang:0.4,licht:'lavastrahl',farbe:1},
  {n:12,gap:0.12,muster:'kreis',ang:0.35,licht:'lavabombe',kal:'gross',farbe:0,pause:6}]);
Object.assign(SIGNATUR,{
  lb_tautropfen:{idee:'Tautropfen',eff:'licht:tauperle',text:'Silberperlen hängen am Himmel und tropfen einzeln herab'},
  lb_zitronenfalter:{idee:'Zitronenfalter',eff:'licht:flatterkomet',text:'Gelbe Kometen flattern im Zickzack, Falterpaare umtanzen einander'},
  lb_lavendelfeld:{idee:'Lavendelfeld',eff:'licht:lavendelrispe',text:'Lila Rispen wachsen in den Himmel und wiegen sich im Wind'},
  lb_herbstlaub:{idee:'Herbstlaub',eff:'licht:blaetterfall',text:'Blätter taumeln flackernd herab, ein Windstoß wirbelt Laub im Kreis'},
  lb_kolibri:{idee:'Kolibri',eff:'licht:schwirrkomet',text:'Grüne Kometen schwirren in Sprüngen und stehen schillernd still'},
  lb_vollmond:{idee:'Vollmond',eff:'licht:mondhof',text:'Cremeweißer Mond mit Silberhof, Wolkenschleier und Mondsicheln'},
  lb_lagune:{idee:'Lagune',eff:'licht:fischschwarm',text:'Fischschwärme mit zappelnden Schwänzen, Anemonen und Luftblasen'},
  lb_sonnenblumen:{idee:'Sonnenblumen',eff:'licht:sonnenblume',text:'Gelbe Blütenkränze, deren Kerne in der Spirale aufknacken'},
  lb_gletscher:{idee:'Gletscher',eff:'licht:eiskristall',text:'Eiskristalle mit sechs Ästen, Eiszapfen-Vorhang und kalbendes Eis'},
  lb_vulkan:{idee:'Vulkanausbruch',eff:'licht:lavabombe',text:'Aschewolke mit Blitzen, Lavastrahlen, Lavabomben und Ascheregen'}
});
