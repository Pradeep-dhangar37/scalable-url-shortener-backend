"use client";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-[4px] p-4">
      <div className="relative border border-border rounded-lg bg-card max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-4">
        {/* Title */}
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>

        {/* Message */}
        <p className="text-xs text-foreground leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-xs font-semibold bg-muted hover:bg-border text-foreground transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
