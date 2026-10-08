/* =========================================================
   Runde 4 (07.10., Toms Test V117: "10 neue thematisierte Batterien,
   davon 2-3 extreme fuer die Koenigsklasse ... schoene, realistische
   Effekte, themenbasiert" und "10 neue Kugelbomben"). Daten: 02g,
   Verpackung: 04i.
   Regeln (tom-test/befunde.md, fw-analyse/leitlinien.md):
   - ein Bild aus der Natur je Batterie, eine Farbfamilie, die es im
     Sortiment noch nicht gibt; Name = Bild
   - nur Effekte, die es in echt gibt (Paeonie, Chrysantheme, Pistill,
     Crossette, Kamuro, Weide, Palme, Rossschweif, Blinker, Knister,
     Bienen/Fische, Feuerkugel, Mehrschlagbombe) - keine Figuren
   - eigene Rohrfolge und eigene Dramaturgie, kein Fontaenen-Opener,
     keine Bodenfontaene; ein Loch = ein Schuss
   - jeder Bruch mit passendem Klang (bk*-Palette), jeder Abschuss klingt
     (14x ABSCHUSS); das Abschussbild je Batterie (P.abschuss) passt zur
     Ladung
   - Steigerung: Hoehe, Kaliber, Schuss und Dauer wachsen mit dem Level
   Je Batterie ein eigenes Bruchbild (Signatur), dazu bewaehrte Brueche.
   ========================================================= */
Object.assign(FW,{kornblau:[.42,.6,1],mohnrot:[1,.10,.05],koralle:[1,.42,.30],samtblau:[.16,.24,1],champagner:[1,.88,.6],tanne:[.10,.85,.30]});

/* ---------- Klaenge ---------- */
Object.assign(sfx,{
  /* Summen eines Schwarms: viele leise Fluegelpulse um 200-260 Hz */
  summen:(v,dur)=>{ if(!AC) return; dur=dur||1.4; for(let t=0;t<dur;t+=0.045) bkR(t,{dur:0.04,vol:0.035*v*(1-t/dur*0.6),typ:'bandpass',f:rand(210,280),q:3}); },
  /* Rauschen eines Wasserfalls: breites rosa Rauschen, schwillt an */
  tosen:(v,dur)=>{ if(!AC) return; dur=dur||3; rauschF({dur,vol:0.09*v,typ:'bandpass',f:700,f2:420,q:0.5,rosa:true,an:dur*0.3}); },
  /* Fluegelschlag eines grossen Vogels: zwei, drei tiefe Luftstoesse */
  schwingen:v=>{ if(!AC) return; for(let i=0;i<3;i++) bkR(i*0.32,{dur:0.22,vol:0.09*v,typ:'bandpass',f:320,f2:180,q:0.8,an:0.06}); }
});
/* Abschussbild je Batterie (14x ABSCHUSS): was die Ladung verlangt */
const R4_ABSCHUSS={kornblumen:'puff',bienenweide:'tock',weinlese:'pock',mohnfeld:'doppel',winterwald:'pff',fuchsien:'puff',korallenriff:'pock',schwarzersamt:null,meteorschauer:null,phoenix:null};

/* ---------- Werkzeuge ---------- */
/* Knacken am Ort: ein Bild weisser Blitz und ein paar Funken */
function r4Knack(e,n,hell){ const a=SCHWEIF; SCHWEIF=0; hell=(hell||1)*0.6; psSmall.emit(e.x,e.y,e.z,0,0,0,1.6*hell,1.55*hell,1.4*hell,0.05,0,0);
  for(let j=0;j<(n||5);j++){ const d=randDir(), w=rand(2,4.5); psSmall.emit(e.x,e.y,e.z,d[0]*w,d[1]*w,d[2]*w,1.4,1.35,1.2,rand(0.08,0.2),1,0); } SCHWEIF=a; }

/* =========================================================
   Bruchbilder der Batterien (je eins ist die Signatur)
   ========================================================= */
/* Kornblume: blaue Paeonie, jeder Stern zerfranst am Ende in drei feine
   blaue Funken (die gezackten Kornblumenblaetter), in der Mitte ein
   kleiner goldener Kern wie die Staubbeutel */
EFF.kornblume=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(44*s*q)+10, G=2.4, T=1.2;
  for(let i=0;i<n;i++){ const d=randDir(), v=kgMal(d,rand(9.5,11)*s);
    kgStern(psBig,p,v,kgMal(A,1.8),T,G,0,0.14);
    kgSpaeter(T*0.97,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T*0.97), w=bahnTempo(v,G,T*0.97);
      for(let k=0;k<3;k++){ const dd=randDir(); psMid.emit(e.x,e.y,e.z,w[0]*0.25+dd[0]*2.2,w[1]*0.25+dd[1]*2.2,w[2]*0.25+dd[2]*2.2,A[0]*1.3,A[1]*1.3,A[2]*1.4,rand(0.35,0.6),1.5,0); } }); }
  for(let i=0;i<Math.round(10*q)+4;i++){ const d=randDir(); kgStern(psMid,p,kgMal(d,rand(2,3.2)*s),kgMal(B,1.3),rand(0.9,1.2),2,4,0.05); }
  schall(p,x=>later(T,()=>sfx.prasseln(x*0.45))); };
/* Kleebluete (Bienenweide): ein dichtes, rundes Kugelkoepfchen aus vielen
   kleinen Sternen, die kaum fliegen - violett mit weissen Spitzen */
EFF.kleebluete=function(p,A,B,s,r){ grOhneZutaten(r,0.4);
  const q=QUAL(), n=Math.round(70*s*q)+14, G=1.6;
  for(let i=0;i<n;i++){ const d=randDir(), v=kgMal(d,rand(5.2,6.4)*s), T=rand(1.3,1.6);
    const h=kgStern(psBig,p,v,kgMal(i%4?A:B,1.5),T,G,0,0.08); kgSpaeter(T*0.6,()=>kgFarbe(h,kgMal(mischF(A,B,0.6),1.4))); } };
/* Traube (Weinlese): sieben bis neun kleine violette Paeonien dicht
   beieinander, nach unten spitz zulaufend wie eine Weintraube - eine
   echte Bukett-Bombe, deren Kugeln kurz nacheinander aufgehen */
EFF.traube=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const [u,v]=basisBlick(p,0.2), reihen=[3,3,2,1], R=2.4*s; let k=0;
  reihen.forEach((m,ri)=>{ for(let j=0;j<m;j++){ const x=(j-(m-1)/2)*R, y=-ri*R*0.85+rand(-0.2,0.2), t=0.04+k*0.05+rand(0,0.04); k++;
    kgSpaeter(t,()=>{ const e={x:p.x+u[0]*x+v[0]*y,y:p.y+u[1]*x+v[1]*y,z:p.z+u[2]*x+v[2]*y}, n=Math.round(16*QUAL())+6;
      for(let i=0;i<n;i++){ const d=randDir(), vv=kgMal(d,rand(2.9,3.4)*s); kgStern(psBig,e,vv,kgMal(i%5?A:B,1.55),rand(1.1,1.4),2.2,0,0.08); } }); } });
  schall(p,x=>{ for(let i=0;i<4;i++) later(0.05+i*0.09,()=>sfx.plopp(x*0.4,1.2)); }); };
/* Mohnkapsel: rote Paeonie mit limettengruenem Herz; nach einem Atemzug
   rieseln aus dem Herz silberne Samen und knistern leise */
EFF.mohnkapsel=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(40*s*q)+8, G=2.3;
  for(let i=0;i<n;i++){ const d=randDir(), v=kgMal(d,rand(10,11.5)*s), T=rand(1.5,1.8);
    const h=kgStern(psBig,p,v,kgMal(A,1.5),T,G,0,0.14); kgSpaeter(T*0.7,()=>kgFarbe(h,kgMal(A,0.9))); }
  for(let i=0;i<Math.round(14*q)+4;i++){ const d=randDir(); kgStern(psBig,p,kgMal(d,rand(2.4,3.2)*s),kgMal(B,1.5),rand(1.0,1.3),2.0,0,0.05); }
  kgSpaeter(0.95,()=>{ for(let i=0;i<Math.round(46*q)+10;i++){ const d=randDir(), w=rand(1.6,3.6)*s; psSmall.emit(p.x,p.y,p.z,d[0]*w,d[1]*w-0.6,d[2]*w,0.8,0.85,0.9,rand(1.2,2.1),2.6,4); } });
  schall(p,x=>later(1.0,()=>{ sfx.crackle(x*0.35); later(0.3,()=>sfx.prasseln(x*0.4)); })); };
