import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/validation';
import { DEMO_ACCOUNTS } from '../data/mockUsers';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Заполните email и пароль');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Введите корректный email');
      return;
    }
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate('/', { replace: true });
  }

  function fillDemoAccount(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <p className="auth-form-eyebrow">Solution Center</p>
        <h2>Войти</h2>
        <p className="auth-form-lead">Введите свои персональные данные для входа в систему.</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label htmlFor="email">Логин</label>
          <input
            id="email"
            type="email"
            placeholder="ivan.sokolov@company.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            placeholder="Введите свой пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="auth-submit">
          Войти
        </button>

        <p className="auth-switch">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>

        <div className="auth-demo">
          <p className="auth-demo-title">Демо-доступы</p>
          {DEMO_ACCOUNTS.map((acc) => (
            <div className="auth-demo-card" key={acc.email}>
              <div className="auth-demo-card-info">
                <p className="auth-demo-name">
                  {acc.roleLabel} · {acc.name}
                </p>
                <p className="auth-demo-creds">
                  {acc.email} · {acc.password}
                </p>
              </div>
              <button type="button" className="auth-demo-insert" onClick={() => fillDemoAccount(acc)}>
                Вставить
              </button>
            </div>
          ))}
        </div>
      </form>
    </AuthLayout>
  );
}
