import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTheme, saveTheme } from '../utils/storage';

export const Colors = {
  light: {
    background: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceAlt: '#F0F2F5',
    primary: '#2ecc71',
    primaryLight: '#e8f8f0',
    text: '#1a1a1a',
    textSecondary: '#555',
    textMuted: '#999',
    border: '#E5E7EB',
    error: '#e74c3c',
    card: '#FFFFFF',
    tabBar: '#FFFFFF',
  },
  dark: {
    background: '#0F1923',
    surface: '#1A2634',
    surfaceAlt: '#1E2D3D',
    primary: '#2ecc71',
    primaryLight: '#1a3a2a',
    text: '#F0F4F8',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    border: '#2D3748',
    error: '#e74c3c',
    card: '#1A2634',
    tabBar: '#111827',
  },
};

export type AppColors = typeof Colors.light;

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: AppColors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: Colors.light,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => { getTheme().then(setIsDark); }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await saveTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: isDark ? Colors.dark : Colors.light }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
