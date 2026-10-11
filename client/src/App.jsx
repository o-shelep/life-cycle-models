import { Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import Books from './pages/Books/Books';
import Sidebar from './components/Sidebar/Sidebar';
import Authors from './pages/Authors/Authors';
import Genres from './pages/Genres/Genres';
import Profile from './pages/Profile/Profile';
import './styles/global.scss';

function ProtectedLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
         <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path='/' element={<Books />} />
            <Route path='/authors' element={<Authors />} />
            <Route path='/genres' element={<Genres />} />
            <Route path='/profile' element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
