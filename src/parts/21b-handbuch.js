/* =========================================================
   Handbuch im Pausenmenue (Tom, 26.09.: "bei Steuerung bitte alles
   reinschreiben: Werkzeuge, wie setze ich die Sackkarre ein, wie
   mache ich dies ... alles runterschreiben").
   Der Inhalt ist aus dem Code zusammengetragen und Eintrag fuer
   Eintrag gegen den Code geprueft (26.09.). Aendert sich eine Taste,
   ein Level oder ein Preis, muss es hier mit.
   Am Touchgeraet stehen statt der Tasten die Knopfnamen.
   ========================================================= */
function hbTaste(pc,touch){ const t=COARSE?(touch||''):pc; return t?`<kbd>${t}</kbd>`:''; }
function handbuchHTML(){
  const E=hbTaste('E','Aktion'), EH=COARSE?'<kbd>Aktion</kbd> halten':'<kbd>E</kbd> halten', Q=hbTaste('Q','Ablegen'),
    K=hbTaste('K','Karre'), T=hbTaste('T','Preis'), G=hbTaste('G','Spray'), F=hbTaste('F','Umbau'),
    R=COARSE?'<kbd>Umbau</kbd> (solange du etwas hältst)':'<kbd>R</kbd>', HANDY=hbTaste('Tab','Handy'),
    H=COARSE?'die Anzeige „Anruf annehmen“':'<kbd>H</kbd>', PAUSE=COARSE?'<kbd>Menü</kbd>':'<kbd>Esc</kbd>';
  const ab=(t)=>`<p>${t}</p>`, schritte=(L)=>`<ol>${L.map(x=>`<li>${x}</li>`).join('')}</ol>`;
  const A=[
    ['So funktioniert es',
      ab(`Schau mit dem Fadenkreuz auf etwas. Unten steht, was passiert, und ${E} führt es aus (bis 3,3 m weit). ${EH} wiederholt die Aktion von selbst: Stück für Stück einräumen, Waren scannen, Dreck wischen, Schaufenster putzen, Feuerwerk aufbauen.`)+
      ab(`Der Laden öffnet am Türschild neben der Eingangstür (oder im Laptop unter Laden) und hat von 8 bis 22 Uhr offen – etwa 5½ Minuten echte Zeit. Vor dem Öffnen steht die Uhr: Einräumen und Bestellen kosten dann keine Zeit. Sind abends alle Kunden weg, beendest du am Türschild den Tag und bekommst den Tagesabschluss.`)+
      ab(`Sonntag ist Ruhetag, außer du hast die Sonntagsgenehmigung (Handy › Werbung, ab Level 7). Das Spiel speichert von selbst, alle 25 Sekunden und bei jedem wichtigen Schritt.`)],
    ['Ware bestellen',
      schritte([`Zum Laptop auf dem Schreibtisch neben der Lagertür gehen und ${E} drücken.`,
        `Reiter <b>Bestellen</b> › <b>Ware · Fachhandel</b>. Oben filterst du nach Sparte (F1, F2, Zubehör, Essen, Getränke).`,
        `Bei der Ware „+ 1× Preis“ drücken – ein Karton landet im Warenkorb.`,
        `„Warenkorb anzeigen“ › „Jetzt bestellen“. Die Lieferung kommt nach etwa 5 Sekunden. Versand 5,90 €, ab 150 € Warenwert frei.`])+
      ab(`<b>Großhandel</b> (ab Level 8 mit eigenem Lager): dieselbe Ware im 10er-Pack (−10 %) oder 20er-Pack (−18 %). <b>Restposten</b> (ab Level 14): wechselnde Angebote, sofort gekauft, ohne Versand – dafür nur 86 % Qualität, es kann Blindgänger geben. Neue Ware schaltest du unter <b>Sortiment</b> mit Lizenzpaketen frei.`)],
    ['Lieferung annehmen',
      ab(`Ohne Lager stellt der Lieferant alles vor die Ladentür auf die gelbe WARENANNAHME. Hinlaufen, mit ${E} aufheben, in den Laden tragen.`)+
      ab(`Mit Lager (ab Level 6) setzt der LKW hinten an die Rampe: Warte auf „Der Laderaum ist offen“, geh über die Brücke hinein und nimm jeden Karton mit ${E}. Ist der Laderaum leer und du bist draußen, fährt er los. Um 22 Uhr lädt der Fahrer den Rest selbst ins Lager. An gekauften Andockstationen der Logistikhalle lädt der Fahrer immer selbst ab.`)],
    ['Einräumen',
      schritte([`Karton mit ${E} aufheben – du trägst immer einen Karton (mit Karre mehr, siehe unten).`,
        `Ein Regalfach anschauen: unten steht „Einräumen: Name belegt/Platz“.`,
        `${EH}: Stück für Stück kommt ins Fach. Ist der Karton leer, wird er von selbst entsorgt.`])+
      ab(`Jedes Fach nimmt nur eine Sorte. Kühlware (Sekt, Bier, Salate …) kommt in den Sekt-Kühlschrank, Kühlpflichtiges nur dorthin. Einen Karton stellst du mit ${Q} vor dir auf den Boden. Aus dem Regal zurücknehmen geht nicht.`)],
    ['Sackkarre und Plattformwagen',
      ab(`Kaufen im Laptop unter Bestellen › Regale & Einrichtung: <b>Sackkarre</b> ab Level 3 für 350 € (4 Kartons), <b>Plattformwagen</b> ab Level 8 mit Lager für 1.400 € (8 Kartons, ersetzt die Sackkarre). Beide sind sofort da.`)+
      schritte([`${K} holt die Karre heraus. Trägst du gerade einen Karton, kommt er gleich mit drauf.`,
        `Jeden weiteren Karton mit ${E} aufheben – vom Boden, aus dem LKW oder aus dem Lagerregal. Er kommt oben drauf, bis „Die Karre ist voll“ erscheint.`,
        `Abladen nimmt immer den obersten Karton: am Regalfach ${EH} räumt ihn ein, am freien Lagerplatz lagert ${E} ihn ein, ${Q} stellt ihn auf den Boden. Danach rückt der nächste von selbst nach.`,
        `${K} stellt die Karre weg – das geht, sobald höchstens noch ein Karton drauf ist. Den trägst du dann in der Hand.`])+
      ab(`Mit Karre läufst du etwas langsamer (Sackkarre 90 %, Wagen 85 %). Regal- und Kassenpakete und die Gravur-Rakete passen nicht drauf. Unten im Bild steht, wie voll sie ist.`)],
    ['Lager',
      ab(`Lagerregale bekommst du mit dem Lager (ab Level 6) kostenlos. Mit Karton einen freien Platz anschauen („Karton einlagern“) und ${E} – ein ganzer Karton je Platz. Ohne Karton auf einen belegten Platz: „Karton nehmen“. Lagerregal 9 Plätze, Hochregal 15, Schwerlastregal 16. Das Schild am Regal zeigt die häufigsten Sorten.`)],
    ['Regale und Kassen aufbauen',
      schritte([`Im Laptop unter Bestellen › Regale & Einrichtung „bestellen“ – das geht nur, wenn für diese Art ein Stellplatz frei ist.`,
        `Das Regal kommt als flaches Paket (vor die Tür oder mit dem LKW). Mit leeren Händen ${E}: Paket aufheben.`,
        `Zum gewünschten Platz tragen und ${Q}: Liegt ein freier, passender Stellplatz höchstens 3,2 m entfernt, steht das Regal sofort. Sonst bleibt das Paket stehen.`])+
      ab(`SB-Kassen-Pakete legst du höchstens 5 m vor dem Kassenplatz ab. Technik wie Kameras, Heizstrahler, Soundanlage, Kartenterminal, Gravur-Automat und die Karren ist sofort nach dem Kauf eingebaut. Stehende Regale verschiebst du im Umbaumodus.`)],
    ['Kasse',
      schritte([`Ein Kunde legt seine Ware aufs Band. Jeden Artikel anschauen und ${E} (halten scannt am Stück).`,
        `Zahlt er mit Karte: Kasse oder Kartenterminal anschauen und ${E}.`,
        `Zahlt er bar: Kasse anschauen und ${E}. Im Fenster Scheine und Münzen antippen, bis das Rückgeld stimmt, dann „Rückgeld geben“. Genau passend gibt es 3 XP extra, zu viel zahlst du drauf.`])+
      ab(`Wer zu lange wartet, geht verärgert, und dein Ruf sinkt. Ein Kassierer (ab Level 11, Handy › Team) und SB-Kassen (ab Level 16) kassieren selbst.`)],
    ['Preise und Preisgerät',
      ab(`${T} nimmt das Preisgerät in die Hand (ab Level 2). Schaust du auf ein Fach mit Ware, einen Lagerplatz oder einen Karton, zeigt es Verkaufspreis, Marktpreis, Einkauf, Marge und Bestand. ${E} öffnet das Preismenü: −0,50 bis +0,50 €, „Markt“, und Nachbestellen in den Warenkorb (bestellt wird am Laptop).`)+
      ab(`Wichtig: Solange das Preisgerät in der Hand ist, hebst du Kartons mit Ware nicht auf – erst mit ${T} wegstecken. Alle Preise auf einmal änderst du im Laptop unter Preise & Markt.`)],
    ['Pfefferspray und Diebe',
      ab(`Ab Level 4 kommen Diebe. Du erkennst sie an der Meldung „Da klaut jemand!“, einem Alarmton und einer Markierung über dem Kopf. ${G} macht das Spray bereit, zielen und ${E} sprüht (bis 4,2 m). Ein Treffer bringt die Ware zurück und 25 XP.`)+
      ab(`Solange das Spray bereit ist, sprüht ${E} nur – danach mit ${G} wegstecken. Hilfe: Überwachungskameras (ab Level 10), Sicherheitsdienst (ab Level 13, Handy › Team), Warensicherung (ab Level 14).`)],
    ['Putzen',
      ab(`Dreckflecken am Boden anschauen („Sauber machen“) und ${EH}, bis er weg ist. Die beiden Schaufenster links und rechts der Tür werden mit der Zeit blind: anschauen und ${EH}. Dreck kostet Kunden und Ruf. Ein Mülleimer (Deko, ab Level 6) halbiert neuen Dreck, die Reinigungskraft (ab Level 6, Handy › Team) wischt selbst – Fenster putzt sie nicht.`)],
    ['Umbau',
      schritte([`${F} schaltet den Umbaumodus an. Jetzt greift ${E} nur Möbel (bis 6 m).`,
        `Möbel anschauen („Verschieben: Name“) und ${E}: es schwebt vor dir und rastet im 25-cm-Raster.`,
        `${R} dreht es um 90 Grad. ${E} setzt es ab – bei „Hier ist kein Platz“ überlappt es oder steht nicht ganz im Raum. ${Q} bricht ab.`,
        `${F} schaltet den Modus wieder aus.`])+
      ab(`Verschieben kannst du Verkaufsregale und Kühlschränke samt Ware, Lagerregale samt Kartons, die Kasse, den Schreibtisch mit Laptop, die Versandecke, den Gravur-Automaten und Deko.`)],
    ['Testfeld und Zündpult',
      ab(`Das Testfeld hinter dem Laden schaltest du im Laptop unter Ausbau frei (ab Level 5, nach Ladenerweiterung 1).`)+
      schritte([`Karton mit Feuerwerk tragen und die passende Station anschauen: Kugelbomben in den Mörser (Kanal 1–3, jedes Kaliber sein Rohr), Raketen und Römische Lichter auf die Abschussröhren (4–6), alles andere auf den Zündtisch (7–9).`,
        `${E} stellt ein Stück auf die Station, ${EH} baut weiter auf.`,
        `Ans Zündpult (höchstens 4 m) und ${E}: der Zündmodus beginnt, unten steht die Kanalleiste.`,
        COARSE?`Einen scharfen Kanal antippen zündet ihn, dazu „Alle nacheinander“ und „Alle gleichzeitig“.`:`<kbd>1</kbd>–<kbd>9</kbd> zündet den Kanal, <kbd>Enter</kbd> alle nacheinander, <kbd>Leertaste</kbd> alle gleichzeitig. <kbd>E</kbd> am Pult beendet den Zündmodus.`])+
      ab(`Jede Zündung bringt Hype (bis zu dreimal so viele Kunden, solange der Laden offen ist) und XP. Restposten-Ware kann ein Blindgänger sein. Am Tagesende werden die Stationen geleert – was nicht gezündet ist, ist weg.`)],
    ['Gravur-Automat',
      ab(`Ab Level 9 (Bestellen › Regale & Einrichtung). Blanko-Raketen-Karton tragen und ${EH}: der Automat füllt sich (bis 12). Kunden gravieren dann selbst. Mit leeren Händen ${E}: „Eigene Rakete beschriften“, Text eingeben, „Aufdrucken“. Die Rakete gehört auf die Abschussröhren – ${Q} würde sie wegwerfen.`)],
    ['Handy',
      ab(`${HANDY} holt das Handy heraus${COARSE?'':' (<kbd>Tab</kbd>, <kbd>H</kbd> oder <kbd>Esc</kbd> steckt es weg)'}. Apps: <b>Onlineshop</b>, <b>Team</b> (Personal, Lohn, Saisonpause, Reihenfolge der Einräumer), <b>Werbung</b> (Plakate, Radio, Sonntagsgenehmigung, Branchenbuch …), <b>Bank</b> (Kredit ab Level 5), <b>Bericht</b> (Zahlen, Ruf, Sauberkeit, Markt) und <b>Ziele</b>.`)+
      ab(`Mit dem Eintrag im Branchenbuch (ab Level 7, mit Lager) rufen Großkunden an. ${H} nimmt an (26 Sekunden Zeit). Dann verhandelst du (5, 10 oder 20 % mehr fordern) und schließt ab. Eine Spedition holt volle Kartons aus dem Lager. Achtung: ${COARSE?'„Ablehnen“':'<kbd>Esc</kbd> im Verhandlungsfenster'} lehnt den Auftrag ab.`)],
    ['Laptop',
      ab(`${E} am Schreibtisch öffnet den Laptop (in der Logistikhalle zusätzlich das Lagerterminal). Reiter: <b>Bestellen</b>, <b>Preise &amp; Markt</b>, <b>Sortiment</b> (Lizenzpakete), <b>Entwicklung</b> (Labor), <b>Ausbau</b> (neue Flächen nach Kapiteln), <b>Deko</b> (Wände, Böden, Schilder, Deko-Stücke) und <b>Laden</b> (öffnen, Tag beenden). „Laptop zuklappen“ bringt dich zurück ins Spiel.`)],
    ['Personal',
      ab(`Im Handy unter Team stellst du ein: Reinigungskraft (ab Level 6), Einräumer (ab Level 9 und 12, mit Lager – die Reihenfolge seiner Aufgaben legst du mit ▲ ▼ fest), Kassierer (ab Level 11, weitere an den SB-Kassen), Sicherheitsdienst (ab Level 13) und Versand (ab Level 18, mit Packstation).`)+
      ab(`Der Lohn entscheidet über Tempo und Freundlichkeit: Mindestlohn (×0,75, sie kündigen öfter), Normal, Gut (×1,3) oder Top (×1,65). In der Saisonpause bekommen sie 30 % und arbeiten nicht.`)],
    ['Versand',
      ab(`Der Onlineshop (ab Level 15) bringt eine Tagespauschale. Mit der Packstation (ab Level 16, nach Lagererweiterung 2) kommen echte Bestellungen: Packtisch anschauen und ${E} packt die älteste Bestellung, deren Ware da ist. Die Pakete landen auf der PAKETABLAGE, DDL holt sie beim Tagesabschluss ab. Mehr als 8 offene Bestellungen am Abend kosten Ruf.`)],
    ['Entwicklungslabor',
      ab(`Ab Level 20 (Kapitel 5) im Laptop unter Entwicklung: Träger, Bruchbild, zwei Farben, Etikett und Name wählen. Du kannst nur Bruchbilder verbauen, die du schon am Himmel gesehen hast. „Prototyp zünden“ ist kostenlos, „In Produktion“ bringt dein Produkt nach ein paar Tagen in den Katalog. Die zweite Zündstufe gibt es ab Level 28.`)],
    ['Musik, Bild und Pause',
      ab(`${PAUSE} öffnet dieses Menü und hält das Spiel an. ${COARSE?'':'<kbd>M</kbd> schaltet die Musik an oder aus, <kbd>N</kbd> spielt das nächste Stück, <kbd>P</kbd> schaltet die Bildeffekte um. '}Unter <b>Musik</b> wählst du jeden Titel und die Lautstärke. „Tutorial einblenden“ zeigt wieder Tipps und Zielpfeile. „Zum Startbildschirm“ speichert und zeigt Weiterspielen und Neues Spiel.`)]
  ];
  return A.map(([t,h])=>`<h4>${t}</h4>${h}`).join('');
}
