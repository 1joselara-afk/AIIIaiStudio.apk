// AI Provider types
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'mistral' | 'local';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  maxTokens: number;
  supportsStreaming: boolean;
  pricePerToken?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  tokenCount?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIConfig {
  apiKey: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface LocalConfig {
  endpoint: string;
  apiKey?: string;
}

export interface AIProviderConfig {
  openai: AIConfig;
  anthropic: AIConfig;
  google: AIConfig;
  mistral: AIConfig;
  local: LocalConfig;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: 'code' | 'text' | 'analysis' | 'creative' | 'custom';
  variables: string[];
}

export interface CodeGenerationOptions {
  language: string;
  framework?: string;
  includeComments: boolean;
  includeTests: boolean;
  explainCode: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamingChunk {
  chunk: string;
  done: boolean;
  index: number;
}
