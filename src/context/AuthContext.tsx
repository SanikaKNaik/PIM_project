import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

export interface UserSession {
  id: string;
  role: 'admin' | 'editor' | 'viewer';
  role_id: string;
  username: string;
  email: string;
  full_name: string;
  department: string;
  permissions: string[];
}

interface AuthContextType {
  user: UserSession | null;
  role: 'admin' | 'editor' | 'viewer';
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  switchRole: (newRole: 'admin' | 'editor' | 'viewer') => Promise<void>;
  hasPermission: (permission: string) => boolean;
  canEdit: boolean;
  isAdmin: boolean;
}

const defaultAdmin: UserSession = {
  id: 'usr-1',
  role: 'admin',
  role_id: 'role-admin',
  username: 'admin',
  email: 'admin@stitchpim.internal',
  full_name: 'Alexandra Rivera',
  department: 'Head of E-Commerce',
  permissions: [
    'products.create', 'products.read', 'products.update', 'products.delete',
    'categories.manage', 'attributes.manage', 'variants.manage',
    'woocommerce.sync', 'woocommerce.settings', 'users.manage',
    'reports.view', 'excel.import', 'excel.export'
  ]
};

const AuthContext = createContext<AuthContextType>({
  user: defaultAdmin,
  role: 'admin',
  isLoading: false,
  login: async () => {},
  logout: () => {},
  switchRole: async () => {},
  hasPermission: () => true,
  canEdit: true,
  isAdmin: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(defaultAdmin);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Check local storage or fetch /me
    const storedUserId = localStorage.getItem('stitch_user_id');
    if (storedUserId) {
      authApi.getMe()
        .then(res => {
          if (res.data?.user) {
            setUser(res.data.user);
          }
        })
        .catch(() => {
          // Fallback to default admin
          setUser(defaultAdmin);
        });
    }
  }, []);

  const login = async (username: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ username, password });
      setUser(res.data.user);
      localStorage.setItem('stitch_token', res.data.token);
      localStorage.setItem('stitch_user_id', res.data.user.id);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('stitch_token');
    localStorage.removeItem('stitch_user_id');
    // For demo purposes, reset to default viewer so user can sign back in or test
    setUser(null);
  };

  const switchRole = async (newRole: 'admin' | 'editor' | 'viewer') => {
    setIsLoading(true);
    try {
      const res = await authApi.switchRole(newRole);
      setUser(res.data.user);
      localStorage.setItem('stitch_token', res.data.token);
      localStorage.setItem('stitch_user_id', res.data.user.id);
    } catch (err) {
      console.error('Failed to switch role', err);
    } finally {
      setIsLoading(false);
    }
  };

  const role = user?.role || 'viewer';
  const isAdmin = role === 'admin';
  const canEdit = role === 'admin' || role === 'editor';

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        login,
        logout,
        switchRole,
        hasPermission,
        canEdit,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