/* Raureif (Winterwald): weisse Chrysantheme, jeder Stern laesst auf
   seinem Weg Eiskristalle stehen, die langsam funkelnd sinken */
EFF.raureif=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(36*s*q)+8, G=2.4;
  for(let i=0;i<n;i++){ const d=randDir(), v=kgMal(d,rand(10.5,12)*s), T=rand(1.6,1.9);
    kgStern(psBig,p,v,kgMal(A,1.6),T,G,0,0.18);
    rkFunken(p,v,G,0.35,T,16,kgMal(B,0.95),{ps:psSmall,life:[1.6,2.6],g:0.35,streu:0.12,mit:0.02,mode:4,spur:0}); }
  schall(p,x=>later(0.4,()=>sfx.rieseln(x*0.5,2.5))); };
/* Fuchsie: magenta Glocke - die Sterne fliegen hoch und weit und fallen
   als Blaetterkelch zurueck; aus der Mitte haengen violette Staubfaeden
   lang herab (Sterne, die fast senkrecht sinken) */
EFF.fuchsie=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(30*s*q)+8, G=3.2;
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+rand(-0.1,0.1), el=rand(0.35,0.75), w=rand(10,11.5)*s, v=[Math.cos(a)*Math.cos(el)*w,Math.sin(el)*w,Math.sin(a)*Math.cos(el)*w], T=rand(1.9,2.3);
    kgStern(psBig,p,v,kgMal(A,1.5),T,G,0,0.3);
    rkFunken(p,v,G,0.1,T*0.9,22,kgMal(A,0.9),{ps:psMid,life:[0.4,0.8],g:1.8,streu:0.2,mit:0.05,mode:0}); }
  for(let i=0;i<Math.round(7*q)+3;i++){ const v=[rand(-0.8,0.8)*s,-rand(1.5,3)*s,rand(-0.8,0.8)*s], T=rand(2.4,2.9);
    kgStern(psBig,p,v,kgMal(B,1.6),T,1.2,0,0.6); rkFunken(p,v,1.2,0.05,T,16,kgMal(B,1.2),{ps:psMid,life:[0.5,0.9],g:0.6,streu:0.05,mit:0.02,mode:4}); }
  schall(p,x=>later(0.6,()=>sfx.rieseln(x*0.4,2))); };
/* Korallenast: kraeftige Korallensterne fliegen aus und verzweigen sich
   zweimal (Matsuba-Prinzip), die Astspitzen leuchten tuerkis */
EFF.korallenast=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(30*s*q)+6;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(10.5,12.5)*s;
    verzweig(psBig,p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,kgMal(A,1.45),1.9,2.4,{tz:rand(0.75,0.95),n:[2,3],tiefe:2,streu:1.4,spur:0.25,minTempo:2.2,C:kgMal(B,1.5),ps2:psMid}); }
  schall(p,x=>later(0.8,()=>{ sfx.crackle(x*0.45); later(0.3,()=>sfx.crackle(x*0.3)); })); };
/* Samtkrone (Schwarzer Samt): grosse, langsame samtblaue Paeonie; jeder
   Stern zieht einen dichten Goldbrokat-Schweif und zerfaellt am Ende in
   einen silbernen Blinkstern (Paeonie mit Brokatschweif zu Strobe) */
EFF.samtkrone=function(p,A,B,s,r){ grOhneZutaten(r,0.6);
  const q=QUAL(), n=Math.round(24*s*q)+8, G=2.0, T=1.9;
  for(let i=0;i<n;i++){ const d=randDir(), v=kgMal(d,rand(10,11.2)*s);
    kgStern(psBig,p,v,kgMal(A,1.4),T,G,0,0.2);
    rkFunken(p,v,G,0.08,T,15,[1.25,.9,.38],{ps:psBig,life:[0.9,1.5],g:0.9,streu:0.25,mit:0.04,mode:4,spur:0.12});
    if(i%2===0) kgSpaeter(T,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T), w=bahnTempo(v,G,T); psMid.emit(e.x,e.y,e.z,w[0]*0.3,w[1]*0.3,w[2]*0.3,B[0]*1.7,B[1]*1.7,B[2]*1.7,rand(1.2,1.8),2.2,1); }); }
  schall(p,x=>{ later(T*0.6,()=>sfx.rieseln(x*0.4,1.5)); later(T,()=>sfx.crackle(x*0.35)); }); };
/* Feuerkugel (Meteorschauer): ein grosser, gruen leuchtender Kopf fliegt
   schraeg weiter und zerbricht nach 0,7 s in eine Spur weisser Splitter,
   die seine Richtung behalten und knackend verloeschen - wie ein Bolide */
EFF.feuerkugel=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const G=2.6, T=0.8, k=Math.round(4+QUAL()*3), a0=rand(0,Math.PI*2);
  for(let j=0;j<k;j++){ const a=a0+j/k*Math.PI*2+rand(-0.35,0.35), el=rand(-0.35,0.45), w=rand(11,14)*s, vv=[Math.cos(a)*Math.cos(el)*w,Math.sin(el)*w,Math.sin(a)*Math.cos(el)*w];
    kgStern(psHuge,p,vv,kgMal(A,1.5),T,G,0,0.45); rkFunken(p,vv,G,0.03,T,120,kgMal(A,1.1),{ps:psMid,life:[0.45,0.9],g:2,streu:0.25,mit:0.08,mode:4});
    kgSpaeter(T,()=>{ const e=sternNach(p,vv[0],vv[1],vv[2],G,T), w=bahnTempo(vv,G,T);
      for(let i=0;i<Math.round(18*QUAL())+6;i++){ const d=randDir(), dv=[w[0]*0.8+d[0]*4.5,w[1]*0.8+d[1]*4.5,w[2]*0.8+d[2]*4.5], L=rand(0.6,1.2);
        kgStern(psBig,e,dv,kgMal(B,1.3),L,2.4,0,0.3); if(i%3===0) kgSpaeter(L,()=>r4Knack(sternNach(e,dv[0],dv[1],dv[2],2.4,L),2,0.5)); }
      }); }
  schall(p,x=>{ sfx.zischen(x*0.5,0.8); later(T,()=>{ sfx.crack(x*0.6); later(0.6,()=>sfx.crackle(x*0.45)); }); }); };
/* Phoenixfeder: zwoelf schwere scharlachrote Kometen steigen schraeg nach
   oben aus; nach einer Sekunde faechert jeder in fuenf goldene Federaeste
   mit roten Spitzen auf, die als Weide langsam sinken */
EFF.phoenixfeder=function(p,A,B,s,r){ grOhneZutaten(r,0.6);
  const n=Math.round(6*QUAL())+5, G=2.6, T=rand(0.9,1.15);
  for(let i=0;i<n;i++){ const a=rand(0,Math.PI*2), el=rand(-0.15,0.85), w=rand(10,13)*s, v=[Math.cos(a)*Math.cos(el)*w,Math.sin(el)*w,Math.sin(a)*Math.cos(el)*w];
    nKomet(p,v,kgMal(A,1.6),T,G,[1.1,.7,.25],40);
    kgSpaeter(T,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T), wv=bahnTempo(v,G,T);
      for(let k=0;k<5;k++){ const b=(k-2)*0.42+rand(-0.1,0.1), ca=Math.cos(b), sa=Math.sin(b), f=rand(0.5,0.75), dv=[(wv[0]*ca-wv[2]*sa)*f,wv[1]*0.4+rand(0.4,1.4),(wv[0]*sa+wv[2]*ca)*f], L=rand(2.6,3.4);
        const h=kgStern(psBig,e,dv,[1.5,1.05,.4],L,1.6,0,0.45); kgSpaeter(L*0.75,()=>kgFarbe(h,kgMal(A,1.4)));
        rkFunken(e,dv,1.6,0.05,L,9,[1.2,.78,.3],{ps:psBig,life:[1.0,1.6],g:0.7,streu:0.1,mit:0.03,mode:0,spur:0.25}); } }); }
  schall(p,x=>{ sfx.fauchen(x*0.5,1.0); later(T,()=>{ sfx.schwingen(x*0.9); sfx.rieseln(x*0.55,3); }); }); };
