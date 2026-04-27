import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { buildTheme } from '../../theme';
import { useUserStore } from '../../store/userStore';
import FRIcon from '../shared/FRIcon';

const { width, height } = Dimensions.get('window');
const GOAL_W = width * 0.86;
const GOAL_H = GOAL_W * 0.52;
const TOTAL_SHOTS = 5;

type Zone = 'TL' | 'TR' | 'ML' | 'MR' | 'BL' | 'BR';
type KeeperSide = 'left' | 'center' | 'right';
type Phase = 'aim' | 'shooting' | 'result' | 'done';

function swipeToZone(dx: number, dy: number): Zone {
  const left = dx < -25;
  const right = dx > 25;
  const top = dy < -20;
  const bot = dy > 20;
  if (left && top) return 'TL';
  if (right && top) return 'TR';
  if (left && bot) return 'BL';
  if (right && bot) return 'BR';
  if (left) return 'ML';
  if (right) return 'MR';
  return top ? 'TL' : 'BL';
}

function keeperBlocks(side: KeeperSide, zone: Zone): boolean {
  if (side === 'left') return zone === 'TL' || zone === 'ML' || zone === 'BL';
  if (side === 'right') return zone === 'TR' || zone === 'MR' || zone === 'BR';
  return zone === 'ML' || zone === 'MR';
}

function zoneTarget(zone: Zone): { x: number; y: number } {
  const w = GOAL_W;
  const h = GOAL_H;
  const map: Record<Zone, { x: number; y: number }> = {
    TL: { x: -w * 0.3,  y: -h * 0.65 },
    TR: { x:  w * 0.3,  y: -h * 0.65 },
    ML: { x: -w * 0.3,  y: -h * 0.35 },
    MR: { x:  w * 0.3,  y: -h * 0.35 },
    BL: { x: -w * 0.22, y: -h * 0.1  },
    BR: { x:  w * 0.22, y: -h * 0.1  },
  };
  return map[zone];
}

interface Props {
  onClose: () => void;
}

