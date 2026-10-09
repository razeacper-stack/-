import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Search,
  AlertCircle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  CheckSquare,
  Square,
  Eye,
  SlidersHorizontal,
  Inbox,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  X,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useTranslation } from '../../context/LanguageContext';
import { notificationStorage } from '../../services/notificationStorage';
import { AppNotification, NotificationType } from '../../types/notification';
import { NotificationItem } from './NotificationItem';
import { NotificationDetailModal } from './NotificationDetailModal';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface NotificationCenterProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateTab?: (tab: string) => void;
  isPageView?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen = true,
  onClose,
  onNavigateTab,
  isPageView = false,
}) => {
  const { currentUser: user } = useAuth();
  const { activeBranchId } = useBranch();
  const { language } = useTranslation();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedType, setSelectedType] = useState<NotificationType | 'ALL'>('ALL');
  const [selectedReadState, setSelectedReadState] = useState<'ALL' | 'UNREAD' | 'READ' | 'URGENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
  const [isConfirmDeleteSelectedOpen, setIsConfirmDeleteSelectedOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  const fetchList = () => {
    if (!user) return;
    const branchContext = activeBranchId === 'all' ? undefined : activeBranchId;
    const isReadParam =
      selectedReadState === 'UNREAD' ? false : selectedReadState === 'READ' ? true : undefined;

    let list = notificationStorage.getNotifications(user, {
      branchId: branchContext,
      type: selectedType === 'ALL' ? undefined : selectedType,
      isRead: isReadParam,
      search: searchQuery,
    });

    if (selectedReadState === 'URGENT') {
      list = list.filter(
        (n) => n.priority === 'HIGH' || n.priority === 'CRITICAL' || n.severity === 'CRITICAL'
      );
    }

    setNotifications(list);
  };

  useEffect(() => {
    if (isOpen || isPageView) {
      fetchList();
    }
  }, [isOpen, isPageView, user, activeBranchId, selectedType, selectedReadState, searchQuery]);

  // Synchronize immediately if any other component updates notifications
  useEffect(() => {
    if (!isOpen && !isPageView) return;
    const handleUpdate = () => {
      fetchList();
    };
    window.addEventListener('sms_notifications_updated', handleUpdate);
    return () => window.removeEventListener('sms_notifications_updated', handleUpdate);
  }, [isOpen, isPageView, user, activeBranchId, selectedType, selectedReadState, searchQuery]);

  const handleMarkAsRead = (id: string) => {
    if (!user) return;
    try {
      notificationStorage.markAsRead(user, id);
      fetchList();
    } catch (err: any) {
      setPermissionError(err.message || 'فشلت قراءة الإشعار');
      setTimeout(() => setPermissionError(null), 4000);
    }
  };

  const handleMarkAsUnread = (id: string) => {
    if (!user) return;
    try {
      notificationStorage.markAsUnread(user, id);
      fetchList();
    } catch (err: any) {
      setPermissionError(err.message || 'فشلت العملية');
      setTimeout(() => setPermissionError(null), 4000);
    }
  };

  const handleDeleteNotification = (id: string) => {
    if (!user) return;
    try {
      notificationStorage.deleteNotification(user, id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchList();
      setActionMessage(language === 'ar' ? 'تم حذف الإشعار بنجاح.' : 'Notification deleted successfully.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setPermissionError(err.message || 'فشل حذف الإشعار');
      setTimeout(() => setPermissionError(null), 4000);
    }
  };

  // Bulk actions: Mark ALL as read
  const handleMarkAllAsRead = () => {
    if (!user) return;
    const branchContext = activeBranchId === 'all' ? undefined : activeBranchId;
    notificationStorage.markAllAsRead(user, branchContext);
    fetchList();
    setActionMessage(language === 'ar' ? 'تم تحديد كافة الإشعارات كمقروءة.' : 'All notifications marked as read.');
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Bulk actions: Clear read notifications
  const handleClearRead = () => {
    if (!user) return;
    const branchContext = activeBranchId === 'all' ? undefined : activeBranchId;
    const count = notificationStorage.clearReadNotifications(user, branchContext);
    setSelectedIds(new Set());
    fetchList();
    setActionMessage(
      language === 'ar'
        ? `تم مسح ${count} إشعاراً مقروءاً بنجاح.`
        : `Cleared ${count} read notifications successfully.`
    );
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Bulk actions: Delete all notifications
  const handleDeleteAll = () => {
    if (!user) return;
    const branchContext = activeBranchId === 'all' ? undefined : activeBranchId;
    const count = notificationStorage.deleteAllNotifications(user, branchContext);
    setIsConfirmDeleteAllOpen(false);
    setSelectedIds(new Set());
    fetchList();
    setActionMessage(
      language === 'ar'
        ? `تم حذف كافة الإشعارات (${count} إشعاراً) بنجاح.`
        : `Deleted all (${count}) notifications successfully.`
    );
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Bulk Selection: Toggle single item selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Bulk Selection: Toggle select all visible
  const handleSelectAllVisible = () => {
    if (selectedIds.size === notifications.length && notifications.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  // Bulk Selection: Clear selection
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk Action: Mark SELECTED as read
  const handleBulkMarkAsRead = () => {
    if (!user || selectedIds.size === 0) return;
    const count = notificationStorage.markNotificationsReadBulk(user, Array.from(selectedIds));
    setSelectedIds(new Set());
    fetchList();
    setActionMessage(
      language === 'ar'
        ? `تم تحديد ${count} إشعاراً كمقروء بنجاح.`
        : `Marked ${count} selected notifications as read.`
    );
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Bulk Action: Mark SELECTED as unread
  const handleBulkMarkAsUnread = () => {
    if (!user || selectedIds.size === 0) return;
    const count = notificationStorage.markNotificationsUnreadBulk(user, Array.from(selectedIds));
    setSelectedIds(new Set());
    fetchList();
    setActionMessage(
      language === 'ar'
        ? `تم تحديد ${count} إشعاراً كغير مقروء.`
        : `Marked ${count} selected notifications as unread.`
    );
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Bulk Action: Delete SELECTED notifications
  const handleBulkDelete = () => {
    if (!user || selectedIds.size === 0) return;
    const count = notificationStorage.deleteNotificationsBulk(user, Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsConfirmDeleteSelectedOpen(false);
    fetchList();
    setActionMessage(
      language === 'ar'
        ? `تم حذف ${count} إشعاراً محدداً بنجاح.`
        : `Deleted ${count} selected notifications successfully.`
    );
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleNavigateAction = (tab: string, notif: AppNotification) => {
    if (!user) return;
    const check = notificationStorage.validateActionPermission(user, notif);
    if (!check.isAllowed) {
      setPermissionError(
        language === 'ar'
          ? check.reasonAr || 'الصلاحية المطلوبة غير متوفرة'
          : check.reasonEn || 'Permission denied'
      );
      setTimeout(() => setPermissionError(null), 5000);
      return;
    }

    if (onClose) onClose();
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;
  const urgentCount = notifications.filter(
    (n) => n.priority === 'HIGH' || n.priority === 'CRITICAL' || n.severity === 'CRITICAL'
  ).length;

  const content = (
    <div className="space-y-4">
      {/* Action feedback banner */}
      {actionMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{actionMessage}</span>
        </div>
      )}

      {/* Permission warning banner */}
      {permissionError && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{permissionError}</span>
        </div>
      )}

      {/* Confirmation Modal for Delete All */}
      {isConfirmDeleteAllOpen && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-3 animate-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs sm:text-sm">
            <Trash2 className="w-4 h-4" />
            <span>{language === 'ar' ? 'تأكيد حذف كافة الإشعارات' : 'Confirm Delete All Notifications'}</span>
          </div>
          <p className="text-xs text-rose-600 dark:text-rose-300">
            {language === 'ar'
              ? 'هل أنت متأكد من رغبتك في حذف جميع الإشعارات المعروضة نهائياً؟ لن يمكن التراجع عن هذه العملية.'
              : 'Are you sure you want to permanently delete all notifications? This action cannot be undone.'}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button variant="danger" size="sm" onClick={handleDeleteAll}>
              {language === 'ar' ? 'نعم، حذف الكل الآن' : 'Yes, Delete All'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmDeleteAllOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Selected */}
      {isConfirmDeleteSelectedOpen && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-3 animate-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs sm:text-sm">
            <Trash2 className="w-4 h-4" />
            <span>
              {language === 'ar'
                ? `تأكيد حذف (${selectedIds.size}) إشعاراً محدداً`
                : `Confirm Delete (${selectedIds.size}) Selected Notifications`}
            </span>
          </div>
          <p className="text-xs text-rose-600 dark:text-rose-300">
            {language === 'ar'
              ? `هل أنت متأكد من رغبتك في حذف ${selectedIds.size} إشعاراً تم تحديدها نهائياً؟`
              : `Are you sure you want to permanently delete the ${selectedIds.size} selected notifications?`}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              {language === 'ar' ? `نعم، حذف (${selectedIds.size}) الآن` : `Yes, Delete (${selectedIds.size})`}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmDeleteSelectedOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <button
          type="button"
          onClick={() => setSelectedReadState('ALL')}
          className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
            selectedReadState === 'ALL'
              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-500'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50'
          }`}
        >
          <span className="text-slate-400 block text-[11px]">{language === 'ar' ? 'إجمالي الإشعارات' : 'Total'}</span>
          <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">{notifications.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedReadState('UNREAD')}
          className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
            selectedReadState === 'UNREAD'
              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-500'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50'
          }`}
        >
          <span className="text-blue-500 block text-[11px] font-semibold">{language === 'ar' ? 'غير مقروء' : 'Unread'}</span>
          <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">{unreadCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedReadState('READ')}
          className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
            selectedReadState === 'READ'
              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50'
          }`}
        >
          <span className="text-emerald-600 block text-[11px] font-semibold">{language === 'ar' ? 'مقروء' : 'Read'}</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{readCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedReadState('URGENT')}
          className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
            selectedReadState === 'URGENT'
              ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 ring-1 ring-rose-500'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50'
          }`}
        >
          <span className="text-rose-500 block text-[11px] font-semibold">{language === 'ar' ? 'عاجلة وحرجة' : 'Urgent'}</span>
          <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">{urgentCount}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'بحث في نصوص وعناوين الإشعارات...' : 'Search notifications...'}
            className="w-full h-9 ps-9 pe-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedReadState}
            onChange={(e) => setSelectedReadState(e.target.value as any)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">{language === 'ar' ? 'كافة الحالات' : 'All States'}</option>
            <option value="UNREAD">{language === 'ar' ? 'غير مقروء فقط' : 'Unread only'}</option>
            <option value="READ">{language === 'ar' ? 'مقروء فقط' : 'Read only'}</option>
            <option value="URGENT">{language === 'ar' ? 'عاجل وحرج فقط' : 'Urgent only'}</option>
          </select>

          <Button variant="outline" size="sm" onClick={fetchList} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
          { id: 'ATTENDANCE', labelAr: 'الحضور والغياب', labelEn: 'Attendance' },
          { id: 'FINANCE', labelAr: 'الشؤون المالية', labelEn: 'Finance' },
          { id: 'TIMETABLE', labelAr: 'الجداول المدرسية', labelEn: 'Timetable' },
          { id: 'SECURITY', labelAr: 'الأمان والنظام', labelEn: 'Security' },
          { id: 'AI', labelAr: 'المساعد الذكي', labelEn: 'AI Assistant' },
          { id: 'TEACHER', labelAr: 'المعلمون', labelEn: 'Teachers' },
          { id: 'STUDENT', labelAr: 'الطلاب', labelEn: 'Students' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedType(cat.id as any)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer shrink-0 ${
              selectedType === cat.id
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {language === 'ar' ? cat.labelAr : cat.labelEn}
          </button>
        ))}
      </div>

      {/* Multi-Select & Bulk Actions Bar */}
      <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Select all & Status */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer select-none transition-colors"
            >
              {selectedIds.size === notifications.length && notifications.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : selectedIds.size > 0 ? (
                <div className="w-4 h-4 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  -
                </div>
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedIds.size === notifications.length && notifications.length > 0
                  ? (language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect all')
                  : (language === 'ar' ? 'تحديد كافة الإشعارات' : 'Select all')}
              </span>
            </button>

            {selectedIds.size > 0 && (
              <Badge variant="primary" size="sm">
                {language === 'ar' ? `تم تحديد ${selectedIds.size} من ${notifications.length}` : `${selectedIds.size} of ${notifications.length} selected`}
              </Badge>
            )}
          </div>

          {/* Bulk Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Global: Mark all as read */}
            {unreadCount > 0 && selectedIds.size === 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer transition-colors shadow-2xs"
                title={language === 'ar' ? 'تحديد جميع الإشعارات كمقروءة' : 'Mark all notifications as read'}
              >
                <CheckCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{language === 'ar' ? 'قراءة الكل' : 'Mark all read'}</span>
              </button>
            )}

            {/* When items ARE selected: Bulk operations for selection */}
            {selectedIds.size > 0 && (
              <>
                {/* Bulk mark selected as read */}
                <button
                  type="button"
                  onClick={handleBulkMarkAsRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer transition-colors shadow-2xs"
                  title={language === 'ar' ? 'تحديد الإشعارات المحددة كمقروءة' : 'Mark selected notifications as read'}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>
                    {language === 'ar' ? `قراءة المحدد (${selectedIds.size})` : `Mark Read (${selectedIds.size})`}
                  </span>
                </button>

                {/* Bulk mark selected as unread */}
                <button
                  type="button"
                  onClick={handleBulkMarkAsUnread}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer transition-colors shadow-2xs"
                  title={language === 'ar' ? 'تحديد الإشعارات المحددة كغير مقروءة' : 'Mark selected notifications as unread'}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {language === 'ar' ? `غير مقروء (${selectedIds.size})` : `Unread (${selectedIds.size})`}
                  </span>
                </button>

                {/* Bulk delete selected */}
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteSelectedOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer transition-colors shadow-2xs"
                  title={language === 'ar' ? 'حذف الإشعارات المحددة' : 'Delete selected notifications'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {language === 'ar' ? `حذف المحدد (${selectedIds.size})` : `Delete (${selectedIds.size})`}
                  </span>
                </button>

                {/* Clear selection */}
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
                  title={language === 'ar' ? 'إلغاء التحديد' : 'Clear selection'}
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notifications list */}
      <div className={`${isPageView ? 'min-h-[350px]' : 'max-h-[440px]'} overflow-y-auto space-y-2.5 pe-1 border border-slate-100 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-900/40`}>
        {notifications.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <Inbox className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              {language === 'ar' ? 'صندوق الإشعارات فارغ حالياً' : 'Your notification box is currently empty'}
            </p>
            <p className="text-slate-400 mt-1">
              {language === 'ar'
                ? 'لا توجد تنبيهات مطابقة لمعايير البحث والتصفية المحددة.'
                : 'No alerts match your search and filter criteria.'}
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkAsRead={handleMarkAsRead}
              onMarkAsUnread={handleMarkAsUnread}
              onDeleteNotification={handleDeleteNotification}
              onReadDetails={(notif) => setSelectedNotification(notif)}
              onNavigateAction={handleNavigateAction}
              selectable={true}
              isSelected={selectedIds.has(n.id)}
              onToggleSelect={handleToggleSelect}
            />
          ))
        )}
      </div>
    </div>
  );

  // If page view: render full-page container
  if (isPageView) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-2xs">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'مركز الإشعارات والتنبيهات المدرسية' : 'Notification & Alerts Center'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'متابعة وتحديد وحذف وقراءة كافة التنبيهات التشغيلية والأمنية'
                  : 'Track, select, read, and delete operational and security alerts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} leftIcon={<CheckCheck className="w-4 h-4 text-blue-500" />}>
                {language === 'ar' ? 'قراءة الكل' : 'Mark all read'}
              </Button>
            )}
            {readCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearRead} leftIcon={<Trash2 className="w-3.5 h-3.5 text-slate-500" />}>
                {language === 'ar' ? 'مسح المقروءة' : 'Clear read'}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmDeleteAllOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                {language === 'ar' ? 'حذف كافة الإشعارات' : 'Delete all'}
              </Button>
            )}
          </div>
        </div>

        {content}

        {/* Detail Reader Modal */}
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
  }

  // Modal View
  return (
    <>
      <Modal
        isOpen={Boolean(isOpen)}
        onClose={onClose || (() => {})}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 block">
                {language === 'ar' ? 'مركز الإشعارات والتنبيهات المدرسية' : 'Notification & Alerts Center'}
              </span>
              <span className="block text-xs font-normal text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'إدارة واختيار وحذف وقراءة التنبيهات التشغيلية والأمنية'
                  : 'Manage, select, read, and delete operational and security alerts'}
              </span>
            </div>
          </div>
        }
        size="xl"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span>{notifications.length} إشعار مسجل</span>
              {unreadCount > 0 && (
                <Badge variant="primary" size="sm">
                  {unreadCount} غير مقروء
                </Badge>
              )}
              {readCount > 0 && (
                <Badge variant="neutral" size="sm">
                  {readCount} مقروء
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} leftIcon={<CheckCheck className="w-4 h-4" />}>
                  {language === 'ar' ? 'قراءة الكل' : 'Mark all read'}
                </Button>
              )}
              {readCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearRead}
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-slate-500" />}
                  className="text-slate-600 dark:text-slate-300"
                >
                  {language === 'ar' ? 'مسح المقروءة' : 'Clear read'}
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfirmDeleteAllOpen(true)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  {language === 'ar' ? 'حذف الكل' : 'Delete all'}
                </Button>
              )}
              {onClose && (
                <Button variant="primary" size="sm" onClick={onClose}>
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
              )}
            </div>
          </div>
        }
      >
        {content}
      </Modal>

      {/* Detail Reader Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        onMarkAsRead={handleMarkAsRead}
        onMarkAsUnread={handleMarkAsUnread}
        onDeleteNotification={handleDeleteNotification}
        onNavigateAction={handleNavigateAction}
      />
    </>
  );
};
