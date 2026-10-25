import { useState, useEffect, useCallback } from 'react';
import { Vote, Check, Trophy } from 'lucide-react';
import api from '../../api/axios';
import { plural } from './constants';

const REFRESH_MS = 15000;

export default function ClubPolls({ club, onClosed }) {
  const [polls, setPolls] = useState([]);
  const [library, setLibrary] = useState([]);
  const [proposal, setProposal] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canManage = ['owner', 'moderator'].includes(club.my_role);

  const fetchPolls = useCallback(async () => {
    try {
      const res = await api.get(`/clubs/${club.id}/polls`);
      setPolls(res.data);
    } catch {
      // ignore
    }
  }, [club.id]);

  // Results are refreshed periodically so members see other votes without reloading.
  useEffect(() => {
    fetchPolls();
    const timer = setInterval(fetchPolls, REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchPolls]);

  useEffect(() => {
    api.get('/books').then(res => setLibrary(res.data)).catch(() => {});
  }, []);

  const run = async (request) => {
    setBusy(true);
    setError('');
    try {
      const res = await request();
      await fetchPolls();
      return res;
    } catch (err) {
      setError(err.response?.data?.message || 'Дію не виконано.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const active = polls.find(p => p.status === 'open');
  const finished = polls.filter(p => p.status === 'closed').slice(0, 3);

  const handlePropose = async (e) => {
    e.preventDefault();
    const value = proposal.trim();
    if (!value) return;
    const fromLibrary = library.find(b => b.title === value);
    const body = fromLibrary ? { source_book_id: fromLibrary.id } : { title: value };
    const res = await run(() => api.post(`/clubs/${club.id}/polls/${active.id}/options`, body));
    if (res) setProposal('');
  };

  const handleClose = async () => {
    if (!window.confirm('Завершити голосування? Книга-переможець отримає статус «Заплановано для читання».')) return;
    const res = await run(() => api.post(`/clubs/${club.id}/polls/${active.id}/close`));
    if (res) onClosed?.();
  };

  return (
    <section className="club-section club-polls">
      <div className="club-section__head">
        <h2>Голосування за книгу місяця</h2>
        {canManage && active && (
          <button className="btn btn--secondary" onClick={handleClose} disabled={busy}>Завершити голосування</button>
        )}
      </div>

      {error && <div className="club-form__error">{error}</div>}

      {!active ? (
        <div className="club-polls__empty">
          <Vote size={28} />
          <p>Зараз немає активного голосування.</p>
          {canManage && (
            <form className="club-members__invite" onSubmit={(e) => {
              e.preventDefault();
              run(() => api.post(`/clubs/${club.id}/polls`, { title: newTitle })).then(() => setNewTitle(''));
            }}>
              <input type="text" placeholder="Назва, напр. Книга грудня" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <button type="submit" className="btn btn--primary" disabled={busy}>Почати голосування</button>
            </form>
          )}
        </div>
      ) : (
        <>
          <p className="club-polls__title">
            {active.title} · {plural(active.total_votes, ['голос', 'голоси', 'голосів'])}
            {active.my_vote ? ' · ваш голос враховано' : ''}
          </p>

          {active.options.length === 0 && (
            <p className="club-detail__muted">Поки немає кандидатів. Запропонуйте першу книгу.</p>
          )}

          <ul className="poll-options">
            {active.options.map(option => {
              const percent = active.total_votes ? Math.round((option.votes / active.total_votes) * 100) : 0;
              const mine = active.my_vote === option.id;
              return (
                <li key={option.id} className={`poll-option${mine ? ' poll-option--mine' : ''}`}>
                  <div className="poll-option__bar" style={{ width: `${percent}%` }} />
                  <div className="poll-option__body">
                    <div className="poll-option__text">
                      <span className="poll-option__title">{option.title}</span>
                      <span className="club-book__meta">
                        {[option.author_name, `запропонував(ла) ${option.added_by_name}`].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    <span className="poll-option__count">{option.votes} · {percent}%</span>
                    {mine ? (
                      <span className="poll-option__mine"><Check size={14} /> Ваш вибір</span>
                    ) : !active.my_vote && (
                      <button
                        className="btn btn--primary poll-option__vote"
                        disabled={busy}
                        onClick={() => run(() => api.post(`/clubs/${club.id}/polls/${active.id}/vote`, { club_book_id: option.id }))}
                      >
                        Голосувати
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <form className="club-members__invite" onSubmit={handlePropose}>
            <input
              type="text"
              list="poll-library"
              placeholder="Запропонувати книгу (назва)"
              value={proposal}
              onChange={e => setProposal(e.target.value)}
            />
            <datalist id="poll-library">
              {library.map(b => <option key={b.id} value={b.title} />)}
            </datalist>
            <button type="submit" className="btn btn--secondary" disabled={busy}>Запропонувати</button>
          </form>
        </>
      )}

      {finished.length > 0 && (
        <div className="club-polls__history">
          <h3>Попередні голосування</h3>
          <ul>
            {finished.map(p => {
              const winner = p.options.find(o => o.status !== 'proposed');
              return (
                <li key={p.id}>
                  <Trophy size={14} /> {p.title}: {winner ? winner.title : 'без переможця'}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
