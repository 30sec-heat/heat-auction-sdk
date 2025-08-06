import {
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { BaseModule } from './base';
import { getAuctionEscrowPDA, getSlotBidPDA } from '../utils/pda';

export class ClaimsModule extends BaseModule {
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

  // Get all claimable slots for an auction
  async getClaimableSlots(auctionData: PublicKey): Promise<Array<{
    slotId: number;
    amount: BN;
    claimType: string;
    currentBidder: PublicKey | null;
  }>> {
    const claimableSlots = [];
    
    // Check first 300 slots for claimable ones
    for (let slotId = 1; slotId <= 300; slotId++) {
      try {
        const slotBid = await this.getSlotBid(auctionData, slotId);
        
        if (slotBid.claimable && !slotBid.distributed) {
          claimableSlots.push({
            slotId,
            amount: slotBid.currentAmount,
            claimType: 'tokens', // or 'refund' based on auction success
            currentBidder: slotBid.currentBidder,
          });
        }
      } catch (error) {
        // Slot doesn't exist, continue
      }
    }
    
    return claimableSlots;
  }

  // Claim tokens for a specific slot
  async claimTokens(
    auctionData: PublicKey,
    tokenMint: PublicKey,
    slotId: number
  ): Promise<string> {
    return this.claimAfterFinalization(auctionData, slotId);
  }

  // Helper methods
  private async getAuctionState(auctionDataPubkey: PublicKey): Promise<any> {
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
      ...(auctions[0].account as any),
      publicKey: auctions[0].publicKey,
    };
  }

  private async getAuctionData(auctionDataPubkey: PublicKey): Promise<any> {
    const account = await this.program.account.auctionData.fetch(auctionDataPubkey);
    return account;
  }

  private async getSlotBid(auctionData: PublicKey, slotId: number): Promise<any> {
    const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
    const account = await this.program.account.slotBid.fetch(slotBidPDA);
    return account;
  }

  private getTokenAmountForSlot(slotId: number): BN {
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

  private async getCurrentBidInfo(auctionData: PublicKey, slotId: number): Promise<{
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
        minNextBid = slotBid.currentAmount.add(new BN(0.01 * 1e9)); // 0.01 SOL minimum increment
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
} 