import React, { useEffect, useMemo, useState } from "react";
import Dashboard from "../components/Dashboard";
import { useUser } from "../hooks/useUser.jsx";
import axios from "../util/axiosConfig";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// helpers
const daySuffix = (n) =>
  n % 10 === 1 && n % 100 !== 11
    ? "st"
    : n % 10 === 2 && n % 100 !== 12
    ? "nd"
    : n % 10 === 3 && n % 100 !== 13
    ? "rd"
    : "th";

const fmtTick = (iso) => {
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

function seriesThisMonth(rows, categories, label) {
  const byIso = new Map();
  rows.forEach((r) => {
    if (!r.date) return;
    const iso = String(r.date).slice(0, 10);
    if (!isSameMonth(iso)) return;
    const cat =
      r.category?.name ||
      categories.find(
        (c) => String(c.id) === String(r.categoryId || r.category?.id)
      )?.name ||
      label;
    const amt = Number(r.amount || 0);
    if (!byIso.has(iso))
      byIso.set(iso, {
        iso,
        ts: new Date(iso).getTime(),
        total: 0,
        details: [],
      });
    const e = byIso.get(iso);
    e.total += amt;
    e.details.push({ category: cat, amount: amt });
  });
  return Array.from(byIso.values()).sort((a, b) => a.ts - b.ts);
}

const TooltipCard = ({ active, payload, color }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="min-w-[180px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <div className="mb-2 text-sm font-semibold text-gray-900">
        {fmtTick(d.iso)}
      </div>
      <div className="mb-2 border-t border-gray-100 pt-2 text-sm">
        <span className="mr-1 font-semibold">Total:</span>
        <span className="font-semibold" style={{ color }}>
          ₹{Number(d.total).toLocaleString()}
        </span>
      </div>
      <div className="text-xs text-gray-700">
        <div className="mb-1 font-medium">Details:</div>
        <ul className="space-y-0.5">
          {d.details?.map((x, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="truncate">{x.category}</span>
              <span className="ml-2">₹{Number(x.amount).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const CurvyArea = ({ data, stroke, gradientId }) => {
  const totals = data.map((d) => d.total);
  const maxY = totals.length ? Math.max(...totals) : 0;
  const domainMax = Math.ceil((maxY * 1.15 || 1) / 1000) * 1000;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 24, left: 12, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.06} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="iso"
          tickFormatter={fmtTick}
          tick={{ fill: "#64748b", fontSize: 12 }}
          axisLine={{ stroke: "#e2e8f0" }}
          interval="preserveStartEnd"
          minTickGap={20}
        />
        <YAxis
          type="number"
          domain={[0, domainMax]}
          scale="sqrt"
          tick={{ fill: "#64748b", fontSize: 12 }}
          axisLine={{ stroke: "#e2e8f0" }}
          width={64}
          tickFormatter={(v) => `₹${Number(v).toLocaleString()}`}
        />
        <Tooltip content={<TooltipCard color={stroke} />} />
        <Area
          type="monotoneX"
          dataKey="total"
          stroke={stroke}
          strokeWidth={3}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, stroke, strokeWidth: 2, fill: "#fff" }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const Home = () => {
  useUser();
  const navigate = useNavigate(); // kept in case you navigate elsewhere later

  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setIncomes(
          Array.isArray(incRes.data) ? incRes.data : incRes.data?.items || []
        );
        setExpenses(
          Array.isArray(expRes.data) ? expRes.data : expRes.data?.items || []
        );
        setCategories(
          Array.isArray(catRes.data) ? catRes.data : catRes.data?.items || []
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const monthIncome = useMemo(
    () =>
      incomes
        .filter((i) => i.date && isSameMonth(String(i.date).slice(0, 10)))
        .reduce((s, i) => s + Number(i.amount || 0), 0),
    [incomes]
  );
  const monthExpense = useMemo(
    () =>
      expenses
        .filter((e) => e.date && isSameMonth(String(e.date).slice(0, 10)))
        .reduce((s, e) => s + Number(e.amount || 0), 0),
    [expenses]
  );
  const net = monthIncome - monthExpense;

  const incomeSeries = useMemo(
    () => seriesThisMonth(incomes, categories, "Income"),
    [incomes, categories]
  );
  const expenseSeries = useMemo(
    () => seriesThisMonth(expenses, categories, "Expense"),
    [expenses, categories]
  );

  const recent = useMemo(() => {
    const rows = [
      ...incomes.map((i) => ({
        id: `I-${i.id}`,
        kind: "INCOME",
        date: i.date,
        amount: Number(i.amount || 0),
        categoryName:
          i.category?.name ||
          categories.find(
            (c) => String(c.id) === String(i.categoryId || i.category?.id)
          )?.name ||
          "Income",
        icon: i.icon || "💰",
      })),
      ...expenses.map((e) => ({
        id: `E-${e.id}`,
        kind: "EXPENSE",
        date: e.date,
        amount: Number(e.amount || 0),
        categoryName:
          e.category?.name ||
          categories.find(
            (c) => String(c.id) === String(e.categoryId || e.category?.id)
          )?.name ||
          "Expense",
        icon: e.icon || "🧾",
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    return rows.slice(0, 5); // recent 5
  }, [incomes, expenses, categories]);

  // Donut data
  const balance = Math.max(0, net);
  const pieData = useMemo(
    () => [
      { name: "Income", value: monthIncome, color: "#16a34a" },
      { name: "Expense", value: monthExpense, color: "#ef4444" },
      { name: "Balance", value: balance, color: "#7c3aed" },
    ],
    [monthIncome, monthExpense, balance]
  );

  const labelPct = ({ name, percent }) =>
    `${name} ${(percent * 100).toFixed(0)}%`;

  return (
    <div>
      <Dashboard>
        <div className="my-5 mx-auto max-w-6xl">
          {/* Heading (Filter button removed) */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Wallet className="h-5 w-5 text-indigo-600" />
              Dashboard
            </h2>
          </div>

          {/* Top cards */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Balance */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#6d28d9] text-white shadow-md">
                  <span className="text-lg">📥</span>
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">
                    Total Balance
                  </span>
                  <span className="text-2xl font-semibold text-gray-900">
                    ₹{net.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Income */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#065f46] text-white shadow-md">
                  <span className="text-lg">👛</span>
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">
                    Total Income
                  </span>
                  <span className="text-2xl font-semibold text-gray-900">
                    ₹{monthIncome.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Expense */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#7f1d1d] text-white shadow-md">
                  <span className="text-lg">🪙</span>
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">
                    Total Expense
                  </span>
                  <span className="text-2xl font-semibold text-gray-900">
                    ₹{monthExpense.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Donut + one line chart */}
          {/* Charts row (linked headers) */}
          <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Income chart */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate("/income")}
                  className="text-left text-sm font-semibold text-indigo-700 hover:underline"
                >
                  Income Overview (month)
                </button>
                <span className="text-xs text-gray-500">
                  Curved • sqrt scale
                </span>
              </div>
              <div className="h-72 w-full">
                <CurvyArea
                  data={incomeSeries}
                  stroke="#7c3aed"
                  gradientId="gradIncome"
                />
              </div>
            </div>

            {/* Expense chart */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate("/expense")}
                  className="text-left text-sm font-semibold text-rose-700 hover:underline"
                >
                  Expense Overview (month)
                </button>
                <span className="text-xs text-gray-500">
                  Curved • sqrt scale
                </span>
              </div>
              <div className="h-72 w-full">
                <CurvyArea
                  data={expenseSeries}
                  stroke="#ef4444"
                  gradientId="gradExpense"
                />
              </div>
            </div>
          </div>
          {/* Overall donut (single) */}
          <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Overall distribution
              </h3>
              <span className="text-xs text-gray-500">
                Income • Expense • Balance
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={3}
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={24} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent activity (5) */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Recent activity
              </h3>
              {/* View all keeps navigation to filters; remove if not needed */}
              <button
                type="button"
                onClick={() => navigate("/filter")}
                className="text-xs text-indigo-600 hover:underline"
              >
                View all
              </button>
            </div>
            {loading ? (
              <div className="px-4 pb-4 text-sm text-gray-600">Loading…</div>
            ) : recent.length === 0 ? (
              <div className="px-4 pb-4 text-sm text-gray-600">
                No recent items.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recent.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-lg">
                        {r.icon}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          {r.categoryName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(r.date).toLocaleDateString()} • {r.kind}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        r.kind === "INCOME"
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {r.kind === "INCOME" ? "+" : "-"} ₹
                      {r.amount.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Dashboard>
    </div>
  );
};

export default Home;
