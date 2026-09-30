import './auth.css';

const STEPS = ['', 'Выберите должность', 'Настройте свой профиль'];

export default function AuthLayout({ firstStepLabel, children }) {
  const steps = [firstStepLabel, ...STEPS.slice(1)];

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-hero">
          <div className="auth-hero-glow" />
          <div className="auth-hero-content">
            <p className="auth-hero-brand">Solution Center</p>
            <h1>Начни с нами</h1>
            <p className="auth-hero-subtitle">
              Выполните эти простые шаги, чтобы зарегистрировать свою учётную запись.
            </p>
            <ol className="auth-steps">
              {steps.map((label, i) => (
                <li key={label} className={i === 0 ? 'active' : ''}>
                  <span className="auth-step-num">{i + 1}</span>
                  {label}
                </li>
              ))}
            </ol>
          </div>
        </aside>
        <main className="auth-panel">{children}</main>
      </div>
    </div>
  );
}
