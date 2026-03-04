import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { persons, gifts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateGiftSuggestions } from "@/lib/ai";
import { requireUserId } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { personId } = await req.json();

    if (!personId) {
      return NextResponse.json(
        { error: "personId ist erforderlich" },
        { status: 400 }
      );
    }

    const person = db
      .select()
      .from(persons)
      .where(and(eq(persons.id, personId), eq(persons.userId, userId)))
      .get();

    if (!person) {
      return NextResponse.json(
        { error: "Person nicht gefunden" },
        { status: 404 }
      );
    }

    const personGifts = db
      .select()
      .from(gifts)
      .where(eq(gifts.personId, personId))
      .all();

    const pastGiftTitles = personGifts
      .filter((g) => !g.isIdea)
      .map((g) => g.title);
    const ideaTitles = personGifts
      .filter((g) => g.isIdea)
      .map((g) => g.title);

    const suggestions = await generateGiftSuggestions(
      person.name,
      person.notes || "",
      pastGiftTitles,
      ideaTitles
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vorschläge konnten nicht generiert werden";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
