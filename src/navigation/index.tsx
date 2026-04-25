import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { useUserStore } from '../store/userStore';
import { buildTheme } from '../theme';
import FRTabBar from '../components/shared/FRTabBar';

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
  Recap: { matchId: string };
  MiniGame: { matchId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Match: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { isDark, teamKey } = useUserStore();
  const theme = buildTheme(isDark, teamKey);

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <FRTabBar
          theme={theme}
          activeKey={props.state.routes[props.state.index].name}
          onPress={(key) => {
            const route = props.state.routes.find(r => r.name === key);
            if (route) {
              props.navigation.navigate(key as any);
            }
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
  const { hasCompletedOnboarding, isDark, teamKey } = useUserStore();
  const theme = buildTheme(isDark, teamKey);

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
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : null}
        <Stack.Screen name="Main"     component={MainTabs} />
        <Stack.Screen name="Recap"    component={RecapScreen} />
        <Stack.Screen name="MiniGame" component={MiniGameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
