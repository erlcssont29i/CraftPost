export type StyleType = string;

export const DefaultStyles = {
  NATURAL: 'NATURAL',
  PROFESSIONAL: 'PROFESSIONAL',
  EDUCATIONAL: 'EDUCATIONAL'
} as const;

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
  style: string;
  timestamp: number;
}