"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionDuration = exports.CONSTANTS = exports.TOKEN_METADATA_PROGRAM_ID = exports.TREASURY_AUTHORITY_PUBKEY = exports.FEE_RECEIVER_PUBKEY = exports.PROGRAM_ID = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_2 = require("@solana/web3.js");
// Program IDs
exports.PROGRAM_ID = new web3_js_1.PublicKey(process.env.PROGRAM_ID || '9Ky8dWgozFkGQJBUfrgEy3zxbMmXdX5XYCV6FL4VUXjC');
exports.FEE_RECEIVER_PUBKEY = new web3_js_1.PublicKey(process.env.FEE_RECEIVER_PUBKEY || '9YVR7r8XrS9zQUTWR2jNfWMSMHVyoQus2ro5fTMwaDqA');
exports.TREASURY_AUTHORITY_PUBKEY = new web3_js_1.PublicKey(process.env.TREASURY_AUTHORITY_PUBKEY || 'GLqrCSL5wMvZjpPUbhcGKSBjfk1HzxRo3N81mr2adPvt');
// For v3 of mpl-token-metadata
exports.TOKEN_METADATA_PROGRAM_ID = new web3_js_1.PublicKey(process.env.TOKEN_METADATA_PROGRAM_ID || 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
// Program Constants
exports.CONSTANTS = {
    REQUIRED_MAX_SUPPLY: new anchor_1.BN(760000000).mul(new anchor_1.BN(10).pow(new anchor_1.BN(9))), // 760M tokens
    MIN_ACTIVE_BID_SOL: new anchor_1.BN(0.001 * web3_js_2.LAMPORTS_PER_SOL),
    MAX_BID_INCREMENT: new anchor_1.BN(5000 * web3_js_2.LAMPORTS_PER_SOL),
    BID_FEE: new anchor_1.BN(0.00001 * web3_js_2.LAMPORTS_PER_SOL),
    MAX_SLOTS: 300,
    MIN_BID_AMOUNT: new anchor_1.BN(0.0001 * web3_js_2.LAMPORTS_PER_SOL),
    MAX_BID_AMOUNT: new anchor_1.BN(5000 * web3_js_2.LAMPORTS_PER_SOL),
    MIN_BID_INCREMENT: new anchor_1.BN(0.01 * web3_js_2.LAMPORTS_PER_SOL),
    TOKEN_DECIMALS: 9,
    MIN_SUCCESSFUL_RAISE: new anchor_1.BN(50 * web3_js_2.LAMPORTS_PER_SOL),
    PROTOCOL_FEE_BPS: new anchor_1.BN(50), // 0.5%
    BASIS_POINTS_DIVISOR: new anchor_1.BN(10000),
    MAX_AUCTION_EXTENSION: new anchor_1.BN(3600), // 1 hour
    CREATION_FEE: new anchor_1.BN(0.005 * web3_js_2.LAMPORTS_PER_SOL),
    CLAIM_PERIOD_DAYS: 1095, // 3 years
};
// Auction Duration Options
var AuctionDuration;
(function (AuctionDuration) {
    AuctionDuration[AuctionDuration["ONE_MINUTE"] = 0] = "ONE_MINUTE";
    AuctionDuration[AuctionDuration["ONE_HOUR"] = 1] = "ONE_HOUR";
    AuctionDuration[AuctionDuration["ONE_DAY"] = 2] = "ONE_DAY";
})(AuctionDuration || (exports.AuctionDuration = AuctionDuration = {}));
