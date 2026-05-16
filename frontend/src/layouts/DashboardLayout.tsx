/**
 * DashboardLayout.tsx
 *
 * The main application shell for authenticated users.
 * Renders the sidebar, top navigation bar, notification panel,
 * and the active page via <Outlet />.
 *
 * Background tasks (event checks, notifications) are deferred
 * 2 seconds after mount to keep initial navigation fast.
 */

import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice'
import Sidebar from '../components/Sidebar'
import { LogOut, Bell, Menu, Search, Activity } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import CommandPalette from '../components/CommandPalette'
import PageTransition from '../components/common/PageTransition'
import { academicsAPI, communicationAPI } from '../api/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Notification {
  id: number
  title: string
  message: string
  is_read: boolean
  timestamp: string
}

interface Alert {
  id: number
  title: string
  message: string
}

// ---------------------------------------------------------------------------
// NotificationPanel — extracted sub-component for readability
// ---------------------------------------------------------------------------

interface NotificationPanelProps {
  notifications: Notification[]
  alerts: Alert[]
  onMarkRead: (id: number) => void
  onClose: () => void
}

const NotificationPanel = ({ notifications, alerts, onMarkRead, onClose }: NotificationPanelProps) => (
  <div className="absolute right-0 mt-4 w-[22rem] notification-panel rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] max-h-[500px] overflow-hidden flex flex-col border border-white/50">
    <div className="p-5 border-b border-gray-100/50 flex justify-between items-center bg-white/40">
      <div className="flex items-center gap-2">
        <Bell size={16} className="text-primary" />
        <span className="font-black text-xs uppercase tracking-[0.2em] text-slate-800">Activity Center</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
          {notifications.filter(n => !n.is_read).length + alerts.length} New
        </span>
        <button className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase" onClick={onClose}>Close</button>
      </div>
    </div>

    <div className="overflow-y-auto flex-1 custom-scrollbar">
      {alerts.length === 0 && notifications.length === 0 && (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
             <Bell size={24} />
          </div>
          <p className="m-0 text-slate-400 italic text-[11px] font-bold uppercase tracking-wider">No new activities</p>
        </div>
      )}

      {alerts.map(alert => (
        <div key={`alert-${alert.id}`} className="notification-item alert p-5 border-b border-gray-100/50 bg-red-50/20 group">
          <div className="flex gap-4">
            <div className="mt-1 w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 shadow-sm border border-red-500/10">
              <Activity size={18} />
            </div>
            <div className="flex-1">
              <p className="m-0 font-black text-xs text-red-600 uppercase tracking-tight mb-1">{alert.title}</p>
              <p className="m-0 text-xs text-slate-600 leading-relaxed font-medium">{alert.message}</p>
              <div className="mt-3 flex items-center gap-2">
                 <span className="text-[9px] font-black text-red-400 uppercase bg-red-50 px-2 py-0.5 rounded">High Severity</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {notifications.map(notif => (
        <div
          key={`notif-${notif.id}`}
          className={`notification-item p-5 border-b border-gray-100/50 group cursor-pointer ${notif.is_read ? 'opacity-60' : 'unread bg-blue-50/10'}`}
          onClick={() => !notif.is_read && onMarkRead(notif.id)}
        >
          <div className="flex gap-4">
            <div className={`mt-1 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${notif.is_read ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-primary/10 text-primary border-primary/10'}`}>
              <Bell size={18} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <p className={`m-0 font-black text-xs uppercase tracking-tight ${notif.is_read ? 'text-slate-500' : 'text-slate-800'}`}>{notif.title}</p>
                <p className="m-0 text-[9px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap ml-2">
                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <p className="m-0 text-xs text-slate-600 leading-relaxed font-medium">{notif.message}</p>
              {!notif.is_read && (
                <div className="mt-3 flex items-center gap-2">
                   <span className="text-[9px] font-black text-primary group-hover:underline uppercase tracking-tighter">Mark as seen</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
    
    <div className="p-4 bg-slate-50/50 border-t border-gray-100/50 text-center">
        <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all">View All Activity History</button>
    </div>
  </div>
)

// ---------------------------------------------------------------------------
// DashboardLayout
// ---------------------------------------------------------------------------

const DashboardLayout = () => {
  const { user } = useSelector((state: any) => state.auth)
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { info }  = useToast()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [alerts,  setAlerts]  = useState<Alert[]>([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  // Stable callbacks — won't cause unnecessary re-renders in child components
  const handleLogout = useCallback(() => {
    dispatch(logout())
    navigate('/login')
  }, [dispatch, navigate])

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), [])

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifsRes, alertsRes] = await Promise.all([
        communicationAPI.notifications.getUnread(),
        communicationAPI.alerts.getActive(),
      ])
      setNotifications(notifsRes.data?.results ?? notifsRes.data ?? [])
      setAlerts(alertsRes.data?.results ?? alertsRes.data ?? [])
    } catch {
      // Notifications are non-critical; silently ignore failures
    }
  }, [])

  const markAsRead = useCallback(async (id: number) => {
    try {
      await communicationAPI.notifications.update(id, { is_read: true })
      fetchNotifications()
    } catch {
      // Non-critical; user can retry by closing and reopening the panel
    }
  }, [fetchNotifications])

  // Defer background tasks by 2 s to prioritise initial page render
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>

    const timer = setTimeout(async () => {
      fetchNotifications()

      // Show toasts for events due today (max 3)
      try {
        const today = new Date().toISOString().split('T')[0]
        const res = await academicsAPI.events.getAll({ start_date: today })
        const due = res.data?.results ?? res.data ?? []
        due.slice(0, 3).forEach((e: any) => info(`📅 Today: ${e.title}`, { duration: 8000 }))
      } catch {
        // Non-critical
      }

      intervalId = setInterval(fetchNotifications, 5 * 60 * 1000)
    }, 2000)

    return () => {
      clearTimeout(timer)
      clearInterval(intervalId)
    }
  }, [fetchNotifications, info])

  const unreadCount = notifications.filter(n => !n.is_read).length + alerts.length

  return (
    <div className="dashboard-layout page-wrapper">
      {/* Mobile overlay — closes sidebar on backdrop tap */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="main-content">
        {/* ── Top Bar ── */}
        <header className="top-bar">
          <div className="flex items-center gap-4">
            <button className="mobile-toggle p-2 text-primary" onClick={toggleSidebar} aria-label="Toggle sidebar">
              <Menu size={24} />
            </button>

            <div className="school-logo hidden md:block">
              <h2 className="text-lg font-bold m-0 flex items-center gap-2">
                <span className="truncate max-w-[100px] inline-block">{user?.first_name || user?.username || 'User'}</span>
                <span className="text-xs font-normal text-gray-500 truncate max-w-[60px]">({user?.role || 'Guest'})</span>
              </h2>
            </div>
            {/* Premium Quick Search Button */}
            <div className="flex items-center">
              <button
                type="button"
                className="icon-btn group relative"
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                aria-label="Quick Search"
              >
                <Search size={20} className="group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>

          <div className="actions">
            {/* Notification Bell */}
            <div className="relative">
              <button className="icon-btn" onClick={() => setIsNotifOpen(prev => !prev)} aria-label="Notifications">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <NotificationPanel
                  notifications={notifications}
                  alerts={alerts}
                  onMarkRead={markAsRead}
                  onClose={() => setIsNotifOpen(false)}
                />
              )}
            </div>

            <button onClick={handleLogout} className="logout-btn shrink-0">
              <LogOut size={18} />
              <span className="logout-text">Logout</span>
            </button>
          </div>
        </header>

        {/* ── Page Content ── */}
        <div className="content-area">
          <div className="container">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </div>
      </main>

      <CommandPalette />
    </div>
  )
}

export default DashboardLayout
