import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const STORAGE_KEY = "my-money-real-app-v3";
const categories = ["Food", "Bills", "Gas", "Rent", "Fun", "Shopping", "Savings", "Other"];
const defaultBudgets = { Food: 400, Bills: 500, Gas: 200, Rent: 1200, Fun: 150, Shopping: 200, Savings: 650, Other: 100 };

const themes = {
  midnight: {
    name: "Midnight",
    page: "#0a0a0a",
    panel: "#18181b",
    panel2: "#27272a",
    border: "#2f2f35",
    text: "#ffffff",
    muted: "#a1a1aa",
    accent: "#ffffff",
    accentText: "#111111",
    danger: "#ef4444",
    warning: "#f59e0b",
    good: "#86efac"
  },
  blue: {
    name: "Blue Steel",
    page: "#07111f",
    panel: "#0f172a",
    panel2: "#1e293b",
    border: "#334155",
    text: "#eaf2ff",
    muted: "#93a4b8",
    accent: "#60a5fa",
    accentText: "#06111f",
    danger: "#fb7185",
    warning: "#fbbf24",
    good: "#5eead4"
  },
  green: {
    name: "Money Green",
    page: "#06130d",
    panel: "#102117",
    panel2: "#1f3528",
    border: "#31513d",
    text: "#f0fff5",
    muted: "#9db8a7",
    accent: "#86efac",
    accentText: "#06130d",
    danger: "#fb7185",
    warning: "#facc15",
    good: "#bbf7d0"
  },
  purple: {
    name: "Royal Purple",
    page: "#12091f",
    panel: "#221135",
    panel2: "#36214f",
    border: "#51306e",
    text: "#fff7ff",
    muted: "#bda7cf",
    accent: "#c084fc",
    accentText: "#160821",
    danger: "#fb7185",
    warning: "#fbbf24",
    good: "#86efac"
  },
  sunset: {
    name: "Sunset",
    page: "#190b08",
    panel: "#2a1410",
    panel2: "#44241b",
    border: "#63362a",
    text: "#fff7ed",
    muted: "#d6a58f",
    accent: "#fb923c",
    accentText: "#1b0b06",
    danger: "#f43f5e",
    warning: "#facc15",
    good: "#86efac"
  }
};

const starterData = {
  monthlyIncome: 3200,
  selectedMonth: new Date().toISOString().slice(0, 7),
  theme: "midnight",
  budgets: defaultBudgets,
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
    if (!saved) return starterData;
    const parsed = JSON.parse(saved);
    return { ...starterData, ...parsed, budgets: { ...defaultBudgets, ...(parsed.budgets || {}) }, theme: parsed.theme || "midnight" };
  } catch {
    return starterData;
  }
}

