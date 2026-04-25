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

export const PALETTES = {
  brazil: {
    primary:   '#E8C429',
    secondary: '#3D7A4A',
    name:      'Brazil',
    code:      'BRA',
  },
  argentina: {
    primary:   '#62AFE0',
    secondary: '#F4F5F7',
    name:      'Argentina',
    code:      'ARG',
  },
  energy: {
    primary:   '#66E040',
    secondary: '#E85030',
    name:      'Energy',
    code:      'ENG',
  },
} as const;

export type TeamKey = keyof typeof PALETTES;

export const SEMANTIC = {
  danger:  '#E85030',
  success: '#4ADE80',
  warning: '#E8C000',
};

// Opponent team colors used in match screens
export const TEAM_COLORS: Record<string, string> = {
  BRA: '#E8C429',
  ARG: '#62AFE0',
  FRA: '#6060E0',
  GER: '#A0A4B0',
  ENG: '#E85030',
  ESP: '#E8A000',
  MEX: '#00B840',
  USA: '#B22234',
};
