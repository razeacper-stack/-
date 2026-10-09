import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export interface SearchBarProps {
  placeholder?: string;
  onSearch?: (term: string) => void;
  onClick?: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  onSearch,
  onClick,
  className = '',
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) onSearch(val);
  };

  const handleClear = () => {
    setSearchTerm('');
    if (onSearch) onSearch('');
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute start-3 pointer-events-none" />
      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        onClick={onClick}
        placeholder={placeholder || t('common.search')}
        className={`
          w-full h-10 ps-9 pe-9
          bg-slate-100/80 dark:bg-slate-800/80
          border border-transparent hover:border-slate-300 dark:hover:border-slate-700
          focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900
          text-slate-800 dark:text-slate-100
          text-xs sm:text-sm rounded-xl
          transition-all duration-150
          placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-blue-500/20
        `}
      />
      {searchTerm ? (
        <button
          onClick={handleClear}
          className="absolute end-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="absolute end-2.5 hidden sm:flex items-center gap-0.5 pointer-events-none">
          <kbd className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 shadow-2xs">
            ⌘K
          </kbd>
        </div>
      )}
    </div>
  );
};
