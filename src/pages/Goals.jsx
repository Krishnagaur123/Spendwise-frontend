import React, { useEffect, useMemo, useState } from "react";
import Dashboard from "../components/Dashboard.jsx";
import { useUser } from "../hooks/useUser.jsx";
import axios from "../util/axiosConfig";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { Plus, Target, Trash2, Pencil, CalendarDays, TrendingUp } from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

const daysLeft = (targetDate) => {
  if (!targetDate) return null;
  const diff = new Date(targetDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const pct = (goal) => Math.min(100, Math.round(Number(goal.progressPercentage ?? 0)));

const STATUS_COLORS = {
  done: "#16a34a",
  near: "#f59e0b",
  ok: "#7c3aed",
};

const statusOf = (goal) => {
  const p = pct(goal);
  if (p >= 100) return "done";
  if (p >= 75) return "near";
  return "ok";
};

// ─── radial bar tooltip ──────────────────────────────────────────────────────
const RadialTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const g = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-sm">
      <div className="font-semibold text-gray-900 mb-1">{g.goalName}</div>
      <div className="text-gray-600">Progress: <span className="font-bold text-indigo-700">{pct(g)}%</span></div>
      <div className="text-gray-600">Saved: <span className="font-semibold">₹{Number(g.currentProgress ?? 0).toLocaleString()}</span></div>
      <div className="text-gray-600">Target: <span className="font-semibold">₹{Number(g.targetAmount ?? 0).toLocaleString()}</span></div>
    </div>
  );
};

