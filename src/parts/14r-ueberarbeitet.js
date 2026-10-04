/* =========================================================
   Ueberarbeitete Batterien, Raketen und Kugeln (03.10. abends, Toms
   Durchsicht des Sortiments). Die Drehbuecher hier ersetzen die alten
   aus 14g/14h/14j/14n/14o; Lichter aus 14m/14q.
   ========================================================= */
Object.assign(THEMEN,{
  silberknister:[['silber','weiss'],['weiss','rot'],['silber','himmel']],
  weidenwand:[['gold','bernstein'],['rot','gold'],['tuerkis','gold'],['violett','gold']],
  weltende:[['scharlach','gold'],['violett','orange'],['weiss','blau'],['rot','weiss']],
  hexe2:[['limette','violett'],['violett','gold'],['limette','gold'],['magenta','limette']],
  kaiser2:[['rot','tuerkis'],['tuerkis','gold'],['rot','gold'],['blau','gold']],
  geysir2:[['weiss','aqua'],['tuerkis','silber'],['violett','weiss'],['gold','aqua']],
  feuerperle:[['rot','gold'],['scharlach','weiss'],['orange','zitrone']]
});
/* Farbreihen 25 (Tom: "da fehlen die breiten Fontaenen"): jede Rohrreihe
   eine Farbe, aus jedem Rohr ein Kometenfaecher in dieser Farbe, oben
   kleine Explosionen in derselben Farbe */
LICHTYP.breitreihe=qFaecher('v',3.4,8.5,(u,j,A)=>j%4===3?[1.3,1.32,1.4]:lHell(A,1.5),{jeder:2,n:7,c:(u,j,A)=>A},{weit:0.6});
LICHT_BRENN.breitreihe=7.5;
SHOWS.rb25=()=>show({verzoegerung:true,basis:{pw:-6,sz:0.72,th:'farbreihen'},rampe:{sz:[0.85,1.3],pw:[-1,2],hell:[0.85,1.3],kurve:'linear'}},[
  {n:5,gap:0.9,rohrFolge:[-1,-0.5,0,0.5,1],licht:'breitreihe',A:'rot',B:'rot',pause:2.5},
  {n:5,gap:0.6,rohrFolge:[1,0.5,0,-0.5,-1],licht:'breitreihe',A:'gruen',B:'gruen',pause:2.5},
  {n:5,gap:0.45,rohrFolge:[0,-0.5,0.5,-1,1],licht:'breitreihe',A:'blau',B:'blau',pause:2.5},
  {n:5,gap:0.3,rohrFolge:[-1,1,-0.5,0.5,0],licht:'breitreihe',A:'gold',B:'gold',pause:2.5},
  {mit:true,n:5,gap:0.12,rohrFolge:[-1,-0.5,0,0.5,1],licht:'breitreihe',A:'weiss',B:'weiss',pause:5}]);
SIGNATUR.rb25={eff:'licht:breitreihe',idee:'Farbreihen',text:'jede Rohrreihe eine Farbe, aus jedem Rohr ein Kometenfaecher'};
/* Feuerperlen (Tom: "als Batterie, die grossen Abschuesse vom Anfang
   behalten, die kleineren weglassen"): die grossen Kometenfaecher, deren
   Koepfe von Rot ueber Gold zu Weiss werden - ohne die kleinen Kugeln */
LICHTYP.breitwandel=qFaecher('stufen',5.5,9,(u,j,A,B)=>u<0.34?lHell(A,1.5):u<0.68?GOLDF:[1.35,1.36,1.45],{jeder:3,n:7,c:(u,j,A,B)=>u<0.5?A:B});
LICHT_BRENN.breitwandel=10;
SHOWS.feuerperlen=()=>show({verzoegerung:true,rampe:{sz:[0.9,1.2],pw:[0,1],hell:[0.9,1.3],kurve:'linear'}},[
  {n:2,gap:1.2,rohrFolge:[-1,1],licht:'breitwandel',kal:'mittel',th:'feuerperle',farbe:0,pause:5},
  {n:6,gap:0.45,muster:'v',ang:0.3,licht:'zackkomet',th:'feuerperle',farbe:1},
  {mit:true,n:2,gap:1.5,rohrFolge:[-0.4,0.4],licht:'farbweidenkomet',th:'feuerperle',farbe:2,pause:1},
  {n:6,gap:0.15,muster:'mitte',ang:0.3,licht:'breitwandel',kal:'gross',th:'feuerperle',farbe:1,pause:6}]);
delete SHOW_BASIS.feuerperlen;
SIGNATUR.feuerperlen={eff:'licht:breitwandel',text:'Kometenfaecher, deren Koepfe von Rot ueber Gold zu Weiss werden'};
/* Silberknister (vorher Donnerschlag; Tom: die Donnerschlaege raus, die
   Faecher und alles drumherum "mega schoen") */
