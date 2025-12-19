
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { AnalysisResult } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeComplaint(text: string): Promise<AnalysisResult> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: text,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            priority: { type: Type.STRING },
            response: { type: Type.STRING },
            requiresReview: { type: Type.BOOLEAN },
            confidenceScore: { type: Type.NUMBER },
          },
          required: ["category", "sentiment", "priority", "response", "requiresReview", "confidenceScore"]
        }
      },
    });

    try {
      const result = JSON.parse(response.text || '{}');
      return result as AnalysisResult;
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      throw new Error("Invalid response from analysis engine.");
    }
  }

  async generateEmailResponse(complaint: string, category: string, sentiment: string, priority: string, language: string = 'en'): Promise<string> {
    const langNames: Record<string, string> = { en: 'English', hi: 'Hindi', te: 'Telugu' };
    const targetLang = langNames[language] || 'English';

    const prompt = `Write a polite email response to a postal customer based on complaint details below.
The entire response MUST be written in ${targetLang}.

Complaint:
${complaint}

Detected category: ${category}
Sentiment: ${sentiment}
Priority: ${priority}

Keep tone:
- empathetic
- professional
- short (80–120 words)
- include a subject line
- use "e_DakSeva Customer Support Team" as the signature in ${targetLang}`;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || '';
  }
}

export const geminiService = new GeminiService();
