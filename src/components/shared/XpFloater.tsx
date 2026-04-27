import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useUserStore } from '../../store/userStore';
import { buildTheme } from '../../theme';

interface Props {
  amount: number | null;
  onDone: () => void;
}

export default function XpFloater({ amount, onDone }: Props) {
  const { isDark, teamKey } = useUserStore();
  const theme = buildTheme(isDark, teamKey);

  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (amount === null) return;

    translateY.setValue(0);
    opacity.setValue(1);

    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 900, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start(() => onDone());
  }, [amount]);

  if (amount === null) return null;

  return (
    <Animated.Text
      style={[
        styles.floater,
        { color: theme.accent, transform: [{ translateY }], opacity },
      ]}
    >
      +{amount} XP
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  floater: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: '45%',
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 22,
    letterSpacing: 1,
    zIndex: 100,
  },
});
