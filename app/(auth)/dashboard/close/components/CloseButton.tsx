/// app/(auth)/dashboard/close/components/CloseButton.tsx
"use client";

type Props = {
  isPending: boolean;
  onClose: () => void;
};

export function CloseButton({ isPending, onClose }: Props) {
  return (
    <div className="text-center">
      <button
        onClick={onClose}
        disabled={isPending}
        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-lg font-medium"
      >
        {isPending ? "Cerrando..." : "Confirmar Cierre"}
      </button>
    </div>
  );
}
