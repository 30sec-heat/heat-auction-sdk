"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiddingModule = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@coral-xyz/anchor");
const base_1 = require("./base");
const pda_1 = require("../utils/pda");
const validation_1 = require("../utils/validation");
const calculations_1 = require("../utils/calculations");
const constants_1 = require("../constants");
class BiddingModule extends base_1.BaseModule {
    // Place First Bid
    async placeFirstBid(auctionData, mint, slotId, bidAmount) {
        (0, validation_1.validateSlotId)(slotId);
        (0, validation_1.validateBidAmount)(bidAmount);
        const auctionState = await this.getAuctionState(auctionData);
        const [slotBidPDA] = (0, pda_1.getSlotBidPDA)(auctionData, slotId);
        const [auctionEscrow] = (0, pda_1.getAuctionEscrowPDA)(auctionData);
        const bidderTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(mint, this.wallet.publicKey);
        const tx = await this.program.methods
            .placeFirstBid(new anchor_1.BN(slotId), bidAmount)
            .accountsStrict({
            auctionState: auctionState.publicKey,
            auctionData,
            slotBid: slotBidPDA,
            bidder: this.wallet.publicKey,
            bidderTokenAccount,
            auctionEscrow,
            mint,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
        })
            .rpc();
        return tx;
    }
    // Outbid
    async outbid(auctionData, mint, slotId, bidAmount) {
        (0, validation_1.validateSlotId)(slotId);
        (0, validation_1.validateBidAmount)(bidAmount);
        const auctionState = await this.getAuctionState(auctionData);
        const [slotBidPDA] = (0, pda_1.getSlotBidPDA)(auctionData, slotId);
        const slotBid = await this.getSlotBid(auctionData, slotId);
        if (!slotBid.currentBidder) {
            throw new Error('No current bidder for this slot');
        }
        const [auctionEscrow] = (0, pda_1.getAuctionEscrowPDA)(auctionData);
        const bidderTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(mint, this.wallet.publicKey);
        const tx = await this.program.methods
            .outbid(new anchor_1.BN(slotId), bidAmount)
            .accountsStrict({
            auctionState: auctionState.publicKey,
            auctionData,
            slotBid: slotBidPDA,
            bidder: this.wallet.publicKey,
            bidderTokenAccount,
            auctionEscrow,
            mint,
            previousBidder: slotBid.currentBidder,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
        })
            .rpc();
        return tx;
    }
    // Smart Bidding - Automatically determines whether to place first bid or outbid
    async placeBid(auctionData, mint, slotId, bidAmount) {
        (0, validation_1.validateBidAmount)(bidAmount);
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
        }
        else {
            // No existing bid, place first bid
            const tx = await this.placeFirstBid(auctionData, mint, slotId, bidAmount);
            return { tx, action: 'first_bid' };
        }
    }
    // Check if a slot has an existing bid
    async slotHasExistingBid(auctionData, slotId) {
        try {
            const slotBid = await this.getSlotBid(auctionData, slotId);
            return slotBid.currentBidder !== null && slotBid.currentAmount.gt(new anchor_1.BN(0));
        }
        catch (error) {
            // If slot doesn't exist or can't be fetched, assume no existing bid
            return false;
        }
    }
    // Get current bid information for a slot
    async getCurrentBidInfo(auctionData, slotId) {
        try {
            const slotBid = await this.getSlotBid(auctionData, slotId);
            const hasBid = slotBid.currentBidder !== null && slotBid.currentAmount.gt(new anchor_1.BN(0));
            let minNextBid = null;
            if (hasBid) {
                minNextBid = (0, calculations_1.calculateMinNextBid)(slotBid.currentAmount);
            }
            return {
                hasBid,
                currentBidder: slotBid.currentBidder,
                currentAmount: hasBid ? slotBid.currentAmount : null,
                minNextBid,
            };
        }
        catch (error) {
            return {
                hasBid: false,
                currentBidder: null,
                currentAmount: null,
                minNextBid: null,
            };
        }
    }
    // Check if current user is the highest bidder on a slot
    async isCurrentUserHighestBidder(auctionData, slotId) {
        try {
            const currentBidInfo = await this.getCurrentBidInfo(auctionData, slotId);
            return currentBidInfo.hasBid &&
                currentBidInfo.currentBidder !== null &&
                currentBidInfo.currentBidder.equals(this.wallet.publicKey);
        }
        catch (error) {
            return false;
        }
    }
    // Hostile Takeover - Outbid 1-5 slots of a specific person in one bundled transaction
    async hostileTakeover(auctionData, mint, targetBidder, outbidIncrement = constants_1.CONSTANTS.MIN_BID_INCREMENT) {
        // Get all slot bids for the auction
        const slotBids = await this.getSlotBidsForAuction(auctionData);
        // Filter slots where target bidder is the current highest bidder
        const allTargetSlots = slotBids.filter(slot => slot.account.currentBidder &&
            slot.account.currentBidder.equals(targetBidder) &&
            slot.account.currentAmount.gt(new anchor_1.BN(0)));
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
        const [auctionEscrow] = (0, pda_1.getAuctionEscrowPDA)(auctionData);
        const bidderTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(mint, this.wallet.publicKey);
        // Create outbid instructions for each slot
        const instructions = [];
        const slotIds = [];
        let totalCost = new anchor_1.BN(0);
        for (const slot of targetSlots) {
            const slotId = slot.account.slotId.toNumber();
            const currentAmount = slot.account.currentAmount;
            const newBidAmount = currentAmount.add(outbidIncrement);
            // Validate the new bid amount
            (0, validation_1.validateBidAmount)(newBidAmount);
            // Get slot bid PDA for this slot
            const [slotBidPDA] = (0, pda_1.getSlotBidPDA)(auctionData, slotId);
            // Create outbid instruction
            const outbidIx = await this.program.methods
                .outbid(new anchor_1.BN(slotId), newBidAmount)
                .accountsStrict({
                auctionState: auctionState.publicKey,
                auctionData,
                slotBid: slotBidPDA,
                bidder: this.wallet.publicKey,
                bidderTokenAccount,
                auctionEscrow,
                mint,
                previousBidder: targetBidder,
                systemProgram: web3_js_1.SystemProgram.programId,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            })
                .instruction();
            instructions.push(outbidIx);
            slotIds.push(slotId);
            totalCost = totalCost.add(newBidAmount);
            console.log(`  📍 Slot ${slotId}: ${currentAmount.toString()} → ${newBidAmount.toString()} lamports`);
        }
        // Create and send the bundled transaction
        const transaction = new web3_js_1.Transaction();
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
                }
                else {
                    console.log(`  ✅ Transaction info fetched successfully`);
                }
            }
            catch (error) {
                retries++;
                console.log(`  Retry ${retries}/${maxRetries}: Error fetching transaction - ${error}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        const computeUnitsUsed = txInfo?.meta?.computeUnitsConsumed || 0;
        const fee = txInfo?.meta?.fee || 0;
        console.log(`✅ Hostile takeover bundled transaction sent: ${tx}`);
        console.log(`💰 Total cost: ${totalCost.toString()} lamports (${totalCost.toNumber() / web3_js_1.LAMPORTS_PER_SOL} SOL)`);
        console.log(`🎯 Slots taken: ${slotIds.length}`);
        console.log(`📋 Slots: ${slotIds.join(', ')}`);
        console.log(`🔗 Single signature required!`);
        console.log(`📊 Transaction metrics:`);
        console.log(`   - Size: ${transactionSize} bytes`);
        console.log(`   - Compute Units: ${computeUnitsUsed}`);
        console.log(`   - Fee: ${fee} lamports (${fee / web3_js_1.LAMPORTS_PER_SOL} SOL)`);
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
    async calculateHostileTakeoverCost(auctionData, targetBidder, outbidIncrement = constants_1.CONSTANTS.MIN_BID_INCREMENT) {
        const targetSlots = await this.getSlotsByBidder(auctionData, targetBidder);
        if (targetSlots.length === 0) {
            return {
                totalCost: new anchor_1.BN(0),
                slotCount: 0,
                slots: []
            };
        }
        let totalCost = new anchor_1.BN(0);
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
    async getSlotsByBidder(auctionData, bidder) {
        const slotBids = await this.getSlotBidsForAuction(auctionData);
        return slotBids
            .filter(slot => slot.account.currentBidder &&
            slot.account.currentBidder.equals(bidder) &&
            slot.account.currentAmount.gt(new anchor_1.BN(0)))
            .map(slot => ({
            slotId: slot.account.slotId.toNumber(),
            currentAmount: slot.account.currentAmount,
            minNextBid: (0, calculations_1.calculateMinNextBid)(slot.account.currentAmount)
        }))
            .sort((a, b) => a.slotId - b.slotId);
    }
    // Helper methods
    async getAuctionState(auctionDataPubkey) {
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
            ...auctions[0].account,
            publicKey: auctions[0].publicKey,
        };
    }
    async getSlotBid(auctionData, slotId) {
        const [slotBidPDA] = (0, pda_1.getSlotBidPDA)(auctionData, slotId);
        const account = await this.program.account.slotBid.fetch(slotBidPDA);
        return account;
    }
    async getSlotBidsForAuction(auctionData) {
        const slotBids = await this.program.account.slotBid.all([
            {
                memcmp: {
                    offset: 8, // After discriminator
                    bytes: auctionData.toBase58(),
                },
            },
        ]);
        return slotBids.map((s) => ({
            publicKey: s.publicKey,
            account: s.account,
        }));
    }
}
exports.BiddingModule = BiddingModule;
