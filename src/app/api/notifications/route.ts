import { NextRequest, NextResponse } from "next/server";
import { sendBirthdayReminders, sendChristmasStatus } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  try {
    if (type === "birthday") {
      const result = await sendBirthdayReminders();
      return NextResponse.json(result);
    } else if (type === "christmas") {
      const result = await sendChristmasStatus();
      return NextResponse.json(result);
    } else {
      const birthday = await sendBirthdayReminders();
      const christmas = await sendChristmasStatus();
      return NextResponse.json({ birthday, christmas });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
