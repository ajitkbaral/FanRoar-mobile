import React from 'react';
import Svg, { Path, Circle, Rect, Ellipse } from 'react-native-svg';

interface Props {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function FRIcon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8 }: Props) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' } as const;
  const s = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'home':
      return <Svg {...props}><Path d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z" {...s} /></Svg>;
    case 'pulse':
      return <Svg {...props}><Path d="M3 12h4l2-7 4 14 2-7h6" {...s} /></Svg>;
    case 'trophy':
      return <Svg {...props}><Path d="M7 4h10v6a5 5 0 01-10 0V4zM4 4h3v3a3 3 0 01-3-3zM17 4h3a3 3 0 01-3 3V4zM10 18h4v3h-4zM8 21h8" {...s} /></Svg>;
    case 'profile':
      return <Svg {...props}><Circle cx="12" cy="8" r="4" {...s} /><Path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" {...s} /></Svg>;
    case 'bolt':
      return <Svg {...props}><Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill={color} /></Svg>;
    case 'shake':
      return <Svg {...props}><Path d="M5 8l4-4M5 16l4 4M19 8l-4-4M19 16l-4 4M9 4h6M9 20h6M5 8v8M19 8v8" {...s} /></Svg>;
    case 'mic':
      return <Svg {...props}><Rect x="9" y="3" width="6" height="12" rx="3" {...s} /><Path d="M5 11a7 7 0 0014 0M12 18v3" {...s} /></Svg>;
    case 'plus':
      return <Svg {...props}><Path d="M12 5v14M5 12h14" {...s} /></Svg>;
    case 'bell':
      return <Svg {...props}><Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" {...s} /></Svg>;
    case 'bell-fill':
      return <Svg {...props}><Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" /><Path d="M13.73 21a2 2 0 01-3.46 0" {...s} /></Svg>;
    case 'arrow':
      return <Svg {...props}><Path d="M5 12h14M13 6l6 6-6 6" {...s} /></Svg>;
    case 'play':
      return <Svg {...props}><Path d="M6 4l14 8-14 8V4z" fill={color} /></Svg>;
    case 'flag':
      return <Svg {...props}><Path d="M5 21V4M5 4h13l-3 4 3 4H5" {...s} /></Svg>;
    case 'shield':
      return <Svg {...props}><Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" {...s} /></Svg>;
    case 'fire':
      return <Svg {...props}><Path d="M12 3c1 5 6 5 6 11a6 6 0 11-12 0c0-3 1.5-4 3-5-1 3 1 5 3 4-1-3 0-7 0-10z" {...s} /></Svg>;
    case 'check':
      return <Svg {...props}><Path d="M5 12l4 4 10-10" {...s} /></Svg>;
    case 'close':
      return <Svg {...props}><Path d="M6 6l12 12M18 6L6 18" {...s} /></Svg>;
    case 'share':
      return <Svg {...props}><Path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5" {...s} /></Svg>;
    case 'crown':
      return <Svg {...props}><Path d="M3 8l3 9h12l3-9-5 4-4-7-4 7-5-4z" {...s} /></Svg>;
    case 'sparkle':
      return <Svg {...props}><Path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" {...s} /></Svg>;
    case 'globe':
      return <Svg {...props}><Circle cx="12" cy="12" r="9" {...s} /><Path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" {...s} /></Svg>;
    case 'users':
      return <Svg {...props}><Circle cx="9" cy="8" r="3.5" {...s} /><Path d="M2 20c0-3 3-5 7-5s7 2 7 5M16 14c3 0 6 1.5 6 4" {...s} /><Circle cx="17" cy="9" r="2.5" {...s} /></Svg>;
    case 'drum':
      return <Svg {...props}><Ellipse cx="12" cy="7" rx="8" ry="3" {...s} /><Path d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M9 4l3-2M15 4l-3-2" {...s} /></Svg>;
    case 'lightning':
      return <Svg {...props}><Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" {...s} /></Svg>;
    case 'megaphone':
      return <Svg {...props}><Path d="M3 11v2a2 2 0 002 2h2l5 5V4L7 9H5a2 2 0 00-2 2zM18 8a6 6 0 010 8" {...s} /></Svg>;
    case 'settings':
      return <Svg {...props}><Circle cx="12" cy="12" r="3" {...s} /><Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...s} /></Svg>;
    case 'log-out':
      return <Svg {...props}><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" {...s} /></Svg>;
    case 'star':
      return <Svg {...props}><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...s} /></Svg>;
    case 'back':
      return <Svg {...props}><Path d="M15 6l-6 6 6 6" {...s} /></Svg>;
    case 'chevron-down':
      return <Svg {...props}><Path d="M4 8l8 8 8-8" {...s} /></Svg>;
    case 'search':
      return <Svg {...props}><Circle cx="10" cy="10" r="6" {...s} /><Path d="M14.5 14.5l4 4" {...s} /></Svg>;
    default:
      return <Svg {...props}><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...s} /></Svg>;
  }
}
