import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { HelpCircle, Settings, LayoutDashboard, List, Kanban, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketsContext';
import { departmentLabel } from '../../data/constants';
import { getSlaState, formatTimeLeft } from '../../utils/sla';
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

function PriorityList({ title, dotColor, tickets }) {
  const [scrollable, setScrollable] = useState(false);
  const listRef = useRef(null);
  if (tickets.length === 0) return null;
  const overflow = tickets.length - 3;

  function collapse() {
    setScrollable(false);
    if (listRef.current) listRef.current.scrollTop = 0;
  }

  return (
    <div className="sidebar-priority-group">
      <p className="sidebar-priority-title">
        <span className="priority-dot" style={{ background: dotColor }} />
        {title}
      </p>
      <div ref={listRef} className={`sidebar-priority-list${scrollable ? ' scrollable' : ''}`}>
        {tickets.map((t) => (
          <div key={t.id} className="sidebar-priority-card">
            <div className="sidebar-priority-card-top">
              <span className="sidebar-priority-number">{t.number}</span>
              {t.status === 'on_hold' ? (
                <span className="sidebar-sla-dash">-</span>
              ) : (
                <span className={`sidebar-sla-pill sla-${getSlaState(t)}`}>{formatTimeLeft(t)}</span>
              )}
            </div>
            <p className="sidebar-priority-card-title">{t.title}</p>
            <p className="sidebar-priority-card-meta">
              {t.author} · {departmentLabel(t.department)}
            </p>
          </div>
        ))}
      </div>
      {overflow > 0 && (
        <button
          type="button"
          className="sidebar-priority-more"
          onClick={() => (scrollable ? collapse() : setScrollable(true))}
        >
          {scrollable ? 'Свернуть' : `+${overflow} ещё`}
        </button>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { tickets } = useTickets();

  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const openTickets = tickets.filter((t) => t.status !== 'closed');
  const urgentCount = openTickets.filter((t) => t.priority === 'critical' || t.priority === 'high').length;
  const critical = openTickets.filter((t) => t.priority === 'critical');
  const high = openTickets.filter((t) => t.priority === 'high');

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Link to="/queue" className="sidebar-brand">
          <img src={logoMark} alt="" className="sidebar-logo" />
          <span>Solution Center</span>
        </Link>

        <nav className="sidebar-nav">
          <NavItem to="/dashboard" icon={<LayoutDashboard size={20} strokeWidth={1.8} />} label="Dashboard" />
          <NavItem to="/queue" icon={<List size={20} strokeWidth={1.8} />} label="Очередь заявок" badge={urgentCount} />
          <NavItem to="/kanban" icon={<Kanban size={20} strokeWidth={1.8} />} label="Kanban" />
        </nav>

        <div className="sidebar-divider" />

        <PriorityList title="Критический приоритет" dotColor="#f53b57" tickets={critical} />
        <PriorityList title="Высокий приоритет" dotColor="#ff7504" tickets={high} />
      </div>

      <div className="sidebar-bottom">
        <NavItem to="/help" icon={<HelpCircle size={20} strokeWidth={1.8} />} label="Помощь" />
        <NavItem to="/settings" icon={<Settings size={20} strokeWidth={1.8} />} label="Настройки" />
        <div className="sidebar-divider" />
        <div className="sidebar-profile-wrap" ref={menuRef}>
          {menuOpen && (
            <div className="sidebar-profile-menu">
              <button type="button" className="sidebar-profile-menu-item" onClick={logout}>
                <LogOut size={16} strokeWidth={1.8} />
                Выйти
              </button>
            </div>
          )}
          <button
            type="button"
            className="sidebar-profile"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="sidebar-avatar" />
            <span className="sidebar-profile-text">
              <strong>
                {currentUser.firstName} {currentUser.lastName}
              </strong>
              <small>{currentUser.role === 'specialist' ? 'Специалист поддержки' : departmentLabel(currentUser.department)}</small>
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