/* Fuchsienregen: magenta Sterne fliegen weit und haengen schwer herab,
   jeder zieht einen violetten Glitzerfaden - die haengenden Blueten */
EFF.fuchsienregen=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(36*s*q)+8, G=3.4;
  for(let i=0;i<n;i++){ const d=randDir(), v=kgMal(d,rand(8.5,10)*s), T=rand(2.4,2.9);
    kgStern(psBig,p,[v[0],v[1]*0.8+1.2,v[2]],kgMal(A,1.5),T,G,0,0.35);
    rkFunken(p,[v[0],v[1]*0.8+1.2,v[2]],G,0.3,T*0.9,12,kgMal(B,1.1),{ps:psMid,life:[0.6,1.1],g:1.2,streu:0.1,mit:0.03,mode:4}); }
  schall(p,x=>later(0.8,()=>sfx.rieseln(x*0.45,2.2))); };
Object.assign(EFF_SCHWEIF,{fuchsienregen:0.35,kornblume:0.12,kleebluete:0.08,traube:0.06,mohnkapsel:0.14,raureif:0.18,fuchsie:0.3,korallenast:0.25,samtkrone:0.2,feuerkugel:0.2,phoenixfeder:0.45});
Object.assign(EFF_FAMILIE,{fuchsienregen:'haenger',kornblume:'kugel',kleebluete:'kugel',traube:'kugel',mohnkapsel:'kugel',raureif:'kugel',fuchsie:'haenger',korallenast:'knister',samtkrone:'kugel',feuerkugel:'komet',phoenixfeder:'haenger'});
Object.assign(BRUCH_ART,{kornblume:'kugel',kleebluete:'figur',traube:'kern',mohnkapsel:'kern',raureif:'glitzer',fuchsie:'weide',korallenast:'knister',samtkrone:'weide',feuerkugel:'komet',phoenixfeder:'palme'});

/* =========================================================
   Bruchbilder der Kugelbomben (Hauptbild, je eins nur hier)
   ========================================================= */
/* Kugelstern: grosser Leuchtstern (psHuge) mit hellerem Kern (psBig) -
   gerendert 07.10.: mit psBig allein waren die Kugeln aus 90 m duenne
   Punktwolken, viel schwaecher als Himmelsbrecher oder Kronenkranz */
function r4KS(p,v,c,T,G,mode,spur){ const h=kgStern(psHuge,p,v,c,T,G,mode||0,spur===undefined?0.25:spur); kgStern(psBig,p,v,mischF(c,[1.6,1.6,1.6],0.35),T*0.92,G,mode||0,0); return h; }
/* Silberdistel 75: silberne Chrysantheme mit kurzen, harten Schweifen
   (Stacheln), innen ein violetter Bluetenkopf; am Ende knistern die Spitzen */
EFF.silberdistel=function(p,A,B,s,r){
  const n=Math.round(52*KQ(s))+20, G=2.4, T=1.8;
  for(let i=0;i<n;i++){ const d=randDir(), v=kgMal(d,rand(5.6,6.1)*s);
    r4KS(p,v,kgMal(A,1.7),T,G,0,0.3);
    rkFunken(p,v,G,0.05,T*0.8,26,[1.35,1.35,1.45],{ps:psMid,life:[0.3,0.6],g:1.5,streu:0.6,mit:0.15,mode:4,spur:0.05});
    if(i%3===0) kgSpaeter(T,()=>r4Knack(sternNach(p,v[0],v[1],v[2],G,T),4,0.8)); }
  for(let i=0;i<Math.round(18*KQ(s))+8;i++){ const d=randDir(); r4KS(p,kgMal(d,rand(2.2,2.6)*s),kgMal(B,1.7),rand(1.6,1.9),2.2,0,0.15); }
  schall(p,x=>later(T,()=>{ sfx.crackle(x*0.5); later(0.25,()=>sfx.crackle(x*0.35)); })); };
/* Hummelschwarm 75: goldene Wirbelsterne (Go-Getter) - jeder dreht sich
   und schiesst in Kurven auseinander, eine dichte Funkenspur dahinter */
EFF.hummelschwarm=function(p,A,B,s,r){
  const n=Math.round(24*KQ(s))+14, G=1.2;
  for(let i=0;i<n;i++){ const d=randDir(), v=kgMal(d,rand(2.6,3.2)*s), T=rand(1.8,2.4), h=r4KS(p,v,kgMal(A,1.8),T,G,0,0.5);
    const om=rand(5,8)*(i%2?1:-1), ph=rand(0,6.3), amp=rand(4,6)*Math.sqrt(s);
    for(let t=0.06;t<T;t+=0.06){ const tt=t; kgSpaeter(tt,()=>{ if(!kgLebt(h)) return; const j=h.i*3, V=h.ps.vel, a=ph+om*tt;
      V[j]+=Math.cos(a)*amp*0.22; V[j+2]+=Math.sin(a)*amp*0.22; V[j+1]+=Math.sin(a*0.7)*amp*0.1;
      const P0=h.ps.pos; for(let k=0;k<2;k++) psBig.emit(P0[j],P0[j+1],P0[j+2],rand(-.5,.5),rand(-.8,0),rand(-.5,.5),k?B[0]*1.4:A[0]*1.5,k?B[1]*1.4:A[1]*1.5,k?B[2]*1.45:A[2]*1.5,rand(0.4,0.75),1.2,4); }); } }
  schall(p,x=>{ sfx.summen(x*1.3,2.2); sfx.zischen(x*0.45,1.8); }); };
/* Blauregen 100: lavendelblaue Sterne stehen kurz, dann sinken sie und
   ziehen dichte, haengende Funkentrauben hinter sich her (Wisteria) */
EFF.blauregen=function(p,A,B,s,r){
  const n=Math.round(30*KQ(s))+16, G=1.1, T=3.4;
  for(let i=0;i<n;i++){ const d=randDir(); d[1]=d[1]*0.6+0.25; const v=kgMal(d,rand(4.6,5.2)*s);
    const h=r4KS(p,v,kgMal(A,1.6),T,G,0,0.5); kgSpaeter(1.1,()=>{ thFallen(h,2.2,kgMal(B,1.5),0.7); });
    rkFunken(p,v,G,0.9,T,50,mischF(kgMal(A,1.2),kgMal(B,1.2),0.5),{ps:psBig,life:[1.2,2.0],g:1.2,streu:0.18,mit:0.02,mode:0,spur:0.3}); }
  schall(p,x=>later(1.0,()=>sfx.rieseln(x*0.8,4))); };
/* Smaragdring 100: ein smaragdgruener Ring, schraeg zum Zuschauer, mit
   goldenem Pistill; nach 1,4 s knistert jeder Ringstern */
EFF.smaragdring=function(p,A,B,s,r){
  const G=2.2, T=2.0, hs=[];
  nRing(p,Math.round(26*KQ(s))+20,5.4*s,v=>{ hs.push(v); r4KS(p,v,kgMal(A,1.7),T,G,0,0.35); rkFunken(p,v,G,0.05,T*0.7,16,kgMal(A,1.1),{ps:psMid,life:[0.4,0.8],g:1.4,streu:0.15,mit:0.05,mode:4}); },0.45);
  for(let i=0;i<Math.round(22*KQ(s))+8;i++){ const d=randDir(); r4KS(p,kgMal(d,rand(2.2,2.6)*s),kgMal(B,1.6),rand(1.7,2.0),2,0,0.2); }
  kgSpaeter(1.4,()=>hs.forEach(v=>{ const e=sternNach(p,v[0],v[1],v[2],G,1.4); kgSpaeter(rand(0,0.45),()=>r4Knack(e,5,0.9)); }));
  schall(p,x=>later(1.4,()=>{ sfx.crackle(x*0.6); later(0.2,()=>sfx.crackle(x*0.45)); })); };
