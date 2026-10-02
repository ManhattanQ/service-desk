import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  DEPARTMENTS,
  categoryLabel,
  departmentLabel,
  statusLabel,
} from '../data/constants';
import { getSlaState, formatTimeLeft, computeDeadline } from '../utils/sla';
import { Search, CheckCircle2, X, RotateCcw } from 'lucide-react';
import './queue.css';

const TABS = [
  { value: 'all', label: 'Все заявки' },
  { value: 'mine', label: 'Мои заявки' },
  { value: 'new', label: 'Новые заявки' },
  { value: 'urgent', label: 'Заявки высокого приоритета' },
  { value: 'closed', label: 'Выполненные' },
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

const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_RANK = { new: 0, in_progress: 1, on_hold: 2, closed: 3 };

const SORT_COLUMNS = [
  { field: 'number', label: 'Номер #' },
  { field: 'author', label: 'Автор' },
  { field: 'title', label: 'Название' },
  { field: 'category', label: 'Категория' },
  { field: 'createdAt', label: 'Дата создания' },
  { field: 'department', label: 'Отдел' },
  { field: 'assignee', label: 'Исполнитель' },
  { field: 'status', label: 'Статус' },
  { field: 'priority', label: 'Приоритет' },
  { field: 'sla', label: 'Время до конца' },
];

function sortValue(t, field, users) {
  switch (field) {
    case 'number':
      return t.number;
    case 'author':
      return t.author;
    case 'title':
      return t.title;
    case 'category':
      return categoryLabel(t.category);
    case 'createdAt':
      return new Date(t.createdAt).getTime();
    case 'department':
      return departmentLabel(t.department);
    case 'assignee':
      return assigneeName(users, t.assigneeId);
    case 'status':
      return STATUS_RANK[t.status] ?? 99;
    case 'priority':
      return PRIORITY_RANK[t.priority] ?? 99;
    case 'sla':
      return t.status === 'closed' || t.status === 'on_hold' ? Infinity : new Date(t.slaDeadline).getTime();
    default:
      return '';
  }
}

export default function Queue() {
  const { currentUser, users } = useAuth();
  const { tickets, updateTicket } = useTickets();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const [sort, setSort] = useState({ field: null, dir: 'asc' });
  const [filters, setFilters] = useState({ category: 'all', status: 'all', priority: 'all', department: 'all' });

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function selectTab(value) {
    setTab(value);
    setFilters((f) => {
      const next = { ...f };
      if (value === 'new') next.status = 'new';
      else if (value === 'closed') next.status = 'closed';
      else if (f.status === 'new' || f.status === 'closed') next.status = 'all';
      if (value === 'urgent') next.priority = 'all';
      return next;
    });
  }

  function resetFilters() {
    setFilters({ category: 'all', status: 'all', priority: 'all', department: 'all' });
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== 'all');

  function setToast(message) {
    const id = ++toastIdRef.current;
    setToasts((list) => [...list, { id, message, leaving: false }]);
    setTimeout(() => dismissToast(id), 4000);
  }

  function dismissToast(id) {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 250);
  }

  const filtered = useMemo(() => {
    let list = tickets;
    if (tab === 'closed') {
      list = list.filter((t) => t.status === 'closed');
    } else {
      list = list.filter((t) => t.status !== 'closed');
      if (tab === 'mine') list = list.filter((t) => t.assigneeId === currentUser.id);
      if (tab === 'new') list = list.filter((t) => t.status === 'new');
      if (tab === 'urgent') list = list.filter((t) => t.priority === 'critical' || t.priority === 'high');
    }
    if (filters.category !== 'all') list = list.filter((t) => t.category === filters.category);
    if (filters.status !== 'all') list = list.filter((t) => t.status === filters.status);
    if (filters.priority !== 'all') list = list.filter((t) => t.priority === filters.priority);
    if (filters.department !== 'all') list = list.filter((t) => t.department === filters.department);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.number.toLowerCase().includes(q) ||
          t.author.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          categoryLabel(t.category).toLowerCase().includes(q) ||
          departmentLabel(t.department).toLowerCase().includes(q) ||
          assigneeName(users, t.assigneeId).toLowerCase().includes(q),
      );
    }
    if (sort.field) {
      list = [...list].sort((a, b) => {
        const va = sortValue(a, sort.field, users);
        const vb = sortValue(b, sort.field, users);
        const cmp = typeof va === 'string' ? va.localeCompare(vb, 'ru') : va - vb;
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [tickets, tab, search, currentUser.id, sort, users, filters]);

  function handleSort(field) {
    setSort((s) => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }));
  }

  useEffect(() => {
    setSelected([]);
  }, [tab, search, filters]);

  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  function toggleRow(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const selectableIds = useMemo(
    () => filtered.filter((t) => t.status !== 'closed').map((t) => t.id),
    [filtered],
  );

  const selectedTickets = useMemo(
    () => tickets.filter((t) => selected.includes(t.id)),
    [selected, tickets],
  );

  const canAssign =
    selectedTickets.length > 0 && selectedTickets.every((t) => t.status === 'new' || t.status === 'on_hold');
  const canResume = selectedTickets.length > 0 && selectedTickets.every((t) => t.status === 'on_hold');
  const canClose = selectedTickets.length > 0 && selectedTickets.every((t) => t.status !== 'closed');

  function toggleAll() {
    setSelected((s) => (s.length > 0 && s.length === selectableIds.length ? [] : selectableIds));
  }

  function handleAssign() {
    selected.forEach((id) => updateTicket(id, { assigneeId: currentUser.id, status: 'in_progress' }));
    setToast(`Взято в работу: ${selected.length} заявок.`);
    setSelected([]);
  }

  function handleClose() {
    const count = selected.length;
    selected.forEach((id) => updateTicket(id, { status: 'closed', closedAt: new Date().toISOString() }));
    setToast(`Завершено заявок: ${count}.`);
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
      {toasts.length > 0 && (
        <div className="snackbar-stack">
          {toasts.map((t) => (
            <div key={t.id} className={`snackbar${t.leaving ? ' leaving' : ''}`}>
              <CheckCircle2 size={20} strokeWidth={1.8} className="snackbar-icon" />
              <div>
                <p className="snackbar-title">Solution Center</p>
                <p className="snackbar-body">{t.message}</p>
              </div>
              <button type="button" className="snackbar-close" onClick={() => dismissToast(t.id)}>
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="queue-searchbar">
        <Search size={18} strokeWidth={1.8} />
        <input
          placeholder="Поиск по номеру, автору, теме, категории, отделу, исполнителю..."
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
              onClick={() => selectTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="queue-toolbar-actions">
          <span className="queue-filter-label">Фильтр</span>
          <select
            className="queue-filter-select"
            value={filters.category}
            onChange={(e) => setFilter('category', e.target.value)}
          >
            <option value="all">Все категории</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            className="queue-filter-select"
            value={filters.status}
            disabled={tab === 'new' || tab === 'closed'}
            onChange={(e) => setFilter('status', e.target.value)}
          >
            <option value="all">Все статусы</option>
            {TICKET_STATUSES.filter((s) => tab === 'closed' || s.value !== 'closed').map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="queue-filter-select"
            value={filters.priority}
            disabled={tab === 'urgent'}
            onChange={(e) => setFilter('priority', e.target.value)}
          >
            <option value="all">Все приоритеты</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            className="queue-filter-select"
            value={filters.department}
            onChange={(e) => setFilter('department', e.target.value)}
          >
            <option value="all">Все отделы</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              className="queue-filter-reset"
              onClick={resetFilters}
              title="Сбросить фильтры"
            >
              <RotateCcw size={17} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div className="queue-table-card">
        <table className="queue-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selected.length > 0 && selected.length === selectableIds.length}
                  onChange={toggleAll}
                />
              </th>
              {SORT_COLUMNS.map((col) => (
                <th
                  key={col.field}
                  className="sortable-th"
                  onClick={() => handleSort(col.field)}
                >
                  {col.label}
                  <span className={`sort-arrow${sort.field === col.field ? ' active' : ''}`}>
                    {sort.field === col.field ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅'}
                  </span>
                </th>
              ))}
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
                      disabled={isDone}
                      onChange={(e) => {
                        const priority = e.target.value;
                        updateTicket(t.id, { priority, slaDeadline: computeDeadline(t.createdAt, priority) });
                      }}
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

      {(canAssign || canResume || canClose) && (
        <div className="queue-actions">
          {canAssign && (
            <button type="button" className="btn-primary" onClick={handleAssign}>
              Взять в работу
            </button>
          )}
          {canResume && (
            <button type="button" className="btn-pill btn-neutral" onClick={handleResume}>
              Возобновить
            </button>
          )}
          {canClose && (
            <button type="button" className="btn-pill btn-neutral" onClick={handleClose}>
              Завершить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
