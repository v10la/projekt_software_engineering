import { sendBirthdayReminders } from "@/lib/notifications";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (process.env.CRON_SECRET && key !== process.env.CRON_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const result = await sendBirthdayReminders();
    return Response.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
