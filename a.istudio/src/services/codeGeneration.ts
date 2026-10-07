import { AIProvider, AIModel, AIResponse, AIConfig } from '../types';
import { callAIProviderNonStreaming } from './aiService';
import { CodeGenerationOptions } from '../types';

// Code generation presets
interface CodePreset {
  name: string;
  description: string;
  promptTemplate: string;
  language: string;
  framework?: string;
}

const CODE_PRESETS: CodePreset[] = [
  {
    name: 'React Component',
    description: 'Generate a React component',
    promptTemplate: `Create a React component that {description}.

Requirements:
- Use TypeScript
- Include proper typing
- Use functional component with hooks
- Add comments explaining the code
- Style with Tailwind CSS classes if applicable

Description: {description}`,
    language: 'TypeScript',
    framework: 'React',
  },
  {
    name: 'Python Function',
    description: 'Generate a Python function',
    promptTemplate: `Write a Python function that {description}.

Requirements:
- Include type hints
- Add docstring
- Handle edge cases
- Include error handling

Description: {description}`,
    language: 'Python',
  },
  {
    name: 'JavaScript Class',
    description: 'Generate a JavaScript class',
    promptTemplate: `Create a JavaScript class for {description}.

Requirements:
- Use ES6+ syntax
- Include proper constructor
- Add methods for common operations
- Include JSDoc comments

Description: {description}`,
    language: 'JavaScript',
  },
  {
    name: 'REST API Endpoint',
    description: 'Generate a REST API endpoint',
    promptTemplate: `Create a REST API endpoint for {description}.

Requirements:
- Use Express.js
- Include proper HTTP methods
- Add request validation
- Include error handling
- Return JSON responses

Description: {description}`,
    language: 'JavaScript',
    framework: 'Express',
  },
  {
    name: 'SQL Query',
    description: 'Generate a SQL query',
    promptTemplate: `Write a SQL query that {description}.

Requirements:
- Use proper SQL syntax
- Include table joins if needed
- Add WHERE clauses for filtering
- Optimize for performance

Description: {description}`,
    language: 'SQL',
  },
  {
    name: 'HTML Page',
    description: 'Generate an HTML page',
    promptTemplate: `Create an HTML page for {description}.

Requirements:
- Semantic HTML5
- Responsive design
- Modern CSS styling
- Accessible markup

Description: {description}`,
    language: 'HTML',
  },
  {
    name: 'React Native Component',
    description: 'Generate a React Native component',
    promptTemplate: `Create a React Native component that {description}.

Requirements:
- Use TypeScript
- Include proper styling with StyleSheet
- Use React Native components (View, Text, etc.)
- Handle platform differences
- Add comments

Description: {description}`,
    language: 'TypeScript',
    framework: 'React Native',
  },
  {
    name: 'Node.js Script',
    description: 'Generate a Node.js script',
    promptTemplate: `Write a Node.js script that {description}.

Requirements:
- Use ES modules (import/export)
- Include proper error handling
- Use async/await for I/O operations
- Add comments

Description: {description}`,
    language: 'JavaScript',
    framework: 'Node.js',
  },
];

// Code languages with their file extensions and syntax highlighting
const CODE_LANGUAGES: Record<string, { extension: string; syntax: string }> = {
  'JavaScript': { extension: '.js', syntax: 'javascript' },
  'TypeScript': { extension: '.ts', syntax: 'typescript' },
  'Python': { extension: '.py', syntax: 'python' },
  'Java': { extension: '.java', syntax: 'java' },
  'C++': { extension: '.cpp', syntax: 'cpp' },
  'C#': { extension: '.cs', syntax: 'csharp' },
  'Go': { extension: '.go', syntax: 'go' },
  'Rust': { extension: '.rs', syntax: 'rust' },
  'Swift': { extension: '.swift', syntax: 'swift' },
  'Kotlin': { extension: '.kt', syntax: 'kotlin' },
  'PHP': { extension: '.php', syntax: 'php' },
  'Ruby': { extension: '.rb', syntax: 'ruby' },
  'SQL': { extension: '.sql', syntax: 'sql' },
  'HTML': { extension: '.html', syntax: 'html' },
  'CSS': { extension: '.css', syntax: 'css' },
  'Bash': { extension: '.sh', syntax: 'bash' },
  'Dockerfile': { extension: '', syntax: 'dockerfile' },
  'YAML': { extension: '.yaml', syntax: 'yaml' },
  'JSON': { extension: '.json', syntax: 'json' },
  'Markdown': { extension: '.md', syntax: 'markdown' },
};

