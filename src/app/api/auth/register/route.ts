import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json();
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!name || !email || !password) {
    return Response.json(
      { error: "Alle Felder sind erforderlich." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return Response.json(
      { error: "Passwort muss mindestens 6 Zeichen lang sein." },
      { status: 400 }
    );
  }

  const existing = db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existing) {
    return Response.json(
      { error: "Diese E-Mail-Adresse ist bereits registriert." },
      { status: 409 }
    );
  }

  const hash = bcrypt.hashSync(password, 10);
  db.insert(users)
    .values({ name, email, password: hash, role: "user" })
    .run();

  return Response.json({ ok: true });
}
