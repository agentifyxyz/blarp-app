"use client";
import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

const TASK_LABELS: Record<number, string> = {
  1: "Like", 2: "Recast", 4: "Reply", 8: "Quote",
};

function maskToTasks(mask: number): number[] {
  return [1, 2, 4, 8].filter((bit) => (mask & bit) !== 0);
}

function completionScore(completed: number, total: number): string {
  const c = [1,2,4,8].filter((b) => (completed & b) !== 0).length;
  const t = [1,2,4,8].filter((b) => (total & b) !== 0).length;
  return `${c}/${t} tasks`;
}

export default function RewardsTab() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [fid, setFid] = useState<number | null>(null);

  useEffect(() => {
    sdk.context.then((ctx) => {
      const userFid = ctx?.user?.fid;
      if (!userFid) { setLoading(false); return; }
      setFid(userFid);
      fetch(`${BACKEND}/rewards/${userFid}`)
        .then((r) => r.json())
        .then((data) => {
          setRewards(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, []);

  const claimable = rewards.filter((r) => r.campaigns?.settled && !r.claimed);
  const totalPending = claimable.reduce((acc, r) => acc + Number(r.reward || 0), 0);
  const totalEarned = rewards
    .filter((r) => r.claimed)
    .reduce((acc, r) => acc + Number(r.reward || 0), 0);

  const handleClaimAll = async () => {
    setClaiming(true);
    // TODO: call claimReward for each claimable campaign via wallet
    setTimeout(() => setClaiming(false), 2000);
  };

  if (loading) return (
    <div className="px-4 py-8 text-center text-gray-500 text-xs tracking-widest">
      LOADING...
    </div>
  );

  if (!fid) return (
    <div className="px-4 py-8 text-center text-gray-500 text-xs tracking-widest">
      CONNECT FARCASTER TO VIEW REWARDS
    </div>
  );

  if (rewards.length === 0) return (
    <div className="px-4 py-8 text-center text-gray-500 text-xs tracking-widest">
      NO REWARDS YET — GO COMPLETE SOME TASKS
    </div>
  );

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-lg font-bold text-purple-400">{totalPending.toLocaleString()}</p>
          <p className="text-xs text-gray-600">$BLARP</p>
        </div>
        <div className="border border-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Earned</p>
          <p className="text-lg font-bold text-green-400">{totalEarned.toLocaleString()}</p>
          <p className="text-xs text-gray-600">$BLARP</p>
        </div>
      </div>

      {claimable.length > 0 && (
        <button
          onClick={handleClaimAll}
          disabled={claiming}
          className="w-full bg-purple-600 text-white text-xs font-bold py-3 rounded tracking-widest disabled:opacity-50"
        >
          {claiming ? "CLAIMING..." : `CLAIM ALL (${claimable.length} campaign${claimable.length > 1 ? "s" : ""})`}
        </button>
      )}

      <p className="text-xs text-gray-500 tracking-widest uppercase">Your Campaigns</p>

      {rewards.map((r) => (
        <div key={r.id} className="border border-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Campaign #{r.campaign_id}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              r.claimed ? "bg-gray-800 text-gray-500"
              : r.campaigns?.settled ? "bg-purple-500/10 text-purple-400"
              : "bg-gray-800 text-gray-400"
            }`}>
              {r.claimed ? "CLAIMED" : r.campaigns?.settled ? "CLAIMABLE" : "PENDING"}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {maskToTasks(r.campaigns?.task_mask || 0).map((bit) => (
              <span key={bit} className={`text-xs px-2 py-0.5 rounded border ${
                (r.completed_mask & bit) !== 0
                  ? "border-purple-500 text-purple-400"
                  : "border-gray-700 text-gray-600"
              }`}>
                {TASK_LABELS[bit]}
              </span>
            ))}
            <span className="text-xs text-gray-500 self-center">
              {completionScore(r.completed_mask, r.campaigns?.task_mask || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Reward</span>
            <span className="text-sm font-bold text-white">
              {r.reward ? Number(r.reward).toLocaleString() : "—"}{" "}
              <span className="text-purple-400 text-xs">$BLARP</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
