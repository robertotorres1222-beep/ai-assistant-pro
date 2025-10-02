import axios from 'axios'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import toast from 'react-hot-toast'

// Use Railway backend URL - you'll need to replace this with your actual Railway URL
const RAILWAY_URL = 'https://ai-assistant-pro-production.up.railway.app'
const API_URL = `${RAILWAY_URL}/api`

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  model?: string;
  provider?: string;
  cost?: number;
  tokens?: number;
  processingTime?: number;
}

interface AIServiceStore {
  apiKeys: {
    openai: string;
    anthropic: string;
    google: string;
  };
  setApiKey: (provider: 'openai' | 'anthropic' | 'google', key: string) => void;
  clearApiKeys: () => void;
  chat: (
    messages: Omit<Message, 'timestamp' | 'cost' | 'tokens' | 'processingTime'>[],
    provider: 'openai' | 'anthropic' | 'google',
    model: string,
    toolsEnabled?: boolean,
    reasoningMode?: string
  ) => Promise<Message>;
  getAvailableModels: (provider: 'openai' | 'anthropic' | 'google') => string[];
  getAvailableProviders: () => { name: string; models: string[] }[];
  getProviderInfo: (providerName: string) => { name: string; models: string[] } | undefined;
}

export const useBackendAIService = create<AIServiceStore>()(
  persist(
    (set, get) => ({
      apiKeys: {
        openai: '',
        anthropic: '',
        google: '',
      },
      setApiKey: (provider, key) => {
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: key,
          },
        }));
        toast.success(`${provider} API key saved!`);
      },
      clearApiKeys: () => {
        set({ apiKeys: { openai: '', anthropic: '', google: '' } });
        toast.success('All API keys cleared!');
      },
      chat: async (messages, provider, model, toolsEnabled = true, reasoningMode = 'advanced') => {
        const apiKey = get().apiKeys[provider];
        if (!apiKey) {
          toast.error(`Please set your ${provider} API key in settings.`);
          throw new Error(`API key for ${provider} is not set.`);
        }

        const startTime = Date.now();
        try {
          const response = await axios.post(`${API_URL}/chat`, {
            messages,
            provider,
            model,
            tools_enabled: toolsEnabled,
            reasoning_mode: reasoningMode,
          }, {
            headers: {
              'X-API-KEY': apiKey,
              'Content-Type': 'application/json',
            },
          });

          const data = response.data.data;
          const processingTime = Date.now() - startTime;

          return {
            role: 'assistant',
            content: data.message,
            timestamp: new Date().toISOString(),
            model: data.model,
            provider: data.provider,
            cost: data.cost,
            tokens: data.tokens,
            processingTime: processingTime,
          };
        } catch (error: any) {
          console.error(`Error from ${provider} AI service:`, error);
          const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred.';
          toast.error(`AI Error (${provider}): ${errorMessage}`);
          throw new Error(errorMessage);
        }
      },
      getAvailableModels: (provider) => {
        switch (provider) {
          case 'openai':
            return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'];
          case 'anthropic':
            return ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'];
          case 'google':
            return ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', 'gemini-pro'];
          default:
            return [];
        }
      },
      getAvailableProviders: () => [
        { name: 'openai', models: get().getAvailableModels('openai') },
        { name: 'anthropic', models: get().getAvailableModels('anthropic') },
        { name: 'google', models: get().getAvailableModels('google') },
      ],
      getProviderInfo: (providerName) => {
        return get().getAvailableProviders().find(p => p.name === providerName);
      }
    }),
    {
      name: 'backend-ai-service-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Helper functions for formatting
export const formatCost = (cost?: number) => {
  if (typeof cost !== 'number') return 'N/A';
  return `$${cost.toFixed(5)}`;
};

export const formatTokens = (tokens?: number) => {
  if (typeof tokens !== 'number') return 'N/A';
  return tokens.toLocaleString();
};

export const formatTime = (ms?: number) => {
  if (typeof ms !== 'number') return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Health check function
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return null;
  }
};
