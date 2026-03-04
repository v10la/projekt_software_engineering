import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireUserId(): Promise<number> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");
  return parseInt(session.user.id);
}
