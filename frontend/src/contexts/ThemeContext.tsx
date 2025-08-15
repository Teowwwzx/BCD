// frontend/src/contexts/ThemeContext.tsx
'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme: Theme = 'dark';

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
      <ThemeContext.Provider value={{ theme }}>
        {children}
      </ThemeContext.Provider>
  );
};