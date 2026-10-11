import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Library, Target, BarChart2, Bookmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../Login/Login.scss';
import './Register.scss';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim() || !confirm.trim()) {
      setError('Будь ласка, заповніть усі поля.');
      return;
    }
    if (password !== confirm) {
      setError('Паролі не співпадають.');
      return;
    }
    if (password.length < 4) {
      setError('Пароль має містити мінімум 4 символи.');
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Шось пішло не так. А ну ще раз попробуйте.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__left">
        <div className="auth-page__decoration">
          <div className="deco-brand">
            <Library size={36} className="deco-icon" />
            <h1>BookShelf</h1>
          </div>
          <p>Приєднуйтесь до тисяч читачів, які відстежують та організовують свою читацьку подорож тут.</p>
        </div>
        <div className="auth-page__features">
          <div className="auth-page__feature">
            <Target size={20} className="feature-icon" />
            <span className="feature-text">Встановлюйте свої читацькі цілі</span>
          </div>
          <div className="auth-page__feature">
            <BarChart2 size={20} className="feature-icon" />
            <span className="feature-text">Переглядайте свою статистику</span>
          </div>
          <div className="auth-page__feature">
            <Bookmark size={20} className="feature-icon" />
            <span className="feature-text">Ніколи більше не втрачайте свій прогрес</span>
          </div>
        </div>
      </div>

      <div className="auth-page__right">
        <div className="auth-page__form-container">
          <div className="auth-page__form-header">
            <h2>Створити акаунт</h2>
            <p>Розпочніть свій читацький шлях вже сьогодні</p>
          </div>

          {error && <div className="auth-page__error">{error}</div>}

          <form className="auth-page__form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Ім'я користувача</label>
              <input
                id="username"
                type="text"
                placeholder="Введіть ім'я користувача"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                type="password"
                placeholder="Придумайте пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Підтвердження пароля</label>
              <input
                id="confirm"
                type="password"
                placeholder="Повторіть свій пароль"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="auth-page__submit"
              disabled={loading}
            >
              {loading ? 'Створємо акаунт…' : 'Створити акаунт'}
            </button>
          </form>

          <div className="auth-page__footer">
            Уже зареєстровані?{' '}
            <Link to="/login">Увійти</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
