export interface ApiMatch {
  matchId: string;
  teamA: { code: string; name: string; flagUrl?: string };
  teamB: { code: string; name: string; flagUrl?: string };
  status: 'live' | 'upcoming' | 'finished';
  kickoffTime: string;
  stage: string;
  scores?: { teamA: number; teamB: number };
  momentumRatio?: number;
}

export interface ApiUser {
  userId: string;
  displayName: string;
  phone: string;
  fanRole: string;
  teamKey: string;
  xp: number;
  level: number;
  badges: ApiBadge[];
  countryCode: string;
  cityCode: string;
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

export interface ApiRecap {
  matchId: string;
  energyDelivered: number;
  shakeEvents: number;
  tapCombos: number;
  rank: number;
  impactPercent: number;
  badgesUnlocked: ApiBadge[];
}
