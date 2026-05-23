import React, { useEffect, useMemo, useState } from "react";
import Dashboard from "../components/Dashboard.jsx";
import { useUser } from "../hooks/useUser.jsx";
import axios from "../util/axiosConfig";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { BarChart2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── helpers ────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const sumObj = (obj) =>
  obj
    ? Object.values(obj).reduce((s, v) => s + Number(v ?? 0), 0)
    : 0;

const PIE_COLORS = ["#7c3aed", "#ef4444", "#16a34a"];

// ─── monthly bar tooltip ──────────────────────────────────────────────────────
const MonthlyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[160px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-sm">
      <p className="mb-1 font-semibold text-gray-800">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: ₹{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ─── page ────────────────────────────────────────────────────────────────────
const Reports = () => {
  useUser();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed

  const [monthlyData, setMonthlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingYearly, setLoadingYearly] = useState(false);
  const [error, setError] = useState("");

  // fetch monthly report whenever year/month changes
  useEffect(() => {
    let alive = true;
    setMonthlyData(null);
    setError("");
    (async () => {
      try {
        setLoadingMonthly(true);
        const res = await axios.get(API_ENDPOINTS.MONTHLY_REPORT(year, month));
        if (alive) setMonthlyData(res.data);
      } catch (err) {
        if (alive) setError(err?.response?.data?.message || "Failed to load monthly report");
      } finally {
        if (alive) setLoadingMonthly(false);
      }
    })();
    return () => { alive = false; };
  }, [year, month]);

  // fetch yearly report whenever year changes
  useEffect(() => {
    let alive = true;
    setYearlyData(null);
    (async () => {
      try {
        setLoadingYearly(true);
        const res = await axios.get(API_ENDPOINTS.YEARLY_REPORT(year));
        if (alive) setYearlyData(res.data);
      } catch {
        // yearly might fail; show nothing
        if (alive) setYearlyData(null);
      } finally {
        if (alive) setLoadingYearly(false);
      }
    })();
    return () => { alive = false; };
  }, [year]);

  // ── derived: monthly breakdown bar chart data ──────────────────────────────
  const monthlyBarData = useMemo(() => {
    if (!monthlyData) return [];
    const incomeMap = monthlyData.totalIncome ?? {};
    const expenseMap = monthlyData.totalExpenses ?? {};
    const cats = new Set([...Object.keys(incomeMap), ...Object.keys(expenseMap)]);
    return Array.from(cats).map((cat) => ({
      name: cat,
      Income: Number(incomeMap[cat] ?? 0),
      Expense: Number(expenseMap[cat] ?? 0),
    }));
  }, [monthlyData]);

  // ── derived: yearly monthly trend line ────────────────────────────────────
  const yearlyLineData = useMemo(() => {
    if (!yearlyData) return [];
    const incomeMap = yearlyData.totalIncome ?? {};
    const expenseMap = yearlyData.totalExpenses ?? {};
    return MONTH_NAMES.map((name, i) => {
      const m = String(i + 1);
      return {
        name,
        Income: Number(incomeMap[m] ?? 0),
        Expense: Number(expenseMap[m] ?? 0),
      };
    });
  }, [yearlyData]);

  const monthlyIncome = useMemo(() => sumObj(monthlyData?.totalIncome), [monthlyData]);
  const monthlyExpense = useMemo(() => sumObj(monthlyData?.totalExpenses), [monthlyData]);
  const monthlyNet = Number(monthlyData?.netSavings ?? monthlyIncome - monthlyExpense);

  const yearlyIncome = useMemo(() => sumObj(yearlyData?.totalIncome), [yearlyData]);
  const yearlyExpense = useMemo(() => sumObj(yearlyData?.totalExpenses), [yearlyData]);
  const yearlyNet = Number(yearlyData?.netSavings ?? yearlyIncome - yearlyExpense);

  const pieData = [
    { name: "Income", value: monthlyIncome, color: "#7c3aed" },
    { name: "Expense", value: monthlyExpense, color: "#ef4444" },
    { name: "Savings", value: Math.max(0, monthlyNet), color: "#16a34a" },
  ].filter((d) => d.value > 0);

  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  return (
    <Dashboard>
      <div className="my-5 mx-auto max-w-5xl">
        {/* title + filters */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <BarChart2 className="h-5 w-5 text-indigo-600" />
            Reports
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring focus:ring-indigo-100"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring focus:ring-indigo-100"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
        )}

        {/* ── Monthly summary cards ─────────────────────────────────────────── */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-violet-100">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Monthly Income</p>
              <p className="text-2xl font-semibold text-gray-900">₹{monthlyIncome.toLocaleString()}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-rose-100">
              <TrendingDown className="h-5 w-5 text-rose-600" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Monthly Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">₹{monthlyExpense.toLocaleString()}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Net Savings</p>
              <p className={`text-2xl font-semibold ${monthlyNet >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {monthlyNet >= 0 ? "+" : ""}₹{Math.abs(monthlyNet).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* ── Monthly charts row ────────────────────────────────────────────── */}
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Category breakdown bar */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                {MONTH_NAMES[month - 1]} {year} — By Category
              </h3>
              <p className="text-xs text-gray-500">Income vs Expenses per category</p>
            </div>
            {loadingMonthly ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-400">Loading…</div>
            ) : monthlyBarData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-400">No data for this month.</div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBarData} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#e2e8f0" }} width={52} tickFormatter={(v) => `₹${Number(v).toLocaleString()}`} />
                    <Tooltip content={<MonthlyTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Income" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Pie distribution */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                {MONTH_NAMES[month - 1]} {year} — Distribution
              </h3>
              <p className="text-xs text-gray-500">Income • Expense • Savings</p>
            </div>
            {loadingMonthly ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-400">Loading…</div>
            ) : pieData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-400">No data for this month.</div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="75%"
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ── Yearly trend line ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 mb-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{year} — Full Year Trend</h3>
              <p className="text-xs text-gray-500">Monthly income vs expenses across the year</p>
            </div>
            {yearlyData && (
              <div className="text-right text-xs text-gray-500">
                <p>Annual income: <span className="font-semibold text-violet-700">₹{yearlyIncome.toLocaleString()}</span></p>
                <p>Annual savings: <span className={`font-semibold ${yearlyNet >= 0 ? "text-emerald-700" : "text-rose-700"}`}>₹{Math.abs(yearlyNet).toLocaleString()}</span></p>
              </div>
            )}
          </div>
          {loadingYearly ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">Loading…</div>
          ) : !yearlyData ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">No yearly data available.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyLineData} margin={{ top: 8, right: 20, left: 8, bottom: 4 }}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }} width={60} tickFormatter={(v) => `₹${Number(v).toLocaleString()}`} />
                  <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Income" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </Dashboard>
  );
};

export default Reports;
