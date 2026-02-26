import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>Mode Sombre</Text>
      <Switch 
        value={theme === 'dark'} 
        onValueChange={toggleTheme}
        trackColor={{ false: "#767577", true: colors.primary }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 20 },
  text: { fontSize: 18, fontWeight: 'bold' }
}); 