SHOWS.donnerschlag=()=>show({verzoegerung:true,basis:{pw:1.55,sz:1.125,th:'silberknister'},rampe:{sz:[0.95,1.25],pw:[0,2],hell:[0.90,1.30],kurve:'linear'}},[
  {n:3,gap:2.0,muster:'mitte',ang:0.2,licht:'zackkomet',farbe:0,boden:{k:'knisterbrunnen',gt:7,A:'silber',B:'weiss'},pause:4},
  {n:6,gap:0.9,muster:'v',ang:0.3,licht:'knistercrossette',farbe:1,pause:1.0},
  {n:5,gap:0.35,muster:'aussen',ang:0.4,eff:'tausend',farbe:2,pause:1.2},
  {n:6,gap:0,muster:'schlag',ang:0.45,licht:'zackkomet',kal:'gross',farbe:0,pause:5}]);
SHOW_BASIS.donnerschlag={pw:1.55,sz:1.125,th:'silberknister'};
SIGNATUR.donnerschlag={eff:'licht:knistercrossette',text:'Silberne Knisterkometen ueber einem knisternden Silberfaecher'};
/* Lichterkette (Tom: "Level niedriger, als Batterie auf den Tisch") */
SHOWS.lichterkugeln=()=>show({basis:{pw:-6.7,sz:0.665,th:'lichter'},rampe:{sz:[0.95,1.15],pw:[0,1],hell:[0.90,1.20],kurve:'flach'}},[
  {n:6,gap:1.2,muster:'gerade',eff:'blinkkugel',farbe:0,steig:'keiner',pause:1.5},
  {n:6,gap:0.18,muster:'fan',ang:0.60,hoehe:'gleich',eff:'blinkkugel',farbe:1,steig:'keiner',pause:2.5},
  {n:6,gap:0.5,muster:'aussen',ang:0.60,eff:'blinkkugel',farbe:2,steig:'keiner',pause:2.5},
  {n:6,gap:0,muster:'schlag',ang:0.60,hoehe:'wechsel',hSpanne:4,eff:'blinkkugel',farbe:0,steig:'keiner',pause:3.5}]);
SHOW_BASIS.lichterkugeln={pw:-6.7,sz:0.665,th:'lichter'};
/* Palmenhain: kein Bruch mehr tief ueber dem Karton (Tom: "ein, zwei
   Schuesse explodieren viel zu niedrig") - die Kokosnuesse als Brueche
   in voller Hoehe, kleinere Hoehenstreuung */
SHOWS.goldpalmen=()=>show({basis:{pw:-5,sz:0.78,th:'gold'}, rampe:{sz:[0.85,1.35],pw:[0,2],hell:[0.85,1.3],kurve:'spaet'}}, [
  {n:3,gap:2.2,muster:'gerade',eff:'palme',kal:'mittel',steig:'stamm',pause:0.8},
  {n:6,gap:1.2,muster:'v',ang:0.2,eff:'palme',steig:'stamm',hoehe:'wechsel',hSpanne:3,pause:1.0},
  {n:6,mit:true,gap:0.6,muster:'gerade',rohre:'breit',eff:'kokosnuss',kal:'klein',steig:'stamm'},
  {n:6,gap:0.35,muster:'welle',wellen:1,ang:0.3,eff:['palme','kokosnuss'],steig:'stamm',hoehe:'steigend',hSpanne:3,boden:{k:'volcano',gt:4,A:'gold',B:'orange'},pause:1.2},
  {n:4,gap:0,muster:'schlag',ang:0.35,eff:'palme',kal:'gross',steig:'stamm',hoehe:'wechsel',hSpanne:3,pause:4.0}]);
/* Feuersturm: hoeher, und am Schluss statt der gelb-roten Feuerbaelle
   Silber-Gold-Palmen */
SHOWS.batterie49=()=>show({basis:{pw:-2.5,sz:0.90,th:'glut'}, rampe:{sz:[0.75,1.25],pw:[-1.5,4],hell:[0.85,1.35],kurve:'linear'}}, [
  {n:0,nurBoden:true,boden:[{k:'fountain',gt:5,x:-0.13,A:'orange',B:'gold'},{k:'fountain',gt:5,x:0.13,A:'bernstein',B:'gold',t:0.3}],pause:0.4},
  {n:6,gap:0.45,muster:'gerade',eff:'lampare',kal:'klein',steig:'glut',pause:0.2},
  {n:10,gap:0.2,muster:'v',ang:0.3,eff:'chrys',steig:'glut',pause:0.2},
  {n:8,mit:true,gap:0.1,muster:'gerade',rohre:'breit',eff:'kokosnuss',kal:'klein',steig:'glut'},
  {n:12,gap:0.1,muster:'z',seg:3,ang:0.4,eff:['palme','lampare'],steig:'gold',pause:0.3},
  {n:6,gap:0.2,muster:'w',ang:0.35,eff:'chrys',kal:'mittel',steig:'knister',pause:0.2},
  {n:7,gap:0,muster:'schlag',ang:0.45,eff:'palme',kal:'gross',pw:3,A:'silber',B:'gold',steig:'gold',pause:1.0}]);
