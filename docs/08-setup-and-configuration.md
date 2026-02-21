# Setup and Configuration

## Prerequisites

- **Node.js** 20 or later
- **npm** (included with Node.js)

## Installation

```bash
npm install
```

This installs all dependencies listed in `package.json`.

## Database Setup

```bash
npm run db:migrate
```

This runs `src/lib/db/migrate.ts` via the `tsx` TypeScript runner. It:
1. Creates the `data/` directory if it doesn't exist.
2. Creates the SQLite database file at `data/geschenke.db`.
3. Creates all tables using `CREATE TABLE IF NOT EXISTS` (idempotent).
4. Seeds the two default occasions ("Geburtstag", "Weihnachten") using `INSERT OR IGNORE`.

The migration is safe to run multiple times — it only creates tables and rows that don't already exist.

## Environment Variables

**File:** `.env.local` (in project root, not committed to git)

```env
# Required for AI gift suggestions
OPENAI_API_KEY=sk-...

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NOTIFICATION_EMAIL=recipient@example.com

# App URL (used by cron jobs and share links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Variable Details

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | For AI features | OpenAI API key. Without this, the "AI Suggestions" button will show an error. All other features work without it. |
| `SMTP_HOST` | For email | SMTP server hostname. Default: `smtp.gmail.com`. |
| `SMTP_PORT` | For email | SMTP port. Default: `587` (STARTTLS). |
| `SMTP_USER` | For email | SMTP authentication username (usually your email address). |
| `SMTP_PASS` | For email | SMTP authentication password. For Gmail, use an App Password. |
| `NOTIFICATION_EMAIL` | For email | Recipient email for notifications. |
| `NEXT_PUBLIC_APP_URL` | For cron/sharing | Base URL of the app. Used by cron jobs to call API routes and for constructing share links. Default: `http://localhost:3000`. |

### What Works Without Configuration

- All person/gift/occasion management (full CRUD)
- Dashboard, birthday countdown, Christmas status
- Quick idea capture, idea-to-gift conversion
- Task management
- Share link generation and public share pages
- HTML export

### What Requires Configuration

- **AI suggestions:** Requires `OPENAI_API_KEY`
- **Email notifications:** Requires all `SMTP_*` and `NOTIFICATION_EMAIL` variables

## Running the Application

### Development Mode

```bash
npm run dev
```

Starts the Next.js development server at `http://localhost:3000` with:
- Hot module reloading (changes appear instantly)
- Error overlay in the browser
- Automatic database seeding and cron job scheduling via `instrumentation.ts`

### Production Mode

```bash
npm run build
npm start
```

1. `npm run build` compiles and optimizes the application for production.
2. `npm start` starts the production server at `http://localhost:3000`.

## Available npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `next dev` | Start development server with hot reload |
| `npm run build` | `next build` | Build optimized production bundle |
| `npm start` | `next start` | Start production server |
| `npm run lint` | `next lint` | Run ESLint on the codebase |
| `npm run db:migrate` | `npx tsx src/lib/db/migrate.ts` | Create/update database tables and seed data |

## Project Configuration Files

| File | Purpose |
|---|---|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration with `@/*` path alias mapping to `./src/*` |
| `tailwind.config.ts` | Tailwind CSS configuration with shadcn/ui theme extensions |
| `postcss.config.mjs` | PostCSS configuration for Tailwind |
| `next.config.mjs` | Next.js configuration (server actions body size limit, instrumentation hook) |
| `drizzle.config.ts` | Drizzle Kit configuration (for potential future migration tooling) |
| `components.json` | shadcn/ui configuration (component paths, aliases) |
| `.eslintrc.json` | ESLint configuration extending `next/core-web-vitals` |
| `.gitignore` | Git ignores for `node_modules`, `.next`, `data/`, uploads |
| `.env.local` | Environment variables (not in git) |

## Startup Sequence

When the Next.js server starts (both `dev` and `start`):

1. Next.js loads `src/instrumentation.ts` (enabled by `instrumentationHook: true` in `next.config.mjs`).
2. The `register()` function checks if running in Node.js runtime (not Edge).
3. It calls `seedDatabase()` from `src/lib/db/seed.ts`:
   - Checks if the `occasions` table is empty.
   - If empty, inserts the two default occasions.
4. It calls `startCronJobs()` from `src/lib/cron.ts`:
   - Registers two cron schedules (birthday monthly, Christmas weekly in December).
   - Logs "[Cron] Scheduled notification jobs."
5. The server is ready to accept requests.
