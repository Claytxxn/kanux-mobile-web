import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // ou 'react-native-vector-icons/MaterialIcons'

const EmptyListIllustration = ({ message = "Nenhuma conversa encontrada" }) => (
  <View style={styles.container}>
    <MaterialIcons name="chat-bubble-outline" size={64} color="#bdbdbd" />
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  text: {
    marginTop: 16,
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
});

export default EmptyListIllustration;