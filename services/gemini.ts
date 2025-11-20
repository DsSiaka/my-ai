
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role, Subject } from "../types";
import { SUBJECT_CONFIGS } from "../constants";

// Initialize the client safely. 
// If process is not defined (browser default), use empty string to avoid crash, 
// then validate in the function.
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  images: string[],
  subject: Subject,
  onStream: (text: string) => void
): Promise<string> => {
  
  if (!apiKey) {
    throw new Error("ERREUR CONFIGURATION : Clé API manquante. Vous devez ajouter API_KEY dans vos variables d'environnement.");
  }

  // We create the instance inside the function or check if it exists to ensure we don't crash on load if key is missing
  const ai = new GoogleGenAI({ apiKey });

  // Select model based on task complexity
  let modelName = 'gemini-2.5-flash';
  let thinkingBudget = 0;

  if (subject === Subject.MATH || subject === Subject.SCIENCE || subject === Subject.CODING) {
     modelName = 'gemini-3-pro-preview'; 
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

    const chat = ai.chats.create({
      model: modelName,
      history: contents,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: thinkingBudget > 0 ? { thinkingBudget } : undefined,
      }
    });

    const resultStream = await chat.sendMessageStream({
      message: currentParts
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
    // Pass the actual error message back to the UI
    throw new Error(error.message || "Échec de la génération de la réponse.");
  }
};