/* Sonnenaufgang: alle Brueche hoeher (Tom: "man steht in den Funken") */
{ const alt=SHOWS.faecher; SHOWS.faecher=()=>{ const s=alt(); const hoch=s.filter(ph=>ph.pw!==undefined&&ph.muster!=='halbkreis');
  /* das Ende (Brokat-Stoesse, Sonne) noch einmal hoeher als der Anfang - Steigerung */
  hoch.forEach((ph,i)=>{ ph.pw+=5+(i>=hoch.length-2?5:0); }); return s; }; }
/* Brandung 80 (Tom: "Anfang ok, dann zu eintoenig - mehr Show,
   Explosionen hoeher"): Ebbe bleibt, dann Brecher, Gischtfaecher, Tiefsee
   mit Polarweiden, Moewen als Sternschnuppen, Sturmflut und ein
   Finale aus drei Wellenbergen */
SHOWS.sternenmeer80=()=>show({verzoegerung:true,basis:{pw:0.10,sz:1.010,th:'eis'},rampe:{sz:[0.80,1.30],pw:[0,3],hell:[0.85,1.30],kurve:'linear'}},[
  {n:6,gap:1.6,muster:'gerade',eff:'silberwelle',kal:'klein',steig:'silber',boden:{k:'torte',gt:12,A:'silber'},pause:1.0},
  {n:10,gap:0.4,muster:'welle',ang:0.4,wellen:1,eff:['glitzerweide','silberwelle'],farbe:0,pause:1.0},
  {n:2,gap:0.5,rohrFolge:[-1,1],licht:'breitsaphir',kal:'mittel',farbe:1,pause:5.5},
  {n:8,gap:0.9,muster:'mitte',ang:0.3,licht:'polarweide',farbe:2},
  {mit:true,n:8,gap:0.9,muster:'v',ang:0.5,kal:'klein',pw:-2,eff:'fische',farbe:1,pause:0.8},
  {n:12,gap:0.2,muster:'x',ang:0.4,licht:'fallkomet',farbe:0,pause:1.0},
  {n:16,gap:0.1,muster:'z',seg:3,ang:0.4,eff:['kronleuchter','silberwelle'],kal:'gross',farbe:2,pause:0.6},
  {n:18,gap:0.08,muster:'welle',ang:0.5,wellen:3,hoehe:'welle',hSpanne:6,eff:['glitzerweide','silberwelle','kamuro'],kal:'riesig',farbe:2,
   boden:{k:'riesen',gt:4,gh:0.8,A:'silber',B:'weiss',C:FW.weiss},pause:5}]);
SIGNATUR.sternenmeer80={eff:'silberwelle',text:'Silbergischt, Gischtfaecher, Polarweiden und Wellenberge'};
/* Lichterprozession (Tom: "Lichter bleiben am Ende am Himmel stehen"):
   statt der schwebenden Perlen, die 3-4 s standen, Farbwechsel- und
   Kometenkerzen - jede Kugel verlischt im Flug */
SHOWS.lichterprozession=()=>show({basis:{pw:0.6,sz:1.05,th:'prozession'},rampe:{sz:[0.9,1.2],pw:[0,1.5],hell:[0.85,1.25],kurve:'spaet'}},[
  {n:8,perle:true,perleEff:'grossperle',gap:0.7,muster:'gerade',rohrFolge:[-1,1,-0.5,0.5,-0.2,0.2,-0.8,0.8],farbe:0,boden:{k:'fountain',gt:6,gh:0.7,A:'gold',B:'weiss'}},
  {n:6,perle:true,perleEff:'farbperle',gap:0.9,muster:'aussen',ang:0.25,farbe:2},
  {n:14,perle:true,perleEff:'grossperle',gap:0.2,muster:'treppe',ang:0.3,farbe:1},
  {mit:true,n:12,perle:true,perleEff:'schweifperle',gap:0.35,muster:'welle',ang:0.3,farbe:0,pause:1.0},
  {n:16,perle:true,perleEff:'grossperle',gap:0.08,muster:'schlag',ang:0.35,farbe:2,
    boden:[{k:'fountain',gt:4,gh:1.0,x:-0.2,A:'gold',B:'rose'},{k:'fountain',gt:4,gh:1.0,x:0.2,A:'gold',B:'rose'}]},
  {mit:true,n:8,perle:true,perleEff:'farbperle',gap:0.25,muster:'mitte',ang:0.2,farbe:1,pause:4}]);
