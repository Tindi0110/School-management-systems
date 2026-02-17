import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, Eye, EyeOff, School } from 'lucide-react';
import { authAPI } from '../api/api';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
    const { uid, token } = useParams();
    const { success, error: errorToast } = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            errorToast("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await authAPI.resetPasswordConfirm(uid!, token!, { password });
            success("Password reset successful!");
            setDone(true);
        } catch (err: any) {
            errorToast(err.message || "Failed to reset password. Link may be expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-bg-gradient-1" style={{ background: '#1e40af' }}></div>
            <div className="auth-bg-gradient-2" style={{ background: '#3b82f6' }}></div>

            <div className="auth-header-section">
                <h1 className="auth-title">Create New Password</h1>
                <p className="auth-subtitle">Almost there! Set a new strong password to secure your account and return to your dashboard.</p>
            </div>

            <div className="auth-card">
                {!done ? (
                    <>
                        <div className="text-center mb-6">
                            <div style={{
                                width: '64px', height: '64px', background: '#f5f3ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#7c3aed'
                            }}>
                                <School size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>New Password</h2>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure your institutional access</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="auth-input-group">
                                <label className="auth-label">New Password</label>
                                <div className="auth-input-wrapper">
                                    <Lock size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="auth-input"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label className="auth-label">Confirm Password</label>
                                <div className="auth-input-wrapper">
                                    <Lock size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="auth-input"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="auth-button">
                                {loading ? 'Updating...' : 'Reset Password'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ width: '80px', height: '80px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <CheckCircle size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Password Updated</h3>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>Your password has been changed successfully. You can now use your new password to log in.</p>
                        <Link to="/login" className="auth-button" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none' }}>
                            Go to Login
                        </Link>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.6 }}>Secure Institutional Portal v2.0</p>
            </div>
        </div>
    );
};

export default ResetPassword;
