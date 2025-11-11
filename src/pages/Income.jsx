import React, { useEffect, useMemo, useState } from "react";
import Dashboard from "../components/Dashboard.jsx";
import { useUser } from "../hooks/useUser.jsx";
import axios from "../util/axiosConfig";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { Plus, Wallet, Trash2, TrendingUp } from "lucide-react";
import { exportToExcel, formatInr, formatIso } from "../util/exportExcel";
import { Download } from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---------- helpers ----------
const AmountPill = ({ value }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
    + ₹{Number(value).toLocaleString()}
    <TrendingUp className="h-3 w-3" />
  </span>
);

const daySuffix = (n) =>
  n % 10 === 1 && n % 100 !== 11
    ? "st"
    : n % 10 === 2 && n % 100 !== 12
    ? "nd"
    : n % 10 === 3 && n % 100 !== 13
    ? "rd"
    : "th";

const formatTick = (iso) => {
  const d = new Date(iso);
  const day = d.getDate();
  const mon = d.toLocaleString(undefined, { month: "short" });
  return `${day}${daySuffix(day)} ${mon}`;
};

const isSameMonth = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  );
};

// ---------- chart data ----------
function buildChartDataThisMonth(incomes, categories) {
  const byIso = new Map();
  incomes.forEach((i) => {
    if (!i.date) return;
    const iso = String(i.date).slice(0, 10);
    if (!isSameMonth(iso)) return;
    const catName =
      i.category?.name ||
      categories.find(
        (c) => String(c.id) === String(i.categoryId || i.category?.id)
      )?.name ||
      "Income";
    const amt = Number(i.amount || 0);
    if (!byIso.has(iso))
      byIso.set(iso, {
        iso,
        ts: new Date(iso).getTime(),
        total: 0,
        details: [],
      });
    const entry = byIso.get(iso);
    entry.total += amt;
    entry.details.push({ category: catName, amount: amt });
  });
  return Array.from(byIso.values()).sort((a, b) => a.ts - b.ts);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="min-w-[180px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <div className="mb-2 text-sm font-semibold text-gray-900">
        {formatTick(d.iso)}
      </div>
      <div className="mb-2 border-t border-gray-100 pt-2 text-sm">
        <span className="mr-1 font-semibold">Total:</span>
        <span className="font-semibold text-indigo-700">
          ₹{Number(d.total).toLocaleString()}
        </span>
      </div>
      <div className="text-xs text-gray-700">
        <div className="mb-1 font-medium">Details:</div>
        <ul className="space-y-0.5">
          {d.details?.map((x, idx) => (
            <li key={idx} className="flex items-center justify-between">
              <span className="truncate">{x.category}</span>
              <span className="ml-2">₹{Number(x.amount).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const IncomeOverviewChart = ({ incomes, categories }) => {
  const data = useMemo(
    () => buildChartDataThisMonth(incomes, categories),
    [incomes, categories]
  );
  const totals = data.map((d) => d.total);
  const maxY = totals.length ? Math.max(...totals) : 0;
  const domainMax = Math.ceil((maxY * 1.15 || 1) / 1000) * 1000;

  // sqrt scale keeps small values visible next to large spikes
  const [useSqrt, setUseSqrt] = useState(true);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Income Overview
          </h3>
          <p className="text-xs text-gray-500">This month’s earnings trend.</p>
        </div>
        <label className="flex items-center gap-1 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={useSqrt}
            onChange={(e) => setUseSqrt(e.target.checked)}
            className="h-3 w-3"
          />
          Balance scale (sqrt)
        </label>
      </div>

      <div className="h-64 w-full pr-1 pl-2">
        {" "}
        {/* extra padding to prevent tick clipping */}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 24, left: 12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="iso"
              tickFormatter={formatTick}
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={{ stroke: "#e2e8f0" }}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis
              type="number"
              domain={[0, domainMax]}
              scale={useSqrt ? "sqrt" : "linear"}
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={{ stroke: "#e2e8f0" }}
              width={64} // make room so ₹ doesn’t clip
              tickFormatter={(v) => `₹${Number(v).toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotoneX" // smoother curve
              dataKey="total"
              stroke="#7c3aed"
              strokeWidth={3}
              fill="url(#incomeGradient)"
              dot={{ r: 3, stroke: "#7c3aed", strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ---------- page ----------
const Income = () => {
  useUser();

  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // form (source removed)
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState("");
  const [icon, setIcon] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [incRes, catRes] = await Promise.all([
          axios.get(API_ENDPOINTS.GET_ALL_INCOMES || "/incomes"),
          axios.get(API_ENDPOINTS.GET_ALL_CATEGORIES || "/categories"),
        ]);
        if (!alive) return;

        const inc = Array.isArray(incRes.data)
          ? incRes.data
          : incRes.data?.items || [];
        const catsRaw = Array.isArray(catRes.data)
          ? catRes.data
          : catRes.data?.items || [];
        const incomeCats = catsRaw.filter(
          (c) => (c.type || c.categoryType) === "INCOME"
        );

        setIncomes(inc);
        setCategories(incomeCats);
        if (incomeCats.length)
          setCategoryId((prev) => prev || String(incomeCats[0].id));
      } catch {
        if (alive) setError("Failed to load incomes or categories");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Only this month’s incomes for list
  const thisMonthIncomes = useMemo(() => {
    return incomes.filter(
      (i) => i.date && isSameMonth(String(i.date).slice(0, 10))
    );
  }, [incomes]);

  const onAdd = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) {
      setError("Amount must be 0 or greater");
      return;
    }
    try {
      const payload = { amount: amt, date, categoryId, icon }; // source removed
      const { data } = await axios.post(
        API_ENDPOINTS.CREATE_INCOME || "/incomes",
        payload
      );
      setIncomes((prev) => [data, ...prev]);
      setAdding(false);
      // reset
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setIcon("");
      setError("");
      if (categories.length) setCategoryId(String(categories[0].id));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add income");
    }
  };
  const handleDownloadIncome = () => {
    const rows = thisMonthIncomes.map((i) => {
      const catName =
        i.category?.name ||
        categories.find(
          (c) => String(c.id) === String(i.categoryId || i.category?.id)
        )?.name ||
        "Income";
      return {
        Date: formatIso(i.date),
        Category: catName,
        Amount: formatInr(Number(i.amount ?? 0)),
        Id: i.id,
      };
    });
    if (rows.length === 0) {
      alert("No income entries this month to download.");
      return;
    }
    const ym = new Date().toISOString().slice(0, 7); // yyyy-mm
    exportToExcel(rows, `income_${ym}`);
  };

  const onDelete = async (inc) => {
    const catName =
      inc.category?.name ||
      categories.find(
        (c) => String(c.id) === String(inc.categoryId || inc.category?.id)
      )?.name ||
      "Income";
    if (!confirm(`Delete ${catName} entry?`)) return;
    try {
      const url = API_ENDPOINTS.DELETE_INCOME?.(inc.id) || `/incomes/${inc.id}`;
      await axios.delete(url);
      setIncomes((prev) => prev.filter((i) => i.id !== inc.id));
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 401 || status === 403
          ? "Not authorized to delete income"
          : "Failed to delete income");
      setError(msg);
    }
  };

  return (
    <Dashboard>
      <div className="my-5 mx-auto max-w-5xl">
        {/* Title */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Wallet className="h-5 w-5 text-emerald-600" />
            Income
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadIncome}
              className="group inline-flex items-center gap-2 rounded-md border border-gray-200 bg-violet-400 px-3 py-2 text-sm text-black shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow md:px-3.5"
              title="Download this month"
            >
              <Download className="h-4 w-4 text-black transition-colors group-hover:text-gray-800" />
              <span>Download</span>
            </button>

            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add income
            </button>
          </div>
        </div>

        {/* Overview (this month only) */}
        <div className="mb-6">
          <IncomeOverviewChart incomes={incomes} categories={categories} />
        </div>

        {/* This month list */}
        {loading ? (
          <div className="rounded-md border border-gray-200 p-6 text-sm text-gray-600">
            Loading income...
          </div>
        ) : thisMonthIncomes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
            <Wallet className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              No income entries this month.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {thisMonthIncomes.map((i) => {
                const dateStr = i.date
                  ? new Date(i.date).toLocaleDateString()
                  : "";
                const catName =
                  i.category?.name ||
                  categories.find(
                    (c) =>
                      String(c.id) === String(i.categoryId || i.category?.id)
                  )?.name ||
                  "Income";
                return (
                  <div
                    key={i.id}
                    className="flex items-center justify-between rounded-md px-3 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-lg">
                        {i.icon || "💰"}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          {catName}
                        </span>
                        <span className="text-xs text-gray-500">{dateStr}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <AmountPill value={i.amount} />
                      <button
                        onClick={() => onDelete(i)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add modal (source removed) */}
      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Add income</h3>
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
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-100"
                      placeholder="e.g., 50000"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-100"
                      required
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-xs text-gray-600">
                    Category (income only)
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-100"
                    required
                  >
                    {!categories.length && (
                      <option value="">No income categories</option>
                    )}
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
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
    </Dashboard>
  );
};

export default Income;
