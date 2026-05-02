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
import { LogOut, Bell, Menu, Search, X, CheckCheck, Check } from 'lucide-react'
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
  onMarkAllRead: () => void
  onClose: () => void
}

const NotificationPanel = ({ notifications, alerts, onMarkRead, onMarkAllRead, onClose }: NotificationPanelProps) => (
  <div className="absolute right-0 top-full mt-3 w-[350px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 z-[100] max-h-[500px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-300">
    <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Notifications</span>
        {notifications.filter(n => !n.is_read).length > 0 && (
          <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
            {notifications.filter(n => !n.is_read).length} New
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {notifications.some(n => !n.is_read) && (
          <button 
            className="text-[10px] font-bold text-primary hover:text-primary-accent flex items-center gap-1 transition-colors" 
            onClick={onMarkAllRead}
          >
            <CheckCheck size={12} />
            Mark all read
          </button>
        )}
        <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
    </div>

    <div className="overflow-y-auto flex-1 custom-scrollbar">
      {alerts.length === 0 && notifications.length === 0 && (
        <div className="py-12 px-6 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell size={20} className="text-gray-300" />
          </div>
          <p className="text-gray-400 italic text-xs font-medium">No active notifications</p>
        </div>
      )}

      {alerts.map(alert => (
        <div key={`alert-${alert.id}`} className="p-4 border-b bg-red-50/50 hover:bg-red-50 transition-colors group relative">
          <div className="flex gap-3">
            <div className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="m-0 font-bold text-xs text-red-900 uppercase tracking-tight">{alert.title}</p>
              <p className="m-0 text-xs text-red-700 leading-relaxed mt-1">{alert.message}</p>
            </div>
          </div>
        </div>
      ))}

      {notifications.map(notif => (
        <div
          key={`notif-${notif.id}`}
          className={`p-4 border-b hover:bg-gray-50 transition-all group relative ${notif.is_read ? 'bg-white' : 'bg-blue-50/30'}`}
        >
          <div className="flex gap-3">
            {!notif.is_read ? (
              <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            ) : (
              <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />
            )}
            <div className="flex-1 pr-6">
              <p className={`m-0 text-xs tracking-tight ${notif.is_read ? 'text-gray-500 font-medium' : 'text-gray-900 font-bold'}`}>
                {notif.title}
              </p>
              <p className={`m-0 text-xs leading-relaxed mt-1 ${notif.is_read ? 'text-gray-400' : 'text-gray-600'}`}>
                {notif.message}
              </p>
              <p className="m-0 text-[9px] text-gray-400 mt-2 uppercase font-black tracking-widest flex items-center gap-2">
                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {!notif.is_read && <span className="w-1 h-1 bg-gray-300 rounded-full" />}
                {!notif.is_read && "New Notification"}
              </p>
            </div>
            {!notif.is_read && (
              <button 
                onClick={(e) => { e.stopPropagation(); onMarkRead(notif.id); }}
                className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded shadow-sm border border-gray-100 text-blue-600 hover:bg-blue-50"
                title="Mark as read"
              >
                <Check size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
    
    {notifications.length > 0 && (
      <div className="p-3 bg-gray-50 border-top text-center">
        <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
          View all history
        </button>
      </div>
    )}
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
      // Non-critical
    }
  }, [fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    try {
      await communicationAPI.notifications.markAllRead()
      fetchNotifications()
    } catch {
      // Non-critical
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
                  onMarkAllRead={markAllAsRead}
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
