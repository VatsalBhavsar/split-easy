import { createFont, createTamagui, createTokens } from 'tamagui';
import { animationsReactNative } from '@tamagui/config/v5-rn';
import { shorthands } from '@tamagui/shorthands/v4';
import { media, mediaQueryDefaultActive } from '@tamagui/config/dist/cjs/v5-media.cjs';

// ─── Spacing & Sizing (8pt grid) ─────────────────────────────────────────────
const space = {
  $0: 0, $0_5: 2, $1: 4, $1_5: 6, $2: 8, $2_5: 10,
  $3: 12, $3_5: 14, $4: 16, $5: 20, $6: 24, $7: 28,
  $8: 32, $9: 36, $10: 40, $12: 48, $14: 56, $16: 64,
  true: 16,
} as const;

const size = {
  $0: 0, $0_5: 2, $1: 4, $1_5: 6, $2: 8, $2_5: 10,
  $3: 12, $3_5: 14, $4: 16, $5: 20, $6: 24, $7: 28,
  $8: 32, $9: 36, $10: 40, $12: 48, $14: 56, $16: 64,
  true: 16,
} as const;

// ─── Radius ───────────────────────────────────────────────────────────────────
const radius = {
  $0: 0, $1: 4, $2: 8, $3: 10, $4: 12, $5: 16, $6: 20, $7: 24, $8: 32,
  $sm: 8, $input: 10, $btn: 12, $card: 16, $lg: 20, $pill: 9999,
  true: 10,
} as const;

// ─── Z-index ──────────────────────────────────────────────────────────────────
const zIndex = {
  $0: 0, $1: 100, $2: 200, $3: 300, $4: 400, $5: 500,
} as const;

// ─── Color palette ────────────────────────────────────────────────────────────
const color = {
  // Light surfaces
  lightBg: '#F7F7F4',
  lightSurface: '#FFFFFF',
  lightCard: '#FFFFFF',
  lightCardAlt: '#F2F2EF',
  lightBorder: '#ECECE8',
  lightBorderStrong: '#D9D9D2',
  lightDivider: '#EFEFEB',
  // Light text
  lightText: '#0B0B12',
  lightTextSec: '#56565F',
  lightTextMuted: '#86868F',
  lightPlaceholder: '#A8A8AE',
  // Light brand (teal)
  lightPrimary: '#0D9488',
  lightPrimaryHover: '#0B7D72',
  lightPrimarySoft: '#F0FDFA',
  lightOnPrimary: '#FFFFFF',
  lightGradFrom: '#0B7D72',
  lightGradTo: '#06665C',
  // Light semantic
  lightSuccess: '#059669',
  lightSuccessSoft: 'rgba(5,150,105,0.10)',
  lightSuccessText: '#047857',
  lightError: '#E11D48',
  lightErrorSoft: 'rgba(225,29,72,0.10)',
  lightErrorText: '#BE123C',
  lightWarning: '#D97706',
  lightWarningSoft: 'rgba(217,119,6,0.10)',
  lightWarningText: '#92400E',
  lightInfo: '#2563EB',
  lightInfoSoft: 'rgba(37,99,235,0.08)',
  // Light UI
  lightTabBarBg: 'rgba(255,255,255,0.92)',
  lightShadow: '0 1px 2px rgba(11,11,18,0.04), 0 8px 24px rgba(11,11,18,0.06)',

  // Dark surfaces
  darkBg: '#0A0A10',
  darkSurface: '#13131B',
  darkCard: '#15151E',
  darkCardAlt: '#1C1C26',
  darkBorder: '#23232E',
  darkBorderStrong: '#2D2D38',
  darkDivider: '#1E1E28',
  // Dark text
  darkText: '#F4F4F1',
  darkTextSec: '#A8A8B4',
  darkTextMuted: '#6A6A75',
  darkPlaceholder: '#5A5A66',
  // Dark brand (teal)
  darkPrimary: '#2DD4BF',
  darkPrimaryHover: '#5EEAD4',
  darkPrimarySoft: 'rgba(45,212,191,0.14)',
  darkOnPrimary: '#0B0B12',
  darkGradFrom: '#14B8A6',
  darkGradTo: '#0D9488',
  // Dark semantic
  darkSuccess: '#34D399',
  darkSuccessSoft: 'rgba(52,211,153,0.14)',
  darkSuccessText: '#6EE7B7',
  darkError: '#FB7185',
  darkErrorSoft: 'rgba(251,113,133,0.14)',
  darkErrorText: '#FDA4AF',
  darkWarning: '#FBBF24',
  darkWarningSoft: 'rgba(251,191,36,0.14)',
  darkWarningText: '#FCD34D',
  darkInfo: '#60A5FA',
  darkInfoSoft: 'rgba(96,165,250,0.14)',
  // Dark UI
  darkTabBarBg: 'rgba(10,10,16,0.85)',
} as const;

const tokens = createTokens({ color, space, size, radius, zIndex });

