import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import "./styles.css";

const STORAGE_KEY = "mobile-budget-tracker-v3";
const categories = ["Food", "Bills", "Gas", "Rent", "Fun", "Shopping", "Savings", "Other"];
const categoryColors = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#4B5563", "#1F2937", "#E5E7EB"];

const defaultData = {
  monthlyIncome: 3200,
  monthlyGoal: 650,
  selectedMonth: "2026-04",
  budgets: { Food: 400, Bills: 500, Gas: 180, Rent: 1200, Fun: 150, Shopping: 200, Savings: 650, Other: 100 },
  transactions: [
    { id: 1, type: "expense", date: "2026-04-01", category: "Food", description: "Groceries", amount: 86.42 },
    { id: 2, type: "expense", date: "2026-04-02", category: "Bills", description: "Phone bill", amount: 55 },
    { id: 3, type: "expense", date: "2026-04-03", category: "Gas", description: "Fuel", amount: 41.18 },
    { id: 4, type: "expense", date: "2026-04-04", category: "Fun", description: "Movie night", amount: 24.5 },
    { id: 5, type: "expense", date: "2026-04-05", category: "Food", description: "Lunch", amount: 13.75 },
  ],
};

function money(value) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return safeValue.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getTotalSpent(transactions) {
  return transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function getTotalIncome(transactions) {
  return transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function getCategoryData(transactions) {
  const grouped = transactions.filter((item) => item.type === "expense").reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount || 0);
    return acc;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

function getGoalProgress(savedEstimate, monthlyGoal) {
  if (!monthlyGoal || monthlyGoal <= 0) return 0;
  return Math.min(100, Math.round((savedEstimate / monthlyGoal) * 100));
}

function getMonthTransactions(transactions, selectedMonth) {
  return transactions.filter((item) => item.date?.startsWith(selectedMonth));
}

function getBudgetStatus(categoryData, budgets) {
  return categories.map((category) => {
    const spent = categoryData.find((item) => item.name === category)?.value || 0;
    const limit = Number(budgets[category] || 0);
    const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return { category, spent, limit, percent };
  });
}

function safeLocalStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function loadStoredData() {
  try {
    const saved = safeLocalStorageGet(STORAGE_KEY);
    if (!saved) return { ...defaultData, selectedMonth: getCurrentMonth() };
    const parsed = JSON.parse(saved);
    return { ...defaultData, ...parsed, budgets: { ...defaultData.budgets, ...(parsed.budgets || {}) }, selectedMonth: parsed.selectedMonth || getCurrentMonth() };
  } catch {
    return { ...defaultData, selectedMonth: getCurrentMonth() };
  }
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && window.location.protocol === "https:") {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

function App() {
  const [data, setData] = useState(loadStoredData);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [saveStatus, setSaveStatus] = useState("Saved on this device");
  const [isStandalone, setIsStandalone] = useState(false);
  const [form, setForm] = useState({ type: "expense", category: "Food", description: "", amount: "", date: getToday() });

  const { monthlyIncome, monthlyGoal, selectedMonth, budgets, transactions } = data;

  useEffect(() => {
    registerServiceWorker();
    const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
    setIsStandalone(Boolean(standalone));
  }, []);

  useEffect(() => {
    const ok = safeLocalStorageSet(STORAGE_KEY, JSON.stringify(data));
    setSaveStatus(ok ? "Saved on this device" : "Save blocked by browser settings");
  }, [data]);

  const monthTransactions = useMemo(() => getMonthTransactions(transactions, selectedMonth), [transactions, selectedMonth]);
  const totalSpent = useMemo(() => getTotalSpent(monthTransactions), [monthTransactions]);
  const extraIncome = useMemo(() => getTotalIncome(monthTransactions), [monthTransactions]);
  const totalAvailable = monthlyIncome + extraIncome;
  const leftOver = totalAvailable - totalSpent;
  const savedEstimate = Math.max(0, leftOver);
  const goalProgress = getGoalProgress(savedEstimate, monthlyGoal);
  const categoryData = useMemo(() => getCategoryData(monthTransactions), [monthTransactions]);
  const budgetStatus = useMemo(() => getBudgetStatus(categoryData, budgets), [categoryData, budgets]);
  const topCategory = categoryData.length ? [...categoryData].sort((a, b) => b.value - a.value)[0] : null;
  const overBudget = budgetStatus.filter((item) => item.limit > 0 && item.spent > item.limit);
  const safeDailySpend = Math.max(0, Math.floor(leftOver / 30));
  const spendingPercent = totalAvailable > 0 ? Math.round((totalSpent / totalAvailable) * 100) : 0;

  const updateData = (patch) => setData((current) => ({ ...current, ...patch }));

  const addTransaction = () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return;
    const transactionDate = form.date || getToday();

    updateData({
      selectedMonth: transactionDate.slice(0, 7),
      transactions: [
        { id: Date.now(), type: form.type, date: transactionDate, category: form.type === "income" ? "Other" : form.category, description: form.description.trim() || (form.type === "income" ? "Income" : form.category), amount },
        ...transactions,
      ],
    });
    setForm({ type: "expense", category: "Food", description: "", amount: "", date: getToday() });
    setActiveTab("dashboard");
  };

  const removeTransaction = (id) => updateData({ transactions: transactions.filter((item) => item.id !== id) });

  const exportCSV = () => {
    const rows = [["Date", "Type", "Category", "Description", "Amount"], ...transactions.map((item) => [item.date, item.type, item.category, item.description, item.amount])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    downloadFile("budget-tracker.csv", csv, "text/csv;charset=utf-8;");
  };

  const resetDemo = () => setData({ ...defaultData, selectedMonth: getCurrentMonth() });

  return (
    <main className="app-shell">
      <div className="phone-wrap">
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="hero-card">
          <div className="header-row">
            <div><p className="muted small">Budget Tracker</p><h1>My Money</h1></div>
            <div className="app-icon">💳</div>
          </div>

          <div className="install-card">
            <div>
              <p className="install-title">{isStandalone ? "Installed on iPhone" : "iPhone app ready"}</p>
              <p className="muted tiny">{saveStatus} • Safari: Share → Add to Home Screen</p>
            </div>
            <span>📱</span>
          </div>

          <div className="two-col">
            <input className="field" type="month" value={selectedMonth} onChange={(e) => updateData({ selectedMonth: e.target.value })} />
            <button className="light-button" onClick={exportCSV}>Export CSV</button>
          </div>

          <section className="balance-card">
            <div className="header-row">
              <div><p className="muted small">Left this month</p><h2>{money(leftOver)}</h2></div>
              <div className="right"><p className="muted tiny">Spent</p><strong>{money(totalSpent)}</strong></div>
            </div>
            <div className="progress"><div style={{ width: `${Math.min(100, Math.max(0, spendingPercent))}%` }} /></div>
            <p className="muted tiny">{spendingPercent}% of available money used</p>
          </section>
        </motion.section>

        {activeTab === "dashboard" && (
          <>
            <section className="two-col top-gap">
              <article className="dark-card"><span>📉</span><p className="muted small">Daily safe spend</p><h3>{money(safeDailySpend)}</h3></article>
              <article className="dark-card"><span>🎯</span><p className="muted small">Goal progress</p><h3>{goalProgress}%</h3></article>
            </section>
            <section className="white-card top-gap"><div className="row-start"><span>🧠</span><strong>Smart insight</strong></div><p>{overBudget.length ? `${overBudget[0].category} is over budget by ${money(overBudget[0].spent - overBudget[0].limit)}. Slow down there first.` : topCategory ? `Your biggest category is ${topCategory.name} at ${money(topCategory.value)}. Your safe daily spend is ${money(safeDailySpend)}.` : "Add expenses to unlock spending insights."}</p></section>
            <section className="dark-card top-gap">
              <h3>Recent transactions</h3>
              <div className="list">
                {monthTransactions.length === 0 && <p className="muted small">No transactions for this month yet.</p>}
                {monthTransactions.map((item) => (
                  <div key={item.id} className="transaction">
                    <div className="truncate"><strong>{item.description}</strong><p className="muted tiny">{item.type === "income" ? "Income" : item.category} • {item.date}</p></div>
                    <div className="amount-row"><strong className={item.type === "income" ? "income" : ""}>{item.type === "income" ? "+" : "-"}{money(item.amount)}</strong><button className="icon-button" onClick={() => removeTransaction(item.id)}>🗑️</button></div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === "add" && (
          <section className="dark-card top-gap">
            <div className="row-start"><span>➕</span><h3>Add transaction</h3></div>
            <div className="two-col">
              <select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select>
              <input className="field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="two-col">
              <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={form.type === "income"}>{categories.map((cat) => <option key={cat}>{cat}</option>)}</select>
              <input className="field" inputMode="decimal" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" />
            </div>
            <input className="field full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
            <button className="light-button full" onClick={addTransaction}>Save Transaction</button>
          </section>
        )}

        {activeTab === "reports" && (
          <>
            <section className="dark-card top-gap"><h3>Spending by category</h3><div className="chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={76} paddingAngle={4}>{categoryData.map((_, index) => <Cell key={index} fill={categoryColors[index % categoryColors.length]} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} /></PieChart></ResponsiveContainer></div></section>
            <section className="dark-card top-gap"><h3>Category totals</h3><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData}><XAxis dataKey="name" tick={{ fill: "#d4d4d4", fontSize: 11 }} /><YAxis tick={{ fill: "#d4d4d4", fontSize: 11 }} /><Tooltip formatter={(value) => money(Number(value))} /><Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#ffffff" /></BarChart></ResponsiveContainer></div></section>
          </>
        )}

        {activeTab === "settings" && (
          <section className="dark-card top-gap">
            <h3>Monthly setup</h3>
            <div className="two-col">
              <input className="field" type="number" value={monthlyIncome} onChange={(e) => updateData({ monthlyIncome: Number(e.target.value || 0) })} placeholder="Monthly income" />
              <input className="field" type="number" value={monthlyGoal} onChange={(e) => updateData({ monthlyGoal: Number(e.target.value || 0) })} placeholder="Savings goal" />
            </div>
            <h3>Category budgets</h3>
            <div className="list">
              {budgetStatus.map((item) => (
                <div key={item.category} className="budget-row">
                  <div className="header-row"><strong>{item.category}</strong><input className="field budget-input" type="number" value={budgets[item.category] || 0} onChange={(e) => updateData({ budgets: { ...budgets, [item.category]: Number(e.target.value || 0) } })} /></div>
                  <div className="small-progress"><div style={{ width: `${Math.min(100, item.percent)}%` }} /></div>
                  <p className="muted tiny">{money(item.spent)} of {money(item.limit)} used</p>
                </div>
              ))}
            </div>
            <button className="light-button full" onClick={() => downloadFile("budget-tracker-backup.json", JSON.stringify(data, null, 2), "application/json")}>Backup Data</button>
            <button className="dark-button full" onClick={resetDemo}>Reset Demo Data</button>
          </section>
        )}
      </div>

      <nav className="bottom-nav">
        <div className="nav-inner">
          {[["dashboard", "🏠", "Home"], ["add", "➕", "Add"], ["reports", "📊", "Reports"], ["settings", "⚙️", "Setup"]].map(([tab, icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "active" : ""}><span>{icon}</span>{label}</button>
          ))}
        </div>
      </nav>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
