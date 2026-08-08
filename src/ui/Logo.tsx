import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme';

type Props = { size?: number };

export default function Logo({ size = 40 }: Props) {
  const theme = useAppTheme();
  const r  = Math.round(size * 0.227);
  const bh = Math.round(size * 0.109);
  const bw = Math.round(size * 0.391);
  const br = Math.round(size * 0.055);
  return (
    <View style={{ width: size, height: size, borderRadius: r, overflow: 'hidden' }}>
      <LinearGradient
        colors={[theme.gradFrom, theme.gradTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size }}
      >
        <View style={{
          position: 'absolute',
          top: Math.round(size * 0.359), left: Math.round(size * 0.266),
          width: bw, height: bh, borderRadius: br, backgroundColor: '#fff',
        }} />
        <View style={{
          position: 'absolute',
          top: Math.round(size * 0.531), left: Math.round(size * 0.344),
          width: bw, height: bh, borderRadius: br, backgroundColor: '#fff',
        }} />
      </LinearGradient>
    </View>
  );
}
