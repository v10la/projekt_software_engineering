"use server";

import { db } from "@/lib/db";
import { shareTokens, persons, gifts, occasions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

export async function generateShareToken(personId: number) {
  const existing = db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.personId, personId))
    .get();

  if (existing) {
    return { token: existing.token };
  }

  const token = uuidv4();
  db.insert(shareTokens).values({ personId, token }).run();
  revalidatePath(`/persons/${personId}`);
  return { token };
}

export async function getSharedData(token: string) {
  const shareToken = db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.token, token))
    .get();

  if (!shareToken) return null;

  const person = db
    .select()
    .from(persons)
    .where(eq(persons.id, shareToken.personId))
    .get();

  if (!person) return null;

  const ideas = db
    .select({
      id: gifts.id,
      title: gifts.title,
      description: gifts.description,
      link: gifts.link,
      imagePath: gifts.imagePath,
      occasionName: occasions.name,
    })
    .from(gifts)
    .leftJoin(occasions, eq(gifts.occasionId, occasions.id))
    .where(eq(gifts.personId, shareToken.personId))
    .all();

  return { person, ideas };
}
