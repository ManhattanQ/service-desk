import { priorityInfo } from '../data/constants';

const DONE_STATUSES = ['closed'];
const PAUSED_STATUSES = ['on_hold'];

export function computeDeadline(createdAt, priority) {
  const hours = priorityInfo(priority)?.slaHours ?? 24;
  return new Date(new Date(createdAt).getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function getSlaState(ticket) {
  if (DONE_STATUSES.includes(ticket.status)) return 'done';
  if (PAUSED_STATUSES.includes(ticket.status)) return 'paused';
  const remainingMs = new Date(ticket.slaDeadline).getTime() - Date.now();
  if (remainingMs <= 0) return 'overdue';
  const totalMs = new Date(ticket.slaDeadline).getTime() - new Date(ticket.createdAt).getTime();
  if (remainingMs / totalMs <= 0.2) return 'warning';
  return 'ok';
}

export function formatTimeLeft(ticket) {
  if (DONE_STATUSES.includes(ticket.status) || PAUSED_STATUSES.includes(ticket.status)) return '-';
  const remainingMs = new Date(ticket.slaDeadline).getTime() - Date.now();
  if (remainingMs <= 0) return 'Просрочено';
  const totalMinutes = Math.floor(remainingMs / 60000);
  if (totalMinutes < 1) return '< 1 мин';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}д ${remHours}ч`;
  }
  return `${String(hours).padStart(2, '0')}ч ${String(minutes).padStart(2, '0')}м`;
}
