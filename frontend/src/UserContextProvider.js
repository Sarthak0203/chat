import React, { createContext, useEffect, useState } from 'react';

export const UserContext = createContext();

const usePersistedState = (key, defaultValue) => {
  const [state, setState] = useState(
    () => JSON.parse(localStorage.getItem(key)) || defaultValue
  );

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = usePersistedState('user', null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      setUser(user);
    }
  }, [user, loading]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const contextValue = {
    user,
    setUser,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
