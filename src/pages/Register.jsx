import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS } from '../data/constants';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: DEPARTMENTS[0].value,
  });
  const [error, setError] = useState('');

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('Заполните все поля');
      return;
    }
    if (form.password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return;
    }
    const result = register(form);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h2>Зарегистрироваться</h2>
        <p className="auth-form-lead">Введите свои персональные данные для создания учётной записи.</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-row">
          <div className="auth-field">
            <label htmlFor="firstName">Имя</label>
            <input id="firstName" value={form.firstName} onChange={update('firstName')} placeholder="Павел" />
          </div>
          <div className="auth-field">
            <label htmlFor="lastName">Фамилия</label>
            <input id="lastName" value={form.lastName} onChange={update('lastName')} placeholder="Гребенников" />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="ivan.sokolov@company.local"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="department">Отдел / должность</label>
          <select id="department" value={form.department} onChange={update('department')}>
            {DEPARTMENTS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="auth-field">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={update('password')}
            placeholder="Введите свой пароль"
          />
          <p className="auth-hint">Должен содержать не менее 8 символов.</p>
        </div>

        <button type="submit" className="auth-submit">
          Зарегистрироваться
        </button>

        <p className="auth-switch">
          У вас уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
