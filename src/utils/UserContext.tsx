import React, { createContext, useContext, useState } from 'react';

// Define the user shape
export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Default user (can be empty or mock)
const defaultUser: User = {
  userId: 'user_12345abc',
  firstName: 'Gaurav',
  lastName: 'Naik',
  email: 'gaurav.naik@example.com',
};

// Context type
interface UserContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(defaultUser);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 