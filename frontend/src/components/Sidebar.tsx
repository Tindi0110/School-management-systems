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
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: white;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 24px rgba(0,0,0,0.15);
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .sidebar-header {
          padding: 1.5rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: transparent;
        }
        .sidebar-header h3 {
          font-size: 0.85rem;
          background: linear-gradient(90deg, #ffffff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 0.1em;
        }
        .sidebar-nav {
          flex: 1;
          padding: 1rem 0.75rem;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background-color: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          color: #94a3b8;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 500;
          font-size: 0.85rem;
          border-radius: 0.75rem;
          border: 1px solid transparent;
        }
        .nav-item:hover {
          color: white;
          background: rgba(255,255,255,0.03);
          transform: translateX(4px);
        }
        .nav-item.active {
          background: linear-gradient(90deg, var(--primary) 0%, rgba(var(--primary-rgb), 0.8) 100%);
          color: white;
          font-weight: 700;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
        }
        .nav-item svg {
          margin-right: 0.875rem;
          opacity: 0.7;
          transition: all 0.3s ease;
        }
        .nav-item:hover svg, .nav-item.active svg {
          opacity: 1;
          transform: scale(1.1);
        }
        .sidebar-footer {
          padding: 1.25rem;
          background: rgba(0,0,0,0.2);
          border-top: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
        }
        .user-name {
          font-weight: 700;
          color: white;
          font-size: 0.9rem;
          margin-bottom: 2px;
        }
        .user-role {
          font-size: 0.7rem;
          color: var(--primary-accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 800;
        }
      `}</style>
    </aside>
  )
}

export default Sidebar