// Frameworks for each language
const FRAMEWORKS: Record<string, string[]> = {
  'JavaScript': ['React', 'Vue', 'Angular', 'Express', 'Next.js', 'NestJS', 'Node.js'],
  'TypeScript': ['React', 'Vue', 'Angular', 'Express', 'Next.js', 'NestJS', 'Node.js'],
  'Python': ['Django', 'Flask', 'FastAPI', 'Pydantic', 'SQLAlchemy'],
  'Java': ['Spring', 'Spring Boot', 'Jakarta EE', 'Micronaut'],
  'C#': ['.NET', 'ASP.NET Core', 'Entity Framework'],
  'Go': ['Gin', 'Echo', 'Fiber'],
  'Rust': ['Actix', 'Rocket', 'Axum'],
  'Swift': ['Vapor', 'Kitura'],
  'Kotlin': ['Spring', 'Ktor', 'Micronaut'],
  'PHP': ['Laravel', 'Symfony', 'CodeIgniter'],
  'Ruby': ['Ruby on Rails', 'Sinatra'],
};

// Generate code using AI
interface GenerateCodeOptions {
  prompt: string;
  language?: string;
  framework?: string;
  provider?: AIProvider;
  model?: AIModel;
  includeComments?: boolean;
  includeTests?: boolean;
  explainCode?: boolean;
}

export async function generateCode(options: GenerateCodeOptions): Promise<AIResponse> {
  const {
    prompt,
    language = 'TypeScript',
    framework,
    provider = 'openai',
    model,
    includeComments = true,
    includeTests = false,
    explainCode = false,
  } = options;

  // Build the system message
  const systemMessage = `You are an expert ${language} developer. Generate clean, well-structured, and production-ready code.`;

  // Build the user message
  let userMessage = `Generate ${language} code for: ${prompt}`;

  if (framework) {
    userMessage += `\n\nFramework: ${framework}`;
  }

  userMessage += `\n\nRequirements:`;
  if (includeComments) {
    userMessage += `\n- Include detailed comments explaining the code`;
  }
  if (includeTests) {
    userMessage += `\n- Generate comprehensive test cases`;
  }
  if (explainCode) {
    userMessage += `\n- Add a section at the end explaining how the code works`;
  }
  userMessage += `\n- Use best practices and modern syntax`;
  userMessage += `\n- Handle edge cases and errors`;

  // Call AI provider
  const response = await callAIProviderNonStreaming({
    provider,
    model: model?.id || 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
  });

  return response;
}

// Generate code from preset
export async function generateCodeFromPreset(
  presetName: string,
  description: string,
  options?: Partial<CodeGenerationOptions>
): Promise<AIResponse> {
  const preset = CODE_PRESETS.find(p => p.name === presetName);
  if (!preset) {
    throw new Error(`Preset not found: ${presetName}`);
  }

  const prompt = preset.promptTemplate.replace('{description}', description);

  return generateCode({
    prompt,
    language: preset.language,
    framework: preset.framework,
    ...options,
  });
}

