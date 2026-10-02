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

const STATUS_SEGMENTS = [
  { key: 'new', label: 'Новая', color: '#4338ca' },
  { key: 'in_progress', label: 'В работе', color: '#1d4ed8' },
  { key: 'on_hold', label: 'Ожидает ответа', color: '#b45309' },
  { key: 'closed', label: 'Выполнена', color: '#1a7f37' },
];

function buildSegments(data, circumference) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const segments = data.map((d) => {
    const frac = total > 0 ? d.value / total : 0;
    const dash = frac * circumference;
    const seg = { ...d, dash, offset: acc };
    acc += dash;
    return seg;
  });
  return { segments, total };
}

function DonutChart({ data, centerLabel }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const { segments, total } = buildSegments(data, circumference);
  return (
    <svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label="Распределение заявок по статусам">
      <g transform="rotate(-90 90 90)">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#f0f0f0" strokeWidth="22" />
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <circle
                key={s.key}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="22"
                strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                strokeDashoffset={-s.offset}
              />
            ))}
      </g>
      <text x="90" y="90" textAnchor="middle" dominantBaseline="central" fontSize="30" fontWeight="700" fill="#111111">
        {centerLabel ?? total}
      </text>
    </svg>
  );
}

function SlaGauge({ healthy, breached }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const total = healthy + breached;
  const pct = total > 0 ? Math.round((healthy / total) * 100) : 100;
  const { segments } = buildSegments(
    [
      { key: 'healthy', color: '#41ce65', value: healthy },
      { key: 'breached', color: '#f53b57', value: breached },
    ],
    circumference,
  );
  return (
    <svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label="Доля заявок в рамках SLA">
      <g transform="rotate(-90 90 90)">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#f0f0f0" strokeWidth="22" />
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <circle
                key={s.key}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="22"
                strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                strokeDashoffset={-s.offset}
              />
            ))}
      </g>
      <text x="90" y="90" textAnchor="middle" dominantBaseline="central" fontSize="30" fontWeight="700" fill="#111111">
        {pct}%
      </text>
    </svg>
  );
}

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

  const statusData = useMemo(
    () =>
      STATUS_SEGMENTS.map((s) => ({
        ...s,
        value: tickets.filter((t) => t.status === s.key).length,
      })),
    [tickets],
  );

  const slaCounts = useMemo(() => {
    const open = tickets.filter((t) => t.status !== 'closed');
    const breached = open.filter((t) => getSlaState(t) === 'overdue').length;
    return { healthy: open.length - breached, breached };
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

      <div className="dashboard-charts">
        <div className="dashboard-card">
          <h2 className="dashboard-subtitle">Заявки по статусам</h2>
          <div className="dashboard-chart-row">
            <DonutChart data={statusData} />
            <div className="dashboard-legend">
              {statusData.map((s) => (
                <div key={s.key} className="dashboard-legend-row">
                  <span className="legend-dot" style={{ background: s.color }} />
                  <span className="legend-label">{s.label}</span>
                  <span className="legend-value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h2 className="dashboard-subtitle">SLA сейчас</h2>
          <div className="dashboard-chart-row">
            <SlaGauge healthy={slaCounts.healthy} breached={slaCounts.breached} />
            <div className="dashboard-legend">
              <div className="dashboard-legend-row">
                <span className="legend-dot" style={{ background: '#41ce65' }} />
                <span className="legend-label">В рамках SLA</span>
                <span className="legend-value">{slaCounts.healthy}</span>
              </div>
              <div className="dashboard-legend-row">
                <span className="legend-dot" style={{ background: '#f53b57' }} />
                <span className="legend-label">Просрочено</span>
                <span className="legend-value">{slaCounts.breached}</span>
              </div>
              <p className="dashboard-chart-note">Доля открытых заявок, уложившихся в SLA прямо сейчас</p>
            </div>
          </div>
        </div>
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
