import OpenAI from "openai";

// Wir nutzen die OpenAI-Bibliothek, leiten sie aber an die Groq-Schnittstelle weiter
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
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
  // Wichtig: Wir prüfen jetzt auf den GROQ_API_KEY
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
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

WICHTIG: Alle Vorschläge müssen auf Deutsch sein. Die Felder "title" (Titel) und "description" (Beschreibung) sowie "estimatedPrice" (geschätzter Preis, z.B. "ca. 20€") müssen ausgefüllt sein.
Antworte im JSON-Format als Array von Objekten mit den Feldern "title", "description" und "estimatedPrice". Antworte ausschließlich mit dem JSON-Array, ohne weiteren Text.`;

  const response = await openai.chat.completions.create({
    // Wir nutzen das extrem starke Llama 3.3 Modell von Groq
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 1000,
    // Groq unterstützt oft auch den response_format: { type: "json_object" } Modus
  });

  const content = response.choices[0]?.message?.content || "[]";
  try {
    // Falls das Modell Markdown-Code-Blocks (```json ...) zurückgibt, entfernen wir diese
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Fehler beim Parsen der KI-Antwort:", content);
    return [];
  }
}
