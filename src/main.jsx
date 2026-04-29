import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const categories = ["Food", "Bills", "Gas", "Rent", "Fun", "Shopping", "Savings", "Other"];
const defaultBudgets = { Food: 400, Bills: 500, Gas: 200, Rent: 1200, Fun: 150, Shopping: 200, Savings: 650, Other: 100 };

const themes = {
  midnight: { name: "Midnight", bg: "#070707", card: "#151518", soft: "#222228", line: "#303038", text: "#ffffff", muted: "#a3a3ad", accent: "#ffffff", accentText: "#090909", good: "#86efac", warn: "#fbbf24", bad: "#fb7185" },
  blue: { name: "Blue", bg: "#07111f", card: "#0f172a", soft: "#1e293b", line: "#334155", text: "#eaf2ff", muted: "#93a4b8", accent: "#60a5fa", accentText: "#06111f", good: "#5eead4", warn: "#fbbf24", bad: "#fb7185" },
  green: { name: "Green", bg: "#06130d", card: "#102117", soft: "#1f3528", line: "#31513d", text: "#f0fff5", muted: "#9db8a7", accent: "#86efac", accentText: "#06130d", good: "#bbf7d0", warn: "#facc15", bad: "#fb7185" },
  purple: { name: "Purple", bg: "#12091f", card: "#221135", soft: "#36214f", line: "#51306e", text: "#fff7ff", muted: "#bda7cf", accent: "#c084fc", accentText: "#160821", good: "#86efac", warn: "#fbbf24", bad: "#fb7185" }
};