SIGNATUR.lichterprozession={eff:'grossperle',text:'Grosse Leuchtkugeln, Farbwechsel- und Kometenkerzen in Reihen - ohne Knall'};
/* Schimmelreiter (Tom: "am Anfang wieder Fontaenen - andere Farben und
   Formen, nicht immer gleich, nicht immer Gold"): drei Faecher nacheinander -
   himmelblau schwenkend, violett-gold im V, Silber knisternd auf Schlag */
{ const alt=SHOWS.kometen; SHOWS.kometen=()=>{ const s=alt(), k=show({basis:s.basis,rampe:s.rampe},s.slice());
  k[0]={n:0,boden:[{k:'farbtorte',gt:3.5,x:-0.3,A:'himmel',B:'weiss',muster:'wisch'},{k:'fountain',gt:3.5,x:0.3,A:'violett',B:'gold',muster:'v',t:1.2},{k:'knisterbrunnen',gt:3,x:0,A:'silber',B:'weiss',muster:'puls',t:2.6}],pause:5.5};
  k[1]=Object.assign({},k[1],{boden:undefined}); return k; }; }
/* Farbsaeulen (Tom: "faengt gut an, wird eintoenig"): nach dem Saeulengang
   Kronenkometen, Farbpalmen und Zackenkometen in den Saeulenfarben, das
   Finale mit Dahlien und Kronleuchtern */
SHOWS.feuerpfau=()=>show({verzoegerung:true,basis:{pw:2.10,sz:1.170,th:'saeulen'},rampe:{sz:[0.90,1.25],pw:[-1,2],hell:[0.95,1.35],kurve:'frueh'}},[
  {n:4,gap:1.8,muster:'gerade',mine:true,mineEff:'farbe',steig:'farbkomet',eff:'kugel',kal:'mittel',farbe:0,boden:{k:'fountain',gt:6,A:'gold',B:'weiss'},pause:3.5},
  {n:14,gap:0.55,muster:'aussen',ang:0.50,rohre:'breit',mine:true,mineEff:'farbe',steig:'farbkomet',eff:'pistill',farbVert:'wechsel',pause:1.2},
  {n:12,gap:0.9,muster:'v',ang:0.35,licht:'kronenkomet',farbe:1},
  {mit:true,n:12,gap:0.9,nurMine:true,mineEff:'blink',muster:'gerade',farbe:0,pause:0.6},
  {n:20,gap:0.30,muster:'paar',ang:0.45,licht:'farbpalme',farbe:0,pause:1.2},
  {n:18,gap:0.12,muster:'mitte',ang:0.55,licht:'zackkomet',kal:'gross',farbe:2,pause:1.0},
  {n:20,je:10,takt:[0.6],muster:'schlag',ang:0.60,mine:true,mineEff:'farbe',steig:'farbkomet',eff:['dahlie','kronleuchter'],kal:'riesig',farbe:2,farbVert:'mitte',
   boden:{k:'fountain',gt:3,gh:1.2,A:'gold',B:'weiss'},pause:4.5}]);
/* Hexenkessel (Tom: "nur ein paar Lichter, die hochgehen - langweilig"):
   Kessel, Hexenweiden, Hexenringe, Beschwoerung mit Schirmen, Fluch-
   kometen, Hexentanz aus Kiefern und Lava - Finale Walpurgisnacht */
SHOWS.hexenkessel=()=>show({verzoegerung:true,basis:{pw:2.15,sz:1.175,th:'hexe2'},rampe:{sz:[0.90,1.25],pw:[0,2],hell:[0.90,1.35],kurve:'spaet'}},[
  {n:20,gap:0.30,muster:'zufall',ang:0.20,kal:'klein',pw:-4,eff:'knister',farbe:0,boden:{k:'farbtorte',gt:6,A:'limette',B:'violett'}},
  {mit:true,n:4,takt:[1.6],muster:'v',ang:0.40,licht:'polarweide',farbe:0,pause:0.6},
  {n:32,je:8,takt:[0.9,0.9,0.5],muster:'kreis',ang:0.40,eff:['wechsel','tigerschweif'],kal:'mittel',farbVert:'wechsel'},
  {mit:true,n:24,gap:0.15,muster:'wischer',seg:3,ang:0.50,kal:'klein',pw:-3,eff:'fische',farbe:2,pause:0.8},
  {n:6,gap:1.0,muster:'gerade',licht:'farbschirm',farbe:1,pause:0.6},
  {n:14,gap:0.25,muster:'x',ang:0.40,licht:'zackkomet',farbe:2,pause:0.6},
  {n:16,gap:0.35,muster:'spirale',ang:0.35,eff:['kiefernkrone','lavaregen'],farbe:3,pause:0.8},
  {n:64,je:8,takt:[0.3],muster:'kreis',ang:0.50,rohre:'breit',kal:'gross',eff:['palme','wechsel','sternspritzer','tigerschweif'],farbe:0,mine:true,mineEff:'farbe',pause:4.5}]);
