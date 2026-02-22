import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Button from './Button';

interface DatePickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
    minDate?: string;
    maxDate?: string;
}

const PremiumDateInput: React.FC<DatePickerProps> = ({ value, onChange, label, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'days' | 'months' | 'years'>('days');
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years: number[] = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 100; i <= currentYear + 20; i++) {
        years.push(i);
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day: number) => {
        const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onChange(formatDate(selected));
        setIsOpen(false);
    };

    const days = [];
    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const isSelected = value && formatDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d)) === value;
        days.push(
            <button
                key={d}
                type="button"
                onClick={() => handleDayClick(d)}
                className={`p-2 rounded-xl text-xs font-black transition-all hover:bg-primary/10 ${isSelected ? 'bg-primary text-white shadow-lg' : 'text-slate-700'}`}
            >
                {d}
            </button>
        );
    }

    return (
        <div className="form-group relative" ref={containerRef}>
            {label && <label className="label text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">{label} {required && '*'}</label>}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className="input flex items-center justify-between cursor-pointer hover:border-primary transition-colors bg-white shadow-sm"
            >
                <span className={`text-sm font-bold ${value ? 'text-slate-800' : 'text-slate-400'}`}>
                    {value ? new Date(value).toLocaleDateString() : 'Select Date'}
                </span>
                <CalendarIcon size={16} className="text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 animate-in fade-in zoom-in duration-200 origin-top-left">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => setView('months')}
                                className="text-xs font-black uppercase text-primary hover:bg-primary/5 px-2 py-1 rounded-lg"
                            >
                                {months[viewDate.getMonth()]}
                            </button>
                            <button
                                type="button"
                                onClick={() => setView('years')}
                                className="text-xs font-black uppercase text-primary hover:bg-primary/5 px-2 py-1 rounded-lg"
                            >
                                {viewDate.getFullYear()}
                            </button>
                        </div>
                        <div className="flex gap-1">
                            <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft size={18} /></button>
                            <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight size={18} /></button>
                        </div>
                    </div>

                    {view === 'days' && (
                        <div className="grid grid-cols-7 gap-1">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-slate-300 py-2">{d}</div>
                            ))}
                            {days}
                        </div>
                    )}

                    {view === 'months' && (
                        <div className="grid grid-cols-3 gap-2">
                            {months.map((m, i) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                        setViewDate(new Date(viewDate.getFullYear(), i, 1));
                                        setView('days');
                                    }}
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${viewDate.getMonth() === i ? 'bg-primary text-white shadow-lg' : 'hover:bg-primary/5 text-slate-600'}`}
                                >
                                    {m.substring(0, 3)}
                                </button>
                            ))}
                        </div>
                    )}

                    {view === 'years' && (
                        <div className="h-48 overflow-y-auto grid grid-cols-4 gap-2 pr-1 custom-scrollbar">
                            {years.reverse().map(y => (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => {
                                        setViewDate(new Date(y, viewDate.getMonth(), 1));
                                        setView('days');
                                    }}
                                    className={`py-2 rounded-xl text-[10px] font-black transition-all ${viewDate.getFullYear() === y ? 'bg-primary text-white shadow-lg' : 'hover:bg-primary/5 text-slate-600'}`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PremiumDateInput;
