import { GoogleGenAI, Chat } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private chatSession: Chat | null = null;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      console.warn("API_KEY not found in environment variables.");
    }
  }

  /**
   * Initializes a new chat session with a specific system prompt.
   */
  public startChat(systemInstruction: string, examples: string): void {
    if (!this.ai) {
      throw new Error("Gemini API Client not initialized. Missing API Key?");
    }

    const combinedSystemInstruction = `${systemInstruction}\n\n### EXAMPLES OF DESIRED OUTPUT ###\n${examples}\n\n### IMPORTANT ###\nAlways return the response in the style defined above. Do not output conversational filler like 'Here is your thread'. Just output the thread itself.`;

    this.chatSession = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: combinedSystemInstruction,
        temperature: 0.7,
      },
    });
  }

  /**
   * Sends a message to the active chat session.
   */
  public async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) {
      throw new Error("Chat session not started. Call startChat first.");
    }

    try {
      const response = await this.chatSession.sendMessage({
        message: message,
      });

      return response.text || "";
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      throw error;
    }
  }

  public hasActiveSession(): boolean {
    return this.chatSession !== null;
  }
}

// Singleton instance (optional, but keeping it simple for React usage)
export const geminiService = new GeminiService();