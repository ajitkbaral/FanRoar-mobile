import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../theme';

interface Props {
  theme: Theme;
  children: React.ReactNode;
  color?: string;
  filled?: boolean;
}

export default function FRChip({ theme, children, color, filled }: Props) {
  const c = color || theme.text;
  return (
    <View style={{
      height: 24,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: filled ? c : 'transparent',
      borderWidth: filled ? 0 : 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    }}>
      <Text style={{
        color: filled ? theme.bg : c,
        fontFamily: 'JetBrainsMono_600SemiBold',
        fontSize: 10,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
      }}>
        {children}
      </Text>
    </View>
  );
}
