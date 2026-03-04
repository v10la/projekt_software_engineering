"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function setUserRole(
  userId: number,
  role: "admin" | "user"
): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Zugriff verweigert. Nur Admins können Rollen ändern." };
  }

  const targetUser = db.select().from(users).where(eq(users.id, userId)).get();
  if (!targetUser) {
    return { error: "Nutzer nicht gefunden." };
  }

  if (role === "user") {
    const adminCount = db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .all().length;
    if (adminCount <= 1) {
      return {
        error: "Der letzte Admin kann nicht zum Nutzer herabgestuft werden.",
      };
    }
  }

  db.update(users).set({ role }).where(eq(users.id, userId)).run();
  revalidatePath("/admin");
  return { success: true };
}
