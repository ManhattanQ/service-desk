import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import Kanban from './pages/Kanban';
import NewTicket from './pages/NewTicket';
import TicketDetail from './pages/TicketDetail';
import ComingSoon from './pages/ComingSoon';
import AppLayout from './components/layout/AppLayout';

function RequireAuth({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function RequireSpecialist({ children }) {
  const { currentUser } = useAuth();
  if (currentUser.role !== 'specialist') return <Navigate to="/queue" replace />;
  return children;
}

function RequireEmployee({ children }) {
  const { currentUser } = useAuth();
  if (currentUser.role !== 'employee') return <Navigate to="/queue" replace />;
  return children;
}

function RedirectIfAuthed({ children }) {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/" replace />;
  return children;
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
      <Route path="/" element={<Navigate to="/queue" replace />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route
          path="/dashboard"
          element={
            <RequireSpecialist>
              <Dashboard />
            </RequireSpecialist>
          }
        />
        <Route path="/queue" element={<Queue />} />
        <Route path="/queue/:id" element={<TicketDetail />} />
        <Route
          path="/new-ticket"
          element={
            <RequireEmployee>
              <NewTicket />
            </RequireEmployee>
          }
        />
        <Route
          path="/kanban"
          element={
            <RequireSpecialist>
              <Kanban />
            </RequireSpecialist>
          }
        />
        <Route path="/help" element={<ComingSoon title="Помощь" />} />
        <Route path="/settings" element={<ComingSoon title="Настройки" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
