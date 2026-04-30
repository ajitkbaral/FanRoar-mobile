// oklch → hex conversions for React Native (oklch not supported in RN)

export const DARK = {
  bg:           '#13141D',
  bgRaised:     '#191B26',
  surface:      '#1E2130',
  surface2:     '#242738',
  border:       '#2B2F42',
  borderStrong: '#373C54',
  text:         '#F5F6FB',
  textDim:      '#A3A6B5',
  textMute:     '#6E7283',
};

export const LIGHT = {
  bg:           '#F7F8FD',
  bgRaised:     '#EFF0F8',
  surface:      '#FFFFFF',
  surface2:     '#E8EAEF',
  border:       '#D3D6E0',
  borderStrong: '#B3B8C8',
  text:         '#1A1C27',
  textDim:      '#4A4E60',
  textMute:     '#888C9C',
};

export interface TeamPalette {
  primary:   string;
  secondary: string;
  name:      string;
}

// Neutral fallback used when a team code has no entry in TEAM_PALETTES
export const FALLBACK_PALETTE: TeamPalette = {
  primary:   '#66E040',
  secondary: '#E85030',
  name:      'Neutral',
};

// Primary and secondary kit colors for all WC 2026 participants.
// Add new entries as qualification is confirmed — unknown codes fall back to FALLBACK_PALETTE.
export const TEAM_PALETTES: Record<string, TeamPalette> = {
  // CONMEBOL
  BRA: { primary: '#E8C429', secondary: '#3D7A4A', name: 'Brazil' },
  ARG: { primary: '#62AFE0', secondary: '#F4F5F7', name: 'Argentina' },
  URU: { primary: '#5EB6E4', secondary: '#F4F5F7', name: 'Uruguay' },
  COL: { primary: '#FCD116', secondary: '#CE1126', name: 'Colombia' },
  ECU: { primary: '#FFD100', secondary: '#034EA2', name: 'Ecuador' },
  CHL: { primary: '#D52B1E', secondary: '#F4F5F7', name: 'Chile' },
  PAR: { primary: '#D52B1E', secondary: '#F4F5F7', name: 'Paraguay' },
  BOL: { primary: '#007A3D', secondary: '#F4C400', name: 'Bolivia' },
  PER: { primary: '#D91023', secondary: '#F4F5F7', name: 'Peru' },
  VEN: { primary: '#CF142B', secondary: '#002868', name: 'Venezuela' },
  // UEFA
  FRA: { primary: '#6060E0', secondary: '#E8302A', name: 'France' },
  GER: { primary: '#A0A4B0', secondary: '#1A1C27', name: 'Germany' },
  ENG: { primary: '#E85030', secondary: '#F4F5F7', name: 'England' },
  ESP: { primary: '#E8A000', secondary: '#C8102E', name: 'Spain' },
  POR: { primary: '#CF142B', secondary: '#006600', name: 'Portugal' },
  NED: { primary: '#FF6600', secondary: '#003087', name: 'Netherlands' },
  BEL: { primary: '#EF3340', secondary: '#1A1C27', name: 'Belgium' },
  ITA: { primary: '#003087', secondary: '#F4F5F7', name: 'Italy' },
  CRO: { primary: '#CF142B', secondary: '#F4F5F7', name: 'Croatia' },
  SUI: { primary: '#D52B1E', secondary: '#F4F5F7', name: 'Switzerland' },
  DEN: { primary: '#CF142B', secondary: '#F4F5F7', name: 'Denmark' },
  AUT: { primary: '#CF142B', secondary: '#F4F5F7', name: 'Austria' },
  TUR: { primary: '#E30A17', secondary: '#F4F5F7', name: 'Turkey' },
  SRB: { primary: '#CF142B', secondary: '#003087', name: 'Serbia' },
  POL: { primary: '#F4F5F7', secondary: '#CF142B', name: 'Poland' },
  SCO: { primary: '#003087', secondary: '#CF142B', name: 'Scotland' },
  WAL: { primary: '#CF142B', secondary: '#007A3D', name: 'Wales' },
  SVK: { primary: '#003087', secondary: '#CF142B', name: 'Slovakia' },
  SVN: { primary: '#003087', secondary: '#F4F5F7', name: 'Slovenia' },
  ALB: { primary: '#E8302A', secondary: '#1A1C27', name: 'Albania' },
  HUN: { primary: '#CF142B', secondary: '#007A3D', name: 'Hungary' },
  GRE: { primary: '#003087', secondary: '#F4F5F7', name: 'Greece' },
  ROU: { primary: '#FFD700', secondary: '#003087', name: 'Romania' },
  // CONCACAF
  MEX: { primary: '#00B840', secondary: '#CE1126', name: 'Mexico' },
  USA: { primary: '#B22234', secondary: '#3C3B6E', name: 'United States' },
  CAN: { primary: '#D80621', secondary: '#F4F5F7', name: 'Canada' },
  CRC: { primary: '#002B7F', secondary: '#CE1126', name: 'Costa Rica' },
  PAN: { primary: '#DA121A', secondary: '#003F87', name: 'Panama' },
  HON: { primary: '#0073CF', secondary: '#F4F5F7', name: 'Honduras' },
  JAM: { primary: '#1A1C27', secondary: '#FED100', name: 'Jamaica' },
  SLV: { primary: '#0F47AF', secondary: '#F4F5F7', name: 'El Salvador' },
  GUA: { primary: '#003F87', secondary: '#F4F5F7', name: 'Guatemala' },
  TTO: { primary: '#CE1126', secondary: '#1A1C27', name: 'Trinidad & Tobago' },
  // AFC
  JPN: { primary: '#003087', secondary: '#BC002D', name: 'Japan' },
  KOR: { primary: '#C9353F', secondary: '#003478', name: 'South Korea' },
  AUS: { primary: '#FFD700', secondary: '#00843D', name: 'Australia' },
  IRN: { primary: '#239F40', secondary: '#DA0000', name: 'Iran' },
  KSA: { primary: '#006C35', secondary: '#F4F5F7', name: 'Saudi Arabia' },
  QAT: { primary: '#8D1B3D', secondary: '#F4F5F7', name: 'Qatar' },
  IRQ: { primary: '#007A3D', secondary: '#CF142B', name: 'Iraq' },
  JOR: { primary: '#007A3D', secondary: '#CF142B', name: 'Jordan' },
  IDN: { primary: '#CE1126', secondary: '#F4F5F7', name: 'Indonesia' },
  CHN: { primary: '#DE2910', secondary: '#FFD700', name: 'China' },
  UZB: { primary: '#009CBD', secondary: '#1EB53A', name: 'Uzbekistan' },
  UAE: { primary: '#00732F', secondary: '#F4F5F7', name: 'UAE' },
  // CAF
  MAR: { primary: '#C1272D', secondary: '#006233', name: 'Morocco' },
  SEN: { primary: '#00853F', secondary: '#FDEF42', name: 'Senegal' },
  CMR: { primary: '#007A5E', secondary: '#CE1126', name: 'Cameroon' },
  GHA: { primary: '#006B3F', secondary: '#FCD116', name: 'Ghana' },
  NGA: { primary: '#008751', secondary: '#F4F5F7', name: 'Nigeria' },
  CIV: { primary: '#F77F00', secondary: '#009A44', name: "Côte d'Ivoire" },
  EGY: { primary: '#CC0001', secondary: '#F4F5F7', name: 'Egypt' },
  ALG: { primary: '#006233', secondary: '#F4F5F7', name: 'Algeria' },
  TUN: { primary: '#E70013', secondary: '#F4F5F7', name: 'Tunisia' },
  ZAF: { primary: '#007A4D', secondary: '#FFB81C', name: 'South Africa' },
  COD: { primary: '#007FFF', secondary: '#F7D000', name: 'DR Congo' },
  MLI: { primary: '#14B53A', secondary: '#CE1126', name: 'Mali' },
  // OFC
  NZL: { primary: '#1A1C27', secondary: '#F4F5F7', name: 'New Zealand' },
};

export const SEMANTIC = {
  danger:  '#E85030',
  success: '#4ADE80',
  warning: '#E8C000',
};
