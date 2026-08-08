import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenPadding: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryValue: {
    fontWeight: '800',
    marginTop: 4,
  },
  summaryMuted: {
    opacity: 0.7,
    marginTop: 4,
  },
});

