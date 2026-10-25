import { useState, useEffect, useCallback } from 'react';
import { Check, X, UserPlus, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import { CLUB_ROLES } from './constants';

export default function ClubMembers({ club, onChange }) {
  const myRole = club.my_status === 'active' ? club.my_role : null;
  const canManage = myRole === 'owner' || myRole === 'moderator';
  const [members, setMembers] = useState(club.members);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!myRole) { setMembers(club.members); return; }
    try {
      const res = await api.get(`/clubs/${club.id}/members`);
      setMembers(res.data);
    } catch {
      // ignore
    }
  }, [club, myRole]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const run = async (request, successText) => {
    setBusy(true);
    try {
      const res = await request();
      setMessage({ type: 'ok', text: successText || res.data.message });
      await fetchMembers();
      onChange?.();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Дію не виконано.' });
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    run(() => api.post(`/clubs/${club.id}/invitations`, { username: username.trim() }), `Запрошення для ${username.trim()} надіслано.`)
      .then(() => setUsername(''));
  };

  const active = members.filter(m => !m.status || m.status === 'active');
  const requests = members.filter(m => m.status === 'requested');
  const invited = members.filter(m => m.status === 'invited');

  const canRemove = (m) => m.role !== 'owner' && (myRole === 'owner' || (myRole === 'moderator' && m.role === 'member'));

  return (
    <section className="club-section">
      <h2>Учасники ({active.length})</h2>

      {message && <div className={`club-members__msg club-members__msg--${message.type}`}>{message.text}</div>}

      {canManage && (
        <form className="club-members__invite" onSubmit={handleInvite}>
          <input
            type="text"
            placeholder="Ім'я користувача"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <button type="submit" className="btn btn--primary" disabled={busy}><UserPlus size={15} /> Запросити</button>
        </form>
      )}

      {canManage && requests.length > 0 && (
        <>
          <h3>Запити на вступ</h3>
          <ul className="member-list">
            {requests.map(m => (
              <li key={m.user_id} className="member-list__item">
                <span className="member-list__avatar">{m.username[0].toUpperCase()}</span>
                <span className="member-list__name">{m.username}</span>
                <button className="icon-btn icon-btn--ok" title="Прийняти" disabled={busy}
                  onClick={() => run(() => api.post(`/clubs/${club.id}/requests/${m.user_id}/approve`), `${m.username} тепер учасник клубу.`)}>
                  <Check size={15} />
                </button>
                <button className="icon-btn icon-btn--danger" title="Відхилити" disabled={busy}
                  onClick={() => run(() => api.post(`/clubs/${club.id}/requests/${m.user_id}/reject`), `Запит ${m.username} відхилено.`)}>
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {canManage && requests.length > 0 && <h3>Учасники клубу</h3>}

      {active.length === 0 ? (
        <p className="club-detail__muted">Список учасників бачать лише члени закритого клубу.</p>
      ) : (
        <ul className="member-list">
          {active.map(m => (
            <li key={m.user_id} className="member-list__item">
              <span className="member-list__avatar">{m.username[0].toUpperCase()}</span>
              <span className="member-list__name">{m.username}</span>
              {myRole === 'owner' && m.role !== 'owner' ? (
                <select
                  className="member-list__role-select"
                  value={m.role}
                  disabled={busy}
                  onChange={e => run(() => api.put(`/clubs/${club.id}/members/${m.user_id}/role`, { role: e.target.value }), 'Роль оновлено.')}
                >
                  <option value="member">{CLUB_ROLES.member}</option>
                  <option value="moderator">{CLUB_ROLES.moderator}</option>
                </select>
              ) : (
                <span className={`member-list__role member-list__role--${m.role}`}>{CLUB_ROLES[m.role]}</span>
              )}
              {canRemove(m) && (
                <button className="icon-btn icon-btn--danger" title="Видалити з клубу" disabled={busy}
                  onClick={() => window.confirm(`Видалити ${m.username} з клубу?`)
                    && run(() => api.delete(`/clubs/${club.id}/members/${m.user_id}`), `${m.username} більше не в клубі.`)}>
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && invited.length > 0 && (
        <p className="club-detail__muted">Очікують відповіді на запрошення: {invited.map(m => m.username).join(', ')}</p>
      )}
    </section>
  );
}
