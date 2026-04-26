import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Theme } from '../../theme';
import FRIcon from '../shared/FRIcon';
import { FanRole } from '../../utils/constants';

interface Burst {
  id: string;
  x: number;
  y: number;
}

interface Floater {
  id: string;
  gain: number;
  x: number;
}

interface Props {
  theme: Theme;
  onTap: () => void;
  onHoldRelease: (progress: number) => void;
  holdProgress: number;
  bursts: Burst[];
  floaters: Floater[];
  combo: number;
  role: FanRole;
  activePowerup: string | null;
  disabled?: boolean;
  disabledLabel?: string;
}

export default function ShakeZone({
  theme,
  onTap,
  onHoldRelease,
  holdProgress,
  bursts,
  floaters,
  combo,
  role,
  activePowerup,
  disabled = false,
  disabledLabel,
}: Props) {
  const isMega = activePowerup === 'mega';
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdProgressRef = useRef(0);
  const [localProgress, setLocalProgress] = useState(0);

  const circleCircumference = 2 * Math.PI * 80; // r=80

  const startHold = () => {
    holdProgressRef.current = 0;
    holdTimer.current = setInterval(() => {
      holdProgressRef.current += 60 / 3000 * 100;
      const clamped = Math.min(100, holdProgressRef.current);
      setLocalProgress(clamped);
      if (clamped >= 100) {
        stopHold();
        onHoldRelease(100);
      }
    }, 60);
  };

  const stopHold = () => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    if (holdProgressRef.current > 30 && holdProgressRef.current < 100) {
      onHoldRelease(holdProgressRef.current);
    }
    holdProgressRef.current = 0;
    setLocalProgress(0);
  };

  const roleLabel = role === 'drummer' ? 'TAP STORM' : role === 'chanter' ? 'VOICE CHEER' : 'SHAKE / TAP';

  const strokeDash = (localProgress / 100) * circleCircumference;

  return (
    <TouchableWithoutFeedback
      onPressIn={disabled ? undefined : () => { onTap(); startHold(); }}
      onPressOut={disabled ? undefined : stopHold}
    >
      <View style={{
        marginHorizontal: 20,
        marginVertical: 8,
        height: 220,
        borderRadius: 22,
        backgroundColor: theme.surface,
        borderWidth: 0.5,
        borderColor: theme.border,
        overflow: 'hidden',
        shadowColor: isMega ? theme.accent : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Radial accent backdrop */}
        <View style={{
          position: 'absolute',
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'transparent',
        }}>
          <View style={{
            position: 'absolute',
            ...StyleSheet.absoluteFillObject,
            borderRadius: 22,
            backgroundColor: theme.accent + '10',
          }} />
        </View>

        {/* Concentric rings */}
        {[0, 1, 2].map((i) => (
          <View key={i} style={{
            position: 'absolute',
            width: 180 - i * 56,
            height: 180 - i * 56,
            borderRadius: 90 - i * 28,
            borderWidth: 1,
            borderColor: theme.accent + (i === 0 ? '50' : i === 1 ? '30' : '15'),
          }} />
        ))}

        {/* Hold-to-charge ring */}
        {localProgress > 0 && (
          <Svg
            width={180}
            height={180}
            style={{ position: 'absolute' }}
            viewBox="0 0 180 180"
          >
            <SvgCircle
              cx="90"
              cy="90"
              r="80"
              fill="none"
              stroke={theme.accent}
              strokeWidth={3}
              strokeDasharray={`${strokeDash} ${circleCircumference}`}
              strokeLinecap="round"
              rotation="-90"
              origin="90, 90"
            />
          </Svg>
        )}

        {/* Burst particles */}
        {bursts.map((b) => (
          <BurstParticle key={b.id} color={theme.accent} />
        ))}

        {/* +N floaters */}
        {floaters.map((f) => (
          <FloaterText key={f.id} gain={f.gain} x={f.x} color={theme.accent} />
        ))}

        {/* Center label */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 10,
            color: theme.textMute,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            {roleLabel}
          </Text>
          <Text style={{
            fontFamily: 'InterTight_800ExtraBold',
            fontSize: 32,
            color: theme.text,
            letterSpacing: -1,
          }}>
            {combo > 0 ? `${combo}× COMBO` : 'GO'}
          </Text>
          {isMega && (
            <Text style={{
              marginTop: 6,
              fontFamily: 'JetBrainsMono_700Bold',
              fontSize: 11,
              color: theme.accent,
              letterSpacing: 1,
            }}>
              MEGA CHEER · 10×
            </Text>
          )}
        </View>

        {/* Input chips */}
        <View style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 12,
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
        }}>
          <InputChip theme={theme} icon="shake" label="SHAKE" sub="2.5G" />
          <InputChip theme={theme} icon="bolt" label="TAP" sub="× COMBO" />
          <InputChip theme={theme} icon="mic" label="VOICE" sub=">65 dB" />
        </View>

        {/* Disabled overlay for halftime / full-time */}
        {disabled && (
          <View style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: theme.bg + 'C0',
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{
              fontFamily: 'JetBrainsMono_700Bold',
              fontSize: 13,
              color: theme.textMute,
              letterSpacing: 1.5,
              textAlign: 'center',
            }}>
              {disabledLabel ?? 'INTERACTION PAUSED'}
            </Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

function BurstParticle({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1.5, duration: 600, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: color + '80',
      transform: [{ scale }],
      opacity,
    }} />
  );
}

function FloaterText({ gain, x, color }: { gain: number; x: number; color: string }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(translateY, { toValue: -20, duration: 270, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.1, duration: 270, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 630, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 630, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 630, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text style={{
      position: 'absolute',
      left: `${x}%` as any,
      top: '50%',
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 22,
      color,
      transform: [{ translateY }, { scale }],
      opacity,
    }}>
      +{gain}
    </Animated.Text>
  );
}

function InputChip({ theme, icon, label, sub }: { theme: Theme; icon: string; label: string; sub: string }) {
  return (
    <View style={{
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 10,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      borderWidth: 0.5,
      borderColor: theme.border,
      alignItems: 'center',
      gap: 2,
    }}>
      <FRIcon name={icon} size={14} color={theme.textDim} />
      <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 9, color: theme.text, letterSpacing: 0.4 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 8, color: theme.textMute, letterSpacing: 0.4 }}>
        {sub}
      </Text>
    </View>
  );
}

