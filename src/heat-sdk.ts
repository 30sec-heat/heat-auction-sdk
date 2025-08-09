import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Signer,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { Program, AnchorProvider, Idl, BN, Wallet } from '@coral-xyz/anchor';
import { Bomboclat } from './idl/bomboclat';

// Import from constants module (which has env config)
import { 
  PROGRAM_ID,
  FEE_RECEIVER_PUBKEY, 
  TREASURY_AUTHORITY_PUBKEY,
  TOKEN_METADATA_PROGRAM_ID 
} from './sdk/constants';

// Re-export for backward compatibility
export { 
  PROGRAM_ID,
  FEE_RECEIVER_PUBKEY, 
  TREASURY_AUTHORITY_PUBKEY 
};

// Constants from the program
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

// Helper functions
export function getAuctionEscrowPDA(auctionData: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('auction_escrow'), auctionData.toBuffer()],
    PROGRAM_ID
  );
}

export function getSlotBidPDA(auctionData: PublicKey, slotId: number | BN): [PublicKey, number] {
  const slotIdBN = typeof slotId === 'number' ? new BN(slotId) : slotId;
  return PublicKey.findProgramAddressSync(
    [Buffer.from('slot_bid'), auctionData.toBuffer(), slotIdBN.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
}

export function getMetadataPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );
}

// Event Interfaces
export interface AuctionEvent {
  type: string;
  auction: PublicKey;
  tokenMint: PublicKey;
  timestamp: BN;
  [key: string]: any;
}

export interface AuctionInitializedEvent extends AuctionEvent {
  type: 'AuctionInitialized';
  creator: PublicKey;
  tokenName: string;
  tokenSymbol: string;
  tokenUri: string;
  auctionDuration: BN;
  maxBidIncrement: BN;
  legendaryTokens: BN;
  artefactTokens: BN;
  rareTokens: BN;
  magicTokens: BN;
}

export interface BidPlacedEvent extends AuctionEvent {
  type: 'BidPlaced';
  bidder: PublicKey;
  slotId: BN;
  amount: BN;
}

export interface AuctionExtendedEvent extends AuctionEvent {
  type: 'AuctionExtended';
  newEndTime: BN;
}

export interface AuctionEndedEvent extends AuctionEvent {
  type: 'AuctionEnded';
}

export interface RefundProcessedEvent extends AuctionEvent {
  type: 'RefundProcessed';
  bidder: PublicKey;
  amount: BN;
}

export interface AuctionWrapUpEvent extends AuctionEvent {
  type: 'AuctionWrapUp';
  amount: BN;
  lamportsRecovered: BN;
  protocolProfit: BN;
}

export interface AuctionFinalizedEvent extends AuctionEvent {
  type: 'AuctionFinalized';
  totalVolume: BN;
}

export interface TokensDistributedEvent extends AuctionEvent {
  type: 'TokensDistributed';
  recipient: PublicKey;
  slotId: BN;
  amount: BN;
}

export interface TokensBurnedEvent extends AuctionEvent {
  type: 'TokensBurned';
  amount: BN;
}

export interface TokensClaimedEvent extends AuctionEvent {
  type: 'TokensClaimed';
  recipient: PublicKey;
  slotId: BN;
  amount: BN;
}

export interface RefundClaimedEvent extends AuctionEvent {
  type: 'RefundClaimed';
  recipient: PublicKey;
  slotId: BN;
  amount: BN;
}

export interface UnclaimedFundsSweptEvent extends AuctionEvent {
  type: 'UnclaimedFundsSwept';
  treasuryAuthority: PublicKey;
  tokensBurned: BN;
  solTransferred: BN;
}

export interface SlotMarkedClaimableEvent extends AuctionEvent {
  type: 'SlotMarkedClaimable';
  slotId: BN;
  bidder: PublicKey;
  amount: BN;
  claimType: string;
}

export interface AuctionTypeDecidedEvent extends AuctionEvent {
  type: 'AuctionTypeDecided';
  isSuccessful: boolean;
  totalRaised: BN;
  minimumRequired: BN;
}

export interface SolTransferredToTreasuryEvent extends AuctionEvent {
  type: 'SolTransferredToTreasury';
  amount: BN;
}

export interface ProtocolFeesDistributedEvent extends AuctionEvent {
  type: 'ProtocolFeesDistributed';
  feeReceiver: PublicKey;
  amount: BN;
}

export type AllAuctionEvents = 
  | AuctionInitializedEvent
  | BidPlacedEvent
  | AuctionExtendedEvent
  | AuctionEndedEvent
  | RefundProcessedEvent
  | AuctionWrapUpEvent
  | AuctionFinalizedEvent
  | TokensDistributedEvent
  | TokensBurnedEvent
  | TokensClaimedEvent
  | RefundClaimedEvent
  | UnclaimedFundsSweptEvent
  | SlotMarkedClaimableEvent
  | AuctionTypeDecidedEvent
  | SolTransferredToTreasuryEvent
  | ProtocolFeesDistributedEvent;

// Event Listener Types
export type EventCallback = (event: AllAuctionEvents) => void;
export type EventFilter = {
  auctionData?: PublicKey;
  eventType?: string;
};

export class BomboclatSDK {
  program: Program<Bomboclat>;
  connection: Connection;
  wallet: Wallet;
  
  // Event listening properties
  private eventListeners = new Map<string, Set<EventCallback>>();
  private websocketConnection: any = null;
  private isListening = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 second

  constructor(connection: Connection, wallet: Wallet, idl: Bomboclat) {
    this.connection = connection;
    this.wallet = wallet;
    
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    
    // Create the Anchor Program instance with proper typing
    // The order is: idl, programId, provider (not programId, idl, provider)
    this.program = new Program<Bomboclat>(idl, provider);
  }

