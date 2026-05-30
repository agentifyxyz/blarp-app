"use client";
import { useState } from "react";

const TASK_LABELS: Record<number, string> = {
  1: "👍 Like",
  2: "🔁 Recast",
  4: "💬 Reply",
  8: "🔗 Quote",
};

function maskToTasks(mask: number): number[] {
  return [1, 2, 4, 8].filter((bit) => (mask & bit) !== 0);
}

function timeLeft(endTime: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = endTime - now;
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
}

const MOCK_CAMPAIGNS = [
  {
    id: 1,
    castUrl: "https://farcaster.xyz/~/conversations/0x123",
    pool: "2,000,000",
    engagers: 42,
    taskMask: 15,
    endTime: Math.floor(Date.now() / 1000) + 3600 * 5,
  },
  {
    id: 2,
    castUrl: "https://farcaster.xyz/~/conversations/0x456",
    pool: "500,000",
    engagers: 8,
    taskMask: 3,
    endTime: Math.floor(Date.now() / 1000) + 3600 * 12,
  },
  {
    id: 3,
    castUrl: "https://farcaster.xyz/~/conversations/0x789",
    pool: "1,000,000",
    engagers: 3,
    taskMask: 6,
    endTime: Math.floor(Date.now() / 1000) + 3600 * 2,
  },
];

export default function TasksTab() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="px-4 py-4 space-y-3">
      <p className="text-xs text-gray-500 tracking-widest uppercase">
        Active Campaigns
      </p>

      {MOCK_CAMPAIGNS.map((c) => {
        const tasks = maskToTasks(c.taskMask);
        const isSelected = selected === c.id;

        return (
          <div
            key={c.id}
            onClick={() => setSelected(isSelected ? null : c.id)}
            className={`border rounded-lg p-4 cursor-pointer transition-all
              ${isSelected
                ? "border-purple-500 bg-purple-500/5"
                : "border-gray-800 hover:border-gray-600"
              }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-500">Campaign #{c.id}</span>
              <span className={`text-xs font-bold ${
                timeLeft(c.endTime) === "Expired"
                  ? "text-red-500"
                  : "text-purple-400"
              }`}>
                ⏱ {timeLeft(c.endTime)}
              </span>
            </div>

            <div className="text-lg font-bold text-white mb-1">
              {c.pool} <span className="text-purple-400 text-sm">$BLARP</span>
            </div>

            <div className="text-xs text-gray-500 mb-3">
              {c.engagers} engagers — your cut:{" "}
              <span className="text-white">
                ~{Math.floor(
                  parseInt(c.pool.replace(/,/g, "")) / (c.engagers + 1)
                ).toLocaleString()} $BLARP
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {tasks.map((bit) => (
                <span
                  key={bit}
                  className="text-xs border border-gray-700 rounded px-2 py-1 text-gray-300"
                >
                  {TASK_LABELS[bit]}
                </span>
              ))}
            </div>

            {isSelected && (
              <a
                href={c.castUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-purple-600 text-white text-xs font-bold py-2 rounded mt-2 tracking-widest"
                onClick={(e) => e.stopPropagation()}
              >
                GO TO CAST ↗
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
