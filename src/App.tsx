import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { PreferencesProvider } from './context/PreferencesContext';
import AppNavigator from './navigation/AppNavigator';

function Root() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <Root />
      </PreferencesProvider>
    </ThemeProvider>
  );
}
