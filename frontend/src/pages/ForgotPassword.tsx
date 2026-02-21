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
        <div className="auth-page">
            <div className="auth-gradient-bg auth-gradient-1"></div>
            <div className="auth-gradient-bg auth-gradient-2"></div>

            <div className="auth-card">
                <div className="auth-header">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                            <School size={32} />
                        </div>
                    </div>
                    <h2>Account Recovery</h2>
                    <p>Reset your access credentials</p>
                </div>

                <div className="auth-content pt-0">
                    <div className="mb-6">
                        <Link to="/login" className="flex items-center text-[10px] font-black text-secondary uppercase hover:text-primary transition-colors">
                            <ArrowLeft size={14} className="mr-1" /> Back to Login
                        </Link>
                    </div>

                    {!sent ? (
                        <>
                            {error && (
                                <div className="badge badge-error w-full py-3 mb-6 flex items-center justify-center gap-2 rounded-lg font-black uppercase text-[10px]">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="auth-input-group">
                                    <label className="label uppercase text-[10px] font-black mb-1">Email Address</label>
                                    <div className="auth-input-wrapper">
                                        <Mail size={18} className="auth-input-icon" />
                                        <input
                                            type="email"
                                            className="input auth-input-field"
                                            placeholder="Enter registered email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 h-auto font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                                    {loading ? 'Processing...' : <><span className="mr-2">Send Recovery Link</span> <Send size={18} /></>}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-primary mb-2">Check your Email</h3>
                            <p className="text-sm text-secondary mb-6">
                                We have sent a recovery link to<br />
                                <strong className="text-primary">{email}</strong>
                            </p>
                            <button
                                onClick={() => setSent(false)}
                                className="text-[10px] font-black text-primary uppercase hover:underline"
                            >
                                Try another email
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute bottom-8 text-center w-full z-10 pointer-events-none">
                <p className="text-[10px] text-secondary font-bold uppercase tracking-[0.2em] opacity-40">Secure Institutional Portal v2.0</p>
            </div>
        </div>
    );
};


export default ForgotPassword;
