"use client";

export type ConfirmTone = "default" | "warn" | "bad";

export type ConfirmPrompt = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel?: () => void;
};

export default function ConfirmDialog({
  open, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar",
  tone = "default", onConfirm, onCancel,
}: ConfirmPrompt) {
  if (!open) return null;

  const btn = tone === "bad"
    ? "bg-red-600 hover:bg-red-700"
    : tone === "warn"
    ? "bg-amber-600 hover:bg-amber-700"
    : "bg-brand hover:bg-brand-dark";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="p-5 text-sm text-slate-700">
          {message}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-2 text-sm rounded-lg text-white ${btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