  // Create Token and Auction
  async createTokenAndAuction(
    name: string,
    symbol: string,
    uri: string,
    durationOption: AuctionDuration,
    mint: Keypair,
    auctionData: Keypair,
    auctionState: Keypair
  ): Promise<string> {
    const [auctionEscrow] = getAuctionEscrowPDA(auctionData.publicKey);
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      auctionEscrow,
      true
    );
    const treasuryAuthorityAta = await getAssociatedTokenAddress(
      mint.publicKey,
      TREASURY_AUTHORITY_PUBKEY
    );

    // Get metadata PDA for the token
    const [metadataPDA] = getMetadataPDA(mint.publicKey);

    const tx = await this.program.methods
      .createTokenAndAuction(name, symbol, uri, durationOption)
      .accountsStrict({
        mint: mint.publicKey,
        auctionData: auctionData.publicKey,
        auctionState: auctionState.publicKey,
        auctionEscrow,
        treasuryTokenAccount,
        treasuryAuthorityAta,
        treasuryAuthority: TREASURY_AUTHORITY_PUBKEY,
        creator: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
      })
      .remainingAccounts([
        {
          pubkey: metadataPDA,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: TOKEN_METADATA_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
      ])
      .signers([mint, auctionData, auctionState])
      .rpc();

    return tx;
  }

