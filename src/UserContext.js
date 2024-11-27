// src/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from './constants';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [ userId, setUserId ] = useState(
    sessionStorage.getItem(STORAGE_KEYS.PARTICIPANT_ID) || ''
  );

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.PARTICIPANT_ID, userId);
  }, [ userId ]);

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);