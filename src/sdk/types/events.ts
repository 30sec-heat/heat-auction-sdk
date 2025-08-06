import { PublicKey } from '@solana/web3.js';

// Base event interface
export interface BaseAuctionEvent {
  type: string;
  auction: string;
  tokenMint: string;
  timestamp: number;
}

// Individual event interfaces with clean string/number types
export interface AuctionInitializedEvent extends BaseAuctionEvent {
  type: 'AuctionInitialized';
  creator: string;
  tokenName: string;
  tokenSymbol: string;
  tokenUri: string;
  auctionDuration: number;
  maxBidIncrement: string;
  legendaryTokens: string;
  artefactTokens: string;
  rareTokens: string;
  magicTokens: string;
}

export interface BidPlacedEvent extends BaseAuctionEvent {
  type: 'BidPlaced';
  bidder: string;
  slotId: number;
  amount: string;
}

export interface AuctionExtendedEvent extends BaseAuctionEvent {
  type: 'AuctionExtended';
  newEndTime: number;
}

export interface AuctionEndedEvent extends BaseAuctionEvent {
  type: 'AuctionEnded';
}

export interface RefundProcessedEvent extends BaseAuctionEvent {
  type: 'RefundProcessed';
  bidder: string;
  amount: string;
}

export interface TokensDistributedEvent extends BaseAuctionEvent {
  type: 'TokensDistributed';
  recipient: string;
  slotId: number;
  amount: string;
}

export interface TokensBurnedEvent extends BaseAuctionEvent {
  type: 'TokensBurned';
  amount: string;
}

export interface SlotMarkedClaimableEvent extends BaseAuctionEvent {
  type: 'SlotMarkedClaimable';
  slotId: number;
  bidder: string;
  amount: string;
  claimType: string;
}

export interface AuctionTypeDecidedEvent extends BaseAuctionEvent {
  type: 'AuctionTypeDecided';
  isSuccessful: boolean;
  totalRaised: string;
  minimumRequired: string;
}

export interface SolTransferredToTreasuryEvent extends BaseAuctionEvent {
  type: 'SolTransferredToTreasury';
  amount: string;
}

export interface ProtocolFeesDistributedEvent extends BaseAuctionEvent {
  type: 'ProtocolFeesDistributed';
  feeReceiver: string;
  amount: string;
}

export interface TokensClaimedEvent extends BaseAuctionEvent {
  type: 'TokensClaimed';
  recipient: string;
  slotId: number;
  amount: string;
}

export interface RefundClaimedEvent extends BaseAuctionEvent {
  type: 'RefundClaimed';
  recipient: string;
  slotId: number;
  amount: string;
}

export interface AuctionAccountsClosedEvent extends BaseAuctionEvent {
  type: 'AuctionAccountsClosed';
  rentRecovered: string;
}

export interface AuctionWrapUpEvent extends BaseAuctionEvent {
  type: 'AuctionWrapUp';
  amount: string;
  lamportsRecovered: string;
  protocolProfit: string;
}

export interface AuctionFinalizedEvent extends BaseAuctionEvent {
  type: 'AuctionFinalized';
  totalVolume: string;
}

export interface UnclaimedFundsSweptEvent extends BaseAuctionEvent {
  type: 'UnclaimedFundsSwept';
  treasuryAuthority: string;
  tokensBurned: string;
  solTransferred: string;
}

// Union type of all events
export type AllAuctionEvents = 
  | AuctionInitializedEvent
  | BidPlacedEvent
  | AuctionExtendedEvent
  | AuctionEndedEvent
  | RefundProcessedEvent
  | TokensDistributedEvent
  | TokensBurnedEvent
  | SlotMarkedClaimableEvent
  | AuctionTypeDecidedEvent
  | SolTransferredToTreasuryEvent
  | ProtocolFeesDistributedEvent
  | TokensClaimedEvent
  | RefundClaimedEvent
  | AuctionAccountsClosedEvent
  | AuctionWrapUpEvent
  | AuctionFinalizedEvent
  | UnclaimedFundsSweptEvent;

// Event filter type
export interface EventFilter {
  auctionData?: PublicKey;
  eventType?: AllAuctionEvents['type'];
}

// Event callback type
export type EventCallback = (event: AllAuctionEvents) => void;