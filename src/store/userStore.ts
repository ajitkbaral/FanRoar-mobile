import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FanRole } from '../utils/constants';
import { TeamKey } from '../theme';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: string;
}

interface UserProfile {
  userId: string;
  displayName: string;
  phone: string;
  fanRole: FanRole;
  teamKey: TeamKey;
  xp: number;
  level: number;
  badges: Badge[];
  countryCode: string;
  cityCode: string;
}

interface UserState {
  user: UserProfile | null;
  token: string | null;
  userId: string | null;
  teamId: string | null;
  fanRole: FanRole;
  teamKey: TeamKey;
  isDark: boolean;
  hasCompletedOnboarding: boolean;
  displayName: string;
  phone: string;
  _hasHydrated: boolean;

  setToken: (token: string) => void;
  setUser: (user: UserProfile) => void;
  setFanRole: (role: FanRole) => void;
  setTeamKey: (key: TeamKey) => void;
  setDark: (dark: boolean) => void;
  setOnboarded: () => void;
  setDisplayName: (name: string) => void;
  setPhone: (phone: string) => void;
  setHasHydrated: (v: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      userId: null,
      teamId: 'BRA',
      fanRole: 'ultra',
      teamKey: 'brazil',
      isDark: true,
      hasCompletedOnboarding: false,
      displayName: '',
      phone: '',
      _hasHydrated: false,

      setToken: (token) => set({ token }),
      setUser: (user) => set({
        user,
        userId: user.userId,
        fanRole: user.fanRole,
        teamKey: user.teamKey,
        displayName: user.displayName,
        phone: user.phone,
      }),
      setFanRole: (fanRole) => set({ fanRole }),
      setTeamKey: (teamKey) => set({ teamKey }),
      setDark: (isDark) => set({ isDark }),
      setOnboarded: () => set({ hasCompletedOnboarding: true }),
      setDisplayName: (displayName) => set({ displayName }),
      setPhone: (phone) => set({ phone }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      logout: () => set({
        user: null,
        token: null,
        userId: null,
        displayName: '',
        phone: '',
        hasCompletedOnboarding: false,
      }),
    }),
    {
      name: 'fanroar-user',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        user: state.user,
        fanRole: state.fanRole,
        teamKey: state.teamKey,
        isDark: state.isDark,
        userId: state.userId,
        teamId: state.teamId,
        displayName: state.displayName,
        phone: state.phone,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
