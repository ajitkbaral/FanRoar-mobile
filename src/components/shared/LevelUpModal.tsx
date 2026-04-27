import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/userStore';
import { buildTheme } from '../../theme';

function tierName(level: number): string {
  if (level >= 21) return 'ULTRA TIER';
  if (level >= 11) return 'SUPER FAN';
  if (level >= 6)  return 'REGULAR';
  return 'ROOKIE';
}

export default function LevelUpModal() {
  const { isDark, teamKey, pendingLevelUp, pendingLevelUpLevel, clearLevelUp } = useUserStore();
  const theme = buildTheme(isDark, teamKey);

  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pendingLevelUp) return;
    scale.setValue(0.8);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 180, friction: 10, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [pendingLevelUp]);

  return (
    <Modal visible={pendingLevelUp} transparent animationType="none" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#00000088', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Animated.View style={{ width: '100%', borderRadius: 24, overflow: 'hidden', transform: [{ scale }], opacity }}>
          <LinearGradient
            colors={[theme.accent + 'EE', theme.bg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ padding: 36, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.bg + 'CC', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
              Level Up
            </Text>
            <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 80, color: theme.bg, letterSpacing: -4, lineHeight: 80 }}>
              {pendingLevelUpLevel}
            </Text>
            <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 13, color: theme.bg + 'CC', letterSpacing: 2, marginTop: 8 }}>
              {tierName(pendingLevelUpLevel)}
            </Text>

            <TouchableOpacity
              onPress={clearLevelUp}
              style={{
                marginTop: 36,
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: theme.bg,
              }}
            >
              <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 16, color: theme.accent, letterSpacing: -0.3 }}>
                Let's Go!
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}
