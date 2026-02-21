# API Routes

## Overview

API Routes are traditional HTTP endpoints defined in `src/app/api/`. They are used for features where Server Actions are not suitable: file uploads, file downloads, external API integration, and endpoints called by the internal cron scheduler.

## POST `/api/suggest` — AI Gift Suggestions

**File:** `src/app/api/suggest/route.ts`

### Request
```json
{
  "personId": 1
}
```

### Response (success)
```json
{
  "suggestions": [
    {
      "title": "Personalized Cookbook",
      "description": "A custom cookbook with their favorite recipes",
      "estimatedPrice": "25-35 EUR"
    }
  ]
}
```

### Response (error)
```json
{
  "error": "OPENAI_API_KEY is not configured"
}
```

### How It Works

1. Receives a `personId` in the JSON body.
2. Loads the person from the database (returns 404 if not found).
3. Loads all gifts for that person from the database.
4. Separates them into past gifts (`isIdea = false`) and current ideas (`isIdea = true`).
5. Calls `generateGiftSuggestions()` from `src/lib/ai.ts`, passing:
   - Person's name
   - Person's notes
   - Array of past gift titles
   - Array of existing idea titles
6. The AI function sends a structured prompt to OpenAI's GPT-4o-mini model.
7. The API parses the JSON response and returns the suggestions.

### AI Implementation (`src/lib/ai.ts`)

- Uses the `openai` npm package.
- Model: `gpt-4o-mini` (cost-effective, fast).
- Temperature: `0.8` (slightly creative responses).
- Max tokens: `1000`.
- The prompt asks for 6 suggestions that avoid duplicates with past gifts and existing ideas.
- The response is expected as a JSON array. The code strips markdown code fences (if present) before parsing.
- Requires `OPENAI_API_KEY` environment variable.

## POST `/api/upload` — Image Upload

**File:** `src/app/api/upload/route.ts`

### Request
- Content-Type: `multipart/form-data`
- Form field: `file` (the image file)

### Response (success)
```json
{
  "path": "/uploads/550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

### How It Works

1. Extracts the file from the multipart form data.
2. Reads the file into a `Buffer`.
3. Generates a unique filename using UUID v4 + the original file extension.
4. Writes the file to `public/uploads/{filename}`.
5. Returns the public URL path (`/uploads/{filename}`).

The returned path is stored in the `image_path` column of the `gifts` table and rendered as an `<img>` tag in the UI. Since files in `public/` are served statically by Next.js, the images are directly accessible via the URL path.

## GET `/api/export` — HTML Export

**File:** `src/app/api/export/route.ts`

### Response
- Content-Type: `text/html; charset=utf-8`
- Content-Disposition: `attachment; filename=geschenke-liste.html`

### How It Works

1. Loads all persons ordered by name.
2. For each person, loads all their gifts with occasion names (via LEFT JOIN).
3. Builds a complete, self-contained HTML document with inline CSS.
4. The HTML includes:
   - Person name, birthday, and notes
   - Each gift with title, badges (Idea/Gift/Purchased), occasion name, description, link, and date
   - Color-coded badges using CSS classes
5. Returns the HTML with a `Content-Disposition: attachment` header, which causes the browser to download it as a file named `geschenke-liste.html`.

All user-provided strings are escaped using an `escapeHtml()` utility function to prevent XSS in the exported file.

## GET `/api/notifications` — Email Notifications

**File:** `src/app/api/notifications/route.ts`

### Query Parameters
- `type=birthday` — Send birthday reminders only
- `type=christmas` — Send Christmas status only
- No `type` parameter — Send both

### Response (example)
```json
{
  "birthday": { "sent": true, "count": 3 },
  "christmas": { "sent": false, "reason": "Not December" }
}
```

### How It Works

This route delegates to two functions in `src/lib/notifications.ts`:

#### `sendBirthdayReminders()`
1. Calculates next month's number (e.g., if current month is February, target is March = "03").
2. Filters all persons whose birthday month matches.
3. For each matching person, loads their gift ideas.
4. Builds an HTML email listing each person, their birthday, and any existing ideas.
5. If SMTP credentials are configured, sends the email via nodemailer.
6. Returns `{ sent: true, count }` or `{ sent: false, reason, html }`.

#### `sendChristmasStatus()`
1. Only runs in December (`getMonth() === 11`). Returns early otherwise.
2. Looks up the "Weihnachten" occasion in the database.
3. For each person, loads gifts assigned to the Christmas occasion.
4. Builds an HTML table showing person, gift title, and status (Purchased / Not purchased yet / Idea only).
5. If SMTP is configured, sends the email. Otherwise returns the HTML in the response.

### Email Configuration

The notification system uses nodemailer with these environment variables:

| Variable | Purpose | Example |
|---|---|---|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | Email username/address | `your-email@gmail.com` |
| `SMTP_PASS` | Email password or app password | `xxxx-xxxx-xxxx-xxxx` |
| `NOTIFICATION_EMAIL` | Recipient email address | `me@example.com` |

If these are not set, notifications still generate the HTML content but skip sending. The HTML is returned in the API response for debugging/testing.
