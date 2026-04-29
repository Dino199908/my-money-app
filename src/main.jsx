import React, { useState } from "react";
import { createRoot } from "react-dom/client";

function money(v) {
  return Number(v || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
}

function App() {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");

  const add = () => {
    if (!amount) return;
    setTransactions([{ id: Date.now(), amount: Number(amount) }, ...transactions]);
    setAmount("");
  };

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div style={{ padding: 20, background: "#111", color: "white", minHeight: "100vh" }}>
      <h1>My Money</h1>

      <h2>Left: {money(3200 - total)}</h2>

      <div style={{ marginTop: 20 }}>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          style={{ padding: 10, marginRight: 10 }}
        />
        <button onClick={add}>Add</button>
      </div>

      <div style={{ marginTop: 20 }}>
        {transactions.map(t => (
          <div key={t.id}>
            - {money(t.amount)}
          </div>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
