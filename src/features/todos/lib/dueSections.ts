/**
 * Bucket client-side due date untuk power list (ADR-0007).
 * Hanya berlaku pada item yang sudah di-load (infinite pages).
 */
import type { TodoWithRelations } from '../types';

export type DueSectionKey = 'overdue' | 'today' | 'upcoming' | 'none';

export type DueSection = {
  key: DueSectionKey;
  title: string;
  items: TodoWithRelations[];
};

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function classify(dueDate: string | null, now: Date): DueSectionKey {
  if (!dueDate) return 'none';
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return 'none';
  const today = startOfDay(now);
  const dueDay = startOfDay(due);
  if (dueDay < today) return 'overdue';
  if (dueDay === today) return 'today';
  return 'upcoming';
}

const ORDER: DueSectionKey[] = ['overdue', 'today', 'upcoming', 'none'];
const TITLES: Record<DueSectionKey, string> = {
  overdue: 'Terlambat',
  today: 'Hari ini',
  upcoming: 'Mendatang',
  none: 'Tanpa tenggat',
};

/**
 * Group todos into due sections. Empty sections omitted.
 */
export function groupTodosByDue(
  items: TodoWithRelations[],
  now = new Date()
): DueSection[] {
  const buckets: Record<DueSectionKey, TodoWithRelations[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    none: [],
  };
  for (const item of items) {
    buckets[classify(item.dueDate, now)].push(item);
  }
  return ORDER.filter((k) => buckets[k].length > 0).map((key) => ({
    key,
    title: TITLES[key],
    items: buckets[key],
  }));
}
