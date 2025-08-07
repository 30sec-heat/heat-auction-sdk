"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BomboclatSDK = exports.AuctionDuration = exports.CONSTANTS = exports.TREASURY_AUTHORITY_PUBKEY = exports.FEE_RECEIVER_PUBKEY = exports.PROGRAM_ID = void 0;
exports.getAuctionEscrowPDA = getAuctionEscrowPDA;
exports.getSlotBidPDA = getSlotBidPDA;
exports.getMetadataPDA = getMetadataPDA;
exports.createBomboclatSDK = createBomboclatSDK;
exports.createHeatSDK = createHeatSDK;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@coral-xyz/anchor");
// Import from constants module (which has env config)
const constants_1 = require("./sdk/constants");
Object.defineProperty(exports, "PROGRAM_ID", { enumerable: true, get: function () { return constants_1.PROGRAM_ID; } });
Object.defineProperty(exports, "FEE_RECEIVER_PUBKEY", { enumerable: true, get: function () { return constants_1.FEE_RECEIVER_PUBKEY; } });
Object.defineProperty(exports, "TREASURY_AUTHORITY_PUBKEY", { enumerable: true, get: function () { return constants_1.TREASURY_AUTHORITY_PUBKEY; } });
// Constants from the program
exports.CONSTANTS = {
    REQUIRED_MAX_SUPPLY: new anchor_1.BN(760000000).mul(new anchor_1.BN(10).pow(new anchor_1.BN(9))), // 760M tokens
    MIN_ACTIVE_BID_SOL: new anchor_1.BN(0.001 * web3_js_1.LAMPORTS_PER_SOL),
    MAX_BID_INCREMENT: new anchor_1.BN(5000 * web3_js_1.LAMPORTS_PER_SOL),
    BID_FEE: new anchor_1.BN(0.00001 * web3_js_1.LAMPORTS_PER_SOL),
    MAX_SLOTS: 300,
    MIN_BID_AMOUNT: new anchor_1.BN(0.0001 * web3_js_1.LAMPORTS_PER_SOL),
    MAX_BID_AMOUNT: new anchor_1.BN(5000 * web3_js_1.LAMPORTS_PER_SOL),
    MIN_BID_INCREMENT: new anchor_1.BN(0.01 * web3_js_1.LAMPORTS_PER_SOL),
    TOKEN_DECIMALS: 9,
    MIN_SUCCESSFUL_RAISE: new anchor_1.BN(50 * web3_js_1.LAMPORTS_PER_SOL),
    PROTOCOL_FEE_BPS: new anchor_1.BN(50), // 0.5%
    BASIS_POINTS_DIVISOR: new anchor_1.BN(10000),
    MAX_AUCTION_EXTENSION: new anchor_1.BN(3600), // 1 hour
    CREATION_FEE: new anchor_1.BN(0.005 * web3_js_1.LAMPORTS_PER_SOL),
    CLAIM_PERIOD_DAYS: 1095, // 3 years
};
// Auction Duration Options
var AuctionDuration;
(function (AuctionDuration) {
    AuctionDuration[AuctionDuration["ONE_MINUTE"] = 0] = "ONE_MINUTE";
    AuctionDuration[AuctionDuration["ONE_HOUR"] = 1] = "ONE_HOUR";
    AuctionDuration[AuctionDuration["ONE_DAY"] = 2] = "ONE_DAY";
})(AuctionDuration || (exports.AuctionDuration = AuctionDuration = {}));
// Helper functions
function getAuctionEscrowPDA(auctionData) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('auction_escrow'), auctionData.toBuffer()], constants_1.PROGRAM_ID);
}
function getSlotBidPDA(auctionData, slotId) {
    const slotIdBN = typeof slotId === 'number' ? new anchor_1.BN(slotId) : slotId;
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('slot_bid'), auctionData.toBuffer(), slotIdBN.toArrayLike(Buffer, 'le', 8)], constants_1.PROGRAM_ID);
}
function getMetadataPDA(mint) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('metadata'), constants_1.TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()], constants_1.TOKEN_METADATA_PROGRAM_ID);
}
class BomboclatSDK {
    constructor(connection, wallet, idl) {
        // Event listening properties
        this.eventListeners = new Map();
        this.websocketConnection = null;
        this.isListening = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // 1 second
        this.connection = connection;
        this.wallet = wallet;
        const provider = new anchor_1.AnchorProvider(connection, wallet, {
            commitment: 'confirmed',
        });
        // Create the Anchor Program instance with proper typing
        // The order is: idl, programId, provider (not programId, idl, provider)
        this.program = new anchor_1.Program(idl, provider);
    }
    // Create Token and Auction
    async createTokenAndAuction(name, symbol, uri, durationOption, mint, auctionData, auctionState) {
        const [auctionEscrow] = getAuctionEscrowPDA(auctionData.publicKey);
        const treasuryTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(mint.publicKey, auctionEscrow, true);
        const treasuryAuthorityAta = await (0, spl_token_1.getAssociatedTokenAddress)(mint.publicKey, constants_1.TREASURY_AUTHORITY_PUBKEY);
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
    // Place First Bid
    async placeFirstBid(auctionData, mint, slotId, bidAmount) {
        const auctionState = await this.getAuctionState(auctionData);
        const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
        const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
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
        const auctionState = await this.getAuctionState(auctionData);
        const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
        const slotBid = await this.getSlotBid(auctionData, slotId);
        if (!slotBid.currentBidder) {
            throw new Error('No current bidder for this slot');
        }
        const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
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
    // Wrap Up Slot (Treasury Only)
    // Wrap Up (Treasury Only) - DEPRECATED: Use wrapUpSuccessful or wrapUpFailed instead
    async wrapUp(auctionData, slotId) {
        console.log('⚠️ Warning: wrapUp is deprecated. Use wrapUpSuccessful or wrapUpFailed instead');
        // Determine auction success and delegate to appropriate function
        const auctionState = await this.getAuctionState(auctionData);
        const isSuccessful = auctionState.totalVolume.gte(new anchor_1.BN(50000000000)); // 50 SOL minimum
        if (isSuccessful) {
            console.log('  → Delegating to wrapUpSuccessful');
            return this.wrapUpSuccessful(auctionData, slotId);
        }
        else {
            console.log('  → Delegating to wrapUpFailed');
            return this.wrapUpFailed(auctionData, slotId);
        }
    }
    // Wrap Up Successful (Treasury Only)
    async wrapUpSuccessful(auctionData, slotId) {
        const auctionState = await this.getAuctionState(auctionData);
        const auctionDataAccount = await this.getAuctionData(auctionData);
        const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
        const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
        const accounts = {
            auctionState: auctionState.publicKey,
            auctionData,
            auctionEscrow,
            slotBid: slotBidPDA,
            feeReceiver: auctionDataAccount.feeReceiver,
            treasuryAuthority: this.wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
        };
        // Add bidder account if slot has a bidder
        const slotBid = await this.getSlotBid(auctionData, slotId);
        if (slotBid.currentBidder) {
            accounts.bidder = slotBid.currentBidder;
        }
        const tx = await this.program.methods
            .wrapUpSuccessful(new anchor_1.BN(slotId))
            .accountsPartial(accounts)
            .rpc();
        return tx;
    }
    // Wrap Up Failed (Treasury Only)
    async wrapUpFailed(auctionData, slotId) {
        const auctionState = await this.getAuctionState(auctionData);
        const auctionDataAccount = await this.getAuctionData(auctionData);
        const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
        const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
        const accounts = {
            auctionState: auctionState.publicKey,
            auctionData,
            auctionEscrow,
            slotBid: slotBidPDA,
            feeReceiver: auctionDataAccount.feeReceiver,
            treasuryAuthority: this.wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
        };
        // Add bidder account if slot has a bidder
        const slotBid = await this.getSlotBid(auctionData, slotId);
        if (slotBid.currentBidder) {
            accounts.bidder = slotBid.currentBidder;
        }
        const tx = await this.program.methods
            .wrapUpFailed(new anchor_1.BN(slotId))
            .accountsPartial(accounts)
            .rpc();
        return tx;
    }
    // Claim After Finalization
    async claimAfterFinalization(auctionData, slotId) {
        const auctionState = await this.getAuctionState(auctionData);
        const auctionDataAccount = await this.getAuctionData(auctionData);
        const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
        const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
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
    // Get SOL for Migration (Treasury Only)
    async getSolForMig(auctionData) {
        const auctionState = await this.getAuctionState(auctionData);
        const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
        const tx = await this.program.methods
            .getSolForMig()
            .accountsStrict({
            auctionState: auctionState.publicKey,
            auctionEscrow,
            treasuryAuthority: this.wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .rpc();
        return tx;
    }
    // Distribute Protocol Fees (Treasury Only)
    async distributeProtocolFees(auctionData) {
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
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .rpc();
        return tx;
    }
    // Close Auction Accounts (Treasury Only)
    async closeAuctionAccounts(auctionData) {
        const auctionState = await this.getAuctionState(auctionData);
        const auctionDataAccount = await this.getAuctionData(auctionData);
        const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
        // Get treasury token account for the mint
        const treasuryTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(auctionState.tokenMint, auctionEscrow, true);
        const tx = await this.program.methods
            .closeAuctionAccounts()
            .accountsStrict({
            auctionState: auctionState.publicKey,
            auctionData,
            auctionEscrow,
            treasuryTokenAccount,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            feeReceiver: auctionDataAccount.feeReceiver,
            treasuryAuthority: this.wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .rpc();
        return tx;
    }
    // Data Fetching Methods
    async getAuctionData(auctionDataPubkey) {
        const account = await this.program.account.auctionData.fetch(auctionDataPubkey);
        return account;
    }
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
        const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
        const account = await this.program.account.slotBid.fetch(slotBidPDA);
        return account;
    }
    async getEscrow(auctionData) {
        const [escrowPDA] = getAuctionEscrowPDA(auctionData);
        const account = await this.program.account.escrow.fetch(escrowPDA);
        return account;
    }
    async getAllActiveAuctions() {
        const auctions = await this.program.account.auctionState.all([
            {
                memcmp: {
                    offset: 8 + 32 + 32 + 32 + 8 + 8 + 8, // Position of isActive
                    bytes: Buffer.from([1]).toString('base64'),
                },
            },
        ]);
        return auctions.map((a) => ({
            publicKey: a.publicKey,
            account: a.account,
        }));
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
    // Utility Methods
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
    calculateRefundAmount(bidAmount) {
        const protocolFee = bidAmount
            .mul(exports.CONSTANTS.PROTOCOL_FEE_BPS)
            .div(exports.CONSTANTS.BASIS_POINTS_DIVISOR);
        const refundAmount = bidAmount.sub(protocolFee);
        return { refundAmount, protocolFee };
    }
    isAuctionSuccessful(totalVolume) {
        return totalVolume.gte(exports.CONSTANTS.MIN_SUCCESSFUL_RAISE);
    }
    getAuctionDurationSeconds(durationOption) {
        switch (durationOption) {
            case AuctionDuration.ONE_MINUTE:
                return 60;
            case AuctionDuration.ONE_HOUR:
                return 3600;
            case AuctionDuration.ONE_DAY:
                return 86400;
            default:
                throw new Error('Invalid auction duration');
        }
    }
    // Event Parsing
    async getEventsForAuction(auctionData, eventName) {
        const events = await this.connection.getSignaturesForAddress(constants_1.PROGRAM_ID, {
            limit: 1000,
        });
        const parsedEvents = [];
        for (const event of events) {
            try {
                const tx = await this.connection.getParsedTransaction(event.signature, {
                    maxSupportedTransactionVersion: 0,
                });
                if (!tx?.meta?.logMessages)
                    continue;
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
            }
            catch (error) {
                console.error('Error parsing event:', error);
            }
        }
        return parsedEvents;
    }
    parseEventLog(log) {
        // Implementation depends on how your program emits events
        // This is a placeholder that should be implemented based on actual log format
        try {
            const jsonStr = log.substring(log.indexOf('{'));
            return JSON.parse(jsonStr);
        }
        catch {
            return null;
        }
    }
    // Smart Bidding - Automatically determines whether to place first bid or outbid
    async placeBid(auctionData, mint, slotId, bidAmount) {
        // Validate bid amount
        this.validateBidAmount(bidAmount);
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
                minNextBid = this.calculateMinNextBid(slotBid.currentAmount);
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
    // Calculate minimum bid amount for next bid
    calculateMinNextBid(currentBidAmount) {
        const minIncrement = exports.CONSTANTS.MIN_BID_INCREMENT;
        return currentBidAmount.add(minIncrement);
    }
    // Validate bid amount against program constraints
    validateBidAmount(bidAmount) {
        if (bidAmount.lt(exports.CONSTANTS.MIN_BID_AMOUNT)) {
            throw new Error(`Bid amount must be at least ${exports.CONSTANTS.MIN_BID_AMOUNT.toString()} lamports`);
        }
        if (bidAmount.gt(exports.CONSTANTS.MAX_BID_AMOUNT)) {
            throw new Error(`Bid amount cannot exceed ${exports.CONSTANTS.MAX_BID_AMOUNT.toString()} lamports`);
        }
    }
    // Validate outbid amount against current bid
    async validateOutbidAmount(auctionData, slotId, bidAmount) {
        const currentBidInfo = await this.getCurrentBidInfo(auctionData, slotId);
        if (!currentBidInfo.hasBid) {
            throw new Error('No existing bid to outbid');
        }
        if (currentBidInfo.currentAmount && bidAmount.lte(currentBidInfo.currentAmount)) {
            throw new Error(`Bid amount must be greater than current bid of ${currentBidInfo.currentAmount.toString()} lamports`);
        }
        if (currentBidInfo.minNextBid && bidAmount.lt(currentBidInfo.minNextBid)) {
            throw new Error(`Bid amount must be at least ${currentBidInfo.minNextBid.toString()} lamports to meet minimum increment`);
        }
    }
    // Get auction status and bidding information
    async getAuctionBiddingInfo(auctionData) {
        const auctionState = await this.getAuctionState(auctionData);
        const now = new anchor_1.BN(Math.floor(Date.now() / 1000));
        const timeRemaining = Math.max(0, auctionState.endTime.toNumber() - now.toNumber());
        const isActive = auctionState.isActive && timeRemaining > 0;
        // Count active slots (slots with bids)
        let activeSlots = 0;
        for (let slotId = 1; slotId <= exports.CONSTANTS.MAX_SLOTS; slotId++) {
            const hasBid = await this.slotHasExistingBid(auctionData, slotId);
            if (hasBid) {
                activeSlots++;
            }
        }
        return {
            isActive,
            endTime: auctionState.endTime,
            timeRemaining,
            totalSlots: exports.CONSTANTS.MAX_SLOTS,
            activeSlots,
            totalVolume: auctionState.totalVolume,
            isSuccessful: this.isAuctionSuccessful(auctionState.totalVolume),
        };
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
    // Hostile Takeover - Outbid 1-5 slots of a specific person in one bundled transaction
    async hostileTakeover(auctionData, mint, targetBidder, outbidIncrement = exports.CONSTANTS.MIN_BID_INCREMENT) {
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
        const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
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
            this.validateBidAmount(newBidAmount);
            // Get slot bid PDA for this slot
            const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
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
            minNextBid: this.calculateMinNextBid(slot.account.currentAmount)
        }))
            .sort((a, b) => a.slotId - b.slotId);
    }
    // Calculate total cost to take over all slots of a specific person
    async calculateHostileTakeoverCost(auctionData, targetBidder, outbidIncrement = exports.CONSTANTS.MIN_BID_INCREMENT) {
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
    // ========================================
    // EVENT LISTENING METHODS
    // ========================================
    /**
     * Subscribe to real-time auction events
     * @param filter - Optional filter for specific auction or event type
     * @param callback - Function to call when events are received
     * @returns Subscription ID for unsubscribing
     */
    onAuctionEvent(filter, callback) {
        const subscriptionId = Math.random().toString(36).substring(2, 15);
        const key = this.getEventKey(filter);
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, new Set());
        }
        this.eventListeners.get(key).add(callback);
        // Start listening if not already started
        if (!this.isListening) {
            this.startEventListening();
        }
        return subscriptionId;
    }
    /**
     * Subscribe to all auction events (no filter)
     */
    onAllAuctionEvents(callback) {
        return this.onAuctionEvent({}, callback);
    }
    /**
     * Subscribe to events for a specific auction
     */
    onAuctionEvents(auctionData, callback) {
        return this.onAuctionEvent({ auctionData }, callback);
    }
    /**
     * Subscribe to specific event types
     */
    onEventType(eventType, callback) {
        return this.onAuctionEvent({ eventType }, callback);
    }
    /**
     * Unsubscribe from events using subscription ID
     */
    offAuctionEvent(subscriptionId) {
        // Implementation would track subscription IDs
        // For now, this is a placeholder
        console.log(`Unsubscribed from events: ${subscriptionId}`);
    }
    /**
     * Remove all event listeners
     */
    removeAllEventListeners() {
        this.eventListeners.clear();
        this.stopEventListening();
    }
    /**
     * Start listening to program events via WebSocket
     */
    async startEventListening() {
        if (this.isListening)
            return;
        try {
            this.isListening = true;
            console.log('🔊 Starting event listening...');
            // Use WebSocket connection for real-time events
            const wsUrl = this.connection.rpcEndpoint.replace('https://', 'wss://').replace('http://', 'ws://');
            // For now, we'll use polling as a fallback
            // In production, you'd implement proper WebSocket connection
            this.startPolling();
        }
        catch (error) {
            console.error('❌ Failed to start event listening:', error);
            this.isListening = false;
        }
    }
    /**
     * Stop listening to events
     */
    stopEventListening() {
        this.isListening = false;
        console.log('🔇 Stopped event listening');
    }
    /**
     * Poll for new events (fallback method)
     */
    async startPolling() {
        let lastSignature = null;
        const poll = async () => {
            if (!this.isListening)
                return;
            try {
                const signatures = await this.connection.getSignaturesForAddress(constants_1.PROGRAM_ID, {
                    limit: 10,
                    ...(lastSignature && { before: lastSignature }),
                });
                for (const sig of signatures) {
                    if (lastSignature && sig.signature === lastSignature)
                        continue;
                    const tx = await this.connection.getTransaction(sig.signature, {
                        maxSupportedTransactionVersion: 0,
                    });
                    if (tx?.meta?.logMessages) {
                        this.processTransactionLogs(tx.meta.logMessages, sig.signature);
                    }
                }
                if (signatures.length > 0) {
                    lastSignature = signatures[0].signature;
                }
            }
            catch (error) {
                console.error('❌ Error polling for events:', error);
            }
            // Poll every 2 seconds
            setTimeout(poll, 2000);
        };
        poll();
    }
    /**
     * Process transaction logs to extract events
     */
    processTransactionLogs(logs, signature) {
        for (const log of logs) {
            if (log.includes('Program log:') && log.includes('auction')) {
                try {
                    const event = this.parseEventFromLog(log);
                    if (event) {
                        this.notifyEventListeners(event);
                    }
                }
                catch (error) {
                    console.error('❌ Error parsing event log:', error);
                }
            }
        }
    }
    /**
     * Parse event from program log
     */
    parseEventFromLog(log) {
        try {
            // Extract event data from log
            const eventData = this.parseEventLog(log);
            if (!eventData)
                return null;
            // Convert to typed event
            return this.convertToTypedEvent(eventData);
        }
        catch (error) {
            console.error('❌ Error parsing event:', error);
            return null;
        }
    }
    /**
     * Convert raw event data to typed event
     */
    convertToTypedEvent(data) {
        const baseEvent = {
            auction: new web3_js_1.PublicKey(data.auction),
            tokenMint: new web3_js_1.PublicKey(data.token_mint),
            timestamp: new anchor_1.BN(data.timestamp),
        };
        switch (data.type) {
            case 'AuctionInitialized':
                return {
                    ...baseEvent,
                    type: 'AuctionInitialized',
                    creator: new web3_js_1.PublicKey(data.creator),
                    tokenName: data.token_name,
                    tokenSymbol: data.token_symbol,
                    tokenUri: data.token_uri,
                    auctionDuration: new anchor_1.BN(data.auction_duration),
                    maxBidIncrement: new anchor_1.BN(data.max_bid_increment),
                    legendaryTokens: new anchor_1.BN(data.legendary_tokens),
                    artefactTokens: new anchor_1.BN(data.artefact_tokens),
                    rareTokens: new anchor_1.BN(data.rare_tokens),
                    magicTokens: new anchor_1.BN(data.magic_tokens),
                };
            case 'BidPlaced':
                return {
                    ...baseEvent,
                    type: 'BidPlaced',
                    bidder: new web3_js_1.PublicKey(data.bidder),
                    slotId: new anchor_1.BN(data.slot_id),
                    amount: new anchor_1.BN(data.amount),
                };
            case 'AuctionExtended':
                return {
                    ...baseEvent,
                    type: 'AuctionExtended',
                    newEndTime: new anchor_1.BN(data.new_end_time),
                };
            case 'AuctionEnded':
                return {
                    ...baseEvent,
                    type: 'AuctionEnded',
                };
            case 'RefundProcessed':
                return {
                    ...baseEvent,
                    type: 'RefundProcessed',
                    bidder: new web3_js_1.PublicKey(data.bidder),
                    amount: new anchor_1.BN(data.amount),
                };
            case 'AuctionWrapUp':
                return {
                    ...baseEvent,
                    type: 'AuctionWrapUp',
                    amount: new anchor_1.BN(data.amount),
                    lamportsRecovered: new anchor_1.BN(data.lamports_recovered),
                    protocolProfit: new anchor_1.BN(data.protocol_profit),
                };
            case 'AuctionFinalized':
                return {
                    ...baseEvent,
                    type: 'AuctionFinalized',
                    totalVolume: new anchor_1.BN(data.total_volume),
                };
            case 'TokensDistributed':
                return {
                    ...baseEvent,
                    type: 'TokensDistributed',
                    recipient: new web3_js_1.PublicKey(data.recipient),
                    slotId: new anchor_1.BN(data.slot_id),
                    amount: new anchor_1.BN(data.amount),
                };
            case 'TokensBurned':
                return {
                    ...baseEvent,
                    type: 'TokensBurned',
                    amount: new anchor_1.BN(data.amount),
                };
            case 'TokensClaimed':
                return {
                    ...baseEvent,
                    type: 'TokensClaimed',
                    recipient: new web3_js_1.PublicKey(data.recipient),
                    slotId: new anchor_1.BN(data.slot_id),
                    amount: new anchor_1.BN(data.amount),
                };
            case 'RefundClaimed':
                return {
                    ...baseEvent,
                    type: 'RefundClaimed',
                    recipient: new web3_js_1.PublicKey(data.recipient),
                    slotId: new anchor_1.BN(data.slot_id),
                    amount: new anchor_1.BN(data.amount),
                };
            case 'UnclaimedFundsSwept':
                return {
                    ...baseEvent,
                    type: 'UnclaimedFundsSwept',
                    treasuryAuthority: new web3_js_1.PublicKey(data.treasury_authority),
                    tokensBurned: new anchor_1.BN(data.tokens_burned),
                    solTransferred: new anchor_1.BN(data.sol_transferred),
                };
            case 'SlotMarkedClaimable':
                return {
                    ...baseEvent,
                    type: 'SlotMarkedClaimable',
                    slotId: new anchor_1.BN(data.slot_id),
                    bidder: new web3_js_1.PublicKey(data.bidder),
                    amount: new anchor_1.BN(data.amount),
                    claimType: data.claim_type,
                };
            case 'AuctionTypeDecided':
                return {
                    ...baseEvent,
                    type: 'AuctionTypeDecided',
                    isSuccessful: data.is_successful,
                    totalRaised: new anchor_1.BN(data.total_raised),
                    minimumRequired: new anchor_1.BN(data.minimum_required),
                };
            case 'SolTransferredToTreasury':
                return {
                    ...baseEvent,
                    type: 'SolTransferredToTreasury',
                    amount: new anchor_1.BN(data.amount),
                };
            case 'ProtocolFeesDistributed':
                return {
                    ...baseEvent,
                    type: 'ProtocolFeesDistributed',
                    feeReceiver: new web3_js_1.PublicKey(data.fee_receiver),
                    amount: new anchor_1.BN(data.amount),
                };
            default:
                console.log(`⚠️  Unhandled event type: ${data.type}`);
                return null;
        }
    }
    /**
     * Notify all relevant event listeners
     */
    notifyEventListeners(event) {
        // Notify listeners for all events
        const allEventsKey = this.getEventKey({});
        if (this.eventListeners.has(allEventsKey)) {
            this.eventListeners.get(allEventsKey).forEach(callback => {
                try {
                    callback(event);
                }
                catch (error) {
                    console.error('❌ Error in event callback:', error);
                }
            });
        }
        // Notify listeners for specific auction
        const auctionKey = this.getEventKey({ auctionData: event.auction });
        if (this.eventListeners.has(auctionKey)) {
            this.eventListeners.get(auctionKey).forEach(callback => {
                try {
                    callback(event);
                }
                catch (error) {
                    console.error('❌ Error in event callback:', error);
                }
            });
        }
        // Notify listeners for specific event type
        const eventTypeKey = this.getEventKey({ eventType: event.type });
        if (this.eventListeners.has(eventTypeKey)) {
            this.eventListeners.get(eventTypeKey).forEach(callback => {
                try {
                    callback(event);
                }
                catch (error) {
                    console.error('❌ Error in event callback:', error);
                }
            });
        }
    }
    /**
     * Generate key for event listener map
     */
    getEventKey(filter) {
        const parts = [];
        if (filter.auctionData) {
            parts.push(`auction:${filter.auctionData.toBase58()}`);
        }
        if (filter.eventType) {
            parts.push(`type:${filter.eventType}`);
        }
        return parts.length > 0 ? parts.join('|') : 'all';
    }
    // ========================================
    // HELPER METHODS FOR EXTERNAL APPS
    // ========================================
    /**
     * Check if event listening is available
     */
    get hasEventListening() {
        return true; // Event listening is always available in this SDK
    }
    /**
     * Check if onAllAuctionEvents method exists
     */
    get hasOnAllAuctionEvents() {
        return typeof this.onAllAuctionEvents === 'function';
    }
    /**
     * Check if onAuctionEvent method exists
     */
    get hasOnAuctionEvent() {
        return typeof this.onAuctionEvent === 'function';
    }
    /**
     * Check if onEventType method exists
     */
    get hasOnEventType() {
        return typeof this.onEventType === 'function';
    }
    /**
     * Get SDK capabilities info
     */
    get capabilities() {
        return {
            hasEventListening: this.hasEventListening,
            hasOnAllAuctionEvents: this.hasOnAllAuctionEvents,
            hasOnAuctionEvent: this.hasOnAuctionEvent,
            hasOnEventType: this.hasOnEventType,
            hasProgram: !!this.program,
            programId: this.program.programId.toBase58(),
        };
    }
}
exports.BomboclatSDK = BomboclatSDK;
// Export helper to create SDK instance
function createBomboclatSDK(connection, wallet, idl) {
    return new BomboclatSDK(connection, wallet, idl);
}
// Alias for backward compatibility
function createHeatSDK(connection, wallet, idl) {
    return new BomboclatSDK(connection, wallet, idl);
}
