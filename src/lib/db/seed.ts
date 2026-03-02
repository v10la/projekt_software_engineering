import { db } from "./index";
import { occasions, users } from "./schema";
import bcrypt from "bcryptjs";

export function seedDatabase() {
  const existingOccasions = db.select().from(occasions).all();
  if (existingOccasions.length === 0) {
    db.insert(occasions)
      .values([
        { name: "Geburtstag", isDefault: true },
        { name: "Weihnachten", isDefault: true },
      ])
      .run();
  }

  const existingUsers = db.select().from(users).all();
  if (existingUsers.length === 0) {
    const hash = bcrypt.hashSync("admin123", 10);
    db.insert(users)
      .values({
        name: "Admin",
        email: "admin@example.com",
        password: hash,
        role: "admin",
      })
      .run();
  }
}
