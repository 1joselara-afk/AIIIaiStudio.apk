import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRef } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AIProvider, AIModel, AI_MODELS, PROVIDER_NAMES, PROVIDER_ICONS } from '../../types/models';
import { useAIChat } from '../../hooks/useAIChat';
import { getConfig } from '../../utils/storage';
import { ChatMessage } from '../../types';

// Sample initial model
const INITIAL_PROVIDER: AIProvider = 'openai';
const INITIAL_MODEL: AIModel = AI_MODELS[INITIAL_PROVIDER][0];

// Message bubble component
const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';
  
  return (
    <View style={[
      styles.messageContainer,
      isUser ? styles.userMessage : styles.assistantMessage
    ]}>
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.assistantBubble
      ]}>
        {message.role !== 'user' && (
          <View style={styles.messageHeader}>
            <Text style={styles.modelName}>{PROVIDER_ICONS[message.model?.split('-')[0] as AIProvider || 'openai']} {message.model || INITIAL_MODEL.name}</Text>
          </View>
        )}
        <ScrollView contentContainerStyle={styles.messageContent}>
          <Text style={isUser ? styles.userText : styles.assistantText}>
            {message.content}
          </Text>
        </ScrollView>
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {message.tokenCount && (
            <Text style={styles.tokenCount}>{message.tokenCount} tokens</Text>
          )}
        </View>
      </View>
    </View>
  );
};

