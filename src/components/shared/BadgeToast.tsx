import React, { useEffect, useRef } from 'react';
import { Animated, View, Text } from 'react-native';
import { ApiBadge } from '../../api/types';
import { buildTheme } from '../../theme';
import FRIcon from './FRIcon';

interface Props {
  badge: ApiBadge | null;
  theme: ReturnType<typeof buildTheme>;
  onDone: () => void;
}

export default function BadgeToast({ badge, theme, onDone }: Props) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!badge) return;
    translateY.setValue(-80);
    opacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(2000),
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start(() => onDone());
  }, [badge]);

  if (!badge) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 100,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: badge.color + '60',
        shadowColor: badge.color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      }}>
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: badge.color,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <FRIcon name={badge.icon} size={20} color={theme.bg} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_400Regular', fontSize: 9,
            color: theme.textMute, letterSpacing: 1.2,
            textTransform: 'uppercase', marginBottom: 2,
          }}>
            Badge Unlocked
          </Text>
          <Text style={{
            fontFamily: 'InterTight_700Bold', fontSize: 16,
            color: theme.text, letterSpacing: -0.3,
          }}>
            {badge.name}
          </Text>
          <Text style={{
            fontFamily: 'JetBrainsMono_400Regular', fontSize: 9,
            color: theme.textMute, letterSpacing: 0.4,
            marginTop: 1, textTransform: 'uppercase',
          }}>
            {badge.description}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
