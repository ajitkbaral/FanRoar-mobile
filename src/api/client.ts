import axios from 'axios';
import { useUserStore } from '../store/userStore';
import { mapMatch, BackendMatch } from './types';

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
    verifyOtp: (phone: string, otp: string) => client.post('/auth/verify-otp', { phone, otp }),
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
    byId: async (id: string) => {
      const res = await client.get<BackendMatch>(`/matches/${id}`);
      return { ...res, data: mapMatch(res.data) };
    },
  },
  leaderboard: {
    global: (matchId: string, limit = 20) =>
      client.get('/leaderboard/global', { params: { matchId, limit } }),
    country: (matchId: string, countryCode: string) =>
      client.get('/leaderboard/country', { params: { matchId, countryCode } }),
    city: (matchId: string, cityCode: string) =>
      client.get('/leaderboard/city', { params: { matchId, cityCode } }),
    friends: (matchId: string) =>
      client.get('/leaderboard/friends', { params: { matchId } }),
  },
  profile: {
    badges: (userId: string) => client.get(`/profile/${userId}/badges`),
    history: (userId: string) => client.get(`/profile/${userId}/history`),
    recap: (userId: string, matchId: string) =>
      client.get(`/profile/${userId}/recap/${matchId}`),
  },
};

export default client;