export default function PenaltyShootout({ onClose }: Props) {
  const { isDark, teamKey } = useUserStore();
  const theme = buildTheme(isDark, teamKey);

  const [shots, setShots] = useState(0);
  const [scored, setScored] = useState(0);
  const [phase, setPhase] = useState<Phase>('aim');
  const [isGoal, setIsGoal] = useState(false);

  const phaseRef = useRef<Phase>('aim');
  const shotsRef = useRef(0);
  const scoredRef = useRef(0);

  const ballX = useRef(new Animated.Value(0)).current;
  const ballY = useRef(new Animated.Value(0)).current;
  const ballScale = useRef(new Animated.Value(1)).current;
  const keeperX = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const shoot = useCallback((dx: number, dy: number) => {
    setPhaseSync('shooting');

    const zone = swipeToZone(dx, dy);
    const r = Math.random();
    const keeper: KeeperSide = r < 0.38 ? 'left' : r < 0.62 ? 'center' : 'right';
    const goal = !keeperBlocks(keeper, zone);
    const pos = zoneTarget(zone);
    const keeperDest = keeper === 'left' ? -GOAL_W * 0.32 : keeper === 'right' ? GOAL_W * 0.32 : 0;

    Animated.parallel([
      Animated.timing(ballX, { toValue: pos.x, duration: 420, useNativeDriver: true }),
      Animated.timing(ballY, { toValue: pos.y, duration: 420, useNativeDriver: true }),
      Animated.timing(ballScale, { toValue: 0.35, duration: 420, useNativeDriver: true }),
      Animated.timing(keeperX, { toValue: keeperDest, duration: 280, useNativeDriver: true }),
    ]).start(() => {
      setIsGoal(goal);
      if (goal) {
        scoredRef.current += 1;
        setScored(scoredRef.current);
      }
      setPhaseSync('result');
      Animated.timing(resultOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();

      setTimeout(() => {
        Animated.timing(resultOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
          ballX.setValue(0);
          ballY.setValue(0);
          ballScale.setValue(1);
          keeperX.setValue(0);

          shotsRef.current += 1;
          setShots(shotsRef.current);

          if (shotsRef.current >= TOTAL_SHOTS) {
            setPhaseSync('done');
          } else {
            setPhaseSync('aim');
          }
        });
      }, 900);
    });
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, { dx, dy }) => {
        if (phaseRef.current !== 'aim') return;
        shoot(dx, dy);
      },
    })
  ).current;

  const xp = scoredRef.current * 50;

  if (phase === 'done') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 60, right: 20 }}>
          <FRIcon name="close" size={22} color={theme.textDim} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 16 }}>
          FULL TIME
        </Text>
        <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 64, color: theme.text, letterSpacing: -3 }}>
          {scoredRef.current}/{TOTAL_SHOTS}
        </Text>
        <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 13, color: theme.textDim, marginTop: 6 }}>
          {scoredRef.current === 5 ? 'PERFECT SHOOTER' : scoredRef.current >= 3 ? 'GREAT TECHNIQUE' : scoredRef.current >= 1 ? 'KEEP PRACTICING' : 'THE KEEPER WAS INSPIRED'}
        </Text>
        <View style={{ marginTop: 28, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.surface }}>
          <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 18, color: theme.accent, letterSpacing: 1 }}>
            +{xp} XP
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <View>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            PENALTY SHOOTOUT
          </Text>
          <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 26, color: theme.text, letterSpacing: -0.5, marginTop: 2 }}>
            Shot {shots + 1} of {TOTAL_SHOTS}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <TouchableOpacity onPress={onClose} style={{ marginBottom: 6 }}>
            <FRIcon name="close" size={22} color={theme.textDim} />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 13, color: theme.accent }}>
            {scored} GOAL{scored !== 1 ? 'S' : ''}
          </Text>
        </View>
      </View>

      {/* Goal + ball area */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Goal frame */}
        <View style={{
          width: GOAL_W,
          height: GOAL_H,
          borderWidth: 3,
          borderColor: theme.borderStrong,
          borderRadius: 4,
          backgroundColor: theme.surface + '28',
        }}>
          {/* Crossbar */}
          <View style={{ position: 'absolute', top: GOAL_H * 0.48, left: 0, right: 0, height: 2, backgroundColor: theme.border + '80' }} />
          {/* Centre vertical */}
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: theme.border + '40' }} />

          {/* Keeper */}
          <Animated.View style={{
            position: 'absolute',
            bottom: 6,
            left: GOAL_W / 2 - 28,
            width: 56,
            height: 66,
            borderRadius: 10,
            backgroundColor: theme.accent + 'CC',
            transform: [{ translateX: keeperX }],
          }} />
        </View>

        {/* Ball */}
        <Animated.View style={{
          position: 'absolute',
          bottom: height * 0.14,
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: theme.text,
          borderWidth: 2,
          borderColor: theme.bg,
          shadowColor: theme.accent,
          shadowOpacity: 0.5,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          transform: [{ translateX: ballX }, { translateY: ballY }, { scale: ballScale }],
        }} />

        {/* GOAL / SAVED overlay */}
        <Animated.View style={{ position: 'absolute', opacity: resultOpacity, alignItems: 'center' }}>
          <Text style={{
            fontFamily: 'InterTight_700Bold',
            fontSize: 52,
            letterSpacing: -2,
            color: isGoal ? theme.success : theme.danger,
          }}>
            {isGoal ? 'GOAL!' : 'SAVED'}
          </Text>
        </Animated.View>
      </View>

      {/* Swipe zone */}
      <View
        {...panResponder.panHandlers}
        style={{
          height: height * 0.2,
          marginHorizontal: 20,
          marginBottom: 20,
          borderRadius: 18,
          backgroundColor: phase === 'aim' ? theme.surface : theme.surface + '40',
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: phase === 'aim' ? theme.accent + '60' : theme.border,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <FRIcon name="bolt" size={28} color={phase === 'aim' ? theme.accent : theme.textMute} />
        <Text style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 11,
          color: phase === 'aim' ? theme.textDim : theme.textMute,
          letterSpacing: 0.5,
        }}>
          {phase === 'aim' ? 'SWIPE TO SHOOT' : phase === 'shooting' ? '...' : ''}
        </Text>
      </View>
    </SafeAreaView>
  );
}
