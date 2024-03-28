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
      const token = localStorage.getItem('token');
      if (token) {
        try{
        fetch('http://localhost:9000/name', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email: user.email }),
        })
        .then(response => response.json())
        .then(data => {
          console.log(data);
          if (data.firstName) {
            setUser({ firstName: data.firstName, email: data.email });
          }
        });
      }
      catch(err){
        console.log(err)
      }
      }
    }
  }, [loading]);

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
