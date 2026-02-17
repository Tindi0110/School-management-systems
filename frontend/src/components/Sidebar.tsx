import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  LayoutDashboard, Users, BookOpen, Building,
  DollarSign, Bus, Pill, GraduationCap, School, Calendar, Activity
} from 'lucide-react'

const Sidebar = () => {
  const { user } = useSelector((state: any) => state.auth)
  const role = user?.role || 'STUDENT'

  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, permission: 'view_dashboard', roles: ['ALL'] },
    { name: 'Academics', path: '/academics', icon: <School size={20} />, permission: 'view_academics', roles: ['ADMIN', 'PRINCIPAL', 'DOS', 'TEACHER'] },
    { name: 'Students', path: '/students', icon: <Users size={20} />, permission: 'view_student', roles: ['ADMIN', 'PRINCIPAL', 'DEPUTY', 'REGISTRAR', 'DOS'] },
    { name: 'Parents', path: '/parents', icon: <Users size={20} />, permission: 'view_parent', roles: ['ADMIN', 'PRINCIPAL', 'DEPUTY', 'REGISTRAR', 'DOS'] },
    { name: 'Staff', path: '/staff', icon: <GraduationCap size={20} />, permission: 'view_staff', roles: ['ADMIN', 'PRINCIPAL', 'REGISTRAR', 'DOS'] },
    { name: 'Finance', path: '/finance', icon: <DollarSign size={20} />, permission: 'view_finance', roles: ['ADMIN', 'ACCOUNTANT', 'PRINCIPAL'] },
    { name: 'Hostels', path: '/hostels', icon: <Building size={20} />, permission: 'view_hostel', roles: ['ADMIN', 'WARDEN', 'PRINCIPAL', 'REGISTRAR'] },
    { name: 'Library', path: '/library', icon: <BookOpen size={20} />, permission: 'view_library', roles: ['ADMIN', 'PRINCIPAL', 'LIBRARIAN', 'DOS'] },
    { name: 'Medical', path: '/medical', icon: <Pill size={20} />, permission: 'view_medical', roles: ['ADMIN', 'NURSE', 'PRINCIPAL'] },
    { name: 'Transport', path: '/transport', icon: <Bus size={20} />, permission: 'view_transportallocation', roles: ['ADMIN', 'PRINCIPAL', 'REGISTRAR', 'WARDEN'] },
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
      <div className="sidebar-header">
        <h3 className="text-lg font-bold">School Management System</h3>
      </div>
      <nav className="sidebar-nav">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            {link.icon}
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <p className="user-name">{user?.username || 'User'}</p>
          <p className="user-role">
            {({
              'ADMIN': 'Administrator',
              'DOS': 'Director of Studies',
              'REGISTRAR': 'Admissions Registrar',
              'TEACHER': 'Teacher',
              'ACCOUNTANT': 'Accountant',
              'WARDEN': 'Warden',
              'NURSE': 'Nurse',
              'LIBRARIAN': 'Librarian',
              'STUDENT': 'Student'
            }[role as string] || role)}
          </p>
        </div>
      </div>

      <style>{`
        .sidebar {
          width: 250px;
          background: #1e3c72;
          color: white;
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .sidebar-nav {
          flex: 1;
          padding: 1rem 0;
          overflow-y: auto;
        }
        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          transition: all 0.3s;
        }
        .nav-item:hover, .nav-item.active {
          background: rgba(255,255,255,0.1);
          color: white;
          border-left: 4px solid #4facfe;
        }
        .nav-item svg {
          margin-right: 0.75rem;
        }
        .sidebar-footer {
          padding: 1rem;
          background: rgba(0,0,0,0.2);
        }
        .user-name {
          font-weight: 600;
        }
        .user-role {
          font-size: 0.8rem;
          opacity: 0.7;
        }
      `}</style>
    </aside>
  )
}

export default Sidebar
