# Speichern 17.10.2026 – Ursache und Beweis

Symptom (Tom): Bei der Simulation fiel der Spielstand auf einen älteren Tag zurück, kein Hinweis.
Messung (`tools/balance/sim.js`, Strategie mittel, 164 Tage): live Tag 163 / 23 570 €, gespeichert Tag 122 / 3 328 € (Stand 67 KB – kein Quota-Problem).
Ursache: `save()` baute den Stand in einem `try{}catch(e){}`. Der Bot legte Kartons mit `spawnFloorBox(..,{x,z})` ohne Höhe `y` auf den Boden
(`tools/balance/sim.js`); `stateBauen()` rechnete `b.mesh.position.y.toFixed(2)` → „Cannot read properties of undefined (reading 'toFixed')“ →
jedes Speichern danach schlug still fehl (28 von 106 Speichervorgängen in zwei Tagen), der alte Stand blieb liegen.
Behoben: `spawnFloorBox` setzt ohne `y` den Boden (0,2), `r2n()` macht kaputte Zahlen zu Ersatzwerten (statt zu kippen), `save()` meldet jeden Fehler
(Toast „Speichern fehlgeschlagen: <Grund>“, `SAVE_STATUS`), liest nach dem Schreiben nach, räumt bei vollem Speicher ersetzbare Einträge
(Vorführungs-Sicherung `bb_gp_sicherung`, Leistungsbericht), kürzt notfalls Verlaufsdaten (Preisverlauf, Online-Log), speichert bei Zirkelbezug ohne den Bezug,
sichert defekte Stände unter `<KEY>_defekt`; die Vorführung löscht ihren Sicherungs-Rückschreib-Schritt nicht mehr, wenn die Sicherungskopie scheiterte.
Nachweis: derselbe Bot (mit dem alten Fehler im Bot) über 40 Tage ab Tag 122: gespeichert Tag 161 / 17 733,57 € = live Tag 160/161 / 17 734 €.
Quota-Wachstum gemessen (Gameplay-Vorführung, Vollausbau): Tag 0 63 KB, Tag 20 131 KB, Tag 50 257 KB (Hauptanteil `bestellungen`, unerledigte Online-Bestellungen ~3,4 KB/Tag) – bis zur 5-MB-Grenze weit entfernt.
Test: `src/tests/speichern.js` (Rundlauf, Quota, Platz schaffen, kompakt, Zirkel, Karton ohne y, defekter Stand, Vorführung ohne Sicherungskopie).
