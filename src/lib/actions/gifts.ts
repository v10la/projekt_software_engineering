"use server";

import { db } from "@/lib/db";
import { gifts, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createGift(formData: FormData) {
  const personId = parseInt(formData.get("personId") as string);
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const link = (formData.get("link") as string) || "";
  const imagePath = (formData.get("imagePath") as string) || "";
  const occasionId = formData.get("occasionId")
    ? parseInt(formData.get("occasionId") as string)
    : null;
  const giftDate = (formData.get("giftDate") as string) || null;
  const isIdea = formData.get("isIdea") === "true";

  if (!title || !personId) {
    return { error: "Title and person are required" };
  }

  const result = db
    .insert(gifts)
    .values({
      personId,
      title,
      description,
      link,
      imagePath,
      occasionId,
      giftDate,
      isIdea,
      isPurchased: false,
    })
    .returning()
    .get();

  revalidatePath(`/persons/${personId}`);
  revalidatePath("/");
  return { success: true, id: result.id };
}

export async function updateGift(id: number, formData: FormData) {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const link = (formData.get("link") as string) || "";
  const imagePath = (formData.get("imagePath") as string) || "";
  const occasionId = formData.get("occasionId")
    ? parseInt(formData.get("occasionId") as string)
    : null;
  const giftDate = (formData.get("giftDate") as string) || null;
  const isIdea = formData.get("isIdea") === "true";
  const isPurchased = formData.get("isPurchased") === "true";

  if (!title) return { error: "Title is required" };

  const gift = db.select().from(gifts).where(eq(gifts.id, id)).get();
  if (!gift) return { error: "Gift not found" };

  db.update(gifts)
    .set({ title, description, link, imagePath, occasionId, giftDate, isIdea, isPurchased })
    .where(eq(gifts.id, id))
    .run();

  revalidatePath(`/persons/${gift.personId}`);
  revalidatePath(`/gifts/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function convertIdeaToGift(
  id: number,
  occasionId: number | null,
  giftDate: string
) {
  const gift = db.select().from(gifts).where(eq(gifts.id, id)).get();
  if (!gift) return { error: "Gift not found" };

  db.update(gifts)
    .set({ isIdea: false, occasionId, giftDate })
    .where(eq(gifts.id, id))
    .run();

  revalidatePath(`/persons/${gift.personId}`);
  revalidatePath("/");
  return { success: true };
}

export async function togglePurchased(id: number) {
  const gift = db.select().from(gifts).where(eq(gifts.id, id)).get();
  if (!gift) return { error: "Gift not found" };

  db.update(gifts)
    .set({ isPurchased: !gift.isPurchased })
    .where(eq(gifts.id, id))
    .run();

  revalidatePath(`/persons/${gift.personId}`);
  revalidatePath(`/gifts/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteGift(id: number) {
  const gift = db.select().from(gifts).where(eq(gifts.id, id)).get();
  if (!gift) return { error: "Gift not found" };

  db.delete(gifts).where(eq(gifts.id, id)).run();
  revalidatePath(`/persons/${gift.personId}`);
  revalidatePath("/");
  return { success: true };
}

export async function getGiftWithTasks(id: number) {
  const gift = db.select().from(gifts).where(eq(gifts.id, id)).get();
  if (!gift) return null;

  const giftTasks = db.select().from(tasks).where(eq(tasks.giftId, id)).all();
  return { ...gift, tasks: giftTasks };
}
