import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../store/authSlice'
import Sidebar from '../components/Sidebar'
import { LogOut, Bell, Menu, X } from 'lucide-react'

const DashboardLayout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

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
            <button className="md:hidden p-2 text-gray-600" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <div className="search-bar">
              {/* Placeholder for search */}
            </div>
          </div>
          <div className="actions">
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
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
          width: 250px;
          height: 100vh;
          background: #1e3c72;
          transition: transform 0.3s ease-in-out;
          z-index: 50;
        }
        
        /* Desktop */
        @media (min-width: 768px) {
          .sidebar-wrapper {
            position: relative;
            transform: none !important;
          }
          .md\\:hidden { display: none; }
          .hidden.md\\:inline { display: inline; }
        }

        /* Mobile */
        @media (max-width: 767px) {
          .sidebar-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            transform: translateX(-100%);
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
            background: rgba(0,0,0,0.5);
            z-index: 40;
            display: none;
          }
          .sidebar-overlay.open {
            display: block;
          }
        }

        .actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
        }
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: 1px solid #ddd;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          color: #d32f2f;
        }
        .logout-btn:hover {
          background: #ffebee;
        }
        .content-area {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }
      `}</style>
    </div>
  )
}

export default DashboardLayout
