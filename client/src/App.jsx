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
import Clubs from './pages/Clubs/Clubs';
import ClubDetail from './pages/Clubs/ClubDetail';
import './styles/global.scss';

function ProtectedLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout__main">
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
            <Route path='/clubs' element={<Clubs />} />
            <Route path='/clubs/:id' element={<ClubDetail />} />
            <Route path='/profile' element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
