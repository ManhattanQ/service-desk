export const DEPARTMENTS = [
  { value: 'accounting', label: 'Бухгалтерия' },
  { value: 'sales', label: 'Продажи' },
  { value: 'administration', label: 'Администрация' },
  { value: 'production', label: 'Производство' },
  { value: 'it', label: 'IT-отдел' },
];

export const ROLES = {
  EMPLOYEE: 'employee',
  SPECIALIST: 'specialist',
};

export function roleForDepartment(departmentValue) {
  return departmentValue === 'it' ? ROLES.SPECIALIST : ROLES.EMPLOYEE;
}

export function departmentLabel(value) {
  return DEPARTMENTS.find((d) => d.value === value)?.label ?? value;
}

export const TICKET_CATEGORIES = [
  { value: 'access', label: 'Доступы' },
  { value: 'computers', label: 'Компьютеры' },
  { value: 'software', label: 'Программное обеспечение' },
  { value: 'network_vpn', label: 'Сеть / VPN' },
  { value: 'printers', label: 'Принтеры' },
  { value: 'accounts', label: 'Учётные записи' },
  { value: 'other', label: 'Другое' },
];

export const TICKET_PRIORITIES = [
  { value: 'critical', label: 'Критический', slaHours: 2 },
  { value: 'high', label: 'Высокий', slaHours: 8 },
  { value: 'medium', label: 'Средний', slaHours: 24 },
  { value: 'low', label: 'Низкий', slaHours: 72 },
];

export const TICKET_STATUSES = [
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'on_hold', label: 'Ожидает ответа' },
  { value: 'closed', label: 'Выполнена' },
];

export function categoryLabel(value) {
  return TICKET_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function priorityInfo(value) {
  return TICKET_PRIORITIES.find((p) => p.value === value);
}

export function statusLabel(value) {
  return TICKET_STATUSES.find((s) => s.value === value)?.label ?? value;
}
