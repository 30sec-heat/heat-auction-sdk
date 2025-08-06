"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueriesModule = void 0;
const anchor_1 = require("@coral-xyz/anchor");
const base_1 = require("./base");
const constants_1 = require("../constants");
const pda_1 = require("../utils/pda");
class QueriesModule extends base_1.BaseModule {
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
        const [slotBidPDA] = (0, pda_1.getSlotBidPDA)(auctionData, slotId);
        const account = await this.program.account.slotBid.fetch(slotBidPDA);
        return account;
    }
    async getEscrow(auctionData) {
        const [escrowPDA] = (0, pda_1.getAuctionEscrowPDA)(auctionData);
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
    async getSlotsByBidder(auctionData, bidder) {
        const slotBids = await this.getSlotBidsForAuction(auctionData);
        return slotBids
            .filter(slot => slot.account.currentBidder &&
            slot.account.currentBidder.equals(bidder) &&
            slot.account.currentAmount.gt(new anchor_1.BN(0)))
            .map(slot => ({
            slotId: slot.account.slotId.toNumber(),
            currentAmount: slot.account.currentAmount,
            minNextBid: slot.account.currentAmount.add(new anchor_1.BN(0.01 * 1e9)) // 0.01 SOL minimum increment
        }))
            .sort((a, b) => a.slotId - b.slotId);
    }
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
}
exports.QueriesModule = QueriesModule;
