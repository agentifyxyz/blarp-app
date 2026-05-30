"use client";
import { useState, useEffect } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { encodeFunctionData, createPublicClient, http } from "viem";
import { base } from "viem/chains";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
const ESCROW = process.env.NEXT_PUBLIC_ESCROW_CONTRACT as `0x${string}`;
const BLARP_TOKEN = process.env.NEXT_PUBLIC_BLARP_TOKEN as `0x${string}`;
const BASE_CHAIN_ID = "0x2105";

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

const TOKEN_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const ESCROW_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "pool", type: "uint256" },
      { internalType: "uint256", name: "duration", type: "uint256" },
      { internalType: "uint8", name: "taskMask", type: "uint8" },
    ],
    name: "createCampaign",
    outputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const publicClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

export default function CreateTab() {
  const [castUrl, setCastUrl] = useState("");
  const [pool, setPool] = useState("");
  const [taskMask, setTaskMask] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fid, setFid] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    sdk.context.then((ctx) => {
      setFid(ctx?.user?.fid || null);
    });
    sdk.wallet.ethProvider
      .request({ method: "eth_requestAccounts" })
      .then((accounts: any) => setAddress(accounts[0] || null))
      .catch(() => {});
  }, []);

  const toggleTask = (bit: number) => {
    setTaskMask((prev) => (prev & bit ? prev & ~bit : prev | bit));
  };

  const selectedTasks = TASKS.filter((t) => (taskMask & t.bit) !== 0);
  const poolNum = parseInt(pool || "0");
  const MIN_POOL = 500000;
  const valid = castUrl.length > 0 && poolNum >= MIN_POOL && taskMask > 0 && duration > 0;

  const handleCreate = async () => {
    if (!valid || !address || !fid) {
      setError("Wallet not connected or invalid input.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const provider = sdk.wallet.ethProvider;

      // Switch to Base
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_CHAIN_ID }],
      });

      const poolWei = BigInt(poolNum) * BigInt(10 ** 18);

      // 1. Approve
      const approveData = encodeFunctionData({
        abi: TOKEN_ABI,
        functionName: "approve",
        args: [ESCROW, poolWei],
      });

      const approveTx = await provider.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to: BLARP_TOKEN,
          data: approveData,
          chainId: BASE_CHAIN_ID,
        }],
      });

      await publicClient.waitForTransactionReceipt({ hash: approveTx as `0x${string}` });

      // 2. Create campaign
      const createData = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: "createCampaign",
        args: [poolWei, BigInt(duration), taskMask],
      });

      const createTx = await provider.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to: ESCROW,
          data: createData,
          chainId: BASE_CHAIN_ID,
        }],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: createTx as `0x${string}` });

      // 3. Register in backend
      const endTime = new Date(Date.now() + duration * 1000).toISOString();
      await fetch(`${BACKEND}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: Number(receipt.blockNumber),
          creator_fid: fid,
          creator_address: address,
          cast_url: castUrl,
          pool: poolNum,
          task_mask: taskMask,
          duration,
          end_time: endTime,
          tx_hash: createTx,
        }),
      });

      setSuccess("Campaign launched! 🎉");
      setCastUrl(""); setPool(""); setTaskMask(0); setDuration(0);
    } catch (err: any) {
      setError(err.message || "Transaction failed.");
    }
    setLoading(false);
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <p className="text-xs text-gray-500 tracking-widest uppercase">Create Campaign</p>

      {address && (
        <p className="text-xs text-purple-400">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      )}

      <div className="space-y-1">
        <label className="text-xs text-gray-400 uppercase tracking-widest">Cast URL</label>
        <input
          type="text"
          value={castUrl}
          onChange={(e) => setCastUrl(e.target.value)}
          placeholder="https://farcaster.xyz/~/conversations/0x..."
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-gray-400 uppercase tracking-widest">Pool Amount (min 500,000 $BLARP)</label>
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

      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-widest">Required Tasks</label>
        <div className="grid grid-cols-2 gap-2">
          {TASKS.map((t) => {
            const active = (taskMask & t.bit) !== 0;
            return (
              <button
                key={t.bit}
                onClick={() => toggleTask(t.bit)}
                className={`py-2 px-3 rounded border text-xs font-bold transition-all ${
                  active
                    ? "border-purple-500 bg-purple-500/10 text-purple-400"
                    : "border-gray-700 text-gray-500"
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

      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-widest">Duration</label>
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.seconds}
              onClick={() => setDuration(d.seconds)}
              className={`py-2 rounded border text-xs font-bold transition-all ${
                duration === d.seconds
                  ? "border-purple-500 bg-purple-500/10 text-purple-400"
                  : "border-gray-700 text-gray-500"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {valid && (
        <div className="border border-gray-800 rounded-lg p-3 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Summary</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Pool</span>
            <span className="text-purple-400 font-bold">{parseInt(pool).toLocaleString()} $BLARP</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Tasks</span>
            <span className="text-white">{selectedTasks.map((t) => t.label).join(", ")}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Duration</span>
            <span className="text-white">{DURATIONS.find((d) => d.seconds === duration)?.label}</span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-400">{success}</p>}

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
