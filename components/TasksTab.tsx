"use client";
import { useEffect, useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

const TASK_LABELS: Record<number, string> = {
  1: "Like",
  2: "Recast",
  4: "Reply",
  8: "Quote",
};

function maskToTasks(mask: number): number[] {
  return [1, 2, 4, 8].filter((bit) => (mask & bit) !== 0);
}

function timeLeft(endTime: string): string {
  const now = Date.now();
  const diff = new Date(endTime).getTime() - now;
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function TasksTab() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${BACKEND}/campaigns`)
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="px-4 py-8 text-center text-gray-500 text-xs tracking-widest">
      LOADING...
    </div>
  );

  if (campaigns.length === 0) return (
    <div className="px-4 py-8 text-center text-gray-500 text-xs tracking-widest">
      NO ACTIVE CAMPAIGNS
    </div>
  );

  return (
    <div className="px-4 py-4 space-y-3">
      <p className="text-xs text-gray-500 tracking-widest uppercase">
        Active Campaigns
      </p>

      {campaigns.map((c) => {
        const tasks = maskToTasks(c.task_mask);
        const isSelected = selected === c.campaign_id;
        const tLeft = timeLeft(c.end_time);

        return (
          <div
            key={c.campaign_id}
            onClick={() => setSelected(isSelected ? null : c.campaign_id)}
            style={{ cursor: "pointer" }}
            className={`border rounded-lg p-4 transition-all ${
              isSelected
                ? "border-purple-500 bg-purple-500/5"
                : "border-gray-800"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-500">
                Campaign #{c.campaign_id}
              </span>
              <span className={`text-xs font-bold ${
                tLeft === "Expired" ? "text-red-500" : "text-purple-400"
              }`}>
                ⏱ {tLeft}
              </span>
            </div>

            <div className="text-lg font-bold text-white mb-1">
              {Number(c.pool).toLocaleString()}{" "}
              <span className="text-purple-400 text-sm">$BLARP</span>
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
                href={c.cast_url}
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
