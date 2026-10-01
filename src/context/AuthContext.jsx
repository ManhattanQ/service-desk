import { createContext, useCallback, useContext, useState } from 'react';
import { loadUsers, saveUsers } from '../data/mockUsers';
import { roleForDepartment } from '../data/constants';

const AuthContext = createContext(null);
const SESSION_KEY = 'sd_session_user_id';
// ВРЕМЕННО: автовход специалистом для удобства демонстрации, убрать перед финальной сдачей.
const DEV_AUTO_LOGIN_ID = 's1';

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => loadUsers());
  const [currentUserId, setCurrentUserId] = useState(
    () => localStorage.getItem(SESSION_KEY) ?? DEV_AUTO_LOGIN_ID,
  );

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  const login = useCallback(
    (email, password) => {
      const found = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
      );
      if (!found) return { ok: false, error: 'Неверный email или пароль' };
      setCurrentUserId(found.id);
      localStorage.setItem(SESSION_KEY, found.id);
      return { ok: true };
    },
    [users],
  );

  const register = useCallback(
    ({ firstName, lastName, email, password, department }) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        return { ok: false, error: 'Пользователь с таким email уже зарегистрирован' };
      }
      const newUser = {
        id: `u_${Date.now()}`,
        firstName,
        lastName,
        email: email.trim(),
        password,
        department,
        role: roleForDepartment(department),
      };
      const next = [...users, newUser];
      setUsers(next);
      saveUsers(next);
      setCurrentUserId(newUser.id);
      localStorage.setItem(SESSION_KEY, newUser.id);
      return { ok: true };
    },
    [users],
  );

  const logout = useCallback(() => {
    setCurrentUserId(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, users, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
