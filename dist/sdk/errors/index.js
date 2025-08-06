"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventListeningError = exports.InsufficientFundsError = exports.SlotNotFoundError = exports.InvalidBidAmountError = exports.AuctionNotFoundError = exports.BomboclatSDKError = void 0;
// Custom error classes
class BomboclatSDKError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'BomboclatSDKError';
    }
}
exports.BomboclatSDKError = BomboclatSDKError;
class AuctionNotFoundError extends BomboclatSDKError {
    constructor(auctionData) {
        super(`Auction not found: ${auctionData}`, 'AUCTION_NOT_FOUND');
        this.name = 'AuctionNotFoundError';
    }
}
exports.AuctionNotFoundError = AuctionNotFoundError;
class InvalidBidAmountError extends BomboclatSDKError {
    constructor(amount, min, max) {
        super(`Invalid bid amount: ${amount}. Must be between ${min} and ${max}`, 'INVALID_BID_AMOUNT');
        this.name = 'InvalidBidAmountError';
    }
}
exports.InvalidBidAmountError = InvalidBidAmountError;
class SlotNotFoundError extends BomboclatSDKError {
    constructor(slotId) {
        super(`Slot not found: ${slotId}`, 'SLOT_NOT_FOUND');
        this.name = 'SlotNotFoundError';
    }
}
exports.SlotNotFoundError = SlotNotFoundError;
class InsufficientFundsError extends BomboclatSDKError {
    constructor(required, available) {
        super(`Insufficient funds. Required: ${required}, Available: ${available}`, 'INSUFFICIENT_FUNDS');
        this.name = 'InsufficientFundsError';
    }
}
exports.InsufficientFundsError = InsufficientFundsError;
class EventListeningError extends BomboclatSDKError {
    constructor(message) {
        super(`Event listening error: ${message}`, 'EVENT_LISTENING_ERROR');
        this.name = 'EventListeningError';
    }
}
exports.EventListeningError = EventListeningError;