/* Sternblinken (Tom: "Anfang schoen, wird am Ende eintoenig"): unten
   Zackenkometen statt kleiner Blinker, das Finale halb Blinkchrysanthemen,
   halb Silberblitzweiden */
{ const alt=SHOWS.blitzgewitter60; SHOWS.blitzgewitter60=()=>{ const s=alt(), k=show({basis:s.basis,rampe:s.rampe},s.slice()), n=k.length;
  k[n-2]={mit:true,n:10,gap:0.7,muster:'aussen',ang:0.50,licht:'zackkomet',farbe:1,pause:0.8};
  k[n-1]={n:8,gap:0.12,muster:'w',ang:0.50,eff:'blinkchrys',kal:'gross',farbe:1};
  k.push({mit:true,n:8,gap:0.3,muster:'mitte',ang:0.3,licht:'silberblitzweide',farbe:0,pause:5}); return k; }; }
/* Kaleidoskop (Tom: "deutlich hoeher, deutlich mehr Variation") */
SHOWS.sternenkaiser=()=>show({verzoegerung:true,basis:{pw:3.55,sz:1.285,th:'kaiser2'},rampe:{sz:[0.90,1.30],pw:[0,3],hell:[0.90,1.35],kurve:'welle'}},[
  {n:8,gap:1.8,muster:'gerade',eff:'kaleidoskop',kal:'mittel',pw:2,farbe:0,boden:{k:'fountain',gt:6,A:'gold',B:'weiss'},pause:3.5},
  {n:16,gap:0.55,muster:'v',ang:0.40,eff:['kaleidoskop','pistill'],farbe:1,farbVert:'seite'},
  {mit:true,n:18,gap:0.5,muster:'zufall',ang:0.35,licht:'kronenkomet',farbe:2,pause:1.2},
  {n:20,gap:0.8,muster:'w',ang:0.45,farbVert:'mitte',eff:['dahlie','tigerschweif'],farbe:2},
  {mit:true,n:20,gap:0.8,muster:'gerade',kal:'klein',pw:-3,eff:'knister',farbe:2,pause:0.6},
  {n:22,gap:0.12,muster:'aussen',ang:0.55,eff:'chrys',farbe:0},
  {mit:true,n:22,gap:0.25,muster:'welle',ang:0.40,licht:'zweigkomet',farbe:3,pause:1.4},
  {n:12,gap:1.9,muster:'mitte',ang:0.35,eff:['kaleidoskop','kiefernkrone'],kal:'riesig',pw:5,farbe:1,bruchOpt:{nachglitzer:false},pause:1.0},
  {n:48,gap:0.25,muster:'x',ang:0.50,rohre:'breit',eff:['kaleidoskop','brokat','sternspritzer'],farbe:0,farbVert:'seite',mine:true,mineEff:'farbe',pause:1.5},
  {n:40,je:8,takt:[0.5],muster:'schlag',ang:0.60,eff:['kaleidoskop','kronleuchter'],kal:'gross',farbe:3,farbVert:'mitte'},
  {mit:true,n:24,gap:0.1,muster:'w',ang:0.55,kal:'klein',eff:'glitzerweide',farbe:0,boden:[{k:'riesen',gt:5,x:-0.33,C:FW.gold},{k:'riesen',gt:5,x:0.33,C:FW.gold}],pause:5}]);
SHOW_BASIS.sternenkaiser={pw:3.55,sz:1.285,th:'kaiser2'};
/* Weidenwand (Tom: "viel zu niedrig und zu eintoenig - neu machen"):
   drei Module im Dialog, jede Weide anders - Weidenfaecher, Farbweiden,
   Blinkweiden, Polarweiden, Weidencrossetten - Finale die Wand */
SHOWS.kometenwand=()=>show({verzoegerung:true,basis:{pw:3.50,sz:1.280,th:'weidenwand'},rampe:{sz:[0.95,1.25],pw:[0,2],hell:[0.85,1.30],kurve:'spaet'}},[
  {n:3,gap:1.6,x:0,muster:'gerade',licht:'weidenfaecher',farbe:0,boden:{k:'fountain',x:0,gt:5,A:'gold',B:'zitrone'},pause:4},
  {n:8,gap:0.35,x:-0.26,angOff:-0.3,muster:'v',ang:0.28,licht:'farbweidenkomet',farbe:1,pause:0.6},
  {n:8,gap:0.35,x:0.26,angOff:0.3,muster:'w',ang:0.28,eff:'strobeweide',farbe:2,pause:0.8},
  {n:10,gap:0.9,x:0,muster:'mitte',ang:0.3,licht:'polarweide',farbe:2,pause:1.0},
  {n:20,gap:0.15,x:[-0.26,0.26],angOff:[-0.3,0.3],muster:'zufall',ang:0.18,eff:['glitzerweide','kokosnuss'],kal:'mittel',farbe:3,pause:1.2},
  {n:8,gap:0.6,muster:'aussen',ang:0.35,licht:'weidencrossette',farbe:3,pause:0.8},
  {n:14,gap:0.12,x:0,muster:'mitte',ang:0.35,eff:'weide',kal:'riesig',farbe:0},
  {mit:true,n:19,gap:0.09,x:[-0.26,0.26],angOff:[-0.32,0.32],muster:'aussen',ang:0.22,licht:'farbweidenkomet',kal:'gross',farbe:1,boden:[{k:'riesen',x:-0.26,gt:4,C:FW.gold},{k:'riesen',x:0.26,gt:4,C:FW.gold}],pause:6.5}]);
