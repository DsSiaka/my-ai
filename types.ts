
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export enum Subject {
  GENERAL = 'Général',
  MATH = 'Maths',
  SCIENCE = 'Sciences',
  HISTORY = 'Histoire',
  LITERATURE = 'Littérature',
  CODING = 'Code',
}

export type FeedbackType = 'like' | 'dislike' | null;

export interface Message {
  id: string;
  role: Role;
  text: string;
  images?: string[]; // Base64 strings
  timestamp: number;
  isError?: boolean;
  feedback?: FeedbackType;
}

export interface ChatSession {
  id: string;
  title: string;
  subject: Subject;
  messages: Message[];
  createdAt: number;
}

export interface GeminiConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  thinkingBudget?: number;
}
