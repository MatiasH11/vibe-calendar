import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type EditingShift = { employeeId: number; date: string } | null;

type PlanillaState = {
  currentWeekStart: Date;
  editingShift: EditingShift;
  isCreatingShift: boolean;
  isDragging: boolean;
  setCurrentWeek: (date: Date) => void;
  setEditingShift: (shift: EditingShift) => void;
};

export const usePlanillaStore = create<PlanillaState>()(
  immer((set) => ({
    currentWeekStart: new Date(),
    editingShift: null,
    isCreatingShift: false,
    isDragging: false,
    setCurrentWeek: (date) => set((s) => void (s.currentWeekStart = date)),
    setEditingShift: (shift) => set((s) => void (s.editingShift = shift)),
  }))
);


