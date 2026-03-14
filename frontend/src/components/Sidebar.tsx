import { memo, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  LayoutDashboard, Users, BookOpen, Building,
  DollarSign, Bus, Pill, GraduationCap, School, Calendar, Activity
} from 'lucide-react'

interface SidebarProps {
  onClose?: () => void;
}

// Defined OUTSIDE component to avoid creating new objects on every render
const ALL_LINKS = [
  { name: 'Dashboard',     path: '/',         icon: <LayoutDashboard size={20} />, roles: ['ALL'] },
  { name: 'Academics',     path: '/academics', icon: <School size={20} />,         roles: ['ADMIN', 'PRINCIPAL', 'DOS', 'TEACHER'] },
  { name: 'Students',      path: '/students',  icon: <Users size={20} />,          roles: ['ADMIN', 'PRINCIPAL', 'DEPUTY', 'REGISTRAR'] },
  { name: 'Parents',       path: '/parents',   icon: <Users size={20} />,          roles: ['ADMIN', 'PRINCIPAL', 'DEPUTY', 'REGISTRAR'] },
  { name: 'Staff',         path: '/staff',     icon: <GraduationCap size={20} />,  roles: ['ADMIN', 'PRINCIPAL', 'REGISTRAR', 'DOS'] },
  { name: 'Finance',       path: '/finance',   icon: <DollarSign size={20} />,     roles: ['ADMIN', 'ACCOUNTANT', 'PRINCIPAL'] },
  { name: 'Hostels',       path: '/hostels',   icon: <Building size={20} />,       roles: ['ADMIN', 'WARDEN', 'PRINCIPAL', 'REGISTRAR'] },
  { name: 'Library',       path: '/library',   icon: <BookOpen size={20} />,       roles: ['ADMIN', 'PRINCIPAL', 'LIBRARIAN', 'DOS'] },
  { name: 'Medical',       path: '/medical',   icon: <Pill size={20} />,           roles: ['ADMIN', 'NURSE', 'PRINCIPAL'] },
  { name: 'Transport',     path: '/transport', icon: <Bus size={20} />,            roles: ['ADMIN', 'PRINCIPAL', 'REGISTRAR', 'WARDEN', 'DRIVER'] },
  { name: 'Timetable',     path: '/timetable', icon: <Calendar size={20} />,       roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'DOS'] },
  { name: 'System Health', path: '/health',    icon: <Activity size={20} />,       roles: ['ADMIN'] },
]

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator', DOS: 'Director of Studies', REGISTRAR: 'Admissions Registrar',
  TEACHER: 'Teacher', ACCOUNTANT: 'Accountant', WARDEN: 'Warden',
  NURSE: 'Nurse', LIBRARIAN: 'Librarian', STUDENT: 'Student', DRIVER: 'Institutional Driver',
}

const getNavClass = ({ isActive }: { isActive: boolean }) => isActive ? 'nav-item active' : 'nav-item'

const Sidebar = memo(({ onClose }: SidebarProps) => {
  const { user } = useSelector((state: any) => state.auth)
  const role = user?.role || 'STUDENT'

  const filteredLinks = useMemo(() => {
    return ALL_LINKS.filter(link => {
      const hasRole = link.roles.includes('ALL') || link.roles.includes(role)
      if (user?.permissions?.length > 0) {
        return hasRole
      }
      return hasRole
    })
  }, [role, user?.permissions])

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3 className="text-sm font-black tracking-wide uppercase">School Management System</h3>
      </div>
      <nav className="sidebar-nav">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={getNavClass}
            onClick={onClose}
            end={link.path === '/'}
          >
            {link.icon}
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <p className="user-name">{user?.first_name || user?.username || 'User'}</p>
          <p className="user-role">{ROLE_LABELS[role] || role}</p>
        </div>
      </div>
    </aside>
  )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
