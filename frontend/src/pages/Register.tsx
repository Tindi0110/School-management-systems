import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock as LockIcon, Shield, ArrowRight, School } from 'lucide-react';
import { authAPI } from '../api/api';
import { useToast } from '../context/ToastContext';
import SearchableSelect from '../components/SearchableSelect';

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
                const errorData = err.response?.data;
                let errorMessage = "Registration failed. Please try again.";

                if (errorData) {
                    if (typeof errorData === 'string') {
                        errorMessage = errorData;
                    } else if (typeof errorData === 'object') {
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
        <div className="auth-page">
            <div className="auth-gradient-bg auth-gradient-1"></div>
            <div className="auth-gradient-bg auth-gradient-2"></div>

            <div className="auth-card">

                <div className="auth-header">
                    <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                            <School size={28} />
                        </div>
                    </div>
                    <h2>Create Account</h2>
                    <p>Join the Institution</p>
                </div>

                <div className="auth-content">
                    {error && (
                        <div className="badge badge-error w-full py-3 mb-6 flex items-center justify-center gap-2 rounded-lg font-black uppercase text-[10px]">
                            <Shield size={14} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 form-container-md mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="auth-input-group">
                                <label className="label uppercase text-[10px] font-black mb-1">Full Name</label>
                                <div className="auth-input-wrapper">
                                    <User size={18} className="auth-input-icon" />
                                    <input type="text" className="input auth-input-field"
                                        placeholder="John Doe"
                                        value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label className="label uppercase text-[10px] font-black mb-1">Username / ID</label>
                                <div className="auth-input-wrapper">
                                    <User size={18} className="auth-input-icon" />
                                    <input type="text" className="input auth-input-field"
                                        placeholder="e.g. jdoe01"
                                        autoComplete="off"
                                        value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                                </div>
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label className="label uppercase text-[10px] font-black mb-1">Email Address</label>
                            <div className="auth-input-wrapper">
                                <Mail size={18} className="auth-input-icon" />
                                <input type="email" className="input auth-input-field"
                                    placeholder="name@school.com"
                                    autoComplete="email"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label className="label uppercase text-[10px] font-black mb-1">Institutional Role</label>
                            <div className="auth-input-wrapper">
                                <Shield size={18} className="auth-input-icon" />
                                <SearchableSelect
                                    placeholder="Select Role..."
                                    options={[
                                        { id: 'TEACHER', label: 'Academic Staff' },
                                        { id: 'ACCOUNTANT', label: 'Bursar / Accountant' },
                                        { id: 'DOS', label: 'Director of Studies' },
                                        { id: 'REGISTRAR', label: 'Registrar' },
                                        { id: 'WARDEN', label: 'Hostel Warden' },
                                        { id: 'DRIVER', label: 'Institutional Driver' },
                                        { id: 'NURSE', label: 'School Nurse' },
                                        { id: 'LIBRARIAN', label: 'Librarian' },
                                        { id: 'ADMIN', label: 'Administrator' }
                                    ]}
                                    value={formData.role}
                                    onChange={(val) => setFormData({ ...formData, role: val.toString() })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="auth-input-group">
                                <label className="label uppercase text-[10px] font-black mb-1">Password</label>
                                <div className="auth-input-wrapper">
                                    <LockIcon size={18} className="auth-input-icon" />
                                    <input type="password" className="input auth-input-field"
                                        placeholder="••••••"
                                        autoComplete="new-password"
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                            </div>
                            <div className="auth-input-group">
                                <label className="label uppercase text-[10px] font-black mb-1">Confirm</label>
                                <div className="auth-input-wrapper">
                                    <LockIcon size={18} className="auth-input-icon" />
                                    <input type="password" className="input auth-input-field"
                                        placeholder="••••••"
                                        autoComplete="new-password"
                                        value={formData.confirm_password} onChange={e => setFormData({ ...formData, confirm_password: e.target.value })} required />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 h-auto font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 mt-4">
                            {loading ? 'Processing...' : <><span className="mr-2">Register Account</span> <ArrowRight size={18} /></>}
                        </button>
                    </form>
                </div>

                <div className="auth-footer text-xs font-bold text-secondary">
                    Already have an account? <Link to="/login" className="text-primary hover:underline ml-1">Sign In</Link>
                </div>
            </div>

            <div className="absolute bottom-8 text-center w-full z-10 pointer-events-none">
                <p className="text-[10px] text-secondary font-bold uppercase tracking-[0.2em] opacity-40">Secure Institutional Portal v2.0</p>
            </div>
        </div>
    );
};

export default Register;
