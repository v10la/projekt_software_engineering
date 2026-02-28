import { sendBirthdayReminders } from "../../../../lib/notifications";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  if (
    process.env.CRON_SECRET &&
    searchParams.get("key") !== process.env.CRON_SECRET
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const result = await sendBirthdayReminders();
    return Response.json({ ok: true, result });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}