/* Abendrot 150: dreifache Paeonie (drei Schalen in einer Kugel) - aussen
   Gold, darin Orange, innen Glutrot; die Schalen verloeschen von aussen
   nach innen, die innere zuletzt */
EFF.abendrot=function(p,A,B,s,r){
  const k=KQ(s), C=(r&&r.C)||FW.rot, G=2.3;
  [[A,5.5,2.0,44],[B,3.9,2.3,30],[C,2.35,2.6,20]].forEach(([c,w,T,n0])=>{ const n=Math.round(n0*k)+10;
    for(let i=0;i<n;i++){ const d=randDir(), v=kgMal(d,rand(0.96,1.04)*w*s); const h=r4KS(p,v,kgMal(c,1.65),T,G,0,0.3); kgSpaeter(T*0.65,()=>kgFarbe(h,kgMal(c,1.1)));
      if(c===A&&i%2===0) rkFunken(p,v,G,0.05,T*0.8,24,kgMal(c,0.95),{ps:psBig,life:[0.6,1.1],g:1.6,streu:0.2,mit:0.05,mode:4}); } });
  schall(p,x=>later(1.6,()=>sfx.rieseln(x*0.6,2.5))); };
/* Kometenschlag 150: sechsunddreissig weisse Kometen mit Goldschweif
   fliegen weit hinaus - am Ende jeder Bahn ein kleiner, harter Knall */
EFF.kometenschlag=function(p,A,B,s,r){
  const n=36, G=2.4, T=1.5;
  nKugel(n,5.8*s,(v,i)=>{ nKomet(p,v,kgMal(A,1.8),T,G,kgMal(B,1.25),110);
    kgSpaeter(T+rand(0,0.25),()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T); r4Knack(e,14,1.3); flash(e,[1,1,1],1.2,0.06);
      schall(e,x=>sfx.crack(x*(i%3?0.55:0.8))); }); });
  schall(p,x=>sfx.zischen(x*0.6,1.3)); };
/* Seerose 200: ein flacher Kranz grosser weisser Blaetter oeffnet sich
   waagerecht (leicht nach oben), die Spitzen werden rosa; darin ein
   kleinerer rosa Kranz und ein goldener Stempel */
EFF.seerose=function(p,A,B,s,r){
  const k=KQ(s), G=1.6;
  nKranz(Math.round(16*k)+16,4.6*s,v=>{ const T=rand(2.6,3.0), h=r4KS(p,v,kgMal(A,1.6),T,G,0,0.45);
    kgSpaeter(1.2,()=>kgFarbe(h,kgMal(B,1.6))); rkFunken(p,v,G,0.1,T*0.8,20,[1.25,1.15,1.1],{ps:psMid,life:[0.4,0.8],g:1,streu:0.15,mit:0.03,mode:4}); },0.12);
  kgSpaeter(0.15,()=>nKranz(Math.round(12*k)+10,2.9*s,v=>{ r4KS(p,v,kgMal(B,1.6),rand(2.2,2.5),G,0,0.35); },0.3));
  for(let i=0;i<Math.round(14*k)+8;i++){ const d=randDir(); kgStern(psHuge,p,kgMal(d,rand(1.0,1.4)*s),kgMal(FW.gold,1.6),rand(2.0,2.4),1.4,4,0.1); }
  schall(p,x=>later(0.5,()=>sfx.rieseln(x*0.6,3))); };
/* Granatapfel 200: grosse tiefrote Paeonie; nach 1,15 s zerspringt jeder
   Stern in vier rubinrote Kerne, die funkelnd herabrieseln */
EFF.granatapfel=function(p,A,B,s,r){
  const n=Math.round(30*KQ(s))+16, G=2.3, T=1.15;
  for(let i=0;i<n;i++){ const d=randDir(), v=kgMal(d,rand(4.7,5.2)*s);
    r4KS(p,v,kgMal(A,1.7),T,G,0,0.3); rkFunken(p,v,G,0.04,T,30,kgMal(A,0.9),{ps:psBig,life:[0.5,0.9],g:1.8,streu:0.2,mit:0.05,mode:0});
    kgSpaeter(T,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T), w=bahnTempo(v,G,T);
      for(let k=0;k<4;k++){ const dd=randDir(), dv=[w[0]*0.35+dd[0]*2.6,w[1]*0.35+dd[1]*2.6,w[2]*0.35+dd[2]*2.6];
        kgStern(psBig,e,dv,kgMal(B,1.6),rand(1.4,1.9),2.6,4,0.15); } }); }
  schall(p,x=>later(T,()=>{ sfx.crackle(x*0.55); sfx.rieseln(x*0.5,2.2); })); };
/* Riesenpalme 300: zwanzig schwere Goldwedel mit dickem Stamm sinken als
   riesige Palme, dazwischen ein Ring blauer Leuchtsterne */
EFF.riesenpalme=function(p,A,B,s,r){
    const n=Math.round(8*QUAL())+12, a0=rand(0,Math.PI*2), G=2.4, T=4.2;
  for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2+rand(-0.12,0.12), el=rand(0.15,0.55), w=rand(4.4,5.0)*s, v=[Math.cos(a)*Math.cos(el)*w,Math.sin(el)*w,Math.sin(a)*Math.cos(el)*w];
    kgStern(psHuge,p,v,[1.15,.8,.33],T,G,0,0.8); kgStern(psBig,p,kgMal(v,0.97),[1.3,.95,.4],T*0.95,G,0,0.8);
    rkFunken(p,v,G,0.04,T*0.9,150,GOLDF,{ps:psBig,life:[1.2,2.0],g:1.3,streu:0.2,mit:0.04,mode:4,spur:0.15}); }
  nRing(p,Math.round(14*KQ(s))+12,2.4*s,v=>{ r4KS(p,v,kgMal(B,1.7),2.6,1.8,0,0.3); },0.4);
  schall(p,x=>{ sfx.wumms(x*0.8); later(0.6,()=>sfx.bkBrokat(x*0.9)); }); };
/* Himmelstreppe 300: Mehrschlagbombe - die Kugel bricht viermal und
   steigt dazwischen weiter: Gold, Rot, Blau, oben eine Silberkrone */
EFF.himmelstreppe=function(p,A,B,s,r){
  const k=KQ(s), C=(r&&r.C)||FW.blau, stufe=(e,c,w,n,T)=>{ for(let i=0;i<n;i++){ const d=randDir(), v=kgMal(d,rand(0.95,1.05)*w); r4KS(e,v,kgMal(c,1.65),T,2.3,0,0.3); }
    flash(e,c,2,0.15); };
  stufe(p,A,2.6*s,Math.round(18*k)+12,1.6);
  /* jeder Schlag ein eigener Teil der Kugel: er steigt aus dem vorigen weiter */
  const weiter=(von,dy,T,fn)=>{ const v=[rand(-0.5,0.5),dy,rand(-0.5,0.5)]; nKomet(von,v,[1.6,1.3,.75],T,2.6,[1,.75,.35],70); kgSpaeter(T,()=>fn(sternNach(von,v[0],v[1],v[2],2.6,T))); };
  kgSpaeter(0.05,()=>weiter(p,9,0.6,e2=>{ stufe(e2,B,2.8*s,Math.round(18*k)+12,1.7); schall(e2,x=>sfx.boom(x*0.9));
    weiter(e2,9,0.6,e3=>{ stufe(e3,C,3.0*s,Math.round(18*k)+12,1.8); schall(e3,x=>sfx.boom(x*1.0));
      weiter(e3,9,0.65,e4=>{ flash(e4,[1,1,1],1.4,0.2);
        for(let i=0;i<Math.round(60*k)+30;i++){ const d=randDir(), v=kgMal(d,rand(4.4,5.0)*s), T=rand(3.2,3.8);
          r4KS(e4,v,[1.6,1.65,1.75],T,1.6,0,0.6); rkFunken(e4,v,1.6,0.1,T*0.85,20,[1.25,1.3,1.4],{ps:psMid,life:[0.9,1.5],g:0.8,streu:0.1,mit:0.03,mode:4}); }
        schall(e4,x=>{ sfx.boom(x*1.3); later(0.6,()=>sfx.rieseln(x*0.8,4.5)); }); }); }); }));
};
['silberdistel','hummelschwarm','blauregen','smaragdring','abendrot','kometenschlag','seerose','granatapfel','riesenpalme','himmelstreppe'].forEach(n=>{ const f=EFF[n]; EFF[n]=function(){ const alt=STERN_LEBEN; STERN_LEBEN=1.3; try{ return f.apply(this,arguments); } finally{ STERN_LEBEN=alt; } }; });
Object.assign(EFF_SCHWEIF,{silberdistel:0.1,hummelschwarm:0.35,blauregen:0.5,smaragdring:0.15,abendrot:0.12,kometenschlag:0.3,seerose:0.35,granatapfel:0.14,riesenpalme:0.6,himmelstreppe:0.12});
Object.assign(EFF_FAMILIE,{silberdistel:'kugel',hummelschwarm:'knister',blauregen:'haenger',smaragdring:'kugel',abendrot:'kugel',kometenschlag:'komet',seerose:'kugel',granatapfel:'kugel',riesenpalme:'haenger',himmelstreppe:'kugel'});

