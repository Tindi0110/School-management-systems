import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock as LockIcon, Shield, ArrowRight, School, CheckCircle } from 'lucide-react';
import { authAPI } from '../api/api';
import { useToast } from '../context/ToastContext';

const Register = () => {
    const navigate = useNavigate();
    const { success } = useToast();
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        role: 'TEACHER' // Default role
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            await authAPI.register(formData);
            success("Registration Request Sent! Please contact admin for approval.", { duration: 5000 });
            setTimeout(() => {
                navigate('/login');
                setLoading(false);
            }, 1500);

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 404) {
                success("Registration Request Sent! (Simulation)", { duration: 5000 });
                setTimeout(() => {
                    navigate('/login');
                    setLoading(false);
                }, 1500);
            } else {
                // Try to extract specific error messages from backend
                const errorData = err.response?.data;
                let errorMessage = "Registration failed. Please try again.";

                if (errorData) {
                    if (typeof errorData === 'string') {
                        errorMessage = errorData;
                    } else if (typeof errorData === 'object') {
                        // Extract first error message found (common Django Rest Framework format)
                        const keys = Object.keys(errorData);
                        if (keys.length > 0) {
                            const firstError = errorData[keys[0]];
                            if (Array.isArray(firstError)) {
                                errorMessage = `${keys[0]}: ${firstError[0]}`;
                            } else {
                                errorMessage = `${keys[0]}: ${firstError}`;
                            }
                        }
                    }
                }

                setError(errorMessage);
                setLoading(false);
            }
        }
    };

    return (
        <div className="auth-page-container">
            {/* Background Effects */}
            <div className="auth-bg-gradient-1" style={{ background: '#4338ca' }}></div> {/* Indigo */}
            <div className="auth-bg-gradient-2" style={{ background: '#7e22ce' }}></div> {/* Purple */}

            {/* Header Text Section */}
            <div className="auth-header-section">
                <h1 className="auth-title" style={{ fontSize: '2rem' }}>
                    Join Our Community
                </h1>
                <p className="auth-subtitle" style={{ color: '#e0e7ff', marginBottom: '1.5rem' }}>
                    Create an account to access the school management portal. Streamline communication, track progress, and stay organized.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
                    {['Secure Access', 'Real-time Tracking', 'Financial Tools'].map((text, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(49, 46, 129, 0.5)', padding: '0.375rem 0.75rem',
                            borderRadius: '9999px', border: '1px solid rgba(99, 102, 241, 0.3)',
                            fontSize: '0.875rem', fontWeight: 600, color: '#a5b4fc'
                        }}>
                            <CheckCircle size={16} color="#4ade80" />
                            <span>{text}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="auth-card">
                <div className="text-center mb-6">
                    <div style={{
                        width: '56px', height: '56px', background: '#eef2ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#4f46e5'
                    }}>
                        <School size={28} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', lineHeight: 1 }}>Create Account</h2>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>Join the Institution</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '0 0.5rem 0.5rem 0', display: 'flex', alignItems: 'center', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700
                    }}>
                        <span style={{ marginRight: '0.5rem' }}>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="auth-input-group" style={{ marginBottom: 0 }}>
                        <label className="auth-label">Full Name</label>
                        <div className="auth-input-wrapper">
                            <User size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
                            <input type="text" className="auth-input"
                                placeholder="John Doe"
                                value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
                        </div>
                    </div>

                    <div className="auth-input-group" style={{ marginBottom: 0 }}>
                        <label className="auth-label">Username / Staff ID</label>
                        <div className="auth-input-wrapper">
                            <User size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
                            <input type="text" className="auth-input"
                                placeholder="e.g. jdoe or STAFF-001"
                                autoComplete="off"
                                value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                        </div>
                    </div>

                    <div className="auth-input-group" style={{ marginBottom: 0 }}>
                        <label className="auth-label">Email Address</label>
                        <div className="auth-input-wrapper">
                            <Mail size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
                            <input type="email" className="auth-input"
                                placeholder="name@school.com"
                                autoComplete="email"
                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                        </div>
                    </div>

                    <div className="auth-input-group" style={{ marginBottom: 0 }}>
                        <label className="auth-label">Role</label>
                        <div className="auth-input-wrapper">
                            <Shield size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
                            <select className="auth-input" style={{ cursor: 'pointer' }}
                                value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="TEACHER">Academic Staff (Teacher)</option>
                                <option value="ACCOUNTANT">Bursar / Accountant</option>
                                <option value="DOS">Director of Studies</option>
                                <option value="REGISTRAR">Admissions Registrar</option>
                                <option value="WARDEN">Hostel / Transport Warden</option>
                                <option value="DRIVER">Institutional Driver (Logistics)</option>
                                <option value="NURSE">School Nurse</option>
                                <option value="LIBRARIAN">Librarian</option>
                                <option value="ADMIN">System Administrator</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="auth-input-group" style={{ marginBottom: 0 }}>
                            <label className="auth-label">Password</label>
                            <div className="auth-input-wrapper">
                                <LockIcon size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
                                <input type="password" className="auth-input"
                                    placeholder="••••••"
                                    autoComplete="new-password"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                            </div>
                        </div>
                        <div className="auth-input-group" style={{ marginBottom: 0 }}>
                            <label className="auth-label">Confirm</label>
                            <div className="auth-input-wrapper">
                                <LockIcon size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
                                <input type="password" className="auth-input"
                                    placeholder="••••••"
                                    autoComplete="new-password"
                                    value={formData.confirm_password} onChange={e => setFormData({ ...formData, confirm_password: e.target.value })} required />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="auth-button" style={{ background: '#312e81' }}>
                        {loading ? 'Processing...' : <><span style={{ marginRight: '0.5rem' }}>Register Account</span> <ArrowRight size={16} /></>}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account? <Link to="/login" className="auth-link" style={{ color: '#4f46e5' }}>Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
