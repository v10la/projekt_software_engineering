# Pages and Routing

## Overview

The application uses Next.js 14's App Router. Each folder inside `src/app/` corresponds to a URL path. `page.tsx` files define the page rendered at that path. `layout.tsx` files define shared layouts.

## Route Map

| URL Path | File | Type | Description |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Server Component | Dashboard |
| `/persons` | `src/app/persons/page.tsx` | Server Component | Person list |
| `/persons/new` | `src/app/persons/new/page.tsx` | Server Component | Create person form |
| `/persons/[id]` | `src/app/persons/[id]/page.tsx` | Server Component | Person detail (loads data, delegates to Client Component) |
| `/gifts/[id]` | `src/app/gifts/[id]/page.tsx` | Server Component | Gift edit page |
| `/occasions` | `src/app/occasions/page.tsx` | Server Component | Occasion management |
| `/share/[token]` | `src/app/share/[token]/page.tsx` | Server Component | Public shared gift ideas |
| `/api/suggest` | `src/app/api/suggest/route.ts` | API Route | AI suggestions |
| `/api/upload` | `src/app/api/upload/route.ts` | API Route | Image upload |
| `/api/export` | `src/app/api/export/route.ts` | API Route | HTML export |
| `/api/notifications` | `src/app/api/notifications/route.ts` | API Route | Notification triggers |

## Layouts

### Root Layout (`src/app/layout.tsx`)

Wraps all pages. Provides:
- HTML document structure with `<html lang="de">`
- Geist Sans font loading
- Navbar sidebar (fixed, 256px wide on the left)
- Main content area (`ml-64` = 256px left margin to account for sidebar)
- Toaster component for toast notifications
- Page metadata: title "Geschenke-Manager"

### Share Layout (`src/app/share/[token]/layout.tsx`)

A nested layout that applies only to the public share page. It adds a negative left margin (`-ml-64`) to counteract the root layout's sidebar margin, effectively making the share page full-width without the navigation sidebar.

## Page Details

### Dashboard (`/`)

**File:** `src/app/page.tsx` — Server Component

Renders directly on the server with no client-side JavaScript needed for the initial view.

**Data fetching** (three helper functions, called synchronously since better-sqlite3 is synchronous):

1. `getUpcomingBirthdays()`: Filters persons whose birthday month matches the current or next month. Calculates days until their next birthday and their upcoming age. Returns persons with birthdays within 60 days, sorted by proximity.

2. `getChristmasStatus()`: Calculates days until December 25th. Loads all gifts assigned to the "Weihnachten" occasion, grouped by person name and showing purchase status.

3. `getStats()`: Counts total persons, ideas, planned gifts, and purchased gifts.

**UI layout:**
- 4 stat cards in a grid (Persons, Ideas, Planned Gifts, Purchased)
- 2-column grid: Upcoming Birthdays card + Christmas Status card
- Birthdays show urgency badges (red if <= 7 days)
- Christmas shows a countdown badge and gift status list

### Persons List (`/persons`)

**File:** `src/app/persons/page.tsx` — Server Component

- Loads all persons via `getPersons()` Server Action.
- Displays a responsive grid of cards (1/2/3 columns depending on screen width).
- Each card shows: name, birthday, notes preview, and days until next birthday.
- "Add Person" button links to `/persons/new`.
- Each card links to `/persons/[id]`.

### Create Person (`/persons/new`)

**File:** `src/app/persons/new/page.tsx` — Server Component

- Renders the `PersonForm` Client Component without initial data (create mode).

### Person Detail (`/persons/[id]`)

**File:** `src/app/persons/[id]/page.tsx` — Server Component

This is a thin server-side loader. It:
1. Parses the `id` parameter from the URL.
2. Calls `getPersonWithGifts(id)` to load the person + all gifts + tasks.
3. Calls `getOccasions()` to load all occasions (needed for the conversion dropdown).
4. Passes both to the `PersonDetail` Client Component.
5. Returns `notFound()` if the person doesn't exist.

The actual UI is in `PersonDetail.tsx` (see Components documentation).

### Gift Edit (`/gifts/[id]`)

**File:** `src/app/gifts/[id]/page.tsx` — Server Component

1. Loads the gift with its tasks via `getGiftWithTasks(id)`.
2. Loads all occasions.
3. Passes both to the `GiftEditForm` Client Component.

### Occasions (`/occasions`)

**File:** `src/app/occasions/page.tsx` — Server Component

1. Loads all occasions via `getOccasions()`.
2. Passes them to the `OccasionsClient` Client Component.

### Public Share Page (`/share/[token]`)

**File:** `src/app/share/[token]/page.tsx` — Server Component

1. Calls `getSharedData(token)` with the token from the URL.
2. If the token is invalid, returns `notFound()`.
3. Renders a centered, full-width layout (no sidebar) showing:
   - A gift icon header
   - The person's name
   - A list of their gift ideas with descriptions, links, images, and occasion badges
   - A "Powered by Geschenke-Manager" footer

This page is publicly accessible (no authentication). The UUID v4 token provides security through obscurity.

## Dynamic Segments

The `[id]` and `[token]` folder names in the file structure are Next.js dynamic route segments. They capture the URL parameter and pass it to the page component via the `params` prop:

```typescript
// src/app/persons/[id]/page.tsx
export default async function PersonDetailPage({
  params,
}: {
  params: { id: string };  // "id" from the URL
}) {
  const id = parseInt(params.id);
  // ...
}
```

## Static vs. Dynamic Rendering

Next.js automatically determines rendering strategy:

- **Static** (prerendered at build time): Dashboard, Persons list, Persons/new, Occasions — these are marked with `○` in the build output.
- **Dynamic** (rendered on each request): Person detail, Gift edit, Share page, all API routes — these are marked with `ƒ` because they depend on URL parameters or request data.
