import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import './index.css'
import { ToastProvider } from './context/ToastContext'
import { ConfirmProvider } from './context/ConfirmContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'

// Eager load critical components
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import DashboardLayout from './layouts/DashboardLayout'

// Lazy load feature modules to prevent app-wide crash if one fails
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Students = React.lazy(() => import('./pages/Students'))
const StudentProfile = React.lazy(() => import('./pages/StudentProfile'))
const Finance = React.lazy(() => import('./pages/Finance'))
const Hostels = React.lazy(() => import('./pages/Hostels'))
const Library = React.lazy(() => import('./pages/Library'))
const Medical = React.lazy(() => import('./pages/Medical'))
const Transport = React.lazy(() => import('./pages/Transport'))
const Staff = React.lazy(() => import('./pages/Staff'))
const Parents = React.lazy(() => import('./pages/Parents'))
const Academics = React.lazy(() => import('./pages/Academics'))
const Timetable = React.lazy(() => import('./pages/Timetable'))

// Loading Fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Route Guard
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary name="Toast Notification System">
        <ToastProvider>
          <ConfirmProvider>
            <Router>
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary name="Main Routing System">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }>
                      {/* Dashboard - Accessible to everyone who is authenticated */}
                      <Route index element={
                        <ProtectedRoute><Dashboard /></ProtectedRoute>
                      } />

                      {/* Students Module */}
                      <Route path="students/*" element={
                        <ProtectedRoute requiredPermission="view_students">
                          <ErrorBoundary name="Student Module"><Students /></ErrorBoundary>
                        </ProtectedRoute>
                      } />
                      <Route path="students/:id" element={
                        <ProtectedRoute requiredPermission="view_students"><StudentProfile /></ProtectedRoute>
                      } />

                      {/* Parents Module */}
                      <Route path="parents" element={
                        <ProtectedRoute requiredPermission="view_parents"><Parents /></ProtectedRoute>
                      } />

                      {/* Academics Module */}
                      <Route path="academics" element={
                        <ProtectedRoute requiredPermission="view_academics"><Academics /></ProtectedRoute>
                      } />
                      <Route path="timetable" element={
                        <ProtectedRoute requiredPermission="view_academics"><Timetable /></ProtectedRoute>
                      } />

                      {/* Staff Module */}
                      <Route path="staff" element={
                        <ProtectedRoute requiredPermission="view_staff"><Staff /></ProtectedRoute>
                      } />

                      {/* Finance Module - High Security */}
                      <Route path="finance" element={
                        <ProtectedRoute requiredPermission="view_finance"><Finance /></ProtectedRoute>
                      } />

                      {/* Hostel Module */}
                      <Route path="hostels" element={
                        <ProtectedRoute requiredPermission="view_hostel"><Hostels /></ProtectedRoute>
                      } />

                      {/* Transport Module */}
                      <Route path="transport" element={
                        <ProtectedRoute requiredPermission="view_transport"><Transport /></ProtectedRoute>
                      } />

                      {/* Library Module */}
                      <Route path="library" element={
                        <ProtectedRoute requiredPermission="view_library"><Library /></ProtectedRoute>
                      } />

                      {/* Medical Module */}
                      <Route path="medical" element={
                        <ProtectedRoute requiredPermission="view_medical"><Medical /></ProtectedRoute>
                      } />
                    </Route>
                  </Routes>
                </ErrorBoundary>
              </Suspense>
            </Router>
          </ConfirmProvider>
        </ToastProvider>
      </ErrorBoundary>
    </Provider>
  )
}

export default App
