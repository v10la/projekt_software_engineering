import { NextResponse } from "next/server";
import { 
  sendBirthdayReminders, 
  sendChristmasStatus, 
  sendOccasionReminders 
} from "@/lib/notifications";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const type = searchParams.get("type");

  // Sicherheits-Check
  if (key !== "1cIyWUjFVna7yw6vOUmZQyoBeXee14YjgeEQ4RVz2JI=") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let result;
    if (type === "christmas") {
      result = await sendChristmasStatus();
    } else if (type === "occasions") {
      result = await sendOccasionReminders();
    } else {
      // Standardmäßig (ohne Typ) werden Geburtstage geprüft
      result = await sendBirthdayReminders();
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Notification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
