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
import { LogOut, Bell, Menu, Search } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import CommandPalette from '../components/CommandPalette'
import PageTransition from '../components/common/PageTransition'

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
  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] max-h-[400px] overflow-hidden flex flex-col">
    <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
      <span className="font-black text-xs uppercase tracking-wider text-gray-500">Notifications</span>
      <button className="text-[10px] font-bold text-primary hover:underline" onClick={onClose}>Close</button>
    </div>

    <div className="overflow-y-auto flex-1">
      {alerts.length === 0 && notifications.length === 0 && (
        <div className="p-8 text-center text-gray-400 italic text-xs">No active notifications</div>
      )}

      {alerts.map(alert => (
        <div key={`alert-${alert.id}`} className="p-3 border-b bg-red-50">
          <div className="flex gap-2">
            <div className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            <div>
              <p className="m-0 font-bold text-xs text-red-900 uppercase tracking-tight">{alert.title}</p>
              <p className="m-0 text-xs text-red-700 leading-tight mt-1">{alert.message}</p>
            </div>
          </div>
        </div>
      ))}

      {notifications.map(notif => (
        <div
          key={`notif-${notif.id}`}
          className={`p-3 border-b hover:bg-gray-50 transition-colors cursor-pointer ${notif.is_read ? 'opacity-60' : 'bg-blue-50/30'}`}
          onClick={() => !notif.is_read && onMarkRead(notif.id)}
        >
          <div className="flex gap-2">
            {!notif.is_read && <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
            <div className={notif.is_read ? 'pl-4' : ''}>
              <p className="m-0 font-bold text-xs text-gray-800 tracking-tight">{notif.title}</p>
              <p className="m-0 text-xs text-gray-600 leading-tight mt-1">{notif.message}</p>
              <p className="m-0 text-[9px] text-gray-400 mt-1 uppercase font-bold">
                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      ))}
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
      const { communicationAPI } = await import('../api/api')
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
      const { communicationAPI } = await import('../api/api')
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
        const { academicsAPI } = await import('../api/api')
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
              <h2 className="text-lg font-bold m-0">
                {user?.first_name || user?.username || 'User'}
                <span className="text-xs font-normal text-gray-500 ml-2">({user?.role || 'Guest'})</span>
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

            <button onClick={handleLogout} className="logout-btn">
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
