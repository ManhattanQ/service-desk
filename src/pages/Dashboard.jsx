import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import { getSlaState } from '../utils/sla';
import './dashboard.css';

function isToday(iso) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

const TILES = [
  { key: 'new', label: 'Новые заявки', color: '#4338ca', bg: '#eef2ff' },
  { key: 'in_progress', label: 'В работе', color: '#1d4ed8', bg: '#e0edff' },
  { key: 'on_hold', label: 'Ожидают пользователя', color: '#b45309', bg: '#fff4e0' },
  { key: 'overdue', label: 'Просроченные', color: '#f53b57', bg: '#ffe4e8' },
  { key: 'closed_today', label: 'Закрыты сегодня', color: '#1a7f37', bg: '#e9f9ee' },
];

export default function Dashboard() {
  const { users } = useAuth();
  const { tickets } = useTickets();

  const stats = useMemo(() => {
    const newCount = tickets.filter((t) => t.status === 'new').length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
    const onHold = tickets.filter((t) => t.status === 'on_hold').length;
    const overdue = tickets.filter((t) => getSlaState(t) === 'overdue').length;
    const closedToday = tickets.filter(
      (t) => t.status === 'closed' && t.closedAt && isToday(t.closedAt),
    ).length;
    return { new: newCount, in_progress: inProgress, on_hold: onHold, overdue, closed_today: closedToday };
  }, [tickets]);

  const workload = useMemo(() => {
    const specialists = users.filter((u) => u.role === 'specialist');
    const counts = specialists.map((s) => ({
      user: s,
      count: tickets.filter((t) => t.assigneeId === s.id && t.status !== 'closed').length,
    }));
    const max = Math.max(1, ...counts.map((c) => c.count));
    return { counts, max };
  }, [users, tickets]);

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="dashboard-tiles">
        {TILES.map((t) => (
          <div key={t.key} className="dashboard-tile" style={{ background: t.bg }}>
            <p className="dashboard-tile-value" style={{ color: t.color }}>
              {stats[t.key]}
            </p>
            <p className="dashboard-tile-label">{t.label}</p>
          </div>
        ))}
      </div>

      <h2 className="dashboard-subtitle">Загрузка специалистов поддержки</h2>
      <div className="dashboard-workload">
        {workload.counts.map(({ user, count }) => (
          <div key={user.id} className="workload-row">
            <span className="workload-name">
              {user.firstName} {user.lastName}
            </span>
            <div className="workload-bar-track">
              <div
                className="workload-bar-fill"
                style={{ width: `${(count / workload.max) * 100}%` }}
              />
            </div>
            <span className="workload-count">{count}</span>
          </div>
        ))}
        {workload.counts.length === 0 && (
          <p className="workload-empty">Нет специалистов поддержки</p>
        )}
      </div>
    </div>
  );
}