/* ---------- Kugelbomben ---------- */
Object.assign(KUGEL,{
  silberdistel75:{kal:1,th:'silber',haupt:'silberdistel',A:'silber',B:'violett',steig:'silber',bruchOpt:{kern:false,nachglitzer:false,flash:0.5},stufen:[]},
  hummelschwarm75:{kal:1,th:'gold',haupt:'hummelschwarm',A:'gold',B:'silber',steig:'gold',bruchOpt:{kern:false,nachglitzer:false,flash:0.4},stufen:[]},
  blauregen100:{kal:2,th:'silber',haupt:'blauregen',A:'lavendel',B:'indigo',steig:'glut',bruchOpt:{kern:false,nachglitzer:false,flash:0.4},stufen:[]},
  smaragdring100:{kal:2,th:'gold',haupt:'smaragdring',A:'smaragd',B:'gold',steig:'silber',bruchOpt:{kern:false,nachglitzer:false,flash:0.5},stufen:[]},
  abendrot150:{kal:3,th:'glut',haupt:'abendrot',A:'gold',B:'orange',C:'rot',steig:'brokat',bruchOpt:{kern:false,nachglitzer:false,flash:0.6},stufen:[]},
  kometenschlag150:{kal:3,th:'silber',haupt:'kometenschlag',A:'weiss',B:'gold',steig:'titanspur',bruchOpt:{kern:false,nachglitzer:false,flash:0.6},stufen:[]},
  seerose200:{kal:4,th:'silber',haupt:'seerose',A:'weiss',B:'rose',steig:'silber',bruchOpt:{kern:false,nachglitzer:false,flash:0.5},stufen:[]},
  granatapfel200:{kal:4,th:'glut',haupt:'granatapfel',A:'rot',B:'rose',steig:'glut',bruchOpt:{kern:false,nachglitzer:false,flash:0.6},ton:'bkDoppel',stufen:[]},
  riesenpalme300:{kal:5,th:'gold',haupt:'riesenpalme',A:'gold',B:'blau',steig:'gold',bruchOpt:{kern:false,nachglitzer:false,flash:0.7},ton:'bkWumms',
    stufen:[{t:2.3,eff:'chrys',sz:0.32,n:8,kranz:1.0,A:'blau',B:'gold',bruchOpt:{kern:false,nachglitzer:false}}]},
  himmelstreppe300:{kal:5,th:'koenig',haupt:'himmelstreppe',A:'gold',B:'rot',C:'blau',steig:'brokat',bruchOpt:{kern:false,nachglitzer:false,flash:0.6},stufen:[]}
});
for(const id of Object.keys(KUGEL)) if(/^(silberdistel75|hummelschwarm75|blauregen100|smaragdring100|abendrot150|kometenschlag150|seerose200|granatapfel200|riesenpalme300|himmelstreppe300)$/.test(id)) Object.assign(KUGEL[id],Object.assign({},KAL_WERTE[KUGEL[id].kal],KUGEL[id]));
/* Raeumlicher Massstab (14u KG_RAUM): gemessen in der Vorfuehrung, Ziel
   wie die anderen Kugeln gleichen Kalibers (hoehen.js KUGELGROSS) */
/* 07.10. gemessen (Durchmesser 90 % der Sterne) und auf 75/82/92/105/120 m je Kaliber gestellt */
const R4_RAUM={silberdistel75:3.0,hummelschwarm75:2.6,blauregen100:3.4,smaragdring100:3.0,abendrot150:2.8,kometenschlag150:2.6,seerose200:3.2,granatapfel200:3.1,riesenpalme300:1.85,himmelstreppe300:2.2};
for(const id of Object.keys(R4_RAUM)) if(KUGEL[id]) KUGEL[id].raum=R4_RAUM[id];
Object.assign(SIGNATUR,{
  silberdistel75:{eff:'silberdistel',text:'Silberne Stachel-Chrysantheme mit violettem Kopf, knisternde Spitzen'},
  hummelschwarm75:{eff:'hummelschwarm',text:'Dreißig summende goldene Wirbelsterne'},
  blauregen100:{eff:'blauregen',text:'Lavendelblaue Sterne sinken als hängende Funkentrauben'},
  smaragdring100:{eff:'smaragdring',text:'Schräger Smaragdring mit Goldpistill, der knisternd zerfällt'},
  abendrot150:{eff:'abendrot',text:'Dreifachpäonie Gold, Orange, Glutrot'},
  kometenschlag150:{eff:'kometenschlag',text:'Vierundzwanzig Kometen, jeder endet mit einem Knall'},
  seerose200:{eff:'seerose',text:'Waagerechter Blütenkranz, Spitzen werden rosa, goldener Stempel'},
  granatapfel200:{eff:'granatapfel',text:'Tiefrote Päonie zerspringt in funkelnde Rubinkerne'},
  riesenpalme300:{eff:'riesenpalme',text:'Riesige Goldpalme mit blauem Leuchtring und acht Buketts'},
  himmelstreppe300:{eff:'himmelstreppe',text:'Vier Schläge übereinander bis zur Silberkrone'}
});

/* =========================================================
   Die zehn Batterien
   Grundstufe (Hoehe pw, Kaliber sz) nach dem Level wie die Batterien
   gleichen Levels (SHOW_BASIS: roemisch L2 -9/0,45 ... profi L22
   2,5/1,22, Weltuntergang 3,5/1,3).
   ========================================================= */
/* anomalie.js STEIGERUNG: die Grundstufe darf nie unter einem Produkt
   niedrigeren Levels und nie ueber einem hoeheren liegen - gemessen an
   allen vorhandenen Batterien: Mitte zwischen dem Groessten darunter und
   dem Kleinsten darueber (gezaehlt 07.10.: Schwarzer Samt L23 lag mit der
   Formel ueber Goetterfunken L24) */
function r4Basis(id,l){ const f0={pw:+(l<=20?-9+(l-2)*11/18:2+(l-20)*0.4).toFixed(2),sz:+(0.45+(l-2)*0.036).toFixed(3)};
  let lo=null, hi=null;
  for(const t of Object.keys(SHOWS)){ const q=P[t]; if(t===id||!q||(q.shape!=='battery'&&q.shape!=='fan')||ENTFERNT.indexOf(t)>=0) continue;
    let b=null; try{ const sh=SHOWS[t](); b=sh&&(sh.basis||SHOW_BASIS[t]); }catch(e){} if(!b||typeof b.pw!=='number') continue;
    if(q.lvl<l){ lo=lo?{pw:Math.max(lo.pw,b.pw),sz:Math.max(lo.sz,b.sz)}:{pw:b.pw,sz:b.sz}; }
    else if(q.lvl>l){ hi=hi?{pw:Math.min(hi.pw,b.pw),sz:Math.min(hi.sz,b.sz)}:{pw:b.pw,sz:b.sz}; } }
  const k=(a,b,f)=>lo&&hi?(a+b)/2:lo?Math.max(a+0.05,f):hi?Math.min(b-0.05,f):f;
  return {pw:+k(lo&&lo.pw,hi&&hi.pw,f0.pw).toFixed(3),sz:+k(lo&&lo.sz,hi&&hi.sz,f0.sz).toFixed(4),th:id}; }
