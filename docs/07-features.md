# Feature Documentation

This document maps each application requirement to its technical implementation.

## 1. Person List with Birthdays and Info

**Requirement:** "Es gibt eine Liste von Personen mit Angaben zu Geburtstagen und weiteren Infos zur Person."

**Implementation:**
- **Data model:** `persons` table with `name`, `birthday` (YYYY-MM-DD format), and `notes` fields.
- **List page:** `src/app/persons/page.tsx` — Displays all persons in a responsive card grid. Each card shows the name, birthday, notes preview, and a calculated "days until next birthday" countdown.
- **CRUD operations:** `src/lib/actions/persons.ts` — `createPerson`, `updatePerson`, `deletePerson` Server Actions.
- **Create form:** `src/components/PersonForm.tsx` — Used at `/persons/new` and inline on the person detail page.

## 2. Past Gift Documentation

**Requirement:** "Vergangene Geschenke können zu Personen dokumentiert werden."

**Implementation:**
- **Data model:** `gifts` table with `is_idea = false` for past/actual gifts.
- **Person detail page:** `src/components/PersonDetail.tsx` — Shows all gifts in a tabbed view. The "Gifts" tab filters to `isIdea === false`.
- **Gift fields:** title, description, link, image, occasion, date, purchased status.
- **Gift editing:** `src/app/gifts/[id]/page.tsx` + `src/components/GiftEditForm.tsx` — Full form for editing any gift detail.

## 3. Occasions (Fixed + Custom)

**Requirement:** "Es gibt zwei feste Anlässe für Geschenke (Weihnachten, Geburtstag), weitere Anlässe sollten erstellbar sein."

**Implementation:**
- **Data model:** `occasions` table with `name` and `is_default` flag.
- **Default seeding:** `src/lib/db/migrate.ts` seeds "Geburtstag" and "Weihnachten" with `is_default = 1`. Also seeded at runtime via `src/lib/db/seed.ts` called from `src/instrumentation.ts`.
- **Management page:** `src/app/occasions/page.tsx` + `src/components/OccasionsClient.tsx` — Users can create and delete custom occasions. Default occasions show a "Default" badge and cannot be deleted.
- **Usage:** Occasions appear as a dropdown in the gift edit form and the idea-to-gift conversion form.

## 4. Gift Ideas with Occasion, Status, and Tasks

**Requirement:** "Zu einer Geschenkidee soll hinterlegt werden, für welchen Anlass sie geplant ist und ob das Geschenk bereits besorgt wurde bzw. welche konkreten offenen Aufgaben es noch gibt."

**Implementation:**
- **Data model:**
  - `gifts.occasion_id` — Links to an occasion.
  - `gifts.is_purchased` — Boolean tracking purchase status.
  - `tasks` table — Sub-tasks per gift with `title` and `is_done` fields.
- **UI:** On each gift card in `PersonDetail.tsx`:
  - Occasion shown as a badge.
  - "Purchased" shown as a green badge; toggle via "Purchased"/"Unpurchase" button.
  - Tasks displayed as a checklist with completion counts (e.g., "Tasks 2/3"), checkboxes to toggle, and delete buttons.
  - Inline "Add task" input for quick task creation.

## 5. Combined Past + Future View

**Requirement:** "Zu einer Person können sowohl Geschenke der Vergangenheit als auch Geschenkideen gleichzeitig dargestellt werden."

**Implementation:**
- **PersonDetail.tsx** provides three tabs:
  - **All** — Shows both ideas and gifts together, sorted by `isIdea` then `createdAt`.
  - **Ideas** — Filters to `isIdea === true`.
  - **Gifts** — Filters to `isIdea === false`.
- Each tab shows the count in its label (e.g., "All (5)", "Ideas (3)", "Gifts (2)").
- Gift cards are visually distinguished by badges: "Idea" (secondary badge) vs. "Purchased" (green badge).

## 6. Birthday Notifications

**Requirement:** "Es werden automatische Benachrichtigungen über Geburtstage im nächsten Monat inkl. bereits bekannter Geschenkideen versendet."

**Implementation:**
- **Notification logic:** `src/lib/notifications.ts` — `sendBirthdayReminders()` function.
  - Calculates the next month.
  - Filters persons whose birthday month matches.
  - For each person, loads their gift ideas.
  - Builds an HTML email listing persons, birthdays, and ideas.
- **Scheduling:** `src/lib/cron.ts` — Cron expression `"0 9 1 * *"` fires on the 1st of each month at 9:00 AM.
- **Email delivery:** Via nodemailer using SMTP configuration from environment variables.
- **Manual trigger:** `GET /api/notifications?type=birthday`.

## 7. Christmas Notifications

**Requirement:** "Es werden in der Zeit vor Weihnachten regelmäßig Benachrichtigungen versendet, die den aktuellen Status für die geplanten zu beschenkenden Personen darstellen."

