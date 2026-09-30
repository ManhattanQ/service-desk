const STORAGE_KEY = 'sd_users';

const SEED_USERS = [
  { id: 'u1', firstName: 'Иван', lastName: 'Соколов', email: 'ivan.sokolov@company.local', password: 'password123', department: 'accounting', role: 'employee' },
  { id: 'u2', firstName: 'Мария', lastName: 'Орлова', email: 'maria.orlova@company.local', password: 'password123', department: 'sales', role: 'employee' },
  { id: 'u3', firstName: 'Дмитрий', lastName: 'Волков', email: 'dmitry.volkov@company.local', password: 'password123', department: 'production', role: 'employee' },
  { id: 'u4', firstName: 'Елена', lastName: 'Титова', email: 'elena.titova@company.local', password: 'password123', department: 'administration', role: 'employee' },
  { id: 's1', firstName: 'Алексей', lastName: 'Ковалёв', email: 'alexey.kovalev@company.local', password: 'password123', department: 'it', role: 'specialist' },
  { id: 's2', firstName: 'Ольга', lastName: 'Смирнова', email: 'olga.smirnova@company.local', password: 'password123', department: 'it', role: 'specialist' },
];

export function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupted storage, fall back to seed
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_USERS));
  return SEED_USERS;
}

export function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}
