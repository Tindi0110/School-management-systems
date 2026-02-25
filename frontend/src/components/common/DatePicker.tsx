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

            <div className="relative group">
                <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary hover:text-primary transition-colors cursor-pointer z-10 p-1 -ml-1"
                    onClick={(e) => {
                        const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                        if (input && 'showPicker' in input) {
                            try { input.showPicker(); } catch (err) { }
                        }
                    }}
                    title="Open calendar"
                >
                    <CalendarIcon size={14} />
                </div>
                <input
                    type="date"
                    className="input w-full pl-10 pr-4 h-11 bg-slate-50/50 border-2 border-slate-100 hover:border-slate-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold text-sm text-slate-800"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    min={minDate}
                    disabled={disabled}
                />
            </div>
            {description && <p className="mt-1.5 text-[9px] text-slate-400 font-medium italic">{description}</p>}
        </div>
    );
};

export default PremiumDateInput;
