/* =========================================================
   Rohr-Batterien (01.10. abends, Tom: "Batterie-Varianten anlegen,
   jede mit eigener Verpackung, Roehrenzahl, Preis und Effekt").
   Vier Batterien, deren Rohrbild genau auf der Packung steht:
   - Farbreihen 25 (5x5): einfarbige Bombetten, jede Reihe eine Farbe
   - Konfetti 49 (7x7): Farbmix-Bomben, vier Farben in jeder Kugel
   - Stakkato 100 (10x10): schnellste Folge (0,2 s), harte kleine Sterne
   - Pfauenschweif 30 (Faecher 6x5): schraege Rohre, jede Reihe faechert
     von aussen nach aussen, abwechselnd nach rechts und nach links
   Wie jede Batterie: Schuss fuer Schuss aus dem eigenen Rohr in der
   festen Folge der Zuendschnur (04c), 0,2-0,4 s Abstand.
   ========================================================= */
Object.assign(THEMEN,{
  farbreihen:[['rot','rot'],['gruen','gruen'],['blau','blau'],['gold','gold'],['weiss','weiss']],
  konfetti:[['magenta','zitrone'],['tuerkis','orange'],['rot','himmel'],['limette','violett'],['gold','blau'],['rose','gruen'],['scharlach','aqua']],
  stakkato:[['weiss','orange'],['silber','rot'],['zitrone','weiss'],['orange','silber']]
});
/* Einfarb-Bombette: kleine runde Paeonie, ALLE Sterne in einer Farbe,
   innen ein heller Kern derselben Farbe - klar wie ein Glasstein */
EFF.einfarbbombette=function(p,A,B,s){
  const q=QUAL(), n=Math.round(56*s*q), hell=[Math.min(1.25,A[0]*1.25+0.15),Math.min(1.25,A[1]*1.25+0.15),Math.min(1.25,A[2]*1.25+0.15)];
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(8.6,9.8)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,A[0],A[1],A[2],rand(1.35,1.75),2.6,0); }
  for(let i=0;i<Math.round(16*s*q);i++){ const d=randDir(), v=rand(2.2,3.4)*s;
    psMid.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,hell[0],hell[1],hell[2],rand(0.6,0.9),2.2,0); }
};
/* Farbmix-Bombe: vier Farben durcheinander in einer Kugel (A, B und
   zwei gedrehte Farbtoene davon), jeder Stern wechselt am Ende in Weiss */
EFF.farbmixbombe=function(p,A,B,s){
  const q=QUAL(), n=Math.round(72*s*q), C=[A[2],A[0],A[1]], D=[B[1],B[2],B[0]], F=[A,B,C,D];
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(8.2,10.6)*s, c=F[i%4];
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,c[0],c[1],c[2],rand(1.5,2.0),2.5,0,1,1,1); }
};
/* Stakkato-Stern: kleiner, harter Bruch mit kurzen Knisterspitzen - so
   kurz, dass bei 5 Schuss pro Sekunde jeder fuer sich steht */
EFF.stakkatostern=function(p,A,B,s){
  const q=QUAL(), n=Math.round(38*s*q);
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(9.5,11.5)*s, c=i%3?A:B;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,c[0],c[1],c[2],rand(0.7,0.95),2.8,0); }
  later(0.75,()=>{ for(let i=0;i<Math.round(26*s*q);i++){ const d=randDir(), v=rand(6,8.5)*s, e={x:p.x+d[0]*v*0.62,y:p.y+d[1]*v*0.62-0.8,z:p.z+d[2]*v*0.62};
      psSmall.emit(e.x,e.y,e.z,rand(-1,1),rand(-1,0.6),rand(-1,1),1.4,1.4,1.3,rand(0.05,0.12),1,3); }
    sfx.crackle(distVol(p)*0.45); });
};
/* Pfauenfaecher: Goldpalme mit dickem Stamm-Schweif, an den Spitzen
   die Federfarben (A, B) */
EFF.pfauenfaecher=function(p,A,B,s){
  const q=QUAL(), g=FW.gold, n=Math.round(30*s*q), alt=SCHWEIF;
  SCHWEIF=0.45;
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(8,10)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v*0.8+1.5,d[2]*v,g[0],g[1],g[2],rand(1.7,2.2),2.4,4,i%2?A[0]:B[0],i%2?A[1]:B[1],i%2?A[2]:B[2]); }
  SCHWEIF=alt;
  for(let i=0;i<Math.round(24*s*q);i++){ const d=randDir(), v=rand(9,10.5)*s, c=i%2?A:B;
    psMid.emit(p.x,p.y,p.z,d[0]*v,d[1]*v*0.8+1.5,d[2]*v,c[0],c[1],c[2],rand(1.0,1.4),2.6,0); }
};
EFF_FAMILIE.einfarbbombette='kugel'; EFF_FAMILIE.farbmixbombe='kugel'; EFF_FAMILIE.stakkatostern='knister'; EFF_FAMILIE.pfauenfaecher='haenger';

/* Farbreihen 25 (L12): fuenf Reihen, jede eine Farbe. Die Zuendschnur
   laeuft Reihe fuer Reihe - die Farbe wechselt mit der Reihe. */
