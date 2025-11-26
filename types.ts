export enum StyleType {
  NATURAL = 'NATURAL',
  PROFESSIONAL = 'PROFESSIONAL',
  EDUCATIONAL = 'EDUCATIONAL'
}

export interface TemplateConfig {
  name: string;
  description: string;
  systemPrompt: string;
  examples: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface SavedThread {
  id: string;
  content: string;
  style: StyleType;
  timestamp: number;
}