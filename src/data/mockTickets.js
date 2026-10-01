import { computeDeadline } from '../utils/sla';

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

const RAW = [
  { number: '#01', author: 'Метти', title: 'ВПН', category: 'computers', department: 'accounting', status: 'open', priority: 'high', createdHoursAgo: 7.33 },
  { number: '#02', author: 'Эндрю', title: 'Принтер', category: 'printers', department: 'accounting', status: 'new', priority: 'high', createdHoursAgo: 7.5 },
  { number: '#03', author: 'Мария', title: 'Винда', category: 'network_vpn', department: 'accounting', status: 'new', priority: 'low', createdHoursAgo: 2 },
  { number: '#04', author: 'Марк', title: 'Платеж', category: 'accounts', department: 'accounting', status: 'new', priority: 'low', createdHoursAgo: 3 },
  { number: '#05', author: 'Ригина Рижская', title: 'Жку', category: 'other', department: 'sales', status: 'in_progress', priority: 'low', createdHoursAgo: 1 },
  { number: '#06', author: 'Тонни', title: 'Гпх', category: 'other', department: 'accounting', status: 'open', priority: 'high', createdHoursAgo: 7.83 },
  { number: '#07', author: 'Роберт', title: 'LXP', category: 'computers', department: 'sales', status: 'open', priority: 'low', createdHoursAgo: 5 },
  { number: '#08', author: 'Джулия', title: 'Рар файл', category: 'software', department: 'sales', status: 'open', priority: 'high', createdHoursAgo: 8.5 },
  { number: '#09', author: 'Давид К.', title: 'Зарплата', category: 'accounts', department: 'accounting', status: 'open', priority: 'critical', createdHoursAgo: 3 },
  { number: '#13', author: 'Якоб', title: 'Который день', category: 'access', department: 'sales', status: 'resolved', priority: 'low', createdHoursAgo: 10 },
  { number: '#10', author: 'Леонид', title: 'Не пришла', category: 'accounts', department: 'accounting', status: 'on_hold', priority: 'medium', createdHoursAgo: 5 },
];

export const SEED_TICKETS = RAW.map((t, i) => {
  const createdAt = hoursAgo(t.createdHoursAgo);
  return {
    id: `t${i + 1}`,
    number: t.number,
    author: t.author,
    title: t.title,
    category: t.category,
    department: t.department,
    status: t.status,
    priority: t.priority,
    createdAt,
    slaDeadline: computeDeadline(createdAt, t.priority),
    comments: [],
    history: [{ id: `h${i + 1}`, type: 'created', message: `${t.author} создал(а) заявку`, createdAt }],
  };
});
