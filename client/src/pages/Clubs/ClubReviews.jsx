import { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/StarRating/StarRating';
import { plural } from './constants';

export default function ClubReviews({ club, book, onChange }) {
  const { user } = useAuth();
  const [data, setData] = useState({ average_rating: null, reviews: [] });
  const [rating, setRating] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const canModerate = ['owner', 'moderator'].includes(club.my_role);
  const url = `/clubs/${club.id}/books/${book.id}/reviews`;

  const fetchReviews = useCallback(async () => {
    try {
      const res = await api.get(url);
      setData(res.data);
      const mine = res.data.reviews.find(r => r.user_id === user?.id);
      setRating(mine?.rating ?? null);
      setText(mine?.review ?? '');
    } catch {
      // ignore
    }
  }, [url, user?.id]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const mine = data.reviews.find(r => r.user_id === user?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating && !text.trim()) { setError('Поставте оцінку або напишіть рецензію.'); return; }
    setError('');
    setSaving(true);
    try {
      await api.post(url, { rating, review: text });
      await fetchReviews();
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Не вдалося зберегти рецензію.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (review) => {
    if (!window.confirm('Видалити рецензію?')) return;
    await api.delete(`${url}/${review.id}`);
    await fetchReviews();
    onChange?.();
  };

  return (
    <div className="club-reviews">
      <div className="club-reviews__summary">
        <span className="club-reviews__avg">{data.average_rating ?? '—'}</span>
        <div>
          <StarRating value={Math.round(data.average_rating || 0)} size="sm" />
          <span className="club-detail__muted">
            {data.reviews.length ? `${plural(data.reviews.length, ['відгук', 'відгуки', 'відгуків'])} учасників клубу` : 'Відгуків поки немає'}
          </span>
        </div>
      </div>

      <form className="club-form" onSubmit={handleSubmit}>
        {error && <div className="club-form__error">{error}</div>}
        <div className="form-group">
          <label>{mine ? 'Ваша оцінка' : 'Оцініть книгу'}</label>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>
        <div className="form-group">
          <label>Рецензія <span className="form-optional">необов'язково</span></label>
          <textarea rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="Що вас вразило? Що варто обговорити?" />
        </div>
        <div className="club-form__actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Зберігаємо…' : mine ? 'Оновити відгук' : 'Опублікувати'}
          </button>
        </div>
      </form>

      <ul className="club-reviews__list">
        {data.reviews.map(r => (
          <li key={r.id} className="club-review">
            <div className="club-review__head">
              <span className="member-list__avatar">{r.username[0].toUpperCase()}</span>
              <span className="club-review__name">{r.username}</span>
              {r.rating && <StarRating value={r.rating} size="sm" />}
              {(r.user_id === user?.id || canModerate) && (
                <button className="icon-btn icon-btn--danger" title="Видалити" onClick={() => handleDelete(r)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            {r.review && <p className="club-review__text">{r.review}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
