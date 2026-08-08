import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../theme';

type Segment = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  buttons: Segment[];
  style?: ViewStyle;
};

export default function SegmentedControl({ value, onValueChange, buttons, style }: Props) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: theme.cardAlt, borderColor: theme.border },
        style,
      ]}
    >
      {buttons.map((btn) => {
        const active = btn.value === value;
        return (
          <Pressable
            key={btn.value}
            onPress={() => onValueChange(btn.value)}
            style={[
              styles.segment,
              active && [styles.activeSegment, { backgroundColor: theme.card }],
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? theme.text : theme.textSec },
                active && styles.activeLabel,
              ]}
            >
              {btn.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeSegment: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  activeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
});
