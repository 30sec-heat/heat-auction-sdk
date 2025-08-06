import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { BaseModule } from './base';
import { getAuctionEscrowPDA, getSlotBidPDA } from '../utils/pda';
import { AuctionData, AuctionState, SlotBid, Escrow } from '../types';

export class QueriesModule extends BaseModule {
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
        minNextBid: slot.account.currentAmount.add(new BN(0.01 * 1e9)) // 0.01 SOL minimum increment
      }))
      .sort((a, b) => a.slotId - b.slotId);
  }

  async getEventsForAuction(auctionData: PublicKey, eventName?: string): Promise<any[]> {
    const events = await this.connection.getSignaturesForAddress(
      new PublicKey('9Ky8dWgozFkGQJBUfrgEy3zxbMmXdX5XYCV6FL4VUXjC'), // PROGRAM_ID
      {
        limit: 1000,
      }
    );

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
} 