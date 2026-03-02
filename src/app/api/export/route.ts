import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { persons, gifts, occasions, giftLinks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const allPersons = db.select().from(persons).orderBy(asc(persons.name)).all();

  let html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Geschenke-Manager — Vollständige Liste</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem; max-width: 900px; margin: 0 auto; color: #1a1a1a; }
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
    .subtitle { color: #666; margin-bottom: 2rem; }
    .person { border: 1px solid #e5e5e5; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .person h2 { font-size: 1.3rem; margin-bottom: 0.25rem; }
    .person .info { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
    .gift { background: #f8f8f8; border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 0.5rem; }
    .gift h3 { font-size: 0.95rem; }
    .gift .meta { font-size: 0.8rem; color: #888; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
    .badge-idea { background: #fef3c7; color: #92400e; }
    .badge-gift { background: #d1fae5; color: #065f46; }
    .badge-purchased { background: #dbeafe; color: #1e40af; }
    a { color: #2563eb; }
    .empty { color: #999; font-style: italic; }
    .generated { text-align: center; color: #999; font-size: 0.8rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <h1>Geschenke-Manager</h1>
  <p class="subtitle">Vollständige Liste — Erstellt am ${new Date().toLocaleDateString("de-DE")}</p>
`;

  for (const person of allPersons) {
    const personGifts = db
      .select({
        id: gifts.id,
        title: gifts.title,
        description: gifts.description,
        link: gifts.link,
        giftDate: gifts.giftDate,
        isIdea: gifts.isIdea,
        isPurchased: gifts.isPurchased,
        occasionName: occasions.name,
      })
      .from(gifts)
      .leftJoin(occasions, eq(gifts.occasionId, occasions.id))
      .where(eq(gifts.personId, person.id))
      .all();

    html += `  <div class="person">
    <h2>${escapeHtml(person.name)}</h2>
    <p class="info">Geburtstag: ${person.birthday}${person.notes ? ` — ${escapeHtml(person.notes)}` : ""}</p>
`;

    if (personGifts.length === 0) {
      html += `    <p class="empty">Keine Geschenke oder Ideen erfasst.</p>\n`;
    } else {
      for (const gift of personGifts) {
        const badges: string[] = [];
        if (gift.isIdea) badges.push('<span class="badge badge-idea">Idee</span>');
        else badges.push('<span class="badge badge-gift">Geschenk</span>');
        if (gift.isPurchased) badges.push('<span class="badge badge-purchased">Gekauft</span>');

        const links = db
          .select()
          .from(giftLinks)
          .where(eq(giftLinks.giftId, gift.id))
          .all();
        const linkUrls = links.length > 0
          ? links.map((l) => l.url)
          : gift.link ? [gift.link] : [];

        const linksHtml = linkUrls
          .map((url) => `<p class="meta"><a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url)}</a></p>`)
          .join("\n      ");

        html += `    <div class="gift">
      <h3>${escapeHtml(gift.title)} ${badges.join(" ")}${gift.occasionName ? ` <span class="meta">— ${escapeHtml(gift.occasionName)}</span>` : ""}</h3>
      ${gift.description ? `<p class="meta">${escapeHtml(gift.description)}</p>` : ""}
      ${linksHtml}
      ${gift.giftDate ? `<p class="meta">Datum: ${gift.giftDate}</p>` : ""}
    </div>\n`;
      }
    }

    html += `  </div>\n`;
  }

  html += `  <p class="generated">Erstellt mit Geschenke-Manager</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "attachment; filename=geschenke-liste.html",
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