// ─── Themes ───────────────────────────────────────────────────────────────────
const lightTheme = {
  // Required Tamagui standard keys (used by Input, Button, etc.)
  background: color.lightCard,
  backgroundHover: color.lightCardAlt,
  backgroundPress: color.lightBorder,
  backgroundFocus: color.lightCard,
  backgroundStrong: color.lightBg,
  backgroundTransparent: 'rgba(255,255,255,0)',
  color: color.lightText,
  colorHover: color.lightText,
  colorPress: color.lightText,
  colorFocus: color.lightText,
  colorTransparent: 'rgba(11,11,18,0)',
  borderColor: color.lightBorder,
  borderColorHover: color.lightBorderStrong,
  borderColorPress: color.lightBorderStrong,
  borderColorFocus: color.lightPrimary,
  shadowColor: 'rgba(11,11,18,0.06)',
  shadowColorHover: 'rgba(11,11,18,0.08)',
  placeholderColor: color.lightPlaceholder,
  outlineColor: color.lightPrimary,
  // Custom design tokens
  bg: color.lightBg,
  surface: color.lightSurface,
  card: color.lightCard,
  cardAlt: color.lightCardAlt,
  divider: color.lightDivider,
  textSec: color.lightTextSec,
  textMuted: color.lightTextMuted,
  primary: color.lightPrimary,
  primaryHover: color.lightPrimaryHover,
  primarySoft: color.lightPrimarySoft,
  onPrimary: color.lightOnPrimary,
  gradFrom: color.lightGradFrom,
  gradTo: color.lightGradTo,
  success: color.lightSuccess,
  successSoft: color.lightSuccessSoft,
  successText: color.lightSuccessText,
  error: color.lightError,
  errorSoft: color.lightErrorSoft,
  errorText: color.lightErrorText,
  warning: color.lightWarning,
  warningSoft: color.lightWarningSoft,
  warningText: color.lightWarningText,
  info: color.lightInfo,
  infoSoft: color.lightInfoSoft,
  tabBarBg: color.lightTabBarBg,
};

const darkTheme = {
  background: color.darkCard,
  backgroundHover: color.darkCardAlt,
  backgroundPress: color.darkBorder,
  backgroundFocus: color.darkCard,
  backgroundStrong: color.darkBg,
  backgroundTransparent: 'rgba(15,15,30,0)',
  color: color.darkText,
  colorHover: color.darkText,
  colorPress: color.darkText,
  colorFocus: color.darkText,
  colorTransparent: 'rgba(244,244,241,0)',
  borderColor: color.darkBorder,
  borderColorHover: color.darkBorderStrong,
  borderColorPress: color.darkBorderStrong,
  borderColorFocus: color.darkPrimary,
  shadowColor: 'rgba(0,0,0,0.4)',
  shadowColorHover: 'rgba(0,0,0,0.5)',
  placeholderColor: color.darkPlaceholder,
  outlineColor: color.darkPrimary,
  // Custom design tokens
  bg: color.darkBg,
  surface: color.darkSurface,
  card: color.darkCard,
  cardAlt: color.darkCardAlt,
  divider: color.darkDivider,
  textSec: color.darkTextSec,
  textMuted: color.darkTextMuted,
  primary: color.darkPrimary,
  primaryHover: color.darkPrimaryHover,
  primarySoft: color.darkPrimarySoft,
  onPrimary: color.darkOnPrimary,
  gradFrom: color.darkGradFrom,
  gradTo: color.darkGradTo,
  success: color.darkSuccess,
  successSoft: color.darkSuccessSoft,
  successText: color.darkSuccessText,
  error: color.darkError,
  errorSoft: color.darkErrorSoft,
  errorText: color.darkErrorText,
  warning: color.darkWarning,
  warningSoft: color.darkWarningSoft,
  warningText: color.darkWarningText,
  info: color.darkInfo,
  infoSoft: color.darkInfoSoft,
  tabBarBg: color.darkTabBarBg,
};

// ─── Fonts ────────────────────────────────────────────────────────────────────
const interFont = createFont({
  family: 'Inter',
  size: {
    1: 11, 2: 12, 3: 13, 4: 14, 5: 15, 6: 16, 7: 18, 8: 20, 9: 22,
    10: 24, 11: 28, 12: 32, 13: 36, true: 15,
  },
  lineHeight: {
    1: 16, 2: 18, 3: 19, 4: 20, 5: 21, 6: 22, 7: 25, 8: 27, 9: 28,
    10: 30, 11: 35, 12: 38, 13: 42, true: 21,
  },
  weight: {
    1: '400', 2: '400', 3: '400', 4: '400', 5: '400', 6: '500',
    7: '600', 8: '600', 9: '600', 10: '700', 11: '700', 12: '700', 13: '700',
  },
  letterSpacing: {
    1: 0.5, 2: 0.5, 3: 0, 4: 0, 5: -0.07, 6: -0.15, 7: -0.15,
    8: -0.2, 9: -0.2, 10: -0.25, 11: -0.3, 12: -0.3, 13: -0.35,
  },
  face: {
    400: { normal: 'Inter_400Regular' },
    500: { normal: 'Inter_500Medium' },
    600: { normal: 'Inter_600SemiBold' },
    700: { normal: 'Inter_700Bold' },
  },
});

// ─── Config ───────────────────────────────────────────────────────────────────
export const config = createTamagui({
  animations: animationsReactNative,
  defaultTheme: 'dark',
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  shorthands,
  fonts: {
    body: interFont,
    heading: interFont,
    mono: interFont,
  },
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  tokens,
  media,
  settings: {
    mediaQueryDefaultActive,
    fastSchemeChange: true,
    styleCompat: 'react-native',
  },
});

export type Conf = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default config;
