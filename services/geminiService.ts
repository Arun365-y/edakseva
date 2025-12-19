
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

    if (category.toLowerCase() === 'invalid') {
      return `Subject: Notification regarding your recent submission\n\nDear Customer,\n\nThank you for reaching out to the Department of Posts. Upon reviewing your recent submission, our automated system has identified that the content does not contain a recognizable grievance or specific service request related to India Post.\n\nAs a result, we are unable to process this request further. If you have a specific complaint regarding a parcel, delay, or service, please provide more details including any relevant tracking numbers.\n\nBest regards,\ne_DakSeva Customer Support Team`;
    }

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

  async getChatResponse(userMessage: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]): Promise<string> {
    const chat = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "You are 'DakMitra', the official AI assistant for India Post. You are helpful, polite, and knowledgeable about Indian postal services (Speed Post, Registered Post, Savings Schemes, PLI, etc.). Answer user queries concisely. If a user asks to track a parcel, explain they can do it via the tracking ID on the dashboard. If they have a complaint, tell them to use the 'Raise Complaint' button. Keep responses under 100 words.",
      },
      history: history,
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "I apologize, but I am unable to process that right now. Please try again or contact our toll-free support.";
  }
}

export const geminiService = new GeminiService();
