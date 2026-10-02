import { createContext, useContext, useEffect, useState } from 'react';
import { SEED_TICKETS } from '../data/mockTickets';
import { computeDeadline } from '../utils/sla';

const STORAGE_KEY = 'sd_tickets';
// Bump whenever the ticket schema (status/priority values, required fields) changes,
// so browsers with an older cached shape fall back to the fresh seed instead of breaking.
const STORAGE_VERSION = 9;
const TicketsContext = createContext(null);

function loadTickets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === STORAGE_VERSION) return parsed.tickets;
    }
  } catch {
    // ignore corrupted storage, fall back to seed
  }
  return SEED_TICKETS;
}

export function TicketsProvider({ children }) {
  const [tickets, setTickets] = useState(loadTickets);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, tickets }));
  }, [tickets]);

  function updateTicket(id, changes) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  }

  function createTicket({ author, authorId, authorEmail, authorPhone, title, description, category, priority, department, attachments }) {
    const maxNumber = tickets.reduce((max, t) => {
      const n = parseInt(t.number.replace('#', ''), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
    const number = `#${String(maxNumber + 1).padStart(2, '0')}`;
    const createdAt = new Date().toISOString();
    const id = `t${Date.now()}`;
    const ticket = {
      id,
      number,
      author,
      authorId,
      authorEmail,
      authorPhone,
      title,
      description,
      category,
      department,
      status: 'new',
      priority,
      assigneeId: null,
      createdAt,
      closedAt: null,
      slaDeadline: computeDeadline(createdAt, priority),
      comments: [],
      attachments: attachments ?? [],
      history: [{ id: `${id}-h1`, type: 'created', message: `${author} создал(а) заявку`, createdAt }],
    };
    setTickets((prev) => [...prev, ticket]);
    return ticket;
  }

  return (
    <TicketsContext.Provider value={{ tickets, setTickets, updateTicket, createTicket }}>
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const ctx = useContext(TicketsContext);
  if (!ctx) throw new Error('useTickets must be used within TicketsProvider');
  return ctx;
}
