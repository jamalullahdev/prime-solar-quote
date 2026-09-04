import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quotation, TemplateDefinition, CalculatorSettings, LineItem } from '../types';
import { SEED_TEMPLATES } from '../data/seedTemplates';
import { DEFAULT_CALCULATOR_SETTINGS } from '../utils/solarCalculations';

const STORAGE_KEY_QUOTATIONS = 'prime_solar_quotations_v1';
const STORAGE_KEY_TEMPLATES = 'prime_solar_templates_v1';
const STORAGE_KEY_SETTINGS = 'prime_solar_settings_v1';

interface PrimeState {
  quotations: Quotation[];
  templates: TemplateDefinition[];
  calculatorSettings: CalculatorSettings;
  isLoading: boolean;

  // Lifecycle
  loadState: () => Promise<void>;

  // Quotation CRUD
  saveQuotation: (quotation: Quotation) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  getQuotation: (id: string) => Quotation | undefined;

  // Template CRUD
  saveTemplate: (template: TemplateDefinition) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  getTemplate: (id: string) => TemplateDefinition | undefined;

  // Settings
  updateCalculatorSettings: (settings: Partial<CalculatorSettings>) => Promise<void>;
}

export const usePrimeStore = create<PrimeState>((set, get) => ({
  quotations: [],
  templates: SEED_TEMPLATES,
  calculatorSettings: DEFAULT_CALCULATOR_SETTINGS,
  isLoading: true,

  loadState: async () => {
    try {
      const [savedQuotes, savedTemplates, savedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_QUOTATIONS),
        AsyncStorage.getItem(STORAGE_KEY_TEMPLATES),
        AsyncStorage.getItem(STORAGE_KEY_SETTINGS),
      ]);

      let quotes: Quotation[] = [];
      if (savedQuotes) {
        try {
          quotes = JSON.parse(savedQuotes);
        } catch (e) {}
      }

      let templates = SEED_TEMPLATES;
      if (savedTemplates) {
        try {
          const parsed: TemplateDefinition[] = JSON.parse(savedTemplates);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const customOnes = parsed.filter((t) => !t.isBuiltIn);
            templates = [...SEED_TEMPLATES, ...customOnes];
          }
        } catch (e) {}
      }

      let settings = DEFAULT_CALCULATOR_SETTINGS;
      if (savedSettings) {
        try {
          settings = { ...DEFAULT_CALCULATOR_SETTINGS, ...JSON.parse(savedSettings) };
        } catch (e) {}
      }

      set({
        quotations: quotes,
        templates,
        calculatorSettings: settings,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load Prime Solar store state:', err);
      set({ isLoading: false });
    }
  },

  saveQuotation: async (quotation: Quotation) => {
    const current = get().quotations;
    const existingIndex = current.findIndex((q) => q.id === quotation.id);
    let updated: Quotation[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...quotation, updatedAt: Date.now() };
    } else {
      updated = [quotation, ...current];
    }

    set({ quotations: updated });
    await AsyncStorage.setItem(STORAGE_KEY_QUOTATIONS, JSON.stringify(updated));
  },

  deleteQuotation: async (id: string) => {
    const filtered = get().quotations.filter((q) => q.id !== id);
    set({ quotations: filtered });
    await AsyncStorage.setItem(STORAGE_KEY_QUOTATIONS, JSON.stringify(filtered));
  },

  getQuotation: (id: string) => {
    return get().quotations.find((q) => q.id === id);
  },

  saveTemplate: async (template: TemplateDefinition) => {
    const current = get().templates;
    const existingIndex = current.findIndex((t) => t.id === template.id);
    let updated: TemplateDefinition[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = template;
    } else {
      updated = [...current, template];
    }

    set({ templates: updated });
    await AsyncStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
  },

  deleteTemplate: async (id: string) => {
    const filtered = get().templates.filter((t) => t.id !== id);
    set({ templates: filtered });
    await AsyncStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(filtered));
  },

  getTemplate: (id: string) => {
    return get().templates.find((t) => t.id === id) || get().templates[0];
  },

  updateCalculatorSettings: async (settings: Partial<CalculatorSettings>) => {
    const updated = { ...get().calculatorSettings, ...settings };
    set({ calculatorSettings: updated });
    await AsyncStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
  },
}));
