import { db } from "@/lib/db";
import { persons, gifts, occasions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendBirthdayReminders() {
  const now = new Date();
  const nextMonth = now.getMonth() + 2; // 1-indexed for comparison
  const targetMonth = nextMonth > 12 ? 1 : nextMonth;
  const monthStr = String(targetMonth).padStart(2, "0");

  const allPersons = db.select().from(persons).all();
  const birthdayPersons = allPersons.filter((p) => {
    const bMonth = p.birthday.split("-")[1];
    return bMonth === monthStr;
  });

  if (birthdayPersons.length === 0) return { sent: false, reason: "No birthdays next month" };

  let html = `<h2>Birthdays Next Month</h2><ul>`;
  for (const person of birthdayPersons) {
    const personGifts = db
      .select({ title: gifts.title, isIdea: gifts.isIdea })
      .from(gifts)
      .where(eq(gifts.personId, person.id))
      .all();

    const ideas = personGifts.filter((g) => g.isIdea).map((g) => g.title);

    html += `<li><strong>${person.name}</strong> — ${person.birthday}`;
    if (ideas.length > 0) {
      html += `<br/>Gift ideas: ${ideas.join(", ")}`;
    } else {
      html += `<br/><em>No gift ideas yet!</em>`;
    }
    html += `</li>`;
  }
  html += `</ul>`;

  if (process.env.SMTP_USER && process.env.NOTIFICATION_EMAIL) {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `Birthday Reminders — ${birthdayPersons.length} birthdays next month`,
      html,
    });
    return { sent: true, count: birthdayPersons.length };
  }

  return { sent: false, reason: "Email not configured", html };
}

export async function sendChristmasStatus() {
  const now = new Date();
  if (now.getMonth() !== 11) {
    return { sent: false, reason: "Not December" };
  }

  const christmasOccasion = db
    .select()
    .from(occasions)
    .where(eq(occasions.name, "Weihnachten"))
    .get();

  if (!christmasOccasion) return { sent: false, reason: "No Christmas occasion found" };

  const allPersons = db.select().from(persons).all();

  let html = `<h2>Christmas Gift Status</h2>`;
  html += `<p>${25 - now.getDate()} days until Christmas!</p>`;
  html += `<table border="1" cellpadding="8" cellspacing="0">`;
  html += `<tr><th>Person</th><th>Gift</th><th>Status</th></tr>`;

  let hasAny = false;
  for (const person of allPersons) {
    const christmasGifts = db
      .select()
      .from(gifts)
      .where(eq(gifts.personId, person.id))
      .all()
      .filter((g) => g.occasionId === christmasOccasion.id);

    for (const gift of christmasGifts) {
      hasAny = true;
      const status = gift.isPurchased
        ? "Purchased"
        : gift.isIdea
          ? "Idea only"
          : "Not purchased yet";
      html += `<tr><td>${person.name}</td><td>${gift.title}</td><td>${status}</td></tr>`;
    }

    if (christmasGifts.length === 0) {
      hasAny = true;
      html += `<tr><td>${person.name}</td><td colspan="2"><em>No Christmas gifts planned</em></td></tr>`;
    }
  }
  html += `</table>`;

  if (!hasAny) return { sent: false, reason: "No persons in database" };

  if (process.env.SMTP_USER && process.env.NOTIFICATION_EMAIL) {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `Christmas Gift Status — ${25 - now.getDate()} days left`,
      html,
    });
    return { sent: true };
  }

  return { sent: false, reason: "Email not configured", html };
}
