import { create } from 'zustand';
import { ApiFriendship, ApiFriendRequest, ApiSentRequest } from '../api/types';

interface FriendsState {
  friends: ApiFriendship[];
  pendingRequests: ApiFriendRequest[];
  sentRequests: ApiSentRequest[];
  pendingCount: number;
  isLoading: boolean;
  error: string | null;

  setFriends: (friends: ApiFriendship[], pendingCount: number) => void;
  setPendingRequests: (requests: ApiFriendRequest[]) => void;
  setSentRequests: (requests: ApiSentRequest[]) => void;
  addFriend: (f: ApiFriendship) => void;
  removeFriend: (friendUserId: string) => void;
  acceptPending: (friendshipId: string, friendship: ApiFriendship) => void;
  cancelSent: (friendshipId: string) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  pendingCount: 0,
  isLoading: false,
  error: null,

  setFriends: (friends, pendingCount) => set({ friends, pendingCount }),
  setPendingRequests: (requests) => set({ pendingRequests: requests, pendingCount: requests.length }),
  setSentRequests: (requests) => set({ sentRequests: requests }),
  addFriend: (f) => set((s) => ({ friends: [...s.friends, f] })),
  removeFriend: (friendUserId) =>
    set((s) => ({ friends: s.friends.filter((f) => f.friendUserId !== friendUserId) })),
  acceptPending: (friendshipId, friendship) =>
    set((s) => ({
      friends: [...s.friends, friendship],
      pendingRequests: s.pendingRequests.filter((r) => r.id !== friendshipId),
      pendingCount: Math.max(0, s.pendingCount - 1),
    })),
  cancelSent: (friendshipId) =>
    set((s) => ({ sentRequests: s.sentRequests.filter((r) => r.id !== friendshipId) })),
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  reset: () => set({ friends: [], pendingRequests: [], sentRequests: [], pendingCount: 0, isLoading: false, error: null }),
}));
