import { AIProvider, AIModel, AIConfig, AIResponse, StreamingChunk, LocalConfig } from '../types';
import { DEFAULT_CONFIG, getConfig, AIProviderConfig } from '../utils/storage';
import { PROVIDER_API_URLS } from '../types/models';

interface AIRequestOptions {
  provider: AIProvider;
  model: string;
  messages: { role: string; content: string }[];
  signal?: AbortSignal;
  onStream?: (chunk: StreamingChunk) => void;
  config?: Partial<AIConfig>;
}

// Provider-specific request formatting
const formatOpenAIRequest = (messages: { role: string; content: string }[], config: Partial<AIConfig>, modelId?: string) => ({
  model: modelId || 'gpt-3.5-turbo',
  messages,
  temperature: config.temperature,
  max_tokens: config.maxTokens,
  top_p: config.topP,
  frequency_penalty: config.frequencyPenalty,
  presence_penalty: config.presencePenalty,
  stream: true,
});

const formatAnthropicRequest = (messages: { role: string; content: string }[], config: Partial<AIConfig>, modelId?: string) => {
  // Anthropic uses a different message format
  const anthropicMessages = messages.map(msg => ({
    role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));
  
  return {
    model: modelId || 'claude-3-5-sonnet-20241022',
    messages: anthropicMessages,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    top_p: config.topP,
    stream: true,
  };
};

const formatGoogleRequest = (messages: { role: string; content: string }[], config: Partial<AIConfig>, modelId?: string) => {
  // Google's format is different
  return {
    model: `models/${modelId || 'gemini-1.5-flash'}`,
    messages: messages.map(msg => ({
      role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
      parts: [{ text: msg.content }],
    })),
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      topP: config.topP,
    },
    stream: true,
  };
};

const formatMistralRequest = (messages: { role: string; content: string }[], config: Partial<AIConfig>, modelId?: string) => ({
  model: modelId || 'mistral-large',
  messages,
  temperature: config.temperature,
  max_tokens: config.maxTokens,
  top_p: config.topP,
  stream: true,
});

const formatLocalRequest = (messages: { role: string; content: string }[], config: Partial<AIConfig>, modelId?: string) => ({
  model: modelId || 'llama3',
  messages,
  temperature: config.temperature,
  max_tokens: config.maxTokens,
  top_p: config.topP,
  stream: true,
});

// Response parsing
const parseOpenAIResponse = (chunk: any): StreamingChunk => {
  const choice = chunk.choices?.[0];
  const content = choice?.delta?.content || '';
  const done = chunk.choices?.[0]?.finish_reason !== undefined;
  
  return {
    chunk: content,
    done,
    index: 0,
  };
};

const parseAnthropicResponse = (chunk: any): StreamingChunk => {
  const content = chunk.delta?.text || '';
  const done = chunk.type === 'message_stop';
  
  return {
    chunk: content,
    done,
    index: 0,
  };
};

const parseGoogleResponse = (chunk: any): StreamingChunk => {
  const candidates = chunk.candidates || [];
  const content = candidates[0]?.content?.parts?.[0]?.text || '';
  const done = chunk.candidates?.[0]?.finishReason !== undefined;
  
  return {
    chunk: content,
    done,
    index: 0,
  };
};

const parseMistralResponse = (chunk: any): StreamingChunk => {
  const choice = chunk.choices?.[0];
  const content = choice?.delta?.content || '';
  const done = chunk.choices?.[0]?.finish_reason !== undefined;
  
  return {
    chunk: content,
    done,
    index: 0,
  };
};

const parseLocalResponse = (chunk: any): StreamingChunk => {
  const choice = chunk.choices?.[0];
  const content = choice?.delta?.content || '';
  const done = chunk.choices?.[0]?.finish_reason !== undefined;
  
  return {
    chunk: content,
    done,
    index: 0,
  };
};

// Get provider-specific headers
const getHeaders = async (provider: AIProvider): Promise<Record<string, string>> => {
  const config = await getConfig();
  const providerConfig = config[provider];
  
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  switch (provider) {
    case 'openai':
    case 'mistral':
      if ((providerConfig as AIConfig)?.apiKey) {
        baseHeaders.Authorization = `Bearer ${(providerConfig as AIConfig).apiKey}`;
      }
      break;
    case 'anthropic':
      if ((providerConfig as AIConfig)?.apiKey) {
        baseHeaders['x-api-key'] = (providerConfig as AIConfig).apiKey;
      }
      baseHeaders['anthropic-version'] = '2023-06-01';
      break;
    case 'google':
      if ((providerConfig as AIConfig)?.apiKey) {
        baseHeaders.Authorization = `Bearer ${(providerConfig as AIConfig).apiKey}`;
      }
      break;
    case 'local':
      if ((providerConfig as LocalConfig)?.apiKey) {
        baseHeaders.Authorization = `Bearer ${(providerConfig as LocalConfig).apiKey}`;
      }
      break;
  }
  
  return baseHeaders;
};