// Generate unit tests
export async function generateTests(
  code: string,
  language: string,
  framework?: string,
  provider?: AIProvider
): Promise<AIResponse> {
  const systemMessage = `You are an expert ${language} developer. Generate comprehensive unit tests for the provided code.`;

  let userMessage = `Generate unit tests for the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;

  if (framework) {
    userMessage += `\nFramework: ${framework}\n`;
  }

  userMessage += `\nRequirements:\n`;
  userMessage += `- Cover all major functionality\n`;
  userMessage += `- Include edge cases\n`;
  userMessage += `- Use appropriate testing framework\n`;
  userMessage += `- Add descriptive test names\n`;

  const response = await callAIProviderNonStreaming({
    provider: provider || 'openai',
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
  });

  return response;
}

// Explain code
export async function explainCode(
  code: string,
  language: string,
  provider?: AIProvider
): Promise<AIResponse> {
  const systemMessage = `You are an expert ${language} developer. Explain the provided code in simple terms.`;

  let userMessage = `Explain the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;

  userMessage += `Explanation requirements:\n`;
  userMessage += `- Start with a high-level overview\n`;
  userMessage += `- Explain each major section\n`;
  userMessage += `- Describe the purpose of key functions/variables\n`;
  userMessage += `- Note any important patterns or techniques\n`;
  userMessage += `- Mention potential improvements\n`;

  const response = await callAIProviderNonStreaming({
    provider: provider || 'openai',
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
  });

  return response;
}

// Optimize code
export async function optimizeCode(
  code: string,
  language: string,
  goal: 'performance' | 'readability' | 'memory' | 'size' = 'performance',
  provider?: AIProvider
): Promise<AIResponse> {
  const systemMessage = `You are an expert ${language} developer. Optimize the provided code for ${goal}.`;

  let userMessage = `Optimize the following ${language} code for ${goal}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;

  userMessage += `Optimization requirements:\n`;
  
  switch (goal) {
    case 'performance':
      userMessage += `- Reduce time complexity\n`;
      userMessage += `- Minimize redundant operations\n`;
      userMessage += `- Optimize loops and conditionals\n`;
      break;
    case 'readability':
      userMessage += `- Improve variable and function names\n`;
      userMessage += `- Add proper spacing and formatting\n`;
      userMessage += `- Break down complex logic\n`;
      break;
    case 'memory':
      userMessage += `- Reduce memory usage\n`;
      userMessage += `- Avoid unnecessary allocations\n`;
      userMessage += `- Use efficient data structures\n`;
      break;
    case 'size':
      userMessage += `- Reduce code size\n`;
      userMessage += `- Remove redundant code\n`;
      userMessage += `- Use concise syntax\n`;
      break;
  }

  userMessage += `- Maintain functionality\n`;
  userMessage += `- Add comments explaining changes\n`;

  const response = await callAIProviderNonStreaming({
    provider: provider || 'openai',
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
  });

  return response;
}

// Debug code
export async function debugCode(
  code: string,
  error: string,
  language: string,
  expectedBehavior: string,
  provider?: AIProvider
): Promise<AIResponse> {
  const systemMessage = `You are an expert ${language} developer. Debug the provided code.`;

  let userMessage = `Debug the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;

  userMessage += `Error message:\n\n\`\`\`\n${error}\n\`\`\`\n\n`;
  userMessage += `Expected behavior:\n${expectedBehavior}\n\n`;

  userMessage += `Debugging requirements:\n`;
  userMessage += `- Identify the root cause of the error\n`;
  userMessage += `- Explain why it's happening\n`;
  userMessage += `- Provide the fix\n`;
  userMessage += `- Suggest how to prevent this in the future\n`;

  const response = await callAIProviderNonStreaming({
    provider: provider || 'openai',
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
  });

  return response;
}

// Get available presets
export function getCodePresets(): CodePreset[] {
  return CODE_PRESETS;
}

// Get available languages
export function getLanguages(): string[] {
  return Object.keys(CODE_LANGUAGES);
}

// Get frameworks for a language
export function getFrameworks(language: string): string[] {
  return FRAMEWORKS[language] || [];
}

// Get language info
export function getLanguageInfo(language: string) {
  return CODE_LANGUAGES[language as keyof typeof CODE_LANGUAGES];
}
