import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useSessionTimeout = (timeoutMs: number = DEFAULT_TIMEOUT) => {
    const navigate = useNavigate();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const logout = () => {

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        // Force a reload to clear any sensitive state in memory if needed
        window.location.reload();
    };

    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(logout, timeoutMs);
    };

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Initial timer setup
        resetTimer();

        // Add event listeners for student interaction
        const handleActivity = () => resetTimer();

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [timeoutMs]);

    return null;
};
