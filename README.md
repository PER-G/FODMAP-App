# FODMAP Analyse App

Deutschsprachige (und englischsprachige) Web-App zur FODMAP-Analyse von Lebensmitteln, Rezepten und Mahlzeiten. Mit KI-gestützter Analyse (Claude), Kamera-Upload, Supermarkt-Empfehlungen und wachsender Datenbank.

## Features

- **FODMAP-Analyse**: Text- und Bildbasierte Analyse mit Ampel-System (grün/gelb/rot)
- **5 FODMAP-Untergruppen**: Fruktose, Laktose, Fruktane, GOS, Polyole einzeln bewertet
- **Nährwerte**: Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe pro 100g
- **Alternativen**: Verträgliche, proteinreiche und kalorienarme Alternativen
- **Supermarkt-Tipps**: REWE, EDEKA, Aldi, Lidl, Kaufland, dm, Rossmann, Alnatura
- **Kamera/Bild-Upload**: Zutatenlisten und Produkte fotografieren und analysieren
- **Chat**: Konversation mit FODMAP-Assistent (thematisch eingegrenzt)
- **Rezept-Analyse**: Zutaten einzeln prüfen mit Ersatzvorschlägen
- **Mahlzeit-Generator**: Rezeptvorschläge nach Filtern (High Protein, Vegan, etc.)
- **Verlauf & Favoriten**: Lokal gespeichert
- **Zweisprachig**: Deutsch und Englisch (UI + KI-Antworten)
- **Dark Mode**: Modernes, medizinisch-vertrauenswürdiges Design
- **Passwortschutz**: Login erforderlich

## Tech-Stack

- **Frontend**: Vanilla HTML/CSS/JS (ES Modules, kein Build-Step)
- **Backend**: Vercel Serverless Functions (Node.js)
- **KI**: Anthropic Claude API (Messages API mit Vision)
- **Deployment**: Vercel (Hobby/Free Tier)
- **Datenbank**: JSON Seed-Dateien (V1), vorbereitet für DB-Migration

## Setup

### 1. Repository klonen

```bash
git clone https://github.com/DEIN-USER/fodmap-app.git
cd fodmap-app
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Environment Variables setzen

Erstelle eine `.env` Datei (wird nicht committed):

```
ANTHROPIC_API_KEY=sk-ant-api03-DEIN_KEY
AUTH_USER=DEIN_USER
AUTH_PASSWORD=DEIN_PASSWORT
AUTH_SECRET=ein-zufaelliger-geheimer-string
```

### 4. Lokal starten

```bash
npx vercel dev
```

Die App läuft auf `http://localhost:3000`.

### 5. Auf Vercel deployen

1. Push zu GitHub
2. Vercel Dashboard: "Import Project" → GitHub Repo auswählen
3. Environment Variables setzen:
   - `ANTHROPIC_API_KEY`
   - `AUTH_USER`
   - `AUTH_PASSWORD`
   - `AUTH_SECRET`
4. Deploy!

## Kosten

| Dienst | Kosten |
|--------|--------|
| Vercel Hobby | Kostenlos |
| GitHub | Kostenlos |
| Claude API | ~2-5 EUR/Monat bei normaler Nutzung |

## Dateistruktur

```
api/              Vercel Serverless Functions
  auth.js         Login-Endpoint
  analyze.js      Text-Analyse
  analyze-image.js Bild-Analyse (Claude Vision)
  chat.js         Chat-Konversation
  suggest-meal.js Mahlzeit-Generator
  recipe-analyze.js Rezept-Prüfung
  foods.js        Lebensmittel-Datenbank API
  supermarkets.js Supermarkt-Daten API
  candidates.js   Wachstums-System
  _lib/           Server-Utilities (nicht als API exponiert)
data/             Seed-Datenbanken (JSON)
public/           Statisches Frontend
  css/            Stylesheets
  js/             JavaScript Module
    components/   UI-Komponenten
    i18n/         Sprachdateien
    utils/        Hilfsfunktionen
```

## Sicherheit

- API-Key nur serverseitig (Environment Variable)
- Token-basierte Authentifizierung (HMAC)
- Input-Validierung serverseitig
- Kein innerHTML mit User-Input
- Bild-Komprimierung clientseitig (max 1024px)
- Thematische Eingrenzung des Chatbots (spart API-Kosten)

## Nächste Ausbaustufen

- [ ] PWA mit Offline-Support
- [ ] Light/Dark Mode Toggle
- [ ] Benutzerkonten + Server-Speicherung
- [ ] Echte Datenbank (Supabase/Neon)
- [ ] Admin-Dashboard für Kandidaten-Moderation
- [ ] FODMAP-Tagebuch / Symptom-Tracker
- [ ] Barcode-Scanner
- [ ] Weitere Sprachen
