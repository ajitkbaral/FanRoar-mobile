import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { buildTheme } from '../../theme';
import { useUserStore } from '../../store/userStore';
import { useShakeDetector } from '../../hooks/useShakeDetector';
import FRIcon from '../shared/FRIcon';

const RADIUS = 112;
const STROKE = 14;
const SVG_SIZE = (RADIUS + STROKE) * 2 + 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TARGET = 80;
const GAME_DURATION = 30;

type Phase = 'countdown' | 'active' | 'done';

interface Props {
  onClose: () => void;
  onComplete?: (gameState: { shakeCount: number }) => void;
}

export default function HypeBomb({ onClose, onComplete }: Props) {
  const { isDark, teamCode } = useUserStore();
  const theme = buildTheme(isDark, teamCode);

  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [shakeCount, setShakeCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

  const phaseRef = useRef<Phase>('countdown');
  const shakeCountRef = useRef(0);

  useEffect(() => {
    if (phase === 'done') onComplete?.({ shakeCount: shakeCountRef.current });
  }, [phase]);

  const countdownScale = useRef(new Animated.Value(0)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const handleShake = useCallback(() => {
    if (phaseRef.current !== 'active') return;
    shakeCountRef.current += 1;
    setShakeCount(shakeCountRef.current);
  }, []);

  useShakeDetector({ onShake: handleShake, enabled: phase === 'active' });

  // Countdown 3 → 2 → 1 → GO
  useEffect(() => {
    let count = 3;

    function tick() {
      countdownScale.setValue(0);
      Animated.spring(countdownScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();

      if (count === 0) {
        // GO
        setCountdown(0);
        setTimeout(() => {
          setPhaseSync('active');
          startGameTimer();
        }, 600);
        return;
      }
      setCountdown(count);
      count -= 1;
      setTimeout(tick, 900);
    }

    const initial = setTimeout(tick, 300);
    return () => clearTimeout(initial);
  }, []);

  // Ring pulse during active phase
  useEffect(() => {
    if (phase !== 'active') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, { toValue: 1.025, duration: 500, useNativeDriver: true }),
        Animated.timing(ringPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase]);

  function startGameTimer() {
    let left = GAME_DURATION;
    const interval = setInterval(() => {
      left -= 1;
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        setPhaseSync('done');
        Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
    }, 1000);
  }

  const fillProgress = Math.min(shakeCountRef.current / TARGET, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - fillProgress);
  const success = shakeCountRef.current >= TARGET;

  if (phase === 'done') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 60, right: 20 }}>
          <FRIcon name="close" size={22} color={theme.textDim} />
        </TouchableOpacity>

        <Animated.View style={{ alignItems: 'center', opacity: successOpacity }}>
          <FRIcon
            name={success ? 'bolt' : 'drum'}
            size={48}
            color={success ? theme.accent : theme.textDim}
          />
          <Text style={{
            fontFamily: 'InterTight_700Bold',
            fontSize: 28,
            color: success ? theme.text : theme.textDim,
            letterSpacing: -1,
            marginTop: 16,
            textAlign: 'center',
            paddingHorizontal: 32,
          }}>
            {success ? 'MEGA CHEER\nUNLOCKED' : `SO CLOSE —\n${shakeCountRef.current}/${TARGET} SHAKES`}
          </Text>
          <Text style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 11,
            color: theme.textMute,
            letterSpacing: 0.8,
            marginTop: 8,
            textTransform: 'uppercase',
          }}>
            {success ? 'Power-up active for 2nd half' : 'Try again next half-time'}
          </Text>
          <View style={{ marginTop: 28, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.surface }}>
            <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 18, color: theme.accent, letterSpacing: 1 }}>
              +{success ? 150 : 60} XP
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16 }}>
        <View>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            HYPE BOMB
          </Text>
          <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 26, color: theme.text, letterSpacing: -0.5, marginTop: 2 }}>
            {phase === 'countdown' ? 'Get ready...' : `${timeLeft}s left`}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <FRIcon name="close" size={22} color={theme.textDim} />
        </TouchableOpacity>
      </View>

      {/* Goal pill */}
      {phase === 'active' && (
        <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textDim }}>
            Shake {TARGET} times to unlock Mega Cheer
          </Text>
        </View>
      )}

      {/* Ring + counter */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ transform: [{ scale: ringPulse }] }}>
          <Svg width={SVG_SIZE} height={SVG_SIZE}>
            {/* Track */}
            <Circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={theme.surface2}
              strokeWidth={STROKE}
            />
            {/* Progress fill */}
            <Circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={phase === 'active' ? theme.accent : theme.borderStrong}
              strokeWidth={STROKE}
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={`${strokeDashoffset}`}
              strokeLinecap="round"
              rotation="-90"
              origin={`${SVG_SIZE / 2}, ${SVG_SIZE / 2}`}
            />
          </Svg>

          {/* Center content */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {phase === 'active' ? (
              <>
                <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 56, color: theme.text, letterSpacing: -3 }}>
                  {shakeCount}
                </Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.5 }}>
                  / {TARGET} SHAKES
                </Text>
              </>
            ) : (
              <Animated.Text style={{
                fontFamily: 'InterTight_700Bold',
                fontSize: countdown === 0 ? 42 : 68,
                color: countdown === 0 ? theme.accent : theme.text,
                letterSpacing: -3,
                transform: [{ scale: countdownScale }],
              }}>
                {countdown === 0 ? 'GO!' : `${countdown}`}
              </Animated.Text>
            )}
          </View>
        </Animated.View>

        {/* Progress label */}
        {phase === 'active' && (
          <View style={{
            marginTop: 28,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: theme.surface,
          }}>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textDim }}>
              {Math.round(fillProgress * 100)}% charged
            </Text>
          </View>
        )}
      </View>

      {/* Shake instruction */}
      {phase === 'active' && (
        <View style={{
          marginHorizontal: 20,
          marginBottom: 32,
          padding: 16,
          borderRadius: 16,
          backgroundColor: theme.surface,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <FRIcon name="shake" size={22} color={theme.accent} />
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: theme.textDim, flex: 1, lineHeight: 17 }}>
            Shake your phone as hard and fast as you can! Hit {TARGET} to unlock Mega Cheer.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
