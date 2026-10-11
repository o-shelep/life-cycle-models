import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, PenLine, Tag, User, Library, LogOut } from 'lucide-react';
import './Sidebar.scss';

const navItems = [
  { to: '/', icon: <BookOpen size={18} />, label: 'Книжки', end: true },
  { to: '/authors', icon: <PenLine size={18} />, label: 'Автори' },
  { to: '/genres', icon: <Tag size={18} />, label: 'Жанри' },
  { to: '/profile', icon: <User size={18} />, label: 'Профіль' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <Library size={24} className="logo-icon" />
        <span className="logo-text">BookShelf</span>
      </div>

      <nav className="sidebar__nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar__nav-link${isActive ? ' active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>

            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <Link to="/profile" className="sidebar__user sidebar__user--link">
          <div className="sidebar__avatar">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="sidebar__username">{user?.username}</span>
        </Link>
        <button className="sidebar__logout" onClick={handleLogout}>
          <LogOut size={16} />
          Вийти
        </button>
      </div>
    </aside>
  );
}
