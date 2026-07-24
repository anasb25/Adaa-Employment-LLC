import Alert from "../alert/Alert";
import Button from "../button/Button";
import { Modal } from "../ReusableModal";
import type { ConfirmOptions } from "../../../providers/ConfirmDialogProvider";

type ConfirmDialogProps = {
  isOpen: boolean;
  options: ConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
};

const defaultTitles: Record<
  NonNullable<ConfirmOptions["variant"]>,
  string
> = {
  warning: "Please Confirm",
  error: "Confirm Action",
  info: "Confirm Action",
  success: "Confirm Action",
};

export default function ConfirmDialog({
  isOpen,
  options,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!options) return null;

  const variant = options.variant ?? "warning";
  const title = options.title ?? defaultTitles[variant];
  const confirmText = options.confirmText ?? "Confirm";
  const cancelText = options.cancelText ?? "Cancel";
  const isDestructive = variant === "warning" || variant === "error";

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="space-y-5 px-6 pb-6">
        <Alert variant={variant} message={options.message} />

        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className={
              isDestructive
                ? "bg-error-500 text-white shadow-theme-xs hover:bg-error-600 disabled:bg-error-300"
                : undefined
            }
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
