import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../../theme';

interface Props {
  theme: Theme;
  children: React.ReactNode;
  padding?: number;
  style?: ViewStyle;
  onPress?: () => void;
}

export default function FRCard({ theme, children, padding = 16, style, onPress }: Props) {
  const cardStyle: ViewStyle = {
    backgroundColor: theme.surface,
    borderWidth: 0.5,
    borderColor: theme.border,
    borderRadius: 18,
    padding,
  };

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[cardStyle, style]}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
