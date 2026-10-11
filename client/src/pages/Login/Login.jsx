import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Library, BookOpen, Star, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Login.scss';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Будь ласка, заповність усі поля.');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || "Неправильний пароль або ім'я користувача. Будь ласка, спробуйте ще раз.");
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
          <p>Ваш особистий компаньйон у читанні. Відстежуйте, упорядковуйте та додавайте книги, які вам подобаються.</p>
        </div>
        <div className="auth-page__features">
          <div className="auth-page__feature">
            <BookOpen size={20} className="feature-icon" />
            <span className="feature-text">Відстежуйте прогрес читання</span>
          </div>
          <div className="auth-page__feature">
            <Star size={20} className="feature-icon" />
            <span className="feature-text">Оцінюйте і переглядайте свою бібліотеку</span>
          </div>
          <div className="auth-page__feature">
            <Layers size={20} className="feature-icon" />
            <span className="feature-text">Структуруйте за жанрами та авторами</span>
          </div>
        </div>
      </div>

      <div className="auth-page__right">
        <div className="auth-page__form-container">
          <div className="auth-page__form-header">
            <h2>Ласкаво Просимо</h2>
            <p>Увійдіть у свій акаунт</p>
          </div>

          {error && <div className="auth-page__error">{error}</div>}

          <form className="auth-page__form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Ім'я користувача</label>
              <input
                id="username"
                type="text"
                placeholder="Введіть ваше ім'я користувача"
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
                placeholder="Введіть ваш пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="auth-page__submit"
              disabled={loading}
            >
              {loading ? 'Виконується вхід…' : 'Увійти'}
            </button>
          </form>

          <div className="auth-page__footer">
            Ще не зареєстровані?{' '}
            <Link to="/register">Створити акаунт</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
