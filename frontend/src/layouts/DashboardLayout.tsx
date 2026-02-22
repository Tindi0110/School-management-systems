import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice'
import Sidebar from '../components/Sidebar'
import { LogOut, Bell, Menu } from 'lucide-react'
import { useToast } from '../context/ToastContext'

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

      <style>{`
        .dashboard-layout {
          display: flex;
          height: 100vh;
          height: 100dvh;
          width: 100%;
          max-width: 100vw;
          background: var(--bg-secondary);
          position: relative;
          overflow: hidden;
        }
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          width: 100%; 
          min-width: 0;
          max-width: 100%;
        }
        .top-bar {
          background: var(--bg-primary);
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: var(--shadow-sm);
          height: 72px; /* Taller for premium feel */
          min-height: 72px;
          border-bottom: 1px solid var(--border);
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 80;
        }
        .sidebar-wrapper {
          width: 280px; /* Slightly wider */
          height: 100dvh;
          transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1);
          z-index: 100;
          box-shadow: var(--shadow-xl);
        }
        
        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
        }

        .logout-text {
          display: inline;
        }

        /* Desktop */
        @media (min-width: 768px) {
          .sidebar-wrapper {
            position: relative;
            transform: none !important;
            box-shadow: none;
          }
          .main-content {
            max-width: calc(100% - 280px);
          }
        }

        /* Mobile */
        @media (max-width: 767px) {
          .mobile-toggle {
            display: block;
          }
          .logout-text {
            display: none;
          }
          .top-bar {
            padding: 0.5rem 1rem;
          }
          .sidebar-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            transform: translateX(-105%);
          }
          .sidebar-wrapper.open {
            transform: translateX(0);
          }
          .sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.4);
            z-index: 90;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease-in-out, visibility 0.3s;
          }
          .sidebar-overlay.open {
            opacity: 1;
            visibility: visible;
          }
        }

        .actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .icon-btn {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          cursor: pointer;
          color: var(--text-secondary);
          padding: 10px;
          border-radius: 12px;
          transition: all 0.2s;
          position: relative;
        }
        .icon-btn:hover {
          background: var(--bg-primary);
          border-color: var(--primary-accent);
          color: var(--primary-accent);
          box-shadow: var(--shadow-sm);
        }
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--error-light);
          border: 1px solid transparent;
          padding: 0.6rem 1rem;
          border-radius: 10px;
          cursor: pointer;
          color: var(--error);
          transition: all 0.2s;
          font-size: 0.875rem;
        }
        .logout-btn:hover {
          background: var(--error);
          color: white;
        }
        .content-area {
          flex: 1;
          padding: var(--spacing-xl) var(--spacing-lg);
          overflow-y: auto;
          overflow-x: hidden;
          width: 100%;
          min-width: 0;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 767px) {
          .content-area {
            padding: 1rem 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default DashboardLayout
