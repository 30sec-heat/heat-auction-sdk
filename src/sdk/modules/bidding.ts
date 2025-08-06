import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { BaseModule } from './base';
import { getAuctionEscrowPDA, getSlotBidPDA } from '../utils/pda';
import { validateBidAmount, validateSlotId } from '../utils/validation';
import { calculateMinNextBid } from '../utils/calculations';
import { CONSTANTS } from '../constants';

export class BiddingModule extends BaseModule {
  // Place First Bid
  async placeFirstBid(
    auctionData: PublicKey,
    mint: PublicKey,
    slotId: number,
    bidAmount: BN
  ): Promise<string> {
    validateSlotId(slotId);
    validateBidAmount(bidAmount);
    
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
    validateSlotId(slotId);
    validateBidAmount(bidAmount);
    
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

  // Smart Bidding - Automatically determines whether to place first bid or outbid
  async placeBid(
    auctionData: PublicKey,
    mint: PublicKey,
    slotId: number,
    bidAmount: BN
  ): Promise<{ tx: string; action: 'first_bid' | 'outbid' }> {
    validateBidAmount(bidAmount);
    
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
        minNextBid = calculateMinNextBid(slotBid.currentAmount);
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
      validateBidAmount(newBidAmount);
      
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
        minNextBid: calculateMinNextBid(slot.account.currentAmount)
      }))
      .sort((a, b) => a.slotId - b.slotId);
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

  private async getSlotBid(auctionData: PublicKey, slotId: number): Promise<any> {
    const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
    const account = await this.program.account.slotBid.fetch(slotBidPDA);
    return account;
  }

  private async getSlotBidsForAuction(auctionData: PublicKey): Promise<Array<{ publicKey: PublicKey; account: any }>> {
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
      account: s.account,
    }));
  }
} 