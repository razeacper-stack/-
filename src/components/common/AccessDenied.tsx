import React from 'react';
import { ShieldAlert, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { Card } from './Card';
import { Button } from './Button';

export interface AccessDeniedProps {
  requiredPermission?: string;
  onGoBack: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredPermission,
  onGoBack,
}) => {
  const { language, direction } = useTranslation();
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="text-center p-8 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {language === 'ar' ? 'غير مصرح لك بالوصول (403)' : 'Access Denied (403)'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {language === 'ar'
              ? 'حسابك الحالي لا يمتلك الصلاحيات الكافية للوصول إلى هذا القسم. يرجى مراجعة مسؤول النظام.'
              : 'Your current role credentials do not hold the required permissions to access this view.'}
          </p>
          {requiredPermission && (
            <div className="pt-2">
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Required: {requiredPermission}
              </span>
            </div>
          )}
        </div>

        <div className="pt-3">
          <Button variant="outline" size="sm" leftIcon={<Arrow className="w-4 h-4" />} onClick={onGoBack}>
            {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Return to Dashboard'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
