import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import ConfirmDialog from "../components/ui/confirm/ConfirmDialog";

export type ConfirmVariant = "success" | "error" | "warning" | "info";

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
};

type ConfirmDialogContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(
  null,
);

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error(
      "useConfirmDialog must be used within ConfirmDialogProvider",
    );
  }
  return context;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirmDialog = useCallback((nextOptions: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(nextOptions);
      setOpen(true);
    });
  }, []);

  const closeWithResult = useCallback((result: boolean) => {
    setOpen(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  }, []);

  return (
    <ConfirmDialogContext.Provider value={confirmDialog}>
      {children}
      <ConfirmDialog
        isOpen={open}
        options={options}
        onCancel={() => closeWithResult(false)}
        onConfirm={() => closeWithResult(true)}
      />
    </ConfirmDialogContext.Provider>
  );
}
