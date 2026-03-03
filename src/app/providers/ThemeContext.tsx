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
  const [fontStyle, setFontStyle] = useState<FontStyle>(() => {
    const stored = localStorage.getItem('verse-font');
    return stored === 'serif' ? 'serif' : 'sans';
  });

  useEffect(() => {
    localStorage.setItem('verse-font', fontStyle);
  }, [fontStyle]);

  const toggleFontStyle = () => setFontStyle(f => f === 'sans' ? 'serif' : 'sans');

  return (
    <ThemeContext.Provider value={{ fontStyle, toggleFontStyle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
