import { db } from "./index";
import { occasions } from "./schema";

export function seedDatabase() {
  const existing = db.select().from(occasions).all();
  if (existing.length === 0) {
    db.insert(occasions)
      .values([
        { name: "Geburtstag", isDefault: true },
        { name: "Weihnachten", isDefault: true },
      ])
      .run();
  }
}