SHOWS.rb25=()=>show({basis:{pw:-6,sz:0.72,th:'farbreihen'},rampe:{sz:[0.85,1.3],pw:[-1,2],hell:[0.85,1.3],kurve:'linear'}},[
  {n:5,gap:0.35,muster:'fan',ang:0.12,eff:'einfarbbombette',farbe:0,pause:0.4},
  {n:5,gap:0.35,muster:'rfan',ang:0.12,eff:'einfarbbombette',farbe:1,pause:0.4},
  {n:5,gap:0.3,muster:'mitte',ang:0.12,eff:'einfarbbombette',farbe:2,pause:0.4},
  {n:5,gap:0.3,muster:'aussen',ang:0.12,eff:'einfarbbombette',farbe:3,pause:0.4},
  {n:5,gap:0.2,muster:'fan',ang:0.14,eff:'einfarbbombette',farbe:4,kal:'gross',pause:1.5}
]);
/* Konfetti 49 (L15): sieben Reihen, jede aus einer anderen Farbkiste */
SHOWS.rb49=()=>show({basis:{pw:-2.8,sz:0.93,th:'konfetti'},rampe:{sz:[0.85,1.3],pw:[-1,2],hell:[0.85,1.3],kurve:'linear'}},[
  {n:7,gap:0.35,muster:'gerade',eff:'farbmixbombe',farbe:0},
  {n:7,gap:0.3,muster:'w',ang:0.12,eff:'farbmixbombe',farbe:1},
  {n:7,gap:0.3,muster:'fan',ang:0.14,eff:'farbmixbombe',farbe:2},
  {n:7,gap:0.25,muster:'rfan',ang:0.14,eff:'farbmixbombe',farbe:3},
  {n:7,gap:0.25,muster:'mitte',ang:0.14,eff:'farbmixbombe',farbe:4},
  {n:7,gap:0.2,muster:'aussen',ang:0.14,eff:'farbmixbombe',farbe:5},
  {n:7,gap:0,muster:'zufall',ang:0.15,eff:'farbmixbombe',farbe:6,kal:'gross',pause:1.5}
]);
/* Stakkato 100 (L18): zehn Reihen ohne Pause im schnellsten Takt */
SHOWS.rb100=()=>show({basis:{pw:1.1,sz:1.09,th:'stakkato'},rampe:{sz:[0.85,1.3],pw:[-1,2],hell:[0.85,1.3],kurve:'linear'}},[
  {n:10,gap:0,muster:'fan',ang:0.12,eff:'stakkatostern',farbe:0},
  {n:10,gap:0,muster:'rfan',ang:0.12,eff:'stakkatostern',farbe:0},
  {n:10,gap:0,muster:'z',ang:0.14,eff:'stakkatostern',farbe:1},
  {n:10,gap:0,muster:'wischer',ang:0.14,eff:'stakkatostern',farbe:1},
  {n:10,gap:0,muster:'welle',ang:0.14,eff:'stakkatostern',farbe:2},
  {n:10,gap:0,muster:'mitte',ang:0.14,eff:'stakkatostern',farbe:2},
  {n:10,gap:0,muster:'aussen',ang:0.15,eff:'stakkatostern',farbe:3},
  {n:10,gap:0,muster:'w',ang:0.15,eff:'stakkatostern',farbe:3},
  {n:10,gap:0,muster:'fan',ang:0.15,eff:'stakkatostern',farbe:0,kal:'gross'},
  {n:10,gap:0,muster:'rfan',ang:0.15,eff:'stakkatostern',farbe:1,kal:'gross',pause:1.5}
]);
/* Pfauenschweif 30 (L16, Faecher): die Rohre stehen je Spalte schraeg.
   Reihe 1 faechert nach rechts auf, Reihe 2 zurueck nach links ... */
SHOWS.rbfaecher=()=>show({basis:{pw:0.05,sz:1.0,th:'pfau'},rampe:{sz:[0.85,1.3],pw:[-1,2],hell:[0.85,1.3],kurve:'linear'}},[
  {n:6,gap:0.35,muster:'rfan',ang:0.42,eff:'pfauenfaecher',farbe:0,pause:0.4},
  {n:6,gap:0.35,muster:'fan',ang:0.46,eff:'pfauenfaecher',farbe:1,pause:0.4},
  {n:6,gap:0.3,muster:'rfan',ang:0.5,eff:'pfauenfaecher',farbe:2,pause:0.4},
  {n:6,gap:0.3,muster:'fan',ang:0.54,eff:'pfauenfaecher',farbe:0,pause:0.4},
  {n:6,gap:0.2,muster:'rfan',ang:0.58,eff:'pfauenfaecher',farbe:1,kal:'gross',pause:1.5}
]);
['rb25','rb49','rb100','rbfaecher'].forEach(t=>{ const b=SHOWS[t]().basis; SHOW_BASIS[t]={pw:b.pw,sz:b.sz,th:b.th}; });
Object.assign(SIGNATUR,{
  rb25:{eff:'einfarbbombette',idee:'Farbreihen',text:'jede Reihe Rohre eine Farbe, jede Bombette einfarbig'},
  rb49:{eff:'farbmixbombe',idee:'Konfetti',text:'vier Farben durcheinander in jeder Kugel'},
  rb100:{eff:'stakkatostern',idee:'Schnellfeuer',text:'fuenf Schuss pro Sekunde, harte Sterne mit Knisterspitzen'},
  rbfaecher:{eff:'pfauenfaecher',idee:'Pfauenrad aus schraegen Rohren',text:'jede Reihe faechert von aussen nach aussen, abwechselnd'}
});
