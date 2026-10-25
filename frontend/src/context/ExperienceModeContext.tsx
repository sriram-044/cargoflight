import React, { createContext, useContext, useState, useEffect } from 'react';

export type ExperienceMode = 'simple' | 'operations';

interface ExperienceModeContextType {
  mode: ExperienceMode;
  setMode: (mode: ExperienceMode) => void;
  toggleMode: () => void;
  isSimple: boolean;
  isOperations: boolean;
}

const ExperienceModeContext = createContext<ExperienceModeContextType | undefined>(undefined);

export const ExperienceModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ExperienceMode>(() => {
    const saved = localStorage.getItem('flytrack_mode');
    return (saved === 'operations' || saved === 'simple') ? saved : 'simple';
  });

  const setMode = (newMode: ExperienceMode) => {
    setModeState(newMode);
    localStorage.setItem('flytrack_mode', newMode);
  };

  const toggleMode = () => {
    setMode(mode === 'simple' ? 'operations' : 'simple');
  };

  useEffect(() => {
    localStorage.setItem('flytrack_mode', mode);
  }, [mode]);

  return (
    <ExperienceModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isSimple: mode === 'simple',
        isOperations: mode === 'operations',
      }}
    >
      {children}
    </ExperienceModeContext.Provider>
  );
};

export const useExperienceMode = (): ExperienceModeContextType => {
  const context = useContext(ExperienceModeContext);
  if (!context) {
    throw new Error('useExperienceMode must be used within an ExperienceModeProvider');
  }
  return context;
};
