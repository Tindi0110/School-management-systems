import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle, School } from 'lucide-react';
import { authAPI } from '../api/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authAPI.resetPassword(email);
            setSent(true);
        } catch (err) {
            console.error(err);
            setTimeout(() => {
                setSent(true);
            }, 1000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            {/* Background Effects */}
            <div className="auth-bg-gradient-1" style={{ background: '#2563eb' }}></div>
            <div className="auth-bg-gradient-2" style={{ background: '#0891b2' }}></div>

            {/* Header Text Section */}
            <div className="auth-header-section">
                <h1 className="auth-title">
                    Account Recovery
                </h1>
                <p className="auth-subtitle" style={{ color: '#cbd5e1' }}>
                    Don't worry, we've got you covered. Follow the simple steps to regain access to your dashboard.
                </p>
            </div>

            <div className="auth-card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <Link to="/login" style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textDecoration: 'none' }}>
                        <ArrowLeft size={14} style={{ marginRight: '0.25rem' }} /> Back to Login
                    </Link>
                </div>

                {!sent ? (
                    <>
                        <div className="text-center mb-6">
                            <div style={{
                                width: '64px', height: '64px', background: '#eff6ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#2563eb'
                            }}>
                                <School size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', lineHeight: 1 }}>Recovery</h2>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>Reset your access credentials</p>
                        </div>

                        {error && (
                            <div style={{ padding: '1rem', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: 700 }}>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="auth-input-group">
                                <label className="auth-label">Email Address</label>
                                <div className="auth-input-wrapper">
                                    <Mail size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
                                    <input
                                        type="email"
                                        className="auth-input"
                                        placeholder="Enter your registered email"
                                        value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="auth-button" style={{ background: '#1e293b' }}>
                                {loading ? 'Sending...' : <><span style={{ marginRight: '0.5rem' }}>Send Recovery Link</span> <Send size={16} /></>}
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ width: '80px', height: '80px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <CheckCircle size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Check your Email</h3>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>We have sent a password recovery link to<br /><strong style={{ color: '#1e293b' }}>{email}</strong>.</p>
                        <button onClick={() => setSent(false)} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Try another email</button>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.6 }}>Secure Institutional Portal v2.0</p>
            </div>
        </div>
    );
};

export default ForgotPassword;
