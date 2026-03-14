import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice'
import Sidebar from '../components/Sidebar'
import { LogOut, Bell, Menu, Search } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import CommandPalette from '../components/CommandPalette'

const DashboardLayout = () => {
  const { user } = useSelector((state: any) => state.auth) // Get user from Redux
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const fetchNotifications = async () => {
    try {
      const { communicationAPI } = await import('../api/api');
      const [notifsRes, alertsRes] = await Promise.all([
        communicationAPI.notifications.getUnread(),
        communicationAPI.alerts.getActive()
      ]);
      setNotifications(notifsRes.data?.results || notifsRes.data || []);
      setAlerts(alertsRes.data?.results || alertsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const { communicationAPI } = await import('../api/api');
      await communicationAPI.notifications.update(id, { is_read: true });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  // System Notifications for Due Events
  const { info } = useToast();
  useEffect(() => {
    const checkDueEvents = async () => {
      try {
        const { academicsAPI } = await import('../api/api');
        const today = new Date().toISOString().split('T')[0];
        const res = await academicsAPI.events.getAll({ start_date: today });
        const dueToday = res.data?.results || res.data || [];

        if (dueToday.length > 0) {
          dueToday.slice(0, 3).forEach((e: any) => {
            info(`📅 Event Due Today: ${e.title}`, { duration: 8000 });
          });
        }
      } catch (error) {
        console.error("Failed to check calendar events", error);
      }
    };

    let intervalId: any;
    const timer = setTimeout(() => {
      checkDueEvents(); // Run checkDueEvents immediately after delay
      fetchNotifications(); // Initial fetch
      intervalId = setInterval(fetchNotifications, 5 * 60 * 1000); // Check every 5 mins
    }, 2000); // Delay background tasks by 2s to prioritize page load

    return () => {
      clearTimeout(timer);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="dashboard-layout page-wrapper">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="main-content">
        <header className="top-bar">
          <div className="flex items-center gap-4">
            <button className="mobile-toggle p-2 text-primary" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <div className="school-logo hidden md:block">
              <h2 className="text-lg font-bold m-0">
                {user?.username || 'User'} <span className="text-xs font-normal text-gray-500">({user?.role || 'Guest'})</span>
              </h2>
            </div>
            
            {/* Elite Quick Search Trigger Info */}
            <div className="hidden lg:flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl text-gray-400 cursor-pointer hover:bg-white hover:border-primary-accent transition-all group" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>
              <Search size={14} className="group-hover:text-primary-accent transition-colors" />
              <span className="text-[11px] font-bold">Quick Search</span>
              <div className="flex items-center gap-0.5 ml-2">
                <span className="bg-white border px-1 rounded text-[9px] font-black">Ctrl</span>
                <span className="bg-white border px-1 rounded text-[9px] font-black">K</span>
              </div>
            </div>
          </div>
          <div className="actions">
            <div className="relative">
              <button className="icon-btn" onClick={() => setIsNotifOpen(!isNotifOpen)}>
                <Bell size={20} />
                {(notifications.filter(n => !n.is_read).length + alerts.length) > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-white">
                    {notifications.filter(n => !n.is_read).length + alerts.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] max-h-[400px] overflow-hidden flex flex-col">
                  <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                    <span className="font-black text-xs uppercase tracking-wider text-gray-500">Notifications</span>
                    <button className="text-[10px] font-bold text-primary hover:underline" onClick={() => setIsNotifOpen(false)}>Close</button>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {alerts.length === 0 && notifications.length === 0 && (
                      <div className="p-8 text-center text-gray-400 italic text-xs">No active alerts</div>
                    )}

                    {alerts.map(alert => (
                      <div key={`alert-${alert.id}`} className={`p-3 border-b bg-red-50`}>
                        <div className="flex gap-2">
                          <div className="mt-1 w-2 h-2 rounded-full bg-red-500"></div>
                          <div>
                            <p className="m-0 font-bold text-xs text-red-900 uppercase tracking-tight">{alert.title}</p>
                            <p className="m-0 text-xs text-red-700 leading-tight mt-1">{alert.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {notifications.map(notif => (
                      <div key={`notif-${notif.id}`} className={`p-3 border-b hover:bg-gray-50 transition-colors cursor-pointer ${notif.is_read ? 'opacity-60' : 'bg-blue-50/30'}`} onClick={() => !notif.is_read && markAsRead(notif.id)}>
                        <div className="flex gap-2">
                          {!notif.is_read && <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500"></div>}
                          <div className={notif.is_read ? 'pl-4' : ''}>
                            <p className="m-0 font-bold text-xs text-gray-800 tracking-tight">{notif.title}</p>
                            <p className="m-0 text-xs text-gray-600 leading-tight mt-1">{notif.message}</p>
                            <p className="m-0 text-[9px] text-gray-400 mt-1 uppercase font-bold">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={18} />
              <span className="logout-text">Logout</span>
            </button>
          </div>
        </header>
        <div className="content-area">
          <div className="container">
            <Outlet />
          </div>
        </div>
      </main>
        <CommandPalette />
    </div>
  )
}

export default DashboardLayout