// Get provider-specific URL
const getRequestUrl = async (provider: AIProvider, model?: string): Promise<string> => {
  const config = await getConfig();
  const providerConfig = config[provider] as AIConfig | LocalConfig;
  
  if (provider === 'local' && (providerConfig as LocalConfig)?.endpoint) {
    return `${(providerConfig as LocalConfig).endpoint}/chat/completions`;
  }
  
  const baseUrl = PROVIDER_API_URLS[provider];
  
  switch (provider) {
    case 'openai':
      return `${baseUrl}/chat/completions`;
    case 'anthropic':
      return `${baseUrl}/messages`;
    case 'google':
      return `${baseUrl}/models/${model || 'gemini-1.5-flash'}:streamGenerateContent`;
    case 'mistral':
      return `${baseUrl}/chat/completions`;
    case 'local':
      return `${baseUrl}/chat/completions`;
    default:
      return `${baseUrl}/chat/completions`;
  }
};

// Format request based on provider
const formatRequest = (provider: AIProvider, messages: { role: string; content: string }[], config: Partial<AIConfig>, modelId?: string) => {
  switch (provider) {
    case 'openai':
      return formatOpenAIRequest(messages, config, modelId);
    case 'anthropic':
      return formatAnthropicRequest(messages, config, modelId);
    case 'google':
      return formatGoogleRequest(messages, config, modelId);
    case 'mistral':
      return formatMistralRequest(messages, config, modelId);
    case 'local':
      return formatLocalRequest(messages, config, modelId);
    default:
      return formatOpenAIRequest(messages, config, modelId);
  }
};

// Parse response based on provider
const parseResponse = (provider: AIProvider, chunk: any): StreamingChunk => {
  switch (provider) {
    case 'openai':
      return parseOpenAIResponse(chunk);
    case 'anthropic':
      return parseAnthropicResponse(chunk);
    case 'google':
      return parseGoogleResponse(chunk);
    case 'mistral':
      return parseMistralResponse(chunk);
    case 'local':
      return parseLocalResponse(chunk);
    default:
      return parseOpenAIResponse(chunk);
  }
};

// Call AI provider with streaming support
export async function callAIProvider(options: AIRequestOptions): Promise<AIResponse> {
  const { provider, model, messages, signal, onStream, config: customConfig } = options;
  
  const config = await getConfig();
  const providerConfig = config[provider] as AIConfig | LocalConfig;
  const mergedConfig = { ...providerConfig, ...customConfig } as Partial<AIConfig>;
  
  const url = await getRequestUrl(provider, model);
  const headers = await getHeaders(provider);
  const requestBody = formatRequest(provider, messages, mergedConfig, model);
  
  // For Google, we need to handle the model differently
  if (provider === 'google' && model) {
    requestBody.model = `models/${model}`;
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `AI Provider Error: ${response.status} - ${errorData.message || response.statusText}`
      );
    }
    
    if (!response.body) {
      throw new Error('No response body');
    }
    
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';
    let finishReason = '';
    let promptTokens = 0;
    let completionTokens = 0;
    let chunkIndex = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Send final chunk
        if (onStream) {
          onStream({ chunk: '', done: true, index: chunkIndex++ });
        }
        break;
      }
      
      const text = decoder.decode(value);
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        try {
          // Handle different streaming formats
          let chunkData: any;
          
          if (provider === 'anthropic') {
            // Anthropic sends multiple JSON objects separated by newlines
            if (line.startsWith('event: message_delta')) {
              // Parse the data part
              const dataMatch = text.match(/data: (\{.*\})/);
              if (dataMatch) {
                chunkData = JSON.parse(dataMatch[1]);
              }
            } else if (line.startsWith('data:')) {
              chunkData = JSON.parse(line.substring(5));
            }
          } else if (provider === 'google') {
            // Google uses a different format
            try {
              chunkData = JSON.parse(line);
            } catch (e) {
              // Skip parsing errors
              continue;
            }
          } else {
            // OpenAI, Mistral, Local - use SSE format
            if (line.startsWith('data:')) {
              const data = line.substring(5).trim();
              if (data !== '[DONE]') {
                chunkData = JSON.parse(data);
              }
            }
          }
          
          if (chunkData && !chunkData.error) {
            const parsedChunk = parseResponse(provider, chunkData);
            accumulatedContent += parsedChunk.chunk;
            
            // Extract token usage if available
            if (chunkData.usage) {
              promptTokens = chunkData.usage.prompt_tokens || promptTokens;
              completionTokens = chunkData.usage.completion_tokens || completionTokens;
            } else if (chunkData.promptTokenCount) {
              promptTokens = chunkData.promptTokenCount;
            } else if (chunkData.completionTokenCount) {
              completionTokens = chunkData.completionTokenCount;
            }
            
            if (chunkData.choices?.[0]?.finish_reason) {
              finishReason = chunkData.choices[0].finish_reason;
            } else if (chunkData.type === 'message_stop') {
              finishReason = 'stop';
            }
            
            if (onStream && parsedChunk.chunk) {
              onStream(parsedChunk);
            }
          }
        } catch (parseError) {
          console.warn('Error parsing chunk:', parseError);
        }
      }
    }
    
    return {
      content: accumulatedContent,
      model,
      finishReason,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
    
  } catch (error) {
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to call AI provider');
  }
}

// Non-streaming call (for when streaming is not needed)
export async function callAIProviderNonStreaming(options: Omit<AIRequestOptions, 'onStream'>): Promise<AIResponse> {
  const { provider, model, messages, signal, config } = options;
  
  let accumulatedContent = '';
  
  const response = await callAIProvider({
    provider,
    model,
    messages,
    signal,
    config,
    onStream: (chunk) => {
      accumulatedContent += chunk.chunk;
    },
  });
  
  return {
    ...response,
    content: accumulatedContent,
  };
}
