import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Option {
    id: string | number;
    label: string;
    subLabel?: string;
    [key: string]: any;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    onSearch?: (searchTerm: string) => void; // Optional callback for async backend searching
    initialOptions?: Option[]; // Fallback options for data visibility when 'value' isn't in 'options' yet
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Search...',
    label,
    required = false,
    disabled = false,
    className = '',
    onSearch,
    initialOptions = []
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);

    // Combine provided options with initial options to ensure the selected value always has a label
    const combinedOptions = [...options];
    initialOptions.forEach(initOpt => {
        if (!combinedOptions.find(opt => opt.id.toString() === initOpt.id.toString())) {
            combinedOptions.push(initOpt);
        }
    });

    const selectedOption = combinedOptions.find(opt => opt.id.toString() === value?.toString());

    // Debounce search term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setActiveIndex(-1);
            if (onSearch) {
                onSearch(searchTerm);
            }
        }, 400); // 400ms debounce for API calls
        return () => clearTimeout(handler);
    }, [searchTerm, onSearch]);

    // Handle clicks outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = combinedOptions.filter(opt =>
        // If onSearch is provided, we assume the backend handles filtering, so we show all options currently in array.
        // Otherwise, we do local filtering.
        onSearch ? true : opt.label.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            opt.subLabel?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
                    handleSelect(filteredOptions[activeIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                break;
        }
    };

    // Auto-scroll logic
    useEffect(() => {
        if (activeIndex >= 0 && optionsRef.current) {
            const activeItem = optionsRef.current.children[activeIndex] as HTMLElement;
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [activeIndex]);

    const handleSelect = (opt: Option) => {
        onChange(opt.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
        if (isOpen) setIsOpen(false);
    };

    const handleTriggerClick = () => {
        if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
        }
    };

    return (
        <div
            className={`flex flex-col gap-1.5 w-full mb-4 ${className}`}
            ref={wrapperRef}
            onKeyDown={handleKeyDown}
        >
            {label && (
                <label className="text-[11px] font-normal text-slate-500 uppercase tracking-wider ml-1">
                    {label} {required && <span className="text-error font-normal">*</span>}
                </label>
            )}

            <div className="relative group">
                <div
                    className={`
                        flex items-center px-4 py-3 min-h-[52px]
                        bg-slate-300 border border-slate-500 rounded-[8px] cursor-text transition-all duration-200
                        ${isOpen ? 'bg-white shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.1)] border-primary/20' : 'hover:bg-slate-400 hover:border-slate-600'}
                        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                    `}
                    onClick={handleTriggerClick}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        autoComplete="off"
                        className="bg-transparent border-0 p-0 text-sm focus:ring-0 outline-none text-slate-900 placeholder:text-slate-700 font-black w-full"
                        placeholder={selectedOption ? selectedOption.label : placeholder}
                        value={isOpen ? searchTerm : (selectedOption ? selectedOption.label : '')}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (!isOpen) setIsOpen(true);
                        }}
                    />

                    {value && !disabled && (
                        <button
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 p-1 shadow-none outline-none text-slate-700 hover:text-error transition-colors flex items-center justify-center cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {isOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full z-[100] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-[12px] border border-slate-300 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                        <div
                            ref={optionsRef}
                            className="max-h-[300px] overflow-y-auto overscroll-contain py-1"
                        >
                            {filteredOptions.length === 0 ? (
                                <div className="px-4 py-10 text-center text-slate-400 font-normal italic text-sm">
                                    No results found matching "{searchTerm}"
                                </div>
                            ) : (
                                filteredOptions.map((opt, index) => (
                                    <div
                                        key={opt.id}
                                        className={`
                                            px-4 py-3 cursor-pointer transition-all duration-200 flex flex-col gap-0.5 mx-1
                                            ${index === activeIndex ? 'bg-slate-300 rounded-md scale-[0.99]' : 'hover:bg-slate-100 hover:rounded-md hover:scale-[0.99]'}
                                            ${value?.toString() === opt.id.toString() ? 'bg-slate-600 text-white border-l-4 border-primary rounded-r-md' : 'border-l-4 border-transparent'}
                                        `}
                                        onClick={() => handleSelect(opt)}
                                        onMouseEnter={() => setActiveIndex(index)}
                                    >
                                        <div className={`text-sm font-normal ${value?.toString() === opt.id.toString() ? 'text-primary' : 'text-slate-700'}`}>
                                            {opt.label}
                                        </div>
                                        {opt.subLabel && (
                                            <div className="text-[10px] uppercase font-normal text-slate-400 tracking-tight">
                                                {opt.subLabel}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchableSelect;
