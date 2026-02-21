# Components

## Overview

Custom components are located in `src/components/`. The `ui/` subdirectory contains shadcn/ui base components (Button, Card, Input, etc.) that are not documented here as they are third-party.

## Navbar (`src/components/Navbar.tsx`)

**Type:** Client Component (`"use client"`)

The sidebar navigation rendered on every page. Fixed position, 256px wide, full height.

**Structure:**
- **Header:** App logo (Gift icon) + "Geschenke Manager" branding, links to dashboard
- **Navigation:** Three links — Dashboard (`/`), Persons (`/persons`), Occasions (`/occasions`)
- **Footer:** Export HTML link (`/api/export`) + version label

**Active route detection:** Uses `usePathname()` from Next.js navigation. The current route is highlighted with the primary background color. For the dashboard, it checks `pathname === "/"`. For other routes, it checks `pathname.startsWith(item.href)`.

**Styling:** Uses the `cn()` utility to conditionally apply Tailwind classes for the active/inactive states.

## PersonForm (`src/components/PersonForm.tsx`)

**Type:** Client Component (`"use client"`)

A form for creating and editing persons. Used on both the "New Person" page and within the Person Detail page (inline edit mode).

**Props:**
- `person?` — Optional. If provided, the form is in edit mode with pre-filled values.

**Fields:**
- Name (text input, required)
- Birthday (date input, required)
- Notes (textarea, optional)

**Behavior:**
- On submit, calls either `createPerson()` or `updatePerson()` Server Action.
- Shows a loading state ("Saving...") while the action is in progress.
- On success, navigates to the appropriate page using `router.push()`.

## PersonDetail (`src/components/PersonDetail.tsx`)

**Type:** Client Component (`"use client"`)

The most complex component in the application. It is the main hub for all person-related interactions.

**Props:**
- `person` — Person data with all gifts and tasks (loaded by the parent Server Component).
- `occasions` — All occasions (used in the conversion dropdown).

**State variables:**
| State | Type | Purpose |
|---|---|---|
| `isEditing` | boolean | Toggle inline person edit mode |
| `showQuickAdd` | boolean | Toggle quick-add idea form visibility |
| `convertingId` | number \| null | Which gift idea is currently showing the conversion form |
| `shareUrl` | string \| null | The generated share URL to display |
| `aiSuggestions` | array | AI-generated gift suggestions |
| `loadingAi` | boolean | Loading state for AI generation |
| `newTaskGiftId` | number \| null | Which gift is currently showing the add-task input |
| `newTaskTitle` | string | Content of the new task input |

**Features provided by this single component:**

1. **Person header:** Displays name, birthday (with age calculation), and notes. Toggleable inline edit form.

2. **Action buttons:** Edit person, Delete person (with confirmation), Share (generates token and copies URL to clipboard).

3. **Share URL display:** After sharing, shows the URL in a read-only input with a Copy button.

4. **Quick Add Idea:** A collapsible form with Title (required), Link (optional), and Note (optional). Submits via `createGift` Server Action with `isIdea: true`.

5. **AI Suggestions:** Calls `/api/suggest` via `fetch()`. Displays results in a 2-column card grid. Each suggestion shows title, description, estimated price, and an "Add" button that creates a new idea via `createGift`.

6. **Gift list with tabs:** Three tabs — All, Ideas, Gifts. Each tab filters the gift list and shows a count in the tab label.

7. **Gift cards** (rendered by `renderGiftCard`): Each gift card displays:
   - Title + badges (Occasion, Purchased, Idea)
   - Description text
   - Clickable link (truncated if > 50 chars)
   - Image thumbnail (32x32 px)
   - Gift date
   - Task list with checkboxes (toggle task completion), task delete buttons, and "Add task" inline input
   - Action buttons column:
     - For ideas: "Make Gift" button that expands a conversion form (occasion select + date input)
     - For gifts: "Purchased" toggle button
     - Edit button (links to `/gifts/[id]`)
     - Delete button (with confirmation dialog)

**Key interaction flows:**

- **Idea-to-Gift conversion:** Clicking "Make Gift" reveals a small form (inline, within the card) with an occasion dropdown and date picker. Submitting calls `convertIdeaToGift()` which sets `isIdea = false`.

- **Task management:** Clicking "Add task" below a gift shows an inline text input. Pressing Enter or clicking "Add" calls `createTask()`. Checking/unchecking a task calls `toggleTask()`. The trash icon calls `deleteTask()`.

- **AI flow:** Button triggers `fetch` to `/api/suggest`, displays loading state, renders results, clicking "Add" on a suggestion calls `createGift` and removes the suggestion from the list.

## GiftEditForm (`src/components/GiftEditForm.tsx`)

**Type:** Client Component (`"use client"`)

A full-page form for editing a gift's details. More comprehensive than the inline editing in PersonDetail.

**Props:**
- `gift` — The gift to edit (with tasks).
- `occasions` — All occasions for the dropdown.

**Fields:**
- Title (text, required)
- Description (textarea)
- Link (URL input)
- Date (date input)
- Occasion (select dropdown)
- Image (file input + preview of current image)
- Is Idea (checkbox)
- Is Purchased (checkbox)

**Image upload:** When a file is selected, it is immediately uploaded to `/api/upload` via `fetch()`. The returned path is stored in local state and included in the form submission.

**Behavior:** On submit, calls `updateGift()` Server Action. On success, navigates back to the person detail page.

## OccasionsClient (`src/components/OccasionsClient.tsx`)

**Type:** Client Component (`"use client"`)

Manages the list of occasions.

**Props:**
- `occasions` — All occasions from the database.

**Features:**
- **Add form:** Text input + "Add" button. Calls `createOccasion()` Server Action.
- **Occasion list:** Each occasion shown as a card with its name. Default occasions have a "Default" badge. Non-default occasions have a delete button.
- **Delete protection:** Calling `deleteOccasion()` on a default occasion returns an error, displayed as a destructive toast.
- **Toast feedback:** Success/error messages shown via the toast notification system.