function r4Show(id,th,rampe,ph){ r3Show(id,th,rampe,ph,{basis:r4Basis(id,P[id]?P[id].lvl:10)}); r3OhneKern(id);
  if(R4_ABSCHUSS[id]&&P[id]) P[id].abschuss=R4_ABSCHUSS[id]; }

/* 1 KORNBLUMEN (L2, 9): drei Kornblumen einzeln aus der Mitte, goldene
   Weizenaehren paarweise, zwei Kornblumen zugleich - klein, leise */
r4Show('kornblumen',[['kornblau','gold'],['gold','zitrone'],['kornblau','weiss']],{sz:[0.9,1.25],pw:[0,2],hell:[0.9,1.25],kurve:'linear'},[
  {n:3,gap:1.4,muster:'mitte',ang:0.16,eff:'kornblume',kal:'klein',farbe:0,steig:'silber',knall:'bkPuff',pause:0.8},
  {n:4,gap:0.9,muster:'paar',ang:0.3,eff:'chrys',kal:'klein',farbe:1,steig:'gold',knall:'bkRieseln',pause:1.0},
  {n:2,gap:0.25,muster:'v',ang:0.24,eff:'kornblume',kal:'mittel',farbe:2,steig:'silber',knall:'bkPlopp',pause:3}]);
SIGNATUR.kornblumen={idee:'Kornblumen',eff:'kornblume',text:'blaue Paeonien mit gefransten Spitzen ueber goldenen Aehren'};
/* 2 BIENENWEIDE (L5, 12): Kleebluete aussen, ein Bienenschwarm im
   Scheibenwischer, Klee kreuz und quer, zum Schluss Bienen um den Klee */
r4Show('bienenweide',[['lavendel','weiss'],['bernstein','zitrone'],['violett','rose']],{sz:[0.9,1.28],pw:[0,2],hell:[0.9,1.25],kurve:'linear'},[
  {n:2,gap:1.5,muster:'aussen',ang:0.3,eff:'kleebluete',kal:'klein',farbe:0,steig:'glut',knall:'bkPuff',pause:1.0},
  {n:4,gap:0.32,muster:'wischer',ang:0.32,eff:'bienen',kal:'klein',farbe:1,steig:'gold',knall:'bkZisch',pause:1.2},
  {n:3,gap:0.8,muster:'zufall',ang:0.26,eff:'kleebluete',kal:'mittel',farbe:2,steig:'glut',knall:'bkKlack',pause:0.9},
  {n:3,gap:0.22,muster:'mitte',ang:0.22,eff:['bienen','kleebluete','bienen'],kal:'mittel',farbe:1,steig:'gold',knall:'bkZisch',pause:3}]);
SIGNATUR.bienenweide={idee:'Bienenweide',eff:'kleebluete',text:'violette Kleebluetenkoepfchen und summende Bienenschwaerme'};
/* 3 WEINLESE (L8, 16): Weinblaetter im Zickzack, Trauben paarweise,
   goldener Wein in der Welle, zum Schluss Trauben von aussen */
r4Show('weinlese',[['violett','indigo'],['limette','gruen'],['magenta','violett'],['gold','bernstein']],{sz:[0.9,1.3],pw:[0,2.2],hell:[0.9,1.28],kurve:'linear'},[
  {n:4,gap:0.7,muster:'z',ang:0.3,eff:'chrys',kal:'klein',farbe:1,steig:'silber',knall:'bkRieseln',pause:0.9},
  {n:4,gap:1.0,muster:'paar',ang:0.26,eff:'traube',kal:'mittel',farbe:0,steig:'glut',knall:'bkKaskade',pause:1.0},
  {n:4,gap:0.5,muster:'welle',ang:0.3,eff:'goldkaskade',kal:'mittel',farbe:3,steig:'gold',knall:'bkRieseln',pause:1.0},
  {n:4,gap:0.26,muster:'aussen',ang:0.28,eff:'traube',kal:'mittel',farbe:2,steig:'glut',knall:'bkKaskade',pause:3}]);
SIGNATUR.weinlese={idee:'Weinlese',eff:'traube',text:'violette Traubenbuketts, gruene Weinblaetter und goldener Wein'};
/* 4 MOHNFELD (L11, 22): Mohnkapseln verstreut, das Feld wiegt sich im
   Wind (rote Chrysanthemen in der Hoehenwelle), knisternde Kapseln ueber
   Kreuz, Finale im W */
r4Show('mohnfeld',[['mohnrot','limette'],['scharlach','mohnrot'],['rot','zitrone']],{sz:[0.9,1.3],pw:[0,2.4],hell:[0.9,1.3],kurve:'linear'},[
  {n:4,gap:0.95,muster:'zufall',ang:0.3,eff:'mohnkapsel',kal:'mittel',farbe:0,steig:'glut',knall:'bkDoppel',pause:0.9},
  {n:6,gap:0.35,muster:'welle',ang:0.32,hoehe:'welle',hSpanne:3,eff:'chrys',kal:'klein',farbe:1,steig:'silber',knall:'bkRieseln',pause:1.0},
  {mit:true,n:4,gap:0.6,muster:'x',ang:0.3,eff:'drachenei',kal:'mittel',farbe:2,steig:'knister',knall:'bkKnisterhall',pause:1.0},
  {n:8,gap:0.18,muster:'w',ang:0.34,eff:['mohnkapsel','chrys'],kal:'mittel',farbe:0,steig:'glut',knall:'bkDoppel',pause:3.5}]);
SIGNATUR.mohnfeld={idee:'Mohnfeld',eff:'mohnkapsel',text:'rote Mohnblueten mit gruenem Herz, aus dem silberne Samen rieseln'};
/* 5 WINTERWALD (L14, 28): Raureif aussen, Tannenzweige im Zickzack,
   Schneeglitzer im Wischer, Ilexbeeren werden weiss, Finale im Kreis */
r4Show('winterwald',[['weiss','silber'],['tanne','weiss'],['silber','weiss'],['rot','weiss']],{sz:[0.9,1.32],pw:[0,2.6],hell:[0.9,1.3],kurve:'linear'},[
  {n:4,gap:1.1,muster:'aussen',ang:0.3,eff:'raureif',kal:'mittel',farbe:0,steig:'silber',knall:'bkRieseln',pause:0.8},
  {n:6,gap:0.4,muster:'z',ang:0.32,eff:'kiefernkrone',kal:'mittel',farbe:1,steig:'knister',knall:'bkKnisterhall',pause:1.0},
  {mit:true,n:6,gap:0.25,muster:'wischer',ang:0.34,eff:'sternspritzer',kal:'klein',farbe:2,steig:'silber',knall:'bkZisch',pause:1.0},
  {n:4,gap:0.8,muster:'paar',ang:0.24,eff:'wechsel',kal:'mittel',farbe:3,steig:'glut',knall:'bkDoppel',pause:1.0},
  {n:8,gap:0.16,muster:'kreis',ang:0.3,eff:['raureif','kiefernkrone','wechsel','raureif'],kal:'gross',farbe:0,steig:'silber',knall:'bkKnisterhall',pause:4}]);
SIGNATUR.winterwald={idee:'Winterwald',eff:'raureif',text:'Raureif-Chrysanthemen, gruene Tannenzweige und rote Ilexbeeren'};
/* 6 FUCHSIEN (L17, 36): drei Fuchsienglocken aus der Mitte, violette
   Chrysanthemen in der Spirale, Pistille paarweise, haengende magenta
   Weiden in der Welle, Finale im W */
