import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PromptTemplate, CodeGenerationOptions } from '../../types';
import { getPromptTemplates, savePromptTemplates, addPromptTemplate, deletePromptTemplate, DEFAULT_PROMPTS } from '../../utils/storage';

interface PromptCardProps {
  template: PromptTemplate;
  onPress: () => void;
  onDelete: () => void;
  onUse: () => void;
}

const PromptCard = ({ template, onPress, onDelete, onUse }: PromptCardProps) => {
  const categoryColors: Record<string, string> = {
    code: '#00ff88',
    text: '#00aaff',
    analysis: '#ffaa00',
    creative: '#ff55ff',
    custom: '#8888ff',
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={[styles.cardCategory, { backgroundColor: categoryColors[template.category] + '22' }]}>
        <Text style={[styles.cardCategoryText, { color: categoryColors[template.category] }]}>
          {template.category}
        </Text>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{template.name}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {template.description}
        </Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.cardVariables}>
            {template.variables.map((variable, index) => (
              <View key={index} style={styles.variableBadge}>
                <Text style={styles.variableText}>{variable}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionButton} onPress={(e) => {
              e.stopPropagation();
              onUse();
            }}>
              <MaterialIcons name="play-arrow" size={16} color="#00ff88" />
              <Text style={styles.actionButtonText}>Use</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}>
              <MaterialIcons name="delete" size={16} color="#ff3333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface NewPromptModalProps {
  onClose: () => void;
  onSave: (template: PromptTemplate) => void;
}

const NewPromptModal = ({ onClose, onSave }: NewPromptModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('');
  const [category, setCategory] = useState<'code' | 'text' | 'analysis' | 'creative' | 'custom'>('code');
  const [variables, setVariables] = useState('');

  const categories: ('code' | 'text' | 'analysis' | 'creative' | 'custom')[] = 
    ['code', 'text', 'analysis', 'creative', 'custom'];

  const handleSave = () => {
    if (!name || !template) {
      Alert.alert('Error', 'Please fill in at least name and template');
      return;
    }

    const variableList = variables.split(',').map(v => v.trim()).filter(v => v);

    const newTemplate: PromptTemplate = {
      id: Date.now().toString(),
      name,
      description,
      template,
      category,
      variables: variableList,
    };

    onSave(newTemplate);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTemplate('');
    setCategory('code');
    setVariables('');
    onClose();
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>New Prompt Template</Text>
          <TouchableOpacity onPress={resetForm}>
            <MaterialIcons name="close" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Template name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal style={styles.categorySelector}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryOption, category === cat && styles.categoryOptionSelected]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryOptionText, category === cat && styles.categoryOptionTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Template *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={template}
              onChangeText={setTemplate}
              placeholder="Enter your prompt template. Use {variable} for placeholders."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Variables (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={variables}
              onChangeText={setVariables}
              placeholder="variable1, variable2"
              placeholderTextColor="#666"
            />
          </View>

          <Text style={styles.hint}>
            Example: "Write a {variables} function that {description}"
          </Text>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalButton} onPress={resetForm}>
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleSave}>
            <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function PromptsScreen() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPrompt, setShowNewPrompt] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const savedTemplates = await getPromptTemplates();
        setTemplates(savedTemplates);
        setLoading(false);
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplates(DEFAULT_PROMPTS);
        setLoading(false);
      }
    };
    loadTemplates();
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery
      ? template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.template.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesSearch;
  });

  // Handle add template
  const handleAddTemplate = useCallback(async (newTemplate: PromptTemplate) => {
    try {
      await addPromptTemplate(newTemplate);
      const updatedTemplates = await getPromptTemplates();
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error adding template:', error);
    }
  }, []);

  // Handle delete template
  const handleDeleteTemplate = useCallback(async (id: string) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePromptTemplate(id);
              const updatedTemplates = await getPromptTemplates();
              setTemplates(updatedTemplates);
            } catch (error) {
              console.error('Error deleting template:', error);
            }
          },
        },
      ]
    );
  }, []);

  // Handle use template
  const handleUseTemplate = useCallback((template: PromptTemplate) => {
    // For now, just show a message. In a real app, this would navigate back
    // and pre-fill the input with the template
    Alert.alert(
      'Template Selected',
      `Use this template: ${template.name}\n\n${template.template}`
    );
  }, []);

  // Render template
  const renderTemplate = useCallback(({ item }: { item: PromptTemplate }) => (
    <PromptCard
      template={item}
      onPress={() => setSelectedTemplate(item)}
      onDelete={() => handleDeleteTemplate(item.id)}
      onUse={() => handleUseTemplate(item)}
    />
  ), [handleDeleteTemplate, handleUseTemplate]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Prompt Templates</Text>
        <Text style={styles.subtitle}>
          {templates.length} templates available
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search templates..."
          placeholderTextColor="#666"
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewPrompt(true)}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>New Template</Text>
        </TouchableOpacity>
      </View>

      {/* Templates */}
      {loading ? (
        <View style={styles.loading}>
          <MaterialCommunityIcons name="loading" size={32} color="#00ff88" />
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      ) : filteredTemplates.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="lightbulb-off" size={64} color="#666" />
          <Text style={styles.emptyStateTitle}>No templates found</Text>
          <Text style={styles.emptyStateSubtitle}>
            Create your first prompt template to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTemplates}
          renderItem={renderTemplate}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* New Prompt Modal */}
      {showNewPrompt && (
        <NewPromptModal
          onClose={() => setShowNewPrompt(false)}
          onSave={handleAddTemplate}
        />
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedTemplate.name}</Text>
              <TouchableOpacity onPress={() => setSelectedTemplate(null)}>
                <MaterialIcons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{selectedTemplate.category}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{selectedTemplate.description}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Variables</Text>
                <View style={styles.variablesList}>
                  {selectedTemplate.variables.map((variable, index) => (
                    <View key={index} style={styles.variableBadge}>
                      <Text style={styles.variableText}>{variable}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Template</Text>
                <View style={styles.templateContainer}>
                  <Text style={styles.templateText}>{selectedTemplate.template}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setSelectedTemplate(null)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  handleUseTemplate(selectedTemplate);
                  setSelectedTemplate(null);
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Use Template</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    margin: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  actions: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00ff88',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardCategory: {
    padding: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  cardCategoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardContent: {
    gap: 4,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardDescription: {
    color: '#888',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardVariables: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  variableBadge: {
    backgroundColor: '#00ff8822',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  variableText: {
    color: '#00ff88',
    fontSize: 10,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  actionButtonText: {
    color: '#00ff88',
    fontSize: 12,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: '#888',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    padding: 10,
    color: '#fff',
    fontSize: 14,
  },
  textarea: {
    minHeight: 100,
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryOptionSelected: {
    backgroundColor: '#00ff8822',
    borderColor: '#00ff88',
  },
  categoryOptionText: {
    color: '#666',
    fontSize: 12,
  },
  categoryOptionTextSelected: {
    color: '#00ff88',
  },
  hint: {
    color: '#666',
    fontSize: 10,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  modalButtonPrimary: {
    backgroundColor: '#00ff88',
  },
  modalButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtonPrimaryText: {
    color: '#000',
  },
  detailSection: {
    gap: 4,
    marginBottom: 16,
  },
  detailLabel: {
    color: '#666',
    fontSize: 12,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
  },
  variablesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  templateContainer: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
  },
  templateText: {
    color: '#888',
    fontSize: 12,
    lineHeight: 18,
  },
});
