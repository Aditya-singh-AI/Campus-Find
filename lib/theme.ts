export const Colors = {
  primary: '#1A56DB',
  primaryLight: '#EBF0FF',
  primaryDark: '#1040B0',
  secondary: '#7C3AED',
  secondaryLight: '#F3EEFF',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#D1FAE5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  lost: '#EF4444',
  lostLight: '#FEE2E2',
  found: '#10B981',
  foundLight: '#D1FAE5',

  background: '#F8FAFF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textLight: '#FFFFFF',

  urgent: '#EF4444',
  urgentLight: '#FEE2E2',
  normal: '#6B7280',
  normalLight: '#F3F4F6',

  tabBar: '#FFFFFF',
  tabBarActive: '#1A56DB',
  tabBarInactive: '#9CA3AF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

import { Platform } from 'react-native';

export const Shadow = {
  sm: Platform.select({
    web: {
      boxShadow: '0px 1px 4px rgba(0,0,0,0.05)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
  }),
  md: Platform.select({
    web: {
      boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
  }),
  lg: Platform.select({
    web: {
      boxShadow: '0px 4px 16px rgba(0,0,0,0.12)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  }),
};

export const categoryIcons: Record<string, string> = {
  Electronics: 'laptop-outline',
  Documents: 'document-text-outline',
  Clothing: 'shirt-outline',
  Accessories: 'glasses-outline',
  Books: 'book-outline',
  Keys: 'key-outline',
  Bags: 'bag-outline',
  Sports: 'football-outline',
  Other: 'cube-outline',
};

export const categoryColors: Record<string, { bg: string; text: string }> = {
  Electronics: { bg: '#DBEAFE', text: '#1D4ED8' },
  Documents: { bg: '#FEF3C7', text: '#92400E' },
  Clothing: { bg: '#FCE7F3', text: '#9D174D' },
  Accessories: { bg: '#E0E7FF', text: '#3730A3' },
  Books: { bg: '#D1FAE5', text: '#065F46' },
  Keys: { bg: '#FEE2E2', text: '#991B1B' },
  Bags: { bg: '#FEF9C3', text: '#713F12' },
  Sports: { bg: '#FFEDD5', text: '#9A3412' },
  Other: { bg: '#F3F4F6', text: '#374151' },
};
