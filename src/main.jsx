import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const STORAGE_KEY = "my-money-real-app-v1";
const categories = ["Food", "Bills", "Gas", "Rent", "Fun", "Shopping", "Savings", "Other"];

const starterData = {
  monthlyIncome: 3200,
  selectedMonth: new Date().toISOString().slice(0, 7),
  transactions: []
};

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...starterData, ...JSON.parse(saved) } : starterData;
  } catch {
    return starterData;
  }
}

function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState("home");
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "Food",
    description: "",
    date: today()
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const monthTransactions = useMemo(() => {
    return data.transactions.filter((item) => item.date.startsWith(data.selectedMonth));
  }, [data.transactions, data.selectedMonth]);

  const expenses = monthTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const extraIncome = monthTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalIncome = data.monthlyIncome + extraIncome;
  const left = totalIncome - expenses;

  const categoryTotals = categories.map((category) => {
    const total = monthTransactions
      .filter((item) => item.type === "expense" && item.category === category)
      .reduce((sum, item) => sum + item.amount, 0);
    return { category, total };
  }).filter((item) => item.total > 0);

  const biggestCategory = [...categoryTotals].sort((a, b) => b.total - a.total)[0];
  const maxCategory = Math.max(...categoryTotals.map((item) => item.total), 1);

  const saveTransaction = () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return;

    const item = {
      id: Date.now(),
      type: form.type,
      amount,
      category: form.type === "income" ? "Other" : form.category,
      description: form.description.trim() || (form.type === "income" ? "Income" : form.category),
      date: form.date || today()
    };

    setData({
      ...data,
      selectedMonth: item.date.slice(0, 7),
      transactions: [item, ...data.transactions]
    });

    setForm({ type: "expense", amount: "", category: "Food", description: "", date: today() });
    setTab("home");
  };

  const deleteTransaction = (id) => {
    setData({
      ...data,
      transactions: data.transactions.filter((item) => item.id !== id)
    });
  };

  return (
    <main style={styles.page}>
      <section style={styles.phone}>
        <header style={styles.hero}>
          <div style={styles.topRow}>
            <div>
              <p style={styles.kicker}>Budget Tracker</p>
              <h1 style={styles.title}>My Money</h1>
            </div>
            <div style={styles.icon}>💳</div>
          </div>

          <div style={styles.balanceCard}>
            <p style={styles.darkMuted}>Left this month</p>
            <h2 style={styles.balance}>{money(left)}</h2>
            <div style={styles.splitRow}>
              <span>Income {money(totalIncome)}</span>
              <span>Spent {money(expenses)}</span>
            </div>
          </div>

          <input
            style={styles.monthInput}
            type="month"
            value={data.selectedMonth}
            onChange={(event) => setData({ ...data, selectedMonth: event.target.value })}
          />
        </header>

        {tab === "home" && (
          <>
            <section style={styles.statsGrid}>
              <div style={styles.card}>
                <p style={styles.muted}>Safe daily spend</p>
                <h3 style={styles.stat}>{money(Math.max(0, left / 30))}</h3>
              </div>
              <div style={styles.card}>
                <p style={styles.muted}>Transactions</p>
                <h3 style={styles.stat}>{monthTransactions.length}</h3>
              </div>
            </section>

            <section style={styles.whiteCard}>
              <p style={styles.insightTitle}>🧠 Smart insight</p>
              <p style={styles.insightText}>
                {biggestCategory
                  ? `Your biggest spending area is ${biggestCategory.category} at ${money(biggestCategory.total)}.`
                  : "Add an expense to unlock spending insights."}
              </p>
            </section>

            <section style={styles.card}>
              <h3 style={styles.sectionTitle}>Spending by category</h3>
              {categoryTotals.length === 0 && <p style={styles.muted}>No category spending yet.</p>}
              {categoryTotals.map((item, index) => (
                <div key={item.category} style={styles.barGroup}>
                  <div style={styles.splitRow}>
                    <span>{item.category}</span>
                    <strong>{money(item.total)}</strong>
                  </div>
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        width: `${Math.max(8, (item.total / maxCategory) * 100)}%`,
                        background: ["#fff", "#d4d4d4", "#a3a3a3", "#737373"][index % 4]
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>

            <section style={styles.card}>
              <h3 style={styles.sectionTitle}>Recent transactions</h3>
              {monthTransactions.length === 0 && <p style={styles.muted}>No transactions yet. Tap Add below.</p>}
              {monthTransactions.map((item) => (
                <div key={item.id} style={styles.transaction}>
                  <div>
                    <strong>{item.description}</strong>
                    <p style={styles.muted}>{item.type === "income" ? "Income" : item.category} • {item.date}</p>
                  </div>
                  <div style={styles.amountBox}>
                    <strong style={{ color: item.type === "income" ? "#86efac" : "white" }}>
                      {item.type === "income" ? "+" : "-"}{money(item.amount)}
                    </strong>
                    <button style={styles.deleteButton} onClick={() => deleteTransaction(item.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === "add" && (
          <section style={styles.card}>
            <h3 style={styles.sectionTitle}>Add transaction</h3>

            <label style={styles.label}>Type</label>
            <select style={styles.input} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <label style={styles.label}>Date</label>
            <input style={styles.input} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />

            {form.type === "expense" && (
              <>
                <label style={styles.label}>Category</label>
                <select style={styles.input} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </>
            )}

            <label style={styles.label}>Amount</label>
            <input
              style={styles.input}
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />

            <label style={styles.label}>Description</label>
            <input
              style={styles.input}
              placeholder="Example: Groceries"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />

            <button style={styles.primaryButton} onClick={saveTransaction}>Save Transaction</button>
          </section>
        )}

        {tab === "settings" && (
          <section style={styles.card}>
            <h3 style={styles.sectionTitle}>Setup</h3>
            <label style={styles.label}>Monthly income</label>
            <input
              style={styles.input}
              type="number"
              value={data.monthlyIncome}
              onChange={(event) => setData({ ...data, monthlyIncome: Number(event.target.value || 0) })}
            />
            <button style={styles.secondaryButton} onClick={() => setData(starterData)}>Reset App</button>
          </section>
        )}
      </section>

      <nav style={styles.nav}>
        <button style={tab === "home" ? styles.activeNav : styles.navButton} onClick={() => setTab("home")}>🏠<span>Home</span></button>
        <button style={tab === "add" ? styles.activeNav : styles.navButton} onClick={() => setTab("add")}>➕<span>Add</span></button>
        <button style={tab === "settings" ? styles.activeNav : styles.navButton} onClick={() => setTab("settings")}>⚙️<span>Setup</span></button>
      </nav>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "white",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "16px 16px 110px"
  },
  phone: {
    maxWidth: 430,
    margin: "0 auto"
  },
  hero: {
    background: "linear-gradient(135deg, #18181b, #27272a)",
    border: "1px solid #2f2f35",
    borderRadius: 30,
    padding: 18,
    boxShadow: "0 18px 60px rgba(0,0,0,.35)"
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16
  },
  kicker: {
    margin: 0,
    color: "#a1a1aa",
    fontSize: 14
  },
  title: {
    margin: "4px 0 0",
    fontSize: 34,
    letterSpacing: "-0.05em"
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    background: "white",
    color: "#111",
    display: "grid",
    placeItems: "center",
    fontSize: 26
  },
  balanceCard: {
    background: "white",
    color: "#111",
    borderRadius: 24,
    padding: 18,
    marginTop: 18
  },
  darkMuted: {
    margin: 0,
    color: "#71717a",
    fontSize: 14
  },
  balance: {
    margin: "4px 0 12px",
    fontSize: 42,
    letterSpacing: "-0.06em"
  },
  splitRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 14
  },
  monthInput: {
    width: "100%",
    marginTop: 14,
    minHeight: 48,
    borderRadius: 16,
    border: "1px solid #3f3f46",
    background: "#18181b",
    color: "white",
    padding: "0 12px",
    fontSize: 16
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 14
  },
  card: {
    background: "#18181b",
    border: "1px solid #2f2f35",
    borderRadius: 24,
    padding: 16,
    marginTop: 14
  },
  whiteCard: {
    background: "white",
    color: "#111",
    borderRadius: 24,
    padding: 16,
    marginTop: 14
  },
  muted: {
    margin: 0,
    color: "#a1a1aa",
    fontSize: 13
  },
  stat: {
    margin: "8px 0 0",
    fontSize: 24
  },
  insightTitle: {
    margin: 0,
    fontWeight: 800
  },
  insightText: {
    margin: "8px 0 0",
    color: "#3f3f46",
    fontSize: 14
  },
  sectionTitle: {
    margin: "0 0 14px",
    fontSize: 20
  },
  barGroup: {
    display: "grid",
    gap: 8,
    marginTop: 12
  },
  barTrack: {
    height: 12,
    background: "#27272a",
    borderRadius: 999,
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    borderRadius: 999
  },
  transaction: {
    background: "#27272a",
    borderRadius: 18,
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10
  },
  amountBox: {
    textAlign: "right",
    display: "grid",
    gap: 6
  },
  deleteButton: {
    border: 0,
    borderRadius: 12,
    background: "#3f3f46",
    color: "white",
    padding: "7px 10px",
    fontWeight: 700
  },
  label: {
    display: "block",
    margin: "12px 0 6px",
    color: "#d4d4d8",
    fontWeight: 700,
    fontSize: 14
  },
  input: {
    width: "100%",
    minHeight: 50,
    borderRadius: 16,
    border: "1px solid #3f3f46",
    background: "#27272a",
    color: "white",
    padding: "0 12px",
    fontSize: 16
  },
  primaryButton: {
    width: "100%",
    minHeight: 50,
    border: 0,
    borderRadius: 16,
    background: "white",
    color: "#111",
    fontWeight: 900,
    marginTop: 16,
    fontSize: 16
  },
  secondaryButton: {
    width: "100%",
    minHeight: 50,
    border: 0,
    borderRadius: 16,
    background: "#3f3f46",
    color: "white",
    fontWeight: 900,
    marginTop: 16,
    fontSize: 16
  },
  nav: {
    position: "fixed",
    left: "50%",
    bottom: 14,
    transform: "translateX(-50%)",
    width: "min(430px, calc(100% - 32px))",
    background: "rgba(255,255,255,.96)",
    borderRadius: 26,
    padding: 8,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 6,
    boxShadow: "0 15px 50px rgba(0,0,0,.35)"
  },
  navButton: {
    border: 0,
    borderRadius: 18,
    background: "transparent",
    color: "#71717a",
    fontWeight: 900,
    minHeight: 52,
    display: "grid",
    placeItems: "center",
    fontSize: 18
  },
  activeNav: {
    border: 0,
    borderRadius: 18,
    background: "#111",
    color: "white",
    fontWeight: 900,
    minHeight: 52,
    display: "grid",
    placeItems: "center",
    fontSize: 18
  }
};

createRoot(document.getElementById("root")).render(<App />);
