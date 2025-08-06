"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenAmountForSlot = getTokenAmountForSlot;
exports.calculateMinNextBid = calculateMinNextBid;
exports.calculateRefundAmount = calculateRefundAmount;
exports.isAuctionSuccessful = isAuctionSuccessful;
exports.getAuctionDurationSeconds = getAuctionDurationSeconds;
const anchor_1 = require("@coral-xyz/anchor");
const constants_1 = require("../constants");
const constants_2 = require("../constants");
// Calculation functions
function getTokenAmountForSlot(slotId) {
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
function calculateMinNextBid(currentBidAmount) {
    return currentBidAmount.add(constants_1.CONSTANTS.MIN_BID_INCREMENT);
}
function calculateRefundAmount(bidAmount) {
    const protocolFee = bidAmount
        .mul(constants_1.CONSTANTS.PROTOCOL_FEE_BPS)
        .div(constants_1.CONSTANTS.BASIS_POINTS_DIVISOR);
    const refundAmount = bidAmount.sub(protocolFee);
    return { refundAmount, protocolFee };
}
function isAuctionSuccessful(totalVolume) {
    return totalVolume.gte(constants_1.CONSTANTS.MIN_SUCCESSFUL_RAISE);
}
function getAuctionDurationSeconds(durationOption) {
    switch (durationOption) {
        case constants_2.AuctionDuration.ONE_MINUTE:
            return 60;
        case constants_2.AuctionDuration.ONE_HOUR:
            return 3600;
        case constants_2.AuctionDuration.ONE_DAY:
            return 86400;
        default:
            throw new Error('Invalid auction duration');
    }
}
