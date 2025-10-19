// Contract addresses on Stellar Testnet
export const CONTRACTS = {
  FACTORY: 'CAY6MSYRJCJLVLPNK2KESEEAIRCKZ7A3BCQTROCATKS5ZBFXUJSNSQIA',
  XLM_TOKEN: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  CAMPAIGN_WASM_HASH_HEX: '1d2ffcd587471c38c00b1bfa10c2baf26cd4147cef4b9703658d466c50c405f0',
} as const;

// Convert hex string to Buffer for contract calls
export function getCampaignWasmHash(): Buffer {
  return Buffer.from(CONTRACTS.CAMPAIGN_WASM_HASH_HEX, 'hex');
}

export const NETWORK = {
  name: 'Testnet',
  passphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org',
} as const;

// Campaign categories
export const CATEGORIES = [
  { value: 'tech', label: 'Technology' },
  { value: 'edu', label: 'Education' },
  { value: 'health', label: 'Health' },
  { value: 'community', label: 'Community' },
  { value: 'env', label: 'Environment' },
  { value: 'arts', label: 'Arts & Culture' },
  { value: 'emergency', label: 'Emergency' },
] as const;

// Minimum values
export const MIN_GOAL_XLM = 10;
export const MIN_DONATION_XLM = 0.1;

// XLM conversion (1 XLM = 10^7 stroops)
export const STROOPS_PER_XLM = 10_000_000;

// Helper functions
export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.floor(xlm * STROOPS_PER_XLM));
}

export function stroopsToXlm(stroops: bigint | string | number): number {
  const stroopsNum = typeof stroops === 'bigint' ? Number(stroops) : Number(stroops);
  return stroopsNum / STROOPS_PER_XLM;
}

export function formatXlm(stroops: bigint | string | number): string {
  return stroopsToXlm(stroops).toFixed(2);
}
