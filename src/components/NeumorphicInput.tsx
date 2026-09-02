import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';

interface NeumorphicInputProps extends TextInputProps {
  label: string;
  containerStyle?: ViewStyle;
}

export default function NeumorphicInput({
  label,
  containerStyle,
  ...inputProps
}: NeumorphicInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#94A3B8"
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E6E9EE',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minHeight: 62,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    padding: 0,
  },
});
