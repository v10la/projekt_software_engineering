# Dependencies

## Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 14.2.35 | Full-stack React framework (App Router, server-side rendering, API routes) |
| `react` | ^18 | UI component library |
| `react-dom` | ^18 | React DOM rendering |
| `better-sqlite3` | ^12.6.2 | Node.js SQLite driver — synchronous, high-performance, native C++ addon |
| `drizzle-orm` | ^0.45.1 | Type-safe ORM for building SQL queries with TypeScript |
| `openai` | ^6.22.0 | Official OpenAI Node.js SDK — used for GPT-4o-mini gift suggestions |
| `nodemailer` | ^8.0.1 | Email sending via SMTP — used for birthday and Christmas notifications |
| `node-cron` | ^4.2.1 | In-process cron job scheduler — triggers notification checks on schedule |
| `uuid` | ^13.0.0 | UUID v4 generation — used for share tokens and uploaded file names |
| `lucide-react` | ^0.575.0 | SVG icon library with React components (Gift, Cake, Trash, etc.) |
| `tailwindcss-animate` | ^1.0.7 | Tailwind CSS animation utilities used by shadcn/ui components |
| `class-variance-authority` | ^0.7.1 | Variant management for component styles (used by shadcn/ui) |
| `clsx` | ^2.1.1 | Conditional CSS class name joining utility |
| `tailwind-merge` | ^3.5.0 | Tailwind class deduplication (prevents conflicting classes) |
| `date-fns` | ^4.1.0 | Date utility library (used by the Calendar/DatePicker components) |
| `react-day-picker` | ^9.13.2 | Date picker component (used by shadcn/ui Calendar) |
| `@radix-ui/react-*` | various | Headless UI primitives (used by shadcn/ui): checkbox, dialog, dropdown-menu, label, popover, select, separator, slot, tabs, toast |

## Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5 | TypeScript compiler |
| `@types/node` | ^20 | Node.js type definitions |
| `@types/react` | ^18 | React type definitions |
| `@types/react-dom` | ^18 | React DOM type definitions |
| `@types/better-sqlite3` | ^7.6.13 | Type definitions for better-sqlite3 |
| `@types/node-cron` | ^3.0.11 | Type definitions for node-cron |
| `@types/nodemailer` | ^7.0.11 | Type definitions for nodemailer |
| `@types/uuid` | ^10.0.0 | Type definitions for uuid |
| `eslint` | ^8 | JavaScript/TypeScript linter |
| `eslint-config-next` | 14.2.35 | Next.js ESLint configuration |
| `postcss` | ^8 | CSS transformer (required by Tailwind) |
| `tailwindcss` | ^3.4.1 | Utility-first CSS framework |
| `tsx` | ^4.21.0 | TypeScript execution for Node.js (used to run the migration script) |
| `drizzle-kit` | ^0.31.9 | Drizzle schema migration toolkit (available for future use) |

## Dependency Relationships

```
Application
  |
  |-- Next.js (framework)
  |     |-- React + React DOM (UI)
  |     |-- Tailwind CSS + PostCSS (styling)
  |
  |-- Database
  |     |-- better-sqlite3 (driver)
  |     |-- drizzle-orm (query builder)
  |
  |-- UI Components
  |     |-- shadcn/ui (not an npm package — files copied into src/components/ui/)
  |     |     |-- @radix-ui/* (headless primitives)
  |     |     |-- class-variance-authority (variant styling)
  |     |     |-- clsx + tailwind-merge (class utilities)
  |     |     |-- lucide-react (icons)
  |     |     |-- react-day-picker + date-fns (calendar)
  |     |     |-- tailwindcss-animate (animations)
  |
  |-- External Services
  |     |-- openai (AI suggestions)
  |     |-- nodemailer (email)
  |     |-- node-cron (scheduling)
  |     |-- uuid (token generation)
```

## Note on shadcn/ui

shadcn/ui is **not** a traditional npm dependency. It is a component collection that copies component source files directly into the project (`src/components/ui/`). This means:

- Components are fully owned and customizable (no version lock-in).
- The npm packages listed above (`@radix-ui/*`, `class-variance-authority`, etc.) are the underlying libraries that the copied components depend on.
- New shadcn/ui components can be added with `npx shadcn@latest add <component-name>`.
