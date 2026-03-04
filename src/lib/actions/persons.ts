"use server";

import { db } from "@/lib/db";
import { persons, gifts, occasions, tasks, giftLinks, giftImages } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-utils";

export async function getPersons() {
  const userId = await requireUserId();
  return db.select().from(persons).where(eq(persons.userId, userId)).orderBy(asc(persons.name)).all();
}

export async function getPerson(id: number) {
  const userId = await requireUserId();
  const result = db
    .select()
    .from(persons)
    .where(and(eq(persons.id, id), eq(persons.userId, userId)))
    .get();
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

function validateBirthday(birthday: string): string | null {
  const birthDate = new Date(birthday);
  if (isNaN(birthDate.getTime())) {
    return "Invalid date";
  }
  const today = new Date();
  if (birthDate > today) {
    return "Birthday cannot be in the future";
  }
  const ageDiffMs = today.getTime() - birthDate.getTime();
  const ageDate = new Date(ageDiffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  if (age > 120) {
    return "Age cannot exceed 120 years";
  }
  return null;
}

export async function createPerson(formData: FormData) {
  const userId = await requireUserId();
  const name = formData.get("name") as string;
  const birthday = formData.get("birthday") as string;
  const notes = (formData.get("notes") as string) || "";

  if (!name || !birthday) {
    return { error: "Name and birthday are required" };
  }

  const birthdayError = validateBirthday(birthday);
  if (birthdayError) {
    return { error: birthdayError };
  }

  const result = db
    .insert(persons)
    .values({ name, birthday, notes, userId })
    .returning()
    .get();

  revalidatePath("/persons");
  revalidatePath("/");
  return { success: true, id: result.id };
}

export async function updatePerson(id: number, formData: FormData) {
  const userId = await requireUserId();
  const name = formData.get("name") as string;
  const birthday = formData.get("birthday") as string;
  const notes = (formData.get("notes") as string) || "";

  if (!name || !birthday) {
    return { error: "Name and birthday are required" };
  }

  const birthdayError = validateBirthday(birthday);
  if (birthdayError) {
    return { error: birthdayError };
  }

  const existing = db.select().from(persons).where(and(eq(persons.id, id), eq(persons.userId, userId))).get();
  if (!existing) return { error: "Person not found" };

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
  const userId = await requireUserId();
  const existing = db.select().from(persons).where(and(eq(persons.id, id), eq(persons.userId, userId))).get();
  if (!existing) return { error: "Person not found" };

  db.delete(persons).where(eq(persons.id, id)).run();
  revalidatePath("/persons");
  revalidatePath("/");
  return { success: true };
}
