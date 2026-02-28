import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPreferences, savePreferences } from '../utils/storage';

interface Preferences { allergens: string[]; diets: string[]; }

interface PreferencesContextType {
  preferences: Preferences;
  toggleAllergen: (a: string) => void;
  toggleDiet: (d: string) => void;
}

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: { allergens: [], diets: [] },
  toggleAllergen: () => {},
  toggleDiet: () => {},
});

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<Preferences>({ allergens: [], diets: [] });

  useEffect(() => { getPreferences().then(setPreferences); }, []);

  const toggleAllergen = async (allergen: string) => {
    const updated = preferences.allergens.includes(allergen)
      ? preferences.allergens.filter(a => a !== allergen)
      : [...preferences.allergens, allergen];
    const next = { ...preferences, allergens: updated };
    setPreferences(next);
    await savePreferences(next);
  };

  const toggleDiet = async (diet: string) => {
    const updated = preferences.diets.includes(diet)
      ? preferences.diets.filter(d => d !== diet)
      : [...preferences.diets, diet];
    const next = { ...preferences, diets: updated };
    setPreferences(next);
    await savePreferences(next);
  };

  return (
    <PreferencesContext.Provider value={{ preferences, toggleAllergen, toggleDiet }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
