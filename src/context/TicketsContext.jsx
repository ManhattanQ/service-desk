import { createContext, useContext, useEffect, useState } from 'react';
import { SEED_TICKETS } from '../data/mockTickets';

const STORAGE_KEY = 'sd_tickets';
// Bump whenever the ticket schema (status/priority values, required fields) changes,
// so browsers with an older cached shape fall back to the fresh seed instead of breaking.
const STORAGE_VERSION = 7;
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

  return (
    <TicketsContext.Provider value={{ tickets, setTickets, updateTicket }}>
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const ctx = useContext(TicketsContext);
  if (!ctx) throw new Error('useTickets must be used within TicketsProvider');
  return ctx;
}
