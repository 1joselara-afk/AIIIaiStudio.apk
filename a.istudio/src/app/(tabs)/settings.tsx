import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AIProvider, PROVIDER_NAMES, PROVIDER_ICONS, PROVIDER_API_URLS } from '../../types/models';
import { getConfig, saveConfig, DEFAULT_CONFIG, clearAllData } from '../../utils/storage';
import { AIProviderConfig, AIConfig } from '../../types';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  action?: React.ReactNode;
}

const SettingItem = ({ icon, title, subtitle, onPress, action }: SettingItemProps) => {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        <MaterialCommunityIcons name={icon as any} size={20} color="#00ff88" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {action && <View style={styles.settingAction}>{action}</View>}
      {onPress && !action && (
        <MaterialIcons name="chevron-right" size={20} color="#666" />
      )}
    </TouchableOpacity>
  );
};

interface ProviderSettingsProps {
  provider: AIProvider;
  config: AIConfig & { endpoint?: string };
  onSave: (provider: AIProvider, updates: Partial<AIConfig & { endpoint?: string }>) => void;
}

const ProviderSettings = ({ provider, config, onSave }: ProviderSettingsProps) => {
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(config.baseUrl || config.endpoint || PROVIDER_API_URLS[provider]);
  const [temperature, setTemperature] = useState(config.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(config.maxTokens ?? 4096);
  const [topP, setTopP] = useState(config.topP ?? 1);
  const [frequencyPenalty, setFrequencyPenalty] = useState(config.frequencyPenalty ?? 0);
  const [presencePenalty, setPresencePenalty] = useState(config.presencePenalty ?? 0);

  const handleSave = () => {
    onSave(provider, {
      apiKey,
      baseUrl,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
    });
  };

  return (
    <View style={styles.providerSettings}>
      <View style={styles.providerHeader}>
        <Text style={styles.providerTitle}>
          {PROVIDER_ICONS[provider]} {PROVIDER_NAMES[provider]}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>API Key</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder={`Enter ${PROVIDER_NAMES[provider]} API key`}
          placeholderTextColor="#666"
          secureTextEntry={true}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Base URL</Text>
        <TextInput
          style={styles.input}
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="Enter custom API endpoint"
          placeholderTextColor="#666"
        />
      </View>
      
      <Text style={styles.sectionTitle}>Generation Parameters</Text>
      
      <View style={styles.sliderGroup}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Temperature</Text>
          <Text style={styles.sliderValue}>{temperature}</Text>
        </View>
        <View style={styles.sliderContainer}>
          <MaterialCommunityIcons name="thermometer" size={16} color="#00ff88" />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Precise</Text>
            <Text style={styles.sliderLabelText}>Creative</Text>
          </View>
        </View>
        <Text style={styles.sliderDescription}>
          Higher values make output more random and creative
        </Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Max Tokens</Text>
        <TextInput
          style={styles.input}
          value={maxTokens.toString()}
          onChangeText={(text) => setMaxTokens(parseInt(text) || 0)}
          keyboardType="numeric"
          placeholder="4096"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Top P (Nucleus Sampling)</Text>
        <TextInput
          style={styles.input}
          value={topP.toString()}
          onChangeText={(text) => setTopP(parseFloat(text) || 0)}
          keyboardType="decimal-pad"
          placeholder="1.0"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Frequency Penalty</Text>
        <TextInput
          style={styles.input}
          value={frequencyPenalty.toString()}
          onChangeText={(text) => setFrequencyPenalty(parseFloat(text) || 0)}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Presence Penalty</Text>
        <TextInput
          style={styles.input}
          value={presencePenalty.toString()}
          onChangeText={(text) => setPresencePenalty(parseFloat(text) || 0)}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#666"
        />
      </View>
    </View>
  );
};

export default function SettingsScreen() {
  const [config, setConfig] = useState<AIProviderConfig>(DEFAULT_CONFIG);
  const [expandedProvider, setExpandedProvider] = useState<AIProvider | null>(null);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'mistral', 'local'];

  // Load config
  useEffect(() => {
    const loadConfig = async () => {
      const savedConfig = await getConfig();
      setConfig(savedConfig);
    };
    loadConfig();
  }, []);

  // Handle save provider config
  const handleSaveProvider = (provider: AIProvider, updates: Partial<AIConfig & { endpoint?: string }>) => {
    const updatedConfig = { ...config };
    const providerConfig = updatedConfig[provider as keyof typeof updatedConfig] as any;
    
    updatedConfig[provider as keyof typeof updatedConfig] = {
      ...providerConfig,
      ...updates,
    };
    
    saveConfig(updatedConfig);
    setConfig(updatedConfig);
    setExpandedProvider(null);
  };

  // Handle clear data
  const handleClearData = async () => {
    try {
      await clearAllData();
      Alert.alert('Success', 'All data has been cleared');
      setShowClearDataConfirm(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  // Toggle provider expansion
  const toggleProvider = (provider: AIProvider) => {
    setExpandedProvider(expandedProvider === provider ? null : provider);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure your AI Studio</Text>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <SettingItem
          icon="theme-light-dark"
          title="Theme"
          action={
            <View style={styles.themeToggle}>
              <TouchableOpacity
                style={[styles.themeOption, theme === 'dark' && styles.themeOptionSelected]}
                onPress={() => setTheme('dark')}
              >
                <MaterialCommunityIcons name="moon-waning-crescent" size={16} color="#fff" />
                <Text style={[styles.themeOptionText, theme === 'dark' && styles.themeOptionTextSelected]}>
                  Dark
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeOption, theme === 'light' && styles.themeOptionSelected]}
                onPress={() => setTheme('light')}
              >
                <MaterialCommunityIcons name="white-balance-sunny" size={16} color="#000" />
                <Text style={[styles.themeOptionText, theme === 'light' && styles.themeOptionTextSelected]}>
                  Light
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* AI Providers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Providers</Text>
        <Text style={styles.sectionDescription}>
          Configure API keys and settings for each AI provider
        </Text>
        
        {providers.map(provider => (
          <View key={provider} style={styles.providerItem}>
            <SettingItem
              icon={PROVIDER_ICONS[provider] as any}
              title={PROVIDER_NAMES[provider]}
              subtitle={config[provider as keyof typeof config]?.apiKey ? 'Configured' : 'Not configured'}
              onPress={() => toggleProvider(provider)}
            />
            
            {expandedProvider === provider && (
              <ProviderSettings
                provider={provider}
                config={config[provider as keyof typeof config] as any}
                onSave={handleSaveProvider}
              />
            )}
          </View>
        ))}
      </View>

      {/* General Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <SettingItem
          icon="delete-sweep"
          title="Clear All Data"
          subtitle="Remove all conversations and settings"
          onPress={() => setShowClearDataConfirm(true)}
        />
        <SettingItem
          icon="information-outline"
          title="About"
          subtitle="Version 1.0.0"
        />
      </View>

      {/* Clear Data Confirmation Modal */}
      {showClearDataConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Clear All Data?</Text>
            <Text style={styles.modalText}>
              This will remove all conversations, settings, and prompt templates.
              This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowClearDataConfirm(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={handleClearData}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonDangerText]}>
                  Clear All Data
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    paddingBottom: 40,
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
  section: {
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionDescription: {
    color: '#666',
    fontSize: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 8,
  },
  settingIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: '#666',
    fontSize: 12,
  },
  settingAction: {
    marginRight: 8,
  },
  themeToggle: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 2,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  themeOptionSelected: {
    backgroundColor: '#00ff88',
  },
  themeOptionText: {
    color: '#666',
    fontSize: 12,
  },
  themeOptionTextSelected: {
    color: '#000',
  },
  providerItem: {
    marginBottom: 8,
  },
  providerSettings: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: '500',
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
  sliderGroup: {
    gap: 4,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    color: '#fff',
    fontSize: 14,
  },
  sliderValue: {
    color: '#00ff88',
    fontSize: 14,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderLabels: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderLabelText: {
    color: '#666',
    fontSize: 10,
  },
  sliderDescription: {
    color: '#666',
    fontSize: 10,
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
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  modalButtonDanger: {
    backgroundColor: '#ff3333',
  },
  modalButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtonDangerText: {
    color: '#fff',
  },
});
