import React, { createContext, useContext, useState } from 'react';
import translations from '../utils/translations';

const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState('en');
  const t = (key) => translations[lang][key] || translations['en'][key] || key;
  const toggleLang = () => setLang(l => l === 'en' ? 'hi' : 'en');
  return (
    <LangContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
