"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const sdk_1 = require("../sdk");
const nodewallet_1 = __importDefault(require("@coral-xyz/anchor/dist/cjs/nodewallet"));
const fs_1 = __importDefault(require("fs"));
// Example: Query auction state and slot information
async function queryAuctionExample() {
    console.log('📊 Querying auction example...\n');
    // Setup connection and wallet
    const connection = new web3_js_1.Connection('http://127.0.0.1:8899', 'confirmed');
    const walletKeypair = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs_1.default.readFileSync(process.env.SOLANA_KEYPAIR_PATH || `${require('os').homedir()}/.config/solana/id.json`, 'utf8'))));
    const wallet = new nodewallet_1.default(walletKeypair);
    // Load IDL
    const idl = JSON.parse(fs_1.default.readFileSync('./src/idl/bomboclat.json', 'utf8'));
    const sdk = new sdk_1.BomboclatSDK(connection, wallet, idl);
    // Auction details (replace with actual auction)
    const auctionData = new web3_js_1.PublicKey('YOUR_AUCTION_DATA_PUBKEY');
    const slotId = 1;
    try {
        // Get auction state
        const auctionState = await sdk.queries.getAuctionState(auctionData);
        console.log('🏗️ Auction State:');
        console.log('  - Token mint:', auctionState.tokenMint.toBase58());
        console.log('  - Creator:', auctionState.creator.toBase58());
        console.log('  - Is active:', auctionState.isActive);
        console.log('  - Start time:', new Date(auctionState.startTime.toNumber() * 1000).toISOString());
        console.log('  - End time:', new Date(auctionState.endTime.toNumber() * 1000).toISOString());
        // Get current bid info for a slot
        const bidInfo = await sdk.bidding.getCurrentBidInfo(auctionData, slotId);
        console.log(`\n💰 Slot ${slotId} Bid Info:`);
        console.log('  - Has bid:', bidInfo.hasBid);
        if (bidInfo.hasBid) {
            console.log('  - Current bidder:', bidInfo.currentBidder?.toBase58());
            console.log('  - Current amount:', bidInfo.currentAmount?.toNumber() / 1e9, 'SOL');
            console.log('  - Min next bid:', bidInfo.minNextBid?.toNumber() / 1e9, 'SOL');
        }
        // Check if current user is highest bidder
        const isHighest = await sdk.bidding.isCurrentUserHighestBidder(auctionData, slotId);
        console.log(`\n👤 Are you highest bidder on slot ${slotId}:`, isHighest);
    }
    catch (error) {
        console.error('❌ Failed to query auction:', error.message);
    }
}
queryAuctionExample().catch(console.error);
