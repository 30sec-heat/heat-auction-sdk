"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBidAmount = validateBidAmount;
exports.validateOutbidAmount = validateOutbidAmount;
exports.validateSlotId = validateSlotId;
const constants_1 = require("../constants");
const calculations_1 = require("./calculations");
// Validation functions
function validateBidAmount(bidAmount) {
    if (bidAmount.lt(constants_1.CONSTANTS.MIN_BID_AMOUNT)) {
        throw new Error(`Bid amount must be at least ${constants_1.CONSTANTS.MIN_BID_AMOUNT.toString()} lamports`);
    }
    if (bidAmount.gt(constants_1.CONSTANTS.MAX_BID_AMOUNT)) {
        throw new Error(`Bid amount cannot exceed ${constants_1.CONSTANTS.MAX_BID_AMOUNT.toString()} lamports`);
    }
}
async function validateOutbidAmount(currentAmount, bidAmount) {
    if (!currentAmount) {
        throw new Error('No existing bid to outbid');
    }
    if (bidAmount.lte(currentAmount)) {
        throw new Error(`Bid amount must be greater than current bid of ${currentAmount.toString()} lamports`);
    }
    const minNextBid = (0, calculations_1.calculateMinNextBid)(currentAmount);
    if (bidAmount.lt(minNextBid)) {
        throw new Error(`Bid amount must be at least ${minNextBid.toString()} lamports to meet minimum increment`);
    }
}
function validateSlotId(slotId) {
    if (slotId < 1 || slotId > constants_1.CONSTANTS.MAX_SLOTS) {
        throw new Error(`Slot ID must be between 1 and ${constants_1.CONSTANTS.MAX_SLOTS}`);
    }
}
