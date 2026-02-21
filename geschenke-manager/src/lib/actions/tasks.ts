"use server";

import { db } from "@/lib/db";
import { tasks, gifts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createTask(giftId: number, title: string) {
  if (!title) return { error: "Title is required" };

  db.insert(tasks).values({ giftId, title, isDone: false }).run();

  const gift = db.select().from(gifts).where(eq(gifts.id, giftId)).get();
  if (gift) {
    revalidatePath(`/persons/${gift.personId}`);
    revalidatePath(`/gifts/${giftId}`);
  }
  return { success: true };
}

export async function toggleTask(id: number) {
  const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return { error: "Task not found" };

  db.update(tasks)
    .set({ isDone: !task.isDone })
    .where(eq(tasks.id, id))
    .run();

  const gift = db
    .select()
    .from(gifts)
    .where(eq(gifts.id, task.giftId))
    .get();
  if (gift) {
    revalidatePath(`/persons/${gift.personId}`);
    revalidatePath(`/gifts/${task.giftId}`);
  }
  return { success: true };
}

export async function deleteTask(id: number) {
  const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return { error: "Task not found" };

  db.delete(tasks).where(eq(tasks.id, id)).run();

  const gift = db
    .select()
    .from(gifts)
    .where(eq(gifts.id, task.giftId))
    .get();
  if (gift) {
    revalidatePath(`/persons/${gift.personId}`);
    revalidatePath(`/gifts/${task.giftId}`);
  }
  return { success: true };
}
