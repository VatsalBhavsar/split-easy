import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserProfile } from '../types/user';
import { useAppTheme, avatarColors, getInitials } from '../theme';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  members: UserProfile[];
  selectedId: string;
  onSelect: (id: string) => void;
  title?: string;
};

export default function MemberPickerModal({
  visible,
  onDismiss,
  members,
  selectedId,
  onSelect,
  title = 'Select member',
}: Props) {
  const theme = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => {}}
        >
          {/* Handle bar */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />
          </View>

          <Text style={[styles.sheetTitle, { color: theme.text }]}>{title}</Text>

          <ScrollView>
            {members.map((m) => {
              const name = m.displayName || m.email || m.id;
              const initials = getInitials(name);
              const [bg, fg] = avatarColors(m.id);
              const selected = selectedId === m.id;

              return (
                <Pressable
                  key={m.id}
                  style={({ pressed }) => [
                    styles.row,
                    { borderBottomColor: theme.divider },
                    pressed && { backgroundColor: theme.cardAlt },
                  ]}
                  onPress={() => { onSelect(m.id); onDismiss(); }}
                >
                  <View style={[styles.avatar, { backgroundColor: bg }]}>
                    <Text style={[styles.avatarText, { color: fg }]}>{initials}</Text>
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowName, { color: theme.text }]} numberOfLines={1}>
                      {name}
                    </Text>
                    {m.email && m.displayName ? (
                      <Text style={[styles.rowEmail, { color: theme.textMuted }]} numberOfLines={1}>
                        {m.email}
                      </Text>
                    ) : null}
                  </View>
                  {selected ? (
                    <MaterialCommunityIcons name="check" size={20} color={theme.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '75%',
    paddingBottom: 32,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.3,
  },
  rowContent: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    letterSpacing: -0.15,
  },
  rowEmail: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
});
