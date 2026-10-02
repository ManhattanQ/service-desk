import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Paperclip, X, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import {
  TICKET_PRIORITIES,
  departmentLabel,
  priorityInfo,
  statusLabel,
} from '../data/constants';
import { formatTimeLeft, getSlaState, computeDeadline } from '../utils/sla';
import { appendHistory } from '../utils/history';
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
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0] ? parts[0].slice(0, 2).toUpperCase() : '';
}

function AttachmentList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="td-attachments">
      {items.map((a) => (
        <a key={a.id} className="td-attachment" href={a.url} target="_blank" rel="noreferrer">
          {a.type?.startsWith('image/') ? (
            <img src={a.url} alt={a.name} className="td-attachment-img" />
          ) : (
            <div className="td-attachment-file">
              <FileText size={28} strokeWidth={1.5} />
            </div>
          )}
          <span className="td-attachment-caption">{a.name}</span>
        </a>
      ))}
    </div>
  );
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
  const [pendingFiles, setPendingFiles] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const assignRef = useRef(null);
  const fileInputRef = useRef(null);

  function handleFileSelect(e) {
    const files = Array.from(e.target.files ?? []);
    const next = files.map((file) => ({
      id: `a${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => [...prev, ...next]);
    e.target.value = '';
  }

  function removePendingFile(id) {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function toggleReplyMode(mode) {
    setReplyMode((prev) => (prev === mode ? null : mode));
    setReplyText('');
    setPendingFiles([]);
  }

  useEffect(() => {
    if (!assignOpen) return;
    function handleClick(e) {
      if (assignRef.current && !assignRef.current.contains(e.target)) setAssignOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [assignOpen]);

  const specialists = users.filter((u) => u.role === 'specialist');
  const assignee = users.find((u) => u.id === ticket?.assigneeId);
  const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Не назначен';

  const statusTimeline = useMemo(() => {
    if (!ticket) return [];
    return ticket.history.filter((h) => h.type === 'created' || h.type === 'status_changed' || h.type === 'closed');
  }, [ticket]);

  const lastNoteToAuthor = useMemo(() => {
    if (!ticket) return null;
    return [...ticket.comments].reverse().find((c) => !c.internal && c.authorId !== ticket.authorId) ?? null;
  }, [ticket]);

  const visibleComments = useMemo(() => {
    if (!ticket) return [];
    const isTicketAuthor = currentUser.id === ticket.authorId;
    if (!isTicketAuthor) return ticket.comments;
    // Внутренние примечания скрыты от автора заявки, кроме тех, что он сам написал.
    return ticket.comments.filter((c) => !c.internal || c.authorId === currentUser.id);
  }, [ticket, currentUser.id]);

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
  const isEmployee = currentUser.role === 'employee';

  function pushHistory(message, type = 'note') {
    return appendHistory(ticket, message, type);
  }

  function handlePriorityChange(e) {
    const priority = e.target.value;
    updateTicket(ticket.id, {
      priority,
      slaDeadline: computeDeadline(ticket.createdAt, priority),
      history: pushHistory(
        `приоритет изменён: ${priorityInfo(ticket.priority)?.label} → ${priorityInfo(priority)?.label}`,
        'priority_changed',
      ),
    });
  }

  function handleAssign(userId) {
    const user = users.find((u) => u.id === userId);
    const nextStatus = ticket.status === 'new' ? 'in_progress' : ticket.status;
    let history = pushHistory(`${user.firstName} ${user.lastName} назначен(а) исполнителем`, 'assigned');
    if (nextStatus !== ticket.status) {
      history = appendHistory({ history }, `статус изменён: ${statusLabel(ticket.status)} → ${statusLabel(nextStatus)}`, 'status_changed');
    }
    updateTicket(ticket.id, { assigneeId: userId, status: nextStatus, history });
    setAssignOpen(false);
  }

  function handleClose() {
    let history = pushHistory(`статус изменён: ${statusLabel(ticket.status)} → ${statusLabel('closed')}`, 'closed');
    const changes = { status: 'closed', closedAt: new Date().toISOString() };
    if (!ticket.assigneeId && !isEmployee) {
      changes.assigneeId = currentUser.id;
      history = appendHistory({ history }, `${currentUser.firstName} ${currentUser.lastName} назначен(а) исполнителем`, 'assigned');
    }
    changes.history = history;
    updateTicket(ticket.id, changes);
  }

  function submitReply() {
    const body = replyText.trim();
    if (!body) return;
    const authorName = `${currentUser.firstName} ${currentUser.lastName[0]}.`;
    const isNote = replyMode === 'note';
    const comment = {
      id: `c${Date.now()}`,
      author: authorName,
      authorId: currentUser.id,
      body,
      internal: isNote,
      createdAt: new Date().toISOString(),
      attachments: pendingFiles,
    };
    const historyMessage = isNote ? `${authorName} добавил(а) примечание: «${body}»` : `${authorName}: «${body}»`;
    let history = pushHistory(historyMessage, isNote ? 'note' : 'comment');
    const changes = { comments: [...ticket.comments, comment] };
    if (!isNote && !isEmployee && ticket.status !== 'on_hold') {
      changes.status = 'on_hold';
      history = appendHistory({ history }, `статус изменён: ${statusLabel(ticket.status)} → ${statusLabel('on_hold')}`, 'status_changed');
    }
    changes.history = history;
    updateTicket(ticket.id, changes);
    setReplyText('');
    setReplyMode(null);
    setPendingFiles([]);
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
            {isEmployee ? (
              <span>
                <span className="td-meta-label">Приоритет </span>
                {priorityInfo(ticket.priority)?.label}
              </span>
            ) : (
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
            )}
            <span>
              <span className="td-meta-label">Статус </span>
              {statusLabel(ticket.status)}
            </span>
            <span>
              <span className="td-meta-label">Исполнитель </span>
              {assigneeName}
            </span>
          </div>
          <div className="td-divider" />

          <div className="td-message">
            <span className="td-avatar td-avatar-author">{initials(ticket.author)}</span>
            <div className="td-message-body">
              <p className="td-message-author">{ticket.author}</p>
              <p className="td-message-text">{ticket.description}</p>
              <AttachmentList items={ticket.attachments} />
            </div>
          </div>

          {visibleComments.length > 0 && (
            <div className="td-thread">
              {visibleComments.map((c) => (
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
                    <AttachmentList items={c.attachments} />
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
                  onClick={() => toggleReplyMode('reply')}
                >
                  Ответить
                </button>
                {!isEmployee && (
                  <div className="td-assign-wrap" ref={assignRef}>
                    <button type="button" className="td-btn td-btn-primary" onClick={() => setAssignOpen((v) => !v)}>
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
                )}
                {!isEmployee && (
                  <button type="button" className="td-btn td-btn-outline" onClick={handleClose}>
                    Выполнить
                  </button>
                )}
                <button
                  type="button"
                  className={`td-btn td-btn-outline${replyMode === 'note' ? ' active' : ''}`}
                  onClick={() => toggleReplyMode('note')}
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
              {pendingFiles.length > 0 && (
                <div className="td-pending-files">
                  {pendingFiles.map((f) => (
                    <span key={f.id} className="td-pending-file">
                      {f.name}
                      <button type="button" onClick={() => removePendingFile(f.id)} aria-label="Убрать файл">
                        <X size={13} strokeWidth={2} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="td-reply-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="td-file-input-hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  className="td-btn-attach"
                  onClick={() => fileInputRef.current?.click()}
                  title="Прикрепить файл"
                >
                  <Paperclip size={16} strokeWidth={1.8} />
                </button>
                <span className="td-reply-actions-spacer" />
                <button
                  type="button"
                  className="td-btn td-btn-outline"
                  onClick={() => {
                    setReplyMode(null);
                    setReplyText('');
                    setPendingFiles([]);
                  }}
                >
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
          {isEmployee ? (
            <Panel title="Информация об исполнителе" open={authorOpen} onToggle={() => setAuthorOpen((v) => !v)}>
              {assignee ? (
                <>
                  <div className="td-author-row">
                    <span className="td-avatar td-avatar-specialist">{initials(assigneeName)}</span>
                    <p className="td-author-name">{assigneeName}</p>
                  </div>
                  <div className="td-divider-light" />
                  <p className="td-author-contact">{assignee.email}</p>
                  <p className="td-author-contact">{assignee.phone}</p>
                </>
              ) : (
                <p className="td-info-empty">Специалист ещё не назначен</p>
              )}
            </Panel>
          ) : (
            <Panel title="Информация об авторе" open={authorOpen} onToggle={() => setAuthorOpen((v) => !v)}>
              <div className="td-author-row">
                <span className="td-avatar td-avatar-author">{initials(ticket.author)}</span>
                <p className="td-author-name">{ticket.author}</p>
              </div>
              <div className="td-divider-light" />
              <p className="td-author-contact">{ticket.authorEmail}</p>
              <p className="td-author-contact">{ticket.authorPhone}</p>
            </Panel>
          )}

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
            {isEmployee && (
              <div className="td-info-actions">
                <button type="button" className="td-btn td-btn-outline td-btn-sm">
                  Редактировать
                </button>
                {!isClosed && (
                  <button type="button" className="td-btn td-btn-outline td-btn-sm" onClick={handleClose}>
                    Закрыть
                  </button>
                )}
              </div>
            )}
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
                  {isClosed || ticket.status === 'on_hold' ? (
                    <p className="td-info-value">—</p>
                  ) : (
                    <p className={`td-info-value sla-${getSlaState(ticket)}`}>{formatTimeLeft(ticket)}</p>
                  )}
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
