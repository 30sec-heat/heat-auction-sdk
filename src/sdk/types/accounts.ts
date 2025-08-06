import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Account types based on the IDL
export interface AuctionData {
  creator: PublicKey;
  tokenMint: PublicKey;
  auctionDuration: BN;
  maxBidIncrement: BN;
  createdAt: BN;
  isInitialized: boolean;
  auctionActive: boolean;
  feeReceiver: PublicKey;
}

export interface AuctionState {
  tokenMint: PublicKey;
  creator: PublicKey;
  auctionData: PublicKey;
  startTime: BN;
  endTime: BN;
  maxBidIncrement: BN;
  isActive: boolean;
  isFinalized: boolean;
  legendaryTokens: BN;
  artefactTokens: BN;
  rareTokens: BN;
  magicTokens: BN;
  totalVolume: BN;
  isProcessing: boolean;
  processedSlots: BN;
}

export interface SlotBid {
  auctionData: PublicKey;
  slotId: BN;
  currentBidder: PublicKey | null;
  currentAmount: BN;
  timestamp: BN;
  distributed: boolean;
  claimable: boolean;
}

export interface Escrow {
  initialized: boolean;
  solTransferred: boolean;
  feesDistributed: boolean;
  tokensBurned: boolean;
} 