import React, { useEffect, useMemo, useState } from "react";
import Dashboard from "../components/Dashboard.jsx";
import axios from "../util/axiosConfig";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { Download, RefreshCcw, Layers } from "lucide-react";
import { exportToExcel } from "../util/exportExcel";

// ---------- utils ----------
function toISO(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}
function within(dateISO, fromISO, toISOstr) {
  if (!dateISO) return false;
  const t = new Date(dateISO).getTime();
  const a = fromISO ? new Date(fromISO).getTime() : -Infinity;
  const b = toISOstr ? new Date(toISOstr).getTime() : Infinity;
  return t >= a && t <= b;
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const Filters = () => {
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  // controls
  const [type, setType] = useState("BOTH"); // INCOME | EXPENSE | BOTH
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedCats, setSelectedCats] = useState([]); // ids as strings
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [q, setQ] = useState("");

  const [showChips, setShowChips] = useState(true);

  // fetch all once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [incRes, expRes, catRes] = await Promise.all([
          axios.get(API_ENDPOINTS.GET_ALL_INCOMES || "/incomes"),
          axios.get(API_ENDPOINTS.GET_ALL_EXPENSES || "/expenses"),
          axios.get(API_ENDPOINTS.GET_ALL_CATEGORIES || "/categories"),
        ]);
        if (!alive) return;

        setIncomes(Array.isArray(incRes.data) ? incRes.data : incRes.data?.items || []);
        setExpenses(Array.isArray(expRes.data) ? expRes.data : expRes.data?.items || []);
        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.items || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const categoryMap = useMemo(() => {
    const m = new Map();
    categories.forEach(c => m.set(String(c.id), c));
    return m;
  }, [categories]);

  const expenseCats = useMemo(
    () => categories.filter(c => (c.type || c.categoryType) === "EXPENSE"),
    [categories]
  );
  const incomeCats = useMemo(
    () => categories.filter(c => (c.type || c.categoryType) === "INCOME"),
    [categories]
  );
  const shownCats = useMemo(() => {
    if (type === "INCOME") return incomeCats;
    if (type === "EXPENSE") return expenseCats;
    return categories;
  }, [type, categories, incomeCats, expenseCats]);

  // combined filtered rows
  const combined = useMemo(() => {
    const rows = [];
    if (type === "INCOME" || type === "BOTH") {
      incomes.forEach(i => rows.push({
        id: i.id,
        kind: "INCOME",
        date: i.date,
        amount: Number(i.amount || 0),
        categoryId: String(i.categoryId || i.category?.id || ""),
        categoryName: i.category?.name || categoryMap.get(String(i.categoryId || i.category?.id))?.name || "Income",
        icon: i.icon || "💰",
      }));
    }
    if (type === "EXPENSE" || type === "BOTH") {
      expenses.forEach(e => rows.push({
        id: e.id,
        kind: "EXPENSE",
        date: e.date,
        amount: Number(e.amount || 0),
        categoryId: String(e.categoryId || e.category?.id || ""),
        categoryName: e.category?.name || categoryMap.get(String(e.categoryId || e.category?.id))?.name || "Expense",
        icon: e.icon || "🧾",
      }));
    }

    return rows
      .filter(r => within(String(r.date).slice(0,10), from, to))
      .filter(r => selectedCats.length === 0 || selectedCats.includes(String(r.categoryId)))
      .filter(r => (minAmt === "" || r.amount >= Number(minAmt)) && (maxAmt === "" || r.amount <= Number(maxAmt)))
      .filter(r => !q || r.categoryName.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [type, incomes, expenses, categoryMap, from, to, selectedCats, minAmt, maxAmt, q]);

  const summary = useMemo(() => {
    const inc = combined.filter(r => r.kind === "INCOME").reduce((s,r) => s + r.amount, 0);
    const exp = combined.filter(r => r.kind === "EXPENSE").reduce((s,r) => s + r.amount, 0);
    return { inc, exp, net: inc - exp, count: combined.length };
  }, [combined]);

  // Preserve "All" feel on type change if user had all categories selected previously
  useEffect(() => {
    const allForType = (type === "INCOME" ? incomeCats : type === "EXPENSE" ? expenseCats : categories).map(c => String(c.id));
    const hadAll = selectedCats.length && selectedCats.length === categories.length;
    if (hadAll) setSelectedCats(allForType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, categories]);

  const resetFilters = () => {
    setType("BOTH");
    setFrom("");
    setTo("");
    setSelectedCats([]);
    setMinAmt("");
    setMaxAmt("");
    setQ("");
  };

  const exportFiltered = () => {
    if (combined.length === 0) {
      alert("No rows match the current filters.");
      return;
    }
    const rows = combined.map(r => ({
      Date: new Date(r.date).toLocaleDateString(),
      Type: r.kind,
      Category: r.categoryName,
      Amount: r.amount,
      Amount_INR: `₹${r.amount.toLocaleString()}`,
      Id: r.id,
    }));
    const label = `${type.toLowerCase()}_${toISO(from) || "any"}_${toISO(to) || "any"}`;
    exportToExcel(rows, `filters_${label}`);
  };

  return (
    <Dashboard>
      <div className="my-5 mx-auto max-w-6xl">
        {/* Sticky toolbar */}
        <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Layers className="h-5 w-5 text-indigo-600" />
              Filters
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportFiltered}
                className="group inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Download filtered"
              >
                <Download className="h-4 w-4 text-gray-600 group-hover:text-gray-800" />
                Download ({summary.count})
              </button>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          {/* Quick ranges */}
          <div className="sm:col-span-2 lg:col-span-4 -mb-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-600">Quick ranges:</span>
              <button
                type="button"
                onClick={() => { setFrom(startOfMonth()); setTo(endOfMonth()); }}
                className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
              >
                This month
              </button>
              <button
                type="button"
                onClick={() => { setFrom(daysAgo(30)); setTo(new Date().toISOString().slice(0,10)); }}
                className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
              >
                Last 30 days
              </button>
              <button
                type="button"
                onClick={() => { const now=new Date(); setFrom(`${now.getFullYear()}-01-01`); setTo(new Date().toISOString().slice(0,10)); }}
                className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
              >
                Year to date
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="BOTH">Both</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">From</label>
            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">To</label>
            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">Search</label>
            <input placeholder="Category contains..." value={q} onChange={(e)=>setQ(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>

          {/* Categories with All and chips */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-gray-600">Categories</label>
            <div className="flex items-center gap-2">
              <select
                value="__picker__"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "__all__") {
                    const allForType = (type === "INCOME" ? incomeCats : type === "EXPENSE" ? expenseCats : categories)
                      .map(c => String(c.id));
                    setSelectedCats(allForType);
                  } else if (val !== "__picker__") {
                    const next = new Set(selectedCats);
                    next.add(val);
                    setSelectedCats(Array.from(next));
                  }
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="__picker__" disabled>Select categories…</option>
                <option value="__all__">All</option>
                {shownCats.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSelectedCats([])}
                className="whitespace-nowrap rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                title="Clear categories"
              >
                Clear
              </button>
            </div>

            {showChips && selectedCats.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedCats.map(id => {
                  const name = categoryMap.get(String(id))?.name || id;
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700 ring-1 ring-inset ring-indigo-200">
                      {name}
                      <button
                        className="rounded-full p-0.5 hover:bg-indigo-100"
                        onClick={() => setSelectedCats(selectedCats.filter(x => x !== id))}
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">Min amount</label>
            <input type="number" min="0" value={minAmt} onChange={(e)=>setMinAmt(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">Max amount</label>
            <input type="number" min="0" value={maxAmt} onChange={(e)=>setMaxAmt(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Income total</p>
            <p className="mt-1 text-base font-semibold text-emerald-700">₹{summary.inc.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Expense total</p>
            <p className="mt-1 text-base font-semibold text-rose-700">₹{summary.exp.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Net</p>
            <p className="mt-1 text-base font-semibold text-gray-900">₹{summary.net.toLocaleString()}</p>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-6 text-sm text-gray-600">Loading…</div>
          ) : combined.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-400">🗂️</div>
              <p className="text-sm text-gray-600">No results match your current filters.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {combined.map((r) => (
                <li key={`${r.kind}-${r.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-lg">
                      {r.icon}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">{r.categoryName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(r.date).toLocaleDateString()} • {r.kind}
                      </span>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${r.kind === "INCOME" ? "text-emerald-700" : "text-rose-700"}`}>
                    {r.kind === "INCOME" ? "+" : "-"} ₹{r.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dashboard>
  );
};

export default Filters;
