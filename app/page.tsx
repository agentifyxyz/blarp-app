"use client";
import { useState } from "react";
import TasksTab from "@/components/TasksTab";
import RewardsTab from "@/components/RewardsTab";
import CreateTab from "@/components/CreateTab";

type Tab = "tasks" | "rewards" | "create";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#000",
      maxWidth: "480px",
      margin: "0 auto",
      overflow: "hidden"
    }}>

      {/* Header — fixed height */}
      <div style={{
        padding: "20px 16px 12px",
        borderBottom: "1px solid #1f1f1f",
        flexShrink: 0
      }}>
        <h1 style={{ color: "#a855f7", fontSize: "24px", fontWeight: "bold", letterSpacing: "4px" }}>
          BLARP
        </h1>
        <p style={{ color: "#4b5563", fontSize: "11px", letterSpacing: "3px" }}>
          ENGAGE. EARN. REPEAT.
        </p>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeTab === "tasks" && <TasksTab />}
        {activeTab === "rewards" && <RewardsTab />}
        {activeTab === "create" && <CreateTab />}
      </div>

      {/* Bottom Nav — fixed height */}
      <div style={{
        display: "flex",
        borderTop: "1px solid #1f1f1f",
        background: "#000",
        flexShrink: 0
      }}>
        {(["tasks", "rewards", "create"] as Tab[]).map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "16px 0",
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              background: "none",
              border: "none",
              borderTop: activeTab === tab ? "2px solid #a855f7" : "2px solid transparent",
              color: activeTab === tab ? "#a855f7" : "#4b5563",
              cursor: "pointer"
            }}
          >
            {tab}{i < 2 ? " ⏩" : ""}
          </button>
        ))}
      </div>

    </div>
  );
}
