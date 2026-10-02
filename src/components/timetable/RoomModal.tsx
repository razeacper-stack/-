import React, { useState } from 'react';
import { SchoolRoom, CreateRoomDTO, UpdateRoomDTO, RoomType } from '../../types/timetable';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useTimetable } from '../../context/TimetableContext';
import {
  Building2,
  Plus,
  Edit2,
  AlertCircle,
  DoorOpen,
  Users,
} from 'lucide-react';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
}

export const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, branchId }) => {
  const { rooms, createRoom, updateRoom } = useTimetable();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  // Form State
  const [roomCode, setRoomCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [capacity, setCapacity] = useState<number>(30);
  const [roomType, setRoomType] = useState<RoomType>('CLASSROOM');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const branchRooms = rooms.filter((r) => r.branchId === branchId);

  const handleOpenAdd = () => {
    setRoomCode('');
    setNameAr('');
    setNameEn('');
    setCapacity(30);
    setRoomType('CLASSROOM');
    setBuilding('');
    setFloor('');
    setEditingRoomId(null);
    setShowAddForm(true);
    setErrorMessage(null);
  };

  const handleOpenEdit = (r: SchoolRoom) => {
    setRoomCode(r.roomCode);
    setNameAr(r.nameAr);
    setNameEn(r.nameEn);
    setCapacity(r.capacity);
    setRoomType(r.roomType);
    setBuilding(r.building || '');
    setFloor(r.floor || '');
    setEditingRoomId(r.id);
    setShowAddForm(true);
    setErrorMessage(null);
  };

  const getRoomTypeBadge = (type: RoomType) => {
    switch (type) {
      case 'CLASSROOM':
        return <Badge variant="primary" size="sm">فصل دراسي</Badge>;
      case 'SCIENCE_LAB':
        return <Badge variant="success" size="sm">معمل علوم</Badge>;
      case 'COMPUTER_LAB':
        return <Badge variant="info" size="sm">معمل حاسب</Badge>;
      case 'ART_ROOM':
        return <Badge variant="warning" size="sm">مرسم فنون</Badge>;
      case 'LIBRARY':
        return <Badge variant="neutral" size="sm">مكتبة</Badge>;
      case 'GYM':
        return <Badge variant="danger" size="sm">صالة رياضية</Badge>;
      default:
        return <Badge variant="neutral" size="sm">مرفق تعليمي</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!roomCode.trim()) {
      setErrorMessage('رمز القاعة إلزامي.');
      return;
    }
    if (!nameAr.trim() || !nameEn.trim()) {
      setErrorMessage('اسم القاعة بالعربية والإنجليزية مطلوب.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingRoomId) {
        const updateDto: UpdateRoomDTO = {
          roomCode: roomCode.trim().toUpperCase(),
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          capacity,
          roomType,
          building: building.trim() || undefined,
          floor: floor.trim() || undefined,
        };
        await updateRoom(editingRoomId, updateDto);
      } else {
        const createDto: CreateRoomDTO = {
          branchId,
          roomCode: roomCode.trim().toUpperCase(),
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          capacity,
          roomType,
          building: building.trim() || undefined,
          floor: floor.trim() || undefined,
          status: 'active',
        };
        await createRoom(createDto);
      }
      setShowAddForm(false);
      setEditingRoomId(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في حفظ بيانات القاعة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              إدارة القاعات والمعامل المدرسية
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              تسجيل القاعات الدراسية والمعامل وتحديد سعاتها لمنع التعارض في الإشغال
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            عدد القاعات المسجلة بالفرع: <strong className="text-slate-800 dark:text-slate-200">{branchRooms.length}</strong>
          </span>

          {!showAddForm && (
            <Button size="sm" variant="primary" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              إضافة قاعة جديدة
            </Button>
          )}
        </div>

        {/* Form */}
        {showAddForm && (
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {editingRoomId ? 'تعديل بيانات القاعة' : 'تسجيل قاعة أو معمل جديد بالفرع'}
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                إلغاء
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  رمز القاعة *
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="مثال: R-101 / LAB-01"
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  اسم القاعة (عربي) *
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: قاعة 101"
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  اسم القاعة (إنجليزي) *
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Room 101"
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  السعة الطلابية *
                </label>
                <input
                  type="number"
                  min="5"
                  max="150"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 30)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  نوع القاعة *
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as RoomType)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer"
                >
                  <option value="CLASSROOM">فصل دراسي (Classroom)</option>
                  <option value="SCIENCE_LAB">معمل علوم (Science Lab)</option>
                  <option value="COMPUTER_LAB">معمل حاسب (Computer Lab)</option>
                  <option value="ART_ROOM">مرسم فنون (Art Room)</option>
                  <option value="LIBRARY">مكتبة وقراءة (Library)</option>
                  <option value="GYM">صالة رياضية (Gym)</option>
                  <option value="AUDITORIUM">مسرح ومدرج (Auditorium)</option>
                  <option value="OTHER">أخرى (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  المبنى / الدور
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="مثال: المبنى الأكاديمي - الدور 1"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" type="button" onClick={() => setShowAddForm(false)}>
                إلغاء
              </Button>
              <Button size="sm" variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جارٍ الحفظ...' : editingRoomId ? 'تحديث القاعة' : 'إضافة'}
              </Button>
            </div>
          </form>
        )}

        {/* Room List */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-[380px] overflow-y-auto">
          {branchRooms.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              لا توجد قاعات دراسية مسجلة لهذا الفرع. انقر على &quot;إضافة قاعة جديدة&quot;.
            </div>
          ) : (
            branchRooms.map((r) => (
              <div
                key={r.id}
                className="p-3 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold font-mono text-xs">
                    {r.roomCode}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {r.nameAr} ({r.nameEn})
                      </span>
                      {getRoomTypeBadge(r.roomType)}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        السعة: {r.capacity} طالب
                      </span>
                      {r.building && (
                        <span>• {r.building}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(r)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};
