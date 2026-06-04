import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { appendCustomOption, mergeOptionList } from '@/lib/customOptions';
import { loadCustomOptions, saveCustomOptions } from '@/lib/customOptionsStorage';
import type { CustomOptionListKey, CustomOptionsData } from '@/types/customOptions';

type CustomOptionsContextValue = {
  getOptions: (key: CustomOptionListKey, extraDefaults?: string[]) => string[];
  addOption: (
    key: CustomOptionListKey,
    label: string,
    extraDefaults?: string[],
  ) => string | null;
};

const CustomOptionsContext = createContext<CustomOptionsContextValue | null>(null);

export function CustomOptionsProvider({ children }: { children: ReactNode }) {
  const [custom, setCustom] = useState<CustomOptionsData>(() => loadCustomOptions());

  const persist = useCallback((next: CustomOptionsData) => {
    setCustom(next);
    saveCustomOptions(next);
    return next;
  }, []);

  const getOptions = useCallback(
    (key: CustomOptionListKey, extraDefaults: string[] = []) =>
      mergeOptionList(key, custom, extraDefaults),
    [custom],
  );

  const addOption = useCallback(
    (key: CustomOptionListKey, label: string, extraDefaults: string[] = []): string | null => {
      const { next, error } = appendCustomOption(custom, key, label, extraDefaults);
      if (error) {
        return error;
      }
      persist(next);
      return null;
    },
    [custom, persist],
  );

  const value = useMemo(
    () => ({
      getOptions,
      addOption,
    }),
    [getOptions, addOption],
  );

  return (
    <CustomOptionsContext.Provider value={value}>{children}</CustomOptionsContext.Provider>
  );
}

export function useCustomOptions(): CustomOptionsContextValue {
  const context = useContext(CustomOptionsContext);
  if (!context) {
    throw new Error('useCustomOptions must be used within CustomOptionsProvider');
  }
  return context;
}
