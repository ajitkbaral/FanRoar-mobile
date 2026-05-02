import axios from 'axios';
import { useUserStore } from '../store/userStore';
import {
  mapMatch,
  BackendMatch,
  LeaderboardResponse,
  ApiFriendsListResponse,
  ApiFriendRequest,
  ApiFriendship,
  ApiFriendRequestResponse,
  ApiSentRequest,
  type ApiRecap,
  type MiniGameSubmitRequest,
  type XpUpdatePayload,
} from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const API_VERSION = process.env.EXPO_PUBLIC_API_VERSION ?? 'v1';

const client = axios.create({
  baseURL: `${BASE_URL}/api/${API_VERSION}`,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useUserStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

export const api = {
  auth: {
    requestOtp: (phone: string) => client.post('/auth/request-otp', { phone }),
    verifyOtp: (phone: string, otp: string, countryCode?: string) =>
      client.post('/auth/verify-otp', { phone, otp, countryCode }),
    me: () => client.get('/auth/me'),
    updateProfile: (data: { displayName?: string; fanRole?: string }) =>
      client.patch('/auth/profile', data),
  },
  matches: {
    live: async () => {
      const res = await client.get<BackendMatch[]>('/matches/live');
      return { ...res, data: res.data.map(mapMatch) };
    },
    upcoming: async () => {
      const res = await client.get<BackendMatch[]>('/matches/upcoming');
      return { ...res, data: res.data.map(mapMatch) };
    },
    recent: async () => {
      const res = await client.get<BackendMatch[]>('/matches/recent');
      return { ...res, data: res.data.map(mapMatch) };
    },
    byId: async (id: string) => {
      const res = await client.get<BackendMatch>(`/matches/${id}`);
      return { ...res, data: mapMatch(res.data) };
    },
  },
  leaderboard: {
    global: (matchId: string, limit = 20) =>
      client.get<LeaderboardResponse>('/leaderboard/global', { params: { matchId, limit } }),
    country: (matchId: string, teamCode: string, limit = 20) =>
      client.get<LeaderboardResponse>('/leaderboard/country', { params: { matchId, teamCode, limit } }),
    city: (matchId: string, cityCode: string, limit = 20) =>
      client.get<LeaderboardResponse>('/leaderboard/city', { params: { matchId, cityCode, limit } }),
    friends: (matchId: string, limit = 20) =>
      client.get<LeaderboardResponse>('/leaderboard/friends', { params: { matchId, limit } }),
  },
  profile: {
    badges: (userId: string) => client.get(`/profile/${userId}/badges`),
    history: (userId: string) => client.get(`/profile/${userId}/history`),
    recap: (userId: string, matchId: string) =>
      client.get<ApiRecap>(`/profile/${userId}/recap/${matchId}`),
  },
  miniGames: {
    submit: (data: MiniGameSubmitRequest) =>
      client.post<XpUpdatePayload>('/mini-games/submit', data),
  },
  friends: {
    list: () =>
      client.get<ApiFriendsListResponse>('/friends'),
    pending: () =>
      client.get<{ requests: ApiFriendRequest[] }>('/friends/pending'),
    sent: () =>
      client.get<{ requests: ApiSentRequest[] }>('/friends/sent'),
    request: (phone: string) =>
      client.post<ApiFriendRequestResponse>('/friends/request', { phone }),
    accept: (friendshipId: string) =>
      client.patch<ApiFriendship>(`/friends/${friendshipId}/accept`),
    cancel: (friendshipId: string) =>
      client.delete(`/friends/${friendshipId}/cancel`),
    remove: (friendUserId: string) =>
      client.delete(`/friends/${friendUserId}`),
  },
};

export default client;
