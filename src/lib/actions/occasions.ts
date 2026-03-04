"use server";

import { db } from "@/lib/db";
import { occasions } from "@/lib/db/schema";
import { eq, asc, or, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-utils";

export async function getOccasions() {
  const userId = await requireUserId();
  return db
    .select()
    .from(occasions)
    .where(or(eq(occasions.userId, userId), isNull(occasions.userId)))
    .orderBy(asc(occasions.name))
    .all();
}

export async function createOccasion(formData: FormData) {
  const userId = await requireUserId();
  const name = formData.get("name") as string;
  if (!name) return { error: "Name is required" };

  db.insert(occasions).values({ name, isDefault: false, userId }).run();
  revalidatePath("/occasions");
  return { success: true };
}

export async function deleteOccasion(id: number) {
  const userId = await requireUserId();
  const occasion = db
    .select()
    .from(occasions)
    .where(eq(occasions.id, id))
    .get();

  if (!occasion) return { error: "Occasion not found" };
  if (occasion.isDefault) {
    return { error: "Default occasions cannot be deleted" };
  }
  if (occasion.userId !== userId) {
    return { error: "Occasion not found" };
  }

  db.delete(occasions).where(eq(occasions.id, id)).run();
  revalidatePath("/occasions");
  return { success: true };
}
