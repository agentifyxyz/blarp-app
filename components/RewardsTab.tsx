"use client";
import { useState } from "react";

const MOCK_REWARDS = [
  {
    id: 1,
    taskMask: 15,
    completedMask: 15,
    settled: true,
    claimed: false,
    reward: "47,619",
  },
  {
    id: 2,
    taskMask: 3,
    completedMask: 1,
    settled: false,
    claimed: false,
    reward: "—",
  },
  {
    id: 3,
    taskMask: 6,
    completedMask: 6,
    settled: true,
    claimed: true,
    reward: "333,333",
  },
];

const TASK_LABELS: Record<number, string> = {
  1: "Like",
  2: "Recast",
  4: "Reply",
  8: "Quote",
};

function maskToTasks(mask: number): number[] {
  return [1, 2, 4, 8].filter((bit) => (mask & bit) !== 0);
}

function completionScore(completed: number, total: number): string {
  const c = [1, 2, 4, 8].filter((b) => (completed & b) !== 0).length;
  const t = [1, 2, 4, 8].filter((b) => (total & b) !== 0).length;
  return `${c}/${t} tasks`;
}

export default function RewardsTab() {
  const [claiming, setClaiming] = useState(false);
  const [rewards, setRewards] = useState(MOCK_REWARDS);

  const claimable = rewards.filter((r) => r.settled && !r.claimed);
  const totalPending = claimable.reduce(
    (acc, r) => acc + parseInt(r.reward.replace(/,/g, "") || "0"),
    0
  );
  const totalEarned = rewards
    .filter((r) => r.claimed)
    .reduce((acc, r) => acc + parseInt(r.reward.replace(/,/g, "") || "0"), 0);

  const handleClaimAll = async () => {
    setClaiming(true);
    // TODO: loop claimReward(id) for each claimable campaign
    setTimeout(() => {
      setRewards((prev) =>
        prev.map((r) =>
          r.settled && !r.claimed ? { ...r, claimed: true } : r
        )
      );
      setClaiming(false);
    }, 2000);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
            Pending
          </p>
          <p className="text-lg font-bold text-purple-400">
            {totalPending.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600">$BLARP</p>
        </div>
        <div className="border border-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
            Earned
          </p>
          <p className="text-lg font-bold text-green-400">
            {totalEarned.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600">$BLARP</p>
        </div>
      </div>

      {/* Claim All Button */}
      {claimable.length > 0 && (
        <button
          onClick={handleClaimAll}
          disabled={claiming}
          className="w-full bg-purple-600 text-white text-xs font-bold py-3 rounded tracking-widest disabled:opacity-50 transition-all"
        >
          {claiming
            ? "CLAIMING..."
            : `CLAIM ALL (${claimable.length} campaign${claimable.length > 1 ? "s" : ""})`}
        </button>
      )}

      <p className="text-xs text-gray-500 tracking-widest uppercase">
        Your Campaigns
      </p>

      {rewards.map((r) => (
        <div
          key={r.id}
          className="border border-gray-800 rounded-lg p-4 space-y-2"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Campaign #{r.id}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              r.claimed
                ? "bg-gray-800 text-gray-500"
                : r.settled
                ? "bg-purple-500/10 text-purple-400"
                : "bg-gray-800 text-gray-400"
            }`}>
              {r.claimed ? "CLAIMED" : r.settled ? "CLAIMABLE" : "PENDING"}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {maskToTasks(r.taskMask).map((bit) => (
              <span
                key={bit}
                className={`text-xs px-2 py-0.5 rounded border ${
                  (r.completedMask & bit) !== 0
                    ? "border-purple-500 text-purple-400"
                    : "border-gray-700 text-gray-600"
                }`}
              >
                {TASK_LABELS[bit]}
              </span>
            ))}
            <span className="text-xs text-gray-500 self-center">
              {completionScore(r.completedMask, r.taskMask)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Reward</span>
            <span className="text-sm font-bold text-white">
              {r.reward}{" "}
              <span className="text-purple-400 text-xs">$BLARP</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
