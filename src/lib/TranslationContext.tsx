import React, { createContext, useContext, useEffect, useState } from 'react';
import { TRANSLATIONS, Translation, getTranslation } from './translations';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';

type TranslationContextType = {
  translation: string;
  translationName: string;
  setTranslation: (code: string) => void;
  availableTranslations: Translation[];
};

const TranslationContext = createContext<TranslationContextType>({
  translation: 'web',
  translationName: 'World English Bible',
  setTranslation: () => {},
  availableTranslations: TRANSLATIONS,
});

export const TranslationProvider = ({ children }: { children: React.ReactNode }) => {
  const [translation, setTranslationState] = useState<string>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem('bible-translation');
    return stored || 'web';
  });

  const { user } = useAuth();

  // Load user's preferred translation from Supabase when user logs in
  useEffect(() => {
    const loadUserPreference = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferred_translation')
          .eq('id', user.id)
          .single();

        if (data?.preferred_translation) {
          setTranslationState(data.preferred_translation);
          localStorage.setItem('bible-translation', data.preferred_translation);
        }
      }
    };

    loadUserPreference();
  }, [user?.id]);

  // Sync to localStorage whenever translation changes
  useEffect(() => {
    localStorage.setItem('bible-translation', translation);
  }, [translation]);

  // Sync to Supabase when user is authenticated
  useEffect(() => {
    const syncToSupabase = async () => {
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ preferred_translation: translation })
          .eq('id', user.id);
      }
    };

    syncToSupabase();
  }, [translation, user?.id]);

  const setTranslation = (code: string) => {
    setTranslationState(code);
  };

  const translationName = getTranslation(translation)?.name || 'World English Bible';

  return (
    <TranslationContext.Provider
      value={{
        translation,
        translationName,
        setTranslation,
        availableTranslations: TRANSLATIONS,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
