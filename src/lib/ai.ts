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

  const prompt = `You are a creative gift advisor. Based on the following information about a person, suggest 6 unique and thoughtful gift ideas.

Person: ${personName}
Notes about the person: ${personNotes || "No additional notes"}
Past gifts they received: ${pastGifts.length > 0 ? pastGifts.join(", ") : "None recorded"}
Current gift ideas already planned: ${existingIdeas.length > 0 ? existingIdeas.join(", ") : "None"}

Please suggest 6 gift ideas that:
1. Are different from past gifts and existing ideas
2. Match the person's apparent interests based on past gifts
3. Range from small to medium budget
4. Are creative and thoughtful

Respond in JSON format as an array of objects with "title", "description", and "estimatedPrice" fields. Only respond with the JSON array, no other text.`;

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
