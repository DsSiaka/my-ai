import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role, Subject } from "../types";
import { SUBJECT_CONFIGS } from "../constants";

// Initialize the client safely. 
// Using the provided key as fallback if env var is missing
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
  ? process.env.API_KEY 
  : 'AIzaSyAcsqMGL0eOKuzGTy7wqNTdo5BO7Iqtz3Y';

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  images: string[],
  subject: Subject,
  onStream: (text: string) => void
): Promise<string> => {
  
  if (!apiKey) {
    throw new Error("CLÉ API MANQUANTE : Veuillez vérifier la configuration de l'application.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Select model based on task complexity
  let modelName = 'gemini-2.5-flash';

  // System instructions setup
  const systemInstruction = SUBJECT_CONFIGS[subject].systemPrompt;

  try {
    // Prepare content parts for history
    const historyContent = history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [
        ...((msg.images || []).map(img => ({
          inlineData: {
            mimeType: 'image/jpeg',
            data: img
          }
        }))),
        { text: msg.text }
      ]
    }));

    // Create chat instance
    const chat = ai.chats.create({
      model: modelName,
      history: historyContent,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    // Prepare current message parts
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

    // Send message stream
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
    
    let errorMessage = "Échec de la connexion à l'IA.";
    
    if (error.message?.includes('API_KEY') || error.message?.includes('400')) {
      errorMessage = "Erreur de configuration (Clé API).";
    } else if (error.message?.includes('429')) {
      errorMessage = "Trop de requêtes. Veuillez patienter un instant.";
    } else if (error.message) {
       errorMessage = `Erreur: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
};
