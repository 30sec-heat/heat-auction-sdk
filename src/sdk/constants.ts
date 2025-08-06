import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

// Program IDs
export const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || '9Ky8dWgozFkGQJBUfrgEy3zxbMmXdX5XYCV6FL4VUXjC'
);
export const FEE_RECEIVER_PUBKEY = new PublicKey(
  process.env.FEE_RECEIVER_PUBKEY || '9YVR7r8XrS9zQUTWR2jNfWMSMHVyoQus2ro5fTMwaDqA'
);
export const TREASURY_AUTHORITY_PUBKEY = new PublicKey(
  process.env.TREASURY_AUTHORITY_PUBKEY || 'GLqrCSL5wMvZjpPUbhcGKSBjfk1HzxRo3N81mr2adPvt'
);

// For v3 of mpl-token-metadata
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  process.env.TOKEN_METADATA_PROGRAM_ID || 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

// Program Constants
export const CONSTANTS = {
  REQUIRED_MAX_SUPPLY: new BN(760_000_000).mul(new BN(10).pow(new BN(9))), // 760M tokens
  MIN_ACTIVE_BID_SOL: new BN(0.001 * LAMPORTS_PER_SOL),
  MAX_BID_INCREMENT: new BN(5000 * LAMPORTS_PER_SOL),
  BID_FEE: new BN(0.00001 * LAMPORTS_PER_SOL),
  MAX_SLOTS: 300,
  MIN_BID_AMOUNT: new BN(0.0001 * LAMPORTS_PER_SOL),
  MAX_BID_AMOUNT: new BN(5000 * LAMPORTS_PER_SOL),
  MIN_BID_INCREMENT: new BN(0.01 * LAMPORTS_PER_SOL),
  TOKEN_DECIMALS: 9,
  MIN_SUCCESSFUL_RAISE: new BN(50 * LAMPORTS_PER_SOL),
  PROTOCOL_FEE_BPS: new BN(50), // 0.5%
  BASIS_POINTS_DIVISOR: new BN(10_000),
  MAX_AUCTION_EXTENSION: new BN(3600), // 1 hour
  CREATION_FEE: new BN(0.005 * LAMPORTS_PER_SOL),
  CLAIM_PERIOD_DAYS: 1095, // 3 years
};

// Auction Duration Options
export enum AuctionDuration {
  ONE_MINUTE = 0,
  ONE_HOUR = 1,
  ONE_DAY = 2,
} 