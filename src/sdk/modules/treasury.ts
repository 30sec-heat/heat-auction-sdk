import {
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { BaseModule } from './base';
import { getAuctionEscrowPDA, getSlotBidPDA } from '../utils/pda';

export class TreasuryModule extends BaseModule {
  /**
   * @deprecated The old wrapUp function has been replaced with wrapUpSuccessful and wrapUpFailed
   * Use wrapUpSuccessful for successful auctions or wrapUpFailed for failed auctions
   */
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

  // Wrap Up Successful Auction Slot (Treasury Only)
  async wrapUpSuccessful(
    auctionData: PublicKey,
    slotId: number
  ): Promise<string> {
    console.log('\n🏛️ ===== TreasuryModule.wrapUpSuccessful CALLED =====');
    console.log('auctionData:', auctionData.toBase58());
    console.log('slotId:', slotId);
    console.log('wallet publicKey:', this.wallet.publicKey.toBase58());
    console.log('=======================================\n');
    
    try {
      const auctionState = await this.getAuctionState(auctionData);
      const auctionDataAccount = await this.getAuctionData(auctionData);
      const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
      const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
      
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        auctionState.tokenMint,
        auctionEscrow,
        true
      );

      // Get slot bid - must exist for successful wrap up
      const slotBid = await this.getSlotBid(auctionData, slotId);
      
      if (!slotBid.currentBidder) {
        throw new Error(`Slot ${slotId} has no bidder`);
      }

      // Get bidder token account
      const bidderTokenAccount = await getAssociatedTokenAddress(
        auctionState.tokenMint,
        slotBid.currentBidder,
        false
      );
      
      // Check if bidder token account exists, create if it doesn't
      const bidderTokenAccountInfo = await this.connection.getAccountInfo(bidderTokenAccount);
      if (!bidderTokenAccountInfo) {
        console.log(`Creating bidder token account: ${bidderTokenAccount.toBase58()}`);
        
        const createATAIx = createAssociatedTokenAccountInstruction(
          this.wallet.publicKey,
          bidderTokenAccount,
          slotBid.currentBidder,
          auctionState.tokenMint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        
        const createATATx = new Transaction().add(createATAIx);
        const createATASignature = await this.connection.sendTransaction(createATATx, [this.wallet.payer]);
        await this.connection.confirmTransaction(createATASignature, 'confirmed');
        console.log(`Created bidder token account: ${createATASignature}`);
      }

      const accounts = {
        auctionState: auctionState.publicKey,
        auctionData,
        auctionEscrow,
        treasuryTokenAccount,
        mint: auctionState.tokenMint,
        slotBid: slotBidPDA,
        feeReceiver: auctionDataAccount.feeReceiver,
        bidder: slotBid.currentBidder,
        bidderTokenAccount,
        treasuryAuthority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      };

      console.log('\n📦 Accounts for wrapUpSuccessful:');
      console.log('  - Bidder:', slotBid.currentBidder.toBase58());
      console.log('  - Bidder Token Account:', bidderTokenAccount.toBase58());
      console.log('  - Slot ID:', slotId);

      const tx = await this.program.methods
        .wrapUpSuccessful(new BN(slotId))
        .accountsStrict(accounts)
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error in wrapUpSuccessful:', error);
      throw error;
    }
  }

  // Wrap Up Failed Auction Slot (Treasury Only)
  async wrapUpFailed(
    auctionData: PublicKey,
    slotId: number
  ): Promise<string> {
    console.log('\n🏛️ ===== TreasuryModule.wrapUpFailed CALLED =====');
    console.log('auctionData:', auctionData.toBase58());
    console.log('slotId:', slotId);
    console.log('wallet publicKey:', this.wallet.publicKey.toBase58());
    console.log('=======================================\n');
    
    try {
      const auctionState = await this.getAuctionState(auctionData);
      const auctionDataAccount = await this.getAuctionData(auctionData);
      const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
      const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
      
      // Check if slot exists and has a bid
      let slotBid: any = null;
      let bidder: PublicKey | null = null;
      
      try {
        slotBid = await this.getSlotBid(auctionData, slotId);
        bidder = slotBid.currentBidder;
      } catch (error) {
        // Slot doesn't exist or has no bid - this is fine for failed wrap up
        console.log(`Slot ${slotId} doesn't exist or has no bid`);
      }

      const accounts = {
        auctionState: auctionState.publicKey,
        auctionData,
        auctionEscrow,
        slotBid: slotBidPDA,
        feeReceiver: auctionDataAccount.feeReceiver,
        bidder: bidder || this.wallet.publicKey, // Use treasury as default if no bidder
        treasuryAuthority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      };

      console.log('\n📦 Accounts for wrapUpFailed:');
      console.log('  - Bidder:', bidder ? bidder.toBase58() : 'None');
      console.log('  - Slot ID:', slotId);

      const tx = await this.program.methods
        .wrapUpFailed(new BN(slotId))
        .accountsStrict(accounts)
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error in wrapUpFailed:', error);
      throw error;
    }
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
        tokenProgram: TOKEN_PROGRAM_ID,
        feeReceiver: auctionDataAccount.feeReceiver,
        treasuryAuthority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  // Process all slots for an auction using new wrap up methods
  async processAllSlots(auctionData: PublicKey, maxSlots: number = 300): Promise<void> {
    console.log(`Processing ${maxSlots} slots for auction...`);
    
    // First determine if auction was successful
    const auctionState = await this.getAuctionState(auctionData);
    const isSuccessful = auctionState.totalVolume.gte(new BN(50_000_000_000)); // MIN_SUCCESSFUL_RAISE = 50 SOL
    console.log(`Auction successful: ${isSuccessful}, raised: ${auctionState.totalVolume.toNumber() / 1e9} SOL`);
    
    for (let slotId = 1; slotId <= maxSlots; slotId++) {
      try {
        console.log(`Processing slot ${slotId}...`);
        let tx: string;
        
        if (isSuccessful) {
          tx = await this.wrapUpSuccessful(auctionData, slotId);
        } else {
          tx = await this.wrapUpFailed(auctionData, slotId);
        }
        
        console.log(`  ✅ Slot ${slotId} processed: ${tx}`);
      } catch (error: any) {
        // Some slots might not exist or already be processed
        if (error.message.includes('AccountNotInitialized')) {
          console.log(`  ⏭️ Slot ${slotId} doesn't exist, skipping`);
        } else if (error.message.includes('AccountClosed')) {
          console.log(`  ⏭️ Slot ${slotId} already closed, skipping`);
        } else {
          console.error(`  ❌ Failed to process slot ${slotId}:`, error.message);
          // Optionally, you might want to continue or break depending on the error
        }
      }
    }
    
    console.log('All slots processed!');
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
}