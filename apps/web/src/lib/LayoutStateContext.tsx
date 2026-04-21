import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface PanelState {
  open: boolean;
  size: number; // width for left/right, height for bottom
}

export interface LayoutState {
  left: PanelState;
  right: PanelState;
  bottom: PanelState;
  zenMode: boolean;
}

const DEFAULT_LAYOUT: LayoutState = {
  left: { open: true, size: 260 },
  right: { open: true, size: 340 },
  bottom: { open: false, size: 200 },
  zenMode: false,
};

interface LayoutContextValue {
  layout: LayoutState;
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleBottom: () => void;
  setLeftSize: (size: number) => void;
  setRightSize: (size: number) => void;
  setBottomSize: (size: number) => void;
  resetLayout: () => void;
  showAllPanels: () => void;
  toggleZenMode: () => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutStateProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<LayoutState>(() => {
    try {
      const stored = localStorage.getItem('openclaw-studio-layout');
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<LayoutState>;
        return {
          left: { ...DEFAULT_LAYOUT.left, ...parsed.left },
          right: { ...DEFAULT_LAYOUT.right, ...parsed.right },
          bottom: { ...DEFAULT_LAYOUT.bottom, ...parsed.bottom },
          zenMode: parsed.zenMode ?? false,
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_LAYOUT;
  });

  const saveToStorage = useCallback((next: LayoutState) => {
    try {
      localStorage.setItem('openclaw-studio-layout', JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((next: LayoutState) => {
    setLayout(next);
    saveToStorage(next);
  }, [saveToStorage]);

  const toggleLeft = useCallback(() => {
    setLayout((prev) => {
      const next = { ...prev, left: { ...prev.left, open: !prev.left.open } };
      saveToStorage(next);
      return next;
    });
  }, [saveToStorage]);

  const toggleRight = useCallback(() => {
    setLayout((prev) => {
      const next = { ...prev, right: { ...prev.right, open: !prev.right.open } };
      saveToStorage(next);
      return next;
    });
  }, [saveToStorage]);

  const toggleBottom = useCallback(() => {
    setLayout((prev) => {
      const next = { ...prev, bottom: { ...prev.bottom, open: !prev.bottom.open } };
      saveToStorage(next);
      return next;
    });
  }, [saveToStorage]);

  const setLeftSize = useCallback(
    (size: number) => {
      setLayout((prev) => {
        const next = { ...prev, left: { ...prev.left, size } };
        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage],
  );

  const setRightSize = useCallback(
    (size: number) => {
      setLayout((prev) => {
        const next = { ...prev, right: { ...prev.right, size } };
        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage],
  );

  const setBottomSize = useCallback(
    (size: number) => {
      setLayout((prev) => {
        const next = { ...prev, bottom: { ...prev.bottom, size } };
        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage],
  );

  const resetLayout = useCallback(() => {
    persist(DEFAULT_LAYOUT);
  }, [persist]);

  const showAllPanels = useCallback(() => {
    setLayout((prev) => {
      const next = {
        ...prev,
        left: { ...prev.left, open: true },
        right: { ...prev.right, open: true },
        bottom: { ...prev.bottom, open: true },
        zenMode: false,
      };
      saveToStorage(next);
      return next;
    });
  }, [saveToStorage]);

  const toggleZenMode = useCallback(() => {
    setLayout((prev) => {
      const next = {
        ...prev,
        zenMode: !prev.zenMode,
        left: { ...prev.left, open: !prev.zenMode ? false : prev.left.open },
        right: { ...prev.right, open: !prev.zenMode ? false : prev.right.open },
        bottom: { ...prev.bottom, open: !prev.zenMode ? false : prev.bottom.open },
      };
      saveToStorage(next);
      return next;
    });
  }, [saveToStorage]);

  const value = useMemo(
    () => ({
      layout,
      toggleLeft,
      toggleRight,
      toggleBottom,
      setLeftSize,
      setRightSize,
      setBottomSize,
      resetLayout,
      showAllPanels,
      toggleZenMode,
    }),
    [layout, toggleLeft, toggleRight, toggleBottom, setLeftSize, setRightSize, setBottomSize, resetLayout, showAllPanels, toggleZenMode],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayoutState(): LayoutContextValue {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutState must be used within LayoutStateProvider');
  }
  return context;
}
