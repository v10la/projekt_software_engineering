# Geschenke-Manager — Technical Documentation

This documentation explains the complete technical implementation of the Geschenke-Manager application.

## Table of Contents

| Document | Description |
|---|---|
| [01-architecture.md](01-architecture.md) | Technology stack, high-level architecture, data flow, server vs. client components, file structure |
| [02-database.md](02-database.md) | SQLite setup, Drizzle ORM schema, all 5 tables with column details, relationships, cascade behavior, migration system |
| [03-server-actions.md](03-server-actions.md) | All 16 server action functions across 5 modules (persons, gifts, occasions, tasks, share) with parameters, behavior, and return values |
| [04-api-routes.md](04-api-routes.md) | All 4 API routes (AI suggestions, image upload, HTML export, notifications) with request/response formats and implementation details |
| [05-pages-and-routing.md](05-pages-and-routing.md) | All 7 pages, 2 layouts, route map, dynamic segments, static vs. dynamic rendering |
| [06-components.md](06-components.md) | All 5 custom components (Navbar, PersonForm, PersonDetail, GiftEditForm, OccasionsClient) with props, state, and behavior |
| [07-features.md](07-features.md) | All 12 application requirements mapped to their technical implementation |
| [08-setup-and-configuration.md](08-setup-and-configuration.md) | Installation, environment variables, running the app, npm scripts, startup sequence |
| [09-dependencies.md](09-dependencies.md) | All runtime and dev dependencies with versions and purposes |

## Quick Reference

### How to Run

```bash
npm install              # Install dependencies
npm run db:migrate       # Create database and tables
npm run dev              # Start development server at http://localhost:3000
```

### Key Files

| What | Where |
|---|---|
| Database schema | `src/lib/db/schema.ts` |
| Database connection | `src/lib/db/index.ts` |
| Person CRUD | `src/lib/actions/persons.ts` |
| Gift CRUD | `src/lib/actions/gifts.ts` |
| Dashboard page | `src/app/page.tsx` |
| Person detail (main UI) | `src/components/PersonDetail.tsx` |
| AI integration | `src/lib/ai.ts` |
| Email notifications | `src/lib/notifications.ts` |
| Cron scheduling | `src/lib/cron.ts` |
| Environment config | `.env.local` |

### Architecture in One Sentence

A Next.js 14 application using Server Components for data fetching, Client Components for interactivity, Server Actions for mutations, API Routes for file handling and external services, SQLite for storage, and node-cron for scheduled email notifications.
