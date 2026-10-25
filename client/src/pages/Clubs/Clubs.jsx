import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Lock, Globe, Search } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/Modal/Modal';
import ClubForm from './ClubForm';
import { CLUB_TYPES, CLUB_ROLES } from './constants';
import './Clubs.scss';

export default function Clubs() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clubs', { params: { search: search || undefined, mine: onlyMine || undefined } });
      setClubs(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchClubs, 250);
    return () => clearTimeout(t);
  }, [search, onlyMine]);

  const handleCreate = async (data) => {
    const res = await api.post('/clubs', data);
    setModalOpen(false);
    navigate(`/clubs/${res.data.id}`);
  };

  const handleJoin = async (club) => {
    setJoiningId(club.id);
    try {
      await api.post(`/clubs/${club.id}/join`);
      fetchClubs();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Не вдалося приєднатися до клубу.');
    } finally {
      setJoiningId(null);
    }
  };

  const renderAction = (club) => {
    if (club.my_status === 'active') {
      return <span className="club-card__role">{CLUB_ROLES[club.my_role]}</span>;
    }
    if (club.my_status === 'requested') {
      return <span className="club-card__pending">Запит надіслано</span>;
    }
    return (
      <button
        className="btn btn--primary club-card__join"
        onClick={(e) => { e.preventDefault(); handleJoin(club); }}
        disabled={joiningId === club.id}
      >
        {club.my_status === 'invited' ? 'Прийняти запрошення'
          : club.type === 'open' ? 'Приєднатися' : 'Надіслати запит'}
      </button>
    );
  };

  return (
    <div className="clubs-page">
      <div className="clubs-page__header">
        <h1>Читацькі клуби</h1>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)}>+ Створити клуб</button>
      </div>

      <div className="clubs-page__filters">
        <label className="clubs-page__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Пошук клубу за назвою"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <label className="clubs-page__toggle">
          <input type="checkbox" checked={onlyMine} onChange={e => setOnlyMine(e.target.checked)} />
          Лише мої клуби
        </label>
      </div>

      <div className="clubs-page__content">
        {loading ? (
          <div className="clubs-page__loading">Завантажуємо клуби…</div>
        ) : clubs.length === 0 ? (
          <div className="clubs-page__empty">
            <Users size={48} className="empty-icon" />
            <h3>Клубів поки немає</h3>
            <p>Створіть перший клуб і запросіть друзів читати разом.</p>
          </div>
        ) : (
          <div className="clubs-page__grid">
            {clubs.map(club => (
              <Link key={club.id} to={`/clubs/${club.id}`} className="club-card">
                <div className="club-card__top">
                  <h3 className="club-card__name">{club.name}</h3>
                  <span className={`club-card__type club-card__type--${club.type}`}>
                    {club.type === 'open' ? <Globe size={12} /> : <Lock size={12} />}
                    {CLUB_TYPES[club.type]}
                  </span>
                </div>
                {club.description && <p className="club-card__desc">{club.description}</p>}
                <div className="club-card__bottom">
                  <span className="club-card__meta">
                    <Users size={14} /> {club.members_count} · власник {club.owner_name}
                  </span>
                  {renderAction(club)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Новий читацький клуб">
        <ClubForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} submitLabel="Створити клуб" />
      </Modal>
    </div>
  );
}
