import { useAuth } from '../context/AuthContext';
import { departmentLabel } from '../data/constants';

export default function Home() {
  const { currentUser, logout } = useAuth();

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
      <h1 style={{ marginBottom: 8, lineHeight: 1.3 }}>Добро пожаловать, {currentUser.firstName}!</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        {currentUser.role === 'specialist'
          ? 'Специалист поддержки'
          : `Сотрудник · ${departmentLabel(currentUser.department)}`}
      </p>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Основные экраны (Dashboard, очередь заявок, Kanban) появятся здесь по мере готовности макетов.
      </p>
      <button className="auth-submit" style={{ width: 'auto', padding: '10px 24px' }} onClick={logout}>
        Выйти
      </button>
    </div>
  );
}
