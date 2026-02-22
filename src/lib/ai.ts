import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface GiftSuggestion {
  title: string;
  description: string;
  estimatedPrice?: string;
}

export async function generateGiftSuggestions(
  personName: string,
  personNotes: string,
  pastGifts: string[],
  existingIdeas: string[]
): Promise<GiftSuggestion[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const prompt = `Du bist ein kreativer Geschenkberater. Basierend auf den folgenden Informationen über eine Person schlage 6 einzigartige und durchdachte Geschenkideen vor.

Person: ${personName}
Notizen zur Person: ${personNotes || "Keine zusätzlichen Notizen"}
Bereits erhaltene Geschenke: ${pastGifts.length > 0 ? pastGifts.join(", ") : "Keine erfasst"}
Bereits geplante Geschenkideen: ${existingIdeas.length > 0 ? existingIdeas.join(", ") : "Keine"}

Bitte schlage 6 Geschenkideen vor, die:
1. Sich von vergangenen Geschenken und bestehenden Ideen unterscheiden
2. Zu den erkennbaren Interessen der Person basierend auf vergangenen Geschenken passen
3. Von kleinem bis mittlerem Budget reichen
4. Kreativ und durchdacht sind

WICHTIG: Alle Vorschläge müssen auf Deutsch sein. Die Felder "title" (Titel) und "description" (Beschreibung) sowie "estimatedPrice" (geschätzter Preis, z.B. "15-25 €") müssen vollständig auf Deutsch formuliert sein.

Antworte im JSON-Format als Array von Objekten mit den Feldern "title", "description" und "estimatedPrice". Antworte ausschließlich mit dem JSON-Array, ohne weiteren Text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content || "[]";
  try {
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}
