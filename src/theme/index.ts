import { DARK, LIGHT, PALETTES, SEMANTIC, TeamKey } from './colors';

export type Theme = ReturnType<typeof buildTheme>;

export function buildTheme(dark: boolean, teamKey: TeamKey = 'brazil') {
  const base = dark ? DARK : LIGHT;
  const team = PALETTES[teamKey];
  return {
    dark,
    ...base,
    accent:    team.primary,
    accent2:   team.secondary,
    teamName:  team.name,
    teamCode:  team.code,
    ...SEMANTIC,
  };
}

export const DEFAULT_THEME = buildTheme(true, 'brazil');

export { TeamKey, PALETTES, DARK, LIGHT, SEMANTIC };
