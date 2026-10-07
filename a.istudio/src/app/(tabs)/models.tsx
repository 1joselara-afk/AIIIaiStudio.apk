import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AIProvider, AIModel, AI_MODELS, PROVIDER_NAMES, PROVIDER_ICONS, PROVIDER_API_URLS } from '../../types/models';
import { getConfig, saveConfig, DEFAULT_CONFIG, AIProviderConfig, AIConfig, LocalConfig } from '../../utils/storage';

interface ProviderCardProps {
  provider: AIProvider;
  isSelected: boolean;
  onSelect: (provider: AIProvider) => void;
}

const ProviderCard = ({ provider, isSelected, onSelect }: ProviderCardProps) => {
  const models = AI_MODELS[provider];
  const totalModels = models.length;
  const cheapestPrice = Math.min(...models.map(m => m.pricePerToken || Infinity).filter(p => p !== Infinity));
  const mostExpensivePrice = Math.max(...models.map(m => m.pricePerToken || 0));
  
  return (
    <TouchableOpacity
      style={[styles.providerCard, isSelected && styles.providerCardSelected]}
      onPress={() => onSelect(provider)}
    >
      <View style={styles.providerHeader}>
        <Text style={styles.providerIcon}>{PROVIDER_ICONS[provider]}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{PROVIDER_NAMES[provider]}</Text>
          <Text style={styles.providerDescription}>
            {totalModels} models available
          </Text>
        </View>
        {isSelected && (
          <MaterialIcons name="check-circle" size={24} color="#00ff88" />
        )}
      </View>
      
      <View style={styles.providerStats}>
        {cheapestPrice !== Infinity && (
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Price range</Text>
            <Text style={styles.statValue}>
              ${cheapestPrice.toExponential(2)} - ${mostExpensivePrice.toExponential(2)} /token
            </Text>
          </View>
        )}
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Max context</Text>
          <Text style={styles.statValue}>
            {Math.max(...models.map(m => m.maxTokens))} tokens
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface ModelCardProps {
  model: AIModel;
  isSelected: boolean;
  onSelect: (model: AIModel) => void;
  providerConfig: AIConfig | LocalConfig;
  onConfigure: (provider: AIProvider) => void;
}

const ModelCard = ({ model, isSelected, onSelect, providerConfig, onConfigure }: ModelCardProps) => {
  const hasApiKey = (providerConfig as AIConfig)?.apiKey && (providerConfig as AIConfig).apiKey.length > 0;
  
  return (
    <TouchableOpacity
      style={[styles.modelCard, isSelected && styles.modelCardSelected]}
      onPress={() => onSelect(model)}
    >
      <View style={styles.modelHeader}>
        <View style={styles.modelInfo}>
          <Text style={styles.modelName}>{model.name}</Text>
          <Text style={styles.modelId}>{model.id}</Text>
        </View>
        {isSelected && (
          <MaterialIcons name="check-circle" size={20} color="#00ff88" />
        )}
      </View>
      
      <Text style={styles.modelDescription} numberOfLines={2}>
        {model.description}
      </Text>
      
      <View style={styles.modelStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Max tokens</Text>
          <Text style={styles.statValue}>{model.maxTokens.toLocaleString()}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Streaming</Text>
          <Text style={[styles.statValue, model.supportsStreaming && styles.statValuePositive]}>
            {model.supportsStreaming ? 'Yes' : 'No'}
          </Text>
        </View>
        {model.pricePerToken && (
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Price</Text>
            <Text style={styles.statValue}>
              ${model.pricePerToken.toExponential(2)} /token
            </Text>
          </View>
        )}
      </View>
      
      {!hasApiKey && (
        <View style={styles.apiKeyWarning}>
          <MaterialCommunityIcons name="key-alert" size={16} color="#ffaa00" />
          <Text style={styles.apiKeyWarningText} onPress={() => onConfigure(model.provider)}>
            API key not configured
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const FilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedProvider,
  setSelectedProvider,
  providers,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProvider: AIProvider | null;
  setSelectedProvider: (provider: AIProvider | null) => void;
  providers: AIProvider[];
}) => {
  return (
    <View style={styles.filterBar}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search models..."
          placeholderTextColor="#666"
        />
      </View>
      
      <ScrollView
        horizontal
        style={styles.providerFilter}
        showsHorizontalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[styles.filterChip, !selectedProvider && styles.filterChipSelected]}
          onPress={() => setSelectedProvider(null)}
        >
          <Text style={[styles.filterChipText, !selectedProvider && styles.filterChipTextSelected]}>
            All
          </Text>
        </TouchableOpacity>
        {providers.map(provider => (
          <TouchableOpacity
            key={provider}
            style={[styles.filterChip, selectedProvider === provider && styles.filterChipSelected]}
            onPress={() => setSelectedProvider(provider)}
          >
            <Text style={[styles.filterChipText, selectedProvider === provider && styles.filterChipTextSelected]}>
              {PROVIDER_ICONS[provider]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default function ModelsScreen() {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [config, setConfig] = useState<AIProviderConfig>(DEFAULT_CONFIG);
  const [showProviderSettings, setShowProviderSettings] = useState<AIProvider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [temperatureInput, setTemperatureInput] = useState(0.7);
  const [maxTokensInput, setMaxTokensInput] = useState(4096);
  const [topPInput, setTopPInput] = useState(1);
  const [frequencyPenaltyInput, setFrequencyPenaltyInput] = useState(0);
  const [presencePenaltyInput, setPresencePenaltyInput] = useState(0);

  const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'mistral', 'local'];

  // Load config
  useEffect(() => {
    const loadConfig = async () => {
      const savedConfig = await getConfig();
      setConfig(savedConfig);
    };
    loadConfig();
  }, []);

  // Get all models
  const allModels: { provider: AIProvider; model: AIModel }[] = providers.flatMap(provider =>
    AI_MODELS[provider].map(model => ({ provider, model }))
  );

  // Filter models
  const filteredModels = allModels.filter(item => {
    const matchesProvider = selectedProvider ? item.provider === selectedProvider : true;
    const matchesSearch = searchQuery 
      ? item.model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesProvider && matchesSearch;
  });

  // Group by provider
  const groupedModels = filteredModels.reduce((acc, item) => {
    if (!acc[item.provider]) {
      acc[item.provider] = [];
    }
    acc[item.provider].push(item.model);
    return acc;
  }, {} as Record<AIProvider, AIModel[]>);

  // Handle select model
  const handleSelectModel = (model: AIModel, provider: AIProvider) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
  };

  // Handle configure provider
  const handleConfigureProvider = (provider: AIProvider) => {
    const providerConfig = config[provider];
    const aiConfig = providerConfig as AIConfig;
    setShowProviderSettings(provider);
    setApiKeyInput(aiConfig?.apiKey || (providerConfig as LocalConfig)?.apiKey || '');
    setBaseUrlInput(aiConfig?.baseUrl || (providerConfig as LocalConfig)?.endpoint || PROVIDER_API_URLS[provider]);
    if (provider !== 'local') {
      setTemperatureInput(aiConfig?.temperature || 0.7);
      setMaxTokensInput(aiConfig?.maxTokens || 4096);
      setTopPInput(aiConfig?.topP || 1);
      setFrequencyPenaltyInput(aiConfig?.frequencyPenalty || 0);
      setPresencePenaltyInput(aiConfig?.presencePenalty || 0);
    }
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    if (!showProviderSettings) return;
    
    const updatedConfig: AIProviderConfig = { ...config };
    const providerConfig: AIConfig | LocalConfig = showProviderSettings === 'local' ? {
      endpoint: baseUrlInput,
      apiKey: apiKeyInput,
    } : {
      apiKey: apiKeyInput,
      baseUrl: baseUrlInput,
      temperature: temperatureInput,
      maxTokens: maxTokensInput,
      topP: topPInput,
      frequencyPenalty: frequencyPenaltyInput,
      presencePenalty: presencePenaltyInput,
    };
    
    (updatedConfig as any)[showProviderSettings] = providerConfig;
    
    await saveConfig(updatedConfig);
    setConfig(updatedConfig);
    setShowProviderSettings(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select AI Model</Text>
        <Text style={styles.subtitle}>
          Choose from {allModels.length} models across {providers.length} providers
        </Text>
      </View>

      {/* Filter */}
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
        providers={providers}
      />

      {/* Providers */}
      {selectedProvider ? (
        <FlatList
          data={groupedModels[selectedProvider] || []}
          keyExtractor={(model) => model.id}
          renderItem={({ item: model }) => (
            <ModelCard
              model={model}
              isSelected={selectedModel?.id === model.id}
              onSelect={(m) => handleSelectModel(m, selectedProvider)}
              providerConfig={config[selectedProvider] as AIConfig | LocalConfig}
              onConfigure={() => handleConfigureProvider(selectedProvider)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No models found</Text>
            </View>
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.providersList}>
          {providers.map(provider => (
            <View key={provider} style={styles.providerSection}>
              <ProviderCard
                provider={provider}
                isSelected={selectedProvider === provider}
                onSelect={() => setSelectedProvider(provider)}
              />
              
              <FlatList
                data={AI_MODELS[provider]}
                keyExtractor={(model) => model.id}
                renderItem={({ item: model }) => (
                  <ModelCard
                    model={model}
                    isSelected={selectedModel?.id === model.id}
                    onSelect={(m) => handleSelectModel(m, provider)}
                    providerConfig={config[provider] as AIConfig | LocalConfig}
                    onConfigure={() => handleConfigureProvider(provider)}
                  />
                )}
                scrollEnabled={false}
              />
            </View>
          ))}
        </ScrollView>
      )}

      {/* Provider Settings Modal */}
      {showProviderSettings && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Configure {PROVIDER_NAMES[showProviderSettings]}
              </Text>
              <TouchableOpacity onPress={() => setShowProviderSettings(null)}>
                <MaterialIcons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>API Key</Text>
              <TextInput
                style={styles.input}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder={`Enter ${PROVIDER_NAMES[showProviderSettings]} API key`}
                placeholderTextColor="#666"
                secureTextEntry={true}
              />
              
              <Text style={styles.inputLabel}>{showProviderSettings === 'local' ? 'Endpoint' : 'Base URL'} (Optional)</Text>
              <TextInput
                style={styles.input}
                value={baseUrlInput}
                onChangeText={setBaseUrlInput}
                placeholder={showProviderSettings === 'local' ? "Enter local API endpoint (e.g., http://localhost:11434)" : "Enter custom API endpoint"}
                placeholderTextColor="#666"
              />
              
              {showProviderSettings !== 'local' && (
                <>
                  <Text style={styles.inputLabel}>Temperature</Text>
                  <TextInput
                    style={styles.input}
                    value={temperatureInput.toString()}
                    onChangeText={(text) => setTemperatureInput(parseFloat(text) || 0.7)}
                    keyboardType="decimal-pad"
                    placeholder="0.7"
                    placeholderTextColor="#666"
                  />
                  
                  <Text style={styles.inputLabel}>Max Tokens</Text>
                  <TextInput
                    style={styles.input}
                    value={maxTokensInput.toString()}
                    onChangeText={(text) => setMaxTokensInput(parseInt(text) || 4096)}
                    keyboardType="numeric"
                    placeholder="4096"
                    placeholderTextColor="#666"
                  />
                </>
              )}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowProviderSettings(null)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveSettings}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>
                  Save
                </Text>
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
  filterBar: {
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  providerFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
  },
  filterChipSelected: {
    backgroundColor: '#00ff8822',
  },
  filterChipText: {
    color: '#666',
    fontSize: 12,
  },
  filterChipTextSelected: {
    color: '#00ff88',
  },
  providersList: {
    padding: 16,
    gap: 16,
  },
  providerSection: {
    gap: 8,
  },
  providerCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  providerCardSelected: {
    borderColor: '#00ff88',
    backgroundColor: '#00ff8811',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerIcon: {
    fontSize: 24,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  providerDescription: {
    color: '#666',
    fontSize: 12,
  },
  providerStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  modelCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  modelCardSelected: {
    borderColor: '#00ff88',
    backgroundColor: '#00ff8811',
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modelId: {
    color: '#666',
    fontSize: 10,
  },
  modelDescription: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  modelStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stat: {
    flexDirection: 'column',
  },
  statLabel: {
    color: '#666',
    fontSize: 10,
  },
  statValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  statValuePositive: {
    color: '#00ff88',
  },
  apiKeyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffaa0011',
    borderRadius: 4,
  },
  apiKeyWarningText: {
    color: '#ffaa00',
    fontSize: 12,
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 14,
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
    maxWidth: 400,
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
});
