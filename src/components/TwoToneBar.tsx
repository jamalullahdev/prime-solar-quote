import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface TwoToneBarProps {
  style?: ViewStyle;
  height?: number;
}

export default function TwoToneBar({ style, height = 4 }: TwoToneBarProps) {
  return (
    <View style={[styles.container, { height }, style]}>
      <View style={styles.navySegment} />
      <View style={styles.orangeSegment} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
  },
  navySegment: {
    width: '70%',
    height: '100%',
    backgroundColor: colors.twoToneNavy,
  },
  orangeSegment: {
    width: '30%',
    height: '100%',
    backgroundColor: colors.twoToneOrange,
  },
});
