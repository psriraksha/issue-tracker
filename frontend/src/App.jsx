import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { Login, Register, Dashboard, Issues, IssueDetail } from './pages';
const Guard = ({ children }) => useAuth().user ? children : <Navigate to="/login" replace />;
export default function App() {
  const { user, logout } = useAuth(), nav = useNavigate();
  return (<>
    {user && <nav><b>Issue Tracker</b><NavLink to="/" end>Dashboard</NavLink><NavLink to="/issues">Issues</NavLink>
      <span className="sp" /><span>{user.name} ({user.role})</span>
      <button onClick={() => { logout(); nav('/login'); }}>Logout</button></nav>}
    <main className={user ? '' : 'wide'}><Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<Login admin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Guard><Dashboard /></Guard>} />
      <Route path="/issues" element={<Guard><Issues /></Guard>} />
      <Route path="/issues/:id" element={<Guard><IssueDetail /></Guard>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes></main>
  </>);
}