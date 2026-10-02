import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  Clock,
  User,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { AuditRecord } from '../../types/auth';
import { authStorage } from '../../services/authStorage';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const AuditLogsViewer: React.FC = () => {
  const { language } = useTranslation();
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = () => {
    const list = authStorage.getAuditLogs();
    setLogs(list);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter === 'ALL') return true;
    return log.action === actionFilter;
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('CREATED') || action.includes('ENABLED')) return 'success';
    if (action.includes('DISABLED') || action.includes('DENIED') || action.includes('UNAUTHORIZED')) return 'danger';
    if (action.includes('PASSWORD')) return 'warning';
    return 'primary';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {language === 'ar' ? 'سجل العمليات والأمان (Audit Trail)' : 'Security & Audit Ledger'}
            </h2>
            <Badge variant="primary" size="sm">
              Phase 2 Immutable
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'سجل غير قابل للتعديل يوثق جميع عمليات الدخول، إنشاء الحسابات، تغيير كلمات المرور، وتعديل الصلاحيات'
              : 'Tamper-evident audit trail recording logins, account provisioning, credential resets, and RBAC events'}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={fetchLogs}
        >
          {language === 'ar' ? 'تحديث السجل' : 'Refresh Logs'}
        </Button>
      </div>

      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <span>{language === 'ar' ? 'العمليات المسجلة' : 'Recorded Event Logs'}</span>
            <div className="flex items-center gap-2">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">{language === 'ar' ? 'جميع العمليات' : 'All Actions'}</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="USER_CREATED">USER_CREATED</option>
                <option value="USER_UPDATED">USER_UPDATED</option>
                <option value="USER_DISABLED">USER_DISABLED</option>
                <option value="PASSWORD_RESET">PASSWORD_RESET</option>
                <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
                <option value="ROLE_MODIFIED">ROLE_MODIFIED</option>
              </select>
            </div>
          </div>
        }
      >
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
            {language === 'ar' ? 'لا توجد سجلات مطابقة للفلتر المحدد.' : 'No audit records match your criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="pb-3 text-start">{language === 'ar' ? 'الحدث' : 'Action'}</th>
                  <th className="pb-3 text-start">{language === 'ar' ? 'المنفذ (Actor)' : 'Actor'}</th>
                  <th className="pb-3 text-start">{language === 'ar' ? 'النتيجة' : 'Result'}</th>
                  <th className="pb-3 text-start">{language === 'ar' ? 'التفاصيل' : 'Details'}</th>
                  <th className="pb-3 text-end">{language === 'ar' ? 'التوقيت' : 'Timestamp'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 pe-4">
                      <Badge variant={getActionBadgeVariant(log.action) as any} size="sm">
                        {log.action}
                      </Badge>
                    </td>

                    <td className="py-3 pe-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {log.actorName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.actorRole}</div>
                    </td>

                    <td className="py-3 pe-4">
                      {log.result === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>SUCCESS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>DENIED</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 pe-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {log.details}
                    </td>

                    <td className="py-3 text-end font-mono text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
