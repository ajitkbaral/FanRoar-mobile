import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useUserStore } from '../store/userStore';
import { buildTheme } from '../theme';
import { api } from '../api/client';
import FRTabBar from '../components/shared/FRTabBar';
import LevelUpModal from '../components/shared/LevelUpModal';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import MatchScreen from '../screens/MatchScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecapScreen from '../screens/RecapScreen';
import MiniGameScreen from '../screens/MiniGameScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Recap: { matchId: string; supportingTeamSide?: 'A' | 'B' };
  MiniGame: { matchId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Match: { matchId?: string } | undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { isDark, teamCode } = useUserStore();
  const theme = buildTheme(isDark, teamCode);

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <FRTabBar
          theme={theme}
          activeKey={props.state.routes[props.state.index].name}
          onPress={(key) => {
            (props.navigation as any).jumpTo(key);
          }}
        />
      )}
    >
      <Tab.Screen name="Home"        component={HomeScreen} />
      <Tab.Screen name="Match"       component={MatchScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile"     component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { hasCompletedOnboarding, token, _hasHydrated, isDark, teamCode } = useUserStore();
  const theme = buildTheme(isDark, teamCode);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    const storedToken = useUserStore.getState().token;

    if (!storedToken) {
      setAuthChecked(true);
      return;
    }

    api.auth.me()
      .then((res) => {
        const me = res.data;
        useUserStore.getState().setUser({
          id: me.userId,
          displayName: me.displayName,
          phone: me.phone,
          fanRole: me.fanRole,
          teamCode: me.teamKey,
          xp: me.xp,
          level: me.level,
          xpToNextLevel: me.xpToNextLevel,
          badges: me.badges ?? [],
          countryCode: me.countryCode,
          cityCode: me.cityCode,
        });
      })
      .catch(() => {
        // 401 interceptor calls logout(), clearing token + hasCompletedOnboarding
      })
      .finally(() => setAuthChecked(true));
  }, [_hasHydrated]);

  if (!_hasHydrated || !authChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const isAuthenticated = !!token && hasCompletedOnboarding;

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: theme.accent,
          background: theme.bg,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          notification: theme.danger,
        },
        fonts: {
          regular: { fontFamily: 'InterTight_400Regular', fontWeight: '400' },
          medium:  { fontFamily: 'InterTight_500Medium',  fontWeight: '500' },
          bold:    { fontFamily: 'InterTight_700Bold',    fontWeight: '700' },
          heavy:   { fontFamily: 'InterTight_800ExtraBold', fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main"     component={MainTabs} />
            <Stack.Screen name="Recap"    component={RecapScreen} />
            <Stack.Screen name="MiniGame" component={MiniGameScreen} />
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
      </Stack.Navigator>
      <LevelUpModal />
    </NavigationContainer>
  );
}
