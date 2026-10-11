export const STATUS_FILTERS = [
  { label: 'Усі', value: '' },
  { label: 'У планах', value: 'onPlan' },
  { label: 'В процесі', value: 'inProgress' },
  { label: 'Прочитано', value: 'read' },
];

export const STATUS_LABELS = {
  read: 'Прочитано',
  inProgress: 'В процесі',
  onPlan: 'У планах',
};

export const COVER_COLORS = [
  '#E07B54','#5B8DB8','#7B6FA0','#4DA88F',
  '#C96B6B','#D4A843','#6B9E6B','#A0706B',
];

export const EMPTY_FORM = {
  title: '', author_name: '', genre: '', status: 'onPlan', rating: null, note: '',
};

export function getGenreColor(genre) {
  if (!genre) return COVER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < genre.length; i++) {
    hash = genre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];
}