// ─── progress overview chart ─────────────────────────────────────────────────
const GoalsOverviewChart = ({ goals }) => {
  const data = useMemo(
    () => goals.map((g) => ({ ...g, progress: pct(g) })),
    [goals]
  );

  if (!data.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900">Goals Progress Overview</h3>
        <p className="text-xs text-gray-500">How close you are to each target.</p>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="goalName"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#e2e8f0" }}
              interval={0}
              width={80}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickFormatter={(v) => `${v}%`}
              width={42}
            />
            <Tooltip
              formatter={(val) => [`${val}%`, "Progress"]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
              {data.map((g, i) => (
                <Cell key={i} fill={STATUS_COLORS[statusOf(g)]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* legend */}
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-600" /> Completed</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> ≥ 75%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-violet-600" /> In progress</span>
      </div>
    </div>
  );
};

// ─── goal card ───────────────────────────────────────────────────────────────
const GoalCard = ({ goal, onDelete, onEdit }) => {
  const p = pct(goal);
  const status = statusOf(goal);
  const barColor = STATUS_COLORS[status];
  const days = daysLeft(goal.targetDate);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3">
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-lg">🎯</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{goal.goalName}</p>
            <p className="text-xs text-gray-500">Target: {fmtDate(goal.targetDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(goal)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(goal)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* progress bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
          <span>₹{Number(goal.currentProgress ?? 0).toLocaleString()} saved</span>
          <span className="font-semibold" style={{ color: barColor }}>{p}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${p}%`, background: barColor }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
          <span>₹{Number(goal.remainingAmount ?? 0).toLocaleString()} remaining</span>
          <span>of ₹{Number(goal.targetAmount ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 border-t border-gray-100">
        <CalendarDays className="h-3.5 w-3.5" />
        {days === null ? "—" : days > 0 ? `${days} days left` : days === 0 ? "Due today" : "Overdue"}
      </div>
    </div>
  );
};

// ─── page ────────────────────────────────────────────────────────────────────
const Goals = () => {
  useUser();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modal state
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null); // goal being edited

  // form fields
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  const resetForm = () => {
    setGoalName("");
    setTargetAmount("");
    setTargetDate("");
    setStartDate(new Date().toISOString().slice(0, 10));
    setError("");
    setEditing(null);
  };

  // load goals
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_ENDPOINTS.GET_ALL_GOALS);
        if (!alive) return;
        const data = res.data?.goals ?? (Array.isArray(res.data) ? res.data : []);
        setGoals(data);
      } catch {
        if (alive) setError("Failed to load goals");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const openEdit = (goal) => {
    setEditing(goal);
    setGoalName(goal.goalName);
    setTargetAmount(String(goal.targetAmount));
    setTargetDate(goal.targetDate ? String(goal.targetDate).slice(0, 10) : "");
    setStartDate(goal.startDate ? String(goal.startDate).slice(0, 10) : new Date().toISOString().slice(0, 10));
    setAdding(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(targetAmount);
    if (Number.isNaN(amt) || amt <= 0) { setError("Target amount must be positive"); return; }
    if (!targetDate) { setError("Target date is required"); return; }

    try {
      const payload = { goalName, targetAmount: amt, targetDate, startDate };
      if (editing) {
        const { data } = await axios.put(API_ENDPOINTS.UPDATE_GOAL(editing.id), payload);
        setGoals((prev) => prev.map((g) => (g.id === editing.id ? data : g)));
      } else {
        const { data } = await axios.post(API_ENDPOINTS.CREATE_GOAL, payload);
        setGoals((prev) => [data, ...prev]);
      }
      setAdding(false);
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || (editing ? "Failed to update goal" : "Failed to create goal"));
    }
  };

  const onDelete = async (goal) => {
    if (!confirm(`Delete goal "${goal.goalName}"?`)) return;
    try {
      await axios.delete(API_ENDPOINTS.DELETE_GOAL(goal.id));
      setGoals((prev) => prev.filter((g) => g.id !== goal.id));
    } catch {
      setError("Failed to delete goal");
    }
  };

  // stats
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + Number(g.targetAmount ?? 0), 0), [goals]);
  const totalSaved = useMemo(() => goals.reduce((s, g) => s + Number(g.currentProgress ?? 0), 0), [goals]);
  const completed = useMemo(() => goals.filter((g) => pct(g) >= 100).length, [goals]);

  return (
    <Dashboard>
      <div className="my-5 mx-auto max-w-5xl">
        {/* title row */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Target className="h-5 w-5 text-violet-600" />
            Goals
          </h2>
          <button
            onClick={() => { resetForm(); setAdding(true); }}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add goal
          </button>
        </div>

        {/* summary cards */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-xl">🎯</span>
            <div>
              <p className="text-xs text-gray-500">Total Goals</p>
              <p className="text-2xl font-semibold text-gray-900">{goals.length}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-xl">✅</span>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{completed}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-indigo-100 text-xl">💰</span>
            <div>
              <p className="text-xs text-gray-500">Total Saved</p>
              <p className="text-2xl font-semibold text-gray-900">₹{totalSaved.toLocaleString()}</p>
              <p className="text-xs text-gray-400">of ₹{totalTarget.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* overview chart */}
        {goals.length > 0 && (
          <div className="mb-6">
            <GoalsOverviewChart goals={goals} />
          </div>
        )}

        {/* list */}
        {loading ? (
          <div className="rounded-md border border-gray-200 p-6 text-sm text-gray-600">Loading goals…</div>
        ) : goals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
            <Target className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">No goals yet. Add your first financial goal!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} onDelete={onDelete} onEdit={openEdit} />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">{editing ? "Edit goal" : "Add goal"}</h3>
              <button
                onClick={() => { setAdding(false); resetForm(); }}
                className="h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50"
                aria-label="Close"
              >✕</button>
            </div>

            {error && (
              <div className="mb-3 rounded-md bg-rose-50 p-2 text-sm text-rose-700">{error}</div>
            )}

            <form onSubmit={onSubmit} className="space-y-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Goal name</label>
                  <input
                    type="text"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-100"
                    placeholder="e.g., Emergency Fund"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">Target amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-100"
                      placeholder="e.g., 100000"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">Start date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600">Target date (must be future)</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-100"
                    min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setAdding(false); resetForm(); }}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                >Cancel</button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                >{editing ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Dashboard>
  );
};

export default Goals;
