import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Users,
  UserCheck,
  School,
  BookOpen,
  CalendarDays,
  CreditCard,
  Building2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CornerDownLeft,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useTranslation } from '../../context/LanguageContext';
import { searchStorage } from '../../services/searchStorage';
import { SearchDomain, SearchResultItem } from '../../types/search';
import { Badge } from '../common/Badge';

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { currentUser } = useAuth();
  const { activeBranchId } = useBranch();
  const { language, direction } = useTranslation();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const [query, setQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<SearchDomain>('all');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedDomain('all');
    }
  }, [isOpen]);

  const searchResponse = useMemo(() => {
    if (!currentUser || !query.trim()) {
      return { results: [], totalCount: 0, executionTimeMs: 0 };
    }
    return searchStorage.searchAuthorized(currentUser, query, {
      domain: selectedDomain,
      branchId: activeBranchId || 'all',
    });
  }, [currentUser, query, selectedDomain, activeBranchId]);

  const getDomainIcon = (d: SearchDomain) => {
    switch (d) {
      case 'students': return Users;
      case 'teachers': return UserCheck;
      case 'classes': return School;
      case 'subjects': return BookOpen;
      case 'timetable': return CalendarDays;
      case 'invoices': return CreditCard;
      case 'payments': return CreditCard;
      case 'branches': return Building2;
      default: return Sparkles;
    }
  };

  const handleSelectResult = (item: SearchResultItem) => {
    onClose();
    onNavigateTab(item.targetTab);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 absolute start-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'بحث سريع في النظام (طالب، معلم، فصل، فاتورة)...'
                : 'Quick search (student, teacher, class, invoice)...'
            }
            className="w-full h-12 ps-11 pe-10 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute end-3 top-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {query.trim().length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <div>{language === 'ar' ? 'اكتب كلمة البحث للبدء' : 'Type to start searching'}</div>
              <div className="text-[11px] text-slate-400">
                {language === 'ar' ? 'بحث آمن ومقيد بصلاحيات حسابك وفرعك' : 'Search is strictly scoped to your branch permissions'}
              </div>
            </div>
          ) : searchResponse.results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {language === 'ar' ? 'لم يتم العثور على أية نتائج مطابقة' : 'No matching results found'}
            </div>
          ) : (
            searchResponse.results.slice(0, 15).map((item) => {
              const ItemIcon = getDomainIcon(item.domain);

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectResult(item)}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-700 dark:group-hover:text-blue-300 flex items-center justify-center shrink-0">
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge variant={item.badge.variant || 'neutral'} size="sm" className="text-[10px] py-0 px-1">
                            {item.badge.text}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 text-slate-400 group-hover:text-blue-600">
                    <span className="text-[10px] hidden sm:inline text-slate-400">
                      {language === 'ar' ? 'انتقال' : 'Open'}
                    </span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CornerDownLeft className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'اضغط للانتقال إلى السجل' : 'Press to navigate'}</span>
          </div>
          <button
            onClick={() => {
              onClose();
              onNavigateTab('search');
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
          >
            {language === 'ar' ? 'فتح مركز البحث المتقدم ←' : 'Open Full Search Center →'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
