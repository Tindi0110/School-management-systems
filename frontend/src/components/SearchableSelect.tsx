import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

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
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Search...',
    label,
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id.toString() === value?.toString());

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.subLabel?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="form-group relative" ref={wrapperRef}>
            {label && <label className="label">{label} {required && '*'}</label>}
            <div
                className={`input min-h-[42px] flex items-center justify-between cursor-pointer ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? '' : 'text-light'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={18} className="text-secondary" />
            </div>

            {isOpen && (
                <div className="select-dropdown fade-in">
                    <div className="sticky top-0 bg-primary-light p-2 mb-2 rounded-t-lg z-10 border-b">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-50" />
                            <input
                                type="text"
                                className="input input-sm pl-9 rounded-full bg-white border-primary/20 focus:border-primary"
                                placeholder="Type to search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="options-list max-h-[250px] overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-secondary italic text-xs">No students matching "{searchTerm}"</div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.id}
                                    className={`select-option px-4 py-2 hover:bg-primary/5 cursor-pointer border-b border-secondary/5 last:border-0 ${value?.toString() === opt.id.toString() ? 'bg-primary/10' : ''}`}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                >
                                    <div className="font-bold text-sm text-primary">{opt.label}</div>
                                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest opacity-60">
                                        <span>{opt.subLabel}</span>
                                        <span className="text-secondary">{opt.id}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>

    );
};

export default SearchableSelect;
