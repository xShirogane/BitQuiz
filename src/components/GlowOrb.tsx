import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface GlowOrbProps {
  color: string;
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

export const GlowOrb: React.FC<GlowOrbProps> = ({ color, size, top, left, right, bottom }) => {
  return (
    <View 
      pointerEvents="none" // Ważne: sprawia, że kółko nie blokuje klikania w elementy pod spodem!
      style={{ position: 'absolute', width: size, height: size, top, left, right, bottom }}
    >
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
            {/* offset="0%" to środek (najmocniejszy kolor), a 70% to zanikanie do przezroczystości */}
            <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <Stop offset="70%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>
    </View>
  );
};