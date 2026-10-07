import { useState, useCallback, useRef } from 'react';
import { ChatMessage, Conversation, AIProvider, AIModel, StreamingChunk } from '../types';
import { saveConversation, getConversations, getActiveConversationId, setActiveConversation } from '../utils/storage';
import { callAIProvider } from '../services/aiService';
import { v4 as uuidv4 } from 'uuid';

interface UseAIChatOptions {
  provider: AIProvider;
  model: AIModel;
}

export interface UseAIChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  sendMessage: (content: string, systemMessage?: string) => Promise<void>;
  createNewConversation: () => Promise<void>;
  switchConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  regenerateLastMessage: () => Promise<void>;
  clearError: () => void;
}

export function useAIChat({ provider, model }: UseAIChatOptions): UseAIChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  
  const messagesRef = useRef<ChatMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize conversations
  const initialize = useCallback(async () => {
    try {
      const convs = await getConversations();
      setConversations(convs);
      
      const activeId = await getActiveConversationId();
      if (activeId) {
        const activeConv = convs.find(c => c.id === activeId);
        if (activeConv) {
          setActiveConversation(activeConv);
          setMessages(activeConv.messages);
          setConversationId(activeId);
          messagesRef.current = activeConv.messages;
        }
      }
    } catch (err) {
      console.error('Error initializing conversations:', err);
    }
  }, []);

  // Create a new conversation
  const createNewConversation = useCallback(async () => {
    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const newConversation: Conversation = {
        id: uuidv4(),
        title: `Chat ${conversations.length + 1}`,
        messages: [],
        model: model.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await saveConversation(newConversation);
      await setActiveConversation(newConversation);
      
      setConversationId(newConversation.id);
      setMessages([]);
      setActiveConversation(newConversation);
      messagesRef.current = [];
      setConversations(prev => [newConversation, ...prev]);
      setError(null);
    } catch (err) {
      console.error('Error creating new conversation:', err);
    }
  }, [conversations.length, model.id]);

  // Switch to an existing conversation
  const switchConversation = useCallback(async (id: string) => {
    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const conv = conversations.find(c => c.id === id);
      if (conv) {
        await setActiveConversation(conv);
        setConversationId(id);
        setMessages(conv.messages);
        setActiveConversation(conv);
        messagesRef.current = conv.messages;
        setError(null);
      }
    } catch (err) {
      console.error('Error switching conversation:', err);
    }
  }, [conversations]);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      if (conversationId === id) {
        // If deleting current conversation, switch to first one or create new
        const remaining = conversations.filter(c => c.id !== id);
        if (remaining.length > 0) {
          await switchConversation(remaining[0].id);
        } else {
          await createNewConversation();
        }
      }
      
      // Update conversations list
      setConversations(prev => prev.filter(c => c.id !== id));
      
      // Note: Actual deletion from storage happens in the effect
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  }, [conversationId, conversations, switchConversation, createNewConversation]);

  // Send a message
  const sendMessage = useCallback(async (content: string, systemMessage?: string) => {
    if (!conversationId || isLoading) return;
    
    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      setIsLoading(true);
      setError(null);
      
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date(),
        model: model.id,
      };
      
      // Add user message immediately
      const updatedMessages = [...messagesRef.current, userMessage];
      setMessages(updatedMessages);
      messagesRef.current = updatedMessages;
      
      // Update conversation in state
      setActiveConversation((prev: Conversation | null) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: updatedMessages,
          updatedAt: new Date(),
        };
      });
      
      // Prepare messages for API (include system message if provided)
      const apiMessages = [
        ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
        ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
      ];
      
      // Create abort controller for streaming
      abortControllerRef.current = new AbortController();
      
      // Call AI provider
      const response = await callAIProvider({
        provider,
        model: model.id,
        messages: apiMessages,
        signal: abortControllerRef.current.signal,
        onStream: (chunk: StreamingChunk) => {
          // Handle streaming chunks
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'assistant') {
              const updatedLast = {
                ...lastMessage,
                content: lastMessage.content + chunk.chunk,
              };
              return [...prev.slice(0, -1), updatedLast];
            }
            return prev;
          });
        },
      });
      
      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        model: model.id,
        tokenCount: response.usage?.completionTokens,
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      messagesRef.current = finalMessages;
      
      // Update conversation
      if (activeConversation) {
        const updatedConv: Conversation = {
          ...activeConversation,
          messages: finalMessages,
          updatedAt: new Date(),
          model: model.id,
        };
        await saveConversation(updatedConv);
        setActiveConversation(updatedConv);
        
        // Update conversations list
        setConversations(prev => {
          const index = prev.findIndex(c => c.id === updatedConv.id);
          if (index >= 0) {
            return [...prev.slice(0, index), updatedConv, ...prev.slice(index + 1)];
          }
          return prev;
        });
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      // Remove the loading state from the last message if it was added
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, isLoading, model.id, activeConversation]);

  // Regenerate last assistant message
  const regenerateLastMessage = useCallback(async () => {
    if (!conversationId || isLoading) return;
    
    try {
      const lastUserMessage = messagesRef.current.filter(m => m.role === 'user').pop();
      if (!lastUserMessage) return;
      
      // Remove the last assistant message
      const messagesWithoutLastAssistant = messagesRef.current.filter(
        (m, index, arr) => {
          if (m.role === 'assistant') {
            // Find the last assistant message
            let lastAssistantIndex = -1;
            for (let i = arr.length - 1; i >= 0; i--) {
              if (arr[i].role === 'assistant') {
                lastAssistantIndex = i;
                break;
              }
            }
            return index !== lastAssistantIndex;
          }
          return true;
        }
      );
      
      setMessages(messagesWithoutLastAssistant);
      messagesRef.current = messagesWithoutLastAssistant;
      
      // Resend the last user message
      await sendMessage(lastUserMessage.content);
    } catch (err) {
      console.error('Error regenerating message:', err);
    }
  }, [conversationId, isLoading, sendMessage]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
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
  };
}
