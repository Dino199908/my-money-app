import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

const STORAGE_KEY = "mobile-budget-tracker-v3";
const categories = ["Food", "Bills", "Gas", "Rent", "Fun", "Shopping", "Savings", "Other"];
const categoryColors = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#4B5563", "#1F2937", "#E5E7EB"];

const defaultData = {
  monthlyIncome: 3200,
  monthlyGoal: 650,
  selectedMonth: "2026-04",
  budgets: { Food: 400, Bills: 500, Gas: 180, Rent: 1200, Fun: 150, Shopping: 200, Savings: 650, Other: 100 },
  transactions: []
};

function money(v){return Number(v||0).toLocaleString("en-US",{style:"currency",currency:"USD"});}
function getToday(){return new Date().toISOString().slice(0,10);} 
function getMonth(){return new Date().toISOString().slice(0,7);} 

function App(){
  const [data,setData]=useState(()=>{
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{...defaultData,selectedMonth:getMonth()}}catch{return defaultData}
  });
  const [tab,setTab]=useState("dashboard");
  const [form,setForm]=useState({type:"expense",category:"Food",amount:"",desc:"",date:getToday()});

  useEffect(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));},[data]);

  const monthTx=data.transactions.filter(t=>t.date.startsWith(data.selectedMonth));
  const spent=monthTx.filter(t=>t.type==="expense").reduce((a,b)=>a+Number(b.amount),0);
  const income=monthTx.filter(t=>t.type==="income").reduce((a,b)=>a+Number(b.amount),0);
  const left=(data.monthlyIncome+income)-spent;

  const add=()=>{
    if(!form.amount) return;
    setData({...data,transactions:[{id:Date.now(),...form,amount:Number(form.amount)},...data.transactions]});
    setForm({type:"expense",category:"Food",amount:"",desc:"",date:getToday()});
    setTab("dashboard");
  };

  const chartData=Object.values(monthTx.filter(t=>t.type==="expense").reduce((acc,t)=>{
    acc[t.category]=(acc[t.category]||0)+t.amount;return acc;},{})
  ).map((v,i)=>({name:categories[i]||"Other",value:v}));

  return (
    <div style={{padding:20,fontFamily:"sans-serif",color:"white",background:"#111",minHeight:"100vh"}}>
      <h1>My Money</h1>
      <p>Left: {money(left)}</p>

      {tab==="dashboard"&&(
        <div>
          <button onClick={()=>setTab("add")}>Add</button>
          <div style={{height:200}}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value">
                  {chartData.map((_,i)=><Cell key={i} fill={categoryColors[i%categoryColors.length]} />)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab==="add"&&(
        <div>
          <input type="number" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
          <button onClick={add}>Save</button>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App/>);
