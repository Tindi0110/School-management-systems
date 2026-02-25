import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
    placeholder?: string;
    description?: string;
    disabled?: boolean;
    minDate?: string;
}

const PremiumDateInput: React.FC<DatePickerProps> = ({
    value,
    onChange,
    label,
    required,
    disabled,
    minDate,
    description
}) => {
    return (
        <div className={`form-group w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {label && (
                <label className="label text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                    {label} {required && <span className="text-error ml-1">*</span>}
                </label>
            )}

            <div className="relative group flex items-center">
                <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary hover:text-primary transition-colors cursor-pointer z-20 p-1 -ml-1"
                    onClick={(e) => {
                        const hiddenDateInput = e.currentTarget.parentElement?.querySelector('input[type="date"]') as HTMLInputElement;
                        if (hiddenDateInput && 'showPicker' in hiddenDateInput) {
                            try { hiddenDateInput.showPicker(); } catch (err) { }
                        }
                    }}
                    title="Open calendar"
                >
                    <CalendarIcon size={14} />
                </div>
                {/* Visible input for direct typing */}
                <input
                    type="text"
                    placeholder="YYYY-MM-DD"
                    inputMode="numeric"
                    className="input w-full pl-10 pr-4 h-11 bg-slate-50 border-2 border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold text-sm text-slate-800 rounded-lg placeholder:text-slate-400"
                    value={value || ''}
                    onChange={(e) => {
                        let val = e.target.value;
                        // Basic auto-hyphenation for YYYY-MM-DD
                        if (val.length === 4 && !val.includes('-')) val += '-';
                        if (val.length === 7 && val.split('-').length === 2) val += '-';
                        onChange(val);
                    }}
                    required={required}
                    disabled={disabled}
                    title="Format: YYYY-MM-DD"
                />
                {/* Hidden native date input for the calendar popup */}
                <input
                    type="date"
                    className="absolute w-0 h-0 opacity-0 pointer-events-none"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    min={minDate}
                    disabled={disabled}
                />
            </div>
            {description && <p className="mt-1.5 text-[9px] text-slate-400 font-medium italic">{description}</p>}
        </div>
    );
};

export default PremiumDateInput;
