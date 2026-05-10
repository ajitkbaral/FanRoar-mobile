import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FanRole } from '../utils/constants';
import { XpUpdatePayload, ApiBadge } from '../api/types';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: string;
}

interface UserProfile {
  id: string;
  displayName: string;
  phone: string;
  fanRole: FanRole;
  teamCode: string;
  xp: number;
  level: number;
  xpToNextLevel: number;
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
  teamCode: string;
  isDark: boolean;
  hasCompletedOnboarding: boolean;
  displayName: string;
  phone: string;
  _hasHydrated: boolean;
  pendingLevelUp: boolean;
  pendingLevelUpLevel: number;

  setToken: (token: string) => void;
  setUser: (user: UserProfile) => void;
  setFanRole: (role: FanRole) => void;
  setTeamCode: (code: string) => void;
  setDark: (dark: boolean) => void;
  setOnboarded: () => void;
  setDisplayName: (name: string) => void;
  setPhone: (phone: string) => void;
  setHasHydrated: (v: boolean) => void;
  logout: () => void;
  applyXpUpdate: (update: XpUpdatePayload) => void;
  clearLevelUp: () => void;
  addBadge: (badge: ApiBadge) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      userId: null,
      teamId: 'BRA',
      fanRole: 'ultra',
      teamCode: 'BRA',
      isDark: true,
      hasCompletedOnboarding: false,
      displayName: '',
      phone: '',
      _hasHydrated: false,
      pendingLevelUp: false,
      pendingLevelUpLevel: 1,

      setToken: (token) => set({ token }),
      setUser: (user) => set({
        user,
        userId: user.id,
        fanRole: user.fanRole,
        teamCode: user.teamCode,
        displayName: user.displayName,
        phone: user.phone,
      }),
      setFanRole: (fanRole) => set({ fanRole }),
      setTeamCode: (teamCode) => set({ teamCode }),
      setDark: (isDark) => set({ isDark }),
      setOnboarded: () => set({ hasCompletedOnboarding: true }),
      setDisplayName: (displayName) => set({ displayName }),
      setPhone: (phone) => set({ phone }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      logout: () => {
        AsyncStorage.removeItem('fanroar-user');
        set({
          user: null,
          token: null,
          userId: null,
          displayName: '',
          phone: '',
          hasCompletedOnboarding: false,
          pendingLevelUp: false,
          pendingLevelUpLevel: 1,
        });
      },
      applyXpUpdate: (update) => set((s) => ({
        user: s.user ? { ...s.user, xp: update.xpInBand, level: update.level } : s.user,
        pendingLevelUp: update.leveledUp ? true : s.pendingLevelUp,
        pendingLevelUpLevel: update.leveledUp ? update.level : s.pendingLevelUpLevel,
      })),
      clearLevelUp: () => set({ pendingLevelUp: false }),
      addBadge: (badge) => set((s) => {
        if (!s.user) return s;
        if (s.user.badges.some((b) => b.id === badge.id)) return s;
        return { user: { ...s.user, badges: [...s.user.badges, badge] } };
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
        teamCode: state.teamCode,
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
