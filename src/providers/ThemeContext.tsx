'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type FontStyle = 'sans' | 'serif';

type ThemeContextType = {
  fontStyle: FontStyle;
  toggleFontStyle: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  fontStyle: 'sans',
  toggleFontStyle: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontStyle, setFontStyle] = useState<FontStyle>('sans');
  const [hydrated, setHydrated] = useState(false);

  // localStorage is only available in the browser, so read it after mount.
  useEffect(() => {
    if (localStorage.getItem('verse-font') === 'serif') setFontStyle('serif');
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem('verse-font', fontStyle);
  }, [fontStyle, hydrated]);

  const toggleFontStyle = () => setFontStyle(f => f === 'sans' ? 'serif' : 'sans');

  return (
    <ThemeContext.Provider value={{ fontStyle, toggleFontStyle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
