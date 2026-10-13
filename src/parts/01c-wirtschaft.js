/* =========================================================
   WIRTSCHAFTSZENTRALE (Fundament Etappe 4, 13.10.2026)
   Toms Wunsch (13.10.2026): EINE Stelle fuer alle Wirtschaftszahlen.
   Aendert man eine Groesse (z. B. Versandkosten), wirkt es nachvollziehbar
   auf alles Abhaengige (Nachfrage, Umsatz, Ruf ...). Zweck des Spiels ist
   Finanzbildung: welche Entscheidung hat welche Folge - und WARUM.
   Darum steht hier je Zahl, worauf sie wirkt, und in WIRT_KETTEN (unten)
   die Wirkungsketten als Daten; daraus entsteht die Uebersicht
   (tools/fundament/wirtschaft-uebersicht.js, docs/fundament/wirtschaft.md).

   Regeln (verbindlich fuer alle Agenten, CLAUDE.md "Dauerregel"):
   - Wirtschaftswerte NUR hier. Systeme lesen WIRT.bereich.name oder rechnen
     mit WF.name(...). Kataloge (P, UPGRADES, STAFF, LIZENZEN ...) bleiben in
     02-data & Co. - mit Namen, Texten, Level -, holen ihre GELDZAHL aber von hier.
   - Alte Namen (LOANS, VS_PORTO, DDL_PAUSCHALE, VERSAND ...) bleiben als
     Aliase bestehen (window.__bb, Tests, tools/balance/sim.js).
   - Diese Datei steht in src/build.sh VOR 02-data.js (nach reuse-helpers.js):
     02-data wertet LOANS, STAFF ... beim Laden aus.
   - Nur Zahlen und reine Funktionen; kein Zugriff auf S beim Laden.
   - WIRT ist tief eingefroren: wer zur Laufzeit hineinschreibt, faellt
     sofort auf (TypeError im strict mode) statt still zu driften.
   - Gespeicherte Kopien (Kredit im Spielstand, Restposten-Angebot,
     Bestellungen, Eigenrezepte) aendern sich NICHT rueckwirkend - neue
     Werte wirken auf Neues. WIRT.historie bleibt fuer immer eingefroren.
   - Jede absichtliche Wertaenderung zeigt der Snapshot
     (node tools/fundament/wirtschaft-snapshot.js) - im Bericht nennen.
   ========================================================= */
