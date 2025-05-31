import React, { createContext, useContext, useState, useCallback } from 'react';

const FavoriteContext = createContext();

export const useFavorite = () => useContext(FavoriteContext);

export const FavoriteProvider = ({ children }) => {
  const [favoriteChanged, setFavoriteChanged] = useState(0);

  // Call this after add/remove favorite
  const notifyFavoriteChanged = useCallback(() => {
    setFavoriteChanged(c => c + 1);
  }, []);

  return (
    <FavoriteContext.Provider value={{ favoriteChanged, notifyFavoriteChanged }}>
      {children}
    </FavoriteContext.Provider>
  );
};