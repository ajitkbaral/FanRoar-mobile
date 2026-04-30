import { DARK, LIGHT, TEAM_PALETTES, FALLBACK_PALETTE, SEMANTIC } from './colors';

export type Theme = ReturnType<typeof buildTheme>;

export function buildTheme(dark: boolean, teamCode: string = 'BRA') {
  const base = dark ? DARK : LIGHT;
  const team = TEAM_PALETTES[teamCode] ?? FALLBACK_PALETTE;
  return {
    dark,
    ...base,
    accent:    team.primary,
    accent2:   team.secondary,
    teamName:  team.name,
    teamCode,
    ...SEMANTIC,
  };
}

export const DEFAULT_THEME = buildTheme(true, 'BRA');

export { TEAM_PALETTES, FALLBACK_PALETTE, DARK, LIGHT, SEMANTIC };
