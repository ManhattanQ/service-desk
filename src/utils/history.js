export function appendHistory(ticket, message, type = 'note') {
  const entry = {
    id: `h${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    message,
    createdAt: new Date().toISOString(),
  };
  return [...ticket.history, entry];
}
