import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Modal } from 'react-native';
import { buildTheme } from '../theme';
import { useUserStore } from '../store/userStore';
import FRIcon from '../components/shared/FRIcon';
import PenaltyShootout from '../components/MiniGame/PenaltyShootout';
import ReactionChallenge from '../components/MiniGame/ReactionChallenge';
import HotTakePoll from '../components/MiniGame/HotTakePoll';
import HypeBomb from '../components/MiniGame/HypeBomb';

type GameKey = 'penalty' | 'reaction' | 'hottake' | 'hype';

interface Game {
  key: GameKey;
  title: string;
  sub: string;
  reward: string;
  featured?: boolean;
  icon: string;
}

const GAMES: Game[] = [
  { key: 'penalty',  title: 'Penalty Shootout',   sub: 'Swipe to aim · 5 shots',           reward: '+250 XP',      featured: true, icon: 'bolt'      },
  { key: 'hottake',  title: 'Hot Takes',           sub: 'Swipe your verdict on 5 takes',    reward: '+120 XP',                      icon: 'fire'      },
  { key: 'reaction', title: 'Reaction Challenge',  sub: 'Tap the ball before it vanishes',  reward: '+200 XP',                      icon: 'lightning' },
  { key: 'hype',     title: 'Hype Bomb',           sub: 'Shake hard · 30s window',          reward: '+1 Mega Cheer',                icon: 'drum'      },
];

export default function MiniGameScreen() {
  const { isDark, teamKey } = useUserStore();
  const theme = buildTheme(isDark, teamKey);
  const [activeGame, setActiveGame] = useState<GameKey | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top row */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 60,
        }}>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.5 }}>
            HALF-TIME · 00:14:32
          </Text>
          <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 11, color: theme.accent, letterSpacing: 0.5 }}>
            {GAMES.length} GAMES
          </Text>
        </View>

        {/* Title */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
            Mini-games
          </Text>
          <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 30, color: theme.text, letterSpacing: -1, lineHeight: 34 }}>
            Keep the energy up.
          </Text>
        </View>

        {/* Game cards */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}>
          {GAMES.map((g) => (
            <GameCard key={g.key} theme={theme} game={g} onPress={() => setActiveGame(g.key)} />
          ))}
        </View>

        {/* Disclaimer */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <View style={{
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: theme.border,
          }}>
            <Text style={{
              fontFamily: 'JetBrainsMono_400Regular',
              fontSize: 11,
              color: theme.textDim,
              lineHeight: 16,
            }}>
              Mini-games close when the second half kicks off. Your XP carries over to your fan profile.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Game modals */}
      <Modal visible={activeGame === 'penalty'} animationType="slide" statusBarTranslucent>
        <PenaltyShootout onClose={() => setActiveGame(null)} />
      </Modal>
      <Modal visible={activeGame === 'reaction'} animationType="slide" statusBarTranslucent>
        <ReactionChallenge onClose={() => setActiveGame(null)} />
      </Modal>
      <Modal visible={activeGame === 'hottake'} animationType="slide" statusBarTranslucent>
        <HotTakePoll onClose={() => setActiveGame(null)} />
      </Modal>
      <Modal visible={activeGame === 'hype'} animationType="slide" statusBarTranslucent>
        <HypeBomb onClose={() => setActiveGame(null)} />
      </Modal>
    </SafeAreaView>
  );
}

function GameCard({
  theme,
  game,
  onPress,
}: {
  theme: ReturnType<typeof buildTheme>;
  game: Game;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        padding: 14,
        borderRadius: 18,
        backgroundColor: game.featured ? theme.accent : theme.surface,
        borderWidth: 0.5,
        borderColor: game.featured ? theme.accent : theme.border,
        overflow: 'hidden',
      }}
    >
      {game.featured && (
        <View style={{
          position: 'absolute',
          top: 14,
          right: 14,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: theme.bg,
        }}>
          <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 9, color: theme.accent, letterSpacing: 1 }}>
            FEATURED
          </Text>
        </View>
      )}

      <FRIcon
        name={game.icon}
        size={26}
        color={game.featured ? theme.bg : theme.accent}
        strokeWidth={1.8}
      />

      <Text style={{
        marginTop: 10,
        fontFamily: 'InterTight_700Bold',
        fontSize: 20,
        color: game.featured ? theme.bg : theme.text,
        letterSpacing: -0.5,
      }}>
        {game.title}
      </Text>

      <Text style={{
        marginTop: 4,
        fontSize: 13,
        color: game.featured ? theme.bg + 'B3' : theme.textDim,
      }}>
        {game.sub}
      </Text>

      <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: game.featured ? theme.bg : theme.surface2,
        }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_700Bold',
            fontSize: 10,
            color: game.featured ? theme.accent : theme.text,
            letterSpacing: 0.6,
          }}>
            {game.reward}
          </Text>
        </View>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 36,
          backgroundColor: game.featured ? theme.bg : theme.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <FRIcon name="play" size={14} color={game.featured ? theme.accent : theme.text} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
