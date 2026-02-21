# Database Layer

## Overview

The application uses **SQLite** as its database, accessed through the **better-sqlite3** Node.js driver and **Drizzle ORM** for type-safe queries. The database file is stored at `data/geschenke.db` and is created automatically on first run.

## Connection Setup

**File:** `src/lib/db/index.ts`

```typescript
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
export const db = drizzle(sqlite, { schema });
```

Key configuration:
- **WAL mode** (Write-Ahead Logging): Enables concurrent reads while writing, improving performance.
- **Foreign keys ON**: SQLite does not enforce foreign keys by default. This pragma enables cascade deletes and referential integrity.
- The `db` object is a singleton — it is created once when the module is first imported, then reused across all requests.

## Schema Definition

**File:** `src/lib/db/schema.ts`

The schema is defined using Drizzle ORM's `sqliteTable` function. Each table definition produces both a TypeScript type and the SQL table structure.

### Table: `persons`

Stores people who receive gifts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `name` | TEXT | NOT NULL | Person's full name |
| `birthday` | TEXT | NOT NULL | Birthday in `YYYY-MM-DD` format |
| `notes` | TEXT | DEFAULT `''` | Free-text notes about interests, preferences, sizes |
| `created_at` | TEXT | NOT NULL | ISO 8601 timestamp, set automatically on insert |

### Table: `occasions`

Stores gift-giving occasions (e.g., birthday, Christmas, wedding).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `name` | TEXT | NOT NULL | Occasion name (e.g., "Geburtstag", "Weihnachten") |
| `is_default` | INTEGER | DEFAULT `0` | Boolean flag (1 = default occasion, cannot be deleted) |

Two default occasions are seeded: **Geburtstag** (Birthday) and **Weihnachten** (Christmas).

### Table: `gifts`

Stores both gift ideas and actual gifts. This unified design is a key architectural decision.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `person_id` | INTEGER | NOT NULL, FK -> persons(id) ON DELETE CASCADE | Which person this gift is for |
| `occasion_id` | INTEGER | FK -> occasions(id) ON DELETE SET NULL | Which occasion (nullable) |
| `title` | TEXT | NOT NULL | Gift title/name |
| `description` | TEXT | DEFAULT `''` | Additional description or notes |
| `link` | TEXT | DEFAULT `''` | URL to the product or a reference |
| `image_path` | TEXT | DEFAULT `''` | Path to uploaded image (e.g., `/uploads/abc.jpg`) |
| `gift_date` | TEXT | nullable | Date the gift was/will be given (`YYYY-MM-DD`) |
| `is_idea` | INTEGER | NOT NULL, DEFAULT `1` | Boolean: `1` = idea, `0` = actual gift |
| `is_purchased` | INTEGER | NOT NULL, DEFAULT `0` | Boolean: whether the gift has been purchased |
| `created_at` | TEXT | NOT NULL | ISO 8601 timestamp |

**Design decision — unified table for ideas and gifts:** Instead of separate tables, ideas and gifts share the `gifts` table, distinguished by `is_idea`. Converting an idea to a gift is a single `UPDATE` setting `is_idea = false`, `occasion_id`, and `gift_date`. This avoids data migration between tables and simplifies queries that show both together.

### Table: `tasks`

Stores sub-tasks (to-dos) for a gift (e.g., "buy wrapping paper", "order from Amazon").

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `gift_id` | INTEGER | NOT NULL, FK -> gifts(id) ON DELETE CASCADE | Parent gift |
| `title` | TEXT | NOT NULL | Task description |
| `is_done` | INTEGER | NOT NULL, DEFAULT `0` | Boolean: completion status |

### Table: `share_tokens`

Stores unique tokens for sharing a person's gift ideas via public URL.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `person_id` | INTEGER | NOT NULL, FK -> persons(id) ON DELETE CASCADE | Which person's ideas to share |
| `token` | TEXT | NOT NULL, UNIQUE | UUID v4 token used in the share URL |
| `created_at` | TEXT | NOT NULL | ISO 8601 timestamp |

## Relationships

```
persons  1 --- * gifts       (one person has many gifts/ideas)
persons  1 --- * share_tokens (one person can have share tokens)
occasions 1 --- * gifts      (one occasion can be assigned to many gifts)
gifts    1 --- * tasks       (one gift can have many sub-tasks)
```

These are defined in `schema.ts` using Drizzle's `relations()` function, enabling relational queries.

### Cascade Behavior

| Parent | Child | On Delete |
|---|---|---|
| persons | gifts | CASCADE (deleting a person deletes all their gifts) |
| persons | share_tokens | CASCADE (deleting a person deletes their share tokens) |
| gifts | tasks | CASCADE (deleting a gift deletes its tasks) |
| occasions | gifts | SET NULL (deleting an occasion sets `occasion_id` to NULL on affected gifts) |

## Migration

**File:** `src/lib/db/migrate.ts`

The migration script uses raw SQL (`CREATE TABLE IF NOT EXISTS`) to create all tables idempotently. It also seeds the two default occasions using `INSERT OR IGNORE`. It is run via:

```bash
npm run db:migrate
```

This executes the migration script using `tsx` (TypeScript execution):

```bash
npx tsx src/lib/db/migrate.ts
```

## Runtime Seeding

**File:** `src/lib/db/seed.ts`

On every server startup, `src/instrumentation.ts` calls `seedDatabase()`. This function checks if the `occasions` table is empty and, if so, inserts the two default occasions. This ensures the defaults exist even if the migration script was not run separately.

## How Drizzle ORM Is Used

Drizzle is used in two ways:

1. **Schema definition** (`schema.ts`): Defines table structures and relations in TypeScript, providing compile-time type safety for all queries.

2. **Query building** (in Server Actions and API routes): Instead of writing raw SQL, queries use Drizzle's builder API:

```typescript
// Select all persons ordered by name
db.select().from(persons).orderBy(asc(persons.name)).all();

// Insert a new person and return the result
db.insert(persons).values({ name, birthday, notes }).returning().get();

// Update a person by ID
db.update(persons).set({ name, birthday, notes }).where(eq(persons.id, id)).run();

// Delete a person by ID
db.delete(persons).where(eq(persons.id, id)).run();

// Join gifts with occasions
db.select({ ... })
  .from(gifts)
  .leftJoin(occasions, eq(gifts.occasionId, occasions.id))
  .where(eq(gifts.personId, id))
  .all();
```

Drizzle translates these into optimized SQL queries at runtime. The `.all()` method returns an array, `.get()` returns a single row or `undefined`.
