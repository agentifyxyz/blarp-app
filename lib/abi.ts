export const ESCROW_ABI = [
  {
    "inputs": [{"internalType": "address","name": "_blarpToken","type": "address"},{"internalType": "uint256","name": "_minPool","type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "uint256","name": "pool","type": "uint256"},{"internalType": "uint256","name": "duration","type": "uint256"},{"internalType": "uint8","name": "taskMask","type": "uint8"}],
    "name": "createCampaign",
    "outputs": [{"internalType": "uint256","name": "id","type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "id","type": "uint256"}],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "id","type": "uint256"}],
    "name": "settleCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "id","type": "uint256"},{"internalType": "address","name": "engager","type": "address"},{"internalType": "uint8","name": "completedMask","type": "uint8"}],
    "name": "recordEngagement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "id","type": "uint256"}],
    "name": "getCampaign",
    "outputs": [{"components": [{"internalType": "address","name": "creator","type": "address"},{"internalType": "uint256","name": "pool","type": "uint256"},{"internalType": "uint256","name": "startTime","type": "uint256"},{"internalType": "uint256","name": "endTime","type": "uint256"},{"internalType": "uint8","name": "totalTasks","type": "uint8"},{"internalType": "bool","name": "settled","type": "bool"},{"internalType": "uint256","name": "totalWeightedScore","type": "uint256"},{"internalType": "uint8","name": "taskMask","type": "uint8"}],"internalType": "struct BlarpEscrow.Campaign","name": "","type": "tuple"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "id","type": "uint256"},{"internalType": "address","name": "engager","type": "address"}],
    "name": "getPendingReward",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "id","type": "uint256"},{"internalType": "address","name": "engager","type": "address"}],
    "name": "getEngagement",
    "outputs": [{"components": [{"internalType": "uint8","name": "completedMask","type": "uint8"},{"internalType": "bool","name": "claimed","type": "bool"}],"internalType": "struct BlarpEscrow.Engagement","name": "","type": "tuple"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "id","type": "uint256"}],
    "name": "getEngagerCount",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "campaignCount",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minPool",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true,"internalType": "uint256","name": "id","type": "uint256"},{"indexed": true,"internalType": "address","name": "creator","type": "address"},{"indexed": false,"internalType": "uint256","name": "pool","type": "uint256"},{"indexed": false,"internalType": "uint256","name": "endTime","type": "uint256"},{"indexed": false,"internalType": "uint8","name": "taskMask","type": "uint8"}],
    "name": "CampaignCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true,"internalType": "uint256","name": "id","type": "uint256"},{"indexed": true,"internalType": "address","name": "engager","type": "address"},{"indexed": false,"internalType": "uint256","name": "amount","type": "uint256"}],
    "name": "RewardClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true,"internalType": "uint256","name": "id","type": "uint256"},{"indexed": false,"internalType": "uint256","name": "totalWeightedScore","type": "uint256"}],
    "name": "CampaignSettled",
    "type": "event"
  }
] as const;

export const BLARP_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address","name": "spender","type": "address"},{"internalType": "uint256","name": "amount","type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool","name": "","type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "account","type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "owner","type": "address"},{"internalType": "address","name": "spender","type": "address"}],
    "name": "allowance",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