SHOW_BASIS.kometenwand={pw:3.50,sz:1.280,th:'weidenwand'};
SIGNATUR.kometenwand={idee:'dreimodul',text:'drei Module im Dialog, jede Weide anders, Finale als Weidenwand'};
/* Geysirfeld (Tom: "viel, viel hoeher, die komischen Punkte am Anfang
   raus, farblich zu eintoenig"): die Saeulen aus Schweif-Bruechen statt
   Knister- und Punktbruechen, je Ausbruch eine andere Farbe */
const GEYSIR2=['kokosnuss','chrys','glitzerweide','brokat','kamuro'], GEYSIR3=['chrys','tigerschweif','kiefernkrone','sternspritzer','lavaregen'], GEYSIR4=['kokosnuss','polarlicht','glitzerweide','kronleuchter','kamuro'];
SHOWS.geysirfeld=()=>show({verzoegerung:true,basis:{pw:3.60,sz:1.290,th:'geysir2'},rampe:{sz:[0.90,1.25],pw:[0,2],hell:[0.90,1.35],kurve:'frueh'}},[
  {n:15,je:5,gap:0.1,takt:[2.4],orte:[0,-0.15,0.15],angOff:[0,-0.2,0.2],muster:'treppe',hoehe:'steigend',hSpanne:12,eff:GEYSIR2,kal:GEYSIR_KAL,farbe:0,wechsel:true,boden:{k:'geysir',je:true,gt:2.0,gh:1.0,A:'weiss',B:'aqua'}},
  {n:6,gap:1.1,muster:'v',ang:0.40,licht:'farbschirm',farbe:1,pause:0.6},
  {n:40,je:5,gap:0.1,takt:[1.0,0.6,1.2],orte:[-0.3,0.15,-0.15,0.3,0,0.15,-0.3,-0.15],angOff:[-0.36,0.18,-0.18,0.36,0,0.18,-0.36,-0.18],muster:'mitte',ang:0.25,hoehe:'steigend',hSpanne:12,eff:GEYSIR3,kal:GEYSIR_KAL,farbe:3,wechsel:true,
   boden:{k:'geysir',je:true,gt:1.6,A:'weiss'}},
  {mit:true,n:30,gap:0.22,muster:'zufall',ang:0.30,licht:'zackkomet',farbe:1},
  {n:60,je:5,gap:0.1,takt:[0.45],orte:[0.15,-0.3,0,0.3,-0.15,0.15,-0.3,0,0.3,-0.15,0,0.15],angOff:[0.18,-0.36,0,0.36,-0.18,0.18,-0.36,0,0.36,-0.18,0,0.18],muster:'treppe',hoehe:'steigend',hSpanne:14,eff:GEYSIR4,kal:GEYSIR_KAL,farbe:2,wechsel:true,
   boden:{k:'geysir',je:true,gt:1.4,A:'weiss',B:'tuerkis'}},
  {mit:true,n:24,gap:0.2,muster:'x',ang:0.50,licht:'fallkomet',farbe:1},
  {n:25,je:5,gap:0.08,takt:[0],orte:[-0.3,-0.15,0,0.15,0.3],angOff:[-0.36,-0.18,0,0.18,0.36],muster:'mitte',ang:0.12,hoehe:'steigend',hSpanne:14,eff:['kamuro','kronleuchter','glitzerweide','brokat','tigerschweif'],kal:GEYSIR_KAL,farbe:0,wechsel:true,
   boden:{k:'geysir',je:true,gt:3,gh:1.4,A:'weiss',B:'aqua'},pause:5}]);
SHOW_BASIS.geysirfeld={pw:3.60,sz:1.290,th:'geysir2'};
SIGNATUR.geysirfeld={idee:'geysir',text:'Ausbruch am Boden, darueber eine Saeule aus fuenf Schweif-Bruechen, jede in einer anderen Farbe'};
/* Weltuntergang (Tom: "viel, viel hoeher, die komischen Punkte am Anfang
   raus, farblich zu eintoenig, die Effekte gefallen nicht"): neu */
