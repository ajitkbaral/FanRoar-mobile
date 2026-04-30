import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { buildTheme } from '../../theme';
import { useUserStore } from '../../store/userStore';
import FRIcon from '../shared/FRIcon';

const { width } = Dimensions.get('window');
const BALL = 68;
const ROUNDS = 5;
const WINDOW_MS = 850;

type Phase = 'waiting' | 'ready' | 'hit' | 'miss' | 'done';

interface Props {
  onClose: () => void;
  onComplete?: (gameState: { hitsMs: number[] }) => void;
}

export default function ReactionChallenge({ onClose, onComplete }: Props) {
  const { isDark, teamCode } = useUserStore();
  const theme = buildTheme(isDark, teamCode);

  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>('waiting');
  const [ballPos, setBallPos] = useState({ x: 0, y: 0 });
  const [lastMs, setLastMs] = useState<number | null>(null);

  useEffect(() => {
    if (phase === 'done') onComplete?.({ hitsMs: reactionsRef.current });
  }, [phase]);

  const phaseRef = useRef<Phase>('waiting');
  const roundRef = useRef(1);
  const shownAtRef = useRef(0);
  const reactionsRef = useRef<number[]>([]);

  const ballScale = useRef(new Animated.Value(0)).current;
  const floaterY = useRef(new Animated.Value(0)).current;
  const floaterOpacity = useRef(new Animated.Value(0)).current;

  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const scheduleNextBall = useCallback(() => {
    const delay = 1400 + Math.random() * 2200;
    delayRef.current = setTimeout(() => {
      if (phaseRef.current !== 'waiting') return;
      const x = 24 + Math.random() * (width - BALL - 48);
      const y = 110 + Math.random() * 260;
      setBallPos({ x, y });
      shownAtRef.current = Date.now();
      setPhaseSync('ready');
      ballScale.setValue(0);
      Animated.spring(ballScale, { toValue: 1, tension: 220, friction: 8, useNativeDriver: true }).start();

      autoHideRef.current = setTimeout(() => {
        if (phaseRef.current === 'ready') {
          registerResult(WINDOW_MS, false);
        }
      }, WINDOW_MS);
    }, delay);
  }, []);

  const registerResult = useCallback((ms: number, hit: boolean) => {
    if (autoHideRef.current) clearTimeout(autoHideRef.current);

    Animated.spring(ballScale, { toValue: 0, tension: 220, friction: 8, useNativeDriver: true }).start();
    setLastMs(ms);

    reactionsRef.current = [...reactionsRef.current, ms];

    if (hit) {
      setPhaseSync('hit');
      floaterY.setValue(0);
      floaterOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(floaterY, { toValue: -80, duration: 900, useNativeDriver: true }),
        Animated.timing(floaterOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]).start();
    } else {
      setPhaseSync('miss');
    }

    setTimeout(() => {
      const nextRound = roundRef.current + 1;
      roundRef.current = nextRound;
      setRound(nextRound);
      if (nextRound > ROUNDS) {
        setPhaseSync('done');
      } else {
        setPhaseSync('waiting');
        scheduleNextBall();
      }
    }, 700);
  }, [scheduleNextBall]);

  const handleBallTap = useCallback(() => {
    if (phaseRef.current !== 'ready') return;
    const ms = Date.now() - shownAtRef.current;
    registerResult(ms, true);
  }, [registerResult]);

  useEffect(() => {
    scheduleNextBall();
    return () => {
      if (autoHideRef.current) clearTimeout(autoHideRef.current);
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, []);

  if (phase === 'done') {
    const all = reactionsRef.current;
    const avg = all.length > 0 ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0;
    const hits = all.filter(r => r < WINDOW_MS).length;
    const medal = avg < 250 ? '🥇' : avg < 380 ? '🥈' : '🥉';
    const xp = hits === 5 ? 200 : hits >= 3 ? 140 : 80;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 60, right: 20 }}>
          <FRIcon name="close" size={22} color={theme.textDim} />
        </TouchableOpacity>
        <Text style={{ fontSize: 52, marginBottom: 12 }}>{medal}</Text>
        <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 60, color: theme.text, letterSpacing: -3 }}>
          {avg}ms
        </Text>
        <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 8 }}>
          avg reaction · {hits}/{ROUNDS} tapped
        </Text>
        <View style={{ marginTop: 28, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.surface }}>
          <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 18, color: theme.accent, letterSpacing: 1 }}>
            +{xp} XP
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusText =
    phase === 'waiting' ? 'Get ready...' :
    phase === 'ready' ? 'TAP IT!' :
    phase === 'hit' && lastMs !== null ? `${lastMs}ms` :
    phase === 'miss' ? 'Too slow!' : '';

  const statusColor =
    phase === 'ready' ? theme.accent :
    phase === 'hit' ? theme.success :
    phase === 'miss' ? theme.danger :
    theme.textMute;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16 }}>
        <View>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            REACTION CHALLENGE
          </Text>
          <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 26, color: theme.text, letterSpacing: -0.5, marginTop: 2 }}>
            Round {Math.min(round, ROUNDS)} of {ROUNDS}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <FRIcon name="close" size={22} color={theme.textDim} />
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={{ paddingHorizontal: 20, marginTop: 6 }}>
        <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 15, color: statusColor, letterSpacing: 0.5 }}>
          {statusText}
        </Text>
      </View>

      {/* Reaction dots */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 10, gap: 6 }}>
        {Array.from({ length: ROUNDS }).map((_, i) => {
          const ms = reactionsRef.current[i];
          const hit = ms !== undefined && ms < WINDOW_MS;
          const done = ms !== undefined;
          return (
            <View key={i} style={{
              width: (width - 40 - 24) / ROUNDS,
              height: 4,
              borderRadius: 2,
              backgroundColor: done ? (hit ? theme.success : theme.danger) : theme.surface2,
            }} />
          );
        })}
      </View>

      {/* Play area */}
      <View style={{ flex: 1, position: 'relative' }}>
        {/* Ball */}
        <Animated.View style={{
          position: 'absolute',
          left: ballPos.x,
          top: ballPos.y,
          width: BALL,
          height: BALL,
          borderRadius: BALL / 2,
          backgroundColor: theme.accent,
          shadowColor: theme.accent,
          shadowOpacity: 0.7,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          transform: [{ scale: ballScale }],
        }}>
          <TouchableWithoutFeedback onPress={handleBallTap}>
            <View style={{ width: '100%', height: '100%', borderRadius: BALL / 2 }} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Floater */}
        {phase === 'hit' && lastMs !== null && (
          <Animated.Text style={{
            position: 'absolute',
            left: ballPos.x + BALL / 2 - 20,
            top: ballPos.y,
            fontFamily: 'JetBrainsMono_700Bold',
            fontSize: 16,
            color: theme.success,
            transform: [{ translateY: floaterY }],
            opacity: floaterOpacity,
          }}>
            {lastMs}ms
          </Animated.Text>
        )}

        {/* Waiting instruction */}
        {(phase === 'waiting' || phase === 'miss') && (
          <View style={{ position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.5 }}>
              {phase === 'miss' ? 'Watch for the ball!' : 'A ball will appear — tap it fast!'}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
