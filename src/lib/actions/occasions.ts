"use server";

import { db } from "@/lib/db";
import { occasions } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getOccasions() {
  return db.select().from(occasions).orderBy(asc(occasions.name)).all();
}

export async function createOccasion(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return { error: "Name is required" };

  db.insert(occasions).values({ name, isDefault: false }).run();
  revalidatePath("/occasions");
  return { success: true };
}

export async function deleteOccasion(id: number) {
  const occasion = db
    .select()
    .from(occasions)
    .where(eq(occasions.id, id))
    .get();
  if (occasion?.isDefault) {
    return { error: "Default occasions cannot be deleted" };
  }

  db.delete(occasions).where(eq(occasions.id, id)).run();
  revalidatePath("/occasions");
  return { success: true };
}
