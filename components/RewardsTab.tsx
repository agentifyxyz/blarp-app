"use client";
import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { encodeFunctionData } from "viem";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
const ESCROW = process.env.NEXT_PUBLIC_ESCROW_CONTRACT as `0x${string}`;

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

const ESCROW_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "settleCampaign",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export default function RewardsTab() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fid, setFid] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [settling, setSettling] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    sdk.context.then((ctx) => {
      setFid(ctx?.user?.fid || null);
    });
    sdk.wallet.ethProvider
      .request({ method: "eth_requestAccounts" })
      .then((accounts: any) => setAddress(accounts[0] || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!fid) return;
    fetch(`${BACKEND}/rewards/${fid}`)
      .then((r) => r.json())
      .then((data) => {
        setRewards(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fid]);

  const totalPending = rewards
    .filter((r) => r.campaigns?.settled && !r.claimed)
    .reduce((acc, r) => acc + Number(r.reward || 0), 0);

  const totalEarned = rewards
    .filter((r) => r.claimed)
    .reduce((acc, r) => acc + Number(r.reward || 0), 0);

  const sendTx = async (data: `0x${string}`) => {
    const provider = sdk.wallet.ethProvider;
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x2105" }],
    });
    return provider.request({
      method: "eth_sendTransaction",
      params: [{ from: address, to: ESCROW, data, chainId: "0x2105" }],
    });
  };

  const handleSettle = async (campaignId: number) => {
    if (!address) return;
    setSettling(campaignId);
    setError("");
    try {
      const data = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: "settleCampaign",
        args: [BigInt(campaignId)],
      });
      const hash = await sendTx(data);
      console.log("Settled:", hash);
      window.location.reload();
    } catch (err: any) {
      setError(err.message?.slice(0, 100) || "Settle failed");
    }
    setSettling(null);
  };

  const handleClaim = async (campaignId: number) => {
    if (!address) return;
    setClaiming(campaignId);
    setError("");
    try {
      const data = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: "claimReward",
        args: [BigInt(campaignId)],
      });
      const hash = await sendTx(data);
      console.log("Claimed:", hash);
      setRewards((prev) =>
        prev.map((r) =>
          r.campaign_id === campaignId ? { ...r, claimed: true } : r
        )
      );
    } catch (err: any) {
      setError(err.message?.slice(0, 100) || "Claim failed");
    }
    setClaiming(null);
  };

  if (loading) return (
    <div className="px-4 py-8 text-center text-gray-500 text-xs tracking-widest">LOADING...</div>
  );

  if (!fid) return (
    <div className="px-4 py-8 text-center text-gray-500 text-xs tracking-widest">CONNECT FARCASTER TO VIEW REWARDS</div>
  );

  if (rewards.length === 0) return (
    <div className="px-4 py-8 text-center text-gray-500 text-xs tracking-widest">NO REWARDS YET — COMPLETE SOME TASKS</div>
  );

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Summary */}
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

      {error && <p className="text-xs text-red-500 break-all">{error}</p>}

      <p className="text-xs text-gray-500 tracking-widest uppercase">Your Campaigns</p>

      {rewards.map((r) => {
        const settled = r.campaigns?.settled;
        const expired = r.campaigns?.end_time && new Date(r.campaigns.end_time) < new Date();

        return (
          <div key={r.id} className="border border-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Campaign #{r.campaign_id}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                r.claimed ? "bg-gray-800 text-gray-500"
                : settled ? "bg-purple-500/10 text-purple-400"
                : expired ? "bg-yellow-500/10 text-yellow-400"
                : "bg-gray-800 text-gray-400"
              }`}>
                {r.claimed ? "CLAIMED" : settled ? "CLAIMABLE" : expired ? "EXPIRED" : "ACTIVE"}
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

            {/* Settle button — show if expired but not settled */}
            {expired && !settled && !r.claimed && (
              <button
                onClick={() => handleSettle(r.campaign_id)}
                disabled={settling === r.campaign_id}
                className="w-full bg-gray-700 text-white text-xs font-bold py-2 rounded tracking-widest disabled:opacity-50"
              >
                {settling === r.campaign_id ? "SETTLING..." : "SETTLE CAMPAIGN"}
              </button>
            )}

            {/* Claim button */}
            {settled && !r.claimed && (
              <button
                onClick={() => handleClaim(r.campaign_id)}
                disabled={claiming === r.campaign_id}
                className="w-full bg-purple-600 text-white text-xs font-bold py-2 rounded tracking-widest disabled:opacity-50"
              >
                {claiming === r.campaign_id ? "CLAIMING..." : "CLAIM REWARD"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
