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
