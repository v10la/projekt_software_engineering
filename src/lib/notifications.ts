import { db } from "@/lib/db";
import { persons, gifts, occasions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

// Erstellt den E-Mail-Versender mit Support für Login vs. Absender-Alias
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailbox.org",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Berechnet präzise die Tage bis zu einem Datum (Format: YYYY-MM-DD oder MM-DD)
function getDaysUntil(dateStr: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  // Wir extrahieren Monat und Tag, um das Jahr flexibel zu handhaben
  const parts = dateStr.split("-");
  const month = parseInt(parts[parts.length - 2]);
  const day = parseInt(parts[parts.length - 1]);
  
  let target = new Date(now.getFullYear(), month - 1, day);
  if (now > target) target.setFullYear(now.getFullYear() + 1);
  
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * 1. GEBURTSTAGE: Erinnert 7, 3, 1 (Morgen) und 0 (Heute) Tage vorher.
 * Inklusive Notizen und Geschenkideen aus der Datenbank.
 */
export async function sendBirthdayReminders() {
  const allUsers = db.select().from(users).all();

  for (const user of allUsers) {
    if (!user.email) continue;
    try {
      const userPersons = db.select().from(persons).where(eq(persons.userId, user.id)).all();
      const upcoming = userPersons.filter((p) => {
        if (!p.birthday) return false;
        const days = getDaysUntil(p.birthday);
        return [7, 3, 1, 0].includes(days) || process.env.DEBUG_EMAIL === "true";
      });

      if (upcoming.length > 0) {
        let html = `<h2>Hallo ${user.name || "Nutzer"},</h2><p>Hier sind anstehende Geburtstage:</p><hr/>`;
        for (const p of upcoming) {
          const days = getDaysUntil(p.birthday);
          let timeText = days === 0 ? "HEUTE! 🎂" : (days === 1 ? "MORGEN" : `in ${days} Tagen`);

          html += `<div style="margin-bottom: 20px;">`;
          html += `<b style="font-size: 1.1em;">${p.name}</b> feiert ${timeText} (${p.birthday})<br/>`;
          if (p.notes) html += `<i style="color: #666;">Deine Notiz: "${p.notes}"</i><br/>`;

          const ideas = db.select().from(gifts).where(eq(gifts.personId, p.id)).all()
                          .filter(g => g.isIdea).map(g => g.title);
          html += ideas.length > 0 ? `<span style="color: #2e7d32;">Ideen: ${ideas.join(", ")}</span>` : `<span style="color: #d32f2f;">⚠️ Keine Geschenkideen hinterlegt!</span>`;
          html += `</div>`;
        }
        await getTransporter().sendMail({
          from: `"Geschenke-Manager" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: user.email,
          subject: `Geburtstags-Erinnerung 🎁`,
          html,
        });
      }
    } catch (err) { console.error(`Fehler bei User ${user.email}:`, err); }
  }
  return { success: true };
}

/**
 * 2. WEIHNACHTEN: Ein detaillierter Status-Check (aktiv im Dezember oder Debug-Mode).
 */
export async function sendChristmasStatus() {
  const now = new Date();
  const daysLeft = getDaysUntil(`${now.getFullYear()}-12-24`);
  if (now.getMonth() !== 11 && process.env.DEBUG_EMAIL !== "true") return { sent: false };

  const allUsers = db.select().from(users).all();
  const christmasOccasion = db.select().from(occasions).where(eq(occasions.name, "Weihnachten")).get();

  for (const user of allUsers) {
    if (!user.email) continue;
    try {
      const userPersons = db.select().from(persons).where(eq(persons.userId, user.id)).all();
      let html = `<h2>Weihnachts-Check</h2><p>Noch genau <b>${daysLeft} Tage</b> bis Heiligabend!</p>`;
      html += `<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">`;
      html += `<tr style="background: #eee;"><th>Person</th><th>Geschenk-Status</th></tr>`;
      for (const p of userPersons) {
        const cGifts = db.select().from(gifts).where(eq(gifts.personId, p.id)).all()
                         .filter(g => christmasOccasion && g.occasionId === christmasOccasion.id);
        if (cGifts.length === 0) {
          html += `<tr><td>${p.name}</td><td><em>Keine Geschenke geplant</em></td></tr>`;
        } else {
          for (const g of cGifts) {
            html += `<tr><td>${p.name}</td><td>${g.isPurchased ? '✅' : '❌'} ${g.title}</td></tr>`;
          }
        }
      }
      html += `</table>`;
      await getTransporter().sendMail({
        from: `"Geschenke-Manager" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: user.email,
        subject: `Weihnachts-Check: Noch ${daysLeft} Tage!`,
        html,
      });
    } catch (err) { console.error(err); }
  }
  return { success: true };
}

/**
 * 3. ANDERE ANLÄSSE: Erinnert an alle manuell angelegten Events (Hochzeitstage, etc.).
 */
export async function sendOccasionReminders() {
  const allUsers = db.select().from(users).all();
  const allOccasions = db.select().from(occasions).all();

  for (const user of allUsers) {
    if (!user.email) continue;
    try {
      const userPersons = db.select().from(persons).where(eq(persons.userId, user.id)).all();
      let reminders = [];
      for (const p of userPersons) {
        const uGifts = db.select().from(gifts).where(eq(gifts.personId, p.id)).all();
        for (const g of uGifts) {
          const occ = allOccasions.find(o => o.id === g.occasionId);
          if (!occ || !occ.date || occ.name === "Weihnachten") continue;
          const days = getDaysUntil(occ.date);
          if ([14, 7, 3, 1, 0].includes(days) || process.env.DEBUG_EMAIL === "true") {
            reminders.push({ person: p.name, occasion: occ.name, days, gift: g.title, done: g.isPurchased });
          }
        }
      }
      if (reminders.length > 0) {
        let html = `<h2>Anstehende Anlässe</h2><ul>`;
        for (const r of reminders) {
          let t = r.days === 0 ? "HEUTE!" : (r.days === 1 ? "MORGEN" : `in ${r.days} Tagen`);
          html += `<li style="margin-bottom: 10px;"><b>${r.occasion}</b> für ${r.person}: ${r.gift} ${r.done ? '✅' : '❌'} (${t})</li>`;
        }
        html += `</ul>`;
        await getTransporter().sendMail({
          from: `"Geschenke-Manager" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: user.email,
          subject: `Wichtige Erinnerung: ${reminders.length} Termine!`,
          html,
        });
      }
    } catch (err) { console.error(err); }
  }
  return { success: true };
}
