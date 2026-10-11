const VALID_STATUSES = ['onPlan', 'inProgress', 'read'];

function validateBookInput({ title, status, rating }) {
  if (title !== undefined && !title.trim()) return "Назва обов'язкова";

  if (status && !VALID_STATUSES.includes(status)) return 'Неправильне значення статусу';

  if (rating !== undefined && rating !== null && rating !== '') {
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) return 'Рейтинг має бути між 1 і 5';
  }

  return null;
}

module.exports = { validateBookInput };
