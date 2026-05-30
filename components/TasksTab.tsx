"use client";
import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";

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
  // Track completed tasks per campaign: { [campaignId]: completedMask }
  const [completedTasks, setCompletedTasks] = useState<Record<number, number>>({});
  const [verifying, setVerifying] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${BACKEND}/campaigns`)
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleTask = (campaignId: number, bit: number) => {
    setCompletedTasks((prev) => {
      const current = prev[campaignId] || 0;
      const updated = current & bit ? current & ~bit : current | bit;
      return { ...prev, [campaignId]: updated };
    });
  };

  const handleVerify = async (campaign: any) => {
    setVerifying(campaign.campaign_id);
    try {
      const ctx = await sdk.context;
      const fid = ctx?.user?.fid;
      if (!fid) { setVerifying(null); return; }

      const completed = completedTasks[campaign.campaign_id] || 0;
      // Only send tasks that are part of campaign task_mask
      const validMask = completed & campaign.task_mask;
      if (!validMask) { setVerifying(null); return; }

      await fetch(`${BACKEND}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaign.campaign_id,
          engager_fid: fid,
          completed_mask: validMask,
        }),
      });

      // Mark as fully verified locally
      setCompletedTasks((prev) => ({
        ...prev,
        [campaign.campaign_id]: campaign.task_mask,
      }));
    } catch {}
    setVerifying(null);
  };

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
        const completed = completedTasks[c.campaign_id] || 0;
        const allDone = (completed & c.task_mask) === c.task_mask;

        return (
          <div
            key={c.campaign_id}
            className={`border rounded-lg p-4 transition-all ${
              isSelected
                ? "border-purple-500 bg-purple-500/5"
                : "border-gray-800"
            }`}
          >
            {/* Header */}
            <div
              className="cursor-pointer"
              onClick={() => setSelected(isSelected ? null : c.campaign_id)}
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
            </div>

            {/* Tasks checkboxes */}
            {isSelected && (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-widest">
                  Mark tasks you completed:
                </p>
                <div className="space-y-2">
                  {tasks.map((bit) => {
                    const done = (completed & bit) !== 0;
                    return (
                      <div
                        key={bit}
                        className="flex items-center justify-between"
                      >
                        <button
                          onClick={() => toggleTask(c.campaign_id, bit)}
                          className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded border transition-all flex-1 ${
                            done
                              ? "border-purple-500 bg-purple-500/10 text-purple-400"
                              : "border-gray-700 text-gray-500"
                          }`}
                        >
                          <span>{done ? "✓" : "○"}</span>
                          {TASK_LABELS[bit]}
                        </button>
                        {!done && (
                          <a
                            href={c.cast_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-xs text-purple-400 border border-purple-500 px-2 py-2 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            GO ↗
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Verify button — shows only if some tasks checked and not all verified */}
                {completed > 0 && !allDone && (
                  <button
                    onClick={() => handleVerify(c)}
                    disabled={verifying === c.campaign_id}
                    className="w-full bg-purple-600 text-white text-xs font-bold py-2 rounded tracking-widest disabled:opacity-50 mt-2"
                  >
                    {verifying === c.campaign_id ? "VERIFYING..." : "VERIFY TASKS"}
                  </button>
                )}

                {/* All done state */}
                {allDone && (
                  <div className="w-full text-center text-xs text-green-400 font-bold py-2 border border-green-400/30 rounded">
                    ✓ ALL TASKS COMPLETE — REWARD PENDING
                  </div>
                )}
              </div>
            )}

            {/* Collapsed state — show task pills */}
            {!isSelected && (
              <div
                className="flex flex-wrap gap-2 mt-2 cursor-pointer"
                onClick={() => setSelected(c.campaign_id)}
              >
                {tasks.map((bit) => {
                  const done = (completed & bit) !== 0;
                  return (
                    <span
                      key={bit}
                      className={`text-xs border rounded px-2 py-1 ${
                        done
                          ? "border-purple-500 text-purple-400"
                          : "border-gray-700 text-gray-400"
                      }`}
                    >
                      {done ? "✓ " : ""}{TASK_LABELS[bit]}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
