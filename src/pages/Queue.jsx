import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import {
  TICKET_PRIORITIES,
  categoryLabel,
  departmentLabel,
  statusLabel,
} from '../data/constants';
import { getSlaState, formatTimeLeft } from '../utils/sla';
import { SearchIcon, CalendarIcon, CheckCircleIcon, CloseIcon } from '../components/icons/NavIcons';
import './queue.css';

const TABS = [
  { value: 'all', label: 'Все заявки' },
  { value: 'mine', label: 'Мои заявки' },
  { value: 'new', label: 'Новые заявки' },
  { value: 'urgent', label: 'Заявки высокого приоритета' },
];

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(-2)} | ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function assigneeName(users, assigneeId) {
  const user = users.find((u) => u.id === assigneeId);
  return user ? `${user.firstName} ${user.lastName}` : '—';
}

export default function Queue() {
  const { currentUser, users } = useAuth();
  const { tickets, updateTicket } = useTickets();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [toast, setToast] = useState(null);

  const filtered = useMemo(() => {
    let list = tickets;
    if (tab === 'mine') list = list.filter((t) => t.assigneeId === currentUser.id);
    if (tab === 'new') list = list.filter((t) => t.status === 'new');
    if (tab === 'urgent') list = list.filter((t) => t.priority === 'critical' || t.priority === 'high');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.number.toLowerCase().includes(q) ||
          t.author.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q),
      );
    }
    return list;
  }, [tickets, tab, search, currentUser.id]);

  function toggleRow(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function toggleAll() {
    setSelected((s) => (s.length === filtered.length ? [] : filtered.map((t) => t.id)));
  }

  function handleAssign() {
    selected.forEach((id) => {
      const ticket = tickets.find((t) => t.id === id);
      const statusUpdate = ticket?.status === 'new' ? { status: 'in_progress' } : {};
      updateTicket(id, { assigneeId: currentUser.id, ...statusUpdate });
    });
    setToast(`Назначено на вас: ${selected.length} заявок.`);
    setSelected([]);
  }

  function handleClose() {
    const count = selected.length;
    selected.forEach((id) => updateTicket(id, { status: 'closed', closedAt: new Date().toISOString() }));
    setToast(`Успешно закрыто заявок: ${count}.`);
    setSelected([]);
  }

  function handleHold() {
    const count = selected.length;
    selected.forEach((id) => updateTicket(id, { status: 'on_hold' }));
    setToast(`Поставлено на удержание: ${count}.`);
    setSelected([]);
  }

  function handleResume() {
    const count = selected.length;
    selected.forEach((id) => updateTicket(id, { status: 'in_progress' }));
    setToast(`Возобновлено в работе: ${count}.`);
    setSelected([]);
  }

  return (
    <div className="queue-page">
      {toast && (
        <div className="snackbar">
          <CheckCircleIcon className="snackbar-icon" />
          <div>
            <p className="snackbar-title">Solution Center</p>
            <p className="snackbar-body">{toast}</p>
          </div>
          <button type="button" className="snackbar-close" onClick={() => setToast(null)}>
            <CloseIcon />
          </button>
        </div>
      )}

      <div className="queue-searchbar">
        <SearchIcon />
        <input
          placeholder="Поиск по номеру, автору, теме..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <h1 className="queue-title">Заявки</h1>

      <div className="queue-toolbar">
        <div className="queue-tabs">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`queue-tab${tab === t.value ? ' active' : ''}`}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="queue-toolbar-actions">
          <span className="queue-filter-label">Фильтр</span>
          <button type="button" className="queue-date-btn">
            <span>ДД.ММ.ГГГГ</span>
            <CalendarIcon />
          </button>
        </div>
      </div>

      <div className="queue-table-card">
        <table className="queue-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selected.length > 0 && selected.length === filtered.length}
                  onChange={toggleAll}
                />
              </th>
              <th>Номер #</th>
              <th>Автор</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Дата создания</th>
              <th>Отдел</th>
              <th>Исполнитель</th>
              <th>Статус</th>
              <th>Приоритет</th>
              <th>Время до конца</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const slaState = getSlaState(t);
              const isDone = t.status === 'closed';
              const isOnHold = t.status === 'on_hold';
              return (
                <tr
                  key={t.id}
                  className={`${selected.includes(t.id) ? 'row-selected' : ''} ${isDone ? 'row-muted' : ''}`}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(t.id)}
                      onChange={() => toggleRow(t.id)}
                    />
                  </td>
                  <td>{t.number}</td>
                  <td>{t.author}</td>
                  <td>{t.title}</td>
                  <td>{categoryLabel(t.category)}</td>
                  <td>{formatDate(t.createdAt)}</td>
                  <td>{departmentLabel(t.department)}</td>
                  <td>{assigneeName(users, t.assigneeId)}</td>
                  <td>
                    <span className={`status-badge status-${t.status}`}>{statusLabel(t.status)}</span>
                  </td>
                  <td>
                    <select
                      className="queue-select"
                      value={t.priority}
                      onChange={(e) => updateTicket(t.id, { priority: e.target.value })}
                    >
                      {TICKET_PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {isDone || isOnHold ? (
                      <span className="sla-dash">-</span>
                    ) : (
                      <span className={`sla-pill sla-${slaState}`}>{formatTimeLeft(t)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="queue-empty">
                  Заявок не найдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected.length > 0 && (
        <div className="queue-actions">
          <button type="button" className="btn-primary" onClick={handleAssign}>
            Назначить
          </button>
          <button type="button" className="btn-outline" onClick={handleHold}>
            НА УДЕРЖАНИЕ
          </button>
          <button type="button" className="btn-outline" onClick={handleResume}>
            ВОЗОБНОВИТЬ
          </button>
          <button type="button" className="btn-outline" onClick={handleClose}>
            ЗАКРЫТЬ
          </button>
        </div>
      )}
    </div>
  );
}
