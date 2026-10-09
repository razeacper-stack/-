import React, { useState } from 'react';
import {
  FileBarChart2,
  Users,
  UserCheck,
  School,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Building2,
  Search,
  ArrowRight,
  ArrowLeft,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { ReportCategory, ReportDefinition } from '../../types/reports';
import { reportStorage } from '../../services/reportStorage';
import { Badge } from '../common/Badge';

export interface ReportCatalogProps {
  onSelectReport: (report: ReportDefinition) => void;
}

export const ReportCatalog: React.FC<ReportCatalogProps> = ({ onSelectReport }) => {
  const { currentUser, isSuperAdmin, hasPermission } = useAuth();
  const { language, direction } = useTranslation();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const allReports = reportStorage.getReportDefinitions();

  const categories: { id: ReportCategory | 'all'; labelAr: string; labelEn: string; icon: any }[] = [
    { id: 'all', labelAr: 'كافة التقارير', labelEn: 'All Reports', icon: FileBarChart2 },
    { id: 'students', labelAr: 'شؤون الطلاب', labelEn: 'Students', icon: Users },
    { id: 'teachers', labelAr: 'الكادر التعليمي', labelEn: 'Faculty', icon: UserCheck },
    { id: 'academic', labelAr: 'الهيكل الأكاديمي', labelEn: 'Academic', icon: School },
    { id: 'timetable', labelAr: 'الجداول المدرسية', labelEn: 'Timetable', icon: CalendarDays },
    { id: 'attendance', labelAr: 'الحضور والغياب', labelEn: 'Attendance', icon: ClipboardCheck },
    { id: 'finance', labelAr: 'المالية والرسوم', labelEn: 'Finance', icon: CreditCard },
    { id: 'branches', labelAr: 'الفروع المدرسية', labelEn: 'Campuses', icon: Building2 },
  ];

  const getCategoryIcon = (cat: ReportCategory) => {
    switch (cat) {
      case 'students': return Users;
      case 'teachers': return UserCheck;
      case 'academic': return School;
      case 'timetable': return CalendarDays;
      case 'attendance': return ClipboardCheck;
      case 'finance': return CreditCard;
      case 'branches': return Building2;
      default: return FileBarChart2;
    }
  };

  const isReportAccessible = (report: ReportDefinition): boolean => {
    if (isSuperAdmin) return true;
    if (report.category === 'finance') {
      return (
        hasPermission('finance.view_reports') ||
        hasPermission('fees.view')
      );
    }
    return hasPermission(report.requiredPermission);
  };

  const filteredReports = allReports.filter((rep) => {
    if (selectedCategory !== 'all' && rep.category !== selectedCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        rep.titleAr.toLowerCase().includes(q) ||
        rep.titleEn.toLowerCase().includes(q) ||
        rep.descriptionAr.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-blue-700 via-indigo-700 to-purple-800 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'مركز التقارير والتصدير والطباعة' : 'Reports & Export Center'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {language === 'ar' ? 'كتالوج التقارير الرسمية المعتمدة' : 'Official School Reports Catalog'}
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-2xl">
              {language === 'ar'
                ? 'استعرض أكثر من 30 تقريراً رسمياً شاملاً للطلاب، الكادر التعليمي، الجداول، الحضور، الإيرادات والرسوم المالية، مع دعم التصدير المباشر إلى Excel و CSV والطباعة وحفظ PDF.'
                : 'Access 30+ official reports covering students, faculty, schedules, attendance, and finance with export to CSV/Excel and print/PDF support.'}
            </p>
          </div>

          <div className="shrink-0 text-start sm:text-end">
            <span className="text-3xl font-extrabold font-mono">{allReports.length}</span>
            <div className="text-xs text-blue-200">{language === 'ar' ? 'تقريراً معتمداً' : 'Verified Reports'}</div>
          </div>
        </div>

        {/* Search within reports */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute start-4 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'ابحث باسم التقرير (مثال: دليل الطلاب، النصاب، المتأخرات، الحضور)...'
                : 'Search reports by title or keyword...'
            }
            className="w-full h-12 ps-12 pe-4 bg-white text-slate-900 rounded-2xl text-sm font-semibold placeholder:text-slate-400 focus:outline-hidden focus:ring-4 focus:ring-blue-300"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => {
          const Icon = c.icon;
          const isSelected = selectedCategory === c.id;
          const count =
            c.id === 'all'
              ? allReports.length
              : allReports.filter((r) => r.category === c.id).length;

          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{language === 'ar' ? c.labelAr : c.labelEn}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => {
          const isAccessible = isReportAccessible(report);
          const CatIcon = getCategoryIcon(report.category);

          return (
            <div
              key={report.id}
              onClick={() => isAccessible && onSelectReport(report)}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isAccessible
                  ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer group'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-70 cursor-not-allowed'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isAccessible
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <CatIcon className="w-5 h-5" />
                  </div>

                  {isAccessible ? (
                    <Badge variant="primary" size="sm">
                      {report.columns.length} {language === 'ar' ? 'أعمدة' : 'cols'}
                    </Badge>
                  ) : (
                    <Badge variant="danger" size="sm">
                      <Lock className="w-3 h-3 ml-1" />
                      {language === 'ar' ? 'مقيد بالصلاحيات' : 'Locked'}
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {language === 'ar' ? report.titleAr : report.titleEn}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {language === 'ar' ? report.descriptionAr : report.descriptionEn}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono text-[11px] text-slate-400">
                  {report.requiredPermission}
                </span>

                {isAccessible ? (
                  <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                    <span>{language === 'ar' ? 'عرض التقرير' : 'Generate'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-[11px] text-red-500 font-medium">
                    {language === 'ar' ? 'غير مصرح' : 'Unauthorized'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
