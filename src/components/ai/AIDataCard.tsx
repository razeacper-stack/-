import React from 'react';
import { AIDataCard as AIDataCardType } from '../../types/ai';
import { useTranslation } from '../../context/LanguageContext';
import { FileText, Table as TableIcon, Activity } from 'lucide-react';

export interface AIDataCardProps {
  card: AIDataCardType;
}

export const AIDataCard: React.FC<AIDataCardProps> = ({ card }) => {
  const { direction } = useTranslation();

  const colorStyles: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
      bg: 'bg-blue-50/80 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200/80 dark:border-blue-800/60',
    },
    emerald: {
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200/80 dark:border-emerald-800/60',
    },
    amber: {
      bg: 'bg-amber-50/80 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200/80 dark:border-amber-800/60',
    },
    rose: {
      bg: 'bg-rose-50/80 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200/80 dark:border-rose-800/60',
    },
    purple: {
      bg: 'bg-purple-50/80 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200/80 dark:border-purple-800/60',
    },
    slate: {
      bg: 'bg-slate-50/80 dark:bg-slate-800/50',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
    },
  };

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-sm backdrop-blur-md">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          {card.type === 'table' ? (
            <TableIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          )}
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {card.title}
          </span>
        </div>
        {card.subtitle && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {card.subtitle}
          </span>
        )}
      </div>

      {/* KPI Grid / Metrics View */}
      {(card.type === 'metric' || card.type === 'kpi_grid') && card.items && (
        <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {card.items.map((item, idx) => {
            const st = colorStyles[item.color || 'blue'] || colorStyles.blue;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border ${st.border} ${st.bg} flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/80 dark:bg-slate-900/80 text-emerald-600 dark:text-emerald-400">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className={`text-lg font-extrabold mt-1 tracking-tight ${st.text}`}>
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {card.type === 'table' && card.columns && card.rows && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                {card.columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3.5 py-2.5 font-semibold ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-end'
                        : 'text-start'
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {card.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={card.columns.length}
                    className="px-4 py-4 text-center text-slate-400 italic"
                  >
                    لا توجد بيانات مطابقة
                  </td>
                </tr>
              ) : (
                card.rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {card.columns!.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3.5 py-2.5 text-slate-700 dark:text-slate-300 font-medium ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-end'
                            : 'text-start'
                        }`}
                      >
                        {row[col.key] !== undefined && row[col.key] !== null
                          ? String(row[col.key])
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footnote */}
      {card.footnote && (
        <div className="px-4 py-2 bg-slate-50/40 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{card.footnote}</span>
        </div>
      )}
    </div>
  );
};
