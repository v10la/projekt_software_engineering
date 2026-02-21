# Geschenke-Manager

A full-stack gift management application for tracking gifts and gift ideas for friends and family.

## Features

- **Person Management** — Add people with birthdays and personal notes
- **Gift & Idea Tracking** — Record past gifts and capture new ideas with text, links, and images
- **Quick Idea Capture** — Fast form to save ideas with minimal friction
- **Idea-to-Gift Conversion** — One-click conversion from idea to planned gift with occasion and date
- **Task Management** — Add sub-tasks (TODOs) to gifts (e.g., "buy wrapping paper")
- **Custom Occasions** — Built-in Geburtstag (Birthday) & Weihnachten (Christmas), plus custom occasions
- **Dashboard** — Overview of upcoming birthdays and Christmas gift status
- **Share Links** — Generate public read-only links to share gift ideas for a person
- **HTML Export** — Download the complete gift list as a standalone HTML file
- **Email Notifications** — Monthly birthday reminders and weekly Christmas status during December
- **AI Gift Suggestions** — OpenAI-powered suggestions based on past gifts and interests

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** SQLite via better-sqlite3
- **ORM:** Drizzle ORM
- **UI:** Tailwind CSS + shadcn/ui
- **Icons:** Lucide React
- **Notifications:** node-cron + nodemailer
- **AI:** OpenAI API (gpt-4o-mini)

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
cd geschenke-manager
npm install
```

### Database Setup

```bash
npm run db:migrate
```

This creates the SQLite database in `data/geschenke.db` and seeds the default occasions.

### Configuration

Copy `.env.local` and configure:

```env
# Required for AI suggestions
OPENAI_API_KEY=sk-...

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NOTIFICATION_EMAIL=recipient@example.com

# App URL (for share links and cron)
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

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/export` | GET | Download full list as HTML |
| `/api/suggest` | POST | Generate AI gift suggestions |
| `/api/notifications?type=birthday` | GET | Trigger birthday reminders |
| `/api/notifications?type=christmas` | GET | Trigger Christmas status |
| `/api/upload` | POST | Upload image file |

## Notifications

Notifications are automatically scheduled via cron:

- **Birthday reminders**: 1st of each month at 9:00 AM
- **Christmas status**: Every Monday in December at 9:00 AM

Requires SMTP configuration in `.env.local`. Without email config, the notification endpoints still generate HTML content and return it in the API response.

You can also trigger notifications manually via the API endpoints above.
