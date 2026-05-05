import { X } from 'lucide-react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    placeholder = 'Search...',
    className = 'w-64',
    disabled = false
}) => {
    return (
        <div className={`relative group ${className}`}>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`
                    w-full px-4 py-2.5 text-sm
                    bg-white border-0 rounded-[10px]
                    focus:ring-0 focus:outline-none 
                    transition-all duration-200 font-medium
                    placeholder:text-slate-400 text-slate-700
                    hover:bg-slate-50
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
                `}
            />

            {value && !disabled && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-300 hover:text-error hover:bg-error/5 transition-all outline-none"
                    aria-label="Clear search"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
};

export default SearchInput;
