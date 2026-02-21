# Server Actions

## What Are Server Actions?

Server Actions are a Next.js feature that allows defining functions on the server (marked with `"use server"`) that can be called directly from Client Components. They replace traditional REST API endpoints for data mutations, eliminating boilerplate HTTP handling code.

When a Client Component calls a Server Action:
1. Next.js serializes the arguments
2. Sends them to the server via an internal POST request
3. Executes the function on the server
4. Returns the result to the client

All Server Actions in this project are located in `src/lib/actions/`.

## Person Actions

**File:** `src/lib/actions/persons.ts`

### `getPersons()`
- **Purpose:** Retrieve all persons, ordered alphabetically by name.
- **Returns:** Array of person objects.
- **Used by:** Persons list page (`/persons`).

### `getPerson(id: number)`
- **Purpose:** Retrieve a single person by ID.
- **Returns:** Person object or `null`.

### `getPersonWithGifts(id: number)`
- **Purpose:** Retrieve a person with all their gifts/ideas and associated tasks. Performs a LEFT JOIN with the `occasions` table to include occasion names, then loads tasks for each gift.
- **Returns:** Person object with a `gifts` array, each gift containing a `tasks` array. Returns `null` if person not found.
- **Used by:** Person detail page (`/persons/[id]`).

### `createPerson(formData: FormData)`
- **Purpose:** Create a new person. Extracts `name`, `birthday`, and `notes` from the FormData.
- **Validation:** Returns `{ error }` if name or birthday is missing.
- **Side effects:** Calls `revalidatePath("/persons")` and `revalidatePath("/")` to refresh cached pages.
- **Returns:** `{ success: true, id: number }` on success.

### `updatePerson(id: number, formData: FormData)`
- **Purpose:** Update an existing person's details.
- **Side effects:** Revalidates the persons list, the person detail page, and the dashboard.
- **Returns:** `{ success: true }` on success.

### `deletePerson(id: number)`
- **Purpose:** Delete a person. Due to `ON DELETE CASCADE`, all their gifts, tasks, and share tokens are also deleted.
- **Side effects:** Revalidates the persons list and dashboard.
- **Returns:** `{ success: true }`.

## Gift Actions

**File:** `src/lib/actions/gifts.ts`

### `createGift(formData: FormData)`
- **Purpose:** Create a new gift or idea. Extracts `personId`, `title`, `description`, `link`, `imagePath`, `occasionId`, `giftDate`, and `isIdea` from the FormData.
- **Behavior:** `isIdea` is parsed from the string `"true"` / `"false"`. New gifts always start with `isPurchased: false`.
- **Validation:** Returns `{ error }` if title or personId is missing.
- **Returns:** `{ success: true, id: number }`.

### `updateGift(id: number, formData: FormData)`
- **Purpose:** Update all fields of an existing gift. Used by the Gift Edit page.
- **Behavior:** First loads the existing gift to get the `personId` for path revalidation.
- **Returns:** `{ success: true }` on success.

### `convertIdeaToGift(id: number, occasionId: number | null, giftDate: string)`
- **Purpose:** Convert an idea into an actual gift. This is a targeted update that sets `isIdea` to `false` and assigns an occasion and date.
- **Technical detail:** This is the key function that enables the "idea-to-gift" conversion. It only updates three fields (`isIdea`, `occasionId`, `giftDate`), keeping all other data intact.
- **Returns:** `{ success: true }` on success.

### `togglePurchased(id: number)`
- **Purpose:** Toggle the `isPurchased` boolean on a gift. Loads the current state, then flips it.
- **Returns:** `{ success: true }` on success.

### `deleteGift(id: number)`
- **Purpose:** Delete a gift. Tasks are automatically deleted via `ON DELETE CASCADE`.
- **Returns:** `{ success: true }`.

### `getGiftWithTasks(id: number)`
- **Purpose:** Load a single gift with its tasks. Used by the Gift Edit page.
- **Returns:** Gift object with a `tasks` array, or `null`.

## Occasion Actions

**File:** `src/lib/actions/occasions.ts`

### `getOccasions()`
- **Purpose:** Retrieve all occasions, ordered alphabetically.
- **Returns:** Array of occasion objects.

### `createOccasion(formData: FormData)`
- **Purpose:** Create a new custom occasion. Always sets `isDefault: false`.
- **Validation:** Returns `{ error }` if name is missing.
- **Returns:** `{ success: true }`.

### `deleteOccasion(id: number)`
- **Purpose:** Delete a custom occasion. Checks if the occasion is a default and prevents deletion if so.
- **Protection:** Default occasions ("Geburtstag", "Weihnachten") cannot be deleted.
- **Returns:** `{ error: "Default occasions cannot be deleted" }` for defaults, otherwise `{ success: true }`.

## Task Actions

**File:** `src/lib/actions/tasks.ts`

### `createTask(giftId: number, title: string)`
- **Purpose:** Add a new sub-task to a gift.
- **Validation:** Returns `{ error }` if title is empty.
- **Side effects:** Revalidates both the person detail page and the gift edit page by looking up the parent gift's `personId`.
- **Returns:** `{ success: true }`.

### `toggleTask(id: number)`
- **Purpose:** Toggle a task's completion status (`isDone`).
- **Behavior:** Loads the task, flips `isDone`, then looks up the parent gift for path revalidation.
- **Returns:** `{ success: true }`.

### `deleteTask(id: number)`
- **Purpose:** Delete a task.
- **Returns:** `{ success: true }`.

## Share Actions

**File:** `src/lib/actions/share.ts`

### `generateShareToken(personId: number)`
- **Purpose:** Generate (or retrieve existing) a unique share token for a person.
- **Behavior:** First checks if a token already exists for this person. If yes, returns the existing token. If no, generates a UUID v4 and stores it.
- **Returns:** `{ token: string }`.
- **Used by:** The "Share" button on the Person Detail page.

### `getSharedData(token: string)`
- **Purpose:** Retrieve the person and their gift ideas for a given share token. Used by the public share page.
- **Behavior:** Looks up the token in `share_tokens`, then loads the person and all their gifts with occasion names via a LEFT JOIN.
- **Returns:** `{ person, ideas }` or `null` if the token is invalid.

## Path Revalidation Pattern

All write actions call `revalidatePath()` to invalidate Next.js's cache for affected routes. This ensures that when a user is redirected after a mutation, they see fresh data. Common paths revalidated:

- `"/"` — Dashboard (stats, birthday list, Christmas status)
- `"/persons"` — Persons list
- `"/persons/${id}"` — Specific person detail page
- `"/gifts/${id}"` — Specific gift edit page
