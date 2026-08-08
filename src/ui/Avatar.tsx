import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { avatarColors, getInitials } from '../theme/colors';
import { useAppTheme } from '../theme';

type AvatarProps = {
  id: string;
  name: string;
  size?: number;
};

export function Avatar({ id, name, size = 40 }: AvatarProps) {
  const [bg, fg] = avatarColors(id || name || '');
  const initials = getInitials(name);
  const fs = Math.round(size * 0.36);
  return (
    <View style={[
      styles.circle,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
    ]}>
      <Text style={{ color: fg, fontSize: fs, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.4 }}>
        {initials}
      </Text>
    </View>
  );
}

type AvatarStackProps = {
  ids: string[];
  names: string[];
  size?: number;
  max?: number;
  overlap?: number;
};

export function AvatarStack({ ids, names, size = 28, max = 4, overlap = 10 }: AvatarStackProps) {
  const theme = useAppTheme();
  const items = ids.slice(0, max);
  const extra = ids.length - max;
  const fs = Math.round(size * 0.32);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {items.map((id, i) => {
        const ring = size + 4;
        return (
          <View
            key={id}
            style={{
              marginLeft: i === 0 ? 0 : -overlap,
              width: ring,
              height: ring,
              borderRadius: ring / 2,
              borderWidth: 2,
              borderColor: theme.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Avatar id={id} name={names[i] || ''} size={size} />
          </View>
        );
      })}
      {extra > 0 && (
        <View style={[
          styles.overflow,
          {
            marginLeft: -overlap,
            width: size + 4, height: size + 4, borderRadius: (size + 4) / 2,
            backgroundColor: theme.cardAlt, borderWidth: 2, borderColor: theme.card,
          },
        ]}>
          <Text style={{ color: theme.textSec, fontSize: fs, fontFamily: 'Inter_600SemiBold' }}>
            +{extra}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  overflow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
