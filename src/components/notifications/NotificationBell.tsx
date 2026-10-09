import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useTranslation } from '../../context/LanguageContext';
import { notificationStorage } from '../../services/notificationStorage';
import { AppNotification } from '../../types/notification';
import { NotificationItem } from './NotificationItem';
import { NotificationDetailModal } from './NotificationDetailModal';
import { Badge } from '../common/Badge';

export interface NotificationBellProps {
  onOpenFullCenter?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onOpenFullCenter,
  onNavigateTab,
}) => {
  const { currentUser: user } = useAuth();
  const { activeBranchId } = useBranch();
  const { language } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'IMPORTANT'>('ALL');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    if (!user) return;
    const branchContext = activeBranchId === 'all' ? undefined : activeBranchId;
    const list = notificationStorage.getNotifications(user, { branchId: branchContext });
    setNotifications(list);
    setUnreadCount(notificationStorage.getUnreadCount(user, branchContext));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [user, activeBranchId]);

  // Synchronize on global event
  useEffect(() => {
    const handleUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener('sms_notifications_updated', handleUpdate);
    return () => window.removeEventListener('sms_notifications_updated', handleUpdate);
  }, [user, activeBranchId]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAsRead = (id: string) => {
    if (!user) return;
    notificationStorage.markAsRead(user, id);
    fetchNotifications();
  };

  const handleMarkAsUnread = (id: string) => {
    if (!user) return;
    notificationStorage.markAsUnread(user, id);
    fetchNotifications();
  };

  const handleDeleteNotification = (id: string) => {
    if (!user) return;
    try {
      notificationStorage.deleteNotification(user, id);
      fetchNotifications();
    } catch (err: any) {
      setPermissionError(err.message || 'فشل حذف الإشعار');
      setTimeout(() => setPermissionError(null), 3000);
    }
  };

  const handleMarkAllAsRead = () => {
    if (!user) return;
    const branchContext = activeBranchId === 'all' ? undefined : activeBranchId;
    notificationStorage.markAllAsRead(user, branchContext);
    fetchNotifications();
  };

  const handleClearRead = () => {
    if (!user) return;
    const branchContext = activeBranchId === 'all' ? undefined : activeBranchId;
    notificationStorage.clearReadNotifications(user, branchContext);
    fetchNotifications();
  };

  const handleNavigateAction = (tab: string, notif: AppNotification) => {
    if (!user) return;
    const check = notificationStorage.validateActionPermission(user, notif);
    if (!check.isAllowed) {
      setPermissionError(language === 'ar' ? check.reasonAr || 'الصلاحية غير متوفرة' : check.reasonEn || 'Permission denied');
      setTimeout(() => setPermissionError(null), 4000);
      return;
    }

    setIsOpen(false);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.isRead;
    if (activeFilter === 'IMPORTANT') return n.priority === 'HIGH' || n.priority === 'CRITICAL' || n.severity === 'CRITICAL';
    return true;
  });

  const readCount = notifications.filter((n) => n.isRead).length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          fetchNotifications();
        }}
        className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
        aria-label="Notifications"
        title={language === 'ar' ? 'مركز التنبيهات والإشعارات' : 'Notification Center'}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute end-0 mt-2 w-84 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'الإشعارات والتنبيهات' : 'Notifications'}
              </span>
              {unreadCount > 0 && (
                <Badge variant="primary" size="sm">
                  {unreadCount} {language === 'ar' ? 'جديد' : 'new'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  title={language === 'ar' ? 'تحديد كافة الإشعارات كمقروءة' : 'Mark all notifications as read'}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'قراءة الكل' : 'Mark all read'}</span>
                </button>
              )}
              {readCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearRead}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold cursor-pointer"
                  title={language === 'ar' ? 'مسح الإشعارات المقروءة' : 'Clear read notifications'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'مسح المقروءة' : 'Clear read'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Permission warning banner */}
          {permissionError && (
            <div className="mt-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{permissionError}</span>
            </div>
          )}

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 my-3 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`flex-1 py-1 rounded-lg text-center font-semibold transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'ar' ? 'الكل' : 'All'} ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('UNREAD')}
              className={`flex-1 py-1 rounded-lg text-center font-semibold transition-all cursor-pointer ${
                activeFilter === 'UNREAD'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'ar' ? 'غير مقروء' : 'Unread'} ({unreadCount})
            </button>
            <button
              onClick={() => setActiveFilter('IMPORTANT')}
              className={`flex-1 py-1 rounded-lg text-center font-semibold transition-all cursor-pointer ${
                activeFilter === 'IMPORTANT'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'ar' ? 'هامة' : 'Urgent'}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto space-y-2.5 pe-1">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>{language === 'ar' ? 'لا توجد إشعارات تطابق التصفية الحالية.' : 'No notifications in this view.'}</p>
              </div>
            ) : (
              filteredNotifications.slice(0, 20).map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAsUnread={handleMarkAsUnread}
                  onDeleteNotification={handleDeleteNotification}
                  onReadDetails={(notif) => setSelectedNotification(notif)}
                  onNavigateAction={handleNavigateAction}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {onOpenFullCenter && (
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 font-medium">
                {language === 'ar' ? 'انقر على أي إشعار لفتحه وقراءته' : 'Click any notification to read'}
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullCenter();
                }}
                className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
              >
                <span>{language === 'ar' ? 'عرض مركز الإشعارات الكامل' : 'Open Full Center'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail reader modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        onMarkAsRead={handleMarkAsRead}
        onMarkAsUnread={handleMarkAsUnread}
        onDeleteNotification={handleDeleteNotification}
        onNavigateAction={handleNavigateAction}
      />
    </div>
  );
};
