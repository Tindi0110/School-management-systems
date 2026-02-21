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
                    <div className="search-container mb-2">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            className="input search-input"
                            placeholder="Type to search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <div className="options-list">
                        {filteredOptions.length === 0 ? (
                            <div className="p-2 text-center text-secondary">No results found</div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.id}
                                    className={`select-option ${value?.toString() === opt.id.toString() ? 'selected' : ''}`}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                >
                                    <div className="font-semibold text-sm">{opt.label}</div>
                                    {opt.subLabel && <div className="text-[10px] text-secondary">{opt.subLabel}</div>}
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
