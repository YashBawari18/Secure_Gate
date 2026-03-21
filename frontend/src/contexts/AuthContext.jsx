import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token  = localStorage.getItem('sg_token');
    const stored = localStorage.getItem('sg_user');
    if (token && stored) {
      setUser(JSON.parse(stored));
      authAPI.me()
        .then(r => setUser(r.data.user))
        .catch(() => { localStorage.removeItem('sg_token'); localStorage.removeItem('sg_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('sg_token', token);
    localStorage.setItem('sg_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('sg_token');
    localStorage.removeItem('sg_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
