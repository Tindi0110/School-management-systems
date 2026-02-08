import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../store/authSlice'
import Sidebar from '../components/Sidebar'
import { LogOut, Bell } from 'lucide-react'

const DashboardLayout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-bar">
          <div className="search-bar">
            {/* Placeholder for search */}
          </div>
          <div className="actions">
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={18} />
              <span>Logout</span>
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
        }
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .top-bar {
          background: white;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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
          padding: 2rem;
          overflow-y: auto;
        }
      `}</style>
    </div>
  )
}

export default DashboardLayout
