import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  LayoutDashboard, Users, BookOpen, Building,
  DollarSign, Bus, Pill, GraduationCap, School, Calendar, Activity
} from 'lucide-react'

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const { user } = useSelector((state: any) => state.auth)
  const role = user?.role || 'STUDENT'

  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, permission: 'view_dashboard', roles: ['ALL'] },
    { name: 'Academics', path: '/academics', icon: <School size={20} />, permission: 'view_academics', roles: ['ADMIN', 'PRINCIPAL', 'DOS', 'TEACHER'] },
    { name: 'Students', path: '/students', icon: <Users size={20} />, permission: 'view_student', roles: ['ADMIN', 'PRINCIPAL', 'DEPUTY', 'REGISTRAR'] },
    { name: 'Parents', path: '/parents', icon: <Users size={20} />, permission: 'view_parent', roles: ['ADMIN', 'PRINCIPAL', 'DEPUTY', 'REGISTRAR'] },
    { name: 'Staff', path: '/staff', icon: <GraduationCap size={20} />, permission: 'view_staff', roles: ['ADMIN', 'PRINCIPAL', 'REGISTRAR', 'DOS'] },
    { name: 'Finance', path: '/finance', icon: <DollarSign size={20} />, permission: 'view_finance', roles: ['ADMIN', 'ACCOUNTANT', 'PRINCIPAL'] },
    { name: 'Hostels', path: '/hostels', icon: <Building size={20} />, permission: 'view_hostel', roles: ['ADMIN', 'WARDEN', 'PRINCIPAL', 'REGISTRAR'] },
    { name: 'Library', path: '/library', icon: <BookOpen size={20} />, permission: 'view_library', roles: ['ADMIN', 'PRINCIPAL', 'LIBRARIAN', 'DOS'] },
    { name: 'Medical', path: '/medical', icon: <Pill size={20} />, permission: 'view_medical', roles: ['ADMIN', 'NURSE', 'PRINCIPAL'] },
    { name: 'Transport', path: '/transport', icon: <Bus size={20} />, permission: 'view_transportallocation', roles: ['ADMIN', 'PRINCIPAL', 'REGISTRAR', 'WARDEN', 'DRIVER'] },
    { name: 'Timetable', path: '/timetable', icon: <Calendar size={20} />, permission: 'view_academics', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'DOS'] },
    { name: 'System Health', path: '/health', icon: <Activity size={20} />, permission: 'view_audit', roles: ['ADMIN'] },
  ]

  const filteredLinks = links.filter(link => {
    // Check Permission (if exists)
    const hasPermission = link.permission && user?.permissions?.length > 0
      ? user.permissions.includes(link.permission) || user.permissions.includes('ALL')
      : false;

    // Check Role
    const hasRole = link.roles.includes('ALL') || link.roles.includes(role);

    // Allow if EITHER permission is valid OR role is whitelisted
    // This ensures backward compatibility if permissions are stale/missing
    if (user?.permissions?.length > 0) {
      return hasPermission || hasRole;
    }
    return hasRole;
  })

  return (
    <aside className="sidebar">
      <div className="sidebar-header flex justify-between items-center">
        <h3 className="text-sm font-black tracking-wide uppercase">School Management System</h3>
      </div>
      <nav className="sidebar-nav">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={onClose}
          >
            {link.icon}
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <p className="user-name text-xs font-bold">{user?.username || 'User'}</p>
          <p className="user-role text-[10px]">
            {({
              'ADMIN': 'Administrator',
              'DOS': 'Director of Studies',
              'REGISTRAR': 'Admissions Registrar',
              'TEACHER': 'Teacher',
              'ACCOUNTANT': 'Accountant',
              'WARDEN': 'Warden',
              'NURSE': 'Nurse',
              'LIBRARIAN': 'Librarian',
              'STUDENT': 'Student',
              'DRIVER': 'Institutional Driver'
            }[role as string] || role)}
          </p>
        </div>
      </div>

      <style>{`
        .sidebar {
          width: 100%;
          height: 100%;
          background: var(--primary);
          color: white;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-xl);
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .sidebar-header {
          padding: var(--spacing-md) var(--spacing-md);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: var(--primary-dark);
        }
        .sidebar-nav {
          flex: 1;
          padding: var(--spacing-lg) 0;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .sidebar-nav::-webkit-scrollbar {
          display: none;
        }
        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.875rem var(--spacing-lg);
          color: var(--text-muted);
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 500;
          letter-spacing: 0.01em;
          border-left: 4px solid transparent;
        }
        .nav-item:hover {
          color: white;
          background: rgba(255,255,255,0.05);
        }
        .nav-item.active {
          background: rgba(255,255,255,0.08);
          color: white;
          border-left-color: var(--primary-accent);
          font-weight: 600;
        }
        .nav-item svg {
          margin-right: 1rem;
          opacity: 0.8;
          transition: transform 0.2s;
        }
        .nav-item:hover svg {
          transform: scale(1.1);
          opacity: 1;
        }
        .sidebar-footer {
          padding: var(--spacing-lg);
          background: var(--primary-dark);
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .user-name {
          font-weight: 600;
          color: white;
          font-size: 0.9375rem;
          margin-bottom: 2px;
        }
        .user-role {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </aside>
  )
}

export default Sidebar
