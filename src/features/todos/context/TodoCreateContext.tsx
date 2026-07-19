/**
 * Host create-todo sheet di tab shell (bukan per-screen).
 *
 * Center + di FloatingPillTabBar memanggil openCreate() dari mana saja
 * (Home atau Profile). Edit tetap local di screen list.
 */
import { TodoFormDrawer } from '@/features/todos/components/TodoFormDrawer';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type TodoCreateContextValue = {
  /** Buka sheet create (draft kosong; remount key). */
  openCreate: () => void;
  closeCreate: () => void;
  isOpen: boolean;
};

const TodoCreateContext = createContext<TodoCreateContextValue | undefined>(
  undefined
);

/**
 * Provider + satu TodoFormDrawer create-only.
 * Bungkus di (tabs)/_layout di luar/around Tabs.
 */
export function TodoCreateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  /** Bump key tiap buka → draft bersih (D1). */
  const [session, setSession] = useState(0);

  const openCreate = useCallback(() => {
    setSession((n) => n + 1);
    setOpen(true);
  }, []);

  const closeCreate = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ openCreate, closeCreate, isOpen: open }),
    [openCreate, closeCreate, open]
  );

  return (
    <TodoCreateContext.Provider value={value}>
      {children}
      <TodoFormDrawer
        key={open ? `create-${session}` : 'create-closed'}
        visible={open}
        todoId={null}
        onClose={closeCreate}
      />
    </TodoCreateContext.Provider>
  );
}

/**
 * Hook open/close create sheet. Harus di dalam TodoCreateProvider.
 */
export function useTodoCreate(): TodoCreateContextValue {
  const ctx = useContext(TodoCreateContext);
  if (!ctx) {
    throw new Error('useTodoCreate harus di dalam TodoCreateProvider');
  }
  return ctx;
}
