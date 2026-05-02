import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView, Share,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, cancelAnimation,
} from 'react-native-reanimated';
import { buildTheme } from '../theme';
import { useUserStore } from '../store/userStore';
import { api } from '../api/client';
import { type ApiRecap } from '../api/types';
import type { RootStackParamList } from '../navigation';
import MomentCard from '../components/MomentCard';
import FRIcon from '../components/shared/FRIcon';
import FRCard from '../components/shared/FRCard';

export default function RecapScreen() {
  const { matchId, supportingTeamSide } = useRoute<RouteProp<RootStackParamList, 'Recap'>>().params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark, teamCode, userId } = useUserStore();
  const theme = buildTheme(isDark, teamCode);

  const [recap, setRecap] = useState<ApiRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  // Increment to manually restart the fetch (e.g. from the error state Retry button)
  const [fetchVersion, setFetchVersion] = useState(0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const skeletonOpacity = useSharedValue(1);
  const skeletonStyle = useAnimatedStyle(() => ({ opacity: skeletonOpacity.value }));

  const supportingTeamName = recap
    ? (supportingTeamSide === 'B' ? recap.match.teamB : recap.match.teamA)
    : '';

  // useEffect (not useFocusEffect) is correct here: RecapScreen is always pushed/replaced
  // as a stack entry, so it mounts fresh on every navigation. useFocusEffect's retry-via-deps
  // pattern is broken — it only re-calls the callback on focus events, not dep changes.
  React.useEffect(() => {
    if (!userId || !matchId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let attempt = 0;

    setLoading(true);
    setError(null);
    setRecap(null);
    setRetryCount(0);

    skeletonOpacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false,
    );

    const stopLoading = () => {
      setLoading(false);
      cancelAnimation(skeletonOpacity);
      skeletonOpacity.value = 1;
    };

    const fetchOnce = () => {
      api.profile
        .recap(userId, matchId)
        .then((r) => {
          if (cancelled) return;
          if (r.data) {
            const hasActivity =
              r.data.energyDelivered > 0 || r.data.shakeEvents > 0 || r.data.tapCombos > 0;
            if (hasActivity || attempt >= 3) {
              setRecap(r.data);
              stopLoading();
            } else {
              // Backend returned zeros — Redis flush may not have completed yet. Retry.
              attempt += 1;
              setRetryCount(attempt);
              timeoutRef.current = setTimeout(fetchOnce, 3000);
            }
          } else {
            if (attempt < 3) {
              attempt += 1;
              setRetryCount(attempt);
              timeoutRef.current = setTimeout(fetchOnce, 3000);
            } else {
              stopLoading();
            }
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < 3) {
            attempt += 1;
            setRetryCount(attempt);
            timeoutRef.current = setTimeout(fetchOnce, 3000);
          } else {
            setError('Recap unavailable');
            stopLoading();
          }
        });
    };

    fetchOnce();

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  // fetchVersion is intentionally included so the Retry button can restart the fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, matchId, fetchVersion]);

  const handleShare = async () => {
    if (!recap) return;
    try {
      await Share.share({
        message: `I drove ${recap.impactPercent.toFixed(1)}% of ${supportingTeamName}'s energy in the WC ${recap.match.stage}! Ranked #${recap.rank}. #FanRoar #${supportingTeamName}`,
      });
    } catch {}
  };

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
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 60,
        }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Main')}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <FRIcon name="home" size={14} color={theme.textMute} />
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.5 }}>
              Home
            </Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.5 }}>
            Match recap · ready to share
          </Text>
        </View>

        {/* Title */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
            Full time
          </Text>
          <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 30, color: theme.text, letterSpacing: -1, lineHeight: 34 }}>
            That was loud.
          </Text>
        </View>

        {/* Loading skeleton */}
        {loading && (
          <>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.8, textTransform: 'uppercase', marginHorizontal: 20, marginTop: 14 }}>
              {retryCount > 0 ? `Preparing recap · retry ${retryCount}/3…` : 'Loading your recap…'}
            </Text>
            <Animated.View style={[{ marginHorizontal: 20, marginTop: 10, height: 280, borderRadius: 22, backgroundColor: theme.surface2 }, skeletonStyle]} />
            <Animated.View style={[{ marginHorizontal: 20, marginTop: 14, height: 64, borderRadius: 14, backgroundColor: theme.surface2 }, skeletonStyle]} />
            <Animated.View style={[{ marginHorizontal: 20, marginTop: 12, height: 48, borderRadius: 14, backgroundColor: theme.surface2 }, skeletonStyle]} />
          </>
        )}

        {/* Error state */}
        {!loading && error && (
          <View style={{ paddingHorizontal: 20, paddingTop: 40, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.5, marginBottom: 16 }}>
              {error.toUpperCase()}
            </Text>
            <TouchableOpacity
              onPress={() => setFetchVersion((v) => v + 1)}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: theme.surface,
                borderWidth: 0.5,
                borderColor: theme.border,
              }}
            >
              <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 13, color: theme.text }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* No participation state */}
        {!loading && recap && recap.energyDelivered === 0 && recap.shakeEvents === 0 && recap.tapCombos === 0 && (
          <View style={{ paddingHorizontal: 20, paddingTop: 60, alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: theme.surface,
              borderWidth: 0.5,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FRIcon name="bolt" size={24} color={theme.textMute} />
            </View>
            <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 20, color: theme.text, letterSpacing: -0.5, textAlign: 'center' }}>
              No score for this match
            </Text>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.4, textAlign: 'center', lineHeight: 18 }}>
              You weren't in the arena for this one.{'\n'}Jump into the next match to start building your legacy.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Main')}
              activeOpacity={0.8}
              style={{
                marginTop: 8,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: theme.surface,
                borderWidth: 0.5,
                borderColor: theme.border,
              }}
            >
              <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 13, color: theme.text }}>
                Back to home
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Catch-all: loading resolved but recap is null (userId absent at mount time) */}
        {!loading && !error && !recap && (
          <View style={{ paddingHorizontal: 20, paddingTop: 60, alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 56, height: 56, borderRadius: 18,
              backgroundColor: theme.surface, borderWidth: 0.5, borderColor: theme.border,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <FRIcon name="bolt" size={24} color={theme.textMute} />
            </View>
            <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 20, color: theme.text, letterSpacing: -0.5, textAlign: 'center' }}>
              No score for this match
            </Text>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.4, textAlign: 'center', lineHeight: 18 }}>
              You weren't in the arena for this one.{'\n'}Jump into the next match to start building your legacy.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Main')}
              activeOpacity={0.8}
              style={{ marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 0.5, borderColor: theme.border }}
            >
              <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 13, color: theme.text }}>Back to home</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loaded content */}
        {!loading && recap && (recap.energyDelivered > 0 || recap.shakeEvents > 0 || recap.tapCombos > 0) && (
          <>
            {/* Moment card */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
              <MomentCard
                theme={theme}
                stats={{
                  energyDelivered: recap.energyDelivered,
                  shakeEvents: recap.shakeEvents,
                  tapCombos: recap.tapCombos,
                  rank: recap.rank,
                  impactPercent: recap.impactPercent,
                }}
                match={{
                  teamA: recap.match.teamA,
                  teamB: recap.match.teamB,
                  scoreA: recap.match.scoreA,
                  scoreB: recap.match.scoreB,
                  stage: recap.match.stage,
                  date: recap.match.date,
                  venue: recap.match.venue,
                }}
                supportingTeam={supportingTeamName}
              />
            </View>

            {/* Badge unlocks */}
            {recap.badgesUnlocked.length === 0 ? (
              <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5 }}>
                  NO BADGES THIS MATCH
                </Text>
              </View>
            ) : (
              recap.badgesUnlocked.map((badge) => (
                <View key={badge.id} style={{ paddingHorizontal: 20, paddingTop: 8 }}>
                  <FRCard theme={theme} padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: badge.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <FRIcon name={badge.icon} size={18} color={theme.bg} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 14, color: theme.text }}>
                        {badge.name} unlocked
                      </Text>
                      <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' }}>
                        {badge.description}
                      </Text>
                    </View>
                    <FRIcon name="check" size={18} color={theme.success} />
                  </FRCard>
                </View>
              ))
            )}

            {/* Action buttons */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleShare}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: theme.accent,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <FRIcon name="share" size={16} color={theme.bg} />
                <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 14, color: theme.bg }}>
                  Share
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: theme.surface,
                  borderWidth: 0.5,
                  borderColor: theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FRIcon name="plus" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
