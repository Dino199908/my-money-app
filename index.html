import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import "./styles.css";

const STORAGE_KEY = "mobile-budget-tracker-v4";
const categories = ["Food", "Bills", "Gas", "Rent", "Fun", "Shopping", "Savings", "Other"];
const categoryColors = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#4B5563", "#1F2937", "#E5E7EB"];

const defaultData = {
  monthlyIncome: 3200,
  monthlyGoal: 650,
  selectedMonth: new Date().toISOString().slice(0, 7),
  transactions: []
};

function money(value) {
  return Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultData;
  } catch {
    return defaultData;
  }
}

function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState("dashboard");
  const [form, setForm] = useState({
    type: "expense",
    category: "Food",
    amount: "",
    description: "",
    date: today()
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const monthTransactions = data.transactions.filter((item) =>
    item.date.startsWith(data.selectedMonth)
  );

  const spent = monthTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const extraIncome = monthTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const left = data.monthlyIncome + extraIncome - spent;

  const chartData = useMemo(() => {
    const grouped = {};
    monthTransactions
      .filter((item) => item.type === "expense")
      .forEach((item) => {
        grouped[item.category] = (grouped[item.category] || 0) + Number(item.amount || 0);
      });

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [monthTransactions]);

  const addTransaction = () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return;

    const transaction = {
      id: Date.now(),
      type: form.type,
      category: form.type === "income" ? "Other" : form.category,
      amount,
      description: form.description || (form.type === "income" ? "Income" : form.category),
      date: form.date || today()
    };

    setData({
      ...data,
      selectedMonth: transaction.date.slice(0, 7),
      transactions: [transaction, ...data.transactions]
    });

    setForm({
      type: "expense",
      category: "Food",
      amount: "",
      description: "",
      date: today()
    });

    setTab("dashboard");
  };

  const deleteTransaction = (id) => {
    setData({
      ...data,
      transactions: data.transactions.filter((item) => item.id !== id)
    });
  };

  return (
    <main className="app">
      <section className="card hero">
        <p className="muted">Budget Tracker</p>
        <h1>My Money</h1>
        <p className="save">Saved on this device</p>

        <label>
          Month
          <input
            type="month"
            value={data.selectedMonth}
            onChange={(e) => setData({ ...data, selectedMonth: e.target.value })}
          />
        </label>

        <div className="balance">
          <p>Left this month</p>
          <h2>{money(left)}</h2>
          <small>Spent: {money(spent)}</small>
        </div>
      </section>

      {tab === "dashboard" && (
        <>
          <section className="grid">
            <div className="card">
              <p className="muted">Income</p>
              <h3>{money(data.monthlyIncome + extraIncome)}</h3>
            </div>
            <div className="card">
              <p className="muted">Expenses</p>
              <h3>{money(spent)}</h3>
            </div>
          </section>

          <section className="card">
            <h3>Spending by category</h3>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => money(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card">
            <h3>Recent transactions</h3>
            {monthTransactions.length === 0 && <p className="muted">No transactions yet.</p>}
            {monthTransactions.map((item) => (
              <div className="row" key={item.id}>
                <div>
                  <strong>{item.description}</strong>
                  <p className="muted">{item.type === "income" ? "Income" : item.category} • {item.date}</p>
                </div>
                <div className="right">
                  <strong>{item.type === "income" ? "+" : "-"}{money(item.amount)}</strong>
                  <button onClick={() => deleteTransaction(item.id)}>Delete</button>
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {tab === "add" && (
        <section className="card">
          <h3>Add transaction</h3>

          <label>
            Type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>

          <label>
            Date
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>

          {form.type === "expense" && (
            <label>
              Category
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
          )}

          <label>
            Amount
            <input
              inputMode="decimal"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
            />
          </label>

          <label>
            Description
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Example: Groceries"
            />
          </label>

          <button className="primary" onClick={addTransaction}>Save</button>
        </section>
      )}

      {tab === "settings" && (
        <section className="card">
          <h3>Settings</h3>
          <label>
            Monthly income
            <input
              type="number"
              value={data.monthlyIncome}
              onChange={(e) => setData({ ...data, monthlyIncome: Number(e.target.value || 0) })}
            />
          </label>
          <label>
            Savings goal
            <input
              type="number"
              value={data.monthlyGoal}
              onChange={(e) => setData({ ...data, monthlyGoal: Number(e.target.value || 0) })}
            />
          </label>
        </section>
      )}

      <nav>
        <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>Home</button>
        <button className={tab === "add" ? "active" : ""} onClick={() => setTab("add")}>Add</button>
        <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>Setup</button>
      </nav>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
