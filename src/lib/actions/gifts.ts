"use server";

import { db } from "@/lib/db";
import { gifts, tasks, giftLinks, giftImages, persons } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-utils";

async function verifyPersonOwnership(personId: number): Promise<boolean> {
  const userId = await requireUserId();
  const person = db
    .select()
    .from(persons)
    .where(and(eq(persons.id, personId), eq(persons.userId, userId)))
    .get();
  return !!person;
}

async function verifyGiftOwnership(giftId: number): Promise<{ personId: number } | null> {
  const gift = db.select().from(gifts).where(eq(gifts.id, giftId)).get();
  if (!gift) return null;
  const owned = await verifyPersonOwnership(gift.personId);
  if (!owned) return null;
  return { personId: gift.personId };
}

export async function createGift(formData: FormData) {
  const personId = parseInt(formData.get("personId") as string);
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const occasionId = formData.get("occasionId")
    ? parseInt(formData.get("occasionId") as string)
    : null;
  const giftDate = (formData.get("giftDate") as string) || null;
  const isIdea = formData.get("isIdea") === "true";
  const isPurchased = formData.get("isPurchased") === "true";

  const linksJson = formData.get("links") as string;
  const links: string[] = linksJson ? JSON.parse(linksJson) : [];
  const singleLink = (formData.get("link") as string) || "";
  if (singleLink && !links.includes(singleLink)) links.push(singleLink);

  const imagesJson = formData.get("images") as string;
  const images: string[] = imagesJson ? JSON.parse(imagesJson) : [];
  const singleImage = (formData.get("imagePath") as string) || "";
  if (singleImage && !images.includes(singleImage)) images.push(singleImage);

  if (!title || !personId) {
    return { error: "Title and person are required" };
  }

  if (!(await verifyPersonOwnership(personId))) {
    return { error: "Person not found" };
  }

  const result = db
    .insert(gifts)
    .values({
      personId,
      title,
      description,
      link: links[0] || "",
      imagePath: images[0] || "",
      occasionId,
      giftDate,
      isIdea,
      isPurchased,
    })
    .returning()
    .get();

  for (const url of links.filter(Boolean)) {
    db.insert(giftLinks).values({ giftId: result.id, url }).run();
  }
  for (const imgPath of images.filter(Boolean)) {
    db.insert(giftImages).values({ giftId: result.id, imagePath: imgPath }).run();
  }

  revalidatePath(`/persons/${personId}`);
  revalidatePath("/");
  return { success: true, id: result.id };
}

export async function updateGift(id: number, formData: FormData) {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const occasionId = formData.get("occasionId")
    ? parseInt(formData.get("occasionId") as string)
    : null;
  const giftDate = (formData.get("giftDate") as string) || null;
  const isIdea = formData.get("isIdea") === "true";
  const isPurchased = formData.get("isPurchased") === "true";

  const linksJson = formData.get("links") as string;
  const links: string[] = linksJson ? JSON.parse(linksJson) : [];
  const imagesJson = formData.get("images") as string;
  const images: string[] = imagesJson ? JSON.parse(imagesJson) : [];

  if (!title) return { error: "Title is required" };

  const ownership = await verifyGiftOwnership(id);
  if (!ownership) return { error: "Gift not found" };

  db.update(gifts)
    .set({
      title,
      description,
      link: links[0] || "",
      imagePath: images[0] || "",
      occasionId,
      giftDate,
      isIdea,
      isPurchased,
    })
    .where(eq(gifts.id, id))
    .run();

  db.delete(giftLinks).where(eq(giftLinks.giftId, id)).run();
  for (const url of links.filter(Boolean)) {
    db.insert(giftLinks).values({ giftId: id, url }).run();
  }

  db.delete(giftImages).where(eq(giftImages.giftId, id)).run();
  for (const imgPath of images.filter(Boolean)) {
    db.insert(giftImages).values({ giftId: id, imagePath: imgPath }).run();
  }

  revalidatePath(`/persons/${ownership.personId}`);
  revalidatePath(`/gifts/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function convertIdeaToGift(
  id: number,
  occasionId: number | null,
  giftDate: string | null
) {
  const ownership = await verifyGiftOwnership(id);
  if (!ownership) return { error: "Gift not found" };

  db.update(gifts)
    .set({ isIdea: false, occasionId, giftDate })
    .where(eq(gifts.id, id))
    .run();

  revalidatePath(`/persons/${ownership.personId}`);
  revalidatePath("/");
  return { success: true };
}

export async function togglePurchased(id: number) {
  const ownership = await verifyGiftOwnership(id);
  if (!ownership) return { error: "Gift not found" };

  const gift = db.select().from(gifts).where(eq(gifts.id, id)).get()!;

  db.update(gifts)
    .set({ isPurchased: !gift.isPurchased })
    .where(eq(gifts.id, id))
    .run();

  revalidatePath(`/persons/${ownership.personId}`);
  revalidatePath(`/gifts/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteGift(id: number) {
  const ownership = await verifyGiftOwnership(id);
  if (!ownership) return { error: "Gift not found" };

  db.delete(gifts).where(eq(gifts.id, id)).run();
  revalidatePath(`/persons/${ownership.personId}`);
  revalidatePath("/");
  return { success: true };
}

export async function getGiftWithTasks(id: number) {
  const ownership = await verifyGiftOwnership(id);
  if (!ownership) return null;

  const gift = db.select().from(gifts).where(eq(gifts.id, id)).get()!;
  const giftTasks = db.select().from(tasks).where(eq(tasks.giftId, id)).all();
  const links = db.select().from(giftLinks).where(eq(giftLinks.giftId, id)).all();
  const images = db.select().from(giftImages).where(eq(giftImages.giftId, id)).all();
  return {
    ...gift,
    tasks: giftTasks,
    links: links.map((l) => l.url),
    images: images.map((i) => i.imagePath),
  };
}
