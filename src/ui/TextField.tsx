import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, Platform } from 'react-native';
import { useAppTheme } from '../theme';
import { RADIUS } from '../theme/tokens';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  right?: React.ReactNode;
  suffix?: React.ReactNode;
  multiline?: boolean;
};

export default function TextField({ label, error, prefix, right, suffix, style, multiline, ...props }: TextFieldProps) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label ? (
        <Text style={[styles.label, { color: theme.textSec }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.error : focused ? theme.primary : theme.border,
            minHeight: multiline ? 88 : 44,
          },
        ]}
      >
        {prefix ? <View style={styles.prefix}>{prefix}</View> : null}
        <TextInput
          {...props}
          multiline={multiline}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          placeholderTextColor={theme.placeholder}
          style={[
            styles.input,
            { color: theme.text },
            multiline && styles.multiline,
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
          ]}
        />
        {(right || suffix) ? <View style={styles.suffix}>{right ?? suffix}</View> : null}
      </View>
      {error ? (
        <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
    letterSpacing: -0.05,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
  },
  prefix: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 10,
    letterSpacing: -0.15,
  },
  multiline: {
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  suffix: {
    marginLeft: 8,
  },
  error: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
