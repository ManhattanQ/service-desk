import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketsContext';
import { departmentLabel } from '../../data/constants';
import { DashboardIcon, QueueIcon, KanbanIcon, HelpIcon, SettingsIcon } from '../icons/NavIcons';
import logoMark from '../../assets/layout/logo-mark.png';
import './layout.css';

function NavItem({ to, icon, label, badge }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
      {icon}
      <span>{label}</span>
      {badge != null && badge > 0 && <span className="nav-badge">{badge}</span>}
    </NavLink>
  );
}

function PriorityList({ title, tickets }) {
  if (tickets.length === 0) return null;
  return (
    <div className="sidebar-priority-group">
      <p className="sidebar-priority-title">{title}</p>
      {tickets.slice(0, 3).map((t) => (
        <div key={t.id} className="sidebar-priority-item">
          {t.number} {t.author}; {t.title}; {departmentLabel(t.department)}
        </div>
      ))}
    </div>
  );
}

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { tickets } = useTickets();

  const openTickets = tickets.filter((t) => t.status !== 'closed');
  const urgentCount = openTickets.filter((t) => t.priority === 'critical' || t.priority === 'high').length;
  const critical = openTickets.filter((t) => t.priority === 'critical');
  const high = openTickets.filter((t) => t.priority === 'high');

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <img src={logoMark} alt="" className="sidebar-logo" />
          <span>Solution Center</span>
        </div>

        <nav className="sidebar-nav">
          <NavItem to="/dashboard" icon={<DashboardIcon />} label="Dashboard" />
          <NavItem to="/queue" icon={<QueueIcon />} label="Очередь заявок" badge={urgentCount} />
          <NavItem to="/kanban" icon={<KanbanIcon />} label="Kanban" />
        </nav>

        <div className="sidebar-divider" />

        <PriorityList title="Критический приоритет" tickets={critical} />
        <PriorityList title="Высокий приоритет" tickets={high} />
      </div>

      <div className="sidebar-bottom">
        <NavItem to="/help" icon={<HelpIcon />} label="Помощь" />
        <NavItem to="/settings" icon={<SettingsIcon />} label="Настройки" />
        <div className="sidebar-divider" />
        <button type="button" className="sidebar-profile" onClick={logout} title="Выйти">
          <span className="sidebar-avatar" />
          <span className="sidebar-profile-text">
            <strong>
              {currentUser.firstName} {currentUser.lastName}
            </strong>
            <small>{currentUser.role === 'specialist' ? 'Специалист поддержки' : departmentLabel(currentUser.department)}</small>
          </span>
        </button>
      </div>
    </aside>
  );
}
