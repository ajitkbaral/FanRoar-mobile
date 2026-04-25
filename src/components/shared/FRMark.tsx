import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function FRMark({ size = 24, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3"  y="9"  width="3" height="6"  rx="1.5" fill={color} />
      <Rect x="8"  y="5"  width="3" height="14" rx="1.5" fill={color} />
      <Rect x="13" y="2"  width="3" height="20" rx="1.5" fill={color} />
      <Rect x="18" y="7"  width="3" height="10" rx="1.5" fill={color} />
    </Svg>
  );
}