function money(value) {
  return Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function newBudgetCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [budget, setBudget] = useState(null);
  const [budgetCode, setBudgetCode] = useState("");
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ type: "expense", amount: "", category: "Food", description: "", date: today() });

  const theme = themes[budget?.theme || "midnight"] || themes.midnight;
  const styles = makeStyles(theme);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user || !supabase) return;
    loadMyBudget(session.user.id);
  }, [session?.user?.id]);

  useEffect(() => {
    if (!budget?.id || !supabase) return;
    loadMembers(budget.id);
    const channel = supabase
      .channel(`budget-${budget.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `budget_id=eq.${budget.id}` }, () => loadBudgetData(budget.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets", filter: `id=eq.${budget.id}` }, () => loadBudgetData(budget.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "budget_members", filter: `budget_id=eq.${budget.id}` }, () => loadMembers(budget.id))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [budget?.id]);

  async function loadMyBudget(userId) {
    const { data: membership } = await supabase.from("budget_members").select("budget_id").eq("user_id", userId).limit(1).maybeSingle();
    if (membership?.budget_id) await loadBudgetData(membership.budget_id);
    else await createBudget();
  }

  async function loadBudgetData(budgetId) {
    const { data: budgetRow } = await supabase.from("budgets").select("*").eq("id", budgetId).single();
    if (!budgetRow) return;
    const { data: transactions } = await supabase.from("transactions").select("*").eq("budget_id", budgetId).order("date", { ascending: false }).order("created_at", { ascending: false });
    setBudget({ ...budgetRow, transactions: transactions || [] });
  }

  async function loadMembers(budgetId) {
    const { data } = await supabase.from("budget_members").select("user_email, role").eq("budget_id", budgetId).order("created_at", { ascending: true });
    setMembers(data || []);
  }

  async function createBudget() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { data: created, error } = await supabase.from("budgets").insert({ name: "My Money", monthly_income: 3200, selected_month: currentMonth(), theme: "midnight", budgets: defaultBudgets, share_code: newBudgetCode(), owner_id: user.id }).select().single();
    if (error || !created) { alert(error?.message || "Could not create budget."); return; }
    await supabase.from("budget_members").insert({ budget_id: created.id, user_id: user.id, user_email: user.email || "User", role: "owner" });
    await loadBudgetData(created.id);
  }

  async function signInWithPassword() {
    if (!email || !password) { setAuthMessage("Enter your email and password."); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthMessage(error ? error.message : "Signed in.");
  }

  async function createAccount() {
    if (!email || !password) { setAuthMessage("Enter your email and password."); return; }
    if (password.length < 6) { setAuthMessage("Password must be at least 6 characters."); return; }
    const { error } = await supabase.auth.signUp({ email, password });
    setAuthMessage(error ? error.message : "Account created. Tap Sign In if needed.");
  }

  async function joinBudget() {
    const code = budgetCode.trim().toUpperCase();
    if (!code || !session?.user) return;
    const { data: found, error } = await supabase.from("budgets").select("id").eq("share_code", code).single();
    if (error || !found) { alert("Budget code not found."); return; }
    await supabase.from("budget_members").upsert({ budget_id: found.id, user_id: session.user.id, user_email: session.user.email || "User", role: "editor" }, { onConflict: "budget_id,user_id" });
    await loadBudgetData(found.id);
  }

  async function updateBudget(patch) {
    if (!budget?.id) return;
    setBudget({ ...budget, ...patch });
    await supabase.from("budgets").update(patch).eq("id", budget.id);
  }

  const monthTransactions = useMemo(() => !budget ? [] : (budget.transactions || []).filter((item) => item.date.startsWith(budget.selected_month)), [budget]);
  const filteredTransactions = monthTransactions.filter((item) => {
    const q = search.toLowerCase();
    return item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.type.toLowerCase().includes(q);
  });
  const expenses = monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const extraIncome = monthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const totalIncome = Number(budget?.monthly_income || 0) + extraIncome;
  const left = totalIncome - expenses;
  const usedPercent = totalIncome > 0 ? Math.max(0, Math.min(100, Math.round((expenses / totalIncome) * 100))) : 0;
  const categoryTotals = categories.map((category) => {
    const total = monthTransactions.filter((item) => item.type === "expense" && item.category === category).reduce((sum, item) => sum + Number(item.amount), 0);
    const budgetLimit = Number((budget?.budgets || defaultBudgets)[category] || 0);
    const percent = budgetLimit > 0 ? Math.round((total / budgetLimit) * 100) : 0;
    return { category, total, budget: budgetLimit, percent };
  });
  const activeCategoryTotals = categoryTotals.filter((item) => item.total > 0);
  const biggestCategory = [...activeCategoryTotals].sort((a, b) => b.total - a.total)[0];
  const overBudget = categoryTotals.filter((item) => item.budget > 0 && item.total > item.budget);
  const maxCategory = Math.max(...activeCategoryTotals.map((item) => item.total), 1);

  function resetForm() { setEditingId(null); setForm({ type: "expense", amount: "", category: "Food", description: "", date: today() }); }
  function startEdit(item) { setEditingId(item.id); setForm({ type: item.type, amount: String(item.amount), category: item.category, description: item.description, date: item.date }); setTab("add"); }

  async function saveTransaction() {
    const amount = Number(form.amount);
    if (!amount || amount <= 0 || !budget?.id) return;
    const item = { budget_id: budget.id, type: form.type, amount, category: form.type === "income" ? "Other" : form.category, description: form.description.trim() || (form.type === "income" ? "Income" : form.category), date: form.date || today() };
    if (editingId) await supabase.from("transactions").update(item).eq("id", editingId).eq("budget_id", budget.id);
    else await supabase.from("transactions").insert(item);
    resetForm();
    setTab("home");
    await loadBudgetData(budget.id);
  }

  async function deleteTransaction(id) {
    await supabase.from("transactions").delete().eq("id", id).eq("budget_id", budget.id);
    await loadBudgetData(budget.id);
  }

  async function shareBudget() {
    const text = `Join my shared budget in My Money. Code: ${budget.share_code}`;
    if (navigator.share) await navigator.share({ title: "Join My Money Budget", text });
    else { await navigator.clipboard.writeText(text); alert("Share code copied."); }
  }

  if (!supabase) return <main style={{ padding: 20, background: "#111", color: "white", minHeight: "100vh" }}><h1>Supabase is not connected</h1><p>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.</p></main>;

  if (!session) return (
    <main style={styles.page} translate="no" className="notranslate">
      <section style={styles.phone}>
        <section style={styles.loginCard}>
          <div style={styles.appBadge}>💳</div>
          <p style={styles.kicker}>Shared Budget</p>
          <h1 style={styles.loginTitle}>My Money</h1>
          <p style={styles.muted}>Sign in to sync budgets across phones.</p>
          <label style={styles.label}>Email</label>
          <input style={styles.input} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" />
          <button style={styles.primaryButton} onClick={signInWithPassword}>Sign In</button>
          <button style={styles.secondaryButton} onClick={createAccount}>Create Account</button>
          {authMessage && <p style={{ ...styles.muted, marginTop: 12 }}>{authMessage}</p>}
        </section>
      </section>
    </main>
  );

  if (!budget) return <main style={styles.page}><section style={styles.phone}><section style={styles.card}>Loading budget...</section></section></main>;

  return (
    <main style={styles.page} translate="no" className="notranslate">
      <section style={styles.phone}>
        <header style={styles.hero}>
          <div style={styles.topRow}>
            <div><p style={styles.kicker}>Shared Budget</p><h1 style={styles.title}>{budget.name}</h1></div>
            <button style={styles.iconButton} onClick={shareBudget}>↗</button>
          </div>
          <div style={styles.balanceCard}>
            <p style={styles.darkMuted}>Left this month</p>
            <h2 style={styles.balance}>{money(left)}</h2>
            <div style={styles.splitRow}><span>Income {money(totalIncome)}</span><span>Spent {money(expenses)}</span></div>
            <div style={styles.lightTrack}><div style={{ ...styles.darkFill, width: `${usedPercent}%` }} /></div>
            <small>{usedPercent}% of income spent</small>
          </div>
          <input style={styles.monthInput} type="month" value={budget.selected_month} onChange={(event) => updateBudget({ selected_month: event.target.value })} />
        </header>

        {tab === "home" && <>
          <section style={styles.installCard}><div><strong>👥 Live shared budget</strong><p style={styles.muted}>Code: {budget.share_code}</p></div><button style={styles.smallButton} onClick={shareBudget}>Share</button></section>
          <div style={styles.joinRow}><input style={styles.input} value={budgetCode} onChange={(e) => setBudgetCode(e.target.value)} placeholder="Join code" /><button style={styles.smallButton} onClick={joinBudget}>Join</button></div>
          <section style={styles.statsGrid}><div style={styles.card}><p style={styles.muted}>Safe daily spend</p><h3 style={styles.stat}>{money(Math.max(0, left / 30))}</h3></div><div style={styles.card}><p style={styles.muted}>Transactions</p><h3 style={styles.stat}>{monthTransactions.length}</h3></div></section>
          <section style={styles.whiteCard}><p style={styles.insightTitle}>🧠 Smart insight</p><p style={styles.insightText}>{overBudget.length ? `${overBudget[0].category} is over budget by ${money(overBudget[0].total - overBudget[0].budget)}.` : biggestCategory ? `Your biggest spending area is ${biggestCategory.category} at ${money(biggestCategory.total)}.` : "Add an expense to unlock spending insights."}</p></section>
          <section style={styles.card}><h3 style={styles.sectionTitle}>Budget warnings</h3>{categoryTotals.map((item) => <div key={item.category} style={styles.barGroup}><div style={styles.splitRow}><span>{item.category}</span><strong>{money(item.total)} / {money(item.budget)}</strong></div><div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${Math.min(100, item.percent)}%`, background: item.percent >= 100 ? theme.bad : item.percent >= 80 ? theme.warn : theme.accent }} /></div></div>)}</section>
          <section style={styles.card}><h3 style={styles.sectionTitle}>Spending by category</h3>{activeCategoryTotals.length === 0 && <p style={styles.muted}>No category spending yet.</p>}{activeCategoryTotals.map((item, index) => <div key={item.category} style={styles.barGroup}><div style={styles.splitRow}><span>{item.category}</span><strong>{money(item.total)}</strong></div><div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${Math.max(8, (item.total / maxCategory) * 100)}%`, background: [theme.accent, theme.text, theme.muted, theme.line][index % 4] }} /></div></div>)}</section>
          <section style={styles.card}><h3 style={styles.sectionTitle}>Recent transactions</h3><input style={styles.input} placeholder="Search transactions" value={search} onChange={(event) => setSearch(event.target.value)} />{filteredTransactions.length === 0 && <p style={{ ...styles.muted, marginTop: 12 }}>No transactions found.</p>}{filteredTransactions.map((item) => <div key={item.id} style={styles.transaction}><div><strong>{item.description}</strong><p style={styles.muted}>{item.type === "income" ? "Income" : item.category} • {item.date}</p></div><div style={styles.amountBox}><strong style={{ color: item.type === "income" ? theme.good : theme.text }}>{item.type === "income" ? "+" : "-"}{money(item.amount)}</strong><div style={styles.actionRow}><button style={styles.smallButton} onClick={() => startEdit(item)}>Edit</button><button style={styles.deleteButton} onClick={() => deleteTransaction(item.id)}>Delete</button></div></div></div>)}</section>
          <section style={styles.card}><h3 style={styles.sectionTitle}>Members</h3>{members.map((m) => <p key={m.user_email} style={styles.muted}>{m.user_email} • {m.role}</p>)}</section>
        </>}

        {tab === "add" && <section style={styles.card}><h3 style={styles.sectionTitle}>{editingId ? "Edit transaction" : "Add transaction"}</h3><div style={styles.quickRow}>{[5, 10, 20, 50].map((value) => <button key={value} style={styles.quickButton} onClick={() => setForm({ ...form, amount: String(value) })}>{money(value)}</button>)}</div><label style={styles.label}>Type</label><select style={styles.input} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select><label style={styles.label}>Date</label><input style={styles.input} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />{form.type === "expense" && <><label style={styles.label}>Category</label><select style={styles.input} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></>}<label style={styles.label}>Amount</label><input style={styles.input} type="number" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /><label style={styles.label}>Description</label><input style={styles.input} placeholder="Example: Groceries" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><button style={styles.primaryButton} onClick={saveTransaction}>{editingId ? "Save Changes" : "Save Transaction"}</button>{editingId && <button style={styles.secondaryButton} onClick={resetForm}>Cancel Edit</button>}</section>}

        {tab === "settings" && <section style={styles.card}><h3 style={styles.sectionTitle}>Setup</h3><label style={styles.label}>Theme</label><div style={styles.themeGrid}>{Object.entries(themes).map(([key, option]) => <button key={key} style={budget.theme === key ? styles.activeThemeButton : styles.themeButton} onClick={() => updateBudget({ theme: key })}><span style={{ ...styles.themeDot, background: option.accent }} />{option.name}</button>)}</div><label style={styles.label}>Monthly income</label><input style={styles.input} type="number" value={budget.monthly_income} onChange={(event) => updateBudget({ monthly_income: Number(event.target.value || 0) })} /><h3 style={{ ...styles.sectionTitle, marginTop: 18 }}>Category budgets</h3>{categories.map((category) => <div key={category}><label style={styles.label}>{category}</label><input style={styles.input} type="number" value={(budget.budgets || defaultBudgets)[category] || 0} onChange={(event) => updateBudget({ budgets: { ...(budget.budgets || defaultBudgets), [category]: Number(event.target.value || 0) } })} /></div>)}<button style={styles.secondaryButton} onClick={() => supabase.auth.signOut()}>Sign Out</button></section>}
      </section>

      <nav style={styles.nav}><button style={tab === "home" ? styles.activeNav : styles.navButton} onClick={() => setTab("home")}>🏠<span>Home</span></button><button style={tab === "add" ? styles.activeNav : styles.navButton} onClick={() => setTab("add")}>➕<span>Add</span></button><button style={tab === "settings" ? styles.activeNav : styles.navButton} onClick={() => setTab("settings")}>⚙️<span>Setup</span></button></nav>
    </main>
  );
}

function makeStyles(t) {
  return {
    page: { minHeight: "100vh", background: `radial-gradient(circle at top, ${t.soft}, ${t.bg} 38%)`, color: t.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "16px 16px 110px", boxSizing: "border-box" },
    phone: { maxWidth: 430, margin: "0 auto", width: "100%" },
    hero: { background: `linear-gradient(145deg, ${t.card}, ${t.soft})`, border: `1px solid ${t.line}`, borderRadius: 32, padding: 18, boxShadow: "0 24px 70px rgba(0,0,0,.42)" },
    loginCard: { background: `linear-gradient(145deg, ${t.card}, ${t.soft})`, border: `1px solid ${t.line}`, borderRadius: 32, padding: 22, boxShadow: "0 24px 70px rgba(0,0,0,.42)", marginTop: 16 },
    appBadge: { width: 62, height: 62, borderRadius: 22, background: t.accent, color: t.accentText, display: "grid", placeItems: "center", fontSize: 30, marginBottom: 16 },
    topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
    kicker: { margin: 0, color: t.muted, fontSize: 14 },
    title: { margin: "4px 0 0", fontSize: 34, letterSpacing: "-0.055em" },
    loginTitle: { margin: "4px 0 6px", fontSize: 42, letterSpacing: "-0.065em" },
    iconButton: { width: 50, height: 50, borderRadius: 18, border: 0, background: t.accent, color: t.accentText, fontWeight: 900, fontSize: 24 },
    balanceCard: { background: t.accent, color: t.accentText, borderRadius: 26, padding: 18, marginTop: 18, boxShadow: "inset 0 -20px 60px rgba(0,0,0,.08)" },
    darkMuted: { margin: 0, color: t.accentText, opacity: 0.62, fontSize: 14 },
    balance: { margin: "4px 0 12px", fontSize: 44, letterSpacing: "-0.07em", lineHeight: 1 },
    splitRow: { display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14, flexWrap: "wrap" },
    monthInput: { width: "100%", maxWidth: "100%", marginTop: 14, minHeight: 48, borderRadius: 18, border: `1px solid ${t.line}`, background: t.card, color: t.text, padding: "0 12px", fontSize: 16, boxSizing: "border-box", WebkitAppearance: "none", appearance: "none" },
    installCard: { background: "rgba(255,255,255,.04)", border: `1px solid ${t.line}`, borderRadius: 24, padding: 14, marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, backdropFilter: "blur(18px)" },
    joinRow: { display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 10 },
    statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 },
    card: { background: "rgba(255,255,255,.045)", border: `1px solid ${t.line}`, borderRadius: 26, padding: 16, marginTop: 14, backdropFilter: "blur(18px)" },
    whiteCard: { background: t.accent, color: t.accentText, borderRadius: 26, padding: 16, marginTop: 14 },
    muted: { margin: 0, color: t.muted, fontSize: 13 },
    stat: { margin: "8px 0 0", fontSize: 25, letterSpacing: "-0.04em" },
    insightTitle: { margin: 0, fontWeight: 900 },
    insightText: { margin: "8px 0 0", color: t.accentText, opacity: 0.78, fontSize: 14 },
    sectionTitle: { margin: "0 0 14px", fontSize: 20, letterSpacing: "-0.03em" },
    barGroup: { display: "grid", gap: 8, marginTop: 12 },
    barTrack: { height: 12, background: t.soft, borderRadius: 999, overflow: "hidden" },
    barFill: { height: "100%", borderRadius: 999 },
    lightTrack: { height: 10, background: "rgba(0,0,0,.18)", borderRadius: 999, overflow: "hidden", margin: "12px 0 6px" },
    darkFill: { height: "100%", background: t.accentText, borderRadius: 999 },
    transaction: { background: t.soft, borderRadius: 20, padding: 12, display: "flex", justifyContent: "space-between", gap: 12, marginTop: 10 },
    amountBox: { textAlign: "right", display: "grid", gap: 6 },
    actionRow: { display: "flex", gap: 6, justifyContent: "flex-end" },
    smallButton: { border: 0, borderRadius: 14, background: t.line, color: t.text, padding: "8px 11px", fontWeight: 800 },
    deleteButton: { border: 0, borderRadius: 14, background: t.line, color: t.text, padding: "8px 11px", fontWeight: 800 },
    label: { display: "block", margin: "12px 0 6px", color: t.text, fontWeight: 800, fontSize: 14 },
    input: { width: "100%", maxWidth: "100%", minHeight: 52, borderRadius: 18, border: `1px solid ${t.line}`, background: t.soft, color: t.text, padding: "0 13px", fontSize: 16, boxSizing: "border-box", outline: "none" },
    quickRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 },
    quickButton: { minHeight: 44, border: 0, borderRadius: 16, background: t.soft, color: t.text, fontWeight: 900 },
    primaryButton: { width: "100%", minHeight: 52, border: 0, borderRadius: 18, background: t.accent, color: t.accentText, fontWeight: 950, marginTop: 16, fontSize: 16 },
    secondaryButton: { width: "100%", minHeight: 52, border: 0, borderRadius: 18, background: t.line, color: t.text, fontWeight: 900, marginTop: 10, fontSize: 16 },
    themeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
    themeButton: { minHeight: 48, border: `1px solid ${t.line}`, borderRadius: 16, background: t.soft, color: t.text, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
    activeThemeButton: { minHeight: 48, border: `2px solid ${t.accent}`, borderRadius: 16, background: t.soft, color: t.text, fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
    themeDot: { width: 14, height: 14, borderRadius: 999, display: "inline-block" },
    nav: { position: "fixed", left: "50%", bottom: 14, transform: "translateX(-50%)", width: "min(430px, calc(100% - 32px))", background: t.accent, borderRadius: 28, padding: 8, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, boxShadow: "0 18px 55px rgba(0,0,0,.40)", boxSizing: "border-box" },
    navButton: { border: 0, borderRadius: 20, background: "transparent", color: t.accentText, opacity: 0.62, fontWeight: 950, minHeight: 54, display: "grid", placeItems: "center", fontSize: 18 },
    activeNav: { border: 0, borderRadius: 20, background: t.accentText, color: t.accent, fontWeight: 950, minHeight: 54, display: "grid", placeItems: "center", fontSize: 18 }
  };
}

const rootElement = document.getElementById("root");
rootElement.setAttribute("translate", "no");
rootElement.className = "notranslate";
let appMount = document.getElementById("app-mount");
if (!appMount) {
  appMount = document.createElement("div");
  appMount.id = "app-mount";
  appMount.setAttribute("translate", "no");
  appMount.className = "notranslate";
  rootElement.replaceChildren(appMount);
}
createRoot(appMount).render(<App />);
