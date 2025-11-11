import React, { useEffect, useMemo, useState } from "react";
import Dashboard from "../components/Dashboard.jsx";
import { useUser } from "../hooks/useUser.jsx";
import axios from "../util/axiosConfig.jsx";
import { Plus, Pencil, FolderOpen } from "lucide-react"; // Trash2 removed
import { API_ENDPOINTS } from "../util/apiEndpoints.js";

const Category = () => {
  useUser();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(API_ENDPOINTS.GET_ALL_CATEGORIES);
        if (alive) setCategories(Array.isArray(data) ? data : data?.items || []);
      } catch (e) {
        if (alive) setError("Failed to load categories");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const resetForm = () => {
    setName("");
    setType("EXPENSE");
    setError("");
  };

  const onAdd = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(API_ENDPOINTS.ADD_CATEGORY, { name, type });
      setCategories((prev) => [data, ...prev]);
      setAdding(false);
      resetForm();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to add category");
    }
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const url = API_ENDPOINTS.UPDATE_CATEGORY(editing.id);
      const { data } = await axios.put(url, { name, type });
      setCategories((prev) => prev.map((c) => (c.id === editing.id ? data : c)));
      setEditing(null);
      resetForm();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update category");
    }
  };

  const openAdd = () => {
    resetForm();
    setAdding(true);
  };

  const openEdit = (cat) => {
    setName(cat.name || "");
    setType(cat.type || "EXPENSE");
    setEditing(cat);
  };

  const headerTitle = useMemo(() => "Categories", []);

  return (
    <Dashboard>
      <div className="my-5 mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <FolderOpen className="h-5 w-5 text-indigo-600" />
            {headerTitle}
          </h2>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add category
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="rounded-md border border-gray-200 p-6 text-sm text-gray-600">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">
            No categories yet. Click “Add category” to create your first one.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-6 items-center rounded-full px-2 text-xs ${
                      c.type === "INCOME"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {c.type}
                  </span>
                  <span className="text-sm text-gray-900">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add modal */}
      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Add category</h3>
              <button
                onClick={() => setAdding(false)}
                className="h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-md bg-rose-50 p-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={onAdd} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-100"
                  placeholder="e.g., Groceries"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-100"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Edit category</h3>
              <button
                onClick={() => setEditing(null)}
                className="h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-md bg-rose-50 p-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={onUpdate} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-100"
                  placeholder="e.g., Groceries"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-100"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Dashboard>
  );
};

export default Category;
