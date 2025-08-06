"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimsModule = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@coral-xyz/anchor");
const base_1 = require("./base");
const pda_1 = require("../utils/pda");
class ClaimsModule extends base_1.BaseModule {
    // Claim After Finalization
    async claimAfterFinalization(auctionData, slotId) {
        const auctionState = await this.getAuctionState(auctionData);
        const auctionDataAccount = await this.getAuctionData(auctionData);
        const [slotBidPDA] = (0, pda_1.getSlotBidPDA)(auctionData, slotId);
        const [auctionEscrow] = (0, pda_1.getAuctionEscrowPDA)(auctionData);
        const treasuryTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(auctionState.tokenMint, auctionEscrow, true);
        const claimerTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(auctionState.tokenMint, this.wallet.publicKey);
        const tx = await this.program.methods
            .claimAfterFinalization(new anchor_1.BN(slotId))
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
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .rpc();
        return tx;
    }
    // Get detailed slot information for UI display
    async getSlotInfo(auctionData, slotId) {
        const tokenAmount = this.getTokenAmountForSlot(slotId);
        const currentBidInfo = await this.getCurrentBidInfo(auctionData, slotId);
        let isClaimable = false;
        let isDistributed = false;
        if (currentBidInfo.hasBid) {
            try {
                const slotBid = await this.getSlotBid(auctionData, slotId);
                isClaimable = slotBid.claimable;
                isDistributed = slotBid.distributed;
            }
            catch (error) {
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
    async getClaimableSlots(auctionData) {
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
            }
            catch (error) {
                // Slot doesn't exist, continue
            }
        }
        return claimableSlots;
    }
    // Claim tokens for a specific slot
    async claimTokens(auctionData, tokenMint, slotId) {
        return this.claimAfterFinalization(auctionData, slotId);
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
    async getAuctionData(auctionDataPubkey) {
        const account = await this.program.account.auctionData.fetch(auctionDataPubkey);
        return account;
    }
    async getSlotBid(auctionData, slotId) {
        const [slotBidPDA] = (0, pda_1.getSlotBidPDA)(auctionData, slotId);
        const account = await this.program.account.slotBid.fetch(slotBidPDA);
        return account;
    }
    getTokenAmountForSlot(slotId) {
        if (slotId >= 1 && slotId <= 20) {
            return new anchor_1.BN(10000000).mul(new anchor_1.BN(10).pow(new anchor_1.BN(9))); // 10M tokens
        }
        else if (slotId >= 21 && slotId <= 60) {
            return new anchor_1.BN(5000000).mul(new anchor_1.BN(10).pow(new anchor_1.BN(9))); // 5M tokens
        }
        else if (slotId >= 61 && slotId <= 140) {
            return new anchor_1.BN(2500000).mul(new anchor_1.BN(10).pow(new anchor_1.BN(9))); // 2.5M tokens
        }
        else if (slotId >= 141 && slotId <= 300) {
            return new anchor_1.BN(1000000).mul(new anchor_1.BN(10).pow(new anchor_1.BN(9))); // 1M tokens
        }
        else {
            throw new Error('Invalid slot ID');
        }
    }
    async getCurrentBidInfo(auctionData, slotId) {
        try {
            const slotBid = await this.getSlotBid(auctionData, slotId);
            const hasBid = slotBid.currentBidder !== null && slotBid.currentAmount.gt(new anchor_1.BN(0));
            let minNextBid = null;
            if (hasBid) {
                minNextBid = slotBid.currentAmount.add(new anchor_1.BN(0.01 * 1e9)); // 0.01 SOL minimum increment
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
}
exports.ClaimsModule = ClaimsModule;
