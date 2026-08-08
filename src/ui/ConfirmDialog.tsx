import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  danger,
}: Props) {
  const theme = useAppTheme();

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textSec }]}>{message}</Text>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelLabel, { color: theme.textSec }]}>Cancel</Text>
            </Pressable>
            <View style={[styles.actionDivider, { backgroundColor: theme.divider }]} />
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              onPress={onConfirm}
            >
              <Text
                style={[
                  styles.confirmLabel,
                  { color: danger ? theme.error : theme.primary },
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
    padding: 20,
    paddingBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  divider: {
    height: 1,
  },
  actions: {
    flexDirection: 'row',
    height: 48,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDivider: {
    width: 1,
  },
  pressed: {
    opacity: 0.6,
  },
  cancelLabel: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
