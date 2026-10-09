import React, { useState } from 'react';
import {
  Bell,
  ShieldAlert,
  Calendar,
  CreditCard,
  UserCheck,
  GraduationCap,
  Sparkles,
  Clock,
  Building,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Shield,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { AppNotification } from '../../types/notification';
import { useTranslation } from '../../context/LanguageContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface NotificationDetailModalProps {
  notification: AppNotification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  onNavigateAction?: (tab: string, notification: AppNotification) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAsUnread,
  onDeleteNotification,
  onNavigateAction,
}) => {
  const { language } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!notification) return null;

  const getTypeIcon = () => {
    switch (notification.type) {
      case 'SECURITY':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'FINANCE':
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      case 'ATTENDANCE':
        return <UserCheck className="w-5 h-5 text-amber-500" />;
      case 'TIMETABLE':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'AI':
        return <Sparkles className="w-5 h-5 text-indigo-500" />;
      case 'STUDENT':
      case 'TEACHER':
        return <GraduationCap className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getSeverityBadgeVariant = () => {
    switch (notification.severity) {
      case 'CRITICAL':
      case 'ERROR':
        return 'danger';
      case 'WARNING':
        return 'warning';
      case 'SUCCESS':
        return 'success';
      default:
        return 'primary';
    }
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const title = language === 'ar' ? notification.titleAr : notification.titleEn;
      const body = language === 'ar' ? notification.messageAr : notification.messageEn;
      const utterance = new SpeechSynthesisUtterance(`${title}. ${body}`);
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const handleDelete = () => {
    if (onDeleteNotification) {
      if (isSpeaking && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      onDeleteNotification(notification.id);
      onClose();
    }
  };

  const title = language === 'ar' ? notification.titleAr : notification.titleEn;
  const message = language === 'ar' ? notification.messageAr : notification.messageEn;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (isSpeaking && typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        onClose();
      }}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
            {getTypeIcon()}
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 block">
              {language === 'ar' ? 'قراءة تفاصيل الإشعار' : 'Read Notification Details'}
            </span>
            <span className="text-xs text-slate-400 font-normal">
              {new Date(notification.createdAt).toLocaleDateString(
                language === 'ar' ? 'ar-SA' : 'en-US',
                { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
              )}
            </span>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSpeak}
              leftIcon={isSpeaking ? <VolumeX className="w-4 h-4 text-amber-500" /> : <Volume2 className="w-4 h-4 text-indigo-500" />}
            >
              {isSpeaking
                ? (language === 'ar' ? 'إيقاف القراءة' : 'Stop Reading')
                : (language === 'ar' ? 'استماع صوتي' : 'Listen')}
            </Button>

            {!notification.isRead ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                leftIcon={<CheckCircle2 className="w-4 h-4 text-blue-500" />}
              >
                {language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}
              </Button>
            ) : (
              onMarkAsUnread && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkAsUnread(notification.id)}
                  leftIcon={<RotateCcw className="w-4 h-4 text-slate-500" />}
                >
                  {language === 'ar' ? 'تحديد كغير مقروء' : 'Mark as unread'}
                </Button>
              )
            )}

            {onDeleteNotification && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                leftIcon={<Trash2 className="w-4 h-4 text-rose-500" />}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                {language === 'ar' ? 'حذف الإشعار' : 'Delete'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {notification.actionTab && onNavigateAction && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onNavigateAction(notification.actionTab!, notification);
                }}
                rightIcon={<ExternalLink className="w-4 h-4" />}
              >
                {language === 'ar'
                  ? notification.actionLabelAr || 'الانتقال إلى الإجراء'
                  : notification.actionLabelEn || 'Open related screen'}
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={onClose}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Title and Badges */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant={getSeverityBadgeVariant()} size="sm">
                {notification.severity}
              </Badge>
              <Badge variant={notification.priority === 'CRITICAL' || notification.priority === 'HIGH' ? 'danger' : 'neutral'} size="sm">
                {notification.priority}
              </Badge>
            </div>
          </div>

          {/* Reading body */}
          <div className="mt-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 whitespace-pre-wrap">
            {message}
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block">{language === 'ar' ? 'وقت الإرسال' : 'Sent at'}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {new Date(notification.createdAt).toLocaleTimeString(
                  language === 'ar' ? 'ar-SA' : 'en-US',
                  { hour: '2-digit', minute: '2-digit', second: '2-digit' }
                )}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2.5">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block">{language === 'ar' ? 'نطاق الفرع' : 'Branch Scope'}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {notification.branchId === 'all'
                  ? (language === 'ar' ? 'كافة الفروع المدرسية' : 'All Branches')
                  : notification.branchId}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block">{language === 'ar' ? 'نوع التصنيف' : 'Notification Type'}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {notification.type}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block">{language === 'ar' ? 'حالة القراءة' : 'Read State'}</span>
              <span className={`font-semibold ${notification.isRead ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {notification.isRead
                  ? (language === 'ar' ? 'مقروء' : 'Read')
                  : (language === 'ar' ? 'غير مقروء (جديد)' : 'Unread (New)')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
