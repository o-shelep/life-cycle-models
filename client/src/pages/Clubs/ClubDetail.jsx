import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Globe, Pencil, Trash2, LogOut } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/Modal/Modal';
import ClubForm from './ClubForm';
import { CLUB_TYPES, CLUB_ROLES } from './constants';
import './Clubs.scss';

export default function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const fetchClub = useCallback(async () => {
    try {
      const res = await api.get(`/clubs/${id}`);
      setClub(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.status === 404 ? 'Клуб не знайдено.' : 'Не вдалося завантажити клуб.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchClub(); }, [fetchClub]);

  const isActive = club?.my_status === 'active';
  const isOwner = isActive && club?.my_role === 'owner';

  const handleJoin = async () => {
    try {
      await api.post(`/clubs/${id}/join`);
      fetchClub();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Не вдалося приєднатися до клубу.');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm(`Вийти з клубу "${club.name}"?`)) return;
    await api.post(`/clubs/${id}/leave`);
    fetchClub();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Видалити клуб "${club.name}" разом з усіма даними?`)) return;
    await api.delete(`/clubs/${id}`);
    navigate('/clubs');
  };

  const handleUpdate = async (data) => {
    await api.put(`/clubs/${id}`, data);
    setEditOpen(false);
    fetchClub();
  };

  if (loading) return <div className="clubs-page__loading">Завантажуємо клуб…</div>;
  if (error) {
    return (
      <div className="clubs-page">
        <div className="clubs-page__empty">
          <h3>{error}</h3>
          <Link to="/clubs" className="btn btn--secondary">До списку клубів</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="clubs-page club-detail">
      <div className="clubs-page__header">
        <div className="club-detail__title">
          <Link to="/clubs" className="club-detail__back" title="До списку клубів"><ArrowLeft size={18} /></Link>
          <h1>{club.name}</h1>
          <span className={`club-card__type club-card__type--${club.type}`}>
            {club.type === 'open' ? <Globe size={12} /> : <Lock size={12} />}
            {CLUB_TYPES[club.type]}
          </span>
        </div>
        <div className="club-detail__actions">
          {isOwner && (
            <>
              <button className="btn btn--secondary" onClick={() => setEditOpen(true)}><Pencil size={15} /> Редагувати</button>
              <button className="btn btn--danger" onClick={handleDelete}><Trash2 size={15} /> Видалити</button>
            </>
          )}
          {isActive && !isOwner && (
            <button className="btn btn--secondary" onClick={handleLeave}><LogOut size={15} /> Вийти з клубу</button>
          )}
          {!isActive && club.my_status !== 'requested' && (
            <button className="btn btn--primary" onClick={handleJoin}>
              {club.my_status === 'invited' ? 'Прийняти запрошення'
                : club.type === 'open' ? 'Приєднатися' : 'Надіслати запит'}
            </button>
          )}
          {club.my_status === 'requested' && <span className="club-card__pending">Запит очікує підтвердження</span>}
        </div>
      </div>

      <div className="clubs-page__content club-detail__layout">
        <section className="club-section">
          <h2>Про клуб</h2>
          <p className="club-detail__text">{club.description || 'Опис поки не додано.'}</p>
          {club.rules && (
            <>
              <h3>Правила участі</h3>
              <p className="club-detail__text">{club.rules}</p>
            </>
          )}
          <p className="club-detail__muted">Власник: {club.owner_name}</p>
        </section>

        <section className="club-section">
          <h2>Учасники ({club.members.length})</h2>
          {club.members.length === 0 ? (
            <p className="club-detail__muted">Список учасників бачать лише члени закритого клубу.</p>
          ) : (
            <ul className="member-list">
              {club.members.map(m => (
                <li key={m.user_id} className="member-list__item">
                  <span className="member-list__avatar">{m.username[0].toUpperCase()}</span>
                  <span className="member-list__name">{m.username}</span>
                  <span className={`member-list__role member-list__role--${m.role}`}>{CLUB_ROLES[m.role]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Редагувати клуб">
        <ClubForm
          initial={{ name: club.name, description: club.description, rules: club.rules, type: club.type }}
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
          submitLabel="Зберегти зміни"
        />
      </Modal>
    </div>
  );
}
