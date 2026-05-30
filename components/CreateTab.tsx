"use client";
import { useState } from "react";

const TASKS = [
  { bit: 1, label: "Like" },
  { bit: 2, label: "Recast" },
  { bit: 4, label: "Reply" },
  { bit: 8, label: "Quote" },
];

const DURATIONS = [
  { label: "1 Hour", seconds: 3600 },
  { label: "6 Hours", seconds: 21600 },
  { label: "12 Hours", seconds: 43200 },
  { label: "24 Hours", seconds: 86400 },
  { label: "3 Days", seconds: 259200 },
  { label: "7 Days", seconds: 604800 },
];

export default function CreateTab() {
  const [castUrl, setCastUrl] = useState("");
  const [pool, setPool] = useState("");
  const [taskMask, setTaskMask] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleTask = (bit: number) => {
    setTaskMask((prev) => (prev & bit ? prev & ~bit : prev | bit));
  };

  const selectedTasks = TASKS.filter((t) => (taskMask & t.bit) !== 0);
  const poolNum = parseInt(pool || "0");
  const MIN_POOL = 500000;
  const valid =
    castUrl.length > 0 &&
    poolNum >= MIN_POOL &&
    taskMask > 0 &&
    duration > 0;

  const handleCreate = async () => {
    if (!valid) return;
    setError("");
    setLoading(true);
    // TODO:
    // 1. Connect wallet
    // 2. approve BLARP_TOKEN for escrow contract
    // 3. call createCampaign(pool, duration, taskMask)
    // 4. store castUrl + campaignId in backend
    setTimeout(() => {
      setLoading(false);
      setError("Wallet connection coming soon.");
    }, 1000);
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <p className="text-xs text-gray-500 tracking-widest uppercase">
        Create Campaign
      </p>

      {/* Cast URL */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400 uppercase tracking-widest">
          Cast URL
        </label>
        <input
          type="text"
          value={castUrl}
          onChange={(e) => setCastUrl(e.target.value)}
          placeholder="https://farcaster.xyz/~/conversations/0x..."
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Pool Amount */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400 uppercase tracking-widest">
          Pool Amount (min 500,000 $BLARP)
        </label>
        <input
          type="number"
          value={pool}
          onChange={(e) => setPool(e.target.value)}
          placeholder="500000"
          min={500000}
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />
        {poolNum > 0 && poolNum < MIN_POOL && (
          <p className="text-xs text-red-500">Minimum is 500,000 $BLARP</p>
        )}
      </div>

      {/* Task Selection */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-widest">
          Required Tasks
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TASKS.map((t) => {
            const active = (taskMask & t.bit) !== 0;
            return (
              <button
                key={t.bit}
                onClick={() => toggleTask(t.bit)}
                className={`py-2 px-3 rounded border text-xs font-bold transition-all
                  ${active
                    ? "border-purple-500 bg-purple-500/10 text-purple-400"
                    : "border-gray-700 text-gray-500 hover:border-gray-500"
                  }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {selectedTasks.length > 0 && (
          <p className="text-xs text-gray-500">
            {selectedTasks.length} task{selectedTasks.length > 1 ? "s" : ""} required — partial completion = smaller reward
          </p>
        )}
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-widest">
          Duration
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.seconds}
              onClick={() => setDuration(d.seconds)}
              className={`py-2 rounded border text-xs font-bold transition-all
                ${duration === d.seconds
                  ? "border-purple-500 bg-purple-500/10 text-purple-400"
                  : "border-gray-700 text-gray-500 hover:border-gray-500"
                }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {valid && (
        <div className="border border-gray-800 rounded-lg p-3 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Summary
          </p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Pool</span>
            <span className="text-purple-400 font-bold">
              {parseInt(pool).toLocaleString()} $BLARP
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Tasks</span>
            <span className="text-white">
              {selectedTasks.map((t) => t.label).join(", ")}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Duration</span>
            <span className="text-white">
              {DURATIONS.find((d) => d.seconds === duration)?.label}
            </span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={!valid || loading}
        className="w-full bg-purple-600 text-white font-bold py-3 rounded tracking-widest text-sm disabled:opacity-30 transition-all"
      >
        {loading ? "PROCESSING..." : "LAUNCH CAMPAIGN"}
      </button>
    </div>
  );
}
