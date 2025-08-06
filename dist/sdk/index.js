"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BomboclatSDK = void 0;
exports.createBomboclatSDK = createBomboclatSDK;
exports.createHeatSDK = createHeatSDK;
const anchor_1 = require("@coral-xyz/anchor");
// Import modules
const auction_1 = require("./modules/auction");
const bidding_1 = require("./modules/bidding");
const treasury_1 = require("./modules/treasury");
const claims_1 = require("./modules/claims");
const queries_1 = require("./modules/queries");
const events_1 = require("./events");
// Import types
const types = __importStar(require("./types"));
// Import constants
const constants = __importStar(require("./constants"));
// Import utilities
const utils = __importStar(require("./utils"));
// Import errors
const errors = __importStar(require("./errors"));
class BomboclatSDK {
    constructor(connection, wallet, idl) {
        // Event listening - backward compatibility (initialized in constructor)
        // Utility methods - backward compatibility
        this.getTokenAmountForSlot = utils.getTokenAmountForSlot;
        this.calculateRefundAmount = utils.calculateRefundAmount;
        this.isAuctionSuccessful = utils.isAuctionSuccessful;
        this.getAuctionDurationSeconds = utils.getAuctionDurationSeconds;
        // Validation methods - backward compatibility
        this.validateBidAmount = utils.validateBidAmount;
        this.validateOutbidAmount = utils.validateOutbidAmount;
        this.validateSlotId = utils.validateSlotId;
        // PDA methods - backward compatibility
        this.getAuctionEscrowPDA = utils.getAuctionEscrowPDA;
        this.getSlotBidPDA = utils.getSlotBidPDA;
        this.getMetadataPDA = utils.getMetadataPDA;
        // Helper methods - backward compatibility
        this.formatSolAmount = utils.formatSolAmount;
        this.formatTokenAmount = utils.formatTokenAmount;
        this.sleep = utils.sleep;
        this.retry = utils.retry;
        this.connection = connection;
        this.wallet = wallet;
        // Initialize program
        const provider = new anchor_1.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
        this.program = new anchor_1.Program(idl, provider);
        // Initialize modules
        this.auction = new auction_1.AuctionModule(this.program, connection, wallet);
        this.bidding = new bidding_1.BiddingModule(this.program, connection, wallet);
        this.treasury = new treasury_1.TreasuryModule(this.program, connection, wallet);
        this.claims = new claims_1.ClaimsModule(this.program, connection, wallet);
        this.queries = new queries_1.QueriesModule(this.program, connection, wallet);
        this.events = new events_1.EventSystem(this.program, connection);
    }
    // Expose some methods at the root level for backward compatibility
    async getAuctionState(auctionData) {
        return this.queries.getAuctionState(auctionData);
    }
    async getAuctionData(auctionData) {
        return this.queries.getAuctionData(auctionData);
    }
    async getSlotBid(auctionData, slotId) {
        return this.queries.getSlotBid(auctionData, slotId);
    }
    async getAllActiveAuctions() {
        return this.queries.getAllActiveAuctions();
    }
    async getSlotBidsForAuction(auctionData) {
        return this.queries.getSlotBidsForAuction(auctionData);
    }
    // Smart bidding - backward compatibility
    async placeBid(auctionData, mint, slotId, bidAmount) {
        return this.bidding.placeBid(auctionData, mint, slotId, bidAmount);
    }
    // Hostile takeover - backward compatibility
    async hostileTakeover(auctionData, mint, targetBidder, outbidIncrement) {
        return this.bidding.hostileTakeover(auctionData, mint, targetBidder, outbidIncrement);
    }
}
exports.BomboclatSDK = BomboclatSDK;
// Expose types and constants for external use
BomboclatSDK.types = types;
BomboclatSDK.constants = constants;
BomboclatSDK.utils = utils;
BomboclatSDK.errors = errors;
// Export helper to create SDK instance
function createBomboclatSDK(connection, wallet, idl) {
    return new BomboclatSDK(connection, wallet, idl);
}
// Alias for backward compatibility
function createHeatSDK(connection, wallet, idl) {
    return new BomboclatSDK(connection, wallet, idl);
}
// Export all types, constants, utils, and errors
__exportStar(require("./types"), exports);
__exportStar(require("./constants"), exports);
__exportStar(require("./utils"), exports);
__exportStar(require("./errors"), exports);
