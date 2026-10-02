import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Paperclip, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../data/constants';
import './newTicket.css';

function Field({ label, children }) {
  return (
    <div className="nt-field">
      <span className="nt-field-label">{label}</span>
      {children}
    </div>
  );
}

export default function NewTicket() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { createTicket } = useTickets();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);

  const isValid = title.trim() && category && description.trim();

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

  function handleCreate() {
    if (!isValid) return;
    const ticket = createTicket({
      author: `${currentUser.firstName} ${currentUser.lastName}`,
      authorId: currentUser.id,
      authorEmail: currentUser.email,
      authorPhone: currentUser.phone ?? '',
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      department: currentUser.department,
      attachments: pendingFiles,
    });
    navigate(`/queue/${ticket.id}`);
  }

  return (
    <div className="nt-page">
      <button type="button" className="nt-back" onClick={() => navigate('/queue')}>
        Вернуться назад
      </button>
      <div className="nt-back-divider" />

      <h1 className="nt-title">Новая заявка</h1>

      <div className="nt-form">
        <Field label="Название">
          <input
            className="nt-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Коротко опишите проблему"
          />
        </Field>

        <Field label="Категория">
          <div className="nt-select-wrap">
            <select className="nt-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="" disabled>
                Выберите категорию
              </option>
              {TICKET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown size={20} strokeWidth={1.8} className="nt-select-icon" />
          </div>
        </Field>

        <Field label="Приоритет">
          <div className="nt-select-wrap">
            <select className="nt-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <ChevronDown size={20} strokeWidth={1.8} className="nt-select-icon" />
          </div>
        </Field>

        <Field label="Описание">
          <textarea
            className="nt-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите проблему подробнее: что произошло, когда, что уже пробовали сделать..."
          />
        </Field>

        {pendingFiles.length > 0 && (
          <div className="nt-pending-files">
            {pendingFiles.map((f) => (
              <span key={f.id} className="nt-pending-file">
                {f.name}
                <button type="button" onClick={() => removePendingFile(f.id)} aria-label="Убрать файл">
                  <X size={13} strokeWidth={2} />
                </button>
              </span>
            ))}
          </div>
        )}

        <input ref={fileInputRef} type="file" multiple className="nt-file-input-hidden" onChange={handleFileSelect} />
        <button type="button" className="nt-btn nt-btn-outline nt-btn-attach" onClick={() => fileInputRef.current?.click()}>
          <Paperclip size={18} strokeWidth={1.8} />
          Прикрепить файл
        </button>

        <div className="nt-divider" />

        <div className="nt-actions">
          <button type="button" className="nt-btn nt-btn-outline" onClick={() => navigate('/queue')}>
            Отмена
          </button>
          <button type="button" className="nt-btn nt-btn-primary" onClick={handleCreate} disabled={!isValid}>
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}
