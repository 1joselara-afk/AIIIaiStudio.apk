import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation, AIProviderConfig, PromptTemplate, AIConfig, LocalConfig } from '../types';

// Re-export types
export type { AIProviderConfig, AIConfig, LocalConfig };

// Storage keys
const STORAGE_KEYS = {
  CONVERSATIONS: '@ai_studio_conversations',
  CONFIG: '@ai_studio_config',
  PROMPTS: '@ai_studio_prompts',
  ACTIVE_CONVERSATION: '@ai_studio_active_conversation',
};

// Default configuration
export const DEFAULT_CONFIG: AIProviderConfig = {
  openai: {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
  anthropic: {
    apiKey: '',
    baseUrl: 'https://api.anthropic.com/v1',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
  google: {
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
  mistral: {
    apiKey: '',
    baseUrl: 'https://api.mistral.ai/v1',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
  local: {
    endpoint: 'http://localhost:11434/v1',
    apiKey: '',
  },
};

export const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Review and suggest improvements for code',
    template: `Please review the following code and provide:
1. Code quality assessment
2. Suggested improvements
3. Potential bugs or issues
4. Performance considerations

Code:\n\n{code}`,
    category: 'code',
    variables: ['code'],
  },
  {
    id: 'generate-function',
    name: 'Generate Function',
    description: 'Generate a function based on description',
    template: `Create a {language} function that {description}.

Requirements:
- Use {framework} if specified
- Include type hints if applicable
- Add comments explaining complex logic
- Include error handling

Description: {description}`,
    category: 'code',
    variables: ['language', 'description', 'framework'],
  },
  {
    id: 'explain-concept',
    name: 'Explain Concept',
    description: 'Explain a technical concept in simple terms',
    template: `Explain the following concept as if I'm 5 years old, then gradually increase complexity:

Concept: {concept}

Start with a simple analogy, then build up to technical details.`,
    category: 'analysis',
    variables: ['concept'],
  },
  {
    id: 'debug-code',
    name: 'Debug Code',
    description: 'Help debug code that is not working',
    template: `I'm having trouble with the following code. Please help me debug:

Code:\n\n{code}

Error message:\n\n{error}

What I expected:\n\n{expected}

Please:
1. Identify the issue
2. Explain why it's happening
3. Provide the fix
4. Suggest how to prevent this in the future`,
    category: 'code',
    variables: ['code', 'error', 'expected'],
  },
  {
    id: 'generate-tests',
    name: 'Generate Tests',
    description: 'Generate test cases for code',
    template: `Generate comprehensive test cases for the following {language} code:

Code:\n\n{code}

Include:
- Unit tests
- Integration tests (if applicable)
- Edge cases
- Mock data where needed

Use {testingFramework} testing framework.`,
    category: 'code',
    variables: ['language', 'code', 'testingFramework'],
  },
  {
    id: 'creative-story',
    name: 'Creative Story',
    description: 'Generate a creative story',
    template: `Write a {genre} story about {subject}.

Style: {style}
Length: {length}

Include rich descriptions, dialogue, and a satisfying conclusion.`,
    category: 'creative',
    variables: ['genre', 'subject', 'style', 'length'],
  },
];

// Conversation storage
export const saveConversation = async (conversation: Conversation): Promise<void> => {
  try {
    const conversations = await getConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.push(conversation);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }
};

export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

export const deleteConversation = async (id: string): Promise<void> => {
  try {
    const conversations = await getConversations();
    const filtered = conversations.filter(c => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

export const setActiveConversation = async (id: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, id);
  } catch (error) {
    console.error('Error setting active conversation:', error);
    throw error;
  }
};

export const getActiveConversationId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
  } catch (error) {
    console.error('Error getting active conversation:', error);
    return null;
  }
};

// Config storage
export const saveConfig = async (config: AIProviderConfig): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
};

export const getConfig = async (): Promise<AIProviderConfig> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
    return data ? JSON.parse(data) : DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error getting config:', error);
    return DEFAULT_CONFIG;
  }
};

// Prompt templates storage
export const savePromptTemplates = async (templates: PromptTemplate[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving prompts:', error);
    throw error;
  }
};

export const getPromptTemplates = async (): Promise<PromptTemplate[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROMPTS);
    return data ? JSON.parse(data) : DEFAULT_PROMPTS;
  } catch (error) {
    console.error('Error getting prompts:', error);
    return DEFAULT_PROMPTS;
  }
};

export const addPromptTemplate = async (template: PromptTemplate): Promise<void> => {
  try {
    const templates = await getPromptTemplates();
    templates.push(template);
    await savePromptTemplates(templates);
  } catch (error) {
    console.error('Error adding prompt:', error);
    throw error;
  }
};

export const deletePromptTemplate = async (id: string): Promise<void> => {
  try {
    const templates = await getPromptTemplates();
    const filtered = templates.filter(t => t.id !== id);
    await savePromptTemplates(filtered);
  } catch (error) {
    console.error('Error deleting prompt:', error);
    throw error;
  }
};

// Clear all data (useful for testing or reset)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};
