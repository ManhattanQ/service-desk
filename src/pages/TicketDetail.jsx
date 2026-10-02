import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  departmentLabel,
  priorityInfo,
  statusLabel,
} from '../data/constants';
import { formatTimeLeft, getSlaState, computeDeadline } from '../utils/sla';
import './ticketDetail.css';

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(-2)}`;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${formatDate(iso)} | ${pad(hours)}:${pad(d.getMinutes())} ${ampm}`;
}

function initials(name) {
  return name.trim().slice(0, 2);
}

function Panel({ title, open, onToggle, children }) {
  return (
    <div className="td-panel">
      <button type="button" className="td-panel-header" onClick={onToggle}>
        <span>{title}</span>
        {open ? <ChevronUp size={18} strokeWidth={2} /> : <ChevronDown size={18} strokeWidth={2} />}
      </button>
      {open && <div className="td-panel-body">{children}</div>}
    </div>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, users } = useAuth();
  const { tickets, updateTicket } = useTickets();

  const ticket = tickets.find((t) => t.id === id);

  const [authorOpen, setAuthorOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [replyMode, setReplyMode] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const assignRef = useRef(null);

  useEffect(() => {
    if (!assignOpen) return;
    function handleClick(e) {
      if (assignRef.current && !assignRef.current.contains(e.target)) setAssignOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [assignOpen]);

  const specialists = users.filter((u) => u.role === 'specialist');

  const statusTimeline = useMemo(() => {
    if (!ticket) return [];
    return ticket.history.filter((h) => h.type === 'created' || h.type === 'status_changed' || h.type === 'closed');
  }, [ticket]);

  const lastNoteToAuthor = useMemo(() => {
    if (!ticket) return null;
    return [...ticket.comments].reverse().find((c) => !c.internal) ?? null;
  }, [ticket]);

  if (!ticket) {
    return (
      <div className="td-page">
        <p>Заявка не найдена.</p>
        <button type="button" className="td-back" onClick={() => navigate('/queue')}>
          Вернуться назад
        </button>
      </div>
    );
  }

  const isClosed = ticket.status === 'closed';

  function pushHistory(message, type = 'note') {
    const entry = { id: `h${Date.now()}`, type, message, createdAt: new Date().toISOString() };
    return [...ticket.history, entry];
  }

  function handlePriorityChange(e) {
    const priority = e.target.value;
    updateTicket(ticket.id, { priority, slaDeadline: computeDeadline(ticket.createdAt, priority) });
  }

  function handleStatusChange(e) {
    const nextStatus = e.target.value;
    if (nextStatus === ticket.status) return;
    const changes = {
      status: nextStatus,
      history: pushHistory(`статус изменён: ${statusLabel(ticket.status)} → ${statusLabel(nextStatus)}`, 'status_changed'),
    };
    if (nextStatus === 'closed') changes.closedAt = new Date().toISOString();
    updateTicket(ticket.id, changes);
  }

  function handleAssign(userId) {
    const user = users.find((u) => u.id === userId);
    const changes = {
      assigneeId: userId,
      status: ticket.status === 'new' ? 'in_progress' : ticket.status,
      history: pushHistory(`${user.firstName} ${user.lastName} назначен(а) исполнителем`, 'assigned'),
    };
    updateTicket(ticket.id, changes);
    setAssignOpen(false);
  }

  function handleClose() {
    updateTicket(ticket.id, {
      status: 'closed',
      closedAt: new Date().toISOString(),
      history: pushHistory(`статус изменён: ${statusLabel(ticket.status)} → ${statusLabel('closed')}`, 'closed'),
    });
  }

  function submitReply() {
    const body = replyText.trim();
    if (!body) return;
    const authorName = `${currentUser.firstName} ${currentUser.lastName[0]}.`;
    const comment = {
      id: `c${Date.now()}`,
      author: authorName,
      body,
      internal: replyMode === 'note',
      createdAt: new Date().toISOString(),
    };
    const historyMessage =
      replyMode === 'note' ? `${authorName} добавил(а) примечание: «${body}»` : `${authorName}: «${body}»`;
    updateTicket(ticket.id, {
      comments: [...ticket.comments, comment],
      history: pushHistory(historyMessage, replyMode === 'note' ? 'note' : 'comment'),
    });
    setReplyText('');
    setReplyMode(null);
  }

  return (
    <div className="td-page">
      <button type="button" className="td-back" onClick={() => navigate('/queue')}>
        Вернуться назад
      </button>
      <div className="td-back-divider" />

      <div className="td-layout">
        <div className="td-main">
          <span className="td-title-pill">{ticket.title}</span>

          <div className="td-meta-row">
            <span>
              <span className="td-meta-label">Заявка </span>
              {ticket.number}
            </span>
            <span>
              <span className="td-meta-label">Создано </span>
              {formatDate(ticket.createdAt)}
            </span>
            <span>
              <span className="td-meta-label">Отдел </span>
              {departmentLabel(ticket.department)}
            </span>
            <span className="td-meta-field">
              <span className="td-meta-label">Приоритет</span>
              <select className="td-meta-select" value={ticket.priority} disabled={isClosed} onChange={handlePriorityChange}>
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </span>
            <span className="td-meta-field">
              <span className="td-meta-label">Статус</span>
              <select className="td-meta-select" value={ticket.status} onChange={handleStatusChange}>
                {TICKET_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </span>
            <span className="td-meta-field">
              <span className="td-meta-label">Исполнитель</span>
              <select
                className="td-meta-select"
                value={ticket.assigneeId ?? ''}
                onChange={(e) => handleAssign(e.target.value)}
              >
                <option value="" disabled>
                  Не назначен
                </option>
                {specialists.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </span>
          </div>
          <div className="td-divider" />

          <div className="td-message">
            <span className="td-avatar td-avatar-author">{initials(ticket.author)}</span>
            <div className="td-message-body">
              <p className="td-message-author">{ticket.author}</p>
              <p className="td-message-text">{ticket.description}</p>
            </div>
          </div>

          {ticket.comments.length > 0 && (
            <div className="td-thread">
              {ticket.comments.map((c) => (
                <div className="td-message" key={c.id}>
                  <span className={`td-avatar ${c.internal ? 'td-avatar-note' : 'td-avatar-specialist'}`}>
                    {initials(c.author)}
                  </span>
                  <div className="td-message-body">
                    <p className="td-message-author">
                      {c.author}
                      {c.internal && <span className="td-note-tag">примечание</span>}
                    </p>
                    <p className="td-message-text">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="td-actions-row">
            <span className="td-avatar td-avatar-specialist">
              {currentUser.firstName[0]}
              {currentUser.lastName[0]}
            </span>
            {!isClosed && (
              <>
                <button
                  type="button"
                  className={`td-btn td-btn-primary${replyMode === 'reply' ? ' active' : ''}`}
                  onClick={() => setReplyMode(replyMode === 'reply' ? null : 'reply')}
                >
                  Ответить
                </button>
                <button type="button" className="td-btn td-btn-outline" onClick={handleClose}>
                  Выполнить
                </button>
                <button
                  type="button"
                  className={`td-btn td-btn-outline${replyMode === 'note' ? ' active' : ''}`}
                  onClick={() => setReplyMode(replyMode === 'note' ? null : 'note')}
                >
                  Добавить примечание
                </button>
              </>
            )}
            {isClosed && <span className="td-closed-label">Заявка завершена</span>}
          </div>

          {replyMode && (
            <div className="td-reply-box">
              <textarea
                className="td-reply-textarea"
                placeholder={replyMode === 'note' ? 'Внутреннее примечание (не видно автору)...' : 'Ваш ответ автору заявки...'}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
              />
              <div className="td-reply-actions">
                <button type="button" className="td-btn td-btn-outline" onClick={() => { setReplyMode(null); setReplyText(''); }}>
                  Отмена
                </button>
                <button type="button" className="td-btn td-btn-primary" onClick={submitReply} disabled={!replyText.trim()}>
                  Отправить
                </button>
              </div>
            </div>
          )}

          <p className="td-deadline-label">Срок выполнения</p>
          <span className="td-deadline-pill">
            {isClosed ? 'Завершено' : `Не более ${priorityInfo(ticket.priority)?.slaHours} часов`}
          </span>
        </div>

        <div className="td-side">
          <Panel title="Информация об авторе" open={authorOpen} onToggle={() => setAuthorOpen((v) => !v)}>
            <div className="td-author-row">
              <span className="td-avatar td-avatar-author">{initials(ticket.author)}</span>
              <p className="td-author-name">{ticket.author}</p>
            </div>
            <div className="td-divider-light" />
            <p className="td-author-contact">{ticket.authorEmail}</p>
            <p className="td-author-contact">{ticket.authorPhone}</p>
          </Panel>

          <Panel title="История заявки" open={historyOpen} onToggle={() => setHistoryOpen((v) => !v)}>
            <ul className="td-history-list">
              {ticket.history.map((h) => (
                <li key={h.id}>
                  <span className="td-history-time">{formatDate(h.createdAt)}</span> — {h.message}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Информация о заявки" open={infoOpen} onToggle={() => setInfoOpen((v) => !v)}>
            <div className="td-info-actions">
              <button type="button" className="td-btn td-btn-outline td-btn-sm">
                Редактировать
              </button>
              <div className="td-assign-wrap" ref={assignRef}>
                <button type="button" className="td-btn td-btn-soft td-btn-sm" onClick={() => setAssignOpen((v) => !v)}>
                  Назначить
                </button>
                {assignOpen && (
                  <div className="td-assign-menu">
                    {specialists.map((s) => (
                      <button key={s.id} type="button" className="td-assign-option" onClick={() => handleAssign(s.id)}>
                        {s.firstName} {s.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!isClosed && (
                <button type="button" className="td-btn td-btn-outline td-btn-sm" onClick={handleClose}>
                  Закрыть
                </button>
              )}
            </div>

            <div className="td-info-card">
              <div className="td-info-card-header">
                <span>{ticket.number}</span>
                <span>{ticket.title}</span>
              </div>
              <div className="td-info-card-body">
                <div className="td-info-row">
                  <p className="td-info-label">Дата создания</p>
                  <p className="td-info-value">{formatDateTime(ticket.createdAt)}</p>
                </div>
                <div className="td-divider-light" />
                <div className="td-info-row td-info-row-rail">
                  <p className="td-info-label">Статус</p>
                  {statusTimeline.map((h) => (
                    <div key={h.id} className="td-status-step">
                      <p className="td-info-value">{h.type === 'created' ? 'Новая' : h.message.split('→ ').pop()}</p>
                      <p className="td-status-date">{formatDate(h.createdAt)}</p>
                    </div>
                  ))}
                </div>
                <div className="td-divider-light" />
                <div className="td-info-row">
                  <p className="td-info-label">Срок</p>
                  <p className={`td-info-value sla-${getSlaState(ticket)}`}>
                    {isClosed ? '—' : formatTimeLeft(ticket)}
                  </p>
                </div>
                <div className="td-divider-light" />
                <div className="td-info-row">
                  <p className="td-info-label">Вопросы к автору</p>
                  {lastNoteToAuthor ? (
                    <p className="td-info-value">
                      <strong>{lastNoteToAuthor.author}:</strong> {lastNoteToAuthor.body}
                    </p>
                  ) : (
                    <p className="td-info-empty">Пока нет вопросов к автору</p>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
