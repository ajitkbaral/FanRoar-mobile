import { create } from 'zustand';
import { EventMode } from '../utils/constants';

interface MatchEvent {
  type: string;
  teamId: string;
  timestamp: number;
}

export interface MatchTeam {
  id: string;
  code: string;
  name: string;
  flagUrl?: string;
  color?: string;
}

export interface Match {
  id: string;
  teamA: MatchTeam;
  teamB: MatchTeam;
  status: 'live' | 'halftime' | 'extratime' | 'penalties' | 'upcoming' | 'finished';
  minute?: number;
  half?: 1 | 2;
  stage?: string;
  tournament?: { name: string; shortName: string; logoUrl?: string };
}

interface MatchState {
  match: Match | null;
  lastMatchId: string | null;
  joinedMatchId: string | null;
  scoreA: number;
  scoreB: number;
  penaltyScoreA: number;
  penaltyScoreB: number;
  momentum: number; // 0–100, teamA = left
  eventMode: EventMode;
  matchEvents: MatchEvent[];
  fanCount: number;
  supportingTeamId: string | null;
  completedMiniGames: string[];

  setMatch: (match: Match) => void;
  setJoinedMatchId: (id: string | null) => void;
  setMatchStatus: (status: Match['status']) => void;
  setScores: (scoreA: number, scoreB: number) => void;
  setPenaltyScores: (penaltyScoreA: number, penaltyScoreB: number) => void;
  setMomentum: (momentum: number | ((prev: number) => number)) => void;
  setEventMode: (mode: EventMode) => void;
  addMatchEvent: (event: Omit<MatchEvent, 'timestamp'>) => void;
  setFanCount: (count: number) => void;
  setSupportingTeamId: (id: string | null) => void;
  completeMiniGame: (key: string) => void;
  resetMatch: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  match: null,
  lastMatchId: null,
  joinedMatchId: null,
  scoreA: 0,
  scoreB: 0,
  penaltyScoreA: 0,
  penaltyScoreB: 0,
  momentum: 50,
  eventMode: 'normal',
  matchEvents: [],
  fanCount: 0,
  supportingTeamId: null,
  completedMiniGames: [],

  setMatch: (match) => set((s) => {
    const sameMatch = s.match?.id === match.id;
    const initialHalf: 1 | 2 = (match.minute ?? 0) > 45 ? 2 : 1;
    return {
      match: { ...match, half: sameMatch ? (s.match?.half ?? initialHalf) : initialHalf },
      lastMatchId: match.id,
      scoreA: sameMatch ? s.scoreA : 0,
      scoreB: sameMatch ? s.scoreB : 0,
      penaltyScoreA: sameMatch ? s.penaltyScoreA : 0,
      penaltyScoreB: sameMatch ? s.penaltyScoreB : 0,
      momentum: sameMatch ? s.momentum : 50,
      eventMode: sameMatch ? s.eventMode : 'normal',
      supportingTeamId: sameMatch ? s.supportingTeamId : null,
      completedMiniGames: sameMatch ? s.completedMiniGames : [],
    };
  }),
  setJoinedMatchId: (id) => set({ joinedMatchId: id }),
  setMatchStatus: (status) => set((s) => ({
    match: s.match ? {
      ...s.match,
      status,
      half: s.match.status === 'halftime' && status === 'live' ? 2 : s.match.half,
    } : null,
  })),
  setScores: (scoreA, scoreB) => set({ scoreA, scoreB }),
  setPenaltyScores: (penaltyScoreA, penaltyScoreB) => set({ penaltyScoreA, penaltyScoreB }),
  setMomentum: (momentum) => set((s) => ({
    momentum: Math.max(0, Math.min(100, typeof momentum === 'function' ? momentum(s.momentum) : momentum)),
  })),
  setEventMode: (eventMode) => set({ eventMode }),
  addMatchEvent: (event) => set((s) => ({
    matchEvents: [{ ...event, timestamp: Date.now() }, ...s.matchEvents].slice(0, 50),
  })),
  setFanCount: (fanCount) => set({ fanCount }),
  setSupportingTeamId: (supportingTeamId) => set({ supportingTeamId }),
  completeMiniGame: (key) => set((s) => ({
    completedMiniGames: s.completedMiniGames.includes(key) ? s.completedMiniGames : [...s.completedMiniGames, key],
  })),
  resetMatch: () => set((s) => ({
    match: null, lastMatchId: s.match?.id ?? s.lastMatchId, joinedMatchId: null, scoreA: 0, scoreB: 0, penaltyScoreA: 0, penaltyScoreB: 0, momentum: 50, eventMode: 'normal', matchEvents: [], fanCount: 0, supportingTeamId: null, completedMiniGames: [],
  })),
}));
