"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const sdk_1 = require("../sdk");
const nodewallet_1 = __importDefault(require("@coral-xyz/anchor/dist/cjs/nodewallet"));
const fs_1 = __importDefault(require("fs"));
require("dotenv/config");
// Example: Listen to auction events
async function eventListeningExample() {
    console.log('📡 Event listening example...\n');
    // Setup connection and wallet
    const connection = (0, sdk_1.createConnection)();
    const walletKeypair = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs_1.default.readFileSync(process.env.SOLANA_KEYPAIR_PATH || `${require('os').homedir()}/.config/solana/id.json`, 'utf8'))));
    const wallet = new nodewallet_1.default(walletKeypair);
    // Load IDL
    const idl = JSON.parse(fs_1.default.readFileSync('./src/idl/bomboclat.json', 'utf8'));
    const sdk = new sdk_1.BomboclatSDK(connection, wallet, idl);
    try {
        // Start event listening
        await sdk.events.startEventListening();
        console.log('✅ Event listening started');
        // Subscribe to specific event types
        const bidPlacedSub = sdk.events.onAuctionEvent({ eventType: 'BidPlaced' }, (event) => {
            console.log('💰 Bid placed event:');
            console.log('  - Auction:', event.auction);
            if (event.type === 'BidPlaced') {
                console.log('  - Bidder:', event.bidder);
                console.log('  - Slot:', event.slotId);
                console.log('  - Amount:', event.amount);
            }
        });
        const auctionEndedSub = sdk.events.onAuctionEvent({ eventType: 'AuctionEnded' }, (event) => {
            console.log('🏁 Auction ended event:');
            console.log('  - Auction:', event.auction);
            console.log('  - Token mint:', event.tokenMint);
        });
        // Subscribe to all events
        const allEventsSub = sdk.events.onAllAuctionEvents((event) => {
            console.log(`📢 All events: ${event.type} for auction ${event.auction}`);
        });
        console.log('✅ Event subscriptions created');
        console.log('  - Listening for BidPlaced events');
        console.log('  - Listening for AuctionEnded events');
        console.log('  - Listening for all events');
        // Keep listening for 30 seconds
        console.log('\n⏰ Listening for events for 30 seconds...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        // Clean up
        sdk.events.offAuctionEvent(bidPlacedSub);
        sdk.events.offAuctionEvent(auctionEndedSub);
        sdk.events.offAuctionEvent(allEventsSub);
        await sdk.events.stopEventListening();
        console.log('✅ Event listening stopped');
    }
    catch (error) {
        console.error('❌ Failed to setup event listening:', error.message);
    }
}
eventListeningExample().catch(console.error);
