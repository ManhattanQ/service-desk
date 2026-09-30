import './auth.css';

const STEPS = ['Зарегистрируйте свой аккаунт', 'Выберите должность', 'Настройте свой профиль'];

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-hero-wrap">
        <aside className="auth-hero">
          <div className="auth-hero-glow" />
          <div className="auth-hero-content">
            <p className="auth-hero-brand">Solution Center</p>
            <h1>Начни с нами</h1>
            <p className="auth-hero-subtitle">
              Выполните эти простые шаги, чтобы зарегистрировать свою учётную запись.
            </p>
            <ol className="auth-steps">
              {STEPS.map((label, i) => (
                <li key={label} className={i === 0 ? 'active' : ''}>
                  <span className="auth-step-num">{i + 1}</span>
                  {label}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
      <main className="auth-panel">{children}</main>
    </div>
  );
}