// Input area component
const InputArea = ({
  input,
  setInput,
  onSend,
  isLoading,
  onNewChat,
}: {
  input: string;
  setInput: (text: string) => void;
  onSend: () => void;
  isLoading: boolean;
  onNewChat: () => void;
}) => {
  const [showPromptSuggestions, setShowPromptSuggestions] = useState(false);
  
  const promptSuggestions = [
    "Explain quantum computing",
    "Write a Python function to sort an array",
    "What's the best way to learn React Native?",
    "Generate a TypeScript interface for a user",
    "Debug this JavaScript code: ...",
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.inputContainer}
    >
      <View style={styles.inputWrapper}>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={onNewChat}
          disabled={isLoading}
        >
          <MaterialIcons name="add" size={24} color="#00ff88" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor="#666"
          multiline
          editable={!isLoading}
          onFocus={() => setShowPromptSuggestions(false)}
        />
        
        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={onSend}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      
      {showPromptSuggestions && (
        <ScrollView
          horizontal
          style={styles.promptSuggestions}
          showsHorizontalScrollIndicator={false}
        >
          {promptSuggestions.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promptSuggestion}
              onPress={() => {
                setInput(prompt);
                setShowPromptSuggestions(false);
              }}
            >
              <Text style={styles.promptSuggestionText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

// Model selector component
const ModelSelector = ({
  provider,
  setProvider,
  model,
  setModel,
}: {
  provider: AIProvider;
  setProvider: (p: AIProvider) => void;
  model: AIModel;
  setModel: (m: AIModel) => void;
}) => {
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  
  const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'mistral', 'local'];
  const models = AI_MODELS[provider];

  return (
    <View style={styles.modelSelector}>
      <TouchableOpacity
        style={styles.modelButton}
        onPress={() => setShowProviderMenu(!showProviderMenu)}
      >
        <Text style={styles.modelButtonText}>
          {PROVIDER_ICONS[provider]} {PROVIDER_NAMES[provider]}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={20} color="#888" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.modelButton}
        onPress={() => setShowModelMenu(!showModelMenu)}
      >
        <Text style={styles.modelButtonText} numberOfLines={1}>
          {model.name}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={20} color="#888" />
      </TouchableOpacity>
      
      {showProviderMenu && (
        <View style={styles.menu}>
          {providers.map(p => (
            <TouchableOpacity
              key={p}
              style={styles.menuItem}
              onPress={() => {
                setProvider(p);
                setModel(AI_MODELS[p][0]);
                setShowProviderMenu(false);
              }}
            >
              <Text style={styles.menuItemText}>
                {PROVIDER_ICONS[p]} {PROVIDER_NAMES[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {showModelMenu && (
        <View style={styles.menu}>
          {models.map(m => (
            <TouchableOpacity
              key={m.id}
              style={styles.menuItem}
              onPress={() => {
                setModel(m);
                setShowModelMenu(false);
              }}
            >
              <Text style={styles.menuItemText} numberOfLines={1}>
                {m.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Main chat screen component
export default function ChatScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<AIProvider>(INITIAL_PROVIDER);
  const [model, setModel] = useState<AIModel>(INITIAL_MODEL);
  
  const {
    messages,
    isLoading,
    error,
    conversationId,
    conversations,
    activeConversation,
    sendMessage,
    createNewConversation,
    switchConversation,
    deleteConversation,
    regenerateLastMessage,
    clearError,
  } = useAIChat({ provider, model });

  // Initialize
  useEffect(() => {
    createNewConversation();
  }, []);

  // Auto-scroll to bottom when messages change
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    
    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }, [input, isLoading, sendMessage]);

  // Handle new chat
  const handleNewChat = useCallback(async () => {
    await createNewConversation();
    setInput('');
  }, [createNewConversation]);

  // Handle regenerate
  const handleRegenerate = useCallback(async () => {
    await regenerateLastMessage();
  }, [regenerateLastMessage]);

  // Render message
  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <MessageBubble message={item} />
  ), []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ModelSelector
          provider={provider}
          setProvider={setProvider}
          model={model}
          setModel={setModel}
        />
        <View style={styles.headerActions}>
          {messages.length > 0 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleRegenerate}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#00ff88" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/settings/index')}
          >
            <MaterialIcons name="settings" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.errorDismiss}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="robot-happy" size={64} color="#00ff88" />
            <Text style={styles.emptyStateTitle}>Welcome to AI Studio</Text>
            <Text style={styles.emptyStateSubtitle}>
              Start a conversation with AI. Select a model and start typing.
            </Text>
            
            <View style={styles.quickStart}>
              <Text style={styles.quickStartTitle}>Quick Start:</Text>
              {[
                { icon: 'code', label: 'Generate Code', prompt: 'Write a Python function to sort an array' },
                { icon: 'lightbulb', label: 'Get Ideas', prompt: 'Give me 10 startup ideas' },
                { icon: 'school', label: 'Learn', prompt: 'Explain quantum computing' },
                { icon: 'bug', label: 'Debug', prompt: 'Why is my React component not rendering?' },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickStartItem}
                  onPress={() => setInput(item.prompt)}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={20} color="#00ff88" />
                  <Text style={styles.quickStartItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isLoading ? (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="small" color="#00ff88" />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            ) : null}
          />
        )}
      </View>

      {/* Input */}
      <InputArea
        input={input}
        setInput={setInput}
        onSend={handleSend}
        isLoading={isLoading}
        onNewChat={handleNewChat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modelSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  modelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  modelButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesList: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#00ff88',
  },
  assistantBubble: {
    backgroundColor: '#1a1a1a',
  },
  messageHeader: {
    marginBottom: 4,
  },
  modelName: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '500',
  },
  messageContent: {
    paddingVertical: 4,
  },
  userText: {
    color: '#000',
    fontSize: 16,
    lineHeight: 22,
  },
  assistantText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 4,
  },
  timestamp: {
    color: '#666',
    fontSize: 10,
  },
  tokenCount: {
    color: '#666',
    fontSize: 10,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  newChatButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#00ff88',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  errorContainer: {
    backgroundColor: '#ff333322',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff3333',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    color: '#00ff88',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
  },
  quickStart: {
    marginTop: 32,
    width: '100%',
  },
  quickStartTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  quickStartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 8,
  },
  quickStartItemText: {
    color: '#fff',
    fontSize: 14,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#00ff88',
    fontSize: 14,
  },
  menu: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    zIndex: 100,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuItem: {
    padding: 12,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 14,
  },
  promptSuggestions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  promptSuggestion: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  promptSuggestionText: {
    color: '#888',
    fontSize: 12,
  },
});
