import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Conversation } from '../../types';
import { getConversations, deleteConversation as deleteConv, setActiveConversation, getActiveConversationId } from '../../utils/storage';
import { useRouter } from 'expo-router';

interface ConversationCardProps {
  conversation: Conversation;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
}

const ConversationCard = ({ conversation, isActive, onPress, onDelete }: ConversationCardProps) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const messagePreview = lastMessage?.content.substring(0, 100) || 'New conversation';
  const messageCount = conversation.messages.length;
  
  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {conversation.title}
          </Text>
          <Text style={styles.cardTimestamp}>
            {new Date(conversation.updatedAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        
        <Text style={styles.cardPreview} numberOfLines={2}>
          {messagePreview}
          {messagePreview.length >= 100 ? '...' : ''}
        </Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.cardStats}>
            <MaterialCommunityIcons name="message-text" size={14} color="#666" />
            <Text style={styles.cardStatText}>{messageCount} messages</Text>
          </View>
          <Text style={styles.cardModel}>{conversation.model}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <MaterialIcons name="delete" size={20} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function HistoryScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load conversations
  useEffect(() => {
    const loadData = async () => {
      try {
        const convs = await getConversations();
        const active = await getActiveConversationId();
        setConversations(convs);
        setActiveId(active);
        setLoading(false);
      } catch (error) {
        console.error('Error loading conversations:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Handle conversation press
  const handleConversationPress = useCallback(async (id: string) => {
    try {
      await setActiveConversation(id);
      setActiveId(id);
      router.back();
    } catch (error) {
      console.error('Error switching conversation:', error);
    }
  }, [router]);

  // Handle delete conversation
  const handleDeleteConversation = useCallback(async (id: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConv(id);
              setConversations(prev => prev.filter(c => c.id !== id));
              if (activeId === id) {
                setActiveId(null);
              }
            } catch (error) {
              console.error('Error deleting conversation:', error);
            }
          },
        },
      ]
    );
  }, [activeId]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Conversations',
      'Are you sure you want to delete all conversations? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const conv of conversations) {
                await deleteConv(conv.id);
              }
              setConversations([]);
              setActiveId(null);
            } catch (error) {
              console.error('Error clearing conversations:', error);
            }
          },
        },
      ]
    );
  }, [conversations]);

  // Render conversation
  const renderConversation = useCallback(({ item }: { item: Conversation }) => (
    <ConversationCard
      conversation={item}
      isActive={activeId === item.id}
      onPress={() => handleConversationPress(item.id)}
      onDelete={() => handleDeleteConversation(item.id)}
    />
  ), [activeId, handleConversationPress, handleDeleteConversation]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Conversation History</Text>
        <Text style={styles.subtitle}>
          {conversations.length} conversations
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {conversations.length > 0 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearAll}
          >
            <MaterialIcons name="delete-sweep" size={20} color="#ff3333" />
            <Text style={styles.actionButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Conversations */}
      {loading ? (
        <View style={styles.loading}>
          <MaterialCommunityIcons name="loading" size={32} color="#00ff88" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="history" size={64} color="#666" />
          <Text style={styles.emptyStateTitle}>No conversations yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Start a new chat to begin your conversation history
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  actionButtonText: {
    color: '#ff3333',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#222',
  },
  cardActive: {
    borderColor: '#00ff88',
    backgroundColor: '#00ff8811',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '80%',
  },
  cardTimestamp: {
    color: '#666',
    fontSize: 10,
  },
  cardPreview: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatText: {
    color: '#666',
    fontSize: 10,
  },
  cardModel: {
    color: '#00ff88',
    fontSize: 10,
  },
  deleteButton: {
    padding: 4,
    opacity: 0.6,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
