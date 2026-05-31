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
  const [fid, setFid] = useState<number | null>(null);
  // completedMask per campaign from backend
  const [completedMasks, setCompletedMasks] = useState<Record<number, number>>({});
  // locally tapped this session (before verify)
  const [tappedTasks, setTappedTasks] = useState<Record<number, Set<number>>>({});
  const [verifying, setVerifying] = useState<number | null>(null);

  useEffect(() => {
    sdk.context.then(async (ctx) => {
      const userFid = ctx?.user?.fid || null;
      setFid(userFid);

      const camps = await fetch(`${BACKEND}/campaigns`).then(r => r.json()).catch(() => []);
      setCampaigns(Array.isArray(camps) ? camps : []);
      setLoading(false);

      // Load existing engagements for this user
      if (userFid) {
        const rewards = await fetch(`${BACKEND}/rewards/${userFid}`).then(r => r.json()).catch(() => []);
        if (Array.isArray(rewards)) {
          const masks: Record<number, number> = {};
          rewards.forEach((r: any) => {
            masks[r.campaign_id] = r.completed_mask;
          });
          setCompletedMasks(masks);
        }
      }
    });
  }, []);

  const handleGoToTask = (campaignId: number, bit: number, castUrl: string) => {
    setTappedTasks((prev) => {
      const current = new Set(prev[campaignId] || []);
      current.add(bit);
      return { ...prev, [campaignId]: current };
    });
    sdk.actions.openUrl(castUrl);
  };

  const handleVerify = async (campaign: any) => {
    setVerifying(campaign.campaign_id);
    try {
      const tapped = tappedTasks[campaign.campaign_id] || new Set();
      const existing = completedMasks[campaign.campaign_id] || 0;
      let newMask = existing;
      tapped.forEach((bit) => { newMask |= bit; });
      const validMask = newMask & campaign.task_mask;
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

      setCompletedMasks(prev => ({ ...prev, [campaign.campaign_id]: validMask }));
      setTappedTasks(prev => ({ ...prev, [campaign.campaign_id]: new Set() }));
    } catch {}
    setVerifying(null);
  };

  if (loading) return (
    <div className="px-4 py-8 text-center text-gray-500 text-xs tracking-widest">LOADING...</div>
  );

  if (campaigns.length === 0) return (
    <div className="px-4 py-8 text-center text-gray-500 text-xs tracking-widest">NO ACTIVE CAMPAIGNS</div>
  );

  return (
    <div className="px-4 py-4 space-y-3">
      <p className="text-xs text-gray-500 tracking-widest uppercase">Active Campaigns</p>

      {campaigns.map((c) => {
        const tasks = maskToTasks(c.task_mask);
        const isSelected = selected === c.campaign_id;
        const tLeft = timeLeft(c.end_time);
        const tapped = tappedTasks[c.campaign_id] || new Set();
        const savedMask = completedMasks[c.campaign_id] || 0;
        const allDone = (savedMask & c.task_mask) === c.task_mask;
        // New tasks tapped this session not yet saved
        const pendingMask = (() => { let m = 0; tapped.forEach(b => m |= b); return m; })();
        const combinedMask = savedMask | pendingMask;
        const allTapped = tasks.every((bit) => (combinedMask & bit) !== 0);
        const hasPending = pendingMask > 0;

        return (
          <div
            key={c.campaign_id}
            className={`border rounded-lg p-4 transition-all ${
              isSelected ? "border-purple-500 bg-purple-500/5" : "border-gray-800"
            }`}
          >
            {/* Header */}
            <div className="cursor-pointer" onClick={() => setSelected(isSelected ? null : c.campaign_id)}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500">Campaign #{c.campaign_id}</span>
                <span className={`text-xs font-bold ${tLeft === "Expired" ? "text-red-500" : "text-purple-400"}`}>
                  ⏱ {tLeft}
                </span>
              </div>
              <div className="text-lg font-bold text-white mb-1">
                {Number(c.pool).toLocaleString()}{" "}
                <span className="text-purple-400 text-sm">$BLARP</span>
              </div>
              {!isSelected && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tasks.map((bit) => (
                    <span key={bit} className={`text-xs border rounded px-2 py-1 ${
                      (savedMask & bit) !== 0
                        ? "border-purple-500 text-purple-400"
                        : "border-gray-700 text-gray-400"
                    }`}>
                      {(savedMask & bit) !== 0 ? "✓ " : ""}{TASK_LABELS[bit]}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Expanded */}
            {isSelected && (
              <div className="mt-3 space-y-3">
                <a
                  href={c.cast_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-gray-700 rounded p-3 text-xs text-gray-400 hover:border-purple-500 transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-gray-600">Cast: </span>
                  <span className="text-purple-400 underline break-all">{c.cast_url}</span>
                </a>

                {allDone ? (
                  <div className="w-full text-center text-xs text-green-400 font-bold py-3 border border-green-400/30 rounded">
                    ✓ ALL TASKS COMPLETE — REWARD PENDING
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">
                      Complete each task then verify:
                    </p>
                    <div className="space-y-2">
                      {tasks.map((bit) => {
                        const done = (savedMask & bit) !== 0;
                        const justTapped = tapped.has(bit);
                        return (
                          <div key={bit} className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center text-xs flex-shrink-0 ${
                              done || justTapped
                                ? "border-purple-500 bg-purple-500/20 text-purple-400"
                                : "border-gray-700"
                            }`}>
                              {done || justTapped ? "✓" : ""}
                            </div>
                            <button
                              onClick={() => !done && handleGoToTask(c.campaign_id, bit, c.cast_url)}
                              disabled={done}
                              className={`flex-1 text-left px-3 py-2 rounded border text-xs font-bold transition-all ${
                                done
                                  ? "border-purple-500/50 bg-purple-500/5 text-purple-400 opacity-60"
                                  : justTapped
                                  ? "border-purple-500/50 bg-purple-500/5 text-purple-400"
                                  : "border-gray-700 text-gray-300 hover:border-purple-500"
                              }`}
                            >
                              {TASK_LABELS[bit]}
                              {!done && !justTapped && <span className="text-gray-600 ml-2">→ tap to open cast</span>}
                              {justTapped && !done && <span className="text-gray-600 ml-2">→ done?</span>}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {allTapped && hasPending && (
                      <button
                        onClick={() => handleVerify(c)}
                        disabled={verifying === c.campaign_id}
                        className="w-full bg-purple-600 text-white text-xs font-bold py-3 rounded tracking-widest disabled:opacity-50"
                      >
                        {verifying === c.campaign_id ? "SUBMITTING..." : "SUBMIT & VERIFY TASKS"}
                      </button>
                    )}

                    {!allTapped && (savedMask > 0 || pendingMask > 0) && (
                      <p className="text-xs text-gray-600 text-center">
                        {tasks.filter(b => (combinedMask & b) !== 0).length}/{tasks.length} tasks completed
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
