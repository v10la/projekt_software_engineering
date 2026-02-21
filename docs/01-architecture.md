# Architecture Overview

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack React framework; serves both frontend pages and backend API routes in a single project |
| Language | TypeScript | Static typing for all code (frontend and backend) |
| Database | SQLite via `better-sqlite3` | File-based relational database; zero-config, no separate server needed |
| ORM | Drizzle ORM | Type-safe database queries with schema definitions in TypeScript |
| UI Components | shadcn/ui + Radix UI | Pre-built, accessible React components (buttons, dialogs, tabs, etc.) |
| Styling | Tailwind CSS | Utility-first CSS framework with custom CSS variables for theming |
| Icons | Lucide React | SVG icon library used throughout the UI |
| Email | nodemailer | SMTP email sending for notifications |
| Scheduling | node-cron | In-process cron jobs for automated notifications |
| AI | OpenAI API (gpt-4o-mini) | Generating gift suggestions based on past gifts |
| Image Upload | Local filesystem (`public/uploads/`) | Stores uploaded images as static files |

## Why This Stack?

The application is designed as a **single-user personal tool**. This justifies several simplicity choices:

1. **SQLite instead of PostgreSQL/MySQL**: No need for a database server. The entire database is a single file (`data/geschenke.db`).
2. **Next.js API routes instead of a separate backend**: One codebase, one deployment, one `npm run dev`.
3. **Server Actions instead of REST endpoints for mutations**: Next.js Server Actions allow calling server-side functions directly from React components, eliminating boilerplate API code for CRUD operations.
4. **Local file uploads instead of cloud storage**: Images are saved to `public/uploads/` and served as static files by Next.js.

## High-Level Architecture

```
Browser (React)
    |
    |-- Pages (Server Components) -----> Database (SQLite)
    |       rendered on the server,
    |       fetch data directly via
    |       Drizzle ORM queries
    |
    |-- Client Components --------------> Server Actions
    |       run in the browser,               |
    |       call server actions for           v
    |       mutations (create, update,    Database (SQLite)
    |       delete)
    |
    |-- Client Components --------------> API Routes (fetch())
    |       for specific features:            |
    |       - AI suggestions                  v
    |       - Image upload              External Services
    |       - HTML export               (OpenAI, SMTP)
    |
    |-- Cron Jobs (node-cron) ----------> API Routes
            scheduled tasks that              |
            trigger notification              v
            endpoints internally        Email (nodemailer)
```

### Server Components vs. Client Components

Next.js 14 uses the App Router with React Server Components by default:

- **Server Components** (default): Run on the server only. They can directly access the database. Files like `src/app/page.tsx` (Dashboard), `src/app/persons/page.tsx` (Person List), and `src/app/persons/[id]/page.tsx` (Person Detail loader) are Server Components. They fetch data using Drizzle ORM and pass it as props to Client Components.

- **Client Components** (marked with `"use client"`): Run in the browser. They handle interactivity (button clicks, form submissions, state management). Files like `src/components/PersonDetail.tsx`, `src/components/PersonForm.tsx`, and `src/components/Navbar.tsx` are Client Components. They call Server Actions for data mutations.

### Server Actions

Server Actions are functions marked with `"use server"` that run on the server but can be called directly from Client Components. They are used for all CRUD operations:

- `src/lib/actions/persons.ts` — Person CRUD
- `src/lib/actions/gifts.ts` — Gift/Idea CRUD
- `src/lib/actions/occasions.ts` — Occasion CRUD
- `src/lib/actions/tasks.ts` — Task CRUD
- `src/lib/actions/share.ts` — Share token management

When a Server Action modifies data, it calls `revalidatePath()` to tell Next.js to re-render affected pages with fresh data.

### API Routes

API Routes are traditional HTTP endpoints used for features that require fetch()-based communication:

| Route | Method | Purpose |
|---|---|---|
| `/api/suggest` | POST | AI gift suggestion generation |
| `/api/upload` | POST | Image file upload |
| `/api/export` | GET | HTML export download |
| `/api/notifications` | GET | Trigger email notifications |

## Data Flow Examples

### Creating a Person

1. User fills out the form in `PersonForm.tsx` (Client Component)
2. On submit, the form calls the `createPerson` Server Action
3. The Server Action inserts a row into the `persons` table via Drizzle ORM
4. The Server Action calls `revalidatePath("/persons")` and `revalidatePath("/")`
5. Next.js re-renders the persons list and dashboard with fresh data

### Getting AI Suggestions

1. User clicks "AI Suggestions" in `PersonDetail.tsx` (Client Component)
2. The component calls `fetch("/api/suggest", { method: "POST", body: { personId } })`
3. The API route loads the person's past gifts and ideas from the database
4. It sends a prompt to OpenAI's GPT-4o-mini with the person's data
5. The API route returns the suggestions as JSON
6. The Client Component displays them in a card grid
7. User clicks "Add" on a suggestion, which calls the `createGift` Server Action

### Automated Notifications

1. On server startup, `src/instrumentation.ts` calls `startCronJobs()`
2. `node-cron` schedules two jobs (monthly birthday, weekly Christmas in December)
3. When a cron fires, it calls `fetch("/api/notifications?type=birthday")` internally
4. The API route runs the notification logic, queries the database, builds an HTML email
5. If SMTP is configured, it sends the email via `nodemailer`

## File Structure

```
src/
  app/                          # Next.js App Router (pages + API routes)
    layout.tsx                  # Root layout (Navbar + Toaster wrapper)
    page.tsx                    # Dashboard page (Server Component)
    globals.css                 # Tailwind CSS + custom theme variables
    persons/                    # Person-related pages
    gifts/                      # Gift edit page
    occasions/                  # Occasions management page
    share/                      # Public share page
    api/                        # API route handlers
  components/                   # React components
    ui/                         # shadcn/ui base components
    Navbar.tsx                  # Sidebar navigation
    PersonForm.tsx              # Person create/edit form
    PersonDetail.tsx            # Person detail view (main feature hub)
    GiftEditForm.tsx            # Gift edit form
    OccasionsClient.tsx         # Occasions list and creation
  hooks/
    use-toast.ts                # Toast notification hook (shadcn)
  lib/
    db/                         # Database layer
      schema.ts                 # Drizzle ORM table definitions
      index.ts                  # Database connection singleton
      migrate.ts                # SQL migration script
      seed.ts                   # Seed default occasions
    actions/                    # Server Actions (data mutations)
    ai.ts                       # OpenAI integration
    notifications.ts            # Email notification logic
    cron.ts                     # Cron job scheduler
    utils.ts                    # Tailwind class merging utility
  instrumentation.ts            # Next.js startup hook (seed DB + start cron)
data/                           # SQLite database file (auto-created)
public/uploads/                 # Uploaded images
```
