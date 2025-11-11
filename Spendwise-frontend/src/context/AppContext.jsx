import React, { createContext, useState, useContext } from "react";

const AppContext = createContext(null);

export const AppContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const clearUser = () => setUser(null);

  const value = {
    user,
    setUser,
    clearUser
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
