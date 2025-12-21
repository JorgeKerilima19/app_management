// app/(dashboard)/settings/tables/_components/forms.tsx
'use client';

import { deleteTableAction } from '../actions';

export function DeleteTableForm({ id }: { id: string }) {
  return (
    <form action={deleteTableAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-red-500 hover:text-red-700 text-sm"
      >
        Remove
      </button>
    </form>
  );
}