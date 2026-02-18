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

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  // System Notifications for Due Events
  const { info } = useToast();
  useEffect(() => {
    const checkDueEvents = async () => {
      try {
        const { academicsAPI } = await import('../api/api');
        const res = await academicsAPI.events.getAll();
        const events = res.data?.results || res.data || [];
        const today = new Date().toISOString().split('T')[0];

        const dueToday = events.filter((e: any) => e.start_date === today);

        if (dueToday.length > 0) {
          dueToday.forEach((e: any) => {
            info(`📅 Event Due Today: ${e.title}`, { duration: 8000 });
          });
        }
      } catch (error) {
        console.error("Failed to check calendar events", error);
      }
    };
    checkDueEvents();
  }, []);

  return (
    <div className="dashboard-layout">
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
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={18} />
              <span className="logout-text">Logout</span>
            </button>
          </div>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>

      <style>{`
        .dashboard-layout {
          display: flex;
          height: 100vh;
          background: #f4f6f9;
          position: relative;
        }
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          width: 100%; 
        }
        .top-bar {
          background: white;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          height: 64px;
        }
        .sidebar-wrapper {
          width: 260px;
          height: 100vh;
          background: #1e3c72;
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          z-index: 100; /* Ensure it's above everything */
          box-shadow: 4px 0 15px rgba(0,0,0,0.1);
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
            backdrop-filter: blur(4px);
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
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 8px;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .icon-btn:hover {
          background: #f0f0f0;
        }
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: 1px solid #ffcdd2;
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          color: #d32f2f;
          transition: all 0.2s;
          font-size: 0.85rem;
        }
        .logout-btn:hover {
          background: #ffebee;
          border-color: #ef9a9a;
        }
        .content-area {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  )
}

export default DashboardLayout
