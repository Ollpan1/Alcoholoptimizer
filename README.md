# Alkoholkalkyl 🍻

Ett webbaserat verktyg för att beräkna, följa och planera promillenivåer i blodet baserat på personliga kroppsfaktorer, intagna drycker och farmakokinetiska modeller.

## Funktioner

- **Live-promillebevakning:** Följ din promille i realtid med en tidslinjesimulering.
- **Promilleplanerare:** Planera ditt drickande mellan angivna tider för att nå en viss målpromille med både uppbyggnads- och underhållsfas.
- **Dryckessökning & Databas:** Sök bland drycker från Systembolaget (`systembolaget.json`) med automatisk hämtning av alkoholhalt, volym, pris och APK (Alkohol Per Krona).
- **Fysiologisk modell:** Använder första ordningens absorption från magen och en icke-linjär **Michaelis-Menten-modell** för leverns förbränning (anpassningsbar efter mättnadskänsla som "Hungrig", "Mätt" eller "Edward Blom").
- **Responsiv design:** Fungerar lika bra på dator som på mobil (med anpassning för svenska mobiltangentbord och decimalinmatning).

## Teknisk struktur

Projektet är uppbyggt som en komplett webbapplikation i en enda fil (`index.html`) med tillhörande JSON-databas (`systembolaget.json`) och Python-skript för uppdatering av dryckesdata (`update_apk_data.py`).

## Starta projektet

1. Klona repositoryt eller ladda ner filerna.
2. Öppna `index.html` direkt i valfri webbläsare (eller via en lokal utvecklingsserver som Live Server i VS Code).
