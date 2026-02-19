
import { GoogleGenAI, Type } from "@google/genai";
import { SelectionCriteria } from "../types";
import { STATIC_RULES } from "../data/rules";

export class ApiQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiQuotaError";
  }
}

/**
 * Fetches a rule for the oracle.
 * Now uses a local database of 100 rules to avoid quota issues.
 */
export const fetchCreativeCriteria = async (isGeneralRule: boolean = false): Promise<SelectionCriteria> => {
  // Option 1: Always use local rules to save quota and ensure reliability
  const useLocalOnly = true;

  if (useLocalOnly) {
    // Artificial delay to maintain the "Thinking" suspense
    await new Promise(resolve => setTimeout(resolve, 800));
    const randomIndex = Math.floor(Math.random() * STATIC_RULES.length);
    return STATIC_RULES[randomIndex];
  }

  // Option 2: Fallback logic (Old AI logic kept for reference)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const randomSeed = Math.random().toString(36).substring(7);
    const promptText = `Generate a fun, extremely simple '1-2-3 Not It!' style rule to pick who speaks first.
         The rule should be about being the last person to do a physical action (the loser) or the first person to respond.
         Seed: ${randomSeed}.
         Return as a JSON object with 'title' (short, mystical) and 'description' (VERY SIMPLE plain English).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "description"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as SelectionCriteria;
  } catch (error: any) {
    console.error("Gemini fetch error, falling back to local database:", error);
    const randomIndex = Math.floor(Math.random() * STATIC_RULES.length);
    return STATIC_RULES[randomIndex];
  }
};