function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ type: "expense", amount: "", category: "Food", description: "", date: today() });
  const theme = themes[data.theme] || themes.midnight;
  const styles = makeStyles(theme);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const monthTransactions = useMemo(() => data.transactions.filter((item) => item.date.startsWith(data.selectedMonth)), [data.transactions, data.selectedMonth]);
  const filteredTransactions = monthTransactions.filter((item) => {
    const q = search.toLowerCase();
    return item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.type.toLowerCase().includes(q);
  });

  const expenses = monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const extraIncome = monthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = data.monthlyIncome + extraIncome;
  const left = totalIncome - expenses;
  const savedPercent = totalIncome > 0 ? Math.max(0, Math.min(100, Math.round((left / totalIncome) * 100))) : 0;

  const categoryTotals = categories.map((category) => {
    const total = monthTransactions.filter((item) => item.type === "expense" && item.category === category).reduce((sum, item) => sum + item.amount, 0);
    const budget = Number(data.budgets[category] || 0);
    const percent = budget > 0 ? Math.round((total / budget) * 100) : 0;
    return { category, total, budget, percent };
  });

  const activeCategoryTotals = categoryTotals.filter((item) => item.total > 0);
  const biggestCategory = [...activeCategoryTotals].sort((a, b) => b.total - a.total)[0];
  const overBudget = categoryTotals.filter((item) => item.budget > 0 && item.total > item.budget);
  const maxCategory = Math.max(...activeCategoryTotals.map((item) => item.total), 1);

  const resetForm = () => {
    setEditingId(null);
    setForm({ type: "expense", amount: "", category: "Food", description: "", date: today() });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({ type: item.type, amount: String(item.amount), category: item.category, description: item.description, date: item.date });
    setTab("add");
  };

  const saveTransaction = () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return;
    const item = { id: editingId || Date.now(), type: form.type, amount, category: form.type === "income" ? "Other" : form.category, description: form.description.trim() || (form.type === "income" ? "Income" : form.category), date: form.date || today() };

    setData(editingId
      ? { ...data, selectedMonth: item.date.slice(0, 7), transactions: data.transactions.map((transaction) => transaction.id === editingId ? item : transaction) }
      : { ...data, selectedMonth: item.date.slice(0, 7), transactions: [item, ...data.transactions] }
    );
    resetForm();
    setTab("home");
  };

  const deleteTransaction = (id) => setData({ ...data, transactions: data.transactions.filter((item) => item.id !== id) });

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-money-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main style={styles.page}>
      <section style={styles.phone}>
        <header style={styles.hero}>
          <div style={styles.topRow}>
            <div><p style={styles.kicker}>Budget Tracker</p><h1 style={styles.title}>My Money</h1></div>
            <div style={styles.icon}>💳</div>
          </div>

          <div style={styles.balanceCard}>
            <p style={styles.darkMuted}>Left this month</p>
            <h2 style={styles.balance}>{money(left)}</h2>
            <div style={styles.splitRow}><span>Income {money(totalIncome)}</span><span>Spent {money(expenses)}</span></div>
            <div style={styles.lightTrack}><div style={{ ...styles.darkFill, width: `${savedPercent}%` }} /></div>
            <small>{savedPercent}% of income left</small>
          </div>

          <input style={styles.monthInput} type="month" value={data.selectedMonth} onChange={(event) => setData({ ...data, selectedMonth: event.target.value })} />
        </header>

        {tab === "home" && (
          <>
            <section style={styles.statsGrid}>
              <div style={styles.card}><p style={styles.muted}>Safe daily spend</p><h3 style={styles.stat}>{money(Math.max(0, left / 30))}</h3></div>
              <div style={styles.card}><p style={styles.muted}>Transactions</p><h3 style={styles.stat}>{monthTransactions.length}</h3></div>
            </section>

            <section style={styles.whiteCard}>
              <p style={styles.insightTitle}>🧠 Smart insight</p>
              <p style={styles.insightText}>{overBudget.length ? `${overBudget[0].category} is over budget by ${money(overBudget[0].total - overBudget[0].budget)}.` : biggestCategory ? `Your biggest spending area is ${biggestCategory.category} at ${money(biggestCategory.total)}.` : "Add an expense to unlock spending insights."}</p>
            </section>

            <section style={styles.card}>
              <h3 style={styles.sectionTitle}>Budget warnings</h3>
              {categoryTotals.map((item) => (
                <div key={item.category} style={styles.barGroup}>
                  <div style={styles.splitRow}><span>{item.category}</span><strong>{money(item.total)} / {money(item.budget)}</strong></div>
                  <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${Math.min(100, item.percent)}%`, background: item.percent >= 100 ? theme.danger : item.percent >= 80 ? theme.warning : theme.accent }} /></div>
                </div>
              ))}
            </section>

            <section style={styles.card}>
              <h3 style={styles.sectionTitle}>Spending by category</h3>
              {activeCategoryTotals.length === 0 && <p style={styles.muted}>No category spending yet.</p>}
              {activeCategoryTotals.map((item, index) => (
                <div key={item.category} style={styles.barGroup}>
                  <div style={styles.splitRow}><span>{item.category}</span><strong>{money(item.total)}</strong></div>
                  <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${Math.max(8, (item.total / maxCategory) * 100)}%`, background: [theme.accent, theme.text, theme.muted, theme.border][index % 4] }} /></div>
                </div>
              ))}
            </section>

            <section style={styles.card}>
              <h3 style={styles.sectionTitle}>Recent transactions</h3>
              <input style={styles.input} placeholder="Search transactions" value={search} onChange={(event) => setSearch(event.target.value)} />
              {filteredTransactions.length === 0 && <p style={{ ...styles.muted, marginTop: 12 }}>No transactions found.</p>}
              {filteredTransactions.map((item) => (
                <div key={item.id} style={styles.transaction}>
                  <div><strong>{item.description}</strong><p style={styles.muted}>{item.type === "income" ? "Income" : item.category} • {item.date}</p></div>
                  <div style={styles.amountBox}>
                    <strong style={{ color: item.type === "income" ? theme.good : theme.text }}>{item.type === "income" ? "+" : "-"}{money(item.amount)}</strong>
                    <div style={styles.actionRow}><button style={styles.smallButton} onClick={() => startEdit(item)}>Edit</button><button style={styles.deleteButton} onClick={() => deleteTransaction(item.id)}>Delete</button></div>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === "add" && (
          <section style={styles.card}>
            <h3 style={styles.sectionTitle}>{editingId ? "Edit transaction" : "Add transaction"}</h3>
            <div style={styles.quickRow}>{[5, 10, 20, 50].map((value) => <button key={value} style={styles.quickButton} onClick={() => setForm({ ...form, amount: String(value) })}>{money(value)}</button>)}</div>
            <label style={styles.label}>Type</label><select style={styles.input} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select>
            <label style={styles.label}>Date</label><input style={styles.input} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            {form.type === "expense" && <><label style={styles.label}>Category</label><select style={styles.input} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></>}
            <label style={styles.label}>Amount</label><input style={styles.input} type="number" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
            <label style={styles.label}>Description</label><input style={styles.input} placeholder="Example: Groceries" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <button style={styles.primaryButton} onClick={saveTransaction}>{editingId ? "Save Changes" : "Save Transaction"}</button>
            {editingId && <button style={styles.secondaryButton} onClick={resetForm}>Cancel Edit</button>}
          </section>
        )}

        {tab === "settings" && (
          <section style={styles.card}>
            <h3 style={styles.sectionTitle}>Setup</h3>
            <label style={styles.label}>App color theme</label>
            <div style={styles.themeGrid}>
              {Object.entries(themes).map(([key, option]) => (
                <button key={key} style={data.theme === key ? styles.activeThemeButton : styles.themeButton} onClick={() => setData({ ...data, theme: key })}>
                  <span style={{ ...styles.themeDot, background: option.accent }} />
                  {option.name}
                </button>
              ))}
            </div>
            <label style={styles.label}>Monthly income</label><input style={styles.input} type="number" value={data.monthlyIncome} onChange={(event) => setData({ ...data, monthlyIncome: Number(event.target.value || 0) })} />
            <h3 style={{ ...styles.sectionTitle, marginTop: 18 }}>Category budgets</h3>
            {categories.map((category) => <div key={category}><label style={styles.label}>{category}</label><input style={styles.input} type="number" value={data.budgets[category] || 0} onChange={(event) => setData({ ...data, budgets: { ...data.budgets, [category]: Number(event.target.value || 0) } })} /></div>)}
            <button style={styles.primaryButton} onClick={exportBackup}>Export Backup</button>
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

function makeStyles(theme) {
  return {
    page: { minHeight: "100vh", background: theme.page, color: theme.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "16px 16px 110px", boxSizing: "border-box" },
    phone: { maxWidth: 430, margin: "0 auto", width: "100%" },
    hero: { background: `linear-gradient(135deg, ${theme.panel}, ${theme.panel2})`, border: `1px solid ${theme.border}`, borderRadius: 30, padding: 18, boxShadow: "0 18px 60px rgba(0,0,0,.35)" },
    topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
    kicker: { margin: 0, color: theme.muted, fontSize: 14 },
    title: { margin: "4px 0 0", fontSize: 34, letterSpacing: "-0.05em" },
    icon: { width: 54, height: 54, borderRadius: 18, background: theme.accent, color: theme.accentText, display: "grid", placeItems: "center", fontSize: 26 },
    balanceCard: { background: theme.accent, color: theme.accentText, borderRadius: 24, padding: 18, marginTop: 18 },
    darkMuted: { margin: 0, color: theme.accentText, opacity: 0.65, fontSize: 14 },
    balance: { margin: "4px 0 12px", fontSize: 42, letterSpacing: "-0.06em" },
    splitRow: { display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14, flexWrap: "wrap" },
    monthInput: { width: "100%", maxWidth: "100%", marginTop: 14, minHeight: 48, borderRadius: 16, border: `1px solid ${theme.border}`, background: theme.panel, color: theme.text, padding: "0 12px", fontSize: 16, boxSizing: "border-box", WebkitAppearance: "none", appearance: "none" },
    statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 },
    card: { background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 24, padding: 16, marginTop: 14 },
    whiteCard: { background: theme.accent, color: theme.accentText, borderRadius: 24, padding: 16, marginTop: 14 },
    muted: { margin: 0, color: theme.muted, fontSize: 13 },
    stat: { margin: "8px 0 0", fontSize: 24 },
    insightTitle: { margin: 0, fontWeight: 800 },
    insightText: { margin: "8px 0 0", color: theme.accentText, opacity: 0.75, fontSize: 14 },
    sectionTitle: { margin: "0 0 14px", fontSize: 20 },
    barGroup: { display: "grid", gap: 8, marginTop: 12 },
    barTrack: { height: 12, background: theme.panel2, borderRadius: 999, overflow: "hidden" },
    barFill: { height: "100%", borderRadius: 999 },
    lightTrack: { height: 10, background: "rgba(0,0,0,.18)", borderRadius: 999, overflow: "hidden", margin: "12px 0 6px" },
    darkFill: { height: "100%", background: theme.accentText, borderRadius: 999 },
    transaction: { background: theme.panel2, borderRadius: 18, padding: 12, display: "flex", justifyContent: "space-between", gap: 12, marginTop: 10 },
    amountBox: { textAlign: "right", display: "grid", gap: 6 },
    actionRow: { display: "flex", gap: 6, justifyContent: "flex-end" },
    smallButton: { border: 0, borderRadius: 12, background: theme.border, color: theme.text, padding: "7px 10px", fontWeight: 700 },
    deleteButton: { border: 0, borderRadius: 12, background: theme.border, color: theme.text, padding: "7px 10px", fontWeight: 700 },
    label: { display: "block", margin: "12px 0 6px", color: theme.text, fontWeight: 700, fontSize: 14 },
    input: { width: "100%", maxWidth: "100%", minHeight: 50, borderRadius: 16, border: `1px solid ${theme.border}`, background: theme.panel2, color: theme.text, padding: "0 12px", fontSize: 16, boxSizing: "border-box" },
    quickRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 },
    quickButton: { minHeight: 42, border: 0, borderRadius: 14, background: theme.panel2, color: theme.text, fontWeight: 800 },
    primaryButton: { width: "100%", minHeight: 50, border: 0, borderRadius: 16, background: theme.accent, color: theme.accentText, fontWeight: 900, marginTop: 16, fontSize: 16 },
    secondaryButton: { width: "100%", minHeight: 50, border: 0, borderRadius: 16, background: theme.border, color: theme.text, fontWeight: 900, marginTop: 10, fontSize: 16 },
    themeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
    themeButton: { minHeight: 46, border: `1px solid ${theme.border}`, borderRadius: 14, background: theme.panel2, color: theme.text, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
    activeThemeButton: { minHeight: 46, border: `2px solid ${theme.accent}`, borderRadius: 14, background: theme.panel2, color: theme.text, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
    themeDot: { width: 14, height: 14, borderRadius: 999, display: "inline-block" },
    nav: { position: "fixed", left: "50%", bottom: 14, transform: "translateX(-50%)", width: "min(430px, calc(100% - 32px))", background: theme.accent, borderRadius: 26, padding: 8, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, boxShadow: "0 15px 50px rgba(0,0,0,.35)", boxSizing: "border-box" },
    navButton: { border: 0, borderRadius: 18, background: "transparent", color: theme.accentText, opacity: 0.65, fontWeight: 900, minHeight: 52, display: "grid", placeItems: "center", fontSize: 18 },
    activeNav: { border: 0, borderRadius: 18, background: theme.accentText, color: theme.accent, fontWeight: 900, minHeight: 52, display: "grid", placeItems: "center", fontSize: 18 }
  };
}

createRoot(document.getElementById("root")).render(<App />);
