"use server";

import { db } from "@/lib/db";
import { tasks, gifts, persons } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-utils";

async function verifyGiftOwnership(giftId: number): Promise<{ personId: number } | null> {
  const userId = await requireUserId();
  const gift = db.select().from(gifts).where(eq(gifts.id, giftId)).get();
  if (!gift) return null;
  const person = db
    .select()
    .from(persons)
    .where(and(eq(persons.id, gift.personId), eq(persons.userId, userId)))
    .get();
  if (!person) return null;
  return { personId: gift.personId };
}

export async function createTask(giftId: number, title: string) {
  if (!title) return { error: "Title is required" };

  const ownership = await verifyGiftOwnership(giftId);
  if (!ownership) return { error: "Gift not found" };

  db.insert(tasks).values({ giftId, title, isDone: false }).run();

  revalidatePath(`/persons/${ownership.personId}`);
  revalidatePath(`/gifts/${giftId}`);
  return { success: true };
}

export async function toggleTask(id: number) {
  const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return { error: "Task not found" };

  const ownership = await verifyGiftOwnership(task.giftId);
  if (!ownership) return { error: "Task not found" };

  db.update(tasks)
    .set({ isDone: !task.isDone })
    .where(eq(tasks.id, id))
    .run();

  revalidatePath(`/persons/${ownership.personId}`);
  revalidatePath(`/gifts/${task.giftId}`);
  return { success: true };
}

export async function deleteTask(id: number) {
  const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return { error: "Task not found" };

  const ownership = await verifyGiftOwnership(task.giftId);
  if (!ownership) return { error: "Task not found" };

  db.delete(tasks).where(eq(tasks.id, id)).run();

  revalidatePath(`/persons/${ownership.personId}`);
  revalidatePath(`/gifts/${task.giftId}`);
  return { success: true };
}
