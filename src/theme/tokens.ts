export const RADIUS = {
  sm: 8,
  input: 10,
  btn: 12,
  card: 16,
  lg: 20,
  pill: 9999,
} as const;

export const SPACE = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40,
} as const;

// Legacy aliases kept for compatibility
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 48,
} as const;

export const radius = {
  sm: RADIUS.sm,
  md: RADIUS.input,
  lg: RADIUS.btn,
  full: RADIUS.pill,
} as const;

export const opacity = {
  muted: 0.7,
  hint: 0.6,
  divider: 0.08,
} as const;

export const shadow = {
  card: {
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  soft: {
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  fab: {
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
} as const;
