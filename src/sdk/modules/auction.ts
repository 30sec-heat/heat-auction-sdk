import {
  PublicKey,
  Keypair,
  SystemProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { BaseModule } from './base';
import { getAuctionEscrowPDA, getMetadataPDA } from '../utils/pda';
import { TREASURY_AUTHORITY_PUBKEY, TOKEN_METADATA_PROGRAM_ID } from '../constants';
import { AuctionDuration } from '../constants';

export class AuctionModule extends BaseModule {
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
    for (let slotId = 1; slotId <= 300; slotId++) {
      const hasBid = await this.slotHasExistingBid(auctionData, slotId);
      if (hasBid) {
        activeSlots++;
      }
    }
    
    return {
      isActive,
      endTime: auctionState.endTime,
      timeRemaining,
      totalSlots: 300,
      activeSlots,
      totalVolume: auctionState.totalVolume,
      isSuccessful: this.isAuctionSuccessful(auctionState.totalVolume),
    };
  }

  // Helper methods (these would be moved from the main SDK)
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

  private async slotHasExistingBid(auctionData: PublicKey, slotId: number): Promise<boolean> {
    try {
      const [slotBidPDA] = getAuctionEscrowPDA(auctionData);
      const slotBid = await this.program.account.slotBid.fetch(slotBidPDA);
      return slotBid.currentBidder !== null && slotBid.currentAmount.gt(new BN(0));
    } catch (error) {
      return false;
    }
  }

  private isAuctionSuccessful(totalVolume: BN): boolean {
    return totalVolume.gte(new BN(50 * 1e9)); // 50 SOL minimum
  }
} 