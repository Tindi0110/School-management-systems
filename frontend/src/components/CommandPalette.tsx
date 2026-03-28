import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, User, Book, CreditCard, Home, Command, X, ArrowRight } from 'lucide-react';
import { studentsAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';

const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = useCallback(() => setIsOpen(o => !o), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const fetchResults = useCallback(async (search: string) => {
    if (search.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await studentsAPI.minimalSearch({ search });
      setResults(res.data || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) fetchResults(query);
      else setResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  const handleSelect = (item: any) => {
    if (item.type === 'nav') {
      navigate(item.path);
    } else {
      navigate(`/students/${item.id}`);
    }
    setIsOpen(false);
  };

  const quickLinks = [
    { id: 'ql-dashboard', full_name: 'Dashboard', type: 'nav', path: '/', icon: <Home size={16} /> },
    { id: 'ql-students', full_name: 'Student Registry', type: 'nav', path: '/students', icon: <User size={16} /> },
    { id: 'ql-finance', full_name: 'Finance Center', type: 'nav', path: '/finance', icon: <CreditCard size={16} /> },
    { id: 'ql-library', full_name: 'Library Resources', type: 'nav', path: '/library', icon: <Book size={16} /> },
  ];

  const displayedResults = query ? results : quickLinks;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(p => (p + 1) % displayedResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(p => (p - 1 + displayedResults.length) % displayedResults.length);
    } else if (e.key === 'Enter') {
      if (displayedResults[selectedIndex]) {
        handleSelect(displayedResults[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/20 flex items-start justify-center pt-[15vh]">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <div className="p-4 border-b flex items-center gap-3">
          <Search className="text-gray-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg text-gray-800 placeholder-gray-400"
            placeholder="Search students, pages, or files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md border border-gray-200">
            <Command size={10} className="text-gray-500" />
            <span className="text-[10px] font-bold text-gray-500">K</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-xs text-gray-400 mt-2">Searching the registry...</p>
            </div>
          )}

          {!loading && displayedResults.length === 0 && query && (
            <div className="p-12 text-center text-gray-400">
              <Search size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}

          {!loading && displayedResults.length > 0 && (
            <div className="space-y-1">
              <h3 className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {query ? 'Search Results' : 'Quick Navigation'}
              </h3>
              {displayedResults.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`
                    flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all
                    ${selectedIndex === idx ? 'bg-primary text-white shadow-lg scale-[1.01]' : 'hover:bg-gray-50 text-gray-700'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      p-2 rounded-lg 
                      ${selectedIndex === idx ? 'bg-white/20' : 'bg-gray-100'}
                    `}>
                      {item.icon || <User size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-none m-0">{item.full_name}</p>
                      <p className={`
                        text-[11px] mt-1 m-0
                        ${selectedIndex === idx ? 'text-white/70' : 'text-gray-400'}
                      `}>
                        {item.type === 'nav' ? 'Navigation' : `${item.admission_number || 'No ADM'} • ${item.class_name || 'General'}`}
                      </p>
                    </div>
                  </div>
                  {selectedIndex === idx && <ArrowRight size={16} className="animate-pulse" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 bg-gray-50 border-t flex justify-between items-center text-[10px] text-gray-400 font-medium">
          <div className="flex gap-4">
            <span className="flex items-center gap-1 capitalize">
              <span className="px-1.5 py-0.5 bg-white border rounded">Enter</span> to select
            </span>
            <span className="flex items-center gap-1 capitalize">
              <span className="px-1.5 py-0.5 bg-white border rounded">↑↓</span> to navigate
            </span>
          </div>
          <span className="uppercase tracking-widest font-bold text-primary opacity-60">Elite Search v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
