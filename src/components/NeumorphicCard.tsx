import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { neomorph } from '../theme/neomorph';

interface NeumorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'card' | 'cardSm' | 'inset';
}

export default function NeumorphicCard({
  children,
  style,
  variant = 'card',
}: NeumorphicCardProps) {
  const baseStyle =
    variant === 'cardSm'
      ? neomorph.cardSm
      : variant === 'inset'
      ? neomorph.inset
      : neomorph.card;

  return <View style={[baseStyle, style]}>{children}</View>;
}