r4Show('fuchsien',[['magenta','violett'],['violett','magenta'],['magenta','lavendel'],['rose','magenta']],{sz:[0.92,1.32],pw:[0,2.8],hell:[0.9,1.3],kurve:'welle'},[
  {n:3,gap:1.4,muster:'mitte',ang:0.15,eff:'fuchsie',kal:'gross',farbe:0,steig:'glut',knall:'bkPuff',pause:1.0},
  {n:8,gap:0.3,muster:'spirale',ang:0.3,eff:'chrys',kal:'mittel',farbe:1,steig:'silber',knall:'bkRieseln',pause:1.0},
  {n:6,gap:0.55,muster:'paar',ang:0.3,eff:'wechsel',kal:'mittel',farbe:2,steig:'glut',knall:'bkDoppel',pause:1.0},
  {mit:true,n:7,gap:0.35,muster:'welle',ang:0.32,eff:'fuchsienregen',kal:'gross',farbe:3,steig:'glut',knall:'bkRieseln',pause:1.2},
  {n:12,gap:0.14,muster:'w',ang:0.34,eff:['fuchsie','wechsel','fuchsie','fuchsienregen'],kal:'gross',farbe:0,steig:'glut',knall:'bkDonnerhall',pause:4.5}]);
SIGNATUR.fuchsien={idee:'Fuchsien',eff:'fuchsie',text:'magenta Bluetenglocken mit haengenden violetten Staubfaeden'};
/* 7 KORALLENRIFF (L20, 48): Korallen wachsen aussen, Fischschwaerme im
   Wischer, tuerkise Anemonen (Dahlien) paarweise, Plankton im Zickzack,
   vier riesige Korallen aus der Mitte, Finale das ganze Riff im Kreis */
r4Show('korallenriff',[['koralle','tuerkis'],['tuerkis','weiss'],['tuerkis','koralle'],['weiss','tuerkis']],{sz:[0.92,1.34],pw:[0,3],hell:[0.9,1.3],kurve:'linear'},[
  {n:4,gap:1.2,muster:'aussen',ang:0.32,eff:'korallenast',kal:'gross',farbe:0,steig:'glut',knall:'bkKnisterhall',pause:1.0},
  {n:10,gap:0.22,muster:'wischer',ang:0.36,eff:'fischschwarm',kal:'mittel',farbe:1,steig:'silber',knall:'bkZisch',pause:1.0},
  {n:6,gap:0.6,muster:'paar',ang:0.28,eff:'dahlie',kal:'gross',farbe:2,steig:'glut',knall:'bkDoppel',pause:1.0},
  {mit:true,n:8,gap:0.3,muster:'z',ang:0.3,eff:'sternspritzer',kal:'mittel',farbe:3,steig:'silber',knall:'bkKnisterhall',pause:1.0},
  {n:4,gap:1.0,muster:'mitte',ang:0.16,eff:'korallenast',kal:'riesig',farbe:0,steig:'glut',knall:'bkWumms',pause:0.8},
  {n:16,gap:0.12,muster:'kreis',ang:0.34,eff:['korallenast','fischschwarm','dahlie','korallenast'],kal:'gross',farbe:0,steig:'glut',knall:'bkDonnerhall',pause:5}]);
SIGNATUR.korallenriff={idee:'Korallenriff',eff:'korallenast',text:'verzweigte Korallen mit tuerkisen Spitzen, Fischschwaerme und Anemonen'};
/* 8 SCHWARZER SAMT (L23, 120): Eleganz in Schwarz - dunkle Aufstiege mit
   schweren Goldpalmen, samtblaue Dahlien in der Hoehenwelle, Silber-
   blinker im Wischer, Samtkronen paarweise, Goldkamuro mit Blinkern
   darin, ueber Kreuz, drei Salute, ein Finale aus 36 Schuss */
r4Show('schwarzersamt',[['gold','bernstein'],['samtblau','gold'],['weiss','silber']],{sz:[0.92,1.34],pw:[0,3],hell:[0.88,1.32],kurve:'spaet'},[
  {n:3,gap:1.6,muster:'mitte',ang:0.12,eff:'sternpalme',kal:'riesig',farbe:0,steig:'keiner',knall:'bkWumms',pause:1.2},
  {n:12,gap:0.45,muster:'welle',ang:0.32,hoehe:'welle',hSpanne:4,eff:'dahlie',kal:'gross',farbe:1,steig:'silber',knall:'bkDoppel',pause:1.0},
  {n:16,gap:0.15,muster:'wischer',ang:0.38,eff:'blinkregen',kal:'mittel',farbe:2,steig:'keiner',knall:'bkKnisterhall',pause:1.0},
  {n:10,gap:0.8,muster:'paar',ang:0.3,eff:'samtkrone',kal:'gross',farbe:1,steig:'glut',knall:'bkBrokat',pause:1.2},
  {n:8,gap:0.35,muster:'v',ang:0.26,eff:'kamuro',kal:'gross',farbe:0,steig:'glut',knall:'bkBrokat'},
  {mit:true,n:12,gap:0.25,muster:'zufall',ang:0.36,eff:'blinkregen',kal:'mittel',farbe:2,steig:'keiner',knall:'bkKnisterhall',pause:1.4},
  {n:20,gap:0.2,muster:'x',ang:0.32,eff:['samtkrone','dahlie'],kal:'gross',farbe:1,steig:'silber',knall:'bkDoppel',pause:1.2},
  {n:3,gap:0.5,muster:'mitte',ang:0.08,eff:'salut',kal:'gross',farbe:2,knall:'bkSalut',pause:0.6},
  {n:36,gap:0.08,muster:'w',ang:0.36,eff:['samtkrone','sternpalme','kamuro','blinkregen'],kal:'riesig',farbe:0,steig:'glut',knall:'bkDonnerhall',pause:7}]);
SIGNATUR.schwarzersamt={idee:'Schwarzer Samt',eff:'samtkrone',text:'samtblaue Paeonien mit Goldbrokat, die in Silberblinker zerfallen, Goldpalmen und Kamuro'};
/* 9 METEORSCHAUER (L24, 160): Feuerkugeln ziehen schraeg, Crossetten
   im Wischer, Meteorkoepfe ueber Kreuz, Feuerkugeln in der Spirale,
   Einschlaege (Salute) aussen, Crossetten und Sternspritzer im Zickzack,
   Pferdeschweife in der Welle, grosse Feuerkugeln paarweise, Finale */
r4Show('meteorschauer',[['limette','weiss'],['weiss','limette'],['silber','gruen'],['weiss','silber']],{sz:[0.92,1.36],pw:[0,3.2],hell:[0.88,1.32],kurve:'spaet'},[
  {n:5,gap:1.1,muster:'zufall',ang:0.4,eff:'feuerkugel',kal:'gross',farbe:0,steig:'keiner',knall:'bkZisch',pause:1.0},
  {n:20,gap:0.2,muster:'wischer',ang:0.38,eff:'kreuzstern',kal:'mittel',farbe:1,steig:'silber',knall:'bkKaskade',pause:1.0},
  {n:12,gap:0.45,muster:'x',ang:0.3,eff:'meteor',kal:'gross',farbe:2,steig:'keiner',pause:1.0},
  {n:16,gap:0.22,muster:'spirale',ang:0.32,eff:'feuerkugel',kal:'gross',farbe:0,steig:'keiner',knall:'bkZisch',pause:1.2},
  {mit:true,n:6,gap:0.6,muster:'aussen',ang:0.3,eff:'salut',kal:'gross',farbe:3,knall:'bkSalut',pause:0.8},
  {n:24,gap:0.15,muster:'z',ang:0.34,eff:['kreuzstern','sternspritzer'],kal:'gross',farbe:1,steig:'silber',knall:'bkKaskade',pause:1.2},
  {n:20,gap:0.25,muster:'welle',ang:0.34,eff:'rossschweif',kal:'gross',farbe:2,steig:'silber',knall:'bkBrokat',pause:1.4},
  {n:10,gap:0.4,muster:'paar',ang:0.3,eff:'feuerkugel',kal:'riesig',farbe:0,steig:'keiner',knall:'bkZisch',pause:1.0},
  {n:47,gap:0.07,muster:'kreis',ang:0.38,eff:['feuerkugel','kreuzstern','meteor','rossschweif','feuerkugel','kreuzstern'],kal:'riesig',farbe:0,steig:'silber',knall:'bkDonnerhall',pause:7}]);
SIGNATUR.meteorschauer={idee:'Meteorschauer',eff:'feuerkugel',text:'gruene Feuerkugeln, die in weisse Splitter zerbrechen, Crossetten und Einschlaege'};
/* 10 PHOENIX (L25, 200): aus der Glut (knisternde Kiefernkronen in
   Glutfarben), Fluegelschlaege (Phoenixfedern im V), Tigerschweife im
   Wischer, rote Dahlien in der Hoehenwelle, Salute aussen, Federn und
   Glut ueber Kreuz, Funkenregen (Zeitregen) in der Spirale, grosse
   Federn paarweise, Finale aus 60 Schuss, zuletzt die Glutkrone */
