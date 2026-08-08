export type AppColors = {
  // Surfaces
  bg: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  cardAlt: string;
  // Borders
  border: string;
  borderStrong: string;
  divider: string;
  // Text
  text: string;
  textSec: string;
  textMuted: string;
  placeholder: string;
  // Brand
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primarySofter: string;
  primaryFg: string;
  onPrimary: string;
  gradFrom: string;
  gradTo: string;
  // Semantic
  success: string;
  successSoft: string;
  successText: string;
  error: string;
  errorSoft: string;
  errorText: string;
  warning: string;
  warningSoft: string;
  warningText: string;
  info: string;
  infoSoft: string;
  // UI
  tabBarBg: string;
};

export const lightColors: AppColors = {
  bg: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceAlt: '#FCFCFA',
  card: '#FFFFFF',
  cardAlt: '#F2F2EF',
  border: '#ECECE8',
  borderStrong: '#D9D9D2',
  divider: '#EFEFEB',
  text: '#0B0B12',
  textSec: '#56565F',
  textMuted: '#86868F',
  placeholder: '#A8A8AE',
  primary: '#0EA39B',
  primaryHover: '#0D7A75',
  primarySoft: 'rgba(14,163,155,0.12)',
  primarySofter: 'rgba(14,163,155,0.07)',
  primaryFg: '#FFFFFF',
  onPrimary: '#FFFFFF',
  gradFrom: '#0EA39B',
  gradTo: '#0D7A75',
  success: '#059669',
  successSoft: 'rgba(5,150,105,0.10)',
  successText: '#047857',
  error: '#E11D48',
  errorSoft: 'rgba(225,29,72,0.10)',
  errorText: '#BE123C',
  warning: '#D97706',
  warningSoft: 'rgba(217,119,6,0.10)',
  warningText: '#92400E',
  info: '#2563EB',
  infoSoft: 'rgba(37,99,235,0.08)',
  tabBarBg: 'rgba(255,255,255,0.92)',
};

export const darkColors: AppColors = {
  bg: '#0A0A10',
  surface: '#13131B',
  surfaceAlt: '#191923',
  card: '#15151E',
  cardAlt: '#1C1C26',
  border: '#23232E',
  borderStrong: '#2D2D38',
  divider: '#1E1E28',
  text: '#F4F4F1',
  textSec: '#A8A8B4',
  textMuted: '#6A6A75',
  placeholder: '#5A5A66',
  primary: '#5EE5DC',
  primaryHover: '#7EEEE7',
  primarySoft: 'rgba(14,163,155,0.20)',
  primarySofter: 'rgba(14,163,155,0.12)',
  primaryFg: '#0B0B12',
  onPrimary: '#0B0B12',
  gradFrom: '#0EA39B',
  gradTo: '#0D7A75',
  success: '#34D399',
  successSoft: 'rgba(52,211,153,0.14)',
  successText: '#6EE7B7',
  error: '#FB7185',
  errorSoft: 'rgba(251,113,133,0.14)',
  errorText: '#FDA4AF',
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.14)',
  warningText: '#FCD34D',
  info: '#60A5FA',
  infoSoft: 'rgba(96,165,250,0.14)',
  tabBarBg: 'rgba(10,10,16,0.85)',
};

export function getColors(mode: 'light' | 'dark'): AppColors {
  return mode === 'dark' ? darkColors : lightColors;
}

// Pastel avatar palette — deterministic per user id/name
const AVATAR_PALETTE: [string, string][] = [
  ['#FDE68A', '#92400E'], // amber
  ['#A7F3D0', '#065F46'], // emerald
  ['#BFDBFE', '#1E40AF'], // blue
  ['#FBCFE8', '#9D174D'], // pink
  ['#DDD6FE', '#5B21B6'], // violet
  ['#FECACA', '#991B1B'], // red
  ['#C7D2FE', '#3730A3'], // indigo
  ['#FED7AA', '#9A3412'], // orange
];

export function avatarColors(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
