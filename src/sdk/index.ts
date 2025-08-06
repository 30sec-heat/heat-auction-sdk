import { Connection } from '@solana/web3.js';
import type { Wallet } from '@coral-xyz/anchor';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Bomboclat } from '../idl/bomboclat';

// Import modules
import { AuctionModule } from './modules/auction';
import { BiddingModule } from './modules/bidding';
import { TreasuryModule } from './modules/treasury';
import { ClaimsModule } from './modules/claims';
import { QueriesModule } from './modules/queries';
import { EventSystem } from './events';

// Import types
import * as types from './types';

// Import constants
import * as constants from './constants';

// Import utilities
import * as utils from './utils';

// Import errors
import * as errors from './errors';

export class BomboclatSDK {
  private program: Program<Bomboclat>;
  private connection: Connection;
  private wallet: Wallet;
  
  // Modules
  public auction: AuctionModule;
  public bidding: BiddingModule;
  public treasury: TreasuryModule;
  public claims: ClaimsModule;
  public queries: QueriesModule;
  public events: EventSystem;
  
  constructor(connection: Connection, wallet: Wallet, idl: Bomboclat) {
    this.connection = connection;
    this.wallet = wallet;
    
    // Initialize program
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    this.program = new Program<Bomboclat>(idl, provider);
    
    // Initialize modules
    this.auction = new AuctionModule(this.program, connection, wallet);
    this.bidding = new BiddingModule(this.program, connection, wallet);
    this.treasury = new TreasuryModule(this.program, connection, wallet);
    this.claims = new ClaimsModule(this.program, connection, wallet);
    this.queries = new QueriesModule(this.program, connection, wallet);
    this.events = new EventSystem(this.program, connection);
  }
  
  // Expose some methods at the root level for backward compatibility
  async getAuctionState(auctionData: any) {
    return this.queries.getAuctionState(auctionData);
  }

  async getAuctionData(auctionData: any) {
    return this.queries.getAuctionData(auctionData);
  }

  async getSlotBid(auctionData: any, slotId: number) {
    return this.queries.getSlotBid(auctionData, slotId);
  }

  async getAllActiveAuctions() {
    return this.queries.getAllActiveAuctions();
  }

  async getSlotBidsForAuction(auctionData: any) {
    return this.queries.getSlotBidsForAuction(auctionData);
  }

  // Smart bidding - backward compatibility
  async placeBid(auctionData: any, mint: any, slotId: number, bidAmount: any) {
    return this.bidding.placeBid(auctionData, mint, slotId, bidAmount);
  }

  // Hostile takeover - backward compatibility
  async hostileTakeover(auctionData: any, mint: any, targetBidder: any, outbidIncrement?: any) {
    return this.bidding.hostileTakeover(auctionData, mint, targetBidder, outbidIncrement);
  }

  // Event listening - backward compatibility (initialized in constructor)

  // Utility methods - backward compatibility
  getTokenAmountForSlot = utils.getTokenAmountForSlot;
  calculateRefundAmount = utils.calculateRefundAmount;
  isAuctionSuccessful = utils.isAuctionSuccessful;
  getAuctionDurationSeconds = utils.getAuctionDurationSeconds;

  // Validation methods - backward compatibility
  validateBidAmount = utils.validateBidAmount;
  validateOutbidAmount = utils.validateOutbidAmount;
  validateSlotId = utils.validateSlotId;

  // PDA methods - backward compatibility
  getAuctionEscrowPDA = utils.getAuctionEscrowPDA;
  getSlotBidPDA = utils.getSlotBidPDA;
  getMetadataPDA = utils.getMetadataPDA;

  // Helper methods - backward compatibility
  formatSolAmount = utils.formatSolAmount;
  formatTokenAmount = utils.formatTokenAmount;
  sleep = utils.sleep;
  retry = utils.retry;

  // Expose types and constants for external use
  static types = types;
  static constants = constants;
  static utils = utils;
  static errors = errors;
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

// Export all types, constants, utils, and errors
export * from './types';
export * from './constants';
export * from './utils';
export * from './errors'; 