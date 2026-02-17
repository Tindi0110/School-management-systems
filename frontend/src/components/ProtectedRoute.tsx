import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: string;
    requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredPermission, requiredRole }: ProtectedRouteProps) => {
    const { user, isAuthenticated } = useSelector((state: any) => state.auth);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && user?.role && user.role !== requiredRole && user.role !== 'ADMIN') {
         return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">
                        You do not have the required role ({requiredRole}) to access this page.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="btn btn-outline w-full"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (requiredPermission && user?.permissions) {
        // Fix: Backend now returns 'app.action', Frontend checks for 'action'
        // We check if any user permission ENDS with the required permission OR is an exact match
        const hasPermission = user.permissions.some((p: string) => p === requiredPermission || p.endsWith(`.${requiredPermission}`));

        if (!hasPermission && !user.permissions.includes('ALL')) {
            // User is logged in but lacks specific permission
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center p-4">
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
                        <p className="text-gray-600 mb-6">
                            You do not have permission to access the <strong>{requiredPermission.split('_')[1]}</strong> module.
                        </p>
                        <button
                            onClick={() => window.history.back()}
                            className="btn btn-outline w-full"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            );
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
