import { PublicKey } from '@solana/web3.js';
import { BN, EventParser, Program } from '@coral-xyz/anchor';
import { AllAuctionEvents } from '../types/events';
import { Bomboclat } from '../../idl/bomboclat';

export class BomboclatEventParser {
  private eventParser: EventParser;
  
  constructor(program: Program<Bomboclat>) {
    this.eventParser = new EventParser(program.programId, program.coder);
  }

  /**
   * Parse events from transaction logs
   */
  parseEventsFromLogs(logs: string[]): AllAuctionEvents[] {
    const events: AllAuctionEvents[] = [];
    
    const parsedEvents = this.eventParser.parseLogs(logs);
    
    for (const event of parsedEvents) {
      const typedEvent = this.convertToTypedEvent(event);
      if (typedEvent) {
        events.push(typedEvent);
      }
    }
    
    return events;
  }

  /**
   * Convert Anchor event to typed event with clean formatted values
   */
  private convertToTypedEvent(event: any): AllAuctionEvents | null {
    try {
      const data = event.data;
      
      switch (event.name) {
        case 'auctionInitialized':
          return {
            type: 'AuctionInitialized',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            creator: data.creator.toBase58(),
            timestamp: data.timestamp.toNumber(),
            tokenName: data.tokenName,
            tokenSymbol: data.tokenSymbol,
            tokenUri: data.tokenUri,
            auctionDuration: data.auctionDuration.toNumber(),
            maxBidIncrement: data.maxBidIncrement.toString(),
            legendaryTokens: data.legendaryTokens.toString(),
            artefactTokens: data.artefactTokens.toString(),
            rareTokens: data.rareTokens.toString(),
            magicTokens: data.magicTokens.toString(),
          } as any;
          
        case 'bidPlaced':
          return {
            type: 'BidPlaced',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            bidder: data.bidder.toBase58(),
            slotId: data.slotId.toNumber(),
            amount: data.amount.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'auctionExtended':
          return {
            type: 'AuctionExtended',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            newEndTime: data.newEndTime.toNumber(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'auctionEnded':
          return {
            type: 'AuctionEnded',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'refundProcessed':
          return {
            type: 'RefundProcessed',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            bidder: data.bidder.toBase58(),
            amount: data.amount.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'tokensDistributed':
          return {
            type: 'TokensDistributed',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            recipient: data.recipient.toBase58(),
            slotId: data.slotId.toNumber(),
            amount: data.amount.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'tokensBurned':
          return {
            type: 'TokensBurned',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            amount: data.amount.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'slotMarkedClaimable':
          return {
            type: 'SlotMarkedClaimable',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            slotId: data.slotId.toNumber(),
            bidder: data.bidder.toBase58(),
            amount: data.amount.toString(),
            claimType: data.claimType,
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'auctionTypeDecided':
          return {
            type: 'AuctionTypeDecided',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            isSuccessful: data.isSuccessful,
            totalRaised: data.totalRaised.toString(),
            minimumRequired: data.minimumRequired.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'solTransferredToTreasury':
          return {
            type: 'SolTransferredToTreasury',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            amount: data.amount.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'protocolFeesDistributed':
          return {
            type: 'ProtocolFeesDistributed',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            feeReceiver: data.feeReceiver.toBase58(),
            amount: data.amount.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'tokensClaimed':
          return {
            type: 'TokensClaimed',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            recipient: data.recipient.toBase58(),
            slotId: data.slotId.toNumber(),
            amount: data.amount.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'refundClaimed':
          return {
            type: 'RefundClaimed',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            recipient: data.recipient.toBase58(),
            slotId: data.slotId.toNumber(),
            amount: data.amount.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'auctionAccountsClosed':
          return {
            type: 'AuctionAccountsClosed',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            rentRecovered: data.rentRecovered.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'auctionWrapUp':
          return {
            type: 'AuctionWrapUp',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            amount: data.amount.toString(),
            lamportsRecovered: data.lamportsRecovered.toString(),
            protocolProfit: data.protocolProfit.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'auctionFinalized':
          return {
            type: 'AuctionFinalized',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            totalVolume: data.totalVolume.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        case 'unclaimedFundsSwept':
          return {
            type: 'UnclaimedFundsSwept',
            auction: data.auction.toBase58(),
            tokenMint: data.tokenMint.toBase58(),
            treasuryAuthority: data.treasuryAuthority.toBase58(),
            tokensBurned: data.tokensBurned.toString(),
            solTransferred: data.solTransferred.toString(),
            timestamp: data.timestamp.toNumber(),
          } as any;
          
        default:
          console.log(`⚠️  Unhandled event type: ${event.name}`);
          return null;
      }
    } catch (error) {
      console.error('❌ Error converting event:', error);
      return null;
    }
  }
}