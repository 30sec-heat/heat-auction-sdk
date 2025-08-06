"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuctionEscrowPDA = getAuctionEscrowPDA;
exports.getSlotBidPDA = getSlotBidPDA;
exports.getMetadataPDA = getMetadataPDA;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const constants_1 = require("../constants");
// Helper functions for PDA derivation
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
