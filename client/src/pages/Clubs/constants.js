export const CLUB_TYPES = {
  open: 'Відкритий',
  closed: 'Закритий',
};

export const CLUB_ROLES = {
  owner: 'Власник',
  moderator: 'Модератор',
  member: 'Учасник',
};

export const CLUB_BOOK_STATUSES = {
  proposed: 'Запропоновано',
  planned: 'Заплановано для читання',
  inProgress: 'У процесі',
  done: 'Обговорено',
};

export const CLUB_BOOK_FILTERS = [
  { label: 'Усі', value: '' },
  { label: 'У процесі', value: 'inProgress' },
  { label: 'Заплановано', value: 'planned' },
  { label: 'Обговорено', value: 'done' },
];

export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// Ukrainian plural form: plural(3, ['відгук', 'відгуки', 'відгуків']) -> '3 відгуки'
export function plural(n, [one, few, many]) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return `${n} ${one}`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}
