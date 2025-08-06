"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const sdk_1 = require("../sdk");
const anchor_1 = require("@coral-xyz/anchor");
const nodewallet_1 = __importDefault(require("@coral-xyz/anchor/dist/cjs/nodewallet"));
const fs_1 = __importDefault(require("fs"));
require("dotenv/config");
// Example: Place bids on auction slots
async function placeBidExample() {
    console.log('💰 Placing bid example...\n');
    // Setup connection and wallet
    const connection = (0, sdk_1.createConnection)();
    const walletKeypair = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs_1.default.readFileSync(process.env.SOLANA_KEYPAIR_PATH || `${require('os').homedir()}/.config/solana/id.json`, 'utf8'))));
    const wallet = new nodewallet_1.default(walletKeypair);
    // Load IDL
    const idl = JSON.parse(fs_1.default.readFileSync('./src/idl/bomboclat.json', 'utf8'));
    const sdk = new sdk_1.BomboclatSDK(connection, wallet, idl);
    // Auction details (replace with actual auction)
    const auctionData = new web3_js_1.PublicKey('YOUR_AUCTION_DATA_PUBKEY');
    const tokenMint = new web3_js_1.PublicKey('YOUR_TOKEN_MINT_PUBKEY');
    const slotId = 1;
    const bidAmount = new anchor_1.BN(100000000); // 0.1 SOL
    try {
        // Smart bid - automatically determines if first bid or outbid
        const result = await sdk.bidding.placeBid(auctionData, tokenMint, slotId, bidAmount);
        console.log('✅ Bid placed successfully!');
        console.log('  - Transaction:', result.tx);
        console.log('  - Action:', result.action);
        console.log('  - Amount:', bidAmount.toNumber() / 1e9, 'SOL');
    }
    catch (error) {
        console.error('❌ Failed to place bid:', error.message);
    }
}
placeBidExample().catch(console.error);