SHOWS.finale=()=>show({verzoegerung:true,basis:{pw:4.00,sz:1.320,th:'weltende'},rampe:{sz:[0.66,1.35],pw:[-1,4],hell:[0.60,1.45],kurve:'spaet'}},[
  {n:8,gap:1.1,muster:'zufall',ang:0.40,licht:'polarweide',farbe:1},
  {mit:0.5,n:8,gap:1.1,muster:'v',ang:0.30,licht:'zackkomet',farbe:0,pause:0.6},
  {n:36,gap:0.7,gapEnde:0.25,muster:'welle',ang:0.50,eff:['meteor','tigerschweif'],kal:'mittel',farbe:0,pause:1.0},
  {n:38,gap:0.15,muster:'x',ang:0.45,licht:'fallkomet',farbe:2,pause:1.0},
  {n:36,gap:0.3,muster:'gerade',kal:'mittel',eff:['lavaregen','kiefernkrone'],farbe:1,mine:true,mineEff:'glut'},
  {mit:true,n:8,gap:1.35,muster:'aussen',ang:0.50,licht:'farbtiger',farbe:3,pause:0.3},
  {n:48,gap:0.2,muster:'z',seg:3,ang:0.50,rohre:'breit',eff:['chrys','meteor','kamuro','sternspritzer'],kal:'gross',farbe:1},
  {mit:true,n:24,gap:0.4,muster:'v',ang:0.60,licht:'knistercrossette',farbe:2,pause:1.0},
  {n:4,gap:1.2,muster:'gerade',eff:'meteor',kal:'riesig',pw:4,farbe:0},
  {mit:true,n:12,gap:0.4,muster:'aussen',ang:0.45,licht:'farbschirm',farbe:3,pause:0.8},
  {n:0,pause:1.5},
  {n:72,gap:0.04,muster:'mitte',ang:0.60,pw:6,eff:['meteor','kronleuchter','tigerschweif'],kal:'gross',farbe:0,mine:true,mineEff:'silber'},
  {at:'ende',n:1,muster:'gerade',eff:'weltenblitz',kal:'riesig',pw:4,pause:1.0},
  {n:5,gap:0.2,muster:'zufall',ang:0.60,pw:8,eff:'glutasche',kal:'gross',steig:'keiner',pause:6}]);
SHOW_BASIS.finale={pw:4.00,sz:1.320,th:'weltende'};
SIGNATUR.finale={eff:'meteor',text:'Meteore, Tiger und Lava in Glut, Violett und Weiss - der Himmel brennt'};
/* Legion (Tom: "Effekte hoeher, einer am Anfang zeigt kein Licht, neue
   Effekte, nicht immer das Gleiche"): die Blinkkerzen (im Steigen fast
   unsichtbar) werden Farbwechselkerzen, das Finale Kometen- und
   Zwillingskerzen statt nochmals Weiden und Knallkerzen */
{ const alt=SHOWS.legion; SHOWS.legion=()=>{ const s=alt(), k=show({basis:s.basis,rampe:s.rampe},s.map(ph=>ph.perleEff==='blinkperle'?Object.assign({},ph,{perleEff:'farbperle'}):ph)), n=k.length;
  k[n-3]=Object.assign({},k[n-3],{perleEff:'schweifperle'}); k[n-2]=Object.assign({},k[n-2],{perleEff:'zwilling'}); return k; }; }
/* Faecherweide (Rakete, Tom: "viel, viel hoeher, die komischen Punkte am
   Anfang raus, farblich eintoenig"): Glitzerschweif statt Perlenschnur,
   drei Farben in den Kometen */
if(RAKETEN_KL.faecherweide){ const k=RAKETEN_KL.faecherweide; k.steig='glitzerspur';
  /* Zielhoehe wie pw+4 bei Zuendzeit 1,7 s (gerendert: mit +7 stand der Faecher winzig am Bildrand) - aber die Treibladung bleibt
     unter Feuerdrache (L24), die fehlende Hoehe kommt aus der laengeren
     Steigzeit (neuware.js STUFE: pw steigt mit dem Level) */
  const h=(k.pw+4+21)*0.8*1.7-3*1.7*1.7, deckel=RAKETEN_KL.feuerdrache?RAKETEN_KL.feuerdrache.pw:11;
  k.pw=Math.min(k.pw+4,deckel); const b=0.8*(k.pw+21), D=b*b-12*h;
  k.fuse=D>0?+((b-Math.sqrt(D))/6).toFixed(2):1.9; k.dauer=Math.max(k.dauer||5,+(k.fuse+4).toFixed(1)); }
{ EFF.faecherweide=function(p,A,B,s,r){ const C=[B[2]*0.6+0.2,B[0]*0.4+0.3,1];
  for(let k=0;k<15;k++){ const a=-1.3+k*(2.6/14), d=[Math.sin(a),Math.cos(a)*0.9+0.25,rand(-0.12,0.12)], l=Math.hypot(...d), v=kgMal(d,10.5*s/l), c=[A,B,C][k%3];
    nKomet(p,v,kgMal(c,1.5),1.6,2.2,mischF(c,[1,.78,.38],0.5),60);
    kgStern(psBig,p,v,[1.1,.7,.28],rand(4.4,5.2),1.0,0,0.9);
    rkFunken(p,v,1.0,0.3,4.6,22,mischF(c,[.95,.55,.2],0.6),{ps:psMid,life:[1.6,2.6],g:0.7,streu:0.1,mit:0.02,mode:0,spur:0.25}); }
  schall(p,v=>{ sfx.bkBrokat(v*1.1); later(0.8,()=>sfx.rieseln(v*0.7,5)); }); }; }
