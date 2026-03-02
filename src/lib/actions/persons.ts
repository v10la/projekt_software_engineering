"use server";

import { db } from "@/lib/db";
import { persons, gifts, occasions, tasks, giftLinks, giftImages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPersons() {
  return db.select().from(persons).orderBy(asc(persons.name)).all();
}

export async function getPerson(id: number) {
  const result = db.select().from(persons).where(eq(persons.id, id)).get();
  return result || null;
}

export async function getPersonWithGifts(id: number) {
  const person = await getPerson(id);
  if (!person) return null;

  const personGifts = db
    .select({
      id: gifts.id,
      title: gifts.title,
      description: gifts.description,
      link: gifts.link,
      imagePath: gifts.imagePath,
      giftDate: gifts.giftDate,
      isIdea: gifts.isIdea,
      isPurchased: gifts.isPurchased,
      createdAt: gifts.createdAt,
      occasionId: gifts.occasionId,
      occasionName: occasions.name,
    })
    .from(gifts)
    .leftJoin(occasions, eq(gifts.occasionId, occasions.id))
    .where(eq(gifts.personId, id))
    .orderBy(asc(gifts.isIdea), asc(gifts.createdAt))
    .all();

  const giftsWithTasks = personGifts.map((gift) => {
    const giftTasks = db
      .select()
      .from(tasks)
      .where(eq(tasks.giftId, gift.id))
      .all();
    const links = db
      .select()
      .from(giftLinks)
      .where(eq(giftLinks.giftId, gift.id))
      .all();
    const images = db
      .select()
      .from(giftImages)
      .where(eq(giftImages.giftId, gift.id))
      .all();
    return {
      ...gift,
      tasks: giftTasks,
      links: links.map((l) => l.url),
      images: images.map((i) => i.imagePath),
    };
  });

  return { ...person, gifts: giftsWithTasks };
}

export async function createPerson(formData: FormData) {
  const name = formData.get("name") as string;
  const birthday = formData.get("birthday") as string;
  const notes = (formData.get("notes") as string) || "";

  if (!name || !birthday) {
    return { error: "Name and birthday are required" };
  }

  const result = db
    .insert(persons)
    .values({ name, birthday, notes })
    .returning()
    .get();

  revalidatePath("/persons");
  revalidatePath("/");
  return { success: true, id: result.id };
}

export async function updatePerson(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const birthday = formData.get("birthday") as string;
  const notes = (formData.get("notes") as string) || "";

  if (!name || !birthday) {
    return { error: "Name and birthday are required" };
  }

  db.update(persons)
    .set({ name, birthday, notes })
    .where(eq(persons.id, id))
    .run();

  revalidatePath("/persons");
  revalidatePath(`/persons/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function deletePerson(id: number) {
  db.delete(persons).where(eq(persons.id, id)).run();
  revalidatePath("/persons");
  revalidatePath("/");
  return { success: true };
}
