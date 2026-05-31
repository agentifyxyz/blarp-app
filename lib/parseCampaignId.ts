import { decodeEventLog } from "viem";

const CAMPAIGN_CREATED_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "pool", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "endTime", type: "uint256" },
      { indexed: false, internalType: "uint8", name: "taskMask", type: "uint8" },
    ],
    name: "CampaignCreated",
    type: "event",
  },
] as const;

export function parseCampaignId(receipt: any): number | null {
  try {
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: CAMPAIGN_CREATED_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "CampaignCreated") {
          return Number(decoded.args.id);
        }
      } catch {}
    }
  } catch {}
  return null;
}
