import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CodeEditor from '../../components/CodeEditor';
import {
  generateCode,
  generateTests,
  explainCode,
  optimizeCode,
  debugCode,
  getCodePresets,
  getLanguages,
  getFrameworks,
} from '../../services/codeGeneration';
import { AIProvider, AIModel, AI_MODELS } from '../../types/models';

// Code generation form
const CodeGenerationForm = ({
  onClose,
  onGenerate,
}: {
  onClose: () => void;
  onGenerate: (code: string) => void;
}) => {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('TypeScript');
  const [framework, setFramework] = useState('');
  const [includeComments, setIncludeComments] = useState(true);
  const [includeTests, setIncludeTests] = useState(false);
  const [explain, setExplain] = useState(false);
  const [generating, setGenerating] = useState(false);

  const languages = getLanguages();
  const frameworks = getFrameworks(language);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    try {
      const response = await generateCode({
        prompt,
        language,
        framework: framework || undefined,
        includeComments,
        includeTests,
        explainCode: explain,
      });
      onGenerate(response.content);
      onClose();
    } catch (error) {
      console.error('Error generating code:', error);
      Alert.alert('Error', 'Failed to generate code. Please check your API configuration.');
    } finally {
      setGenerating(false);
    }
  }, [prompt, language, framework, includeComments, includeTests, explain, onGenerate, onClose]);

  return (
    <Modal visible={true} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Generate Code</Text>
            <TouchableOpacity onPress={onClose} disabled={generating}>
              <MaterialIcons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Describe what you want to create *</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="e.g., Create a React component for a user profile card"
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Language</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerText}>{language}</Text>
                <MaterialIcons name="arrow-drop-down" size={20} color="#888" />
              </View>
              <View style={styles.languageOptions}>
                {languages.map(lang => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.languageOption, language === lang && styles.languageOptionSelected]}
                    onPress={() => {
                      setLanguage(lang);
                      setFramework('');
                    }}
                  >
                    <Text style={[styles.languageOptionText, language === lang && styles.languageOptionTextSelected]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {frameworks.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Framework (Optional)</Text>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerText}>{framework || 'None'}</Text>
                  <MaterialIcons name="arrow-drop-down" size={20} color="#888" />
                </View>
                <View style={styles.frameworkOptions}>
                  {frameworks.map(fw => (
                    <TouchableOpacity
                      key={fw}
                      style={[styles.frameworkOption, framework === fw && styles.frameworkOptionSelected]}
                      onPress={() => setFramework(fw)}
                    >
                      <Text style={[styles.frameworkOptionText, framework === fw && styles.frameworkOptionTextSelected]}>
                        {fw}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.optionsTitle}>Options</Text>
            
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.optionButton, includeComments && styles.optionButtonSelected]}
                onPress={() => setIncludeComments(!includeComments)}
              >
                <MaterialIcons
                  name={includeComments ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={includeComments ? '#00ff88' : '#666'}
                />
                <Text style={[styles.optionText, includeComments && styles.optionTextSelected]}>
                  Include Comments
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.optionButton, includeTests && styles.optionButtonSelected]}
                onPress={() => setIncludeTests(!includeTests)}
              >
                <MaterialIcons
                  name={includeTests ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={includeTests ? '#00ff88' : '#666'}
                />
                <Text style={[styles.optionText, includeTests && styles.optionTextSelected]}>
                  Generate Tests
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.optionButton, explain && styles.optionButtonSelected]}
                onPress={() => setExplain(!explain)}
              >
                <MaterialIcons
                  name={explain ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={explain ? '#00ff88' : '#666'}
                />
                <Text style={[styles.optionText, explain && styles.optionTextSelected]}>
                  Explain Code
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={onClose}
              disabled={generating}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleGenerate}
              disabled={generating || !prompt.trim()}
            >
              {generating ? (
                <MaterialCommunityIcons name="loading" size={18} color="#000" />
              ) : (
                <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>
                  Generate Code
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Code actions modal
const CodeActionsModal = ({
  code,
  language,
  onClose,
}: {
  code: string;
  language: string;
  onClose: () => void;
}) => {
  const [action, setAction] = useState<'explain' | 'tests' | 'optimize' | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = useCallback(async (actionType: 'explain' | 'tests' | 'optimize') => {
    setAction(actionType);
    setLoading(true);
    
    try {
      let response;
      switch (actionType) {
        case 'explain':
          response = await explainCode(code, language);
          break;
        case 'tests':
          response = await generateTests(code, language);
          break;
        case 'optimize':
          response = await optimizeCode(code, language, 'performance');
          break;
      }
      setResult(response.content);
    } catch (error) {
      console.error('Error performing action:', error);
      Alert.alert('Error', 'Failed to perform action. Please check your API configuration.');
    } finally {
      setLoading(false);
    }
  }, [code, language]);

  return (
    <Modal visible={true} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modal, styles.largeModal]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Code Actions</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {action ? (
            <View style={styles.resultContainer}>
              <View style={styles.actionsHeader}>
                <TouchableOpacity onPress={() => setAction(null)}>
                  <MaterialIcons name="arrow-back" size={24} color="#888" />
                </TouchableOpacity>
                <Text style={styles.resultTitle}>
                  {action === 'explain' && 'Explanation'}
                  {action === 'tests' && 'Generated Tests'}
                  {action === 'optimize' && 'Optimized Code'}
                </Text>
              </View>
              
              {loading ? (
                <View style={styles.loading}>
                  <MaterialCommunityIcons name="loading" size={32} color="#00ff88" />
                  <Text style={styles.loadingText}>Processing...</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.resultContent}>
                  <CodeEditor
                    value={result}
                    onChange={() => {}}
                    language={action === 'tests' ? language : 'text'}
                    editable={false}
                    showLineNumbers={true}
                  />
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={styles.actionsContent}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction('explain')}
              >
                <MaterialCommunityIcons name="lightbulb-on" size={24} color="#ffaa00" />
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Explain Code</Text>
                  <Text style={styles.actionDescription}>
                    Get a detailed explanation of how this code works
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction('tests')}
              >
                <MaterialCommunityIcons name="test-tube" size={24} color="#00aaff" />
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Generate Tests</Text>
                  <Text style={styles.actionDescription}>
                    Create comprehensive unit tests for this code
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction('optimize')}
              >
                <MaterialCommunityIcons name="tune" size={24} color="#00ff88" />
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Optimize Code</Text>
                  <Text style={styles.actionDescription}>
                    Improve performance and efficiency
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Main chat screen with code generation
export default function ChatScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('TypeScript');
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [showCodeActions, setShowCodeActions] = useState(false);

  const handleGenerateCode = useCallback((generatedCode: string) => {
    setCode(generatedCode);
    setShowCodeForm(false);
  }, []);

  const handleRunCode = useCallback(() => {
    // In a real app, this would execute the code
    // For now, just show a message
    Alert.alert('Info', 'Code execution is not yet implemented in this demo. This feature requires a code execution environment.');
  }, []);

  const handleCopyCode = useCallback(() => {
    // Copy handled by CodeEditor component
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AI Code Studio</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/settings/index')}
          >
            <MaterialIcons name="settings" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Code editor */}
      <View style={styles.editorContainer}>
        <CodeEditor
          value={code}
          onChange={setCode}
          language={language}
          editable={true}
          showLineNumbers={true}
          onRun={handleRunCode}
          onCopy={handleCopyCode}
        />
      </View>

      {/* Empty state */}
      {code.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="code-tags" size={64} color="#666" />
          <Text style={styles.emptyStateTitle}>Ready to Code</Text>
          <Text style={styles.emptyStateSubtitle}>
            Use AI to generate, explain, optimize, and test your code
          </Text>
          
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => setShowCodeForm(true)}
          >
            <MaterialCommunityIcons name="robot-happy" size={20} color="#000" />
            <Text style={styles.generateButtonText}>Generate Code with AI</Text>
          </TouchableOpacity>

          <View style={styles.quickActions}>
            <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
            <View style={styles.quickActionsList}>
              {[
                { icon: 'lightbulb-on', label: 'Explain', action: () => setShowCodeActions(true) },
                { icon: 'test-tube', label: 'Test', action: () => setShowCodeActions(true) },
                { icon: 'tune', label: 'Optimize', action: () => setShowCodeActions(true) },
                { icon: 'bug', label: 'Debug', action: () => setShowCodeActions(true) },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionItem}
                  onPress={item.action}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={20} color="#00ff88" />
                  <Text style={styles.quickActionItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Code actions button */}
      {code.length > 0 && (
        <View style={styles.codeActionsButton}>
          <TouchableOpacity
            style={styles.actionsButton}
            onPress={() => setShowCodeActions(true)}
          >
            <MaterialCommunityIcons name="magic-staff" size={20} color="#fff" />
            <Text style={styles.actionsButtonText}>AI Actions</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Generate code modal */}
      {showCodeForm && (
        <CodeGenerationForm
          onClose={() => setShowCodeForm(false)}
          onGenerate={handleGenerateCode}
        />
      )}

      {/* Code actions modal */}
      {showCodeActions && (
        <CodeActionsModal
          code={code}
          language={language}
          onClose={() => setShowCodeActions(false)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  editorContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00ff88',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  generateButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    marginTop: 32,
    width: '100%',
  },
  quickActionsTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  quickActionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  quickActionItemText: {
    color: '#fff',
    fontSize: 12,
  },
  codeActionsButton: {
    padding: 16,
  },
  actionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00ff88',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  actionsButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  largeModal: {
    width: '95%',
    maxWidth: 800,
    maxHeight: '90%',
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
    fontWeight: '500',
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
    minHeight: 80,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    padding: 10,
  },
  pickerText: {
    color: '#fff',
    fontSize: 14,
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  languageOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#222',
    borderRadius: 6,
  },
  languageOptionSelected: {
    backgroundColor: '#00ff8822',
  },
  languageOptionText: {
    color: '#888',
    fontSize: 12,
  },
  languageOptionTextSelected: {
    color: '#00ff88',
  },
  frameworkOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  frameworkOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#222',
    borderRadius: 6,
  },
  frameworkOptionSelected: {
    backgroundColor: '#00ff8822',
  },
  frameworkOptionText: {
    color: '#888',
    fontSize: 12,
  },
  frameworkOptionTextSelected: {
    color: '#00ff88',
  },
  optionsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: '#222',
    borderRadius: 6,
  },
  optionButtonSelected: {
    backgroundColor: '#00ff8822',
  },
  optionText: {
    color: '#888',
    fontSize: 12,
  },
  optionTextSelected: {
    color: '#00ff88',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
  resultContainer: {
    flex: 1,
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContent: {
    gap: 12,
  },
  actionsContent: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionDescription: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 40,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
});
