const STORAGE_KEY = 'sd_users';
// Bump whenever SEED_USERS changes (roles, credentials, demo accounts),
// so browsers with an older cached user list pick up the fresh seed.
const STORAGE_VERSION = 2;

const SEED_USERS = [
  { id: 'u1', firstName: 'Иван', lastName: 'Соколов', email: 'ivan.sokolov@company.local', password: 'password123', department: 'accounting', role: 'employee' },
  { id: 'u2', firstName: 'Мария', lastName: 'Орлова', email: 'maria.orlova@company.local', password: 'password123', department: 'sales', role: 'employee' },
  { id: 'u3', firstName: 'Дмитрий', lastName: 'Волков', email: 'dmitry.volkov@company.local', password: 'password123', department: 'production', role: 'employee' },
  { id: 'u4', firstName: 'Елена', lastName: 'Титова', email: 'elena.titova@company.local', password: 'password123', department: 'administration', role: 'employee' },
  { id: 'u5', firstName: 'Ольга', lastName: 'Смирнова', email: 'olga.smirnova@company.local', password: 'olga12345', department: 'sales', role: 'employee' },
  { id: 's1', firstName: 'Алексей', lastName: 'Ковалёв', email: 'alexey.kovalev@company.local', password: 'alexey12345', department: 'it', role: 'specialist' },
];

export const DEMO_ACCOUNTS = [
  { role: 'employee', roleLabel: 'Сотрудник', name: 'Ольга Смирнова', email: 'olga.smirnova@company.local', password: 'olga12345' },
  { role: 'specialist', roleLabel: 'Специалист', name: 'Алексей Ковалёв', email: 'alexey.kovalev@company.local', password: 'alexey12345' },
];

export function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === STORAGE_VERSION) return parsed.users;
    }
  } catch {
    // ignore corrupted storage, fall back to seed
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, users: SEED_USERS }));
  return SEED_USERS;
}

export function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, users }));
}
