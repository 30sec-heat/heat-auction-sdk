"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionModule = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@coral-xyz/anchor");
const base_1 = require("./base");
const pda_1 = require("../utils/pda");
const constants_1 = require("../constants");
class AuctionModule extends base_1.BaseModule {
    // Create Token and Auction
    async createTokenAndAuction(name, symbol, uri, durationOption, mint, auctionData, auctionState) {
        const [auctionEscrow] = (0, pda_1.getAuctionEscrowPDA)(auctionData.publicKey);
        const treasuryTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(mint.publicKey, auctionEscrow, true);
        const treasuryAuthorityAta = await (0, spl_token_1.getAssociatedTokenAddress)(mint.publicKey, constants_1.TREASURY_AUTHORITY_PUBKEY);
        // Get metadata PDA for the token
        const [metadataPDA] = (0, pda_1.getMetadataPDA)(mint.publicKey);
        const tx = await this.program.methods
            .createTokenAndAuction(name, symbol, uri, durationOption)
            .accountsStrict({
            mint: mint.publicKey,
            auctionData: auctionData.publicKey,
            auctionState: auctionState.publicKey,
            auctionEscrow,
            treasuryTokenAccount,
            treasuryAuthorityAta,
            treasuryAuthority: constants_1.TREASURY_AUTHORITY_PUBKEY,
            creator: this.wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: new web3_js_1.PublicKey('SysvarRent111111111111111111111111111111111'),
        })
            .remainingAccounts([
            {
                pubkey: metadataPDA,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: constants_1.TOKEN_METADATA_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
            },
        ])
            .signers([mint, auctionData, auctionState])
            .rpc();
        return tx;
    }
    // End Auction (Treasury Only)
    async endAuction(auctionData) {
        const auctionState = await this.getAuctionState(auctionData);
        const tx = await this.program.methods
            .endAuction()
            .accountsStrict({
            auctionData,
            auctionState: auctionState.publicKey,
            treasuryAuthority: this.wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
        })
            .rpc();
        return tx;
    }
    // Get auction status and bidding information
    async getAuctionBiddingInfo(auctionData) {
        const auctionState = await this.getAuctionState(auctionData);
        const now = new anchor_1.BN(Math.floor(Date.now() / 1000));
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
    async slotHasExistingBid(auctionData, slotId) {
        try {
            const [slotBidPDA] = (0, pda_1.getAuctionEscrowPDA)(auctionData);
            const slotBid = await this.program.account.slotBid.fetch(slotBidPDA);
            return slotBid.currentBidder !== null && slotBid.currentAmount.gt(new anchor_1.BN(0));
        }
        catch (error) {
            return false;
        }
    }
    isAuctionSuccessful(totalVolume) {
        return totalVolume.gte(new anchor_1.BN(50 * 1e9)); // 50 SOL minimum
    }
}
exports.AuctionModule = AuctionModule;
