import React from 'react';
import { View, StyleSheet } from 'react-native';

interface StatusAvatarProps {
  online: boolean;
}

export default function StatusAvatar({ online }: StatusAvatarProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: online ? '#22c55e' : '#a3a3a3' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