const WIRT={
  /* ---------- Spielstart ---------- */
  start:{
    geld:500,           // € Startkapital (freshState). Wirkt auf: erste Regale/Ware - eng gewollt
    ruf:50,             // von 100. Wirkt auf: Kunden, Preistoleranz, Geduld, Online
    level:1,
    startDoy:273        // Tag 0 = 1. Oktober (Tag im Jahr) -> Silvester nach ~92 Tagen
  },
  /* ---------- Tageslaenge ---------- */
  zeit:{
    oeffnen:480,        // Spielminute 08:00
    schliessen:1320,    // Spielminute 22:00
    echtzeitSek:330     // ein Verkaufstag dauert 330 s echte Zeit (MIN_PER_SEC = 840/330).
                        // Wirkt auf: Kunden je Tag (Takt in Sekunden), Online-Bestelltakt (11c)
  },
  /* ---------- Einkauf beim Lieferanten (Wareneingang) ---------- */
  einkauf:{
    lieferSek:5,        // s bis die Lieferung da ist (x Ereignis "Stau" 2,1)
    liefergebuehr:5.9,  // € je Bestellung (VERSAND - Namensfalle: das ist der EINGANG, nicht der Onlineversand)
    lieferfreiAb:150    // € Warenwert, ab dem die Liefergebuehr entfaellt (VERSANDFREI)
  },
  /* ---------- Onlineshop / Versand (Ausgang) ----------
     Quellen siehe 11c-versand.js Kopf "Versand-Wirtschaft": Baymard 2024/25 (39-48 % Abbrueche wegen
     Zusatzkosten), Lewis/Singh/Fay 2006, UPS Pulse 2014 (58 % stocken auf), Bijmolt et al. 2005 (-2,62). */
  versand:{
    std:{kosten:4.9,frei:50},        // Voreinstellung = "Nachfrage 100 %" (vsQuoteStd)
    kostenMax:20, freiMax:300,       // Regler-Grenzen im Laptop
    porto:{1:2.0,3:3.5,6:5.0},       // € an DDL je Paket S/M/L (VS_PORTO)
    /* Abbruch: Kunde mit Warenkorb w nimmt Versand v hin mit p = exp(-k*(v/(a*w+b))^2) */
    abbruch:{k:0.75,a:0.2,b:2.5},    // 4,90 € auf 25 € -> 73 % kaufen, 20 € -> fast niemand
    korb:[5,9,13,18,22,28,38,55,95], // € Warenkorb-Quantile (gemessen L25-34) fuer die Anzeige "Nachfrage x %"
    aufstocken:{ab:0.7,anteil:0.6,maxSchritte:4},  // ab 70 % der Gratis-Schwelle legen 60 % etwas dazu (UPS 2014: 58 %)
    sale:{allesElast:-1.5,produktElast:-2.62,produktNeu:0.5,allesMax:50,produktMin:5,produktMax:70},
    /* Besucher je Tag = clamp(round(grund + jeRuf*Ruf + jeLevel*Level), min, max) x Stufe x Sale / Standardquote */
    basis:{grund:4,jeRuf:0.12,jeLevel:0.35,min:4,max:22},
    stufeMul:[1,1,1.45,1.9],         // Packstation Stufe 0..3 (mehr Packplaetze -> mehr Bestellungen)
    onlineDeckel:1.3,                // Onlinepreis hoechstens 130 % vom Marktpreis
    paketwertSchaetzung:{grund:12,jeLevel:0.6},  // € Anzeige, solange keine Bestellung offen ist
    /* Bestellgroesse: Anteil S / bis M, ab Level spaetAb grosszuegiger */
    groesse:{anteilS:0.68,bisM:0.94,spaetAb:22,spaetS:0.5,spaetBisM:0.85},
    /* Marktplatz-Pauschale je Tag ab Onlineshop (auch mit Packstation, ohne Kosten):
       round(grund + jeRuf*Ruf + jeLevel*Level) - ist-analyse: ~52 % des Betriebsgewinns (fuers Balancing) */
    pauschale:{grund:40,jeRuf:1.6,jeLevel:4},
    ddl:{pauschale:39,anfahrtSek:20},  // € je Abholung (Herleitung 11e-palette.js Kopf), s Anfahrt
    /* Ruf-Strafen am Abend */
    strafe:{
      offenAb:8, offenJe:0.12, offenMax:2,       // mehr als 8 offene Bestellungen: -0,12 je weitere, max -2
      wartendJe:0.06, wartendMax:3               // Pakete seit gestern auf der Palette: -0,06 je Paket, max -3
    },
    /* Packmaterial: Preis je Gebinde, Stueck je Gebinde, Verbrauch je Paket S/M/L */
    material:{
      ks:{preis:8.9,stueck:25}, km:{preis:11.4,stueck:15}, kl:{preis:12.8,stueck:8},
      folie:{preis:14.9,stueck:20}, band:{preis:9.9,stueck:48},
      folieJe:{1:1,3:2,6:3}, bandJe:{1:1,3:1,6:2}
    }
  },
  /* ---------- Preise der Kataloge (Kataloge selbst bleiben in 02-data, 02b, 02e, 02i, 06-fixtures) ---------- */
  ausbau:{
    kistenJeKauf:5,     // Mehrwegkisten je Kauf (KISTE_STUECK, 08e) - Preis: preis.kisten
    preis:{ // € je Ausbau (UPGRADES[].cost), Reihenfolge wie im Katalog
      plakat:400, sackkarre:350, kisten:10, wagen:1400, terminal:320, tag4:900,
      heizung:450, musik:380, radio:1200, cams:900, regallicht:700, alarm:2200,
      grosskunden:500, onlineshop:3200, kundenkarte:2600, tafel:4200, lizenz:6500, klima:5400,
      meister:12000, shop_halb:1400, testfeld:3200, shop_gross:7500, lager:1200, lager_nord:1900,
      lager_gross:6200, shop_ost:16000, shop_sued:34000, lager_sued:11000, lager_sued2:15000, lager_west:22000,
      rampe2:12000, lager_west2:30000, rampe3:15000, rampe4:20000, lager_west3:42000, rampe5:26000,
      packstation:6400, packstation2:5900, packstation3:6900, eingang2:11500, kasse2:3400, labor:9800,
      labor2:16500, gravur:1200
    }
  },
  lizenz:{
    preis:{ // € je Lizenzpaket (LIZENZEN[].cost), nach Level
      start:0, jugend:60, zubehoer:120, klassiker:380, partydeko:520, snacks:260,
      krach:1100, buffet:700, partynacht:1500, kleinfeuer:1800, himmel:2600, genuss:3400,
      feuerzauber:4200, verbund:6000, getraenke:5000, festtafel:6500, nachthimmel:9000, import:13000,
      goldklasse:15000, schabernack:16000, sternklasse:18000, grossfeuer:21000, feinkost:12000, profi:26000,
      meister:34000, grossfeuerwerk:42000, pyroweltklasse:52000
    }
  },
  personal:{
    einstellung:{reinigung:250, auffueller:450, auffueller2:600, kassierer:600, kassierer2:600, kassierer3:600, security:800, packer:700, packer2:750, packer3:800},   // € einmalig
    lohn:{reinigung:55, auffueller:110, auffueller2:130, kassierer:145, kassierer2:140, kassierer3:140, security:190, packer:165, packer2:170, packer3:175}   // € Grundlohn je Tag (x Lohnstufe)
  },
  deko:{ preis:{pflanze:70, stehtisch:95, muell:80, teppich:130, lichter:170, ventilator:210, baum:290, neon:480, automat:640, bild_raketen:180, bild_stadt:320, bild_sortiment:420, saeule:900, vitrine:1400, bild_meister:820} },
  wand:{ preis:{creme:0, weiss:50, salbei:140, sand:250, streifen:370, anthrazit:520, raute:670, terrakotta:780, ziegel:840, metro:960, beere:1020, blume:1210, holzvert:1410, mitternacht:1620, petrol:1840, gold:2060, gras:2400, damast:2900, moire:3400, nussbaum:4200, samt:5600, marmorwand:7800} },
  boden:{ preis:{grau:0, vinyl:70, holz:190, schach:340, eiche:520, fliese:720, beton:940, industrie:1180, teppich:1430, terrazzo:1690, marmor:1970, fischgraet:2600, chevron:3200, travertin:3900, nussfisch:4600, veneziano:5400, marmorband:6200, versailles:8500} },
  regal:{ // Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis)
    verkauf:{klein:{grund:45,jeWeiteres:28}, standard:{grund:130,jeWeiteres:70}, hoch:{grund:260,jeWeiteres:95}, kuehl:{grund:430,jeWeiteres:155}, gondel:{grund:560,jeWeiteres:190}, eck:{grund:480,jeWeiteres:165}, gross:{grund:640,jeWeiteres:210}, tisch:{grund:220,jeWeiteres:80}, tischgross:{grund:340,jeWeiteres:120}, gitter:{grund:140,jeWeiteres:50}, gitter2:{grund:210,jeWeiteres:75}, gitter3:{grund:290,jeWeiteres:100}, kasse:{grund:120,jeWeiteres:60}},
    lager:{standard:{grund:0,jeWeiteres:0}, hoch:{grund:520,jeWeiteres:150}, schwer:{grund:880,jeWeiteres:240}}
  },
  /* ---------- Bank: Kredit, Dispo ---------- */
  kredit:{
    /* Kreditstufen (Kopie landet im Spielstand: {amount,remaining,term,rate,paid}).
       rate = Zins je Tag auf den Rest; Rate = amount/term + Rest*rate (16-day loanDaily) */
    stufen:[
      {lvl:5,amount:1000,term:10,rate:0.012},
      {lvl:8,amount:2500,term:12,rate:0.013},
      {lvl:12,amount:5000,term:14,rate:0.014},
      {lvl:15,amount:10000,term:16,rate:0.015},
      {lvl:20,amount:25000,term:20,rate:0.016},
      {lvl:26,amount:60000,term:24,rate:0.017}
    ],
    tilgenKnoepfe:[250,1000],   // € Sondertilgung im Laptop (dazu "Alles")
    dispo:{
      abLevel:4,        // vorher kein Dispo
      grund:260,        // € Rahmen = grund + jeLevel*Level
      jeLevel:70,
      zinsTag:0.006     // 0,6 % je Tag auf den Minusbetrag (= ~219 % p. a. - bewusst schmerzhaft)
    }
  },
  /* ---------- Laufende Kosten (Tagesabschluss) ---------- */
  fix:{
    grund:10,           // € je Tag immer
    jeLagerregal:6,     // € je Lagerregal
    levelAb:4,          // ab diesem Level kostet jedes weitere Level ...
    jeLevel:4,          // ... 4 € je Tag ("Level-Steuer", keine Miete/Flaeche - Luecke fuers Balancing)
    regalArt:{klein:4,standard:9,hoch:12,kuehl:18,gondel:14,eck:11,gross:13,gitter:3,gitter2:4,gitter3:5,tisch:6,tischgross:8},  // € je Verkaufsregal
    regalStandard:9     // € fuer Regalarten ohne Eintrag (z. B. Kassenregal)
  },
  tag:{
    automat:45          // € je Tag mit Deko "Getraenkeautomat"
  },
  /* ---------- Ruf (0..100) ---------- */
  /* Jede Aenderung geht ueber rep(d) und wird auf 0..100 geklemmt. Ruf wirkt auf: Kunden je Tag
     (0,55 + Ruf/100), Preistoleranz (+Ruf/900), Geduld (+0,3*Ruf), Online-Besucher und -Pauschale. */
  ruf:{
    kaufOk:0.8,         // Kunde hat alles bekommen und bezahlt
    kaufMitFehl:0.2,    // bezahlt, aber ein Wunsch fehlte
    fehlwunsch:-0.4,    // Fach leer / Ware nicht da (je Wunsch)
    leerGegangen:-0.3,  // geht ganz ohne Ware
    zuTeuer:-0.5,       // "Viel zu teuer!" (Preis ueber Toleranz)
    geduldWeg:-2,       // "Dauert mir zu lange!"
    diebGestellt:0.6, diebEntkommen:-1.8,
    sbAllein:-0.4,      // SB-Kunde kam allein nicht weiter
    sbHilfe:0.1,        // ihm wurde geholfen
    auftragErfuellt:2.5, auftragVerfehlt:-4,   // Grossauftraege (Telefon)
    pruefungGut:3, pruefungSchlecht:-5, pruefungSauberAb:70,   // Ereignis "Gewerbeaufsicht": Sauberkeit >= 70
    kuendigung:-1,      // Mitarbeiter kuendigt wegen Mindestlohn
    kontoMinus:-3       // je Tagesabschluss mit Konto < 0
  },
  /* ---------- Erfahrung ---------- */
  /* Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen,
     Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). */
  xp:{
    kurve:{a:50,exp:1.55},
    kunde:{jeEuro:0.5,grund:4,barPassend:3},          // je bezahltem Einkauf; +3 wenn bar ohne Rueckgeld-Fehler
    tag:{grund:60,jeUmsatz:0.05,ohneBeschwerde:40},   // Tages-XP = grund + Umsatz*jeUmsatz + (keiner genervt ? ohneBeschwerde : 0)
    jahr:200,           // XP fuer ein volles Jahr
    kreditGetilgt:40,
    kapitel:40,
    /* Geld ausgeben bringt XP (Luecke fuers Balancing: Level folgt Ausgaben) */
    ausbauTeiler:12,                 // Ausbau/Deko: Kosten/12
    lizenz:{teiler:14,bonus:30},     // Lizenz: Kosten/14 + 30
    herausforderung:{teiler:10,bonus:25},   // Praemie/10 + 25
    wochenzielTeiler:3,              // Wochenziel: Praemie/3
    auftragAngenommen:20, auftragErfuellt:{jeEuro:0.4,grund:40},
    restposten:20,                   // Wundertuete / Restposten-Angebot gekauft
    eigeneRezeptur:180,
    zuenden:{hypeTeiler:3,min:1},    // je gezuendetem Stueck: max(1, Hype/3)
    serieStufen:[5,10,20,35,50,75,100], serieJeKunde:6,   // Serie zufriedener Kunden: n*6 XP an den Stufen
    diebGestellt:25, regalAufbau:12, einbau:20, gravur:12, paketGepackt:3, dreckWeg:3, fensterPutzen:4, sbHilfe:4, packmaterialEinlagern:1
  },
  /* ---------- Nie aendern: historische Preise fuer Spielstand-Migrationen (18-save) ----------
     Wer alte Ausbauten hatte, bekommt GENAU das zurueck, was er damals bezahlt hat -
     unabhaengig davon, was dieselbe Sache heute kostet. */
  historie:{
    erstattung:{kasse3:3800, sbBetreuer:650, packstation:6400, packstation2:14000, packstation3:26000, packer:700, packer2:750, packer3:800}
  }
};

