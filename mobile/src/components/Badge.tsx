import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

type BadgeVariant = 'soft' | 'outline' | 'solid';

interface BadgeProps {
  label: string;
  color: string;
  variant?: BadgeVariant;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export function Badge({
  label,
  color,
  variant = 'soft',
  style,
  textStyle,
}: BadgeProps) {
  const backgroundColor = variant === 'solid'
    ? color
    : variant === 'outline'
      ? 'transparent'
      : colors.surfaceContainerHigh;

  const borderColor = color;
  const textColor = variant === 'solid' ? colors.white : color;

  return (
    <View style={[styles.badge, { backgroundColor, borderColor }, style]}>
      <Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
