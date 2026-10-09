import React, { useState } from 'react';
import {
  Bell,
  ShieldAlert,
  Calendar,
  CreditCard,
  UserCheck,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  Check,
  Trash2,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react';
import { AppNotification } from '../../types/notification';
import { useTranslation } from '../../context/LanguageContext';
import { Badge } from '../common/Badge';

export interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  onNavigateAction?: (tab: string, notification: AppNotification) => void;
  onReadDetails?: (notification: AppNotification) => void;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDeleteNotification,
  onNavigateAction,
  onReadDetails,
  selectable = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const { language } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getTypeIcon = () => {
    switch (notification.type) {
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'FINANCE':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'ATTENDANCE':
        return <UserCheck className="w-4 h-4 text-amber-500" />;
      case 'TIMETABLE':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'AI':
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
      case 'STUDENT':
      case 'TEACHER':
        return <GraduationCap className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
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

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteNotification) return;
    setIsDeleting(true);
    setTimeout(() => {
      onDeleteNotification(notification.id);
    }, 150);
  };

  const handleCardClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (onReadDetails) {
      onReadDetails(notification);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer ${
        isDeleting ? 'opacity-0 scale-95 duration-150' : 'opacity-100 scale-100'
      } ${
        notification.isRead
          ? 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          : 'bg-blue-50/50 dark:bg-blue-950/25 border-blue-200/80 dark:border-blue-900/60 shadow-2xs hover:border-blue-300 dark:hover:border-blue-800'
      } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/80 dark:bg-blue-900/30' : ''}`}
    >
      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
        {/* Selection Checkbox */}
        {selectable && onToggleSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(notification.id);
            }}
            className="mt-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer shrink-0"
            title={isSelected ? (language === 'ar' ? 'إلغاء التحديد' : 'Deselect') : (language === 'ar' ? 'تحديد' : 'Select')}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Notification Icon */}
        <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 shrink-0 mt-0.5">
          {getTypeIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {language === 'ar' ? notification.titleAr : notification.titleEn}
            </h4>
            <Badge variant={getSeverityBadgeVariant()} size="sm">
              {notification.severity}
            </Badge>
            {!notification.isRead && (
              <span
                className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"
                title={language === 'ar' ? 'إشعار غير مقروء' : 'Unread notification'}
              />
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed break-words line-clamp-2 sm:line-clamp-none">
            {language === 'ar' ? notification.messageAr : notification.messageEn}
          </p>

          <div className="flex items-center gap-2.5 sm:gap-3 mt-2 text-[11px] text-slate-400 font-medium flex-wrap">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {new Date(notification.createdAt).toLocaleTimeString(
                  language === 'ar' ? 'ar-SA' : 'en-US',
                  { hour: '2-digit', minute: '2-digit' }
                )}
              </span>
            </div>
            {notification.branchId !== 'all' && (
              <span>• الفرع: {notification.branchId}</span>
            )}
            {notification.isRead ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{language === 'ar' ? 'تمت القراءة' : 'Read'}</span>
              </span>
            ) : (
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {language === 'ar' ? 'جديد وغير مقروء' : 'New unread'}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 ms-1 sm:ms-2">
          {/* Read Out Loud (Audio TTS) */}
          <button
            type="button"
            onClick={handleSpeak}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isSpeaking
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 animate-pulse'
                : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
            }`}
            title={
              isSpeaking
                ? (language === 'ar' ? 'إيقاف القراءة الصوتية' : 'Stop voice reading')
                : (language === 'ar' ? 'استماع للإشعار صوتياً' : 'Listen to notification')
            }
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Details Reader Modal trigger */}
          {onReadDetails && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
              title={language === 'ar' ? 'قراءة تفاصيل الإشعار' : 'Read notification details'}
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          {/* Mark as Read / Unread */}
          {!notification.isRead ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
              title={language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}
            >
              <Check className="w-4 h-4" />
            </button>
          ) : (
            onMarkAsUnread && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsUnread(notification.id);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={language === 'ar' ? 'تحديد كغير مقروء' : 'Mark as unread'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )
          )}

          {/* Delete Notification */}
          {onDeleteNotification && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title={language === 'ar' ? 'حذف هذا الإشعار' : 'Delete notification'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Action Navigation */}
          {notification.actionTab && onNavigateAction && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateAction(notification.actionTab!, notification);
              }}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs ms-1"
            >
              <span>
                {language === 'ar'
                  ? notification.actionLabelAr || 'الانتقال'
                  : notification.actionLabelEn || 'Open'}
              </span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
