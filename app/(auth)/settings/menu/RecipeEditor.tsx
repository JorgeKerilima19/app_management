//app\(auth)\settings\menu\RecipeEditor.tsx

"use client";

import { useState, useEffect } from "react";
import {
  saveRecipeItems,
  getRecipeItems,
  updateRecipeItem,
  deleteRecipeItem,
} from "./actions";

type InventoryItem = {
  id: string;
  name: string;
  currentQuantity: number;
  unit: string;
  category: string | null;
};

type RecipeItem = {
  inventoryItemId: string;
  quantityRequired: number;
  unit: string;
  note?: string | null;
  inventoryItem: InventoryItem;
};

type Props = {
  menuItemId: string;
  inventoryItems: InventoryItem[];
};

export default function RecipeEditor({ menuItemId, inventoryItems }: Props) {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getRecipeItems(menuItemId);
        setRecipes(data);
      } catch (e) {
        console.error("Failed to load recipes", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [menuItemId]);

  const handleAdd = () => {
    if (!selectedId || !quantity) return;
    const item = inventoryItems.find((i) => i.id === selectedId);
    if (!item) return;

    setRecipes([
      ...recipes,
      {
        inventoryItemId: selectedId,
        quantityRequired: parseFloat(quantity),
        unit: item.unit,
        note: note || null,
        inventoryItem: item,
      },
    ]);
    setSelectedId("");
    setQuantity("");
    setNote("");
  };

  const handleEdit = (recipe: RecipeItem) => {
    setEditingId(recipe.inventoryItemId);
    setEditQuantity(recipe.quantityRequired.toString());
    setEditNote(recipe.note || "");
  };

  const handleUpdate = async () => {
    if (!editingId || !editQuantity) return;

    // ✅ Option 1: Immediate Save to Database
    const formData = new FormData();
    formData.append("menuItemId", menuItemId);
    formData.append("inventoryItemId", editingId);
    formData.append("quantityRequired", editQuantity);
    formData.append("note", editNote);

    try {
      setSaving(true);
      await updateRecipeItem(formData);
      // Update local state to reflect change
      setRecipes(
        recipes.map((r) =>
          r.inventoryItemId === editingId
            ? {
                ...r,
                quantityRequired: parseFloat(editQuantity),
                note: editNote || null,
              }
            : r,
        ),
      );
      alert("Ingrediente actualizado");
    } catch (e) {
      alert("Error al actualizar: " + (e as Error).message);
    } finally {
      setSaving(false);
      setEditingId(null);
      setEditQuantity("");
      setEditNote("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditQuantity("");
    setEditNote("");
  };

  const handleRemove = async (id: string) => {
    if (!confirm("¿Eliminar este ingrediente de la receta?")) return;

    // ✅ Option 1: Immediate Delete from Database
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("menuItemId", menuItemId);
      formData.append("inventoryItemId", id);

      await deleteRecipeItem(formData);
      setRecipes(recipes.filter((r) => r.inventoryItemId !== id));
      if (editingId === id) {
        handleCancelEdit();
      }
    } catch (e) {
      alert("Error al eliminar: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.append("menuItemId", menuItemId);

    recipes.forEach((r) => {
      formData.append(
        `ingredient-${r.inventoryItemId}`,
        r.quantityRequired.toString(),
      );
      formData.append(`unit-${r.inventoryItemId}`, r.unit);
      if (r.note) formData.append(`note-${r.inventoryItemId}`, r.note);
    });

    try {
      await saveRecipeItems(formData);
      alert("Receta guardada");
    } catch (e) {
      alert("Error al guardar: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const available = inventoryItems.filter(
    (i) => !recipes.some((r) => r.inventoryItemId === i.id),
  );

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando receta...</div>;
  }

  return (
    <div>
      <h4 className="font-medium text-gray-900 mb-3">Ingredientes / Receta</h4>

      {/* Add/Edit Form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
        {!editingId ? (
          <>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
            >
              <option value="">-- Seleccionar ingrediente --</option>
              {available.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.currentQuantity} {item.unit})
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Cantidad"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
            />

            <input
              type="text"
              placeholder="Nota (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
            />

            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedId || !quantity}
              className="px-3 py-1 bg-violet-500 text-white rounded text-sm hover:bg-violet-600 disabled:opacity-50"
            >
              + Añadir
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={
                recipes.find((r) => r.inventoryItemId === editingId)
                  ?.inventoryItem.name || ""
              }
              disabled
              className="px-2 py-1 text-sm border border-gray-300 rounded text-gray-500 bg-gray-100"
            />

            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Cantidad"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
            />

            <input
              type="text"
              placeholder="Nota (opcional)"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
            />

            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleUpdate}
                disabled={!editQuantity || saving}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Actualizar"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Recipe List */}
      {recipes.length > 0 ? (
        <ul className="space-y-2 mb-3">
          {recipes.map((r) => (
            <li
              key={r.inventoryItemId}
              className={`flex justify-between items-center p-2 rounded ${
                editingId === r.inventoryItemId
                  ? "bg-violet-50 border border-violet-200"
                  : "bg-gray-50"
              }`}
            >
              <span className="text-sm text-gray-900">
                {r.inventoryItem.name} x {r.quantityRequired} {r.unit}
                {r.note && <span className="text-gray-500"> — {r.note}</span>}
              </span>
              <div className="flex gap-2">
                {editingId !== r.inventoryItemId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEdit(r)}
                      disabled={saving}
                      className="text-blue-600 text-xs hover:underline disabled:opacity-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(r.inventoryItemId)}
                      disabled={saving}
                      className="text-red-500 text-xs hover:underline disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-violet-600 font-medium">
                    Editando...
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 mb-3">
          Sin ingredientes definidos.
        </p>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || recipes.length === 0}
          className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 text-sm"
        >
          {saving ? "Guardando..." : "Guardar Receta"}
        </button>
      </div>
    </div>
  );
}
