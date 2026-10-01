import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Queue from './pages/Queue';
import ComingSoon from './pages/ComingSoon';
import AppLayout from './components/layout/AppLayout';

function RequireAuth({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function RequireSpecialist({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'specialist') return <Navigate to="/" replace />;
  return children;
}

function RedirectIfAuthed({ children }) {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { currentUser } = useAuth();
  if (currentUser.role === 'specialist') return <Navigate to="/queue" replace />;
  return <Home />;
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <Register />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <HomeRedirect />
          </RequireAuth>
        }
      />

      <Route
        element={
          <RequireSpecialist>
            <AppLayout />
          </RequireSpecialist>
        }
      >
        <Route path="/dashboard" element={<ComingSoon title="Dashboard" />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/kanban" element={<ComingSoon title="Kanban" />} />
        <Route path="/help" element={<ComingSoon title="Помощь" />} />
        <Route path="/settings" element={<ComingSoon title="Настройки" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
