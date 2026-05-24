import React, { createContext, useState, useContext } from "react";

/**
 * Global user state shared across the entire app.
 * Populated by {@link useUser} on mount and cleared on logout.
 * Avoids prop-drilling the authenticated user object through component trees.
 */
const AppContext = createContext(null);

export const AppContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const clearUser = () => setUser(null);

  return (
    <AppContext.Provider value={{ user, setUser, clearUser }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