**Implementation:**
- **Notification logic:** `src/lib/notifications.ts` — `sendChristmasStatus()` function.
  - Only runs in December (month check).
  - Loads all persons and their gifts assigned to the "Weihnachten" occasion.
  - Builds an HTML table showing person, gift title, and status (Purchased / Not purchased yet / Idea only).
  - Shows a countdown ("X days until Christmas!").
- **Scheduling:** `src/lib/cron.ts` — Cron expression `"0 9 * 12 1"` fires every Monday in December at 9:00 AM.
- **Manual trigger:** `GET /api/notifications?type=christmas`.
- **Dashboard integration:** The dashboard at `/` shows a Christmas Status card with the countdown and gift list.

## 8. Quick Idea Capture (Text, Links, Images)

**Requirement:** "Ideen zu Geschenken sind leicht und schnell zu Personen speicherbar, in Form von Text, Links und Bildern."

**Implementation:**
- **Quick Add form:** In `PersonDetail.tsx`, the "Quick Add Idea" button toggles a collapsible card with:
  - Title (text, required) — the core idea
  - Link (URL, optional) — a product link or reference
  - Note (text, optional) — additional description
- **Image support:** On the full Gift Edit page (`GiftEditForm.tsx`), there is a file input for images. The image is uploaded to `/api/upload`, stored in `public/uploads/`, and the path is saved in `gifts.image_path`.
- **Minimal friction:** The quick-add form is intentionally simple (3 fields) for fast capture. The full edit page provides image upload and all other fields.

## 9. Idea-to-Gift Conversion

**Requirement:** "Geschenkideen sind einfach zu 'Geschenken' umwandelbar, inkl. Anlass und Datum."

**Implementation:**
- **UI:** Each idea card in `PersonDetail.tsx` has a "Make Gift" button.
- **Conversion flow:**
  1. Clicking "Make Gift" reveals an inline form on the card with:
     - Occasion dropdown (populated from all occasions)
     - Date picker (defaults to today)
  2. Clicking "Convert" calls `convertIdeaToGift(id, occasionId, giftDate)` Server Action.
  3. This updates the database: `SET is_idea = false, occasion_id = ?, gift_date = ?`.
  4. The page refreshes, and the item moves from the "Ideas" tab to the "Gifts" tab.
- **Key design:** The gift row is not deleted and recreated — it is updated in place. All other data (title, description, link, image, tasks) is preserved.

## 10. Shareable Gift Ideas

**Requirement:** "Die Geschenkideen zu ausgewählten Personen sind per Link teilbar."

**Implementation:**
- **Token generation:** `src/lib/actions/share.ts` — `generateShareToken()` creates a UUID v4 token linked to a person. If a token already exists for that person, it is reused.
- **UI trigger:** "Share" button on the Person Detail page. Clicking it generates the token, constructs the full URL, copies it to the clipboard, and displays it in a read-only input field.
- **Public page:** `src/app/share/[token]/page.tsx` — Renders a public, read-only view of the person's gift ideas. No authentication required. Shows person name + list of gifts with descriptions, links, images, and occasion badges.
- **Layout:** The share page uses a special nested layout that hides the sidebar navigation.

## 11. HTML Export

**Requirement:** "Die vollständige Liste ist als HTML darstellbar."

**Implementation:**
- **API route:** `GET /api/export` — Generates a complete, self-contained HTML file.
- **Content:** All persons with their gifts/ideas, including:
  - Person name, birthday, notes
  - Gift title, badges (Idea/Gift/Purchased), occasion, description, links, dates
- **Styling:** Inline CSS for a clean, print-friendly appearance.
- **Delivery:** Returns as an attachment download (`geschenke-liste.html`).
- **Access:** "Export HTML" link in the sidebar navigation.

## 12. AI Gift Suggestions

**Requirement:** "Aus den Angaben zu bereits erfolgten Geschenken und den Geschenkideen sollen automatisch weitere Geschenkideen generiert werden. Aus der Liste generierter Ideen sollen ausgewählte Geschenke einfach in die Liste übernommen werden können."

**Implementation:**
- **AI integration:** `src/lib/ai.ts` — Calls OpenAI's GPT-4o-mini with a structured prompt including the person's name, notes, past gifts, and existing ideas.
- **API endpoint:** `POST /api/suggest` — Takes a `personId`, loads the data, calls the AI, returns suggestions.
- **UI:** "AI Suggestions" button on Person Detail page. Results displayed in a 2-column card grid showing title, description, and estimated price.
- **Adoption:** Each suggestion has an "Add" button. Clicking it calls `createGift` with the suggestion's title and description, creating a new idea. The suggestion is removed from the displayed list.
- **Configuration:** Requires `OPENAI_API_KEY` in `.env.local`.