  // Place First Bid
  async placeFirstBid(
    auctionData: PublicKey,
    mint: PublicKey,
    slotId: number,
    bidAmount: BN
  ): Promise<string> {
    const auctionState = await this.getAuctionState(auctionData);
    const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
    const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
    const bidderTokenAccount = await getAssociatedTokenAddress(
      mint,
      this.wallet.publicKey
    );

    const tx = await this.program.methods
      .placeFirstBid(new BN(slotId), bidAmount)
      .accountsStrict({
        auctionState: auctionState.publicKey,
        auctionData,
        slotBid: slotBidPDA,
        bidder: this.wallet.publicKey,
        bidderTokenAccount,
        auctionEscrow,
        mint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  // Outbid
  async outbid(
    auctionData: PublicKey,
    mint: PublicKey,
    slotId: number,
    bidAmount: BN
  ): Promise<string> {
    const auctionState = await this.getAuctionState(auctionData);
    const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
    const slotBid = await this.getSlotBid(auctionData, slotId);
    
    if (!slotBid.currentBidder) {
      throw new Error('No current bidder for this slot');
    }

    const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
    const bidderTokenAccount = await getAssociatedTokenAddress(
      mint,
      this.wallet.publicKey
    );

    const tx = await this.program.methods
      .outbid(new BN(slotId), bidAmount)
      .accountsStrict({
        auctionState: auctionState.publicKey,
        auctionData,
        slotBid: slotBidPDA,
        bidder: this.wallet.publicKey,
        bidderTokenAccount,
        auctionEscrow,
        mint,
        previousBidder: slotBid.currentBidder,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  // End Auction (Treasury Only)
  async endAuction(auctionData: PublicKey): Promise<string> {
    const auctionState = await this.getAuctionState(auctionData);

    const tx = await this.program.methods
      .endAuction()
      .accountsStrict({
        auctionData,
        auctionState: auctionState.publicKey,
        treasuryAuthority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  // Wrap Up Slot (Treasury Only)
  // Wrap Up (Treasury Only) - DEPRECATED: Use wrapUpSuccessful or wrapUpFailed instead
  async wrapUp(
    auctionData: PublicKey,
    slotId: number
  ): Promise<string> {
    console.log('⚠️ Warning: wrapUp is deprecated. Use wrapUpSuccessful or wrapUpFailed instead');
    
    // Determine auction success and delegate to appropriate function
    const auctionState = await this.getAuctionState(auctionData);
    const isSuccessful = auctionState.totalVolume.gte(new BN(50_000_000_000)); // 50 SOL minimum
    
    if (isSuccessful) {
      console.log('  → Delegating to wrapUpSuccessful');
      return this.wrapUpSuccessful(auctionData, slotId);
    } else {
      console.log('  → Delegating to wrapUpFailed');
      return this.wrapUpFailed(auctionData, slotId);
    }
  }

  // Wrap Up Successful (Treasury Only)
  async wrapUpSuccessful(
    auctionData: PublicKey,
    slotId: number
  ): Promise<string> {
    const auctionState = await this.getAuctionState(auctionData);
    const auctionDataAccount = await this.getAuctionData(auctionData);
    const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
    const [auctionEscrow] = getAuctionEscrowPDA(auctionData);

    const accounts: any = {
      auctionState: auctionState.publicKey,
      auctionData,
      auctionEscrow,
      slotBid: slotBidPDA,
      feeReceiver: auctionDataAccount.feeReceiver,
      treasuryAuthority: this.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    };

    // Add bidder account if slot has a bidder
    const slotBid = await this.getSlotBid(auctionData, slotId);
    if (slotBid.currentBidder) {
      accounts.bidder = slotBid.currentBidder;
    }

    const tx = await this.program.methods
      .wrapUpSuccessful(new BN(slotId))
      .accountsPartial(accounts)
      .rpc();

    return tx;
  }

  // Wrap Up Failed (Treasury Only)
  async wrapUpFailed(
    auctionData: PublicKey,
    slotId: number
  ): Promise<string> {
    const auctionState = await this.getAuctionState(auctionData);
    const auctionDataAccount = await this.getAuctionData(auctionData);
    const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
    const [auctionEscrow] = getAuctionEscrowPDA(auctionData);

    const accounts: any = {
      auctionState: auctionState.publicKey,
      auctionData,
      auctionEscrow,
      slotBid: slotBidPDA,
      feeReceiver: auctionDataAccount.feeReceiver,
      treasuryAuthority: this.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    };

    // Add bidder account if slot has a bidder
    const slotBid = await this.getSlotBid(auctionData, slotId);
    if (slotBid.currentBidder) {
      accounts.bidder = slotBid.currentBidder;
    }

    const tx = await this.program.methods
      .wrapUpFailed(new BN(slotId))
      .accountsPartial(accounts)
      .rpc();

    return tx;
  }

  // Claim After Finalization
  async claimAfterFinalization(
    auctionData: PublicKey,
    slotId: number
  ): Promise<string> {
    const auctionState = await this.getAuctionState(auctionData);
    const auctionDataAccount = await this.getAuctionData(auctionData);
    const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
    const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
    
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      auctionState.tokenMint,
      auctionEscrow,
      true
    );
    const claimerTokenAccount = await getAssociatedTokenAddress(
      auctionState.tokenMint,
      this.wallet.publicKey
    );

    const tx = await this.program.methods
      .claimAfterFinalization(new BN(slotId))
      .accountsStrict({
        auctionState: auctionState.publicKey,
        auctionData,
        slotBid: slotBidPDA,
        auctionEscrow,
        treasuryTokenAccount,
        claimer: this.wallet.publicKey,
        claimerTokenAccount,
        mint: auctionState.tokenMint,
        feeReceiver: auctionDataAccount.feeReceiver,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  // Get SOL for Migration (Treasury Only)
  async getSolForMig(auctionData: PublicKey): Promise<string> {
    const auctionState = await this.getAuctionState(auctionData);
    const [auctionEscrow] = getAuctionEscrowPDA(auctionData);

    const tx = await this.program.methods
      .getSolForMig()
      .accountsStrict({
        auctionState: auctionState.publicKey,
        auctionEscrow,
        treasuryAuthority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  // Distribute Protocol Fees (Treasury Only)
  async distributeProtocolFees(auctionData: PublicKey): Promise<string> {
    const auctionState = await this.getAuctionState(auctionData);
    const auctionDataAccount = await this.getAuctionData(auctionData);
    const [auctionEscrow] = getAuctionEscrowPDA(auctionData);

    const tx = await this.program.methods
      .distributeProtocolFees()
      .accountsStrict({
        auctionState: auctionState.publicKey,
        auctionData,
        auctionEscrow,
        feeReceiver: auctionDataAccount.feeReceiver,
        treasuryAuthority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }



  // Close Auction Accounts (Treasury Only)
  async closeAuctionAccounts(auctionData: PublicKey): Promise<string> {
    const auctionState = await this.getAuctionState(auctionData);
    const auctionDataAccount = await this.getAuctionData(auctionData);
    const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
    
    // Get treasury token account for the mint
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      auctionState.tokenMint,
      auctionEscrow,
      true
    );

    const tx = await this.program.methods
      .closeAuctionAccounts()
      .accountsStrict({
        auctionState: auctionState.publicKey,
        auctionData,
        auctionEscrow,
        treasuryTokenAccount,
        mint: auctionState.tokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        feeReceiver: auctionDataAccount.feeReceiver,
        treasuryAuthority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  // Data Fetching Methods
  async getAuctionData(auctionDataPubkey: PublicKey): Promise<AuctionData> {
    const account = await this.program.account.auctionData.fetch(auctionDataPubkey);
    return account as AuctionData;
  }

  async getAuctionState(auctionDataPubkey: PublicKey): Promise<AuctionState & { publicKey: PublicKey }> {
    const auctions = await this.program.account.auctionState.all([
      {
        memcmp: {
          offset: 8 + 32 + 32, // After discriminator, tokenMint, and creator
          bytes: auctionDataPubkey.toBase58(),
        },
      },
    ]);

    if (auctions.length === 0) {
      throw new Error('Auction state not found');
    }

    return {
      ...(auctions[0].account as AuctionState),
      publicKey: auctions[0].publicKey,
    };
  }

  async getSlotBid(auctionData: PublicKey, slotId: number): Promise<SlotBid> {
    const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
    const account = await this.program.account.slotBid.fetch(slotBidPDA);
    return account as SlotBid;
  }

  async getEscrow(auctionData: PublicKey): Promise<Escrow> {
    const [escrowPDA] = getAuctionEscrowPDA(auctionData);
    const account = await this.program.account.escrow.fetch(escrowPDA);
    return account as Escrow;
  }

  async getAllActiveAuctions(): Promise<Array<{ publicKey: PublicKey; account: AuctionState }>> {
    const auctions = await this.program.account.auctionState.all([
      {
        memcmp: {
          offset: 8 + 32 + 32 + 32 + 8 + 8 + 8, // Position of isActive
          bytes: Buffer.from([1]).toString('base64'),
        },
      },
    ]);

    return auctions.map((a: any) => ({
      publicKey: a.publicKey,
      account: a.account as AuctionState,
    }));
  }

  async getSlotBidsForAuction(auctionData: PublicKey): Promise<Array<{ publicKey: PublicKey; account: SlotBid }>> {
    const slotBids = await this.program.account.slotBid.all([
      {
        memcmp: {
          offset: 8, // After discriminator
          bytes: auctionData.toBase58(),
        },
      },
    ]);

    return slotBids.map((s: any) => ({
      publicKey: s.publicKey,
      account: s.account as SlotBid,
    }));
  }

  // Utility Methods
  getTokenAmountForSlot(slotId: number): BN {
    if (slotId >= 1 && slotId <= 20) {
      return new BN(10_000_000).mul(new BN(10).pow(new BN(9))); // 10M tokens
    } else if (slotId >= 21 && slotId <= 60) {
      return new BN(5_000_000).mul(new BN(10).pow(new BN(9))); // 5M tokens
    } else if (slotId >= 61 && slotId <= 140) {
      return new BN(2_500_000).mul(new BN(10).pow(new BN(9))); // 2.5M tokens
    } else if (slotId >= 141 && slotId <= 300) {
      return new BN(1_000_000).mul(new BN(10).pow(new BN(9))); // 1M tokens
    } else {
      throw new Error('Invalid slot ID');
    }
  }

  calculateRefundAmount(bidAmount: BN): { refundAmount: BN; protocolFee: BN } {
    const protocolFee = bidAmount
      .mul(CONSTANTS.PROTOCOL_FEE_BPS)
      .div(CONSTANTS.BASIS_POINTS_DIVISOR);
    const refundAmount = bidAmount.sub(protocolFee);
    return { refundAmount, protocolFee };
  }

  isAuctionSuccessful(totalVolume: BN): boolean {
    return totalVolume.gte(CONSTANTS.MIN_SUCCESSFUL_RAISE);
  }

  getAuctionDurationSeconds(durationOption: AuctionDuration): number {
    switch (durationOption) {
      case AuctionDuration.ONE_MINUTE:
        return 60;
      case AuctionDuration.ONE_HOUR:
        return 3600;
      case AuctionDuration.ONE_DAY:
        return 86400;
      default:
        throw new Error('Invalid auction duration');
    }
  }

  // Event Parsing
  async getEventsForAuction(auctionData: PublicKey, eventName?: string): Promise<any[]> {
    const events = await this.connection.getSignaturesForAddress(PROGRAM_ID, {
      limit: 1000,
    });

    const parsedEvents = [];
    for (const event of events) {
      try {
        const tx = await this.connection.getParsedTransaction(event.signature, {
          maxSupportedTransactionVersion: 0,
        });
        
        if (!tx?.meta?.logMessages) continue;

        const logs = tx.meta.logMessages;
        for (const log of logs) {
          if (log.includes('Program log:') && log.includes('auction')) {
            // Parse event based on log format
            const eventData = this.parseEventLog(log);
            if (eventData && eventData.auction === auctionData.toBase58()) {
              if (!eventName || eventData.type === eventName) {
                parsedEvents.push(eventData);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error parsing event:', error);
      }
    }

    return parsedEvents;
  }

  private parseEventLog(log: string): any {
    // Implementation depends on how your program emits events
    // This is a placeholder that should be implemented based on actual log format
    try {
      const jsonStr = log.substring(log.indexOf('{'));
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }

  // Smart Bidding - Automatically determines whether to place first bid or outbid
  async placeBid(
    auctionData: PublicKey,
    mint: PublicKey,
    slotId: number,
    bidAmount: BN
  ): Promise<{ tx: string; action: 'first_bid' | 'outbid' }> {
    // Validate bid amount
    this.validateBidAmount(bidAmount);
    
    // Check if slot has an existing bid
    const hasExistingBid = await this.slotHasExistingBid(auctionData, slotId);
    
    if (hasExistingBid) {
      // Get current bid info to check if user is trying to outbid themselves
      const currentBidInfo = await this.getCurrentBidInfo(auctionData, slotId);
      
      if (currentBidInfo.currentBidder && currentBidInfo.currentBidder.equals(this.wallet.publicKey)) {
        throw new Error('Cannot outbid yourself. You are already the highest bidder on this slot.');
      }
      
      // Slot has existing bid, perform outbid
      const tx = await this.outbid(auctionData, mint, slotId, bidAmount);
      return { tx, action: 'outbid' };
    } else {
      // No existing bid, place first bid
      const tx = await this.placeFirstBid(auctionData, mint, slotId, bidAmount);
      return { tx, action: 'first_bid' };
    }
  }

  // Check if a slot has an existing bid
  async slotHasExistingBid(auctionData: PublicKey, slotId: number): Promise<boolean> {
    try {
      const slotBid = await this.getSlotBid(auctionData, slotId);
      return slotBid.currentBidder !== null && slotBid.currentAmount.gt(new BN(0));
    } catch (error) {
      // If slot doesn't exist or can't be fetched, assume no existing bid
      return false;
    }
  }

  // Get current bid information for a slot
  async getCurrentBidInfo(auctionData: PublicKey, slotId: number): Promise<{
    hasBid: boolean;
    currentBidder: PublicKey | null;
    currentAmount: BN | null;
    minNextBid: BN | null;
  }> {
    try {
      const slotBid = await this.getSlotBid(auctionData, slotId);
      const hasBid = slotBid.currentBidder !== null && slotBid.currentAmount.gt(new BN(0));
      
      let minNextBid: BN | null = null;
      if (hasBid) {
        minNextBid = this.calculateMinNextBid(slotBid.currentAmount);
      }
      
      return {
        hasBid,
        currentBidder: slotBid.currentBidder,
        currentAmount: hasBid ? slotBid.currentAmount : null,
        minNextBid,
      };
    } catch (error) {
      return {
        hasBid: false,
        currentBidder: null,
        currentAmount: null,
        minNextBid: null,
      };
    }
  }

  // Calculate minimum bid amount for next bid
  calculateMinNextBid(currentBidAmount: BN): BN {
    const minIncrement = CONSTANTS.MIN_BID_INCREMENT;
    return currentBidAmount.add(minIncrement);
  }

  // Validate bid amount against program constraints
  validateBidAmount(bidAmount: BN): void {
    if (bidAmount.lt(CONSTANTS.MIN_BID_AMOUNT)) {
      throw new Error(`Bid amount must be at least ${CONSTANTS.MIN_BID_AMOUNT.toString()} lamports`);
    }
    
    if (bidAmount.gt(CONSTANTS.MAX_BID_AMOUNT)) {
      throw new Error(`Bid amount cannot exceed ${CONSTANTS.MAX_BID_AMOUNT.toString()} lamports`);
    }
  }

  // Validate outbid amount against current bid
  async validateOutbidAmount(auctionData: PublicKey, slotId: number, bidAmount: BN): Promise<void> {
    const currentBidInfo = await this.getCurrentBidInfo(auctionData, slotId);
    
    if (!currentBidInfo.hasBid) {
      throw new Error('No existing bid to outbid');
    }
    
    if (currentBidInfo.currentAmount && bidAmount.lte(currentBidInfo.currentAmount)) {
      throw new Error(`Bid amount must be greater than current bid of ${currentBidInfo.currentAmount.toString()} lamports`);
    }
    
    if (currentBidInfo.minNextBid && bidAmount.lt(currentBidInfo.minNextBid)) {
      throw new Error(`Bid amount must be at least ${currentBidInfo.minNextBid.toString()} lamports to meet minimum increment`);
    }
  }

  // Get auction status and bidding information
  async getAuctionBiddingInfo(auctionData: PublicKey): Promise<{
    isActive: boolean;
    endTime: BN;
    timeRemaining: number;
    totalSlots: number;
    activeSlots: number;
    totalVolume: BN;
    isSuccessful: boolean;
  }> {
    const auctionState = await this.getAuctionState(auctionData);
    const now = new BN(Math.floor(Date.now() / 1000));
    
    const timeRemaining = Math.max(0, auctionState.endTime.toNumber() - now.toNumber());
    const isActive = auctionState.isActive && timeRemaining > 0;
    
    // Count active slots (slots with bids)
    let activeSlots = 0;
    for (let slotId = 1; slotId <= CONSTANTS.MAX_SLOTS; slotId++) {
      const hasBid = await this.slotHasExistingBid(auctionData, slotId);
      if (hasBid) {
        activeSlots++;
      }
    }
    
    return {
      isActive,
      endTime: auctionState.endTime,
      timeRemaining,
      totalSlots: CONSTANTS.MAX_SLOTS,
      activeSlots,
      totalVolume: auctionState.totalVolume,
      isSuccessful: this.isAuctionSuccessful(auctionState.totalVolume),
    };
  }

  // Check if current user is the highest bidder on a slot
  async isCurrentUserHighestBidder(auctionData: PublicKey, slotId: number): Promise<boolean> {
    try {
      const currentBidInfo = await this.getCurrentBidInfo(auctionData, slotId);
      return currentBidInfo.hasBid && 
             currentBidInfo.currentBidder !== null && 
             currentBidInfo.currentBidder.equals(this.wallet.publicKey);
    } catch (error) {
      return false;
    }
  }

  // Get detailed slot information for UI display
  async getSlotInfo(auctionData: PublicKey, slotId: number): Promise<{
    slotId: number;
    tokenAmount: BN;
    hasBid: boolean;
    currentBidder: PublicKey | null;
    currentAmount: BN | null;
    minNextBid: BN | null;
    isClaimable: boolean;
    isDistributed: boolean;
  }> {
    const tokenAmount = this.getTokenAmountForSlot(slotId);
    const currentBidInfo = await this.getCurrentBidInfo(auctionData, slotId);
    
    let isClaimable = false;
    let isDistributed = false;
    
    if (currentBidInfo.hasBid) {
      try {
        const slotBid = await this.getSlotBid(auctionData, slotId);
        isClaimable = slotBid.claimable;
        isDistributed = slotBid.distributed;
      } catch (error) {
        // Slot bid not found, use defaults
      }
    }
    
    return {
      slotId,
      tokenAmount,
      hasBid: currentBidInfo.hasBid,
      currentBidder: currentBidInfo.currentBidder,
      currentAmount: currentBidInfo.currentAmount,
      minNextBid: currentBidInfo.minNextBid,
      isClaimable,
      isDistributed,
    };
  }

  // Hostile Takeover - Outbid 1-5 slots of a specific person in one bundled transaction
  async hostileTakeover(
    auctionData: PublicKey,
    mint: PublicKey,
    targetBidder: PublicKey,
    outbidIncrement: BN = CONSTANTS.MIN_BID_INCREMENT
  ): Promise<{ 
    tx: string; 
    slotsTaken: number; 
    totalCost: BN;
    transactionSize: number;
    computeUnitsUsed: number;
    fee: number;
    targetSlotsFound: number;
  }> {
    // Get all slot bids for the auction
    const slotBids = await this.getSlotBidsForAuction(auctionData);
    
    // Filter slots where target bidder is the current highest bidder
    const allTargetSlots = slotBids.filter(slot => 
      slot.account.currentBidder && 
      slot.account.currentBidder.equals(targetBidder) &&
      slot.account.currentAmount.gt(new BN(0))
    );
    
    if (allTargetSlots.length === 0) {
      throw new Error(`No slots found where ${targetBidder.toBase58()} is the highest bidder`);
    }
    
    // Limit to maximum 5 slots for transaction size constraints
    const targetSlots = allTargetSlots.slice(0, 5);
    const targetSlotsFound = allTargetSlots.length;
    
    console.log(`🎯 Hostile takeover: Found ${targetSlotsFound} total slots controlled by target`);
    console.log(`📦 Taking over ${targetSlots.length} slots (max 5 for transaction efficiency)`);
    
    if (targetSlotsFound > 5) {
      console.log(`⚠️  Note: ${targetSlotsFound - 5} additional slots remain (would require multiple transactions)`);
    }
    
    // Get auction state once (shared across all instructions)
    const auctionState = await this.getAuctionState(auctionData);
    const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
    const bidderTokenAccount = await getAssociatedTokenAddress(
      mint,
      this.wallet.publicKey
    );
    
    // Create outbid instructions for each slot
    const instructions: TransactionInstruction[] = [];
    const slotIds: number[] = [];
    let totalCost = new BN(0);
    
    for (const slot of targetSlots) {
      const slotId = slot.account.slotId.toNumber();
      const currentAmount = slot.account.currentAmount;
      const newBidAmount = currentAmount.add(outbidIncrement);
      
      // Validate the new bid amount
      this.validateBidAmount(newBidAmount);
      
      // Get slot bid PDA for this slot
      const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
      
      // Create outbid instruction
      const outbidIx = await this.program.methods
        .outbid(new BN(slotId), newBidAmount)
        .accountsStrict({
          auctionState: auctionState.publicKey,
          auctionData,
          slotBid: slotBidPDA,
          bidder: this.wallet.publicKey,
          bidderTokenAccount,
          auctionEscrow,
          mint,
          previousBidder: targetBidder,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();
      
      instructions.push(outbidIx);
      slotIds.push(slotId);
      totalCost = totalCost.add(newBidAmount);
      
      console.log(`  📍 Slot ${slotId}: ${currentAmount.toString()} → ${newBidAmount.toString()} lamports`);
    }
    
    // Create and send the bundled transaction
    const transaction = new Transaction();
    transaction.add(...instructions);
    
    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.wallet.publicKey;
    
    // Calculate transaction size
    const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
    const transactionSize = serializedTransaction.length;
    
    console.log(`🚀 Sending bundled transaction with ${instructions.length} outbid instructions...`);
    console.log(`📏 Transaction size: ${transactionSize} bytes`);
    
    // Sign and send transaction
    const tx = await this.connection.sendTransaction(transaction, [this.wallet.payer]);
    
    // Wait for transaction to be confirmed before getting info
    console.log(`⏳ Waiting for transaction confirmation...`);
    await this.connection.confirmTransaction(tx, 'confirmed');
    
    // Get transaction info to see compute units used
    let txInfo = null;
    let retries = 0;
    const maxRetries = 5;
    
    while (!txInfo && retries < maxRetries) {
      try {
        txInfo = await this.connection.getTransaction(tx, {
          maxSupportedTransactionVersion: 0,
        });
        if (!txInfo) {
          retries++;
          console.log(`  Retry ${retries}/${maxRetries}: Transaction not found yet...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`  ✅ Transaction info fetched successfully`);
        }
      } catch (error) {
        retries++;
        console.log(`  Retry ${retries}/${maxRetries}: Error fetching transaction - ${error}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const computeUnitsUsed = txInfo?.meta?.computeUnitsConsumed || 0;
    const fee = txInfo?.meta?.fee || 0;
    
    console.log(`✅ Hostile takeover bundled transaction sent: ${tx}`);
    console.log(`💰 Total cost: ${totalCost.toString()} lamports (${totalCost.toNumber() / LAMPORTS_PER_SOL} SOL)`);
    console.log(`🎯 Slots taken: ${slotIds.length}`);
    console.log(`📋 Slots: ${slotIds.join(', ')}`);
    console.log(`🔗 Single signature required!`);
    console.log(`📊 Transaction metrics:`);
    console.log(`   - Size: ${transactionSize} bytes`);
    console.log(`   - Compute Units: ${computeUnitsUsed}`);
    console.log(`   - Fee: ${fee} lamports (${fee / LAMPORTS_PER_SOL} SOL)`);
    console.log(`   - Instructions: ${instructions.length}`);
    console.log(`   - Avg CU per instruction: ${instructions.length > 0 ? Math.round(computeUnitsUsed / instructions.length) : 0}`);
    
    if (!txInfo) {
      console.log(`⚠️  Could not fetch transaction info after ${maxRetries} retries`);
    }
    
    return {
      tx,
      slotsTaken: slotIds.length,
      totalCost,
      transactionSize,
      computeUnitsUsed,
      fee,
      targetSlotsFound
    };
  }

  // Get all slots where a specific person is the highest bidder
  async getSlotsByBidder(auctionData: PublicKey, bidder: PublicKey): Promise<Array<{
    slotId: number;
    currentAmount: BN;
    minNextBid: BN;
  }>> {
    const slotBids = await this.getSlotBidsForAuction(auctionData);
    
    return slotBids
      .filter(slot => 
        slot.account.currentBidder && 
        slot.account.currentBidder.equals(bidder) &&
        slot.account.currentAmount.gt(new BN(0))
      )
      .map(slot => ({
        slotId: slot.account.slotId.toNumber(),
        currentAmount: slot.account.currentAmount,
        minNextBid: this.calculateMinNextBid(slot.account.currentAmount)
      }))
      .sort((a, b) => a.slotId - b.slotId);
  }

  // Calculate total cost to take over all slots of a specific person
  async calculateHostileTakeoverCost(
    auctionData: PublicKey,
    targetBidder: PublicKey,
    outbidIncrement: BN = CONSTANTS.MIN_BID_INCREMENT
  ): Promise<{
    totalCost: BN;
    slotCount: number;
    slots: Array<{ slotId: number; currentAmount: BN; newAmount: BN }>;
  }> {
    const targetSlots = await this.getSlotsByBidder(auctionData, targetBidder);
    
    if (targetSlots.length === 0) {
      return {
        totalCost: new BN(0),
        slotCount: 0,
        slots: []
      };
    }
    
    let totalCost = new BN(0);
    const slots = targetSlots.map(slot => {
      const newAmount = slot.currentAmount.add(outbidIncrement);
      totalCost = totalCost.add(newAmount);
      return {
        slotId: slot.slotId,
        currentAmount: slot.currentAmount,
        newAmount
      };
    });
    
    return {
      totalCost,
      slotCount: targetSlots.length,
      slots
    };
  }

  // ========================================
  // EVENT LISTENING METHODS
  // ========================================

  /**
   * Subscribe to real-time auction events
   * @param filter - Optional filter for specific auction or event type
   * @param callback - Function to call when events are received
   * @returns Subscription ID for unsubscribing
   */
  onAuctionEvent(filter: EventFilter, callback: EventCallback): string {
    const subscriptionId = Math.random().toString(36).substring(2, 15);
    const key = this.getEventKey(filter);
    
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }
    
    this.eventListeners.get(key)!.add(callback);
    
    // Start listening if not already started
    if (!this.isListening) {
      this.startEventListening();
    }
    
    return subscriptionId;
  }

  /**
   * Subscribe to all auction events (no filter)
   */
  onAllAuctionEvents(callback: EventCallback): string {
    return this.onAuctionEvent({}, callback);
  }

  /**
   * Subscribe to events for a specific auction
   */
  onAuctionEvents(auctionData: PublicKey, callback: EventCallback): string {
    return this.onAuctionEvent({ auctionData }, callback);
  }

  /**
   * Subscribe to specific event types
   */
  onEventType<T extends AllAuctionEvents>(eventType: T['type'], callback: (event: T) => void): string {
    return this.onAuctionEvent({ eventType }, callback as EventCallback);
  }

  /**
   * Unsubscribe from events using subscription ID
   */
  offAuctionEvent(subscriptionId: string): void {
    // Implementation would track subscription IDs
    // For now, this is a placeholder
    console.log(`Unsubscribed from events: ${subscriptionId}`);
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners(): void {
    this.eventListeners.clear();
    this.stopEventListening();
  }

  /**
   * Start listening to program events via WebSocket
   */
  private async startEventListening(): Promise<void> {
    if (this.isListening) return;
    
    try {
      this.isListening = true;
      console.log('🔊 Starting event listening...');
      
      // Use WebSocket connection for real-time events
      const wsUrl = this.connection.rpcEndpoint.replace('https://', 'wss://').replace('http://', 'ws://');
      
      // For now, we'll use polling as a fallback
      // In production, you'd implement proper WebSocket connection
      this.startPolling();
      
    } catch (error) {
      console.error('❌ Failed to start event listening:', error);
      this.isListening = false;
    }
  }

  /**
   * Stop listening to events
   */
  private stopEventListening(): void {
    this.isListening = false;
    console.log('🔇 Stopped event listening');
  }

  /**
   * Poll for new events (fallback method)
   */
  private async startPolling(): Promise<void> {
    let lastSignature: string | null = null;
    
    const poll = async () => {
      if (!this.isListening) return;
      
      try {
        const signatures = await this.connection.getSignaturesForAddress(PROGRAM_ID, {
          limit: 10,
          ...(lastSignature && { before: lastSignature }),
        });
        
        for (const sig of signatures) {
          if (lastSignature && sig.signature === lastSignature) continue;
          
          const tx = await this.connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });
          
          if (tx?.meta?.logMessages) {
            this.processTransactionLogs(tx.meta.logMessages, sig.signature);
          }
        }
        
        if (signatures.length > 0) {
          lastSignature = signatures[0].signature;
        }
        
      } catch (error) {
        console.error('❌ Error polling for events:', error);
      }
      
      // Poll every 2 seconds
      setTimeout(poll, 2000);
    };
    
    poll();
  }

  /**
   * Process transaction logs to extract events
   */
  private processTransactionLogs(logs: string[], signature: string): void {
    for (const log of logs) {
      if (log.includes('Program log:') && log.includes('auction')) {
        try {
          const event = this.parseEventFromLog(log);
          if (event) {
            this.notifyEventListeners(event);
          }
        } catch (error) {
          console.error('❌ Error parsing event log:', error);
        }
      }
    }
  }

  /**
   * Parse event from program log
   */
  private parseEventFromLog(log: string): AllAuctionEvents | null {
    try {
      // Extract event data from log
      const eventData = this.parseEventLog(log);
      if (!eventData) return null;
      
      // Convert to typed event
      return this.convertToTypedEvent(eventData);
    } catch (error) {
      console.error('❌ Error parsing event:', error);
      return null;
    }
  }

  /**
   * Convert raw event data to typed event
   */
  private convertToTypedEvent(data: any): AllAuctionEvents | null {
    const baseEvent = {
      auction: new PublicKey(data.auction),
      tokenMint: new PublicKey(data.token_mint),
      timestamp: new BN(data.timestamp),
    };
    
    switch (data.type) {
      case 'AuctionInitialized':
        return {
          ...baseEvent,
          type: 'AuctionInitialized',
          creator: new PublicKey(data.creator),
          tokenName: data.token_name,
          tokenSymbol: data.token_symbol,
          tokenUri: data.token_uri,
          auctionDuration: new BN(data.auction_duration),
          maxBidIncrement: new BN(data.max_bid_increment),
          legendaryTokens: new BN(data.legendary_tokens),
          artefactTokens: new BN(data.artefact_tokens),
          rareTokens: new BN(data.rare_tokens),
          magicTokens: new BN(data.magic_tokens),
        } as AuctionInitializedEvent;
        
      case 'BidPlaced':
        return {
          ...baseEvent,
          type: 'BidPlaced',
          bidder: new PublicKey(data.bidder),
          slotId: new BN(data.slot_id),
          amount: new BN(data.amount),
        } as BidPlacedEvent;
        
      case 'AuctionExtended':
        return {
          ...baseEvent,
          type: 'AuctionExtended',
          newEndTime: new BN(data.new_end_time),
        } as AuctionExtendedEvent;
        
      case 'AuctionEnded':
        return {
          ...baseEvent,
          type: 'AuctionEnded',
        } as AuctionEndedEvent;
        
      case 'RefundProcessed':
        return {
          ...baseEvent,
          type: 'RefundProcessed',
          bidder: new PublicKey(data.bidder),
          amount: new BN(data.amount),
        } as RefundProcessedEvent;
        
      case 'AuctionWrapUp':
        return {
          ...baseEvent,
          type: 'AuctionWrapUp',
          amount: new BN(data.amount),
          lamportsRecovered: new BN(data.lamports_recovered),
          protocolProfit: new BN(data.protocol_profit),
        } as AuctionWrapUpEvent;
        
      case 'AuctionFinalized':
        return {
          ...baseEvent,
          type: 'AuctionFinalized',
          totalVolume: new BN(data.total_volume),
        } as AuctionFinalizedEvent;
        
      case 'TokensDistributed':
        return {
          ...baseEvent,
          type: 'TokensDistributed',
          recipient: new PublicKey(data.recipient),
          slotId: new BN(data.slot_id),
          amount: new BN(data.amount),
        } as TokensDistributedEvent;
        
      case 'TokensBurned':
        return {
          ...baseEvent,
          type: 'TokensBurned',
          amount: new BN(data.amount),
        } as TokensBurnedEvent;
        
      case 'TokensClaimed':
        return {
          ...baseEvent,
          type: 'TokensClaimed',
          recipient: new PublicKey(data.recipient),
          slotId: new BN(data.slot_id),
          amount: new BN(data.amount),
        } as TokensClaimedEvent;
        
      case 'RefundClaimed':
        return {
          ...baseEvent,
          type: 'RefundClaimed',
          recipient: new PublicKey(data.recipient),
          slotId: new BN(data.slot_id),
          amount: new BN(data.amount),
        } as RefundClaimedEvent;
        
      case 'UnclaimedFundsSwept':
        return {
          ...baseEvent,
          type: 'UnclaimedFundsSwept',
          treasuryAuthority: new PublicKey(data.treasury_authority),
          tokensBurned: new BN(data.tokens_burned),
          solTransferred: new BN(data.sol_transferred),
        } as UnclaimedFundsSweptEvent;
        
      case 'SlotMarkedClaimable':
        return {
          ...baseEvent,
          type: 'SlotMarkedClaimable',
          slotId: new BN(data.slot_id),
          bidder: new PublicKey(data.bidder),
          amount: new BN(data.amount),
          claimType: data.claim_type,
        } as SlotMarkedClaimableEvent;
        
      case 'AuctionTypeDecided':
        return {
          ...baseEvent,
          type: 'AuctionTypeDecided',
          isSuccessful: data.is_successful,
          totalRaised: new BN(data.total_raised),
          minimumRequired: new BN(data.minimum_required),
        } as AuctionTypeDecidedEvent;
        
      case 'SolTransferredToTreasury':
        return {
          ...baseEvent,
          type: 'SolTransferredToTreasury',
          amount: new BN(data.amount),
        } as SolTransferredToTreasuryEvent;
        
      case 'ProtocolFeesDistributed':
        return {
          ...baseEvent,
          type: 'ProtocolFeesDistributed',
          feeReceiver: new PublicKey(data.fee_receiver),
          amount: new BN(data.amount),
        } as ProtocolFeesDistributedEvent;
        
      default:
        console.log(`⚠️  Unhandled event type: ${data.type}`);
        return null;
    }
  }

  /**
   * Notify all relevant event listeners
   */
  private notifyEventListeners(event: AllAuctionEvents): void {
    // Notify listeners for all events
    const allEventsKey = this.getEventKey({});
    if (this.eventListeners.has(allEventsKey)) {
      this.eventListeners.get(allEventsKey)!.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('❌ Error in event callback:', error);
        }
      });
    }
    
    // Notify listeners for specific auction
    const auctionKey = this.getEventKey({ auctionData: event.auction });
    if (this.eventListeners.has(auctionKey)) {
      this.eventListeners.get(auctionKey)!.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('❌ Error in event callback:', error);
        }
      });
    }
    
    // Notify listeners for specific event type
    const eventTypeKey = this.getEventKey({ eventType: event.type });
    if (this.eventListeners.has(eventTypeKey)) {
      this.eventListeners.get(eventTypeKey)!.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('❌ Error in event callback:', error);
        }
      });
    }
  }

  /**
   * Generate key for event listener map
   */
  private getEventKey(filter: EventFilter): string {
    const parts = [];
    if (filter.auctionData) {
      parts.push(`auction:${filter.auctionData.toBase58()}`);
    }
    if (filter.eventType) {
      parts.push(`type:${filter.eventType}`);
    }
    return parts.length > 0 ? parts.join('|') : 'all';
  }

  // ========================================
  // HELPER METHODS FOR EXTERNAL APPS
  // ========================================

  /**
   * Check if event listening is available
   */
  get hasEventListening(): boolean {
    return true; // Event listening is always available in this SDK
  }

  /**
   * Check if onAllAuctionEvents method exists
   */
  get hasOnAllAuctionEvents(): boolean {
    return typeof this.onAllAuctionEvents === 'function';
  }

  /**
   * Check if onAuctionEvent method exists
   */
  get hasOnAuctionEvent(): boolean {
    return typeof this.onAuctionEvent === 'function';
  }

  /**
   * Check if onEventType method exists
   */
  get hasOnEventType(): boolean {
    return typeof this.onEventType === 'function';
  }

  /**
   * Get SDK capabilities info
   */
  get capabilities(): {
    hasEventListening: boolean;
    hasOnAllAuctionEvents: boolean;
    hasOnAuctionEvent: boolean;
    hasOnEventType: boolean;
    hasProgram: boolean;
    programId: string;
  } {
    return {
      hasEventListening: this.hasEventListening,
      hasOnAllAuctionEvents: this.hasOnAllAuctionEvents,
      hasOnAuctionEvent: this.hasOnAuctionEvent,
      hasOnEventType: this.hasOnEventType,
      hasProgram: !!this.program,
      programId: this.program.programId.toBase58(),
    };
  }
}

// Export helper to create SDK instance
export function createBomboclatSDK(
  connection: Connection,
  wallet: Wallet,
  idl: Bomboclat
): BomboclatSDK {
  return new BomboclatSDK(connection, wallet, idl);
}

// Alias for backward compatibility
export function createHeatSDK(
  connection: Connection,
  wallet: Wallet,
  idl: Bomboclat
): BomboclatSDK {
  return new BomboclatSDK(connection, wallet, idl);
}