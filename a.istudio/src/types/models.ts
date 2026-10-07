import { AIProvider, AIModel } from './index';

// Available AI models for each provider
export const AI_MODELS: Record<AIProvider, AIModel[]> = {
  openai: [
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      description: 'Fast, low-cost, smart',
      maxTokens: 16384,
      supportsStreaming: true,
      pricePerToken: 0.00000015,
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      description: 'Flagship model, great for complex tasks',
      maxTokens: 128000,
      supportsStreaming: true,
      pricePerToken: 0.000005,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      description: 'Good balance of speed and capability',
      maxTokens: 16384,
      supportsStreaming: true,
      pricePerToken: 0.0000005,
    },
    {
      id: 'gpt-4-turbo-preview',
      name: 'GPT-4 Turbo Preview',
      provider: 'openai',
      description: 'Preview of next generation model',
      maxTokens: 128000,
      supportsStreaming: true,
      pricePerToken: 0.00001,
    },
  ],
  anthropic: [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      description: 'Fast and intelligent',
      maxTokens: 200000,
      supportsStreaming: true,
      pricePerToken: 0.000003,
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      description: 'Fastest, most compact',
      maxTokens: 200000,
      supportsStreaming: true,
      pricePerToken: 0.00000025,
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      description: 'Most powerful, complex reasoning',
      maxTokens: 200000,
      supportsStreaming: true,
      pricePerToken: 0.000015,
    },
  ],
  google: [
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'google',
      description: 'Fast and efficient',
      maxTokens: 1048576,
      supportsStreaming: true,
      pricePerToken: 0.00000035,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'google',
      description: 'Highly capable, large context',
      maxTokens: 1048576,
      supportsStreaming: true,
      pricePerToken: 0.000007,
    },
  ],
  mistral: [
    {
      id: 'mistral-large',
      name: 'Mistral Large',
      provider: 'mistral',
      description: 'Powerful open-source model',
      maxTokens: 32768,
      supportsStreaming: true,
      pricePerToken: 0.000002,
    },
    {
      id: 'mistral-small',
      name: 'Mistral Small',
      provider: 'mistral',
      description: 'Fast and efficient',
      maxTokens: 32768,
      supportsStreaming: true,
      pricePerToken: 0.00000025,
    },
    {
      id: 'mixtral-8x7b',
      name: 'Mixtral 8x7B',
      provider: 'mistral',
      description: 'Sparse mixture of experts',
      maxTokens: 32768,
      supportsStreaming: true,
      pricePerToken: 0.0000007,
    },
  ],
  local: [
    {
      id: 'local-llm',
      name: 'Local LLM',
      provider: 'local',
      description: 'Run local models (Ollama, LM Studio)',
      maxTokens: 32768,
      supportsStreaming: true,
    },
  ],
};

export const PROVIDER_API_URLS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  mistral: 'https://api.mistral.ai/v1',
  local: 'http://localhost:11434/v1',
};

export const PROVIDER_NAMES: Record<AIProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  mistral: 'Mistral',
  local: 'Local',
};

export const PROVIDER_ICONS: Record<AIProvider, string> = {
  openai: '🤖',
  anthropic: '🦜',
  google: '🔍',
  mistral: '✨',
  local: '💻',
};

// Export types from index
export type { AIProvider, AIModel };