/* Suedsee Kugel 75 (Tom: "viel groesser - sieht nicht aus wie eine
   Kugelbombe, eher eine Rakete"): sechzehn schwere Goldwedel statt sieben,
   eine tuerkise Lagune darin, Kokosnuesse fallen */
EFF.suedsee=function(p,A,B,s,r){ const gold=A||FW.gold, tk=B||FW.tuerkis, z=s*0.62;
  lPalme(p,z,{n:16,w:11,hoch:3.8,L:3.4,G:2.6,rate:60,kopf:()=>kgMal(gold,1.35),schweif:()=>[1.05,.68,.26],life:[1.0,1.7],
    ende:(q,k)=>{ if(k%3===0) for(let j=0;j<4;j++){ const d=randDir(); kgStern(psBig,q,[d[0]*1.2,-2-Math.random()*2,d[2]*1.2],[1.2,.6,.18],rand(1.0,1.5),6,2,0.3); } }});
  for(let i=0;i<Math.round(60*QUAL())+10;i++){ const d=randDir(), w=rand(3.2,4.6)*Math.sqrt(s); kgStern(psBig,p,kgMal(d,w),kgMal(tk,1.35),rand(1.8,2.4),2.0,0,0.2); }
  schall(p,v=>{ sfx.bkWumms(v); later(2.6,()=>sfx.crackle(v*0.4)); }); };
EFF_FAMILIE.suedsee='haenger'; EFF_SCHWEIF.suedsee=0.5;
if(KUGEL.palmenkugel75) Object.assign(KUGEL.palmenkugel75,{haupt:'suedsee',sz:2.6});
SIGNATUR.palmenkugel75={eff:'suedsee',text:'Sechzehn schwere Goldwedel um eine tuerkise Lagune, Kokosnuesse fallen'};
/* Kronenregen 300 (Tom: "die Fontaene am Boden weg") */
if(KUGEL.kronenregen300) delete KUGEL.kronenregen300.abschuss;
/* Goldbrokat ist jetzt eine Kugelbombe (Tom: "sieht eher wie eine
   Kugelbombe aus"): Brokatgold mit violetten Spitzen, 100 mm */
KUGEL.goldbrokat100={kal:2,sz:2.7,pw:4.3,fuse:1.87,th:'koenig',haupt:'nishiki',A:'violett',B:'magenta',steig:'brokat',bruchOpt:{kern:false,nachglitzer:false},
  stufen:[{t:0.9,eff:'goldglitzer',sz:0.45,A:'gold',B:'violett',leise:true}]};
SIGNATUR.goldbrokat100={eff:'nishiki',text:'Flimmernder Brokat-Aufstieg, Brokatkugel mit violetten Spitzen, Goldglitzer rieselt nach'};
/* Goldregen (Tom: "zu eintoenig - ein paar weitere Effekte"): bleibt
   golden, aber jeder Abschnitt ein anderes Licht - Goldregenfaecher,
   Goldfaecher mit Glitzersaeulen, Kometenkronen, Weidencrossetten,
   Goldwasserfaelle, zum Schluss drei Doppelkronen */
lbShow('lb_goldregen',[['gold','bernstein'],['bernstein','gold'],['zitrone','gold']],{sz:[0.9,1.25],pw:[0,2],hell:[0.85,1.25],kurve:'spaet'},[
  {n:1,rohrFolge:[0],licht:'breitregen',kal:'mittel',farbe:0,pause:5},
  {n:4,gap:0.8,muster:'aussen',ang:0.3,licht:'goldfaecher',farbe:1},
  {mit:true,n:2,gap:1.2,rohrFolge:[-1,1],licht:'glitzergold',farbe:2,pause:1.5},
  {n:4,gap:0.6,muster:'welle',ang:0.3,licht:'kometenkrone',farbe:0,pause:1.5},
  {n:4,gap:0.9,muster:'v',ang:0.25,licht:'weidencrossette',farbe:1,pause:1.5},
  {n:4,gap:0.4,muster:'x',ang:0.3,licht:'goldwasserfall',farbe:2,pause:1.5},
  {n:3,gap:0.25,rohrFolge:RF3,licht:'doppelkrone',kal:'gross',farbe:0,pause:6}],{verzoegerung:true});
SIGNATUR.lb_goldregen={eff:'licht:breitregen',text:'Goldregenfaecher, Kometenkronen, Weidencrossetten und Goldwasserfaelle - Finale drei Doppelkronen'};
/* 14m/14o legen nach der Bereinigung in 14l noch Shows fuer inzwischen
   entfernte Produkte an (rb49, rb100, lb_glitzergarten) - hier noch einmal
   streichen, sonst laufen Listen ueber SHOWS ins Leere (neuware.js) */
if(typeof ENTFERNT!=='undefined') ENTFERNT.forEach(t=>[SHOWS,SIGNATUR].forEach(T=>{ if(T&&Object.prototype.hasOwnProperty.call(T,t)) delete T[t]; }));
