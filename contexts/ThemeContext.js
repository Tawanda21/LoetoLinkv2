import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

const lightTheme = {
  background: '#f6f7fa',
  card: '#fff',
  text: '#222',
  button: '#2d9cdb',
  buttonText: '#fff',
  input: '#fff',
  inputText: '#222',
};

const darkTheme = {
  background: '#000',
  card: '#181818',
  text: '#fff',
  button: '#fff',
  buttonText: '#000',
  input: '#222',
  inputText: '#fff',
};

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(false);
  const theme = dark ? darkTheme : lightTheme;
  const toggleTheme = () => setDark((d) => !d);

  return (
    <ThemeContext.Provider value={{ theme, dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);