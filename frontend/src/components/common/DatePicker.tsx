import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

/**
 * PremiumDateInput - A professional, mobile-first date selector.
 * Replaces native scrolling wheels with a high-performance grid interface.
 */
interface DatePickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
    placeholder?: string;
    description?: string;
    disabled?: boolean;
    minDate?: string; // e.g. '2023-01-01'
}

const PremiumDateInput: React.FC<DatePickerProps> = ({
    value,
    onChange,
    label,
    required,
    placeholder = 'Select Date',
    description,
    disabled,
    minDate
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'days' | 'months' | 'years'>('days');
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    const months = useMemo(() => [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ], []);

    const years = useMemo(() => {
        const arr: number[] = [];
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 100; i <= currentYear + 10; i++) {
            arr.push(i);
        }
        return arr.reverse();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day: number) => {
        const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onChange(formatDate(selected));
        setIsOpen(false);
    };

    const handleToday = () => {
        const today = new Date();
        setViewDate(today);
        handleDayClick(today.getDate());
    };

    const handleClear = () => {
        onChange('');
        setIsOpen(false);
    };

    const renderedDays = useMemo(() => {
        const items = [];
        const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
        const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

        for (let i = 0; i < firstDay; i++) {
            items.push(<div key={`empty-${i}`} className="p-2"></div>);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = formatDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
            const isSelected = value === dateStr;
            const isToday = formatDate(new Date()) === dateStr;

            const isPastMinDate = minDate && dateStr < minDate;

            items.push(
                <button
                    key={d}
                    type="button"
                    onClick={() => !isPastMinDate && handleDayClick(d)}
                    disabled={!!isPastMinDate}
                    className={`p-2 rounded-xl text-xs font-black transition-all transform active:scale-95 ${isSelected
                        ? 'bg-primary text-white shadow-lg scale-105'
                        : isToday
                            ? 'bg-primary/5 text-primary border border-primary/20'
                            : isPastMinDate
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    {d}
                </button>
            );
        }
        return items;
    }, [viewDate, value, minDate]);

    return (
        <div className={`form-group relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
            {label && (
                <label className="label text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                    {label} {required && <span className="text-error ml-1">*</span>}
                </label>
            )}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`input flex items-center justify-between cursor-pointer transition-all border-2 ${isOpen ? 'border-primary ring-4 ring-primary/5 bg-white' : 'border-slate-100 hover:border-slate-300 bg-slate-50/50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <CalendarIcon size={16} className={value ? 'text-primary' : 'text-slate-400'} />
                    <span className={`text-sm font-bold ${value ? 'text-slate-800' : 'text-slate-400'}`}>
                        {value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : placeholder}
                    </span>
                </div>
                {!required && value && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleClear(); }}
                        className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <RotateCcw size={12} className="text-slate-400" />
                    </button>
                )}
            </div>

            {description && <p className="mt-1.5 text-[10px] text-slate-400 font-medium italic">{description}</p>}

            {isOpen && (
                <div className="absolute z-[100] mt-3 w-80 bg-white rounded-[32px] shadow-2xl border border-slate-100 p-5 animate-in fade-in zoom-in slide-in-from-top-2 duration-200 origin-top-left">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                onClick={() => setView('months')}
                                className="text-[11px] font-black uppercase text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-colors"
                            >
                                {months[viewDate.getMonth()]}
                            </button>
                            <button
                                type="button"
                                onClick={() => setView('years')}
                                className="text-[11px] font-black uppercase text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-colors"
                            >
                                {viewDate.getFullYear()}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
                            <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    {view === 'days' && (
                        <>
                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                                    <div key={d} className="text-center text-[9px] font-black text-slate-300 py-1">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {renderedDays}
                            </div>
                        </>
                    )}

                    {view === 'months' && (
                        <div className="grid grid-cols-3 gap-3 py-2">
                            {months.map((m, i) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                        setViewDate(new Date(viewDate.getFullYear(), i, 1));
                                        setView('days');
                                    }}
                                    className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${viewDate.getMonth() === i ? 'bg-primary text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'
                                        }`}
                                >
                                    {m.substring(0, 3)}
                                </button>
                            ))}
                        </div>
                    )}

                    {view === 'years' && (
                        <div className="h-64 overflow-y-auto grid grid-cols-3 gap-2 pr-2 custom-scrollbar py-2">
                            {years.map(y => (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => {
                                        setViewDate(new Date(y, viewDate.getMonth(), 1));
                                        setView('days');
                                    }}
                                    className={`py-3 rounded-2xl text-[11px] font-black transition-all ${viewDate.getFullYear() === y ? 'bg-primary text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'
                                        }`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 pt-5 border-t border-slate-50 flex justify-between items-center px-1">
                        <button
                            type="button"
                            onClick={handleToday}
                            className="text-[10px] font-black uppercase text-primary hover:opacity-70 transition-opacity"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PremiumDateInput;
