import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role, Subject } from "../types";
import { SUBJECT_CONFIGS } from "../constants";

// Initialize the client.
// In a real app, ensure process.env.API_KEY is available. 
// Since we cannot ask the user for input, we assume it is injected.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  images: string[],
  subject: Subject,
  onStream: (text: string) => void
): Promise<string> => {
  
  if (!apiKey) {
    throw new Error("Clé API manquante. Si vous êtes le propriétaire, ajoutez 'API_KEY' dans les variables d'environnement de votre hébergeur (Vercel, Netlify, etc.).");
  }

  // Select model based on task complexity
  // Math and Science benefit from "thinking" models (Gemini 2.5 series with thinking config)
  // or Gemini 3 Pro for reasoning.
  // Per guidelines: Complex Text Tasks (advanced reasoning, coding, math) -> 'gemini-3-pro-preview'
  // Basic Text -> 'gemini-2.5-flash'
  
  let modelName = 'gemini-2.5-flash';
  let thinkingBudget = 0;

  if (subject === Subject.MATH || subject === Subject.SCIENCE || subject === Subject.CODING) {
     // Use Pro for heavy reasoning
     modelName = 'gemini-3-pro-preview'; 
     // Add thinking budget for 2.5 series if we were using it, but for 3-pro-preview we can also use it.
     // Let's stick to the guidelines. Guideline says:
     // "The maximum thinking budget for 2.5 Pro is 32768... gemini-3-pro-preview contents..."
     // Let's try to use a thinking budget to make it smarter for Math.
     thinkingBudget = 1024 * 4; // Moderate thinking
  }

  // System instructions setup
  const systemInstruction = SUBJECT_CONFIGS[subject].systemPrompt;

  try {
    // Prepare content parts
    const contents = history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [
        ...((msg.images || []).map(img => ({
          inlineData: {
            mimeType: 'image/jpeg', // Assuming JPEG for simplicity in this demo
            data: img
          }
        }))),
        { text: msg.text }
      ]
    }));

    // Add the new message
    const currentParts: any[] = [{ text: newMessage }];
    if (images && images.length > 0) {
      images.forEach(img => {
        currentParts.unshift({
          inlineData: {
            mimeType: 'image/jpeg',
            data: img
          }
        });
      });
    }

    // We'll use a fresh chat session style call or just generateContent with history.
    // Given we want to stream, and maintain history manually for the UI state,
    // passing the full history to generateContentStream is often stateless and easier to manage 
    // if we aren't using the persistent Chat object (which holds its own history).
    // However, standard practice with the SDK is often `ai.chats.create`.
    // Let's use `ai.chats.create` but populate history.
    
    const chat = ai.chats.create({
      model: modelName,
      history: contents,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: thinkingBudget > 0 ? { thinkingBudget } : undefined,
      }
    });

    const resultStream = await chat.sendMessageStream({
      message: {
        role: 'user',
        parts: currentParts
      }
    });

    let fullText = '';

    for await (const chunk of resultStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        fullText += c.text;
        onStream(fullText);
      }
    }

    return fullText;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Échec de la génération de la réponse.");
  }
};