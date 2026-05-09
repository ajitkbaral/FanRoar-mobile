export interface ApiMatch {
  matchId: string;
  teamA: { id: string; code: string; name: string; flagUrl?: string };
  teamB: { id: string; code: string; name: string; flagUrl?: string };
  status: 'live' | 'halftime' | 'upcoming' | 'finished';
  kickoffTime: string;
  stage: string;
  scores: { teamA: number; teamB: number };
  momentumRatio?: number;
  minute?: number;
  tournament?: { name: string; shortName: string; logoUrl?: string };
  teamAColor?: string | null;
  teamBColor?: string | null;
}

// Raw Prisma shapes returned by the backend
interface _BackendTeam {
  id: string;
  name: string;
  teamCode: string;
  flagUrl?: string | null;
}

interface _BackendMatchTotal {
  teamId: string;
  totalEnergy: number;
  momentumRatio: number;
}

interface _BackendTournament {
  name: string;
  shortName: string;
  logoUrl?: string | null;
}

export interface BackendMatch {
  id: string;
  teamA: _BackendTeam;
  teamB: _BackendTeam;
  status: string;
  startTime: string;
  sport: string;
  scoreA?: number;
  scoreB?: number;
  teamAColor?: string | null;
  teamBColor?: string | null;
  matchTotals?: _BackendMatchTotal[];
  tournament?: _BackendTournament | null;
}

export function mapMatchStatus(s: string): ApiMatch['status'] {
  if (s === 'LIVE') return 'live';
  if (s === 'HALF_TIME') return 'halftime';
  if (s === 'FULL_TIME' || s === 'CANCELLED') return 'finished';
  return 'upcoming';
}

export function mapMatch(m: BackendMatch): ApiMatch {
  const teamATotal = m.matchTotals?.find((t) => t.teamId === m.teamA.id);
  return {
    matchId: m.id,
    teamA: { id: m.teamA.id, code: m.teamA.teamCode, name: m.teamA.name, flagUrl: m.teamA.flagUrl ?? undefined },
    teamB: { id: m.teamB.id, code: m.teamB.teamCode, name: m.teamB.name, flagUrl: m.teamB.flagUrl ?? undefined },
    status: mapMatchStatus(m.status),
    kickoffTime: m.startTime,
    stage: m.sport,
    scores: { teamA: m.scoreA ?? 0, teamB: m.scoreB ?? 0 },
    momentumRatio: teamATotal?.momentumRatio,
    tournament: m.tournament
      ? { name: m.tournament.name, shortName: m.tournament.shortName, logoUrl: m.tournament.logoUrl ?? undefined }
      : undefined,
    teamAColor: m.teamAColor ?? null,
    teamBColor: m.teamBColor ?? null,
  };
}

export interface ApiUser {
  userId: string;
  displayName: string;
  phone: string;
  fanRole: string;
  teamKey: string;
  xp: number;           // XP within the current level band (for progress bar)
  totalXp: number;      // lifetime cumulative XP
  level: number;
  xpToNextLevel: number;
  badges: ApiBadge[];
  countryCode: string;
  cityCode: string;
}

export interface XpUpdatePayload {
  xpAwarded: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  xpInBand: number;
  xpToNextLevel: number;
}

export interface MiniGameSubmitRequest {
  matchId: string;
  gameType: 'penalty' | 'reaction' | 'hottake' | 'hype';
  gameState: Record<string, unknown>;
}

export interface ApiBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: string;
}

export interface ApiLeaderboardEntry {
  rank: number;
  userId?: string;
  name: string;
  code: string;
  score: number;
  color: string;
  isYou?: boolean;
}

export interface LeaderboardResponse {
  topList: ApiLeaderboardEntry[];
  you: ApiLeaderboardEntry | null;
}

export type FriendshipStatus = 'PENDING' | 'ACCEPTED';

export interface ApiFriendship {
  id: string;
  friendUserId: string;
  friendName: string;
  friendCountryCode: string | null;
  status: FriendshipStatus;
  createdAt: string;
}

export interface ApiFriendRequest {
  id: string;
  requesterUserId: string;
  requesterName: string;
  requesterCountryCode: string | null;
  createdAt: string;
}

export interface ApiFriendsListResponse {
  friends: ApiFriendship[];
  pendingCount: number;
}

export interface ApiSentRequest {
  id: string;
  addresseeUserId: string;
  addresseeName: string;
  addresseeCountryCode: string | null;
  createdAt: string;
}

export interface ApiFriendRequestResponse {
  friendship: ApiFriendship;
  message: string;
}

export interface ApiHistoryEntry {
  matchId: string;
  energyContributed: number;
  match: {
    id: string;
    teamA: { name: string };
    teamB: { name: string };
    startTime: string;
  };
}

export interface ApiRecap {
  matchId: string;
  energyDelivered: number;
  shakeEvents: number;
  tapCombos: number;
  rank: number;
  impactPercent: number;
  badgesUnlocked: ApiBadge[];
  match: {
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
    stage: string;
    date: string;
    venue: string;
  };
}
