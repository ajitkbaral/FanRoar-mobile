import React, { useRef, useState, useCallback, useEffect } from 'react';
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

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 70;

const HOT_TAKES = [
  "The ref was clearly biased in the first half",
  "Our keeper was our best player out there",
  "We're winning this match by 2 or more",
  "The opposition played dirty football",
  "This match is going to extra time",
];

// Crowd agree % per take — seeded so they feel real, not random each session
const CROWD_AGREE = [71, 38, 62, 57, 44];

type Vote = 'agree' | 'disagree';
type Phase = 'swiping' | 'revealing' | 'done';

interface Props {
  onClose: () => void;
  onComplete?: (gameState: { votesSubmitted: number }) => void;
}

export default function HotTakePoll({ onClose, onComplete }: Props) {
  const { isDark, teamKey } = useUserStore();
  const theme = buildTheme(isDark, teamKey);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('swiping');
  const [currentVote, setCurrentVote] = useState<Vote | null>(null);

  useEffect(() => {
    if (phase === 'done') onComplete?.({ votesSubmitted: votesRef.current.length });
  }, [phase]);

  const indexRef = useRef(0);
  const phaseRef = useRef<Phase>('swiping');
  const votesRef = useRef<Vote[]>([]);

  const cardX = useRef(new Animated.Value(0)).current;
  const crowdBarWidth = useRef(new Animated.Value(0)).current;

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const revealAndAdvance = useCallback((vote: Vote) => {
    setCurrentVote(vote);
    votesRef.current = [...votesRef.current, vote];
    cardX.setValue(0); // snap card back to centre before showing crowd result
    setPhaseSync('revealing');

    const crowdPct = CROWD_AGREE[indexRef.current];
    const pct = vote === 'agree' ? crowdPct : 100 - crowdPct;
    crowdBarWidth.setValue(0);
    Animated.timing(crowdBarWidth, {
      toValue: (width - 80) * (pct / 100),
      duration: 600,
      useNativeDriver: false,
    }).start();

    setTimeout(() => {
      const next = indexRef.current + 1;
      indexRef.current = next;

      if (next >= HOT_TAKES.length) {
        setPhaseSync('done');
      } else {
        cardX.setValue(0);
        setCurrentVote(null);
        setIndex(next);
        setPhaseSync('swiping');
      }
    }, 1400);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => phaseRef.current === 'swiping',
      onMoveShouldSetPanResponder: (_, { dx }) => phaseRef.current === 'swiping' && Math.abs(dx) > 6,
      onPanResponderMove: (_, { dx }) => {
        if (phaseRef.current !== 'swiping') return;
        cardX.setValue(dx);
      },
      onPanResponderRelease: (_, { dx }) => {
        if (phaseRef.current !== 'swiping') return;
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
          const vote: Vote = dx > 0 ? 'agree' : 'disagree';
          const dest = dx > 0 ? width * 1.4 : -width * 1.4;
          Animated.timing(cardX, { toValue: dest, duration: 220, useNativeDriver: true }).start(() => {
            revealAndAdvance(vote);
          });
        } else {
          Animated.spring(cardX, { toValue: 0, tension: 200, friction: 12, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const rotate = cardX.interpolate({ inputRange: [-width, 0, width], outputRange: ['-12deg', '0deg', '12deg'] });
  const agreeOpacity = cardX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const disagreeOpacity = cardX.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  if (phase === 'done') {
    const allTakes = HOT_TAKES.map((take, i) => ({
      take,
      userVote: votesRef.current[i],
      crowd: CROWD_AGREE[i],
    }));

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
          <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 26, color: theme.text, letterSpacing: -0.5 }}>
            Your takes
          </Text>
          <TouchableOpacity onPress={onClose}>
            <FRIcon name="close" size={22} color={theme.textDim} />
          </TouchableOpacity>
        </View>

        {allTakes.map(({ take, userVote, crowd }, i) => {
          const agrees = userVote === 'agree';
          const crowdAgrees = crowd >= 50;
          const youWithCrowd = agrees === crowdAgrees;
          return (
            <View key={i} style={{
              marginHorizontal: 20,
              marginBottom: 12,
              padding: 14,
              borderRadius: 14,
              backgroundColor: theme.surface,
              borderWidth: 0.5,
              borderColor: theme.border,
            }}>
              <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 14, color: theme.text, lineHeight: 18, marginBottom: 8 }}>
                "{take}"
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: agrees ? theme.success + '25' : theme.danger + '25',
                }}>
                  <Text style={{
                    fontFamily: 'JetBrainsMono_700Bold',
                    fontSize: 9,
                    letterSpacing: 0.8,
                    color: agrees ? theme.success : theme.danger,
                  }}>
                    YOU {agrees ? 'AGREED' : 'DISAGREED'}
                  </Text>
                </View>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute }}>
                  {crowd}% of fans agreed {youWithCrowd ? '· with you' : ''}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 14, color: theme.accent, letterSpacing: 0.5 }}>
            +120 XP
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const crowdPct = CROWD_AGREE[index];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16 }}>
        <View>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            HOT TAKES
          </Text>
          <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 26, color: theme.text, letterSpacing: -0.5, marginTop: 2 }}>
            {index + 1} of {HOT_TAKES.length}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <FRIcon name="close" size={22} color={theme.textDim} />
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 10, gap: 6 }}>
        {HOT_TAKES.map((_, i) => (
          <View key={i} style={{
            width: (width - 40 - 20) / HOT_TAKES.length,
            height: 3,
            borderRadius: 2,
            backgroundColor: i < index ? theme.accent : i === index ? theme.accent + '60' : theme.surface2,
          }} />
        ))}
      </View>

      {/* Card stack */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        {/* Background card (next) */}
        {index + 1 < HOT_TAKES.length && phase === 'swiping' && (
          <View style={{
            position: 'absolute',
            width: width - 52,
            padding: 28,
            borderRadius: 22,
            backgroundColor: theme.surface,
            borderWidth: 0.5,
            borderColor: theme.border,
            transform: [{ scale: 0.94 }, { translateY: 10 }],
          }}>
            <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 22, color: theme.textDim, lineHeight: 30 }}>
              "{HOT_TAKES[index + 1]}"
            </Text>
          </View>
        )}

        {/* Front card */}
        <Animated.View
          {...(phase === 'swiping' ? panResponder.panHandlers : {})}
          style={{
            width: width - 40,
            padding: 28,
            borderRadius: 22,
            backgroundColor: theme.surface,
            borderWidth: 0.5,
            borderColor: theme.borderStrong,
            transform: [{ translateX: cardX }, { rotate }],
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
          }}
        >
          {/* AGREE stamp */}
          <Animated.View style={{
            position: 'absolute',
            top: 20,
            right: 20,
            opacity: agreeOpacity,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: theme.success,
          }}>
            <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 13, color: theme.success }}>AGREE</Text>
          </Animated.View>

          {/* DISAGREE stamp */}
          <Animated.View style={{
            position: 'absolute',
            top: 20,
            left: 20,
            opacity: disagreeOpacity,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: theme.danger,
          }}>
            <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 13, color: theme.danger }}>NOPE</Text>
          </Animated.View>

          <Text style={{
            fontFamily: 'InterTight_700Bold',
            fontSize: 24,
            color: theme.text,
            lineHeight: 32,
            marginTop: 40,
            marginBottom: 16,
          }}>
            "{HOT_TAKES[index]}"
          </Text>

          {/* Crowd result (revealed phase) */}
          {phase === 'revealing' && currentVote && (
            <View style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.8 }}>
                  {crowdPct}% of fans agreed
                </Text>
                <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 10, color: currentVote === 'agree' ? theme.success : theme.danger, letterSpacing: 0.8 }}>
                  YOU {currentVote === 'agree' ? 'AGREED' : 'DISAGREED'}
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.surface2, overflow: 'hidden' }}>
                <Animated.View style={{
                  height: '100%',
                  width: crowdBarWidth,
                  borderRadius: 3,
                  backgroundColor: currentVote === 'agree' ? theme.success : theme.danger,
                }} />
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Hint */}
      {phase === 'swiping' && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28, paddingBottom: 36 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FRIcon name="arrow" size={14} color={theme.danger} />
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5 }}>
              SWIPE LEFT TO DISAGREE
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5 }}>
              AGREE SWIPE RIGHT
            </Text>
            <FRIcon name="arrow" size={14} color={theme.success} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