/* ---------- Reine Formeln (lesen nur Argumente und WIRT) ---------- */
const WF={
  /* Zahlen fuer Texte: deutsch, mit Tausenderpunkt; dez = Nachkommastellen */
  zahl:(v,dez)=>Number(v).toLocaleString('de-DE',{minimumFractionDigits:dez|0,maximumFractionDigits:dez|0}),
  /* "1.400 €" bzw. mit dez=2 "5,90 €" (normales Leerzeichen, anders als eur()) */
  euro:(v,dez)=>WF.zahl(v,dez)+' €',
  /* kleine Zahlen als Wort ("über acht"), sonst Ziffern */
  zahlwort:(n)=>['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn','zwanzig'][n]||String(n),
  /* Marktplatz-Pauschale des Onlineshops je Tag (16-day endDay, Laptop-Anzeige, sim.js) */
  /* XP bis zum naechsten Level (xpFor in 02-data) */
  xpBis:(l)=>Math.round(WIRT.xp.kurve.a*Math.pow(l,WIRT.xp.kurve.exp)),
  onlinePauschale:(ruf,level)=>Math.round(WIRT.versand.pauschale.grund+ruf*WIRT.versand.pauschale.jeRuf+level*WIRT.versand.pauschale.jeLevel)
};

/* ---------- Tief einfrieren ---------- */
(function wirtFrieren(o){ Object.freeze(o); for(const k of Object.keys(o)){ const v=o[k]; if(v&&typeof v==='object'&&!Object.isFrozen(v)) wirtFrieren(v); } })(WIRT);
Object.freeze(WF);
/* Fuer Tests, Werkzeuge und die Uebersicht (window.__bb bleibt unberuehrt) */
window.__wirt={WIRT,WF};