r4Show('phoenix',[['scharlach','gold'],['gold','scharlach'],['rot','orange'],['bernstein','rot']],{sz:[0.92,1.38],pw:[1.2,4.6],hell:[0.88,1.34],kurve:'spaet'},[
  {n:6,gap:0.9,muster:'zufall',ang:0.3,eff:'kiefernkrone',kal:'mittel',farbe:2,steig:'glut',knall:'bkKnisterhall',pause:1.2},
  {n:14,gap:0.5,muster:'v',ang:0.3,eff:'phoenixfeder',kal:'gross',farbe:0,steig:'glut',knall:'bkBrokat',pause:1.0},
  {n:24,gap:0.15,muster:'wischer',ang:0.38,eff:'tigerschweif',kal:'mittel',farbe:1,steig:'gold',knall:'bkZisch',pause:1.0},
  {n:16,gap:0.4,muster:'welle',ang:0.34,hoehe:'welle',hSpanne:4,eff:'dahlie',kal:'gross',farbe:2,steig:'glut',knall:'bkDoppel',pause:1.0},
  {mit:true,n:8,gap:0.6,muster:'aussen',ang:0.32,eff:'salut',kal:'gross',farbe:3,knall:'bkSalut',pause:1.0},
  {n:30,gap:0.15,muster:'x',ang:0.34,eff:['phoenixfeder','kiefernkrone'],kal:'gross',farbe:0,steig:'glut',knall:'bkBrokat',pause:1.2},
  {n:20,gap:0.3,muster:'spirale',ang:0.34,eff:'zeitregen',kal:'gross',farbe:3,steig:'glut',knall:'bkRieseln',pause:1.5},
  {n:12,gap:0.5,muster:'paar',ang:0.3,eff:'phoenixfeder',kal:'riesig',farbe:1,steig:'glut',knall:'bkBrokat',pause:1.0},
  {n:60,gap:0.06,muster:'w',ang:0.38,eff:['phoenixfeder','kamuro','dahlie','salut','kamuro','phoenixfeder'],kal:'riesig',farbe:0,steig:'glut',knall:'bkDonnerhall',pause:0.5},
  {n:10,gap:0.12,muster:'mitte',ang:0.12,eff:'kamuro',kal:'riesig',pw:4,farbe:1,steig:'glut',knall:'bkDonnerhall',pause:8}]);
SIGNATUR.phoenix={idee:'Phoenix',eff:'phoenixfeder',text:'scharlachrote Kometen faechern in goldene Federn, Tigerschweife, rote Dahlien und eine Glutkrone'};

/* ---------- Eigene Rohrfolge (Zuendschnur) je Batterie ---------- */
const r4Saat=(t,fn)=>rohrSaat(saatZahl(t+':r4'),fn);
Object.assign(TH_FOLGE,{
  /* Wiese: von vorn links schraeg nach hinten rechts, Halm fuer Halm */
  kornblumen:L=>{ const R=L.rohre, w=x=>Math.round(Math.hypot(x.x,x.z)*40)+((Math.atan2(x.z,x.x)+Math.PI*1.25)%(2*Math.PI))/(2*Math.PI); return R.map((x,i)=>i).sort((a,b)=>w(R[a])-w(R[b])); },
  /* Bienen: von der Mitte aus in kleinen Spruengen zu einem Nachbarn, dann weiter */
  bienenweide:(L,t)=>r4Saat(t,()=>{ const R=L.rohre, frei=R.map((x,i)=>i); let c={x:0,z:0}; const out=[];
    while(frei.length){ frei.sort((a,b)=>thAbst(R[a],c)-thAbst(R[b],c)); const j=Math.min(frei.length-1,Math.floor(Math.random()*2)+1), k=frei.splice(j,1)[0]; out.push(k); c=R[k]; } return out; }),
  /* Rebstock: Spalte fuer Spalte von hinten nach vorn, abwechselnd von aussen */
  weinlese:L=>{ const R=L.rohre, xs=[...new Set(R.map(x=>+x.x.toFixed(3)))].sort((a,b)=>a-b), rg=xs.map((x,i)=>i%2?xs.length-1-(i>>1):(i>>1));
    return R.map((x,i)=>i).sort((a,b)=>rg.indexOf(xs.indexOf(+R[a].x.toFixed(3)))-rg.indexOf(xs.indexOf(+R[b].x.toFixed(3)))||R[a].z-R[b].z); },
  /* Wind ueber dem Feld: von links nach rechts in Wellen, vorn und hinten im Wechsel */
  mohnfeld:L=>{ const R=L.rohre; return R.map((x,i)=>i).sort((a,b)=>(R[a].x+Math.sin(R[a].z*30)*0.06)-(R[b].x+Math.sin(R[b].z*30)*0.06)); },
  /* Wald: von hinten nach vorn, in jeder Reihe vom Rand zur Mitte (wie Baeume am Weg) */
  winterwald:L=>{ const R=L.rohre; return R.map((x,i)=>i).sort((a,b)=>R[b].row-R[a].row||Math.abs(R[b].x)-Math.abs(R[a].x)||R[a].x-R[b].x); },
  /* Haengeblueten: aussen links, aussen rechts, dann nach innen - je ein Paar */
  fuchsien:L=>{ const R=L.rohre, idx=R.map((x,i)=>i).sort((a,b)=>R[a].x-R[b].x||R[a].z-R[b].z), out=[]; let l=0, r=idx.length-1; while(l<=r){ out.push(idx[l++]); if(l<=r) out.push(idx[r--]); } return out; },
  /* Riff: in Gruppen, die wie Korallenstoecke beieinander liegen, zufaellig verteilt */
  korallenriff:(L,t)=>r4Saat(t,()=>{ const R=L.rohre, frei=new Set(R.map((x,i)=>i)), out=[];
    while(frei.size){ const a=[...frei], s0=a[Math.floor(Math.random()*a.length)], gr=a.sort((x,y)=>thAbst(R[x],R[s0])-thAbst(R[y],R[s0])).slice(0,4); gr.forEach(k=>{ frei.delete(k); out.push(k); }); } return out; }),
  /* Samt: ruhig von der Mitte nach aussen, Ring fuer Ring */
  schwarzersamt:L=>{ const R=L.rohre, w=x=>Math.round(Math.hypot(x.x,x.z*1.5)*16)+(Math.atan2(x.z,x.x)+Math.PI)/(2*Math.PI); return R.map((x,i)=>i).sort((a,b)=>w(R[a])-w(R[b])); },
  /* Meteore: schraeg von hinten rechts nach vorn links, mit Spruengen */
  meteorschauer:(L,t)=>r4Saat(t,()=>{ const R=L.rohre, w=R.map(x=>-(x.x+x.z*1.2)+rand(-0.06,0.06)); return R.map((x,i)=>i).sort((a,b)=>w[a]-w[b]); }),
  /* Phoenix: aus der Mitte hinten (Glut) nach vorn, abwechselnd links und rechts wie Fluegel */
  phoenix:L=>{ const R=L.rohre, w=x=>Math.round(Math.abs(x.x)*20)+(x.x<0?0.3:0.6)-x.z; return R.map((x,i)=>i).sort((a,b)=>w(R[a])-w(R[b])); }
});
['kornblumen','bienenweide','weinlese','mohnfeld','winterwald','fuchsien','korallenriff','schwarzersamt','meteorschauer','phoenix'].forEach(t=>{ if(typeof lochFrisch==='function') lochFrisch(t); });
try{ window.__r4={R4_RAUM,BATT:['kornblumen','bienenweide','weinlese','mohnfeld','winterwald','fuchsien','korallenriff','schwarzersamt','meteorschauer','phoenix'],
  KUG:['silberdistel75','hummelschwarm75','blauregen100','smaragdring100','abendrot150','kometenschlag150','seerose200','granatapfel200','riesenpalme300','himmelstreppe300']}; }catch(e){}
