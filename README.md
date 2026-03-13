# Geschenke-Manager

Eine Full-Stack-Anwendung zur Geschenkeverwaltung, mit der sich Geschenke und Geschenkideen für Freunde und Familie verwalten lassen.

## Funktionen

- **Personenverwaltung** — Personen mit Geburtstagen und persönlichen Notizen hinzufügen
- **Geschenke & Ideen verwalten** — Frühere Geschenke erfassen und neue Ideen mit Text, Links und Bildern festhalten
- **Schnelle Ideenerfassung** — Schnelles Formular zum Speichern von Ideen mit minimalem Aufwand
- **Umwandlung von Ideen in Geschenke** — Umwandlung von Ideen in geplante Geschenke mit Anlass und Datum mit einem Klick
- **Aufgabenverwaltung** — Füge Unteraufgaben (To-dos) zu Geschenken hinzu (z. B. „Geschenkpapier kaufen“)
- **Benutzerdefinierte Anlässe** — Integrierte Anlässe „Geburtstag“ und „Weihnachten“ sowie benutzerdefinierte Anlässe
- **Dashboard** — Übersicht über anstehende Geburtstage und den Status von Weihnachtsgeschenken
- **Links teilen** — Erstellen Sie öffentlich zugängliche, schreibgeschützte Links, um Geschenkideen für eine Person zu teilen
- **HTML-Export** — Laden Sie die vollständige Geschenkliste als eigenständige HTML-Datei herunter
- **E-Mail-Benachrichtigungen** — Monatliche Geburtstagserinnerungen und wöchentlicher Weihnachtsstatus im Dezember
- **KI-Geschenkvorschläge** — Von Groq generierte Vorschläge basierend auf früheren Geschenken und Interessen

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Sprache:** TypeScript
- **Datenbank:** SQLite über better-sqlite3
- **ORM:** Drizzle ORM
- **UI:** Tailwind CSS + shadcn/ui
- **Icons:** Lucide React
- **Benachrichtigungen:** node-cron + nodemailer
- **KI:** Groq (llama-3.3-70b-versatile)

## Erste Schritte

### Voraussetzungen

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Datenbank-Einrichtung

```bash
npm run db:migrate
```

Dadurch wird die SQLite-Datenbank in `data/geschenke.db` erstellt und mit den Standard-Anlässen vorbelegt.

### Konfiguration

Kopiere `.env.local` und konfiguriere:

```env
# Erforderlich für KI-Vorschläge
OPENAI_API_KEY=sk-...

# Optional: E-Mail-Benachrichtigungen
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NOTIFICATION_EMAIL=recipient@example.com

# App-URL (für Freigabelinks und Cron)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
  app/                  — Next.js App Router pages
    page.tsx            — Dashboard
    persons/            — Person list, detail, create
    gifts/[id]/         — Gift edit page
    occasions/          — Occasion management
    share/[token]/      — Public share page
    api/                — API routes (upload, suggest, export, notifications)
  components/           — React components
  lib/
    db/                 — Database schema, connection, migration, seed
    actions/            — Server actions (persons, gifts, occasions, tasks, share)
    ai.ts               — OpenAI integration
    notifications.ts    — Email notification logic
    cron.ts             — Cron job scheduler
data/                   — SQLite database (auto-created)
public/uploads/         — Uploaded images
```

## API-Endpunkte

| Endpunkt | Methode | Beschreibung |
|---|---|---|
| `/api/export` | GET | Vollständige Liste als HTML herunterladen |
| `/api/suggest` | POST | AI-Geschenkvorschläge generieren |
| `/api/notifications?type=birthday` | GET | Geburtstagserinnerungen auslösen |
| `/api/notifications?type=christmas` | GET | Weihnachtsstatus auslösen |
| `/api/upload` | POST | Bilddatei hochladen |

## Benachrichtigungen

Benachrichtigungen werden automatisch über Cron geplant:

- **Geburtstagserinnerungen**: Am 1. jedes Monats um 9:00 Uhr
- **Weihnachtsstatus**: Jeden Montag im Dezember um 9:00 Uhr

Erfordert eine SMTP-Konfiguration in `.env.local`. Ohne E-Mail-Konfiguration generieren die Benachrichtigungs-Endpunkte weiterhin HTML-Inhalte und geben diese in der API-Antwort zurück.

Sie können Benachrichtigungen auch manuell über die oben genannten API-Endpunkte auslösen.
