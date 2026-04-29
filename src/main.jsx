import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const STORAGE_KEY = "mobile-budget-tracker-v7";
const categories = ["Food", "Bills", "Gas", "Rent", "Fun", "Shopping", "Savings", "Other"];
const categoryColors = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#4B5563", "#1F2937", "#E5E7EB"];

const defaultData = {
  monthlyIncome: 3200,
  monthlyGoal: 650,
  selectedMonth: new Date().toISOString().slice(0, 7),
  transactions: []
};

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getStoredData() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return defaultData;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
  } catch {
    return defaultData;
  }
}

function getMonthTransactions(transactions, selectedMonth) {
  return transactions.filter((item) => item.date && item.date.startsWith(selectedMonth));
}

function getSpent(transactions) {
  return transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function getIncome(transactions) {
  return transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function getChartData(transactions) {
  const grouped = {};

  transactions
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      grouped[item.category] = (grouped[item.category] || 0) + Number(item.amount || 0);
    });

  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

function getGoalProgress(left, monthlyGoal) {
  if (!monthlyGoal || monthlyGoal <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((left / monthlyGoal) * 100)));
}

function getLargestCategory(chartData) {
  if (!chartData.length) return null;
  return [...chartData].sort((a, b) => b.value - a.value)[0];
}

function runTests() {
  const testTransactions = [
    { type: "expense", category: "Food", date: "2026-04-01", amount: 10 },
    { type: "expense", category: "Food", date: "2026-04-02", amount: 5 },
    { type: "income", category: "Other", date: "2026-04-03", amount: 100 },
    { type: "expense", category: "Gas", date: "2026-05-01", amount: 20 }
  ];

  console.assert(getMonthTransactions(testTransactions, "2026-04").length === 3, "April should have 3 transactions");
  console.assert(getSpent(testTransactions) === 35, "Total expenses should equal 35");
  console.assert(getIncome(testTransactions) === 100, "Total income should equal 100");
  console.assert(getChartData(testTransactions).find((item) => item.name === "Food")?.value === 15, "Food chart total should equal 15");
  console.assert(money(12.5) === "$12.50", "Money formatter should format USD");
  console.assert(getGoalProgress(50, 100) === 50, "Goal progress should equal 50");
  console.assert(getGoalProgress(150, 100) === 100, "Goal progress should cap at 100");
  console.assert(getLargestCategory([{ name: "Food", value: 15 }, { name: "Gas", value: 25 }])?.name === "Gas", "Largest category should be Gas");
}

runTests();

function SimpleCategoryChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {data.map((item, index) => {
        const width = `${Math.max(8, Math.round((item.value / maxValue) * 100))}%`;
        return (
          <div key={item.name}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{item.name}</span>
              <strong>{money(item.value)}</strong>
            </div>
            <div style={{ height: 10, background: "#333", borderRadius: 999 }}>
              <div
                style={{
                  width,
                  height: "100%",
                  background: categoryColors[index % categoryColors.length],
                  borderRadius: 999
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [data, setData] = useState(getStoredData);

  const monthTransactions = useMemo(
    () => getMonthTransactions(data.transactions, data.selectedMonth),
    [data.transactions, data.selectedMonth]
  );

  const spent = getSpent(monthTransactions);
  const income = getIncome(monthTransactions);
  const chartData = getChartData(monthTransactions);
  const left = data.monthlyIncome + income - spent;

  return (
    <div style={{ padding: 20, background: "#111", color: "white", minHeight: "100vh" }}>
      <h1>My Money</h1>
      <p>Left: {money(left)}</p>
      <SimpleCategoryChart data={chartData} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
