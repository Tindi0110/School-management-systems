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
        <div className="auth-page">
            <div className="auth-gradient-bg auth-gradient-1"></div>
            <div className="auth-gradient-bg auth-gradient-2"></div>

            <div className="auth-card">
                {!done ? (
                    <>
                        <div className="auth-header">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                                    <School size={32} />
                                </div>
                            </div>
                            <h2>New Password</h2>
                            <p>Secure your institutional access</p>
                        </div>

                        <div className="auth-content">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="auth-input-group">
                                    <label className="label uppercase text-[10px] font-black mb-1">New Password</label>
                                    <div className="auth-input-wrapper">
                                        <Lock size={18} className="auth-input-icon" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="input auth-input-field"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="auth-input-group">
                                    <label className="label uppercase text-[10px] font-black mb-1">Confirm Password</label>
                                    <div className="auth-input-wrapper">
                                        <Lock size={18} className="auth-input-icon" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="input auth-input-field"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 h-auto font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                                    {loading ? 'Updating...' : 'Reset Password'}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="auth-content text-center py-8">
                        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={48} />
                        </div>
                        <h3 className="text-xl font-black text-primary uppercase mb-2">Password Updated</h3>
                        <p className="text-secondary font-bold text-sm mb-8 leading-relaxed px-4">Your password has been changed successfully. You can now use your new credentials to log in.</p>
                        <Link to="/login" className="btn btn-primary w-full py-3 h-auto font-black uppercase tracking-widest shadow-lg flex items-center justify-center">
                            Go to Login
                        </Link>
                    </div>
                )}
            </div>

            <div className="absolute bottom-8 text-center w-full z-10 pointer-events-none">
                <p className="text-[10px] text-secondary font-bold uppercase tracking-[0.2em] opacity-40">Secure Institutional Portal v2.0</p>
            </div>
        </div>
    );
};

export default ResetPassword;
